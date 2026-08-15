#!/usr/bin/env node
// Generates assets/art/competency-wheel.svg — the fifth living diagram
// (docs/digital-institution-masterplan.md, Layer 3).
//
// WHAT IT ARGUES
//
// BASCE's remit, quoted verbatim on /about/basce/ and /about/governance/,
// includes this clause: "ensures each competency is assessed multiple
// times across each level."
//
// The College has six competencies and a genuine mapping table behind
// them — every Level I assessment carries the competencies it bears on,
// with a weight and a written rationale. /about/basce/ already says the
// distribution is uneven, and says it well: "competencies are evidenced
// where they are genuinely assessed rather than distributed evenly to
// look complete."
//
// What that sentence does not say, and what a list of six names cannot
// show, is HOW uneven. Command is assessed twenty times. Reason is
// assessed once. Bearing and Reach are assessed at all.
//
// A radar polygon shows it in one look, because the shape collapses on
// the two axes that carry nothing. Six competencies drawn as six spokes
// would still read as six things the College does; six spokes with the
// polygon pulled to the centre on two of them reads as what it is — a
// framework that is four-sevenths built and says so.
//
// The gold ring at two is the remit itself, drawn as a threshold rather
// than described. Three of the six clear it. Reason sits inside it.
// Bearing and Reach sit on the hub.
//
// WHY THIS IS NOT A CRITICISM OF THE COLLEGE
//
// It is the College's own position, drawn. The mappings are interim
// because BASCE has no members to approve them, the framework is
// published before it is complete rather than after, and the remit that
// this drawing measures against is the College's own sentence about
// itself. An institution that publishes the gap between its remit and
// its coverage is doing the thing the remit exists for.
//
// THE NUMBERS
//
// Read from sql/seed-competency-level-1.sql via the schema, never typed.
// tests/competency-wheel.test.mjs reads them back out of the shipped SVG
// and holds them against the same source, in both languages.
//
//   node scripts/art/generate-competency-wheel.mjs [ar]

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
const OUT = path.join(ROOT, `assets/art/competency-wheel${RTL ? '.ar' : ''}.svg`);

// ── The record ────────────────────────────────────────────────────────
// Level I is the only level with a competency mapping at all, which is
// itself part of what the drawing has to say. Loading the other five
// curriculum seeds anyway so the count of levels-without-mappings is
// measured rather than assumed.
export function readCoverage() {
  const db = new DatabaseSync(':memory:');
  db.exec(readFileSync(path.join(ROOT, 'sql/schema.sql'), 'utf8'));
  for (let i = 1; i <= 6; i++) {
    db.exec(readFileSync(path.join(ROOT, `sql/seed-curriculum-level-${i}.sql`), 'utf8'));
  }
  db.exec(readFileSync(path.join(ROOT, 'sql/seed-competency-level-1.sql'), 'utf8'));
  const all = (s) => db.prepare(s).all();

  const competencies = all('SELECT id, code, name, sequence FROM competencies ORDER BY sequence');
  const counts = Object.fromEntries(
    all(`SELECT competency_id AS id, COUNT(*) AS n FROM assessment_competencies GROUP BY competency_id`)
      .map((r) => [r.id, r.n]));
  const statuses = [...new Set(all('SELECT DISTINCT status AS s FROM assessment_competencies').map((r) => r.s))];
  // level_id lives on courses, not units — a unit belongs to a course
  // and the course belongs to a level.
  const levelsWithMappings = all(`SELECT COUNT(DISTINCT c.level_id) AS n
      FROM assessment_competencies a
      JOIN learning_items li ON li.id = a.learning_item_id
      JOIN units u ON u.id = li.unit_id
      JOIN courses c ON c.id = u.course_id`)[0]?.n ?? 0;
  const totalLevels = all('SELECT COUNT(*) AS n FROM programme_levels')[0].n;
  db.close();

  return {
    rows: competencies.map((c) => ({ ...c, count: counts[c.id] || 0 })),
    statuses, levelsWithMappings, totalLevels,
    total: Object.values(counts).reduce((t, v) => t + v, 0),
  };
}

const D = readCoverage();
if (D.rows.length !== 6) throw new Error(`Expected six competencies, read ${D.rows.length}`);

// The remit's own word. "Multiple times" is at least twice, and the
// threshold is drawn rather than described because a described
// threshold is one nobody checks a value against.
const REMIT_MIN = 2;

