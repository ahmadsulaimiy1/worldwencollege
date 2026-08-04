// GET/POST /api/admin/institutions — the register of institutions
// permitted to query the Register programmatically, and what they have
// been reading.
//
// ADMINISTRATOR only. Granting an institution bulk access to graduate
// records is an institutional decision, not a teaching one.
import { jsonResponse, errorResponse, readJsonBody } from '../../_lib/db.js';
import { requireAdmin } from '../../_lib/auth/session.js';
import { registerInstitution, institutionActivity } from '../../_lib/registry/documents.js';

export async function onRequestGet({ request, env }) {
  try {
    await requireAdmin(request, env);
    const url = new URL(request.url);
    return jsonResponse(await institutionActivity(env, {
      institutionId: url.searchParams.get('id'),
      limit: url.searchParams.get('limit'),
    }));
  } catch (err) { return errorResponse(err); }
}

export async function onRequestPost({ request, env }) {
  try {
    const actor = await requireAdmin(request, env);
    const body = (await readJsonBody(request)) || {};
    // The key comes back exactly once. It is stored only as a hash and
    // cannot be shown again — a leaked table of live keys would be a
    // leaked ability to read the Register at scale under another name.
    return jsonResponse(await registerInstitution(env, { ...body, approvedBy: actor.id }));
  } catch (err) { return errorResponse(err); }
}
