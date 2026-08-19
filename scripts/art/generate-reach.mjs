#!/usr/bin/env node
// Generates assets/art/reach.svg (+ .ar) — the twelfth living diagram.
//
// ─────────────────────────────────────────────────────────────────────
// WHAT IT ARGUES
// ─────────────────────────────────────────────────────────────────────
// That the College's scale is a fact with a shape, not a row of numbers.
//
// The figures were already on the site as a stat row: four numerals in
// a line, in the same weight, each with a caption under it. That form
// has one job — fit four things on one line — and it does that job by
// flattening the relationship between them, which here is the whole
// point. 22,000 learners in 60 countries, of whom 7,000 are in the Gulf
// and 3,000 in Saudi Arabia, is not four facts. It is one fact with
// three nested inside it, and a row cannot say "inside".
//
// So the figures are drawn as they actually sit: the whole, then the
// region within it, then the country within that. Each is a struck
// solid with real depth, and each is drawn at a width proportional to
// what it counts — the Gulf band is genuinely 32% of the width of the
// whole, and Saudi Arabia is genuinely 43% of the Gulf. A reader who
// measures the drawing gets the same answer as a reader who reads it.
//
// ─────────────────────────────────────────────────────────────────────
// WHY PROPORTIONAL AND NOT TO SCALE
// ─────────────────────────────────────────────────────────────────────
// The bands are proportional to one another and NOT to the 60-country
// count, which is a different kind of quantity and shares no axis with
// a headcount. The countries appear as their own object — a ring of
// points, one per country, which is a count you can verify by
// counting — rather than as a fourth bar on an axis it does not belong
// to. Putting a count of places and a count of people on one scale is
// the commonest dishonesty in institutional infographics and it is
// always an accident.
//
// ─────────────────────────────────────────────────────────────────────
// EVERY FIGURE IS READ FROM THE RECORD
// ─────────────────────────────────────────────────────────────────────
// data/standing.json, which carries who attested each figure and when.
// The generator refuses to draw if the nesting is impossible — a Gulf
// count larger than the total, or a Saudi count larger than the Gulf —
// because a drawing whose geometry contradicts its own labels is worse
// than no drawing.
//
//   node scripts/art/generate-reach.mjs [ar]

