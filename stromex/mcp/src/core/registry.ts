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
import type { ProjectProfile, ProjectRegistry } from './project.js';
import type { OperationClass, PolicyEngine } from './policy.js';
import { REDACTION_PLACEHOLDER, redactValue, registerSecretValue } from './redact.js';
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
  /**
   * The estate projects this server may act for. Used to resolve the
   * `forProject` control argument, so an action can be attributed and a
   * project's own protected patterns applied (`src/core/project.ts`).
   */
  projects: ProjectRegistry;
  /**
   * The project THIS call was attributed to, once resolved.
   *
   * Set by the gate, never by a caller. It exists so a handler that fans
   * out — the workflow runner above all — can propagate the attribution to
   * the calls it makes. Without it a multi-step run would record its steps
   * as unattributed while the run itself was attributed, which is a worse
   * record than either being consistent.
   */
  project?: ProjectProfile;
  /**
   * Report a REAL charge, immediately before the irreversible step, and
   * have it checked against the spending policy.
   *
   * Every tool that causes money to move must call this with the price the
   * PROVIDER quoted — not the ceiling the caller declared. It throws
   * `POLICY_SPEND_LIMIT` if the charge breaches the single-purchase limit,
   * the currency, or the rolling 30-day cap; the handler must then not
   * proceed.
   *
   * It is also what puts the cost into the audit record, which is what
   * `SEB §26.6` means by "audited with its reason and its cost".
   *
   * Injected by the registry, so a handler cannot spend without the gate
   * seeing it, and so the rolling total is computed from the estate's own
   * record of record rather than from a second ledger that could drift
   * (`SEB §26.4`).
   */
  commitSpend: (
    charge: { amount: number; currency: string; description: string },
    options?: {
      /**
       * True for a METERED provider, where the cost is only knowable after
       * the money has already moved.
       *
       * A post-hoc charge is RECORDED UNCONDITIONALLY and reports a breach
       * instead of throwing. Refusing to record a charge because it broke
       * the limit would leave real money spent and unaccounted — the worst
       * of both, and precisely what an audit trail exists to prevent. Use
       * `assertSpendHeadroom` BEFORE the call to stop the next one.
       */
      alreadyIncurred?: boolean;
    },
  ) => { breach?: string };
  /**
   * Refuse before calling a metered provider whose price is not knowable
   * in advance.
   *
   * Checks that spending is on, that the policy is denominated in the
   * currency the provider bills in, and that the rolling window has
   * headroom. It cannot bound the individual call — nothing can, for a
   * metered API — but it stops the call AFTER the one that crossed the
   * cap, which is the whole of what is achievable here and is what
   * `SEB §26.6`'s "never exceeded automatically" reduces to for metered
   * spend.
   */
  assertSpendHeadroom: (currency: string) => void;
  /**
   * Whether a spending policy is in force at all.
   *
   * A handler needs this to tell "we are not accounting for money" from
   * "we are accounting for money and cannot price this call" — the second
   * must refuse, the first may proceed with a warning.
   */
  spendingEnabled: boolean;
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
   * Argument names whose values are SECRETS.
   *
   * Declared, not guessed. Value-based redaction (`redact.ts`) catches a
   * credential the SERVER resolved, because resolving it registered it —
   * but a secret the CALLER passes in has never been registered, so the
   * scan has nothing to look for and the value lands verbatim in the
   * hash-chained audit file. The log is append-only: it cannot be
   * un-leaked.
   *
   * Naming the argument closes it on every path — validation failure,
   * policy denial, awaiting approval, dry run, handler throw, success —
   * because the registry masks it structurally before the record is
   * built, rather than searching the text for it afterwards. That also
   * covers secrets shorter than the 8-character floor that value-based
   * redaction deliberately ignores.
   *
   * (`SEB-D 31`; the defect this closes contradicted the tools' own
   * descriptions for three releases.)
   */
  secretArgs?: readonly string[];
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

/**
 * The argument the registry adds to EVERY tool, read operations included.
 *
 * On reads too, because attribution is an accounting question rather than a
 * mutation one: "who looked at this project's data" is exactly the kind of
 * thing an audit trail is asked afterwards, and a field present on only
 * some records cannot answer it.
 */
