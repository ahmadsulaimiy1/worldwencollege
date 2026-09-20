/**
 * THE ADVANCE TABLE — measured once, so no plate has to guess again.
 *
 * ────────────────────────────────────────────────────────────────────
 * WHY THIS EXISTS
 * ────────────────────────────────────────────────────────────────────
 * An <svg> clips to its viewBox in silence. A caption set three units
 * too far right is not an error and not a warning: it simply stops
 * being drawn, mid-word, and the plate still looks finished. It
 * happened three times while the figure library was built, and twice
 * the correction was an ESTIMATE of how wide the text would set. Both
 * estimates were wrong, in the same direction, for the same reason:
 * a glyph's advance is a property of the typeface, and no amount of
 * reasoning about it substitutes for asking the typeface.
 *
 * So this asks. It renders every character the plates can set, in
 * every face and weight they set it in, and records the advance as a
 * fraction of the em. `figures.mjs` sums the table to size its own
 * gutters, and `tests/figures.test.mjs` renders the result and proves
 * the sum held.
 *
 * ────────────────────────────────────────────────────────────────────
 * WHY IT IS MEASURED AT MANY SIZES, AND AT THE DECLARED ONE
 * ────────────────────────────────────────────────────────────────────
 * Newsreader carries an optical-size axis, so its advances are not
 * constant: set small the face opens up and widens, set at reading
 * size it tightens, and at display size it widens again. The table
 * therefore records the WIDEST advance each character takes anywhere
 * in the range the plates use, so that summing it gives a ceiling
 * rather than a guess.
 *
 * THE SIZE THAT MATTERS IS THE DECLARED ONE, NOT THE RENDERED ONE, and
 * getting that wrong is what made the first version of this table
 * useless. A plate is authored in a 168-unit viewBox and printed about
 * 620px wide, so `font-size="6"` reaches the screen at 22px — but
 * `font-optical-sizing: auto` keys off the COMPUTED font-size, which is
 * still 6. Newsreader at opsz 6 is a caption design and sets 0.596 em
 * per character; at opsz 22 it is a text design and sets 0.464. A
 * table measured at the rendered pixel size therefore under-charged
 * every serif label in the library by nearly a third, which is a worse
 * error than the guesses it replaced. Sizes below are declared sizes,
 * sampled densely where the axis moves fastest.
 *
 * Run: node scripts/publication/measure-advances.mjs
 */
import { chromium } from 'playwright';
import { readFileSync, writeFileSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..');
const CHROME = '/opt/pw-browsers/chromium-1194/chrome-linux/chrome';
const OUT = path.join(ROOT, 'scripts/publication/advances.json');

const DATA = "'Archivo','Liberation Sans',sans-serif";
const SERIF = "'Newsreader','Bitstream Charter',serif";

/* The faces and weights the plates set. A combination missing here is
   a combination `figures.mjs` must not use — `setWidth` throws on one
   it has no table for, rather than quietly guessing. */
const FACES = {
  'data:400': { family: DATA, weight: 400 },
  'data:500': { family: DATA, weight: 500 },
  'data:600': { family: DATA, weight: 600 },
  'data:700': { family: DATA, weight: 700 },
  'serif:400': { family: SERIF, weight: 400 },
  'serif:500': { family: SERIF, weight: 500 },
  'serif:600': { family: SERIF, weight: 600 },
  'serif:700': { family: SERIF, weight: 700 },
};

/* DECLARED sizes, spanning every size the plates set — 4.9 at the
   smallest annotation to 23 at the largest struck figure — with a
   margin either side and dense sampling under 10, where the optical
   axis moves most. */
const SIZES = [4, 4.4, 4.8, 5, 5.2, 5.4, 5.6, 5.8, 6, 6.2, 6.4, 6.8,
  7, 7.4, 7.6, 8, 8.5, 9, 10, 10.5, 12, 13, 15, 17, 20, 23, 26];

/* And a margin on top, because a size BETWEEN two samples sets
   slightly differently again. The axis is smooth and the samples are
   close, so two per cent covers the interpolation with room. */
const MARGIN = 1.02;

const CHARS = [];
for (let c = 0x20; c <= 0x7e; c += 1) CHARS.push(String.fromCharCode(c));
CHARS.push('−', '–', '—', '×', '·', '’', '“', '”', '£', '€', '½', '¼', '°');

const FACES_CSS = readFileSync(path.join(ROOT, 'assets/fonts/monograph-faces.css'), 'utf8');
const esc = (v) => v.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');

const browser = await chromium.launch({ executablePath: CHROME });
const page = await browser.newPage({ viewport: { width: 1200, height: 800 } });

const table = {};
for (const [key, f] of Object.entries(FACES)) {
  const widest = new Array(CHARS.length).fill(0);
  for (const size of SIZES) {
    /* Twenty of each character, so rounding in the layout engine is
       divided by twenty rather than carried into the table. */
    const nodes = CHARS.map((c, i) => `<text id="c${i}" xml:space="preserve" x="0" y="${20 + i * 2}"
      font-family="${f.family}" font-size="${size}" font-weight="${f.weight}"
      >${esc(c.repeat(20))}</text>`).join('');
    await page.setContent(`<!doctype html><meta charset="utf-8"><style>${FACES_CSS}</style>
      <svg width="20000" height="${CHARS.length * 2 + 40}" style="visibility:hidden">${nodes}</svg>`,
    { waitUntil: 'load' });
    await page.evaluate(() => document.fonts.ready);
    const got = await page.evaluate((n) => Array.from({ length: n },
      (_, i) => document.getElementById('c' + i).getComputedTextLength()), CHARS.length);
    got.forEach((w, i) => { widest[i] = Math.max(widest[i], w / 20 / size); });
  }
  table[key] = Object.fromEntries(CHARS.map((c, i) => [c, Math.ceil(widest[i] * MARGIN * 10000) / 10000]));
}
await browser.close();

/* The fallback is the widest glyph in the face, so a character the
   table has never seen is charged at the worst rate rather than at
   nothing — an unmeasured character must not make a string look
   narrower than it sets. */
const out = {
  note: 'Generated by scripts/publication/measure-advances.mjs. Advances are '
    + 'fractions of the em, taken as the widest the character sets anywhere in '
    + "the publication's size range. Do not hand-edit.",
  sizesPx: SIZES,
  widest: Object.fromEntries(Object.keys(table).map((k) => [k, Math.max(...Object.values(table[k]))])),
  advance: table,
};
writeFileSync(OUT, `${JSON.stringify(out, null, 1)}\n`);
console.log(`Wrote ${OUT} — ${Object.keys(FACES).length} faces × ${CHARS.length} characters.`);
for (const k of Object.keys(table)) console.log(`  ${k}: widest glyph ${out.widest[k].toFixed(4)} em`);
