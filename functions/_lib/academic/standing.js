/**
 * WHERE A LEARNER STANDS — the record side of the measurement engine.
 *
 * ────────────────────────────────────────────────────────────────────
 * WHAT FAULT THIS FILE CORRECTS
 * ────────────────────────────────────────────────────────────────────
 * marks.js knows the arithmetic of one mark. Nothing knew the
 * arithmetic of one LEARNER, and the platform's answers to the four
 * questions a student actually asks were these:
 *
 *   "What is my average?"      — nothing computed one, anywhere.
 *   "Where do I stand?"        — `academic_standing_reviews` was an
 *                                empty table with no writer.
 *   "Can I start Level III?"   — completeLevel() opened it on staff
 *                                instruction and checked no gate
 *                                (conformance.level_mark).
 *   "What is left before I     — no answer existed, and the honest one
 *    graduate?"                  is a list, never a boolean.
 *
 * The last of those is the reason this file returns structures rather
 * than verdicts. `graduation_eligibility` in sql/schema.sql makes the
 * same argument in a CHECK constraint: `outstanding` is required
 * wherever a learner is not eligible, because "a learner told only 'not
 * eligible' cannot become eligible, and an institution that cannot say
 * what is outstanding is one nobody can finish at."
 *
 * ────────────────────────────────────────────────────────────────────
 * THE ONE DISTINCTION THAT MATTERS MOST HERE
 * ────────────────────────────────────────────────────────────────────
 * A learner with no marks yet gets a WELL-FORMED answer that says so.
 * Never a zero grade point average, never an empty list presented as a
 * finished one, never "not eligible" with nothing after it.
 *
 * Zero is a value and it averages. Absence is not a value and must not
 * (`conv.absent_is_not_zero`). A GPA of 0.00 on a record says the
 * learner was assessed and scored nothing; null says the College has
 * certified nothing yet. Those are opposite statements about a person,
 * and the second one is the true one for every learner mid-way through
 * their first level — which, today, is every learner the College has.
 *
 * ────────────────────────────────────────────────────────────────────
 * WHAT THIS FILE DELIBERATELY CANNOT DECIDE
 * ────────────────────────────────────────────────────────────────────
 * · SUSPENDED PROGRESSION. Its only published trigger is "an integrity
 *   matter opened under the misconduct procedure", and `registrar_cases`
 *   excludes misconduct from its kinds on purpose. There is nothing for
 *   a program to read, so a program never computes this band; it is
 *   recorded by a person, and this file carries a person's record
 *   forward rather than overwriting it with a sweep's opinion.
 *
 * · THE STAFF FLAG. `standing.trigger.staff_flag` requires a recorded
 *   reason. A reason is not a thing a query produces.
 *
 * · A FAILED LEVEL EXAMINATION. No table records a level examination at
 *   all. The trigger is reported as not instrumented rather than as
 *   "did not fire" — those read the same on a screen and mean opposite
 *   things about the College.
 */

import { db, newId, nowIso, ValidationError } from '../db.js';
import {
  CREDIT,
  GRADE_SCALE,
  HONOURS,
  LEVEL_GATES,
  PROGRESSION,
  REGULATION_VERSION,
  SCALE,
  SKILL_IDS,
  STANDING_BANDS,
  UNDER_REVIEW_FAILED_ATTEMPTS,
  WEIGHTS,
  countingMarkForAttempts,
  courseworkSkillMean,
  creditWeightedGpa,
  gradePointForHonour,
  honourFor,
  levelMark,
  moduleMark,
  percentageFromFraction,
  roundMark,
  skillMark,
} from './marks.js';

// ─────────────────────────────────────────────────────────────────────
// READING THE RECORD
// ─────────────────────────────────────────────────────────────────────

/**
 * Everything about one learner that a mark can be computed from, in a
 * fixed number of statements.
 *
 * TEN AGGREGATE QUERIES, NOT TWO PER MODULE. The same fault was found
 * and fixed once already in functions/_lib/lms/content.js — a loop
 * issuing two statements per listening item, 21 round trips for a
 * ten-module level — and D1 is SQLite over the network, so each round
 * trip is real latency on a page a learner opens to see how they are
 * doing. A learner enrolled at six levels would be sixty round trips
 * under the loop shape and ten under this one.
 *
 * The curriculum reads are deliberately unfiltered by level. Sixty
 * units and a hundred and twenty assessment items is the WHOLE of the
 * authored programme, so fetching all of them costs less than the
 * second round trip it would take to learn which levels to ask for.
 * That trade turns the day a level carries a hundred modules, and this
 * comment is where to change it.
 */
