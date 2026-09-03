/* A LEARNER WRITING TO A TUTOR, AND THE TABLE THAT WAS ALREADY BEING
 * TRUSTED BEFORE ANYTHING COULD WRITE TO IT.
 *
 * THE FAULT THIS FILE CORRECTS. Two facts, both measurable off this
 * repository before this file existed:
 *
 *   · `grep -rn "INSERT INTO message" functions/` returned nothing.
 *     Sixty-odd route files could enrol a learner, mark their work,
 *     confer an award and let a stranger verify it, and not one of them
 *     could carry a sentence from that learner to the person teaching
 *     them. "Contact tutors" was on the Board's list and had no machine
 *     under it at all.
 *
 *   · `message_participants` was NEVERTHELESS ALREADY LOAD-BEARING.
 *     functions/_lib/academic/attendance.js § tutorLearnerIds composes
 *     "the learners you teach" partly out of shared open threads, and
 *     assertMayReadLearner() gates a learner's engagement record on it.
 *     So the first row this file writes does not merely start a
 *     conversation — it widens somebody's read access to a learner's
 *     academic record.
 *
 * That second fact is the reason this file is written the way it is,
 * and it is the reason for the rule in § 2 below. An endpoint that let a
 * learner name any user id would not be a chat feature with a soft edge;
 * it would be a way to hand a stranger a learner's engagement record by
 * addressing an envelope to them.
 *
 * ────────────────────────────────────────────────────────────────
 * 1 · THE MEMBERSHIP ROW IS THE AUTHORISATION, IN THE QUERY
 * ────────────────────────────────────────────────────────────────
 * Migration 020 states the design in its own words: a thread is visible
 * to exactly the people in `message_participants`, "and there is no
 * query shape that can return a thread they were never added to".
 *
 * This file keeps that literally. Every statement that reads a thread,
 * counts its unread, lists its messages or appends one begins with the
 * same join — `MEMBERSHIP` below — and the caller's own participant row
 * is the FROM clause, not a condition applied afterwards. Nothing here
 * loads a thread and then decides whether the caller may see it, so
 * there is no branch to forget, no early return to slip past, and no
 * debug field that can put somebody else's conversation on the wire.
 *
 * The unread counts take it further and never re-bind the caller: they
 * compare against `me.last_read_at` and `me.user_id`, columns of the
 * joined participant row. A count and a list drawn from the same row
 * cannot disagree about whose count it is.
 *
 * A thread the caller is not party to answers NotFound — the identical
 * answer to a thread id that was never issued. The announcements module
 * argues this at length for read receipts and the argument is the same
 * here: an endpoint that distinguishes "not yours" from "no such thing"
 * is an oracle for which conversations exist and between whom.
 *
 * ────────────────────────────────────────────────────────────────
 * 2 · A LEARNER ADDRESSES AN OFFICE. THERE IS NO FIELD FOR A PERSON.
 * ────────────────────────────────────────────────────────────────
 * The brief says a learner "may not open one with an arbitrary user id".
 * The strongest form of that is not validation — it is having nowhere to
 * put one. So a learner's request names `recipient: 'tutors'` or
 * `recipient: 'registrar'` and a scope, and the platform resolves who
 * that is. `recipientId`, `tutorId` and `userId` are REFUSED rather than
 * ignored, by the rule functions/api/announcements/index.js states: a
 * silently dropped parameter is how a client gets built on an
 * authorisation model the server never had.
 *
 * WHO 'tutors' RESOLVES TO, and why it is composed rather than looked
 * up. The schema holds no tutor-to-level assignment table — attendance.js
 * hit the same wall from the other side and composed the relation out of
 * teaching acts. This is that same relation, read in the opposite
 * direction, and it is deliberately the mirror image:
 *
 *     attendance.js  : learners a tutor may read  ← teaching acts
 *     this file      : tutors a learner may write → teaching acts
 *
 * Held that way, widening one without the other is visible in review.
 * The acts that count are stated in TUTORS_OF: hosting a live session at
 * the level, offering a tutorial slot at it (or a general office hour),
 * marking this learner's own work, taking this learner's own register.
 * Every candidate is re-checked against `users.role` in the same
 * statement, so a tutor whose access was revoked stops being reachable
 * the moment the revocation lands, without any of these rows changing.
 *
 * WHO 'registrar' RESOLVES TO, and the honesty problem in the question.
 * The College's standing instruction is that no person is published into
 * an office they have not accepted, and there is no office-holder table
 * to consult. So 'registrar' resolves to the accounts HOLDING
 * ADMINISTRATOR ACCESS, which is the nearest thing the schema records to
 * that desk, and the payload says "the Registrar's desk" rather than
 * naming anybody. A learner is told which desk they are writing to, never
 * who sits at it, and the reply carries whatever name the replier's own
 * account carries. Nothing here asserts that a person holds an office.
 *
 * The registrar desk is also the reason a refusal is safe. When no tutor
 * has yet taught at a learner's level there is nobody for 'tutors' to
 * resolve to, and the refusal names the route that is always open rather
 * than silently redirecting the message — a learner who thinks they have
 * written to their tutor and has written to somebody else is worse off
 * than one who was told.
 *
 * ────────────────────────────────────────────────────────────────
 * 3 · THE BODY IS TEXT. IT IS NEVER MARKUP, AND NOT BY SANITISING.
 * ────────────────────────────────────────────────────────────────
 * `messages.body` is stored exactly as typed and is never HTML. This is
 * a storage rule, not a cleaning step, and the difference is the whole
 * point: a sanitiser is a filter somebody has to keep correct, and the
 * day it is wrong the platform has already written the markup into a
 * column that four renderers trust.
 *
 * Here there is no markup to be wrong about. A message has no `html`
 * field, no `format` field a caller can set and no rich variant — those
 * keys are refused on input — and every payload this file emits declares
 * `format: 'text/plain'`, so a renderer that interpolates a body without
 * escaping it is contradicting a field it was handed rather than
 * guessing. A learner who writes `<b>` is quoting three characters and
 * gets three characters back; nothing strips them, because a message
 * silently altered between sending and reading is a worse defect than an
 * ugly one.
 *
 * What IS refused is the C0 control range, for the reason announcements
 * gives: those characters have no business in a sentence, and 0x1E/0x1F
 * carry structural meaning elsewhere in this directory. CRLF is folded
 * to LF and that is the single coercion in the file — a textarea submits
 * CRLF and no reader could ever see the difference.
 *
 * ────────────────────────────────────────────────────────────────
 * 4 · THE RATE LIMIT IS A COUNT OF ROWS, NOT A DISABLED BUTTON
 * ────────────────────────────────────────────────────────────────
 * Thread creation is capped per opener over a rolling window, and the
 * count is `SELECT COUNT(*) ... WHERE opened_by = ? AND created_at > ?`
 * — the rows themselves, in the data layer, where a second client, a
 * replayed request and a curl loop all meet the same answer. A cap the
 * UI enforces is a cap that exists only for people using the UI.
 *
 * ROLLING, NOT PER CALENDAR DAY, because a midnight boundary is a cap
 * that doubles once a day for anybody who notices. The refusal returns
 * the exact instant the next thread may be opened, so the client can say
 * something true rather than "try again later".
 *
 * Replies are NOT capped. The cap exists so that a hundred one-line
 * threads do not become a hundred conversations no tutor can triage; it
 * is not there to ration what a learner may say, and a learner rationed
 * mid-sentence would simply open a new thread to finish, which is the
 * outcome the cap is against.
 *
 * ────────────────────────────────────────────────────────────────
 * 5 · WHAT THIS FILE DOES NOT DO, DELIBERATELY
 * ────────────────────────────────────────────────────────────────
 * It never withdraws or closes anything, because `messages.withdrawn_at`
 * demands a reason and `message_threads.closed_at` demands a closer, and
 * both of those are acts with an author who ought to reach them through
 * a route of their own. But the READ side of both is honoured here
 * already: a withdrawn message is listed with its reason and WITHOUT its
 * text, a closed thread refuses a reply, and a participant with `left_at`
 * set sees the conversation only up to the moment they left. Those
 * guards are written before anything sets the columns on purpose — the
 * alternative is that the endpoint which sets them ships first and the
 * guard is added afterwards, which is the order in which access is
 * quietly granted.
 */

