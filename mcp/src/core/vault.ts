/**
 * The handle vault.
 *
 * A problem this server has to solve honestly: provisioning a database
 * and then configuring an application with its connection string is a
 * completely ordinary operation, and the connection string is a
 * credential. `SEB §26.7` forbids a credential appearing in a tool
 * result, so a tool cannot simply return one — and yet the value has to
 * get from one provider to another.
 *
 * The answer is a handle. `neon.connection.get` puts the URI in this
 * vault and returns an opaque, short-lived handle plus the *non-secret*
 * components (host, database, role). Any tool that accepts a secret value
 * also accepts `valueFromHandle`, and resolves it here. The plaintext
 * therefore travels provider → this process → provider, and never through
 * the model, the transcript, the audit log or a log line.
 *
 * Properties that make it safe rather than merely convenient:
 *
 *   · **In-process only.** Nothing is written to disk. A restart empties it.
 *   · **Short-lived.** Handles expire; an expired handle is an error that
 *     says so, not a silent empty string.
 *   · **Registered for redaction** the moment it is stored, so even if the
 *     value later appears in a provider's echo of a request, it is
 *     redacted on the way out.
 *   · **Single-purpose.** There is no tool that reads a handle back as
 *     text. The only consumer is a provider adapter.
 */

import { randomUUID } from 'node:crypto';
import { StromexError } from './errors.js';
import { registerSecretValue } from './redact.js';

export interface VaultEntry {
  handle: string;
  label: string;
  createdAt: string;
  expiresAt: string;
  /** Where the value came from, for the audit record. */
  origin: string;
}

export interface HandleVaultOptions {
  ttlSeconds?: number;
  now?: () => Date;
  maxEntries?: number;
}

export class HandleVault {
  private readonly entries = new Map<string, { value: string; meta: VaultEntry }>();
  private readonly ttlSeconds: number;
  private readonly maxEntries: number;
  private readonly now: () => Date;

  constructor(options: HandleVaultOptions = {}) {
    this.ttlSeconds = options.ttlSeconds ?? 900;
    this.maxEntries = options.maxEntries ?? 64;
    this.now = options.now ?? (() => new Date());
  }

  store(input: { value: string; label: string; origin: string }): VaultEntry {
    this.prune();
    if (this.entries.size >= this.maxEntries) {
      // Rather than evicting silently — which would make a workflow fail
      // much later, somewhere unrelated — refuse and say why.
      throw new StromexError({
        code: 'PRECONDITION_FAILED',
        message: `The handle vault is full (${this.maxEntries} live handles).`,
        remediation: 'Consume the handles you already hold, or wait for them to expire. Handles are short-lived by design.',
      });
    }
    registerSecretValue(input.value);
    const now = this.now();
    const meta: VaultEntry = {
      handle: `vh_${randomUUID().replaceAll('-', '').slice(0, 24)}`,
      label: input.label,
      origin: input.origin,
      createdAt: now.toISOString(),
      expiresAt: new Date(now.getTime() + this.ttlSeconds * 1000).toISOString(),
    };
    this.entries.set(meta.handle, { value: input.value, meta });
    return meta;
  }

  /** Resolves a handle to its plaintext. The only way a value comes out. */
  reveal(handle: string): string {
    this.prune();
    const entry = this.entries.get(handle);
    if (!entry) {
      throw new StromexError({
        code: 'PRECONDITION_FAILED',
        message: `No live handle ${handle}. Handles are in-process, single-server and short-lived.`,
        remediation: 'Obtain a fresh handle from the tool that issues it, then use it in the same session and within its lifetime.',
      });
    }
    return entry.value;
  }

  describe(handle: string): VaultEntry | undefined {
    this.prune();
    return this.entries.get(handle)?.meta;
  }

  list(): VaultEntry[] {
    this.prune();
    return [...this.entries.values()].map((entry) => entry.meta);
  }

  /** Consumes a handle: reveals it and removes it. */
  take(handle: string): string {
    const value = this.reveal(handle);
    this.entries.delete(handle);
    return value;
  }

  private prune(): void {
    const nowMs = this.now().getTime();
    for (const [handle, entry] of this.entries) {
      if (Date.parse(entry.meta.expiresAt) <= nowMs) this.entries.delete(handle);
    }
  }
}

/**
 * Resolves the `value` / `valueFromHandle` pair every secret-accepting
 * tool takes. Exactly one must be supplied.
 */
export function resolveSecretArgument(
  args: { value?: string; valueFromHandle?: string },
  vault: HandleVault,
): string {
  const hasValue = typeof args.value === 'string' && args.value.length > 0;
  const hasHandle = typeof args.valueFromHandle === 'string' && args.valueFromHandle.length > 0;
  if (hasValue === hasHandle) {
    throw new StromexError({
      code: 'INPUT_INVALID',
      message: 'Supply exactly one of `value` or `valueFromHandle`.',
      remediation: 'Pass the literal secret as `value`, or a handle issued by a tool such as neon.connection.get as `valueFromHandle`.',
    });
  }
  return hasValue ? args.value! : vault.reveal(args.valueFromHandle!);
}
