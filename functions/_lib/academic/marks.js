/**
 * THE ARITHMETIC OF A MARK — one implementation, for the whole platform.
 *
 * ────────────────────────────────────────────────────────────────────
 * WHAT FAULT THIS FILE CORRECTS
 * ────────────────────────────────────────────────────────────────────
 * Until this file existed, the College's only numeric academic rule in
 * code was a single scalar — `platform_config.lms_pass_threshold =
 * '0.7'` — whose own comment in sql/schema.sql concedes it is "a
 * mechanism default, not a published WEC-LC academic standard". Every
 * other quantity the institution publishes was arithmetic nobody had
 * written down twice, and the three places that came closest each got
 * a different answer:
 *
 *   · functions/_lib/lms/content.js marks a module completed when
 *     EITHER the quiz OR the assignment reaches that scalar,
 *     independently. So a learner who passes the quiz at seventy and
 *     never submits the assignment has the module recorded as complete
 *     — a level finished having produced nothing a person read.
 *     (data/academic-regulations.json, conformance.module_composite.)
 *
 *   · functions/_lib/student/progression.js completes a level on staff
 *     instruction alone and checks not one of the six published gates.
 *     (conformance.level_mark.)
 *
 *   · Nothing anywhere computed a grade point average, which is the
 *     first figure an admissions office asks a graduate for.
 *
 * Three implementations of "did this learner pass" is three chances to
 * tell one learner two different things about the same work, and a
 * grade is the most consequential number an institution produces about
 * a person. So: ONE file. Every weight, threshold, floor and rounding
 * rule below is read from data/academic-regulations.json — the adopted
 * instrument — and nothing else in the platform may reimplement any of
 * it.
 *
 * ────────────────────────────────────────────────────────────────────
 * WHY THE INSTRUMENT IS TRANSCRIBED HERE RATHER THAN IMPORTED
 * ────────────────────────────────────────────────────────────────────
 * It should be `import instrument from '../../../data/academic-
 * regulations.json' with { type: 'json' }`, and it is not, for a
 * measured reason rather than a preference:
 *
 *   · Node 22 (the test runner) REQUIRES an import attribute on a JSON
 *     module and accepts only the `with` form — `assert` was removed.
 *   · esbuild 0.17.19, which is what wrangler 3.114.17 bundles Pages
 *     Functions with, cannot PARSE `with` and accepts only `assert`.
 *
 * There is no spelling both accept. Importing the file would have
 * produced an engine that runs in the test suite and throws at deploy,
 * which is the worst of the available outcomes. So the instrument's
 * values are transcribed below, keyed BY THE INSTRUMENT'S OWN IDS, and
 * tests/academic-standing.test.mjs reads data/academic-regulations.json
 * from disk and asserts every constant here against it. A transcription
 * a test pins to its source cannot drift; an unpinned one is a second
 * source of truth waiting to disagree with the first. The day wrangler
 * carries esbuild ≥ 0.20 this block becomes an import and the test
 * keeps its meaning unchanged.
 */

/** The instrument these rules are transcribed from, and its version. */
export const INSTRUMENT = Object.freeze({
  id: 'wec.academic_regulations',
  version: '1.0.0',
  programmeCode: 'IEFC',
  adoptedOn: '2026-08-20',
  ratified: false,
  prose: 'docs/academic-regulations.md',
  data: 'data/academic-regulations.json',
});

/**
 * What every stored standing, eligibility and transcript records itself
 * as having been decided under. A standing that cannot say which rules
 * produced it cannot be defended to the learner it was decided about.
 */
export const REGULATION_VERSION = `${INSTRUMENT.id}@${INSTRUMENT.version}`;

/**
 * The name of the scale a grade point is on. Required beside any grade
 * point average that is stored — `academic_standing_reviews` enforces
 * it with a CHECK — so a figure can never outlive the scale that gives
 * it meaning.
 */
export const GRADE_SCALE = 'WEC 4.00';

