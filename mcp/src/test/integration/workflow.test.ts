/**
 * Workflow engine tests.
 *
 * The two properties that matter: a workflow cannot become a way around
 * the gate, and compensation never destroys anything. Both are asserted
 * on the paths where they would actually fail.
 */

import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { z } from 'zod';

import { defineTool, type ToolDefinition } from '../../core/registry.js';
import { runWorkflow, type WorkflowDefinition } from '../../workflows/engine.js';
import { WORKFLOWS } from '../../workflows/definitions.js';
import { StromexError } from '../../core/errors.js';
import { RotationRegister, memoryRotationIo } from '../../core/rotation.js';
import { harness } from '../support/harness.js';

const FIXED_NOW = () => new Date('2026-08-18T09:00:00.000Z');

interface Recorder {
  calls: Array<{ tool: string; args: Record<string, unknown> }>;
}

function toolset(recorder: Recorder, overrides: Partial<Record<string, Partial<ToolDefinition>>> = {}): Map<string, ToolDefinition> {
  const make = (name: string, extra: Partial<ToolDefinition> = {}) =>
    defineTool({
      name,
      title: name,
      description: name,
      provider: 'test',
      operationClass: 'write',
      inputSchema: { id: z.string().optional(), fail: z.boolean().optional() },
      resource: (args: { id?: string }) => args.id ?? name,
      handler: async (args: { id?: string; fail?: boolean }) => {
        recorder.calls.push({ tool: name, args: args as Record<string, unknown> });
        if (args.fail) throw new StromexError({ code: 'PROVIDER_CONFLICT', message: `${name} refused`, remediation: 'fix it' });
        return { summary: `${name} ok`, data: { id: args.id ?? name } };
      },
      ...extra,
      ...(overrides[name] ?? {}),
    } as never);

  const tools = ['step.one', 'step.two', 'step.three', 'undo.one', 'undo.two'].map((name) => make(name));
  tools.push(
    make('destroy.thing', {
      operationClass: 'protected',
      preImage: async () => ({ preImage: {}, restoreHint: 'h' }),
    }),
  );
  return new Map(tools.map((tool) => [tool.name, tool]));
}

function definition(steps: WorkflowDefinition['steps']): WorkflowDefinition {
  return { name: 'test.flow', title: 'Test flow', description: 'd', requires: [], inputSchema: {}, steps };
}

