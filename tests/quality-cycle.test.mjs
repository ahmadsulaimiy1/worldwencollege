// THE DIAGNOSTIC QUESTION IS NOT "DID YOU REVIEW", IT IS "WHAT HAPPENED
// TO THE ACTIONS NOBODY DID".
//
// Migration 027 builds the quality cycle. Anyone can hold a review and
// agree a list of actions; what separates quality assurance from a
// yearly document is whether an action that was not done is visibly
// carried forward or silently disappears. So the assertions here are
// about the carry-forward chain, and about the two honesty rules:
//
//   - a finding must carry EVIDENCE and name the register it came
//     from, because a review of impressions reaches whatever conclusion
//     the room already held while carrying a review's authority;
//   - the review cadence is 'proposed', with a basis that says nobody
//     has approved it, and cannot become 'approved' by a default.
//
// One test below exists because of a real defect. Both seeded rows with
// a NULL or out-of-order column were silently dropped by INSERT OR
// IGNORE while the migration reported success — the count assertion is
// what caught it, and is what would catch it again.
import { readFileSync } from 'node:fs';
import { DatabaseSync } from 'node:sqlite';
import path from 'node:path';
import { ROOT } from './helpers.mjs';

let pass = 0, fail = 0;
const check = (label, cond, detail) => {
  console.log((cond ? 'PASS ' : 'FAIL ') + label + (cond || detail === undefined ? '' : ` — ${detail}`));
  cond ? pass++ : fail++;
};
const refuses = (label, fn) => { let t = false; try { fn(); } catch { t = true; } check(label, t); };
const allows = (label, fn) => {
  try { fn(); check(label, true); } catch (e) { check(label, false, e.message); }
};

const db = new DatabaseSync(':memory:');
db.exec(readFileSync(path.join(ROOT, 'sql/schema.sql'), 'utf8'));

// --- The cycle is defined, and nothing is scheduled yet ---------------
const sched = db.prepare('SELECT * FROM review_schedule ORDER BY kind').all();
// The assertion that caught a silent seeding failure. A migration that
// reports success having dropped two of its three rows is worse than
// one that fails.
check(`All three kinds of review are defined — ${sched.length} of 3`, sched.length === 3,
  sched.map((r) => r.kind).join(', '));
check('Each says what it is for', sched.every((r) => r.purpose && r.purpose.length > 40));
check('Each states on what authority its cadence was set', sched.every((r) => r.basis && r.basis.trim()));
check('...and every one of those says NOT SET, because none has been approved',
  sched.every((r) => /NOT SET/.test(r.basis)) && sched.every((r) => r.status === 'proposed'),
  sched.map((r) => `${r.kind}:${r.status}`).join(', '));
check('The occasional kind carries no cadence rather than a made-up one',
  sched.find((r) => r.kind === 'thematic').every_months === null);

refuses('A cadence cannot call itself approved without an approving body',
  () => db.prepare(`UPDATE review_schedule SET status='approved' WHERE kind='annual_monitoring'`).run());
refuses('A cadence of zero months is refused',
  () => db.prepare(`UPDATE review_schedule SET every_months=0 WHERE kind='annual_monitoring'`).run());

// --- A cycle -----------------------------------------------------------
const cyc = (extra = {}) => {
  const cols = { id: 'rev_1', reference: 'AM-2027-L1', kind: 'annual_monitoring',
    title: 'Annual monitoring 2027 — Foundation', level_id: 1,
    period_start: '2027-01-01T00:00:00Z', period_end: '2027-12-31T00:00:00Z',
    due_at: '2028-02-01T00:00:00Z', ...extra };
  const k = Object.keys(cols);
  db.prepare(`INSERT INTO review_cycles (${k.join(',')}) VALUES (${k.map(() => '?').join(',')})`)
    .run(...k.map((x) => cols[x]));
};
allows('A cycle can be scheduled', () => cyc());
refuses('A period that ends before it begins is refused',
  () => cyc({ id: 'rev_x', reference: 'X1', period_end: '2026-01-01T00:00:00Z' }));
refuses('A review of a kind the College does not hold is refused',
  () => cyc({ id: 'rev_x', reference: 'X2', kind: 'chat' }));
refuses('A cycle cannot be considered by nobody',
  () => cyc({ id: 'rev_x', reference: 'X3', status: 'considered' }));
refuses('...nor closed by nobody',
  () => cyc({ id: 'rev_x', reference: 'X4', status: 'closed' }));
refuses('...nor claim a consideration while still scheduled',
  () => cyc({ id: 'rev_x', reference: 'X5', considered_by: 'Academic Senate',
    considered_at: '2028-01-01T00:00:00Z' }));
allows('A cycle a body actually considered records properly', () =>
  cyc({ id: 'rev_2', reference: 'AM-2027-L2', status: 'considered',
    considered_by: 'Academic Senate', considered_at: '2028-01-15T00:00:00Z' }));

