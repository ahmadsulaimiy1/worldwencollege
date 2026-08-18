/**
 * Mock-provider integration tests.
 *
 * These exercise the adapters' REAL request construction and REAL
 * response handling against a scripted provider that enforces the API's
 * own contract (`src/test/support/scripted-fetch.ts`). An adapter that
 * calls the wrong path, forgets an auth header, or mishandles a provider's
 * error shape fails here rather than in production.
 *
 * What they do NOT prove is that the paths are the ones the providers
 * actually serve. That is stated at `SEB §28.5` and closes only against a
 * real credential.
 */

import assert from 'node:assert/strict';
import { describe, it } from 'node:test';

import { invokeTool } from '../../core/registry.js';
import { SecretRef } from '../../core/secret.js';
import { StromexError } from '../../core/errors.js';
import { harness, tool } from '../support/harness.js';
import { scriptedProvider } from '../support/scripted-fetch.js';

import { GitHubClient } from '../../providers/github/client.js';
import { githubTools } from '../../providers/github/tools.js';
import { CloudflareClient } from '../../providers/cloudflare/client.js';
import { cloudflareTools } from '../../providers/cloudflare/tools.js';
import { NeonClient } from '../../providers/neon/client.js';
import { neonTools } from '../../providers/neon/tools.js';
import { VercelClient } from '../../providers/vercel/client.js';
import { vercelTools } from '../../providers/vercel/tools.js';
import { ClerkClient } from '../../providers/clerk/client.js';
import { clerkTools } from '../../providers/clerk/tools.js';
import { ResendClient } from '../../providers/resend/client.js';
import { resendTools } from '../../providers/resend/tools.js';
import { BrevoClient } from '../../providers/brevo/client.js';
import { brevoTools } from '../../providers/brevo/tools.js';

const secret = (name: string, value: string) => new SecretRef(name, value, 'env');

