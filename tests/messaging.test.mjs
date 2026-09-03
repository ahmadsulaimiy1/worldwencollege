// Run with: node --experimental-sqlite tests/messaging.test.mjs
//
// LEARNER-TO-TUTOR MESSAGING, AND THE FOUR FAILURES THAT WOULD LEAVE
// EVERYTHING ELSE WORKING PERFECTLY.
//
// Most of what follows is ordinary — a validator refuses a bad value, a
// status moves, a reply lands. The file is long because four of the
// defects worth catching here are silent, and a silent defect in this
// particular feature is not a cosmetic one:
//
//  1. THE THREAD THAT WIDENS BY ONE ROW. functions/_lib/academic/
//     attendance.js decides which learners a member of staff may read
//     PARTLY FROM WHO SHARES AN OPEN THREAD WITH THEM. So a participant
//     row is not a chat detail; it is a grant of read access to a
//     learner's engagement record. Everything about who may be added to
//     a thread is therefore asserted from both ends — the learner cannot
//     name a person at all, staff can name only a learner they already
//     teach — and § 9 closes the loop by proving the grant is real, so
//     that nobody can later relax the recipient rules believing they are
//     only about tidiness.
//
//  2. THE QUERY THAT ANSWERS "NOT YOURS" OUT LOUD. A thread the caller
//     is not party to must be indistinguishable from a thread id that was
//     never issued, or the path is an oracle for which conversations
//     exist and between whom. So the outsider's 404 is asserted against a
//     fabricated id's 404 — same status, same message, byte for byte —
//     and the response body is asserted not to contain the subject line
//     it was refused.
//
//  3. THE WATERMARK SET TO THE CLOCK. `last_read_at` moved to `now`
//     marks read whatever arrived between the SELECT and the UPDATE: a
//     message the reader was never shown, with no badge left to bring
//     them back. It is asserted by reading a thread with a `now` an hour
//     past its last message and checking the watermark landed on the
//     MESSAGE, not the clock — the case where the wrong implementation
//     looks perfect in every hand test.
//
//  4. THE CAP THAT LIVES IN THE UI. Thread creation is capped in the
//     data layer, so it is asserted by calling the module in a loop — the
//     shape a second client, a replay or a curl loop would take — and the
//     refusal is asserted to carry the exact instant the next one may be
//     opened, because "try again later" is what a cap says when nobody
//     wrote down what it does.
//
// Every guard the module holds for a column nothing yet writes —
// `withdrawn_at`, `closed_at`, `left_at` — is driven by setting that
// column directly. Those guards exist before their setters on purpose,
// and a guard nothing exercises is a guard that will be refactored away.
import { readFileSync } from 'node:fs';
import { makeD1 } from './d1-shim.mjs';
import { ROOT, loadUrl } from './helpers.mjs';

let pass = 0, fail = 0;
const check = (label, cond, detail) => {
  console.log((cond ? 'PASS ' : 'FAIL ') + label + (cond || detail === undefined ? '' : ` — ${detail}`));
  cond ? pass++ : fail++;
};

const lib = await import(loadUrl('functions/_lib/comms/threads.js'));
const {
  SCOPES, THREAD_STATUSES, PARTIES, RECIPIENTS, MESSAGE_FORMAT,
  MAX_SUBJECT, MAX_BODY, LEARNER_THREADS_PER_WINDOW, ROLLING_WINDOW_HOURS,
  assertProse, parseLimit, openableBy, threadAllowance,
  listThreads, openThread, readThread, replyToThread,
} = lib;
const collection = await import(loadUrl('functions/api/messages/index.js'));
const one = await import(loadUrl('functions/api/messages/[thread].js'));
const { assertMayReadLearner } = await import(loadUrl('functions/_lib/academic/attendance.js'));

const schemaText = readFileSync(new URL('sql/schema.sql', `file://${ROOT}/`), 'utf8');
const env = { DB: makeD1(schemaText), CLERK_JWKS_URL: 'https://stub.clerk.accounts.dev/.well-known/jwks.json' };
const sql = (text, ...args) => env.DB.prepare(text).bind(...args).run();
const row = (text, ...args) => env.DB.prepare(text).bind(...args).first();

/** Collect a refusal without letting a missing one look like a pass. */
async function refusal(fn) {
  try {
    await fn();
    return { name: 'no error', fields: {}, message: '', status: 0 };
  } catch (e) {
    return { name: e.name, fields: e.fields || {}, message: e.message, status: e.httpStatus, allowance: e.allowance };
  }
}

// ---------------------------------------------------------------------
// 0 · THE VOCABULARY IS THE SCHEMA'S
// ---------------------------------------------------------------------
// A restated CHECK constraint is a constant that will drift, and a
// drifted one turns a 422 naming a field into a 500 naming SQLite. Each
// list is read back out of sql/schema.sql rather than trusted.
const checkList = (table, column) => {
  const block = schemaText.slice(schemaText.indexOf(`CREATE TABLE ${table} (`));
  const m = block.match(new RegExp(`${column}\\s+TEXT[^,]*?CHECK \\(${column} IN \\(([^)]*)\\)`, 's'));
  return m ? m[1].split(',').map((s) => s.trim().replace(/^'|'$/g, '')) : null;
};

check('SCOPES restates message_threads.scope exactly',
  JSON.stringify(SCOPES) === JSON.stringify(checkList('message_threads', 'scope')),
  JSON.stringify(checkList('message_threads', 'scope')));
check('THREAD_STATUSES restates message_threads.status exactly',
  JSON.stringify(THREAD_STATUSES) === JSON.stringify(checkList('message_threads', 'status')),
  JSON.stringify(checkList('message_threads', 'status')));
check('PARTIES restates message_participants.party exactly',
  JSON.stringify(PARTIES) === JSON.stringify(checkList('message_participants', 'party')),
  JSON.stringify(checkList('message_participants', 'party')));
check('RECIPIENTS holds two offices and one person, and nothing else',
  JSON.stringify(RECIPIENTS) === JSON.stringify(['tutors', 'registrar', 'learner']),
  JSON.stringify(RECIPIENTS));
check('the message format is declared, and it is plain text',
  MESSAGE_FORMAT === 'text/plain');

// ---------------------------------------------------------------------
// 1 · THE FIXTURES
// ---------------------------------------------------------------------
const T0 = '2026-08-20T09:00:00.000Z';
const T1 = '2026-08-20T10:00:00.000Z';
const T2 = '2026-08-20T11:00:00.000Z';
const T3 = '2026-08-20T12:00:00.000Z';

