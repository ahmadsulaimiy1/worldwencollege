/* THE WEEK, ASSEMBLED ONCE, IN THE HOURS THE LEARNER ACTUALLY KEEPS.
 *
 * ────────────────────────────────────────────────────────────────
 * THE FAULT THIS FILE CORRECTS
 * ────────────────────────────────────────────────────────────────
 * The platform knew every date a learner needed and would tell them none
 * of it in one place. `listLiveSessions()` in functions/_lib/lms/content.js
 * answers "what classes exist at Level III" — one level, one list, no
 * bookings, no deadlines. `slot_bookings` and `tutorial_slots` arrived
 * with migration 020 and had no reader at all: a table recording that a
 * learner holds a place at 14:00 on Thursday, and no query anywhere that
 * would ever tell them so. `offers.expires_at` is NOT NULL precisely
 * because, in the schema's own words, "an offer with no expiry is a place
 * held open for ever" — and nothing ever put that date in front of the
 * person it runs out on.
 *
 * So a learner assembled their own week from three screens, and the one
 * item with a deadline on it was on the screen they did not open. This
 * file is the merge: one sorted feed, every stream saying where it came
 * from, and — for the one stream the schema cannot yet supply — saying
 * plainly that it cannot rather than returning a shorter list that looks
 * complete.
 *
 * ────────────────────────────────────────────────────────────────
 * THE SECOND FAULT: 10:00 IS THREE DIFFERENT HOURS
 * ────────────────────────────────────────────────────────────────
 * Every timestamp in this schema is UTC by construction — the column
 * defaults are strftime('%Y-%m-%dT%H:%M:%fZ','now') and nothing has ever
 * converted one on the way out. The College teaches into the Gulf, West
 * Africa and South Asia, and a class at 10:00Z is 11:00 in Lagos, 14:00
 * in Dubai and 15:30 in Colombo. A feed that prints the stored string, or
 * — worse — prints it stripped of its Z so a browser reads it as local,
 * is one missed class and one support ticket per learner per week.
 *
 * `student_settings.time_zone` was added in migration 020 for exactly
 * this, described there as "the single most useful setting the platform
 * does not have". This is the first file to read it. Every instant in
 * every payload below is returned TWICE and never once:
 *
 *   utc    2026-09-01T13:00:00Z        the instant, unambiguous
 *   local  2026-09-01T17:00:00+04:00   the same instant, with the offset
 *                                      SPELLED OUT, never implied
 *
 * The offset is computed per instant, not per learner, because a zone is
 * not a number: America/New_York is −05:00 in January and −04:00 in July,
 * and a timetable that caches one offset moves every class by an hour
 * twice a year. `offsetMinutesFor()` asks Intl for the wall clock in the
 * zone at that instant and subtracts. There is no offset table here and
 * there must never be one.
 *
 * A learner who has set no zone is told so — `source: 'default'` and a
 * notice naming UTC — rather than quietly served UTC as if it were
 * theirs. An unset preference and a preference for UTC are different
 * facts, in the manner `bestScore: null` distinguishes an untouched
 * module from a failed one.
 *
 * ────────────────────────────────────────────────────────────────
 * CAPACITY IS A CONSTRAINT SQLITE CANNOT CARRY, SO THIS FILE CARRIES IT
 * ────────────────────────────────────────────────────────────────
 * sql/schema.sql says it in terms on `tutorial_slots.capacity`: "Capacity
 * is declared here and ENFORCED IN THE APPLICATION: SQLite cannot count
 * another table's rows in a CHECK, so the booking path must count live
 * bookings inside the same statement that inserts one."
 *
 * `bookSlot()` is that statement. The count is a subquery of the INSERT
 * itself — `INSERT ... SELECT ... WHERE (SELECT COUNT(*) ...) < capacity`
 * — so two learners racing for the last place cannot both read "one left"
 * and both write. A read-then-write would pass every test ever written
 * for it and oversell the last seat of an oral defence on the one day it
 * matters. Zero rows inserted IS the refusal, and the friendly message is
 * composed afterwards from a re-read.
 *
 * The double booking is the schema's own job — `idx_slot_bookings_one_live`
 * is a partial UNIQUE over the non-cancelled states — so this file checks
 * first for the message and treats a raised constraint as the same
 * refusal. Two guards for one rule, deliberately: the index is what is
 * true under concurrency, the check is what the learner reads.
 *
 * ────────────────────────────────────────────────────────────────
 * A CANCELLATION HAS A HAND ON IT
 * ────────────────────────────────────────────────────────────────
 * `slot_bookings.status` carries who cancelled, not merely that somebody
 * did, and the schema is explicit that this exists so "a tutor's
 * cancellation never reads as a learner's on the learner's own record".
 * Two consequences are load-bearing here:
 *
 *   withdrawSlot() CASCADES. A tutor who withdraws an offered hour with
 *   learners in it writes 'cancelled_by_tutor' on every one of their
 *   bookings, carrying the tutor's own reason. Leaving the bookings live
 *   would leave a learner holding a place at a tutorial that will not
 *   happen, and leaving them un-cascaded but hidden would put the
 *   cancellation on the learner's record with no hand on it.
 *
 *   Neither path will write a cancellation without a reason. The schema
 *   refuses it (CHECK status != 'cancelled' OR cancelled_reason IS NOT
 *   NULL); this file refuses it earlier, with the field named, so the
 *   refusal is something a form can highlight rather than a 500.
 */

import {
  db, newId, nowIso, ValidationError, NotFoundError,
  parseLimit as sharedParseLimit,
} from '../db.js';
import { AuthorizationError } from '../auth/session.js';

/* ───────────────────────────────────────────────────────────────
 * THE NUMBERS, AND WHY EACH ONE IS THAT NUMBER
 * ─────────────────────────────────────────────────────────────── */
export const TIMETABLE = {
  /** A feed is what is next, not an archive. Sixty days covers a level. */
  defaultHorizonDays: 60,
  /** A year out is already beyond anything the College has scheduled. */
  maxHorizonDays: 365,
  /** Enough for a fortnight of a full week without a scroll. */
  defaultLimit: 20,
  /** A calendar export of a whole level; beyond this it is a data dump. */
  maxLimit: 200,
  /** Long enough to state a problem, short enough not to be an essay. */
  maxNoteLength: 1000,
  /** A cancellation reason a registrar can read in a list. */
  maxReasonLength: 500,
  /** Nothing the College teaches runs under five minutes or over eight hours. */
  minDurationMinutes: 5,
  maxDurationMinutes: 480,
  /** A tutorial group beyond this is a class, and classes are live_sessions. */
  maxCapacity: 50,
  /** Publishing further out than this is a diary, not a timetable. */
  maxScheduleAheadDays: 730,
};

export const SLOT_KINDS = ['tutorial', 'oral_defence', 'office_hour', 'workshop'];

/**
 * "Live" for a booking, spelled exactly as `idx_slot_bookings_one_live`
 * spells it. One definition, used by the capacity count, the feed and the
 * cascade — a second one is how a full slot and a bookable slot become
 * the same slot.
 */
export const CANCELLED_BOOKING_STATES = ['cancelled_by_learner', 'cancelled_by_tutor'];
const LIVE_BOOKING_SQL = `status NOT IN ('cancelled_by_learner','cancelled_by_tutor')`;

