// tests/plate-identity.test.mjs — a photograph must not name another
// institution on this College's pages.
//
// ─────────────────────────────────────────────────────────────────────
// THE FAULT THIS EXISTS FOR
// ─────────────────────────────────────────────────────────────────────
// The Admissions pillar and Level VI both carried `colonnade.jpg`, a
// correctly licensed, correctly credited, beautifully composed
// photograph of Senate House — with **UNIVERSITY OF LONDON** carved
// across the lintel and legible at the size the plate is served.
//
// It sat a few hundred pixels from the sentence explaining that "London
// Campus" is an administrative address and that nobody attends it. A
// reader who took in both learned that this College is somehow attached
// to the University of London, which is not true and which the whole
// rest of the site is built to avoid implying. The alt text made it
// worse: "a stone colonnade running the length of a college building".
//
// Nothing about the licence was wrong. What was wrong was publishing
// another institution's name on our own pages, and it is the same rule
// that governs accreditation, partnerships and endorsements everywhere
// else here.
//
// It was found by rendering the page, and it could not have been found
// any other way: the filename said colonnade and the alt text said
// college.
//
// ─────────────────────────────────────────────────────────────────────
// WHAT THIS CAN AND CANNOT CHECK
// ─────────────────────────────────────────────────────────────────────
// A test cannot read a photograph. What it CAN do is hold the two
// decisions a person made after looking at one: that a withdrawn plate
// stays withdrawn, and that every plate in service has been examined
// and recorded in CREDITS.md. A new plate arrives undeclared and this
// fails, which puts a person in front of the image before it ships.

import { readFileSync, readdirSync, existsSync } from 'node:fs';
import path from 'node:path';
import { ROOT } from './helpers.mjs';

let pass = 0, fail = 0;
const check = (label, cond, detail) => {
  console.log((cond ? 'PASS ' : 'FAIL ') + label + (cond || detail === undefined ? '' : ` — ${detail}`));
  cond ? pass++ : fail++;
};

const PLATES = path.join(ROOT, 'assets/images/plates');
const CREDITS = readFileSync(path.join(PLATES, 'CREDITS.md'), 'utf8');

// Every page source, plus the generators that write plates into pages.
const sources = [
  ...readdirSync(path.join(ROOT, 'pages')).filter((f) => f.endsWith('.html'))
    .map((f) => ['pages/' + f, readFileSync(path.join(ROOT, 'pages', f), 'utf8')]),
  ...readdirSync(path.join(ROOT, 'scripts')).filter((f) => /^build.*\.(js|mjs)$/.test(f))
    .map((f) => ['scripts/' + f, readFileSync(path.join(ROOT, 'scripts', f), 'utf8')]),
];

// ── 1 · A WITHDRAWN PLATE STAYS WITHDRAWN ────────────────────────────
// Read from CREDITS.md rather than listed here, so withdrawing the next
// one is an edit to the register and not to this file.
{
  const withdrawn = [...CREDITS.matchAll(/`([\w.-]+\.jpe?g)`[^|]*\|[^|]*\|[^|]*\|[^|]*\|\s*\*\*Withdrawn/g)]
    .map((m) => m[1]);
  check(`The register records withdrawn plates — ${withdrawn.length}`, withdrawn.length >= 1,
    'no plate is marked **Withdrawn** in CREDITS.md; if none has been, this check has nothing to hold');

  for (const file of withdrawn) {
    const used = sources.filter(([, body]) => body.includes(file)).map(([f]) => f);
    check(`${file} is withdrawn and appears on no page or generator`,
      used.length === 0, used.join(', '));
  }
}

// ── 2 · EVERY PLATE IN SERVICE HAS BEEN LOOKED AT ────────────────────
// The register is the record that a person examined the image. A plate
// used without an entry is a plate nobody checked.
{
  const inService = new Set();
  for (const [, body] of sources) {
    for (const m of body.matchAll(/plates\/([\w.-]+\.jpe?g)/g)) inService.add(m[1]);
  }
  const undeclared = [...inService].filter((f) => !CREDITS.includes('`' + f + '`'));
  check(`Every plate in service is declared in CREDITS.md — ${inService.size} in service`,
    undeclared.length === 0,
    `${undeclared.join(', ')} used but not recorded. Look at the image, check it names no other `
    + 'institution, and add it to the register.');

  const missing = [...inService].filter((f) => !existsSync(path.join(PLATES, f)));
  check('Every plate in service is a file that exists',
    missing.length === 0, missing.join(', '));
}

