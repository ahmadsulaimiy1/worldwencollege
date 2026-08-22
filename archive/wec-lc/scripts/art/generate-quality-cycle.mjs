#!/usr/bin/env node
// Generates assets/art/quality-cycle.svg — the sixth living diagram
// (docs/digital-institution-masterplan.md, Layer 3).
//
// WHAT IT ARGUES
//
// /about/quality-assurance/ makes a distinction most institutions never
// have to make, and states it in one sentence: "the mechanisms that
// check internal consistency run on every change; the cycles that depend
// on a year of teaching have not turned."
//
// Read quickly, that is one sentence about quality assurance. It is
// actually a sentence about TWO loops running at completely different
// speeds, and prose cannot show two speeds at once.
//
// So the drawing gives them a ring each.
//
//   The INNER ring turns. Four automated checks — curriculum structure,
//   rubric policy, published claims, retired terminology — run on every
//   change to the repository. It is closed, gold, and marked with the
//   only tempo on this page that is measured in seconds.
//
//   The OUTER ring does not. Design and publish-before-teaching are
//   complete. Teach, assess, review against the evidence and revise are
//   not, because nobody has been taught. The arc is drawn OPEN across
//   those four stations, so the cycle is visibly a cycle that has never
//   come round.
//
// The gap is the argument. A quality cycle is only worth the name once
// it has closed at least once, and this one has closed nought times —
// which the College says in prose and which this shows at a glance.
//
// WHY THE INNER RING MATTERS AS MUCH AS THE GAP
//
// A drawing of the outer ring alone would say "this College has no
// quality assurance", and that is false. Something real runs, on every
// commit, and catches things — the page lists two incidents it caught
// after they had already shipped. Drawing only the failure would be as
// dishonest as drawing only the success.
//
// THE NUMBERS
//
// Cohorts taught, enrolments and live sessions are read from the record,
// never typed. tests/quality-cycle.test.mjs reads them back out of the
// shipped SVG and fails if any of them stops being nought without the
// drawing being redrawn — which is the correct behaviour, because on the
// day teaching starts this diagram is telling a different story.
//
//   node scripts/art/generate-quality-cycle.mjs [ar]