import {
  db, newId, nowIso, ValidationError, NotFoundError, ConfigError,
  parseLimit as sharedParseLimit,
} from '../db.js';
import { AuthorizationError } from '../auth/session.js';
import { assertMayReadLearner } from '../academic/attendance.js';

/* ───────────────────────────────────────────────────────────────
 * THE VOCABULARY — the schema's CHECK constraints, restated so a bad
 * value is a 422 naming the field rather than a SQLite constraint
 * failure arriving as a 500.
 * ─────────────────────────────────────────────────────────────── */

/** message_threads.scope. Never floating: migration 020's rule. */
export const SCOPES = ['level', 'module'];
/** message_threads.status. */
export const THREAD_STATUSES = ['open', 'answered', 'closed'];
/** message_participants.party. */
export const PARTIES = ['learner', 'tutor', 'registrar'];

/**
 * What a caller may address. Two of these are offices and the third is a
 * person — and the third is available only to staff, who are permitted
 * to name a learner precisely because assertMayReadLearner() already
 * decides which learners that is.
 */
export const RECIPIENTS = ['tutors', 'registrar', 'learner'];

/**
 * Declared on every payload. See § 3: this is the field a renderer is
 * contradicting if it interpolates a body unescaped.
 */
export const MESSAGE_FORMAT = 'text/plain';

/** A subject is a line on a list, not the message. */
export const MAX_SUBJECT = 160;
/** Long enough for a real question with a quoted paragraph in it. */
export const MAX_BODY = 5000;

/**
 * The cap, per opener, over ROLLING_WINDOW_HOURS. Five for a learner:
 * a sixth distinct subject in one day is a conversation, and replying in
 * an open thread is unlimited. Forty for staff, because a tutor writing
 * to each of a cohort in one afternoon is the intended use and not the
 * abuse the cap is for.
 */
export const LEARNER_THREADS_PER_WINDOW = 5;
export const STAFF_THREADS_PER_WINDOW = 40;
export const ROLLING_WINDOW_HOURS = 24;

/**
 * The fan-out ceiling. A thread is a conversation; adding twenty people
 * to one makes it a broadcast, which is what announcements are for.
 */
export const MAX_RECIPIENTS = 8;

/**
 * Page sizes. Exported because the route files bind `?limit=` to them,
 * and a route that restated "300" would be a second copy of this decision
 * free to drift from the one the module actually enforces.
 */
export const DEFAULT_LIST = 20;
export const MAX_LIST = 100;
export const DEFAULT_MESSAGES = 100;
export const MAX_MESSAGES = 300;
/** Enough of the last message to recognise the thread on a list. */
const PREVIEW_CHARS = 160;

/* ───────────────────────────────────────────────────────────────
 * THE AUTHORISATION FRAGMENT
 * ─────────────────────────────────────────────────────────────── */

/**
 * "This thread, and you are party to it" — the only definition of it.
 *
 * The thread table must be aliased `t` and the caller's participant row
 * is bound as the single parameter. Deliberately not composable into
 * anything else and deliberately not parameterised by "which user":
 * one fragment, one meaning.
 *
 * `left_at` is NOT filtered here. A former participant may still consult
 * the record — bounded to what was said before they left, in
 * `messagesOf()` — but may not reply and does not carry the thread on
 * their list. The two callers that want current membership only add
 * `AND me.left_at IS NULL` themselves, visibly, at the call site.
 */
const MEMBERSHIP = `
  FROM message_threads t
  JOIN message_participants me
    ON me.thread_id = t.id AND me.user_id = ?`;

/**
 * Unread, expressed once. Correlated against the joined participant row
 * rather than a re-bound user id, so a list and a badge cannot end up
 * counting for different people.
 *
 * A message you sent is not unread to you, and a withdrawn message is
 * not unread to anybody — a badge that insists on a message whose text
 * the reader will never be shown is a badge that cannot be cleared. The
 * same argument covers the last clause: a participant who has left is
 * shown nothing after the moment they left, so counting it would leave
 * them a badge with no message behind it.
 */
const UNREAD_PREDICATE = `
  m.withdrawn_at IS NULL
  AND m.sender_id != me.user_id
  AND (me.last_read_at IS NULL OR m.sent_at > me.last_read_at)
  AND (me.left_at IS NULL OR m.sent_at <= me.left_at)`;

/* ───────────────────────────────────────────────────────────────
 * VALIDATION — reject, never coerce
 * ─────────────────────────────────────────────────────────────── */

