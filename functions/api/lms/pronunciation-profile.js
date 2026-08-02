// GET /api/lms/pronunciation-profile?levelId=3
// The signed-in learner's own per-dimension pronunciation profile.
// Never takes a user id: always the caller's own data, by
// construction, matching /api/student/dashboard's rule.
import { jsonResponse, errorResponse } from '../../_lib/db.js';
import { requireUser } from '../../_lib/auth/session.js';
import { getPronunciationProfile } from '../../_lib/lms/content.js';

export async function onRequestGet({ request, env }) {
  try {
    const user = await requireUser(request, env);
    const raw = new URL(request.url).searchParams.get('levelId');
    const levelId = raw === null || raw === '' ? null : Number(raw);
    return jsonResponse(await getPronunciationProfile(env, { userId: user.id, levelId }));
  } catch (err) {
    return errorResponse(err);
  }
}