/**
 * Which of a learner's enrolments put a class on their timetable.
 *
 * This is content.js's rule, not a new one: assertLevelAccess() admits
 * 'active' and 'completed' and nothing else. It matters that the two
 * agree, because `live_sessions.join_url` is an access credential — the
 * Zoom link IS the classroom door — and a timetable that returned it
 * under a looser rule than the content endpoint would be the way around
 * that endpoint rather than a view of it. A learner whose enrolment is
 * still 'pending_payment' is told why their classes are not listed
 * instead, in `notice` below.
 */
const CLASS_ENROLMENT_STATES = ['active', 'completed'];
const CLASS_ENROLMENT_SQL = CLASS_ENROLMENT_STATES.map((v) => `'${v}'`).join(',');

/* ═══════════════════════════════════════════════════════════════
 * 1 · TIME
 * ═══════════════════════════════════════════════════════════════ */

/** A zone the runtime's own ICU data recognises, or nothing. */
export function isValidTimeZone(zone) {
  if (typeof zone !== 'string' || !zone.trim()) return false;
  try {
    new Intl.DateTimeFormat('en-US', { timeZone: zone });
    return true;
  } catch {
    return false;
  }
}

/**
 * The offset of `timeZone` AT THIS INSTANT, in minutes east of UTC.
 *
 * Asked of Intl rather than looked up: the wall clock in the zone,
 * reassembled as if it were UTC, minus the instant, is the offset by
 * definition — and it is right across every daylight-saving transition
 * and every historic rule change without this file knowing one of them.
 */
export function offsetMinutesFor(instantMs, timeZone) {
  if (!isValidTimeZone(timeZone)) return 0;
  const parts = new Intl.DateTimeFormat('en-US', {
    timeZone, hour12: false,
    year: 'numeric', month: '2-digit', day: '2-digit',
    hour: '2-digit', minute: '2-digit', second: '2-digit',
  }).formatToParts(new Date(instantMs));
  const p = {};
  for (const part of parts) p[part.type] = part.value;
  // Some engines render midnight as hour '24' under hour12:false.
  const asIfUtc = Date.UTC(
    Number(p.year), Number(p.month) - 1, Number(p.day),
    Number(p.hour) % 24, Number(p.minute), Number(p.second),
  );
  return Math.round((asIfUtc - Math.floor(instantMs / 1000) * 1000) / 60000);
}

/** '+04:00', '-05:00', 'Z' — never a bare number, never a zone abbreviation. */
export function formatOffset(minutes) {
  if (!minutes) return 'Z';
  const sign = minutes < 0 ? '-' : '+';
  const abs = Math.abs(minutes);
  return `${sign}${pad2(Math.floor(abs / 60))}:${pad2(abs % 60)}`;
}

/**
 * Milliseconds for a stored or supplied timestamp, or null.
 *
 * Null rather than NaN or a thrown error: a single unreadable row must
 * not empty a learner's whole week, so the feed drops it and counts it
 * (see `unreadable` in the payload) while every other event survives.
 */
export function toInstant(raw) {
  if (typeof raw !== 'string' || !raw) return null;
  const ms = Date.parse(raw);
  return Number.isFinite(ms) ? ms : null;
}

/**
 * The instant, to the second, with the Z spelled out.
 *
 * Seconds rather than milliseconds deliberately: nothing the College
 * schedules starts at 13:00:00.472, and a payload full of three
 * meaningless digits invites a UI to print them.
 */
export function utcIso(ms) {
  return new Date(ms).toISOString().replace(/\.\d{3}Z$/, 'Z');
}

/** The same instant as a wall clock in `timeZone`, offset spelled out. */
export function localIso(ms, timeZone) {
  const offset = offsetMinutesFor(ms, timeZone);
  const shifted = new Date(Math.floor(ms / 1000) * 1000 + offset * 60000);
  return shifted.toISOString().replace(/\.\d{3}Z$/, '') + formatOffset(offset);
}

/**
 * Every instant this module hands out, in both readings at once.
 *
 * Both, always, is the point. A payload carrying only the local time is
 * ambiguous the moment a learner changes their setting; a payload
 * carrying only UTC pushes the conversion into a browser, which is where
 * it goes wrong. Returning both makes a UI that prints the wrong one a
 * visible mistake rather than an invisible one.
 */
export function renderInstant(raw, timeZone) {
  const ms = toInstant(raw);
  if (ms === null) return null;
  const offset = offsetMinutesFor(ms, timeZone);
  return {
    utc: utcIso(ms),
    local: localIso(ms, timeZone),
    offset: formatOffset(offset),
    offsetMinutes: offset,
    timeZone,
    epochMs: ms,
  };
}

/**
 * The zone the feed will be rendered in, and where it came from.
 *
 * An unrecognised stored zone is reported, not silently swallowed: a
 * learner who typed 'GMT+4' into a settings form and sees UTC times
 * needs to know the platform did not accept it. UTC is the fallback
 * because it is the one zone that cannot be wrong about itself.
 */
export async function zoneFor(env, userId) {
  const row = await db(env)
    .prepare('SELECT time_zone AS timeZone FROM student_settings WHERE user_id = ?')
    .bind(userId)
    .first();
  const stored = row && row.timeZone ? row.timeZone : null;

  if (stored && isValidTimeZone(stored)) {
    return {
      timeZone: stored,
      source: 'student_settings',
      notice: `Times are shown in ${stored}, from your settings, and every one carries its UTC instant beside it.`,
    };
  }
  if (stored) {
    return {
      timeZone: 'UTC',
      source: 'default',
      rejected: stored,
      notice: `Your saved time zone (${stored}) is not one this platform recognises, so times are shown in UTC. Set a zone such as Asia/Dubai or Africa/Lagos in your settings.`,
    };
  }
  return {
    timeZone: 'UTC',
    source: 'default',
    notice: 'You have not set a time zone, so times are shown in UTC with the offset spelled out. Set one in your settings and this timetable follows it.',
  };
}

/* ═══════════════════════════════════════════════════════════════
 * 2 · THE FEED
 * ═══════════════════════════════════════════════════════════════ */

/**
 * One merged, sorted feed of what is next for one learner.
 *
 * THE SUBJECT IS THE CALLER AND ONLY THE CALLER. `userId` comes from the
 * session at the route and is never read from a URL — the rule
 * functions/api/student/dashboard.js sets out and the reason this
 * function takes no id it could be handed by a browser.
 */
