// GET / POST /api/staff/slots — a tutor publishes the hours they are
// available, and withdraws them.
//
// THE FAULT THIS FILE EXISTS TO CORRECT. `tutorial_slots` shipped in
// migration 020 with no writer anywhere in functions/, which made every
// bookable hour on this platform a row somebody would have had to type
// into the database by hand. A booking system whose supply side is a SQL
// console has no supply side.
//
// WHY WITHDRAWAL IS A POST AND NOT A DELETE. Nothing is deleted. The
// slot survives as 'cancelled' carrying the timestamp and the tutor's
// reason, and every learner holding a place in it is released with that
// same reason on their own record — the cascade in
// functions/_lib/lms/timetable.js, which exists because a learner shown
// "cancelled" with no hand on it cannot tell whether they did it
// themselves. DELETE would name the wrong act. So the verb pair the
// brief asks for is the verb pair the data supports, and the action is
// carried in the body: `{"action":"withdraw","slotId":…,"reason":…}`.
//
// THE READ IS A DIARY, NOT A SEARCH. GET returns the caller's own
// published hours and the learners in them, and nothing else. A tutor
// cannot ask for a colleague's diary; an administrator may name one with
// `?tutorId=`, and the payload says on what basis it was served — the
// same asymmetry functions/_lib/academic/attendance.js draws between a
// teaching relation and the register. The learners named in a slot are
// named because the booking IS the teaching relation: attendance.js
// composes exactly this join to decide whose record a tutor may read, so
// no wider disclosure happens here than the tutor already holds.

import { jsonResponse, errorResponse, readJsonBody, ValidationError } from '../../_lib/db.js';
import { requireStaff } from '../../_lib/auth/session.js';
import { publishSlot, withdrawSlot, tutorSlots, parseLimit } from '../../_lib/lms/timetable.js';

const ACTIONS = ['publish', 'withdraw'];

export async function onRequestGet({ request, env }) {
  try {
    const staff = await requireStaff(request, env);
    const url = new URL(request.url);
    const includePast = url.searchParams.get('includePast') === 'true';

    const result = await tutorSlots(env, {
      tutor: staff,
      tutorId: url.searchParams.get('tutorId'),
      limit: parseLimit(url.searchParams.get('limit')),
      includePast,
    });
    return jsonResponse(result, { headers: { 'cache-control': 'private, no-store' } });
  } catch (err) {
    return errorResponse(err);
  }
}

export async function onRequestPost({ request, env }) {
  try {
    const staff = await requireStaff(request, env);
    const body = await readJsonBody(request);
    if (!body || typeof body !== 'object' || Array.isArray(body)) {
      throw new ValidationError('A JSON object is required.', {});
    }

    const action = body.action === undefined || body.action === null || body.action === ''
      ? 'publish'
      : String(body.action);
    if (!ACTIONS.includes(action)) {
      throw new ValidationError(`action must be one of: ${ACTIONS.join(', ')}.`, { action: ACTIONS.join(' or ') });
    }

    if (action === 'withdraw') {
      const withdrawn = await withdrawSlot(env, {
        tutor: staff,
        slotId: body.slotId,
        reason: body.reason,
      });
      return jsonResponse(withdrawn);
    }

    // The tutor is the session, never a field. A member of staff
    // publishing hours into a colleague's diary would put a stranger's
    // name over an appointment a learner then books, and an
    // administrator with a body parameter is how that happens by
    // accident.
    const published = await publishSlot(env, {
      tutor: staff,
      title: body.title,
      kind: body.kind === undefined || body.kind === null || body.kind === '' ? 'tutorial' : body.kind,
      startsAt: body.startsAt,
      durationMinutes: body.durationMinutes ?? 30,
      capacity: body.capacity ?? 1,
      levelId: body.levelId ?? null,
      unitId: body.unitId ?? null,
      liveSessionId: body.liveSessionId ?? null,
      joinUrl: body.joinUrl ?? null,
    });
    return jsonResponse(published, { status: 201 });
  } catch (err) {
    return errorResponse(err);
  }
}
