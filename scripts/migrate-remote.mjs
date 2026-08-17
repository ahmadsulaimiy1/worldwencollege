// Applies pending migrations to a real D1 database via wrangler.
//
//   node scripts/migrate-remote.mjs --remote        (production)
//   node scripts/migrate-remote.mjs --local         (local dev database)
//   node scripts/migrate-remote.mjs --remote --dry-run
//
// The decision-making lives in scripts/migrate.mjs, which is driven by
// tests against a real SQLite engine. This file is only the plumbing
// that turns those decisions into `wrangler d1 execute` calls — kept
// separate precisely so the part that can get the logic wrong is the
// part under test.
import { spawnSync } from 'node:child_process';
import { writeFileSync, mkdtempSync } from 'node:fs';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { runMigrations } from './migrate.mjs';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const DB = process.env.D1_DATABASE_NAME || 'aipc';
const target = process.argv.includes('--local') ? '--local' : '--remote';
const dryRun = process.argv.includes('--dry-run');
const scratch = mkdtempSync(path.join(tmpdir(), 'aipc-migrate-'));

function wrangler(args) {
  const res = spawnSync('npx', ['wrangler', 'd1', 'execute', DB, target, '--yes', ...args], {
    cwd: ROOT, encoding: 'utf8', maxBuffer: 32 * 1024 * 1024,
  });
  if (res.status !== 0) {
    throw new Error(`wrangler failed (${res.status}):\n${res.stderr || res.stdout}`);
  }
  return res.stdout || '';
}

// Multi-statement SQL goes through --file: --command is a single
// statement, and a migration is never one statement.
async function exec(sql) {
  if (dryRun) { console.log(`[dry-run] would execute:\n${sql.slice(0, 200)}…\n`); return; }
  const f = path.join(scratch, `stmt-${Date.now()}-${Math.random().toString(36).slice(2)}.sql`);
  writeFileSync(f, sql);
  wrangler([`--file=${f}`]);
}

async function query(sql) {
  const out = wrangler(['--json', `--command=${sql}`]);
  // wrangler prints a JSON array of result objects, sometimes preceded
  // by human-readable lines. Take the first bracketed value rather than
  // assuming the whole of stdout parses.
  const start = out.indexOf('[');
  if (start === -1) return [];
  let parsed;
  try { parsed = JSON.parse(out.slice(start)); } catch { return []; }
  const first = Array.isArray(parsed) ? parsed[0] : parsed;
  return (first && first.results) || [];
}

// A ledger read against a database that has no ledger yet must not look
// like "no migrations recorded" if the real cause was a broken
// connection — that would baseline or re-apply everything. exec() of the
// CREATE TABLE IF NOT EXISTS runs first inside runMigrations(), so by
// the time query() is called the table exists; a throw here is a real
// failure and is left to propagate.
const outcome = await runMigrations({
  exec,
  query,
  log: (m) => console.log(m),
  dir: path.join(ROOT, 'sql/migrations'),
  now: new Date().toISOString(),
});

console.log('');
console.log(`Applied:          ${outcome.applied.length ? outcome.applied.join(', ') : 'none'}`);
console.log(`Baselined:        ${outcome.baselined.length ? outcome.baselined.join(', ') : 'none'}`);
console.log(`Already recorded: ${outcome.alreadyRecorded.length ? outcome.alreadyRecorded.join(', ') : 'none'}`);

if (process.env.GITHUB_STEP_SUMMARY) {
  const line = outcome.applied.length
    ? `Applied migration(s): ${outcome.applied.join(', ')}.`
    : 'No migrations needed — the database was already up to date.';
  const extra = outcome.baselined.length
    ? ` Recorded as already-present without running: ${outcome.baselined.join(', ')}.`
    : '';
  writeFileSync(process.env.GITHUB_STEP_SUMMARY, `\n**Migrations.** ${line}${extra}\n`, { flag: 'a' });
}
