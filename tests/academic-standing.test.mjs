// Run with: node --experimental-sqlite tests/academic-standing.test.mjs
//
// THE MEASUREMENT ENGINE, EXERCISED AGAINST THE INSTRUMENT ITSELF.
//
// Two failures this file exists to make impossible.
//
// THE FIRST IS DRIFT. functions/_lib/academic/marks.js transcribes the
// weights, thresholds, floors and rounding rules of
// data/academic-regulations.json rather than importing them, for a
// reason stated in full at the top of that file: Node 22 accepts only
// `with { type: 'json' }` on a JSON import and the esbuild that
// wrangler 3 bundles Pages Functions with accepts only `assert`, so no
// spelling of the import runs in both places. A transcription nothing
// checks is a second source of truth waiting to disagree with the
// first — so § 1 below reads the instrument off disk and pins every
// transcribed constant to it. Change a number in the JSON without
// changing the engine and this file fails.
//
// THE SECOND IS THE ZERO. A learner with no marks yet must get a
// well-formed answer that SAYS SO — never a grade point average of
// 0.00, which is a statement about performance where the truth is an
// absence of certification. It is asserted here more ways than
// anything else in the file, because it is the assertion the whole
// engine is built around.
import { readFileSync } from 'node:fs';
import { makeD1 } from './d1-shim.mjs';
import { ROOT, loadUrl } from './helpers.mjs';

const schema = readFileSync(`${ROOT}/sql/schema.sql`, 'utf8');
const env = { DB: makeD1(schema) };
const db = env.DB;

const J = JSON.parse(readFileSync(`${ROOT}/data/academic-regulations.json`, 'utf8'));

const marks = await import(loadUrl('functions/_lib/academic/marks.js'));
const standing = await import(loadUrl('functions/_lib/academic/standing.js'));
const { onRequestGet: standingEndpoint } = await import(loadUrl('functions/api/student/standing.js'));

let pass = 0, fail = 0;
function check(label, cond, detail) {
  console.log((cond ? 'PASS ' : 'FAIL ') + label + (cond || detail === undefined ? '' : ` — ${detail}`));
  cond ? pass++ : fail++;
}

// ─────────────────────────────────────────────────────────────────────
// 1 · THE TRANSCRIPTION IS PINNED TO THE INSTRUMENT
// ─────────────────────────────────────────────────────────────────────
check('instrument version matches data/academic-regulations.json',
  marks.INSTRUMENT.version === J.instrument.version, marks.INSTRUMENT.version);
check('the regulation version stamped on every stored record names the instrument and its version',
  marks.REGULATION_VERSION === `${J.instrument.id}@${J.instrument.version}`, marks.REGULATION_VERSION);

check('rounding: half up, two places for a mark, two for a GPA, one for display',
  marks.ROUNDING.method === J.rounding.method.value
  && marks.ROUNDING.markDecimalPlaces === J.rounding.mark_decimal_places.value
  && marks.ROUNDING.gpaDecimalPlaces === J.rounding.gpa_decimal_places.value
  && marks.ROUNDING.displayDecimalPlaces === J.rounding.display_decimal_places.value);

check('scale: pass mark, distinction threshold, maxima',
  marks.SCALE.passMark === J.marking_scale.pass_mark.value
  && marks.SCALE.distinctionThreshold === J.marking_scale.distinction_threshold.value
  && marks.SCALE.maximumMark === J.marking_scale.maximum_mark.value
  && marks.SCALE.maximumGradePoint === J.marking_scale.maximum_grade_point.value);

check('the five bands match the instrument, letter for letter and point for point',
  JSON.stringify(marks.SCALE.bands.map((b) => [b.id, b.letter, b.from, b.toExclusive, b.gradePoint]))
  === JSON.stringify(J.marking_scale.bands.map((b) => [b.id, b.letter, b.from, b.to_exclusive, b.grade_point])));

check('a mark below the pass mark carries a NULL grade point, not 0.00',
  marks.SCALE.bands.find((b) => b.letter === 'F').gradePoint === null
  && J.marking_scale.sub_pass_grade_point.value === null);

// THE PASS MARK EXISTS IN TWO FILES AND MUST NEVER HOLD TWO VALUES.
//
// `platform_config.lms_pass_threshold` is the older of the two — a
// fraction, seeded at 0.7, and until 20 August 2026 the only pass rule
// the LMS applied. functions/_lib/lms/content.js now asks marks.js
// instead, so the config key no longer DECIDES anything; but the
// regulations deliberately keep it ("the key stays in configuration so
// that changing it remains a recorded decision"), and two pages —
// /students/assessment/ and its Arabic edition — still publish the
// figure by reading it at build time through scripts/build-students.js.
//
// So it is a mirror, and an unwatched mirror is just a second source of
// truth with a delay on it. This holds the two identical, in the units
// each is written in: a fraction of one against a percentage of a
// hundred. Change either without the other and the build stops here
// rather than on a page quoting a pass mark the engine does not use.
{
  const configured = Number(JSON.parse(
    db.prepare("SELECT value FROM platform_config WHERE key = 'lms_pass_threshold'").bind().first().value));
  check('platform_config.lms_pass_threshold mirrors the adopted pass mark exactly',
    Math.round(configured * 100) === J.marking_scale.pass_mark.value
    && Math.round(configured * 100) === marks.SCALE.passMark,
    `config ${configured} → ${configured * 100}%, instrument ${J.marking_scale.pass_mark.value}%`);
}

{
  const quiz = J.module_mark.components.find((c) => c.id === 'module.component.quiz');
  const assignment = J.module_mark.components.find((c) => c.id === 'module.component.assignment');
  const exam = J.level_mark.components.find((c) => c.id === 'level.component.examination');
  const coursework = J.level_mark.components.find((c) => c.id === 'level.component.coursework');
  check('module composition is 30 quiz / 70 assignment, as published',
    marks.WEIGHTS.module.quiz === quiz.weight && marks.WEIGHTS.module.assignment === assignment.weight);
  check('level composition is 60 examination / 40 coursework, as published',
    marks.WEIGHTS.level.examination === exam.weight && marks.WEIGHTS.level.coursework === coursework.weight);
  check('ten modules to a level', marks.WEIGHTS.modulesPerLevel === coursework.module_count);
}

