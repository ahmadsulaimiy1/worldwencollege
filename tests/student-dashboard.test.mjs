// Run with: node --experimental-sqlite tests/student-dashboard.test.mjs
import { readFileSync } from 'node:fs';
import { makeD1 } from './d1-shim.mjs';
import { ROOT, loadUrl } from './helpers.mjs';

const schema = readFileSync(`${ROOT}/sql/schema.sql`, 'utf8');
const env = { DB: makeD1(schema) };
const db = env.DB;

const { buildStudentDashboard } = await import(loadUrl('functions/_lib/student/dashboard.js'));
const { onRequestGet: dashboardEndpoint } = await import(loadUrl('functions/api/student/dashboard.js'));

let pass = 0, fail = 0;
function check(label, cond) { console.log((cond ? 'PASS ' : 'FAIL ') + label); cond ? pass++ : fail++; }

// --- Fixtures: two students, isolated data, to prove no cross-student leakage ---
db.prepare(`INSERT INTO users (id, auth_provider, auth_provider_id, email, role) VALUES ('usr_a', 'clerk', 'sub_a', 'a@example.com', 'student')`).run();
db.prepare(`INSERT INTO users (id, auth_provider, auth_provider_id, email, role) VALUES ('usr_b', 'clerk', 'sub_b', 'b@example.com', 'student')`).run();

// Student A: completed Level I & II, currently active in Level III.
db.prepare(`INSERT INTO enrolments (id, user_id, level_id, status, started_at, completed_at) VALUES ('enr_a1', 'usr_a', 1, 'completed', '2026-01-01T00:00:00.000Z', '2026-02-01T00:00:00.000Z')`).run();
db.prepare(`INSERT INTO enrolments (id, user_id, level_id, status, started_at, completed_at) VALUES ('enr_a2', 'usr_a', 2, 'completed', '2026-02-01T00:00:00.000Z', '2026-03-01T00:00:00.000Z')`).run();
db.prepare(`INSERT INTO enrolments (id, user_id, level_id, status, started_at) VALUES ('enr_a3', 'usr_a', 3, 'active', '2026-03-01T00:00:00.000Z')`).run();

// Student B: no enrolments at all yet, one payment still pending.
db.prepare(`INSERT INTO payments (id, user_id, kind, level_id, amount_cents, currency, amount_usd_cents, provider, status, created_at)
  VALUES ('pay_b1', 'usr_b', 'single_level', 1, 316667, 'USD', 316667, 'stripe', 'pending', '2026-07-01T00:00:00.000Z')`).run();

// Student A's payments: one succeeded with a receipt, one for the
// current level still processing.
db.prepare(`INSERT INTO payments (id, user_id, kind, level_id, amount_cents, currency, amount_usd_cents, provider, status, created_at, confirmed_at)
  VALUES ('pay_a1', 'usr_a', 'single_level', 1, 316667, 'USD', 316667, 'stripe', 'succeeded', '2026-01-01T00:00:00.000Z', '2026-01-01T00:05:00.000Z')`).run();
db.prepare(`INSERT INTO receipts (id, payment_id, receipt_number) VALUES ('rcpt_a1', 'pay_a1', 'AIPC-R-000001')`).run();
db.prepare(`INSERT INTO payments (id, user_id, kind, level_id, amount_cents, currency, amount_usd_cents, provider, status, created_at)
  VALUES ('pay_a2', 'usr_a', 'single_level', 3, 316667, 'USD', 316667, 'paystack', 'processing', '2026-07-15T00:00:00.000Z')`).run();

// --- buildStudentDashboard: Student A ---
const dashA = await buildStudentDashboard(env, 'usr_a');
check('student A: 3 enrolments returned', dashA.enrolments.length === 3);
check('student A: activeLevelId = 3', dashA.activeLevelId === 3);
check('student A: completedLevelIds = [1, 2]', JSON.stringify(dashA.completedLevelIds) === JSON.stringify([1, 2]));
check('student A: 2 payments, most recent first', dashA.payments.length === 2 && dashA.payments[0].id === 'pay_a2');
check('student A: succeeded payment carries its receipt number', dashA.payments.find(p => p.id === 'pay_a1').receiptNumber === 'AIPC-R-000001');
check('student A: processing payment has no receipt yet', dashA.payments.find(p => p.id === 'pay_a2').receiptNumber == null);
check('student A: levelName/roman/cefr resolved via join', dashA.enrolments[2].roman === 'III' && dashA.enrolments[2].cefr === 'B1');

// --- buildStudentDashboard: Student B (no enrolments, one pending payment) ---
const dashB = await buildStudentDashboard(env, 'usr_b');
check('student B: no enrolments', dashB.enrolments.length === 0);
check('student B: activeLevelId is null', dashB.activeLevelId === null);
check('student B: sees only their own payment, not A\'s', dashB.payments.length === 1 && dashB.payments[0].id === 'pay_b1');
check('student B: does not see student A\'s data at all', !dashB.payments.some(p => p.id.startsWith('pay_a')) && !dashB.enrolments.some(e => e.id.startsWith('enr_a')));

// --- A brand-new user with literally nothing yet doesn't crash ---
db.prepare(`INSERT INTO users (id, auth_provider, auth_provider_id, email, role) VALUES ('usr_c', 'clerk', 'sub_c', 'c@example.com', 'student')`).run();
const dashC = await buildStudentDashboard(env, 'usr_c');
check('brand-new student: empty arrays, no crash', dashC.enrolments.length === 0 && dashC.payments.length === 0 && dashC.activeLevelId === null);

// --- Authorization boundary: no Authorization header -> 401 ---
const noAuthReq = new Request('http://x/api/student/dashboard');
const noAuthResp = await dashboardEndpoint({ request: noAuthReq, env });
check('dashboard endpoint: no Authorization header -> 401', noAuthResp.status === 401);

// --- No id/user parameter is ever accepted — confirm the endpoint's
// request handling has no such parameter path by checking the query
// string is simply ignored (still resolves to whatever requireUser()
// would resolve, not something attacker-controlled). Structural check:
// the source itself takes no id from the URL.
const src = readFileSync(loadUrl('functions/api/student/dashboard.js'), 'utf8');
check('dashboard endpoint source never reads a URL param for user id (own-data-only by construction)', !/searchParams/.test(src));

console.log(`\n${pass} passed, ${fail} failed.`);
process.exit(fail ? 1 : 0);
