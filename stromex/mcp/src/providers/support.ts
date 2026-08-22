/**
 * Shared scaffolding for provider tool modules.
 *
 * Keeps every adapter's tool table short enough to read in one sitting,
 * which is the only way the authority class assigned to each tool gets
 * reviewed rather than skimmed (`SEB §16.12`).
 */

import { StromexError } from '../core/errors.js';
import type { ToolContext } from '../core/registry.js';

/** Fetches a provider client from the call context, or explains its absence. */
export function clientFor<T>(ctx: ToolContext, provider: string): T {
  const client = ctx.providers[provider];
  if (!client) {
    throw new StromexError({
      code: 'CREDENTIAL_MISSING',
      message: `The ${provider} provider is not configured on this server instance.`,
      remediation: `Set the ${provider} credentials and restart the server. Run \`stromex-mcp doctor\` to see what is missing.`,
      provider,
    });
  }
  return client as T;
}

/**
 * A dry run returns the plan instead of performing it.
 *
 * Every mutating handler starts with this, so `dryRun` is never a flag a
 * handler can forget to honour: the plan describes exactly what would
 * happen, in the same envelope shape as the real result.
 */
export function plan(summary: string, request: unknown): { summary: string; data: unknown } {
  return { summary, data: { wouldSend: request } };
}

/** Trims a provider list response to the fields an operator actually reads. */
export function pick<T extends Record<string, unknown>>(value: unknown, keys: readonly string[]): Partial<T> {
  if (!value || typeof value !== 'object') return {};
  const source = value as Record<string, unknown>;
  const out: Record<string, unknown> = {};
  for (const key of keys) if (key in source) out[key] = source[key];
  return out as Partial<T>;
}

export function pickAll<T extends Record<string, unknown>>(values: unknown, keys: readonly string[]): Array<Partial<T>> {
  if (!Array.isArray(values)) return [];
  return values.map((entry) => pick<T>(entry, keys));
}

/** `count` plus the trimmed rows — the shape every list tool returns. */
export function listPayload<T extends Record<string, unknown>>(
  label: string,
  values: unknown,
  keys: readonly string[],
): { summary: string; data: { count: number; items: Array<Partial<T>> } } {
  const items = pickAll<T>(values, keys);
  return { summary: `${items.length} ${label}`, data: { count: items.length, items } };
}