/** rounding — `round.*`. Stated once, applied in roundTo() and nowhere else. */
export const ROUNDING = Object.freeze({
  method: 'half_up',
  markDecimalPlaces: 2,
  gpaDecimalPlaces: 2,
  displayDecimalPlaces: 1,
});

/** marking_scale — `scale.*`. */
export const SCALE = Object.freeze({
  maximumMark: 100,
  maximumGradePoint: 4,
  passMark: 70,
  distinctionThreshold: 88,
  /** `scale.bands`, highest first, so the first match is the answer. */
  bands: Object.freeze([
    Object.freeze({ id: 'scale.band.a', letter: 'A', from: 94, toExclusive: null, gradePoint: 4, honourId: 'honour.high_distinction' }),
    Object.freeze({ id: 'scale.band.a_minus', letter: 'A−', from: 88, toExclusive: 94, gradePoint: 3.7, honourId: 'honour.distinction' }),
    Object.freeze({ id: 'scale.band.b_plus', letter: 'B+', from: 80, toExclusive: 88, gradePoint: 3.3, honourId: 'honour.merit' }),
    Object.freeze({ id: 'scale.band.b', letter: 'B', from: 70, toExclusive: 80, gradePoint: 3, honourId: 'honour.pass' }),
    // One band below the pass mark, not three, and its grade point is
    // null rather than 0.00 — `scale.sub_pass_grade_point`. A zero
    // averages; an absence of certification must not.
    Object.freeze({ id: 'scale.band.f', letter: 'F', from: 0, toExclusive: 70, gradePoint: null, honourId: null }),
  ]),
});

/** credit — `credit.*`. */
export const CREDIT = Object.freeze({
  notionalHoursPerCredit: 10,
  perModule: 2,
  perLevel: 20,
  perProgramme: 120,
  tqtHoursPerLevel: 200,
  transferable: false,
});

/** module_mark and level_mark — the two composites, `module.*` / `level.*`. */
export const WEIGHTS = Object.freeze({
  module: Object.freeze({ quiz: 0.3, assignment: 0.7 }),
  level: Object.freeze({ examination: 0.6, coursework: 0.4 }),
  /** `level.component.coursework.module_count` — ten modules to a level. */
  modulesPerLevel: 10,
});

/** classification — `honour.honours`, ascending, with both conditions. */
export const HONOURS = Object.freeze([
  Object.freeze({ id: 'honour.pass', code: 'pass', sequence: 1, name: 'Pass', overallThreshold: 70, skillFloor: 60, gradePoint: 3, letter: 'B' }),
  Object.freeze({ id: 'honour.merit', code: 'merit', sequence: 2, name: 'Merit', overallThreshold: 80, skillFloor: 70, gradePoint: 3.3, letter: 'B+' }),
  Object.freeze({ id: 'honour.distinction', code: 'distinction', sequence: 3, name: 'Distinction', overallThreshold: 88, skillFloor: 80, gradePoint: 3.7, letter: 'A−' }),
  Object.freeze({ id: 'honour.high_distinction', code: 'high_distinction', sequence: 4, name: 'High Distinction', overallThreshold: 94, skillFloor: 88, gradePoint: 4, letter: 'A' }),
]);

/**
 * `honour.college_distinction` — conferred by decision of the
 * Executive, never calculated, and carrying no grade point. It is named
 * here so that a caller reading HONOURS cannot conclude the College has
 * only four; it is absent from HONOURS so that no code path can compute
 * its way into one.
 */
export const COLLEGE_DISTINCTION_CODE = 'college_distinction';

/** reassessment — `resit.*`. */
export const RESIT = Object.freeze({
  resitsPerAssessment: 2,
  totalAttempts: 3,
  markCap: 70,
  minimumIntervalDays: 14,
  taskRefreshDays: 365,
  feeUsd: 0,
});

