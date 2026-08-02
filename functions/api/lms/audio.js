// GET /api/lms/audio?id=aud_xxx
// One audio asset with its ordered transcript cues. `isRecorded` and
// `isSynchronised` are computed server-side (see content.js) so the
// client never has to infer from a null URL whether a recording exists
// — it renders the player or the script view from an explicit flag.
import { jsonResponse, errorResponse, ValidationError } from '../../_lib/db.js';
import { requireUser } from '../../_lib/auth/session.js';
import { getAudioAsset } from '../../_lib/lms/content.js';

export async function onRequestGet({ request, env }) {
  try {
    await requireUser(request, env);
    const id = new URL(request.url).searchParams.get('id');
    if (!id) throw new ValidationError('Provide ?id=<audioAssetId>.', { id: 'Required' });
    return jsonResponse(await getAudioAsset(env, { audioAssetId: id }));
  } catch (err) {
    return errorResponse(err);
  }
}
