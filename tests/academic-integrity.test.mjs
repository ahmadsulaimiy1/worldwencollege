// A FINDING THAT WOULD NOT SURVIVE AN APPEAL MUST NOT BE RECORDABLE.
//
// Governance C9, adopted 14 August 2026, required a misconduct
// procedure: what constitutes misconduct, who investigates, the
// learner's right to respond BEFORE a finding, the range of outcomes,
// and an appeal to someone not involved in the original decision.
//
// A procedure that lives only in prose is one that gets skipped when
// somebody is in a hurry, and the finding that results is indefensible —
// to the learner, to an appeal, and to any regulator later reading the
// file. So migration 023 puts the procedure in CHECK constraints, and
// this file proves they bite: every assertion below tries to record an
// indefensible finding and requires the database to refuse it.
//
// The tests that matter here are the ones that EXPECT AN ERROR. A schema
// that merely stores the right columns proves nothing.
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
db.exec(`INSERT INTO users (id, auth_provider, auth_provider_id, email, role) VALUES
  ('usr_learner','clerk','c1','l@example.com','student'),
  ('usr_tutor','clerk','c2','t@example.com','staff'),
  ('usr_registrar','clerk','c3','r@example.com','admin'),
  ('usr_appeal','clerk','c4','a@example.com','admin');`);
// A misconduct case is always about a specific piece of work. The
// curriculum itself lives in seed files this test does not load, so the
// subject of the allegation is a fixture: an assignment of exactly the
// kind the NOT_OWN_WORK category exists for.
db.exec(`INSERT INTO units (id, course_id, sequence, title)
  VALUES ('unt_ai', 'crs_level_1', 900, 'Integrity Fixture Unit');
INSERT INTO learning_items (id, unit_id, sequence, kind, title, body)
  VALUES ('itm_ai', 'unt_ai', 1, 'assignment', 'Written task: a letter of complaint', 'Write 180 words.');
INSERT INTO learner_recordings (id, learning_item_id, user_id, media_url, submitted_at)
  VALUES ('rec_ai', 'itm_ai', 'usr_learner', 'https://media.example.com/r.webm', '2026-09-01T09:00:00Z');`);
const item = db.prepare("SELECT id FROM learning_items WHERE id = 'itm_ai'").get();
if (!item) { console.log('FAIL The fixture the whole file depends on was not created'); process.exit(1); }

const T = '2026-09-01T10:00:00Z';
let n = 0;
const openCase = (extra = {}) => {
  n += 1;
  const cols = {
    id: `mis_${n}`, reference: `AI-2026-${String(n).padStart(3, '0')}`,
    user_id: 'usr_learner', category: 'NOT_OWN_WORK',
    learning_item_id: item.id,
    opened_by: 'usr_tutor', opened_at: T,
    allegation: 'The register of the submission does not match other work by this learner.',
    ...extra,
  };
  const keys = Object.keys(cols);
  db.prepare(`INSERT INTO misconduct_cases (${keys.join(',')})
    VALUES (${keys.map(() => '?').join(',')})`).run(...keys.map((k) => cols[k]));
};
const refuses = (label, fn) => {
  let threw = false;
  try { fn(); } catch { threw = true; }
  check(label, threw);
};

// --- The procedure C9 required is defined -----------------------------
const cats = db.prepare('SELECT code FROM misconduct_categories ORDER BY sequence').all().map((r) => r.code);
check(`Misconduct is defined, not left to judgement — ${cats.length} categories`, cats.length >= 5, cats.join(','));
check('...including impersonation, which C9 named for an online programme',
  cats.includes('IMPERSONATION'));
check('...and work that is not the learner’s own, which C9 named too',
  cats.includes('NOT_OWN_WORK'));
const noEvidence = db.prepare(
  `SELECT COUNT(*) n FROM misconduct_categories
    WHERE evidence_expected IS NULL OR TRIM(evidence_expected) = ''`).get().n;
check('Every category states what the College would have to show', noEvidence === 0);

// --- A case can be opened and carried properly ------------------------
let ok = true;
try { openCase(); } catch (e) { ok = false; console.log('   ' + e.message); }
check('A properly-formed case can be opened', ok);

