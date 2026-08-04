// GET /api/admin/evidence — the Accreditation Evidence Centre.
//
// STAFF. It contains no personal data, and a quality register that only
// administrators can read is a register nobody acts on. The people who
// would close a gap are the people who need to see it.
//
// Every response carries the disclaimer from the module, so no view can
// render the register without it.
import { jsonResponse, errorResponse } from '../../../_lib/db.js';
import { requireStaff } from '../../../_lib/auth/session.js';
import { evidenceRegister, evidenceItem, governanceImpact } from '../../../_lib/registry/evidence.js';

export async function onRequestGet({ request, env }) {
  try {
    await requireStaff(request, env);
    const url = new URL(request.url);

    const reference = url.searchParams.get('reference');
    if (reference) return jsonResponse(await evidenceItem(env, { reference }));

    const decision = url.searchParams.get('decision');
    if (decision) return jsonResponse(await governanceImpact(env, { decisionRef: decision }));

    return jsonResponse(await evidenceRegister(env, {
      collection: url.searchParams.get('collection'),
      state: url.searchParams.get('state'),
    }));
  } catch (err) { return errorResponse(err); }
}
