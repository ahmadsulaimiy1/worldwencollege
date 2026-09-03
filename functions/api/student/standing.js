// GET /api/student/standing
//
// The caller's own grade point average, academic standing, per-level
// marks, progression position and graduation position — everything the
// measurement engine can say about one learner, from
// functions/_lib/academic/standing.js.
//
// THE SUBJECT COMES FROM THE SESSION AND FROM NOWHERE ELSE. No user id,
// no student id, no level parameter: this endpoint reads the marks,
// standing and unmet conditions of a named person, and an endpoint that
// accepted an id would be a way to read any learner's academic record by
// changing a number in a URL. The rule and its reasoning are stated once
// in functions/api/student/dashboard.js; this file follows it, and
// tests/academic-standing.test.mjs asserts the source contains no
// parameter path at all rather than trusting that it does.
//
// IT IS A GET AND IT WRITES NOTHING. Freezing a standing into
// `academic_standing_reviews` is `recordStandingReview()`, and it is
// deliberately not called here: a review point is a named occasion of
// the College's, and a learner refreshing their own record must not be
// able to mint one. A page load is not a review.

import { jsonResponse, errorResponse } from '../../_lib/db.js';
import { requireUser } from '../../_lib/auth/session.js';
import { computeLearnerStanding } from '../../_lib/academic/standing.js';

export async function onRequestGet({ request, env }) {
  try {
    const user = await requireUser(request, env);
    const standing = await computeLearnerStanding(env, user.id);
    return jsonResponse(standing);
  } catch (err) {
    return errorResponse(err);
  }
}
