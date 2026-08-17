// Shared apparatus for the living diagrams.
//
// Every diagram in assets/art/ is generated rather than drawn (see
// docs/digital-institution-masterplan.md, Layer 3). This is the part
// they have in common: the palette, the numeric formatting, the linear
// scale, and the SVG wrapper carrying the accessibility contract and
// the data-draw / data-pop attributes that js/atelier.js animates.
//
// Keeping it here rather than copying it per diagram is the difference
// between a house style and six drawings that resemble each other.

// The palette, as used in drawings. These are literal values rather
// than CSS variables because an SVG generated at build time cannot read
// the stylesheet — so they are duplicated here ON PURPOSE, and any
// change to css/brand.css's palette must be mirrored in this block.
export const INK = {
  oxford: '#0A1428',
  midnight: '#0E1B33',
  navy: '#14264A',
  royalBlue: '#1F3D7A',
  sapphire: '#27508F',
  steel: '#4A6491',
  cerulean: '#6E93C4',
  goldRoyal: '#C7A24A',
  goldRich: '#D4AF37',
  goldSoft: '#E7C97A',
  goldChampagne: '#F2E3C0',
  bronze: '#795A32',
  emerald: '#1E6A4F',
  burgundy: '#6E1F2E',
  purple: '#3E2A56',
  teal: '#1D5C63',
  slateText: '#8FA3C4',
};

export const SERIF = "'EB Garamond', Georgia, serif";
export const sansFor = (lang) => (lang === 'ar' ? 'Cairo, Inter, sans-serif' : 'Inter, sans-serif');
export const isRtl = (lang) => lang === 'ar';

// One decimal is a tenth of a unit on the viewBoxes used here — well
// under a device pixel at any rendered size, and it roughly halves the
// path data against three.
export const n = (v) => Number(v).toFixed(1);

/** A linear scale from a data domain to a pixel range. */
export function scale([d0, d1], [r0, r1]) {
  const f = (v) => r0 + ((v - d0) / (d1 - d0)) * (r1 - r0);
  f.invert = (p) => d0 + ((p - r0) / (r1 - r0)) * (d1 - d0);
  return f;
}

export const escapeXml = (s) =>
  String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');

// Any Arabic letter. Used to decide, per label, whether the run needs to
// be isolated as a right-to-left paragraph — see the note in text().
const HAS_ARABIC = /[؀-ۿݐ-ݿﭐ-﷿ﹰ-﻿]/;

// RIGHT-TO-LEFT ISOLATE … POP DIRECTIONAL ISOLATE. An isolate, rather
// than an embedding, because an embedding leaks its direction into the
// neutral characters on either side of it and an isolate does not.
const RLI = '⁧', PDI = '⁩';

/**
 * A text element.
 *
 * TWO BIDI PROBLEMS, WHICH ARE NOT THE SAME PROBLEM.
 *
 * The first is inside the run. `ltr` forces left-to-right on runs that
 * must not be reordered inside an Arabic drawing — percentages, CEFR
 * codes, roman numerals. A mirrored "70%" is not a styling flaw, it is a
 * wrong number.
 *
 * The second is `text-anchor`, and it cost a rebuild to find. Anchoring
 * is resolved against the element's inline base direction: `end` means
 * the visual right edge under LTR and the visual left edge under RTL. A
 * plate opened on its own has no direction, so it composes as LTR;
 * inlined into /ar/ it inherits `dir="rtl"` from the page and every
 * anchored label jumps to the opposite side of its own anchor point. The
 * Arabic authority chain was drawn, checked, and correct as a file, and
 * pushed its whole vacancy register off the right edge of the canvas the
 * moment it was placed on the page it was drawn for.
 *
 * The fix is to stop letting the host page have an opinion. `plate()`
 * pins the root to `direction="ltr"`, so an anchor always names a side of
 * the drawing rather than a side of the sentence, and the right-to-left
 * layout is carried entirely by mirrored coordinates — which is where a
 * flow diagram's direction belongs anyway.
 *
 * That leaves Arabic prose composing inside an LTR base, where trailing
 * punctuation would settle on the wrong end of the line. So every run
 * containing Arabic is wrapped in an isolate: correct paragraph order
 * within the label, no influence at all on where the label is anchored.
 * Detected from the content rather than declared per call, because a
 * flag that must be remembered at ninety call sites is a flag that will
 * be forgotten at one of them.
 */