/**
 * Prose fit to store: trimmed, bounded, and free of the control
 * characters § 3 refuses.
 *
 * Note what is NOT here. Nothing strips a tag, escapes a quote or
 * rewrites a character a reader typed on purpose. The body leaves this
 * function byte-identical to what was sent, minus surrounding whitespace
 * and CRLF folding, because a message the platform edited in transit is
 * not the message that was sent.
 */
export function assertProse(value, field, max, fields) {
  if (typeof value !== 'string') {
    fields[field] = 'Required';
    return null;
  }
  const folded = value.replace(/\r\n?/g, '\n');
  // eslint-disable-next-line no-control-regex
  if (/[\u0000-\u0008\u000B-\u001F\u007F]/.test(folded)) {
    fields[field] = 'Contains control characters that cannot be stored';
    return null;
  }
  const text = folded.trim();
  if (!text) {
    fields[field] = 'Required';
    return null;
  }
  if (text.length > max) {
    fields[field] = `At most ${max} characters`;
    return null;
  }
  return text;
}

function assertNoFields(fields, message) {
  if (Object.keys(fields).length) throw new ValidationError(message, fields);
}

/** Query-string integers, refused rather than rounded. */
/**
 * The bounds are this module's; the rule is not. See
 * functions/_lib/db.js parseLimit() for why four identical copies of
 * this eleven-line function became one.
 */
export function parseLimit(raw, { field = 'limit', fallback = DEFAULT_LIST, max = MAX_LIST } = {}) {
  return sharedParseLimit(raw, { field, fallback, max });
}

/**
 * The keys a caller may not send, and the reason each one is a refusal
 * rather than a shrug.
 *
 * `userId` / `recipientId` / `tutorId` / `participants`: § 2. A learner
 * addresses an office; accepting and ignoring a person would leave a
 * client believing it had chosen one.
 *
 * `html` / `bodyHtml` / `format`: § 3. A caller who sends markup has
 * misunderstood what this endpoint stores, and quietly filing it in a
 * text column would leave them believing the platform renders it.
 */
const REFUSED_KEYS = {
  userId: 'This endpoint addresses an office, not a person. Use recipient.',
  recipientId: 'This endpoint addresses an office, not a person. Use recipient.',
  tutorId: 'This endpoint addresses an office, not a person. Use recipient.',
  studentId: 'The subject of a learner request is the signed-in learner.',
  participants: 'Participants are resolved by the platform, never supplied.',
  html: 'Messages are plain text. There is no HTML field.',
  bodyHtml: 'Messages are plain text. There is no HTML field.',
  format: `Every message is ${MESSAGE_FORMAT} and the format is not selectable.`,
};

function assertNoRefusedKeys(body) {
  const fields = {};
  for (const [key, why] of Object.entries(REFUSED_KEYS)) {
    if (body[key] !== undefined) fields[key] = why;
  }
  assertNoFields(fields, 'That request names something this endpoint does not accept.');
}

function assertObject(body) {
  if (!body || typeof body !== 'object' || Array.isArray(body)) {
    throw new ValidationError('A JSON object is required.', {});
  }
}

/* ───────────────────────────────────────────────────────────────
 * SCOPE — a thread is about a level or about a module, and the learner
 * it concerns is enrolled in that level
 * ─────────────────────────────────────────────────────────────── */

/**
 * "Live enrolment" is not this file's invention and is not redefined
 * here. `idx_enrolments_one_live_per_level` is partial on
 * `status != 'withdrawn'`, and announcements.js already uses exactly
 * that for a level audience. A learner who has finished Level I and not
 * yet paid for Level II is still the person a Level II thread is for.
 */
async function liveEnrolmentLevels(env, userId) {
  const { results } = await db(env).prepare(`
    SELECT DISTINCT e.level_id AS level_id
      FROM enrolments e
     WHERE e.user_id = ? AND e.status != 'withdrawn'
     ORDER BY e.level_id`)
    .bind(userId).all();
  return (results || []).map((r) => r.level_id);
}

/**
 * Resolve and check the scope, in the learner's own terms.
 *
 * Both directions go through here — the learner opening a thread and the
 * tutor opening one about them — so a thread cannot exist about a level
 * the learner it names has never been enrolled in. A tutor writing to a
 * learner about a level they are not in is not a permission question; it
 * is a thread nobody can act on.
 *
 * A module-scoped thread stores `unit_id` and a NULL `level_id`, exactly
 * as the schema instructs: "a unit already knows its course and its
 * level, so a module-scoped thread does not repeat the level and cannot
 * contradict it". The level is still resolved here, because the
 * recipients are drawn from it.
 */
async function readScope(env, learnerId, body) {
  const fields = {};
  const scope = body.scope;
  if (!SCOPES.includes(scope)) {
    fields.scope = `One of ${SCOPES.join(', ')}`;
    assertNoFields(fields, 'That thread has no scope this platform recognises.');
  }

  const enrolled = await liveEnrolmentLevels(env, learnerId);

  if (scope === 'level') {
    if (body.unitId != null) {
      fields.unitId = 'A level-scoped thread names no module';
    }
    if (!Number.isInteger(body.levelId)) {
      fields.levelId = 'Required — the level this thread is about';
    } else if (!enrolled.includes(body.levelId)) {
      // Named as a scope failure, not as a permission failure. The
      // learner is not being refused access to a level; there is no
      // enrolment for the thread to hang on.
      fields.levelId = 'Not a level with a live enrolment behind it';
    }
    assertNoFields(fields, 'That thread cannot be opened against that level.');
    const level = await db(env)
      .prepare('SELECT id, roman, name FROM programme_levels WHERE id = ?')
      .bind(body.levelId).first();
    if (!level) throw new ValidationError('No such level.', { levelId: 'No such level' });
    return {
      scope, levelId: level.id, unitId: null, storedLevelId: level.id,
      level, unit: null,
    };
  }

  if (body.levelId != null) {
    fields.levelId = 'A module-scoped thread takes its level from the module';
  }
  if (typeof body.unitId !== 'string' || !body.unitId) {
    fields.unitId = 'Required — the module this thread is about';
  }
  assertNoFields(fields, 'That thread cannot be opened against that module.');

  const unit = await db(env).prepare(`
    SELECT un.id AS id, un.title AS title, c.level_id AS level_id,
           pl.roman AS roman, pl.name AS name
      FROM units un
      JOIN courses c ON c.id = un.course_id
      JOIN programme_levels pl ON pl.id = c.level_id
     WHERE un.id = ?`)
    .bind(body.unitId).first();
  if (!unit) throw new ValidationError('No such module.', { unitId: 'No such module' });
  if (!enrolled.includes(unit.level_id)) {
    throw new ValidationError(
      'That module belongs to a level with no live enrolment behind it.',
      { unitId: 'Not a module of a level you are enrolled in' },
    );
  }
  return {
    scope,
    levelId: unit.level_id,
    unitId: unit.id,
    storedLevelId: null,
    level: { id: unit.level_id, roman: unit.roman, name: unit.name },
    unit: { id: unit.id, title: unit.title },
  };
}

