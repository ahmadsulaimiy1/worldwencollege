// The IEFC Level I Teacher's Companion — the rendered volume.
//
// tests/teaching-expertise.test.mjs guards the RECORD: that every lesson
// has the eight support fields and that none of them claims to be
// observation. This file guards the BOOK built from it, which can fail
// in ways the record cannot.
//
// The failure that matters is not a missing page. It is a page that
// prints a designer's proposal without saying so. Every panel in this
// volume carries an evidence mark, and a teacher who thinks they are
// reading experience when they are reading design will trust the wrong
// sentence at the wrong moment. So the assertions below check that the
// marks are present, that they match the record they came from, and
// that OBSERVED — the one state the College cannot honestly claim —
// appears nowhere.
import { existsSync, readFileSync, statSync } from 'node:fs';
import path from 'node:path';
import { execFileSync } from 'node:child_process';
import { ROOT } from './helpers.mjs';

let pass = 0, fail = 0;
const check = (label, cond, detail) => {
  console.log((cond ? 'PASS ' : 'FAIL ') + label + (cond || detail === undefined ? '' : ` — ${detail}`));
  cond ? pass++ : fail++;
};

const PDF = path.join(ROOT, "publication/IEFC Level I Teacher's Companion.pdf");
const HTML = path.join(ROOT, 'publication/.companion.html');
const SCRIPT = path.join(ROOT, 'scripts/publication/render-companion.mjs');

// Build it rather than trust a committed artefact. A test that reads a
// PDF somebody rendered last week proves the PDF exists, not that the
// renderer still works against the record as it stands today.
check('The renderer exists', existsSync(SCRIPT), SCRIPT);
let out = '';
try {
  out = execFileSync(process.execPath, ['--experimental-sqlite', SCRIPT],
    { cwd: ROOT, encoding: 'utf8', stdio: ['ignore', 'pipe', 'pipe'] });
  check('It renders without error', true);
} catch (e) {
  check('It renders without error', false, String(e.stderr || e.message).slice(0, 300));
  console.log(`\n${pass} passed, ${fail} failed.`);
  process.exit(1);
}

check('It writes the PDF', existsSync(PDF));
check('...and the HTML it was set from', existsSync(HTML));
const html = readFileSync(HTML, 'utf8');
// Prose in the template is hard-wrapped, so a sentence spans newlines
// and indentation. Match wording against a flattened copy; match markup
// against the real one.
const flat = html.replace(/\s+/g, ' ');

const pdfPages = (readFileSync(PDF).toString('latin1').match(/\/Type\s*\/Page(?![s])/g) || []).length;
check('The volume is a book, not a leaflet', pdfPages >= 30, `${pdfPages} pages`);
check('...and is not padded to look like one', pdfPages <= 90, `${pdfPages} pages`);
check('The PDF is a real file with content', statSync(PDF).size > 60_000, statSync(PDF).size);

// ---------------------------------------------------------------------
// Coverage — every lesson, every group
// ---------------------------------------------------------------------
const lessons = html.match(/<section class="lesson">/g) || [];
check('Every Level I teaching lesson has a spread', lessons.length === 19, lessons.length);
if (lessons.length !== 19) {
  console.log('\nRefusing to check panel content against the wrong lesson count.');
  console.log(`\n${pass} passed, ${fail} failed.`);
  process.exit(1);
}

// The five groups are the book's argument: what the lesson assumes,
// what goes wrong, how else to explain it, what to do in the room, and
// what to do afterwards. A lesson missing one is a lesson the Companion
// has nothing to say about at the point a teacher needs it.
const GROUPS = ['Before you teach', 'The difficulty', 'Explaining it', 'In the room', 'Afterwards'];
for (const g of GROUPS) {
  const n = (html.match(new RegExp(`<h2>${g}</h2>`, 'g')) || []).length;
  check(`"${g}" appears on all nineteen spreads`, n === 19, n);
}

// ---------------------------------------------------------------------
// THE ONE THAT MATTERS — provenance on every panel
// ---------------------------------------------------------------------
const panels = html.match(/<p class="p__h">[\s\S]*?<\/p>/g) || [];
check('The book has panels to check', panels.length > 200, panels.length);
const unmarked = panels.filter((p) => !/class="tag"/.test(p));
check('EVERY panel carries an evidence mark', unmarked.length === 0,
  unmarked.slice(0, 3).join(' | ').slice(0, 200));

const marks = (html.match(/class="tag"[^>]*>([A-Z]+)</g) || [])
  .map((m) => m.match(/>([A-Z]+)</)[1]);