import { writeFileSync, mkdirSync, readFileSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { DatabaseSync } from 'node:sqlite';
import { INK, SERIF, sansFor, isRtl, n, text, rule, plate } from './lib/plate.mjs';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..');
const LANG = (process.argv[2] || 'en').toLowerCase();
const RTL = isRtl(LANG);
const SANS = sansFor(LANG);
const DISPLAY = RTL ? SANS : SERIF;
const OUT = path.join(ROOT, `assets/art/quality-cycle${RTL ? '.ar' : ''}.svg`);

// ── The record ────────────────────────────────────────────────────────
export function readTeaching() {
  const db = new DatabaseSync(':memory:');
  db.exec(readFileSync(path.join(ROOT, 'sql/schema.sql'), 'utf8'));
  const one = (s) => db.prepare(s).all()[0].n;
  const out = {
    enrolments: one('SELECT COUNT(*) AS n FROM enrolments'),
    liveSessions: one('SELECT COUNT(*) AS n FROM live_sessions'),
    awards: one('SELECT COUNT(*) AS n FROM awards'),
    levels: one('SELECT COUNT(*) AS n FROM programme_levels'),
  };
  db.close();
  return out;
}
const T = readTeaching();
// The whole drawing asserts that the outer ring has never closed. If any
// of these stops being nought, that assertion needs re-examining rather
// than re-rendering, so the generator refuses instead of quietly
// producing a picture that is no longer true.
if (T.enrolments || T.liveSessions || T.awards) {
  throw new Error('Teaching has started — enrolments/sessions/awards are no longer nought. '
    + 'The quality cycle diagram asserts the outer ring has never closed; redraw its argument '
    + 'rather than regenerating it.');
}

// ── Copy ──────────────────────────────────────────────────────────────
const COPY = {
  en: {
    outer: [
      ['Design', 'the curriculum', true],
      ['Publish', 'before teaching', true],
      ['Teach', 'a cohort', false],
      ['Assess', 'and mark', false],
      ['Review', 'against the evidence', false],
      ['Revise', 'the framework', false],
    ],
    inner: ['Curriculum', 'Rubrics', 'Claims', 'Terminology'],
    innerHead: 'RUNS ON EVERY CHANGE',
    innerSub: 'automated · seconds',
    outerHead: 'THE ACADEMIC YEAR',
    gap: 'the ring has never closed',
    gapSub: `${T.enrolments} enrolments · ${T.liveSessions} sessions taught · ${T.awards} awards conferred`,
    done: 'complete',
    title: 'Two quality loops, running at different speeds — and one of them has never turned',
    desc:
      'Two concentric rings. The inner ring is closed and turning: four automated checks — curriculum '
      + 'structure, rubric policy, published claims and retired terminology — run against the record on '
      + 'every change to the repository, in seconds. '
      + 'The outer ring is the academic year, in six stations: design the curriculum, publish before '
      + 'teaching, teach a cohort, assess and mark, review against the evidence, revise the framework. '
      + 'The first two are complete and drawn solid. The remaining four are drawn as an open arc, because '
      + `the College has ${T.enrolments} enrolments, has taught ${T.liveSessions} sessions and has conferred `
      + `${T.awards} awards, so the ring has never come round even once. `
      + 'The gap between the two rings is the point: something real is being checked continuously, and the '
      + 'cycle that would validate the checking cannot begin until somebody is taught.',
  },
  ar: {
    outer: [
      ['التصميم', 'تصميم المنهج', true],
      ['النشر', 'قبل التدريس', true],
      ['التدريس', 'تدريس دفعة', false],
      ['التقييم', 'والتصحيح', false],
      ['المراجعة', 'في ضوء الأدلة', false],
      ['التنقيح', 'تنقيح الإطار', false],
    ],
    inner: ['المنهج', 'معايير التصحيح', 'الادعاءات', 'المصطلحات'],
    innerHead: 'يعمل مع كل تعديل',
    innerSub: 'آليًا · بالثواني',
    outerHead: 'السنة الأكاديمية',
    gap: 'الحلقة لم تُغلق قط',
    gapSub: `${T.enrolments} تسجيل · ${T.liveSessions} حصة دُرِّست · ${T.awards} شهادة مُنحت`,
    done: 'مكتملة',
    title: 'حلقتا جودة بسرعتين مختلفتين — وإحداهما لم تدر قط',
    desc:
      'حلقتان متحدتا المركز. الحلقة الداخلية مغلقة وتدور: أربعة فحوص آلية — بنية المنهج، وسياسة معايير '
      + 'التصحيح، والادعاءات المنشورة، والمصطلحات المسحوبة — تعمل على السجل مع كل تعديل في المستودع، بالثواني. '
      + 'أما الحلقة الخارجية فهي السنة الأكاديمية بست محطات: تصميم المنهج، والنشر قبل التدريس، وتدريس دفعة، '
      + 'والتقييم والتصحيح، والمراجعة في ضوء الأدلة، وتنقيح الإطار. '
      + 'المحطتان الأوليان مكتملتان ومرسومتان متصلتين. والمحطات الأربع الباقية مرسومة قوسًا مفتوحًا، '
      + `لأن للكلية ${T.enrolments} تسجيلًا، ودرّست ${T.liveSessions} حصة، ومنحت ${T.awards} شهادة، `
      + 'فلم تدر الحلقة دورة واحدة. '
      + 'والفجوة بين الحلقتين هي المقصد: ثمة شيء حقيقي يُفحص باستمرار، والدورة التي تُصادق على ذلك الفحص '
      + 'لا يمكن أن تبدأ قبل أن يُدرَّس أحد.',
  },
};
const t = COPY[LANG] || COPY.en;

// ── Geometry ──────────────────────────────────────────────────────────
const W = 900, H = 726;
const CX = W / 2, CY = 340;
const R_OUT = 196;
const R_IN = 88;
const dir = RTL ? -1 : 1;

const N = t.outer.length;
const angleAt = (i) => -Math.PI / 2 + dir * (i * 2 * Math.PI) / N;
const on = (r, a) => [CX + Math.cos(a) * r, CY + Math.sin(a) * r];

/** An arc of the outer ring, from station i to station i+1. */
function arc(i, { dash = false, stroke = INK.goldRoyal, width = 2.2, ms = 900 } = {}) {
  const PAD = 0.17;               // clear of the station node at each end
  const a0 = angleAt(i) + dir * PAD;
  const a1 = angleAt(i + 1) - dir * PAD;
  const [x0, y0] = on(R_OUT, a0);
  const [x1, y1] = on(R_OUT, a1);
  const sweep = dir > 0 ? 1 : 0;
  const d = `M${n(x0)} ${n(y0)}A${R_OUT} ${R_OUT} 0 0 ${sweep} ${n(x1)} ${n(y1)}`;
  return dash
    ? `<path d="${d}" fill="none" stroke="${stroke}" stroke-width="${width}"`
      + ` stroke-opacity="0.45" stroke-dasharray="6 7" stroke-linecap="round"/>`
    : `<path data-draw="${ms}" d="${d}" fill="none" stroke="${stroke}" stroke-width="${width}"`
      + ` stroke-linecap="round"/>`;
}

const bits = [];

// ── The inner ring: closed, and turning ───────────────────────────────
bits.push(`<circle cx="${CX}" cy="${CY}" r="${R_IN}" fill="rgba(31,61,122,0.20)"`
  + ` stroke="${INK.goldRich}" stroke-width="1.6"/>`);

t.inner.forEach((label, i) => {
  const a = -Math.PI / 2 + dir * (i * 2 * Math.PI) / t.inner.length;
  const [x, y] = on(R_IN, a);
  bits.push(`<g data-pop=""><circle cx="${n(x)}" cy="${n(y)}" r="4.5" fill="${INK.goldRich}"/></g>`);
  // OUTSIDE the ring, in the empty annulus between the two loops. Inside
  // it they sat on top of the hub caption, and the annulus is otherwise
  // dead space that makes the four names read as belonging to the inner
  // mechanism rather than to the outer stations beyond them.
  const [lx, ly] = on(R_IN + 14, a);
  // Anchored by which side of the ring it is on, like the outer
  // stations. Centred, the left and right names straddled their own
  // node and sat half inside the ring they label.
  const cosA = Math.cos(a);
  const anchorIn = cosA < -0.25 ? 'end' : cosA > 0.25 ? 'start' : 'middle';
  const pad = anchorIn === 'middle' ? 0 : (cosA > 0 ? 8 : -8);
  bits.push(text(label, {
    x: lx + pad, y: ly + (anchorIn === 'middle' ? (Math.sin(a) < 0 ? -4 : 12) : 3.5),
    anchor: anchorIn, size: 9.5, weight: 700,
    fill: INK.goldChampagne, family: SANS, pop: true,
  }));
});

// A turning mark: a short arrowed arc on the inner ring.
{
  const a0 = -Math.PI / 2 + dir * 0.42, a1 = -Math.PI / 2 + dir * 1.0;
  const [x0, y0] = on(R_IN, a0);
  const [x1, y1] = on(R_IN, a1);
  bits.push(`<path data-draw="700" d="M${n(x0)} ${n(y0)}A${R_IN} ${R_IN} 0 0 ${dir > 0 ? 1 : 0} ${n(x1)} ${n(y1)}"`
    + ` fill="none" stroke="${INK.goldSoft}" stroke-width="3" stroke-linecap="round"/>`);
  const tangent = a1 + dir * Math.PI / 2;
  const [hx, hy] = on(R_IN, a1);
  bits.push(`<path d="M${n(hx)} ${n(hy)}`
    + `l${n(Math.cos(tangent + 2.6) * 9)} ${n(Math.sin(tangent + 2.6) * 9)}`
    + `M${n(hx)} ${n(hy)}l${n(Math.cos(tangent - 2.6) * 9)} ${n(Math.sin(tangent - 2.6) * 9)}"`
    + ` fill="none" stroke="${INK.goldSoft}" stroke-width="2.4" stroke-linecap="round" data-pop=""/>`);
}

bits.push(text(t.innerHead, {
  x: CX, y: CY - 6, anchor: 'middle', size: 9.5, weight: 700, tracking: RTL ? 0 : 1.4,
  fill: INK.cerulean, family: SANS, pop: true,
}));
bits.push(text(t.innerSub, {
  x: CX, y: CY + 10, anchor: 'middle', size: 10, fill: INK.slateText, family: SANS, pop: true,
}));

// ── The outer ring: open across everything teaching would supply ──────
t.outer.forEach((_, i) => {
  const from = t.outer[i][2];
  const to = t.outer[(i + 1) % N][2];
  // An arc is solid only where BOTH ends are complete. The arc leaving
  // the last completed station is where the ring stops.
  bits.push(arc(i, { dash: !(from && to), ms: 700 + i * 120 }));
});

t.outer.forEach(([label, sub, doneFlag], i) => {
  const a = angleAt(i);
  const [x, y] = on(R_OUT, a);

  bits.push(`<g data-pop="">`
    + (doneFlag
      ? `<circle cx="${n(x)}" cy="${n(y)}" r="9" fill="${INK.oxford}" stroke="${INK.goldRich}" stroke-width="2"/>`
        + `<path d="M${n(x - 4)} ${n(y)}l3 3.4 5.4 -6" fill="none" stroke="${INK.goldRich}"`
        + ` stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"/>`
      : `<circle cx="${n(x)}" cy="${n(y)}" r="9" fill="${INK.oxford}" stroke="${INK.steel}"`
        + ` stroke-width="1.4" stroke-dasharray="3 3"/>`)
    + `</g>`);

  const [lx, ly] = on(R_OUT + 30, a);
  const cos = Math.cos(a);
  const anchor = cos < -0.25 ? 'end' : cos > 0.25 ? 'start' : 'middle';
  const stacked = anchor === 'middle';
  const dy = stacked ? (Math.sin(a) < 0 ? -8 : 12) : -2;

  bits.push(text(label, {
    x: lx, y: ly + dy, anchor, size: 15.5, weight: 700,
    fill: doneFlag ? INK.goldChampagne : INK.steel, family: DISPLAY, pop: true,
  }));
  bits.push(text(doneFlag ? `${sub} — ${t.done}` : sub, {
    x: lx, y: ly + dy + 17, anchor, size: 11, fill: doneFlag ? INK.cerulean : INK.slateText,
    family: SANS, pop: true,
  }));
});

// Above everything, not tucked under the ring: at the obvious placement
// it landed on the top station's own label.
bits.push(text(t.outerHead, {
  x: CX, y: 44, anchor: 'middle', size: 9.5, weight: 700, tracking: RTL ? 0 : 2,
  fill: INK.goldRoyal, family: SANS, pop: true,
}));

// ── The gap, named ────────────────────────────────────────────────────
{
  const y = H - 96;
  bits.push(rule(140, y - 26, W - 140, y - 26,
    { stroke: INK.goldRoyal, width: 1, opacity: 0.26, dash: '1 7' }));
  bits.push(text(t.gap, {
    x: CX, y, anchor: 'middle', size: 15, weight: 700,
    fill: '#C9788A', family: DISPLAY, pop: true,
  }));
  bits.push(text(t.gapSub, {
    x: CX, y: y + 22, anchor: 'middle', size: 11.5, fill: INK.slateText, family: SANS,
    ltr: !RTL, pop: true,
  }));
}

const svg = plate({
  id: 'quality-cycle', lang: LANG, width: W, height: H,
  title: t.title, desc: t.desc,
  body: bits.map((s) => '  ' + s).join('\n'),
});

mkdirSync(path.dirname(OUT), { recursive: true });
writeFileSync(OUT, svg);
console.log(`Wrote ${path.relative(ROOT, OUT)} — ${(svg.length / 1024).toFixed(1)} KB`);
console.log(`  enrolments ${T.enrolments} · sessions ${T.liveSessions} · awards ${T.awards}`);
