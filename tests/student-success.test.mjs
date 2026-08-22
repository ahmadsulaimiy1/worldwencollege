// A CONCERN THE LEARNER NEVER HEARS ABOUT IS A FILE KEPT ABOUT THEM.
//
// Migration 026 builds early intervention, and the two assertions that
// matter most are about what it refuses to do:
//
//   1. It refuses to close a concern that never reached the learner,
//      unless somebody writes down why it did not need to. That single
//      constraint is the difference between support and surveillance.
//
//   2. It refuses to let a trigger call itself approved without an
//      approving body — because every trigger seeded here has an
//      UNSET threshold, and the College must not be able to start
//      acting on invented numbers by forgetting to change a default.
//
// The second is the honesty assertion. The College has never taught
// anybody and therefore knows nothing about what predicts failure on
// its own programmes. A risk score built today would be fabricated
// research that somebody would then act on, so there is none, and this
// file asserts there is none.
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
db.exec(`INSERT INTO users (id, auth_provider, auth_provider_id, email, role) VALUES
  ('usr_l','clerk','s1','l@example.com','student'),
  ('usr_tutor','clerk','s2','t@example.com','staff'),
  ('usr_adviser','clerk','s3','a@example.com','staff');
INSERT INTO enrolments (id, user_id, level_id, status, started_at)
  VALUES ('enr_l','usr_l',1,'active','2027-01-05T00:00:00Z');`);

const T = '2027-02-01T09:00:00Z';
let n = 0;
const concern = (extra = {}) => {
  n += 1;
  const cols = {
    id: `con_${n}`, user_id: 'usr_l', enrolment_id: 'enr_l',
    raised_by: 'usr_tutor', raised_at: T,
    observation: 'No study activity recorded since 12 January; the module 2 assessment is unattempted.',
    ...extra,
  };
  const k = Object.keys(cols);
  db.prepare(`INSERT INTO learner_concerns (${k.join(',')}) VALUES (${k.map(() => '?').join(',')})`)
    .run(...k.map((x) => cols[x]));
};

// --- The triggers are declared, and none of them fires -----------------
const trig = db.prepare('SELECT * FROM intervention_triggers ORDER BY sequence').all();
check(`The rules for noticing are written down, not implicit — ${trig.length} triggers`, trig.length >= 5);
check('Every trigger states which existing record it reads',
  trig.every((t) => t.reads && t.reads.length > 20));
check('Every trigger states on what authority its threshold was set',
  trig.every((t) => t.basis && t.basis.trim() !== ''));

// THE honesty assertion. If this ever fails because a threshold was
// quietly filled in, that is a threshold somebody invented.
const unset = trig.filter((t) => /NOT SET/.test(t.basis));
check('...and every threshold is honestly recorded as NOT SET, because none has been decided',
  unset.length === trig.length, `${trig.length - unset.length} claim a basis they do not have`);
check('No trigger is approved, so none of them fires',
  trig.every((t) => t.status === 'proposed'));
check('At least one trigger names the Senate decision it is waiting on',
  trig.some((t) => /Academic Senate/.test(t.basis)));

// And no risk score exists anywhere in the record.
const cols = db.prepare("SELECT name FROM pragma_table_info('learner_concerns')").all().map((r) => r.name);
check('A concern carries an OBSERVATION, not a score',
  cols.includes('observation') && !cols.some((c) => /score|risk|rating|probability/i.test(c)),
  cols.join(', '));

refuses('A trigger cannot call itself approved without an approving body',
  () => db.prepare(`UPDATE intervention_triggers SET status='approved' WHERE code='DORMANT'`).run());
allows('...and can be approved properly, when a body actually approves it', () =>
  db.prepare(`UPDATE intervention_triggers
    SET status='approved', approved_by='Academic Senate', approved_at='2027-03-01T00:00:00Z'
    WHERE code='DORMANT'`).run());
refuses('A proposed trigger cannot carry an approval it does not have',
  () => db.prepare(`UPDATE intervention_triggers
    SET status='proposed', approved_by='Academic Senate', approved_at='2027-03-01T00:00:00Z'
    WHERE code='NEVER_STARTED'`).run());
