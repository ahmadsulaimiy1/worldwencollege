// GET /api/lms/review-queue?levelId=3&status=submitted
// Staff-only. The pronunciation review queue, oldest first.
import { jsonResponse, errorResponse } from '../../_lib/db.js';
import { requireStaff } from '../../_lib/auth/session.js';
import { listRecordingsForReview } from '../../_lib/lms/content.js';

export async function onRequestGet({ request, env }) {
  try {
    await requireStaff(request, env);
    const q = new URL(request.url).searchParams;
    const levelId = q.get('levelId') ? Number(q.get('levelId')) : null;
    const status = q.get('status') || 'submitted';
    return jsonResponse(await listRecordingsForReview(env, { levelId, status }));
  } catch (err) {
    return errorResponse(err);
  }
}
