#!/usr/bin/env node
// Generates assets/art/how-a-balance-is-struck.svg (+ .ar) — the plate
// for /my-account/.
//
// ─────────────────────────────────────────────────────────────────────
// WHAT IT ARGUES
// ─────────────────────────────────────────────────────────────────────
// Every institution shows a learner a balance. Almost none show how the
// balance was arrived at, and the effect is that a figure a person is
// asked to pay arrives with no working — so a query about it is a query
// about a number nobody can inspect, and it becomes a conversation
// about trust rather than about arithmetic.
//
// functions/_lib/student/finance.js publishes the identity instead:
//
//     outstanding = assessed − relief − paid + refunded
//
// and returns every term with it, plus a boolean saying whether they
// balance. This drawing is that identity as an object: one bar for what
// was assessed, two bites taken out of it for relief and for what has
// been paid, one piece added back for anything refunded, and what
// remains standing at the end.
//
// ─────────────────────────────────────────────────────────────────────
// NO FIGURES ON IT, DELIBERATELY
// ─────────────────────────────────────────────────────────────────────
// The plate is on a page that will render the reader's OWN numbers a
// few centimetres below it. A worked example in gold beside a real
// balance in black is two sets of figures on one screen, and the first
// person to confuse them will be the person querying a charge.
//
// The proportions are therefore illustrative and the drawing says so in
// its own description — they are not a claim about anybody's account,
// and no figure here needs to come from data/standing.json because none
// is published.
//
//   node scripts/art/generate-how-a-balance-is-struck.mjs [ar]

