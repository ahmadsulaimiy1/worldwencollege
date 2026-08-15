// THE DIAGRAM AND THE POLICY IT DEPICTS
//
// assets/art/award-standard.svg draws the honours ladder: for each band,
// an overall mark and the floor beneath which no single skill may fall.
// Those four pairs of numbers also appear, independently, in the tables
// that scripts/build-students.js and scripts/build-arabic.js render onto
// /students/assessment/ and /students/awards/.
//
// Two copies of the same policy is exactly the arrangement that goes
// wrong quietly. A drawing is the worst place for it to go wrong,
// because nobody proof-reads a picture: the table would be corrected,
// the SVG would keep the old thresholds, and the page would show a
// reader two different standards on one screen without anything failing.
//
// So this holds them together. It reads the numbers back out of the
// generated SVG — not out of the generator's source — because the SVG is
// what actually ships.

import { readFileSync, existsSync } from 'node:fs';
import path from 'node:path';
import { ROOT } from './helpers.mjs';

let pass = 0, fail = 0;
const check = (label, cond, detail) => {
  console.log((cond ? 'PASS ' : 'FAIL ') + label + (cond || detail === undefined ? '' : ` — ${detail}`));
  cond ? pass++ : fail++;
};

const svgPath = path.join(ROOT, 'assets/art/award-standard.svg');
const arPath = path.join(ROOT, 'assets/art/award-standard.ar.svg');
const students = readFileSync(path.join(ROOT, 'scripts/build-students.js'), 'utf8');

check('The award diagram has been generated', existsSync(svgPath));
check('...and its Arabic edition too', existsSync(arPath));
if (!existsSync(svgPath)) { console.log(`\n${pass} passed, ${fail} failed.`); process.exit(1); }

const svg = readFileSync(svgPath, 'utf8');

// The four calculated bands, as the honours table publishes them.
const BANDS = [
  { name: 'Pass', overall: 70, floor: 60 },
  { name: 'Merit', overall: 80, floor: 70 },
  { name: 'Distinction', overall: 88, floor: 80 },
  { name: 'High Distinction', overall: 94, floor: 88 },
];

// ── 1 · The table on the page still says what this test assumes ───────
for (const b of BANDS) {
  const row = new RegExp(
    `<strong>${b.name}</strong></td><td>(?:\\$\\{PASS_PCT\\}|${b.overall})%</td><td>No skill below ${b.floor}%`
  );
  check(`The honours table publishes ${b.name} at ${b.overall}% / floor ${b.floor}%`,
    row.test(students));
}

// ── 2 · The drawing carries the same numbers ──────────────────────────
// Every threshold appears as its own <text> in the SVG, so a missing or
// altered one is detectable without parsing geometry.
const labels = [...svg.matchAll(/>(\d{2})%</g)].map((m) => Number(m[1]));
for (const b of BANDS) {
  check(`The diagram plots ${b.name}'s overall mark (${b.overall}%)`,
    labels.includes(b.overall));
  check(`...and its floor (${b.floor}%)`, labels.includes(b.floor));
}

// ── 3 · The band names are on the drawing, in full ────────────────────
for (const b of BANDS) {
  check(`The diagram names ${b.name}`, svg.includes(`>${b.name}<`));
}

// ── 4 · The fifth honour is present and NOT plotted ───────────────────
// Distinction of the College is conferred by decision and never
// calculated. Giving it a percentage would be a lie in the shape of a
// diagram, so it must appear by name and carry no threshold of its own.
check('The diagram names Distinction of the College',
  svg.includes('Distinction of the College'));
check('...and states that it is conferred by decision rather than calculated',
  /conferred by decision, never calculated/i.test(svg));

// ── 5 · The accessibility contract ────────────────────────────────────
// For a reader who cannot see it, the description IS the diagram, so it
// has to carry the numbers rather than describe the picture.
check('The diagram has a title and a description', /<title[ >]/.test(svg) && /<desc[ >]/.test(svg));
const desc = (svg.match(/<desc[^>]*>([\s\S]*?)<\/desc>/) || [, ''])[1];
for (const b of BANDS) {
  check(`The description states ${b.name}'s numbers for a reader who cannot see the drawing`,
    desc.includes(String(b.overall)) && desc.includes(String(b.floor)));
}
check('...and that nothing has been conferred on anyone',
  /conferred on anyone/i.test(desc));

// ── 6 · The Arabic edition plots the same policy ──────────────────────
if (existsSync(arPath)) {
  const ar = readFileSync(arPath, 'utf8');
  const arLabels = [...ar.matchAll(/>(\d{2})%</g)].map((m) => Number(m[1]));
  const missing = BANDS.flatMap((b) =>
    [b.overall, b.floor].filter((v) => !arLabels.includes(v)));
  check('The Arabic diagram plots every threshold the English one does',
    missing.length === 0, missing.join(', '));
  // Percentages inside an RTL drawing must be forced left-to-right, or
  // the bidi algorithm reorders them and "70%" renders reversed. A
  // mirrored number is not a styling flaw; it is a wrong number.
  check('...and forces its numerals left-to-right so they do not mirror',
    (ar.match(/direction="ltr"/g) || []).length >= BANDS.length * 2);
}

console.log(`\n${pass} passed, ${fail} failed.`);
process.exit(fail ? 1 : 0);
