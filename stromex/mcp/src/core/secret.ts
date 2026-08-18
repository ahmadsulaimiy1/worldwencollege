/**
 * Secret handling.
 *
 * A `SecretRef` is a string you cannot accidentally print. Its
 * `toString`, `toJSON` and Node inspection hooks all return the
 * redaction placeholder; the plaintext comes out only through
 * `reveal()`, which is greppable — `grep -rn '\.reveal()'` is an
 * auditable list of every place a credential is used.
 */

import { spawnSync } from 'node:child_process';
import { createHash } from 'node:crypto';
import { readFileSync, statSync } from 'node:fs';
import { StromexError } from './errors.js';
import { REDACTION_PLACEHOLDER, registerSecretValue } from './redact.js';

const PLAINTEXT = Symbol('stromex.secret.plaintext');

export class SecretRef {
  private readonly [PLAINTEXT]: string;
  readonly name: string;
  readonly source: SecretSource;

  constructor(name: string, plaintext: string, source: SecretSource) {
    this.name = name;
    this.source = source;
    this[PLAINTEXT] = plaintext;
    registerSecretValue(plaintext);
  }

  /** The only way to obtain the plaintext. Intentionally conspicuous. */
  reveal(): string {
    return this[PLAINTEXT];
  }

  /**
   * Stable, non-reversible identity for audit records: it tells you
   * *which* credential was used, and whether it changed, without telling
   * anyone what it is.
   */
  fingerprint(): string {
    return createHash('sha256').update(this[PLAINTEXT]).digest('hex').slice(0, 12);
  }

  toString(): string {
    return REDACTION_PLACEHOLDER;
  }
  toJSON(): string {
    return REDACTION_PLACEHOLDER;
  }
  [Symbol.for('nodejs.util.inspect.custom')](): string {
    return `SecretRef(${this.name}) ${REDACTION_PLACEHOLDER}`;
  }
}

export type SecretSource = 'env' | 'env-file' | 'command';

export interface SecretResolverOptions {
  /** Parsed `.env`-style values, already loaded from a mode-checked file. */
  fileValues?: Record<string, string>;
  /**
   * Command template used to fetch a secret from an external store —
   * 1Password, `pass`, Vault, gcloud secrets, anything with a CLI.
   * `{name}` is replaced with the secret name. Example:
   *   op read op://StromeX/{name}/credential
   */
  command?: string;
  env?: NodeJS.ProcessEnv;
}

/**
 * Resolves named secrets, in a fixed order of precedence:
 *
 *   1. process environment          (what a host such as Claude Code injects)
 *   2. an operator-owned env file   (mode-checked; see `loadEnvFile`)
 *   3. an external secret command   (the supported path to a real vault)
 *
 * Nothing is cached across a resolve failure, so rotating a credential in
 * the vault takes effect on the next call rather than the next restart.
 */
export class SecretResolver {
  private readonly fileValues: Record<string, string>;
  private readonly command?: string;
  private readonly env: NodeJS.ProcessEnv;
  private readonly cache = new Map<string, SecretRef>();

  constructor(options: SecretResolverOptions = {}) {
    this.fileValues = options.fileValues ?? {};
    this.command = options.command;
    this.env = options.env ?? process.env;
  }

  /** Returns undefined when the secret is simply not configured. */
  resolve(name: string): SecretRef | undefined {
    const cached = this.cache.get(name);
    if (cached) return cached;

    const fromEnv = this.env[name];
    if (fromEnv && fromEnv.trim()) return this.remember(new SecretRef(name, fromEnv.trim(), 'env'));

    const fromFile = this.fileValues[name];
    if (fromFile && fromFile.trim()) return this.remember(new SecretRef(name, fromFile.trim(), 'env-file'));

    if (this.command) {
      const value = this.runCommand(name);
      if (value) return this.remember(new SecretRef(name, value, 'command'));
    }
    return undefined;
  }

  /** Same as `resolve`, but a missing secret is a hard, well-explained failure. */
  require(name: string, purpose: string): SecretRef {
    const found = this.resolve(name);
    if (found) return found;
    throw new StromexError({
      code: 'CREDENTIAL_MISSING',
      message: `${name} is not configured, and it is required to ${purpose}.`,
      remediation: `Set ${name} in the environment, in the operator env file, or behind the configured secret command, then restart the server. See mcp/docs/installation.md.`,
    });
  }

