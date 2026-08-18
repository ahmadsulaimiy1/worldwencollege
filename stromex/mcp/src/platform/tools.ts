/**
 * The `stromex.*` tools — the server's view of itself.
 *
 * These exist because a control nobody can inspect is a control nobody
 * trusts. `stromex.policy.describe` states exactly what will be refused
 * and why; `stromex.audit.verify` proves the record has not been edited;
 * `stromex.recovery.list` shows what was captured before anything
 * irreversible ran. An audit trail nobody reads is not a control
 * (`SEB §21.8`), so reading it is a tool rather than a chore.
 */

import { z } from 'zod';
import {
  PROVIDER_CREDENTIALS,
  PROVIDER_NAMES,
  type ProviderName,
  type StromexConfig,
} from '../config.js';
import { defineTool, type ToolDefinition } from '../core/registry.js';
import { HEALTH_PROBES, circuitState, credentialFingerprint } from '../providers/index.js';
import { toStromexError } from '../core/errors.js';

export interface PlatformToolOptions {
  config: StromexConfig;
  active: ProviderName[];
  version: string;
}

export function platformTools(options: PlatformToolOptions): ToolDefinition[] {
  const { config, active, version } = options;

  return [
    defineTool({
      name: 'stromex.health.check',
      title: 'StromeX — health check',
      description:
        'Performs one cheap authenticated READ against every configured provider and reports each one separately, with latency, the credential fingerprint that answered, and the circuit-breaker state. A provider that is reachable but whose credential is rejected is reported as unhealthy, not as up — that distinction is the whole point of the check.',
      provider: 'stromex',
      operationClass: 'read',
      inputSchema: {
        provider: z.enum(PROVIDER_NAMES).optional().describe('Check one provider instead of all of them.'),
      },
      handler: async (args, ctx) => {
        const targets = args.provider ? active.filter((name) => name === args.provider) : active;
        if (targets.length === 0) {
          return {
            summary: args.provider
              ? `${args.provider} is not configured on this server instance.`
              : 'No providers are configured on this server instance.',
            data: { checked: 0, results: [] },
            warnings: ['Run the doctor command to see which credentials are missing.'],
          };
        }

        const results = await Promise.all(
          targets.map(async (name) => {
            const client = ctx.providers[name];
            const started = Date.now();
            try {
              const probe = await HEALTH_PROBES[name](client);
              return {
                provider: name,
                healthy: true,
                latencyMs: Date.now() - started,
                detail: probe.detail,
                credentialFingerprint: credentialFingerprint(client),
                circuit: circuitState(client),
              };
            } catch (thrown) {
              const error = toStromexError(thrown, { provider: name, operation: 'health' });
              return {
                provider: name,
                healthy: false,
                latencyMs: Date.now() - started,
                detail: error.message,
                errorCode: error.code,
                remediation: error.remediation,
                credentialFingerprint: credentialFingerprint(client),
                circuit: circuitState(client),
              };
            }
          }),
        );

        const unhealthy = results.filter((result) => !result.healthy);
        return {
          summary:
            unhealthy.length === 0
              ? `All ${results.length} configured provider(s) healthy`
              : `${unhealthy.length} of ${results.length} provider(s) unhealthy: ${unhealthy.map((r) => r.provider).join(', ')}`,
          data: { checked: results.length, results },
          ...(unhealthy.length ? { warnings: unhealthy.map((r) => `${r.provider}: ${r.detail}`) } : {}),
        };
      },
    }),

    defineTool({
      name: 'stromex.policy.describe',
      title: 'StromeX — describe the authority policy',
      description:
        'States exactly what this server instance will and will not do: the protected-operation mode, the protected-resource patterns, the spending policy, and which providers are exposed. Read it before assuming an operation is available.',
      provider: 'stromex',
      operationClass: 'read',
      inputSchema: {},
      handler: async (_args, _ctx) => ({
        summary: `Protected operations: ${config.policy.protectedOperations}; spending ${config.policy.spending.enabled ? 'enabled' : 'disabled'}; ${active.length} provider(s) exposed`,
        data: {
          version,
          readOnly: config.policy.readOnly,
          protectedOperations: config.policy.protectedOperations,
          protectedResourcePatterns: config.policy.protectedResources,
          spending: config.policy.spending,
          providersConfigured: active,
          providersKnown: PROVIDER_NAMES,
          auditLog: config.auditPath,
          approvals: config.approvalsPath,
          recoveryJournal: config.journalPath,
          authorityClasses: {
            read: 'Observation only. Always permitted.',
            write: 'Creates or changes a resource, reversibly. Permitted autonomously.',
            protected: 'Permanently destroys or removes something. Never autonomous, and refused outright on a protected resource whatever the approval.',
          },
        },
      }),
    }),

    defineTool({
      name: 'stromex.credentials.status',
      title: 'StromeX — credential status',
      description:
        'Reports which provider credentials are configured, where each came from, and a non-reversible fingerprint of each. Never reports a credential value; the fingerprint is there so you can tell whether a key changed without learning what it is.',
      provider: 'stromex',
      operationClass: 'read',
      inputSchema: {},
      handler: async (_args, _ctx) => {
        const rows = PROVIDER_NAMES.map((name) => {
          const spec = PROVIDER_CREDENTIALS[name];
          const required = config.secrets.status(spec.required);
          const optional = config.secrets.status(spec.optional);
          return {
            provider: name,
            configured: required.every((entry) => entry.configured),
            purpose: spec.purpose,
            required,
            optional,
          };
        });
        const ready = rows.filter((row) => row.configured);
        return {
          summary: `${ready.length} of ${rows.length} providers configured`,
          data: { providers: rows, exposed: active },
        };
      },
    }),

    defineTool({
      name: 'stromex.audit.query',
      title: 'StromeX — query the audit trail',
      description:
        'Returns audit records, newest first, filtered by time, tool, provider, outcome or authority class. Refusals are recorded as carefully as actions: a run of policy denials is either an attack or a broken workflow, and both are worth seeing.',
      provider: 'stromex',
      operationClass: 'read',
      inputSchema: {
        since: z.string().optional().describe('RFC3339.'),
        until: z.string().optional().describe('RFC3339.'),
        tool: z.string().optional(),
        provider: z.string().optional(),
        outcome: z.enum(['ok', 'error', 'denied', 'approval_required', 'dry_run']).optional(),
        operationClass: z.enum(['read', 'write', 'protected']).optional(),
        workflowRunId: z.string().optional(),
        limit: z.number().int().min(1).max(500).optional(),
      },
      handler: async (args, ctx) => {
        const records = ctx.audit.query(args);
        return { summary: `${records.length} audit record(s)`, data: { count: records.length, records } };
      },
    }),

    defineTool({
      name: 'stromex.audit.verify',
      title: 'StromeX — verify the audit chain',
      description:
        'Recomputes the whole hash chain and reports the exact sequence number at which it breaks, if it does, and which of three things happened: a record was removed or reordered, a record was inserted, or a record was edited after it was written. This is tamper-EVIDENT, not tamper-proof: anyone who can write the file can rewrite the chain from a chosen point.',
      provider: 'stromex',
      operationClass: 'read',
      inputSchema: {},
      handler: async (_args, ctx) => {
        const result = ctx.audit.verify();
        return {
          summary: result.ok
            ? `Audit chain intact across ${result.total} record(s)`
            : `AUDIT CHAIN BROKEN at sequence ${result.brokenAtSeq}: ${result.reason}`,
          data: { ...result, file: ctx.audit.file },
          ...(result.ok
            ? {}
            : { warnings: ['Do not edit the audit log. See mcp/docs/recovery.md § Audit log for what to do next.'] }),
        };
      },
    }),

    defineTool({
      name: 'stromex.recovery.list',
      title: 'StromeX — list recovery journal entries',
      description: 'Lists the pre-images captured before irreversible operations, newest first. This is what you read when something needs putting back.',
      provider: 'stromex',
      operationClass: 'read',
      inputSchema: { limit: z.number().int().min(1).max(200).optional() },
      handler: async (args, ctx) => {
        const entries = ctx.journal.list(args.limit ?? 25);
        return {
          summary: `${entries.length} recovery journal entr${entries.length === 1 ? 'y' : 'ies'}`,
          data: { count: entries.length, entries: entries.map(({ preImage: _preImage, ...rest }) => rest) },
        };
      },
    }),

    defineTool({
      name: 'stromex.recovery.get',
      title: 'StromeX — read a recovery journal entry',
      description:
        'Returns one pre-image in full, with its restore hint. A pre-image records CONFIGURATION, not data: it can rebuild a DNS record or an environment variable, and it cannot rebuild the objects in a bucket or the rows in a database.',
      provider: 'stromex',
      operationClass: 'read',
      inputSchema: { id: z.string().min(1) },
      handler: async (args, ctx) => {
        const entry = ctx.journal.get(args.id);
        if (!entry) {
          return { summary: `No recovery journal entry ${args.id}`, data: { found: false } };
        }
        return { summary: `Pre-image of ${entry.resource} taken ${entry.ts}`, data: entry };
      },
    }),

    defineTool({
      name: 'stromex.approval.list',
      title: 'StromeX — list approval requests',
      description:
        'Lists approval requests and their state. A pending request is waiting for a human: `stromex-mcp approve <id> --phrase "<phrase>"` in a terminal, or an elicitation reply if the client supports one.',
      provider: 'stromex',
      operationClass: 'read',
      inputSchema: { status: z.enum(['pending', 'approved', 'consumed', 'expired', 'rejected']).optional() },
      handler: async (args, ctx) => {
        const requests = ctx.approvals.list(args.status ? { status: args.status } : {});
        return {
          summary: `${requests.length} approval request(s)${args.status ? ` with status ${args.status}` : ''}`,
          data: { count: requests.length, requests },
        };
      },
    }),

    defineTool({
      name: 'stromex.handles.list',
      title: 'StromeX — list credential handles',
      description:
        'Lists the live handles in this process\'s vault — their labels, origins and expiry. Never their values: there is no tool that reads a handle back as text, by design.',
      provider: 'stromex',
      operationClass: 'read',
      inputSchema: {},
      handler: async (_args, ctx) => {
        const entries = ctx.vault.list();
        return { summary: `${entries.length} live credential handle(s)`, data: { count: entries.length, handles: entries } };
      },
    }),

    defineTool({
      name: 'stromex.version',
      title: 'StromeX — server version and limits',
      description: 'Returns the server version, the protocol it speaks, and the limitations it knows about itself.',
      provider: 'stromex',
      operationClass: 'read',
      inputSchema: {},
      handler: async (_args, _ctx) => ({
        summary: `StromeX Enterprise MCP ${version}`,
        data: {
          version,
          providers: active,
          knownLimitations: [
            'Cloudflare Pages direct asset upload is delegated to Wrangler; this server triggers git-connected builds only.',
            'Worker log tailing returns a session; streaming is a WebSocket concern this server does not perform.',
            'Neon has no logical-dump API: a backup here is a timestamped branch, which does not survive project deletion.',
            'The audit chain is tamper-evident, not tamper-proof, until an append-only external sink is configured.',
            'Out-of-band approval defends against accidents, not against an agent holding a shell on this machine.',
            'No provider adapter in this build has been exercised against a real credential.',
          ],
        },
      }),
    }),
  ];
}
