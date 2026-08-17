// GET /api/student/dashboard
// Requires auth. Returns the caller's own enrolment and payment
// history only — no id/user parameter accepted, deliberately, so this
// endpoint can never be used to look up another student's data. See
// functions/_lib/student/dashboard.js for the query logic and what it
// stops short of (no LMS-backed content yet).

import { jsonResponse, errorResponse } from '../../_lib/db.js';
import { requireUser } from '../../_lib/auth/session.js';
import { buildStudentDashboard } from '../../_lib/student/dashboard.js';

export async function onRequestGet({ request, env }) {
  try {
    const user = await requireUser(request, env);
    const dashboard = await buildStudentDashboard(env, user.id);
    return jsonResponse(dashboard);
  } catch (err) {
    return errorResponse(err);
  }
}
