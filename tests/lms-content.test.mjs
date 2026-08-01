// Run with: node --experimental-sqlite tests/lms-content.test.mjs
// Covers Milestone 1 of the proprietary WEC-LC LMS (Executive Decision
// #4) — functions/_lib/lms/content.js's access control, quiz scoring,
// assignment submission/grading, and progressive unit_progress. Test
// fixture units/questions below are placeholder mechanism-testing
// content ("Unit 1", "2 + 2 = ?"), not real WEC-LC curriculum — no
// curriculum content is seeded anywhere in sql/schema.sql itself.
import { readFileSync } from 'node:fs';
import { makeD1 } from './d1-shim.mjs';
import { ROOT, loadUrl } from './helpers.mjs';

const schema = readFileSync(`${ROOT}/sql/schema.sql`, 'utf8');
const env = { DB: makeD1(schema) };
const db = env.DB;

const {
  listUnits, getUnitDetail, submitQuizAttempt, submitAssignment, gradeAssignment, listLiveSessions,
} = await import(loadUrl('functions/_lib/lms/content.js'));
const { AuthorizationError } = await import(loadUrl('functions/_lib/auth/session.js'));
const { NotFoundError, ValidationError } = await import(loadUrl('functions/_lib/db.js'));
const { onRequestGet: unitsEndpoint } = await import(loadUrl('functions/api/lms/units.js'));
const { onRequestPost: gradeEndpoint } = await import(loadUrl('functions/api/lms/grade-assignment.js'));

let pass = 0, fail = 0;
function check(label, cond) { console.log((cond ? 'PASS ' : 'FAIL ') + label); cond ? pass++ : fail++; }

// --- Fixtures: two units in the seeded Level I course, one quiz item, one assignment item ---
db.prepare(`INSERT INTO users (id, auth_provider, auth_provider_id, email, role) VALUES ('usr_enrolled', 'clerk', 'sub_e', 'e@example.com', 'student')`).run();
db.prepare(`INSERT INTO users (id, auth_provider, auth_provider_id, email, role) VALUES ('usr_outside', 'clerk', 'sub_o', 'o@example.com', 'student')`).run();
db.prepare(`INSERT INTO users (id, auth_provider, auth_provider_id, email, role) VALUES ('usr_staff', 'clerk', 'sub_s', 's@example.com', 'staff')`).run();
db.prepare(`INSERT INTO enrolments (id, user_id, level_id, status, started_at) VALUES ('enr_e1', 'usr_enrolled', 1, 'active', '2026-01-01T00:00:00.000Z')`).run();

db.prepare(`INSERT INTO units (id, course_id, sequence, title) VALUES ('unt_1', 'crs_level_1', 1, 'Unit 1')`).run();
db.prepare(`INSERT INTO units (id, course_id, sequence, title) VALUES ('unt_2', 'crs_level_1', 2, 'Unit 2')`).run();
db.prepare(`INSERT INTO learning_items (id, unit_id, sequence, kind, title, body) VALUES ('itm_reading', 'unt_1', 1, 'reading', 'Reading', 'Some text.')`).run();
db.prepare(`INSERT INTO learning_items (id, unit_id, sequence, kind, title) VALUES ('itm_quiz', 'unt_1', 2, 'quiz', 'Quiz')`).run();
db.prepare(`INSERT INTO quiz_questions (id, learning_item_id, sequence, prompt, choices_json, correct_index) VALUES ('qq_1', 'itm_quiz', 1, '2 + 2 = ?', '["3","4","5"]', 1)`).run();
db.prepare(`INSERT INTO quiz_questions (id, learning_item_id, sequence, prompt, choices_json, correct_index) VALUES ('qq_2', 'itm_quiz', 2, '3 + 3 = ?', '["6","7","8"]', 0)`).run();
db.prepare(`INSERT INTO learning_items (id, unit_id, sequence, kind, title) VALUES ('itm_assign', 'unt_2', 1, 'assignment', 'Essay')`).run();
db.prepare(`INSERT INTO live_sessions (id, level_id, unit_id, title, starts_at, join_url) VALUES ('lsn_1', 1, 'unt_1', 'Conversation Class', '2026-08-15T10:00:00.000Z', 'https://example.com/join')`).run();

