/**
 * THE CANONICAL SOURCE for the IEFC flagship publication.
 *
 * One model, read by every renderer, so the DOCX and the PDF cannot
 * disagree. The PDF is produced FROM the DOCX by LibreOffice rather
 * than from a second layout engine — two renderers reading one model
 * would still be two chances to diverge, and the brief requires they
 * match perfectly.
 *
 * ────────────────────────────────────────────────────────────────────
 * WHAT THIS FILE WILL NOT DO
 * ────────────────────────────────────────────────────────────────────
 * Everything here is read from the database or transcribed from an
 * approved institutional document. Nothing is composed to fill a
 * heading.
 *
 * The publication brief lists a Foreword, a Presidential Message and an
 * Academic Senate Message. Those are signed statements by named people.
 * The College has no named President, and the Academic Senate and BASCE
 * are established but NOT constituted — no members have been appointed.
 * Writing those sections would mean inventing the words of officers who
 * do not exist, which is the one thing this project has refused
 * throughout. They are omitted, and the Editorial Note says so and why.
 *
 * The same rule governs the curriculum chapters. The public site states
 * 120 learning units per level; the platform holds 49. The publication
 * reports what exists — sixty modules, complete across six levels — and
 * states the lesson-level position plainly rather than repeating a
 * figure the College cannot currently evidence.
 */
import { readFileSync } from 'node:fs';
import { DatabaseSync } from 'node:sqlite';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..');

export function openDatabase() {
  const db = new DatabaseSync(':memory:');
  db.exec(readFileSync(`${ROOT}/sql/schema.sql`, 'utf8'));
  for (let n = 1; n <= 6; n++) {
    db.exec(readFileSync(`${ROOT}/sql/seed-curriculum-level-${n}.sql`, 'utf8'));
  }
  return db;
}

const flatten = (s) => s.replace(/\*\*/g, '').replace(/\*/g, '').replace(/\s+/g, ' ').trim();

/** Overview and can-do statements per level, transcribed from the framework. */
function levelProse() {
  const fw = readFileSync(`${ROOT}/docs/curriculum-framework.md`, 'utf8');
  const out = {};
  ['I', 'II', 'III', 'IV', 'V', 'VI'].forEach((roman, i) => {
    // Split rather than lookahead-to-end: JavaScript has no \Z, so a
    // (?=^## Level |\Z) alternation silently fails on the LAST level —
    // it found five sections and threw on Level VI.
    const sections = fw.split(/^## Level /m);
    const body = sections.find((x) => x.startsWith(roman + ' '));
    if (!body) throw new Error(`no framework section for Level ${roman}`);
    const o = body.match(/\*\*Overview\.\*\* ([\s\S]+?)(?=\n\n)/);
    const c = body.match(/\*\*Learning objectives \(can-do\)\.\*\* ([\s\S]+?)(?=\n\n)/);
    if (!o || !c) throw new Error(`Level ${roman} is missing Overview or can-do statements`);
    out[i + 1] = { overview: flatten(o[1]), canDo: flatten(c[1]) };
  });
  return out;
}

export function build() {
  const db = openDatabase();
  const all = (sql, ...b) => db.prepare(sql).all(...b);
  const one = (sql, ...b) => db.prepare(sql).get(...b);
  const prose = levelProse();

  // ---- The qualification's own definition, and what supports it -----
  const programme = one('SELECT * FROM programme_definition WHERE code = ?', 'IEFC');
  const claims = all(
    'SELECT code, claim, state, evidence, shortfall FROM programme_claims ORDER BY sequence');

  // ---- Structure -----------------------------------------------------
  const levels = all(`
    SELECT l.id, l.roman, l.name, l.cefr, l.duration_months AS months, l.units AS publishedUnits,
           d.official_title AS awardTitle, d.post_nominal AS postNominal, d.standing,
           d.academic_purpose AS purpose, d.graduate_profile AS graduateProfile,
           d.learning_outcomes AS learningOutcomes
      FROM programme_levels l
      LEFT JOIN award_definitions d ON d.level_id = l.id
     ORDER BY l.id`);

  for (const lv of levels) {
    lv.modules = all(`
      SELECT u.sequence, u.title
        FROM units u JOIN courses c ON c.id = u.course_id
       WHERE c.level_id = ? ORDER BY u.sequence`, lv.id);
    lv.itemCounts = all(`
      SELECT i.kind, COUNT(*) AS n
        FROM learning_items i JOIN units u ON u.id = i.unit_id JOIN courses c ON c.id = u.course_id
       WHERE c.level_id = ? GROUP BY i.kind ORDER BY i.kind`, lv.id);
    lv.overview = prose[lv.id].overview;
    lv.canDo = prose[lv.id].canDo;
  }

  // ---- Frameworks ----------------------------------------------------
  const competencies = all('SELECT code, name, description FROM competencies ORDER BY sequence');
  const skills = all('SELECT code, name, mode, description FROM language_skills ORDER BY sequence');
  const descriptors = all(
    'SELECT code, name, description, threshold_min AS thresholdMin FROM skill_descriptors ORDER BY sequence');
  const bodies = all('SELECT code, name, remit, established_on AS establishedOn, members_appointed AS members FROM academic_bodies ORDER BY code');
  const chapters = all(`
    SELECT c.name, c.award_title AS awardTitle, c.post_nominal AS postNominal, c.description,
           c.officers_elected AS officersElected, l.roman
      FROM alumni_chapters c JOIN programme_levels l ON l.id = c.level_id ORDER BY c.level_id`);

  // ---- The measured position, not the intended one -------------------
  const totals = {
    levels: levels.length,
    modules: one('SELECT COUNT(*) AS n FROM units').n,
    learningItems: one('SELECT COUNT(*) AS n FROM learning_items').n,
    quizQuestions: one('SELECT COUNT(*) AS n FROM quiz_questions').n,
    assignments: one("SELECT COUNT(*) AS n FROM learning_items WHERE kind = 'assignment'").n,
    quizzes: one("SELECT COUNT(*) AS n FROM learning_items WHERE kind = 'quiz'").n,
    readings: one("SELECT COUNT(*) AS n FROM learning_items WHERE kind = 'reading'").n,
    competenciesMapped: one('SELECT COUNT(*) AS n FROM assessment_competencies').n,
    skillsMapped: one('SELECT COUNT(*) AS n FROM assessment_skills').n,
  };

  // The discrepancy this publication must not repeat. Computed rather
  // than asserted, so it stays true as the curriculum grows.
  const publishedPerLevel = levels[0].publishedUnits;
  totals.publishedUnitsPerLevel = publishedPerLevel;
  totals.publishedUnitsTotal = publishedPerLevel * levels.length;
  totals.itemsPerLevel = Math.round(totals.learningItems / levels.length);

  db.close();

  return {
    generatedFrom: 'sql/schema.sql + sql/seed-curriculum-level-1..6.sql + docs/curriculum-framework.md '
      + '+ docs/iefc-award-architecture.md + docs/governance-decisions.md',
    programme,
    claims,
    levels,
    competencies,
    skills,
    descriptors,
    bodies,
    chapters,
    totals,
  };
}
