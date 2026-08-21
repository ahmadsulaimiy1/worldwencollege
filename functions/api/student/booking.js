// POST / DELETE /api/student/booking — a learner takes a place in a
// tutor's published hour, and gives it back.
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
import { bookSlot, cancelBooking } from '../../_lib/lms/timetable.js';

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