check('the four honours match the instrument on both conditions',
  JSON.stringify(marks.HONOURS.map((h) => [h.id, h.code, h.overallThreshold, h.skillFloor, h.gradePoint, h.letter]))
  === JSON.stringify(J.classification.honours.map((h) => [h.id, h.code, h.overall_threshold, h.skill_floor, h.grade_point, h.letter])));

check('the Distinction of the College is named but is NOT in the computable ladder',
  marks.COLLEGE_DISTINCTION_CODE === J.classification.college_distinction.code
  && !marks.HONOURS.some((h) => h.code === marks.COLLEGE_DISTINCTION_CODE)
  && J.classification.college_distinction.computable === false);

check('credit values match',
  marks.CREDIT.perModule === J.credit.credits_per_module.value
  && marks.CREDIT.perLevel === J.credit.credits_per_level.value
  && marks.CREDIT.perProgramme === J.credit.credits_per_programme.value
  && marks.CREDIT.notionalHoursPerCredit === J.credit.notional_hours_per_credit.value);

check('resit rules match: two resits, three sittings, capped at the pass mark, fourteen days apart',
  marks.RESIT.resitsPerAssessment === J.reassessment.attempts_per_assessment.value
  && marks.RESIT.totalAttempts === J.reassessment.attempts_per_assessment.total_attempts
  && marks.RESIT.markCap === J.reassessment.mark_cap.value
  && marks.RESIT.minimumIntervalDays === J.reassessment.minimum_interval_days.value);

check('the six level gates are the six the instrument names, in order',
  JSON.stringify(marks.LEVEL_GATES.map((g) => g.id)) === JSON.stringify(J.level_mark.gates.map((g) => g.id)));

check('graduation requires exactly the gates plus Pass plus a mark for every skill',
  J.graduation.level_award.all_of.every((id) => marks.LEVEL_GATES.some((g) => g.id === id)
    || id === 'honour.pass' || id === 'skill.null_blocks_conferral'));

check('Under Review fires at two failed summative attempts, as published',
  marks.UNDER_REVIEW_FAILED_ATTEMPTS
  === J.standing.bands.find((b) => b.code === 'under_review').triggers
    .find((t) => t.id === 'standing.trigger.two_failed_summatives').value);

check('the four skills are the four the instrument names',
  JSON.stringify(marks.SKILL_IDS) === JSON.stringify(J.skill_marks.skills.map((s) => s.id)));

check('a level is repeated after a third failure at one assessment',
  marks.PROGRESSION.repeatAfterFailedAttempts === J.progression.repeat_after_third_failure.value);

