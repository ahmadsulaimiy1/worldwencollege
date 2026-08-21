/**
 * End-to-end: a real MCP client, a real stdio transport, a real server
 * process.
 *
 * `SEB §23.2` — every subsystem meets the real producer of its inputs.
 * For a protocol server, the real producer is a real client speaking the
 * real protocol over the real transport. Nothing here is stubbed except
 * the credentials, which are deliberately fake: every assertion below is
 * about behaviour that must hold BEFORE a single provider request is
 * made, and the test would fail if any of it reached the network.
 */

import assert from 'node:assert/strict';
import { mkdtempSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { after, before, describe, it } from 'node:test';

import { Client } from '@modelcontextprotocol/sdk/client/index.js';
import { StdioClientTransport } from '@modelcontextprotocol/sdk/client/stdio.js';

const serverEntry = fileURLToPath(new URL('../../index.js', import.meta.url));

/** Deliberately fake. Nothing in this file should ever reach a provider. */
const FAKE_CREDENTIALS = {
  CLOUDFLARE_API_TOKEN: 'fake-cloudflare-token-000',
  CLOUDFLARE_ACCOUNT_ID: 'fake-account',
  GITHUB_TOKEN: 'fake-github-token-000000',
  NEON_API_KEY: 'fake-neon-key-0000000000',
  VERCEL_TOKEN: 'fake-vercel-token-000000',
  CLERK_SECRET_KEY: 'sk_test_fake_00000000000',
  RESEND_API_KEY: 're_fake_0000000000000000',
  BREVO_API_KEY: 'xkeysib-fake-00000000000',
};

interface ToolResultShape {
  content: Array<{ type: string; text?: string }>;
  structuredContent?: Record<string, unknown>;
  isError?: boolean;
}

describe('end to end over stdio', () => {
  let client: Client;
  let stateDir: string;

  before(async () => {
    stateDir = mkdtempSync(join(tmpdir(), 'stromex-e2e-'));
    client = new Client({ name: 'stromex-e2e-test', version: '1.0.0' }, { capabilities: {} });
    const transport = new StdioClientTransport({
      command: process.execPath,
      args: [serverEntry, 'serve'],
      env: { ...FAKE_CREDENTIALS, STROMEX_MCP_STATE_DIR: stateDir, STROMEX_MCP_LOG_LEVEL: 'error', PATH: process.env['PATH'] ?? '' },
      stderr: 'pipe',
    });
    await client.connect(transport);
  });

  after(async () => {
    await client.close().catch(() => undefined);
    rmSync(stateDir, { recursive: true, force: true });
  });

  it('completes the handshake and reports its identity', () => {
    const info = client.getServerVersion();
    assert.equal(info?.name, 'stromex-enterprise-mcp');
    assert.equal(info?.version, '1.0.0');
  });

  it('states the authority model in its instructions, so a model learns the rules before being refused by them', () => {
    const instructions = client.getInstructions() ?? '';
    assert.match(instructions, /\[read\]/);
    assert.match(instructions, /\[write\]/);
    assert.match(instructions, /\[protected\]/);
    assert.match(instructions, /never destroyed by this server/);
    assert.match(instructions, /Nothing that costs money is bought/);
  });

  it('lists tools in a stable, deterministic order', async () => {
    const first = await client.listTools();
    const second = await client.listTools();
    assert.ok(first.tools.length > 100, `expected the full surface, saw ${first.tools.length}`);
    assert.deepEqual(
      first.tools.map((tool) => tool.name),
      second.tools.map((tool) => tool.name),
      'the specification asks for a deterministic order so clients can cache the list',
    );
    assert.deepEqual([...first.tools.map((t) => t.name)].sort(), first.tools.map((t) => t.name));
  });

  it('annotates every tool, and marks exactly the protected ones as destructive', async () => {
    const { tools } = await client.listTools();
    for (const tool of tools) {
      assert.ok(tool.annotations, `${tool.name} has no annotations`);
      assert.ok(tool.description, `${tool.name} has no description`);
      assert.ok(tool.outputSchema, `${tool.name} declares no output schema`);
    }
    const destructive = tools.filter((tool) => tool.annotations?.destructiveHint === true);
    assert.ok(destructive.length > 0);
    for (const tool of destructive) {
      assert.match(tool.description!, /\[protected\]/, `${tool.name} is marked destructive but does not say so in its description`);
    }
    const readOnly = tools.filter((tool) => tool.annotations?.readOnlyHint === true);
    for (const tool of readOnly) {
      assert.match(tool.description!, /\[read\]/);
      assert.equal(tool.annotations?.destructiveHint, false, `${tool.name} cannot be both read-only and destructive`);
    }
  });

  it('adds dryRun to mutating tools and never to read tools', async () => {
    const { tools } = await client.listTools();
    const read = tools.find((tool) => tool.name === 'stromex.policy.describe')!;
    const write = tools.find((tool) => tool.name === 'github.repo.create')!;
    const protectedTool = tools.find((tool) => tool.name === 'cloudflare.d1.delete')!;

    assert.ok(!('dryRun' in ((read.inputSchema.properties ?? {}) as Record<string, unknown>)));
    assert.ok('dryRun' in ((write.inputSchema.properties ?? {}) as Record<string, unknown>));
    assert.ok('approvalId' in ((protectedTool.inputSchema.properties ?? {}) as Record<string, unknown>));
    assert.ok(!('approvalId' in ((write.inputSchema.properties ?? {}) as Record<string, unknown>)));
  });

  it('answers a read tool with structured content in the shared envelope', async () => {
    const result = (await client.callTool({ name: 'stromex.policy.describe', arguments: {} })) as ToolResultShape;
    assert.notEqual(result.isError, true);
    const envelope = result.structuredContent!;
    assert.equal(envelope['ok'], true);
    assert.equal(envelope['tool'], 'stromex.policy.describe');
    assert.equal(envelope['operationClass'], 'read');
    assert.equal(typeof envelope['auditSeq'], 'number');

    const data = envelope['data'] as { protectedOperations: string; providersConfigured: string[] };
    assert.equal(data.protectedOperations, 'approval');
    assert.equal(data.providersConfigured.length, 7);

    // And the text mirror carries the same JSON, for clients that do not
    // read structuredContent.
    assert.ok(result.content[0]!.text!.includes('"ok": true'));
  });

  it('REFUSES to delete an institutional record, over the wire, without contacting the provider', async () => {
    const result = (await client.callTool({
      name: 'cloudflare.d1.delete',
      arguments: { databaseId: 'whatever', name: 'wec' },
    })) as ToolResultShape;

    assert.equal(result.isError, true);
    const envelope = result.structuredContent!;
    assert.equal(envelope['ok'], false);
    const error = envelope['error'] as { code: string; remediation: string };
    assert.equal(error.code, 'POLICY_PROTECTED_RESOURCE');
    assert.match(error.remediation, /archive, revoke, deactivate or supersede/i);
    assert.equal(envelope['approval'], undefined, 'there is no approval path for an institutional record');
  });

  it('raises an approval request for a protected operation on an ordinary resource', async () => {
    const result = (await client.callTool({
      name: 'cloudflare.r2.delete',
      arguments: { name: 'scratch-bucket' },
    })) as ToolResultShape;

    assert.equal(result.isError, true);
    const approval = result.structuredContent!['approval'] as { approvalId: string; confirmationPhrase: string; howToApprove: string };
    assert.match(approval.approvalId, /^apr_/);
    assert.equal(approval.confirmationPhrase, 'DELETE SCRATCH-BUCKET');
    assert.match(approval.howToApprove, /stromex-mcp approve apr_/);
  });

  it('refuses a purchase because no spending policy has been set', async () => {
    const result = (await client.callTool({
      name: 'vercel.domain.buy',
      arguments: { domain: 'example.com', maxPrice: 20, currency: 'USD' },
    })) as ToolResultShape;
    assert.equal(result.isError, true);
    assert.equal((result.structuredContent!['error'] as { code: string }).code, 'POLICY_SPEND_LIMIT');
  });

  /**
   * The SDK validates arguments against `inputSchema` BEFORE the handler
   * runs, and answers a schema violation itself with a protocol-level
   * error. Two consequences, both asserted rather than assumed:
   *
   *   · the client gets a message naming the field, which is what matters;
   *   · the call never reaches this server's own gate, so it produces NO
   *     audit record. That is a real limitation of the boundary, not a
   *     defect in the audit trail — nothing happened to audit — and it is
   *     recorded in docs/operations.md rather than left to be discovered.
   *
   * The server's own INPUT_INVALID path remains the primary one for the
   * workflow engine, which calls tools directly rather than over the wire.
   */
  it('rejects invalid arguments at the protocol boundary, naming the field', async () => {
    const result = (await client.callTool({ name: 'github.repo.create', arguments: { name: '' } })) as ToolResultShape;
    assert.equal(result.isError, true);
    assert.match(result.content[0]!.text!, /Invalid arguments for tool github\.repo\.create/);
    assert.match(result.content[0]!.text!, /at name/);
    assert.equal(result.structuredContent, undefined, 'a protocol-level rejection carries no envelope');
  });

  it('rejects an unknown tool as a protocol error', async () => {
    const result = (await client.callTool({ name: 'github.repo.obliterate', arguments: {} })) as ToolResultShape;
    assert.equal(result.isError, true);
    assert.match(result.content[0]!.text!, /not found|Unknown tool/i);
  });

  it('has audited every one of those calls, refusals included, in an unbroken chain', async () => {
    const audit = (await client.callTool({ name: 'stromex.audit.query', arguments: { limit: 100 } })) as ToolResultShape;
    const records = (audit.structuredContent!['data'] as { records: Array<{ tool: string; outcome: string; resource?: string }> }).records;

    const outcomes = new Map(records.map((record) => [record.tool, record.outcome]));
    assert.equal(outcomes.get('cloudflare.d1.delete'), 'denied');
    assert.equal(outcomes.get('cloudflare.r2.delete'), 'approval_required');
    assert.equal(outcomes.get('vercel.domain.buy'), 'denied');
    assert.equal(outcomes.get('stromex.policy.describe'), 'ok');
    assert.equal(
      outcomes.get('github.repo.create'),
      undefined,
      'a call rejected at the protocol boundary never reached the gate, so there is nothing to audit',
    );

    const verify = (await client.callTool({ name: 'stromex.audit.verify', arguments: {} })) as ToolResultShape;
    const result = verify.structuredContent!['data'] as { ok: boolean; total: number };
    assert.equal(result.ok, true);
    // Five calls preceded this one. `verify` audits itself only after it
    // has run, so it does not count its own record — which is correct: a
    // record cannot attest to a chain it is not yet part of.
    assert.ok(result.total >= 5, `expected at least 5 records, saw ${result.total}`);
  });

  it('exposes its policy and its audit tail as resources', async () => {
    const { resources } = await client.listResources();
    assert.deepEqual(resources.map((resource) => resource.uri).sort(), ['stromex://audit/recent', 'stromex://policy']);

    const policy = await client.readResource({ uri: 'stromex://policy' });
    const first = policy.contents[0]! as { text?: string };
    const parsed = JSON.parse(first.text!) as { protectedResourcePatterns: string[] };
    assert.ok(parsed.protectedResourcePatterns.includes('*transcript*'));
  });

  it('lists workflows and reports which are available on this instance', async () => {
    const result = (await client.callTool({ name: 'stromex.workflow.list', arguments: {} })) as ToolResultShape;
    const workflows = (result.structuredContent!['data'] as { workflows: Array<{ name: string; available: boolean }> }).workflows;
    assert.ok(workflows.length >= 8);
    assert.ok(workflows.every((workflow) => workflow.available), 'with all seven providers configured, every workflow should be available');
  });

  it('runs a workflow in dry-run without touching a provider', async () => {
    const result = (await client.callTool({
      name: 'stromex.workflow.run',
      arguments: { workflow: 'project.bootstrap', input: { name: 'e2e-demo', owner: 'acme' }, dryRun: true },
    })) as ToolResultShape;

    const envelope = result.structuredContent!;
    assert.equal(envelope['dryRun'], true);
    const report = envelope['data'] as { runId: string; steps: Array<{ id: string; status: string }> };
    assert.match(report.runId, /^wfr_/);
    assert.equal(report.steps[0]!.status, 'ok', 'a dry-run step reports what it would do');
  });
});
