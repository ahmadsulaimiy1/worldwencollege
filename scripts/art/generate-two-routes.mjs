#!/usr/bin/env node
// Generates assets/art/two-routes.svg (+ .ar) — the ninth living
// diagram (docs/digital-institution-masterplan.md, Layer 3).
//
// WHAT IT ARGUES
//
// /admissions/tuition/ publishes two prices for the same award and
// spends four paragraphs stopping the obvious wrong reading. A reader
// who sees $3,166.67 beside $600 concludes one of two things — that the
// cheaper figure buys less of a credential, or that the dearer one is
// padded — and both are wrong. The page's own sentence is the correction: "What
// separates the prices is not the credential. It is whether a person
// teaches you."
//
// Prose can only say that. A drawing can show it, because the two
// routes physically converge: one examination, one award, one register,
// drawn as a single seal both columns run into. Everything that differs
// is above the seal. Nothing that differs is below it.
//
// THE SECOND THING IT SHOWS, which is the one a fee schedule hides:
// where conferral is paid for. An enrolled student meets no graduation
// fee, and an independent candidate pays $200 to have the award
// conferred. Those look contradictory in a table and are not: the
// enrolled fee already contains that step. So the enrolled column is
// drawn as one undivided block with conferral named inside it, and the
// independent column is drawn in three separately bought pieces. The
// same money, itemised differently, is the whole explanation.
//
// THE NUMBERS
//
// Read from data/commercial.json and data/tuition.json, the two files
// scripts/build-commercial.mjs renders the page from. The generator
// refuses if they disagree with each other, so a drawing cannot survive
// a change to the model that nobody propagated.
//
//   node scripts/art/generate-two-routes.mjs [ar]

