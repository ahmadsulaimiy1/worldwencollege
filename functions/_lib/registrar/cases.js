/* THE COLLEGE PUBLISHED ITS APPEAL PROCEDURE AND HAD NOTHING THAT COULD
 * HEAR ONE.
 *
 * THE FAULT THIS FILE CORRECTS. Three facts, each checkable off this
 * repository:
 *
 *   · pages/students-regulations.html § IV publishes decision E2 in
 *     full — three stages, a named hearer for each, ten working days for
 *     a stage one answer and twenty for a stage two — under the heading
 *     "Three stages, and each one is a different person." It has been
 *     published since 17 August 2026.
 *
 *   · `grep -rn "registrar_cases" functions/` returned NOTHING. The
 *     table was built by migration 020 with a stage ladder, a working-day
 *     clock and an event trail, and not one line of code could open a
 *     case, move it a stage, answer it, or read the Registrar's queue.
 *     The College's own governance register carried E2 as ADOPTED while
 *     the only machine that could perform it did not exist.
 *
 *   · The rule the whole procedure rests on had no enforcement anywhere.
 *     The page says it in one sentence — "An appeal that is reconsidered
 *     by whoever decided it first is not an appeal" — and a table whose
 *     `decided_by` column will accept any user id is a table that will
 *     accept exactly that. Migration 020's own comment says E2's
 *     independence is now "structural rather than aspirational"; nothing
 *     made it structural below the schema.
 *
 * So this module is the procedure, performed. Everything it refuses, it
 * refuses by quoting the sentence it is enforcing, because a refusal a
 * Registrar cannot trace to a published rule is a refusal they will
 * eventually route around.
 *
 * ────────────────────────────────────────────────────────────────
 * 1 · THE CONFLICT RULE IS THE POINT OF THE FILE
 * ────────────────────────────────────────────────────────────────
 * Published, at /students/regulations/:
 *
 *     "An appeal that is reconsidered by whoever decided it first is not
 *      an appeal, so the procedure below is built on one rule: at every
 *      stage the decision passes to somebody who was not part of the
 *      last one."
 *
 * assertMayDecide() is that sentence. It bars three sets of people from
 * answering a case, and each limb is derived from a row that already
 * exists rather than from anything a caller asserts:
 *
 *   (a) THE SUBJECT. Nobody hears their own case. A member of staff who
 *       opens a complaint about the College is a learner for the length
 *       of that case.
 *
 *   (b) WHOEVER ANSWERED AN EARLIER STAGE OF THIS CASE, read off
 *       `registrar_case_events` — the trail migration 020 built so that
 *       "no stage may be skipped by the College" is checkable. The same
 *       trail answers the harder question of who has already formed a
 *       view.
 *
 *   (c) WHOEVER TOOK THE DECISION UNDER APPEAL, for an academic matter:
 *       the people who marked this learner's work at the level the case
 *       names, read off `assignment_submissions.graded_by` and
 *       `competency_marks.marked_by`. Stage one is published as a review
 *       "by a member of academic staff senior to, and other than, the
 *       person who took it", and (c) is the "other than".
 *
 * WHAT LIMB (c) COSTS, STATED HONESTLY. `registrar_cases` has no column
 * naming the decision under appeal, so the marker cannot be identified
 * precisely — only the set of people who marked this learner at this
 * level can be. That set is a superset of the one person E2 bars, so the
 * refusal errs toward independence and never away from it. Erring the
 * other way would mean a marker occasionally hearing an appeal against
 * their own mark, which is the single failure the procedure exists to
 * prevent. The precise fix is a schema change and is reported rather
 * than improvised here.
 *
 * SENIORITY IS NOT CHECKED, AND SAYING SO IS NOT AN EXCUSE. E2 asks for
 * a reviewer "senior to" the original decision-maker. Nothing in this
 * schema records academic seniority — `users.role` distinguishes
 * student, staff and admin and no more — so this module enforces "other
 * than" and records the post the hearer states they acted in. It does
 * not report seniority as satisfied, because it has not checked it.
 *
 * ────────────────────────────────────────────────────────────────
 * 2 · THE CLOCK, AND THE ONE INTERVAL THE COLLEGE HAS NOT PUBLISHED
 * ────────────────────────────────────────────────────────────────
 * Migration 020 left the arithmetic here deliberately: the working-day
 * calculation "belongs to the code that reads the published procedure,
 * not to a column that would have to encode a calendar". So:
 *
 *   received      3 working days   students-handbook.html § III — "A
 *                                  reply from the College within three
 *                                  working days of your writing to it."
 *   stage_one    10 working days   E2, published
 *   stage_two    20 working days   E2, published
 *   stage_three  NOT PUBLISHED
 *
 * The Board of Governors has no published interval, and the schema
 * requires every heard stage to carry a deadline. Inventing a number and
 * presenting it as the procedure would be publishing a rule the College
 * has not adopted. What this module does instead is hold the College to
 * the longest interval it HAS published — twenty working days — labels
 * that deadline `college_self_binding` rather than `published` in every
 * payload it appears in, and lets the Registrar reset it by recording a
 * new date and a reason. A learner is never told the Board is bound by a
 * published rule that does not exist.
 *
 * A WORKING DAY IS A WEEKDAY, and that is a stated limitation rather
 * than a claim. docs/academic-calendar.md is marked NOT ADOPTED and the
 * College holds no table of closure days, so nothing here can consult
 * one. When a calendar is adopted, addWorkingDays() is the single place
 * that has to learn about it.
 *
 * AWAITING INFORMATION STOPS THE CLOCK, AND GIVES BACK WHAT IT STOPPED.
 * Migration 020: "a case waiting on the learner is not a case the
 * College is late on". A pause that restarted the full period would be a
 * way to buy ten fresh days by asking a question, so parking records the
 * deadline then in force on the trail, and resuming grants the BALANCE
 * of working days that were left — and where none were left, restores
 * the original deadline so the case resumes already overdue rather than
 * quietly forgiven.
 *
 * ────────────────────────────────────────────────────────────────
 * 3 · A WITHDRAWAL AND A DEFERRAL ARE NOT APPLIED HERE
 * ────────────────────────────────────────────────────────────────
 * Granting a withdrawal changes an enrolment and may move money.
 * Granting a deferral pauses study. This module writes NEITHER. It emits
 * the intent, records it on the case trail with the published rule it
 * would be performed under, and returns it unapplied, with
 * `applied: false` on every one.
 *
 * That is not timidity. `enrolments.status` has no 'paused' value at
 * all, so a granted twelve-month pause — which the handbook says is
 * "granted on request, without documents, without a fee and without a
 * reason" — cannot presently be written to the enrolment without a
 * schema change. A module that silently wrote 'withdrawn' instead would
 * have converted a pause into a withdrawal inside the College's own
 * record, which is the worst available outcome for the learner and would
 * have looked like a working feature. consequencesOf() states what each
 * grant would require, and the gap is reported rather than closed by
 * guesswork.
 *
 * ────────────────────────────────────────────────────────────────
 * 4 · WHAT A LEARNER MAY DO, AND WHAT ONLY THE COLLEGE MAY
 * ────────────────────────────────────────────────────────────────
 * Opening, escalating and withdrawing are the appellant's acts and are
 * refused to staff. Escalation in particular: a stage two review
 * recorded under a staff account is the College appealing to itself, and
 * the trail would show the learner never asked. Routing, parking,
 * resuming, answering and closing are the College's, and each writes an
 * event with a NOT NULL note, because migration 020 is right that "a
 * stage change with no note is the institution moving a person's case
 * without saying why".
 *
 * The College may never close an unanswered case. Only a determination
 * or the learner's own withdrawal reaches 'closed', so a case cannot be
 * tidied out of the queue without an answer in it.
 */

import {
  db, newId, nowIso, ValidationError, NotFoundError,
  parseLimit as sharedParseLimit,
} from '../db.js';
import { AuthorizationError, assertStaffRole, assertAdminRole } from '../auth/session.js';

/* ───────────────────────────────────────────────────────────────
 * THE VOCABULARY — every CHECK constraint on the two tables,
 * restated so a bad value is a 422 naming the field rather than a
 * SQLite constraint failure arriving as a 500.
 * ─────────────────────────────────────────────────────────────── */

/** registrar_cases.kind. Misconduct is deliberately absent — decision A7. */
export const KINDS = ['appeal', 'complaint', 'withdrawal', 'deferral', 'transfer'];

/** registrar_cases.matter. Load-bearing: it routes stage three. */
export const MATTERS = ['academic', 'conduct', 'welfare', 'fair_treatment', 'administrative'];

/** registrar_cases.stage, in full. */
export const STAGES = [
  'received', 'stage_one', 'stage_two', 'stage_three',
  'awaiting_information', 'determined', 'closed',
];

/**
 * The ladder, in order, and the only order it may be climbed.
 * 'awaiting_information' sits off it: a case parks from a rung and
 * returns to the same rung.
 */
export const LADDER = ['received', 'stage_one', 'stage_two', 'stage_three'];

