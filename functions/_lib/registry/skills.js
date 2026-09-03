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
 *
 * ────────────────────────────────────────────────────────────────────
 * DESCRIPTORS, NOT PERCENTAGES
 * ────────────────────────────────────────────────────────────────────
 * Executive decision: attainment is reported as one of five ordered
 * descriptors — Emerging, Developing, Proficient, Advanced,
 * Distinguished — and never as a percentage. "Writing: 82%" claims a
 * precision that no rubric supports and invites comparisons between
 * graduates that the marks cannot bear.
 *
 * That makes TWO approvals necessary before any descriptor appears:
 *
 *   1. the assessment-to-skill mapping        (Academic Senate)
 *   2. the thresholds between the descriptors (Academic Senate)
 *
 * The second is the harder question and is deliberately unanswered.
 * Nobody has said what evidence makes a graduate Proficient rather than
 * Developing, and filling it with round numbers would make a decision
 * on the Senate's behalf while looking like configuration.
 */

const db = (env) => env.DB;

/** Every skill the framework defines, in reading order. */
export async function framework(env) {
  const { results } = await db(env)
    .prepare(`SELECT id, code, name, mode, description,
                     name_ar AS nameAr, description_ar AS descriptionAr
                FROM language_skills ORDER BY sequence`)
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
    // The same sentence for an Arabic reader, beside the English rather
    // than instead of it, so one payload serves both editions.
    noteAr: approvedTotal > 0
      ? null
      : (proposedTotal > 0
        ? `اقتُرح ${proposedTotal} ربطًا بين التقييمات والمهارات ولم يُعتمد منها شيء. `
          + 'ولا يُعلن أيّ ملفّ مهارات حتى يعتمدها المسؤول الأكاديمي المختصّ.'
        : 'لم تربط الكلية تقييماتها بعدُ بالمهارات اللغوية الأربع، فلا يُعلَن ملفّ مهارات لأيّ '
          + 'خرّيج حتى يتمّ هذا الربط ويُعتمد. وهذه مهمّة ربطٍ منهجيّ تنتظر قرارًا أكاديميًّا، '
          + 'لا بيانات ناقصة.'),
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
  const scale = await descriptorScale(env);
  const bands = scale.descriptors.filter((d) => d.thresholdMin !== null);

  if (cover.state !== 'mapped') {
    return {
      state: cover.state === 'awaiting_approval' ? 'awaiting_approval' : 'unmapped',
      note: cover.note,
      noteAr: cover.noteAr,
      skills: skills.map((s) => ({
        skillId: s.id, code: s.code, name: s.name, nameAr: s.nameAr || null, mode: s.mode,
        description: s.description, descriptionAr: s.descriptionAr || null,
        // Explicitly null. Not 0, and not the lowest descriptor —
        // "Emerging" is a judgement somebody made, and a graduate who
        // was never assessed has not been judged to be emerging.
        descriptor: null, assessments: 0,
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
    const evidence = m && m.weightSum > 0 ? m.weighted / m.weightSum : null;
    return {
      skillId: s.id, code: s.code, name: s.name, nameAr: s.nameAr || null, mode: s.mode,
      description: s.description, descriptionAr: s.descriptionAr || null,
      descriptor: evidence === null ? null : bandFor(evidence, bands),
      assessments: m ? m.assessments : 0,
    };
  });

  // With no approved thresholds there is evidence but no way to name a
  // band, which is a THIRD state and not the same as "not assessed".
  // Collapsing it into either neighbour would tell a reader something
  // false: that the graduate was never assessed, or that they were and
  // this is the answer.
  if (!bands.length) {
    return {
      state: 'thresholds_pending',
      note: 'Assessments are mapped to the four skills and this graduate has been assessed '
        + 'against them, but the Academic Senate has not yet approved the thresholds that turn '
        + 'assessed evidence into a descriptor. No descriptor can be reported until it does.',
      noteAr: 'التقييمات مربوطة بالمهارات الأربع، وقد قُوِّم هذا الخرّيج عليها، غير أنّ المجلس '
        + 'الأكاديمي لم يعتمد بعدُ العتبات التي تحوّل الأدلّة المُقوَّمة إلى وصفِ مستوى. ولا '
        + 'يُعلَن وصفٌ حتى يعتمدها.',
      skills: rows.map((r) => ({ ...r, descriptor: null })),
    };
  }

  const assessed = rows.filter((r) => r.descriptor !== null);
  return {
    state: assessed.length ? 'assessed' : 'not_yet_assessed',
    note: assessed.length
      ? null
      : 'The curriculum is mapped to the four skills, but this graduate has not yet been '
        + 'assessed against any of the mapped assessments.',
    noteAr: assessed.length
      ? null
      : 'المنهج مربوط بالمهارات الأربع، غير أنّ هذا الخرّيج لم يُقوَّم بعدُ في أيٍّ من '
        + 'التقييمات المربوطة.',
    skills: rows,
  };
}

/**
 * The five descriptors, with whichever thresholds the Senate has
 * approved. A descriptor with no threshold is a name without a rule,
 * and is excluded from banding rather than treated as zero.
 */
export async function descriptorScale(env) {
  const { results } = await db(env).prepare(
    `SELECT id, code, name, description,
            name_ar AS nameAr, description_ar AS descriptionAr,
            threshold_min AS thresholdMin, approved_at AS approvedAt
       FROM skill_descriptors ORDER BY sequence`).all();
  const approved = results.filter((d) => d.thresholdMin !== null);
  return {
    descriptors: results,
    // Named states, as everywhere else in the platform.
    state: approved.length === results.length ? 'approved'
      : approved.length ? 'partially_approved'
        : 'thresholds_pending',
    note: approved.length === results.length ? null
      : 'The Academic Senate has not approved the evidence thresholds for '
        + `${results.length - approved.length} of the ${results.length} descriptors. `
        + 'The descriptors themselves are decided; what evidence earns each one is not.',
    noteAr: approved.length === results.length ? null
      : 'لم يعتمد المجلس الأكاديمي عتبات الأدلّة لـ'
        + `${results.length - approved.length} من ${results.length} أوصاف. `
        + 'فالأوصاف نفسها مقرّرة، وأمّا ما يستحقّ كلَّ وصفٍ من الأدلّة فليس مقرّرًا بعد.',
  };
}

/**
 * The band an evidence proportion falls into — the highest descriptor
 * whose threshold it reaches.
 *
 * Bands must be sorted ascending by threshold, which descriptorScale()
 * guarantees by ordering on `sequence`; a descriptor scale whose
 * thresholds did not rise with its sequence would be incoherent, and
 * that is checked when they are approved rather than assumed here.
 */
function bandFor(evidence, bands) {
  let found = null;
  for (const b of bands) {
    if (evidence >= b.thresholdMin) found = b;
  }
  return found ? {
    code: found.code,
    // Both namings travel, so an Arabic record can name its own band.
    name: found.name, nameAr: found.nameAr || null,
    description: found.description, descriptionAr: found.descriptionAr || null,
  } : null;
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

/**
 * Approve the threshold for a descriptor.
 *
 * Refuses a set of thresholds that does not rise with the scale: a
 * "Proficient" threshold below "Developing" would make bandFor() return
 * whichever band happened to be last, and the result would look like a
 * considered judgement. The coherence of the scale is checked HERE,
 * once, rather than defended at every read.
 */
export async function approveThreshold(env, { code, thresholdMin, approvedBy, now = Date.now() }) {
  if (!approvedBy) throw new Error('an approval must record who made it');
  if (!(thresholdMin >= 0 && thresholdMin <= 1)) {
    throw new Error('a threshold is a proportion of available evidence, between 0 and 1');
  }
  const { results } = await db(env).prepare(
    'SELECT code, sequence, threshold_min AS thresholdMin FROM skill_descriptors ORDER BY sequence').all();
  const target = results.find((d) => d.code === code);
  if (!target) return { ok: false, reason: 'not_found' };

  const proposed = results.map((d) => (d.code === code ? { ...d, thresholdMin } : d));
  const set = proposed.filter((d) => d.thresholdMin !== null);
  for (let i = 1; i < set.length; i++) {
    if (set[i].thresholdMin <= set[i - 1].thresholdMin) {
      return { ok: false, reason: 'not_ascending',
        detail: `${set[i].code} (${set[i].thresholdMin}) does not exceed ${set[i - 1].code} (${set[i - 1].thresholdMin})` };
    }
  }

  await db(env).prepare(
    'UPDATE skill_descriptors SET threshold_min = ?, approved_by = ?, approved_at = ? WHERE code = ?')
    .bind(thresholdMin, approvedBy, new Date(now).toISOString(), code).run();
  return { ok: true };
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
