// GET /api/register
//
// PUBLIC. The browsable Graduate Register: every consented, current
// award of the College, at every level.
//
// Two deliberate restraints.
//
// CONSENT IS THE FLOOR, NOT A FILTER. A graduate appears here only if
// they said so. The consent test lives in the query in
// `_lib/registry/awards.js`, not in this handler, so no future endpoint
// can reach the same data by forgetting to apply it.
//
// THE LIMIT IS CAPPED SERVER-SIDE. `?limit=` is honoured up to 200 and
// no further. A public register with an uncapped page size is a bulk
// export of every graduate's name waiting for someone to notice, and
// "nobody would bother" is not an access control.
import { jsonResponse, errorResponse } from '../../_lib/db.js';
import { publicRegister } from '../../_lib/registry/awards.js';

export async function onRequestGet({ request, env }) {
  try {
    const url = new URL(request.url);
    const rawLevel = url.searchParams.get('level');
    const levelId = /^[1-6]$/.test(rawLevel || '') ? Number(rawLevel) : null;

    const result = await publicRegister(env, {
      levelId,
      q: url.searchParams.get('q'),
      limit: url.searchParams.get('limit'),
    });

    // An empty register is a true answer, not an error. Until the first
    // conferral this endpoint returns zero entries, and it should say so
    // plainly rather than 404 and make the page look broken on the day
    // it matters most.
    return jsonResponse(result);
  } catch (err) {
    return errorResponse(err);
  }
}
