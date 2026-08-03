// POST   /api/lms/recording/complete  — assemble the parts, commit
// DELETE /api/lms/recording/complete?id=rec_x — abandon the attempt
//
// Completion is where a pile of parts becomes a take: the object is
// assembled, read back, fingerprinted, stamped with whatever retention
// policy is in force, and only then does the row say 'stored'. Nothing
// is called stored on the strength of the parts having been accepted.
import { jsonResponse, errorResponse, readJsonBody, ValidationError } from '../../../_lib/db.js';
import { requireUser } from '../../../_lib/auth/session.js';
import { completeRecordingUpload, abandonRecordingUpload } from '../../../_lib/lms/recording-storage.js';

export async function onRequestPost({ request, env }) {
  try {
    const user = await requireUser(request, env);
    const body = await readJsonBody(request);
    const { recordingId, durationMs } = body || {};
    if (!recordingId) throw new ValidationError('recordingId is required.', { recordingId: 'Required' });
    const result = await completeRecordingUpload(env, {
      userId: user.id, recordingId, durationMs: durationMs ?? null,
    });
    return jsonResponse(result, 201);
  } catch (err) {
    return errorResponse(err);
  }
}

export async function onRequestDelete({ request, env }) {
  try {
    const user = await requireUser(request, env);
    const id = new URL(request.url).searchParams.get('id');
    if (!id) throw new ValidationError('id is required.', { id: 'Required' });
    return jsonResponse(await abandonRecordingUpload(env, { userId: user.id, recordingId: id }));
  } catch (err) {
    return errorResponse(err);
  }
}
