/**
 * Cloudflare tool surface.
 *
 * Two limitations are stated in the tool descriptions themselves rather
 * than only in the documentation, because the description is what a model
 * reads at the moment it decides (`SEB §16.9`):
 *
 *   · Pages **direct asset upload** is a versioned multi-step protocol
 *     only Wrangler tracks reliably, so `pages.deploy` triggers a build
 *     from the connected git branch and says so.
 *   · Worker log **tailing** needs a WebSocket session, so
 *     `worker.tail.create` returns the session and leaves streaming to the
 *     client.
 */

import { z } from 'zod';
import { defineTool, type ToolDefinition } from '../../core/registry.js';
import { resolveSecretArgument } from '../../core/vault.js';
import { clientFor, listPayload, plan } from '../support.js';
import type { CloudflareClient } from './client.js';

const cf = (ctx: Parameters<typeof clientFor>[0]) => clientFor<CloudflareClient>(ctx, 'cloudflare');

export function cloudflareTools(): ToolDefinition[] {
  return [
    defineTool({
      name: 'cloudflare.account.list',
      title: 'Cloudflare — list accounts',
      description: 'Lists the accounts the configured token can see. Use this to find the account id when CLOUDFLARE_ACCOUNT_ID is not set.',
      provider: 'cloudflare',
      operationClass: 'read',
      inputSchema: {},
      handler: async (_args, ctx) => {
        const accounts = await cf(ctx).listAccounts();
        return listPayload('accounts', accounts, ['id', 'name']);
      },
    }),

    // ── Workers ─────────────────────────────────────────────────────
    defineTool({
      name: 'cloudflare.worker.list',
      title: 'Cloudflare — list Workers',
      description: 'Lists the Worker scripts in the account.',
      provider: 'cloudflare',
      operationClass: 'read',
      inputSchema: {},
      handler: async (_args, ctx) => {
        const workers = await cf(ctx).listWorkers();
        return listPayload('Workers', workers, ['id', 'created_on', 'modified_on', 'usage_model']);
      },
    }),

    defineTool({
      name: 'cloudflare.worker.get',
      title: 'Cloudflare — get Worker settings',
      description: 'Returns a Worker\'s settings, including its bindings and compatibility date.',
      provider: 'cloudflare',
      operationClass: 'read',
      inputSchema: { name: z.string().min(1) },
      handler: async (args, ctx) => {
        const worker = await cf(ctx).getWorker(args.name);
        return { summary: `Worker ${args.name}`, data: worker };
      },
    }),

    defineTool({
      name: 'cloudflare.worker.deploy',
      title: 'Cloudflare — deploy a Worker',
      description:
        'Uploads an ES-module Worker with its bindings and compatibility settings. Suits a single-module Worker; a bundled multi-module project should be built first and its bundle passed as moduleContent.',
      provider: 'cloudflare',
      operationClass: 'write',
      inputSchema: {
        name: z.string().min(1),
        moduleContent: z.string().min(1).describe('The complete ES module source.'),
        moduleName: z.string().optional().describe('Entry module filename. Defaults to worker.js.'),
        compatibilityDate: z.string().optional().describe('e.g. 2026-08-01. Cloudflare defaults to an old date when omitted.'),
        compatibilityFlags: z.array(z.string()).optional(),
        bindings: z.array(z.record(z.string(), z.unknown())).optional().describe('Binding objects exactly as the Cloudflare API defines them.'),
      },
      resource: (args) => args.name,
      handler: async (args, ctx) => {
        const moduleName = args.moduleName ?? 'worker.js';
        if (ctx.dryRun) {
          return plan(`Would deploy Worker ${args.name}`, {
            name: args.name,
            moduleName,
            bytes: args.moduleContent.length,
            compatibilityDate: args.compatibilityDate,
            bindings: args.bindings,
          });
        }
        const result = await cf(ctx).uploadWorker({ ...args, moduleName });
        const warnings = args.compatibilityDate
          ? undefined
          : ['No compatibilityDate was given, so Cloudflare applied its default, which is deliberately old. Set one explicitly.'];
        return { summary: `Deployed Worker ${args.name}`, data: result, ...(warnings ? { warnings } : {}) };
      },
    }),

    defineTool({
      name: 'cloudflare.worker.delete',
      title: 'Cloudflare — delete a Worker',
      description: 'Removes a Worker script and every route bound to it. Protected: traffic to its routes stops immediately.',
      provider: 'cloudflare',
      operationClass: 'protected',
      inputSchema: { name: z.string().min(1) },
      resource: (args) => args.name,
      preImage: async (args, ctx) => ({
        preImage: await cf(ctx).getWorker(args.name),
        restoreHint: `Redeploy with cloudflare.worker.deploy using the recorded bindings and compatibility settings. The SCRIPT SOURCE is not in this pre-image — recover it from version control.`,
      }),
      handler: async (args, ctx) => {
        if (ctx.dryRun) return plan(`Would delete Worker ${args.name}`, args);
        await cf(ctx).deleteWorker(args.name);
        return { summary: `Deleted Worker ${args.name}`, warnings: ['Routes bound to this Worker now return an error. The script source is not recoverable from Cloudflare.'] };
      },
    }),

    defineTool({
      name: 'cloudflare.worker.secret.list',
      title: 'Cloudflare — list Worker secrets',
      description: 'Lists a Worker\'s secret NAMES. Cloudflare never returns a secret value, and neither does this server.',
      provider: 'cloudflare',
      operationClass: 'read',
      inputSchema: { name: z.string().min(1) },
      handler: async (args, ctx) => {
        const secrets = await cf(ctx).listWorkerSecrets(args.name);
        return listPayload('secrets', secrets, ['name', 'type']);
      },
    }),

    defineTool({
      name: 'cloudflare.worker.secret.put',
      title: 'Cloudflare — set a Worker secret',
      description: 'Creates or updates a Worker secret. The value is never logged, never audited and never returned.',
      provider: 'cloudflare',
      operationClass: 'write',
      inputSchema: {
        name: z.string().min(1),
        key: z.string().min(1),
        value: z.string().min(1).optional().describe('The plaintext secret. Never logged, audited or returned.'),
        valueFromHandle: z
          .string()
          .optional()
          .describe('A vault handle issued by a tool such as neon.connection.get, used instead of `value` so the credential never passes through the transcript.'),
      },
      resource: (args) => `${args.name}:${args.key}`,
      handler: async (args, ctx) => {
        if (ctx.dryRun) return plan(`Would set secret ${args.key} on Worker ${args.name}`, { name: args.name, key: args.key, value: '«redacted»' });
        await cf(ctx).putWorkerSecret(args.name, { key: args.key, value: resolveSecretArgument(args, ctx.vault) });
        return { summary: `Set secret ${args.key} on Worker ${args.name}`, data: { worker: args.name, key: args.key } };
      },
    }),

    defineTool({
      name: 'cloudflare.worker.secret.delete',
      title: 'Cloudflare — delete a Worker secret',
      description: 'Removes a Worker secret. Protected: the Worker will fail at the first read of that binding, and the value cannot be recovered from Cloudflare.',
      provider: 'cloudflare',
      operationClass: 'protected',
      inputSchema: { name: z.string().min(1), key: z.string().min(1) },
      resource: (args) => `${args.name}:${args.key}`,
      preImage: async (args, ctx) => ({
        preImage: { worker: args.name, key: args.key, secrets: await cf(ctx).listWorkerSecrets(args.name) },
        restoreHint: 'Cloudflare does not disclose secret values. Recreate from the original source of the credential with cloudflare.worker.secret.put.',
      }),
      handler: async (args, ctx) => {
        if (ctx.dryRun) return plan(`Would delete secret ${args.key} from Worker ${args.name}`, args);
        await cf(ctx).deleteWorkerSecret(args.name, args.key);
        return { summary: `Deleted secret ${args.key} from Worker ${args.name}` };
      },
    }),

    defineTool({
      name: 'cloudflare.worker.tail.create',
      title: 'Cloudflare — start a log tail',
      description:
        'Creates a tail session for a Worker and returns its id and WebSocket URL. Streaming the logs is a WebSocket operation this server does not perform — connect to the returned URL, or use `wrangler tail`.',
      provider: 'cloudflare',
      operationClass: 'write',
      annotations: { readOnlyHint: false, idempotentHint: false },
      inputSchema: { name: z.string().min(1) },
      resource: (args) => args.name,
      handler: async (args, ctx) => {
        if (ctx.dryRun) return plan(`Would create a tail session for Worker ${args.name}`, args);
        const tail = await cf(ctx).createWorkerTail(args.name);
        return {
          summary: `Created a tail session for ${args.name}`,
          data: tail,
          warnings: ['Tail sessions expire. Streaming requires a WebSocket client; this server returns the session, it does not stream it.'],
        };
      },
    }),

    defineTool({
      name: 'cloudflare.durable-object.list',
      title: 'Cloudflare — list Durable Object namespaces',
      description: 'Lists Durable Object namespaces in the account. Namespaces are created by deploying a Worker that declares a migration, not by this API.',
      provider: 'cloudflare',
      operationClass: 'read',
      inputSchema: {},
      handler: async (_args, ctx) => {
        const namespaces = await cf(ctx).listDurableObjectNamespaces();
        return listPayload('Durable Object namespaces', namespaces, ['id', 'name', 'class', 'script', 'use_sqlite']);
      },
    }),

    // ── D1 ──────────────────────────────────────────────────────────
    defineTool({
      name: 'cloudflare.d1.list',
      title: 'Cloudflare — list D1 databases',
      description: 'Lists D1 databases in the account.',
      provider: 'cloudflare',
      operationClass: 'read',
      inputSchema: {},
      handler: async (_args, ctx) => {
        const databases = await cf(ctx).listD1();
        return listPayload('D1 databases', databases, ['uuid', 'name', 'version', 'created_at', 'file_size']);
      },
    }),

    defineTool({
      name: 'cloudflare.d1.create',
      title: 'Cloudflare — create a D1 database',
      description: 'Creates a D1 database and returns its uuid, which is what a wrangler binding needs.',
      provider: 'cloudflare',
      operationClass: 'write',
      inputSchema: { name: z.string().min(1), primaryLocationHint: z.string().optional() },
      resource: (args) => args.name,
      handler: async (args, ctx) => {
        if (ctx.dryRun) return plan(`Would create D1 database ${args.name}`, args);
        const database = await cf(ctx).createD1(args);
        return { summary: `Created D1 database ${args.name}`, data: database };
      },
    }),

    defineTool({
      name: 'cloudflare.d1.query',
      title: 'Cloudflare — run SQL against D1',
      description:
        'Executes SQL against a D1 database. Use bound parameters rather than string interpolation. This tool is classified write because a single statement can change data; a SELECT is still safe to run under it.',
      provider: 'cloudflare',
      operationClass: 'write',
      annotations: { idempotentHint: false },
      inputSchema: {
        databaseId: z.string().min(1),
        sql: z.string().min(1),
        params: z.array(z.union([z.string(), z.number(), z.boolean(), z.null()])).optional(),
      },
      resource: (args) => args.databaseId,
      handler: async (args, ctx) => {
        if (ctx.dryRun) return plan('Would execute SQL against D1', args);
        const result = await cf(ctx).queryD1(args.databaseId, { sql: args.sql, params: args.params });
        return { summary: 'Executed SQL against D1', data: result };
      },
    }),

    defineTool({
      name: 'cloudflare.d1.export',
      title: 'Cloudflare — export a D1 database',
      description: 'Starts a SQL export of a D1 database and returns the polling handle Cloudflare issues. This is the supported backup path for D1.',
      provider: 'cloudflare',
      operationClass: 'read',
      inputSchema: { databaseId: z.string().min(1), noData: z.boolean().optional(), noSchema: z.boolean().optional() },
      handler: async (args, ctx) => {
        const result = await cf(ctx).exportD1(args.databaseId, args);
        return { summary: 'Started a D1 export', data: result, warnings: ['The export is asynchronous. Poll the returned handle for the signed download URL.'] };
      },
    }),

    defineTool({
      name: 'cloudflare.d1.delete',
      title: 'Cloudflare — delete a D1 database',
      description: 'Permanently destroys a D1 database and every row in it. Protected, and refused outright on any database whose name matches the protected-resource patterns.',
      provider: 'cloudflare',
      operationClass: 'protected',
      inputSchema: { databaseId: z.string().min(1), name: z.string().min(1).describe('The database name, so the protected-resource check can be applied to something a person recognises.') },
      resource: (args) => args.name,
      preImage: async (args, ctx) => ({
        preImage: await cf(ctx).getD1(args.databaseId),
        restoreHint:
          'This records the database METADATA only — not its rows. Take a cloudflare.d1.export first and keep the download; nothing here can rebuild the data.',
      }),
      handler: async (args, ctx) => {
        if (ctx.dryRun) return plan(`Would delete D1 database ${args.name}`, args);
        await cf(ctx).deleteD1(args.databaseId);
        return { summary: `Deleted D1 database ${args.name}`, warnings: ['Every row is gone. Only a prior export can restore it.'] };
      },
    }),

    // ── R2 ──────────────────────────────────────────────────────────
    defineTool({
      name: 'cloudflare.r2.list',
      title: 'Cloudflare — list R2 buckets',
      description: 'Lists R2 buckets in the account.',
      provider: 'cloudflare',
      operationClass: 'read',
      inputSchema: {},
      handler: async (_args, ctx) => {
        const buckets = await cf(ctx).listR2Buckets();
        const list = (buckets as { buckets?: unknown[] })?.buckets ?? buckets;
        return listPayload('R2 buckets', list, ['name', 'creation_date', 'location', 'storage_class']);
      },
    }),

    defineTool({
      name: 'cloudflare.r2.create',
      title: 'Cloudflare — create an R2 bucket',
      description: 'Creates a private R2 bucket. Buckets holding personal data stay private: nothing in this estate hands out a public or signed URL for one.',
      provider: 'cloudflare',
      operationClass: 'write',
      inputSchema: { name: z.string().min(1), locationHint: z.string().optional(), storageClass: z.string().optional() },
      resource: (args) => args.name,
      handler: async (args, ctx) => {
        if (ctx.dryRun) return plan(`Would create R2 bucket ${args.name}`, args);
        const bucket = await cf(ctx).createR2Bucket(args);
        return { summary: `Created R2 bucket ${args.name}`, data: bucket };
      },
    }),

    defineTool({
      name: 'cloudflare.r2.delete',
      title: 'Cloudflare — delete an R2 bucket',
      description: 'Destroys an R2 bucket. Protected, and refused outright on buckets holding institutional records — recordings, identity documents, evidence.',
      provider: 'cloudflare',
      operationClass: 'protected',
      inputSchema: { name: z.string().min(1) },
      resource: (args) => args.name,
      preImage: async (args, ctx) => ({
        preImage: await cf(ctx).getR2Bucket(args.name),
        restoreHint: 'This records the bucket CONFIGURATION only — not its objects. Nothing here can restore uploaded files.',
      }),
      handler: async (args, ctx) => {
        if (ctx.dryRun) return plan(`Would delete R2 bucket ${args.name}`, args);
        await cf(ctx).deleteR2Bucket(args.name);
        return { summary: `Deleted R2 bucket ${args.name}`, warnings: ['Every object in the bucket is gone.'] };
      },
    }),

    // ── KV ──────────────────────────────────────────────────────────
    defineTool({
      name: 'cloudflare.kv.namespace.list',
      title: 'Cloudflare — list KV namespaces',
      description: 'Lists Workers KV namespaces.',
      provider: 'cloudflare',
      operationClass: 'read',
      inputSchema: {},
      handler: async (_args, ctx) => {
        const namespaces = await cf(ctx).listKvNamespaces();
        return listPayload('KV namespaces', namespaces, ['id', 'title', 'supports_url_encoding']);
      },
    }),

    defineTool({
      name: 'cloudflare.kv.namespace.create',
      title: 'Cloudflare — create a KV namespace',
      description: 'Creates a Workers KV namespace and returns its id for a binding.',
      provider: 'cloudflare',
      operationClass: 'write',
      inputSchema: { title: z.string().min(1) },
      resource: (args) => args.title,
      handler: async (args, ctx) => {
        if (ctx.dryRun) return plan(`Would create KV namespace ${args.title}`, args);
        const namespace = await cf(ctx).createKvNamespace(args.title);
        return { summary: `Created KV namespace ${args.title}`, data: namespace };
      },
    }),

    defineTool({
      name: 'cloudflare.kv.key.list',
      title: 'Cloudflare — list KV keys',
      description: 'Lists keys in a KV namespace, optionally by prefix.',
      provider: 'cloudflare',
      operationClass: 'read',
      inputSchema: { namespaceId: z.string().min(1), prefix: z.string().optional() },
      handler: async (args, ctx) => {
        const keys = await cf(ctx).listKvKeys(args.namespaceId, args.prefix);
        return listPayload('keys', keys, ['name', 'expiration', 'metadata']);
      },
    }),

    defineTool({
      name: 'cloudflare.kv.value.get',
      title: 'Cloudflare — read a KV value',
      description: 'Reads one value from a KV namespace as text.',
      provider: 'cloudflare',
      operationClass: 'read',
      inputSchema: { namespaceId: z.string().min(1), key: z.string().min(1) },
      handler: async (args, ctx) => {
        const value = await cf(ctx).getKvValue(args.namespaceId, args.key);
        return { summary: `${args.key} (${value.length} characters)`, data: { key: args.key, value } };
      },
    }),

    defineTool({
      name: 'cloudflare.kv.value.put',
      title: 'Cloudflare — write a KV value',
      description: 'Writes one value into a KV namespace. Overwrites without warning, so read first if the prior value matters.',
      provider: 'cloudflare',
      operationClass: 'write',
      inputSchema: { namespaceId: z.string().min(1), key: z.string().min(1), value: z.string() },
      resource: (args) => `${args.namespaceId}:${args.key}`,
      handler: async (args, ctx) => {
        if (ctx.dryRun) return plan(`Would write KV key ${args.key}`, args);
        await cf(ctx).putKvValue(args.namespaceId, args.key, args.value);
        return { summary: `Wrote KV key ${args.key}` };
      },
    }),

    defineTool({
      name: 'cloudflare.kv.value.delete',
      title: 'Cloudflare — delete a KV value',
      description: 'Removes one key from a KV namespace. Protected, with the prior value captured as a pre-image first.',
      provider: 'cloudflare',
      operationClass: 'protected',
      inputSchema: { namespaceId: z.string().min(1), key: z.string().min(1) },
      resource: (args) => `${args.namespaceId}:${args.key}`,
      preImage: async (args, ctx) => {
        const value = await cf(ctx).getKvValue(args.namespaceId, args.key).catch(() => undefined);
        return {
          preImage: { namespaceId: args.namespaceId, key: args.key, value },
          restoreHint: `Restore with cloudflare.kv.value.put using the recorded value.`,
        };
      },
      handler: async (args, ctx) => {
        if (ctx.dryRun) return plan(`Would delete KV key ${args.key}`, args);
        await cf(ctx).deleteKvValue(args.namespaceId, args.key);
        return { summary: `Deleted KV key ${args.key}` };
      },
    }),

    // ── Queues ──────────────────────────────────────────────────────
    defineTool({
      name: 'cloudflare.queue.list',
      title: 'Cloudflare — list Queues',
      description: 'Lists Queues in the account.',
      provider: 'cloudflare',
      operationClass: 'read',
      inputSchema: {},
      handler: async (_args, ctx) => {
        const queues = await cf(ctx).listQueues();
        return listPayload('Queues', queues, ['queue_id', 'queue_name', 'created_on', 'producers_total_count', 'consumers_total_count']);
      },
    }),

    defineTool({
      name: 'cloudflare.queue.create',
      title: 'Cloudflare — create a Queue',
      description: 'Creates a Queue.',
      provider: 'cloudflare',
      operationClass: 'write',
      inputSchema: { name: z.string().min(1) },
      resource: (args) => args.name,
      handler: async (args, ctx) => {
        if (ctx.dryRun) return plan(`Would create Queue ${args.name}`, args);
        const queue = await cf(ctx).createQueue(args.name);
        return { summary: `Created Queue ${args.name}`, data: queue };
      },
    }),

    defineTool({
      name: 'cloudflare.queue.delete',
      title: 'Cloudflare — delete a Queue',
      description: 'Destroys a Queue and any messages still in it. Protected.',
      provider: 'cloudflare',
      operationClass: 'protected',
      inputSchema: { queueId: z.string().min(1), name: z.string().min(1) },
      resource: (args) => args.name,
      preImage: async (args, ctx) => ({
        preImage: { queueId: args.queueId, name: args.name, queues: await cf(ctx).listQueues() },
        restoreHint: 'Recreate with cloudflare.queue.create and re-bind producers and consumers. Messages still in flight are lost.',
      }),
      handler: async (args, ctx) => {
        if (ctx.dryRun) return plan(`Would delete Queue ${args.name}`, args);
        await cf(ctx).deleteQueue(args.queueId);
        return { summary: `Deleted Queue ${args.name}`, warnings: ['Undelivered messages are gone.'] };
      },
    }),

    // ── Pages ───────────────────────────────────────────────────────
    defineTool({
      name: 'cloudflare.pages.project.list',
      title: 'Cloudflare — list Pages projects',
      description: 'Lists Pages projects in the account.',
      provider: 'cloudflare',
      operationClass: 'read',
      inputSchema: {},
      handler: async (_args, ctx) => {
        const projects = await cf(ctx).listPagesProjects();
        return listPayload('Pages projects', projects, ['name', 'subdomain', 'production_branch', 'created_on', 'domains']);
      },
    }),

    defineTool({
      name: 'cloudflare.pages.project.get',
      title: 'Cloudflare — get a Pages project',
      description: 'Returns one Pages project, including its build configuration, environment variable NAMES and custom domains.',
      provider: 'cloudflare',
      operationClass: 'read',
      inputSchema: { project: z.string().min(1) },
      handler: async (args, ctx) => {
        const project = await cf(ctx).getPagesProject(args.project);
        return { summary: `Pages project ${args.project}`, data: project };
      },
    }),

    defineTool({
      name: 'cloudflare.pages.deployment.list',
      title: 'Cloudflare — list Pages deployments',
      description: 'Lists deployments for a Pages project, newest first. Use this to find a rollback target before promoting anything.',
      provider: 'cloudflare',
      operationClass: 'read',
      inputSchema: { project: z.string().min(1) },
      handler: async (args, ctx) => {
        const deployments = await cf(ctx).listPagesDeployments(args.project);
        return listPayload('deployments', deployments, ['id', 'short_id', 'environment', 'url', 'created_on', 'latest_stage', 'deployment_trigger']);
      },
    }),

    defineTool({
      name: 'cloudflare.pages.deploy',
      title: 'Cloudflare — trigger a Pages deployment',
      description:
        'Triggers a build of a Pages project from its connected git branch. LIMITATION: this does NOT upload assets. Direct-upload projects need Wrangler, whose versioned upload protocol this server deliberately does not reimplement — run `wrangler pages deploy` for those.',
      provider: 'cloudflare',
      operationClass: 'write',
      annotations: { idempotentHint: false },
      inputSchema: { project: z.string().min(1), branch: z.string().optional().describe('Defaults to the project production branch.') },
      resource: (args) => args.project,
      handler: async (args, ctx) => {
        if (ctx.dryRun) return plan(`Would trigger a Pages deployment of ${args.project}`, args);
        const deployment = await cf(ctx).createPagesDeployment(args.project, args.branch);
        return {
          summary: `Triggered a Pages deployment of ${args.project}${args.branch ? ` from ${args.branch}` : ''}`,
          data: deployment,
          warnings: ['This builds from the connected git branch. If the project is direct-upload, use `wrangler pages deploy` instead.'],
        };
      },
    }),

    defineTool({
      name: 'cloudflare.pages.rollback',
      title: 'Cloudflare — roll back a Pages deployment',
      description: 'Promotes a previous deployment back to production. The named deployment must still exist; list deployments first.',
      provider: 'cloudflare',
      operationClass: 'write',
      annotations: { idempotentHint: true },
      inputSchema: { project: z.string().min(1), deploymentId: z.string().min(1) },
      resource: (args) => args.project,
      handler: async (args, ctx) => {
        if (ctx.dryRun) return plan(`Would roll ${args.project} back to ${args.deploymentId}`, args);
        const result = await cf(ctx).rollbackPagesDeployment(args.project, args.deploymentId);
        return { summary: `Rolled ${args.project} back to deployment ${args.deploymentId}`, data: result };
      },
    }),

    defineTool({
      name: 'cloudflare.pages.deployment.logs',
      title: 'Cloudflare — Pages build logs',
      description: 'Returns the build log for one Pages deployment.',
      provider: 'cloudflare',
      operationClass: 'read',
      inputSchema: { project: z.string().min(1), deploymentId: z.string().min(1) },
      handler: async (args, ctx) => {
        const logs = await cf(ctx).getPagesDeploymentLogs(args.project, args.deploymentId);
        return { summary: `Build log for ${args.deploymentId}`, data: logs };
      },
    }),

    defineTool({
      name: 'cloudflare.pages.domain.list',
      title: 'Cloudflare — list Pages custom domains',
      description: 'Lists the custom domains attached to a Pages project and their validation state.',
      provider: 'cloudflare',
      operationClass: 'read',
      inputSchema: { project: z.string().min(1) },
      handler: async (args, ctx) => {
        const domains = await cf(ctx).listPagesDomains(args.project);
        return listPayload('domains', domains, ['name', 'status', 'verification_data', 'validation_data']);
      },
    }),

    defineTool({
      name: 'cloudflare.pages.domain.add',
      title: 'Cloudflare — attach a custom domain to Pages',
      description: 'Attaches a custom domain to a Pages project. DNS must already point at Cloudflare; the domain stays pending until it validates.',
      provider: 'cloudflare',
      operationClass: 'write',
      inputSchema: { project: z.string().min(1), name: z.string().min(1) },
      resource: (args) => args.name,
      handler: async (args, ctx) => {
        if (ctx.dryRun) return plan(`Would attach ${args.name} to ${args.project}`, args);
        const domain = await cf(ctx).addPagesDomain(args.project, args.name);
        return { summary: `Attached ${args.name} to ${args.project}`, data: domain };
      },
    }),

    defineTool({
      name: 'cloudflare.pages.project.delete',
      title: 'Cloudflare — delete a Pages project',
      description:
        'Destroys a Pages project, every deployment in its history, and every custom domain attached to it. Protected: the site goes offline immediately and the deployment history — including whatever you would have rolled back to — is gone.',
      provider: 'cloudflare',
      operationClass: 'protected',
      inputSchema: { project: z.string().min(1) },
      resource: (args) => args.project,
      preImage: async (args, ctx) => ({
        preImage: {
          project: await cf(ctx).getPagesProject(args.project),
          domains: await cf(ctx).listPagesDomains(args.project).catch(() => undefined),
        },
        restoreHint:
          'The build configuration, environment variable NAMES and custom domains are recorded. Recreate the project in the dashboard, re-attach the domains, and re-set every environment variable from its original source — Cloudflare does not return secret values. The deployment history cannot be restored.',
      }),
      handler: async (args, ctx) => {
        if (ctx.dryRun) return plan(`Would delete Pages project ${args.project}`, args);
        await cf(ctx).deletePagesProject(args.project);
        return {
          summary: `Deleted Pages project ${args.project}`,
          warnings: ['The site is offline and its deployment history — including every rollback target — is gone.'],
        };
      },
    }),

    // ── Zones and DNS ───────────────────────────────────────────────
    defineTool({
      name: 'cloudflare.zone.list',
      title: 'Cloudflare — list zones',
      description: 'Lists DNS zones the token can see. Zones on another registrar or outside the token scope simply do not appear.',
      provider: 'cloudflare',
      operationClass: 'read',
      inputSchema: { name: z.string().optional() },
      handler: async (args, ctx) => {
        const zones = await cf(ctx).listZones(args.name);
        return listPayload('zones', zones, ['id', 'name', 'status', 'paused', 'name_servers']);
      },
    }),

    defineTool({
      name: 'cloudflare.dns.list',
      title: 'Cloudflare — list DNS records',
      description: 'Lists DNS records in a zone, optionally filtered by type or name.',
      provider: 'cloudflare',
      operationClass: 'read',
      inputSchema: { zoneId: z.string().min(1), type: z.string().optional(), name: z.string().optional() },
      handler: async (args, ctx) => {
        const records = await cf(ctx).listDnsRecords(args.zoneId, args);
        return listPayload('DNS records', records, ['id', 'type', 'name', 'content', 'ttl', 'proxied', 'priority']);
      },
    }),

    defineTool({
      name: 'cloudflare.dns.create',
      title: 'Cloudflare — create a DNS record',
      description: 'Creates a DNS record. For mail authentication (SPF, DKIM, DMARC) create the records before switching a sending domain, never after.',
      provider: 'cloudflare',
      operationClass: 'write',
      inputSchema: {
        zoneId: z.string().min(1),
        type: z.string().min(1).describe('A, AAAA, CNAME, TXT, MX, …'),
        name: z.string().min(1),
        content: z.string().min(1),
        ttl: z.number().int().optional().describe('1 means automatic.'),
        proxied: z.boolean().optional(),
        priority: z.number().int().optional().describe('MX and SRV only.'),
      },
      resource: (args) => `${args.type} ${args.name}`,
      handler: async (args, ctx) => {
        if (ctx.dryRun) return plan(`Would create ${args.type} ${args.name}`, args);
        const record = await cf(ctx).createDnsRecord(args.zoneId, args);
        return { summary: `Created ${args.type} record ${args.name}`, data: record };
      },
    }),

    defineTool({
      name: 'cloudflare.dns.update',
      title: 'Cloudflare — update a DNS record',
      description: 'Patches a DNS record. Only the fields supplied are changed.',
      provider: 'cloudflare',
      operationClass: 'write',
      inputSchema: {
        zoneId: z.string().min(1),
        recordId: z.string().min(1),
        type: z.string().optional(),
        name: z.string().optional(),
        content: z.string().optional(),
        ttl: z.number().int().optional(),
        proxied: z.boolean().optional(),
      },
      resource: (args) => args.recordId,
      handler: async (args, ctx) => {
        const { zoneId, recordId, ...patch } = args;
        if (ctx.dryRun) return plan(`Would update DNS record ${recordId}`, patch);
        const record = await cf(ctx).updateDnsRecord(zoneId, recordId, patch);
        return { summary: `Updated DNS record ${recordId}`, data: record };
      },
    }),

    defineTool({
      name: 'cloudflare.dns.delete',
      title: 'Cloudflare — delete a DNS record',
      description:
        'Removes a DNS record. Protected: removing an MX, SPF, DKIM or DMARC record silently breaks mail delivery, and removing an A or CNAME takes a site offline. The full record is captured as a pre-image first, which is enough to recreate it exactly.',
      provider: 'cloudflare',
      operationClass: 'protected',
      inputSchema: { zoneId: z.string().min(1), recordId: z.string().min(1) },
      resource: (args) => args.recordId,
      preImage: async (args, ctx) => ({
        preImage: await cf(ctx).getDnsRecord(args.zoneId, args.recordId),
        restoreHint: 'Recreate with cloudflare.dns.create using the recorded type, name, content, ttl, proxied and priority.',
      }),
      handler: async (args, ctx) => {
        if (ctx.dryRun) return plan(`Would delete DNS record ${args.recordId}`, args);
        await cf(ctx).deleteDnsRecord(args.zoneId, args.recordId);
        return { summary: `Deleted DNS record ${args.recordId}`, warnings: ['DNS changes propagate; clients may keep the old answer until the TTL expires.'] };
      },
    }),
  ];
}
