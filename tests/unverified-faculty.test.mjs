// docs/faculty-list-unverified.md — the twenty-name faculty list supplied
// on 12 August 2026, held unverified.
//
// tests/demo-people.test.mjs guards the eighteen fictional placeholders
// in sql/seed-demo-people.sql. It cannot guard these, because these are
// not in that seed and are not in the database at all: they arrived as
// prose and they live as prose. Without this file the twenty are the
// only names in the project that could be pasted onto faculty.html with
// nothing stopping the commit.
//
// One difference from the demo-people scan, and it is deliberate. That
// one matches bare surnames. This one must NOT, because three of the
// twenty surnames — Adeyemi, Okafor, Osei — are already speakers in the
// Level material's listening scripts, and Smith is the author of an
// example citation in the academic-writing material. Those are proper
// fictional characters inside lessons and they stay. Matching surnames
// here would fail the build on the College's own curriculum, which
// teaches the next person to weaken the guard rather than fix the leak.
// So the needles are full names and title-plus-name, which is how a
// leak would actually be written.
import { readFileSync, readdirSync, statSync, existsSync } from 'node:fs';
import path from 'node:path';
import { ROOT } from './helpers.mjs';

let pass = 0, fail = 0;
const check = (label, cond, detail) => {
  console.log((cond ? 'PASS ' : 'FAIL ') + label + (cond || detail === undefined ? '' : ` — ${detail}`));
  cond ? pass++ : fail++;
};

const DOC_REL = 'docs/faculty-list-unverified.md';
const DOC_PATH = path.join(ROOT, DOC_REL);
check('The register exists', existsSync(DOC_PATH), DOC_PATH);
if (!existsSync(DOC_PATH)) {
  console.log(`\n${pass} passed, ${fail} failed.`);
  process.exit(1);
}
const doc = readFileSync(DOC_PATH, 'utf8');

// ---------------------------------------------------------------------
// The register has to say what it is
// ---------------------------------------------------------------------
check('It states that nobody on it is verified, appointed or consenting',
  /has been verified, appointed, or recorded as\s*>?\s*having consented/i.test(doc));
check('It states that none of the names may be published',
  /may (?:any of them|not one of these names)|not one of these names may appear/i.test(doc));
check('It names the awarding-institution problem, which is the sharpest one',
  /conferred a doctorate on them/i.test(doc));
check('It records what would make a name publishable, rather than only refusing',
  /What would have to be true/i.test(doc));

// ---------------------------------------------------------------------
// Parse the two tables — the register is the single source of the names
// ---------------------------------------------------------------------
// Only the "as supplied" tables at the end carry people. Earlier tables
// in the file compare names against the placeholder chart, so parsing
// every table in the document would pull those in too.
const supplied = doc.slice(doc.indexOf('## The list, as supplied'));
check('The supplied-list section is present', supplied.length > 0 && supplied.startsWith('## The list, as supplied'));

const NAME_ROW = /^\|\s*((?:Prof\.|Dr\.|Mr\.|Mrs\.|Ms\.)\s[^|]+?)\s*\|/gm;
const rows = [...supplied.matchAll(NAME_ROW)].map((m) => m[1].trim());

check('It holds exactly twenty people — ten academic, ten tutors', rows.length === 20, rows.length);
// Every assertion below derives from `rows`. If the table format drifts
// and the parse yields nothing, the scan searches for nothing, finds
// nothing, and reports a clean run — the precise false green this
// project keeps catching elsewhere. Stop instead.
if (rows.length !== 20) {
  console.log('\nRefusing to run the scan against a failed parse — it would pass for the wrong reason.');
  console.log(`\n${pass} passed, ${fail} failed.`);
  process.exit(1);
}

const academic = [...supplied.slice(supplied.indexOf('### Academic staff'), supplied.indexOf('### Supporting tutors'))
  .matchAll(NAME_ROW)].map((m) => m[1].trim());
check('...split ten and ten', academic.length === 10, academic.length);