const projectShape = {
  /*
   * NAMED `forProject`, NOT `project`, and the distinction is load-bearing.
   *
   * `project` is already a real argument on sixteen provider tools — a
   * Vercel project id, a Cloudflare Pages project name. A control argument
   * of that name shadows every one of them: the registry would strip the
   * caller's Vercel project before the handler ever saw it, and the tool
   * would fail on a field the caller did supply. That is exactly what
   * happened when this was first written, and the integration suite caught
   * it. A control argument must be unmistakable for a domain one.
   */
  forProject: z
    .string()
    .optional()
    .describe('Which ESTATE PROJECT this call is made for (not a provider project id). Recorded on the audit record, and the project\'s own protected-resource patterns are added to the estate\'s. Omit only when the call genuinely serves no single project.'),
} satisfies RawShape;

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
      ...projectShape,
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
  /*
   * WHICH PROJECT this call serves. An unknown key is a hard failure rather
   * than a silent fallback to "unattributed": somebody took the trouble to
   * say who the work was for, and filing it under nothing — or under a
   * project the server guessed — is the failure the register exists to
   * prevent (`src/core/project.ts`).
   */
  const projectKey = typeof rawArgs['forProject'] === 'string' && rawArgs['forProject'].trim()
    ? rawArgs['forProject'].trim()
    : undefined;
  /*
   * Resolved BELOW rather than here, once `finish` exists.
   *
   * The first version called `require()` at this point, so an unknown
   * project threw straight out of `invokeTool` — no envelope, and no audit
   * record. That contradicts the one rule this gate keeps everywhere else:
   * a refusal is recorded as carefully as an action (`SEB §21.8`). A
   * mis-attributed call is precisely the kind of thing an auditor later
   * asks about, so the refusal must leave a trace rather than an exception.
   */
  let project: ProjectProfile | undefined;
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
      arguments: redactValue(maskSecretArgs(stripControlArgs(rawArgs), definition.secretArgs)),
      resource,
      errorCode: error?.code,
      errorMessage: error?.message,
      approvalId,
      workflowRunId: ctx.workflowRunId,
      requestId: ctx.requestId,
      credentialFingerprint: fingerprintFor(ctx, definition.provider),
      project: project?.key,
      cost: committed,
    });
    // Redact HERE, not only where the envelope becomes an MCP result.
    // The workflow engine consumes envelopes directly, so redacting at the
    // transport boundary alone would let a provider's echo of a credential
    // reach a workflow report. Found by a test, which is the point of it.
    return redactValue({ ...envelope, durationMs, auditSeq: record.seq });
  };

  /*
   * The rolling window, computed from the audit log.
   *
   * Derived rather than kept in a second ledger: a separate spend file
   * would be a second source of truth about money, and the two would
   * disagree the first time one of them was rotated or restored. The audit
   * log is hash-chained and is the estate's record of record, so a cost in
   * it is as trustworthy as anything here gets — and if it is tampered
   * with, verification says so (`SEB §26.4`).
   */
  let committed: { amount: number; currency: string; description: string } | undefined;

  /*
   * Attribution, resolved here — after `committed`, which `finish` closes
   * over — so that an unknown project is a RECORDED refusal rather than an
   * exception thrown out of the gate. A mis-attributed call is exactly what
   * an auditor asks about later, so it must leave a trace (`SEB §21.8`).
   */
  if (projectKey) {
    try {
      project = ctx.projects.require(projectKey);
      // Handlers that fan out read the attribution from here.
      ctx = { ...ctx, project };
    } catch (thrown) {
      const error = toStromexError(thrown, { provider: definition.provider, operation: base.operation });
      return finish(errorEnvelope(base, error), 'denied', undefined, error);
    }
  }

  const spentInWindow = (): number => {
    const windowStart = new Date(ctx.now().getTime() - 30 * 24 * 60 * 60 * 1000).toISOString();
    return ctx.audit.query({ since: windowStart }).reduce((total, record) => total + (record.cost?.amount ?? 0), 0);
  };

  const commitSpend = (
    charge: { amount: number; currency: string; description: string },
    options?: { alreadyIncurred?: boolean },
  ): { breach?: string } => {
    const spent = spentInWindow();

    if (options?.alreadyIncurred) {
      // The money has already moved. Record it whatever it breached; a
      // charge refused into oblivion is a charge nobody can reconcile.
      committed = charge;
      let breach: string | undefined;
      try {
        ctx.policy.assertSpendPermitted(charge, spent);
      } catch (thrown) {
        breach = thrown instanceof Error ? thrown.message : String(thrown);
        ctx.logger.warn('a metered charge breached the spending policy AFTER it was incurred', {
          tool: definition.name,
          amount: charge.amount,
          currency: charge.currency,
          spentInWindow: spent,
          breach,
        });
      }
      return { breach };
    }

    // Pre-authorised: the price is known and the irreversible step has not
    // happened yet, so a breach is a refusal.
    ctx.policy.assertSpendPermitted(charge, spent);
    committed = charge;
    ctx.logger.info('spend committed', {
      tool: definition.name,
      amount: charge.amount,
      currency: charge.currency,
      spentInWindow: spent,
    });
    return {};
  };

  const assertSpendHeadroom = (currency: string): void => {
    ctx.policy.assertSpendHeadroom(currency, spentInWindow(), definition.name);
  };

  ctx = { ...ctx, commitSpend, assertSpendHeadroom, spendingEnabled: ctx.policy.spendingEnabled };

  // ── 0. Declared secrets ────────────────────────────────────────────
  // Before validation, because a validation FAILURE is audited too and the
  // arguments go into the record either way. Registering here additionally
  // catches the value coming back out of a provider error body.
  for (const key of definition.secretArgs ?? []) {
    const supplied = rawArgs[key];
    if (typeof supplied === 'string') registerSecretValue(supplied);
  }

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
    // The project's own patterns, on top of the estate's. A union: a
    // project may add protection, never remove the estate's.
    extraProtectedResources: project?.protectedResources,
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