// --- A finding rests on evidence, from a named register ----------------
const find = (extra = {}) => {
  const cols = { id: 'rf_1', cycle_id: 'rev_1', sequence: 1,
    finding: 'Learners consistently reported the Module 3 assessment brief as unclear.',
    source: 'student_feedback',
    evidence: 'Survey L1-M03-EVAL, 41 of 58 free-text responses named the brief; feedback_actions records the rewrite.',
    ...extra };
  const k = Object.keys(cols);
  db.prepare(`INSERT INTO review_findings (${k.join(',')}) VALUES (${k.map(() => '?').join(',')})`)
    .run(...k.map((x) => cols[x]));
};
allows('A finding drawn from the student feedback register records', () => find());
allows('...and one drawn from the attendance register', () =>
  find({ id: 'rf_2', sequence: 2, source: 'attendance',
    finding: 'The Tuesday speaking clinic was attended by under a third of those required.',
    evidence: 'session_attendance for the eleven clinics held in the period.' }));
refuses('A finding with no evidence is refused: that is an opinion with a review\'s authority',
  () => find({ id: 'rf_x', sequence: 9, evidence: '   ' }));
refuses('A finding from an unrecognised source is refused',
  () => find({ id: 'rf_x', sequence: 9, source: 'a feeling' }));
refuses('A blank finding is refused', () => find({ id: 'rf_x', sequence: 9, finding: ' ' }));
refuses('Two findings cannot share a number in one cycle', () => find({ id: 'rf_x' }));

// --- And the carry-forward, which is the whole point --------------------
const act = (extra = {}) => {
  const cols = { id: 'ra_1', finding_id: 'rf_1', cycle_id: 'rev_1',
    action: 'Rewrite the Module 3 assessment brief and add a worked example.',
    owner_role: 'Academic Director', due_at: '2028-03-01T00:00:00Z', ...extra };
  const k = Object.keys(cols);
  db.prepare(`INSERT INTO review_actions (${k.join(',')}) VALUES (${k.map(() => '?').join(',')})`)
    .run(...k.map((x) => cols[x]));
};
allows('An action is owned by a ROLE, because people leave', () => act());
refuses('An action owned by nobody is refused', () => act({ id: 'ra_x', owner_role: '  ' }));
refuses('An action cannot claim completion without saying what changed',
  () => act({ id: 'ra_x', completed_at: '2028-02-01T00:00:00Z' }));
refuses('...nor with a blank note',
  () => act({ id: 'ra_x', completed_at: '2028-02-01T00:00:00Z', outcome_note: '   ' }));
allows('It completes with a note saying what actually changed', () =>
  act({ id: 'ra_done', completed_at: '2028-02-20T00:00:00Z',
    outcome_note: 'Brief rewritten; worked example published with the Module 3 materials.' }));

refuses('An action cannot be both done and carried forward',
  () => act({ id: 'ra_x', completed_at: '2028-02-01T00:00:00Z',
    outcome_note: 'done', continues: 'ra_1' }));
refuses('An action cannot continue itself',
  () => act({ id: 'ra_self', continues: 'ra_self' }));
refuses('An action cannot be filed against a finding from a different cycle',
  () => act({ id: 'ra_x', finding_id: 'rf_1', cycle_id: 'rev_2' }));

// A carried-forward chain: the same undone thing, three cycles running.
allows('An undone action is carried forward into a successor that says so', () => {
  cyc({ id: 'rev_3', reference: 'AM-2028-L1', period_start: '2028-01-01T00:00:00Z',
    period_end: '2028-12-31T00:00:00Z', due_at: '2029-02-01T00:00:00Z' });
  find({ id: 'rf_3', cycle_id: 'rev_3', sequence: 1, source: 'staff',
    finding: 'The competency mapping remains unstarted.',
    evidence: 'assessment_competencies holds 0 of 360 mappings; governance A6d.' });
  act({ id: 'ra_2', finding_id: 'rf_3', cycle_id: 'rev_3',
    action: 'Map the 360 authored assessments to the six competencies.',
    owner_role: 'Academic Director', due_at: '2029-03-01T00:00:00Z', continues: 'ra_1' });
});

// The fact the chain makes computable, and the reason it exists.
const depth = db.prepare(`
  WITH RECURSIVE chain(id, root, n) AS (
    SELECT id, id, 1 FROM review_actions WHERE continues IS NULL
    UNION ALL
    SELECT a.id, c.root, c.n + 1 FROM review_actions a JOIN chain c ON a.continues = c.id
  )
  SELECT MAX(n) AS deepest FROM chain`).get();
check('"Outstanding for N cycles" is a computable fact, not an institutional memory',
  depth.deepest >= 2, String(depth.deepest));

// --- The College ships no reviews --------------------------------------
const shipped = new DatabaseSync(':memory:');
shipped.exec(readFileSync(path.join(ROOT, 'sql/schema.sql'), 'utf8'));
check('The College ships no review cycles, because none has run',
  shipped.prepare('SELECT COUNT(*) n FROM review_cycles').get().n === 0);
check('...and no findings or actions', 
  shipped.prepare('SELECT COUNT(*) n FROM review_findings').get().n === 0
  && shipped.prepare('SELECT COUNT(*) n FROM review_actions').get().n === 0);
check('...but ships all three review kinds, so the cycle is defined before it is needed',
  shipped.prepare('SELECT COUNT(*) n FROM review_schedule').get().n === 3);

console.log(`\n${pass} passed, ${fail} failed.`);
process.exit(fail ? 1 : 0);
