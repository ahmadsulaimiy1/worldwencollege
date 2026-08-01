// LMS content/assessment logic — pure query/business logic, no HTTP
// concerns, same split as functions/_lib/student/dashboard.js and
// functions/_lib/reports/*. Every function here is directly
// fixture-testable against the real SQLite engine (see
// tests/lms-content.test.mjs) without a Clerk token.
//
// Access rule, applied consistently: a student can see/submit against
// a unit only if they hold an 'active' or 'completed' enrolment for
// that unit's level — never for a level they haven't reached, even a
// later one they'll unlock automatically once they finish the one
// they're on (see functions/_lib/student/progression.js). Staff
// bypass this (see gradeAssignment, and the read endpoints' own
// staff-view path) since they legitimately need to see any student's
// work to grade it.

import { db, newId, nowIso, NotFoundError, ValidationError } from '../db.js';
import { AuthorizationError } from '../auth/session.js';
import { getConfigJson } from '../config.js';

async function assertLevelAccess(env, userId, levelId) {
  const enrolment = await db(env)
    .prepare(`SELECT id FROM enrolments WHERE user_id = ? AND level_id = ? AND status IN ('active','completed')`)
    .bind(userId, levelId)
    .first();
  if (!enrolment) throw new AuthorizationError('You are not enrolled in this programme level.');
}

async function getLevelIdForUnit(env, unitId) {
  const row = await db(env)
    .prepare(`SELECT c.level_id as levelId FROM units u JOIN courses c ON c.id = u.course_id WHERE u.id = ?`)
    .bind(unitId)
    .first();
  return row ? row.levelId : null;
}

export async function listUnits(env, { userId, levelId }) {
  await assertLevelAccess(env, userId, levelId);
  const { results } = await db(env)
    .prepare(`SELECT u.id, u.sequence, u.title,
        COALESCE(p.status, 'not_started') as progressStatus, p.completed_at as completedAt
      FROM units u
      JOIN courses c ON c.id = u.course_id
      LEFT JOIN unit_progress p ON p.unit_id = u.id AND p.user_id = ?
      WHERE c.level_id = ?
      ORDER BY u.sequence ASC`)
    .bind(userId, levelId)
    .all();
  return results;
}

export async function getUnitDetail(env, { userId, unitId }) {
  const unit = await db(env).prepare('SELECT * FROM units WHERE id = ?').bind(unitId).first();
  if (!unit) throw new NotFoundError('Unknown unit.');
  const levelId = await getLevelIdForUnit(env, unitId);
  await assertLevelAccess(env, userId, levelId);

  const { results: items } = await db(env)
    .prepare('SELECT id, sequence, kind, title, body FROM learning_items WHERE unit_id = ? ORDER BY sequence ASC')
    .bind(unitId)
    .all();

  for (const item of items) {
    if (item.kind === 'quiz') {
      // Never send correct_index to the client — see submitQuizAttempt
      // for where grading actually happens, server-side only.
      const { results: questions } = await db(env)
        .prepare('SELECT id, sequence, prompt, choices_json as choicesJson FROM quiz_questions WHERE learning_item_id = ? ORDER BY sequence ASC')
        .bind(item.id)
        .all();
      item.questions = questions.map(({ choicesJson, ...q }) => ({ ...q, choices: JSON.parse(choicesJson) }));
    } else if (item.kind === 'assignment') {
      item.mySubmission = await db(env)
        .prepare('SELECT id, status, grade, feedback, submitted_at as submittedAt, graded_at as gradedAt FROM assignment_submissions WHERE learning_item_id = ? AND user_id = ? ORDER BY submitted_at DESC LIMIT 1')
        .bind(item.id, userId)
        .first();
    }
  }

  const progress = await db(env).prepare('SELECT status, completed_at as completedAt FROM unit_progress WHERE unit_id = ? AND user_id = ?').bind(unitId, userId).first();
  return {
    id: unit.id,
    title: unit.title,
    sequence: unit.sequence,
    progressStatus: progress ? progress.status : 'not_started',
    completedAt: progress ? progress.completedAt : null,
    items,
  };
}

// Never downgrades a unit already marked 'completed' — a lower-scoring
// quiz retake or a re-submitted assignment doesn't erase a prior pass.
async function upsertUnitProgress(env, { userId, unitId, status, completedAt = null }) {
  const existing = await db(env).prepare('SELECT * FROM unit_progress WHERE user_id = ? AND unit_id = ?').bind(userId, unitId).first();
  if (existing) {
    if (existing.status === 'completed') return; // idempotent, never regresses
    await db(env).prepare('UPDATE unit_progress SET status = ?, completed_at = ? WHERE id = ?').bind(status, completedAt, existing.id).run();
    return;
  }
  await db(env)
    .prepare('INSERT INTO unit_progress (id, user_id, unit_id, status, completed_at) VALUES (?, ?, ?, ?, ?)')
    .bind(newId('uprg'), userId, unitId, status, completedAt)
    .run();
}