/* ───────────────────────────────────────────────────────────────
 * WHO AN OFFICE RESOLVES TO
 * ─────────────────────────────────────────────────────────────── */

/**
 * The tutors of a level, composed from teaching acts — the mirror of
 * attendance.js § tutorLearnerIds. See § 2.
 *
 * Four arms, and each one is somebody who has actually done something
 * teaching-shaped that this learner can point at:
 *
 *   live_sessions   — hosted a class at the level. `level_id` is NOT
 *                     NULL there, so a session against a module is
 *                     already counted by its level and needs no arm of
 *                     its own.
 *   tutorial_slots  — offered time at the level, at the module, or as a
 *                     general office hour (the schema's own reading of a
 *                     NULL level: "open to any level").
 *   assignment_submissions — marked THIS learner's own work.
 *   attendance_records     — took THIS learner's own register.
 *
 * The unit arm is bound to NULL for a level-scoped thread, and `x = NULL`
 * matches nothing in SQL — so one statement serves both scopes without a
 * second variant to keep in step with this one.
 *
 * The join to `users` is the part that must not be optimised away: it
 * re-checks role at read time, so a tutor whose staff access has been
 * revoked stops being reachable without a single row in these four
 * tables changing. Ordering is by most recent act, so a capped fan-out
 * reaches the people currently teaching rather than whoever sorts first.
 */
const TUTORS_OF = `
  SELECT acts.person AS id, MAX(acts.acted_at) AS latest
    FROM (
      SELECT ls.host_user_id AS person, ls.starts_at AS acted_at
        FROM live_sessions ls
       WHERE ls.level_id = ? AND ls.host_user_id IS NOT NULL
      UNION ALL
      SELECT ts.tutor_id, ts.starts_at
        FROM tutorial_slots ts
       WHERE ts.status != 'cancelled'
         AND (ts.level_id = ? OR ts.level_id IS NULL OR ts.unit_id = ?)
      UNION ALL
      SELECT sub.graded_by, sub.graded_at
        FROM assignment_submissions sub
       WHERE sub.user_id = ? AND sub.graded_by IS NOT NULL
      UNION ALL
      SELECT ar.recorded_by, ar.window_end
        FROM attendance_records ar
       WHERE ar.user_id = ? AND ar.recorded_by IS NOT NULL
    ) acts
    JOIN users u ON u.id = acts.person AND u.role IN ('staff','admin')
   WHERE acts.person != ?
   GROUP BY acts.person
   ORDER BY latest DESC, acts.person ASC
   LIMIT ?`;

async function tutorsReachable(env, { learnerId, levelId, unitId, limit = MAX_RECIPIENTS }) {
  const { results } = await db(env).prepare(TUTORS_OF)
    .bind(levelId, levelId, unitId ?? null, learnerId, learnerId, learnerId, limit)
    .all();
  return (results || []).map((r) => r.id);
}

/**
 * The Registrar's desk.
 *
 * Administrator access is what the schema records; an office-holder
 * table does not exist and this file will not invent one. Nothing that
 * leaves here names a person as the Registrar — the desk is named, and a
 * reply carries whatever name the replier's own account carries.
 *
 * Oldest accounts first, so the set is stable between requests rather
 * than reshuffling under a cap.
 */
async function registrarDesk(env, { excludeUserId, limit = MAX_RECIPIENTS }) {
  const { results } = await db(env).prepare(`
    SELECT u.id AS id
      FROM users u
     WHERE u.role = 'admin' AND u.id != ?
     ORDER BY u.created_at ASC, u.id ASC
     LIMIT ?`)
    .bind(excludeUserId, limit).all();
  return (results || []).map((r) => r.id);
}

/* ───────────────────────────────────────────────────────────────
 * THE RATE LIMIT — § 4
 * ─────────────────────────────────────────────────────────────── */

function windowStart(at) {
  return new Date(Date.parse(at) - ROLLING_WINDOW_HOURS * 3600 * 1000).toISOString();
}

const capFor = (user) => (user.role === 'student' ? LEARNER_THREADS_PER_WINDOW : STAFF_THREADS_PER_WINDOW);

/**
 * What the caller has spent and when the next thread may be opened.
 *
 * Read as well as enforced: the allowance rides on GET /api/messages so
 * a compose box can say "two of five today" instead of discovering the
 * cap by hitting it. `nextAt` is the exact instant the oldest counted
 * thread leaves the window — a real answer, not "later".
 */
export async function threadAllowance(env, { user, now = null } = {}) {
  const at = now || nowIso();
  const since = windowStart(at);
  const limit = capFor(user);

  const row = await db(env).prepare(`
    SELECT COUNT(*) AS n, MIN(t.created_at) AS oldest
      FROM message_threads t
     WHERE t.opened_by = ? AND t.created_at > ?`)
    .bind(user.id, since).first();

  const opened = row ? row.n : 0;
  const remaining = Math.max(0, limit - opened);
  return {
    windowHours: ROLLING_WINDOW_HOURS,
    limit,
    opened,
    remaining,
    // Only meaningful when nothing remains; null otherwise, rather than a
    // timestamp a client might render as a restriction that is not on.
    nextAt: remaining > 0 || !row || !row.oldest
      ? null
      : new Date(Date.parse(row.oldest) + ROLLING_WINDOW_HOURS * 3600 * 1000).toISOString(),
  };
}

/**
 * Its own type rather than a ValidationError, because 429 is not 422 and
 * the difference is what a client needs: nothing about the request is
 * wrong, and the same bytes will succeed later. It carries the allowance
 * so the refusal can name the hour instead of the word "later".
 */
export class RateLimitError extends Error {
  constructor(message, allowance) {
    super(message);
    this.name = 'RateLimitError';
    this.httpStatus = 429;
    this.fields = { subject: `Too many new threads opened in the last ${ROLLING_WINDOW_HOURS} hours` };
    this.allowance = allowance;
  }
}

