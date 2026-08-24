// PROVISIONING — a database set up the way this repository documents
// must hand a learner an actual programme.
//
// ─────────────────────────────────────────────────────────────────────
// THE DEFECT THIS FILE EXISTS TO PREVENT COMING BACK
// ─────────────────────────────────────────────────────────────────────
// Sixteen scripts here load the six curriculum seed files. Every
// publication renderer reads them, every level page is built from them,
// the competency wheel is drawn from them. The one command that
// provisioned the live database — `npm run db:schema` — loaded
// sql/schema.sql alone, and sql/schema.sql seeds six rows into
// `courses` and nothing into `units` or `learning_items`.
//
// So the College could be provisioned exactly as its own package.json
// said, pass every one of its 5,313 assertions, and hand the first
// learner who paid a programme page listing six levels with nothing
// inside any of them — while the printed curriculum on the same site
// ran to three hundred pages.
//
// Nothing caught it because every test that needed coursework seeded
// its own. tests/acceptance-journey.test.mjs writes ten modules before
// its learner sits anything; tests/conferral.test.mjs does the same.
// A fixture that supplies the missing thing is a fixture that hides it.
//
// ─────────────────────────────────────────────────────────────────────
// SO THIS FILE SEEDS NOTHING
// ─────────────────────────────────────────────────────────────────────
// It builds a database from exactly the files scripts/provision-db.mjs
// names, in exactly that order, and then asks the questions a learner's
// first five minutes would ask. If provisioning stops loading the
// curriculum, or a seed file goes missing, or a level loses its
// modules, this is the file that fails.

import { readFileSync, existsSync, readdirSync, statSync } from 'node:fs';
import path from 'node:path';
import { makeD1 } from './d1-shim.mjs';
import { ROOT, loadUrl } from './helpers.mjs';

let pass = 0, fail = 0;
const check = (label, cond, detail) => {
  console.log((cond ? 'PASS ' : 'FAIL ') + label + (cond || detail === undefined ? '' : ` — ${detail}`));
  cond ? pass++ : fail++;
};

const { PROVISIONING_FILES, LEVELS, EXPECTED_PER_LEVEL } =
  await import(loadUrl('scripts/provision-db.mjs'));

// =====================================================================
// 1 · THE DOCUMENTED PATH LOADS THE CURRICULUM
// =====================================================================
const pkg = JSON.parse(readFileSync(path.join(ROOT, 'package.json'), 'utf8'));

check('there is a provisioning command, and it is not the schema alone',
  typeof pkg.scripts['db:provision'] === 'string'
  && pkg.scripts['db:provision'].includes('provision-db.mjs'),
  pkg.scripts['db:provision']);
check('...with a local counterpart, so nobody provisions the real database to try it',
  typeof pkg.scripts['db:provision:local'] === 'string'
  && pkg.scripts['db:provision:local'].includes('--local'),
  pkg.scripts['db:provision:local']);

check('provisioning loads the schema and all six curriculum seeds',
  PROVISIONING_FILES.length === 7 && PROVISIONING_FILES[0] === 'sql/schema.sql'
  && LEVELS.every((n) => PROVISIONING_FILES.includes(`sql/seed-curriculum-level-${n}.sql`)),
  PROVISIONING_FILES.join(', '));
check('...schema first, because the seeds reference the courses it creates',
  PROVISIONING_FILES.indexOf('sql/schema.sql') === 0);
check('...and every file it names is present',
  PROVISIONING_FILES.every((f) => existsSync(path.join(ROOT, f))),
  PROVISIONING_FILES.filter((f) => !existsSync(path.join(ROOT, f))).join(', ') || 'all present');

// The curriculum documents name these files by path, repeatedly, and a
// named file that is not there is a broken promise in a document a
// tutor is asked to teach from.
{
  const named = new Set();
  (function walk(dir) {
    for (const e of readdirSync(dir)) {
      const p = path.join(dir, e);
      if (statSync(p).isDirectory()) { walk(p); continue; }
      if (!e.endsWith('.md')) continue;
      for (const m of readFileSync(p, 'utf8').matchAll(/sql\/seed-curriculum-level-\d\.sql/g)) named.add(m[0]);
    }
  })(path.join(ROOT, 'docs', 'curriculum'));
  check('every seed file the curriculum documents name by path exists',
    named.size > 0 && [...named].every((f) => existsSync(path.join(ROOT, f))),
    [...named].filter((f) => !existsSync(path.join(ROOT, f))).join(', ') || `${named.size} named, all present`);
}

// =====================================================================
// 2 · WHAT THAT DATABASE ACTUALLY HOLDS
// =====================================================================
//
// Built from the provisioning list itself, so it cannot drift from it.
let sql = '';
for (const f of PROVISIONING_FILES) sql += readFileSync(path.join(ROOT, f), 'utf8') + '\n';
const env = { DB: makeD1(sql) };
const one = (s, ...a) => env.DB.prepare(s).bind(...a).first();
const all = (s, ...a) => env.DB.prepare(s).bind(...a).all().results;

