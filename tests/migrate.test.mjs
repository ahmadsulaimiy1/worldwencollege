// scripts/migrate.mjs — the migration runner.
//
// The runner this replaces applied every file in sql/migrations/
// unconditionally. It worked on exactly one database state — a fresh one
// with no migrations — and failed on every other. Ours had two of three
// applied, so shipping the third was impossible: migration 001's
// `ALTER TABLE ADD COLUMN` errors on a duplicate column long before 003
// is reached, and the deploy reports a broken migration when the truth
// is a runner that cannot count.
//
// So this file tests the runner against the states a real database is
// actually in, rather than the one convenient state:
//
//   A. fresh, built from schema.sql       -> everything baselined
//   B. old, some migrations applied       -> only the missing one runs
//   C. already fully recorded             -> nothing runs, twice
//   D. genuinely empty                    -> everything applied in order
//
// State B is the one that matters, because it is the one production is
// in, and the one the old runner could not survive.
import { DatabaseSync } from 'node:sqlite';
import { readFileSync, writeFileSync, copyFileSync, mkdtempSync } from 'node:fs';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { ROOT } from './helpers.mjs';
import { runMigrations, readProbe, migrationFiles } from '../scripts/migrate.mjs';

let pass = 0, fail = 0;
const check = (label, cond, detail) => {
  console.log((cond ? 'PASS ' : 'FAIL ') + label + (cond || detail === undefined ? '' : ` — ${detail}`));
  cond ? pass++ : fail++;
};
async function throws(fn) { try { await fn(); return null; } catch (e) { return e; } }

const MIG_DIR = path.join(ROOT, 'sql/migrations');
const SCHEMA = readFileSync(path.join(ROOT, 'sql/schema.sql'), 'utf8');
const NOW = '2026-08-03T10:00:00.000Z';

function io(db) {
  return {
    exec: async (sql) => { db.exec(sql); },
    query: async (sql) => db.prepare(sql).all(),
    dir: MIG_DIR,
    now: NOW,
  };
}
const ledger = (db) => db.prepare('SELECT filename, method FROM schema_migrations ORDER BY filename').all();

// ---------------------------------------------------------------------
// Every migration declares a probe
// ---------------------------------------------------------------------
const files = migrationFiles(MIG_DIR);
check('There are migrations to run', files.length >= 3, files.join(', '));
for (const f of files) {
  const sql = readFileSync(path.join(MIG_DIR, f), 'utf8');
  let probe = null;
  try { probe = readProbe(sql, f); } catch (e) { /* reported below */ }
  check(`${f} declares a probe`, !!probe, probe || 'missing');
}
// A migration without one is refused rather than guessed at — "apply it
// and hope" is precisely the old behaviour.
{
  const e = await throws(async () => readProbe('-- no probe here\nCREATE TABLE x(a);', 'bogus.sql'));
  check('A migration with no probe is a hard error, not an assumption',
    !!e && /probe/i.test(e.message), e && e.message.slice(0, 80));
}

// ---------------------------------------------------------------------
// A. Fresh database built from schema.sql
// ---------------------------------------------------------------------
// schema.sql carries every migration's END STATE, so a freshly seeded
// database needs none of them run. The old runner's answer to this was
// an `if` in the workflow saying "don't migrate if you just seeded",
// which is a rule a human has to remember. Here it falls out of the
// probes.
{
  const db = new DatabaseSync(':memory:');
  db.exec(SCHEMA);
  const out = await runMigrations(io(db));
  check('A schema.sql database runs NO migrations', out.applied.length === 0, out.applied.join(', '));
  check('...and records all of them as baseline', out.baselined.length === files.length, out.baselined.join(', '));
  const rows = ledger(db);
  check('...in the ledger, marked baseline not applied',
    rows.length === files.length && rows.every((r) => r.method === 'baseline'),
    JSON.stringify(rows));

  // Running twice must be a no-op. A migration runner that is not safe
  // to re-run is a runner nobody dares run.
  const again = await runMigrations(io(db));
  check('Running it again does nothing at all',
    again.applied.length === 0 && again.baselined.length === 0 && again.alreadyRecorded.length === files.length,
    JSON.stringify(again));
}

