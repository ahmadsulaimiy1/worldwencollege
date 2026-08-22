/**
 * The one HTTP client every provider adapter uses.
 *
 * Centralising it is what makes the reliability and security guarantees in
 * docs/architecture.md true of *all seven* providers rather than of
 * whichever adapter was written most carefully. Timeouts, retry, jitter,
 * rate limiting, circuit breaking, redaction and error normalisation all
 * live here, once.
 *
 * `fetchImpl` is injectable, and that is the seam the entire
 * mock-provider test suite hangs from: a provider adapter under test talks
 * to a scripted fetch, so the adapter's real request construction and real
 * response handling are exercised without a network or a credential.
 */

import { StromexError, codeForHttpStatus, toStromexError } from './errors.js';
import { Logger, silentLogger } from './logger.js';
import { redactValue } from './redact.js';
import { CircuitBreaker, TokenBucket } from './ratelimit.js';
import {
  DEFAULT_RETRY_POLICY,
  type RetryPolicy,
  delayFor,
  parseRetryAfter,
  shouldRetry,
  sleep,
} from './retry.js';

export type FetchLike = (input: string, init: RequestInit) => Promise<Response>;

export interface MultipartPart {
  name: string;
  value: string | Uint8Array;
  filename?: string;
  contentType?: string;
}

export type HttpBody =
  | { kind: 'none' }
  | { kind: 'json'; value: unknown }
  | { kind: 'form'; value: Record<string, string> }
  | { kind: 'multipart'; parts: MultipartPart[] }
  | { kind: 'text'; value: string; contentType?: string };

export interface HttpRequestSpec {
  method: string;
  /** Path appended to `baseUrl`, or an absolute URL. */
  path: string;
  query?: Record<string, string | number | boolean | undefined | null | Array<string | number>>;
  headers?: Record<string, string>;
  body?: HttpBody;
  /** Label used in logs, audit records and errors. */
  operation: string;
  /** Set true for a POST the provider defines as safe to replay. */
  idempotent?: boolean;
  timeoutMs?: number;
  /** Statuses to return rather than throw — e.g. treat 404 as "absent". */
  tolerateStatuses?: number[];
  /** Expected response shape. `binary` returns bytes; `none` discards. */
  expect?: 'json' | 'text' | 'binary' | 'none';
  signal?: AbortSignal;
}

export interface HttpResponse<T = unknown> {
  status: number;
  headers: Record<string, string>;
  body: T;
  /** Attempts actually made, including the successful one. */
  attempts: number;
  durationMs: number;
}

export interface HttpClientOptions {
  provider: string;
  baseUrl: string;
  /** Called per request, so a rotated credential is picked up immediately. */
  authHeaders: () => Record<string, string>;
  logger?: Logger;
  retryPolicy?: RetryPolicy;
  timeoutMs?: number;
  rateLimit?: { refillPerSecond: number; capacity: number };
  breaker?: { failureThreshold: number; cooldownMs: number };
  fetchImpl?: FetchLike;
  userAgent?: string;
  defaultHeaders?: Record<string, string>;
  /**
   * Turns a provider's error payload into a one-line message. Every
   * provider spells failure differently and a generic "HTTP 400" helps
   * nobody, least of all a model trying to correct its own arguments.
   */
  errorMessage?: (status: number, body: unknown) => string | undefined;
  random?: () => number;
  now?: () => number;
}

export class HttpClient {
  readonly provider: string;
  private readonly baseUrl: string;
  private readonly authHeaders: () => Record<string, string>;
  private readonly logger: Logger;
  private readonly retryPolicy: RetryPolicy;
  private readonly timeoutMs: number;
  private readonly bucket: TokenBucket | undefined;
  private readonly breaker: CircuitBreaker;
  private readonly fetchImpl: FetchLike;
  private readonly userAgent: string;
  private readonly defaultHeaders: Record<string, string>;
  private readonly errorMessage: ((status: number, body: unknown) => string | undefined) | undefined;
  private readonly random: () => number;

  constructor(options: HttpClientOptions) {
    this.provider = options.provider;
    this.baseUrl = options.baseUrl.replace(/\/+$/, '');
    this.authHeaders = options.authHeaders;
    this.logger = (options.logger ?? silentLogger).child({ provider: options.provider });
    this.retryPolicy = options.retryPolicy ?? DEFAULT_RETRY_POLICY;
    this.timeoutMs = options.timeoutMs ?? 30_000;
    this.bucket = options.rateLimit
      ? new TokenBucket({ ...options.rateLimit, now: options.now })
      : undefined;
    this.breaker = new CircuitBreaker({
      failureThreshold: options.breaker?.failureThreshold ?? 5,
      cooldownMs: options.breaker?.cooldownMs ?? 30_000,
      now: options.now,
    });
    this.fetchImpl = options.fetchImpl ?? ((input, init) => fetch(input, init));
    this.userAgent = options.userAgent ?? 'StromeX-Enterprise-MCP/1.0';
    this.defaultHeaders = options.defaultHeaders ?? {};
    this.errorMessage = options.errorMessage;
    this.random = options.random ?? Math.random;
  }