import { writeFileSync, mkdirSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { INK, SERIF, sansFor, isRtl, n, text, paragraph, drawn, rule, plate } from './lib/plate.mjs';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..');
const LANG = (process.argv[2] || 'en').toLowerCase();
const RTL = isRtl(LANG);
const SANS = sansFor(LANG);
const DISPLAY = RTL ? SANS : SERIF;
const ID = 'how-a-balance-is-struck';
const OUT = path.join(ROOT, `assets/art/${ID}${RTL ? '.ar' : ''}.svg`);

const COPY = {
  en: {
    eyebrow: 'HOW A BALANCE IS STRUCK',
    lede: 'Four terms, and the College publishes every one of them.',
    assessed: 'ASSESSED',
    assessedNote: 'the fee for what you are enrolled in',
    relief: 'RELIEF',
    reliefNote: 'a scholarship or code, once it has actually reduced a charge',
    paid: 'PAID',
    paidNote: 'every payment the ledger has received',
    refunded: 'REFUNDED',
    refundedNote: 'added back, and only once it has moved',
    outstanding: 'OUTSTANDING',
    outstandingNote: 'what remains, and nothing else',
    identity: 'outstanding  =  assessed  −  relief  −  paid  +  refunded',
    foot: 'The proportions above are illustrative. Your own figures, and whether they balance, are below.',
    title: 'The four terms a balance is made of, drawn as one bar reduced and restored',
    desc:
      'A single bar representing everything assessed against an account. Two segments are cut '
      + 'from it: relief, which is a scholarship or a code once it has actually reduced a charge, '
      + 'and payments received. What is left standing at the right of the bar is the outstanding '
      + 'balance. Beyond the bar, separated from it by a plus sign, a smaller block is appended '
      + 'for anything refunded — drawn outside rather than inside because it is the one term that '
      + 'adds rather than subtracts. Underneath, the identity is '
      + 'written out: outstanding equals assessed minus relief minus paid plus refunded. The '
      + 'proportions in the drawing are illustrative and describe no particular account; the '
      + 'reader’s own figures are rendered below it on the page.',
  },
  ar: {
    eyebrow: 'كيف يُضرب الرصيد',
    lede: 'أربعة حدود، والكلية تنشرها كلَّها.',
    assessed: 'المقدَّر',
    assessedNote: 'رسوم ما أنت مقيَّد فيه',
    relief: 'الإعفاء',
    reliefNote: 'منحة أو رمز، بعد أن يكون قد خفّض مبلغًا فعلًا',
    paid: 'المسدَّد',
    paidNote: 'كل دفعة استلمها السجل',
    refunded: 'المستردّ',
    refundedNote: 'يُضاف ثانيةً، ولا يُضاف إلا بعد أن ينتقل',
    outstanding: 'الرصيد',
    outstandingNote: 'ما بقي، ولا شيء غيره',
    identity: 'الرصيد  =  المقدَّر  −  الإعفاء  −  المسدَّد  +  المستردّ',
    foot: 'النسب أعلاه للإيضاح. أما أرقامك أنت، وهل تستقيم بها المعادلة، فأدناه.',
    title: 'الحدود الأربعة التي يتركّب منها الرصيد، مرسومةً شريطًا يُنقَص ثم يُردّ إليه',
    desc:
      'شريط واحد يمثّل كل ما قُدِّر على حساب. يُقتطع منه جزآن: الإعفاء، وهو منحة أو رمز بعد أن '
      + 'يكون قد خفّض مبلغًا فعلًا، والدفعات المستلمة. ثم يُضاف جزء أصغر لما استُرِدّ. وما يبقى '
      + 'قائمًا في الطرف هو الرصيد. وتحت ذلك تُكتب المعادلة: الرصيد يساوي المقدَّر ناقصًا الإعفاء '
      + 'ناقصًا المسدَّد زائدًا المستردّ. والنسب في الرسم للإيضاح ولا تصف حسابًا بعينه؛ وأرقام '
      + 'القارئ نفسه تُعرض أسفل منه في الصفحة.',
  },
};
const t = COPY[RTL ? 'ar' : 'en'];

// ── Geometry ─────────────────────────────────────────────────────────
const W = 900, H = 430;
// The right margin is wide, and that is the refunded block's room. Drawn
// first at 92 like the left, the label ran off the canvas — the plate
// rendered, the file was valid, and the word REFUNDED was cut in half.
// Reserving the space is what makes the one term that ADDS drawable at
// all.
const LEFT = 92, RIGHT = W - 214;
const SPAN = RIGHT - LEFT;
const ADD_W = 46;                    // the refunded block, appended to the bar
const BAR_Y = 168, BAR_H = 62;

// Illustrative proportions of the assessed bar. Not a claim about
// anybody's account — see the head of this file.
const RELIEF = 0.14;
const PAID = 0.46;
const REFUND = 0.06;

/** x for a fraction along the bar, mirrored for RTL. */
const at = (f) => (RTL ? RIGHT - f * SPAN : LEFT + f * SPAN);
const anchorStart = RTL ? 'end' : 'start';

const bits = [];

// --- The heading ------------------------------------------------------
{
  const x0 = RTL ? W - 92 : 92;
  bits.push(text(t.eyebrow, {
    x: x0, y: 50, anchor: anchorStart, size: 10.5, weight: 700,
    tracking: RTL ? 0 : 2.4, fill: INK.cerulean, family: SANS,
  }));
  bits.push(text(t.lede, {
    x: x0, y: 78, anchor: anchorStart, size: 15, fill: INK.goldChampagne, family: DISPLAY,
  }));
}

// --- The assessed bar, and what is taken from it ----------------------
// Drawn as one outlined vessel with filled segments inside it, rather
// than as separate boxes: the argument is that all four terms are parts
// of ONE quantity, and four boxes in a row would say the opposite.
{
  const x0 = Math.min(at(0), at(1));
  bits.push(`<rect data-pop="" x="${n(x0)}" y="${n(BAR_Y)}" width="${n(SPAN)}" height="${n(BAR_H)}"`
    + ` fill="${INK.royalBlue}" fill-opacity="0.22"/>`);

  const seg = (from, to, fill, opacity) => {
    const a = at(from), b = at(to);
    bits.push(`<rect data-pop="" x="${n(Math.min(a, b))}" y="${n(BAR_Y)}" width="${n(Math.abs(b - a))}"`
      + ` height="${n(BAR_H)}" fill="${fill}" fill-opacity="${opacity}"/>`);
  };

  seg(0, RELIEF, INK.teal, 0.4);
  seg(RELIEF, RELIEF + PAID, INK.emerald, 0.4);
  seg(RELIEF + PAID, 1, INK.goldRoyal, 0.34);

  // The outline last, so it sits over every fill and the bar reads as
  // one vessel rather than as three abutting rectangles.
  bits.push(drawn(
    `M${n(x0)} ${n(BAR_Y + BAR_H)}L${n(x0)} ${n(BAR_Y)}L${n(x0 + SPAN)} ${n(BAR_Y)}L${n(x0 + SPAN)} ${n(BAR_Y + BAR_H)}Z`,
    { stroke: INK.sapphire, width: 1.6, ms: 1200, cap: 'butt' },
  ));

  // The internal divisions, dashed, because they are where one term ends
  // and the next begins rather than edges of separate objects.
  for (const f of [RELIEF, RELIEF + PAID]) {
    bits.push(rule(at(f), BAR_Y, at(f), BAR_Y + BAR_H, { stroke: INK.cerulean, width: 1, opacity: 0.5, dash: '3 3' }));
  }

  // The whole extent, labelled above.
  bits.push(rule(at(0), BAR_Y - 20, at(1), BAR_Y - 20, { stroke: INK.steel, width: 0.9, opacity: 0.45 }));
  bits.push(text(t.assessed, {
    x: (at(0) + at(1)) / 2, y: BAR_Y - 30, anchor: 'middle', size: 11, weight: 700,
    tracking: RTL ? 0 : 1.8, fill: INK.goldSoft, family: SANS, pop: true,
  }));
  bits.push(text(t.assessedNote, {
    x: (at(0) + at(1)) / 2, y: BAR_Y - 46, anchor: 'middle', size: 10.5,
    fill: INK.slateText, family: SANS, pop: true,
  }));
}

// --- The segment labels, under the bar --------------------------------
{
  const labels = [
    [0, RELIEF, t.relief, t.reliefNote, INK.teal],
    [RELIEF, RELIEF + PAID, t.paid, t.paidNote, INK.emerald],
    [RELIEF + PAID, 1, t.outstanding, t.outstandingNote, INK.goldRich],
  ];
  labels.forEach(([from, to, label, note, ink], i) => {
    const mid = (at(from) + at(to)) / 2;
    bits.push(rule(mid, BAR_Y + BAR_H, mid, BAR_Y + BAR_H + 16, { stroke: ink, width: 1, opacity: 0.6 }));
    bits.push(text(label, {
      x: mid, y: BAR_Y + BAR_H + 34, anchor: 'middle', size: 11, weight: 700,
      tracking: RTL ? 0 : 1.6, fill: i === 2 ? INK.goldSoft : INK.goldChampagne, family: SANS, pop: true,
    }));
    bits.push(paragraph(note, {
      x: mid, y: BAR_Y + BAR_H + 51, width: Math.abs(at(to) - at(from)) + 40,
      anchor: 'middle', size: 10, fill: INK.slateText, family: SANS, lang: LANG,
    }));
  });
}

// --- Refunded, added back --------------------------------------------
// APPENDED TO THE BAR rather than cut out of it, and separated from it
// by a gap with a plus between them. It is the one term in the identity
// that ADDS, and drawing it as a fourth slice inside the bar would hide
// the only asymmetry there is.
{
  const dir = RTL ? -1 : 1;
  const gap = 26;
  const x0 = at(1) + dir * gap;                       // near edge of the block
  const box = RTL ? x0 - ADD_W : x0;                  // its left edge, whichever way it runs
  const mid = x0 + dir * (ADD_W / 2);

  bits.push(text('+', {
    x: at(1) + dir * (gap / 2), y: BAR_Y + BAR_H / 2 + 6, anchor: 'middle',
    size: 18, weight: 700, fill: INK.goldRich, family: SANS, ltr: true, pop: true,
  }));

  bits.push(`<rect data-pop="" x="${n(box)}" y="${n(BAR_Y)}" width="${n(ADD_W)}" height="${n(BAR_H)}"`
    + ` fill="${INK.goldRoyal}" fill-opacity="0.3"/>`);
  bits.push(drawn(
    `M${n(box)} ${n(BAR_Y + BAR_H)}L${n(box)} ${n(BAR_Y)}L${n(box + ADD_W)} ${n(BAR_Y)}L${n(box + ADD_W)} ${n(BAR_Y + BAR_H)}Z`,
    { stroke: INK.goldRich, width: 1.4, ms: 900, cap: 'butt' },
  ));

  bits.push(rule(mid, BAR_Y + BAR_H, mid, BAR_Y + BAR_H + 16, { stroke: INK.goldRich, width: 1, opacity: 0.6 }));
  bits.push(text(t.refunded, {
    x: mid, y: BAR_Y + BAR_H + 34, anchor: 'middle', size: 11, weight: 700,
    tracking: RTL ? 0 : 1.6, fill: INK.goldSoft, family: SANS, pop: true,
  }));
  bits.push(paragraph(t.refundedNote, {
    x: mid, y: BAR_Y + BAR_H + 51, width: 150, anchor: 'middle',
    size: 10, fill: INK.slateText, family: SANS, lang: LANG,
  }));
}

// --- The identity, written out ---------------------------------------
{
  bits.push(rule(92, H - 78, W - 92, H - 78, { stroke: INK.steel, width: 0.8, opacity: 0.3 }));
  bits.push(text(t.identity, {
    x: W / 2, y: H - 50, anchor: 'middle', size: 13, weight: 700,
    fill: INK.goldChampagne, family: DISPLAY, pop: true,
  }));
  bits.push(paragraph(t.foot, {
    x: W / 2, y: H - 28, width: W - 260, anchor: 'middle', size: 10.5,
    fill: INK.steel, family: SANS, lang: LANG,
  }));
}

mkdirSync(path.dirname(OUT), { recursive: true });
writeFileSync(OUT, plate({
  id: ID, lang: LANG, width: W, height: H, title: t.title, desc: t.desc, body: bits.join('\n  '),
}));
console.log(`art: ${path.relative(ROOT, OUT)}`);
