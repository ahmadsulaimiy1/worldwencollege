// Run with: node --experimental-sqlite tests/timetable.test.mjs
//
// A TIMETABLE, AND THE FOUR WAYS IT GOES WRONG WITHOUT A TEST ON IT.
//
//  1. THE HOUR THAT MOVES. Every instant in this feed is rendered twice
//     — the UTC instant and the same instant in the learner's own zone
//     with the offset spelled out. Both are easy to get right in July
//     and wrong in January, because an offset is not a property of a
//     zone: America/New_York is −04:00 in summer and −05:00 in winter.
//     So the offset is asserted at two instants six months apart, and a
//     refactor that computes it once per learner instead of once per
//     event fails here rather than in a support queue.
//
//  2. THE LAST PLACE, SOLD TWICE. sql/schema.sql states that capacity
//     "is declared here and ENFORCED IN THE APPLICATION ... the booking
//     path must count live bookings inside the same statement that
//     inserts one". A read-then-write passes every ordinary test. So the
//     count is asserted to be inside the INSERT, structurally, in the
//     source — and the refusal is asserted behaviourally on a full slot.
//
//  3. THE REFUSAL THAT SAYS NOTHING. Six things stop a booking and no
//     two are the same problem for the learner. Each is asserted to
//     produce its OWN message and its own field, because the failure
//     mode here is not an incorrect status code, it is a correct status
//     code carrying a sentence nobody can act on.
//
//  4. THE FEED THAT KNOWS TOO MUCH. A timetable joins three tables that
//     hold other people's classes, other people's tutorials and other
//     people's offers. Every stream is asserted against a second learner
//     who must not appear in the first learner's week, and the route is
//     asserted to take no subject parameter at all.
import { readFileSync } from 'node:fs';
import { makeD1 } from './d1-shim.mjs';
import { ROOT, loadUrl } from './helpers.mjs';

let pass = 0, fail = 0;
const check = (label, cond, detail) => {
  console.log((cond ? 'PASS ' : 'FAIL ') + label + (cond || detail === undefined ? '' : ` — ${detail}`));
  cond ? pass++ : fail++;
};
/** Runs `fn` and returns the error it threw, or null if it did not throw. */
const refusal = async (fn) => { try { await fn(); return null; } catch (e) { return e; } };

const schema = readFileSync(`${ROOT}/sql/schema.sql`, 'utf8');
const env = { DB: makeD1(schema), CLERK_JWKS_URL: 'https://stub.clerk.accounts.dev/.well-known/jwks.json' };
const db = env.DB;

const lib = await import(loadUrl('functions/_lib/lms/timetable.js'));
const {
  TIMETABLE, SLOT_KINDS, DEADLINE_SOURCES,
  isValidTimeZone, offsetMinutesFor, formatOffset, utcIso, localIso, renderInstant, toInstant,
  zoneFor, learnerTimetable, toIcs,
  bookSlot, cancelBooking, publishSlot, withdrawSlot, tutorSlots,
  parseLimit, parseHorizonDays, parseOffsetInstant,
} = lib;
const timetableRoute = await import(loadUrl('functions/api/student/timetable.js'));
const bookingRoute = await import(loadUrl('functions/api/student/booking.js'));
const slotsRoute = await import(loadUrl('functions/api/staff/slots.js'));

const NOW = Date.parse('2026-09-01T12:00:00.000Z');
const iso = (s) => new Date(Date.parse(s)).toISOString();

// ---------------------------------------------------------------------
// FIXTURES — two learners whose weeks must never touch, one tutor, one
// member of staff who teaches neither of them, one administrator.
// ---------------------------------------------------------------------
const user = (id, sub, role, name) => db.prepare(
  `INSERT INTO users (id, auth_provider, auth_provider_id, email, role, preferred_name)
   VALUES (?, 'clerk', ?, ?, ?, ?)`,
).bind(id, sub, `${sub}@example.com`, role, name).run();

user('usr_learner', 'sub_learner', 'student', 'Amina');
user('usr_other', 'sub_other', 'student', 'Bilal');
user('usr_tutor', 'sub_tutor', 'staff', 'Tutor Okafor');
user('usr_stranger', 'sub_stranger', 'staff', 'Staff Nobody');
user('usr_admin', 'sub_admin', 'admin', 'Registrar');

const enrol = (id, u, level, status) => db.prepare(
  `INSERT INTO enrolments (id, user_id, level_id, status, started_at) VALUES (?, ?, ?, ?, ?)`,
).bind(id, u, level, status, iso('2026-06-01T00:00:00Z')).run();

enrol('enr_l1', 'usr_learner', 1, 'completed');
enrol('enr_l2', 'usr_learner', 2, 'pending_payment');
enrol('enr_l3', 'usr_learner', 3, 'active');
enrol('enr_o3', 'usr_other', 3, 'active');

db.prepare(`INSERT INTO units (id, course_id, sequence, title) VALUES ('unt_3a','crs_level_3',1,'Reported Speech')`).run();
db.prepare(`INSERT INTO units (id, course_id, sequence, title) VALUES ('unt_1a','crs_level_1',1,'The Alphabet')`).run();

const session = (id, level, startsAt, unit = null) => db.prepare(
  `INSERT INTO live_sessions (id, level_id, unit_id, host_user_id, title, starts_at, duration_minutes, join_url)
   VALUES (?, ?, ?, 'usr_tutor', ?, ?, 60, 'https://meet.example.com/' || ?)`,
).bind(id, level, unit, `Class ${id}`, startsAt, id).run();

session('lsn_l3', 3, iso('2026-09-02T13:00:00Z'), 'unt_3a');
session('lsn_l1', 1, iso('2026-09-03T09:00:00Z'));
session('lsn_l2', 2, iso('2026-09-03T10:00:00Z'));   // pending_payment level — must not appear
session('lsn_l5', 5, iso('2026-09-03T11:00:00Z'));   // not enrolled at all
session('lsn_past', 3, iso('2026-08-01T13:00:00Z')); // before the window
// A start time inside the window that no clock can read. It must cost
// this learner exactly one event, not their whole week.
db.prepare(`INSERT INTO live_sessions (id, level_id, host_user_id, title, starts_at, duration_minutes)
  VALUES ('lsn_bad', 3, 'usr_tutor', 'Class with a broken clock', '2026-09-05T99:99:99Z', 60)`).run();