async function readAcademicRecord(env, userId) {
  const conn = db(env);

  const [levels, enrolments, awards, units, items, quizzes, submissions, mappings, reviews, eligibility] = await Promise.all([
    conn.prepare('SELECT id AS levelId, roman, name, cefr FROM programme_levels ORDER BY id ASC').bind().all(),
    conn.prepare(
      `SELECT e.id, e.level_id AS levelId, e.status, e.started_at AS startedAt, e.completed_at AS completedAt
         FROM enrolments e WHERE e.user_id = ? ORDER BY e.level_id ASC`).bind(userId).all(),
    conn.prepare(
      `SELECT id, level_id AS levelId, honour, credits, status, conferred_on AS conferredOn,
              award_title AS awardTitle, post_nominal AS postNominal, cefr
         FROM awards WHERE user_id = ? ORDER BY level_id ASC`).bind(userId).all(),
    conn.prepare(
      `SELECT u.id, u.sequence, u.title, c.level_id AS levelId
         FROM units u JOIN courses c ON c.id = u.course_id
        ORDER BY c.level_id ASC, u.sequence ASC`).bind().all(),
    conn.prepare(
      `SELECT i.id, i.unit_id AS unitId, i.kind, i.title
         FROM learning_items i
        WHERE i.kind IN ('quiz','assignment')
        ORDER BY i.unit_id ASC, i.sequence ASC`).bind().all(),
    conn.prepare(
      `SELECT learning_item_id AS itemId, score, submitted_at AS submittedAt
         FROM quiz_attempts WHERE user_id = ? ORDER BY submitted_at ASC`).bind(userId).all(),
    conn.prepare(
      `SELECT learning_item_id AS itemId, status, grade, submitted_at AS submittedAt, graded_at AS gradedAt
         FROM assignment_submissions WHERE user_id = ? ORDER BY submitted_at ASC`).bind(userId).all(),
    // APPROVED mappings only. A proposed mapping is somebody's opinion
    // and an approved one is the College's claim; a skill profile built
    // from the first would be a claim the College has not made.
    conn.prepare(
      `SELECT learning_item_id AS itemId, skill_id AS skillId, weight
         FROM assessment_skills WHERE status = 'approved'`).bind().all(),
    conn.prepare(
      `SELECT id, level_id AS levelId, review_point AS reviewPoint, standing, note,
              computed_at AS computedAt, computed_by AS computedBy
         FROM academic_standing_reviews WHERE user_id = ?
        ORDER BY computed_at DESC`).bind(userId).all(),
    conn.prepare(
      `SELECT id, level_id AS levelId, state, outstanding, award_id AS awardId,
              assessed_on AS assessedOn, assessed_by AS assessedBy
         FROM graduation_eligibility WHERE user_id = ?`).bind(userId).all(),
  ]);

  return {
    levels: levels.results,
    enrolments: enrolments.results,
    awards: awards.results,
    units: units.results,
    items: items.results,
    quizzes: quizzes.results,
    submissions: submissions.results,
    mappings: mappings.results,
    reviews: reviews.results,
    eligibility: eligibility.results,
  };
}

// ─────────────────────────────────────────────────────────────────────
// THE MODULES OF ONE LEVEL
// ─────────────────────────────────────────────────────────────────────

/**
 * The two assessment tables as ORDERED ATTEMPT LISTS, keyed by learning
 * item — the shape countingMarkForAttempts() reads.
 *
 * They are read as lists rather than as a MAX(): `resit.cap` needs to
 * know which attempt stood, and a MAX() cannot tell a first-time 92
 * from a resit 92 that counts at 70. That distinction is the difference
 * between a Distinction and a Pass on a certificate.
 *
 * Factored out of levelModules() when functions/_lib/lms/content.js
 * stopped deciding module completion for itself. Two readings of the
 * same two tables is exactly how the platform came to hold two
 * different opinions about whether a module was finished, and one
 * function that both callers share cannot drift from itself.
 */
function attemptsByItemFrom({ quizzes = [], submissions = [] }) {
  const attemptsByItem = new Map();
  const push = (itemId, attempt) => {
    if (!attemptsByItem.has(itemId)) attemptsByItem.set(itemId, []);
    attemptsByItem.get(itemId).push(attempt);
  };
  for (const a of quizzes) push(a.itemId, { percentage: percentageFromFraction(a.score), at: a.submittedAt });
  for (const s of submissions) {
    push(s.itemId, {
      // A submission with no grade is an attempt whose mark does not
      // exist yet — null, and countingMarkForAttempts() reports it as
      // awaiting marking rather than as a fail.
      percentage: s.status === 'graded' && Number.isFinite(s.grade) ? percentageFromFraction(s.grade) : null,
      at: s.submittedAt,
    });
  }
  return attemptsByItem;
}

/**
 * One module's mark from its quiz item, its assignment item and the
 * attempts on each — `module.formula` and nothing else.
 */
function markOneModule({ unit, unitItems, attemptsByItem }) {
  const quizItem = unitItems.find((i) => i.kind === 'quiz') || null;
  const assignmentItem = unitItems.find((i) => i.kind === 'assignment') || null;

  const quiz = quizItem ? countingMarkForAttempts(attemptsByItem.get(quizItem.id) || []) : null;
  const assignment = assignmentItem ? countingMarkForAttempts(attemptsByItem.get(assignmentItem.id) || []) : null;

  return {
    unitId: unit.id,
    sequence: unit.sequence,
    title: unit.title,
    quizItemId: quizItem ? quizItem.id : null,
    assignmentItemId: assignmentItem ? assignmentItem.id : null,
    ...moduleMark({ quiz, assignment }),
  };
}

/**
 * ONE module, read from the database — the entry point
 * functions/_lib/lms/content.js calls after a quiz attempt or a graded
 * assignment, so that the row it writes into `unit_progress` says what
 * marks.js says and not what a second rule says.
 *
 * It exists because the LMS used to decide this for itself: a unit was
 * marked completed when EITHER the quiz score OR the assignment grade
 * reached `platform_config.lms_pass_threshold`, independently, with no
 * composite — recorded as `conformance.module_composite` in
 * data/academic-regulations.json, with the consequence spelled out:
 * "a learner who passes the quiz at seventy and never submits the
 * assignment has the module recorded as complete". That row is read by
 * the graduate profile, by the Institutional Metric Register's module
 * completion figure and by the engagement evidence list, so the
 * disagreement was not internal — it was published three ways.
 */
