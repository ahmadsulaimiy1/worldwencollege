// POST /api/lms/complete-level
// Body: { userId, levelId }
// Staff/admin only — see functions/_lib/student/progression.js for why
// this is a human-triggered action today rather than an automated one.
// Idempotent: completing an already-completed level is a no-op that
// returns its current state rather than erroring.

import { jsonResponse, errorResponse, ValidationError, readJsonBody } from '../../_lib/db.js';
import { requireStaff } from '../../_lib/auth/session.js';
import { completeLevel } from '../../_lib/student/progression.js';

export async function onRequestPost({ request, env }) {
  try {
    await requireStaff(request, env);
    const body = await readJsonBody(request);
    if (!body?.userId) throw new ValidationError('userId is required.', { userId: 'Required' });
    if (!body?.levelId) throw new ValidationError('levelId is required.', { levelId: 'Required' });

    const result = await completeLevel(env, { userId: body.userId, levelId: body.levelId });
    return jsonResponse(result);
  } catch (err) {
    return errorResponse(err);
  }
}
