// Numbers published to prospective students, measured against the
// database that is supposed to back them.
//
// This exists because of a real one. /academics/iefc/ publishes a Units
// column reading 120 per level and "seven hundred and twenty learning
// units" in its opening line. The platform holds 49 learning items per
// level and 294 in total — 41% of the advertised figure. Both numbers
// have a defensible meaning (720 is the curriculum framework's DESIGN:
// ten modules of roughly twelve learning units each), but the page
// presented the design as delivered content, on the page a prospective
// student reads before deciding to pay.
//
// Nobody wrote that as a lie. It drifted: the framework was written
// first, the marketing copy took its figures, and the authoring caught
// up more slowly than the copy implied. Drift is the normal way an
// institution ends up misrepresenting itself, and a document asking
// people to remember does not stop it. This does.
//
// The rule enforced here: **a page may publish a design figure, but not
// silently.** Where a number is not backed by the database, the page
// carrying it must also carry an explicit statement of what is
// designed versus what is delivered.
import { readFileSync } from 'node:fs';
import { DatabaseSync } from 'node:sqlite';
import path from 'node:path';
import { ROOT } from './helpers.mjs';

let pass = 0, fail = 0;
const check = (label, cond, detail) => {
  console.log((cond ? 'PASS ' : 'FAIL ') + label + (cond || detail === undefined ? '' : ` — ${detail}`));
  cond ? pass++ : fail++;
};

// --- what is actually in the curriculum -------------------------------
const db = new DatabaseSync(':memory:');
db.exec(readFileSync(path.join(ROOT, 'sql/schema.sql'), 'utf8'));
for (let n = 1; n <= 6; n++) {
  db.exec(readFileSync(path.join(ROOT, `sql/seed-curriculum-level-${n}.sql`), 'utf8'));
}
const one = (sql) => db.prepare(sql).get();

const levels = one('SELECT COUNT(*) AS n FROM programme_levels').n;
const modules = one('SELECT COUNT(*) AS n FROM units').n;
const items = one('SELECT COUNT(*) AS n FROM learning_items').n;
const questions = one('SELECT COUNT(*) AS n FROM quiz_questions').n;
const perLevel = db.prepare(
  `SELECT c.level_id AS lvl, COUNT(li.id) AS n
     FROM courses c JOIN units u ON u.course_id = c.id
     JOIN learning_items li ON li.unit_id = u.id
     GROUP BY c.level_id ORDER BY c.level_id`,
).all();

console.log(`\nMeasured: ${levels} levels · ${modules} modules · ${items} learning items · ${questions} quiz questions`);
console.log(`Learning items per level: ${perLevel.map((r) => `${r.lvl}=${r.n}`).join(' ')}\n`);

const iefc = readFileSync(path.join(ROOT, 'pages/academics-iefc.html'), 'utf8');
const about = readFileSync(path.join(ROOT, 'pages/about.html'), 'utf8');

// ---------------------------------------------------------------------
// Claims the database CAN confirm — these must simply be true
// ---------------------------------------------------------------------
check('Six levels are published, and six exist', levels === 6, levels);
check('Sixty modules exist — the "ten modules per level" design is fully built',
  modules === 60, modules);
check('Every level has the same number of modules, as published',
  new Set(db.prepare('SELECT COUNT(*) AS n FROM units GROUP BY course_id').all().map((r) => r.n)).size === 1);
check('Every module carries a quiz and an assignment, as the table implies',
  one("SELECT COUNT(*) AS n FROM learning_items WHERE kind='quiz'").n === modules
  && one("SELECT COUNT(*) AS n FROM learning_items WHERE kind='assignment'").n === modules,
  `${one("SELECT COUNT(*) AS n FROM learning_items WHERE kind='quiz'").n} quizzes, ${one("SELECT COUNT(*) AS n FROM learning_items WHERE kind='assignment'").n} assignments`);

// ---------------------------------------------------------------------
// Claims the database CANNOT confirm — these must be disclosed
// ---------------------------------------------------------------------
// The published figure and the built figure. If these ever converge,
// the disclosure requirement below can be dropped — and this test will
// say so rather than leaving a stale warning on the site forever.
const PUBLISHED_UNITS_PER_LEVEL = 120;
const PUBLISHED_UNITS_TOTAL = 720;
const backed = items >= PUBLISHED_UNITS_TOTAL;

check('The page still publishes the design figure this test is watching',
  /<td>120<\/td>/.test(iefc) && /seven hundred and twenty learning units/i.test(iefc),
  'the claim moved — update this test rather than deleting it');

if (backed) {
  check('The published unit count is now fully backed by the curriculum — the disclosure can be retired',
    true, `${items} items >= ${PUBLISHED_UNITS_TOTAL}`);
} else {
  const shortfall = PUBLISHED_UNITS_TOTAL - items;
  console.log(`NOTE  ${items} of ${PUBLISHED_UNITS_TOTAL} learning units authored — ${shortfall} outstanding (${Math.round((items / PUBLISHED_UNITS_TOTAL) * 100)}%).`);

  check('An unbacked figure carries an explicit design-versus-delivered statement',
    /id="curriculum-status"/.test(iefc), 'no #curriculum-status disclosure on the IEFC page');
  check('...that says plainly it is the designed size, not what is published today',
    /designed size of each level, not the amount of content published/i.test(iefc));
  check('...and does not hide behind vagueness — it names what IS complete',
    /sixty modules/i.test(iefc) && /still being written/i.test(iefc));
  check('The disclosure sits with the table, not on some other page',
    iefc.indexOf('id="curriculum-status"') > iefc.indexOf('<td>120</td>'),
    'disclosure appears before the claim it qualifies');
  check('The institutional status page lists it as outstanding too',
    /still being written/i.test(about) && /curriculum-status/.test(about),
    'about page does not carry it');
}

// ---------------------------------------------------------------------
// The claim must not quietly grow
// ---------------------------------------------------------------------
// A page is free to publish a design figure. It is not free to publish
// a LARGER one than the curriculum framework specifies, because at that
// point the number is not a design any more, it is an invention.
check('The published figure matches the curriculum design, not something larger',
  PUBLISHED_UNITS_PER_LEVEL * levels === PUBLISHED_UNITS_TOTAL,
  `${PUBLISHED_UNITS_PER_LEVEL} x ${levels} != ${PUBLISHED_UNITS_TOTAL}`);

const framework = readFileSync(path.join(ROOT, 'docs/curriculum-framework.md'), 'utf8');
check('...and the design figure is one the framework actually specifies',
  /10\s*,?\s*~?12 learning units|10 thematic modules/i.test(framework)
  || /120/.test(framework),
  'the framework does not state the per-level unit design');

console.log(`\n${pass} passed, ${fail} failed.`);
process.exit(fail ? 1 : 0);
