/* The graduation audit.
 *
 * conferAward() calls itself "the only way a row enters the Register",
 * and it is careful about everything except the one thing that matters
 * most: it never asked whether the learner earned anything. It took the
 * award title, the CEFR level, the credits and the hours from its
 * caller. A Mastery qualification could have been conferred on somebody
 * who had completed nothing — correctly chained, correctly signed,
 * permanently verifiable, and false.
 *
 * This module is what conferAward() now has to satisfy first.
 *
 * ────────────────────────────────────────────────────────────────
 * THREE RESULTS, NOT TWO
 * ────────────────────────────────────────────────────────────────
 * met | not_met | cannot_check.
 *
 * The third is the honest one. Two of the five requirements are human
 * acts — an approved and countersigned pass list, and an External
 * Examiner's independent sign-off — and the platform has no way to
 * confirm either. Recording them as "met" because no evidence
 * contradicted them is how an audit becomes a formality. They are
 * reported as `cannot_check`, and `cannot_check` does not pass.
 *
 * ────────────────────────────────────────────────────────────────
 * SO NOTHING CAN BE CONFERRED TODAY
 * ────────────────────────────────────────────────────────────────
 * No External Examiner is appointed. Every audit therefore ends
 * `not_met`, and conferAward() refuses. The WEQ framework already said
 * exactly this in its own graduation requirements — "the College will
 * not confer without one" — and it is now the behaviour rather than the
 * prose.
 *
 * That is the correct state. It is not a defect, and it must not be
 * engineered around: the appointment is what changes it.
 */
import { db, newId, nowIso, NotFoundError, ValidationError } from '../db.js';
import { getConfigJson } from '../config.js';

/** Every requirement, in the order an auditor reads them. */
export async function requirements(env) {
  const r = await db(env)
    .prepare('SELECT * FROM graduation_requirements ORDER BY sequence')
    .all();
  return r.results || [];
}

function applies(req, awardCode) {
  return req.applies_to === 'all' || req.applies_to === awardCode;
}

/**
 * Check one requirement against the record.
 *
 * Returns { result, observed }. `observed` is always a sentence saying
 * what was actually seen — a check that cannot say what it looked at is
 * not evidence of anything.
 */
async function checkOne(env, req, { userId, levelId, passThreshold }) {
  const d = db(env);
  const courseId = `crs_level_${levelId}`;

  if (!req.verifiable_from_record) {
    // A human act. The platform records that it could not confirm it,
    // and says which act it is waiting on.
    return {
      result: 'cannot_check',
      observed: req.code === 'EXTERNAL_EXAMINER'
        ? 'No External Examiner is appointed, so no independent sign-off exists to check. The College does not confer without one.'
        : 'This is a human act outside the platform. The record holds no evidence of it either way, so it is not treated as met.',
    };
  }

  if (req.code === 'MODULES_COMPLETE') {
    const total = await d.prepare('SELECT COUNT(*) AS n FROM units WHERE course_id = ?').bind(courseId).first();
    const done = await d.prepare(
      `SELECT COUNT(*) AS n FROM unit_progress p JOIN units u ON u.id = p.unit_id
        WHERE p.user_id = ? AND u.course_id = ? AND p.status = 'completed'`).bind(userId, courseId).first();
    const n = (total && total.n) || 0;
    const k = (done && done.n) || 0;
    return {
      result: n > 0 && k === n ? 'met' : 'not_met',
      observed: `${k} of ${n} modules recorded as completed.`,
    };
  }

  if (req.code === 'ASSIGNMENTS_GRADED') {
    const total = await d.prepare(
      `SELECT COUNT(*) AS n FROM learning_items i JOIN units u ON u.id = i.unit_id
        WHERE u.course_id = ? AND i.kind = 'assignment'`).bind(courseId).first();
    const graded = await d.prepare(
      `SELECT COUNT(DISTINCT s.learning_item_id) AS n
         FROM assignment_submissions s
         JOIN learning_items i ON i.id = s.learning_item_id
         JOIN units u ON u.id = i.unit_id
        WHERE s.user_id = ? AND u.course_id = ? AND i.kind = 'assignment'
          AND s.grade IS NOT NULL AND s.graded_at IS NOT NULL`).bind(userId, courseId).first();
    const n = (total && total.n) || 0;
    const k = (graded && graded.n) || 0;
    return {
      result: n > 0 && k === n ? 'met' : 'not_met',
      // Stated precisely: a submission without a mark is not a graded
      // assignment, and the sentence has to make that distinction
      // visible to whoever reads the audit later.
      observed: `${k} of ${n} assignments carry both a mark and a grading date.`,
    };
  }

  if (req.code === 'EXAM_PASSED') {
    const exam = await d.prepare(
      `SELECT i.id FROM learning_items i JOIN units u ON u.id = i.unit_id
        WHERE u.course_id = ? AND i.id LIKE '%examquiz%' ORDER BY u.sequence DESC LIMIT 1`)
      .bind(courseId).first();
    if (!exam) {
      return {
        result: 'cannot_check',
        observed: `No end-of-stage examination is authored for ${courseId}, so there is nothing to have passed.`,
      };
    }
    const best = await d.prepare(
      'SELECT MAX(score) AS s FROM quiz_attempts WHERE user_id = ? AND learning_item_id = ?')
      .bind(userId, exam.id).first();
    const score = best && best.s !== null && best.s !== undefined ? best.s : null;
    if (score === null) {
      return { result: 'not_met', observed: 'The stage examination has not been attempted.' };
    }
    return {
      result: score >= passThreshold ? 'met' : 'not_met',
      observed: `Best examination score ${Math.round(score * 1000) / 10}% against a pass mark of ${Math.round(passThreshold * 1000) / 10}%.`,
    };
  }

  // A requirement the College has adopted and this module does not yet
  // know how to check. Reported honestly rather than skipped — a
  // requirement silently omitted from an audit is the failure this
  // whole file exists to prevent.
  return {
    result: 'cannot_check',
    observed: `No check is implemented for ${req.code}. It is reported rather than skipped, and it does not pass.`,
  };
}

