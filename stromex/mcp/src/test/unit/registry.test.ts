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
import { defineTool, invokeTool, type ToolContext, type ToolDefinition } from '../../core/registry.js';
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

  /*
   * SEB-D 31. A caller-supplied literal secret was written in PLAINTEXT to
   * the hash-chained audit file, contradicting the descriptions of the
   * three tools that accept one ("never written to the audit log",
   * "never logged, never audited and never returned").
   *
   * The audit log is append-only, so a value that lands in it cannot be
   * removed without breaking the chain from that point forward. There is
   * no cleaning this up after the fact — which is why the test exists and
   * why it covers every path, not only the happy one.
   */
  describe('a declared secret argument never reaches the audit record', () => {
    const SECRET = 'postgres://user:hunter2hunter2@db.example.com/main';

    function secretTool(overrides: Partial<ToolDefinition> = {}): ToolDefinition {
      return defineTool({
        name: 'test.secret.put',
        title: 'Put a secret',
        description: 'Sets a secret. The value is never written to the audit log.',
        provider: 'test',
        operationClass: 'write',
        inputSchema: { key: z.string().min(1), value: z.string().optional() },
        secretArgs: ['value'],
        resource: (args: { key: string }) => args.key,
        handler: async () => ({ summary: 'set', data: {} }),
        ...overrides,
      } as never);
    }

    /** Everything the audit record could carry, as one string. */
    const auditText = (h: ReturnType<typeof harness>) => JSON.stringify(h.audit.query());

    it('on the success path', async () => {
      const h = harness();
      await invokeTool(secretTool(), { key: 'DATABASE_URL', value: SECRET }, h.context());
      assert.ok(!auditText(h).includes('hunter2hunter2'), 'the secret reached the audit record');
      assert.match(auditText(h), /«redacted»/, 'the argument should be present but masked, not deleted');
    });

    it('on the validation-failure path, where the handler never runs', async () => {
      const h = harness();
      // `key` is empty, so validation fails before anything else — and the
      // arguments are audited anyway.
      await invokeTool(secretTool(), { key: '', value: SECRET }, h.context());
      assert.equal(h.audit.query()[0]!.outcome, 'error');
      assert.ok(!auditText(h).includes('hunter2hunter2'), 'the secret reached the audit record on a validation failure');
    });

    it('on the policy-denial path, where the handler never runs', async () => {
      const h = harness({ policy: { readOnly: true } });
      await invokeTool(secretTool(), { key: 'DATABASE_URL', value: SECRET }, h.context());
      assert.equal(h.audit.query()[0]!.outcome, 'denied');
      assert.ok(!auditText(h).includes('hunter2hunter2'), 'the secret reached the audit record on a denial');
    });

    it('on the approval-required path, where the handler never runs', async () => {
      const h = harness();
      await invokeTool(
        secretTool({ operationClass: 'protected', preImage: async () => ({ preImage: {}, restoreHint: 'none' }) }),
        { key: 'DATABASE_URL', value: SECRET },
        h.context(),
      );
      assert.ok(!auditText(h).includes('hunter2hunter2'), 'the secret reached the audit record while awaiting approval');
    });

    it('on the handler-throws path', async () => {
      const h = harness();
      await invokeTool(
        secretTool({ handler: async () => { throw new StromexError({ code: 'PROVIDER_UNAVAILABLE', message: 'nope', remediation: 'retry' }); } }),
        { key: 'DATABASE_URL', value: SECRET },
        h.context(),
      );
      assert.equal(h.audit.query()[0]!.outcome, 'error');
      assert.ok(!auditText(h).includes('hunter2hunter2'), 'the secret reached the audit record when the handler threw');
    });

    it('and a SHORT secret is masked too, which value-based redaction alone cannot do', async () => {
      // registerSecretValue ignores anything under 8 characters, because
      // redacting a 4-character string would blank unrelated text. A
      // DECLARED secret argument is different: we know what it is, so it is
      // masked structurally rather than searched for.
      const h = harness();
      await invokeTool(secretTool(), { key: 'PIN', value: 'a1b2' }, h.context());
      const record = h.audit.query()[0]!;
      assert.equal((record.arguments as Record<string, unknown>).value, '«redacted»');
    });

    it('and the non-secret arguments survive, so the record is still useful', async () => {
      const h = harness();
      await invokeTool(secretTool(), { key: 'DATABASE_URL', value: SECRET }, h.context());
      const record = h.audit.query()[0]!;
      assert.equal((record.arguments as Record<string, unknown>).key, 'DATABASE_URL');
      assert.equal(record.resource, 'DATABASE_URL');
    });
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

/*
 * SEB-D 31. security.md §4, operations.md §7 and blueprint.md R1 all
 * stated that audit records carry a credential fingerprint. None did —
 * the field was declared and never populated, so the documented rotation
 * procedure ("note the rotation against it") pointed at an empty column.
 */
describe('the credential fingerprint', () => {
  function toolFor(provider: string): ToolDefinition {
    return defineTool({
      name: `${provider}.thing.act`,
      title: 'Act',
      description: 'Acts.',
      provider,
      operationClass: 'read',
      inputSchema: {},
      handler: async () => ({ summary: 'done', data: {} }),
    } as never);
  }

  it('is recorded against the call, and it is never the credential', async () => {
    const h = harness();
    const envelope = await invokeTool(
      toolFor('test'),
      {},
      h.context({ providers: { test: { credentialFingerprint: () => 'a1b2c3d4e5f6' } } as never }),
    );

    assert.equal(envelope.ok, true);
    const record = h.audit.query()[0]!;
    assert.equal(record.credentialFingerprint, 'a1b2c3d4e5f6');
    assert.ok(!JSON.stringify(record).includes('sk_live'), 'a fingerprint is not a credential');
  });

  it('is absent, not fatal, for a provider that cannot produce one', async () => {
    const h = harness();
    const envelope = await invokeTool(toolFor('test'), {}, h.context({ providers: {} as never }));
    assert.equal(envelope.ok, true, 'a missing fingerprint must not fail the call');
    assert.equal(h.audit.query()[0]!.credentialFingerprint, undefined);
  });

  it('never prevents an audit record from being written', async () => {
    const h = harness();
    const envelope = await invokeTool(
      toolFor('test'),
      {},
      h.context({ providers: { test: { credentialFingerprint: () => { throw new Error('client is broken'); } } } as never }),
    );
    assert.equal(envelope.ok, true);
    assert.equal(h.audit.query().length, 1, 'the audit record must survive a broken fingerprint accessor');
  });
});

/*
 * SEB-D 29. The spending controls were claimed and not enforced.
 *
 * `monthlyCap` was parsed, REQUIRED to be positive before spending could
 * be enabled, printed in the CLI banner and returned by
 * `stromex.policy.describe` — and read by no decision anywhere. Three
 * surfaces told an operator a cumulative budget existed. These tests are
 * the cap.
 */
describe('the spending policy, enforced', () => {
  const SPENDING = { enabled: true, currency: 'USD', maxSinglePurchase: 25, monthlyCap: 100 };

  /** A tool that spends whatever the provider "quotes". */
  function buyer(quoted: number, currency = 'USD'): ToolDefinition {
    return defineTool({
      name: 'test.thing.buy',
      title: 'Buy',
      description: 'Buys a thing.',
      provider: 'test',
      operationClass: 'write',
      inputSchema: { maxPrice: z.number().positive(), currency: z.string().length(3) },
      resource: () => 'thing',
      purchase: (args: { maxPrice: number; currency: string }) => ({
        amount: args.maxPrice,
        currency: args.currency,
        description: 'Buy a thing',
      }),
      handler: async (_args: unknown, ctx: ToolContext) => {
        ctx.commitSpend({ amount: quoted, currency, description: 'Buy a thing' });
        return { summary: `bought at ${quoted}`, data: { bought: true, quoted } };
      },
    } as never);
  }

  it('binds the price the PROVIDER quoted, not the ceiling the CALLER declared', async () => {
    const h = harness({ policy: { spending: SPENDING } });
    // The caller declares a ceiling of 5 — comfortably inside the limit,
    // so the gate lets it through. The provider then quotes 40. Before
    // the fix, the gate saw only the 5 and the 40 was simply charged.
    const envelope = await invokeTool(buyer(40), { maxPrice: 5, currency: 'USD' }, h.context());

    assert.equal(envelope.ok, false, 'a 40 charge passed a 25 limit because the caller declared 5');
    assert.equal(envelope.error?.code, 'POLICY_SPEND_LIMIT');
    assert.match(envelope.error!.message, /above the 25 USD single-purchase limit/);
  });

  it('compares the currency the PROVIDER quoted, not the one the caller declared', async () => {
    const h = harness({ policy: { spending: SPENDING } });
    // Declared USD, quoted EUR. The gate's own currency check passes,
    // because it only ever saw the caller's word for it.
    const envelope = await invokeTool(buyer(10, 'EUR'), { maxPrice: 20, currency: 'USD' }, h.context());

    assert.equal(envelope.ok, false, 'a EUR charge was accepted against a USD policy');
    assert.equal(envelope.error?.code, 'POLICY_SPEND_LIMIT');
    assert.match(envelope.error!.message, /quoted 10 EUR/);
  });

  it('enforces the rolling cap across calls, which is the whole point of it', async () => {
    const h = harness({ policy: { spending: SPENDING } });

    // Four purchases at 24 each: 96, inside the 100 cap.
    for (let i = 0; i < 4; i += 1) {
      const ok = await invokeTool(buyer(24), { maxPrice: 24, currency: 'USD' }, h.context());
      assert.equal(ok.ok, true, `purchase ${i + 1} should be inside the cap`);
    }

    // The fifth would take the window to 120.
    const refused = await invokeTool(buyer(24), { maxPrice: 24, currency: 'USD' }, h.context());
    assert.equal(refused.ok, false, 'the rolling cap did not stop the call that would exceed it');
    assert.equal(refused.error?.code, 'POLICY_SPEND_LIMIT');
    assert.match(refused.error!.message, /rolling 30-day total to 120/);
    assert.match(refused.error!.message, /96 already committed/);
  });

  it('records what was actually charged, so an auditor can reconcile it', async () => {
    const h = harness({ policy: { spending: SPENDING } });
    await invokeTool(buyer(19.99), { maxPrice: 25, currency: 'USD' }, h.context());

    const record = h.audit.query()[0]!;
    assert.deepEqual(record.cost, { amount: 19.99, currency: 'USD', description: 'Buy a thing' });
    assert.equal(record.outcome, 'ok');
  });

  it('does not count a REFUSED charge against the window', async () => {
    const h = harness({ policy: { spending: SPENDING } });
    await invokeTool(buyer(40), { maxPrice: 25, currency: 'USD' }, h.context());   // refused
    assert.equal(h.audit.query()[0]!.cost, undefined, 'a refused charge was counted as spend');

    const ok = await invokeTool(buyer(24), { maxPrice: 24, currency: 'USD' }, h.context());
    assert.equal(ok.ok, true, 'a refused charge consumed budget it never spent');
  });

  it('counts a METERED charge even when it breached, because the money already moved', async () => {
    const metered = defineTool({
      name: 'test.metered.call',
      title: 'Metered',
      description: 'Calls a metered provider.',
      provider: 'test',
      operationClass: 'write',
      inputSchema: {},
      handler: async (_args: unknown, ctx: ToolContext) => {
        // 40 is over the 25 single-purchase limit — but it has already
        // been charged. Refusing to record it would leave real money
        // spent and unaccounted, which is the worst of both.
        const { breach } = ctx.commitSpend(
          { amount: 40, currency: 'USD', description: 'A metered call' },
          { alreadyIncurred: true },
        );
        return { summary: 'called', data: { breach }, warnings: breach ? [breach] : undefined };
      },
    } as never);

    const h = harness({ policy: { spending: SPENDING } });
    const envelope = await invokeTool(metered, {}, h.context());

    assert.equal(envelope.ok, true, 'a post-hoc charge must not be turned into an error after the fact');
    assert.equal(h.audit.query()[0]!.cost?.amount, 40, 'the charge that already happened was not recorded');
    assert.match(envelope.warnings!.join(' '), /single-purchase limit/, 'the breach must be surfaced, not swallowed');
  });

  it('refuses a metered call once the window has no headroom left', async () => {
    const h = harness({ policy: { spending: SPENDING } });
    // Fill the window to the cap.
    for (let i = 0; i < 4; i += 1) await invokeTool(buyer(25), { maxPrice: 25, currency: 'USD' }, h.context());

    const metered = defineTool({
      name: 'test.metered.call',
      title: 'Metered',
      description: 'Calls a metered provider.',
      provider: 'test',
      operationClass: 'write',
      inputSchema: {},
      handler: async (_args: unknown, ctx: ToolContext) => {
        ctx.assertSpendHeadroom('USD');
        return { summary: 'called', data: {} };
      },
    } as never);

    const envelope = await invokeTool(metered, {}, h.context());
    assert.equal(envelope.ok, false, 'a metered call proceeded with the window already at the cap');
    assert.equal(envelope.error?.code, 'POLICY_SPEND_LIMIT');
  });

  it('refuses a metered call outright while the policy is off', async () => {
    const metered = defineTool({
      name: 'test.metered.call',
      title: 'Metered',
      description: 'Calls a metered provider.',
      provider: 'test',
      operationClass: 'write',
      inputSchema: {},
      handler: async (_args: unknown, ctx: ToolContext) => {
        ctx.assertSpendHeadroom('USD');
        return { summary: 'called', data: {} };
      },
    } as never);

    const h = harness();   // shipped default: spending off
    const envelope = await invokeTool(metered, {}, h.context());
    assert.equal(envelope.ok, false);
    assert.match(envelope.error!.message, /metered provider/);
  });
});

/*
 * SEB-D 29, closing a hole the first fix left.
 *
 * The metered headroom check was guarded on pricing being configured, so
 * an unpriced consultation was neither checked before nor counted after —
 * the rolling cap silently did not apply to the provider most likely to
 * loop. Unpriced is fine while nobody is accounting for money; it is not
 * fine once somebody is.
 */
describe('an unpriceable metered call', () => {
  const unpriceable = defineTool({
    name: 'test.metered.unpriced',
    title: 'Unpriced',
    description: 'A metered call with no rates configured.',
    provider: 'test',
    operationClass: 'write',
    inputSchema: {},
    handler: async (_args: unknown, ctx: ToolContext) => {
      if (!ctx.spendingEnabled) return { summary: 'called, unpriced', data: {}, warnings: ['unpriced'] };
      throw new StromexError({
        code: 'CONFIG_INVALID',
        message: 'A spending policy is in force but this call cannot be priced.',
        remediation: 'Configure the per-token rates.',
      });
    },
  } as never);

  it('proceeds while no spending policy is in force', async () => {
    const envelope = await invokeTool(unpriceable, {}, harness().context());
    assert.equal(envelope.ok, true, 'unpriced is acceptable when nobody is accounting for money');
  });

  it('is refused once a spending policy IS in force', async () => {
    const h = harness({ policy: { spending: { enabled: true, currency: 'USD', maxSinglePurchase: 25, monthlyCap: 150 } } });
    const envelope = await invokeTool(unpriceable, {}, h.context());
    assert.equal(envelope.ok, false, 'an uncountable charge slipped past a cap that is supposed to bound it');
    assert.equal(envelope.error?.code, 'CONFIG_INVALID');
  });
});
