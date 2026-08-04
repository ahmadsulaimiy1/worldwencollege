/**
 * The four language skills, and the honest report that nothing is
 * mapped to them yet.
 *
 * ────────────────────────────────────────────────────────────────────
 * WHAT THIS MODULE REFUSES TO DO
 * ────────────────────────────────────────────────────────────────────
 * It would be easy — and it would look impressive — to derive a skill
 * profile from data the platform already holds. Listening from the
 * Listening Lab. Speaking from pronunciation recordings. Writing from
 * assignment marks. Reading from quiz scores.
 *
 * Every one of those inferences is an academic judgement wearing the
 * costume of a calculation. A quiz on a reading passage may be
 * assessing vocabulary; a pronunciation exercise may be assessing
 * listening discrimination rather than speech. Deciding which is which
 * is the work of somebody qualified to do it, and the Knowledge Graph
 * directive was explicit that such relationships must be represented so
 * they can be reviewed, approved and audited — not inferred because the
 * mapping looked obvious to a program.
 *
 * So this module reads `assessment_skills`, and while that table is
 * empty it says so. A graduate profile that reported "Reading: B2"
 * because a program guessed would be worse than one that reports
 * nothing: the second is incomplete, the first is wrong in a way
 * nobody downstream can detect.
 */

const db = (env) => env.DB;

/** Every skill the framework defines, in reading order. */
export async function framework(env) {
  const { results } = await db(env)
    .prepare('SELECT id, code, name, mode, description FROM language_skills ORDER BY sequence')
    .all();
  return results;
}

/**
 * How much of the curriculum is mapped to each skill.
 *
 * The institutional view: what a Head of Programme needs to see before
 * the framework can be used for anything, and what an accreditation
 * reviewer would ask for first.
 */
export async function coverage(env) {
  const skills = await framework(env);

  const { results: mapped } = await db(env)
    .prepare(`SELECT skill_id AS skillId,
                     SUM(CASE WHEN status = 'approved' THEN 1 ELSE 0 END) AS approved,
                     SUM(CASE WHEN status = 'proposed' THEN 1 ELSE 0 END) AS proposed
                FROM assessment_skills
               WHERE status != 'retired'
               GROUP BY skill_id`).all();
  const bySkill = new Map(mapped.map((m) => [m.skillId, m]));

  // The denominator is every assessment the curriculum contains, so
  // "3 mapped" is reported against the real total rather than against
  // the assessments somebody happened to look at.
  const totals = await db(env).prepare(
    "SELECT COUNT(*) AS n FROM learning_items WHERE kind IN ('quiz','assignment')").first();
  const assessments = totals.n || 0;

  const perSkill = skills.map((s) => {
    const m = bySkill.get(s.id) || { approved: 0, proposed: 0 };
    return {
      skillId: s.id,
      code: s.code,
      name: s.name,
      mode: s.mode,
      approved: m.approved || 0,
      proposed: m.proposed || 0,
    };
  });

  const approvedTotal = perSkill.reduce((n, s) => n + s.approved, 0);
  const proposedTotal = perSkill.reduce((n, s) => n + s.proposed, 0);

  return {
    // The four states this can be in, named rather than left to be
    // inferred from a count of zero.
    state: approvedTotal > 0 ? 'mapped'
      : proposedTotal > 0 ? 'awaiting_approval'
        : 'unmapped',
    assessments,
    approvedTotal,
    proposedTotal,
    perSkill,
    // Said in words, because a reviewer reads the sentence and an
    // interface should not have to invent one.
    note: approvedTotal > 0
      ? null
      : (proposedTotal > 0
        ? `${proposedTotal} assessment-to-skill mappings have been proposed and none approved. `
          + 'Until they are approved by the responsible academic officer, no skill profile is reported.'
        : 'The College has not yet mapped its assessments to the four language skills. '
          + 'No skill profile can be reported for any graduate until that mapping is made and approved. '
          + 'This is a curriculum-mapping task awaiting academic decision, not missing data.'),
  };
}

/**
 * One graduate's skill profile.
 *
 * Returns the same `state` vocabulary as the competency report, so an
 * interface handles both the same way and a reviewer learns one set of
 * words rather than two.
 */