describe('GitHub adapter', () => {
  it('sends the API version header and a bearer token, and reports the viewer', async () => {
    const provider = scriptedProvider({
      requireHeader: 'authorization',
      requireHeaderPrefix: 'Bearer ',
      routes: [{ method: 'GET', path: '/user', body: { login: 'octocat', id: 1, type: 'User' } }],
    });
    const h = harness().withClient('github', new GitHubClient({ token: secret('GITHUB_TOKEN', 'gh-token-value-1234'), fetchImpl: provider.fetch }));

    const envelope = await invokeTool(tool(githubTools(), 'github.viewer.get'), {}, h.context());
    assert.equal(envelope.ok, true);
    assert.match(envelope.summary, /octocat/);
    assert.equal(provider.requests[0]!.headers['x-github-api-version'], '2022-11-28');
    assert.equal(provider.requests[0]!.headers['accept'], 'application/vnd.github+json');
  });

  it('answers 401 when the credential is absent, exactly as GitHub would', async () => {
    const provider = scriptedProvider({
      requireHeader: 'authorization',
      requireHeaderPrefix: 'Bearer ',
      routes: [{ method: 'GET', path: '/user', body: { login: 'octocat' } }],
    });
    const client = new GitHubClient({ token: secret('GITHUB_TOKEN', ''), fetchImpl: provider.fetch });
    await assert.rejects(client.viewer(), (error: StromexError) => error.code === 'CREDENTIAL_REJECTED');
  });

  it('builds a real multi-file commit: blobs, one tree, one commit, one ref update', async () => {
    const provider = scriptedProvider({
      requireHeader: 'authorization',
      routes: [
        { method: 'GET', path: '/repos/acme/site/git/ref/heads/main', body: { ref: 'refs/heads/main', object: { sha: 'headsha' } } },
        { method: 'GET', path: '/repos/acme/site/git/commits/headsha', body: { tree: { sha: 'basetree' } } },
        { method: 'POST', path: '/repos/acme/site/git/blobs', body: { sha: 'blobsha' } },
        { method: 'POST', path: '/repos/acme/site/git/trees', body: { sha: 'newtree' } },
        { method: 'POST', path: '/repos/acme/site/git/commits', body: { sha: 'newcommit' } },
        { method: 'PATCH', path: '/repos/acme/site/git/refs/heads/main', body: { ref: 'refs/heads/main' } },
      ],
    });
    const h = harness().withClient('github', new GitHubClient({ token: secret('GITHUB_TOKEN', 'gh-token-value-1234'), fetchImpl: provider.fetch }));

    const envelope = await invokeTool(
      tool(githubTools(), 'github.commit.push'),
      { owner: 'acme', repo: 'site', branch: 'main', message: 'add two files', files: [{ path: 'a.txt', content: 'A' }, { path: 'b.txt', content: 'B' }] },
      h.context(),
    );

    assert.equal(envelope.ok, true);
    assert.equal(provider.for('/repos/acme/site/git/blobs').length, 2, 'one blob per file');
    assert.equal(provider.for('/repos/acme/site/git/trees').length, 1, 'exactly one tree');
    assert.equal(provider.for('/repos/acme/site/git/commits').length, 1, 'exactly one commit, not one per file');
    const blob = provider.for('/repos/acme/site/git/blobs')[0]!.body as { content: string; encoding: string };
    assert.equal(blob.encoding, 'base64');
    assert.equal(Buffer.from(blob.content, 'base64').toString('utf8'), 'A');
  });

  it('sends a repository secret as a sealed box, never as plaintext', async () => {
    // A real X25519 public key, so the sealed box is genuinely computed.
    const sodium = (await import('libsodium-wrappers')).default;
    await sodium.ready;
    const keypair = sodium.crypto_box_keypair();
    const publicKey = sodium.to_base64(keypair.publicKey, sodium.base64_variants.ORIGINAL);

    const provider = scriptedProvider({
      requireHeader: 'authorization',
      routes: [
        { method: 'GET', path: '/repos/acme/site/actions/secrets/public-key', body: { key: publicKey, key_id: 'kid-1' } },
        { method: 'PUT', path: '/repos/acme/site/actions/secrets/DATABASE_URL', status: 204 },
      ],
    });
    const h = harness().withClient('github', new GitHubClient({ token: secret('GITHUB_TOKEN', 'gh-token-value-1234'), fetchImpl: provider.fetch }));

    const envelope = await invokeTool(
      tool(githubTools(), 'github.secret.put'),
      { owner: 'acme', repo: 'site', name: 'DATABASE_URL', value: 'postgres://u:p@h/db' },
      h.context(),
    );
    assert.equal(envelope.ok, true);

    const put = provider.for('/repos/acme/site/actions/secrets/DATABASE_URL')[0]!;
    const sent = put.body as { encrypted_value: string; key_id: string };
    assert.equal(sent.key_id, 'kid-1');
    assert.ok(!put.rawBody!.includes('postgres://'), 'the plaintext must never appear on the wire');
    // And it really is a sealed box: the recipient can open it.
    const opened = sodium.crypto_box_seal_open(
      sodium.from_base64(sent.encrypted_value, sodium.base64_variants.ORIGINAL),
      keypair.publicKey,
      keypair.privateKey,
    );
    assert.equal(sodium.to_string(opened), 'postgres://u:p@h/db');
  });

  it('accepts a vault handle in place of a literal secret', async () => {
    const sodium = (await import('libsodium-wrappers')).default;
    await sodium.ready;
    const keypair = sodium.crypto_box_keypair();
    const provider = scriptedProvider({
      requireHeader: 'authorization',
      routes: [
        {
          method: 'GET',
          path: '/repos/acme/site/actions/secrets/public-key',
          body: { key: sodium.to_base64(keypair.publicKey, sodium.base64_variants.ORIGINAL), key_id: 'kid-1' },
        },
        { method: 'PUT', path: '/repos/acme/site/actions/secrets/DATABASE_URL', status: 204 },
      ],
    });
    const h = harness().withClient('github', new GitHubClient({ token: secret('GITHUB_TOKEN', 'gh-token-value-1234'), fetchImpl: provider.fetch }));
    const entry = h.vault.store({ value: 'postgres://from-the-vault/db', label: 'neon', origin: 'test' });

    const envelope = await invokeTool(
      tool(githubTools(), 'github.secret.put'),
      { owner: 'acme', repo: 'site', name: 'DATABASE_URL', valueFromHandle: entry.handle },
      h.context(),
    );
    assert.equal(envelope.ok, true);
    const opened = sodium.crypto_box_seal_open(
      sodium.from_base64((provider.for('/repos/acme/site/actions/secrets/DATABASE_URL')[0]!.body as { encrypted_value: string }).encrypted_value, sodium.base64_variants.ORIGINAL),
      keypair.publicKey,
      keypair.privateKey,
    );
    assert.equal(sodium.to_string(opened), 'postgres://from-the-vault/db');
  });

  it('surfaces GitHub\'s own error message and field detail', async () => {
    const provider = scriptedProvider({
      requireHeader: 'authorization',
      routes: [
        {
          method: 'POST',
          path: '/user/repos',
          status: 422,
          body: { message: 'Repository creation failed', errors: [{ field: 'name', message: 'name already exists on this account' }] },
        },
      ],
    });
    const h = harness().withClient('github', new GitHubClient({ token: secret('GITHUB_TOKEN', 'gh-token-value-1234'), fetchImpl: provider.fetch }));
    const envelope = await invokeTool(tool(githubTools(), 'github.repo.create'), { name: 'site' }, h.context());
    assert.equal(envelope.ok, false);
    assert.equal(envelope.error?.code, 'INPUT_INVALID');
    assert.match(envelope.error!.message, /name already exists on this account/);
  });
});

