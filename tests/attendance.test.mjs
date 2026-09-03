// Run with: node --experimental-sqlite tests/attendance.test.mjs
//
// ENGAGEMENT, AND THE THREE WAYS THIS COULD GO WRONG QUIETLY.
//
// The unit tests here are ordinary. The reason the file is long is that
// three of the failures worth catching are not failures of arithmetic:
//
//  1. THE CONSTANT THAT DRIFTS. A Pages Function has no filesystem, so
//     `ENGAGEMENT` in functions/_lib/academic/attendance.js restates the
//     numbers, ids and labels of data/academic-regulations.json. A
//     restated constant is a constant that will drift, and a drifted one
//     means the platform is measuring something the published regulation
//     does not say. So this file reads the instrument off disk and binds
//     every value and every quoted label to it. Editing the regulation
//     without editing the code — or the reverse — fails the build.
//
//  2. THE ROLL CALL THAT COMES BACK. The whole point of the design is
//     that the payload says what it measured and what that is not. A
//     later refactor that returns a leaner object is not a performance
//     improvement; it is the College implying it takes a register. The
//     notice is asserted as a required field of every learner-facing
//     payload, including the empty ones.
//
//  3. THE TUTOR WHO SEES EVERYBODY. There is no tutor-to-learner
//     assignment table, so the relation is composed from teaching acts.
//     Composed relations are exactly the kind that acquire an extra
//     UNION arm in a hurry, so the refusal is asserted at the route with
//     a real token, in both directions: the tutor who teaches the
//     learner gets the record, the member of staff who does not gets
//     403 — and so does the same request one line later against a
//     learner nobody teaches.
import { readFileSync } from 'node:fs';
import { makeD1 } from './d1-shim.mjs';
import { ROOT, loadUrl } from './helpers.mjs';

let pass = 0, fail = 0;
const check = (label, cond, detail) => {
  console.log((cond ? 'PASS ' : 'FAIL ') + label + (cond || detail === undefined ? '' : ` — ${detail}`));
  cond ? pass++ : fail++;
};

const lib = await import(loadUrl('functions/_lib/academic/attendance.js'));
const {
  ENGAGEMENT, engagementNotice, engagementWindows, learnerEngagement,
  tutorLearnerIds, recordStaffRegister, parseWeeks, parseLevelId, STATE_MEANING,
} = lib;
const student = await import(loadUrl('functions/api/student/attendance.js'));
const staffRoute = await import(loadUrl('functions/api/staff/attendance.js'));

const regs = JSON.parse(readFileSync(new URL('data/academic-regulations.json', `file://${ROOT}/`), 'utf8'));
const framework = readFileSync(new URL('docs/academic-framework.md', `file://${ROOT}/`), 'utf8');
const eng = regs.engagement;

// ---------------------------------------------------------------------
// 1 · THE CODE'S NUMBERS ARE THE INSTRUMENT'S NUMBERS
// ---------------------------------------------------------------------
check('instrument version restated in code matches data/academic-regulations.json',
  ENGAGEMENT.version === regs.instrument.version, `${ENGAGEMENT.version} vs ${regs.instrument.version}`);
check('window is seven days, per engage.window',
  ENGAGEMENT.windowDays === eng.window.value && eng.window.unit === 'days', eng.window.value);
check('window is anchored to enrolments.started_at, per engage.window.anchor',
  ENGAGEMENT.windowAnchor === eng.window.anchor, eng.window.anchor);

const totClause = eng.counts_as_engaged.any_of.find((c) => c.id === 'engage.counts.time_on_task');
check('study threshold is twenty minutes, gte, per engage.counts.time_on_task',
  ENGAGEMENT.studyMinutes === totClause.value && totClause.unit === 'minutes' && totClause.comparator === 'gte',
  `${totClause.value} ${totClause.unit} ${totClause.comparator}`);
check('the study measurement is server-side, not client-supplied',
  totClause.client_supplied === false && totClause.measured_by === 'functions/_lib/lms/time-on-task.js');

const assessClause = eng.counts_as_engaged.any_of.find((c) => c.id === 'engage.counts.assessment');
check('one assessment attempt is enough, per engage.counts.assessment',
  ENGAGEMENT.assessmentCount === assessClause.value && assessClause.comparator === 'gte');

const liveClause = eng.counts_as_engaged.any_of.find((c) => c.id === 'engage.counts.live_session');
check('a live session counts only on host confirmation, per engage.counts.live_session',
  ENGAGEMENT.liveSessionRequiresHostConfirmation === liveClause.requires_host_confirmation);

check('the regulation still records that nothing observes a live-session join',
  liveClause.instrumented === false);
check('the College still holds no attendance requirement',
  eng.attendance_requirement.exists === false
  && eng.attendance_requirement.affects_any_award === false
  && eng.attendance_requirement.affects_any_mark === false
  && eng.attendance_requirement.affects_any_standing === false);

