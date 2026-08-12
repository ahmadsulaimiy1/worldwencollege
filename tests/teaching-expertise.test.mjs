// sql/seed-teaching-expertise-level-1.sql — the Level I teaching-support
// layer, and the honesty of the record it fills.
//
// Two different things are being guarded here, and they fail in
// opposite directions.
//
// COMPLETENESS. A Teacher's Companion is only usable if a teacher
// opening any lesson finds guidance there. Fifteen of nineteen lessons
// had none, and the count of entries in the table said nothing about
// that, because seed-pedagogy.sql pre-creates every field as NULL. The
// table was "full" and the book was empty. Assertions here count FILLED
// fields per lesson, never rows.
//
// HONESTY. Everything in that file is educational_expertise — a
// designed judgement, arguable and improvable. None of it is
// observation, because the College has taught nobody. The moment one
// row claims observed_in_teaching, a proposal has been promoted to a
// finding and the Companion starts lying about where its authority
// comes from. That is the assertion this file exists for.
//
// And one quality guard that is not ceremony: 125 fields authored in
// one pass is exactly the situation in which the same sentence gets
// pasted nineteen times with a word changed. Padding would satisfy
// every completeness count above. It is caught below instead.
import { DatabaseSync } from 'node:sqlite';
import { readFileSync } from 'node:fs';
import path from 'node:path';
import { ROOT } from './helpers.mjs';

let pass = 0, fail = 0;
const check = (label, cond, detail) => {
  console.log((cond ? 'PASS ' : 'FAIL ') + label + (cond || detail === undefined ? '' : ` — ${detail}`));
  cond ? pass++ : fail++;
};

const SEED_REL = 'sql/seed-teaching-expertise-level-1.sql';
const seedSql = readFileSync(path.join(ROOT, SEED_REL), 'utf8');

function build({ withExpertise = true } = {}) {
  const db = new DatabaseSync(':memory:');
  db.exec(readFileSync(path.join(ROOT, 'sql/schema.sql'), 'utf8'));
  for (let n = 1; n <= 6; n++) {
    db.exec(readFileSync(path.join(ROOT, `sql/seed-curriculum-level-${n}.sql`), 'utf8'));
    db.exec(readFileSync(path.join(ROOT, `sql/seed-audio-level-${n}.sql`), 'utf8'));
  }
  for (const f of ['seed-exercises', 'seed-selfchecks', 'seed-pedagogy',
    'seed-vocabulary-level-1', 'seed-solo-level-1', 'seed-competency-level-1',
    'seed-pedagogy-level-1']) {
    db.exec(readFileSync(path.join(ROOT, `sql/${f}.sql`), 'utf8'));
  }
  if (withExpertise) db.exec(seedSql);
  return db;
}

const db = build();
const all = (sql, ...a) => db.prepare(sql).all(...a);
const one = (sql, ...a) => db.prepare(sql).get(...a);

const ONE_I = `JOIN units u ON u.id = i.unit_id
               JOIN courses c ON c.id = u.course_id
               JOIN programme_levels l ON l.id = c.level_id
               WHERE l.roman = 'I'`;

const SUPPORT_FIELDS = ['alternative_explanation', 'analogy', 'visual_explanation',
  'differentiate_down', 'stretch', 'intervention', 'faster_explanation', 'remediation'];

// ---------------------------------------------------------------------
// The lessons the layer has to cover
// ---------------------------------------------------------------------
// A "teaching lesson" is one the derived layer already reached — it has
// a common_mistakes field, which is generated from its own self-check
// traps. Defining the set that way rather than by kind or by title
// means the two layers cannot cover different lessons.
const lessons = all(`SELECT i.id, i.title FROM learning_items i ${ONE_I}
  AND EXISTS (SELECT 1 FROM pedagogy_entries p
              WHERE p.learning_item_id = i.id AND p.field_key = 'common_mistakes'
                AND p.value IS NOT NULL AND p.value <> '')
  ORDER BY i.id`);

