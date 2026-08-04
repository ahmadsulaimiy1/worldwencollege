/**
 * THE STAGE ICON LANGUAGE.
 *
 * ────────────────────────────────────────────────────────────────────
 * WHY THESE REPLACED THE GLYPHS
 * ────────────────────────────────────────────────────────────────────
 * The previous edition marked each lesson stage with a typographic
 * character — ◆ for objectives, ≈ for listening, ✎ for writing. They
 * were serviceable and they were free, and they had two defects that
 * only became visible once the rest of the book was good.
 *
 * The first is that they were not a language. ◆ and ≈ and ✎ come from
 * three different type designers working centuries apart to unrelated
 * briefs; set beside each other at 8 pt they have different weights,
 * different optical sizes and different centres of gravity. A reader
 * does not consciously notice, but the column of marks down the outside
 * of a lesson reads as a jumble rather than as a system.
 *
 * The second is that a glyph is at the mercy of the font stack. If the
 * reader's machine lacks the character it renders as a box, and a book
 * whose navigation depends on ✎ is a book that can lose its navigation.
 *
 * ────────────────────────────────────────────────────────────────────
 * ONE CONSTRUCTION FOR ALL NINETEEN
 * ────────────────────────────────────────────────────────────────────
 * Every icon here is drawn on the same 24-unit grid, with the same
 * 1.6-unit stroke, the same round cap and join, and the same optical
 * margin of 2 units. Nothing is filled except where a filled mark is
 * the point. That is what makes them one family rather than nineteen
 * drawings: not a shared style, a shared construction.
 *
 * They are stroked rather than filled so they hold at 8 pt on paper —
 * a filled icon at that size fills in on uncoated stock and becomes a
 * blot. And they inherit `currentColor`, so a stage icon is always
 * exactly the colour of the level it sits in, with no per-level asset.
 */

const G = (body, { size = 14, colour = 'currentColor', width = 1.6 } = {}) =>
  `<svg class="ic" viewBox="0 0 24 24" width="${size}" height="${size}" aria-hidden="true"
    fill="none" stroke="${colour}" stroke-width="${width}" stroke-linecap="round"
    stroke-linejoin="round" xmlns="http://www.w3.org/2000/svg">${body}</svg>`;

/**
 * The nineteen marks, keyed by the stage type the parser assigns.
 *
 * Each is described by what it depicts, because six months from now the
 * path data will be unreadable and the intent will not be.
 */
