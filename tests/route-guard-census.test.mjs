// EVERY endpoint's authentication boundary, enumerated from disk.
//
// `admin-route-guards.test.mjs` asserts WHICH ROLE may reach each
// administrative endpoint. It covers `functions/api/admin/` and nothing
// else, which leaves the more basic question unasked everywhere else:
// does this endpoint require a session at all?
//
// That question has no owner today. A new file under `functions/api/lms/`
// that forgets `requireUser()` returns learner data to anybody who asks,
// and every existing test still passes — because the tests call the
// module underneath the route, where there is no session to omit.
//
// So this file takes the census. It walks `functions/api/`, finds every
// exported `onRequest*`, and asserts each one either:
//
//   - appears in PUBLIC below, with a written reason, or
//   - refuses an unauthenticated request with 401.
//
// The list is closed in BOTH directions. An endpoint missing from the
// census fails, and a PUBLIC entry naming a route that no longer exists
// fails too — a stale exemption is how a route quietly becomes public
// years after somebody decided it should not be.
//
// The guard is exercised at RUNTIME, not grepped for. A route can import
// requireUser() and never call it, or call it after reading the body,
// and only running the thing distinguishes those.
import { readdirSync, statSync, readFileSync } from 'node:fs';
import path from 'node:path';
import { makeD1 } from './d1-shim.mjs';
import { ROOT, loadUrl } from './helpers.mjs';

let pass = 0, fail = 0;
const check = (label, cond, detail) => {
  console.log((cond ? 'PASS ' : 'FAIL ') + label + (cond || detail === undefined ? '' : ` — ${detail}`));
  cond ? pass++ : fail++;
};

// ---------------------------------------------------------------------
// THE PUBLIC SURFACE — the whole of it
// ---------------------------------------------------------------------
// Each entry needs a reason, because "it was already like that" is how
// a public surface grows. Anything not listed here must demand a
// session.
const PUBLIC = {
  'admissions/apply.js': 'An applicant has no account yet — that is what applying is for.',
  'admissions/status.js': 'Looked up by application id, a capability the applicant was given. Returns id, status and date only; no name, no email, no decision detail.',
  'auth/webhook-clerk.js': 'Called by Clerk, not by a person. Authenticated by webhook signature, asserted below.',
  'payments/webhook-stripe.js': 'Called by Stripe. Signature-authenticated, asserted below.',
  'payments/webhook-paystack.js': 'Called by Paystack. Signature-authenticated, asserted below.',
  'payments/webhook-flutterwave.js': 'Called by Flutterwave. Signature-authenticated, asserted below.',
  'payments/webhook-opay.js': 'Called by OPay. Signature-authenticated, asserted below.',
  'verify/[code].js': 'The whole point. A credential a checker must register to verify is a credential nobody checks.',
  'graduate/[handle].js': 'A published graduate profile. Only reaches profiles the graduate chose to publish; an unpublished one is NotFound, because "exists but hidden" confirms the person is a graduate.',
  'share/[token].js': 'A record slice a graduate shared with an employer or registrar who has no account. The token IS the authorisation — high-entropy, expiring, revocable, stored only as a hash.',
  'credentials/jwks.js': 'The College\'s published signing keys. Verification that requires the issuer to participate is not verification. Public halves only — asserted in tests/signing.test.mjs.',
  'register/index.js': 'The Graduate Register. A roll of award holders published behind a login is not published. Consent-scoped and capped in the query.',
};

// Webhooks are public but not unauthenticated — they are authenticated
// by signature instead of by session.
//
// Asserted in two states, because they behave differently and both
// matter. CONFIGURED: the signature check runs and an unsigned request
// is refused 4xx, which is a verdict the provider should not retry.
// UNCONFIGURED: the College cannot verify a signature at all, and the
// only safe answer is still a refusal — a 5xx is acceptable there
// (the provider retries, and by then the gateway may be configured),
// but a 2xx never is, because that would accept an unverifiable
// payment instruction.
//
// The first version of this test set only OPAY_SECRET_KEY and got a
// 503, which it reported as a defect. It was not: `requireConfig` also
// wants OPAY_MERCHANT_ID, so the signature path was never reached and
// the test was measuring its own omission. Both states are now covered
// explicitly rather than by accident of which variables happened to be
// set.
const WEBHOOKS = Object.keys(PUBLIC).filter((f) => /webhook/.test(f));

const GATEWAY_CONFIG = {
  CLERK_WEBHOOK_SECRET: 's'.repeat(32),
  STRIPE_SECRET_KEY: 'sk_test_' + 'x'.repeat(24),
  STRIPE_WEBHOOK_SECRET: 'whsec_' + 'x'.repeat(24),
  PAYSTACK_SECRET_KEY: 'sk_test_' + 'x'.repeat(24),
  FLW_SECRET_KEY: 'FLWSECK_TEST-' + 'x'.repeat(20),
  FLW_WEBHOOK_SECRET_HASH: 'x'.repeat(32),
  OPAY_MERCHANT_ID: '256' + 'x'.repeat(10),
  OPAY_PUBLIC_KEY: 'OPAYPUB' + 'x'.repeat(20),
  OPAY_SECRET_KEY: 'OPAYPRV' + 'x'.repeat(20),
};

const API = path.join(ROOT, 'functions/api');

