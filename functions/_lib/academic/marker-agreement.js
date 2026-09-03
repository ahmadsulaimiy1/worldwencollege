/**
 * A MARKER'S OWN RELIABILITY, SHOWN TO THEM.
 *
 * ────────────────────────────────────────────────────────────────────
 * WHAT THIS FILE EXISTS TO DELIVER
 * ────────────────────────────────────────────────────────────────────
 * /academics/tutor-handbook/ § VI publishes this as a term-by-term
 * undertaking to every member of academic staff:
 *
 *   "Each term a tutor is shown the agreement between their own marks
 *    and their second markers', with the cases that diverged. A marker
 *    told only that a standard drifted can do nothing; one shown where
 *    and by how much corrects it in the next batch."
 *
 * Until sql/migrations/023-level-examination.sql there was nothing to
 * compute it from: no table held two readings of one script. There is
 * now — `examination_marks` keyed by (sitting, criterion, ROLE), and
 * `examination_reconciliations` holding every case the published
 * triggers escalated — so the undertaking is deliverable, and this is
 * the file that delivers it.
 *
 * ────────────────────────────────────────────────────────────────────
 * THE SENTENCE IS THE SPECIFICATION, INCLUDING ITS SECOND HALF
 * ────────────────────────────────────────────────────────────────────
 * "…with the cases that diverged" is not decoration. A single agreement
 * percentage is exactly the thing the handbook says is useless: a
 * marker told their agreement is 82 per cent can do nothing with it.
 * So every divergence is returned individually, with the criterion, the
 * two marks, the direction and the size — and the summary figures are
 * computed FROM that list rather than instead of it.
 *
 * ────────────────────────────────────────────────────────────────────
 * DIRECTION IS THE FIGURE THAT ACTUALLY CORRECTS A MARKER
 * ────────────────────────────────────────────────────────────────────
 * Mean absolute divergence says how far apart two readers were. Mean
 * SIGNED divergence says which way — and that is the number a marker
 * can act on, because a tutor who is consistently three points above
 * their second markers is doing something specific and repeatable.
 * Both are returned; the signed one is named `bias` because that is
 * what it is, and calling it anything softer would blunt the only
 * finding on the page a person can change their behaviour from.
 *
 * ────────────────────────────────────────────────────────────────────
 * AND IT IS NEVER A LEAGUE TABLE
 * ────────────────────────────────────────────────────────────────────
 * This module answers about ONE marker and takes their id from the
 * session at every call site. There is deliberately no function here
 * that ranks markers against each other, and no parameter that would
 * let one be built: the handbook's promise is that a tutor is shown
 * their own reliability, and a console that showed them everybody
 * else's would change what the measurement is for.
 *
 * The moderating committee's view is a different instrument with a
 * different authority, and it is not this one.
 */

import { db, ValidationError } from '../db.js';
import { TOLERANCE_POINTS, EXAMINATION_FLOOR } from './examinations.js';
import { SCALE, roundMark } from './marks.js';

/**
 * How far back. A term is the natural window the handbook names, and
 * the College has adopted no academic calendar — docs/academic-calendar.md
 * and /academics/#academic-year both say so — so a term cannot be
 * computed from a table. Ninety days is stated as the DEFAULT WINDOW
 * rather than as a term, and the payload says which it is, because
 * calling ninety days "this term" would be inventing a calendar in a
 * caption.
 */
export const DEFAULT_WINDOW_DAYS = 90;

/**
 * Every criterion this marker read where a second reading also exists,
 * with what the other reader put.
 *
 * ONE QUERY, SELF-JOINED. The alternative — read this marker's marks,
 * then read the others per sitting — is a query per script, and a
 * marker with three hundred criteria behind them would wait for three
 * hundred round trips to be told how they are doing.
 */
async function pairedReadings(env, { markerId, since }) {
  const { results } = await db(env)
    .prepare(`
      SELECT mine.examination_id      AS examinationId,
             mine.criterion_id        AS criterionId,
             mine.marker_role         AS myRole,
             mine.mark                AS myMark,
             mine.marked_at           AS markedAt,
             theirs.marker_role       AS theirRole,
             theirs.marker_id         AS theirMarkerId,
             theirs.mark              AS theirMark,
             c.code                   AS criterionCode,
             c.name                   AS criterionName,
             c.name_ar                AS criterionNameAr,
             c.skill_id               AS skillId,
             c.weight                 AS weight,
             e.level_id               AS levelId,
             e.sitting_reference      AS sittingReference,
             e.status                 AS sittingStatus
        FROM examination_marks mine
        JOIN examination_marks theirs
          ON theirs.examination_id = mine.examination_id
         AND theirs.criterion_id   = mine.criterion_id
         AND theirs.marker_id     <> mine.marker_id
         AND theirs.marker_role IN ('first','second')
        JOIN examination_criteria c ON c.id = mine.criterion_id
        JOIN level_examinations  e ON e.id = mine.examination_id
       WHERE mine.marker_id = ?
         AND mine.marker_role IN ('first','second')
         AND mine.marked_at >= ?
       ORDER BY mine.marked_at DESC`)
    .bind(markerId, since)
    .all();
  return results;
}

/**
 * What settled each reconciliation this marker was party to, so a
 * divergence can be reported with its outcome rather than as an open
 * disagreement for ever.
 */
