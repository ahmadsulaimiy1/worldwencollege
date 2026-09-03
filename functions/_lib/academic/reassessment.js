// THE RESIT RULES, ENFORCED — data/academic-regulations.json § resit.
//
// ─────────────────────────────────────────────────────────────────────
// WHAT WAS MISSING, AND WHAT WAS NOT
// ─────────────────────────────────────────────────────────────────────
// The arithmetic was never missing. countingMarkForAttempts() in
// marks.js has always ordered a learner's sittings, applied `resit.cap`
// to the counting mark, kept the achieved mark in full beside it, and
// reported `attemptsRemaining`. Every screen that shows a resit shows
// the right number.
//
// What was missing was the word "no". Nothing refused a fourth sitting
// and nothing refused a resit taken the next morning, so `resit.attempts`
// and `resit.interval` were rules the platform REPORTED ON and never
// APPLIED — met only by learners who happened to comply with them. The
// instrument recorded exactly that, as `conformance.schema.assessment_attempts`.
//
// This file is the "no", and migration 021 is the ordinal it needs.
//
// ─────────────────────────────────────────────────────────────────────
// A REFUSAL HERE IS NEVER A DEAD END, AND MUST NOT READ AS ONE
// ─────────────────────────────────────────────────────────────────────
// `resit.attempts` says three sittings and then "the level is repeated
// and the assessment is set afresh rather than sat a fourth time", and
// `prog.repeat_level` calls repeating "a route forward, not a sanction:
// the modules reopen, the assessments are set afresh, and nothing about
// the learner's access changes". `resit.repeat_charge` and `resit.fee`
// are both zero. So every refusal this file produces carries the route
// out of it in the same sentence — a learner reading it is being told
// what happens next, not that they are finished.
//
// The interval is the same. Fourteen days is not a punishment for
// failing; it is what makes the second attempt evidence rather than a
// test of how well the paper was remembered. The refusal says the date
// they may sit it, because a learner told "not yet" without being told
// "when" has been given a wall.
//
// ─────────────────────────────────────────────────────────────────────
// WHY THE ORDINAL IS WRITTEN AND NOT COUNTED
// ─────────────────────────────────────────────────────────────────────
// `nextAttemptOrdinal` is the highest ordinal on file plus one, never
// the number of rows plus one, and the two differ the moment a sitting
// is voided for misconduct or struck out on appeal.
//
// A NUMBER ALREADY SPENT IS NEVER REISSUED. "Attempt 2" is written into
// a marker's feedback, quoted in an appeal, and printed on whatever the
// Registry produces about the case; reusing it for a later sitting would
// give one learner two different second attempts and leave nothing able
// to tell them apart. The unique index in migration 021 refuses the
// collision outright, which is the schema saying the same thing.
//
// The ALLOWANCE is a separate question with a separate answer: it counts
// the sittings that stand. A sitting the College struck out is one the
// College decided did not happen, so it does not spend an attempt —
// that is what striking one out means, and a rule that both voided a
// sitting and kept charging for it would make the appeal worthless.
//
// ─────────────────────────────────────────────────────────────────────
// WHAT THIS FILE DELIBERATELY DOES NOT DECIDE
// ─────────────────────────────────────────────────────────────────────
// It does not repeat the level. `resit.attempts` says a third failure
// means the level is repeated, and repeating a level reopens ten
// modules, sets fresh assessments and rewrites an enrolment — an act of
// the College, taken by a person, not a side effect of a learner
// pressing submit on a paper they were going to fail anyway. This file
// reports that the position has been reached, in `mustRepeatLevel`, and
// the Registrar's console acts on it.
//
// It does not cap a mark. That is `resit.cap`, it is already
// implemented once in countingMarkForAttempts(), and a second
// implementation here is exactly how two numbers that must agree begin
// to disagree.
import { db, ValidationError } from '../db.js';
import { RESIT, SCALE, meetsThreshold, percentageFromFraction } from './marks.js';

const DAY_MS = 24 * 60 * 60 * 1000;

/** A refusal a learner can act on — never a bare 422. */
export class ReassessmentError extends ValidationError {
  constructor(message, { rule, nextPermittedAt = null, attemptsTaken, mustRepeatLevel = false }) {
    super(message, { attempt: message });
    this.name = 'ReassessmentError';
    this.rule = rule;
    this.nextPermittedAt = nextPermittedAt;
    this.attemptsTaken = attemptsTaken;
    this.mustRepeatLevel = mustRepeatLevel;
  }
}

/** Every prior sitting of one assessment by one learner, oldest first. */
async function priorAttempts(env, { userId, learningItemId, kind }) {
  const table = kind === 'assignment' ? 'assignment_submissions' : 'quiz_attempts';
  // `attempt` orders it, `submitted_at` breaks a null ordinal on a row
  // written before migration 021 ran. Both, so the query is correct
  // during the window where a deploy is ahead of a migration.
  const mark = kind === 'assignment'
    ? "CASE WHEN status = 'graded' THEN grade ELSE NULL END AS fraction"
    : 'score AS fraction';
  const { results } = await db(env)
    .prepare(`SELECT id, attempt, submitted_at AS submittedAt, ${mark}
                FROM ${table}
               WHERE user_id = ? AND learning_item_id = ?
               ORDER BY COALESCE(attempt, 0) ASC, submitted_at ASC, id ASC`)
    .bind(userId, learningItemId)
    .all();
  return results;
}

