/**
 * THE COVERS — three faces per volume, drawn to the trim.
 *
 * Generates, for every volume in data/library.json:
 *
 *     assets/covers/<slug>-front.svg
 *     assets/covers/<slug>-spine.svg
 *     assets/covers/<slug>-back.svg
 *
 * ────────────────────────────────────────────────────────────────────
 * WHAT WAS WRONG BEFORE
 * ────────────────────────────────────────────────────────────────────
 * The Library had no cover images at all: every volume was a row of
 * text with a file size beside it, and the one place a cover appeared
 * — the resources shelf — showed the first page of the print artwork,
 * bleed and crop marks included. The owner described it exactly: "the
 * covers of the book are not okay, because both the front covers and
 * back covers, there are still white edges around them."
 *
 * The white edge is the 3mm bleed that a printer's guillotine cuts
 * off. It is correct in the print file and meaningless on a screen.
 * These covers are drawn to the trim — 420 × 594 units, which is A4's
 * own proportion — so there is no edge to cut and nothing to crop.
 *
 * ────────────────────────────────────────────────────────────────────
 * THE SPINE IS MEASURED, NOT DECIDED
 * ────────────────────────────────────────────────────────────────────
 * Spine width = (pages ÷ 2) × caliper, the same formula
 * scripts/publication/covers.mjs uses for the printed artwork, applied
 * to the page count measured out of the PDF itself. So the 443-page
 * Complete Curriculum gets a spine four times the width of the 34-page
 * Flagship, and the shelf shows the difference the way a real shelf
 * does. A book whose spine is a fixed 20px on a web page is a picture
 * of a book; this is a drawing of the object.
 *
 * ────────────────────────────────────────────────────────────────────
 * IT REFUSES RATHER THAN GUESSES
 * ────────────────────────────────────────────────────────────────────
 * A volume with no entry in data/publications.json stops the build. A
 * volume whose measured extent is missing stops the build. The failure
 * mode this avoids is a cover that silently falls back to a default
 * title, which is the kind of fault that ships because it looks like a
 * design decision.
 */
