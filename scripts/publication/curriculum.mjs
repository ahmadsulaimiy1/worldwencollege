/**
 * THE CURRICULUM ITSELF — every lesson, every question, every rubric,
 * pulled whole from the academic database and parsed into typed blocks
 * so it can be TYPESET rather than dumped.
 *
 * ────────────────────────────────────────────────────────────────────
 * WHY THIS FILE EXISTS
 * ────────────────────────────────────────────────────────────────────
 * The first edition of this publication described the curriculum. It
 * printed counts, frameworks and architecture while ninety-three
 * thousand words of authored lesson content sat in the database
 * unprinted — objectives, model dialogues, staged practice with
 * timings, rubrics, answer keys. A teacher could not have taught from
 * it. That was the defect, and this file is the correction.
 *
 * Every lesson body is printed in full and verbatim. Nothing is
 * summarised, and nothing is generated to fill a gap: if a lesson has
 * no listening activity, the publication has no listening activity for
 * that lesson.
 *
 * ────────────────────────────────────────────────────────────────────
 * PARSING RATHER THAN PRINTING
 * ────────────────────────────────────────────────────────────────────
 * The bodies are written in a consistent house structure — LEARNING
 * OBJECTIVES, WARM-UP (5 min), PRESENTATION (10 min), and so on. Set as
 * one grey slab of prose that structure is invisible and the pages are
 * unreadable. Parsed, every stage can carry its own typography: a
 * timing badge, a dialogue set as dialogue, a rubric set as a table.
 *
 * The parser is deliberately conservative. Anything it does not
 * recognise is passed through as prose rather than dropped, and
 * tests/publication.test.mjs asserts that the printed text still
 * contains every lesson body verbatim — so a parsing bug can never
 * silently lose curriculum.
 */
import { readFileSync } from 'node:fs';
import { DatabaseSync } from 'node:sqlite';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..');

// Section heads that carry a stage of the lesson, in the order the
// house style uses them. Anything not listed still prints — this only
// decides which get a distinguishing treatment.
const STAGE_ICONS = {
  'LEARNING OBJECTIVES': 'objectives',
  'PREREQUISITE KNOWLEDGE': 'prereq',
  'WARM-UP': 'warmup',
  PRESENTATION: 'present',
  'PRESENTATION/CONSOLIDATION': 'present',
  'GUIDED PRACTICE': 'guided',
  'INDEPENDENT PRACTICE': 'independent',
  'INDEPENDENT PRACTICE / SPEAKING ACTIVITY': 'speaking',
  'SPEAKING ACTIVITY': 'speaking',
  'LISTENING ACTIVITY': 'listening',
  'READING ACTIVITY': 'reading',
  'WRITING TASK': 'writing',
  'PRONUNCIATION PRACTICE': 'pronunciation',
  'VOCABULARY REINFORCEMENT': 'vocabulary',
  'KEY VOCABULARY': 'vocabulary',
  'KEY PHRASES': 'vocabulary',
  'PHRASAL VERBS & COLLOCATIONS': 'vocabulary',
  'COLLOCATIONS THIS MODULE': 'vocabulary',
  'DISCOURSE MARKERS': 'vocabulary',
  'FORMATIVE ASSESSMENT': 'assess',
  'CRITICAL THINKING / DISCUSSION PROMPT': 'thinking',
  'GRADING RUBRIC': 'rubric',
  INSTRUCTIONS: 'instructions',
  HOMEWORK: 'homework',
  EXTENSION: 'extension',
  REVISION: 'revision',
};