/**
 * Run the audit and close it.
 *
 * An audit passes only if EVERY applicable requirement is `met`. Not
 * "no requirement failed" — `cannot_check` does not pass either, which
 * is the difference between an audit and a formality.
 */
export async function runGraduationAudit(env, { userId, levelId, awardCode, runBy = null, now = Date.now() }) {
  if (!userId || !levelId || !awardCode) {
    throw new ValidationError('userId, levelId and awardCode are required.');
  }
  const learner = await db(env).prepare('SELECT id FROM users WHERE id = ?').bind(userId).first();
  if (!learner) throw new NotFoundError('Unknown person.');

  const reqs = (await requirements(env)).filter((r) => applies(r, awardCode));
  if (!reqs.length) {
    throw new ValidationError(`No graduation requirements are defined for ${awardCode}. An audit against nothing is not an audit.`);
  }

  const passThreshold = Number(await getConfigJson(env, 'lms_pass_threshold', { required: false }) ?? 0.7);
  const auditId = newId('gaud');
  const at = new Date(now).toISOString();

  await db(env).prepare(
    `INSERT INTO graduation_audits (id, user_id, level_id, award_code, run_at, run_by)
     VALUES (?, ?, ?, ?, ?, ?)`).bind(auditId, userId, levelId, awardCode, at, runBy).run();

  const checks = [];
  for (const req of reqs) {
    const { result, observed } = await checkOne(env, req, { userId, levelId, passThreshold });
    await db(env).prepare(
      `INSERT INTO graduation_audit_checks (id, audit_id, requirement_code, result, observed)
       VALUES (?, ?, ?, ?, ?)`).bind(newId('gchk'), auditId, req.code, result, observed).run();
    checks.push({ code: req.code, name: req.name, result, observed });
  }

  const failed = checks.filter((c) => c.result !== 'met');
  const outcome = failed.length === 0 ? 'met' : 'not_met';
  const summary = outcome === 'met'
    ? `All ${checks.length} graduation requirements are met.`
    : `${failed.length} of ${checks.length} requirements are not met: ${failed.map((c) => `${c.code} (${c.result})`).join(', ')}.`;

  await db(env).prepare(
    'UPDATE graduation_audits SET outcome = ?, closed_at = ?, summary = ? WHERE id = ?')
    .bind(outcome, at, summary, auditId).run();

  return { auditId, userId, levelId, awardCode, outcome, summary, checks, runAt: at };
}

/** Read a closed audit back, checks and all. */
export async function readAudit(env, { auditId }) {
  const audit = await db(env).prepare('SELECT * FROM graduation_audits WHERE id = ?').bind(auditId).first();
  if (!audit) throw new NotFoundError('Unknown audit.');
  const checks = await db(env).prepare(
    `SELECT c.*, r.name, r.sequence FROM graduation_audit_checks c
       JOIN graduation_requirements r ON r.code = c.requirement_code
      WHERE c.audit_id = ? ORDER BY r.sequence`).bind(auditId).all();
  return { ...audit, checks: checks.results || [] };
}

/**
 * The audit an award may be conferred on, or a refusal explaining why
 * not. Called by conferAward(); separated so the refusal is testable on
 * its own.
 */
export async function assertConferrable(env, { auditId, userId, levelId }) {
  if (!auditId) {
    throw new ValidationError(
      'A passed graduation audit is required before an award can be conferred. Run runGraduationAudit() first — a certificate the College cannot show was earned is worse than no certificate.',
      { auditId: 'Required' },
    );
  }
  const audit = await db(env).prepare('SELECT * FROM graduation_audits WHERE id = ?').bind(auditId).first();
  if (!audit) throw new NotFoundError('Unknown graduation audit.');
  if (audit.user_id !== userId || audit.level_id !== levelId) {
    throw new ValidationError(
      'That audit belongs to a different learner or a different level.',
      { auditId: 'Mismatched' },
    );
  }
  if (audit.outcome !== 'met') {
    throw new ValidationError(
      `The graduation audit did not pass: ${audit.summary || 'no summary recorded'}`,
      { auditId: 'Not met' },
    );
  }
  return audit;
}

/**
 * Awards in the Register with no conferral record behind them.
 *
 * The composite foreign key on `conferrals` makes it impossible to
 * attach an award to an audit that failed. What it cannot do is force
 * every award to have one — see the note in migration 028 on why a
 * trigger was not used. This is the reporting half of that guarantee,
 * and it should always return zero.
 */
export async function unauditedAwards(env) {
  const rows = await db(env).prepare(
    `SELECT a.id, a.user_id, a.level_id, a.award_title, a.conferred_on
       FROM awards a LEFT JOIN conferrals c ON c.award_id = a.id
      WHERE c.award_id IS NULL
      ORDER BY a.conferred_on`).all();
  return rows.results || [];
}
