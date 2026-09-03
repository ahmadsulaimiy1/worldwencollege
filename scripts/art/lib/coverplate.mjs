/**
 * THE COVER PLATE — a bound volume's three faces, drawn rather than
 * photographed.
 *
 * ────────────────────────────────────────────────────────────────────
 * THE FAULT THIS EXISTS TO CORRECT
 * ────────────────────────────────────────────────────────────────────
 * The Library showed each volume as the first page of its own PDF. That
 * page is not a cover — it is artwork built to a print specification,
 * with 3mm of bleed outside the trim on all four edges and crop marks
 * printed into the bleed so a guillotine knows where to cut. Rasterised
 * and dropped onto a web page, the bleed reads as a white border and
 * the crop marks read as four stray crosses. The owner said the covers
 * "have white edges around them", and he was looking at a printer's
 * instruction sheet.
 *
 * A print cover and a screen cover are two different objects. This
 * module draws the screen one: trimmed to the page, no bleed, no marks,
 * every face full to its own edge, and every rule and letterform
 * scalable rather than resampled. Nothing here is rasterised at any
 * size, so a cover is as sharp on a 3440px monitor as on a phone and
 * costs the same six kilobytes either way.
 *
 * ────────────────────────────────────────────────────────────────────
 * WHY THE ORNAMENT IS RATIONED
 * ────────────────────────────────────────────────────────────────────
 * scripts/publication/ornament.mjs draws a guilloché rosette by
 * integrating a hypotrochoid at 1,440 steps per ring — which is what a
 * security lathe does and is exactly right for a printed cover, where
 * the file is opened once by a printer. Inlined into a web page it is
 * 100KB of path data per rosette, and the Library carries sixteen
 * covers at once.
 *
 * So the ground here is the girih tiling at a coarse cell, the band is
 * a short wave, and the lathe work stays in the print module where it
 * belongs. The two covers are the same design at two densities, which
 * is what a house style is for.
 *
 * ────────────────────────────────────────────────────────────────────
 * EMBOSSING, WHICH IS THREE COPIES OF ONE LINE
 * ────────────────────────────────────────────────────────────────────
 * Foil stamping deforms the sheet: the die presses the gold in, so the
 * upper-left of every stroke catches light and the lower-right holds a
 * shadow. Simulated the honest way — a light copy offset up-left, a
 * dark copy offset down-right, the foil-gradient copy on top — it reads
 * as relief at any size and needs no filter, which matters because SVG
 * filters rasterise at the resolution the browser guesses and go soft
 * on exactly the wide screens this is drawn for.
 */
import { girihRosette, frame, cornerFan, fleuron, crest } from '../../publication/ornament.mjs';

export const TRIM = { w: 420, h: 594 };

