/**
 * The workflow engine.
 *
 * A workflow is a declarative sequence of tool calls with validation,
 * captured state, compensation and a report — not a script. Three
 * properties make it different from "call these tools in order":
 *
 *   1. **Every step goes through the tool registry**, so policy, audit,
 *      approval and redaction apply exactly as they would to a direct
 *      call. A workflow cannot become a way around the gate.
 *   2. **Compensation is bounded.** A workflow undoes what it *created*.
 *      It never destroys anything it merely touched, and — enforced here,
 *      not left to the workflow author — a compensation may never invoke a
 *      protected tool (`SEB §26.1`).
 *   3. **The report names what it could not undo.** A rollback that
 *      partially succeeded is the most dangerous state a system can be
 *      in, so it is stated rather than summarised.
 */

import { randomUUID } from 'node:crypto';
import { z } from 'zod';
import { StromexError, toStromexError } from '../core/errors.js';
import { invokeTool, newRequestId, type RawShape, type ToolContext, type ToolDefinition } from '../core/registry.js';
import type { Envelope } from '../core/result.js';

export type WorkflowState = Record<string, unknown>;

export interface WorkflowStep {
  id: string;
  title: string;
  /** Tool to invoke. Must exist in the registry, or the run fails before anything happens. */
  tool: string;
  args: (state: WorkflowState) => Record<string, unknown>;
  /** Skip this step when it returns false. */
  when?: (state: WorkflowState) => boolean;
  /** Copies values out of the result into the run state for later steps. */
  capture?: (envelope: Envelope, state: WorkflowState) => void;
  /** A failure here is recorded and the run continues. */
  optional?: boolean;
  /** How to undo this step. Returns undefined when nothing needs undoing. */
  compensate?: (state: WorkflowState) => { tool: string; args: Record<string, unknown> } | undefined;
}

export interface WorkflowDefinition<S extends RawShape = RawShape> {
  name: string;
  title: string;
  description: string;
  /** Providers that must be configured for this workflow to be offered. */
  requires: readonly string[];
  inputSchema: S;
  steps: (input: Record<string, unknown>) => WorkflowStep[];
}

export interface StepReport {
  id: string;
  title: string;
  tool: string;
  status: 'ok' | 'skipped' | 'failed' | 'compensated' | 'compensation-failed';
  summary: string;
  durationMs: number;
  auditSeq?: number;
  errorCode?: string;
  remediation?: string;
}

export interface WorkflowRunReport {
  runId: string;
  workflow: string;
  startedAt: string;
  finishedAt: string;
  dryRun: boolean;
  ok: boolean;
  steps: StepReport[];
  /** Values the run captured; secrets never appear here, only handles. */
  state: WorkflowState;
  /** What compensation could not undo — read this first when ok is false. */
  unrecovered: string[];
}

export interface RunWorkflowOptions {
  definition: WorkflowDefinition;
  input: Record<string, unknown>;
  tools: Map<string, ToolDefinition>;
  contextFor: (tool: ToolDefinition, runId: string) => ToolContext;
  dryRun: boolean;
  now: () => Date;
}

