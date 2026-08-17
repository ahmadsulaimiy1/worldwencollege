// Level-completion and progressive-unlock logic — Executive Decision
// #1: a student who pays for the full programme up front gets the
// financial benefit immediately, but each level's access still unlocks
// only once the level before it is actually completed.
//
// completeLevel() is the single place that decision is implemented.
// Today it's called only from functions/api/lms/complete-level.js,
// which is staff-only — AIPC has no automated grading/completion
// engine yet, so a human confirms a level is finished. Once the LMS's
// own assessment engine exists (quiz pass thresholds, assignment
// grading — see docs/lms-architecture.md, Milestone 2+), that engine
// can call this same function programmatically instead of a human;
// nothing about the unlock logic itself needs to change.

import { db, newId, nowIso, NotFoundError, ValidationError } from '../db.js';
import { getConfigJson } from '../config.js';

export async function completeLevel(env, { userId, levelId }) {
  const enrolment = await db(env)
    .prepare('SELECT * FROM enrolments WHERE user_id = ? AND level_id = ?')
    .bind(userId, levelId)
    .first();
  if (!enrolment) throw new NotFoundError('No enrolment found for that student and level.');
  if (enrolment.status === 'completed') {
    return { enrolment: toEnrolmentResponse(enrolment), nextLevelUnlocked: null }; // idempotent
  }
  if (enrolment.status !== 'active') {
    throw new ValidationError(`Enrolment is "${enrolment.status}", not "active" — cannot mark it completed.`, { status: enrolment.status });
  }

  const completedAt = nowIso();
  await db(env)
    .prepare(`UPDATE enrolments SET status = 'completed', completed_at = ? WHERE id = ?`)
    .bind(completedAt, enrolment.id)
    .run();

  let nextLevelUnlocked = null;
  const nextLevel = await db(env).prepare('SELECT * FROM programme_levels WHERE id = ?').bind(levelId + 1).first();
  if (nextLevel) {
    const unlockMode = await getConfigJson(env, 'full_programme_unlock_mode', { required: false });
    if (unlockMode === 'progressive') {
      const fullPayment = await db(env)
        .prepare(`SELECT id FROM payments WHERE user_id = ? AND kind = 'full_programme' AND status = 'succeeded' LIMIT 1`)
        .bind(userId)
        .first();
      if (fullPayment) {
        const existingNext = await db(env)
          .prepare('SELECT * FROM enrolments WHERE user_id = ? AND level_id = ?')
          .bind(userId, nextLevel.id)
          .first();
        if (!existingNext) {
          const nextId = newId('enr');
          await db(env)
            .prepare(`INSERT INTO enrolments (id, user_id, application_id, level_id, status, started_at)
              VALUES (?, ?, NULL, ?, 'active', ?)`)
            .bind(nextId, userId, nextLevel.id, nowIso())
            .run();
          nextLevelUnlocked = { id: nextId, levelId: nextLevel.id, levelName: nextLevel.name };
        }
      }
    }
  }

  const updated = await db(env).prepare('SELECT * FROM enrolments WHERE id = ?').bind(enrolment.id).first();
  return { enrolment: toEnrolmentResponse(updated), nextLevelUnlocked };
}

function toEnrolmentResponse(row) {
  return {
    id: row.id,
    userId: row.user_id,
    applicationId: row.application_id,
    levelId: row.level_id,
    status: row.status,
    startedAt: row.started_at,
    completedAt: row.completed_at,
  };
}
