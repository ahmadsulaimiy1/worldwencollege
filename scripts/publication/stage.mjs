/**
 * STAGE-BASED ACADEMIC DEVELOPMENT — STAGE 1, IEFC LEVEL I.
 *
 * ────────────────────────────────────────────────────────────────────
 * WHY THIS FILE EXISTS AND WHAT IT REFUSES TO DO
 * ────────────────────────────────────────────────────────────────────
 * The Executive Directive names roughly seventy resources that a
 * complete Level I ecosystem would contain. A list of seventy titles is
 * the easiest thing in this project to fake: give each one a name, a
 * category and a tick, and the report reads as an academic programme
 * while committing to nothing.
 *
 * So nothing here carries a status anyone typed. Every resource states
 * what a real version of it would require, in units that can be
 * counted, and the status is COMPUTED against the live Level I data.
 * The same discipline as catalogue.mjs, narrowed from the programme to
 * one level — because the directive narrowed the work the same way.
 *
 * Two rules from the directive are enforced mechanically rather than
 * remembered:
 *
 *   "Never build resources merely to increase publication count."
 *     Every resource declares which of the eight educational dimensions
 *     it improves. A resource improving none of them fails the build.
 *     It cannot be added to the register as decoration.
 *
 *   "Stage 1 is complete only when [six things are true]."
 *     Every resource declares which of the six completion criteria it
 *     serves. A criterion is satisfied only when every resource serving
 *     it is available. Readiness is therefore a property of the
 *     criteria, not an average of the list — you cannot reach ninety
 *     per cent by publishing fourteen easy volumes.
 *
 * ────────────────────────────────────────────────────────────────────
 * THE STATUSES, AND WHY THERE ARE SEVEN
 * ────────────────────────────────────────────────────────────────────
 * The directive asks for a report split by who is blocked. The statuses
 * are that split, so the report is a query rather than a judgement:
 *
 *   PUBLISHED — the artefact exists and a named build script makes it.
 *   DERIVABLE — every requirement is met by material that exists.
 *     Producing it is editorial work and nothing else.
 *   REQUIRES AUTHORING — short by a stated number, and the Press may
 *     write it: worksheets, cards, printable apparatus.
 *   REQUIRES ACADEMIC AUTHORING — short, and the Press may NOT write
 *     it. Learning outcomes, competency statements, anything that
 *     asserts what a learner can do.
 *   REQUIRES GOVERNANCE — blocked on a decision or an authority the
 *     Press does not hold.
 *   REQUIRES EXTERNAL REVIEW — the material exists and cannot be
 *     called validated by the people who wrote it.
 *   NOT SUPPORTED BY THE CURRICULUM — the directive says "where
 *     supported by the curriculum", and for some resources it is not.
 *     Recorded with the reason, so that the absence is a finding rather
 *     than an oversight, and so nobody proposes it again in ignorance.
 *
 * The last one matters. Video support is on the directive's list; this
 * curriculum contains no video and no video script, and inventing a
 * "Video Support Pack" that pointed at nothing would repeat the exact
 * failure this project spent a pass correcting in the practice stages.
 */