/** The three stages at which the College owes a written answer. */
export const HEARING_STAGES = ['stage_one', 'stage_two', 'stage_three'];

/**
 * The published intervals, in working days, and the one that is not
 * published. See § 2 — `stage_three` is null because the Board of
 * Governors has no adopted interval, and a number here would be this
 * file adopting one.
 */
export const ANSWER_WORKING_DAYS = {
  received: 3,
  stage_one: 10,
  stage_two: 20,
  stage_three: null,
};

/**
 * What the College holds itself to where nothing is published: the
 * longest interval it does publish. Labelled `college_self_binding`
 * wherever it appears, never `published`.
 */
export const SELF_BINDING_WORKING_DAYS = 20;

/**
 * The published window for lodging a stage one appeal — "Write to the
 * College within 20 working days of the decision". It is carried to the
 * learner as information and is NOT enforced: `registrar_cases` records
 * no date for the decision appealed against, so the code has nothing to
 * measure the window from and will not pretend otherwise.
 */
export const LODGING_WORKING_DAYS = 20;

/**
 * The post that hears each stage, in the College's own published words.
 * Stored in `registrar_cases.heard_by_role`, which migration 020 requires
 * to be "a ROLE and never a name — the post outlives whoever holds it and
 * naming a person who does not hold it would be fabricating personnel".
 */
export const HEARD_BY = {
  received: 'The Registrar',
  stage_one: 'A member of academic staff senior to, and other than, the person who took the decision',
  stage_two: 'The Academic Senate',
  stage_three_academic: 'The Governor for Academic Affairs',
  stage_three_other: 'The Governor for Ethics and Institutional Values',
};

/**
 * The post an actor states they acted in, recorded on every event as
 * `actor_role`. A short code rather than the prose above, because the
 * prose is the College's published sentence and an audit column that
 * accepted free text would be a place for somebody to type an office
 * they do not hold.
 */
export const POSTS = {
  registrar: 'registrar',
  stage_one: 'academic_staff_senior_to_decision_maker',
  stage_two: 'academic_senate',
  stage_three_academic: 'governor_academic_affairs',
  stage_three_other: 'governor_ethics_and_institutional_values',
  learner: 'appellant',
};

/**
 * What each kind of case may be answered with.
 *
 * An appeal and a complaint are UPHELD or not; a withdrawal, a deferral
 * and a transfer are GRANTED or refused. Mixing the two vocabularies is
 * how a learner ends up reading that their request to pause was "not
 * upheld", which is a sentence about an argument they did not make.
 */
export const OUTCOMES_BY_KIND = {
  appeal: ['upheld', 'partly_upheld', 'not_upheld', 'substituted', 'returned_for_fresh_assessment'],
  complaint: ['upheld', 'partly_upheld', 'not_upheld'],
  withdrawal: ['granted', 'refused'],
  deferral: ['granted', 'refused'],
  transfer: ['granted', 'refused'],
};

/**
 * Two outcomes are the Academic Senate's alone. E2: at stage two the
 * Senate "may uphold, substitute its own decision, or return the matter
 * for fresh assessment by a different marker". A first reviewer
 * substituting their own mark for a colleague's would be doing the
 * Senate's job with none of the Senate's independence, so the two words
 * are refused below stage two.
 */
export const SENATE_ONLY_OUTCOMES = ['substituted', 'returned_for_fresh_assessment'];

/** The learner's own withdrawal of their case. Never a College outcome. */
export const LEARNER_WITHDRAWAL_OUTCOME = 'withdrawn_by_learner';

/** A summary is a line on the Registrar's queue, not the case. */
export const MAX_SUMMARY = 200;
/** Long enough for a full account with the decision quoted in it. */
export const MAX_DETAIL = 8000;
/** A note on the trail explains one move; it is not a second case file. */
export const MAX_NOTE = 2000;
/** A written answer with reasons. Bounded, but not tightly. */
export const MAX_DECISION = 8000;

/**
 * The cap on cases a learner may have open at once.
 *
 * NOT a ration on complaining, and the refusal says so: a remedy that
 * runs out is not a remedy. It is a guard against a loop — a retrying
 * client or a script — filling the Registrar's queue with a hundred
 * identical matters, and the refusal names the open cases so the learner
 * adds to one rather than being told to go away.
 */
export const MAX_OPEN_CASES = 10;

/** Page sizes, exported because the routes bind `?limit=` to them. */
export const DEFAULT_LIST = 25;
export const MAX_LIST = 100;

/**
 * The reference the learner is given and quotes back — three letters for
 * the kind, the year it was opened, and six characters from the same
 * unambiguous alphabet the Graduate Register uses (no I, O, 0 or 1, so a
 * reference read down a telephone survives).
 */
const REFERENCE_PREFIX = {
  appeal: 'APL', complaint: 'CMP', withdrawal: 'WDL', deferral: 'DEF', transfer: 'TRF',
};
const ALPHABET = '23456789ABCDEFGHJKMNPQRSTVWXYZ';

/**
 * The published sentences, carried in the payload so the interface the
 * learner reads and the rule the server enforces are the same text. Any
 * drift between this file and /students/regulations/ is a drift a reader
 * can see, which is the only kind worth having.
 */
export const PUBLISHED = {
  instrument: 'Decision E2, adopted 17 August 2026.',
  principle: 'An appeal that is reconsidered by whoever decided it first is not an appeal, so the procedure is built on one rule: at every stage the decision passes to somebody who was not part of the last one.',
  no_skipping: 'No stage may be skipped by the College to reach a faster conclusion.',
  stage_one: 'Write to the College within 20 working days of the decision. It is reviewed by a member of academic staff senior to, and other than, the person who took it. You receive a written outcome with reasons. Most appeals end here, and ending here is not a lesser result.',
  stage_two: 'If stage one does not resolve it, the Senate reviews the decision and the way it was reached. The Senate sets academic standards and does not mark work, so nobody reviewing at this stage has a stake in the original outcome. It may uphold, substitute its own decision, or return the matter for fresh assessment by a different marker.',
  stage_three: 'Academic matters go to the Governor for Academic Affairs; matters of conduct, welfare or fair treatment go to the Governor for Ethics and Institutional Values. The Board owns the academic standard and no member of the Executive may sit on it, which is what makes this stage independent of the College’s own management. Its decision closes the matter.',
  acknowledgement: 'A reply from the College within three working days of your writing to it.',
  not_external: 'The Board of Governors is independent of the Executive, not independent of the institution. There is nobody outside the College in the chain. An appellant who has exhausted stage three and remains dissatisfied is entitled to say so publicly, and the College will not treat having done so as a matter of conduct.',
  deferral: 'Write to the Registrar and a pause of up to twelve months is granted on request, without documents, without a fee and without a reason. Your level, your marks and your record stay exactly as you left them.',
  deferral_money: 'A pause changes nothing about a fee, in either direction.',
  withdrawal_money: 'No administrative charge for stopping. What you have paid and not yet studied is answered by the refund policy.',
  refund: 'Any payment is refunded in full, no reason required, if requested within 14 days of the payment AND before any assessed work has been opened in the level that payment covers. Every request receives a written decision within five working days; an approved refund is returned to the original payment method within ten working days of that decision, with nothing deducted.',
};

/* ───────────────────────────────────────────────────────────────
 * THE WORKING-DAY CLOCK
 *
 * One implementation, used by every deadline in the file. When a
 * closure calendar is adopted this is the only function that has to
 * learn about it — which is the reason the arithmetic is not spread
 * across the four places that need a due date.
 * ─────────────────────────────────────────────────────────────── */

/** Saturday and Sunday, in UTC. See § 2 on what this cannot know. */
export function isWorkingDay(iso) {
  const day = new Date(dayOf(iso) + 'T12:00:00.000Z').getUTCDay();
  return day !== 0 && day !== 6;
}

function dayOf(iso) {
  const at = Date.parse(iso);
  if (Number.isNaN(at)) throw new ValidationError('Not a real date.', {});
  return new Date(at).toISOString().slice(0, 10);
}

function endOfDay(dayIso) {
  return `${dayIso}T23:59:59.999Z`;
}

function shiftDay(dayIso, by) {
  return new Date(Date.parse(`${dayIso}T12:00:00.000Z`) + by * 86400000).toISOString().slice(0, 10);
}

/**
 * `days` working days after `from`, as an instant at the end of the due
 * day.
 *
 * END OF DAY, not the same clock time, because "answered within ten
 * working days" is a promise about a day and not about an hour, and a
 * deadline that expires at 09:14 because that is when the learner
 * happened to write would make the College late on a technicality of its
 * own making. Counting starts the day AFTER `from`: a case opened on a
 * Monday with a three-day clock is due at the end of Thursday, which is
 * how a person reads it.
 */
export function addWorkingDays(fromIso, days) {
  if (!Number.isInteger(days) || days < 0) {
    throw new ValidationError('A whole number of working days is required.', {});
  }
  let day = dayOf(fromIso);
  if (days === 0) return endOfDay(day);
  let left = days;
  while (left > 0) {
    day = shiftDay(day, 1);
    if (isWorkingDay(day)) left -= 1;
  }
  return endOfDay(day);
}

