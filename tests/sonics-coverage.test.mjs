// EVERY STRUCK SHAPE HAS A VOICE, AND EVERY VOICE HAS A SHAPE.
//
// CLAUDE.md §3: a new component must be added to the TAP/SEAL selector
// lists in js/sonics.js, or it will be the one silent object on the
// page and read as a bug. That rule has one failure mode nothing
// catches: the component IS added, under a class name it does not
// actually have. The selector list looks complete, the tap list grows,
// and the shape stays silent — which is the same defect the rule was
// written to prevent, wearing the appearance of a fix.
//
// So this checks the register in both directions, against the built
// HTML rather than against anyone's memory of it:
//
//   1. NO SILENT COMPONENT. Every class this repository defines as a
//      major struck shape — the pillar registers in css/*.css — must
//      appear somewhere in one of the four voice lists.
//   2. NO DEAD SELECTOR. Every class-based selector in those lists
//      must match at least one element in the built site. A selector
//      matching nothing is either a typo or a component that was
//      removed, and in both cases the list is lying about its coverage.
//
// It reads the built HTML as text rather than opening a browser: these
// are class-name facts, and a headless browser to answer them would be
// slower and no more certain.

import { readFileSync, readdirSync, statSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = path.dirname(path.dirname(fileURLToPath(import.meta.url)));
let pass = 0, fail = 0;
const check = (label, cond, detail) => {
  console.log((cond ? 'PASS ' : 'FAIL ') + label + (cond || detail === undefined ? '' : ` — ${detail}`));
  cond ? pass++ : fail++;
};

// ── The register ──────────────────────────────────────────────────────
const sonics = readFileSync(path.join(ROOT, 'js/sonics.js'), 'utf8');
const lists = {};
for (const m of sonics.matchAll(/var (CHIME|SEAL|OPEN|TAP)\s*=\s*([\s\S]*?);\n/g)) {
  lists[m[1]] = m[2]
    .replace(/\/\*[\s\S]*?\*\//g, '')   // the comments explaining each group
    .replace(/[+']/g, '')
    .split(',')
    .map((s) => s.trim())
    .filter(Boolean);
}
check('All four voices are declared', Object.keys(lists).length === 4,
  Object.keys(lists).join(', '));

const registered = new Set(Object.values(lists).flat());
const classSelectors = [...registered].filter((s) => /^\.[a-z0-9_-]+$/i.test(s));

// ── Every built page, as one corpus ───────────────────────────────────
const html = (function walk(dir, acc = []) {
  for (const e of readdirSync(dir)) {
    if (e === 'node_modules' || e === '.git' || e === 'pages' || e.startsWith('.')) continue;
    const p = path.join(dir, e);
    if (statSync(p).isDirectory()) walk(p, acc);
    else if (e.endsWith('.html')) acc.push(readFileSync(p, 'utf8'));
  }
  return acc;
})(ROOT).join('\n');
check('There is built HTML to check against', html.length > 100000,
  `${Math.round(html.length / 1024)} KB`);

// ── …and every page script, as another ────────────────────────────────
// A surface built by a script is as struck as one written into the
// source. The rail on /admissions/track/ is five discs assembled by
// js/admissions-track.js and appears in no built HTML at all, so a
// corpus of HTML alone reported its class as a DEAD selector and would
// have had the register drop the voice from a component that has one.
//
// The guard keeps its teeth: a class that appears in neither corpus is
// still dead, and that is the case it exists to catch — a selector left
// behind after a component was renamed.
const scripts = readdirSync(path.join(ROOT, 'js'))
  .filter((f) => f.endsWith('.js'))
  .map((f) => readFileSync(path.join(ROOT, 'js', f), 'utf8'))
  .join('\n');

const present = (cls) => new RegExp(`class="[^"]*\\b${cls}\\b`).test(html)
  // In a script: the class name as a whole word, which is how
  // className assignments, classList calls and template strings all
  // spell it.
  || new RegExp(`(^|[^\\w-])${cls}([^\\w-]|$)`).test(scripts);

// ── 1 · No dead selector ──────────────────────────────────────────────
const dead = classSelectors.filter((s) => !present(s.slice(1)));
check(`No dead selector in the register — ${classSelectors.length} class selectors checked`,
  dead.length === 0, dead.join(', '));

// ── 2 · No silent component ───────────────────────────────────────────
// The major shapes each pillar register defines. A shape with relief
// that answers the pointer is a shape that must answer the ear too;
// surfaces with no relief stay deliberately silent and are not listed.
const MAJOR = [
  // css/pillar.css — the shared instrument
  'register__col', 'creed__item', 'tenet', 'sep__role', 'vacancy',
  // css/students.css — the matricula
  'quad__skill', 'quad__gauge', 'matricula', 'clause', 'honour',
  // css/academics.css — the ascent
  'ascent__step', 'ascent__band', 'horarium__band', 'discipline',
  // css/admissions.css — the passage
  'passage__stage', 'passage__mark', 'warrant', 'tariff__line',
  // css/governance.css — the instrument
  'article__seal', 'docket__entry', 'attest',
  // css/press.css — the imprint
  'folio', 'imprint', 'shelf__title',
  // css/console.css — the staff consoles. The medallion at the head of
  // a desk, the plate a piece of work sits on, and the plate a member
  // of staff writes an act on. The empty-desk notice (.stf-clear) is
  // deliberately absent: it is a message, not a struck object, and it
  // carries no relief — the distinction §3 draws between a surface with
  // a voice and one without.
  'stf-count', 'stf-item', 'stf-act',
];
const silent = MAJOR.filter((c) => present(c) && !registered.has('.' + c));
check(`No struck shape is silent — ${MAJOR.length} major components checked`,
  silent.length === 0, silent.map((c) => '.' + c).join(', '));

// A component listed here that no longer exists in the markup would
// make the check above vacuously true, so say so rather than pass.
const absent = MAJOR.filter((c) => !present(c));
check('Every component this test guards still exists in the built site',
  absent.length === 0, absent.map((c) => '.' + c).join(', '));

// ── 3 · Ceremony is ranked, not uniform ───────────────────────────────
// A site where everything makes the same noise is a toy. The conferral
// voice is rationed to objects that confer: seals, medallions, the
// matricula, the warrant, the imprint.
check('The conferral voice stays rationed', lists.SEAL.length < lists.TAP.length,
  `SEAL ${lists.SEAL.length} vs TAP ${lists.TAP.length}`);
check('The chime is rarest of all — it belongs to the gold call to action',
  lists.CHIME.length <= 3, `CHIME ${lists.CHIME.length}`);

console.log(`\n${pass} passed, ${fail} failed.`);
if (fail) process.exitCode = 1;