// ---------------------------------------------------------------------
// 2 · THE NOTICE THE UI CANNOT OMIT
// ---------------------------------------------------------------------
const notice = engagementNotice();
check('the notice is labelled so a UI cannot render it as a caption',
  notice.label === 'This is engagement, measured as follows' && typeof notice.statement === 'string');
check('the notice says the College does not measure attendance',
  /does not measure attendance/.test(notice.statement));
check('the notice repeats the three denials the instrument makes',
  /not a mark/.test(notice.statement)
  && /not a condition of any award/.test(notice.statement)
  && /never a penalty/.test(notice.statement));
check('the notice names the seven-day, learner-anchored window',
  /seven-day window anchored to your own start date/.test(notice.statement)
  && notice.window.days === 7 && notice.window.anchor === 'enrolments.started_at');

for (const clause of eng.counts_as_engaged.any_of) {
  const mine = notice.measuredBy.find((m) => m.id === clause.id);
  check(`notice quotes ${clause.id} by its own published label`,
    Boolean(mine) && mine.label === clause.label.en, mine ? mine.label : 'absent from the notice');
}
check('notice adds the two § XI measures the instrument does not enumerate, credited to the framework',
  notice.measuredBy.filter((m) => m.source === 'docs/academic-framework.md § XI').length === 2);
check('"Lessons completed against the published pace" is § XI\'s own wording',
  framework.includes('Lessons completed against the published pace'));
check('"Laboratory practice submitted" is § XI\'s own wording',
  framework.includes('Laboratory practice submitted'));

check('every one of engage.what_it_is_not reaches the learner, verbatim',
  eng.what_it_is_not.every((n) => notice.isNot.some((m) => m.id === n.id && m.label === n.label.en)),
  notice.isNot.map((n) => n.id).join(', '));

// ---------------------------------------------------------------------
// 3 · WINDOWS
// ---------------------------------------------------------------------
const ANCHOR = '2026-03-01T00:00:00.000Z';
const NOW = Date.parse('2026-04-02T12:00:00.000Z');   // 32.5 days in — window index 4

const wins = engagementWindows({ anchor: ANCHOR, now: NOW, count: 8 });
check('five windows have opened since the anchor', wins.length === 5, wins.length);
check('window one starts on the learner\'s own start date, not on a Monday',
  wins[0].start === ANCHOR && wins[0].ordinal === 1);
check('each window is exactly seven days',
  wins.every((w) => Date.parse(w.end) - Date.parse(w.start) === 7 * 86400000));
check('windows are contiguous, with no day belonging to two of them',
  wins.slice(1).every((w, i) => w.start === wins[i].end));
check('the four elapsed windows are closed and the running one is not',
  wins.filter((w) => w.closed).length === 4 && wins[4].current === true && wins[4].closed === false);
check('asking for fewer windows returns the most recent ones',
  engagementWindows({ anchor: ANCHOR, now: NOW, count: 2 }).map((w) => w.ordinal).join(',') === '4,5');
check('an enrolment that has not started yet has no windows at all',
  engagementWindows({ anchor: '2026-09-01T00:00:00.000Z', now: NOW, count: 8 }).length === 0);

// ---------------------------------------------------------------------
// FIXTURES
// ---------------------------------------------------------------------
const schema = readFileSync(new URL('sql/schema.sql', `file://${ROOT}/`), 'utf8');
const env = { DB: makeD1(schema), CLERK_JWKS_URL: 'https://stub.clerk.accounts.dev/.well-known/jwks.json' };
const sql = (text, ...args) => env.DB.prepare(text).bind(...args).run();

for (const [id, sub, role] of [
  ['usr_learner', 'sub_learner', 'student'],
  ['usr_other', 'sub_other', 'student'],
  ['usr_tutor', 'sub_tutor', 'staff'],
  ['usr_stranger', 'sub_stranger', 'staff'],
  ['usr_admin', 'sub_admin', 'admin'],
  ['usr_booker', 'sub_booker', 'staff'],
  ['usr_marker', 'sub_marker', 'staff'],
]) {
  sql(`INSERT INTO users (id, auth_provider, auth_provider_id, email, email_verified, role)
       VALUES (?, 'clerk', ?, ?, 1, ?)`, id, sub, `${id}@example.com`, role);
}

sql(`INSERT INTO enrolments (id, user_id, level_id, status, started_at)
     VALUES ('enr_l3', 'usr_learner', 3, 'active', ?)`, ANCHOR);

for (const [id, seq] of [['unt_1', 1], ['unt_2', 2], ['unt_3', 3], ['unt_4', 4], ['unt_5', 5]]) {
  sql(`INSERT INTO units (id, course_id, sequence, title) VALUES (?, 'crs_level_3', ?, ?)`,
    id, seq, `Module ${seq}`);
}
for (const [id, unit, kind] of [
  ['itm_quiz', 'unt_1', 'quiz'], ['itm_assign', 'unt_1', 'assignment'],
  ['itm_lab', 'unt_2', 'pronunciation'],
]) {
  sql(`INSERT INTO learning_items (id, unit_id, sequence, kind, title) VALUES (?, ?, 1, ?, ?)`,
    id, unit, kind, `${id} item`);
}

