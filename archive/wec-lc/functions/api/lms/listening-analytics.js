// GET /api/lms/listening-analytics?levelId=1
// The signed-in learner's own listening coverage and outcomes. Never
// takes a user id — always the caller's own data, matching the rule
// used by /api/student/dashboard.
import { jsonResponse, errorResponse, ValidationError } from '../../_lib/db.js';
import { requireUser } from '../../_lib/auth/session.js';
import { getListeningAnalytics } from '../../_lib/lms/content.js';

export async function onRequestGet({ request, env }) {
  try {
    const user = await requireUser(request, env);
    const raw = new URL(request.url).searchParams.get('levelId');
    if (!raw) throw new ValidationError('Provide ?levelId=<n>.', { levelId: 'Required' });
    return jsonResponse(await getListeningAnalytics(env, { userId: user.id, levelId: Number(raw) }));
  } catch (err) {
    return errorResponse(err);
  }
}
