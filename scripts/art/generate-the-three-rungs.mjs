#!/usr/bin/env node
// Generates assets/art/the-three-rungs.svg (+ .ar) — the plate for
// /my-cases.html.
//
// ─────────────────────────────────────────────────────────────────────
// WHAT IT ARGUES
// ─────────────────────────────────────────────────────────────────────
// Decision E2 is built on one rule and the whole instrument follows
// from it: "at every stage the decision passes to somebody who was not
// part of the last one." A drawing of three boxes in a row would say
// the opposite — that the stages are three chances at the same desk.
//
// So this is a STAIR, and the two things it draws are the two things
// the rule asserts. Each rung stands further from the first decision
// than the one below it, and each rung is marked with a DIFFERENT
// hearer. The original decision sits at the foot, alone and unlabelled
// by any stage, because it is the thing being appealed rather than a
// stage of the appeal — and the distance from it is the argument.
//
// The interval is written on each rung, and the third one is written as
// the absence it is. `ANSWER_WORKING_DAYS.stage_three` is null because
// the Board of Governors has adopted no interval; the plate says the
// College holds itself to `SELF_BINDING_WORKING_DAYS` instead, in the
// same words the payload uses. A drawing that quietly rounded that null
// to a number would be adopting an interval on the Board's behalf, in
// ink, which is exactly the fault the null exists to prevent.
//
// ─────────────────────────────────────────────────────────────────────
// THE STAGES COME FROM cases.js, NOT FROM THIS FILE
// ─────────────────────────────────────────────────────────────────────
// `publishedProcedure()` is the same function the endpoint calls, so the
// hearer and the interval on this plate are the ones the server
// enforces and the page prints. A stage reworded in the instrument
// moves the module, the page and this drawing together, and the throw
// below makes a drawing that silently omitted one impossible to ship.
//
//   node scripts/art/generate-the-three-rungs.mjs [ar]

