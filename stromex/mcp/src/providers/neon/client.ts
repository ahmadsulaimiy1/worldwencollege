/**
 * Neon API client, plus SQL execution and migrations over the Postgres
 * wire protocol.
 *
 * Two boundaries are worth stating plainly.
 *
 * **Backup.** Neon has no logical-dump API. Its own point-in-time
 * mechanism is a branch, so `createBackupBranch` takes a timestamped
 * branch and that is what this server calls a backup. It does not shell
 * out to `pg_dump`, because a tool that may or may not be present on the
 * host is not a backup strategy.
 *
 * **Connection strings are credentials.** `connectionUri` returns the
 * value, but the tool layer never puts it in a result: it goes into the
 * handle vault and the caller receives a handle plus the non-secret
 * components.
 */

import pg from 'pg';
import { createHash } from 'node:crypto';
import { HttpClient, type FetchLike } from '../../core/http.js';
import { StromexError, toStromexError } from '../../core/errors.js';
import type { Logger } from '../../core/logger.js';
import type { SecretRef } from '../../core/secret.js';
import { registerSecretValue } from '../../core/redact.js';

export interface NeonClientOptions {
  apiKey: SecretRef;
  logger?: Logger;
  fetchImpl?: FetchLike;
  baseUrl?: string;
  timeoutMs?: number;
  rateLimit?: { refillPerSecond: number; capacity: number };
  /** Injected in tests so SQL paths can be exercised without a database. */
  sqlRunner?: SqlRunner;
}

export interface SqlResult {
  command: string;
  rowCount: number | null;
  rows: unknown[];
  fields: string[];
}

export type SqlRunner = (connectionUri: string, statements: string[], options: { transactional: boolean }) => Promise<SqlResult[]>;

export class NeonClient {
  readonly http: HttpClient;
  private readonly apiKey: SecretRef;
  private readonly sqlRunner: SqlRunner;

  constructor(options: NeonClientOptions) {
    this.apiKey = options.apiKey;
    this.sqlRunner = options.sqlRunner ?? defaultSqlRunner;
    this.http = new HttpClient({
      provider: 'neon',
      baseUrl: options.baseUrl ?? 'https://console.neon.tech/api/v2',
      authHeaders: () => ({ authorization: `Bearer ${this.apiKey.reveal()}` }),
      defaultHeaders: { 'content-type': 'application/json' },
      logger: options.logger,
      fetchImpl: options.fetchImpl,
      timeoutMs: options.timeoutMs ?? 60_000,
      rateLimit: options.rateLimit,
      errorMessage: (_status, body) => {
        const payload = body as { message?: string; code?: string } | undefined;
        if (!payload?.message) return undefined;
        return payload.code ? `${payload.code}: ${payload.message}` : payload.message;
      },
    });
  }

  credentialFingerprint(): string {
    return this.apiKey.fingerprint();
  }

  // ── Projects ───────────────────────────────────────────────────────

  async listProjects(): Promise<unknown[]> {
    const response = await this.http.request<{ projects: unknown[] }>({ method: 'GET', path: '/projects', operation: 'project.list' });
    return response.body.projects ?? [];
  }

  async getProject(projectId: string): Promise<unknown> {
    const response = await this.http.request({ method: 'GET', path: `/projects/${enc(projectId)}`, operation: 'project.get' });
    return response.body;
  }

  async createProject(params: { name: string; regionId?: string; pgVersion?: number }): Promise<unknown> {
    const response = await this.http.request({
      method: 'POST',
      path: '/projects',
      operation: 'project.create',
      body: {
        kind: 'json',
        value: { project: { name: params.name, region_id: params.regionId, pg_version: params.pgVersion } },
      },
    });
    return response.body;
  }

  async listOperations(projectId: string): Promise<unknown> {
    const response = await this.http.request({ method: 'GET', path: `/projects/${enc(projectId)}/operations`, operation: 'operation.list' });
    return response.body;
  }

  // ── Branches ───────────────────────────────────────────────────────

