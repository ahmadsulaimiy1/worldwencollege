/**
 * Cloudflare API v4 client.
 *
 * Cloudflare wraps every response in `{ success, errors, messages, result,
 * result_info }`, and — importantly — can return HTTP 200 with
 * `success: false`. Unwrapping is therefore not cosmetic: a client that
 * reads `result` without checking `success` will silently treat a refusal
 * as an empty result. `unwrap` exists for exactly that reason.
 */

import { HttpClient, type FetchLike, type MultipartPart } from '../../core/http.js';
import { StromexError } from '../../core/errors.js';
import type { Logger } from '../../core/logger.js';
import type { SecretRef } from '../../core/secret.js';

export interface CloudflareEnvelope<T> {
  success: boolean;
  errors?: Array<{ code?: number; message?: string }>;
  messages?: unknown[];
  result: T;
  result_info?: { page?: number; per_page?: number; total_count?: number };
}

export interface CloudflareClientOptions {
  token: SecretRef;
  accountId?: string;
  logger?: Logger;
  fetchImpl?: FetchLike;
  baseUrl?: string;
  timeoutMs?: number;
  rateLimit?: { refillPerSecond: number; capacity: number };
}

export class CloudflareClient {
  readonly http: HttpClient;
  private readonly token: SecretRef;
  private readonly configuredAccountId: string | undefined;
  private discoveredAccountId: string | undefined;

  constructor(options: CloudflareClientOptions) {
    this.token = options.token;
    this.configuredAccountId = options.accountId;
    this.http = new HttpClient({
      provider: 'cloudflare',
      baseUrl: options.baseUrl ?? 'https://api.cloudflare.com/client/v4',
      authHeaders: () => ({ authorization: `Bearer ${this.token.reveal()}` }),
      logger: options.logger,
      fetchImpl: options.fetchImpl,
      timeoutMs: options.timeoutMs ?? 30_000,
      rateLimit: options.rateLimit,
      errorMessage: (_status, body) => {
        const payload = body as CloudflareEnvelope<unknown> | undefined;
        const errors = payload?.errors?.map((e) => `${e.code ?? '?'}: ${e.message ?? 'unknown'}`).join('; ');
        return errors || undefined;
      },
    });
  }

  credentialFingerprint(): string {
    return this.token.fingerprint();
  }

  /** The account every account-scoped call uses, discovered once if not configured. */
  async accountId(): Promise<string> {
    if (this.configuredAccountId) return this.configuredAccountId;
    if (this.discoveredAccountId) return this.discoveredAccountId;
    const accounts = await this.listAccounts();
    if (accounts.length === 0) {
      throw new StromexError({
        code: 'CREDENTIAL_INSUFFICIENT_SCOPE',
        message: 'The Cloudflare token can see no accounts.',
        remediation: 'Set CLOUDFLARE_ACCOUNT_ID, or issue a token with Account Settings: Read.',
        provider: 'cloudflare',
      });
    }
    if (accounts.length > 1 && !this.configuredAccountId) {
      // Guessing which of several accounts to act on is exactly the kind of
      // inference that ends with a change applied to the wrong estate.
      throw new StromexError({
        code: 'CONFIG_INVALID',
        message: `The Cloudflare token can see ${accounts.length} accounts, so this server will not guess which one to act on.`,
        remediation: `Set CLOUDFLARE_ACCOUNT_ID to one of: ${accounts.map((a) => `${a.name} (${a.id})`).join(', ')}`,
        provider: 'cloudflare',
      });
    }
    this.discoveredAccountId = accounts[0]!.id;
    return this.discoveredAccountId;
  }

  private async call<T>(spec: {
    method: string;
    path: string;
    operation: string;
    query?: Record<string, string | number | boolean | undefined>;
    body?: unknown;
    multipart?: MultipartPart[];
    idempotent?: boolean;
    tolerateStatuses?: number[];
  }): Promise<T> {
    const response = await this.http.request<CloudflareEnvelope<T>>({
      method: spec.method,
      path: spec.path,
      operation: spec.operation,
      query: spec.query,
      idempotent: spec.idempotent,
      tolerateStatuses: spec.tolerateStatuses,
      body: spec.multipart
        ? { kind: 'multipart', parts: spec.multipart }
        : spec.body === undefined
          ? { kind: 'none' }
          : { kind: 'json', value: spec.body },
    });
    return unwrap(response.body, spec.operation);
  }

