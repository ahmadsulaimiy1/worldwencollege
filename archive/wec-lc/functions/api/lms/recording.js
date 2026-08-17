// POST /api/lms/recording
// A learner submits a voice recording against a listening (shadowing)
// or pronunciation (drill) item. Attempts accumulate rather than
// overwrite — see submitLearnerRecording().
import { jsonResponse, errorResponse, ValidationError } from '../../_lib/db.js';
import { requireUser } from '../../_lib/auth/session.js';
import { submitLearnerRecording } from '../../_lib/lms/content.js';

export async function onRequestPost({ request, env }) {
  try {
    const user = await requireUser(request, env);
    const body = await request.json().catch(() => { throw new ValidationError('Body must be JSON.', {}); });
    const { learningItemId, mediaUrl, durationMs } = body || {};
    if (!learningItemId) throw new ValidationError('learningItemId is required.', { learningItemId: 'Required' });
    const result = await submitLearnerRecording(env, {
      userId: user.id, learningItemId, mediaUrl, durationMs: durationMs ?? null,
    });
    return jsonResponse(result, 201);
  } catch (err) {
    return errorResponse(err);
  }
}
