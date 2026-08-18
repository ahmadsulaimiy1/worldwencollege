// Run with: node --experimental-sqlite tests/admin-reports.test.mjs
import { readFileSync } from 'node:fs';
import { makeD1 } from './d1-shim.mjs';
import { ROOT, loadUrl } from './helpers.mjs';

const schema = readFileSync(`${ROOT}/sql/schema.sql`, 'utf8');
const env = { DB: makeD1(schema) };

const { buildRevenueReport } = await import(loadUrl('functions/_lib/reports/revenue.js'));
const { buildReconciliationReport } = await import(loadUrl('functions/_lib/reports/reconciliation.js'));
const { assertStaffRole, AuthorizationError } = await import(loadUrl('functions/_lib/auth/session.js'));
const { onRequestGet: revenueEndpoint } = await import(loadUrl('functions/api/admin/reports/revenue.js'));
const { onRequestGet: reconEndpoint } = await import(loadUrl('functions/api/admin/reports/reconciliation.js'));

let pass = 0, fail = 0;
function check(label, cond) { console.log((cond ? 'PASS ' : 'FAIL ') + label); cond ? pass++ : fail++; }

const db = env.DB;

// --- Fixtures ---
// Two users: one student, one staff.
db.prepare(`INSERT INTO users (id, auth_provider, auth_provider_id, email, role) VALUES (?, 'clerk', 'sub_student', 'student@example.com', 'student')`).bind('usr_student').run();
db.prepare(`INSERT INTO users (id, auth_provider, auth_provider_id, email, role) VALUES (?, 'clerk', 'sub_staff', 'staff@example.com', 'staff')`).bind('usr_staff').run();

// Payments: mix of statuses, currencies (all USD since that's the only
// active one), levels, providers, and explicit created_at timestamps so
// date-range and staleness queries are deterministic rather than
// dependent on "now" at test-run time.
const payments = [
  ['pay_1', 'usr_student', 3, 316667, 'USD', 316667, 'stripe', 'succeeded', '2026-07-01T10:00:00.000Z'],
  ['pay_2', 'usr_student', 3, 316667, 'USD', 316667, 'paystack', 'succeeded', '2026-07-01T11:00:00.000Z'],
  ['pay_3', 'usr_student', 5, 316667, 'USD', 316667, 'stripe', 'succeeded', '2026-07-02T09:00:00.000Z'],
  ['pay_4', 'usr_student', 1, 316667, 'USD', 316667, 'flutterwave', 'failed', '2026-07-02T09:05:00.000Z'],
  // Stale: pending, created far in the past relative to "now" — always
  // older than the 60-minute staleness window regardless of test-run time.
  ['pay_5', 'usr_student', 2, 316667, 'USD', 316667, 'stripe', 'pending', '2020-01-01T00:00:00.000Z'],
];
for (const [id, userId, levelId, amountCents, currency, amountUsdCents, provider, status, createdAt] of payments) {
  db.prepare(`INSERT INTO payments (id, user_id, kind, level_id, amount_cents, currency, amount_usd_cents, provider, status, created_at, confirmed_at)
    VALUES (?, ?, 'single_level', ?, ?, ?, ?, ?, ?, ?, ?)`)
    .bind(id, userId, levelId, amountCents, currency, amountUsdCents, provider, status, createdAt, status === 'succeeded' ? createdAt : null)
    .run();
}

// Receipts: pay_1 and pay_2 got one, pay_3 (succeeded) deliberately did
// NOT — simulates issueReceipt() having silently failed for it.
db.prepare(`INSERT INTO receipts (id, payment_id, receipt_number) VALUES ('rcpt_1', 'pay_1', 'WEC-R-000001')`).run();
db.prepare(`INSERT INTO receipts (id, payment_id, receipt_number) VALUES ('rcpt_2', 'pay_2', 'WEC-R-000002')`).run();

// A processed refund against pay_2.
db.prepare(`INSERT INTO refunds (id, payment_id, amount_cents, reason, status) VALUES ('ref_1', 'pay_2', 100000, 'Withdrawal before Level III started', 'processed')`).run();

// Webhook events: one verified+linked (pay_1), one verified but
// pointing at a payment id that doesn't exist (orphaned), one
// unverified (bad signature attempt).
db.prepare(`INSERT INTO payment_webhook_events (id, provider, event_id, event_type, payload_json, signature_verified, payment_id, processed_at)
  VALUES ('whe_1', 'stripe', 'evt_1', 'checkout.session.completed', '{}', 1, 'pay_1', '2026-07-01T10:00:05.000Z')`).run();
db.prepare(`INSERT INTO payment_webhook_events (id, provider, event_id, event_type, payload_json, signature_verified, payment_id, processed_at)
  VALUES ('whe_2', 'stripe', 'evt_orphan', 'checkout.session.completed', '{}', 1, 'pay_does_not_exist', '2026-07-01T10:05:00.000Z')`).run();
