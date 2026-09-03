#!/usr/bin/env node
/**
 * PROVISION THE DATABASE — schema AND the curriculum that makes it a
 * college rather than six empty shelves.
 *
 * ────────────────────────────────────────────────────────────────────
 * THE DEFECT THIS SCRIPT EXISTS TO CLOSE
 * ────────────────────────────────────────────────────────────────────
 * Sixteen scripts in this repository load the six curriculum seed
 * files. Every publication renderer reads them. Every level page is
 * built from them. The competency wheel is drawn from them.
 *
 * The one command that provisioned the LIVE database did not:
 *
 *     "db:schema": "wrangler d1 execute wec-lc --remote --file=sql/schema.sql"
 *
 * sql/schema.sql seeds six rows into `courses` and nothing into `units`
 * or `learning_items`. So a College provisioned exactly as its own
 * package.json documented would have handed the first learner who paid
 * a programme page listing six levels and, inside every one of them,
 * nothing at all — while the printed curriculum on the same site ran to
 * three hundred pages.
 *
 * That is the failure the standing rule names: the curriculum existed,
 * the LMS existed, and nothing joined them on the one path that
 * mattered.
 *
 * ────────────────────────────────────────────────────────────────────
 * WHY A SCRIPT RATHER THAN A LONGER npm LINE
 * ────────────────────────────────────────────────────────────────────
 * Three reasons, and the third is the real one.
 *
 *   · Order matters. The seeds reference `courses` rows that
 *     schema.sql creates, so a shell one-liner that ran them in the
 *     wrong order would fail halfway with a foreign-key error and a
 *     half-loaded database.
 *   · A missing file must stop the run, not be skipped. `wrangler ...
 *     || true` chained six times loads whatever happens to be there.
 *   · A provisioning step that half-succeeds is worse than one that
 *     fails, because nobody looks again. This one verifies at the end
 *     that every level actually has modules behind it, and says so
 *     level by level.
 *
 * Usage:
 *     node scripts/provision-db.mjs --local     # the local D1
 *     node scripts/provision-db.mjs --remote    # the real one
 *
 * Neither is the default. Provisioning the wrong database is not a
 * mistake worth making convenient.
 */

