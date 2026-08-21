#!/usr/bin/env node
// Generates assets/art/publication-funnel.svg — the fourth living
// diagram (docs/digital-institution-masterplan.md, Layer 3).
//
// WHAT IT ARGUES
//
// /press/ makes two claims that pull in opposite directions, and states
// both: the College has produced a real body of work, and almost none of
// what it COULD produce has been produced, on purpose. Its standing
// instruction is "never publish to raise the count."
//
// A reader meeting a catalogue naturally assumes a short list means a
// small operation. The funnel says otherwise: the register holds
// seventy-four candidate resources, eleven are produced for readers, and
// the distance between those two numbers is a decision rather than a
// limitation. Two titles were formally withdrawn under the rule, and the
// withdrawal is on the record — so the diagram shows that branch too,
// because a rule with no visible cost is a slogan.
//
// The last stage is the one the page is most careful about. Every volume
// was reviewed, if at all, by the people who wrote it. So the review gate
// is drawn shut and the count beyond it is nought — the same convention
// the authority chain uses for the appointment gap, because it is the
// same kind of fact.
//
// THE NUMBERS
//
// Canonical source is scripts/build-press.js, which counts what is
// actually in publication/. tests/publication-press.test.mjs holds the
// page's count against the directory, and the block at the foot of this
// file's test coverage holds this drawing against the page.
//
//   node scripts/art/generate-publication-funnel.mjs [ar]