export async function moduleMarkForUnit(env, { userId, unitId }) {
  const conn = db(env);
  const [unit, items, quizzes, submissions] = await Promise.all([
    conn.prepare('SELECT id, sequence, title FROM units WHERE id = ?').bind(unitId).first(),
    conn.prepare(
      `SELECT id, unit_id AS unitId, kind FROM learning_items
        WHERE unit_id = ? AND kind IN ('quiz','assignment') ORDER BY sequence ASC`).bind(unitId).all(),
    conn.prepare(
      `SELECT a.learning_item_id AS itemId, a.score, a.submitted_at AS submittedAt
         FROM quiz_attempts a JOIN learning_items i ON i.id = a.learning_item_id
        WHERE a.user_id = ? AND i.unit_id = ? ORDER BY a.submitted_at ASC`).bind(userId, unitId).all(),
    conn.prepare(
      `SELECT s.learning_item_id AS itemId, s.status, s.grade, s.submitted_at AS submittedAt
         FROM assignment_submissions s JOIN learning_items i ON i.id = s.learning_item_id
        WHERE s.user_id = ? AND i.unit_id = ? ORDER BY s.submitted_at ASC`).bind(userId, unitId).all(),
  ]);
  if (!unit) return null;

  return markOneModule({
    unit,
    unitItems: items.results,
    attemptsByItem: attemptsByItemFrom({ quizzes: quizzes.results, submissions: submissions.results }),
  });
}

// ─────────────────────────────────────────────────────────────────────
// THE MODULES OF ONE LEVEL
// ─────────────────────────────────────────────────────────────────────

/** Every module of one level, marked under marks.js and nothing else. */
function levelModules(record, levelId) {
  const units = record.units.filter((u) => u.levelId === levelId);
  const itemsByUnit = new Map();
  for (const item of record.items) {
    if (!itemsByUnit.has(item.unitId)) itemsByUnit.set(item.unitId, []);
    itemsByUnit.get(item.unitId).push(item);
  }

  const attemptsByItem = attemptsByItemFrom({ quizzes: record.quizzes, submissions: record.submissions });

  return units.map((unit) => markOneModule({
    unit, unitItems: itemsByUnit.get(unit.id) || [], attemptsByItem,
  }));
}

/**
 * The four level skill marks.
 *
 * Every one of them is null today and the reason is recorded in the
 * instrument itself (`conformance.skill_mapping`): no assessment in the
 * curriculum carries an approved skill mapping, so nothing evidences a
 * skill, so `skill.null_blocks_conferral` refuses conferral. The
 * instrument states plainly that this is the intended behaviour and not
 * a bug — the mapping work is a precondition of the award rather than
 * an aspiration beside it.
 *
 * The examination sub-marks are null for the separate reason that no
 * examination is recorded anywhere, so even an approved mapping would
 * leave the 60 per cent half of `skill.formula` empty.
 */
function levelSkillMarks(record, levelId, modules) {
  const markByItem = new Map();
  for (const m of modules) {
    if (m.quiz && Number.isFinite(m.quiz.countingMark) && m.quizItemId) markByItem.set(m.quizItemId, m.quiz.countingMark);
    if (m.assignment && Number.isFinite(m.assignment.countingMark) && m.assignmentItemId) markByItem.set(m.assignmentItemId, m.assignment.countingMark);
  }
  const levelItemIds = new Set(modules.flatMap((m) => [m.quizItemId, m.assignmentItemId]).filter(Boolean));

  const marks = {};
  const detail = {};
  for (const skillId of SKILL_IDS) {
    const approved = record.mappings.filter((m) => m.skillId === skillId && levelItemIds.has(m.itemId));
    const mapped = approved
      .map((m) => ({ mark: markByItem.get(m.itemId), weight: m.weight }))
      .filter((m) => Number.isFinite(m.mark));
    const cwMean = courseworkSkillMean(mapped);
    const mark = skillMark({ examinationSubMark: null, courseworkMean: cwMean });
    marks[skillId] = mark;
    detail[skillId] = {
      skillId,
      mark,
      approvedMappings: approved.length,
      courseworkMean: cwMean === null ? null : roundMark(cwMean),
      examinationSubMark: null,
      state: mark === null
        ? (mapped.length ? 'examination_not_recorded' : 'no_approved_mapping')
        : 'marked',
    };
  }
  return { marks, detail };
}

// ─────────────────────────────────────────────────────────────────────
// THE GRADE POINT AVERAGE
// ─────────────────────────────────────────────────────────────────────

/**
 * The credit-weighted grade point average — cumulative and per level.
 *
 * Only awards the College has actually CONFERRED and still stands
 * enter it (`gpa.include.conferred`). Revoked, replaced, withdrawn and
 * not-conferred all contribute nothing, and none of them contributes a
 * zero (`gpa.excluded`). The Distinction of the College is excluded
 * because it carries no grade point at all: it is conferred by
 * decision, and averaging a decision into a computed figure would
 * misrepresent both.
 *
 * Weighted by `awards.credits` and never by the credits the level
 * carries today (`credit.source_of_truth`), so a certificate issued in
 * 2027 still weighs what it said it weighed if the College later
 * restructures a level.
 */
