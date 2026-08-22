/**
 * The scripted provider.
 *
 * `SEB §23.3`: a stand-in must be no more permissive than the thing it
 * stands in for. So this one does not simply return whatever the test
 * wants — it enforces the real API's contract:
 *
 *   · An unmatched request is a **failure**, not an empty response. A
 *     test whose adapter calls the wrong URL should fail on the wrong
 *     URL, not four assertions later.
 *   · Method, path AND query are matched. A GET matched against a POST
 *     route would let a real method bug through.
 *   · The Authorization header must be present, in the shape the real
 *     provider requires, or the route answers 401 exactly as the provider
 *     would.
 *   · Each route records the request it received, so a test can assert on
 *     what was actually sent rather than on what it hoped was sent.
 */

import type { FetchLike } from '../../core/http.js';

export interface RecordedRequest {
  method: string;
  url: string;
  path: string;
  query: Record<string, string>;
  headers: Record<string, string>;
  body?: unknown;
  rawBody?: string;
}

export interface RouteSpec {
  method: string;
  /** Path only; the query is matched separately. */
  path: string;
  /** Optional exact query subset that must be present. */
  query?: Record<string, string>;
  status?: number;
  /** Static body, or a function of the recorded request. */
  body?: unknown | ((request: RecordedRequest) => unknown);
  headers?: Record<string, string>;
  /** Answer differently on each call — used to exercise retry paths. */
  sequence?: Array<{ status: number; body?: unknown; headers?: Record<string, string> }>;
}

export interface ScriptedProviderOptions {
  routes: RouteSpec[];
  /** Header that must be present and non-empty, e.g. 'authorization'. */
  requireHeader?: string;
  /** Substring the required header must start with, e.g. 'Bearer '. */
  requireHeaderPrefix?: string;
}

export interface ScriptedProvider {
  fetch: FetchLike;
  requests: RecordedRequest[];
  /** All requests that hit a given path. */
  for(path: string): RecordedRequest[];
  /** Fails if any route was never called — catches a step silently skipped. */
  assertAllRoutesUsed(): void;
}

export function scriptedProvider(options: ScriptedProviderOptions): ScriptedProvider {
  const requests: RecordedRequest[] = [];
  const callCounts = new Map<RouteSpec, number>();

  const fetchImpl: FetchLike = async (input, init) => {
    const url = new URL(input);
    const method = (init.method ?? 'GET').toUpperCase();
    const headers = normaliseHeaders(init.headers);
    const rawBody = typeof init.body === 'string' ? init.body : undefined;

    const recorded: RecordedRequest = {
      method,
      url: url.toString(),
      path: url.pathname,
      query: Object.fromEntries(url.searchParams.entries()),
      headers,
      rawBody,
      body: rawBody ? tryJson(rawBody) : await readNonStringBody(init.body),
    };
    requests.push(recorded);

    if (options.requireHeader) {
      const value = headers[options.requireHeader.toLowerCase()];
      const prefix = options.requireHeaderPrefix ?? '';
      // The credential must be present AND non-empty after its prefix. A
      // provider rejects `Authorization: Bearer ` with 401; a stand-in that
      // accepts it is more permissive than the thing it stands in for.
      if (!value || !value.startsWith(prefix) || value.slice(prefix.length).trim().length === 0) {
        return jsonResponse(401, { message: 'Bad credentials' });
      }
    }

    const route = options.routes.find(
      (candidate) =>
        candidate.method.toUpperCase() === method &&
        candidate.path === url.pathname &&
        Object.entries(candidate.query ?? {}).every(([key, expected]) => url.searchParams.get(key) === expected),
    );

    if (!route) {
      // Deliberately loud. An unmatched request means the adapter called
      // something the test never described, which is exactly the class of
      // defect a mock that returns {} would hide.
      throw new Error(
        `scripted provider: no route for ${method} ${url.pathname}${url.search}\n` +
          `known routes:\n${options.routes.map((r) => `  ${r.method} ${r.path}`).join('\n')}`,
      );
    }

    const callIndex = callCounts.get(route) ?? 0;
    callCounts.set(route, callIndex + 1);

    if (route.sequence) {
      const step = route.sequence[Math.min(callIndex, route.sequence.length - 1)]!;
      return jsonResponse(step.status, step.body, step.headers);
    }

    const body = typeof route.body === 'function' ? (route.body as (r: RecordedRequest) => unknown)(recorded) : route.body;
    return jsonResponse(route.status ?? 200, body, route.headers);
  };

  return {
    fetch: fetchImpl,
    requests,
    for: (path) => requests.filter((request) => request.path === path),
    assertAllRoutesUsed() {
      const unused = options.routes.filter((route) => !callCounts.has(route));
      if (unused.length > 0) {
        throw new Error(`scripted provider: these routes were never called: ${unused.map((r) => `${r.method} ${r.path}`).join(', ')}`);
      }
    },
  };
}

/** 204, 205 and 304 may not carry a body — the platform enforces it, so the stand-in must too. */
const NULL_BODY_STATUSES = new Set([204, 205, 304]);

function jsonResponse(status: number, body: unknown, headers: Record<string, string> = {}): Response {
  if (NULL_BODY_STATUSES.has(status)) {
    return new Response(null, { status, headers: { ...headers } });
  }
  const text = body === undefined ? '' : typeof body === 'string' ? body : JSON.stringify(body);
  return new Response(text, {
    status,
    headers: { 'content-type': 'application/json', ...headers },
  });
}

function normaliseHeaders(headers: RequestInit['headers']): Record<string, string> {
  const out: Record<string, string> = {};
  if (!headers) return out;
  if (headers instanceof Headers) {
    headers.forEach((value, key) => {
      out[key.toLowerCase()] = value;
    });
    return out;
  }
  if (Array.isArray(headers)) {
    for (const [key, value] of headers) out[String(key).toLowerCase()] = String(value);
    return out;
  }
  for (const [key, value] of Object.entries(headers)) out[key.toLowerCase()] = String(value);
  return out;
}

function tryJson(raw: string): unknown {
  try {
    return JSON.parse(raw);
  } catch {
    return raw;
  }
}

/**
 * Multipart parts are read as TEXT rather than summarised, because a test
 * that cannot see what was in the metadata part cannot assert that the
 * entry module was named correctly — and that is exactly the kind of
 * detail a Worker upload gets wrong silently.
 */
async function readNonStringBody(body: unknown): Promise<unknown> {
  if (body === undefined || body === null) return undefined;
  if (typeof FormData !== 'undefined' && body instanceof FormData) {
    const parts: Record<string, string> = {};
    for (const [key, value] of body.entries()) {
      parts[key] = typeof value === 'string' ? value : await value.text();
    }
    return { multipart: parts };
  }
  return '«non-string body»';
}