export async function submitQuizAttempt(env, { userId, learningItemId, answers }) {
  const item = await db(env).prepare('SELECT * FROM learning_items WHERE id = ?').bind(learningItemId).first();
  if (!item || item.kind !== 'quiz') throw new NotFoundError('Unknown quiz.');
  const levelId = await getLevelIdForUnit(env, item.unit_id);
  await assertLevelAccess(env, userId, levelId);

  const { results: questions } = await db(env)
    .prepare('SELECT id, correct_index as correctIndex FROM quiz_questions WHERE learning_item_id = ? ORDER BY sequence ASC')
    .bind(learningItemId)
    .all();
  if (questions.length === 0) throw new ValidationError('This quiz has no questions yet.', {});
  if (!Array.isArray(answers) || answers.length !== questions.length) {
    throw new ValidationError(`Expected ${questions.length} answers.`, { answers: 'Length mismatch' });
  }

  const correctCount = questions.reduce((n, q, i) => n + (answers[i] === q.correctIndex ? 1 : 0), 0);
  const score = correctCount / questions.length;
  const submittedAt = nowIso();
  const attemptId = newId('qat');
  await db(env)
    .prepare('INSERT INTO quiz_attempts (id, learning_item_id, user_id, answers_json, score, submitted_at) VALUES (?, ?, ?, ?, ?, ?)')
    .bind(attemptId, learningItemId, userId, JSON.stringify(answers), score, submittedAt)
    .run();

  const passThreshold = await getConfigJson(env, 'lms_pass_threshold', { required: false }) ?? 0.7;
  if (score >= passThreshold) {
    await upsertUnitProgress(env, { userId, unitId: item.unit_id, status: 'completed', completedAt: submittedAt });
  } else {
    await upsertUnitProgress(env, { userId, unitId: item.unit_id, status: 'in_progress' });
  }

  return { id: attemptId, score, correctCount, totalQuestions: questions.length, passed: score >= passThreshold, submittedAt };
}

export async function submitAssignment(env, { userId, learningItemId, content }) {
  const item = await db(env).prepare('SELECT * FROM learning_items WHERE id = ?').bind(learningItemId).first();
  if (!item || item.kind !== 'assignment') throw new NotFoundError('Unknown assignment.');
  if (!content || !String(content).trim()) throw new ValidationError('content is required.', { content: 'Required' });
  const levelId = await getLevelIdForUnit(env, item.unit_id);
  await assertLevelAccess(env, userId, levelId);

  const submissionId = newId('asub');
  const submittedAt = nowIso();
  await db(env)
    .prepare('INSERT INTO assignment_submissions (id, learning_item_id, user_id, content, status, submitted_at) VALUES (?, ?, ?, ?, ?, ?)')
    .bind(submissionId, learningItemId, userId, content, 'submitted', submittedAt)
    .run();

  await upsertUnitProgress(env, { userId, unitId: item.unit_id, status: 'in_progress' });
  return { id: submissionId, status: 'submitted', submittedAt };
}

// Staff-only — see functions/api/lms/grade-assignment.js.
export async function gradeAssignment(env, { gradedBy, submissionId, grade, feedback }) {
  if (typeof grade !== 'number' || grade < 0 || grade > 1) {
    throw new ValidationError('grade must be a number between 0 and 1.', { grade: 'Invalid' });
  }
  const submission = await db(env).prepare('SELECT * FROM assignment_submissions WHERE id = ?').bind(submissionId).first();
  if (!submission) throw new NotFoundError('Unknown submission.');

  const gradedAt = nowIso();
  await db(env)
    .prepare('UPDATE assignment_submissions SET status = ?, grade = ?, feedback = ?, graded_at = ?, graded_by = ? WHERE id = ?')
    .bind('graded', grade, feedback || null, gradedAt, gradedBy, submissionId)
    .run();

  const item = await db(env).prepare('SELECT unit_id FROM learning_items WHERE id = ?').bind(submission.learning_item_id).first();
  const passThreshold = await getConfigJson(env, 'lms_pass_threshold', { required: false }) ?? 0.7;
  if (item && grade >= passThreshold) {
    await upsertUnitProgress(env, { userId: submission.user_id, unitId: item.unit_id, status: 'completed', completedAt: gradedAt });
  }

  return { id: submissionId, status: 'graded', grade, feedback: feedback || null, gradedAt };
}

export async function listLiveSessions(env, { userId, levelId }) {
  await assertLevelAccess(env, userId, levelId);
  const { results } = await db(env)
    .prepare('SELECT id, title, starts_at as startsAt, duration_minutes as durationMinutes, join_url as joinUrl, unit_id as unitId FROM live_sessions WHERE level_id = ? ORDER BY starts_at ASC')
    .bind(levelId)
    .all();
  return results;
}
