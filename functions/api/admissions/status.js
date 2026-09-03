// GET /api/admissions/status?id=app_…
//
// THE FAULT THIS FILE NOW CORRECTS, which is a fault it used to be.
//
// This is the College's oldest applicant-facing route. It answered
// "what is the state of my application?" with a bare
// `SELECT id, status, created_at FROM applications WHERE id = ?`: no
// allowance, no constant-time compare, and a distinct 404 for a
// reference that does not exist.
//
// Then functions/api/admissions/track.js was written to answer the same
// question in full, and it treats the reference as what
// pages/admissions.html has always published it as — "the only key to
// your record". It compares in constant time against a same-length
// decoy so a hit and a miss cost the same; it gives a malformed
// reference, an unknown one and a deleted one the identical refusal, so
// no answer ever says "that reference exists"; and it spends allowance
// from a fixed window per client address whether or not it hits.
//
// Two routes, one `applications` row, two authorisation models — and
// the weaker one defeats the stronger. Every protection in track.js is
// decorative while a caller can enumerate references here at any rate
// they like and read "no application found with that id" as
// confirmation of the ones that do not exist. That is not a theoretical
// difference: it is the whole of what the bearer discipline buys.
//
// So there is now ONE door. `applicationByReference()` in
// functions/_lib/admissions/lifecycle.js § THE BEARER CHECK is the only
// place that turns a reference into a row, and both routes go through
// it. What is left here is what this route was always for: the SHORT
// answer, three fields, for the caller who wants a status and not a
// journey. Deleting the route instead would have broken every client
// that has ever polled it, for no gain — the fact had one owner from
// the moment they shared the check.
//
// WHAT CHANGED FOR A CALLER, stated plainly because it is a behaviour
// change on a published endpoint: an unknown or malformed id used to
// answer 404 and now answers 401 with the same words track.js uses, and
// a caller with no ?id= at all now gets 401 rather than 404. Both are
// the honest status — this endpoint has an authentication boundary and
// the reference is the credential.
//
// camelCase in the response, matching every other endpoint's convention
// (raw snake_case DB columns never cross this API boundary) — see
// docs/api-reference.md.

import { jsonResponse, errorResponse } from '../../_lib/db.js';
import { AuthError } from '../../_lib/auth/session.js';
import { applicationByReference } from '../../_lib/admissions/lifecycle.js';

export async function onRequestGet({ request, env }) {
  try {
    const id = new URL(request.url).searchParams.get('id');
    if (!id) {
      throw new AuthError(
        'Provide ?id=<your application reference>. It begins app_ and was shown to you when your application was created; it is the only key to your record.',
      );
    }

    const { application } = await applicationByReference(env, {
      reference: id,
      // The allowance bucket, and nothing else. Never stored, never
      // logged, never returned — the same rule track.js states.
      clientKey: request.headers.get('cf-connecting-ip') || request.headers.get('x-forwarded-for') || null,
    });

    return jsonResponse({
      id: application.id,
      status: application.status,
      createdAt: application.created_at,
    });
  } catch (err) {
    // The allowance rides beside the refusal so a client is told when it
    // may ask again rather than only that it may not — same shape as
    // track.js and functions/api/messages/index.js.
    if (err.name === 'RateLimitError') {
      return jsonResponse(
        { error: err.name, message: err.message, fields: err.fields, allowance: err.allowance },
        { status: err.httpStatus },
      );
    }
    return errorResponse(err);
  }
}
