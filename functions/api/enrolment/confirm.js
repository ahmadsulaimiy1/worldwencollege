// POST /api/enrolment/confirm
// Body: { paymentId }
//
// Called by /student-portal/payment-complete/ once
// functions/api/payments/verify.js reports the payment received and
// says, in `mayConfirmEnrolment`, that this call would be granted.
// Idempotent — calling it twice for one payment does not create a
// second enrolment.
//
// The decision lives in functions/_lib/payments/confirmation.js, where
// it can be exercised without minting a session token; this file is the
// HTTP around it. Executive Decision #1 (a full-programme payment
// enrols at Level I and unlocks the rest progressively) is documented
// there.

import { jsonResponse, errorResponse, readJsonBody } from '../../_lib/db.js';
import { requireUser } from '../../_lib/auth/session.js';
import { confirmEnrolment } from '../../_lib/payments/confirmation.js';

export async function onRequestPost({ request, env }) {
  try {
    const user = await requireUser(request, env);
    const body = await readJsonBody(request);
    const { enrolment, created } = await confirmEnrolment(env, { user, paymentId: body?.paymentId });
    return jsonResponse(enrolment, created ? { status: 201 } : undefined);
  } catch (err) {
    return errorResponse(err);
  }
}
