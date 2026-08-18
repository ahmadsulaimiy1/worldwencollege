// THE THREE PLATES DRAWN ON 18 AUGUST 2026, HELD TO THEIR SOURCES.
//
// ─────────────────────────────────────────────────────────────────────
// WHAT THIS FILE EXISTS FOR
// ─────────────────────────────────────────────────────────────────────
// A generated drawing fails silently in a way prose does not. Nobody
// reads an SVG, every text sweep in this directory reads HTML, and a
// figure that has drifted from the record still renders beautifully.
// That is exactly how the quality cycle came to publish the platform's
// four zeroes as the College's teaching history for two months.
//
// So each of the three new plates is held to the file it was drawn
// from, and to the page it was placed on:
//
//   provenance-columns   the four evidence states of the support
//                        record, and the argument that the fourth is
//                        empty because only teaching fills it
//   level-ascent-1..6    six rungs, each a complete award, with the
//                        page's own level struck
//   two-routes           the enrolled and independent fees, converging
//                        on one seal
//
// The checks that matter most are the ones that catch a change made in
// good faith somewhere else: a price edited in data/commercial.json, an
// award renamed in the schema, an entry marked observed_in_teaching.
// Each of those should break a drawing, and each of them breaks a check
// here rather than shipping a picture that is quietly false.

import { readFileSync, existsSync } from 'node:fs';
import path from 'node:path';
import { ROOT, loadUrl } from './helpers.mjs';

let pass = 0, fail = 0;
const check = (label, cond, detail) => {
  console.log((cond ? 'PASS ' : 'FAIL ') + label + (cond || detail === undefined ? '' : ` — ${detail}`));
  cond ? pass++ : fail++;
};

const art = (f) => readFileSync(path.join(ROOT, 'assets/art', f), 'utf8');
const page = (f) => readFileSync(path.join(ROOT, 'pages', f), 'utf8');

// =====================================================================
// 1 · THE PROVENANCE COLUMNS
// =====================================================================
{
  const { readStates } = await import(loadUrl('scripts/art/generate-provenance-columns.mjs'));
  const S = readStates();
  const derived = S.derived_from_curriculum || 0;
  const established = S.established_pedagogy || 0;
  const designed = S.educational_expertise || 0;
  const observed = S.observed_in_teaching || 0;
  const total = derived + established + designed;

  // THE ARGUMENT WITH AN EXPIRY DATE. The drawing says the fourth
  // column is empty and that only teaching fills it. On the day a
  // lesson is observed that sentence stops being true, and the drawing
  // needs re-thinking rather than re-rendering.
  check('Nothing has been marked observed_in_teaching, which is what the plate argues',
    observed === 0,
    `${observed} entries are now observed. Re-read scripts/art/generate-provenance-columns.mjs `
    + 'before regenerating: the empty column is the whole drawing.');

  const en = art('provenance-columns.svg');
  const ar = art('provenance-columns.ar.svg');

  for (const [lang, svg] of [['English', en], ['Arabic', ar]]) {
    for (const [name, v] of [['derived', derived], ['established', established], ['designed', designed]]) {
      check(`${lang}: the plate carries the record's ${name} count — ${v}`,
        new RegExp(`>${v}<`).test(svg));
    }
    check(`${lang}: the description states the record's total — ${total}`,
      new RegExp(`\\b${total}\\b`).test(svg.match(/<desc[^>]*>([\s\S]*?)<\/desc>/)[1]));
    // The empty column is drawn, not merely omitted. A dashed rectangle
    // at full plot height is the mark; a plate that lost it would still
    // render and would have stopped making the argument.
    check(`${lang}: the empty column is drawn as an outline, not left out`,
      /stroke-dasharray="4 7"/.test(svg));
  }

  // The plate and the cards beside it must not disagree.
  const teaching = page('academics-teaching.html');
  for (const v of [derived, established, designed]) {
    check(`The English page's cards still state ${v}, the same figure the plate draws`,
      teaching.includes(`<h3>${v} entries</h3>`));
  }
  // A DRAWING THAT RENAMES A CATEGORY INVENTS ONE. The Arabic plate
  // first shipped calling the four states مشتق / مُثبَت / مُصمَّم /
  // مُلاحَظ while the cards under it read مشتق / مُثبَت / مصمَّم /
  // مُشاهَد — two of four renamed, which to an Arabic reader is a
  // drawing about a different scheme than the page it sits on. Nothing
  // in a figure caption sweep would have found it.
  const teachingAr = page('academics-teaching.ar.html');
  const arSvg = art('provenance-columns.ar.svg');
  for (const term of ['مشتق', 'مُثبَت', 'مصمَّم', 'مُشاهَد']) {
    check(`Arabic: the plate names the state the page names — ${term}`,
      arSvg.includes(term) && teachingAr.includes(term));
  }
  for (const term of ['Derived', 'Established', 'Designed', 'Observed']) {
    check(`English: the plate names the state the page names — ${term}`,
      en.includes(term) && teaching.includes(term));
  }

  check('The English page places the plate', /\{\{SVG:assets\/art\/provenance-columns\.svg\}\}/.test(teaching));
  check('The Arabic page places the Arabic plate',
    /\{\{SVG:assets\/art\/provenance-columns\.ar\.svg\}\}/.test(page('academics-teaching.ar.html')));
}

