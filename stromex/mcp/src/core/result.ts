/**
 * One result envelope for every tool in the server.
 *
 * Every tool declares the same `outputSchema`, so a client — or a model —
 * learns the shape once and can then read the result of any of the
 * hundred-odd tools without special-casing. The envelope always says which
 * tool ran, whether it actually did anything (`dryRun`), how long it took,
 * and which audit record it produced.
 *
 * The `content` array carries a human-readable mirror of the same data,
 * because the specification asks a tool returning structured content to
 * also return the serialised JSON in a text block for clients that do not
 * read `structuredContent`.
 */

import { z } from 'zod';
import type { StromexError } from './errors.js';
import { redactValue } from './redact.js';

export const envelopeShape = {
  ok: z.boolean().describe('True when the operation completed as asked.'),
  tool: z.string(),
  provider: z.string(),
  operation: z.string().describe('The provider operation the tool performed.'),
  operationClass: z.enum(['read', 'write', 'protected']),
  dryRun: z.boolean().describe('True when nothing was sent to the provider.'),
  requestId: z.string(),
  durationMs: z.number(),
  summary: z.string().describe('One line stating what happened, suitable for a report.'),
  data: z.unknown().optional().describe('The provider payload, normalised and redacted.'),
  warnings: z.array(z.string()).optional(),
  error: z
    .object({
      code: z.string(),
      message: z.string(),
      remediation: z.string(),
      retryable: z.boolean(),
      httpStatus: z.number().optional(),
      details: z.unknown().optional(),
    })
    .optional(),
  approval: z
    .object({
      approvalId: z.string(),
      confirmationPhrase: z.string(),
      expiresAt: z.string(),
      description: z.string(),
      howToApprove: z.string(),
    })
    .optional()
    .describe('Present when a protected operation needs a human grant before it will run.'),
  auditSeq: z.number().optional().describe('Sequence number of the audit record for this call.'),
} as const;

export type Envelope = {
  ok: boolean;
  tool: string;
  provider: string;
  operation: string;
  operationClass: 'read' | 'write' | 'protected';
  dryRun: boolean;
  requestId: string;
  durationMs: number;
  summary: string;
  data?: unknown;
  warnings?: string[];
  error?: {
    code: string;
    message: string;
    remediation: string;
    retryable: boolean;
    httpStatus?: number;
    details?: unknown;
  };
  approval?: {
    approvalId: string;
    confirmationPhrase: string;
    expiresAt: string;
    description: string;
    howToApprove: string;
  };
  auditSeq?: number;
};

export interface CallToolResultShape {
  content: Array<{ type: 'text'; text: string }>;
  structuredContent: Record<string, unknown>;
  isError?: boolean;
}

export function toCallToolResult(envelope: Envelope): CallToolResultShape {
  const redacted = redactValue(envelope) as Envelope;
  const text = [
    redacted.ok ? `✓ ${redacted.summary}` : `✗ ${redacted.summary}`,
    redacted.dryRun ? '(dry run — nothing was sent to the provider)' : '',
    redacted.warnings?.length ? `Warnings:\n${redacted.warnings.map((w) => `  · ${w}`).join('\n')}` : '',
    redacted.error ? `\n${redacted.error.code}: ${redacted.error.message}\n→ ${redacted.error.remediation}` : '',
    redacted.approval
      ? `\nApproval required.\n  id:     ${redacted.approval.approvalId}\n  phrase: ${redacted.approval.confirmationPhrase}\n  ${redacted.approval.howToApprove}`
      : '',
    '\n' + JSON.stringify(redacted, null, 2),
  ]
    .filter(Boolean)
    .join('\n');

  return {
    content: [{ type: 'text', text }],
    structuredContent: redacted as unknown as Record<string, unknown>,
    ...(redacted.ok ? {} : { isError: true }),
  };
}

export function errorEnvelope(base: Omit<Envelope, 'ok' | 'error' | 'summary'>, error: StromexError, summary?: string): Envelope {
  return {
    ...base,
    ok: false,
    summary: summary ?? `${base.tool} failed: ${error.message}`,
    error: {
      code: error.code,
      message: error.message,
      remediation: error.remediation,
      retryable: error.retryable,
      ...(error.httpStatus === undefined ? {} : { httpStatus: error.httpStatus }),
      ...(error.details === undefined ? {} : { details: error.details }),
    },
  };
}