const HEAD_RE = /^([A-Z][A-Z \/&'()0-9,.-]{2,70}?)(\s*\(([^)]*)\))?:\s*/;

/**
 * Split a lesson body into its stages.
 *
 * Returns [{ head, timing, icon, parts }] where `parts` are typed:
 * dialogue lines, numbered or bulleted items, and prose. A body with no
 * recognised heads comes back as a single untitled prose stage rather
 * than as nothing.
 */
export function parseLesson(body) {
  if (!body || !body.trim()) return [];
  // Paragraph boundaries in the source are blank lines; single newlines
  // inside a stage are meaningful (dialogue turns, list items).
  const chunks = body.split(/\n\s*\n/).map((c) => c.trim()).filter(Boolean);
  const stages = [];

  for (const chunk of chunks) {
    const m = chunk.match(HEAD_RE);
    if (m) {
      stages.push({
        head: m[1].trim(),
        timing: m[3] ? m[3].trim() : null,
        icon: STAGE_ICONS[m[1].trim()] || null,
        parts: classify(chunk.slice(m[0].length)),
      });
    } else if (stages.length) {
      // A continuation of the stage above.
      stages[stages.length - 1].parts.push(...classify(chunk));
    } else {
      stages.push({ head: null, timing: null, icon: null, parts: classify(chunk) });
    }
  }
  return stages;
}

function classify(text) {
  const lines = text.split('\n').map((l) => l.trim()).filter(Boolean);
  const parts = [];
  let buffer = [];

  const flush = () => {
    if (buffer.length) { parts.push({ type: 'prose', text: buffer.join(' ') }); buffer = []; }
  };

  for (const line of lines) {
    // A model dialogue turn: "A: Hello!" — the single most valuable
    // thing on a language-teaching page, and unreadable run into prose.
    const dlg = line.match(/^([A-Z][A-Za-z]{0,14}):\s+(.+)$/);
    // A numbered or lettered practice item.
    const num = line.match(/^(\d{1,2}[.)]|\([a-z0-9]\)|[-–•])\s+(.+)$/);
    if (dlg && !STAGE_ICONS[dlg[1].toUpperCase()]) {
      flush();
      parts.push({ type: 'dialogue', speaker: dlg[1], text: dlg[2] });
    } else if (num) {
      flush();
      parts.push({ type: 'item', marker: num[1].replace(/[.)]$/, ''), text: num[2] });
    } else {
      buffer.push(line);
    }
  }
  flush();
  return parts;
}

export function buildCurriculum() {
  const db = new DatabaseSync(':memory:');
  db.exec(readFileSync(`${ROOT}/sql/schema.sql`, 'utf8'));
  for (let n = 1; n <= 6; n++) {
    db.exec(readFileSync(`${ROOT}/sql/seed-curriculum-level-${n}.sql`, 'utf8'));
  }
  const all = (sql, ...b) => db.prepare(sql).all(...b);

  const levels = all(`
    SELECT l.id, l.roman, l.name, l.cefr, l.duration_months AS months,
           d.official_title AS awardTitle, d.post_nominal AS postNominal, d.standing,
           d.academic_purpose AS purpose, d.graduate_profile AS graduateProfile
      FROM programme_levels l LEFT JOIN award_definitions d ON d.level_id = l.id
     ORDER BY l.id`);

  for (const lv of levels) {
    lv.modules = all(`
      SELECT u.id, u.sequence, u.title
        FROM units u JOIN courses c ON c.id = u.course_id
       WHERE c.level_id = ? ORDER BY u.sequence`, lv.id);

    for (const mod of lv.modules) {
      mod.lessons = all(`
        SELECT id, sequence, kind, title, body
          FROM learning_items WHERE unit_id = ? ORDER BY sequence`, mod.id)
        .map((it) => ({
          ...it,
          stages: parseLesson(it.body),
          questions: it.kind !== 'quiz' ? [] : all(`
            SELECT sequence, prompt, choices_json AS choicesJson, correct_index AS correctIndex
              FROM quiz_questions WHERE learning_item_id = ? ORDER BY sequence`, it.id)
            .map((q) => ({
              sequence: q.sequence,
              prompt: q.prompt,
              choices: JSON.parse(q.choicesJson || '[]'),
              correctIndex: q.correctIndex,
            })),
        }));
      mod.lessonCount = mod.lessons.length;
    }
  }

  const totals = {
    levels: levels.length,
    modules: levels.reduce((a, l) => a + l.modules.length, 0),
    lessons: levels.reduce((a, l) => a + l.modules.reduce((b, m) => b + m.lessons.length, 0), 0),
    questions: levels.reduce((a, l) => a + l.modules.reduce((b, m) =>
      b + m.lessons.reduce((c, x) => c + x.questions.length, 0), 0), 0),
    bodyWords: levels.reduce((a, l) => a + l.modules.reduce((b, m) =>
      b + m.lessons.reduce((c, x) => c + (x.body || '').split(/\s+/).filter(Boolean).length, 0), 0), 0),
  };

  db.close();
  return { levels, totals };
}