export async function learnerTimetable(env, {
  userId, now = Date.now(), horizonDays = TIMETABLE.defaultHorizonDays, limit = TIMETABLE.defaultLimit,
} = {}) {
  const zone = await zoneFor(env, userId);
  const tz = zone.timeZone;
  const fromMs = now;
  const untilMs = now + horizonDays * 86400000;

  // The SQL bounds are deliberately one second wider than the real
  // window at each end, and the exact filter is applied in JavaScript
  // below. Timestamps in this database are ISO strings of two different
  // precisions — the column defaults write milliseconds, this file
  // writes milliseconds, and a row imported by hand may not — and a
  // lexicographic `>=` between '...:00Z' and '...:00.000Z' is off by the
  // width of that difference. Widening the bound and filtering on parsed
  // instants is exact regardless of what precision any row happens to
  // carry.
  const loBound = new Date(fromMs - 1000).toISOString();
  const hiBound = new Date(untilMs + 1000).toISOString();
  const perStream = Math.min(TIMETABLE.maxLimit, Math.max(limit, TIMETABLE.defaultLimit));

  const events = [];
  const unreadable = [];

  /* ── Classes ────────────────────────────────────────────────
   * The enrolment is an EXISTS predicate rather than a list of level
   * ids fetched first and interpolated. functions/_lib/comms/announcements.js
   * makes the argument in full: an audience expressed in SQL cannot be
   * widened by a later edit to the handler, and a class the caller may
   * not see is never read out of the database on their request. */
  const classRows = (await db(env).prepare(
    `SELECT s.id, s.title, s.starts_at AS startsAt, s.duration_minutes AS durationMinutes,
            s.join_url AS joinUrl, s.level_id AS levelId, s.unit_id AS unitId,
            u.title AS unitTitle, l.roman AS levelRoman, l.name AS levelName,
            h.preferred_name AS hostName
       FROM live_sessions s
       JOIN programme_levels l ON l.id = s.level_id
       LEFT JOIN units u ON u.id = s.unit_id
       LEFT JOIN users h ON h.id = s.host_user_id
      WHERE s.starts_at >= ?2 AND s.starts_at <= ?3
        AND EXISTS (SELECT 1 FROM enrolments e
                     WHERE e.user_id = ?1 AND e.level_id = s.level_id
                       AND e.status IN (${CLASS_ENROLMENT_SQL}))
      ORDER BY s.starts_at ASC LIMIT ?4`,
  ).bind(userId, loBound, hiBound, perStream).all()).results;

  for (const r of classRows) {
    const at = renderInstant(r.startsAt, tz);
    if (!at) { unreadable.push({ table: 'live_sessions', id: r.id, value: r.startsAt }); continue; }
    events.push({
      id: `class:${r.id}`,
      kind: 'class',
      source: { table: 'live_sessions', id: r.id },
      title: r.title,
      detail: r.unitTitle ? `Module: ${r.unitTitle}` : `Level ${r.levelRoman} — ${r.levelName}`,
      startsAt: at,
      endsAt: endInstant(at, r.durationMinutes, tz),
      durationMinutes: r.durationMinutes,
      levelId: r.levelId,
      levelRoman: r.levelRoman,
      unitId: r.unitId,
      joinUrl: r.joinUrl || null,
      // A learner is told who is teaching, by the name they chose to be
      // known by. Never the staff email: a class list is not a directory.
      host: r.hostName || null,
      bookable: false,
    });
  }

  /* ── Tutorials the learner holds a place in ─────────────────
   * A cancelled slot is excluded rather than shown struck through.
   * withdrawSlot() cascades, so a live booking against a cancelled slot
   * cannot be produced by this platform at all; excluding it in SQL
   * means a row written by any other route cannot resurrect a cancelled
   * tutorial on somebody's calendar. */
  const bookingRows = (await db(env).prepare(
    `SELECT b.id AS bookingId, b.status AS bookingStatus, b.learner_note AS learnerNote,
            b.booked_at AS bookedAt,
            s.id AS slotId, s.title, s.kind, s.starts_at AS startsAt,
            s.duration_minutes AS durationMinutes, s.join_url AS joinUrl,
            s.level_id AS levelId, s.unit_id AS unitId, s.live_session_id AS liveSessionId,
            u.title AS unitTitle, l.roman AS levelRoman,
            t.preferred_name AS tutorName
       FROM slot_bookings b
       JOIN tutorial_slots s ON s.id = b.slot_id
       JOIN users t ON t.id = s.tutor_id
       LEFT JOIN units u ON u.id = s.unit_id
       LEFT JOIN programme_levels l ON l.id = s.level_id
      WHERE b.user_id = ?1 AND b.${LIVE_BOOKING_SQL}
        AND s.status != 'cancelled'
        AND s.starts_at >= ?2 AND s.starts_at <= ?3
      ORDER BY s.starts_at ASC LIMIT ?4`,
  ).bind(userId, loBound, hiBound, perStream).all()).results;

  for (const r of bookingRows) {
    const at = renderInstant(r.startsAt, tz);
    if (!at) { unreadable.push({ table: 'tutorial_slots', id: r.slotId, value: r.startsAt }); continue; }
    events.push({
      id: `tutorial:${r.bookingId}`,
      kind: 'tutorial',
      source: { table: 'slot_bookings', id: r.bookingId },
      title: r.title,
      detail: r.unitTitle ? `Module: ${r.unitTitle}` : KIND_LABEL[r.kind] || 'Tutorial',
      slotKind: r.kind,
      startsAt: at,
      endsAt: endInstant(at, r.durationMinutes, tz),
      durationMinutes: r.durationMinutes,
      levelId: r.levelId,
      levelRoman: r.levelRoman || null,
      unitId: r.unitId,
      joinUrl: r.joinUrl || null,
      tutor: r.tutorName || null,
      liveSessionId: r.liveSessionId,
      booking: {
        id: r.bookingId,
        status: r.bookingStatus,
        note: r.learnerNote,
        bookedAt: renderInstant(r.bookedAt, tz),
      },
      // Stated by the feed rather than recomputed by the page, so the
      // button a learner is shown and the rule cancelBooking() applies
      // are the same rule.
      cancellable: at.epochMs > now,
      bookable: false,
    });
  }

  /* ── Deadlines ──────────────────────────────────────────────
   * See DEADLINE_SOURCES: one source the schema can answer, one it
   * cannot, and the payload says which is which. */
  const offerRows = (await db(env).prepare(
    `SELECT o.id, o.kind, o.conditions, o.expires_at AS expiresAt, o.level_id AS levelId,
            l.roman AS levelRoman, l.name AS levelName
       FROM offers o
       JOIN applications a ON a.id = o.application_id
       JOIN programme_levels l ON l.id = o.level_id
      WHERE a.user_id = ?1 AND o.status = 'issued'
        AND o.expires_at >= ?2 AND o.expires_at <= ?3
      ORDER BY o.expires_at ASC LIMIT ?4`,
  ).bind(userId, loBound, hiBound, perStream).all()).results;

  for (const r of offerRows) {
    const at = renderInstant(r.expiresAt, tz);
    if (!at) { unreadable.push({ table: 'offers', id: r.id, value: r.expiresAt }); continue; }
    events.push({
      id: `deadline:${r.id}`,
      kind: 'deadline',
      source: { table: 'offers', id: r.id },
      title: `Offer of a place at Level ${r.levelRoman} expires`,
      detail: r.kind === 'conditional'
        ? `Conditional offer — ${r.conditions}`
        : `Unconditional offer of a place on the ${r.levelName}.`,
      startsAt: at,
      endsAt: null,
      durationMinutes: null,
      levelId: r.levelId,
      levelRoman: r.levelRoman,
      unitId: null,
      joinUrl: null,
      // What the learner must DO, which is the only reason a deadline is
      // on a calendar at all.
      action: 'reply_to_offer',
      bookable: false,
    });
  }

  // Sorted on the parsed instant, never on the stored string: two rows of
  // different precision describing the same minute would otherwise sort
  // by punctuation. Ties break on kind then id so the order is stable
  // between requests and a paged UI does not shuffle.
  events.sort((a, b) => (a.startsAt.epochMs - b.startsAt.epochMs)
    || a.kind.localeCompare(b.kind) || a.id.localeCompare(b.id));
  const window = events.filter((e) => e.startsAt.epochMs >= fromMs && e.startsAt.epochMs <= untilMs);
  const shown = window.slice(0, limit);

  const enrolments = (await db(env).prepare(
    `SELECT e.level_id AS levelId, e.status, l.roman AS levelRoman
       FROM enrolments e JOIN programme_levels l ON l.id = e.level_id
      WHERE e.user_id = ? AND e.status != 'withdrawn' ORDER BY e.level_id ASC`,
  ).bind(userId).all()).results;

  return {
    subject: { userId },
    zone,
    window: {
      from: renderInstant(new Date(fromMs).toISOString(), tz),
      until: renderInstant(new Date(untilMs).toISOString(), tz),
      horizonDays,
      limit,
    },
    counts: {
      returned: shown.length,
      inWindow: window.length,
      classes: window.filter((e) => e.kind === 'class').length,
      tutorials: window.filter((e) => e.kind === 'tutorial').length,
      deadlines: window.filter((e) => e.kind === 'deadline').length,
    },
    events: shown,
    enrolments,
    // Why a feed is empty is a different fact from a feed being empty,
    // and a learner who has paid and sees nothing deserves the first.
    notice: emptinessNotice(shown, enrolments),
    sources: DEADLINE_SOURCES.concat(FEED_SOURCES),
    unreadable,
  };
}

