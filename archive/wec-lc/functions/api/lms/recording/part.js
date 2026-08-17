// PUT /api/lms/recording/part?id=rec_x&part=1
//
// The body is raw audio bytes, not JSON — a base64 envelope would cost
// a third more bandwidth on the one request where a learner is most
// likely to be on a poor connection.
//
// The part is streamed to R2 rather than buffered: a Worker holding a
// whole part in memory scales badly and gains nothing, since R2 wants a
// stream anyway. The byte count comes from Content-Length, which the
// storage layer then checks against the running total — a client's
// declared size is a claim, and the cap is enforced against what
// actually arrives.
import { jsonResponse, errorResponse, ValidationError } from '../../../_lib/db.js';
import { requireUser } from '../../../_lib/auth/session.js';
import { uploadRecordingPart } from '../../../_lib/lms/recording-storage.js';

export async function onRequestPut({ request, env }) {
  try {
    const user = await requireUser(request, env);
    const url = new URL(request.url);
    const id = url.searchParams.get('id');
    const part = Number(url.searchParams.get('part'));
    if (!id) throw new ValidationError('id is required.', { id: 'Required' });
    if (!Number.isInteger(part) || part < 1) throw new ValidationError('part must be a positive integer.', { part: 'Invalid' });

    const declared = Number(request.headers.get('content-length'));
    if (!Number.isInteger(declared) || declared <= 0) {
      throw new ValidationError('A Content-Length header is required for an upload part.', { 'content-length': 'Required' });
    }
    if (!request.body) throw new ValidationError('Request body is empty.', { body: 'Required' });

    const result = await uploadRecordingPart(env, {
      userId: user.id, recordingId: id, partNumber: part, body: request.body, bytes: declared,
    });
    return jsonResponse(result);
  } catch (err) {
    return errorResponse(err);
  }
}