// unt_2 — thirty measured minutes wholly inside window 2. Attributable, so it counts.
sql(`INSERT INTO time_on_task (id, user_id, unit_id, seconds, first_seen_at, last_seen_at)
     VALUES ('tot_2','usr_learner','unt_2',1800,'2026-03-09T10:00:00.000Z','2026-03-09T10:30:00.000Z')`);
// unt_3 — twelve measured minutes wholly inside window 3. Short of twenty: partial.
sql(`INSERT INTO time_on_task (id, user_id, unit_id, seconds, first_seen_at, last_seen_at)
     VALUES ('tot_3','usr_learner','unt_3',720,'2026-03-16T09:00:00.000Z','2026-03-16T09:12:00.000Z')`);
// unt_4 — two hours accrued across three weeks. The last beat lands in
// window 4; none of the total can be attributed to it.
sql(`INSERT INTO time_on_task (id, user_id, unit_id, seconds, first_seen_at, last_seen_at)
     VALUES ('tot_4','usr_learner','unt_4',7200,'2026-03-02T08:00:00.000Z','2026-03-25T08:00:00.000Z')`);
// unt_5 — one beat, nothing credited. This is an open tab and the
// regulation says in terms that engagement is never inferred from one.
sql(`INSERT INTO time_on_task (id, user_id, unit_id, seconds, first_seen_at, last_seen_at)
     VALUES ('tot_5','usr_learner','unt_5',0,'2026-03-23T10:00:00.000Z','2026-03-23T10:00:00.000Z')`);

sql(`INSERT INTO quiz_attempts (id, learning_item_id, user_id, answers_json, score, submitted_at)
     VALUES ('qat_1','itm_quiz','usr_learner','[]',0.9,'2026-03-03T00:00:00.000Z')`);
sql(`INSERT INTO assignment_submissions (id, learning_item_id, user_id, content, status, submitted_at, graded_by)
     VALUES ('asub_1','itm_assign','usr_learner','x','graded','2026-03-24T00:00:00.000Z','usr_marker')`);
sql(`INSERT INTO learner_recordings (id, learning_item_id, user_id, media_url, submitted_at)
     VALUES ('rec_1','itm_lab','usr_learner','r2://x','2026-03-17T00:00:00.000Z')`);
sql(`INSERT INTO unit_progress (id, user_id, unit_id, status, completed_at)
     VALUES ('uprg_4','usr_learner','unt_4','completed','2026-03-10T00:00:00.000Z')`);

sql(`INSERT INTO live_sessions (id, level_id, unit_id, host_user_id, title, starts_at, duration_minutes)
     VALUES ('lsn_1', 3, 'unt_1', 'usr_tutor', 'Speaking clinic', '2026-03-05T18:00:00.000Z', 60)`);

// The teaching relation, one arm at a time.
sql(`INSERT INTO message_threads (id, subject, scope, level_id, opened_by, status, last_message_at)
     VALUES ('mth_1','Pacing','level',3,'usr_learner','open','2026-03-04T00:00:00.000Z')`);
sql(`INSERT INTO message_participants (id, thread_id, user_id, party) VALUES ('mpt_1','mth_1','usr_learner','learner')`);
sql(`INSERT INTO message_participants (id, thread_id, user_id, party) VALUES ('mpt_2','mth_1','usr_tutor','tutor')`);
sql(`INSERT INTO tutorial_slots (id, tutor_id, level_id, title, kind, starts_at, duration_minutes, capacity, status)
     VALUES ('slt_1','usr_booker',3,'Office hour','office_hour','2026-03-12T09:00:00.000Z',30,1,'open')`);
sql(`INSERT INTO slot_bookings (id, slot_id, user_id, status, booked_at)
     VALUES ('bkg_1','slt_1','usr_other','booked','2026-03-10T00:00:00.000Z')`);

// ---------------------------------------------------------------------
// 4 · THE DERIVED RECORD
// ---------------------------------------------------------------------
const record = await learnerEngagement(env, { userId: 'usr_learner', weeks: 8, now: NOW });
const cellOf = (ordinal, unitId) => record.windows[ordinal - 1].modules.find((m) => m.unitId === unitId);

check('the notice leads the learner payload', Boolean(record.engagementNotice?.statement));
check('the record is anchored on the enrolment\'s own start date',
  record.window.anchoredOn === ANCHOR && record.learner.levelId === 3);
check('five modules × five windows', record.windows.length === 5 && record.windows[0].modules.length === 5);
check('the record is also projected by module, for a per-module reading',
  record.modules.length === 5 && record.modules[0].windows.length === 5);

