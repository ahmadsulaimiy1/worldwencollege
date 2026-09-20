/**
 * THE PLATES MUST FIT INSIDE THEIR OWN EDGES.
 *
 * ────────────────────────────────────────────────────────────────────
 * WHY THIS EXISTS
 * ────────────────────────────────────────────────────────────────────
 * An <svg> clips to its viewBox, silently. A label set past the right
 * edge is not an error, a warning, or a visible defect in the source —
 * it simply stops being drawn, mid-word, and the plate looks finished.
 *
 * It happened three times while the figure library was being built, and
 * each time it was found by looking at a picture:
 *
 *   RESERVE printed as INSTITUTIONAL with the rest off the plate.
 *   The benchmark caption printed as "TISH COUNCIL SAUDI $284".
 *   And the decade's closing figure — the single dominant element of
 *   the whole plate — printed as "$17." and fell off the edge.
 *
 * The third one was fixed twice by estimating glyph advance widths, and
 * both estimates were wrong. Estimating is the bug. This measures.
 *
 * Every exported figure is rendered in a real browser with the real
 * typefaces, and every text node in it is compared against the plate's
 * own bounds. A plate that cannot hold its own labels fails the build.
 *
 * ────────────────────────────────────────────────────────────────────
 * AND THE LABELS MUST NOT SIT ON EACH OTHER
 * ────────────────────────────────────────────────────────────────────
 * The second failure mode is the opposite of the first and just as
 * invisible in the source: text that fits the plate perfectly well and
 * prints through other text. The slope plate did it — two segments
 * whose researched figures are $15.5k and $13.0k land four units apart
 * on the axis, and their two-line labels are twelve units tall, so
 * "United Kingdom and Europe" printed across "$13.0k" and neither
 * could be read.
 *
 * The monograph's own composition check cannot catch this: it excludes
 * anything inside an <svg>, because a plate's rules and hatching
 * legitimately cross its own labels. So the plates are checked here
 * instead, text against text only.
 */