const person = (id, sub, role, name, created = '2026-01-01T00:00:00.000Z') =>
  sql(`INSERT INTO users (id, auth_provider, auth_provider_id, email, email_verified, role, preferred_name, created_at)
       VALUES (?, 'clerk', ?, ?, 1, ?, ?, ?)`, id, sub, `${sub}@placeholder.invalid`, role, name, created);

person('usr_learner', 'sub_learner', 'student', 'Learner A');
person('usr_outsider', 'sub_outsider', 'student', 'Learner B');
person('usr_rate', 'sub_rate', 'student', 'Learner C');
person('usr_upper', 'sub_upper', 'student', 'Learner D');
person('usr_tutor', 'sub_tutor', 'staff', 'Tutor A', '2026-01-02T00:00:00.000Z');
person('usr_former', 'sub_former', 'staff', 'Tutor B', '2026-01-03T00:00:00.000Z');
person('usr_stranger', 'sub_stranger', 'staff', 'Tutor C', '2026-01-04T00:00:00.000Z');
person('usr_lapsed', 'sub_lapsed', 'staff', 'Tutor D', '2026-01-05T00:00:00.000Z');
person('usr_admin', 'sub_admin', 'admin', 'Administrator A', '2026-01-06T00:00:00.000Z');

const enrol = (id, user, level, status = 'active') =>
  sql(`INSERT INTO enrolments (id, user_id, level_id, status, started_at, created_at)
       VALUES (?, ?, ?, ?, ?, ?)`, id, user, level, status, '2026-06-01T00:00:00.000Z', '2026-06-01T00:00:00.000Z');

enrol('enr_learner', 'usr_learner', 3);
enrol('enr_outsider', 'usr_outsider', 3);
enrol('enr_rate', 'usr_rate', 3);
enrol('enr_upper', 'usr_upper', 5);
// A withdrawn enrolment is not a live one, by the same definition
// announcements.js uses: idx_enrolments_one_live_per_level is partial on
// status != 'withdrawn'.
enrol('enr_learner_gone', 'usr_learner', 1, 'withdrawn');

// crs_level_N is seeded by sql/schema.sql; units are not.
sql(`INSERT INTO units (id, course_id, sequence, title) VALUES ('unt_l3','crs_level_3',1,'Conditionals')`);
sql(`INSERT INTO units (id, course_id, sequence, title) VALUES ('unt_l4','crs_level_4',1,'Register and Tone')`);

// The teaching acts the recipient set is composed from.
sql(`INSERT INTO live_sessions (id, level_id, unit_id, host_user_id, title, starts_at)
     VALUES ('lsn_1', 3, 'unt_l3', 'usr_tutor', 'Conditionals clinic', '2026-08-01T09:00:00.000Z')`);
sql(`INSERT INTO tutorial_slots (id, tutor_id, level_id, title, kind, starts_at, duration_minutes, capacity, status, created_at)
     VALUES ('slt_1', 'usr_former', 3, 'Office hour', 'office_hour', '2026-08-05T09:00:00.000Z', 30, 4, 'open', '2026-07-01T00:00:00.000Z')`);
// Level V only — usr_lapsed must be reachable there and nowhere else,
// and is demoted in § 2 to prove role is re-checked at read time.
sql(`INSERT INTO live_sessions (id, level_id, host_user_id, title, starts_at)
     VALUES ('lsn_5', 5, 'usr_lapsed', 'Advanced seminar', '2026-08-02T09:00:00.000Z')`);
// usr_stranger teaches at Level IV: staff, but nothing to do with anyone here.
sql(`INSERT INTO live_sessions (id, level_id, host_user_id, title, starts_at)
     VALUES ('lsn_4', 4, 'usr_stranger', 'Register workshop', '2026-08-03T09:00:00.000Z')`);

const learner = row('SELECT * FROM users WHERE id = ?', 'usr_learner');
const outsider = row('SELECT * FROM users WHERE id = ?', 'usr_outsider');
const rateLearner = row('SELECT * FROM users WHERE id = ?', 'usr_rate');
const upperLearner = row('SELECT * FROM users WHERE id = ?', 'usr_upper');
const tutor = row('SELECT * FROM users WHERE id = ?', 'usr_tutor');
const former = row('SELECT * FROM users WHERE id = ?', 'usr_former');
const stranger = row('SELECT * FROM users WHERE id = ?', 'usr_stranger');
const admin = row('SELECT * FROM users WHERE id = ?', 'usr_admin');

// ---------------------------------------------------------------------
// 2 · WHO AN OFFICE RESOLVES TO — and who it stops resolving to
// ---------------------------------------------------------------------
const canOpen = await openableBy(env, { user: learner });
check('a learner is told which desks they may write to, without asking',
  canOpen.length === 2 && canOpen.every((o) => o.levelId === 3), JSON.stringify(canOpen.map((o) => o.recipient)));
check('...the tutors of the level they are enrolled in are reachable',
  canOpen.find((o) => o.recipient === 'tutors').reachable === 2,
  canOpen.find((o) => o.recipient === 'tutors').reachable);
check("...and the Registrar's desk is reachable",
  canOpen.find((o) => o.recipient === 'registrar').reachable === 1);
check('a withdrawn enrolment offers no desk at all — Level I is absent',
  !canOpen.some((o) => o.levelId === 1));
check('the desk is named as a desk; no person is published into an office',
  canOpen.find((o) => o.recipient === 'registrar').desk === "The Registrar's desk"
  && !JSON.stringify(canOpen).includes('Administrator A'));
check('a count of tutors, never a roster — no tutor is named to a learner',
  !JSON.stringify(canOpen).includes('Tutor A') && !JSON.stringify(canOpen).includes('Tutor B'));
check('a member of staff is told they address a learner, and by which parameter',
  (await openableBy(env, { user: tutor }))[0].requires === 'learnerId');

// The role re-check, driven by demoting somebody who is otherwise reachable.
const upperBefore = await openableBy(env, { user: upperLearner });
check('a tutor with a teaching act at Level V is reachable there',
  upperBefore.find((o) => o.recipient === 'tutors').reachable === 1);
sql("UPDATE users SET role = 'student' WHERE id = 'usr_lapsed'");
const upperAfter = await openableBy(env, { user: upperLearner });
check('...and stops being reachable the moment staff access is revoked, with no teaching row changed',
  upperAfter.find((o) => o.recipient === 'tutors').reachable === 0);