check('a quiz attempt makes window 1 engaged on that module',
  cellOf(1, 'unt_1').state === 'attended', cellOf(1, 'unt_1').state);
check('and it names the clause and the row it read',
  cellOf(1, 'unt_1').evidence.some((e) => e.clause === 'engage.counts.assessment'
    && e.signal === 'quiz_attempts' && e.ref === 'qat_1' && e.counts === true));

check('thirty attributable minutes clear the twenty-minute clause',
  cellOf(2, 'unt_2').state === 'attended' && cellOf(2, 'unt_2').minutesPresent === 30);
check('and the minutes are shown, not just the verdict',
  cellOf(2, 'unt_2').evidence.some((e) => e.signal === 'time_on_task' && e.minutes === 30 && e.counts === true));

check('a completed lesson is engagement under § XI',
  cellOf(2, 'unt_4').state === 'attended'
  && cellOf(2, 'unt_4').evidence.some((e) => e.clause === 'framework.xi.lesson_completion' && e.ref === 'uprg_4'));

check('laboratory practice is engagement under § XI',
  cellOf(3, 'unt_2').state === 'attended'
  && cellOf(3, 'unt_2').evidence.some((e) => e.clause === 'framework.xi.laboratory_practice' && e.ref === 'rec_1'));

check('twelve attributable minutes are "partial", carrying the amount',
  cellOf(3, 'unt_3').state === 'partial' && cellOf(3, 'unt_3').minutesPresent === 12);
check('"partial" is explained to the learner in the words of the threshold',
  /below the 20 minutes/.test(cellOf(3, 'unt_3').meaning));

check('an assignment submission engages window 4',
  cellOf(4, 'unt_1').state === 'attended'
  && cellOf(4, 'unt_1').evidence.some((e) => e.signal === 'assignment_submissions' && e.ref === 'asub_1'));

const straddle = cellOf(4, 'unt_4');
check('study time that straddles the window boundary does NOT silently count',
  straddle.state === 'absent', straddle.state);
check('but it is reported, with the reason it could not be counted',
  straddle.evidence.some((e) => e.signal === 'time_on_task' && e.counts === false
    && e.minutes === null && /running total/.test(e.statement)));

const openTab = cellOf(4, 'unt_5');
check('a single beat with nothing credited is an open tab and is not evidence',
  openTab.state === 'absent' && openTab.evidence.length === 0);
check('an absent window is described, not scored',
  /not a penalty/.test(STATE_MEANING.absent));

check('a window with no evidence at all is absent on every module',
  record.windows[0].summary.attended === 1 && record.windows[0].summary.absent === 4,
  JSON.stringify(record.windows[0].summary));
check('the running window is marked provisional so nothing final is read from it',
  record.windows[4].modules.every((m) => m.provisional === true)
  && record.windows[3].modules.every((m) => m.provisional === false));
check('the platform publishes what it cannot see alongside what it can',
  record.limitations.length === 3
  && record.limitations.some((l) => l.id === 'limit.study_time_not_per_window'));

// ---------------------------------------------------------------------
// 5 · PERSISTENCE — only what was read from evidence
// ---------------------------------------------------------------------
const stored = env.DB.prepare(
  `SELECT state, COUNT(*) AS n FROM attendance_records WHERE user_id = 'usr_learner' GROUP BY state`).bind().all().results;
const byState = Object.fromEntries(stored.map((r) => [r.state, r.n]));
check('the six engaged windows were written down', byState.attended === 5 && byState.partial === 1,
  JSON.stringify(byState));
check('no absence was written down — absence is the absence of a row', !byState.absent);
check('every stored row carries the evidence kind it was read from and no author',
  env.DB.prepare(`SELECT COUNT(*) AS n FROM attendance_records
     WHERE user_id='usr_learner' AND recorded_via='platform_signal'
       AND recorded_by IS NULL AND evidence_ref IS NOT NULL`).bind().first().n === 6);
check('the partial row carries its minutes, as the schema requires',
  env.DB.prepare(`SELECT minutes_present AS m FROM attendance_records
     WHERE user_id='usr_learner' AND state='partial'`).bind().first().m === 12);

await learnerEngagement(env, { userId: 'usr_learner', weeks: 8, now: NOW });
check('re-reading the record does not duplicate a single row',
  env.DB.prepare(`SELECT COUNT(*) AS n FROM attendance_records WHERE user_id='usr_learner'`).bind().first().n === 6);
check('the running window is still never written',
  env.DB.prepare(`SELECT COUNT(*) AS n FROM attendance_records
     WHERE user_id='usr_learner' AND window_start >= '2026-03-29'`).bind().first().n === 0);

// ---------------------------------------------------------------------
// 6 · LIVE SESSIONS — not recorded is not nobody came
// ---------------------------------------------------------------------
check('a session with no register is reported as not recorded, never as absent',
  record.liveSessions.sessions.length === 1
  && record.liveSessions.sessions[0].recorded === false
  && record.liveSessions.sessions[0].state === null);
