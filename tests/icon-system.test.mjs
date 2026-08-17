// The icon sprite, and the three ways it quietly rots.
//
// Icons are the part of a design system nobody tests, because a wrong
// one still renders. The three failures below are all invisible in a
// diff and all embarrassing in front of a reader:
//
//   1. A <use href="#i-something"> naming a symbol that is not in the
//      sprite. The browser draws NOTHING — no error, no fallback, just a
//      gap where a mark should be.
//   2. Two tiles in the same group carrying the same glyph, which is how
//      the six level tiles all ended up as #i-laurel: the mark stops
//      distinguishing anything and becomes decoration.
//   3. A symbol drawn to a different convention from the rest, which is
//      the single most common way an institutional site gives itself
//      away as assembled from a template.

import { readFileSync, readdirSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
let passed = 0, failed = 0;
function check(name, ok, detail) {
  if (ok) { passed++; console.log('PASS ' + name); }
  else { failed++; console.log('FAIL ' + name + (detail ? ' — ' + detail : '')); }
}

const sprite = readFileSync(path.join(ROOT, 'partials', 'icons.html'), 'utf8');
const symbols = new Set([...sprite.matchAll(/<symbol id="(i-[a-z0-9-]+)"/g)].map((m) => m[1]));

// ---------------------------------------------------------------------
// 1 · Every referenced symbol exists
// ---------------------------------------------------------------------
const sources = [];
for (const dir of ['partials', 'pages', 'scripts']) {
  for (const f of readdirSync(path.join(ROOT, dir))) {
    if (f.endsWith('.html') || f.endsWith('.js')) sources.push(path.join(ROOT, dir, f));
  }
}
for (const f of readdirSync(ROOT)) if (f.endsWith('.html')) sources.push(path.join(ROOT, f));

const referenced = new Map();
for (const f of sources) {
  const src = readFileSync(f, 'utf8');
  for (const m of src.matchAll(/<use href="#(i-[a-z0-9-]+)"/g)) {
    if (!referenced.has(m[1])) referenced.set(m[1], path.relative(ROOT, f));
  }
}
const dangling = [...referenced.keys()].filter((id) => !symbols.has(id));
check(`Every referenced icon exists in the sprite — ${referenced.size} referenced, ${symbols.size} drawn`,
  dangling.length === 0, dangling.map((d) => `${d} (${referenced.get(d)})`).join(', '));

// ---------------------------------------------------------------------
// 2 · No two tiles in one footer group share a glyph
// ---------------------------------------------------------------------
// Within a group the mark's whole job is to tell one destination from
// another. Two the same means one of them is decoration.
const dupes = [];
for (const partial of ['footer.html', 'footer.ar.html']) {
  const src = readFileSync(path.join(ROOT, 'partials', partial), 'utf8');
  const groups = src.split(/<h2 class="footergrid__heading">/).slice(1);
  for (const g of groups) {
    const body = g.split('<div class="footerlinks')[0];
    const ids = [...body.matchAll(/footergrid__tile">[\s\S]*?<use href="#(i-[a-z0-9-]+)"/g)].map((m) => m[1]);
    const seen = new Set(), dup = new Set();
    for (const id of ids) { if (seen.has(id)) dup.add(id); seen.add(id); }
    if (dup.size) {
      const label = (g.match(/>\s*([^<]{2,40})/) || [, '?'])[1].trim();
      dupes.push(`${partial} “${label}”: ${[...dup].join(', ')}`);
    }
  }
}
check('No two tiles in a footer group share a glyph', dupes.length === 0, dupes.join(' | '));

// ---------------------------------------------------------------------
// 3 · The six level marks are distinct from each other
// ---------------------------------------------------------------------
// The specific regression this set was drawn to fix. If a future edit
// points two levels at one symbol, a reader can no longer tell which
// level a tile leads to without reading the label.
const levelIds = [1, 2, 3, 4, 5, 6].map((n) => `i-level-${n}`);
const missingLevels = levelIds.filter((id) => !symbols.has(id));
check('All six level marks are drawn', missingLevels.length === 0, missingLevels.join(', '));

const levelBodies = levelIds
  .map((id) => (sprite.match(new RegExp(`<symbol id="${id}"[\\s\\S]*?</symbol>`)) || [''])[0])
  .filter(Boolean);
check('The six level marks are distinct drawings',
  new Set(levelBodies).size === levelBodies.length,
  `${new Set(levelBodies).size} distinct of ${levelBodies.length}`);

// ---------------------------------------------------------------------
// 4 · Every symbol keeps the set's drawing convention
// ---------------------------------------------------------------------
// 24x24 grid, no fills. A symbol on a different grid renders at a
// different optical weight beside its neighbours, which is exactly the
// "collected from three libraries" look the sprite's own note warns
// against.
const offGrid = [], filled = [];
for (const m of sprite.matchAll(/<symbol id="(i-[a-z0-9-]+)" viewBox="([^"]*)"([\s\S]*?)<\/symbol>/g)) {
  if (m[2].trim() !== '0 0 24 24') offGrid.push(`${m[1]} (${m[2]})`);
  if (/fill="(?!none)[^"]+"/.test(m[3])) filled.push(m[1]);
}
check(`Every symbol is on the 24x24 grid — ${symbols.size} symbols`, offGrid.length === 0, offGrid.join(', '));
check('No symbol carries a hard fill', filled.length === 0, filled.join(', '));

console.log(`\n${passed} passed, ${failed} failed.`);
if (failed) process.exitCode = 1;
