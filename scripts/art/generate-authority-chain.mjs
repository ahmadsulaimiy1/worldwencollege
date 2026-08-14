#!/usr/bin/env node
// Generates assets/art/authority-chain.svg — the third living diagram
// (docs/digital-institution-masterplan.md, Layer 3).
//
// WHAT IT ARGUES
//
// /about/governance/ describes something most institutions would not
// publish: a governance structure that is fully designed and not yet
// connected. Two academic bodies are constituted; neither has members;
// so nothing can be approved, and every decision that would belong to
// them is recorded as interim under authority delegated to the Press,
// marked with the body it awaits.
//
// Prose can say that. What prose cannot do is show it in one look —
// that the chain is complete in design and broken at exactly one link,
// and that the College has drawn the break rather than routed around it
// quietly.
//
// So the spine is continuous where authority actually flows, and it
// STOPS at the appointment gap. The approval node beyond the gap is
// drawn hollow and unlit, reachable only across a dashed span. The
// bypass — interim adoption — is solid, because that is what genuinely
// happens today, and it loops back to ratification rather than
// terminating, because an interim decision is not a finished one.
//
// The lower register lists the four unfilled posts against the specific
// thing each one blocks, which is the page's own framing: naming what a
// vacancy blocks is more useful than a page that stops short.
//
// Both languages. The Arabic edition landed with /ar/about/governance/
// itself, on the principle recorded in the master plan: a diagram that
// argues this much must not reach one audience and not the other.
//
// The whole figure mirrors under RTL — the chain runs right to left,
// the break sits in the same place along it, and the vacancy register
// hangs off the right margin — because a flow diagram read against the
// direction of the language is not a translation, it is the same
// drawing with foreign labels on it.
//
//   node scripts/art/generate-authority-chain.mjs [ar]