// =====================================================================
// 2 · THE LEVEL ASCENT
// =====================================================================
{
  const { readLevels } = await import(loadUrl('scripts/art/generate-level-ascent.mjs'));
  const LEVELS = readLevels();
  check('The record still holds exactly six levels, which is what the ascent draws',
    LEVELS.length === 6, `read ${LEVELS.length}`);

  for (const lv of LEVELS) {
    for (const suffix of ['', '.ar']) {
      const f = `level-ascent-${lv.id}${suffix}.svg`;
      if (!existsSync(path.join(ROOT, 'assets/art', f))) {
        check(`${f} exists`, false, 'run scripts/art/generate-level-ascent.mjs');
        continue;
      }
      const svg = art(f);
      // The award title is the certificate wording, kept in its official
      // English form in both editions because it is a proper name.
      check(`${f} names its own award — ${lv.official_title}`,
        svg.includes(lv.official_title));
      check(`${f} carries every rung's post-nominal`,
        LEVELS.every((l) => svg.includes(l.post_nominal)));
      // NOT A PROGRESS BAR. If a future edit shades the lower rungs as
      // attained, this sentence is the first thing that would be
      // dropped, so it is the thing held.
      const desc = svg.match(/<desc[^>]*>([\s\S]*?)<\/desc>/)[1];
      check(`${f} says in its description that it is not a progress bar`,
        /not a progress bar|ليست شريط تقدُّم/.test(desc));
    }
  }

  const lvl1 = page('study-level-1.html');
  check('The level pages place their own ascent',
    /\{\{SVG:assets\/art\/level-ascent-1\.svg\}\}/.test(lvl1));
  check('...and the Arabic editions place the Arabic one',
    /\{\{SVG:assets\/art\/level-ascent-1\.ar\.svg\}\}/.test(page('study-level-1.ar.html')));
  // Each page must carry ITS OWN level's plate, not level one's on all
  // six — the mistake a copied template makes and nothing else catches.
  for (let i = 1; i <= 6; i += 1) {
    check(`Level ${i}'s page places level ${i}'s plate`,
      new RegExp(`\\{\\{SVG:assets/art/level-ascent-${i}\\.svg\\}\\}`).test(page(`study-level-${i}.html`)));
    check(`...and its Arabic edition places the Arabic level ${i} plate`,
      new RegExp(`\\{\\{SVG:assets/art/level-ascent-${i}\\.ar\\.svg\\}\\}`).test(page(`study-level-${i}.ar.html`)));
  }
}

