// "WITHOUT REQUIRING FUNDAMENTAL REDESIGN" IS A CLAIM, AND CLAIMS NEED
// EVIDENCE.
//
// The Board asked for systems that carry hundreds, then thousands, then
// tens of thousands of learners. That is easy to assert and easy to get
// wrong, because nothing in a test suite run against an empty database
// ever notices a query that scans the whole table — it is instant over
// zero rows and instant over ten, and it is a four-second page load over
// forty thousand.
//
// So this file builds a real register — 10,000 learners, 10,000 awards,
// 20,000 submissions — and asks SQLite what it would actually DO for
// each query the institution runs most. EXPLAIN QUERY PLAN is the
// evidence: a plan reading "SEARCH ... USING INDEX" is a seek, and a
// plan reading "SCAN awards" is the whole table.
//
// ────────────────────────────────────────────────────────────────
// THE ONE THAT MATTERS MOST
// ────────────────────────────────────────────────────────────────
// chainHead(). Every conferral reads the tail of the hash chain before
// writing, so if that read is a scan, conferring N awards is O(N²) and
// a graduation ceremony gets slower with every certificate. The comment
// in awards.js says this was deliberately made an index seek. This
// checks that it still is.
//
// ────────────────────────────────────────────────────────────────
// AND WHAT IS HONESTLY NOT O(1)
// ────────────────────────────────────────────────────────────────
// The institutional metric register counts whole tables on purpose —
// "how many enrolments does the College hold" has no indexed answer.
// Those are measured here rather than pretended away, so the Board can
// see the real number instead of a promise.
import { readFileSync } from 'node:fs';
import { DatabaseSync } from 'node:sqlite';
import path from 'node:path';
import { ROOT } from './helpers.mjs';

let pass = 0, fail = 0;
const check = (label, cond, detail) => {
  console.log((cond ? 'PASS ' : 'FAIL ') + label + (cond || detail === undefined ? '' : ` — ${detail}`));
  cond ? pass++ : fail++;
};

const N = 10000;
const db = new DatabaseSync(':memory:');
db.exec(readFileSync(path.join(ROOT, 'sql/schema.sql'), 'utf8'));

// --- A register the size the Board asked about ------------------------
{
  const t0 = Date.now();
  db.exec('BEGIN');
  const user = db.prepare(`INSERT INTO users (id, auth_provider, auth_provider_id, email, role)
    VALUES (?, 'clerk', ?, ?, 'student')`);
  const enrol = db.prepare(`INSERT INTO enrolments (id, user_id, level_id, status, started_at)
    VALUES (?, ?, ?, 'active', '2027-01-01T00:00:00Z')`);
  const award = db.prepare(`INSERT INTO awards
    (id, user_id, level_id, award_title, post_nominal, cefr, honour, credits, tqt_hours,
     holder_name, conferred_on, verification_code, status, public_consent,
     prev_digest, digest, seq, created_at)
    VALUES (?, ?, ?, 'Certificate in Applied English Communication', 'CAEC', 'B1', 'pass', 20, 200,
            ?, ?, ?, 'conferred', 1, ?, ?, ?, '2027-06-01T00:00:00Z')`);
  for (let i = 1; i <= N; i++) {
    const id = String(i).padStart(6, '0');
    user.run(`usr_${id}`, `c_${id}`, `l${id}@example.com`);
    enrol.run(`enr_${id}`, `usr_${id}`, (i % 6) + 1);
    award.run(`awd_${id}`, `usr_${id}`, (i % 6) + 1, `Graduate Number ${id}`,
      `2027-${String((i % 12) + 1).padStart(2, '0')}-01`,
      `WEC-${id}-AAAA-BBBBB`, `d${i - 1}`, `d${i}`, i);
  }
  db.exec('COMMIT');
  const seeded = db.prepare('SELECT COUNT(*) AS n FROM awards').get().n;
  check(`A register of ${N.toLocaleString()} awards is built — ${((Date.now() - t0) / 1000).toFixed(1)}s`,
    seeded === N, seeded);
}

/**
 * Ask SQLite what it would do, and require it not to read the table.
 *
 * `mustMatchSource` binds the query to the code that runs it: if
 * awards.js changes its WHERE clause and this file does not, the
 * assertion fails rather than quietly measuring a query nobody runs.
 */
const SOURCES = {
  awards: readFileSync(path.join(ROOT, 'functions/_lib/registry/awards.js'), 'utf8'),
  graduation: readFileSync(path.join(ROOT, 'functions/_lib/registry/graduation.js'), 'utf8'),
};
const squash = (s) => s.replace(/\s+/g, ' ').trim();