export function gradePointAverage(record) {
  const live = record.awards.filter((a) => a.status === 'conferred');
  const entries = live.map((a) => ({
    levelId: a.levelId,
    awardId: a.id,
    honour: a.honour,
    credits: a.credits,
    gradePoint: gradePointForHonour(a.honour),
    conferredOn: a.conferredOn,
  }));

  const { gpa, credits, counted } = creditWeightedGpa(entries);
  const excluded = record.awards
    .filter((a) => a.status !== 'conferred')
    .map((a) => ({ awardId: a.id, levelId: a.levelId, reason: a.status }));
  const decisionOnly = entries.filter((e) => e.gradePoint === null)
    .map((e) => ({ awardId: e.awardId, levelId: e.levelId, reason: 'conferred_by_decision_no_grade_point' }));

  return {
    // null, never 0.00. See this file's header: the two say opposite
    // things about a person.
    cumulative: gpa,
    // A figure may not outlive the scale that gives it meaning —
    // `academic_standing_reviews` enforces the pair with a CHECK.
    gradeScale: gpa === null ? null : GRADE_SCALE,
    maximum: SCALE.maximumGradePoint,
    creditsHeld: credits,
    creditsForProgramme: CREDIT.perProgramme,
    awardsCounted: counted,
    state: counted ? 'computed' : 'no_award_conferred',
    statement: counted
      ? `Credit-weighted over ${counted} conferred award${counted === 1 ? '' : 's'}, on the ${GRADE_SCALE} scale.`
      : 'No award has been conferred, so there is no grade point average. This is an absence of certification, not a mark of zero.',
    perLevel: entries.map((e) => ({
      levelId: e.levelId,
      honour: e.honour,
      gradePoint: e.gradePoint,
      credits: e.credits,
      conferredOn: e.conferredOn,
    })),
    excluded: [...excluded, ...decisionOnly],
  };
}

// ─────────────────────────────────────────────────────────────────────
// ACADEMIC STANDING
// ─────────────────────────────────────────────────────────────────────

/**
 * The standing of one learner at one level, under `standing.bands`.
 *
 * NOT decided on the grade point average, and the instrument explains
 * why it cannot be: only conferred levels carry a grade point, the
 * lowest of those is 3.00, so no learner at this College can hold an
 * average below 3.00 and a threshold on it would never fire
 * (`gpa.minimum_possible`, `standing.not_gpa`). It is decided on
 * assessment outcomes, which is the evidence that actually
 * distinguishes a learner in difficulty.
 *
 * Under Review is not a sanction and does not touch a mark, an honour,
 * an award or a learner's access to anything. It obliges the COLLEGE:
 * a tutorial offered in writing within ten working days, saying what
 * triggered the review and what would clear it, recorded whether or not
 * it is taken — "so that a learner who was never reached cannot later be
 * described as one who declined help".
 */
export function academicStandingFor(record, levelId, modules) {
  const enrolment = record.enrolments.find((e) => e.levelId === levelId) || null;

  // Every attempt that fell below the pass mark, counted once each —
  // `resit.counts_toward_standing`: two attempts at the same assessment
  // and two different assessments both mean a learner is having
  // difficulty, and in both cases the College owes them a tutorial.
  let failedAttempts = 0;
  for (const m of modules) {
    for (const component of [m.quiz, m.assignment]) {
      if (component) failedAttempts += component.failedAttempts || 0;
    }
  }

  const triggers = [
    {
      id: 'standing.trigger.two_failed_summatives',
      label: 'Two failed summative attempts within one level',
      threshold: UNDER_REVIEW_FAILED_ATTEMPTS,
      observed: failedAttempts,
      fired: failedAttempts >= UNDER_REVIEW_FAILED_ATTEMPTS,
      instrumented: true,
    },
    {
      id: 'standing.trigger.failed_examination',
      label: 'A failed level examination',
      threshold: 1,
      observed: null,
      fired: false,
      // Reported as not instrumented rather than as "did not fire".
      // On a screen those look identical and they mean opposite things.
      instrumented: false,
      note: 'No level examination is recorded by any table, so this trigger can neither fire nor be ruled out.',
    },
    {
      id: 'standing.trigger.staff_flag',
      label: 'A review flagged by academic staff, with a recorded reason',
      threshold: null,
      observed: null,
      fired: false,
      instrumented: false,
      note: 'A flag is a person\'s act with a recorded reason, read from academic_standing_reviews rather than computed.',
    },
    {
      id: 'standing.trigger.integrity_matter',
      label: 'An integrity matter opened under the misconduct procedure',
      threshold: null,
      observed: null,
      fired: false,
      instrumented: false,
      // registrar_cases holds appeals, complaints, withdrawals,
      // deferrals and transfers, and leaves misconduct out on purpose.
      // There is no table for a program to read this from, and there
      // should not be one it can decide from.
      note: 'Misconduct is deliberately not a registrar_cases kind. Suspended Progression is recorded by a person under the procedure, never computed.',
    },
  ];

  // The most recent stored review for this level. A standing a PERSON
  // recorded outranks anything a sweep computes: suspended progression
  // and the staff flag are both human judgements, and a nightly job
  // that quietly cleared one would be the platform overruling the
  // College.
  const stored = record.reviews.filter((r) => r.levelId === levelId)[0] || null;
  const humanHold = stored && stored.computedBy && stored.standing !== STANDING_BANDS.good ? stored : null;
  if (humanHold) {
    const trigger = triggers.find((t) => t.id === (humanHold.standing === STANDING_BANDS.suspended
      ? 'standing.trigger.integrity_matter' : 'standing.trigger.staff_flag'));
    if (trigger) { trigger.fired = true; trigger.observed = humanHold.reviewPoint; }
  }

  const computed = triggers.some((t) => t.fired && t.instrumented) ? STANDING_BANDS.underReview : STANDING_BANDS.good;
  const standing = humanHold ? humanHold.standing : computed;

  const notes = [];
  if (humanHold) notes.push(humanHold.note);
  if (computed === STANDING_BANDS.underReview) {
    notes.push(`${failedAttempts} assessment attempts at this level fell below the pass mark of ${SCALE.passMark}%. Under Review triggers a tutorial, not a sanction: it affects no mark, no honour, no award and no access.`);
  }

  return {
    levelId,
    enrolmentId: enrolment ? enrolment.id : null,
    standing,
    // The College's obligations, carried with the standing so that a
    // screen showing the band also shows what is owed.
    obligations: standing === STANDING_BANDS.good ? [] : obligationsFor(standing),
    isASanction: false,
    affectsAccess: false,
    failedAttempts,
    triggers,
    recordedBy: humanHold ? 'staff' : 'platform',
    note: notes.length ? notes.join(' ') : null,
    statement: standing === STANDING_BANDS.good
      ? 'Requirements met, nothing outstanding.'
      : notes.join(' '),
  };
}