/* ───────────────────────────────────────────────────────────────
 * SHAPING — what leaves this module
 * ─────────────────────────────────────────────────────────────── */

/**
 * A person, as a thread shows them.
 *
 * A name and a party, never an email. announcements.js withholds the
 * author's inbox from the notice it publishes for exactly this reason: a
 * learner in a conversation about their fees has no business acquiring
 * the Registrar's address out of the JSON behind it. The id stays,
 * because it is opaque, because the caller is already party to the
 * thread, and because a UI needs a stable key.
 */
const person = (id, name, party, meId) => ({
  userId: id,
  name: name ?? null,
  party: party ?? null,
  isYou: id === meId,
});

/**
 * One message.
 *
 * A withdrawn message keeps its place, its sender and its reason and
 * loses its text. That is the schema's contract read the only way it can
 * be read on a payload: deleting the row would let a message vanish
 * without trace, and returning the body would make withdrawal
 * decorative.
 */
function messageView(row, meId) {
  const withdrawn = Boolean(row.withdrawn_at);
  return {
    id: row.id,
    sender: person(row.sender_id, row.sender_name, row.sender_party, meId),
    sentAt: row.sent_at,
    body: withdrawn ? null : row.body,
    withdrawn,
    withdrawnAt: row.withdrawn_at ?? null,
    withdrawnReason: row.withdrawn_reason ?? null,
  };
}

function threadSummary(row, meId) {
  const withdrawnLatest = Boolean(row.latest_withdrawn);
  return {
    id: row.id,
    subject: row.subject,
    scope: row.scope,
    levelId: row.level_id ?? row.unit_level_id ?? null,
    levelRoman: row.level_roman ?? row.unit_level_roman ?? null,
    levelName: row.level_name ?? row.unit_level_name ?? null,
    unitId: row.unit_id ?? null,
    unitTitle: row.unit_title ?? null,
    status: row.status,
    openedByYou: row.opened_by === meId,
    createdAt: row.created_at,
    lastMessageAt: row.last_message_at,
    messageCount: row.message_count ?? 0,
    unread: row.unread ?? 0,
    you: {
      party: row.my_party,
      lastReadAt: row.last_read_at ?? null,
      leftAt: row.left_at ?? null,
    },
    // Never the whole of the last message: a list is a list. Withdrawn
    // text never previews, by the same rule messageView() applies.
    preview: withdrawnLatest || !row.latest_body
      ? null
      : row.latest_body.slice(0, PREVIEW_CHARS),
  };
}

/** Participants of a set of threads, in one statement rather than N. */
async function participantsFor(env, threadIds, meId) {
  if (!threadIds.length) return new Map();
  const marks = threadIds.map(() => '?').join(',');
  const { results } = await db(env).prepare(`
    SELECT p.thread_id, p.user_id, p.party, p.left_at, u.preferred_name AS name
      FROM message_participants p
      JOIN users u ON u.id = p.user_id
     WHERE p.thread_id IN (${marks})
     ORDER BY p.created_at ASC, p.id ASC`)
    .bind(...threadIds).all();

  const byThread = new Map();
  for (const r of results || []) {
    if (!byThread.has(r.thread_id)) byThread.set(r.thread_id, []);
    byThread.get(r.thread_id).push({
      ...person(r.user_id, r.name, r.party, meId),
      leftAt: r.left_at ?? null,
    });
  }
  return byThread;
}

/* ───────────────────────────────────────────────────────────────
 * THE LIST
 * ─────────────────────────────────────────────────────────────── */

/**
 * GET /api/messages — the caller's own threads, most recently spoken in
 * first, with the unread count each one carries.
 *
 * `AND me.left_at IS NULL` is added here and nowhere else in this
 * function: your list is your current correspondence. A thread you were
 * handed off is still readable by id — see readThread() — because the
 * record does not forget you were party to it.
 *
 * The total unread is a SEPARATE statement over the same predicate and
 * is deliberately NOT capped by `limit`. announcements.js makes the
 * argument: a badge that reads twenty because the page asked for twenty
 * is a badge that starts lying the moment anything is unread past the
 * end of the first page.
 */
export async function listThreads(env, { user, limit = DEFAULT_LIST, now = null } = {}) {
  const at = now || nowIso();

  const listed = await db(env).prepare(`
    SELECT t.id, t.subject, t.scope, t.level_id, t.unit_id, t.status,
           t.opened_by, t.last_message_at, t.created_at,
           me.party AS my_party, me.last_read_at, me.left_at,
           pl.roman AS level_roman, pl.name AS level_name,
           un.title AS unit_title,
           uc.level_id AS unit_level_id,
           upl.roman AS unit_level_roman, upl.name AS unit_level_name,
           (SELECT COUNT(*) FROM messages m
             WHERE m.thread_id = t.id AND ${UNREAD_PREDICATE}) AS unread,
           (SELECT COUNT(*) FROM messages m2
             WHERE m2.thread_id = t.id AND m2.withdrawn_at IS NULL) AS message_count,
           (SELECT m3.body FROM messages m3
             WHERE m3.thread_id = t.id
             ORDER BY m3.sent_at DESC, m3.id DESC LIMIT 1) AS latest_body,
           (SELECT m4.withdrawn_at FROM messages m4
             WHERE m4.thread_id = t.id
             ORDER BY m4.sent_at DESC, m4.id DESC LIMIT 1) AS latest_withdrawn
      ${MEMBERSHIP} AND me.left_at IS NULL
      LEFT JOIN programme_levels pl ON pl.id = t.level_id
      LEFT JOIN units un ON un.id = t.unit_id
      LEFT JOIN courses uc ON uc.id = un.course_id
      LEFT JOIN programme_levels upl ON upl.id = uc.level_id
     ORDER BY t.last_message_at DESC, t.id DESC
     LIMIT ?`)
    .bind(user.id, limit).all();

  const rows = listed.results || [];

  const unread = await db(env).prepare(`
    SELECT COUNT(*) AS n
      FROM messages m
      JOIN message_participants me
        ON me.thread_id = m.thread_id AND me.user_id = ? AND me.left_at IS NULL
     WHERE ${UNREAD_PREDICATE}`)
    .bind(user.id).first();

  const parties = await participantsFor(env, rows.map((r) => r.id), user.id);

  return {
    format: MESSAGE_FORMAT,
    asAt: at,
    unread: unread ? unread.n : 0,
    returned: rows.length,
    limit,
    threads: rows.map((row) => ({
      ...threadSummary(row, user.id),
      participants: parties.get(row.id) || [],
    })),
    canOpen: await openableBy(env, { user }),
    allowance: await threadAllowance(env, { user, now: at }),
  };
}

