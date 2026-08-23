/**
 * THE LEVEL EXAMINATION — the sitting, the two readers, and the release.
 *
 * ────────────────────────────────────────────────────────────────────
 * WHAT FAULT THIS FILE CORRECTS
 * ────────────────────────────────────────────────────────────────────
 * `marks.js` has always known the arithmetic of a level:
 *
 *   level_mark = (examination × 0.60) + (coursework × 0.40)
 *
 * and it has always returned null, for every learner, on every level,
 * with the reason `examination_not_recorded`. Not because anybody fell
 * short. Because no table in the schema could hold the sixty per cent.
 *
 * Read the consequence forwards, as docs/platform-capabilities.md did:
 * no level mark, so no honour; no honour, so no grade point; no grade
 * point, so no grade point average; no level result, so
 * `graduation_eligibility` reached `conditional` and stopped there
 * permanently. Six of the eight published conditions of the award
 * answered "recorded nowhere". An institution that cannot record an
 * examination is an institution nobody can graduate from, and that was
 * the platform's true state until sql/migrations/023-level-examination.sql.
 *
 * ────────────────────────────────────────────────────────────────────
 * NOTHING IN THIS FILE IS DECIDED HERE
 * ────────────────────────────────────────────────────────────────────
 * Every number below is transcribed from a page the College already
 * publishes, and the source is named beside each one. The two
 * instruments are:
 *
 *   /students/examinations/     — entry, identity, conduct,
 *                                 interruption, lateness, mitigation,
 *                                 release, resits and challenge
 *   /academics/tutor-handbook/  — the rubric, the comment, the
 *                                 three-point tolerance, the two
 *                                 absolute cases, and the third reader
 *
 * The transcription is pinned to those pages by
 * tests/level-examination.test.mjs, which reads the built HTML and
 * fails the build if a figure here and the figure a learner reads ever
 * disagree. That is the same arrangement `marks.js` has with
 * data/academic-regulations.json, and for the same reason: a constant
 * a test pins to its published source cannot drift, and an unpinned one
 * is a second source of truth waiting to contradict the first.
 *
 * ────────────────────────────────────────────────────────────────────
 * THE ONE RULE THAT SHAPES EVERY FUNCTION HERE
 * ────────────────────────────────────────────────────────────────────
 * A MARK IS NEVER OVERWRITTEN. The handbook is explicit — "Both
 * original marks stay on the record, so the committee reads how the
 * standard moved" — and it is the reason `countingMarks()` DERIVES the
 * mark that counts from the rows rather than storing one over them. A
 * second marker disagreeing adds a row. A reconciliation adds a row. A
 * third marker adds a row. At every point the College can show a
 * learner, an appeal panel or a moderating committee exactly which
 * hands produced the figure and in what order.
 *
 * ────────────────────────────────────────────────────────────────────
 * WHAT THIS FILE DELIBERATELY WILL NOT DO
 * ────────────────────────────────────────────────────────────────────
 * · IT WILL NOT INVENT A PAPER. `publishedPaperFor()` returns null and
 *   every caller reports `no_published_paper` by name. The College has
 *   published no examination paper today, and a seeded one would be an
 *   academic instrument authored by a program.
 *
 * · IT WILL NOT RELEASE A MARK THAT ONE PERSON PRODUCED. `release()`
 *   refuses until every criterion carries a first AND a second reading
 *   and every reconciliation is settled. "Every judged mark is read by
 *   a second marker before it reaches you" is published on
 *   /students/examinations/ § VII, and a release path that could skip
 *   it would make that sentence false rather than merely unenforced.
 *
 * · IT WILL NOT MOVE A MARK ON MITIGATION. The published rule is that a
 *   panel "may set the attempt aside, lift a late cap, move a deadline
 *   … It may never raise a mark." There is no function here that
 *   raises one, and `liftLateCap()` lifts the cap and nothing else.
 */

import { db, newId, nowIso, NotFoundError, ValidationError } from '../db.js';
import {
  HONOURS,
  REGULATION_VERSION,
  SCALE,
  SKILL_IDS,
  meetsThreshold,
  roundMark,
} from './marks.js';
import { addWorkingDays, workingDaysBetween } from '../registrar/cases.js';

/* ───────────────────────────────────────────────────────────────
 * THE PUBLISHED FIGURES, AND WHERE EACH IS PUBLISHED
 * ─────────────────────────────────────────────────────────────── */

export const PUBLISHED = Object.freeze({
  conduct: '/students/examinations/',
  marking: '/academics/tutor-handbook/',
  regulations: '/students/regulations/',
  assessment: '/students/assessment/',
});

/**
 * Second marking — handbook § IV, "The tolerance: Three points, and two
 * absolute cases".
 *
 * "Where the two marks fall within three percentage points, the first
 * stands. Beyond that the markers reconcile in writing. A disagreement
 * crossing an honours threshold or a skill floor is reconciled whatever
 * its size: a point either side of a floor is no small thing to the
 * learner."
 */
export const TOLERANCE_POINTS = 3;

/**
 * Handbook § IV, "The third reader: Two working days, then a third
 * marker". A reconciliation that settles inside the window is recorded
 * and released; one that does not goes to a third marker, whose mark
 * stands.
 */
export const RECONCILIATION_WORKING_DAYS = 2;

/** § I · ENTRY — "A level examination window stays open for ten working days". */
export const WINDOW_WORKING_DAYS = 10;

/** § III · CONDUCT — "runs for three hours from the moment you open it". */
export const DURATION_MINUTES = 180;

/** § II · IDENTITY — "a spoken component of at least fifteen minutes". */
export const SPOKEN_MINUTES = 15;

/** § IV · INTERRUPTION — "A paper reopened within sixty minutes of a break resumes". */
export const RESUME_MINUTES = 60;

/**
 * § IV · INTERRUPTION — "Twice a level, on your word alone … A third in
 * the same level goes to the mitigating circumstances panel."
 */
export const SET_ASIDE_ON_ELECTION = 2;

/** § VII · RESULTS — "Level examination: Working day 15", released as a cohort at 12:00 UTC. */
export const RELEASE_WORKING_DAY = 15;

/** § VII — "provisional until moderation closes on the batch, within five working days of release". */
export const MODERATION_WORKING_DAYS = 5;

/**
 * § VIII · RESITS — "Two resits for every summative assessment", so
 * three sittings in all, and "Fourteen days between attempts". Both
 * are also adopted in data/academic-regulations.json § reassessment;
 * the figures agree and the test asserts that they do.
 */
export const MAX_SITTINGS = 3;
export const RESIT_INTERVAL_DAYS = 14;

/**
 * § V · DEADLINES, the published four bands, in order. `capped` is the
 * band where "the mark is capped at the pass threshold" — the cap is
 * `SCALE.passMark`, read from the regulations rather than repeated.
 */
export const LATENESS_BANDS = Object.freeze([
  Object.freeze({
    id: 'on_time', upToWorkingDays: 0,
    label: 'Within the deadline',
    labelAr: 'ضمن الموعد',
    effect: 'Marked in full against the published rubric.',
    effectAr: 'تُصحَّح كاملةً وفق معايير التصحيح المنشورة.',
  }),
  Object.freeze({
    id: 'grace', upToWorkingDays: 1,
    label: 'Under 24 hours late',
    labelAr: 'أقل من 24 ساعة تأخيرًا',
    effect: 'Marked in full. One day is the allowance the College makes for an ordinary bad day, made without being asked for.',
    effectAr: 'تُصحَّح كاملةً. يومٌ واحد هو ما تتيحه الكلية ليومٍ سيّئ عادي، دون أن يُطلب منك.',
  }),
  Object.freeze({
    id: 'capped', upToWorkingDays: 5,
    label: 'One to five working days late',
    labelAr: 'من يوم إلى خمسة أيام عمل تأخيرًا',
    effect: 'Marked, with the mark capped at the pass threshold. You keep the level; you lose the honour on that piece of work.',
    effectAr: 'تُصحَّح، وتُقيَّد الدرجة عند حدّ النجاح. يبقى لك المستوى، وتفقد مرتبة الشرف على هذا العمل.',
  }),
  Object.freeze({
    id: 'incomplete', upToWorkingDays: null,
    label: 'More than five working days late',
    labelAr: 'أكثر من خمسة أيام عمل تأخيرًا',
    effect: 'Read and returned with full feedback, and recorded as incomplete. You sit it again in the next window, and that attempt is the first of your two resits.',
    effectAr: 'تُقرأ وتُعاد إليك بملاحظات كاملة، وتُسجَّل غير مكتملة. تعيدها في النافذة التالية، وتكون تلك المحاولة أولى إعادتيك.',
  }),
]);

/**
 * § I · ENTRY — "Three things, and only three: Work that is not yours,
 * another person sitting in your place, and a breach of the conditions
 * printed on the paper."
 */
export const VOID_REASONS = Object.freeze({
  not_own_work: { label: 'Work that is not the candidate\'s own', labelAr: 'عمل ليس من إنتاج المترشّح' },
  impersonation: { label: 'Another person sitting in the candidate\'s place', labelAr: 'شخص آخر يجلس مكان المترشّح' },
  conditions_breach: { label: 'A breach of the conditions printed on the paper', labelAr: 'مخالفة الشروط المطبوعة على الورقة' },
});

export const SET_ASIDE_REASONS = Object.freeze({
  learner_election: {
    label: 'Set aside at the candidate\'s election',
    labelAr: 'أُلغيت المحاولة باختيار المترشّح',
    countsAgainstElection: true,
  },
  panel: {
    label: 'Set aside by the mitigating circumstances panel',
    labelAr: 'أُلغيت المحاولة بقرار لجنة الظروف القاهرة',
    countsAgainstElection: false,
  },
  platform_fault: {
    label: 'Set aside because the platform failed',
    labelAr: 'أُلغيت المحاولة بسبب عطل في المنصّة',
    countsAgainstElection: false,
  },
});