/** `standing.bands[].obliges_the_college`, verbatim in substance. */
function obligationsFor(standing) {
  if (standing === STANDING_BANDS.underReview) {
    return [
      'Offer a tutorial with a member of academic staff, in writing, within 10 working days of the trigger.',
      'State in that offer what triggered the review and what would clear it.',
      'Record the offer whether or not the learner takes it.',
      'Clear the standing when the outstanding assessment is passed or the flag is lifted with a recorded reason.',
    ];
  }
  if (standing === STANDING_BANDS.suspended) {
    return [
      'Put the allegation to the learner in writing before any finding, and hear the reply.',
      'Reach a first-instance decision within 20 working days of opening the matter; the suspension lapses automatically if it does not.',
      'Leave every route to appeal open, each stage decided by somebody who was not part of the last one.',
      'Continue access to teaching, the library and support throughout.',
    ];
  }
  return [];
}

// ─────────────────────────────────────────────────────────────────────
// THE CONDITIONS — progression and graduation, named one by one
// ─────────────────────────────────────────────────────────────────────

/**
 * One condition, in the shape a UI can render without deciding
 * anything: `met` is true, false, or null.
 *
 * NULL IS NOT FALSE, and keeping the third state is the point of this
 * shape. `met: false` says the learner has not met a condition;
 * `met: null` says nobody can tell yet, usually because the College has
 * not built the thing that would record it. Collapsing the two would
 * put the platform's unfinished work on the learner's record as their
 * shortfall.
 */
function condition(id, label, met, detail, owner = 'learner') {
  return { id, label, met, detail, owner };
}

/**
 * Every condition of a level award, with whether each is met.
 *
 * The six gates of `level_mark.gates` plus the Pass floor and the skill
 * rule, which is exactly `grad.level_award.all_of` — "all of these and
 * nothing beyond them. There is no attendance requirement, no
 * participation mark, no final discretion and no condition that appears
 * at the end."
 *
 * `owner` on each condition is the half a boolean cannot carry: whether
 * the outstanding work is the learner's or the College's. A learner
 * whose ten modules are complete and whose award waits on an
 * examination the platform does not record has done everything asked of
 * them, and must not read a screen that implies otherwise.
 */
export function levelConditions(record, levelId, modules, skills, mark, honour) {
  const complete = modules.filter((m) => m.state === 'marked' && m.complete).length;
  const expected = WEIGHTS.modulesPerLevel;
  const found = modules.length;
  const enrolment = record.enrolments.find((e) => e.levelId === levelId) || null;

  const missingSkills = SKILL_IDS.filter((id) => !Number.isFinite(skills.marks[id]));

  return [
    condition(
      'level.gate.modules_complete',
      LEVEL_GATES[0].label,
      found === 0 ? null : complete === found && found === expected,
      found === 0
        ? 'No modules are authored for this level yet.'
        : `${complete} of ${found} modules complete${found === expected ? '' : ` (the regulations expect ${expected})`}.`,
      found === expected ? 'learner' : 'college',
    ),
    condition(
      'level.gate.examination_overall',
      LEVEL_GATES[1].label,
      null,
      'No level examination is recorded by any table, so this cannot yet be judged either way.',
      'college',
    ),
    condition('level.gate.examination_criterion_floor', LEVEL_GATES[2].label, null,
      'Recorded nowhere: the examination has no rubric criteria in the schema.', 'college'),
    condition('level.gate.examination_skill_floor', LEVEL_GATES[3].label, null,
      'Recorded nowhere: the examination has no skill sub-marks in the schema.', 'college'),
    condition('level.gate.spoken_paper', LEVEL_GATES[4].label, null,
      'Recorded nowhere: no table records a spoken paper being sat and marked.', 'college'),
    condition(
      'level.gate.staff_confirmation',
      LEVEL_GATES[5].label,
      enrolment ? enrolment.status === 'completed' : null,
      enrolment
        ? (enrolment.status === 'completed'
          ? `Confirmed on ${enrolment.completedAt}.`
          : 'A member of academic staff has not yet confirmed this level is finished.')
        : 'There is no enrolment at this level.',
      'college',
    ),
    condition(
      'honour.pass',
      `A level mark of at least ${SCALE.passMark}% with no skill below ${HONOURS[0].skillFloor}%`,
      Number.isFinite(mark.mark) ? Boolean(honour.honour) : null,
      Number.isFinite(mark.mark)
        ? `Level mark ${mark.mark}%.`
        : 'The level mark cannot be computed yet, so no honour can be judged.',
      // Whose outstanding work this is depends on why it is
      // outstanding. A level mark that exists and falls short is the
      // learner's; a level mark that cannot be computed because no
      // examination is recorded is the College's, and reporting it
      // against the learner would put the platform's unfinished work on
      // their record.
      Number.isFinite(mark.mark) ? 'learner' : 'college',
    ),
    condition(
      'skill.null_blocks_conferral',
      'A mark for every one of the four skills',
      missingSkills.length === 0,
      missingSkills.length
        ? `${missingSkills.length} of ${SKILL_IDS.length} skills have no mark. No assessment carries an approved skill mapping, so no skill can be evidenced.`
        : 'All four skills carry a mark.',
      'college',
    ),
  ];
}