describe('Cloudflare adapter', () => {
  const cfClient = (fetchImpl: ReturnType<typeof scriptedProvider>['fetch'], accountId = 'acct-1') =>
    new CloudflareClient({ token: secret('CLOUDFLARE_API_TOKEN', 'cf-token-value-1234'), accountId, fetchImpl });

  it('treats HTTP 200 with success:false as a refusal, not as an empty result', async () => {
    const provider = scriptedProvider({
      requireHeader: 'authorization',
      routes: [
        {
          method: 'GET',
          path: '/client/v4/accounts/acct-1/workers/scripts',
          status: 200,
          body: { success: false, errors: [{ code: 10000, message: 'Authentication error' }], result: null },
        },
      ],
    });
    const h = harness().withClient('cloudflare', cfClient(provider.fetch));
    const envelope = await invokeTool(tool(cloudflareTools(), 'cloudflare.worker.list'), {}, h.context());
    assert.equal(envelope.ok, false);
    assert.match(envelope.error!.message, /10000: Authentication error/);
  });

  it('refuses to guess when the token sees more than one account', async () => {
    const provider = scriptedProvider({
      requireHeader: 'authorization',
      routes: [
        { method: 'GET', path: '/client/v4/accounts', body: { success: true, result: [{ id: 'a', name: 'First' }, { id: 'b', name: 'Second' }] } },
      ],
    });
    const client = new CloudflareClient({ token: secret('CLOUDFLARE_API_TOKEN', 'cf-token-value-1234'), fetchImpl: provider.fetch });
    await assert.rejects(client.accountId(), (error: StromexError) => {
      assert.equal(error.code, 'CONFIG_INVALID');
      assert.match(error.remediation, /CLOUDFLARE_ACCOUNT_ID/);
      return true;
    });
  });

  it('uploads a Worker as multipart with a metadata part naming the entry module', async () => {
    const provider = scriptedProvider({
      requireHeader: 'authorization',
      routes: [{ method: 'PUT', path: '/client/v4/accounts/acct-1/workers/scripts/api', body: { success: true, result: { id: 'api' } } }],
    });
    const h = harness().withClient('cloudflare', cfClient(provider.fetch));
    const envelope = await invokeTool(
      tool(cloudflareTools(), 'cloudflare.worker.deploy'),
      { name: 'api', moduleContent: 'export default {};', compatibilityDate: '2026-08-01' },
      h.context(),
    );
    assert.equal(envelope.ok, true);
    const parts = (provider.requests[0]!.body as { multipart: Record<string, string> }).multipart;
    const metadata = JSON.parse(parts['metadata']!) as Record<string, unknown>;
    assert.equal(metadata['main_module'], 'worker.js');
    assert.equal(metadata['compatibility_date'], '2026-08-01');
    assert.equal(parts['worker.js'], 'export default {};', 'the module itself is a separate part, sent verbatim');
  });

  it('warns when no compatibility date is given, because Cloudflare\'s default is deliberately old', async () => {
    const provider = scriptedProvider({
      requireHeader: 'authorization',
      routes: [{ method: 'PUT', path: '/client/v4/accounts/acct-1/workers/scripts/api', body: { success: true, result: {} } }],
    });
    const h = harness().withClient('cloudflare', cfClient(provider.fetch));
    const envelope = await invokeTool(tool(cloudflareTools(), 'cloudflare.worker.deploy'), { name: 'api', moduleContent: 'export default {};' }, h.context());
    assert.equal(envelope.ok, true);
    assert.match(envelope.warnings!.join(' '), /compatibilityDate/);
  });

  it('captures the full DNS record as a pre-image before deleting it', async () => {
    const record = { id: 'rec-1', type: 'MX', name: 'example.com', content: 'mail.example.com', ttl: 3600, priority: 10 };
    const provider = scriptedProvider({
      requireHeader: 'authorization',
      routes: [
        { method: 'GET', path: '/client/v4/zones/zone-1/dns_records/rec-1', body: { success: true, result: record } },
        { method: 'DELETE', path: '/client/v4/zones/zone-1/dns_records/rec-1', body: { success: true, result: { id: 'rec-1' } } },
      ],
    });
    const h = harness().withClient('cloudflare', cfClient(provider.fetch));
    const definition = tool(cloudflareTools(), 'cloudflare.dns.delete');

    const first = await invokeTool(definition, { zoneId: 'zone-1', recordId: 'rec-1' }, h.context());
    h.approvals.approve(first.approval!.approvalId, { approvedBy: 'operator', channel: 'cli', phrase: first.approval!.confirmationPhrase });
    const second = await invokeTool(definition, { zoneId: 'zone-1', recordId: 'rec-1', approvalId: first.approval!.approvalId }, h.context());

    assert.equal(second.ok, true);
    const entry = JSON.parse(h.journalLines[0]!) as { preImage: typeof record; restoreHint: string };
    assert.equal(entry.preImage.priority, 10, 'the whole record is recorded, so it can be recreated exactly');
    assert.match(entry.restoreHint, /cloudflare\.dns\.create/);
  });

  it('refuses to delete a D1 database whose name is an institutional record', async () => {
    const provider = scriptedProvider({ requireHeader: 'authorization', routes: [] });
    const h = harness().withClient('cloudflare', cfClient(provider.fetch));
    const envelope = await invokeTool(tool(cloudflareTools(), 'cloudflare.d1.delete'), { databaseId: 'db-1', name: 'aipc' }, h.context());
    assert.equal(envelope.ok, false);
    assert.equal(envelope.error?.code, 'POLICY_PROTECTED_RESOURCE');
    assert.equal(provider.requests.length, 0, 'nothing was sent to Cloudflare at all');
  });
});

