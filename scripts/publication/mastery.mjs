/**
 * THE MASTERY CONSTITUTION — the learner as the unit of excellence.
 *
 * ────────────────────────────────────────────────────────────────────
 * THE MEASUREMENT THAT MATTERS, AND WHAT IT FOUND
 * ────────────────────────────────────────────────────────────────────
 * Coverage asks whether a resource is in a volume a reader can open.
 * Mastery asks something harder: can a learner who finishes this lesson
 * do something they could not do before, and does the lesson give them
 * everything they need to prove it?
 *
 * Asking it produced the single most consequential finding in this
 * project. Fifty practice stages across forty-eight lessons hand the
 * learner something:
 *
 *   "You are given 8 sentence pairs..."
 *   "Sort 10 sentence prompts into routine and temporary..."
 *   "Revise a provided paragraph with weak coherence..."
 *
 * None of those things existed. The instruction was in the lesson and
 * the material it pointed at was nowhere. A learner working alone met a
 * task they could not begin; a teacher invented the items before every
 * class, differently each time, which is the opposite of a curriculum.
 *
 * ────────────────────────────────────────────────────────────────────
 * WHY THE EARLIER NUMBER WAS WRONG IN BOTH DIRECTIONS
 * ────────────────────────────────────────────────────────────────────
 * The previous pass measured "lessons with printable practice items"
 * and found nought of 114, and withdrew the Workbook on that basis.
 * That was right to withdraw it and wrong about the size of the gap.
 *
 * Most practice in this curriculum is learner-generated — "write three
 * sentences about your own study history" — and needs no supplied
 * material at all. That is a legitimate design for a communicative
 * syllabus, not a hole. The real gap is narrower and much more
 * actionable: fifty stages, not 114 lessons, and each one nameable.
 *
 * A metric that overstates a gap is not safer than one that understates
 * it. It costs the same credibility and it sends the authoring effort
 * to the wrong place.
 *
 * ────────────────────────────────────────────────────────────────────
 * DETECTION IS MECHANISED; CLASSIFICATION IS DECLARED
 * ────────────────────────────────────────────────────────────────────
 * A regular expression can find a stage that says "you are given"; it
 * cannot reliably tell a supplied set from an open task. So detection
 * finds candidates and every candidate must be DECLARED — supplied or
 * open — in the register below. A test fails the build on an
 * undeclared candidate, which means the classification cannot silently
 * fall behind the curriculum.
 */
import { readFileSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { DatabaseSync } from 'node:sqlite';
import { buildCurriculum } from './curriculum.mjs';
import { walk } from './apparatus.mjs';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..');

// ─────────────────────────────────────────────────────────────────────
// 1 · THE PRACTICE ARCHITECTURE
// ─────────────────────────────────────────────────────────────────────

/**
 * The ten practice types the Mastery Constitution asks for, each mapped
 * to what the curriculum actually has. Four of them do not exist as
 * distinct stages, and the reason is stated rather than the row being
 * quietly dropped — "state why" is the instruction, and a blank is not
 * a reason.
 */
export const PRACTICE = [
  { key: 'guided', name: 'Guided practice', icon: 'guided',
    why: null },
  { key: 'independent', name: 'Independent practice', icon: 'independent',
    why: null },
  { key: 'collaborative', name: 'Collaborative practice', icon: null,
    why: 'Not a separate stage. Pair and group work is written INSIDE the guided and speaking '
      + 'stages — "pair work", "in small groups" — because a communicative syllabus does not '
      + 'treat collaboration as a phase of the lesson but as the medium of most of it.' },
  { key: 'professional', name: 'Professional application', icon: null,
    why: 'Present in five modules of sixty, and absent by design below Level III: a learner with '
      + 'three hundred words of English has no professional register to apply. Recorded as a '
      + 'measured gap at the upper levels rather than as a universal one.' },
  { key: 'scenario', name: 'Real-world scenario', icon: null,
    why: 'Carried by the listening scripts and the assignment briefs rather than by a stage of '
      + 'its own. Every assignment is a scenario; adding a scenario stage would duplicate it.' },
  { key: 'reflection', name: 'Reflection', icon: 'thinking',
    why: null },
  { key: 'selfcheck', name: 'Self-check', icon: null,
    why: 'DOES NOT EXIST. No lesson gives a learner a way to check their own understanding '
      + 'before the module quiz. This is the largest single hole in the practice architecture '
      + 'and it is academic authoring: a self-check needs items and answers, not a heading.' },
  { key: 'challenge', name: 'Challenge exercise', icon: 'extension',
    why: null },
  { key: 'mastery', name: 'Mastery exercise', icon: 'assess',
    why: null },
  { key: 'extension', name: 'Extension activity', icon: 'extension',
    why: null },
];

// ─────────────────────────────────────────────────────────────────────
// 2 · SUPPLIED MATERIALS
// ─────────────────────────────────────────────────────────────────────

/**
 * The detector. Deliberately broad: it is allowed false positives
 * because every hit must be declared anyway, and a missed stage would
 * be a task a learner cannot start.
 */
export const SUPPLY_PATTERN =
  /\b(given|provided|supplied)\b|\b\d{1,2}\s+(sentence pairs?|sentence-halves|sentence halves|cards?|pictures?|gapped|prompts?|extracts?|excerpts?|texts?)\b|\b(sort|match|combine|complete|correct|rewrite|transform|reorder|classify)\b[^.]{0,32}?\b\d{1,2}\s+(sentence|pair|card|prompt|item|gap|clause|word|phrase)/i;

const PRACTICE_ICONS = ['guided', 'independent', 'homework', 'extension'];

/** Every practice stage the detector flags, with its lesson and text. */
export function candidates(C = buildCurriculum()) {
  const out = [];
  for (const { lv, mod, item, ref } of walk(C)) {
    if (!item.stages.some((s) => s.icon === 'objectives')) continue;
    for (const s of item.stages) {
      if (!PRACTICE_ICONS.includes(s.icon)) continue;
      const text = s.parts.map((p) => p.text).join(' ').trim();
      if (!SUPPLY_PATTERN.test(text)) continue;
      out.push({ ref, roman: lv.roman, module: mod.sequence, stage: s.icon, text });
    }
  }
  return out;
}

/**
 * The declaration register. `open` marks a candidate the detector
 * flagged where the learner supplies the content themselves — those
 * need nothing. Everything else needs materials, and the ones that have
 * them are in sql/seed-exercises.sql.
 *
 * The register is keyed by `ref|stage` so a lesson with two flagged
 * stages is two decisions rather than one.
 */
export const OPEN = new Set([
  // Flagged because the stage describes what the learner is to produce
  // rather than what they are handed: "learners write the opening
  // paragraph of their conference paper". Nothing is supplied and
  // nothing needs to be.
  //
  // A first draft of this set carried seven more entries, taken from a
  // looser detector that flagged every "write 3 sentences" task. When
  // the detector was tightened those stages stopped being candidates,
  // and the declarations became claims about stages nobody had
  // questioned. A test now fails on a declaration with no candidate
  // behind it, for the same reason it fails on a candidate with no
  // declaration.
  'VI.9.3|independent',
]);


/**
 * The other half of the declaration. Every candidate must appear in
 * exactly one of these two sets, and a candidate in neither fails the
 * build.
 *
 * A first version of this file had only the OPEN set and computed
 * "supplied" as "everything else", then asserted that every candidate
 * was declared — which was true by construction and therefore checked
 * nothing. Widening the detector by one word added candidates that were
 * silently classified as needing materials, and the test passed. The
 * register now has to be told about every one of them.
 */
export const SUPPLIED = new Set([
  // Level I
  'I.7.2|guided',
  // Level II
  'II.1.2|guided',
  'II.1.3|guided',
  'II.3.2|guided',
  'II.4.2|guided',
  'II.4.3|guided',
  'II.6.2|guided',
  'II.6.3|guided',
  'II.7.2|guided',
  'II.9.2|guided',
  // Level III
  'III.2.2|guided',
  'III.3.3|guided',
  'III.4.2|guided',
  'III.5.3|independent',
  'III.7.2|guided',
  'III.8.3|guided',
  'III.9.2|guided',
  // Level IV
  'IV.1.2|guided',
  'IV.1.3|guided',
  'IV.2.3|guided',
  'IV.3.3|guided',
  'IV.4.2|guided',
  'IV.4.3|guided',
  'IV.6.3|guided',
  'IV.7.2|guided',
  'IV.7.3|guided',
  'IV.7.3|extension',
  'IV.8.2|guided',
  'IV.9.2|guided',
  'IV.9.3|guided',
  // Level V
  'V.1.2|guided',
  'V.1.3|guided',
  'V.2.2|guided',
  'V.2.3|guided',
  'V.3.3|guided',
  'V.4.3|guided',
  'V.5.2|guided',
  'V.6.3|guided',
  'V.7.2|guided',
  // Level VI
  'VI.2.3|guided',
  'VI.3.3|guided',
  'VI.4.3|guided',
  'VI.5.3|guided',
  'VI.6.3|guided',
  'VI.7.2|guided',
  'VI.8.2|guided',
  'VI.8.3|guided',
  'VI.9.3|guided',
  'VI.10.2|guided',
]);

/**
 * Illustration remains outstanding where the curriculum asks for a
 * picture. The exercise set supplies the frames in words a teacher can
 * draw or project; the drawing itself is a commission, not editorial
 * work, and it is recorded rather than pretended away.
 */
export const ILLUSTRATION_PENDING = ['I.7.2|guided', 'II.4.2|guided', 'II.6.2|guided'];

function openDb() {
  const db = new DatabaseSync(':memory:');
  db.exec(readFileSync(`${ROOT}/sql/schema.sql`, 'utf8'));
  for (let n = 1; n <= 6; n++) {
    db.exec(readFileSync(`${ROOT}/sql/seed-curriculum-level-${n}.sql`, 'utf8'));
  }
  db.exec(readFileSync(`${ROOT}/sql/seed-exercises.sql`, 'utf8'));
  return db;
}

/** Exercise sets that exist, keyed by lesson reference and stage. */
export function authored() {
  const db = openDb();
  const rows = db.prepare(`
    SELECT e.id, e.stage, e.kind, e.brief, e.approval_state AS approval, e.drafted_by AS draftedBy,
           l.roman || '.' || u.sequence || '.' || i.sequence AS ref,
           (SELECT COUNT(*) FROM exercise_items x WHERE x.exercise_set_id = e.id) AS items,
           (SELECT COUNT(*) FROM exercise_items x WHERE x.exercise_set_id = e.id
              AND x.answer IS NOT NULL) AS answered
      FROM exercise_sets e
      JOIN learning_items i ON i.id = e.learning_item_id
      JOIN units u ON u.id = i.unit_id
      JOIN courses c ON c.id = u.course_id
      JOIN programme_levels l ON l.id = c.level_id
     ORDER BY l.id, u.sequence, i.sequence`).all();
  db.close();
  return rows;
}

/**
 * The whole supplied-materials position: what needs materials, what has
 * them, what is still an instruction pointing at nothing.
 */
export function suppliedMaterials(C = buildCurriculum()) {
  const flagged = candidates(C);
  const have = new Map(authored().map((a) => [`${a.ref}|${a.stage}`, a]));
  const rows = flagged.map((c) => {
    const key = `${c.ref}|${c.stage}`;
    return {
      ...c,
      key,
      declared: OPEN.has(key) ? 'open' : (SUPPLIED.has(key) ? 'supplied' : null),
      set: have.get(key) || null,
      illustrationPending: ILLUSTRATION_PENDING.includes(key),
    };
  });
  const supplied = rows.filter((r) => r.declared === 'supplied');
  const undeclared = rows.filter((r) => r.declared === null);
  return {
    flagged: rows.length,
    undeclared,
    open: rows.filter((r) => r.declared === 'open').length,
    needed: supplied.length,
    authored: supplied.filter((r) => r.set).length,
    outstanding: supplied.filter((r) => !r.set),
    items: [...have.values()].reduce((n, a) => n + a.items, 0),
    approved: [...have.values()].filter((a) => a.approval === 'academically_approved').length,
    illustrationPending: rows.filter((r) => r.illustrationPending && r.set).length,
    rows,
  };
}

// ─────────────────────────────────────────────────────────────────────
// 3 · THE SEVEN MASTERY METRICS
// ─────────────────────────────────────────────────────────────────────

const pct = (n, of) => (of ? Math.round((n / of) * 100) : 0);

/**
 * Each metric is a property of a LESSON, not of a publication. A press
 * that publishes ten more books moves none of these unless the lessons
 * themselves get better, which is the point of measuring them.
 */
export function metrics(C = buildCurriculum()) {
  const teaching = walk(C).filter(({ item }) =>
    item.stages.some((s) => s.icon === 'objectives'));
  const sup = suppliedMaterials(C);
  const blocked = new Set(sup.outstanding.map((r) => r.ref));
  const has = (item, icon) => item.stages.some((s) => s.icon === icon);
  const modTitle = new Map(teaching.map(({ ref, mod }) => [ref, mod.title]));
  const PROFESSIONAL = /Work|Career|Negotiation|Professional Advocacy/i;

  const rows = teaching.map(({ ref, item }) => {
    const completePractice = has(item, 'guided') && has(item, 'homework')
      && has(item, 'extension') && !blocked.has(ref);
    return {
      ref,
      completePractice,
      authenticApplication: has(item, 'speaking') || has(item, 'writing'),
      professional: PROFESSIONAL.test(modTitle.get(ref) || ''),
      // Everything the lesson needs, present: objectives, prerequisites,
      // practice, assessment pointer, revision.
      completeResources: ['objectives', 'prereq', 'present', 'guided', 'assess', 'revision']
        .every((i) => has(item, i)),
      // Teachable from print alone: no stage refers to material that
      // does not exist, and the timings and objectives are stated.
      teachableFromPrint: !blocked.has(ref) && has(item, 'objectives') && has(item, 'guided'),
      // Learnable without a teacher: additionally needs practice a
      // learner can do alone, and no stage that requires a partner or a
      // classroom to begin.
      learnableAlone: !blocked.has(ref) && has(item, 'homework') && has(item, 'extension')
        && !/pair work|in small groups|with a partner/i.test(
          item.stages.map((s) => s.parts.map((p) => p.text).join(' ')).join(' ')),
      // Self-check does not exist anywhere, so full mastery coverage is
      // nought by construction — and that is the finding, not a bug.
      selfCheck: false,
    };
  });

  const count = (k) => rows.filter((r) => r[k]).length;
  const mastery = rows.filter((r) => r.completePractice && r.completeResources
    && r.teachableFromPrint && r.selfCheck).length;

  return {
    lessons: rows.length,
    rows,
    figures: [
      ['Lessons with complete practice', count('completePractice'),
        'Guided, homework and extension all present, and no stage pointing at material that does '
        + 'not exist.'],
      ['Lessons with authentic application', count('authenticApplication'),
        'The learner produces language — speaking or writing — rather than only recognising it.'],
      ['Lessons with professional relevance', count('professional'),
        'Belongs to a module about work, careers or negotiation. Deliberately low: this is a '
        + 'general English programme with five professional modules.'],
      ['Lessons with complete supporting resources', count('completeResources'),
        'Objectives, prerequisites, presentation, practice, assessment and revision all present.'],
      ['Lessons independently teachable from print', count('teachableFromPrint'),
        'A teacher could run the lesson from the printed page without inventing material first.'],
      ['Lessons independently learnable without a teacher', count('learnableAlone'),
        'A learner alone could complete every stage: no missing material, no stage that needs a '
        + 'partner to begin.'],
      ['Lessons achieving complete mastery coverage', mastery,
        'All of the above AND a self-check. Nought, because no lesson in the programme has a '
        + 'self-check — the honest figure, and the reason the next authoring pass is obvious.'],
    ].map(([name, n, what]) => ({ name, n, pct: pct(n, rows.length), what })),
    supplied: sup,
  };
}

// ─────────────────────────────────────────────────────────────────────
// 4 · WHAT MAKES IT RECOGNISABLY THIS COLLEGE
// ─────────────────────────────────────────────────────────────────────

/**
 * The distinctiveness question, answered with things that can be
 * checked rather than with adjectives. Each claim names the evidence
 * and a competitor could only copy it by adopting the same discipline,
 * which is the test: distinction from educational philosophy, not
 * branding.
 */
export function distinctiveness(C = buildCurriculum()) {
  const teaching = walk(C).filter(({ item }) =>
    item.stages.some((s) => s.icon === 'objectives'));
  const stageCounts = teaching.map(({ item }) => item.stages.length);
  const uniform = Math.min(...stageCounts);
  return [
    ['One lesson architecture, every level',
      `Every one of the ${teaching.length} teaching lessons carries at least ${uniform} named `
      + 'stages in the same order, from Level I to Level VI. A learner who has taken one lesson '
      + 'can navigate any lesson in the programme, including one five levels above them.'],
    ['The spiral is written down, not implied',
      'Every lesson names what it is built on, by module. 191 cross-references, 82 of them '
      + 'across levels — so a teacher can see not only what a lesson needs but what later '
      + 'returns to it.'],
    ['Pronunciation is a strand, not an afterthought',
      '180 targets across every level with guidance for each, at a point in the lesson rather '
      + 'than in an appendix. Most general English syllabuses stop teaching pronunciation '
      + 'explicitly at B1.'],
    ['The gaps are printed inside the books',
      'The Assessment Handbook prints the five rubrics that state no threshold. The Listening '
      + 'Scripts state on the title page that no recording exists. This is the hardest one for '
      + 'another institution to copy, because it costs something.'],
    ['Nothing is claimed that cannot be evidenced',
      'No accreditation, no partnerships, no outcome statistics, no invented officers. Every '
      + 'public figure is computed from the academic database and checked by a test in two '
      + 'languages.'],
  ];
}

// ─────────────────────────────────────────────────────────────────────
// 5 · DOES EACH ASSESSMENT DEFEND THE AWARD?
// ─────────────────────────────────────────────────────────────────────

/**
 * "If this assessment were removed, would the award be weaker?" A
 * question that sounds unanswerable until it is made concrete: an
 * assessment defends the award if it is the only evidence of something
 * the award claims.
 */
export function assessmentDefence(C = buildCurriculum()) {
  const db = openDb();
  const mapped = db.prepare('SELECT COUNT(*) AS n FROM assessment_competencies').get().n;
  db.close();
  const modules = C.levels.flatMap((lv) => lv.modules.map((mod) => ({
    ref: `${lv.roman}.${mod.sequence}`,
    quiz: mod.lessons.find((x) => x.kind === 'quiz'),
    assignment: mod.lessons.find((x) => x.kind === 'assignment'),
  })));
  return {
    modules: modules.length,
    // Each module's assignment is the only assessed production in that
    // module: remove it and nothing else evidences the module's skills.
    soleEvidence: modules.filter((m) => m.assignment).length,
    quizzes: modules.filter((m) => m.quiz).length,
    mappedToCompetency: mapped,
    verdict: mapped === 0
      ? 'Every assignment is the sole assessed production of its module, so removing one would '
        + 'leave that module unevidenced: by that test all sixty defend the award. But the award '
        + 'is defined in terms of six competencies, and nought of the 120 assessed items maps to '
        + 'one. So the assessments defend the MODULES completely and the AWARD only by '
        + 'inference, and no amount of publishing changes that — it is a mapping the academic '
        + 'body must make.'
      : `${mapped} assessed items carry a competency mapping.`,
  };
}
