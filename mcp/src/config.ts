/**
 * Configuration.
 *
 * One typed object, resolved once at start from CLI options, the
 * environment and (optionally) a mode-checked operator file. Every
 * default in here is chosen to be wrong in the safe direction: protected
 * operations require approval, spending is off, the protected-resource
 * list names this estate's real assets, and every provider is simply
 * absent until its credential exists.
 *
 * See mcp/docs/installation.md for the full variable list, and
 * `SEB §26` for why the defaults are what they are.
 */

import { homedir } from 'node:os';
import { join } from 'node:path';
import { StromexError } from './core/errors.js';
import type { LogLevel } from './core/logger.js';
import {
  DEFAULT_PROTECTED_RESOURCES,
  type PolicyConfig,
  type ProtectedOperationMode,
  type SpendingPolicy,
} from './core/policy.js';
import { SecretResolver, loadEnvFile } from './core/secret.js';

export const PROVIDER_NAMES = [
  'cloudflare',
  'github',
  'neon',
  'vercel',
  'clerk',
  'resend',
  'brevo',
  'openai',
] as const;

export type ProviderName = (typeof PROVIDER_NAMES)[number];

/** Credentials each provider needs, and what each one is for. */
export const PROVIDER_CREDENTIALS: Record<
  ProviderName,
  { required: readonly string[]; optional: readonly string[]; purpose: string }
> = {
  cloudflare: {
    required: ['CLOUDFLARE_API_TOKEN'],
    optional: ['CLOUDFLARE_ACCOUNT_ID'],
    purpose: 'manage Workers, Pages, D1, R2, KV, Queues and DNS',
  },
  github: {
    required: ['GITHUB_TOKEN'],
    optional: [],
    purpose: 'manage repositories, branches, pull requests, Actions and repository secrets',
  },
  neon: {
    required: ['NEON_API_KEY'],
    optional: ['NEON_PROJECT_ID'],
    purpose: 'manage Postgres projects, branches, databases and migrations',
  },
  vercel: {
    required: ['VERCEL_TOKEN'],
    optional: ['VERCEL_TEAM_ID'],
    purpose: 'manage projects, deployments, environment variables and domains',
  },
  clerk: {
    required: ['CLERK_SECRET_KEY'],
    optional: [],
    purpose: 'manage users, organisations, memberships and invitations',
  },
  resend: {
    required: ['RESEND_API_KEY'],
    optional: ['RESEND_FROM_ADDRESS'],
    purpose: 'send transactional email and manage sending domains',
  },
  brevo: {
    required: ['BREVO_API_KEY'],
    optional: ['BREVO_FROM_ADDRESS', 'BREVO_FROM_NAME'],
    purpose: 'manage contacts, lists, campaigns and transactional email',
  },
  openai: {
    required: ['OPENAI_API_KEY'],
    optional: [
      'OPENAI_MODEL',
      'OPENAI_ORG_ID',
      'OPENAI_PROJECT_ID',
      'OPENAI_PRICE_INPUT_PER_MTOK',
      'OPENAI_PRICE_OUTPUT_PER_MTOK',
      'OPENAI_PRICE_CURRENCY',
    ],
    purpose: 'consult the engineering council — independent review, alternatives, drafting and validation',
  },
};

export interface ProviderTuning {
  timeoutMs: number;
  rateLimit: { refillPerSecond: number; capacity: number };
}

/**
 * Per-provider request budgets. These are conservative on purpose: a
 * workflow fanning out over forty DNS records should be slowed by us
 * rather than by a 429 that is then retried into a second 429.
 */
export const PROVIDER_TUNING: Record<ProviderName, ProviderTuning> = {
  // Cloudflare's documented global limit is 1200 requests / 5 minutes.
  cloudflare: { timeoutMs: 30_000, rateLimit: { refillPerSecond: 3, capacity: 10 } },
  // GitHub allows 5000/hour authenticated, but secondary limits bite on writes.
  github: { timeoutMs: 30_000, rateLimit: { refillPerSecond: 4, capacity: 15 } },
  neon: { timeoutMs: 60_000, rateLimit: { refillPerSecond: 2, capacity: 8 } },
  vercel: { timeoutMs: 60_000, rateLimit: { refillPerSecond: 3, capacity: 10 } },
  clerk: { timeoutMs: 30_000, rateLimit: { refillPerSecond: 5, capacity: 15 } },
  resend: { timeoutMs: 20_000, rateLimit: { refillPerSecond: 2, capacity: 10 } },
  brevo: { timeoutMs: 30_000, rateLimit: { refillPerSecond: 5, capacity: 15 } },
  // A reasoning consultation is slow by design and expensive by the
  // token. The bucket is deliberately mean: a council consulted forty
  // times a minute is not a council, it is a bill.
  openai: { timeoutMs: 180_000, rateLimit: { refillPerSecond: 0.5, capacity: 3 } },
};

