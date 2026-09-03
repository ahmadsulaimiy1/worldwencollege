// ONE PERSON, ONE STORY, FROM THE APPLICATION FORM TO A STRANGER
// CHECKING THE CERTIFICATE.
//
// ─────────────────────────────────────────────────────────────────────
// WHY THIS FILE EXISTS WHEN A HUNDRED AND TEN OTHERS ALREADY PASS
// ─────────────────────────────────────────────────────────────────────
// Every stage of this College is tested. Admissions is tested.
// Payments are tested. The examination is tested. Conferral is tested.
// Verification is tested. And until this file, not one of those tests
// had ever met another one: each opens its own database, seeds its own
// fixture learner, and asserts about a person who exists only inside
// it.
//
// That is exactly the failure mode the standing rule names — "a feature
// is not complete simply because a page exists; nothing should exist in
// isolation". A suite of isolated stages passes cleanly against a
// platform whose stages do not join up, because no assertion ever
// carries a value from one stage into the next.
//
// The seam it actually hid is in tests/applicant-lifecycle.test.mjs,
// which is a good file. To reach `enrolled` it writes:
//
//     // The account and the paid-for enrolment the payment path creates.
//     env.DB.prepare("INSERT INTO enrolments (…) VALUES ('enr_paid', …)")
//
// — an honest shortcut, and the one place where the money joins the
// academy. The comment describes a path that the test does not take.
// Below, that row is not written. A price is quoted, a payment is
// opened, a gateway webhook is signed and delivered, a receipt is
// issued, and the enrolment is the one the College's own confirmation
// path created out of it.
//
// ─────────────────────────────────────────────────────────────────────
// WHAT IS HELD, AND WHAT IS DELIBERATELY NOT
// ─────────────────────────────────────────────────────────────────────
// This file asserts JOINS, not behaviour that already has a home. It
// does not re-test the admissions state machine, the webhook's
// idempotency, the marking tolerance or the honour bands — those are
// tested properly elsewhere and repeating them here would only mean two
// places to update. What it holds is that the SAME identity survives
// every handover:
//
//   the reference an applicant is given  →  the payment they make
//   the payment                          →  the enrolment they hold
//   the enrolment                        →  the examination they sit
//   the examination                      →  the award conferred on them
//   the award                            →  the code a stranger types
//
// Every one of those arrows is a value read out of one stage and passed
// into the next. If any handover silently invents a new identity, an
// assertion below has nothing to compare against and the file fails.
//
// AND IT IS DRIVEN AT THE ROUTES. Where a route exists, the route is
// called — with a real RS256 session for the parties who hold one, and
// with no session at all for the applicant and the stranger, because
// "no account needed" is a published promise and not a convenience.

import { readFileSync } from 'node:fs';
import path from 'node:path';
import { makeD1 } from './d1-shim.mjs';
import { ROOT, loadUrl } from './helpers.mjs';

let pass = 0, fail = 0;
const check = (label, cond, detail) => {
  console.log((cond ? 'PASS ' : 'FAIL ') + label + (cond || detail === undefined ? '' : ` — ${detail}`));
  cond ? pass++ : fail++;
};

// ── Real signed sessions, the shape the guards actually verify ───────
const b64url = (bytes) => Buffer.from(bytes).toString('base64')
  .replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
const enc = (obj) => b64url(new TextEncoder().encode(JSON.stringify(obj)));

const kp = await crypto.subtle.generateKey(
  { name: 'RSASSA-PKCS1-v1_5', modulusLength: 2048, publicExponent: new Uint8Array([1, 0, 1]), hash: 'SHA-256' },
  true, ['sign', 'verify'],
);
const jwk = { ...(await crypto.subtle.exportKey('jwk', kp.publicKey)), kid: 'kid-1', alg: 'RS256', use: 'sig' };

async function token(sub) {
  const h = enc({ alg: 'RS256', typ: 'JWT', kid: 'kid-1' });
  const now = Math.floor(Date.now() / 1000);
  const p = enc({ sub, email: `${sub}@example.com`, email_verified: true, iat: now - 5, exp: now + 900 });
  const sig = await crypto.subtle.sign('RSASSA-PKCS1-v1_5', kp.privateKey, new TextEncoder().encode(`${h}.${p}`));
  return `${h}.${p}.${b64url(new Uint8Array(sig))}`;
}