db.prepare(`INSERT INTO payment_webhook_events (id, provider, event_id, event_type, payload_json, signature_verified, payment_id, processed_at)
  VALUES ('whe_3', 'paystack', 'evt_bad_sig', 'charge.success', '{}', 0, NULL, NULL)`).run();

// --- Revenue report ---
const revAll = await buildRevenueReport(env, {});
check('revenue: succeeded count = 3', revAll.totals.succeededCount === 3);
check('revenue: gross = 3 x 316667', revAll.totals.grossUsdCents === 316667 * 3);
check('revenue: refunded = 100000 (processed refund on pay_2)', revAll.totals.refundedUsdCents === 100000);
check('revenue: net = gross - refunded', revAll.totals.netUsdCents === 316667 * 3 - 100000);
check('revenue: byStatus has succeeded, failed, pending rows', ['succeeded', 'failed', 'pending'].every(s => revAll.byStatus.some(r => r.status === s)));
check('revenue: byCurrency has exactly USD (only active currency)', revAll.byCurrency.length === 1 && revAll.byCurrency[0].currency === 'USD');
check('revenue: byProvider covers stripe (2 succeeded) and paystack (1 succeeded)', revAll.byProvider.find(p => p.provider === 'stripe')?.count === 2 && revAll.byProvider.find(p => p.provider === 'paystack')?.count === 1);
check('revenue: byLevel resolves level names via join', revAll.byLevel.some(l => l.levelName === 'Intermediate Programme'));
check('revenue: byDay groups the two same-day pay_1/pay_2 together', revAll.byDay.find(d => d.date === '2026-07-01')?.count === 2);

// Range filter: only 2026-07-02 onward should exclude pay_1/pay_2.
const revRanged = await buildRevenueReport(env, { from: '2026-07-02T00:00:00.000Z' });
check('revenue: date range filter excludes earlier succeeded payments', revRanged.totals.succeededCount === 1 && revRanged.totals.grossUsdCents === 316667);

// --- Reconciliation report ---
const recon = await buildReconciliationReport(env);
check('reconciliation: orphaned webhook (pay_does_not_exist) detected', recon.orphanedWebhooks.length === 1 && recon.orphanedWebhooks[0].id === 'whe_2');
check('reconciliation: unverified webhook (bad signature) detected', recon.unverifiedWebhooks.length === 1 && recon.unverifiedWebhooks[0].id === 'whe_3');
check('reconciliation: stale pending payment (pay_5, from 2020) detected', recon.stalePayments.some(p => p.id === 'pay_5'));
check('reconciliation: pay_3 (succeeded, no receipt) flagged as missing a receipt', recon.succeededPaymentsMissingReceipts.some(p => p.id === 'pay_3'));
check('reconciliation: pay_1/pay_2 (succeeded, have receipts) NOT flagged', !recon.succeededPaymentsMissingReceipts.some(p => p.id === 'pay_1' || p.id === 'pay_2'));
// whe_1 and whe_2 share (provider, event_type, signature_verified) —
// stripe/checkout.session.completed/verified — so they group into one
// row together; whe_3 (paystack/charge.success/unverified) is the other.
check('reconciliation: webhookVolume groups by (provider, event_type, verified) — 2 groups, counts 2 and 1', recon.webhookVolume.length === 2 && recon.webhookVolume.reduce((s, r) => s + r.count, 0) === 3);

// --- Authorization boundary (requireStaff) ---
// No token at all -> 401, before ever touching report logic.
const noAuthReq = new Request('http://x/api/admin/reports/revenue');
const noAuthResp = await revenueEndpoint({ request: noAuthReq, env });
check('revenue endpoint: no Authorization header -> 401', noAuthResp.status === 401);

const noAuthReconResp = await reconEndpoint({ request: noAuthReq, env });
check('reconciliation endpoint: no Authorization header -> 401', noAuthReconResp.status === 401);

// requireStaff's full path needs a real Clerk JWT to reach (not
// reachable here), but its role check — the part specific to this
// feature, as opposed to Clerk's JWT verification which is a separate,
// already-documented gap — is isolated in assertStaffRole() precisely
// so it can be proven directly against real `users` rows.
const studentRow = db.prepare('SELECT * FROM users WHERE id = ?').bind('usr_student').first();
const staffRow = db.prepare('SELECT * FROM users WHERE id = ?').bind('usr_staff').first();
const adminRow = { ...staffRow, role: 'admin' };

let studentThrew = false;
try { assertStaffRole(studentRow); } catch (e) { studentThrew = e instanceof AuthorizationError; }
check('assertStaffRole: student role is rejected with AuthorizationError', studentThrew);
check('assertStaffRole: staff role is accepted', assertStaffRole(staffRow) === staffRow);
check('assertStaffRole: admin role is accepted', assertStaffRole(adminRow) === adminRow);

console.log(`\n${pass} passed, ${fail} failed.`);
process.exit(fail ? 1 : 0);
