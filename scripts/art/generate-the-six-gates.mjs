#!/usr/bin/env node
// Generates assets/art/the-six-gates.svg (+ .ar) — the plate for
// /my-standing.html.
//
// ─────────────────────────────────────────────────────────────────────
// WHAT IT ARGUES
// ─────────────────────────────────────────────────────────────────────
// `level_mark.gates` names six conditions and `level.gate_precedence`
// says every one of them is necessary: "A level mark of 92 with an
// examination at 68 is not a Distinction and is not an award." Six
// necessary conditions is a colonnade — remove one column and the
// entablature does not sag, it falls — and that is what this draws.
//
// The second thing it draws is the one the page it sits on exists for.
// Each column is marked with WHOSE condition it is: the ones a learner
// meets by working, and the ones that wait on a record the College
// itself has to make. A learner whose ten modules are complete and
// whose award waits on an examination table nobody has built has done
// everything asked of them, and a drawing that showed six identical
// columns would say otherwise.
//
// ─────────────────────────────────────────────────────────────────────
// THE GATES COME FROM marks.js, NOT FROM THIS FILE
// ─────────────────────────────────────────────────────────────────────
// `LEVEL_GATES` is the transcription of the instrument that the whole
// platform computes against, pinned to data/academic-regulations.json by
// tests/academic-standing.test.mjs. Importing it means a seventh gate,
// or a reworded one, moves the engine, the page and this drawing
// together. The OWNERSHIP is read the same way it is read on the page —
// from what the engine can and cannot observe today — and is stated in
// the drawing's own description so a reader who cannot see it is told
// the same thing.
//
//   node scripts/art/generate-the-six-gates.mjs [ar]

