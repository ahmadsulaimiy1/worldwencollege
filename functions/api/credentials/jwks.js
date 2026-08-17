// GET /api/credentials/jwks
//
// PUBLIC, and necessarily so. This is the College's published set of
// signing keys, and it is what lets an employer, a university or a
// government verify a AIPC credential in their own systems without asking
// the College anything. A verification that requires the issuer to
// participate is not verification — it is a phone call.
//
// Only public halves are ever here; `publicJwks()` selects the private
// column not at all, and the test suite asserts no private JWK member of
// any algorithm appears in the response.
//
// RETIRED KEYS STAY. A certificate signed in 2027 must verify in 2047
// against the key that signed it. Dropping retired keys would silently
// invalidate every credential the College had ever issued, at the moment
// it rotated.
import { jsonResponse, errorResponse } from '../../_lib/db.js';
import { publicJwks } from '../../_lib/registry/signing.js';

export async function onRequestGet({ env }) {
  try {
    const jwks = await publicJwks(env);
    return jsonResponse(jwks, {
      // Cacheable, but not for long. A revoked key has to stop being
      // trusted quickly, and an hour is the longest window in which a
      // compromised key could still be honoured by a cache.
      headers: { 'Cache-Control': 'public, max-age=3600' },
    });
  } catch (err) { return errorResponse(err); }
}
