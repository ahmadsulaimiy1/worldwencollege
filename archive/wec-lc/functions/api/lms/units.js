// GET /api/lms/units?levelId=<n>
// Returns the ordered unit list for a programme level, with the
// signed-in student's own per-unit progress — 403 if they hold no
// active/completed enrolment for that level (see
// functions/_lib/lms/content.js's assertLevelAccess).

import { jsonResponse, errorResponse, ValidationError } from '../../_lib/db.js';
import { requireUser } from '../../_lib/auth/session.js';
import { listUnits } from '../../_lib/lms/content.js';

export async function onRequestGet({ request, env }) {
  try {
    const user = await requireUser(request, env);
    const levelId = Number(new URL(request.url).searchParams.get('levelId'));
    if (!Number.isInteger(levelId)) throw new ValidationError('Provide ?levelId=<integer>.', { levelId: 'Required' });

    const units = await listUnits(env, { userId: user.id, levelId });
    return jsonResponse({ levelId, units });
  } catch (err) {
    return errorResponse(err);
  }
}