/** The floor `level.gate.examination_criterion_floor` and `…skill_floor` both set. */
export const EXAMINATION_FLOOR = 50;

/* ───────────────────────────────────────────────────────────────
 * SMALL SHARED HELPERS
 * ─────────────────────────────────────────────────────────────── */

const isNum = (v) => typeof v === 'number' && Number.isFinite(v);

function text(value, field, { max = 4000, required = true } = {}) {
  const v = typeof value === 'string' ? value.replace(/\r\n/g, '\n').trim() : '';
  if (!v) {
    if (!required) return null;
    throw new ValidationError('This is required.', { [field]: 'Required.' });
  }
  if (v.length > max) {
    throw new ValidationError(`This is longer than ${max} characters.`, { [field]: `At most ${max} characters.` });
  }
  // C0 controls have no business on a record a person may one day rely
  // on in an argument with the College. Tab and newline survive.
  return v.replace(/[\u0000-\u0008\u000B-\u001F\u007F]/g, '');
}

function levelIdOf(raw) {
  const n = Number(raw);
  if (!Number.isInteger(n) || n < 1 || n > 6) {
    throw new ValidationError('A programme level is a whole number from 1 to 6.', { levelId: 'Not a level.' });
  }
  return n;
}

function markOf(raw, field) {
  const n = Number(raw);
  if (!Number.isFinite(n) || n < 0 || n > SCALE.maximumMark) {
    throw new ValidationError(`A mark is a percentage from 0 to ${SCALE.maximumMark}.`, { [field]: 'Not a percentage.' });
  }
  return n;
}

const dayOnly = (iso) => String(iso).slice(0, 10);

/**
 * The honour band a percentage falls in, by CODE, or null below the
 * pass mark. Used only to answer "did these two readings cross an
 * honours threshold" — the honour actually conferred is `honourFor()`
 * in marks.js and is a different quantity, computed from the level
 * mark and the level skill marks rather than from the examination.
 */
function honourBandOf(percentage) {
  if (!isNum(percentage)) return null;
  const met = HONOURS.filter((h) => meetsThreshold(percentage, h.overallThreshold));
  return met.length ? met[met.length - 1].code : null;
}

async function logEvent(env, { examinationId, kind, actorId = null, note = null, at = nowIso() }) {
  await db(env)
    .prepare(`INSERT INTO examination_events (id, examination_id, kind, actor_id, note, at)
              VALUES (?, ?, ?, ?, ?, ?)`)
    .bind(newId('xev'), examinationId, kind, actorId, note, at)
    .run();
}

/* ───────────────────────────────────────────────────────────────
 * THE PAPER
 * ─────────────────────────────────────────────────────────────── */

/**
 * Author a paper as a DRAFT, with its rubric.
 *
 * A draft is not markable and not sittable. The separation is the whole
 * point of the two-step: `rubric_published_on` is the date the College's
 * central marking claim rests on, and a paper that could be edited into
 * existence and sat in the same act would let that date be back-written.
 */
export async function authorPaper(env, {
  actor,
  levelId,
  title,
  titleAr = null,
  conditions,
  conditionsAr = null,
  criteria = [],
  openBook = true,
  durationMinutes = DURATION_MINUTES,
  spokenMinutes = SPOKEN_MINUTES,
  windowWorkingDays = WINDOW_WORKING_DAYS,
  at = nowIso(),
} = {}) {
  if (!actor || !actor.id) throw new ValidationError('An author is required.', { actor: 'Required.' });
  const level = levelIdOf(levelId);

  const cleanTitle = text(title, 'title', { max: 200 });
  const cleanTitleAr = text(titleAr, 'titleAr', { max: 200, required: false });
  const cleanConditions = text(conditions, 'conditions', { max: 8000 });
  const cleanConditionsAr = text(conditionsAr, 'conditionsAr', { max: 8000, required: false });

  if (!Array.isArray(criteria) || criteria.length === 0) {
    throw new ValidationError(
      'A paper is its rubric. A paper with no criteria could only be marked on impression.',
      { criteria: 'At least one criterion is required.' },
    );
  }
  if (!Number.isInteger(durationMinutes) || durationMinutes <= 0) {
    throw new ValidationError('A paper runs for a whole number of minutes.', { durationMinutes: 'Not a duration.' });
  }
  if (!Number.isInteger(spokenMinutes) || spokenMinutes < 0) {
    throw new ValidationError('A spoken component is a whole number of minutes.', { spokenMinutes: 'Not a duration.' });
  }
  if (!Number.isInteger(windowWorkingDays) || windowWorkingDays <= 0) {
    throw new ValidationError('A window is a whole number of working days.', { windowWorkingDays: 'Not a window.' });
  }

  const skills = new Set(
    (await db(env).prepare('SELECT id FROM language_skills').bind().all()).results.map((r) => r.id),
  );

  const prepared = criteria.map((c, i) => {
    const field = `criteria[${i}]`;
    const weight = Number(c && c.weight);
    if (!Number.isFinite(weight) || weight <= 0 || weight > 1) {
      throw new ValidationError('A criterion weight is a fraction above zero and at most one.', { [field]: 'Not a weight.' });
    }
    const skillId = c && c.skillId ? String(c.skillId) : null;
    if (skillId && !skills.has(skillId)) {
      throw new ValidationError(`"${skillId}" is not one of the four language skills.`, { [field]: 'Not a skill.' });
    }
    return {
      id: newId('xcr'),
      sequence: i + 1,
      code: text(c && c.code, `${field}.code`, { max: 32 }),
      name: text(c && c.name, `${field}.name`, { max: 200 }),
      nameAr: text(c && c.nameAr, `${field}.nameAr`, { max: 200, required: false }),
      descriptor: text(c && c.descriptor, `${field}.descriptor`, { max: 4000 }),
      descriptorAr: text(c && c.descriptorAr, `${field}.descriptorAr`, { max: 4000, required: false }),
      weight,
      skillId,
      spoken: c && c.spoken ? 1 : 0,
    };
  });

  const codes = new Set(prepared.map((c) => c.code));
  if (codes.size !== prepared.length) {
    throw new ValidationError('Two criteria carry the same code.', { criteria: 'Codes must differ.' });
  }

  const previous = await db(env)
    .prepare('SELECT MAX(version) AS v FROM examination_papers WHERE level_id = ?')
    .bind(level)
    .first();
  const version = ((previous && previous.v) || 0) + 1;

  const paperId = newId('xpr');
  await db(env)
    .prepare(`INSERT INTO examination_papers
        (id, level_id, version, title, title_ar, conditions, conditions_ar,
         open_book, duration_minutes, spoken_minutes, window_working_days,
         rubric_published_on, status, authored_by, regulation_version, created_at)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'draft', ?, ?, ?)`)
    .bind(
      paperId, level, version, cleanTitle, cleanTitleAr, cleanConditions, cleanConditionsAr,
      openBook ? 1 : 0, durationMinutes, spokenMinutes, windowWorkingDays,
      dayOnly(at), actor.id, REGULATION_VERSION, at,
    )
    .run();

  for (const c of prepared) {
    await db(env)
      .prepare(`INSERT INTO examination_criteria
          (id, paper_id, sequence, code, name, name_ar, descriptor, descriptor_ar, weight, skill_id, spoken)
          VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`)
      .bind(c.id, paperId, c.sequence, c.code, c.name, c.nameAr, c.descriptor, c.descriptorAr, c.weight, c.skillId, c.spoken)
      .run();
  }

  return paperFor(env, paperId);
}

/**
 * Publish a draft, which is the act that makes it markable.
 *
 * The three refusals here are the ones a published rule would otherwise
 * only describe:
 *
 *   · the weights must sum to 1, or the composite is not the composite
 *     the rubric claims to be;
 *   · every one of the four language skills must be measured by at
 *     least one criterion, or `level.gate.examination_skill_floor` has
 *     a skill it can never read and every candidate is refused conferral
 *     for a fault that is the paper's;
 *   · at least one criterion must be marked from the spoken paper, or
 *     `level.gate.spoken_paper` is a gate over nothing —
 *     /students/examinations/ § II requires a spoken component of every
 *     level examination.
 */
export async function publishPaper(env, { actor, paperId, at = nowIso() } = {}) {
  if (!actor || !actor.id) throw new ValidationError('A publisher is required.', { actor: 'Required.' });
  const paper = await db(env).prepare('SELECT * FROM examination_papers WHERE id = ?').bind(paperId).first();
  if (!paper) throw new NotFoundError('No such examination paper.');
  if (paper.status === 'published') return paperFor(env, paperId);
  if (paper.status === 'retired') {
    throw new ValidationError('That paper has been retired. Author a new version rather than reviving it.', { paperId: 'Retired.' });
  }

  const criteria = (await db(env)
    .prepare('SELECT * FROM examination_criteria WHERE paper_id = ? ORDER BY sequence')
    .bind(paperId).all()).results;

  const sum = criteria.reduce((a, c) => a + Number(c.weight), 0);
  // Tolerance of a ten-thousandth: 0.1+0.2 is not 0.3 in binary floating
  // point, and refusing a rubric an author wrote correctly would be a
  // refusal about IEEE-754 rather than about the paper.
  if (Math.abs(sum - 1) > 0.0001) {
    throw new ValidationError(
      `The criterion weights sum to ${sum.toFixed(4)}, not 1. A composite that does not sum to its whole is not the composite the rubric describes.`,
      { criteria: 'Weights must sum to 1.' },
    );
  }

  const covered = new Set(criteria.map((c) => c.skill_id).filter(Boolean));
  const missing = SKILL_IDS.filter((id) => !covered.has(id));
  if (missing.length) {
    throw new ValidationError(
      `No criterion measures ${missing.join(', ')}. The published skill floor is read against all four skill sub-marks, so a paper that measures three of them refuses conferral to every candidate who sits it.`,
      { criteria: 'All four language skills must be measured.' },
    );
  }

  if (!criteria.some((c) => c.spoken === 1)) {
    throw new ValidationError(
      'No criterion is marked from the spoken paper. Every level examination carries a spoken component — see /students/examinations/ § II — and the spoken gate needs a criterion to read.',
      { criteria: 'At least one spoken criterion is required.' },
    );
  }

  // Retire whatever was published for this level. The partial unique
  // index would refuse the insert anyway; doing it here means the
  // refusal a caller sees is the one this function chose, and the
  // retirement is recorded with a date.
  await db(env)
    .prepare(`UPDATE examination_papers SET status = 'retired', retired_at = ?
              WHERE level_id = ? AND status = 'published'`)
    .bind(at, paper.level_id)
    .run();

  await db(env)
    .prepare(`UPDATE examination_papers
              SET status = 'published', published_by = ?, published_at = ?, rubric_published_on = ?
              WHERE id = ?`)
    .bind(actor.id, at, dayOnly(at), paperId)
    .run();

  return paperFor(env, paperId);
}

