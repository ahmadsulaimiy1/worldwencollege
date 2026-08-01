// Run with: node --experimental-sqlite tests/curriculum-level-1.test.mjs
// Proves the real, authored Level I / Module 1 curriculum
// (sql/seed-curriculum-level-1.sql — see docs/curriculum-level-1-foundation.md)
// actually functions through the live LMS endpoints/logic
// (functions/_lib/lms/content.js), not just exists as prose. This is
// the "verified through testing" half of the Executive Directive's
// curriculum-first instruction — content without a working platform
// behind it isn't a completed feature.
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

// --- The real Module 1 loads via listUnits for Level I ---
// Level I now has all 10 modules seeded (see
// tests/curriculum-level-1-complete.test.mjs for the full-level sweep)
// — this file stays focused on Module 1 specifically, so it checks
// Module 1 is present and correct rather than assuming it's the only
// module.
const units = await listUnits(env, { userId: 'usr_student', levelId: 1 });
const module1 = units.find((u) => u.id === 'unt_l1_m1');
check('Level I includes the real seeded Module 1 (not a placeholder)', module1 && module1.title === 'Module 1: Meeting People' && module1.sequence === 1);

// --- Full unit detail: real lessons, real quiz (no leaked answers), real assignment ---
const detail = await getUnitDetail(env, { userId: 'usr_student', unitId: 'unt_l1_m1' });
check('Module 1 has all 5 real learning items in sequence', detail.items.length === 5);
check('Item 1 is the real module overview reading', detail.items[0].id === 'itm_l1_m1_overview' && detail.items[0].body.includes('Key phrases introduced this module'));
check('Item 2 is the real Lesson 1.1 with actual lesson-plan content', detail.items[1].id === 'itm_l1_m1_lesson1' && detail.items[1].body.includes('LEARNING OBJECTIVES') && detail.items[1].body.includes('Hello! My name is Sofia'));
check('Item 3 is the real Lesson 1.2', detail.items[2].id === 'itm_l1_m1_lesson2' && detail.items[2].body.includes('Where are you from?'));

const quizItem = detail.items.find((i) => i.id === 'itm_l1_m1_quiz');
check('The real quiz has all 8 authored questions', quizItem.questions.length === 8);
check('Quiz question 1 is the real authored prompt', quizItem.questions[0].prompt === '"___ name is Sofia."');
check('Quiz choices are real, and the correct answer is never leaked to the client', quizItem.questions[0].choices.includes('My') && !('correctIndex' in quizItem.questions[0]));

const assignmentItem = detail.items.find((i) => i.id === 'itm_l1_m1_assignment');
check('The real assignment carries its actual instructions', assignmentItem.body.includes('Record yourself') && assignmentItem.body.includes('30-60 seconds'));

// --- Submitting the REAL quiz with the REAL correct answers scores 100% ---
{
  // Correct-index answer key, taken directly from
  // sql/seed-curriculum-level-1.sql — proves the seeded correct_index
  // values actually match the questions as authored, not just that
  // scoring logic works in the abstract.
  const correctAnswers = [1, 0, 2, 0, 2, 1, 1, 2];
  const attempt = await submitQuizAttempt(env, { userId: 'usr_student', learningItemId: 'itm_l1_m1_quiz', answers: correctAnswers });
  check('The real Module 1 quiz, answered correctly, scores 100%', attempt.score === 1 && attempt.passed === true);

  const progress = db.prepare(`SELECT * FROM unit_progress WHERE user_id = 'usr_student' AND unit_id = 'unt_l1_m1'`).first();
  check('A perfect score on the real quiz marks the real Module 1 unit completed', progress.status === 'completed');
}

// --- A student who gets most of the real quiz wrong does not pass ---
{
  db.prepare(`INSERT INTO users (id, auth_provider, auth_provider_id, email, role) VALUES ('usr_other', 'clerk', 'sub_other', 'other@example.com', 'student')`).run();
  db.prepare(`INSERT INTO enrolments (id, user_id, level_id, status, started_at) VALUES ('enr_other_l1', 'usr_other', 1, 'active', '2026-01-01T00:00:00.000Z')`).run();
  const wrongAnswers = [0, 1, 0, 1, 0, 0, 0, 0]; // mostly wrong against the real key
  const attempt = await submitQuizAttempt(env, { userId: 'usr_other', learningItemId: 'itm_l1_m1_quiz', answers: wrongAnswers });
  check('A mostly-wrong attempt against the real answer key does not pass', attempt.passed === false && attempt.score < 0.7);
}

// --- The real assignment: submit, then a real staff grade marks the module complete ---
{
  const submission = await submitAssignment(env, { userId: 'usr_student', learningItemId: 'itm_l1_m1_assignment', content: 'Recording link: https://example.com/recordings/sofia-intro.mp3' });
  check('The real speaking assignment accepts a real submission', submission.status === 'submitted');

  const graded = await gradeAssignment(env, { gradedBy: 'usr_staff', submissionId: submission.id, grade: 0.9, feedback: 'Clear, confident delivery. All four required elements present.' });
  check('Staff can grade the real submission against the rubric described in the assignment', graded.status === 'graded' && graded.grade === 0.9);
}

console.log(`\n${pass} passed, ${fail} failed.`);
process.exit(fail ? 1 : 0);
