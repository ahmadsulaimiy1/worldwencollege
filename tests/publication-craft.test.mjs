// The craftsmanship audit, as a standing check.
//
// THE ASSERTION THIS FILE EXISTS FOR:
//
//   The defects a production editor would catch by reading every spread
//   are caught by measurement instead, on every build.
//
// A 477-page book is 239 spreads. I cannot look at 239 spreads and
// honestly claim to have judged each one, and a review that cannot be
// substantiated is worse than none — it launders an impression into a
// finding. So what can be measured is measured across every element,
// and what cannot is named here as unmeasured rather than quietly
// counted as passing.
//
// WHAT THIS FILE DOES NOT MEASURE, STATED SO IT IS NOT MISTAKEN FOR
// COVERAGE:
//   Rivers of white through justified text (needs glyph-level raster
//     analysis; the loose-line proxy below is not the same thing).
//   Whether a spread is balanced as a composition.
//   Whether a page earns its place editorially.
//   Optical margin alignment — the engine cannot hang punctuation, so
//     there is nothing to measure.
import { readFileSync, existsSync } from 'node:fs';
import { ROOT, loadUrl } from './helpers.mjs';

const { audit, vocabulary, overflowing, MEASURE_MM } =
  await import(loadUrl('scripts/publication/audit.mjs'));

let pass = 0, fail = 0;
const check = (label, cond, detail) => {
  console.log((cond ? 'PASS ' : 'FAIL ') + label + (cond || detail === undefined ? '' : ` — ${detail}`));
  cond ? pass++ : fail++;
};

const HTML = `${ROOT}/publication/.flagship.html`;
if (!existsSync(HTML)) {
  console.log('FAIL The print source does not exist — run: npm run curriculum');
  process.exit(1);
}

const html = readFileSync(HTML, 'utf8');
const f = await audit(HTML);

check(`Audited ${f.counts.textEls} text elements at the true measure of ${MEASURE_MM}mm`,
  f.counts.textEls > 8000, f.counts.textEls);

// --- Microtypography ---------------------------------------------------
{
  // A runt is a paragraph whose last line carries one short word alone.
  // Measured, not estimated: the final line box is compared against the
  // rendered width of the final word.
  //
  // 209 were measured before `text-wrap: pretty` was applied to body
  // prose; 46 survive, in paragraphs where Chromium's last-lines pass
  // cannot improve the break without making an earlier line worse. The
  // ceiling is set just above that so the number cannot quietly climb
  // back, and it is deliberately not zero — claiming zero would mean
  // hand-binding words in curriculum text, which is not this
  // publication's text to edit.
  check('Runts stay within the measured floor', f.runts.length <= 55,
    `${f.runts.length} of ${f.counts.multiLine} multi-line elements`);

  check('No paragraph is set loose enough to open rivers', f.stress.length === 0,
    `${f.stress.length} justified blocks under 4.2 words per line`);
}

// --- Accessibility -----------------------------------------------------
{
  check('No heading level is skipped', f.headingSkips.length === 0,
    f.headingSkips.slice(0, 3).map((h) => `h${h.from}->h${h.to}`).join(', '));

  // 5.5 pt is the practical floor for printed apparatus: below it the
  // counters close up on uncoated stock. Thirteen sizes were below it,
  // all inside SVG — the figures scale down with their viewBox, so a
  // label written as 6.2 printed at 3.9 pt, and the crest's "LONDON"
  // reached 1.8 pt on the level dividers.
  check('Nothing is set below the 5.5pt print legibility floor',
    f.smallType.length === 0,
    f.smallType.map((t) => `${t.pt}pt in ${t.owner} "${t.sample}"`).join('; '));

  const unscoped = f.tables.filter((t) => !t.scoped);
  check(`All ${f.tables.length} tables declare header scope`, unscoped.length === 0,
    `${unscoped.length} without scope`);
  const headless = f.tables.filter((t) => !t.hasHead);
  check('...and every one has header cells', headless.length === 0, headless.length);
}

