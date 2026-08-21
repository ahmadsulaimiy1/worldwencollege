// Level-completion and progressive-unlock logic — Executive Decision
// #1: a student who pays for the full programme up front gets the
// financial benefit immediately, but each level's access still unlocks
// only once the level before it is actually completed.
//
// completeLevel() is the single place that decision is implemented.
// It is called from functions/api/lms/complete-level.js, which is
// staff-only, because `level.gate.staff_confirmation` is a published
// regulation: "There is no automated grading engine and the College
// does not imply one; a member of academic staff confirms completion,
// and that confirmation is what opens the next level."
//
// ─────────────────────────────────────────────────────────────────────
// WHAT A STAFF CONFIRMATION IS, AND WHAT IT IS NOT, since 21 Aug 2026
// ─────────────────────────────────────────────────────────────────────
// It used to be everything. This function marked an enrolment
// `completed` on instruction alone and checked no academic gate at all
// — recorded in data/academic-regulations.json as
// `conformance.level_mark`, whose consequence line read "the gates
// exist as regulation and not yet as code".
//
// They are code now. `level_mark.gates` lists six conditions and
// `level.gate_precedence` says every one of them is necessary: "A level
// mark of 92 with an examination at 68 is not a Distinction and is not
// an award." A confirmation is the SIXTH gate, not a substitute for the
// other five, and a platform that let one member of staff stand in for
// all six would be publishing a progression the regulations do not
// define — the identical fault closed in functions/_lib/lms/content.js
// the day before this one.
//
// The gate is read from functions/_lib/academic/standing.js, which is
// the single engine that already computes these conditions for the
// learner's own record, the graduate profile and the Registrar's
// screens. Two implementations of "is this level finished" would
// eventually disagree, and the one that disagreed loudest would be the
// one a learner read.
//
// TWO THINGS IT DELIBERATELY DOES NOT DO.
//
// It does not block on a condition the COLLEGE owes. `condition.owner`
// carries that half, and today four examination gates and the skill
// mappings are recorded nowhere in the schema — so they are `met: null`
// and owned by the College. Refusing a completion because the platform
// has not built the table that would record an examination would put
// the College's unfinished work on the learner's record as their
// shortfall. That distinction is `graduationPosition`'s `conditional`
// state and it is honoured here rather than re-argued.
//
// It does not offer an override. There is no `force` flag and no
// `reason` field that waives a gate, because `level.gate_precedence`
// admits none; a gate that can be waived by whoever is confirming is
// not a gate. What the refusal does carry is the exact list of what is
// outstanding, so the member of staff is told what to do rather than
// told no.

import { db, newId, nowIso, NotFoundError, ValidationError } from '../db.js';
import { getConfigJson } from '../config.js';
import { computeLearnerStanding } from '../academic/standing.js';

/**
 * What stands between this learner and this level being finished.
 *
 * Exported because the refusal is only half useful inside the refusal:
 * a Registrar looking at a learner before confirming anything should be
 * able to see the same list, in the same words, without provoking an
 * error to read it.
 *
 * `blocking` is the learner-owed subset, minus the staff confirmation
 * itself — that gate IS the act being performed, and a function that
 * refused to confirm because nobody had confirmed would never complete
 * a level at all.
 */
export async function levelGateReport(env, { userId, levelId }) {
  const report = await computeLearnerStanding(env, userId);
  const level = report.levels.find((l) => l.levelId === levelId) || null;
  if (!level) {
    return {
      levelId, known: false, blocking: [], awaitingCollege: [], conditions: [],
      statement: 'This learner has no record at that level, so no gate can be read against it.',
    };
  }
  const conditions = level.graduation.conditions
    .filter((c) => c.id !== 'level.gate.staff_confirmation');
  const blocking = conditions.filter((c) => c.met !== true && c.owner === 'learner');
  const awaitingCollege = conditions.filter((c) => c.met !== true && c.owner === 'college');
  return {
    levelId,
    known: true,
    blocking,
    awaitingCollege,
    conditions,
    moduleSummary: level.moduleSummary,
    regulationVersion: report.regulationVersion,
    statement: blocking.length
      ? `${blocking.length} condition${blocking.length === 1 ? '' : 's'} of the level award ${blocking.length === 1 ? 'is' : 'are'} outstanding with the learner.`
      : (awaitingCollege.length
        ? `Everything asked of the learner at this level is met. ${awaitingCollege.length} condition${awaitingCollege.length === 1 ? ' is' : 's are'} a record the College has not yet made.`
        : 'Every condition of the level award is met.'),
  };
}

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

  // The other five gates of `level_mark.gates`, read from the one
  // engine that computes them. See the head of this file for why they
  // are checked here, why only the learner-owed ones refuse, and why
  // there is no way to wave them through.
  const gate = await levelGateReport(env, { userId, levelId });
  if (gate.blocking.length) {
    throw new ValidationError(
      `This level cannot be confirmed as finished: ${gate.blocking.map((c) => `${c.label} — ${c.detail}`).join(' · ')}`,
      Object.fromEntries(gate.blocking.map((c) => [c.id, c.detail])),
    );
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