const KIND_LABEL = {
  tutorial: 'One-to-one tutorial',
  oral_defence: 'Oral defence',
  office_hour: 'Office hour',
  workshop: 'Workshop',
};

/**
 * WHAT THIS FEED READ, AND THE ONE THING IT CANNOT.
 *
 * There is no due date anywhere in this schema. `learning_items` carries
 * a kind of 'quiz' and 'assignment' and no date column of any sort;
 * `assignment_submissions` records when work arrived, never when it was
 * owed. So an assessment deadline cannot be published — not because it
 * was left out of this feed, but because no row in the database knows
 * one.
 *
 * Reporting that in the payload rather than shipping a feed that is
 * quietly missing a third of what it promises is the same choice
 * functions/_lib/reports/institutional.js makes when it reports
 * attendance as `not_instrumented`, and the same one measuredWorkload()
 * makes when it returns `publishable: false` with a reason attached. A
 * number that is not there must say so, or somebody publishes its
 * absence as a zero.
 */
export const DEADLINE_SOURCES = [
  {
    stream: 'deadlines',
    source: 'offers.expires_at',
    readable: true,
    describes: 'The date an offer of a place runs out. NOT NULL in the schema, and until now shown to nobody.',
  },
  {
    stream: 'deadlines',
    source: 'assessment_due_dates',
    readable: false,
    reason: 'No table in this schema records when an assessment is due. learning_items has no date column and assignment_submissions records only when work arrived. The College cannot publish a deadline it does not hold.',
  },
];

const FEED_SOURCES = [
  {
    stream: 'classes',
    source: 'live_sessions',
    readable: true,
    describes: "Scheduled classes at every level the caller holds an active or completed enrolment in — the access rule functions/_lib/lms/content.js applies, because join_url is the classroom door.",
  },
  {
    stream: 'tutorials',
    source: 'slot_bookings',
    readable: true,
    describes: 'Places the caller holds in a tutor\'s offered time, cancelled ones excluded.',
  },
];

function emptinessNotice(shown, enrolments) {
  if (shown.length) return null;
  if (!enrolments.length) {
    return 'Nothing is scheduled for you yet. Your timetable fills as you are enrolled and as tutors publish their hours.';
  }
  const waiting = enrolments.filter((e) => e.status === 'pending_payment');
  if (waiting.length === enrolments.length) {
    return `Your enrolment at Level ${waiting[0].levelRoman} is awaiting payment. Class times and join links appear here once it is active.`;
  }
  return 'Nothing is scheduled in this window. Widen it with the days parameter, or book a tutorial from your tutor\'s published hours.';
}

function endInstant(start, durationMinutes, timeZone) {
  if (!durationMinutes) return null;
  return renderInstant(new Date(start.epochMs + durationMinutes * 60000).toISOString(), timeZone);
}

/* ═══════════════════════════════════════════════════════════════
 * 3 · THE CALENDAR FEED
 * ═══════════════════════════════════════════════════════════════ */

/**
 * The same feed as iCalendar, for the calendar the learner already keeps.
 *
 * A DOWNLOAD, NOT A SUBSCRIPTION, and the distinction is deliberate. A
 * subscribable webcal URL has to authenticate itself, because a calendar
 * client sends no Authorization header — which means a long-lived secret
 * in the URL, which means a table to hold it, revoke it and expire it.
 * No such table exists and inventing one is a schema change. So this is
 * served from the same session-guarded endpoint as the JSON, and a
 * learner who wants live subscription gets the honest answer that it is
 * not built yet rather than a link that leaks their timetable to anyone
 * who ever sees the URL.
 *
 * DTSTART is written in UTC (the Z form) rather than as a local time
 * with a VTIMEZONE. The instant is the fact; the wall clock is the thing
 * that goes wrong. Every calendar client on earth renders a Z instant in
 * the reader's own zone correctly, and none of them can be trusted with a
 * hand-written VTIMEZONE rule for Africa/Lagos.
 */
export function toIcs(feed, { now = Date.now() } = {}) {
  const lines = [
    'BEGIN:VCALENDAR',
    'VERSION:2.0',
    'PRODID:-//WorldWide English College//Timetable//EN',
    'CALSCALE:GREGORIAN',
    'METHOD:PUBLISH',
    `X-WR-CALNAME:${icsEscape('WorldWide English College — timetable')}`,
    `X-WR-TIMEZONE:${icsEscape(feed.zone.timeZone)}`,
  ];
  const stamp = icsStamp(now);

  for (const e of feed.events) {
    lines.push('BEGIN:VEVENT');
    // The event id, not a fresh uuid: re-exporting the same timetable
    // must UPDATE the events already in the reader's calendar rather
    // than duplicate every class each time they download it.
    lines.push(`UID:${e.source.table}-${e.source.id}@worldwencollege.co.uk`);
    lines.push(`DTSTAMP:${stamp}`);
    lines.push(`DTSTART:${icsStamp(e.startsAt.epochMs)}`);
    if (e.endsAt) lines.push(`DTEND:${icsStamp(e.endsAt.epochMs)}`);
    lines.push(`SUMMARY:${icsEscape(e.title)}`);
    if (e.detail) lines.push(`DESCRIPTION:${icsEscape(e.detail)}`);
    if (e.joinUrl) lines.push(`URL:${icsEscape(e.joinUrl)}`);
    lines.push(`CATEGORIES:${icsEscape(e.kind.toUpperCase())}`);
    lines.push('END:VEVENT');
  }
  lines.push('END:VCALENDAR');
  // RFC 5545 wants CRLF and a trailing one. Clients that tolerate LF
  // exist; the ones that silently import nothing also exist.
  return lines.map(foldIcsLine).join('\r\n') + '\r\n';
}

function icsStamp(ms) {
  return new Date(ms).toISOString().replace(/[-:]/g, '').replace(/\.\d{3}/, '');
}

function icsEscape(text) {
  return String(text)
    .replace(/\\/g, '\\\\')
    .replace(/;/g, '\\;')
    .replace(/,/g, '\\,')
    .replace(/\r?\n/g, '\\n');
}

/**
 * RFC 5545 § 3.1: no content line over 75 OCTETS, folded with CRLF and a
 * space. Octets, not characters — a title carrying an em dash or an
 * Arabic name is multi-byte, and a fold that counts characters produces
 * a file that imports with the tail of every long line missing.
 */
function foldIcsLine(line) {
  const enc = new TextEncoder();
  if (enc.encode(line).length <= 75) return line;
  const out = [];
  let current = '';
  let bytes = 0;
  for (const ch of line) {
    const size = enc.encode(ch).length;
    // 74 on continuation lines: the leading space is itself an octet.
    const ceiling = out.length ? 74 : 75;
    if (bytes + size > ceiling) { out.push(current); current = ''; bytes = 0; }
    current += ch;
    bytes += size;
  }
  if (current) out.push(current);
  return out.join('\r\n ');
}