/**
 * The position on one assessment: how many sittings are taken, whether
 * another is permitted now, and when it will be if it is not.
 *
 * Read-only and exported, because the answer belongs on the learner's
 * own screen BEFORE they attempt anything. "You have one resit left,
 * and you may sit it from 3 September" is a different experience from
 * discovering both facts by being refused.
 */
export async function reassessmentPosition(env, { userId, learningItemId, kind, now = Date.now() }) {
  const attempts = await priorAttempts(env, { userId, learningItemId, kind });
  const taken = attempts.length;
  // The allowance counts the sittings that STAND; the ordinal continues
  // from the highest ever issued. See the head of this file — the two
  // answer different questions and diverge as soon as one is voided.
  const highestOrdinal = attempts.reduce(
    (n, a) => Math.max(n, Number.isInteger(a.attempt) ? a.attempt : 0), 0,
  );
  const last = taken ? attempts[taken - 1] : null;
  const lastAt = last ? Date.parse(last.submittedAt) : null;

  // A sitting that has reached the standard. Nothing below turns on
  // this except the wording — a learner who has passed and wants
  // another go is refused by the same attempt cap as anyone else, and
  // `resit.cap` means a later sitting could only lower their counting
  // mark anyway.
  const passed = attempts.some((a) => Number.isFinite(a.fraction)
    && meetsThreshold(percentageFromFraction(a.fraction), SCALE.passMark));

  const awaitingMarking = kind === 'assignment' && last && !Number.isFinite(last.fraction);

  const intervalClearAt = Number.isFinite(lastAt)
    ? new Date(lastAt + RESIT.minimumIntervalDays * DAY_MS).toISOString()
    : null;
  const intervalHeld = !Number.isFinite(lastAt) || (now - lastAt) >= RESIT.minimumIntervalDays * DAY_MS;

  // `resit.task_refresh` — a limit on the paper, not on the learner. A
  // task first attempted more than a year ago is no longer the same
  // assessment, so the next sitting is set on a fresh one. The learner
  // loses no attempt and pays nothing; this reports it so the assessor
  // knows to set a new task rather than reissue the old one.
  const firstAt = taken ? Date.parse(attempts[0].submittedAt) : null;
  const taskRefreshDue = Number.isFinite(firstAt)
    && (now - firstAt) >= RESIT.taskRefreshDays * DAY_MS;

  const exhausted = taken >= RESIT.totalAttempts;

  return {
    learningItemId,
    kind,
    attemptsTaken: taken,
    attemptsRemaining: Math.max(0, RESIT.totalAttempts - taken),
    totalAttempts: RESIT.totalAttempts,
    nextAttemptOrdinal: Math.max(highestOrdinal, taken) + 1,
    isResit: taken > 0,
    passed,
    awaitingMarking: Boolean(awaitingMarking),
    lastAttemptAt: last ? last.submittedAt : null,
    minimumIntervalDays: RESIT.minimumIntervalDays,
    intervalHeld,
    nextPermittedAt: exhausted ? null : (intervalHeld ? null : intervalClearAt),
    taskRefreshDue,
    // The position `resit.attempts` describes, reported and not acted
    // on: "after that the level is repeated and the assessment is set
    // afresh rather than sat a fourth time".
    mustRepeatLevel: exhausted && !passed,
    mayAttempt: !exhausted && intervalHeld,
    feeUsd: RESIT.feeUsd,
  };
}

/**
 * The gate itself. Returns the ordinal to write; throws a refusal that
 * carries its own way forward.
 */
export async function assertAttemptPermitted(env, { userId, learningItemId, kind, now = Date.now() }) {
  const position = await reassessmentPosition(env, { userId, learningItemId, kind, now });

  if (position.attemptsTaken >= RESIT.totalAttempts) {
    throw new ReassessmentError(
      position.passed
        ? `You have taken all ${RESIT.totalAttempts} permitted sittings of this assessment and you have already met the standard on one of them. A further sitting could not raise your counting mark, which is why the College does not set one.`
        : `This assessment has been sat ${RESIT.totalAttempts} times, which is the whole of the allowance. It is not sat a fourth time: the level is repeated instead, its modules reopen and its assessments are set afresh, at no charge and with no change to anything you can reach. Speak to the Registry and it will be arranged.`,
      { rule: 'resit.attempts', attemptsTaken: position.attemptsTaken, mustRepeatLevel: position.mustRepeatLevel },
    );
  }

  if (!position.intervalHeld) {
    throw new ReassessmentError(
      `A resit is sat no sooner than ${RESIT.minimumIntervalDays} days after the attempt before it, so this one opens on ${position.nextPermittedAt.slice(0, 10)}. The interval is what makes the second attempt evidence: sat two days later it would measure how well the paper was remembered rather than how well the language is held. Nothing expires in the meantime and there is no fee.`,
      { rule: 'resit.interval', nextPermittedAt: position.nextPermittedAt, attemptsTaken: position.attemptsTaken },
    );
  }

  return position;
}
