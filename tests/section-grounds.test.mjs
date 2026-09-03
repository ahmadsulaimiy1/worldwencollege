// Run with: node tests/section-grounds.test.mjs
//
// EVERY GROUND CARRIES ITS BASE CLASS.
//
// css/brand.css defines four extra grounds — oxford and midnight on the
// dark side, warm, cream and pearl on the light — and it makes a
// deliberate architectural choice about them, written in the file:
//
//   "The four new dark grounds need every rule that currently keys off
//    `.section--dark` / `.section--deep`. Rather than appending two more
//    selectors to each of the ~20 rules that do so — which is how a
//    stylesheet quietly acquires a maintenance tax — the two new dark
//    grounds simply also carry `.section--dark` in the markup."
//
// That is a good decision and it was not enforced. Twenty-eight
// sections across the site used `.section--oxford` or
// `.section--midnight` on their own, so about twenty typography rules
// never reached them: `.form-note` stayed slate on navy at 2.34:1,
// `.callout` kept its light ground, `.field label` kept its light ink.
// Found by measuring text contrast on all 186 routes, not by reading
// the markup — which is exactly the kind of drift a convention with no
// guard behind it produces.
//
// This is the guard. A ground modifier without its base class fails the
// build, and the message says which class to add.
import { readFileSync, readdirSync, existsSync } from 'node:fs';
import path from 'node:path';
import { ROOT } from './helpers.mjs';

let pass = 0, fail = 0;
const check = (label, cond, detail) => {
  console.log((cond ? 'PASS ' : 'FAIL ') + label + (cond || detail === undefined ? '' : ` — ${detail}`));
  cond ? pass++ : fail++;
};

const DARK = ['oxford', 'midnight'];
const LIGHT = ['warm', 'cream', 'pearl'];

// The sources, plus the hand-maintained routes that are not generated
// from pages/ — a guard that only reads pages/ would miss the wizard
// and the portal, which is the same blind spot the header partial had.
const files = readdirSync(path.join(ROOT, 'pages'))
  .filter((f) => f.endsWith('.html'))
  .map((f) => path.join('pages', f));
for (const f of [
  'admissions/apply/index.html', 'ar/admissions/apply/index.html',
  'student-portal/index.html', 'ar/student-portal/index.html',
  'student-portal/preview/index.html',
  'admissions/track/index.html', 'ar/admissions/track/index.html',
  'student-portal/payment-complete/index.html',
  'ar/student-portal/payment-complete/index.html',
]) { if (existsSync(path.join(ROOT, f))) files.push(f); }

const offences = [];
for (const rel of files) {
  const html = readFileSync(path.join(ROOT, rel), 'utf8');
  const attrs = html.match(/class="[^"]*"/g) || [];
  attrs.forEach((attr) => {
    const classes = attr.slice(7, -1).split(/\s+/);
    for (const g of DARK) {
      if (classes.includes(`section--${g}`) && !classes.includes('section--dark')) {
        offences.push(`${rel}: section--${g} without section--dark`);
      }
    }
    for (const g of LIGHT) {
      if (classes.includes(`section--${g}`) && !classes.includes('section--light')) {
        offences.push(`${rel}: section--${g} without section--light`);
      }
    }
  });
}

check(`${files.length} source and standalone pages read`, files.length > 100, String(files.length));
check('Every dark ground modifier carries .section--dark, and every light one .section--light',
  offences.length === 0, offences.slice(0, 6).join(' · '));

// The other half of the contract: the stylesheet must actually define
// the pairing, or the base class would repaint the ground it is meant
// to leave alone.
const brand = readFileSync(path.join(ROOT, 'css/brand.css'), 'utf8');
for (const g of DARK) {
  check(`css/brand.css pairs .section--dark with .section--${g}`,
    brand.includes(`.section--dark.section--${g}`));
}
for (const g of LIGHT) {
  check(`...and .section--light with .section--${g}`,
    brand.includes(`.section--light.section--${g}`));
}

console.log(`\n${pass} passed, ${fail} failed.`);
process.exit(fail ? 1 : 0);