// ---------------------------------------------------------------------
// B. THE PRODUCTION CASE — 001 and 002 present, 003 missing, no ledger
// ---------------------------------------------------------------------
// Built by taking schema.sql and removing exactly what migration 003
// adds, which is the shape of the live database: seeded from a
// schema.sql that predated role_events.
{
  const db = new DatabaseSync(':memory:');
  db.exec(SCHEMA);
  db.exec('DROP INDEX idx_role_events_actor');
  db.exec('DROP INDEX idx_role_events_user');
  db.exec('DROP TABLE role_events');
  db.exec('DROP TABLE schema_migrations');

  const before = db.prepare("SELECT COUNT(*) AS n FROM sqlite_master WHERE name='role_events'").get();
  check('Precondition: the database really is missing role_events', before.n === 0, before.n);

  const out = await runMigrations(io(db));
  check('Only the missing migration is applied',
    out.applied.length === 1 && out.applied[0] === '003-appointments.sql', out.applied.join(', '));
  // Derived from the directory rather than hardcoded, so adding
  // migration 005 next month does not break a test about migration 003.
  check('...and every already-present migration is baselined, not re-run',
    out.baselined.length === files.length - 1, out.baselined.join(', '));

  const after = db.prepare("SELECT COUNT(*) AS n FROM sqlite_master WHERE name='role_events'").get();
  check('role_events now exists', after.n === 1, after.n);

  const rows = ledger(db);
  check('The ledger distinguishes what was run from what was adopted',
    rows.find((r) => r.filename === '003-appointments.sql').method === 'applied'
    && rows.filter((r) => r.method === 'baseline').length === files.length - 1,
    JSON.stringify(rows));

  // The appointment feature must actually work afterwards — the point of
  // the migration, as opposed to the table merely existing.
  db.exec(`INSERT INTO users (id, auth_provider, auth_provider_id, email, role)
           VALUES ('usr_a','clerk','c_a','a@example.com','admin'),
                  ('usr_b','clerk','c_b','b@example.com','student')`);
  db.exec(`INSERT INTO role_events (id, user_id, from_role, to_role, actor_id, reason, authority, created_at)
           VALUES ('rev_1','usr_b','student','staff','usr_a','Leads Level II','Board minute','${NOW}')`);
  const ev = db.prepare('SELECT COUNT(*) AS n FROM role_events').get();
  check('...and an appointment can be recorded against it', ev.n === 1, ev.n);
}

// ---------------------------------------------------------------------
// C. A new migration arrives later — the ordinary week-to-week case
// ---------------------------------------------------------------------
// The realistic sequence: deploy, migrate, write migration 004 next
// week, deploy, migrate again. The second run must apply only 004 and
// leave three settled files alone.
//
// Done against a COPY of the migrations directory with a real extra
// file, rather than by deleting ledger rows: the thing under test is
// "what happens when a genuinely new file appears", and faking it by
// editing the ledger would test the fake.
{
  const dir = mkdtempSync(path.join(tmpdir(), 'wec-mig-'));
  for (const f of files) copyFileSync(path.join(MIG_DIR, f), path.join(dir, f));

  const db = new DatabaseSync(':memory:');
  db.exec(SCHEMA);
  const first = await runMigrations({ ...io(db), dir });
  check('First run over the copied set settles everything',
    first.applied.length === 0 && first.baselined.length === files.length, JSON.stringify(first));

  writeFileSync(path.join(dir, '004-example.sql'), [
    '-- Migration 004 — a later migration, arriving after the others settled.',
    "-- probe: SELECT 1 FROM sqlite_master WHERE type='index' AND name='idx_example_note'",
    'CREATE TABLE example_note (id TEXT PRIMARY KEY, note TEXT NOT NULL);',
    'CREATE INDEX idx_example_note ON example_note(note);',
  ].join('\n'));

  const second = await runMigrations({ ...io(db), dir });
  check('A newly-arrived migration is picked up on the next run',
    second.applied.length === 1 && second.applied[0] === '004-example.sql', JSON.stringify(second));
  check('...and the settled ones are neither re-run nor re-baselined',
    second.alreadyRecorded.length === files.length
    && second.baselined.length === 0, JSON.stringify(second));
  check('...and its table really exists',
    db.prepare("SELECT 1 FROM sqlite_master WHERE name='example_note'").all().length === 1);
}

