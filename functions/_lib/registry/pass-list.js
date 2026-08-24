// The pass list — the External Examiner's confirmation, kept separate
// from the conferral it authorises.
//
// Governance C5 (docs/governance-decisions.md, adopted 14 August 2026)
// gives conferral to "the Registrar... acting under a Board-approved
// pass list", specifically so the review and the write are never the
// same act by the same person. The College has no standing Registrar
// appointment yet, so `confer()` below is executed by an administrator
// standing in for that office — the same separation the governance
// decision protects (an examiner cannot confer their own confirmation;
// an admin cannot confer without a prior, real, recorded confirmation
// from someone independent of them) holds either way.
//
// WHAT THIS FILE DELIBERATELY DOES NOT DO: decide who is enrolled,
// grade anything, or invent a mark. Every figure `evidenceFor()` returns
// is read from a table something else already wrote — quiz_attempts,
// assignment_submissions, unit_progress. If a level has no marks yet,
// this says so; it does not estimate one.

import { db, newId, nowIso, NotFoundError, ValidationError } from '../db.js';
import { buildStudyPlan } from '../student/study-plan.js';
import { competencyCoverage } from './profile.js';
import { conferAward } from './awards.js';

/**
 * Every learner whose current level is finished and awaiting a
 * decision, or was decided at a prior sitting and is awaiting
 * conferral. Built from real enrolments, not a queue table — there is
 * no other source of truth for "who has finished" than the study plan
 * itself, and a second copy of that state would drift from it.
 */
export async function getQueue(env) {
  const { results: active } = await db(env)
    .prepare(`SELECT e.user_id AS userId, e.level_id AS levelId, u.email, u.preferred_name AS preferredName,
                     l.roman, l.name AS levelName
       FROM enrolments e
       JOIN users u ON u.id = e.user_id
       JOIN programme_levels l ON l.id = e.level_id
       WHERE e.status = 'active'
       ORDER BY u.email, e.level_id`)
    .all();

  const rows = [];
  for (const enr of active) {
    const plan = await buildStudyPlan(env, enr.userId);
    if (plan.state !== 'units_complete' || !plan.level || plan.level.id !== enr.levelId) continue;

    const award = await db(env)
      .prepare(`SELECT id FROM awards WHERE user_id = ? AND level_id = ? AND status = 'conferred'`)
      .bind(enr.userId, enr.levelId).first();
    if (award) continue; // already has a live award for this level

    const entry = await db(env)
      .prepare(`SELECT id, decision, notes, examiner_id AS examinerId, conferred_award_id AS conferredAwardId,
                       created_at AS createdAt
         FROM pass_list_entries
         WHERE user_id = ? AND level_id = ? AND superseded = 0
         ORDER BY created_at DESC LIMIT 1`)
      .bind(enr.userId, enr.levelId).first();

    rows.push({
      userId: enr.userId, levelId: enr.levelId, email: enr.email, preferredName: enr.preferredName,
      roman: enr.roman, levelName: enr.levelName,
      completedCount: plan.completedCount, totalCount: plan.totalCount,
      pendingDecision: entry || null,
    });
  }
  return { count: rows.length, entries: rows };
}

/**
 * The real evidence for one learner's one level: every mark on record,
 * and the competency-mapping state honestly alongside it — see A6d
 * (docs/governance-decisions.md), adopted as a commissioned piece of
 * work still in progress, not a claim it is finished. The Examiner sees
 * exactly what the graduate's own profile would show, not a rosier
 * summary.
 */
