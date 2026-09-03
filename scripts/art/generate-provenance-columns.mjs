#!/usr/bin/env node
// Generates assets/art/provenance-columns.svg (+ .ar) — the seventh
// living diagram (docs/digital-institution-masterplan.md, Layer 3).
//
// WHAT IT ARGUES
//
// /academics/teaching/ separates teaching knowledge into four kinds and
// marks every entry in the support record with exactly one of them:
// DERIVED from the curriculum, ESTABLISHED in the field, DESIGNED by the
// authors, OBSERVED in a real classroom. Three of those are full. The
// fourth is empty.
//
// The page states that in four cards, and four cards state four
// quantities. What they cannot show is the thing that makes the fourth
// one different in kind rather than in size: the first three were
// produced by writing, at a desk, and the fourth cannot be. No amount
// of further authoring moves an entry into it. Only teaching does.
//
// So the drawing puts a rule between the third column and the fourth,
// and names the two sides. Left of the rule is what writing produces.
// Right of it is what only a classroom produces — drawn as a dashed
// outline standing on the baseline at full plot height, holding nothing.
// An empty space that is visibly the right size for something is the
// honest picture; a short bar would imply a small quantity of the same
// stuff, which is the exact conflation the page exists to refuse.
//
// THE NUMBERS
//
// Counted out of the seeded record with the same query
// scripts/build-teaching.js uses for the cards, so the drawing and the
// page cannot disagree. Nothing here is typed.
//
// The generator refuses if the observed count stops being nought. That
// is deliberate and it is the same guard the Teaching cluster carries:
// on the day a lesson is observed this drawing is arguing something
// that is no longer true, and it must be re-thought rather than
// re-rendered.
//
//   node scripts/art/generate-provenance-columns.mjs [ar]