// ── Copy ──────────────────────────────────────────────────────────────
const AR_NAME = {
  CLARITY: 'الوضوح', COMMAND: 'التمكّن', JUDGEMENT: 'التمييز',
  REASON: 'الاستدلال', BEARING: 'الحضور', REACH: 'الامتداد',
};
const nameFor = (c) => (RTL ? (AR_NAME[c.code] || c.name) : c.name);

const met = D.rows.filter((r) => r.count >= REMIT_MIN).length;
const zero = D.rows.filter((r) => r.count === 0);
const under = D.rows.filter((r) => r.count > 0 && r.count < REMIT_MIN);

const COPY = {
  en: {
    remit: `the remit — assessed at least ${REMIT_MIN}×`,
    axisNote: 'Level I assessments mapped to each competency',
    scaleNote: `${D.total} mappings across Level I · every one recorded as interim`,
    levelNote: `Levels ${D.levelsWithMappings + 1}–${D.totalLevels} carry no competency mapping yet`,
    zeroLabel: 'not assessed',
    zeroLegend: 'not assessed at Level I',
    title: 'Six competencies, and how often Level I actually assesses each',
    desc:
      `A radar chart on six axes, one for each of the College's competencies, plotting how many Level I `
      + `assessments are mapped to each. `
      + D.rows.map((r) => `${r.name} ${r.count}`).join(', ') + '. '
      + `A gold threshold ring is drawn at ${REMIT_MIN}, which is BASCE's own remit: each competency is to be `
      + `assessed multiple times across each level. ${met} of the six clear that ring. `
      + (under.length ? `${under.map((r) => r.name).join(' and ')} sits inside it, assessed once. ` : '')
      + (zero.length ? `${zero.map((r) => r.name).join(' and ')} sit on the hub, not assessed at Level I at all, `
        + `so the polygon collapses to the centre on those two axes. ` : '')
      + `All ${D.total} mappings are recorded as interim, because the board that would approve them has no `
      + `appointed members. Levels ${D.levelsWithMappings + 1} to ${D.totalLevels} carry no competency mapping yet.`,
  },
  ar: {
    remit: 'المطلوب — تقييم مرّتين على الأقل',
    axisNote: 'تقييمات المستوى الأول المرتبطة بكل كفاية',
    scaleNote: `${D.total} ارتباطًا في المستوى الأول · جميعها مسجَّلة مؤقتة`,
    levelNote: `المستويات من ${D.levelsWithMappings + 1} إلى ${D.totalLevels} بلا أي ارتباط بالكفايات بعد`,
    zeroLabel: 'غير مُقيَّمة',
    zeroLegend: 'غير مُقيَّمة في المستوى الأول',
    title: 'ست كفايات، وكم مرة يقيسها المستوى الأول فعلًا',
    desc:
      'رسم شعاعي على ستة محاور، محور لكل كفاية من كفايات الكلية، يبيّن عدد تقييمات المستوى الأول المرتبطة بكل منها. '
      + D.rows.map((r) => `${nameFor(r)} ${r.count}`).join('، ') + '. '
      + `وثمة حلقة ذهبية مرسومة عند ${REMIT_MIN}، وهي نص صلاحية مجلس المعايير نفسه: أن تُقاس كل كفاية مرات متعددة في كل مستوى. `
      + `${met} من الست تتجاوز تلك الحلقة. `
      + (under.length ? `و${under.map(nameFor).join(' و')} داخلها، إذ تُقاس مرة واحدة. ` : '')
      + (zero.length ? `و${zero.map(nameFor).join(' و')} على المركز، لا تُقاس في المستوى الأول أصلًا، `
        + 'فينهار المضلّع إلى المركز عند هذين المحورين. ' : '')
      + `وجميع الارتباطات الـ${D.total} مسجَّلة مؤقتة، لأن الهيئة التي تعتمدها بلا أعضاء معيَّنين. `
      + `والمستويات من ${D.levelsWithMappings + 1} إلى ${D.totalLevels} بلا أي ارتباط بالكفايات بعد.`,
  },
};
const t = COPY[LANG] || COPY.en;