import { chromium } from 'playwright';
import { readFileSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const CHROME = '/opt/pw-browsers/chromium-1194/chrome-linux/chrome';

let pass = 0, fail = 0;
const check = (label, cond, detail) => {
  console.log((cond ? 'PASS ' : 'FAIL ') + label + (cond || detail === undefined ? '' : ` — ${detail}`));
  cond ? pass++ : fail++;
};

const F = await import(path.join(ROOT, 'scripts/publication/figures.mjs'));
const O = await import(path.join(ROOT, 'scripts/publication/openers.mjs'));
const PR = await import(path.join(ROOT, 'scripts/publication/pricing.mjs'));
const AL = await import(path.join(ROOT, 'scripts/publication/allocation.mjs'));
const { scenarios } = await import(path.join(ROOT, 'scripts/publication/projection.mjs'));
const { RISKS } = await import(path.join(ROOT, 'scripts/publication/plan-narrative.mjs'));

const FACES = readFileSync(path.join(ROOT, 'assets/fonts/monograph-faces.css'), 'utf8');
const GOT = AL.achievedProposed();
const LABELS = { payroll: 'Payroll', technology: 'Technology', opex: 'Operating',
  marketing: 'Marketing', reserve: 'Reserve', strategic: 'Strategic' };
const P = PR.PROPOSED.committed;
const BC = 2131 / (90 / 12);
const CORE = scenarios().core;

/* Every plate, built exactly as the publication builds it. A plate
   tested with different data from the one that ships is a plate that
   has not been tested. */
const PLATES = {
  'capital architecture': F.capitalArchitecture(GOT.lines, { labels: LABELS }),
  'price against the benchmark': F.attentionThreshold(
    Object.keys(PR.PRODUCTS).map((k) => ({
      name: PR.PRODUCTS[k].name, perHour: P[k] / PR.attentionHours(k), ownBand: k.startsWith('exec'),
    })), BC, { benchmarkLabel: 'British Council Saudi',
      band: { from: 200, to: 600, label: 'Executive coaching, one to one' } }),
  'assumed against researched': F.slope(PR.SEGMENTS.filter((s) => s.wtpAssumed).map((s) => ({
    name: s.short, from: s.wtpAssumed, to: s.wtpFull }))),
  'the decade': F.decade(CORE.years),
  'acquisition amortised': F.amortisation(
    [{ name: 'Gulf executive', cac: PR.CAC.gccExec }, { name: 'Gulf professional', cac: PR.CAC.gccProf },
      { name: 'UK and Europe', cac: PR.CAC.ukeu }],
    Object.keys(PR.CHANNELS).map((k) => {
      const t = PR.channelTerms(k, P);
      return { name: t.short, cac: t.cacPerSeat,
        note: `${t.agreements.toFixed(0)} agreements` };
    })),
  'risk matrix': F.riskMatrix(RISKS),

  /* THE SEVEN CHAPTER DATUMS, under the same two rules. They are drawn
     in the same grammar as the plates and they are just as capable of
     setting a label three units past their own edge — the difference
     is only that they are paler, and a pale label that is half drawn
     is harder to notice, not easier. */
  'I · resolutions': O.resolutions([
    { ordinal: 'Resolution one', title: 'The revenue-allocation framework', share: 1, figure: 'Every dollar collected' },
    { ordinal: 'Resolution two', title: 'The tariff solved from it', share: 0.63, figure: '63% of learners' },
    { ordinal: 'Resolution three', title: 'The two institutional channels', share: 0.37, figure: '37% of learners' },
  ]),
  'II · the ascent': O.ascent(PR.QUALIFICATIONS, 200),
  'III · reach': O.reach(PR.SEGMENTS.map((sg) => ({
    name: sg.short, reachable: sg.reachable, researched: Boolean(sg.evidence) }))),
  'IV · the colonnade': O.colonnade(Object.keys(P).map((k) => ({
    short: PR.PRODUCTS[k].name.replace('Executive ', 'Exec '), price: P[k],
    money: `$${P[k].toLocaleString()}`, entry: k === 'independent' }))),
  'V · the course': O.course(GOT.lines.map((l) => ({
    name: LABELS[l.key], share: l.target, retained: AL.RETAINED.includes(l.key) }))),
  'VI · the decade rule': O.decadeRule(CORE.years.map((y, i) => ({
    calendar: y.calendar, height: Math.max(0, y.netTuition),
    note: i === 0 ? `${y.newLearners} admitted` : `$${(y.netTuition / 1e6).toFixed(1)}M net tuition` })),
  Math.max(0, CORE.years.findIndex((y) => y.cumulativeSurplus > 0))),
  'VII · the chain': O.chain([
    { caption: 'Four files', items: ['tuition.json', 'commercial.json', 'market-evidence.json', 'masterplan.json'] },
    { caption: 'Three engines', items: ['pricing.mjs', 'allocation.mjs', 'projection.mjs'] },
    { caption: 'One document', items: ['This publication', 'Re-derived on every build'] },
  ]),
  'the cover rule': O.coverRule(2027, 2036, 10),
};

const browser = await chromium.launch({ executablePath: CHROME });
const page = await browser.newPage({ viewport: { width: 900, height: 700 } });
await page.setContent(`<!doctype html><meta charset="utf-8"><style>${FACES}
  body{margin:0;background:#fff}
  .plate{width:620px;margin:0 0 30px}</style>
  ${Object.entries(PLATES).map(([k, v]) => `<div class="plate" data-k="${k}">${v}</div>`).join('')}`,
{ waitUntil: 'load' });
await page.evaluate(() => document.fonts.ready);

const results = await page.evaluate(() => {
  const out = [];
  for (const wrap of document.querySelectorAll('.plate')) {
    const svg = wrap.querySelector('svg');
    const box = svg.getBoundingClientRect();
    const over = [];
    for (const t of svg.querySelectorAll('text')) {
      const r = t.getBoundingClientRect();
      if (r.width < 0.5) continue;
      // Half a pixel of tolerance for antialiasing, and no more.
      if (r.right > box.right + 0.5) over.push({ side: 'right', s: (t.textContent || '').slice(0, 26) });
      else if (r.left < box.left - 0.5) over.push({ side: 'left', s: (t.textContent || '').slice(0, 26) });
      else if (r.bottom > box.bottom + 0.5) over.push({ side: 'bottom', s: (t.textContent || '').slice(0, 26) });
    }
    /* TEXT AGAINST TEXT, MEASURED AS INK RATHER THAN AS METRICS.
       A text node's client rect is its FONT box: it runs from the
       face's ascent to its descent whatever the string contains, so
       "25%" set above "Reserve" with three clear units between them
       reports as an overlap, because the em box of a 15-point figure
       reaches further down than any digit in it does. Judged that way
       every struck figure in the library collides with its own
       descriptor and the check is worthless.

       So the vertical extent is taken from the canvas text metrics —
       actualBoundingBoxAscent and actualBoundingBoxDescent, which are
       the real inked extremes of these characters in this face — and
       the font box is inset by the difference. getClientRects rather
       than getBoundingClientRect, because the bounding rect of a
       multi-fragment node is the union of its pieces and reports
       overlaps that are not there. */
    const ctx = document.createElement('canvas').getContext('2d');
    const scale = box.width / svg.viewBox.baseVal.width;
    const boxes = [];
    for (const t of svg.querySelectorAll('text')) {
      const str = (t.textContent || '').trim();
      if (!str) continue;
      const cs = getComputedStyle(t);
      ctx.font = `${cs.fontStyle} ${cs.fontWeight} ${cs.fontSize} ${cs.fontFamily}`;
      const m = ctx.measureText(str);
      const topInset = Math.max(0, (m.fontBoundingBoxAscent - m.actualBoundingBoxAscent) * scale);
      const botInset = Math.max(0, (m.fontBoundingBoxDescent - m.actualBoundingBoxDescent) * scale);
      for (const r of t.getClientRects()) {
        if (r.width <= 0.5 || r.height <= 0.5) continue;
        const top = r.top + topInset, bottom = r.bottom - botInset;
        boxes.push({ left: r.left, right: r.right, top, bottom: Math.max(bottom, top + 0.5), s: str });
      }
    }
    const hits = [];
    for (let i = 0; i < boxes.length; i += 1) {
      for (let j = i + 1; j < boxes.length; j += 1) {
        const a = boxes[i], b = boxes[j];
        /* A full pixel of ink overlap in BOTH directions before it
           counts, so a descender grazing a cap line is not a failure. */
        const dx = Math.min(a.right, b.right) - Math.max(a.left, b.left);
        const dy = Math.min(a.bottom, b.bottom) - Math.max(a.top, b.top);
        if (dx > 1 && dy > 1) hits.push(`“${a.s.slice(0, 20)}” × “${b.s.slice(0, 20)}”`);
      }
    }
    out.push({ k: wrap.dataset.k, over, hits });
  }
  return out;
});
await browser.close();

for (const r of results) {
  check(`${r.k}: every label is drawn inside the plate`,
    r.over.length === 0,
    r.over.map((o) => `${o.side}: “${o.s}…”`).join(', '));
  check(`${r.k}: no label prints through another`,
    r.hits.length === 0, r.hits.slice(0, 4).join(', '));
}

console.log(`\n${pass} passed, ${fail} failed.`);
process.exitCode = fail ? 1 : 0;
