// GET/POST /api/student/documents — a graduate's issued documents.
//
// Scoped to the caller, with no userId parameter: an endpoint that
// accepts one can be asked for somebody else's transcript.
import { jsonResponse, errorResponse, readJsonBody } from '../../_lib/db.js';
import { requireUser } from '../../_lib/auth/session.js';
import { issueDocument, myDocuments } from '../../_lib/registry/documents.js';

export async function onRequestGet({ request, env }) {
  try {
    const user = await requireUser(request, env);
    return jsonResponse(await myDocuments(env, { userId: user.id }));
  } catch (err) { return errorResponse(err); }
}

export async function onRequestPost({ request, env }) {
  try {
    const user = await requireUser(request, env);
    const body = (await readJsonBody(request)) || {};
    // issuedBy is the caller. A graduate issuing their own transcript is
    // the ordinary case, and the audit records who asked rather than
    // implying a registrar signed it by hand.
    return jsonResponse(await issueDocument(env, {
      documentType: body.documentType || 'transcript',
      userId: user.id, issuedBy: user.id,
      expiresDays: body.expiresDays === undefined ? null : body.expiresDays,
    }));
  } catch (err) { return errorResponse(err); }
}