  /** Which of the given names are configured — used by the doctor command. */
  status(names: readonly string[]): Array<{ name: string; configured: boolean; source?: SecretSource; fingerprint?: string }> {
    return names.map((name) => {
      const ref = this.resolve(name);
      return ref
        ? { name, configured: true, source: ref.source, fingerprint: ref.fingerprint() }
        : { name, configured: false };
    });
  }

  private remember(ref: SecretRef): SecretRef {
    this.cache.set(ref.name, ref);
    return ref;
  }

  private runCommand(name: string): string | undefined {
    if (!this.command) return undefined;
    if (!/^[A-Z0-9_]+$/.test(name)) {
      // The name is interpolated into a command line. Anything outside this
      // alphabet is refused rather than escaped, because refusing is
      // verifiable and escaping is a class of bug.
      throw new StromexError({
        code: 'CONFIG_INVALID',
        message: `Refusing to interpolate the secret name ${JSON.stringify(name)} into the secret command.`,
        remediation: 'Secret names used with a secret command must match /^[A-Z0-9_]+$/.',
      });
    }
    const rendered = this.command.replaceAll('{name}', name);
    const result = spawnSync(rendered, { shell: true, encoding: 'utf8', timeout: 20_000 });
    if (result.status !== 0) return undefined;
    const value = (result.stdout ?? '').trim();
    return value.length > 0 ? value : undefined;
  }
}

export interface EnvFileLoadResult {
  values: Record<string, string>;
  path: string;
  warnings: string[];
}

/**
 * Loads a `.env`-style file, refusing one that other users can read.
 *
 * The mode check is the point of the function. A credentials file at 0644
 * on a shared machine is a credential leak that no amount of care inside
 * this process can undo, so it is treated as a configuration error rather
 * than a warning.
 */
export function loadEnvFile(path: string, options: { enforceMode?: boolean } = {}): EnvFileLoadResult {
  const enforceMode = options.enforceMode ?? true;
  const warnings: string[] = [];

  let stat;
  try {
    stat = statSync(path);
  } catch (cause) {
    throw new StromexError({
      code: 'IO_ERROR',
      message: `Cannot read the env file at ${path}.`,
      remediation: 'Check the path, or omit --env-file to read credentials from the environment only.',
      cause,
    });
  }

  const groupOrWorldReadable = (stat.mode & 0o077) !== 0;
  if (groupOrWorldReadable) {
    if (enforceMode) {
      throw new StromexError({
        code: 'CONFIG_INVALID',
        message: `The env file at ${path} is readable by other users (mode ${(stat.mode & 0o777).toString(8)}).`,
        remediation: `Run: chmod 600 ${path}`,
      });
    }
    warnings.push(`${path} is readable by other users (mode ${(stat.mode & 0o777).toString(8)}).`);
  }

  return { values: parseEnv(readFileSync(path, 'utf8')), path, warnings };
}

/**
 * A deliberately small `.env` parser: `KEY=value`, `export KEY=value`,
 * `#` comments, and single- or double-quoted values. It does not do
 * variable interpolation — a credentials file that computes its own values
 * is a credentials file nobody can audit by reading it.
 */
export function parseEnv(source: string): Record<string, string> {
  const out: Record<string, string> = {};
  for (const rawLine of source.split(/\r?\n/)) {
    const line = rawLine.trim();
    if (!line || line.startsWith('#')) continue;
    const withoutExport = line.startsWith('export ') ? line.slice('export '.length).trim() : line;
    const eq = withoutExport.indexOf('=');
    if (eq <= 0) continue;
    const key = withoutExport.slice(0, eq).trim();
    let value = withoutExport.slice(eq + 1).trim();
    if ((value.startsWith('"') && value.endsWith('"') && value.length >= 2) ||
        (value.startsWith("'") && value.endsWith("'") && value.length >= 2)) {
      value = value.slice(1, -1);
    }
    out[key] = value;
  }
  return out;
}
