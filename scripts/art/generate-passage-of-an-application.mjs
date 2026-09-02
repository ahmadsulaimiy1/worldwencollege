#!/usr/bin/env node
// Generates assets/art/passage-of-an-application.svg (+ .ar) — the plate
// for /admissions/track/.
//
// ─────────────────────────────────────────────────────────────────────
// WHAT IT ARGUES
// ─────────────────────────────────────────────────────────────────────
// An applicant refreshing a status page is not really asking "what word
// describes my application". They are asking whether anyone is doing
// anything, whether any of it is theirs, and when. `placement_pending`
// answers none of those, and neither does a progress bar: a bar says how
// far along you are and says nothing about who is holding the thing.
//
// So this drawing is about OWNERSHIP rather than progress. Five stages
// on one thread, each disc sitting above or below the line according to
// whose act it is — the applicant's below, the College's above, and the
// two that are genuinely shared drawn on the line itself. A reader sees
// the alternation before they read a word, which is the fact the page
// spends four paragraphs on: half of this is not your move, and the half
// that is not is the half you are entitled to chase.
//
// ─────────────────────────────────────────────────────────────────────
// THE STAGES COME FROM THE PLATFORM, NOT FROM THIS FILE
// ─────────────────────────────────────────────────────────────────────
// `PUBLISHED_JOURNEY` in functions/_lib/admissions/lifecycle.js is what
// GET /api/admissions/track returns and what the page's own rail
// renders. Importing it means a sixth stage, or a renamed one, moves the
// endpoint, the rail and this drawing together. A diagram that keeps its
// own copy of a list is a diagram that will one day contradict the page
// it sits on, and the reader will believe the drawing.
//
// The Arabic edition carries its own translations of the five titles,
// keyed by stage number, and the generator REFUSES if the platform ever
// publishes a stage this file has no Arabic for — rather than silently
// shipping an English word into an Arabic plate.
//
//   node scripts/art/generate-passage-of-an-application.mjs [ar]

