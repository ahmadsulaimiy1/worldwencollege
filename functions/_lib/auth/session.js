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

// Verifies the bearer token and returns our own `users` row.
//
// The webhook remains the source of truth for user data: it is what
// keeps email, verification state and later profile changes current.
// But it cannot be the ONLY way a row is ever created, and the reason
// is worth stating plainly, because an earlier version of this comment
// argued the opposite.
//
// The old rule was "never create a user from a client claim". That
// framing was wrong about what a session token is. By the time we are
// here the token has been verified against Clerk's published signing
// keys, its expiry checked, and — when configured — its authorized
// party matched. It is not a client claim; it is Clerk asserting this
// user exists, carried by the client. The webhook is Clerk asserting
// the same thing over a different transport. Refusing one while
// trusting the other bought no security, and cost this:
//
//   a learner signs up, Clerk succeeds, and every single request then
//   fails with a message about webhooks — because the webhook was
//   misconfigured, delayed, or retrying. Sign-up looks like it worked
//   and the product looks broken.
//
// Webhook delivery is best-effort and retried; first use is often
// seconds after sign-up. So: provision on first authenticated sight,
// from the verified token, and let the webhook reconcile afterwards.
//
// The guard is the email claim. `users.email` is NOT NULL and an email
// address must never be invented, so a token without one still gets
// the explicit error rather than a fabricated row. Clerk's DEFAULT
// session token does not include email — it has to be added under
// Sessions → Customize session token. Until it is, this falls back to
// exactly the old behaviour, which is why that is a setup step and not
// an optional nicety (see docs/auth-architecture.md).
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
  if (user) return user;

  if (!identity.email) {
    throw new AuthError('Session is valid but no local account exists yet — the auth webhook may not have processed this user, and the session token carries no email claim to create one from.');
  }

  // Provision, then re-read rather than construct the row in memory:
  // the SELECT is the only thing that knows what the schema defaults
  // actually produced, and a concurrent webhook may have won the race.
  await upsertUserFromProviderEvent(env, {
    providerId: identity.providerId,
    email: identity.email,
    emailVerified: identity.emailVerified,
  });
  const created = await db(env)
    .prepare('SELECT * FROM users WHERE auth_provider = ? AND auth_provider_id = ?')
    .bind('clerk', identity.providerId)
    .first();
  if (!created) throw new AuthError('Could not provision a local account for this session.');
  return created;
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
// Single statement rather than SELECT-then-INSERT, because there are
// now two callers that can race: the webhook, and a first authenticated
// request provisioning the same user. Read-then-write would let both
// see "no row", both INSERT, and one hit the UNIQUE constraint — a
// 500 on a learner's very first request, and only under load, which is
// the worst kind to reproduce. UNIQUE(auth_provider, auth_provider_id)
// makes the conflict clause exact.
export async function upsertUserFromProviderEvent(env, { providerId, email, emailVerified }) {
  const id = newId('usr');
  await db(env)
    .prepare(`INSERT INTO users (id, auth_provider, auth_provider_id, email, email_verified)
      VALUES (?, ?, ?, ?, ?)
      ON CONFLICT(auth_provider, auth_provider_id) DO UPDATE
        SET email = excluded.email, email_verified = excluded.email_verified, updated_at = ?`)
    .bind(id, 'clerk', providerId, email, emailVerified ? 1 : 0, nowIso())
    .run();

  // The generated id is only used when the INSERT actually inserted, so
  // read back what is really there rather than assuming which branch won.
  const row = await db(env)
    .prepare('SELECT id FROM users WHERE auth_provider = ? AND auth_provider_id = ?')
    .bind('clerk', providerId)
    .first();
  return row ? row.id : id;
}

export { provider as authProvider };