check('Level I has nineteen teaching lessons to support', lessons.length === 19, lessons.length);
// Every count below divides by this. An empty list would make the
// coverage loop pass without examining anything — the false green this
// project keeps finding elsewhere.
if (lessons.length !== 19) {
  console.log('\nRefusing to check coverage against an empty lesson set.');
  console.log(`\n${pass} passed, ${fail} failed.`);
  process.exit(1);
}

// ---------------------------------------------------------------------
// COMPLETENESS — filled fields, never rows
// ---------------------------------------------------------------------
const filled = (id) => new Set(all(
  `SELECT field_key FROM pedagogy_entries
   WHERE learning_item_id = ? AND value IS NOT NULL AND TRIM(value) <> ''`, id)
  .map((r) => r.field_key));

const gaps = [];
for (const l of lessons) {
  const have = filled(l.id);
  const missing = SUPPORT_FIELDS.filter((f) => !have.has(f));
  if (missing.length) gaps.push(`${l.id}: ${missing.join(',')}`);
}
check('Every teaching lesson carries all eight teaching-support fields',
  gaps.length === 0, gaps.slice(0, 5).join(' | '));

// The count that proves it is fields, not rows. 19 x 8.
const supportFilled = one(`SELECT COUNT(*) n FROM pedagogy_entries e
  JOIN learning_items i ON i.id = e.learning_item_id ${ONE_I}
  AND e.field_key IN (${SUPPORT_FIELDS.map((f) => `'${f}'`).join(',')})
  AND e.value IS NOT NULL AND TRIM(e.value) <> ''`).n;
check('...which is 152 filled support fields across the level', supportFilled === 152, supportFilled);

// The table's row count must NOT have moved: these are placeholder rows
// being filled, and a rise would mean duplicates were created alongside
// the empties rather than replacing their contents.
const rowsWith = one('SELECT COUNT(*) n FROM pedagogy_entries').n;
const rowsWithout = build({ withExpertise: false })
  .prepare('SELECT COUNT(*) n FROM pedagogy_entries').get().n;
check('The seed fills existing rows rather than adding new ones',
  rowsWith === rowsWithout, `${rowsWithout} -> ${rowsWith}`);

// ---------------------------------------------------------------------
// HONESTY — the assertion this file exists for
// ---------------------------------------------------------------------
const observed = one("SELECT COUNT(*) n FROM pedagogy_entries WHERE evidence_state = 'observed_in_teaching'").n;
check('NOTHING in the whole record claims to have been observed in teaching',
  observed === 0, observed);
// The header comment discusses observed_in_teaching at length, and
// should — explaining why the state stays empty is the point. What must
// never carry it is a DATA ROW, so check the tuples rather than the file.
const dataRows = seedSql.split('\n').filter((l) => l.trimStart().startsWith("('ped_"));
check('The seed file has 125 data rows to inspect', dataRows.length === 125, dataRows.length);
check('...and not one of them claims observation',
  !dataRows.some((l) => l.includes('observed_in_teaching')));

const wrongState = all(`SELECT e.field_key, e.evidence_state, COUNT(*) n FROM pedagogy_entries e
  JOIN learning_items i ON i.id = e.learning_item_id ${ONE_I}
  AND e.field_key IN (${SUPPORT_FIELDS.map((f) => `'${f}'`).join(',')})
  AND e.value IS NOT NULL AND TRIM(e.value) <> ''
  AND e.evidence_state <> 'educational_expertise'
  GROUP BY 1, 2`);
check('Every filled support field is recorded as educational expertise',
  wrongState.length === 0, wrongState.map((r) => `${r.field_key}=${r.evidence_state}`).join(', '));

const unsourced = one(`SELECT COUNT(*) n FROM pedagogy_entries e
  JOIN learning_items i ON i.id = e.learning_item_id ${ONE_I}
  AND e.evidence_state = 'educational_expertise'
  AND (e.source IS NULL OR TRIM(e.source) = '')`).n;
check('...and says who designed it', unsourced === 0, unsourced);

