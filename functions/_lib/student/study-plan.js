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
import { LEVEL_NAMES_AR, LEVEL_ORDINALS_AR } from '../academic/level-names.js';

// Kept in one place, and the reason for keeping it there has now been
// collected on. This used to open the Listening Lab, which was the only
// lesson surface there was; /my-module.html is the surface a module
// actually opens into — its lessons, its quiz, its assignment and the
// allowance the regulations leave on each — and it links onward to the
// Lab for the items that need a microphone. One edit here moved every
// caller, which is what this function exists for.
export function unitHref(unitId) {
  return `/my-module.html?unit=${encodeURIComponent(unitId)}`;
}

/**
 * @returns {Promise<{
 *   state: 'no_enrolment'|'awaiting_content'|'not_started'|'in_progress'|'units_complete',
 *   level: null | {id:number, roman:string, ordinalAr:string|null,
 *                   name:string, nameAr:string|null, cefr:string},
 *   units: Array<{id:string, sequence:number, title:string, status:string, href:string}>,
 *   nextUnit: null | {id:string, sequence:number, title:string, href:string, resuming:boolean},
 *   completedCount: number, totalCount: number,
 *   completedLevels: Array<{id:number, roman:string, ordinalAr:string|null,
 *                            name:string, nameAr:string|null}>,
 * }>}
 */
// How the learner's own rate compares with the designed one.
//
// The programme is published as four months per level, and that figure
// is in the database (programme_levels.duration_months), so this is a
// comparison against a real specification rather than an invented
// target. It is measured in MODULES, not the "learning units" the
// marketing figure counts: there are ten modules per level and all of
// them exist, whereas the 120-units-per-level figure is a design the
// content has not caught up with (see tests/published-claims.test.mjs).
// Measuring against a number the platform cannot show would produce a
// progress bar that is wrong for everybody.
//
// WHAT THIS IS FOR: a learner three weeks behind in month two can still
// fix it; one who discovers it in month eleven cannot. That is the whole
// argument for showing it.
//
// WHAT IT IS NOT: a deadline, a warning, or a consequence. Access does
// not expire, nothing is withdrawn, no extension is chargeable — none
// of those policies exists, and every one of them carries contractual
// and consumer-protection weight. This reports; it does not enforce.
//
// It also declines to project when a projection would be noise. Two
// completed modules in ten days is not a rate, and "you will finish in
// 2031" from a slow first fortnight is worse than saying nothing.
const MS_PER_DAY = 86400000;
const DAYS_PER_MONTH = 30.44;      // mean Gregorian month
const MIN_DAYS_TO_PROJECT = 14;
const MIN_MODULES_TO_PROJECT = 2;
const ON_TRACK_TOLERANCE = 1;      // modules either side, so a fortnight's ordinary variation is not "behind"

export function computePace({ startedAt, completedCount, totalCount, durationMonths, now }) {
  if (!startedAt || !totalCount || !durationMonths) return null;
  const started = Date.parse(startedAt);
  if (Number.isNaN(started)) return null;

  const elapsedDays = Math.max(0, (now - started) / MS_PER_DAY);
  const designDays = durationMonths * DAYS_PER_MONTH;

  // What the designed pace would have reached by now, capped at the
  // level: "expected 12 of 10" is nonsense a learner would rightly
  // distrust.
  const expectedByNow = Math.min(totalCount, Math.floor((totalCount / designDays) * elapsedDays));

  const diff = completedCount - expectedByNow;
  const standing = Math.abs(diff) <= ON_TRACK_TOLERANCE ? 'on_track' : (diff > 0 ? 'ahead' : 'behind');

  const pace = {
    startedAt,
    elapsedDays: Math.floor(elapsedDays),
    designMonths: durationMonths,
    expectedByNow,
    standing,
    projectedFinish: null,
    projectable: false,
  };

  if (completedCount >= MIN_MODULES_TO_PROJECT && elapsedDays >= MIN_DAYS_TO_PROJECT && completedCount < totalCount) {
    const daysPerModule = elapsedDays / completedCount;
    const daysLeft = daysPerModule * (totalCount - completedCount);
    // A rate implying four times the designed length is a rate that has
    // not settled. Reporting a date from it invites a learner to plan
    // around a number that will move.
    if (elapsedDays + daysLeft <= designDays * 4) {
      pace.projectable = true;
      pace.projectedFinish = new Date(now + daysLeft * MS_PER_DAY).toISOString().slice(0, 10);
    }
  }
  return pace;
}

export async function buildStudyPlan(env, userId, { now = Date.now() } = {}) {
  const { results: enrolments } = await db(env)
    .prepare(`SELECT e.level_id AS levelId, e.status, e.started_at AS startedAt,
                     l.roman, l.name, l.cefr, l.duration_months AS durationMonths
       FROM enrolments e JOIN programme_levels l ON l.id = e.level_id
       WHERE e.user_id = ? AND e.status != 'withdrawn'
       ORDER BY e.level_id ASC`)
    .bind(userId)
    .all();

  const completedLevels = enrolments
    .filter((e) => e.status === 'completed')
    .map((e) => ({
      id: e.levelId, roman: e.roman, ordinalAr: LEVEL_ORDINALS_AR[e.levelId] || null,
      name: e.name, nameAr: LEVEL_NAMES_AR[e.levelId] || null,
    }));

  // The level to work on is the LOWEST active one, not the highest.
  // Executive Decision #1 enrols a full-programme payer into Level I
  // immediately and unlocks later levels as earlier ones complete, so a
  // learner can legitimately hold several active enrolments at once.
  // Sending them to the highest would skip the work they are meant to
  // be doing.
  const current = enrolments.find((e) => e.status === 'active') || null;

  const base = {
    level: null, units: [], nextUnit: null,
    completedCount: 0, totalCount: 0, completedLevels, pace: null,
  };

  if (!current) {
    // Either never enrolled, or every enrolment is completed. These are
    // very different things to say to somebody, so they are not merged.
    return { ...base, state: completedLevels.length ? 'programme_complete' : 'no_enrolment' };
  }

  // Both namings travel, so /ar/my-programme.html can name the level a
  // learner is working on in the language the page is written in.
  const level = {
    id: current.levelId, roman: current.roman,
    ordinalAr: LEVEL_ORDINALS_AR[current.levelId] || null,
    name: current.name, nameAr: LEVEL_NAMES_AR[current.levelId] || null,
    cefr: current.cefr,
  };

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
    pace: computePace({
      startedAt: current.startedAt,
      completedCount,
      totalCount: withHref.length,
      durationMonths: current.durationMonths,
      now,
    }),
  };
}
