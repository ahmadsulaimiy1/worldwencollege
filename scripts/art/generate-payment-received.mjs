#!/usr/bin/env node
// Generates assets/art/payment-received.svg (+ .ar) — the plate for
// /student-portal/payment-complete/.
//
// ─────────────────────────────────────────────────────────────────────
// WHAT IT ARGUES
// ─────────────────────────────────────────────────────────────────────
// A person who has just paid $3,166.67 to an institution they have
// never walked into is asking one question, and it is not "did the
// transaction succeed". It is: what does the College now owe me, and
// what can I still undo?
//
// So the drawing is a SEQUENCE with a WINDOW UNDER IT. Four stations
// carry the charge from the card to a place on the programme — the
// charge leaves, the money is received, a numbered receipt is issued,
// the level opens — and beneath them a bracket spans the fourteen days
// in which Decision E1 returns the whole sum, no reason required, as
// long as no assessed work has been opened. The bracket starts at the
// charge and not at the enrolment, because that is when the clock
// actually starts.
//
// Drawn the other way round — a tick, a receipt number and a "thank
// you" — it would be a transaction confirmation. This is a College
// telling somebody what it has undertaken.
//
// ─────────────────────────────────────────────────────────────────────
// THE FIGURES COME FROM data/tuition.json
// ─────────────────────────────────────────────────────────────────────
// The window is `refund_window_days` and the instalment cadence is
// `instalments_per_level`. Neither is typed here. The fee schedule
// publishes the same window in prose, and
// tests/commercial-model.test.mjs fails the build if the two disagree
// — which is what stops this drawing quietly outliving the policy it
// draws.
//
//   node scripts/art/generate-payment-received.mjs [ar]