// The mail gateway is not configured — the state the College is
// actually in — and nothing below depends on an email arriving.
globalThis.fetch = async (url) => {
  const u = String(url);
  if (u.includes('jwks')) return { ok: true, status: 200, json: async () => ({ keys: [jwk] }) };
  if (u.includes('api.resend.com')) return { ok: false, status: 400, text: async () => '{"message":"not configured"}' };
  throw new Error(`unexpected fetch to ${u}`);
};

const WEBHOOK_SECRET = 'whsec_journey_offline';
const schema = readFileSync(path.join(ROOT, 'sql/schema.sql'), 'utf8');

const env = {
  CLERK_JWKS_URL: 'https://stub.clerk.accounts.dev/.well-known/jwks.json',
  STRIPE_WEBHOOK_SECRET: WEBHOOK_SECRET,
  DB: makeD1(schema),
};
const db = env.DB;
const run = (sql, ...a) => db.prepare(sql).bind(...a).run();
const one = (sql, ...a) => db.prepare(sql).bind(...a).first();

// ── The cast. Three people and a stranger. ───────────────────────────
//
// The learner's account is created here rather than by a request
// because Clerk creates it, at Step 4 of admissions, and Clerk is not
// in this process. Everything the College itself does to that account
// below goes through the College's own code.
const CAST = [
  ['usr_amara', 'student', 'Amara Bello', 'amara@example.com'],
  ['usr_officer', 'staff', 'Admissions Officer', 'officer@example.com'],
  ['usr_first', 'staff', 'First Marker', 'first@example.com'],
  ['usr_second', 'staff', 'Second Marker', 'second@example.com'],
  ['usr_registrar', 'admin', 'The Registrar', 'registrar@example.com'],
  ['usr_examiner', 'examiner', 'The Independent Examiner', 'examiner@example.com'],
];
for (const [id, role, name, email] of CAST) {
  await run(`INSERT INTO users (id, auth_provider, auth_provider_id, email, email_verified, role, preferred_name)
             VALUES (?, 'clerk', ?, ?, 1, ?, ?)`, id, `sub_${id}`, email, role, name);
}
const TOKENS = {
  amara: await token('sub_usr_amara'),
  officer: await token('sub_usr_officer'),
  registrar: await token('sub_usr_registrar'),
  first: await token('sub_usr_first'),
  second: await token('sub_usr_second'),
};
const registrar = { id: 'usr_registrar', role: 'admin' };
const firstMarker = { id: 'usr_first', role: 'staff' };
const secondMarker = { id: 'usr_second', role: 'staff' };

function req(method, url, { body, token: tk, ip } = {}) {
  const headers = { 'Content-Type': 'application/json' };
  if (tk) headers.Authorization = `Bearer ${tk}`;
  if (ip) headers['CF-Connecting-IP'] = ip;
  return new Request(url, { method, headers, body: method === 'GET' ? undefined : JSON.stringify(body || {}) });
}
const BASE = 'https://wec-lc.test';

// ── The modules under test, all of them the shipped ones ─────────────
const apply = await import(loadUrl('functions/api/admissions/apply.js'));
const track = await import(loadUrl('functions/api/admissions/track.js'));
const offerRoute = await import(loadUrl('functions/api/admissions/offer.js'));
const applicationsRoute = await import(loadUrl('functions/api/staff/applications.js'));
const completeLevelRoute = await import(loadUrl('functions/api/lms/complete-level.js'));
const standingRoute = await import(loadUrl('functions/api/student/standing.js'));
const financeRoute = await import(loadUrl('functions/api/student/finance.js'));
const awardsRoute = await import(loadUrl('functions/api/student/awards.js'));
const conferralRoute = await import(loadUrl('functions/api/admin/conferral.js'));
const verifyRoute = await import(loadUrl('functions/api/verify/[code].js'));
const registerRoute = await import(loadUrl('functions/api/register/index.js'));

const L = await import(loadUrl('functions/_lib/admissions/lifecycle.js'));
const { priceCheckout, openPayment, markPaymentProcessing } = await import(loadUrl('functions/_lib/payments/checkout.js'));
const { handleWebhook } = await import(loadUrl('functions/_lib/payments/webhook-handler.js'));
const { confirmEnrolment } = await import(loadUrl('functions/_lib/payments/confirmation.js'));
const X = await import(loadUrl('functions/_lib/academic/examinations.js'));