export async function evidenceFor(env, { userId, levelId }) {
  const level = await db(env).prepare('SELECT id, roman, name, cefr FROM programme_levels WHERE id = ?')
    .bind(levelId).first();
  if (!level) throw new NotFoundError('Unknown level.');
  const learner = await db(env).prepare('SELECT id, email, preferred_name AS preferredName FROM users WHERE id = ?')
    .bind(userId).first();
  if (!learner) throw new NotFoundError('Unknown person.');

  const { results: items } = await db(env)
    .prepare(`SELECT i.id, i.kind, i.title, u.sequence AS unitSequence, u.title AS unitTitle
       FROM learning_items i
       JOIN units u ON u.id = i.unit_id
       JOIN courses c ON c.id = u.course_id
       WHERE c.level_id = ? AND i.kind IN ('quiz','assignment')
       ORDER BY u.sequence, i.sequence`)
    .bind(levelId).all();

  const marks = [];
  for (const item of items) {
    if (item.kind === 'quiz') {
      const attempt = await db(env)
        .prepare(`SELECT score FROM quiz_attempts WHERE learning_item_id = ? AND user_id = ?
           ORDER BY submitted_at DESC LIMIT 1`)
        .bind(item.id, userId).first();
      marks.push({
        unitSequence: item.unitSequence, unitTitle: item.unitTitle, kind: 'quiz', title: item.title,
        score: attempt ? attempt.score : null, graded: !!attempt,
      });
    } else {
      const submission = await db(env)
        .prepare(`SELECT grade, status FROM assignment_submissions WHERE learning_item_id = ? AND user_id = ?
           ORDER BY submitted_at DESC LIMIT 1`)
        .bind(item.id, userId).first();
      marks.push({
        unitSequence: item.unitSequence, unitTitle: item.unitTitle, kind: 'assignment', title: item.title,
        score: submission && submission.status === 'graded' ? submission.grade : null,
        graded: !!(submission && submission.status === 'graded'),
      });
    }
  }

  const graded = marks.filter((m) => m.graded && typeof m.score === 'number');
  const overallPct = graded.length ? (graded.reduce((n, m) => n + m.score, 0) / graded.length) * 100 : null;
  const floorPct = graded.length ? Math.min(...graded.map((m) => m.score)) * 100 : null;

  const coverage = await competencyCoverage(env);
  const levelCoverage = coverage.levels.find((l) => l.levelId === levelId) || null;

  const decisions = await db(env)
    .prepare(`SELECT p.id, p.decision, p.notes, p.superseded, p.created_at AS createdAt, p.conferred_award_id AS conferredAwardId,
                     e.email AS examinerEmail
       FROM pass_list_entries p JOIN users e ON e.id = p.examiner_id
       WHERE p.user_id = ? AND p.level_id = ? ORDER BY p.created_at DESC`)
    .bind(userId, levelId).all();

  return {
    learner: { userId: learner.id, email: learner.email, preferredName: learner.preferredName },
    level: { id: level.id, roman: level.roman, name: level.name, cefr: level.cefr },
    marks,
    ungraded: marks.filter((m) => !m.graded).length,
    overallPct, floorPct,
    // Never above 'merit' — Distinction and above require the Level
    // Address (oral) at Distinction, and C3 (adopted 14 August 2026)
    // holds that speaking does not yet count toward certification. This
    // is what that decision means in practice, not a separate rule.
    calculatedHonour: calculateHonour({ overallPct, floorPct }),
    competencyCoverage: levelCoverage,
    decisionHistory: decisions.results,
  };
}

/** See evidenceFor()'s comment above — the C3 ceiling lives here too. */
export function calculateHonour({ overallPct, floorPct }) {
  if (overallPct == null || floorPct == null) return null;
  if (overallPct < 70 || floorPct < 50) return null; // B1/B2: does not meet the pass standard
  if (overallPct >= 80 && floorPct >= 70) return 'merit';
  return 'pass';
}

/**
 * The Examiner's confirmation or decline. Recording it is not
 * conferring anything — see this file's header comment.
 */
