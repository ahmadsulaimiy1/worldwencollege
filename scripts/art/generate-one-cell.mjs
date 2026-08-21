#!/usr/bin/env node
// Generates assets/art/one-cell.svg (+ .ar) — the plate for
// /my-engagement.html.
//
// ─────────────────────────────────────────────────────────────────────
// WHAT IT ARGUES
// ─────────────────────────────────────────────────────────────────────
// One cell of the engagement grid, taken apart into the three things it
// is actually made of, drawn as three layers of one object rather than
// as three boxes in a row:
//
//   THE EVIDENCE, at the bottom — the signals the server produced, each
//   named and each carrying the clause it counts under.
//   THE READING, above it — the state the platform derived from that
//   evidence, which is what a cell shows when nobody has touched it.
//   THE CORRECTION, on top — a state a person wrote, WITH THE READING
//   STILL VISIBLE UNDERNEATH IT.
//
// The third layer is the whole point and it is the reason this is drawn
// as a stack rather than a flow. `cell()` in the attendance module puts
// it plainly: "a correction never conceals what it corrected". A
// drawing where the correction replaced the reading would say the
// opposite of the code, so here the top plate is drawn INSET and
// SEMI-TRANSPARENT — the reading is legible through it, on purpose.
//
// ─────────────────────────────────────────────────────────────────────
// THE MEASURES COME FROM attendance.js, NOT FROM THIS FILE
// ─────────────────────────────────────────────────────────────────────
// `engagementNotice().measuredBy` is the same list the endpoint sends to
// the learner, so a sixth measure — or a reworded one — moves the
// module, the page and this drawing together. The throw below makes a
// drawing that quietly omitted one impossible to ship.
//
//   node scripts/art/generate-one-cell.mjs [ar]

