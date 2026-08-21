#!/usr/bin/env node
// Generates assets/art/one-instant.svg (+ .ar) — the plate for
// /my-week.html.
//
// ─────────────────────────────────────────────────────────────────────
// WHAT IT ARGUES
// ─────────────────────────────────────────────────────────────────────
// A class time is the single most breakable fact a College publishes to
// a learner in another country. Every other mistake on this site can be
// corrected on the page it appears on; a time read on the wrong clock is
// discovered by a learner sitting in an empty room.
//
// So the platform never publishes a bare time. `renderInstant()` in
// functions/_lib/lms/timetable.js returns four things for every moment —
// the UTC instant, the same moment in the learner's own zone, the offset
// between them, and the zone's NAME — and this drawing is the reason:
// five clocks reading five different hours, one horizontal thread
// through all of them, and one instant.
//
// THE THREAD IS THE POINT. Five faces alone would say "the world has
// time zones", which nobody needs telling. The thread says the thing
// that matters to somebody deciding when to sit down: these are not five
// times. There is one time, and five ways of saying it.
//
// ─────────────────────────────────────────────────────────────────────
// THE HOURS ARE REAL, AND THAT IS DELIBERATE
// ─────────────────────────────────────────────────────────────────────
// The offsets drawn are the ones actually in force in August, computed
// here by Intl rather than typed in, so a plate that ever disagreed with
// the clock would disagree at generation time and not on the page. The
// cities are chosen for distinct offsets across the regions the College
// teaches into; the reference instant is a round hour in UTC, which is
// the only clock that cannot be wrong about itself.
//
//   node scripts/art/generate-one-instant.mjs [ar]