function walk(dir, base = '') {
  const out = [];
  for (const name of readdirSync(dir)) {
    const full = path.join(dir, name);
    if (statSync(full).isDirectory()) out.push(...walk(full, path.join(base, name)));
    else if (name.endsWith('.js')) out.push(path.join(base, name));
  }
  return out;
}

const files = walk(API).sort();
check('The census found the API surface', files.length >= 40, `${files.length} route files`);

const schema = readFileSync(path.join(ROOT, 'sql/schema.sql'), 'utf8');
const METHODS = ['Get', 'Post', 'Put', 'Patch', 'Delete'];

function freshEnv() {
  return {
    // A real JWKS URL is configured deliberately. With it absent, a
    // guard could 500 on a missing config and the 401 assertion would
    // pass for entirely the wrong reason.
    CLERK_JWKS_URL: 'https://stub.clerk.accounts.dev/.well-known/jwks.json',
    DB: makeD1(schema),
    RECORDINGS: { get: async () => null, put: async () => ({}), delete: async () => ({}) },
  };
}
// No key ever matches, so every token presented below is invalid.
globalThis.fetch = async () => ({ ok: true, status: 200, json: async () => ({ keys: [] }) });

function request(method, url, body) {
  return new Request(url, {
    method,
    headers: { 'Content-Type': 'application/json' },
    body: method === 'GET' ? undefined : JSON.stringify(body || {}),
  });
}

let guarded = 0, publicFound = 0;
const uncovered = [];

for (const file of files) {
  const mod = await import(loadUrl(path.join('functions/api', file)));
  const handlers = METHODS.filter((m) => typeof mod[`onRequest${m}`] === 'function');
  if (typeof mod.onRequest === 'function') handlers.push('');

  if (!handlers.length) { uncovered.push(`${file} (no onRequest* export)`); continue; }

  const isPublic = Object.prototype.hasOwnProperty.call(PUBLIC, file);

  for (const m of handlers) {
    const method = (m || 'Get').toUpperCase();
    const url = `https://wec-lc.test/api/${file.replace(/\.js$/, '').replace(/index$/, '')}`;
    let status = null, threw = null;
    try {
      const res = await mod[`onRequest${m}`]({
        request: request(method, url),
        env: freshEnv(),
        params: { code: 'WEC-AAAA-BBBB-CCCCC', id: 'x' },
        waitUntil: () => {},
      });
      status = res && res.status;
    } catch (e) { threw = e; }

    if (isPublic) {
      publicFound++;
      // A public route must not 401 — that would mean the exemption is
      // a lie and the route is unreachable by the people it is for.
      check(`PUBLIC  ${file} ${method} — reachable without a session`,
        threw === null && status !== 401, threw ? `threw ${threw.message}` : `status ${status}`);
    } else {
      guarded++;
      check(`GUARDED ${file} ${method} — refuses an unauthenticated request`,
        threw === null && status === 401, threw ? `threw ${threw.message}` : `status ${status}`);
    }
  }
}

check('Every route file exports a request handler', uncovered.length === 0, uncovered.join(', '));
check('The guarded surface is the larger part of the API', guarded > publicFound, `${guarded} guarded / ${publicFound} public`);

// A stale exemption is the dangerous direction: the route it named was
// renamed or split, the entry stayed, and the new route inherited an
// exemption nobody granted it.
const stale = Object.keys(PUBLIC).filter((f) => !files.includes(f));
check('No PUBLIC entry names a route that no longer exists', stale.length === 0, stale.join(', '));

// Every exemption carries a reason a reviewer can weigh.
const unreasoned = Object.entries(PUBLIC).filter(([, why]) => !why || why.length < 30);
check('Every public exemption states why', unreasoned.length === 0, unreasoned.map(([f]) => f).join(', '));

// ---------------------------------------------------------------------
// Public is not the same as unauthenticated
// ---------------------------------------------------------------------
async function postUnsigned(file, env) {
  const mod = await import(loadUrl(path.join('functions/api', file)));
  try {
    const res = await mod.onRequestPost({
      request: new Request('https://wec-lc.test/hook', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ event: 'anything', type: 'payment.succeeded', data: { id: 'x', reference: 'x' } }),
      }),
      env, waitUntil: () => {},
    });
    return { status: res && res.status, threw: null };
  } catch (e) { return { status: null, threw: e }; }
}

for (const file of WEBHOOKS) {
  const configured = await postUnsigned(file, { ...freshEnv(), ...GATEWAY_CONFIG });
  check(`WEBHOOK ${file} — configured: refuses an unsigned request with a verdict, not an outage`,
    configured.threw === null && configured.status >= 400 && configured.status < 500,
    configured.threw ? `threw ${configured.threw.message}` : `status ${configured.status}`);

  // The state the College is actually in for gateways it has not
  // enabled. It must still refuse: accepting a payment instruction
  // whose signature cannot be checked is the one outcome with no
  // defence.
  const bare = await postUnsigned(file, freshEnv());
  check(`WEBHOOK ${file} — unconfigured: still refuses, never accepts`,
    bare.threw === null && !(bare.status >= 200 && bare.status < 300),
    bare.threw ? `threw ${bare.threw.message}` : `status ${bare.status}`);
}

console.log(`\n${pass} passed, ${fail} failed.`);
process.exit(fail ? 1 : 0);