import { writeFileSync, mkdirSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { INK, SERIF, sansFor, isRtl, n, scale, text, drawn, rule, plate } from './lib/plate.mjs';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..');
const LANG = (process.argv[2] || 'en').toLowerCase();
const RTL = isRtl(LANG);
const SANS = sansFor(LANG);
const OUT = path.join(ROOT, `assets/art/publication-funnel${RTL ? '.ar' : ''}.svg`);

// ── The figures, as the Press publishes them ──────────────────────────
export const FIGURES = { candidates: 74, produced: 11, internal: 2, withdrawn: 2, reviewed: 0 };

const COPY = {
  en: {
    stages: [
      ['Candidate resources', 'in the register'],
      ['Produced for readers', 'composed, typeset, proofed'],
      ['Independently reviewed', 'no Academic Reviewer appointed'],
    ],
    ruleLabel: 'THE RULE',
    rule: 'Never publish to raise the count',
    ruleSub: 'A title that would not improve study, teaching or marking is not built.',
    withdrawn: ['withdrawn under the rule,', 'and recorded'],
    internal: 'further volumes produced for internal use',
    gate: 'THE GATE IS SHUT',
    gateSub: 'Every volume was reviewed, if at all, by the people who wrote it.',
    title: 'From the register to the shelf, and the gate at the end of it',
    desc:
      'A funnel in three stages. The register behind WEC Press holds seventy-four candidate resources. '
      + 'Eleven volumes have been produced for readers, composed, typeset and proofed, with two further volumes produced for internal use. '
      + 'The narrowing between seventy-four and eleven is deliberate: the Press publishes under a standing rule never to publish in order to raise the count, '
      + 'and two planned titles have been formally withdrawn under that rule with the withdrawal recorded rather than forgotten. '
      + 'The third stage is nought. No Academic Reviewer has been appointed, so no volume has been read independently of the people who wrote it, '
      + 'and the gate to that stage is drawn shut.',
  },
  ar: {
    stages: [
      ['موارد مرشّحة', 'في السجل'],
      ['أُنتجت للقرّاء', 'مؤلَّفة ومنضَّدة ومدقَّقة'],
      ['رُوجعت مراجعة مستقلة', 'لم يُعيَّن مراجع أكاديمي'],
    ],
    ruleLabel: 'القاعدة',
    rule: 'لا يُنشر شيء لرفع العدد',
    ruleSub: 'أي عنوان لا يحسّن الدراسة أو التدريس أو التصحيح لا يُنتَج.',
    withdrawn: ['سُحبا بموجب القاعدة،', 'والسحب مسجَّل'],
    internal: 'مجلّدان إضافيان أُنتجا للاستخدام الداخلي',
    gate: 'البوابة مغلقة',
    gateSub: 'كل مجلّد رُوجع — إن رُوجع — بمن كتبوه.',
    title: 'من السجل إلى الرف، والبوابة في نهايته',
    desc:
      'قمع من ثلاث مراحل. السجل خلف مطبعة الكلية يضم أربعة وسبعين موردًا مرشّحًا. '
      + 'وأُنتج أحد عشر مجلّدًا للقرّاء، ومجلّدان إضافيان للاستخدام الداخلي. '
      + 'والفارق بين الأربعة والسبعين والأحد عشر مقصود: المطبعة تعمل بقاعدة ثابتة ألا تنشر لرفع العدد، '
      + 'وقد سُحب عنوانان مخطَّطان رسميًا بموجبها، والسحب مسجَّل لا منسي. '
      + 'أما المرحلة الثالثة فصفر: لم يُعيَّن مراجع أكاديمي، فلم يُقرأ أي مجلّد قراءة مستقلة عمّن كتبوه، والبوابة إلى تلك المرحلة مرسومة مغلقة.',
  },
};
const t = COPY[LANG] || COPY.en;

// ── Geometry ───────────────────────────────────────────────────────────
const W = 900, H = 520;
const CX = W / 2;
const BAR_TOP = 84;
const BAR_H = 56;
const GAP = 92;
// 620 was the first choice and it pushed every right-hand label off the
// canvas: the widest bar reached x=760 and its label started at 782.
// The bars are the smaller half of this drawing — the labels beside them
// carry the meaning — so the bars give way.
const maxW = 430;
// Width is proportional to the count, with a floor so a stage of nought
// is still a visible place rather than nothing at all.
const wFor = (v) => Math.max(96, (v / FIGURES.candidates) * maxW);

const STAGE_V = [FIGURES.candidates, FIGURES.produced, FIGURES.reviewed];
const bits = [];

STAGE_V.forEach((v, i) => {
  const y = BAR_TOP + i * (BAR_H + GAP);
  const w = wFor(v);
  const live = v > 0;
  const tint = i === 0 ? INK.steel : i === 1 ? INK.goldRich : INK.burgundy;
  const [label, sub] = t.stages[i];

  bits.push(`<g data-pop="">`
    + `<rect x="${n(CX - w / 2)}" y="${n(y)}" width="${n(w)}" height="${BAR_H}" rx="3"`
    + ` fill="${live ? 'rgba(31,61,122,0.28)' : 'none'}" stroke="${tint}" stroke-width="${live ? 1.5 : 1.2}"`
    + `${live ? '' : ' stroke-dasharray="5 5"'} stroke-opacity="${live ? 1 : 0.7}"/>`
    + `</g>`);

  bits.push(text(String(v), {
    x: CX, y: y + 40, anchor: 'middle', size: 30, weight: 700,
    fill: live ? INK.goldChampagne : '#C9788A', family: SERIF, ltr: true, pop: true,
  }));
  bits.push(text(label, {
    x: CX + w / 2 + 22, y: y + 24, anchor: 'start', size: 14.5, weight: 700,
    fill: live ? INK.goldChampagne : '#C9788A', family: RTL ? SANS : SERIF, pop: true,
  }));
  bits.push(text(sub, {
    x: CX + w / 2 + 22, y: y + 42, anchor: 'start', size: 11.5,
    fill: INK.slateText, family: SANS, pop: true,
  }));
  // The internal volumes belong to the produced stage. Floated under the
  // bar they landed on the gate below.
  if (i === 1) {
    bits.push(text(`+ ${FIGURES.internal} ${t.internal}`, {
      x: CX + w / 2 + 22, y: y + 59, anchor: 'start', size: 10.5,
      fill: INK.steel, family: SANS, pop: true,
    }));
  }

  // The taper into the next stage.
  if (i < STAGE_V.length - 1) {
    const wNext = wFor(STAGE_V[i + 1]);
    const yb = y + BAR_H, yn = y + BAR_H + GAP;
    bits.push(drawn(`M${n(CX - w / 2)} ${n(yb)}L${n(CX - wNext / 2)} ${n(yn)}`,
      { stroke: INK.goldRoyal, width: 1.1, opacity: 0.5, ms: 900 }));
    bits.push(drawn(`M${n(CX + w / 2)} ${n(yb)}L${n(CX + wNext / 2)} ${n(yn)}`,
      { stroke: INK.goldRoyal, width: 1.1, opacity: 0.5, ms: 900 }));
  }
});

// ── What sits in each narrowing ───────────────────────────────────────
// Stage 1 → 2: the rule, and the two titles it cost.
{
  const y = BAR_TOP + BAR_H + GAP / 2;
  bits.push(text(t.ruleLabel, {
    x: CX, y: y - 20, anchor: 'middle', size: 9.5, weight: 700, tracking: RTL ? 0 : 2,
    fill: INK.cerulean, family: SANS, pop: true,
  }));
  bits.push(text(t.rule, {
    x: CX, y: y + 2, anchor: 'middle', size: 16, weight: 700,
    fill: INK.goldSoft, family: RTL ? SANS : SERIF, pop: true,
  }));
  bits.push(text(t.ruleSub, {
    x: CX, y: y + 22, anchor: 'middle', size: 10.5, fill: INK.slateText, family: SANS, pop: true,
  }));

  // The side-branch: what the rule actually cost. Anchored to the
  // canvas edge rather than offset from centre — measured outward from
  // the middle it ran off the left of the drawing entirely.
  const bx = RTL ? W - 64 : 64;
  const anchor = RTL ? 'end' : 'start';
  bits.push(text(String(FIGURES.withdrawn), {
    x: bx, y: y + 2, anchor, size: 26, weight: 700,
    fill: '#C9788A', family: SERIF, ltr: true, pop: true,
  }));
  // Two short lines rather than one long one: at full width the caption
  // ran under the centred rule text and the two overlapped.
  t.withdrawn.forEach((line, li) => {
    bits.push(text(line, {
      x: bx, y: y + 22 + li * 15, anchor, size: 10.5,
      fill: INK.slateText, family: SANS, pop: true,
    }));
  });
  const tick = RTL ? bx - 150 : bx + 150;
  bits.push(rule(tick, y - 4, tick + (RTL ? -34 : 34), y - 4,
    { stroke: INK.burgundy, width: 1, opacity: 0.55, dash: '3 3' }));
}

// Stage 2 → 3: the gate, drawn shut.
{
  const y = BAR_TOP + 2 * (BAR_H + GAP) - GAP / 2;
  const halfW = 84;
  bits.push(`<g data-pop="">`
    + `<path d="M${n(CX - halfW)} ${n(y)}L${n(CX + halfW)} ${n(y)}" stroke="${INK.burgundy}" stroke-width="2.4" stroke-linecap="round" fill="none"/>`
    + `<path d="M${n(CX - halfW + 14)} ${n(y - 9)}L${n(CX - halfW + 14)} ${n(y + 9)}`
    + `M${n(CX)} ${n(y - 9)}L${n(CX)} ${n(y + 9)}`
    + `M${n(CX + halfW - 14)} ${n(y - 9)}L${n(CX + halfW - 14)} ${n(y + 9)}"`
    + ` stroke="${INK.burgundy}" stroke-width="1.4" stroke-opacity="0.7" stroke-linecap="round" fill="none"/>`
    + `</g>`);
  bits.push(text(t.gate, {
    x: CX, y: y - 22, anchor: 'middle', size: 9.5, weight: 700, tracking: RTL ? 0 : 2,
    fill: '#C9788A', family: SANS, pop: true,
  }));
  bits.push(text(t.gateSub, {
    x: CX, y: y + 28, anchor: 'middle', size: 11.5, fill: INK.slateText, family: SANS, pop: true,
  }));
}

const svg = plate({
  id: 'publication-funnel', lang: LANG, width: W, height: H,
  title: t.title, desc: t.desc,
  body: bits.map((s) => '  ' + s).join('\n'),
});

mkdirSync(path.dirname(OUT), { recursive: true });
writeFileSync(OUT, svg);
console.log(`Wrote ${path.relative(ROOT, OUT)} — ${(svg.length / 1024).toFixed(1)} KB`);