/**
 * A learner's position against one level award, as a structure rather
 * than a verdict.
 *
 * The four states are `graduation_eligibility`'s own, and the boundary
 * between two of them is the honest one this platform can draw today:
 *
 *   not_eligible — at least one condition the LEARNER must meet is
 *                  unmet. Work remains, and it is theirs.
 *   conditional  — everything the learner owes is met, and what remains
 *                  is a record the COLLEGE has not made. Nobody should
 *                  read "not eligible" for the platform's unfinished
 *                  work: today that is four examination gates and the
 *                  skill mappings, none of which any learner can act on.
 *   eligible     — every condition met.
 *   conferred    — the register holds the award, which is the Graduate
 *                  Register's act and not this file's.
 *
 * The boundary is drawn on WHOSE condition is outstanding, not on
 * whether it is false or merely unknown. Both of those are things the
 * learner cannot finish; only one of them is about them.
 */
export function graduationPosition(record, levelId, conditions) {
  const award = record.awards.find((a) => a.levelId === levelId && a.status === 'conferred') || null;
  const outstandingConditions = conditions.filter((c) => c.met !== true);
  const learnerOwes = outstandingConditions.filter((c) => c.owner === 'learner');

  let state;
  if (award) state = 'conferred';
  else if (learnerOwes.length) state = 'not_eligible';
  else if (outstandingConditions.length) state = 'conditional';
  else state = 'eligible';

  const outstanding = outstandingConditions.map((c) => `${c.label} — ${c.detail}`);

  return {
    levelId,
    state,
    // Required by `graduation_eligibility` wherever the state is not
    // eligible or conferred, and required by decency everywhere else.
    outstanding: outstanding.length ? outstanding.join(' · ') : null,
    outstandingConditions,
    learnerOwes,
    metConditions: conditions.filter((c) => c.met === true),
    conditions,
    awardId: award ? award.id : null,
    awardTitle: award ? award.awardTitle : null,
    postNominal: award ? award.postNominal : null,
    conferredOn: award ? award.conferredOn : null,
    regulationVersion: REGULATION_VERSION,
  };
}

/**
 * Whether the next level may open — `prog.requirements`.
 *
 * The same set that confers the award, deliberately: progression and
 * conferral are one event with two records. "Two different standards
 * for 'finished' would eventually put a learner in Level IV without a
 * Level III award."
 */
export function progressionPosition(record, levelId, position) {
  const nextLevelId = levelId + 1;
  const hasNext = PROGRESSION.levels.includes(nextLevelId);
  const alreadyEnrolled = record.enrolments.some((e) => e.levelId === nextLevelId && e.status !== 'withdrawn');
  const standing = record.reviews.filter((r) => r.levelId === levelId)[0] || null;
  const suspended = standing && standing.standing === STANDING_BANDS.suspended;

  return {
    fromLevelId: levelId,
    nextLevelId: hasNext ? nextLevelId : null,
    // The programme's own end, not a refusal: the sixth level award IS
    // completion of the IEFC (`grad.programme`).
    isFinalLevel: !hasNext,
    alreadyOpen: alreadyEnrolled,
    mayProgress: hasNext ? (position.state === 'conferred' || position.state === 'eligible') && !suspended : false,
    // `prog.paused_while_suspended`: progression pauses, access does
    // not. Learning is never the thing withdrawn.
    pausedBySuspension: Boolean(suspended),
    conditions: position.conditions,
    outstanding: position.outstanding,
    statement: !hasNext
      ? 'This is the final level of the programme; there is no level after it.'
      : (alreadyEnrolled
        ? `Level ${nextLevelId} is already open.`
        : `Level ${nextLevelId} opens when this level is completed and its award conferred.`),
  };
}

// ─────────────────────────────────────────────────────────────────────
// THE WHOLE PICTURE
// ─────────────────────────────────────────────────────────────────────

/**
 * Everything the measurement engine can say about one learner.
 *
 * Session-derived callers only — `userId` is never taken from a request
 * parameter anywhere in the platform (see
 * functions/api/student/dashboard.js for the rule and why).
 */
