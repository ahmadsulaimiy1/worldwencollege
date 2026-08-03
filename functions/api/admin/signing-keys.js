// GET /api/admin/signing-keys — the key register and its audit.
//
// ADMINISTRATOR only. Rotation and revocation are not exposed over HTTP
// at all: revoking a key invalidates every credential it ever signed,
// and that is not an operation to make reachable by a request. It is run
// deliberately, by a person, against the database.
//
// The listing carries no private material — the same query the public
// JWKS uses — plus the operational fields an administrator needs and the
// public has no use for.
import { jsonResponse, errorResponse } from '../../_lib/db.js';
import { requireAdmin } from '../../_lib/auth/session.js';
import { publicJwks, signingHistory } from '../../_lib/registry/signing.js';

export async function onRequestGet({ request, env }) {
  try {
    await requireAdmin(request, env);
    const url = new URL(request.url);
    const [keys, history] = await Promise.all([
      publicJwks(env),
      signingHistory(env, {
        kid: url.searchParams.get('kid'),
        subjectType: url.searchParams.get('type'),
        limit: url.searchParams.get('limit'),
      }),
    ]);
    return jsonResponse({ keys: keys.keys, mode: keys.mode, notice: keys.notice, ...history });
  } catch (err) { return errorResponse(err); }
}