check('the live session that made them reachable is still on the record',
  row("SELECT host_user_id AS h FROM live_sessions WHERE id = 'lsn_5'").h === 'usr_lapsed');

const noTutor = await refusal(() => openThread(env, {
  user: upperLearner,
  body: { subject: 'Anybody there', body: 'A question about the seminar.', scope: 'level', levelId: 5, recipient: 'tutors' },
  now: T0,
}));
check('with no tutor to resolve to, the message is refused rather than silently redirected',
  noTutor.name === 'ValidationError' && /No tutor has yet taught at Level V/.test(noTutor.fields.recipient),
  noTutor.fields.recipient);
check('...and the refusal names the route that is always open',
  /registrar/.test(noTutor.fields.recipient));
check('nothing was written by the refused request',
  row('SELECT COUNT(*) AS n FROM message_threads').n === 0);

// ---------------------------------------------------------------------
// 3 · THE BODY IS TEXT — stored as typed, never as markup
// ---------------------------------------------------------------------
{
  const fields = {};
  check('a body is required', assertProse(undefined, 'body', MAX_BODY, fields) === null && fields.body === 'Required');
}
{
  const fields = {};
  check('whitespace alone is not a message',
    assertProse('   \n  ', 'body', MAX_BODY, fields) === null && fields.body === 'Required');
}
{
  const fields = {};
  check(`a body longer than ${MAX_BODY} is refused, not truncated`,
    assertProse('x'.repeat(MAX_BODY + 1), 'body', MAX_BODY, fields) === null
    && /At most 5000/.test(fields.body));
}
{
  const fields = {};
  check('the record separator announcements.js reserves cannot be smuggled into a message',
    assertProse(`a${String.fromCharCode(0x1e)}b`, 'body', MAX_BODY, fields) === null
    && /control characters/.test(fields.body));
}
{
  const fields = {};
  check('a NUL is refused', assertProse(`a${String.fromCharCode(0)}b`, 'body', MAX_BODY, fields) === null);
}
{
  const fields = {};
  check('CRLF is folded to LF — the one coercion, and it is invisible to a reader',
    assertProse('one\r\ntwo', 'body', MAX_BODY, fields) === 'one\ntwo');
}
{
  const fields = {};
  const markup = '<script>alert(1)</script> & <b>bold</b>';
  check('markup is neither stripped nor escaped — it is stored as the characters that were typed',
    assertProse(markup, 'body', MAX_BODY, fields) === markup);
}
check('a subject is a line, not a message', MAX_SUBJECT === 160 && MAX_BODY === 5000);

// ---------------------------------------------------------------------
// 4 · OPENING A THREAD — the office, and nowhere to put a person
// ---------------------------------------------------------------------
const OPEN = {
  subject: 'The second conditional',
  body: 'When is the second conditional used rather than the first?',
  scope: 'level',
  levelId: 3,
  recipient: 'tutors',
};

for (const [key, value] of [
  ['userId', 'usr_tutor'], ['recipientId', 'usr_tutor'], ['tutorId', 'usr_tutor'],
  ['participants', ['usr_tutor']], ['studentId', 'usr_outsider'],
]) {
  const r = await refusal(() => openThread(env, { user: learner, body: { ...OPEN, [key]: value }, now: T0 }));
  check(`\`${key}\` is refused rather than ignored — a dropped parameter is a client built on a model the server never had`,
    r.name === 'ValidationError' && Boolean(r.fields[key]), `${r.name}: ${JSON.stringify(r.fields)}`);
}
for (const key of ['html', 'bodyHtml', 'format']) {
  const r = await refusal(() => openThread(env, { user: learner, body: { ...OPEN, [key]: '<b>x</b>' }, now: T0 }));
  check(`\`${key}\` is refused — a caller who sends markup has misunderstood what is stored`,
    r.name === 'ValidationError' && Boolean(r.fields[key]), JSON.stringify(r.fields));
}
{
  const r = await refusal(() => openThread(env, { user: learner, body: { ...OPEN, recipient: 'learner' }, now: T0 }));
  check('a learner may not address another learner',
    r.name === 'ValidationError' && /not to another learner/.test(r.fields.recipient));
}
{
  const r = await refusal(() => openThread(env, { user: learner, body: { ...OPEN, recipient: 'anybody' }, now: T0 }));
  check('an unrecognised recipient is refused by name',
    r.name === 'ValidationError' && /One of tutors, registrar, learner/.test(r.fields.recipient));
}
{
  const r = await refusal(() => openThread(env, { user: learner, body: { ...OPEN, learnerId: 'usr_outsider' }, now: T0 }));
  check('a learner naming a learnerId is told the endpoint addresses an office',
    r.name === 'ValidationError' && /office, not a person/.test(r.fields.learnerId));
}
{
  const r = await refusal(() => openThread(env, { user: learner, body: { ...OPEN, levelId: 4 }, now: T0 }));
  check('a level with no live enrolment behind it carries no thread',
    r.name === 'ValidationError' && /live enrolment/.test(r.fields.levelId));
}
{
  const r = await refusal(() => openThread(env, { user: learner, body: { ...OPEN, levelId: 1 }, now: T0 }));
  check('...and a WITHDRAWN enrolment is not a live one',
    r.name === 'ValidationError' && Boolean(r.fields.levelId));
}
{
  const r = await refusal(() => openThread(env, { user: learner, body: { ...OPEN, scope: 'assignment' }, now: T0 }));
  check('a scope the schema does not hold is refused by name',
    r.name === 'ValidationError' && /One of level, module/.test(r.fields.scope));
}
{
  const r = await refusal(() => openThread(env, { user: learner, body: { ...OPEN, unitId: 'unt_l3' }, now: T0 }));
  check('a level-scoped thread naming a module is refused, not quietly re-scoped',
    r.name === 'ValidationError' && Boolean(r.fields.unitId));
}
{
  const r = await refusal(() => openThread(env, {
    user: learner, body: { ...OPEN, scope: 'module', levelId: 3, unitId: 'unt_l3' }, now: T0,
  }));
  check('a module-scoped thread may not also state a level — the unit already knows it',
    r.name === 'ValidationError' && /takes its level from the module/.test(r.fields.levelId));
}
{
  const r = await refusal(() => openThread(env, {
    user: learner, body: { ...OPEN, scope: 'module', levelId: undefined, unitId: 'unt_l4' }, now: T0,
  }));
  check('a module of a level the learner is not enrolled in is refused',
    r.name === 'ValidationError' && /not a module of a level you are enrolled in/i.test(r.fields.unitId));
}
{
  const r = await refusal(() => openThread(env, { user: learner, body: { ...OPEN, subject: '', body: '' }, now: T0 }));
  check('an empty subject and an empty body are reported together, so a form highlights both',
    r.name === 'ValidationError' && r.fields.subject === 'Required' && r.fields.body === 'Required');
}
check('every refusal so far has written nothing',
  row('SELECT COUNT(*) AS n FROM message_threads').n === 0
  && row('SELECT COUNT(*) AS n FROM messages').n === 0);

