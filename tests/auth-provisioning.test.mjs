// requireUser() end to end: a REAL signed token, a REAL SQLite
// database, and the account-provisioning path that decides whether a
// learner's first minute after sign-up works or fails.
//
// This is the piece that sits between the two things already tested
// separately — clerk-jwt.test.mjs proves a token verifies,
// validation-and-security.test.mjs proves the 401 boundary holds — and
// which neither of them touches: what happens for a valid token whose
// user has no local row yet. That is not an edge case. It is what
// every single learner hits on their first request after signing up.
import { readFileSync } from 'node:fs';
import { makeD1 } from './d1-shim.mjs';
import { ROOT, loadUrl } from './helpers.mjs';

let pass = 0, fail = 0;
const check = (label, cond, detail) => {
  console.log((cond ? 'PASS ' : 'FAIL ') + label + (cond || detail === undefined ? '' : ` — ${detail}`));
  cond ? pass++ : fail++;
};

const b64url = (bytes) => Buffer.from(bytes).toString('base64')
  .replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
const enc = (obj) => b64url(new TextEncoder().encode(JSON.stringify(obj)));

const kp = await crypto.subtle.generateKey(
  { name: 'RSASSA-PKCS1-v1_5', modulusLength: 2048, publicExponent: new Uint8Array([1, 0, 1]), hash: 'SHA-256' },
  true, ['sign', 'verify'],
);
const jwk = { ...(await crypto.subtle.exportKey('jwk', kp.publicKey)), kid: 'kid-1', alg: 'RS256', use: 'sig' };

globalThis.fetch = async () => ({ ok: true, status: 200, json: async () => ({ keys: [jwk] }) });
const ENV_AUTH = { CLERK_JWKS_URL: 'https://stub.clerk.accounts.dev/.well-known/jwks.json' };

async function token(claims) {
  const h = enc({ alg: 'RS256', typ: 'JWT', kid: 'kid-1' });
  const now = Math.floor(Date.now() / 1000);
  const p = enc({ iat: now - 5, exp: now + 600, ...claims });
  const sig = await crypto.subtle.sign('RSASSA-PKCS1-v1_5', kp.privateKey, new TextEncoder().encode(`${h}.${p}`));
  return `${h}.${p}.${b64url(new Uint8Array(sig))}`;
}
const req = (tok) => new Request('https://example.test/api/lms/unit', {
  headers: tok ? { authorization: `Bearer ${tok}` } : {},
});

const session = await import(loadUrl('functions/_lib/auth/session.js'));
const schema = readFileSync(`${ROOT}/sql/schema.sql`, 'utf8');
const freshEnv = () => ({ ...ENV_AUTH, DB: makeD1(schema) });
async function throws(fn) { try { await fn(); return null; } catch (e) { return e; } }

// The happy-path calls below are the ones a regression breaks, and an
// uncaught throw from them would end the process with a stack trace and
// no PASS/FAIL line at all — a failure nobody can read at a glance.
// (Found by sabotaging requireUser() to confirm this file actually
// detects the regression it claims to: it did, but only as a crash.)
async function attempt(label, fn) {
  try { return await fn(); } catch (e) { check(label, false, `${e.name}: ${e.message}`); return null; }
}

// ---------------------------------------------------------------------
// The first minute after sign-up
// ---------------------------------------------------------------------
{
  const env = freshEnv();
  const tok = await token({ sub: 'user_new', email: 'new@example.com', email_verified: true });

  const user = await attempt('A verified token with no local row provisions the account instead of failing',
    () => session.requireUser(req(tok), env));
  check('A verified token with no local row provisions the account instead of failing',
    !!user && user.auth_provider_id === 'user_new', user && user.auth_provider_id);
  check('...with the email from the token', user && user.email === 'new@example.com', user && user.email);
  check('...the verification state carried across', user && user.email_verified === 1, user && user.email_verified);
  check('...and the default role, not an elevated one', user && user.role === 'student', user && user.role);

  const again = await attempt('A second request reuses the same row rather than creating another',
    () => session.requireUser(req(tok), env));
  check('A second request reuses the same row rather than creating another',
    !!again && !!user && again.id === user.id, `${user && user.id} vs ${again && again.id}`);
  const { results } = await env.DB.prepare('SELECT id FROM users').bind().all();
  check('...so exactly one account exists', results.length === 1, results.length);
}

