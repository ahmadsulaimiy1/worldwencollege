// GET /api/student/invoice?id=pay_…
//
// One invoice, as structured data: the charge, the price it was struck
// against, the relief applied to it, what settled it, and what is left.
//
// THIS ENDPOINT TAKES AN ID, AND THAT IS NOT A CONTRADICTION OF THE
// RULE. Every other learner endpoint refuses an id because the id would
// name the *subject* — whose record to read. This one names an
// *object*: which of the caller's own invoices to render. The subject
// still comes only from the session, and the object is checked against
// it before a single field is returned. An invoice belonging to anybody
// else is answered as absent rather than as forbidden, because a 403
// would confirm the reference is real and turn this into an oracle for
// enumerating the College's payment ids. See
// functions/_lib/student/finance.js buildStudentInvoice().
//
// A missing or malformed reference is a 422 with a field map, not a
// 404: "you did not send an invoice reference" and "there is no such
// invoice" are different things to tell a person, and only one of them
// means the form needs correcting.

import { jsonResponse, errorResponse } from '../../_lib/db.js';
import { requireUser } from '../../_lib/auth/session.js';
import { buildStudentInvoice } from '../../_lib/student/finance.js';

export async function onRequestGet({ request, env }) {
  try {
    const user = await requireUser(request, env);
    const invoiceId = new URL(request.url).searchParams.get('id');
    return jsonResponse(await buildStudentInvoice(env, { userId: user.id, invoiceId }));
  } catch (err) {
    return errorResponse(err);
  }
}
