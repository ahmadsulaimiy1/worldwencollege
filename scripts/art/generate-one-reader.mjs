#!/usr/bin/env node
// Generates assets/art/one-reader.svg (+ .ar) — the plate for
// /my-desk.html.
//
// ─────────────────────────────────────────────────────────────────────
// WHAT IT ARGUES
// ─────────────────────────────────────────────────────────────────────
// `ADDRESSED_TO` in functions/_lib/comms/announcements.js is a WHERE
// fragment and not a filter, and that distinction is the whole security
// posture of the notice feed: a notice a learner may not see is never
// read out of the database on their request at all. The drawing has to
// carry that, so it is drawn as ARCHITECTURE rather than as a sieve.
// Three gates admit a notice — the institution, the level, the named
// learner — and every one of them then passes under one window, which
// is the publication clock. A notice reaches a reader by standing up in
// one gate AND passing the window. Nothing arrives and is turned back
// afterwards; there is no route in this drawing that reaches the reader
// and is then discarded, because there is no such route in the query.
//
// The three gates are not identical, and that is the second argument.
// The institution gate is wide, the level gate is narrower, and the
// gate to a named learner is one person wide — which is what the
// predicate says, drawn.
//
// ─────────────────────────────────────────────────────────────────────
// THE SCOPES COME FROM announcements.js, NOT FROM THIS FILE
// ─────────────────────────────────────────────────────────────────────
// `AUDIENCE_SCOPES` is the same list the schema's CHECK constraint
// carries and the same list the endpoint validates against. Importing
// it means a fourth audience — a cohort, a course, a country — moves
// the endpoint, the page and this drawing together, and the throw below
// makes a drawing that quietly omitted one impossible to ship.
//
//   node scripts/art/generate-one-reader.mjs [ar]

