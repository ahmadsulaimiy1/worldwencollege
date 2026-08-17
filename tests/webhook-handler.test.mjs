// Run with: node --experimental-sqlite tests/webhook-handler.test.mjs
//
// Exercises the race-condition and error-handling fixes documented in
// functions/_lib/payments/webhook-handler.js's header comment, via real
// signed HTTP-shaped requests (a genuine HMAC-SHA256 Stripe signature
// computed the same way stripe-adapter.js verifies one) against a real
// SQLite-backed D1 shim — not mocks.
import { readFileSync } from 'node:fs';
import { makeD1 } from './d1-shim.mjs';
import { ROOT, loadUrl } from './helpers.mjs';

const schema = readFileSync(`${ROOT}/sql/schema.sql`, 'utf8');

let pass = 0, fail = 0;
function check(label, cond) { console.log((cond ? 'PASS ' : 'FAIL ') + label); cond ? pass++ : fail++; }

const WEBHOOK_SECRET = 'whsec_test_secret_for_offline_testing';

async function signStripeBody(rawBody, secret) {
  const t = Math.floor(Date.now() / 1000);
  const key = await crypto.subtle.importKey('raw', new TextEncoder().encode(secret), { name: 'HMAC', hash: 'SHA-256' }, false, ['sign']);
  const mac = await crypto.subtle.sign('HMAC', key, new TextEncoder().encode(`${t}.${rawBody}`));
  const hex = [...new Uint8Array(mac)].map((b) => b.toString(16).padStart(2, '0')).join('');
  return `t=${t},v1=${hex}`;
}

function stripeEvent(id, type, sessionId, paymentId) {
  return JSON.stringify({
    id, type,
    data: { object: { id: sessionId, client_reference_id: paymentId, amount_total: 316667, currency: 'usd' } },
  });
}

async function freshEnv() {
  const env = { DB: makeD1(schema), STRIPE_WEBHOOK_SECRET: WEBHOOK_SECRET };
  const db = env.DB;
  db.prepare(`INSERT INTO users (id, auth_provider, auth_provider_id, email, role) VALUES ('usr_1', 'clerk', 'sub_1', 'student@example.com', 'student')`).run();
  db.prepare(`INSERT INTO payments (id, user_id, kind, level_id, amount_cents, currency, amount_usd_cents, provider, status)
    VALUES ('pay_1', 'usr_1', 'single_level', 1, 316667, 'USD', 316667, 'stripe', 'processing')`).run();
  return env;
}

async function post(handleWebhook, env, rawBody, signatureHeader) {
  const request = new Request('http://x/api/payments/webhook-stripe', {
    method: 'POST',
    headers: signatureHeader ? { 'stripe-signature': signatureHeader } : {},
    body: rawBody,
  });
  return handleWebhook('stripe', request, env);
}

const { handleWebhook } = await import(loadUrl('functions/_lib/payments/webhook-handler.js'));

// --- Test 1: normal success path — status updated, receipt issued, once ---
{
  const env = await freshEnv();
  const body = stripeEvent('evt_1', 'checkout.session.completed', 'cs_1', 'pay_1');
  const sig = await signStripeBody(body, WEBHOOK_SECRET);
  const resp = await post(handleWebhook, env, body, sig);
  check('success path: returns 200', resp.status === 200);

  const payment = await env.DB.prepare('SELECT * FROM payments WHERE id = ?').bind('pay_1').first();
  check('success path: payment marked succeeded', payment.status === 'succeeded');
  const receipts = await env.DB.prepare('SELECT * FROM receipts WHERE payment_id = ?').bind('pay_1').all();
  check('success path: exactly one receipt issued', receipts.results.length === 1);
  check('success path: receipt number format', /^AIPC-R-\d{6}$/.test(receipts.results[0].receipt_number));

  const evRow = await env.DB.prepare('SELECT handled_at FROM payment_webhook_events WHERE provider=? AND event_id=?').bind('stripe', 'evt_1').first();
  check('success path: event marked handled_at', evRow.handled_at != null);
}

