/**
 * THE SERVICE SPECIFICATION, AS WORK.
 *
 * Turns what each route promises (data/plan/routes.json) and what every
 * route shares (data/plan/qualification.json) into the academic and
 * administrative work the College must staff to keep the promise. The
 * work is counted by what drives it — a learner, a script, a seminar
 * section, a term — and never by a quantity of time sold.
 *
 * The output is WORK, not price. Price is formed from the whole cost of
 * the institution in price.mjs; this module only says what has to be
 * done.
 */
import { QUALIFICATION as Q, ROUTES, val, LEVELS } from './record.mjs';

const A = Q.assessment;
const M = A.markingMinutes;

/**
 * The shared qualification: academic hours of assessment work for one
 * learner at one level, identical on every route. This is the part of the
 * cost the College could not reduce without changing the award.
 */
export function assessmentHours(level) {
  const rec = val(A.reconciliationRate) * val(A.reconciliationEffort);
  const second = val(A.secondMarkingShare);
  const assignments = val(A.assignmentsPerLevel) * val(M.assignmentFirst)[level] * (1 + second + rec);
  const written = val(A.examinationsPerLevel) * val(M.writtenPaperFirst)[level] * (1 + second + rec);
  const spoken = val(A.examinationsPerLevel) * val(M.spokenPaperFirst)[level] * (1 + second + rec);
  const invigilation = (val(A.sittingHours) * 60) / val(A.candidatesPerInvigilator);
  const sitting = written + spoken + invigilation;
  const resit = val(A.resitRate) * sitting;
  return {
    assignments: assignments / 60,
    examination: sitting / 60,
    resit: resit / 60,
    total: (assignments + sitting + resit) / 60,
  };
}

const c = (route, key) => val(ROUTES.routes[route].components[key]) || 0;

/**
 * What one route adds, per learner per level, in academic hours that do
 * not depend on how many learners share a room: feedback, tutorials,
 * advising, reviews, oversight and bespoke authoring.
 */
export function individualHours(route) {
  const scripts = val(A.assignmentsPerLevel);
  const parts = {
    feedback: (scripts * c(route, 'feedbackMinutesPerAssignment')) / 60,
    tutorials: c(route, 'tutorialHoursPerLevel'),
    advising: c(route, 'adviserHoursPerLevel') + c(route, 'reviewHoursPerLevel') + c(route, 'monitoringHoursPerLevel'),
    oversight: c(route, 'oversightHoursPerLevel'),
    authoring: c(route, 'authoringHoursPerLevel'),
  };
  return { ...parts, total: Object.values(parts).reduce((t, v) => t + v, 0) };
}

/** Seminar hours one section of a route requires across a level. */
export const sectionHours = (route) => c(route, 'seminarHoursPerLevel') + c(route, 'leadershipStrandHoursPerLevel');

/** The section cap, or null where a route teaches no seminar. */
export const sectionCap = (route) => (sectionHours(route) > 0 ? c(route, 'sectionCap') : null);

/** Administrative (not academic) hours per learner per level. */
export const administrativeHours = (route) => c(route, 'administrationHoursPerLevel');

/** Whether a route is staffed at the senior grade and privately scheduled. */
export const grade = (route) => ROUTES.routes[route].grade;
export const isPrivate = (route) => Boolean(ROUTES.routes[route].privateScheduling);

/**
 * The whole of a route's academic work for one learner at one level, at a
 * given average section size. Used to explain the route, and by the price
 * build-up; the engine counts sections from the learners actually present.
 */
export function workPerLearnerLevel(route, level, learnersPerSection) {
  const shared = assessmentHours(level);
  const own = individualHours(route);
  const seminar = sectionHours(route) > 0 ? sectionHours(route) / Math.max(1, learnersPerSection) : 0;
  return {
    shared: shared.total,
    seminar,
    individual: own.total,
    academic: shared.total + seminar + own.total,
    administrative: administrativeHours(route),
  };
}

export const LEVEL_INDEXES = Array.from({ length: LEVELS }, (_, i) => i);