import { writeFileSync, mkdirSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { INK, SERIF, sansFor, isRtl, n, text, paragraph, drawn, rule, plate } from './lib/plate.mjs';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..');
const LANG = (process.argv[2] || 'en').toLowerCase();
const RTL = isRtl(LANG);
const SANS = sansFor(LANG);
const DISPLAY = RTL ? SANS : SERIF;
const ID = 'one-instant';
const OUT = path.join(ROOT, `assets/art/${ID}${RTL ? '.ar' : ''}.svg`);

// A round hour in UTC, mid-August — inside British Summer Time, so the
// London face is the one a reader in London can check against their own
// wall.
const REFERENCE = Date.UTC(2026, 7, 19, 12, 0, 0);

const ZONES = [
  { zone: 'UTC', en: 'UTC', ar: 'غرينتش' },
  { zone: 'Europe/London', en: 'London', ar: 'لندن' },
  { zone: 'Asia/Riyadh', en: 'Riyadh', ar: 'الرياض' },
  { zone: 'Asia/Karachi', en: 'Karachi', ar: 'كراتشي' },
  { zone: 'Asia/Jakarta', en: 'Jakarta', ar: 'جاكرتا' },
];

/** The wall clock in one zone at the reference instant. */
function wallClock(zone) {
  const parts = new Intl.DateTimeFormat('en-GB', {
    timeZone: zone, hour: '2-digit', minute: '2-digit', hour12: false,
  }).formatToParts(new Date(REFERENCE));
  const hour = Number(parts.find((p) => p.type === 'hour').value);
  const minute = Number(parts.find((p) => p.type === 'minute').value);
  return { hour, minute };
}

/** The offset in force, computed rather than typed. */
function offsetLabel(zone) {
  if (zone === 'UTC') return '+00:00';
  const local = new Date(new Date(REFERENCE).toLocaleString('en-US', { timeZone: zone }));
  const utc = new Date(new Date(REFERENCE).toLocaleString('en-US', { timeZone: 'UTC' }));
  const minutes = Math.round((local - utc) / 60000);
  const sign = minutes < 0 ? '-' : '+';
  const a = Math.abs(minutes);
  return `${sign}${String(Math.floor(a / 60)).padStart(2, '0')}:${String(a % 60).padStart(2, '0')}`;
}

const READINGS = ZONES.map((z) => ({
  ...z,
  ...wallClock(z.zone),
  offset: offsetLabel(z.zone),
}));

// A drawing that quietly showed five identical faces would be arguing
// nothing, and that is exactly what a badly chosen set of cities does.
if (new Set(READINGS.map((r) => r.hour)).size !== READINGS.length) {
  throw new Error(
    'Two of the chosen zones read the same hour at the reference instant, so the drawing would '
    + 'show duplicate faces and argue nothing. Choose zones with distinct offsets: '
    + READINGS.map((r) => `${r.en} ${r.hour}`).join(', '),
  );
}

const COPY = {
  en: {
    eyebrow: 'ONE INSTANT',
    lede: 'Not five times. One time, and five ways of saying it.',
    foot: 'Every time this College publishes carries its zone, its offset and its UTC instant — because a class time read on the wrong clock is discovered by a learner sitting in an empty room.',
    title: 'One moment, read on five clocks, with a single thread through all of them',
    desc:
      'Five clock faces in a row, each set to a different hour, joined by one horizontal thread. '
      + READINGS.map((r) => `${r.en} reads ${String(r.hour).padStart(2, '0')}:${String(r.minute).padStart(2, '0')} at offset ${r.offset}`).join('; ')
      + '. The thread is the argument: these are not five different times but one instant, and the '
      + 'five faces differ only in how each clock says it. That is why every time the platform '
      + 'publishes carries its zone name, its offset and its UTC instant rather than an hour alone.',
  },
  ar: {
    eyebrow: 'لحظة واحدة',
    lede: 'ليست خمسة أوقات. وقتٌ واحد، وخمس طرائق في قوله.',
    foot: 'كل وقت تنشره هذه الكلية يحمل منطقته وفرقه ولحظته بتوقيت غرينتش — لأن وقت حصةٍ يُقرأ على ساعة خطأ يكتشفه متعلّمٌ جالسٌ في غرفة فارغة.',
    title: 'لحظة واحدة، مقروءةً على خمس ساعات، وخيطٌ واحد يمرّ بها جميعًا',
    desc:
      'خمسة أوجه ساعات في صفّ، كلٌّ منها على ساعة مختلفة، يجمعها خيط أفقي واحد. '
      + READINGS.map((r) => `${r.ar} تقرأ ${String(r.hour).padStart(2, '0')}:${String(r.minute).padStart(2, '0')} بفرق ${r.offset}`).join('؛ ')
      + '. والخيط هو الحجّة: ليست هذه خمسة أوقات مختلفة بل لحظة واحدة، ولا تختلف الأوجه الخمسة إلا '
      + 'في كيفية قول كل ساعة لها. ولهذا يحمل كل وقت ينشره النظام اسم منطقته وفرقه ولحظته بتوقيت '
      + 'غرينتش، لا الساعة وحدها.',
  },
};
const t = COPY[RTL ? 'ar' : 'en'];
const nameOf = (r) => (RTL ? r.ar : r.en);

// ── Geometry ─────────────────────────────────────────────────────────
const W = 900, H = 400;
const MARGIN = 96;
const SPAN = W - MARGIN * 2;
const R = 44;                        // the dial
const AXIS = 190;                    // the thread, through every centre
const step = SPAN / (READINGS.length - 1);
const xFor = (i) => (RTL ? W - MARGIN - i * step : MARGIN + i * step);

const bits = [];

// --- The heading ------------------------------------------------------
{
  const x0 = RTL ? W - MARGIN : MARGIN;
  const anchor = RTL ? 'end' : 'start';
  bits.push(text(t.eyebrow, {
    x: x0, y: 50, anchor, size: 10.5, weight: 700,
    tracking: RTL ? 0 : 2.4, fill: INK.cerulean, family: SANS,
  }));
  bits.push(text(t.lede, {
    x: x0, y: 78, anchor, size: 15, fill: INK.goldChampagne, family: DISPLAY,
  }));
}

// --- The thread -------------------------------------------------------
// Drawn FIRST and behind every dial, so it reads as one line passing
// through them rather than as five segments between them.
bits.push(drawn(`M${n(Math.min(xFor(0), xFor(READINGS.length - 1)))} ${n(AXIS)}`
  + `L${n(Math.max(xFor(0), xFor(READINGS.length - 1)))} ${n(AXIS)}`, {
  stroke: INK.goldRoyal, width: 1.4, ms: 1400,
}));

// --- The five dials ---------------------------------------------------
READINGS.forEach((r, i) => {
  const cx = xFor(i);
  const home = r.zone === 'Europe/London';   // the College's own clock

  bits.push(`<circle data-pop="" cx="${n(cx)}" cy="${n(AXIS)}" r="${R}" fill="${INK.oxford}"`
    + ` stroke="${home ? INK.goldRich : INK.sapphire}" stroke-width="${home ? 2 : 1.4}"/>`);
  bits.push(`<circle data-pop="" cx="${n(cx)}" cy="${n(AXIS)}" r="${R - 6}" fill="none"`
    + ` stroke="${INK.cerulean}" stroke-width="0.6" stroke-opacity="0.4"/>`);

  // The twelve marks. Four long, eight short — a dial with uniform ticks
  // reads as a gauge rather than as a clock.
  for (let k = 0; k < 12; k += 1) {
    const a = (k / 12) * Math.PI * 2 - Math.PI / 2;
    const outer = R - 4;
    const inner = outer - (k % 3 === 0 ? 8 : 4);
    bits.push(rule(
      cx + Math.cos(a) * inner, AXIS + Math.sin(a) * inner,
      cx + Math.cos(a) * outer, AXIS + Math.sin(a) * outer,
      { stroke: k % 3 === 0 ? INK.goldSoft : INK.steel, width: k % 3 === 0 ? 1.2 : 0.8, opacity: 0.8 },
    ));
  }

  // The hands, at the hour this clock actually reads.
  const hourAngle = ((r.hour % 12) + r.minute / 60) / 12 * Math.PI * 2 - Math.PI / 2;
  const minuteAngle = (r.minute / 60) * Math.PI * 2 - Math.PI / 2;
  bits.push(drawn(
    `M${n(cx)} ${n(AXIS)}L${n(cx + Math.cos(hourAngle) * (R - 20))} ${n(AXIS + Math.sin(hourAngle) * (R - 20))}`,
    { stroke: INK.goldChampagne, width: 2.4, ms: 700 + i * 90 },
  ));
  bits.push(drawn(
    `M${n(cx)} ${n(AXIS)}L${n(cx + Math.cos(minuteAngle) * (R - 11))} ${n(AXIS + Math.sin(minuteAngle) * (R - 11))}`,
    { stroke: home ? INK.goldRich : INK.cerulean, width: 1.4, ms: 800 + i * 90 },
  ));
  bits.push(`<circle data-pop="" cx="${n(cx)}" cy="${n(AXIS)}" r="3" fill="${INK.goldRich}"/>`);

  // The reading, in digits, under the dial. A clock face alone is read
  // to the nearest five minutes; the digits are what a learner writes
  // down.
  bits.push(text(`${String(r.hour).padStart(2, '0')}:${String(r.minute).padStart(2, '0')}`, {
    x: cx, y: AXIS + R + 30, anchor: 'middle', size: 17, weight: 700,
    fill: INK.goldChampagne, family: DISPLAY, ltr: true, pop: true,
  }));
  bits.push(text(nameOf(r), {
    x: cx, y: AXIS + R + 50, anchor: 'middle', size: 11.5, weight: home ? 700 : 400,
    fill: home ? INK.goldSoft : INK.slateText, family: SANS, pop: true,
  }));
  bits.push(text(r.offset, {
    x: cx, y: AXIS + R + 66, anchor: 'middle', size: 10,
    fill: INK.steel, family: SANS, ltr: true, pop: true,
  }));
});

// --- The foot ---------------------------------------------------------
{
  bits.push(rule(MARGIN, H - 62, W - MARGIN, H - 62, { stroke: INK.steel, width: 0.8, opacity: 0.3 }));
  bits.push(paragraph(t.foot, {
    x: W / 2, y: H - 38, width: SPAN - 20, anchor: 'middle', size: 11,
    fill: INK.goldSoft, family: SANS, lang: LANG,
  }));
}

mkdirSync(path.dirname(OUT), { recursive: true });
writeFileSync(OUT, plate({
  id: ID, lang: LANG, width: W, height: H, title: t.title, desc: t.desc, body: bits.join('\n  '),
}));
console.log(`art: ${path.relative(ROOT, OUT)} — ${READINGS.map((r) => `${r.en} ${r.hour}:00`).join(', ')}`);
