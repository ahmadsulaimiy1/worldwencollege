// GET  /api/announcements — everything the College has addressed to the
//                           caller, pinned first, with the unread count
//                           the dashboard badge is drawn from.
// POST /api/announcements — mark one of them read, and optionally
//                           dismiss it.
//
// THE FAULT THIS FILE EXISTS TO CORRECT. Until migration 020 there was
// no row anywhere saying the College had spoken to a learner, so the
// dashboard could tell somebody their fee balance and their engagement
// and could not tell them the Registrar had written. This is the reader's
// half of that. The author's half is functions/api/staff/announcements.js.
//
// THE SUBJECT IS THE SESSION, AND THERE IS NO PARAMETER FOR IT. Both
// handlers derive the person from requireUser() and neither accepts a
// user id, student id or learner id in any form — the rule stated in
// functions/api/student/dashboard.js, and it bites harder here than
// there. `audience_scope = 'learner'` means an announcement can be a
// private letter, so a userId parameter would not merely widen a
// dashboard; it would hand one learner the notices written to another.
//
// NOTHING IN THIS FILE DECIDES WHO MAY SEE WHAT. Every query it reaches
// carries the `ADDRESSED_TO` predicate inside the SQL — see
// functions/_lib/comms/announcements.js § 1 — so an announcement the
// caller is not the audience for is never read out of the database on
// their request, and this handler has no branch that could be edited
// into letting one through. The read receipt is written by the same
// predicate: POST with an id belonging to somebody else's private notice
// inserts zero rows and answers 404, the identical answer to an id that
// was never issued, so the endpoint cannot be walked as an oracle for
// which notices exist.
//
// WHY THE READ RECEIPT IS A POST TO THIS PATH, and why it stays here.
//
// The brief specified POST /api/announcements/read, which under Pages
// Functions routing means functions/api/announcements/read.js. That
// file was not in the authoring task's ownership, so the receipt rode
// on POST to the collection instead, whose only body is the
// announcement it acknowledges.
//
// Reviewed at the close of the foundation pass on 20 August 2026 with
// the ownership restriction lifted, and DELIBERATELY LEFT ALONE. The
// file would be a two-line re-export of markRead(), and the result
// would be one act reachable at two addresses — which is the precise
// failure that pass existed to remove, and which had already produced
// two applicant-status endpoints under two different authorisation
// models. A second path buys nothing here and costs a second place for
// the rule to be edited. One act, one address.

import { jsonResponse, errorResponse, ValidationError, readJsonBody } from '../../_lib/db.js';
import { requireUser } from '../../_lib/auth/session.js';
import { learnerFeed, markRead, parseLimit, parseLanguage } from '../../_lib/comms/announcements.js';

export async function onRequestGet({ request, env }) {
  try {
    const user = await requireUser(request, env);
    const url = new URL(request.url);

    // The reader's own account setting is the default, and `?language=`
    // overrides it for this request only. A learner who has set Arabic
    // and follows an English colleague's link to a notice should be able
    // to read the English of it without changing their account.
    const language = parseLanguage(url.searchParams.get('language'), user);
    const limit = parseLimit(url.searchParams.get('limit'));

    return jsonResponse(await learnerFeed(env, { user, language, limit }));
  } catch (err) {
    return errorResponse(err);
  }
}

export async function onRequestPost({ request, env }) {
  try {
    const user = await requireUser(request, env);
    const body = await readJsonBody(request);
    if (!body || typeof body !== 'object' || Array.isArray(body)) {
      throw new ValidationError('A JSON object is required.', {});
    }
    // `userId` is refused rather than ignored. Ignoring it would let a
    // caller believe the receipt had been written against the person they
    // named, and a silently-dropped parameter is how a client ends up
    // built on an authorisation model the server never had.
    if (body.userId !== undefined || body.studentId !== undefined) {
      throw new ValidationError(
        'This endpoint acts on the signed-in learner only and takes no user parameter.',
        { userId: 'Not accepted' },
      );
    }

    return jsonResponse(await markRead(env, {
      user,
      announcementId: body.announcementId,
      dismissed: body.dismissed === undefined ? false : body.dismissed,
    }));
  } catch (err) {
    return errorResponse(err);
  }
}