// ── Geometry ──────────────────────────────────────────────────────────
const W = 900, H = 706;
const CX = W / 2, CY = 288;
const R0 = 34;                 // the hub: where nought sits
const RMAX = 218;
const MAXV = Math.max(...D.rows.map((r) => r.count));
// Rounded up to the next five so the outermost guide ring is a round
// number rather than whatever the largest value happens to be.
const SCALE_TOP = Math.ceil(MAXV / 5) * 5;
const radius = (v) => R0 + (v / SCALE_TOP) * (RMAX - R0);

// The hexagon is rotated a half-step so it sits FLAT-TOPPED, with no
// axis pointing straight down. Pointing an axis at the floor put the
// sixth label directly on top of the footnotes below the figure, and
// the rotation is a better fix than more height: it also frees the
// vertical line above the hub — now between two axes rather than under
// one — for the scale numbers, which had been sitting inside the filled
// polygon and fighting it.
//
// Anticlockwise under RTL, so the labels are read in the same order the
// language is.
const dir = RTL ? -1 : 1;
const angleAt = (i) =>
  -Math.PI / 2 + dir * ((i + 0.5) * 2 * Math.PI) / D.rows.length;
const pt = (i, v) => [CX + Math.cos(angleAt(i)) * radius(v), CY + Math.sin(angleAt(i)) * radius(v)];

const bits = [];

// ── Guide rings ───────────────────────────────────────────────────────
// Drawn as polygons rather than circles: a radar read against circular
// guides invites the eye to compare areas, and area is not the quantity
// here — the count is.
const ringPath = (v) => D.rows.map((_, i) => {
  const [x, y] = pt(i, v);
  return `${i ? 'L' : 'M'}${n(x)} ${n(y)}`;
}).join('') + 'Z';

for (let v = 5; v <= SCALE_TOP; v += 5) {
  bits.push(`<path d="${ringPath(v)}" fill="none" stroke="${INK.steel}" stroke-width="0.8"`
    + ` stroke-opacity="0.22"/>`);
  // Straight up from the hub, which the rotation above left empty.
  bits.push(text(String(v), {
    x: CX, y: CY - radius(v) * Math.cos(Math.PI / D.rows.length) + 3.5, anchor: 'middle', size: 9,
    fill: INK.steel, family: SANS, opacity: 0.85, ltr: true,
  }));
}

// The axes themselves.
D.rows.forEach((_, i) => {
  const [x, y] = pt(i, SCALE_TOP);
  bits.push(rule(CX, CY, x, y, { stroke: INK.steel, width: 0.8, opacity: 0.3 }));
});

// ── The remit ring ────────────────────────────────────────────────────
// The threshold the College set itself, drawn so a value can be seen to
// fall inside it.
bits.push(`<path d="${ringPath(REMIT_MIN)}" fill="none" stroke="${INK.goldRoyal}"`
  + ` stroke-width="1.4" stroke-dasharray="4 4" stroke-opacity="0.9"/>`);

// ── The polygon ───────────────────────────────────────────────────────
bits.push(`<path data-draw="1400" d="${D.rows.map((r, i) => {
  const [x, y] = pt(i, r.count);
  return `${i ? 'L' : 'M'}${n(x)} ${n(y)}`;
}).join('')}Z" fill="rgba(31,61,122,0.42)" stroke="${INK.goldSoft}" stroke-width="2"`
  + ` stroke-linejoin="round"/>`);

// ── Vertices and labels ───────────────────────────────────────────────
D.rows.forEach((r, i) => {
  const [vx, vy] = pt(i, r.count);
  const live = r.count > 0;
  const clears = r.count >= REMIT_MIN;

  bits.push(`<g data-pop="">`
    + (live
      ? `<circle cx="${n(vx)}" cy="${n(vy)}" r="6" fill="${INK.oxford}" stroke="${clears ? INK.goldRich : '#C9788A'}" stroke-width="1.8"/>`
        + `<circle cx="${n(vx)}" cy="${n(vy)}" r="2.2" fill="${clears ? INK.goldRich : '#C9788A'}"/>`
      // A competency assessed nought times is drawn as an empty seat on
      // the hub, the same convention the authority chain uses for a post
      // nobody holds.
      : `<circle cx="${n(vx)}" cy="${n(vy)}" r="7" fill="none" stroke="${INK.burgundy}" stroke-width="1.4" stroke-dasharray="3 3"/>`)
    + `</g>`);

  // Labels sit outboard of the axis, anchored by which side of the
  // circle they are on so they read away from the figure rather than
  // across it.
  const a = angleAt(i);
  const lx = CX + Math.cos(a) * (RMAX + 30);
  const ly = CY + Math.sin(a) * (RMAX + 30);
  const cos = Math.cos(a);
  const anchor = cos < -0.25 ? 'end' : cos > 0.25 ? 'start' : 'middle';
  const stacked = anchor === 'middle';

  bits.push(text(nameFor(r), {
    x: lx, y: ly + (stacked ? (Math.sin(a) < 0 ? -6 : 14) : -1), anchor, size: 15, weight: 700,
    fill: live ? INK.goldChampagne : '#C9788A', family: DISPLAY, pop: true,
  }));
  bits.push(text(live ? `${r.count}×` : `0 — ${t.zeroLabel}`, {
    x: lx, y: ly + (stacked ? (Math.sin(a) < 0 ? 10 : 30) : 17), anchor, size: 11.5, weight: 700,
    fill: live ? (clears ? INK.cerulean : '#C9788A') : '#C9788A', family: SANS,
    ltr: live, pop: true,
  }));
});

