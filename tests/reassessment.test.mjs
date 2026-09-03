// Run with: node --experimental-sqlite tests/reassessment.test.mjs
//
// THE RESIT RULES, AS RULES — data/academic-regulations.json § resit.
//
// The instrument adopted four of them in August 2026 and the platform
// enforced none: `conformance.schema.assessment_attempts` recorded that
// neither summative table held an attempt ordinal, "so resit.attempts,
// resit.interval and resit.cap cannot be enforced or audited from the
// data as it stands". A rule that is reported on and never applied is
// met only by the learners who happen to comply with it.
//
// Two things are asserted here that a happier test would leave out.
//
// The first is that every refusal SAYS WHAT HAPPENS NEXT. `resit.attempts`
// does not end at "no": it says the level is repeated, the assessments
// are set afresh, and `resit.repeat_charge` is zero. A learner refused a
// fourth sitting and told nothing else has been given a wall by an
// institution that published a route.
//
// The second is that the ordinal is WRITTEN and not counted, and that
// the allowance is counted and not written. A sitting struck out on
// appeal gives the learner their attempt back — that is what striking
// one out means — but it must never give away the NUMBER, because
// "attempt 2" is already written into a marker's feedback and quoted in
// the appeal, and one learner cannot have two different second
// attempts.
import { readFileSync } from 'node:fs';
import { makeD1 } from './d1-shim.mjs';
import { ROOT, loadUrl } from './helpers.mjs';

const schema = readFileSync(`${ROOT}/sql/schema.sql`, 'utf8');
const env = { DB: makeD1(schema) };
const db = env.DB;

const { reassessmentPosition, assertAttemptPermitted, ReassessmentError } =
  await import(loadUrl('functions/_lib/academic/reassessment.js'));
const { RESIT } = await import(loadUrl('functions/_lib/academic/marks.js'));
const { submitQuizAttempt } = await import(loadUrl('functions/_lib/lms/content.js'));

let pass = 0, fail = 0;
const check = (label, cond, detail) => {
  console.log((cond ? 'PASS ' : 'FAIL ') + label + (cond || detail === undefined ? '' : ` — ${detail}`));
  cond ? pass++ : fail++;
};

const DAY = 24 * 60 * 60 * 1000;
const ago = (days) => new Date(Date.now() - days * DAY).toISOString();

// ── Fixtures ─────────────────────────────────────────────────────────
db.prepare(`INSERT INTO users (id, auth_provider, auth_provider_id, email, role) VALUES ('usr_r', 'clerk', 'sub_r', 'r@example.com', 'student')`).run();
db.prepare(`INSERT INTO enrolments (id, user_id, level_id, status, started_at) VALUES ('enr_r', 'usr_r', 1, 'active', '2026-01-01T00:00:00.000Z')`).run();
const course = db.prepare('SELECT id FROM courses WHERE level_id = 1').first().id;
db.prepare(`INSERT INTO units (id, course_id, sequence, title) VALUES ('unt_r', ?, 1, 'Resit module')`).bind(course).run();
db.prepare(`INSERT INTO learning_items (id, unit_id, sequence, kind, title) VALUES ('itm_rq', 'unt_r', 1, 'quiz', 'Resit quiz')`).run();
db.prepare(`INSERT INTO learning_items (id, unit_id, sequence, kind, title) VALUES ('itm_ra', 'unt_r', 2, 'assignment', 'Resit assignment')`).run();
db.prepare(`INSERT INTO quiz_questions (id, learning_item_id, sequence, prompt, choices_json, correct_index) VALUES ('qq_r', 'itm_rq', 1, 'Pick one', '["a","b"]', 0)`).run();

const sit = (n, at, score) => db.prepare(
  `INSERT INTO quiz_attempts (id, learning_item_id, user_id, answers_json, score, attempt, submitted_at) VALUES (?, 'itm_rq', 'usr_r', '[1]', ?, ?, ?)`,
).bind(`qat_r${n}`, score, n, at).run();

// ── Nothing sat yet ──────────────────────────────────────────────────
{
  const p = await reassessmentPosition(env, { userId: 'usr_r', learningItemId: 'itm_rq', kind: 'quiz' });
  check('an untouched assessment reports the whole allowance and no resit',
    p.attemptsTaken === 0 && p.attemptsRemaining === RESIT.totalAttempts && p.isResit === false && p.mayAttempt === true);
  check('the first sitting is ordinal 1, not zero', p.nextAttemptOrdinal === 1);
  check('there is no fee, and the position says so rather than leaving it to be asked',
    p.feeUsd === 0);
}

