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
  'auth/webhook-clerk.js': 'Called by Clerk, not by a person. Authenticated by webhook signature, asserted below.',
  'payments/webhook-stripe.js': 'Called by Stripe. Signature-authenticated, asserted below.',
  'payments/webhook-paystack.js': 'Called by Paystack. Signature-authenticated, asserted below.',
  'payments/webhook-flutterwave.js': 'Called by Flutterwave. Signature-authenticated, asserted below.',
  'payments/webhook-opay.js': 'Called by OPay. Signature-authenticated, asserted below.',
  'verify/[code].js': 'The whole point. A credential a checker must register to verify is a credential nobody checks.',
  'graduate/[handle].js': 'A published graduate profile. Only reaches profiles the graduate chose to publish; an unpublished one is NotFound, because "exists but hidden" confirms the person is a graduate.',
  'share/[token].js': 'A record slice a graduate shared with an employer or registrar who has no account. The token IS the authorisation — high-entropy, expiring, revocable, stored only as a hash.',
  'verify/document/[code].js': 'Verification of an issued transcript or supplement, by the same rule as award verification: a document a checker must register to verify is a document nobody checks.',
  'credentials/jwks.js': 'The College\'s published signing keys. Verification that requires the issuer to participate is not verification. Public halves only — asserted in tests/signing.test.mjs.',
  'register/index.js': 'The Graduate Register. A roll of award holders published behind a login is not published. Consent-scoped and capped in the query.',
  'verify/institutional/[code].js': 'The Employer and University Verification Portal, by the same rule as award verification: a verification service a checker must register to use is a service nobody uses. It records the check WITHOUT recording who asked. The registered-institution endpoint (institutional/verify.js) is a different product for a different caller — identified, API-keyed and rate-limited — and both existing is deliberate.',
  'credentials/qr.js': 'The QR image for a verification code. It renders the public verification URL that is printed in plain text beside it, holds no personal data, and looks NOTHING up — deliberately, so it cannot become an enumeration oracle reporting which codes exist by whether an image comes back. It answers 400 to a malformed code and 200 to any well-formed one, real or not. A QR an employer must sign in to fetch is a QR nobody scans.',
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
// A THIRD CATEGORY, and the census needed it rather than a looser rule.
//
// These routes take no session, so they are not GUARDED; but they refuse
// an anonymous caller, so they are not PUBLIC either. They authenticate
// by API key. Filing them under PUBLIC would have meant asserting they
// are reachable without credentials — which is exactly what they must
// not be — and filing them under GUARDED would have meant asserting they
// demand a session, which would be a different product.
//
// Webhooks are the same shape one step further out: public routing,
// signature-authenticated. Both get their own assertions below.
const KEY_AUTHENTICATED = {
  'institutional/verify.js': 'Verification for registered institutions. No session — an admissions office has no account — but never anonymous: the API key identifies the institution and every check is recorded against it. That asymmetry with the public portal is the consent argument, stated in the module.',
};

// A FOURTH CATEGORY, added 20 August 2026 for the same reason the third
// was: the census was passing these routes for the wrong reason.
//
// An applicant has no account and cannot be given one — `applications`
// is filled in by people who have not signed in, and the College's auth
// provider cannot authenticate an applicant at all. What they hold is
// their application reference, and pages/admissions.html publishes it as
// "the only key to your record, and deliberately the only key". So these
// routes authenticate by a bearer reference: no session, and never
// anonymous.
//
// Filed as GUARDED they passed — they do answer 401 to a caller with no
// credential — but the census would have been asserting they demand a
// SESSION, which is a claim about a product the College does not have.
// The distinction matters the day somebody reads the census to decide
// whether a route is safe to open: "guarded by a session" and "opened by
// a string an applicant was emailed" carry very different risks, and the
// second one needs the constant-time compare and the lookup allowance
// that the first does not.
//
// Both halves are asserted here, which is what the earlier arrangement
// could not do: the refusal below in the main sweep, and the ADMISSION —
// a caller who does hold a real reference gets through — in its own
// block further down, next to the equivalent proof for an API key.
const REFERENCE_AUTHENTICATED = {
  'admissions/status.js': 'The short answer — id, status and date, no name and no email — to the holder of an application reference. Since 20 August 2026 it resolves the reference through the same applicationByReference() bearer check as track.js rather than a bare SELECT, so the two cannot disagree about who may read an application.',
  'admissions/track.js': 'The whole of what the reference buys: the published stages with the applicant\'s position marked, the audited timeline, what is outstanding and whose it is, and the live offer. Constant-time compare against a same-length decoy, one identical refusal for malformed and unknown alike, and a fixed lookup allowance per client address.',
};

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