const slot = (id, opts = {}) => db.prepare(
  `INSERT INTO tutorial_slots (id, tutor_id, live_session_id, level_id, unit_id, title, kind,
     starts_at, duration_minutes, capacity, join_url, status, cancelled_at, cancelled_reason, created_at)
   VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
).bind(
  id, opts.tutorId || 'usr_tutor', opts.liveSessionId || null,
  opts.levelId === undefined ? 3 : opts.levelId, opts.unitId || null,
  opts.title || `Tutorial ${id}`, opts.kind || 'tutorial', opts.startsAt,
  opts.durationMinutes || 30, opts.capacity || 1, opts.joinUrl || null,
  opts.status || 'open', opts.cancelledAt || null, opts.cancelledReason || null,
  iso('2026-08-01T00:00:00Z'),
).run();

const booking = (id, slotId, userId, status = 'booked', extra = {}) => db.prepare(
  `INSERT INTO slot_bookings (id, slot_id, user_id, status, learner_note, booked_at, cancelled_at, cancellation_reason)
   VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
).bind(id, slotId, userId, status, extra.note || null, iso('2026-08-15T00:00:00Z'),
  extra.cancelledAt || null, extra.cancellationReason || null).run();

slot('slt_mine', { startsAt: iso('2026-09-02T15:00:00Z') });
booking('bkg_mine', 'slt_mine', 'usr_learner', 'booked', { note: 'Conditionals still defeat me.' });
slot('slt_theirs', { startsAt: iso('2026-09-04T15:00:00Z') });
booking('bkg_theirs', 'slt_theirs', 'usr_other');
slot('slt_dropped', { startsAt: iso('2026-09-06T15:00:00Z') });
booking('bkg_dropped', 'slt_dropped', 'usr_learner', 'cancelled_by_learner',
  { cancelledAt: iso('2026-08-20T00:00:00Z'), cancellationReason: 'Clash with work.' });
slot('slt_withdrawn', {
  startsAt: iso('2026-09-07T15:00:00Z'), status: 'cancelled',
  cancelledAt: iso('2026-08-21T00:00:00Z'), cancelledReason: 'Tutor unwell.',
});
booking('bkg_withdrawn', 'slt_withdrawn', 'usr_learner', 'cancelled_by_tutor',
  { cancelledAt: iso('2026-08-21T00:00:00Z'), cancellationReason: 'Tutor unwell.' });

db.prepare(`INSERT INTO applications (id, user_id, full_name, email, status)
  VALUES ('app_learner','usr_learner','Amina','sub_learner@example.com','offer_sent')`).run();
db.prepare(`INSERT INTO applications (id, user_id, full_name, email, status)
  VALUES ('app_other','usr_other','Bilal','sub_other@example.com','offer_sent')`).run();
db.prepare(`INSERT INTO offers (id, application_id, level_id, kind, conditions, issued_by, issued_at, expires_at, status)
  VALUES ('ofr_learner','app_learner',4,'conditional','Level III completed with a pass in every module.',
          'usr_admin', ?, ?, 'issued')`).bind(iso('2026-08-20T09:00:00Z'), iso('2026-09-10T23:00:00Z')).run();
db.prepare(`INSERT INTO offers (id, application_id, level_id, kind, issued_by, issued_at, expires_at, status)
  VALUES ('ofr_other','app_other',4,'unconditional','usr_admin', ?, ?, 'issued')`)
  .bind(iso('2026-08-20T09:00:00Z'), iso('2026-09-11T23:00:00Z')).run();

// =====================================================================
// 1 · TIME, AND THE OFFSET THAT IS NOT A CONSTANT
// =====================================================================
check('a real IANA zone is recognised', isValidTimeZone('Asia/Dubai') && isValidTimeZone('Africa/Lagos'));
check('a zone that is not one is refused rather than coerced',
  !isValidTimeZone('GMT+4') && !isValidTimeZone('') && !isValidTimeZone(null) && !isValidTimeZone('Mars/Olympus'));

const july = Date.parse('2026-07-01T16:00:00Z');
const january = Date.parse('2026-01-15T16:00:00Z');
check('the offset is computed per instant: New York is −04:00 in July',
  offsetMinutesFor(july, 'America/New_York') === -240, offsetMinutesFor(july, 'America/New_York'));
check('…and −05:00 in January, from the same code and the same zone',
  offsetMinutesFor(january, 'America/New_York') === -300, offsetMinutesFor(january, 'America/New_York'));
check('a zone with no daylight saving is steady across both',
  offsetMinutesFor(july, 'Asia/Dubai') === 240 && offsetMinutesFor(january, 'Asia/Dubai') === 240);
check('a half-hour zone is carried exactly, not rounded to the hour',
  offsetMinutesFor(july, 'Asia/Colombo') === 330, offsetMinutesFor(july, 'Asia/Colombo'));

check('an offset is formatted with a sign and a colon, never a bare number',
  formatOffset(240) === '+04:00' && formatOffset(-300) === '-05:00' && formatOffset(330) === '+05:30');
check('UTC is written Z rather than +00:00, which is what a reader expects',
  formatOffset(0) === 'Z');

check('the UTC rendering keeps its Z and drops meaningless milliseconds',
  utcIso(Date.parse('2026-09-01T13:00:00.472Z')) === '2026-09-01T13:00:00Z');
check('the local rendering carries the offset explicitly',
  localIso(Date.parse('2026-09-01T13:00:00Z'), 'Asia/Dubai') === '2026-09-01T17:00:00+04:00');
check('a South Asian half-hour offset renders correctly end to end',
  localIso(Date.parse('2026-09-01T13:00:00Z'), 'Asia/Colombo') === '2026-09-01T18:30:00+05:30');
check('a West African learner reads the same instant as their own hour',
  localIso(Date.parse('2026-09-01T13:00:00Z'), 'Africa/Lagos') === '2026-09-01T14:00:00+01:00');

const rendered = renderInstant('2026-09-01T13:00:00.000Z', 'Asia/Dubai');
check('every instant is handed out in BOTH readings, never one',
  rendered.utc === '2026-09-01T13:00:00Z' && rendered.local === '2026-09-01T17:00:00+04:00'
  && rendered.offset === '+04:00' && rendered.timeZone === 'Asia/Dubai');