/* ═══════════════════════════════════════════════════════════════
 * 4 · BOOKING
 * ═══════════════════════════════════════════════════════════════ */

/**
 * A learner takes a place in a tutor's offered time.
 *
 * EVERY REFUSAL SAYS ITS OWN THING. A single "cannot book that" would be
 * cheaper to write and would send a learner who is already booked, a
 * learner who is too late, and a learner facing a full oral-defence panel
 * to the same support inbox with the same useless sentence. There are six
 * refusals below and no two share a message.
 */
export async function bookSlot(env, { userId, slotId, learnerNote = null, now = Date.now() }) {
  if (typeof slotId !== 'string' || !slotId.trim()) {
    throw new ValidationError('slotId is required.', { slotId: 'Required' });
  }
  const note = learnerNote === null || learnerNote === undefined ? null : String(learnerNote).trim();
  if (note && note.length > TIMETABLE.maxNoteLength) {
    throw new ValidationError(
      `A note to your tutor may be up to ${TIMETABLE.maxNoteLength} characters.`,
      { learnerNote: `At most ${TIMETABLE.maxNoteLength} characters` },
    );
  }

  const slot = await db(env).prepare(
    `SELECT s.*, t.preferred_name AS tutorName FROM tutorial_slots s
       JOIN users t ON t.id = s.tutor_id WHERE s.id = ?`,
  ).bind(slotId).first();
  if (!slot) throw new NotFoundError('No such tutorial slot.');

  // A tutor may not book their own hour. Not a hypothetical: a tutor
  // testing the booking flow on their own slot fills it and the capacity
  // count has no way to tell that place from a learner's.
  if (slot.tutor_id === userId) {
    throw new ValidationError(
      'This is your own published time. A tutor cannot take a place in their own slot.',
      { slotId: 'Your own slot' },
    );
  }

  if (slot.status === 'cancelled') {
    throw new ValidationError(
      `This tutorial was cancelled by the tutor: ${slot.cancelled_reason}`,
      { slotId: 'Cancelled' },
    );
  }
  if (slot.status !== 'open') {
    throw new ValidationError(
      slot.status === 'held'
        ? 'This tutorial has already been held.'
        : 'This tutorial is no longer taking bookings.',
      { slotId: slot.status === 'held' ? 'Already held' : 'Closed' },
    );
  }

  const startMs = toInstant(slot.starts_at);
  if (startMs === null) {
    throw new ValidationError('This slot carries a start time the platform cannot read. Ask your tutor to republish it.', { slotId: 'Unreadable start time' });
  }
  if (startMs <= now) {
    throw new ValidationError(
      'That tutorial has already started. Ask your tutor to publish another hour.',
      { slotId: 'In the past' },
    );
  }

  // A slot scoped to a level is scoped to it. NULL means an open office
  // hour, which is the only thing that should be open to everybody, and
  // 'not withdrawn' is the live-enrolment definition migration 020 fixed
  // for the announcements audience — a learner who has finished Level II
  // and is waiting on Level III is still that tutor's learner.
  if (slot.level_id !== null && slot.level_id !== undefined) {
    const enrolled = await db(env).prepare(
      `SELECT e.id, l.roman FROM enrolments e JOIN programme_levels l ON l.id = e.level_id
        WHERE e.user_id = ? AND e.level_id = ? AND e.status != 'withdrawn'`,
    ).bind(userId, slot.level_id).first();
    if (!enrolled) {
      const level = await db(env).prepare('SELECT roman FROM programme_levels WHERE id = ?')
        .bind(slot.level_id).first();
      throw new ValidationError(
        `This time is offered to learners at Level ${level ? level.roman : slot.level_id}.`,
        { slotId: 'Offered to another level' },
      );
    }
  }

  const held = await db(env).prepare(
    `SELECT id FROM slot_bookings WHERE slot_id = ? AND user_id = ? AND ${LIVE_BOOKING_SQL}`,
  ).bind(slotId, userId).first();
  if (held) {
    throw new ValidationError(
      'You already hold a place in this tutorial.',
      { slotId: 'Already booked' },
    );
  }

  const id = newId('bkg');
  const bookedAt = nowIso();
  // THE CAPACITY GUARD, inside the statement that inserts. See the
  // header: SQLite cannot express this as a CHECK, so it lives here, and
  // it lives in ONE statement so two learners racing for the last place
  // cannot both pass it.
  let inserted;
  try {
    inserted = await db(env).prepare(
      `INSERT INTO slot_bookings (id, slot_id, user_id, status, learner_note, booked_at)
       SELECT ?1, ?2, ?3, 'booked', ?4, ?5
        WHERE (SELECT COUNT(*) FROM slot_bookings b
                WHERE b.slot_id = ?2 AND b.${LIVE_BOOKING_SQL})
              < (SELECT capacity FROM tutorial_slots WHERE id = ?2)`,
    ).bind(id, slotId, userId, note, bookedAt).run();
  } catch (err) {
    // idx_slot_bookings_one_live is a partial UNIQUE over exactly the
    // live states. If it fires, a concurrent request booked the same
    // learner into the same slot between the check above and here — the
    // same refusal, reached the other way.
    if (/UNIQUE|constraint/i.test(String(err && err.message))) {
      throw new ValidationError('You already hold a place in this tutorial.', { slotId: 'Already booked' });
    }
    throw err;
  }

  if (!inserted || !inserted.meta || inserted.meta.changes === 0) {
    const taken = await db(env).prepare(
      `SELECT COUNT(*) AS n FROM slot_bookings WHERE slot_id = ? AND ${LIVE_BOOKING_SQL}`,
    ).bind(slotId).first();
    throw new ValidationError(
      `This tutorial is full — ${taken.n} of ${slot.capacity} place${slot.capacity === 1 ? '' : 's'} taken.`,
      { slotId: 'Full' },
    );
  }

  const zone = await zoneFor(env, userId);
  const remaining = await placesLeft(env, slotId, slot.capacity);
  return {
    booking: {
      id,
      slotId,
      status: 'booked',
      note,
      bookedAt: renderInstant(bookedAt, zone.timeZone),
    },
    slot: {
      id: slot.id,
      title: slot.title,
      kind: slot.kind,
      tutor: slot.tutorName || null,
      startsAt: renderInstant(slot.starts_at, zone.timeZone),
      durationMinutes: slot.duration_minutes,
      joinUrl: slot.join_url || null,
      placesLeft: remaining,
    },
    zone,
  };
}

/**
 * A learner gives a place back.
 *
 * The reason is required, and that is not bureaucracy. `slot_bookings`
 * has a CHECK refusing a cancelled row without one, because a tutor
 * looking at an empty hour deserves to know whether the learner is ill,
 * has a clash, or no longer needs the session — and because the same
 * column carries a TUTOR'S reason when the tutor is the one cancelling.
 * A required reason is the only thing that makes the two comparable.
 *
 * A tutorial that has already started cannot be cancelled. Whether the
 * learner came is now the tutor's to record — 'attended' or 'no_show' —
 * and a learner who could overwrite that after the fact would be editing
 * their own register.
 */