export interface HttpTransportConfig {
  enabled: boolean;
  host: string;
  port: number;
  /** Name of the secret holding the bearer token clients must present. */
  tokenSecretName: string;
  /** Origins permitted on the HTTP transport, as an anti-DNS-rebinding check. */
  allowedOrigins: string[];
}

export interface StromexConfig {
  actor: string;
  logLevel: LogLevel;
  /** Directory for the audit log, the approvals file and the journal. */
  stateDir: string;
  auditPath: string;
  approvalsPath: string;
  journalPath: string;
  approvalTtlSeconds: number;
  policy: PolicyConfig;
  /** Provider tool groups to expose. Empty means every configured provider. */
  profiles: ProviderName[];
  secrets: SecretResolver;
  http: HttpTransportConfig;
  /** Non-fatal problems found while resolving configuration. */
  warnings: string[];
}

export interface LoadConfigOptions {
  env?: NodeJS.ProcessEnv;
  /** Path to an operator-owned env file. */
  envFile?: string;
  /** Skip the file-mode check. Only ever set by tests. */
  allowInsecureEnvFile?: boolean;
  overrides?: Partial<Pick<StromexConfig, 'logLevel' | 'stateDir' | 'actor'>>;
}

export function loadConfig(options: LoadConfigOptions = {}): StromexConfig {
  const env = options.env ?? process.env;
  const warnings: string[] = [];

  const envFilePath = options.envFile ?? env['STROMEX_MCP_ENV_FILE'];
  let fileValues: Record<string, string> = {};
  if (envFilePath) {
    const loaded = loadEnvFile(envFilePath, { enforceMode: !options.allowInsecureEnvFile });
    fileValues = loaded.values;
    warnings.push(...loaded.warnings);
  }

  const secrets = new SecretResolver({
    env,
    fileValues,
    command: env['STROMEX_MCP_SECRET_COMMAND'],
  });

  const stateDir =
    options.overrides?.stateDir ??
    env['STROMEX_MCP_STATE_DIR'] ??
    join(homedir(), '.stromex-mcp');

  const protectedOperations = parseProtectedMode(env['STROMEX_MCP_PROTECTED_OPS'], warnings);
  const spending = parseSpending(env, warnings);

  // Operator patterns are ADDED to the defaults, never substituted for
  // them. Shrinking the list is a recorded decision (SEB §26.1), not an
  // environment variable.
  const extraProtected = splitList(env['STROMEX_MCP_PROTECTED_RESOURCES']);
  const protectedResources = [...DEFAULT_PROTECTED_RESOURCES, ...extraProtected];

  const profiles = parseProfiles(env['STROMEX_MCP_PROFILES'], warnings);

  const policy: PolicyConfig = {
    protectedOperations,
    readOnly: parseBoolean(env['STROMEX_MCP_READ_ONLY']) ?? false,
    protectedResources,
    spending,
  };

  if (policy.protectedOperations === 'allow') {
    warnings.push(
      'STROMEX_MCP_PROTECTED_OPS=allow — protected operations will run unattended on this instance. ' +
        'Every such call is logged at warn level. This is an explicitly configured exception; see SEB §26.1.',
    );
  }

  return {
    actor: options.overrides?.actor ?? env['STROMEX_MCP_ACTOR'] ?? 'stromex-mcp',
    logLevel: options.overrides?.logLevel ?? parseLogLevel(env['STROMEX_MCP_LOG_LEVEL'], warnings),
    stateDir,
    auditPath: env['STROMEX_MCP_AUDIT_PATH'] ?? join(stateDir, 'audit.jsonl'),
    approvalsPath: env['STROMEX_MCP_APPROVALS_PATH'] ?? join(stateDir, 'approvals.json'),
    journalPath: env['STROMEX_MCP_JOURNAL_PATH'] ?? join(stateDir, 'recovery-journal.jsonl'),
    approvalTtlSeconds: parseInteger(env['STROMEX_MCP_APPROVAL_TTL'], 900, warnings, 'STROMEX_MCP_APPROVAL_TTL'),
    policy,
    profiles,
    secrets,
    http: {
      enabled: parseBoolean(env['STROMEX_MCP_HTTP']) ?? false,
      // Loopback by default. A server holding seven providers' credentials
      // does not listen on 0.0.0.0 because someone forgot to set a host.
      host: env['STROMEX_MCP_HTTP_HOST'] ?? '127.0.0.1',
      port: parseInteger(env['STROMEX_MCP_HTTP_PORT'], 8437, warnings, 'STROMEX_MCP_HTTP_PORT'),
      tokenSecretName: 'STROMEX_MCP_HTTP_TOKEN',
      allowedOrigins: splitList(env['STROMEX_MCP_HTTP_ORIGINS']),
    },
    warnings,
  };
}