// ---------------------------------------------------------------------
// C2. A half-applied migration fails loudly rather than being recorded
// ---------------------------------------------------------------------
// The documented limit, asserted rather than merely described. Because
// each migration creates its probe target LAST, a file that died part
// way leaves the probe unsatisfied — so the runner retries it, and the
// retry fails on whatever the first attempt did create. That is the
// intended behaviour: a stopped deploy somebody must look at, rather
// than a silent "done" over a half-migrated production database.
{
  const dir = mkdtempSync(path.join(tmpdir(), 'wec-mig-partial-'));
  writeFileSync(path.join(dir, '001-partial.sql'), [
    '-- Migration 001 — half of this already exists.',
    "-- probe: SELECT 1 FROM sqlite_master WHERE type='index' AND name='idx_half_done'",
    'CREATE TABLE half_done (id TEXT PRIMARY KEY);',
    'CREATE INDEX idx_half_done ON half_done(id);',
  ].join('\n'));

  const db = new DatabaseSync(':memory:');
  // The state a crashed run leaves behind: the table, but not the index.
  db.exec('CREATE TABLE half_done (id TEXT PRIMARY KEY)');

  const err = await throws(() => runMigrations({ ...io(db), dir }));
  check('A half-applied migration stops the run instead of being recorded as done',
    !!err && /already exists/i.test(err.message), err && err.message.slice(0, 70));

  const rows = db.prepare("SELECT COUNT(*) AS n FROM schema_migrations WHERE filename='001-partial.sql'").get();
  check('...and nothing is written to the ledger for it', rows.n === 0, rows.n);
}