// ── resit.interval — fourteen days ───────────────────────────────────
{
  sit(1, ago(2), 0.4);
  const p = await reassessmentPosition(env, { userId: 'usr_r', learningItemId: 'itm_rq', kind: 'quiz' });
  check('two days after a failed sitting, a resit is not yet open', p.mayAttempt === false && p.intervalHeld === false);
  check('...and the position names the date it opens rather than only refusing',
    typeof p.nextPermittedAt === 'string'
    && Math.abs(Date.parse(p.nextPermittedAt) - (Date.parse(ago(2)) + RESIT.minimumIntervalDays * DAY)) < 1000,
    p.nextPermittedAt);

  let err = null;
  try { await assertAttemptPermitted(env, { userId: 'usr_r', learningItemId: 'itm_rq', kind: 'quiz' }); }
  catch (e) { err = e; }
  check('the gate refuses it, as a ReassessmentError naming the clause',
    err instanceof ReassessmentError && err.rule === 'resit.interval');
  check('...as a 422 the form can act on, not a 500', err && err.httpStatus === 422);
  check('...and the refusal explains what the interval is FOR, not merely that it exists',
    err && /evidence/.test(err.message) && /no fee/.test(err.message), err && err.message.slice(0, 60));
}

// ── The interval passes ──────────────────────────────────────────────
{
  db.prepare(`UPDATE quiz_attempts SET submitted_at = ? WHERE id = 'qat_r1'`).bind(ago(15)).run();
  const p = await reassessmentPosition(env, { userId: 'usr_r', learningItemId: 'itm_rq', kind: 'quiz' });
  check('fifteen days later the resit is open', p.mayAttempt === true && p.intervalHeld === true);
  check('...and it is reported as a resit, not as a first sitting', p.isResit === true && p.nextAttemptOrdinal === 2);
  check('...with the allowance counted down by one', p.attemptsRemaining === RESIT.totalAttempts - 1);
}

// ── resit.attempts — three sittings, then the level is repeated ──────
{
  sit(2, ago(14), 0.5);
  sit(3, ago(1), 0.5);
  const p = await reassessmentPosition(env, { userId: 'usr_r', learningItemId: 'itm_rq', kind: 'quiz' });
  check('after three sittings the allowance is spent', p.attemptsTaken === 3 && p.attemptsRemaining === 0 && p.mayAttempt === false);
  check('...and the position reports the repeat WITHOUT performing it — repeating a level is an act of the College',
    p.mustRepeatLevel === true);
  check('...which left the enrolment exactly as it was',
    db.prepare(`SELECT status FROM enrolments WHERE id = 'enr_r'`).first().status === 'active');

  let err = null;
  try { await assertAttemptPermitted(env, { userId: 'usr_r', learningItemId: 'itm_rq', kind: 'quiz' }); }
  catch (e) { err = e; }
  check('a fourth sitting is refused under resit.attempts', err instanceof ReassessmentError && err.rule === 'resit.attempts');
  check('...and the refusal carries the route out of it in the same sentence',
    err && /repeated/.test(err.message) && /no charge/.test(err.message), err && err.message);

  // The whole path, not just the rule module: the endpoint's own
  // function must refuse too, or the gate is decorative.
  let routeErr = null;
  try { await submitQuizAttempt(env, { userId: 'usr_r', learningItemId: 'itm_rq', answers: [0] }); }
  catch (e) { routeErr = e; }
  check('submitQuizAttempt refuses it as well — the gate is on the path a learner takes',
    routeErr instanceof ReassessmentError && routeErr.rule === 'resit.attempts');
  check('...and nothing was written: still three sittings on file',
    db.prepare(`SELECT COUNT(*) AS n FROM quiz_attempts WHERE user_id = 'usr_r' AND learning_item_id = 'itm_rq'`).first().n === 3);
}

// ── The ordinal is written, not counted ──────────────────────────────
{
  // A sitting struck out — the case that separates the two counts. The
  // learner gets the attempt back; the number does not come back with
  // it, or a later sitting would be labelled with one already in use.
  db.prepare(`DELETE FROM quiz_attempts WHERE id = 'qat_r2'`).run();
  const p = await reassessmentPosition(env, { userId: 'usr_r', learningItemId: 'itm_rq', kind: 'quiz' });
  check('a voided sitting does not renumber the ones after it',
    db.prepare(`SELECT attempt FROM quiz_attempts WHERE id = 'qat_r3'`).first().attempt === 3);
  check('...so the next ordinal is 4 and never reuses a number already spent',
    p.nextAttemptOrdinal === 4, String(p.nextAttemptOrdinal));
  check('...while the ALLOWANCE gives the struck-out sitting back, which is what striking one out means',
    p.attemptsTaken === 2 && p.attemptsRemaining === 1 && p.mustRepeatLevel === false);
}