// The happy path.
const opened = await openThread(env, { user: learner, body: OPEN, now: T1 });
const THREAD = opened.thread.id;
check('a learner opens a thread with the tutors of their level',
  opened.thread.subject === OPEN.subject && opened.thread.status === 'open');
check('...and the thread is scoped to the level, never floating',
  opened.thread.scope === 'level' && opened.thread.levelId === 3 && opened.thread.levelRoman === 'III');
check('...the desk it was addressed to is named back',
  opened.desk === 'The tutors of this level');
check('...both tutors of that level are in it, and nobody else',
  opened.thread.participants.length === 3
  && opened.thread.participants.filter((p) => p.party === 'tutor').length === 2);
check('...the learner is party to it as a learner',
  opened.thread.participants.find((p) => p.isYou).party === 'learner');
check('...the tutor who teaches Level IV is not in it',
  !opened.thread.participants.some((p) => p.userId === 'usr_stranger'));
check('...the opening message is in it, as typed',
  opened.messages.length === 1 && opened.messages[0].body === OPEN.body);
check('...and the payload declares the format a renderer must not reinterpret',
  opened.format === 'text/plain');
check('the thread carries no email address for anybody in it',
  !JSON.stringify(opened).includes('@placeholder.invalid'));
check('added_by names who brought each participant in, and is NULL for the opener',
  row('SELECT added_by AS a FROM message_participants WHERE thread_id = ? AND user_id = ?', THREAD, 'usr_learner').a === null
  && row('SELECT added_by AS a FROM message_participants WHERE thread_id = ? AND user_id = ?', THREAD, 'usr_tutor').a === 'usr_learner');
check('last_message_at was written with the message, not left behind',
  row('SELECT last_message_at AS l FROM message_threads WHERE id = ?', THREAD).l === T1);

// A module-scoped thread stores the unit and NOT the level, exactly as
// migration 020 instructs — the unit already knows its level and must not
// be able to contradict it.
const moduleThread = await openThread(env, {
  user: learner,
  body: { subject: 'Conditionals unit', body: 'Is exercise four assessed?', scope: 'module', unitId: 'unt_l3', recipient: 'tutors' },
  now: T1,
});
check('a module-scoped thread names the module',
  moduleThread.thread.scope === 'module' && moduleThread.thread.unitId === 'unt_l3'
  && moduleThread.thread.unitTitle === 'Conditionals');
check('...and stores a NULL level_id, so it cannot contradict the unit',
  row('SELECT level_id AS l FROM message_threads WHERE id = ?', moduleThread.thread.id).l === null);
check('...while the payload still resolves the level for the reader',
  moduleThread.thread.levelId === 3 && moduleThread.thread.levelRoman === 'III');

// The Registrar's desk.
const registrarThread = await openThread(env, {
  user: learner,
  body: { subject: 'A question about my fee instalment', body: 'May I move the second instalment?', scope: 'level', levelId: 3, recipient: 'registrar' },
  now: T1,
});
check("a learner may write to the Registrar's desk",
  registrarThread.desk === "The Registrar's desk");
check('...and the desk resolves to administrator access, with party recorded as registrar',
  registrarThread.thread.participants.some((p) => p.userId === 'usr_admin' && p.party === 'registrar'));
check('...no tutor is dragged into a registrar thread',
  !registrarThread.thread.participants.some((p) => p.party === 'tutor'));

// ---------------------------------------------------------------------
// 5 · THE MEMBERSHIP ROW IS THE AUTHORISATION
// ---------------------------------------------------------------------
const outsiderRead = await refusal(() => readThread(env, { user: outsider, threadId: THREAD, now: T2 }));
const phantomRead = await refusal(() => readThread(env, { user: outsider, threadId: 'mth_does_not_exist', now: T2 }));
check('a learner reading a thread they are not in is refused',
  outsiderRead.name === 'NotFoundError' && outsiderRead.status === 404, outsiderRead.name);
check('...with the IDENTICAL answer a fabricated thread id gets — no oracle',
  outsiderRead.message === phantomRead.message && outsiderRead.status === phantomRead.status,
  `${outsiderRead.message} vs ${phantomRead.message}`);
check('a learner replying into a thread they are not in is refused the same way',
  (await refusal(() => replyToThread(env, { user: outsider, threadId: THREAD, body: { body: 'Hello' }, now: T2 }))).name === 'NotFoundError');
check('...and nothing of theirs reached the messages table',
  row('SELECT COUNT(*) AS n FROM messages WHERE sender_id = ?', 'usr_outsider').n === 0);
check('the outsider is at the same level as the learner — enrolment is not membership',
  row('SELECT level_id AS l FROM enrolments WHERE user_id = ?', 'usr_outsider').l === 3);

const outsiderList = await listThreads(env, { user: outsider, now: T2 });
check('a learner in no threads has an empty list and a zero badge',
  outsiderList.threads.length === 0 && outsiderList.unread === 0);
check('...and their list does not mention a thread they cannot read',
  !JSON.stringify(outsiderList).includes('The second conditional'));

const strangerList = await listThreads(env, { user: stranger, now: T2 });
check('a member of staff sees only the threads they are a participant in — not every thread at their levels',
  strangerList.threads.length === 0);

const tutorList = await listThreads(env, { user: tutor, now: T2 });
check('the tutor who was added sees the threads they were added to',
  tutorList.threads.length === 2 && tutorList.threads.every((t) => t.you.party === 'tutor'));
check('...and not the registrar thread they were never added to',
  !tutorList.threads.some((t) => t.id === registrarThread.thread.id));

// ---------------------------------------------------------------------
// 6 · UNREAD, AND THE WATERMARK THAT IS NOT THE CLOCK
// ---------------------------------------------------------------------
check('an unread message is unread to the person who did not send it',
  tutorList.unread === 2 && tutorList.threads.find((t) => t.id === THREAD).unread === 1);
