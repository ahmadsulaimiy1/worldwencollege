// Who may call each administrative endpoint — asserted at the route,
// with real signed tokens and a real database.
//
// This file exists because of a defect the whole rest of the suite was
// structurally incapable of seeing. GET /api/admin/role shipped under a
// comment reading "Administrator only" and a guard reading
// requireStaff(), so every tutor could pull the complete register of
// who can read student records. Nothing caught it:
//
//   - admin-roles.test.mjs tests listAppointees(env), which takes no
//     actor. There is no actor to get wrong, so no assertion about the
//     actor was possible.
//   - the browser suite drives the page, and the page is only ever
//     opened by the harness's administrator.
//
// The rule lived in exactly one place — the endpoint's guard — and the
// guard was the thing that was wrong. Testing the module underneath it
// can never find that.
//
// So the contract is written down here as a table, and each row is
// asserted in BOTH directions: the intended role gets past the guard,
// and the role one step below is refused. A one-directional test would
// pass against an endpoint that refuses everybody, which is a
// different bug and not an improvement.
import { readdirSync, readFileSync, statSync } from 'node:fs';
import path from 'node:path';
import { makeD1 } from './d1-shim.mjs';
import { ROOT, loadUrl } from './helpers.mjs';

let pass = 0, fail = 0;
const check = (label, cond, detail) => {
  console.log((cond ? 'PASS ' : 'FAIL ') + label + (cond || detail === undefined ? '' : ` — ${detail}`));
  cond ? pass++ : fail++;
};

// --- real RS256 tokens, same shape as auth-provisioning.test.mjs -----
const b64url = (bytes) => Buffer.from(bytes).toString('base64')
  .replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
const enc = (obj) => b64url(new TextEncoder().encode(JSON.stringify(obj)));

const kp = await crypto.subtle.generateKey(
  { name: 'RSASSA-PKCS1-v1_5', modulusLength: 2048, publicExponent: new Uint8Array([1, 0, 1]), hash: 'SHA-256' },
  true, ['sign', 'verify'],
);
const jwk = { ...(await crypto.subtle.exportKey('jwk', kp.publicKey)), kid: 'kid-1', alg: 'RS256', use: 'sig' };
const realFetch = globalThis.fetch;
globalThis.fetch = async () => ({ ok: true, status: 200, json: async () => ({ keys: [jwk] }) });

async function token(sub) {
  const h = enc({ alg: 'RS256', typ: 'JWT', kid: 'kid-1' });
  const now = Math.floor(Date.now() / 1000);
  const p = enc({ sub, email: `${sub}@example.com`, email_verified: true, iat: now - 5, exp: now + 600 });
  const sig = await crypto.subtle.sign('RSASSA-PKCS1-v1_5', kp.privateKey, new TextEncoder().encode(`${h}.${p}`));
  return `${h}.${p}.${b64url(new Uint8Array(sig))}`;
}
const TOKENS = {
  student: await token('user_student'),
  staff: await token('user_staff'),
  admin: await token('user_admin'),
};

const schema = readFileSync(path.join(ROOT, 'sql/schema.sql'), 'utf8');
function freshEnv() {
  const env = {
    CLERK_JWKS_URL: 'https://stub.clerk.accounts.dev/.well-known/jwks.json',
    DB: makeD1(schema),
  };
  for (const role of ['student', 'staff', 'admin']) {
    env.DB.prepare(
      `INSERT INTO users (id, auth_provider, auth_provider_id, email, email_verified, role)
       VALUES ('usr_${role}', 'clerk', 'user_${role}', '${role}@example.com', 1, '${role}')`,
    ).bind().run();
  }
  return env;
}