import { writeFileSync, mkdirSync, readFileSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { INK, SERIF, sansFor, isRtl, n, text, drawn, rule, node, plate } from './lib/plate.mjs';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..');
const LANG = (process.argv[2] || 'en').toLowerCase();
const RTL = isRtl(LANG);
const SANS = sansFor(LANG);
const DISPLAY = RTL ? SANS : SERIF;
const OUT = path.join(ROOT, `assets/art/two-routes${RTL ? '.ar' : ''}.svg`);

// ── The model ─────────────────────────────────────────────────────────
const C = JSON.parse(readFileSync(path.join(ROOT, 'data/commercial.json'), 'utf8'));
const T = JSON.parse(readFileSync(path.join(ROOT, 'data/tuition.json'), 'utf8'));

const STEPS = C.routes.independent.steps;
const stepTotal = STEPS.reduce((a, s) => a + s.cents, 0);
const levelFee = C.routes.enrolled.level_fee_cents;

if (levelFee !== T.level_fee_cents) {
  throw new Error(`data/commercial.json says a level costs ${levelFee} and data/tuition.json says `
    + `${T.level_fee_cents}. The drawing puts both routes' prices side by side; it cannot be `
    + 'rendered while the two ledgers disagree about one of them.');
}
if (!STEPS.some((s) => s.key === 'conferral')) {
  throw new Error('The independent route has no conferral step. This drawing exists to explain '
    + 'why an enrolled student meets no graduation fee while an independent candidate pays one. '
    + 'Without that step there is nothing to explain and the drawing should be withdrawn.');
}

// Money is formatted exactly as the page formats it — cents shown where
// the figure has them, so a reader moving between the drawing and the
// fee ladder never meets two spellings of one number.
const money = (cents) => '$' + (cents / 100).toLocaleString('en-US', {
  minimumFractionDigits: cents % 100 ? 2 : 0,
  maximumFractionDigits: cents % 100 ? 2 : 0,
});

const programmeEnrolled = C.routes.enrolled.programme_total_usd * 100;
const programmeIndependent = stepTotal * T.levels;

const COPY = {
  en: {
    eyebrow: 'TWO ROUTES, ONE AWARD',
    lede: 'What separates the prices is not the credential. It is whether a person teaches you.',
    enrolled: 'ENROLLED',
    independent: 'INDEPENDENT',
    perLevel: 'per level',
    enrolledNote: ['one fee, undivided —', 'conferral is inside it'],
    taught: 'a person teaches you',
    untaught: 'nobody teaches you',
    programme: 'the six levels',
    scaleNote: 'The columns show what each fee is made of, not how large it is.',
    meet: 'the same examination, the same award,\nthe same entry in the register',
    stepNames: {
      materials: 'Access to the level',
      assessment: 'The level examination',
      conferral: 'The award and its record',
    },
    title: 'Two routes to the same award, and where each one pays for conferral',
    desc:
      'Two columns of fees running down into one seal. The left column is the enrolled route: '
      + `a single undivided block of ${money(levelFee)} per level, with conferral inside it, `
      + `which is why an enrolled student meets no graduation fee. Across the six levels that is `
      + `${money(programmeEnrolled)}, and it buys teaching — a person teaches you. `
      + 'The right column is the independent route, drawn in three separately bought pieces: '
      + STEPS.map((s) => `${s.en.name.toLowerCase()} at ${money(s.cents)}`).join(', ')
      + `. They total ${money(stepTotal)} a level and ${money(programmeIndependent)} across the six, `
      + 'and they buy no teaching at all. The two columns run down into a single seal at the '
      + 'bottom, because the examination, the award and the entry in the register are the same on '
      + 'both routes. Everything that differs between them is above the seal. Nothing that differs '
      + 'is below it. The two columns are drawn at the same height because they show what each fee '
      + 'is made of rather than how large it is.',
  },
  ar: {
    eyebrow: 'طريقان، وشهادة واحدة',
    lede: 'ما يفرّق بين السعرين ليس الشهادة، بل أن يعلّمك إنسان أو لا يعلّمك.',
    enrolled: 'الملتحق',
    independent: 'المستقل',
    perLevel: 'للمستوى الواحد',
    enrolledNote: ['رسم واحد غير مجزّأ —', 'والمنح داخله'],
    taught: 'يعلّمك إنسان',
    untaught: 'لا أحد يعلّمك',
    programme: 'المستويات الستة',
    scaleNote: 'العمودان يبيّنان مِمَّ يتركّب كل رسم، لا كم يبلغ.',
    meet: 'الامتحان نفسه، والشهادة نفسها،\nوالقيد نفسه في السجل',
    stepNames: {
      materials: 'الوصول إلى المستوى',
      assessment: 'امتحان المستوى',
      conferral: 'الشهادة وقيدها',
    },
    title: 'طريقان إلى الشهادة نفسها، وأين يُدفع ثمن المنح في كل منهما',
    desc:
      'عمودان من الرسوم ينحدران إلى ختم واحد. العمود الأول طريق الملتحق: '
      + `كتلة واحدة غير مجزّأة قدرها ${money(levelFee)} للمستوى، والمنح داخلها، `
      + 'ولذلك لا يلقى الملتحق رسم تخرّج. '
      + `وفي المستويات الستة يبلغ ذلك ${money(programmeEnrolled)}، وهو يشتري التدريس — أن يعلّمك إنسان. `
      + 'والعمود الثاني طريق المستقل، مرسوم في ثلاث قطع تُشترى منفصلة: '
      + STEPS.map((s) => `${s.ar.name} بـ ${money(s.cents)}`).join('، ')
      + `. ومجموعها ${money(stepTotal)} للمستوى و${money(programmeIndependent)} للمستويات الستة، `
      + 'ولا تشتري تدريسًا البتة. '
      + 'وينحدر العمودان إلى ختم واحد في الأسفل، لأن الامتحان والشهادة والقيد في السجل '
      + 'واحدة في الطريقين. وكل ما يفترق بينهما فوق الختم، ولا شيء يفترق تحته. '
      + 'والعمودان مرسومان بارتفاع واحد لأنهما يبيّنان مِمَّ يتركّب كل رسم لا كم يبلغ.',
  },
};
const t = COPY[LANG] || COPY.en;

// ── Geometry ──────────────────────────────────────────────────────────
const W = 900, H = 654;
const COL_W = 200;
const TOP = 182, BOT = 392;          // the columns' extent
const SEAL = { x: 450, y: 526, r: 21 };

// Mirrored coordinates carry the right-to-left layout, never
// text-anchor — see the note in lib/plate.mjs.
const enrolledMid = RTL ? 650 : 250;
const independentMid = RTL ? 250 : 650;
// The gutter labels for the independent steps sit between the columns
// and read inward, so they never crowd the canvas edge.
const stepLabelX = RTL ? independentMid + COL_W / 2 + 16 : independentMid - COL_W / 2 - 16;
const stepLabelAnchor = RTL ? 'start' : 'end';

const bits = [];

// --- The heading ------------------------------------------------------
{
  const x0 = RTL ? W - 92 : 92;
  const anchor = RTL ? 'end' : 'start';
  bits.push(text(t.eyebrow, {
    x: x0, y: 52, anchor, size: 10.5, weight: 700,
    tracking: RTL ? 0 : 2.4, fill: INK.cerulean, family: SANS,
  }));
  bits.push(text(t.lede, {
    x: x0, y: 80, anchor, size: 14, fill: INK.slateText, family: SANS,
  }));
}

// --- Column headings --------------------------------------------------
for (const [mid, label, sub] of [
  [enrolledMid, t.enrolled, t.taught],
  [independentMid, t.independent, t.untaught],
]) {
  bits.push(text(label, {
    x: mid, y: 136, anchor: 'middle', size: 15, weight: 700,
    tracking: RTL ? 0 : 2.2, fill: INK.goldChampagne, family: DISPLAY, pop: true,
  }));
  bits.push(text(sub, {
    x: mid, y: 160, anchor: 'middle', size: 11.5,
    fill: INK.slateText, family: SANS, opacity: 0.9, pop: true,
  }));
}

// --- The enrolled column: one undivided block -------------------------
{
  const x0 = enrolledMid - COL_W / 2;
  bits.push(`<rect data-pop="" x="${n(x0)}" y="${n(TOP)}" width="${n(COL_W)}" height="${n(BOT - TOP)}"`
    + ` fill="${INK.royalBlue}" fill-opacity="0.3"/>`);
  bits.push(drawn(
    `M${n(x0)} ${n(BOT)}L${n(x0)} ${n(TOP)}L${n(x0 + COL_W)} ${n(TOP)}L${n(x0 + COL_W)} ${n(BOT)}`,
    { stroke: INK.sapphire, width: 1.6, ms: 1100, cap: 'butt' },
  ));
  bits.push(text(money(levelFee), {
    x: enrolledMid, y: TOP + 76, anchor: 'middle', size: 30, weight: 700,
    fill: INK.goldChampagne, family: DISPLAY, ltr: true, pop: true,
  }));
  bits.push(text(t.perLevel, {
    x: enrolledMid, y: TOP + 98, anchor: 'middle', size: 11, weight: 700,
    tracking: RTL ? 0 : 1.4, fill: INK.cerulean, family: SANS, pop: true,
  }));
  // The sentence that resolves the apparent contradiction with the
  // conferral fee in the other column.
  t.enrolledNote.forEach((line, i) => {
    bits.push(text(line, {
      x: enrolledMid, y: TOP + 142 + i * 17, anchor: 'middle', size: 11,
      fill: INK.slateText, family: SANS, pop: true,
    }));
  });
}

// --- The independent column: three separately bought pieces -----------
{
  const x0 = independentMid - COL_W / 2;
  const H_TOTAL = BOT - TOP;
  let y = TOP;
  STEPS.forEach((s, i) => {
    const h = (s.cents / stepTotal) * H_TOTAL;
    bits.push(`<rect data-pop="" x="${n(x0)}" y="${n(y)}" width="${n(COL_W)}" height="${n(h)}"`
      + ` fill="${s.key === 'conferral' ? INK.goldRoyal : INK.teal}" fill-opacity="0.28"/>`);
    bits.push(drawn(
      `M${n(x0)} ${n(y + h)}L${n(x0)} ${n(y)}L${n(x0 + COL_W)} ${n(y)}L${n(x0 + COL_W)} ${n(y + h)}`,
      { stroke: s.key === 'conferral' ? INK.goldRich : INK.teal, width: 1.4, ms: 900 + i * 150, cap: 'butt' },
    ));
    bits.push(text(money(s.cents), {
      x: independentMid, y: y + h / 2 + 5, anchor: 'middle', size: 15, weight: 700,
      fill: INK.goldChampagne, family: SANS, ltr: true, pop: true,
    }));
    bits.push(text(t.stepNames[s.key], {
      x: stepLabelX, y: y + h / 2 + 4, anchor: stepLabelAnchor, size: 11,
      fill: s.key === 'conferral' ? INK.goldSoft : INK.slateText, family: SANS, pop: true,
    }));
    y += h;
  });
}

// --- What the six levels come to, under each column -------------------
for (const [mid, total] of [
  [enrolledMid, programmeEnrolled],
  [independentMid, programmeIndependent],
]) {
  bits.push(text(money(total), {
    x: mid, y: BOT + 30, anchor: 'middle', size: 17, weight: 700,
    fill: INK.goldSoft, family: DISPLAY, ltr: true, pop: true,
  }));
  bits.push(text(t.programme, {
    x: mid, y: BOT + 48, anchor: 'middle', size: 10.5,
    fill: INK.steel, family: SANS, pop: true,
  }));
}

// --- The convergence --------------------------------------------------
// Both columns run into one seal. This is the argument: everything that
// differs is above it.
for (const mid of [enrolledMid, independentMid]) {
  bits.push(drawn(
    `M${n(mid)} ${n(BOT + 68)}C${n(mid)} ${n(BOT + 94)} ${n(SEAL.x)} ${n(BOT + 78)} ${n(SEAL.x)} ${n(SEAL.y - SEAL.r - 4)}`,
    { stroke: INK.goldRoyal, width: 1.2, ms: 1400, opacity: 0.6 },
  ));
}
bits.push(`<g data-pop="">`
  + `<circle cx="${n(SEAL.x)}" cy="${n(SEAL.y)}" r="${SEAL.r}" fill="none" stroke="${INK.goldRich}" stroke-width="1.5"/>`
  + `<circle cx="${n(SEAL.x)}" cy="${n(SEAL.y)}" r="${SEAL.r - 6}" fill="none" stroke="${INK.goldRoyal}" stroke-width="0.8" stroke-opacity="0.6"/>`
  + `<circle cx="${n(SEAL.x)}" cy="${n(SEAL.y)}" r="4" fill="${INK.goldRich}"/>`
  + `</g>`);
t.meet.split('\n').forEach((line, i) => {
  bits.push(text(line, {
    x: SEAL.x, y: SEAL.y + 44 + i * 19, anchor: 'middle', size: 12.5,
    fill: INK.goldChampagne, family: SANS, pop: true,
  }));
});

// WHAT THE COLUMNS ARE NOT. Drawn to scale, the independent column
// would be a fifth of the enrolled one and its three steps would be
// slivers nobody could label — so the two are drawn at equal height and
// read as compositions. That is a legitimate choice and an unstated one
// would be a misleading drawing, so the plate says which it is.
bits.push(text(t.scaleNote, {
  x: SEAL.x, y: H - 26, anchor: 'middle', size: 10.5,
  fill: INK.steel, family: SANS, pop: true,
}));

// A hairline under the columns, so the seal reads as below the fold
// where the two routes stop differing.
bits.push(rule(92, BOT + 62, W - 92, BOT + 62, { stroke: INK.steel, width: 0.9, opacity: 0.22 }));

const svg = plate({
  id: 'two-routes', lang: LANG, width: W, height: H,
  title: t.title, desc: t.desc,
  body: bits.filter(Boolean).map((s) => '  ' + s).join('\n'),
});

mkdirSync(path.dirname(OUT), { recursive: true });
writeFileSync(OUT, svg);
console.log(`Wrote ${path.relative(ROOT, OUT)} — ${(svg.length / 1024).toFixed(1)} KB`);
