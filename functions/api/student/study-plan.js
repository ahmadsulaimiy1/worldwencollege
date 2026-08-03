// GET /api/student/study-plan
//
// The signed-in learner's own position in the programme: which level,
// how far through, and the one unit to open next. Any authenticated
// user — this is a learner's own record, so requireUser() is the whole
// authorisation story.
//
// Deliberately not parameterised by user id. A "?userId=" on an
// endpoint like this is how one learner ends up reading another's
// progress, and staff who need somebody else's record have
// /api/admin/learners, which is guarded for it.
import { jsonResponse, errorResponse } from '../../_lib/db.js';
import { requireUser } from '../../_lib/auth/session.js';
import { buildStudyPlan } from '../../_lib/student/study-plan.js';

export async function onRequestGet({ request, env }) {
  try {
    const user = await requireUser(request, env);
    return jsonResponse(await buildStudyPlan(env, user.id));
  } catch (err) {
    return errorResponse(err);
  }
}