// ---------------------------------------------------------------------
// THE CONTRACT
// ---------------------------------------------------------------------
// `minRole` is the lowest access level that may reach the endpoint's
// work. Everything below it must be refused by the guard, before any
// work happens and before any body is parsed.
//
// This table is the specification, not a description of the code. When
// the two disagree the table is right until somebody changes it on
// purpose — which is the whole point of writing it here rather than in
// a comment above each route.
const ROLE_ORDER = ['student', 'staff', 'admin'];
const ROUTES = [
  // Learner records — the ordinary work of running the programme.
  { file: 'functions/api/admin/learners.js', method: 'GET', minRole: 'staff',
    why: 'Searching and opening learner records is what staff access is for.' },
  { file: 'functions/api/admin/enrolment.js', method: 'POST', minRole: 'staff',
    why: 'Enrolling and withdrawing a learner is teaching-side work.' },

  // Access itself — staff act on learners, administrators act on staff.
  { file: 'functions/api/admin/role.js', method: 'POST', minRole: 'admin',
    why: 'Appointing someone is an administrator act; setUserRole() refuses staff too.' },
  { file: 'functions/api/admin/role.js', method: 'GET', minRole: 'admin',
    why: 'The register of who can read student records is not staff-readable. THIS IS THE ROW THAT WAS WRONG.' },

  // Money.
  { file: 'functions/api/admin/reports/revenue.js', method: 'GET', minRole: 'staff',
    why: 'Documented as staff/admin. See governance A5 — arguably should be admin.' },
  { file: 'functions/api/admin/reports/reconciliation.js', method: 'GET', minRole: 'staff',
    why: 'Documented as staff/admin. See governance A5.' },
  { file: 'functions/api/admin/currency/set-rate.js', method: 'POST', minRole: 'staff',
    why: 'Documented as staff/admin. See governance A5 — this sets what learners are charged.' },
  { file: 'functions/api/admin/currency/refresh-rates.js', method: 'POST', minRole: 'staff',
    why: 'Documented as staff/admin. See governance A5.' },

  // Destruction.
  { file: 'functions/api/admin/recordings/purge.js', method: 'POST', minRole: 'staff',
    why: 'Documented as staff-only, and dry-run by default. See governance A5.' },

  // Institutional access to the Register.
  { file: 'functions/api/admin/institutions.js', method: 'POST', minRole: 'admin',
    why: 'Granting an institution bulk programmatic access to graduate records is an institutional decision, not a teaching one.' },
  { file: 'functions/api/admin/institutions.js', method: 'GET', minRole: 'admin',
    why: 'Who has been reading the Register, and how much of it.' },

  // Cryptographic trust.
  { file: 'functions/api/admin/signing-keys.js', method: 'GET', minRole: 'admin',
    why: 'The key register and the signing audit. Administrator rather than staff: it is the record of what the institution has cryptographically asserted. Rotation and revocation are deliberately NOT exposed over HTTP at all.' },

  // Institutional quality.
  { file: 'functions/api/admin/institutional-metrics.js', method: 'GET', minRole: 'staff',
    why: 'The Institutional Metric Register. Contains no personal data — small cohorts are suppressed before the module returns — and a quality instrument only improves anything if the people doing the work can see it.' },
  { file: 'functions/api/admin/quality/competency-coverage.js', method: 'GET', minRole: 'staff',
    why: 'Whether the curriculum meets the framework\'s own competency rule. Contains no personal data, and a quality measure only improves anything if the people doing the teaching can see it.' },
];

const METHOD_EXPORT = { GET: 'onRequestGet', POST: 'onRequestPost', PUT: 'onRequestPut', DELETE: 'onRequestDelete' };

function request(method, file, tok) {
  const url = `https://example.test/${file.replace(/^functions\//, '').replace(/\.js$/, '')}`;
  return new Request(url, {
    method,
    headers: { authorization: `Bearer ${tok}`, 'content-type': 'application/json' },
    // An empty object rather than no body: a missing body and a missing
    // permission must not produce the same status, or the assertion
    // below could not tell them apart.
    body: method === 'GET' ? undefined : '{}',
  });
}

async function callAs(route, role) {
  const mod = await import(loadUrl(route.file));
  const handler = mod[METHOD_EXPORT[route.method]];
  if (typeof handler !== 'function') return { status: -1, error: `no ${METHOD_EXPORT[route.method]} export` };
  const env = freshEnv();
  try {
    const res = await handler({ request: request(route.method, route.file, TOKENS[role]), env });
    let body = {};
    try { body = await res.clone().json(); } catch { /* not json */ }
    return { status: res.status, error: body.error, message: body.message };
  } catch (e) {
    // A handler that throws instead of returning a Response is its own
    // defect — report it rather than letting it read as "refused".
    return { status: -2, error: `${e.name}: ${e.message}` };
  }
}

