/**
 * Vercel REST client.
 *
 * Vercel versions each endpoint independently, so the paths below carry
 * their own version prefixes and are not interchangeable — the list
 * endpoint is `/v7/deployments` while a single deployment is
 * `/v13/deployments/{id}`. Each path here was taken from Vercel's own
 * published OpenAPI document rather than from memory, because a wrong
 * version prefix produces a 404 that reads like a missing resource.
 *
 * `teamId` is threaded onto every request as a query parameter: a token
 * scoped to a personal account and one scoped to a team address different
 * estates, and silently acting on the wrong one is the failure this
 * guards against.
 */

import { HttpClient, type FetchLike } from '../../core/http.js';
import type { Logger } from '../../core/logger.js';
import type { SecretRef } from '../../core/secret.js';

export interface VercelClientOptions {
  token: SecretRef;
  teamId?: string;
  logger?: Logger;
  fetchImpl?: FetchLike;
  baseUrl?: string;
  timeoutMs?: number;
  rateLimit?: { refillPerSecond: number; capacity: number };
}

export type EnvTarget = 'production' | 'preview' | 'development';

export class VercelClient {
  readonly http: HttpClient;
  private readonly token: SecretRef;
  readonly teamId: string | undefined;

  constructor(options: VercelClientOptions) {
    this.token = options.token;
    this.teamId = options.teamId;
    this.http = new HttpClient({
      provider: 'vercel',
      baseUrl: options.baseUrl ?? 'https://api.vercel.com',
      authHeaders: () => ({ authorization: `Bearer ${this.token.reveal()}` }),
      logger: options.logger,
      fetchImpl: options.fetchImpl,
      timeoutMs: options.timeoutMs ?? 60_000,
      rateLimit: options.rateLimit,
      errorMessage: (_status, body) => {
        const payload = body as { error?: { code?: string; message?: string } } | undefined;
        if (!payload?.error) return undefined;
        return [payload.error.code, payload.error.message].filter(Boolean).join(': ');
      },
    });
  }

  credentialFingerprint(): string {
    return this.token.fingerprint();
  }

  private scope(extra: Record<string, string | number | boolean | undefined> = {}) {
    return this.teamId ? { teamId: this.teamId, ...extra } : extra;
  }

  // ── Projects ───────────────────────────────────────────────────────

  async listProjects(limit = 50): Promise<unknown> {
    const response = await this.http.request({ method: 'GET', path: '/v10/projects', query: this.scope({ limit }), operation: 'project.list' });
    return response.body;
  }

  async getProject(idOrName: string): Promise<unknown> {
    const response = await this.http.request({ method: 'GET', path: `/v9/projects/${enc(idOrName)}`, query: this.scope(), operation: 'project.get' });
    return response.body;
  }

  async createProject(params: { name: string; framework?: string; gitRepository?: { type: string; repo: string } }): Promise<unknown> {
    const response = await this.http.request({
      method: 'POST',
      path: '/v11/projects',
      query: this.scope(),
      operation: 'project.create',
      body: { kind: 'json', value: { name: params.name, framework: params.framework, gitRepository: params.gitRepository } },
    });
    return response.body;
  }

  // ── Deployments ────────────────────────────────────────────────────

  async listDeployments(params: { projectId?: string; limit?: number; target?: string } = {}): Promise<unknown> {
    const response = await this.http.request({
      method: 'GET',
      path: '/v7/deployments',
      query: this.scope({ projectId: params.projectId, limit: params.limit ?? 20, target: params.target }),
      operation: 'deployment.list',
    });
    return response.body;
  }

  async getDeployment(idOrUrl: string): Promise<unknown> {
    const response = await this.http.request({ method: 'GET', path: `/v13/deployments/${enc(idOrUrl)}`, query: this.scope(), operation: 'deployment.get' });
    return response.body;
  }

  async getDeploymentEvents(idOrUrl: string, limit = 200): Promise<unknown> {
    const response = await this.http.request({
      method: 'GET',
      path: `/v3/deployments/${enc(idOrUrl)}/events`,
      query: this.scope({ limit, direction: 'backward' }),
      operation: 'deployment.events',
    });
    return response.body;
  }

  /** Creates a deployment from a git source that Vercel already knows about. */
  async createDeployment(params: { name: string; project?: string; gitSource?: Record<string, unknown>; target?: string }): Promise<unknown> {
    const response = await this.http.request({
      method: 'POST',
      path: '/v13/deployments',
      query: this.scope(),
      operation: 'deployment.create',
      body: { kind: 'json', value: { name: params.name, project: params.project, gitSource: params.gitSource, target: params.target } },
    });
    return response.body;
  }