import { spawnSync } from 'node:child_process';
import { existsSync, readFileSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
export const LEVELS = [1, 2, 3, 4, 5, 6];

/**
 * Every file this provisioning loads, in the order it must be loaded.
 * Exported because tests/provisioning.test.mjs asserts against this
 * list rather than against a copy of it — a second list would be a
 * second thing to forget.
 */
export const PROVISIONING_FILES = [
  'sql/schema.sql',
  ...LEVELS.map((n) => `sql/seed-curriculum-level-${n}.sql`),
];

/** What a provisioned database must actually contain, per level. */
export const EXPECTED_PER_LEVEL = { units: 10, quizzes: 10, assignments: 10 };

/* THE EXECUTABLE PART IS BEHIND A GUARD, so that
   tests/provisioning.test.mjs can import PROVISIONING_FILES from this
   file — the single list, rather than a second copy of it that could
   drift — without the import provisioning anything. An import that has
   side effects is an import nobody can safely make. */
function usage(message) {
  console.error(`${message}\n`);
  console.error('Usage: node scripts/provision-db.mjs --local | --remote');
  console.error('Neither is the default: provisioning the wrong database');
  console.error('is not a mistake worth making convenient.');
  process.exit(2);
}

function main() {
  const flags = process.argv.slice(2);
  const local = flags.includes('--local');
  const remote = flags.includes('--remote');
  if (local === remote) usage(local ? 'Pass one of --local or --remote, not both.' : 'Pass --local or --remote.');
  const target = local ? '--local' : '--remote';

  // Nothing is executed until every file is known to be there. A run that
  // loads the schema and then discovers seed four is missing has already
  // created the half-loaded database this script exists to prevent.
  const missing = PROVISIONING_FILES.filter((f) => !existsSync(join(ROOT, f)));
  if (missing.length) {
    console.error('These files are named by the provisioning and are not present:');
    for (const f of missing) console.error(`  ${f}`);
    console.error('\nNothing was executed.');
    process.exit(1);
  }

  console.log(`Provisioning the ${local ? 'LOCAL' : 'REMOTE'} database, ${PROVISIONING_FILES.length} files.\n`);

  for (const file of PROVISIONING_FILES) {
    const kb = Math.round(readFileSync(join(ROOT, file), 'utf8').length / 1024);
    process.stdout.write(`  ${file.padEnd(38)} ${String(kb).padStart(4)} KB … `);
    const r = spawnSync('npx', ['wrangler', 'd1', 'execute', 'wec-lc', target, `--file=${file}`], {
      cwd: ROOT, encoding: 'utf8',
    });
    if (r.status !== 0) {
      console.log('FAILED');
      console.error(`\n${(r.stderr || r.stdout || '').trim()}`);
      console.error(`\nStopped at ${file}. The database is part-loaded — fix the`);
      console.error('cause and re-run; every statement in these files is written');
      console.error('to be safe to apply again.');
      process.exit(1);
    }
    console.log('ok');
  }

  // ── And then it is checked, rather than assumed ──────────────────────
  //
  // The whole point of this script is that a provisioning step which
  // half-succeeds is worse than one that fails. So it asks the database
  // what it now holds, level by level, and exits non-zero if any level
  // came out empty.
  console.log('\nWhat the database now holds:\n');
  const probe = spawnSync('npx', ['wrangler', 'd1', 'execute', 'wec-lc', target, '--json', '--command',
    `SELECT c.level_id AS level,
            COUNT(DISTINCT u.id) AS units,
            SUM(CASE WHEN li.kind = 'quiz' THEN 1 ELSE 0 END) AS quizzes,
            SUM(CASE WHEN li.kind = 'assignment' THEN 1 ELSE 0 END) AS assignments
       FROM courses c
       LEFT JOIN units u ON u.course_id = c.id
       LEFT JOIN learning_items li ON li.unit_id = u.id
      GROUP BY c.level_id ORDER BY c.level_id`], { cwd: ROOT, encoding: 'utf8' });

  if (probe.status !== 0) {
    console.error('The load succeeded but the verification query did not run:');
    console.error((probe.stderr || probe.stdout || '').trim());
    console.error('\nCheck the database by hand before opening enrolment.');
    process.exit(1);
  }

  let rows = [];
  try {
    const parsed = JSON.parse(probe.stdout);
    rows = (Array.isArray(parsed) ? parsed[0].results : parsed.results) || [];
  } catch {
    console.error('Could not read the verification result. Check by hand.');
    process.exit(1);
  }

  let empty = 0;
  for (const r of rows) {
    const ok = r.units >= EXPECTED_PER_LEVEL.units;
    if (!ok) empty += 1;
    console.log(`  Level ${r.level}: ${String(r.units).padStart(3)} modules, `
      + `${String(r.quizzes || 0).padStart(3)} quizzes, ${String(r.assignments || 0).padStart(3)} assignments`
      + (ok ? '' : '   ← EMPTY'));
  }

  if (rows.length !== LEVELS.length || empty) {
    console.error(`\n${empty || 'Some'} level(s) have no modules behind them. Do not open`);
    console.error('enrolment against this database — a learner who paid would');
    console.error('be handed an empty programme.');
    process.exit(1);
  }

  console.log('\nEvery level has its modules. The examination papers are a separate,');
  console.log('deliberate act: they are authored and published by the Registrar at');
  console.log('/staff-papers.html, because a paper is an academic decision and not');
  console.log('a fixture. Until one is published for a level, learners can study it');
  console.log('but cannot sit it.');

}

// Executed, not imported.
if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) main();
