/**
 * Academic distinctions — the part of a record that is not a mark.
 *
 * Leadership, presentation, research, service and prizes. One mechanism
 * rather than five, because the institution treats them identically:
 * somebody claims it, somebody with authority approves it, evidence
 * supports it, and a withdrawal leaves a trail rather than a gap.
 *
 * ────────────────────────────────────────────────────────────────────
 * NOTHING HERE IS INFERRED
 * ────────────────────────────────────────────────────────────────────
 * The platform can see that a learner attended twelve live sessions. It
 * cannot see that they chaired one. "Led a seminar" is a human
 * observation, and a record generated from attendance data would be a
 * fabrication with a timestamp on it — the most credible kind.
 *
 * So every distinction enters as a `proposed` claim made by a person,
 * and only a person can approve it.
 */

import { LEVEL_NAMES_AR, LEVEL_ORDINALS_AR } from '../academic/level-names.js';

const KINDS = ['leadership', 'presentation', 'research', 'service', 'prize'];

// What each kind means, in the words the profile shows a reader. Held
// here rather than in the page so the API and every interface over it
// describe a record the same way.
const KIND_LABEL = {
  leadership: 'Leadership',
  presentation: 'Presentation',
  research: 'Research and projects',
  service: 'Service to the College',
  prize: 'Prize',
};

// The same five, for an Arabic reader. Handed back beside the English
// rather than instead of it, so one payload serves both editions and
// the page chooses — the rule the level names and the honours follow.
const KIND_LABEL_AR = {
  leadership: 'قيادة',
  presentation: 'إلقاء وعرض',
  research: 'بحث ومشاريع',
  service: 'خدمة الكلية',
  prize: 'جائزة',
};

const db = (env) => env.DB;

export function kinds() {
  return KINDS.map((k) => ({ kind: k, label: KIND_LABEL[k], labelAr: KIND_LABEL_AR[k] }));
}

/**
 * Record a claim. Always `proposed`: there is no argument that makes an
 * approved one, so no caller can accidentally grant approval by passing
 * a flag, and no future caller can do it deliberately without changing
 * this file.
 */
export async function propose(env, { userId, kind, title, summary = null, levelId = null, awardedOn, awardedBy = null, evidenceUrl = null }) {
  if (!KINDS.includes(kind)) throw new Error(`unknown kind of distinction: ${kind}`);
  if (!userId || !title || !awardedOn) throw new Error('a distinction needs a holder, a title and a date');
  if (!/^\d{4}-\d{2}-\d{2}$/.test(awardedOn)) throw new Error('awardedOn must be a date, not a timestamp');

  const id = 'dst_' + crypto.randomUUID();
  await db(env).prepare(
    `INSERT INTO academic_distinctions
       (id, user_id, kind, title, summary, level_id, awarded_on, awarded_by, evidence_url, status)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, 'proposed')`)
    .bind(id, userId, kind, title, summary, levelId, awardedOn, awardedBy, evidenceUrl).run();
  return { id, status: 'proposed' };
}

export async function approve(env, { id, approvedBy, now = Date.now() }) {
  if (!approvedBy) throw new Error('an approval must record who made it');
  const row = await db(env).prepare('SELECT status FROM academic_distinctions WHERE id = ?').bind(id).first();
  if (!row) return { ok: false, reason: 'not_found' };
  if (row.status !== 'proposed') return { ok: false, reason: row.status };

  await db(env).prepare(
    "UPDATE academic_distinctions SET status = 'approved', approved_by = ?, approved_at = ? WHERE id = ?")
    .bind(approvedBy, new Date(now).toISOString(), id).run();
  return { ok: true };
}

/**
 * Withdraw a distinction. It stays on the record, marked — the same
 * rule the awards register follows. A record that can quietly lose
 * entries is not a record, and an employer who saw a distinction last
 * month is entitled to find out it was withdrawn rather than to find
 * nothing.
 */
export async function withdraw(env, { id, reason, now = Date.now() }) {
  if (!reason || reason.trim().length < 10) {
    throw new Error('a withdrawal must state a reason of at least 10 characters');
  }
  const row = await db(env).prepare('SELECT status FROM academic_distinctions WHERE id = ?').bind(id).first();
  if (!row) return { ok: false, reason: 'not_found' };
  if (row.status === 'withdrawn') return { ok: false, reason: 'already_withdrawn' };

  await db(env).prepare(
    "UPDATE academic_distinctions SET status = 'withdrawn', withdrawn_at = ?, withdrawn_reason = ? WHERE id = ?")
    .bind(new Date(now).toISOString(), reason.trim(), id).run();
  return { ok: true };
}

/**
 * One person's distinctions.
 *
 * `audience` decides what comes back, and the default is the safest
 * one. A public reader sees approved records only: a proposed
 * distinction is somebody's unverified claim, and publishing it under
 * the College's name would make the College the one asserting it.
 */
export async function forUser(env, { userId, audience = 'public' }) {
  const rows = audience === 'self' || audience === 'staff'
    ? (await db(env).prepare(
      `SELECT d.*, l.roman, l.name AS levelName FROM academic_distinctions d
         LEFT JOIN programme_levels l ON l.id = d.level_id
        WHERE d.user_id = ? ORDER BY d.awarded_on DESC`).bind(userId).all()).results
    : (await db(env).prepare(
      `SELECT d.*, l.roman, l.name AS levelName FROM academic_distinctions d
         LEFT JOIN programme_levels l ON l.id = d.level_id
        WHERE d.user_id = ? AND d.status IN ('approved','withdrawn')
        ORDER BY d.awarded_on DESC`).bind(userId).all()).results;

  const items = rows.map((r) => ({
    id: r.id,
    kind: r.kind,
    kindLabel: KIND_LABEL[r.kind],
    kindLabelAr: KIND_LABEL_AR[r.kind] || null,
    title: r.title,
    summary: r.summary,
    level: r.level_id ? {
      id: r.level_id, roman: r.roman, ordinalAr: LEVEL_ORDINALS_AR[r.level_id] || null,
      name: r.levelName, nameAr: LEVEL_NAMES_AR[r.level_id] || null,
    } : null,
    awardedOn: r.awarded_on,
    awardedBy: r.awarded_by,
    evidenceUrl: r.evidence_url,
    status: r.status,
    // The reason travels with a withdrawal. A reader told only that
    // something was withdrawn will assume the worst available
    // explanation, which is often not the true one.
    withdrawnReason: r.status === 'withdrawn' ? r.withdrawn_reason : null,
  }));

  return {
    items,
    approved: items.filter((i) => i.status === 'approved').length,
    // Grouped for display, in the framework's own order rather than by
    // whichever kind happens to be commonest.
    byKind: KINDS.map((k) => ({
      kind: k,
      label: KIND_LABEL[k],
      labelAr: KIND_LABEL_AR[k] || null,
      items: items.filter((i) => i.kind === k),
    })).filter((g) => g.items.length > 0),
  };
}