async function settlements(env, { markerId, since }) {
  const { results } = await db(env)
    .prepare(`
      SELECT DISTINCT r.examination_id AS examinationId,
             r.criterion_id            AS criterionId,
             r.trigger_reason          AS trigger,
             r.settled_at              AS settledAt,
             r.settled_mark            AS settledMark,
             r.settled_how             AS settledHow
        FROM examination_reconciliations r
        JOIN examination_marks m
          ON m.examination_id = r.examination_id
         AND m.marker_id = ?
       WHERE m.marked_at >= ?`)
    .bind(markerId, since)
    .all();
  return results;
}

/**
 * One marker's agreement with their second markers, and every case that
 * diverged.
 *
 * `markerId` is the session's at every call site. See the head of this
 * file: there is no parameter here that would let a league table be
 * built out of it.
 */
export async function markerAgreement(env, { markerId, windowDays = DEFAULT_WINDOW_DAYS, now = Date.now() } = {}) {
  if (!markerId) throw new ValidationError('A marker is required.', { markerId: 'Required.' });
  const days = Number(windowDays);
  if (!Number.isInteger(days) || days < 1 || days > 730) {
    throw new ValidationError('A window is a whole number of days, up to two years.', { windowDays: 'Not a window.' });
  }
  const since = new Date(now - days * 86400000).toISOString();

  const rows = await pairedReadings(env, { markerId, since });
  const settled = await settlements(env, { markerId, since });
  const settledBy = new Map(settled.map((s) => [`${s.examinationId}:${s.criterionId}`, s]));

  const divergences = [];
  let within = 0;
  let sumAbs = 0;
  let sumSigned = 0;

  for (const r of rows) {
    const gap = Number(r.myMark) - Number(r.theirMark);
    const abs = Math.abs(gap);
    sumAbs += abs;
    sumSigned += gap;

    // THE THREE PUBLISHED TRIGGERS, read the same way openReconciliations()
    // reads them — floor crossing first, because it is the more
    // consequential fact and the register records it that way.
    const straddles = (Number(r.myMark) < EXAMINATION_FLOOR) !== (Number(r.theirMark) < EXAMINATION_FLOOR);
    const beyond = abs > TOLERANCE_POINTS;

    if (!straddles && !beyond) { within += 1; continue; }

    const key = `${r.examinationId}:${r.criterionId}`;
    const s = settledBy.get(key) || null;
    divergences.push({
      examinationId: r.examinationId,
      sittingReference: r.sittingReference,
      levelId: r.levelId,
      criterionCode: r.criterionCode,
      criterionName: r.criterionName,
      criterionNameAr: r.criterionNameAr,
      skillId: r.skillId,
      myRole: r.myRole,
      myMark: Number(r.myMark),
      theirMark: Number(r.theirMark),
      // Signed, and from this marker's point of view: positive means
      // they marked ABOVE their second reader.
      gap: roundMark(gap),
      trigger: straddles ? 'skill_floor' : 'tolerance',
      markedAt: r.markedAt,
      settled: s && s.settledAt
        ? { at: s.settledAt, mark: s.settledMark, how: s.settledHow }
        : null,
      // WHOSE READING THE SETTLEMENT LANDED NEARER TO. Not a verdict on
      // who was right — a reconciliation is an agreement, not a ruling —
      // but it is the fact a marker most wants and it is arithmetic.
      settledNearer: s && Number.isFinite(s.settledMark)
        ? (Math.abs(s.settledMark - Number(r.myMark)) < Math.abs(s.settledMark - Number(r.theirMark))
          ? 'mine'
          : (Math.abs(s.settledMark - Number(r.myMark)) > Math.abs(s.settledMark - Number(r.theirMark))
            ? 'theirs' : 'equally'))
        : null,
    });
  }

  const paired = rows.length;

  // A HONOURS-BAND CROSSING is about whole scripts rather than single
  // criteria, so it is counted separately: two readers can agree on
  // every criterion to within a point and still put a candidate either
  // side of a threshold.
  const bandCrossings = settled.filter((s) => s.trigger === 'honour_threshold').length;

  return {
    markerId,
    window: {
      days,
      since,
      // NAMED FOR WHAT IT IS. The handbook says "each term"; the College
      // has adopted no academic calendar, so a term is not computable
      // and this is a rolling window. Calling it a term in a caption
      // would be inventing a calendar.
      basis: 'rolling_days',
      note: `The last ${days} days of this marker's own readings. The College has adopted no academic calendar, so this is a rolling window rather than a term.`,
    },
    // Null rather than 0 where nothing has been read. A marker who has
    // marked nothing has no agreement figure, and 0% would say they
    // agreed with nobody.
    paired,
    within,
    agreement: paired ? roundMark((within / paired) * 100) : null,
    meanDivergence: paired ? roundMark(sumAbs / paired) : null,
    // THE NUMBER A MARKER CAN ACT ON — see the head of this file.
    bias: paired ? roundMark(sumSigned / paired) : null,
    divergences,
    bandCrossings,
    tolerancePoints: TOLERANCE_POINTS,
    floor: EXAMINATION_FLOOR,
    passMark: SCALE.passMark,
    source: '/academics/tutor-handbook/#second-marking',
    undertaking: 'Each term a tutor is shown the agreement between their own marks and their second markers\', with the cases that diverged.',
    undertakingAr: 'يُعرَض على المصحِّح كلَّ فصلٍ مدى اتّفاق درجاته مع درجات المصحِّح الثاني، ومعها الحالاتُ التي اختلفا فيها.',
  };
}
