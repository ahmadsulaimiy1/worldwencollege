#!/usr/bin/env node
/**
 * The CLI.
 *
 * `serve` is the MCP entry point. The other commands exist because some
 * things must be done by a person at a terminal rather than by an agent
 * over a protocol — approving a destructive operation, reading the audit
 * trail, confirming that credentials work.
 *
 * STDOUT DISCIPLINE: under `serve`, stdout carries JSON-RPC and nothing
 * else. Every other command may print freely, because no protocol is on
 * the wire.
 */

import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import { PROVIDER_CREDENTIALS, PROVIDER_NAMES, configuredProviders, loadConfig } from './config.js';
import { ApprovalStore } from './core/approval.js';
import { AuditLog } from './core/audit.js';
import { StromexError, toStromexError } from './core/errors.js';
import { Logger } from './core/logger.js';
import { SERVER_VERSION, buildServer } from './server.js';
import { HEALTH_PROBES, buildProviders } from './providers/index.js';

interface ParsedArgs {
  command: string;
  positional: string[];
  flags: Record<string, string | boolean>;
}

function parseArgs(argv: readonly string[]): ParsedArgs {
  const [command = 'serve', ...rest] = argv;
  const positional: string[] = [];
  const flags: Record<string, string | boolean> = {};
  for (let index = 0; index < rest.length; index += 1) {
    const token = rest[index]!;
    if (!token.startsWith('--')) {
      positional.push(token);
      continue;
    }
    const [name, inline] = token.slice(2).split('=', 2);
    if (!name) continue;
    if (inline !== undefined) {
      flags[name] = inline;
    } else if (rest[index + 1] && !rest[index + 1]!.startsWith('--')) {
      flags[name] = rest[index + 1]!;
      index += 1;
    } else {
      flags[name] = true;
    }
  }
  return { command, positional, flags };
}

async function main(): Promise<number> {
  const { command, positional, flags } = parseArgs(process.argv.slice(2));

  if (command === 'help' || flags['help']) {
    printHelp();
    return 0;
  }
  if (command === 'version') {
    process.stdout.write(`stromex-enterprise-mcp ${SERVER_VERSION}\n`);
    return 0;
  }

  const envFile = typeof flags['env-file'] === 'string' ? flags['env-file'] : undefined;
  const config = loadConfig({ envFile, overrides: typeof flags['log-level'] === 'string' ? { logLevel: flags['log-level'] as never } : {} });

  switch (command) {
    case 'serve':
      return serve(config);
    case 'doctor':
      return doctor(config);
    case 'approvals':
      return listApprovals(config);
    case 'approve':
      return approve(config, positional[0], flags);
    case 'reject':
      return reject(config, positional[0], flags);
    case 'audit':
      return audit(config, flags);
    case 'catalogue':
      return catalogue(config, flags);
    default:
      process.stderr.write(`Unknown command: ${command}\n\n`);
      printHelp();
      return 2;
  }
}

async function serve(config: ReturnType<typeof loadConfig>): Promise<number> {
  const logger = new Logger({ level: config.logLevel });
  const built = buildServer({ config, logger });
  const transport = new StdioServerTransport();
  await built.server.connect(transport);
  logger.info('listening on stdio', { tools: built.tools.length, providers: built.active });

  // Resolve only when the transport closes, so the process stays alive.
  await new Promise<void>((resolve) => {
    transport.onclose = () => resolve();
    process.once('SIGINT', () => resolve());
    process.once('SIGTERM', () => resolve());
  });
  logger.info('transport closed; shutting down');
  return 0;
}

/**
 * `doctor` is the first thing an operator should run, and the only
 * command that makes a real network call to every provider. It reports
 * per provider, with the credential fingerprint that answered — never the
 * credential.
 */
