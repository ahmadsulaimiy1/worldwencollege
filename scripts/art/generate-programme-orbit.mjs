#!/usr/bin/env node
// Generates assets/art/programme-orbit.svg (+ .ar) — the eleventh
// living diagram, and the first drawn in relief rather than in line.
//
// ─────────────────────────────────────────────────────────────────────
// WHAT IT ARGUES
// ─────────────────────────────────────────────────────────────────────
// That the IEFC is ONE programme with six complete awards in it, and
// not six courses sold as a series.
//
// Every other drawing of a curriculum on the internet is a ladder or an
// arrow, and both of those say the same wrong thing: that the value is
// at the far end and everything before it is preparation. A learner who
// finishes Level II and stops has, on a ladder, failed to arrive.
//
// A ring says the true thing instead. The programme is the centre; the
// six levels sit ON it, at equal radius, each one a struck medallion of
// the same size and the same metal. Nothing is downstream of anything.
// The order is real — the ring is walked clockwise from twelve — but no
// position on it is worth less than another.
//
// ─────────────────────────────────────────────────────────────────────
// WHY IT IS DRAWN IN RELIEF AND THE REGISTERS ARE NOT
// ─────────────────────────────────────────────────────────────────────
// scripts/art/ draws documents: the evidence column, the decisions
// docket, the provenance table. Those are records, and a record is
// drawn in line because that is what a record looks like — hairline,
// ruled, unglamorous, checkable.
//
// This is not a record. It is the shape of the thing being offered, on
// the page a reader reaches before deciding whether to spend a year and
// three thousand dollars, and a hairline schematic of it reads as a
// technical appendix to a decision nobody has made yet. lib/relief.mjs
// carries the material — struck gold, one light source, real cast
// shadow — in the same INK palette every other plate uses, so the two
// registers are the same house at different volumes rather than two
// houses.
//
// ─────────────────────────────────────────────────────────────────────
// EVERYTHING ON IT IS READ
// ─────────────────────────────────────────────────────────────────────
// Roman numeral, level name, CEFR band and award post-nominal come from
// programme_levels and award_definitions. The totals in the hub come
// from counting the curriculum itself. A figure typed into this file
// would be a figure that could disagree with the page beside it, which
// is the whole reason data/standing.json exists.
//
//   node scripts/art/generate-programme-orbit.mjs [ar]

