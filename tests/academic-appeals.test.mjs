// A COLLEGE THAT CAN GRADE YOU AND CANNOT BE ARGUED WITH IS NOT
// ADMINISTERING ACADEMIC JUDGEMENT. IT IS ADMINISTERING POWER.
//
// Misconduct affects the few who are accused. Appeals affect every
// learner, because every learner receives marks, progression decisions
// and — if it goes badly — a withdrawal.
//
// Two assertions carry this file.
//
//   1. ACADEMIC JUDGEMENT IS NOT A GROUND. Without that rule, "I
//      deserved a higher mark" is an appeal, every mark becomes
//      provisional, and the process becomes a re-marking service that
//      rewards persistence over merit — which is unfair to every
//      learner who accepts their mark. The record carries a row that
//      exists purely to say so, in words a learner can read BEFORE
//      lodging rather than after.
//
//   2. NOTHING CLOSES WITHOUT A COMPLETION OF PROCEDURES STATEMENT.
//      That document is what lets a learner take the matter outside the
//      College. Without it a complainant can be kept inside the
//      institution's own process indefinitely, and "we are still
//      considering it" is a complete defence for ever.
//
// And the status assertion, which is the honest one: the procedure is
// NOT ADOPTED. Nobody has decided it. If that assertion ever fails
// because a default was changed rather than a decision taken, the
// College is enforcing a policy it never approved.
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
  ('usr_l','clerk','ap1','l@example.com','student'),
  ('usr_marker','clerk','ap2','m@example.com','staff'),
  ('usr_reg','clerk','ap3','r@example.com','admin'),
  ('usr_third','clerk','ap4','t@example.com','admin');`);

const T = '2027-06-01T09:00:00Z';
let n = 0;
const appeal = (extra = {}) => {
  n += 1;
  const cols = {
    id: `apl_${n}`, reference: `AP-2027-${String(n).padStart(3, '0')}`,
    user_id: 'usr_l', subject: 'mark', subject_ref: `asub_${n}`,
    decision_at: '2027-05-20T00:00:00Z',
    ground_code: 'EVIDENCE_NOT_CONSIDERED', lodged_at: T,
    statement: 'I submitted a medical certificate to the tutor on 12 May and the decision does not mention it.',
    original_decision_by: 'usr_marker', ...extra,
  };
  const k = Object.keys(cols);
  db.prepare(`INSERT INTO appeals (${k.join(',')}) VALUES (${k.map(() => '?').join(',')})`)
    .run(...k.map((x) => cols[x]));
};

// --- The procedure exists and is NOT adopted --------------------------
{
  const proc = db.prepare('SELECT * FROM appeal_procedure WHERE id = 1').get();
  check('An appeals procedure is defined', !!proc);
  check('...and is NOT adopted, because nobody has decided it',
    proc.status === 'proposed', proc.status);
  check('...saying so in its own basis rather than leaving it to be inferred',
    /NOT ADOPTED/.test(proc.basis), proc.basis.slice(0, 70));
  check('...and naming the body that would have to take the decision',
    /Academic Senate/.test(proc.basis));
  check('It carries the two time limits an appeals process lives or dies by',
    proc.lodge_within_days > 0 && proc.respond_within_days > 0,
    `${proc.lodge_within_days} / ${proc.respond_within_days}`);

  refuses('It cannot call itself adopted without a body and a date',
    () => db.prepare("UPDATE appeal_procedure SET status = 'adopted' WHERE id = 1").run());
  allows('...and can be adopted properly, when a body actually adopts it', () =>
    db.prepare(`UPDATE appeal_procedure SET status = 'adopted',
      adopted_by = 'Academic Senate', adopted_at = '2027-09-01T00:00:00Z' WHERE id = 1`).run());
  db.prepare("UPDATE appeal_procedure SET status='proposed', adopted_by=NULL, adopted_at=NULL WHERE id=1").run();

  refuses('There can only ever be one procedure in force', () =>
    db.prepare(`INSERT INTO appeal_procedure (id, version, lodge_within_days, respond_within_days, basis)
      VALUES (2, 'draft-2', 10, 10, 'A second procedure.')`).run());
}

// --- The grounds a learner can read before deciding -------------------
{
  const grounds = db.prepare('SELECT * FROM appeal_grounds ORDER BY sequence').all();
  const real = grounds.filter((g) => g.is_a_ground === 1);
  check(`Four grounds of appeal are published — ${real.length}`, real.length === 4,
    real.map((g) => g.code).join(', '));
  check('Every ground says what the learner would need to show',
    real.every((g) => g.evidence_expected && g.evidence_expected.length > 20));
  check('Every ground is written for the person deciding whether to appeal',
    real.every((g) => /\byou\b|\byour\b/i.test(g.definition)),
    real.filter((g) => !/\byou\b|\byour\b/i.test(g.definition)).map((g) => g.code).join(', '));

  // THE ASSERTION THIS FILE EXISTS FOR.
  const notAGround = grounds.filter((g) => g.is_a_ground === 0);
  check('...and one row exists solely to say what is NOT a ground',
    notAGround.length === 1 && notAGround[0].code === 'ACADEMIC_JUDGEMENT',
    notAGround.map((g) => g.code).join(', '));
  check('It says plainly that disagreeing with a mark is not an appeal',
    /may not appeal on the basis that the work deserved a higher mark/i.test(notAGround[0].definition));
  check('...and explains WHY, rather than simply refusing',
    /no standard at all|rewards persistence/i.test(notAGround[0].definition)
      || /standard for whoever asks twice/i.test(notAGround[0].definition),
    notAGround[0].definition.slice(0, 120));
  check('...and points the learner at what they CAN appeal on',
    /grounds 1 to 4/i.test(notAGround[0].definition));
}

// --- An appeal runs, and every shortcut is refused ---------------------
allows('A properly-formed appeal is lodged', () => appeal());

refuses('An appeal on a ground the College does not recognise is refused',
  () => appeal({ ground_code: 'I_TRIED_HARD' }));
refuses('An appeal with no statement is refused — the learner\'s own words are the appeal',
  () => appeal({ statement: '   ' }));
refuses('The person who took the decision cannot hear the appeal against it',
  () => appeal({ decided_by: 'usr_marker', decided_at: T, outcome: 'not_upheld', reasons: 'x' }));
refuses('An outcome with no reasons is refused: an unreasoned refusal cannot be taken further',
  () => appeal({ decided_by: 'usr_reg', decided_at: T, outcome: 'not_upheld', reasons: null }));
refuses('An appeal upheld that changed nothing is refused — that is an apology, not a remedy',
  () => appeal({ decided_by: 'usr_reg', decided_at: T, outcome: 'upheld',
    reasons: 'The certificate was submitted and not considered.', remedy: null }));
refuses('...and the same for one partly upheld',
  () => appeal({ decided_by: 'usr_reg', decided_at: T, outcome: 'partly_upheld',
    reasons: 'Considered late.', remedy: '  ' }));
refuses('A decider with no date is refused', () => appeal({ decided_by: 'usr_reg' }));
refuses('An outcome with no decision date is refused', () => appeal({ outcome: 'not_upheld', reasons: 'x' }));
refuses('An unrecognised outcome is refused',
  () => appeal({ decided_by: 'usr_reg', decided_at: T, outcome: 'rejected', reasons: 'x' }));
refuses('An appeal against something the College does not decide is refused',
  () => appeal({ subject: 'the weather' }));

// One internal appeal per decision.
refuses('A learner cannot appeal the same decision twice',
  () => appeal({ subject: 'mark', subject_ref: 'asub_1' }));
allows('...but may appeal a different decision', () => appeal({ subject: 'progression' }));

// --- Nothing closes until the learner can go elsewhere -----------------
refuses('An appeal cannot be closed without telling the learner',
  () => appeal({ decided_by: 'usr_reg', decided_at: T, outcome: 'not_upheld',
    reasons: 'The certificate is recorded as received and considered.',
    completion_of_procedures_at: T, closed_at: T }));

refuses('...nor without the statement that lets them take it outside the College',
  () => appeal({ decided_by: 'usr_reg', decided_at: T, outcome: 'not_upheld',
    reasons: 'The certificate is recorded as received and considered.',
    learner_informed_at: T, closed_at: T }));

allows('An appeal carried through properly closes cleanly', () =>
  appeal({ decided_by: 'usr_reg', decided_at: '2027-06-20T00:00:00Z', outcome: 'upheld',
    reasons: 'The medical certificate was received on 12 May and is absent from the decision record.',
    remedy: 'The mark is annulled and the assessment will be re-taken with no penalty and a new deadline.',
    learner_informed_at: '2027-06-21T00:00:00Z',
    completion_of_procedures_at: '2027-06-21T00:00:00Z', closed_at: '2027-06-21T00:00:00Z' }));

allows('An appeal refused as out of time still gets reasons and a route onward', () =>
  appeal({ decided_by: 'usr_reg', decided_at: T, outcome: 'out_of_time',
    reasons: 'Lodged 41 working days after the decision, against a limit of 20, with no reason given for the delay.',
    learner_informed_at: T, completion_of_procedures_at: T, closed_at: T }));

allows('...and so does one refused because it names no real ground', () =>
  appeal({ ground_code: 'ACADEMIC_JUDGEMENT',
    statement: 'I worked very hard on this essay and believe it deserved a higher mark.',
    decided_by: 'usr_reg', decided_at: T, outcome: 'not_a_ground',
    reasons: 'The appeal rests only on disagreement with academic judgement, which the published grounds exclude. Nothing in it alleges that the marking PROCESS went wrong.',
    learner_informed_at: T, completion_of_procedures_at: T, closed_at: T }));

// --- The College ships no appeals --------------------------------------
{
  const shipped = new DatabaseSync(':memory:');
  shipped.exec(readFileSync(path.join(ROOT, 'sql/schema.sql'), 'utf8'));
  check('The College ships no appeals, because nothing has been marked',
    shipped.prepare('SELECT COUNT(*) n FROM appeals').get().n === 0);
  check('...and ships the procedure unadopted, so nothing can be enforced by default',
    shipped.prepare("SELECT COUNT(*) n FROM appeal_procedure WHERE status <> 'proposed'").get().n === 0);
  check('...and ships all five ground rows, so the exclusion is published with the grounds',
    shipped.prepare('SELECT COUNT(*) n FROM appeal_grounds').get().n === 5);
}

console.log(`\n${pass} passed, ${fail} failed.`);
process.exit(fail ? 1 : 0);