async function doctor(config: ReturnType<typeof loadConfig>): Promise<number> {
  const logger = new Logger({ level: 'error' });
  const out = (line: string) => process.stdout.write(line + '\n');

  out(`StromeX Enterprise MCP ${SERVER_VERSION} — doctor\n`);
  out(`State directory   ${config.stateDir}`);
  out(`Audit log         ${config.auditPath}`);
  out(`Protected ops     ${config.policy.protectedOperations}`);
  out(`Read-only         ${config.policy.readOnly}`);
  out(`Spending          ${config.policy.spending.enabled ? `enabled, max ${config.policy.spending.maxSinglePurchase} ${config.policy.spending.currency} per purchase, ${config.policy.spending.monthlyCap} monthly` : 'disabled'}`);
  out(`Protected patterns ${config.policy.protectedResources.length} (see stromex.policy.describe)\n`);

  for (const warning of config.warnings) out(`  ! ${warning}`);
  if (config.warnings.length) out('');

  out('Credentials');
  const configured = configuredProviders(config.secrets);
  for (const name of PROVIDER_NAMES) {
    const spec = PROVIDER_CREDENTIALS[name];
    const required = config.secrets.status(spec.required);
    const missing = required.filter((entry) => !entry.configured);
    if (missing.length > 0) {
      out(`  ✗ ${name.padEnd(11)} not configured — missing ${missing.map((entry) => entry.name).join(', ')}`);
      out(`      needed to ${spec.purpose}`);
      continue;
    }
    const sources = required.map((entry) => `${entry.name}=${entry.source}:${entry.fingerprint}`).join(' ');
    out(`  ✓ ${name.padEnd(11)} ${sources}`);
  }
  out('');

  if (configured.length === 0) {
    out('No providers are configured, so no live check was made.');
    out('See mcp/docs/installation.md for what each credential needs to be able to do.');
    return 1;
  }

  out('Live checks (one authenticated read each)');
  const providers = buildProviders({ config, logger });
  let failures = 0;
  for (const name of providers.active) {
    const started = Date.now();
    try {
      const probe = await HEALTH_PROBES[name](providers.clients[name]);
      out(`  ✓ ${name.padEnd(11)} ${String(Date.now() - started).padStart(5)}ms  ${probe.detail}`);
    } catch (thrown) {
      failures += 1;
      const error = toStromexError(thrown, { provider: name, operation: 'doctor' });
      out(`  ✗ ${name.padEnd(11)} ${String(Date.now() - started).padStart(5)}ms  ${error.code}: ${error.message}`);
      out(`      → ${error.remediation}`);
    }
  }
  out('');
  out(failures === 0 ? 'All configured providers answered.' : `${failures} provider(s) failed. Nothing was changed.`);
  return failures === 0 ? 0 : 1;
}

function listApprovals(config: ReturnType<typeof loadConfig>): number {
  const store = new ApprovalStore({ path: config.approvalsPath, ttlSeconds: config.approvalTtlSeconds });
  const requests = store.list();
  if (requests.length === 0) {
    process.stdout.write('No approval requests.\n');
    return 0;
  }
  for (const request of requests) {
    process.stdout.write(
      [
        `${request.id}  [${request.status}]`,
        `  tool      ${request.tool}`,
        `  resource  ${request.resource ?? '(none)'}`,
        `  what      ${request.description}`,
        `  phrase    ${request.confirmationPhrase}`,
        `  expires   ${request.expiresAt}`,
        request.status === 'pending'
          ? `  approve   stromex-mcp approve ${request.id} --phrase ${JSON.stringify(request.confirmationPhrase)}`
          : '',
        '',
      ]
        .filter(Boolean)
        .join('\n'),
    );
  }
  return 0;
}

function approve(config: ReturnType<typeof loadConfig>, id: string | undefined, flags: Record<string, string | boolean>): number {
  if (!id || typeof flags['phrase'] !== 'string') {
    process.stderr.write('Usage: stromex-mcp approve <approval-id> --phrase "<confirmation phrase>"\n');
    return 2;
  }
  const store = new ApprovalStore({ path: config.approvalsPath, ttlSeconds: config.approvalTtlSeconds });
  const request = store.approve(id, { approvedBy: process.env['USER'] ?? 'operator', channel: 'cli', phrase: flags['phrase'] });
  process.stdout.write(
    [
      `Approved ${request.id}.`,
      `  ${request.description}`,
      '',
      'This grant is single-use, bound to the exact arguments it was requested for,',
      `and expires at ${request.expiresAt}.`,
      '',
      `Now call ${request.tool} again with approvalId=${request.id} and identical arguments.`,
      '',
    ].join('\n'),
  );
  return 0;
}

