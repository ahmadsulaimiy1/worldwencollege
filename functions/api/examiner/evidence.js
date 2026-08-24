// GET /api/examiner/evidence?userId=...&levelId=...
//
// External Examiner only. The real marks, competency-mapping state and
// prior decisions for one learner's one level — see
// functions/_lib/registry/pass-list.js's evidenceFor() for exactly what
// this does and does not calculate.
import { jsonResponse, errorResponse, ValidationError } from '../../_lib/db.js';
import { requireExaminer } from '../../_lib/auth/session.js';
import { evidenceFor } from '../../_lib/registry/pass-list.js';

export async function onRequestGet({ request, env }) {
  try {
    await requireExaminer(request, env);
    const url = new URL(request.url);
    const userId = url.searchParams.get('userId');
    const levelId = Number(url.searchParams.get('levelId'));
    if (!userId) throw new ValidationError('userId is required.', { userId: 'Required' });
    if (!Number.isInteger(levelId)) throw new ValidationError('levelId must be an integer.', { levelId: 'Required' });
    return jsonResponse(await evidenceFor(env, { userId, levelId }));
  } catch (err) {
    return errorResponse(err);
  }
}