  // ── Account ────────────────────────────────────────────────────────

  listAccounts(): Promise<Array<{ id: string; name: string }>> {
    return this.call({ method: 'GET', path: '/accounts', operation: 'account.list' });
  }

  // ── Workers ────────────────────────────────────────────────────────

  async listWorkers(): Promise<unknown[]> {
    return this.call({ method: 'GET', path: `/accounts/${await this.accountId()}/workers/scripts`, operation: 'worker.list' });
  }

  async getWorker(name: string): Promise<unknown> {
    return this.call({ method: 'GET', path: `/accounts/${await this.accountId()}/workers/scripts/${enc(name)}/settings`, operation: 'worker.get' });
  }

  /**
   * Uploads an ES-module Worker. `metadata` names the entry module and
   * carries bindings and compatibility settings; the module itself is a
   * separate part, which is why this is multipart rather than JSON.
   */
  async uploadWorker(params: {
    name: string;
    moduleName: string;
    moduleContent: string;
    compatibilityDate?: string;
    compatibilityFlags?: string[];
    bindings?: unknown[];
  }): Promise<unknown> {
    const metadata = {
      main_module: params.moduleName,
      compatibility_date: params.compatibilityDate,
      compatibility_flags: params.compatibilityFlags,
      bindings: params.bindings,
    };
    return this.call({
      method: 'PUT',
      path: `/accounts/${await this.accountId()}/workers/scripts/${enc(params.name)}`,
      operation: 'worker.deploy',
      idempotent: true,
      multipart: [
        { name: 'metadata', value: JSON.stringify(metadata), contentType: 'application/json', filename: 'metadata.json' },
        {
          name: params.moduleName,
          value: params.moduleContent,
          filename: params.moduleName,
          contentType: 'application/javascript+module',
        },
      ],
    });
  }

  async deleteWorker(name: string): Promise<unknown> {
    return this.call({ method: 'DELETE', path: `/accounts/${await this.accountId()}/workers/scripts/${enc(name)}`, operation: 'worker.delete' });
  }

  async listWorkerSecrets(name: string): Promise<unknown[]> {
    return this.call({ method: 'GET', path: `/accounts/${await this.accountId()}/workers/scripts/${enc(name)}/secrets`, operation: 'worker.secret.list' });
  }

  async putWorkerSecret(name: string, params: { key: string; value: string }): Promise<unknown> {
    return this.call({
      method: 'PUT',
      path: `/accounts/${await this.accountId()}/workers/scripts/${enc(name)}/secrets`,
      operation: 'worker.secret.put',
      idempotent: true,
      body: { name: params.key, text: params.value, type: 'secret_text' },
    });
  }

  async deleteWorkerSecret(name: string, key: string): Promise<unknown> {
    return this.call({
      method: 'DELETE',
      path: `/accounts/${await this.accountId()}/workers/scripts/${enc(name)}/secrets/${enc(key)}`,
      operation: 'worker.secret.delete',
    });
  }

  async createWorkerTail(name: string): Promise<unknown> {
    return this.call({ method: 'POST', path: `/accounts/${await this.accountId()}/workers/scripts/${enc(name)}/tails`, operation: 'worker.tail.create' });
  }

  async listDurableObjectNamespaces(): Promise<unknown[]> {
    return this.call({
      method: 'GET',
      path: `/accounts/${await this.accountId()}/workers/durable_objects/namespaces`,
      operation: 'durable-object.list',
    });
  }

  // ── D1 ─────────────────────────────────────────────────────────────

  async listD1(): Promise<unknown[]> {
    return this.call({ method: 'GET', path: `/accounts/${await this.accountId()}/d1/database`, operation: 'd1.list' });
  }

  async createD1(params: { name: string; primaryLocationHint?: string }): Promise<unknown> {
    return this.call({
      method: 'POST',
      path: `/accounts/${await this.accountId()}/d1/database`,
      operation: 'd1.create',
      body: { name: params.name, primary_location_hint: params.primaryLocationHint },
    });
  }

  async getD1(databaseId: string): Promise<unknown> {
    return this.call({ method: 'GET', path: `/accounts/${await this.accountId()}/d1/database/${enc(databaseId)}`, operation: 'd1.get' });
  }

