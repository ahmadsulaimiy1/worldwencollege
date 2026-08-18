/**
 * A token bucket per provider, plus a circuit breaker per provider.
 *
 * The rate limiter exists so that a workflow fanning out over, say, forty
 * DNS records does not earn a 429 that would then be retried into a
 * second 429. The circuit breaker exists so that when a provider is
 * genuinely down, the fortieth call fails in a millisecond with a clear
 * error instead of after four backoff waits.
 */

export interface TokenBucketOptions {
  /** Sustained rate. */
  refillPerSecond: number;
  /** Burst size. */
  capacity: number;
  now?: () => number;
}

export class TokenBucket {
  private tokens: number;
  private lastRefill: number;
  private readonly refillPerSecond: number;
  private readonly capacity: number;
  private readonly now: () => number;

  constructor(options: TokenBucketOptions) {
    this.refillPerSecond = options.refillPerSecond;
    this.capacity = options.capacity;
    this.now = options.now ?? (() => Date.now());
    this.tokens = options.capacity;
    this.lastRefill = this.now();
  }

  /** Milliseconds the caller must wait before a token is available. */
  reserve(): number {
    this.refill();
    if (this.tokens >= 1) {
      this.tokens -= 1;
      return 0;
    }
    const deficit = 1 - this.tokens;
    return Math.ceil((deficit / this.refillPerSecond) * 1000);
  }

  /** Test/observability accessor. */
  available(): number {
    this.refill();
    return this.tokens;
  }

  private refill(): void {
    const nowMs = this.now();
    const elapsedSeconds = (nowMs - this.lastRefill) / 1000;
    if (elapsedSeconds <= 0) return;
    this.tokens = Math.min(this.capacity, this.tokens + elapsedSeconds * this.refillPerSecond);
    this.lastRefill = nowMs;
  }
}

export type CircuitState = 'closed' | 'open' | 'half-open';

export interface CircuitBreakerOptions {
  /** Consecutive failures that trip the breaker. */
  failureThreshold: number;
  /** How long the breaker stays open before allowing one probe. */
  cooldownMs: number;
  now?: () => number;
}

export class CircuitBreaker {
  private consecutiveFailures = 0;
  private openedAt: number | undefined;
  private probeInFlight = false;
  private readonly failureThreshold: number;
  private readonly cooldownMs: number;
  private readonly now: () => number;

  constructor(options: CircuitBreakerOptions) {
    this.failureThreshold = options.failureThreshold;
    this.cooldownMs = options.cooldownMs;
    this.now = options.now ?? (() => Date.now());
  }

  state(): CircuitState {
    if (this.openedAt === undefined) return 'closed';
    if (this.now() - this.openedAt >= this.cooldownMs) return 'half-open';
    return 'open';
  }

  /** Milliseconds until the breaker would allow a call, or 0 if it does now. */
  retryInMs(): number {
    if (this.openedAt === undefined) return 0;
    return Math.max(0, this.cooldownMs - (this.now() - this.openedAt));
  }

  allowRequest(): boolean {
    const state = this.state();
    if (state === 'closed') return true;
    if (state === 'open') return false;
    // half-open: exactly one probe at a time.
    if (this.probeInFlight) return false;
    this.probeInFlight = true;
    return true;
  }

  recordSuccess(): void {
    this.consecutiveFailures = 0;
    this.openedAt = undefined;
    this.probeInFlight = false;
  }

  /**
   * Only *infrastructure* failures should reach here. A 404 means the
   * provider is healthy and the resource is not there; counting it would
   * trip the breaker on a perfectly working provider.
   */
  recordFailure(): void {
    this.probeInFlight = false;
    this.consecutiveFailures += 1;
    if (this.consecutiveFailures >= this.failureThreshold) this.openedAt = this.now();
  }
}