  circuitState(): string {
    return this.breaker.state();
  }

  async request<T = unknown>(spec: HttpRequestSpec): Promise<HttpResponse<T>> {
    const started = Date.now();
    const url = this.buildUrl(spec);
    let attempt = 0;
    let lastError: StromexError | undefined;

    while (attempt < this.retryPolicy.maxAttempts) {
      attempt += 1;

      if (!this.breaker.allowRequest()) {
        throw new StromexError({
          code: 'PROVIDER_UNAVAILABLE',
          message: `The circuit breaker for ${this.provider} is open after repeated failures; the request was not sent.`,
          remediation: `Wait ${Math.ceil(this.breaker.retryInMs() / 1000)}s for the breaker to half-open, or check the provider's status page.`,
          provider: this.provider,
          operation: spec.operation,
          retryable: true,
          retryAfterSeconds: Math.ceil(this.breaker.retryInMs() / 1000),
        });
      }

      const waitMs = this.bucket?.reserve() ?? 0;
      if (waitMs > 0) {
        this.logger.debug('rate limit: waiting for a token', { operation: spec.operation, waitMs });
        await sleep(waitMs, spec.signal);
      }

      let response: Response;
      try {
        response = await this.send(url, spec);
      } catch (thrown) {
        const error = toStromexError(thrown, { provider: this.provider, operation: spec.operation });
        this.breaker.recordFailure();
        lastError = error;
        if (!shouldRetry({ attempt, policy: this.retryPolicy, method: spec.method, idempotent: spec.idempotent, networkFailure: true })) {
          throw error;
        }
        const delay = delayFor({ attempt, policy: this.retryPolicy, random: this.random });
        this.logger.warn('transport failure; retrying', { operation: spec.operation, attempt, delay, code: error.code });
        await sleep(delay, spec.signal);
        continue;
      }

      const headers = headersToObject(response.headers);

      if (response.ok || spec.tolerateStatuses?.includes(response.status)) {
        this.breaker.recordSuccess();
        const body = await this.readBody<T>(response, spec);
        return { status: response.status, headers, body, attempts: attempt, durationMs: Date.now() - started };
      }

      const errorBody = await this.readErrorBody(response);
      const retryAfterSeconds = parseRetryAfter(response.headers.get('retry-after'));
      const error = this.httpError(response.status, errorBody, spec, retryAfterSeconds);

      // 4xx other than 429 means the provider is healthy and we are wrong;
      // counting it would trip the breaker on a working provider.
      if (response.status >= 500 || response.status === 429) this.breaker.recordFailure();
      else this.breaker.recordSuccess();

      lastError = error;
      if (!shouldRetry({ attempt, policy: this.retryPolicy, method: spec.method, idempotent: spec.idempotent, status: response.status })) {
        throw error;
      }
      const delay = delayFor({ attempt, policy: this.retryPolicy, retryAfterSeconds, random: this.random });
      this.logger.warn('retryable provider response', { operation: spec.operation, attempt, status: response.status, delay });
      await sleep(delay, spec.signal);
    }

    throw lastError ?? new StromexError({
      code: 'INTERNAL',
      message: `Retry loop for ${spec.operation} exited without a result.`,
      remediation: 'Report this with the audit record id; it indicates a bug in the HTTP client.',
      provider: this.provider,
      operation: spec.operation,
    });
  }

  /** Exposed so adapters can show an operator the exact URL a dry run would call. */
  buildUrl(spec: Pick<HttpRequestSpec, 'path' | 'query'>): string {
    const base = /^https?:\/\//i.test(spec.path)
      ? spec.path
      : `${this.baseUrl}/${spec.path.replace(/^\/+/, '')}`;
    const url = new URL(base);
    for (const [key, value] of Object.entries(spec.query ?? {})) {
      if (value === undefined || value === null) continue;
      if (Array.isArray(value)) {
        for (const entry of value) url.searchParams.append(key, String(entry));
      } else {
        url.searchParams.set(key, String(value));
      }
    }
    return url.toString();
  }

  private async send(url: string, spec: HttpRequestSpec): Promise<Response> {
    const controller = new AbortController();
    const timeoutMs = spec.timeoutMs ?? this.timeoutMs;
    const timer = setTimeout(() => controller.abort(new DOMException(`Timed out after ${timeoutMs}ms`, 'TimeoutError')), timeoutMs);
    const onOuterAbort = () => controller.abort(spec.signal?.reason);
    spec.signal?.addEventListener('abort', onOuterAbort, { once: true });

    try {
      const { headers, body } = this.encodeBody(spec);
      return await this.fetchImpl(url, {
        method: spec.method.toUpperCase(),
        headers: {
          'user-agent': this.userAgent,
          accept: 'application/json',
          ...this.defaultHeaders,
          ...this.authHeaders(),
          ...headers,
          ...(spec.headers ?? {}),
        },
        body: body as RequestInit['body'],
        signal: controller.signal,
      });
    } finally {
      clearTimeout(timer);
      spec.signal?.removeEventListener('abort', onOuterAbort);
    }
  }