function reject(config: ReturnType<typeof loadConfig>, id: string | undefined, flags: Record<string, string | boolean>): number {
  if (!id) {
    process.stderr.write('Usage: stromex-mcp reject <approval-id> [--reason "..."]\n');
    return 2;
  }
  const store = new ApprovalStore({ path: config.approvalsPath, ttlSeconds: config.approvalTtlSeconds });
  const request = store.reject(id, typeof flags['reason'] === 'string' ? flags['reason'] : 'no reason given');
  process.stdout.write(`Rejected ${request.id}.\n`);
  return 0;
}

function audit(config: ReturnType<typeof loadConfig>, flags: Record<string, string | boolean>): number {
  const log = new AuditLog({ path: config.auditPath });
  if (flags['verify']) {
    const result = log.verify();
    process.stdout.write(
      result.ok
        ? `Audit chain intact across ${result.total} record(s). Head ${result.headHash}\n`
        : `AUDIT CHAIN BROKEN at sequence ${result.brokenAtSeq}: ${result.reason}\n`,
    );
    return result.ok ? 0 : 1;
  }
  const limit = typeof flags['limit'] === 'string' ? Number.parseInt(flags['limit'], 10) : 25;
  for (const record of log.query({ limit })) {
    process.stdout.write(
      `${record.ts}  #${String(record.seq).padStart(5)}  ${record.outcome.padEnd(17)} ${record.operationClass.padEnd(9)} ${record.tool}${record.resource ? `  ${record.resource}` : ''}${record.errorCode ? `  ${record.errorCode}` : ''}\n`,
    );
  }
  return 0;
}

function catalogue(config: ReturnType<typeof loadConfig>, flags: Record<string, string | boolean>): number {
  const built = buildServer({ config, logger: new Logger({ level: 'error' }) });
  const rows = built.tools
    .map((tool) => ({ name: tool.name, provider: tool.provider, class: tool.operationClass, title: tool.title }))
    .sort((a, b) => (a.name < b.name ? -1 : 1));

  if (flags['format'] === 'markdown') {
    process.stdout.write('| Tool | Provider | Class | What it does |\n|---|---|---|---|\n');
    for (const row of rows) process.stdout.write(`| \`${row.name}\` | ${row.provider} | ${row.class} | ${row.title} |\n`);
  } else {
    for (const row of rows) process.stdout.write(`${row.class.padEnd(10)} ${row.name.padEnd(38)} ${row.title}\n`);
  }
  process.stderr.write(`\n${rows.length} tools across ${built.active.length} configured provider(s).\n`);
  return 0;
}

function printHelp(): void {
  process.stdout.write(
    [
      `StromeX Enterprise Infrastructure MCP ${SERVER_VERSION}`,
      '',
      'Usage: stromex-mcp <command> [options]',
      '',
      'Commands',
      '  serve                        Run the MCP server on stdio (default).',
      '  doctor                       Check configuration and make one authenticated read per provider.',
      '  approvals                    List approval requests and their state.',
      '  approve <id> --phrase "..."  Grant a pending approval. A human does this, at a terminal.',
      '  reject <id> [--reason "..."] Refuse a pending approval.',
      '  audit [--limit N]            Print recent audit records.',
      '  audit --verify               Recompute the audit hash chain.',
      '  catalogue [--format=markdown] Print the tool catalogue.',
      '  version                      Print the version.',
      '',
      'Options',
      '  --env-file <path>            Load credentials from a mode-checked env file (must be 0600).',
      '  --log-level <level>          debug | info | warn | error',
      '',
      'Configuration is by environment variable; see mcp/docs/installation.md.',
      'What this server refuses to do, and why: mcp/docs/security.md and the Editorial Bible, Volume 26.',
      '',
    ].join('\n'),
  );
}

main()
  .then((code) => {
    process.exitCode = code;
  })
  .catch((thrown: unknown) => {
    const error = thrown instanceof StromexError ? thrown : toStromexError(thrown);
    process.stderr.write(`\n${error.code}: ${error.message}\n→ ${error.remediation}\n\n`);
    process.exitCode = 1;
  });
