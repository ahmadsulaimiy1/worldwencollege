// POST /api/admin/confer
//   { entryId }
//
// Administrator only, standing in for the Registrar office — see
// functions/api/admin/pass-list.js's header comment. The only HTTP
// route that can write to the Graduate Register; requires a real,
// confirmed pass-list entry from an independent Examiner. See
// functions/_lib/registry/pass-list.js's confer() for the full checks.
import { jsonResponse, errorResponse, readJsonBody, ValidationError } from '../../_lib/db.js';
import { requireAdmin } from '../../_lib/auth/session.js';
import { confer } from '../../_lib/registry/pass-list.js';

export async function onRequestPost({ request, env }) {
  try {
    const admin = await requireAdmin(request, env);
    const body = await readJsonBody(request);
    const { entryId } = body || {};
    if (!entryId) throw new ValidationError('entryId is required.', { entryId: 'Required' });
    const award = await confer(env, { entryId, actorId: admin.id });
    return jsonResponse(award, 201);
  } catch (err) {
    return errorResponse(err);
  }
}