check('an unreadable timestamp renders as null rather than NaN or a throw',
  renderInstant('2026-09-05T99:99:99Z', 'UTC') === null && toInstant(null) === null);

// =====================================================================
// 2 · WHOSE HOURS THE FEED IS IN
// =====================================================================
{
  const unset = await zoneFor(env, 'usr_learner');
  check('a learner who has set no zone is TOLD so, not quietly served UTC',
    unset.timeZone === 'UTC' && unset.source === 'default' && /have not set a time zone/.test(unset.notice));

  db.prepare(`INSERT INTO student_settings (user_id, time_zone, digest, share_progress_with_sponsor)
    VALUES ('usr_other','Not/AZone','immediate',0)`).run();
  const bad = await zoneFor(env, 'usr_other');
  check('a stored zone the platform cannot use is reported back, not swallowed',
    bad.timeZone === 'UTC' && bad.rejected === 'Not/AZone' && /not one this platform recognises/.test(bad.notice));

  db.prepare(`INSERT INTO student_settings (user_id, time_zone, digest, share_progress_with_sponsor)
    VALUES ('usr_learner','Asia/Dubai','immediate',0)`).run();
  const set = await zoneFor(env, 'usr_learner');
  check('a valid zone is used and its source named',
    set.timeZone === 'Asia/Dubai' && set.source === 'student_settings');
}

// =====================================================================
// 3 · ONE MERGED, SORTED FEED
// =====================================================================
const feed = await learnerTimetable(env, { userId: 'usr_learner', now: NOW });

check('the feed merges all three streams into one list',
  feed.counts.classes === 2 && feed.counts.tutorials === 1 && feed.counts.deadlines === 1,
  JSON.stringify(feed.counts));
check('and returns it in time order, not in stream order',
  feed.events.map((e) => e.id).join(' | ')
  === 'class:lsn_l3 | tutorial:bkg_mine | class:lsn_l1 | deadline:ofr_learner',
  feed.events.map((e) => e.id).join(' | '));
check('every event carries both readings of its start',
  feed.events.every((e) => e.startsAt.utc.endsWith('Z') && /[+-]\d{2}:\d{2}$/.test(e.startsAt.local)));
check('the feed is rendered in the learner\'s own zone',
  feed.zone.timeZone === 'Asia/Dubai'
  && feed.events[0].startsAt.local === '2026-09-02T17:00:00+04:00', feed.events[0].startsAt.local);
check('a class carries its end as well as its start, so a calendar can block the hour',
  feed.events[0].endsAt.utc === '2026-09-02T14:00:00Z');

check('a class at a level the learner is not enrolled in is not in their week',
  !feed.events.some((e) => e.source.id === 'lsn_l5'));
check('a class at a level still awaiting payment is not in their week either',
  !feed.events.some((e) => e.source.id === 'lsn_l2'));
check('a completed level still shows its classes — the rule content.js already applies',
  feed.events.some((e) => e.source.id === 'lsn_l1'));
check('a class that has already happened is not "next"',
  !feed.events.some((e) => e.source.id === 'lsn_past'));
check('one unreadable timestamp costs one event, not the whole feed',
  feed.unreadable.length === 1 && feed.unreadable[0].id === 'lsn_bad' && feed.events.length === 4);

check('a tutorial the learner booked appears, with the note they wrote on it',
  feed.events[1].booking.status === 'booked' && feed.events[1].booking.note === 'Conditionals still defeat me.');
check('a tutorial ANOTHER learner booked does not',
  !feed.events.some((e) => e.source.id === 'bkg_theirs'));
check('a booking the learner cancelled is gone from their week',
  !feed.events.some((e) => e.source.id === 'bkg_dropped'));
check('a slot the tutor withdrew is gone too, rather than sitting there struck through',
  !feed.events.some((e) => e.source.id === 'bkg_withdrawn'));
check('a future tutorial is marked cancellable, so the button and the rule agree',
  feed.events[1].cancellable === true);

const deadline = feed.events[3];
check('the offer expiry is on the timetable at last, with what it is for',
  deadline.kind === 'deadline' && deadline.source.table === 'offers'
  && deadline.action === 'reply_to_offer' && /Level IV/.test(deadline.title));
check('and another applicant\'s offer is not',
  !feed.events.some((e) => e.source.id === 'ofr_other'));

check('the feed declares what it read', feed.sources.some((s) => s.source === 'live_sessions' && s.readable));
check('and declares, in the payload, the one thing this schema cannot answer',
  DEADLINE_SOURCES.some((s) => s.source === 'assessment_due_dates' && s.readable === false
    && /no date column|No table in this schema/i.test(s.reason)));

// The claim in that reason is checked against the schema itself rather
// than trusted: if a due-date column ever lands, this test fails and the
// stream must be built, not the sentence rewritten.
const schemaText = schema;
const learningItemsDdl = schemaText.slice(schemaText.indexOf('CREATE TABLE learning_items'));
check('the schema still holds no due date for an assessment — the gap this feed reports',
  !/due_at|due_date|deadline/i.test(learningItemsDdl.slice(0, learningItemsDdl.indexOf(');'))));

{
  const narrow = await learnerTimetable(env, { userId: 'usr_learner', now: NOW, horizonDays: 2 });
  check('the horizon really bounds the window — two days is two days',
    narrow.counts.inWindow === 3 && narrow.counts.deadlines === 0, JSON.stringify(narrow.counts));
  const oneDay = await learnerTimetable(env, { userId: 'usr_learner', now: NOW, horizonDays: 1 });
  check('…and the next twenty-four hours really are empty, rather than rounded up to the next class',
    oneDay.counts.inWindow === 0, JSON.stringify(oneDay.counts));
  const capped = await learnerTimetable(env, { userId: 'usr_learner', now: NOW, limit: 2 });
  check('the limit bounds what is returned without lying about what is there',
    capped.events.length === 2 && capped.counts.inWindow === 4);
}
{
  const empty = await learnerTimetable(env, { userId: 'usr_stranger', now: NOW });
  check('somebody with nothing scheduled gets a reason, not a bare empty list',
    empty.events.length === 0 && /Nothing is scheduled for you yet/.test(empty.notice));
}
{
  user('usr_waiting', 'sub_waiting', 'student', 'Waiting');
  enrol('enr_w', 'usr_waiting', 1, 'pending_payment');
  const waiting = await learnerTimetable(env, { userId: 'usr_waiting', now: NOW });
  check('a learner whose enrolment is unpaid is told why their classes are not there',
    /awaiting payment/.test(waiting.notice), waiting.notice);
}