/**
 * What the caller may open a thread with, resolved server-side.
 *
 * This exists so a compose box never has to guess. The alternative — a
 * client that offers every level and discovers by refusal which ones
 * have a tutor behind them — makes the College look broken at the exact
 * moment a learner is trying to ask for help.
 *
 * Module scope is described rather than enumerated: a level carries a
 * hundred and twenty units and listing all of them here would be a
 * different endpoint wearing this one's clothes.
 */
export async function openableBy(env, { user } = {}) {
  if (user.role !== 'student') {
    return [{
      recipient: 'learner',
      requires: 'learnerId',
      note: 'A tutor opens a thread with a learner they teach. Which learners those are is decided by functions/_lib/academic/attendance.js, not by this endpoint.',
    }];
  }

  const levels = await liveEnrolmentLevels(env, user.id);
  // The desk does not vary by level, so it is resolved once. Inside the
  // loop it would be one query per enrolment answering the same question.
  const desk = (await registrarDesk(env, { excludeUserId: user.id })).length;

  const out = [];
  for (const levelId of levels) {
    const level = await db(env)
      .prepare('SELECT id, roman, name FROM programme_levels WHERE id = ?')
      .bind(levelId).first();
    const tutors = await tutorsReachable(env, { learnerId: user.id, levelId, unitId: null });
    const at = {
      scope: 'level',
      levelId,
      levelRoman: level ? level.roman : null,
      levelName: level ? level.name : null,
    };
    out.push({
      recipient: 'tutors',
      ...at,
      // A COUNT, NEVER A ROSTER. Who teaches a level is the College's to
      // publish on its faculty page under its own rules about naming
      // people; it is not this endpoint's to disclose to whoever holds a
      // learner session. The learner is told the desk is staffed, which
      // is the only thing they need in order to write to it.
      reachable: tutors.length,
      moduleScope: 'Name a unitId from this level instead of levelId to scope a thread to one module.',
    });
    out.push({
      recipient: 'registrar',
      ...at,
      reachable: desk,
      desk: "The Registrar's desk",
    });
  }
  return out;
}

/* ───────────────────────────────────────────────────────────────
 * OPENING A THREAD
 * ─────────────────────────────────────────────────────────────── */

/**
 * Who this thread is for, and who will be in it.
 *
 * The whole of § 2 lands in this function. A learner's request carries an
 * office and nothing else; a staff request carries a learner id and is
 * gated by the SAME predicate that decides whether that member of staff
 * may read the learner's engagement record — imported rather than
 * restated, so "a learner you teach" has one definition on this platform
 * and widening it is one edit in one file.
 */
async function resolveParties(env, { user, body, scope, fields }) {
  const recipient = body.recipient;
  if (!RECIPIENTS.includes(recipient)) {
    fields.recipient = `One of ${RECIPIENTS.join(', ')}`;
    return null;
  }

  const isLearnerCaller = user.role === 'student';

  if (isLearnerCaller) {
    if (recipient === 'learner') {
      fields.recipient = 'A learner writes to the tutors of their level or to the Registrar, not to another learner';
      return null;
    }
    if (body.learnerId !== undefined) {
      fields.learnerId = 'This endpoint addresses an office, not a person';
      return null;
    }

    const ids = recipient === 'tutors'
      ? await tutorsReachable(env, {
        learnerId: user.id, levelId: scope.levelId, unitId: scope.unitId,
      })
      : await registrarDesk(env, { excludeUserId: user.id });

    if (!ids.length) {
      if (recipient === 'registrar') {
        // Not the learner's fault and not fixable by them. A College with
        // no administrator account is a configuration fault and is logged
        // as one rather than blamed on the person who wrote in.
        throw new ConfigError('No account holds administrator access, so the Registrar\'s desk is unreachable.');
      }
      fields.recipient = scope.unitId
        ? 'No tutor has yet taught this module. The Registrar\'s desk is open — send recipient: "registrar".'
        : `No tutor has yet taught at Level ${scope.level.roman}. The Registrar's desk is open — send recipient: "registrar".`;
      return null;
    }

    return {
      learnerId: user.id,
      recipients: ids.map((id) => ({ id, party: recipient === 'tutors' ? 'tutor' : 'registrar' })),
      openerParty: 'learner',
      desk: recipient === 'tutors' ? 'The tutors of this level' : "The Registrar's desk",
    };
  }

  // A member of staff opens a thread ABOUT a named learner.
  if (recipient !== 'learner') {
    fields.recipient = 'A member of staff opens a thread with a learner. Send recipient: "learner" and a learnerId.';
    return null;
  }
  if (typeof body.learnerId !== 'string' || !body.learnerId) {
    fields.learnerId = 'Required — the learner this thread is with';
    return null;
  }
  if (body.learnerId === user.id) {
    fields.learnerId = 'A thread has two parties';
    return null;
  }

  // The relation check runs BEFORE the existence check, deliberately.
  // Reversed, a member of staff could learn which user ids exist by
  // which ones answer 422 instead of 403.
  await assertMayReadLearner(env, user, body.learnerId);

  const learner = await db(env)
    .prepare('SELECT id, role FROM users WHERE id = ?').bind(body.learnerId).first();
  if (!learner) {
    fields.learnerId = 'No such person';
    return null;
  }
  // `party = 'learner'` has to mean a learner. An administrator passes
  // assertMayReadLearner() for everybody, including staff accounts, and a
  // colleague filed as the learner in a thread would then appear in every
  // query that reads a learner's correspondence as if they were one.
  if (learner.role !== 'student') {
    fields.learnerId = 'Not a learner account. This endpoint opens a thread with a learner.';
    return null;
  }

  return {
    learnerId: learner.id,
    recipients: [{ id: user.id, party: user.role === 'admin' ? 'registrar' : 'tutor' }],
    openerParty: user.role === 'admin' ? 'registrar' : 'tutor',
    desk: null,
  };
}

