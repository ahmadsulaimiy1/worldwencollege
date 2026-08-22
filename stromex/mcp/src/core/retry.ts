/**
 * Retry policy.
 *
 * Two decisions are separated on purpose:
 *
 *   `shouldRetry` — is this failure the kind that a later identical call
 *                   could survive?
 *   `delayFor`    — how long to wait, given the attempt number and
 *                   anything the provider told us.
 *
 * Backoff uses *full jitter* (`random(0, base * 2^attempt)`) rather than
 * fixed exponential backoff. When several tools fail against the same
 * provider at the same moment — which is exactly what happens during a
 * provider incident — fixed backoff re-synchronises them into a thundering
 * herd on every wave. Full jitter spreads them out.
 */

export interface RetryPolicy {
  maxAttempts: number;
  baseDelayMs: number;
  maxDelayMs: number;
  /** Upper bound honoured from a `Retry-After` header, so a hostile or
   *  mistaken header cannot park a tool call for an hour. */
  maxRetryAfterMs: number;
}

export const DEFAULT_RETRY_POLICY: RetryPolicy = {
  maxAttempts: 4,
  baseDelayMs: 300,
  maxDelayMs: 20_000,
  maxRetryAfterMs: 60_000,
};

export const RETRYABLE_STATUSES = new Set([408, 409, 425, 429, 500, 502, 503, 504]);

/** HTTP methods that are safe to replay without a caller opting in. */
export const IDEMPOTENT_METHODS = new Set(['GET', 'HEAD', 'OPTIONS', 'PUT', 'DELETE']);

export interface RetryDecisionInput {
  attempt: number;
  policy: RetryPolicy;
  method: string;
  /** Caller's override — set for a POST that the provider defines as idempotent. */
  idempotent?: boolean;
  status?: number;
  /** True for transport-level failures (DNS, connection reset, timeout). */
  networkFailure?: boolean;
}

export function shouldRetry(input: RetryDecisionInput): boolean {
  if (input.attempt >= input.policy.maxAttempts) return false;

  const methodIsReplayable = input.idempotent ?? IDEMPOTENT_METHODS.has(input.method.toUpperCase());

  if (input.networkFailure) {
    // A request that never reached the server is safe to replay whatever
    // its method: nothing happened. A request that timed out *may* have
    // been applied, so a non-idempotent one is not replayed.
    return methodIsReplayable;
  }
  if (input.status === undefined) return false;
  // 409 is retried only where the provider defines the write as idempotent;
  // otherwise a conflict is a real conflict and replaying makes it worse.
  if (input.status === 409 && !(input.idempotent ?? false)) return false;
  if (!RETRYABLE_STATUSES.has(input.status)) return false;
  // 429 is always worth retrying — it is a scheduling instruction, not a failure.
  if (input.status === 429) return true;
  return methodIsReplayable;
}

export interface DelayInput {
  attempt: number;
  policy: RetryPolicy;
  retryAfterSeconds?: number;
  /** Injected in tests. */
  random?: () => number;
}

export function delayFor(input: DelayInput): number {
  const random = input.random ?? Math.random;
  if (input.retryAfterSeconds !== undefined && Number.isFinite(input.retryAfterSeconds)) {
    return Math.min(Math.max(0, input.retryAfterSeconds) * 1000, input.policy.maxRetryAfterMs);
  }
  const ceiling = Math.min(input.policy.baseDelayMs * 2 ** Math.max(0, input.attempt - 1), input.policy.maxDelayMs);
  return Math.floor(random() * ceiling);
}

/** Parses `Retry-After`, which is either seconds or an HTTP date. */
export function parseRetryAfter(header: string | null | undefined, now: Date = new Date()): number | undefined {
  if (!header) return undefined;
  const asNumber = Number(header.trim());
  if (Number.isFinite(asNumber)) return Math.max(0, asNumber);
  const asDate = Date.parse(header);
  if (Number.isNaN(asDate)) return undefined;
  return Math.max(0, (asDate - now.getTime()) / 1000);
}

export function sleep(ms: number, signal?: AbortSignal): Promise<void> {
  if (ms <= 0) return Promise.resolve();
  return new Promise((resolve, reject) => {
    const timer = setTimeout(() => {
      signal?.removeEventListener('abort', onAbort);
      resolve();
    }, ms);
    const onAbort = () => {
      clearTimeout(timer);
      reject(signal?.reason ?? new Error('aborted'));
    };
    if (signal?.aborted) { onAbort(); return; }
    signal?.addEventListener('abort', onAbort, { once: true });
  });
}
