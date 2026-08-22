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

import { LEVEL_PALETTES as OKLCH_PALETTES } from './colour.mjs';

/**
 * ────────────────────────────────────────────────────────────────────
 * THE INSTITUTIONAL COLOUR SYSTEM
 * ────────────────────────────────────────────────────────────────────
 * Fourteen colours: a primary, a secondary, an accent, and eleven
 * supporting tones. Every one carries a stated role, because a palette
 * without roles is a mood board — designers pick prettily and the book
 * loses its argument by chapter three.
 *
 * THE HARMONY. Royal Blue (219°) and Royal Gold (43°) sit 176° apart:
 * a complementary pair, the most stable two-colour relationship there
 * is, and the reason blue-and-gold has been the livery of universities
 * and sovereign institutions for eight centuries. Deep Crimson (352°)
 * sits roughly 133° from the blue, completing a split-complementary
 * triad — near enough to gold to feel related, far enough to alarm
 * when it is used, which is exactly what an accent is for.
 *
 * THE PSYCHOLOGY, stated narrowly. Colour meaning is cultural, not
 * universal, and this publication will be read across many cultures;
 * what follows is a claim about convention in academic and civic
 * printing, not about human perception.
 *   Deep blue is the near-universal livery of institutions that expect
 *     to outlast their officers. It reads as permanence and as
 *     seriousness, and it is the least fashionable colour available,
 *     which is a virtue in a document meant to look current in 2046.
 *   Gold is the colour of conferral — of the seal, the leaf, the
 *     medal. Used sparingly it signals that something has been
 *     awarded; used generously it signals a diploma mill. It is
 *     therefore rationed here to marks of achievement and to rules.
 *   Crimson is the colour of caution and of consequence. In this
 *     publication it is reserved for assessment and for statements
 *     about what is not evidenced — never for decoration.
 *
 * THE VALUES are chosen to survive production. Every ink here holds a
 * contrast ratio of at least 4.5:1 against the paper it is specified
 * on, remains distinguishable in greyscale conversion, and avoids the
 * out-of-gamut blues that shift purple in CMYK.
 */
export const COLOURS = {
  royalBlue: { hex: '#1F3E7C', role: 'Primary. Display type, level identity, institutional voice.',
    note: 'The College\'s own blue. Everything structural is set in it.' },
  royalGold: { hex: '#B4933E', role: 'Secondary. Rules, ornament, marks of award, foil on dark grounds.',
    note: 'Rationed. Gold everywhere means gold nowhere. Never used for type on light paper — '
      + 'see Bronze.' },
  deepCrimson: { hex: '#8C1F2F', role: 'Accent. Assessment, answer keys, statements of what is not evidenced.',
    note: 'Never decorative. If it appears, it means something.' },

  midnightNavy: { hex: '#0F1D38', role: 'Cover ground, spine, divider fields.',
    note: 'Deeper than the primary so gold reads as foil against it.' },
  imperialBlue: { hex: '#16306B', role: 'Secondary display, running heads, tinted panels.',
    note: 'Bridges midnight and royal so the blues read as one family.' },
  // Its stated role was "Level V identity" until the level palettes
  // became generated in OKLCH, at which point Level V acquired a
  // computed ink and this colour had no job. Rather than leave a
  // specification describing a use that no longer exists — or invent a
  // decorative one to justify keeping it — it is re-roled to the place
  // it genuinely belongs: a material colour in the finishing
  // specification, where it is specified for cloth and ribbon.
  richBurgundy: { hex: '#5E1A26', role: 'Material colour: case cloth, second ribbon, head bands.',
    note: 'Crimson taken to book-cloth weight. Specified for finishing, not for ink on the page.' },

  ivory: { hex: '#FBF8F0', role: 'Title-page and divider paper.',
    note: 'Warm white. Reads as stock, not as an unprinted screen.' },
  pearlWhite: { hex: '#FAFBFC', role: 'Text paper for the curriculum pages.',
    note: 'A hair cool, so long reading does not tire the eye.' },
  softCream: { hex: '#F6F1E4', role: 'Panels, sidebars, quoted matter.',
    note: 'The tint that carries editorial apparatus.' },
  champagneGold: { hex: '#E4D5A8', role: 'Hairlines and ornament on dark grounds.',
    note: 'Gold at 20% weight — visible without competing with the type.' },
  bronze: { hex: '#7A5C2E', role: 'Gold set as TEXT on light paper; guilloché shadow; foil lowlights.',
    note: 'Royal Gold reaches only 2.8:1 on the text paper, so it may never carry type there. '
      + 'Bronze is the same hue taken to 6:1 — the reading-safe gold.' },
  platinum: { hex: '#D8DCE3', role: 'Rules, table borders, ghosted states.',
    note: 'Cool grey with a blue cast so it belongs to the primary.' },
  slateGrey: { hex: '#6B7280', role: 'Metadata, captions, timings, folios.',
    note: 'Recessive by design: apparatus should not read as content.' },
  warmCharcoal: { hex: '#2E2A26', role: 'Body text.',
    note: 'Not black. Pure black on warm paper reads as a hole.' },
};

