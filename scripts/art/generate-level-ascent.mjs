#!/usr/bin/env node
// Generates assets/art/level-ascent-N.svg (+ .ar) for N in 1..6 — the
// eighth living diagram (docs/digital-institution-masterplan.md, Layer 3).
//
// WHAT IT ARGUES
//
// Each level page makes a claim that reads as a contradiction until you
// see it: "Level N is a qualification, not a stage of one" — on a page
// that also belongs to a six-level pathway. Both are true. The pathway
// is real and each rung of it is a finished award with its own title,
// its own post-nominal and its own CEFR band, and a learner who stops
// after one holds something rather than having abandoned something.
//
// Prose has to say that twice, once for each half. The drawing says it
// once: six rungs rising, every one of them marked with an award, and
// the rung this page is about struck in gold. Nothing about the drawing
// suggests the lower rungs are incomplete or the higher ones are owed.
//
// WHAT IT DELIBERATELY DOES NOT SHOW
//
// Not a progress bar. A reader arriving at Level IV has not completed
// Levels I to III, and a drawing that shades the lower rungs as
// "achieved" would tell every visitor a small lie about themselves.
// Every rung is drawn at the same weight; only the one the page is
// about is marked, and it is marked as THIS PAGE rather than as
// attained.
//
// Not a conferral record either. Awards have been conferred at Level I
// and Level II and at no other level (data/standing.json), which is a
// fact about the College's history and not a property of the pathway.
// Putting it here would date the drawing to a month and would invite
// the reading that the upper awards are unavailable, which is false.
// It belongs in prose, where it already is.
//
// THE NUMBERS AND THE NAMES
//
// Roman numeral, level name, CEFR band, award title and post-nominal
// are all read from the database — programme_levels and
// award_definitions — so a level renamed in the record is renamed in
// six drawings by re-running this. Nothing is typed.
//
//   node scripts/art/generate-level-ascent.mjs [ar]
//
// Writes all six levels in one pass; the level is not an argument
// because six files that must stay consistent are better produced by
// one loop than by six invocations somebody has to remember.