// --- Visual consistency ------------------------------------------------
{
  const v = vocabulary(html);

  // A design system is a claim that a finite set of values is in use.
  // The only way to know whether the claim is true is to count them.
  // Ten rule weights and twenty tracking values were counted before this
  // pass; both were sprawl rather than a system.
  check('Rule weights form a small scale', v.borders.length <= 6,
    `${v.borders.length} distinct: ${v.borders.map(([a]) => a).join(' ')}`);

  const positive = v.tracking.filter(([a]) => !a.startsWith('-'));
  check('Tracking forms a small scale', positive.length <= 7,
    `${positive.length} positive steps: ${positive.map(([a]) => a).join(' ')}`);

  // Stroke weights are NOT held to a small count, and that is deliberate
  // rather than an exemption. The guilloché rings vary their weight by
  // ring index and the girih field by depth, so dozens of rendered
  // values descend from a handful of declared inputs. Counting rendered
  // strokes would punish a system for being parametric. What is checked
  // instead is that they all fall inside a printable band: below about
  // 0.25 pt fine line-work drops out on uncoated stock.
  const widths = v.strokes.map(([w]) => Number(w)).filter((n) => Number.isFinite(n));
  const tooFine = widths.filter((w) => w < 0.25);
  check('No drawn line is finer than the press can hold', tooFine.length === 0,
    `${tooFine.length} below 0.25: ${[...new Set(tooFine)].slice(0, 6).join(' ')}`);
}

// --- Page-box overflow -------------------------------------------------
{
  // THE ASSERTION THAT WOULD HAVE CAUGHT THE WORST DEFECT IN THIS BOOK.
  //
  // Any element wider than the page's content box makes Chromium
  // shrink-to-fit the ENTIRE DOCUMENT. A full-bleed plate 210 mm wide in
  // a 168 mm content box silently rescaled all 487 pages to about 91%:
  // every type size below its specification, every margin wrong, and the
  // spine computed from a false extent.
  //
  // Nothing else caught it. Every content assertion passed, because the
  // words were all present in the HTML. The only symptom was a page
  // count that made no sense — 444 where 487 was expected — and a page
  // count is not something most suites check the plausibility of.
  const over = await overflowing(HTML);
  check('No element overflows the page content box', over.length === 0,
    over.slice(0, 4).map((o) => `${o.cls} ${o.w}px > ${o.max}px`).join('; '));
}

// --- Print production --------------------------------------------------
{
  const { TRIM, BLEED, CALIPER_MM, spineWidth } = await import(loadUrl('scripts/publication/covers.mjs'));
  const PDF = `${ROOT}/publication/IEFC Complete Curriculum.pdf`;
  const COVER = `${ROOT}/publication/IEFC Cover Artwork.pdf`;

  check('The text block and the cover are separate files',
    existsSync(PDF) && existsSync(COVER));

  const pages = (readFileSync(PDF).toString('latin1').match(/\/Type\s*\/Page(?![s])/g) || []).length;
  const spine = spineWidth(pages);
  check('The spine is calculated from the bound extent', spine > 6,
    `${spine}mm at ${pages}pp × ${CALIPER_MM}mm caliper`);

  // The cover artwork must be trim plus bleed on all four edges, or the
  // printer trims into the design.
  const coverHtml = readFileSync(`${ROOT}/publication/.cover.html`, 'utf8');
  const w = TRIM.w * 2 + spine + BLEED * 2;
  const h = TRIM.h + BLEED * 2;
  check('The cover carries bleed on all four edges',
    coverHtml.includes(`width:${w}mm`) && coverHtml.includes(`height:${h}mm`),
    `expected ${w} × ${h} mm`);

  // Effective resolution of every placed photograph, at the size it is
  // actually printed. 300 dpi is the floor for offset litho; below it a
  // photograph goes soft in a way that is obvious on paper and invisible
  // on screen.
  const { imageResolutions } = await import(loadUrl('scripts/publication/audit.mjs'));
  const imgs = await imageResolutions(HTML);
  check(`All ${imgs.length} placed photographs are present and measurable`,
    imgs.length === 6 && imgs.every((i) => i.natural.w > 0),
    imgs.map((i) => `${i.file}:${i.natural.w}x${i.natural.h}`).join(' '));
  const soft = imgs.filter((i) => i.dpi < 300);
  check('...and every one clears 300 dpi at its printed size', soft.length === 0,
    soft.map((i) => `${i.file} ${i.dpi}dpi`).join('; '));

  // Mirrored margins mean a gutter allowance exists at all. Creep
  // compensation is a bindery calculation and is documented rather than
  // applied — it depends on the signature scheme the printer chooses.
  const css = html.match(/<style>[\s\S]*?<\/style>/)[0];
  check('A gutter allowance exists in the page setup',
    /@page :left\s*\{[^}]*\}/.test(css) && /@page :right\s*\{[^}]*\}/.test(css));
}

console.log(`\n${pass} passed, ${fail} failed.`);
process.exit(fail ? 1 : 0);
