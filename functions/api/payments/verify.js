// GET /api/payments/verify?id=pay_xxx
//
// Read by /student-portal/payment-complete/, the page a gateway returns
// a learner to — `create-checkout.js` names it as every checkout's
// successUrl. It is polled while the webhook lands (gateway → our
// webhook is usually fast, but the browser redirect back from checkout
// can arrive first), and it is also what tells that page whether an
// enrolment still has to be asked for.
//
// The four keys this route has always answered with — id, status,
// currency, amountCents, levelId — are unchanged and still first in the
// payload. Everything beside them comes from
// functions/_lib/payments/confirmation.js, which decides the single
// `standing` a person can be told rather than leaving two editions of a
// page to work it out from six statuses and get different answers.
//
// The subject is the session. The payment is bound to the account in
// the query itself, so somebody else's reference is indistinguishable
// from one that does not exist.

import { jsonResponse, errorResponse } from '../../_lib/db.js';
import { requireUser } from '../../_lib/auth/session.js';
import { paymentStanding } from '../../_lib/payments/confirmation.js';

export async function onRequestGet({ request, env }) {
  try {
    const user = await requireUser(request, env);
    const id = new URL(request.url).searchParams.get('id');
    return jsonResponse(await paymentStanding(env, { user, paymentId: id }));
  } catch (err) {
    return errorResponse(err);
  }
}