import { writeFileSync, mkdirSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { INK, SERIF, sansFor, isRtl, n, text, paragraph, drawn, rule, node, plate, lineGap } from './lib/plate.mjs';
import { AUDIENCE_SCOPES } from '../../functions/_lib/comms/announcements.js';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..');
const LANG = (process.argv[2] || 'en').toLowerCase();
const RTL = isRtl(LANG);
const SANS = sansFor(LANG);
const DISPLAY = RTL ? SANS : SERIF;
const ID = 'one-reader';
const OUT = path.join(ROOT, `assets/art/${ID}${RTL ? '.ar' : ''}.svg`);

// How wide each gate stands, and what it is called. The width is the
// argument: an institution-wide notice is a public arch, a level notice
// is a college door, and a notice to one learner is a postern.
const GATES = {
  institution: {
    width: 150,
    en: ['To the whole College', 'Every enrolled learner'],
    ar: ['إلى الكلّية كلّها', 'كلُّ متعلّمٍ مسجَّل'],
  },
  level: {
    width: 104,
    en: ['To one level', 'Those enrolled on it'],
    ar: ['إلى مستوًى واحد', 'المسجَّلون فيه'],
  },
  learner: {
    width: 58,
    en: ['To one learner', 'Named, and only them'],
    ar: ['إلى متعلّمٍ واحد', 'مسمًّى، ولا سواه'],
  },
};

const missing = AUDIENCE_SCOPES.filter((s) => !GATES[s]);
if (missing.length) {
  throw new Error(
    `The endpoint admits ${AUDIENCE_SCOPES.length} audiences and this generator draws gates for `
    + `${Object.keys(GATES).length}. Missing: ${missing.join(', ')}. A drawing that omitted an `
    + 'audience would show a reader who cannot be reached by a route the platform actually uses, '
    + 'which is the opposite of what it argues.',
  );
}

const COPY = {
  en: {
    eyebrow: 'HOW A NOTICE FINDS ONE READER',
    lede: 'Three gates, one window. A notice you may not see is never read.',
    window: 'THE WINDOW',
    windowLines: ['Published', 'Opened', 'Not yet closed'],
    reader: 'YOU',
    foot: 'The gate and the window are one statement in the database. Nothing is fetched and then set aside.',
    title: 'How a notice reaches one reader: three gates of audience, one window of publication, one reader',
    desc:
      'Three arches stand on the left, drawn at three widths. The widest admits a notice addressed '
      + 'to the whole College and reaches every enrolled learner. The middle one admits a notice to a '
      + 'single level and reaches those enrolled on it. The narrowest is one person wide and admits a '
      + 'notice addressed to one named learner. Every route from all three passes through a single '
      + 'window, marked published, opened, and not yet closed — the publication clock. Beyond the '
      + 'window is one reader. There is no route in the drawing that reaches the reader and is then '
      + 'turned back, because the gate and the window are one statement in the database rather than a '
      + 'filter applied after the notices have been fetched.',
  },
  ar: {
    eyebrow: 'كيف يبلغ الإعلان قارئًا واحدًا',
    lede: 'ثلاثة أبوابٍ ونافذةٌ واحدة. والإعلان الذي لا يحقّ لك لا يُقرأ أصلًا.',
    window: 'النافذة',
    windowLines: ['منشور', 'قد فُتح', 'ولم يُغلَق'],
    reader: 'أنت',
    foot: 'الباب والنافذة عبارةٌ واحدةٌ في قاعدة البيانات. ولا يُجلَب شيءٌ ثمّ يُنحَّى.',
    title: 'كيف يبلغ الإعلان قارئًا واحدًا: ثلاثة أبوابٍ للجمهور، ونافذةُ نشرٍ واحدة، وقارئٌ واحد',
    desc:
      'ثلاثة عقودٍ قائمةٌ على اليمين بثلاثة عروض. أوسعها يأذن لإعلانٍ موجَّهٍ إلى الكلّية كلّها فيبلغ '
      + 'كلَّ متعلّمٍ مسجَّل. وأوسطها يأذن لإعلانٍ إلى مستوًى واحدٍ فيبلغ المسجَّلين فيه. وأضيقها بعرض '
      + 'إنسانٍ واحدٍ ويأذن لإعلانٍ موجَّهٍ إلى متعلّمٍ مسمًّى. وكلُّ طريقٍ من الثلاثة يمرّ بنافذةٍ '
      + 'واحدةٍ موسومةٍ بأنّه منشورٌ وقد فُتح ولم يُغلَق، وهي ساعة النشر. وخلف النافذة قارئٌ واحد. وليس '
      + 'في الرسم طريقٌ يبلغ القارئ ثمّ يُردّ، لأنّ الباب والنافذة عبارةٌ واحدةٌ في قاعدة البيانات لا '
      + 'مِصفاةٌ تُطبَّق بعد جلب الإعلانات.',
  },
};
const t = COPY[RTL ? 'ar' : 'en'];
const linesOf = (scope) => (RTL ? GATES[scope].ar : GATES[scope].en);

// ── Geometry ─────────────────────────────────────────────────────────
// Laid out along the reading direction: gates at the head of the line,
// the window in the middle, the reader at the end. Mirrored for Arabic
// by coordinate, never by text-anchor — see lib/plate.mjs.
const W = 900, H = 440;
const GATE_X = 190;                // centre of the gate colonnade
const WIN_X = 520;                 // centre of the publication window
const READER_X = 780;              // the reader
const ROWS = [138, 232, 326];      // the three gate baselines

const mirror = (x) => (RTL ? W - x : x);
const gx = mirror(GATE_X);
const wx = mirror(WIN_X);
const rx = mirror(READER_X);

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

// --- The three gates --------------------------------------------------
// An arch, at its own width, with the notice's route drawn out of the
// middle of it. The order is the endpoint's own order.
AUDIENCE_SCOPES.forEach((scope, i) => {
  const g = GATES[scope];
  const y = ROWS[i];
  const half = g.width / 2;
  const x0 = gx - half;
  const x1 = gx + half;
  const top = y - 46;
  const spring = y - 18;           // where the arch springs from the jamb

  // The arch itself: two jambs and a semicircular head.
  bits.push(drawn(
    `M${n(x0)} ${n(y)}L${n(x0)} ${n(spring)}`
    + `A${n(half)} ${n(spring - top)} 0 0 1 ${n(x1)} ${n(spring)}`
    + `L${n(x1)} ${n(y)}`,
    { stroke: i === 2 ? INK.goldRich : INK.sapphire, width: 1.6, ms: 900 + i * 140, cap: 'butt' },
  ));
  bits.push(`<path data-pop="" d="M${n(x0)} ${n(y)}L${n(x0)} ${n(spring)}`
    + `A${n(half)} ${n(spring - top)} 0 0 1 ${n(x1)} ${n(spring)}L${n(x1)} ${n(y)}Z"`
    + ` fill="${i === 2 ? INK.goldRoyal : INK.royalBlue}" fill-opacity="0.17"/>`);
  // The threshold, so each arch stands on something.
  bits.push(rule(x0 - 8, y, x1 + 8, y, { stroke: INK.steel, width: 1.2, opacity: 0.5 }));

  // The label sits outside the colonnade, on the margin side.
  const lx = RTL ? gx + half + 16 : gx - half - 16;
  const anchor = RTL ? 'start' : 'end';
  linesOf(scope).forEach((line, k) => {
    bits.push(text(line, {
      x: lx, y: y - 26 + k * lineGap(LANG), anchor, size: k === 0 ? 11 : 10,
      weight: k === 0 ? 700 : 400,
      fill: k === 0 ? INK.goldChampagne : INK.slateText, family: SANS, pop: true,
    }));
  });

  // The route: out of the arch, along to the window.
  const from = RTL ? gx - half : gx + half;
  bits.push(drawn(
    `M${n(from)} ${n(y - 20)}C${n((from + wx) / 2)} ${n(y - 20)} ${n((from + wx) / 2)} ${n(232)} ${n(wx + (RTL ? 34 : -34))} ${n(232)}`,
    { stroke: INK.goldRoyal, width: 1.2, opacity: 0.85, ms: 1200 + i * 160 },
  ));
});

// --- The window -------------------------------------------------------
// One window, and every route passes it. Drawn as a lit aperture rather
// than as a valve: it is a condition on the same statement, not a second
// stage that inspects what the first one let through.
{
  const half = 34;
  const top = 150, bottom = 314;
  bits.push(`<rect data-pop="" x="${n(wx - half)}" y="${n(top)}" width="${n(half * 2)}" height="${n(bottom - top)}"`
    + ` rx="10" fill="${INK.goldRoyal}" fill-opacity="0.14" stroke="${INK.goldRich}" stroke-width="1.4"/>`);
  bits.push(drawn(`M${n(wx - half)} ${n(top)}L${n(wx - half)} ${n(bottom)}`, { stroke: INK.goldRich, width: 1.4, ms: 1500 }));
  bits.push(drawn(`M${n(wx + half)} ${n(top)}L${n(wx + half)} ${n(bottom)}`, { stroke: INK.goldRich, width: 1.4, ms: 1500 }));

  bits.push(text(t.window, {
    x: wx, y: top - 14, anchor: 'middle', size: 10, weight: 700,
    tracking: RTL ? 0 : 1.8, fill: INK.goldSoft, family: SANS, pop: true,
  }));
  t.windowLines.forEach((line, k) => {
    bits.push(text(line, {
      x: wx, y: 194 + k * 30, anchor: 'middle', size: 10.5, weight: 600,
      fill: INK.goldChampagne, family: SANS, pop: true,
    }));
  });
}

// --- The reader -------------------------------------------------------
{
  const from = RTL ? wx - 34 : wx + 34;
  bits.push(drawn(`M${n(from)} ${n(232)}L${n(rx + (RTL ? 26 : -26))} ${n(232)}`, {
    stroke: INK.goldRich, width: 1.6, ms: 1800,
  }));
  bits.push(node(rx, 232, { r: 22, fill: INK.midnight, stroke: INK.goldRich, width: 2, core: INK.goldRich }));
  bits.push(text(t.reader, {
    x: rx, y: 282, anchor: 'middle', size: 11, weight: 700,
    tracking: RTL ? 0 : 1.8, fill: INK.goldChampagne, family: SANS, pop: true,
  }));
}

// --- The foot ---------------------------------------------------------
{
  bits.push(rule(62, H - 62, W - 62, H - 62, { stroke: INK.steel, width: 0.8, opacity: 0.3 }));
  bits.push(paragraph(t.foot, {
    x: W / 2, y: H - 38, width: W - 180, anchor: 'middle', size: 11,
    fill: INK.goldSoft, family: SANS, lang: LANG,
  }));
}

mkdirSync(path.dirname(OUT), { recursive: true });
writeFileSync(OUT, plate({
  id: ID, lang: LANG, width: W, height: H, title: t.title, desc: t.desc, body: bits.join('\n  '),
}));
console.log(`art: ${path.relative(ROOT, OUT)} — ${AUDIENCE_SCOPES.length} gates`);
