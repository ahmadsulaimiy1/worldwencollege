// GET /api/verify/document/<code> — verify an issued document.
//
// PUBLIC, like award verification and for the same reason. 200 for every
// well-formed answer including 'superseded', 'expired', 'withdrawn' and
// 'not_found': those are true replies to a fair question, and a 404
// would make an ordinary supersession look like an outage.
import { jsonResponse, errorResponse } from '../../../_lib/db.js';
import { verifyDocument } from '../../../_lib/registry/documents.js';

export async function onRequestGet({ params, env }) {
  try {
    return jsonResponse(await verifyDocument(env, { code: params.code }));
  } catch (err) { return errorResponse(err); }
}