/** level_mark.gates and progression — the conditions, by id and in order. */
export const LEVEL_GATES = Object.freeze([
  Object.freeze({ id: 'level.gate.modules_complete', label: 'All ten modules completed' }),
  Object.freeze({ id: 'level.gate.examination_overall', label: 'Seventy per cent overall on the level examination' }),
  Object.freeze({ id: 'level.gate.examination_criterion_floor', label: 'No examination criterion below fifty per cent' }),
  Object.freeze({ id: 'level.gate.examination_skill_floor', label: 'No examination skill below fifty per cent' }),
  Object.freeze({ id: 'level.gate.spoken_paper', label: 'The spoken paper recorded and passed' }),
  Object.freeze({ id: 'level.gate.staff_confirmation', label: 'A person confirms the level is finished' }),
]);

/** progression — `prog.*`. */
export const PROGRESSION = Object.freeze({
  entryLevel: 1,
  repeatAfterFailedAttempts: 3,
  levels: Object.freeze([1, 2, 3, 4, 5, 6]),
});

/** standing — the three bands, and the two triggers a platform can see. */
export const STANDING_BANDS = Object.freeze({
  good: 'in_good_standing',
  underReview: 'under_review',
  suspended: 'suspended_progression',
});

/** `standing.trigger.two_failed_summatives` — two, within one enrolment. */
export const UNDER_REVIEW_FAILED_ATTEMPTS = 2;

/** The four skills, in reading order, as `language_skills` seeds them. */
export const SKILL_IDS = Object.freeze(['skl_listening', 'skl_reading', 'skl_speaking', 'skl_writing']);

// ─────────────────────────────────────────────────────────────────────
// ROUNDING — the rule, in exactly one place
// ─────────────────────────────────────────────────────────────────────

/**
 * Half up, away from zero (`round.method`), to `dp` places.
 *
 * The naive `Math.round(v * 100) / 100` is WRONG here and the
 * instrument names the case that proves it: it promises that "69.995
 * rounds to 70.00 and passes". In IEEE-754, `69.995 * 100` is
 * 6999.499999999999, which rounds DOWN — the learner sees 70.0 on the
 * screen and a fail in the record, which is the precise fault
 * `round.compare_on_rounded` exists to forbid.
 *
 * Shifting through the decimal literal instead ("69.995e2" → 6999.5)
 * takes the scaled value from the decimal the learner was shown rather
 * than from a multiplication that has already lost the half.
 */
export function roundTo(value, dp) {
  if (value === null || value === undefined || !Number.isFinite(value)) return null;
  const sign = value < 0 ? -1 : 1;
  const abs = Math.abs(value);
  const text = String(abs);
  // A number already in exponential form ("1e-7") cannot be shifted by
  // string concatenation. No mark or grade point reaches that range, so
  // this is a guard rather than a path — but a silent NaN in a grade is
  // not a thing to leave to luck.
  const shifted = text.includes('e') || text.includes('E')
    ? abs * Math.pow(10, dp)
    : Number(`${text}e${dp}`);
  const rounded = Math.round(shifted);
  const back = String(rounded).includes('e') ? rounded / Math.pow(10, dp) : Number(`${rounded}e-${dp}`);
  return sign * back;
}

/** A mark, to two places — `round.mark_dp`. */
export const roundMark = (value) => roundTo(value, ROUNDING.markDecimalPlaces);

/** A grade point average, to two places — `round.gpa_dp`. */
export const roundGpa = (value) => roundTo(value, ROUNDING.gpaDecimalPlaces);

/**
 * A mark as a screen shows it — one place, `round.display_dp`. The
 * stored value keeps two; a mark shown to two invites a learner to read
 * precision the assessment does not carry.
 */
export const displayMark = (value) => roundTo(value, ROUNDING.displayDecimalPlaces);

/**
 * The single conversion point named by `conv.mark_representation`.
 * Every mark in the database is a 0..1 fraction; every threshold the
 * College publishes is a percentage. Naming one conversion is what
 * stops one module comparing 0.7 against 70.
 */
export function percentageFromFraction(fraction) {
  if (fraction === null || fraction === undefined || !Number.isFinite(fraction)) return null;
  return fraction * 100;
}