describe('Neon adapter', () => {
  it('never returns the connection string — only a handle and the non-secret components', async () => {
    const provider = scriptedProvider({
      requireHeader: 'authorization',
      routes: [
        {
          method: 'GET',
          path: '/api/v2/projects/proj-1/connection_uri',
          body: { uri: 'postgresql://appuser:s3cr3t-p4ssw0rd@ep-1.eu-west-2.aws.neon.tech/appdb?sslmode=require' },
        },
      ],
    });
    const h = harness().withClient('neon', new NeonClient({ apiKey: secret('NEON_API_KEY', 'neon-key-value-1234'), fetchImpl: provider.fetch }));

    const envelope = await invokeTool(
      tool(neonTools(), 'neon.connection.get'),
      { projectId: 'proj-1', databaseName: 'appdb', roleName: 'appuser' },
      h.context(),
    );

    assert.equal(envelope.ok, true);
    const serialised = JSON.stringify(envelope);
    assert.ok(!serialised.includes('s3cr3t-p4ssw0rd'), 'the password must never leave in a result');
    assert.ok(!serialised.includes('postgresql://appuser:'), 'nor the URI');
    const data = envelope.data as { handle: string; host: string; database: string; role: string };
    assert.match(data.handle, /^vh_/);
    assert.equal(data.host, 'ep-1.eu-west-2.aws.neon.tech');
    assert.equal(data.database, 'appdb');
    assert.equal(data.role, 'appuser');
    assert.equal(h.vault.reveal(data.handle).includes('s3cr3t-p4ssw0rd'), true, 'and the value is genuinely in the vault');
  });

  it('applies only unapplied migrations, in name order, and reports drift without re-running', async () => {
    const executed: string[][] = [];
    const client = new NeonClient({
      apiKey: secret('NEON_API_KEY', 'neon-key-value-1234'),
      fetchImpl: scriptedProvider({ routes: [] }).fetch,
      sqlRunner: async (_uri, statements) => {
        executed.push(statements);
        if (statements[0]!.startsWith('SELECT name, checksum')) {
          return [{ command: 'SELECT', rowCount: 1, rows: [{ name: '0001-init.sql', checksum: 'changed-since' }], fields: [] }];
        }
        return [{ command: 'OK', rowCount: 0, rows: [], fields: [] }];
      },
    });

    const result = await client.applyMigrations('postgres://ignored', [
      { name: '0002-second.sql', sql: 'CREATE TABLE b (id int);' },
      { name: '0001-init.sql', sql: 'CREATE TABLE a (id int);' },
    ]);

    assert.deepEqual(result.applied, ['0002-second.sql']);
    assert.deepEqual(result.skipped, []);
    assert.equal(result.drifted.length, 1);
    assert.equal(result.drifted[0]!.name, '0001-init.sql');
    // The drifted migration was never re-executed.
    assert.ok(!executed.flat().some((statement) => statement.includes('CREATE TABLE a')));
    // The applied one ran together with its ledger insert, in one transaction.
    const applied = executed.find((statements) => statements[0]!.includes('CREATE TABLE b'))!;
    assert.equal(applied.length, 2);
    assert.match(applied[1]!, /INSERT INTO stromex_migrations/);
  });

  it('says plainly when pg_stat_statements is absent rather than returning an empty list', async () => {
    const client = new NeonClient({
      apiKey: secret('NEON_API_KEY', 'neon-key-value-1234'),
      fetchImpl: scriptedProvider({ routes: [] }).fetch,
      sqlRunner: async () => [{ command: 'SELECT', rowCount: 0, rows: [], fields: [] }],
    });
    const h = harness().withClient('neon', client);
    const entry = h.vault.store({ value: 'postgres://user:pass@host/db', label: 'l', origin: 'test' });
    const envelope = await invokeTool(tool(neonTools(), 'neon.performance.slow-queries'), { connectionHandle: entry.handle }, h.context());

    assert.equal(envelope.ok, true);
    assert.match(envelope.summary, /not enabled/);
    assert.match(envelope.warnings!.join(' '), /CREATE EXTENSION pg_stat_statements/);
  });
});