check('and the payload says why, in the regulation\'s own terms',
  record.liveSessions.instrumented === false && /not recorded rather than as nobody/.test(record.liveSessions.note));

// ---------------------------------------------------------------------
// 7 · WHO A TUTOR MAY READ
// ---------------------------------------------------------------------
check('a live message thread makes a learner the tutor\'s own',
  (await tutorLearnerIds(env, 'usr_tutor')).includes('usr_learner'));
check('a booking in a tutor\'s own offered time does too',
  (await tutorLearnerIds(env, 'usr_booker')).includes('usr_other'));
check('so does having marked their work',
  (await tutorLearnerIds(env, 'usr_marker')).includes('usr_learner'));
check('a member of staff with no teaching act has no learners at all',
  (await tutorLearnerIds(env, 'usr_stranger')).length === 0);
check('a tutor never appears on their own roster',
  !(await tutorLearnerIds(env, 'usr_tutor')).includes('usr_tutor'));

// A tutor who leaves a thread stops seeing the learner through it.
sql(`UPDATE message_participants SET left_at = '2026-04-01T00:00:00.000Z' WHERE id = 'mpt_2'`);
check('a tutor who hands the learner on loses sight of them',
  !(await tutorLearnerIds(env, 'usr_tutor')).includes('usr_learner'));
sql(`UPDATE message_participants SET left_at = NULL WHERE id = 'mpt_2'`);

// ---------------------------------------------------------------------
// 8 · THE OVERRIDE
// ---------------------------------------------------------------------
const tutorUser = { id: 'usr_tutor', role: 'staff' };
const fieldsOf = async (fn) => { try { await fn(); return null; } catch (e) { return { name: e.name, status: e.httpStatus, fields: e.fields }; } };

const noReason = await fieldsOf(() => recordStaffRegister(env, {
  actor: tutorUser, userId: 'usr_learner', basis: 'module_engagement', unitId: 'unt_1',
  windowStart: '2026-03-01T00:00:00.000Z', windowEnd: '2026-03-08T00:00:00.000Z', state: 'absent',
}));
check('an override with no reason is refused, not silently accepted',
  noReason?.status === 422 && Boolean(noReason.fields.reason));

const badState = await fieldsOf(() => recordStaffRegister(env, {
  actor: tutorUser, userId: 'usr_learner', basis: 'module_engagement', unitId: 'unt_1',
  windowStart: '2026-03-01T00:00:00.000Z', windowEnd: '2026-03-08T00:00:00.000Z',
  state: 'present', reason: 'x',
}));
check('an invented state is rejected rather than coerced to a real one',
  badState?.status === 422 && Boolean(badState.fields.state));

const badBasis = await fieldsOf(() => recordStaffRegister(env, {
  actor: tutorUser, userId: 'usr_learner', basis: 'roll_call', unitId: 'unt_1',
  windowStart: '2026-03-01T00:00:00.000Z', windowEnd: '2026-03-08T00:00:00.000Z',
  state: 'attended', reason: 'x',
}));
check('there is no third basis to invent', badBasis?.status === 422 && Boolean(badBasis.fields.basis));

const bothKeys = await fieldsOf(() => recordStaffRegister(env, {
  actor: tutorUser, userId: 'usr_learner', basis: 'live_session', liveSessionId: 'lsn_1',
  unitId: 'unt_1', state: 'attended', reason: 'Joined and spoke.',
}));
check('a live-session record refuses a module id instead of failing a CHECK at 500',
  bothKeys?.status === 422 && Boolean(bothKeys.fields.unitId));

const noWindow = await fieldsOf(() => recordStaffRegister(env, {
  actor: tutorUser, userId: 'usr_learner', basis: 'module_engagement', unitId: 'unt_1',
  state: 'attended', reason: 'Worked offline.',
}));
check('a module record without a window is refused on both ends',
  noWindow?.status === 422 && Boolean(noWindow.fields.windowStart) && Boolean(noWindow.fields.windowEnd));

const backwards = await fieldsOf(() => recordStaffRegister(env, {
  actor: tutorUser, userId: 'usr_learner', basis: 'module_engagement', unitId: 'unt_1',
  windowStart: '2026-03-08T00:00:00.000Z', windowEnd: '2026-03-01T00:00:00.000Z',
  state: 'attended', reason: 'Worked offline.',
}));
check('a window that ends before it starts is refused',
  backwards?.status === 422 && Boolean(backwards.fields.windowEnd));

const partialNoMinutes = await fieldsOf(() => recordStaffRegister(env, {
  actor: tutorUser, userId: 'usr_learner', basis: 'module_engagement', unitId: 'unt_1',
  windowStart: '2026-03-01T00:00:00.000Z', windowEnd: '2026-03-08T00:00:00.000Z',
  state: 'partial', reason: 'Half a session.',
}));
check('"partial" without the amount is refused — it would just be "attended" hedged',
  partialNoMinutes?.status === 422 && Boolean(partialNoMinutes.fields.minutesPresent));