/**
 * `value >= threshold`, both rounded first — `conv.comparators` plus
 * `round.compare_on_rounded`. The comparison and the display must be
 * the same number, or a learner reads 70.0 and is recorded as failing.
 */
export function meetsThreshold(value, threshold) {
  if (value === null || value === undefined || !Number.isFinite(value)) return false;
  return roundMark(value) >= roundMark(threshold);
}

// ─────────────────────────────────────────────────────────────────────
// THE GRADE LOOKUP
// ─────────────────────────────────────────────────────────────────────

/**
 * A percentage → its band, letter and grade point.
 *
 * null in, null out, and that is the load-bearing half of this function
 * (`conv.absent_is_not_zero`). An unmarked assessment is not an F: F is
 * a judgement about work that was seen, and there is no work.
 */
export function gradeFor(percentage) {
  if (percentage === null || percentage === undefined || !Number.isFinite(percentage)) return null;
  const mark = roundMark(percentage);
  const band = SCALE.bands.find((b) => mark >= b.from && (b.toExclusive === null || mark < b.toExclusive));
  if (!band) return null;
  return {
    percentage: mark,
    bandId: band.id,
    letter: band.letter,
    // Null below the pass mark, never 0.00 — `scale.sub_pass_grade_point`.
    gradePoint: band.gradePoint,
    honourId: band.honourId,
    passed: mark >= SCALE.passMark,
  };
}

// ─────────────────────────────────────────────────────────────────────
// ATTEMPTS — which one counts, and what the record says happened
// ─────────────────────────────────────────────────────────────────────

/**
 * Decide the counting mark for one assessment from every attempt at it.
 *
 * `attempts` is oldest-first, each `{ percentage, at }`, where a
 * percentage of null means an attempt that exists and has not been
 * marked — a submitted assignment nobody has graded yet. Neither
 * quiz_attempts nor assignment_submissions records an attempt ordinal —
 * data/academic-regulations.json asks for one under
 * `conformance.schema.assessment_attempts` and does not have it — so
 * the ordinal is derived from `submitted_at` order. That is sound for
 * ordering and is NOT sound for enforcing `resit.interval`, which is
 * why this function reports the attempt dates rather than enforcing the
 * interval.
 *
 * THERE IS NO PASS MARK ON A COMPONENT. `module.component_floor` is
 * null and explains why: the 30/70 weighting already enforces one, and
 * a second rule saying what the first says is dead machinery. So an
 * assignment at 57.14 is a real contribution to a module mark, not a
 * discarded one — with a perfect quiz it is exactly what completes the
 * module. A component mark below seventy therefore counts; it is the
 * MODULE that has to reach seventy.
 *
 * THE FIVE AWKWARD CASES, each answered here rather than at five call
 * sites:
 *
 *   1. NO ATTEMPT YET. countingMark null, state 'not_attempted'. Not
 *      zero. A learner who has not sat an assessment has no mark on it,
 *      and a zero would be a statement about their performance.
 *
 *   2. A RESIT. `resit.cap` caps the COUNTING mark at the pass mark
 *      while `records_actual` keeps the mark actually achieved in full.
 *      Both are returned: `achievedMark` is what the learner did,
 *      `countingMark` is what the arithmetic uses.
 *
 *      An assessment is RESAT when the first attempt did not reach the
 *      standard and a later one followed it. If the first attempt
 *      already reached the standard, a further attempt is not a resit of
 *      a failed assessment and does not cap anything — the published
 *      reason for the cap is that "an honour should reflect performance
 *      at the standard the first time it was met", and for that learner
 *      the first time was the first time. Their first mark stands, so
 *      sitting an assessment again can never lower what they hold.
 *
 *   3. SUBMITTED AND NOT MARKED. state 'awaiting_marking'. It is not a
 *      fail, it is not an absence, and the difference is the College's
 *      to own rather than the learner's to guess at: the work is in and
 *      the marking is outstanding.
 *
 *   4. RESAT AND STILL SHORT. The latest attempt replaces the earlier
 *      one — re-sits replace rather than accumulate — so a second
 *      attempt at 60 counts at 60, and the cap, being a ceiling, does
 *      not touch it. The module simply does not complete.
 *
 *   5. ATTEMPTS EXHAUSTED. Three sittings is the whole of
 *      `resit.attempts`; a fourth is not a fourth sitting but a repeat
 *      of the level with the assessment set afresh. Reported as
 *      `attemptsRemaining: 0`, never as a penalty, because repeating is
 *      published as a route forward.
 */