// --- And every improper finding is refused ----------------------------
// Each refusal below is a row that is lawful in EVERY respect except the
// one named. That matters: the first version of this assertion left the
// response fields empty too, so it was refused by the response rule and
// would still have been refused with the notice rule deleted.
refuses('A finding cannot be recorded without notifying the learner',
  () => openCase({ notified_at: null, response_due: T, response_at: T,
    determined_at: T, determined_by: 'usr_registrar',
    outcome: 'warning', reasons: 'x' }));

refuses('...nor before they have answered or the window has closed',
  () => openCase({ notified_at: T, response_at: null, response_due: null,
    determined_at: T, determined_by: 'usr_registrar', outcome: 'warning', reasons: 'x' }));

refuses('...nor without reasons a learner could appeal against',
  () => openCase({ notified_at: T, response_due: T, determined_at: T,
    determined_by: 'usr_registrar', outcome: 'warning', reasons: null }));

refuses('The person who opened the case cannot determine it',
  () => openCase({ notified_at: T, response_due: T, determined_at: T,
    determined_by: 'usr_tutor', outcome: 'warning', reasons: 'x' }));

refuses('An appeal cannot be heard by the person appealed against',
  () => openCase({ notified_at: T, response_due: T, determined_at: T,
    determined_by: 'usr_registrar', outcome: 'warning', reasons: 'x',
    appeal_lodged_at: T, appeal_heard_by: 'usr_registrar',
    appeal_outcome: 'upheld', appeal_reasons: 'y' }));

refuses('A case cannot be closed while an appeal is outstanding',
  () => openCase({ notified_at: T, response_due: T, determined_at: T,
    determined_by: 'usr_registrar', outcome: 'warning', reasons: 'x',
    appeal_lodged_at: T, appeal_decided_at: null, closed_at: T }));

refuses('A case must be about one identified piece of work, not none',
  () => openCase({ learning_item_id: null }));

// Two subjects at once. Written as a raw insert rather than through the
// helper, because the helper takes an object and a duplicate key there
// silently keeps the last one — the first version of this assertion
// tested nothing and passed. Both subjects are real rows, too: the
// version before this one named a recording that did not exist, so the
// foreign key refused it and the rule under test was never reached.
refuses('...and not two at once', () => {
  db.prepare(`INSERT INTO misconduct_cases
    (id, reference, user_id, category, learning_item_id, recording_id,
     opened_by, opened_at, allegation)
    VALUES ('mis_two','AI-2026-900','usr_learner','NOT_OWN_WORK', ?, 'rec_ai',
            'usr_tutor', ?, 'two subjects')`).run(item.id, T);
});

refuses('An appeal cannot be decided without reasons either',
  () => openCase({ notified_at: T, response_due: T, determined_at: T,
    determined_by: 'usr_registrar', outcome: 'warning', reasons: 'x',
    appeal_lodged_at: T, appeal_heard_by: 'usr_appeal',
    appeal_decided_at: T, appeal_outcome: 'overturned', appeal_reasons: null }));

refuses('An unknown outcome cannot be recorded',
  () => openCase({ notified_at: T, response_due: T, determined_at: T,
    determined_by: 'usr_registrar', outcome: 'expelled', reasons: 'x' }));

// --- The full lawful path works ---------------------------------------
let lawful = true;
try {
  openCase({ notified_at: T, response_due: '2026-09-15T10:00:00Z',
    response_at: '2026-09-10T10:00:00Z', response: 'It is my own work; here is my draft history.',
    determined_at: '2026-09-20T10:00:00Z', determined_by: 'usr_registrar',
    outcome: 'no_case_to_answer', reasons: 'The draft history is consistent with authorship.',
    closed_at: '2026-09-20T10:00:00Z' });
} catch (e) { lawful = false; console.log('   ' + e.message); }
check('A case that followed the procedure records cleanly, including a finding of no case to answer', lawful);

