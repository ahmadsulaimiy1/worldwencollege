/**
 * Workflow tools.
 *
 * `stromex.workflow.run` is deliberately the only way to start one, and
 * it goes through the same registry gate as every other tool — so a
 * workflow is audited twice: once as the workflow, and once per step.
 */

import { z } from 'zod';
import { defineTool, type ToolContext, type ToolDefinition } from '../core/registry.js';
import { StromexError } from '../core/errors.js';
import { runWorkflow } from './engine.js';
import { WORKFLOWS } from './definitions.js';

export interface WorkflowToolOptions {
  /** Every registered tool, by name — the workflow engine's call surface. */
  tools: Map<string, ToolDefinition>;
  contextFor: (tool: ToolDefinition, runId: string) => ToolContext;
  /** Providers configured on this instance, used to filter what is offered. */
  active: readonly string[];
  now: () => Date;
}

export function workflowTools(options: WorkflowToolOptions): ToolDefinition[] {
  const available = WORKFLOWS.filter((workflow) => workflow.requires.every((provider) => options.active.includes(provider)));

  return [
    defineTool({
      name: 'stromex.workflow.list',
      title: 'StromeX — list workflows',
      description:
        'Lists the workflows this instance can run, with their inputs and the providers each needs. A workflow whose providers are not configured is listed as unavailable rather than hidden, so its absence is legible.',
      provider: 'stromex',
      operationClass: 'read',
      inputSchema: {},
      handler: async () => ({
        summary: `${available.length} of ${WORKFLOWS.length} workflows available on this instance`,
        data: {
          workflows: WORKFLOWS.map((workflow) => ({
            name: workflow.name,
            title: workflow.title,
            description: workflow.description,
            requires: workflow.requires,
            available: workflow.requires.every((provider) => options.active.includes(provider)),
            inputs: Object.keys(workflow.inputSchema),
          })),
        },
      }),
    }),

    defineTool({
      name: 'stromex.workflow.run',
      title: 'StromeX — run a workflow',
      description:
        'Runs a named workflow. Every step passes through the same policy, approval and audit gate as a direct tool call, so a workflow cannot become a way around them. On failure, completed steps that declare a compensation are undone in reverse — and any compensation that would call a protected tool is refused and reported instead, because an undo never destroys. Pass dryRun to see the whole plan without touching anything.',
      provider: 'stromex',
      operationClass: 'write',
      annotations: { idempotentHint: false },
      inputSchema: {
        workflow: z.string().min(1).describe('Workflow name from stromex.workflow.list.'),
        input: z.record(z.string(), z.unknown()).optional().describe('Workflow inputs.'),
      },
      resource: (args) => `workflow:${args.workflow}`,
      handler: async (args, ctx) => {
        const definition = WORKFLOWS.find((workflow) => workflow.name === args.workflow);
        if (!definition) {
          throw new StromexError({
            code: 'INPUT_INVALID',
            message: `No workflow named ${args.workflow}.`,
            remediation: `Call stromex.workflow.list to see what this instance offers: ${available.map((w) => w.name).join(', ') || '(none)'}.`,
          });
        }
        const missing = definition.requires.filter((provider) => !options.active.includes(provider));
        if (missing.length > 0) {
          throw new StromexError({
            code: 'CREDENTIAL_MISSING',
            message: `Workflow ${definition.name} needs ${missing.join(', ')}, which this server instance does not have configured.`,
            remediation: 'Configure the missing providers and restart, or run `stromex-mcp doctor` to see what is absent.',
          });
        }

        const report = await runWorkflow({
          definition,
          input: args.input ?? {},
          tools: options.tools,
          contextFor: options.contextFor,
          dryRun: ctx.dryRun,
          // The run's attribution, taken from the gate rather than from the
          // caller's arguments: `forProject` is a control argument and is
          // stripped before a handler sees it. Every step and every
          // compensation inherits it.
          forProject: ctx.project?.key,
          now: options.now,
        });

        const failedStep = report.steps.find((step) => step.status === 'failed');
        const warnings = [
          ...report.unrecovered.map((entry) => `NOT UNDONE — ${entry}`),
          ...report.steps.filter((step) => step.status === 'compensated').map((step) => `Compensated: ${step.title}`),
        ];

        return {
          summary: report.ok
            ? `${definition.title}: ${report.steps.filter((s) => s.status === 'ok').length} step(s) completed${report.dryRun ? ' (dry run)' : ''}`
            : `${definition.title} failed at "${failedStep?.title ?? 'an unknown step'}": ${failedStep?.summary ?? 'no detail'}`,
          data: report,
          ...(warnings.length ? { warnings } : {}),
        };
      },
    }),
  ];
}