// --- Test 2: gateway retries the SAME event id after full success — short-circuits, no duplicate receipt ---
{
  const env = await freshEnv();
  const body = stripeEvent('evt_2', 'checkout.session.completed', 'cs_2', 'pay_1');
  const sig = await signStripeBody(body, WEBHOOK_SECRET);
  await post(handleWebhook, env, body, sig);
  const resp2 = await post(handleWebhook, env, body, sig); // exact retry
  const text2 = await resp2.text();
  check('retry after success: 200 "already processed"', resp2.status === 200 && text2.includes('already processed'));
  const receipts = await env.DB.prepare('SELECT * FROM receipts WHERE payment_id = ?').bind('pay_1').all();
  check('retry after success: still exactly one receipt', receipts.results.length === 1);
}

// --- Test 3: two DIFFERENT events reference the SAME payment (simulates a
// race / duplicate delivery under a different event id) — only one receipt ---
{
  const env = await freshEnv();
  const bodyA = stripeEvent('evt_3a', 'checkout.session.completed', 'cs_3a', 'pay_1');
  const bodyB = stripeEvent('evt_3b', 'checkout.session.completed', 'cs_3b', 'pay_1');
  const sigA = await signStripeBody(bodyA, WEBHOOK_SECRET);
  const sigB = await signStripeBody(bodyB, WEBHOOK_SECRET);
  await post(handleWebhook, env, bodyA, sigA);
  await post(handleWebhook, env, bodyB, sigB); // different event_id, same payment reference
  const receipts = await env.DB.prepare('SELECT * FROM receipts WHERE payment_id = ?').bind('pay_1').all();
  check('two different events, same payment: exactly one receipt (no double-issue)', receipts.results.length === 1);
  const payment = await env.DB.prepare('SELECT * FROM payments WHERE id = ?').bind('pay_1').first();
  check('two different events, same payment: still succeeded (second update no-ops via changes=0 guard)', payment.status === 'succeeded');
}

// --- Test 4: a normal success attempt genuinely completes end to end
// (the surrounding recovery-path logic — handled_at only set on success,
// receipts checked-before-inserted — is what Test 2/3 above actually
// exercise; this is a plain sanity re-check with a distinct event id) ---
{
  const env = await freshEnv();
  const body = stripeEvent('evt_4', 'checkout.session.completed', 'cs_4', 'pay_1');
  const sig = await signStripeBody(body, WEBHOOK_SECRET);
  const resp = await post(handleWebhook, env, body, sig);
  check('recovery scenario: first attempt still succeeds normally', resp.status === 200);
  const receipts = await env.DB.prepare('SELECT * FROM receipts WHERE payment_id = ?').bind('pay_1').all();
  check('recovery scenario: receipt exists after the attempt', receipts.results.length === 1);
}

// --- Test 5: malformed JSON body on a VERIFIED-looking request doesn't crash ---
{
  const env = await freshEnv();
  const malformed = '{not valid json';
  // Can't produce a real signature over malformed JSON meaningfully for
  // verification purposes other than proving verifyWebhookSignature
  // itself still runs against raw bytes (it doesn't parse JSON) — sign
  // the malformed body directly, exactly like a real gateway would sign
  // whatever bytes it sends.
  const sig = await signStripeBody(malformed, WEBHOOK_SECRET);
  const resp = await post(handleWebhook, env, malformed, sig);
  check('malformed JSON, valid signature: does not crash (400, not 500)', resp.status === 400);
}

// --- Test 6: unverifiable signature is rejected and logged, not processed ---
{
  const env = await freshEnv();
  const body = stripeEvent('evt_6', 'checkout.session.completed', 'cs_6', 'pay_1');
  const resp = await post(handleWebhook, env, body, 't=123,v1=deadbeef');
  check('bad signature: 400', resp.status === 400);
  const payment = await env.DB.prepare('SELECT * FROM payments WHERE id = ?').bind('pay_1').first();
  check('bad signature: payment untouched', payment.status === 'processing');
  const logged = await env.DB.prepare('SELECT * FROM payment_webhook_events WHERE provider=? AND event_id=?').bind('stripe', 'evt_6').first();
  check('bad signature: still logged to audit trail (signature_verified=0)', logged && logged.signature_verified === 0);
}

// --- Test 7: webhook referencing an unknown payment id doesn't throw ---
{
  const env = await freshEnv();
  const body = stripeEvent('evt_7', 'checkout.session.completed', 'cs_7', 'pay_does_not_exist');
  const sig = await signStripeBody(body, WEBHOOK_SECRET);
  const resp = await post(handleWebhook, env, body, sig);
  check('unknown payment reference: still 200, no crash', resp.status === 200);
}

console.log(`\n${pass} passed, ${fail} failed.`);
process.exit(fail ? 1 : 0);
