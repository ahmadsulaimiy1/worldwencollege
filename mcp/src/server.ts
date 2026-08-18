/**
 * Server assembly.
 *
 * Everything the server is made of is constructed here, once, and handed
 * to the registry. Nothing below reaches a provider directly; nothing
 * below decides authority. This file's only job is to wire the parts
 * together in the right order and to give every tool call a fresh
 * context.
 */

import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { AuditLog } from './core/audit.js';
import { ApprovalStore } from './core/approval.js';
import { RecoveryJournal } from './core/journal.js';
import { HandleVault } from './core/vault.js';
import { Logger } from './core/logger.js';
import { StromexError } from './core/errors.js';
import { PolicyEngine } from './core/policy.js';
import {
  newRequestId,
  registerTools,
  type ElicitFunction,
  type ToolContext,
  type ToolDefinition,
} from './core/registry.js';
import type { FetchLike } from './core/http.js';
import { type ProviderName, type StromexConfig } from './config.js';
import { buildProviders } from './providers/index.js';
import { platformTools } from './platform/tools.js';
import { workflowTools } from './workflows/tools.js';

export const SERVER_NAME = 'stromex-enterprise-mcp';
export const SERVER_VERSION = '1.0.0';

export interface BuildServerOptions {
  config: StromexConfig;
  logger?: Logger;
  /** Injected by the integration and end-to-end suites. */
  fetchImpl?: FetchLike;
  now?: () => Date;
  /** Overrides for the state stores, used by tests to stay in memory. */
  stores?: {
    audit?: AuditLog;
    approvals?: ApprovalStore;
    journal?: RecoveryJournal;
    vault?: HandleVault;
  };
}

export interface BuiltServer {
  server: McpServer;
  tools: ToolDefinition[];
  toolsByName: Map<string, ToolDefinition>;
  active: ProviderName[];
  audit: AuditLog;
  approvals: ApprovalStore;
  journal: RecoveryJournal;
  vault: HandleVault;
  policy: PolicyEngine;
  logger: Logger;
}

export function buildServer(options: BuildServerOptions): BuiltServer {
  const { config } = options;
  const now = options.now ?? (() => new Date());
  const logger = options.logger ?? new Logger({ level: config.logLevel, base: { server: SERVER_NAME } });

  const audit = options.stores?.audit ?? new AuditLog({ path: config.auditPath, now });
  const approvals =
    options.stores?.approvals ?? new ApprovalStore({ path: config.approvalsPath, ttlSeconds: config.approvalTtlSeconds, now });
  const journal = options.stores?.journal ?? new RecoveryJournal({ path: config.journalPath, now });
  const vault = options.stores?.vault ?? new HandleVault({ now });
  const policy = new PolicyEngine(config.policy);

  const providers = buildProviders({ config, logger, fetchImpl: options.fetchImpl });

  const server = new McpServer(
    { name: SERVER_NAME, version: SERVER_VERSION },
    {
      capabilities: { tools: { listChanged: false }, resources: {}, logging: {} },
      instructions: instructions(config, providers.active),
    },
  );

  const toolsByName = new Map<string, ToolDefinition>();

  /**
   * Elicitation is offered only when the connected client declared it.
   * Guessing produces a request that never returns, which for a protected
   * operation means a hang rather than a refusal.
   */
  const elicit = (): ElicitFunction | undefined => {
    const capabilities = server.server.getClientCapabilities();
    if (!capabilities?.elicitation) return undefined;
    return async (request) =>
      server.server.elicitInput({
        mode: 'form',
        message: request.message,
        requestedSchema: request.requestedSchema as never,
      }) as never;
  };

  const contextFor = (): ToolContext => ({
    logger,
    policy,
    audit,
    approvals,
    journal,
    vault,
    actor: config.actor,
    requestId: newRequestId(),
    elicit: elicit(),
    dryRun: false,
    now,
    providers: providers.clients,
    // Replaced by the registry on every invocation, which is the only
    // place that can close over the audit log for the rolling window. A
    // handler that somehow reached this one would be spending outside the
    // gate, so it refuses rather than no-ops.
    commitSpend: () => {
      throw new StromexError({
        code: 'INTERNAL',
        message: 'commitSpend was called outside a tool invocation.',
        remediation: 'This is a defect: every charge must go through the registry, which binds it to the spending policy and the audit record.',
      });
    },
    assertSpendHeadroom: () => {
      throw new StromexError({
        code: 'INTERNAL',
        message: 'assertSpendHeadroom was called outside a tool invocation.',
        remediation: 'This is a defect: the spending policy is bound by the registry, not by a handler.',
      });
    },
  });

  const platform = platformTools({ config, active: providers.active, version: SERVER_VERSION });
  const workflows = workflowTools({
    tools: toolsByName,
    contextFor: () => contextFor(),
    active: providers.active,
    now,
  });

  const tools = [...providers.tools, ...platform, ...workflows];
  for (const tool of tools) toolsByName.set(tool.name, tool);

  registerTools({ server, definitions: tools, contextFor: () => contextFor() });
  registerResources(server, { config, policy, audit, active: providers.active });

  logger.info('server assembled', {
    providers: providers.active,
    tools: tools.length,
    protectedOperations: config.policy.protectedOperations,
    readOnly: config.policy.readOnly,
    spending: config.policy.spending.enabled,
  });
  for (const warning of config.warnings) logger.warn('configuration warning', { warning });

  return { server, tools, toolsByName, active: providers.active, audit, approvals, journal, vault, policy, logger };
}