// =====================================================================
// 4 · THE CALENDAR FEED
// =====================================================================
{
  const ics = toIcs(feed, { now: NOW });
  check('the export is a calendar a client will actually open',
    ics.startsWith('BEGIN:VCALENDAR\r\n') && ics.trimEnd().endsWith('END:VCALENDAR'));
  check('with CRLF line endings, as RFC 5545 requires',
    !/[^\r]\n/.test(ics));
  check('one VEVENT per event in the feed',
    (ics.match(/BEGIN:VEVENT/g) || []).length === feed.events.length);
  check('DTSTART carries the instant in UTC, so no client has to guess a zone',
    /DTSTART:20260902T130000Z/.test(ics));
  check('the UID is the row, so re-exporting updates the calendar instead of duplicating it',
    /UID:live_sessions-lsn_l3@worldwencollege\.co\.uk/.test(ics));
  check('no content line exceeds 75 octets',
    ics.split('\r\n').every((l) => new TextEncoder().encode(l).length <= 75),
    ics.split('\r\n').map((l) => new TextEncoder().encode(l).length).sort((a, b) => b - a)[0]);

  const folded = toIcs({
    zone: { timeZone: 'Asia/Dubai' },
    events: [{
      source: { table: 'live_sessions', id: 'lsn_long' }, kind: 'class',
      title: 'Reported speech, conditionals — and the sequence of tenses across a very long title indeed, with commas',
      detail: 'Line one\nline two; with a semicolon',
      startsAt: { epochMs: NOW }, endsAt: null, joinUrl: null,
    }],
  }, { now: NOW });
  check('a long title is folded rather than truncated, and unfolds to itself',
    folded.replace(/\r\n /g, '').includes('SUMMARY:Reported speech\\, conditionals — and the sequence of tenses across a very long title indeed\\, with commas'));
  check('commas, semicolons and newlines are escaped rather than breaking the file',
    folded.replace(/\r\n /g, '').includes('DESCRIPTION:Line one\\nline two\\; with a semicolon'));
}

