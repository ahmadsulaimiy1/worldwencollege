// POST /api/admin/role      { userId, role, reason, authority }  — appoint
// GET  /api/admin/role                                            — who holds access
//
// Administrator only. The GET answers the question an institution is
// actually asked — "who can see student records" — which before this
// could only be answered by querying the database by hand.
//
// requireStaff() is not enough here: staff may enrol learners, but
// deciding who else may do that is an administrator's act. The role
// check therefore lives in setUserRole(), which receives the full
// actor, rather than being inferred from the endpoint's guard.
import { jsonResponse, errorResponse, readJsonBody, ValidationError } from '../../_lib/db.js';
import { requireStaff } from '../../_lib/auth/session.js';
import { setUserRole, listAppointees } from '../../_lib/admin/roles.js';

export async function onRequestGet({ request, env }) {
  try {
    await requireStaff(request, env);
    return jsonResponse(await listAppointees(env));
  } catch (err) {
    return errorResponse(err);
  }
}

export async function onRequestPost({ request, env }) {
  try {
    const actor = await requireStaff(request, env);
    const body = await readJsonBody(request);
    const { userId, role, reason, authority } = body || {};
    if (!userId) throw new ValidationError('userId is required.', { userId: 'Required' });
    if (!role) throw new ValidationError('role is required.', { role: 'Required' });
    return jsonResponse(await setUserRole(env, { actor, userId, role, reason, authority: authority || null }));
  } catch (err) {
    return errorResponse(err);
  }
}
