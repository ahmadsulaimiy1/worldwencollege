/**
 * The Executive Portrait Policy, as code.
 *
 *   Every graduate MAY upload a professional portrait. It is optional,
 *   never required. Square, professional appearance. Reviewed before
 *   publication. Removed immediately if an award is withdrawn or at the
 *   graduate's request. Certificates and verification remain valid
 *   regardless of portrait status.
 *
 * ────────────────────────────────────────────────────────────────────
 * THE CLAUSE WITH TEETH
 * ────────────────────────────────────────────────────────────────────
 * "Certificates and verification remain valid regardless of portrait
 * status" is the one that has to be enforced rather than believed. It
 * is enforced structurally: nothing in this module touches the awards
 * table, the signature records or the register chain, and the portrait
 * lives on the profile so that no query CAN filter awards by it.
 * tests/portraits.test.mjs asserts a verification is byte-identical
 * before and after a portrait is removed.
 *
 * ────────────────────────────────────────────────────────────────────
 * REVIEWED BEFORE PUBLICATION
 * ────────────────────────────────────────────────────────────────────
 * An upload enters `pending_review` and is visible to nobody but the
 * graduate and the reviewer. There is no argument to submit() that
 * publishes directly, for the same reason there is none on a
 * distinction: a function that could would eventually be called that
 * way.
 */

const db = (env) => env.DB;

// The states, and what each means to a reader.
export const STATUS = {
  none: 'No portrait has been provided.',
  pending_review: 'A portrait has been submitted and is awaiting review.',
  published: 'A reviewed portrait is published.',
  rejected: 'A submitted portrait was not accepted for publication.',
  removed: 'A portrait was published and has since been removed.',
};

/**
 * Record a submitted portrait. `key` is the object key in storage; the
 * bytes are written by the caller, because this module governs the
 * policy and not the transport.
 */
export async function submit(env, { userId, key, now = Date.now() }) {
  if (!key || typeof key !== 'string') throw new Error('a portrait submission needs a storage key');

  await db(env).prepare(
    `UPDATE graduate_profiles
        SET portrait_key = ?, portrait_status = 'pending_review',
            portrait_submitted_at = ?, portrait_reviewed_by = NULL,
            portrait_reviewed_at = NULL, portrait_note = NULL
      WHERE user_id = ?`)
    .bind(key, new Date(now).toISOString(), userId).run();
  return { status: 'pending_review' };
}

/** Publish a reviewed portrait. Only from `pending_review`. */
export async function approve(env, { userId, reviewedBy, now = Date.now() }) {
  if (!reviewedBy) throw new Error('a portrait review must record who made it');
  const row = await current(env, { userId });
  if (!row) return { ok: false, reason: 'no_profile' };
  // Publishing something nobody reviewed is the one thing this whole
  // mechanism exists to prevent, so it is refused rather than tolerated.
  if (row.status !== 'pending_review') return { ok: false, reason: row.status };

  await db(env).prepare(
    `UPDATE graduate_profiles
        SET portrait_status = 'published', portrait_reviewed_by = ?, portrait_reviewed_at = ?
      WHERE user_id = ?`)
    .bind(reviewedBy, new Date(now).toISOString(), userId).run();
  return { ok: true, status: 'published' };
}

/**
 * Refuse a submitted portrait, with a reason.
 *
 * A graduate told only "rejected" cannot fix it, and an institution
 * that cannot say why it refused an image is one nobody can appeal to.
 */
export async function reject(env, { userId, reviewedBy, reason, now = Date.now() }) {
  if (!reviewedBy) throw new Error('a portrait review must record who made it');
  if (!reason || reason.trim().length < 10) {
    throw new Error('a rejection must state a reason of at least 10 characters');
  }
  const row = await current(env, { userId });
  if (!row) return { ok: false, reason: 'no_profile' };
  if (row.status !== 'pending_review') return { ok: false, reason: row.status };

  await db(env).prepare(
    `UPDATE graduate_profiles
        SET portrait_status = 'rejected', portrait_key = NULL, portrait_reviewed_by = ?,
            portrait_reviewed_at = ?, portrait_note = ?
      WHERE user_id = ?`)
    .bind(reviewedBy, new Date(now).toISOString(), reason.trim(), userId).run();
  return { ok: true, status: 'rejected' };
}

