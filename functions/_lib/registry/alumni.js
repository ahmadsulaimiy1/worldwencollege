/**
 * The WorldWide English College Alumni Society, and its six chapters.
 *
 * ────────────────────────────────────────────────────────────────────
 * MEMBERSHIP IS DERIVED, NEVER STORED
 * ────────────────────────────────────────────────────────────────────
 * A graduate belongs to the chapter of their highest LIVE award. That
 * is already a fact in the awards table, and writing it down a second
 * time here would create a second answer to the same question — one
 * that goes wrong the first moment an award is revoked or replaced and
 * nobody remembers to update the copy.
 *
 * So there is no membership table. `chapterFor()` reads the register.
 *
 * ────────────────────────────────────────────────────────────────────
 * WHAT IS NOT INVENTED
 * ────────────────────────────────────────────────────────────────────
 * No officers. No founding dates for chapters. No member counts
 * presented as achievements. The Society exists because the Executive
 * established it; its chapters have no officers because nobody has been
 * elected, and a President appointed by a migration would be precisely
 * the fabrication this project has refused everywhere else.
 */

const db = (env) => env.DB;

export const SOCIETY = {
  code: 'WECAS',
  name: 'WorldWide English College Alumni Society',
  // Said plainly, because a society page that did not say this would
  // imply an active organisation with a programme of events.
  status: 'Established. Chapters are constituted by award; officers are '
    + 'elected by members once a chapter has members enough to hold an election.',
};

/** The six chapters, in award order. */
export async function chapters(env) {
  const { results } = await db(env).prepare(
    `SELECT c.id, c.level_id AS levelId, c.name, c.award_title AS awardTitle,
            c.post_nominal AS postNominal, c.description, c.officers_elected AS officersElected,
            l.roman, l.cefr
       FROM alumni_chapters c JOIN programme_levels l ON l.id = c.level_id
      ORDER BY c.level_id`).all();
  return results.map((r) => ({ ...r, officersElected: !!r.officersElected }));
}

/**
 * The chapter a graduate belongs to — the one for their highest live
 * award — or null if they hold none.
 *
 * 'conferred' only. A revoked award confers no membership, and a
 * replaced one is superseded by its replacement, which is itself
 * conferred and will be found instead.
 */
export async function chapterFor(env, { userId }) {
  const row = await db(env).prepare(
    `SELECT c.id, c.level_id AS levelId, c.name, c.award_title AS awardTitle,
            c.post_nominal AS postNominal, c.description, c.officers_elected AS officersElected,
            a.conferred_on AS since
       FROM awards a JOIN alumni_chapters c ON c.level_id = a.level_id
      WHERE a.user_id = ? AND a.status = 'conferred'
      ORDER BY a.level_id DESC LIMIT 1`).bind(userId).all();
  const r = row.results[0];
  if (!r) return null;
  return {
    society: SOCIETY.name,
    ...r,
    officersElected: !!r.officersElected,
    // How they came to be a member, so the profile can say it rather
    // than asserting membership as a bare fact.
    basis: `Automatic, by conferral of the ${r.awardTitle}.`,
  };
}

/**
 * The Society's own summary: how many graduates each chapter holds.
 *
 * Reports real counts, including zeros. A chapter with no members is
 * not hidden — the Society is new, most chapters are empty, and an
 * interface that showed only the populated ones would imply the others
 * do not exist.
 */
export async function roll(env) {
  const list = await chapters(env);
  const { results } = await db(env).prepare(
    `SELECT level_id AS levelId, COUNT(DISTINCT user_id) AS n
       FROM awards WHERE status = 'conferred' GROUP BY level_id`).all();
  const counts = new Map(results.map((r) => [r.levelId, r.n]));

  // A graduate holding Level V and Level III belongs to ONE chapter —
  // Orator — so summing the per-level counts would overstate the
  // Society. Each graduate is counted at their highest award only.
  const { results: highest } = await db(env).prepare(
    `SELECT MAX(level_id) AS levelId, user_id
       FROM awards WHERE status = 'conferred' GROUP BY user_id`).all();
  const byHighest = new Map();
  for (const h of highest) byHighest.set(h.levelId, (byHighest.get(h.levelId) || 0) + 1);

  return {
    society: SOCIETY,
    chapters: list.map((c) => ({
      ...c,
      members: byHighest.get(c.levelId) || 0,
      // The count of everyone who ever held this level's award, which is
      // a different and also true number. Named differently so the two
      // can never be confused for one another.
      awardHolders: counts.get(c.levelId) || 0,
    })),
    members: [...byHighest.values()].reduce((a, b) => a + b, 0),
  };
}