const LEVEL = 1;
const APPLICANT_IP = '203.0.113.44';

// =====================================================================
// ACT I · THE APPLICANT, WHO HAS NO ACCOUNT AND NO SESSION
// =====================================================================
L.resetReferenceLookups();

const applyRes = await apply.onRequestPost({
  request: req('POST', `${BASE}/api/admissions/apply`, {
    body: {
      fullName: 'Amara Bello', email: 'amara@example.com', country: 'GB',
      selfAssessedLevelId: 1, privacyAgreed: true,
    },
  }),
  env,
});
const applyBody = await applyRes.json();
check('ACT I · an application is accepted from a person with no account',
  applyRes.status === 201 && typeof applyBody.applicationId === 'string',
  `status ${applyRes.status} ${JSON.stringify(applyBody).slice(0, 120)}`);

/** THE FIRST HANDOVER. Everything after this is keyed on this string. */
const REFERENCE = applyBody.applicationId;

const t1 = await track.onRequestGet({
  request: req('GET', `${BASE}/api/admissions/track?ref=${REFERENCE}`, { ip: APPLICANT_IP }), env,
});
const t1Body = await t1.json();
check('...and the reference they were given is enough to find it again, with no session',
  t1.status === 200 && t1Body.status === 'submitted', `status ${t1.status}`);
check('...which tells them where they are of the five published stages',
  t1Body.stage.number === 2 && t1Body.stage.of === 5, JSON.stringify(t1Body.stage));

// The College moves it. Both moves are made by a real member of staff
// holding a real session — the point being that the applicant's
// reference and the officer's session address the SAME application.
const place = await applicationsRoute.onRequestPatch({
  request: req('PATCH', `${BASE}/api/staff/applications`, {
    token: TOKENS.officer,
    body: { applicationId: REFERENCE, to: 'placement_pending', placementLevelId: LEVEL, reason: 'Placement conversation held.' },
  }),
  env,
});
check('...a member of staff, holding a session, finds the same application by that reference',
  place.status === 200, `status ${place.status}`);

const offer = await offerRoute.onRequestPost({
  request: req('POST', `${BASE}/api/admissions/offer`, {
    token: TOKENS.officer,
    body: {
      applicationId: REFERENCE, levelId: LEVEL, kind: 'unconditional',
      expiresAt: new Date(Date.now() + 30 * 86400000).toISOString(),
    },
  }),
  env,
});
check('...and issues an offer against it', offer.status === 201, `status ${offer.status}`);

const accept = await offerRoute.onRequestPost({
  request: req('POST', `${BASE}/api/admissions/offer?action=accept`, { body: { reference: REFERENCE }, ip: APPLICANT_IP }),
  env,
});
const acceptBody = await accept.json();
check('...which the applicant accepts holding nothing but that same reference',
  accept.status === 200 && acceptBody.status === 'accepted', `status ${accept.status}`);
check('...and is told, plainly, that payment is what is still outstanding',
  acceptBody.outstanding.some((x) => /payment/i.test(x.what)),
  JSON.stringify(acceptBody.outstanding));

// =====================================================================
// ACT II · THE MONEY, AND THE ENROLMENT IT ACTUALLY CREATES
// =====================================================================
//
// THIS IS THE SEAM THE SUITE COULD NOT SEE. No enrolment row is written
// here. A price is quoted from the published tariff, a payment is
// opened, the gateway's webhook is signed the way stripe-adapter.js
// verifies one, and the enrolment is whatever the College's own
// confirmation path makes of that.
//
// The account is bound to the application first, because that is what
// Step 4 of admissions does and the enrolment gate below reads it.
await run('UPDATE applications SET user_id = ? WHERE id = ?', 'usr_amara', REFERENCE);
const amara = one('SELECT * FROM users WHERE id = ?', 'usr_amara');