const perLevel = all(`
  SELECT c.level_id AS level,
         COUNT(DISTINCT u.id) AS units,
         SUM(CASE WHEN li.kind = 'quiz' THEN 1 ELSE 0 END) AS quizzes,
         SUM(CASE WHEN li.kind = 'assignment' THEN 1 ELSE 0 END) AS assignments,
         SUM(CASE WHEN li.kind = 'reading' THEN 1 ELSE 0 END) AS readings
    FROM courses c
    LEFT JOIN units u ON u.course_id = c.id
    LEFT JOIN learning_items li ON li.unit_id = u.id
   GROUP BY c.level_id ORDER BY c.level_id`);

check('all six levels exist as courses', perLevel.length === 6, `${perLevel.length} levels`);
check('...and NO level is an empty shell',
  perLevel.every((r) => r.units >= EXPECTED_PER_LEVEL.units),
  perLevel.map((r) => `L${r.level}:${r.units}`).join(' '));
check('...each with its quizzes',
  perLevel.every((r) => r.quizzes >= EXPECTED_PER_LEVEL.quizzes),
  perLevel.map((r) => `L${r.level}:${r.quizzes}`).join(' '));
check('...each with its assignments',
  perLevel.every((r) => r.assignments >= EXPECTED_PER_LEVEL.assignments),
  perLevel.map((r) => `L${r.level}:${r.assignments}`).join(' '));
check('...and reading matter to study before being assessed on it',
  perLevel.every((r) => r.readings > 0),
  perLevel.map((r) => `L${r.level}:${r.readings}`).join(' '));

// A quiz with no questions is a door that opens onto a wall.
const emptyQuizzes = all(`
  SELECT li.id, li.title FROM learning_items li
   WHERE li.kind = 'quiz'
     AND NOT EXISTS (SELECT 1 FROM quiz_questions q WHERE q.learning_item_id = li.id)`);
check('every quiz has questions behind it',
  emptyQuizzes.length === 0,
  emptyQuizzes.slice(0, 4).map((q) => q.title).join(' | '));

// A reading with no text is the same fault wearing a different word.
const emptyReadings = all(`
  SELECT id, title FROM learning_items
   WHERE kind = 'reading' AND (body IS NULL OR TRIM(body) = '')`);
check('every reading has its text',
  emptyReadings.length === 0,
  emptyReadings.slice(0, 4).map((r) => r.title).join(' | '));

// Every answerable question needs a real answer key. The key here is
// `correct_index` into `choices_json` — so the fault to look for is not
// a missing row but an index that points past the end of its own
// choices, which is a question nobody can get right.
{
  const qs = all('SELECT id, prompt, choices_json, correct_index FROM quiz_questions');
  const broken = [];
  for (const q of qs) {
    let choices = null;
    try { choices = JSON.parse(q.choices_json); } catch { /* handled below */ }
    if (!Array.isArray(choices) || choices.length < 2
        || !Number.isInteger(q.correct_index)
        || q.correct_index < 0 || q.correct_index >= choices.length
        || choices.some((c) => String(c == null ? '' : c).trim() === '')) {
      broken.push(`${String(q.prompt).slice(0, 40)} → ${q.correct_index} of ${Array.isArray(choices) ? choices.length : '?'}`);
    }
  }
  check('every quiz question has choices and an answer key that points at one of them',
    qs.length > 0 && broken.length === 0,
    broken.slice(0, 3).join(' | ') || `${qs.length} questions checked`);
}

// =====================================================================
// 3 · AND A LEARNER WHO PAYS IS HANDED IT
// =====================================================================
//
// The question a fixture can never answer: not "is the content in the
// database" but "does the engine that answers a learner find it".
env.DB.prepare(`INSERT INTO users (id, auth_provider, auth_provider_id, email, email_verified, role, preferred_name)
                VALUES ('usr_first_day','clerk','sub_first_day','first@example.com',1,'student','A New Student')`).bind().run();
env.DB.prepare(`INSERT INTO enrolments (id, user_id, application_id, level_id, status, started_at)
                VALUES ('enr_first_day','usr_first_day',NULL,1,'active','2026-08-24T00:00:00Z')`).bind().run();

const { computeLearnerStanding } = await import(loadUrl('functions/_lib/academic/standing.js'));
const level = (await computeLearnerStanding(env, 'usr_first_day')).levels.find((l) => l.levelId === 1);

check('a learner enrolled on their first day is offered modules, not an empty page',
  level && level.modules.length >= EXPECTED_PER_LEVEL.units,
  `${level ? level.modules.length : 'no level'} modules`);
check('...the first of which is a real, titled module',
  level && level.modules[0] && String(level.modules[0].title || '').trim().length > 3,
  level && level.modules[0] && level.modules[0].title);
check('...and every module the engine reports has components to complete',
  level && level.modules.every((m) => m.quiz && m.assignment),
  level && `${level.modules.filter((m) => m.quiz && m.assignment).length}/${level.modules.length} complete`);

// THE ONE THING THAT IS DELIBERATELY NOT PROVISIONED, asserted as
// deliberate rather than left to be discovered. An examination paper is
// an academic decision — authored and published by the Registrar at
// /staff-papers.html — and seeding one would be the platform setting
// its own standard. A learner can study a level on day one and cannot
// sit it until a person publishes the paper.
check('no examination paper is seeded, and that is the published arrangement',
  one('SELECT COUNT(*) n FROM examination_papers').n === 0
  && level.examination.paperPublished !== true,
  JSON.stringify({ papers: one('SELECT COUNT(*) n FROM examination_papers').n }));

console.log(`\n${pass} passed, ${fail} failed.`);
if (fail) process.exit(1);