// =====================================================================
// 5 · BOOKING — THE HAPPY PATH, THEN EVERY REFUSAL SEPARATELY
// =====================================================================
slot('slt_open', { startsAt: iso('2026-09-15T10:00:00Z'), capacity: 2, joinUrl: 'https://meet.example.com/open' });
{
  const booked = await bookSlot(env, { userId: 'usr_learner', slotId: 'slt_open', learnerNote: 'Essay structure.', now: NOW });
  check('a learner takes a place, and is told the time in their own zone',
    booked.booking.status === 'booked' && booked.slot.startsAt.local === '2026-09-15T14:00:00+04:00');
  check('and is told how many places are left after them', booked.slot.placesLeft === 1);
  const row = db.prepare(`SELECT * FROM slot_bookings WHERE id = ?`).bind(booked.booking.id).first();
  check('the note reaches the tutor, which is the only reason it is collected',
    row.learner_note === 'Essay structure.');
}
{
  const e = await refusal(() => bookSlot(env, { userId: 'usr_learner', slotId: 'slt_open', now: NOW }));
  check('booking twice is refused in the learner\'s own terms',
    e && e.name === 'ValidationError' && /already hold a place/.test(e.message) && e.fields.slotId === 'Already booked');
}
{
  await bookSlot(env, { userId: 'usr_other', slotId: 'slt_open', now: NOW });
  user('usr_third', 'sub_third', 'student', 'Third');
  enrol('enr_t3', 'usr_third', 3, 'active');
  const e = await refusal(() => bookSlot(env, { userId: 'usr_third', slotId: 'slt_open', now: NOW }));
  check('a full slot is refused with the count, not with "unavailable"',
    e && /full — 2 of 2 places taken/.test(e.message) && e.fields.slotId === 'Full', e && e.message);
}
{
  slot('slt_past', { startsAt: iso('2026-08-01T10:00:00Z') });
  const e = await refusal(() => bookSlot(env, { userId: 'usr_learner', slotId: 'slt_past', now: NOW }));
  check('a slot in the past says it is in the past',
    e && /already started/.test(e.message) && e.fields.slotId === 'In the past');
}
{
  const e = await refusal(() => bookSlot(env, { userId: 'usr_learner', slotId: 'slt_withdrawn', now: NOW }));
  check('a withdrawn slot quotes the tutor\'s reason rather than saying "closed"',
    e && /cancelled by the tutor: Tutor unwell\./.test(e.message), e && e.message);
}
{
  slot('slt_closed', { startsAt: iso('2026-09-16T10:00:00Z'), status: 'closed' });
  const e = await refusal(() => bookSlot(env, { userId: 'usr_learner', slotId: 'slt_closed', now: NOW }));
  check('a closed slot is a different refusal again',
    e && /no longer taking bookings/.test(e.message) && e.fields.slotId === 'Closed');
}
{
  slot('slt_level5', { startsAt: iso('2026-09-17T10:00:00Z'), levelId: 5 });
  const e = await refusal(() => bookSlot(env, { userId: 'usr_learner', slotId: 'slt_level5', now: NOW }));
  check('a slot offered to another level names that level',
    e && /offered to learners at Level V\./.test(e.message) && e.fields.slotId === 'Offered to another level',
    e && e.message);
}
{
  slot('slt_open_hour', { startsAt: iso('2026-09-18T10:00:00Z'), levelId: null, kind: 'office_hour' });
  const ok = await bookSlot(env, { userId: 'usr_waiting', slotId: 'slt_open_hour', now: NOW });
  check('a slot with no level is genuinely open to anyone — that is what an office hour is',
    ok.booking.status === 'booked');
}
{
  const e = await refusal(() => bookSlot(env, { userId: 'usr_tutor', slotId: 'slt_open_hour', now: NOW }));
  check('a tutor cannot fill their own hour',
    e && /cannot take a place in their own slot/.test(e.message));
}
{
  const e = await refusal(() => bookSlot(env, { userId: 'usr_learner', slotId: 'slt_nope', now: NOW }));
  check('an unknown slot is a 404, not a 500', e && e.name === 'NotFoundError' && e.httpStatus === 404);
  const e2 = await refusal(() => bookSlot(env, { userId: 'usr_learner', slotId: '', now: NOW }));
  check('a missing slotId names the field', e2 && e2.fields.slotId === 'Required');
  const e3 = await refusal(() => bookSlot(env, {
    userId: 'usr_learner', slotId: 'slt_open', learnerNote: 'x'.repeat(TIMETABLE.maxNoteLength + 1), now: NOW,
  }));
  check('an oversized note is refused rather than truncated into the tutor\'s screen',
    e3 && e3.fields.learnerNote);
}
{
  // The structural half of the capacity claim. A read-then-write passes
  // every behavioural test above and oversells the last place under
  // load, so the count is asserted to be INSIDE the INSERT.
  const src = readFileSync(loadUrl('functions/_lib/lms/timetable.js'), 'utf8');
  const insert = src.slice(src.indexOf('INSERT INTO slot_bookings'), src.indexOf('.bind(id, slotId, userId, note, bookedAt)'));
  check('the capacity count is a subquery of the INSERT, not a SELECT before it',
    /SELECT COUNT\(\*\) FROM slot_bookings/.test(insert) && /< \(SELECT capacity FROM tutorial_slots/.test(insert));
}

// =====================================================================
// 6 · CANCELLING — AND WHOSE HAND IS ON IT
// =====================================================================
{
  const mine = db.prepare(`SELECT id FROM slot_bookings WHERE slot_id='slt_open' AND user_id='usr_learner'`).first();
  const e = await refusal(() => cancelBooking(env, { userId: 'usr_learner', bookingId: mine.id, now: NOW }));
  check('a cancellation with no reason is refused, because the schema and the tutor both need one',
    e && e.fields.reason === 'Required');

  const e2 = await refusal(() => cancelBooking(env, {
    userId: 'usr_other', bookingId: mine.id, reason: 'Not mine to cancel.', now: NOW,
  }));
  check('another learner\'s booking is NOT FOUND, never FORBIDDEN — a 403 would confirm it exists',
    e2 && e2.name === 'NotFoundError');

  const done = await cancelBooking(env, { userId: 'usr_learner', bookingId: mine.id, reason: 'Ill.', now: NOW });
  check('a learner\'s own cancellation is recorded as the learner\'s',
    done.booking.status === 'cancelled_by_learner' && done.booking.reason === 'Ill.');
  check('and the place goes back into the slot', done.slot.placesLeft === 1);
  check('and the learner is told they may book the time again',
    /may book this time again/.test(done.note));

  const again = await refusal(() => cancelBooking(env, { userId: 'usr_learner', bookingId: mine.id, reason: 'Twice.', now: NOW }));
  check('cancelling twice is refused', again && /already cancelled/i.test(again.message));

  const rebooked = await bookSlot(env, { userId: 'usr_learner', slotId: 'slt_open', now: NOW });
  check('and the partial index really does allow booking the same slot again after a cancellation',
    rebooked.booking.status === 'booked');
}
{
  const e = await refusal(() => cancelBooking(env, {
    userId: 'usr_learner', bookingId: 'bkg_withdrawn', reason: 'Trying.', now: NOW,
  }));
  check('a tutor\'s cancellation never reads as the learner\'s, even when they try to cancel it',
    e && /Your tutor already cancelled this tutorial: Tutor unwell\./.test(e.message), e && e.message);
}
{
  booking('bkg_past', 'slt_past', 'usr_third');
  const e = await refusal(() => cancelBooking(env, {
    userId: 'usr_third', bookingId: 'bkg_past', reason: 'Too late.', now: NOW,
  }));
  check('a tutorial that has begun cannot be cancelled — attendance is the tutor\'s to record',
    e && /already started; your tutor records/.test(e.message));
}
{
  const e = await refusal(() => cancelBooking(env, { userId: 'usr_learner', bookingId: 'bkg_nope', reason: 'x', now: NOW }));
  check('an unknown booking is a 404', e && e.name === 'NotFoundError');
}

// =====================================================================
// 7 · WHAT A TUTOR PUBLISHES
// =====================================================================
const tutor = db.prepare(`SELECT * FROM users WHERE id='usr_tutor'`).first();
const admin = db.prepare(`SELECT * FROM users WHERE id='usr_admin'`).first();
{
  const made = await publishSlot(env, {
    tutor, title: 'One-to-one: essay structure', kind: 'tutorial',
    startsAt: '2026-10-01T14:00:00+04:00', durationMinutes: 45, capacity: 1,
    levelId: 3, unitId: 'unt_3a', joinUrl: 'https://meet.example.com/essay', now: NOW,
  });
  check('a tutor publishes an hour and it is open',
    made.slot.status === 'open' && made.slot.capacity === 1 && made.slot.durationMinutes === 45);
  check('an offset time is stored as the instant it names, not as the digits',
    made.slot.startsAt.utc === '2026-10-01T10:00:00Z', made.slot.startsAt.utc);
  check('the module it belongs to is resolved, not merely accepted',
    made.slot.unitTitle === 'Reported Speech' && made.slot.levelRoman === 'III');
}
{
  const fields = {};
  parseOffsetInstant('2026-10-01T14:00:00', fields, 'startsAt');
  check('THE REFUSAL THIS MODULE EXISTS FOR: a time with no offset is not a time',
    /explicit offset/.test(fields.startsAt), fields.startsAt);
  const e = await refusal(() => publishSlot(env, {
    tutor, title: 'Naive', startsAt: '2026-10-02T14:00', now: NOW,
  }));
  check('and the route-level call refuses it too, with the field named',
    e && e.name === 'ValidationError' && /explicit offset/.test(e.fields.startsAt));
}
{
  const e = await refusal(() => publishSlot(env, { tutor, title: 'Past', startsAt: '2026-08-01T14:00:00Z', now: NOW }));
  check('an hour in the past cannot be offered', e && e.fields.startsAt === 'A time in the future');
  const e2 = await refusal(() => publishSlot(env, { tutor, title: 'Far', startsAt: '2031-08-01T14:00:00Z', now: NOW }));
  check('nor one four years out — that is a diary, not a timetable', e2 && /Within \d+ days/.test(e2.fields.startsAt));
  const e3 = await refusal(() => publishSlot(env, { tutor, title: 'x', startsAt: '2026-10-03T14:00:00Z', now: NOW }));
  check('a title of one character is refused with a range', e3 && e3.fields.title);
  const e4 = await refusal(() => publishSlot(env, {
    tutor, title: 'Bad duration', startsAt: '2026-10-03T14:00:00Z', durationMinutes: 900, now: NOW,
  }));
  check('a nine-hour tutorial is refused', e4 && e4.fields.durationMinutes);
  const e5 = await refusal(() => publishSlot(env, {
    tutor, title: 'Bad kind', kind: 'seminar', startsAt: '2026-10-03T14:00:00Z', now: NOW,
  }));
  check('a kind the schema does not have is refused before SQLite sees it',
    e5 && e5.fields.kind === `One of: ${SLOT_KINDS.join(', ')}`);
  const e6 = await refusal(() => publishSlot(env, {
    tutor, title: 'Defence', kind: 'oral_defence', capacity: 3, startsAt: '2026-10-03T14:00:00Z', now: NOW,
  }));
  check('an oral defence takes one candidate, whatever capacity was sent',
    e6 && e6.fields.capacity === 'An oral defence takes one candidate');
  const e7 = await refusal(() => publishSlot(env, {
    tutor, title: 'Insecure', startsAt: '2026-10-03T14:00:00Z', joinUrl: 'http://meet.example.com/x', now: NOW,
  }));
  check('a join link that is not https is refused — learners click these without thinking',
    e7 && e7.fields.joinUrl === 'An https:// address');
  const e8 = await refusal(() => publishSlot(env, {
    tutor, title: 'Wrong module', startsAt: '2026-10-03T14:00:00Z', levelId: 3, unitId: 'unt_1a', now: NOW,
  }));
  check('a module that belongs to another level is refused, not silently kept',
    e8 && /not part of Level III/.test(e8.message));
  const e9 = await refusal(() => publishSlot(env, {
    tutor, title: 'No level', startsAt: '2026-10-03T14:00:00Z', levelId: 99, now: NOW,
  }));
  check('a level that does not exist is refused', e9 && e9.fields.levelId === 'Unknown level');
}
{
  const e = await refusal(() => publishSlot(env, {
    tutor, title: 'Clashing', startsAt: '2026-10-01T14:15:00+04:00', durationMinutes: 30, now: NOW,
  }));
  check('a tutor cannot offer the same fifteen minutes twice, and is shown what it clashes with',
    e && /already offer time from/.test(e.message) && /Overlaps/.test(e.fields.startsAt), e && e.message);
  const ok = await publishSlot(env, {
    tutor, title: 'Adjacent', startsAt: '2026-10-01T14:45:00+04:00', durationMinutes: 30, now: NOW,
  });
  check('but back-to-back hours are fine — the clash rule is an overlap, not a gap',
    ok.slot.status === 'open');
}
{
  const seated = await publishSlot(env, {
    tutor, title: 'A seat at the Thursday class', kind: 'workshop',
    startsAt: '2026-09-02T13:00:00Z', liveSessionId: 'lsn_l3', capacity: 8, now: NOW,
  });
  check('a slot may be a seat at an existing class — live_sessions is built on, not replaced',
    seated.slot.liveSessionId === 'lsn_l3' && seated.slot.levelId === 3);
  const e = await refusal(() => publishSlot(env, {
    tutor, title: 'Disagreeing seat', startsAt: '2026-09-02T16:00:00Z', liveSessionId: 'lsn_l3', now: NOW,
  }));
  check('and it must start when the class starts, or it is a second answer to when the class is',
    e && /must start when the class does/.test(e.message));
  const e2 = await refusal(() => publishSlot(env, {
    tutor, title: 'Unknown class', startsAt: '2026-10-05T13:00:00Z', liveSessionId: 'lsn_nope', now: NOW,
  }));
  check('an unknown class id is refused', e2 && e2.fields.liveSessionId === 'Unknown session');
}

// =====================================================================
// 8 · WITHDRAWING — THE CASCADE, WITH THE TUTOR'S NAME ON IT
// =====================================================================
{
  slot('slt_towithdraw', { startsAt: iso('2026-09-20T10:00:00Z'), capacity: 3 });
  const doomed = await bookSlot(env, { userId: 'usr_learner', slotId: 'slt_towithdraw', now: NOW });
  await bookSlot(env, { userId: 'usr_other', slotId: 'slt_towithdraw', now: NOW });
  const before = await learnerTimetable(env, { userId: 'usr_learner', now: NOW });
  check('the booking is on the learner\'s timetable before the tutor withdraws it',
    before.events.some((e) => e.source.id === doomed.booking.id));

  const e = await refusal(() => withdrawSlot(env, { tutor, slotId: 'slt_towithdraw', now: NOW }));
  check('withdrawing without a reason is refused — two learners are about to read it',
    e && e.fields.reason === 'Required');

  const stranger = db.prepare(`SELECT * FROM users WHERE id='usr_stranger'`).first();
  const e2 = await refusal(() => withdrawSlot(env, {
    tutor: stranger, slotId: 'slt_towithdraw', reason: 'Not mine.', now: NOW,
  }));
  check('a colleague cannot withdraw another tutor\'s hour', e2 && e2.httpStatus === 403);

  const done = await withdrawSlot(env, {
    tutor, slotId: 'slt_towithdraw', reason: 'Called to an examination board.', now: NOW,
  });
  check('the slot is cancelled with the reason on it, never deleted',
    done.slot.status === 'cancelled' && done.slot.cancelledReason === 'Called to an examination board.');
  check('and every learner in it is released, with the count reported back to the tutor',
    done.learnersCancelled === 2 && /2 learners held a place/.test(done.note));

  const rows = db.prepare(`SELECT status, cancellation_reason AS why FROM slot_bookings WHERE slot_id='slt_towithdraw'`).all().results;
  check('each released booking says the TUTOR cancelled it, carrying the tutor\'s reason',
    rows.length === 2 && rows.every((r) => r.status === 'cancelled_by_tutor' && r.why === 'Called to an examination board.'));

  const learnerFeed = await learnerTimetable(env, { userId: 'usr_learner', now: NOW });
  check('and it is out of the learner\'s week immediately',
    !learnerFeed.events.some((e2v) => e2v.source.id === doomed.booking.id));

  const twice = await refusal(() => withdrawSlot(env, { tutor, slotId: 'slt_towithdraw', reason: 'Again.', now: NOW }));
  check('withdrawing twice is refused, quoting the first reason', twice && /already withdrawn/.test(twice.message));

  const past = await refusal(() => withdrawSlot(env, { tutor, slotId: 'slt_past', reason: 'Too late.', now: NOW }));
  check('an hour that has already passed cannot be un-offered', past && /already passed/.test(past.message));

  const byAdmin = await withdrawSlot(env, { tutor: admin, slotId: 'slt_closed', reason: 'Published in error.', now: NOW });
  check('an administrator may withdraw a slot a departed tutor left behind',
    byAdmin.slot.status === 'cancelled');
}

// =====================================================================
// 9 · THE TUTOR'S DIARY
// =====================================================================
{
  const diary = await tutorSlots(env, { tutor, from: NOW, limit: 50 });
  check('a tutor sees their own published hours and the count of places taken',
    diary.basis === 'own' && diary.slots.length > 0 && diary.counts.slots === diary.slots.length);
  check('and sees who is in them, by name — the booking IS the teaching relation',
    diary.slots.some((s) => s.bookings.some((b) => b.learner.preferredName === 'Amina')));

  const e = await refusal(() => tutorSlots(env, { tutor, tutorId: 'usr_stranger', from: NOW }));
  check('a tutor cannot read a colleague\'s diary', e && e.httpStatus === 403);

  const byAdmin = await tutorSlots(env, { tutor: admin, tutorId: 'usr_tutor', from: NOW });
  check('an administrator may, and the payload says on what basis', byAdmin.basis === 'admin');
}

// =====================================================================
// 10 · INPUT PARSING — REFUSED, NEVER COERCED
// =====================================================================
check('limit defaults rather than demanding a parameter', parseLimit(null) === TIMETABLE.defaultLimit);
check('days defaults too', parseHorizonDays(null) === TIMETABLE.defaultHorizonDays);
for (const bad of ['0', '-1', '2.5', 'seven', '1000']) {
  check(`days refuses "${bad}" rather than coercing it`, (() => {
    try { parseHorizonDays(bad); return false; } catch (e) { return e.name === 'ValidationError' && Boolean(e.fields.days); }
  })());
}
for (const bad of ['0', 'x', '201']) {
  check(`limit refuses "${bad}"`, (() => {
    try { parseLimit(bad); return false; } catch (e) { return e.name === 'ValidationError' && Boolean(e.fields.limit); }
  })());
}
{
  const f = {};
  check('an offset time is accepted in both its legal spellings',
    parseOffsetInstant('2026-09-01T13:00:00Z', f, 'a') === Date.parse('2026-09-01T13:00:00Z')
    && parseOffsetInstant('2026-09-01T17:00:00+04:00', f, 'b') === Date.parse('2026-09-01T13:00:00Z'));
  const g = {};
  parseOffsetInstant('01/09/2026 13:00', g, 'startsAt');
  check('and anything else is refused', Boolean(g.startsAt));
}

// =====================================================================
// 11 · THE ROUTES, WITH REAL TOKENS
// =====================================================================
const b64url = (bytes) => Buffer.from(bytes).toString('base64')
  .replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
const encPart = (obj) => b64url(new TextEncoder().encode(JSON.stringify(obj)));
const kp = await crypto.subtle.generateKey(
  { name: 'RSASSA-PKCS1-v1_5', modulusLength: 2048, publicExponent: new Uint8Array([1, 0, 1]), hash: 'SHA-256' },
  true, ['sign', 'verify'],
);
const jwk = { ...(await crypto.subtle.exportKey('jwk', kp.publicKey)), kid: 'kid-1', alg: 'RS256', use: 'sig' };
globalThis.fetch = async () => ({ ok: true, status: 200, json: async () => ({ keys: [jwk] }) });
async function token(sub) {
  const h = encPart({ alg: 'RS256', typ: 'JWT', kid: 'kid-1' });
  const t = Math.floor(Date.now() / 1000);
  const p = encPart({ sub, email: `${sub}@example.com`, email_verified: true, iat: t - 5, exp: t + 600 });
  const sig = await crypto.subtle.sign('RSASSA-PKCS1-v1_5', kp.privateKey, new TextEncoder().encode(`${h}.${p}`));
  return `${h}.${p}.${b64url(new Uint8Array(sig))}`;
}
const TOK = {
  learner: await token('sub_learner'), other: await token('sub_other'),
  tutor: await token('sub_tutor'), admin: await token('sub_admin'),
};
const BASE = 'https://wec-lc.test/api';
const get = (url, tok) => new Request(url, tok ? { headers: { Authorization: `Bearer ${tok}` } } : undefined);
const send = (method, url, tok, body) => new Request(url, {
  method,
  headers: { ...(tok ? { Authorization: `Bearer ${tok}` } : {}), 'Content-Type': 'application/json' },
  body: JSON.stringify(body ?? {}),
});

check('GET /api/student/timetable refuses an unauthenticated caller',
  (await timetableRoute.onRequestGet({ request: get(`${BASE}/student/timetable`), env })).status === 401);
check('POST /api/student/booking refuses an unauthenticated caller',
  (await bookingRoute.onRequestPost({ request: send('POST', `${BASE}/student/booking`, null, {}), env })).status === 401);
check('DELETE /api/student/booking refuses an unauthenticated caller',
  (await bookingRoute.onRequestDelete({ request: send('DELETE', `${BASE}/student/booking`, null, {}), env })).status === 401);
check('GET /api/staff/slots refuses an unauthenticated caller',
  (await slotsRoute.onRequestGet({ request: get(`${BASE}/staff/slots`), env })).status === 401);
check('POST /api/staff/slots refuses an unauthenticated caller',
  (await slotsRoute.onRequestPost({ request: send('POST', `${BASE}/staff/slots`, null, {}), env })).status === 401);
check('a learner cannot reach the staff endpoint at all',
  (await slotsRoute.onRequestGet({ request: get(`${BASE}/staff/slots`, TOK.learner), env })).status === 403);
check('and cannot publish availability either',
  (await slotsRoute.onRequestPost({ request: send('POST', `${BASE}/staff/slots`, TOK.learner, { title: 'Mine now', startsAt: '2026-12-01T10:00:00Z' }), env })).status === 403);

for (const src of ['functions/api/student/timetable.js', 'functions/api/student/booking.js']) {
  const text = readFileSync(loadUrl(src), 'utf8');
  check(`${src} reads no subject from the request — own-data-only by construction`,
    !/(searchParams\.get|body)\s*[.(]\s*['"]?(userId|user_id|studentId|learnerId)/.test(text));
}

{
  const res = await timetableRoute.onRequestGet({ request: get(`${BASE}/student/timetable`, TOK.learner), env });
  const body = await res.json();
  check('a learner gets their own feed, with the zone notice on it',
    res.status === 200 && body.subject.userId === 'usr_learner' && Boolean(body.zone.notice));
  check('and a userId in the query string is simply not a parameter this route has',
    (await (await timetableRoute.onRequestGet({
      request: get(`${BASE}/student/timetable?userId=usr_other`, TOK.learner), env,
    })).json()).subject.userId === 'usr_learner');
  check('a timetable is never cached by anything between the College and the learner',
    res.headers.get('cache-control') === 'private, no-store');
  check('a bad days parameter is a 422 with the field named, not a 500',
    (await timetableRoute.onRequestGet({ request: get(`${BASE}/student/timetable?days=999`, TOK.learner), env })).status === 422);
  check('an unknown format is refused rather than silently served as JSON',
    (await timetableRoute.onRequestGet({ request: get(`${BASE}/student/timetable?format=pdf`, TOK.learner), env })).status === 422);

  const cal = await timetableRoute.onRequestGet({ request: get(`${BASE}/student/timetable?format=ics`, TOK.learner), env });
  check('the same route serves the calendar file, typed and named for the client',
    cal.status === 200 && cal.headers.get('content-type') === 'text/calendar; charset=utf-8'
    && /filename="worldwide-english-college-timetable\.ics"/.test(cal.headers.get('content-disposition')));
  check('and it is a calendar', (await cal.text()).startsWith('BEGIN:VCALENDAR'));
}

// The full round trip: a tutor publishes an hour through the route, a
// learner books it through the route, and gives it back through the
// route. Real clock, because that is what the routes use.
{
  // Off the hour, deliberately. This was `now + 14 days` on the dot,
  // which is a fixed time of day — and every fixture slot above sits at
  // 15:00Z. On 21 August 2026 the arithmetic landed exactly on
  // `slt_theirs`, the overlap rule fired as designed, and a test that
  // had passed for weeks failed on a date rather than on a change. A
  // round offset from the real clock will always eventually collide
  // with a fixture written at a round time; :37 past cannot.
  const soon = new Date(Date.now() + 14 * 86400000 + 37 * 60000 + 3 * 3600000)
    .toISOString().replace(/\.\d{3}Z$/, 'Z');
  const published = await slotsRoute.onRequestPost({
    request: send('POST', `${BASE}/staff/slots`, TOK.tutor, {
      title: 'Speaking practice', kind: 'tutorial', startsAt: soon, durationMinutes: 30, capacity: 1, levelId: 3,
    }),
    env,
  });
  const pubBody = await published.json();
  check('a tutor publishes an hour through the route', published.status === 201 && pubBody.slot.status === 'open');

  const booked = await bookingRoute.onRequestPost({
    request: send('POST', `${BASE}/student/booking`, TOK.learner, { slotId: pubBody.slot.id, learnerNote: 'Pronunciation.' }),
    env,
  });
  const bookBody = await booked.json();
  check('a learner books it through the route', booked.status === 201 && bookBody.booking.status === 'booked');

  const clash = await bookingRoute.onRequestPost({
    request: send('POST', `${BASE}/student/booking`, TOK.other, { slotId: pubBody.slot.id }),
    env,
  });
  check('the second learner is refused with a 422 and a field to highlight',
    clash.status === 422 && Boolean((await clash.json()).fields.slotId));

  const inFeed = await (await timetableRoute.onRequestGet({ request: get(`${BASE}/student/timetable`, TOK.learner), env })).json();
  check('and it is in the learner\'s timetable the moment it is booked',
    inFeed.events.some((e) => e.source.id === bookBody.booking.id));

  const noReason = await bookingRoute.onRequestDelete({
    request: send('DELETE', `${BASE}/student/booking`, TOK.learner, { bookingId: bookBody.booking.id }),
    env,
  });
  check('cancelling through the route still demands a reason', noReason.status === 422);

  const cancelled = await bookingRoute.onRequestDelete({
    request: send('DELETE', `${BASE}/student/booking`, TOK.learner, {
      bookingId: bookBody.booking.id, reason: 'Interview that afternoon.',
    }),
    env,
  });
  check('and cancels it as the learner\'s own act',
    cancelled.status === 200 && (await cancelled.json()).booking.status === 'cancelled_by_learner');

  const withdrawn = await slotsRoute.onRequestPost({
    request: send('POST', `${BASE}/staff/slots`, TOK.tutor, {
      action: 'withdraw', slotId: pubBody.slot.id, reason: 'Timetable clash.',
    }),
    env,
  });
  check('and the tutor withdraws the hour through the same route',
    withdrawn.status === 200 && (await withdrawn.json()).slot.status === 'cancelled');

  const badAction = await slotsRoute.onRequestPost({
    request: send('POST', `${BASE}/staff/slots`, TOK.tutor, { action: 'delete', slotId: pubBody.slot.id }),
    env,
  });
  check('an action the route does not have is refused, not guessed at', badAction.status === 422);

  const diary = await slotsRoute.onRequestGet({ request: get(`${BASE}/staff/slots`, TOK.tutor), env });
  check('and the tutor\'s diary comes back through the route', diary.status === 200 && (await diary.json()).basis === 'own');
}

console.log(`\n${pass} passed, ${fail} failed.`);
process.exit(fail ? 1 : 0);
