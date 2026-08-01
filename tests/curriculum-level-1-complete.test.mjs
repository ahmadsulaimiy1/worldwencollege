// Run with: node --experimental-sqlite tests/curriculum-level-1-complete.test.mjs
// Covers all 10 modules of the completed Level I curriculum (see
// docs/curriculum-level-1-foundation.md and docs/curriculum/level-1/).
// tests/curriculum-level-1.test.mjs already does a deep, hand-verified
// check of Module 1 specifically (its correct quiz answers are
// hardcoded there, independently of the seed file, as the strongest
// possible check against a transcription error). This file instead
// sweeps all 10 modules structurally and functionally: every module
// loads, every quiz's own seeded correct_index values score 100% when
// submitted (proving the scoring pipeline and the seed data are
// mutually consistent across the whole level, not just Module 1), no
// quiz ever leaks its answer key to the client, and every module's
// assignment can be submitted and graded to completion.
import { readFileSync } from 'node:fs';
import { makeD1 } from './d1-shim.mjs';
import { ROOT, loadUrl } from './helpers.mjs';

const schema = readFileSync(`${ROOT}/sql/schema.sql`, 'utf8');
const curriculumSeed = readFileSync(`${ROOT}/sql/seed-curriculum-level-1.sql`, 'utf8');
const env = { DB: makeD1(schema + '\n' + curriculumSeed) };
const db = env.DB;

const { listUnits, getUnitDetail, submitQuizAttempt, submitAssignment, gradeAssignment } = await import(loadUrl('functions/_lib/lms/content.js'));

let pass = 0, fail = 0;
function check(label, cond) { console.log((cond ? 'PASS ' : 'FAIL ') + label); cond ? pass++ : fail++; }

db.prepare(`INSERT INTO users (id, auth_provider, auth_provider_id, email, role) VALUES ('usr_student', 'clerk', 'sub_student', 'student@example.com', 'student')`).run();
db.prepare(`INSERT INTO users (id, auth_provider, auth_provider_id, email, role) VALUES ('usr_staff', 'clerk', 'sub_staff', 'staff@example.com', 'staff')`).run();
db.prepare(`INSERT INTO enrolments (id, user_id, level_id, status, started_at) VALUES ('enr_student_l1', 'usr_student', 1, 'active', '2026-01-01T00:00:00.000Z')`).run();

// --- Structural: all 10 modules present, in order ---
const units = await listUnits(env, { userId: 'usr_student', levelId: 1 });
check('Level I has exactly 10 modules', units.length === 10);
check('Modules are in the correct sequence order', units.every((u, i) => u.sequence === i + 1));
check('Module 10 is Review & Consolidation (the level exam)', units[9].title === 'Module 10: Review & Consolidation');

const expectedQuizCounts = { 1: 8, 2: 8, 3: 8, 4: 8, 5: 8, 6: 8, 7: 8, 8: 8, 9: 8, 10: 20 };

let totalQuestionsChecked = 0;
let totalAssignmentsGraded = 0;

for (const unit of units) {
  const moduleNum = unit.sequence;
  const detail = await getUnitDetail(env, { userId: 'usr_student', unitId: unit.id });
  check(`Module ${moduleNum}: has at least one reading, one quiz, and one assignment`,
    detail.items.some((i) => i.kind === 'reading') && detail.items.some((i) => i.kind === 'quiz') && detail.items.some((i) => i.kind === 'assignment'));

  const quizItem = detail.items.find((i) => i.kind === 'quiz');
  const expectedCount = expectedQuizCounts[moduleNum];
  check(`Module ${moduleNum}: quiz has the expected ${expectedCount} questions`, quizItem.questions.length === expectedCount);
  check(`Module ${moduleNum}: quiz never leaks the correct answer to the client`,
    quizItem.questions.every((q) => !('correctIndex' in q) && !('correct_index' in q) && Array.isArray(q.choices) && q.choices.length === 4));

  // Fetch the REAL seeded correct answers directly from the DB (the
  // one place they legitimately exist) and submit exactly those —
  // proving the seeded answer key and the live scoring logic agree,
  // for every question in every module, not just a hand-picked sample.
  const seededQuestions = db.prepare('SELECT correct_index FROM quiz_questions WHERE learning_item_id = ? ORDER BY sequence ASC').bind(quizItem.id).all().results;
  const correctAnswers = seededQuestions.map((q) => q.correct_index);
  const perfectAttempt = await submitQuizAttempt(env, { userId: 'usr_student', learningItemId: quizItem.id, answers: correctAnswers });
  check(`Module ${moduleNum}: submitting the real seeded correct answers scores 100%`, perfectAttempt.score === 1 && perfectAttempt.passed === true);
  totalQuestionsChecked += correctAnswers.length;

  const progress = db.prepare('SELECT status FROM unit_progress WHERE user_id = ? AND unit_id = ?').bind('usr_student', unit.id).first();
  check(`Module ${moduleNum}: a perfect quiz score marks the module completed`, progress && progress.status === 'completed');

  // Every module's assignment can be submitted and graded to a passing outcome.
  const assignmentItem = detail.items.find((i) => i.kind === 'assignment');
  const submission = await submitAssignment(env, { userId: 'usr_student', learningItemId: assignmentItem.id, content: `Real submission content for Module ${moduleNum}'s assignment.` });
  check(`Module ${moduleNum}: assignment accepts a real submission`, submission.status === 'submitted');
  const graded = await gradeAssignment(env, { gradedBy: 'usr_staff', submissionId: submission.id, grade: 0.85, feedback: 'Strong work.' });
  check(`Module ${moduleNum}: assignment can be graded by staff`, graded.status === 'graded' && graded.grade === 0.85);
  totalAssignmentsGraded++;
}

check('Every quiz question across all 10 modules was verified against its real seeded answer key', totalQuestionsChecked === 92);
check('Every one of the 10 modules has a gradable assignment', totalAssignmentsGraded === 10);

// --- A wrong attempt on the final mock exam correctly fails, not a false pass ---
{
  db.prepare(`INSERT INTO users (id, auth_provider, auth_provider_id, email, role) VALUES ('usr_weak', 'clerk', 'sub_weak', 'weak@example.com', 'student')`).run();
  db.prepare(`INSERT INTO enrolments (id, user_id, level_id, status, started_at) VALUES ('enr_weak_l1', 'usr_weak', 1, 'active', '2026-01-01T00:00:00.000Z')`).run();
  const mockExamQuiz = db.prepare(`SELECT id FROM learning_items WHERE id = 'itm_l1_m10_examquiz'`).first();
  const wrongAnswers = Array(20).fill(3); // deliberately mostly/all wrong against the real key
  const attempt = await submitQuizAttempt(env, { userId: 'usr_weak', learningItemId: mockExamQuiz.id, answers: wrongAnswers });
  check('A weak attempt on the Level I mock exam does not falsely pass', attempt.passed === false);
}

console.log(`\n${pass} passed, ${fail} failed.`);
process.exit(fail ? 1 : 0);
