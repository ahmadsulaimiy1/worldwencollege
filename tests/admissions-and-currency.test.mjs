// Run with: node --experimental-sqlite tests/admissions-and-currency.test.mjs
// (or `npm test`, which runs every *.test.mjs in this directory —
// see tests/README.md)
import { readFileSync } from 'node:fs';
import { makeD1 } from './d1-shim.mjs';
import { ROOT, loadUrl } from './helpers.mjs';

const schema = readFileSync(`${ROOT}/sql/schema.sql`, 'utf8');
const env = { DB: makeD1(schema) };

const { onRequestPost: apply } = await import(loadUrl('functions/api/admissions/apply.js'));
const { onRequestGet: status } = await import(loadUrl('functions/api/admissions/status.js'));
const { convertFromUsdCents, suggestRouting, listActiveCurrencies } = await import(loadUrl('functions/_lib/currency.js'));

let pass = 0, fail = 0;
function check(label, cond) {
  console.log((cond ? 'PASS ' : 'FAIL ') + label);
  cond ? pass++ : fail++;
}

// --- Test 1: valid application submission ---
const req1 = new Request('http://x/api/admissions/apply', {
  method: 'POST',
  body: JSON.stringify({ fullName: 'Test Applicant', email: 'test@example.com', country: 'NG' }),
});
const resp1 = await apply({ request: req1, env });
const body1 = await resp1.json();
check('apply: 201 status', resp1.status === 201);
check('apply: returns applicationId', typeof body1.applicationId === 'string' && body1.applicationId.startsWith('app_'));
check('apply: status = submitted', body1.status === 'submitted');

// --- Test 2: invalid application (bad email) rejected ---
const req2 = new Request('http://x/api/admissions/apply', {
  method: 'POST',
  body: JSON.stringify({ fullName: 'No Email', email: 'not-an-email' }),
});
const resp2 = await apply({ request: req2, env });
const body2 = await resp2.json();
check('apply: rejects bad email with 422', resp2.status === 422);
check('apply: error names the email field', body2.fields && body2.fields.email);

// --- Test 3: status lookup round-trips the real row (camelCase response) ---
const req3 = new Request(`http://x/api/admissions/status?id=${body1.applicationId}`);
const resp3 = await status({ request: req3, env });
const body3 = await resp3.json();
check('status: 200 for real id', resp3.status === 200);
check('status: matches submitted application', body3.id === body1.applicationId && body3.status === 'submitted');
check('status: response is camelCase (createdAt, not created_at)', 'createdAt' in body3 && !('created_at' in body3));

// --- Test 4: an unknown reference is REFUSED, and refused the same way
// a malformed one is.
//
// It used to be 404 "No application found with that id.", which is a
// distinct answer and therefore an answer: a caller enumerating
// references could read which ones exist off the difference. Since
// 20 August 2026 this route shares the bearer check in
// functions/_lib/admissions/lifecycle.js with /api/admissions/track, so
// a miss and a malformation are one refusal, at one status, in constant
// time. The assertion here is the property, not the number: the two
// must be indistinguishable. ---
const unknown = await status({
  request: new Request('http://x/api/admissions/status?id=app_00000000-0000-4000-8000-000000000000'), env,
});
const malformed = await status({ request: new Request('http://x/api/admissions/status?id=not-a-reference'), env });
check('status: an unknown reference is refused, not answered', unknown.status === 401, unknown.status);
const unknownBody = await unknown.json();
const malformedBody = await malformed.json();
check('status: a malformed reference is refused identically — no answer says "that one exists"',
  malformed.status === unknown.status && malformedBody.message === unknownBody.message,
  `${malformed.status} / ${unknown.status}`);
check('status: the refusal does not name the applicant or their email',
  !/@/.test(JSON.stringify(unknownBody)));
const noRef = await status({ request: new Request('http://x/api/admissions/status'), env });
check('status: no reference at all is 401 — the route has an authentication boundary', noRef.status === 401, noRef.status);

// --- Test 5: currency conversion refuses inactive currencies (no fabricated FX) ---
let threw = false;
try { await convertFromUsdCents(env, 100000, 'NGN'); } catch { threw = true; }
check('currency: refuses to convert to an inactive currency (NGN has no rate)', threw);

const usdSame = await convertFromUsdCents(env, 316667, 'USD');
check('currency: USD passthrough is exact', usdSame === 316667);

// --- Test 6: routing suggestion falls back safely for an unmapped country ---
const routeUnknown = await suggestRouting(env, 'ZZ');
check('routing: unknown country falls back to USD/stripe', routeUnknown.currency === 'USD' && routeUnknown.gateways[0] === 'stripe');

const routeNg = await suggestRouting(env, 'NG');
check('routing: NG suggests paystack first (currency stays USD since NGN inactive)', routeNg.gateways[0] === 'paystack' && routeNg.currency === 'USD');

// --- Test 7: only USD is offered at checkout today ---
const active = await listActiveCurrencies(env);
check('currency: exactly one active currency (USD) — no fabricated rates active', active.length === 1 && active[0].code === 'USD');

console.log(`\n${pass} passed, ${fail} failed.`);
process.exit(fail ? 1 : 0);