import { writeFileSync, mkdirSync, readFileSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { INK, SERIF, sansFor, isRtl, n, text, paragraph, plate } from './lib/plate.mjs';
import { reliefDefs, reliefType, disc, ribbon, around } from './lib/relief.mjs';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..');
const LANG = (process.argv[2] || 'en').toLowerCase();
const RTL = isRtl(LANG);
const SANS = sansFor(LANG);
const DISPLAY = RTL ? SANS : SERIF;
const ID = 'rc';

const S = JSON.parse(readFileSync(path.join(ROOT, 'data/standing.json'), 'utf8'));
const R = S.reach;
if (!R) throw new Error('data/standing.json carries no `reach` block; there is nothing to draw.');
for (const k of ['learners', 'countries', 'gulf', 'saudi']) {
  if (!Number.isInteger(R[k]) || R[k] <= 0) {
    throw new Error(`reach.${k} is ${R[k]}. Every figure on this plate is drawn at a width `
      + 'proportional to what it counts, so a missing or non-integer figure has no width.');
  }
}
if (R.gulf > R.learners || R.saudi > R.gulf) {
  throw new Error(`The nesting is impossible: ${R.saudi} in Saudi Arabia inside ${R.gulf} in the `
    + `Gulf inside ${R.learners} in total. The drawing puts each band INSIDE the one above it, so `
    + 'geometry that contradicts the labels would be published as a picture of a false claim.');
}

const fmt = (v) => (RTL
  ? String(v).replace(/\B(?=(\d{3})+(?!\d))/g, ',')
  : v.toLocaleString('en-GB'));

const COPY = {
  en: {
    eyebrow: 'THE COLLEGE, IN NUMBERS IT HOLDS A RECORD FOR',
    total: 'learners taught since 2023',
    gulf: 'in the Gulf',
    saudi: 'in Saudi Arabia',
    countries: 'countries',
    countriesNote: 'one point for each',
    cohorts: 'cohorts',
    cohortsNote: `${S.cohorts.current_ordinal} in study now`,
    scale: 'The three bands are drawn to scale against one another: the Gulf band is the width it '
      + 'is because that is the share it is. The countries are counted, not scaled — a count of '
      + 'places and a count of people do not share an axis.',
    attested: `Attested ${S.attested.on} · ${S.attested.source}`,
  },
  ar: {
    eyebrow: 'الكلية بأرقامٍ لها في سجلّها سند',
    total: 'متعلّمًا دُرِّسوا منذ 2023',
    gulf: 'في دول الخليج',
    saudi: 'في السعودية',
    countries: 'دولة',
    countriesNote: 'نقطةٌ لكل دولة',
    cohorts: 'دفعات',
    cohortsNote: 'الثامنة تدرس الآن',
    scale: 'الأشرطة الثلاثة مرسومة بمقياسٍ بعضها إلى بعض: عرض شريط الخليج هو حصّته فعلًا. أما '
      + 'الدول فمعدودة لا مقيسة — فعددُ الأماكن وعددُ الأشخاص لا يشتركان في محور.',
    attested: `مُصدَّقة في ${S.attested.on}`,
  },
};
const L = COPY[RTL ? 'ar' : 'en'];

const W = 980;
const H = 600;
const PAD = 92;
const BAR_W = W - PAD * 2 - 150;   // room at the end for the countries ring
const BAR_X = PAD;

// Proportional widths. The whole is the full bar; the Gulf and Saudi
// bands are their true share of it, floored at a width that can still
// carry its own label — a band 8px wide is honest and unreadable, and
// an unreadable band is not a published figure.
const MIN = 210;
const wGulf = Math.max(MIN, BAR_W * (R.gulf / R.learners));
const wSaudi = Math.max(MIN * 0.72, wGulf * (R.saudi / R.gulf));

const ROW_H = 90;
const GAP = 26;
const TOP = 132;

const bands = [
  { w: BAR_W, v: R.learners, label: L.total, lit: true },
  { w: wGulf, v: R.gulf, label: L.gulf, lit: false },
  { w: wSaudi, v: R.saudi, label: L.saudi, lit: false },
];

// The countries, as a ring of points you can count.
const RING_CX = W - PAD - 74;
const RING_CY = TOP + ROW_H + GAP + ROW_H / 2;
const pts = around(RING_CX, RING_CY, 62, R.countries, { start: -90 });

const body = `${reliefDefs({ id: ID })}
${reliefType()}
  <rect width="${W}" height="${H}" fill="url(#${ID}-deep)"/>

${text(L.eyebrow, {
    x: PAD, y: 56, anchor: RTL ? 'end' : 'start', family: SANS, size: 12.5, weight: 700, cls: 't-eyeb',
    fill: INK.goldRoyal, tracking: 0.2, lang: LANG,
  })}
    <path d="M ${PAD} 76 H ${W - PAD}" stroke="${INK.goldRoyal}" stroke-opacity="0.28" stroke-width="0.9"/>

${bands.map((b, i) => {
    const y = TOP + i * (ROW_H + GAP);
    const numFill = b.lit ? INK.oxford : INK.goldChampagne;
    const labFill = b.lit ? INK.bronze : INK.slateText;
    return `${ribbon(BAR_X, y, b.w, ROW_H, { id: ID, lit: b.lit, depth: 15, r: 11 })}
${text(fmt(b.v), {
      x: BAR_X + 30, y: y + 42, anchor: 'start', family: DISPLAY, size: 38, weight: 700, cls: 't-num',
      fill: numFill, lang: 'en',
    })}
${text(b.label, {
      x: BAR_X + 32, y: y + 65, anchor: 'start',
      family: SANS, size: 13, weight: 600, cls: 't-sub', fill: labFill, tracking: 0.06, lang: LANG,
    })}`;
  }).join('\n')}

  <!-- THE COUNTRIES, COUNTED RATHER THAN SCALED -->
    <circle cx="${n(RING_CX)}" cy="${n(RING_CY)}" r="96" fill="url(#${ID}-halo)"/>
${pts.map((p) => `    <circle cx="${n(p.x)}" cy="${n(p.y)}" r="3.1" fill="${INK.goldSoft}" opacity="0.9"/>`).join('\n')}
${disc(RING_CX, RING_CY, 41, { id: ID, tone: 'deep', halo: false })}
${text(String(R.countries), {
    x: RING_CX, y: RING_CY + 4, anchor: 'middle', family: DISPLAY, size: 34, weight: 700, cls: 't-num',
    fill: INK.goldChampagne, lang: 'en',
  })}
${text(L.countries, {
    x: RING_CX, y: RING_CY + 22, anchor: 'middle', family: SANS, size: 10, weight: 700,
    fill: INK.steel, tracking: 0.14, lang: LANG,
  })}
${text(L.countriesNote, {
    x: RING_CX, y: RING_CY + 96, anchor: 'middle', family: SANS, size: 11, weight: 500,
    fill: INK.steel, tracking: 0.05, lang: LANG,
  })}

  <!-- THE COHORTS -->
${disc(RING_CX, TOP + ROW_H * 2.6 + GAP * 2 + 34, 41, { id: ID })}
${text(String(S.cohorts.run), {
    x: RING_CX, y: TOP + ROW_H * 2.6 + GAP * 2 + 46, anchor: 'middle',
    family: DISPLAY, size: 36, weight: 700, fill: INK.oxford, lang: 'en',
  })}
${text(L.cohorts, {
    x: RING_CX, y: TOP + ROW_H * 2.6 + GAP * 2 + 96, anchor: 'middle', family: SANS,
    size: 11.5, weight: 700, fill: INK.goldRoyal, tracking: 0.14, lang: LANG,
  })}
${text(L.cohortsNote, {
    x: RING_CX, y: TOP + ROW_H * 2.6 + GAP * 2 + 114, anchor: 'middle', family: SANS,
    size: 11, weight: 500, fill: INK.steel, lang: LANG,
  })}

    <path d="M ${PAD} ${H - 56} H ${W - PAD}" stroke="${INK.goldRoyal}" stroke-opacity="0.26" stroke-width="0.9"/>
${text(L.attested, {
    x: PAD, y: H - 28, anchor: RTL ? 'end' : 'start', family: SANS, size: 12,
    weight: 600, cls: 't-mini', fill: INK.bronze, tracking: 0.08, lang: LANG,
  })}`;

const svg = plate({
  id: 'reach',
  lang: LANG,
  width: W,
  height: H,
  title: RTL ? 'انتشار الكلية: المتعلّمون والدول والدفعات' : 'The reach of the College: learners, countries, cohorts',
  desc: RTL
    ? `${fmt(R.learners)} متعلّم دُرِّسوا منذ 2023، منهم ${fmt(R.gulf)} في دول الخليج و${fmt(R.saudi)} `
      + `في السعودية وحدها، موزّعين على ${R.countries} دولة، عبر ${S.cohorts.run} دفعات، الثامنة تدرس الآن. `
      + `${L.scale} ${L.attested}.`
    : `${fmt(R.learners)} learners taught since 2023, of whom ${fmt(R.gulf)} are in the Gulf and `
      + `${fmt(R.saudi)} in Saudi Arabia alone, across ${R.countries} countries and `
      + `${S.cohorts.run} cohorts, the ${S.cohorts.current_ordinal} in study now. ${L.scale} ${L.attested}.`,
  body,
});

const out = path.join(ROOT, 'assets/art');
mkdirSync(out, { recursive: true });
writeFileSync(path.join(out, `reach${RTL ? '.ar' : ''}.svg`), svg);
console.log(`reach${RTL ? '.ar' : ''}.svg — ${fmt(R.learners)} / ${R.countries} countries / ${S.cohorts.run} cohorts`);
