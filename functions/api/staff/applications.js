// GET   /api/staff/applications — the admissions queue
// PATCH /api/staff/applications — the door every staff decision goes through
//
// THE FAULT THIS FILE EXISTS TO CORRECT. Before it there was no way for
// a member of staff to see that an application existed. The only signal
// admissions ever got was the alert POST /api/admissions/apply tries to
// send to env.NOTIFICATION_EMAIL — an address that is not configured, on
// a gateway that is not configured — so in practice an application was
// written to D1 and nobody was told. There was no list, no filter, no
// count, and no way to act: `grep -rn "UPDATE applications" functions/`
// returned a comment. This is the list and the door.
//
// OLDEST FIRST, AND THAT IS THE WHOLE POINT OF CALLING IT A QUEUE. An
// admissions list sorted newest-first is exactly how the application
// that has waited longest becomes the one nobody sees, which is the
// failure this entire domain exists to correct. `daysWaiting` rides on
// every row for the same reason.
//
// THE COUNTS ARE NOT FILTERED BY THE STATUS FILTER. Narrowing the list
// to `offer_sent` must not also narrow the tallies to it, or a person
// working one stage of the queue loses sight of the rest of it. See
// applicationQueue() in lifecycle.js for how that is measured.
//
// THE PATCH IS NOT A STATUS SETTER. It names a destination and
// lifecycle.js decides which act that is — accepting through the queue
// settles the offer, declining declines it, withdrawing an offer records
// a withdrawal distinct from a lapse. So the `offers` table and the
// `applications` row cannot end up describing different things, and
// `offer_sent` cannot be reached at all from here: it is refused with
// the route that writes the offer, because a status claiming an offer
// was sent must never exist without one.
//
// EVERY REASON WRITTEN HERE IS SHOWN TO THE APPLICANT on their own
// tracking page. There is no internal-note column on `application_events`
// to write a private one into, so there is no way to be careless by
// accident — but staff must know, and the refusal message for a missing
// reason says so in as many words rather than leaving it in a comment.
//
// GUARDED BY requireStaff, not requireAdmin: reading and progressing
// admissions is the admissions office's daily work, and an endpoint only
// an administrator can use is an endpoint that gets used by sharing an
// administrator's login. Both handlers demand a session before reading a
// single parameter, which is what tests/route-guard-census.test.mjs
// exercises at runtime.

import { jsonResponse, errorResponse, ValidationError, readJsonBody } from '../../_lib/db.js';
import { requireStaff } from '../../_lib/auth/session.js';
import {
  applicationQueue, staffTransition, APPLICATION_STATUSES, legalTransitionsFrom,
  PUBLISHED_JOURNEY, TRANSITIONS,
} from '../../_lib/admissions/lifecycle.js';

export async function onRequestGet({ request, env }) {
  try {
    await requireStaff(request, env);
    const url = new URL(request.url);
    const queue = await applicationQueue(env, {
      status: url.searchParams.get('status'),
      source: url.searchParams.get('source'),
      country: url.searchParams.get('country'),
      levelId: url.searchParams.get('levelId'),
      q: url.searchParams.get('q'),
      limit: url.searchParams.get('limit'),
      offset: url.searchParams.get('offset'),
    });

    return jsonResponse({
      ...queue,
      // The machine, returned with the queue. A console that builds its
      // own idea of which buttons to show will eventually disagree with
      // the server about what is legal, and the disagreement always
      // surfaces as a 422 in front of an admissions officer.
      machine: {
        statuses: APPLICATION_STATUSES,
        journey: PUBLISHED_JOURNEY,
        transitions: TRANSITIONS.map((t) => ({ from: t.from, to: t.to, by: t.by, means: t.means })),
      },
    });
  } catch (err) {
    return errorResponse(err);
  }
}

export async function onRequestPatch({ request, env }) {
  try {
    const staff = await requireStaff(request, env);
    const body = await readJsonBody(request);
    if (!body || typeof body !== 'object' || Array.isArray(body)) {
      throw new ValidationError('A JSON object is required.', {});
    }

    // Refused rather than ignored. `status` is what a caller reaching for
    // a REST habit would send, and honouring it here would make this a
    // status setter — the exact thing this endpoint is not.
    if (body.status !== undefined && body.to === undefined) {
      throw new ValidationError(
        'Use `to` to name the status you are moving the application to. `status` is what it is now, which the platform already knows.',
        { status: 'Use `to`' },
      );
    }
    if (typeof body.to !== 'string' || !body.to) {
      throw new ValidationError(
        `Name the status to move to. The statuses are: ${APPLICATION_STATUSES.join(', ')}.`,
        { to: 'Required' },
      );
    }
    if (body.actorId !== undefined) {
      throw new ValidationError(
        'The actor is the signed-in officer. It is taken from the session and never from the request.',
        { actorId: 'Not accepted' },
      );
    }

    // Rejected rather than coerced: "2" is not 2, and a level that
    // arrived as a string once will arrive as something stranger later.
    let placementLevelId;
    if (body.placementLevelId !== undefined && body.placementLevelId !== null) {
      const n = body.placementLevelId;
      if (!Number.isInteger(n) || n < 1 || n > 6) {
        throw new ValidationError(
          'placementLevelId must be a whole number naming a programme level.',
          { placementLevelId: 'A whole number, 1 to 6' },
        );
      }
      placementLevelId = n;
    }

    const result = await staffTransition(env, {
      actor: staff,
      applicationId: body.applicationId,
      to: body.to,
      reason: body.reason ?? null,
      placementLevelId,
    });

    return jsonResponse({
      reference: result.application.id,
      status: result.application.status,
      placementLevelId: result.application.placement_level_id,
      offer: result.offer ?? null,
      event: result.event,
      enrolmentId: result.enrolmentId ?? null,
      // Reported, never asserted. An admissions officer who moves an
      // application must be able to see from the response whether the
      // applicant was actually written to, because today the answer is
      // usually no and the platform must say so.
      notifications: result.notifications,
      legalNext: legalTransitionsFrom(result.application.status),
    });
  } catch (err) {
    // An illegal transition carries the legal ones so a console can
    // correct itself rather than only apologise.
    if (err.name === 'IllegalTransitionError') {
      return jsonResponse(
        { error: err.name, message: err.message, fields: err.fields, legal: err.legal },
        { status: err.httpStatus },
      );
    }
    return errorResponse(err);
  }
}