// ---------------------------------------------------------------------
// D. Genuinely empty database — every migration runs, in order
// ---------------------------------------------------------------------
// Not a state the platform creates (fresh databases come from
// schema.sql), but the runner should not depend on that, and this is the
// only case that proves the files actually execute against SQLite.
{
  const db = new DatabaseSync(':memory:');
  // Reconstruct the database as it stood BEFORE any migration: take
  // schema.sql, drop everything the three migrations add, and rebuild
  // learner_recordings without migration 001's eight columns. Dropping
  // the indexes alone is not enough — 001 is `ALTER TABLE ADD COLUMN`,
  // and schema.sql already carries those columns.
  db.exec(SCHEMA);
  db.exec('DROP INDEX idx_role_events_actor; DROP INDEX idx_role_events_user; DROP TABLE role_events;');
  db.exec('DROP INDEX idx_enrolment_events_enrolment; DROP INDEX idx_enrolment_events_user; DROP TABLE enrolment_events;');
  db.exec('DROP INDEX idx_enrolments_one_live_per_level');
  db.exec('DROP INDEX idx_award_verifications_award; DROP INDEX idx_award_verifications_time; DROP TABLE award_verifications;');
  db.exec('DROP INDEX idx_awards_one_live_per_level; DROP INDEX idx_awards_conferred; DROP INDEX idx_awards_user; DROP TABLE awards;');
  db.exec('DROP INDEX idx_time_on_task_module; DROP INDEX idx_time_on_task_user; DROP TABLE time_on_task;');
  // 007 — the graduate identity spine. Dropping the tables takes their
  // indexes with them; the profile index is partial and named, so it is
  // dropped explicitly for the same reason as the others above.
  // 009 — issued documents and institutional verification.
  db.exec('DROP INDEX idx_institution_checks_institution; DROP TABLE institution_checks;');
  db.exec('DROP TABLE verifying_institutions');
  db.exec('DROP INDEX idx_issued_documents_code; DROP INDEX idx_issued_documents_user; DROP TABLE issued_documents;');
  // 008 — credential signing.
  db.exec('DROP INDEX idx_credential_signatures_subject; DROP INDEX idx_credential_signatures_kid; DROP TABLE credential_signatures;');
  db.exec('DROP INDEX idx_signing_keys_one_active; DROP TABLE signing_keys;');
  db.exec('DROP TABLE profile_shares');
  db.exec('DROP TABLE cpd_records');
  db.exec('DROP INDEX idx_graduate_profiles_public; DROP TABLE graduate_profiles;');
  db.exec('DROP TABLE competency_marks');
  db.exec('DROP TABLE assessment_competencies');
  db.exec('DROP TABLE competencies');
  db.exec('DROP TABLE recording_upload_parts');
  db.exec('DROP TABLE learner_recordings');
  db.exec(`CREATE TABLE learner_recordings (
    id TEXT PRIMARY KEY,
    learning_item_id TEXT NOT NULL REFERENCES learning_items(id),
    user_id TEXT NOT NULL REFERENCES users(id),
    media_url TEXT NOT NULL,
    duration_ms INTEGER,
    attempt INTEGER NOT NULL DEFAULT 1,
    status TEXT NOT NULL DEFAULT 'submitted' CHECK (status IN ('submitted','reviewed')),
    submitted_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ','now'))
  );
  CREATE INDEX idx_learner_recordings_user ON learner_recordings(user_id);
  CREATE INDEX idx_learner_recordings_item ON learner_recordings(learning_item_id);`);
  // 001 also inserts the retention config key, which schema.sql already
  // carries. Migrations move data as well as structure, and a
  // pre-migration reconstruction that only handles tables and columns
  // would miss it.
  db.exec("DELETE FROM platform_config WHERE key = 'recording_retention_days'");
  db.exec('DROP TABLE schema_migrations');

  const out = await runMigrations(io(db));
  check('Against a pre-migration database, every migration is applied for real',
    out.applied.length === files.length, JSON.stringify(out.applied));
  check('...in filename order, so 003 cannot land before 002',
    JSON.stringify(out.applied) === JSON.stringify(files), out.applied.join(', '));

  for (const [label, sql] of [
    ['recording_upload_parts', "SELECT 1 FROM sqlite_master WHERE name='recording_upload_parts'"],
    ['enrolment_events', "SELECT 1 FROM sqlite_master WHERE name='enrolment_events'"],
    ['role_events', "SELECT 1 FROM sqlite_master WHERE name='role_events'"],
    ['the one-live-enrolment index', "SELECT 1 FROM sqlite_master WHERE name='idx_enrolments_one_live_per_level'"],
  ]) {
    check(`...and ${label} exists afterwards`, db.prepare(sql).all().length === 1);
  }

  // 001 adds columns by ALTER TABLE; the whole failure that started this
  // was those columns already existing. Confirm they are really there.
  const cols = db.prepare("SELECT name FROM pragma_table_info('learner_recordings')").all().map((r) => r.name);
  check('...and migration 001 really added its columns',
    ['object_key', 'content_type', 'bytes', 'sha256', 'upload_status'].every((c) => cols.includes(c)),
    cols.join(', '));
}

// ---------------------------------------------------------------------
// The old failure mode, reproduced — so the fix is measured against it
// ---------------------------------------------------------------------
// This is what the previous runner did: apply every file regardless.
// Asserting that it fails is what makes the passing tests above mean
// something.
{
  const db = new DatabaseSync(':memory:');
  db.exec(SCHEMA);
  let err = null;
  try {
    for (const f of files) db.exec(readFileSync(path.join(MIG_DIR, f), 'utf8'));
  } catch (e) { err = e; }
  check('The OLD behaviour (apply everything blindly) does fail on a real database',
    !!err, err ? err.message.slice(0, 90) : 'it succeeded — this test is no longer measuring anything');
}

console.log(`\n${pass} passed, ${fail} failed.`);
process.exit(fail ? 1 : 0);