import { readFileSync, writeFileSync, mkdirSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import {
  TRIM, GROUNDS, coverDefs, groundFor, border, mark, flourish, wave,
  medallion, ascent, foil, caps, body, wrap, esc, n, GOLD,
} from './lib/coverplate.mjs';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..');
const LIB = JSON.parse(readFileSync(path.join(ROOT, 'data/library.json'), 'utf8'));
const PUBS = JSON.parse(readFileSync(path.join(ROOT, 'data/publications.json'), 'utf8'));
const SERIES = PUBS.series || {};
const OUT = path.join(ROOT, 'assets/covers');

const ROMAN = ['', 'I', 'II', 'III', 'IV', 'V', 'VI'];

/** Paper caliper in mm per leaf, 100gsm uncoated — covers.mjs, shared. */
const CALIPER_MM = 0.115;
/**
 * The drawn spine, in the same 2-units-per-millimetre scale the faces
 * are drawn at, and clamped so a 19-page pamphlet still has a spine you
 * can see and a 443-page reference volume does not become a plank.
 */
function spineUnits(pages) {
  const mm = Math.max(5, (pages / 2) * CALIPER_MM + 1.5);
  return Math.min(64, Math.max(11, Math.round(mm * 2)));
}

// ─────────────────────────────────────────────────────────────────────
// THE FRONT
// ─────────────────────────────────────────────────────────────────────
function front(v, meta, lang) {
  const id = `c${v.slug.replace(/[^a-z0-9]/g, '')}`;
  const g = GROUNDS[v.collection] || GROUNDS['The Curriculum'];
  const ar = lang === 'ar';
  const title = (ar && meta.cover_title_ar) || meta.cover_title;
  const under = (ar && meta.cover_under_ar) || meta.cover_under;
  const over = meta.cover_over;
  const W = TRIM.w, H = TRIM.h;
  const cx = W / 2;

  // The display size steps down as the title lengthens, so a two-word
  // title is set as large as the panel allows and a five-word one still
  // fits inside the rule. Three sizes, not a continuous function: type
  // that lands on an arbitrary size looks like type nobody chose.
  const size = title.length <= 18 ? 40 : title.length <= 28 ? 33 : 27;
  const family = ar
    ? "Amiri, 'EB Garamond', Georgia, serif"
    : "Cinzel, 'EB Garamond', Georgia, serif";
  const lines = wrap(title, { size, maxWidth: W - 108, advance: ar ? 0.52 : 0.63 });
  const titleTop = 236 - (lines.length - 1) * size * 0.62;

  const levels = meta.levels || [];
  const single = levels.length === 1;
  // The series line fills what was 111 units of empty ground between
  // the edition and the ascent — with a fact rather than an ornament.
  // A reader who has one WEC Press volume in front of them should be
  // able to see which shelf it belongs to without turning it over.
  const seriesName = (SERIES[meta.series] || {})[ar ? 'ar' : 'en'] || meta.series || '';

  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${W} ${H}"
  width="${W}" height="${H}" role="img"
  aria-label="${esc(`${title}${under ? ` — ${under}` : ''}, Worldwide English College Press`)}"
  preserveAspectRatio="xMidYMid slice">
  ${coverDefs(id, g)}
  ${groundFor(id, g, { w: W, h: H })}
  ${border(id, W, H)}

  ${mark(cx, 66, 72)}
  ${caps(over, { x: cx, y: 176, size: 8.4, opacity: 0.62, tracking: 0.26 })}
  <path d="M${n(cx - 78)} 190 H${n(cx + 78)}" stroke="${GOLD.champagne}" stroke-width=".6" opacity=".5"/>

  ${lines.map((l, i) => foil(l, {
    x: cx, y: titleTop + i * size * 1.14, size, family, grad: `${id}-foil`,
    tracking: ar ? 0 : 0.045,
  })).join('\n  ')}

  ${under ? caps(under, { x: cx, y: titleTop + lines.length * size * 1.14 + 12, size: 9.6, opacity: 0.78, tracking: 0.2 }) : ''}

  ${flourish(cx, 372, 128, 0.62)}
  ${caps(seriesName, { x: cx, y: 404, size: 7.8, opacity: 0.5, tracking: 0.28 })}

  ${single
    ? medallion(cx, 452, 29, ROMAN[levels[0]], id)
    : levels.length ? ascent(cx, 458, { width: 138 }) : flourish(cx, 450, 84, 0.4)}
  ${levels.length
    ? caps(single
      ? (ar ? `المستوى ${ROMAN[levels[0]]}` : `Level ${ROMAN[levels[0]]}`)
      : (ar ? 'المستويات الستة' : 'Six levels'),
    { x: cx, y: single ? 494 : 478, size: 7.6, opacity: 0.55, tracking: 0.24 })
    : ''}

  ${wave(56, 520, W - 112, 13, { opacity: 0.42 })}
  ${caps(ar ? 'مطبعة الكلية العالمية للغة الإنجليزية · لندن' : 'Worldwide English College Press · London',
    { x: cx, y: 560, size: 8, opacity: 0.6, tracking: 0.2 })}
</svg>
`;
}

// ─────────────────────────────────────────────────────────────────────
// THE SPINE
// ─────────────────────────────────────────────────────────────────────
function spine(v, meta, lang, pages) {
  const id = `s${v.slug.replace(/[^a-z0-9]/g, '')}`;
  const g = GROUNDS[v.collection] || GROUNDS['The Curriculum'];
  const ar = lang === 'ar';
  const W = spineUnits(pages), H = TRIM.h;
  const title = (ar && meta.cover_title_ar) || meta.cover_title;
  // Below about 26 units the spine cannot carry a legible line, so it
  // carries rules and the crest's colour alone rather than type set at
  // a size that would print as a smudge — the same threshold rule the
  // crest applies to its own lettering.
  const roomForType = W >= 26;
  const size = Math.min(15, Math.max(9, W * 0.42));

  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${W} ${H}"
  width="${W}" height="${H}" aria-hidden="true" preserveAspectRatio="none">
  ${coverDefs(id, g)}
  <rect width="${W}" height="${H}" fill="url(#${id}-ground)"/>
  <rect width="${n(W * 0.34)}" height="${H}" fill="#000" opacity=".22"/>
  <rect x="${n(W - 1.6)}" width="1.6" height="${H}" fill="#FFF" opacity=".07"/>
  <path d="M${n(W / 2)} 26 V${n(H - 26)}" stroke="${GOLD.champagne}" stroke-width=".4" opacity=".2"/>
  <path d="M6 34 H${n(W - 6)} M6 ${n(H - 34)} H${n(W - 6)}"
    stroke="${GOLD.champagne}" stroke-width=".7" opacity=".6"/>
  ${roomForType
    ? `<text transform="translate(${n(W / 2 + size * 0.34)} ${n(H / 2)}) rotate(90)"
        text-anchor="middle" font-family="${ar ? 'Amiri, serif' : "Cinzel, 'EB Garamond', serif"}"
        font-size="${n(size)}" font-weight="600" letter-spacing="${n(size * 0.06)}"
        fill="url(#${id}-foil)">${esc(title)}</text>`
    : ''}
  <g transform="translate(${n(W / 2)} ${n(H - 52)})">
    <circle r="${n(Math.min(7, W * 0.26))}" fill="none" stroke="${GOLD.champagne}"
      stroke-width=".7" opacity=".7"/>
  </g>
</svg>
`;
}

// ─────────────────────────────────────────────────────────────────────
// THE BACK
// ─────────────────────────────────────────────────────────────────────
function back(v, meta, lang, pages) {
  const id = `b${v.slug.replace(/[^a-z0-9]/g, '')}`;
  const g = GROUNDS[v.collection] || GROUNDS['The Curriculum'];
  const ar = lang === 'ar';
  const W = TRIM.w, H = TRIM.h;
  const cx = W / 2;
  const note = (ar && v.note_ar) || v.note;
  const study = ((ar && meta.study_ar) || meta.study || []).slice(0, 4);
  const anchor = ar ? 'end' : 'start';
  const mx = ar ? W - 54 : 54;

  const stat = (label, value, x) => `${caps(label, { x, y: 470, size: 7, opacity: 0.5, tracking: 0.2, anchor: 'middle' })}
    ${foil(value, { x, y: 456, size: 19, grad: `${id}-foil`, tracking: 0.02 })}`;

  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${W} ${H}"
  width="${W}" height="${H}" role="img"
  aria-label="${esc(ar ? 'اللوح الخلفي للغلاف' : 'The back panel of the cover')}"
  preserveAspectRatio="xMidYMid slice">
  ${coverDefs(id, g)}
  ${groundFor(id, g, { w: W, h: H, hinge: false })}
  ${border(id, W, H)}

  ${caps(ar ? 'مطبعة الكلية العالمية للغة الإنجليزية' : 'Worldwide English College Press',
    { x: cx, y: 62, size: 8, opacity: 0.6, tracking: 0.24 })}
  ${flourish(cx, 76, 96, 0.6)}

  ${body(note, { x: mx, y: 132, width: W - 108, size: 12, leading: 1.55, anchor,
    fill: 'rgba(247,244,236,.84)', advance: ar ? 0.46 : 0.5 })}

  ${study.length ? caps(ar ? 'ما في هذا المجلد' : 'Inside this volume',
    { x: mx, y: 252, size: 7.6, opacity: 0.55, tracking: 0.22, anchor }) : ''}
  ${study.map((s, i) => {
    const y = 274 + i * 34;
    return `<path d="M${n(ar ? W - 54 : 54)} ${n(y - 4)} h${n(ar ? -9 : 9)}"
        stroke="${GOLD.champagne}" stroke-width="1" opacity=".7"/>
      ${body(s, { x: ar ? W - 70 : 70, y, width: W - 140, size: 10.6, leading: 1.4,
    anchor, fill: 'rgba(247,244,236,.68)', advance: ar ? 0.46 : 0.5 })}`;
  }).join('\n  ')}

  <path d="M54 430 H${W - 54}" stroke="${GOLD.champagne}" stroke-width=".5" opacity=".35"/>
  ${stat(ar ? 'صفحة' : 'Pages', String(pages), cx - 96)}
  ${stat(ar ? 'المستويات' : 'Levels', (meta.levels || []).length ? String(meta.levels.length) : '—', cx)}
  ${stat(ar ? 'الطبعة' : 'Edition', ar ? '١' : 'I', cx + 96)}

  ${wave(56, 508, W - 112, 12, { opacity: 0.38 })}
  ${caps(ar ? 'لندن' : 'London', { x: cx, y: 552, size: 8.4, opacity: 0.62, tracking: 0.34 })}
</svg>
`;
}

// ─────────────────────────────────────────────────────────────────────
// THE RUN
// ─────────────────────────────────────────────────────────────────────
mkdirSync(OUT, { recursive: true });

const problems = [];
let written = 0;
for (const v of LIB.volumes) {
  const meta = PUBS.volumes[v.slug];
  if (!meta) { problems.push(`data/publications.json has no entry for "${v.slug}"`); continue; }
  if (!Number.isInteger(v.extent) || v.extent < 1) {
    problems.push(`"${v.slug}" has no measured extent in data/library.json`);
    continue;
  }
  for (const lang of ['en', 'ar']) {
    const sfx = lang === 'ar' ? '.ar' : '';
    writeFileSync(path.join(OUT, `${v.slug}-front${sfx}.svg`), front(v, meta, lang));
    writeFileSync(path.join(OUT, `${v.slug}-spine${sfx}.svg`), spine(v, meta, lang, v.extent));
    writeFileSync(path.join(OUT, `${v.slug}-back${sfx}.svg`), back(v, meta, lang, v.extent));
    written += 3;
  }
}

if (problems.length) {
  throw new Error(`generate-covers: ${problems.length} volume(s) cannot be drawn:\n  `
    + problems.join('\n  ')
    + '\nA cover that silently falls back to a default title is worse than no cover, '
    + 'because it looks like a decision.');
}

console.log(`covers: ${written} faces written to assets/covers/ `
  + `(${LIB.volumes.length} volumes × 3 faces × 2 editions)`);
