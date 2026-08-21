// GET /api/student/achievements
//
// The caller's own milestones: what the College has honoured, and — for
// everything it has not — exactly what remains before it does. The
// register, the conditions and the awarding rules are
// functions/_lib/academic/achievements.js.
//
// THE SUBJECT COMES FROM THE SESSION AND FROM NOWHERE ELSE. No user id,
// no student id, no level parameter. The rule and its full reasoning are
// stated once in functions/api/student/dashboard.js; the reason it binds
// HERE with particular force is that a milestone names an academic fact
// about a person — a distinction conferred, a competency moderated, a
// module passed — so an endpoint that accepted an id would publish one
// learner's academic record to anybody who could change a number in a
// URL. tests/achievements.test.mjs asserts the source contains no
// parameter path at all rather than trusting that it does.
//
// IT IS A GET AND IT DOES WRITE, WHICH standing.js REFUSES TO DO.
// The difference is not convenience and it is worth having in both
// files. Freezing an academic standing is a JUDGEMENT the College makes
// on a stated occasion, so a learner refreshing a page must not be able
// to mint one. Awarding a milestone decides nothing: it reads evidence
// somebody already judged — a mark a person gave, an award the register
// conferred — and the sweep is idempotent, so running it on read costs
// nothing and means a learner sees a milestone the hour they earn it
// rather than whenever a cron next fires.
//
// It takes no query parameters at all. There is nothing here to page,
// filter or sort: fifteen definitions is the whole register, and a
// learner is owed all of them — the ones they hold and the route to the
// ones they do not.

import { jsonResponse, errorResponse } from '../../_lib/db.js';
import { requireUser } from '../../_lib/auth/session.js';
import { learnerAchievements } from '../../_lib/academic/achievements.js';

export async function onRequestGet({ request, env }) {
  try {
    const user = await requireUser(request, env);
    const achievements = await learnerAchievements(env, user.id);
    return jsonResponse(achievements);
  } catch (err) {
    return errorResponse(err);
  }
}