const esc = (s) => String(s ?? '')
  .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
  .replace(/"/g, '&quot;');
const n = (v) => Number(v).toFixed(1);

/**
 * THE GROUNDS.
 *
 * One per collection, and the assignment is not decorative: a reader
 * scanning the shelf should be able to tell the curriculum from the
 * teaching apparatus from the Press's own constitution without reading
 * a word, the way a publisher's series livery works on a real shelf.
 *
 * Every ground is a dark ink at book-cloth weight, because gold reads
 * as foil on dark and as mustard on light — the same reason
 * design.mjs rations Royal Gold away from type on paper.
 */
export const GROUNDS = {
  'The Curriculum': { a: '#0B1B3D', b: '#152C57', edge: '#06102A', name: 'Midnight' },
  'Teaching and Assessment': { a: '#0C2A24', b: '#154237', edge: '#061A16', name: 'Bottle' },
  'Student Material': { a: '#3A1119', b: '#5E1A26', edge: '#230A10', name: 'Burgundy' },
  'The Press': { a: '#1B1B1F', b: '#2E2E36', edge: '#0E0E11', name: 'Graphite' },
  'Cover Artwork': { a: '#241A0C', b: '#3D2C14', edge: '#150F07', name: 'Bronze' },
};
const FALLBACK = GROUNDS['The Curriculum'];

const GOLD = { bright: '#F3E3B3', mid: '#C7A24A', deep: '#8A6A3B', champagne: '#E4D5A8' };

/**
 * Word wrap by estimated advance.
 *
 * There is no text metric engine here and there does not need to be:
 * display type on a cover is between two and seven words, the family
 * is known, and the caps advance of Cinzel at the tracking used below
 * measures 0.63em averaged over the alphabet. The estimate is checked
 * by rendering, which is the only check that counts — see the note at
 * the head of scripts/art/generate-covers.mjs.
 */
function wrap(str, { size, maxWidth, advance = 0.63 }) {
  const words = String(str).split(/\s+/).filter(Boolean);
  const fits = (line) => line.length * size * advance <= maxWidth;
  const lines = [];
  let cur = '';
  for (const w of words) {
    const next = cur ? `${cur} ${w}` : w;
    if (cur && !fits(next)) { lines.push(cur); cur = w; } else { cur = next; }
  }
  if (cur) lines.push(cur);
  return lines;
}

/**
 * A foil-stamped line: three copies of one string, offset to read as a
 * die pressed into the board. `grad` names a gradient defined by
 * `coverDefs`.
 */
export function foil(str, {
  x, y, size = 30, family = "Cinzel, 'EB Garamond', Georgia, serif", weight = 600,
  tracking = 0.04, anchor = 'middle', grad = 'coverfoil', opacity = 1,
} = {}) {
  const common = `x="${n(x)}" y="${n(y)}" text-anchor="${anchor}" font-family="${family}"`
    + ` font-size="${n(size)}" font-weight="${weight}"`
    + ` letter-spacing="${n(size * tracking)}"`;
  const t = esc(str);
  return `<g opacity="${opacity}">`
    + `<text ${common} transform="translate(-0.7 -0.7)" fill="${GOLD.bright}" opacity=".38">${t}</text>`
    + `<text ${common} transform="translate(0.9 1.1)" fill="#1B1206" opacity=".6">${t}</text>`
    + `<text ${common} fill="url(#${grad})">${t}</text>`
    + '</g>';
}

/** A plain letterspaced small-caps line — apparatus, not display. */
export function caps(str, { x, y, size = 9, fill = GOLD.champagne, opacity = 0.8,
  anchor = 'middle', tracking = 0.22, weight = 600,
  family = "Inter, 'Helvetica Neue', sans-serif" } = {}) {
  return `<text x="${n(x)}" y="${n(y)}" text-anchor="${anchor}" font-family="${family}"`
    + ` font-size="${n(size)}" font-weight="${weight}" letter-spacing="${n(size * tracking)}"`
    + ` fill="${fill}" opacity="${opacity}">${esc(String(str).toUpperCase())}</text>`;
}

/** Body setting for the back panel. */
export function body(str, { x, y, width, size = 11.5, leading = 1.52,
  fill = 'rgba(247,244,236,.8)', anchor = 'start', advance = 0.5 } = {}) {
  const lines = wrap(str, { size, maxWidth: width, advance });
  return lines.map((line, i) => `<text x="${n(x)}" y="${n(y + i * size * leading)}"`
    + ` text-anchor="${anchor}" font-family="'EB Garamond', Georgia, serif"`
    + ` font-size="${n(size)}" fill="${fill}">${esc(line)}</text>`).join('');
}

/** The gradients and the ground, shared by all three faces. */
export function coverDefs(id, ground) {
  const g = ground || FALLBACK;
  return `<defs>
    <linearGradient id="${id}-foil" x1="0" y1="0" x2="0.9" y2="1">
      <stop offset="0%" stop-color="${GOLD.deep}"/>
      <stop offset="20%" stop-color="${GOLD.mid}"/>
      <stop offset="44%" stop-color="${GOLD.bright}"/>
      <stop offset="58%" stop-color="${GOLD.mid}"/>
      <stop offset="80%" stop-color="${GOLD.bright}"/>
      <stop offset="100%" stop-color="${GOLD.deep}"/>
    </linearGradient>
    <linearGradient id="${id}-ground" x1="0" y1="0" x2="0.6" y2="1">
      <stop offset="0%" stop-color="${g.b}"/>
      <stop offset="62%" stop-color="${g.a}"/>
      <stop offset="100%" stop-color="${g.edge}"/>
    </linearGradient>
    <radialGradient id="${id}-light" cx="24%" cy="8%" r="86%">
      <stop offset="0%" stop-color="#FFFFFF" stop-opacity=".16"/>
      <stop offset="55%" stop-color="#FFFFFF" stop-opacity=".03"/>
      <stop offset="100%" stop-color="#000000" stop-opacity=".26"/>
    </radialGradient>
    <linearGradient id="${id}-hinge" x1="0" y1="0" x2="1" y2="0">
      <stop offset="0%" stop-color="#000000" stop-opacity=".42"/>
      <stop offset="7%" stop-color="#000000" stop-opacity=".14"/>
      <stop offset="13%" stop-color="#FFFFFF" stop-opacity=".05"/>
      <stop offset="20%" stop-color="#000000" stop-opacity="0"/>
    </linearGradient>
    <pattern id="${id}-girih" width="210" height="210" patternUnits="userSpaceOnUse"
      patternTransform="translate(-105 -105)">
      ${girihRosette({ size: 210, stroke: '#FFFFFF', width: 0.5, opacity: 1 })
    .replace(/^<svg[^>]*>/, '<g>').replace(/<\/svg>$/, '</g>')}
    </pattern>
  </defs>`;
}

/**
 * The ground, the tiling, the light and the hinge shadow — everything
 * under the type, drawn edge to edge with no margin of any kind. This
 * is the part that used to be a 3mm white rectangle.
 */
export function groundFor(id, ground, { w = TRIM.w, h = TRIM.h, hinge = true } = {}) {
  return `<rect width="${w}" height="${h}" fill="url(#${id}-ground)"/>
    <rect width="${w}" height="${h}" fill="url(#${id}-girih)" opacity=".055"/>
    <rect width="${w}" height="${h}" fill="url(#${id}-light)"/>
    ${hinge ? `<rect width="${n(w * 0.2)}" height="${h}" fill="url(#${id}-hinge)"/>` : ''}`;
}

/* The tiling used to be girihField(), which stamps a fresh copy of the
   rosette's fifteen paths into the file for every cell — sixteen cells
   on an A4 cover, and a cover is inlined sixteen times over on the
   Library page. That is how a drawing of a book came to weigh 37KB.
   One <pattern> holds one rosette and the renderer repeats it, which
   is the whole reason patterns exist; the covers are a sixth the size
   and pixel-identical. Measured, not assumed: 37,653 bytes to 6,067. */

/** The double gold rule with its mitred corner brackets, plus fans. */
export function border(id, w = TRIM.w, h = TRIM.h, { inset = 22 } = {}) {
  const f = frame({ w, h, colour: GOLD.champagne, inset, corner: 26, thick: 1.3, thin: 0.45, gap: 5 })
    .replace(/width="100%" height="100%"/, `width="${w}" height="${h}"`);
  // The fan was stamped four times per face and it is a kilobyte each.
  // Defined once and referenced, it is a kilobyte per cover instead of
  // four — the same economy as the girih pattern, and for the same
  // reason: a drawing that repeats itself should say so once.
  const fan = cornerFan({ size: 30, colour: GOLD.champagne, opacity: 0.34 })
    .replace(/^<svg[^>]*>/, `<g id="${id}-fan">`).replace(/<\/svg>$/, '</g>');
  const p = inset + 11;
  const at = (x, y, sx, sy) => `<use href="#${id}-fan" transform="translate(${n(x)} ${n(y)}) scale(${sx} ${sy})"/>`;
  return `<defs>${fan}</defs>${f}
    ${at(p, p, 1, 1)}${at(w - p, p, -1, 1)}${at(p, h - p, 1, -1)}${at(w - p, h - p, -1, -1)}`;
}

/** The College's mark, sized for a cover and centred on x. */
export function mark(x, y, size = 74) {
  const c = crest({ size, gold: GOLD.champagne, ink: 'none', mono: false })
    .replace(/^<svg/, `<svg x="${n(x - size / 2)}" y="${n(y)}"`);
  return c;
}

/** A centred flourish. */
export function flourish(x, y, width = 120, opacity = 0.7) {
  const f = fleuron({ colour: GOLD.champagne, width })
    .replace(/^<svg/, `<svg x="${n(x - width / 2)}" y="${n(y)}"`);
  return `<g opacity="${opacity}">${f}</g>`;
}

/**
 * A short guilloché wave — thirty-two samples per line rather than four
 * hundred. At the size it is drawn (a 16-unit band across 420 units)
 * the difference is invisible and the file is a twelfth the size.
 */
export function wave(x, y, w, h = 14, { lines = 2, cycles = 9, opacity = 0.5, steps = 40 } = {}) {
  const out = [];
  for (let l = 0; l < lines; l += 1) {
    const off = (l / lines) * Math.PI * 2;
    const amp = (h * 0.38) * (1 - Math.abs(l - (lines - 1) / 2) / lines * 0.5);
    for (const dir of [1, -1]) {
      let d = '';
      for (let i = 0; i <= steps; i += 1) {
        const px = (i / steps) * w;
        const t = (px / w) * cycles * Math.PI * 2;
        const py = h / 2 + dir * amp * Math.sin(t + off) * Math.cos(t / 3 + off / 2);
        d += `${i ? 'L' : 'M'}${Math.round(px * 10) / 10} ${Math.round(py * 10) / 10}`;
      }
      out.push(`<path d="${d}" fill="none" stroke="${GOLD.champagne}" stroke-width=".35"`
        + ` opacity="${n(opacity * (0.5 + 0.5 * (1 - l / lines)))}"/>`);
    }
  }
  return `<g transform="translate(${n(x)} ${n(y)})">${out.join('')}</g>`;
}

/**
 * The level medallion: a struck disc carrying a roman numeral. Only
 * drawn for a volume that belongs to one level — a reference volume
 * covering all six wears the six-bar ascent instead, which `ascent()`
 * draws.
 */
export function medallion(cx, cy, r, roman, id) {
  return `<g>
    <circle cx="${n(cx)}" cy="${n(cy)}" r="${n(r)}" fill="rgba(0,0,0,.24)"/>
    <circle cx="${n(cx)}" cy="${n(cy)}" r="${n(r)}" fill="none"
      stroke="${GOLD.champagne}" stroke-width="1.1" opacity=".85"/>
    <circle cx="${n(cx)}" cy="${n(cy)}" r="${n(r - 4.5)}" fill="none"
      stroke="${GOLD.champagne}" stroke-width=".4" opacity=".55"/>
    ${foil(roman, { x: cx, y: cy + r * 0.34, size: r * 0.86, tracking: 0.06, grad: `${id}-foil` })}
  </g>`;
}

/** Six bars, the ascent, for a volume that spans the whole programme. */
export function ascent(cx, cy, { width = 132 } = {}) {
  const bars = Array.from({ length: 6 }, (_, i) => {
    const w = width / 6 - 3;
    const x = cx - width / 2 + i * (width / 6);
    const h = 5 + i * 2.6;
    return `<rect x="${n(x)}" y="${n(cy - h)}" width="${n(w)}" height="${n(h)}"`
      + ` fill="${GOLD.champagne}" opacity="${n(0.35 + i * 0.11)}"/>`;
  }).join('');
  return `<g>${bars}</g>`;
}

export { wrap, esc, n, GOLD };