export function countingMarkForAttempts(attempts) {
  const list = (Array.isArray(attempts) ? attempts : []).filter((a) => a && (a.percentage === null || Number.isFinite(a.percentage)));
  const attemptCount = list.length;
  const attemptsRemaining = Math.max(0, RESIT.totalAttempts - attemptCount);
  const marked = list.filter((a) => Number.isFinite(a.percentage));
  const unmarked = attemptCount - marked.length;
  // Counted once each, whether they are two attempts at one assessment
  // or one attempt at two — `resit.counts_toward_standing`. In both
  // cases a learner is having difficulty and the College owes them a
  // tutorial.
  const failedAttempts = marked.filter((a) => !meetsThreshold(a.percentage, SCALE.passMark)).length;

  if (attemptCount === 0) {
    return {
      state: 'not_attempted',
      countingMark: null,
      achievedMark: null,
      passed: false,
      attempts: 0,
      unmarked: 0,
      failedAttempts: 0,
      attemptsRemaining: RESIT.totalAttempts,
      resat: false,
      capped: false,
      firstAttemptAt: null,
      lastAttemptAt: null,
    };
  }

  const dates = { firstAttemptAt: list[0].at ?? null, lastAttemptAt: list[attemptCount - 1].at ?? null };
  const achievedMark = marked.length ? roundMark(Math.max(...marked.map((a) => a.percentage))) : null;
  const latest = list[attemptCount - 1];

  if (latest.percentage === null) {
    return {
      state: 'awaiting_marking',
      countingMark: null,
      achievedMark,
      passed: false,
      attempts: attemptCount,
      unmarked,
      failedAttempts,
      attemptsRemaining,
      resat: attemptCount > 1,
      capped: false,
      ...dates,
    };
  }

  // The first attempt is the one that decides whether anything later is
  // a resit. An unmarked first attempt cannot be read as having reached
  // the standard, so a later attempt after it is treated as a resit —
  // the conservative reading, and the one that never awards a learner a
  // higher honour on the strength of a mark nobody has given yet.
  const firstPassed = Number.isFinite(list[0].percentage) && meetsThreshold(list[0].percentage, SCALE.passMark);
  const resat = attemptCount > 1 && !firstPassed;

  // The cap is a defined constant, not a rounding: `round.no_uplift`
  // forbids lifting a mark TO a threshold and this is its mirror,
  // holding one AT the threshold. Otherwise the unrounded mark is
  // carried, because `round.once` forbids rounding a component before
  // it is weighted.
  const standing = firstPassed ? list[0].percentage : latest.percentage;
  const countingMark = resat ? Math.min(RESIT.markCap, standing) : standing;

  return {
    state: 'marked',
    countingMark,
    achievedMark,
    passed: meetsThreshold(countingMark, SCALE.passMark),
    attempts: attemptCount,
    unmarked,
    failedAttempts,
    attemptsRemaining,
    resat,
    capped: resat && standing > RESIT.markCap,
    ...dates,
  };
}

// ─────────────────────────────────────────────────────────────────────
// THE MODULE MARK
// ─────────────────────────────────────────────────────────────────────

