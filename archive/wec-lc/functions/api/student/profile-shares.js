// GET/POST/DELETE /api/student/profile-shares — consent-based sharing.
//
// The token is returned exactly once, by POST, and never again. It is
// stored only as a hash, so the College cannot reproduce a link it has
// issued — which is the property that makes a database disclosure not
// also a disclosure of live access to every graduate's record.
import { jsonResponse, errorResponse, readJsonBody } from '../../_lib/db.js';
import { requireUser } from '../../_lib/auth/session.js';
import { createShare, listShares, revokeShare } from '../../_lib/registry/profile.js';

export async function onRequestGet({ request, env }) {
  try {
    const user = await requireUser(request, env);
    return jsonResponse({ shares: await listShares(env, { userId: user.id }) });
  } catch (err) { return errorResponse(err); }
}

export async function onRequestPost({ request, env }) {
  try {
    const user = await requireUser(request, env);
    const body = (await readJsonBody(request)) || {};
    return jsonResponse(await createShare(env, {
      userId: user.id,
      sections: Array.isArray(body.sections) ? body.sections : ['awards'],
      days: body.days === undefined ? 30 : body.days,
      label: body.label || null,
    }));
  } catch (err) { return errorResponse(err); }
}

export async function onRequestDelete({ request, env }) {
  try {
    const user = await requireUser(request, env);
    const shareId = new URL(request.url).searchParams.get('id');
    return jsonResponse(await revokeShare(env, { userId: user.id, shareId }));
  } catch (err) { return errorResponse(err); }
}