const learnerListBefore = await listThreads(env, { user: learner, now: T2 });
check('...and is never unread to its own sender',
  learnerListBefore.unread === 0);

const tutorRead = await readThread(env, { user: tutor, threadId: THREAD, now: T3 });
check('reading a thread clears its unread for the reader',
  tutorRead.thread.unread === 0);
check('...and the watermark landed on the last message returned, NOT on the clock',
  row('SELECT last_read_at AS r FROM message_participants WHERE thread_id = ? AND user_id = ?', THREAD, 'usr_tutor').r === T1,
  `watermark ${row('SELECT last_read_at AS r FROM message_participants WHERE thread_id = ? AND user_id = ?', THREAD, 'usr_tutor').r} (clock was ${T3})`);
check('...while the other thread stays unread — reading one is not reading all',
  (await listThreads(env, { user: tutor, now: T3 })).unread === 1);

const replied = await replyToThread(env, {
  user: tutor, threadId: THREAD, body: { body: 'For an unreal or unlikely present. Compare unit 4.' }, now: T2,
});
check('a tutor replies in a thread they are party to', replied.messageId.startsWith('msg_'));
check("...and the desk's reply marks the thread answered, not closed",
  replied.status === 'answered' && row('SELECT status AS s FROM message_threads WHERE id = ?', THREAD).s === 'answered');
check('...the thread rises to the top of the list by last_message_at',
  row('SELECT last_message_at AS l FROM message_threads WHERE id = ?', THREAD).l === T2);
check('...and the replier is not left with an unread message of their own',
  (await listThreads(env, { user: tutor, now: T3 })).threads.find((t) => t.id === THREAD).unread === 0);

const learnerAfter = await listThreads(env, { user: learner, now: T3 });
check('the learner now has one unread, and it is the reply',
  learnerAfter.unread === 1 && learnerAfter.threads.find((t) => t.id === THREAD).unread === 1);
check('the list carries a preview of the last thing said, not the whole of it',
  learnerAfter.threads.find((t) => t.id === THREAD).preview.startsWith('For an unreal'));

const learnerFollowUp = await replyToThread(env, {
  user: learner, threadId: THREAD, body: { body: 'Thank you — and in reported speech?' }, now: T3,
});
check("...and a learner's further word puts an answered thread back to open",
  learnerFollowUp.status === 'open' && row('SELECT status AS s FROM message_threads WHERE id = ?', THREAD).s === 'open');

// The badge is a separate statement over the same predicate, and is not
// capped by the page size. A count taken from the returned rows would
// look right in every hand test and be wrong in production — which is why
// it is asserted here, where the tutor has unread in TWO threads and is
// being handed one.
{
  const capped = await listThreads(env, { user: tutor, limit: 1, now: T3 });
  check('the badge counts every unread message, not the ones that fit on the page',
    capped.returned === 1 && capped.unread === 2, `returned ${capped.returned}, unread ${capped.unread}`);
}

// The watermark must never run backwards: re-reading an old thread
// cannot un-read what arrived after it.
await readThread(env, { user: tutor, threadId: THREAD, now: T3 });
const watermarkNow = row('SELECT last_read_at AS r FROM message_participants WHERE thread_id = ? AND user_id = ?', THREAD, 'usr_tutor').r;
check('the watermark moved forward to the newest message on the page',
  watermarkNow === T3, watermarkNow);
await readThread(env, { user: tutor, threadId: THREAD, limit: 1, now: T3 });
check('...and a short page of an old thread cannot drag it backwards',
  row('SELECT last_read_at AS r FROM message_participants WHERE thread_id = ? AND user_id = ?', THREAD, 'usr_tutor').r === T3);

// Ordering and the truncation notice.
{
  const full = await readThread(env, { user: learner, threadId: THREAD, now: T3 });
  check('messages are returned oldest-first, so a conversation reads as one',
    full.messages[0].sentAt <= full.messages[full.messages.length - 1].sentAt
    && full.messages.length === 3);
  check('...and the reader is told which of them is theirs',
    full.messages[0].sender.isYou === true && full.messages[1].sender.isYou === false);
  const window = await readThread(env, { user: learner, threadId: THREAD, limit: 1, now: T3 });
  check('a capped read returns the LIVE end of the thread, not its beginning',
    window.messages.length === 1 && window.messages[0].body === 'Thank you — and in reported speech?');
  check('...and says so, rather than presenting a slice as the whole',
    window.truncated === true && full.truncated === false);
}

