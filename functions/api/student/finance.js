// GET /api/student/finance
//
// The caller's own statement of account: the tuition assessed against
// them, what it is composed of, every payment taken, every receipt
// issued, every scholarship or promotional relief and the authority it
// rests on, the instalment schedule, and the outstanding balance —
// computed from the ledger rather than read from a stored copy of
// itself. The arithmetic travels with the answer; see
// functions/_lib/student/finance.js for why none of it is stored.
//
// THE SUBJECT COMES FROM THE SESSION AND FROM NOWHERE ELSE. There is no
// userId, no studentId and no enrolment parameter, for the reason
// stated once in functions/api/student/dashboard.js and doubly true
// here: this endpoint reads a named person's scholarships, their
// remaining debt and the currency they pay in, and an endpoint that
// accepted an id would hand all three to anyone who changed a string in
// a URL.
//
// IT IS A GET AND IT WRITES NOTHING. No receipt is issued here, no plan
// is advanced, no status moves. Money changes state through the gateway
// webhooks (functions/_lib/payments/webhook-handler.js) and nowhere
// else; a learner refreshing their own statement must not be able to
// move a payment.

import { jsonResponse, errorResponse } from '../../_lib/db.js';
import { requireUser } from '../../_lib/auth/session.js';
import { buildStudentFinance } from '../../_lib/student/finance.js';

export async function onRequestGet({ request, env }) {
  try {
    const user = await requireUser(request, env);
    return jsonResponse(await buildStudentFinance(env, user.id));
  } catch (err) {
    return errorResponse(err);
  }
}
