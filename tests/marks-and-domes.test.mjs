// tests/marks-and-domes.test.mjs — one mark per item, one glyph per
// body, and no reserved space with nothing in it.
//
// ─────────────────────────────────────────────────────────────────────
// THE THREE FAULTS THIS EXISTS FOR
// ─────────────────────────────────────────────────────────────────────
// All three were found by rendering /governance/quality/ and looking at
// it, and none of them is visible in the source, because in every case
// each half of the fault is correct on its own.
//
// 1 · TWO MARKERS ON ONE LINE. `ul.check-list` draws a ✓ in CSS, from a
//     `::before` on the item. Several lists also carry an inline
//     `<svg class="icon">` per item, because the mark has to be chosen
//     per item — `#i-struck` where the thing is settled and `#i-ring`
//     where it is not (CLAUDE.md §5). Where both met, the item rendered
//     a tick AND a mark. It was live in three places on the tuition
//     ladder and on the External Examiner's remit, where the second
//     marker was a ✓ against work that has not happened.
//
// 2 · TWELVE MEDALLIONS, ONE GLYPH. Every dome on the quality page was
//     built with `#i-accord`. One icon reads fine while you are writing
//     the generator; twelve 106px domes carrying the same generic
//     document mark read as a fallback that failed — the "generic
//     outline icon" CLAUDE.md §1 forbids.
//
// 3 · A NUMERAL COLUMN WITH NO NUMERALS. `.dot-list` reserves 1.9em
//     plus a 22px gap for `.num`. The generator emitted
//     `<span class="num"></span>`, so nineteen rows across two pages
//     each carried about sixty pixels of empty gutter — and the heading
//     above one of them said "in this order", promising the very
//     numbers that were missing.

import { readFileSync, readdirSync, existsSync } from 'node:fs';
import path from 'node:path';
import { ROOT } from './helpers.mjs';

let pass = 0, fail = 0;
const check = (label, cond, detail) => {
  console.log((cond ? 'PASS ' : 'FAIL ') + label + (cond || detail === undefined ? '' : ` — ${detail}`));
  cond ? pass++ : fail++;
};

// Every served page, walked from the repository root.
function servedPages(dir = ROOT, out = []) {
  for (const e of readdirSync(dir, { withFileTypes: true })) {
    if (e.name.startsWith('.') || e.name === 'node_modules' || e.name === 'pages'
      || e.name === 'tests' || e.name === 'docs') continue;
    const full = path.join(dir, e.name);
    if (e.isDirectory()) servedPages(full, out);
    else if (e.name.endsWith('.html')) out.push([path.relative(ROOT, full), readFileSync(full, 'utf8')]);
  }
  return out;
}
const SERVED = servedPages();
check(`The served pages were found — ${SERVED.length}`, SERVED.length > 50);