// ---------------------------------------------------------------------
// 7 · WITHDRAWN, CLOSED, AND THE PARTICIPANT WHO LEFT
// ---------------------------------------------------------------------
// Nothing in functions/ yet writes any of these three columns. The guards
// are asserted anyway, because a guard added AFTER the endpoint that sets
// the column is a guard added after the access was granted.
{
  const msgId = row('SELECT id AS i FROM messages WHERE thread_id = ? ORDER BY sent_at ASC LIMIT 1', THREAD).i;
  sql("UPDATE messages SET withdrawn_at = ?, withdrawn_reason = ? WHERE id = ?",
    T3, 'Sent to the wrong thread', msgId);
  const after = await readThread(env, { user: tutor, threadId: THREAD, now: T3 });
  const withdrawn = after.messages.find((m) => m.id === msgId);
  check('a withdrawn message keeps its place, its sender and its reason',
    withdrawn.withdrawn === true && withdrawn.withdrawnReason === 'Sent to the wrong thread'
    && withdrawn.sender.userId === 'usr_learner');
  check('...and loses its text — withdrawal that returns the body is decorative',
    withdrawn.body === null && !JSON.stringify(after).includes('When is the second conditional used'));
  check('...the row itself is not deleted; a message that vanishes cannot be proved',
    row('SELECT body AS b FROM messages WHERE id = ?', msgId).b === OPEN.body);
  check('...and it is not counted as unread by anybody, because its text will never be shown',
    (await listThreads(env, { user: outsider, now: T3 })).unread === 0);
}
{
  const list = await listThreads(env, { user: learner, now: T3 });
  const t = list.threads.find((x) => x.id === moduleThread.thread.id);
  sql("UPDATE messages SET withdrawn_at = ?, withdrawn_reason = ? WHERE thread_id = ?",
    T3, 'Withdrawn by the sender', moduleThread.thread.id);
  const after = await listThreads(env, { user: learner, now: T3 });
  check('a withdrawn last message does not preview on the list either',
    t.preview !== null && after.threads.find((x) => x.id === moduleThread.thread.id).preview === null);
}
{
  // A tutor handed the learner on. They keep the record, lose the thread.
  sql('UPDATE message_participants SET left_at = ? WHERE thread_id = ? AND user_id = ?',
    T2, THREAD, 'usr_former');
  const formerList = await listThreads(env, { user: former, now: T3 });
  check('a participant who has left no longer carries the thread on their list',
    !formerList.threads.some((t) => t.id === THREAD));
  const formerRead = await readThread(env, { user: former, threadId: THREAD, now: T3 });
  check('...but the record does not forget they were party to it',
    formerRead.thread.id === THREAD && formerRead.thread.you.leftAt === T2);
  check('...and they see the conversation only up to the moment they left',
    formerRead.messages.every((m) => m.sentAt <= T2)
    && !formerRead.messages.some((m) => m.body === 'Thank you — and in reported speech?'));
  check('...they may not reply, and are told why rather than merely refused',
    formerRead.thread.mayReply === false && /no longer a participant/.test(formerRead.thread.replyRefusal));
  check('...and they are left no badge for messages they will never be shown',
    formerRead.thread.unread === 0, formerRead.thread.unread);
  const r = await refusal(() => replyToThread(env, { user: former, threadId: THREAD, body: { body: 'One more thing' }, now: T3 }));
  check('...and the refusal is enforced on the write, not only described on the read',
    r.name === 'AuthorizationError' && r.status === 403, `${r.name} ${r.status}`);
}
{
  sql(`UPDATE message_threads SET status = 'closed', closed_at = ?, closed_by = ?, closed_reason = ?
       WHERE id = ?`, T3, 'usr_admin', 'Answered at the tutorial on 19 August', registrarThread.thread.id);
  const read = await readThread(env, { user: learner, threadId: registrarThread.thread.id, now: T3 });
  check('a closed thread is still readable — closing is not deleting',
    read.thread.status === 'closed' && read.messages.length === 1);
  check('...and says why it is closed rather than greying out silently',
    read.thread.mayReply === false && /Answered at the tutorial/.test(read.thread.replyRefusal));
  const r = await refusal(() => replyToThread(env, {
    user: learner, threadId: registrarThread.thread.id, body: { body: 'One more thing' }, now: T3,
  }));
  check('...and a reply into it is refused',
    r.name === 'AuthorizationError' && r.status === 403);
}

// ---------------------------------------------------------------------
// 8 · THE RATE LIMIT, COUNTED IN THE DATA LAYER
// ---------------------------------------------------------------------
{
  const before = await threadAllowance(env, { user: rateLearner, now: T0 });
  check(`a learner starts with the full allowance of ${LEARNER_THREADS_PER_WINDOW}`,
    before.limit === LEARNER_THREADS_PER_WINDOW && before.opened === 0
    && before.remaining === LEARNER_THREADS_PER_WINDOW && before.nextAt === null);
  check(`...over a rolling ${ROLLING_WINDOW_HOURS}-hour window, not a calendar day`,
    before.windowHours === 24);

  for (let i = 0; i < LEARNER_THREADS_PER_WINDOW; i++) {
    await openThread(env, {
      user: rateLearner,
      body: { subject: `Question ${i + 1}`, body: `The ${i + 1}th thing I do not understand.`, scope: 'level', levelId: 3, recipient: 'tutors' },
      now: `2026-08-20T1${i}:30:00.000Z`,
    });
  }
  const spent = await threadAllowance(env, { user: rateLearner, now: '2026-08-20T15:00:00.000Z' });
  check('the allowance is spent by opening threads, counted from the rows themselves',
    spent.opened === LEARNER_THREADS_PER_WINDOW && spent.remaining === 0);
  check('...and it names the exact instant the next one may be opened',
    spent.nextAt === '2026-08-21T10:30:00.000Z', spent.nextAt);

  const r = await refusal(() => openThread(env, {
    user: rateLearner,
    body: { subject: 'One more', body: 'And another thing.', scope: 'level', levelId: 3, recipient: 'tutors' },
    now: '2026-08-20T15:00:00.000Z',
  }));
  check('the sixth thread in the window is refused',
    r.name === 'RateLimitError' && r.status === 429, `${r.name} ${r.status}`);
  check('...the refusal carries the instant, so a client can say when rather than "later"',
    r.allowance.nextAt === '2026-08-21T10:30:00.000Z' && /2026-08-21T10:30/.test(r.message));
  check('...it points at replying, which is the thing the cap is not against',
    /Replying in a thread you already have is not limited/.test(r.message));
  check('...and nothing was written by the refused request',
    row('SELECT COUNT(*) AS n FROM message_threads WHERE opened_by = ?', 'usr_rate').n === LEARNER_THREADS_PER_WINDOW);

  const oldest = row("SELECT id AS i FROM message_threads WHERE opened_by = 'usr_rate' ORDER BY created_at ASC LIMIT 1").i;
  check('replying is never rate-limited',
    (await replyToThread(env, { user: rateLearner, threadId: oldest, body: { body: 'A follow-up.' }, now: '2026-08-20T15:05:00.000Z' })).status === 'open');
  const rolled = await threadAllowance(env, { user: rateLearner, now: '2026-08-21T11:00:00.000Z' });
  check('the window rolls: a day later the oldest thread has left it',
    rolled.opened === LEARNER_THREADS_PER_WINDOW - 1 && rolled.remaining === 1);
}