/**
 * A module mark from its quiz and its assignment — `module.formula`,
 * 30/70, machine-marked and person-marked.
 *
 * `quiz` and `assignment` are countingMarkForAttempts() results, or
 * null where the curriculum carries no such assessment at all.
 *
 * THE FOUR AWKWARD CASES, again explicitly:
 *
 *   1. NO ATTEMPT YET → mark null, state 'not_attempted'.
 *
 *   2. A RESIT → already resolved into the component's counting mark
 *      above; the module arithmetic never sees an uncapped resit mark,
 *      and `resat` is carried up so a transcript can say so.
 *
 *   3. AN ASSIGNMENT SUBMITTED AND NOT MARKED → mark null, state
 *      'awaiting_marking'. `module.null_until_both_marked` is explicit:
 *      showing a provisional module mark built from the quiz alone
 *      would be showing a number the regulations do not define. This is
 *      the case content.js gets wrong today, and it is why a module is
 *      never "complete on the quiz".
 *
 *   4. A MODULE WITH NO ASSESSMENT → state 'not_assessable', and the
 *      missing components are named. A unit the curriculum never gave a
 *      quiz or an assignment is not a module a learner failed and not
 *      one they completed; it is authoring work outstanding, and it
 *      must be visible as that rather than averaged over.
 */
export function moduleMark({ quiz = null, assignment = null } = {}) {
  const missing = [];
  if (!quiz) missing.push('quiz');
  if (!assignment) missing.push('assignment');
  if (missing.length) {
    return {
      state: 'not_assessable',
      mark: null,
      grade: null,
      complete: false,
      componentsMissing: missing,
      quiz: quiz || null,
      assignment: assignment || null,
      resat: false,
    };
  }

  const resat = Boolean(quiz.resat || assignment.resat);
  const base = {
    quiz,
    assignment,
    resat,
    componentsMissing: [],
    grade: null,
    mark: null,
    complete: false,
  };

  // Ordered deliberately: "awaiting marking" is the state a learner
  // most needs to be told, and it must not be flattened into "in
  // progress" just because the quiz is also outstanding. It is the
  // College's outstanding work, not theirs.
  if (assignment.state === 'awaiting_marking' || quiz.state === 'awaiting_marking') {
    return { ...base, state: 'awaiting_marking' };
  }
  if (quiz.state === 'not_attempted' && assignment.state === 'not_attempted') return { ...base, state: 'not_attempted' };
  if (quiz.countingMark === null || assignment.countingMark === null) {
    // One component done and the other outstanding. `module.both_required`
    // is the whole of it: a module does not complete on one component,
    // and there is no partial module mark to show in the meantime.
    return { ...base, state: 'in_progress' };
  }

  // Rounded ONCE, here, at the end — `round.once`. Neither component is
  // rounded before it is weighted, or three roundings compound into a
  // mark no single rule produced.
  const mark = roundMark(
    (quiz.countingMark * WEIGHTS.module.quiz) + (assignment.countingMark * WEIGHTS.module.assignment),
  );

  return {
    ...base,
    state: 'marked',
    mark,
    grade: gradeFor(mark),
    complete: meetsThreshold(mark, SCALE.passMark),
  };
}

// ─────────────────────────────────────────────────────────────────────
// THE LEVEL MARK
// ─────────────────────────────────────────────────────────────────────

/**
 * The coursework half of a level — the arithmetic mean of its module
 * marks (`level.component.coursework`).
 *
 * Every module must be marked. A mean of the seven that happen to be
 * marked is a different quantity with the same name, and it is the
 * quantity that flatters: it reports the modules a learner has finished
 * and silently omits the ones they have not.
 */
export function courseworkMean(moduleResults) {
  const modules = Array.isArray(moduleResults) ? moduleResults : [];
  const marked = modules.filter((m) => m && m.state === 'marked' && Number.isFinite(m.mark));
  if (!modules.length || marked.length !== modules.length) {
    return { mean: null, marked: marked.length, total: modules.length, complete: false };
  }
  const sum = marked.reduce((a, m) => a + m.mark, 0);
  return { mean: sum / marked.length, marked: marked.length, total: modules.length, complete: true };
}