const tally = marks.reduce((a, m) => { a[m] = (a[m] || 0) + 1; return a; }, {});
check('The marks used are only the three the College can support',
  Object.keys(tally).sort().join(',') === 'DERIVED,DESIGNED,ESTABLISHED', JSON.stringify(tally));

// OBSERVED is the state that cannot be invented. It must not appear as
// a panel mark anywhere in the body of the book.
const bodyStart = html.indexOf('<section class="lesson">');
check('NO panel in the book is marked OBSERVED',
  !/class="tag"[^>]*>OBSERVED</.test(html.slice(bodyStart)));

// ---------------------------------------------------------------------
// The counts printed in the front matter must be the counts rendered
// ---------------------------------------------------------------------
// A book that miscounts its own contents is the first thing a reviewer
// checks. These numbers are measured by the renderer; this asserts the
// measurement reached the page, and matches what the body actually has.
const stated = {};
for (const k of ['DERIVED', 'ESTABLISHED', 'DESIGNED']) {
  const m = html.match(new RegExp(`>${k}</span></div>\\s*<div class="key__d">[\\s\\S]*?(\\d+) panels`));
  stated[k] = m ? Number(m[1]) : null;
}
check('The front matter states a count for each of the three marks',
  Object.values(stated).every((v) => v && v > 0), JSON.stringify(stated));

// The front matter's own tags are inside .key, so count body tags only.
const bodyMarks = (html.slice(bodyStart).match(/class="tag"[^>]*>([A-Z]+)</g) || [])
  .map((m) => m.match(/>([A-Z]+)</)[1])
  .reduce((a, m) => { a[m] = (a[m] || 0) + 1; return a; }, {});
for (const k of ['DERIVED', 'ESTABLISHED', 'DESIGNED']) {
  check(`...and the ${k} count matches the panels actually printed`,
    stated[k] === bodyMarks[k], `stated ${stated[k]}, printed ${bodyMarks[k]}`);
}

check('Every panel is accounted for by exactly one mark',
  Object.values(bodyMarks).reduce((a, b) => a + b, 0) === panels.length,
  `${JSON.stringify(bodyMarks)} vs ${panels.length} panels`);
check('The 152 designed panels are the whole teaching-support layer',
  bodyMarks.DESIGNED === 152, bodyMarks.DESIGNED);
check('...and the 19 established ones are the why-mistakes field',
  bodyMarks.ESTABLISHED === 19, bodyMarks.ESTABLISHED);

// ---------------------------------------------------------------------
// The front matter has to say the uncomfortable thing
// ---------------------------------------------------------------------
// The claim this holds the volume to has been narrowed to the one that
// is true. The book used to say the College "has taught nobody", which
// stopped being accurate when the record of standing was rewritten:
// learners have been taught since 2023 and two cohorts have completed
// levels. What is still true — and what the volume has to keep saying,
// because a DESIGNED panel read as a classroom finding is trusted at the
// wrong moment — is that no observation of a classroom has been entered
// into the academic record this book is set from. The obligation moves;
// it is not dropped.
check('The book states that it contains no classroom observation',
  /fourth kind of knowledge about teaching/.test(flat)
  && /no observation of a classroom has been entered into the academic record/.test(flat));
check('...and tells the teacher how to read a DESIGNED panel because of it',
  /careful, defensible starting points/.test(flat)
  && /have not met your class/.test(flat));
// The 19 stage times print in the lesson headers rather than as marked
// panels, which is why the DERIVED count is 74 and not the record's 93.
// The front matter has to say so, or a reader who counts is owed an
// explanation the book does not give.
check('...and explains why the derived count is not the record count',
  /plus the stage time printed in each lesson header/.test(flat));

// A heading over an empty field teaches a teacher to stop reading the
// headings, so the renderer omits absent fields entirely.
check('No panel is printed with an empty body', !/<p class="p__b"><\/p>/.test(html));

// The lesson reference is an item coordinate, not the lesson number in
// the title — printing it as "LESSON I.1.2" above "Lesson 1.1" put two
// different numbers on one line and read as an error.
check('The curriculum reference is not labelled as the lesson number',
  html.includes('CURRICULUM REF') && !/>LESSON I\./.test(html));

check('The renderer reports what it measured',
  /\d+ pages · 156 × 234 mm · 19 lessons/.test(out), out.trim().slice(-200));
check('...distinguishing panels printed from record cells behind them',
  /245 panels/.test(out) && /264 record cells behind them/.test(out), out.trim().slice(-200));
check('...including that nothing is observed', /0 observed/.test(out));

console.log(`\n${pass} passed, ${fail} failed.`);
process.exit(fail ? 1 : 0);