// The derived layer must be untouched. It is generated from the
// self-check traps and the vocabulary cautions, and an expertise seed
// that quietly rewrote it would create a second version of a field that
// is supposed to have exactly one.
const derived = one(`SELECT COUNT(*) n FROM pedagogy_entries e
  JOIN learning_items i ON i.id = e.learning_item_id ${ONE_I}
  AND e.evidence_state = 'derived_from_curriculum'`).n;
check('The derived layer is unchanged at 93 fields', derived === 93, derived);
check('...and the established-pedagogy layer at 19', one(`SELECT COUNT(*) n FROM pedagogy_entries e
  JOIN learning_items i ON i.id = e.learning_item_id ${ONE_I}
  AND e.evidence_state = 'established_pedagogy'`).n === 19);

// The 27 fields authored earlier must survive. Pick one whose wording
// is distinctive and assert the later seed did not replace it.
const earlier = one(`SELECT value FROM pedagogy_entries
  WHERE learning_item_id = 'itm_l1_m3_lesson2' AND field_key = 'intervention'`).value;
check('An entry authored in the earlier pass is not overwritten',
  /do not re-explain the rule/.test(earlier || ''), (earlier || '').slice(0, 60));

// ---------------------------------------------------------------------
// QUALITY — 125 fields in one pass is where padding hides
// ---------------------------------------------------------------------
const values = all(`SELECT e.learning_item_id, e.field_key, e.value FROM pedagogy_entries e
  JOIN learning_items i ON i.id = e.learning_item_id ${ONE_I}
  AND e.evidence_state = 'educational_expertise'
  AND e.value IS NOT NULL AND TRIM(e.value) <> ''`);
check('There are 152 authored values to inspect', values.length === 152, values.length);

const seen = new Map();
const dupes = [];
for (const v of values) {
  const norm = v.value.trim().toLowerCase().replace(/\s+/g, ' ');
  if (seen.has(norm)) dupes.push(`${v.learning_item_id}.${v.field_key} == ${seen.get(norm)}`);
  else seen.set(norm, `${v.learning_item_id}.${v.field_key}`);
}
check('No authored value is a duplicate of another', dupes.length === 0, dupes.slice(0, 3).join(' | '));

// A floor, not a target — and not the same floor everywhere. A flat 60
// characters flagged "One tense marker per sentence. Didn't is holding
// it.", which is not a stub: faster_explanation and analogy exist to
// compress, and holding the two fields whose purpose is brevity to the
// length of the six that explain would push an author to pad them.
const FLOOR = { faster_explanation: 45, analogy: 45 };
const tooShort = values.filter((v) => v.value.trim().length < (FLOOR[v.field_key] ?? 60));
check('Every authored value is a real instruction, not a stub',
  tooShort.length === 0,
  tooShort.map((v) => `${v.learning_item_id}.${v.field_key} (${v.value.trim().length})`).join(', '));

