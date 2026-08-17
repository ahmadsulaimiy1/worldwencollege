// scripts/parity-audit.mjs — what the Arabic reader is not being told.
//
// CLAUDE.md §4: "Every English page has an Arabic edition. They ship
// together." That has been read as a file-existence rule, and by that
// reading the site has been compliant for months: every pages/x.html
// has a pages/x.ar.html beside it.
//
// It was never a file-existence rule. /ar/about/ shipped without the
// three cards showing how a teaching position becomes a lesson plan,
// and without the grid naming the College's three functions — so an
// Arabic reader deciding whether to enrol read a shorter argument than
// an English one, on the page where the College explains what it is.
// That was found by eye, on one page, because its dome count looked
// wrong in a render audit. This finds the rest of them.
//
// WHAT IT COMPARES, and why each one is a proxy for something real:
//
//   sections / h2 / h3   whole passages present in one edition only.
//                        The headline number: a missing <h2> is a
//                        missing argument, not a missing ornament.
//   card / tenet         components carrying content.
//   dome / aurum /       the material law of CLAUDE.md §2. An Arabic
//   edge-lit             page with fewer is either missing content or
//                        wearing less of the atelier layer than its
//                        twin — both are faults, and the heading
//                        counts above say which.
//
// A NEGATIVE DELTA IS ALSO A FAULT. /ar/admissions/tuition/ carries
// ten domes MORE than its English twin. Whichever edition is ahead,
// the two disagree, and a reader in one language is getting something
// the other is not.
//
// The tool names the specific headings present in one edition and not
// the other, matched by position rather than by translation — nothing
// here can read Arabic. So it reports "the English page has 15 <h2>
// and the Arabic has 7", lists all of both, and leaves the judgement
// of which seven correspond to a person. That is the honest limit of a
// text comparison across two languages, and it is still enough to
// direct the work.
//
// USAGE
//   node scripts/parity-audit.mjs              # the table
//   node scripts/parity-audit.mjs students     # the headings for one pair
//
// PROMOTED. tests/arabic-parity.test.mjs now holds the result on every
// run: cards, tenets and .aurum exactly equal in both directions, and
// section/heading/dome/edge-lit divergence held to a per-page ratchet
// that may shrink and never grow. This file stays as the diagnostic —
// it is the one that NAMES the headings on either side, which a test
// reporting a count cannot do, and it is what to run when the test
// fails.

import { readFileSync, readdirSync, existsSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = path.dirname(path.dirname(fileURLToPath(import.meta.url)));
const PAGES = path.join(ROOT, 'pages');
const ONLY = process.argv[2];

// Authoring comments are not content, and both editions carry long
// ones. Counting <h2> inside a comment reports a gap that is not there.
const strip = (h) => h.replace(/<!--[\s\S]*?-->/g, ' ');

const MEASURES = [
  ['section', /<section\b/g],
  ['h2', /<h2[\s>]/g],
  ['h3', /<h3[\s>]/g],
  ['card', /class="card[\s"]/g],
  ['tenet', /class="tenet[\s"]/g],
  ['dome', /badge-dome\b/g],
  ['aurum', /\baurum\b/g],
  ['edge-lit', /\bedge-lit\b/g],
];

const headings = (body) =>
  [...body.matchAll(/<h2[^>]*>([\s\S]*?)<\/h2>/g)]
    .map((m) => m[1].replace(/<[^>]+>/g, '').replace(/\s+/g, ' ').trim());

const pairs = readdirSync(PAGES)
  .filter((f) => f.endsWith('.html') && !f.endsWith('.ar.html'))
  .sort()
  .map((f) => [f, f.replace(/\.html$/, '.ar.html')]);

let differing = 0;
let missingEditions = 0;
const rows = [];

for (const [en, ar] of pairs) {
  if (!existsSync(path.join(PAGES, ar))) {
    console.log(`NO ARABIC EDITION  ${en}`);
    missingEditions++;
    continue;
  }
  const enBody = strip(readFileSync(path.join(PAGES, en), 'utf8'));
  const arBody = strip(readFileSync(path.join(PAGES, ar), 'utf8'));

  const deltas = MEASURES
    .map(([name, re]) => {
      const e = (enBody.match(re) || []).length;
      const a = (arBody.match(re) || []).length;
      return [name, e, a];
    })
    .filter(([, e, a]) => e !== a);

  if (!deltas.length) continue;
  differing++;
  rows.push({ en, ar, deltas, enBody, arBody });
}

const name = (f) => f.replace(/\.html$/, '');

if (ONLY) {
  const row = rows.find((r) => name(r.en) === ONLY || r.en === ONLY);
  if (!row) {
    console.log(`${ONLY}: no structural difference, or no such page.`);
    process.exit(0);
  }
  console.log(`\n${row.en}  vs  ${row.ar}\n`);
  for (const [k, e, a] of row.deltas) {
    const arrow = e > a ? 'Arabic is short by' : 'English is short by';
    console.log(`  ${k.padEnd(9)} ${String(e).padStart(3)} / ${String(a).padStart(3)}   ${arrow} ${Math.abs(e - a)}`);
  }
  const eh = headings(row.enBody);
  const ah = headings(row.arBody);
  console.log(`\n  ENGLISH <h2> (${eh.length})`);
  eh.forEach((h, i) => console.log(`    ${String(i + 1).padStart(2)}. ${h}`));
  console.log(`\n  ARABIC <h2> (${ah.length})`);
  ah.forEach((h, i) => console.log(`    ${String(i + 1).padStart(2)}. ${h}`));
  console.log();
  process.exit(0);
}

const W = Math.max(...rows.map((r) => name(r.en).length), 12);
console.log(`${'page'.padEnd(W)}  ${MEASURES.map(([k]) => k.padStart(9)).join('')}`);
for (const r of rows) {
  const cells = MEASURES.map(([k]) => {
    const d = r.deltas.find(([n]) => n === k);
    return (d ? `${d[1]}/${d[2]}` : '·').padStart(9);
  }).join('');
  console.log(`${name(r.en).padEnd(W)}  ${cells}`);
}
console.log(`\n${differing} pair(s) differ · ${missingEditions} without an Arabic edition`);
console.log('Run with a page name for its headings, e.g. node scripts/parity-audit.mjs students');