import { writeFileSync, mkdirSync, readFileSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { DatabaseSync } from 'node:sqlite';
import { INK, SERIF, sansFor, isRtl, n, text, paragraph, plate } from './lib/plate.mjs';
import { reliefDefs, reliefType, disc, tablet, orbit, around } from './lib/relief.mjs';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..');
const LANG = (process.argv[2] || 'en').toLowerCase();
const RTL = isRtl(LANG);
const SANS = sansFor(LANG);
const DISPLAY = RTL ? SANS : SERIF;
const ID = 'po';

// ── the record ───────────────────────────────────────────────────────
function read() {
  const db = new DatabaseSync(':memory:');
  db.exec(readFileSync(path.join(ROOT, 'sql/schema.sql'), 'utf8'));
  for (let i = 1; i <= 6; i += 1) {
    db.exec(readFileSync(path.join(ROOT, `sql/seed-curriculum-level-${i}.sql`), 'utf8'));
  }
  const levels = db.prepare(
    `SELECT l.id, l.roman, l.name, l.cefr, a.post_nominal
       FROM programme_levels l
       LEFT JOIN award_definitions a ON a.level_id = l.id
      ORDER BY l.id`,
  ).all();
  const modules = db.prepare('SELECT COUNT(*) AS n FROM units').get().n;
  const items = db.prepare('SELECT COUNT(*) AS n FROM learning_items').get().n;
  db.close();
  return { levels, modules, items };
}

const { levels, modules, items } = read();
if (levels.length !== 6) {
  throw new Error(`Expected six levels, read ${levels.length}. The ring is drawn with six `
    + 'stations and its argument is that the programme is exactly this shape.');
}
const noAward = levels.filter((l) => !l.post_nominal);
if (noAward.length) {
  throw new Error(`Levels ${noAward.map((l) => l.roman).join(', ')} carry no award post-nominal. `
    + 'Every station on this ring is drawn as a conferred award; a station without one would '
    + 'make the drawing assert something the record does not hold.');
}

const AR_NAME = {
  I: 'التأسيس', II: 'التمهيدي', III: 'المتوسط',
  IV: 'فوق المتوسط', V: 'المتقدم', VI: 'الإتقان',
};

const COPY = {
  en: {
    eyebrow: 'THE INTERNATIONAL ENGLISH FLUENCY COURSE',
    hubTop: 'ONE PROGRAMME',
    hubMid: 'SIX AWARDS',
    hubFoot: 'A1 → C2',
    modulesLabel: 'MODULES',
    levelsLabel: 'LEVELS',
    cefrLabel: 'CEFR',
    note: 'Six complete awards on one ring. Each carries its own entry standard, its own exit '
      + 'standard, its own title and its own post-nominal — a learner who stops at any station '
      + 'holds a qualification rather than an unfinished one.',
    order: 'Read clockwise from the top. The order is the order of study; the size is the same '
      + 'at every station because no award on this ring is a stepping stone to another.',
    level: 'LEVEL',
  },
  ar: {
    eyebrow: 'برنامج الطلاقة الإنجليزية الدولي',
    hubTop: 'برنامجٌ واحد',
    hubMid: 'ستُّ شهادات',
    hubFoot: 'A1 → C2',
    modulesLabel: 'وحدة',
    levelsLabel: 'مستويات',
    cefrLabel: 'الإطار الأوروبي',
    note: 'ستُّ شهادات كاملة على حلقة واحدة. لكلٍّ منها شرط دخولها وشرط خروجها وعنوانها ولقبها '
      + 'اللاحق — ومن وقف عند أي محطة حمل مؤهَّلًا تامًّا لا ناقصًا.',
    order: 'تُقرأ مع عقارب الساعة ابتداءً من الأعلى. الترتيب ترتيب الدراسة، والحجم واحد في كل '
      + 'محطة لأن لا شهادة على هذه الحلقة درجةٌ إلى غيرها.',
    level: 'المستوى',
  },
};
const L = COPY[RTL ? 'ar' : 'en'];

// ── geometry ─────────────────────────────────────────────────────────
// 980 × 720 rather than a square: the tablets sit outside the ring on
// the horizontal, so the drawing is wider than it is tall, and a square
// viewBox would put 130px of nothing above and below on every render.
// 980 wide, 820 tall. The height is set by the two stations on the
// VERTICAL, not by the ring: their labels are pushed outward along the
// radius like every other, which puts them 94px above and below the
// medallion, and the first cut of this plate at H=720 drove the top
// label straight through the eyebrow and the bottom one through the
// closing rule. Found by rendering it, which is the only way it could
// have been found — the geometry is correct and the collision is a
// property of what else is on the plate.
const W = 980;
const H = 790;
const CX = W / 2;
const CY = 396;
const RING = 196;      // radius the medallions sit on
const DISC_R = 52;     // 104px medallions — the same 106px the page's
                       // own .badge-dome--lg uses, so the plate and the
                       // cards around it are one system.

const stations = around(CX, CY, RING, 6);

// A label sits OUTSIDE its medallion, pushed along the radius. The two
// on the vertical get more clearance than the four on the diagonals
// because a horizontal label above a disc collides with the ring and a
// horizontal label beside one does not.
function labelFor(st, level) {
  const dx = st.x - CX;
  const dy = st.y - CY;
  const len = Math.hypot(dx, dy) || 1;
  const push = DISC_R + (Math.abs(dx) < 6 ? 42 : 34);
  const lx = st.x + (dx / len) * push;
  const ly = st.y + (dy / len) * push;
  // Anchor away from the centre: a label to the left of the ring is
  // right-anchored so it grows outward rather than back across the
  // drawing. On the vertical, centre.
  const anchor = Math.abs(dx) < 6 ? 'middle' : (dx > 0 ? 'start' : 'end');
  const name = RTL ? AR_NAME[level.roman] : level.name;
  return `${text(`${level.cefr}`, {
    x: st.x, y: st.y + DISC_R + 26, anchor: 'middle', family: SANS, size: 15, weight: 700,
    cls: 't-mini lbl-narrow', fill: INK.goldSoft, tracking: 0.08, lang: 'en',
  })}
${text(name, {
    x: lx, y: ly - 2, anchor, family: DISPLAY, size: 19, weight: 600, cls: 't-lbl lbl-wide', fill: INK.goldChampagne, lang: LANG,
  })}
${text(`${level.cefr} · ${level.post_nominal}`, {
    x: lx, y: ly + 19, anchor, family: SANS, size: 12.5, weight: 600, cls: 't-sub lbl-wide',
    fill: INK.cerulean, tracking: 0.1, lang: LANG,
  })}`;
}

const body = `${reliefDefs({ id: ID })}
${reliefType()}
  <rect width="${W}" height="${H}" fill="url(#${ID}-deep)"/>

  <!-- the eyebrow -->
${text(L.eyebrow, {
    x: CX, y: 34, anchor: 'middle', family: SANS, size: 12.5, weight: 700, cls: 't-eyeb',
    fill: INK.goldRoyal, tracking: 0.22, lang: LANG,
  })}

  <!-- the ring the stations stand on -->
${orbit(CX, CY, RING, { id: ID, width: 18 })}

  <!-- the hub: what the six add up to -->
    <circle cx="${CX}" cy="${CY}" r="128" fill="url(#${ID}-halo)"/>
${disc(CX, CY, 112, { id: ID, tone: 'deep', halo: false })}
    <circle cx="${CX}" cy="${CY}" r="99" fill="none" stroke="${INK.goldRoyal}"
            stroke-opacity="0.35" stroke-width="0.9"/>
${text(L.hubTop, {
    x: CX, y: CY - 44, anchor: 'middle', family: SANS, size: 12, weight: 700,
    fill: INK.goldRoyal, tracking: 0.2, lang: LANG,
  })}
${text(L.hubMid, {
    x: CX, y: CY - 6, anchor: 'middle', family: DISPLAY, size: 30, weight: 700, cls: 't-lbl',
    fill: INK.goldChampagne, lang: LANG,
  })}
    <path d="M ${CX - 46} ${CY + 14} H ${CX + 46}" stroke="${INK.goldRoyal}"
          stroke-opacity="0.5" stroke-width="0.9"/>
${text(String(modules), {
    x: CX - 40, y: CY + 46, anchor: 'middle', family: DISPLAY, size: 25, weight: 700,
    fill: INK.goldSoft, lang: LANG,
  })}
${text(L.modulesLabel, {
    x: CX - 40, y: CY + 64, anchor: 'middle', family: SANS, size: 9.5, weight: 700,
    fill: INK.steel, tracking: 0.16, lang: LANG,
  })}
${text(L.hubFoot, {
    x: CX + 40, y: CY + 46, anchor: 'middle', family: DISPLAY, size: 25, weight: 700,
    fill: INK.goldSoft, lang: LANG,
  })}
${text(L.cefrLabel, {
    x: CX + 40, y: CY + 64, anchor: 'middle', family: SANS, size: 9.5, weight: 700,
    fill: INK.steel, tracking: 0.16, lang: LANG,
  })}

  <!-- six struck stations -->
${stations.map((st, i) => {
    const level = levels[i];
    return `${disc(st.x, st.y, DISC_R, { id: ID })}
${text(level.roman, {
      x: st.x, y: st.y + 11, anchor: 'middle', family: DISPLAY, size: 32, weight: 700, cls: 't-num',
      fill: INK.oxford, lang: 'en',
    })}
${labelFor(st, level)}`;
  }).join('\n')}

  <!-- the reading -->
    <path d="M 130 ${H - 62} H ${W - 130}" stroke="${INK.goldRoyal}" stroke-opacity="0.3" stroke-width="0.9"/>
${text(L.hubTop, {
    x: CX, y: H - 34, anchor: 'middle', family: SANS, size: 12, weight: 700, cls: 't-eyeb',
    fill: INK.bronze, tracking: 0.2, lang: LANG,
  })}`;

const svg = plate({
  id: 'programme-orbit',
  lang: LANG,
  width: W,
  height: H,
  title: RTL
    ? 'حلقة برنامج الطلاقة الإنجليزية الدولي: ستة مستويات على مدار واحد'
    : 'The IEFC ring: six levels on one orbit',
  desc: `${L.note} ${L.order} `
    + (RTL
      ? `المحطات الست بترتيب الدراسة: ${levels.map((l) => `${l.roman} ${AR_NAME[l.roman]} (${l.cefr}، ${l.post_nominal})`).join('؛ ')}. `
        + `وفي المركز مجموع ما تحمله الحلقة: ${modules} وحدة دراسية و${items} عنصر تعلّم عبر المستويات الستة، من A1 إلى C2.`
      : `The six stations in the order of study: ${levels.map((l) => `${l.roman} ${l.name} (${l.cefr}, ${l.post_nominal})`).join('; ')}. `
        + `At the centre is what the ring holds in total: ${modules} modules and ${items} learning items across the six levels, from A1 to C2.`),
  body,
});

const out = path.join(ROOT, 'assets/art');
mkdirSync(out, { recursive: true });
const file = path.join(out, `programme-orbit${RTL ? '.ar' : ''}.svg`);
writeFileSync(file, svg);
console.log(`programme-orbit${RTL ? '.ar' : ''}.svg — 6 stations, ${modules} modules, ${items} learning items`);