describe('workflow engine', () => {
  it('runs steps in order, threading captured state forward', async () => {
    const recorder: Recorder = { calls: [] };
    const h = harness();
    const report = await runWorkflow({
      definition: definition(() => [
        { id: 'a', title: 'A', tool: 'step.one', args: () => ({ id: 'first' }), capture: (env, state) => { state['fromA'] = (env.data as { id: string }).id; } },
        { id: 'b', title: 'B', tool: 'step.two', args: (state) => ({ id: `${state['fromA']}-then` }) },
      ]),
      input: {},
      tools: toolset(recorder),
      contextFor: () => h.context(),
      dryRun: false,
      now: FIXED_NOW,
    });

    assert.equal(report.ok, true);
    assert.deepEqual(recorder.calls.map((call) => call.tool), ['step.one', 'step.two']);
    assert.equal(recorder.calls[1]!.args['id'], 'first-then');
    assert.match(report.runId, /^wfr_/);
  });

  it('audits every step under one workflow run id', async () => {
    const recorder: Recorder = { calls: [] };
    const h = harness();
    const report = await runWorkflow({
      definition: definition(() => [
        { id: 'a', title: 'A', tool: 'step.one', args: () => ({}) },
        { id: 'b', title: 'B', tool: 'step.two', args: () => ({}) },
      ]),
      input: {},
      tools: toolset(recorder),
      contextFor: () => h.context(),
      dryRun: false,
      now: FIXED_NOW,
    });

    const records = h.audit.query({ workflowRunId: report.runId });
    assert.equal(records.length, 2, 'a workflow is audited step by step, not as one opaque action');
    assert.equal(h.audit.verify().ok, true);
  });

  it('skips a step whose precondition is not met, and says so', async () => {
    const recorder: Recorder = { calls: [] };
    const h = harness();
    const report = await runWorkflow({
      definition: definition(() => [
        { id: 'a', title: 'A', tool: 'step.one', args: () => ({}), when: () => false },
        { id: 'b', title: 'B', tool: 'step.two', args: () => ({}) },
      ]),
      input: {},
      tools: toolset(recorder),
      contextFor: () => h.context(),
      dryRun: false,
      now: FIXED_NOW,
    });
    assert.equal(report.steps[0]!.status, 'skipped');
    assert.equal(recorder.calls.length, 1);
  });

  it('compensates completed steps in reverse when a later step fails', async () => {
    const recorder: Recorder = { calls: [] };
    const h = harness();
    const report = await runWorkflow({
      definition: definition(() => [
        { id: 'a', title: 'A', tool: 'step.one', args: () => ({ id: 'a' }), compensate: () => ({ tool: 'undo.one', args: { id: 'a' } }) },
        { id: 'b', title: 'B', tool: 'step.two', args: () => ({ id: 'b' }), compensate: () => ({ tool: 'undo.two', args: { id: 'b' } }) },
        { id: 'c', title: 'C', tool: 'step.three', args: () => ({ id: 'c', fail: true }) },
      ]),
      input: {},
      tools: toolset(recorder),
      contextFor: () => h.context(),
      dryRun: false,
      now: FIXED_NOW,
    });

    assert.equal(report.ok, false);
    assert.deepEqual(
      recorder.calls.map((call) => call.tool),
      ['step.one', 'step.two', 'step.three', 'undo.two', 'undo.one'],
      'compensation runs in reverse order',
    );
    assert.equal(report.steps.find((step) => step.id === 'a')!.status, 'compensated');
    assert.equal(report.steps.find((step) => step.id === 'c')!.status, 'failed');
    assert.equal(report.unrecovered.length, 0);
  });

  it('REFUSES a compensation that would call a protected tool, and reports it as not undone', async () => {
    const recorder: Recorder = { calls: [] };
    const h = harness();
    const report = await runWorkflow({
      definition: definition(() => [
        { id: 'a', title: 'Created a thing', tool: 'step.one', args: () => ({ id: 'a' }), compensate: () => ({ tool: 'destroy.thing', args: { id: 'a' } }) },
        { id: 'b', title: 'B', tool: 'step.two', args: () => ({ fail: true }) },
      ]),
      input: {},
      tools: toolset(recorder),
      contextFor: () => h.context(),
      dryRun: false,
      now: FIXED_NOW,
    });

    assert.equal(report.ok, false);
    assert.ok(!recorder.calls.some((call) => call.tool === 'destroy.thing'), 'the protected tool must never be invoked as an undo');
    assert.equal(report.unrecovered.length, 1);
    assert.match(report.unrecovered[0]!, /Compensation never destroys/);
    assert.match(report.unrecovered[0]!, /Undo it by hand/);
  });

  it('continues past an optional step that failed', async () => {
    const recorder: Recorder = { calls: [] };
    const h = harness();
    const report = await runWorkflow({
      definition: definition(() => [
        { id: 'a', title: 'A', tool: 'step.one', args: () => ({ fail: true }), optional: true },
        { id: 'b', title: 'B', tool: 'step.two', args: () => ({}) },
      ]),
      input: {},
      tools: toolset(recorder),
      contextFor: () => h.context(),
      dryRun: false,
      now: FIXED_NOW,
    });
    assert.equal(report.ok, true);
    assert.equal(report.steps[0]!.status, 'failed');
    assert.equal(report.steps[1]!.status, 'ok');
  });

  it('fails before anything happens when a step names a tool this instance does not expose', async () => {
    const recorder: Recorder = { calls: [] };
    const h = harness();
    await assert.rejects(
      runWorkflow({
        definition: definition(() => [
          { id: 'a', title: 'A', tool: 'step.one', args: () => ({}) },
          { id: 'b', title: 'B', tool: 'not.a.tool', args: () => ({}) },
        ]),
        input: {},
        tools: toolset(recorder),
        contextFor: () => h.context(),
        dryRun: false,
        now: FIXED_NOW,
      }),
      (error: StromexError) => error.code === 'CONFIG_INVALID',
    );
    assert.equal(recorder.calls.length, 0, 'not one step ran');
  });

  it('propagates dryRun to every step and compensates nothing', async () => {
    const recorder: Recorder = { calls: [] };
    const h = harness();
    const report = await runWorkflow({
      definition: definition(() => [{ id: 'a', title: 'A', tool: 'step.one', args: () => ({ id: 'a' }) }]),
      input: {},
      tools: toolset(recorder),
      contextFor: () => h.context(),
      dryRun: true,
      now: FIXED_NOW,
    });
    assert.equal(report.dryRun, true);
    assert.equal(h.audit.query()[0]!.outcome, 'dry_run');
  });

  it('redacts anything in the run state that looks like a value rather than a reference', async () => {
    const recorder: Recorder = { calls: [] };
    const h = harness();
    const report = await runWorkflow({
      definition: definition(() => [
        {
          id: 'a',
          title: 'A',
          tool: 'step.one',
          args: () => ({}),
          capture: (_env, state) => {
            state['connectionString'] = 'postgres://u:p@h/db';
            state['handle'] = 'vh_abc';
          },
        },
      ]),
      input: {},
      tools: toolset(recorder),
      contextFor: () => h.context(),
      dryRun: false,
      now: FIXED_NOW,
    });
    assert.equal(report.state['connectionString'], '«redacted»');
    assert.equal(report.state['handle'], 'vh_abc');
  });

  it('validates workflow inputs before running anything', async () => {
    const recorder: Recorder = { calls: [] };
    const h = harness();
    await assert.rejects(
      runWorkflow({
        definition: { name: 'x', title: 'x', description: 'd', requires: [], inputSchema: { name: z.string().min(1) }, steps: () => [] },
        input: {},
        tools: toolset(recorder),
        contextFor: () => h.context(),
        dryRun: false,
        now: FIXED_NOW,
      }),
      /invalid|required|expected/i,
    );
  });
});

