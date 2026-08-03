// GET /api/graduate/<handle> — a published graduate profile.
//
// PUBLIC, and only reaches profiles the graduate published. An
// unpublished profile is NotFound rather than Forbidden: "this exists
// but you may not see it" confirms the person is a graduate, which is
// itself something they chose not to publish.
import { jsonResponse, errorResponse } from '../../_lib/db.js';
import { publicProfile } from '../../_lib/registry/profile.js';

export async function onRequestGet({ params, env }) {
  try {
    return jsonResponse(await publicProfile(env, { handle: params.handle }));
  } catch (err) { return errorResponse(err); }
}