// --- Access control: enrolled vs. not enrolled ---
const units = await listUnits(env, { userId: 'usr_enrolled', levelId: 1 });
check('listUnits: enrolled student sees both units, in order', units.length === 2 && units[0].id === 'unt_1' && units[1].id === 'unt_2');
check('listUnits: fresh unit has not_started progress', units[0].progressStatus === 'not_started');

check('listUnits: a student with no enrolment for this level is rejected', await (async () => {
  try { await listUnits(env, { userId: 'usr_outside', levelId: 1 }); return false; } catch (e) { return e instanceof AuthorizationError; }
})());

// --- Unit detail: quiz questions never leak correct_index ---
const detail = await getUnitDetail(env, { userId: 'usr_enrolled', unitId: 'unt_1' });
const quizItem = detail.items.find((i) => i.kind === 'quiz');
check('getUnitDetail: quiz item carries its questions', quizItem.questions.length === 2);
check('getUnitDetail: quiz questions never expose correctIndex/correct_index to the client', !('correctIndex' in quizItem.questions[0]) && !('correct_index' in quizItem.questions[0]) && !('choicesJson' in quizItem.questions[0]));
check('getUnitDetail: quiz questions carry parsed choices', Array.isArray(quizItem.questions[0].choices) && quizItem.questions[0].choices.length === 3);
check('getUnitDetail: unknown unit id throws NotFoundError', await (async () => {
  try { await getUnitDetail(env, { userId: 'usr_enrolled', unitId: 'unt_missing' }); return false; } catch (e) { return e instanceof NotFoundError; }
})());

// --- Quiz attempt: scoring, pass threshold, unit_progress ---
{
  const attempt = await submitQuizAttempt(env, { userId: 'usr_enrolled', learningItemId: 'itm_quiz', answers: [1, 0] }); // both correct
  check('submitQuizAttempt: perfect score is 1.0', attempt.score === 1 && attempt.correctCount === 2);
  check('submitQuizAttempt: passed the default 0.7 threshold', attempt.passed === true);
  const progress = await db.prepare(`SELECT * FROM unit_progress WHERE user_id = 'usr_enrolled' AND unit_id = 'unt_1'`).first();
  check('submitQuizAttempt: a passing score marks the unit completed', progress.status === 'completed' && progress.completed_at != null);

  check('submitQuizAttempt: wrong answer-count length throws ValidationError', await (async () => {
    try { await submitQuizAttempt(env, { userId: 'usr_enrolled', learningItemId: 'itm_quiz', answers: [1] }); return false; } catch (e) { return e instanceof ValidationError; }
  })());

  // A later, failing retake must NOT downgrade the already-completed unit.
  await submitQuizAttempt(env, { userId: 'usr_enrolled', learningItemId: 'itm_quiz', answers: [0, 1] }); // both wrong
  const attemptCount = db.prepare(`SELECT COUNT(*) as n FROM quiz_attempts WHERE learning_item_id = 'itm_quiz' AND user_id = 'usr_enrolled'`).first().n;
  check('submitQuizAttempt: retakes are appended, not overwritten (2 attempts on file)', attemptCount === 2);
  const progressAfterRetake = await db.prepare(`SELECT * FROM unit_progress WHERE user_id = 'usr_enrolled' AND unit_id = 'unt_1'`).first();
  check('submitQuizAttempt: a failing retake does not un-complete an already-completed unit', progressAfterRetake.status === 'completed');
}

