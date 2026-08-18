/**
 * Vercel tool surface.
 *
 * Domain purchase is the only tool in this server that spends money. It
 * declares a `purchase`, so the policy engine gates it against the
 * spending policy — which ships disabled (`SEB §26.6`). The price is read
 * from Vercel first and passed to the purchase as `expectedPrice`, so a
 * price that moved between the check and the buy fails at the provider
 * rather than quietly charging more.
 */

import { z } from 'zod';
import { defineTool, type ToolDefinition } from '../../core/registry.js';
import { resolveSecretArgument } from '../../core/vault.js';
import { clientFor, listPayload, plan } from '../support.js';
import type { VercelClient } from './client.js';

const vercel = (ctx: Parameters<typeof clientFor>[0]) => clientFor<VercelClient>(ctx, 'vercel');

export function vercelTools(): ToolDefinition[] {
  return [
    defineTool({
      name: 'vercel.project.list',
      title: 'Vercel — list projects',
      description: 'Lists Vercel projects in the account or team the token is scoped to.',
      provider: 'vercel',
      operationClass: 'read',
      inputSchema: { limit: z.number().int().min(1).max(100).optional() },
      handler: async (args, ctx) => {
        const body = (await vercel(ctx).listProjects(args.limit)) as { projects?: unknown[] };
        return listPayload('projects', body.projects ?? [], ['id', 'name', 'framework', 'updatedAt', 'link']);
      },
    }),

    defineTool({
      name: 'vercel.project.get',
      title: 'Vercel — get a project',
      description: 'Returns one project with its framework, git link and settings.',
      provider: 'vercel',
      operationClass: 'read',
      inputSchema: { project: z.string().min(1).describe('Project id or name.') },
      handler: async (args, ctx) => ({ summary: `Vercel project ${args.project}`, data: await vercel(ctx).getProject(args.project) }),
    }),

    defineTool({
      name: 'vercel.project.create',
      title: 'Vercel — create a project',
      description: 'Creates a project, optionally linked to a git repository so pushes deploy automatically.',
      provider: 'vercel',
      operationClass: 'write',
      inputSchema: {
        name: z.string().min(1),
        framework: z.string().optional(),
        gitRepository: z
          .object({ type: z.enum(['github', 'gitlab', 'bitbucket']), repo: z.string().min(1).describe('owner/repo') })
          .optional(),
      },
      resource: (args) => args.name,
      handler: async (args, ctx) => {
        if (ctx.dryRun) return plan(`Would create Vercel project ${args.name}`, args);
        const project = await vercel(ctx).createProject(args);
        return { summary: `Created Vercel project ${args.name}`, data: project };
      },
    }),

    defineTool({
      name: 'vercel.deployment.list',
      title: 'Vercel — list deployments',
      description: 'Lists deployments, newest first. Use this to find a rollback target before promoting anything.',
      provider: 'vercel',
      operationClass: 'read',
      inputSchema: {
        projectId: z.string().optional(),
        limit: z.number().int().min(1).max(100).optional(),
        target: z.enum(['production', 'preview']).optional(),
      },
      handler: async (args, ctx) => {
        const body = (await vercel(ctx).listDeployments(args)) as { deployments?: unknown[] };
        return listPayload('deployments', body.deployments ?? [], ['uid', 'name', 'url', 'state', 'readyState', 'target', 'created', 'meta']);
      },
    }),

    defineTool({
      name: 'vercel.deployment.get',
      title: 'Vercel — get a deployment',
      description: 'Returns one deployment with its state, target and aliases.',
      provider: 'vercel',
      operationClass: 'read',
      inputSchema: { deployment: z.string().min(1).describe('Deployment id or URL.') },
      handler: async (args, ctx) => ({ summary: `Deployment ${args.deployment}`, data: await vercel(ctx).getDeployment(args.deployment) }),
    }),

    defineTool({
      name: 'vercel.deployment.logs',
      title: 'Vercel — deployment build logs',
      description: 'Returns build events for a deployment, newest first — the first place to look when a build failed.',
      provider: 'vercel',
      operationClass: 'read',
      inputSchema: { deployment: z.string().min(1), limit: z.number().int().min(1).max(1000).optional() },
      handler: async (args, ctx) => ({
        summary: `Build events for ${args.deployment}`,
        data: await vercel(ctx).getDeploymentEvents(args.deployment, args.limit),
      }),
    }),

    defineTool({
      name: 'vercel.deployment.create',
      title: 'Vercel — trigger a deployment',
      description:
        'Creates a deployment from a git source Vercel already knows about. LIMITATION: this does not upload files. A deployment of local files is what the Vercel CLI does, and this server does not reimplement its upload protocol.',
      provider: 'vercel',
      operationClass: 'write',
      annotations: { idempotentHint: false },
      inputSchema: {
        name: z.string().min(1).describe('Project name.'),
        project: z.string().optional().describe('Project id.'),
        target: z.enum(['production', 'staging']).optional(),
        gitSource: z.record(z.string(), z.unknown()).optional().describe('Vercel gitSource object — type, repoId/org+repo, and ref.'),
      },
      resource: (args) => args.name,
      handler: async (args, ctx) => {
        if (ctx.dryRun) return plan(`Would create a Vercel deployment of ${args.name}`, args);
        const deployment = await vercel(ctx).createDeployment(args);
        return { summary: `Created a Vercel deployment of ${args.name}`, data: deployment };
      },
    }),

    defineTool({
      name: 'vercel.deployment.rollback',
      title: 'Vercel — roll back production',
      description: 'Points production traffic back at a previous deployment. Reversible by rolling forward again, so this is a write rather than a protected operation.',
      provider: 'vercel',
      operationClass: 'write',
      annotations: { idempotentHint: true },
      inputSchema: { projectId: z.string().min(1), deploymentId: z.string().min(1) },
      resource: (args) => args.projectId,
      handler: async (args, ctx) => {
        if (ctx.dryRun) return plan(`Would roll ${args.projectId} back to ${args.deploymentId}`, args);
        const result = await vercel(ctx).rollback(args.projectId, args.deploymentId);
        return { summary: `Rolled ${args.projectId} back to deployment ${args.deploymentId}`, data: result };
      },
    }),

    defineTool({
      name: 'vercel.deployment.promote',
      title: 'Vercel — promote a deployment',
      description: 'Promotes an existing deployment to production.',
      provider: 'vercel',
      operationClass: 'write',
      annotations: { idempotentHint: true },
      inputSchema: { projectId: z.string().min(1), deploymentId: z.string().min(1) },
      resource: (args) => args.projectId,
      handler: async (args, ctx) => {
        if (ctx.dryRun) return plan(`Would promote ${args.deploymentId} to production`, args);
        const result = await vercel(ctx).promote(args.projectId, args.deploymentId);
        return { summary: `Promoted ${args.deploymentId} to production for ${args.projectId}`, data: result };
      },
    }),

    defineTool({
      name: 'vercel.env.list',
      title: 'Vercel — list environment variables',
      description: 'Lists a project\'s environment variables. Encrypted values are not returned by Vercel, and this server does not attempt to decrypt them.',
      provider: 'vercel',
      operationClass: 'read',
      inputSchema: { project: z.string().min(1) },
      handler: async (args, ctx) => {
        const body = (await vercel(ctx).listEnv(args.project)) as { envs?: unknown[] };
        return listPayload('environment variables', body.envs ?? [], ['id', 'key', 'type', 'target', 'gitBranch', 'comment', 'updatedAt']);
      },
    }),

    defineTool({
      name: 'vercel.env.set',
      title: 'Vercel — set an environment variable',
      description:
        'Creates or updates a project environment variable, encrypted by default. Idempotent: re-running a configuration step does not fail on "already exists". Accepts a vault handle so a database credential can be installed without passing through the transcript.',
      provider: 'vercel',
      operationClass: 'write',
      // The caller may pass the secret literally; the registry masks it
      // out of the audit record because of this line (SEB-D 31).
      secretArgs: ['value'],
      annotations: { idempotentHint: true },
      inputSchema: {
        project: z.string().min(1),
        key: z.string().min(1),
        value: z.string().optional(),
        valueFromHandle: z.string().optional().describe('A vault handle, e.g. from neon.connection.get.'),
        target: z.array(z.enum(['production', 'preview', 'development'])).min(1),
        type: z.enum(['encrypted', 'plain', 'sensitive']).optional().describe('Defaults to encrypted.'),
        gitBranch: z.string().optional().describe('Preview target only.'),
        comment: z.string().optional(),
      },
      resource: (args) => `${args.project}:${args.key}`,
      handler: async (args, ctx) => {
        if (ctx.dryRun) {
          return plan(`Would set ${args.key} on ${args.project} for ${args.target.join(', ')}`, { ...args, value: '«redacted»', valueFromHandle: args.valueFromHandle ? '«handle»' : undefined });
        }
        const value = resolveSecretArgument(args, ctx.vault);
        const result = await vercel(ctx).upsertEnv(args.project, { ...args, value });
        return { summary: `Set ${args.key} on ${args.project} for ${args.target.join(', ')}`, data: { key: args.key, target: args.target, result } };
      },
    }),

    defineTool({
      name: 'vercel.env.delete',
      title: 'Vercel — delete an environment variable',
      description: 'Removes a project environment variable. Protected: the next deployment loses the value, and an encrypted value cannot be read back from Vercel to restore it.',
      provider: 'vercel',
      operationClass: 'protected',
      inputSchema: { project: z.string().min(1), envId: z.string().min(1), key: z.string().min(1).describe('The variable name, for the audit record and the protected-resource check.') },
      resource: (args) => `${args.project}:${args.key}`,
      preImage: async (args, ctx) => ({
        preImage: await vercel(ctx).getEnv(args.project, args.envId),
        restoreHint:
          'This records the variable METADATA — key, target, type. Vercel does not return an encrypted VALUE, so restoring requires the original source of the value.',
      }),
      handler: async (args, ctx) => {
        if (ctx.dryRun) return plan(`Would delete ${args.key} from ${args.project}`, args);
        await vercel(ctx).deleteEnv(args.project, args.envId);
        return { summary: `Deleted ${args.key} from ${args.project}`, warnings: ['The next deployment will not see this variable.'] };
      },
    }),

    defineTool({
      name: 'vercel.domain.list',
      title: 'Vercel — list project domains',
      description: 'Lists the domains attached to a project and their verification state.',
      provider: 'vercel',
      operationClass: 'read',
      inputSchema: { project: z.string().min(1) },
      handler: async (args, ctx) => {
        const body = (await vercel(ctx).listProjectDomains(args.project)) as { domains?: unknown[] };
        return listPayload('domains', body.domains ?? [], ['name', 'verified', 'apexName', 'gitBranch', 'redirect']);
      },
    }),

    defineTool({
      name: 'vercel.domain.add',
      title: 'Vercel — attach a domain to a project',
      description: 'Attaches a domain to a project. It stays unverified until its DNS points at Vercel.',
      provider: 'vercel',
      operationClass: 'write',
      inputSchema: { project: z.string().min(1), name: z.string().min(1) },
      resource: (args) => args.name,
      handler: async (args, ctx) => {
        if (ctx.dryRun) return plan(`Would attach ${args.name} to ${args.project}`, args);
        const domain = await vercel(ctx).addProjectDomain(args.project, args.name);
        return { summary: `Attached ${args.name} to ${args.project}`, data: domain };
      },
    }),

    defineTool({
      name: 'vercel.domain.remove',
      title: 'Vercel — detach a domain from a project',
      description: 'Detaches a domain from a project. Protected: traffic to that domain stops being served by this project immediately. The domain registration itself is untouched.',
      provider: 'vercel',
      operationClass: 'protected',
      inputSchema: { project: z.string().min(1), name: z.string().min(1) },
      resource: (args) => args.name,
      preImage: async (args, ctx) => ({
        preImage: await vercel(ctx).listProjectDomains(args.project),
        restoreHint: 'Re-attach with vercel.domain.add. DNS is unaffected by detaching.',
      }),
      handler: async (args, ctx) => {
        if (ctx.dryRun) return plan(`Would detach ${args.name} from ${args.project}`, args);
        await vercel(ctx).removeProjectDomain(args.project, args.name);
        return { summary: `Detached ${args.name} from ${args.project}` };
      },
    }),

    defineTool({
      name: 'vercel.domain.check',
      title: 'Vercel — check domain availability and price',
      description: 'Checks whether a domain is available to register through Vercel and what it costs. Read-only: nothing is bought and nothing is reserved.',
      provider: 'vercel',
      operationClass: 'read',
      inputSchema: { domain: z.string().min(1) },
      handler: async (args, ctx) => {
        const client = vercel(ctx);
        const [availability, price] = await Promise.all([
          client.domainAvailability(args.domain),
          client.domainPrice(args.domain).catch(() => undefined),
        ]);
        return {
          summary: `Availability and price for ${args.domain}`,
          data: { domain: args.domain, availability, price },
          warnings: price ? [] : ['Vercel returned no price, which usually means the TLD is not sold through Vercel.'],
        };
      },
    }),

    defineTool({
      name: 'vercel.domain.buy',
      title: 'Vercel — buy a domain',
      description:
        'Registers a domain through Vercel. THIS SPENDS MONEY. It is refused unless a spending policy has been turned on deliberately. The price Vercel actually quotes — not the ceiling you declare — is checked against the single-purchase limit, the policy currency and the rolling 30-day cap immediately before the registrar is called, and the amount charged is written to the audit record. AUTO-RENEW IS OFF unless you ask for it: a renewal is levied by the registrar with no call to this server, so it can never be approved, audited or counted against the cap.',
      provider: 'vercel',
      operationClass: 'write',
      annotations: { idempotentHint: false, destructiveHint: false },
      inputSchema: {
        domain: z.string().min(1),
        maxPrice: z.number().positive().describe('The most you are willing to pay, in the spending policy currency. A higher quoted price aborts. This is a pre-check only — the real quote is what the policy binds.'),
        currency: z.string().length(3).describe('ISO currency of maxPrice. Must match the spending policy currency; this server does not convert.'),
        renew: z
          .boolean()
          .optional()
          .describe('Auto-renew. DEFAULTS TO FALSE. Turning it on creates a recurring annual charge this server will never see and therefore can never gate.'),
      },
      resource: (args) => args.domain,
      // A pre-check on the ceiling the caller ANNOUNCES: it refuses an
      // intent to overspend before a single provider call is made. It is
      // not the money gate — ctx.commitSpend is (SEB-D 29).
      purchase: (args) => ({ amount: args.maxPrice, currency: args.currency, description: `Register the domain ${args.domain}` }),
      handler: async (args, ctx) => {
        const client = vercel(ctx);
        const price = await client.domainPrice(args.domain);
        const quoted = price.price;
        if (typeof quoted !== 'number') {
          return {
            summary: `Vercel returned no price for ${args.domain}, so nothing was bought.`,
            data: { domain: args.domain, bought: false, price },
            warnings: ['A purchase is never attempted without a quoted price.'],
          };
        }

        // The registry's own currency guard compares what the CALLER
        // declared. This compares what the PROVIDER quoted, which is the
        // only comparison that constrains the real charge.
        const quotedCurrency = price.currency ?? args.currency;

        // `period` is how many YEARS the quote covers. Ignoring it means a
        // TLD with a multi-year minimum has its total compared against a
        // per-year ceiling, and `expectedPrice` matches either way — so the
        // provider backstop does not catch it.
        const period = typeof price.period === 'number' ? price.period : 1;

        if (quoted > args.maxPrice) {
          return {
            summary: `Not bought: ${args.domain} is quoted at ${quoted} ${quotedCurrency}${period > 1 ? ` for ${period} years` : ''}, above the ${args.maxPrice} ${args.currency} limit you set.`,
            data: { domain: args.domain, bought: false, quoted, currency: quotedCurrency, period, maxPrice: args.maxPrice },
          };
        }
        if (ctx.dryRun) {
          return plan(`Would buy ${args.domain} at ${quoted} ${quotedCurrency}${period > 1 ? ` for ${period} years` : ''}`, { ...args, quoted, currency: quotedCurrency, period });
        }

        // THE MONEY GATE. Throws POLICY_SPEND_LIMIT if the real quote
        // breaches the single-purchase limit, the policy currency or the
        // rolling cap — before the registrar is called, and after the
        // price is known. This is also what writes the cost to the audit
        // record, which is what §26.6 means by "audited with its cost".
        ctx.commitSpend({
          amount: quoted,
          currency: quotedCurrency,
          description: `Register ${args.domain}${period > 1 ? ` for ${period} years` : ''}`,
        });

        const renew = args.renew ?? false;
        const order = await client.buyDomain(args.domain, { expectedPrice: quoted, renew });
        return {
          summary: `Bought ${args.domain} for ${quoted} ${quotedCurrency}${period > 1 ? ` (${period} years)` : ''}${renew ? ', auto-renew ON' : ''}`,
          data: { domain: args.domain, bought: true, quoted, currency: quotedCurrency, period, renew, order },
          warnings: renew
            ? ['Auto-renew is ON. Every renewal is levied by the registrar with no call to this server, so it is never gated, never approved and never counted against the rolling cap.']
            : undefined,
        };
      },
    }),
  ];
}