import { existsSync, readFileSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { DatabaseSync } from 'node:sqlite';
import { buildCurriculum, parseRubric } from './curriculum.mjs';
import { walk, crossReferences, glossary } from './apparatus.mjs';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..');

// ─────────────────────────────────────────────────────────────────────
// 1 · THE STAGES
// ─────────────────────────────────────────────────────────────────────

/**
 * Six stages, one per level, built vertically rather than horizontally.
 * Only one is active, and the rule that keeps it that way is stated
 * here rather than remembered: a test asserts that exactly one stage is
 * active and that no stage after it has been started.
 */
export const STAGES = [
  { n: 1, roman: 'I', name: 'Foundation Programme', state: 'active' },
  { n: 2, roman: 'II', name: 'Elementary Programme', state: 'not started' },
  { n: 3, roman: 'III', name: 'Pre-Intermediate Programme', state: 'not started' },
  { n: 4, roman: 'IV', name: 'Intermediate Programme', state: 'not started' },
  { n: 5, roman: 'V', name: 'Advanced Programme', state: 'not started' },
  { n: 6, roman: 'VI', name: 'Mastery Programme', state: 'not started' },
];

export const ACTIVE = STAGES.find((s) => s.state === 'active');

/**
 * The six completion criteria, verbatim in effect from the directive,
 * plus the seventh it states separately: that the parts work as one
 * ecosystem rather than as a shelf of unrelated volumes.
 *
 * Each criterion names the PERSON it is about, because that is what
 * stops it drifting into a checklist. "A learner can successfully study
 * Level I" is answerable; "learner materials are complete" is not.
 */
export const COMPLETION = [
  { key: 'learner', who: 'A learner',
    can: 'can successfully study Level I',
    means: 'Everything a learner needs to work through the level is in their hands: the '
      + 'teaching, the practice with its materials, a way to check themselves before they are '
      + 'assessed, and a way to revise.' },
  { key: 'teacher', who: 'A teacher',
    can: 'can confidently teach Level I',
    means: 'A teacher can walk into the room with the printed resources and run the lesson '
      + 'without inventing material first, and knows what to do when a learner does not '
      + 'understand.' },
  { key: 'examiner', who: 'An examiner',
    can: 'can accurately assess Level I',
    means: 'The instruments exist, the criteria are stated before the marking rather than '
      + 'after, and two examiners marking the same script would reach the same place.' },
  { key: 'institution', who: 'An institution',
    can: 'can administer Level I',
    means: 'Specifications, outcomes, timetabled hours and quality-assurance documentation '
      + 'sufficient for a registrar and an academic board, not only for a classroom.' },
  { key: 'parent', who: 'A parent',
    can: 'can understand Level I',
    means: 'A non-specialist can see what the level teaches, how long it takes, how a learner '
      + 'is judged and what "passing" means, in language that assumes no education jargon.' },
  { key: 'employer', who: 'An employer',
    can: 'can understand the Level I achievement',
    means: 'A reader with no interest in pedagogy can tell what the holder of this award can '
      + 'actually do in English, and can verify the award is real.' },
  { key: 'ecosystem', who: 'The publications, platform and classroom resources',
    can: 'work together as one coherent ecosystem',
    means: 'Cross-referenced, consistently numbered, no volume duplicating another, and each '
      + 'stating what to read before, alongside and after it.' },
];

/**
 * The eight dimensions of the Permanent Academic Rule. A resource must
 * improve at least one. This is the mechanised form of "if it does not
 * improve education, do not build it".
 */
export const IMPROVES = [
  'learning', 'teaching', 'assessment', 'revision',
  'classroom delivery', 'independent study', 'learner success', 'educational quality',
];

export const OWNER = {
  PRESS: 'Editorial — the Press may build it',
  ACADEMIC: 'Academic authoring — a qualified academic must write it',
  GOVERNANCE: 'Governance — an institutional decision or authority is required',
  EXTERNAL: 'External review — an outside body must validate it',
};

export const STATUS = {
  PUBLISHED: 'Published',
  DERIVABLE: 'Derivable',
  AUTHORING: 'Requires authoring',
  ACADEMIC: 'Requires academic authoring',
  GOVERNANCE: 'Requires governance',
  EXTERNAL: 'Requires external review',
  UNSUPPORTED: 'Not supported by the curriculum',
};

// ─────────────────────────────────────────────────────────────────────
// 2 · THE MEASUREMENT
// ─────────────────────────────────────────────────────────────────────

/**
 * What Level I actually contains, counted from the live database and
 * the curriculum model. Every key here is something a resource below
 * can require, and nothing here is asserted — it is all a count.
 *
 * Scoped to Level I throughout. A programme-wide figure would let a
 * Level I resource pass on Level IV's material, which is exactly the
 * error the stage model exists to prevent.
 */
export function inventoryL1(C = buildCurriculum()) {
  const rows = [...walk(C)].filter(({ lv }) => lv.roman === 'I');
  const teaching = rows.filter(({ item }) => item.stages.some((s) => s.icon === 'objectives'));
  const refs = new Set(rows.map((r) => r.ref));
  const withStage = (icon) =>
    teaching.filter(({ item }) => item.stages.some((s) => s.icon === icon)).length;

  let rubrics = 0;
  let rubricCriteria = 0;
  for (const { item } of rows) {
    const r = parseRubric(item.stages.find((s) => s.icon === 'rubric'));
    if (r) { rubrics += 1; rubricCriteria += r.criteria.length; }
  }

  const db = new DatabaseSync(':memory:');
  db.exec(readFileSync(`${ROOT}/sql/schema.sql`, 'utf8'));
  for (let n = 1; n <= 6; n++) {
    db.exec(readFileSync(`${ROOT}/sql/seed-curriculum-level-${n}.sql`, 'utf8'));
    db.exec(readFileSync(`${ROOT}/sql/seed-audio-level-${n}.sql`, 'utf8'));
  }
  for (const f of ['seed-exercises', 'seed-selfchecks', 'seed-pedagogy',
    'seed-vocabulary-level-1', 'seed-solo-level-1', 'seed-competency-level-1', 'seed-pedagogy-level-1',
    'seed-teaching-expertise-level-1']) {
    db.exec(readFileSync(`${ROOT}/sql/${f}.sql`, 'utf8'));
  }
  const ONE = `JOIN units u ON u.id = i.unit_id
               JOIN courses c ON c.id = u.course_id
               JOIN programme_levels l ON l.id = c.level_id
               WHERE l.roman = 'I'`;
  const n = (sql) => db.prepare(sql).get().n;

  // Cross-references whose SOURCE is a Level I lesson. Counting the
  // forward map only: the back map is the same edges indexed the other
  // way, and summing both doubles every reference.
  const fwd = crossReferences(C).forward;
  const crossRefs = [...fwd.entries()]
    .filter(([ref]) => refs.has(ref))
    .reduce((m, [, list]) => m + list.length, 0);

  // Vocabulary, measured honestly rather than counted by stage.
  //
  // Twenty-eight Level I lessons carry a vocabulary stage, and it is
  // tempting to report that as twenty-eight vocabulary sets. It is not.
  // Ten of them are COLLOCATION entries — "make a friend -- not 'do a
  // friend'" — which are printable material. Seventeen are ACTIVITY
  // DESCRIPTIONS — "food flashcard naming race", "past-tense verb
  // bingo" — which name a word set without listing it. Exactly one is
  // an actual list of words.
  //
  // A flashcard pack needs the words. So the counts are kept apart —
  // collocations from the stages, headwords from the authored
  // vocabulary sets — and the resources that need printable words
  // require the authored table rather than the stage count that looks
  // full and is not.
  let collocationEntries = 0;
  for (const { item } of rows) {
    const st = item.stages.find((s) => s.icon === 'vocabulary');
    if (!st) continue;
    const text = st.parts.map((p) => p.text).join(' ').trim();
    const collocations = text.split(';').filter((p) => / -- /.test(p));
    if (collocations.length >= 2) collocationEntries += collocations.length;
  }

  // The volume's terminology glossary — CEFR, rubric, formative — is a
  // different thing from the level's vocabulary, and is counted
  // separately so neither can stand in for the other.
  const terminologyHeadwords = glossary(C).length;

  const inv = {
    // Structure
    modules: C.levels.find((l) => l.roman === 'I').modules.length,
    items: rows.length,
    teachingLessons: teaching.length,
    quizzes: rows.filter(({ item }) => item.kind === 'quiz').length,
    assignments: rows.filter(({ item }) => item.kind === 'assignment').length,

    // Teaching apparatus, per lesson
    objectives: withStage('objectives'),
    prerequisites: withStage('prereq'),
    presentation: withStage('present'),
    guided: withStage('guided'),
    homework: withStage('homework'),
    extension: withStage('extension'),
    revision: withStage('revision'),
    warmup: withStage('warmup'),
    formativeAssessment: withStage('assess'),
    reflection: withStage('thinking'),

    // The four skills plus pronunciation and vocabulary
    speaking: withStage('speaking'),
    listening: withStage('listening'),
    reading: withStage('reading'),
    writing: withStage('writing'),
    pronunciation: withStage('pronunciation'),
    vocabularyStages: rows.filter(({ item }) =>
      item.stages.some((s) => s.icon === 'vocabulary')).length,

    // Assessment
    rubrics,
    rubricCriteria,
    quizQuestions: n(`SELECT COUNT(*) AS n FROM quiz_questions q
                        JOIN learning_items i ON i.id = q.learning_item_id ${ONE}`),

    // Authored records
    selfChecks: n(`SELECT COUNT(*) AS n FROM self_checks s
                     JOIN learning_items i ON i.id = s.learning_item_id ${ONE}`),
    selfCheckPrompts: n(`SELECT COUNT(*) AS n FROM self_check_items x
                           JOIN self_checks s ON s.id = x.self_check_id
                           JOIN learning_items i ON i.id = s.learning_item_id ${ONE}`),
    selfCheckTraps: n(`SELECT COUNT(*) AS n FROM self_check_items x
                         JOIN self_checks s ON s.id = x.self_check_id
                         JOIN learning_items i ON i.id = s.learning_item_id ${ONE}
                         AND x.trap IS NOT NULL`),
    exerciseSets: n(`SELECT COUNT(*) AS n FROM exercise_sets s
                       JOIN learning_items i ON i.id = s.learning_item_id ${ONE}`),
    exerciseItems: n(`SELECT COUNT(*) AS n FROM exercise_items x
                        JOIN exercise_sets s ON s.id = x.exercise_set_id
                        JOIN learning_items i ON i.id = s.learning_item_id ${ONE}`),
    pedagogyEntries: n(`SELECT COUNT(*) AS n FROM pedagogy_entries e
                          JOIN learning_items i ON i.id = e.learning_item_id ${ONE}`),
    pedagogyEvidenced: n(`SELECT COUNT(*) AS n FROM pedagogy_entries e
                            JOIN learning_items i ON i.id = e.learning_item_id ${ONE}
                            AND e.evidence_state = 'derived_from_curriculum'`),
    pedagogyObserved: n(`SELECT COUNT(*) AS n FROM pedagogy_entries e
                           JOIN learning_items i ON i.id = e.learning_item_id ${ONE}
                           AND e.evidence_state = 'observed_in_teaching'`),
    // Knowledge a curriculum designer can supply and a classroom cannot
    // be faked for. Kept apart from the observed count so that a
    // publication resting on expertise cannot be read as resting on
    // experience.
    pedagogyAuthored: n(`SELECT COUNT(*) AS n FROM pedagogy_entries e
                           JOIN learning_items i ON i.id = e.learning_item_id ${ONE}
                           AND e.evidence_state IN
                             ('established_pedagogy','educational_expertise')`),

    // Audio
    listeningScripts: n(`SELECT COUNT(*) AS n FROM audio_assets a
                           JOIN learning_items i ON i.audio_asset_id = a.id ${ONE}`),
    speakerCues: n(`SELECT COUNT(*) AS n FROM audio_cues x
                      JOIN audio_assets a ON a.id = x.audio_asset_id
                      JOIN learning_items i ON i.audio_asset_id = a.id ${ONE}`),
    recordings: n(`SELECT COUNT(*) AS n FROM audio_assets a
                     JOIN learning_items i ON i.audio_asset_id = a.id ${ONE}
                     AND a.media_url IS NOT NULL`),
    pronunciationTargets: n(`SELECT COUNT(*) AS n FROM pronunciation_targets p
                               JOIN learning_items i ON i.id = p.learning_item_id ${ONE}`),

    // Apparatus derived across the level
    crossRefs,
    collocationEntries,
    terminologyHeadwords,

    // Authored vocabulary. The stage names the activity; the set
    // carries the words the activity needs.
    vocabularySets: n(`SELECT COUNT(*) AS n FROM vocabulary_sets v
                         JOIN learning_items i ON i.id = v.learning_item_id ${ONE}`),
    vocabularyWords: n(`SELECT COUNT(*) AS n FROM vocabulary_items x
                          JOIN vocabulary_sets v ON v.id = x.vocabulary_set_id
                          JOIN learning_items i ON i.id = v.learning_item_id ${ONE}`),

    // Things that do not exist anywhere, and are counted so that a
    // resource depending on them cannot quietly report as ready.
    competencyMappedAssessments: n(
      `SELECT COUNT(*) AS n FROM assessment_competencies ac
         JOIN learning_items i ON i.id = ac.learning_item_id ${ONE}`),
    videoAssets: 0,
    levelOutcomes: n(`SELECT COUNT(*) AS n FROM learning_outcomes
                       WHERE level_roman = 'I' AND scope = 'level'`),
    outcomeEvidence: n(`SELECT COUNT(*) AS n FROM learning_outcome_evidence e
                          JOIN learning_outcomes o ON o.id = e.outcome_id
                         WHERE o.level_roman = 'I'`),
    soloReinforcementActivities: n(`SELECT COUNT(*) AS n FROM solo_activities a
                                      JOIN learning_items i ON i.id = a.learning_item_id ${ONE}`),
  };
  db.close();
  return inv;
}

/**
 * The solo reinforcement activities, with the collaborative task each
 * one serves. Returned in full because the constraint that matters —
 * that a solo activity is reinforcement and not replacement — is a
 * property of the text, and a count cannot check it.
 */
export function soloActivities(roman = 'I') {
  const db = new DatabaseSync(':memory:');
  db.exec(readFileSync(`${ROOT}/sql/schema.sql`, 'utf8'));
  for (let i = 1; i <= 6; i++) {
    db.exec(readFileSync(`${ROOT}/sql/seed-curriculum-level-${i}.sql`, 'utf8'));
  }
  db.exec(readFileSync(`${ROOT}/sql/seed-solo-level-1.sql`, 'utf8'));
  const rows = db.prepare(`
    SELECT a.*, l.roman || '.' || u.sequence || '.' || i.sequence AS ref
      FROM solo_activities a
      JOIN learning_items i ON i.id = a.learning_item_id
      JOIN units u ON u.id = i.unit_id
      JOIN courses c ON c.id = u.course_id
      JOIN programme_levels l ON l.id = c.level_id
     WHERE l.roman = ?
     ORDER BY u.sequence, i.sequence`).all(roman);
  db.close();
  return rows;
}

/**
 * The authored vocabulary sets, for the resources that print them and
 * for the assertions that check them. Returned rather than counted,
 * because a flashcard pack needs the word, its part of speech, the
 * example sentence and the caution — and a count of eighteen tells you
 * nothing about whether any of that is there.
 */
export function vocabulary(roman = 'I') {
  const db = new DatabaseSync(':memory:');
  db.exec(readFileSync(`${ROOT}/sql/schema.sql`, 'utf8'));
  for (let i = 1; i <= 6; i++) {
    db.exec(readFileSync(`${ROOT}/sql/seed-curriculum-level-${i}.sql`, 'utf8'));
  }
  db.exec(readFileSync(`${ROOT}/sql/seed-vocabulary-level-1.sql`, 'utf8'));
  const sets = db.prepare(`
    SELECT v.id, v.title, v.activity, v.approval_state AS approval,
           l.roman || '.' || u.sequence || '.' || i.sequence AS ref
      FROM vocabulary_sets v
      JOIN learning_items i ON i.id = v.learning_item_id
      JOIN units u ON u.id = i.unit_id
      JOIN courses c ON c.id = u.course_id
      JOIN programme_levels l ON l.id = c.level_id
     WHERE l.roman = ?
     ORDER BY u.sequence, i.sequence`).all(roman);
  const items = db.prepare(
    'SELECT * FROM vocabulary_items ORDER BY vocabulary_set_id, sequence').all();
  db.close();
  return sets.map((s) => ({ ...s, items: items.filter((x) => x.vocabulary_set_id === s.id) }));
}

// ─────────────────────────────────────────────────────────────────────
// 3 · THE REGISTER
// ─────────────────────────────────────────────────────────────────────

const need = (what, key, n) => ({ what, key, need: n });

/**
 * One row per resource the directive names.
 *
 * `serves`   — which completion criteria it is required for.
 * `improves` — which of the eight dimensions it improves. Empty fails.
 * `needs`    — measured requirements. Empty means nothing to measure,
 *              which is only true for resources blocked on governance
 *              or on an authority rather than on material.
 * `owner`    — who is blocked when it is not done.
 * `artefact` — a file under publication/, if one exists.
 * `why`      — for an unsupported resource, what is missing and why the
 *              Press will not invent it.
 */
const r = (o) => ({ needs: [], artefact: null, build: null, why: null, unsupported: false, ...o });

export const RESOURCES = [
  // ── Student resources ──────────────────────────────────────────────
  r({ cat: 'Student', name: 'Core Student Textbook',
    serves: ['learner', 'ecosystem'], improves: ['learning', 'independent study'],
    owner: OWNER.PRESS,
    artefact: 'IEFC Complete Curriculum (Student Edition).pdf',
    build: 'render-student.mjs',
    needs: [need('teaching lessons printed whole', 'teachingLessons', 19),
      need('module overviews and assessments', 'items', 49)] }),
  r({ cat: 'Student', name: 'Student Workbook',
    serves: ['learner'], improves: ['learning', 'independent study', 'revision'],
    owner: OWNER.PRESS,
    artefact: 'IEFC Level I Student Workbook.pdf',
    build: 'render-workbook.mjs',
    needs: [need('lessons with guided, homework and extension practice', 'guided', 19),
      need('supplied material sets for practice that hands the learner something',
        'exerciseSets', 1)] }),
  r({ cat: 'Student', name: 'Grammar Companion',
    serves: ['learner'], improves: ['learning', 'revision', 'independent study'],
    owner: OWNER.PRESS,
    needs: [need('lessons with a presentation stage to key the reference to', 'presentation', 19),
      need('cross-references between lessons', 'crossRefs', 20)] }),
  r({ cat: 'Student', name: 'Vocabulary Builder',
    serves: ['learner'], improves: ['learning', 'revision', 'independent study'],
    owner: OWNER.PRESS,
    needs: [need('lessons carrying a vocabulary stage', 'vocabularyStages', 19),
      need('authored vocabulary sets, one per teaching lesson that introduces new words',
        'vocabularySets', 18)] }),
  r({ cat: 'Student', name: 'Pronunciation Companion',
    serves: ['learner'], improves: ['learning', 'independent study'],
    owner: OWNER.PRESS,
    needs: [need('lessons with a pronunciation stage', 'pronunciation', 19),
      need('pronunciation targets with an example and guidance',
        'pronunciationTargets', 20)] }),
  r({ cat: 'Student', name: 'Reading Companion',
    serves: ['learner'], improves: ['learning', 'independent study'],
    owner: OWNER.PRESS,
    needs: [need('lessons with a reading activity', 'reading', 19)] }),
  r({ cat: 'Student', name: 'Writing Companion',
    serves: ['learner'], improves: ['learning', 'independent study'],
    owner: OWNER.PRESS,
    needs: [need('lessons with a writing task', 'writing', 19),
      need('assignments with a marking rubric', 'rubrics', 10)] }),
  r({ cat: 'Student', name: 'Speaking Companion',
    serves: ['learner'], improves: ['learning', 'independent study'],
    owner: OWNER.PRESS,
    needs: [need('lessons with a speaking activity', 'speaking', 19)] }),
  r({ cat: 'Student', name: 'Listening Companion',
    serves: ['learner'], improves: ['learning', 'independent study'],
    owner: OWNER.PRESS,
    needs: [need('lessons with a listening activity', 'listening', 19),
      need('listening scripts', 'listeningScripts', 19),
      need('speaker cues within those scripts', 'speakerCues', 40)] }),
  r({ cat: 'Student', name: 'Independent Study Guide',
    serves: ['learner'], improves: ['independent study', 'learner success'],
    owner: OWNER.PRESS,
    needs: [need('self-checks a learner can attempt alone', 'selfChecks', 19),
      need('lessons with homework', 'homework', 19),
      need('lessons with an extension activity', 'extension', 19)] }),
  r({ cat: 'Student', name: 'Revision Guide',
    serves: ['learner'], improves: ['revision', 'learner success'],
    owner: OWNER.PRESS,
    needs: [need('lessons carrying a revision stage', 'revision', 19),
      need('self-checks to revise against', 'selfChecks', 19)] }),
  r({ cat: 'Student', name: 'Quick Reference Guide',
    serves: ['learner'], improves: ['revision', 'independent study'],
    owner: OWNER.PRESS,
    needs: [need('lessons with objectives to summarise', 'objectives', 19),
      need('vocabulary stages', 'vocabularyStages', 19)] }),
  r({ cat: 'Student', name: 'Portfolio Book',
    serves: ['learner', 'examiner'], improves: ['assessment', 'learner success'],
    owner: OWNER.PRESS,
    needs: [need('assignments whose output a portfolio would collect', 'assignments', 10),
      need('rubrics stating how each is judged', 'rubrics', 10)] }),
  r({ cat: 'Student', name: 'Progress Journal',
    serves: ['learner'], improves: ['learner success', 'independent study'],
    owner: OWNER.PRESS,
    needs: [need('lessons with a reflection prompt', 'reflection', 19),
      need('self-checks to record the result of', 'selfChecks', 19)] }),
  r({ cat: 'Student', name: 'Learner Planner',
    serves: ['learner'], improves: ['independent study', 'learner success'],
    owner: OWNER.PRESS,
    needs: [need('lessons with designed stage timings to schedule', 'teachingLessons', 19),
      need('modules to lay out as a term', 'modules', 10)] }),

  // ── Teacher resources ──────────────────────────────────────────────
  r({ cat: 'Teacher', name: "Teacher's Edition",
    serves: ['teacher', 'ecosystem'], improves: ['teaching', 'classroom delivery'],
    owner: OWNER.PRESS,
    artefact: 'IEFC Complete Curriculum.pdf', build: 'render-flagship.mjs',
    needs: [need('teaching lessons with answer keys and staged timings', 'teachingLessons', 19),
      need('quiz questions with answers', 'quizQuestions', 100)] }),
  // Retargeted. These three required observed classroom evidence, which
  // cannot be invented and blocked them entirely. The directive's
  // distinction is the fix: what a teacher knows from teaching cannot be
  // authored, but educational expertise and established pedagogy can,
  // and most of what these volumes contain is the latter. They now
  // require AUTHORED pedagogical knowledge, which is honest work, and
  // each of them prints the evidence state of every claim so a reader
  // can see which is which.
  r({ cat: 'Teacher', name: "Teacher's Companion",
    serves: ['teacher'], improves: ['teaching', 'educational quality'],
    owner: OWNER.ACADEMIC,
    needs: [need('pedagogical fields supplied by expertise or established practice',
      'pedagogyAuthored', 40),
    need('fields derived from the curriculum itself', 'pedagogyEvidenced', 50)] }),
  r({ cat: 'Teacher', name: 'Teaching Guide',
    serves: ['teacher'], improves: ['teaching', 'classroom delivery'],
    owner: OWNER.PRESS,
    needs: [need('lessons with a presentation stage to explain', 'presentation', 19),
      need('lessons with a warm-up', 'warmup', 19)] }),
  r({ cat: 'Teacher', name: 'Lesson Planning Manual',
    serves: ['teacher'], improves: ['teaching', 'classroom delivery'],
    owner: OWNER.PRESS,
    needs: [need('lessons with a full stage structure and designed timings',
      'teachingLessons', 19)] }),
  r({ cat: 'Teacher', name: 'Classroom Activities Handbook',
    serves: ['teacher'], improves: ['classroom delivery', 'teaching'],
    owner: OWNER.PRESS,
    needs: [need('guided practice activities', 'guided', 19),
      need('speaking activities', 'speaking', 19),
      need('extension activities', 'extension', 19)] }),
  r({ cat: 'Teacher', name: 'Assessment Handbook',
    serves: ['teacher', 'examiner'], improves: ['assessment'],
    owner: OWNER.PRESS,
    artefact: 'IEFC Assessment Handbook.pdf', build: 'render-assessment.mjs',
    needs: [need('rubrics', 'rubrics', 10), need('quiz questions', 'quizQuestions', 100)] }),
  r({ cat: 'Teacher', name: 'Examination Guide',
    serves: ['examiner', 'institution'], improves: ['assessment'],
    owner: OWNER.PRESS,
    needs: [need('module quizzes and the level examination', 'quizzes', 10),
      need('rubrics governing the written and spoken papers', 'rubrics', 10)] }),
  r({ cat: 'Teacher', name: 'Marking Guide',
    serves: ['examiner'], improves: ['assessment', 'educational quality'],
    owner: OWNER.PRESS,
    needs: [need('rubric criteria to mark against', 'rubricCriteria', 40),
      need('quiz questions with a stated correct answer', 'quizQuestions', 100)] }),
  r({ cat: 'Teacher', name: 'Rubric Guide',
    serves: ['examiner'], improves: ['assessment', 'educational quality'],
    owner: OWNER.PRESS,
    needs: [need('rubrics', 'rubrics', 10), need('criteria across them', 'rubricCriteria', 40)] }),
  r({ cat: 'Teacher', name: 'Answer Book',
    serves: ['teacher'], improves: ['teaching', 'assessment'],
    owner: OWNER.PRESS,
    needs: [need('quiz questions with answers', 'quizQuestions', 100),
      need('self-check prompts with model answers', 'selfCheckPrompts', 50),
      need('exercise items with answers', 'exerciseItems', 5)] }),
  r({ cat: 'Teacher', name: 'Intervention Guide',
    serves: ['teacher'], improves: ['teaching', 'learner success'],
    owner: OWNER.ACADEMIC,
    needs: [need('authored intervention and remediation guidance', 'pedagogyAuthored', 20)] }),
  r({ cat: 'Teacher', name: 'Differentiation Guide',
    serves: ['teacher'], improves: ['teaching', 'learner success'],
    owner: OWNER.ACADEMIC,
    needs: [need('authored differentiation guidance in both directions',
      'pedagogyAuthored', 30)] }),
  r({ cat: 'Teacher', name: 'Classroom Management Notes',
    serves: ['teacher'], improves: ['classroom delivery'],
    owner: OWNER.ACADEMIC,
    unsupported: true,
    why: 'Classroom management is knowledge of how a room behaves, and this College has taught '
      + 'nobody. Every sentence would be invention dressed as experience. It is recorded here '
      + 'so it is commissioned from a practising teacher rather than written editorially.' }),
  r({ cat: 'Teacher', name: 'Common Errors Guide',
    serves: ['teacher'], improves: ['teaching', 'learner success'],
    owner: OWNER.PRESS,
    needs: [need('self-check prompts targeting a named confusion', 'selfCheckTraps', 20),
      need('lessons with a pedagogical record', 'pedagogyEntries', 300)] }),

  // ── Assessment resources ───────────────────────────────────────────
  r({ cat: 'Assessment', name: 'Diagnostic Assessment',
    serves: ['teacher', 'institution'], improves: ['assessment', 'learner success'],
    owner: OWNER.ACADEMIC,
    needs: [need('competency-mapped assessments to diagnose against',
      'competencyMappedAssessments', 10)] }),
  r({ cat: 'Assessment', name: 'Entry Assessment',
    serves: ['institution'], improves: ['assessment'],
    owner: OWNER.ACADEMIC,
    needs: [need('competency-mapped assessments to place against',
      'competencyMappedAssessments', 10)] }),
  r({ cat: 'Assessment', name: 'Module Tests',
    serves: ['examiner', 'teacher'], improves: ['assessment'],
    owner: OWNER.PRESS,
    needs: [need('module quizzes', 'quizzes', 10), need('quiz questions', 'quizQuestions', 100)] }),
  r({ cat: 'Assessment', name: 'Progress Tests',
    serves: ['examiner'], improves: ['assessment', 'revision'],
    owner: OWNER.PRESS,
    needs: [need('module quizzes to draw from', 'quizzes', 10),
      need('revision stages naming what each module returns to', 'revision', 19)] }),
  r({ cat: 'Assessment', name: 'Mid-Level Examination',
    serves: ['examiner'], improves: ['assessment'],
    owner: OWNER.ACADEMIC,
    needs: [need('a stated pass threshold on the level rubrics', 'competencyMappedAssessments',
      10)] }),
  r({ cat: 'Assessment', name: 'Final Examination',
    serves: ['examiner', 'institution'], improves: ['assessment'],
    owner: OWNER.PRESS,
    needs: [need('the level mock examination items', 'quizQuestions', 100),
      need('the examination rubrics', 'rubrics', 10)] }),
  r({ cat: 'Assessment', name: 'Speaking Assessment',
    serves: ['examiner'], improves: ['assessment'],
    owner: OWNER.PRESS,
    needs: [need('speaking activities to assess', 'speaking', 19),
      need('rubrics carrying spoken criteria', 'rubrics', 10)] }),
  r({ cat: 'Assessment', name: 'Listening Assessment',
    serves: ['examiner'], improves: ['assessment'],
    owner: OWNER.GOVERNANCE,
    needs: [need('recorded audio a candidate can be examined on', 'recordings', 19)] }),
  r({ cat: 'Assessment', name: 'Reading Assessment',
    serves: ['examiner'], improves: ['assessment'],
    owner: OWNER.PRESS,
    needs: [need('reading activities to assess', 'reading', 19)] }),
  r({ cat: 'Assessment', name: 'Writing Assessment',
    serves: ['examiner'], improves: ['assessment'],
    owner: OWNER.PRESS,
    needs: [need('writing tasks', 'writing', 19), need('rubrics', 'rubrics', 10)] }),
  r({ cat: 'Assessment', name: 'Portfolio Assessment',
    serves: ['examiner'], improves: ['assessment'],
    owner: OWNER.PRESS,
    needs: [need('assignments a portfolio would hold', 'assignments', 10),
      need('rubric criteria to judge them by', 'rubricCriteria', 40)] }),
  r({ cat: 'Assessment', name: 'Continuous Assessment',
    serves: ['teacher', 'examiner'], improves: ['assessment', 'teaching'],
    owner: OWNER.PRESS,
    needs: [need('formative assessment points inside lessons', 'formativeAssessment', 19),
      need('self-checks the learner records', 'selfChecks', 19)] }),

  // ── Classroom resources ────────────────────────────────────────────
  r({ cat: 'Classroom', name: 'Flashcards',
    serves: ['teacher'], improves: ['classroom delivery', 'learning'],
    owner: OWNER.PRESS,
    needs: [need('authored vocabulary sets a card pack could be printed from', 'vocabularySets', 18)] }),
  r({ cat: 'Classroom', name: 'Vocabulary Cards',
    serves: ['teacher'], improves: ['classroom delivery', 'learning'],
    owner: OWNER.PRESS,
    needs: [need('vocabulary stages naming the set', 'vocabularyStages', 19),
      need('printable words across them', 'vocabularyWords', 150)] }),
  r({ cat: 'Classroom', name: 'Conversation Cards',
    serves: ['teacher'], improves: ['classroom delivery', 'learning'],
    owner: OWNER.PRESS,
    needs: [need('speaking activities to card', 'speaking', 19)] }),
  r({ cat: 'Classroom', name: 'Pair-work Resources',
    serves: ['teacher'], improves: ['classroom delivery'],
    owner: OWNER.PRESS,
    needs: [need('guided practice stages written for pairs', 'guided', 19)] }),
  r({ cat: 'Classroom', name: 'Group Activities',
    serves: ['teacher'], improves: ['classroom delivery'],
    owner: OWNER.PRESS,
    needs: [need('speaking and guided stages written for groups', 'speaking', 19)] }),
  r({ cat: 'Classroom', name: 'Solo Reinforcement Activities',
    serves: ['learner', 'teacher'], improves: ['independent study', 'learning'],
    owner: OWNER.PRESS,
    // Seventeen, not nineteen. Two Level I teaching lessons are already
    // independent, and writing a solo alternative to a solo lesson would
    // be padding — which the Permanent Academic Rule forbids.
    needs: [need('solo activities, each naming the collaborative task it serves',
      'soloReinforcementActivities', 17)] }),
  r({ cat: 'Classroom', name: 'Printable Worksheets',
    serves: ['teacher', 'learner'], improves: ['classroom delivery', 'learning'],
    owner: OWNER.PRESS,
    needs: [need('practice stages to build a sheet from', 'guided', 19),
      need('supplied material sets', 'exerciseSets', 1)] }),
  r({ cat: 'Classroom', name: 'Posters',
    serves: ['teacher'], improves: ['classroom delivery'],
    owner: OWNER.PRESS,
    needs: [need('presentation stages with modelled language to display', 'presentation', 19)] }),
  r({ cat: 'Classroom', name: 'Classroom Slides',
    serves: ['teacher'], improves: ['classroom delivery', 'teaching'],
    owner: OWNER.PRESS,
    needs: [need('lessons with a full stage structure to project', 'teachingLessons', 19)] }),
  r({ cat: 'Classroom', name: 'Presentation Decks',
    serves: ['teacher'], improves: ['classroom delivery', 'teaching'],
    owner: OWNER.PRESS,
    needs: [need('lessons with presentation and guided stages', 'presentation', 19)] }),
  r({ cat: 'Classroom', name: 'Interactive Activities',
    serves: ['learner'], improves: ['learning', 'independent study'],
    owner: OWNER.PRESS,
    needs: [need('self-check prompts with answers to drive an interaction',
      'selfCheckPrompts', 50),
    need('exercise items', 'exerciseItems', 5)] }),
  r({ cat: 'Classroom', name: 'Review Games',
    serves: ['teacher'], improves: ['revision', 'classroom delivery'],
    owner: OWNER.PRESS,
    needs: [need('revision stages', 'revision', 19),
      need('authored vocabulary sets to play with', 'vocabularySets', 18)] }),

  // ── Digital resources ──────────────────────────────────────────────
  r({ cat: 'Digital', name: 'LMS lesson content',
    serves: ['learner', 'ecosystem'], improves: ['learning', 'independent study'],
    owner: OWNER.PRESS,
    artefact: null, build: 'seed-curriculum-level-1.sql',
    needs: [need('items seeded and served by the LMS', 'items', 49)] }),
  r({ cat: 'Digital', name: 'Interactive exercises',
    serves: ['learner'], improves: ['learning', 'independent study'],
    owner: OWNER.PRESS,
    needs: [need('exercise items to drive them', 'exerciseItems', 5),
      need('self-check prompts', 'selfCheckPrompts', 50)] }),
  r({ cat: 'Digital', name: 'Audio library',
    serves: ['learner', 'teacher'], improves: ['learning', 'independent study'],
    owner: OWNER.GOVERNANCE,
    needs: [need('recorded takes, not scripts', 'recordings', 19)] }),
  r({ cat: 'Digital', name: 'Video support',
    serves: ['learner'], improves: ['learning'],
    owner: OWNER.GOVERNANCE,
    unsupported: true,
    why: 'This curriculum contains no video and no video script. A Video Support Pack would be '
      + 'a title over an empty folder — the same failure as a practice stage pointing at '
      + 'material that does not exist. Requires a production decision and a budget before any '
      + 'editorial work is possible.' }),
  r({ cat: 'Digital', name: 'Downloadable resources',
    serves: ['learner', 'teacher'], improves: ['independent study', 'classroom delivery'],
    owner: OWNER.PRESS,
    needs: [need('printable apparatus to package', 'guided', 19)] }),
  r({ cat: 'Digital', name: 'QR-linked resources',
    serves: ['learner', 'ecosystem'], improves: ['independent study'],
    owner: OWNER.PRESS,
    needs: [need('items with a stable reference a code can resolve to', 'items', 49)] }),
  r({ cat: 'Digital', name: 'Mobile learning resources',
    serves: ['learner'], improves: ['independent study'],
    owner: OWNER.PRESS,
    needs: [need('self-checks short enough to attempt on a phone', 'selfChecks', 19)] }),
  r({ cat: 'Digital', name: 'Teacher dashboard content',
    serves: ['teacher', 'institution'], improves: ['teaching'],
    owner: OWNER.PRESS,
    needs: [need('lessons with formative assessment points to report on',
      'formativeAssessment', 19)] }),
  r({ cat: 'Digital', name: 'Student dashboard content',
    serves: ['learner'], improves: ['learner success', 'independent study'],
    owner: OWNER.PRESS,
    needs: [need('self-checks whose result a dashboard can show', 'selfChecks', 19),
      need('module assessments to report progress against', 'quizzes', 10)] }),

  // ── Academic documentation ─────────────────────────────────────────
  r({ cat: 'Academic', name: 'Module Specifications',
    serves: ['institution'], improves: ['educational quality'],
    owner: OWNER.PRESS,
    needs: [need('modules with lessons, assessment and stated hours', 'modules', 10)] }),
  r({ cat: 'Academic', name: 'Lesson Specifications',
    serves: ['institution'], improves: ['educational quality'],
    owner: OWNER.PRESS,
    needs: [need('lessons with objectives, prerequisites and timings', 'teachingLessons', 19)] }),
  r({ cat: 'Academic', name: 'Learning Outcomes',
    serves: ['institution', 'employer'], improves: ['educational quality', 'assessment'],
    owner: OWNER.ACADEMIC,
    needs: [need('assessments mapped to a competency, without which an outcome is a claim '
      + 'nothing tests', 'competencyMappedAssessments', 10),
    need('level outcomes, each belonging to a competency', 'levelOutcomes', 4),
    need('assessments evidencing those outcomes', 'outcomeEvidence', 15)] }),
  r({ cat: 'Academic', name: 'Assessment Specifications',
    serves: ['institution', 'examiner'], improves: ['assessment', 'educational quality'],
    owner: OWNER.PRESS,
    needs: [need('quizzes and assignments with rubrics', 'rubrics', 10),
      need('quiz questions', 'quizQuestions', 100)] }),
  r({ cat: 'Academic', name: 'Competency Mapping',
    serves: ['institution', 'employer'], improves: ['assessment', 'educational quality'],
    owner: OWNER.GOVERNANCE,
    needs: [need('assessments carrying a competency mapping',
      'competencyMappedAssessments', 20)] }),
  r({ cat: 'Academic', name: 'Graduate Attributes',
    serves: ['employer'], improves: ['educational quality'],
    owner: OWNER.GOVERNANCE,
    needs: [need('competency-mapped assessments the attributes rest on',
      'competencyMappedAssessments', 20)] }),
  r({ cat: 'Academic', name: 'Learning Architecture',
    serves: ['teacher', 'institution'], improves: ['teaching', 'educational quality'],
    owner: OWNER.PRESS,
    needs: [need('lessons carrying a declared architecture and its reason',
      'teachingLessons', 19)] }),
  r({ cat: 'Academic', name: 'Educational Completeness',
    serves: ['institution'], improves: ['educational quality'],
    owner: OWNER.PRESS,
    needs: [need('lessons scored against all eleven components', 'teachingLessons', 19)] }),
  // Internal quality assurance is now delegated and buildable; EXTERNAL
  // validation is not, and never was the same thing. The register used
  // to conflate them, which made an authored document look impossible
  // because an outside body had not read it. Split: this row is the
  // internal documentation, and the row below records the external
  // review as the separate, genuinely blocked thing it is.
  r({ cat: 'Academic', name: 'Quality Assurance documentation',
    serves: ['institution'], improves: ['educational quality'],
    owner: OWNER.ACADEMIC,
    needs: [need('assessments with a recorded competency mapping and a rationale',
      'competencyMappedAssessments', 20),
    need('level outcomes each evidenced by assessment', 'levelOutcomes', 4),
    need('rubrics stating the criteria before the marking', 'rubrics', 10)] }),
  r({ cat: 'Academic', name: 'External review of the Level I award',
    serves: ['employer'], improves: ['educational quality'],
    owner: OWNER.EXTERNAL,
    unsupported: true,
    why: 'No external examiner, awarding body or peer institution has reviewed this programme, '
      + 'and none can be recorded as having done so. The competency mapping, the learning '
      + 'outcomes and the quality-assurance documentation are all authored under authority '
      + 'delegated internally, and they are marked interim rather than approved for exactly '
      + 'that reason. This row exists so that the delegation is never mistaken for validation: '
      + 'an institution may run Level I on this basis, and may not claim it has been '
      + 'externally examined.' }),

  // ── The parent-facing gap the directive surfaced ────────────────────
  r({ cat: 'Student', name: 'Parent & Guardian Guide',
    serves: ['parent'], improves: ['learner success', 'educational quality'],
    owner: OWNER.PRESS,
    needs: [need('modules with stated content and hours to describe', 'modules', 10),
      need('rubrics that explain in plain words how a learner is judged', 'rubrics', 10)] }),
  r({ cat: 'Academic', name: 'Level I Award Statement',
    serves: ['employer'], improves: ['educational quality'],
    owner: OWNER.GOVERNANCE,
    needs: [need('competency-mapped assessments behind any statement of what the holder can do',
      'competencyMappedAssessments', 20)] }),
];

// ─────────────────────────────────────────────────────────────────────
// 4 · RESOLUTION
// ─────────────────────────────────────────────────────────────────────

/** Status computed from measurement, never typed. */
export function resolve(res, inv) {
  const met = res.needs.map((n) => ({
    ...n, have: inv[n.key] ?? 0, deficit: Math.max(0, n.need - (inv[n.key] ?? 0)),
  }));
  const short = met.filter((m) => m.deficit > 0);

  let status;
  if (res.unsupported) status = STATUS.UNSUPPORTED;
  else if (res.artefact && existsSync(path.join(ROOT, 'publication', res.artefact))) {
    status = STATUS.PUBLISHED;
  } else if (!short.length && res.owner === OWNER.EXTERNAL) status = STATUS.EXTERNAL;
  else if (!short.length) status = STATUS.DERIVABLE;
  else if (res.owner === OWNER.GOVERNANCE) status = STATUS.GOVERNANCE;
  else if (res.owner === OWNER.EXTERNAL) status = STATUS.EXTERNAL;
  else if (res.owner === OWNER.ACADEMIC) status = STATUS.ACADEMIC;
  else status = STATUS.AUTHORING;

  return { ...res, met, short, status };
}

export function stageOne(C = buildCurriculum()) {
  const inv = inventoryL1(C);
  return RESOURCES.map((res) => resolve(res, inv));
}

export function statusCounts(rows = stageOne()) {
  const out = {};
  for (const s of Object.values(STATUS)) out[s] = 0;
  for (const r of rows) out[r.status] += 1;
  return out;
}

/**
 * Readiness, computed per criterion rather than as a share of the list.
 *
 * A criterion is SATISFIED when every resource serving it is available
 * — published or derivable. Anything short blocks it, and the blocker
 * is named. This is why the headline figure cannot be improved by
 * publishing whichever volumes are easiest: the easy ones mostly serve
 * criteria that are already met.
 *
 * Resources recorded as unsupported by the curriculum still block. An
 * absence with a good reason is still an absence, and a stage that
 * counted it as satisfied would be reporting a preference.
 */
const AVAILABLE = new Set([STATUS.PUBLISHED, STATUS.DERIVABLE]);

export function readiness(rows = stageOne()) {
  const criteria = COMPLETION.map((c) => {
    const serving = rows.filter((r) => r.serves.includes(c.key));
    const blockers = serving.filter((r) => !AVAILABLE.has(r.status));
    return {
      ...c,
      total: serving.length,
      available: serving.length - blockers.length,
      satisfied: blockers.length === 0,
      blockers: blockers.map((b) => ({ name: b.name, status: b.status, owner: b.owner })),
    };
  });
  const availableRows = rows.filter((r) => AVAILABLE.has(r.status)).length;
  return {
    criteria,
    criteriaSatisfied: criteria.filter((c) => c.satisfied).length,
    criteriaTotal: criteria.length,
    resources: rows.length,
    available: availableRows,
    resourcePct: Math.round((availableRows / rows.length) * 100),
    // The headline. Stage readiness is the criteria figure, not the
    // resource figure, because the directive defines completion by the
    // criteria. Both are reported so neither can be quoted alone.
    stagePct: Math.round((criteria.filter((c) => c.satisfied).length / criteria.length) * 100),
    classroomReady: criteria.find((c) => c.key === 'teacher').satisfied
      && criteria.find((c) => c.key === 'learner').satisfied,
    publicationReady: criteria.every((c) => c.satisfied),
  };
}

/** The report the directive asks for, in the buckets it asks for. */
export function report(rows = stageOne()) {
  const by = (s) => rows.filter((r) => r.status === s);
  return {
    completed: [...by(STATUS.PUBLISHED)],
    derivable: [...by(STATUS.DERIVABLE)],
    remaining: rows.filter((r) => !AVAILABLE.has(r.status)),
    academicAuthoring: by(STATUS.ACADEMIC),
    governance: by(STATUS.GOVERNANCE),
    externalReview: by(STATUS.EXTERNAL),
    unsupported: by(STATUS.UNSUPPORTED),
    readiness: readiness(rows),
  };
}