/** The paper a candidate at this level would sit today, or null. */
export async function publishedPaperFor(env, levelId) {
  const paper = await db(env)
    .prepare(`SELECT * FROM examination_papers WHERE level_id = ? AND status = 'published'`)
    .bind(levelIdOf(levelId))
    .first();
  return paper || null;
}

export async function paperFor(env, paperId) {
  const paper = await db(env).prepare('SELECT * FROM examination_papers WHERE id = ?').bind(paperId).first();
  if (!paper) throw new NotFoundError('No such examination paper.');
  const criteria = (await db(env)
    .prepare(`SELECT c.*, s.name AS skill_name, s.name_ar AS skill_name_ar
                FROM examination_criteria c
                LEFT JOIN language_skills s ON s.id = c.skill_id
               WHERE c.paper_id = ? ORDER BY c.sequence`)
    .bind(paperId).all()).results;
  return paperView(paper, criteria);
}

export function paperView(paper, criteria = []) {
  return {
    id: paper.id,
    levelId: paper.level_id,
    version: paper.version,
    title: paper.title,
    titleAr: paper.title_ar,
    conditions: paper.conditions,
    conditionsAr: paper.conditions_ar,
    openBook: paper.open_book === 1,
    durationMinutes: paper.duration_minutes,
    spokenMinutes: paper.spoken_minutes,
    windowWorkingDays: paper.window_working_days,
    rubricPublishedOn: paper.rubric_published_on,
    status: paper.status,
    publishedAt: paper.published_at,
    retiredAt: paper.retired_at,
    regulationVersion: paper.regulation_version,
    criteria: criteria.map((c) => ({
      id: c.id,
      sequence: c.sequence,
      code: c.code,
      name: c.name,
      nameAr: c.name_ar,
      descriptor: c.descriptor,
      descriptorAr: c.descriptor_ar,
      weight: c.weight,
      skillId: c.skill_id,
      skillName: c.skill_name || null,
      skillNameAr: c.skill_name_ar || null,
      spoken: c.spoken === 1,
    })),
  };
}

/* ───────────────────────────────────────────────────────────────
 * THE SITTING
 * ─────────────────────────────────────────────────────────────── */

/**
 * A reference the candidate reads aloud at the start of a recorded
 * task — /students/examinations/ § II. It ties that recording to that
 * attempt on that date, so it is legible when spoken: level, day, and
 * four characters from an unambiguous alphabet with no I, O, 0 or 1 in
 * it, because a person says these out loud and a listener types them.
 */
function sittingReference(levelId, attempt, at) {
  const alphabet = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  const bytes = crypto.getRandomValues(new Uint8Array(4));
  const tail = Array.from(bytes, (b) => alphabet[b % alphabet.length]).join('');
  return `WEC-L${levelId}-${dayOnly(at).replace(/-/g, '')}-${attempt}${tail}`;
}

/**
 * Enter a candidate for the level examination.
 *
 * § I · ENTRY: "You are entered by finishing the teaching. There is no
 * entry form, no examination fee and no closing date … A level
 * examination opens when all ten modules are complete and a member of
 * academic staff confirms it."
 *
 * THE MODULE GATE IS READ THROUGH progression.js, IMPORTED LAZILY. That
 * module reaches standing.js, which reaches this file for the very
 * examination being entered — a static import would be a cycle. The
 * import is inside the function rather than at the top so the cycle is
 * broken at module-evaluation time rather than merely tolerated, and
 * the gate is still the one engine that computes it. There is no second
 * implementation of "are the ten modules complete" anywhere.
 */
export async function enterCandidate(env, { actor, userId, levelId, at = nowIso() } = {}) {
  if (!actor || !actor.id) throw new ValidationError('A member of academic staff is required.', { actor: 'Required.' });
  const level = levelIdOf(levelId);

  const paper = await publishedPaperFor(env, level);
  if (!paper) {
    throw new ValidationError(
      `No examination paper is published for Level ${level}. A candidate cannot be entered for a paper the College has not set.`,
      { levelId: 'no_published_paper' },
    );
  }

  const enrolment = await db(env)
    .prepare('SELECT * FROM enrolments WHERE user_id = ? AND level_id = ?')
    .bind(userId, level).first();
  if (!enrolment) throw new NotFoundError('That learner has no enrolment at that level.');

  const { levelGateReport } = await import('../student/progression.js');
  const gate = await levelGateReport(env, { userId, levelId: level });
  const modules = gate.conditions.find((c) => c.id === 'level.gate.modules_complete');
  if (modules && modules.met !== true) {
    throw new ValidationError(
      `The level examination opens when all ten modules are complete. ${modules.detail}`,
      { 'level.gate.modules_complete': modules.detail },
    );
  }

  const sittings = (await db(env)
    .prepare('SELECT * FROM level_examinations WHERE user_id = ? AND level_id = ? ORDER BY attempt')
    .bind(userId, level).all()).results;

  const live = sittings.find((s) => !['released', 'set_aside', 'void'].includes(s.status));
  if (live) {
    // Idempotent rather than an error: entering twice is a double
    // submit, and an examination entry is not a thing to duplicate.
    return sittingFor(env, live.id);
  }

  const counting = sittings.filter((s) => s.counts_toward_resits === 1 && s.status !== 'void');
  if (counting.length >= MAX_SITTINGS) {
    throw new ValidationError(
      `Three sittings have been taken at this level — one attempt and two resits. A third failure means the level is repeated rather than the assessment retaken; see ${PUBLISHED.regulations}.`,
      { attempt: 'resit_allowance_spent' },
    );
  }

  // § VIII — "No resit is sat sooner than fourteen days after the
  // attempt before it." Measured from the previous attempt's submission
  // where it was submitted, and from its window opening where it was
  // not, because an attempt abandoned unsubmitted still took the paper.
  const last = counting[counting.length - 1];
  if (last) {
    const from = last.submitted_at || last.opened_at || last.window_opens_on;
    const days = (Date.parse(at) - Date.parse(from)) / 86400000;
    if (days < RESIT_INTERVAL_DAYS) {
      const waitUntil = new Date(Date.parse(from) + RESIT_INTERVAL_DAYS * 86400000).toISOString();
      throw new ValidationError(
        `A resit is not sat sooner than ${RESIT_INTERVAL_DAYS} days after the attempt before it, so that a second attempt follows some teaching rather than following a disappointment by an hour. The next attempt may be entered from ${dayOnly(waitUntil)}.`,
        { attempt: 'resit_interval', availableFrom: waitUntil },
      );
    }
  }

  // The ORDINAL is one past the highest ever issued at this level, so
  // it is never reused; the CAP above counted only the sittings that
  // count. A candidate whose connection dropped twice sits attempt 4
  // and it is still their second counting sitting.
  const attempt = sittings.reduce((max, s) => Math.max(max, s.attempt), 0) + 1;
  const id = newId('lex');
  const closes = addWorkingDays(at, paper.window_working_days);

  await db(env)
    .prepare(`INSERT INTO level_examinations
        (id, user_id, level_id, paper_id, attempt, counts_toward_resits,
         window_opens_on, window_closes_on, sitting_reference, status,
         regulation_version, created_at)
        VALUES (?, ?, ?, ?, ?, 1, ?, ?, ?, 'entered', ?, ?)`)
    .bind(id, userId, level, paper.id, attempt, dayOnly(at), dayOnly(closes),
      sittingReference(level, attempt, at), REGULATION_VERSION, at)
    .run();

  await logEvent(env, {
    examinationId: id, kind: 'entered', actorId: actor.id, at,
    note: `Attempt ${attempt} of ${MAX_SITTINGS}. Window closes ${dayOnly(closes)}.`,
  });

  return sittingFor(env, id);
}

/**
 * The candidate opens the paper, and the three hours start.
 *
 * § III — "The clock starts when you open the paper … rather than from
 * an hour the College picked for a continent it is not on."
 *
 * § IV — a paper reopened within sixty minutes of a break RESUMES with
 * the time that was left on it, which is why reopening an already-open
 * sitting returns it unchanged rather than restarting anything. The
 * clock is `due_at`, written once; nothing here can move it forward.
 */
