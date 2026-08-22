/**
 * Neon tool surface.
 *
 * `neon.connection.get` never returns a connection string. It puts the
 * URI in the handle vault and returns a handle plus the non-secret
 * components, so a workflow can hand the credential to Cloudflare, GitHub
 * or Vercel without it ever passing through the transcript
 * (`SEB §26.7`, `core/vault.ts`).
 */

import { z } from 'zod';
import { defineTool, type ToolDefinition } from '../../core/registry.js';
import { clientFor, listPayload, plan } from '../support.js';
import type { NeonClient } from './client.js';

const neon = (ctx: Parameters<typeof clientFor>[0]) => clientFor<NeonClient>(ctx, 'neon');

const connectionArgs = {
  projectId: z.string().min(1),
  branchId: z.string().optional().describe('Defaults to the project default branch.'),
  databaseName: z.string().min(1),
  roleName: z.string().min(1),
  pooled: z.boolean().optional().describe('Defaults to true — the pooled endpoint, which is what serverless runtimes should use.'),
} as const;

export function neonTools(): ToolDefinition[] {
  return [
    defineTool({
      name: 'neon.project.list',
      title: 'Neon — list projects',
      description: 'Lists Neon projects the API key can see.',
      provider: 'neon',
      operationClass: 'read',
      inputSchema: {},
      handler: async (_args, ctx) => {
        const projects = await neon(ctx).listProjects();
        return listPayload('projects', projects, ['id', 'name', 'region_id', 'pg_version', 'created_at', 'branch_logical_size_limit_bytes']);
      },
    }),

    defineTool({
      name: 'neon.project.get',
      title: 'Neon — get a project',
      description: 'Returns one Neon project with its settings and quotas.',
      provider: 'neon',
      operationClass: 'read',
      inputSchema: { projectId: z.string().min(1) },
      handler: async (args, ctx) => ({ summary: `Neon project ${args.projectId}`, data: await neon(ctx).getProject(args.projectId) }),
    }),

    defineTool({
      name: 'neon.project.create',
      title: 'Neon — create a project',
      description: 'Creates a Neon project with its default branch, database and role.',
      provider: 'neon',
      operationClass: 'write',
      inputSchema: {
        name: z.string().min(1),
        regionId: z.string().optional().describe('e.g. aws-eu-west-2. Choose deliberately — residency is a governance decision, not a latency one.'),
        pgVersion: z.number().int().optional(),
      },
      resource: (args) => args.name,
      handler: async (args, ctx) => {
        if (ctx.dryRun) return plan(`Would create Neon project ${args.name}`, args);
        const project = await neon(ctx).createProject(args);
        return {
          summary: `Created Neon project ${args.name}`,
          data: project,
          warnings: ['Confirm the region satisfies the data-residency position for whatever this database will hold.'],
        };
      },
    }),

    defineTool({
      name: 'neon.branch.list',
      title: 'Neon — list branches',
      description: 'Lists branches in a project, including any taken as backups.',
      provider: 'neon',
      operationClass: 'read',
      inputSchema: { projectId: z.string().min(1) },
      handler: async (args, ctx) => {
        const body = (await neon(ctx).listBranches(args.projectId)) as { branches?: unknown[] };
        return listPayload('branches', body.branches ?? [], ['id', 'name', 'parent_id', 'default', 'protected', 'created_at', 'current_state']);
      },
    }),

    defineTool({
      name: 'neon.branch.create',
      title: 'Neon — create a branch',
      description: 'Creates a branch with a read-write compute endpoint, optionally from a point in time on the parent.',
      provider: 'neon',
      operationClass: 'write',
      inputSchema: {
        projectId: z.string().min(1),
        name: z.string().min(1),
        parentId: z.string().optional(),
        parentTimestamp: z.string().optional().describe('RFC3339. Branches from the parent as it was at that instant.'),
      },
      resource: (args) => `${args.projectId}/${args.name}`,
      handler: async (args, ctx) => {
        if (ctx.dryRun) return plan(`Would create Neon branch ${args.name}`, args);
        const branch = await neon(ctx).createBranch(args.projectId, args);
        return { summary: `Created Neon branch ${args.name}`, data: branch };
      },
    }),

    defineTool({
      name: 'neon.backup.create',
      title: 'Neon — take a backup',
      description:
        'Takes a point-in-time backup as a timestamped, named branch — Neon\'s own backup mechanism. LIMITATION: Neon exposes no logical-dump API, so this is a branch, not a portable SQL file. A branch lives inside the same project, which means it protects against a bad migration but not against losing the project.',
      provider: 'neon',
      operationClass: 'write',
      inputSchema: {
        projectId: z.string().min(1),
        sourceBranchId: z.string().min(1),
        label: z.string().min(1).describe('A reason, e.g. "before-v3-migration". Becomes part of the branch name.'),
        atTimestamp: z.string().optional().describe('RFC3339. Defaults to now.'),
      },
      resource: (args) => `${args.projectId}/${args.label}`,
      handler: async (args, ctx) => {
        const name = `backup-${args.label}-${ctx.now().toISOString().replace(/[:.]/g, '-')}`;
        if (ctx.dryRun) return plan(`Would take a backup branch ${name}`, { ...args, name });
        const branch = await neon(ctx).createBranch(args.projectId, {
          name,
          parentId: args.sourceBranchId,
          parentTimestamp: args.atTimestamp,
        });
        return {
          summary: `Took backup branch ${name}`,
          data: branch,
          warnings: ['A branch backup lives in the same project. It does not protect against project deletion or account loss.'],
        };
      },
    }),

    defineTool({
      name: 'neon.backup.restore',
      title: 'Neon — restore a branch',
      description:
        'Restores a branch from another branch or a point in time. Neon preserves the pre-restore state as a new branch automatically, so this is reversible — which is why it is a write rather than a protected operation.',
      provider: 'neon',
      operationClass: 'write',
      annotations: { idempotentHint: false },
      inputSchema: {
        projectId: z.string().min(1),
        branchId: z.string().min(1).describe('The branch to overwrite.'),
        sourceBranchId: z.string().min(1).describe('The branch to restore from — typically a backup branch.'),
        sourceTimestamp: z.string().optional(),
      },
      resource: (args) => `${args.projectId}/${args.branchId}`,
      handler: async (args, ctx) => {
        if (ctx.dryRun) return plan(`Would restore ${args.branchId} from ${args.sourceBranchId}`, args);
        const result = await neon(ctx).restoreBranch(args.projectId, args.branchId, args);
        return {
          summary: `Restored branch ${args.branchId} from ${args.sourceBranchId}`,
          data: result,
          warnings: ['Neon kept the pre-restore state as a new branch. Find it with neon.branch.list before deleting anything.'],
        };
      },
    }),

    defineTool({
      name: 'neon.branch.delete',
      title: 'Neon — delete a branch',
      description: 'Destroys a branch and its data. Protected, and refused outright on any branch whose name matches the protected-resource patterns.',
      provider: 'neon',
      operationClass: 'protected',
      inputSchema: { projectId: z.string().min(1), branchId: z.string().min(1), name: z.string().min(1).describe('The branch name, so the protected-resource check applies to something a person recognises.') },
      resource: (args) => args.name,
      preImage: async (args, ctx) => ({
        preImage: await neon(ctx).getBranch(args.projectId, args.branchId),
        restoreHint:
          'This records branch METADATA only, not its rows. A branch can only be recreated from a parent that still exists; if this was the last copy of the data, nothing here restores it.',
      }),
      handler: async (args, ctx) => {
        if (ctx.dryRun) return plan(`Would delete Neon branch ${args.name}`, args);
        await neon(ctx).deleteBranch(args.projectId, args.branchId);
        return { summary: `Deleted Neon branch ${args.name}`, warnings: ['The branch data is gone unless another branch still holds it.'] };
      },
    }),

    defineTool({
      name: 'neon.database.list',
      title: 'Neon — list databases',
      description: 'Lists the databases on a branch.',
      provider: 'neon',
      operationClass: 'read',
      inputSchema: { projectId: z.string().min(1), branchId: z.string().min(1) },
      handler: async (args, ctx) => {
        const body = (await neon(ctx).listDatabases(args.projectId, args.branchId)) as { databases?: unknown[] };
        return listPayload('databases', body.databases ?? [], ['id', 'name', 'owner_name', 'created_at']);
      },
    }),

    defineTool({
      name: 'neon.database.create',
      title: 'Neon — create a database',
      description: 'Creates a database on a branch, owned by an existing role.',
      provider: 'neon',
      operationClass: 'write',
      inputSchema: { projectId: z.string().min(1), branchId: z.string().min(1), name: z.string().min(1), ownerName: z.string().min(1) },
      resource: (args) => args.name,
      handler: async (args, ctx) => {
        if (ctx.dryRun) return plan(`Would create database ${args.name}`, args);
        const database = await neon(ctx).createDatabase(args.projectId, args.branchId, args);
        return { summary: `Created database ${args.name}`, data: database };
      },
    }),

    defineTool({
      name: 'neon.role.list',
      title: 'Neon — list roles',
      description: 'Lists the Postgres roles on a branch. Passwords are not returned.',
      provider: 'neon',
      operationClass: 'read',
      inputSchema: { projectId: z.string().min(1), branchId: z.string().min(1) },
      handler: async (args, ctx) => {
        const body = (await neon(ctx).listRoles(args.projectId, args.branchId)) as { roles?: unknown[] };
        return listPayload('roles', body.roles ?? [], ['name', 'protected', 'created_at']);
      },
    }),

    defineTool({
      name: 'neon.schema.get',
      title: 'Neon — get a schema',
      description: 'Returns the SQL schema of a database on a branch, as Neon renders it.',
      provider: 'neon',
      operationClass: 'read',
      inputSchema: { projectId: z.string().min(1), branchId: z.string().min(1), databaseName: z.string().min(1) },
      handler: async (args, ctx) => ({
        summary: `Schema of ${args.databaseName}`,
        data: await neon(ctx).getSchema(args.projectId, args.branchId, args.databaseName),
      }),
    }),

    defineTool({
      name: 'neon.connection.get',
      title: 'Neon — get a connection handle',
      description:
        'Fetches a connection URI and puts it in this process\'s handle vault. Returns a HANDLE and the non-secret components — never the URI itself, because a connection string is a credential and a credential does not belong in a tool result. Pass the handle as `valueFromHandle` to any tool that sets a secret.',
      provider: 'neon',
      operationClass: 'read',
      inputSchema: connectionArgs,
      handler: async (args, ctx) => {
        const uri = await neon(ctx).connectionUri(args);
        const entry = ctx.vault.store({
          value: uri,
          label: `neon:${args.projectId}/${args.databaseName}`,
          origin: 'neon.connection.get',
        });
        const parsed = safeParse(uri);
        return {
          summary: `Connection handle for ${args.databaseName} (expires ${entry.expiresAt})`,
          data: {
            handle: entry.handle,
            expiresAt: entry.expiresAt,
            host: parsed?.host,
            database: parsed?.database,
            role: parsed?.role,
            pooled: args.pooled ?? true,
          },
          warnings: [
            'The connection string itself was deliberately not returned. Use the handle with `valueFromHandle` on a secret-setting tool, in this session, before it expires.',
          ],
        };
      },
    }),

    defineTool({
      name: 'neon.sql.run',
      title: 'Neon — run SQL',
      description:
        'Executes SQL against a database, using a connection handle from neon.connection.get. Statements run in one transaction by default, so a failure rolls the whole call back. Classified write: a single statement can change data, and a SELECT is still safe to run under it.',
      provider: 'neon',
      operationClass: 'write',
      annotations: { idempotentHint: false },
      inputSchema: {
        connectionHandle: z.string().min(1).describe('A handle from neon.connection.get.'),
        statements: z.array(z.string().min(1)).min(1),
        transactional: z.boolean().optional().describe('Defaults to true.'),
      },
      resource: (args) => args.connectionHandle,
      handler: async (args, ctx) => {
        const transactional = args.transactional ?? true;
        if (ctx.dryRun) return plan(`Would run ${args.statements.length} statement(s)`, { statements: args.statements, transactional });
        const uri = ctx.vault.reveal(args.connectionHandle);
        const results = await neon(ctx).runSql(uri, args.statements, { transactional });
        return {
          summary: `Ran ${args.statements.length} statement(s); ${results.reduce((sum, r) => sum + (r.rowCount ?? 0), 0)} row(s) affected or returned`,
          data: results,
        };
      },
    }),

    defineTool({
      name: 'neon.migration.apply',
      title: 'Neon — apply migrations',
      description:
        'Applies migrations that have not yet been applied, in name order, each in its own transaction, recording a checksum in a stromex_migrations table. A migration whose contents changed after it was applied is reported as DRIFT and is not re-run — that divergence is a decision for a person, not a retry.',
      provider: 'neon',
      operationClass: 'write',
      annotations: { idempotentHint: true },
      inputSchema: {
        connectionHandle: z.string().min(1),
        migrations: z
          .array(z.object({ name: z.string().min(1), sql: z.string().min(1) }))
          .min(1)
          .describe('Ordered by name. Use a sortable prefix, e.g. 0001-create-students.sql.'),
      },
      resource: (args) => args.connectionHandle,
      handler: async (args, ctx) => {
        if (ctx.dryRun) {
          return plan(`Would consider ${args.migrations.length} migration(s)`, { names: args.migrations.map((m) => m.name) });
        }
        const uri = ctx.vault.reveal(args.connectionHandle);
        const result = await neon(ctx).applyMigrations(uri, args.migrations);
        const warnings: string[] = [];
        if (result.drifted.length > 0) {
          warnings.push(
            `DRIFT: ${result.drifted.map((d) => d.name).join(', ')} — already applied, but the file has changed since. Nothing was re-run. Reconcile deliberately.`,
          );
        }
        return {
          summary: `Applied ${result.applied.length}, skipped ${result.skipped.length}, drifted ${result.drifted.length}`,
          data: result,
          ...(warnings.length ? { warnings } : {}),
        };
      },
    }),

    defineTool({
      name: 'neon.performance.slow-queries',
      title: 'Neon — slowest queries',
      description:
        'Reads the slowest statements from pg_stat_statements. Requires the extension to be enabled on the database; if it is not, the tool says so rather than returning an empty list that looks like good news.',
      provider: 'neon',
      operationClass: 'read',
      inputSchema: { connectionHandle: z.string().min(1), limit: z.number().int().min(1).max(100).optional() },
      handler: async (args, ctx) => {
        const uri = ctx.vault.reveal(args.connectionHandle);
        const enabled = await neon(ctx).runSql(uri, ["SELECT 1 FROM pg_extension WHERE extname = 'pg_stat_statements'"], { transactional: false });
        if ((enabled[0]?.rows.length ?? 0) === 0) {
          return {
            summary: 'pg_stat_statements is not enabled on this database, so no query statistics exist to read.',
            data: { enabled: false },
            warnings: ['Enable it with: CREATE EXTENSION pg_stat_statements; then let it collect for a while before reading.'],
          };
        }
        const rows = await neon(ctx).runSql(
          uri,
          [
            `SELECT query, calls, total_exec_time, mean_exec_time, rows
               FROM pg_stat_statements
              ORDER BY mean_exec_time DESC
              LIMIT ${Math.trunc(args.limit ?? 20)}`,
          ],
          { transactional: false },
        );
        return { summary: `Slowest ${rows[0]?.rows.length ?? 0} statements by mean execution time`, data: rows[0]?.rows ?? [] };
      },
    }),

    defineTool({
      name: 'neon.operation.list',
      title: 'Neon — list operations',
      description: 'Lists recent Neon operations for a project — how you find out whether a branch or endpoint finished provisioning.',
      provider: 'neon',
      operationClass: 'read',
      inputSchema: { projectId: z.string().min(1) },
      handler: async (args, ctx) => ({ summary: 'Neon operations', data: await neon(ctx).listOperations(args.projectId) }),
    }),
  ];
}

/** Extracts the non-secret parts of a connection URI. Never the password. */
function safeParse(uri: string): { host: string; database: string; role: string } | undefined {
  try {
    const url = new URL(uri);
    return { host: url.host, database: url.pathname.replace(/^\//, ''), role: url.username };
  } catch {
    return undefined;
  }
}
