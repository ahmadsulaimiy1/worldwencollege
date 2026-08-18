/**
 * The tool registry — the gate every tool call passes through.
 *
 * A tool author writes a schema and a handler. They do not get to decide
 * whether the policy engine runs, whether an audit record is written,
 * whether a pre-image is captured, or whether output is redacted. That is
 * the point: the guarantees in mcp/docs/blueprint.md § 2 are true of every
 * tool because no tool can opt out of them.
 *
 * Order of operations, and it matters (`SEB §9.4`):
 *
 *   1. validate arguments
 *   2. resolve the resource and any declared purchase
 *   3. POLICY      — a refusal here is terminal and is still audited
 *   4. APPROVAL    — elicit from the client, or require an out-of-band grant
 *   5. JOURNAL     — capture the pre-image before anything irreversible
 *   6. handler     — the first side effect happens here and nowhere earlier
 *   7. AUDIT       — always, success or failure, before the result returns
 *   8. envelope    — redacted on the way out
 */

import { randomUUID } from 'node:crypto';
import { z } from 'zod';
import type { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import type { ToolAnnotations } from '@modelcontextprotocol/sdk/types.js';
import { ApprovalStore, digestArguments } from './approval.js';
import type { AuditLog, AuditOutcome } from './audit.js';
import { StromexError, toStromexError } from './errors.js';
import type { RecoveryJournal } from './journal.js';
import type { Logger } from './logger.js';
import type { OperationClass, PolicyEngine } from './policy.js';
import { redactValue } from './redact.js';
import type { HandleVault } from './vault.js';
import { type Envelope, envelopeShape, errorEnvelope, toCallToolResult } from './result.js';

export type RawShape = Record<string, z.ZodType>;
export type ArgsOf<S extends RawShape> = { [K in keyof S]: z.infer<S[K]> };

/** What a handler returns. The registry turns it into the envelope. */
export interface ToolPayload {
  /** One line stating what happened, suitable for a deployment report. */
  summary: string;
  data?: unknown;
  warnings?: string[];
}

export interface ElicitFunction {
  (request: {
    message: string;
    requestedSchema: {
      type: 'object';
      properties: Record<string, unknown>;
      required?: string[];
    };
  }): Promise<{ action: 'accept' | 'decline' | 'cancel'; content?: Record<string, unknown> }>;
}

export interface ToolContext {
  logger: Logger;
  policy: PolicyEngine;
  audit: AuditLog;
  approvals: ApprovalStore;
  journal: RecoveryJournal;
  actor: string;
  requestId: string;
  /** Present only when the connected client declared the elicitation capability. */
  elicit?: ElicitFunction;
  /** Set when the call is part of a workflow run. */
  workflowRunId?: string;
  /**
   * True when the caller asked for a dry run. Handlers read it from here
   * rather than from their arguments: `dryRun` is the registry's control
   * argument, not part of any tool's own schema, and stripping it before
   * validation is what keeps every tool's schema honest about what it
   * actually accepts.
   */
  dryRun: boolean;
  now: () => Date;
  /** Provider clients, resolved lazily by the server. */
  providers: Record<string, unknown>;
  /** In-process store for credentials moving between providers. */
  vault: HandleVault;
}

export interface ToolDefinition<S extends RawShape = RawShape> {
  name: string;
  title: string;
  description: string;
  provider: string;
  operationClass: OperationClass;
  inputSchema: S;
  annotations?: Partial<ToolAnnotations>;
  /**
   * The thing being acted on — a bucket, a repository, a database, a
   * domain. Used for the protected-resource check and for the audit
   * record, so a tool that omits it on a protected operation is refused
   * rather than silently allowed.
   */
  resource?: (args: ArgsOf<S>) => string | undefined;
  /** Declared by tools that spend money. */
  purchase?: (args: ArgsOf<S>) => { amount: number; currency: string; description: string } | undefined;
  /**
   * Captures what the resource looked like before an irreversible step.
   * Required on protected tools; the registry refuses to proceed without
   * one rather than trusting that a backup exists somewhere.
   */
  preImage?: (args: ArgsOf<S>, ctx: ToolContext) => Promise<{ preImage: unknown; restoreHint: string }>;
  handler: (args: ArgsOf<S>, ctx: ToolContext) => Promise<ToolPayload>;
}

/** Authoring helper: keeps argument inference while erasing the shape type. */
export function defineTool<S extends RawShape>(definition: ToolDefinition<S>): ToolDefinition {
  return definition as unknown as ToolDefinition;
}

/** Arguments the registry adds to every mutating tool. */
const dryRunShape = {
  dryRun: z
    .boolean()
    .optional()
    .describe('Construct the provider request and return it without sending it. Nothing is changed.'),
} satisfies RawShape;

/** Arguments the registry adds to every protected tool. */
const approvalShape = {
  approvalId: z
    .string()
    .optional()
    .describe('An approval grant id obtained from a previous call to this tool with these exact arguments.'),
  confirmationPhrase: z
    .string()
    .optional()
    .describe('The exact confirmation phrase issued with the approval request.'),
} satisfies RawShape;

export interface RegisterOptions {
  server: McpServer;
  definitions: readonly ToolDefinition[];
  /** Builds a fresh context per call, so requestId and clock are per-invocation. */
  contextFor: (definition: ToolDefinition) => ToolContext;
}

export function registerTools(options: RegisterOptions): void {
  // Deterministic order: the specification asks for it so clients can cache
  // the tool list and prompt caches stay warm.
  const ordered = [...options.definitions].sort((a, b) => (a.name < b.name ? -1 : a.name > b.name ? 1 : 0));

  for (const definition of ordered) {
    const inputSchema: RawShape = {
      ...definition.inputSchema,
      ...(definition.operationClass === 'read' ? {} : dryRunShape),
      ...(definition.operationClass === 'protected' ? approvalShape : {}),
    };

    options.server.registerTool(
      definition.name,
      {
        title: definition.title,
        description: describeTool(definition),
        inputSchema,
        outputSchema: envelopeShape,
        annotations: {
          title: definition.title,
          readOnlyHint: definition.operationClass === 'read',
          destructiveHint: definition.operationClass === 'protected',
          idempotentHint: definition.annotations?.idempotentHint ?? definition.operationClass === 'read',
          openWorldHint: true,
          ...definition.annotations,
        },
      },
      // The SDK's generic inference over a dynamically-composed shape is
      // wider than this call site needs; the runtime contract is enforced
      // by `invokeTool` and by the envelope's own output schema.
      (async (rawArgs: Record<string, unknown>) => {
        const ctx = options.contextFor(definition);
        const envelope = await invokeTool(definition, rawArgs ?? {}, ctx);
        return toCallToolResult(envelope);
      }) as never,
    );
  }
}

/**
 * The gate itself, separated from MCP registration so the whole pipeline
 * is testable without a transport, a client or a server.
 */
export async function invokeTool(
  definition: ToolDefinition,
  rawArgs: Record<string, unknown>,
  ctx: ToolContext,
): Promise<Envelope> {
  const started = Date.now();
  const dryRun = rawArgs['dryRun'] === true;
  ctx = { ...ctx, dryRun };
  const approvalId = typeof rawArgs['approvalId'] === 'string' ? rawArgs['approvalId'] : undefined;
  const confirmationPhrase =
    typeof rawArgs['confirmationPhrase'] === 'string' ? rawArgs['confirmationPhrase'] : undefined;

  const base: Omit<Envelope, 'ok' | 'summary'> = {
    tool: definition.name,
    provider: definition.provider,
    operation: definition.name.split('.').slice(1).join('.') || definition.name,
    operationClass: definition.operationClass,
    dryRun,
    requestId: ctx.requestId,
    durationMs: 0,
  };

  const finish = (envelope: Envelope, outcome: AuditOutcome, resource?: string, error?: StromexError): Envelope => {
    const durationMs = Date.now() - started;
    const record = ctx.audit.append({
      actor: ctx.actor,
      tool: definition.name,
      provider: definition.provider,
      operation: base.operation,
      operationClass: definition.operationClass,
      outcome,
      durationMs,
      arguments: redactValue(stripControlArgs(rawArgs)),
      resource,
      errorCode: error?.code,
      errorMessage: error?.message,
      approvalId,
      workflowRunId: ctx.workflowRunId,
      requestId: ctx.requestId,
    });
    // Redact HERE, not only where the envelope becomes an MCP result.
    // The workflow engine consumes envelopes directly, so redacting at the
    // transport boundary alone would let a provider's echo of a credential
    // reach a workflow report. Found by a test, which is the point of it.
    return redactValue({ ...envelope, durationMs, auditSeq: record.seq });
  };

  // ── 1. Validate ────────────────────────────────────────────────────
  let args: Record<string, unknown>;
  try {
    args = z.object(definition.inputSchema).parse(stripControlArgs(rawArgs)) as Record<string, unknown>;
  } catch (thrown) {
    const error = new StromexError({
      code: 'INPUT_INVALID',
      message: `Arguments for ${definition.name} did not validate: ${formatZodError(thrown)}`,
      remediation: 'Correct the named fields and call the tool again. The tool\'s inputSchema lists the accepted shape.',
      provider: definition.provider,
      operation: base.operation,
      details: redactValue(thrown instanceof z.ZodError ? thrown.issues : undefined),
    });
    return finish(errorEnvelope(base, error), 'error', undefined, error);
  }

  // ── 2. Resource and purchase ───────────────────────────────────────
  let resource: string | undefined;
  let purchase: { amount: number; currency: string; description: string } | undefined;
  try {
    resource = definition.resource?.(args as never);
    purchase = definition.purchase?.(args as never);
  } catch (thrown) {
    const error = toStromexError(thrown, { provider: definition.provider, operation: base.operation });
    return finish(errorEnvelope(base, error), 'error', undefined, error);
  }

  if (definition.operationClass === 'protected' && !resource) {
    // A protected tool that cannot name what it is about to destroy cannot
    // be checked against the protected-resource list, so it is refused.
    const error = new StromexError({
      code: 'INTERNAL',
      message: `${definition.name} is a protected operation but did not name the resource it acts on.`,
      remediation: 'This is a defect in the tool definition: every protected tool must declare `resource`. Report it with this audit record id.',
      provider: definition.provider,
      operation: base.operation,
    });
    return finish(errorEnvelope(base, error), 'denied', undefined, error);
  }

  // ── 3. Policy ──────────────────────────────────────────────────────
  const decision = ctx.policy.evaluate({
    tool: definition.name,
    provider: definition.provider,
    operationClass: definition.operationClass,
    resource,
    purchase,
    dryRun,
    approvalId,
  });

  if (decision.decision === 'deny') {
    const error = new StromexError({
      code: decision.code,
      message: decision.reason,
      remediation: remediationForDenial(decision.code),
      provider: definition.provider,
      operation: base.operation,
    });
    ctx.logger.warn('policy refused a tool call', {
      tool: definition.name,
      resource,
      code: decision.code,
    });
    return finish(errorEnvelope(base, error, `${definition.name} was refused: ${decision.reason}`), 'denied', resource, error);
  }

  // ── 4. Approval ────────────────────────────────────────────────────
  let consumedApprovalId: string | undefined;
  if (decision.decision === 'approval_required') {
    if (approvalId) {
      try {
        // `confirmationPhrase` is accepted here as a CROSS-CHECK, never as
        // an approval. Typing the phrase into a tool call cannot grant the
        // approval, because the phrase was returned to the caller in the
        // approval request — anything that could read it could echo it.
        // Only `stromex-mcp approve` or an elicitation reply grants.
        if (confirmationPhrase !== undefined) {
          const grant = ctx.approvals.get(approvalId);
          if (grant && confirmationPhrase.trim() !== grant.confirmationPhrase) {
            throw new StromexError({
              code: 'POLICY_APPROVAL_INVALID',
              message: 'The confirmation phrase supplied does not match the one issued with this approval.',
              remediation: 'Omit confirmationPhrase, or supply the exact phrase from the approval request.',
            });
          }
        }
        ctx.approvals.consume(approvalId, digestArguments(args));
        consumedApprovalId = approvalId;
      } catch (thrown) {
        const error = toStromexError(thrown, { provider: definition.provider, operation: base.operation });
        return finish(errorEnvelope(base, error), 'denied', resource, error);
      }
    } else {
      const request = ctx.approvals.create({
        tool: definition.name,
        provider: definition.provider,
        resource,
        description: decision.reason,
        argumentsDigest: digestArguments(args),
      });

      const elicited = await tryElicit(ctx, request.id, request.confirmationPhrase, decision.reason);
      if (elicited) {
        ctx.approvals.consume(request.id, digestArguments(args));
        consumedApprovalId = request.id;
      } else {
        const error = new StromexError({
          code: 'POLICY_APPROVAL_REQUIRED',
          message: decision.reason,
          remediation:
            `A human must grant this. Run: stromex-mcp approve ${request.id} --phrase ${JSON.stringify(request.confirmationPhrase)} ` +
            `— then call ${definition.name} again with approvalId=${request.id} and the identical arguments.`,
          provider: definition.provider,
          operation: base.operation,
        });
        const envelope: Envelope = {
          ...errorEnvelope(base, error, `${definition.name} needs an approval grant before it will run.`),
          approval: {
            approvalId: request.id,
            confirmationPhrase: request.confirmationPhrase,
            expiresAt: request.expiresAt,
            description: request.description,
            howToApprove: `stromex-mcp approve ${request.id} --phrase ${JSON.stringify(request.confirmationPhrase)}`,
          },
        };
        return finish(envelope, 'approval_required', resource, error);
      }
    }

    // ── 5. Pre-image ─────────────────────────────────────────────────
    if (decision.requiresBackup && !dryRun) {
      if (!definition.preImage) {
        const error = new StromexError({
          code: 'PRECONDITION_FAILED',
          message: `${definition.name} requires a pre-image before it runs, and the tool does not capture one.`,
          remediation: 'This is a defect in the tool definition: a protected tool must implement `preImage` (SEB §21.5). Report it.',
          provider: definition.provider,
          operation: base.operation,
        });
        return finish(errorEnvelope(base, error), 'denied', resource, error);
      }
      try {
        const captured = await definition.preImage(args as never, ctx);
        const entry = ctx.journal.record({
          tool: definition.name,
          provider: definition.provider,
          operation: base.operation,
          resource: resource ?? definition.name,
          preImage: captured.preImage,
          restoreHint: captured.restoreHint,
          approvalId: consumedApprovalId,
        });
        if (consumedApprovalId) ctx.approvals.attachJournalEntry(consumedApprovalId, entry.id);
        ctx.logger.info('pre-image recorded', { tool: definition.name, resource, journalEntryId: entry.id });
      } catch (thrown) {
        const error = toStromexError(thrown, { provider: definition.provider, operation: base.operation });
        // Failing to capture the pre-image stops the operation. "Back up
        // before deletion" is only a policy if something enforces it.
        return finish(
          errorEnvelope(base, error, `${definition.name} stopped: the pre-image could not be captured, so the operation was not attempted.`),
          'denied',
          resource,
          error,
        );
      }
    }
  }

  if (decision.decision === 'allow' && definition.operationClass === 'protected' && !dryRun) {
    ctx.logger.warn('protected operation running without approval', {
      tool: definition.name,
      resource,
      reason: decision.reason,
    });
  }

  // ── 6. Handler ─────────────────────────────────────────────────────
  try {
    const payload = await definition.handler(args as never, { ...ctx, dryRun });
    const envelope: Envelope = {
      ...base,
      ok: true,
      summary: payload.summary,
      ...(payload.data === undefined ? {} : { data: payload.data }),
      ...(payload.warnings?.length ? { warnings: payload.warnings } : {}),
    };
    return finish(envelope, dryRun ? 'dry_run' : 'ok', resource);
  } catch (thrown) {
    const error = toStromexError(thrown, { provider: definition.provider, operation: base.operation });
    ctx.logger.error('tool failed', { tool: definition.name, code: error.code, resource });
    return finish(errorEnvelope(base, error), 'error', resource, error);
  }
}

async function tryElicit(
  ctx: ToolContext,
  approvalId: string,
  phrase: string,
  description: string,
): Promise<boolean> {
  if (!ctx.elicit) return false;
  try {
    const result = await ctx.elicit({
      message:
        `${description}\n\n` +
        'This permanently removes something. To approve, type the confirmation phrase below exactly.\n' +
        `Confirmation phrase: ${phrase}`,
      requestedSchema: {
        type: 'object',
        properties: {
          confirmationPhrase: {
            type: 'string',
            title: 'Confirmation phrase',
            description: `Type exactly: ${phrase}`,
          },
        },
        required: ['confirmationPhrase'],
      },
    });
    if (result.action !== 'accept') return false;
    const typed = result.content?.['confirmationPhrase'];
    if (typeof typed !== 'string' || typed.trim() !== phrase) return false;
    ctx.approvals.approve(approvalId, { approvedBy: 'elicitation', channel: 'elicitation', phrase: typed.trim() });
    return true;
  } catch (thrown) {
    // A client that declared elicitation and then failed is not an
    // approval. Fall through to the out-of-band path rather than treating
    // an error as consent.
    ctx.logger.warn('elicitation failed; falling back to an out-of-band grant', {
      error: thrown instanceof Error ? thrown.message : String(thrown),
    });
    return false;
  }
}

/** The registry's own arguments are not part of a tool's schema. */
function stripControlArgs(args: Record<string, unknown>): Record<string, unknown> {
  const { dryRun: _dryRun, approvalId: _approvalId, confirmationPhrase: _phrase, ...rest } = args;
  return rest;
}

/**
 * The description a client and a model actually see. The authority class
 * is stated in the text, not only in the annotations, because the
 * specification tells clients to treat annotations from untrusted servers
 * as advisory — and because a model reading the description should learn
 * the same thing the policy engine will enforce.
 */
function describeTool(definition: ToolDefinition): string {
  const suffix =
    definition.operationClass === 'read'
      ? '\n\n[read] Observation only; nothing is changed.'
      : definition.operationClass === 'write'
        ? '\n\n[write] Creates or changes a resource, reversibly. Runs without approval. Pass dryRun=true to see the request without sending it.'
        : '\n\n[protected] Permanently removes something. Requires a human approval grant, and is refused outright on institutional records (certificates, transcripts, student records, audit logs and production stores) whatever the approval. Prefer the archive, revoke or supersede tool for the same resource.';
  return definition.description + suffix;
}

function remediationForDenial(code: StromexError['code']): string {
  switch (code) {
    case 'POLICY_PROTECTED_RESOURCE':
      return 'This resource is an institutional record. Use the archive, revoke, deactivate or supersede operation instead; if it genuinely must be destroyed, a person does it in the provider console, deliberately.';
    case 'POLICY_SPEND_LIMIT':
      return 'Set an explicit spending policy (STROMEX_SPEND_ENABLED with STROMEX_SPEND_MAX_SINGLE and STROMEX_SPEND_MONTHLY_CAP), or make the purchase manually.';
    case 'POLICY_FORBIDDEN':
      return 'This server instance is configured not to permit that class of operation. Change the configuration deliberately, or perform the action by hand.';
    default:
      return 'Read the reason and adjust the request.';
  }
}

function formatZodError(thrown: unknown): string {
  if (!(thrown instanceof z.ZodError)) return thrown instanceof Error ? thrown.message : String(thrown);
  return thrown.issues
    .map((issue) => `${issue.path.join('.') || '(root)'}: ${issue.message}`)
    .join('; ');
}

/** Generates a per-invocation request id. */
export function newRequestId(): string {
  return `req_${randomUUID().replaceAll('-', '').slice(0, 20)}`;
}
