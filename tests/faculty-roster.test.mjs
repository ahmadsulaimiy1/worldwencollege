// docs/faculty-register.md is the source of truth for who teaches here.
// faculty/index.html is published from it. This file keeps the two in
// agreement, in BOTH directions, which is the property that actually
// matters:
//
//   - a name in the register but not on the page = someone the College
//     employs and does not acknowledge;
//   - a name on the page but not in the register = a person the site
//     asserts with no record behind them. That is the failure this
//     project exists to prevent, and it is the one a one-directional
//     check would miss.
//
// It also keeps this roster separate from the two other name sets in
// the project, which is easy to collapse by accident:
//   - sql/seed-demo-people.sql — eighteen invented administrators,
//     banned from every served page by tests/demo-people.test.mjs;
//   - the Level material's listening scripts, where Adeyemi, Okafor and
//     Osei are fictional speakers who predate the roster and stay.
import { readFileSync, readdirSync, statSync, existsSync } from 'node:fs';
import path from 'node:path';
import { ROOT } from './helpers.mjs';

let pass = 0, fail = 0;
const check = (label, cond, detail) => {
  console.log((cond ? 'PASS ' : 'FAIL ') + label + (cond || detail === undefined ? '' : ` — ${detail}`));
  cond ? pass++ : fail++;
};

const DOC_REL = 'docs/faculty-register.md';
const PAGE_REL = 'faculty/index.html';
const DOC_PATH = path.join(ROOT, DOC_REL);
const PAGE_PATH = path.join(ROOT, PAGE_REL);
check('The register exists', existsSync(DOC_PATH), DOC_PATH);
check('The faculty page exists', existsSync(PAGE_PATH), PAGE_PATH);
if (!existsSync(DOC_PATH) || !existsSync(PAGE_PATH)) {
  console.log(`\n${pass} passed, ${fail} failed.`);
  process.exit(1);
}
const doc = readFileSync(DOC_PATH, 'utf8');
const page = readFileSync(PAGE_PATH, 'utf8');
// Prose in the register is hard-wrapped, so a phrase like "Mr. Ibrahim
// Suleiman Khan" spans a newline. Match sentences against a
// whitespace-flattened copy; match table cells against the real one.
const docFlat = doc.replace(/\s+/g, ' ');

// ---------------------------------------------------------------------
// The register has to state where its facts come from
// ---------------------------------------------------------------------
// The College attests the qualifications; this repository has not seen
// a certificate. Recording that distinction is what lets the page say
// something accurate rather than something merely confident, so it is
// asserted rather than trusted to survive the next edit.
check('The register records the roster as attested by the College',
  /attested by the College/i.test(docFlat));
check('...and dates the attestation', /12 August 2026/.test(docFlat));
check('...and says degrees are held in the College HR file, not verified here',
  /certificates held in the College's own HR file, not in this repository/i.test(docFlat));
check('...and records engagement dates as still outstanding',
  /Engagement dates \| \*\*Not yet supplied\*\*/.test(docFlat));

// ---------------------------------------------------------------------
// Parse the register — two tables, ten and ten
// ---------------------------------------------------------------------
function tableRows(heading, nextHeading) {
  const start = doc.indexOf(heading);
  if (start < 0) return [];
  const end = nextHeading ? doc.indexOf(nextHeading, start) : doc.length;
  const seg = doc.slice(start + heading.length, end < 0 ? doc.length : end);
  return seg.split('\n')
    .filter((l) => l.trim().startsWith('|'))
    .map((l) => l.trim().replace(/^\|/, '').replace(/\|$/, '').split('|').map((c) => c.trim()))
    .filter((c) => !/^-+$/.test(c[0]) && c[0] !== 'Name');
}
const academic = tableRows('## Academic staff', '## Supporting tutors');
const tutors = tableRows('## Supporting tutors', '\n---');

check('Ten academic staff in the register', academic.length === 10, academic.length);
check('Ten supporting tutors in the register', tutors.length === 10, tutors.length);
// Everything below derives from these rows. An empty parse would make
// the cross-checks pass vacuously — every name in [] appears on the
// page — which is the exact false green this project keeps catching.
if (academic.length !== 10 || tutors.length !== 10) {
  console.log('\nRefusing to cross-check against a failed parse — the comparisons would pass for the wrong reason.');
  console.log(`\n${pass} passed, ${fail} failed.`);
  process.exit(1);
}
const roster = [...academic, ...tutors];
check('Every register row carries a name, a position and a qualification',
  roster.every((r) => r.length >= 3 && r[0].length > 4 && r[1].length > 2 && r[2].length > 2),
  roster.filter((r) => r.length < 3).map((r) => r[0]).join(', '));

// ---------------------------------------------------------------------
// Direction 1 — everyone in the register is on the page
// ---------------------------------------------------------------------
const decode = (s) => s.replace(/&amp;/g, '&').replace(/&lt;/g, '<').replace(/&gt;/g, '>');
const pageText = decode(page);
const missing = roster.filter((r) => !pageText.includes(r[0]));
check('Every person in the register appears on the faculty page',
  missing.length === 0, missing.map((r) => r[0]).join(', '));

const missingPost = roster.filter((r) => !pageText.includes(r[1]));
check('...with the position the register gives them',
  missingPost.length === 0, missingPost.map((r) => `${r[0]} (${r[1]})`).join(', '));

const missingCreds = roster.filter((r) => !pageText.includes(r[2]));
check('...and the qualifications the register gives them',
  missingCreds.length === 0, missingCreds.map((r) => r[0]).join(', '));

// ---------------------------------------------------------------------
// Direction 2 — nobody on the page is absent from the register
// ---------------------------------------------------------------------
// THE ONE THAT MATTERS. Pull every person-shaped heading and table cell
// out of the rendered roster sections and require the register to know
// it. Without this, pasting a twenty-first name onto the page costs
// nothing and nothing notices.
const rosterHtml = pageText.slice(pageText.indexOf('id="roster"'), pageText.indexOf('cta-band'));
check('The page has roster sections to read', rosterHtml.length > 500, rosterHtml.length);

const PERSON = /(?:Prof\.|Dr\.|Mr\.|Mrs\.|Ms\.)\s+[A-Z][A-Za-z'’-]+(?:\s+[A-Z][A-Za-z'’-]+)+(?:,\s*(?:PhD|EdD|MEd|MSc|MBA|MA|BA|BSc))?/g;
const onPage = [...new Set(rosterHtml.match(PERSON) || [])];
check('The page names twenty people', onPage.length === 20, `${onPage.length}: ${onPage.slice(0, 3).join(' / ')}`);