/**
 * A level mark — `level.formula`, 60 examination / 40 coursework.
 *
 * `examination` is `{ percentage, resat, criterionFloorMet,
 * skillFloorMet, spokenPaperPassed }` or null. TODAY IT IS ALWAYS NULL,
 * and that is a fact about the platform rather than about any learner:
 * no table records a level examination, its rubric criteria, its four
 * skill sub-marks or the spoken paper. The instrument records the same
 * absence at `conformance.level_mark`. This function therefore returns
 * a level mark of null with the reason named, and never a level mark
 * built from coursework alone — a coursework-only level mark would be
 * 40 per cent of a rule presented as the whole of it.
 */
export function levelMark({ examination = null, modules = [] } = {}) {
  const coursework = courseworkMean(modules);
  const examinationPercentage = examination && Number.isFinite(examination.percentage)
    ? examination.percentage
    : null;

  const reasons = [];
  if (examinationPercentage === null) reasons.push('examination_not_recorded');
  if (!coursework.complete) reasons.push('coursework_incomplete');

  if (reasons.length) {
    return {
      state: reasons[0],
      reasons,
      mark: null,
      grade: null,
      examinationMark: examinationPercentage === null ? null : roundMark(examinationPercentage),
      coursework: { ...coursework, mean: coursework.mean === null ? null : roundMark(coursework.mean) },
      modulesExpected: WEIGHTS.modulesPerLevel,
      modulesFound: coursework.total,
      examinationResat: Boolean(examination && examination.resat),
    };
  }

  const mark = roundMark(
    (examinationPercentage * WEIGHTS.level.examination) + (coursework.mean * WEIGHTS.level.coursework),
  );

  return {
    state: 'marked',
    reasons: [],
    mark,
    grade: gradeFor(mark),
    examinationMark: roundMark(examinationPercentage),
    coursework: { ...coursework, mean: roundMark(coursework.mean) },
    modulesExpected: WEIGHTS.modulesPerLevel,
    modulesFound: coursework.total,
    examinationResat: Boolean(examination && examination.resat),
  };
}

/**
 * A level skill mark — `skill.formula`, the same 60/40 within each
 * skill, so a skill mark and the level mark are built the same way and
 * cannot disagree about what a level's work was worth.
 *
 * Returns null when either half is absent, and null is the answer that
 * matters: `skill.null_blocks_conferral` makes a skill with no mark
 * refuse the award rather than pass by default. No assessment in the
 * curriculum carries an approved mapping today
 * (`conformance.skill_mapping`), so every skill mark is null and
 * conferral refuses — the instrument states that this is the intended
 * behaviour and not a fault.
 */
export function skillMark({ examinationSubMark = null, courseworkMean: cwMean = null } = {}) {
  if (!Number.isFinite(examinationSubMark) || !Number.isFinite(cwMean)) return null;
  return roundMark(
    (examinationSubMark * WEIGHTS.level.examination) + (cwMean * WEIGHTS.level.coursework),
  );
}

/**
 * The weighted mean of the assessments approved as evidencing one skill
 * — `skill.coursework_mean`. `items` is `{ mark, weight }` over items in
 * the level with an APPROVED mapping. An unmapped assessment counts
 * toward its module and not toward any skill
 * (`skill.unmapped_assessment`): nobody with the authority to say which
 * skill it evidences has said so.
 */
export function courseworkSkillMean(items) {
  const usable = (Array.isArray(items) ? items : [])
    .filter((i) => i && Number.isFinite(i.mark) && Number.isFinite(i.weight) && i.weight > 0);
  if (!usable.length) return null;
  const weight = usable.reduce((a, i) => a + i.weight, 0);
  return usable.reduce((a, i) => a + (i.mark * i.weight), 0) / weight;
}

// ─────────────────────────────────────────────────────────────────────
// THE CLASSIFICATION
// ─────────────────────────────────────────────────────────────────────

