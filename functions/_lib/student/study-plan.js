// What a learner should do next.
//
// This exists because of a gap that was invisible from inside the code
// and obvious the moment anybody tried to be a student. The Listening
// Lab — the largest thing on the platform — opens at
// /listening-lab.html?unit=<id> and, without that parameter, says "No
// unit specified. Open this page from a module." There was no module
// page. A learner who signed in could not reach a lesson at all except
// by being handed a unit id, and nothing on the platform handed them
// one.
//
// So the dashboard showed six levels and a payment history: a record of
// having bought something, with no way in. Everything here answers the
// three questions a learner arrives with, in the order they ask them:
//
//   1. Where am I?      — the level they are in, and how far through
//   2. What do I do now? — ONE action, not a menu
//   3. What comes next?  — the following units, so it is not a black box
//
// WHAT THIS DELIBERATELY DOES NOT DO: decide that a learner has
// finished a level. When every unit is completed it says exactly that
// and stops. Whether finishing the units means the level is passed is
// governance item B4 — currently "completed" is a status a staff member
// sets, and no definition has been adopted. A dashboard that told a
// learner "Level II unlocked" would be inventing the progression rule
// the institution has not made, in the one place a learner would
// believe it.

import { db } from '../db.js';

// Kept in one place: the Lab is the only lesson surface today, but a
// unit could later open into something else, and every caller building
// this URL by hand is how a route change becomes a broken dashboard.
export function unitHref(unitId) {
  return `/listening-lab.html?unit=${encodeURIComponent(unitId)}`;
}

/**
 * @returns {Promise<{
 *   state: 'no_enrolment'|'awaiting_content'|'not_started'|'in_progress'|'units_complete',
 *   level: null | {id:number, roman:string, name:string, cefr:string},
 *   units: Array<{id:string, sequence:number, title:string, status:string, href:string}>,
 *   nextUnit: null | {id:string, sequence:number, title:string, href:string, resuming:boolean},
 *   completedCount: number, totalCount: number,
 *   completedLevels: Array<{id:number, roman:string, name:string}>,
 * }>}
 */
export async function buildStudyPlan(env, userId) {
  const { results: enrolments } = await db(env)
    .prepare(`SELECT e.level_id AS levelId, e.status, l.roman, l.name, l.cefr
       FROM enrolments e JOIN programme_levels l ON l.id = e.level_id
       WHERE e.user_id = ? AND e.status != 'withdrawn'
       ORDER BY e.level_id ASC`)
    .bind(userId)
    .all();

  const completedLevels = enrolments
    .filter((e) => e.status === 'completed')
    .map((e) => ({ id: e.levelId, roman: e.roman, name: e.name }));

  // The level to work on is the LOWEST active one, not the highest.
  // Executive Decision #1 enrols a full-programme payer into Level I
  // immediately and unlocks later levels as earlier ones complete, so a
  // learner can legitimately hold several active enrolments at once.
  // Sending them to the highest would skip the work they are meant to
  // be doing.
  const current = enrolments.find((e) => e.status === 'active') || null;

  const base = {
    level: null, units: [], nextUnit: null,
    completedCount: 0, totalCount: 0, completedLevels,
  };

  if (!current) {
    // Either never enrolled, or every enrolment is completed. These are
    // very different things to say to somebody, so they are not merged.
    return { ...base, state: completedLevels.length ? 'programme_complete' : 'no_enrolment' };
  }

  const level = { id: current.levelId, roman: current.roman, name: current.name, cefr: current.cefr };

  const { results: units } = await db(env)
    .prepare(`SELECT u.id, u.sequence, u.title,
                COALESCE(p.status, 'not_started') AS status
       FROM units u
       JOIN courses c ON c.id = u.course_id
       LEFT JOIN unit_progress p ON p.unit_id = u.id AND p.user_id = ?
       WHERE c.level_id = ?
       ORDER BY u.sequence ASC`)
    .bind(userId, current.levelId)
    .all();

  // An enrolment into a level whose course has not been seeded is a
  // real state — six levels are authored but a deployment can be part
  // way through loading them. Saying "awaiting content" is honest;
  // rendering an empty list under "What to do next" is not.
  if (!units.length) {
    return { ...base, state: 'awaiting_content', level };
  }

  const withHref = units.map((u) => ({ ...u, href: unitHref(u.id) }));
  const completedCount = withHref.filter((u) => u.status === 'completed').length;

  // Resume before advance: a half-finished unit is where the learner
  // actually is, and sending them past it loses their place. Only if
  // nothing is in progress does the first untouched unit become next.
  const resuming = withHref.find((u) => u.status === 'in_progress') || null;
  const fresh = withHref.find((u) => u.status === 'not_started') || null;
  const next = resuming || fresh;

  let state;
  if (!next) state = 'units_complete';
  else if (completedCount === 0 && !resuming) state = 'not_started';
  else state = 'in_progress';

  return {
    state,
    level,
    units: withHref,
    nextUnit: next ? { ...next, resuming: !!resuming } : null,
    completedCount,
    totalCount: withHref.length,
    completedLevels,
  };
}
