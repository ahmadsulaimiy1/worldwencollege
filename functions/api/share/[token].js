// GET /api/share/<token> — a record slice a graduate shared.
//
// PUBLIC by necessity: the recipient is an employer or a registrar who
// has no account and should not need one. The token IS the
// authorisation, which is why it is high-entropy, expiring, revocable
// and stored only as a hash.
//
// 200 for every well-formed answer, including a link that no longer
// works. A 404 would make an ordinary withdrawal look like an outage,
// and the holder would email the graduate to say the College's systems
// are broken.
import { jsonResponse, errorResponse } from '../../_lib/db.js';
import { viewShare } from '../../_lib/registry/profile.js';

export async function onRequestGet({ params, env }) {
  try {
    return jsonResponse(await viewShare(env, { token: params.token }));
  } catch (err) { return errorResponse(err); }
}
