// tests/imagery-licence.test.mjs — the licence register's own rule,
// enforced.
//
// assets/images/plates/CREDITS.md states the College's policy in its
// second sentence: "A file in this directory without a row in this
// table is a licensing incident, not an oversight." Until this file
// existed, nothing checked that. A policy that nothing enforces decays
// into a description of the past — the same failure mode as a
// generator that drifts from its output, and this repository has paid
// for that one twice.
//
// Three directions, because a licensing register can rot three ways:
//   1. a plate on disk that no row records      (unlicensed use)
//   2. a row that records a file not on disk    (stale register)
//   3. a page shipping an image from outside    (bypassing the register
//      the plates directory entirely)            and its policy)

import { readFileSync, readdirSync, existsSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = path.dirname(path.dirname(fileURLToPath(import.meta.url)));
let pass = 0, fail = 0;
const check = (label, ok, detail) => {
  if (ok) { pass++; console.log(`PASS ${label}`); }
  else { fail++; console.log(`FAIL ${label}${detail ? ` — ${detail}` : ''}`); }
};

const PLATES = path.join(ROOT, 'assets/images/plates');
const credits = readFileSync(path.join(PLATES, 'CREDITS.md'), 'utf8');
const files = readdirSync(PLATES).filter((f) => /\.(jpe?g|png|webp|avif)$/i.test(f));

// ── 1 · EVERY FILE HAS A ROW ─────────────────────────────────────────
{
  const unrecorded = files.filter((f) => !credits.includes(`\`${f}\``));
  check(`Every plate on disk is recorded in CREDITS.md — ${files.length} files`,
    unrecorded.length === 0, unrecorded.join(', '));
}

// ── 2 · EVERY ROW NAMES A FILE THAT EXISTS ───────────────────────────
// Withdrawn images are recorded by stock ID only, deliberately — the
// register says the files are not in the repository. So only rows that
// name a file with the backtick convention are held to existence.
{
  const named = [...credits.matchAll(/`([a-z0-9-]+\.(?:jpe?g|png|webp|avif))`/gi)]
    .map((m) => m[1]);
  const ghosts = [...new Set(named)].filter((f) => !existsSync(path.join(PLATES, f)));
  check('Every file the register names exists on disk',
    ghosts.length === 0, ghosts.join(', '));
}

// ── 3 · NO PAGE SHIPS A PHOTOGRAPH FROM OUTSIDE THE REGISTER ─────────
// SVG art, icons and generated diagrams live under /assets/art/ and are
// the College's own drawings — no licence question arises. Raster
// images are photographs, and a photograph reaches a page only through
// the registered directory.
{
  const PAGES = path.join(ROOT, 'pages');
  const offenders = [];
  for (const f of readdirSync(PAGES).filter((x) => x.endsWith('.html'))) {
    const body = readFileSync(path.join(PAGES, f), 'utf8');
    for (const m of body.matchAll(/<img\b[^>]*\bsrc="([^"]+)"/gi)) {
      const src = m[1];
      if (/\.svg(\?|$)/i.test(src)) continue;
      if (src.startsWith('/assets/images/')) continue; // registered tree
      if (src.startsWith('data:')) continue;           // inline, generated
      offenders.push(`${f}: ${src}`);
    }
  }
  check('Every photograph on every page comes from the registered tree',
    offenders.length === 0, offenders.slice(0, 6).join(', '));
}

console.log(`\n${pass} passed, ${fail} failed.`);
process.exit(fail ? 1 : 0);