  async rollback(projectId: string, deploymentId: string): Promise<unknown> {
    const response = await this.http.request({
      method: 'POST',
      path: `/v1/projects/${enc(projectId)}/rollback/${enc(deploymentId)}`,
      query: this.scope(),
      operation: 'deployment.rollback',
      body: { kind: 'none' },
    });
    return response.body;
  }

  async promote(projectId: string, deploymentId: string): Promise<unknown> {
    const response = await this.http.request({
      method: 'POST',
      path: `/v10/projects/${enc(projectId)}/promote/${enc(deploymentId)}`,
      query: this.scope(),
      operation: 'deployment.promote',
      body: { kind: 'none' },
    });
    return response.body;
  }

  // ── Environment variables ──────────────────────────────────────────

  async listEnv(idOrName: string): Promise<unknown> {
    const response = await this.http.request({ method: 'GET', path: `/v10/projects/${enc(idOrName)}/env`, query: this.scope(), operation: 'env.list' });
    return response.body;
  }

  async upsertEnv(
    idOrName: string,
    entry: { key: string; value: string; type?: 'encrypted' | 'plain' | 'sensitive'; target: EnvTarget[]; gitBranch?: string; comment?: string },
  ): Promise<unknown> {
    const response = await this.http.request({
      method: 'POST',
      path: `/v10/projects/${enc(idOrName)}/env`,
      // upsert=true makes this idempotent, which is what a workflow needs:
      // re-running a configuration step must not fail on "already exists".
      query: this.scope({ upsert: 'true' }),
      operation: 'env.upsert',
      idempotent: true,
      body: {
        kind: 'json',
        value: {
          key: entry.key,
          value: entry.value,
          type: entry.type ?? 'encrypted',
          target: entry.target,
          gitBranch: entry.gitBranch,
          comment: entry.comment,
        },
      },
    });
    return response.body;
  }

  async getEnv(idOrName: string, id: string): Promise<unknown> {
    const response = await this.http.request({ method: 'GET', path: `/v1/projects/${enc(idOrName)}/env/${enc(id)}`, query: this.scope(), operation: 'env.get' });
    return response.body;
  }

  async deleteEnv(idOrName: string, id: string): Promise<unknown> {
    const response = await this.http.request({
      method: 'DELETE',
      path: `/v9/projects/${enc(idOrName)}/env/${enc(id)}`,
      query: this.scope(),
      operation: 'env.delete',
    });
    return response.body;
  }

  // ── Domains ────────────────────────────────────────────────────────

  async listProjectDomains(idOrName: string): Promise<unknown> {
    const response = await this.http.request({ method: 'GET', path: `/v9/projects/${enc(idOrName)}/domains`, query: this.scope(), operation: 'domain.list' });
    return response.body;
  }

  async addProjectDomain(idOrName: string, name: string): Promise<unknown> {
    const response = await this.http.request({
      method: 'POST',
      path: `/v10/projects/${enc(idOrName)}/domains`,
      query: this.scope(),
      operation: 'domain.add',
      body: { kind: 'json', value: { name } },
    });
    return response.body;
  }

  async removeProjectDomain(idOrName: string, domain: string): Promise<unknown> {
    const response = await this.http.request({
      method: 'DELETE',
      path: `/v9/projects/${enc(idOrName)}/domains/${enc(domain)}`,
      query: this.scope(),
      operation: 'domain.remove',
    });
    return response.body;
  }

  // ── Registrar ──────────────────────────────────────────────────────

  async domainAvailability(domain: string): Promise<unknown> {
    const response = await this.http.request({
      method: 'GET',
      path: `/v1/registrar/domains/${enc(domain)}/availability`,
      query: this.scope(),
      operation: 'registrar.availability',
    });
    return response.body;
  }

  async domainPrice(domain: string): Promise<{ price?: number; currency?: string; period?: number } & Record<string, unknown>> {
    const response = await this.http.request<{ price?: number; currency?: string; period?: number }>({
      method: 'GET',
      path: `/v1/registrar/domains/${enc(domain)}/price`,
      query: this.scope(),
      operation: 'registrar.price',
    });
    return response.body;
  }

  async buyDomain(domain: string, params: { expectedPrice: number; renew?: boolean }): Promise<unknown> {
    const response = await this.http.request({
      method: 'POST',
      path: `/v1/registrar/domains/${enc(domain)}/buy`,
      query: this.scope(),
      operation: 'registrar.buy',
      body: { kind: 'json', value: { expectedPrice: params.expectedPrice, renew: params.renew ?? true } },
    });
    return response.body;
  }
}

function enc(segment: string): string {
  return encodeURIComponent(segment);
}