  async listBranches(projectId: string): Promise<unknown> {
    const response = await this.http.request({ method: 'GET', path: `/projects/${enc(projectId)}/branches`, operation: 'branch.list' });
    return response.body;
  }

  async createBranch(projectId: string, params: { name: string; parentId?: string; parentTimestamp?: string }): Promise<unknown> {
    const response = await this.http.request({
      method: 'POST',
      path: `/projects/${enc(projectId)}/branches`,
      operation: 'branch.create',
      body: {
        kind: 'json',
        value: {
          branch: { name: params.name, parent_id: params.parentId, parent_timestamp: params.parentTimestamp },
          // Without a compute endpoint the branch exists but cannot be
          // connected to, which is a confusing state to hand anyone.
          endpoints: [{ type: 'read_write' }],
        },
      },
    });
    return response.body;
  }

  async getBranch(projectId: string, branchId: string): Promise<unknown> {
    const response = await this.http.request({ method: 'GET', path: `/projects/${enc(projectId)}/branches/${enc(branchId)}`, operation: 'branch.get' });
    return response.body;
  }

  async restoreBranch(projectId: string, branchId: string, params: { sourceBranchId: string; sourceTimestamp?: string }): Promise<unknown> {
    const response = await this.http.request({
      method: 'POST',
      path: `/projects/${enc(projectId)}/branches/${enc(branchId)}/restore`,
      operation: 'branch.restore',
      body: { kind: 'json', value: { source_branch_id: params.sourceBranchId, source_timestamp: params.sourceTimestamp, preserve_under_name: `pre-restore-${Date.now()}` } },
    });
    return response.body;
  }

  async deleteBranch(projectId: string, branchId: string): Promise<unknown> {
    const response = await this.http.request({
      method: 'DELETE',
      path: `/projects/${enc(projectId)}/branches/${enc(branchId)}`,
      operation: 'branch.delete',
    });
    return response.body;
  }

  async listDatabases(projectId: string, branchId: string): Promise<unknown> {
    const response = await this.http.request({
      method: 'GET',
      path: `/projects/${enc(projectId)}/branches/${enc(branchId)}/databases`,
      operation: 'database.list',
    });
    return response.body;
  }

  async createDatabase(projectId: string, branchId: string, params: { name: string; ownerName: string }): Promise<unknown> {
    const response = await this.http.request({
      method: 'POST',
      path: `/projects/${enc(projectId)}/branches/${enc(branchId)}/databases`,
      operation: 'database.create',
      body: { kind: 'json', value: { database: { name: params.name, owner_name: params.ownerName } } },
    });
    return response.body;
  }

  async listRoles(projectId: string, branchId: string): Promise<unknown> {
    const response = await this.http.request({
      method: 'GET',
      path: `/projects/${enc(projectId)}/branches/${enc(branchId)}/roles`,
      operation: 'role.list',
    });
    return response.body;
  }

  async getSchema(projectId: string, branchId: string, databaseName: string): Promise<unknown> {
    const response = await this.http.request({
      method: 'GET',
      path: `/projects/${enc(projectId)}/branches/${enc(branchId)}/schema`,
      query: { db_name: databaseName },
      operation: 'schema.get',
    });
    return response.body;
  }

  /**
   * Returns a live connection URI. The value is registered for redaction
   * the moment it arrives, so it cannot appear in a log or an error even
   * if a caller mishandles it.
   */
  async connectionUri(params: {
    projectId: string;
    branchId?: string;
    databaseName: string;
    roleName: string;
    pooled?: boolean;
  }): Promise<string> {
    const response = await this.http.request<{ uri: string }>({
      method: 'GET',
      path: `/projects/${enc(params.projectId)}/connection_uri`,
      query: {
        branch_id: params.branchId,
        database_name: params.databaseName,
        role_name: params.roleName,
        pooled: params.pooled ?? true,
      },
      operation: 'connection-uri.get',
    });
    registerSecretValue(response.body.uri);
    return response.body.uri;
  }

  // ── SQL ────────────────────────────────────────────────────────────

  runSql(connectionUri: string, statements: string[], options: { transactional: boolean }): Promise<SqlResult[]> {
    return this.sqlRunner(connectionUri, statements, options);
  }