describe('Vercel adapter', () => {
  it('threads the team id onto every request', async () => {
    const provider = scriptedProvider({
      requireHeader: 'authorization',
      routes: [{ method: 'GET', path: '/v10/projects', query: { teamId: 'team-1' }, body: { projects: [{ id: 'p1', name: 'site' }] } }],
    });
    const h = harness().withClient('vercel', new VercelClient({ token: secret('VERCEL_TOKEN', 'vercel-token-1234'), teamId: 'team-1', fetchImpl: provider.fetch }));
    const envelope = await invokeTool(tool(vercelTools(), 'vercel.project.list'), {}, h.context());
    assert.equal(envelope.ok, true);
    assert.equal(provider.requests[0]!.query['teamId'], 'team-1');
  });

  it('sets an environment variable with upsert, so a re-run does not fail', async () => {
    const provider = scriptedProvider({
      requireHeader: 'authorization',
      routes: [{ method: 'POST', path: '/v10/projects/site/env', query: { upsert: 'true' }, body: { created: { id: 'e1', key: 'DATABASE_URL' } } }],
    });
    const h = harness().withClient('vercel', new VercelClient({ token: secret('VERCEL_TOKEN', 'vercel-token-1234'), fetchImpl: provider.fetch }));
    const envelope = await invokeTool(
      tool(vercelTools(), 'vercel.env.set'),
      { project: 'site', key: 'DATABASE_URL', value: 'postgres://x', target: ['production'] },
      h.context(),
    );
    assert.equal(envelope.ok, true);
    assert.equal((provider.requests[0]!.body as { type: string }).type, 'encrypted', 'encrypted by default');
  });

  it('refuses a domain purchase while the spending policy is off, without calling the registrar', async () => {
    const provider = scriptedProvider({ requireHeader: 'authorization', routes: [] });
    const h = harness().withClient('vercel', new VercelClient({ token: secret('VERCEL_TOKEN', 'vercel-token-1234'), fetchImpl: provider.fetch }));
    const envelope = await invokeTool(
      tool(vercelTools(), 'vercel.domain.buy'),
      { domain: 'example.com', maxPrice: 20, currency: 'USD' },
      h.context(),
    );
    assert.equal(envelope.ok, false);
    assert.equal(envelope.error?.code, 'POLICY_SPEND_LIMIT');
    assert.equal(provider.requests.length, 0);
  });

  it('does not buy when the quoted price exceeds the ceiling, even with a spending policy', async () => {
    const provider = scriptedProvider({
      requireHeader: 'authorization',
      routes: [{ method: 'GET', path: '/v1/registrar/domains/example.com/price', body: { price: 95, currency: 'USD', period: 1 } }],
    });
    const h = harness({ policy: { spending: { enabled: true, currency: 'USD', maxSinglePurchase: 100, monthlyCap: 500 } } }).withClient(
      'vercel',
      new VercelClient({ token: secret('VERCEL_TOKEN', 'vercel-token-1234'), fetchImpl: provider.fetch }),
    );
    const envelope = await invokeTool(
      tool(vercelTools(), 'vercel.domain.buy'),
      { domain: 'example.com', maxPrice: 20, currency: 'USD' },
      h.context(),
    );
    assert.equal(envelope.ok, true, 'this is a decision, not an error');
    assert.match(envelope.summary, /Not bought/);
    assert.equal(provider.for('/v1/registrar/domains/example.com/buy').length, 0);
  });
});