/**
 * Working days from `fromIso` up to and including `toIso`'s day, never
 * negative. Used to work out what a paused clock had left on it.
 */
export function workingDaysBetween(fromIso, toIso) {
  const start = dayOf(fromIso);
  const end = dayOf(toIso);
  if (end <= start) return 0;
  let day = start;
  let count = 0;
  while (day < end) {
    day = shiftDay(day, 1);
    if (isWorkingDay(day)) count += 1;
  }
  return count;
}

/**
 * The deadline a stage is bound by, with the authority for it.
 *
 * `basis` is the whole reason this returns an object. 'published' means
 * the College has adopted the interval and the page says so;
 * 'college_self_binding' means it has not, and the College is holding
 * itself to the longest interval it publishes anyway. A payload that
 * flattened the two into a date would be telling a learner that the
 * Board is bound by a rule the College has never adopted.
 */
export function answerDueFor(stage, fromIso) {
  if (!LADDER.includes(stage)) {
    throw new ValidationError(`No clock is defined for stage "${stage}".`, { stage: 'Not a heard stage' });
  }
  const published = ANSWER_WORKING_DAYS[stage];
  const workingDays = published === null ? SELF_BINDING_WORKING_DAYS : published;
  return {
    answerDue: addWorkingDays(fromIso, workingDays),
    workingDays,
    basis: published === null ? 'college_self_binding' : 'published',
    authority: published === null
      ? 'Decision E2 sets no interval for the Board of Governors. The College holds itself to the longest interval it does publish.'
      : PUBLISHED.instrument,
  };
}

/* ───────────────────────────────────────────────────────────────
 * VALIDATION — refuse rather than coerce, and name the field
 * ─────────────────────────────────────────────────────────────── */

/**
 * Prose fit to store on a record a person may one day rely on in an
 * argument with the College: trimmed, bounded, and free of the C0
 * control characters that have no business in a sentence. CRLF is folded
 * to LF, which is the single coercion in this file — a textarea submits
 * CRLF and no reader could ever see the difference.
 */
