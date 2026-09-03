// GET /api/admissions/track?ref=app_…
//
// THE FAULT THIS FILE EXISTS TO CORRECT. `admissions/status.js` answers
// the one question it was built for — id, status, date — and that was
// enough while `status` never changed. It cannot change any more (see
// functions/_lib/admissions/lifecycle.js for what did), and a bare word
// like `placement_pending` is not an answer to the question an applicant
// is actually asking, which is "is anyone doing anything, is any of it
// mine, and when". An applicant who cannot see that writes an email
// instead, and an admissions inbox is where an application goes to
// become somebody's afternoon.
//
// So this returns the whole of what the reference buys: the five
// published stages with the applicant's position marked, the audited
// timeline of every move, what is outstanding and WHOSE it is, the live
// offer with its expiry, and what happens next.
//
// IT WORKS WITHOUT AN ACCOUNT, AND THAT IS NOT A SHORTCUT. There is no
// applicant sign-in to require: `applications.user_id` is NULL for
// everybody who applied without an account, and the College cannot
// authenticate applicants today at all — its auth provider's DNS does
// not resolve. pages/admissions.html has already published the design
// this endpoint implements: the `app_` reference "is the only key to
// your record, and it is deliberately the only key — the College will
// not disclose an application state to anyone who does not hold it,
// including someone who knows your email address."
//
// WHICH MAKES THE REFERENCE A BEARER CREDENTIAL, and it is treated as
// one rather than as a lookup key. The comparison is constant-time
// against a same-length decoy on a miss, a miss and a malformed
// reference get the identical refusal, and every attempt — hit or miss —
// spends allowance from a fixed window. All three live in lifecycle.js
// § THE BEARER CHECK, where the reasoning sits beside the code.
//
// A REQUEST WITH NO REFERENCE IS 401, NOT 400. That is the honest
// status: this endpoint has an authentication boundary, the credential
// is a reference rather than a session, and a caller presenting none has
// not been refused for malforming anything. It is also what
// tests/route-guard-census.test.mjs asserts of every route outside its
// PUBLIC list, so the census keeps holding this route to the boundary it
// really has. The census has no category for reference-authenticated
// routes; tests/applicant-lifecycle.test.mjs asserts the other half —
// that a caller who DOES hold one gets through.
//
// AND THERE IS NOWHERE TO PUT AN EMAIL ADDRESS. `email`, `q` and
// `applicant` are refused rather than ignored, by the rule
// functions/api/announcements/index.js states: a parameter silently
// dropped is how a client gets built on an authorisation model the
// server never had. Here that client would be a page offering to find
// somebody's application from their email address.

import { jsonResponse, errorResponse, ValidationError } from '../../_lib/db.js';
import { AuthError } from '../../_lib/auth/session.js';
import { trackApplication, PUBLISHED_JOURNEY } from '../../_lib/admissions/lifecycle.js';

/** Parameters that would make this a search rather than a lookup. */
const FORBIDDEN = ['email', 'q', 'applicant', 'name', 'userId', 'user_id', 'id'];

export async function onRequestGet({ request, env }) {
  try {
    const url = new URL(request.url);

    const fields = {};
    for (const key of FORBIDDEN) {
      if (url.searchParams.has(key)) {
        fields[key] = key === 'id'
          ? 'Use ?ref= — this endpoint takes the application reference as a credential, not as an id.'
          : 'Not accepted. An application is disclosed only to someone holding its reference.';
      }
    }
    if (Object.keys(fields).length) {
      throw new ValidationError(
        'This endpoint takes an application reference and nothing else. It will not find an application from an email address or a name.',
        fields,
      );
    }

    const reference = url.searchParams.get('ref');
    if (!reference) {
      throw new AuthError(
        'Provide ?ref=<your application reference>. It begins app_ and was shown to you when your application was created; it is the only key to your record.',
      );
    }

    const record = await trackApplication(env, {
      reference,
      // Used for the lookup allowance and for nothing else — never
      // stored, never logged, never returned.
      clientKey: request.headers.get('cf-connecting-ip') || request.headers.get('x-forwarded-for') || null,
    });

    return jsonResponse({
      ...record,
      // Returned beside the applicant's own position so a page can draw
      // the whole published route rather than reimplementing it, and so
      // the route the page draws and the route the machine enforces are
      // the same list.
      publishedJourney: PUBLISHED_JOURNEY,
    });
  } catch (err) {
    // A refusal that names when, not merely that. errorResponse() carries
    // the message and field map; the allowance rides beside them, the
    // way functions/api/messages/index.js does it.
    if (err.name === 'RateLimitError') {
      return jsonResponse(
        { error: err.name, message: err.message, fields: err.fields, allowance: err.allowance },
        { status: err.httpStatus },
      );
    }
    return errorResponse(err);
  }
}