// --- Assignment: submit, then staff grades it ---
{
  const submission = await submitAssignment(env, { userId: 'usr_enrolled', learningItemId: 'itm_assign', content: 'My essay text.' });
  check('submitAssignment: creates a submitted-status row', submission.status === 'submitted');
  const progressAfterSubmit = await db.prepare(`SELECT * FROM unit_progress WHERE user_id = 'usr_enrolled' AND unit_id = 'unt_2'`).first();
  check('submitAssignment: marks the unit in_progress (not completed — ungraded)', progressAfterSubmit.status === 'in_progress');

  check('submitAssignment: empty content is rejected', await (async () => {
    try { await submitAssignment(env, { userId: 'usr_enrolled', learningItemId: 'itm_assign', content: '  ' }); return false; } catch (e) { return e instanceof ValidationError; }
  })());

  const graded = await gradeAssignment(env, { gradedBy: 'usr_staff', submissionId: submission.id, grade: 0.85, feedback: 'Well done.' });
  check('gradeAssignment: returns the graded result', graded.status === 'graded' && graded.grade === 0.85);
  const progressAfterGrade = await db.prepare(`SELECT * FROM unit_progress WHERE user_id = 'usr_enrolled' AND unit_id = 'unt_2'`).first();
  check('gradeAssignment: a passing grade marks the unit completed', progressAfterGrade.status === 'completed');

  check('gradeAssignment: out-of-range grade throws ValidationError', await (async () => {
    try { await gradeAssignment(env, { gradedBy: 'usr_staff', submissionId: submission.id, grade: 1.5 }); return false; } catch (e) { return e instanceof ValidationError; }
  })());
  check('gradeAssignment: unknown submission id throws NotFoundError', await (async () => {
    try { await gradeAssignment(env, { gradedBy: 'usr_staff', submissionId: 'asub_missing', grade: 0.5 }); return false; } catch (e) { return e instanceof NotFoundError; }
  })());
}

// A below-threshold grade must NOT mark the unit completed.
{
  db.prepare(`INSERT INTO learning_items (id, unit_id, sequence, kind, title) VALUES ('itm_assign2', 'unt_2', 2, 'assignment', 'Essay 2')`).run();
  const sub2 = await submitAssignment(env, { userId: 'usr_outside', learningItemId: 'itm_assign2', content: 'x' }).catch((e) => e);
  check('submitAssignment: still enforces level access (usr_outside is not enrolled in Level I)', sub2 instanceof AuthorizationError);

  db.prepare(`INSERT INTO enrolments (id, user_id, level_id, status, started_at) VALUES ('enr_o1', 'usr_outside', 1, 'active', '2026-01-01T00:00:00.000Z')`).run();
  const sub3 = await submitAssignment(env, { userId: 'usr_outside', learningItemId: 'itm_assign2', content: 'x' });
  await gradeAssignment(env, { gradedBy: 'usr_staff', submissionId: sub3.id, grade: 0.3 });
  const progress = await db.prepare(`SELECT * FROM unit_progress WHERE user_id = 'usr_outside' AND unit_id = 'unt_2'`).first();
  check('gradeAssignment: a failing grade leaves the unit in_progress, not completed', progress.status === 'in_progress');
}

// --- Live sessions ---
const sessions = await listLiveSessions(env, { userId: 'usr_enrolled', levelId: 1 });
check('listLiveSessions: returns the seeded session', sessions.length === 1 && sessions[0].id === 'lsn_1' && sessions[0].joinUrl === 'https://example.com/join');

// --- Authorization boundary on the HTTP layer ---
const noAuthReq = new Request('http://x/api/lms/units?levelId=1');
check('units endpoint: no Authorization header -> 401', (await unitsEndpoint({ request: noAuthReq, env })).status === 401);
const noAuthGradeReq = new Request('http://x/api/lms/grade-assignment', { method: 'POST', body: JSON.stringify({ submissionId: 'x', grade: 0.5 }) });
check('grade-assignment endpoint: no Authorization header -> 401', (await gradeEndpoint({ request: noAuthGradeReq, env })).status === 401);

console.log(`\n${pass} passed, ${fail} failed.`);
process.exit(fail ? 1 : 0);
