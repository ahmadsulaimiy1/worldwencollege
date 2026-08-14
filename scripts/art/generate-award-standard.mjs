#!/usr/bin/env node
// Generates assets/art/award-standard.svg (+ .ar) — the second living
// diagram (docs/digital-institution-masterplan.md, Layer 3).
//
// WHAT IT ARGUES
//
// /students/assessment/ makes one unusual claim and buries it in a
// table: an overall mark cannot carry a skill below its floor. Most
// frameworks let a strong skill compensate for a weak one without
// limit; this one caps compensation, and the cap rises with the band.
//
// A table states that. A drawing shows it: for each honour, the gap
// between the floor marker and the overall marker is the compensation
// the College will tolerate, and you can see it narrow as the bands
// climb. That is the whole reason this diagram exists, and it is why
// the axis starts at 50 rather than 0 — at 0 the bands crowd into the
// right-hand quarter and the gaps become invisible, which would leave a
// picture that says nothing the table did not.
//
// The fifth honour is deliberately off the scale. Distinction of the
// College is conferred by decision and never calculated, so plotting it
// against a percentage would be a lie in the shape of a diagram.
//
// THE NUMBERS
//
// Canonical source is the honours table in scripts/build-students.js,
// which is what /students/assessment/ and /students/awards/ both
// render. tests/award-diagram.test.mjs asserts this file and that table
// still agree, so the drawing cannot drift away from the policy it
// depicts.
//
//   node scripts/art/generate-award-standard.mjs [ar]

