/**
 * The editorial design system for the flagship edition.
 *
 * ────────────────────────────────────────────────────────────────────
 * SIX PALETTES, ONE FAMILY
 * ────────────────────────────────────────────────────────────────────
 * Each level carries its own colour identity so that a reader who opens
 * the book anywhere knows immediately where they are — the ascent from
 * Foundation to Mastery is legible on the page edge, not only in the
 * running head. The palettes are deliberately close in value and
 * saturation: six hues from one family, so the book reads as one work
 * rather than as six pamphlets bound together.
 *
 * Each is a deep ink for display, a mid tone for rules and accents, and
 * a pale wash for panels. They are chosen to hold up in CMYK and to
 * remain distinguishable in greyscale, because a curriculum gets
 * photocopied.
 *
 * ────────────────────────────────────────────────────────────────────
 * WHAT IS NOT HERE
 * ────────────────────────────────────────────────────────────────────
 * No photography. The brief asks for museum-quality editorial
 * photography; this environment can neither commission nor generate it,
 * and dropping in stock images of models posing as students would be
 * exactly the fabrication the rest of this project refuses. The visual
 * system is therefore typographic and diagrammatic — which is also what
 * the best reference editions actually do.
 */

export const LEVEL_PALETTES = [
  // I — Foundation. The deepest, because beginning is the hardest step.
  { key: 'I', ink: '#14264A', mid: '#4A6FA5', wash: '#EEF2F9', edge: '#2E4C7E', name: 'Foundation' },
  // II — Elementary.
  { key: 'II', ink: '#123A46', mid: '#3E7F8C', wash: '#EAF4F5', edge: '#245C68', name: 'Elementary' },
  // III — Intermediate. The turn toward membership.
  { key: 'III', ink: '#14402F', mid: '#3F8163', wash: '#EAF4EF', edge: '#256349', name: 'Intermediate' },
  // IV — Upper Intermediate. Representation; the warm turn.
  { key: 'IV', ink: '#4A3410', mid: '#9A7A38', wash: '#F8F2E4', edge: '#75561F', name: 'Upper Intermediate' },
  // V — Advanced. Oratory.
  { key: 'V', ink: '#4A1E24', mid: '#9C4A55', wash: '#F9EDEE', edge: '#75323B', name: 'Advanced' },
  // VI — Mastery. The crown: deepest violet-ink, closest to black.
  { key: 'VI', ink: '#2E1B45', mid: '#6B4E92', wash: '#F2EEF8', edge: '#4A3170', name: 'Mastery' },
];

export const BRAND = {
  ink: '#14264A',
  gold: '#9A7A38',
  goldLight: '#C6A15B',
  soft: '#4B5768',
  rule: '#D3D8E2',
  paper: '#FFFFFF',
  cream: '#FBFAF7',
};

/**
 * Stage marks. A small typographic device per lesson stage, so a
 * teacher scanning a page finds the practice they want without reading.
 * Drawn as text glyphs rather than images: they survive greyscale
 * printing, cost nothing, and cannot fail to load.
 */
export const STAGE_MARK = {
  objectives: '◆', prereq: '◇', warmup: '○', present: '●', guided: '◐',
  independent: '◑', speaking: '❯', listening: '≈', reading: '▤', writing: '✎',
  pronunciation: '◈', vocabulary: '▦', assess: '✓', thinking: '?',
  rubric: '▥', instructions: '▶', homework: '⌂', extension: '+', revision: '↻',
};

/** The stages that get a full-width tinted band rather than plain flow. */
export const EMPHASIS_STAGES = new Set(['objectives', 'rubric', 'assess', 'thinking']);

export function paletteFor(roman) {
  return LEVEL_PALETTES.find((p) => p.key === roman) || LEVEL_PALETTES[0];
}

/**
 * The chapter-opener ornament: a set of ascending rules, one per level,
 * with the current level solid and the rest ghosted. It states position
 * in the ascent without a word, and it is drawn rather than
 * illustrated, so it is vector at any size.
 */
export function ascentOrnament(currentRoman, palette) {
  const idx = LEVEL_PALETTES.findIndex((p) => p.key === currentRoman);
  const bars = LEVEL_PALETTES.map((p, i) => {
    const h = 8 + i * 9;
    const on = i <= idx;
    return `<rect x="${i * 22}" y="${64 - h}" width="12" height="${h}" rx="1.5"
      fill="${on ? palette.mid : '#E6E9F0'}" ${i === idx ? `stroke="${palette.ink}" stroke-width="1.5"` : ''}/>`;
  }).join('');
  return `<svg viewBox="0 0 122 66" width="122" height="66" role="img"
    aria-label="Level ${currentRoman} of six in the IEFC ascent">${bars}</svg>`;
}
