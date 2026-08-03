// GET/PATCH /api/student/profile — the graduate's own view of their record.
//
// AUTHENTICATED, and scoped to the caller. There is no `userId`
// parameter, deliberately: an endpoint that accepts one is an endpoint
// that can be asked for somebody else's transcript, and no amount of
// checking afterwards is as reliable as never offering the option.
import { jsonResponse, errorResponse, readJsonBody } from '../../_lib/db.js';
import { requireUser } from '../../_lib/auth/session.js';
import { fullProfile, updateProfile } from '../../_lib/registry/profile.js';

export async function onRequestGet({ request, env }) {
  try {
    const user = await requireUser(request, env);
    return jsonResponse(await fullProfile(env, { userId: user.id }));
  } catch (err) { return errorResponse(err); }
}

export async function onRequestPatch({ request, env }) {
  try {
    const user = await requireUser(request, env);
    const body = await readJsonBody(request);
    await updateProfile(env, { userId: user.id, changes: body || {} });
    return jsonResponse(await fullProfile(env, { userId: user.id }));
  } catch (err) { return errorResponse(err); }
}
