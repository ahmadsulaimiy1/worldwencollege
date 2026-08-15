#!/usr/bin/env node
// Generates assets/art/authority-chain.svg — the third living diagram
// (docs/digital-institution-masterplan.md, Layer 3).
//
// WHAT IT ARGUES
//
// /about/governance/ describes something most institutions would not
// publish: a governance structure that is fully designed and only
// partly connected. Two academic bodies exist. BASCE has nobody on it.
// The Academic Senate was constituted on 14 August 2026 and has not yet
// met. Neither can therefore have approved anything, so every decision
// that would belong to them is recorded as interim under authority
// delegated to the Press, marked with the body it awaits.
//
// Prose can say that, and prose says it badly, because in a sentence
// the two bodies sound like the same fact stated twice. They are not.
// One is empty and one is idle, and the distance between those is a
// single meeting for half the framework and an external appointment for
// the rest.
//
// So the drawing gives them a lane each and two different glyphs. The
// BASCE lane is SEVERED — two stubs reaching toward each other and not
// meeting, because a dashed line straight through would read as "slow"
// when what is true is "stopped". The Senate lane is INTACT AND GATED —
// three bars across an unbroken route, the same convention the
// publication funnel uses for its unopened review stage, because that
// gate can open and the severed link cannot.
//
// Both land in the same place. The bypass — interim adoption — is
// solid, because that is what genuinely carries a decision today, and
// it hangs off the fork rather than either body, because a decision
// becomes interim whichever of the two it belonged to. It loops back to
// approval rather than terminating, because an interim decision is not
// a finished one.
//
// The lower register lists what is still missing against the specific
// thing each one blocks, which is the page's own framing: naming what a
// gap blocks is more useful than a page that stops short. Note that
// appointing fifteen people moved exactly one item off that list.
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

