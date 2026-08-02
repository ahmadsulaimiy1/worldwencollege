// Run with: node --experimental-sqlite tests/curriculum-level-3.test.mjs
// Covers Level III (Intermediate Programme, B1) — currently Modules
// 1-6 (see docs/curriculum-level-3-intermediate.md's module map;
// Modules 7-10 are mapped but not yet authored/seeded). Same pattern
// as tests/curriculum-level-2.test.mjs: sweep every seeded module,
// submit each quiz's own real seeded correct answers (read directly
// from the DB, not hand-copied), confirm a perfect score, no leaked
// answer key, and that assignments can be submitted and graded.
import { readFileSync } from 'node:fs';
import { makeD1 } from './d1-shim.mjs';
import { ROOT, loadUrl } from './helpers.mjs';

const schema = readFileSync(`${ROOT}/sql/schema.sql`, 'utf8');
const curriculumSeed = readFileSync(`${ROOT}/sql/seed-curriculum-level-3.sql`, 'utf8');
const env = { DB: makeD1(schema + '\n' + curriculumSeed) };
const db = env.DB;

const { listUnits, getUnitDetail, submitQuizAttempt, submitAssignment, gradeAssignment } = await import(loadUrl('functions/_lib/lms/content.js'));

let pass = 0, fail = 0;
function check(label, cond) { console.log((cond ? 'PASS ' : 'FAIL ') + label); cond ? pass++ : fail++; }

db.prepare(`INSERT INTO users (id, auth_provider, auth_provider_id, email, role) VALUES ('usr_student', 'clerk', 'sub_student', 'student@example.com', 'student')`).run();
db.prepare(`INSERT INTO users (id, auth_provider, auth_provider_id, email, role) VALUES ('usr_staff', 'clerk', 'sub_staff', 'staff@example.com', 'staff')`).run();
db.prepare(`INSERT INTO enrolments (id, user_id, level_id, status, started_at) VALUES ('enr_student_l3', 'usr_student', 3, 'active', '2026-01-01T00:00:00.000Z')`).run();

const units = await listUnits(env, { userId: 'usr_student', levelId: 3 });
check('Level III has the 6 modules built so far (Modules 1-6)', units.length === 6);
check('Modules are in the correct sequence order', units.every((u, i) => u.sequence === i + 1));
const expectedTitles = {
  1: 'Module 1: Present Perfect & Life Experience',
  2: 'Module 2: Education & Learning',
  3: 'Module 3: Work, Careers & Entrepreneurship',
  4: 'Module 4: Opinions & Debate',
  5: 'Module 5: Environment, Ethics & Global Citizenship',
  6: 'Module 6: Technology & Media',
};
for (const unit of units) {
  check(`Module ${unit.sequence} title is correct`, unit.title === expectedTitles[unit.sequence]);
}

const expectedQuizCounts = { 1: 10, 2: 10, 3: 10, 4: 10, 5: 10, 6: 10 };
let totalQuestionsChecked = 0;

for (const unit of units) {
  const moduleNum = unit.sequence;
  const detail = await getUnitDetail(env, { userId: 'usr_student', unitId: unit.id });
  check(`Module ${moduleNum}: has at least one reading, one quiz, and one assignment`,
    detail.items.some((i) => i.kind === 'reading') && detail.items.some((i) => i.kind === 'quiz') && detail.items.some((i) => i.kind === 'assignment'));

  const quizItem = detail.items.find((i) => i.kind === 'quiz');
  check(`Module ${moduleNum}: quiz has the expected ${expectedQuizCounts[moduleNum]} questions`, quizItem.questions.length === expectedQuizCounts[moduleNum]);
  check(`Module ${moduleNum}: quiz never leaks the correct answer to the client`,
    quizItem.questions.every((q) => !('correctIndex' in q) && !('correct_index' in q) && Array.isArray(q.choices) && q.choices.length === 4));

  const seededQuestions = db.prepare('SELECT correct_index FROM quiz_questions WHERE learning_item_id = ? ORDER BY sequence ASC').bind(quizItem.id).all().results;
  const correctAnswers = seededQuestions.map((q) => q.correct_index);
  const perfectAttempt = await submitQuizAttempt(env, { userId: 'usr_student', learningItemId: quizItem.id, answers: correctAnswers });
  check(`Module ${moduleNum}: submitting the real seeded correct answers scores 100%`, perfectAttempt.score === 1 && perfectAttempt.passed === true);
  totalQuestionsChecked += correctAnswers.length;

  const progress = db.prepare('SELECT status FROM unit_progress WHERE user_id = ? AND unit_id = ?').bind('usr_student', unit.id).first();
  check(`Module ${moduleNum}: a perfect quiz score marks the module completed`, progress && progress.status === 'completed');

  const assignmentItem = detail.items.find((i) => i.kind === 'assignment');
  const submission = await submitAssignment(env, { userId: 'usr_student', learningItemId: assignmentItem.id, content: `Real submission content for Module ${moduleNum}'s assignment.` });
  check(`Module ${moduleNum}: assignment accepts a real submission`, submission.status === 'submitted');
  const graded = await gradeAssignment(env, { gradedBy: 'usr_staff', submissionId: submission.id, grade: 0.85, feedback: 'Strong discourse coherence and communicative competence.' });
  check(`Module ${moduleNum}: assignment can be graded by staff`, graded.status === 'graded' && graded.grade === 0.85);
}

check('Every quiz question across all built Level III modules was verified against its real seeded answer key', totalQuestionsChecked === 60);

// --- A weak attempt correctly fails, not a false pass (Module 1's quiz) ---
{
  db.prepare(`INSERT INTO users (id, auth_provider, auth_provider_id, email, role) VALUES ('usr_weak', 'clerk', 'sub_weak', 'weak@example.com', 'student')`).run();
  db.prepare(`INSERT INTO enrolments (id, user_id, level_id, status, started_at) VALUES ('enr_weak_l3', 'usr_weak', 3, 'active', '2026-01-01T00:00:00.000Z')`).run();
  const wrongAnswers = Array(10).fill(3);
  const attempt = await submitQuizAttempt(env, { userId: 'usr_weak', learningItemId: 'itm_l3_m1_quiz', answers: wrongAnswers });
  check("A weak attempt on Module 1's quiz does not falsely pass", attempt.passed === false);
}

console.log(`\n${pass} passed, ${fail} failed.`);
process.exit(fail ? 1 : 0);
