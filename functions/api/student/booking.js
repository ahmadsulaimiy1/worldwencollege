// GET / POST / DELETE /api/student/booking — a learner sees what hours
// are open to them, takes a place in one, and gives it back.
//
// THE GET WAS ADDED 21 AUGUST 2026, and its absence was the reason the
// other two verbs could not be reached. bookSlot() takes a `slotId` and
// nothing in the platform would tell a learner one: tutorSlots() is the
// tutor's own diary behind a staff session, and learnerTimetable()
// reports hours already booked. So the platform could accept a booking
// and could not be asked what there was to book. See
// openSlotsForLearner() for why its filters mirror bookSlot()'s
// refusals clause for clause, and why a FULL hour is listed and marked
// full rather than hidden.
//
// THE FAULT THIS FILE EXISTS TO CORRECT is the one every booking form
// commits: a single refusal. "That booking could not be made" sends the
// learner who is already booked, the learner who arrived a minute after
// the hour began, the learner facing a full oral-defence panel and the
// learner looking at another cohort's tutorial to the same support inbox
// with the same sentence, and none of the four can act on it. Every
// refusal below names its own cause and lands in `fields` so the form
// can point at the control that is wrong — the contract
// functions/_lib/db.js's ValidationError exists for.
//
// THE SUBJECT IS THE SESSION. There is no userId here, in the body or
// the query, for the reason functions/api/student/dashboard.js gives:
// an endpoint that accepts a learner id is an endpoint that can book
// somebody else into somebody else's tutorial. `slotId` and `bookingId`
// name rows, and every one of them is checked against the caller before
// anything is written.
//
// DELETE, NOT POST /cancel, and a reason is mandatory on it. The verb is
// right — the learner is removing their own place — but the row is not
// deleted: `slot_bookings` keeps it as 'cancelled_by_learner' with the
// timestamp and the reason, because the schema is built so that "a
// tutor's cancellation never reads as a learner's on the learner's own
// record". A cancellation nobody can attribute is the fault that table
// was shaped to prevent, and this route must not be the way round it.
// A DELETE carrying a body is unusual; the alternative is a reason in a
// query string, which puts a learner's sentence about their health in
// every access log between here and the College.

import { jsonResponse, errorResponse, readJsonBody, ValidationError } from '../../_lib/db.js';
import { requireUser } from '../../_lib/auth/session.js';
import { bookSlot, cancelBooking, openSlotsForLearner } from '../../_lib/lms/timetable.js';

export async function onRequestPost({ request, env }) {
  try {
    const user = await requireUser(request, env);
    const body = await readJsonBody(request);
    assertObject(body);

    const result = await bookSlot(env, {
      userId: user.id,
      slotId: body.slotId,
      learnerNote: body.learnerNote ?? body.note ?? null,
    });
    return jsonResponse(result, { status: 201 });
  } catch (err) {
    return errorResponse(err);
  }
}

export async function onRequestDelete({ request, env }) {
  try {
    const user = await requireUser(request, env);
    const url = new URL(request.url);
    // The id may travel in the query — a DELETE with no body is the
    // ordinary shape and some clients send none — but the reason may
    // not, and is read from the body alone.
    const body = await readJsonBody(request);
    assertObject(body);

    const result = await cancelBooking(env, {
      userId: user.id,
      bookingId: body.bookingId ?? url.searchParams.get('bookingId'),
      reason: body.reason,
    });
    return jsonResponse(result);
  } catch (err) {
    return errorResponse(err);
  }
}

function assertObject(body) {
  if (!body || typeof body !== 'object' || Array.isArray(body)) {
    throw new ValidationError('A JSON object is required.', {});
  }
}

export async function onRequestGet({ request, env }) {
  try {
    const user = await requireUser(request, env);
    const url = new URL(request.url);
    // No userId, in the query or anywhere else — the same rule the other
    // two verbs follow, and for the sharper reason: a list of the hours
    // open to somebody names the levels they are enrolled at.
    for (const forbidden of ['userId', 'user_id', 'studentId']) {
      if (url.searchParams.has(forbidden)) {
        throw new ValidationError(
          'This endpoint answers for the signed-in learner and takes no learner id.',
          { [forbidden]: 'Not accepted' },
        );
      }
    }
    const days = url.searchParams.get('days');
    const result = await openSlotsForLearner(env, {
      userId: user.id,
      ...(days ? { horizonDays: parseWholeNumber(days) } : {}),
    });
    return jsonResponse(result);
  } catch (err) {
    return errorResponse(err);
  }
}

/** Refused, never coerced — the house rule, so "7 days" is a 422 and not a 0. */
function parseWholeNumber(raw) {
  if (!/^\d+$/.test(String(raw))) {
    throw new ValidationError('days must be a whole number of days.', { days: 'A whole number' });
  }
  const n = Number(raw);
  if (n < 1 || n > 180) {
    throw new ValidationError('days must be between 1 and 180.', { days: 'Between 1 and 180' });
  }
  return n;
}
