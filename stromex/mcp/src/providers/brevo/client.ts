/**
 * Brevo (formerly Sendinblue) API v3 client.
 *
 * Brevo authenticates with an `api-key` header rather than a bearer
 * token, and its list endpoints wrap results in a named field that
 * differs per resource (`contacts`, `lists`, `campaigns`). Both are
 * handled here so the tool layer does not have to remember either.
 *
 * Brevo is the estate's chosen provider wherever a free tier must allow
 * authenticating your own domain — recorded because it is a commercial
 * constraint that will otherwise be rediscovered the hard way.
 */

import { HttpClient, type FetchLike } from '../../core/http.js';
import type { Logger } from '../../core/logger.js';
import type { SecretRef } from '../../core/secret.js';

export interface BrevoClientOptions {
  apiKey: SecretRef;
  logger?: Logger;
  fetchImpl?: FetchLike;
  baseUrl?: string;
  timeoutMs?: number;
  rateLimit?: { refillPerSecond: number; capacity: number };
}

export interface BrevoSender {
  name?: string;
  email: string;
}

export class BrevoClient {
  readonly http: HttpClient;
  private readonly apiKey: SecretRef;

  constructor(options: BrevoClientOptions) {
    this.apiKey = options.apiKey;
    this.http = new HttpClient({
      provider: 'brevo',
      baseUrl: options.baseUrl ?? 'https://api.brevo.com/v3',
      authHeaders: () => ({ 'api-key': this.apiKey.reveal() }),
      logger: options.logger,
      fetchImpl: options.fetchImpl,
      timeoutMs: options.timeoutMs ?? 30_000,
      rateLimit: options.rateLimit,
      errorMessage: (_status, body) => {
        const payload = body as { code?: string; message?: string } | undefined;
        if (!payload?.message) return undefined;
        return payload.code ? `${payload.code}: ${payload.message}` : payload.message;
      },
    });
  }

  credentialFingerprint(): string {
    return this.apiKey.fingerprint();
  }

  private async call<T>(
    method: string,
    path: string,
    operation: string,
    options: { query?: Record<string, string | number | boolean | undefined>; body?: unknown; idempotent?: boolean } = {},
  ): Promise<T> {
    const response = await this.http.request<T>({
      method,
      path,
      operation,
      query: options.query,
      idempotent: options.idempotent,
      body: options.body === undefined ? { kind: 'none' } : { kind: 'json', value: options.body },
    });
    return response.body;
  }

  getAccount(): Promise<unknown> {
    return this.call('GET', '/account', 'account.get');
  }

  // ── Contacts ───────────────────────────────────────────────────────

  listContacts(params: { limit?: number; offset?: number } = {}): Promise<{ contacts?: unknown[]; count?: number }> {
    return this.call('GET', '/contacts', 'contact.list', { query: { limit: params.limit ?? 50, offset: params.offset ?? 0 } });
  }

  getContact(identifier: string): Promise<unknown> {
    return this.call('GET', `/contacts/${encodeURIComponent(identifier)}`, 'contact.get');
  }

  createContact(params: { email: string; attributes?: Record<string, unknown>; listIds?: number[]; updateEnabled?: boolean }): Promise<unknown> {
    return this.call('POST', '/contacts', 'contact.create', {
      body: {
        email: params.email,
        attributes: params.attributes,
        listIds: params.listIds,
        // Makes creation idempotent, which is what a workflow needs.
        updateEnabled: params.updateEnabled ?? true,
      },
      idempotent: true,
    });
  }

  updateContact(identifier: string, params: { attributes?: Record<string, unknown>; listIds?: number[]; unlinkListIds?: number[]; emailBlacklisted?: boolean }): Promise<unknown> {
    return this.call('PUT', `/contacts/${encodeURIComponent(identifier)}`, 'contact.update', { body: params, idempotent: true });
  }

  deleteContact(identifier: string): Promise<unknown> {
    return this.call('DELETE', `/contacts/${encodeURIComponent(identifier)}`, 'contact.delete');
  }

  // ── Lists ──────────────────────────────────────────────────────────

  listLists(params: { limit?: number; offset?: number } = {}): Promise<{ lists?: unknown[]; count?: number }> {
    return this.call('GET', '/contacts/lists', 'list.list', { query: { limit: params.limit ?? 50, offset: params.offset ?? 0 } });
  }

  createList(params: { name: string; folderId: number }): Promise<unknown> {
    return this.call('POST', '/contacts/lists', 'list.create', { body: params });
  }

  // ── Campaigns ──────────────────────────────────────────────────────

  listCampaigns(params: { type?: string; status?: string; limit?: number } = {}): Promise<unknown> {
    return this.call('GET', '/emailCampaigns', 'campaign.list', {
      query: { type: params.type, status: params.status, limit: params.limit ?? 25 },
    });
  }

  getCampaign(campaignId: number): Promise<unknown> {
    return this.call('GET', `/emailCampaigns/${campaignId}`, 'campaign.get');
  }

  createCampaign(params: {
    name: string;
    subject: string;
    sender: BrevoSender;
    htmlContent?: string;
    templateId?: number;
    recipients?: { listIds?: number[] };
    scheduledAt?: string;
  }): Promise<unknown> {
    return this.call('POST', '/emailCampaigns', 'campaign.create', { body: params });
  }

  sendCampaignNow(campaignId: number): Promise<unknown> {
    return this.call('POST', `/emailCampaigns/${campaignId}/sendNow`, 'campaign.send', {});
  }

  // ── Transactional ──────────────────────────────────────────────────

  sendTransactional(params: {
    sender: BrevoSender;
    to: Array<{ email: string; name?: string }>;
    subject?: string;
    htmlContent?: string;
    textContent?: string;
    templateId?: number;
    params?: Record<string, unknown>;
    replyTo?: BrevoSender;
    tags?: string[];
  }): Promise<{ messageId?: string }> {
    return this.call('POST', '/smtp/email', 'transactional.send', { body: params });
  }

  listTemplates(params: { limit?: number; offset?: number } = {}): Promise<unknown> {
    return this.call('GET', '/smtp/templates', 'template.list', { query: { limit: params.limit ?? 50, offset: params.offset ?? 0 } });
  }

  getTemplate(templateId: number): Promise<unknown> {
    return this.call('GET', `/smtp/templates/${templateId}`, 'template.get');
  }

  createTemplate(params: { templateName: string; subject: string; sender: BrevoSender; htmlContent: string; isActive?: boolean }): Promise<unknown> {
    return this.call('POST', '/smtp/templates', 'template.create', { body: { ...params, isActive: params.isActive ?? true } });
  }

  aggregatedReport(params: { startDate?: string; endDate?: string; days?: number; tag?: string } = {}): Promise<unknown> {
    return this.call('GET', '/smtp/statistics/aggregatedReport', 'statistics.aggregated', {
      query: { startDate: params.startDate, endDate: params.endDate, days: params.days, tag: params.tag },
    });
  }

  events(params: { limit?: number; email?: string; event?: string; days?: number } = {}): Promise<unknown> {
    return this.call('GET', '/smtp/statistics/events', 'statistics.events', {
      query: { limit: params.limit ?? 50, email: params.email, event: params.event, days: params.days },
    });
  }
}