// ---------------------------------------------------------------------
// Every row, both directions
// ---------------------------------------------------------------------
for (const route of ROUTES) {
  const label = `${route.method} /${route.file.replace('functions/api/', '')}`;
  const minIndex = ROLE_ORDER.indexOf(route.minRole);

  // Direction 1 — the intended role gets THROUGH the guard.
  // "Through" is not "200": POST '{}' will usually fail validation with
  // a 422, which is exactly right and proves the request reached the
  // work. Only 401/403 mean the guard stopped it.
  const allowed = await callAs(route, route.minRole);
  check(`${label} — ${route.minRole} is not blocked by the guard`,
    allowed.status !== 401 && allowed.status !== 403 && allowed.status > 0,
    `${allowed.status} ${allowed.error || ''} ${allowed.message || ''}`);

  // Direction 2 — every role BELOW it is refused, with 403 and not 500.
  for (let i = 0; i < minIndex; i++) {
    const role = ROLE_ORDER[i];
    const denied = await callAs(route, role);
    check(`${label} — ${role} is refused (403)`, denied.status === 403,
      `${denied.status} ${denied.error || ''} ${denied.message || ''}`);
  }

  // And an unauthenticated caller is 401, not 403 and not a crash:
  // "who are you" and "not you" are different answers and a caller
  // needs to be able to tell them apart.
  {
    const mod = await import(loadUrl(route.file));
    const handler = mod[METHOD_EXPORT[route.method]];
    const env = freshEnv();
    const res = await handler({
      request: new Request('https://example.test/x', {
        method: route.method,
        headers: { 'content-type': 'application/json' },
        body: route.method === 'GET' ? undefined : '{}',
      }),
      env,
    });
    check(`${label} — no token at all is 401, not 403`, res.status === 401, res.status);
  }
}

// ---------------------------------------------------------------------
// The table must cover every admin route that exists
// ---------------------------------------------------------------------
// Without this, adding a new endpoint under functions/api/admin/ and
// forgetting to list it here produces a green suite and an unguarded
// route — the file would be silently exempt from its own audit.
function walk(dir, out = []) {
  for (const name of readdirSync(dir)) {
    const full = path.join(dir, name);
    if (statSync(full).isDirectory()) walk(full, out);
    else if (name.endsWith('.js')) out.push(path.relative(ROOT, full));
  }
  return out;
}
const onDisk = walk(path.join(ROOT, 'functions/api/admin')).sort();
const covered = new Set(ROUTES.map((r) => r.file));
const uncovered = onDisk.filter((f) => !covered.has(f));
check('Every route under functions/api/admin/ appears in the table above',
  uncovered.length === 0, uncovered.join(', '));

// Each covered file's exported handlers must all be in the table too —
// a file listed for GET but which also exports POST is half-audited.
const missingMethods = [];
for (const file of onDisk) {
  const mod = await import(loadUrl(file));
  for (const [method, exp] of Object.entries(METHOD_EXPORT)) {
    if (typeof mod[exp] !== 'function') continue;
    if (!ROUTES.some((r) => r.file === file && r.method === method)) missingMethods.push(`${method} ${file}`);
  }
}
check('...and every method each of them exports', missingMethods.length === 0, missingMethods.join(', '));

// ---------------------------------------------------------------------
// The guard helpers themselves
// ---------------------------------------------------------------------
{
  const session = await import(loadUrl('functions/_lib/auth/session.js'));
  const asRole = (role) => ({ id: `usr_${role}`, role });
  const threw = (fn) => { try { fn(); return null; } catch (e) { return e; } };

  check('assertAdminRole accepts an administrator', session.assertAdminRole(asRole('admin')).role === 'admin');
  const staffErr = threw(() => session.assertAdminRole(asRole('staff')));
  check('assertAdminRole refuses staff', staffErr && staffErr.name === 'AuthorizationError', staffErr && staffErr.name);
  check('...and says administrator, so the message is actionable',
    /administrator/i.test((staffErr && staffErr.message) || ''), staffErr && staffErr.message);
  check('...with a 403, not a 401 — the caller IS authenticated',
    staffErr && staffErr.httpStatus === 403, staffErr && staffErr.httpStatus);
  check('assertStaffRole still accepts an administrator, so admin remains a superset of staff',
    session.assertStaffRole(asRole('admin')).role === 'admin');
}

globalThis.fetch = realFetch;
console.log(`\n${pass} passed, ${fail} failed.`);
process.exit(fail ? 1 : 0);
