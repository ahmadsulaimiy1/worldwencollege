// tests/level-generators.test.mjs — the generators still own their pages.
//
// THE FAULT THIS EXISTS TO CATCH, recorded because it cost six pages.
//
// scripts/build-levels.js writes pages/study-level-{1..6}.html and
// scripts/build-arabic-levels.js writes their Arabic twins. Both emitted
// `<div class="card">` and nothing else, while the twelve pages on disk
// carried the full atelier layer of CLAUDE.md §2 — the travelling light,
// the lit rim, the tilt and its sheen, live metal, and a 106px dome on
// every card. The layer had been added to the FILES by a later pass and
// never to the generators.
//
// So the generators and their own output had silently diverged, and
// running either one stripped 46 domes off six pages with no error and
// no warning. It was found by running it, mid-task, for an unrelated
// reason. Nothing would have caught it otherwise: the pages were
// correct, the tests passed, and the trap was armed for whoever next
// touched the curriculum.
//
// This asserts the only property that keeps a generator true: running it
// changes nothing. If a page needs an edit, the edit belongs in the
// generator — and if the generator needs a new capability to express the
// edit, that is the work, not a hand-patch to the page.
//
// It runs the real generators against the real database, into a scratch
// copy of pages/, and never writes to the tree.

import { execFileSync } from 'node:child_process';
import { readFileSync, mkdtempSync, cpSync, rmSync, existsSync } from 'node:fs';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = path.dirname(path.dirname(fileURLToPath(import.meta.url)));
let pass = 0, fail = 0;
const check = (label, ok, detail) => {
  if (ok) { pass++; console.log(`PASS ${label}`); }
  else { fail++; console.log(`FAIL ${label}${detail ? ` — ${detail}` : ''}`); }
};

const LEVELS = [1, 2, 3, 4, 5, 6];
const pageFor = (n, ar) => path.join('pages', `study-level-${n}${ar ? '.ar' : ''}.html`);

// Snapshot every page the two generators own, run them, compare, restore.
// Restoring from the snapshot rather than from git means a working tree
// with uncommitted edits survives this test intact.
//
// pages/academics.html is on this list although neither generator
// writes it any more, and that is the point: build-levels.js used to,
// from a 267-line template it had stopped maintaining, and a single run
// replaced the 715-line curriculum document with the table page it
// superseded. The template is deleted; this keeps watch on the page it
// used to destroy.
const owned = [
  ...LEVELS.map((n) => pageFor(n, false)),
  ...LEVELS.map((n) => pageFor(n, true)),
  path.join('pages', 'academics.html'),
];

const before = new Map();
for (const rel of owned) {
  const full = path.join(ROOT, rel);
  before.set(rel, existsSync(full) ? readFileSync(full, 'utf8') : null);
}

const missing = owned.filter((rel) => before.get(rel) === null);
check(`Every page the level generators touch exists — ${owned.length} expected`,
  missing.length === 0, missing.join(', '));

const backup = mkdtempSync(path.join(tmpdir(), 'wec-levels-'));
for (const rel of owned) {
  if (before.get(rel) !== null) {
    cpSync(path.join(ROOT, rel), path.join(backup, path.basename(rel)));
  }
}

const drifted = [];
try {
  for (const script of ['build-levels.js', 'build-arabic-levels.js']) {
    execFileSync(process.execPath, [path.join('scripts', script)],
      { cwd: ROOT, stdio: 'pipe' });
  }
  for (const rel of owned) {
    const now = readFileSync(path.join(ROOT, rel), 'utf8');
    if (now !== before.get(rel)) {
      // Report the first differing line, which is almost always enough
      // to name what the generator has stopped emitting.
      const a = before.get(rel).split('\n');
      const b = now.split('\n');
      const i = a.findIndex((line, k) => line !== b[k]);
      drifted.push(`${rel}:${i + 1}\n      page: ${(a[i] || '').trim().slice(0, 90)}\n      gen:  ${(b[i] || '').trim().slice(0, 90)}`);
    }
  }
} finally {
  // Put the tree back exactly as it was, whatever happened above.
  for (const rel of owned) {
    if (before.get(rel) !== null) {
      cpSync(path.join(backup, path.basename(rel)), path.join(ROOT, rel));
    }
  }
  rmSync(backup, { recursive: true, force: true });
}

check('Regenerating changes nothing — the six levels, their Arabic twins, and /academics/',
  drifted.length === 0,
  drifted.length ? `\n    ${drifted.join('\n    ')}` : undefined);

// And the property the divergence destroyed, asserted directly, so that
// a generator cannot be "in sync" with twelve pages that have all lost
// the layer together.
{
  const bare = [];
  for (const rel of owned) {
    if (rel.endsWith('academics.html')) continue;
    const body = before.get(rel);
    if (body === null) continue;
    const cards = (body.match(/<div class="card[^"]*"/g) || []);
    const struck = cards.filter((c) => c.includes('aurum')).length;
    if (cards.length === 0 || struck !== cards.length) {
      bare.push(`${rel}: ${cards.length - struck} of ${cards.length} cards bare`);
    }
  }
  check('Every card on every level page wears the material law — CLAUDE.md §2',
    bare.length === 0, bare.join(' · '));
}

console.log(`\n${pass} passed, ${fail} failed.`);
process.exit(fail ? 1 : 0);