const registerNames = new Set(roster.map((r) => r[0]));
const unregistered = onPage.filter((n) => !registerNames.has(n));
check('NO name on the faculty page is absent from the register',
  unregistered.length === 0, unregistered.join(', '));

// Prove the scan reaches. A twenty-first person spliced into the page
// must be caught by the same comparison, not just by the count.
{
  const sabotaged = rosterHtml + '\n<h3>Dr. Gregory Alan Fairbairn, PhD</h3>\n';
  const found = [...new Set(sabotaged.match(PERSON) || [])].filter((n) => !registerNames.has(n));
  check('...and that comparison does catch an unregistered name spliced into the page',
    found.length === 1 && found[0] === 'Dr. Gregory Alan Fairbairn, PhD', found.join(', '));
}

// ---------------------------------------------------------------------
// The page must not overstate what the roster settles
// ---------------------------------------------------------------------
// THIS CHECK MOVED, AND THE MOVE IS THE POINT.
//
// It used to require the faculty page to carry the sentence "no
// External Examiner is appointed ... and the College holds no
// accreditation" — a disclosure written into the page and pinned here
// so nobody could tidy it away. That was the right instrument for a
// page that would otherwise have implied external validation it did not
// have.
//
// What it actually produced was a roster of twenty appointed academics
// closing on two sentences about what the College lacks, on the page a
// prospective student reads to decide whether these are people worth
// learning from. The owner ruled that register out on 18 August 2026.
//
// So the disclosure obligation moved to where a reader goes to weigh
// the standard — /governance/quality/, which publishes the whole
// architecture including the External Examiner's remit — and what is
// held HERE is the rule that actually protects a reader on a roster
// page: every name is in the register, no name is invented, and the
// page points at the standard rather than asserting a validation.
//
// The register itself is unchanged and still records every structural
// gap; that is checked below against the document, not the page.
check('The page points a reader at the published standard rather than asserting validation',
  /governance\/quality/.test(pageText) && !/no accreditation/i.test(pageText));
check('...and the register keeps the same three structural gaps on record',
  /External Examiner/.test(docFlat) && /members_appointed = 0/.test(docFlat)
  && /did not write the material/.test(docFlat));
check('The stale "currently recruiting" copy is gone from the served page',
  !/currently recruiting and confirming/i.test(pageText));

// ---------------------------------------------------------------------
// The three name sets must stay separate
// ---------------------------------------------------------------------
const SERVED_EXT = new Set(['.html', '.htm', '.js', '.css', '.json', '.svg', '.txt', '.xml', '.webmanifest']);
const SKIP_DIRS = new Set(['node_modules', '.git', 'docs', 'tests', 'sql', '.github']);
function servedFiles(dir, out = []) {
  for (const name of readdirSync(dir)) {
    if (SKIP_DIRS.has(name)) continue;
    const full = path.join(dir, name);
    const st = statSync(full);
    if (st.isDirectory()) servedFiles(full, out);
    else if (SERVED_EXT.has(path.extname(name).toLowerCase())) out.push(full);
  }
  return out;
}
const files = servedFiles(ROOT);

// The listening-script characters predate the roster and share three
// surnames with it. They are unrelated people and must not be "fixed"
// to match. Assert they survive, so the day someone renames them to
// tidy up the coincidence, the reason is on record.
const curriculumCharacters = ['Adeyemi', 'Okafor', 'Osei'].filter((s) =>
  files.some((f) => readFileSync(f, 'utf8').includes(s)));
check('The listening-script characters sharing roster surnames are untouched',
  curriculumCharacters.length === 3, `present: ${curriculumCharacters.join(', ') || 'none'}`);

// The eighteen invented administrators stay banned. Two of them share a
// given-and-surname with faculty here, so the distinction is exactly
// the kind that collapses quietly.
const demoSeed = readFileSync(path.join(ROOT, 'sql/seed-demo-people.sql'), 'utf8');
for (const placeholder of ['Ibrahim Suleiman Khan', 'Omar Farooq Malik']) {
  check(`"${placeholder}" is still a placeholder, still in the demo seed`, demoSeed.includes(placeholder));
  const leaked = files.filter((f) => readFileSync(f, 'utf8').includes(placeholder));
  check(`...and still appears on no served page`, leaked.length === 0,
    leaked.map((f) => path.relative(ROOT, f)).join(', '));
}
check('The register warns the next editor about both name collisions',
  /Ibrahim Suleiman Khan/.test(docFlat) && /Omar Farooq Malik/.test(docFlat)
  && /Do not "fix" one to match the other/.test(docFlat));

console.log(`\n${pass} passed, ${fail} failed.`);
process.exit(fail ? 1 : 0);