let guarded = 0, publicFound = 0, keyed = 0, referenced = 0;
const uncovered = [];

for (const file of files) {
  const mod = await import(loadUrl(path.join('functions/api', file)));
  const handlers = METHODS.filter((m) => typeof mod[`onRequest${m}`] === 'function');
  if (typeof mod.onRequest === 'function') handlers.push('');

  if (!handlers.length) { uncovered.push(`${file} (no onRequest* export)`); continue; }

  const isPublic = Object.prototype.hasOwnProperty.call(PUBLIC, file);
  const isKeyed = Object.prototype.hasOwnProperty.call(KEY_AUTHENTICATED, file);
  const isReferenced = Object.prototype.hasOwnProperty.call(REFERENCE_AUTHENTICATED, file);

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

    if (isReferenced) {
      referenced++;
      check(`REFERENCE ${file} ${method} — refuses a caller holding no application reference`,
        threw === null && status === 401, threw ? `threw ${threw.message}` : `status ${status}`);
      continue;
    }
    if (isKeyed) {
      keyed++;
      // Refuses an anonymous caller — like a guarded route — but the
      // credential is a key, not a session. Both halves are asserted:
      // that it refuses, and (below) that a key gets through.
      check(`KEYED   ${file} ${method} — refuses a caller with no API key`,
        threw === null && status === 401, threw ? `threw ${threw.message}` : `status ${status}`);
      continue;
    }
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
check('Every key-authenticated route is exercised', keyed >= 1, keyed);

// A key that works must actually work, or the category is just an
// elaborate way of saying "broken".
{
  const { registerInstitution } = await import(loadUrl('functions/_lib/registry/documents.js'));
  const mod = await import(loadUrl('functions/api/institutional/verify.js'));
  const env = freshEnv();
  env.DB.prepare(`INSERT INTO users (id, auth_provider, auth_provider_id, email, role)
    VALUES ('usr_a','clerk','c_a','a@example.com','admin')`).bind().run();
  const inst = await registerInstitution(env, { name: 'Census Test University', kind: 'university' });
  const res = await mod.onRequestGet({
    request: new Request('https://wec-lc.test/api/institutional/verify?code=WEC-AAAA-BBBB-CCCCC', {
      headers: { Authorization: `Bearer ${inst.apiKey}` },
    }),
    env, waitUntil: () => {},
  });
  check('KEYED   institutional/verify.js — a valid key is admitted', res.status === 200, res.status);
}

// The other half of the reference category, and the half that makes it
// a category rather than an excuse. A route that refuses everybody is
// trivially "guarded"; what has to be true is that the credential the
// applicant actually holds opens exactly their own record and no other.
{
  const { onRequestPost: apply } = await import(loadUrl('functions/api/admissions/apply.js'));
  const env = freshEnv();
  const made = await (await apply({
    request: new Request('https://wec-lc.test/api/admissions/apply', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'CF-Connecting-IP': '203.0.113.77' },
      body: JSON.stringify({ fullName: 'Census Applicant', email: 'census@example.com' }),
    }),
    env,
    waitUntil: () => {},
  })).json();

  for (const [file, param] of [['admissions/status.js', 'id'], ['admissions/track.js', 'ref']]) {
    const mod = await import(loadUrl(path.join('functions/api', file)));
    const res = await mod.onRequestGet({
      request: new Request(`https://wec-lc.test/api/${file.replace(/\.js$/, '')}?${param}=${made.applicationId}`, {
        headers: { 'CF-Connecting-IP': '203.0.113.77' },
      }),
      env,
      waitUntil: () => {},
    });
    check(`REFERENCE ${file} GET — the applicant's own reference is admitted`, res.status === 200, res.status);
    const body = await res.json();
    check(`REFERENCE ${file} GET — and answers about that application and no other`,
      body.reference === made.applicationId || body.id === made.applicationId,
      JSON.stringify(body).slice(0, 120));
  }
}

const stale = Object.keys(PUBLIC).filter((f) => !files.includes(f));
const staleKeyed = Object.keys(KEY_AUTHENTICATED).filter((f) => !files.includes(f));
const staleRef = Object.keys(REFERENCE_AUTHENTICATED).filter((f) => !files.includes(f));
check('Every reference-authenticated route is exercised', referenced >= 2, referenced);
check('No reference-authenticated entry names a route that no longer exists',
  staleRef.length === 0, staleRef.join(', '));
check('Every reference exemption states why',
  Object.entries(REFERENCE_AUTHENTICATED).every(([, why]) => why && why.length >= 30));
check('No PUBLIC entry names a route that no longer exists', stale.length === 0, stale.join(', '));
check('No key-authenticated entry names a route that no longer exists',
  staleKeyed.length === 0, staleKeyed.join(', '));

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
