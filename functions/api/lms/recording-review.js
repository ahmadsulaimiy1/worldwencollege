// POST /api/lms/recording-review
// Staff-only. Instructor feedback on a learner recording, optionally
// carrying a spoken-feedback asset and the five pronunciation
// sub-scores. Automated scorers write through the same lib function
// with source='automated'; this endpoint is the human path and is
// gated accordingly.
import { jsonResponse, errorResponse, ValidationError } from '../../_lib/db.js';
import { requireStaff } from '../../_lib/auth/session.js';
import { reviewRecording } from '../../_lib/lms/content.js';

export async function onRequestPost({ request, env }) {
  try {
    const staff = await requireStaff(request, env);
    const body = await request.json().catch(() => { throw new ValidationError('Body must be JSON.', {}); });
    const { recordingId, comment, scores, audioAssetId } = body || {};
    if (!recordingId) throw new ValidationError('recordingId is required.', { recordingId: 'Required' });
    const result = await reviewRecording(env, {
      recordingId, source: 'instructor', reviewerId: staff.id,
      comment: comment ?? null, scores: scores || {}, audioAssetId: audioAssetId ?? null,
    });
    return jsonResponse(result);
  } catch (err) {
    return errorResponse(err);
  }
}
