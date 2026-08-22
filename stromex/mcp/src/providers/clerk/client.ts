/**
 * Clerk Backend API client.
 *
 * Clerk is the identity provider, which makes it the one provider where a
 * mistake is measured in people rather than resources: a banned user
 * cannot sign in, and a deleted user takes their sessions, memberships and
 * external account links with them. The tool layer classifies deletion as
 * protected accordingly, and offers ban/lock — which are reversible — as
 * the ordinary path.
 */

import { HttpClient, type FetchLike } from '../../core/http.js';
import type { Logger } from '../../core/logger.js';
import type { SecretRef } from '../../core/secret.js';

export interface ClerkClientOptions {
  secretKey: SecretRef;
  logger?: Logger;
  fetchImpl?: FetchLike;
  baseUrl?: string;
  timeoutMs?: number;
  rateLimit?: { refillPerSecond: number; capacity: number };
}

export class ClerkClient {
  readonly http: HttpClient;
  private readonly secretKey: SecretRef;

  constructor(options: ClerkClientOptions) {
    this.secretKey = options.secretKey;
    this.http = new HttpClient({
      provider: 'clerk',
      baseUrl: options.baseUrl ?? 'https://api.clerk.com/v1',
      authHeaders: () => ({ authorization: `Bearer ${this.secretKey.reveal()}` }),
      logger: options.logger,
      fetchImpl: options.fetchImpl,
      timeoutMs: options.timeoutMs ?? 30_000,
      rateLimit: options.rateLimit,
      errorMessage: (_status, body) => {
        const payload = body as { errors?: Array<{ message?: string; long_message?: string; code?: string }> } | undefined;
        if (!payload?.errors?.length) return undefined;
        return payload.errors.map((e) => e.long_message ?? e.message ?? e.code).filter(Boolean).join('; ');
      },
    });
  }

  credentialFingerprint(): string {
    return this.secretKey.fingerprint();
  }

  private async call<T>(method: string, path: string, operation: string, options: { query?: Record<string, string | number | boolean | undefined | Array<string | number>>; body?: unknown; idempotent?: boolean } = {}): Promise<T> {
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

  // ── Users ──────────────────────────────────────────────────────────

  listUsers(params: { limit?: number; offset?: number; query?: string; emailAddress?: string[] } = {}): Promise<unknown[]> {
    return this.call('GET', '/users', 'user.list', {
      query: { limit: params.limit ?? 25, offset: params.offset ?? 0, query: params.query, email_address: params.emailAddress },
    });
  }

  countUsers(): Promise<{ object: string; total_count: number }> {
    return this.call('GET', '/users/count', 'user.count');
  }

  getUser(userId: string): Promise<unknown> {
    return this.call('GET', `/users/${enc(userId)}`, 'user.get');
  }

  createUser(params: Record<string, unknown>): Promise<unknown> {
    return this.call('POST', '/users', 'user.create', { body: params });
  }

  updateUser(userId: string, params: Record<string, unknown>): Promise<unknown> {
    return this.call('PATCH', `/users/${enc(userId)}`, 'user.update', { body: params });
  }

  banUser(userId: string): Promise<unknown> {
    return this.call('POST', `/users/${enc(userId)}/ban`, 'user.ban', { idempotent: true });
  }

  unbanUser(userId: string): Promise<unknown> {
    return this.call('POST', `/users/${enc(userId)}/unban`, 'user.unban', { idempotent: true });
  }

  lockUser(userId: string): Promise<unknown> {
    return this.call('POST', `/users/${enc(userId)}/lock`, 'user.lock', { idempotent: true });
  }

  unlockUser(userId: string): Promise<unknown> {
    return this.call('POST', `/users/${enc(userId)}/unlock`, 'user.unlock', { idempotent: true });
  }

  deleteUser(userId: string): Promise<unknown> {
    return this.call('DELETE', `/users/${enc(userId)}`, 'user.delete');
  }

  // ── Organizations ──────────────────────────────────────────────────

  listOrganizations(params: { limit?: number; offset?: number; query?: string } = {}): Promise<unknown> {
    return this.call('GET', '/organizations', 'organization.list', {
      query: { limit: params.limit ?? 25, offset: params.offset ?? 0, query: params.query },
    });
  }

  createOrganization(params: { name: string; slug?: string; created_by?: string; public_metadata?: Record<string, unknown> }): Promise<unknown> {
    return this.call('POST', '/organizations', 'organization.create', { body: params });
  }

  updateOrganization(organizationId: string, params: Record<string, unknown>): Promise<unknown> {
    return this.call('PATCH', `/organizations/${enc(organizationId)}`, 'organization.update', { body: params });
  }

  deleteOrganization(organizationId: string): Promise<unknown> {
    return this.call('DELETE', `/organizations/${enc(organizationId)}`, 'organization.delete');
  }

  listMemberships(organizationId: string, params: { limit?: number; offset?: number } = {}): Promise<unknown> {
    return this.call('GET', `/organizations/${enc(organizationId)}/memberships`, 'membership.list', {
      query: { limit: params.limit ?? 50, offset: params.offset ?? 0 },
    });
  }

  createMembership(organizationId: string, params: { user_id: string; role: string }): Promise<unknown> {
    return this.call('POST', `/organizations/${enc(organizationId)}/memberships`, 'membership.create', { body: params });
  }

  updateMembership(organizationId: string, userId: string, role: string): Promise<unknown> {
    return this.call('PATCH', `/organizations/${enc(organizationId)}/memberships/${enc(userId)}`, 'membership.update', { body: { role } });
  }

  deleteMembership(organizationId: string, userId: string): Promise<unknown> {
    return this.call('DELETE', `/organizations/${enc(organizationId)}/memberships/${enc(userId)}`, 'membership.delete');
  }

  // ── Invitations ────────────────────────────────────────────────────

  listInvitations(status?: string): Promise<unknown> {
    return this.call('GET', '/invitations', 'invitation.list', { query: { status } });
  }

  createInvitation(params: { email_address: string; redirect_url?: string; public_metadata?: Record<string, unknown>; notify?: boolean }): Promise<unknown> {
    return this.call('POST', '/invitations', 'invitation.create', { body: params });
  }

  revokeInvitation(invitationId: string): Promise<unknown> {
    return this.call('POST', `/invitations/${enc(invitationId)}/revoke`, 'invitation.revoke', { idempotent: true });
  }

  listOrganizationInvitations(organizationId: string, status?: string): Promise<unknown> {
    return this.call('GET', `/organizations/${enc(organizationId)}/invitations`, 'organization-invitation.list', { query: { status } });
  }

  createOrganizationInvitation(organizationId: string, params: { email_address: string; role: string; inviter_user_id?: string; redirect_url?: string }): Promise<unknown> {
    return this.call('POST', `/organizations/${enc(organizationId)}/invitations`, 'organization-invitation.create', { body: params });
  }

  // ── Configuration ──────────────────────────────────────────────────

  listJwtTemplates(): Promise<unknown> {
    return this.call('GET', '/jwt_templates', 'jwt-template.list');
  }

  getJwks(): Promise<unknown> {
    return this.call('GET', '/jwks', 'jwks.get');
  }
}

function enc(segment: string): string {
  return encodeURIComponent(segment);
}