const quote = await priceCheckout(env, {
  user: amara,
  // USD, because it is the one currency sql/schema.sql marks active —
  // the others are listed with is_active = 0 and no FX rate, and a
  // journey that quoted in one of them would be testing a tariff the
  // College has not switched on.
  body: { levelId: LEVEL, gateway: 'stripe', currency: 'USD', country: 'GB' },
});
check('ACT II · the College quotes a price for this learner from its own tariff',
  quote.amountMinor > 0 && quote.currencyCode === 'USD',
  `${quote.amountMinor} ${quote.currencyCode}`);

/** THE SECOND HANDOVER. */
const PAYMENT_ID = await openPayment(env, { user: amara, quote });
await markPaymentProcessing(env, PAYMENT_ID, 'cs_journey_1');
check('...and opens a payment against the learner who was offered the place',
  one('SELECT user_id FROM payments WHERE id = ?', PAYMENT_ID).user_id === 'usr_amara');

async function signStripe(rawBody) {
  const t = Math.floor(Date.now() / 1000);
  const key = await crypto.subtle.importKey('raw', new TextEncoder().encode(WEBHOOK_SECRET),
    { name: 'HMAC', hash: 'SHA-256' }, false, ['sign']);
  const mac = await crypto.subtle.sign('HMAC', key, new TextEncoder().encode(`${t}.${rawBody}`));
  return `t=${t},v1=${[...new Uint8Array(mac)].map((b) => b.toString(16).padStart(2, '0')).join('')}`;
}
const hookBody = JSON.stringify({
  id: 'evt_journey_1',
  type: 'checkout.session.completed',
  data: { object: { id: 'cs_journey_1', client_reference_id: PAYMENT_ID, amount_total: quote.amountMinor, currency: 'usd' } },
});
const hookRes = await handleWebhook('stripe', new Request(`${BASE}/api/payments/webhook-stripe`, {
  method: 'POST', headers: { 'stripe-signature': await signStripe(hookBody) }, body: hookBody,
}), env);
check('...the gateway confirms it, over a signature the College checks itself',
  hookRes.status === 200, `status ${hookRes.status}`);
check('...the payment reads succeeded',
  one('SELECT status FROM payments WHERE id = ?', PAYMENT_ID).status === 'succeeded');
check('...and a receipt was issued for it, numbered',
  /^WEC-R-\d{6}$/.test((one('SELECT receipt_number FROM receipts WHERE payment_id = ?', PAYMENT_ID) || {}).receipt_number || ''),
  JSON.stringify(one('SELECT receipt_number FROM receipts WHERE payment_id = ?', PAYMENT_ID)));

/** THE THIRD HANDOVER. Not written by this file — returned by the platform. */
const enrolled = await confirmEnrolment(env, { user: amara, paymentId: PAYMENT_ID });
check('...THE ENROLMENT IS THE ONE THE PAYMENT CREATED, not one a test wrote',
  enrolled.created === true && enrolled.enrolment.userId === 'usr_amara' && enrolled.enrolment.levelId === LEVEL,
  JSON.stringify(enrolled.enrolment));
const ENROLMENT_ID = enrolled.enrolment.id;

// The gate the lifecycle test could only reach by writing the row.
const toEnrolled = await applicationsRoute.onRequestPatch({
  request: req('PATCH', `${BASE}/api/staff/applications`, {
    token: TOKENS.officer,
    body: { applicationId: REFERENCE, to: 'enrolled', reason: 'Payment confirmed and enrolment opened.' },
  }),
  env,
});
check('...so the application reaches enrolled through the money, not around it',
  toEnrolled.status === 200, `status ${toEnrolled.status} ${(await toEnrolled.clone().text()).slice(0, 140)}`);
check('...and the enrolment the payment created is bound back to the application',
  one('SELECT application_id FROM enrolments WHERE id = ?', ENROLMENT_ID).application_id === REFERENCE);

const t2 = await track.onRequestGet({
  request: req('GET', `${BASE}/api/admissions/track?ref=${REFERENCE}`, { ip: APPLICANT_IP }), env,
});
const t2Body = await t2.json();
check('...and the reference from Act I still answers, now at the last stage',
  t2Body.stage.number === 5 && t2Body.stage.of === 5, JSON.stringify(t2Body.stage));

