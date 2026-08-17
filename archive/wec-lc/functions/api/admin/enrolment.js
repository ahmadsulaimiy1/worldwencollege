// POST /api/admin/enrolment
//   { userId, levelId, status, reason }
//
// Staff only. Creates or moves one enrolment and records who did it and
// why. This is the endpoint that replaces "ask a developer to run SQL
// in the database console" — which is how the platform's first learner
// was enrolled, and is not a process any institution can run on.
//
// `reason` is required and is not ceremony: an enrolment that did not
// come from a payment needs to say whether it was a scholarship, a bank
// transfer, a corporate seat or a staff test account, or the record is
// worth nothing six months later when somebody asks.
import { jsonResponse, errorResponse, readJsonBody, ValidationError } from '../../_lib/db.js';
import { requireStaff } from '../../_lib/auth/session.js';
import { setEnrolmentStatus } from '../../_lib/admin/enrolments.js';

export async function onRequestPost({ request, env }) {
  try {
    const staff = await requireStaff(request, env);
    const body = await readJsonBody(request);
    const { userId, levelId, status, reason } = body || {};
    if (!userId) throw new ValidationError('userId is required.', { userId: 'Required' });
    if (!Number.isInteger(levelId)) throw new ValidationError('levelId must be an integer 1-6.', { levelId: 'Required' });
    if (!status) throw new ValidationError('status is required.', { status: 'Required' });

    const result = await setEnrolmentStatus(env, {
      actor: staff, userId, levelId, status, reason: reason || null,
    });
    return jsonResponse(result, result.changed ? 201 : 200);
  } catch (err) {
    return errorResponse(err);
  }
}