export async function openPaper(env, { user, examinationId, at = nowIso() } = {}) {
  const sitting = await db(env).prepare('SELECT * FROM level_examinations WHERE id = ?').bind(examinationId).first();
  if (!sitting) throw new NotFoundError('No such sitting.');
  if (!user || user.id !== sitting.user_id) {
    throw new ValidationError('A paper is opened by the candidate sitting it.', { examinationId: 'Not yours.' });
  }
  if (sitting.status === 'open') return sittingFor(env, examinationId);
  if (sitting.status !== 'entered') {
    throw new ValidationError(`This sitting is "${sitting.status}" and cannot be opened.`, { status: sitting.status });
  }
  if (dayOnly(at) > sitting.window_closes_on) {
    throw new ValidationError(
      `The window for this sitting closed on ${sitting.window_closes_on}.`,
      { examinationId: 'window_closed' },
    );
  }

  const paper = await db(env).prepare('SELECT * FROM examination_papers WHERE id = ?').bind(sitting.paper_id).first();
  const due = new Date(Date.parse(at) + paper.duration_minutes * 60000).toISOString();

  await db(env)
    .prepare(`UPDATE level_examinations SET status = 'open', opened_at = ?, due_at = ? WHERE id = ?`)
    .bind(at, due, examinationId)
    .run();
  await logEvent(env, { examinationId, kind: 'opened', actorId: user.id, at, note: `Due ${due}.` });
  return sittingFor(env, examinationId);
}

/**
 * The candidate submits.
 *
 * The lateness band is decided HERE and stored, because § V bands it in
 * working days from the deadline and the deadline is `due_at` — a band
 * recomputed at read time would move if the working-day calendar ever
 * changed, and a cap a learner was told about is a fact about a day.
 */
export async function submitPaper(env, { user, examinationId, at = nowIso() } = {}) {
  const sitting = await db(env).prepare('SELECT * FROM level_examinations WHERE id = ?').bind(examinationId).first();
  if (!sitting) throw new NotFoundError('No such sitting.');
  if (!user || user.id !== sitting.user_id) {
    throw new ValidationError('A paper is submitted by the candidate sitting it.', { examinationId: 'Not yours.' });
  }
  if (sitting.status !== 'open') {
    throw new ValidationError(`This sitting is "${sitting.status}" and cannot be submitted.`, { status: sitting.status });
  }

  const lateDays = Date.parse(at) > Date.parse(sitting.due_at)
    ? workingDaysBetween(sitting.due_at, at)
    : 0;
  const withinDay = Date.parse(at) - Date.parse(sitting.due_at) <= 86400000;
  const band = lateDays === 0
    ? 'on_time'
    : (withinDay ? 'grace' : (lateDays <= 5 ? 'capped' : 'incomplete'));

  await db(env)
    .prepare(`UPDATE level_examinations
              SET status = 'submitted', submitted_at = ?, lateness = ?, late_working_days = ?
              WHERE id = ?`)
    .bind(at, band, lateDays, examinationId)
    .run();
  await logEvent(env, {
    examinationId, kind: 'submitted', actorId: user.id, at,
    note: band === 'on_time' ? 'Within the deadline.' : LATENESS_BANDS.find((b) => b.id === band).label,
  });
  return sittingFor(env, examinationId);
}

/**
 * § IV · INTERRUPTION and § VI · MITIGATION.
 *
 * The published allowance is TWO a level "on your word alone"; the
 * third and beyond is the panel's. The count is enforced here rather
 * than described, and the refusal names the panel rather than simply
 * saying no — a learner refused with nowhere to go is a learner the
 * procedure has failed.
 */
export async function setAside(env, { actor, examinationId, reason, note = null, at = nowIso() } = {}) {
  if (!actor || !actor.id) throw new ValidationError('An actor is required.', { actor: 'Required.' });
  if (!SET_ASIDE_REASONS[reason]) {
    throw new ValidationError('That is not a reason an attempt is set aside for.', { reason: 'Not a reason.' });
  }
  const sitting = await db(env).prepare('SELECT * FROM level_examinations WHERE id = ?').bind(examinationId).first();
  if (!sitting) throw new NotFoundError('No such sitting.');
  if (['released', 'void', 'set_aside'].includes(sitting.status)) {
    throw new ValidationError(`This sitting is "${sitting.status}" and cannot be set aside.`, { status: sitting.status });
  }

  if (reason === 'learner_election') {
    const spent = (await db(env)
      .prepare(`SELECT COUNT(*) AS n FROM level_examinations
                 WHERE user_id = ? AND level_id = ? AND set_aside_reason = 'learner_election'`)
      .bind(sitting.user_id, sitting.level_id).first()).n;
    if (spent >= SET_ASIDE_ON_ELECTION) {
      throw new ValidationError(
        `Two attempts a level are set aside on the candidate's word alone, and both have been. A third in the same level is decided by the mitigating circumstances panel — see ${PUBLISHED.conduct}.`,
        { reason: 'election_allowance_spent' },
      );
    }
  }

  await db(env)
    .prepare(`UPDATE level_examinations
              SET status = 'set_aside', set_aside_reason = ?, set_aside_at = ?,
                  set_aside_by = ?, set_aside_note = ?, counts_toward_resits = 0
              WHERE id = ?`)
    .bind(reason, at, actor.id, text(note, 'note', { max: 2000, required: false }), examinationId)
    .run();
  await logEvent(env, {
    examinationId, kind: 'set_aside', actorId: actor.id, at,
    note: SET_ASIDE_REASONS[reason].label,
  });
  return sittingFor(env, examinationId);
}

/**
 * § I — the three things, and only three, that end an attempt. Each is
 * referred under academic integrity, and this function records the
 * ending rather than the referral: the College has no misconduct
 * register (docs/platform-capabilities.md § 10 says so), and inventing
 * one as a side effect of voiding a paper would put a person's
 * integrity record in a table nobody adopted.
 */
export async function voidAttempt(env, { actor, examinationId, reason, note, at = nowIso() } = {}) {
  if (!actor || !actor.id) throw new ValidationError('An actor is required.', { actor: 'Required.' });
  if (!VOID_REASONS[reason]) {
    throw new ValidationError(
      'An attempt ends for one of three published reasons and no other.',
      { reason: `One of: ${Object.keys(VOID_REASONS).join(', ')}.` },
    );
  }
  const sitting = await db(env).prepare('SELECT * FROM level_examinations WHERE id = ?').bind(examinationId).first();
  if (!sitting) throw new NotFoundError('No such sitting.');
  if (sitting.status === 'void') return sittingFor(env, examinationId);

  await db(env)
    .prepare(`UPDATE level_examinations
              SET status = 'void', void_reason = ?, void_at = ?, void_by = ?, void_note = ?
              WHERE id = ?`)
    .bind(reason, at, actor.id, text(note, 'note', { max: 2000 }), examinationId)
    .run();
  await logEvent(env, { examinationId, kind: 'voided', actorId: actor.id, at, note: VOID_REASONS[reason].label });
  return sittingFor(env, examinationId);
}

/**
 * § V — "A cap is lifted in full where an extension was granted or a
 * mitigating claim is upheld."
 *
 * It lifts the cap. It does not touch a mark, because § VI is explicit
 * that a panel "may never raise a mark", and a function that could do
 * both would be a function somebody eventually uses to do the second.
 */
export async function liftLateCap(env, { actor, examinationId, reason, at = nowIso() } = {}) {
  if (!actor || !actor.id) throw new ValidationError('An actor is required.', { actor: 'Required.' });
  if (!['extension_granted', 'mitigation_upheld'].includes(reason)) {
    throw new ValidationError(
      'A cap is lifted where an extension was granted or a mitigating claim upheld, and for no other reason.',
      { reason: 'Not a ground for lifting a cap.' },
    );
  }
  const sitting = await db(env).prepare('SELECT * FROM level_examinations WHERE id = ?').bind(examinationId).first();
  if (!sitting) throw new NotFoundError('No such sitting.');
  if (sitting.lateness === 'on_time' || sitting.lateness === 'grace') {
    throw new ValidationError('This sitting carries no cap to lift.', { examinationId: 'no_cap' });
  }
  await db(env)
    .prepare(`UPDATE level_examinations SET cap_lifted_by = ?, cap_lifted_reason = ?, cap_lifted_at = ? WHERE id = ?`)
    .bind(actor.id, reason, at, examinationId)
    .run();
  await logEvent(env, { examinationId, kind: 'cap_lifted', actorId: actor.id, at, note: reason });
  return sittingFor(env, examinationId);
}

/**
 * The spoken paper — § II · IDENTITY and `level.gate.spoken_paper`.
 *
 * The recording and the pass are recorded together because the gate is
 * "recorded AND passed": a recording with no judgement on it satisfies
 * neither half, and a pass with no recording behind it is a claim about
 * speaking made without listening to any.
 */
export async function recordSpokenPaper(env, { actor, examinationId, recordingId, passed, at = nowIso() } = {}) {
  if (!actor || !actor.id) throw new ValidationError('An examiner is required.', { actor: 'Required.' });
  if (typeof passed !== 'boolean') {
    throw new ValidationError('The spoken paper is passed or it is not.', { passed: 'Required.' });
  }
  const sitting = await db(env).prepare('SELECT * FROM level_examinations WHERE id = ?').bind(examinationId).first();
  if (!sitting) throw new NotFoundError('No such sitting.');

  if (recordingId) {
    const rec = await db(env).prepare('SELECT id, user_id FROM learner_recordings WHERE id = ?').bind(recordingId).first();
    if (!rec) throw new NotFoundError('No such recording.');
    if (rec.user_id !== sitting.user_id) {
      throw new ValidationError(
        'That recording belongs to a different learner. A recording that does not match the candidate is referred to a person rather than marked.',
        { recordingId: 'Not this candidate\'s.' },
      );
    }
  }

  await db(env)
    .prepare(`UPDATE level_examinations
              SET spoken_recording_id = ?, spoken_passed = ?, spoken_marked_by = ?, spoken_marked_at = ?
              WHERE id = ?`)
    .bind(recordingId || null, passed ? 1 : 0, actor.id, at, examinationId)
    .run();
  await logEvent(env, {
    examinationId, kind: 'spoken_marked', actorId: actor.id, at,
    note: passed ? 'Spoken paper passed.' : 'Spoken paper not passed.',
  });
  return sittingFor(env, examinationId);
}