// ── 3 · NO ALT TEXT CALLS SOMEBODY ELSE'S BUILDING OURS ──────────────
// The alt text is where the implication was actually made in words:
// "a college building" of a building belonging to another college. A
// plate may show a building; it may not claim the building.
{
  const OURS = /\b(?:our|the College's|WEC-LC's)\s+(?:campus|building|hall|library|quadrangle)\b/i;
  const bad = [];
  for (const [file, body] of sources) {
    for (const m of body.matchAll(/plates\/[\w.-]+\.jpe?g"\s+alt="([^"]*)"/g)) {
      if (OURS.test(m[1])) bad.push(`${file}: "${m[1].slice(0, 60)}"`);
    }
  }
  check('No plate’s alt text claims the building as the College’s own',
    bad.length === 0, bad.join(' | '));
}

// ── 4 · A PLATE THAT REQUIRES ATTRIBUTION CARRIES IT, EVERYWHERE ─────
// CREDITS.md marks two plates **Required** — reading-hall.jpg is CC BY
// 2.0 and astrolabe.jpg is CC BY-SA 3.0 — and the requirement is not
// "the repository records the photographer". It is that the credit
// appears BESIDE THE WORK, on every page the work appears on.
//
// This was written after breaking it. reading-hall.jpg was placed on
// the Faculty pillar in both editions with a caption and no credit; the
// register was correct, the licence was valid, and the two served pages
// were out of compliance. Nothing failed, because nothing was looking.
//
// The check is per PAGE rather than per repository for that exact
// reason: a credit rendered once on Academics does nothing for a reader
// on Faculty, and it is the reader's copy of the work that the licence
// governs.
{
  const required = [...CREDITS.matchAll(
    /\|\s*`([\w.-]+\.jpe?g)`\s*\|([^\n]*?)\*\*Required\*\*/g)].map((m) => m[1]);
  check(`The register marks plates that must carry a credit — ${required.length}`,
    required.length >= 1,
    'no plate in CREDITS.md is marked **Required**; if none needs attribution this check '
    + 'is guarding nothing and should be re-cut rather than left passing');

  // Read the SERVED pages: what a visitor receives is what the licence
  // is measured against, not what the source intended.
  const served = [];
  const walk = (dir) => {
    for (const e of readdirSync(dir, { withFileTypes: true })) {
      if (e.name.startsWith('.') || e.name === 'node_modules' || e.name === 'pages'
        || e.name === 'tests' || e.name === 'docs') continue;
      const full = path.join(dir, e.name);
      if (e.isDirectory()) walk(full);
      else if (e.name.endsWith('.html')) served.push([path.relative(ROOT, full), readFileSync(full, 'utf8')]);
    }
  };
  walk(ROOT);

  for (const file of required) {
    const pages = served.filter(([, body]) => body.includes(`plates/${file}`));
    check(`${file}: appears on ${pages.length} served page(s)`, pages.length >= 1);

    // The credit must be inside the same <figure> as the image, which is
    // what "beside the work" means in markup.
    const uncredited = pages.filter(([, body]) => {
      const figures = [...body.matchAll(/<figure[\s\S]*?<\/figure>/g)].map((m) => m[0]);
      const mine = figures.filter((f) => f.includes(`plates/${file}`));
      return mine.length === 0 || mine.some((f) => !/plate__credit/.test(f));
    }).map(([f]) => f);

    check(`${file}: every page that shows it renders the credit beside it`,
      uncredited.length === 0,
      `${uncredited.join(', ')} — the licence requires attribution with the work, and a credit `
      + 'on a different page of the same site does not discharge it');
  }
}

console.log(`\n${pass} passed, ${fail} failed.`);
process.exit(fail ? 1 : 0);