import { writeFileSync, mkdirSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { INK, SERIF, sansFor, isRtl, n, scale, text, drawn, rule, node, plate } from './lib/plate.mjs';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..');
const LANG = (process.argv[2] || 'en').toLowerCase();
const RTL = isRtl(LANG);
const SANS = sansFor(LANG);
const OUT = path.join(ROOT, `assets/art/award-standard${RTL ? '.ar' : ''}.svg`);

// ── The policy, as data ────────────────────────────────────────────────
export const BANDS = [
  { key: 'pass',        overall: 70, floor: 60, tint: INK.steel },
  { key: 'merit',       overall: 80, floor: 70, tint: INK.sapphire },
  { key: 'distinction', overall: 88, floor: 80, tint: INK.goldRoyal },
  { key: 'high',        overall: 94, floor: 88, tint: INK.goldRich },
];

const LABEL = {
  en: { pass: 'Pass', merit: 'Merit', distinction: 'Distinction', high: 'High Distinction',
        conferred: 'Distinction of the College' },
  ar: { pass: 'نجاح', merit: 'امتياز', distinction: 'تميّز', high: 'تميّز عالٍ',
        conferred: 'تميّز الكلية' },
};
const COPY = {
  en: {
    axis: 'OVERALL MARK',
    floor: 'no skill below',
    overall: 'overall',
    conferredNote: 'Conferred by decision, never calculated — and may be conferred in no cycle at all.',
    gap: 'the compensation allowed',
    title: 'The award standard',
    desc: 'Four calculated honours, each with an overall mark and a floor beneath which no single skill may fall. '
        + 'Pass is 70 per cent overall with no skill below 60. Merit is 80 with no skill below 70. '
        + 'Distinction is 88 with no skill below 80. High Distinction is 94 with no skill below 88. '
        + 'The distance between the floor and the overall mark is how far a strong skill may carry a weak one, '
        + 'and it narrows as the bands rise: ten points at Pass, six at High Distinction. '
        + 'A fifth honour, Distinction of the College, sits outside the scale because it is conferred by decision and never calculated. '
        + 'No honour of any kind has been conferred on anyone.',
  },
  ar: {
    axis: 'الدرجة الإجمالية',
    floor: 'ولا مهارة دون',
    overall: 'إجمالي',
    conferredNote: 'يُمنح بقرار، ولا يُحتسب أبدًا — وقد لا يُمنح في أي دورة على الإطلاق.',
    gap: 'حدّ التعويض المسموح',
    title: 'معيار الشهادات',
    desc: 'أربع مراتب محتسبة، لكل منها درجة إجمالية وحدّ أدنى لا تنزل تحته أي مهارة منفردة. '
        + 'النجاح 70 بالمئة إجمالًا ولا مهارة دون 60. والامتياز 80 ولا مهارة دون 70. '
        + 'والتميّز 88 ولا مهارة دون 80. والتميّز العالي 94 ولا مهارة دون 88. '
        + 'والمسافة بين الحدّ الأدنى والدرجة الإجمالية هي مدى ما تستطيع مهارة قوية أن تحمله عن مهارة ضعيفة، وهي تضيق كلما ارتفعت المرتبة. '
        + 'وثمة مرتبة خامسة، تميّز الكلية، خارج المقياس لأنها تُمنح بقرار ولا تُحتسب. '
        + 'ولم تُمنح أي مرتبة لأحد حتى الآن.',
  },
};
const t = COPY[LANG] || COPY.en;
const name = LABEL[LANG] || LABEL.en;

// ── Geometry ───────────────────────────────────────────────────────────
const W = 900, H = 512;
const M = { top: 118, lead: RTL ? 84 : 232, trail: RTL ? 232 : 84 };
const x = scale([50, 100], [M.lead, W - M.trail]);
const ROW_H = 74;
const rowY = (i) => M.top + i * ROW_H;

const bits = [];

// --- Axis -------------------------------------------------------------
const axisY = M.top - 64;
bits.push(text(t.axis, {
  x: RTL ? W - M.trail : M.lead, y: axisY - 26, anchor: RTL ? 'end' : 'start',
  size: 10.5, weight: 700, tracking: RTL ? 0 : 2.2, fill: INK.cerulean, family: SANS,
}));
for (let v = 50; v <= 100; v += 10) {
  bits.push(rule(x(v), axisY - 8, x(v), rowY(BANDS.length - 1) + 26, {
    stroke: INK.steel, width: 0.8, opacity: v === 100 ? 0.34 : 0.2, dash: '2 6',
  }));
  bits.push(text(`${v}%`, {
    x: x(v), y: axisY, anchor: 'middle', size: 11.5, weight: 700,
    fill: INK.cerulean, family: SANS, ltr: true, opacity: 0.9,
  }));
}

// --- One row per calculated honour ------------------------------------
BANDS.forEach((b, i) => {
  const y = rowY(i);
  const xFloor = x(b.floor);
  const xOverall = x(b.overall);

  // The full track, so each band is read against the same span.
  bits.push(rule(x(50), y, x(100), y, { stroke: INK.steel, width: 1, opacity: 0.22 }));

  // THE GAP. This bar is the diagram's whole argument — the distance a
  // strong skill may carry a weak one — so it is the heaviest mark in
  // the row and it draws itself in from the floor.
  bits.push(drawn(`M${n(xFloor)} ${n(y)}L${n(xOverall)} ${n(y)}`, {
    stroke: b.tint, width: 7, ms: 900 + i * 120, cap: 'butt', opacity: 0.5,
  }));
  bits.push(drawn(`M${n(xFloor)} ${n(y)}L${n(xOverall)} ${n(y)}`, {
    stroke: b.tint, width: 1.4, ms: 1200 + i * 120, cap: 'butt',
  }));

  // Floor marker: hollow, because it is a limit rather than a target.
  bits.push(node(xFloor, y, { r: 6, stroke: b.tint, core: null, width: 1.6 }));
  // Overall marker: solid, because it is the mark itself.
  bits.push(node(xOverall, y, { r: 7.5, stroke: INK.goldRich, core: INK.goldRich }));

  // The honour, on the leading side.
  bits.push(text(name[b.key], {
    x: RTL ? W - M.trail + 22 : M.lead - 22, y: y + 5, anchor: RTL ? 'start' : 'end',
    size: 17, weight: 700, fill: INK.goldChampagne, family: RTL ? SANS : SERIF, pop: true,
  }));

  // The two numbers, stated under their own markers so the row needs no
  // legend to be read.
  bits.push(text(`${b.floor}%`, {
    x: xFloor, y: y + 24, anchor: 'middle', size: 11, weight: 700,
    fill: b.tint, family: SANS, ltr: true, pop: true,
  }));
  bits.push(text(`${b.overall}%`, {
    x: xOverall, y: y - 16, anchor: 'middle', size: 13, weight: 700,
    fill: INK.goldChampagne, family: SANS, ltr: true, pop: true,
  }));
});

// --- The label that names what the bars mean --------------------------
{
  // Sits in the clear band between the axis numbers and the first row.
  // Placed above the axis it collided with the tick labels — the sort of
  // overlap that only shows once the thing is rendered.
  const b = BANDS[0], y = rowY(0);
  const midX = (x(b.floor) + x(b.overall)) / 2;
  bits.push(rule(midX, y - 26, midX, y - 9, { stroke: INK.cerulean, width: 0.9, opacity: 0.5 }));
  bits.push(text(RTL ? t.gap : t.gap.toUpperCase(), {
    x: midX, y: y - 34, anchor: 'middle', size: 10, weight: 700,
    tracking: RTL ? 0 : 1.8, fill: INK.cerulean, family: SANS, pop: true,
  }));
}

// --- The floor legend, under the last row -----------------------------
{
  const y = rowY(BANDS.length - 1) + 52;
  bits.push(text(`${t.floor} —`, {
    x: RTL ? W - M.trail + 22 : M.lead - 22, y, anchor: RTL ? 'start' : 'end',
    size: 11, weight: 700, tracking: RTL ? 0 : 1.4, fill: INK.steel, family: SANS,
  }));
  BANDS.forEach((b) => {
    bits.push(text(`${b.floor}%`, {
      x: x(b.floor), y, anchor: 'middle', size: 10.5, weight: 700,
      fill: INK.steel, family: SANS, ltr: true, opacity: 0.75,
    }));
  });
}

// --- The conferred honour, off the scale ------------------------------
{
  const y = H - 54;
  bits.push(rule(M.lead - 60, y - 42, W - M.trail + 60, y - 42, {
    stroke: INK.goldRoyal, width: 1, opacity: 0.3, dash: '1 7',
  }));
  const seal = RTL ? W - M.trail + 6 : M.lead - 6;
  bits.push(`<g data-pop>`
    + `<circle cx="${n(seal)}" cy="${n(y - 2)}" r="17" fill="none" stroke="${INK.goldRich}" stroke-width="1.4"/>`
    + `<circle cx="${n(seal)}" cy="${n(y - 2)}" r="11" fill="none" stroke="${INK.goldRoyal}" stroke-width="0.8" stroke-opacity="0.6"/>`
    + `</g>`);
  const tx = RTL ? seal - 32 : seal + 32;
  const anchor = RTL ? 'end' : 'start';
  bits.push(text(name.conferred, {
    x: tx, y: y - 6, anchor, size: 16, weight: 700,
    fill: INK.goldChampagne, family: RTL ? SANS : SERIF, pop: true,
  }));
  bits.push(text(t.conferredNote, {
    x: tx, y: y + 14, anchor, size: 11.5, fill: INK.slateText, family: SANS, pop: true,
  }));
}

const svg = plate({
  id: 'award-standard', lang: LANG, width: W, height: H,
  title: t.title, desc: t.desc,
  body: bits.map((s) => '  ' + s).join('\n'),
});

mkdirSync(path.dirname(OUT), { recursive: true });
writeFileSync(OUT, svg);
console.log(`Wrote ${path.relative(ROOT, OUT)} — ${(svg.length / 1024).toFixed(1)} KB`);