export async function cancelBooking(env, { userId, bookingId, reason, now = Date.now() }) {
  if (typeof bookingId !== 'string' || !bookingId.trim()) {
    throw new ValidationError('bookingId is required.', { bookingId: 'Required' });
  }
  const why = typeof reason === 'string' ? reason.trim() : '';
  if (!why) {
    throw new ValidationError(
      'A reason is required so your tutor knows why the hour is free.',
      { reason: 'Required' },
    );
  }
  if (why.length > TIMETABLE.maxReasonLength) {
    throw new ValidationError(
      `A reason may be up to ${TIMETABLE.maxReasonLength} characters.`,
      { reason: `At most ${TIMETABLE.maxReasonLength} characters` },
    );
  }

  const booking = await db(env).prepare(
    `SELECT b.*, s.starts_at AS startsAt, s.title AS slotTitle, s.capacity
       FROM slot_bookings b JOIN tutorial_slots s ON s.id = b.slot_id
      WHERE b.id = ?`,
  ).bind(bookingId).first();

  // Somebody else's booking is NOT FOUND, not FORBIDDEN. A booking id is
  // a uuid nobody can guess, and answering 403 to a real one and 404 to
  // an invented one turns this endpoint into an oracle reporting which
  // ids exist. The refusal must not distinguish them.
  if (!booking || booking.user_id !== userId) throw new NotFoundError('No such booking.');

  if (CANCELLED_BOOKING_STATES.includes(booking.status)) {
    throw new ValidationError(
      booking.status === 'cancelled_by_tutor'
        ? `Your tutor already cancelled this tutorial: ${booking.cancellation_reason}`
        : 'You have already cancelled this booking.',
      { bookingId: 'Already cancelled' },
    );
  }
  if (booking.status === 'attended' || booking.status === 'no_show') {
    throw new ValidationError(
      'This tutorial has been held and its outcome recorded. Speak to your tutor if that record is wrong.',
      { bookingId: 'Already held' },
    );
  }

  const startMs = toInstant(booking.startsAt);
  if (startMs !== null && startMs <= now) {
    throw new ValidationError(
      'That tutorial has already started; your tutor records whether it went ahead.',
      { bookingId: 'In the past' },
    );
  }

  const at = nowIso();
  await db(env).prepare(
    `UPDATE slot_bookings SET status = 'cancelled_by_learner', cancelled_at = ?, cancellation_reason = ?
      WHERE id = ? AND ${LIVE_BOOKING_SQL}`,
  ).bind(at, why, bookingId).run();

  const zone = await zoneFor(env, userId);
  return {
    booking: {
      id: bookingId,
      slotId: booking.slot_id,
      status: 'cancelled_by_learner',
      cancelledAt: renderInstant(at, zone.timeZone),
      reason: why,
    },
    slot: {
      id: booking.slot_id,
      title: booking.slotTitle,
      startsAt: renderInstant(booking.startsAt, zone.timeZone),
      placesLeft: await placesLeft(env, booking.slot_id, booking.capacity),
    },
    zone,
    // The place is genuinely back. Said explicitly because a learner who
    // cancels and then wants the hour again after all needs to know they
    // may — idx_slot_bookings_one_live is partial for exactly this.
    note: 'Your place has been released. You may book this time again while it stays open.',
  };
}

async function placesLeft(env, slotId, capacity) {
  const row = await db(env).prepare(
    `SELECT COUNT(*) AS n FROM slot_bookings WHERE slot_id = ? AND ${LIVE_BOOKING_SQL}`,
  ).bind(slotId).first();
  return Math.max(0, capacity - row.n);
}

/* ═══════════════════════════════════════════════════════════════
 * 5 · WHAT A TUTOR PUBLISHES
 * ═══════════════════════════════════════════════════════════════ */

/**
 * A tutor offers an hour.
 *
 * THE VALIDATION THAT MATTERS MOST IS THE ONE ON `startsAt`, and it is
 * the reason this module exists. A naive '2026-09-01T14:00' is rejected
 * outright rather than read as UTC or as the server's local time. The
 * two readings differ by up to fourteen hours, both are plausible, and
 * whichever the platform picked would be wrong for somebody — a tutor in
 * Lagos publishing an hour that appears at 02:00 for a learner in
 * Colombo, and neither of them able to see why. An explicit offset is
 * cheap for a caller to send and impossible to misread.
 */
export async function publishSlot(env, {
  tutor, title, kind = 'tutorial', startsAt, durationMinutes = 30, capacity = 1,
  levelId = null, unitId = null, liveSessionId = null, joinUrl = null, now = Date.now(),
}) {
  const fields = {};
  const clean = {};

  clean.title = typeof title === 'string' ? title.trim() : '';
  if (!clean.title) fields.title = 'Required';
  else if (clean.title.length < 3 || clean.title.length > 160) fields.title = 'Between 3 and 160 characters';

  if (!SLOT_KINDS.includes(kind)) fields.kind = `One of: ${SLOT_KINDS.join(', ')}`;

  const startMs = parseOffsetInstant(startsAt, fields, 'startsAt');
  if (startMs !== null) {
    if (startMs <= now) fields.startsAt = 'A time in the future';
    else if (startMs > now + TIMETABLE.maxScheduleAheadDays * 86400000) {
      fields.startsAt = `Within ${TIMETABLE.maxScheduleAheadDays} days`;
    }
  }

  clean.durationMinutes = wholeNumber(durationMinutes, fields, 'durationMinutes',
    TIMETABLE.minDurationMinutes, TIMETABLE.maxDurationMinutes);
  clean.capacity = wholeNumber(capacity, fields, 'capacity', 1, TIMETABLE.maxCapacity);

  // An oral defence has one candidate. The schema files a defence under
  // the same machinery as an office hour so that defences actually get
  // scheduled; it does not make a defence a group booking, and a panel
  // that finds two candidates in the room is the failure this prevents.
  if (kind === 'oral_defence' && clean.capacity !== null && clean.capacity !== 1) {
    fields.capacity = 'An oral defence takes one candidate';
  }

  if (joinUrl !== null && joinUrl !== undefined && joinUrl !== '') {
    if (typeof joinUrl !== 'string' || !/^https:\/\/[^\s]+$/i.test(joinUrl)) {
      // https only, and never a scheme a browser will execute. A join
      // link is published to learners and clicked without thought.
      fields.joinUrl = 'An https:// address';
    } else clean.joinUrl = joinUrl.trim();
  } else clean.joinUrl = null;

  if (Object.keys(fields).length) throw new ValidationError('This slot could not be published.', fields);

  // ── Relations, checked against the database rather than assumed ──
  let level = null;
  if (levelId !== null && levelId !== undefined && levelId !== '') {
    // No ceiling is asserted here. Six levels are seeded today and the
    // number of levels is the College's to change; a constant in this
    // file would quietly refuse Level VII the day it exists. The lookup
    // below is the only authority on which levels are real.
    if (typeof levelId === 'number' ? !Number.isInteger(levelId) : !/^\d+$/.test(String(levelId))) {
      throw new ValidationError('levelId must be a whole number.', { levelId: 'A whole number' });
    }
    level = await db(env).prepare('SELECT id, roman FROM programme_levels WHERE id = ?')
      .bind(Number(levelId)).first();
    if (!level) throw new ValidationError('No such programme level.', { levelId: 'Unknown level' });
  }

  let unit = null;
  if (unitId !== null && unitId !== undefined && unitId !== '') {
    if (typeof unitId !== 'string') throw new ValidationError('unitId must be a module id.', { unitId: 'A module id' });
    unit = await db(env).prepare(
      `SELECT u.id, u.title, c.level_id AS levelId FROM units u
         JOIN courses c ON c.id = u.course_id WHERE u.id = ?`,
    ).bind(unitId).first();
    if (!unit) throw new ValidationError('No such module.', { unitId: 'Unknown module' });
    // A module belongs to exactly one level. A slot claiming both, in
    // disagreement, would appear on one cohort's timetable under another
    // cohort's module — and neither column is wrong on its own, which is
    // why nothing downstream could ever detect it.
    if (level && unit.levelId !== level.id) {
      throw new ValidationError(
        `That module is not part of Level ${level.roman}.`,
        { unitId: 'Not a module of that level' },
      );
    }
    if (!level) {
      level = await db(env).prepare('SELECT id, roman FROM programme_levels WHERE id = ?')
        .bind(unit.levelId).first();
    }
  }

  let session = null;
  if (liveSessionId !== null && liveSessionId !== undefined && liveSessionId !== '') {
    if (typeof liveSessionId !== 'string') {
      throw new ValidationError('liveSessionId must be a session id.', { liveSessionId: 'A session id' });
    }
    session = await db(env).prepare(
      'SELECT id, level_id AS levelId, starts_at AS startsAt, duration_minutes AS durationMinutes FROM live_sessions WHERE id = ?',
    ).bind(liveSessionId).first();
    if (!session) throw new ValidationError('No such live session.', { liveSessionId: 'Unknown session' });

    // A seat at a scheduled class starts when the class does. The schema
    // says live_sessions "is related to, never replaced"; a slot that
    // pointed at a class and started an hour later would be a second,
    // silently disagreeing answer to when that class begins.
    const sessionMs = toInstant(session.startsAt);
    if (sessionMs !== null && Math.abs(sessionMs - startMs) > 60000) {
      throw new ValidationError(
        'A place at a scheduled class must start when the class does.',
        { startsAt: `That class begins ${utcIso(sessionMs)}` },
      );
    }
    if (level && session.levelId !== level.id) {
      const sessionLevel = await db(env).prepare('SELECT roman FROM programme_levels WHERE id = ?')
        .bind(session.levelId).first();
      throw new ValidationError(
        `That class is at Level ${sessionLevel ? sessionLevel.roman : session.levelId}, not Level ${level.roman}.`,
        { levelId: 'Disagrees with the class' },
      );
    }
    if (!level) {
      level = await db(env).prepare('SELECT id, roman FROM programme_levels WHERE id = ?')
        .bind(session.levelId).first();
    }
  }

  // ── The tutor cannot be in two places ──
  // Checked against this tutor's own live slots only. Nothing here
  // consults another tutor's diary: two tutors offering the same hour is
  // an ordinary Tuesday.
  const endMs = startMs + clean.durationMinutes * 60000;
  const clash = await firstClash(env, tutor.id, startMs, endMs, null);
  if (clash) {
    throw new ValidationError(
      `You already offer time from ${clash.from} to ${clash.to} — "${clash.title}".`,
      { startsAt: 'Overlaps time you already offer' },
    );
  }

  const id = newId('slt');
  const createdAt = nowIso();
  await db(env).prepare(
    `INSERT INTO tutorial_slots
       (id, tutor_id, live_session_id, level_id, unit_id, title, kind, starts_at,
        duration_minutes, capacity, join_url, status, created_at)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'open', ?)`,
  ).bind(
    id, tutor.id, session ? session.id : null, level ? level.id : null, unit ? unit.id : null,
    clean.title, kind, new Date(startMs).toISOString(), clean.durationMinutes, clean.capacity,
    clean.joinUrl, createdAt,
  ).run();

  return describeSlot(env, id, tutor);
}