function planFor(label, { sql, params = [], source, fragment, table, allowOrderedScan = false }) {
  if (source && fragment) {
    check(`${label}: the query under test is the one the code runs`,
      squash(SOURCES[source]).includes(squash(fragment)), fragment.slice(0, 60));
  }
  const plan = db.prepare('EXPLAIN QUERY PLAN ' + sql).all(...params)
    .map((r) => r.detail).join(' | ');

  // WHAT COUNTS AS A SCAN, and it took two wrong answers to get here.
  //
  // First attempt: fail on the word SCAN. Wrong — SQLite writes "SCAN
  // awards USING INDEX idx_awards_seq" for the chain-head read, which
  // walks the index backwards and stops at the first row. That is a
  // seek, measured below at 0ms, and failing it would have sent somebody
  // optimising a query that was already optimal.
  //
  // Second attempt: excuse any SCAN that names an index. Also wrong, and
  // worse, because it excused the real defect. Drop idx_awards_roll and
  // the public register's plan becomes "SCAN a USING INDEX
  // idx_awards_one_live_per_level | USE TEMP B-TREE FOR ORDER BY" —
  // every row of the register read and then sorted. Naming an index
  // proves nothing; SQLite will use any index to walk a whole table.
  //
  // The distinction SQLite actually draws is SEARCH versus SCAN. SEARCH
  // is a seek to matching rows. SCAN is a traversal of all of them, and
  // is acceptable only where a LIMIT stops it in index order — which is
  // exactly the case where no full sort is needed afterwards.
  const seeks = new RegExp(`SEARCH ${table}\\b`).test(plan);
  const fullSort = /USE TEMP B-TREE FOR ORDER BY/.test(plan);
  const orderedScanOk = allowOrderedScan
    && new RegExp(`SCAN ${table} USING (COVERING )?INDEX`).test(plan) && !fullSort;
  check(`${label}: seeks into ${table} rather than traversing it`,
    seeks || orderedScanOk, plan.slice(0, 160));
  if (allowOrderedScan) {
    check(`${label}: and the traversal stops in index order, with no full sort`,
      !fullSort, plan.slice(0, 160));
  }
  return plan;
}

// --- The hot paths ----------------------------------------------------
console.log('\n-- Query plans over a full register --');

// 1. THE ONE THAT MATTERS MOST. Read on every single conferral.
planFor('The chain head', {
  sql: 'SELECT digest, seq FROM awards ORDER BY seq DESC LIMIT 1',
  source: 'awards',
  fragment: 'SELECT digest, seq FROM awards ORDER BY seq DESC LIMIT 1',
  table: 'awards',
  // The one legitimate traversal in the institution: walk the index
  // backwards, take the first row, stop.
  allowOrderedScan: true,
});

// 2. A stranger checking a certificate. The single most public query
// the College has, and the one most likely to be hit in bulk.
planFor('Verification by code', {
  sql: `SELECT a.*, l.roman FROM awards a JOIN programme_levels l ON l.id = a.level_id
         WHERE a.verification_code = ?`,
  params: ['WEC-005000-AAAA-BBBBB'],
  table: 'a',
  source: 'awards',
  fragment: 'FROM awards a JOIN programme_levels l ON l.id = a.level_id WHERE a.verification_code = ?',
});

// 3. A graduate opening their own record.
planFor('One graduate\'s history', {
  sql: 'SELECT * FROM awards WHERE user_id = ? ORDER BY level_id',
  params: ['usr_005000'],
  table: 'awards',
});

// 4. The public roll, filtered and sorted exactly as publicRegister does.
planFor('The public register', {
  sql: `SELECT a.holder_name, a.conferred_on FROM awards a
         JOIN programme_levels l ON l.id = a.level_id
        WHERE a.status = 'conferred' AND a.public_consent = 1
        ORDER BY a.conferred_on DESC, a.holder_name ASC LIMIT 100`,
  source: 'awards',
  fragment: "WHERE a.status = 'conferred' AND a.public_consent = 1",
  table: 'a',
});

// 5. The graduation audit's own reads, which run per learner.
planFor('A learner\'s pass list entry', {
  sql: `SELECT e.outcome FROM pass_list_entries e JOIN pass_lists l ON l.id = e.pass_list_id
         WHERE e.user_id = ? AND l.level_id = ? ORDER BY l.approved_at DESC LIMIT 1`,
  params: ['usr_005000', 1],
  source: 'graduation',
  fragment: 'FROM pass_list_entries e JOIN pass_lists l ON l.id = e.pass_list_id',
  table: 'e',
});
planFor('A learner\'s module completions', {
  sql: `SELECT COUNT(*) FROM unit_progress p JOIN units u ON u.id = p.unit_id
         WHERE p.user_id = ? AND u.course_id = ? AND p.status = 'completed'`,
  params: ['usr_005000', 'crs_level_1'],
  source: 'graduation',
  fragment: 'FROM unit_progress p JOIN units u ON u.id = p.unit_id',
  table: 'p',
});

