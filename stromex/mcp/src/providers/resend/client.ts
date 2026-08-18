/**
 * Resend client — transactional email and sending domains.
 *
 * The estate's own note about Resend is worth carrying: a free tier
 * permits one verified domain per account, which is why one project here
 * selects Brevo instead. That is a commercial constraint, not a technical
 * one, and it is recorded in the tool descriptions so the choice is not
 * re-litigated from memory.
 */

import { HttpClient, type FetchLike } from '../../core/http.js';
import type { Logger } from '../../core/logger.js';
import type { SecretRef } from '../../core/secret.js';

export interface ResendClientOptions {
  apiKey: SecretRef;
  logger?: Logger;
  fetchImpl?: FetchLike;
  baseUrl?: string;
  timeoutMs?: number;
  rateLimit?: { refillPerSecond: number; capacity: number };
}

export interface SendEmailParams {
  from: string;
  to: string[];
  subject: string;
  html?: string;
  text?: string;
  cc?: string[];
  bcc?: string[];
  replyTo?: string[];
  tags?: Array<{ name: string; value: string }>;
}

export class ResendClient {
  readonly http: HttpClient;
  private readonly apiKey: SecretRef;

  constructor(options: ResendClientOptions) {
    this.apiKey = options.apiKey;
    this.http = new HttpClient({
      provider: 'resend',
      baseUrl: options.baseUrl ?? 'https://api.resend.com',
      authHeaders: () => ({ authorization: `Bearer ${this.apiKey.reveal()}` }),
      logger: options.logger,
      fetchImpl: options.fetchImpl,
      timeoutMs: options.timeoutMs ?? 20_000,
      rateLimit: options.rateLimit,
      errorMessage: (_status, body) => {
        const payload = body as { name?: string; message?: string } | undefined;
        if (!payload?.message) return undefined;
        return payload.name ? `${payload.name}: ${payload.message}` : payload.message;
      },
    });
  }

  credentialFingerprint(): string {
    return this.apiKey.fingerprint();
  }

  private async call<T>(method: string, path: string, operation: string, body?: unknown, idempotent?: boolean): Promise<T> {
    const response = await this.http.request<T>({
      method,
      path,
      operation,
      idempotent,
      body: body === undefined ? { kind: 'none' } : { kind: 'json', value: body },
    });
    return response.body;
  }

  sendEmail(params: SendEmailParams): Promise<{ id: string }> {
    return this.call('POST', '/emails', 'email.send', {
      from: params.from,
      to: params.to,
      subject: params.subject,
      html: params.html,
      text: params.text,
      cc: params.cc,
      bcc: params.bcc,
      reply_to: params.replyTo,
      tags: params.tags,
    });
  }

  sendBatch(messages: SendEmailParams[]): Promise<unknown> {
    return this.call(
      'POST',
      '/emails/batch',
      'email.batch',
      messages.map((message) => ({
        from: message.from,
        to: message.to,
        subject: message.subject,
        html: message.html,
        text: message.text,
        cc: message.cc,
        bcc: message.bcc,
        reply_to: message.replyTo,
      })),
    );
  }

  getEmail(id: string): Promise<unknown> {
    return this.call('GET', `/emails/${encodeURIComponent(id)}`, 'email.get');
  }

  listDomains(): Promise<unknown> {
    return this.call('GET', '/domains', 'domain.list');
  }

  createDomain(params: { name: string; region?: string }): Promise<unknown> {
    return this.call('POST', '/domains', 'domain.create', { name: params.name, region: params.region });
  }

  getDomain(id: string): Promise<unknown> {
    return this.call('GET', `/domains/${encodeURIComponent(id)}`, 'domain.get');
  }

  verifyDomain(id: string): Promise<unknown> {
    return this.call('POST', `/domains/${encodeURIComponent(id)}/verify`, 'domain.verify', undefined, true);
  }

  deleteDomain(id: string): Promise<unknown> {
    return this.call('DELETE', `/domains/${encodeURIComponent(id)}`, 'domain.delete');
  }

  listApiKeys(): Promise<unknown> {
    return this.call('GET', '/api-keys', 'api-key.list');
  }

  createApiKey(params: { name: string; permission?: 'full_access' | 'sending_access'; domainId?: string }): Promise<{ id: string; token: string }> {
    return this.call('POST', '/api-keys', 'api-key.create', {
      name: params.name,
      permission: params.permission ?? 'sending_access',
      domain_id: params.domainId,
    });
  }

  deleteApiKey(id: string): Promise<unknown> {
    return this.call('DELETE', `/api-keys/${encodeURIComponent(id)}`, 'api-key.delete');
  }
}