export async function runWorkflow(options: RunWorkflowOptions): Promise<WorkflowRunReport> {
  const runId = `wfr_${randomUUID().replaceAll('-', '').slice(0, 20)}`;
  const startedAt = options.now().toISOString();
  const state: WorkflowState = { ...options.input };
  const reports: StepReport[] = [];
  const unrecovered: string[] = [];
  const completed: WorkflowStep[] = [];

  const input = z.object(options.definition.inputSchema).parse(options.input) as Record<string, unknown>;
  Object.assign(state, input);

  const steps = options.definition.steps(input);

  // Fail before anything happens rather than half-way through: a workflow
  // naming a tool this instance does not expose is a configuration error,
  // and discovering it at step four is discovering it too late.
  for (const step of steps) {
    if (!options.tools.has(step.tool)) {
      throw new StromexError({
        code: 'CONFIG_INVALID',
        message: `Workflow ${options.definition.name} step "${step.id}" calls ${step.tool}, which this server instance does not expose.`,
        remediation: `Configure the provider that owns ${step.tool}, or select a workflow whose requirements this instance meets.`,
      });
    }
  }

  let failed = false;

  for (const step of steps) {
    if (step.when && !step.when(state)) {
      reports.push({ id: step.id, title: step.title, tool: step.tool, status: 'skipped', summary: 'Precondition not met', durationMs: 0 });
      continue;
    }

    const definition = options.tools.get(step.tool)!;
    const ctx = { ...options.contextFor(definition, runId), workflowRunId: runId, requestId: newRequestId() };
    const args = { ...step.args(state), ...(options.dryRun ? { dryRun: true } : {}) };

    let envelope: Envelope;
    try {
      envelope = await invokeTool(definition, args, ctx);
    } catch (thrown) {
      const error = toStromexError(thrown, { operation: step.tool });
      envelope = {
        tool: step.tool,
        provider: definition.provider,
        operation: step.tool,
        operationClass: definition.operationClass,
        dryRun: options.dryRun,
        requestId: ctx.requestId,
        durationMs: 0,
        ok: false,
        summary: error.message,
        error: { code: error.code, message: error.message, remediation: error.remediation, retryable: error.retryable },
      };
    }

    if (envelope.ok) {
      step.capture?.(envelope, state);
      completed.push(step);
      reports.push({
        id: step.id,
        title: step.title,
        tool: step.tool,
        status: 'ok',
        summary: envelope.summary,
        durationMs: envelope.durationMs,
        auditSeq: envelope.auditSeq,
      });
      continue;
    }

    reports.push({
      id: step.id,
      title: step.title,
      tool: step.tool,
      status: 'failed',
      summary: envelope.summary,
      durationMs: envelope.durationMs,
      auditSeq: envelope.auditSeq,
      errorCode: envelope.error?.code,
      remediation: envelope.error?.remediation,
    });

    if (step.optional) continue;
    failed = true;
    break;
  }

  if (failed && !options.dryRun) {
    // Compensate in reverse. Each compensation is itself a real tool call,
    // audited like any other, so an undo is as visible as the thing it undoes.
    for (const step of [...completed].reverse()) {
      const compensation = step.compensate?.(state);
      if (!compensation) continue;

      const definition = options.tools.get(compensation.tool);
      if (!definition) {
        unrecovered.push(`${step.title}: compensation calls ${compensation.tool}, which is not available. Undo it by hand.`);
        continue;
      }
      if (definition.operationClass === 'protected') {
        // Enforced here rather than trusted to the workflow author.
        unrecovered.push(
          `${step.title}: its compensation would call the protected tool ${compensation.tool}. Compensation never destroys (SEB §26.1). Undo it by hand, deliberately.`,
        );
        continue;
      }

      const ctx = { ...options.contextFor(definition, runId), workflowRunId: runId, requestId: newRequestId() };
      try {
        const result = await invokeTool(definition, compensation.args, ctx);
        const report = reports.find((entry) => entry.id === step.id);
        if (report) {
          report.status = result.ok ? 'compensated' : 'compensation-failed';
          if (!result.ok) unrecovered.push(`${step.title}: compensation failed — ${result.summary}`);
        }
      } catch (thrown) {
        unrecovered.push(`${step.title}: compensation threw — ${thrown instanceof Error ? thrown.message : String(thrown)}`);
      }
    }
  }

  return {
    runId,
    workflow: options.definition.name,
    startedAt,
    finishedAt: options.now().toISOString(),
    dryRun: options.dryRun,
    ok: !failed,
    steps: reports,
    state: redactState(state),
    unrecovered,
  };
}

/**
 * Strips anything that looks like it was meant to be a value rather than
 * a reference. Workflows carry handles, ids and names; if one ever
 * carries a plaintext credential, this is the last place it can be caught.
 */
function redactState(state: WorkflowState): WorkflowState {
  const out: WorkflowState = {};
  for (const [key, value] of Object.entries(state)) {
    if (/password|secret|token|apikey|api_key|credential|connectionstring|connection_uri/i.test(key)) {
      out[key] = '«redacted»';
      continue;
    }
    out[key] = value;
  }
  return out;
}
