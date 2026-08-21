// POST /api/admissions/offer          — Admissions issues an offer (staff)
// POST /api/admissions/offer?action=… — the applicant answers it, holding
//                                       nothing but their own reference
//
// THE FAULT THIS FILE EXISTS TO CORRECT. `offers` was written in
// migration 020 with an expiry it enforces, a partial unique index
// stopping two live offers reaching the same applicant, and CHECKs
// binding every terminal status to the columns that evidence it — and
// nothing in functions/ ever inserted a row into it. The one reader was
// functions/_lib/lms/timetable.js, which puts an offer's expiry on a
// learner's calendar as a deadline with `action: 'reply_to_offer'`. The
// platform could show a learner a deadline for answering an offer it had
// no way to make, and no way for them to answer.
//
// TWO CALLERS, TWO CREDENTIALS, ONE ROUTE — and the seam is stated here
// rather than left to be discovered:
//
//   · issuing is staff work and takes a session (requireStaff). An offer
//     is issued by a named officer because `offers.issued_by` is NOT
//     NULL and migration 020 says why: "nothing should offer a person a
//     place with nobody behind it."
//   · answering is the applicant's, and takes their application
//     reference as a bearer credential — there is no applicant sign-in
//     to require. See functions/api/admissions/track.js for the whole of
//     that argument, and lifecycle.js § THE BEARER CHECK for the
//     constant-time comparison and the lookup allowance both doors share.
//
// The default with no action is the staff door, so a request carrying
// neither credential is refused 401 by requireStaff — which is what
// tests/route-guard-census.test.mjs asserts of this route, and it is
// true. tests/applicant-lifecycle.test.mjs asserts the half the census
// cannot see: that the reference-authenticated action works, and that a
// wrong reference on it is refused with the same words a wrong reference
// gets anywhere else.
//
// The census learned a REFERENCE_AUTHENTICATED category on 20 August
// 2026 for admissions/track.js and admissions/status.js, and asserts
// both halves of it there — the refusal and the admission. This route
// keeps its GUARDED row, because its default door really is a staff
// session; the applicant door lives behind `?action=` and is exercised
// in applicant-lifecycle.
//
// WHY THE APPLICANT'S ACTION IS A QUERY PARAMETER AND NOT A SUB-PATH.
// Cloudflare Pages routes /api/admissions/offer/accept to
// functions/api/admissions/offer/accept.js and nothing else — a file
// this task did not own. So the actions are selected by `?action=` or
// an `action` field, and a request that arrives at `/offer/accept`
// anyway is honoured too.
//
// Revisited at the close of the foundation pass with the ownership
// restriction lifted, and the sub-path was NOT added. Acceptance would
// then be reachable at two addresses, which is the class of fault that
// pass existed to remove; and `offer.js` beside an `offer/` directory
// is a Pages routing arrangement that cannot be verified without
// deploying. One act, one address, and the handler still honours the
// sub-path if it is ever routed to it.
//
// WHAT AN APPLICANT MAY DO TO THEIR OWN APPLICATION, and why `withdraw`
// is here beside `accept` and `decline`: an applicant before the offer
// stage who has changed their mind should not have to write an email to
// stop a process they started. `decline` settles an open offer as
// declined; `withdraw` is the same decision where there is no offer to
// settle. They are kept apart so that neither can leave an offer open
// behind a closed application.

import { jsonResponse, errorResponse, ValidationError, readJsonBody } from '../../_lib/db.js';
import { requireStaff } from '../../_lib/auth/session.js';
import {
  issueOffer, respondToOffer, APPLICANT_ACTIONS,
} from '../../_lib/admissions/lifecycle.js';

