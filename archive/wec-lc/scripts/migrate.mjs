// Migration runner.
//
// The version this replaces was a shell loop that applied every file in
// sql/migrations/ unconditionally. That is not a migration runner: it
// works exactly once, on a database that has had none of them, and
// fails on every database that has had some. Ours had had two of three,
// so applying the third was impossible — `ALTER TABLE ADD COLUMN` from
// migration 001 would error on a duplicate column before 003 was
// reached, and the deploy would report a broken migration when the real
// problem was a runner that could not count.
//
// What it does now:
//
//   1. Ensures a `schema_migrations` ledger exists.
//   2. For each file not in the ledger, runs that file's PROBE — a
//      one-line query, declared in the file itself, answering "is this
//      migration's effect already present?".
//   3. Probe returns a row  -> record as `baseline`, do NOT run it.
//      Probe returns nothing -> run it, record as `applied`.
//
// The probe is what makes an existing database adoptable without
// anybody hand-editing a ledger, and it is declared by whoever writes
// the migration because they are the only person who knows what their
// migration produces.
//
// A migration with no probe is a hard error rather than an assumption.
// "Apply it and hope" is how the previous runner behaved, and the
// author of a migration should have to state how to tell whether it
// already ran.
//
// KNOWN LIMIT, stated rather than papered over. SQLite DDL is
// transactional per statement, not per file, so a migration can fail
// half way and leave the database in a state neither "applied" nor
// "clean".
//
// Each migration therefore creates its probe target LAST. That decides
// which way a partial failure breaks:
//
//   probe target FIRST  -> probe satisfied, runner records it as done,
//                          the rest of the migration is lost silently
//   probe target LAST   -> probe unsatisfied, runner retries the file,
//                          and the retry FAILS LOUDLY on whichever
//                          objects the first attempt did create
//
// The second is chosen deliberately, and it is not self-healing: it
// still needs a person to look at the database and finish or undo the
// half-applied file. It is chosen because a loud failure that stops the
// deploy is recoverable, and a silent "done" over a half-migrated
// production database is not.

import { readFileSync, readdirSync } from 'node:fs';
import path from 'node:path';

export const LEDGER_DDL = `CREATE TABLE IF NOT EXISTS schema_migrations (
  filename   TEXT PRIMARY KEY,
  applied_at TEXT NOT NULL,
  method     TEXT NOT NULL CHECK (method IN ('applied','baseline'))
)`;

const PROBE_RE = /^--\s*probe:\s*(.+)$/im;

export function readProbe(sql, filename) {
  const m = PROBE_RE.exec(sql);
  if (!m) {
    throw new Error(
      `${filename} declares no "-- probe:" line. Every migration must say how to tell whether it has already been applied — otherwise this runner can only guess, which is what it is here to stop.`,
    );
  }
  return m[1].trim().replace(/;+\s*$/, '');
}

export function migrationFiles(dir) {
  return readdirSync(dir).filter((f) => f.endsWith('.sql')).sort();
}

/**
 * @param {object} io
 * @param {(sql: string) => Promise<void>} io.exec    run SQL, no result needed
 * @param {(sql: string) => Promise<Array>} io.query  run SQL, return rows
 * @param {(msg: string) => void} [io.log]
 * @param {string} io.dir                             migrations directory
 * @param {string} io.now                             ISO timestamp for the ledger
 */
export async function runMigrations({ exec, query, log = () => {}, dir, now }) {
  await exec(LEDGER_DDL);

  const recorded = new Set(
    (await query('SELECT filename FROM schema_migrations')).map((r) => r.filename),
  );

  const outcome = { applied: [], baselined: [], alreadyRecorded: [] };

  for (const file of migrationFiles(dir)) {
    if (recorded.has(file)) {
      outcome.alreadyRecorded.push(file);
      log(`= ${file} — already recorded`);
      continue;
    }

    const full = path.join(dir, file);
    const sql = readFileSync(full, 'utf8');
    const probe = readProbe(sql, file);

    const present = (await query(probe)).length > 0;
    if (present) {
      // The effect is already in the database — this is a database that
      // predates the ledger, or one built from schema.sql, which carries
      // every migration's end state. Recording without running is the
      // only safe move: running would fail on a duplicate object.
      await exec(record(file, 'baseline', now));
      outcome.baselined.push(file);
      log(`~ ${file} — already present, recorded as baseline (not run)`);
      continue;
    }

    log(`+ ${file} — applying`);
    await exec(sql);
    await exec(record(file, 'applied', now));
    outcome.applied.push(file);
  }

  return outcome;
}

function record(filename, method, now) {
  // Values are filenames from our own directory listing and two fixed
  // literals, but quoting is still done properly — a migration called
  // `it's.sql` should not be able to break the ledger write.
  const q = (s) => `'${String(s).replace(/'/g, "''")}'`;
  return `INSERT INTO schema_migrations (filename, applied_at, method) VALUES (${q(filename)}, ${q(now)}, ${q(method)})`;
}
