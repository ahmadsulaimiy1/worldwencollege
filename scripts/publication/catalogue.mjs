/**
 * WEC PRESS — THE PUBLICATION ARCHITECTURE.
 *
 * ────────────────────────────────────────────────────────────────────
 * THE ONLY HONEST WAY TO WRITE A TEN-YEAR PUBLISHING LIST
 * ────────────────────────────────────────────────────────────────────
 * A publishing programme is the easiest document in the world to
 * fabricate. Forty titles, a series name each, a plausible extent, four
 * waves across ten years — it reads like a plan and commits to nothing.
 * Everything on it is true in the future tense, which is another way of
 * saying none of it is true.
 *
 * So no title in this catalogue carries a status anyone typed. Every
 * title declares what material a real edition of it would require, in
 * countable units, and the status is COMPUTED against the live academic
 * database:
 *
 *   PUBLISHED — the artefact exists and a named build script makes it.
 *   DERIVABLE — every stated requirement is already met by material
 *     that exists. Producing it is editorial work and nothing else:
 *     no new curriculum, no institutional decision.
 *   REQUIRES AUTHORING — at least one requirement is short. The
 *     shortfall is printed as a number, so the academic staff who
 *     would author it can see the size of the job before agreeing.
 *   REQUIRES GOVERNANCE — blocked on a decision or an authority the
 *     Press does not hold: appointed officers, a registered ISBN
 *     prefix, an audited year, a print budget, a signed contract. No
 *     amount of editorial work unblocks these, and pretending
 *     otherwise is how a catalogue starts lying.
 *
 * The consequence is that this file cannot flatter the institution. If
 * a strand of the curriculum is thin, the book that would need it comes
 * out as REQUIRES AUTHORING with the deficit attached — the Reading
 * Programme does, at 78 of the 114 lessons it would need. If the
 * Academic Framework volume is asked for, it reports that nought of the
 * hundred and twenty assessments carry a competency mapping, and stays
 * unbuildable until they do.
 *
 * And it works the other way too. Several books turn out to be nearer
 * than anyone assumed. The 120 listening scripts with their 497 speaker
 * cues have been sitting in the database since the audio platform was
 * built; a Listening Scripts volume needs no new writing at all. The
 * recordings are a different matter, and appear as a different status.
 *
 * ────────────────────────────────────────────────────────────────────
 * WHAT THIS FILE DOES NOT DO
 * ────────────────────────────────────────────────────────────────────
 * It does not design covers for books that do not exist. A series
 * identity that governs future titles belongs in house.mjs and is
 * written as a system; mocking up forty jackets would be a portfolio
 * exercise, not a publishing architecture.
 */