/**
 * A tutor takes an hour back — and every learner in it is told, by name,
 * that it was the tutor who did so.
 */
export async function withdrawSlot(env, { tutor, slotId, reason, now = Date.now() }) {
  if (typeof slotId !== 'string' || !slotId.trim()) {
    throw new ValidationError('slotId is required.', { slotId: 'Required' });
  }
  const why = typeof reason === 'string' ? reason.trim() : '';
  if (!why) {
    throw new ValidationError(
      'A reason is required. Every learner holding a place in this hour will be shown it.',
      { reason: 'Required' },
    );
  }
  if (why.length > TIMETABLE.maxReasonLength) {
    throw new ValidationError(
      `A reason may be up to ${TIMETABLE.maxReasonLength} characters.`,
      { reason: `At most ${TIMETABLE.maxReasonLength} characters` },
    );
  }

  const slot = await db(env).prepare('SELECT * FROM tutorial_slots WHERE id = ?').bind(slotId).first();
  if (!slot) throw new NotFoundError('No such tutorial slot.');
  // An administrator may withdraw a slot — a tutor who has left, an hour
  // published in error — and a tutor may withdraw only their own.
  if (slot.tutor_id !== tutor.id && tutor.role !== 'admin') {
    throw new AuthorizationError('You may withdraw only time you published yourself.');
  }
  if (slot.status === 'cancelled') {
    throw new ValidationError(
      `This slot was already withdrawn: ${slot.cancelled_reason}`,
      { slotId: 'Already withdrawn' },
    );
  }
  if (slot.status === 'held') {
    throw new ValidationError('This tutorial has been held. It cannot be withdrawn after the fact.', { slotId: 'Already held' });
  }
  const startMs = toInstant(slot.starts_at);
  if (startMs !== null && startMs <= now) {
    throw new ValidationError(
      'This time has already passed and cannot be withdrawn. Record what happened instead.',
      { slotId: 'In the past' },
    );
  }

  const at = nowIso();
  // The bookings first. If the slot were cancelled first and this
  // statement failed, the learners would hold live places in an hour
  // nothing will run — the direction that leaves the worse wreckage.
  const cascade = await db(env).prepare(
    `UPDATE slot_bookings
        SET status = 'cancelled_by_tutor', cancelled_at = ?, cancellation_reason = ?
      WHERE slot_id = ? AND ${LIVE_BOOKING_SQL}`,
  ).bind(at, why, slotId).run();

  await db(env).prepare(
    `UPDATE tutorial_slots SET status = 'cancelled', cancelled_at = ?, cancelled_reason = ? WHERE id = ?`,
  ).bind(at, why, slotId).run();

  const learnersCancelled = (cascade && cascade.meta && cascade.meta.changes) || 0;
  const described = await describeSlot(env, slotId, tutor);
  return {
    ...described,
    learnersCancelled,
    // The human cost, stated back to the person who caused it. A tutor
    // who withdraws an hour with three learners in it should see the
    // three.
    note: learnersCancelled
      ? `${learnersCancelled} learner${learnersCancelled === 1 ? '' : 's'} held a place and ${learnersCancelled === 1 ? 'has' : 'have'} been released, with your reason on the record.`
      : 'No learner had booked this time.',
  };
}