/**
 * Remove a portrait — at the graduate's request, or because an award
 * was withdrawn.
 *
 * The policy says "immediately", so the key is cleared in the same
 * statement that changes the status: a row that said 'removed' while
 * still holding the key would leave the image one bug away from being
 * served.
 */
export async function remove(env, { userId, reason, now = Date.now() }) {
  const row = await current(env, { userId });
  if (!row) return { ok: false, reason: 'no_profile' };
  if (row.status === 'none' || row.status === 'removed') return { ok: false, reason: row.status };

  await db(env).prepare(
    `UPDATE graduate_profiles
        SET portrait_status = 'removed', portrait_key = NULL,
            portrait_reviewed_at = ?, portrait_note = ?
      WHERE user_id = ?`)
    .bind(new Date(now).toISOString(), reason || null, userId).run();
  return { ok: true, status: 'removed', key: row.key };
}

/**
 * Remove the portraits of everyone whose award has been withdrawn.
 *
 * The policy's "removed immediately if an award is withdrawn" clause.
 * Written as a sweep rather than a hook inside revokeAward(), so that a
 * portrait removal can never fail a revocation: withdrawing an award is
 * the more important act of the two, and it must not be blocked by an
 * image.
 *
 * Only graduates with NO live award are swept. A graduate who holds
 * Level III and V and has V revoked is still a graduate.
 */
export async function sweepWithdrawn(env, { now = Date.now() } = {}) {
  const { results } = await db(env).prepare(
    `SELECT p.user_id AS userId FROM graduate_profiles p
      WHERE p.portrait_status IN ('pending_review','published')
        AND EXISTS (SELECT 1 FROM awards a WHERE a.user_id = p.user_id AND a.status = 'revoked')
        AND NOT EXISTS (SELECT 1 FROM awards a WHERE a.user_id = p.user_id AND a.status = 'conferred')`)
    .all();

  const removed = [];
  for (const r of results) {
    const out = await remove(env, {
      userId: r.userId,
      reason: 'Removed under the Executive Portrait Policy: no live award is held.',
      now,
    });
    if (out.ok) removed.push({ userId: r.userId, key: out.key });
  }
  return { removed, count: removed.length };
}

/** The portrait state for one graduate. */
export async function current(env, { userId }) {
  const r = await db(env).prepare(
    `SELECT portrait_key AS key, portrait_status AS status,
            portrait_submitted_at AS submittedAt, portrait_reviewed_at AS reviewedAt,
            portrait_note AS note
       FROM graduate_profiles WHERE user_id = ?`).bind(userId).first();
  if (!r) return null;
  return { ...r, meaning: STATUS[r.status] };
}

/**
 * What a public reader may see: the key, and only when published.
 *
 * A pending portrait is visible to nobody but its owner and the
 * reviewer. Returning a key for one would make "reviewed before
 * publication" a description of intent rather than of behaviour.
 */
export async function publicPortrait(env, { userId }) {
  const r = await current(env, { userId });
  return r && r.status === 'published' ? { key: r.key } : null;
}

/** Everything waiting for a reviewer, oldest first. */
export async function queue(env) {
  const { results } = await db(env).prepare(
    `SELECT p.user_id AS userId, p.display_name AS displayName, p.portrait_key AS key,
            p.portrait_submitted_at AS submittedAt
       FROM graduate_profiles p
      WHERE p.portrait_status = 'pending_review'
      ORDER BY p.portrait_submitted_at ASC`).all();
  return { items: results, count: results.length };
}
