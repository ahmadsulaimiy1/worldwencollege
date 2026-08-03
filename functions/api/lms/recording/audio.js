// GET /api/lms/recording/audio?id=rec_x
//
// The only way to hear a learner's recording. The bucket is private and
// stays private: there is no signed public URL, because a link that
// works without a session is a link that keeps working after one ends,
// and this is somebody's voice.
//
// Range requests are honoured so an instructor can scrub through a take
// without downloading it whole — a reviewer listening to twenty
// submissions should not pay for twenty full transfers.
import { errorResponse, NotFoundError, ValidationError } from '../../../_lib/db.js';
import { requireUser } from '../../../_lib/auth/session.js';
import { getRecordingObject } from '../../../_lib/lms/recording-storage.js';

export async function onRequestGet({ request, env }) {
  try {
    const user = await requireUser(request, env);
    const id = new URL(request.url).searchParams.get('id');
    if (!id) throw new ValidationError('id is required.', { id: 'Required' });

    const range = parseRange(request.headers.get('range'));
    const obj = await getRecordingObject(env, { recordingId: id, requester: user, range });

    const headers = {
      'Content-Type': obj.contentType,
      'Accept-Ranges': 'bytes',
      // Learner voice must never sit in a shared cache, and a browser
      // that reuses it after sign-out would be doing the same thing on
      // a smaller scale.
      'Cache-Control': 'private, no-store',
      'X-Content-Type-Options': 'nosniff',
      // Not a browsing document. Forcing a download disposition stops a
      // crafted content type from being rendered as anything else.
      'Content-Disposition': `attachment; filename="${id}"`,
    };
    if (obj.sha256) headers['X-Recording-SHA256'] = obj.sha256;

    if (range && obj.range && obj.size != null) {
      const start = obj.range.offset ?? range.offset;
      const length = obj.range.length ?? (obj.size - start);
      headers['Content-Range'] = `bytes ${start}-${start + length - 1}/${obj.size}`;
      headers['Content-Length'] = String(length);
      return new Response(obj.body, { status: 206, headers });
    }
    if (obj.size != null) headers['Content-Length'] = String(obj.size);
    return new Response(obj.body, { status: 200, headers });
  } catch (err) {
    // A missing object and an unauthorised one both surface as 404 from
    // the storage layer, deliberately — see getRecordingObject().
    if (err instanceof NotFoundError || err instanceof ValidationError) return errorResponse(err);
    return errorResponse(err);
  }
}

// Only `bytes=N-` and `bytes=N-M` — the forms a media element actually
// sends. A suffix range (`bytes=-N`) needs the object size to resolve
// and is declined rather than guessed at.
function parseRange(header) {
  if (!header) return null;
  const m = /^bytes=(\d+)-(\d*)$/.exec(header.trim());
  if (!m) return null;
  const offset = Number(m[1]);
  if (!m[2]) return { offset };
  const end = Number(m[2]);
  if (end < offset) return null;
  return { offset, length: end - offset + 1 };
}