/* ───────────────────────────────────────────────────────────────
 * MARKING, AND THE SECOND READER
 * ─────────────────────────────────────────────────────────────── */

/**
 * Record one marker's reading of every criterion.
 *
 * A marker submits a WHOLE script or none of it. Partial marking would
 * make "the two marks" an ambiguous quantity — the tolerance is read
 * criterion by criterion, and half a reading has nothing to compare.
 *
 * A marker may not mark twice in different roles on the same script:
 * the second reader exists to be a second person.
 */
export async function recordMarks(env, { actor, examinationId, role, marks = [], at = nowIso() } = {}) {
  if (!actor || !actor.id) throw new ValidationError('A marker is required.', { actor: 'Required.' });
  if (!['first', 'second', 'third'].includes(role)) {
    throw new ValidationError('A reading is a first, a second or a third.', { role: 'Not a marking role.' });
  }
  const sitting = await db(env).prepare('SELECT * FROM level_examinations WHERE id = ?').bind(examinationId).first();
  if (!sitting) throw new NotFoundError('No such sitting.');
  if (!['submitted', 'marking', 'reconciliation'].includes(sitting.status)) {
    throw new ValidationError(
      `A script is marked once it is submitted and before it is released. This one is "${sitting.status}".`,
      { status: sitting.status },
    );
  }

  const criteria = (await db(env)
    .prepare('SELECT * FROM examination_criteria WHERE paper_id = ? ORDER BY sequence')
    .bind(sitting.paper_id).all()).results;

  const existing = (await db(env)
    .prepare('SELECT * FROM examination_marks WHERE examination_id = ?')
    .bind(examinationId).all()).results;

  if (existing.some((m) => m.marker_role === role)) {
    throw new ValidationError(
      `A ${role} reading of this script is already on the record, and a mark is never overwritten. Both original marks stay on the record — see ${PUBLISHED.marking}.`,
      { role: 'already_marked' },
    );
  }
  const otherRoles = existing.filter((m) => m.marker_id === actor.id);
  if (otherRoles.length) {
    throw new ValidationError(
      `This script has already been read by you as ${otherRoles[0].marker_role} marker. A second reader is a second person.`,
      { role: 'same_marker' },
    );
  }
  if (role === 'second' && !existing.some((m) => m.marker_role === 'first')) {
    throw new ValidationError('There is no first reading for this to be a second of.', { role: 'no_first_mark' });
  }
  if (role === 'third') {
    const open = (await db(env)
      .prepare('SELECT COUNT(*) AS n FROM examination_reconciliations WHERE examination_id = ? AND settled_at IS NULL')
      .bind(examinationId).first()).n;
    if (!open) {
      throw new ValidationError(
        'A third marker reads a script only where a reconciliation did not settle. There is no open reconciliation on this one.',
        { role: 'no_open_reconciliation' },
      );
    }
  }

  const byCriterion = new Map();
  for (const m of Array.isArray(marks) ? marks : []) {
    const id = m && m.criterionId ? String(m.criterionId) : '';
    byCriterion.set(id, m);
  }
  const missing = criteria.filter((c) => !byCriterion.has(c.id));
  if (missing.length) {
    throw new ValidationError(
      `A script is marked whole: ${missing.length} criterion${missing.length === 1 ? '' : 'a'} carries no mark (${missing.map((c) => c.code).join(', ')}).`,
      Object.fromEntries(missing.map((c) => [c.id, 'No mark.'])),
    );
  }

  for (const c of criteria) {
    const given = byCriterion.get(c.id);
    const mark = markOf(given.mark, c.id);
    await db(env)
      .prepare(`INSERT INTO examination_marks
          (id, examination_id, criterion_id, marker_role, marker_id, mark, comment, marked_at)
          VALUES (?, ?, ?, ?, ?, ?, ?, ?)`)
      .bind(newId('xmk'), examinationId, c.id, role, actor.id, mark,
        text(given.comment, `${c.id}.comment`, { max: 4000, required: false }), at)
      .run();
  }

  await logEvent(env, {
    examinationId,
    kind: role === 'first' ? 'marked' : (role === 'second' ? 'second_marked' : 'third_marked'),
    actorId: actor.id, at,
  });

  if (role === 'second') {
    const opened = await openReconciliations(env, { examinationId, criteria, at });
    await db(env)
      .prepare(`UPDATE level_examinations SET status = ? WHERE id = ?`)
      .bind(opened.length ? 'reconciliation' : 'marking', examinationId)
      .run();
  } else if (role === 'first') {
    await db(env).prepare(`UPDATE level_examinations SET status = 'marking' WHERE id = ?`).bind(examinationId).run();
  }

  return sittingFor(env, examinationId);
}

/**
 * The handbook's three triggers, applied the moment a second reading
 * lands. Each becomes a row that has to be settled in writing before
 * anything can be released.
 *
 *   tolerance         — the two marks on one criterion differ by more
 *                       than three percentage points.
 *   skill_floor       — the two marks on one criterion fall either side
 *                       of the published fifty. "A point either side of
 *                       a floor is no small thing to the learner", so
 *                       size does not enter into it.
 *   honour_threshold  — the two whole readings of the script fall in
 *                       different honour bands. This one is recorded
 *                       against the script rather than a criterion,
 *                       because it can arise with no single criterion
 *                       having moved three points at all.
 */
async function openReconciliations(env, { examinationId, criteria, at }) {
  const rows = (await db(env)
    .prepare(`SELECT * FROM examination_marks WHERE examination_id = ? AND marker_role IN ('first','second')`)
    .bind(examinationId).all()).results;

  const first = new Map(rows.filter((r) => r.marker_role === 'first').map((r) => [r.criterion_id, r.mark]));
  const second = new Map(rows.filter((r) => r.marker_role === 'second').map((r) => [r.criterion_id, r.mark]));
  const due = addWorkingDays(at, RECONCILIATION_WORKING_DAYS);
  const opened = [];

  const open = async (criterionId, a, b, trigger) => {
    await db(env)
      .prepare(`INSERT INTO examination_reconciliations
          (id, examination_id, criterion_id, first_mark, second_mark, divergence, trigger_reason, opened_at, settle_due_on)
          VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`)
      .bind(newId('xrc'), examinationId, criterionId, a, b, Math.abs(a - b), trigger, at, due)
      .run();
    opened.push({ criterionId, trigger });
  };

  for (const c of criteria) {
    const a = first.get(c.id);
    const b = second.get(c.id);
    if (!isNum(a) || !isNum(b)) continue;
    // THE FLOOR CROSSING IS TESTED FIRST, and the order is the point.
    // A pair that both diverges by more than three points AND falls
    // either side of the floor opens ONE reconciliation, and it is
    // recorded as the floor case — "a point either side of a floor is
    // no small thing to the learner" is the more consequential fact,
    // and the moderating committee reads this register to see where
    // the standard moved. Recording it as an ordinary tolerance case
    // would lose the half that matters.
    const straddles = (a < EXAMINATION_FLOOR) !== (b < EXAMINATION_FLOOR);
    if (straddles) { await open(c.id, a, b, 'skill_floor'); continue; }
    if (Math.abs(a - b) > TOLERANCE_POINTS) await open(c.id, a, b, 'tolerance');
  }

  const overallA = weightedOverall(criteria, first);
  const overallB = weightedOverall(criteria, second);
  if (isNum(overallA) && isNum(overallB) && honourBandOf(overallA) !== honourBandOf(overallB)) {
    await open(null, roundMark(overallA), roundMark(overallB), 'honour_threshold');
  }

  if (opened.length) {
    await logEvent(env, {
      examinationId, kind: 'reconciliation_opened', at,
      note: `${opened.length} reconciliation${opened.length === 1 ? '' : 's'} opened; due ${dayOnly(due)}.`,
    });
  }
  return opened;
}

function weightedOverall(criteria, marks) {
  let sum = 0;
  let weight = 0;
  for (const c of criteria) {
    const m = marks instanceof Map ? marks.get(c.id) : marks[c.id];
    if (!isNum(m)) return null;
    sum += m * Number(c.weight);
    weight += Number(c.weight);
  }
  return weight > 0 ? sum / weight : null;
}

/**
 * Settle a reconciliation, in writing.
 *
 * `how` is 'agreed' where the two markers reached one mark inside the
 * two working days, and 'third_marker' where they did not and a third
 * reader's mark stands. The statement is required by the CHECK and by
 * this function, because "the markers reconcile in writing" is the
 * published rule and a settled reconciliation with no writing in it is
 * not one.
 */