  /**
   * Applies migrations that have not been applied, in name order, each in
   * its own transaction, recording a checksum.
   *
   * The checksum is the point: a migration whose contents changed after it
   * was applied is a divergence between what the database contains and
   * what the repository claims, and it is reported rather than re-run.
   */
  async applyMigrations(
    connectionUri: string,
    migrations: Array<{ name: string; sql: string }>,
  ): Promise<{ applied: string[]; skipped: string[]; drifted: Array<{ name: string; recordedChecksum: string; currentChecksum: string }> }> {
    await this.runSql(
      connectionUri,
      [
        `CREATE TABLE IF NOT EXISTS stromex_migrations (
           name        TEXT PRIMARY KEY,
           checksum    TEXT NOT NULL,
           applied_at  TIMESTAMPTZ NOT NULL DEFAULT now()
         )`,
      ],
      { transactional: false },
    );

    const existing = await this.runSql(connectionUri, ['SELECT name, checksum FROM stromex_migrations'], { transactional: false });
    const recorded = new Map<string, string>();
    for (const row of (existing[0]?.rows ?? []) as Array<{ name: string; checksum: string }>) {
      recorded.set(row.name, row.checksum);
    }

    const applied: string[] = [];
    const skipped: string[] = [];
    const drifted: Array<{ name: string; recordedChecksum: string; currentChecksum: string }> = [];

    for (const migration of [...migrations].sort((a, b) => (a.name < b.name ? -1 : 1))) {
      const checksum = createHash('sha256').update(migration.sql).digest('hex').slice(0, 32);
      const previous = recorded.get(migration.name);
      if (previous !== undefined) {
        if (previous !== checksum) drifted.push({ name: migration.name, recordedChecksum: previous, currentChecksum: checksum });
        else skipped.push(migration.name);
        continue;
      }
      await this.runSql(
        connectionUri,
        [migration.sql, `INSERT INTO stromex_migrations (name, checksum) VALUES ('${escapeLiteral(migration.name)}', '${escapeLiteral(checksum)}')`],
        { transactional: true },
      );
      applied.push(migration.name);
    }

    return { applied, skipped, drifted };
  }
}

/**
 * The real SQL runner. One connection per call, closed in a `finally`, so
 * a failing statement cannot leak a connection — which matters on a
 * serverless Postgres where connections are the scarce resource.
 */
const defaultSqlRunner: SqlRunner = async (connectionUri, statements, options) => {
  const client = new pg.Client({ connectionString: connectionUri, application_name: 'stromex-mcp' });
  const results: SqlResult[] = [];
  try {
    await client.connect();
  } catch (thrown) {
    throw toStromexError(thrown, { provider: 'neon', operation: 'sql.connect' });
  }
  try {
    if (options.transactional) await client.query('BEGIN');
    for (const statement of statements) {
      const result = await client.query(statement);
      results.push({
        command: result.command,
        rowCount: result.rowCount,
        rows: result.rows,
        fields: (result.fields ?? []).map((field) => field.name),
      });
    }
    if (options.transactional) await client.query('COMMIT');
    return results;
  } catch (thrown) {
    if (options.transactional) {
      // A failed rollback must not mask the error that caused it.
      await client.query('ROLLBACK').catch(() => undefined);
    }
    throw new StromexError({
      code: 'PROVIDER_HTTP_ERROR',
      message: `SQL failed: ${thrown instanceof Error ? thrown.message : String(thrown)}`,
      remediation: options.transactional
        ? 'The transaction was rolled back; nothing was applied. Correct the statement and run it again.'
        : 'Statements before the failing one may already have been applied. Check the database state before retrying.',
      provider: 'neon',
      operation: 'sql.execute',
      cause: thrown,
    });
  } finally {
    await client.end().catch(() => undefined);
  }
};

/** Postgres single-quote escaping for the two literals this module writes. */
function escapeLiteral(value: string): string {
  return value.replaceAll("'", "''");
}

function enc(segment: string): string {
  return encodeURIComponent(segment);
}