import { writeFileSync, mkdirSync, readFileSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { DatabaseSync } from 'node:sqlite';
import { INK, SERIF, sansFor, isRtl, n, text, drawn, rule, node, plate } from './lib/plate.mjs';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..');
const LANG = (process.argv[2] || 'en').toLowerCase();
const RTL = isRtl(LANG);
const SANS = sansFor(LANG);
const DISPLAY = RTL ? SANS : SERIF;

// ── The record ────────────────────────────────────────────────────────
// programme_levels and award_definitions are both seeded inside
// schema.sql, so the schema alone is the whole source here.
export function readLevels() {
  const db = new DatabaseSync(':memory:');
  db.exec(readFileSync(path.join(ROOT, 'sql/schema.sql'), 'utf8'));
  const rows = db.prepare(
    `SELECT l.id, l.roman, l.name, l.cefr,
            a.official_title, a.post_nominal, a.standing
       FROM programme_levels l
       LEFT JOIN award_definitions a ON a.level_id = l.id
      ORDER BY l.id`,
  ).all();
  db.close();
  return rows;
}

const LEVELS = readLevels();
if (LEVELS.length !== 6) {
  throw new Error(`Expected six levels in the record, read ${LEVELS.length}. The ascent is drawn `
    + 'as six rungs and its whole argument is that the pathway is exactly this long.');
}
const missing = LEVELS.filter((l) => !l.official_title);
if (missing.length) {
  throw new Error(`Levels ${missing.map((l) => l.roman).join(', ')} have no award definition. `
    + 'The drawing asserts that every rung is a finished award; a rung with no award would make '
    + 'that assertion false, so the generator refuses.');
}

// Arabic level names and award titles are not in the database — the
// record holds the English register, which is where the certificate
// wording lives. The Arabic edition names the levels in Arabic and
// keeps the award title in its official English form, isolated, exactly
// as the Arabic pages already do: an award title is a proper name and
// translating it would produce a credential nobody holds.
const AR_NAME = {
  I: 'برنامج التأسيس',
  II: 'البرنامج التمهيدي',
  III: 'البرنامج المتوسط',
  IV: 'البرنامج فوق المتوسط',
  V: 'البرنامج المتقدم',
  VI: 'برنامج الإتقان',
};

const COPY = {
  en: {
    eyebrow: 'THE ASCENT',
    thisPage: 'THIS PAGE',
    each: 'Every rung is a complete award, with its own entry standard, its own exit standard and its own title.',
    awardLabel: 'THE AWARD CONFERRED',
    level: 'Level',
  },
  ar: {
    eyebrow: 'السُّلَّم',
    thisPage: 'هذه الصفحة',
    each: 'كل درجة شهادة كاملة، لها معيار دخولها ومعيار خروجها وعنوانها الخاص.',
    awardLabel: 'الشهادة الممنوحة',
    level: 'المستوى',
  },
};
const t = COPY[LANG] || COPY.en;

// ── Geometry ──────────────────────────────────────────────────────────
const W = 900, H = 560;
const M = { lead: 92, trail: 92 };
const BASE = 396;          // the lowest rung
const STEP_Y = 42;         // how far each rung rises above the last
const SPAN = W - M.lead - M.trail;
const PITCH = SPAN / (LEVELS.length - 1);

// Mirrored coordinates carry the right-to-left layout, never
// text-anchor — see the note in lib/plate.mjs.
const rungX = (i) => (RTL ? W - M.trail - i * PITCH : M.lead + i * PITCH);
const rungY = (i) => BASE - i * STEP_Y;

function draw(current) {
  const bits = [];
  const cur = LEVELS[current];
  const name = LANG === 'ar' ? (AR_NAME[cur.roman] || cur.name) : cur.name;

  // --- The heading block, in the corner the ascent leaves empty -------
  {
    const x0 = RTL ? W - M.trail : M.lead;
    const anchor = RTL ? 'end' : 'start';
    bits.push(text(t.eyebrow, {
      x: x0, y: 50, anchor, size: 10.5, weight: 700,
      tracking: RTL ? 0 : 2.4, fill: INK.cerulean, family: SANS,
    }));
    bits.push(text(`${t.thisPage} · ${t.level} ${cur.roman}`, {
      x: x0, y: 74, anchor, size: 11, weight: 700,
      tracking: RTL ? 0 : 1.6, fill: INK.goldSoft, family: SANS,
    }));
    bits.push(text(name, {
      x: x0, y: 106, anchor, size: 25, weight: 700,
      fill: INK.goldChampagne, family: DISPLAY, pop: true,
    }));
    bits.push(text(t.awardLabel, {
      x: x0, y: 136, anchor, size: 9.5, weight: 700,
      tracking: RTL ? 0 : 2, fill: INK.cerulean, family: SANS, pop: true,
    }));
    // The certificate wording, kept in its official English form in both
    // editions — an award title is a proper name.
    bits.push(text(cur.official_title, {
      x: x0, y: 158, anchor, size: 14, fill: INK.slateText, family: SANS, ltr: true, pop: true,
    }));
  }

  // --- The rising line the rungs sit on -------------------------------
  {
    const d = LEVELS.map((_, i) => `${i ? 'L' : 'M'}${n(rungX(i))} ${n(rungY(i))}`).join('');
    bits.push(drawn(d, { stroke: INK.goldRoyal, width: 1.4, ms: 1500, opacity: 0.55 }));
  }

  // --- One rung per level --------------------------------------------
  LEVELS.forEach((lv, i) => {
    const x = rungX(i), y = rungY(i);
    const here = i === current;

    // A short tread under each node, so the line reads as a stair rather
    // than as a trend.
    bits.push(rule(x - 26, y, x + 26, y, {
      stroke: here ? INK.goldRich : INK.steel, width: here ? 2 : 1.1,
      opacity: here ? 0.95 : 0.5,
    }));

    if (here) {
      // Struck: a ring around the marker, the one thing on the drawing
      // that says which rung this page is about.
      bits.push(`<g data-pop="">`
        + `<circle cx="${n(x)}" cy="${n(y)}" r="17" fill="none" stroke="${INK.goldRich}"`
        + ` stroke-width="1.3" stroke-opacity="0.75"/></g>`);
    }
    bits.push(node(x, y, {
      r: here ? 9 : 6,
      stroke: here ? INK.goldRich : INK.steel,
      core: here ? INK.goldRich : null,
      width: here ? 1.8 : 1.3,
    }));

    // Roman numeral, CEFR band and post-nominal, stacked under the rung.
    bits.push(text(lv.roman, {
      x, y: y + 36, anchor: 'middle', size: here ? 21 : 17, weight: 700,
      fill: here ? INK.goldChampagne : INK.slateText, family: DISPLAY, ltr: true, pop: true,
    }));
    bits.push(text(lv.cefr, {
      x, y: y + 54, anchor: 'middle', size: 11, weight: 700, tracking: 1.2,
      fill: here ? INK.goldSoft : INK.steel, family: SANS, ltr: true, pop: true,
    }));
    bits.push(text(lv.post_nominal, {
      x, y: y + 71, anchor: 'middle', size: 9.5, weight: 700,
      fill: INK.steel, family: SANS, ltr: true, opacity: here ? 0.95 : 0.7, pop: true,
    }));
  });

  // --- The sentence that stops it being read as a progress bar --------
  {
    const x0 = RTL ? W - M.trail : M.lead;
    const anchor = RTL ? 'end' : 'start';
    bits.push(rule(M.lead - 24, H - 70, W - M.trail + 24, H - 70, {
      stroke: INK.steel, width: 0.9, opacity: 0.28,
    }));
    bits.push(text(t.each, {
      x: x0, y: H - 42, anchor, size: 12, fill: INK.slateText, family: SANS, pop: true,
    }));
  }

  const others = LEVELS.filter((_, i) => i !== current)
    .map((l) => `${l.roman} at ${l.cefr}`).join(', ');
  const othersAr = LEVELS.filter((_, i) => i !== current)
    .map((l) => `${l.roman} عند ${l.cefr}`).join('، ');

  const desc = LANG === 'ar'
    ? `سُلَّم من ست درجات ترتفع درجةً درجة. كل درجة مستوى من مستويات البرنامج، `
      + `وعليها رقمها الروماني، وسِمَتها في الإطار الأوروبي المرجعي، ورمز شهادتها. `
      + `الدرجة المحدَّدة بحلقة ذهبية هي المستوى ${cur.roman} عند ${cur.cefr}، وهو موضوع هذه الصفحة، `
      + `وشهادته ${cur.official_title}. والدرجات الأخرى هي ${othersAr}. `
      + `والدرجات كلها مرسومة بالثقل نفسه: هذه ليست شريط تقدُّم، ولا تقول عن القارئ شيئًا. `
      + `كل درجة شهادة كاملة لها معيار دخولها ومعيار خروجها وعنوانها الخاص، `
      + `فمن وقف عند واحدة يحمل شهادة تامة لا مسارًا مهجورًا.`
    : `A stair of six rungs, each one higher than the last. Every rung is a level of the `
      + `programme, marked with its roman numeral, its CEFR band and the post-nominal of its `
      + `award. The rung circled in gold is Level ${cur.roman} at ${cur.cefr}, which is what this `
      + `page is about, and its award is the ${cur.official_title}. The other rungs are ${others}. `
      + `Every rung is drawn at the same weight: this is not a progress bar and it says nothing `
      + `about the reader. Each rung is a complete award with its own entry standard, its own exit `
      + `standard and its own title, so a learner who stops at one holds a finished qualification `
      + `rather than an abandoned course.`;

  const title = LANG === 'ar'
    ? `المستوى ${cur.roman} في سُلَّم البرنامج — وكل درجة شهادة كاملة`
    : `Level ${cur.roman} on the ascent — and every rung a complete award`;

  return plate({
    id: `level-ascent-${cur.id}`, lang: LANG, width: W, height: H,
    title, desc, body: bits.map((s) => '  ' + s).join('\n'),
  });
}

mkdirSync(path.join(ROOT, 'assets/art'), { recursive: true });
for (let i = 0; i < LEVELS.length; i += 1) {
  const out = path.join(ROOT, `assets/art/level-ascent-${LEVELS[i].id}${RTL ? '.ar' : ''}.svg`);
  const svg = draw(i);
  writeFileSync(out, svg);
  console.log(`Wrote ${path.relative(ROOT, out)} — ${(svg.length / 1024).toFixed(1)} KB`);
}