import { readFileSync, writeFileSync, mkdirSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { INK, SERIF, sansFor, isRtl, n, text, paragraph, drawn, rule, node, plate } from './lib/plate.mjs';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..');
const TUITION = JSON.parse(readFileSync(path.join(ROOT, 'data/tuition.json'), 'utf8'));
const LANG = (process.argv[2] || 'en').toLowerCase();
const RTL = isRtl(LANG);
const SANS = sansFor(LANG);
const DISPLAY = RTL ? SANS : SERIF;
const ID = 'payment-received';
const OUT = path.join(ROOT, `assets/art/${ID}${RTL ? '.ar' : ''}.svg`);

const DAYS = TUITION.refund_window_days;
const PARTS = TUITION.instalments_per_level;

// The composition places four stations on one line. A fifth would need
// a different drawing, not a narrower gap.
const STATIONS = 4;
if (!Number.isInteger(DAYS) || DAYS <= 0) {
  throw new Error(`data/tuition.json holds no usable refund_window_days; got ${DAYS}.`);
}

const COPY = {
  en: {
    eyebrow: 'WHAT A PAYMENT SETS IN MOTION',
    lede: 'From the charge to a place on the programme — and the window that stays open behind it.',
    stations: [
      ['The charge leaves', 'your card, at your bank'],
      ['The money is received', 'and recorded in the ledger'],
      ['A receipt is issued', 'numbered, and yours to keep'],
      ['The level opens', 'and the work is there'],
    ],
    window: `${DAYS} days, and the work not opened`,
    windowNote: 'Refunded in full, no reason required',
    conditions: [
      `A level may be paid in ${PARTS} equal parts, at no charge for using them`,
      'A resit is never charged for, and neither is repeating a level',
      'Every figure is shown in dollars and in the currency you were charged in',
    ],
    foot: 'The receipt, the enrolment and the refund window are three separate records. Your statement of account shows all three, and a query about any of them is answered in writing by the Registry.',
    title: 'What a payment sets in motion at the College: four stations from the charge to an open level, and the fourteen-day window that runs beneath them',
    desc:
      'A single measured line carrying four stations. The first is the charge leaving the card at '
      + 'the payer’s own bank; the second is the money being received and recorded in the College’s '
      + 'ledger; the third is a numbered receipt being issued; the fourth is the level opening, with '
      + 'its work available. Beneath the line a bracket spans from the first station to the last, '
      + 'labelled with the fourteen days in which Executive Decision E1 returns the whole sum, no '
      + 'reason required, provided no assessed work in the level has been opened — the clock running '
      + 'from the charge rather than from the enrolment. Under the bracket are three standing '
      + 'conditions: a level may be paid in four equal parts at no charge for using them, nothing is '
      + 'ever charged for a resit or for repeating a level, and every figure is published in dollars '
      + 'and in the currency actually charged.',
  },
  ar: {
    eyebrow: 'ما تُحرِّكه الدفعة',
    lede: 'من خصم البطاقة إلى مقعدٍ في البرنامج — والنافذة التي تبقى مفتوحةً وراءها.',
    stations: [
      ['يُخصم المبلغ', 'من بطاقتك، في مصرفك'],
      ['يُستلَم المال', 'ويُقيَّد في السجل'],
      ['يُصدَر الإيصال', 'مرقَّمًا، وهو لك'],
      ['يُفتح المستوى', 'وعمله حاضرٌ فيه'],
    ],
    window: `${DAYS} يومًا، والعمل لم يُفتح`,
    windowNote: 'يُردُّ المبلغ كاملًا، ولا يُطلب سبب',
    conditions: [
      `ويجوز سداد المستوى على ${PARTS} أقساط متساوية، بلا رسمٍ على استعمالها`,
      'ولا يُتقاضى شيءٌ على إعادةٍ ولا على إعادة مستوى',
      'وكلُّ رقمٍ يُعرض بالدولار وبالعملة التي خُصمت منك',
    ],
    foot: 'الإيصال والقيد والنافذة ثلاثة سجلّاتٍ متمايزة. وكشفُ حسابك يعرضها جميعًا، وأيُّ استفسارٍ عن واحدٍ منها يُجاب كتابةً من مكتب المسجّل.',
    title: 'ما تُحرِّكه الدفعة في الكلّية: أربع محطّاتٍ من الخصم إلى مستوًى مفتوح، والأربعة عشر يومًا الجارية تحتها',
    desc:
      'خطٌّ مقيسٌ واحد عليه أربع محطّات. الأولى خصمُ المبلغ من البطاقة في مصرف الدافع، والثانية '
      + 'استلامُ المال وقيدُه في سجلّ الكلّية، والثالثة إصدارُ إيصالٍ مرقَّم، والرابعة فتحُ المستوى '
      + 'وإتاحةُ عمله. وتحت الخطّ قوسٌ يمتدّ من المحطّة الأولى إلى الأخيرة، مكتوبٌ عليه الأربعة عشر '
      + 'يومًا التي يردُّ فيها القرارُ التنفيذيُّ الأوّل المبلغَ كاملًا بلا سببٍ يُطلب، ما دام لم '
      + 'يُفتح عملٌ مُقيَّمٌ في المستوى — والمدّة تجري من الخصم لا من القيد. وتحت القوس ثلاثة شروطٍ '
      + 'قائمة: يجوز سداد المستوى على أربعة أقساطٍ متساوية بلا رسمٍ على استعمالها، ولا يُتقاضى شيءٌ '
      + 'على إعادةٍ ولا على إعادة مستوى، وكلُّ رقمٍ يُنشر بالدولار وبالعملة التي خُصمت فعلًا.',
  },
};
const t = COPY[RTL ? 'ar' : 'en'];

// ── Geometry ─────────────────────────────────────────────────────────
const W = 900, H = 470;
const LINE_Y = 176;
const START = 122;
const STEP = 218;
const END = START + STEP * (STATIONS - 1);
const BRACKET_Y = LINE_Y + 92;

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

// --- The line the charge travels along --------------------------------
{
  const a = mirror(START - 36);
  const b = mirror(END + 36);
  bits.push(drawn(`M${n(a)} ${n(LINE_Y)}L${n(b)} ${n(LINE_Y)}`, {
    stroke: INK.goldRoyal, width: 1.6, ms: 1100, cap: 'butt',
  }));
}

// --- The four stations ------------------------------------------------
t.stations.forEach(([head, under], i) => {
  const x = mirror(START + STEP * i);
  // The last station is the one that matters — a place, not a
  // transaction — so it is struck in emerald and the rest in gold. The
  // difference is the drawing saying which of the four the reader came
  // here for.
  const last = i === STATIONS - 1;
  bits.push(node(x, LINE_Y, {
    r: last ? 15 : 12,
    fill: INK.midnight,
    stroke: last ? INK.emerald : INK.goldRich,
    width: last ? 2.2 : 1.8,
  }));
  bits.push(text(String(i + 1), {
    x, y: LINE_Y + 4, anchor: 'middle', size: 11, weight: 700,
    fill: last ? INK.emerald : INK.goldChampagne, family: SANS, ltr: true, pop: true,
  }));
  bits.push(text(head, {
    x, y: LINE_Y - 34, anchor: 'middle', size: 11.5, weight: 700,
    fill: INK.goldChampagne, family: SANS, pop: true,
  }));
  bits.push(text(under, {
    x, y: LINE_Y - 18, anchor: 'middle', size: 10, fill: INK.slateText, family: SANS, pop: true,
  }));
});

// --- The window, drawn as a span rather than described as a rule ------
{
  const from = mirror(START);
  const to = mirror(END);
  const drop = 30;
  // A square bracket under the whole sequence: the clock runs from the
  // charge, not from the enrolment, and a bracket that started at
  // station four would be drawing a different policy.
  bits.push(drawn(
    `M${n(from)} ${n(BRACKET_Y - drop)}L${n(from)} ${n(BRACKET_Y)}`
    + `L${n(to)} ${n(BRACKET_Y)}L${n(to)} ${n(BRACKET_Y - drop)}`,
    { stroke: INK.sapphire, width: 1.3, ms: 1700, cap: 'butt' },
  ));
  bits.push(text(t.window, {
    x: W / 2, y: BRACKET_Y + 24, anchor: 'middle', size: 12, weight: 700,
    fill: INK.goldChampagne, family: SANS, pop: true,
  }));
  bits.push(text(t.windowNote, {
    x: W / 2, y: BRACKET_Y + 42, anchor: 'middle', size: 10.5,
    fill: INK.cerulean, family: SANS, pop: true,
  }));
}

// --- The conditions that hold whichever way it was paid ---------------
{
  const x0 = RTL ? W - 92 : 92;
  const anchor = RTL ? 'end' : 'start';
  const dot = RTL ? W - 78 : 78;
  t.conditions.forEach((line, k) => {
    const y = 356 + k * 22;
    bits.push(`<circle data-pop="" cx="${n(dot)}" cy="${n(y - 4)}" r="3" fill="${INK.goldRich}"/>`);
    bits.push(text(line, {
      x: x0, y, anchor, size: 11, fill: INK.goldSoft, family: SANS, pop: true,
    }));
  });
}

// --- The foot ---------------------------------------------------------
{
  bits.push(rule(62, H - 52, W - 62, H - 52, { stroke: INK.steel, width: 0.8, opacity: 0.3 }));
  bits.push(paragraph(t.foot, {
    x: W / 2, y: H - 28, width: W - 180, anchor: 'middle', size: 10.5,
    fill: INK.slateText, family: SANS, lang: LANG,
  }));
}

mkdirSync(path.dirname(OUT), { recursive: true });
writeFileSync(OUT, plate({
  id: ID, lang: LANG, width: W, height: H, title: t.title, desc: t.desc, body: bits.join('\n  '),
}));
console.log(`art: ${path.relative(ROOT, OUT)} — ${STATIONS} stations, a ${DAYS}-day window`);