import { writeFileSync, mkdirSync, readFileSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { DatabaseSync } from 'node:sqlite';
import { INK, SERIF, sansFor, n, text, drawn, rule, plate } from './lib/plate.mjs';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..');

// The two membership figures are READ, never typed. This drawing makes
// an argument about two numbers, and a diagram carrying a number that
// has drifted from the record is worse than no diagram — nobody
// proof-reads a picture. tests/governance-diagram.test.mjs reads them
// back out of the shipped SVG and holds them against this same source.
const MEMBERS = (() => {
  const db = new DatabaseSync(':memory:');
  db.exec(readFileSync(path.join(ROOT, 'sql/schema.sql'), 'utf8'));
  const rows = db.prepare('SELECT code, members_appointed AS m FROM academic_bodies').all();
  db.close();
  return Object.fromEntries(rows.map((r) => [r.code, r.m]));
})();

const W = 900, H = 684;
const LANG = (process.argv[2] || 'en').toLowerCase();
const RTL = LANG === 'ar';
const OUT = path.join(ROOT, `assets/art/authority-chain${RTL ? '.ar' : ''}.svg`);
const SANS = sansFor(LANG);
const DISPLAY = RTL ? SANS : SERIF;

const COPY = {
  en: {
    decision: ['A decision', 'TAKEN'],
    basce: ['BASCE', `${MEMBERS.BASCE} MEMBERS APPOINTED`],
    senate: ['Academic Senate', `${MEMBERS.SENATE} MEMBERS APPOINTED`],
    approved: ['Approved', 'NOT REACHED'],
    severed: 'no members — nothing can be approved',
    gateShut: 'constituted, not convened',
    interim: ['Adopted as interim', 'DELEGATED TO THE PRESS'],
    awaits: 'awaits ratification',
    vacancyHead: 'WHAT IS STILL MISSING, AND WHAT EACH ONE BLOCKS',
    until: (blocks) => `until then, ${blocks}`,
    vacancies: [
      ['External Examiner', 'no award can be conferred'],
      ['BASCE members', 'no competency mapping is approved'],
      ['A convened Senate', 'no skill mapping is approved'],
      ['Academic Reviewer', 'no volume is independently read'],
    ],
    title: 'The chain of academic authority, and the two places it stops',
    desc:
      'A decision is taken and travels to one of the two academic bodies, and neither route reaches approval — '
      + 'but they fail in different ways, which is the point of the drawing. '
      + `The Board of Academic Standards and Curriculum Excellence has ${MEMBERS.BASCE} appointed members, so its `
      + 'route is severed: a body with nobody on it cannot approve anything. '
      + `The Academic Senate now has ${MEMBERS.SENATE} appointed members, so its route is intact — and is drawn `
      + 'closed by a gate rather than cut, because the Senate has been constituted and has not yet convened. '
      + 'A body that can approve but has not met has not approved anything. '
      + 'The route that does carry decisions today runs below both — adopted as interim under authority delegated '
      + 'to the Press — and loops back to approval, because an interim decision awaits ratification rather than '
      + 'being finished. '
      + 'Four things are still missing, and each blocks something specific: with no External Examiner no award can '
      + 'be conferred; with no BASCE members no competency mapping is approved; until the Senate convenes no skill '
      + 'mapping is approved; and with no Academic Reviewer no volume is read independently of its author.',
  },
  ar: {
    decision: ['قرار', 'يُتَّخذ'],
    basce: ['مجلس المعايير', `لا أعضاء معيَّنون`],
    senate: ['المجلس الأكاديمي', `${MEMBERS.SENATE} أعضاء معيَّنون`],
    approved: ['مُعتمَد', 'لم يُبلَغ بعد'],
    severed: 'بلا أعضاء — لا يُعتمد شيء',
    gateShut: 'مُشكَّل ولم ينعقد',
    interim: ['يُعتمد بصفة مؤقتة', 'بتفويض إلى المطبعة'],
    awaits: 'ينتظر التصديق',
    vacancyHead: 'ما لا يزال ناقصًا، وما يعطّله كل منه',
    until: (blocks) => `إلى أن يتم ذلك، ${blocks}`,
    vacancies: [
      ['ممتحن خارجي', 'لا تُمنح أي شهادة'],
      ['أعضاء مجلس المعايير', 'لا يُعتمد أي ربط بالكفايات'],
      ['انعقاد المجلس الأكاديمي', 'لا يُعتمد أي ربط بالمهارات'],
      ['مراجع أكاديمي', 'لا يُقرأ أي مجلّد قراءة مستقلة'],
    ],
    title: 'سلسلة الصلاحية الأكاديمية، وموضعا توقفها',
    desc:
      'يُتَّخذ القرار فينتقل إلى إحدى الهيئتين الأكاديميتين، ولا يبلغ أي من الطريقين الاعتماد — '
      + 'غير أنهما يتوقفان لسببين مختلفين، وهذا هو مقصد الرسم. '
      + 'فمجلس المعايير الأكاديمية والتميّز المنهجي بلا أعضاء معيَّنين، فطريقه مقطوع: الهيئة التي لا أحد فيها لا تعتمد شيئًا. '
      + `أما المجلس الأكاديمي فله ${MEMBERS.SENATE} أعضاء معيَّنون، فطريقه سليم — ومرسوم مغلقًا ببوابة لا مقطوعًا، `
      + 'لأن المجلس شُكِّل ولم ينعقد بعد. والهيئة التي تستطيع الاعتماد ولم تجتمع لم تعتمد شيئًا. '
      + 'أما الطريق الذي يحمل القرارات فعلًا اليوم فيمرّ تحتهما — اعتماد مؤقت بتفويض إلى المطبعة — ثم يعود صاعدًا '
      + 'إلى الاعتماد، لأن القرار المؤقت ينتظر التصديق ولا يُعدّ منتهيًا. '
      + 'وأربعة أمور لا تزال ناقصة، كل منها يعطّل أمرًا بعينه: بلا ممتحن خارجي لا تُمنح شهادة؛ وبلا أعضاء لمجلس المعايير '
      + 'لا يُعتمد أي ربط بالكفايات؛ وإلى أن ينعقد المجلس الأكاديمي لا يُعتمد أي ربط بالمهارات؛ وبلا مراجع أكاديمي '
      + 'لا يُقرأ أي مجلّد قراءة مستقلة عن مؤلفه.',
  },
};
const t = COPY[LANG] || COPY.en;

// Mirror an x-coordinate for RTL. Applied to every horizontal position
// so the flow runs with the language rather than against it.
const mx = (x) => (RTL ? W - x : x);

const bits = [];

// ── Register one: the two routes ──────────────────────────────────────
//
// THE SHAPE CHANGED WHEN THE SENATE WAS CONSTITUTED.
//
// Until 14 August 2026 both academic bodies stood at nought members and
// one severed link told the whole story. It no longer does. The Senate
// has members and BASCE does not, and the two now fail for different
// reasons that happen to produce the same outcome today. A single break
// would flatten that back into one fact and lose the more interesting
// one — that the College is one meeting away from half of this, and an
// external appointment away from the rest.
//
// So there are two lanes past the same point, and two different glyphs:
//
//   BASCE   ── ╲╲ ──   severed. Nobody is on the body. Nothing to convene.
//   SENATE  ── ▮▮▮ ──  a shut gate. The route is intact and unused,
//                      which is the same convention the publication
//                      funnel uses for its unopened review stage.
//
// Both still land in interim, which is why the bypass survives the
// redraw unchanged: it is still what actually carries a decision today.

const LANE_A = 96;          // BASCE
const LANE_B = 212;         // Senate
const FORK = (LANE_A + LANE_B) / 2;
const BYPASS = 330;         // the interim route, below both lanes

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
const X = { decision: mx(112), body: mx(348), gap: mx(566), approval: mx(778) };
const dir = RTL ? -1 : 1;
const arrowAt = (x, y) =>
  `<path d="M${n(x)} ${n(y - 5)}l${6 * dir} 5 ${-6 * dir} 5Z" fill="${INK.goldRoyal}" data-pop=""/>`;

bits.push(...station(X.decision, FORK, { label: t.decision[0], sub: t.decision[1], w: 140 }));

// The fork: one decision, two possible bodies depending on what it is
// about. Drawn as a bracket rather than two diagonals — a diagonal here
// reads as a different kind of relationship.
bits.push(drawn(
  `M${n(X.decision + 70 * dir)} ${n(FORK)}L${n(X.decision + 108 * dir)} ${n(FORK)}`
  + `M${n(X.decision + 108 * dir)} ${n(LANE_A)}L${n(X.decision + 108 * dir)} ${n(LANE_B)}`
  + `M${n(X.decision + 108 * dir)} ${n(LANE_A)}L${n(X.body - 122 * dir)} ${n(LANE_A)}`
  + `M${n(X.decision + 108 * dir)} ${n(LANE_B)}L${n(X.body - 122 * dir)} ${n(LANE_B)}`,
  { stroke: INK.goldRoyal, width: 1.6, ms: 900 }));
bits.push(arrowAt(X.body - 128 * dir, LANE_A));
bits.push(arrowAt(X.body - 128 * dir, LANE_B));

bits.push(...station(X.body, LANE_A, { label: t.basce[0], sub: t.basce[1], w: 218, tint: INK.steel }));
bits.push(...station(X.body, LANE_B, { label: t.senate[0], sub: t.senate[1], w: 218 }));
bits.push(...station(X.approval, FORK, { label: t.approved[0], sub: t.approved[1], w: 148, live: false }));

// ── Lane A: BASCE. Severed. ───────────────────────────────────────────
// Two stubs reaching toward each other and not meeting. A dashed line
// straight through would read as "slow"; what is true is "stopped".
{
  const stub = X.body + 109 * dir;
  bits.push(drawn(`M${n(stub)} ${n(LANE_A)}L${n(stub + 36 * dir)} ${n(LANE_A)}`,
    { stroke: INK.steel, width: 1.4, ms: 500, opacity: 0.75 }));
  bits.push(`<g data-pop="">`
    + `<path d="M${n(X.gap - 16)} ${n(LANE_A - 15)}L${n(X.gap - 4)} ${n(LANE_A + 15)}" stroke="${INK.burgundy}" stroke-width="2.2" stroke-linecap="round" fill="none"/>`
    + `<path d="M${n(X.gap + 4)} ${n(LANE_A - 15)}L${n(X.gap + 16)} ${n(LANE_A + 15)}" stroke="${INK.burgundy}" stroke-width="2.2" stroke-linecap="round" fill="none"/>`
    + `</g>`);
  bits.push(rule(X.gap + 34 * dir, LANE_A, X.approval - 74 * dir, LANE_A,
    { stroke: INK.steel, width: 1.2, opacity: 0.4, dash: '5 5' }));
  bits.push(text(t.severed, {
    x: X.gap, y: LANE_A - 30, anchor: 'middle', size: 11, weight: 700,
    fill: '#C9788A', family: SANS, pop: true,
  }));
}

// ── Lane B: the Senate. Intact, and shut. ─────────────────────────────
// The gate is the funnel's convention, reused deliberately: three bars
// across an unbroken route. It says "this can open" where the double
// slash says "this is cut".
{
  const stub = X.body + 109 * dir;
  bits.push(drawn(`M${n(stub)} ${n(LANE_B)}L${n(X.gap - 22 * dir)} ${n(LANE_B)}`,
    { stroke: INK.goldRoyal, width: 1.6, ms: 700 }));
  bits.push(`<g data-pop="">`
    + `<path d="M${n(X.gap - 14)} ${n(LANE_B - 15)}L${n(X.gap - 14)} ${n(LANE_B + 15)}`
    + `M${n(X.gap)} ${n(LANE_B - 15)}L${n(X.gap)} ${n(LANE_B + 15)}`
    + `M${n(X.gap + 14)} ${n(LANE_B - 15)}L${n(X.gap + 14)} ${n(LANE_B + 15)}"`
    + ` stroke="${INK.goldRoyal}" stroke-width="2" stroke-opacity="0.85" stroke-linecap="round" fill="none"/>`
    + `</g>`);
  bits.push(rule(X.gap + 26 * dir, LANE_B, X.approval - 74 * dir, LANE_B,
    { stroke: INK.steel, width: 1.2, opacity: 0.4, dash: '5 5' }));
  bits.push(text(t.gateShut, {
    x: X.gap, y: LANE_B + 34, anchor: 'middle', size: 11, weight: 700,
    fill: INK.goldSoft, family: SANS, pop: true,
  }));
}

// ── The bypass that actually carries today's decisions ────────────────
bits.push(...station(X.gap, BYPASS, {
  label: t.interim[0], sub: t.interim[1], w: 264, tint: INK.goldRoyal,
}));
// Down from the FORK, not from either body box. A decision becomes
// interim whichever of the two it belongs to, and hanging this leg off
// the Senate — as the first draft did — quietly said that only Senate
// business is adopted interim. The competency mappings are BASCE's, and
// they are the bulk of what is sitting in that state.
bits.push(drawn(
  `M${n(X.decision + 108 * dir)} ${n(LANE_B)}L${n(X.decision + 108 * dir)} ${n(BYPASS)}`
  + `L${n(X.gap - 138 * dir)} ${n(BYPASS)}`,
  { stroke: INK.goldRoyal, width: 1.6, ms: 1000 }));
bits.push(arrowAt(X.gap - 138 * dir, BYPASS));

// And back up to the approval it is still waiting for — the loop is the
// point: interim is not finished, it is pending.
bits.push(drawn(
  `M${n(X.gap + 132 * dir)} ${n(BYPASS)}L${n(X.approval)} ${n(BYPASS)}L${n(X.approval)} ${n(FORK + 31)}`,
  { stroke: INK.steel, width: 1.2, ms: 900, opacity: 0.55 }));
// Sits below the return leg rather than beside it: at the obvious
// placement the label ran back across the interim station it comes out
// of, which no amount of tracking fixes.
bits.push(text(t.awaits, {
  x: X.approval + 74 * dir, y: BYPASS + 46, anchor: RTL ? 'start' : 'end', size: 11,
  fill: INK.steel, family: SANS, pop: true,
}));

// ── Register two: the vacancies, and what each one blocks ─────────────
const VACANCIES = t.vacancies;

const VY = 432;
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