const impossibleMinutes = await fieldsOf(() => recordStaffRegister(env, {
  actor: tutorUser, userId: 'usr_learner', basis: 'module_engagement', unitId: 'unt_1',
  windowStart: '2026-03-01T00:00:00.000Z', windowEnd: '2026-03-08T00:00:00.000Z',
  state: 'partial', minutesPresent: 99999, reason: 'Half a session.',
}));
check('more minutes present than the window itself lasts is refused',
  impossibleMinutes?.status === 422 && Boolean(impossibleMinutes.fields.minutesPresent));

const negativeMinutes = await fieldsOf(() => recordStaffRegister(env, {
  actor: tutorUser, userId: 'usr_learner', basis: 'module_engagement', unitId: 'unt_1',
  windowStart: '2026-03-01T00:00:00.000Z', windowEnd: '2026-03-08T00:00:00.000Z',
  state: 'partial', minutesPresent: -5, reason: 'Half a session.',
}));
check('a negative duration is refused', negativeMinutes?.status === 422);

const unknownLearner = await fieldsOf(() => recordStaffRegister(env, {
  actor: tutorUser, userId: 'usr_nobody', basis: 'module_engagement', unitId: 'unt_1',
  windowStart: '2026-03-01T00:00:00.000Z', windowEnd: '2026-03-08T00:00:00.000Z',
  state: 'absent', reason: 'x',
}));
check('an unknown learner is a 404, not an orphan row', unknownLearner?.status === 404);

const unknownUnit = await fieldsOf(() => recordStaffRegister(env, {
  actor: tutorUser, userId: 'usr_learner', basis: 'module_engagement', unitId: 'unt_nope',
  windowStart: '2026-03-01T00:00:00.000Z', windowEnd: '2026-03-08T00:00:00.000Z',
  state: 'absent', reason: 'x',
}));
check('an unknown module is a 404', unknownUnit?.status === 404);

const unknownSession = await fieldsOf(() => recordStaffRegister(env, {
  actor: tutorUser, userId: 'usr_learner', basis: 'live_session', liveSessionId: 'lsn_nope',
  state: 'attended', reason: 'x',
}));
check('an unknown live session is a 404', unknownSession?.status === 404);

// The override that works, over a window the platform read as engaged.
const override = await recordStaffRegister(env, {
  actor: tutorUser, userId: 'usr_learner', basis: 'module_engagement', unitId: 'unt_1',
  windowStart: '2026-03-01T00:00:00.000Z', windowEnd: '2026-03-08T00:00:00.000Z',
  state: 'excused', reason: 'Hospital admission, evidence seen by the Registrar.',
});
check('the override is stored, attributed and dated',
  override.record.state === 'excused' && override.record.recordedBy === 'usr_tutor'
  && override.record.recordedVia === 'staff_register' && override.record.evidenceKind === 'staff_register');
check('the reason is kept with it, trimmed and whole',
  override.record.reason === 'Hospital admission, evidence seen by the Registrar.');
check('what it replaced is returned rather than erased',
  override.superseded?.state === 'attended' && override.superseded.recordedVia === 'platform_signal');
check('and the platform\'s own current reading travels beside it',
  override.derived.state === 'attended'
  && override.derived.evidence.some((e) => e.ref === 'qat_1'));

const afterOverride = await learnerEngagement(env, { userId: 'usr_learner', weeks: 8, now: NOW });
const overridden = afterOverride.windows[0].modules.find((m) => m.unitId === 'unt_1');
check('the learner sees the override as an override, with its reason',
  overridden.state === 'excused' && overridden.overridden === true
  && overridden.recordedBy === 'usr_tutor' && /Hospital admission/.test(overridden.reason));
check('and sees, in the same cell, what the platform itself read',
  overridden.derived.state === 'attended');
check('a re-read never overwrites what a person wrote',
  env.DB.prepare(`SELECT state FROM attendance_records
     WHERE user_id='usr_learner' AND unit_id='unt_1' AND window_start=?`)
    .bind('2026-03-01T00:00:00.000Z').first().state === 'excused');

// A live-session register, which is the only way live participation exists.
const liveMark = await recordStaffRegister(env, {
  actor: tutorUser, userId: 'usr_learner', basis: 'live_session', liveSessionId: 'lsn_1',
  state: 'partial', minutesPresent: 25, reason: 'Joined late; connection dropped twice.',
});
check('a live-session register takes its window from the session, not the request',
  liveMark.record.windowStart === '2026-03-05T18:00:00.000Z'
  && liveMark.record.windowEnd === '2026-03-05T19:00:00.000Z');
check('live participation is never derived, and the payload says so',
  liveMark.derived.state === null && /nothing observes who joins/.test(liveMark.derived.note));
