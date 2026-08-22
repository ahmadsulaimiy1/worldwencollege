// Naming — every institutional acronym is explained where it is used,
// and no page names an award the College does not confer.
//
// The College publishes eight acronyms: the programme (IEFC), the
// qualifications framework (WEQ), and the six award post-nominals. A
// first-time international reader — a scholarship officer on a phone, a
// parent, an employer verifying a certificate — meets them cold. An
// acronym that appears in a page's own copy without its full name
// anywhere on that page asks that reader to go and look it up, and most
// will not.
//
// The rule enforced here is narrow and mechanical: if an acronym appears
// in the VISIBLE TEXT inside <main> on a served English page, the full
// name it stands for must appear in that same <main> — either spelled
// out in the copy, or supplied by an <abbr title>.
//
// Two measurement decisions are load-bearing, and both were arrived at
// by getting them wrong first:
//
//   1. Scan <main>, not the whole page. The shared header and footer
//      carry all eight acronyms on every page. Counting them made the
//      first audit report 38 offending pages when 14 pages' own copy was
//      actually at fault. A defect measured against chrome the page did
//      not write is not that page's defect, and an inflated finding is
//      as much a failure of the audit as a missed one.
//
//   2. Scan visible text, not markup. An acronym inside an href, a
//      mailto subject line, a class name or a title attribute is never
//      shown to the reader and cannot confuse them. Counting markup made
//      the scanner flag a mailto subject as unexplained prose.
//
// The full names are read from the record — award_definitions — so this
// file cannot drift from the awards the College actually confers.
import { readFileSync, readdirSync, statSync } from 'node:fs';
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

// ── The names, from the record ──────────────────────────────────────
const NAMES = new Map([
  ['IEFC', 'International English Fluency Course'],
  ['WEQ', 'Worldwide English Qualifications'],
]);
for (const row of db.prepare(
  'SELECT post_nominal, official_title FROM award_definitions ORDER BY level_id').all()) {
  NAMES.set(row.post_nominal, row.official_title);
}
check('the record supplies all six award names', NAMES.size === 8, `${NAMES.size} names`);

// ── The pages ───────────────────────────────────────────────────────
// Served HTML lives at the repository root. pages/ and partials/ are
// sources, publication/ holds print intermediates, and the rest is not
// served as a page.
const NOT_SERVED = new Set([
  'node_modules', '.git', '.github', 'pages', 'partials', 'publication',
  'assets', 'css', 'js', 'sql', 'scripts', 'tests', 'functions',
]);

function servedPages(dir = ROOT, out = []) {
  for (const entry of readdirSync(dir)) {
    if (entry.startsWith('.')) continue;
    const full = path.join(dir, entry);
    if (statSync(full).isDirectory()) {
      if (NOT_SERVED.has(entry)) continue;
      servedPages(full, out);
    } else if (entry.endsWith('.html')) {
      out.push(full);
    }
  }
  return out;
}

const PAGES = servedPages();
check('the served site was found', PAGES.length > 50, `${PAGES.length} pages`);

function mainOf(html) {
  const i = html.indexOf('<main');
  if (i < 0) return null;
  const j = html.indexOf('</main>', i);
  return j > i ? html.slice(i, j) : null;
}