// ── 1 · ONE MARK PER ITEM ────────────────────────────────────────────
// The rule that settles it lives in the stylesheet, because it has to
// govern every list on the site including ones not written yet. This
// asserts the rule is still there; deleting it puts every one of those
// items back to two markers at once, silently.
{
  const brand = readFileSync(path.join(ROOT, 'css/brand.css'), 'utf8');
  check('An item carrying its own mark suppresses the CSS tick',
    /ul\.check-list li:has\(> svg\.icon\)::before\s*\{\s*content:\s*none/.test(brand),
    'css/brand.css no longer suppresses `ul.check-list li::before` for items that carry an '
    + 'inline <svg class="icon">. Every such item renders a ✓ and a mark side by side.');

  check('And it keeps the hanging indent the tick had',
    /ul\.check-list li:has\(> svg\.icon\)\s*\{[^}]*display:\s*flex/.test(brand),
    'without it a two-line item wraps back to the margin and reads as two items');

  // How many items are actually relying on it, so the rule above is
  // never left guarding nothing.
  let marked = 0;
  for (const [, body] of SERVED) {
    for (const m of body.matchAll(/<ul class="check-list[^"]*">([\s\S]*?)<\/ul>/g)) {
      marked += [...m[1].matchAll(/<li\b[^>]*>\s*<svg class="icon"/g)].length;
    }
  }
  check(`Items relying on that rule — ${marked}`, marked > 0,
    'no served page has a check-list item with its own mark; if that is deliberate the rule '
    + 'above is guarding nothing and this file should be re-cut');
}

// ── 2 · NO OUTSTANDING WORK WEARS A TICK, IN CSS EITHER ──────────────
// §5's rule was enforced against `#i-struck` in markup and could not
// see a tick drawn by a stylesheet. `.check-list--open` is the open
// ring for a list of what has not happened.
{
  const brand = readFileSync(path.join(ROOT, 'css/brand.css'), 'utf8');
  check('There is an open-ring variant for lists of outstanding work',
    /ul\.check-list--open li::before\s*\{\s*content:\s*'○'/.test(brand),
    'css/brand.css defines no `.check-list--open`, so a list of what is not done yet has no '
    + 'mark to wear but the ✓ — which is the defect CLAUDE.md §5 names');
}

// ── 3 · NO DOME IS DRESSED LIKE ITS NEIGHBOUR ────────────────────────
// Per page, and only where a page carries enough domes for sameness to
// read as a fault. Two pages may share a glyph; two cards side by side
// may not.
{
  const QUALITY = ['governance/quality/index.html', 'ar/governance/quality/index.html'];
  for (const rel of QUALITY) {
    const full = path.join(ROOT, rel);
    if (!existsSync(full)) { check(`${rel} exists`, false); continue; }
    const body = readFileSync(full, 'utf8');
    const glyphs = [...body.matchAll(/class="badge-dome[^"]*"><svg class="icon"[^>]*><use href="#([\w-]+)"/g)]
      .map((m) => m[1]);
    const dup = glyphs.filter((g, i) => glyphs.indexOf(g) !== i);
    check(`${rel}: ${glyphs.length} domes, every one a different mark`,
      glyphs.length >= 13 && dup.length === 0,
      dup.length ? `${[...new Set(dup)].join(', ')} used more than once` : `only ${glyphs.length} domes found`);
  }

  // And the source of that: the data file declares one per body.
  const D = JSON.parse(readFileSync(path.join(ROOT, 'data/institution.json'), 'utf8'));
  const bodies = [D.commission, ...D.subcommittees, ...D.bodies];
  const missing = bodies.filter((b) => !b.icon).map((b) => b.code);
  check(`Every body in data/institution.json declares its own mark — ${bodies.length}`,
    missing.length === 0, `${missing.join(', ')} declare no icon`);

  const sprite = new Set([...readFileSync(path.join(ROOT, 'partials/icons.html'), 'utf8')
    .matchAll(/id="(i-[\w-]+)"/g)].map((m) => m[1]));
  const unknown = bodies.filter((b) => b.icon && !sprite.has(b.icon)).map((b) => `${b.code}:${b.icon}`);
  check('And every mark declared is in the sprite',
    unknown.length === 0,
    `${unknown.join(', ')} — a <use> pointing at nothing renders an empty dome`);
}

// ── 4 · NOTHING RESERVES SPACE AND LEAVES IT EMPTY ───────────────────
// `.dot-list .num` is the case that shipped, but the rule is general:
// an element the stylesheet gives a width to, holding nothing, is dead
// space by construction.
{
  const empty = [];
  for (const [rel, body] of SERVED) {
    const n = [...body.matchAll(/<span class="num">\s*<\/span>/g)].length;
    if (n) empty.push(`${rel} (${n})`);
  }
  check('No served page reserves a numeral column and leaves it blank',
    empty.length === 0, empty.slice(0, 5).join(', '));

  // The generators, so it cannot come back on the next build.
  const gens = readdirSync(path.join(ROOT, 'scripts'))
    .filter((f) => /^build.*\.(js|mjs)$/.test(f))
    .map((f) => ['scripts/' + f, readFileSync(path.join(ROOT, 'scripts', f), 'utf8')]);
  const bad = gens.filter(([, s]) => /<span class="num"><\/span>/.test(s)).map(([f]) => f);
  check('And no generator emits an empty one', bad.length === 0, bad.join(', '));
}

// ── 5 · AN ODD LAST CARD CLOSES ITS ROW ──────────────────────────────
// `.grid--close` is what stops a five-card or seven-card grid ending
// with one card against an empty half. If the class is used, the rule
// has to exist; if the rule is deleted the layout silently reverts.
{
  const brand = readFileSync(path.join(ROOT, 'css/brand.css'), 'utf8');
  const users = SERVED.filter(([, b]) => b.includes('grid--close')).map(([f]) => f);
  if (users.length === 0) {
    console.log('NOTE  No page uses .grid--close; nothing to hold here.');
  } else {
    check(`.grid--close is defined, and ${users.length} page(s) rely on it`,
      /\.grid--close > :last-child:nth-child\(odd\)\s*\{\s*grid-column: 1 \/ -1/.test(brand),
      'the class is on pages but css/brand.css does not define it — the odd card falls back '
      + 'to half a row beside an empty half');
  }
}

console.log(`\n${pass} passed, ${fail} failed.`);
process.exit(fail ? 1 : 0);