/** Flat lookup, for CSS custom-property emission. */
export const C = Object.fromEntries(Object.entries(COLOURS).map(([k, v]) => [k, v.hex]));

/**
 * The six level identities, generated in OKLCH at fixed lightness and
 * chroma so that only hue varies.
 *
 * These were hand-picked hexes until this pass. They looked like a
 * family because they had been chosen to, and measurement said they
 * were not one: the ink luminances spanned a 2.24× range, so the greens
 * and golds read visibly lighter than the blues and violets and the
 * ascent sagged in the middle when the six dividers were seen in
 * sequence. Generated at one lightness the spread is 1.23×, which is
 * about as close to perceptually equal as sRGB allows once each hue has
 * been gamut-mapped.
 *
 * See colour.mjs for the space, the gamut mapping and the hue rotation.
 */
export const LEVEL_PALETTES = OKLCH_PALETTES;

export const BRAND = {
  ink: C.royalBlue,
  deep: C.midnightNavy,
  imperial: C.imperialBlue,
  gold: C.royalGold,
  goldLight: C.champagneGold,
  bronze: C.bronze,
  crimson: C.deepCrimson,
  soft: C.slateGrey,
  rule: C.platinum,
  paper: C.pearlWhite,
  cream: C.ivory,
  panel: C.softCream,
  body: C.warmCharcoal,
};

/**
 * The typographic system, declared once so the print edition, the
 * editable edition and the typography specification cannot disagree
 * about what the book is set in.
 *
 * TWO FAMILIES, NO MORE. A serif for everything a reader reads
 * continuously, a humanist sans for everything a reader scans —
 * headings, timings, folios, apparatus. The distinction is functional:
 * a teacher scanning for the speaking activity should be able to find
 * it by texture before reading a word.
 *
 * The stacks are chosen from faces present on the systems this will be
 * opened on, with metric-compatible fallbacks named in order. A
 * flagship edition that renders in Times because a licensed face was
 * assumed is not a flagship edition.
 */
export const TYPE = {
  serif: 'Cambria, "Nimbus Roman", Georgia, "Times New Roman", serif',
  sans: 'Calibri, "Nimbus Sans", "Segoe UI", Arial, sans-serif',
  display: 'Cambria, "Nimbus Roman", Georgia, serif',
  scale: {
    coverTitle: 46, levelNumeral: 118, levelTitle: 34, chapterTitle: 19,
    moduleTitle: 16, lessonTitle: 12.5, lead: 11, body: 9.6, apparatus: 8.4,
    caption: 7.6, micro: 6.6,
  },
  measure: '31em',
  baseline: 1.58,
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
    // The ghosted bars take the LEVEL's own wash, not a fixed grey. A
    // cool grey against the warm levels read as a foreign object on the
    // page — the one element of the divider that did not belong to it.
    return `<rect x="${i * 22}" y="${64 - h}" width="12" height="${h}" rx="1.5"
      fill="${on ? palette.mid : palette.wash}"
      ${on ? '' : `stroke="${palette.mid}" stroke-width="0.6" stroke-opacity="0.35"`}
      ${i === idx ? `stroke="${palette.ink}" stroke-width="1.5"` : ''}/>`;
  }).join('');
  return `<svg viewBox="0 0 122 66" width="122" height="66" role="img"
    aria-label="Level ${currentRoman} of six in the IEFC ascent">${bars}</svg>`;
}