import { writeFileSync, mkdirSync, readFileSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { DatabaseSync } from 'node:sqlite';
import { INK, SERIF, sansFor, isRtl, n, scale, text, drawn, rule, node, plate } from './lib/plate.mjs';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..');
const LANG = (process.argv[2] || 'en').toLowerCase();
const RTL = isRtl(LANG);
const SANS = sansFor(LANG);
const DISPLAY = RTL ? SANS : SERIF;
const OUT = path.join(ROOT, `assets/art/provenance-columns${RTL ? '.ar' : ''}.svg`);

// ── The record ────────────────────────────────────────────────────────
// The same seeds and the same query as scripts/build-teaching.js. Two
// copies of a figure is how a page and its diagram come to disagree, so
// this reads the database rather than the page.
// The full list, not a subset. Trimming it to "the seeds that hold the
// entries" fails on a foreign key: the pedagogy rows reference learning
// items that reference units, courses and levels, and every one of
// those lives in a different file.
const SEEDS = [
  'seed-curriculum-level-1.sql', 'seed-curriculum-level-2.sql', 'seed-curriculum-level-3.sql',
  'seed-curriculum-level-4.sql', 'seed-curriculum-level-5.sql', 'seed-curriculum-level-6.sql',
  'seed-audio-level-1.sql', 'seed-audio-level-2.sql', 'seed-audio-level-3.sql',
  'seed-audio-level-4.sql', 'seed-audio-level-5.sql', 'seed-audio-level-6.sql',
  'seed-competency-level-1.sql', 'seed-exercises.sql', 'seed-selfchecks.sql',
  'seed-vocabulary-level-1.sql', 'seed-solo-level-1.sql',
  'seed-pedagogy.sql', 'seed-pedagogy-level-1.sql', 'seed-teaching-expertise-level-1.sql',
];

export function readStates() {
  const db = new DatabaseSync(':memory:');
  db.exec(readFileSync(path.join(ROOT, 'sql/schema.sql'), 'utf8'));
  for (const f of SEEDS) db.exec(readFileSync(path.join(ROOT, 'sql', f), 'utf8'));
  const rows = db.prepare(
    "SELECT evidence_state, COUNT(*) n FROM pedagogy_entries "
    + "WHERE value IS NOT NULL AND value <> '' GROUP BY evidence_state",
  ).all();
  db.close();
  return Object.fromEntries(rows.map((r) => [r.evidence_state, r.n]));
}

const S = readStates();
const COLUMNS = [
  { key: 'derived_from_curriculum', count: S.derived_from_curriculum || 0, tint: INK.sapphire },
  { key: 'established_pedagogy', count: S.established_pedagogy || 0, tint: INK.teal },
  { key: 'educational_expertise', count: S.educational_expertise || 0, tint: INK.goldRoyal },
  { key: 'observed_in_teaching', count: S.observed_in_teaching || 0, tint: INK.steel, empty: true },
];
const WRITTEN = COLUMNS.slice(0, 3).reduce((a, c) => a + c.count, 0);

if (COLUMNS[3].count !== 0) {
  throw new Error(`${COLUMNS[3].count} entries are now marked observed_in_teaching. This drawing `
    + 'argues that the fourth column is empty and that only teaching can fill it. That argument '
    + 'has changed. Re-think the drawing before regenerating it.');
}
if (!WRITTEN) {
  throw new Error('The support record reads as empty. A drawing of an empty record would publish '
    + 'a false absence, so the generator refuses rather than rendering four zeroes.');
}

// ── Copy ──────────────────────────────────────────────────────────────
const COPY = {
  en: {
    eyebrow: 'THE SUPPORT RECORD',
    total: `${WRITTEN} entries across 17 fields, each marked with where its knowledge came from`,
    groupA: 'WHAT WRITING CAN PRODUCE',
    groupB: 'WHAT ONLY A CLASSROOM PRODUCES',
    names: ['Derived', 'Established', 'Designed', 'Observed'],
    gloss: [
      'read off the curriculum',
      'attested in the field',
      'authored judgement',
      'written down by whoever it happened to',
    ],
    unit: 'entries',
    empty: 'NOTHING IS RECORDED HERE',
    emptyNote: 'Three cohorts have been taught. None of it was written up under this scheme, '
      + 'so the column stands empty rather than being filled with the other three.',
    title: 'Four kinds of teaching knowledge, and the one that is empty',
    desc:
      `The support record behind the Teacher's Companion holds ${WRITTEN} entries across seventeen `
      + 'fields, and every entry declares where its knowledge came from. They are drawn as four '
      + `columns. Derived, read off the curriculum itself, holds ${COLUMNS[0].count} entries. `
      + `Established, attested in the international teaching of English, holds ${COLUMNS[1].count}. `
      + `Designed, an authored judgement by the people who wrote the programme, holds ${COLUMNS[2].count}. `
      + 'A rule separates those three from the fourth, because the difference is one of kind and not '
      + 'of quantity: the first three were produced by writing, and the fourth cannot be. Observed — '
      + 'what actually happened in a room with real learners, written down by whoever it happened to — '
      + 'is drawn as a dashed outline at the full height of the plot with nothing inside it. It holds '
      + 'nought entries. Three cohorts have been taught and none of it was recorded under this scheme, '
      + 'so the column is left empty rather than filled with the other three kinds.',
  },
  ar: {
    eyebrow: 'سجل الإسناد التعليمي',
    total: `${WRITTEN} مدخلة في 17 حقلًا، كل مدخلة موسومة بمصدر معرفتها`,
    groupA: 'ما تستطيع الكتابة أن تنتجه',
    groupB: 'ما لا ينتجه إلا الفصل',
    // The page beside this plate names them مشتق / مُثبَت / مصمَّم /
    // مُشاهَد, and a drawing that renamed two of them would read as a
    // fifth and sixth category. Taken from the page, not re-coined.
    names: ['مشتق', 'مُثبَت', 'مصمَّم', 'مُشاهَد'],
    gloss: [
      'مقروء من المنهج نفسه',
      'مشهود له في الميدان',
      'حكم مؤلَّف',
      'يكتبه من وقع له',
    ],
    unit: 'مدخلة',
    empty: 'لم يُسجَّل هنا شيء',
    emptyNote: 'دُرِّست ثلاث دفعات، ولم يُدوَّن منها شيء وفق هذا النظام، '
      + 'فبقي العمود فارغًا ولم يُملأ بالأنواع الثلاثة الأخرى.',
    title: 'أربعة أنواع من المعرفة التدريسية، وواحد منها فارغ',
    desc:
      `يضم سجل الإسناد الذي يقوم عليه دليل المعلم ${WRITTEN} مدخلة في سبعة عشر حقلًا، `
      + 'وكل مدخلة تعلن من أين جاءت معرفتها. وهي مرسومة في أربعة أعمدة. '
      + `المشتق، المقروء من المنهج نفسه، فيه ${COLUMNS[0].count} مدخلة. `
      + `والمُثبَت، المشهود له في التدريس الدولي للإنجليزية، فيه ${COLUMNS[1].count}. `
      + `والمصمَّم، وهو حكم مؤلَّف من كتبوا البرنامج، فيه ${COLUMNS[2].count}. `
      + 'ويفصل خطٌّ هذه الثلاثة عن الرابع، لأن الفرق فرق نوع لا فرق مقدار: '
      + 'فالثلاثة الأولى أنتجتها الكتابة، والرابع لا تنتجه. '
      + 'والمُشاهَد — ما جرى فعلًا في غرفة فيها متعلمون، يكتبه من وقع له — '
      + 'مرسوم إطارًا متقطعًا بكامل ارتفاع اللوحة وليس فيه شيء. فيه صفر مدخلة. '
      + 'دُرِّست ثلاث دفعات ولم يُدوَّن منها شيء وفق هذا النظام، '
      + 'فتُرك العمود فارغًا ولم يُملأ بالأنواع الثلاثة الأخرى.',
  },
};
const t = COPY[LANG] || COPY.en;

// ── Geometry ──────────────────────────────────────────────────────────
const W = 900, H = 580;
const M = { left: 92, right: 92 };
const BASE = 424;          // the baseline the columns stand on
const TOP = 150;           // the ceiling of the plot
const COL_W = 118;
const SPAN = W - M.left - M.right;
const GAP = (SPAN - COL_W * COLUMNS.length) / (COLUMNS.length - 1);

// Mirrored coordinates carry the right-to-left layout — never
// text-anchor, which resolves against the sentence rather than the
// drawing. See the note in lib/plate.mjs.
const colX = (i) => (RTL
  ? W - M.right - COL_W - i * (COL_W + GAP)
  : M.left + i * (COL_W + GAP));

const h = scale([0, Math.max(...COLUMNS.map((c) => c.count))], [0, BASE - TOP]);

const bits = [];

// --- The heading band -------------------------------------------------
{
  const x0 = RTL ? W - M.right : M.left;
  const anchor = RTL ? 'end' : 'start';
  bits.push(text(t.eyebrow, {
    x: x0, y: 52, anchor, size: 10.5, weight: 700,
    tracking: RTL ? 0 : 2.4, fill: INK.cerulean, family: SANS,
  }));
  bits.push(text(t.total, {
    x: x0, y: 78, anchor, size: 13, fill: INK.slateText, family: SANS,
  }));
}

// --- The rule that separates written from taught ----------------------
// Placed in the gutter before the last column. This is the diagram's
// argument, so it is drawn before the columns and sits behind them.
const dividerX = RTL
  ? colX(3) + COL_W + GAP / 2
  : colX(3) - GAP / 2;
bits.push(rule(dividerX, 108, dividerX, BASE + 88, {
  stroke: INK.goldRoyal, width: 1, opacity: 0.42, dash: '1 7',
}));
{
  // Each group heading is centred over the columns it covers.
  const midA = RTL
    ? (colX(0) + COL_W + colX(2)) / 2
    : (colX(0) + colX(2) + COL_W) / 2;
  const midB = colX(3) + COL_W / 2;
  bits.push(text(t.groupA, {
    x: midA, y: 122, anchor: 'middle', size: 10.5, weight: 700,
    tracking: RTL ? 0 : 1.8, fill: INK.cerulean, family: SANS, pop: true,
  }));
  bits.push(text(t.groupB, {
    x: midB, y: 122, anchor: 'middle', size: 10.5, weight: 700,
    tracking: RTL ? 0 : 1.8, fill: INK.goldSoft, family: SANS, pop: true,
  }));
}

// --- The baseline -----------------------------------------------------
bits.push(rule(M.left - 24, BASE, W - M.right + 24, BASE, {
  stroke: INK.steel, width: 1.1, opacity: 0.5,
}));

// --- One column each --------------------------------------------------
COLUMNS.forEach((c, i) => {
  const x0 = colX(i);
  const mid = x0 + COL_W / 2;

  if (c.empty) {
    // THE POINT OF THE DRAWING. Full plot height, dashed, holding
    // nothing — a space that is visibly the right size for something,
    // rather than a short bar implying a small amount of the same
    // stuff.
    bits.push(`<rect x="${n(x0)}" y="${n(TOP)}" width="${n(COL_W)}" height="${n(BASE - TOP)}"`
      + ` fill="none" stroke="${INK.cerulean}" stroke-width="1.2" stroke-opacity="0.75"`
      + ` stroke-dasharray="4 7"/>`);
    bits.push(text(t.empty, {
      x: mid, y: TOP + (BASE - TOP) / 2, anchor: 'middle', size: 10.5, weight: 700,
      tracking: RTL ? 0 : 1.6, fill: INK.cerulean, family: SANS, pop: true,
    }));
    bits.push(node(mid, BASE, { r: 6, stroke: INK.cerulean, core: null, width: 1.5 }));
  } else {
    const ht = h(c.count);
    const y0 = BASE - ht;
    bits.push(`<rect data-pop="" x="${n(x0)}" y="${n(y0)}" width="${n(COL_W)}" height="${n(ht)}"`
      + ` fill="${c.tint}" fill-opacity="${c.tint === INK.goldRoyal ? 0.15 : 0.26}"/>`);
    // The rim draws itself in, up one side, across, and down the other,
    // so the column arrives the way it is read: from the ground up.
    bits.push(drawn(
      `M${n(x0)} ${n(BASE)}L${n(x0)} ${n(y0)}L${n(x0 + COL_W)} ${n(y0)}L${n(x0 + COL_W)} ${n(BASE)}`,
      { stroke: c.tint, width: 1.6, ms: 1000 + i * 160, cap: 'butt' },
    ));
    bits.push(text(String(c.count), {
      x: mid, y: y0 - 16, anchor: 'middle', size: 26, weight: 700,
      fill: INK.goldChampagne, family: DISPLAY, ltr: true, pop: true,
    }));
    bits.push(text(t.unit, {
      x: mid, y: y0 - 1, anchor: 'middle', size: 10, weight: 700,
      tracking: RTL ? 0 : 1.4, fill: INK.slateText, family: SANS, pop: true,
    }));
  }

  // The name and its gloss, under the baseline.
  bits.push(text(t.names[i], {
    x: mid, y: BASE + 34, anchor: 'middle', size: 17, weight: 700,
    fill: c.empty ? INK.cerulean : INK.goldChampagne, family: DISPLAY, pop: true,
  }));
  bits.push(text(t.gloss[i], {
    x: mid, y: BASE + 54, anchor: 'middle', size: 10.5,
    fill: INK.slateText, family: SANS, opacity: 0.9, pop: true,
  }));
  if (c.empty) {
    bits.push(text('0', {
      x: mid, y: BASE + 80, anchor: 'middle', size: 22, weight: 700,
      fill: INK.cerulean, family: DISPLAY, ltr: true, pop: true,
    }));
  }
});

// --- The note that says why the column is left empty ------------------
{
  const x0 = RTL ? W - M.right : M.left;
  const anchor = RTL ? 'end' : 'start';
  bits.push(rule(M.left - 24, H - 74, W - M.right + 24, H - 74, {
    stroke: INK.steel, width: 0.9, opacity: 0.28,
  }));
  // Wrapped by hand: the plate apparatus draws a line at a time, and a
  // measured break is more reliable than a guessed character count.
  const lines = LANG === 'ar'
    ? ['دُرِّست ثلاث دفعات، ولم يُدوَّن منها شيء وفق هذا النظام،',
       'فبقي العمود فارغًا ولم يُملأ بالأنواع الثلاثة الأخرى.']
    : ['Three cohorts have been taught. None of it was written up under this scheme,',
       'so the column stands empty rather than being filled with the other three.'];
  lines.forEach((line, i) => {
    bits.push(text(line, {
      x: x0, y: H - 46 + i * 19, anchor, size: 12, fill: INK.slateText, family: SANS, pop: true,
    }));
  });
}

const svg = plate({
  id: 'provenance-columns', lang: LANG, width: W, height: H,
  title: t.title, desc: t.desc,
  body: bits.map((s) => '  ' + s).join('\n'),
});

mkdirSync(path.dirname(OUT), { recursive: true });
writeFileSync(OUT, svg);
console.log(`Wrote ${path.relative(ROOT, OUT)} — ${(svg.length / 1024).toFixed(1)} KB`);
