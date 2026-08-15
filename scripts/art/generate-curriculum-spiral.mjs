#!/usr/bin/env node
// Generates assets/art/curriculum-spiral.svg — the first of the house
// "living diagrams" (see docs/digital-institution-masterplan.md,
// Layer 3).
//
// WHAT IT SHOWS
//
// The IEFC as one continuous line rather than six boxes. A learner
// does not finish A1 and start A2; the same language systems are
// revisited at greater radius each time, which is what a spiral
// curriculum means and what a row of cards cannot say. Each of the six
// turns carries its level, its CEFR band, its modules and its credits.
//
// WHY GENERATED
//
// An Archimedean spiral drawn by hand is a series of guesses that look
// almost right, and "almost right" is precisely what the eye catches
// on a diagram this large. Sampling r = a + b*theta gives turns with
// exactly equal spacing, which is the only reason the six bands read
// as six equal stages.
//
// The output carries data-draw on every stroked path and data-pop on
// every node and label, which is the contract js/atelier.js animates
// against — the diagram draws itself once, on entry.
//
//   node scripts/art/generate-curriculum-spiral.mjs
//
// Deterministic: same constants in, byte-identical file out.

import { writeFileSync, mkdirSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
// This drawing predates lib/plate.mjs and hand-rolled its own root
// element, which is how it was the one plate that missed the
// direction fix — the shared wrapper got it and this file did not.
// It now goes through the same wrapper as the other three, so the next
// change to the contract cannot reach three drawings out of four.
import { plate, bidi } from './lib/plate.mjs';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..');
// Two editions. The Arabic one is not an afterthought: the Gulf is the
// primary audience, and a diagram is the one thing on a page that a
// reader cannot skim past in a second language.
const LANG = (process.argv[2] || 'en').toLowerCase();
const RTL = LANG === 'ar';
const OUT = path.join(ROOT, `assets/art/curriculum-spiral${RTL ? '.ar' : ''}.svg`);

const W = 900, H = 900;
const CX = W / 2, CY = H / 2;

const NAMES = {
  en: ['Foundation', 'Elementary', 'Intermediate', 'Upper Intermediate', 'Advanced', 'Mastery'],
  ar: ['التأسيس', 'الابتدائي', 'المتوسط', 'المتوسط المتقدم', 'المتقدم', 'الإتقان'],
};
const ROMAN = ['I', 'II', 'III', 'IV', 'V', 'VI'];
const CEFR = ['A1', 'A2', 'B1', 'B2', 'C1', 'C2'];
const LEVELS = ROMAN.map((roman, i) => ({
  roman, cefr: CEFR[i], name: (NAMES[LANG] || NAMES.en)[i],
}));

const SKILL_LABELS = {
  en: ['Listening', 'Reading', 'Speaking', 'Writing'],
  ar: ['الاستماع', 'القراءة', 'التحدث', 'الكتابة'],
};
const CENTRE = {
  en: ['FIRST', 'WORD'],
  ar: ['الكلمة', 'الأولى'],
};
const TITLE = {
  en: 'The IEFC curriculum spiral',
  ar: 'حلزون منهج برنامج الطلاقة الدولي',
};
const DESC = {
  en: 'One continuous pathway of six turns. Level I Foundation (A1), II Elementary (A2), III Intermediate (B1), IV Upper Intermediate (B2), V Advanced (C1), and VI Mastery (C2). Listening, reading, speaking and writing run through every turn rather than being taught once.',
  ar: 'مسار واحد متصل من ست لفّات: المستوى الأول التأسيس (A1)، والثاني الابتدائي (A2)، والثالث المتوسط (B1)، والرابع المتوسط المتقدم (B2)، والخامس المتقدم (C1)، والسادس الإتقان (C2). الاستماع والقراءة والتحدث والكتابة تمتد عبر كل لفّة بدل أن تُدرَّس مرة واحدة.',
};
// Arabic renders in the site's Arabic stack; Latin runs (CEFR codes,
// roman numerals) keep the serif they have in every other context.
const SANS = RTL ? "Cairo, Inter, sans-serif" : "Inter, sans-serif";

// r = a + b*theta. Six full turns, ending just inside the frame.
const TURNS = LEVELS.length;
const R0 = 58;              // where the spiral leaves the centre
const R1 = 392;             // outermost radius
const B = (R1 - R0) / (TURNS * 2 * Math.PI);
// Start at -90deg so level I begins at the top, where a reader starts.
const PHASE = -Math.PI / 2;

const pt = (theta) => {
  const r = R0 + B * theta;
  return [CX + r * Math.cos(theta + PHASE), CY + r * Math.sin(theta + PHASE)];
};

const fmt = (n) => n.toFixed(1);

// One path per level: the turn of spiral that level occupies. Split
// per level (rather than one long path) so each draws in sequence and
// each can carry its own colour weight.
function turnPath(i) {
  const from = i * 2 * Math.PI;
  const to = (i + 1) * 2 * Math.PI;
  const steps = 150;
  const pts = [];
  for (let s = 0; s <= steps; s++) {
    pts.push(pt(from + ((to - from) * s) / steps));
  }
  return 'M' + pts.map(([x, y]) => `${fmt(x)} ${fmt(y)}`).join('L');
}

// WHERE THE NODES SIT.
//
// The obvious placement — the end of each turn — puts all six at the
// same angle, because a turn is 360 degrees. They stack into one
// vertical column and their labels overlap each other and the spiral.
//
// So each level is marked part-way round its own turn, advanced by an
// even share of a revolution per level. The markers then fan around
// the whole figure while still climbing outward, which is also the
// truer reading: a level is a stretch of the path, not the point at
// which the path happens to cross the top of the page.
const nodeAt = (i) => pt(i * 2 * Math.PI + (2 * Math.PI * (i + 1)) / (TURNS + 1));

// Radial hairlines from the centre, marking the four skills that run
// through every level. Drawn under the spiral.
const SKILLS = SKILL_LABELS[LANG] || SKILL_LABELS.en;
const spokes = SKILLS.map((label, i) => {
  const a = PHASE + (i / SKILLS.length) * 2 * Math.PI + Math.PI / 4;
  const x1 = CX + Math.cos(a) * (R0 - 16), y1 = CY + Math.sin(a) * (R0 - 16);
  const x2 = CX + Math.cos(a) * (R1 + 34), y2 = CY + Math.sin(a) * (R1 + 34);
  const lx = CX + Math.cos(a) * (R1 + 52), ly = CY + Math.sin(a) * (R1 + 52);
  return { d: `M${fmt(x1)} ${fmt(y1)}L${fmt(x2)} ${fmt(y2)}`, label, lx, ly, a };
});

const turns = LEVELS.map((lv, i) => {
  const opacity = (0.42 + (i / (TURNS - 1)) * 0.58).toFixed(2);
  return `    <path data-draw="1500" d="${turnPath(i)}" stroke="#C7A24A" stroke-opacity="${opacity}" stroke-width="${(1.3 + i * 0.28).toFixed(2)}"/>`;
}).join('\n');

const nodes = LEVELS.map((lv, i) => {
  const [x, y] = nodeAt(i);
  // Labels sit outboard of the node, flipped so they never read upside
  // down on the left-hand side of the figure.
  const onLeft = x < CX;
  const dx = onLeft ? -18 : 18;
  const anchor = onLeft ? 'end' : 'start';
  return `    <g data-pop="">
      <circle cx="${fmt(x)}" cy="${fmt(y)}" r="7.5" fill="#0A1428" stroke="#D4AF37" stroke-width="1.6"/>
      <circle cx="${fmt(x)}" cy="${fmt(y)}" r="2.6" fill="#D4AF37"/>
      <text x="${fmt(x + dx)}" y="${fmt(y - 3)}" text-anchor="${anchor}"
            font-family="Georgia, 'Playfair Display', serif" font-size="21" font-weight="700"
            fill="#F2E3C0">${lv.roman}<tspan font-family="Inter, sans-serif" font-size="12" font-weight="700"
            letter-spacing="1.6" fill="#C7A24A" dx="9" direction="ltr">${lv.cefr}</tspan></text>
      <text x="${fmt(x + dx)}" y="${fmt(y + 15)}" text-anchor="${anchor}"
            font-family="${SANS}" font-size="12.5" fill="#8FA3C4">${bidi(lv.name)}</text>
    </g>`;
}).join('\n');

const spokeMarkup = spokes.map((s) => `    <path data-draw="900" d="${s.d}" stroke="#4A6491" stroke-opacity=".42" stroke-width=".9" stroke-dasharray="none"/>`).join('\n');
const spokeLabels = spokes.map((s) => {
  const anchor = Math.cos(s.a) < -0.2 ? 'end' : Math.cos(s.a) > 0.2 ? 'start' : 'middle';
  return `    <text data-pop="" x="${fmt(s.lx)}" y="${fmt(s.ly)}" text-anchor="${anchor}"
          font-family="${SANS}" font-size="${RTL ? 13 : 11}" font-weight="700" letter-spacing="${RTL ? 0 : 2.4}"
          fill="#6E93C4" opacity=".85">${RTL ? bidi(s.label) : s.label.toUpperCase()}</text>`;
}).join('\n');

const svg = plate({
  id: 'curriculum-spiral', lang: LANG, width: W, height: H,
  title: TITLE[LANG] || TITLE.en,
  desc: DESC[LANG] || DESC.en,
  body: `  <g fill="none" stroke-linecap="round" stroke-linejoin="round">
${spokeMarkup}
${turns}
  </g>

  <!-- The centre: where a learner begins. -->
  <g data-pop="">
    <circle cx="${CX}" cy="${CY}" r="34" fill="none" stroke="#C7A24A" stroke-opacity=".35" stroke-width="1"/>
    <circle cx="${CX}" cy="${CY}" r="25" fill="#0A1428" stroke="#D4AF37" stroke-width="1.4"/>
    <text x="${CX}" y="${CY - 2}" text-anchor="middle"
          font-family="${SANS}" font-size="${RTL ? 11 : 9.5}" font-weight="700" letter-spacing="${RTL ? 0 : 1.8}"
          fill="#C7A24A">${bidi((CENTRE[LANG] || CENTRE.en)[0])}</text>
    <text x="${CX}" y="${CY + 11}" text-anchor="middle"
          font-family="${SANS}" font-size="${RTL ? 11 : 9.5}" font-weight="700" letter-spacing="${RTL ? 0 : 1.8}"
          fill="#C7A24A">${bidi((CENTRE[LANG] || CENTRE.en)[1])}</text>
  </g>

${nodes}
${spokeLabels}`,
});

mkdirSync(path.dirname(OUT), { recursive: true });
writeFileSync(OUT, svg);
console.log(`Wrote ${path.relative(ROOT, OUT)} — ${(svg.length / 1024).toFixed(1)} KB`);