// =====================================================================
// ACT III · THE STUDENT
// =====================================================================
//
// The same person, now holding a session of their own, asks the College
// about themselves. Every figure below has to be about THIS learner —
// the assertions are on the identity, not on the arithmetic, which
// tests/student-finance.test.mjs and tests/academic-standing.test.mjs
// own.
const fin = await financeRoute.onRequestGet({
  request: req('GET', `${BASE}/api/student/finance`, { token: TOKENS.amara }), env,
});
const finBody = await fin.json();
check('ACT III · the learner\'s own finance page shows the payment they actually made',
  fin.status === 200 && finBody.payments.some((p) => p.id === PAYMENT_ID && p.status === 'succeeded'),
  JSON.stringify((finBody.payments || []).map((p) => [p.id, p.status])));
check('...with the receipt number the gateway confirmation issued',
  finBody.payments.some((p) => p.id === PAYMENT_ID && /^WEC-R-/.test(p.receiptNumber || '')),
  JSON.stringify((finBody.payments || []).map((p) => p.receiptNumber)));

// Their coursework. Seeded, because a quiz answer is not a seam — what
// is a seam is that the work attaches to the enrolment above.
const course = one('SELECT id FROM courses WHERE level_id = ?', LEVEL).id;
for (let i = 1; i <= 10; i++) {
  await run('INSERT INTO units (id, course_id, sequence, title) VALUES (?, ?, ?, ?)', `unt_${i}`, course, i, `Module ${i}`);
  await run("INSERT INTO learning_items (id, unit_id, sequence, kind, title) VALUES (?, ?, 1, 'quiz', ?)", `itq_${i}`, `unt_${i}`, `Quiz ${i}`);
  await run("INSERT INTO learning_items (id, unit_id, sequence, kind, title) VALUES (?, ?, 2, 'assignment', ?)", `ita_${i}`, `unt_${i}`, `Assignment ${i}`);
  await run(`INSERT INTO quiz_attempts (id, learning_item_id, user_id, answers_json, score, submitted_at, attempt)
             VALUES (?, ?, 'usr_amara', '[]', 0.91, ?, 1)`, `qa_${i}`, `itq_${i}`, `2026-06-0${(i % 9) + 1}T09:00:00Z`);
  await run(`INSERT INTO assignment_submissions (id, learning_item_id, user_id, status, grade, submitted_at, graded_at, attempt)
             VALUES (?, ?, 'usr_amara', 'graded', 0.89, ?, ?, 1)`,
  `as_${i}`, `ita_${i}`, `2026-06-0${(i % 9) + 1}T09:00:00Z`, `2026-06-1${i % 9}T09:00:00Z`);
}

// The examination. Authored and published by the Registrar, sat by the
// learner, read twice, and released — all through the shipped module.
const rubric = [
  { code: 'LIS', name: 'Listening', descriptor: 'Understands speech at natural pace.', weight: 0.25, skillId: 'skl_listening' },
  { code: 'REA', name: 'Reading', descriptor: 'Reads for argument and detail.', weight: 0.25, skillId: 'skl_reading' },
  { code: 'SPK', name: 'Speaking', descriptor: 'Speaks with control, in real time.', weight: 0.25, skillId: 'skl_speaking', spoken: true },
  { code: 'WRI', name: 'Writing', descriptor: 'Writes to a purpose and an audience.', weight: 0.25, skillId: 'skl_writing' },
];
const draft = await X.authorPaper(env, {
  actor: registrar, levelId: LEVEL, title: 'Level I Examination',
  conditions: 'Three hours. One sitting.', criteria: rubric,
});
await X.publishPaper(env, { actor: registrar, paperId: draft.id });
const paper = await X.paperFor(env, (await X.publishedPaperFor(env, LEVEL)).id);
const marksFor = (v) => paper.criteria.map((c, i) => ({ criterionId: c.id, mark: v[i] }));

/** THE FOURTH HANDOVER. The sitting belongs to the enrolled learner. */
const sitting = await X.enterCandidate(env, { actor: registrar, userId: 'usr_amara', levelId: LEVEL, at: '2026-07-01T09:00:00Z' });
check('...the learner enrolled by the payment is the one entered for the examination',
  sitting.userId === 'usr_amara' && sitting.levelId === LEVEL,
  JSON.stringify({ userId: sitting.userId, levelId: sitting.levelId }));