export async function recordDecision(env, { examinerId, userId, levelId, decision, notes = null, now = Date.now() }) {
  if (!['confirmed', 'declined'].includes(decision)) {
    throw new ValidationError('decision must be "confirmed" or "declined".', { decision: 'Invalid' });
  }
  const learner = await db(env).prepare('SELECT id FROM users WHERE id = ?').bind(userId).first();
  if (!learner) throw new NotFoundError('Unknown person.');
  const level = await db(env).prepare('SELECT id FROM programme_levels WHERE id = ?').bind(levelId).first();
  if (!level) throw new NotFoundError('Unknown level.');

  await db(env)
    .prepare(`UPDATE pass_list_entries SET superseded = 1
       WHERE user_id = ? AND level_id = ? AND superseded = 0 AND conferred_award_id IS NULL`)
    .bind(userId, levelId).run();

  const id = newId('ple');
  await db(env)
    .prepare(`INSERT INTO pass_list_entries (id, user_id, level_id, examiner_id, decision, notes, created_at)
       VALUES (?, ?, ?, ?, ?, ?, ?)`)
    .bind(id, userId, levelId, examinerId, decision, notes, new Date(now).toISOString())
    .run();
  return { id, userId, levelId, decision };
}

/**
 * The Registrar's act — the only path in this codebase that may call
 * conferAward() outside a test. Requires a real, confirmed, not-yet-
 * conferred pass-list entry; refuses if the learner already holds a
 * live award for this level (one live award per level, same rule the
 * register already enforces); reads the award's title/post-nominal/CEFR
 * from award_definitions rather than accepting them from the caller, so
 * a certificate cannot assert a designation the Board never adopted.
 */
export async function confer(env, { entryId, actorId, now = Date.now() }) {
  const entry = await db(env).prepare('SELECT * FROM pass_list_entries WHERE id = ?').bind(entryId).first();
  if (!entry) throw new NotFoundError('Unknown pass-list entry.');
  if (entry.superseded) throw new ValidationError('This decision has been superseded by a later one.', { entryId: 'Superseded' });
  if (entry.decision !== 'confirmed') {
    throw new ValidationError('Only a confirmed pass-list entry may be conferred.', { decision: 'Not confirmed' });
  }
  if (entry.conferred_award_id) {
    throw new ValidationError('This entry has already been conferred.', { entryId: 'Already conferred' });
  }

  const existing = await db(env)
    .prepare(`SELECT id FROM awards WHERE user_id = ? AND level_id = ? AND status = 'conferred'`)
    .bind(entry.user_id, entry.level_id).first();
  if (existing) throw new ValidationError('This person already holds a live award for this level.', { levelId: 'Already conferred' });

  const def = await db(env).prepare('SELECT * FROM award_definitions WHERE level_id = ?').bind(entry.level_id).first();
  if (!def) throw new NotFoundError('No award definition exists for this level.');
  const learner = await db(env).prepare('SELECT id, preferred_name AS preferredName, email FROM users WHERE id = ?')
    .bind(entry.user_id).first();
  if (!learner) throw new NotFoundError('Unknown person.');

  const evidence = await evidenceFor(env, { userId: entry.user_id, levelId: entry.level_id });
  const honour = evidence.calculatedHonour;
  if (!honour) {
    throw new ValidationError(
      'The recorded marks do not meet the adopted pass standard (70% overall, no mark below 50%) — see docs/governance-decisions.md B1/B2.',
      { honour: 'Below pass standard' },
    );
  }

  // WEC Credits and Total Qualification Time are published, uniform
  // figures — 20 credits and 200 hours per level (pages/faq.html,
  // pages/academics.html) — not invented here.
  const award = await conferAward(env, {
    userId: entry.user_id, levelId: entry.level_id,
    awardTitle: def.official_title, postNominal: def.post_nominal, cefr: def.cefr,
    honour, credits: 20, tqtHours: 200,
    holderName: learner.preferredName || learner.email,
    actorId, now,
  });

  await db(env).prepare('UPDATE pass_list_entries SET conferred_award_id = ? WHERE id = ?')
    .bind(award.id, entryId).run();

  return award;
}