import { existsSync, readFileSync, readdirSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { DatabaseSync } from 'node:sqlite';
import { buildCurriculum, parseRubric } from './curriculum.mjs';
import { walk, crossReferences, glossary, pronunciationStrand } from './apparatus.mjs';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..');

export const STATUS = {
  PUBLISHED: 'Published',
  DERIVABLE: 'Derivable',
  AUTHORING: 'Requires authoring',
  GOVERNANCE: 'Requires governance',
};

/** Ordered worst-to-best for sorting a table into a readable shape. */
export const STATUS_ORDER = [
  STATUS.PUBLISHED, STATUS.DERIVABLE, STATUS.AUTHORING, STATUS.GOVERNANCE];

// ─────────────────────────────────────────────────────────────────────
// 1 · THE INVENTORY
// ─────────────────────────────────────────────────────────────────────

/**
 * Everything countable that the Press could publish from, measured at
 * build time. Nothing here is a constant: the zeroes are measured too,
 * which is why they can stop being zero without anyone editing this
 * file.
 */
export function inventory(C = buildCurriculum()) {
  const items = walk(C);
  const teaching = items.filter(({ item }) => item.stages.some((s) => s.icon === 'objectives'));
  const withStage = (icon) => items.filter(({ item }) =>
    item.stages.some((s) => s.icon === icon)).length;
  const wordsIn = (icons) => items.reduce((n, { item }) => n + item.stages
    .filter((s) => icons.includes(s.icon))
    .reduce((m, s) => m + s.parts.map((p) => p.text).join(' ').split(/\s+/).filter(Boolean).length, 0), 0);

  // Rubric criteria, counted through the same parser that sets them.
  let rubricCriteria = 0;
  for (const { item } of items) {
    const r = parseRubric(item.stages.find((s) => s.icon === 'rubric'));
    if (r) rubricCriteria += r.criteria.length;
  }

  // The audio seeds are not part of buildCurriculum's model, so they
  // are opened here rather than assumed.
  const db = new DatabaseSync(':memory:');
  db.exec(readFileSync(`${ROOT}/sql/schema.sql`, 'utf8'));
  for (let n = 1; n <= 6; n++) {
    db.exec(readFileSync(`${ROOT}/sql/seed-curriculum-level-${n}.sql`, 'utf8'));
    db.exec(readFileSync(`${ROOT}/sql/seed-audio-level-${n}.sql`, 'utf8'));
  }
  const one = (sql) => db.prepare(sql).get().n;

  // One edge per reference a lesson makes. The `back` map is the same
  // edges indexed the other way, so counting both would double every
  // one of them — 191 references would report as 329.
  const crossRefs = [...crossReferences(C).forward.values()]
    .reduce((n, refs) => n + refs.length, 0);

  const inv = {
    // Structure
    levels: C.totals.levels,
    modules: C.totals.modules,
    items: C.totals.lessons,
    teachingLessons: teaching.length,
    moduleOverviews: items.filter(({ item }) => item.kind === 'reading').length - teaching.length,
    bodyWords: C.totals.bodyWords,

    // Teaching strands, counted as LESSONS CARRYING the stage. A stage
    // count would be a different and larger number — 276 vocabulary
    // stages across 168 lessons — and a book is planned per lesson.
    objectiveStages: withStage('objectives'),
    presentationStages: withStage('present'),
    guidedStages: withStage('guided'),
    vocabularyStages: withStage('vocabulary'),
    listeningStages: withStage('listening'),
    speakingStages: withStage('speaking'),
    readingStages: withStage('reading'),
    writingStages: withStage('writing'),
    pronunciationStages: withStage('pronunciation'),
    homeworkStages: withStage('homework'),
    extensionStages: withStage('extension'),
    revisionStages: withStage('revision'),
    thinkingStages: withStage('thinking'),
    practiceWords: wordsIn(['guided', 'homework', 'extension']),
    vocabularyWords: wordsIn(['vocabulary']),
    presentationWords: wordsIn(['present']),

    // Assessment
    quizzes: items.filter(({ item }) => item.kind === 'quiz').length,
    questions: C.totals.questions,
    assignments: items.filter(({ item }) => item.kind === 'assignment').length,
    rubrics: withStage('rubric'),
    rubricCriteria,
    examPapers: countFiles('docs/exams', /\.md$/),

    // Audio: scripted, not recorded — and the two are counted apart
    listeningScripts: one("SELECT COUNT(*) AS n FROM audio_assets WHERE kind = 'listening'"),
    modelPronunciations: one("SELECT COUNT(*) AS n FROM audio_assets WHERE kind = 'model_pronunciation'"),
    audioCues: one('SELECT COUNT(*) AS n FROM audio_cues'),
    recordedAudio: one('SELECT COUNT(*) AS n FROM audio_assets WHERE media_url IS NOT NULL'),
    pronunciationTargets: one('SELECT COUNT(*) AS n FROM pronunciation_targets'),

    // Apparatus already built for the flagship
    glossaryHeadwords: glossary(C).length,
    crossRefs,
    pronunciationEntries: pronunciationStrand(C).reduce((n, g) => n + g.rows.length, 0),

    // Frameworks and their mapping state
    competencies: one('SELECT COUNT(*) AS n FROM competencies'),
    languageSkills: one('SELECT COUNT(*) AS n FROM language_skills'),
    awardDefinitions: one('SELECT COUNT(*) AS n FROM award_definitions'),
    assessmentsMapped: one('SELECT COUNT(*) AS n FROM assessment_competencies'),

    // Institutional facts. Every one of these is a measured zero.
    appointedMembers: one('SELECT COALESCE(SUM(members_appointed), 0) AS n FROM academic_bodies'),
    electedOfficers: one('SELECT COALESCE(SUM(officers_elected), 0) AS n FROM alumni_chapters'),
    awardsIssued: one('SELECT COUNT(*) AS n FROM awards'),
    enrolments: one('SELECT COUNT(*) AS n FROM enrolments'),

    // Material that would have to be written before certain books exist
    arabicCurriculumItems: one(
      "SELECT COUNT(*) AS n FROM learning_items WHERE body GLOB '*[؀-ۿ]*'"),
    pedagogyChapters: countFiles('docs/teaching', /\.md$/),
    researchPapers: countFiles('docs/research', /\.md$/),
  };

  // Subject matter inside the general programme is not a programme.
  // These are counted against MODULE titles and against narrow terms:
  // a loose regex over lesson text found thirty "business" lessons and
  // would have reported a business series as ready to publish, when
  // what exists is a handful of workplace topics inside general
  // English. The strict count is the honest one.
  const modules = C.levels.flatMap((lv) => lv.modules);
  const byModule = (re) => modules.filter((m) => re.test(m.title)).length;
  const lessonsIn = (re) => items.filter(({ mod }) => re.test(mod.title)).length;
  inv.academicWritingLessons = lessonsIn(/Academic Writing|Research/i);
  inv.academicWritingModules = byModule(/Academic Writing|Research/i);
  inv.businessModules = byModule(/Business|Commercial|In-Company/i);
  inv.executiveModules = byModule(/Executive|Intensive/i);
  inv.youngLearnerModules = byModule(/Young Learner|Children|Primary/i);

  db.close();
  return inv;
}

function countFiles(dir, re) {
  const abs = `${ROOT}/${dir}`;
  if (!existsSync(abs)) return 0;
  return readdirSync(abs).filter((f) => re.test(f)).length;
}

// ─────────────────────────────────────────────────────────────────────
// 2 · THE TITLES
// ─────────────────────────────────────────────────────────────────────

/** A countable requirement. `key` indexes the inventory. */
const need = (what, key, n) => ({ what, key, need: n });

/**
 * Publication waves. Ten years, but the boundaries are conditions
 * rather than dates: a wave begins when the thing it depends on exists.
 */
export const WAVES = [
  { n: 1, years: 'Years 1–2', name: 'From what exists',
    gate: 'No new curriculum and no institutional decision required.' },
  { n: 2, years: 'Years 3–4', name: 'From what can be completed',
    gate: 'Requires curriculum work of a size already measured, or one governance decision.' },
  { n: 3, years: 'Years 5–7', name: 'New programmes',
    gate: 'Requires a syllabus the College has not written and an audience it does not yet teach.' },
  { n: 4, years: 'Years 8–10', name: 'The institution publishing as an institution',
    gate: 'Requires the College to have a history: graduates, appointed officers, audited years.' },
];

const t = (o) => ({ needs: [], governance: null, artefact: null, build: null,
  htmlSource: null, ...o });

export const TITLES = [
  // ── The curriculum itself ─────────────────────────────────────────
  t({
    n: 1, family: 'IEFC Teacher Series', wave: 1,
    name: 'The International English Fluency Certificate — The Complete Curriculum',
    edition: 'Teacher’s Edition',
    audience: 'Teaching staff, academic reviewers, accreditation panels',
    artefact: 'publication/IEFC Complete Curriculum.pdf', build: 'curriculum',
    htmlSource: 'publication/.flagship.html',
    source: 'The whole academic database, set as a book: every module, every lesson, '
      + 'every rubric, the answer keys and the teaching guide.',
  }),
  t({
    n: 2, family: 'IEFC Student Series', wave: 1,
    name: 'The International English Fluency Certificate — The Complete Curriculum',
    edition: 'Student Edition',
    audience: 'Enrolled learners',
    artefact: 'publication/IEFC Complete Curriculum (Student Edition).pdf',
    htmlSource: 'publication/.student.html',
    build: 'curriculum:student', onDemand: true,
    source: 'The same source with the answer keys and teaching guide suppressed, so the '
      + 'two editions cannot drift apart.',
  }),
  t({
    n: 3, family: 'WEC Academic Framework Series', wave: 1,
    name: 'The International English Fluency Certificate — Programme Architecture',
    edition: 'Institutional Edition',
    audience: 'Partner institutions, employers, ministries, quality reviewers',
    artefact: 'publication/IEFC Programme Architecture (Institutional Edition).pdf',
    htmlSource: 'publication/.institutional.html',
    build: 'curriculum:institutional',
    source: 'The structure without the teaching: levels, modules, awards, frameworks, '
      + 'assessment design and the stated limitations.',
  }),
  t({
    n: 4, family: 'IEFC Student Series', wave: 1,
    name: 'The International English Fluency Certificate — The Complete Curriculum',
    edition: 'Large Print Edition (18 pt)',
    audience: 'Readers with low vision; reading-access provision',
    artefact: 'publication/IEFC Complete Curriculum (Large Print).pdf',
    htmlSource: 'publication/.flagship-large.html',
    build: 'curriculum:large', onDemand: true,
    source: 'The same text at a type scale that meets the large-print threshold, reflowed '
      + 'rather than magnified.',
  }),
  t({
    n: 5, family: 'IEFC Teacher Series', wave: 1,
    name: 'The International English Fluency Certificate — The Complete Curriculum',
    edition: 'Editable Edition (DOCX)',
    audience: 'Academic staff preparing course materials',
    artefact: 'publication/IEFC Complete Curriculum.docx', build: 'curriculum',
    source: 'The same model rendered to Word, with the figures rasterised in the same run '
      + 'so the two cannot disagree.',
  }),

  t({
    n: 43, family: 'WEC Academic Framework Series', wave: 1,
    name: 'The International English Fluency Certificate', edition: 'Flagship Document',
    audience: 'Reviewers and partners who need the qualification, not the lessons',
    artefact: 'publication/IEFC Flagship Curriculum.pdf', build: 'publication',
    htmlSource: 'publication/.print.html',
    source: 'The programme definition, the claims audit, the level architecture, the '
      + 'frameworks and the award definitions, rendered from the canonical model to Word and to '
      + 'print from one block list — the two artefacts are compared token by token by a test '
      + 'rather than trusted to agree.',
  }),

  // ── Practice and assessment ───────────────────────────────────────
  t({
    n: 6, family: 'IEFC Student Series', wave: 1,
    name: 'The IEFC Workbook', edition: 'Six volumes, one per level',
    audience: 'Learners working outside class',
    needs: [need('lessons with guided practice', 'guidedStages', 114),
      need('lessons with homework', 'homeworkStages', 114),
      need('lessons with extension work', 'extensionStages', 114)],
    source: 'Guided practice, homework and extension tasks already written into every '
      + 'teaching lesson, lifted out and given the space to be written in.',
  }),
  t({
    n: 7, family: 'IEFC Student Series', wave: 1,
    name: 'The IEFC Vocabulary Companion',
    audience: 'Learners at every level; teachers planning recycling',
    needs: [need('lessons carrying a vocabulary stage', 'vocabularyStages', 114),
      need('lexical index entries', 'glossaryHeadwords', 20)],
    source: 'The vocabulary strand of every module, with the lexical index that already '
      + 'shows where each item is first taught and where it returns.',
  }),
  t({
    n: 8, family: 'IEFC Assessment Series', wave: 1,
    name: 'The IEFC Assessment Handbook',
    audience: 'Teaching staff, examiners, moderators',
    needs: [need('module quizzes', 'quizzes', 60), need('quiz questions', 'questions', 600),
      need('assignments', 'assignments', 60), need('rubric criteria', 'rubricCriteria', 300)],
    source: 'Every quiz, every assignment brief and every rubric in one volume, with the '
      + 'marking standards stated once instead of sixty times.',
  }),
  t({
    n: 9, family: 'IEFC Assessment Series', wave: 2,
    name: 'IEFC Examination Papers and Model Answers',
    audience: 'Candidates preparing for level examinations',
    needs: [need('examination papers', 'examPapers', 12)],
    source: 'Nothing yet. The 660 questions in the database are formative module quizzes, '
      + 'not examination papers, and assembling them into mock papers would misrepresent '
      + 'both what they test and how they were validated.',
  }),

  // ── The skills series ─────────────────────────────────────────────
  t({
    n: 10, family: 'IEFC Reference Library', wave: 1,
    name: 'The IEFC Listening Scripts', edition: 'With speaker cues and transcripts',
    audience: 'Teachers running listening work without recorded audio',
    needs: [need('listening scripts', 'listeningScripts', 60),
      need('speaker cues', 'audioCues', 240),
      need('lessons with a listening stage', 'listeningStages', 114)],
    source: 'The 120 scripted assets written for the audio platform, every one with a full '
      + 'transcript and speaker-attributed cues, which have never been set as a book.',
  }),
  t({
    n: 11, family: 'IEFC Student Series', wave: 2,
    name: 'The IEFC Listening Programme', edition: 'Audio with printed script book',
    audience: 'Learners; self-access centres',
    governance: 'The scripts exist and the recordings do not: nought of 120 assets has an '
      + 'audio file. Recording requires a studio booking, voice casting for a stated '
      + 'variety, and a budget — none of which is an editorial decision.',
    source: '120 scripts, 497 cues, a stated British English variety and a target words-per-'
      + 'minute for every asset. The written half of this publication is complete.',
  }),
  t({
    n: 12, family: 'IEFC Reference Library', wave: 1,
    name: 'The IEFC Pronunciation Handbook',
    audience: 'Learners and teachers across all six levels',
    needs: [need('pronunciation targets with guidance', 'pronunciationTargets', 120),
      need('lessons with a pronunciation stage', 'pronunciationStages', 114)],
    source: '180 pronunciation targets, each naming a focus, a target, a worked example and '
      + 'a paragraph of guidance, across phonemes, word stress, sentence stress, rhythm, '
      + 'intonation and connected speech.',
  }),
  t({
    n: 13, family: 'IEFC Reference Library', wave: 1,
    name: 'A Grammar of the IEFC', edition: 'A reference keyed to the lessons',
    audience: 'Teachers; advanced learners',
    needs: [need('presentation stages', 'presentationStages', 114)],
    source: 'The presentation stage of every teaching lesson. This is a reference to the '
      + 'grammar the programme actually teaches, in the order it teaches it — not a new '
      + 'grammar syllabus, and the title must not imply one.',
  }),
  t({
    n: 14, family: 'IEFC Student Series', wave: 1,
    name: 'Speaking and Interaction in the IEFC',
    audience: 'Teachers running speaking work; examiners',
    needs: [need('lessons with a speaking stage', 'speakingStages', 88)],
    source: '88 speaking stages. The strand thins deliberately as the levels rise — 19 at '
      + 'Level I, 10 at Level VI — and the volume must show that shape rather than hide it.',
  }),
  t({
    n: 15, family: 'IEFC Student Series', wave: 2,
    name: 'The IEFC Reading Programme',
    audience: 'Learners; teachers planning extensive reading',
    needs: [need('lessons with a reading stage', 'readingStages', 114)],
    source: '78 reading stages of the 114 a complete programme would need. Levels III to VI '
      + 'carry 10 each where Levels I and II carry 19. The deficit is 36 stages, and it is '
      + 'the size of the authoring job.',
  }),
  t({
    n: 16, family: 'IEFC Student Series', wave: 2,
    name: 'Academic Writing in the IEFC', edition: 'Levels IV–VI',
    audience: 'Learners preparing for university study',
    needs: [need('modules devoted to academic writing or research', 'academicWritingModules', 5),
      need('lessons with a writing stage', 'writingStages', 114)],
    source: 'Five modules — Academic Writing I, II and III, Research & Presentation, and '
      + 'Research & Scholarship — plus the writing stage of every teaching lesson.',
  }),

  // ── Teacher and professional ──────────────────────────────────────
  t({
    n: 17, family: 'WEC Professional Development Series', wave: 2,
    name: 'Teaching the IEFC: A Handbook for Staff',
    audience: 'Teaching staff',
    needs: [need('authored chapters on teaching method', 'pedagogyChapters', 8)],
    source: 'The Teacher’s Edition carries a guide to using the book. A handbook on teaching '
      + 'method is a different work and none of it has been written.',
  }),
  t({
    n: 18, family: 'WEC Professional Development Series', wave: 2,
    name: 'Assessment Literacy for IEFC Teachers',
    audience: 'Teaching staff; internal moderators',
    needs: [need('assessments carrying a competency mapping', 'assessmentsMapped', 120),
      need('rubric criteria', 'rubricCriteria', 300)],
    source: 'The rubrics are complete and normalised to policy. The competency mapping is '
      + 'not: nought of 120 assessments carries one, and a book about assessment literacy '
      + 'that omitted that would be teaching the wrong lesson.',
  }),
  t({
    n: 19, family: 'WEC Governance Series', wave: 4,
    name: 'The Staff Induction Manual',
    audience: 'Newly appointed teaching and academic staff',
    governance: 'The College has no appointed teaching staff and no appointed members of '
      + 'either academic body. An induction manual describes an institution to the people '
      + 'joining it; there is nobody to describe it to, and no office to describe.',
    source: 'The academic regulations, the calendar and the rubric policy would supply most '
      + 'of the content once there is somebody to induct.',
  }),

  // ── Reference ─────────────────────────────────────────────────────
  t({
    n: 20, family: 'IEFC Reference Library', wave: 1,
    name: 'A Glossary of the IEFC',
    audience: 'Learners, teachers, reviewers',
    needs: [need('headwords defined from curriculum usage', 'glossaryHeadwords', 40)],
    source: '50 headwords, each defined in the sense the curriculum actually uses and each '
      + 'evidenced by a counted number of occurrences in the lessons.',
  }),
  t({
    n: 21, family: 'IEFC Reference Library', wave: 1,
    name: 'The IEFC Companion', edition: 'Cross-references, revision routes and indexes',
    audience: 'Teachers planning sequences; learners revising',
    needs: [need('lesson-to-lesson cross-references', 'crossRefs', 114),
      need('modules', 'modules', 60)],
    source: 'The 191 cross-references already written into the prerequisite stages, read as '
      + 'a graph: what each module is built on, and what later returns to it.',
  }),
  t({
    n: 22, family: 'WEC Academic Framework Series', wave: 1,
    name: 'The Award Architecture of the College',
    audience: 'Employers, partner institutions, verifying bodies',
    needs: [need('award definitions', 'awardDefinitions', 6),
      need('levels', 'levels', 6)],
    source: 'The six award definitions with their official titles, post-nominals, standing, '
      + 'academic purpose and graduate profiles, and the verification mechanism.',
  }),
  t({
    n: 23, family: 'WEC Academic Framework Series', wave: 2,
    name: 'The Academic Framework of the College',
    audience: 'Quality reviewers; academic partners',
    needs: [need('competencies', 'competencies', 6),
      need('language skills', 'languageSkills', 4),
      need('assessments carrying a competency mapping', 'assessmentsMapped', 120)],
    source: 'Six competencies and four language skills are defined with descriptors and '
      + 'thresholds. The mapping from assessments to competencies is empty, and the '
      + 'framework volume is exactly the book that must not be published without it.',
  }),

  // ── Institutional ─────────────────────────────────────────────────
  t({
    n: 24, family: 'WEC Institutional Series', wave: 1,
    name: 'The Prospectus',
    audience: 'Prospective learners and their sponsors',
    needs: [need('modules', 'modules', 60), need('award definitions', 'awardDefinitions', 6)],
    source: 'The programme, the awards, the fees and the admissions route, held to the same '
      + 'claim standard as the website — which is checked, in both languages, by a test.',
  }),
  t({
    n: 25, family: 'WEC Governance Series', wave: 2,
    name: 'The Academic Regulations',
    audience: 'Learners, staff, external reviewers',
    governance: 'Regulations bind. They are made by a body with the standing to make them, '
      + 'and both academic bodies are established with nought members appointed. The text '
      + 'can be drafted; it cannot be published as regulations until somebody can adopt it.',
    source: 'The rubric policy, the progression thresholds, the academic calendar and the '
      + 'assessment design are already written and consistent.',
  }),
  t({
    n: 26, family: 'WEC Institutional Series', wave: 4,
    name: 'The Annual Report',
    audience: 'Sponsors, partners, public record',
    governance: 'No academic year has been completed, no learner is enrolled, no award has '
      + 'been issued and no accounts have been audited. An annual report is a record of a '
      + 'year that happened.',
    source: 'The platform records enrolments, progress, time on task and awards, so the '
      + 'reporting instrument exists before the year it would report on.',
  }),
  t({
    n: 27, family: 'WEC Institutional Series', wave: 4,
    name: 'The Alumni Review',
    audience: 'Graduates; the six alumni chapters',
    governance: 'Six chapters are defined; nought officers have been elected and nought '
      + 'awards issued. A publication addressed to alumni requires alumni.',
    source: 'The chapter architecture, the award titles and the post-nominals are settled.',
  }),
  t({
    n: 28, family: 'WEC Governance Series', wave: 1,
    name: 'WEC Press — The Publishing Constitution',
    audience: 'Everyone who will ever produce a publication for the College',
    artefact: 'publication/WEC Press — The Publishing Constitution.pdf', build: 'press',
    htmlSource: 'publication/.press.html',
    source: 'Twenty-three constitutions, this catalogue, and the house visual identity, each '
      + 'clause declaring whether a test enforces it.',
  }),
  t({
    n: 29, family: 'WEC Governance Series', wave: 1,
    name: 'IEFC Production Specifications',
    audience: 'Printers, binders, production suppliers',
    artefact: 'publication/IEFC Production Specifications.pdf', build: 'curriculum',
    htmlSource: 'publication/.specs.html',
    source: 'Trim, stock, ink limits, finishing, the asset inventory and the production '
      + 'checklist for the flagship.',
  }),
  t({
    n: 30, family: 'WEC Governance Series', wave: 1,
    name: 'The Internal Editorial Bible', edition: 'Internal — not for distribution',
    audience: 'The editorial function only',
    artefact: 'publication/IEFC Internal Editorial Bible.pdf', build: 'curriculum',
    htmlSource: 'publication/.bible.html',
    source: 'What was executed, what remains, who owns each remaining item, and the final '
      + 'publication audit under eighteen headings.',
  }),

  // ── New programmes ────────────────────────────────────────────────
  t({
    n: 31, family: 'WEC New Programmes Series', wave: 3,
    name: 'English for Business', edition: 'A series',
    audience: 'Professionals; corporate clients',
    needs: [need('modules written as business English', 'businessModules', 20)],
    source: 'One module is business English — Level VI, Module 3: Global Business Strategy — '
      + 'and it sits at C2. Work, careers, meetings and negotiation appear elsewhere as topics '
      + 'inside general English. Topics are not a syllabus, and a series needs one at every '
      + 'level, not one at the top.',
  }),
  t({
    n: 32, family: 'WEC New Programmes Series', wave: 3,
    name: 'Executive English', edition: 'Intensive, short-form',
    audience: 'Senior professionals with little time',
    needs: [need('modules written for executive delivery', 'executiveModules', 12)],
    source: 'One module touches executive communication — Level VI, Module 1: Mastery '
      + 'Diagnostic & Executive Leadership. An intensive executive programme is a different '
      + 'design at every level — entry, hours, assessment, outcome — not a compression of '
      + 'this one.',
  }),
  t({
    n: 33, family: 'WEC New Programmes Series', wave: 3,
    name: 'English for Young Learners', edition: 'A series',
    audience: 'Children and their teachers',
    governance: 'The College admits adults. Publishing for children changes the admissions '
      + 'policy, the safeguarding obligations and the legal position on data — decisions no '
      + 'editorial function may take on the institution’s behalf.',
    source: 'Nothing in the curriculum is written for children, and none of it could be '
      + 'adapted without the decisions above being taken first.',
  }),
  t({
    n: 34, family: 'WEC New Programmes Series', wave: 3,
    name: 'English for Academic Purposes', edition: 'Pre-sessional and in-sessional',
    audience: 'Learners entering English-medium universities',
    needs: [need('modules devoted to academic writing or research', 'academicWritingModules', 10)],
    source: '25 lessons across five academic-writing and research modules. A pre-sessional '
      + 'programme needs roughly twice that, plus seminar skills and source handling.',
  }),
  t({
    n: 35, family: 'WEC New Programmes Series', wave: 3,
    name: 'In-Company Training Materials', edition: 'Contract-specific',
    audience: 'Corporate accounts',
    governance: 'The platform supports corporate accounts and seats. No contract has been '
      + 'signed, and materials written for a named client cannot be designed before the '
      + 'client and the brief exist.',
    source: 'The seat and account model is built; the publishing question is downstream of a '
      + 'commercial one.',
  }),

  // ── Scholarly ─────────────────────────────────────────────────────
  t({
    n: 36, family: 'WEC Research Series', wave: 4,
    name: 'The WEC Journal of English Language Education',
    audience: 'The field',
    governance: 'A journal requires an editorial board, named peer reviewers, an ISSN from '
      + 'the national centre, a submissions and ethics policy, and an archiving arrangement. '
      + 'The College holds none of these, and a journal without peer review is a newsletter '
      + 'with a misleading name.',
    source: 'Nothing yet. The Press can specify the format and the review workflow in '
      + 'advance; it cannot constitute a board.',
  }),
  t({
    n: 37, family: 'WEC Research Series', wave: 4,
    name: 'Conference Proceedings',
    audience: 'Delegates and the field',
    governance: 'No conference has been held. Proceedings are a record of one.',
    source: 'Nothing, and nothing that could stand in for it. Proceedings are the papers '
      + 'delegates presented; there are no delegates, no papers and no programme committee.',
  }),
  t({
    n: 38, family: 'WEC Research Series', wave: 3,
    name: 'Research Monographs', edition: 'An occasional series',
    audience: 'Researchers in language education',
    needs: [need('completed research papers', 'researchPapers', 3)],
    source: 'Nothing written. The curriculum’s design decisions are documented well enough '
      + 'to support research, but documentation is not research.',
  }),

  // ── Digital, and two further editions of the curriculum ───────────
  t({
    n: 39, family: 'IEFC Student Series', wave: 1,
    name: 'The IEFC Digital Edition', edition: 'Reflowable, accessible',
    audience: 'Screen and assistive-technology readers',
    needs: [need('modules', 'modules', 60), need('lesson-to-lesson cross-references', 'crossRefs', 114)],
    source: 'The same model, output as structured, reflowable text with the cross-references '
      + 'live rather than printed. The print edition is already tagged and outlined.',
  }),
  t({
    n: 40, family: 'IEFC Student Series', wave: 2,
    name: 'The IEFC Digital Companion', edition: 'Linked to the learning platform',
    audience: 'Enrolled learners',
    needs: [need('modules', 'modules', 60), need('module quizzes', 'quizzes', 60),
      need('pronunciation targets with guidance', 'pronunciationTargets', 120)],
    source: 'The platform already serves the curriculum, the quizzes and the pronunciation '
      + 'targets; the companion is the print apparatus made navigable. It ships without '
      + 'playable listening material until the recording decision at № 11 is taken — that '
      + 'is a stated limitation of the first release, not a reason to withhold it.',
  }),
  t({
    n: 41, family: 'WEC Institutional Series', wave: 2,
    name: 'The IEFC Presentation Edition', edition: 'Cloth, foiled, slipcased',
    audience: 'Ceremonial and diplomatic presentation',
    governance: 'The specification is complete — trim, stock, foil, emboss, binding and '
      + 'spine are all specified and the artwork is produced. What remains is a print budget, '
      + 'a binder and a proofing round: decisions and money, not design.',
    source: 'The production specification and the cover artwork, both already published.',
  }),
  t({
    n: 42, family: 'IEFC Student Series', wave: 2,
    name: 'The IEFC Curriculum in Arabic',
    audience: 'Arabic-speaking learners, staff and partners',
    needs: [need('curriculum items carrying Arabic text', 'arabicCurriculumItems', 294)],
    source: 'The public site is published in Arabic and held to the same claim standard. The '
      + 'curriculum itself is not translated — nought of 294 items carries Arabic text — and '
      + 'right-to-left typesetting has not been designed. Both are real work, and neither is '
      + 'a translation memory away.',
  }),
];

// ─────────────────────────────────────────────────────────────────────
// 3 · RESOLUTION
// ─────────────────────────────────────────────────────────────────────

/**
 * Resolve one title against the inventory. Nothing about the status is
 * declared: PUBLISHED comes from an artefact, GOVERNANCE from a named
 * blocker, and the difference between DERIVABLE and REQUIRES AUTHORING
 * is arithmetic on measured counts.
 */
export function resolve(title, INV) {
  const met = [];
  const short = [];
  for (const r of title.needs) {
    const have = INV[r.key] ?? 0;
    (have >= r.need ? met : short).push({ ...r, have, deficit: Math.max(0, r.need - have) });
  }
  let status;
  if (title.artefact) status = STATUS.PUBLISHED;
  else if (title.governance) status = STATUS.GOVERNANCE;
  else if (short.length) status = STATUS.AUTHORING;
  else status = STATUS.DERIVABLE;
  return { ...title, status, met, short };
}

export function catalogue(INV = inventory()) {
  return TITLES.map((x) => resolve(x, INV));
}

/** Counts by status, for the contents page rather than the appendix. */
export function statusCounts(rows = catalogue()) {
  return STATUS_ORDER.map((s) => [s, rows.filter((r) => r.status === s).length]);
}

/** The ten-year plan, grouped by wave with its titles resolved. */
export function plan(rows = catalogue()) {
  return WAVES.map((w) => ({ ...w, titles: rows.filter((r) => r.wave === w.n) }));
}

/**
 * Every family a title actually belongs to. The family definitions
 * themselves live in legacy.mjs; this is the list in use, so a family
 * defined and never used, or used and never defined, is visible.
 */
export const FAMILIES_IN_USE = [...new Set(TITLES.map((x) => x.family))];
