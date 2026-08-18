/**
 * Value-based redaction.
 *
 * Key-name redaction ("hide anything called `token`") fails the moment a
 * secret travels under a name nobody predicted — inside a connection URI,
 * inside a provider's echo of the request, inside a stack trace. So this
 * module redacts by *value*: every secret the process resolves is
 * registered here, and every string that leaves the process through a log,
 * an error or a tool result is scanned for those exact values.
 *
 * The registry holds the plaintext because it must, in order to match it.
 * It is process-local, never serialised, and never iterated by anything
 * other than `redactText`.
 */

const registered = new Set<string>();

/**
 * Values shorter than this are not registered: redacting a 4-character
 * value would blank out unrelated text and make output useless.
 */
const MIN_REDACTABLE_LENGTH = 8;

export const REDACTION_PLACEHOLDER = '«redacted»';

export function registerSecretValue(value: string | undefined | null): void {
  if (!value) return;
  const trimmed = value.trim();
  if (trimmed.length < MIN_REDACTABLE_LENGTH) return;
  registered.add(trimmed);

  // Postgres/MySQL style URIs carry the password as one component. Register
  // that component separately so a leaked password is caught even when the
  // full URI never appears verbatim.
  try {
    const url = new URL(trimmed);
    if (url.password && url.password.length >= MIN_REDACTABLE_LENGTH) registered.add(url.password);
  } catch {
    /* not a URL; nothing further to extract */
  }
}

export function registeredSecretCount(): number {
  return registered.size;
}

/** Test-only. Clearing the registry in production would un-redact live output. */
export function __resetSecretRegistryForTests(): void {
  registered.clear();
}

export function redactText(text: string): string {
  if (!text) return text;
  let out = text;
  for (const secret of registered) {
    if (out.includes(secret)) out = out.split(secret).join(REDACTION_PLACEHOLDER);
  }
  return out;
}

/**
 * Deep-redacts an arbitrary value. Strings are scanned; keys are preserved
 * so the shape of the payload stays legible. Cycles are broken rather than
 * thrown on, because this runs inside error paths where throwing again
 * would lose the original failure.
 */
export function redactValue<T>(value: T, seen = new WeakSet<object>()): T {
  if (typeof value === 'string') return redactText(value) as unknown as T;
  if (value === null || typeof value !== 'object') return value;

  const asObject = value as unknown as object;
  if (seen.has(asObject)) return '[circular]' as unknown as T;
  seen.add(asObject);

  if (Array.isArray(value)) {
    return value.map((entry) => redactValue(entry, seen)) as unknown as T;
  }
  if (value instanceof Error) {
    return { name: value.name, message: redactText(value.message) } as unknown as T;
  }

  const out: Record<string, unknown> = {};
  for (const [key, entry] of Object.entries(value as Record<string, unknown>)) {
    out[key] = redactValue(entry, seen);
  }
  return out as unknown as T;
}
