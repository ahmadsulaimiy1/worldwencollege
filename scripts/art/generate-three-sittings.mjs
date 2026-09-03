#!/usr/bin/env node
// Generates assets/art/three-sittings.svg (+ .ar) — the plate for
// /my-module.html.
//
// ─────────────────────────────────────────────────────────────────────
// WHAT IT ARGUES
// ─────────────────────────────────────────────────────────────────────
// `resit.attempts` allows three sittings, `resit.interval` puts a
// fortnight between them, `resit.cap` caps what a resit can count for,
// and `resit.fee` is nought. Drawn badly, that is a countdown: three
// boxes and then a cliff. Drawn honestly it is a MEASURED LINE with a
// door at the end of it, because the instrument does not stop at three
// — it says the level is repeated and the assessment is set afresh.
//
// So the three sittings are marks on one line, the intervals between
// them are drawn to scale and labelled with the fourteen days they
// actually are, and what follows the third is an ARCH rather than a
// wall. The cap and the fee are written under the line because they
// are conditions on every sitting rather than events in the sequence.
//
// ─────────────────────────────────────────────────────────────────────
// THE FIGURES COME FROM marks.js, NOT FROM THIS FILE
// ─────────────────────────────────────────────────────────────────────
// `RESIT` is the transcription of the instrument the whole platform
// computes against. Importing it means a fourth sitting, a different
// interval or a fee that stopped being nought moves the engine, the
// page and this drawing together — and the assertions below refuse to
// draw a line that no longer matches the rule it is drawing.
//
//   node scripts/art/generate-three-sittings.mjs [ar]

