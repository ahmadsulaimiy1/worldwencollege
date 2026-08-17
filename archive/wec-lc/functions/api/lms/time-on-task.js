// POST /api/lms/time-on-task   { unitId }   — credit one beat of study
// GET  /api/lms/time-on-task?levelId=<n>    — the learner's own measured time
//
// The learner's own data, so requireUser() is the whole authorisation
// story. Deliberately not parameterised by user id: a "?userId=" here is
// how one learner ends up reading another's study habits.
//
// Note the POST body carries NO duration. The client says "I am still
// working"; the server decides what that is worth from its own clock.
// See functions/_lib/lms/time-on-task.js for why that is not a detail.
import { jsonResponse, errorResponse, readJsonBody, ValidationError } from '../../_lib/db.js';
import { requireUser } from '../../_lib/auth/session.js';
import { recordBeat, learnerTime } from '../../_lib/lms/time-on-task.js';

export async function onRequestPost({ request, env }) {
  try {
    const user = await requireUser(request, env);
    const body = await readJsonBody(request);
    if (!body?.unitId) throw new ValidationError('unitId is required.', { unitId: 'Required' });
    return jsonResponse(await recordBeat(env, { userId: user.id, unitId: body.unitId }));
  } catch (err) {
    return errorResponse(err);
  }
}

export async function onRequestGet({ request, env }) {
  try {
    const user = await requireUser(request, env);
    const levelId = Number(new URL(request.url).searchParams.get('levelId'));
    if (!Number.isInteger(levelId)) throw new ValidationError('Provide ?levelId=<integer>.', { levelId: 'Required' });
    return jsonResponse(await learnerTime(env, { userId: user.id, levelId }));
  } catch (err) {
    return errorResponse(err);
  }
}
