// GET /api/admin/pass-list
//
// Administrator only, standing in for the Registrar office governance
// C5 names (docs/governance-decisions.md) — the College has made no
// separate Registrar appointment yet. Lists confirmed pass-list entries
// still awaiting conferral, which is the administrator's own queue: the
// Examiner's confirmation authorises a conferral, it is not one.
import { jsonResponse, errorResponse } from '../../_lib/db.js';
import { requireAdmin } from '../../_lib/auth/session.js';
import { db } from '../../_lib/db.js';

export async function onRequestGet({ request, env }) {
  try {
    await requireAdmin(request, env);
    const { results } = await db(env)
      .prepare(`SELECT p.id, p.user_id AS userId, p.level_id AS levelId, p.notes, p.created_at AS createdAt,
                       u.email, u.preferred_name AS preferredName, l.roman, l.name AS levelName,
                       ex.email AS examinerEmail
         FROM pass_list_entries p
         JOIN users u ON u.id = p.user_id
         JOIN users ex ON ex.id = p.examiner_id
         JOIN programme_levels l ON l.id = p.level_id
         WHERE p.decision = 'confirmed' AND p.superseded = 0 AND p.conferred_award_id IS NULL
         ORDER BY p.created_at ASC`)
      .all();
    return jsonResponse({ count: results.length, entries: results });
  } catch (err) {
    return errorResponse(err);
  }
}
