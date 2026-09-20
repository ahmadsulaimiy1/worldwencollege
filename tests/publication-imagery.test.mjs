/**
 * THE MONOGRAPH CARRIES NO DECORATIVE PHOTOGRAPHY.
 *
 * ────────────────────────────────────────────────────────────────────
 * WHY THIS EXISTS
 * ────────────────────────────────────────────────────────────────────
 * The publication opened all seven of its chapters on a stock or
 * archival photograph: Westminster for the proposition, a reading hall
 * for the institution, an old map for the market, a letterpress for
 * commerce, an astrolabe for the decade, a manuscript for method, and
 * a banknote guilloche spun across the cover. Every one of them was
 * conceptually legible. None of them was necessary, and together they
 * made a monograph about an institution's intellectual architecture
 * read as a luxury strategy report.
 *
 * The owner ruled them out on 20 September 2026, and ruled out the
 * obvious evasion with them: they are not to be replaced by BETTER
 * photographs. London does not need a photograph of London to stand
 * for London.
 *
 * A ruling that lives only in a commit message gets undone by the next
 * session that finds an empty-looking page. So it lives here, and in
 * three places at once:
 *
 *   the SOURCE may not carry the machinery to place a photograph;
 *   the BUILT BOOK may not contain a raster image;
 *   and every chapter opener must carry a drawing made of its own
 *   chapter, with a caption, because the answer to an empty page is a
 *   better composition and never a picture.
 *
 * The renderer enforces the second of those on every build as well.
 * This is the copy that fails `npm test` rather than the copy that
 * fails a build somebody might not run.
 */
import { readFileSync, existsSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const read = (rel) => readFileSync(path.join(ROOT, rel), 'utf8');

let pass = 0, fail = 0;
const check = (label, cond, detail) => {
  console.log((cond ? 'PASS ' : 'FAIL ') + label + (cond || detail === undefined ? '' : ` — ${detail}`));
  cond ? pass++ : fail++;
};

// ── 1 · the source carries no way to place one ──────────────────────
/* Comments are stripped first, because the file KEEPS a written record
   of what was removed and why — that history is the point, and a guard
   that trips over its own explanation is a guard nobody can write the
   explanation into. */
const decomment = (src) => src.replace(/\/\*[\s\S]*?\*\//g, '').replace(/^\s*\/\/.*$/gm, '');
const spreads = decomment(read('scripts/publication/spreads.mjs'));
for (const banned of ['platePage', 'plateSrc', 'PLATES', 'plate__tone', 'guilloche', '<img']) {
  check(`spreads.mjs has no ${banned}`, !spreads.includes(banned),
    'the machinery was deleted rather than left unused, so that "there is already one" cannot be the reason a photograph returns');
}

const renderer = read('scripts/publication/render-monograph.mjs');
check('the renderer references no photographic plate',
  !renderer.includes('assets/images/plates') && !renderer.includes('platePage'));
check('the renderer places no raster image',
  !/<img\b/.test(renderer) && !renderer.includes('data:image/jp'));

// ── 2 · every chapter opener is a drawing of its own chapter ────────
/* Split on the call itself and read each block up to the next one, so
   a nested brace in a template string cannot end a block early. */
const openerCalls = renderer.split('S.openerPage({').slice(1)
  .map((tail, i, all) => (i === all.length - 1 ? tail.slice(0, 2200) : tail.slice(0, 2200)));
check('all seven parts open on an openerPage', openerCalls.length === 7, `found ${openerCalls.length}`);
const withoutDatum = openerCalls.filter((c) => !/\bdatum:/.test(c));
const withoutCaption = openerCalls.filter((c) => !/\bcaption:/.test(c));
check('every chapter opener carries a datum', withoutDatum.length === 0, `${withoutDatum.length} without`);
check('every chapter opener captions its datum', withoutCaption.length === 0, `${withoutCaption.length} without`);

/* And openerPage refuses either, rather than rendering a quiet blank.
   Checked by calling it, because a guard nobody exercises is a
   comment. */
const S = await import(path.join(ROOT, 'scripts/publication/spreads.mjs'));
const refuses = (args) => {
  try { S.openerPage(args); return false; } catch { return true; }
};
check('openerPage refuses an opener with no drawing',
  refuses({ part: 'Part One', roman: 'I', title: 'X', say: 'y', caption: 'c' }));
check('openerPage refuses an uncaptioned drawing',
  refuses({ part: 'Part One', roman: 'I', title: 'X', say: 'y', datum: '<svg/>' }));

/* Same for a plate with no reading beside it: the figure page is a
   drawing AND its argument, and a drawing alone leaves three fifths of
   the page white. */
check('figurePage refuses a plate with no reading', (() => {
  try { S.figurePage({ title: 'X', figure: '<svg/>', strip: [1, 2, 3] }); return false; } catch { return true; }
})());
check('figurePage refuses a plate with no foot strip', (() => {
  try { S.figurePage({ title: 'X', figure: '<svg/>', reading: { head: 'h', body: '<p>b</p>' } }); return false; } catch { return true; }
})());

/* And a spread is two pages. It used to accept three and silently drop
   the third, which cost the book two leaves of the risk register and
   two of the governance schedule. */
check('a spread refuses a third page', (() => {
  try { S.spread('a', 'b', 'c'); return false; } catch { return true; }
})());

// ── 3 · the built book contains no raster image ─────────────────────
const BUILT = 'publication/.monograph.html';
if (existsSync(path.join(ROOT, BUILT))) {
  const html = read(BUILT);
  check('the built monograph contains no <img>', !/<img\b/i.test(html));
  check('the built monograph embeds no raster data', !/data:image\/(jpe?g|png|gif|webp)/i.test(html));
  /* A folio must equal the position of the page that prints it. Pages
     that print none — the cover, the bastard titles, the colophon —
     still take a number, so it is the INDEX that has to be checked and
     not the run of printed numbers. A mismatch means a page was built,
     took its number, and was then dropped or pushed out of order:
     which is what `spread()` was doing with a third argument. */
  const pages = html.split('<section class="pg').slice(1);
  const wrong = [];
  pages.forEach((p, i) => {
    const m = p.match(/<div class="folio num">(\d+)<\/div>/);
    if (m && Number(m[1]) !== i + 1) wrong.push(`index ${i + 1} prints ${m[1]}`);
  });
  check('every folio matches the position of its page', wrong.length === 0, wrong.slice(0, 4).join(', '));
} else {
  console.log('SKIP the built monograph is not present — run `npm run monograph`');
}

console.log(`\n${pass} passed, ${fail} failed.`);
process.exitCode = fail ? 1 : 0;