describe('Clerk adapter', () => {
  it('surfaces Clerk\'s long_message, which is the useful half of its error shape', async () => {
    const provider = scriptedProvider({
      requireHeader: 'authorization',
      routes: [
        {
          method: 'POST',
          path: '/v1/users',
          status: 422,
          body: { errors: [{ code: 'form_identifier_exists', message: 'already exists', long_message: 'That email address is taken by another user.' }] },
        },
      ],
    });
    const h = harness().withClient('clerk', new ClerkClient({ secretKey: secret('CLERK_SECRET_KEY', 'sk_test_value_1234'), fetchImpl: provider.fetch }));
    const envelope = await invokeTool(tool(clerkTools(), 'clerk.user.create'), { emailAddress: ['a@example.com'] }, h.context());
    assert.equal(envelope.ok, false);
    assert.match(envelope.error!.message, /taken by another user/);
  });

  it('falls back from create-membership to update-membership when the user is already a member', async () => {
    const provider = scriptedProvider({
      requireHeader: 'authorization',
      routes: [
        { method: 'POST', path: '/v1/organizations/org-1/memberships', status: 422, body: { errors: [{ message: 'already a member' }] } },
        { method: 'PATCH', path: '/v1/organizations/org-1/memberships/user-1', body: { id: 'mem-1', role: 'org:admin' } },
      ],
    });
    const h = harness().withClient('clerk', new ClerkClient({ secretKey: secret('CLERK_SECRET_KEY', 'sk_test_value_1234'), fetchImpl: provider.fetch }));
    const envelope = await invokeTool(
      tool(clerkTools(), 'clerk.membership.set'),
      { organizationId: 'org-1', userId: 'user-1', role: 'org:admin' },
      h.context(),
    );
    assert.equal(envelope.ok, true);
    assert.match(envelope.summary, /Changed user-1 to org:admin/);
  });

  it('offers ban as a write and delete as protected', () => {
    const tools = clerkTools();
    assert.equal(tool(tools, 'clerk.user.ban').operationClass, 'write');
    assert.equal(tool(tools, 'clerk.user.delete').operationClass, 'protected');
    assert.match(tool(tools, 'clerk.user.delete').description, /clerk\.user\.ban, which is reversible/);
  });
});

