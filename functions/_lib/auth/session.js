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

// A verified session belonging to somebody the College has no account
// for, and cannot create one for, because the token carries no email
// claim and `users.email` is NOT NULL.
//
// Its own class, and the reason is a loop. This used to be a plain
// AuthError, which every client reads as "your session expired, sign in
// again" — so the applicant signs in again, Clerk succeeds again, the
// token still has no email claim, and they arrive at the same message.
// Nothing they can do resolves it, and the instruction they are given
// guarantees they keep trying. It is fixed in Clerk's dashboard, by us.
export class AccountProvisioningError extends Error {
  constructor(message) {
    super(message);
    this.name = 'AccountProvisioningError';
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

  // A SESSION TOKEN IS NOT A PROFILE.
  //
  // Clerk's default session token carries no email claim. That left two
  // routes to an account — a dashboard setting somebody had to remember,
  // and a webhook that might not have arrived — and when neither had
  // happened, a learner signed in successfully and still had no account,
  // with nothing they could do about it.
  //
  // So there is a third route, and it needs nobody to remember anything:
  // ask the provider. We have a verified session; the provider knows the
  // address; the only reason we did not have it was that we had never
  // asked. This runs once per learner, on the provisioning path only.
  let email = identity.email;
  let emailVerified = identity.emailVerified;
  if (!email && typeof provider.fetchIdentity === 'function') {
    const fetched = await provider.fetchIdentity(identity.providerId, env);
    if (fetched && fetched.email) {
      email = fetched.email;
      emailVerified = fetched.emailVerified;
    }
  }

  if (!email) {
    throw new AccountProvisioningError('Your sign-in worked, but the College could not '
      + 'finish setting up your account: no email address could be established for it, '
      + 'and the College will not invent one. All three routes were tried \u2014 the '
      + 'session carries no email claim; the College could not ask the sign-in service '
      + 'directly, which means a key it needs (CLERK_SECRET_KEY) is not configured or the '
      + 'service could not be reached; and the sign-in webhook has not delivered your '
      + 'account either. All three are on the College\u2019s side, and signing in again '
      + 'will not change any of them. Write to Admissions and we will take your '
      + 'application by email.');
  }

  // Provision, then re-read rather than construct the row in memory:
  // the SELECT is the only thing that knows what the schema defaults
  // actually produced, and a concurrent webhook may have won the race.
  await upsertUserFromProviderEvent(env, {
    providerId: identity.providerId,
    email,
    emailVerified,
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

// Administrator, not merely staff. The distinction is the whole point
// of having two levels: staff act on learners, administrators act on
// staff. Endpoints that decide, or merely reveal, who holds access
// belong here.
//
// This exists because GET /api/admin/role shipped with requireStaff()
// under a comment saying "Administrator only" — every tutor could pull
// the complete register of who can read student records. No unit test
// could have caught it: listAppointees() takes no actor at all, so the
// only place the rule lived was the guard, and the guard was the thing
// that was wrong. Where a rule cannot be enforced inside the function
// that does the work, it needs a named guard and a test that drives
// the endpoint.
export function assertAdminRole(user) {
  if (user.role !== 'admin') {
    throw new AuthorizationError('Administrator access required.');
  }
  return user;
}

export async function requireAdmin(request, env) {
  const user = await requireUser(request, env);
  return assertAdminRole(user);
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