export async function settleReconciliation(env, {
  actor, reconciliationId, settledMark, statement, how = 'agreed', thirdMarkerId = null, at = nowIso(),
} = {}) {
  if (!actor || !actor.id) throw new ValidationError('An actor is required.', { actor: 'Required.' });
  if (!['agreed', 'third_marker'].includes(how)) {
    throw new ValidationError('A reconciliation is agreed, or it goes to a third marker.', { how: 'Not a settlement.' });
  }
  const rec = await db(env)
    .prepare('SELECT * FROM examination_reconciliations WHERE id = ?').bind(reconciliationId).first();
  if (!rec) throw new NotFoundError('No such reconciliation.');
  if (rec.settled_at) {
    throw new ValidationError('That reconciliation is already settled, and a settlement is not rewritten.', { reconciliationId: 'Settled.' });
  }

  const mark = markOf(settledMark, 'settledMark');
  const written = text(statement, 'statement', { max: 4000 });

  if (how === 'third_marker') {
    if (!thirdMarkerId) {
      throw new ValidationError('A third reading has a third reader.', { thirdMarkerId: 'Required.' });
    }
    const third = await db(env)
      .prepare(`SELECT mark FROM examination_marks
                 WHERE examination_id = ? AND marker_role = 'third'
                   AND (criterion_id = ? OR ? IS NULL) LIMIT 1`)
      .bind(rec.examination_id, rec.criterion_id, rec.criterion_id).first();
    if (rec.criterion_id && (!third || Number(third.mark) !== mark)) {
      throw new ValidationError(
        'Where a reconciliation goes to a third marker, the third marker\'s mark stands. The settled mark must be that mark.',
        { settledMark: 'Not the third marker\'s mark.' },
      );
    }
  }

  await db(env)
    .prepare(`UPDATE examination_reconciliations
              SET settled_at = ?, settled_mark = ?, settled_by = ?, statement = ?,
                  settled_how = ?, third_marker_id = ?
              WHERE id = ?`)
    .bind(at, mark, actor.id, written, how, how === 'third_marker' ? thirdMarkerId : null, reconciliationId)
    .run();
  await logEvent(env, {
    examinationId: rec.examination_id, kind: 'reconciliation_settled', actorId: actor.id, at,
    note: how === 'agreed' ? 'Agreed between the two markers.' : 'Settled by a third marker.',
  });

  const stillOpen = (await db(env)
    .prepare('SELECT COUNT(*) AS n FROM examination_reconciliations WHERE examination_id = ? AND settled_at IS NULL')
    .bind(rec.examination_id).first()).n;
  if (!stillOpen) {
    await db(env)
      .prepare(`UPDATE level_examinations SET status = 'marking' WHERE id = ? AND status = 'reconciliation'`)
      .bind(rec.examination_id).run();
  }
  return sittingFor(env, rec.examination_id);
}

/* ───────────────────────────────────────────────────────────────
 * THE MARK THAT COUNTS — derived, never stored over its own sources
 * ─────────────────────────────────────────────────────────────── */

/**
 * Which mark counts on each criterion, and why that one.
 *
 * Precedence, straight from the handbook:
 *
 *   1. a SETTLED reconciliation's mark — it is the written agreement,
 *      or the third marker's, and either way it is the answer;
 *   2. an OPEN reconciliation — nothing counts yet, and that is a state
 *      rather than a missing value;
 *   3. two readings inside the tolerance — "the first stands";
 *   4. one reading — not yet second-marked, so nothing counts.
 *
 * Every branch returns the basis alongside the mark. A figure that
 * cannot say which of these four produced it is a figure nobody can
 * check, and the whole file exists so that a mark can be checked.
 */
export function countingMarks({ criteria, marks, reconciliations }) {
  const byRole = (criterionId, role) =>
    marks.find((m) => m.criterion_id === criterionId && m.marker_role === role) || null;

  return criteria.map((c) => {
    const first = byRole(c.id, 'first');
    const second = byRole(c.id, 'second');
    const third = byRole(c.id, 'third');
    const rec = reconciliations.find((r) => r.criterion_id === c.id) || null;

    if (rec && rec.settled_at) {
      return {
        criterionId: c.id, code: c.code, weight: Number(c.weight), skillId: c.skill_id,
        mark: Number(rec.settled_mark), basis: rec.settled_how === 'third_marker' ? 'third_marker' : 'reconciled',
        first: first ? Number(first.mark) : null,
        second: second ? Number(second.mark) : null,
        third: third ? Number(third.mark) : null,
        state: 'counted',
      };
    }
    if (rec && !rec.settled_at) {
      return {
        criterionId: c.id, code: c.code, weight: Number(c.weight), skillId: c.skill_id,
        mark: null, basis: null,
        first: first ? Number(first.mark) : null,
        second: second ? Number(second.mark) : null,
        third: third ? Number(third.mark) : null,
        state: 'reconciliation_open',
      };
    }
    // A third reader reads the WHOLE script, so a third mark exists on
    // criteria nobody disputed. It does not displace them: the third
    // marker is appointed to settle a reconciliation, and their mark
    // stands where one was opened and nowhere else. On every other
    // criterion the published rule is unchanged — the first stands.
    if (first && second) {
      return {
        criterionId: c.id, code: c.code, weight: Number(c.weight), skillId: c.skill_id,
        mark: Number(first.mark), basis: 'within_tolerance',
        first: Number(first.mark), second: Number(second.mark), third: null,
        state: 'counted',
      };
    }
    return {
      criterionId: c.id, code: c.code, weight: Number(c.weight), skillId: c.skill_id,
      mark: null, basis: null,
      first: first ? Number(first.mark) : null, second: null, third: null,
      state: first ? 'awaiting_second_marker' : 'unmarked',
    };
  });
}

/**
 * The four skill sub-marks `level.gate.examination_skill_floor` is read
 * against — the weighted mean of the criteria carrying each skill.
 *
 * A skill with no counted criterion is null, and null is the answer
 * that matters: `skill.null_blocks_conferral` refuses the award rather
 * than passing a skill by default.
 */
export function skillSubMarks(counted) {
  const out = {};
  for (const skillId of SKILL_IDS) {
    const rows = counted.filter((c) => c.skillId === skillId);
    const marked = rows.filter((c) => isNum(c.mark));
    if (!rows.length || marked.length !== rows.length) { out[skillId] = null; continue; }
    const weight = marked.reduce((a, c) => a + c.weight, 0);
    out[skillId] = weight > 0 ? roundMark(marked.reduce((a, c) => a + c.mark * c.weight, 0) / weight) : null;
  }
  return out;
}

/**
 * The whole examination result, derived from the rows and nothing else.
 *
 * The late cap is applied HERE rather than at storage, so the mark
 * actually achieved is always recoverable — § V: "A capped mark goes on
 * the transcript as the figure it is, with the reason beside it."
 */
export function examinationResult({ sitting, paper, criteria, marks, reconciliations }) {
  const counted = countingMarks({ criteria, marks, reconciliations });
  const outstanding = counted.filter((c) => c.state !== 'counted')
    .map((c) => ({ code: c.code, state: c.state }));

  // The honours-threshold case is recorded against the WHOLE script
  // rather than a criterion, so no criterion carries its unsettled
  // state. It still stops everything: a script whose two readings put
  // the candidate in different honour bands has not been reconciled,
  // and releasing it would release whichever reading happened to be
  // first.
  const openWholeScript = reconciliations.filter((r) => !r.settled_at && r.criterion_id === null);
  for (const r of openWholeScript) outstanding.push({ code: r.trigger_reason, state: 'reconciliation_open' });

  const raw = outstanding.length
    ? null
    : weightedOverall(criteria, Object.fromEntries(counted.map((c) => [c.criterionId, c.mark])));

  const capApplies = sitting.lateness === 'capped' && !sitting.cap_lifted_at;
  const capped = isNum(raw) && capApplies && raw > SCALE.passMark;
  const percentage = isNum(raw) ? roundMark(capped ? SCALE.passMark : raw) : null;

  const skills = skillSubMarks(counted);
  const criterionFloorMet = counted.some((c) => c.state !== 'counted')
    ? null
    : counted.every((c) => meetsThreshold(c.mark, EXAMINATION_FLOOR));
  const skillFloorMet = SKILL_IDS.every((id) => isNum(skills[id]))
    ? SKILL_IDS.every((id) => meetsThreshold(skills[id], EXAMINATION_FLOOR))
    : null;

  return {
    percentage,
    rawPercentage: isNum(raw) ? roundMark(raw) : null,
    capped,
    capReason: capped ? 'late_submission' : null,
    resat: sitting.attempt > 1,
    criterionFloorMet,
    skillFloorMet,
    spokenPaperPassed: sitting.spoken_passed === null || sitting.spoken_passed === undefined
      ? null
      : sitting.spoken_passed === 1,
    skills,
    criteria: counted,
    outstanding,
    openReconciliations: reconciliations.filter((r) => !r.settled_at).length,
    lateness: sitting.lateness,
    paperId: paper ? paper.id : null,
    rubricPublishedOn: paper ? paper.rubric_published_on : null,
    regulationVersion: sitting.regulation_version,
  };
}

/* ───────────────────────────────────────────────────────────────
 * RELEASE
 * ─────────────────────────────────────────────────────────────── */

/**
 * Release the result to the candidate.
 *
 * Four refusals, each of them a published sentence rather than an
 * engineering preference:
 *
 *   · every criterion carries a first and a second reading — § VII,
 *     "Every judged mark is read by a second marker before it reaches
 *     you";
 *   · every reconciliation is settled — handbook § IV;
 *   · the spoken paper is marked — `level.gate.spoken_paper`;
 *   · the sitting is not void or set aside, which have no result to
 *     release by definition.
 *
 * A released sitting stays `provisional` until moderation closes on the
 * batch, and the payload says so, because § VII says so.
 */
export async function release(env, { actor, examinationId, at = nowIso() } = {}) {
  if (!actor || !actor.id) throw new ValidationError('A releaser is required.', { actor: 'Required.' });
  const loaded = await loadSitting(env, examinationId);
  const { sitting } = loaded;
  if (sitting.status === 'released') return sittingFor(env, examinationId);
  if (['void', 'set_aside'].includes(sitting.status)) {
    throw new ValidationError(`This sitting is "${sitting.status}" and has no result to release.`, { status: sitting.status });
  }

  const result = examinationResult(loaded);
  if (result.outstanding.length) {
    throw new ValidationError(
      `This script is not ready to release: ${result.outstanding.map((o) => `${o.code} — ${o.state.replace(/_/g, ' ')}`).join(' · ')}.`,
      Object.fromEntries(result.outstanding.map((o) => [o.code, o.state])),
    );
  }
  if (sitting.spoken_marked_at === null) {
    throw new ValidationError(
      'The spoken paper has not been marked. Speaking is assessed by a person listening to a candidate speak, and the level award has a gate on it.',
      { spokenPaper: 'not_marked' },
    );
  }

  await db(env)
    .prepare(`UPDATE level_examinations
              SET status = 'released', released_at = ?, released_mark = ?, released_by = ?, provisional = 1
              WHERE id = ?`)
    .bind(at, result.percentage, actor.id, examinationId)
    .run();
  await logEvent(env, {
    examinationId, kind: 'released', actorId: actor.id, at,
    note: `${result.percentage}%${result.capped ? ' (capped at the pass threshold for late submission)' : ''}. Provisional until moderation closes.`,
  });
  return sittingFor(env, examinationId);
}