export async function computeLearnerStanding(env, userId) {
  if (typeof userId !== 'string' || !userId) {
    throw new ValidationError('A learner id is required.', { userId: 'Required' });
  }
  const record = await readAcademicRecord(env, userId);
  const computedAt = nowIso();

  // Every level the learner has any relationship with, in order. Not
  // every level of the programme: a learner enrolled at Level I is not
  // "not eligible" for Level VI, they simply have not reached it, and
  // publishing five refusals against their name would be a report of
  // the College's structure dressed as a report of their performance.
  const levelIds = [...new Set([
    ...record.enrolments.map((e) => e.levelId),
    ...record.awards.map((a) => a.levelId),
  ])].sort((a, b) => a - b);

  const levels = levelIds.map((levelId) => {
    const enrolment = record.enrolments.find((e) => e.levelId === levelId) || null;
    const modules = levelModules(record, levelId);
    const skills = levelSkillMarks(record, levelId, modules);
    const mark = levelMark({ examination: null, modules });
    const honour = honourFor({
      levelMark: mark.mark,
      skillMarks: skills.marks,
      examinationResat: mark.examinationResat,
    });
    const conditions = levelConditions(record, levelId, modules, skills, mark, honour);
    const position = graduationPosition(record, levelId, conditions);

    const marked = modules.filter((m) => m.state === 'marked');
    const complete = marked.filter((m) => m.complete);

    // Read from programme_levels, not from the enrolment. A learner can
    // hold an award at a level whose enrolment row was withdrawn and
    // re-made, or hold one with no enrolment row at all after a
    // placement; a level card headed "null" is the visible half of
    // deriving a level's name from the wrong table.
    const meta = record.levels.find((l) => l.levelId === levelId) || null;

    return {
      levelId,
      roman: meta ? meta.roman : null,
      name: meta ? meta.name : null,
      cefr: meta ? meta.cefr : null,
      enrolment: enrolment
        ? { id: enrolment.id, status: enrolment.status, startedAt: enrolment.startedAt, completedAt: enrolment.completedAt }
        : null,
      modules: modules.map((m) => ({
        unitId: m.unitId,
        sequence: m.sequence,
        title: m.title,
        state: m.state,
        mark: m.mark,
        grade: m.grade,
        complete: m.complete,
        resat: m.resat,
        componentsMissing: m.componentsMissing,
        quiz: m.quiz,
        assignment: m.assignment,
      })),
      moduleSummary: {
        authored: modules.length,
        expected: WEIGHTS.modulesPerLevel,
        marked: marked.length,
        complete: complete.length,
        // A proportion, 0..1, the same convention competency_marks and
        // quiz_attempts use — so no reader has to ask whether a number
        // is a fraction or a percent.
        completion: modules.length ? complete.length / modules.length : null,
      },
      levelMark: mark,
      skills: SKILL_IDS.map((id) => skills.detail[id]),
      honour,
      standing: academicStandingFor(record, levelId, modules),
      graduation: position,
      progression: progressionPosition(record, levelId, position),
      creditsIfConferred: CREDIT.perLevel,
    };
  });

  const gpa = gradePointAverage(record);
  const levelsHeld = record.awards.filter((a) => a.status === 'conferred').map((a) => a.levelId).sort((a, b) => a - b);
  const active = record.enrolments.find((e) => e.status === 'active') || null;
  const currentLevel = active ? levels.find((l) => l.levelId === active.levelId) || null : null;

  return {
    userId,
    computedAt,
    regulationVersion: REGULATION_VERSION,
    gradeScale: GRADE_SCALE,
    gpa,
    levels,
    // The standing a screen shows first: the one for the level the
    // learner is actually working at. Null rather than "in good
    // standing" when there is no live enrolment — standing is decided
    // per enrolment, and a learner with none has nothing to be in good
    // standing about.
    standing: currentLevel ? currentLevel.standing : null,
    progression: currentLevel ? currentLevel.progression : null,
    programme: {
      code: 'IEFC',
      levelsHeld,
      levelsRequired: PROGRESSION.levels,
      creditsHeld: gpa.creditsHeld,
      creditsRequired: CREDIT.perProgramme,
      complete: PROGRESSION.levels.every((id) => levelsHeld.includes(id)),
      outstandingLevels: PROGRESSION.levels.filter((id) => !levelsHeld.includes(id)),
      statement: levelsHeld.length
        ? `${levelsHeld.length} of ${PROGRESSION.levels.length} level awards held, ${gpa.creditsHeld} of ${CREDIT.perProgramme} credits.`
        : 'No level award has been conferred yet. The programme is complete when all six are held.',
    },
    // Said once, plainly, so a caller never has to infer it from an
    // empty array or a null.
    hasMarks: levels.some((l) => l.modules.some((m) => m.state !== 'not_attempted' && m.state !== 'not_assessable')),
  };
}

// ─────────────────────────────────────────────────────────────────────
// PERSISTENCE
// ─────────────────────────────────────────────────────────────────────

/**
 * Freeze a standing into `academic_standing_reviews` at a named review
 * point.
 *
 * A REVIEW POINT IS AN ACT OF THE COLLEGE, NOT A PAGE LOAD. This is
 * deliberately not called by GET /api/student/standing: a learner
 * refreshing their record would otherwise mint review rows, and the
 * table's whole purpose is that a standing was computed once, on a
 * stated occasion, from counts frozen at that moment — the same
 * argument `issued_documents.payload_json` makes.
 *
 * `regulation_version` travels with it because regulations change, and
 * a standing that cannot say which rules produced it cannot be defended
 * to the learner it was decided about.
 *
 * A row a PERSON recorded is never overwritten by the platform. A
 * suspension or a staff flag is a judgement, and a sweep that quietly
 * cleared one would be the software overruling the College.
 */