// ---------------------------------------------------------------------
// The guard: never invent an email
// ---------------------------------------------------------------------
{
  const env = freshEnv();
  // Clerk's DEFAULT session token has no email claim. Until the session
  // token is customised, this is what every token looks like.
  const noEmail = await token({ sub: 'user_noemail' });
  const err = await throws(() => session.requireUser(req(noEmail), env));
  check('A token with no email claim does NOT create a row', err && err.name === 'AuthError', err && err.name);
  check('...and says why, naming both possible causes',
    err && /webhook/.test(err.message) && /email claim/.test(err.message), err && err.message);
  const { results } = await env.DB.prepare('SELECT id FROM users').bind().all();
  check('...leaving no fabricated account behind', results.length === 0, results.length);
}

// ---------------------------------------------------------------------
// Provisioning must not become an authentication bypass
// ---------------------------------------------------------------------
{
  const env = freshEnv();
  const forger = await crypto.subtle.generateKey(
    { name: 'RSASSA-PKCS1-v1_5', modulusLength: 2048, publicExponent: new Uint8Array([1, 0, 1]), hash: 'SHA-256' },
    true, ['sign', 'verify'],
  );
  const h = enc({ alg: 'RS256', typ: 'JWT', kid: 'kid-1' });
  const now = Math.floor(Date.now() / 1000);
  const p = enc({ sub: 'user_admin', email: 'attacker@example.com', email_verified: true, iat: now, exp: now + 600 });
  const sig = await crypto.subtle.sign('RSASSA-PKCS1-v1_5', forger.privateKey, new TextEncoder().encode(`${h}.${p}`));

  const err = await throws(() => session.requireUser(req(`${h}.${p}.${b64url(new Uint8Array(sig))}`), env));
  check('A token signed by an unknown key provisions nothing', err && err.name === 'AuthError', err && err.name);
  const { results } = await env.DB.prepare('SELECT id FROM users').bind().all();
  check('...and creates no account', results.length === 0, results.length);

  const staleTok = await token({ sub: 'user_x', email: 'x@example.com', exp: Math.floor(Date.now() / 1000) - 1 });
  const expired = await throws(() => session.requireUser(req(staleTok), env));
  check('An expired token provisions nothing', expired && expired.name === 'AuthError', expired && expired.name);

  const none = await throws(() => session.requireUser(req(null), env));
  check('No token at all is still a plain 401', none && none.httpStatus === 401, none && none.httpStatus);
}

// ---------------------------------------------------------------------
// A provisioned account must not silently outrank a real one
// ---------------------------------------------------------------------
{
  const env = freshEnv();
  // Staff exist already, created by an administrator.
  env.DB.prepare(`INSERT INTO users (id, auth_provider, auth_provider_id, email, role)
    VALUES ('usr_staff','clerk','user_staff','staff@example.com','staff')`).bind().run();

  const staff = await session.requireUser(req(await token({ sub: 'user_staff', email: 'changed@example.com', email_verified: true })), env);
  check('An existing account keeps its role when it signs in', staff.role === 'staff', staff.role);
  check('...and requireUser does not rewrite its email from the token',
    staff.email === 'staff@example.com', staff.email);

  const fresh = await session.requireUser(req(await token({ sub: 'user_fresh', email: 'fresh@example.com', email_verified: true })), env);
  check('A newly provisioned account is a student', fresh.role === 'student', fresh.role);
  const err = await throws(() => session.assertStaffRole(fresh));
  check('...and is refused by the staff guard', err && err.httpStatus === 403, err && err.httpStatus);
}

// ---------------------------------------------------------------------
// The webhook and a first request racing for the same user
// ---------------------------------------------------------------------
{
  const env = freshEnv();
  const providerId = 'user_race';
  // Both paths run against the same database, as they would in
  // production when a learner's first request lands while the webhook
  // is still in flight.
  await Promise.all([
    session.upsertUserFromProviderEvent(env, { providerId, email: 'race@example.com', emailVerified: true }),
    session.requireUser(req(await token({ sub: providerId, email: 'race@example.com', email_verified: true })), env),
  ]);
  const { results } = await env.DB.prepare('SELECT id FROM users WHERE auth_provider_id = ?').bind(providerId).all();
  check('The webhook and a first request racing produce ONE account, not a constraint error',
    results.length === 1, results.length);

  // The webhook stays the source of truth for later changes.
  await session.upsertUserFromProviderEvent(env, { providerId, email: 'renamed@example.com', emailVerified: false });
  const row = await env.DB.prepare('SELECT email, email_verified FROM users WHERE auth_provider_id = ?').bind(providerId).first();
  check('A later webhook updates the existing account rather than duplicating it',
    row.email === 'renamed@example.com' && row.email_verified === 0, JSON.stringify(row));
  const after = await env.DB.prepare('SELECT COUNT(*) AS n FROM users WHERE auth_provider_id = ?').bind(providerId).first();
  check('...still one account', after.n === 1, after.n);
}

console.log(`\n${pass} passed, ${fail} failed.`);
process.exit(fail ? 1 : 0);