/**
 * § VII — "A level examination mark is provisional until moderation
 * closes on the batch, within five working days of release."
 *
 * Closing moderation does not move a mark and this function cannot:
 * "Moderation may return a whole batch for re-marking; it may not move
 * one learner's mark on its own."
 */
export async function closeModeration(env, { actor, examinationId, at = nowIso() } = {}) {
  if (!actor || !actor.id) throw new ValidationError('An actor is required.', { actor: 'Required.' });
  const sitting = await db(env).prepare('SELECT * FROM level_examinations WHERE id = ?').bind(examinationId).first();
  if (!sitting) throw new NotFoundError('No such sitting.');
  if (sitting.status !== 'released') {
    throw new ValidationError('Moderation closes on a released batch.', { status: sitting.status });
  }
  await db(env)
    .prepare(`UPDATE level_examinations SET provisional = 0, moderation_closed_at = ? WHERE id = ?`)
    .bind(at, examinationId).run();
  await logEvent(env, { examinationId, kind: 'moderation_closed', actorId: actor.id, at });
  return sittingFor(env, examinationId);
}

/* ───────────────────────────────────────────────────────────────
 * READING
 * ─────────────────────────────────────────────────────────────── */

async function loadSitting(env, examinationId) {
  const sitting = await db(env).prepare('SELECT * FROM level_examinations WHERE id = ?').bind(examinationId).first();
  if (!sitting) throw new NotFoundError('No such sitting.');
  const paper = await db(env).prepare('SELECT * FROM examination_papers WHERE id = ?').bind(sitting.paper_id).first();
  const criteria = (await db(env)
    .prepare(`SELECT c.*, s.name AS skill_name, s.name_ar AS skill_name_ar
                FROM examination_criteria c LEFT JOIN language_skills s ON s.id = c.skill_id
               WHERE c.paper_id = ? ORDER BY c.sequence`)
    .bind(sitting.paper_id).all()).results;
  const marks = (await db(env)
    .prepare('SELECT * FROM examination_marks WHERE examination_id = ?').bind(examinationId).all()).results;
  const reconciliations = (await db(env)
    .prepare('SELECT * FROM examination_reconciliations WHERE examination_id = ?').bind(examinationId).all()).results;
  return { sitting, paper, criteria, marks, reconciliations };
}

/**
 * One sitting, as a payload.
 *
 * `marks` is deliberately NOT here — a candidate reads their marks
 * through `sittingForCandidate()`, which serves the released figure and
 * the rubric that produced it, and a marker reads them through
 * `scriptForMarking()`, which withholds the other marker's reading
 * until their own is on the record. Handing every caller every row
 * would let a page show a second marker the first marker's numbers
 * before they had formed a view, which is the one thing a second
 * reading exists to prevent.
 */
export async function sittingFor(env, examinationId) {
  const loaded = await loadSitting(env, examinationId);
  const { sitting, paper, criteria, reconciliations } = loaded;
  const result = examinationResult(loaded);
  return {
    id: sitting.id,
    userId: sitting.user_id,
    levelId: sitting.level_id,
    attempt: sitting.attempt,
    maxSittings: MAX_SITTINGS,
    countsTowardResits: sitting.counts_toward_resits === 1,
    sittingReference: sitting.sitting_reference,
    status: sitting.status,
    window: { opensOn: sitting.window_opens_on, closesOn: sitting.window_closes_on },
    openedAt: sitting.opened_at,
    dueAt: sitting.due_at,
    submittedAt: sitting.submitted_at,
    lateness: sitting.lateness,
    lateWorkingDays: sitting.late_working_days,
    capLifted: sitting.cap_lifted_at
      ? { at: sitting.cap_lifted_at, reason: sitting.cap_lifted_reason }
      : null,
    setAside: sitting.set_aside_reason
      ? {
        reason: sitting.set_aside_reason,
        label: SET_ASIDE_REASONS[sitting.set_aside_reason].label,
        labelAr: SET_ASIDE_REASONS[sitting.set_aside_reason].labelAr,
        at: sitting.set_aside_at, note: sitting.set_aside_note,
      }
      : null,
    void: sitting.void_reason
      ? {
        reason: sitting.void_reason,
        label: VOID_REASONS[sitting.void_reason].label,
        labelAr: VOID_REASONS[sitting.void_reason].labelAr,
        at: sitting.void_at, note: sitting.void_note,
      }
      : null,
    spokenPaper: {
      recordingId: sitting.spoken_recording_id,
      passed: sitting.spoken_passed === null ? null : sitting.spoken_passed === 1,
      markedAt: sitting.spoken_marked_at,
      minutes: paper ? paper.spoken_minutes : SPOKEN_MINUTES,
    },
    released: sitting.released_at
      ? { at: sitting.released_at, mark: sitting.released_mark, provisional: sitting.provisional === 1 }
      : null,
    moderationClosedAt: sitting.moderation_closed_at,
    paper: paper ? paperView(paper, criteria) : null,
    result,
    reconciliations: reconciliations.map(reconciliationView),
    regulationVersion: sitting.regulation_version,
  };
}

function reconciliationView(r) {
  return {
    id: r.id,
    criterionId: r.criterion_id,
    firstMark: r.first_mark,
    secondMark: r.second_mark,
    divergence: r.divergence,
    trigger: r.trigger_reason,
    triggerLabel: {
      tolerance: `The two readings differ by more than ${TOLERANCE_POINTS} percentage points.`,
      skill_floor: `The two readings fall either side of the ${EXAMINATION_FLOOR} per cent floor.`,
      honour_threshold: 'The two readings of the whole script fall in different honour bands.',
    }[r.trigger_reason],
    triggerLabelAr: {
      tolerance: `القراءتان تختلفان بأكثر من ${TOLERANCE_POINTS} نقاط مئوية.`,
      skill_floor: `القراءتان تقعان على طرفَي حدّ الـ${EXAMINATION_FLOOR} بالمئة.`,
      honour_threshold: 'قراءتا الورقة كاملةً تقعان في مرتبتَي شرف مختلفتين.',
    }[r.trigger_reason],
    openedAt: r.opened_at,
    settleDueOn: r.settle_due_on,
    settled: r.settled_at
      ? { at: r.settled_at, mark: r.settled_mark, how: r.settled_how, statement: r.statement }
      : null,
  };
}

/**
 * THE SHAPE `levelMark()` ASKS FOR — the one function standing.js calls.
 *
 * Returns null where the learner has no released examination at that
 * level, which is the honest answer and the one `levelMark()` is
 * written around. A sitting that is entered, open, submitted or under
 * reconciliation is NOT a result: reporting a half-marked script as a
 * level mark would publish a figure no second reader has seen.
 */
export async function examinationFor(env, { userId, levelId }) {
  const row = await db(env)
    .prepare(`SELECT * FROM level_examinations
               WHERE user_id = ? AND level_id = ? AND status = 'released'
               ORDER BY attempt DESC LIMIT 1`)
    .bind(userId, levelIdOf(levelId)).first();
  if (!row) return null;
  const loaded = await loadSitting(env, row.id);
  const result = examinationResult(loaded);
  return {
    examinationId: row.id,
    // The released figure is what the College told the candidate, and
    // it is what counts. `result.percentage` recomputes to the same
    // number from the same rows; where a re-mark has moved it since,
    // the released one is still the one on the record and `recomputed`
    // is beside it rather than instead of it.
    percentage: row.released_mark,
    recomputed: result.percentage,
    resat: row.attempt > 1,
    capped: result.capped,
    criterionFloorMet: result.criterionFloorMet,
    skillFloorMet: result.skillFloorMet,
    spokenPaperPassed: result.spokenPaperPassed,
    skills: result.skills,
    provisional: row.provisional === 1,
    releasedAt: row.released_at,
    paperId: row.paper_id,
    rubricPublishedOn: result.rubricPublishedOn,
  };
}

/**
 * Every sitting a learner has at a level, released or not — what a
 * candidate reads on their own record and what a Registrar reads on
 * theirs.
 */
export async function sittingsFor(env, { userId, levelId = null }) {
  const rows = levelId === null
    ? (await db(env).prepare('SELECT id FROM level_examinations WHERE user_id = ? ORDER BY level_id, attempt')
      .bind(userId).all()).results
    : (await db(env).prepare('SELECT id FROM level_examinations WHERE user_id = ? AND level_id = ? ORDER BY attempt')
      .bind(userId, levelIdOf(levelId)).all()).results;
  const out = [];
  for (const r of rows) out.push(await sittingFor(env, r.id));
  return out;
}

/**
 * The scripts waiting to be read, oldest first.
 *
 * `role` decides what comes back: a first marker sees scripts with no
 * reading at all; a second marker sees scripts with exactly one, and
 * NEVER the first marker's numbers — `scriptForMarking()` withholds
 * them until the second reading is on the record, so a second reading
 * is a reading rather than a confirmation.
 *
 * The queue is the College's rather than one tutor's, for the reason
 * the assignment queue already gives: the teaching relation is composed
 * from teaching acts, so bounding it that way would make a candidate's
 * first script invisible to everybody.
 */