export async function recordStandingReview(env, { userId, levelId, reviewPoint, computedBy = null, note = null }) {
  const fields = {};
  if (typeof userId !== 'string' || !userId) fields.userId = 'Required';
  if (!Number.isInteger(levelId) || !PROGRESSION.levels.includes(levelId)) fields.levelId = `Must be one of ${PROGRESSION.levels.join(', ')}`;
  if (typeof reviewPoint !== 'string' || !reviewPoint.trim()) fields.reviewPoint = 'Required — a named occasion, so two learners reviewed a week apart are comparable';
  if (Object.keys(fields).length) throw new ValidationError('The standing review could not be recorded.', fields);

  const existing = await db(env)
    .prepare('SELECT id, computed_by AS computedBy FROM academic_standing_reviews WHERE user_id = ? AND level_id = ? AND review_point = ?')
    .bind(userId, levelId, reviewPoint)
    .first();
  if (existing && existing.computedBy && !computedBy) {
    return { id: existing.id, written: false, reason: 'a person recorded this review point; the platform does not overwrite it' };
  }

  const report = await computeLearnerStanding(env, userId);
  const level = report.levels.find((l) => l.levelId === levelId) || null;
  if (!level) {
    throw new ValidationError('That learner has no enrolment or award at that level, so there is no standing to record.', { levelId: 'No record at this level' });
  }

  const standing = level.standing.standing;
  // The table refuses a non-good standing with no note, and it is right
  // to: "a tutorial nobody can explain the reason for is a summons."
  const resolvedNote = note || level.standing.note;
  if (standing !== STANDING_BANDS.good && !resolvedNote) {
    throw new ValidationError('A standing other than good standing must carry the reason for it.', { note: 'Required' });
  }

  // The counts the standing was read from, frozen — not a cache of the
  // current truth but the record of what was true on the day.
  const basis = {
    regulationVersion: REGULATION_VERSION,
    gradeScale: report.gpa.cumulative === null ? null : GRADE_SCALE,
    modules: level.moduleSummary,
    failedAttempts: level.standing.failedAttempts,
    triggers: level.standing.triggers,
    levelMarkState: level.levelMark.state,
    honour: level.honour.honour ? level.honour.honour.code : null,
    gpa: report.gpa.cumulative,
    creditsHeld: report.gpa.creditsHeld,
    graduationState: level.graduation.state,
  };

  const id = existing ? existing.id : newId('asr');
  const computedAt = nowIso();
  const params = [
    standing,
    report.gpa.cumulative,
    report.gpa.cumulative === null ? null : GRADE_SCALE,
    level.moduleSummary.completion,
    REGULATION_VERSION,
    JSON.stringify(basis),
    computedAt,
    computedBy,
    resolvedNote,
  ];

  if (existing) {
    await db(env).prepare(
      `UPDATE academic_standing_reviews
          SET standing = ?, grade_point_average = ?, grade_scale = ?, completion = ?,
              regulation_version = ?, basis_json = ?, computed_at = ?, computed_by = ?, note = ?
        WHERE id = ?`).bind(...params, id).run();
  } else {
    await db(env).prepare(
      `INSERT INTO academic_standing_reviews
         (id, user_id, enrolment_id, level_id, review_point, standing, grade_point_average, grade_scale,
          completion, regulation_version, basis_json, computed_at, computed_by, note)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`)
      .bind(id, userId, level.standing.enrolmentId, levelId, reviewPoint, ...params).run();
  }

  return { id, written: true, standing, reviewPoint, regulationVersion: REGULATION_VERSION, basis };
}

/**
 * Freeze a graduation position into `graduation_eligibility`.
 *
 * Separate from conferral on purpose: eligibility is an academic
 * judgement about one learner against one level and is true whether or
 * not a ceremony is ever held. The award itself exists only when the
 * Graduate Register writes it, with a holder, a date and a verification
 * code (`grad.registry_act`) — so this function never sets `award_id`
 * and never claims a conferral the register does not hold.
 *
 * A row a member of staff assessed is not overwritten by the platform,
 * and a conferred row is never downgraded by a later sweep: the
 * register is the authority on what has been conferred.
 */
export async function recordGraduationEligibility(env, { userId, levelId, assessedBy = null }) {
  const fields = {};
  if (typeof userId !== 'string' || !userId) fields.userId = 'Required';
  if (!Number.isInteger(levelId) || !PROGRESSION.levels.includes(levelId)) fields.levelId = `Must be one of ${PROGRESSION.levels.join(', ')}`;
  if (Object.keys(fields).length) throw new ValidationError('The graduation eligibility could not be recorded.', fields);

  const report = await computeLearnerStanding(env, userId);
  const level = report.levels.find((l) => l.levelId === levelId) || null;
  if (!level) {
    throw new ValidationError('That learner has no enrolment or award at that level.', { levelId: 'No record at this level' });
  }

  const existing = await db(env)
    .prepare('SELECT id, state, assessed_by AS assessedBy FROM graduation_eligibility WHERE user_id = ? AND level_id = ?')
    .bind(userId, levelId)
    .first();
  if (existing && existing.state === 'conferred') {
    return { id: existing.id, written: false, reason: 'the award is conferred; the register is the authority on that' };
  }
  if (existing && existing.assessedBy && !assessedBy) {
    return { id: existing.id, written: false, reason: 'a person assessed this eligibility; the platform does not overwrite it' };
  }

  const position = level.graduation;
  const id = existing ? existing.id : newId('gel');
  const assessedOn = nowIso();
  const enrolmentId = level.enrolment ? level.enrolment.id : null;

  // Set only when the register already holds the award. The FK and the
  // table's own CHECK mean eligibility can never claim a conferral the
  // register does not hold, and this is the line that honours that.
  const awardId = position.state === 'conferred' ? position.awardId : null;

  if (existing) {
    await db(env).prepare(
      `UPDATE graduation_eligibility
          SET state = ?, outstanding = ?, enrolment_id = ?, award_id = ?, assessed_on = ?, assessed_by = ?, regulation_version = ?
        WHERE id = ?`)
      .bind(position.state, position.outstanding, enrolmentId, awardId, assessedOn, assessedBy, REGULATION_VERSION, id).run();
  } else {
    await db(env).prepare(
      `INSERT INTO graduation_eligibility
         (id, user_id, level_id, enrolment_id, state, outstanding, award_id, assessed_on, assessed_by, regulation_version)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`)
      .bind(id, userId, levelId, enrolmentId, position.state, position.outstanding, awardId, assessedOn, assessedBy, REGULATION_VERSION).run();
  }

  return { id, written: true, state: position.state, outstanding: position.outstanding, regulationVersion: REGULATION_VERSION };
}