function assertProse(value, field, max, fields) {
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

function assertOneOf(value, allowed, field, fields) {
  if (!allowed.includes(value)) {
    fields[field] = `One of ${allowed.join(', ')}`;
    return null;
  }
  return value;
}

function assertInstant(value, field, fields) {
  if (typeof value !== 'string' || !/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(\.\d+)?Z$/.test(value)) {
    fields[field] = 'An ISO-8601 UTC instant, e.g. 2026-09-01T09:00:00.000Z';
    return null;
  }
  if (Number.isNaN(Date.parse(value))) {
    fields[field] = 'Not a real date';
    return null;
  }
  return value;
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
export function parseLimit(raw, fallback = DEFAULT_LIST) {
  return sharedParseLimit(raw, { fallback, max: MAX_LIST });
}

/** An optional query-string member of a closed vocabulary. */
export function parseEnum(raw, allowed, field) {
  if (raw === null || raw === undefined || raw === '') return null;
  if (!allowed.includes(raw)) {
    throw new ValidationError(`${field} must be one of ${allowed.join(', ')}.`, { [field]: `One of ${allowed.join(', ')}` });
  }
  return raw;
}

/* ───────────────────────────────────────────────────────────────
 * READING A CASE
 * ─────────────────────────────────────────────────────────────── */

const CASE_COLUMNS = `id, reference, user_id, kind, matter, enrolment_id, level_id,
  summary, detail, stage, heard_by_role, answer_due, outcome, decision,
  decided_by, decided_on, opened_at, closed_at, created_at`;

/**
 * A case by its id OR by the reference the learner was given.
 *
 * Both, because those are the two things a person actually has: an
 * interface holds the id and a learner holds the reference, and an
 * endpoint that took only one of them would force one of the two to look
 * the other up first.
 */
export async function findCase(env, idOrReference) {
  if (typeof idOrReference !== 'string' || !idOrReference) {
    throw new ValidationError('A case id or reference is required.', { case: 'Required' });
  }
  const row = await db(env)
    .prepare(`SELECT ${CASE_COLUMNS} FROM registrar_cases WHERE id = ? OR reference = ?`)
    .bind(idOrReference, idOrReference)
    .first();
  if (!row) throw new NotFoundError('No case with that reference.');
  return row;
}

/** The trail, oldest first. Small by nature — a case has a handful of moves. */
export async function caseTrail(env, caseId) {
  const { results } = await db(env)
    .prepare(`SELECT id, from_stage, to_stage, actor_id, actor_role, note, answer_due_after, created_at
                FROM registrar_case_events WHERE case_id = ?
               ORDER BY created_at, rowid`)
    .bind(caseId)
    .all();
  return results || [];
}

/**
 * The last answer given, and the stage it was given at.
 *
 * The stage matters and is not on the case row: `registrar_cases` keeps
 * one outcome, so a case escalated from stage one to stage two would
 * otherwise show a stage one answer with nothing saying which stage
 * produced it. The trail's `from_stage` is that fact.
 */
function lastDetermination(trail) {
  for (let i = trail.length - 1; i >= 0; i--) {
    const e = trail[i];
    if ((e.to_stage === 'determined' || e.to_stage === 'closed') && LADDER.includes(e.from_stage)) return e;
  }
  return null;
}

/* ───────────────────────────────────────────────────────────────
 * THE CONFLICT RULE
 * ─────────────────────────────────────────────────────────────── */

/**
 * Everybody who may not answer this case, with the ground for each.
 *
 * Returned as a LIST rather than as a yes/no about one person, because
 * the Registrar's queue can then show, beside a case waiting to be
 * listed, who cannot be asked to hear it — which turns the rule from
 * something that refuses work already done into something that shapes
 * the work before it starts.
 *
 * Each limb is derived from a row, never from an assertion by a caller.
 * See § 1 for why limb (c) is a superset and why that is the safe
 * direction to be wrong in.
 */
export async function conflictsFor(env, caseRow) {
  return (await conflictsForMany(env, [caseRow])).get(caseRow.id) || [];
}

/**
 * The same rule, over a page of cases, in two queries rather than two
 * per case.
 *
 * It exists because the Registrar's queue needs the conflict list for
 * every row it shows, and asking case-by-case turned one screen into two
 * hundred round trips. The single-case entry point above DELEGATES here
 * rather than holding a second copy of the rule: two implementations of
 * "who may not hear this" would eventually disagree, and the one that
 * shapes the queue is not the one that refuses the answer, so the
 * disagreement would show up as a Registrar being told a person was fine
 * and then refused when they acted.
 */
export async function conflictsForMany(env, rows) {
  const out = new Map(rows.map((r) => [r.id, []]));
  if (!rows.length) return out;
  const seen = new Set();
  const add = (caseId, userId, ground, detail) => {
    if (!userId) return;
    const key = `${caseId}:${userId}:${ground}`;
    if (seen.has(key)) return;
    seen.add(key);
    out.get(caseId).push({ userId, ground, detail });
  };

  // (a) Nobody hears their own case.
  for (const r of rows) {
    add(r.id, r.user_id, 'subject_of_the_case', 'A person may not hear their own case.');
  }

  // (b) Whoever answered an earlier stage. E2: "at every stage the
  //     decision passes to somebody who was not part of the last one."
  const ids = rows.map((r) => r.id);
  const { results: events } = await db(env)
    .prepare(`SELECT case_id, from_stage, actor_id FROM registrar_case_events
                WHERE case_id IN (${ids.map(() => '?').join(',')})
                  AND actor_id IS NOT NULL AND to_stage IN ('determined','closed')
                ORDER BY created_at, rowid`)
    .bind(...ids)
    .all();
  for (const e of results(events)) {
    if (!LADDER.includes(e.from_stage)) continue;
    add(e.case_id, e.actor_id, 'answered_an_earlier_stage',
      `Answered this case at ${stageLabel(e.from_stage)}. ${PUBLISHED.principle}`);
  }
  for (const r of rows) {
    if (r.decided_by) {
      add(r.id, r.decided_by, 'answered_an_earlier_stage',
        `Gave the answer now under review. ${PUBLISHED.principle}`);
    }
  }

  // (c) Whoever took the decision under appeal, where the matter is
  //     academic. E2 stage one: reviewed "by a member of academic staff
  //     senior to, and other than, the person who took it".
  const academic = rows.filter((r) => r.matter === 'academic');
  if (academic.length) {
    const learners = [...new Set(academic.map((r) => r.user_id))];
    for (const mark of await markersOfLearnersWork(env, learners)) {
      for (const r of academic) {
        if (mark.learner !== r.user_id) continue;
        if (r.level_id !== null && r.level_id !== undefined && mark.level !== r.level_id) continue;
        add(r.id, mark.person, 'marked_the_work_under_appeal',
          r.level_id
            ? `Marked this learner's work at Level ${r.level_id}, so is a person the appeal may be against.`
            : 'Marked this learner\'s work, so is a person the appeal may be against.');
      }
    }
  }

  return out;
}

/** `.all()` returns `{ results }` on D1; this file never assumes it is there. */
function results(rows) {
  return rows || [];
}

/**
 * Who marked these learners' work, and at which level.
 *
 * Two sources because the College marks in two places: a graded
 * submission carries `graded_by`, and a per-competency mark carries
 * `marked_by` with a `source` distinguishing a first marker from a
 * moderator. Both have a stake in an appeal against the result. Quiz
 * attempts are not consulted: they are machine-marked, so there is no
 * person for the rule to be about.
 */
async function markersOfLearnersWork(env, learnerIds) {
  const ph = learnerIds.map(() => '?').join(',');
  const { results: rows } = await db(env)
    .prepare(`
      SELECT DISTINCT learner, level, person FROM (
        SELECT s.user_id AS learner, c.level_id AS level, s.graded_by AS person
          FROM assignment_submissions s
          JOIN learning_items i ON i.id = s.learning_item_id
          JOIN units u ON u.id = i.unit_id
          JOIN courses c ON c.id = u.course_id
         WHERE s.user_id IN (${ph}) AND s.graded_by IS NOT NULL
        UNION
        SELECT s.user_id AS learner, c.level_id AS level, m.marked_by AS person
          FROM competency_marks m
          JOIN assignment_submissions s ON s.id = m.submission_id
          JOIN learning_items i ON i.id = s.learning_item_id
          JOIN units u ON u.id = i.unit_id
          JOIN courses c ON c.id = u.course_id
         WHERE s.user_id IN (${ph}) AND m.marked_by IS NOT NULL
      )`)
    .bind(...learnerIds, ...learnerIds)
    .all();
  return results(rows);
}

/**
 * THE REFUSAL THIS MODULE EXISTS FOR.
 *
 * Called before any answer is written and before any stage is entered by
 * a person who will answer it. A 403, not a 422: this is not a badly
 * filled form, it is the wrong person, and the message says which limb
 * of the published rule they fell foul of so the Registrar can hand the
 * case to somebody else rather than guess.
 */
export async function assertMayDecide(env, { caseRow, actor }) {
  const conflicts = await conflictsFor(env, caseRow);
  const mine = conflicts.filter((c) => c.userId === actor.id);
  if (mine.length) {
    throw new AuthorizationError(
      `${mine[0].detail} ${PUBLISHED.instrument} This case must be answered by somebody else.`,
    );
  }
  return caseRow;
}

/* ───────────────────────────────────────────────────────────────
 * OPENING A CASE
 * ─────────────────────────────────────────────────────────────── */

/**
 * The reference, minted against the table so a collision is impossible
 * rather than improbable. Eight attempts, then a refusal — a silent
 * failure to make a unique reference would surface as a constraint error
 * on somebody's appeal.
 */
async function mintReference(env, kind, nowValue) {
  const year = nowValue.slice(0, 4);
  for (let attempt = 0; attempt < 8; attempt++) {
    const bytes = crypto.getRandomValues(new Uint8Array(6));
    let tail = '';
    for (const b of bytes) tail += ALPHABET[b % ALPHABET.length];
    const reference = `${REFERENCE_PREFIX[kind]}-${year}-${tail}`;
    const clash = await db(env)
      .prepare('SELECT 1 AS hit FROM registrar_cases WHERE reference = ?')
      .bind(reference).first();
    if (!clash) return reference;
  }
  throw new ValidationError('Could not allocate a case reference. Try again.', {});
}

/**
 * A learner opens a case about themselves. There is no parameter for
 * whose case it is.
 *
 * The subject is the session, by the rule
 * functions/api/student/dashboard.js states for the whole learner
 * surface: no id parameter is accepted, "deliberately, so this endpoint
 * can never be used to look up another student's data". A case record is
 * stronger than a lookup — it puts a person's name on an allegation — so
 * the same rule is enforced here in the module rather than only at the
 * route.
 */
export async function openCase(env, {
  actor, kind, matter, summary, detail = null,
  levelId = null, enrolmentId = null, now = null,
} = {}) {
  if (!actor || !actor.id) throw new AuthorizationError();
  const at = now || nowIso();
  const fields = {};

  const theKind = assertOneOf(kind, KINDS, 'kind', fields);
  const theMatter = assertOneOf(matter, MATTERS, 'matter', fields);
  const theSummary = assertProse(summary, 'summary', MAX_SUMMARY, fields);
  const theDetail = detail === null || detail === undefined
    ? null
    : assertProse(detail, 'detail', MAX_DETAIL, fields);

  let theLevel = null;
  if (levelId !== null && levelId !== undefined) {
    if (!Number.isInteger(levelId)) {
      fields.levelId = 'A whole number — the level the case concerns';
    } else {
      const level = await db(env).prepare('SELECT id FROM programme_levels WHERE id = ?')
        .bind(levelId).first();
      if (!level) fields.levelId = 'No such level';
      else theLevel = levelId;
    }
  }

  // An enrolment must be the learner's OWN. Without this check a case
  // could be filed against somebody else's enrolment record, which would
  // put one learner's reference inside another's audit trail — the exact
  // shape of leak `message_participants` was designed against.
  let theEnrolment = null;
  if (enrolmentId !== null && enrolmentId !== undefined) {
    if (typeof enrolmentId !== 'string' || !enrolmentId) {
      fields.enrolmentId = 'The id of one of your own enrolments';
    } else {
      const enrolment = await db(env)
        .prepare('SELECT id, level_id FROM enrolments WHERE id = ? AND user_id = ?')
        .bind(enrolmentId, actor.id).first();
      if (!enrolment) fields.enrolmentId = 'No enrolment of yours with that id';
      else {
        theEnrolment = enrolment.id;
        if (theLevel === null) theLevel = enrolment.level_id;
        else if (theLevel !== enrolment.level_id) {
          fields.levelId = 'Does not match the level of the enrolment named';
        }
      }
    }
  }

  assertNoFields(fields, 'The case could not be opened as written.');

  // See MAX_OPEN_CASES. The refusal names what is already open.
  const { results: open } = await db(env)
    .prepare(`SELECT reference, kind, summary FROM registrar_cases
               WHERE user_id = ? AND stage NOT IN ('determined','closed')
               ORDER BY opened_at`)
    .bind(actor.id).all();
  if ((open || []).length >= MAX_OPEN_CASES) {
    throw new ValidationError(
      `You already have ${open.length} cases open with the Registrar. Add what is new to one of them rather than opening another — nothing is closed until it is answered.`,
      { summary: `${open.length} cases already open: ${open.map((c) => c.reference).join(', ')}` },
    );
  }

  const reference = await mintReference(env, theKind, at);
  const id = newId('rcs');
  // The College's published acknowledgement commitment starts the clock
  // the moment the case exists: "A reply from the College within three
  // working days of your writing to it."
  const clock = answerDueFor('received', at);

  await db(env).prepare(
    `INSERT INTO registrar_cases
       (id, reference, user_id, kind, matter, enrolment_id, level_id, summary, detail,
        stage, heard_by_role, answer_due, opened_at, created_at)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, 'received', ?, ?, ?, ?)`,
  ).bind(
    id, reference, actor.id, theKind, theMatter, theEnrolment, theLevel,
    theSummary, theDetail, HEARD_BY.received, clock.answerDue, at, at,
  ).run();

  await writeEvent(env, {
    caseId: id,
    fromStage: null,
    toStage: 'received',
    actorId: actor.id,
    actorRole: POSTS.learner,
    note: `Case opened by the learner. ${PUBLISHED.acknowledgement}`,
    answerDueAfter: clock.answerDue,
    at,
  });

  return caseView(env, await findCase(env, id), { audience: 'learner', now: at });
}

/* ───────────────────────────────────────────────────────────────
 * MOVING A CASE
 * ─────────────────────────────────────────────────────────────── */

/**
 * Every stage change writes one of these. `note` is NOT NULL in the
 * schema and required here, for migration 020's reason: "a stage change
 * with no note is the institution moving a person's case without saying
 * why, which is precisely the thing an appeal procedure exists to
 * prevent".
 */
async function writeEvent(env, { caseId, fromStage, toStage, actorId, actorRole, note, answerDueAfter, at }) {
  await db(env).prepare(
    `INSERT INTO registrar_case_events
       (id, case_id, from_stage, to_stage, actor_id, actor_role, note, answer_due_after, created_at)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
  ).bind(newId('rce'), caseId, fromStage, toStage, actorId || null, actorRole || null,
    note, answerDueAfter || null, at).run();
}

export function stageLabel(stage) {
  return {
    received: 'received',
    stage_one: 'stage one',
    stage_two: 'stage two',
    stage_three: 'stage three',
    awaiting_information: 'awaiting information',
    determined: 'determined',
    closed: 'closed',
  }[stage] || stage;
}

/** The post E2 names for a stage, given what the case is about. */
export function heardByFor(stage, matter) {
  if (stage === 'stage_one') return HEARD_BY.stage_one;
  if (stage === 'stage_two') return HEARD_BY.stage_two;
  if (stage === 'stage_three') {
    if (matter === 'academic') return HEARD_BY.stage_three_academic;
    if (matter === 'conduct' || matter === 'welfare' || matter === 'fair_treatment') {
      return HEARD_BY.stage_three_other;
    }
    // E2 routes stage three on two named groups of matters and says
    // nothing about an administrative one. Returning null rather than
    // guessing forces the caller to state the post, which is recorded —
    // the College may extend its own procedure, but not by accident
    // inside a helper function.
    return null;
  }
  return HEARD_BY.received;
}

/** The post whose holder is expected to answer a stage. */
function expectedPost(stage, matter) {
  if (stage === 'stage_one') return POSTS.stage_one;
  if (stage === 'stage_two') return POSTS.stage_two;
  if (stage === 'stage_three') {
    return matter === 'academic' ? POSTS.stage_three_academic : POSTS.stage_three_other;
  }
  return POSTS.registrar;
}

/**
 * The College's own moves: route, park, resume, close.
 *
 * A learner's moves are not here — see escalateCase() and withdrawCase()
 * — and that separation is the point. E2's guarantee is that "no stage
 * may be skipped by the College to reach a faster conclusion", so the
 * College's moves are enumerated and each one is checked against the
 * ladder, while the learner's right to climb it is a different function
 * with a different caller.
 */
export async function advanceStage(env, {
  actor, actorRole = POSTS.registrar, caseId, toStage, note,
  answerDue = null, now = null,
} = {}) {
  if (!actor || !actor.id) throw new AuthorizationError();
  // Routing, parking, resuming and closing are the Registrar's desk.
  // functions/_lib/comms/threads.js resolves that desk to the accounts
  // holding administrator access, for want of an office-holder table,
  // and this file uses the same definition rather than inventing a
  // second one.
  assertAdminRole(actor);

  const at = now || nowIso();
  const fields = {};
  assertOneOf(toStage, STAGES, 'toStage', fields);
  const theNote = assertProse(note, 'note', MAX_NOTE, fields);
  assertNoFields(fields, 'The case could not be moved as written.');

  const row = await findCase(env, caseId);
  const from = row.stage;
  const trail = await caseTrail(env, row.id);

  if (from === 'closed') {
    throw new ValidationError('That case is closed. A closed case is not reopened; a new case is opened and the trail of the old one cites it.', { toStage: 'The case is closed' });
  }

  // ── RESUME comes FIRST, and the order is load-bearing ──────────
  // A case parked at stage two resumes at stage two, and the skip
  // refusal below would otherwise read that move as the College jumping
  // a rung. Which of the two a move is depends on where it came FROM,
  // never on where it is going, so the parked case is dealt with before
  // any rule about destinations is consulted.
  if (from === 'awaiting_information' && LADDER.includes(toStage)) {
    return resumeFromPark(env, { row, trail, toStage, actor, actorRole, note: theNote, at });
  }

  // ── ROUTE: received → stage_one ────────────────────────────────
  if (toStage === 'stage_one') {
    if (from !== 'received') {
      throw new ValidationError(`A case at ${stageLabel(from)} does not move to stage one.`, { toStage: 'Not the next rung' });
    }
    return enterStage(env, { row, toStage, actor, actorRole, note: theNote, answerDue, at });
  }

  // ── THE SKIP REFUSAL, quoted from the page it enforces ─────────
  if (toStage === 'stage_two' || toStage === 'stage_three') {
    throw new AuthorizationError(
      `${PUBLISHED.no_skipping} Stage ${toStage === 'stage_two' ? 'two' : 'three'} is reached when the learner escalates an answered case, not when the College moves it.`,
    );
  }

  // ── PARK: stop the clock, and record what it had left on it ────
  if (toStage === 'awaiting_information') {
    if (!LADDER.includes(from)) {
      throw new ValidationError(`A case at ${stageLabel(from)} is not waiting on information.`, { toStage: 'Not an open stage' });
    }
    const left = row.answer_due ? workingDaysBetween(at, row.answer_due) : 0;
    await db(env).prepare(
      'UPDATE registrar_cases SET stage = ?, answer_due = NULL WHERE id = ?',
    ).bind('awaiting_information', row.id).run();
    await writeEvent(env, {
      caseId: row.id,
      fromStage: from,
      toStage: 'awaiting_information',
      actorId: actor.id,
      actorRole,
      note: `${theNote}\n\nThe clock is stopped with ${left} working day${left === 1 ? '' : 's'} remaining on the ${stageLabel(from)} answer, and resumes with that balance.`,
      answerDueAfter: null,
      at,
    });
    return caseView(env, await findCase(env, row.id), { audience: 'staff', now: at });
  }

  // ── CLOSE: only an answered case, and only after its answer ────
  if (toStage === 'closed') {
    if (from !== 'determined') {
      throw new AuthorizationError(
        'A case is closed by its answer or by the learner withdrawing it, never by the College tidying an unanswered matter out of the queue.',
      );
    }
    await db(env).prepare(
      'UPDATE registrar_cases SET stage = ?, closed_at = ?, answer_due = NULL WHERE id = ?',
    ).bind('closed', at, row.id).run();
    await writeEvent(env, {
      caseId: row.id, fromStage: from, toStage: 'closed',
      actorId: actor.id, actorRole, note: theNote, answerDueAfter: null, at,
    });
    return caseView(env, await findCase(env, row.id), { audience: 'staff', now: at });
  }

  if (toStage === 'determined') {
    throw new ValidationError('A determination is recorded with its outcome, its reasons and its author — use recordDecision.', { toStage: 'Use a decision, not a stage move' });
  }

  throw new ValidationError(`A case at ${stageLabel(from)} does not move to ${stageLabel(toStage)}.`, { toStage: 'Not a move this procedure allows' });
}

/**
 * Back to the rung the case parked from, carrying the balance of the
 * period that was left when the clock stopped.
 *
 * The deadline in force at the moment of the park is read off the trail:
 * `answer_due_after` exists, in migration 020's words, so a reviewer
 * "can see the deadline as it stood then rather than only as it stands
 * now" — and that is exactly the number needed to give back what the
 * pause took. A resume that started the published period again would let
 * the College buy ten fresh days by asking a question.
 */
async function resumeFromPark(env, { row, trail, toStage, actor, actorRole, note, at }) {
  const park = [...trail].reverse().find((e) => e.to_stage === 'awaiting_information');
  const parkedFrom = park ? park.from_stage : null;
  if (!parkedFrom) {
    throw new ValidationError('The trail does not record which stage this case was parked from, so it cannot be resumed automatically.', { toStage: 'No park recorded' });
  }
  if (toStage !== parkedFrom) {
    throw new AuthorizationError(
      `${PUBLISHED.no_skipping} This case was parked at ${stageLabel(parkedFrom)} and resumes there, not at ${stageLabel(toStage)}.`,
    );
  }
  let inForce = null;
  for (const e of trail) {
    if (e.id === park.id) break;
    if (e.answer_due_after) inForce = e.answer_due_after;
  }
  const balance = inForce ? workingDaysBetween(park.created_at, inForce) : 0;
  // No balance left means the College was already late when it asked its
  // question. Restoring the original deadline keeps it late rather than
  // granting an extension for having paused.
  const due = balance > 0 ? addWorkingDays(at, balance) : (inForce || answerDueFor(toStage, at).answerDue);
  return enterStage(env, {
    row, toStage, actor, actorRole, at, answerDue: due,
    note: `${note}\n\nResumed at ${stageLabel(toStage)} with ${balance} working day${balance === 1 ? '' : 's'} of the original period remaining.`,
  });
}

/**
 * Enter a heard stage: set the post that hears it and the date it is
 * bound by, and write both to the trail.
 *
 * The conflict rule is NOT applied here. Entering a stage is a listing
 * act — nobody has been named as its hearer yet, because the schema
 * records a post and not a person until the answer is written. The
 * refusal belongs where a person actually decides, and putting it here
 * as well would only give a false sense that it had been checked twice.
 */
async function enterStage(env, { row, toStage, actor, actorRole, note, answerDue, at }) {
  const heardBy = heardByFor(toStage, row.matter);
  if (!heardBy) {
    throw new ValidationError(
      'Decision E2 routes stage three to the Governor for Academic Affairs on academic matters and to the Governor for Ethics and Institutional Values on conduct, welfare or fair treatment. It says nothing about an administrative matter at stage three, so the post that will hear it must be stated and recorded rather than assumed.',
      { heardByRole: 'Required — E2 publishes no route for this matter at stage three' },
    );
  }

  let due = answerDue;
  let clock = null;
  if (due) {
    const fields = {};
    assertInstant(due, 'answerDue', fields);
    assertNoFields(fields, 'The answer date could not be read.');
  } else {
    clock = answerDueFor(toStage, at);
    due = clock.answerDue;
  }

  await db(env).prepare(
    'UPDATE registrar_cases SET stage = ?, heard_by_role = ?, answer_due = ? WHERE id = ?',
  ).bind(toStage, heardBy, due, row.id).run();

  const basisNote = clock && clock.basis === 'college_self_binding'
    ? ` ${clock.authority}`
    : '';
  await writeEvent(env, {
    caseId: row.id,
    fromStage: row.stage,
    toStage,
    actorId: actor.id,
    actorRole,
    note: `${note}\n\nHeard by: ${heardBy}. An answer is owed by ${due}.${basisNote}`,
    answerDueAfter: due,
    at,
  });
  return caseView(env, await findCase(env, row.id), { audience: 'staff', now: at });
}

/**
 * Reset the date an answer is owed by, with the reason.
 *
 * `registrar_case_events.answer_due_after` exists precisely so a
 * reviewer "can see the deadline as it stood then rather than only as it
 * stands now", which makes moving a deadline a recorded act rather than
 * an UPDATE nobody sees. It is available because stage three has no
 * published interval (see § 2) and the Board may sit on a date the
 * Registrar knows and this module cannot.
 */
export async function resetAnswerDue(env, { actor, actorRole = POSTS.registrar, caseId, answerDue, note, now = null } = {}) {
  if (!actor || !actor.id) throw new AuthorizationError();
  assertAdminRole(actor);
  const at = now || nowIso();
  const fields = {};
  const due = assertInstant(answerDue, 'answerDue', fields);
  const theNote = assertProse(note, 'note', MAX_NOTE, fields);
  assertNoFields(fields, 'The answer date could not be reset as written.');

  const row = await findCase(env, caseId);
  if (!HEARING_STAGES.includes(row.stage)) {
    throw new ValidationError(`A case at ${stageLabel(row.stage)} has no answer outstanding.`, { answerDue: 'Not a heard stage' });
  }
  await db(env).prepare('UPDATE registrar_cases SET answer_due = ? WHERE id = ?')
    .bind(due, row.id).run();
  await writeEvent(env, {
    caseId: row.id, fromStage: row.stage, toStage: row.stage,
    actorId: actor.id, actorRole,
    note: `${theNote}\n\nThe answer date was moved from ${row.answer_due} to ${due}.`,
    answerDueAfter: due, at,
  });
  return caseView(env, await findCase(env, row.id), { audience: 'staff', now: at });
}

/* ───────────────────────────────────────────────────────────────
 * ANSWERING A CASE
 * ─────────────────────────────────────────────────────────────── */

/**
 * The written answer, with its author and its reasons.
 *
 * The schema will not take a determination without all four — outcome,
 * decision, decided_by, decided_on — for C9's reason, which
 * /students/integrity/ publishes in one sentence: "An outcome without a
 * recorded reason cannot be appealed against, which makes the appeal a
 * formality." This function refuses each of them separately so the form
 * can say which is missing.
 *
 * A stage three answer goes straight to 'closed'. E2: "Its decision
 * closes the matter." Finality is structural rather than a convention —
 * there is no determination event at stage three for escalateCase() to
 * find, so nothing can be escalated past the Board.
 */
export async function recordDecision(env, {
  actor, actorRole = null, caseId, outcome, decision, note = null, now = null,
} = {}) {
  if (!actor || !actor.id) throw new AuthorizationError();
  assertStaffRole(actor);
  const at = now || nowIso();

  const row = await findCase(env, caseId);
  if (!HEARING_STAGES.includes(row.stage)) {
    throw new ValidationError(
      `A case at ${stageLabel(row.stage)} is not being heard, so there is nothing to answer.`,
      { outcome: `The case is at ${stageLabel(row.stage)}` },
    );
  }

  // THE REFUSAL, BEFORE ANY OTHER VALIDATION. A conflicted decider must
  // not be able to use this endpoint's field-level errors to learn what
  // outcomes a case will accept, and — more plainly — must be told they
  // are the wrong person before they are told their form is wrong.
  await assertMayDecide(env, { caseRow: row, actor });

  const fields = {};
  const allowed = OUTCOMES_BY_KIND[row.kind];
  const theOutcome = assertOneOf(outcome, allowed, 'outcome', fields);
  const theDecision = assertProse(decision, 'decision', MAX_DECISION, fields);
  const theNote = note === null || note === undefined
    ? null
    : assertProse(note, 'note', MAX_NOTE, fields);

  // E2 gives two of these words to the Academic Senate and to the Board
  // above it: at stage two the Senate "may uphold, substitute its own
  // decision, or return the matter for fresh assessment by a different
  // marker". A first reviewer doing either would be exercising the
  // Senate's power without the Senate's independence.
  if (theOutcome && SENATE_ONLY_OUTCOMES.includes(theOutcome) && row.stage === 'stage_one') {
    fields.outcome = 'Available from stage two — E2 gives substitution and re-assessment to the Academic Senate and the Board, not to the first reviewer';
  }

  // The post the answer was given in, checked against the post E2 names
  // for that stage. The College records the claim; it does not verify
  // membership of the Senate or the Board, because no table records it
  // — see the gap reported with this module.
  const wanted = expectedPost(row.stage, row.matter);
  if (actorRole !== null && actorRole !== undefined && actorRole !== wanted) {
    fields.actorRole = `${stageLabel(row.stage)} is heard by ${heardByFor(row.stage, row.matter)} — expected "${wanted}"`;
  }

  assertNoFields(fields, 'The answer could not be recorded as written.');

  const consequences = consequencesOf(row, theOutcome);
  const closesHere = row.stage === 'stage_three';

  await db(env).prepare(
    `UPDATE registrar_cases
        SET stage = ?, outcome = ?, decision = ?, decided_by = ?, decided_on = ?,
            answer_due = NULL, closed_at = ?
      WHERE id = ?`,
  ).bind(
    closesHere ? 'closed' : 'determined', theOutcome, theDecision, actor.id, at,
    closesHere ? at : row.closed_at, row.id,
  ).run();

  const late = row.answer_due && at > row.answer_due;
  const lines = [
    theNote ? `${theNote}\n` : '',
    `Answered at ${stageLabel(row.stage)}: ${theOutcome}.`,
    late ? `The answer was given after the date it was owed by (${row.answer_due}).` : '',
    closesHere ? 'Stage three is final and its decision closes the matter.' : '',
    consequences.length
      ? `Consequences emitted and NOT applied: ${consequences.map((c) => `${c.domain}/${c.intent}`).join(', ')}. Each requires a deliberate act recorded elsewhere; see the case payload.`
      : '',
  ].filter(Boolean);

  await writeEvent(env, {
    caseId: row.id,
    fromStage: row.stage,
    toStage: closesHere ? 'closed' : 'determined',
    actorId: actor.id,
    actorRole: actorRole || wanted,
    note: lines.join('\n'),
    answerDueAfter: null,
    at,
  });

  return caseView(env, await findCase(env, row.id), { audience: 'staff', now: at });
}

/* ───────────────────────────────────────────────────────────────
 * THE LEARNER'S OWN ACTS
 * ─────────────────────────────────────────────────────────────── */

/**
 * The appellant climbs the ladder. Nobody else may.
 *
 * E2 makes escalation conditional on the learner, not the College: "If
 * stage one does not resolve it, the Senate reviews the decision". An
 * escalation recorded under a staff account would be the College
 * appealing to itself and the trail would not show that the learner ever
 * asked, so `actor` must be the subject of the case.
 */
export async function escalateCase(env, { actor, caseId, note, now = null } = {}) {
  if (!actor || !actor.id) throw new AuthorizationError();
  const at = now || nowIso();
  const fields = {};
  const theNote = assertProse(note, 'note', MAX_NOTE, fields);
  assertNoFields(fields, 'The escalation could not be recorded as written.');

  const row = await findCase(env, caseId);
  if (row.user_id !== actor.id) {
    // Identical to the answer a reference that was never issued gets.
    // Distinguishing "not yours" from "no such case" would make this an
    // oracle for which learners have cases open.
    throw new NotFoundError('No case with that reference.');
  }
  if (row.stage !== 'determined') {
    // A stage three answer closes the matter in the same act, so a case
    // the Board has answered is 'closed' and never 'determined'. It
    // gets the finality sentence rather than the generic one, because
    // "this case is at closed" would leave an appellant wondering what
    // they had missed, and E2 is explicit both that the Board's decision
    // is final and that saying so publicly afterwards is their right.
    const answeredFinally = lastDetermination(await caseTrail(env, row.id));
    if (row.stage === 'closed' && answeredFinally && answeredFinally.from_stage === 'stage_three') {
      throw new ValidationError(
        `Stage three is final and its decision closes the matter. ${PUBLISHED.not_external}`,
        { case: 'Final' },
      );
    }
    throw new ValidationError(
      `A case is escalated after it has been answered. This one is at ${stageLabel(row.stage)}.`,
      { case: `At ${stageLabel(row.stage)}` },
    );
  }
  if (row.outcome === LEARNER_WITHDRAWAL_OUTCOME) {
    throw new ValidationError('A case you withdrew is not escalated. Open a new case if the matter continues.', { case: 'Withdrawn by you' });
  }

  const trail = await caseTrail(env, row.id);
  const answered = lastDetermination(trail);
  const answeredAt = answered ? answered.from_stage : null;
  const next = { stage_one: 'stage_two', stage_two: 'stage_three' }[answeredAt];
  if (!next) {
    throw new ValidationError(
      answeredAt === 'stage_three'
        ? 'Stage three is final and its decision closes the matter. There is nobody outside the College in the chain, and you remain entitled to say publicly that you are dissatisfied.'
        : 'This case has not been answered at a stage that can be escalated.',
      { case: 'No further stage' },
    );
  }

  const heardBy = heardByFor(next, row.matter);
  if (!heardBy) {
    throw new ValidationError(
      'Decision E2 publishes no route for an administrative matter at stage three. Write to the Registrar, who must record the post that will hear it.',
      { case: 'No published route at stage three' },
    );
  }
  const clock = answerDueFor(next, at);

  // The answer being appealed stays on the row until the new stage
  // produces its own. A case at stage two showing no answer at all would
  // tell a learner the College had said nothing, when the whole reason
  // they are at stage two is that it did.
  await db(env).prepare(
    'UPDATE registrar_cases SET stage = ?, heard_by_role = ?, answer_due = ? WHERE id = ?',
  ).bind(next, heardBy, clock.answerDue, row.id).run();

  await writeEvent(env, {
    caseId: row.id,
    fromStage: 'determined',
    toStage: next,
    actorId: actor.id,
    actorRole: POSTS.learner,
    note: `${theNote}\n\nEscalated by the learner from ${stageLabel(answeredAt)} to ${stageLabel(next)}. Heard by: ${heardBy}. An answer is owed by ${clock.answerDue}.${clock.basis === 'college_self_binding' ? ` ${clock.authority}` : ''}`,
    answerDueAfter: clock.answerDue,
    at,
  });

  return caseView(env, await findCase(env, row.id), { audience: 'learner', now: at });
}

/**
 * The learner withdraws their own case.
 *
 * Straight to 'closed', with the learner recorded as the author of that
 * decision — because they are. `withdrawn_by_learner` is in the schema's
 * outcome vocabulary and is deliberately not offered to the College: a
 * case the College marked withdrawn on a learner's behalf is a case that
 * disappeared, and the difference is the whole reason the column names
 * who did it.
 */
export async function withdrawCase(env, { actor, caseId, reason, now = null } = {}) {
  if (!actor || !actor.id) throw new AuthorizationError();
  const at = now || nowIso();
  const fields = {};
  const theReason = assertProse(reason, 'reason', MAX_NOTE, fields);
  assertNoFields(fields, 'The withdrawal could not be recorded as written.');

  const row = await findCase(env, caseId);
  if (row.user_id !== actor.id) throw new NotFoundError('No case with that reference.');
  if (row.stage === 'closed') {
    throw new ValidationError('That case is already closed.', { case: 'Closed' });
  }

  await db(env).prepare(
    `UPDATE registrar_cases
        SET stage = 'closed', outcome = ?, decision = ?, decided_by = ?, decided_on = ?,
            answer_due = NULL, closed_at = ?
      WHERE id = ?`,
  ).bind(LEARNER_WITHDRAWAL_OUTCOME, theReason, actor.id, at, at, row.id).run();

  await writeEvent(env, {
    caseId: row.id, fromStage: row.stage, toStage: 'closed',
    actorId: actor.id, actorRole: POSTS.learner,
    note: `Withdrawn by the learner at ${stageLabel(row.stage)}.\n\n${theReason}`,
    answerDueAfter: null, at,
  });

  return caseView(env, await findCase(env, row.id), { audience: 'learner', now: at });
}

/* ───────────────────────────────────────────────────────────────
 * CONSEQUENCES — EMITTED, RECORDED, AND NOT APPLIED
 * ─────────────────────────────────────────────────────────────── */

/**
 * What a grant would require, stated rather than done. See § 3.
 *
 * Every intent carries `applied: false`, the published rule it would be
 * performed under, and the exact rows a deliberate implementation would
 * have to write. Nothing here touches `enrolments`, `enrolment_events`,
 * `payments` or `refunds`.
 */
export function consequencesOf(caseRow, outcome) {
  const out = [];
  const level = caseRow.level_id;

  if (caseRow.kind === 'withdrawal' && outcome === 'granted') {
    out.push({
      domain: 'enrolment',
      intent: 'withdraw_enrolment',
      applied: false,
      enrolmentId: caseRow.enrolment_id,
      levelId: level,
      transition: { from: 'active', to: 'withdrawn' },
      requires: [
        'UPDATE enrolments SET status = \'withdrawn\' for the enrolment named on the case.',
        'INSERT INTO enrolment_events (from_status, to_status, actor_id, reason) recording the officer who granted it and this case reference — the schema exists for exactly this and nothing may change an enrolment without it.',
        'The partial unique index idx_enrolments_one_live_per_level excludes withdrawn rows, so re-enrolment at the same level stays possible afterwards.',
      ],
      published: PUBLISHED.withdrawal_money,
    });
    out.push({
      domain: 'finance',
      intent: 'assess_refund_eligibility',
      applied: false,
      requires: [
        'Assess each payment for the level against decision E1 separately — each instalment carries the 14-day test on its own.',
        'A written decision to the learner within five working days.',
        'An approved refund to the original payment method within ten working days of that decision, with nothing deducted.',
        'No withdrawal charge is applied in any case; the published fee schedule states that none exists.',
      ],
      published: PUBLISHED.refund,
    });
  }

  if (caseRow.kind === 'deferral' && outcome === 'granted') {
    out.push({
      domain: 'enrolment',
      intent: 'pause_enrolment',
      applied: false,
      enrolmentId: caseRow.enrolment_id,
      levelId: level,
      transition: { from: 'active', to: 'paused' },
      blocked: true,
      // The honest part, and the reason nothing is written: there is no
      // such status. Writing 'withdrawn' instead would silently convert
      // a pause into a withdrawal on the learner's own record.
      requires: [
        'enrolments.status has no \'paused\' value — its CHECK admits pending_payment, active, completed and withdrawn only. A granted pause therefore CANNOT be recorded against the enrolment without a schema change, and must not be recorded as a withdrawal instead.',
        'Once a status exists: an enrolment_events row naming the officer, the case reference and the end date the learner gave.',
        'The published six-month letter asking whether to hold the place, with silence holding it.',
      ],
      published: PUBLISHED.deferral,
    });
    out.push({
      domain: 'finance',
      intent: 'no_action',
      applied: false,
      requires: ['Nothing. The published rule is that a pause changes nothing about a fee, in either direction — so a finance step here would itself be the defect.'],
      published: PUBLISHED.deferral_money,
    });
  }

  if (caseRow.kind === 'transfer' && outcome === 'granted') {
    out.push({
      domain: 'enrolment',
      intent: 'transfer_level',
      applied: false,
      enrolmentId: caseRow.enrolment_id,
      levelId: level,
      blocked: true,
      requires: [
        'The schema models no transfer: an enrolment is keyed to one level and idx_enrolments_one_live_per_level permits one live enrolment per level. A transfer is therefore a withdrawal of the current enrolment and a new enrolment at the destination level, both with enrolment_events rows citing this case.',
        'The destination level must be stated. registrar_cases.level_id holds the level the case concerns and there is no column for the level asked for, so the destination lives only in the case detail today.',
        'Any fee difference between the two levels is a finance decision and is not implied by the grant.',
      ],
      published: null,
    });
  }

  if (caseRow.kind === 'appeal' && SENATE_ONLY_OUTCOMES.includes(outcome)) {
    out.push({
      domain: 'academic',
      intent: outcome === 'substituted' ? 'substitute_mark' : 'return_for_fresh_assessment',
      applied: false,
      levelId: level,
      requires: [
        outcome === 'substituted'
          ? 'The substituted mark is written by the marking route with the Senate recorded as its author, never by this module — a mark that appeared without a marker is the fault the marking tables were built against.'
          : 'A fresh assessment by a DIFFERENT marker, which is what E2 requires: the original marker is barred from the re-mark by the same rule that barred them from the appeal.',
        'The learner’s academic record shows the earlier mark and the later one; neither is deleted.',
      ],
      published: PUBLISHED.stage_two,
    });
  }

  return out;
}

/* ───────────────────────────────────────────────────────────────
 * PAYLOADS
 * ─────────────────────────────────────────────────────────────── */

/**
 * One case, as the learner sees it or as the Registrar does.
 *
 * The two audiences differ in exactly two things and the difference is
 * deliberate. The Registrar sees the actor id on each trail entry and
 * the conflict list; the learner sees the POST that acted and no ids at
 * all. E2 is a claim about offices — "the post outlives whoever holds
 * it" — and a learner reading their own file has no need of a staff
 * member's account id to know their case was heard by the right desk.
 */
export async function caseView(env, row, { audience = 'learner', now = null } = {}) {
  const at = now || nowIso();
  const trail = await caseTrail(env, row.id);
  const answered = lastDetermination(trail);
  const answeredAt = answered ? answered.from_stage : null;

  const heardStage = HEARING_STAGES.includes(row.stage) ? row.stage : null;
  const publishedDays = heardStage ? ANSWER_WORKING_DAYS[heardStage] : ANSWER_WORKING_DAYS[row.stage];
  const clock = {
    answerDue: row.answer_due,
    overdue: Boolean(row.answer_due && at > row.answer_due),
    workingDaysRemaining: row.answer_due ? workingDaysBetween(at, row.answer_due) : null,
    publishedWorkingDays: publishedDays === undefined ? null : publishedDays,
    basis: row.answer_due
      ? (publishedDays === null || publishedDays === undefined ? 'college_self_binding' : 'published')
      : null,
    stopped: row.stage === 'awaiting_information',
  };

  const nextStage = { stage_one: 'stage_two', stage_two: 'stage_three' }[answeredAt] || null;
  const mayEscalate = row.stage === 'determined'
    && Boolean(nextStage)
    && row.outcome !== LEARNER_WITHDRAWAL_OUTCOME;

  const view = {
    id: row.id,
    reference: row.reference,
    kind: row.kind,
    matter: row.matter,
    levelId: row.level_id,
    enrolmentId: row.enrolment_id,
    summary: row.summary,
    detail: row.detail,
    stage: row.stage,
    stageLabel: stageLabel(row.stage),
    heardByRole: row.heard_by_role,
    openedAt: row.opened_at,
    closedAt: row.closed_at,
    clock,
    answer: row.outcome
      ? {
        outcome: row.outcome,
        decision: row.decision,
        decidedOn: row.decided_on,
        decidedAtStage: answeredAt,
        stageLabel: answeredAt ? stageLabel(answeredAt) : null,
      }
      : null,
    mayEscalate,
    escalatesTo: mayEscalate ? nextStage : null,
    mayWithdraw: row.stage !== 'closed',
    // Only while the answer that produced them is the case's current
    // state. An escalated case still carries the earlier answer on its
    // row — deliberately, so the learner can see what they are appealing
    // — and republishing that answer's consequences beside a live stage
    // two would read as things the College is about to do.
    consequences: row.outcome && (row.stage === 'determined' || row.stage === 'closed')
      ? consequencesOf(row, row.outcome)
      : [],
    procedure: {
      instrument: PUBLISHED.instrument,
      principle: PUBLISHED.principle,
      lodgingWorkingDays: LODGING_WORKING_DAYS,
      stages: [
        { stage: 'stage_one', workingDays: ANSWER_WORKING_DAYS.stage_one, heardBy: HEARD_BY.stage_one, published: PUBLISHED.stage_one },
        { stage: 'stage_two', workingDays: ANSWER_WORKING_DAYS.stage_two, heardBy: HEARD_BY.stage_two, published: PUBLISHED.stage_two },
        { stage: 'stage_three', workingDays: ANSWER_WORKING_DAYS.stage_three, heardBy: heardByFor('stage_three', row.matter), published: PUBLISHED.stage_three },
      ],
      externalReview: PUBLISHED.not_external,
    },
    trail: trail.map((e) => ({
      fromStage: e.from_stage,
      toStage: e.to_stage,
      actorRole: e.actor_role,
      note: e.note,
      answerDueAfter: e.answer_due_after,
      at: e.created_at,
      ...(audience === 'staff' ? { actorId: e.actor_id } : {}),
    })),
    // Text, and never markup, by the rule
    // functions/_lib/comms/threads.js states: a renderer that
    // interpolates one of these unescaped is contradicting a field it
    // was handed rather than guessing.
    format: 'text/plain',
  };

  if (audience === 'staff') {
    view.userId = row.user_id;
    view.decidedBy = row.decided_by;
    view.conflicts = await conflictsFor(env, row);
    view.mayBeAnsweredNow = HEARING_STAGES.includes(row.stage);
    view.expectedPost = HEARING_STAGES.includes(row.stage) ? expectedPost(row.stage, row.matter) : null;
  }
  return view;
}

/** A row on a list: enough to triage, never the whole file. */
function summaryView(row, at, extra = {}) {
  return {
    id: row.id,
    reference: row.reference,
    kind: row.kind,
    matter: row.matter,
    levelId: row.level_id,
    summary: row.summary,
    stage: row.stage,
    stageLabel: stageLabel(row.stage),
    heardByRole: row.heard_by_role,
    answerDue: row.answer_due,
    overdue: Boolean(row.answer_due && at > row.answer_due),
    outcome: row.outcome,
    openedAt: row.opened_at,
    closedAt: row.closed_at,
    ...extra,
  };
}

/**
 * The learner's own cases. Bound to the session in the WHERE clause, not
 * filtered afterwards — there is no query shape here that can return
 * somebody else's case.
 */
export async function learnerCases(env, { user, limit = DEFAULT_LIST, now = null } = {}) {
  if (!user || !user.id) throw new AuthorizationError();
  const at = now || nowIso();
  const { results } = await db(env)
    .prepare(`SELECT ${CASE_COLUMNS} FROM registrar_cases WHERE user_id = ?
               ORDER BY (CASE WHEN stage IN ('determined','closed') THEN 1 ELSE 0 END), opened_at DESC
               LIMIT ?`)
    .bind(user.id, limit)
    .all();
  const rows = results || [];
  return {
    cases: rows.map((r) => summaryView(r, at)),
    open: rows.filter((r) => r.stage !== 'closed' && r.stage !== 'determined').length,
    procedure: {
      instrument: PUBLISHED.instrument,
      principle: PUBLISHED.principle,
      acknowledgement: PUBLISHED.acknowledgement,
      externalReview: PUBLISHED.not_external,
    },
    kinds: KINDS,
    matters: MATTERS,
    format: 'text/plain',
  };
}

/** One of the learner's own cases, in full. */
export async function learnerCase(env, { user, idOrReference, now = null } = {}) {
  if (!user || !user.id) throw new AuthorizationError();
  const row = await findCase(env, idOrReference);
  if (row.user_id !== user.id) throw new NotFoundError('No case with that reference.');
  return caseView(env, row, { audience: 'learner', now });
}

/**
 * The Registrar's morning question: what is open, and what is late.
 *
 * Ordered by the date an answer is owed, which is what
 * `idx_registrar_cases_due` was built for — migration 020 calls it "one
 * seek: what is still live, in the order it falls due". Cases with no
 * deadline sort last rather than first, because a case waiting on the
 * learner is not the one to work on next.
 */
export async function registrarQueue(env, {
  actor, stage = null, kind = null, matter = null, overdueOnly = false,
  limit = DEFAULT_LIST, now = null,
} = {}) {
  if (!actor || !actor.id) throw new AuthorizationError();
  assertStaffRole(actor);
  const at = now || nowIso();

  const where = [];
  const binds = [];
  if (stage) { where.push('stage = ?'); binds.push(stage); }
  else { where.push("stage NOT IN ('closed')"); }
  if (kind) { where.push('kind = ?'); binds.push(kind); }
  if (matter) { where.push('matter = ?'); binds.push(matter); }
  if (overdueOnly) { where.push('answer_due IS NOT NULL AND answer_due < ?'); binds.push(at); }

  const { results } = await db(env)
    .prepare(`SELECT ${CASE_COLUMNS} FROM registrar_cases
               WHERE ${where.join(' AND ')}
               ORDER BY (CASE WHEN answer_due IS NULL THEN 1 ELSE 0 END), answer_due, opened_at
               LIMIT ?`)
    .bind(...binds, limit)
    .all();
  const rows = results || [];

  // The conflict list travels with the queue so the Registrar knows who
  // may not be asked to hear a case BEFORE listing it, rather than
  // discovering it when the answer is refused. Computed for the whole
  // page in two queries — see conflictsForMany().
  const barred = await conflictsForMany(env, rows);
  const cases = rows.map((r) => summaryView(r, at, {
    userId: r.user_id,
    barredFromHearing: (barred.get(r.id) || []).map((c) => c.userId),
    expectedPost: HEARING_STAGES.includes(r.stage) ? expectedPost(r.stage, r.matter) : null,
  }));

  return {
    cases,
    overdue: cases.filter((c) => c.overdue).length,
    asAt: at,
    procedure: {
      instrument: PUBLISHED.instrument,
      principle: PUBLISHED.principle,
      noSkipping: PUBLISHED.no_skipping,
      workingDays: ANSWER_WORKING_DAYS,
      selfBindingWorkingDays: SELF_BINDING_WORKING_DAYS,
      workingDayDefinition: 'A weekday. The College has adopted no closure calendar (docs/academic-calendar.md is NOT ADOPTED), so no holiday is excluded and none is claimed to be.',
    },
    format: 'text/plain',
  };
}

/** One case, as the Registrar sees it. */
export async function registrarCase(env, { actor, idOrReference, now = null } = {}) {
  if (!actor || !actor.id) throw new AuthorizationError();
  assertStaffRole(actor);
  return caseView(env, await findCase(env, idOrReference), { audience: 'staff', now });
}