import { writeFileSync, mkdirSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { INK, SERIF, sansFor, isRtl, n, text, paragraph, drawn, rule, plate } from './lib/plate.mjs';
import { engagementNotice, ENGAGEMENT } from '../../functions/_lib/academic/attendance.js';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..');
const LANG = (process.argv[2] || 'en').toLowerCase();
const RTL = isRtl(LANG);
const SANS = sansFor(LANG);
const DISPLAY = RTL ? SANS : SERIF;
const ID = 'one-cell';
const OUT = path.join(ROOT, `assets/art/${ID}${RTL ? '.ar' : ''}.svg`);

const NOTICE = engagementNotice();

// A short mark for each measure. The full label is on the page; a plate
// carries the name of the signal, not the sentence about it.
const SHORT = {
  'engage.counts.time_on_task': { en: 'Study time', ar: 'زمن الدراسة' },
  'engage.counts.assessment': { en: 'An attempt', ar: 'محاولة تقييم' },
  'engage.counts.live_session': { en: 'A confirmed session', ar: 'حصّة مؤكَّدة' },
  'framework.xi.lesson_completion': { en: 'A lesson completed', ar: 'درس مكتمل' },
  'framework.xi.laboratory_practice': { en: 'Laboratory practice', ar: 'تدريب معمل' },
};

const missing = NOTICE.measuredBy.filter((m) => !SHORT[m.id]);
if (missing.length) {
  throw new Error(
    `The notice names ${NOTICE.measuredBy.length} measures and this generator has marks for `
    + `${Object.keys(SHORT).length}. Missing: ${missing.map((m) => m.id).join(', ')}. A drawing that `
    + 'omitted a measure would show a state read from less evidence than the platform actually uses.',
  );
}

const COPY = {
  en: {
    eyebrow: 'ONE CELL, TAKEN APART',
    lede: 'Evidence, a reading of it, and a correction that leaves the reading visible.',
    layers: {
      evidence: ['THE EVIDENCE', 'what the server produced'],
      reading: ['THE READING', 'what the platform derived'],
      written: ['A STATE WRITTEN BY A PERSON', 'and the reading, still underneath'],
    },
    window: `A ${ENGAGEMENT.windowDays}-day window, anchored to the learner’s own start date`,
    foot: 'A correction never conceals what it corrected. Both readings stay on the record, and the reason is recorded with them.',
    title: 'One cell of the engagement grid taken apart into evidence, the platform’s reading, and a correction written over it',
    desc:
      'Three layers of one object rather than three separate boxes. At the base, the evidence the '
      + 'server produced: study time it measured, an assessment attempted, a live session a host '
      + 'confirmed, a lesson completed, and laboratory practice submitted — each carrying the clause '
      + 'it counts under. Above it, the state the platform derived from that evidence, which is what '
      + 'a cell shows when nobody has touched it. On top, a state written by a member of staff, drawn '
      + 'inset and semi-transparent so the reading underneath stays legible through it. That is the '
      + 'drawing’s argument and the module’s rule: a correction never conceals what it corrected, and '
      + 'both readings stay on the record with the reason given for the change. The whole cell '
      + 'measures one seven-day window, anchored to the learner’s own start date rather than to a '
      + 'calendar week.',
  },
  ar: {
    eyebrow: 'خليّةٌ واحدة، مفكوكة',
    lede: 'دليلٌ، وقراءةٌ له، وتصحيحٌ يُبقي القراءة ظاهرة.',
    layers: {
      evidence: ['الدليل', 'ما أنتجه الخادم'],
      reading: ['القراءة', 'ما استنبطته المنصّة'],
      written: ['حالٌ كتبها إنسان', 'والقراءة باقيةٌ تحتها'],
    },
    window: `نافذةٌ من ${ENGAGEMENT.windowDays} أيّام، مربوطةٌ ببدء المتعلّم نفسه`,
    foot: 'والتصحيح لا يخفي ما صحّحه. تبقى القراءتان في السجلّ، ويُسجَّل معهما السبب.',
    title: 'خليّةٌ من شبكة المشاركة مفكوكةً إلى دليلٍ وقراءةٍ للمنصّة وتصحيحٍ مكتوبٍ فوقها',
    desc:
      'ثلاث طبقاتٍ لجسمٍ واحد لا ثلاثة صناديق متفرّقة. في القاعدة الدليل الذي أنتجه الخادم: زمن '
      + 'دراسةٍ قاسه، وتقييمٌ حُووِل، وحصّةٌ حيّةٌ أكّدها مضيفها، ودرسٌ أُكمِل، وتدريبُ معملٍ سُلِّم — '
      + 'ويحمل كلٌّ منها البند الذي يُحتسَب تحته. وفوقه الحال التي استنبطتها المنصّة من ذلك الدليل، '
      + 'وهي ما تعرضه الخليّة ما لم يمسّها أحد. وفي الأعلى حالٌ كتبها عضو هيئة، مرسومةً غائرةً '
      + 'شبهَ شفّافة لتبقى القراءةُ تحتها مقروءةً من خلالها. وتلك حجّة الرسم وقاعدة الوحدة البرمجية: '
      + 'التصحيح لا يخفي ما صحّحه، وتبقى القراءتان في السجلّ ومعهما سبب التغيير. والخليّة كلُّها '
      + 'تقيس نافذةً واحدةً من سبعة أيّام، مربوطةً ببدء المتعلّم نفسه لا بأسبوع التقويم.',
  },
};
const t = COPY[RTL ? 'ar' : 'en'];
const markOf = (m) => (RTL ? SHORT[m.id].ar : SHORT[m.id].en);

// ── Geometry ─────────────────────────────────────────────────────────
// Three plates stacked, each narrower and higher than the one below, so
// the stack reads as one object seen slightly from the front.
const W = 900, H = 470;
const CX = W / 2;
const BASE_W = 620, BASE_Y = 330;
const READ_W = 520, READ_Y = 246;
const TOP_W = 420, TOP_Y = 166;

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

const label = (lines, y, ink) => {
  // The layer's name sits in the margin, on the reading side, so the
  // stack itself is never written over.
  const lx = RTL ? CX + BASE_W / 2 + 18 : CX - BASE_W / 2 - 18;
  const anchor = RTL ? 'start' : 'end';
  lines.forEach((line, k) => {
    bits.push(text(line, {
      x: lx, y: y + k * 15, anchor, size: k === 0 ? 10 : 9.5,
      weight: k === 0 ? 700 : 400,
      tracking: k === 0 && !RTL ? 1.4 : 0,
      fill: k === 0 ? ink : INK.slateText, family: SANS, pop: true,
    }));
  });
};

// --- 1 · the evidence -------------------------------------------------
{
  const x0 = CX - BASE_W / 2;
  bits.push(`<rect data-pop="" x="${n(x0)}" y="${n(BASE_Y - 56)}" width="${n(BASE_W)}" height="56"`
    + ` rx="8" fill="${INK.royalBlue}" fill-opacity="0.2" stroke="${INK.sapphire}" stroke-width="1.3"/>`);
  label(t.layers.evidence, BASE_Y - 34, INK.cerulean);

  // The five signals, laid along the base as marks rather than as a
  // list: the evidence is plural and simultaneous, not sequential.
  const step = BASE_W / NOTICE.measuredBy.length;
  NOTICE.measuredBy.forEach((m, i) => {
    const cx = RTL
      ? CX + BASE_W / 2 - step * (i + 0.5)
      : x0 + step * (i + 0.5);
    bits.push(`<rect data-pop="" x="${n(cx - step / 2 + 6)}" y="${n(BASE_Y - 44)}" width="${n(step - 12)}" height="32"`
      + ` rx="5" fill="${INK.sapphire}" fill-opacity="0.26"/>`);
    bits.push(text(markOf(m), {
      x: cx, y: BASE_Y - 24, anchor: 'middle', size: 8.5, weight: 600,
      fill: INK.goldChampagne, family: SANS, pop: true,
    }));
  });
  bits.push(rule(x0 - 8, BASE_Y, x0 + BASE_W + 8, BASE_Y, { stroke: INK.steel, width: 1.2, opacity: 0.5 }));
}

// --- 2 · the reading --------------------------------------------------
{
  const x0 = CX - READ_W / 2;
  bits.push(drawn(`M${n(CX)} ${n(BASE_Y - 60)}L${n(CX)} ${n(READ_Y + 6)}`, {
    stroke: INK.goldRoyal, width: 1.2, ms: 1100,
  }));
  bits.push(`<rect data-pop="" x="${n(x0)}" y="${n(READ_Y - 52)}" width="${n(READ_W)}" height="52"`
    + ` rx="8" fill="${INK.emerald}" fill-opacity="0.3" stroke="${INK.emerald}" stroke-width="1.4"/>`);
  label(t.layers.reading, READ_Y - 32, INK.goldSoft);
}

// --- 3 · the correction, drawn THROUGH which the reading is legible ---
{
  const x0 = CX - TOP_W / 2;
  bits.push(drawn(`M${n(CX)} ${n(READ_Y - 56)}L${n(CX)} ${n(TOP_Y + 6)}`, {
    stroke: INK.goldRoyal, width: 1.2, ms: 1300,
  }));
  // 0.22 opacity is the argument, not a style: at this weight the plate
  // below is read straight through the plate above.
  bits.push(`<rect data-pop="" x="${n(x0)}" y="${n(TOP_Y - 52)}" width="${n(TOP_W)}" height="52"`
    + ` rx="8" fill="${INK.goldRoyal}" fill-opacity="0.22" stroke="${INK.goldRich}" stroke-width="1.5"/>`);
  bits.push(drawn(`M${n(x0)} ${n(TOP_Y - 52)}L${n(x0 + TOP_W)} ${n(TOP_Y - 52)}`, {
    stroke: INK.goldRich, width: 1.6, ms: 1500, cap: 'butt',
  }));
  label(t.layers.written, TOP_Y - 32, INK.goldRich);
}

// --- The window the whole cell measures -------------------------------
{
  bits.push(text(t.window, {
    x: CX, y: BASE_Y + 30, anchor: 'middle', size: 10.5, weight: 600,
    fill: INK.goldSoft, family: SANS, pop: true,
  }));
}

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
console.log(`art: ${path.relative(ROOT, OUT)} — ${NOTICE.measuredBy.length} measures`);