  private encodeBody(spec: HttpRequestSpec): { headers: Record<string, string>; body: RequestInit['body'] } {
    const body = spec.body ?? { kind: 'none' as const };
    switch (body.kind) {
      case 'none':
        return { headers: {}, body: undefined };
      case 'json':
        return { headers: { 'content-type': 'application/json' }, body: JSON.stringify(body.value) };
      case 'text':
        return { headers: { 'content-type': body.contentType ?? 'text/plain' }, body: body.value };
      case 'form':
        return {
          headers: { 'content-type': 'application/x-www-form-urlencoded' },
          body: new URLSearchParams(body.value).toString(),
        };
      case 'multipart': {
        // FormData sets its own boundary; setting content-type by hand here
        // would produce a boundary mismatch and a confusing 400.
        const form = new FormData();
        for (const part of body.parts) {
          if (typeof part.value === 'string' && !part.filename) {
            form.append(part.name, part.value);
          } else {
            const bytes = typeof part.value === 'string' ? new TextEncoder().encode(part.value) : part.value;
            const blobPart = new Uint8Array(bytes);
            form.append(
              part.name,
              new Blob([blobPart], { type: part.contentType ?? 'application/octet-stream' }),
              part.filename ?? part.name,
            );
          }
        }
        return { headers: {}, body: form };
      }
    }
  }

  private async readBody<T>(response: Response, spec: HttpRequestSpec): Promise<T> {
    const expect = spec.expect ?? 'json';
    if (expect === 'none' || response.status === 204) return undefined as T;
    if (expect === 'binary') return new Uint8Array(await response.arrayBuffer()) as unknown as T;
    const text = await response.text();
    if (expect === 'text') return text as unknown as T;
    if (!text.trim()) return undefined as T;
    try {
      return JSON.parse(text) as T;
    } catch {
      // A provider that promises JSON and sends HTML is nearly always a
      // proxy or an auth wall in front of it. Say so.
      throw new StromexError({
        code: 'PROVIDER_HTTP_ERROR',
        message: `${this.provider} returned a ${response.status} that is not JSON (first 200 characters: ${JSON.stringify(text.slice(0, 200))}).`,
        remediation: 'Check for a proxy, captive portal or authentication wall between this host and the provider.',
        provider: this.provider,
        operation: spec.operation,
        httpStatus: response.status,
      });
    }
  }

  private async readErrorBody(response: Response): Promise<unknown> {
    const text = await response.text().catch(() => '');
    if (!text.trim()) return undefined;
    try {
      return JSON.parse(text);
    } catch {
      return text.slice(0, 2000);
    }
  }

  private httpError(status: number, body: unknown, spec: HttpRequestSpec, retryAfterSeconds?: number): StromexError {
    const providerMessage = this.errorMessage?.(status, body);
    const code = codeForHttpStatus(status);
    return new StromexError({
      code: status === 429 ? 'PROVIDER_RATE_LIMITED' : code,
      message: `${this.provider} ${spec.operation} failed with HTTP ${status}${providerMessage ? `: ${providerMessage}` : ''}`,
      remediation: remediationFor(code, this.provider),
      provider: this.provider,
      operation: spec.operation,
      httpStatus: status,
      retryable: status === 429 || status >= 500,
      retryAfterSeconds,
      details: redactValue(body),
    });
  }
}

function headersToObject(headers: Headers): Record<string, string> {
  const out: Record<string, string> = {};
  headers.forEach((value, key) => {
    // Never surface a credential a provider chose to echo back.
    if (key.toLowerCase() === 'set-cookie' || key.toLowerCase() === 'authorization') return;
    out[key] = value;
  });
  return out;
}

function remediationFor(code: ReturnType<typeof codeForHttpStatus>, provider: string): string {
  switch (code) {
    case 'CREDENTIAL_REJECTED':
      return `The ${provider} credential was rejected or lacks the required scope. Run \`stromex-mcp doctor\` and re-check the token's permissions against mcp/docs/installation.md.`;
    case 'PROVIDER_NOT_FOUND':
      return 'The resource does not exist under this account. Verify the identifier, and that the credential is scoped to the right account or organisation.';
    case 'PROVIDER_CONFLICT':
      return 'The resource already exists or is in a conflicting state. Read it first, then update rather than create.';
    case 'INPUT_INVALID':
      return 'The provider rejected the arguments. Read `details` for the field it named and call again with corrected arguments.';
    case 'PROVIDER_RATE_LIMITED':
      return 'Rate limited. The client already backs off; if this persists, lower the configured request rate for this provider.';
    case 'PROVIDER_UNAVAILABLE':
      return `${provider} returned a server error. Retry later and check the provider's status page.`;
    default:
      return 'Read `details` for the provider payload and correct the request.';
  }
}