await X.openPaper(env, { user: { id: 'usr_amara' }, examinationId: sitting.id, at: '2026-07-02T08:00:00Z' });
await X.submitPaper(env, { user: { id: 'usr_amara' }, examinationId: sitting.id, at: '2026-07-02T10:00:00Z' });
await X.recordMarks(env, { actor: firstMarker, examinationId: sitting.id, role: 'first', marks: marksFor([88, 86, 87, 89]) });
await X.recordMarks(env, { actor: secondMarker, examinationId: sitting.id, role: 'second', marks: marksFor([87, 87, 86, 88]) });
await X.recordSpokenPaper(env, { actor: firstMarker, examinationId: sitting.id, passed: true });
const released = await X.release(env, { actor: registrar, examinationId: sitting.id });
check('...two markers read it and the Registrar releases it',
  Boolean(released), JSON.stringify(released).slice(0, 120));

const st1 = await standingRoute.onRequestGet({
  request: req('GET', `${BASE}/api/student/standing`, { token: TOKENS.amara }), env,
});
const st1Body = await st1.json();
const st1Level = (st1Body.levels || []).find((l) => l.levelId === LEVEL);
check('...and the learner\'s own standing page reports the sitting the Registrar released',
  st1.status === 200 && st1Level && st1Level.examination.released
  && st1Level.examination.released.examinationId === sitting.id,
  `status ${st1.status} ${JSON.stringify(st1Level && st1Level.examination && st1Level.examination.released)}`);
check('...against the enrolment the payment opened, and no other',
  st1Level && st1Level.enrolment.id === ENROLMENT_ID,
  st1Level && st1Level.enrolment.id);

// The two academic acts that are decisions rather than software: the
// skill mappings, and a member of staff confirming the level finished.
for (const [skill, item] of [
  ['skl_listening', 'itq_1'], ['skl_reading', 'itq_2'],
  ['skl_speaking', 'ita_1'], ['skl_writing', 'ita_2'],
]) {
  await run(`INSERT INTO assessment_skills (id, learning_item_id, skill_id, weight, status, approved_by, approved_at)
             VALUES (?, ?, ?, 1.0, 'approved', 'usr_registrar', '2026-07-05T09:00:00Z')`, `asx_${skill}`, item, skill);
}
const confirmDone = await completeLevelRoute.onRequestPost({
  request: req('POST', `${BASE}/api/lms/complete-level`, {
    token: TOKENS.first, body: { userId: 'usr_amara', levelId: LEVEL },
  }),
  env,
});
check('...a member of academic staff confirms the level finished, at the real route',
  confirmDone.status === 200, `status ${confirmDone.status} ${(await confirmDone.clone().text()).slice(0, 160)}`);
check('...which closes the enrolment the payment opened, and no other',
  one('SELECT status FROM enrolments WHERE id = ?', ENROLMENT_ID).status === 'completed');

// =====================================================================
// ACT IV · THE ADMINISTRATOR
// =====================================================================
// Governance C5: meeting the academic conditions is not, by itself,
// authority to confer — the Registrar also needs a real, independent
// confirmation on file, the same fixture an examiner's own review
// writes at /examiner-review.html.
await run(`INSERT INTO pass_list_entries (id, user_id, level_id, examiner_id, decision, created_at)
           VALUES ('ple_amara', 'usr_amara', ?, 'usr_examiner', 'confirmed', '2026-08-01T09:00:00Z')`, LEVEL);

const queueRes = await conferralRoute.onRequestGet({
  request: req('GET', `${BASE}/api/admin/conferral`, { token: TOKENS.registrar }), env,
});
const queueBody = await queueRes.json();
check('ACT IV · the Registrar\'s conferral queue carries the learner who did the work',
  queueRes.status === 200 && (queueBody.eligible || []).some((e) => e.userId === 'usr_amara'),
  `status ${queueRes.status} ${JSON.stringify((queueBody.eligible || []).map((e) => e.userId))}`);

const conferRes = await conferralRoute.onRequestPost({
  request: req('POST', `${BASE}/api/admin/conferral?action=confer`, {
    token: TOKENS.registrar,
    body: {
      userId: 'usr_amara', levelId: LEVEL, publicConsent: true,
      citation: 'For sustained control of the language under examination conditions.',
    },
  }),
  env,
});
const conferBody = await conferRes.json();
check('...and confers the award, at the route a Registrar actually uses',
  conferRes.status === 200 || conferRes.status === 201,
  `status ${conferRes.status} ${JSON.stringify(conferBody).slice(0, 200)}`);