import { writeFileSync, mkdirSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { INK, SERIF, sansFor, isRtl, n, text, paragraph, drawn, rule, node, plate } from './lib/plate.mjs';
import { publishedProcedure } from '../../functions/_lib/registrar/cases.js';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..');
const LANG = (process.argv[2] || 'en').toLowerCase();
const RTL = isRtl(LANG);
const SANS = sansFor(LANG);
const DISPLAY = RTL ? SANS : SERIF;
const ID = 'the-three-rungs';
const OUT = path.join(ROOT, `assets/art/${ID}${RTL ? '.ar' : ''}.svg`);

const PROCEDURE = publishedProcedure();

// Short labels for the drawing. The published sentence is on the page;
// a plate carries the name of the hearer, not the paragraph about them.
const SHORT = {
  stage_one: {
    en: ['Stage one', 'A senior colleague', 'who did not decide it'],
    ar: ['المرحلة الأولى', 'زميلٌ أعلى', 'لم يقرّرها'],
  },
  stage_two: {
    en: ['Stage two', 'The Academic Senate', 'which marks nothing'],
    ar: ['المرحلة الثانية', 'مجلس الشيوخ الأكاديمي', 'وهو لا يصحّح ورقة'],
  },
  stage_three: {
    en: ['Stage three', 'A Governor', 'no Executive sits on the Board'],
    ar: ['المرحلة الثالثة', 'حاكمٌ من المجلس', 'ولا تنفيذيَّ في المجلس'],
  },
};

const missing = PROCEDURE.stages.filter((s) => !SHORT[s.stage]);
if (missing.length) {
  throw new Error(
    `The instrument publishes ${PROCEDURE.stages.length} stages and this generator has labels for `
    + `${Object.keys(SHORT).length}. Missing: ${missing.map((s) => s.stage).join(', ')}. A stair with a `
    + 'rung missing would show a shorter climb than the procedure actually requires.',
  );
}

const COPY = {
  en: {
    eyebrow: 'THE THREE RUNGS',
    lede: 'At every stage the decision passes to somebody who was not part of the last one.',
    origin: ['The decision', 'you are appealing'],
    days: (d) => `${d} working days`,
    selfBinding: (d) => `${d} working days, self-binding`,
    foot: 'No stage may be skipped by the College to reach a faster conclusion.',
    title: 'The three stages of an appeal, drawn as a stair climbing away from the decision being appealed',
    desc:
      'A stair of three rungs rising away from a single block at the foot, which is the decision being '
      + 'appealed. The first rung is heard by a member of academic staff senior to, and other than, the '
      + 'person who took that decision, and is answered within ten working days. The second is heard by '
      + 'the Academic Senate, which sets standards and marks no work, within twenty. The third is heard '
      + 'by a Governor, and no member of the Executive sits on the Board; the College publishes no '
      + 'interval for it and holds itself to twenty working days instead, which the plate labels as '
      + 'self-binding rather than published. Each rung stands further from the original decision than '
      + 'the one below it, which is the rule the whole procedure is built on drawn as distance.',
  },
  ar: {
    eyebrow: 'الدرجات الثلاث',
    lede: 'في كلّ مرحلةٍ ينتقل القرار إلى مَن لم يكن طرفًا في سابقتها.',
    origin: ['القرار الذي', 'تتظلّم منه'],
    days: (d) => `${d} أيّام عمل`,
    selfBinding: (d) => `${d} يومَ عملٍ تُلزم بها الكلّيةُ نفسَها`,
    foot: 'ولا يجوز للكلّية أن تتخطّى مرحلةً لتبلغ نتيجةً أسرع.',
    title: 'مراحل التظلّم الثلاث، مرسومةً سلَّمًا يصعد مبتعدًا عن القرار المتظلَّم منه',
    desc:
      'سلَّمٌ من ثلاث درجاتٍ يرتفع مبتعدًا عن كتلةٍ واحدةٍ في أسفله هي القرار المتظلَّم منه. الدرجة الأولى '
      + 'يسمعها عضو هيئةٍ أكاديميّةٍ أعلى من صاحب ذلك القرار وغيرُه، ويُجاب عنها في عشرة أيّام عمل. '
      + 'والثانية يسمعها مجلس الشيوخ الأكاديمي، وهو يضع المعايير ولا يصحّح عملًا، في عشرين يومًا. '
      + 'والثالثة يسمعها حاكم، ولا يجلس في المجلس أحدٌ من التنفيذيّين؛ ولا تنشر الكلّية مدّةً لها '
      + 'وتُلزم نفسها بعشرين يوم عملٍ بدلًا من ذلك، وقد وُسم ذلك في اللوحة إلزامًا ذاتيًّا لا نشرًا. '
      + 'وكلُّ درجةٍ أبعدُ عن القرار الأصلي ممّا تحتها، وتلك هي القاعدة التي بُني عليها الإجراء كلُّه، '
      + 'مرسومةً مسافةً.',
  },
};
const t = COPY[RTL ? 'ar' : 'en'];
const shortOf = (s) => (RTL ? SHORT[s.stage].ar : SHORT[s.stage].en);

// ── Geometry ─────────────────────────────────────────────────────────
const W = 900, H = 470;
const FOOT_Y = 376;                 // the tread of the original decision
const RISE = 82;                    // how far each rung climbs
const RUN = 208;                    // how far each rung travels
const X0 = 96;                      // the origin block's leading edge
const BLOCK_W = 176;
const TREAD_W = 196;

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

// --- The decision being appealed --------------------------------------
// Drawn in the College's blue and unnumbered: it is not a stage of the
// appeal, it is the thing the appeal is about.
{
  const x = mirror(X0);
  const left = RTL ? x - BLOCK_W : x;
  bits.push(`<rect data-pop="" x="${n(left)}" y="${n(FOOT_Y - 44)}" width="${n(BLOCK_W)}" height="44"`
    + ` rx="6" fill="${INK.royalBlue}" fill-opacity="0.24" stroke="${INK.sapphire}" stroke-width="1.3"/>`);
  t.origin.forEach((line, k) => {
    bits.push(text(line, {
      x: left + BLOCK_W / 2, y: FOOT_Y - 26 + k * 15, anchor: 'middle', size: 10.5,
      weight: k === 0 ? 700 : 400,
      fill: k === 0 ? INK.goldChampagne : INK.slateText, family: SANS, pop: true,
    }));
  });
  bits.push(rule(left - 8, FOOT_Y, left + BLOCK_W + 8, FOOT_Y,
    { stroke: INK.steel, width: 1.2, opacity: 0.5 }));
}

// --- The three rungs --------------------------------------------------
PROCEDURE.stages.forEach((stage, i) => {
  const y = FOOT_Y - RISE * (i + 1);
  const startX = X0 + BLOCK_W + RUN * i;
  const x = mirror(startX);
  const left = RTL ? x - TREAD_W : x;

  // The riser: the climb from the tread below to this one.
  const priorY = FOOT_Y - RISE * i;
  const riserX = RTL ? x + 0 : x;
  bits.push(drawn(`M${n(riserX)} ${n(priorY)}L${n(riserX)} ${n(y)}`, {
    stroke: INK.goldRoyal, width: 1.4, ms: 900 + i * 150, cap: 'butt',
  }));

  // The tread.
  bits.push(`<rect data-pop="" x="${n(left)}" y="${n(y - 52)}" width="${n(TREAD_W)}" height="52"`
    + ` rx="6" fill="${INK.goldRoyal}" fill-opacity="0.2" stroke="${INK.goldRich}" stroke-width="1.3"/>`);
  bits.push(drawn(`M${n(left)} ${n(y)}L${n(left + TREAD_W)} ${n(y)}`, {
    stroke: INK.goldRich, width: 1.6, ms: 1050 + i * 150, cap: 'butt',
  }));

  // The hearer, marked as a node so that three DIFFERENT people is
  // visible as three marks rather than only as three words.
  bits.push(node(left + TREAD_W / 2, y - 66, { r: 9, fill: INK.midnight, stroke: INK.goldRich, width: 1.5 }));

  shortOf(stage).forEach((line, k) => {
    bits.push(text(line, {
      x: left + TREAD_W / 2, y: y - 34 + k * 15, anchor: 'middle',
      size: k === 0 ? 11.5 : 10,
      weight: k === 0 ? 700 : 400,
      fill: k === 0 ? INK.goldChampagne : INK.slateText, family: SANS, pop: true,
    }));
  });

  // The interval, or the absence of one said in the plate's own ink.
  const label = typeof stage.workingDays === 'number'
    ? t.days(stage.workingDays)
    : t.selfBinding(PROCEDURE.selfBindingWorkingDays);
  bits.push(text(label, {
    x: left + TREAD_W / 2, y: y + 18, anchor: 'middle', size: 9.5, weight: 600,
    fill: typeof stage.workingDays === 'number' ? INK.goldSoft : INK.cerulean,
    family: SANS, pop: true,
  }));
});

// --- The foot ---------------------------------------------------------
{
  bits.push(rule(62, H - 58, W - 62, H - 58, { stroke: INK.steel, width: 0.8, opacity: 0.3 }));
  bits.push(paragraph(t.foot, {
    x: W / 2, y: H - 34, width: W - 180, anchor: 'middle', size: 11,
    fill: INK.goldSoft, family: SANS, lang: LANG,
  }));
}

mkdirSync(path.dirname(OUT), { recursive: true });
writeFileSync(OUT, plate({
  id: ID, lang: LANG, width: W, height: H, title: t.title, desc: t.desc, body: bits.join('\n  '),
}));
console.log(`art: ${path.relative(ROOT, OUT)} — ${PROCEDURE.stages.length} rungs`);