// Guidance that names nothing from its own lesson is guidance that
// would fit any lesson, which is the definition of padding here. Test
// it against the lesson's actual target language: the value should
// share a content word with the lesson title or with the derived
// mistake/confusable fields the lesson already carries.
// Two things had to be got right before this check meant anything.
//
// Stemming has to converge. A single pass turned "greetings" into
// "greeting" and "greeting" into "greet", so a value and its own
// lesson's mistake field stemmed to different tokens and failed to
// match. Strip repeatedly until stable.
//
// And a hand-written stop-list is the wrong instrument entirely. The
// first one removed "there", "this", "have" and "where" — function
// words in ordinary prose, and precisely what Lessons 2.1, 2.2, 3.1
// and 5.1 exist to teach. In an English curriculum the function words
// ARE the content. Allowing them back let "the" through, which appears
// in every sentence ever written and anchors nothing.
//
// Neither list can be guessed, so neither is. A word earns anchoring
// power by being RARE ACROSS THE LEVEL: computed below from how many
// of the nineteen lessons mention it. "The" appears in nearly all of
// them and is discarded; "can" appears in one and is kept. No
// maintenance, and it stays correct when the curriculum changes.
const stem = (w) => {
  let out = w;
  for (;;) {
    // The trailing -e matters: without it "imperatives" strips to
    // "imperativ" while "imperative" stays whole, and a value fails to
    // match the very field it was written from.
    const next = out.replace(/(ies|ing|ed|es|s|e)$/, '');
    if (next === out || next.length < 3) return out;
    out = next;
  }
};
const words = (s) => new Set((s || '').toLowerCase().match(/[a-z']{3,}/g)
  ?.map(stem).filter((w) => w.length >= 3) || []);

// What each lesson is about, in its own words: the title, plus the two
// derived fields that name its target language and its traps.
const rawAnchor = new Map();
for (const l of lessons) {
  const a = words(l.title);
  for (const f of ['common_mistakes', 'confusable_concepts']) {
    const r = one('SELECT value FROM pedagogy_entries WHERE learning_item_id=? AND field_key=?', l.id, f);
    for (const w of words(r?.value)) a.add(w);
  }
  rawAnchor.set(l.id, a);
}

// A word shared by a third of the level or more identifies no lesson.
const df = new Map();
for (const a of rawAnchor.values()) for (const w of a) df.set(w, (df.get(w) || 0) + 1);
const DISTINCTIVE_MAX = Math.floor(lessons.length / 3); // 6 of 19
const distinctive = (a) => new Set([...a].filter((w) => df.get(w) <= DISTINCTIVE_MAX));

check('Most anchor vocabulary is distinctive to its own lesson',
  [...rawAnchor.values()].every((a) => distinctive(a).size >= 8),
  [...rawAnchor.entries()].filter(([, a]) => distinctive(a).size < 8)
    .map(([id, a]) => `${id}:${distinctive(a).size}`).join(', '));

const generic = [];
for (const l of lessons) {
  const anchor = distinctive(rawAnchor.get(l.id));
  for (const v of values.filter((x) => x.learning_item_id === l.id)) {
    if (![...words(v.value)].some((w) => anchor.has(w))) generic.push(`${l.id}.${v.field_key}`);
  }
}
check('Every authored value is anchored in its own lesson\'s language',
  generic.length === 0, `${generic.length}: ${generic.slice(0, 6).join(', ')}`);

// A relaxed matcher that flags nothing is worth nothing, and this one
// was relaxed twice. Feed it the padding it exists to catch: a sentence
// that is perfectly reasonable teaching advice and could be pasted
// under any lesson in the programme.
{
  const PADDING = 'Encourage participation, provide positive feedback, and adapt your '
    + 'pace to suit the group as required.';
  const caught = lessons.filter((l) => {
    const anchor = distinctive(rawAnchor.get(l.id));
    return ![...words(PADDING)].some((w) => anchor.has(w));
  });
  // Not "every lesson", because that would be a claim the check cannot
  // support. One shared word is weak evidence, and generic prose will
  // occasionally collide with a lesson's vocabulary by accident — this
  // probe does, on two of the nineteen. What the check does guarantee
  // is that guidance sharing NO distinctive vocabulary with its lesson
  // is refused, and the floor below stops that strength eroding
  // quietly if the stemmer or the df cut-off is ever loosened.
  check('...and the anchor check catches generic pedagogy prose on at least 15 of 19 lessons',
    caught.length >= 15, `${caught.length}/19`);
}

// The eight fields were chosen over ten, and the two rejected ones must
// stay rejected — adding them would create a second version of
// common_mistakes and of stretch that could drift from the first.
for (const f of ['misconceptions', 'extension_challenge']) {
  const n = one(`SELECT COUNT(*) n FROM pedagogy_entries e
    JOIN learning_items i ON i.id = e.learning_item_id ${ONE_I}
    AND e.field_key = '${f}' AND e.value IS NOT NULL AND TRIM(e.value) <> ''`).n;
  check(`"${f}" stays empty — it duplicates a field that already exists`, n === 0, n);
}

console.log(`\n${pass} passed, ${fail} failed.`);
process.exit(fail ? 1 : 0);