  async queryD1(databaseId: string, params: { sql: string; params?: unknown[] }): Promise<unknown> {
    return this.call({
      method: 'POST',
      path: `/accounts/${await this.accountId()}/d1/database/${enc(databaseId)}/query`,
      operation: 'd1.query',
      body: { sql: params.sql, params: params.params },
    });
  }

  async exportD1(databaseId: string, params: { noData?: boolean; noSchema?: boolean } = {}): Promise<unknown> {
    return this.call({
      method: 'POST',
      path: `/accounts/${await this.accountId()}/d1/database/${enc(databaseId)}/export`,
      operation: 'd1.export',
      body: { output_format: 'polling', dump_options: { no_data: params.noData ?? false, no_schema: params.noSchema ?? false } },
    });
  }

  async deleteD1(databaseId: string): Promise<unknown> {
    return this.call({ method: 'DELETE', path: `/accounts/${await this.accountId()}/d1/database/${enc(databaseId)}`, operation: 'd1.delete' });
  }

  // ── R2 ─────────────────────────────────────────────────────────────

  async listR2Buckets(): Promise<unknown> {
    return this.call({ method: 'GET', path: `/accounts/${await this.accountId()}/r2/buckets`, operation: 'r2.list' });
  }

  async createR2Bucket(params: { name: string; locationHint?: string; storageClass?: string }): Promise<unknown> {
    return this.call({
      method: 'POST',
      path: `/accounts/${await this.accountId()}/r2/buckets`,
      operation: 'r2.create',
      body: { name: params.name, locationHint: params.locationHint, storageClass: params.storageClass },
    });
  }

  async getR2Bucket(name: string): Promise<unknown> {
    return this.call({ method: 'GET', path: `/accounts/${await this.accountId()}/r2/buckets/${enc(name)}`, operation: 'r2.get' });
  }

  async deleteR2Bucket(name: string): Promise<unknown> {
    return this.call({ method: 'DELETE', path: `/accounts/${await this.accountId()}/r2/buckets/${enc(name)}`, operation: 'r2.delete' });
  }

  // ── KV ─────────────────────────────────────────────────────────────

  async listKvNamespaces(): Promise<unknown[]> {
    return this.call({ method: 'GET', path: `/accounts/${await this.accountId()}/storage/kv/namespaces`, operation: 'kv.namespace.list', query: { per_page: 100 } });
  }

  async createKvNamespace(title: string): Promise<unknown> {
    return this.call({ method: 'POST', path: `/accounts/${await this.accountId()}/storage/kv/namespaces`, operation: 'kv.namespace.create', body: { title } });
  }

  async deleteKvNamespace(namespaceId: string): Promise<unknown> {
    return this.call({ method: 'DELETE', path: `/accounts/${await this.accountId()}/storage/kv/namespaces/${enc(namespaceId)}`, operation: 'kv.namespace.delete' });
  }

  async listKvKeys(namespaceId: string, prefix?: string): Promise<unknown[]> {
    return this.call({
      method: 'GET',
      path: `/accounts/${await this.accountId()}/storage/kv/namespaces/${enc(namespaceId)}/keys`,
      operation: 'kv.key.list',
      query: { prefix, limit: 1000 },
    });
  }

  async putKvValue(namespaceId: string, key: string, value: string): Promise<unknown> {
    // This endpoint takes multipart with a `value` part, not JSON.
    return this.call({
      method: 'PUT',
      path: `/accounts/${await this.accountId()}/storage/kv/namespaces/${enc(namespaceId)}/values/${enc(key)}`,
      operation: 'kv.value.put',
      idempotent: true,
      multipart: [{ name: 'value', value, contentType: 'text/plain', filename: 'value' }],
    });
  }

  async getKvValue(namespaceId: string, key: string): Promise<string> {
    const response = await this.http.request<string>({
      method: 'GET',
      path: `/accounts/${await this.accountId()}/storage/kv/namespaces/${enc(namespaceId)}/values/${enc(key)}`,
      operation: 'kv.value.get',
      expect: 'text',
    });
    return response.body;
  }

  async deleteKvValue(namespaceId: string, key: string): Promise<unknown> {
    return this.call({
      method: 'DELETE',
      path: `/accounts/${await this.accountId()}/storage/kv/namespaces/${enc(namespaceId)}/values/${enc(key)}`,
      operation: 'kv.value.delete',
    });
  }