/**
 * POST /api/messages — open a thread and say the first thing in it.
 *
 * A thread with no message is not a conversation, so the two are written
 * together and `last_message_at` is set from the same instant rather than
 * patched afterwards. The schema asks for that denormalised column to be
 * "written by the same statement that inserts a message"; D1 gives no
 * transaction here, so the nearest honest equivalent is one function that
 * always does both, with the message written before anything can read the
 * thread's own timestamp as a promise about it.
 */
export async function openThread(env, { user, body, now = null } = {}) {
  assertObject(body);
  assertNoRefusedKeys(body);
  const at = now || nowIso();

  // The text is checked before anything is looked up. A message that
  // cannot be stored should not cost four queries to refuse, and a caller
  // fixing two problems at once should be told about both.
  const fields = {};
  const subject = assertProse(body.subject, 'subject', MAX_SUBJECT, fields);
  const text = assertProse(body.body, 'body', MAX_BODY, fields);
  assertNoFields(fields, 'That message cannot be sent as written.');

  // WHICH IS RESOLVED FIRST DEPENDS ON WHO IS ASKING, and the order is
  // load-bearing in both directions.
  //
  //   a learner : scope first — the recipients are drawn from the level.
  //   staff     : parties first — the scope is checked against the
  //               LEARNER'S enrolments, and there is no learner to check
  //               against until assertMayReadLearner() has passed. The
  //               other order would report which levels a learner is
  //               enrolled in to a member of staff who may not read them.
  const isLearnerCaller = user.role === 'student';
  const scopeFirst = isLearnerCaller ? await readScope(env, user.id, body) : null;
  const parties = await resolveParties(env, { user, body, scope: scopeFirst, fields });
  assertNoFields(fields, 'That thread cannot be opened as addressed.');
  if (!parties) throw new ValidationError('That thread cannot be opened as addressed.', fields);
  const scope = scopeFirst || await readScope(env, parties.learnerId, body);

  // § 4. Counted in the data layer, after validation so a refused request
  // never spends a caller's allowance, and before any write so a refused
  // one leaves nothing behind.
  const allowance = await threadAllowance(env, { user, now: at });
  if (allowance.remaining <= 0) {
    throw new RateLimitError(
      `You have opened ${allowance.opened} threads in the last ${ROLLING_WINDOW_HOURS} hours, which is the limit. Replying in a thread you already have is not limited; the next new thread may be opened at ${allowance.nextAt}.`,
      allowance,
    );
  }

  const threadId = newId('mth');
  await db(env).prepare(`
    INSERT INTO message_threads
      (id, subject, scope, level_id, unit_id, opened_by, status, last_message_at, created_at)
    VALUES (?, ?, ?, ?, ?, ?, 'open', ?, ?)`)
    .bind(threadId, subject, scope.scope, scope.storedLevelId, scope.unitId, user.id, at, at)
    .run();

  // The learner's row first, then the desk. `added_by` is NULL for
  // whoever opened it — nobody added them, they started it — and names
  // the opener for everybody they brought in, which is what the column
  // is for.
  const rows = [];
  if (isLearnerCaller) {
    rows.push({ id: user.id, party: 'learner', addedBy: null });
    for (const r of parties.recipients) rows.push({ id: r.id, party: r.party, addedBy: user.id });
  } else {
    rows.push({ id: parties.learnerId, party: 'learner', addedBy: user.id });
    rows.push({ id: user.id, party: parties.openerParty, addedBy: null });
  }
  for (const r of rows) {
    await db(env).prepare(`
      INSERT INTO message_participants (id, thread_id, user_id, party, added_by, last_read_at, created_at)
      VALUES (?, ?, ?, ?, ?, ?, ?)`)
      // The opener has read their own opening message by definition.
      .bind(newId('mpt'), threadId, r.id, r.party, r.addedBy, r.id === user.id ? at : null, at)
      .run();
  }

  await db(env).prepare(`
    INSERT INTO messages (id, thread_id, sender_id, body, sent_at)
    VALUES (?, ?, ?, ?, ?)`)
    .bind(newId('msg'), threadId, user.id, text, at)
    .run();

  const opened = await readThread(env, { user, threadId, now: at });
  return { ...opened, desk: parties.desk, allowance: await threadAllowance(env, { user, now: at }) };
}

/* ───────────────────────────────────────────────────────────────
 * READING A THREAD
 * ─────────────────────────────────────────────────────────────── */

/**
 * The messages of one thread, bounded by what the caller may see.
 *
 * `left_at` is applied here as a CUT-OFF rather than a refusal: a tutor
 * who handed a learner on keeps the conversation they were part of and
 * does not acquire what was said afterwards. The comparison is bound
 * twice because `NULL <= x` is NULL in SQL, so the "still a participant"
 * case has to be spelled out rather than assumed.
 *
 * The window is the LAST n messages presented oldest-first, not the
 * first n. A thread is read at its live end; a cap that shows the
 * beginning of a long conversation and hides the reply that arrived this
 * morning is a cap that hides the thing the reader opened it for.
 */
async function messagesOf(env, { threadId, leftAt, limit }) {
  const { results } = await db(env).prepare(`
    SELECT * FROM (
      SELECT m.id, m.sender_id, m.body, m.sent_at, m.withdrawn_at, m.withdrawn_reason,
             u.preferred_name AS sender_name, p.party AS sender_party
        FROM messages m
        JOIN users u ON u.id = m.sender_id
        LEFT JOIN message_participants p
               ON p.thread_id = m.thread_id AND p.user_id = m.sender_id
       WHERE m.thread_id = ?
         AND (? IS NULL OR m.sent_at <= ?)
       ORDER BY m.sent_at DESC, m.id DESC
       LIMIT ?
    ) ORDER BY sent_at ASC, id ASC`)
    .bind(threadId, leftAt ?? null, leftAt ?? null, limit)
    .all();
  return results || [];
}

/**
 * GET /api/messages/[thread] — the thread, and it is now read.
 *
 * THE WATERMARK IS SET TO THE LAST MESSAGE ACTUALLY RETURNED, NOT TO
 * `now`, and this is the only interesting line in the function. A
 * watermark set to the clock marks read the message that arrived between
 * this SELECT and this UPDATE — a message the reader was never shown,
 * silently, with no badge left to bring them back to it. The move is also
 * guarded to never run backwards, so re-reading an old thread cannot
 * un-read the messages after it.
 *
 * A thread the caller is not party to is NotFound, not Forbidden. See § 1.
 */
