// THE COLLEGE MUST HEAR EVERY CANDIDATE SPEAK.
//
// Until migration 022 it did not. Sixty rubric-graded assignments, nine
// hundred quiz questions and six examinations, and a candidate could
// hold the Worldwide English Proficiency Certificate — a qualification
// in English COMMUNICATION — without any person having listened to them
// say a sentence. Every qualification descriptor claimed spoken
// capability; none of them evidenced it.
//
// This file holds the framework to the descriptors it exists to serve,
// and holds the College to the two things it promised the Board: that
// every stage is assessed for speech, and that the standard does not
// bend to the delivery method.
import { readFileSync } from 'node:fs';
import { DatabaseSync } from 'node:sqlite';
import path from 'node:path';
import { ROOT } from './helpers.mjs';

let pass = 0, fail = 0;
const check = (label, cond, detail) => {
  console.log((cond ? 'PASS ' : 'FAIL ') + label + (cond || detail === undefined ? '' : ` — ${detail}`));
  cond ? pass++ : fail++;
};

const db = new DatabaseSync(':memory:');
db.exec(readFileSync(path.join(ROOT, 'sql/schema.sql'), 'utf8'));
const all = (s, ...a) => db.prepare(s).all(...a);

// --- Every qualification is assessed for speech -----------------------
const levels = all('SELECT id, roman, cefr FROM programme_levels ORDER BY id');
const finals = all("SELECT * FROM speaking_assessments WHERE occasion='final' ORDER BY level_id");
const mids = all("SELECT * FROM speaking_assessments WHERE occasion='midpoint' ORDER BY level_id");

check(`Every qualification has a summative speaking assessment — ${finals.length} of ${levels.length}`,
  finals.length === levels.length && finals.every((f) => f.is_summative === 1),
  finals.map((f) => f.level_id).join(','));
check(`...and a formative one at the midpoint — ${mids.length}`,
  mids.length === levels.length && mids.every((m) => m.is_summative === 0));

// The midpoint must carry no weight, or it is not formative — it is a
// second examination with a kinder name, and a learner would prepare for
// it instead of learning from it.
check('The midpoint carries no assessment weight, so it can be used to learn from',
  mids.every((m) => m.weight_percent === 0), mids.map((m) => m.weight_percent).join(','));
check('The summative assessment carries real weight at every stage',
  finals.every((f) => f.weight_percent >= 15), finals.map((f) => f.weight_percent).join(','));

// --- The demand rises with the qualification --------------------------
const mins = finals.map((f) => f.response_minutes);
check('Speaking time rises at every stage, as the capability does',
  mins.every((v, i) => i === 0 || v > mins[i - 1]), mins.join(' '));
const preps = finals.map((f) => f.preparation_minutes);
check('...and so does preparation, except at Foundation where there is none',
  preps[0] === 0 && preps.every((v, i) => i === 0 || v >= preps[i - 1]), preps.join(' '));

// --- The criteria are constant; the descriptors are not ---------------
const CODES = ['INTELLIGIBILITY', 'FLUENCY', 'RANGE', 'INTERACTION', 'APPROPRIACY'];
for (const lv of levels) {
  const c = all('SELECT code FROM speaking_criteria WHERE level_id = ? ORDER BY sequence', lv.id)
    .map((r) => r.code);
  check(`Level ${lv.roman} is judged on the same five criteria`,
    JSON.stringify(c) === JSON.stringify(CODES), c.join(','));
}
// Constant criteria with constant descriptors would be a framework that
// does not distinguish A1 from C2 — the exact failure it exists to avoid.
for (const code of CODES) {
  const ds = all('SELECT descriptor FROM speaking_criteria WHERE code = ? ORDER BY level_id', code)
    .map((r) => r.descriptor);
  check(`${code} describes something different at every stage`,
    new Set(ds).size === 6, `${new Set(ds).size} distinct of 6`);
}

// --- The honest limit of recorded assessment --------------------------
// Asynchronous capture cannot assess genuine interaction: a candidate
// speaking to a prompt is not taking a turn. The College says so in the
// record rather than pretending otherwise.
const capped = all('SELECT DISTINCT code FROM speaking_criteria WHERE async_ceiling IS NOT NULL')
  .map((r) => r.code);
check('Recorded assessment is capped where it cannot honestly reach',
  capped.length === 1 && capped[0] === 'INTERACTION', capped.join(','));
const ceilings = all("SELECT DISTINCT async_ceiling c FROM speaking_criteria WHERE code='INTERACTION'");
check('...at the same band for every stage', ceilings.length === 1, ceilings.map((r) => r.c).join(','));
const bands = all('SELECT code FROM skill_descriptors').map((r) => r.code);
check('...and that band is one the College actually uses',
  bands.includes(ceilings[0].c), `${ceilings[0].c} not in ${bands.join(',')}`);
check('The other four criteria are fully assessable either way',
  all('SELECT COUNT(*) n FROM speaking_criteria WHERE async_ceiling IS NULL')[0].n === 24);

// --- It is bound to the qualifications it serves ----------------------
const quals = all('SELECT level_id, stage, official_title FROM award_definitions ORDER BY level_id');
check('Every qualification in the framework has speaking criteria',
  quals.every((q) => all('SELECT 1 FROM speaking_criteria WHERE level_id = ?', q.level_id).length === 5),
  quals.filter((q) => all('SELECT 1 FROM speaking_criteria WHERE level_id = ?', q.level_id).length !== 5)
    .map((q) => q.stage).join(','));

// --- What must never be built -----------------------------------------
const mig = readFileSync(path.join(ROOT, 'sql/migrations/022-speaking-assessment.sql'), 'utf8');
check('The framework records that no speaking is graded by machine',
  /No automated scoring/.test(mig));
check('...and that intelligibility carries a floor of its own',
  /INTELLIGIBILITY carries a floor/.test(mig));
check('...and that the method never appears on the certificate',
  /never appears on the certificate/.test(mig));

console.log(`\n${pass} passed, ${fail} failed.`);
process.exit(fail ? 1 : 0);