// What the reader actually sees: markup, scripts, styles and SVG gone.
function visibleText(fragment) {
  return fragment
    .replace(/<script[\s\S]*?<\/script>/gi, ' ')
    .replace(/<style[\s\S]*?<\/style>/gi, ' ')
    .replace(/<svg[\s\S]*?<\/svg>/gi, ' ')
    .replace(/<!--[\s\S]*?-->/g, ' ')
    .replace(/<[^>]+>/g, ' ')
    .replace(/&mdash;|&ndash;/g, '-')
    .replace(/&nbsp;/g, ' ')
    .replace(/&rsquo;|&#8217;/g, '’')
    .replace(/&amp;/g, '&')
    .replace(/\s+/g, ' ')
    .trim();
}

// The title= of an <abbr> is not visible text, but it IS an explanation
// the reader can reach. It counts as explaining the term it wraps.
const esc = (s) => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
function abbrExplains(fragment, term, full) {
  return new RegExp(`<abbr[^>]*\\btitle="${esc(full)}"[^>]*>\\s*${term}\\s*</abbr>`).test(fragment);
}

// ── 1 · Acronyms are explained where they are used ──────────────────
const unexplained = [];
const usages = new Map([...NAMES.keys()].map((t) => [t, 0]));
let englishPages = 0;
for (const file of PAGES) {
  const html = readFileSync(file, 'utf8');
  if (/<html[^>]*\blang="ar"/.test(html)) continue;
  const main = mainOf(html);
  if (main === null) continue;
  englishPages++;
  const text = visibleText(main);
  const rel = path.relative(ROOT, file);
  for (const [term, full] of NAMES) {
    if (!new RegExp(`\\b${term}\\b`).test(text)) continue;
    usages.set(term, usages.get(term) + 1);
    if (text.includes(full) || abbrExplains(main, term, full)) continue;
    unexplained.push(`${rel} uses "${term}" and never gives "${full}"`);
  }
}
check('English pages were actually scanned', englishPages > 30, `${englishPages} pages`);
// A positive control. Without it, a broken visibleText() — one that
// returned an empty string, or a regex that never matched — would report
// zero offences and read as a clean audit. The floor is deliberately well
// below the current figures: it is here to catch a scanner that found
// NOTHING, not to freeze the copy.
const unused = [...usages].filter(([, n]) => n === 0).map(([t]) => t);
check('the scanner actually finds every acronym in page copy',
  unused.length === 0, `never found in any page’s copy: ${unused.join(', ')}`);
check('the scanner finds the programme acronym across the site',
  usages.get('IEFC') >= 10, `found on ${usages.get('IEFC')} pages`);

check('every acronym used in a page’s own copy is explained on that page',
  unexplained.length === 0, `\n  ${unexplained.join('\n  ')}`);

// ── 2 · No page names a retired award ───────────────────────────────
// The Graduate Register offered four award titles the College retired
// when it adopted the Worldwide English Qualifications framework:
// "English Candidate", "English Associate", "English Fellow", "English
// Scholar". They sat in a filter dropdown beside two titles from the
// current framework, so one control named awards from two different
// eras. Nothing noticed, because no test had ever compared published
// award names against the record.
const RETIRED = [
  'English Aspirant', 'English Candidate', 'English Associate',
  'English Fellow', 'English Scholar', 'English Laureate',
];
const current = new Set([...NAMES.values()]);
check('no retired title is still in the record',
  RETIRED.every((t) => !current.has(t)));

const publishesRetired = [];
for (const file of PAGES) {
  const text = visibleText(readFileSync(file, 'utf8'));
  for (const title of RETIRED) {
    if (text.includes(title)) publishesRetired.push(`${path.relative(ROOT, file)} names "${title}"`);
  }
}
check('no served page names an award the College does not confer',
  publishesRetired.length === 0, `\n  ${publishesRetired.join('\n  ')}`);

// ── 3 · The publication generator reads award titles from the record ─
// The flagship curriculum's own lead paragraph named "English Associate
// of Worldwide English College" three lines above a table naming the
// award that replaced it, and asserted that "the College says so in
// those words". It did not. The generator now reads the title from the
// record; this asserts it keeps doing so.
// Comments are stripped: a retired title named in a comment explaining
// why it was retired is not a published title.
const blocks = readFileSync(path.join(ROOT, 'scripts/publication/blocks.mjs'), 'utf8')
  .replace(/\/\*[\s\S]*?\*\//g, ' ').replace(/^\s*\/\/.*$/gm, ' ');
const framework = blocks.slice(blocks.indexOf("B.h1('The Qualification Framework')"));
const lead = framework.slice(0, framework.indexOf('B.table('));
check('the qualification-framework lead reads its award title from the record',
  /\$\{d\.levels\[2\]\.awardTitle\}/.test(lead));
check('no publication generator types a retired award title',
  RETIRED.every((t) => !blocks.includes(t)),
  RETIRED.filter((t) => blocks.includes(t)).join(', '));

// ── 4 · The unpublished copy of the level names matches the record ───
// scripts/publication/stage.mjs keeps its own list of the six level
// names. It had drifted one level out of step — "Pre-Intermediate
// Programme" at III, "Intermediate Programme" at IV — left over from a
// six-versus-seven-level revision settled everywhere else. Nothing
// published it, so nothing caught it. An unpublished copy of a published
// fact is correct only until somebody renders it.
const stageSrc = readFileSync(path.join(ROOT, 'scripts/publication/stage.mjs'), 'utf8');
const stageNames = [...stageSrc.matchAll(/\{ n: (\d), roman: '[IVX]+', name: '([^']+)'/g)]
  .map((m) => ({ n: Number(m[1]), name: m[2] }));
const recordNames = db.prepare('SELECT id, name FROM programme_levels ORDER BY id').all();
check('the publication stage list has one entry per level',
  stageNames.length === recordNames.length, `${stageNames.length} vs ${recordNames.length}`);
const stageDrift = recordNames
  .filter((lv, i) => !stageNames[i] || stageNames[i].n !== lv.id || stageNames[i].name !== lv.name)
  .map((lv) => `level ${lv.id}: record says "${lv.name}", stage.mjs says "${stageNames[lv.id - 1]?.name}"`);
check('the publication stage list matches programme_levels',
  stageDrift.length === 0, `\n  ${stageDrift.join('\n  ')}`);

db.close();
console.log(`\n${pass} passed, ${fail} failed`);
process.exit(fail ? 1 : 0);