check('a host\'s word is filed as their register, never as an observed join',
  liveMark.record.evidenceKind === 'staff_register' && liveMark.record.recordedVia === 'staff_register',
  liveMark.record.evidenceKind);

const afterRegister = await learnerEngagement(env, { userId: 'usr_learner', weeks: 8, now: NOW });
check('once a host has taken a register the session reads as recorded',
  afterRegister.liveSessions.sessions[0].recorded === true
  && afterRegister.liveSessions.sessions[0].state === 'partial'
  && afterRegister.liveSessions.instrumented === true);

// ---------------------------------------------------------------------
// 9 · INPUT PARSING
// ---------------------------------------------------------------------
check('weeks defaults rather than demanding a parameter', parseWeeks(null) === 8);
check('weeks accepts a plain whole number', parseWeeks('4') === 4);
for (const bad of ['0', '27', '-1', 'four', '2.5']) {
  check(`weeks refuses "${bad}" rather than coercing it`, (() => {
    try { parseWeeks(bad); return false; } catch (e) { return e.name === 'ValidationError' && Boolean(e.fields.weeks); }
  })());
}
check('levelId is optional', parseLevelId(null) === null);
check('levelId refuses anything that is not a whole number', (() => {
  try { parseLevelId('3; DROP'); return false; } catch (e) { return e.name === 'ValidationError'; }
})());

// ---------------------------------------------------------------------
// 10 · THE ROUTES, WITH REAL TOKENS
// ---------------------------------------------------------------------
const b64url = (bytes) => Buffer.from(bytes).toString('base64')
  .replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
const enc = (obj) => b64url(new TextEncoder().encode(JSON.stringify(obj)));
const kp = await crypto.subtle.generateKey(
  { name: 'RSASSA-PKCS1-v1_5', modulusLength: 2048, publicExponent: new Uint8Array([1, 0, 1]), hash: 'SHA-256' },
  true, ['sign', 'verify'],
);
const jwk = { ...(await crypto.subtle.exportKey('jwk', kp.publicKey)), kid: 'kid-1', alg: 'RS256', use: 'sig' };
globalThis.fetch = async () => ({ ok: true, status: 200, json: async () => ({ keys: [jwk] }) });
async function token(sub) {
  const h = enc({ alg: 'RS256', typ: 'JWT', kid: 'kid-1' });
  const t = Math.floor(Date.now() / 1000);
  const p = enc({ sub, email: `${sub}@example.com`, email_verified: true, iat: t - 5, exp: t + 600 });
  const sig = await crypto.subtle.sign('RSASSA-PKCS1-v1_5', kp.privateKey, new TextEncoder().encode(`${h}.${p}`));
  return `${h}.${p}.${b64url(new Uint8Array(sig))}`;
}
const TOK = {
  learner: await token('sub_learner'), other: await token('sub_other'),
  tutor: await token('sub_tutor'), stranger: await token('sub_stranger'),
  admin: await token('sub_admin'),
};
const get = (url, tok) => new Request(url, tok ? { headers: { Authorization: `Bearer ${tok}` } } : undefined);
const post = (url, tok, body) => new Request(url, {
  method: 'POST', headers: { Authorization: `Bearer ${tok}`, 'Content-Type': 'application/json' },
  body: JSON.stringify(body),
});
const BASE = 'https://wec-lc.test/api';

check('GET /api/student/attendance refuses an unauthenticated caller',
  (await student.onRequestGet({ request: get(`${BASE}/student/attendance`), env })).status === 401);