  // ── Queues ─────────────────────────────────────────────────────────

  async listQueues(): Promise<unknown[]> {
    return this.call({ method: 'GET', path: `/accounts/${await this.accountId()}/queues`, operation: 'queue.list' });
  }

  async createQueue(name: string): Promise<unknown> {
    return this.call({ method: 'POST', path: `/accounts/${await this.accountId()}/queues`, operation: 'queue.create', body: { queue_name: name } });
  }

  async deleteQueue(queueId: string): Promise<unknown> {
    return this.call({ method: 'DELETE', path: `/accounts/${await this.accountId()}/queues/${enc(queueId)}`, operation: 'queue.delete' });
  }

  // ── Pages ──────────────────────────────────────────────────────────

  async listPagesProjects(): Promise<unknown[]> {
    return this.call({ method: 'GET', path: `/accounts/${await this.accountId()}/pages/projects`, operation: 'pages.project.list' });
  }

  async getPagesProject(project: string): Promise<unknown> {
    return this.call({ method: 'GET', path: `/accounts/${await this.accountId()}/pages/projects/${enc(project)}`, operation: 'pages.project.get' });
  }

  async listPagesDeployments(project: string): Promise<unknown[]> {
    return this.call({
      method: 'GET',
      path: `/accounts/${await this.accountId()}/pages/projects/${enc(project)}/deployments`,
      operation: 'pages.deployment.list',
    });
  }

  /** Triggers a build from the connected git branch. */
  async createPagesDeployment(project: string, branch?: string): Promise<unknown> {
    const parts: MultipartPart[] = branch ? [{ name: 'branch', value: branch }] : [];
    return this.call({
      method: 'POST',
      path: `/accounts/${await this.accountId()}/pages/projects/${enc(project)}/deployments`,
      operation: 'pages.deployment.create',
      multipart: parts,
    });
  }

  async rollbackPagesDeployment(project: string, deploymentId: string): Promise<unknown> {
    return this.call({
      method: 'POST',
      path: `/accounts/${await this.accountId()}/pages/projects/${enc(project)}/deployments/${enc(deploymentId)}/rollback`,
      operation: 'pages.deployment.rollback',
    });
  }

  async getPagesDeploymentLogs(project: string, deploymentId: string): Promise<unknown> {
    return this.call({
      method: 'GET',
      path: `/accounts/${await this.accountId()}/pages/projects/${enc(project)}/deployments/${enc(deploymentId)}/history/logs`,
      operation: 'pages.deployment.logs',
    });
  }

  /* ── REGISTRAR ────────────────────────────────────────────────────
   * Cloudflare Registrar sells AT COST — its own words: "Register and
   * renew these domains at cost without any markups or add-on fees."
   * That is the reason the estate registers here rather than through a
   * reseller (`SEB-D 36`).
   *
   * The API is in BETA and covers only a subset of the 300+ extensions
   * Cloudflare carries: search, check, register, poll. It does NOT cover
   * renewals or transfers, and a `.co.uk` is refused by it explicitly —
   * `extension_not_supported_via_api` — which matters, because that is
   * the estate's own primary domain.
   */

  async searchDomains(query: string): Promise<unknown> {
    const response = await this.http.request<CloudflareEnvelope<unknown>>({
      method: 'GET',
      path: `/accounts/${await this.accountId()}/registrar/domain-search`,
      query: { q: query },
      operation: 'registrar.search',
    });
    return unwrap(response.body, 'registrar.search');
  }

  async checkDomains(domains: readonly string[]): Promise<unknown> {
    const response = await this.http.request<CloudflareEnvelope<unknown>>({
      method: 'POST',
      path: `/accounts/${await this.accountId()}/registrar/domain-check`,
      body: { kind: 'json', value: { domains } },
      operation: 'registrar.check',
    });
    return unwrap(response.body, 'registrar.check');
  }

  /**
   * Registers a domain. **Non-refundable once it completes**, and it may
   * complete asynchronously — 201 means done, 202 means started and the
   * caller must poll `registrationStatus`.
   */
  async registerDomain(domain: string, params: { years?: number; autoRenew?: boolean }): Promise<{ status: number; body: unknown }> {
    const response = await this.http.request<CloudflareEnvelope<unknown>>({
      method: 'POST',
      path: `/accounts/${await this.accountId()}/registrar/registrations`,
      body: { kind: 'json', value: { domain, years: params.years ?? 1, auto_renew: params.autoRenew ?? false } },
      operation: 'registrar.register',
    });
    return { status: response.status, body: unwrap(response.body, 'registrar.register') };
  }