// ---------------------------------------------------------------------
// 9 · A MEMBER OF STAFF OPENS A THREAD, AND WHY THAT IS THE NARROW CASE
// ---------------------------------------------------------------------
// This is the only path on the platform that names a person, and it is
// gated by the SAME predicate that decides whether that member of staff
// may read the learner's engagement record — imported, not restated.
{
  const r = await refusal(() => openThread(env, {
    user: stranger,
    body: { subject: 'About your work', body: 'A note on your last assignment.', scope: 'level', levelId: 3, recipient: 'learner', learnerId: 'usr_outsider' },
    now: T3,
  }));
  check('a member of staff may not open a thread with a learner they do not teach',
    r.name === 'AuthorizationError' && r.status === 403, `${r.name} ${r.status}`);
  check('...and the refusal names the rule, not the learner',
    !/usr_outsider|Learner B/.test(r.message));
}
{
  const r = await refusal(() => openThread(env, {
    user: stranger,
    body: { subject: 'Hello', body: 'A note.', scope: 'level', levelId: 3, recipient: 'learner', learnerId: 'usr_ghost' },
    now: T3,
  }));
  check('a fabricated learner id gets the same 403, so the path is not an existence oracle',
    r.name === 'AuthorizationError' && r.status === 403);
}
{
  const r = await refusal(() => openThread(env, {
    user: tutor,
    body: { subject: 'Hello', body: 'A note.', scope: 'level', levelId: 3, recipient: 'tutors' },
    now: T3,
  }));
  check('a member of staff addressing an office is told to name a learner instead',
    r.name === 'ValidationError' && /learnerId/.test(r.fields.recipient), r.fields.recipient);
}
{
  const r = await refusal(() => openThread(env, {
    user: tutor,
    body: { subject: 'Hello', body: 'A note.', scope: 'level', levelId: 3, recipient: 'learner', learnerId: 'usr_tutor' },
    now: T3,
  }));
  check('a thread has two parties — a tutor may not open one with themselves',
    r.name === 'ValidationError' && /two parties/.test(r.fields.learnerId));
}
{
  // An administrator passes assertMayReadLearner() for everybody, so the
  // only thing keeping `party = 'learner'` honest is this refusal.
  const r = await refusal(() => openThread(env, {
    user: admin,
    body: { subject: 'Hello', body: 'A note.', scope: 'level', levelId: 3, recipient: 'learner', learnerId: 'usr_tutor' },
    now: T3,
  }));
  check('a colleague may not be filed as the learner of a thread',
    r.name === 'ValidationError' && /Not a learner account/.test(r.fields.learnerId), r.fields.learnerId);
}
{
  // usr_tutor teaches this learner: they share the thread opened in § 4,
  // which is exactly the relation attendance.js composes.
  const staffThread = await openThread(env, {
    user: tutor,
    body: { subject: 'Your recording for unit 3', body: 'Please re-record the third prompt before Friday.', scope: 'level', levelId: 3, recipient: 'learner', learnerId: 'usr_learner' },
    now: T3,
  });
  check('a tutor may open a thread with a learner they teach',
    staffThread.thread.participants.length === 2);
  check('...the learner is party to it as a learner, and the tutor as a tutor',
    staffThread.thread.participants.find((p) => p.userId === 'usr_learner').party === 'learner'
    && staffThread.thread.participants.find((p) => p.userId === 'usr_tutor').party === 'tutor');
  check('...and it appears on the learner\'s own list',
    (await listThreads(env, { user: learner, now: T3 })).threads.some((t) => t.id === staffThread.thread.id));

  const adminThread = await openThread(env, {
    user: admin,
    body: { subject: 'Your fee instalment', body: 'The second instalment may be moved to October.', scope: 'level', levelId: 3, recipient: 'learner', learnerId: 'usr_outsider' },
    now: T3,
  });
  check('an administrator reaches any learner, and joins as registrar rather than as their tutor',
    adminThread.thread.participants.find((p) => p.userId === 'usr_admin').party === 'registrar');
  const r = await refusal(() => openThread(env, {
    user: admin,
    body: { subject: 'x', body: 'y', scope: 'level', levelId: 5, recipient: 'learner', learnerId: 'usr_outsider' },
    now: T3,
  }));
  check('...but not about a level that learner is not enrolled in',
    r.name === 'ValidationError' && Boolean(r.fields.levelId));
}

// THE COUPLING, STATED IN THE MODULE HEADER AND PROVED HERE. A tutor who
// shares an open thread with a learner may read that learner's
// engagement record. Anybody loosening the recipient rules above is
// loosening this, and this assertion is where they find that out.
{
  const before = await refusal(() => assertMayReadLearner(env, stranger, 'usr_learner'));
  check('a member of staff sharing no thread with a learner may not read their record',
    before.name === 'AuthorizationError');
  const after = await assertMayReadLearner(env, tutor, 'usr_learner');
  check('...and a tutor who shares an open thread with them MAY — which is why the recipient rules are narrow',
    after.basis === 'teaching_relation');
}

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
  const p = enc({ sub, email: `${sub}@placeholder.invalid`, email_verified: true, iat: t - 5, exp: t + 600 });
  const sig = await crypto.subtle.sign('RSASSA-PKCS1-v1_5', kp.privateKey, new TextEncoder().encode(`${h}.${p}`));
  return `${h}.${p}.${b64url(new Uint8Array(sig))}`;
}
const TOK = {
  learner: await token('sub_learner'),
  outsider: await token('sub_outsider'),
  tutor: await token('sub_tutor'),
};
const BASE = 'https://wec-lc.test/api';
const get = (url, tok) => new Request(url, tok ? { headers: { Authorization: `Bearer ${tok}` } } : undefined);
const send = (method, url, tok, body) => new Request(url, {
  method,
  headers: tok
    ? { Authorization: `Bearer ${tok}`, 'Content-Type': 'application/json' }
    : { 'Content-Type': 'application/json' },
  body: JSON.stringify(body ?? {}),
});

check('GET /api/messages refuses an unauthenticated caller',
  (await collection.onRequestGet({ request: get(`${BASE}/messages`), env })).status === 401);
check('POST /api/messages refuses an unauthenticated caller',
  (await collection.onRequestPost({ request: send('POST', `${BASE}/messages`, null, {}), env })).status === 401);
check('GET /api/messages/{thread} refuses an unauthenticated caller',
  (await one.onRequestGet({ request: get(`${BASE}/messages/${THREAD}`), env, params: { thread: THREAD } })).status === 401);
check('POST /api/messages/{thread} refuses an unauthenticated caller',
  (await one.onRequestPost({ request: send('POST', `${BASE}/messages/${THREAD}`, null, { body: 'x' }), env, params: { thread: THREAD } })).status === 401);

{
  const res = await collection.onRequestGet({ request: get(`${BASE}/messages`, TOK.learner), env });
  const body = await res.json();
  check('GET /api/messages returns the caller\'s own threads with unread counts',
    res.status === 200 && Array.isArray(body.threads) && typeof body.unread === 'number');
  check('...and what they may open next, so a compose box never has to guess',
    Array.isArray(body.canOpen) && body.canOpen.some((o) => o.recipient === 'tutors'));
  check('...and what is left of the allowance, so the cap is not discovered by hitting it',
    body.allowance.limit === LEARNER_THREADS_PER_WINDOW && typeof body.allowance.remaining === 'number');
}
check('GET /api/messages refuses a limit it will not honour rather than rounding it',
  (await collection.onRequestGet({ request: get(`${BASE}/messages?limit=9999`, TOK.learner), env })).status === 422);