export async function readThread(env, { user, threadId, limit = DEFAULT_MESSAGES, now = null } = {}) {
  if (typeof threadId !== 'string' || !threadId) {
    throw new ValidationError('threadId is required.', { threadId: 'Required' });
  }
  const at = now || nowIso();

  const row = await db(env).prepare(`
    SELECT t.id, t.subject, t.scope, t.level_id, t.unit_id, t.status, t.opened_by,
           t.last_message_at, t.created_at, t.closed_at, t.closed_reason,
           me.party AS my_party, me.last_read_at, me.left_at,
           pl.roman AS level_roman, pl.name AS level_name,
           un.title AS unit_title,
           uc.level_id AS unit_level_id,
           upl.roman AS unit_level_roman, upl.name AS unit_level_name,
           (SELECT COUNT(*) FROM messages m
             WHERE m.thread_id = t.id AND ${UNREAD_PREDICATE}) AS unread,
           (SELECT COUNT(*) FROM messages m2
             WHERE m2.thread_id = t.id AND m2.withdrawn_at IS NULL) AS message_count
      ${MEMBERSHIP}
      LEFT JOIN programme_levels pl ON pl.id = t.level_id
      LEFT JOIN units un ON un.id = t.unit_id
      LEFT JOIN courses uc ON uc.id = un.course_id
      LEFT JOIN programme_levels upl ON upl.id = uc.level_id
     WHERE t.id = ?`)
    .bind(user.id, threadId).first();

  if (!row) throw new NotFoundError('No such thread.');

  const messages = await messagesOf(env, {
    threadId, leftAt: row.left_at ?? null, limit,
  });

  // The watermark: the newest instant on this page, never the clock.
  const highWater = messages.length ? messages[messages.length - 1].sent_at : null;
  if (highWater) {
    await db(env).prepare(`
      UPDATE message_participants
         SET last_read_at = ?
       WHERE thread_id = ? AND user_id = ?
         AND (last_read_at IS NULL OR last_read_at < ?)`)
      .bind(highWater, threadId, user.id, highWater)
      .run();
  }

  const parties = await participantsFor(env, [threadId], user.id);
  const refusal = replyRefusal(row);

  // Recounted after the watermark moved, so the badge the client holds
  // matches the thread it is now looking at rather than the one it asked
  // for a moment ago.
  const after = await db(env).prepare(`
    SELECT COUNT(*) AS n
      FROM messages m
      JOIN message_participants me ON me.thread_id = m.thread_id AND me.user_id = ?
     WHERE m.thread_id = ? AND ${UNREAD_PREDICATE}`)
    .bind(user.id, threadId).first();

  return {
    format: MESSAGE_FORMAT,
    asAt: at,
    thread: {
      ...threadSummary({ ...row, latest_body: null, latest_withdrawn: null }, user.id),
      closedAt: row.closed_at ?? null,
      closedReason: row.closed_reason ?? null,
      unread: after ? after.n : 0,
      participants: parties.get(threadId) || [],
      mayReply: refusal === null,
      replyRefusal: refusal,
    },
    returned: messages.length,
    limit,
    // A thread longer than the cap is telling the client that the top of
    // it is missing, rather than letting a UI present a truncated
    // conversation as the whole of it.
    truncated: (row.message_count ?? 0) > messages.length,
    messages: messages.map((m) => messageView(m, user.id)),
  };
}

/**
 * Why the caller may not reply, or null if they may.
 *
 * One function, used both to refuse the write and to say so on the read,
 * so a UI that greys out the box and a server that rejects the POST are
 * never working from two different rules.
 */
function replyRefusal(row) {
  if (row.left_at) {
    return 'You are no longer a participant in this thread. The record of what you were party to remains.';
  }
  if (row.status === 'closed') {
    return row.closed_reason
      ? `This thread was closed: ${row.closed_reason}`
      : 'This thread has been closed.';
  }
  return null;
}

/* ───────────────────────────────────────────────────────────────
 * REPLYING
 * ─────────────────────────────────────────────────────────────── */

/**
 * POST /api/messages/[thread] — say the next thing.
 *
 * The status move is the part with an opinion in it. Migration 020 is
 * explicit that "'answered' is not 'closed'", and that the two must be
 * distinguishable on a tutor's list — so a reply from the desk marks the
 * thread answered, and a further word from the learner puts it back to
 * open. Read off a queue, that is the difference between "somebody is
 * waiting" and "somebody has been dealt with", which is the only reason
 * the column exists.
 *
 * The sender's own watermark moves too. You have read the conversation
 * you just replied to, and leaving your own reply as evidence that you
 * have unread messages is how a badge becomes something people ignore.
 */
export async function replyToThread(env, { user, threadId, body, now = null } = {}) {
  if (typeof threadId !== 'string' || !threadId) {
    throw new ValidationError('threadId is required.', { threadId: 'Required' });
  }
  assertObject(body);
  assertNoRefusedKeys(body);
  const at = now || nowIso();

  const fields = {};
  const text = assertProse(body.body, 'body', MAX_BODY, fields);
  assertNoFields(fields, 'That message cannot be sent as written.');

  const row = await db(env).prepare(`
    SELECT t.id, t.status, me.party AS my_party, me.left_at, t.closed_reason
      ${MEMBERSHIP}
     WHERE t.id = ?`)
    .bind(user.id, threadId).first();
  if (!row) throw new NotFoundError('No such thread.');

  const refusal = replyRefusal(row);
  if (refusal) throw new AuthorizationError(refusal);

  const messageId = newId('msg');
  await db(env).prepare(`
    INSERT INTO messages (id, thread_id, sender_id, body, sent_at)
    VALUES (?, ?, ?, ?, ?)`)
    .bind(messageId, threadId, user.id, text, at)
    .run();

  const nextStatus = row.my_party === 'learner' ? 'open' : 'answered';
  await db(env).prepare(`
    UPDATE message_threads
       SET last_message_at = ?, status = ?
     WHERE id = ? AND status != 'closed'`)
    .bind(at, nextStatus, threadId)
    .run();

  await db(env).prepare(`
    UPDATE message_participants
       SET last_read_at = ?
     WHERE thread_id = ? AND user_id = ?
       AND (last_read_at IS NULL OR last_read_at < ?)`)
    .bind(at, threadId, user.id, at)
    .run();

  return {
    format: MESSAGE_FORMAT,
    threadId,
    messageId,
    sentAt: at,
    status: nextStatus,
  };
}
