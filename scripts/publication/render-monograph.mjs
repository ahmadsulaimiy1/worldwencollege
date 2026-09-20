/**
 * THE MONOGRAPH — rendered.
 *
 * Content comes from the same engine as everything else. This file
 * decides only where it sits on a page, and it composes pages rather
 * than letting content flow into them.
 */
import { writeFileSync, mkdirSync, readFileSync } from 'node:fs';
import { chromium } from 'playwright';
import path from 'node:path';
import * as M from './monograph.mjs';
import { PLAN, basis } from './masterplan.mjs';
import * as PR from './pricing.mjs';
import * as AL from './allocation.mjs';
import { scenarios as priceScenarios, architectures } from './projection.mjs';

const ROOT = path.resolve(new URL('../..', import.meta.url).pathname);
const OUT = path.join(ROOT, 'publication');
const FACES = readFileSync(path.join(ROOT, 'assets/fonts/monograph-faces.css'), 'utf8');

const B = basis();
const ARCH = architectures();
const PSC = priceScenarios();
const CORE = PSC.core;
const CY10 = CORE.years[CORE.years.length - 1];
const GOT = AL.achievedProposed();
const PATH_ = PR.PROPOSED.committed;
const EV = JSON.parse(readFileSync(path.join(ROOT, 'data/market-evidence.json'), 'utf8'));
const PERIOD = `${PLAN.planning_period.first_year}–${PLAN.planning_period.first_year + PLAN.planning_period.years - 1}`;

const usd = (n, d = 0) => '$' + Number(n).toLocaleString('en-US', { minimumFractionDigits: d, maximumFractionDigits: d });
const m$ = (n) => (n < 0 ? '−' : '') + '$' + Math.abs(n / 1e6).toFixed(1) + 'M';
const num = (n) => Number(Math.round(n)).toLocaleString('en-US');
const pct = (x, d = 0) => (x * 100).toFixed(d) + '%';

/* A SCHEDULE IS NOT A BROCHURE.
   The first proof set each tier's full prose description inside the
   table, which produced five-line cells, wildly uneven row heights and
   a table that ran off the bottom of the page taking its last row with
   it. What a tier buys is explained in the narrative; what the table
   has to do is let a Board read eight prices down one column. */
const DESCRIPTOR = {
  independent: 'Examination, moderation and the award. No teaching.',
  directed: 'Seminar teaching in a group of fourteen, with marked work.',
  tutored: 'A named instructor, individual tutorials, every piece marked.',
  execCore: 'A cohort of six, scheduled around professional obligations.',
  execPremium: 'One to one throughout, with a named academic adviser.',
  execBespoke: 'One to one, on material authored to the holder\u2019s own field.',
};

const P = [];
const add = (html) => P.push(html);
/** Open a chapter on a recto, as a bound book does, inserting the
 *  deliberate blank verso if the sequence has landed on the wrong
 *  side. */
const openChapter = (spec) => {
  if (!M.nextIsRecto()) add(M.blankVerso());
  add(M.chapterOpener(spec));
};

// ── 01 · THE COVER ───────────────────────────────────────────────────
add(`<section class="pg m-cover">
  <div class="m-cover__frame"></div>
  <div class="m-cover__mark"><span class="inscr">WorldWide English College</span></div>
  <div class="m-cover__rule"></div>
  <div class="m-cover__title">
    <h1>The Ten-Year<br>Institutional Roadmap</h1>
    <p class="sub">Strategic Charter &amp; Financial Master Plan</p>
  </div>
  <div class="m-cover__period"><span>${PERIOD}</span></div>
  <div class="m-cover__foot">London Campus &middot; Prepared for the Board<br>Planning instrument &mdash; not a record of trading</div>
</section>`);
M.countUnfoliated();

// ── 02 · THE PROPOSITION ─────────────────────────────────────────────
add(M.colourField({
  quote: `The College sells <em>teaching</em>, not a credential.<br>The credential is identical whichever route a candidate takes to it. What differs, and what costs money, is <em>human attention</em>.`,
  attribution: 'The institutional thesis',
}));

// ── 03 · CHAPTER OPENER ──────────────────────────────────────────────
openChapter({
  n: '01', eyebrow: 'Chapter One',
  title: 'The Commercial Architecture',
  rubric: 'What WEC-LC charges, solved backwards from the financial law the Board has set — and not chosen.',
  stats: [
    { v: usd(PATH_.tutored), l: 'Tutored pathway, proposed' },
    { v: pct(GOT.retainedShare, 1), l: 'Revenue retained' },
    { v: m$(ARCH.proposed.totals.revenue), l: 'Ten-year revenue' },
  ],
});

