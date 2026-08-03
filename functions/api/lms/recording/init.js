// POST /api/lms/recording/init   — open a resumable upload
// GET  /api/lms/recording/init?id=rec_x — what has already landed
//
// Two halves of the same question: the POST starts an upload, the GET
// answers "where did I get to?" after a dropped connection. Keeping
// them on one route means a client that can start an upload can always
// find out how to finish it.
import { jsonResponse, errorResponse, readJsonBody, ValidationError } from '../../../_lib/db.js';
import { requireUser } from '../../../_lib/auth/session.js';
import { initRecordingUpload, getUploadState } from '../../../_lib/lms/recording-storage.js';

export async function onRequestPost({ request, env }) {
  try {
    const user = await requireUser(request, env);
    const body = await readJsonBody(request);
    const { learningItemId, contentType, durationMs, declaredBytes } = body || {};
    if (!learningItemId) throw new ValidationError('learningItemId is required.', { learningItemId: 'Required' });
    const result = await initRecordingUpload(env, {
      userId: user.id,
      learningItemId,
      contentType,
      durationMs: durationMs ?? null,
      declaredBytes: declaredBytes ?? null,
    });
    return jsonResponse(result, 201);
  } catch (err) {
    return errorResponse(err);
  }
}

export async function onRequestGet({ request, env }) {
  try {
    const user = await requireUser(request, env);
    const id = new URL(request.url).searchParams.get('id');
    if (!id) throw new ValidationError('id is required.', { id: 'Required' });
    return jsonResponse(await getUploadState(env, { userId: user.id, recordingId: id }));
  } catch (err) {
    return errorResponse(err);
  }
}
