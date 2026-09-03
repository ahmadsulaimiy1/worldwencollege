// Local harness for the Listening Lab browser test: serves the real
// static files and runs the REAL functions/_lib/lms/content.js against
// the REAL seeded curriculum. Not production code — production serves
// these endpoints through functions/api/lms/*.js on Cloudflare Pages.
// The point is that the page under test is driven by production logic
// and production data, not by fixtures.
// Minimal static + API server that runs the REAL content.js against the
// REAL seeded curriculum, so the page under test is driven by production
// logic and production data — not fixtures.
import { createServer } from 'node:http';
import { readFileSync, existsSync, statSync } from 'node:fs';
import { extname, join } from 'node:path';
import { DatabaseSync } from 'node:sqlite';
import { pathToFileURL } from 'node:url';

import { dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
const ROOT = dirname(dirname(dirname(fileURLToPath(import.meta.url))));
const sqlite = new DatabaseSync(':memory:');
sqlite.exec('PRAGMA foreign_keys=ON;');
sqlite.exec(readFileSync(`${ROOT}/sql/schema.sql`, 'utf8'));
for (let n = 1; n <= 6; n++) sqlite.exec(readFileSync(`${ROOT}/sql/seed-curriculum-level-${n}.sql`, 'utf8'));
for (let n = 1; n <= 6; n++) { const p = `${ROOT}/sql/seed-audio-level-${n}.sql`; if (existsSync(p)) sqlite.exec(readFileSync(p, 'utf8')); }
sqlite.exec(`INSERT INTO users (id, auth_provider, auth_provider_id, email, role) VALUES ('usr_demo','clerk','sub_demo','demo@example.com','student')`);
sqlite.exec(`INSERT INTO users (id, auth_provider, auth_provider_id, email, role) VALUES ('usr_tutor','clerk','sub_tutor','tutor@example.com','staff')`);
sqlite.exec(`INSERT INTO users (id, auth_provider, auth_provider_id, email, role) VALUES ('usr_admin','clerk','sub_admin','admin@example.com','admin')`);
// FIVE OF THE SIX, AND WHICH ONE IS LEFT OUT IS LOAD-BEARING.
//
// A learner enrolled on every level has nothing to buy, so the checkout
// on /my-account.html would have no offer to render and the browser
// suite would assert against an empty grid. One level therefore stays
// unbought.
//
// It is LEVEL V and not Level VI. functions/_lib/lms/content.js opens a
// module only for a level the learner holds, and the Listening Lab's
// hardest assertion is the C2 capstone — unt_l6_m10, ten cues, the most
// demanding thing the lab renders. Leaving Level VI unbought silently
// emptied that page and the lab suite timed out waiting for a cue that
// could never arrive. Nothing said why; it simply hung.
const UNBOUGHT_LEVEL = 5;
for (let n = 1; n <= 6; n++) {
  if (n === UNBOUGHT_LEVEL) continue;
  sqlite.exec(`INSERT INTO enrolments (id,user_id,level_id,status,started_at) VALUES ('enr_${n}','usr_demo',${n},'active','2026-01-01T00:00:00.000Z')`);
}
// Mirror the LIVE database, not the convenient one: enrolment_events was
// ADDED to an existing database (migration 002, 3 Aug 2026), so the
// audit record begins mid-story and the page has to say so. A harness
// built from schema.sql alone would report a complete record and the
// browser test would never see the sentence that matters.
sqlite.exec(`INSERT INTO schema_migrations (filename, applied_at, method)
  VALUES ('002-enrolment-integrity.sql','2026-08-03T12:15:21.000Z','applied')`);

// Learners in the states the study plan has to handle. usr_demo covers
// the happy path; these two cover the ones a real platform spends its
// first months in and which a single fixture would never reach.
sqlite.exec(`INSERT INTO users (id, auth_provider, auth_provider_id, email, role) VALUES ('usr_prog','clerk','sub_prog','midway@example.com','student')`);
sqlite.exec(`INSERT INTO users (id, auth_provider, auth_provider_id, email, role) VALUES ('usr_none','clerk','sub_none','unenrolled@example.com','student')`);
sqlite.exec(`INSERT INTO enrolments (id,user_id,level_id,status,started_at) VALUES ('enr_prog_1','usr_prog',1,'active','2026-01-01T00:00:00.000Z')`);
{
  const units = sqlite.prepare(
    `SELECT u.id FROM units u JOIN courses c ON c.id = u.course_id WHERE c.level_id = 1 ORDER BY u.sequence ASC LIMIT 2`,
  ).all();
  if (units[0]) sqlite.exec(`INSERT INTO unit_progress (id,user_id,unit_id,status,completed_at) VALUES ('uprg_p1','usr_prog','${units[0].id}','completed','2026-02-01T00:00:00.000Z')`);
  if (units[1]) sqlite.exec(`INSERT INTO unit_progress (id,user_id,unit_id,status) VALUES ('uprg_p2','usr_prog','${units[1].id}','in_progress')`);
}

const { makeD1 } = await import(pathToFileURL(`${ROOT}/tests/d1-shim.mjs`));
const env = { DB: makeD1FromExisting() };
// NO GATEWAY BY DEFAULT, because that is the platform's actual state:
// no STRIPE_SECRET_KEY is provisioned anywhere, `configuredGateways()`
// answers an empty list, and /my-account.html is supposed to say the
// College is not taking cards rather than draw a button that 503s.
// LAB_GATEWAY=1 provisions a fake key so the paying journey can also be
// driven end to end — see /__demo-gateway below, which stands in for
// the bank and for the webhook that follows it.
if (process.env.LAB_GATEWAY) env.STRIPE_SECRET_KEY = 'sk_test_harness';
function makeD1FromExisting() {
  // reuse the shim's wrapper over our already-seeded database
  const shim = makeD1('');           // empty schema; we swap the handle
  return new Proxy(shim, { get(t, k) { return k === '__db' ? sqlite : wrap(k); } });
}
function wrap(k) {
  return (...args) => {
    if (k !== 'prepare') throw new Error('unsupported: ' + k);
    const stmt = sqlite.prepare(args[0]);
    let bound = [];
    const api = {
      bind: (...b) => { bound = b; return api; },
      first: async () => stmt.get(...bound) ?? null,
      all: async () => ({ results: stmt.all(...bound) }),
      run: async () => { const r = stmt.run(...bound); return { meta: { changes: r.changes } }; },
    };
    return api;
  };
}

const content = await import(pathToFileURL(`${ROOT}/functions/_lib/lms/content.js`));
const adminEnrol = await import(pathToFileURL(`${ROOT}/functions/_lib/admin/enrolments.js`));
const adminRoles = await import(pathToFileURL(`${ROOT}/functions/_lib/admin/roles.js`));
const studyPlan = await import(pathToFileURL(`${ROOT}/functions/_lib/student/study-plan.js`));
const timeOnTask = await import(pathToFileURL(`${ROOT}/functions/_lib/lms/time-on-task.js`));
const registry = await import(pathToFileURL(`${ROOT}/functions/_lib/registry/awards.js`));
const profile = await import(pathToFileURL(`${ROOT}/functions/_lib/registry/profile.js`));
const qr = await import(pathToFileURL(`${ROOT}/functions/_lib/registry/qr.js`));
const instVerify = await import(pathToFileURL(`${ROOT}/functions/_lib/registry/institutional-verification.js`));
const distinctions = await import(pathToFileURL(`${ROOT}/functions/_lib/registry/distinctions.js`));
const documents = await import(pathToFileURL(`${ROOT}/functions/_lib/registry/documents.js`));
const conferralLib = await import(pathToFileURL(`${ROOT}/functions/_lib/registry/conferral.js`));
const agreementLib = await import(pathToFileURL(`${ROOT}/functions/_lib/academic/marker-agreement.js`));
// Beats reaching the harness, so a browser test can assert the beacon
// actually fires rather than that the file merely loads.
const beats = [];
// The harness acts as an ADMINISTRATOR so the appointment controls are
// exercised; the role check itself has its own unit tests.
const ADMIN_ACTOR = { id: 'usr_admin', role: 'admin', email: 'admin@example.com' };

// DEMONSTRATION awards, conferred here and nowhere else. No award may be
// conferred in production until the Executive adopts the award
// architecture (governance C4), so the live Register ships EMPTY and
// this harness is the only place a record exists. The names are
// invented — the same rule as sql/seed-demo-people.sql, stated at length
// there.
const DEMO = {};
{
  const conf = (opts) => registry.conferAward(env, {
    credits: 20, tqtHours: 200, ...opts,
  });
  DEMO.valid = await conf({
    userId: 'usr_demo', levelId: 3, holderName: 'Demonstration Graduate',
    awardTitle: 'English Associate of Worldwide English College', postNominal: 'AsWEC',
    cefr: 'B1', honour: 'distinction', publicConsent: true,
    citation: 'In recognition of a structured presentation delivered and defended under questioning.',
  });
  DEMO.revokedSrc = await conf({
    userId: 'usr_prog', levelId: 2, holderName: 'Withdrawn Demonstration',
    awardTitle: 'English Candidate of Worldwide English College', postNominal: 'CnWEC', cefr: 'A2',
  });
  await registry.revokeAward(env, { awardId: DEMO.revokedSrc.id, reason: 'Conferred in error during a demonstration.' });
  DEMO.replacedSrc = await conf({
    userId: 'usr_none', levelId: 1, holderName: 'Corrected Demonstratoin',
    awardTitle: 'English Aspirant of Worldwide English College', postNominal: 'ApWEC', cefr: 'A1',
  });
  DEMO.replacement = (await registry.replaceAward(env, {
    awardId: DEMO.replacedSrc.id, reason: 'Holder name corrected.',
    changes: { holderName: 'Corrected Demonstration' },
  })).replacement;

  // Entries for the browsable roll. Deliberately spread across levels —
  // the register's central claim is that it holds award holders at every
  // level and not only Laureates, and a fixture with one level in it
  // could not tell a working page from a broken one.
  //
  // `usr_demo` already holds a Level III award above, so these use the
  // other demonstration learners: one live conferral per person per
  // level is enforced by a partial unique index, not by convention.
  DEMO.listed = [];
  const ROLL = [
    ['usr_none', 6, 'English Laureate of Worldwide English College', 'LrWEC', 'C2', 'Laureate Demonstration', 'college_distinction'],
    ['usr_prog', 4, 'English Fellow of Worldwide English College', 'FlWEC', 'B2', 'Fellow Demonstration', 'merit'],
    ['usr_tutor', 1, 'English Aspirant of Worldwide English College', 'ApWEC', 'A1', 'Aspirant Demonstration', 'pass'],
  ];
  for (let i = 0; i < ROLL.length; i++) {
    const [userId, levelId, awardTitle, postNominal, cefr, holderName, honour] = ROLL[i];
    DEMO.listed.push(await conf({
      userId, levelId, awardTitle, postNominal, cefr, holderName, honour, publicConsent: true,
    }));
  }
  // Not listed, and must stay unlisted. Without one of these the consent
  // assertion on the page would be checking that a filter does not
  // remove rows nothing was asking it to remove.
  // A published profile and a shared link, so the graduate record page
  // can be driven the way a real reader reaches it.
  await profile.updateProfile(env, { userId: 'usr_demo', changes: {
    handle: 'demonstration-graduate', displayName: 'Demonstration Graduate',
    headline: 'Demonstration record — not a real graduate',
    biography: 'This profile is demonstration data used to develop and test the graduate record. It does not describe a real person.',
    isPublic: true, transcript: true,
  } });
  env.DB.prepare(`INSERT INTO cpd_records (id,user_id,title,provider,kind,hours,completed_on,verified_at)
    VALUES ('cpd_v','usr_demo','A verified workshop','Demonstration Provider','workshop',6,'2027-07-01','2027-07-05T00:00:00.000Z')`).bind().run();
  env.DB.prepare(`INSERT INTO cpd_records (id,user_id,title,provider,kind,hours,completed_on)
    VALUES ('cpd_d','usr_demo','A self-declared conference','Demonstration Provider','conference',3,'2027-08-01')`).bind().run();
  // The two sections added with the Digital Academic Identity, so the
  // page renders them against real module output rather than the
  // browser suite proving only that hidden sections stay hidden.
  //
  // Skills are deliberately left UNMAPPED — no assessment_skills rows —
  // because that is the state the platform is actually in, and it is
  // the state the page most needs to get right.
  await profile.updateProfile(env, { userId: 'usr_demo', changes: {
    skills: true, distinctions: true,
  } });
  const approved = await distinctions.propose(env, {
    userId: 'usr_demo', kind: 'presentation',
    title: 'Presented at the demonstration colloquium',
    summary: 'Demonstration data. Not a record of a real presentation by a real person.',
    awardedOn: '2027-06-14', awardedBy: 'Worldwide English College',
  });
  await distinctions.approve(env, { id: approved.id, approvedBy: 'usr_admin' });
  // One withdrawn and one still proposed: the page must show the first
  // marked, and must not show the second at all.
  const gone = await distinctions.propose(env, {
    userId: 'usr_demo', kind: 'prize', title: 'A demonstration prize', awardedOn: '2027-05-01',
  });
  await distinctions.approve(env, { id: gone.id, approvedBy: 'usr_admin' });
  await distinctions.withdraw(env, { id: gone.id, reason: 'Demonstration withdrawal, to exercise the withdrawn state.' });
  await distinctions.propose(env, {
    userId: 'usr_demo', kind: 'leadership', title: 'An unapproved demonstration claim', awardedOn: '2027-04-01',
  });

  DEMO.share = await profile.createShare(env, {
    userId: 'usr_demo', sections: ['awards', 'transcript', 'cpd'], days: 30, label: 'Demonstration share',
  });

  DEMO.unlisted = await conf({
    userId: 'usr_prog', levelId: 5, holderName: 'Unlisted Demonstration',
    awardTitle: 'English Scholar of Worldwide English College', postNominal: 'ScWEC', cefr: 'C1',
  });
}
// ── THE WEEK, for /my-week/ ───────────────────────────────────────────
// A feed is only interesting when it holds more than one KIND of thing
// at more than one time, and a booking list is only interesting when it
// holds an hour that is open, one that is full and one already held.
// The harness builds exactly that, so the page is exercised against the
// real timetable module rather than against a single tidy row.
{
  // A zone, so the two-clock rule has something to be true about. With
  // no row the module falls back to UTC and says so — a real state, but
  // the one that hides the conversion.
  sqlite.exec(`INSERT INTO student_settings (user_id, time_zone) VALUES ('usr_demo', 'Asia/Dubai')`);

  const soon = (days, hours, mins) => new Date(
    Date.now() + days * 86400000 + hours * 3600000 + mins * 60000,
  ).toISOString().replace(/\.\d{3}Z$/, 'Z');

  // Two classes at levels usr_demo is enrolled at.
  sqlite.prepare(
    `INSERT INTO live_sessions (id, level_id, unit_id, title, starts_at, duration_minutes, join_url, host_user_id)
     VALUES (?, ?, NULL, ?, ?, ?, ?, ?)`,
  ).run('lvs_demo_1', 1, 'Speaking clinic — the demonstration hour', soon(2, 3, 17), 60,
    'https://example.com/join/demo1', 'usr_tutor');
  sqlite.prepare(
    `INSERT INTO live_sessions (id, level_id, unit_id, title, starts_at, duration_minutes, join_url, host_user_id)
     VALUES (?, ?, NULL, ?, ?, ?, ?, ?)`,
  ).run('lvs_demo_2', 3, 'Listening workshop — the demonstration hour', soon(5, 1, 43), 45,
    'https://example.com/join/demo2', 'usr_tutor');

  const slot = (id, opts) => sqlite.prepare(
    `INSERT INTO tutorial_slots (id, tutor_id, live_session_id, level_id, unit_id, title, kind,
       starts_at, duration_minutes, capacity, join_url, status)
     VALUES (?, 'usr_tutor', NULL, ?, NULL, ?, ?, ?, 30, ?, NULL, 'open')`,
  ).run(id, opts.levelId, opts.title, opts.kind || 'tutorial', opts.startsAt, opts.capacity || 1);

  slot('slt_demo_open', { levelId: 1, title: 'Pronunciation tutorial', startsAt: soon(3, 2, 23), capacity: 2 });
  slot('slt_demo_full', { levelId: 1, title: 'Oral defence rehearsal', startsAt: soon(4, 4, 11), capacity: 1 });
  sqlite.exec(`INSERT INTO slot_bookings (id, slot_id, user_id, status, booked_at)
    VALUES ('bkg_demo_other', 'slt_demo_full', 'usr_prog', 'booked', '2026-08-01T00:00:00.000Z')`);
  slot('slt_demo_office', { levelId: null, title: 'Open office hour', kind: 'office_hour', startsAt: soon(6, 5, 31), capacity: 4 });
  // One the learner already holds, so the feed has a tutorial in it and
  // the list has an hour marked as theirs.
  slot('slt_demo_mine', { levelId: 1, title: 'Writing tutorial', startsAt: soon(7, 3, 47), capacity: 1 });
  sqlite.exec(`INSERT INTO slot_bookings (id, slot_id, user_id, status, booked_at)
    VALUES ('bkg_demo_mine', 'slt_demo_mine', 'usr_demo', 'booked', '2026-08-01T00:00:00.000Z')`);
}

// ── WORK WAITING TO BE MARKED, for /staff-marking/ ────────────────────
// Three submissions, and each one is there to make a different failure
// visible if it ever comes back:
//
//   · Two learners, submitted eighteen days apart and inserted
//     NEWEST FIRST, so a queue that forgot to sort returns them in the
//     wrong order and the suite sees it.
//   · A resit — a second attempt on a task the same learner was already
//     marked on — so the console has to carry the earlier mark and its
//     feedback rather than presenting the work as a first attempt.
//   · A submission already marked, which must not appear in the queue
//     of work awaiting a mark and must appear when the marker asks for
//     what has been marked.
{
  const sub = (id, item, user, at, opts = {}) => sqlite.prepare(
    `INSERT INTO assignment_submissions (id, learning_item_id, user_id, content, status, attempt,
       submitted_at, grade, feedback, graded_at, graded_by)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
  ).run(id, item, user, opts.content || 'A demonstration submission written by the learner.',
    opts.status || 'submitted', opts.attempt || 1, at,
    opts.grade ?? null, opts.feedback ?? null, opts.gradedAt ?? null, opts.gradedBy ?? null);

  sub('asub_recent', 'itm_l1_m2_assignment', 'usr_prog', '2026-08-19T09:00:00.000Z', {
    content: 'My room is small and there is one window in it. The bed is under the window and my desk is beside the door.\n\nI like it in the morning because the light comes in early, and it is quiet.',
  });
  sub('asub_oldest', 'itm_l1_m1_assignment', 'usr_demo', '2026-08-01T09:00:00.000Z', {
    content: 'My name is A. Student and I am from Kuala Lumpur. I work in a hotel and I speak Malay and some English.\n\nI am learning English because I want to talk to the guests without being afraid of it.',
  });
  // The resit, and the attempt it is a resit of.
  sub('asub_first_go', 'itm_l1_m3_assignment', 'usr_demo', '2026-07-10T09:00:00.000Z', {
    attempt: 1, status: 'graded', grade: 0.58, gradedAt: '2026-07-14T10:00:00.000Z', gradedBy: 'usr_tutor',
    feedback: 'The sequence of the day is clear and the vocabulary is right. What is holding the mark down is the past tense: eleven verbs in the second half are in the present.',
    content: 'Every day I wake up at six and I go to work at seven.',
  });
  sub('asub_resit', 'itm_l1_m3_assignment', 'usr_demo', '2026-08-16T09:00:00.000Z', {
    attempt: 2,
    content: 'Yesterday I woke at six and went to work at seven. I finished at four and walked home along the river because the weather was good.\n\nIn the evening I studied for one hour and then I cooked.',
  });
}

// ── MONEY, for /my-account/ ───────────────────────────────────────────
// The statement of account is the first item of the interface backlog
// and the hardest thing to fixture honestly: a balance is only
// interesting when it is made of several charges struck at different
// times, one of them discounted, one of them refunded and one of them
// still owed. So the harness builds exactly that rather than a single
// tidy payment, and the page is driven by the REAL finance module
// reading the REAL rows.
const finance = await import(pathToFileURL(`${ROOT}/functions/_lib/student/finance.js`));
const payOptions = await import(pathToFileURL(`${ROOT}/functions/_lib/payments/options.js`));
const payConfirm = await import(pathToFileURL(`${ROOT}/functions/_lib/payments/confirmation.js`));
const instalments = await import(pathToFileURL(`${ROOT}/functions/_lib/payments/instalments.js`));
const checkoutLib = await import(pathToFileURL(`${ROOT}/functions/_lib/payments/checkout.js`));
const standingLib = await import(pathToFileURL(`${ROOT}/functions/_lib/academic/standing.js`));
const timetableLib = await import(pathToFileURL(`${ROOT}/functions/_lib/lms/timetable.js`));
const achievementsLib = await import(pathToFileURL(`${ROOT}/functions/_lib/academic/achievements.js`));
{
  // A second live currency, so the two-currency rule has something to
  // be true about. USD is the ledger; GBP is switched on with a rate
  // and a date, which is what `presentAmount()` needs before it will
  // report a learner figure at all.
  sqlite.exec(`UPDATE currencies SET is_active = 1, fx_rate_to_usd = 0.79,
    fx_rate_source = 'harness', fx_rate_as_of = '2026-08-01T00:00:00.000Z' WHERE code = 'GBP'`);

  const pay = (id, opts) => {
    const cols = Object.assign({
      user_id: 'usr_demo', kind: 'single_level', level_id: null, amount_cents: null,
      currency: 'USD', amount_usd_cents: null, provider: 'stripe', status: 'succeeded',
      created_at: '2026-03-01T10:00:00.000Z', confirmed_at: '2026-03-01T10:02:00.000Z',
      promo_code: null, scholarship_id: null, instalment_plan_id: null, failure_reason: null,
    }, opts);
    if (cols.amount_cents === null) cols.amount_cents = cols.amount_usd_cents;
    const keys = Object.keys(cols);
    sqlite.prepare(
      `INSERT INTO payments (id, ${keys.join(', ')}) VALUES (?, ${keys.map(() => '?').join(', ')})`,
    ).run(id, ...keys.map((k) => cols[k]));
  };

  // Level I, paid in full and receipted.
  pay('pay_demo_l1', { level_id: 1, amount_usd_cents: 316667 });
  sqlite.exec(`INSERT INTO receipts (id, payment_id, receipt_number, issued_at)
    VALUES ('rcp_demo_l1', 'pay_demo_l1', 'WEC-R-000001', '2026-03-01T10:03:00.000Z')`);

  // Level II, paid under a scholarship, so relief is MEASURED — the
  // difference between the price struck and the amount charged — rather
  // than asserted anywhere.
  sqlite.exec(`INSERT INTO scholarships (id, user_id, kind, value, approved_by, notes, created_at)
    VALUES ('sch_demo', 'usr_demo', 'percent', 25, 'usr_admin',
            'Demonstration award, granted by the harness.', '2026-03-10T00:00:00.000Z')`);
  // TAKEN IN STERLING, deliberately. The module derives the learner's
  // own currency from the charges on their account, so with every row
  // in USD `presentAmount()` reports no learner figure at all and the
  // two-currency rule the page is built on would never be exercised.
  // £1,876.25 at the harness rate of 0.79 is the $2,375.00 struck.
  pay('pay_demo_l2', {
    level_id: 2, amount_usd_cents: 237500, amount_cents: 187625, currency: 'GBP',
    scholarship_id: 'sch_demo',
    created_at: '2026-04-01T10:00:00.000Z', confirmed_at: '2026-04-01T10:02:00.000Z',
  });
  sqlite.exec(`INSERT INTO receipts (id, payment_id, receipt_number, issued_at)
    VALUES ('rcp_demo_l2', 'pay_demo_l2', 'WEC-R-000002', '2026-04-01T10:03:00.000Z')`);

  // Level III, attempted and declined. A failure with its reason on it,
  // because "it failed" and "the card was declined" are different facts
  // and only the second tells a learner whether to try the same card.
  pay('pay_demo_l3', {
    level_id: 3, amount_usd_cents: 316667, status: 'failed', confirmed_at: null,
    failure_reason: 'The card issuer declined the charge.',
    created_at: '2026-05-01T10:00:00.000Z',
  });

  // And a refund that has actually moved money, so the fourth term of
  // the identity is not always zero.
  sqlite.exec(`INSERT INTO refunds (id, payment_id, amount_cents, reason, status, created_at)
    VALUES ('ref_demo', 'pay_demo_l1', 5000, 'Demonstration refund, to exercise the fourth term.',
            'processed', '2026-06-01T00:00:00.000Z')`);

  // An instalment plan mid-flight, so the schedule shows paid, next and
  // scheduled together.
  sqlite.exec(`INSERT INTO instalment_plans (id, user_id, level_id, total_amount_usd_cents, instalment_count, status)
    VALUES ('ipl_demo', 'usr_demo', 4, 316667, 4, 'active')`);
  pay('pay_demo_i1', {
    kind: 'instalment', level_id: 4, amount_usd_cents: 79167, instalment_plan_id: 'ipl_demo',
    created_at: '2026-07-01T10:00:00.000Z', confirmed_at: '2026-07-01T10:02:00.000Z',
  });
}

// ── ADMISSIONS, for /admissions/track/ ────────────────────────────────
// The tracking page is the one surface a person reaches BEFORE they are
// a learner, so the harness has to be able to be an applicant as well as
// a student. Driven by the real lifecycle module against real rows: a
// fixture payload would prove the page renders JSON and nothing about
// whether the endpoint produces that JSON.
const lifecycle = await import(pathToFileURL(`${ROOT}/functions/_lib/admissions/lifecycle.js`));
const DEMO_APPS = {};
{
  const mk = async (key, name) => {
    // REFERENCE_SHAPE demands app_ plus sixteen characters at least, so
    // these are padded to it rather than being the shortest thing that
    // reads well. A fixture that cannot pass the platform's own bearer
    // check would test the refusal path and call it the happy one.
    const id = ('app_' + key + 'demonstration').padEnd(24, '0');
    sqlite.exec(`INSERT INTO applications (id, full_name, email, country, source, status, created_at, updated_at)
      VALUES ('${id}', '${name}', '${key}@example.com', 'GB', 'website', 'submitted',
              '2026-08-01T09:00:00.000Z', '2026-08-01T09:00:00.000Z')`);
    return sqlite.prepare('SELECT * FROM applications WHERE id = ?').get(id);
  };

  // One at each state a reader can actually land on. Three, because the
  // page renders three genuinely different things — an application with
  // nothing to answer, one with a live offer, and one that is closed —
  // and a single fixture could not tell a working page from a broken one.
  DEMO_APPS.submitted = await mk('sub', 'Demonstration Applicant');

  const placement = await mk('plc', 'Placement Demonstration');
  await lifecycle.transitionApplication(env, {
    application: placement, to: 'placement_pending', party: 'staff', actor: ADMIN_ACTOR,
    channel: 'queue', reason: 'Placement conversation being arranged.',
  });
  DEMO_APPS.placement = placement;

  const offered = await mk('ofr', 'Offer Demonstration');
  await lifecycle.transitionApplication(env, {
    application: offered, to: 'placement_pending', party: 'staff', actor: ADMIN_ACTOR,
    channel: 'queue', reason: 'Placement conversation held.',
  });
  await lifecycle.issueOffer(env, {
    actor: ADMIN_ACTOR, applicationId: offered.id, levelId: 2, kind: 'conditional',
    conditions: 'Demonstration condition: confirm the spelling of your name as it should appear on the award.',
    // Inside `MAX_OFFER_DAYS`, computed rather than pinned: a fixture
    // with a hard-coded date is a fixture that fails on a Tuesday in a
    // year nobody was thinking about, and this one already did.
    expiresAt: new Date(Date.now() + 300 * 86400 * 1000).toISOString(),
    reason: 'Demonstration offer, issued by the browser harness.',
  });
  DEMO_APPS.offered = offered;
}

// ── THE DESK, for /my-desk/ ───────────────────────────────────────────
// Notices and correspondence, written through the REAL modules rather
// than inserted as rows: createAnnouncement() packs the two editions
// into two columns in a format only that function knows, and a fixture
// that wrote the columns by hand would prove the page can render a
// string this repository never actually stores.
//
// Names are set here because both payloads deliberately withhold email
// addresses and carry `preferred_name` instead — with none set, every
// party on the page would fall back to its office and the test could
// not tell "the tutor" from "no name at all".
const announcementsLib = await import(pathToFileURL(`${ROOT}/functions/_lib/comms/announcements.js`));
const threadsLib = await import(pathToFileURL(`${ROOT}/functions/_lib/comms/threads.js`));
const DEMO_DESK = {};
{
  sqlite.exec(`UPDATE users SET preferred_name = 'Demonstration Learner' WHERE id = 'usr_demo'`);
  sqlite.exec(`UPDATE users SET preferred_name = 'Demonstration Tutor'   WHERE id = 'usr_tutor'`);
  sqlite.exec(`UPDATE users SET preferred_name = 'Demonstration Registrar' WHERE id = 'usr_admin'`);

  const say = (body) => announcementsLib.createAnnouncement(env, { actor: ADMIN_ACTOR, body });

  // Institution-wide, pinned, and published in both languages — the
  // notice that proves an edition can be chosen rather than fallen back
  // to.
  DEMO_DESK.pinned = await say({
    audienceScope: 'institution', status: 'published', pinned: true,
    language: 'en',
    title: 'Michaelmas examination timetable',
    body: 'The examination timetable for the coming session is settled and each level sits on its own day.\n\nYour own dates appear on My Week as soon as they are entered against your enrolment.',
    translation: {
      language: 'ar',
      title: 'جدول امتحانات الفصل',
      body: 'استقرّ جدول امتحانات الجلسة القادمة، ويجلس كلُّ مستوًى في يومه.\n\nوتظهر مواعيدك أنت في «أسبوعي» بمجرّد قيدها على تسجيلك.',
    },
  });

  // Level II, English only. The Arabic reading of this page must say so
  // rather than showing an English notice under an Arabic heading.
  DEMO_DESK.level = await say({
    audienceScope: 'level', levelId: 2, status: 'published',
    language: 'en',
    title: 'Level II — the spoken paper moves to the second week',
    body: 'The spoken paper for Level II is now sat in the second week of the assessment window rather than the first.',
  });

  // To one learner, and to this one. The narrowest gate on the plate.
  DEMO_DESK.mine = await say({
    audienceScope: 'learner', audienceUserId: 'usr_demo', status: 'published',
    language: 'en',
    title: 'Your transcript request has been actioned',
    body: 'The transcript you asked for has been prepared and is on My Record.',
    translation: {
      language: 'ar',
      title: 'نُفِّذ طلبُك للسجلّ الأكاديمي',
      body: 'أُعِدّ السجلُّ الذي طلبتَه، وهو في «سجلّي».',
    },
  });

  // One already read and put away, so the page has something to hide
  // and a toggle to show it with.
  DEMO_DESK.away = await say({
    audienceScope: 'institution', status: 'published',
    language: 'en',
    title: 'Library opening hours over the vacation',
    body: 'The reading rooms keep shortened hours through the vacation. The digital library is unaffected.',
  });
  await announcementsLib.markRead(env, {
    user: { id: 'usr_demo' }, announcementId: DEMO_DESK.away.id, dismissed: true,
  });

  // THE NEGATIVE FIXTURES, and they are the point of the plate. One
  // notice addressed to a different learner and one still in draft. If
  // either ever appears on this page the audience test has stopped
  // being part of the query.
  DEMO_DESK.notMine = await say({
    audienceScope: 'learner', audienceUserId: 'usr_prog', status: 'published',
    language: 'en',
    title: 'A notice addressed to somebody else',
    body: 'If this sentence is ever visible on the demonstration learner’s desk, ADDRESSED_TO has been rewritten as a filter.',
  });
  DEMO_DESK.draft = await say({
    audienceScope: 'institution', status: 'draft',
    language: 'en',
    title: 'An unpublished draft',
    body: 'A draft is not a notice. If this is visible, status has stopped being read.',
  });

  const LEARNER = { id: 'usr_demo', role: 'student' };
  const TUTOR = { id: 'usr_tutor', role: 'staff' };

  // A conversation with a reply in it, so the thread plate has two
  // sides and the learner has something unread.
  const asked = await threadsLib.openThread(env, {
    user: LEARNER,
    body: {
      recipient: 'tutors', scope: 'level', levelId: 2,
      subject: 'The second conditional in Unit 7',
      body: 'I can hear the difference between the two forms but I cannot produce the second one under time pressure. Is there a drill you would recommend before the spoken paper?',
    },
  });
  await threadsLib.replyToThread(env, {
    user: TUTOR,
    threadId: asked.thread.id,
    body: { body: 'There is — the substitution drill in the Unit 7 laboratory, three passes at half speed before you attempt it at pace. Bring the recording to the tutorial and we will listen to it together.' },
  });
  DEMO_DESK.thread = asked.thread.id;

  // A closed one, so the page has a refusal to render rather than a
  // reply box that fails on submission.
  const closed = await threadsLib.openThread(env, {
    user: LEARNER,
    body: {
      recipient: 'registrar', scope: 'level', levelId: 1,
      subject: 'Confirming the spelling of my name on the award',
      body: 'Please confirm the spelling that will be printed, as two of my documents disagree.',
    },
  });
  const closedId = closed.thread.id;
  sqlite.exec(`UPDATE message_threads
                  SET status = 'closed', closed_by = 'usr_admin',
                      closed_at = '2026-08-15T09:00:00.000Z',
                      closed_reason = 'Answered on the record and the spelling is confirmed.'
                WHERE id = '${closedId}'`);
  DEMO_DESK.closed = closedId;
}

// ── THE CASES, for /my-cases/ ─────────────────────────────────────────
// Four cases, because the page renders four genuinely different things
// and a single fixture could not tell a working page from a broken one:
// one just received and waiting on the acknowledgement clock, one at
// stage one, one answered and therefore escalable, and one already
// closed. Driven through the real module — a case inserted as a row
// would carry no trail, and the trail is the part of this page that
// makes E2 checkable rather than merely stated.
const casesLib = await import(pathToFileURL(`${ROOT}/functions/_lib/registrar/cases.js`));
const DEMO_CASES = {};
{
  const LEARNER = { id: 'usr_demo', role: 'student' };

  DEMO_CASES.received = (await casesLib.openCase(env, {
    actor: LEARNER, kind: 'deferral', matter: 'welfare',
    summary: 'A pause of six months while I am caring for a relative',
    detail: 'I need to stop for about six months and come back to the same level with the marks I have.\n\nI am not asking for anything to be re-marked and nothing has gone wrong; I simply cannot keep the hours at present.',
    levelId: 2,
  })).reference;

  const atStageOne = await casesLib.openCase(env, {
    actor: LEARNER, kind: 'appeal', matter: 'academic',
    summary: 'The Unit 7 speaking mark against the published rubric',
    detail: 'The rubric published before the task lists fluency, range, accuracy and interaction. My feedback discusses only accuracy, and the mark given is below the band my recording sits in on the other three.\n\nI am asking for the mark to be looked at against the rubric that was published.',
    levelId: 2,
  });
  await casesLib.advanceStage(env, {
    actor: ADMIN_ACTOR, caseId: atStageOne.id, toStage: 'stage_one',
    note: 'Acknowledged and passed to a member of academic staff senior to, and other than, the marker.',
  });
  DEMO_CASES.stageOne = atStageOne.reference;

  // Answered at stage one, so the page has an outcome to render, the
  // consequences that outcome sets in motion, and — the point of this
  // fixture — a live offer of escalation the learner alone may take.
  const answered = await casesLib.openCase(env, {
    actor: LEARNER, kind: 'complaint', matter: 'administrative',
    summary: 'A tutorial hour cancelled twice with no notice',
    detail: 'The tutorial was withdrawn twice in three weeks and on neither occasion was I told before the hour itself.',
    levelId: 1,
  });
  await casesLib.advanceStage(env, {
    actor: ADMIN_ACTOR, caseId: answered.id, toStage: 'stage_one',
    note: 'Acknowledged and passed for review.',
  });
  await casesLib.recordDecision(env, {
    actor: ADMIN_ACTOR, actorRole: casesLib.POSTS.stage_one, caseId: answered.id,
    outcome: 'partly_upheld',
    decision: 'The two withdrawals happened and no notice was given, which should not have happened and is upheld.\n\nThe hours were withdrawn by the tutor rather than lost, and both were re-offered inside the same fortnight, so the part of the complaint that says the teaching was not delivered is not upheld.',
    note: 'Reviewed against the tutorial records and the tutor’s own account.',
  });
  DEMO_CASES.answered = answered.reference;

  const closed = await casesLib.openCase(env, {
    actor: LEARNER, kind: 'transfer', matter: 'academic',
    summary: 'Moving from Level I to Level II before the assessment window',
    detail: 'I would like to be placed at Level II instead, on the strength of the placement conversation.',
    levelId: 1,
  });
  await casesLib.withdrawCase(env, {
    actor: LEARNER, caseId: closed.id,
    reason: 'Answered in a tutorial: the placement already put me at Level II, so there is nothing to transfer.',
  });
  DEMO_CASES.closed = closed.reference;
}

// ── THE ENGAGEMENT RECORD, for /my-engagement/ ────────────────────────
// The demonstration learner's enrolment starts in January, which gives
// the grid a long anchor to count windows from — but with no evidence
// in it every cell would be `absent` and the page would prove only that
// it can draw one state. So three windows are given something to read:
// time on task, an assessment attempt, and a staff correction with the
// platform's own reading of the same window left standing beside it.
const attendanceLib = await import(pathToFileURL(`${ROOT}/functions/_lib/academic/attendance.js`));
const progressionLib = await import(pathToFileURL(`${ROOT}/functions/_lib/student/progression.js`));
const institutionalLib = await import(pathToFileURL(`${ROOT}/functions/_lib/reports/institutional.js`));
const evidenceLib = await import(pathToFileURL(`${ROOT}/functions/_lib/registry/evidence.js`));
const signingLib = await import(pathToFileURL(`${ROOT}/functions/_lib/registry/signing.js`));
const fxService = await import(pathToFileURL(`${ROOT}/functions/_lib/currency/fx-service.js`));
const revenueLib = await import(pathToFileURL(`${ROOT}/functions/_lib/reports/revenue.js`));
const reconciliationLib = await import(pathToFileURL(`${ROOT}/functions/_lib/reports/reconciliation.js`));
{
  const units = sqlite.prepare(
    `SELECT u.id AS id FROM units u JOIN courses c ON c.id = u.course_id
      WHERE c.level_id = 1 ORDER BY u.sequence ASC LIMIT 4`,
  ).all();
  // The windows are anchored to enrolments.started_at AND the endpoint
  // returns the LAST `weeks` of them, so a fixture dated from the
  // anchor lands in window 1 of thirty-three and the page draws a grid
  // of nothing. These are counted BACK from the current window instead:
  // `back(1)` is the window before this one, which is inside every page
  // size the interface offers.
  const anchor = Date.parse('2026-01-01T00:00:00.000Z');
  const DAY = 86400000;
  const WEEK = 7 * DAY;
  const current = Math.floor((Date.now() - anchor) / WEEK);
  const inWindow = (back, dayOffset) =>
    new Date(anchor + (current - back) * WEEK + dayOffset * DAY).toISOString();

  if (units[0]) {
    // Study the server measured, wholly inside window 1 — so it is
    // attributable, which is the only way minutes count.
    sqlite.exec(`INSERT INTO time_on_task (id, user_id, unit_id, seconds, first_seen_at, last_seen_at)
      VALUES ('tot_eng1','usr_demo','${units[0].id}', 2100, '${inWindow(1, 1)}', '${inWindow(1, 3)}')`);
  }
  if (units[3]) {
    // Study measured and BELOW the threshold — the fourth state, and the
    // one that proves the key is not three colours and a caption. Twelve
    // minutes against the twenty the regulations define as engagement.
    sqlite.exec(`INSERT INTO time_on_task (id, user_id, unit_id, seconds, first_seen_at, last_seen_at)
      VALUES ('tot_eng2','usr_demo','${units[3].id}', 720, '${inWindow(1, 2)}', '${inWindow(1, 4)}')`);
  }
  if (units[1]) {
    sqlite.exec(`INSERT INTO quiz_attempts (id, user_id, learning_item_id, answers_json, score, submitted_at, attempt)
      SELECT 'qa_eng1','usr_demo', li.id, '[0,1,2]', 0.8, '${inWindow(2, 2)}', 1
        FROM learning_items li WHERE li.unit_id = '${units[1].id}' LIMIT 1`);
  }
  if (units[2]) {
    // A STATE A PERSON WROTE. The platform's own reading of this window
    // is `absent` — nothing else happened in it — and the page must
    // show both, which is the fixture's whole purpose.
    sqlite.exec(`INSERT INTO attendance_records
      (id, user_id, basis, unit_id, window_start, window_end, state,
       evidence_kind, recorded_by, recorded_via, reason, created_at)
      VALUES ('att_eng1','usr_demo','module_engagement','${units[2].id}',
              '${inWindow(3, 0)}', '${inWindow(2, 0)}', 'excused',
              'staff_register','usr_tutor','staff_register',
              'Set aside on the tutor''s register: the learner was in hospital for this week and told the College at the time.',
              '${inWindow(2, 1)}')`);
  }
}

// ── THE LEVEL EXAMINATION ───────────────────────────────────────────
// The harness publishes a paper at Level II and puts one script in
// front of the markers, because the three surfaces under test are all
// empty without both. Nothing here bypasses the library: the paper is
// authored and published through authorPaper()/publishPaper(), so the
// three refusals a real paper has to clear are cleared here too.
//
// THE SITTING IS INSERTED DIRECTLY and that is deliberate. Entering a
// candidate reads the ten-module gate through the real standing engine,
// and no learner in this harness has ten complete modules at any level
// — arranging one would be forty fixture rows testing arithmetic that
// tests/level-examination.test.mjs already drives end to end. What the
// browser test is for is the SCREENS, so the harness gives them a
// script to draw.
const examinations = await import(pathToFileURL(`${ROOT}/functions/_lib/academic/examinations.js`));
const LAB_PAPER_LEVEL = 2;
let LAB_SITTING = null;
{
  const draft = await examinations.authorPaper(env, {
    actor: ADMIN_ACTOR,
    levelId: LAB_PAPER_LEVEL,
    title: 'Level II Examination — Elementary',
    titleAr: 'امتحان المستوى الثاني — المبتدئ',
    conditions: 'Open book. Three hours from the moment you open the paper. The spoken paper is closed: no script, no prompt read from a screen, and nobody else in the room.',
    conditionsAr: 'كتاب مفتوح. ثلاث ساعات من لحظة فتح الورقة. الورقةُ الشفويةُ مغلقة: بلا نصٍّ مكتوب، وبلا قراءةٍ من شاشة، وبلا أحدٍ آخر في الغرفة.',
    criteria: [
      { code: 'LIS', name: 'Listening', nameAr: 'الاستماع', weight: 0.25, skillId: 'skl_listening',
        descriptor: 'Follows an extended exchange at natural pace and identifies both the claim and the qualification on it.',
        descriptorAr: 'يتابع حوارًا ممتدًّا بسرعته الطبيعية، ويميّز الدعوى والقيدَ الوارد عليها.' },
      { code: 'REA', name: 'Reading', nameAr: 'القراءة', weight: 0.25, skillId: 'skl_reading',
        descriptor: 'Reads for argument as well as detail, and distinguishes what a text asserts from what it assumes.',
        descriptorAr: 'يقرأ للحجّة كما يقرأ للتفصيل، ويميّز ما يقرّره النصّ ممّا يفترضه.' },
      { code: 'SPK', name: 'Speaking', nameAr: 'التحدّث', weight: 0.25, skillId: 'skl_speaking', spoken: true,
        descriptor: 'Defends their own submission under questioning, in real time, with control of register.',
        descriptorAr: 'يدافع عن عمله تحت الأسئلة، في الزمن الحقيقي، مع ضبطٍ لمستوى اللغة.' },
      { code: 'WRI', name: 'Writing', nameAr: 'الكتابة', weight: 0.25, skillId: 'skl_writing',
        descriptor: 'Writes to a stated purpose and a stated reader, and revises rather than restates.',
        descriptorAr: 'يكتب لغرضٍ مصرَّحٍ به ولقارئٍ معلوم، ويراجع بدل أن يعيد.' },
    ],
  });
  await examinations.publishPaper(env, { actor: ADMIN_ACTOR, paperId: draft.id });
  const paper = await examinations.publishedPaperFor(env, LAB_PAPER_LEVEL);
  LAB_SITTING = 'lex_lab_1';
  sqlite.exec(`INSERT INTO level_examinations
    (id, user_id, level_id, paper_id, attempt, counts_toward_resits,
     window_opens_on, window_closes_on, sitting_reference, opened_at, due_at,
     submitted_at, status, lateness, late_working_days, regulation_version)
    VALUES ('${LAB_SITTING}','usr_demo',${LAB_PAPER_LEVEL},'${paper.id}',1,1,
            '2026-08-10','2026-08-21','WEC-L2-20260810-1K7QM',
            '2026-08-12T08:00:00.000Z','2026-08-12T11:00:00.000Z',
            '2026-08-12T10:41:00.000Z','submitted','on_time',0,
            '${examinations.PUBLISHED ? 'wec.academic_regulations@1.0.0' : 'wec.academic_regulations@1.0.0'}')`);
}

const recordings = await import(pathToFileURL(`${ROOT}/functions/_lib/lms/recording-storage.js`));
const { makeR2 } = await import(pathToFileURL(`${ROOT}/tests/r2-shim.mjs`));
// The same in-memory R2 stand-in the unit tests use, so the browser
// drives the REAL upload logic end to end rather than a mock of it.
env.RECORDINGS = makeR2();

const MIME = { '.html': 'text/html', '.css': 'text/css', '.js': 'text/javascript', '.svg': 'image/svg+xml', '.json': 'application/json',
  '.pdf': 'application/pdf', '.png': 'image/png', '.jpg': 'image/jpeg', '.jpeg': 'image/jpeg',
  '.webp': 'image/webp', '.woff2': 'font/woff2', '.webmanifest': 'application/manifest+json' };

// ── _redirects, BECAUSE THE HARNESS COULD NOT SEE A WHOLE CLASS OF FAULT
//
// Cloudflare Pages serves every downloadable volume in the Library
// through a rewrite: /library/<slug>.pdf → /publication/<Real Name>.pdf
// with a 200, written into _redirects by scripts/build-library.mjs.
// This server did not read that file, so all sixteen downloads 404'd
// here while serving correctly in production.
//
// That is worse than a missing feature. It meant the browser suite —
// the one instrument that opens every page and follows what is on it —
// was structurally unable to notice a broken download link, and a
// broken download had in fact already shipped once: a redirect pointing
// at a cover-artwork file no deployment carried. It was found by hand.
//
// Only the two rules that matter are implemented: a 200 rewrite (serve
// the target, keep the URL) and a 301/302 (send the reader). Splats and
// placeholders are not, and an unsupported rule is reported at boot
// rather than silently ignored, because a harness that quietly does
// less than production is how production faults become invisible.
const REDIRECTS = (() => {
  const file = `${ROOT}/_redirects`;
  if (!existsSync(file)) return [];
  const out = [];
  for (const line of readFileSync(file, 'utf8').split('\n')) {
    const t = line.trim();
    if (!t || t.startsWith('#')) continue;
    const parts = t.split(/\s+/);
    if (parts.length < 2) continue;
    const [from, to, code] = parts;
    if (from.includes('*') || from.includes(':')) continue;   // splat/placeholder: not modelled
    out.push({ from, to: decodeURIComponent(to), code: Number(code || 302) });
  }
  return out;
})();

// Auth mode. Off by default, so the existing suite keeps exercising the
// no-Clerk-key preview state the site actually ships in today.
//
// With LAB_REQUIRE_AUTH=1 the harness does what every real endpoint
// does — reads `Authorization: Bearer <token>` and 401s without it.
// It exists because the harness's *convenience* (a hard-coded
// userId, no auth) was hiding a defect: the Lab and the instructor
// workspace sent no Authorization header at all, so they would have
// 401'd on every call against a real deployment while passing every
// test here. A harness that is easier than production tests something
// production isn't.
//
// The token itself is a stub, not a JWT. What is under test is the
// header contract between page and endpoint; verifying a real Clerk
// signature needs a real Clerk instance and is disclosed as untested
// in tests/README.md.
const REQUIRE_AUTH = process.env.LAB_REQUIRE_AUTH === '1';
// `stub-admin` was added with the staff consoles: several refusals on
// them — the Registrar's moves on a case, reading a colleague's diary —
// are visible only from an administrator account, and a harness that
// could only be a tutor could not exercise either side of them.
const STUB_TOKENS = { 'stub-demo': 'usr_demo', 'stub-tutor': 'usr_tutor', 'stub-admin': 'usr_admin' };

function identify(req) {
  const header = req.headers.authorization || '';
  const token = header.startsWith('Bearer ') ? header.slice(7) : null;
  // Tokens are minted fresh per request by js/api-auth.js, so the stub
  // ones carry a counter suffix (stub-demo#3). The identity is the part
  // before it.
  const id = token ? STUB_TOKENS[token.split('#')[0]] : null;
  return { token, userId: id };
}

/**
 * WHO THE HARNESS IS ACTING AS.
 *
 * The learner routes below hard-code `usr_demo` and always did, which
 * was harmless while every surface belonged to a learner. The staff
 * consoles broke that: /api/messages is read by a tutor as well as by a
 * learner, and a harness that answers both with the learner's threads
 * would have the tutor's console pass here and show the wrong person's
 * correspondence in production.
 *
 * So where the request carries a stub token, it decides. Where it does
 * not — the no-Clerk-key preview state the site ships in — the caller
 * named by `fallback` stands in, which keeps every existing suite
 * answering exactly as it did.
 */
function actor(req, fallback = 'usr_demo') {
  const { userId } = identify(req);
  return sqlite.prepare('SELECT * FROM users WHERE id = ?').get(userId || fallback);
}

createServer(async (req, res) => {
  const url = new URL(req.url, 'http://localhost');
  try {
    // /api/verify/* is PUBLIC by design and stays public even in the
    // auth-required harness. A verification endpoint behind a login is
    // one nobody uses, and testing it as authenticated would test a
    // product we deliberately did not build.
    // /api/register is public for the same reason: a roll of award
    // holders published behind a login is not published.
    // /api/credentials/qr is public for the third time over: it renders
    // the same public verification URL that is printed in plain text
    // beside it, it looks nothing up, and a QR an employer must sign in
    // to fetch is a QR nobody scans.
    if (REQUIRE_AUTH && url.pathname.startsWith('/api/')
        && !url.pathname.startsWith('/api/verify/') && url.pathname !== '/api/register'
        && url.pathname !== '/api/credentials/qr'
        && !url.pathname.startsWith('/api/graduate/') && !url.pathname.startsWith('/api/share/')
        // /api/admissions/track and the applicant's half of /offer take
        // an application reference rather than a session, because an
        // applicant has no account to sign into. Guarding them here
        // would test a product the College deliberately did not build.
        && url.pathname !== '/api/admissions/track' && url.pathname !== '/api/admissions/offer') {
      const { userId } = identify(req);
      if (!userId) {
        res.writeHead(401, { 'Content-Type': 'application/json' });
        return res.end(JSON.stringify({ error: 'AuthError', message: 'Sign in to continue.' }));
      }
    }
    if (url.pathname === '/api/student/timetable' && req.method === 'GET') {
      const feed = await timetableLib.learnerTimetable(env, {
        userId: 'usr_demo',
        ...(url.searchParams.get('days') ? { horizonDays: Number(url.searchParams.get('days')) } : {}),
      });
      if (url.searchParams.get('format') === 'ics') {
        res.writeHead(200, {
          'Content-Type': 'text/calendar; charset=utf-8',
          'Content-Disposition': 'attachment; filename="worldwide-english-college-timetable.ics"',
        });
        return res.end(timetableLib.toIcs(feed));
      }
      return json(res, feed);
    }
    if (url.pathname === '/api/student/booking' && req.method === 'GET') {
      return json(res, await timetableLib.openSlotsForLearner(env, {
        userId: 'usr_demo',
        ...(url.searchParams.get('days') ? { horizonDays: Number(url.searchParams.get('days')) } : {}),
      }));
    }
    if (url.pathname === '/api/student/booking' && req.method === 'POST') {
      const body = JSON.parse(await read(req) || '{}');
      try {
        return json(res, await timetableLib.bookSlot(env, {
          userId: 'usr_demo', slotId: body.slotId, learnerNote: body.learnerNote || null,
        }), 201);
      } catch (err) {
        res.writeHead(err.httpStatus || 422, { 'Content-Type': 'application/json' });
        return res.end(JSON.stringify({ error: err.name, message: err.message, fields: err.fields }));
      }
    }
    if (url.pathname === '/api/student/booking' && req.method === 'DELETE') {
      const body = JSON.parse(await read(req) || '{}');
      try {
        return json(res, await timetableLib.cancelBooking(env, {
          userId: 'usr_demo', bookingId: body.bookingId, reason: body.reason,
        }));
      } catch (err) {
        res.writeHead(err.httpStatus || 422, { 'Content-Type': 'application/json' });
        return res.end(JSON.stringify({ error: err.name, message: err.message, fields: err.fields }));
      }
    }
    // ── THE DESK ────────────────────────────────────────────────────
    // The session is always the demonstration learner, exactly as the
    // real endpoints are always the signed-in one: neither of these
    // takes a user parameter, and the harness must not invent one.
    if (url.pathname === '/api/announcements' && req.method === 'GET') {
      const me = sqlite.prepare('SELECT * FROM users WHERE id = ?').get('usr_demo');
      return json(res, await announcementsLib.learnerFeed(env, {
        user: me,
        language: announcementsLib.parseLanguage(url.searchParams.get('language'), me),
        limit: announcementsLib.parseLimit(url.searchParams.get('limit')),
      }));
    }
    if (url.pathname === '/api/announcements' && req.method === 'POST') {
      const body = JSON.parse(await read(req) || '{}');
      try {
        return json(res, await announcementsLib.markRead(env, {
          user: { id: 'usr_demo' },
          announcementId: body.announcementId,
          dismissed: body.dismissed === undefined ? false : body.dismissed,
        }));
      } catch (err) {
        res.writeHead(err.httpStatus || 422, { 'Content-Type': 'application/json' });
        return res.end(JSON.stringify({ error: err.name, message: err.message, fields: err.fields }));
      }
    }
    if (url.pathname === '/api/messages' && req.method === 'GET') {
      return json(res, await threadsLib.listThreads(env, {
        user: actor(req),
        limit: threadsLib.parseLimit(url.searchParams.get('limit')),
      }));
    }
    if (url.pathname === '/api/messages' && req.method === 'POST') {
      const body = JSON.parse(await read(req) || '{}');
      try {
        return json(res, await threadsLib.openThread(env, {
          user: actor(req), body,
        }), 201);
      } catch (err) {
        res.writeHead(err.httpStatus || 422, { 'Content-Type': 'application/json' });
        return res.end(JSON.stringify({
          error: err.name, message: err.message, fields: err.fields, allowance: err.allowance,
        }));
      }
    }
    if (url.pathname.startsWith('/api/messages/')) {
      const threadId = decodeURIComponent(url.pathname.slice('/api/messages/'.length));
      const me = actor(req);
      try {
        if (req.method === 'GET') {
          return json(res, await threadsLib.readThread(env, { user: me, threadId }));
        }
        const body = JSON.parse(await read(req) || '{}');
        return json(res, await threadsLib.replyToThread(env, { user: me, threadId, body }), 201);
      } catch (err) {
        res.writeHead(err.httpStatus || 422, { 'Content-Type': 'application/json' });
        return res.end(JSON.stringify({ error: err.name, message: err.message, fields: err.fields }));
      }
    }
    // The ids the browser test needs in order to ask for a specific
    // thread. Under /__ by the house convention that keeps a harness
    // affordance out of the /api/ namespace the site actually ships.
    if (url.pathname === '/__demo-desk' && req.method === 'GET') return json(res, DEMO_DESK);
    // ── THE CASES ───────────────────────────────────────────────────
    if (url.pathname === '/api/student/cases' && req.method === 'GET') {
      const me = sqlite.prepare('SELECT * FROM users WHERE id = ?').get('usr_demo');
      const one = url.searchParams.get('case') || url.searchParams.get('reference');
      try {
        const language = url.searchParams.get('language');
        return json(res, one
          ? await casesLib.learnerCase(env, { user: me, idOrReference: one, language })
          : await casesLib.learnerCases(env, { user: me, language }));
      } catch (err) {
        res.writeHead(err.httpStatus || 404, { 'Content-Type': 'application/json' });
        return res.end(JSON.stringify({ error: err.name, message: err.message, fields: err.fields }));
      }
    }
    if (url.pathname === '/api/student/cases' && req.method === 'POST') {
      const me = sqlite.prepare('SELECT * FROM users WHERE id = ?').get('usr_demo');
      const body = JSON.parse(await read(req) || '{}');
      const action = body.action === undefined ? 'open' : body.action;
      try {
        if (action === 'open') {
          return json(res, await casesLib.openCase(env, {
            actor: me, kind: body.kind, matter: body.matter, summary: body.summary,
            detail: body.detail ?? null, levelId: body.levelId ?? null,
          }), 201);
        }
        const target = body.case || body.reference || body.caseId;
        if (action === 'escalate') {
          return json(res, await casesLib.escalateCase(env, {
            actor: me, caseId: target, note: body.note,
          }));
        }
        return json(res, await casesLib.withdrawCase(env, {
          actor: me, caseId: target, reason: body.reason,
        }));
      } catch (err) {
        res.writeHead(err.httpStatus || 422, { 'Content-Type': 'application/json' });
        return res.end(JSON.stringify({ error: err.name, message: err.message, fields: err.fields }));
      }
    }
    if (url.pathname === '/__demo-cases' && req.method === 'GET') return json(res, DEMO_CASES);
    if (url.pathname === '/api/student/attendance' && req.method === 'GET') {
      return json(res, await attendanceLib.learnerEngagement(env, {
        userId: 'usr_demo',
        weeks: attendanceLib.parseWeeks(url.searchParams.get('weeks')),
        language: url.searchParams.get('language') === 'ar' ? 'ar' : 'en',
        ...(url.searchParams.get('level') ? { levelId: Number(url.searchParams.get('level')) } : {}),
      }));
    }
    // ── THE LEVEL EXAMINATION ──────────────────────────────────────
    // `examFail` rather than the `failWith` further down this handler:
    // that one is declared below these routes and a const is not
    // hoisted, so reaching for it here would throw before it ever
    // reported anything.
    const examFail = (err, fallback) => {
      res.writeHead(err.httpStatus || fallback, { 'Content-Type': 'application/json' });
      return res.end(JSON.stringify({ error: err.name, message: err.message, fields: err.fields }));
    };
    // The three surfaces, driven by the real library. The actors are
    // fixed here the way every other route in this harness fixes them:
    // usr_demo is the candidate, usr_tutor the first marker, usr_admin
    // the second — which is also what makes the "a second reader is a
    // second person" refusal reachable from a browser.
    if (url.pathname === '/api/student/examination') {
      const learner = { id: 'usr_demo', role: 'student' };
      try {
        if (req.method === 'GET') {
          const language = url.searchParams.get('lang') === 'ar' ? 'ar' : 'en';
          const papers = await examinations.papersPublished(env);
          const enrolments = sqlite.prepare(
            `SELECT e.level_id AS levelId, e.status, l.roman, l.name
               FROM enrolments e JOIN programme_levels l ON l.id = e.level_id
              WHERE e.user_id = 'usr_demo' ORDER BY e.level_id`).all();
          return json(res, {
            sittings: await examinations.sittingsFor(env, { userId: 'usr_demo' }),
            levels: enrolments.map((e) => ({
              levelId: e.levelId, roman: e.roman, name: e.name, enrolmentStatus: e.status,
              paperPublished: Boolean(papers[e.levelId]),
              note: papers[e.levelId] ? null : (language === 'ar'
                ? 'لم تنشر الكلية بعد ورقة امتحان لهذا المستوى. لا شيء عليك فعله.'
                : 'The College has not yet published an examination paper for this level. There is nothing outstanding with you.'),
            })),
            procedure: examinations.publishedProcedure(language),
          });
        }
        const body = JSON.parse(await read(req) || '{}');
        const action = url.searchParams.get('action') || body.action;
        const sitting = action === 'open'
          ? await examinations.openPaper(env, { user: learner, examinationId: body.examinationId })
          : await examinations.submitPaper(env, { user: learner, examinationId: body.examinationId });
        return json(res, { sitting, procedure: examinations.publishedProcedure('en') });
      } catch (err) { return examFail(err, 400); }
    }

    if (url.pathname === '/api/staff/examinations') {
      // WHICH MARKER THE HARNESS IS.
      //
      // The pages build their own URLs and carry no actor, exactly as
      // they do in production where the actor is the session. So the
      // harness takes one from a COOKIE the browser test sets on the
      // context — the nearest thing to a session it has — and defaults
      // to the tutor.
      //
      // It is a cookie rather than a query parameter for a reason that
      // matters to what is being tested: a parameter would have to be
      // threaded through every URL the page builds, which would mean
      // editing the page for the test. The endpoint's refusal — a
      // marker may not read the same script twice — is only reachable
      // from a browser if two DIFFERENT people can drive the same
      // unmodified screen.
      const cookie = String(req.headers.cookie || '');
      const asSecond = /(^|;\s*)lab_marker=second(;|$)/.test(cookie);
      const marker = asSecond
        ? { id: 'usr_admin', role: 'admin' }
        : { id: 'usr_tutor', role: 'staff' };
      try {
        if (req.method === 'GET') {
          if (url.searchParams.get('examinationId')) {
            return json(res, await examinations.scriptForMarking(env, {
              staff: marker,
              examinationId: url.searchParams.get('examinationId'),
              role: url.searchParams.get('role') || 'first',
            }));
          }
          if (url.searchParams.get('userId')) {
            return json(res, {
              authorisation: { basis: 'lab' },
              sittings: await examinations.sittingsFor(env, {
                userId: url.searchParams.get('userId'),
                levelId: url.searchParams.get('levelId') ? Number(url.searchParams.get('levelId')) : null,
              }),
              procedure: examinations.publishedProcedure('en'),
            });
          }
          const queue = await examinations.markingQueue(env, {
            staff: marker, role: url.searchParams.get('role') || 'first',
          });
          return json(res, { ...queue, procedure: examinations.publishedProcedure('en') });
        }
        const body = JSON.parse(await read(req) || '{}');
        const action = url.searchParams.get('action') || body.action;
        if (action === 'mark') {
          return json(res, {
            sitting: await examinations.recordMarks(env, {
              actor: marker, examinationId: body.examinationId, role: body.role, marks: body.marks,
            }),
          });
        }
        if (action === 'settle') {
          return json(res, {
            sitting: await examinations.settleReconciliation(env, { actor: marker, ...body }),
          });
        }
        if (action === 'spoken') {
          return json(res, {
            sitting: await examinations.recordSpokenPaper(env, {
              actor: marker, examinationId: body.examinationId,
              recordingId: body.recordingId || null, passed: body.passed,
            }),
          });
        }
        if (action === 'release') {
          return json(res, {
            sitting: await examinations.release(env, { actor: ADMIN_ACTOR, examinationId: body.examinationId }),
          });
        }
        return examFail(Object.assign(new Error('That act is not wired in the harness.'), { httpStatus: 400 }), 400);
      } catch (err) { return examFail(err, 400); }
    }

    if (url.pathname === '/api/admin/examination-papers') {
      try {
        if (req.method === 'GET') {
          const papers = sqlite.prepare('SELECT * FROM examination_papers ORDER BY level_id, version DESC').all();
          const criteria = sqlite.prepare(
            `SELECT c.*, s.name AS skill_name, s.name_ar AS skill_name_ar
               FROM examination_criteria c LEFT JOIN language_skills s ON s.id = c.skill_id
              ORDER BY c.paper_id, c.sequence`).all();
          const levels = sqlite.prepare('SELECT id, roman, name, cefr FROM programme_levels ORDER BY id').all();
          const views = papers.map((p) => examinations.paperView(p, criteria.filter((c) => c.paper_id === p.id)));
          return json(res, {
            papers: views,
            levels: levels.map((l) => {
              const live = views.find((p) => p.levelId === l.id && p.status === 'published') || null;
              return {
                levelId: l.id, roman: l.roman, name: l.name, cefr: l.cefr,
                published: live ? { paperId: live.id, version: live.version, rubricPublishedOn: live.rubricPublishedOn } : null,
                drafts: views.filter((p) => p.levelId === l.id && p.status === 'draft').length,
              };
            }),
            defaults: {
              durationMinutes: examinations.DURATION_MINUTES,
              spokenMinutes: examinations.SPOKEN_MINUTES,
              windowWorkingDays: examinations.WINDOW_WORKING_DAYS,
              floor: examinations.EXAMINATION_FLOOR,
            },
            instrument: examinations.PUBLISHED.conduct,
          });
        }
        const body = JSON.parse(await read(req) || '{}');
        const action = url.searchParams.get('action') || body.action;
        if (action === 'publish') {
          return json(res, { paper: await examinations.publishPaper(env, { actor: ADMIN_ACTOR, paperId: body.paperId }) });
        }
        return json(res, { paper: await examinations.authorPaper(env, { actor: ADMIN_ACTOR, ...body }) });
      } catch (err) { return examFail(err, 400); }
    }

    // ── THE LEARNER'S OWN CERTIFICATES ─────────────────────────────
    // Driven by the real awardHistory() against the real register, so
    // the certificate the browser test photographs is composed from
    // the same denormalised row a conferral in 2027 would be.
    if (url.pathname === '/api/student/awards' && req.method === 'GET') {
      const language = url.searchParams.get('lang') === 'ar' ? 'ar' : 'en';
      const history = await registry.awardHistory(env, { userId: 'usr_demo' });
      const awards = history.awards.map((a) => {
        const row = sqlite.prepare(
          `SELECT s.kid, s.mode, s.signed_at FROM credential_signatures s
             JOIN awards aw ON aw.id = s.subject_id
            WHERE s.subject_type = 'award' AND aw.verification_code = ?
            ORDER BY s.signed_at DESC LIMIT 1`).get(a.verificationCode);
        return {
          ...a,
          signature: row ? { kid: row.kid, mode: row.mode, signedAt: row.signed_at } : null,
          verifyPath: `/verify/${encodeURIComponent(a.verificationCode)}`,
          qrPath: `/api/credentials/qr?code=${encodeURIComponent(a.verificationCode)}`,
        };
      });
      return json(res, {
        awards,
        highest: history.highest,
        creditsTotal: history.creditsTotal,
        tqtHoursTotal: history.tqtHoursTotal,
        conferredBy: language === 'ar'
          ? 'تُمنح شهادةُ المستوى حين تُستوفى شروطُ المستوى كلُّها ويُقيَّد المنحُ في السجلّ.'
          : 'A level award is conferred when every condition of that level is met and the conferral is entered in the register.',
        standingPath: language === 'ar' ? '/ar/my-standing.html' : '/my-standing.html',
        terms: {
          tuition: language === 'ar' ? '/ar/admissions/tuition/' : '/admissions/tuition/',
          verify: language === 'ar' ? '/ar/verify/' : '/verify/',
          register: language === 'ar' ? '/ar/students/awards/' : '/students/awards/',
          statements: language === 'ar'
            ? [
              'الشهادةُ الرقميةُ هي الشهادةُ التي يفحصها التحقّق. وهي مشمولةٌ برسوم مستواك، ولا رسمَ عليها الآن ولا لاحقًا.',
              'تُعاد إليك كلّما احتجتَها، مجّانًا، مدى الحياة.',
              'ولأيّ أحدٍ أن يتحقّق منها دون حساب، ما بقيت الكلية.',
              'أمّا النسخةُ المطبوعةُ على ورق القطن فخدمةٌ اختيارية لها رسمُها المنشور.',
            ]
            : [
              'The digital certificate is the certificate verification checks. It is covered by your level fee; there is no charge for it now or later.',
              'It is reissued whenever you need it, free, for life.',
              'Anybody may check it without an account, for as long as the College exists.',
              'A printed copy on cotton stock, signed and sealed, is an optional service with a published fee.',
            ],
        },
      });
    }

    // ── MY FILES ───────────────────────────────────────────────────
    // The consolidating surface. It reads the same three libraries the
    // owning pages read — the register, the document store and the
    // finance ledger — so a shelf can never show a count the page it
    // points at would contradict.
    if (url.pathname === '/api/student/downloads' && req.method === 'GET') {
      const ar = url.searchParams.get('lang') === 'ar';
      const pick = (en, arabic) => (ar ? arabic : en);
      const account = sqlite.prepare(
        'SELECT preferred_name, email, created_at FROM users WHERE id = ?').get('usr_demo');
      const enrolments = sqlite.prepare(
        `SELECT e.level_id AS levelId, e.status, e.started_at AS startedAt,
                e.completed_at AS completedAt, l.roman, l.name, l.cefr
           FROM enrolments e JOIN programme_levels l ON l.id = e.level_id
          WHERE e.user_id = 'usr_demo' ORDER BY e.level_id`).all();
      const live = enrolments.find((e) => e.status === 'active') || null;
      const history = await registry.awardHistory(env, { userId: 'usr_demo' });
      const conferred = history.awards.filter((a) => a.status === 'conferred');
      const heldName = conferred.length ? conferred[conferred.length - 1].holderName : null;
      const docs = await documents.myDocuments(env, { userId: 'usr_demo' });
      let fin = null;
      try { fin = await finance.buildStudentFinance(env, 'usr_demo'); } catch (e) { fin = null; }
      const payments = fin && Array.isArray(fin.payments) ? fin.payments : [];
      return json(res, {
        identity: {
          name: account ? account.preferred_name : null,
          nameOnAward: heldName,
          nameDiffers: Boolean(heldName && account && heldName !== account.preferred_name),
          email: account ? account.email : null,
          heldSince: account ? account.created_at : null,
          currentLevel: live
            ? { levelId: live.levelId, roman: live.roman, name: live.name, cefr: live.cefr, startedAt: live.startedAt }
            : null,
          enrolments,
          statement: ar
            ? 'يُؤدَّى كلُّ تقييمٍ تحت الهويّة التي تحملها الكليةُ عنك منذ القبول، وهي الاسمُ الذي يُكتب على الشهادة.'
            : 'Every assessment is sat under the identity the College holds from admission, and that is the name that goes on the award.',
          source: pick('/students/examinations/#identity', '/ar/students/examinations/#identity'),
          caveat: ar
            ? 'هذه بطاقةُ الكلية عنك، لا وثيقةَ هويّةٍ حكومية، ولا تُغني عن أيّ منها.'
            : 'This is the College\'s record of you. It is not a government identity document and does not stand in for one.',
        },
        shelves: [
          {
            id: 'certificates', count: conferred.length,
            route: pick('/my-award.html', '/ar/my-award.html'),
            items: conferred.map((a) => ({
              title: a.awardTitle, subtitle: a.honourLabel, subtitleAr: a.honourLabelAr,
              at: a.conferredOn, code: a.verificationCode,
              href: pick(`/verify/${encodeURIComponent(a.verificationCode)}`,
                `/ar/verify/${encodeURIComponent(a.verificationCode)}`),
            })),
          },
          {
            id: 'documents', count: (docs.documents || []).length,
            route: pick('/my-record.html', '/ar/my-record.html'),
            items: (docs.documents || []).map((d) => ({
              title: d.documentType, subtitle: d.status, at: d.issuedAt,
              code: d.verificationCode,
              href: pick(`/verify/document/${encodeURIComponent(d.verificationCode)}`,
                `/ar/verify/document/${encodeURIComponent(d.verificationCode)}`),
            })),
            issuable: ['transcript', 'diploma_supplement', 'verification_statement'],
          },
          {
            id: 'finance', count: payments.length,
            route: pick('/my-account.html', '/ar/my-account.html'),
            items: payments.slice(0, 24).map((p) => ({
            title: p.levelName ? `${p.kind} — ${p.levelName}` : p.kind,
            titleAr: p.levelNameAr ? `${p.kind} — ${p.levelNameAr}` : null,
            subtitle: p.status,
            at: p.confirmedAt || p.createdAt,
            code: p.receiptNumber || null,
            href: null,
            id: p.id,
            reference: p.invoiceRef || null,
          })),
          receipts: payments.filter((p) => p.receiptNumber).length,
            unavailable: fin === null,
          },
          {
            id: 'library', count: null,
            route: pick('/press/library/', '/ar/press/library/'),
            items: [], enrolled: enrolments.some((e) => e.status !== 'withdrawn'),
          },
        ],
      });
    }

    // ── CONFERRAL ──────────────────────────────────────────────────
    // The Registrar's act, driven by the real library against the real
    // register. The actor is fixed to the administrator, as every other
    // admin route in this harness fixes it.
    // ── A MARKER'S OWN RELIABILITY ─────────────────────────────────
    // The marker is the session everywhere in production; here it is
    // the cookie the browser test sets, for the same reason the
    // examination routes take it from there — the pages carry no actor.
    if (url.pathname === '/api/staff/marker-agreement' && req.method === 'GET') {
      const cookie = String(req.headers.cookie || '');
      const who = /(^|;\s*)lab_marker=second(;|$)/.test(cookie) ? 'usr_admin' : 'usr_tutor';
      try {
        return json(res, await agreementLib.markerAgreement(env, { markerId: who }));
      } catch (err) {
        res.writeHead(err.httpStatus || 400, { 'Content-Type': 'application/json' });
        return res.end(JSON.stringify({ error: err.name, message: err.message, fields: err.fields }));
      }
    }

    if (url.pathname === '/api/admin/conferral') {
      try {
        if (req.method === 'GET') {
          if (url.searchParams.get('userId')) {
            return json(res, await conferralLib.conferralFor(env, {
              userId: url.searchParams.get('userId'),
              levelId: url.searchParams.get('levelId'),
            }));
          }
          return json(res, await conferralLib.conferralQueue(env, {}));
        }
        const body = JSON.parse(await read(req) || '{}');
        const action = url.searchParams.get('action') || body.action;
        if (action === 'confer') {
          return json(res, await conferralLib.confer(env, { actor: ADMIN_ACTOR, ...body }));
        }
        if (action === 'withdraw') {
          return json(res, await conferralLib.withdraw(env, { actor: ADMIN_ACTOR, ...body }));
        }
        return json(res, await conferralLib.replace(env, { actor: ADMIN_ACTOR, ...body }));
      } catch (err) {
        res.writeHead(err.httpStatus || 400, { 'Content-Type': 'application/json' });
        return res.end(JSON.stringify({ error: err.name, message: err.message, fields: err.fields }));
      }
    }

    if (url.pathname === '/api/student/standing' && req.method === 'GET') {
      return json(res, await standingLib.computeLearnerStanding(env, 'usr_demo'));
    }
    if (url.pathname === '/api/student/achievements' && req.method === 'GET') {
      return json(res, await achievementsLib.learnerAchievements(env, 'usr_demo'));
    }
    if (url.pathname === '/api/student/finance' && req.method === 'GET') {
      return json(res, await finance.buildStudentFinance(env, 'usr_demo'));
    }
    if (url.pathname === '/api/student/invoice' && req.method === 'GET') {
      try {
        return json(res, await finance.buildStudentInvoice(env, {
          userId: 'usr_demo', invoiceId: url.searchParams.get('id'),
        }));
      } catch (err) {
        res.writeHead(err.httpStatus || 404, { 'Content-Type': 'application/json' });
        return res.end(JSON.stringify({ error: err.name, message: err.message, fields: err.fields }));
      }
    }
    // ── MONEY GOING THE OTHER WAY ──────────────────────────────────
    // Everything a learner can DO about a fee, driven by the real
    // modules against the real rows. The one thing simulated here is
    // the bank: /__demo-gateway below stands in for a card network and
    // the webhook that follows it, because there is no gateway to talk
    // to and pointing a browser test at a live one would be a test of
    // Stripe's uptime.
    const LEARNER_USER = { id: 'usr_demo', email: 'demo@example.com', role: 'student' };
    const failWith = (err, fallback) => {
      res.writeHead(err.httpStatus || fallback, { 'Content-Type': 'application/json' });
      return res.end(JSON.stringify({ error: err.name, message: err.message, fields: err.fields }));
    };

    if (url.pathname === '/api/payments/options' && req.method === 'GET') {
      try {
        return json(res, await payOptions.checkoutOptions(env, {
          user: LEARNER_USER,
          country: url.searchParams.get('country'),
          currency: (url.searchParams.get('currency') || '').toUpperCase() || null,
        }));
      } catch (err) { return failWith(err, 404); }
    }

    if (url.pathname === '/api/payments/verify' && req.method === 'GET') {
      try {
        return json(res, await payConfirm.paymentStanding(env, {
          user: LEARNER_USER, paymentId: url.searchParams.get('id'),
        }));
      } catch (err) { return failWith(err, 404); }
    }

    if (url.pathname === '/api/enrolment/confirm' && req.method === 'POST') {
      const body = JSON.parse((await read(req)) || '{}');
      try {
        const out = await payConfirm.confirmEnrolment(env, {
          user: LEARNER_USER, paymentId: body.paymentId,
        });
        return json(res, out.enrolment, out.created ? 201 : 200);
      } catch (err) { return failWith(err, 422); }
    }

    if (url.pathname === '/api/payments/instalment-plan' && req.method === 'POST') {
      const body = JSON.parse((await read(req)) || '{}');
      try {
        return json(res, await instalments.createInstalmentPlan(env, {
          userId: LEARNER_USER.id, levelId: body.levelId, fullProgramme: Boolean(body.fullProgramme),
        }), 201);
      } catch (err) { return failWith(err, 422); }
    }

    // THE REAL PRICING, and only the bank stubbed. priceCheckout() and
    // openPayment() are the production functions the route calls: the
    // discount, the currency conversion, the gateway choice and the
    // pending row are all decided by the same code that decides them on
    // Cloudflare. This block used to restate that arithmetic and got it
    // wrong within a day — it charged the published fee to a learner
    // holding a scholarship while the offer card beside it quoted the
    // discounted one, which is exactly why the pricing was lifted into
    // functions/_lib/payments/checkout.js.
    if (url.pathname === '/api/payments/create-checkout' && req.method === 'POST') {
      const body = JSON.parse((await read(req)) || '{}');
      try {
        if (!env.STRIPE_SECRET_KEY) {
          const err = new Error('No payment gateway is configured.');
          err.name = 'GatewayNotConfiguredError'; err.httpStatus = 503;
          throw err;
        }
        const quote = await checkoutLib.priceCheckout(env, { user: LEARNER_USER, body });
        const paymentId = await checkoutLib.openPayment(env, { user: LEARNER_USER, quote });
        await checkoutLib.markPaymentProcessing(env, paymentId, 'harness_' + paymentId);
        return json(res, {
          paymentId,
          // Where createCheckout() would have sent them. The bank below
          // stands in for the card network AND for the webhook that
          // follows it.
          checkoutUrl: `/__demo-gateway?payment=${paymentId}&lang=${body.language === 'ar' ? 'ar' : 'en'}`,
          gateway: quote.gatewayName,
          currency: quote.currencyCode,
          amountMinor: quote.amountMinor,
        });
      } catch (err) { return failWith(err, 422); }
    }

    // THE BANK, AND THE WEBHOOK AFTER IT. Under /__ rather than /api/
    // by the same convention as /__demo-awards: harness furniture that
    // must not be mistaken for a route the site ships. It clears the
    // charge, issues the receipt the real webhook handler issues, and
    // returns the browser exactly where a gateway would.
    if (url.pathname === '/__demo-gateway') {
      const id = url.searchParams.get('payment');
      const prefix = url.searchParams.get('lang') === 'ar' ? '/ar' : '';
      if (url.searchParams.get('outcome') === 'decline') {
        sqlite.prepare(`UPDATE payments SET status = 'failed', failure_reason = ? WHERE id = ?`)
          .run('The card issuer declined the charge.', id);
      } else {
        sqlite.prepare(`UPDATE payments SET status = 'succeeded', confirmed_at = ? WHERE id = ?`)
          .run(new Date().toISOString(), id);
        const n = sqlite.prepare('SELECT COUNT(*) AS n FROM receipts').get().n + 1;
        sqlite.prepare(`INSERT INTO receipts (id, payment_id, receipt_number, issued_at) VALUES (?, ?, ?, ?)`)
          .run('rcp_' + id, id, 'WEC-R-' + String(900000 + n), new Date().toISOString());
      }
      res.writeHead(302, { Location: `${prefix}/student-portal/payment-complete/?payment=${id}` });
      return res.end();
    }

    if (url.pathname === '/api/admissions/track' && req.method === 'GET') {
      const ref = url.searchParams.get('ref');
      try {
        return json(res, await lifecycle.trackApplication(env, { reference: ref, clientKey: 'harness' }));
      } catch (err) {
        res.writeHead(err.httpStatus || 404, { 'Content-Type': 'application/json' });
        return res.end(JSON.stringify({ error: err.name, message: err.message }));
      }
    }
    // ONE ROUTE, TWO DOORS — the arrangement production has, kept here
    // rather than approximated. `?action=` (or an `action` field) is the
    // applicant answering their own offer with their reference as the
    // credential; NO action is the staff door, which issues one. The
    // harness served only the applicant's half until the admissions
    // console needed the other, and a request with no action was being
    // answered "action must be one of: accept, decline, withdraw" —
    // a refusal aimed at the wrong caller entirely.
    if (url.pathname === '/api/admissions/offer' && req.method === 'POST') {
      const body = JSON.parse(await read(req) || '{}');
      const action = url.searchParams.get('action') || body.action;
      try {
        if (!action) {
          return json(res, await lifecycle.issueOffer(env, { actor: actor(req, 'usr_tutor'), ...body }), 201);
        }
        const r = await lifecycle.respondToOffer(env, {
          reference: body.reference, action, reason: body.reason || null, clientKey: 'harness',
        });
        return json(res, {
          reference: r.application.id, status: r.application.status,
          offer: r.offer ?? null, event: r.event, notifications: r.notifications,
        });
      } catch (err) {
        res.writeHead(err.httpStatus || 422, { 'Content-Type': 'application/json' });
        return res.end(JSON.stringify({ error: err.name, message: err.message, fields: err.fields }));
      }
    }
    // The harness publishes its own demonstration references, so a
    // browser test never has to hard-code an id this file invented.
    // Under /__ rather than /api/, like /__demo-awards: it is harness
    // furniture, and putting it under /api/ would have it 401 in the
    // auth-required mode the tracking suite has to run in.
    if (url.pathname === '/__demo-applications' && req.method === 'GET') {
      return json(res, Object.fromEntries(Object.entries(DEMO_APPS).map(([k, v]) => [k, v.id])));
    }
    if (url.pathname === '/api/lms/unit') {
      const u = await content.getUnitDetail(env, { userId: 'usr_demo', unitId: url.searchParams.get('id') });
      return json(res, u);
    }
    if (url.pathname === '/api/lms/pronunciation-profile') {
      const lv = url.searchParams.get('levelId');
      return json(res, await content.getPronunciationProfile(env, { userId: 'usr_demo', levelId: lv ? Number(lv) : null }));
    }
    // Staff enrolment administration, driven by the real module. The
    // harness acts as a fixed staff member, the same way it acts as a
    // fixed learner elsewhere -- what is under test is the page and the
    // enrolment logic, not the role check, which has its own tests.
    if (url.pathname === '/api/admin/learners' && req.method === 'GET') {
      const id = url.searchParams.get('id');
      const me = { id: ADMIN_ACTOR.id, role: ADMIN_ACTOR.role, email: ADMIN_ACTOR.email };
      if (id) return json(res, { ...(await adminEnrol.getLearner(env, { userId: id })), viewer: me });
      return json(res, { ...(await adminEnrol.searchLearners(env, { q: url.searchParams.get('q') || '' })), viewer: me });
    }
    // The study plan is served for whichever learner the test asks for,
    // because the states worth testing (no enrolment, awaiting content,
    // every unit finished) are properties of a LEARNER, not of the
    // page. One fixed user would only ever exercise the happy path,
    // which is the state nobody gets stuck in.
    // Public verification — no auth, deliberately, even under
    // LAB_REQUIRE_AUTH. See the exemption above the auth gate.
    // Tested BEFORE the generic /api/verify/ route below, which would
    // otherwise read "institutional/CODE" as the code itself and
    // report every lookup malformed.
    // The Employer and University Verification Portal — three layers.
    if (url.pathname.startsWith('/api/verify/institutional/') && req.method === 'GET') {
      const code = decodeURIComponent(url.pathname.slice('/api/verify/institutional/'.length));
      return json(res, await instVerify.institutionalVerification(env, {
        code, channel: url.searchParams.get('via') === 'qr' ? 'qr' : 'public',
      }));
    }
    if (url.pathname.startsWith('/api/verify/') && req.method === 'GET') {
      const code = decodeURIComponent(url.pathname.slice('/api/verify/'.length));
      const via = url.searchParams.get('via');
      return json(res, await registry.verifyCode(env, { code, channel: via === 'qr' ? 'qr' : 'public' }));
    }
    // The QR for a verification code. Public and unauthenticated, like
    // the rest of verification: a QR nobody can fetch is a QR nobody
    // scans.
    if (url.pathname === '/api/credentials/qr' && req.method === 'GET') {
      const parsed = registry.parseCode(url.searchParams.get('code') || '');
      if (!parsed.ok) { res.writeHead(400, { 'Content-Type': 'text/plain' }); return res.end('malformed'); }
      const target = `http://localhost:${process.env.LAB_PORT || 8787}/verify.html?code=${encodeURIComponent(parsed.code)}`;
      // Mirrors functions/api/credentials/qr.js: one target for every
      // reader, and a label in the reader's own language.
      const qrLang = url.searchParams.get('lang') === 'ar' ? 'ar' : 'en';
      const qrLabel = qrLang === 'ar'
        ? `تحقّق من الشهادة ${parsed.code}` : `Verify award ${parsed.code}`;
      res.writeHead(200, { 'Content-Type': 'image/svg+xml; charset=utf-8' });
      return res.end(qr.toSvg(target, { level: 'Q', label: qrLabel }));
    }
    if (url.pathname.startsWith('/api/graduate/') && req.method === 'GET') {
      const handle = decodeURIComponent(url.pathname.slice('/api/graduate/'.length));
      try { return json(res, await profile.publicProfile(env, { handle })); }
      catch { res.writeHead(404, { 'Content-Type': 'application/json' }); return res.end('{"error":"NotFound"}'); }
    }
    if (url.pathname.startsWith('/api/share/') && req.method === 'GET') {
      const token = decodeURIComponent(url.pathname.slice('/api/share/'.length));
      return json(res, await profile.viewShare(env, { token }));
    }
    // The learner's own record. The harness identifies usr_demo, the
    // same fixture the study plan uses, so My Record is driven by the
    // same data a learner would actually have.
    if (url.pathname === '/api/student/profile' && req.method === 'GET') {
      return json(res, await profile.fullProfile(env, { userId: 'usr_demo' }));
    }
    if (url.pathname === '/api/student/profile' && req.method === 'PATCH') {
      const body = JSON.parse(await read(req));
      try {
        await profile.updateProfile(env, { userId: 'usr_demo', changes: body });
        return json(res, await profile.fullProfile(env, { userId: 'usr_demo' }));
      } catch (e) {
        res.writeHead(400, { 'Content-Type': 'application/json' });
        return res.end(JSON.stringify({ error: e.name, message: e.message }));
      }
    }
    if (url.pathname === '/api/student/profile-shares' && req.method === 'GET') {
      return json(res, { shares: await profile.listShares(env, { userId: 'usr_demo' }) });
    }
    if (url.pathname === '/api/student/profile-shares' && req.method === 'POST') {
      const body = JSON.parse(await read(req));
      try {
        return json(res, await profile.createShare(env, { userId: 'usr_demo', ...body }));
      } catch (e) {
        res.writeHead(400, { 'Content-Type': 'application/json' });
        return res.end(JSON.stringify({ error: e.name, message: e.message }));
      }
    }
    if (url.pathname === '/api/student/profile-shares' && req.method === 'DELETE') {
      return json(res, await profile.revokeShare(env, {
        userId: 'usr_demo', shareId: url.searchParams.get('id'),
      }));
    }
    if (url.pathname === '/api/student/documents' && req.method === 'GET') {
      return json(res, await documents.myDocuments(env, { userId: 'usr_demo' }));
    }
    if (url.pathname === '/api/student/documents' && req.method === 'POST') {
      const body = JSON.parse(await read(req));
      try {
        return json(res, await documents.issueDocument(env, {
          documentType: body.documentType || 'transcript', userId: 'usr_demo', issuedBy: 'usr_demo',
        }));
      } catch (e) {
        res.writeHead(400, { 'Content-Type': 'application/json' });
        return res.end(JSON.stringify({ error: e.name, message: e.message }));
      }
    }
    if (url.pathname === '/api/register' && req.method === 'GET') {
      const raw = url.searchParams.get('level');
      return json(res, await registry.publicRegister(env, {
        levelId: /^[1-6]$/.test(raw || '') ? Number(raw) : null,
        q: url.searchParams.get('q'),
        limit: url.searchParams.get('limit'),
      }));
    }
    if (url.pathname === '/api/lms/time-on-task' && req.method === 'POST') {
      const body = JSON.parse(await read(req));
      beats.push(body);
      return json(res, await timeOnTask.recordBeat(env, { userId: 'usr_demo', unitId: body.unitId }));
    }
    if (url.pathname === '/__beats' && req.method === 'GET') return json(res, { beats });
    if (url.pathname === '/__demo-awards' && req.method === 'GET') {
      return json(res, {
        valid: DEMO.valid.verification_code,
        revoked: DEMO.revokedSrc.verification_code,
        replaced: DEMO.replacedSrc.verification_code,
        replacement: DEMO.replacement.verification_code,
        shareToken: DEMO.share.token,
      });
    }
    if (url.pathname === '/api/student/study-plan' && req.method === 'GET') {
      const who = url.searchParams.get('as') || 'usr_demo';
      return json(res, await studyPlan.buildStudyPlan(env, who));
    }
    if (url.pathname === '/api/admin/role' && req.method === 'GET') {
      const who = url.searchParams.get('userId');
      if (who) return json(res, { userId: who, appointments: await adminRoles.appointmentHistory(env, { userId: who }) });
      return json(res, await adminRoles.listAppointees(env));
    }
    if (url.pathname === '/api/admin/role' && req.method === 'POST') {
      const body = JSON.parse(await read(req));
      return json(res, await adminRoles.setUserRole(env, { actor: ADMIN_ACTOR, ...body }));
    }
    if (url.pathname === '/api/admin/enrolment' && req.method === 'POST') {
      const body = JSON.parse(await read(req));
      const actor = { id: 'usr_tutor', role: 'staff', email: 'tutor@example.com' };
      return json(res, await adminEnrol.setEnrolmentStatus(env, { actor, ...body }), 201);
    }
    if (url.pathname === '/api/lms/recording' && req.method === 'POST') {
      const body = JSON.parse(await read(req));
      return json(res, await content.submitLearnerRecording(env, { userId: 'usr_demo', ...body }), 201);
    }
    // Resumable upload, driven by the real recording-storage.js against
    // the r2-shim bucket above. These exist so the browser test can
    // record with a fake microphone and put the whole path under test:
    // init -> parts -> complete -> authorised playback.
    if (url.pathname === '/api/lms/recording/init' && req.method === 'POST') {
      const body = JSON.parse(await read(req));
      return json(res, await recordings.initRecordingUpload(env, { userId: 'usr_demo', ...body }), 201);
    }
    if (url.pathname === '/api/lms/recording/init' && req.method === 'GET') {
      return json(res, await recordings.getUploadState(env, { userId: 'usr_demo', recordingId: url.searchParams.get('id') }));
    }
    if (url.pathname === '/api/lms/recording/part' && req.method === 'PUT') {
      const buf = await readBuffer(req);
      return json(res, await recordings.uploadRecordingPart(env, {
        userId: 'usr_demo',
        recordingId: url.searchParams.get('id'),
        partNumber: Number(url.searchParams.get('part')),
        body: new Uint8Array(buf),
        bytes: Number(req.headers['content-length'] ?? buf.length),
      }));
    }
    if (url.pathname === '/api/lms/recording/complete' && req.method === 'POST') {
      const body = JSON.parse(await read(req));
      return json(res, await recordings.completeRecordingUpload(env, { userId: 'usr_demo', ...body }), 201);
    }
    if (url.pathname === '/api/lms/recording/audio' && req.method === 'GET') {
      const obj = await recordings.getRecordingObject(env, {
        recordingId: url.searchParams.get('id'),
        requester: { id: 'usr_demo', role: 'student' },
      });
      res.writeHead(200, { 'Content-Type': obj.contentType, 'Content-Length': String(obj.body.length), 'Accept-Ranges': 'bytes' });
      return res.end(Buffer.from(obj.body));
    }
    if (url.pathname === '/api/lms/listening-analytics') {
      return json(res, await content.getListeningAnalytics(env, { userId: 'usr_demo', levelId: Number(url.searchParams.get('levelId')) }));
    }
    // ── THE STAFF CONSOLES ──────────────────────────────────────────
    //
    // Six pages under /staff-*.html, and until they existed the harness
    // served none of the endpoints behind them: every staff capability
    // on this platform was an API with no surface, and adding the
    // surfaces without adding these would have made them unverifiable
    // in a browser — which is the one thing CLAUDE.md §6 forbids.
    //
    // The actor is `usr_tutor` rather than an administrator on purpose.
    // Almost every refusal these consoles are built around — whose
    // learners you may read, whose diary you may publish into, which
    // cases you may hear — is invisible from an administrator account,
    // because an administrator is exempt from most of them.
    const staff = () => actor(req, 'usr_tutor');

    if (url.pathname === '/api/auth/me' && req.method === 'GET') {
      const me = staff();
      return json(res, {
        id: me.id, email: me.email, preferredName: me.preferred_name,
        preferredLanguage: me.preferred_language, role: me.role,
      });
    }
    if (url.pathname === '/api/lms/marking-queue' && req.method === 'GET') {
      const lv = url.searchParams.get('levelId');
      return json(res, await content.listSubmissionsForMarking(env, {
        levelId: lv ? Number(lv) : null,
        status: url.searchParams.get('status') || 'submitted',
        limit: Number(url.searchParams.get('limit')) || 50,
      }));
    }
    if (url.pathname === '/api/lms/grade-assignment' && req.method === 'POST') {
      const body = JSON.parse(await read(req) || '{}');
      try {
        return json(res, await content.gradeAssignment(env, { gradedBy: staff().id, ...body }));
      } catch (err) {
        res.writeHead(err.httpStatus || 422, { 'Content-Type': 'application/json' });
        return res.end(JSON.stringify({ error: err.name, message: err.message, fields: err.fields }));
      }
    }
    if (url.pathname === '/api/staff/attendance') {
      const me = staff();
      try {
        if (req.method === 'GET') {
          const userId = url.searchParams.get('userId');
          if (!userId) {
            return json(res, await attendanceLib.staffRoster(env, me, {
              limit: Number(url.searchParams.get('limit')) || 50,
            }));
          }
          const authorisation = await attendanceLib.assertMayReadLearner(env, me, userId);
          const record = await attendanceLib.learnerEngagement(env, {
            userId,
            levelId: attendanceLib.parseLevelId(url.searchParams.get('levelId')),
            weeks: attendanceLib.parseWeeks(url.searchParams.get('weeks')),
          });
          return json(res, { ...record, authorisation });
        }
        const body = JSON.parse(await read(req) || '{}');
        await attendanceLib.assertMayReadLearner(env, me, body.userId);
        return json(res, await attendanceLib.recordStaffRegister(env, { actor: me, ...body }), 201);
      } catch (err) {
        res.writeHead(err.httpStatus || 422, { 'Content-Type': 'application/json' });
        return res.end(JSON.stringify({ error: err.name, message: err.message, fields: err.fields }));
      }
    }
    if (url.pathname === '/api/staff/slots') {
      const me = staff();
      try {
        if (req.method === 'GET') {
          return json(res, await timetableLib.tutorSlots(env, {
            tutor: me,
            tutorId: url.searchParams.get('tutorId'),
            limit: timetableLib.parseLimit(url.searchParams.get('limit')),
            includePast: url.searchParams.get('includePast') === 'true',
          }));
        }
        const body = JSON.parse(await read(req) || '{}');
        if (body.action === 'withdraw') {
          return json(res, await timetableLib.withdrawSlot(env, {
            tutor: me, slotId: body.slotId, reason: body.reason,
          }));
        }
        return json(res, await timetableLib.publishSlot(env, { tutor: me, ...body }), 201);
      } catch (err) {
        res.writeHead(err.httpStatus || 422, { 'Content-Type': 'application/json' });
        return res.end(JSON.stringify({ error: err.name, message: err.message, fields: err.fields }));
      }
    }
    if (url.pathname === '/api/staff/announcements') {
      const me = staff();
      try {
        if (req.method === 'GET') {
          const id = url.searchParams.get('id');
          if (id) return json(res, await announcementsLib.staffAnnouncement(env, me, id));
          const lv = url.searchParams.get('levelId');
          return json(res, await announcementsLib.staffList(env, me, {
            status: url.searchParams.get('status') || null,
            scope: url.searchParams.get('audienceScope') || null,
            levelId: lv ? Number(lv) : null,
            limit: announcementsLib.parseLimit(url.searchParams.get('limit'), 50),
          }));
        }
        const body = JSON.parse(await read(req) || '{}');
        if (req.method === 'POST') {
          return json(res, await announcementsLib.createAnnouncement(env, { actor: me, body }), 201);
        }
        const id = url.searchParams.get('id') || body.id;
        if (req.method === 'PATCH') {
          return json(res, await announcementsLib.updateAnnouncement(env, { actor: me, id, body }));
        }
        if (req.method === 'DELETE') {
          return json(res, await announcementsLib.withdrawAnnouncement(env, {
            actor: me, id, reason: body.reason,
          }));
        }
      } catch (err) {
        res.writeHead(err.httpStatus || 422, { 'Content-Type': 'application/json' });
        return res.end(JSON.stringify({ error: err.name, message: err.message, fields: err.fields }));
      }
    }
    if (url.pathname === '/api/staff/cases') {
      const me = staff();
      try {
        if (req.method === 'GET') {
          const one = url.searchParams.get('case') || url.searchParams.get('reference');
          if (one) return json(res, await casesLib.registrarCase(env, { actor: me, idOrReference: one }));
          return json(res, await casesLib.registrarQueue(env, {
            actor: me,
            stage: url.searchParams.get('stage') || null,
            kind: url.searchParams.get('kind') || null,
            matter: url.searchParams.get('matter') || null,
            overdueOnly: url.searchParams.get('overdue') === 'true',
            limit: casesLib.parseLimit(url.searchParams.get('limit')),
          }));
        }
        const body = JSON.parse(await read(req) || '{}');
        if (body.action === 'decide') {
          return json(res, await casesLib.recordDecision(env, {
            actor: me,
            actorRole: body.actorRole ?? null,
            caseId: body.case || body.reference || body.caseId,
            outcome: body.outcome,
            decision: body.decision,
            note: body.note ?? null,
          }));
        }
        const toStage = { route: 'stage_one', await_information: 'awaiting_information', close: 'closed' }[body.action]
          ?? body.toStage;
        return json(res, await casesLib.advanceStage(env, {
          actor: me,
          caseId: body.case || body.reference || body.caseId,
          toStage,
          note: body.note,
        }));
      } catch (err) {
        res.writeHead(err.httpStatus || 422, { 'Content-Type': 'application/json' });
        return res.end(JSON.stringify({ error: err.name, message: err.message, fields: err.fields }));
      }
    }
    // ── THE ADMINISTRATION ──────────────────────────────────────────
    // The College's own instruments. Every one of them was an endpoint
    // with no surface until /staff-administration.html and
    // /staff-finance.html existed, so none of them had ever been served
    // here either — and an instrument that cannot be opened in a
    // browser cannot be verified by rendering it, which is the one
    // thing this repository's standard does not allow.
    if (url.pathname === '/api/admin/institutional-metrics' && req.method === 'GET') {
      return json(res, await institutionalLib.institutionalMetrics(env));
    }
    if (url.pathname === '/api/admin/evidence' && req.method === 'GET') {
      const reference = url.searchParams.get('reference');
      if (reference) return json(res, await evidenceLib.evidenceItem(env, { reference }));
      return json(res, await evidenceLib.evidenceRegister(env, {
        collection: url.searchParams.get('collection'),
        state: url.searchParams.get('state'),
      }));
    }
    if (url.pathname === '/api/admin/quality/competency-coverage' && req.method === 'GET') {
      return json(res, await profile.competencyCoverage(env));
    }
    if (url.pathname === '/api/admin/signing-keys' && req.method === 'GET') {
      const [keys, history] = await Promise.all([
        signingLib.publicJwks(env),
        signingLib.signingHistory(env, { limit: url.searchParams.get('limit') }),
      ]);
      return json(res, { keys: keys.keys, mode: keys.mode, notice: keys.notice, ...history });
    }
    if (url.pathname === '/api/admin/institutions') {
      try {
        if (req.method === 'GET') {
          return json(res, await documents.institutionActivity(env, {
            institutionId: url.searchParams.get('id'),
            limit: url.searchParams.get('limit'),
          }));
        }
        const body = JSON.parse(await read(req) || '{}');
        return json(res, await documents.registerInstitution(env, {
          ...body, approvedBy: ADMIN_ACTOR.id,
        }));
      } catch (err) {
        res.writeHead(err.httpStatus || 422, { 'Content-Type': 'application/json' });
        return res.end(JSON.stringify({ error: err.name, message: err.message, fields: err.fields }));
      }
    }
    if (url.pathname === '/api/admin/currency/set-rate' && req.method === 'POST') {
      const body = JSON.parse(await read(req) || '{}');
      try {
        return json(res, await fxService.setPolicyFixedRate(env, {
          code: String(body.code || '').toUpperCase(),
          rateToUsd: body.rateToUsd,
          updatedBy: ADMIN_ACTOR.id,
          activate: body.activate === true,
        }));
      } catch (err) {
        res.writeHead(err.httpStatus || 422, { 'Content-Type': 'application/json' });
        return res.end(JSON.stringify({ error: err.name, message: err.message, fields: err.fields }));
      }
    }
    if (url.pathname === '/api/admin/currency/refresh-rates' && req.method === 'POST') {
      const body = JSON.parse(await read(req) || '{}');
      try {
        return json(res, await fxService.refreshFromLiveFeed(env, {
          codes: (body.codes || []).map((c) => String(c).toUpperCase()),
          updatedBy: ADMIN_ACTOR.id,
        }));
      } catch (err) {
        res.writeHead(err.httpStatus || 422, { 'Content-Type': 'application/json' });
        return res.end(JSON.stringify({ error: err.name, message: err.message, fields: err.fields }));
      }
    }
    if (url.pathname === '/api/admin/recordings/purge' && req.method === 'POST') {
      const body = JSON.parse(await read(req) || '{}');
      try {
        return json(res, await recordings.purgeExpiredRecordings(env, {
          dryRun: body.confirm !== true,
          limit: Number.isInteger(body.limit) ? body.limit : 200,
        }));
      } catch (err) {
        res.writeHead(err.httpStatus || 422, { 'Content-Type': 'application/json' });
        return res.end(JSON.stringify({ error: err.name, message: err.message, fields: err.fields }));
      }
    }
    if (url.pathname === '/api/admin/reports/revenue' && req.method === 'GET') {
      return json(res, await revenueLib.buildRevenueReport(env, {
        from: url.searchParams.get('from'), to: url.searchParams.get('to'),
      }));
    }
    if (url.pathname === '/api/admin/reports/reconciliation' && req.method === 'GET') {
      return json(res, await reconciliationLib.buildReconciliationReport(env));
    }
    if (url.pathname === '/api/staff/applications') {
      const me = staff();
      try {
        if (req.method === 'GET') {
          const queue = await lifecycle.applicationQueue(env, {
            status: url.searchParams.get('status'),
            source: url.searchParams.get('source'),
            country: url.searchParams.get('country'),
            levelId: url.searchParams.get('levelId'),
            q: url.searchParams.get('q'),
            limit: url.searchParams.get('limit'),
            offset: url.searchParams.get('offset'),
          });
          return json(res, {
            ...queue,
            machine: {
              statuses: lifecycle.APPLICATION_STATUSES,
              journey: lifecycle.PUBLISHED_JOURNEY,
              transitions: lifecycle.TRANSITIONS.map((t) => ({
                from: t.from, to: t.to, by: t.by, means: t.means,
              })),
            },
          });
        }
        const body = JSON.parse(await read(req) || '{}');
        const moved = await lifecycle.staffTransition(env, {
          actor: me,
          applicationId: body.applicationId,
          to: body.to,
          reason: body.reason ?? null,
          placementLevelId: body.placementLevelId,
        });
        return json(res, {
          reference: moved.application.id,
          status: moved.application.status,
          placementLevelId: moved.application.placement_level_id,
          offer: moved.offer ?? null,
        });
      } catch (err) {
        res.writeHead(err.httpStatus || 422, { 'Content-Type': 'application/json' });
        return res.end(JSON.stringify({ error: err.name, message: err.message, fields: err.fields }));
      }
    }
    if (url.pathname === '/api/lms/complete-level') {
      try {
        if (req.method === 'GET') {
          return json(res, await progressionLib.levelGateReport(env, {
            userId: url.searchParams.get('userId'),
            levelId: Number(url.searchParams.get('levelId')),
          }));
        }
        const body = JSON.parse(await read(req) || '{}');
        return json(res, await progressionLib.completeLevel(env, {
          userId: body.userId, levelId: body.levelId,
        }));
      } catch (err) {
        res.writeHead(err.httpStatus || 422, { 'Content-Type': 'application/json' });
        return res.end(JSON.stringify({ error: err.name, message: err.message, fields: err.fields }));
      }
    }
    if (url.pathname === '/api/lms/review-queue') {
      const lv = url.searchParams.get('levelId');
      return json(res, await content.listRecordingsForReview(env, { levelId: lv ? Number(lv) : null }));
    }
    if (url.pathname === '/api/lms/recording-review' && req.method === 'POST') {
      const body = JSON.parse(await read(req));
      return json(res, await content.reviewRecording(env, { reviewerId: 'usr_tutor', source: 'instructor', ...body }));
    }
    if (url.pathname === '/api/lms/quiz-attempt' && req.method === 'POST') {
      const body = JSON.parse(await read(req));
      try {
        return json(res, await content.submitQuizAttempt(env, { userId: 'usr_demo', ...body }), 201);
      } catch (err) {
        res.writeHead(err.httpStatus || 422, { 'Content-Type': 'application/json' });
        return res.end(JSON.stringify({ error: err.name, message: err.message, fields: err.fields }));
      }
    }
    // ── THE STUDY SURFACE ───────────────────────────────────────────
    if (url.pathname === '/api/lms/units' && req.method === 'GET') {
      const lv = Number(url.searchParams.get('levelId'));
      return json(res, {
        levelId: lv,
        units: await content.listUnits(env, { userId: 'usr_demo', levelId: lv }),
      });
    }
    if (url.pathname === '/api/lms/live-sessions' && req.method === 'GET') {
      const lv = Number(url.searchParams.get('levelId'));
      return json(res, {
        levelId: lv,
        sessions: await content.listLiveSessions(env, { userId: 'usr_demo', levelId: lv }),
      });
    }
    if (url.pathname === '/api/lms/assignment-submission' && req.method === 'POST') {
      const body = JSON.parse(await read(req));
      try {
        return json(res, await content.submitAssignment(env, { userId: 'usr_demo', ...body }), 201);
      } catch (err) {
        res.writeHead(err.httpStatus || 422, { 'Content-Type': 'application/json' });
        return res.end(JSON.stringify({ error: err.name, message: err.message, fields: err.fields }));
      }
    }
    // Static resolution mirroring Cloudflare Pages: a bare path tries
    // the file, then <path>/index.html, then <path>.html. Without the
    // directory-index step every built route like /about/ 404s here
    // while working correctly in production — which is exactly the kind
    // of harness/production divergence that produces false failures.
    // A rewrite is applied BEFORE static resolution and a redirect
    // instead of it, which is the order Pages uses.
    const rule = REDIRECTS.find((r) => r.from === url.pathname);
    let servePath = url.pathname;
    if (rule) {
      if (rule.code === 200) {
        servePath = rule.to;
      } else {
        res.writeHead(rule.code, { Location: rule.to });
        return res.end();
      }
    }

    const candidates = [];
    const p = servePath;
    if (p === '/') candidates.push('/index.html');
    else {
      candidates.push(p);
      if (p.endsWith('/')) candidates.push(p + 'index.html');
      else candidates.push(p + '/index.html', p + '.html');
    }
    for (const c of candidates) {
      const file = join(ROOT, c);
      if (existsSync(file) && statSync(file).isFile()) {
        res.writeHead(200, { 'Content-Type': MIME[extname(file)] || 'application/octet-stream' });
        return res.end(readFileSync(file));
      }
    }
    // Pages serves 404.html with a 404 status for unknown routes.
    const nf = join(ROOT, '404.html');
    if (existsSync(nf)) {
      res.writeHead(404, { 'Content-Type': 'text/html' });
      return res.end(readFileSync(nf));
    }
    res.writeHead(404); res.end('not found');
  } catch (e) {
    res.writeHead(e.name === 'AuthorizationError' ? 403 : 400, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ error: e.name, message: e.message }));
  }
}).listen(Number(process.env.LAB_PORT || 8787), () => console.log('lab server ready'));

function json(res, obj, code = 200) { res.writeHead(code, { 'Content-Type': 'application/json' }); res.end(JSON.stringify(obj)); }
function read(req) { return new Promise((r) => { let d = ''; req.on('data', (c) => d += c); req.on('end', () => r(d)); }); }
// Audio parts are binary — reading them as a string would corrupt them,
// and the corruption would only show up as a wrong SHA-256 much later.
function readBuffer(req) {
  return new Promise((r) => { const cs = []; req.on('data', (c) => cs.push(c)); req.on('end', () => r(Buffer.concat(cs))); });
}
