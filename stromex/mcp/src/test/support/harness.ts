/**
 * A whole server in memory.
 *
 * Builds the real configuration, the real policy engine, the real
 * registry and the real adapters — with only the filesystem and the
 * network replaced. Tests therefore exercise the actual gate, not a
 * simplified copy of it, which is the only way a test of the gate is
 * worth anything.
 */

import { AuditLog, memorySink } from '../../core/audit.js';
import { ApprovalStore, memoryIo } from '../../core/approval.js';
import { RecoveryJournal } from '../../core/journal.js';
import { HandleVault } from '../../core/vault.js';
import { Logger } from '../../core/logger.js';
import { PolicyEngine, type PolicyConfig } from '../../core/policy.js';
import { newRequestId, type ToolContext, type ToolDefinition } from '../../core/registry.js';
import type { FetchLike } from '../../core/http.js';
import { loadConfig, type StromexConfig } from '../../config.js';

export interface HarnessOptions {
  env?: NodeJS.ProcessEnv;
  policy?: Partial<PolicyConfig>;
  fetchImpl?: FetchLike;
  /** Fixed clock. Defaults to a fixed instant so records are deterministic. */
  now?: () => Date;
  elicit?: ToolContext['elicit'];
}

export interface Harness {
  config: StromexConfig;
  policy: PolicyEngine;
  audit: AuditLog;
  auditLines: string[];
  approvals: ApprovalStore;
  journal: RecoveryJournal;
  journalLines: string[];
  vault: HandleVault;
  logLines: string[];
  context(overrides?: Partial<ToolContext>): ToolContext;
  /** Registers a provider client under a name for `clientFor` to find. */
  withClient(name: string, client: unknown): Harness;
}

const FIXED_NOW = new Date('2026-08-18T09:00:00.000Z');

export function harness(options: HarnessOptions = {}): Harness {
  const now = options.now ?? (() => FIXED_NOW);
  const config = loadConfig({ env: options.env ?? {} });
  const policy = new PolicyEngine({ ...config.policy, ...options.policy });

  const auditSink = memorySink();
  const audit = new AuditLog({ path: '(memory)', sink: auditSink, now });
  const approvals = new ApprovalStore({ path: '(memory)', io: memoryIo(), now });
  const journalSink = memorySink();
  const journal = new RecoveryJournal({ path: '(memory)', sink: journalSink, now });
  const vault = new HandleVault({ now });

  const logLines: string[] = [];
  const logger = new Logger({ level: 'debug', sink: (line) => logLines.push(line), now });

  const providers: Record<string, unknown> = {};

  const built: Harness = {
    config,
    policy,
    audit,
    auditLines: auditSink.lines,
    approvals,
    journal,
    journalLines: journalSink.lines,
    vault,
    logLines,
    context(overrides = {}) {
      return {
        // The project register the config resolved. A test that names a
        // project exercises the same attribution path production does.
        projects: config.projects,
        // Replaced by the registry per invocation; a test that reaches
        // this one is calling a handler outside the gate.
        commitSpend: () => {
          throw new Error('commitSpend was called outside a tool invocation');
        },
        spendingEnabled: policy.spendingEnabled,
        assertSpendHeadroom: () => {
          throw new Error('assertSpendHeadroom was called outside a tool invocation');
        },
        logger,
        policy,
        audit,
        approvals,
        journal,
        vault,
        actor: 'test',
        requestId: newRequestId(),
        dryRun: false,
        now,
        providers,
        ...(options.elicit ? { elicit: options.elicit } : {}),
        ...overrides,
      };
    },
    withClient(name, client) {
      providers[name] = client;
      return built;
    },
  };
  return built;
}

/** Finds a tool by name in a definition list, failing loudly if absent. */
export function tool(definitions: readonly ToolDefinition[], name: string): ToolDefinition {
  const found = definitions.find((definition) => definition.name === name);
  if (!found) throw new Error(`No tool named ${name}. Available: ${definitions.map((d) => d.name).join(', ')}`);
  return found;
}
