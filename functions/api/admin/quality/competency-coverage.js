// GET /api/admin/quality/competency-coverage
//
// Does the curriculum satisfy the framework's own rule? An institutional
// quality instrument, not a learner feature.
//
// Staff rather than administrator: this is the Academic Director's and
// every tutor's business, it contains no personal data, and a quality
// measure only improves things if the people doing the work can see it.
import { jsonResponse, errorResponse } from '../../../_lib/db.js';
import { requireStaff } from '../../../_lib/auth/session.js';
import { competencyCoverage } from '../../../_lib/registry/profile.js';

export async function onRequestGet({ request, env }) {
  try {
    await requireStaff(request, env);
    return jsonResponse(await competencyCoverage(env));
  } catch (err) { return errorResponse(err); }
}