import { writeFileSync, mkdirSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { INK, SERIF, sansFor, isRtl, n, text, paragraph, drawn, rule, plate } from './lib/plate.mjs';
import { LEVEL_GATES } from '../../functions/_lib/academic/marks.js';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..');
const LANG = (process.argv[2] || 'en').toLowerCase();
const RTL = isRtl(LANG);
const SANS = sansFor(LANG);
const DISPLAY = RTL ? SANS : SERIF;
const ID = 'the-six-gates';
const OUT = path.join(ROOT, `assets/art/${ID}${RTL ? '.ar' : ''}.svg`);

// Which gates a learner meets by working, and which wait on a record the
// College has to make. Read from the gate ids rather than from their
// order, so a reordering of the instrument cannot silently re-attribute
// one of them.
const COLLEGE_GATES = new Set([
  'level.gate.examination_overall',
  'level.gate.examination_criterion_floor',
  'level.gate.examination_skill_floor',
  'level.gate.spoken_paper',
  'level.gate.staff_confirmation',
]);

const SHORT = {
  'level.gate.modules_complete': { en: ['Ten modules', 'completed'], ar: ['عشر وحدات', 'مكتملة'] },
  'level.gate.examination_overall': { en: ['70% on the', 'examination'], ar: ['70٪ في', 'الامتحان'] },
  'level.gate.examination_criterion_floor': { en: ['No criterion', 'below 50%'], ar: ['ولا معيار', 'دون 50٪'] },
  'level.gate.examination_skill_floor': { en: ['No skill', 'below 50%'], ar: ['ولا مهارة', 'دون 50٪'] },
  'level.gate.spoken_paper': { en: ['The spoken', 'paper passed'], ar: ['الورقة الشفوية', 'مجتازة'] },
  'level.gate.staff_confirmation': { en: ['A person', 'confirms it'], ar: ['إنسان', 'يؤكّدها'] },
};

const missing = LEVEL_GATES.filter((g) => !SHORT[g.id]);
if (missing.length) {
  throw new Error(
    `The instrument carries ${LEVEL_GATES.length} gates and this generator has short labels for `
    + `${Object.keys(SHORT).length}. Missing: ${missing.map((g) => g.id).join(', ')}. A drawing that `
    + 'silently omitted a necessary condition would show a colonnade with a column missing and call '
    + 'it complete — which is the opposite of what it argues.',
  );
}

const COPY = {
  en: {
    eyebrow: 'THE SIX GATES',
    lede: 'Every one of them is necessary. A classification never overrides a gate.',
    yours: 'MET BY YOUR WORK',
    ours: 'A RECORD THE COLLEGE MAKES',
    foot: 'Where a gate waits on the College’s own record, your record says so and marks the gate as the College’s.',
    title: 'The six necessary conditions of a level award, drawn as a colonnade and marked by whose each one is',
    desc:
      'Six columns carrying one entablature, because every condition of a level award is necessary '
      + 'and the structure does not stand without all six. The first column — ten modules completed — '
      + 'is drawn in the learner’s own colour, because it is met by their work. The other five are '
      + 'drawn in the College’s: the examination overall mark, the criterion floor, the skill floor, '
      + 'the spoken paper, and a person confirming the level is finished. Each of those is a record '
      + 'the College makes rather than work the learner does, and the learner’s own page marks them '
      + 'as the College’s for that reason.',
  },
  ar: {
    eyebrow: 'الشروط الستة',
    lede: 'كلُّها لازم. والتصنيف لا يعلو على شرط.',
    yours: 'يتحقّق بعملك',
    ours: 'سجلٌّ تصنعه الكلية',
    foot: 'وحيث ينتظر شرطٌ سجلَّ الكلية نفسها، قال سجلُّك ذلك وعدّ الشرط على الكلية.',
    title: 'الشروط الستة اللازمة لشهادة المستوى، مرسومةً رواقًا ومعلَّمًا كلٌّ منها بصاحبه',
    desc:
      'ستة أعمدة تحمل ساكفًا واحدًا، لأن كل شرط من شروط شهادة المستوى لازم ولا يقوم البناء إلا '
      + 'بالستة جميعًا. العمود الأول — إكمال الوحدات العشر — مرسوم بلون المتعلم، لأنه يتحقّق بعمله. '
      + 'وأما الخمسة الباقية فبلون الكلية: درجة الامتحان الإجمالية، وحدّ المعيار، وحدّ المهارة، '
      + 'والورقة الشفوية، وتأكيد إنسانٍ أن المستوى قد تمّ. وكلٌّ من هذه سجلٌّ تصنعه الكلية لا عملٌ '
      + 'يعمله المتعلم، ولذلك تعدّه صفحةُ المتعلم على الكلية.',
  },
};
const t = COPY[RTL ? 'ar' : 'en'];
const shortOf = (g) => (RTL ? SHORT[g.id].ar : SHORT[g.id].en);

// ── Geometry ─────────────────────────────────────────────────────────
const W = 900, H = 430;
const MARGIN = 74;
const SPAN = W - MARGIN * 2;
const COUNT = LEVEL_GATES.length;
const COL_W = 66;
const CAP_Y = 150;                 // underside of the entablature
const BASE_Y = 300;                // top of the stylobate
const step = SPAN / COUNT;
const centreOf = (i) => (RTL ? W - MARGIN - step * (i + 0.5) : MARGIN + step * (i + 0.5));

const bits = [];

// --- The heading ------------------------------------------------------
{
  const x0 = RTL ? W - MARGIN : MARGIN;
  const anchor = RTL ? 'end' : 'start';
  bits.push(text(t.eyebrow, {
    x: x0, y: 48, anchor, size: 10.5, weight: 700,
    tracking: RTL ? 0 : 2.4, fill: INK.cerulean, family: SANS,
  }));
  bits.push(text(t.lede, {
    x: x0, y: 76, anchor, size: 15, fill: INK.goldChampagne, family: DISPLAY,
  }));
}

// --- The entablature and the stylobate --------------------------------
// One beam over all six and one platform under them, drawn as single
// members: six separate lintels would say the conditions are independent
// and they are not.
{
  bits.push(`<rect data-pop="" x="${n(MARGIN - 10)}" y="${n(CAP_Y - 16)}" width="${n(SPAN + 20)}" height="16"`
    + ` fill="${INK.goldRoyal}" fill-opacity="0.26"/>`);
  bits.push(drawn(`M${n(MARGIN - 10)} ${n(CAP_Y - 16)}L${n(MARGIN + SPAN + 10)} ${n(CAP_Y - 16)}`, {
    stroke: INK.goldRich, width: 1.6, ms: 1100,
  }));
  bits.push(rule(MARGIN - 10, CAP_Y, MARGIN + SPAN + 10, CAP_Y, { stroke: INK.goldRoyal, width: 1, opacity: 0.55 }));

  bits.push(`<rect data-pop="" x="${n(MARGIN - 10)}" y="${n(BASE_Y)}" width="${n(SPAN + 20)}" height="12"`
    + ` fill="${INK.royalBlue}" fill-opacity="0.34"/>`);
  bits.push(drawn(`M${n(MARGIN - 10)} ${n(BASE_Y + 12)}L${n(MARGIN + SPAN + 10)} ${n(BASE_Y + 12)}`, {
    stroke: INK.sapphire, width: 1.4, ms: 1200,
  }));
}

// --- The six columns --------------------------------------------------
LEVEL_GATES.forEach((gate, i) => {
  const college = COLLEGE_GATES.has(gate.id);
  const cx = centreOf(i);
  const x0 = cx - COL_W / 2;
  const fill = college ? INK.goldRoyal : INK.sapphire;
  const stroke = college ? INK.goldRich : INK.cerulean;

  bits.push(`<rect data-pop="" x="${n(x0)}" y="${n(CAP_Y)}" width="${n(COL_W)}" height="${n(BASE_Y - CAP_Y)}"`
    + ` fill="${fill}" fill-opacity="${college ? 0.24 : 0.3}"/>`);
  bits.push(drawn(
    `M${n(x0)} ${n(BASE_Y)}L${n(x0)} ${n(CAP_Y)}M${n(x0 + COL_W)} ${n(BASE_Y)}L${n(x0 + COL_W)} ${n(CAP_Y)}`,
    { stroke, width: 1.4, ms: 800 + i * 110, cap: 'butt' },
  ));

  // Fluting, three lines per shaft. It is what makes the shapes read as
  // columns rather than as bars, and a colonnade is the whole argument.
  for (const f of [0.3, 0.5, 0.7]) {
    bits.push(rule(x0 + COL_W * f, CAP_Y + 10, x0 + COL_W * f, BASE_Y - 10,
      { stroke, width: 0.7, opacity: 0.35 }));
  }

  bits.push(text(String(gate.number || i + 1), {
    x: cx, y: CAP_Y + 26, anchor: 'middle', size: 12, weight: 700,
    fill: college ? INK.goldSoft : INK.goldChampagne, family: SANS, ltr: true, pop: true,
  }));

  shortOf(gate).forEach((line, k) => {
    bits.push(text(line, {
      x: cx, y: BASE_Y + 36 + k * 15, anchor: 'middle', size: 10.5,
      weight: k === 0 ? 700 : 400,
      fill: k === 0 ? INK.goldChampagne : INK.slateText, family: SANS, pop: true,
    }));
  });
});

// --- The key ----------------------------------------------------------
{
  const x0 = RTL ? W - MARGIN : MARGIN;
  const dir = RTL ? -1 : 1;
  let x = x0;
  for (const [label, ink] of [[t.yours, INK.sapphire], [t.ours, INK.goldRich]]) {
    bits.push(`<rect data-pop="" x="${n(RTL ? x - 10 : x)}" y="${n(101)}" width="10" height="10"`
      + ` fill="${ink}" fill-opacity="0.5" stroke="${ink}" stroke-width="1"/>`);
    bits.push(text(label, {
      x: x + dir * 18, y: 110, anchor: RTL ? 'end' : 'start', size: 10, weight: 700,
      tracking: RTL ? 0 : 1.6, fill: ink === INK.goldRich ? INK.goldSoft : INK.cerulean, family: SANS,
    }));
    x += dir * (44 + label.length * (RTL ? 6.6 : 7.2));
  }
}

// --- The foot ---------------------------------------------------------
{
  bits.push(rule(MARGIN, H - 62, W - MARGIN, H - 62, { stroke: INK.steel, width: 0.8, opacity: 0.3 }));
  bits.push(paragraph(t.foot, {
    x: W / 2, y: H - 38, width: SPAN - 40, anchor: 'middle', size: 11,
    fill: INK.goldSoft, family: SANS, lang: LANG,
  }));
}

mkdirSync(path.dirname(OUT), { recursive: true });
writeFileSync(OUT, plate({
  id: ID, lang: LANG, width: W, height: H, title: t.title, desc: t.desc, body: bits.join('\n  '),
}));
console.log(`art: ${path.relative(ROOT, OUT)} — ${COUNT} gates`);