export async function skillProfile(env, { userId }) {
  const skills = await framework(env);
  const cover = await coverage(env);

  if (cover.state !== 'mapped') {
    return {
      state: cover.state === 'awaiting_approval' ? 'awaiting_approval' : 'unmapped',
      note: cover.note,
      skills: skills.map((s) => ({
        skillId: s.id, code: s.code, name: s.name, mode: s.mode,
        description: s.description,
        // Explicitly null, never 0. Zero is a mark, and a graduate who
        // was never assessed has not scored zero.
        attainment: null, assessments: 0,
      })),
    };
  }

  // Marks reached through APPROVED mappings only. A proposed mapping is
  // a suggestion; letting it contribute would mean an unapproved
  // academic judgement appearing on a graduate's public record.
  //
  // `grade` is 0..1 (enforced in gradeAssignment), so the weighted mean
  // is sum(grade x weight) / sum(weight) — NOT sum(grade)/count, which
  // would silently ignore the weights and make a task that touches a
  // skill in passing count the same as one built around it.
  const { results: marks } = await db(env)
    .prepare(`SELECT k.skill_id AS skillId,
                     SUM(s.grade * k.weight) AS weighted,
                     SUM(k.weight) AS weightSum,
                     COUNT(*) AS assessments
                FROM assignment_submissions s
                JOIN assessment_skills k ON k.learning_item_id = s.learning_item_id
               WHERE s.user_id = ? AND k.status = 'approved' AND s.grade IS NOT NULL
               GROUP BY k.skill_id`)
    .bind(userId).all();
  const bySkill = new Map(marks.map((m) => [m.skillId, m]));

  const rows = skills.map((s) => {
    const m = bySkill.get(s.id);
    return {
      skillId: s.id, code: s.code, name: s.name, mode: s.mode,
      description: s.description,
      attainment: m && m.weightSum > 0 ? Math.round((m.weighted / m.weightSum) * 1000) / 10 : null,
      assessments: m ? m.assessments : 0,
    };
  });

  const assessed = rows.filter((r) => r.attainment !== null);
  return {
    state: assessed.length ? 'assessed' : 'not_yet_assessed',
    note: assessed.length
      ? null
      : 'The curriculum is mapped to the four skills, but this graduate has not yet been '
        + 'assessed against any of the mapped assessments.',
    skills: rows,
  };
}

/**
 * Propose a mapping. Always `proposed` — there is no parameter that
 * creates an approved one, because a function that could would
 * eventually be called with it set.
 */
export async function proposeMapping(env, { learningItemId, skillId, weight = 1.0, proposedBy, rationale = null }) {
  if (!learningItemId || !skillId) throw new Error('a mapping needs an assessment and a skill');
  if (!(weight > 0 && weight <= 1)) throw new Error('weight must be greater than 0 and at most 1');

  const id = 'ask_' + crypto.randomUUID();
  await db(env).prepare(
    `INSERT INTO assessment_skills (id, learning_item_id, skill_id, weight, status, proposed_by, rationale)
     VALUES (?, ?, ?, ?, 'proposed', ?, ?)`)
    .bind(id, learningItemId, skillId, weight, proposedBy || null, rationale).run();
  return { id, status: 'proposed' };
}

/** Approve a mapping. Records who and when; the CHECK enforces both. */
export async function approveMapping(env, { id, approvedBy, now = Date.now() }) {
  if (!approvedBy) throw new Error('an approval must record who made it');
  const row = await db(env).prepare('SELECT status FROM assessment_skills WHERE id = ?').bind(id).first();
  if (!row) return { ok: false, reason: 'not_found' };
  if (row.status === 'retired') return { ok: false, reason: 'retired' };
  if (row.status === 'approved') return { ok: false, reason: 'already_approved' };

  await db(env).prepare(
    "UPDATE assessment_skills SET status = 'approved', approved_by = ?, approved_at = ? WHERE id = ?")
    .bind(approvedBy, new Date(now).toISOString(), id).run();
  return { ok: true };
}
