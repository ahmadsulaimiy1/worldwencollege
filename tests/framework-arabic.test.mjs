// Run with: node --experimental-sqlite tests/framework-arabic.test.mjs
//
// THE TWO ACADEMIC FRAMEWORKS, IN BOTH LANGUAGES, FROM ONE SOURCE.
//
// The four language skills and the six competencies are published
// facts. The English names are on /students/assessment/ and /about/;
// the Arabic names are on /ar/students/assessment/ and /ar/about/, and
// have been since those editions were written.
//
// They were NOT in the database. So /ar/graduate.html — the public
// credential an Arabic-speaking graduate hands to an employer — served
// an Arabic masthead and then named the graduate's skills "Listening",
// "Reading", "Speaking" and "Writing", out of `language_skills`. Found
// by rendering it.
//
// sql/migrations/022-framework-arabic.sql adopts the published Arabic
// into the two tables. That makes a second place the same fact is
// written, which is the drift this repository keeps guards for. This is
// that guard, and it is the same arrangement tests/level-names.test.mjs
// keeps over the six programme levels: the database and the published
// page must agree, name for name, or the build fails.
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

// The published pages, as plain text with the markup taken out. Matching
// against text rather than against a selector keeps the guard from
// failing the day somebody restyles a card.
const textOf = (file) => readFileSync(path.join(ROOT, file), 'utf8')
  .replace(/<[^>]+>/g, ' ')
  .replace(/&mdash;/g, '—').replace(/&nbsp;/g, ' ').replace(/&amp;/g, '&')
  .replace(/\s+/g, ' ');

const skillsPageAr = textOf('pages/students-assessment.ar.html');
const skillsPageEn = textOf('pages/students-assessment.html');
const aboutAr = textOf('pages/about.ar.html');
const aboutEn = textOf('pages/about.html');

// --- The four language skills ----------------------------------------
const skills = db.prepare(
  'SELECT id, name, description, name_ar, description_ar FROM language_skills ORDER BY sequence').all();

check('the platform holds four language skills', skills.length === 4, String(skills.length));
for (const s of skills) {
  check(`${s.name} has an Arabic name`, Boolean(s.name_ar), s.name_ar);
  check('...and it is the name /ar/students/assessment/ publishes',
    skillsPageAr.includes(s.name_ar), s.name_ar);
  check('...and the English name is on /students/assessment/',
    skillsPageEn.includes(s.name), s.name);
  check('...and the Arabic gloss is published there too',
    Boolean(s.description_ar) && skillsPageAr.includes(s.description_ar),
    s.description_ar);
  check('...and no Latin letter has leaked into the Arabic name',
    !/[A-Za-z]/.test(s.name_ar), s.name_ar);
}

// --- The six competencies --------------------------------------------
const comps = db.prepare(
  'SELECT id, name, description, name_ar, description_ar FROM competencies ORDER BY sequence').all();

check('the framework holds six competencies', comps.length === 6, String(comps.length));
for (const c of comps) {
  check(`${c.name} has an Arabic name`, Boolean(c.name_ar), c.name_ar);
  check('...and it is the name /ar/about/ publishes', aboutAr.includes(c.name_ar), c.name_ar);
  check('...and the English name is on /about/', aboutEn.includes(c.name), c.name);
  check('...and the Arabic gloss is published there too',
    Boolean(c.description_ar) && aboutAr.includes(c.description_ar), c.description_ar);
  check('...and no Latin letter has leaked into the Arabic name',
    !/[A-Za-z]/.test(c.name_ar), c.name_ar);
}

// --- The five skill descriptors --------------------------------------
// These are the deliberate exception. No page publishes them, because
// the Academic Senate has not set the thresholds that would let one be
// reported — so there is no published fact to agree with. What is
// checked is that they are not left half-done.
const descriptors = db.prepare(
  'SELECT id, name, name_ar, description_ar, threshold_min FROM skill_descriptors ORDER BY sequence').all();

check('the scale holds five descriptors', descriptors.length === 5, String(descriptors.length));
for (const d of descriptors) {
  check(`${d.name} carries an Arabic name and gloss`,
    Boolean(d.name_ar) && Boolean(d.description_ar), `${d.name_ar} / ${d.description_ar}`);
  check('...with no Latin letter in it', !/[A-Za-z]/.test(d.name_ar), d.name_ar);
}
// The reason they are published nowhere, asserted rather than assumed:
// if a threshold is ever approved, this stops being true and whoever
// approved it is told to publish the scale.
check('no descriptor has an approved threshold yet, which is why none is published',
  descriptors.every((d) => d.threshold_min === null));

// --- A fresh install and a migrated one must be the same database ----
const migration = readFileSync(path.join(ROOT, 'sql/migrations/022-framework-arabic.sql'), 'utf8');
for (const s of skills) {
  check(`migration 022 carries the same Arabic for ${s.name} as the schema does`,
    migration.includes(s.name_ar) && migration.includes(s.description_ar), s.name_ar);
}
for (const c of comps) {
  check(`...and for ${c.name}`,
    migration.includes(c.name_ar) && migration.includes(c.description_ar), c.name_ar);
}

console.log(`\n${pass} passed, ${fail} failed.`);
process.exit(fail ? 1 : 0);