/** A tutor's own published hours, with who is in them. */
export async function tutorSlots(env, { tutor, tutorId = null, from = Date.now(), limit = 50, includePast = false }) {
  // A tutor reads their own diary. An administrator may read another's —
  // the same asymmetry functions/_lib/academic/attendance.js draws
  // between a teaching relation and the register.
  let subjectId = tutor.id;
  let basis = 'own';
  if (tutorId && tutorId !== tutor.id) {
    if (tutor.role !== 'admin') {
      throw new AuthorizationError('You may read only the time you published yourself.');
    }
    subjectId = tutorId;
    basis = 'admin';
  }

  const lower = includePast ? '1970-01-01T00:00:00.000Z' : new Date(from - 1000).toISOString();
  const rows = (await db(env).prepare(
    `SELECT s.*, l.roman AS levelRoman, u.title AS unitTitle,
            (SELECT COUNT(*) FROM slot_bookings b
              WHERE b.slot_id = s.id AND b.${LIVE_BOOKING_SQL}) AS booked
       FROM tutorial_slots s
       LEFT JOIN programme_levels l ON l.id = s.level_id
       LEFT JOIN units u ON u.id = s.unit_id
      WHERE s.tutor_id = ? AND s.starts_at >= ?
      ORDER BY s.starts_at ASC LIMIT ?`,
  ).bind(subjectId, lower, limit).all()).results;

  const zone = await zoneFor(env, tutor.id);
  const slots = [];
  for (const r of rows) {
    // The learners in this tutor's own hour, named. The booking IS the
    // teaching relation — attendance.js composes exactly this join to
    // decide who a tutor may read — so no wider disclosure is happening
    // here than the tutor already has.
    const bookings = (await db(env).prepare(
      `SELECT b.id, b.status, b.learner_note AS note, b.booked_at AS bookedAt,
              b.cancellation_reason AS cancellationReason,
              u.id AS userId, u.preferred_name AS preferredName, u.email
         FROM slot_bookings b JOIN users u ON u.id = b.user_id
        WHERE b.slot_id = ? ORDER BY b.booked_at ASC`,
    ).bind(r.id).all()).results;

    slots.push(slotPayload(r, bookings, zone.timeZone));
  }

  return {
    basis,
    tutorId: subjectId,
    zone,
    slots,
    counts: {
      slots: slots.length,
      open: slots.filter((s) => s.status === 'open').length,
      placesTaken: slots.reduce((n, s) => n + s.booked, 0),
    },
  };
}

async function describeSlot(env, slotId, viewer) {
  const r = await db(env).prepare(
    `SELECT s.*, l.roman AS levelRoman, u.title AS unitTitle,
            (SELECT COUNT(*) FROM slot_bookings b
              WHERE b.slot_id = s.id AND b.${LIVE_BOOKING_SQL}) AS booked
       FROM tutorial_slots s
       LEFT JOIN programme_levels l ON l.id = s.level_id
       LEFT JOIN units u ON u.id = s.unit_id
      WHERE s.id = ?`,
  ).bind(slotId).first();
  const zone = await zoneFor(env, viewer.id);
  const bookings = (await db(env).prepare(
    `SELECT b.id, b.status, b.learner_note AS note, b.booked_at AS bookedAt,
            b.cancellation_reason AS cancellationReason,
            u.id AS userId, u.preferred_name AS preferredName, u.email
       FROM slot_bookings b JOIN users u ON u.id = b.user_id
      WHERE b.slot_id = ? ORDER BY b.booked_at ASC`,
  ).bind(slotId).all()).results;
  return { slot: slotPayload(r, bookings, zone.timeZone), zone };
}

function slotPayload(r, bookings, timeZone) {
  const startsAt = renderInstant(r.starts_at, timeZone);
  return {
    id: r.id,
    title: r.title,
    kind: r.kind,
    kindLabel: KIND_LABEL[r.kind] || r.kind,
    status: r.status,
    startsAt,
    endsAt: startsAt ? endInstant(startsAt, r.duration_minutes, timeZone) : null,
    durationMinutes: r.duration_minutes,
    capacity: r.capacity,
    booked: r.booked,
    placesLeft: Math.max(0, r.capacity - r.booked),
    levelId: r.level_id,
    levelRoman: r.levelRoman || null,
    unitId: r.unit_id,
    unitTitle: r.unitTitle || null,
    liveSessionId: r.live_session_id,
    joinUrl: r.join_url || null,
    cancelledAt: r.cancelled_at ? renderInstant(r.cancelled_at, timeZone) : null,
    cancelledReason: r.cancelled_reason || null,
    bookings: bookings.map((b) => ({
      id: b.id,
      status: b.status,
      note: b.note,
      cancellationReason: b.cancellationReason,
      bookedAt: renderInstant(b.bookedAt, timeZone),
      learner: { userId: b.userId, preferredName: b.preferredName, email: b.email },
    })),
  };
}

/** The tutor's own overlapping hour, if there is one, ready to quote. */
async function firstClash(env, tutorId, startMs, endMs, exceptSlotId) {
  const rows = (await db(env).prepare(
    `SELECT id, title, starts_at AS startsAt, duration_minutes AS durationMinutes
       FROM tutorial_slots
      WHERE tutor_id = ? AND status IN ('open','closed')
        AND starts_at >= ? AND starts_at <= ?`,
  ).bind(
    tutorId,
    // Widened by the longest slot the College permits, so a long slot
    // starting before this one and running into it is still examined.
    new Date(startMs - TIMETABLE.maxDurationMinutes * 60000).toISOString(),
    new Date(endMs).toISOString(),
  ).all()).results;

  for (const r of rows) {
    if (exceptSlotId && r.id === exceptSlotId) continue;
    const s = toInstant(r.startsAt);
    if (s === null) continue;
    const e = s + (r.durationMinutes || 0) * 60000;
    if (s < endMs && e > startMs) {
      return { id: r.id, title: r.title, from: utcIso(s), to: utcIso(e) };
    }
  }
  return null;
}

/* ═══════════════════════════════════════════════════════════════
 * 6 · INPUT
 * ═══════════════════════════════════════════════════════════════
 * Rejected, never coerced. Number('') is 0, Number(null) is 0 and
 * parseInt('3 days') is 3 — three different ways for a request that
 * meant nothing of the sort to become a valid-looking parameter.
 */

/**
 * The bounds are this module's; the rule is not. See
 * functions/_lib/db.js parseLimit() for why four identical copies of
 * this eleven-line function became one.
 */
export function parseLimit(raw) {
  return sharedParseLimit(raw, { fallback: TIMETABLE.defaultLimit, max: TIMETABLE.maxLimit });
}

export function parseHorizonDays(raw) {
  if (raw === null || raw === undefined || raw === '') return TIMETABLE.defaultHorizonDays;
  if (!/^\d+$/.test(String(raw))) {
    throw new ValidationError('days must be a whole number.', { days: 'A whole number' });
  }
  const n = Number(raw);
  if (n < 1 || n > TIMETABLE.maxHorizonDays) {
    throw new ValidationError(`days must be between 1 and ${TIMETABLE.maxHorizonDays}.`, { days: `Between 1 and ${TIMETABLE.maxHorizonDays}` });
  }
  return n;
}

/**
 * An ISO-8601 instant that SAYS which instant it is.
 *
 * '2026-09-01T14:00:00Z' and '2026-09-01T14:00:00+04:00' are accepted.
 * '2026-09-01T14:00:00' is not, and that refusal is the whole point: a
 * time with no offset is a time whose meaning depends on who reads it,
 * and every party to this timetable reads it from a different country.
 */
export function parseOffsetInstant(raw, fields, field) {
  if (typeof raw !== 'string' || !raw.trim()) {
    fields[field] = 'Required';
    return null;
  }
  const value = raw.trim();
  if (!/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}(:\d{2}(\.\d{1,3})?)?(Z|[+-]\d{2}:\d{2})$/.test(value)) {
    fields[field] = 'An ISO-8601 time with an explicit offset, e.g. 2026-09-01T14:00:00Z or 2026-09-01T18:00:00+04:00';
    return null;
  }
  const ms = Date.parse(value);
  if (!Number.isFinite(ms)) {
    fields[field] = 'A real date and time';
    return null;
  }
  return ms;
}

function wholeNumber(raw, fields, field, min, max) {
  if (typeof raw === 'number' ? !Number.isInteger(raw) : !/^\d+$/.test(String(raw ?? ''))) {
    fields[field] = 'A whole number';
    return null;
  }
  const n = Number(raw);
  if (n < min || n > max) {
    fields[field] = `Between ${min} and ${max}`;
    return null;
  }
  return n;
}

function pad2(n) { return String(n).padStart(2, '0'); }