// =====================================================================
// 3 · TWO ROUTES, ONE AWARD
// =====================================================================
{
  const C = JSON.parse(readFileSync(path.join(ROOT, 'data/commercial.json'), 'utf8'));
  const T = JSON.parse(readFileSync(path.join(ROOT, 'data/tuition.json'), 'utf8'));
  const steps = C.routes.independent.steps;
  const stepTotal = steps.reduce((a, s) => a + s.cents, 0);
  const flat = (c) => '$' + (c / 100).toLocaleString('en-US', { maximumFractionDigits: 0 });

  const en = art('two-routes.svg');
  const ar = art('two-routes.ar.svg');

  for (const [lang, svg] of [['English', en], ['Arabic', ar]]) {
    check(`${lang}: the plate quotes the level fee exactly as the page spells it — $3,166.67`,
      svg.includes('$3,166.67'));
    for (const s of steps) {
      check(`${lang}: the plate quotes the ${s.key} step — ${flat(s.cents)}`,
        svg.includes(flat(s.cents)));
    }
    check(`${lang}: the plate quotes the independent programme total — ${flat(stepTotal * T.levels)}`,
      svg.includes(flat(stepTotal * T.levels)));
    check(`${lang}: the plate quotes the enrolled programme total — ${flat(C.routes.enrolled.programme_total_usd * 100)}`,
      svg.includes(flat(C.routes.enrolled.programme_total_usd * 100)));

    // THE CONVERGENCE IS THE ARGUMENT. Without it the plate is two
    // price columns side by side, which is the reading it was drawn to
    // prevent.
    const desc = svg.match(/<desc[^>]*>([\s\S]*?)<\/desc>/)[1];
    check(`${lang}: the description says both routes reach the same award`,
      /the same on both routes|واحدة في الطريقين/.test(desc));
    check(`${lang}: ...and that nothing below the seal differs`,
      /Nothing that differs\s*is below it|ولا شيء يفترق تحته/.test(desc));
  }

  // No page may describe the independent award as a diminished one —
  // the same rule tests/commercial-model.test.mjs holds for the prose,
  // applied to the drawing, which that sweep does not read.
  const LESSER = /(lesser|reduced|simplified|lighter) (award|certificate|qualification|examination)/i;
  check('Neither plate describes the independent award as a diminished one',
    !LESSER.test(en) && !LESSER.test(ar));

  const tuition = page('admissions-tuition.html');
  check('The tuition page places the plate', /\{\{SVG:assets\/art\/two-routes\.svg\}\}/.test(tuition));
  check('The Arabic tuition page places the Arabic plate',
    /\{\{SVG:assets\/art\/two-routes\.ar\.svg\}\}/.test(page('admissions-tuition.ar.html')));
}

// =====================================================================
// 4 · EVERY PLATE OWES ITS DESCRIPTION
// =====================================================================
// role="img" with a title and a description is the accessibility
// contract lib/plate.mjs writes, and the description is not a caption:
// for some readers it IS the diagram. A one-line desc passes an
// automated accessibility check and tells that reader nothing, so the
// length is held too.
{
  const files = ['provenance-columns', 'two-routes',
    ...[1, 2, 3, 4, 5, 6].map((i) => `level-ascent-${i}`)];
  for (const base of files) {
    for (const suffix of ['', '.ar']) {
      const f = `${base}${suffix}.svg`;
      if (!existsSync(path.join(ROOT, 'assets/art', f))) continue;
      const svg = art(f);
      const desc = (svg.match(/<desc[^>]*>([\s\S]*?)<\/desc>/) || [, ''])[1];
      check(`${f} carries a description a reader could use instead of the drawing`,
        desc.trim().length >= 300, `${desc.trim().length} characters`);
      check(`${f} declares itself an image with a title`,
        /role="img"/.test(svg) && /<title id=/.test(svg));
    }
  }
}

console.log(`\n${pass} passed, ${fail} failed.`);
process.exit(fail ? 1 : 0);