/**
 * Isolate a run if it is Arabic, leave it alone if it is not.
 *
 * Exported for the one diagram that cannot go through text() — the
 * spiral's level labels carry a nested tspan with its own letter-spacing
 * and offset, which is markup this helper deliberately does not model.
 * Better a second entry point into the same rule than a second copy of
 * the rule.
 */
export const bidi = (s) => (HAS_ARABIC.test(String(s)) ? RLI + s + PDI : String(s));

export function text(content, {
  x, y, anchor = 'start', size = 12, weight = 400, fill = INK.slateText,
  family, tracking = 0, opacity = 1, ltr = false, pop = false,
} = {}) {
  const arabic = !ltr && HAS_ARABIC.test(String(content));
  const attrs = [
    // Valued, not bare. These files open on their own — an `<img src>`, a
    // designer double-clicking one — and a standalone SVG is parsed as
    // XML, where a bare attribute is not a shorthand but a syntax error.
    // The whole drawing becomes a parser error page. Inlined into HTML it
    // would have worked, which is exactly why it went unnoticed.
    pop ? 'data-pop=""' : null,
    `x="${n(x)}"`, `y="${n(y)}"`,
    `text-anchor="${anchor}"`,
    `font-family="${family || SERIF}"`,
    `font-size="${size}"`,
    weight !== 400 ? `font-weight="${weight}"` : null,
    tracking ? `letter-spacing="${tracking}"` : null,
    `fill="${fill}"`,
    opacity !== 1 ? `opacity="${opacity}"` : null,
    ltr ? 'direction="ltr"' : null,
  ].filter(Boolean).join(' ');
  const body = escapeXml(content);
  return `<text ${attrs}>${arabic ? RLI + body + PDI : body}</text>`;
}

/** A stroked path that draws itself in. `ms` is its draw duration. */
export function drawn(d, { stroke = INK.goldRoyal, width = 1.2, opacity = 1, ms = 1100, cap = 'round' } = {}) {
  return `<path data-draw="${ms}" d="${d}" stroke="${stroke}" stroke-width="${width}"`
    + (opacity !== 1 ? ` stroke-opacity="${opacity}"` : '')
    + ` stroke-linecap="${cap}" fill="none"/>`;
}

/** A static hairline — rules and grids arrive with the plate, not drawn. */
export function rule(x1, y1, x2, y2, { stroke = INK.steel, width = 0.9, opacity = 0.4, dash } = {}) {
  return `<path d="M${n(x1)} ${n(y1)}L${n(x2)} ${n(y2)}" stroke="${stroke}" stroke-width="${width}"`
    + ` stroke-opacity="${opacity}"${dash ? ` stroke-dasharray="${dash}"` : ''} fill="none"/>`;
}

/** A marker that pops into place: a ring with a filled core. */
export function node(x, y, { r = 7, fill = INK.oxford, stroke = INK.goldRich, width = 1.6, core = INK.goldRich } = {}) {
  return `<g data-pop="">`
    + `<circle cx="${n(x)}" cy="${n(y)}" r="${r}" fill="${fill}" stroke="${stroke}" stroke-width="${width}"/>`
    + (core ? `<circle cx="${n(x)}" cy="${n(y)}" r="${(r * 0.34).toFixed(1)}" fill="${core}"/>` : '')
    + `</g>`;
}

/**
 * The document wrapper.
 *
 * Carries the accessibility contract every diagram on this site owes:
 * role="img" with a title and a description, so a drawing that argues
 * something is available to a reader who cannot see it. The description
 * is not a caption — it must state what the diagram SHOWS, in full
 * sentences, because for some readers it is the diagram.
 *
 * `direction="ltr"` is on the root ON PURPOSE, including on the Arabic
 * plates, and must not be "corrected". It is not a claim about the
 * language; it fixes the coordinate system so `text-anchor` names a side
 * of the drawing rather than a side of the sentence. Without it a plate
 * lays out one way as a file and the other way inside an RTL page. The
 * full reasoning is in text() above; the guard is
 * tests/browser/diagram-fit.mjs, which measures every label against the
 * viewBox in the page that actually ships it.
 */
export function plate({ id, lang = 'en', width, height, title, desc, body }) {
  return `<?xml version="1.0" encoding="UTF-8"?>
<!-- Generated by scripts/art/ — do not hand-edit. -->
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${width} ${height}" width="${width}" height="${height}"
     data-diagram="${id}" role="img" lang="${lang}" direction="ltr"
     aria-labelledby="${id}-title ${id}-desc">
  <title id="${id}-title">${escapeXml(title)}</title>
  <desc id="${id}-desc">${escapeXml(desc)}</desc>
${body}
</svg>
`;
}
