/**
 * The gate.
 *
 * This is the most important test file in the server: it asserts that no
 * tool can reach a provider without policy, approval, pre-image capture
 * and audit having run first — and, for every refusal, that the handler
 * NEVER RAN (`SEB §23.9`).
 */

import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { z } from 'zod';

import { digestArguments } from '../../core/approval.js';
import { defineTool, invokeTool, type ToolDefinition } from '../../core/registry.js';
import { StromexError } from '../../core/errors.js';
import { harness } from '../support/harness.js';

/** Builds a tool whose handler records that it ran. */
function spyTool(overrides: Partial<ToolDefinition> = {}): { definition: ToolDefinition; calls: Array<Record<string, unknown>> } {
  const calls: Array<Record<string, unknown>> = [];
  const definition = defineTool({
    name: 'test.resource.act',
    title: 'Test tool',
    description: 'A tool that records that it ran.',
    provider: 'test',
    operationClass: 'write',
    inputSchema: { name: z.string().min(1) },
    resource: (args: { name: string }) => args.name,
    handler: async (args: { name: string }) => {
      calls.push(args as unknown as Record<string, unknown>);
      return { summary: `acted on ${args.name}`, data: { name: args.name } };
    },
    ...overrides,
  } as never);
  return { definition, calls };
}