// ── Legend ────────────────────────────────────────────────────────────
// The remit ring sits at a radius of two on a scale that runs to twenty,
// which puts it deep inside the filled polygon. Labelled in place it
// landed across the polygon and the Judgement vertex, and no amount of
// nudging fixes a label whose anchor point is under the figure. So both
// conventions are explained below the drawing instead, each beside the
// mark it names.
{
  const y = H - 132;
  const items = [
    { swatch: 'ring', stroke: INK.goldRoyal, label: t.remit },
    { swatch: 'seat', stroke: INK.burgundy, label: t.zeroLegend },
  ];
  // Laid out from the centre so the pair reads as one row in both
  // directions rather than being pinned to a margin that flips.
  const GAP = 46;
  const widths = items.map((it) => it.label.length * 5.6 + 26);
  const rowW = widths.reduce((a, b) => a + b, 0) + GAP;
  let cursor = CX - rowW / 2;
  items.forEach((it, i) => {
    const sx = RTL ? W - cursor - 14 : cursor + 14;
    if (it.swatch === 'ring') {
      bits.push(`<path d="M${n(sx - 7)} ${n(y - 4)}l7 -6 7 6 -7 6Z" fill="none" stroke="${it.stroke}"`
        + ` stroke-width="1.4" stroke-dasharray="3 3" data-pop=""/>`);
    } else {
      bits.push(`<circle cx="${n(sx)}" cy="${n(y - 4)}" r="6.5" fill="none" stroke="${it.stroke}"`
        + ` stroke-width="1.4" stroke-dasharray="3 3" data-pop=""/>`);
    }
    bits.push(text(it.label, {
      x: RTL ? sx - 14 : sx + 14, y, anchor: RTL ? 'end' : 'start', size: 10.5, weight: 700,
      fill: it.stroke === INK.goldRoyal ? INK.goldSoft : '#C9788A', family: SANS, pop: true,
    }));
    cursor += widths[i] + GAP;
  });
}

// ── Footnotes ─────────────────────────────────────────────────────────
{
  const y = H - 72;
  bits.push(rule(120, y - 22, W - 120, y - 22,
    { stroke: INK.goldRoyal, width: 1, opacity: 0.26, dash: '1 7' }));
  bits.push(text(t.axisNote, {
    x: CX, y, anchor: 'middle', size: 12.5, fill: INK.slateText, family: SANS, pop: true,
  }));
  bits.push(text(t.scaleNote, {
    x: CX, y: y + 20, anchor: 'middle', size: 11, fill: INK.steel, family: SANS, pop: true,
  }));
  bits.push(text(t.levelNote, {
    x: CX, y: y + 38, anchor: 'middle', size: 11, fill: '#C9788A', family: SANS, pop: true,
  }));
}

const svg = plate({
  id: 'competency-wheel', lang: LANG, width: W, height: H,
  title: t.title, desc: t.desc,
  body: bits.map((s) => '  ' + s).join('\n'),
});

mkdirSync(path.dirname(OUT), { recursive: true });
writeFileSync(OUT, svg);
console.log(`Wrote ${path.relative(ROOT, OUT)} — ${(svg.length / 1024).toFixed(1)} KB`);
console.log(`  ${D.rows.map((r) => `${r.code} ${r.count}`).join(' · ')}`);