  async registrationStatus(domain: string): Promise<unknown> {
    const response = await this.http.request<CloudflareEnvelope<unknown>>({
      method: 'GET',
      path: `/accounts/${await this.accountId()}/registrar/registrations/${enc(domain)}/registration-status`,
      operation: 'registrar.status',
    });
    return unwrap(response.body, 'registrar.status');
  }

  async listPagesDomains(project: string): Promise<unknown[]> {
    return this.call({
      method: 'GET',
      path: `/accounts/${await this.accountId()}/pages/projects/${enc(project)}/domains`,
      operation: 'pages.domain.list',
    });
  }

  async addPagesDomain(project: string, name: string): Promise<unknown> {
    return this.call({
      method: 'POST',
      path: `/accounts/${await this.accountId()}/pages/projects/${enc(project)}/domains`,
      operation: 'pages.domain.add',
      body: { name },
    });
  }

  async deletePagesProject(project: string): Promise<unknown> {
    return this.call({ method: 'DELETE', path: `/accounts/${await this.accountId()}/pages/projects/${enc(project)}`, operation: 'pages.project.delete' });
  }

  // ── Zones and DNS ──────────────────────────────────────────────────

  async listZones(name?: string): Promise<unknown[]> {
    return this.call({ method: 'GET', path: '/zones', operation: 'zone.list', query: { name, per_page: 50 } });
  }

  async listDnsRecords(zoneId: string, params: { type?: string; name?: string } = {}): Promise<unknown[]> {
    return this.call({
      method: 'GET',
      path: `/zones/${enc(zoneId)}/dns_records`,
      operation: 'dns.list',
      query: { type: params.type, name: params.name, per_page: 100 },
    });
  }

  async createDnsRecord(zoneId: string, record: { type: string; name: string; content: string; ttl?: number; proxied?: boolean; priority?: number }): Promise<unknown> {
    return this.call({ method: 'POST', path: `/zones/${enc(zoneId)}/dns_records`, operation: 'dns.create', body: record });
  }

  async updateDnsRecord(zoneId: string, recordId: string, record: Record<string, unknown>): Promise<unknown> {
    return this.call({ method: 'PATCH', path: `/zones/${enc(zoneId)}/dns_records/${enc(recordId)}`, operation: 'dns.update', body: record });
  }

  async getDnsRecord(zoneId: string, recordId: string): Promise<unknown> {
    return this.call({ method: 'GET', path: `/zones/${enc(zoneId)}/dns_records/${enc(recordId)}`, operation: 'dns.get' });
  }

  async deleteDnsRecord(zoneId: string, recordId: string): Promise<unknown> {
    return this.call({ method: 'DELETE', path: `/zones/${enc(zoneId)}/dns_records/${enc(recordId)}`, operation: 'dns.delete' });
  }
}

/**
 * Cloudflare can answer HTTP 200 with `success: false`. Treating that as
 * a result is the single easiest way to build an adapter that silently
 * does nothing.
 */
export function unwrap<T>(envelope: CloudflareEnvelope<T> | undefined, operation: string): T {
  if (!envelope) {
    throw new StromexError({
      code: 'PROVIDER_HTTP_ERROR',
      message: `Cloudflare returned an empty body for ${operation}.`,
      remediation: 'Retry; if it persists, check the Cloudflare status page.',
      provider: 'cloudflare',
      operation,
      retryable: true,
    });
  }
  if (envelope.success === false) {
    const detail = envelope.errors?.map((e) => `${e.code ?? '?'}: ${e.message ?? 'unknown'}`).join('; ');
    throw new StromexError({
      code: 'PROVIDER_HTTP_ERROR',
      message: `Cloudflare refused ${operation}${detail ? `: ${detail}` : ''}`,
      remediation: 'Read the error codes above against the Cloudflare API documentation; most indicate a missing token permission or a wrong identifier.',
      provider: 'cloudflare',
      operation,
      details: envelope.errors,
    });
  }
  return envelope.result;
}

function enc(segment: string): string {
  return encodeURIComponent(segment);
}