const src = readFileSync(loadUrl('functions/api/student/attendance.js'), 'utf8');
check('the learner route reads no subject from the URL — own-data-only by construction',
  !/searchParams\.get\(\s*['"](userId|user_id|studentId|learnerId|id)['"]\s*\)/.test(src));

const mine = await student.onRequestGet({ request: get(`${BASE}/student/attendance`, TOK.learner), env });
const minePayload = await mine.json();
check('a learner gets their own record, notice first',
  mine.status === 200 && minePayload.learner.userId === 'usr_learner'
  && Boolean(minePayload.engagementNotice.statement));
check('a userId in the query string is simply not a parameter this route has',
  (await (await student.onRequestGet({
    request: get(`${BASE}/student/attendance?userId=usr_other`, TOK.learner), env,
  })).json()).learner.userId === 'usr_learner');
check('a bad weeks parameter is a 422 with the field named, not a 500',
  (await student.onRequestGet({ request: get(`${BASE}/student/attendance?weeks=99`, TOK.learner), env })).status === 422);
check('a level the caller is not enrolled at is a 404, not somebody else\'s grid',
  (await student.onRequestGet({ request: get(`${BASE}/student/attendance?levelId=6`, TOK.learner), env })).status === 404);

const noEnrol = await student.onRequestGet({ request: get(`${BASE}/student/attendance`, TOK.other), env });
const noEnrolBody = await noEnrol.json();
check('a learner with no enrolment still gets the notice and a reason, not an error',
  noEnrol.status === 200 && Boolean(noEnrolBody.engagementNotice.statement)
  && /no start date to anchor/.test(noEnrolBody.reason) && noEnrolBody.windows.length === 0);

check('GET /api/staff/attendance refuses an unauthenticated caller',
  (await staffRoute.onRequestGet({ request: get(`${BASE}/staff/attendance`), env })).status === 401);
check('POST /api/staff/attendance refuses an unauthenticated caller',
  (await staffRoute.onRequestPost({ request: new Request(`${BASE}/staff/attendance`, { method: 'POST', body: '{}' }), env })).status === 401);
check('a learner cannot reach the staff endpoint at all',
  (await staffRoute.onRequestGet({ request: get(`${BASE}/staff/attendance`, TOK.learner), env })).status === 403);

const roster = await staffRoute.onRequestGet({ request: get(`${BASE}/staff/attendance`, TOK.tutor), env });
const rosterBody = await roster.json();
check('a tutor\'s roster is their own learners and nobody else\'s',
  roster.status === 200 && rosterBody.learners.length === 1 && rosterBody.learners[0].userId === 'usr_learner');
check('a member of staff with no teaching act gets an empty roster, not the college',
  (await (await staffRoute.onRequestGet({ request: get(`${BASE}/staff/attendance`, TOK.stranger), env })).json()).learners.length === 0);
check('an administrator reads the whole register, and the payload says on what basis',
  (await (await staffRoute.onRequestGet({ request: get(`${BASE}/staff/attendance`, TOK.admin), env })).json()).basis === 'admin');
check('a bad limit is a 422 with the field named',
  (await staffRoute.onRequestGet({ request: get(`${BASE}/staff/attendance?limit=5000`, TOK.tutor), env })).status === 422);

const tutorRead = await staffRoute.onRequestGet({ request: get(`${BASE}/staff/attendance?userId=usr_learner`, TOK.tutor), env });
const tutorBody = await tutorRead.json();
check('a tutor reads their own learner\'s record',
  tutorRead.status === 200 && tutorBody.learner.userId === 'usr_learner'
  && tutorBody.authorisation.basis === 'teaching_relation');
check('and the staff view carries the same notice the learner sees',
  tutorBody.engagementNotice.statement === minePayload.engagementNotice.statement);
check('a member of staff with no teaching relation is refused that learner — 403',
  (await staffRoute.onRequestGet({ request: get(`${BASE}/staff/attendance?userId=usr_learner`, TOK.stranger), env })).status === 403);
check('and so is a tutor asking for a learner who is not theirs',
  (await staffRoute.onRequestGet({ request: get(`${BASE}/staff/attendance?userId=usr_other`, TOK.tutor), env })).status === 403);
check('an administrator may read any learner',
  (await staffRoute.onRequestGet({ request: get(`${BASE}/staff/attendance?userId=usr_learner`, TOK.admin), env })).status === 200);

check('a tutor cannot write against a learner who is not theirs',
  (await staffRoute.onRequestPost({
    request: post(`${BASE}/staff/attendance`, TOK.tutor, {
      userId: 'usr_other', basis: 'module_engagement', unitId: 'unt_1',
      windowStart: '2026-03-08T00:00:00.000Z', windowEnd: '2026-03-15T00:00:00.000Z',
      state: 'attended', reason: 'Told me by email.',
    }), env,
  })).status === 403);
check('a POST with no userId is refused before anything is looked up',
  (await staffRoute.onRequestPost({ request: post(`${BASE}/staff/attendance`, TOK.tutor, {}), env })).status === 422);

const posted = await staffRoute.onRequestPost({
  request: post(`${BASE}/staff/attendance`, TOK.tutor, {
    userId: 'usr_learner', basis: 'module_engagement', unitId: 'unt_5',
    windowStart: '2026-03-22T00:00:00.000Z', windowEnd: '2026-03-29T00:00:00.000Z',
    state: 'attended', reason: 'Studied from the printed workbook while offline; confirmed in tutorial.',
  }), env,
});
const postedBody = await posted.json();
check('a tutor may state an engagement fact the platform could not see',
  posted.status === 201 && postedBody.record.state === 'attended'
  && postedBody.record.recordedBy === 'usr_tutor');
check('and the platform\'s own reading of that same window is returned beside it',
  postedBody.derived.state === 'absent' && postedBody.superseded === null);

check('a malformed JSON body is a 422, not a 500',
  (await staffRoute.onRequestPost({
    request: new Request(`${BASE}/staff/attendance`, {
      method: 'POST', headers: { Authorization: `Bearer ${TOK.tutor}`, 'Content-Type': 'application/json' },
      body: '{not json',
    }), env,
  })).status === 422);

console.log(`\n${pass} passed, ${fail} failed.`);
process.exit(fail ? 1 : 0);