export async function markingQueue(env, { staff, role = 'first', limit = 50 } = {}) {
  if (!staff || !staff.id) throw new ValidationError('A marker is required.', { staff: 'Required.' });
  if (!['first', 'second'].includes(role)) {
    throw new ValidationError('A queue is a first-marking queue or a second-marking queue.', { role: 'Not a queue.' });
  }
  const rows = (await db(env)
    .prepare(`SELECT e.*, u.preferred_name, u.email,
                (SELECT COUNT(*) FROM examination_marks m WHERE m.examination_id = e.id AND m.marker_role = 'first') AS first_marks,
                (SELECT COUNT(*) FROM examination_marks m WHERE m.examination_id = e.id AND m.marker_role = 'second') AS second_marks,
                (SELECT COUNT(*) FROM examination_marks m WHERE m.examination_id = e.id AND m.marker_id = ?) AS mine
           FROM level_examinations e
           JOIN users u ON u.id = e.user_id
          WHERE e.status IN ('submitted','marking')
          ORDER BY e.submitted_at ASC
          LIMIT ?`)
    .bind(staff.id, limit).all()).results;

  const wanted = rows.filter((r) => (role === 'first'
    ? r.first_marks === 0
    : (r.first_marks > 0 && r.second_marks === 0 && r.mine === 0)));

  const out = [];
  for (const r of wanted) {
    out.push({
      examinationId: r.id,
      candidate: { id: r.user_id, name: r.preferred_name || r.email },
      levelId: r.level_id,
      attempt: r.attempt,
      resit: r.attempt > 1,
      sittingReference: r.sitting_reference,
      submittedAt: r.submitted_at,
      waitingWorkingDays: r.submitted_at ? workingDaysBetween(r.submitted_at, nowIso()) : 0,
      lateness: r.lateness,
      role,
    });
  }
  return {
    role,
    basis: role === 'first'
      ? 'Every submitted script with no reading on it, oldest first.'
      : 'Every script with one reading and no second, oldest first, excluding any you read yourself.',
    releaseWorkingDay: RELEASE_WORKING_DAY,
    scripts: out,
  };
}

/**
 * One script, prepared for a marker.
 *
 * THE OTHER MARKER'S NUMBERS ARE WITHHELD. A second reader shown the
 * first reading is not a second reader; they are a person agreeing with
 * a number. They are handed the script, the rubric, the descriptors and
 * the sitting's own facts — and the first reading appears only after
 * their own is recorded, at which point it is the reconciliation they
 * need to see.
 */
export async function scriptForMarking(env, { staff, examinationId, role = 'first' } = {}) {
  if (!staff || !staff.id) throw new ValidationError('A marker is required.', { staff: 'Required.' });
  const loaded = await loadSitting(env, examinationId);
  const { sitting, paper, criteria, marks, reconciliations } = loaded;

  const mine = marks.filter((m) => m.marker_id === staff.id);
  const myRole = mine.length ? mine[0].marker_role : role;
  const iHaveMarked = mine.length > 0;

  const visible = iHaveMarked ? marks : marks.filter((m) => m.marker_id === staff.id);

  return {
    examinationId: sitting.id,
    candidate: { id: sitting.user_id },
    levelId: sitting.level_id,
    attempt: sitting.attempt,
    resit: sitting.attempt > 1,
    sittingReference: sitting.sitting_reference,
    submittedAt: sitting.submitted_at,
    lateness: sitting.lateness,
    latenessEffect: (LATENESS_BANDS.find((b) => b.id === sitting.lateness) || LATENESS_BANDS[0]).effect,
    status: sitting.status,
    role: myRole,
    alreadyMarked: iHaveMarked,
    // Named rather than implied: a marking screen that simply showed no
    // numbers would read as a screen with a bug in it.
    withheld: iHaveMarked
      ? null
      : 'The other reading is not shown until yours is recorded. A second reader shown the first mark is confirming a number rather than reading a script.',
    paper: paper ? paperView(paper, criteria) : null,
    marks: visible.map((m) => ({
      criterionId: m.criterion_id, role: m.marker_role, mark: m.mark, comment: m.comment, markedAt: m.marked_at,
    })),
    reconciliations: iHaveMarked ? reconciliations.map(reconciliationView) : [],
    tolerancePoints: TOLERANCE_POINTS,
    floor: EXAMINATION_FLOOR,
    passMark: SCALE.passMark,
    marking: PUBLISHED.marking,
  };
}

/**
 * What the College publishes about how an examination is conducted, in
 * the language asked for — so a page can print the rule rather than
 * paraphrasing it into something the instrument does not say.
 */
export function publishedProcedure(language = 'en') {
  const ar = language === 'ar';
  return {
    instrument: PUBLISHED.conduct,
    marking: PUBLISHED.marking,
    windowWorkingDays: WINDOW_WORKING_DAYS,
    durationMinutes: DURATION_MINUTES,
    spokenMinutes: SPOKEN_MINUTES,
    resumeMinutes: RESUME_MINUTES,
    setAsideOnElection: SET_ASIDE_ON_ELECTION,
    maxSittings: MAX_SITTINGS,
    resitIntervalDays: RESIT_INTERVAL_DAYS,
    releaseWorkingDay: RELEASE_WORKING_DAY,
    moderationWorkingDays: MODERATION_WORKING_DAYS,
    tolerancePoints: TOLERANCE_POINTS,
    reconciliationWorkingDays: RECONCILIATION_WORKING_DAYS,
    floor: EXAMINATION_FLOOR,
    lateness: LATENESS_BANDS.map((b) => ({
      id: b.id,
      label: ar ? b.labelAr : b.label,
      effect: ar ? b.effectAr : b.effect,
    })),
    statements: ar
      ? [
        `تُفتح نافذة امتحان المستوى ${WINDOW_WORKING_DAYS} أيام عمل، وتختار ساعتك داخلها.`,
        `تجري الورقة ${DURATION_MINUTES / 60} ساعات تبدأ من لحظة فتحك لها.`,
        `تُقرأ كلّ ورقة قارئان قبل أن تصلك، وتُعلَن نتائج الدفعة معًا في يوم العمل ${RELEASE_WORKING_DAY}.`,
        `النتيجة مبدئية حتى تُغلق المراجعة على الدفعة خلال ${MODERATION_WORKING_DAYS} أيام عمل من الإعلان.`,
      ]
      : [
        `A level examination window stays open for ${WINDOW_WORKING_DAYS} working days and you choose your hour inside it.`,
        `The paper runs for ${DURATION_MINUTES / 60} hours from the moment you open it.`,
        `Every script is read by two markers before it reaches you, and a cohort is released together on working day ${RELEASE_WORKING_DAY}.`,
        `A mark is provisional until moderation closes on the batch, within ${MODERATION_WORKING_DAYS} working days of release.`,
      ],
  };
}

/**
 * Every level's examination position for one learner, keyed by level —
 * the shape standing.js folds into its academic record.
 *
 * Two quantities per level, and they are different things:
 *
 *   `released` — the result that COUNTS, or null. This is what
 *                `levelMark()` composes its 60 per cent from, and it
 *                exists only where a script has been read twice, every
 *                reconciliation is settled and the College has
 *                released it.
 *
 *   `sittings` — every attempt at that level, in order, released or
 *                not. A learner with a paper open and three hours left
 *                has no released result and is not "not recorded"; a
 *                page that could only read the first quantity would
 *                have to describe those two states identically.
 *
 * Returns an empty object for a learner with no sittings, which is
 * every learner today, and costs one query to establish.
 */
export async function examinationsForLearner(env, userId) {
  const rows = (await db(env)
    .prepare('SELECT id, level_id FROM level_examinations WHERE user_id = ? ORDER BY level_id, attempt')
    .bind(userId).all()).results;
  if (!rows.length) return {};

  const out = {};
  for (const r of rows) {
    const loaded = await loadSitting(env, r.id);
    const view = {
      id: loaded.sitting.id,
      attempt: loaded.sitting.attempt,
      status: loaded.sitting.status,
      sittingReference: loaded.sitting.sitting_reference,
      window: { opensOn: loaded.sitting.window_opens_on, closesOn: loaded.sitting.window_closes_on },
      submittedAt: loaded.sitting.submitted_at,
      lateness: loaded.sitting.lateness,
      releasedAt: loaded.sitting.released_at,
      provisional: loaded.sitting.provisional === 1,
      result: examinationResult(loaded),
    };
    const level = (out[r.level_id] = out[r.level_id] || { sittings: [], released: null, paperPublished: null });
    level.sittings.push(view);
    level.paperPublished = loaded.paper ? loaded.paper.status === 'published' : null;
    if (loaded.sitting.status === 'released') {
      level.released = {
        examinationId: loaded.sitting.id,
        percentage: loaded.sitting.released_mark,
        recomputed: view.result.percentage,
        resat: loaded.sitting.attempt > 1,
        capped: view.result.capped,
        criterionFloorMet: view.result.criterionFloorMet,
        skillFloorMet: view.result.skillFloorMet,
        spokenPaperPassed: view.result.spokenPaperPassed,
        skills: view.result.skills,
        provisional: loaded.sitting.provisional === 1,
        releasedAt: loaded.sitting.released_at,
        rubricPublishedOn: view.result.rubricPublishedOn,
      };
    }
  }
  return out;
}

/**
 * Whether the College has set a paper at each level at all.
 *
 * Read separately from a learner's own record because the answer is the
 * same for everybody and the DISTINCTION it draws is the one CLAUDE.md
 * § 5 exists to protect: a candidate whose award waits on a paper the
 * College has not published has done nothing wrong, and a screen that
 * files that under their outstanding work would put the platform's
 * unfinished business on a person's academic record.
 */
export async function papersPublished(env) {
  const rows = (await db(env)
    .prepare(`SELECT level_id, id, version, rubric_published_on FROM examination_papers WHERE status = 'published'`)
    .bind().all()).results;
  const out = {};
  for (const r of rows) {
    out[r.level_id] = { paperId: r.id, version: r.version, rubricPublishedOn: r.rubric_published_on };
  }
  return out;
}