describe('the shipped workflow definitions', () => {
  it('every step names a tool that exists in a fully configured server', async () => {
    // Build the union of every tool the seven adapters and the platform
    // expose, so a workflow referring to a renamed tool fails here rather
    // than at the moment somebody runs it during an incident.
    const { githubTools } = await import('../../providers/github/tools.js');
    const { cloudflareTools } = await import('../../providers/cloudflare/tools.js');
    const { neonTools } = await import('../../providers/neon/tools.js');
    const { vercelTools } = await import('../../providers/vercel/tools.js');
    const { clerkTools } = await import('../../providers/clerk/tools.js');
    const { resendTools } = await import('../../providers/resend/tools.js');
    const { brevoTools } = await import('../../providers/brevo/tools.js');
    const { platformTools } = await import('../../platform/tools.js');
    const h = harness();

    const names = new Set(
      [
        ...githubTools(),
        ...cloudflareTools(),
        ...neonTools(),
        ...vercelTools(),
        ...clerkTools(),
        ...resendTools(),
        ...brevoTools(),
        ...platformTools({
          config: h.config,
          active: [],
          version: '1.0.0',
          rotation: new RotationRegister({ path: 'unused', io: memoryRotationIo() }),
          writeCapableProviders: new Set(),
        }),
      ].map((tool) => tool.name),
    );

    for (const workflow of WORKFLOWS) {
      // Supply a plausible input so `steps()` can build without throwing.
      const input = Object.fromEntries(Object.keys(workflow.inputSchema).map((key) => [key, 'x']));
      for (const step of workflow.steps(input)) {
        assert.ok(names.has(step.tool), `${workflow.name} step "${step.id}" names an unknown tool: ${step.tool}`);
        const compensation = step.compensate?.({});
        if (compensation) assert.ok(names.has(compensation.tool), `${workflow.name} step "${step.id}" compensates with an unknown tool: ${compensation.tool}`);
      }
    }
  });

  it('takes a backup as the FIRST step of the migration workflow', () => {
    const provision = WORKFLOWS.find((workflow) => workflow.name === 'database.provision')!;
    const steps = provision.steps({ projectId: 'p', sourceBranchId: 'b', databaseName: 'd', roleName: 'r', label: 'l', migrations: [] });
    assert.equal(steps[0]!.tool, 'neon.backup.create');
  });

  it('never compensates by deleting the repository it created', () => {
    const bootstrap = WORKFLOWS.find((workflow) => workflow.name === 'project.bootstrap')!;
    const steps = bootstrap.steps({ name: 'n', owner: 'o' });
    assert.equal(steps[0]!.compensate?.({}), undefined, 'a repository is an institutional record; an undo does not destroy one');
  });
});