import { writeFileSync, mkdirSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { INK, SERIF, sansFor, isRtl, n, text, paragraph, drawn, rule, node, plate } from './lib/plate.mjs';
import { PUBLISHED_JOURNEY, PLACEMENT_COMMITMENT } from '../../functions/_lib/admissions/lifecycle.js';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..');
const LANG = (process.argv[2] || 'en').toLowerCase();
const RTL = isRtl(LANG);
const SANS = sansFor(LANG);
const DISPLAY = RTL ? SANS : SERIF;
const ID = 'passage-of-an-application';
const OUT = path.join(ROOT, `assets/art/${ID}${RTL ? '.ar' : ''}.svg`);

// ── Whose act each stage is ──────────────────────────────────────────
// Read from the stage's own `who` string rather than hard-coded, so a
// stage whose ownership is rewritten in lifecycle.js moves here too.
// Three positions, and the middle one is not a hedge: stage 5 really is
// "You and the platform together", and drawing it as either party's
// alone would be the drawing making a claim the platform does not.
function sideFor(who) {
  const w = who.toLowerCase();
  const you = /\byou\b/.test(w);
  const college = /admissions|college|person, not the platform|platform/.test(w);
  if (you && college) return 'both';
  if (you) return 'applicant';
  return 'college';
}

const AR_TITLES = {
  1: 'قدِّر مستواك',
  2: 'أرسِل النموذج',
  3: 'تحديد المستوى',
  4: 'العرض',
  5: 'القيد',
};
const AR_WHO = {
  1: 'أنت، في نحو ثلاثين ثانية',
  2: 'أنت',
  3: 'إنسان، لا النظام',
  4: 'القبول، ثم أنت',
  5: 'أنت والنظام معًا',
};

if (RTL) {
  const missing = PUBLISHED_JOURNEY.filter((s) => !AR_TITLES[s.number] || !AR_WHO[s.number]);
  if (missing.length) {
    throw new Error(
      `The published journey has ${PUBLISHED_JOURNEY.length} stages and this generator holds Arabic `
      + `for ${Object.keys(AR_TITLES).length}. Missing: ${missing.map((s) => `${s.number} "${s.title}"`).join(', ')}. `
      + 'Every English page has an Arabic edition and they ship together (CLAUDE.md § 4); a plate '
      + 'that fell back to English for one stage would be the single English word on an Arabic page.',
    );
  }
}

const COPY = {
  en: {
    eyebrow: 'THE PASSAGE OF AN APPLICATION',
    lede: 'Five stages, and half of them are not your move.',
    yours: 'YOURS',
    ours: 'THE COLLEGE’S',
    shared: 'BOTH',
    foot: PLACEMENT_COMMITMENT,
    title: 'The five stages of an application, drawn by whose act each one is',
    descTail:
      'The discs sit below the thread where the act is the applicant’s, above it where the act is '
      + 'the College’s, and on the thread itself where the stage genuinely belongs to both. The '
      + 'alternation is the point of the drawing: an applicant who can see which stages are not '
      + 'theirs can also see which ones they are entitled to chase.',
  },
  ar: {
    eyebrow: 'مسار الطلب',
    lede: 'خمس مراحل، ونصفها ليس بيدك.',
    yours: 'لك',
    ours: 'على الكلية',
    shared: 'لكليكما',
    foot: 'تلتزم الكلية بالتواصل لتحديد المستوى خلال ثلاثة أيام عمل. فإن فات ذلك، فاكتب إلى القبول وقل ذلك.',
    title: 'مراحل الطلب الخمس، مرسومةً بحسب صاحب كل فعل',
    descTail:
      'تنزل الدائرة تحت الخيط حيث يكون الفعل على المتقدّم، وترتفع فوقه حيث يكون على الكلية، وتقف على '
      + 'الخيط نفسه حيث تكون المرحلة لكليهما حقًّا. وهذا التناوب هو مقصود الرسم: فمن رأى أيّ المراحل '
      + 'ليست بيده رأى كذلك أيّها له أن يسأل عنها.',
  },
};
const t = COPY[RTL ? 'ar' : 'en'];
const titleOf = (s) => (RTL ? AR_TITLES[s.number] : s.title);
const whoOf = (s) => (RTL ? AR_WHO[s.number] : s.who);

// ── Geometry ─────────────────────────────────────────────────────────
const W = 900, H = 500;
const AXIS = 262;                    // the thread
const OFFSET = 68;                   // how far a disc leaves the thread
const MARGIN = 118;
const span = W - MARGIN * 2;
const count = PUBLISHED_JOURNEY.length;
const step = span / (count - 1);
// Mirrored coordinates carry the right-to-left layout, never
// text-anchor — see the note in lib/plate.mjs.
const xFor = (i) => (RTL ? W - MARGIN - i * step : MARGIN + i * step);

const placed = PUBLISHED_JOURNEY.map((s, i) => {
  const side = sideFor(s.who);
  return {
    stage: s,
    side,
    x: xFor(i),
    y: side === 'applicant' ? AXIS + OFFSET : side === 'college' ? AXIS - OFFSET : AXIS,
  };
});

const bits = [];

// --- The heading ------------------------------------------------------
{
  const x0 = RTL ? W - 92 : 92;
  const anchor = RTL ? 'end' : 'start';
  bits.push(text(t.eyebrow, {
    x: x0, y: 50, anchor, size: 10.5, weight: 700,
    tracking: RTL ? 0 : 2.4, fill: INK.cerulean, family: SANS,
  }));
  bits.push(text(t.lede, {
    x: x0, y: 78, anchor, size: 15, fill: INK.goldChampagne, family: DISPLAY,
  }));
}

// --- The key ----------------------------------------------------------
// Named in words, not left to position alone: a drawing whose whole
// argument is "above means one thing and below means another" has to say
// which is which, or it argues nothing to a reader meeting it for the
// first time.
//
// AS A LEGEND UNDER THE LEDE, and not as two words beside the bands,
// which is where they were first drawn. At the band edges they collided
// with the outermost stage's own label — invisible in the source and
// obvious the moment the plate was rendered (CLAUDE.md § 6). A legend at
// the top cannot collide with anything, because nothing else is there.
{
  const x0 = RTL ? W - 92 : 92;
  const dir = RTL ? -1 : 1;
  let x = x0;
  for (const [label, ink] of [[t.ours, INK.goldRich], [t.yours, INK.sapphire]]) {
    bits.push(`<circle cx="${n(x + dir * 5)}" cy="${n(104)}" r="5" fill="none" stroke="${ink}" stroke-width="1.6"/>`);
    bits.push(text(label, {
      x: x + dir * 18, y: 108, anchor: RTL ? 'end' : 'start', size: 10, weight: 700,
      tracking: RTL ? 0 : 1.8, fill: ink === INK.goldRich ? INK.goldSoft : INK.cerulean, family: SANS,
    }));
    // Advance past the label. Estimated advance, generously — the same
    // approximation paragraph() uses and for the same reason: there is no
    // text engine here, and a legend that breaks one word early is
    // invisible where one that overlaps is the fault this replaces.
    x += dir * (44 + label.length * (RTL ? 6.6 : 7.8));
  }
}

// --- The thread -------------------------------------------------------
bits.push(rule(xFor(0), AXIS, xFor(count - 1), AXIS, {
  stroke: INK.sapphire, width: 1.4, opacity: 0.55,
}));

// --- The risers and the discs ----------------------------------------
placed.forEach((p, i) => {
  if (p.side !== 'both') {
    bits.push(drawn(`M${n(p.x)} ${n(AXIS)}L${n(p.x)} ${n(p.y)}`, {
      stroke: p.side === 'college' ? INK.goldRoyal : INK.sapphire,
      width: 1.1, ms: 700 + i * 130, cap: 'round',
    }));
  }

  bits.push(node(p.x, p.y, {
    r: 15,
    fill: INK.oxford,
    stroke: p.side === 'college' ? INK.goldRich : p.side === 'both' ? INK.goldSoft : INK.sapphire,
    width: 1.8,
    core: null,
  }));
  bits.push(text(String(p.stage.number), {
    x: p.x, y: p.y + 5, anchor: 'middle', size: 13, weight: 700,
    fill: p.side === 'college' ? INK.goldSoft : INK.goldChampagne, family: SANS, ltr: true, pop: true,
  }));

  // The title reads AWAY from the thread and the owner reads under it,
  // so no label crosses the line it belongs to.
  const away = p.side === 'applicant' ? 1 : p.side === 'college' ? -1 : 1;
  const titleY = p.side === 'both' ? p.y + 46 : p.y + away * 34;
  bits.push(text(titleOf(p.stage), {
    x: p.x, y: titleY, anchor: 'middle', size: 13.5, weight: 700,
    fill: INK.goldChampagne, family: DISPLAY, pop: true,
  }));
  bits.push(paragraph(whoOf(p.stage), {
    x: p.x, y: titleY + 18, width: step - 14, anchor: 'middle', size: 10.5,
    fill: INK.slateText, family: SANS, lang: LANG,
  }));
});

// --- The commitment ---------------------------------------------------
// The one clock the College puts on itself, on the plate rather than
// only in the prose beside it, because the stage it governs is the one
// that most often goes quiet.
{
  bits.push(rule(MARGIN, H - 72, W - MARGIN, H - 72, { stroke: INK.steel, width: 0.8, opacity: 0.3 }));
  bits.push(paragraph(t.foot, {
    x: W / 2, y: H - 46, width: span - 40, anchor: 'middle', size: 11.5,
    fill: INK.goldSoft, family: SANS, lang: LANG,
  }));
}

const desc = PUBLISHED_JOURNEY.map((s) => {
  const side = sideFor(s.who);
  const owner = side === 'applicant' ? (RTL ? 'على المتقدّم' : 'the applicant’s')
    : side === 'college' ? (RTL ? 'على الكلية' : 'the College’s')
      : (RTL ? 'لكليهما' : 'shared');
  return RTL
    ? `المرحلة ${s.number}، ${AR_TITLES[s.number]}: ${owner} (${AR_WHO[s.number]}).`
    : `Stage ${s.number}, ${s.title}: ${owner} (${s.who}).`;
}).join(' ') + ' ' + t.descTail;

mkdirSync(path.dirname(OUT), { recursive: true });
writeFileSync(OUT, plate({
  id: ID, lang: LANG, width: W, height: H, title: t.title, desc, body: bits.join('\n  '),
}));
console.log(`art: ${path.relative(ROOT, OUT)} — ${count} stages`);