describe('Resend adapter', () => {
  it('sends an email and maps reply-to onto the provider\'s field name', async () => {
    const provider = scriptedProvider({
      requireHeader: 'authorization',
      requireHeaderPrefix: 'Bearer ',
      routes: [{ method: 'POST', path: '/emails', body: { id: 'email-1' } }],
    });
    const h = harness().withClient('resend', new ResendClient({ apiKey: secret('RESEND_API_KEY', 're_value_12345678'), fetchImpl: provider.fetch }));
    const envelope = await invokeTool(
      tool(resendTools(), 'resend.email.send'),
      { from: 'admissions@example.com', to: ['a@example.com'], subject: 'Welcome', text: 'Hello', replyTo: ['reply@example.com'] },
      h.context(),
    );
    assert.equal(envelope.ok, true);
    assert.deepEqual((provider.requests[0]!.body as { reply_to: string[] }).reply_to, ['reply@example.com']);
  });

  it('puts a newly minted API key into the vault and does not return the token', async () => {
    const provider = scriptedProvider({
      requireHeader: 'authorization',
      routes: [{ method: 'POST', path: '/api-keys', body: { id: 'key-1', token: 're_the_actual_token_value' } }],
    });
    const h = harness().withClient('resend', new ResendClient({ apiKey: secret('RESEND_API_KEY', 're_value_12345678'), fetchImpl: provider.fetch }));
    const envelope = await invokeTool(tool(resendTools(), 'resend.api-key.create'), { name: 'site-sender' }, h.context());

    assert.equal(envelope.ok, true);
    assert.ok(!JSON.stringify(envelope).includes('re_the_actual_token_value'));
    const data = envelope.data as { handle: string };
    assert.equal(h.vault.reveal(data.handle), 're_the_actual_token_value');
    assert.equal((provider.requests[0]!.body as { permission: string }).permission, 'sending_access', 'least privilege by default');
  });

  it('does not send a real message under dryRun', async () => {
    const provider = scriptedProvider({ requireHeader: 'authorization', routes: [] });
    const h = harness().withClient('resend', new ResendClient({ apiKey: secret('RESEND_API_KEY', 're_value_12345678'), fetchImpl: provider.fetch }));
    const envelope = await invokeTool(
      tool(resendTools(), 'resend.email.send'),
      { from: 'a@example.com', to: ['b@example.com'], subject: 's', text: 't', dryRun: true },
      h.context(),
    );
    assert.equal(envelope.ok, true);
    assert.equal(envelope.dryRun, true);
    assert.equal(provider.requests.length, 0);
  });
});