// "Prof. Ibrahim Suleiman, PhD" -> title-less "Ibrahim Suleiman" and
// titled "Prof. Ibrahim Suleiman". Post-nominals are dropped: a leak
// would rarely carry them, and a substring match on the bare name
// catches the row that does.
const needles = [];
for (const row of rows) {
  const noPostNominal = row.replace(/,\s*(?:PhD|EdD|MEd|MA|MSc|MBA|BA|BSc)\b.*$/i, '').trim();
  const bare = noPostNominal.replace(/^(?:Prof\.|Dr\.|Mr\.|Mrs\.|Ms\.)\s*/, '').trim();
  check(`"${row}" reduces to a two-part-or-more name`, bare.split(/\s+/).length >= 2, bare);
  needles.push({ person: row, text: bare });
  needles.push({ person: row, text: noPostNominal });
}

// ---------------------------------------------------------------------
// THE ONE THAT MATTERS — no supplied name reaches a served file
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
check('There is a public site to scan', files.length > 20, files.length);

const leaks = [];
for (const file of files) {
  const body = readFileSync(file, 'utf8');
  for (const n of needles) {
    if (body.includes(n.text)) leaks.push(`${path.relative(ROOT, file)} contains "${n.text}" (${n.person})`);
  }
}
check('NO supplied name appears in any file the site serves',
  leaks.length === 0, leaks.slice(0, 6).join(' | '));

// A scan that has only ever seen clean files proves nothing about its
// own reach. Plant one and confirm it catches it.
{
  const victim = files.find((f) => f.endsWith('.html'));
  const clean = readFileSync(victim, 'utf8');
  const sabotaged = clean + '\n<p>Dr. Yusuf Bello, PhD — Director of Assessment</p>\n';
  const caught = needles.some((n) => sabotaged.includes(n.text) && !clean.includes(n.text));
  check('...and that scan does catch a name if one is pasted into a page', caught === true);
}

// The surname exemption is the load-bearing design decision in this
// file, so assert the fact it rests on rather than the comment. If the
// listening script is ever rewritten without Dr Osei, the exemption
// stops being justified and somebody should be told.
{
  const surnamesInCurriculum = ['Adeyemi', 'Okafor', 'Osei'].filter((s) =>
    files.some((f) => readFileSync(f, 'utf8').includes(s)));
  check('Surnames are deliberately not matched, because some are curriculum characters',
    surnamesInCurriculum.length === 3, `still present: ${surnamesInCurriculum.join(', ') || 'none'}`);
}

// ---------------------------------------------------------------------
// It cannot ride to production through the database either
// ---------------------------------------------------------------------
// seed-demo-people.sql is handled separately below: it legitimately
// contains two of these strings, because the supplied list reused names
// from the placeholder chart. Every OTHER seed must be clean.
const seedFiles = readdirSync(path.join(ROOT, 'sql'))
  .filter((f) => f.endsWith('.sql') && f !== 'seed-demo-people.sql');
const inSql = [];
for (const f of seedFiles) {
  const body = readFileSync(path.join(ROOT, 'sql', f), 'utf8');
  for (const n of needles) if (body.includes(n.text)) inSql.push(`${f}: ${n.text}`);
}
check('No supplied name has been seeded into curriculum or content SQL',
  inSql.length === 0, inSql.slice(0, 4).join(' | '));

// The overlap with the placeholder chart is the primary evidence that
// this list was generated rather than recruited, so assert it rather
// than leave it as a claim in prose. Two supplied names are substrings
// of placeholder rows: "Mr. Ibrahim Suleiman Khan" and "Dr. Omar Farooq
// Malik". If that ever stops being true the register's argument has
// changed and somebody should re-read it.
{
  const demoSeed = readFileSync(path.join(ROOT, 'sql/seed-demo-people.sql'), 'utf8');
  const collisions = [...new Set(needles.filter((n) => demoSeed.includes(n.text)).map((n) => n.text))].sort();
  check('Exactly the two documented names collide with the fictional placeholder chart',
    collisions.length === 2 && collisions.join(' | ') === 'Ibrahim Suleiman | Omar Farooq',
    collisions.join(' | ') || 'none');
  for (const c of collisions) {
    check(`...and the register names "${c}" as an overlap`, doc.includes(c));
  }
}

// The register itself must not name the awarding universities anywhere
// a page could pick them up. It lives in docs/, which the scan skips —
// this asserts the skip is what protects it, not luck.
check('The register lives in docs/, which the served-file scan skips',
  SKIP_DIRS.has('docs') && DOC_REL.startsWith('docs/'));

console.log(`\n${pass} passed, ${fail} failed.`);
process.exit(fail ? 1 : 0);