/**
 * The instructions a client shows the model on connection. They state the
 * authority model up front, because a model that learns the rules only by
 * being refused wastes a turn discovering each one.
 */
function instructions(config: StromexConfig, active: readonly ProviderName[]): string {
  return [
    'StromeX Enterprise Infrastructure MCP — one audited, policy-governed surface over the estate\'s providers.',
    '',
    `Providers configured on this instance: ${active.length ? active.join(', ') : 'none'}.`,
    '',
    'Authority model. Every tool is one of three classes, stated at the end of its description:',
    '  [read]      Observation only. Always permitted.',
    '  [write]     Creates or changes a resource, reversibly. Runs without asking — this is delegated authority and it is meant to be used.',
    '  [protected] Permanently destroys something. Never runs autonomously.',
    '',
    'Two rules sit above the classes and are not negotiable:',
    '  · Institutional records — certificates, transcripts, student records, registrar data, audit logs, production stores — are never destroyed by this server, with or without approval. Archive, revoke, supersede or deactivate instead; those are ordinary write operations.',
    '  · Nothing that costs money is bought unless a spending policy has been turned on deliberately.',
    '',
    `Protected-operation mode on this instance: ${config.policy.protectedOperations}.`,
    `Read-only mode: ${config.policy.readOnly ? 'ON — every mutating tool is refused' : 'off'}.`,
    '',
    'Practical guidance:',
    '  · Pass dryRun=true on any mutating tool to see the exact request without sending it.',
    '  · Every result uses one envelope: ok, summary, data, warnings, error, approval, auditSeq.',
    '  · Read the warnings. They carry provider limitations and things that were not done.',
    '  · Credentials are never returned. Where one must move between providers, a tool issues a vault HANDLE and secret-setting tools accept it as valueFromHandle.',
    '  · stromex.policy.describe states exactly what this instance will refuse, before you try it.',
  ].join('\n');
}

function registerResources(
  server: McpServer,
  context: { config: StromexConfig; policy: PolicyEngine; audit: AuditLog; active: readonly ProviderName[] },
): void {
  server.registerResource(
    'policy',
    'stromex://policy',
    {
      title: 'StromeX authority policy',
      description: 'What this server instance will and will not do, in full.',
      mimeType: 'application/json',
    },
    async (uri) => ({
      contents: [
        {
          uri: uri.href,
          mimeType: 'application/json',
          text: JSON.stringify(
            {
              protectedOperations: context.config.policy.protectedOperations,
              readOnly: context.config.policy.readOnly,
              protectedResourcePatterns: context.config.policy.protectedResources,
              spending: context.config.policy.spending,
              providers: context.active,
            },
            null,
            2,
          ),
        },
      ],
    }),
  );

  server.registerResource(
    'audit-tail',
    'stromex://audit/recent',
    {
      title: 'Recent audit records',
      description: 'The last 50 audit records, newest first, redacted.',
      mimeType: 'application/json',
    },
    async (uri) => ({
      contents: [
        {
          uri: uri.href,
          mimeType: 'application/json',
          text: JSON.stringify({ records: context.audit.query({ limit: 50 }), verification: context.audit.verify() }, null, 2),
        },
      ],
    }),
  );
}
