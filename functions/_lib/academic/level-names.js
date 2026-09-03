/* THE SIX LEVELS, NAMED IN BOTH LANGUAGES.
 *
 * ─────────────────────────────────────────────────────────────────────
 * THE FAULT THIS FILE CORRECTS
 * ─────────────────────────────────────────────────────────────────────
 * `programme_levels.name` holds one string — "Upper Intermediate
 * Programme" — and every API that answers with a level answers with
 * that. The Arabic editions have carried published Arabic names since
 * the level pages were generated, but they live in
 * `scripts/lib/arabic-kit.js`, which is a CommonJS module in the build
 * toolchain: no endpoint can reach it and no browser can.
 *
 * So an Arabic learner reading their own payment confirmation was told,
 * in the middle of an Arabic sentence, that they had paid for the
 * "English Mastery Programme". Found by rendering the page, not by
 * reading it.
 *
 * ─────────────────────────────────────────────────────────────────────
 * WHY HERE AND NOT IN THE SCHEMA
 * ─────────────────────────────────────────────────────────────────────
 * A `name_ar` column would be the tidier home, and it is where this
 * should end up. It is not here yet because the six names are a
 * PUBLISHED FACT that already has a source of truth — the kit the level
 * pages are generated from — and adding a column would create a second
 * one that a migration could silently leave empty. A module the
 * endpoints can import gives the same answer today with no window in
 * which the two disagree, and `tests/level-names.test.mjs` fails the
 * build if this file and the kit ever stop matching.
 *
 * Adopting it elsewhere is deliberate work, not a sweep: every endpoint
 * that answers with a level name should hand back `nameAr` beside
 * `name` and let the page choose. The payment surfaces do; the rest is
 * recorded in docs/platform-capabilities.md § 11.
 */

/** Keyed by `programme_levels.id`. */
export const LEVEL_NAMES_AR = {
  1: 'برنامج التأسيس',
  2: 'البرنامج الابتدائي',
  3: 'البرنامج المتوسط',
  4: 'المتوسط المتقدم',
  5: 'البرنامج المتقدم',
  6: 'برنامج الإتقان',
};

/** The ordinal an Arabic reader expects where the English says "I". */
export const LEVEL_ORDINALS_AR = {
  1: 'الأول', 2: 'الثاني', 3: 'الثالث', 4: 'الرابع', 5: 'الخامس', 6: 'السادس',
};

/**
 * A level, named for a reader.
 *
 * Falls back to the English name rather than to an empty string: a
 * seventh level added tomorrow should read as its English name on an
 * Arabic page, which is legible, and not vanish, which is not.
 */
export function levelName(level, language = 'en') {
  if (!level) return null;
  if (language !== 'ar') return level.name;
  return LEVEL_NAMES_AR[level.id] || level.name;
}

/** Both names, for a payload that lets the page choose. */
export function levelNaming(level) {
  if (!level) return null;
  return {
    id: level.id,
    roman: level.roman,
    cefr: level.cefr,
    name: level.name,
    nameAr: LEVEL_NAMES_AR[level.id] || null,
    ordinalAr: LEVEL_ORDINALS_AR[level.id] || null,
  };
}