// The three standing values are the schema's, not the JSON's: the
// instrument writes the first band `good_standing` and the column CHECK
// spells it `in_good_standing`. Pinning to the CHECK is what keeps a
// write from being refused at run time.
{
  const checkClause = schema.match(/standing\s+TEXT NOT NULL CHECK \(standing IN\s*\(([^)]*)\)/);
  const allowed = checkClause ? checkClause[1].match(/'([a-z_]+)'/g).map((s) => s.replace(/'/g, '')) : [];
  check('the three standing values are exactly what academic_standing_reviews will accept',
    allowed.length === 3 && Object.values(marks.STANDING_BANDS).every((v) => allowed.includes(v)),
    allowed.join(', '));
}

// ─────────────────────────────────────────────────────────────────────
// 2 · ROUNDING — the one place, and the case that proves it
// ─────────────────────────────────────────────────────────────────────
check('69.995 rounds to 70.00 and passes — the instrument\'s own worked example',
  marks.roundMark(69.995) === 70 && marks.meetsThreshold(69.995, 70));
check('the naive Math.round(v*100)/100 loses the half at 64.085, which is why rounding is not written that way here',
  Math.round(64.085 * 100) / 100 === 64.08 && marks.roundMark(64.085) === 64.09);
check('69.994 does not reach the pass mark — no discretionary uplift',
  marks.roundMark(69.994) === 69.99 && marks.meetsThreshold(69.994, 70) === false);
check('a mark displays to one place and stores to two',
  marks.displayMark(85.24) === 85.2 && marks.roundMark(85.244) === 85.24);
check('a fraction becomes a percentage exactly once', marks.percentageFromFraction(0.7) === 70);
check('null in, null out — an absent mark is never converted into a zero',
  marks.percentageFromFraction(null) === null && marks.roundMark(null) === null && marks.gradeFor(null) === null);

// ─────────────────────────────────────────────────────────────────────
// 3 · THE GRADE LOOKUP
// ─────────────────────────────────────────────────────────────────────
check('94.00 is an A at 4.00', marks.gradeFor(94).letter === 'A' && marks.gradeFor(94).gradePoint === 4);
check('88.00 is an A− at 3.70', marks.gradeFor(88).letter === 'A−' && marks.gradeFor(88).gradePoint === 3.7);
check('80.00 is a B+ at 3.30', marks.gradeFor(80).letter === 'B+' && marks.gradeFor(80).gradePoint === 3.3);
check('70.00 is a B at 3.00 — the lowest conferred grade point is a B, not a C',
  marks.gradeFor(70).letter === 'B' && marks.gradeFor(70).gradePoint === 3);
check('69.99 is an F carrying NO grade point',
  marks.gradeFor(69.99).letter === 'F' && marks.gradeFor(69.99).gradePoint === null && marks.gradeFor(69.99).passed === false);

// ─────────────────────────────────────────────────────────────────────
// 4 · ATTEMPTS — the five awkward cases
// ─────────────────────────────────────────────────────────────────────
{
  const none = marks.countingMarkForAttempts([]);
  check('no attempt yet: counting mark is null and the state says so — NOT zero',
    none.state === 'not_attempted' && none.countingMark === null && none.achievedMark === null);
  check('no attempt yet: all three sittings remain', none.attemptsRemaining === 3);

  const first = marks.countingMarkForAttempts([{ percentage: 92, at: '2026-01-01T00:00:00Z' }]);
  check('passed first time: the mark stands uncapped',
    first.state === 'marked' && first.countingMark === 92 && first.passed === true && first.capped === false && first.resat === false);

  const resat = marks.countingMarkForAttempts([
    { percentage: 55, at: '2026-01-01T00:00:00Z' },
    { percentage: 92, at: '2026-02-01T00:00:00Z' },
  ]);
  check('a resit counts at the pass mark while the record keeps what was achieved',
    resat.state === 'marked' && resat.countingMark === 70 && resat.achievedMark === 92 && resat.capped === true && resat.resat === true);
  check('a resit records the failed attempt that preceded it', resat.failedAttempts === 1);

  const resatShort = marks.countingMarkForAttempts([
    { percentage: 55, at: '2026-01-01T00:00:00Z' },
    { percentage: 60, at: '2026-02-01T00:00:00Z' },
  ]);
  check('a resit that is still short counts at what it was — the cap is a ceiling, never a lift',
    resatShort.countingMark === 60 && resatShort.capped === false && resatShort.passed === false);

  const resatBoundary = marks.countingMarkForAttempts([
    { percentage: 55, at: '2026-01-01T00:00:00Z' },
    { percentage: 69.996, at: '2026-02-01T00:00:00Z' },
  ]);
  check('a resit that rounds up to the pass mark is carried unrounded, not lifted to 70',
    resatBoundary.countingMark === 69.996 && resatBoundary.capped === false && resatBoundary.passed === true);

  const later = marks.countingMarkForAttempts([
    { percentage: 74, at: '2026-01-01T00:00:00Z' },
    { percentage: 96, at: '2026-02-01T00:00:00Z' },
  ]);
  check('an assessment already passed is not being resat: the first mark stands and nothing is capped',
    later.countingMark === 74 && later.achievedMark === 96 && later.resat === false && later.capped === false);

  const belowPass = marks.countingMarkForAttempts([{ percentage: 57.14, at: '2026-01-01T00:00:00Z' }]);
  check('a component below seventy still carries a mark — there is no floor on a module component',
    belowPass.state === 'marked' && belowPass.countingMark === 57.14 && belowPass.passed === false);

  const unmarked = marks.countingMarkForAttempts([{ percentage: null, at: '2026-03-01T00:00:00Z' }]);
  check('submitted and not marked: awaiting marking, and it is not a fail',
    unmarked.state === 'awaiting_marking' && unmarked.countingMark === null && unmarked.achievedMark === null);

  const failed = marks.countingMarkForAttempts([
    { percentage: 40, at: '2026-01-01T00:00:00Z' },
    { percentage: 60, at: '2026-02-01T00:00:00Z' },
    { percentage: 68, at: '2026-03-01T00:00:00Z' },
  ]);
  check('every attempt short of the pass mark: the latest replaces the rest, and the record shows how close',
    failed.state === 'marked' && failed.countingMark === 68 && failed.achievedMark === 68 && failed.passed === false);
  check('three sittings exhausts the attempts — reported, never as a penalty',
    failed.attemptsRemaining === 0 && failed.failedAttempts === 3);
}

// ─────────────────────────────────────────────────────────────────────
// 5 · THE MODULE MARK
// ─────────────────────────────────────────────────────────────────────
const passed = (p) => marks.countingMarkForAttempts([{ percentage: p, at: '2026-01-01T00:00:00Z' }]);
{
  const floor = marks.moduleMark({ quiz: passed(100), assignment: passed(57.14) });
  check('the derived assignment floor: 100 quiz + 57.14 assignment = 69.998 → 70.00, and the module completes',
    floor.state === 'marked' && floor.mark === 70 && floor.complete === true,
    `${floor.mark}`);
  check('...and the instrument states that same floor, so the arithmetic and the prose agree',
    J.module_mark.derived.value === 57.14);

  const below = marks.moduleMark({ quiz: passed(100), assignment: passed(57.13) });
  check('one hundredth below it does not complete — 69.99, and nothing lifts it',
    below.mark === 69.99 && below.complete === false);

  const ordinary = marks.moduleMark({ quiz: passed(80), assignment: passed(90) });
  check('the ordinary composite: 80 × 0.30 + 90 × 0.70 = 87.00', ordinary.mark === 87);

  const quizOnly = marks.moduleMark({ quiz: passed(100), assignment: marks.countingMarkForAttempts([]) });
  check('THE FAULT content.js HAS: a perfect quiz with no assignment does NOT complete the module',
    quizOnly.state === 'in_progress' && quizOnly.mark === null && quizOnly.complete === false);

  const awaiting = marks.moduleMark({
    quiz: passed(100),
    assignment: marks.countingMarkForAttempts([{ percentage: null, at: '2026-03-01T00:00:00Z' }]),
  });
  check('an assignment submitted and unmarked leaves the module mark null and says why',
    awaiting.state === 'awaiting_marking' && awaiting.mark === null);

  const noAssessment = marks.moduleMark({ quiz: null, assignment: null });
  check('a module with no assessment authored is not a fail and not a pass — it is not assessable',
    noAssessment.state === 'not_assessable' && noAssessment.mark === null
    && JSON.stringify(noAssessment.componentsMissing) === JSON.stringify(['quiz', 'assignment']));

  const halfAuthored = marks.moduleMark({ quiz: passed(90), assignment: null });
  check('...and a module missing only its assignment names the component that is missing',
    halfAuthored.state === 'not_assessable' && JSON.stringify(halfAuthored.componentsMissing) === JSON.stringify(['assignment']));

  const resatModule = marks.moduleMark({
    quiz: marks.countingMarkForAttempts([{ percentage: 20, at: '2026-01-01T00:00:00Z' }, { percentage: 100, at: '2026-02-01T00:00:00Z' }]),
    assignment: passed(90),
  });
  check('a resat component caps its own contribution: 70 × 0.30 + 90 × 0.70 = 84.00',
    resatModule.mark === 84 && resatModule.resat === true);
}

// ─────────────────────────────────────────────────────────────────────
// 6 · THE LEVEL MARK AND THE CLASSIFICATION
// ─────────────────────────────────────────────────────────────────────
const tenModulesAt = (mark) => Array.from({ length: 10 }, () => ({ state: 'marked', mark, complete: mark >= 70 }));
{
  const noExam = marks.levelMark({ examination: null, modules: tenModulesAt(85) });
  check('no examination is recorded anywhere, so the level mark is null and names the reason',
    noExam.mark === null && noExam.state === 'examination_not_recorded', noExam.state);
  check('...and it is never built from coursework alone — 40 per cent of a rule is not the rule',
    noExam.coursework.mean === 85 && noExam.mark === null);

  const partial = marks.levelMark({
    examination: { percentage: 90 },
    modules: [...tenModulesAt(85).slice(0, 7), ...Array.from({ length: 3 }, () => ({ state: 'not_attempted', mark: null }))],
  });
  check('a coursework mean is refused while any module is unmarked — the flattering mean is the wrong one',
    partial.mark === null && partial.state === 'coursework_incomplete' && partial.coursework.marked === 7);

  const worked = marks.levelMark({ examination: { percentage: 90 }, modules: tenModulesAt(78) });
  check('the instrument\'s worked example: examination 90, coursework 78 → level mark 85.20',
    worked.mark === 85.2 && worked.state === 'marked');

  const allSkills = (v) => Object.fromEntries(marks.SKILL_IDS.map((id) => [id, v]));

  const merit = marks.honourFor({ levelMark: 85.2, skillMarks: allSkills(75) });
  check('...and it classifies as a Merit, not a Distinction — coursework can lower a classification',
    merit.honour.code === 'merit');

  const demoted = marks.honourFor({ levelMark: 90, skillMarks: { ...allSkills(85), skl_speaking: 75 } });
  check('a level mark of 90 with a skill at 75 is a Merit: the floor demotes, it does not fail',
    demoted.honour.code === 'merit' && demoted.limitedBy === 'skill_floor' && demoted.skillFloorHeldAt === 75);

  const distinction = marks.honourFor({ levelMark: 90, skillMarks: allSkills(85) });
  check('a level mark of 90 with every skill at 85 is a Distinction',
    distinction.honour.code === 'distinction' && distinction.limitedBy === 'overall');

  const capped = marks.honourFor({ levelMark: 90, skillMarks: allSkills(85), examinationResat: true });
  check('a level examination passed on a resit classifies the whole level at Pass',
    capped.honour.code === 'pass' && capped.limitedBy === 'examination_resat');

  const missing = marks.honourFor({ levelMark: 95, skillMarks: { ...allSkills(95), skl_writing: null } });
  check('a skill with no mark blocks conferral — it does not pass by default and does not drop the floor',
    missing.honour === null && missing.reason === 'skill_mark_missing');

  const top = marks.honourFor({ levelMark: 94, skillMarks: allSkills(88) });
  check('the top of the ladder is exact on both conditions: 94.00 with every skill at 88.00',
    top.honour.code === 'high_distinction' && top.honour.gradePoint === 4);

  const justUnder = marks.honourFor({ levelMark: 94, skillMarks: { ...allSkills(88), skl_listening: 87.99 } });
  check('...and one hundredth under the floor is a Distinction, not a High Distinction',
    justUnder.honour.code === 'distinction' && justUnder.limitedBy === 'skill_floor');

  const under = marks.honourFor({ levelMark: 69.99, skillMarks: allSkills(95) });
  check('below the pass mark there is no honour at all', under.honour === null && under.reason === 'below_pass_mark');

  const noMark = marks.honourFor({ levelMark: null, skillMarks: allSkills(95) });
  check('no level mark, no honour — and the reason is named rather than implied',
    noMark.honour === null && noMark.reason === 'no_level_mark');

  check('a skill mark needs both halves of its 60/40, and returns null when either is absent',
    marks.skillMark({ examinationSubMark: null, courseworkMean: 80 }) === null
    && marks.skillMark({ examinationSubMark: 90, courseworkMean: 80 }) === 86);
  check('the coursework contribution to a skill is weighted by the approved mapping',
    marks.courseworkSkillMean([{ mark: 90, weight: 1 }, { mark: 70, weight: 0.5 }]) === (90 + 35) / 1.5
    && marks.courseworkSkillMean([]) === null);
}

// ─────────────────────────────────────────────────────────────────────
// 7 · FIXTURES — three learners, one curriculum
// ─────────────────────────────────────────────────────────────────────
function user(id, role = 'student') {
  db.prepare(`INSERT INTO users (id, auth_provider, auth_provider_id, email, role) VALUES (?, 'clerk', ?, ?, ?)`)
    .bind(id, `sub_${id}`, `${id}@example.com`, role).run();
}
// sql/schema.sql already seeds one course per level, so this authors
// the ten modules of a level into the course that is already there
// rather than creating a second one.
function course(levelId) {
  const cid = `crs_level_${levelId}`;
  for (let seq = 1; seq <= 10; seq++) {
    const uid = `unt_${levelId}_${seq}`;
    db.prepare('INSERT INTO units (id, course_id, sequence, title) VALUES (?, ?, ?, ?)')
      .bind(uid, cid, seq, `Module ${seq}`).run();
    db.prepare(`INSERT INTO learning_items (id, unit_id, sequence, kind, title) VALUES (?, ?, 1, 'quiz', ?)`)
      .bind(`itm_${levelId}_${seq}_q`, uid, `Module ${seq} quiz`).run();
    db.prepare(`INSERT INTO learning_items (id, unit_id, sequence, kind, title) VALUES (?, ?, 2, 'assignment', ?)`)
      .bind(`itm_${levelId}_${seq}_a`, uid, `Module ${seq} assignment`).run();
  }
}
function enrol(id, userId, levelId, status, startedAt = '2026-01-01T00:00:00Z', completedAt = null) {
  db.prepare('INSERT INTO enrolments (id, user_id, level_id, status, started_at, completed_at) VALUES (?, ?, ?, ?, ?, ?)')
    .bind(id, userId, levelId, status, startedAt, completedAt).run();
}
function quizAttempt(userId, itemId, fraction, at) {
  db.prepare('INSERT INTO quiz_attempts (id, learning_item_id, user_id, answers_json, score, submitted_at) VALUES (?, ?, ?, ?, ?, ?)')
    .bind(`qat_${userId}_${itemId}_${at}`, itemId, userId, '[]', fraction, at).run();
}
function submission(userId, itemId, fraction, at, status = 'graded') {
  db.prepare('INSERT INTO assignment_submissions (id, learning_item_id, user_id, content, status, grade, submitted_at) VALUES (?, ?, ?, ?, ?, ?, ?)')
    .bind(`asub_${userId}_${itemId}_${at}`, itemId, userId, 'work', status, fraction, at).run();
}
let awardSeq = 0;
function award(id, userId, levelId, honour, status = 'conferred', credits = 20) {
  awardSeq++;
  db.prepare(`INSERT INTO awards (id, user_id, level_id, award_title, post_nominal, cefr, honour, credits, tqt_hours,
      holder_name, conferred_on, verification_code, status, prev_digest, digest, seq)
    VALUES (?, ?, ?, ?, 'AsWEC', 'B1', ?, ?, 200, 'A Learner', '2026-06-01', ?, ?, ?, ?, ?)`)
    .bind(id, userId, levelId, `Award ${levelId}`, honour, credits,
      `WEC-TEST-${awardSeq}`, status, `prev${awardSeq}`, `dig${awardSeq}`, awardSeq).run();
}

course(1);
course(2);

// usr_new — an account, no enrolment, no marks. The case the engine is built around.
user('usr_new');

// usr_learn — Level I, active, three modules finished, two failed quiz attempts.
user('usr_learn');
enrol('enr_learn', 'usr_learn', 1, 'active');
for (let seq = 1; seq <= 3; seq++) {
  quizAttempt('usr_learn', `itm_1_${seq}_q`, 0.9, `2026-02-0${seq}T00:00:00Z`);
  submission('usr_learn', `itm_1_${seq}_a`, 0.85, `2026-02-1${seq}T00:00:00Z`);
}
quizAttempt('usr_learn', 'itm_1_4_q', 0.4, '2026-03-01T00:00:00Z');
quizAttempt('usr_learn', 'itm_1_5_q', 0.5, '2026-03-02T00:00:00Z');
submission('usr_learn', 'itm_1_4_a', null, '2026-03-05T00:00:00Z', 'submitted');

// usr_grad — Level I complete on every module, staff-confirmed, plus two conferred awards
// (one a Pass, one a Merit), one revoked award and one Distinction of the College.
user('usr_grad');
enrol('enr_grad_1', 'usr_grad', 1, 'completed', '2026-01-01T00:00:00Z', '2026-05-01T00:00:00Z');
enrol('enr_grad_2', 'usr_grad', 2, 'active', '2026-05-01T00:00:00Z');
for (let seq = 1; seq <= 10; seq++) {
  quizAttempt('usr_grad', `itm_1_${seq}_q`, 0.9, `2026-02-${String(seq).padStart(2, '0')}T00:00:00Z`);
  submission('usr_grad', `itm_1_${seq}_a`, 0.9, `2026-03-${String(seq).padStart(2, '0')}T00:00:00Z`);
}
award('awd_g1', 'usr_grad', 1, 'pass');
award('awd_g2', 'usr_grad', 2, 'merit');
award('awd_g3', 'usr_grad', 3, 'distinction', 'revoked');
award('awd_g4', 'usr_grad', 4, 'college_distinction');

// ─────────────────────────────────────────────────────────────────────
// 8 · THE LEARNER WITH NO MARKS — the assertion the engine exists for
// ─────────────────────────────────────────────────────────────────────
{
  const report = await standing.computeLearnerStanding(env, 'usr_new');
  check('a learner with nothing gets a well-formed answer, not an error',
    report && report.userId === 'usr_new' && Array.isArray(report.levels));
  check('THE GPA IS NULL, NOT 0.00 — an absence of certification is not a mark of zero',
    report.gpa.cumulative === null && report.gpa.state === 'no_award_conferred');
  check('...and the answer says so in words a screen can show',
    /not a mark of zero/i.test(report.gpa.statement));
  check('...and carries no grade scale, because a scale with no figure on it means nothing',
    report.gpa.gradeScale === null);
  check('no enrolment means no standing, rather than a claim of good standing',
    report.standing === null && report.progression === null);
  check('hasMarks is false and is said plainly, not left to be inferred from an empty array',
    report.hasMarks === false && report.levels.length === 0);
  check('the programme position is stated rather than implied',
    report.programme.creditsHeld === 0 && report.programme.complete === false
    && report.programme.outstandingLevels.length === 6);
  check('every answer records the regulations it was computed under',
    report.regulationVersion === marks.REGULATION_VERSION);
}

// ─────────────────────────────────────────────────────────────────────
// 9 · A LEARNER PART-WAY THROUGH A LEVEL
// ─────────────────────────────────────────────────────────────────────
{
  const report = await standing.computeLearnerStanding(env, 'usr_learn');
  const level = report.levels.find((l) => l.levelId === 1);
  check('only levels the learner has a relationship with are reported — not five refusals they never reached',
    report.levels.length === 1 && level.levelId === 1);
  check('three modules are marked and complete at 0.90/0.85 → 86.50',
    level.moduleSummary.marked === 3 && level.moduleSummary.complete === 3 && level.modules[0].mark === 86.5);
  check('completion is a 0..1 proportion, matching the rest of the schema',
    level.moduleSummary.completion === 0.3);
  check('a module whose assignment is submitted and ungraded reads as awaiting marking',
    level.modules[3].state === 'awaiting_marking');
  check('a module with a failed quiz and no submission is in progress, not failed and not absent',
    level.modules[4].state === 'in_progress' && level.modules[4].mark === null);
  check('an untouched module is not_attempted, with a null mark rather than a zero',
    level.modules[9].state === 'not_attempted' && level.modules[9].mark === null);
  check('the level mark refuses while modules are unmarked AND while no examination exists',
    level.levelMark.mark === null && level.levelMark.reasons.includes('examination_not_recorded')
    && level.levelMark.reasons.includes('coursework_incomplete'));
  check('no honour can be judged, and the reason given is the missing level mark',
    level.honour.honour === null && level.honour.reason === 'no_level_mark');
  check('still no grade point average — no award has been conferred',
    report.gpa.cumulative === null && report.hasMarks === true);

  check('two failed attempts at one level put the learner Under Review',
    level.standing.standing === 'under_review' && level.standing.failedAttempts === 2);
  check('...it is not a sanction and touches nothing the learner can access',
    level.standing.isASanction === false && level.standing.affectsAccess === false);
  check('...it obliges the College, in writing, within ten working days',
    level.standing.obligations.length === 4 && /10 working days/.test(level.standing.obligations[0]));
  check('...and it carries the reason, because a tutorial nobody can explain is a summons',
    typeof level.standing.note === 'string' && level.standing.note.length > 0);
  check('the failed-examination trigger reports as NOT INSTRUMENTED, never as "did not fire"',
    level.standing.triggers.find((t) => t.id === 'standing.trigger.failed_examination').instrumented === false);
  check('suspended progression has no computable trigger at all — it is a person\'s act',
    level.standing.triggers.find((t) => t.id === 'standing.trigger.integrity_matter').instrumented === false);

  check('graduation: not eligible, because work the LEARNER owes is outstanding',
    level.graduation.state === 'not_eligible' && level.graduation.learnerOwes.length > 0);
  check('...and it never says only "not eligible" — every outstanding condition is named',
    typeof level.graduation.outstanding === 'string' && level.graduation.outstanding.length > 20);
  check('...each condition says whose it is, so the College\'s unfinished work is not the learner\'s shortfall',
    level.graduation.conditions.every((c) => c.owner === 'learner' || c.owner === 'college')
    && level.graduation.conditions.some((c) => c.owner === 'college'));
  check('the four examination gates are unknown rather than failed',
    level.graduation.conditions.filter((c) => c.id.startsWith('level.gate.examination') || c.id === 'level.gate.spoken_paper')
      .every((c) => c.met === null && c.owner === 'college'));
  check('every skill is unmarked, because no assessment carries an approved mapping',
    level.skills.length === 4 && level.skills.every((s) => s.mark === null && s.state === 'no_approved_mapping'));
  check('progression is refused while the level is unfinished, and names the next level plainly',
    level.progression.mayProgress === false && level.progression.nextLevelId === 2);
  check('one learner\'s record contains no trace of another\'s — every mark query is keyed on the session subject',
    JSON.stringify(report).indexOf('usr_grad') === -1 && report.gpa.perLevel.length === 0);
}

// ─────────────────────────────────────────────────────────────────────
// 10 · A LEARNER WITH AWARDS
// ─────────────────────────────────────────────────────────────────────
{
  const report = await standing.computeLearnerStanding(env, 'usr_grad');
  check('the grade point average is credit-weighted over conferred awards only: (3.00 + 3.30) / 2 = 3.15',
    report.gpa.cumulative === 3.15 && report.gpa.awardsCounted === 2, String(report.gpa.cumulative));
  check('...and it now carries the scale it is on', report.gpa.gradeScale === marks.GRADE_SCALE);
  check('credits held are the credits actually conferred, not the programme total',
    report.gpa.creditsHeld === 40 && report.programme.creditsRequired === 120);
  check('a revoked award is excluded and visible as excluded, never scored as a fail',
    report.gpa.excluded.some((e) => e.awardId === 'awd_g3' && e.reason === 'revoked'));
  check('the Distinction of the College enters no average — it is a decision, not a calculation',
    report.gpa.excluded.some((e) => e.awardId === 'awd_g4' && e.reason === 'conferred_by_decision_no_grade_point'));
  check('per-level grade points are reported beside the cumulative figure',
    report.gpa.perLevel.find((p) => p.levelId === 1).gradePoint === 3
    && report.gpa.perLevel.find((p) => p.levelId === 2).gradePoint === 3.3);
  check('the programme is not complete on two awards, and the missing levels are named',
    report.programme.complete === false && JSON.stringify(report.programme.outstandingLevels) === JSON.stringify([3, 5, 6]));

  const level1 = report.levels.find((l) => l.levelId === 1);
  check('a conferred level reports as conferred, and the register is what says so',
    level1.graduation.state === 'conferred' && level1.graduation.awardId === 'awd_g1');
  check('all ten modules complete, staff-confirmed, at 0.90/0.90 → 90.00 each',
    level1.moduleSummary.complete === 10 && level1.modules[0].mark === 90 && level1.moduleSummary.completion === 1);
  check('a learner who has finished everything asked of them is in good standing, with no note',
    level1.standing.standing === 'in_good_standing' && level1.standing.note === null);

  const level3 = report.levels.find((l) => l.levelId === 3);
  check('a level reached only through an award still carries its name, roman and CEFR',
    level3.name === 'Intermediate Programme' && level3.roman === 'III' && level3.cefr === 'B1');
  check('...and a revoked award confers nothing: the level is not reported as conferred',
    level3.graduation.state !== 'conferred' && level3.graduation.awardId === null);

  const level2 = report.levels.find((l) => l.levelId === 2);
  check('a level with an award but no coursework attempted still reads honestly',
    level2.moduleSummary.marked === 0 && level2.levelMark.mark === null);
  check('the current level drives the top-level standing and progression',
    report.standing.levelId === 2 && report.progression.fromLevelId === 2);
}

// ─────────────────────────────────────────────────────────────────────
// 11 · CONDITIONAL — when everything left belongs to the College
// ─────────────────────────────────────────────────────────────────────
{
  user('usr_done');
  enrol('enr_done', 'usr_done', 1, 'completed', '2026-01-01T00:00:00Z', '2026-05-01T00:00:00Z');
  for (let seq = 1; seq <= 10; seq++) {
    quizAttempt('usr_done', `itm_1_${seq}_q`, 0.95, `2026-02-${String(seq).padStart(2, '0')}T00:00:00Z`);
    submission('usr_done', `itm_1_${seq}_a`, 0.95, `2026-03-${String(seq).padStart(2, '0')}T00:00:00Z`);
  }
  const report = await standing.computeLearnerStanding(env, 'usr_done');
  const level = report.levels.find((l) => l.levelId === 1);
  check('a learner who has done everything asked of them is CONDITIONAL, never "not eligible"',
    level.graduation.state === 'conditional' && level.graduation.learnerOwes.length === 0, level.graduation.state);
  check('...and what remains is named, and every item of it is the College\'s',
    level.graduation.outstandingConditions.length > 0
    && level.graduation.outstandingConditions.every((c) => c.owner === 'college'));
  check('...and the modules gate is met: ten of ten',
    level.graduation.conditions.find((c) => c.id === 'level.gate.modules_complete').met === true);
  check('...and the staff confirmation is met, because a person completed the enrolment',
    level.graduation.conditions.find((c) => c.id === 'level.gate.staff_confirmation').met === true);
  check('progression still refuses, because eligibility is not established',
    level.progression.mayProgress === false);
}

// ─────────────────────────────────────────────────────────────────────
// 11b · PROGRESSION AT THE ENDS OF THE LADDER
// ─────────────────────────────────────────────────────────────────────
{
  const stub = { enrolments: [], awards: [], reviews: [] };
  const eligible = { state: 'eligible', conditions: [], outstanding: null };

  const opens = standing.progressionPosition(stub, 1, eligible);
  check('an eligible level opens the next one, one level at a time',
    opens.mayProgress === true && opens.nextLevelId === 2);

  const final = standing.progressionPosition(stub, 6, eligible);
  check('the sixth level is the end of the programme, not a refusal to progress',
    final.isFinalLevel === true && final.nextLevelId === null && /final level/.test(final.statement));

  const held = standing.progressionPosition(
    { ...stub, reviews: [{ levelId: 1, standing: 'suspended_progression' }] }, 1, eligible);
  check('suspended progression pauses the next level while leaving everything else alone',
    held.mayProgress === false && held.pausedBySuspension === true);
}

// ─────────────────────────────────────────────────────────────────────
// 12 · AN APPROVED SKILL MAPPING CHANGES WHICH ABSENCE IS REPORTED
// ─────────────────────────────────────────────────────────────────────
{
  db.prepare(`INSERT INTO assessment_skills (id, learning_item_id, skill_id, weight, status, approved_by, approved_at)
    VALUES ('ask_1', 'itm_1_1_a', 'skl_writing', 1.0, 'approved', 'usr_grad', '2026-06-01T00:00:00Z')`).run();
  const report = await standing.computeLearnerStanding(env, 'usr_done');
  const writing = report.levels.find((l) => l.levelId === 1).skills.find((s) => s.skillId === 'skl_writing');
  check('with an approved mapping the coursework half of the skill computes',
    writing.courseworkMean === 95 && writing.approvedMappings === 1);
  check('...but the skill mark stays null and now names the examination as what is missing',
    writing.mark === null && writing.state === 'examination_not_recorded');
  check('...so conferral still refuses, which the instrument says is the intended behaviour',
    report.levels.find((l) => l.levelId === 1).honour.honour === null);
}

// ─────────────────────────────────────────────────────────────────────
// 13 · PERSISTENCE — a review point is an act of the College
// ─────────────────────────────────────────────────────────────────────
{
  const written = await standing.recordStandingReview(env, { userId: 'usr_learn', levelId: 1, reviewPoint: '2026-Q1' });
  check('a standing is frozen into academic_standing_reviews', written.written === true && written.standing === 'under_review');

  const row = db.prepare('SELECT * FROM academic_standing_reviews WHERE id = ?').bind(written.id).first();
  check('...stamped with the regulation version it was decided under',
    row.regulation_version === marks.REGULATION_VERSION);
  check('...with the counts it was read from frozen, not recomputed later',
    JSON.parse(row.basis_json).failedAttempts === 2 && JSON.parse(row.basis_json).modules.complete === 3);
  check('...with completion as a 0..1 proportion the column will accept', row.completion === 0.3);
  check('...with no grade point average and no scale, because no award has been conferred',
    row.grade_point_average === null && row.grade_scale === null);
  check('...recorded by the platform, which is what a NULL computed_by means',
    row.computed_by === null && row.note !== null);

  const again = await standing.recordStandingReview(env, { userId: 'usr_learn', levelId: 1, reviewPoint: '2026-Q1' });
  const count = db.prepare('SELECT COUNT(*) AS n FROM academic_standing_reviews WHERE user_id = ? AND level_id = 1').bind('usr_learn').first();
  check('re-running the same review point updates it rather than minting a second',
    again.id === written.id && count.n === 1);

  const graduate = await standing.recordStandingReview(env, { userId: 'usr_grad', levelId: 1, reviewPoint: '2026-Q1' });
  const gradRow = db.prepare('SELECT * FROM academic_standing_reviews WHERE id = ?').bind(graduate.id).first();
  check('a graduate\'s stored standing carries the average AND the scale that gives it meaning',
    gradRow.grade_point_average === 3.15 && gradRow.grade_scale === marks.GRADE_SCALE);

  // A person's judgement, recorded directly, is what a suspension is.
  user('usr_susp');
  enrol('enr_susp', 'usr_susp', 1, 'active');
  user('usr_staff', 'admin');
  db.prepare(`INSERT INTO academic_standing_reviews (id, user_id, enrolment_id, level_id, review_point, standing,
      regulation_version, basis_json, computed_at, computed_by, note)
    VALUES ('asr_manual', 'usr_susp', 'enr_susp', 1, '2026-Q1', 'suspended_progression', ?, '{}', '2026-06-01T00:00:00Z', 'usr_staff',
      'An integrity matter was opened under the misconduct procedure on 1 June 2026.')`)
    .bind(marks.REGULATION_VERSION).run();
  const suspended = await standing.computeLearnerStanding(env, 'usr_susp');
  const susLevel = suspended.levels.find((l) => l.levelId === 1);
  check('a standing a person recorded is carried forward, not recomputed away',
    susLevel.standing.standing === 'suspended_progression' && susLevel.standing.recordedBy === 'staff');
  check('...it pauses progression and leaves access untouched',
    susLevel.progression.pausedBySuspension === true && susLevel.standing.affectsAccess === false);
  check('...and the College owes a decision within twenty working days',
    susLevel.standing.obligations.some((o) => /20 working days/.test(o)));

  const refused = await standing.recordStandingReview(env, { userId: 'usr_susp', levelId: 1, reviewPoint: '2026-Q1' });
  check('the platform refuses to overwrite a review point a person recorded',
    refused.written === false && /person/.test(refused.reason));
}

// ─────────────────────────────────────────────────────────────────────
// 14 · PERSISTENCE — graduation eligibility
// ─────────────────────────────────────────────────────────────────────
{
  const rec = await standing.recordGraduationEligibility(env, { userId: 'usr_done', levelId: 1 });
  const row = db.prepare('SELECT * FROM graduation_eligibility WHERE id = ?').bind(rec.id).first();
  check('a graduation position is frozen with what is outstanding beside it',
    row.state === 'conditional' && typeof row.outstanding === 'string' && row.outstanding.length > 20);
  check('...stamped with the regulation version, and assessed by the platform',
    row.regulation_version === marks.REGULATION_VERSION && row.assessed_by === null);
  check('...and it claims no conferral the register does not hold', row.award_id === null);

  const conferred = await standing.recordGraduationEligibility(env, { userId: 'usr_grad', levelId: 1 });
  const conferredRow = db.prepare('SELECT * FROM graduation_eligibility WHERE id = ?').bind(conferred.id).first();
  check('a conferred level records the award id the register actually holds',
    conferredRow.state === 'conferred' && conferredRow.award_id === 'awd_g1');

  const second = await standing.recordGraduationEligibility(env, { userId: 'usr_grad', levelId: 1 });
  check('once conferred, a later sweep does not downgrade it — the register is the authority',
    second.written === false && /register/.test(second.reason));
}

// ─────────────────────────────────────────────────────────────────────
// 15 · VALIDATION — rejected, never coerced
// ─────────────────────────────────────────────────────────────────────
async function refuses(label, fn, field) {
  try {
    await fn();
    check(label, false, 'no error thrown');
  } catch (err) {
    check(label, err.name === 'ValidationError' && err.httpStatus === 422
      && (field === undefined || Object.prototype.hasOwnProperty.call(err.fields, field)),
      `${err.name} ${JSON.stringify(err.fields || {})}`);
  }
}
await refuses('a standing review with no learner is refused, with the field named',
  () => standing.recordStandingReview(env, { userId: '', levelId: 1, reviewPoint: '2026-Q1' }), 'userId');
await refuses('a level outside I–VI is refused rather than coerced',
  () => standing.recordStandingReview(env, { userId: 'usr_learn', levelId: 9, reviewPoint: '2026-Q1' }), 'levelId');
await refuses('a level id given as a string is refused rather than parsed',
  () => standing.recordStandingReview(env, { userId: 'usr_learn', levelId: '1', reviewPoint: '2026-Q1' }), 'levelId');
await refuses('a review point must be a named occasion, not an empty string',
  () => standing.recordStandingReview(env, { userId: 'usr_learn', levelId: 1, reviewPoint: '   ' }), 'reviewPoint');
await refuses('a standing cannot be recorded at a level the learner has no record at',
  () => standing.recordStandingReview(env, { userId: 'usr_learn', levelId: 6, reviewPoint: '2026-Q1' }), 'levelId');
await refuses('graduation eligibility refuses an unknown level too',
  () => standing.recordGraduationEligibility(env, { userId: 'usr_learn', levelId: 0 }), 'levelId');
await refuses('the engine refuses to compute for nobody',
  () => standing.computeLearnerStanding(env, null), 'userId');

// ─────────────────────────────────────────────────────────────────────
// 16 · THE ENDPOINT — session-derived subject, and nothing else
// ─────────────────────────────────────────────────────────────────────
{
  const res = await standingEndpoint({ request: new Request('https://wec.test/api/student/standing'), env });
  check('GET /api/student/standing refuses an unauthenticated request', res.status === 401);

  const withParam = await standingEndpoint({
    request: new Request('https://wec.test/api/student/standing?userId=usr_grad&levelId=1'),
    env,
  });
  check('...and a user id in the query string does not get past the guard either', withParam.status === 401);

  const src = readFileSync(loadUrl('functions/api/student/standing.js'), 'utf8');
  check('the endpoint source reads no URL parameter at all — own-data-only by construction',
    !/searchParams/.test(src) && !/params\./.test(src));
  check('...and the subject comes from requireUser, not from the request body',
    /requireUser\(request, env\)/.test(src) && /computeLearnerStanding\(env, user\.id\)/.test(src));
  check('...and it writes nothing: no review point is minted by a page load',
    !/recordStandingReview|recordGraduationEligibility/.test(src.replace(/^\/\/.*$/gm, '')));
}

console.log(`\n${pass} passed, ${fail} failed.`);
process.exit(fail ? 1 : 0);