// ── 04 · HERO METRIC ─────────────────────────────────────────────────
add(M.heroMetric({
  eyebrow: 'Retained for reserve and strategic allocation',
  value: pct(GOT.retainedShare, 1),
  say: `The tariff is the cheapest one at which the institution retains what its own financial law requires. It is the output of that law, not a management preference.`,
  note: `Against a target of ${pct(AL.SHARES.reserve + AL.SHARES.strategic, 0)}. ${M.mark('board')}`,
  runhead: 'Commercial Architecture',
}));

// ── 05 · THE TARIFF, as an institutional schedule ───────────────────
add(M.narrative({
  runhead: 'Commercial Architecture',
  single: true,
  head: `<p class="eyebrow">Chapter One &middot; The proposed tariff</p>`,
  body: M.table({
    title: 'Management’s proposed commercial architecture',
    sub: 'Complete A1–C2 pathway. Proposed and modelled; the adopted tariff remains $19,000 until the Board resolves otherwise.',
    head: ['Tier', 'What it buys', 'Contact hours', 'Individual attention', 'Pathway'],
    rows: [
      ...Object.keys(PATH_).map((k) => {
        const p = PR.PRODUCTS[k];
        return [
          M.esc(p.name),
          { v: M.esc(DESCRIPTOR[k]), cls: 'unit' },
          num((p.individual + p.groupHours) * 6),
          num(PR.attentionHours(k)),
          `<b>${usd(PATH_[k])}</b>`,
        ];
      }),
      ...Object.keys(PR.CHANNELS).map((k) => {
        const t = PR.channelTerms(k, PATH_);
        return {
          cells: [
            M.esc(t.name),
            { v: `The ${M.esc(PR.PRODUCTS[t.spec].name)} pathway, less the adopted ${pct(t.discount, 0)} band.`, cls: 'unit' },
            num((PR.PRODUCTS[t.spec].individual + PR.PRODUCTS[t.spec].groupHours) * 6),
            num(PR.attentionHours(t.spec)),
            `<b>${usd(Math.round(t.seatPrice))}</b>`,
          ],
        };
      }),
    ],
    source: `Independent is adopted and published in data/commercial.json. Every other figure is ${M.mark('proposed')} — solved from data/masterplan.json § revenue_allocation_framework by scripts/publication/allocation.mjs.`,
  }),
}));

// ── 06 · THE ALLOCATION, given a spread ──────────────────────────────
/* This is the governing law of the institution and the thing every
   price in the book is solved from. Compressed onto one page it
   overflowed, and compressing it further would have meant cutting the
   definitions — which are the part that stops the Strategic and
   Founders' Allocation being read as profit. It gets a spread. */
const SEG_COLOUR = { payroll: M.C.midnight, technology: '#26405C', opex: '#42596F',
  marketing: '#677D91', reserve: M.C.gold, strategic: M.C.goldLeaf };
/* Labels, not first words. Taking the first word of each name turned
   "Institutional Reserve" into INSTITUTIONAL, which names the wrong
   thing on the one diagram that has to be unambiguous. */
const SEG_LABEL = { payroll: 'PAYROLL', technology: 'TECHNOLOGY', opex: 'OPERATING',
  marketing: 'MARKETING', reserve: 'RESERVE', strategic: 'STRATEGIC' };