const PATHS = {
  // A target with the arrow already in it: what the learner can do by the end.
  objectives: '<circle cx="12" cy="12" r="8.5"/><circle cx="12" cy="12" r="4"/>'
    + '<circle cx="12" cy="12" r="1" fill="currentColor" stroke="none"/>',
  // A key: what must already be secure before the door opens.
  prereq: '<circle cx="8" cy="12" r="3.5"/><path d="M11.5 12H20"/><path d="M17 12v3"/>'
    + '<path d="M20 12v2.5"/>',
  // A rising sun: activation at the start of the session.
  warmup: '<circle cx="12" cy="14" r="4"/><path d="M12 4v2.5M4.6 14H3M21 14h-1.6'
    + 'M6.2 8.2 5.1 7.1M17.8 8.2l1.1-1.1"/><path d="M3 19h18"/>',
  // A board with a line of new language on it, being presented.
  present: '<rect x="3" y="4" width="18" height="13" rx="1.5"/><path d="M7 9h10M7 12.5h6"/>'
    + '<path d="M12 17v3"/>',
  // Two figures, the second slightly behind: the teacher is still there.
  guided: '<circle cx="9" cy="8.6" r="2.9"/>'
    + '<path d="M3.4 18.6c.7-2.9 2.9-4.7 5.6-4.7s4.9 1.8 5.6 4.7"/>'
    + '<circle cx="17.4" cy="9.6" r="2.1" opacity=".55"/>'
    + '<path d="M15 18.6c.4-2 1.5-3.4 2.9-3.4 1.3 0 2.4 1.2 2.9 3" opacity=".55"/>',
  // One figure: unsupported use.
  independent: '<circle cx="12" cy="8.4" r="3.1"/>'
    + '<path d="M5.6 19c.8-3.2 3.3-5.2 6.4-5.2s5.6 2 6.4 5.2"/>',
  // A speech bubble with a tail: production in real time.
  speaking: '<path d="M20 12.5c0 3.6-3.6 6.5-8 6.5-1 0-2-.15-2.9-.42L4 20l1.6-3.2'
    + 'C4.6 15.9 4 14.3 4 12.5 4 8.9 7.6 6 12 6s8 2.9 8 6.5z"/><path d="M9 12h6"/>',
  // An ear: outer helix, inner curl, one arriving wavefront.
  listening: '<path d="M6.4 9.4a5.6 5.6 0 0 1 11.2 0c0 2.9-2 4.4-3.2 5.7-.9 1-1 2-1 3.2'
    + 'a2.4 2.4 0 0 1-4.8 0"/>'
    + '<path d="M9.6 9.6a2.4 2.4 0 0 1 4.8 0c0 1.2-.8 1.8-1.5 2.5"/>'
    + '<path d="M20.4 5.2a7 7 0 0 1 0 8.4" opacity=".5"/>',
  // An open book: reception for argument and detail.
  reading: '<path d="M12 7.5C10.2 6.2 8 5.5 4 5.5V18c4 0 6.2.7 8 2 1.8-1.3 4-2 8-2V5.5'
    + 'c-4 0-6.2.7-8 2z"/><path d="M12 7.5V20"/>',
  // A nib: production to a purpose and an audience.
  writing: '<path d="M4 20l1.2-4L16 5.2a2.1 2.1 0 0 1 3 3L8.2 19z"/><path d="M14.2 7l3 3"/>'
    + '<path d="M4 20h6"/>',
  // A waveform through a mouth aperture: form, stress, intelligibility.
  pronunciation: '<path d="M3 12h2.2l1.6-4.5 2 9 2-11 2 13.5 2-9.5 1.4 2.5H21"/>',
  // Two word cards, stacked. Deliberately sparse: the earlier version
  // carried three interior rules and filled to a blot at 13 pt.
  vocabulary: '<rect x="3" y="7.6" width="12.6" height="9.4" rx="1.5"/>'
    + '<path d="M7.4 4.6h11.1A2.5 2.5 0 0 1 21 7.1v9.4"/>'
    + '<path d="M6.4 12.3h5.8"/>',
  // A check inside a frame: the check that decides whether to move on.
  assess: '<rect x="4" y="4" width="16" height="16" rx="2"/><path d="M8.2 12.4l2.6 2.6L16 9.8"/>',
  // A lamp: bulb, collar, base. A prompt with no single right answer.
  thinking: '<path d="M12 2.8a6.2 6.2 0 0 0-3.6 11.3V16h7.2v-1.9A6.2 6.2 0 0 0 12 2.8z"/>'
    + '<path d="M9.4 18.6h5.2"/><path d="M10.4 21.1h3.2"/>',
  // A ruled grid: the criteria a piece of work is measured against.
  rubric: '<rect x="3.5" y="5" width="17" height="14" rx="1.5"/><path d="M3.5 9.5h17"/>'
    + '<path d="M9.5 9.5V19"/><path d="M3.5 14.25h17"/>',
  // A numbered list: do this, then this.
  instructions: '<path d="M9 7h11M9 12h11M9 17h11"/><path d="M4 6.2h1.4V9"/>'
    + '<path d="M4.1 11.4a1.3 1.3 0 0 1 2.1 1c0 .9-2.1 1.7-2.1 2.6h2.2"/>'
    + '<path d="M4.2 16.2h2l-1.1 1.4a1.2 1.2 0 1 1-1 1.9"/>',
  // A house: consolidation between sessions.
  homework: '<path d="M4 10.5 12 4l8 6.5V19a1.5 1.5 0 0 1-1.5 1.5h-13A1.5 1.5 0 0 1 4 19z"/>'
    + '<path d="M9.5 20.5v-6h5v6"/>',
  // A plus inside an outward arrow: for those who want further.
  extension: '<circle cx="12" cy="12" r="8.5"/><path d="M12 8.2v7.6M8.2 12h7.6"/>',
  // A closed return: deliberate return to earlier material.
  revision: '<path d="M20 12a8 8 0 1 1-2.6-5.9"/><path d="M20 4.5V9h-4.5"/>',
};

/** The icon for a stage type, or null if the type is not one of the nineteen. */
export function stageIcon(kind, opts) {
  return PATHS[kind] ? G(PATHS[kind], opts) : null;
}

/** Every key, so the legend and the specification cannot drift from the set. */
export const ICON_KEYS = Object.keys(PATHS);

/**
 * A generic mark for a stage the parser did not classify. A small open
 * lozenge — deliberately the quietest thing in the set, because an
 * unclassified stage should not shout for attention it has not earned.
 */
export const GENERIC_ICON = G('<path d="M12 6.5 17.5 12 12 17.5 6.5 12z"/>');