// ── A learner who has already met the standard ───────────────────────
{
  db.prepare(`INSERT INTO users (id, auth_provider, auth_provider_id, email, role) VALUES ('usr_p', 'clerk', 'sub_p', 'p@example.com', 'student')`).run();
  db.prepare(`INSERT INTO enrolments (id, user_id, level_id, status, started_at) VALUES ('enr_p', 'usr_p', 1, 'active', '2026-01-01T00:00:00.000Z')`).run();
  for (const [n, days] of [[1, 60], [2, 40], [3, 20]]) {
    db.prepare(`INSERT INTO quiz_attempts (id, learning_item_id, user_id, answers_json, score, attempt, submitted_at) VALUES (?, 'itm_rq', 'usr_p', '[0]', 0.9, ?, ?)`)
      .bind(`qat_p${n}`, n, ago(days)).run();
  }
  const p = await reassessmentPosition(env, { userId: 'usr_p', learningItemId: 'itm_rq', kind: 'quiz' });
  check('a learner who passed and spent the allowance is NOT told to repeat the level',
    p.passed === true && p.mustRepeatLevel === false);

  let err = null;
  try { await assertAttemptPermitted(env, { userId: 'usr_p', learningItemId: 'itm_rq', kind: 'quiz' }); }
  catch (e) { err = e; }
  check('...and their refusal is a different sentence: the cap means a further sitting could not raise the mark',
    err && /could not raise/.test(err.message) && !/repeated/.test(err.message), err && err.message.slice(0, 70));
}

// ── An assignment awaiting marking ───────────────────────────────────
{
  db.prepare(`INSERT INTO assignment_submissions (id, learning_item_id, user_id, content, status, attempt, submitted_at) VALUES ('asub_r1', 'itm_ra', 'usr_r', 'x', 'submitted', 1, ?)`)
    .bind(ago(20)).run();
  const p = await reassessmentPosition(env, { userId: 'usr_r', learningItemId: 'itm_ra', kind: 'assignment' });
  check('an ungraded submission is an attempt whose mark does not exist yet, not a fail',
    p.attemptsTaken === 1 && p.awaitingMarking === true && p.passed === false);
  check('...and it still spends an attempt, because it was sat', p.attemptsRemaining === RESIT.totalAttempts - 1);
}

// ── resit.task_refresh — a limit on the paper, not the learner ───────
{
  db.prepare(`UPDATE assignment_submissions SET submitted_at = ? WHERE id = 'asub_r1'`).bind(ago(400)).run();
  const p = await reassessmentPosition(env, { userId: 'usr_r', learningItemId: 'itm_ra', kind: 'assignment' });
  check('a task first attempted over a year ago is flagged for a fresh setting', p.taskRefreshDue === true);
  check('...and the learner loses no attempt over it and is not refused',
    p.attemptsRemaining === RESIT.totalAttempts - 1 && p.mayAttempt === true);
}

// ── The instrument and the code agree on every constant ──────────────
{
  const regs = JSON.parse(readFileSync(`${ROOT}/data/academic-regulations.json`, 'utf8')).reassessment;
  check('resit.attempts: the instrument says two resits and three sittings, and the code holds both',
    regs.attempts_per_assessment.value === RESIT.resitsPerAssessment
    && regs.attempts_per_assessment.total_attempts === RESIT.totalAttempts);
  check('resit.interval: fourteen days in both places', regs.minimum_interval_days.value === RESIT.minimumIntervalDays);
  check('resit.cap: the pass mark in both places', regs.mark_cap.value === RESIT.markCap);
  check('resit.task_refresh: a year in both places', regs.task_refresh_days.value === RESIT.taskRefreshDays);
  check('resit.fee: nothing in both places', regs.fee.value === RESIT.feeUsd);

  const div = JSON.parse(readFileSync(`${ROOT}/data/academic-regulations.json`, 'utf8'))
    .conformance.schema_changes_requested
    .find((r) => r.id === 'conformance.schema.assessment_attempts');
  check('the schema change the instrument asked for is recorded as made, with a date',
    Boolean(div && div.made_on), div && div.why);
}

console.log(`\n${pass} passed, ${fail} failed.`);
process.exit(fail ? 1 : 0);