if (!M.nextIsRecto()) add(M.blankVerso());
// Verso of the spread: the structure, drawn.
add(M.page(`
  <p class="eyebrow">Chapter Two &middot; The governing financial law</p>
  <h2 style="margin-top:0">Where every dollar<br>is governed</h2>
  <p class="lede" style="max-width:${M.col(6)}mm;margin-bottom:4mm">Fifty per cent of gross collected revenue is retained rather than spent. The tariff is solved backwards from this, and not the other way round.</p>
  <p style="margin:0 0 9mm">${M.mark('board')}</p>
  <div class="m-alloc">
    <div class="m-alloc__col">
      ${GOT.lines.map((l) => {
    const h = l.target * 143;
    /* A segment too short to carry two lines carries one. The first
       proof lost the technology label entirely, which made a six-part
       structure look like a five-part one with a stripe in it. */
    const tight = h < 12;
    return `<div class="m-alloc__seg${tight ? ' m-alloc__seg--tight' : ''}${AL.RETAINED.includes(l.key) ? ' m-alloc__seg--kept' : ''}"
        style="background:${SEG_COLOUR[l.key]};height:${h.toFixed(1)}mm">
        <b>${pct(l.target, 0)}</b><s>${M.esc(SEG_LABEL[l.key])}</s></div>`;
  }).join('')}
    </div>
    <div style="flex:1;padding-top:1mm;position:relative">
      <p style="font-size:${M.T.small}pt;line-height:14.4pt;color:${M.C.inkSoft};max-width:${M.col(4)}mm;margin:0">
        The four lines above the struck rule are <em>consumed</em> running the institution. The two below it are
        <em>retained</em> &mdash; designated institutional capital, not profit, and not automatically withdrawable.</p>
      <div style="height:1.2pt;background:${M.C.gold};margin:7mm 0 5mm;width:${M.col(3)}mm"></div>
      <p style="font-size:${M.T.small}pt;line-height:14.4pt;color:${M.C.inkSoft};max-width:${M.col(4)}mm;margin:0">
        At the proposed tariff the institution retains <strong>${pct(GOT.retainedShare, 1)}</strong> of
        ${m$(GOT.revenue)} &mdash; the cheapest tariff at which it does.</p>
      <!-- The foot of the right column carries what the institution
           keeps, set as a figure, so the column is a composition rather
           than a paragraph with air under it. -->
      <div style="position:absolute;left:0;bottom:0;width:${M.col(4)}mm">
        <div style="height:.35pt;background:${M.C.rule};margin-bottom:4mm"></div>
        <p style="font-family:${M.FACE.data};font-size:${M.T.micro}pt;font-weight:600;letter-spacing:.24em;text-transform:uppercase;color:${M.C.grey};margin:0 0 2mm">Retained a year at maturity</p>
        <p class="num" style="font-family:${M.FACE.display};font-weight:300;font-size:44pt;line-height:46pt;color:${M.C.midnight};margin:0">${m$(GOT.retained)}</p>
      </div>
    </div>
  </div>`, { runhead: 'Financial Architecture' }));

// Recto of the spread: what each line means, which is the part that matters.
add(M.page(`
  <p class="eyebrow">Definitions</p>
  <h2 style="margin-top:0">What each line is, and is not</h2>
  <div style="margin-top:4mm">
  ${GOT.lines.map((l) => {
    const spec = PLAN.revenue_allocation_framework.shares.find((x) => x.key === l.key);
    return `<div class="m-alloc__row">
      <div class="m-alloc__swatch" style="background:${SEG_COLOUR[l.key]}"></div>
      <div style="flex:1">
        <h4>${M.esc(l.name)}</h4>
        <p>${M.esc(spec.definition)}</p>
        ${spec.not ? `<p style="margin-top:1.4mm;color:${M.C.crimson};font-size:${M.T.caption}pt;line-height:11.6pt"><em>${M.esc(spec.not)}</em></p>` : ''}
      </div>
      <div class="m-alloc__pct num">${pct(l.target, 0)}</div>
    </div>`;
  }).join('')}
  </div>`, { runhead: 'Financial Architecture' }));

// ── 07 · A PROPOSITION PAGE ──────────────────────────────────────────
add(M.proposition({
  text: `A buyer priced out of tuition does not leave. They sit the same examinations, against the same rubric, for the same award &mdash; <em>without ever being taught.</em>`,
  attribution: 'On what a price actually decides',
  runhead: 'Commercial Architecture',
}));

// ── ASSEMBLE ─────────────────────────────────────────────────────────
const html = `<!doctype html><html lang="en"><head><meta charset="utf-8">
<title>WEC-LC — Ten-Year Institutional Roadmap ${PERIOD}</title>
<style>${M.css(FACES)}${M.masterCss()}</style></head>
<body>${P.join('\n')}</body></html>`;

mkdirSync(OUT, { recursive: true });
const HTML_OUT = path.join(OUT, '.monograph.html');
/* A DISTINCT FILE UNTIL THE REPAGINATION IS COMPLETE.
   The monograph currently carries the opening sequence and the
   financial architecture; the full twenty-section document still comes
   from render-masterplan.mjs. Writing this to that file would have
   replaced a complete publication with a nine-page proof of its own
   design system, which is not an improvement however much better the
   nine pages look. */
const PDF_OUT = path.join(OUT, 'WEC-LC Institutional Monograph.pdf');
writeFileSync(HTML_OUT, html);

