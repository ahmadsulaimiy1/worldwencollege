// POST /api/examiner/decision
//   { userId, levelId, decision, notes }
//
// External Examiner only. Confirms or declines a learner's pass list for
// one level — "sit at the board that approves results, and confirm or
// decline to confirm the pass list" (docs/appointment-briefs.md).
// Recording this is not conferring an award — see
// functions/_lib/registry/pass-list.js's header comment for why the two
// are deliberately separate acts.
import { jsonResponse, errorResponse, readJsonBody, ValidationError } from '../../_lib/db.js';
import { requireExaminer } from '../../_lib/auth/session.js';
import { recordDecision } from '../../_lib/registry/pass-list.js';

export async function onRequestPost({ request, env }) {
  try {
    const examiner = await requireExaminer(request, env);
    const body = await readJsonBody(request);
    const { userId, levelId, decision, notes } = body || {};
    if (!userId) throw new ValidationError('userId is required.', { userId: 'Required' });
    if (!Number.isInteger(levelId)) throw new ValidationError('levelId must be an integer.', { levelId: 'Required' });
    const result = await recordDecision(env, {
      examinerId: examiner.id, userId, levelId, decision, notes: notes || null,
    });
    return jsonResponse(result, 201);
  } catch (err) {
    return errorResponse(err);
  }
}
