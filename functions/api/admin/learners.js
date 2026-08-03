// GET /api/admin/learners?q=<search>&limit=25   — find learners
// GET /api/admin/learners?id=usr_xxx            — one learner in full
//
// Staff only. Returns each learner's enrolments alongside them, because
// the question a staff member actually has is never "does this person
// exist" — it is "what do they have access to".
import { jsonResponse, errorResponse, ValidationError } from '../../_lib/db.js';
import { requireStaff } from '../../_lib/auth/session.js';
import { searchLearners, getLearner } from '../../_lib/admin/enrolments.js';

export async function onRequestGet({ request, env }) {
  try {
    await requireStaff(request, env);
    const url = new URL(request.url);
    const id = url.searchParams.get('id');
    if (id) return jsonResponse(await getLearner(env, { userId: id }));

    const limitRaw = url.searchParams.get('limit');
    const limit = limitRaw ? Number(limitRaw) : 25;
    if (limitRaw && !Number.isInteger(limit)) {
      throw new ValidationError('limit must be an integer.', { limit: 'Invalid' });
    }
    return jsonResponse(await searchLearners(env, { q: url.searchParams.get('q') || '', limit }));
  } catch (err) {
    return errorResponse(err);
  }
}