/** THE FIFTH HANDOVER. */
const CODE = conferBody.award && conferBody.award.verificationCode;
check('...which returns a verification code', typeof CODE === 'string' && CODE.length > 0, String(CODE));
check('...naming the holder by the name their own account holds',
  conferBody.award && conferBody.award.holderName === 'Amara Bello',
  conferBody.award && conferBody.award.holderName);

const myAwards = await awardsRoute.onRequestGet({
  request: req('GET', `${BASE}/api/student/awards`, { token: TOKENS.amara }), env,
});
const myAwardsBody = await myAwards.json();
check('...and the learner\'s own awards page carries that same code',
  myAwards.status === 200 && JSON.stringify(myAwardsBody).includes(CODE),
  `status ${myAwards.status}`);

// =====================================================================
// ACT V · THE STRANGER, WHO HAS NOTHING BUT THE CODE
// =====================================================================
//
// No session, no account, no header. This is the promise the whole
// register exists to keep, and it is the last link in the chain: the
// value below came out of Act IV, which came out of Act III, which came
// out of the payment in Act II, which came out of the reference in
// Act I.
const vRes = await verifyRoute.onRequestGet({
  params: { code: CODE }, request: new Request(`${BASE}/api/verify/${CODE}`), env,
});
const vBody = await vRes.json();
check('ACT V · a stranger with no account verifies the code and it is valid',
  vRes.status === 200 && vBody.outcome === 'valid',
  `status ${vRes.status} ${JSON.stringify(vBody).slice(0, 160)}`);
check('...against a signature the College checks rather than recites',
  vBody.signature && vBody.signature.valid === true, JSON.stringify(vBody.signature));
check('...and it names the person who walked in through the application form',
  vBody.award && vBody.award.holderName === 'Amara Bello', vBody.award && vBody.award.holderName);

const regRes = await registerRoute.onRequestGet({ request: new Request(`${BASE}/api/register`), env });
const regBody = await regRes.json();
check('...and, with consent given at conferral, the public register lists them',
  regRes.status === 200 && (regBody.entries || []).some((e) => e.verificationCode === CODE),
  `status ${regRes.status} ${JSON.stringify((regBody.entries || []).map((e) => e.verificationCode))}`);

// =====================================================================
// THE CHAIN, STATED AS ONE ASSERTION
// =====================================================================
//
// Every link read back out of the database at the end, rather than
// trusted from the variables above. If any stage had quietly created a
// second identity, one of these joins returns nothing.
{
  const app = one('SELECT user_id, status FROM applications WHERE id = ?', REFERENCE);
  const pay = one('SELECT user_id, status FROM payments WHERE id = ?', PAYMENT_ID);
  const enr = one('SELECT user_id, application_id, status FROM enrolments WHERE id = ?', ENROLMENT_ID);
  const exam = one('SELECT user_id, level_id FROM level_examinations WHERE id = ?', sitting.id);
  const award = one('SELECT user_id, level_id, status FROM awards WHERE verification_code = ?', CODE);

  check('THE CHAIN HOLDS · one identity from the application form to the certificate',
    app.user_id === 'usr_amara'
    && pay.user_id === 'usr_amara'
    && enr.user_id === 'usr_amara'
    && exam.user_id === 'usr_amara'
    && award.user_id === 'usr_amara',
    JSON.stringify({ app: app.user_id, pay: pay.user_id, enr: enr.user_id, exam: exam.user_id, award: award.user_id }));

  check('...and every link points back at the one before it',
    enr.application_id === REFERENCE
    && exam.level_id === LEVEL
    && award.level_id === LEVEL,
    JSON.stringify({ enrApp: enr.application_id, examLevel: exam.level_id, awardLevel: award.level_id }));

  check('...ending in the states the story requires',
    app.status === 'enrolled' && pay.status === 'succeeded'
    && enr.status === 'completed' && award.status === 'conferred',
    JSON.stringify({ app: app.status, pay: pay.status, enr: enr.status, award: award.status }));
}

console.log(`\n${pass} passed, ${fail} failed.`);
if (fail) process.exit(1);
