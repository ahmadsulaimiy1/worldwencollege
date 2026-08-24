// GET /api/examiner/queue
//
// External Examiner only. Every learner whose current level is finished
// and awaiting the Examiner's decision, or was decided at a prior
// sitting and awaits an administrator's conferral.
import { jsonResponse, errorResponse } from '../../_lib/db.js';
import { requireExaminer } from '../../_lib/auth/session.js';
import { getQueue } from '../../_lib/registry/pass-list.js';

export async function onRequestGet({ request, env }) {
  try {
    await requireExaminer(request, env);
    return jsonResponse(await getQueue(env));
  } catch (err) {
    return errorResponse(err);
  }
}