/**
 * The fingerprint of the credential this call used — never the credential.
 *
 * `security.md §4`, `operations.md §7` and `blueprint.md R1` all stated
 * that audit records carried this. None did: the field was declared on
 * `AuditRecordInput` and never populated, so the rotation procedure in
 * `operations.md §7` step 7 ("note the rotation against it") pointed at a
 * column that was always empty.
 *
 * Duck-typed rather than imported from `providers/index.ts`: `core` does
 * not depend on `providers`, and inverting that for one accessor would be
 * a worse trade than four lines here.
 */
function fingerprintFor(ctx: ToolContext, provider: string): string | undefined {
  const client = (ctx.providers as Record<string, unknown> | undefined)?.[provider] as
    | { credentialFingerprint?: () => string }
    | undefined;
  try {
    return typeof client?.credentialFingerprint === 'function' ? client.credentialFingerprint() : undefined;
  } catch {
    // A fingerprint is diagnostic. It must never be the reason an audit
    // record fails to be written.
    return undefined;
  }
}

/**
 * Replaces every declared secret argument with the placeholder.
 *
 * Structural, not a text search: the value is masked because of WHERE it
 * is, not because of what it looks like. That is what makes it work for a
 * four-character PIN as well as for a connection string.
 */
function maskSecretArgs(
  args: Record<string, unknown>,
  secretArgs: readonly string[] | undefined,
): Record<string, unknown> {
  if (!secretArgs?.length) return args;
  const masked = { ...args };
  for (const key of secretArgs) {
    if (masked[key] !== undefined && masked[key] !== null) masked[key] = REDACTION_PLACEHOLDER;
  }
  return masked;
}

/** The registry's own arguments are not part of a tool's schema. */
function stripControlArgs(args: Record<string, unknown>): Record<string, unknown> {
  const { dryRun: _dryRun, approvalId: _approvalId, confirmationPhrase: _phrase, forProject: _forProject, ...rest } = args;
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