/** Which providers have every credential they need. */
export function configuredProviders(secrets: SecretResolver): ProviderName[] {
  return PROVIDER_NAMES.filter((name) =>
    PROVIDER_CREDENTIALS[name].required.every((credential) => secrets.resolve(credential) !== undefined),
  );
}

/** The providers whose tools this instance should expose. */
export function activeProviders(config: StromexConfig): ProviderName[] {
  const configured = configuredProviders(config.secrets);
  if (config.profiles.length === 0) return configured;
  return configured.filter((name) => config.profiles.includes(name));
}

function parseProtectedMode(raw: string | undefined, warnings: string[]): ProtectedOperationMode {
  if (!raw) return 'approval';
  const value = raw.trim().toLowerCase();
  if (value === 'deny' || value === 'approval' || value === 'allow') return value;
  warnings.push(`STROMEX_MCP_PROTECTED_OPS=${JSON.stringify(raw)} is not one of deny|approval|allow; falling back to approval.`);
  return 'approval';
}

function parseSpending(env: NodeJS.ProcessEnv, warnings: string[]): SpendingPolicy {
  const enabled = parseBoolean(env['STROMEX_SPEND_ENABLED']) ?? false;
  const currency = (env['STROMEX_SPEND_CURRENCY'] ?? 'USD').trim().toUpperCase();
  const maxSinglePurchase = parseNumber(env['STROMEX_SPEND_MAX_SINGLE'], 0, warnings, 'STROMEX_SPEND_MAX_SINGLE');
  const monthlyCap = parseNumber(env['STROMEX_SPEND_MONTHLY_CAP'], 0, warnings, 'STROMEX_SPEND_MONTHLY_CAP');

  if (enabled && (maxSinglePurchase <= 0 || monthlyCap <= 0)) {
    // Turning spending on without limits is almost certainly a mistake, and
    // the safe reading of an ambiguous instruction about money is "no".
    throw new StromexError({
      code: 'CONFIG_INVALID',
      message: 'STROMEX_SPEND_ENABLED is true but no positive STROMEX_SPEND_MAX_SINGLE and STROMEX_SPEND_MONTHLY_CAP were set.',
      remediation: 'Set both limits explicitly, or leave STROMEX_SPEND_ENABLED unset. Automatic purchasing without a ceiling is refused (SEB §26.6).',
    });
  }
  return { enabled, currency, maxSinglePurchase, monthlyCap };
}

function parseProfiles(raw: string | undefined, warnings: string[]): ProviderName[] {
  const entries = splitList(raw);
  const out: ProviderName[] = [];
  for (const entry of entries) {
    const value = entry.toLowerCase() as ProviderName;
    if (PROVIDER_NAMES.includes(value)) out.push(value);
    else warnings.push(`STROMEX_MCP_PROFILES lists an unknown provider ${JSON.stringify(entry)}; it was ignored.`);
  }
  return out;
}

function parseLogLevel(raw: string | undefined, warnings: string[]): LogLevel {
  if (!raw) return 'info';
  const value = raw.trim().toLowerCase();
  if (value === 'debug' || value === 'info' || value === 'warn' || value === 'error') return value;
  warnings.push(`STROMEX_MCP_LOG_LEVEL=${JSON.stringify(raw)} is not a known level; falling back to info.`);
  return 'info';
}

function parseBoolean(raw: string | undefined): boolean | undefined {
  if (raw === undefined) return undefined;
  const value = raw.trim().toLowerCase();
  if (['1', 'true', 'yes', 'on'].includes(value)) return true;
  if (['0', 'false', 'no', 'off', ''].includes(value)) return false;
  return undefined;
}

function parseInteger(raw: string | undefined, fallback: number, warnings: string[], name: string): number {
  if (raw === undefined || raw.trim() === '') return fallback;
  const value = Number.parseInt(raw, 10);
  if (!Number.isFinite(value) || value <= 0) {
    warnings.push(`${name}=${JSON.stringify(raw)} is not a positive integer; using ${fallback}.`);
    return fallback;
  }
  return value;
}

function parseNumber(raw: string | undefined, fallback: number, warnings: string[], name: string): number {
  if (raw === undefined || raw.trim() === '') return fallback;
  const value = Number(raw);
  if (!Number.isFinite(value) || value < 0) {
    warnings.push(`${name}=${JSON.stringify(raw)} is not a non-negative number; using ${fallback}.`);
    return fallback;
  }
  return value;
}

function splitList(raw: string | undefined): string[] {
  if (!raw) return [];
  return raw
    .split(',')
    .map((entry) => entry.trim())
    .filter(Boolean);
}