describe('the tool registry gate', () => {
  it('validates arguments and refuses before the handler runs', async () => {
    const { definition, calls } = spyTool();
    const h = harness();
    const envelope = await invokeTool(definition, { name: '' }, h.context());

    assert.equal(envelope.ok, false);
    assert.equal(envelope.error?.code, 'INPUT_INVALID');
    assert.equal(calls.length, 0, 'the handler must not run on invalid arguments');
    assert.equal(h.audit.query()[0]!.outcome, 'error', 'a validation failure is still audited');
  });

  it('runs a write autonomously and audits it', async () => {
    const { definition, calls } = spyTool();
    const h = harness();
    const envelope = await invokeTool(definition, { name: 'scratch' }, h.context());

    assert.equal(envelope.ok, true);
    assert.equal(envelope.summary, 'acted on scratch');
    assert.equal(calls.length, 1);

    const record = h.audit.query()[0]!;
    assert.equal(record.outcome, 'ok');
    assert.equal(record.operationClass, 'write');
    assert.equal(record.resource, 'scratch');
    assert.equal(envelope.auditSeq, record.seq);
  });

  it('records the audit entry even when the handler throws', async () => {
    const { definition } = spyTool({
      handler: async () => {
        throw new StromexError({ code: 'PROVIDER_NOT_FOUND', message: 'gone', remediation: 'check the id' });
      },
    });
    const h = harness();
    const envelope = await invokeTool(definition, { name: 'scratch' }, h.context());

    assert.equal(envelope.ok, false);
    assert.equal(envelope.error?.code, 'PROVIDER_NOT_FOUND');
    assert.equal(envelope.error?.remediation, 'check the id');
    assert.equal(h.audit.query()[0]!.outcome, 'error');
  });

  describe('dry run', () => {
    it('is permitted without approval even for a protected tool, and is audited as a dry run', async () => {
      const { definition, calls } = spyTool({
        operationClass: 'protected',
        preImage: async () => ({ preImage: {}, restoreHint: 'n/a' }),
      });
      const h = harness();
      const envelope = await invokeTool(definition, { name: 'scratch', dryRun: true }, h.context());

      assert.equal(envelope.ok, true);
      assert.equal(envelope.dryRun, true);
      assert.equal(calls.length, 1, 'the handler runs, and is responsible for not sending anything');
      assert.equal(h.audit.query()[0]!.outcome, 'dry_run');
      assert.equal(h.journalLines.length, 0, 'a dry run captures no pre-image because nothing is destroyed');
    });

    it('strips its own control arguments before validation, so they are not part of any tool schema', async () => {
      const { definition, calls } = spyTool();
      const h = harness();
      await invokeTool(definition, { name: 'scratch', dryRun: true, approvalId: 'apr_x' }, h.context());
      assert.deepEqual(Object.keys(calls[0]!), ['name']);
    });
  });

  describe('protected operations', () => {
    const protectedTool = () =>
      spyTool({
        name: 'test.resource.delete',
        operationClass: 'protected',
        description: 'Destroys the thing.',
        preImage: async (args) => ({ preImage: { was: (args as { name: string }).name }, restoreHint: 'recreate it' }),
      });

    it('refuses outright on an institutional record, with NO approval path', async () => {
      const { definition, calls } = protectedTool();
      const h = harness();
      const envelope = await invokeTool(definition, { name: 'aipc-recordings' }, h.context());

      assert.equal(envelope.ok, false);
      assert.equal(envelope.error?.code, 'POLICY_PROTECTED_RESOURCE');
      assert.equal(envelope.approval, undefined, 'no approval is offered — the refusal is terminal');
      assert.equal(calls.length, 0);
      assert.equal(h.journalLines.length, 0);
      assert.equal(h.audit.query()[0]!.outcome, 'denied');
    });

    it('raises an approval request instead of acting, and the handler does not run', async () => {
      const { definition, calls } = protectedTool();
      const h = harness();
      const envelope = await invokeTool(definition, { name: 'scratch-bucket' }, h.context());

      assert.equal(envelope.ok, false);
      assert.equal(envelope.error?.code, 'POLICY_APPROVAL_REQUIRED');
      assert.ok(envelope.approval, 'the caller is told exactly how to obtain a grant');
      assert.equal(envelope.approval!.confirmationPhrase, 'DELETE SCRATCH-BUCKET');
      assert.match(envelope.approval!.howToApprove, /stromex-mcp approve apr_/);
      assert.equal(calls.length, 0);
      assert.equal(h.audit.query()[0]!.outcome, 'approval_required');
    });

    it('proceeds once a human has granted it, and captures the pre-image first', async () => {
      const { definition, calls } = protectedTool();
      const h = harness();

      const first = await invokeTool(definition, { name: 'scratch-bucket' }, h.context());
      const approvalId = first.approval!.approvalId;
      h.approvals.approve(approvalId, { approvedBy: 'operator', channel: 'cli', phrase: first.approval!.confirmationPhrase });

      const second = await invokeTool(definition, { name: 'scratch-bucket', approvalId }, h.context());
      assert.equal(second.ok, true);
      assert.equal(calls.length, 1);

      assert.equal(h.journalLines.length, 1, 'a pre-image is recorded before the handler runs');
      const entry = JSON.parse(h.journalLines[0]!) as { preImage: { was: string }; restoreHint: string; approvalId: string };
      assert.equal(entry.preImage.was, 'scratch-bucket');
      assert.equal(entry.restoreHint, 'recreate it');
      assert.equal(entry.approvalId, approvalId);
    });

    it('refuses to run when the pre-image cannot be captured, and the handler does not run', async () => {
      const { definition, calls } = spyTool({
        name: 'test.resource.delete',
        operationClass: 'protected',
        preImage: async () => {
          throw new Error('the provider would not describe it');
        },
      });
      const h = harness();
      const first = await invokeTool(definition, { name: 'scratch-bucket' }, h.context());
      h.approvals.approve(first.approval!.approvalId, {
        approvedBy: 'operator',
        channel: 'cli',
        phrase: first.approval!.confirmationPhrase,
      });

      const second = await invokeTool(definition, { name: 'scratch-bucket', approvalId: first.approval!.approvalId }, h.context());
      assert.equal(second.ok, false);
      assert.match(second.summary, /the pre-image could not be captured/);
      assert.equal(calls.length, 0, 'back up before deletion is enforced, not merely recommended');
    });

    it('refuses a protected tool that cannot name its resource — a definition defect, caught at the gate', async () => {
      const { definition, calls } = spyTool({ name: 'test.resource.delete', operationClass: 'protected', resource: () => undefined });
      const h = harness();
      const envelope = await invokeTool(definition, { name: 'scratch' }, h.context());
      assert.equal(envelope.ok, false);
      assert.match(envelope.error!.message, /did not name the resource/);
      assert.equal(calls.length, 0);
    });

    it('refuses an approval granted for different arguments', async () => {
      const { definition, calls } = protectedTool();
      const h = harness();
      const request = h.approvals.create({
        tool: 'test.resource.delete',
        provider: 'test',
        resource: 'other-bucket',
        description: 'd',
        argumentsDigest: digestArguments({ name: 'other-bucket' }),
      });
      h.approvals.approve(request.id, { approvedBy: 'operator', channel: 'cli', phrase: request.confirmationPhrase });

      const envelope = await invokeTool(definition, { name: 'scratch-bucket', approvalId: request.id }, h.context());
      assert.equal(envelope.ok, false);
      assert.equal(envelope.error?.code, 'POLICY_APPROVAL_INVALID');
      assert.equal(calls.length, 0);
    });

    it('treats a supplied confirmation phrase as a cross-check, never as an approval', async () => {
      const { definition, calls } = protectedTool();
      const h = harness();
      const first = await invokeTool(definition, { name: 'scratch-bucket' }, h.context());

      // The caller has both the id and the phrase, because they were
      // returned to it — and neither is enough without a human grant.
      const second = await invokeTool(
        definition,
        { name: 'scratch-bucket', approvalId: first.approval!.approvalId, confirmationPhrase: first.approval!.confirmationPhrase },
        h.context(),
      );
      assert.equal(second.ok, false);
      assert.equal(second.error?.code, 'POLICY_APPROVAL_INVALID');
      assert.match(second.error!.remediation, /A human must approve it first/);
      assert.equal(calls.length, 0);
    });

    it('refuses a mismatched confirmation phrase even when the grant is valid', async () => {
      const { definition, calls } = protectedTool();
      const h = harness();
      const first = await invokeTool(definition, { name: 'scratch-bucket' }, h.context());
      h.approvals.approve(first.approval!.approvalId, {
        approvedBy: 'operator',
        channel: 'cli',
        phrase: first.approval!.confirmationPhrase,
      });

      const second = await invokeTool(
        definition,
        { name: 'scratch-bucket', approvalId: first.approval!.approvalId, confirmationPhrase: 'DELETE SOMETHING-ELSE' },
        h.context(),
      );
      assert.equal(second.ok, false);
      assert.match(second.error!.message, /does not match/);
      assert.equal(calls.length, 0);
    });

    it('is refused outright when the instance sets protectedOperations=deny', async () => {
      const { definition, calls } = protectedTool();
      const h = harness({ policy: { protectedOperations: 'deny' } });
      const envelope = await invokeTool(definition, { name: 'scratch-bucket' }, h.context());
      assert.equal(envelope.ok, false);
      assert.equal(envelope.error?.code, 'POLICY_FORBIDDEN');
      assert.equal(envelope.approval, undefined);
      assert.equal(calls.length, 0);
    });
  });

  describe('elicitation', () => {
    it('grants when the human types the exact phrase back', async () => {
      let asked = '';
      const h = harness({
        elicit: async (request) => {
          asked = request.message;
          const phrase = /Confirmation phrase: (.+)$/m.exec(request.message)?.[1] ?? '';
          return { action: 'accept', content: { confirmationPhrase: phrase } };
        },
      });
      const { definition, calls } = spyTool({
        name: 'test.resource.delete',
        operationClass: 'protected',
        preImage: async () => ({ preImage: {}, restoreHint: 'h' }),
      });

      const envelope = await invokeTool(definition, { name: 'scratch-bucket' }, h.context());
      assert.equal(envelope.ok, true);
      assert.equal(calls.length, 1);
      assert.match(asked, /permanently removes something/);
    });

    it('does not grant on a declined reply', async () => {
      const h = harness({ elicit: async () => ({ action: 'decline' }) });
      const { definition, calls } = spyTool({
        name: 'test.resource.delete',
        operationClass: 'protected',
        preImage: async () => ({ preImage: {}, restoreHint: 'h' }),
      });
      const envelope = await invokeTool(definition, { name: 'scratch-bucket' }, h.context());
      assert.equal(envelope.ok, false);
      assert.equal(envelope.error?.code, 'POLICY_APPROVAL_REQUIRED');
      assert.equal(calls.length, 0);
    });

    it('does not grant when the typed phrase is wrong — accepting is not enough', async () => {
      const h = harness({ elicit: async () => ({ action: 'accept', content: { confirmationPhrase: 'yes' } }) });
      const { definition, calls } = spyTool({
        name: 'test.resource.delete',
        operationClass: 'protected',
        preImage: async () => ({ preImage: {}, restoreHint: 'h' }),
      });
      const envelope = await invokeTool(definition, { name: 'scratch-bucket' }, h.context());
      assert.equal(envelope.ok, false);
      assert.equal(calls.length, 0);
    });

    it('treats an elicitation error as a refusal, never as consent', async () => {
      const h = harness({
        elicit: async () => {
          throw new Error('client blew up');
        },
      });
      const { definition, calls } = spyTool({
        name: 'test.resource.delete',
        operationClass: 'protected',
        preImage: async () => ({ preImage: {}, restoreHint: 'h' }),
      });
      const envelope = await invokeTool(definition, { name: 'scratch-bucket' }, h.context());
      assert.equal(envelope.ok, false);
      assert.equal(calls.length, 0);
    });
  });

  describe('spending', () => {
    it('refuses a purchase while the spending policy is off, before the handler runs', async () => {
      const { definition, calls } = spyTool({
        name: 'test.domain.buy',
        purchase: () => ({ amount: 12, currency: 'USD', description: 'a domain' }),
      });
      const h = harness();
      const envelope = await invokeTool(definition, { name: 'example.com' }, h.context());
      assert.equal(envelope.ok, false);
      assert.equal(envelope.error?.code, 'POLICY_SPEND_LIMIT');
      assert.equal(calls.length, 0);
    });
  });

  describe('the result envelope', () => {
    it('redacts every registered secret on the way out', async () => {
      const h = harness();
      h.vault.store({ value: 'a-connection-string-value', label: 'l', origin: 'o' });
      const { definition } = spyTool({
        handler: async () => ({ summary: 'done', data: { echo: 'a-connection-string-value' } }),
      });
      const envelope = await invokeTool(definition, { name: 'scratch' }, h.context());
      assert.ok(!JSON.stringify(envelope).includes('a-connection-string-value'));
    });

    it('carries warnings through untouched', async () => {
      const { definition } = spyTool({ handler: async () => ({ summary: 'done', warnings: ['something was skipped'] }) });
      const envelope = await invokeTool(definition, { name: 'scratch' }, harness().context());
      assert.deepEqual(envelope.warnings, ['something was skipped']);
    });
  });
});