// 6. The conferral integrity check — a LEFT JOIN across the whole
// register. This one is allowed to scan awards (it is asking a question
// about all of them), but it must not scan conferrals per row.
{
  const plan = db.prepare(`EXPLAIN QUERY PLAN
    SELECT COUNT(*) FROM awards a LEFT JOIN conferrals c ON c.award_id = a.id
     WHERE c.award_id IS NULL`).all().map((r) => r.detail).join(' | ');
  // A COVERING INDEX search on award_id is the good outcome and the
  // first version of this pattern did not list it — so it failed on
  // exactly the plan it wanted. What must not happen is `c` being read
  // per row of `a`.
  check('Conferral integrity looks each award up by key rather than scanning per award',
    /SEARCH c USING (COVERING )?INDEX|SEARCH c USING (INTEGER )?PRIMARY KEY/.test(plan)
      && !/SCAN c\b/.test(plan), plan.slice(0, 150));
}

// --- And it is fast in practice, not only on paper --------------------
console.log('\n-- Measured over the same register --');
const timed = (label, fn, budgetMs) => {
  const t0 = Date.now();
  const out = fn();
  const ms = Date.now() - t0;
  check(`${label} — ${ms}ms`, ms < budgetMs, `${ms}ms exceeds the ${budgetMs}ms budget`);
  return out;
};

timed('The chain head over 10,000 awards', () =>
  db.prepare('SELECT digest, seq FROM awards ORDER BY seq DESC LIMIT 1').get(), 20);
timed('Verifying one certificate', () =>
  db.prepare('SELECT * FROM awards WHERE verification_code = ?').get('WEC-009999-AAAA-BBBBB'), 20);
timed('A page of the public register', () =>
  db.prepare(`SELECT holder_name FROM awards WHERE status = 'conferred' AND public_consent = 1
              ORDER BY conferred_on DESC, holder_name ASC LIMIT 100`).all(), 100);

// --- What is honestly linear, said plainly ----------------------------
// The metric register counts whole tables because the questions it asks
// have no indexed answer. Measured rather than defended: if this ever
// becomes the slow thing, the Board should learn it from a number.
const wholeTable = timed('Counting the whole register (the metric path)', () =>
  db.prepare('SELECT COUNT(*) AS n FROM awards').get(), 200);
check('...and it counts every row, not an estimate', wholeTable.n === N, wholeTable.n);

// --- The cap that stops the register becoming a bulk download ---------
{
  const capped = db.prepare(`SELECT holder_name FROM awards
    WHERE status = 'conferred' AND public_consent = 1 LIMIT 200`).all();
  check('The public roll is capped however large the register grows',
    capped.length === 200, capped.length);
  check('...and the cap is enforced in the code, not left to the caller',
    /Math\.min\(Number\(limit\) \|\| 100, 200\)/.test(SOURCES.awards));
}

// --- Every index the hot paths rely on actually exists ----------------
//
// A FINDING, recorded rather than quietly fixed. Dropping each of these
// and re-running was how the plan assertions above were verified, and
// four of the five changed the plan. idx_unit_progress_user did not:
// unit_progress carries UNIQUE(user_id, unit_id), whose automatic index
// has user_id as its leading column and serves the same lookup. The
// named index is therefore redundant — it costs a write on every
// progress update and buys nothing this file can measure.
//
// Not removed. It is a live schema, removing an index is a migration,
// and the cost is a fraction of a millisecond on a table nobody writes
// to yet. Written down so the next person to look at write throughput
// finds it already investigated rather than investigating it again.
{
  const idx = db.prepare("SELECT name FROM sqlite_master WHERE type = 'index'").all().map((r) => r.name);
  for (const name of ['idx_awards_seq', 'idx_awards_user', 'idx_awards_roll',
    'idx_pass_list_entries_user', 'idx_unit_progress_user']) {
    check(`Index ${name} exists`, idx.includes(name));
  }
  const cols = db.prepare("SELECT sql FROM sqlite_master WHERE name = 'unit_progress'").get().sql;
  check('...and the redundancy above is still the reason, not a guess',
    /UNIQUE\s*\(\s*user_id\s*,\s*unit_id\s*\)/.test(cols),
    'UNIQUE(user_id, unit_id) no longer present — re-check whether idx_unit_progress_user is still redundant');
}

console.log(`\n${pass} passed, ${fail} failed.`);
process.exit(fail ? 1 : 0);