check('...and a limit that is not a whole number',
  (await collection.onRequestGet({ request: get(`${BASE}/messages?limit=ten`, TOK.learner), env })).status === 422);

{
  const res = await one.onRequestGet({
    request: get(`${BASE}/messages/${THREAD}`, TOK.outsider), env, params: { thread: THREAD },
  });
  const ghost = await one.onRequestGet({
    request: get(`${BASE}/messages/mth_nope`, TOK.outsider), env, params: { thread: 'mth_nope' },
  });
  const body = await res.json();
  check('a learner reading a thread they are not in gets 404 through the route',
    res.status === 404, res.status);
  check('...the same status and message a thread that never existed gets',
    ghost.status === 404 && body.message === (await ghost.json()).message);
  check('...and the refusal carries none of the thread it refused',
    !JSON.stringify(body).includes('conditional'));
}
{
  const res = await one.onRequestGet({
    request: get(`${BASE}/messages/${THREAD}`, TOK.learner), env, params: { thread: THREAD },
  });
  const body = await res.json();
  check('a participant reads the thread through the route',
    res.status === 200 && body.thread.id === THREAD && body.messages.length >= 1);
  check('...and the payload declares its format',
    body.format === 'text/plain');
}
{
  const res = await one.onRequestPost({
    request: send('POST', `${BASE}/messages/${THREAD}`, TOK.learner, { body: 'A further question about reported speech.' }),
    env,
    params: { thread: THREAD },
  });
  check('a participant replies through the route, and the reply is created',
    res.status === 201, res.status);
}
{
  const res = await one.onRequestPost({
    request: send('POST', `${BASE}/messages/${THREAD}`, TOK.learner, { body: 'x', threadId: 'mth_other' }),
    env,
    params: { thread: THREAD },
  });
  check('a reply naming one thread in the path and another in the body is refused, not resolved',
    res.status === 422 && Boolean((await res.json()).fields.threadId));
}
{
  const res = await collection.onRequestPost({
    request: send('POST', `${BASE}/messages`, TOK.learner, { threadId: THREAD, body: 'x' }),
    env,
  });
  const body = await res.json();
  check('a reply sent to the collection is told where replies go, rather than opening a duplicate thread',
    res.status === 422 && Boolean(body.fields.threadId) && /POST to \/api\/messages\//.test(body.message),
    body.message);
}
{
  const res = await collection.onRequestPost({
    request: send('POST', `${BASE}/messages`, TOK.learner, {
      subject: 'Pronunciation of the -ed ending',
      body: 'Is it always /d/ after a vowel?',
      scope: 'level', levelId: 3, recipient: 'tutors',
    }),
    env,
  });
  const body = await res.json();
  check('POST /api/messages opens a thread and answers 201 with it',
    res.status === 201 && body.thread.subject === 'Pronunciation of the -ed ending', res.status);
  check('...with the first message already in it — a thread with no message is not a conversation',
    body.messages.length === 1);
}
{
  const res = await collection.onRequestPost({
    request: send('POST', `${BASE}/messages`, TOK.learner, {
      subject: 'x', body: 'y', scope: 'level', levelId: 3, recipient: 'tutors', userId: 'usr_stranger',
    }),
    env,
  });
  check('POST /api/messages refuses a named person through the route as well',
    res.status === 422 && Boolean((await res.json()).fields.userId));
}
{
  const res = await collection.onRequestPost({
    request: new Request(`${BASE}/messages`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${TOK.learner}`, 'Content-Type': 'application/json' },
      body: '{not json',
    }),
    env,
  });
  check('a malformed body is a 422 naming the problem, never a 500',
    res.status === 422);
}
{
  // The rate limit through the route, so the 429 and its allowance are
  // proved to survive the handler rather than only the module.
  //
  // THE ALLOWANCE MUST BE SPENT AT THE ROUTE'S OWN CLOCK, and the first
  // version of this block was not. It spent usr_rate's five threads
  // through the MODULE at a pinned `now` of 2026-08-20T15:00Z, then
  // posted through the ROUTE — which takes no `now` and reads the real
  // one. ROLLING_WINDOW_HOURS is 24, so by the time the suite ran the
  // pinned rows had fallen out of the window, the allowance had rolled,
  // and the handler answered 201 because 201 was the correct answer.
  //
  // The test was wrong and the rate limiter was right, which is the
  // failure mode worth naming: a windowed rule asserted against a fixed
  // past timestamp passes on the day it is written and fails every day
  // afterwards. So the window is filled here through the route itself,
  // at whatever clock the suite is running on, and the refusal is the
  // one the sixth request earns.
  const tok = await token('sub_rate');
  const post = (n) => collection.onRequestPost({
    request: send('POST', `${BASE}/messages`, tok, {
      subject: `Route allowance ${n}`, body: 'And one more thing.',
      scope: 'level', levelId: 3, recipient: 'tutors',
    }),
    env,
  });

  // How many are left is ASKED, never assumed. The five threads the
  // module block opened at a pinned 2026-08-20T15:00Z drift in and out
  // of the 24-hour window as the suite's real clock advances: run this
  // twenty hours after that timestamp and they all still count, run it
  // twenty-six hours after and none of them do. Either way the number
  // spendable here is whatever threadAllowance says it is right now.
  const left = await threadAllowance(env, { user: rateLearner });
  const spent = [];
  for (let n = 0; n < left.remaining; n += 1) spent.push(await post(n));
  check(`the route opens exactly what is left of the allowance — ${left.remaining} of ${left.limit}`,
    spent.every((r) => r.status === 201), spent.map((r) => r.status).join(','));

  const res = await post('over');
  const body = await res.json();
  check('the rate limit answers 429 through the route',
    res.status === 429, res.status);
  check('...and hands the client the allowance, not just a refusal',
    body.allowance && body.allowance.remaining === 0 && typeof body.allowance.nextAt === 'string');
}

check('parseLimit defaults rather than demanding a parameter', parseLimit(null) === 20);
check('parseLimit accepts a whole number', parseLimit('5') === 5);
for (const bad of ['0', '101', '-1', 'five', '2.5']) {
  check(`parseLimit refuses "${bad}" rather than coercing it`, (() => {
    try { parseLimit(bad); return false; } catch (e) { return e.name === 'ValidationError' && Boolean(e.fields.limit); }
  })());
}

// ---------------------------------------------------------------------
console.log(`\n${pass} passed, ${fail} failed.`);
process.exit(fail === 0 ? 0 : 1);
