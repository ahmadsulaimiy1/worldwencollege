// tests/arabic-parity.test.mjs — the Arabic reader gets the same argument.
//
// ─────────────────────────────────────────────────────────────────────
// WHY THIS IS A TEST NOW
// ─────────────────────────────────────────────────────────────────────
// CLAUDE.md §4: "Every English page has an Arabic edition. They ship
// together." That was read for months as a file-existence rule, and by
// that reading the site was compliant: every pages/x.html had an
// x.ar.html beside it. It was never a file-existence rule. /ar/about/
// shipped without the cards showing how a teaching position becomes a
// lesson plan; /ar/governance/ shipped without seventeen cards, without
// the six that explain who controls a credential check, and with the
// refund policy still stamped NOT ADOPTED three days after adoption —
// so an Arabic reader deciding whether to enrol read a shorter and
// staler argument than an English one.
//
// scripts/parity-audit.mjs found those by comparing structure. Its own
// closing note said "this is a report, not a test, and deliberately so:
// it currently fails on fifteen pairs. Promote it to tests/ when it
// reaches zero." It has reached zero on the measures that carry content.
//
// ─────────────────────────────────────────────────────────────────────
// WHAT IS HELD EXACTLY, AND WHAT IS NOT
// ─────────────────────────────────────────────────────────────────────
// CARDS, TENETS AND .aurum are held exactly, in both directions. A card
// is a unit of argument; a missing one is a paragraph the other language
// never gets, and an extra one is the same fault pointing the other way.
//
// SECTIONS, HEADINGS, DOMES AND .edge-lit are held to a documented
// allowance, because two languages may legitimately divide the same
// argument differently — /ar/governance/ splits one English leaf into
// two, which costs a section wrapper and a heading and changes nothing a
// reader receives. The allowance is per page, defaults to zero, and is
// a ratchet: every entry is a debt that may shrink and must never grow.
// A new page with any divergence fails on the spot.
//
// The rendered pages are the final authority and they agree exactly —
// /governance/ and /ar/governance/ both render 70 major shapes, 64
// aurum, 64 edge-lit, 56 domes. This file is the cheap guard that runs
// on every change; tests/browser/pillar-audit.mjs is the expensive one.

import { readFileSync, readdirSync, existsSync } from 'node:fs';
import path from 'node:path';
import { ROOT } from './helpers.mjs';

let pass = 0, fail = 0;
const check = (label, cond, detail) => {
  console.log((cond ? 'PASS ' : 'FAIL ') + label + (cond || detail === undefined ? '' : ` — ${detail}`));
  cond ? pass++ : fail++;
};

const PAGES = path.join(ROOT, 'pages');

// Authoring comments are not content, and both editions carry long ones.
// Counting an <h2> inside a comment reports a gap that is not there.
const strip = (h) => h.replace(/<!--[\s\S]*?-->/g, ' ');

const EXACT = [
  ['card', /class="card[\s"]/g],
  ['tenet', /class="tenet[\s"]/g],
  ['aurum', /\baurum\b/g],
];

const BOUNDED = [
  ['section', /<section\b/g],
  ['h2', /<h2[\s>]/g],
  ['h3', /<h3[\s>]/g],
  ['dome', /badge-dome\b/g],
  ['edge-lit', /\bedge-lit\b/g],
];

// THE RATCHET. Each number is the largest divergence tolerated on that
// measure for that page, and every one of them is a debt with a reason.
//
//   governance — the Arabic edition splits the English leaf on the two
//   academic bodies into two leaves, one naming each. That costs a
//   <section>, an <h2>, and the sub-heads and ornament counts that ride
//   on them. Every card of argument is present in both; the rendered
//   pages agree exactly.
//
// To pay a debt down: close the gap, then lower the number. Never raise
// one to make a build pass — a raised ratchet is a silent regression.
const ALLOWANCE = {
  'governance.html': { section: 1, h2: 1, h3: 3, dome: 3, 'edge-lit': 3 },
};

const pairs = readdirSync(PAGES)
  .filter((f) => f.endsWith('.html') && !f.endsWith('.ar.html'))
  .sort()
  .map((f) => [f, f.replace(/\.html$/, '.ar.html')]);

check(`Every English page is paired for comparison — ${pairs.length}`, pairs.length > 25);

const missing = pairs.filter(([, ar]) => !existsSync(path.join(PAGES, ar)));
check('Every English page has an Arabic edition',
  missing.length === 0, missing.map(([en]) => en).join(', '));

const exactFaults = [];
const boundedFaults = [];
const slack = [];

for (const [en, ar] of pairs) {
  if (!existsSync(path.join(PAGES, ar))) continue;
  const e = strip(readFileSync(path.join(PAGES, en), 'utf8'));
  const a = strip(readFileSync(path.join(PAGES, ar), 'utf8'));
  const allow = ALLOWANCE[en] || {};

  for (const [name, re] of EXACT) {
    const ec = (e.match(re) || []).length;
    const ac = (a.match(re) || []).length;
    if (ec !== ac) exactFaults.push(`${en}: ${name} ${ec} vs ${ac}`);
  }

  for (const [name, re] of BOUNDED) {
    const ec = (e.match(re) || []).length;
    const ac = (a.match(re) || []).length;
    const delta = Math.abs(ec - ac);
    const budget = allow[name] || 0;
    if (delta > budget) boundedFaults.push(`${en}: ${name} ${ec} vs ${ac} (allowed ${budget})`);
    else if (budget > delta) slack.push(`${en}: ${name} allows ${budget}, actual ${delta}`);
  }
}

check(`No edition is short of the other by a card, a tenet or a struck surface — ${pairs.length} pairs`,
  exactFaults.length === 0, exactFaults.join('; '));

check('No structural divergence exceeds its documented allowance',
  boundedFaults.length === 0, boundedFaults.join('; '));

// A ratchet that is never tightened stops being a ratchet. This does not
// fail the build — the debt is already paid, which is good news — but it
// prints the exact line to lower, so the allowance cannot quietly become
// a permanent licence.
if (slack.length) {
  console.log('NOTE  the ratchet is looser than the site now needs. Lower these in ALLOWANCE:');
  for (const l of slack) console.log(`        ${l}`);
}

// The allowance must not name a page that no longer exists, or it will
// sit there forgiving a divergence on a file nobody has.
const stale = Object.keys(ALLOWANCE).filter((f) => !existsSync(path.join(PAGES, f)));
check('The allowance names only pages that exist', stale.length === 0, stale.join(', '));

console.log(`\n${pass} passed, ${fail} failed.`);
process.exit(fail ? 1 : 0);