/**
 * The honour a level's work earns — `honour.selection`: the highest
 * whose overall threshold AND skill floor are both met.
 *
 * Both conditions, never either. A level mark of 90 with a skill at 75
 * is a Merit, and the floor DEMOTES rather than fails: the work reached
 * the Merit standard on every measure and the Distinction standard on
 * only one of them. `limitedBy` names which condition held the honour
 * down, because a learner told "Merit" and not why cannot act on it.
 *
 * `skillMarks` is an object keyed by the four `language_skills` ids. A
 * single null among them returns no honour at all.
 */
export function honourFor({ levelMark: mark = null, skillMarks = {}, examinationResat = false } = {}) {
  if (!Number.isFinite(mark)) {
    return { honour: null, reason: 'no_level_mark', limitedBy: null, skillFloorHeldAt: null };
  }

  const missingSkills = SKILL_IDS.filter((id) => !Number.isFinite(skillMarks[id]));
  if (missingSkills.length) {
    // `skill.null_blocks_conferral`. It does not pass by default and it
    // does not silently drop the floor.
    return { honour: null, reason: 'skill_mark_missing', missingSkills, limitedBy: 'skill_mark_missing', skillFloorHeldAt: null };
  }

  const lowestSkill = Math.min(...SKILL_IDS.map((id) => skillMarks[id]));
  const byOverall = HONOURS.filter((h) => meetsThreshold(mark, h.overallThreshold));
  if (!byOverall.length) {
    return { honour: null, reason: 'below_pass_mark', limitedBy: 'overall', skillFloorHeldAt: lowestSkill };
  }

  const satisfied = byOverall.filter((h) => meetsThreshold(lowestSkill, h.skillFloor));
  if (!satisfied.length) {
    return { honour: null, reason: 'skill_floor_not_met', limitedBy: 'skill_floor', skillFloorHeldAt: lowestSkill };
  }

  let awarded = satisfied[satisfied.length - 1];
  const highestByOverall = byOverall[byOverall.length - 1];
  let limitedBy = awarded.sequence < highestByOverall.sequence ? 'skill_floor' : 'overall';

  // `resit.cap_scope.examination` — the examination is the instrument
  // the honour is about, so a level examination passed on a resit caps
  // the LEVEL at Pass, not merely the component. This is the half of
  // the published cap that reaches the whole level.
  const pass = HONOURS[0];
  if (examinationResat && awarded.sequence > pass.sequence) {
    awarded = pass;
    limitedBy = 'examination_resat';
  }

  return {
    honour: { id: awarded.id, code: awarded.code, name: awarded.name, gradePoint: awarded.gradePoint, letter: awarded.letter, sequence: awarded.sequence },
    reason: null,
    limitedBy,
    skillFloorHeldAt: roundMark(lowestSkill),
  };
}

/**
 * The grade point a conferred honour carries, for the average.
 *
 * The Distinction of the College returns null deliberately: it is
 * conferred by decision rather than calculated, carries no grade point
 * and enters no average (`gpa.exclude.college_distinction`). Averaging a
 * decision into a computed figure would misrepresent both.
 */
export function gradePointForHonour(honourCode) {
  if (honourCode === COLLEGE_DISTINCTION_CODE) return null;
  const honour = HONOURS.find((h) => h.code === honourCode);
  return honour ? honour.gradePoint : null;
}

/**
 * A credit-weighted grade point average — `gpa.formula`.
 *
 * Returns null, never 0.00, when nothing qualifies
 * (`gpa.before_first_award`). This is the single most important line in
 * the file: a learner mid-way through Level I has not been certified in
 * anything, and a zero on a transcript says the opposite — it says they
 * were assessed and scored nothing. The two facts are not close.
 */
export function creditWeightedGpa(entries) {
  const counted = (Array.isArray(entries) ? entries : [])
    .filter((e) => e && Number.isFinite(e.gradePoint) && Number.isFinite(e.credits) && e.credits > 0);
  if (!counted.length) return { gpa: null, credits: 0, counted: 0 };
  const credits = counted.reduce((a, e) => a + e.credits, 0);
  const weighted = counted.reduce((a, e) => a + (e.credits * e.gradePoint), 0);
  return { gpa: roundGpa(weighted / credits), credits, counted: counted.length };
}