// And so does a case that went all the way through an appeal: opened by
// the tutor, determined by the registrar, appealed, and heard by a
// fourth person who was involved in neither of the first two steps.
let appealed = true;
try {
  openCase({ notified_at: T, response_due: '2026-09-15T10:00:00Z',
    response_at: '2026-09-12T10:00:00Z', response: 'I did not know the rule applied to drafts.',
    determined_at: '2026-09-20T10:00:00Z', determined_by: 'usr_registrar',
    outcome: 'work_annulled', reasons: 'The submission reproduces a published model answer.',
    appeal_lodged_at: '2026-09-25T10:00:00Z', appeal_heard_by: 'usr_appeal',
    appeal_decided_at: '2026-10-05T10:00:00Z', appeal_outcome: 'varied',
    appeal_reasons: 'The reproduction is established, but the learner had not been taught the rule.',
    stage: 'closed', closed_at: '2026-10-05T10:00:00Z' });
} catch (e) { appealed = false; console.log('   ' + e.message); }
check('...and so does a case carried through to an appeal decision', appealed);

// --- The register is empty, and honestly so ---------------------------
// Excludes the fixtures this file just created: what matters is that
// sql/ ships no cases, because nobody has been taught yet.
const shipped = new DatabaseSync(':memory:');
shipped.exec(readFileSync(path.join(ROOT, 'sql/schema.sql'), 'utf8'));
check('The College ships an empty case register, because nothing has been assessed',
  shipped.prepare('SELECT COUNT(*) n FROM misconduct_cases').get().n === 0);

const mig = readFileSync(path.join(ROOT, 'sql/migrations/023-academic-integrity.sql'), 'utf8');
check('The procedure records that no case is opened by software',
  /No automated detection/.test(mig));
check('...and that a similarity percentage is not a reason on its own',
  /similarity percentage is not/i.test(mig));
check('...and that there is no penalty tariff', /No penalty tariff/.test(mig));

// --- The published procedure says what the record enforces ------------
// A learner reads docs/academic-integrity-procedure.md, not the schema.
// If the two ever disagree, the document is the one people act on and
// the schema is the one that decides — which is the worst arrangement
// available. So the document is bound to the record here.
const doc = readFileSync(path.join(ROOT, 'docs/academic-integrity-procedure.md'), 'utf8');

const rows = db.prepare('SELECT code, name, definition, evidence_expected FROM misconduct_categories ORDER BY sequence').all();
const missingCat = rows.filter((r) => !doc.includes(r.code) || !doc.includes(r.definition)
  || !doc.includes(r.evidence_expected));
check('Every category is published exactly as the record defines it',
  missingCat.length === 0, missingCat.map((r) => r.code).join(', '));
check('...and the document invents none the record does not hold',
  (doc.match(/^### \d+\. /gm) || []).length === rows.length,
  `${(doc.match(/^### \d+\. /gm) || []).length} in the document, ${rows.length} in the record`);

// The outcome vocabulary. A published list that omits an outcome hides a
// power the College actually holds; one that adds an outcome promises a
// power it does not.
const outcomeSql = /outcome\s+TEXT CHECK \(outcome IS NULL OR outcome IN\s*\(([^)]+)\)/.exec(mig);
check('The outcome vocabulary is readable from the record', !!outcomeSql);
const outcomes = outcomeSql ? outcomeSql[1].split(',').map((v) => v.trim().replace(/^'|'$/g, '')) : [];
check('Every outcome the record accepts is published', outcomes.length === 6
  && outcomes.every((o) => doc.includes(`\`${o}\``)), outcomes.join(', '));
const published = (doc.match(/`([a-z_]+)`/g) || []).map((v) => v.slice(1, -1));
const invented = ['annulled', 'expelled', 'suspended', 'fined', 'excluded']
  .filter((w) => published.includes(w));
check('...and no outcome is published that the record would refuse',
  invented.length === 0, invented.join(', '));

// The two open questions must stay visibly open. A document that quietly
// resolved them would be inventing academic judgement.
check('The response window is still marked for Senate, not silently assumed',
  /For Academic Senate approval[\s\S]{0,400}response window/.test(doc));
check('And so is the body that hears a referred case',
  /For Academic Senate approval[\s\S]{0,400}referred_to_senate/.test(doc));

console.log(`\n${pass} passed, ${fail} failed.`);
process.exit(fail ? 1 : 0);