import { writeFileSync, mkdirSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { INK, SERIF, sansFor, n, text, drawn, rule, plate } from './lib/plate.mjs';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..');
const W = 900, H = 572;
const LANG = (process.argv[2] || 'en').toLowerCase();
const RTL = LANG === 'ar';
const OUT = path.join(ROOT, `assets/art/authority-chain${RTL ? '.ar' : ''}.svg`);
const SANS = sansFor(LANG);
const DISPLAY = RTL ? SANS : SERIF;

const COPY = {
  en: {
    decision: ['A decision', 'TAKEN'],
    body: ['Recorded under a body', 'BASCE  ·  SENATE'],
    approved: ['Approved', 'NOT REACHABLE'],
    zero: '0 MEMBERS APPOINTED',
    stops: 'the chain stops here',
    interim: ['Adopted as interim', 'DELEGATED TO THE PRESS'],
    awaits: 'awaits ratification',
    vacancyHead: 'POSTS NOT YET FILLED, AND WHAT EACH ONE BLOCKS',
    until: (blocks) => `until filled, ${blocks}`,
    vacancies: [
      ['External Examiner', 'no award can be conferred'],
      ['Board members', 'nothing can be approved'],
      ['Academic Reviewer', 'no volume is independently read'],
      ['Principal officer', 'no message can be signed'],
    ],
    title: 'The chain of academic authority, and where it is broken',
    desc:
      'A decision is taken and recorded under one of the two academic bodies, BASCE or the Academic Senate. '
      + 'There the chain stops: neither body has any members appointed, so nothing can be approved. '
      + 'The route that does carry decisions today runs downward instead — adopted as interim under authority '
      + 'delegated to the Press — and loops back to approval, because an interim decision awaits ratification '
      + 'rather than being finished. '
      + 'Four posts are unfilled, and each blocks something specific: with no External Examiner no award can be '
      + 'conferred; with no board members nothing can be approved; with no Academic Reviewer no volume is read '
      + 'independently of its author; with no principal officer no institutional message can be signed.',
  },
  ar: {
    decision: ['قرار', 'يُتَّخذ'],
    body: ['يُسجَّل تحت هيئة', 'BASCE  ·  المجلس'],
    approved: ['مُعتمَد', 'غير قابل للبلوغ'],
    zero: 'لا أعضاء معيَّنون',
    stops: 'هنا تتوقف السلسلة',
    interim: ['يُعتمد بصفة مؤقتة', 'بتفويض إلى المطبعة'],
    awaits: 'ينتظر التصديق',
    vacancyHead: 'مناصب لم تُشغَل بعد، وما يعطّله كل منها',
    until: (blocks) => `إلى أن يُشغَل، ${blocks}`,
    vacancies: [
      ['ممتحن خارجي', 'لا تُمنح أي شهادة'],
      ['أعضاء الهيئتين', 'لا يُعتمد شيء'],
      ['مراجع أكاديمي', 'لا يُقرأ أي مجلّد قراءة مستقلة'],
      ['مسؤول تنفيذي', 'لا تُوقَّع أي رسالة مؤسسية'],
    ],
    title: 'سلسلة الصلاحية الأكاديمية، وموضع انقطاعها',
    desc:
      'يُتَّخذ القرار ويُسجَّل تحت إحدى الهيئتين الأكاديميتين: مجلس المعايير والتميّز المنهجي أو المجلس الأكاديمي. '
      + 'وعند هذا الحد تتوقف السلسلة: لم يُعيَّن أي عضو في أي من الهيئتين، فلا يمكن اعتماد شيء. '
      + 'أما الطريق الذي يحمل القرارات فعلًا اليوم فينزل جانبًا — اعتماد مؤقت بتفويض إلى المطبعة — ثم يعود صاعدًا '
      + 'إلى الاعتماد، لأن القرار المؤقت ينتظر التصديق ولا يُعدّ منتهيًا. '
      + 'وأربعة مناصب شاغرة، كل منها يعطّل أمرًا بعينه: بلا ممتحن خارجي لا تُمنح شهادة؛ وبلا أعضاء للهيئتين لا يُعتمد شيء؛ '
      + 'وبلا مراجع أكاديمي لا يُقرأ أي مجلّد قراءة مستقلة عن مؤلفه؛ وبلا مسؤول تنفيذي لا تُوقَّع أي رسالة مؤسسية.',
  },
};
const t = COPY[LANG] || COPY.en;

// Mirror an x-coordinate for RTL. Applied to every horizontal position
// so the flow runs with the language rather than against it.
const mx = (x) => (RTL ? W - x : x);

const bits = [];

// ── Register one: the chain ───────────────────────────────────────────
const SPINE = 84;          // y of the main flow
const BYPASS = 200;         // y of the interim route

/** A labelled station on the chain. */
function station(x, y, { label, sub, w = 168, h = 62, live = true, tint = INK.goldRich }) {
  const half = w / 2;
  const out = [];
  out.push(`<g data-pop="">`
    + `<rect x="${n(x - half)}" y="${n(y - h / 2)}" width="${n(w)}" height="${n(h)}" rx="3"`
    + ` fill="${live ? 'rgba(31,61,122,0.30)' : 'none'}"`
    + ` stroke="${live ? tint : INK.steel}" stroke-width="${live ? 1.4 : 1}"`
    + ` stroke-opacity="${live ? 1 : 0.55}"${live ? '' : ' stroke-dasharray="4 4"'}/>`
    + `</g>`);
  out.push(text(label, {
    x, y: sub ? y - 2 : y + 5, anchor: 'middle', size: 14.5, weight: 700,
    fill: live ? INK.goldChampagne : INK.steel, family: DISPLAY, pop: true,
  }));
  if (sub) out.push(text(sub, {
    x, y: y + 17, anchor: 'middle', size: 10.5, weight: 700,
    fill: live ? INK.cerulean : INK.steel, family: SANS,
    tracking: RTL ? 0 : 1.4, opacity: live ? 0.9 : 0.7, pop: true,
  }));
  return out;
}

// Logical positions, mirrored for RTL so the chain reads with the
// language. `dir` is +1 left-to-right, -1 right-to-left, and every
// horizontal offset below is multiplied by it.
const X = {
  decision: mx(120), body: mx(348), gap: mx(560), approval: mx(770),
};
const dir = RTL ? -1 : 1;

bits.push(...station(X.decision, SPINE, { label: t.decision[0], sub: t.decision[1], w: 150 }));
bits.push(...station(X.body, SPINE, { label: t.body[0], sub: t.body[1], w: 232 }));
bits.push(...station(X.approval, SPINE, { label: t.approved[0], sub: t.approved[1], w: 150, live: false }));

// The live span: a decision does get recorded against a body.
bits.push(drawn(`M${n(X.decision + 75 * dir)} ${n(SPINE)}L${n(X.body - 116 * dir)} ${n(SPINE)}`,
  { stroke: INK.goldRoyal, width: 1.6, ms: 700 }));
bits.push(`<path d="M${n(X.body - 122 * dir)} ${n(SPINE - 5)}l${6 * dir} 5 ${-6 * dir} 5Z" fill="${INK.goldRoyal}" data-pop=""/>`);

// THE BREAK. Two stubs reaching toward each other and not meeting is the
// entire diagram — a dashed line straight through would read as "slow",
// and what is true is "stopped".
const stubL = X.body + 116 * dir, stubR = X.approval - 75 * dir;
bits.push(drawn(`M${n(stubL)} ${n(SPINE)}L${n(stubL + 42 * dir)} ${n(SPINE)}`,
  { stroke: INK.goldRoyal, width: 1.6, ms: 500 }));
bits.push(rule(stubR - 42 * dir, SPINE, stubR, SPINE, { stroke: INK.steel, width: 1.4, opacity: 0.5, dash: '5 5' }));
bits.push(`<g data-pop="">`
  + `<path d="M${n(X.gap - 16)} ${n(SPINE - 16)}L${n(X.gap - 4)} ${n(SPINE + 16)}" stroke="${INK.burgundy}" stroke-width="2.2" stroke-linecap="round" fill="none"/>`
  + `<path d="M${n(X.gap + 4)} ${n(SPINE - 16)}L${n(X.gap + 16)} ${n(SPINE + 16)}" stroke="${INK.burgundy}" stroke-width="2.2" stroke-linecap="round" fill="none"/>`
  + `</g>`);
bits.push(text(t.zero, {
  x: X.gap, y: SPINE - 30, anchor: 'middle', size: 10.5, weight: 700, tracking: RTL ? 0 : 1.8,
  fill: '#C9788A', family: SANS, pop: true,
}));
bits.push(text(t.stops, {
  x: X.gap, y: SPINE + 40, anchor: 'middle', size: 11.5,
  fill: INK.slateText, family: SANS, pop: true,
}));

// ── The bypass that actually carries today's decisions ────────────────
bits.push(...station(X.gap, BYPASS, {
  label: t.interim[0], sub: t.interim[1], w: 264, tint: INK.goldRoyal,
}));
// Down from the body, along, and into the interim station.
bits.push(drawn(
  `M${n(X.body)} ${n(SPINE + 31)}L${n(X.body)} ${n(BYPASS)}L${n(X.gap - 132 * dir)} ${n(BYPASS)}`,
  { stroke: INK.goldRoyal, width: 1.6, ms: 1000 }));
bits.push(`<path d="M${n(X.gap - 138 * dir)} ${n(BYPASS - 5)}l${6 * dir} 5 ${-6 * dir} 5Z" fill="${INK.goldRoyal}" data-pop=""/>`);

// And back up to the approval it is still waiting for — the loop is the
// point: interim is not finished, it is pending.
bits.push(drawn(
  `M${n(X.gap + 132 * dir)} ${n(BYPASS)}L${n(X.approval)} ${n(BYPASS)}L${n(X.approval)} ${n(SPINE + 31)}`,
  { stroke: INK.steel, width: 1.2, ms: 900, opacity: 0.55 }));
// Sits below the return leg rather than beside it: at the obvious
// placement the label ran back across the interim station it comes out
// of, which no amount of tracking fixes.
bits.push(text(t.awaits, {
  x: X.approval + 75 * dir, y: BYPASS + 46, anchor: RTL ? 'start' : 'end', size: 11,
  fill: INK.steel, family: SANS, pop: true,
}));

// ── Register two: the vacancies, and what each one blocks ─────────────
const VACANCIES = t.vacancies;

const VY = 330;
const lead = RTL ? W - 70 : 70;
const anchorLead = RTL ? 'end' : 'start';
bits.push(rule(70, VY - 34, W - 70, VY - 34, { stroke: INK.goldRoyal, width: 1, opacity: 0.28, dash: '1 7' }));
bits.push(text(t.vacancyHead, {
  x: lead, y: VY - 8, anchor: anchorLead, size: 10.5, weight: 700,
  tracking: RTL ? 0 : 2, fill: INK.cerulean, family: SANS,
}));

VACANCIES.forEach(([post, blocks], i) => {
  const y = VY + 42 + i * 52;
  // An empty seat: a ring with nothing in it.
  bits.push(`<g data-pop="">`
    + `<circle cx="${n(mx(88))}" cy="${n(y - 5)}" r="9" fill="none" stroke="${INK.steel}" stroke-width="1.2" stroke-dasharray="3 3"/>`
    + `</g>`);
  bits.push(text(post, {
    x: mx(116), y, anchor: anchorLead, size: 15, weight: 700,
    fill: INK.goldChampagne, family: DISPLAY, pop: true,
  }));
  bits.push(rule(mx(340), y - 5, mx(396), y - 5, { stroke: INK.steel, width: 1, opacity: 0.45 }));
  bits.push(text(t.until(blocks), {
    x: mx(410), y, anchor: anchorLead, size: 12.5, fill: INK.slateText, family: SANS, pop: true,
  }));
  if (i < VACANCIES.length - 1) {
    bits.push(rule(70, y + 22, W - 70, y + 22, { stroke: INK.steel, width: 0.8, opacity: 0.16 }));
  }
});

const svg = plate({
  id: 'authority-chain', lang: LANG, width: W, height: H,
  title: t.title,
  desc: t.desc,
  body: bits.map((s) => '  ' + s).join('\n'),
});

mkdirSync(path.dirname(OUT), { recursive: true });
writeFileSync(OUT, svg);
console.log(`Wrote ${path.relative(ROOT, OUT)} — ${(svg.length / 1024).toFixed(1)} KB`);