const browser = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium-1194/chrome-linux/chrome' });
const pg = await browser.newPage();
await pg.goto('file://' + HTML_OUT, { waitUntil: 'networkidle' });
await pg.emulateMedia({ media: 'print' });
await pg.pdf({
  path: PDF_OUT, width: `${M.PAGE.width}mm`, height: `${M.PAGE.height}mm`,
  printBackground: true, margin: { top: 0, bottom: 0, left: 0, right: 0 },
});
/* ────────────────────────────────────────────────────────────────────
   EVERY PAGE MUST FIT, AND THE BUILD FINDS OUT RATHER THAN A READER.

   The first proof of this design lost the last row of the tariff table
   off the bottom of the page and printed the folio through the middle
   of it. Both were invisible in the source and obvious on screen, and
   neither would have survived a reader. A page that overflows is not a
   page that needs tightening; it is a failed composition, and the
   build now refuses it. */
const overflows = await pg.evaluate(() => {
  const bad = [];
  document.querySelectorAll('.pg').forEach((p, i) => {
    const f = p.querySelector('.pg__field');
    /* ONLY THE FIELD ITSELF. An inner box can report a few pixels of
       scrollHeight from an absolutely-positioned child without a
       reader losing anything, and failing the build on that means
       chasing phantoms. What loses content is the FIELD overflowing,
       or an element crossing the trim, or text landing on text. */
    const worst = f ? Math.max(0, f.scrollHeight - f.clientHeight) : 0;
    // Anything the page clips is content the reader never sees.
    const clipped = [...p.querySelectorAll('*:not(.bleed):not(.bleed *)')].some((el) => {
      const r = el.getBoundingClientRect(); const pr = p.getBoundingClientRect();
      return r.height > 0 && (r.bottom > pr.bottom + 0.5 || r.right > pr.right + 0.5);
    });
    /* AND TEXT MUST NOT SIT ON TEXT. An overlap is not an overflow, so
       the fit check could not see the retained figure landing on top of
       a paragraph. Compare every absolutely-positioned block against
       the flow text around it. */
    const collided = [];
    const blocks = [...p.querySelectorAll('.pg__field p, .pg__field h2, .pg__field h3, .pg__field h4, .pg__field table')];
    for (let a = 0; a < blocks.length; a++) {
      for (let c = a + 1; c < blocks.length; c++) {
        if (blocks[a].contains(blocks[c]) || blocks[c].contains(blocks[a])) continue;
        const r1 = blocks[a].getBoundingClientRect(), r2 = blocks[c].getBoundingClientRect();
        if (r1.width < 2 || r2.width < 2 || r1.height < 2 || r2.height < 2) continue;
        const ox = Math.min(r1.right, r2.right) - Math.max(r1.left, r2.left);
        const oy = Math.min(r1.bottom, r2.bottom) - Math.max(r1.top, r2.top);
        if (ox > 3 && oy > 3) collided.push((blocks[a].textContent || '').trim().slice(0, 30));
      }
    }
    if (worst > 1 || clipped || collided.length) {
      // Name the last element that still fits, so the fault can be
      // found without opening a browser.
      const pr = p.getBoundingClientRect();
      let lastFits = '';
      for (const el of (f || p).querySelectorAll('h2,h3,h4,p,tr,div')) {
        const r = el.getBoundingClientRect();
        if (r.height > 0 && r.bottom <= pr.bottom) lastFits = (el.textContent || '').trim().slice(0, 46);
      }
      bad.push({ page: i + 1, overflowPx: Math.round(worst), clipped, lastFits,
        collided: [...new Set(collided)].slice(0, 2) });
    }
  });
  return bad;
});
await browser.close();
if (overflows.length) {
  console.error('\nPAGE COMPOSITION FAILED:');
  for (const o of overflows) {
    console.error(`  page ${o.page}: ${o.overflowPx}px over${o.clipped ? ', clipped at the trim' : ''}`
      + (o.collided && o.collided.length ? `\n      text sitting on text: “${o.collided.join('” / “')}…”` : '')
      + (o.overflowPx > 1 && o.lastFits ? `\n      last element that fits: “${o.lastFits}…”` : ''));
  }
  process.exitCode = 1;
}
const kb = (readFileSync(PDF_OUT).length / 1024).toFixed(0);
console.log(`Wrote the monograph — ${P.length} pages, ${kb} KB, ${M.PAGE.width}×${M.PAGE.height}mm.`);