export async function onRequestPost({ request, env }) {
  try {
    const url = new URL(request.url);
    const body = await readJsonBody(request);
    if (!body || typeof body !== 'object' || Array.isArray(body)) {
      throw new ValidationError('A JSON object is required.', {});
    }

    const action = resolveAction(url, body);
    if (action) return await answerOffer({ request, env, body, action });
    return await makeOffer({ request, env, body });
  } catch (err) {
    if (err.name === 'RateLimitError') {
      return jsonResponse(
        { error: err.name, message: err.message, fields: err.fields, allowance: err.allowance },
        { status: err.httpStatus },
      );
    }
    // The legal moves travel with the refusal, so a page that offered
    // the wrong button can correct itself rather than only apologise.
    if (err.name === 'IllegalTransitionError') {
      return jsonResponse(
        { error: err.name, message: err.message, fields: err.fields, legal: err.legal },
        { status: err.httpStatus },
      );
    }
    return errorResponse(err);
  }
}

/**
 * Which door this request is at. An unknown action is refused rather
 * than falling through to the staff door — a client that misspells
 * "accept" must be told, not silently handed a 401 about a session it
 * was never going to have.
 */
function resolveAction(url, body) {
  const fromPath = /\/offer\/([a-z]+)\/?$/.exec(url.pathname);
  const raw = (fromPath && fromPath[1]) || url.searchParams.get('action') || body.action || null;
  if (raw === null || raw === undefined || raw === '') return null;
  if (!APPLICANT_ACTIONS.includes(raw)) {
    throw new ValidationError(
      `Unknown action "${raw}". An applicant may: ${APPLICANT_ACTIONS.join(', ')}. Omit action entirely to issue an offer as staff.`,
      { action: 'Unknown action' },
    );
  }
  return raw;
}

// ── The staff door ───────────────────────────────────────────────────
async function makeOffer({ request, env, body }) {
  const staff = await requireStaff(request, env);

  // Refused rather than ignored: an officer who typed a status into the
  // request meant something by it, and an offer whose status was chosen
  // by the caller is not an offer, it is a record of one.
  const forbidden = {};
  for (const key of ['status', 'issuedBy', 'issuedAt', 'acceptedAt', 'id']) {
    if (body[key] !== undefined) {
      forbidden[key] = 'Set by the College, not by the request.';
    }
  }
  if (Object.keys(forbidden).length) {
    throw new ValidationError('Some fields are recorded by the platform and cannot be supplied.', forbidden);
  }

  // `levelId` is passed through as it arrived rather than coerced.
  // "2" and 2 are different values and issueOffer() refuses the first
  // with a field error naming the level — which is the house rule
  // (reject, never coerce) and is also what stops a client quietly
  // shipping strings that would one day be read as something else.
  const result = await issueOffer(env, {
    actor: staff,
    applicationId: body.applicationId,
    levelId: body.levelId,
    kind: body.kind,
    conditions: body.conditions ?? null,
    expiresAt: body.expiresAt,
    reason: body.reason ?? null,
  });

  return jsonResponse(shape(result), { status: 201 });
}

// ── The applicant's door ─────────────────────────────────────────────
async function answerOffer({ request, env, body, action }) {
  if (body.applicationId !== undefined) {
    throw new ValidationError(
      'Use `reference`. An application is answered by the person holding its reference, not by naming its id.',
      { applicationId: 'Use reference instead' },
    );
  }
  const result = await respondToOffer(env, {
    reference: body.reference,
    action,
    reason: body.reason ?? null,
    clientKey: request.headers.get('cf-connecting-ip') || request.headers.get('x-forwarded-for') || null,
  });
  return jsonResponse(shape(result));
}

/**
 * One response shape from both doors. `notifications` is the point of
 * it: each entry says whether that message ACTUALLY went out and, when
 * it did not, why — so no page built on this endpoint can tell an
 * applicant an email is on its way while the gateway is unconfigured.
 * That is the fault apply.js's `confirmationSent` flag was added to
 * close, kept closed here.
 */
function shape(result) {
  return {
    reference: result.application.id,
    status: result.application.status,
    offer: result.offer ?? null,
    event: result.event,
    notifications: result.notifications,
    outstanding: result.outstanding ?? undefined,
    enrolmentId: result.enrolmentId ?? null,
  };
}