import { writeFileSync, mkdirSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { INK, SERIF, sansFor, isRtl, n, text, paragraph, drawn, rule, node, plate } from './lib/plate.mjs';
import { RESIT } from '../../functions/_lib/academic/marks.js';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..');
const LANG = (process.argv[2] || 'en').toLowerCase();
const RTL = isRtl(LANG);
const SANS = sansFor(LANG);
const DISPLAY = RTL ? SANS : SERIF;
const ID = 'three-sittings';
const OUT = path.join(ROOT, `assets/art/${ID}${RTL ? '.ar' : ''}.svg`);

// The drawing is composed for THREE marks on one line. Four would need a
// different composition, not a smaller gap, so it refuses rather than
// crowding itself and calling the result a plate.
if (RESIT.totalAttempts !== 3) {
  throw new Error(
    `This plate draws ${RESIT.totalAttempts} sittings on a line composed for three. The instrument has `
    + 'changed; recompose the drawing rather than letting it crowd itself.',
  );
}
if (RESIT.feeUsd !== 0) {
  throw new Error(
    'This plate states that a resit carries no fee, which is what resit.fee said when it was drawn. '
    + `It now says ${RESIT.feeUsd}. A drawing that kept the old sentence would be a published claim `
    + 'about money that is no longer true.',
  );
}

const COPY = {
  en: {
    eyebrow: 'THREE SITTINGS',
    lede: 'A first sitting and two resits, a fortnight apart — and a door at the end, not a wall.',
    sittings: ['First sitting', 'Resit', 'Resit'],
    gap: `${RESIT.minimumIntervalDays} days`,
    after: ['The level is repeated', 'and the assessment', 'is set afresh'],
    conditions: [
      `A mark earned at a resit counts to ${RESIT.markCap}`,
      'No fee, for a resit or for repeating a level',
      `A task first sat over ${RESIT.taskRefreshDays} days ago is set anew`,
    ],
    foot: 'A number already spent is never reissued: a sitting struck out on appeal gives the attempt back and keeps its place in the order.',
    title: 'The three sittings a learner is allowed, the fourteen days between them, and what the regulations do after the third',
    desc:
      'One measured line with three marks on it: a first sitting and two resits. The distance drawn '
      + 'between each pair is the fourteen days the regulations require between sittings, labelled as '
      + 'such rather than left as decoration. Past the third mark the line does not stop at a wall — '
      + 'it passes under an arch, which is the instrument’s own provision that the level is repeated '
      + 'and the assessment is set afresh rather than sat a fourth time. Beneath the line are the '
      + 'three conditions that hold at every sitting: a mark earned at a resit counts to seventy, '
      + 'nothing is charged for a resit or for repeating a level, and a task first sat more than a '
      + 'year ago is set anew rather than reissued.',
  },
  ar: {
    eyebrow: 'ثلاث جلسات',
    lede: 'جلسةٌ أولى وإعادتان بينهما أسبوعان — وفي الآخر بابٌ لا جدار.',
    sittings: ['الجلسة الأولى', 'إعادة', 'إعادة'],
    gap: `${RESIT.minimumIntervalDays} يومًا`,
    after: ['يُعاد المستوى', 'ويُوضع التقييم', 'من جديد'],
    conditions: [
      `الدرجة المكتسَبة في إعادةٍ تُحتسَب إلى ${RESIT.markCap}`,
      'ولا رسمَ على إعادةٍ ولا على إعادة مستوى',
      `والمهمّة التي مضى على أوّل جلوسٍ لها أكثر من ${RESIT.taskRefreshDays} يومًا تُوضع من جديد`,
    ],
    foot: 'والرقم المُنفَق لا يُعاد إصداره: الجلسةُ التي تُشطَب في تظلّمٍ تردُّ المحاولة وتحتفظ بموضعها في الترتيب.',
    title: 'الجلسات الثلاث المتاحة للمتعلّم، والأربعة عشر يومًا بينها، وما تصنعه اللائحة بعد الثالثة',
    desc:
      'خطٌّ مقيسٌ واحد عليه ثلاث علامات: جلسةٌ أولى وإعادتان. والمسافة المرسومة بين كلّ اثنتين هي '
      + 'الأربعة عشر يومًا التي تشترطها اللائحة بين الجلستين، مسمّاةً لا زخرفًا. وبعد العلامة الثالثة '
      + 'لا يقف الخطُّ عند جدار، بل يمرّ تحت عقدٍ هو نصُّ اللائحة نفسها: يُعاد المستوى ويُوضع التقييم '
      + 'من جديد لا يُجلَس له رابعةً. وتحت الخطّ الشروطُ الثلاثة القائمة في كلّ جلسة: الدرجة المكتسَبة '
      + 'في إعادةٍ تُحتسَب إلى سبعين، ولا يُتقاضى شيءٌ على إعادةٍ ولا على إعادة مستوى، والمهمّة التي '
      + 'مضى على أوّل جلوسٍ لها أكثر من سنةٍ تُوضع من جديد لا تُعاد.',
  },
};
const t = COPY[RTL ? 'ar' : 'en'];

// ── Geometry ─────────────────────────────────────────────────────────
const W = 900, H = 450;
const LINE_Y = 210;
const START = 118;
const STEP = 186;                     // the drawn fortnight
const ARCH_X = START + STEP * 3;      // where the line passes under the arch

const mirror = (x) => (RTL ? W - x : x);
const bits = [];

// --- The heading ------------------------------------------------------
{
  const x0 = RTL ? W - 62 : 62;
  const anchor = RTL ? 'end' : 'start';
  bits.push(text(t.eyebrow, {
    x: x0, y: 46, anchor, size: 10.5, weight: 700,
    tracking: RTL ? 0 : 2.4, fill: INK.cerulean, family: SANS,
  }));
  bits.push(text(t.lede, {
    x: x0, y: 74, anchor, size: 15, fill: INK.goldChampagne, family: DISPLAY,
  }));
}

// --- The line ---------------------------------------------------------
{
  const a = mirror(START - 34);
  const b = mirror(ARCH_X + 30);
  bits.push(drawn(`M${n(a)} ${n(LINE_Y)}L${n(b)} ${n(LINE_Y)}`, {
    stroke: INK.goldRoyal, width: 1.6, ms: 1000, cap: 'butt',
  }));
}

// --- The three sittings, and the fortnight between them ---------------
for (let i = 0; i < RESIT.totalAttempts; i += 1) {
  const x = mirror(START + STEP * i);
  bits.push(node(x, LINE_Y, { r: 13, fill: INK.midnight, stroke: INK.goldRich, width: 1.8 }));
  bits.push(text(String(i + 1), {
    x, y: LINE_Y + 4, anchor: 'middle', size: 11, weight: 700,
    fill: INK.goldChampagne, family: SANS, ltr: true, pop: true,
  }));
  bits.push(text(t.sittings[i], {
    x, y: LINE_Y - 30, anchor: 'middle', size: 11, weight: 700,
    fill: INK.goldChampagne, family: SANS, pop: true,
  }));

  if (i < RESIT.totalAttempts - 1) {
    // The interval, measured on the line rather than described beside
    // it: the fortnight is a distance in this drawing.
    const midX = mirror(START + STEP * i + STEP / 2);
    const from = mirror(START + STEP * i + 20);
    const to = mirror(START + STEP * (i + 1) - 20);
    bits.push(rule(from, LINE_Y + 26, to, LINE_Y + 26,
      { stroke: INK.sapphire, width: 1, opacity: 0.8 }));
    bits.push(rule(from, LINE_Y + 20, from, LINE_Y + 32, { stroke: INK.sapphire, width: 1 }));
    bits.push(rule(to, LINE_Y + 20, to, LINE_Y + 32, { stroke: INK.sapphire, width: 1 }));
    bits.push(text(t.gap, {
      x: midX, y: LINE_Y + 48, anchor: 'middle', size: 10, weight: 600,
      fill: INK.cerulean, family: SANS, pop: true,
    }));
  }
}

// --- The arch: what follows the third, and it is not a wall -----------
{
  const x = mirror(ARCH_X);
  const half = 46;
  const left = RTL ? x - half : x - half;
  const spring = LINE_Y - 26;
  const top = LINE_Y - 84;
  bits.push(drawn(
    `M${n(left)} ${n(LINE_Y)}L${n(left)} ${n(spring)}`
    + `A${n(half)} ${n(spring - top)} 0 0 1 ${n(left + half * 2)} ${n(spring)}`
    + `L${n(left + half * 2)} ${n(LINE_Y)}`,
    { stroke: INK.emerald, width: 1.8, ms: 1600, cap: 'butt' },
  ));
  bits.push(`<path data-pop="" d="M${n(left)} ${n(LINE_Y)}L${n(left)} ${n(spring)}`
    + `A${n(half)} ${n(spring - top)} 0 0 1 ${n(left + half * 2)} ${n(spring)}L${n(left + half * 2)} ${n(LINE_Y)}Z"`
    + ` fill="${INK.emerald}" fill-opacity="0.16"/>`);
  t.after.forEach((line, k) => {
    bits.push(text(line, {
      x, y: LINE_Y + 32 + k * 15, anchor: 'middle', size: 10.5,
      weight: k === 0 ? 700 : 400,
      fill: k === 0 ? INK.goldChampagne : INK.slateText, family: SANS, pop: true,
    }));
  });
}

// --- The conditions that hold at every sitting ------------------------
{
  const x0 = RTL ? W - 92 : 92;
  const anchor = RTL ? 'end' : 'start';
  const dot = RTL ? W - 78 : 78;
  t.conditions.forEach((line, k) => {
    const y = 316 + k * 24;
    bits.push(`<circle data-pop="" cx="${n(dot)}" cy="${n(y - 4)}" r="3" fill="${INK.goldRich}"/>`);
    bits.push(text(line, {
      x: x0, y, anchor, size: 11, fill: INK.goldSoft, family: SANS, pop: true,
    }));
  });
}

// --- The foot ---------------------------------------------------------
{
  bits.push(rule(62, H - 54, W - 62, H - 54, { stroke: INK.steel, width: 0.8, opacity: 0.3 }));
  bits.push(paragraph(t.foot, {
    x: W / 2, y: H - 30, width: W - 180, anchor: 'middle', size: 10.5,
    fill: INK.slateText, family: SANS, lang: LANG,
  }));
}

mkdirSync(path.dirname(OUT), { recursive: true });
writeFileSync(OUT, plate({
  id: ID, lang: LANG, width: W, height: H, title: t.title, desc: t.desc, body: bits.join('\n  '),
}));
console.log(`art: ${path.relative(ROOT, OUT)} — ${RESIT.totalAttempts} sittings, ${RESIT.minimumIntervalDays} days apart`);