describe('workflow attribution — a run and its steps belong to one project', () => {
  const recorded: Array<Record<string, unknown>> = [];

  const step = defineTool({
    name: 'demo.step',
    title: 'Demo step',
    description: 'Records the arguments it was handed.',
    provider: 'demo',
    operationClass: 'write',
    inputSchema: { value: z.string() },
    handler: async (args) => { recorded.push(args); return { summary: 'done', data: {} }; },
  });

  const failing = defineTool({
    name: 'demo.fail',
    title: 'Demo failure',
    description: 'Always fails, so compensation runs.',
    provider: 'demo',
    operationClass: 'write',
    inputSchema: {},
    handler: async () => { throw new StromexError({ code: 'INTERNAL', message: 'nope', remediation: 'this step exists to fail' }); },
  });

  const compensator = defineTool({
    name: 'demo.undo',
    title: 'Demo compensation',
    description: 'Undoes the first step.',
    provider: 'demo',
    operationClass: 'write',
    inputSchema: {},
    handler: async () => ({ summary: 'undone', data: {} }),
  });

  const env = { STROMEX_MCP_PROJECTS: '[{"key":"aipc","name":"Albalagh"}]' };

  it('attributes EVERY step of a run, not just the run itself', async () => {
    const h = harness({ env });
    recorded.length = 0;
    const tools = new Map<string, ToolDefinition>([[step.name, step]]);
    const report = await runWorkflow({
      definition: definition(() => [
        { id: 'a', title: 'A', tool: 'demo.step', args: () => ({ value: 'one' }) },
        { id: 'b', title: 'B', tool: 'demo.step', args: () => ({ value: 'two' }) },
      ]),
      input: {},
      tools,
      contextFor: () => h.context(),
      dryRun: false,
      forProject: 'aipc',
      now: () => new Date('2026-08-21T09:00:00.000Z'),
    });
    assert.equal(report.steps.filter((s) => s.status === 'ok').length, 2);
    // Every step's audit record carries the project — a multi-step run that
    // attributed only its first step would under-count the rest.
    const records = h.audit.query({ project: 'aipc', limit: 50 });
    assert.equal(records.length, 2, 'both steps attributed');
    // And the handler still received its own arguments untouched.
    assert.deepEqual(recorded.map((r) => r['value']), ['one', 'two']);
    assert.ok(!('forProject' in recorded[0]!), 'the control argument never reaches the handler');
  });

  it('attributes a COMPENSATION to the same project as the action it undoes', async () => {
    const h = harness({ env });
    const tools = new Map<string, ToolDefinition>([
      [step.name, step], [failing.name, failing], [compensator.name, compensator],
    ]);
    await runWorkflow({
      definition: definition(() => [
        { id: 'a', title: 'A', tool: 'demo.step', args: () => ({ value: 'one' }),
          compensate: () => ({ tool: 'demo.undo', args: {} }) },
        { id: 'b', title: 'B', tool: 'demo.fail', args: () => ({}) },
      ]),
      input: {},
      tools,
      contextFor: () => h.context(),
      dryRun: false,
      forProject: 'aipc',
      now: () => new Date('2026-08-21T09:00:00.000Z'),
    });
    // A rollback is the one record an auditor most wants attached to
    // something; it must not land unattributed.
    const undo = h.audit.query({ tool: 'demo.undo', limit: 10 })[0];
    assert.ok(undo, 'the compensation ran');
    assert.equal(undo!.project, 'aipc');
  });

  it('leaves steps unattributed when the run names no project — never invented', async () => {
    const h = harness({ env });
    const tools = new Map<string, ToolDefinition>([[step.name, step]]);
    await runWorkflow({
      definition: definition(() => [{ id: 'a', title: 'A', tool: 'demo.step', args: () => ({ value: 'one' }) }]),
      input: {},
      tools,
      contextFor: () => h.context(),
      dryRun: false,
      now: () => new Date('2026-08-21T09:00:00.000Z'),
    });
    assert.equal(h.audit.query({ limit: 10 })[0]!.project, undefined);
  });
});