describe('Brevo adapter', () => {
  it('authenticates with the api-key header rather than a bearer token', async () => {
    const provider = scriptedProvider({
      requireHeader: 'api-key',
      routes: [{ method: 'GET', path: '/v3/account', body: { email: 'ops@example.com', plan: [] } }],
    });
    const h = harness().withClient('brevo', new BrevoClient({ apiKey: secret('BREVO_API_KEY', 'xkeysib-value-1234'), fetchImpl: provider.fetch }));
    const envelope = await invokeTool(tool(brevoTools(), 'brevo.account.get'), {}, h.context());
    assert.equal(envelope.ok, true);
    assert.equal(provider.requests[0]!.headers['api-key'], 'xkeysib-value-1234');
    assert.equal(provider.requests[0]!.headers['authorization'], undefined);
  });

  it('creates a contact with updateEnabled, so a re-run is idempotent', async () => {
    const provider = scriptedProvider({
      requireHeader: 'api-key',
      routes: [{ method: 'POST', path: '/v3/contacts', body: { id: 42 } }],
    });
    const h = harness().withClient('brevo', new BrevoClient({ apiKey: secret('BREVO_API_KEY', 'xkeysib-value-1234'), fetchImpl: provider.fetch }));
    await invokeTool(tool(brevoTools(), 'brevo.contact.upsert'), { email: 'a@example.com' }, h.context());
    assert.equal((provider.requests[0]!.body as { updateEnabled: boolean }).updateEnabled, true);
  });

  it('offers suppression as a write and deletion as protected', () => {
    const tools = brevoTools();
    assert.equal(tool(tools, 'brevo.contact.suppress').operationClass, 'write');
    assert.equal(tool(tools, 'brevo.contact.delete').operationClass, 'protected');
  });
});

describe('the HTTP client, through a real adapter', () => {
  it('retries a 500 and succeeds, without the caller knowing', async () => {
    const provider = scriptedProvider({
      requireHeader: 'authorization',
      routes: [
        {
          method: 'GET',
          path: '/user',
          sequence: [
            { status: 500, body: { message: 'server error' } },
            { status: 200, body: { login: 'octocat', id: 1, type: 'User' } },
          ],
        },
      ],
    });
    const h = harness().withClient('github', new GitHubClient({ token: secret('GITHUB_TOKEN', 'gh-token-value-1234'), fetchImpl: provider.fetch }));
    const envelope = await invokeTool(tool(githubTools(), 'github.viewer.get'), {}, h.context());
    assert.equal(envelope.ok, true);
    assert.equal(provider.requests.length, 2);
  });

  it('does not retry a 404 — the provider is healthy and the resource is not there', async () => {
    const provider = scriptedProvider({
      requireHeader: 'authorization',
      routes: [{ method: 'GET', path: '/repos/acme/missing', status: 404, body: { message: 'Not Found' } }],
    });
    const h = harness().withClient('github', new GitHubClient({ token: secret('GITHUB_TOKEN', 'gh-token-value-1234'), fetchImpl: provider.fetch }));
    const envelope = await invokeTool(tool(githubTools(), 'github.repo.get'), { owner: 'acme', repo: 'missing' }, h.context());
    assert.equal(envelope.ok, false);
    assert.equal(envelope.error?.code, 'PROVIDER_NOT_FOUND');
    assert.equal(provider.requests.length, 1);
  });

  it('explains an HTML response instead of failing with a JSON parse error', async () => {
    const provider = scriptedProvider({
      requireHeader: 'authorization',
      routes: [{ method: 'GET', path: '/user', body: '<html><body>Captive portal</body></html>', headers: { 'content-type': 'text/html' } }],
    });
    const client = new GitHubClient({ token: secret('GITHUB_TOKEN', 'gh-token-value-1234'), fetchImpl: provider.fetch });
    await assert.rejects(client.viewer(), (error: StromexError) => {
      assert.match(error.message, /not JSON/);
      assert.match(error.remediation, /proxy, captive portal/);
      return true;
    });
  });
});