refuses('A trigger with no stated basis is refused',
  () => db.prepare(`INSERT INTO intervention_triggers (code, name, sequence, rule, reads, basis)
    VALUES ('VIBES','A feeling',9,'Somebody has a hunch.','nothing','   ')`).run());

// --- A concern belongs to somebody -------------------------------------
allows('A concern a tutor raised records', () => concern());
allows('...and so does one a named trigger raised', () =>
  concern({ raised_by: null, trigger_code: 'DORMANT' }));
refuses('A concern from nowhere is refused: nobody chases what belongs to nobody',
  () => concern({ raised_by: null }));
refuses('A concern with no observation is refused', () => concern({ observation: '  ' }));
refuses('A trigger code that is not a trigger is refused',
  () => concern({ raised_by: null, trigger_code: 'HUNCH' }));

// --- A concern must reach the learner ----------------------------------
// The assertions this whole file exists for.
refuses('A concern cannot be closed without reaching the learner',
  () => concern({ outcome: 'resumed', outcome_note: 'They came back.', closed_at: T }));

allows('It closes once the learner has actually been contacted', () =>
  concern({ contacted_at: T, contacted_by: 'usr_adviser',
    contact_note: 'Emailed and offered a call.',
    learner_response: 'Working nights this month; asked for a two-week extension.',
    outcome: 'support_arranged', outcome_note: 'Extension agreed to 28 February.', closed_at: T }));

allows('...or closes without contact where somebody writes down why none was needed', () =>
  concern({ outcome: 'no_action_needed',
    outcome_note: 'The gap was the scheduled intake break; the learner resumed on the published restart date.',
    closed_at: T }));

refuses('...but "no action needed" with no reason is refused, because that is what a busy week writes on everything',
  () => concern({ outcome: 'no_action_needed', outcome_note: null, closed_at: T }));
refuses('...and a blank reason is refused too',
  () => concern({ outcome: 'no_action_needed', outcome_note: '   ', closed_at: T }));

allows('A learner who could not be reached is recorded as unreachable, with what was tried', () =>
  concern({ outcome: 'no_contact_possible',
    outcome_note: 'Three emails and one telephone attempt over 21 days; no response and no alternative address held.',
    closed_at: T }));

refuses('A contact time with no contacting person is refused',
  () => concern({ contacted_at: T }));
refuses('...and a contacting person with no time', () => concern({ contacted_by: 'usr_adviser' }));
refuses('A concern cannot be closed with no outcome',
  () => concern({ contacted_at: T, contacted_by: 'usr_adviser', closed_at: T }));
refuses('...nor carry an outcome while still open',
  () => concern({ contacted_at: T, contacted_by: 'usr_adviser', outcome: 'resumed' }));
refuses('An unrecognised outcome is refused',
  () => concern({ contacted_at: T, contacted_by: 'usr_adviser', outcome: 'gave up', closed_at: T }));

// --- The College ships no concerns -------------------------------------
const shipped = new DatabaseSync(':memory:');
shipped.exec(readFileSync(path.join(ROOT, 'sql/schema.sql'), 'utf8'));
check('The College ships no concerns, because nobody is studying',
  shipped.prepare('SELECT COUNT(*) n FROM learner_concerns').get().n === 0);
check('...and ships every trigger unapproved, so nothing can fire on an invented threshold',
  shipped.prepare("SELECT COUNT(*) n FROM intervention_triggers WHERE status <> 'proposed'").get().n === 0);

// --- The migration says what it refuses to build ------------------------
const mig = readFileSync(path.join(ROOT, 'sql/migrations/026-student-success.sql'), 'utf8');
check('The migration records that it contains no risk score, and why',
  /A RISK SCORE\. Not a number/.test(mig) && /invented numbers/.test(mig));
check('...and recommends the research rather than simulating its result',
  /recommended rather than simulated/i.test(mig));

console.log(`\n${pass} passed, ${fail} failed.`);
process.exit(fail ? 1 : 0);
