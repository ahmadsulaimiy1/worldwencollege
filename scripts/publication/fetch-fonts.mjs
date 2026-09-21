/**
 * THE TYPEFACES, FETCHED ONCE AND EMBEDDED.
 *
 * ────────────────────────────────────────────────────────────────────
 * WHY THIS EXISTS, AND IT IS THE ROOT CAUSE OF A LOT
 * ────────────────────────────────────────────────────────────────────
 * The publication specified `Cambria, "Nimbus Roman", Georgia, "Times
 * New Roman", serif` and `Calibri, "Segoe UI", Arial, sans-serif`.
 * NONE of those exist on the machine that renders it. Every page of
 * every version was set in whatever the fallback happened to be — a
 * Times metric clone — while the CSS described a document nobody had
 * ever seen. No amount of layout work reaches a flagship standard on
 * a typeface nobody chose.
 *
 * Four faces are fetched here, subset to latin, and written into the
 * repository as base64 so the render is deterministic and works with
 * no network at all. All four are SIL Open Font License 1.1, which
 * permits embedding and redistribution.
 *
 * ────────────────────────────────────────────────────────────────────
 * THE SYSTEM, AND WHY EACH FACE IS IN IT
 * ────────────────────────────────────────────────────────────────────
 * Three faces, each with one job, and the jobs do not overlap.
 *
 * BODONI MODA — the ceremonial voice. A Didone of extreme contrast with
 *   an optical size axis running to ninety-six point, which is the only
 *   way a face like this can be used honestly: its hairlines are drawn
 *   for the size they are set at, so at ninety point it is magnificent
 *   and at twelve it would be illegible. It is therefore used ONLY at
 *   display — the wordmark, chapter numerals, the monumental figures,
 *   the sapphire openings — and never below twenty-four point. This is
 *   the face that makes a page feel ceremonial rather than merely
 *   well set, and it replaces Cinzel, which could only be set in
 *   capitals and therefore forced the wide tracking the owner rejected.
 *
 * NEWSREADER — the reading and titling voice, carrying an optical size
 *   axis of its own from six to seventy-two. Titles, rubrics, running
 *   text, pull quotes and every figure that has to sit in a column.
 *   One superfamily across every size, rather than two mismatched
 *   Garamonds doing one face's job.
 *
 * ARCHIVO — the technical face: labels, data, axes, tabular figures,
 *   institutional marks. A grotesque in the Neue Haas line, neutral
 *   and exact. Chosen over Inter, which is the typeface of every
 *   software company of the last decade and reads as a product.
 *
 * The retired faces — Cinzel, Cormorant Garamond, EB Garamond and
 * Inter — stay retired, and tests/masterplan.test.mjs fails the build
 * if any of them reappears.
 */

import { writeFileSync, mkdirSync, existsSync } from 'node:fs';
import { execFileSync } from 'node:child_process';
import path from 'node:path';

const ROOT = path.resolve(new URL('../..', import.meta.url).pathname);
const OUT = path.join(ROOT, 'assets/fonts');

const UA = 'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36';

/** family → the weights and styles the design actually uses. Nothing is
 *  fetched "in case", because every weight is bytes in every PDF. */
const WANT = [
  /* NEWSREADER carries the whole book: display, text and numerals. One
     superfamily across every size rather than two mismatched Garamonds,
     because its OPTICAL SIZE axis (6–72) is drawn for exactly that —
     the large sizes take the high contrast and fine terminals that make
     a title, and the small sizes thicken their hairlines so a caption
     at seven point does not disappear. Pairing Cormorant with EB
     Garamond was asking two faces to do one face's job and getting a
     display face at text size, which is why the numerals were thin. */
  { family: 'Newsreader', axis: 'opsz,ital,wght@6..72,0,300;6..72,0,400;6..72,0,500;6..72,0,600;6..72,1,300;6..72,1,400', key: 'newsreader' },
  /* ARCHIVO is the technical face: labels, data, axes, tabular figures.
     A grotesque in the Neue Haas line — neutral, precise, and with
     proper tabular numerals that hold a column without being asked
     twice. Chosen over Inter, which is the typeface of every software
     company of the last decade and reads as a product, not an
     institution. */
  { family: 'Archivo', axis: 'wght@400;500;600;700', key: 'archivo' },
  /* BODONI MODA is the ceremonial face and it is fetched across its
     full optical range, because a Didone set at the wrong optical size
     is either a smear or a ghost. Display weights only — there is no
     reason to carry a text weight of a face that is never set at text
     size. */
  { family: 'Bodoni Moda', axis: 'opsz,ital,wght@6..96,0,400;6..96,0,500;6..96,0,600;6..96,1,400', key: 'bodoni' },
];

const get = (url, binary = false) => execFileSync('curl',
  ['-sS', '-L', '-m', '40', '-H', `User-Agent: ${UA}`, url],
  { maxBuffer: 64 * 1024 * 1024, encoding: binary ? 'buffer' : 'utf8' });

function main() {
  mkdirSync(OUT, { recursive: true });
  let css = `/* GENERATED by scripts/publication/fetch-fonts.mjs — do not hand-edit.
   Three faces, latin subset, embedded base64. All SIL Open Font License 1.1.
   Bodoni Moda: Copyright The Bodoni Moda Project Authors.
   Newsreader: Copyright The Newsreader Project Authors.
   Archivo: Copyright The Archivo Project Authors.
   Full licence: https://scripts.sil.org/OFL */\n\n`;
  let bytes = 0;

  for (const w of WANT) {
    const url = `https://fonts.googleapis.com/css2?family=${encodeURIComponent(w.family).replace(/%20/g, '+')}:${w.axis}&display=block`;
    const sheet = get(url);
    // Keep the latin block only. The cyrillic, greek and vietnamese
    // subsets are most of the weight and none of the document.
    const blocks = sheet.split('/*').filter((b) => /^\s*latin\s*\*\//.test(b));
    for (const b of blocks) {
      const m = b.match(/font-style:\s*(\w+);[\s\S]*?font-weight:\s*([\d ]+);[\s\S]*?src:\s*url\(([^)]+)\)/);
      if (!m) continue;
      const [, styleRaw, weightRaw, src] = m;
      const style = styleRaw; const weight = weightRaw.trim();
      const data = get(src, true);
      bytes += data.length;
      css += `@font-face{font-family:'${w.family}';font-style:${style};font-weight:${weight};font-display:block;`
        + `src:url(data:font/woff2;base64,${data.toString('base64')}) format('woff2');}\n`;
      process.stdout.write(`  ${w.family} ${style} ${weight} — ${(data.length / 1024).toFixed(0)} KB\n`);
    }
  }

  const file = path.join(OUT, 'monograph-faces.css');
  writeFileSync(file, css);
  console.log(`\nWrote ${path.relative(ROOT, file)} — ${(css.length / 1024).toFixed(0)} KB of CSS carrying ${(bytes / 1024).toFixed(0)} KB of font data.`);
}

if (process.argv[1] && path.resolve(process.argv[1]) === path.resolve(new URL(import.meta.url).pathname)) main();
