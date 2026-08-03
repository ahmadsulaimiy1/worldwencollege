// POST /api/admin/role      { userId, role, reason, authority }  — appoint
// GET  /api/admin/role                    — who holds access, everyone
// GET  /api/admin/role?userId=usr_xxx     — one person's appointment history
//
// Administrator only. The GET answers the question an institution is
// actually asked — "who can see student records" — which before this
// could only be answered by querying the database by hand.
//
// requireStaff() is not enough here: staff may enrol learners, but
// deciding who else may do that is an administrator's act.
//
// On POST the rule lives in setUserRole(), which receives the full
// actor and refuses a non-administrator — the authority is the module,
// not the route. requireAdmin() here as well is deliberate duplication
// at a trust boundary, not redundancy: it fails the request before a
// body is even parsed.
//
// On GET there is no such module-level check to fall back on —
// listAppointees() takes no actor and cannot have one, since it
// answers a question about everybody. This endpoint first shipped with
// requireStaff() under a comment claiming administrator-only, which
// meant every tutor could pull the complete register of who can read
// student records. Fixed, and covered by tests/admin-role-endpoint.test.mjs,
// which drives the route rather than the module — the only level at
// which the defect was visible.
import { jsonResponse, errorResponse, readJsonBody, ValidationError } from '../../_lib/db.js';
import { requireAdmin } from '../../_lib/auth/session.js';
import { setUserRole, listAppointees, appointmentHistory } from '../../_lib/admin/roles.js';

export async function onRequestGet({ request, env }) {
  try {
    await requireAdmin(request, env);
    // One person's appointment history, or the whole register. Both are
    // the same question at different scopes — "who can reach student
    // records, and who decided that" — so they share an endpoint and a
    // guard rather than drifting apart into two.
    const userId = new URL(request.url).searchParams.get('userId');
    if (userId) return jsonResponse({ userId, appointments: await appointmentHistory(env, { userId }) });
    return jsonResponse(await listAppointees(env));
  } catch (err) {
    return errorResponse(err);
  }
}

export async function onRequestPost({ request, env }) {
  try {
    const actor = await requireAdmin(request, env);
    const body = await readJsonBody(request);
    const { userId, role, reason, authority } = body || {};
    if (!userId) throw new ValidationError('userId is required.', { userId: 'Required' });
    if (!role) throw new ValidationError('role is required.', { role: 'Required' });
    return jsonResponse(await setUserRole(env, { actor, userId, role, reason, authority: authority || null }));
  } catch (err) {
    return errorResponse(err);
  }
}
