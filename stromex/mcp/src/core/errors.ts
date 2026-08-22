/**
 * The error vocabulary of the whole server.
 *
 * Two rules govern this file:
 *
 *   1. Every failure a caller can act on gets a stable `code`. Callers —
 *      including a language model reading a tool result — should branch on
 *      the code, never on the message text.
 *   2. Every error carries a `remediation`: one sentence saying what the
 *      operator or the model should do next. An error that cannot say what
 *      to do next is not finished being written.
 */

/** Stable, machine-readable failure codes. Additive only — never renumber. */
export type StromexErrorCode =
  // Configuration and credentials
  | 'CONFIG_INVALID'
  | 'CREDENTIAL_MISSING'
  | 'CREDENTIAL_REJECTED'
  | 'CREDENTIAL_INSUFFICIENT_SCOPE'
  // Policy and authority
  | 'POLICY_APPROVAL_REQUIRED'
  | 'POLICY_APPROVAL_INVALID'
  | 'POLICY_APPROVAL_EXPIRED'
  | 'POLICY_FORBIDDEN'
  | 'POLICY_PROTECTED_RESOURCE'
  | 'POLICY_SPEND_LIMIT'
  // Input
  | 'INPUT_INVALID'
  | 'PRECONDITION_FAILED'
  // Provider transport / semantics
  | 'PROVIDER_HTTP_ERROR'
  | 'PROVIDER_RATE_LIMITED'
  | 'PROVIDER_UNAVAILABLE'
  | 'PROVIDER_TIMEOUT'
  | 'PROVIDER_NOT_FOUND'
  | 'PROVIDER_CONFLICT'
  | 'PROVIDER_UNSUPPORTED'
  // Local execution
  | 'COMMAND_FAILED'
  | 'IO_ERROR'
  | 'AUDIT_CHAIN_BROKEN'
  | 'WORKFLOW_STEP_FAILED'
  | 'INTERNAL';

export interface StromexErrorOptions {
  code: StromexErrorCode;
  message: string;
  /** One sentence: what to do about it. Required — see the file header. */
  remediation: string;
  provider?: string;
  operation?: string;
  httpStatus?: number;
  /** Whether an identical retry could plausibly succeed later. */
  retryable?: boolean;
  /** Seconds the provider asked us to wait, when it said so. */
  retryAfterSeconds?: number;
  /** Provider payload, already redacted by the caller. */
  details?: unknown;
  cause?: unknown;
}

export class StromexError extends Error {
  readonly code: StromexErrorCode;
  readonly remediation: string;
  readonly provider?: string;
  readonly operation?: string;
  readonly httpStatus?: number;
  readonly retryable: boolean;
  readonly retryAfterSeconds?: number;
  readonly details?: unknown;

  constructor(options: StromexErrorOptions) {
    super(options.message, options.cause === undefined ? undefined : { cause: options.cause });
    this.name = 'StromexError';
    this.code = options.code;
    this.remediation = options.remediation;
    this.provider = options.provider;
    this.operation = options.operation;
    this.httpStatus = options.httpStatus;
    this.retryable = options.retryable ?? false;
    this.retryAfterSeconds = options.retryAfterSeconds;
    this.details = options.details;
  }

  /** The wire shape embedded in a failing tool result. */
  toJSON(): Record<string, unknown> {
    const out: Record<string, unknown> = {
      code: this.code,
      message: this.message,
      remediation: this.remediation,
      retryable: this.retryable,
    };
    if (this.provider) out['provider'] = this.provider;
    if (this.operation) out['operation'] = this.operation;
    if (this.httpStatus !== undefined) out['httpStatus'] = this.httpStatus;
    if (this.retryAfterSeconds !== undefined) out['retryAfterSeconds'] = this.retryAfterSeconds;
    if (this.details !== undefined) out['details'] = this.details;
    return out;
  }
}

/**
 * Normalises anything thrown into a StromexError.
 *
 * Deliberately does not guess a remediation for unknown throwables: an
 * invented remediation is worse than an honest "this was not anticipated".
 */
export function toStromexError(thrown: unknown, context?: { provider?: string; operation?: string }): StromexError {
  if (thrown instanceof StromexError) return thrown;

  const message = thrown instanceof Error ? thrown.message : String(thrown);
  const isAbort = thrown instanceof Error && (thrown.name === 'AbortError' || thrown.name === 'TimeoutError');

  if (isAbort) {
    return new StromexError({
      code: 'PROVIDER_TIMEOUT',
      message: `Request aborted: ${message}`,
      remediation: 'Retry; if it recurs, raise the per-provider timeout in configuration or check provider status.',
      retryable: true,
      provider: context?.provider,
      operation: context?.operation,
      cause: thrown,
    });
  }

  // Undici surfaces connection failures as TypeError('fetch failed') with a cause.
  if (thrown instanceof TypeError && /fetch failed|network|ENOTFOUND|ECONNREFUSED|EAI_AGAIN/i.test(message)) {
    return new StromexError({
      code: 'PROVIDER_UNAVAILABLE',
      message: `Network failure reaching the provider: ${message}`,
      remediation: 'Check outbound network access and provider status, then retry.',
      retryable: true,
      provider: context?.provider,
      operation: context?.operation,
      cause: thrown,
    });
  }

  return new StromexError({
    code: 'INTERNAL',
    message,
    remediation: 'This failure was not anticipated by the server. Report it with the audit record id.',
    provider: context?.provider,
    operation: context?.operation,
    cause: thrown,
  });
}

/** Maps an HTTP status onto the closest provider error code. */
export function codeForHttpStatus(status: number): StromexErrorCode {
  if (status === 401 || status === 403) return 'CREDENTIAL_REJECTED';
  if (status === 404) return 'PROVIDER_NOT_FOUND';
  if (status === 409) return 'PROVIDER_CONFLICT';
  if (status === 412 || status === 422 || status === 400) return 'INPUT_INVALID';
  if (status === 429) return 'PROVIDER_RATE_LIMITED';
  if (status >= 500) return 'PROVIDER_UNAVAILABLE';
  return 'PROVIDER_HTTP_ERROR';
}
