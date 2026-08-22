/**
 * THE COLOUR ENGINE — OKLCH, gamut-mapped to sRGB.
 *
 * ────────────────────────────────────────────────────────────────────
 * WHY A COLOUR SPACE AND NOT A LIST OF HEXES
 * ────────────────────────────────────────────────────────────────────
 * The six level palettes began as hand-picked hex values. They looked
 * like a family because they were chosen to, and they were not one: the
 * greens were perceptually lighter than the blues, the gold lighter
 * still. Set as six chapter dividers in sequence the ascent visibly
 * sagged in the middle, and no amount of adjusting individual values
 * fixes that reliably, because sRGB hex is not a perceptual space. Two
 * colours with the same numeric "darkness" in sRGB can differ by a
 * third in apparent lightness.
 *
 * OKLCH is a perceptual space: L is lightness as the eye reports it, C
 * is chroma, H is hue angle. Fixing L and C and varying only H gives
 * six colours that are genuinely equal in weight — the ascent reads as
 * one system rotating through the hue circle rather than as six
 * unrelated inks. That is a property that can be MEASURED, and
 * tests/curriculum-publication.test.mjs measures it.
 *
 * ────────────────────────────────────────────────────────────────────
 * GAMUT MAPPING IS NOT OPTIONAL
 * ────────────────────────────────────────────────────────────────────
 * Most of the OKLCH cylinder falls outside sRGB. Naively converting and
 * clipping each channel changes hue — a clipped blue turns purple, which
 * is precisely the failure the printed colour specification warns about.
 * So out-of-gamut colours here are mapped by REDUCING CHROMA at constant
 * lightness and hue until the colour fits, which preserves the two
 * attributes a reader actually perceives as identity.
 */

/** OKLCH → linear-light sRGB triple (may fall outside 0…1). */
function oklchToLinearRgb(L, C, Hdeg) {
  const h = (Hdeg * Math.PI) / 180;
  const a = C * Math.cos(h);
  const b = C * Math.sin(h);

  const l_ = L + 0.3963377774 * a + 0.2158037573 * b;
  const m_ = L - 0.1055613458 * a - 0.0638541728 * b;
  const s_ = L - 0.0894841775 * a - 1.2914855480 * b;

  const l = l_ * l_ * l_;
  const m = m_ * m_ * m_;
  const s = s_ * s_ * s_;

  return [
    +4.0767416621 * l - 3.3077115913 * m + 0.2309699292 * s,
    -1.2684380046 * l + 2.6097574011 * m - 0.3413193965 * s,
    -0.0041960863 * l - 0.7034186147 * m + 1.7076147010 * s,
  ];
}

const inGamut = ([r, g, b]) => [r, g, b].every((v) => v >= -0.0005 && v <= 1.0005);

/** sRGB transfer function (linear → encoded). */
function encode(v) {
  const c = Math.min(1, Math.max(0, v));
  return c <= 0.0031308 ? 12.92 * c : 1.055 * c ** (1 / 2.4) - 0.055;
}

/**
 * OKLCH → `#rrggbb`, reducing chroma by bisection where the requested
 * colour is outside sRGB. Lightness and hue are held exactly; only
 * saturation gives way, because saturation is the attribute a reader is
 * least able to name and most able to forgive.
 */
export function oklch(L, C, H) {
  let lo = 0;
  let hi = C;
  if (!inGamut(oklchToLinearRgb(L, C, H))) {
    for (let i = 0; i < 24; i++) {
      const mid = (lo + hi) / 2;
      if (inGamut(oklchToLinearRgb(L, mid, H))) lo = mid; else hi = mid;
    }
  } else {
    lo = C;
  }
  const rgb = oklchToLinearRgb(L, lo, H).map((v) => Math.round(encode(v) * 255));
  return `#${rgb.map((v) => v.toString(16).padStart(2, '0')).join('').toUpperCase()}`;
}

/** WCAG relative luminance of a `#rrggbb` string. */
export function luminance(hex) {
  const ch = [1, 3, 5].map((i) => {
    const v = parseInt(hex.slice(i, i + 2), 16) / 255;
    return v <= 0.03928 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4;
  });
  return 0.2126 * ch[0] + 0.7152 * ch[1] + 0.0722 * ch[2];
}

export function contrast(a, b) {
  const [x, y] = [luminance(a), luminance(b)].sort((p, q) => q - p);
  return Math.round(((x + 0.05) / (y + 0.05)) * 100) / 100;
}

/**
 * THE SIX HUES OF THE ASCENT.
 *
 * Chosen as a rotation, not as six preferences. The first sits on the
 * College's own royal blue so the opening level belongs to the
 * institutional identity; the remaining five step around the circle at
 * roughly even intervals, ending on a violet that reads as the deepest
 * and most formal — the crown of the ascent.
 *
 * The rotation is deliberately not perfectly even. A mathematically
 * equal split puts two adjacent levels in the yellow-green region where
 * the eye discriminates hue poorly, so III and IV are pulled apart by a
 * few degrees. Perceptual spacing, not numerical spacing, is what makes
 * six colours distinguishable.
 */
export const LEVEL_HUES = [
  { key: 'I', hue: 264, name: 'Foundation' },
  { key: 'II', hue: 216, name: 'Elementary' },
  { key: 'III', hue: 158, name: 'Intermediate' },
  { key: 'IV', hue: 78, name: 'Upper Intermediate' },
  { key: 'V', hue: 22, name: 'Advanced' },
  { key: 'VI', hue: 318, name: 'Mastery' },
];

/**
 * The four tones every level carries, at fixed lightness and chroma so
 * the six levels are equal in weight.
 *
 * INK is dark enough to clear 4.5:1 on the wash at every hue — checked
 * for all six, not assumed for one and hoped for the rest. MID is the
 * rule-and-accent tone, light enough to read as an accent and dark
 * enough to remain visible on the wash. WASH is a barely-there tint at
 * chroma 0.018: any more and six wash colours become six different
 * papers, which destroys the impression of one book.
 */
export const TONE = {
  ink: { L: 0.315, C: 0.085 },
  edge: { L: 0.42, C: 0.095 },
  // L=0.545 was the first choice and put two of the six mids at 4.27:1
  // and 4.29:1 on their own wash — below the 4.5 floor the colour
  // specification publishes. Measured across all six hues rather than
  // sampled on one, and darkened until the WORST hue clears the floor.
  mid: { L: 0.53, C: 0.105 },
  wash: { L: 0.963, C: 0.018 },
};

export function levelPalette({ key, hue, name }) {
  return {
    key,
    name,
    hue,
    ink: oklch(TONE.ink.L, TONE.ink.C, hue),
    edge: oklch(TONE.edge.L, TONE.edge.C, hue),
    mid: oklch(TONE.mid.L, TONE.mid.C, hue),
    wash: oklch(TONE.wash.L, TONE.wash.C, hue),
  };
}

export const LEVEL_PALETTES = LEVEL_HUES.map(levelPalette);
