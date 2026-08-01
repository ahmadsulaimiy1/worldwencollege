// The only file outside auth/ that should ever be imported for
// authentication. Endpoints call requireUser(request, env) and never
// touch clerk-adapter.js or a JWT directly — that's the boundary that
// makes swapping providers a change in one place (the import below),
// not a find-and-replace across every API route.

import { clerkAdapter } from './clerk-adapter.js';
import { db, newId, nowIso } from '../db.js';

// Swap this single line to change auth provider platform-wide.
const provider = clerkAdapter;

export class AuthError extends Error {
  constructor(message = 'Authentication required.') {
    super(message);
    this.name = 'AuthError';
    this.httpStatus = 401;
  }
}

export class AuthorizationError extends Error {
  constructor(message = 'You do not have permission to access this resource.') {
    super(message);
    this.name = 'AuthorizationError';
    this.httpStatus = 403;
  }
}

// Verifies the bearer token and returns our own `users` row — creating
// it on first sight isn't done here (that's the webhook's job, so a
// user record is never created from an unverified client claim). If no
// local user exists yet for a valid token, that's a genuine error state
// (webhook lagging or misconfigured), surfaced rather than silently
// auto-created.
export async function requireUser(request, env) {
  const authHeader = request.headers.get('authorization') || '';
  const token = authHeader.startsWith('Bearer ') ? authHeader.slice(7) : null;
  if (!token) throw new AuthError();

  const identity = await provider.verifySessionToken(token, env);
  if (!identity) throw new AuthError();

  const user = await db(env)
    .prepare('SELECT * FROM users WHERE auth_provider = ? AND auth_provider_id = ?')
    .bind('clerk', identity.providerId)
    .first();

  if (!user) {
    throw new AuthError('Session is valid but no local account exists yet — the auth webhook may not have processed this user.');
  }
  return user;
}

// The role check on its own, separated from token verification so it
// can be functionally tested directly against a `users` row — no JWT
// required — the same way currency.js's pure logic is tested (see
// docs/api-reference.md § Verification).
export function assertStaffRole(user) {
  if (user.role !== 'staff' && user.role !== 'admin') {
    throw new AuthorizationError('Staff access required.');
  }
  return user;
}

// Same verification as requireUser(), plus assertStaffRole() — for
// endpoints (financial reports, reconciliation) that must never expose
// data across all students to a student's own session token. Role
// lives on our own `users` row, not anything Clerk-asserted, so it's
// still enforced correctly even if a provider's token happened to
// carry an unrelated claim.
export async function requireStaff(request, env) {
  const user = await requireUser(request, env);
  return assertStaffRole(user);
}

// Called from functions/api/auth/webhook-clerk.js on a verified
// "user.created" / "user.updated" event — the only place a `users`
// row is written from provider data.
export async function upsertUserFromProviderEvent(env, { providerId, email, emailVerified }) {
  const existing = await db(env)
    .prepare('SELECT id FROM users WHERE auth_provider = ? AND auth_provider_id = ?')
    .bind('clerk', providerId)
    .first();

  if (existing) {
    await db(env)
      .prepare('UPDATE users SET email = ?, email_verified = ?, updated_at = ? WHERE id = ?')
      .bind(email, emailVerified ? 1 : 0, nowIso(), existing.id)
      .run();
    return existing.id;
  }

  const id = newId('usr');
  await db(env)
    .prepare('INSERT INTO users (id, auth_provider, auth_provider_id, email, email_verified) VALUES (?, ?, ?, ?, ?)')
    .bind(id, 'clerk', providerId, email, emailVerified ? 1 : 0)
    .run();
  return id;
}

export { provider as authProvider };
