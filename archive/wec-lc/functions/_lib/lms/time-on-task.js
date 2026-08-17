// Time on task — the measurement behind the College's measured-hours
// commitment (docs/academic-framework.md § I and § XIV).
//
// THE LOAD-BEARING DESIGN DECISION: the client never says how long it
// studied. It says only "I am still working", and the server decides
// what that is worth by looking at the clock.
//
// The alternative — trusting a duration in the request body — would make
// the College's headline academic metric editable from a browser
// console. Publishing measured hours is the strongest claim available to
// an institution with no accreditation, and a measurement anybody can
// edit is worth less than no measurement at all, because it invites
// belief it has not earned.
//
// So a beat credits `min(elapsed since the last beat, MAX_BEAT)`:
//
//   * elapsed  — the real interval, from the server's own clock
//   * MAX_BEAT — a ceiling, so a tab left open overnight and beaten once
//                in the morning credits one interval, not eight hours
//
// WHAT IS DELIBERATELY NOT MEASURED. There is no clickstream, no page
// view log and no session history — one row per learner per module,
// holding a total. That is the least data that answers "how long does
// this module take", and that question is the only reason any of this
// exists.

import { db, newId, nowIso, ValidationError, NotFoundError } from '../db.js';

// A beat is sent every 60s while the learner is present and active. The
// ceiling is 150s rather than 60 so that a slow network, a suspended
// tab or a garbage-collection pause does not silently lose real study
// time — but it is nowhere near long enough for an idle tab to
// accumulate anything meaningful.
export const MAX_BEAT_SECONDS = 150;

// Nobody studies one module for more than a working week. Beyond this a
// row has stopped being evidence and started being noise, and noise in
// the numerator is exactly how a published average becomes a lie.
export const MAX_MODULE_SECONDS = 40 * 3600;

// Below this many completions a per-level figure is not published. A
// mean of four learners is an anecdote with a decimal point.
export const MIN_COHORT_TO_PUBLISH = 30;

/**
 * Credit one beat of study.
 * @returns {Promise<{unitId:string, seconds:number, credited:number, capped:boolean}>}
 */
export async function recordBeat(env, { userId, unitId, now = Date.now() }) {
  if (!unitId) throw new ValidationError('unitId is required.', { unitId: 'Required' });

  const unit = await db(env).prepare('SELECT id FROM units WHERE id = ?').bind(unitId).first();
  if (!unit) throw new NotFoundError('Unknown module.');

  const iso = new Date(now).toISOString();
  const existing = await db(env)
    .prepare('SELECT id, seconds, last_seen_at AS lastSeenAt FROM time_on_task WHERE user_id = ? AND unit_id = ?')
    .bind(userId, unitId)
    .first();

  // The first beat credits nothing. There is no previous moment to
  // measure from, and inventing one would credit study that has not
  // happened yet — the row exists so the SECOND beat has something to
  // measure against.
  if (!existing) {
    await db(env)
      .prepare(`INSERT INTO time_on_task (id, user_id, unit_id, seconds, first_seen_at, last_seen_at)
         VALUES (?, ?, ?, 0, ?, ?)`)
      .bind(newId('tot'), userId, unitId, iso, iso)
      .run();
    return { unitId, seconds: 0, credited: 0, capped: false };
  }

  const elapsed = Math.floor((now - Date.parse(existing.lastSeenAt)) / 1000);
  // A negative interval means the clock moved backwards or the row was
  // written by a future request. Credit nothing rather than guess.
  const credited = elapsed <= 0 ? 0 : Math.min(elapsed, MAX_BEAT_SECONDS);
  const capped = elapsed > MAX_BEAT_SECONDS;

  const total = Math.min(MAX_MODULE_SECONDS, existing.seconds + credited);

  await db(env)
    .prepare('UPDATE time_on_task SET seconds = ?, last_seen_at = ? WHERE id = ?')
    .bind(total, iso, existing.id)
    .run();

  return { unitId, seconds: total, credited: total - existing.seconds, capped };
}

/** One learner's own measured time, by module, for the current level. */
export async function learnerTime(env, { userId, levelId }) {
  const { results } = await db(env)
    .prepare(`SELECT u.id AS unitId, u.sequence, u.title, COALESCE(t.seconds, 0) AS seconds
       FROM units u
       JOIN courses c ON c.id = u.course_id
       LEFT JOIN time_on_task t ON t.unit_id = u.id AND t.user_id = ?
       WHERE c.level_id = ?
       ORDER BY u.sequence ASC`)
    .bind(userId, levelId)
    .all();
  const totalSeconds = results.reduce((n, r) => n + r.seconds, 0);
  return { levelId, modules: results, totalSeconds, totalHours: round1(totalSeconds / 3600) };
}

/**
 * The institutional figure: measured hours for a level, and whether
 * there is yet enough evidence to publish it.
 *
 * The MEDIAN is reported, not the mean. One learner who left a module
 * open for a week moves a mean and does not move a median, and the
 * published figure has to survive exactly that learner. The mean is
 * returned alongside so the two can be compared — a wide gap between
 * them is itself a finding about the data.
 */
export async function measuredWorkload(env, { levelId, minCohort = MIN_COHORT_TO_PUBLISH }) {
  const { results } = await db(env)
    .prepare(`SELECT t.user_id AS userId, SUM(t.seconds) AS seconds
       FROM time_on_task t
       JOIN units u ON u.id = t.unit_id
       JOIN courses c ON c.id = u.course_id
       WHERE c.level_id = ?
       GROUP BY t.user_id`)
    .bind(levelId)
    .all();

  const hours = results.map((r) => r.seconds / 3600).sort((a, b) => a - b);
  const learners = hours.length;

  if (!learners) {
    return { levelId, learners: 0, publishable: false, medianHours: null, meanHours: null,
      reason: 'No measured study time recorded for this level yet.' };
  }

  const mid = Math.floor(learners / 2);
  const medianHours = learners % 2 ? hours[mid] : (hours[mid - 1] + hours[mid]) / 2;
  const meanHours = hours.reduce((a, b) => a + b, 0) / learners;

  return {
    levelId,
    learners,
    medianHours: round1(medianHours),
    meanHours: round1(meanHours),
    publishable: learners >= minCohort,
    // Stated rather than left to the caller to infer. A figure that is
    // not publishable must say why, or somebody will publish it.
    reason: learners >= minCohort
      ? null
      : `Measured from ${learners} learner${learners === 1 ? '' : 's'}; ${minCohort} are required before this figure is published.`,
  };
}

function round1(n) { return Math.round(n * 10) / 10; }
