// GET /api/student/attendance — the caller's own engagement record.
//
// THE FAULT THIS FILE EXISTS TO CORRECT is the one an attendance screen
// commits by default: it renders a grid of weeks and modules, colours
// the empty cells, and a learner in Jakarta studying at 02:00 reads a
// row of red as a judgement about their commitment. That is a roll call,
// and docs/academic-framework.md § XI rules it out for an asynchronous
// college.
//
// So the payload leads with `engagementNotice` — the labelled sentence
// saying what was measured and what it is not — before any state, and
// every cell carries the evidence it was read from. A UI can style this
// badly; it cannot present it as attendance without deleting a required
// field of the response.
//
// NO SUBJECT PARAMETER. The learner is the session, exactly as
// functions/api/student/dashboard.js sets out: an endpoint that accepts
// a user id can be asked for somebody else's record. `levelId` and
// `weeks` select among the caller's OWN enrolments and are validated;
// neither can name another person.

import { jsonResponse, errorResponse } from '../../_lib/db.js';
import { requireUser } from '../../_lib/auth/session.js';
import { learnerEngagement, parseWeeks, parseLevelId } from '../../_lib/academic/attendance.js';

export async function onRequestGet({ request, env }) {
  try {
    const user = await requireUser(request, env);
    const url = new URL(request.url);
    const weeks = parseWeeks(url.searchParams.get('weeks'));
    const levelId = parseLevelId(url.searchParams.get('levelId'));

    const record = await learnerEngagement(env, { userId: user.id, levelId, weeks });
    return jsonResponse(record);
  } catch (err) {
    return errorResponse(err);
  }
}
