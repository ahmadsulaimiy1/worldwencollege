// GET /api/institutional/verify?code=... — verification for registered
// institutions, authenticated by API key.
//
// PUBLIC in the routing sense — no session — but NOT anonymous: the key
// identifies the institution and every check is recorded against it.
//
// That asymmetry with the public portal is deliberate and is the
// consent argument. A graduate hands their code to an employer knowing
// it will be checked, and the portal records nothing about who checked.
// An institution making bulk automated queries against the Register is
// doing something the College should be able to see, attribute and stop.
//
// The key travels in Authorization, never in the query string: query
// strings end up in access logs, browser history and referrer headers.
import { jsonResponse, errorResponse } from '../../_lib/db.js';
import { institutionalVerify } from '../../_lib/registry/documents.js';

export async function onRequestGet({ request, env }) {
  try {
    const url = new URL(request.url);
    const auth = request.headers.get('Authorization') || '';
    const apiKey = auth.startsWith('Bearer ') ? auth.slice(7) : '';

    const result = await institutionalVerify(env, { apiKey, code: url.searchParams.get('code') });
    if (!result.ok && result.reason === 'unauthorised') {
      return jsonResponse(result, { status: 401 });
    }
    if (!result.ok && result.reason === 'rate_limited') {
      // 429 with the agreed limit stated. An integrator hitting a cap
      // needs to know it is a cap and not a fault, or they will retry
      // into it all day.
      return jsonResponse(result, { status: 429 });
    }
    return jsonResponse(result);
  } catch (err) { return errorResponse(err); }
}
