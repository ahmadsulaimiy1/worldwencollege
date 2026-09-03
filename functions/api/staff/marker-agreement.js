// GET /api/staff/marker-agreement — a marker's own reliability.
//
// /academics/tutor-handbook/ § VI publishes this as an undertaking to
// every member of academic staff: "Each term a tutor is shown the
// agreement between their own marks and their second markers', with the
// cases that diverged."
//
// Until the level examination had a table there was nothing to compute
// it from — no record anywhere held two readings of one script. There
// is now, so the undertaking is deliverable and this is the route that
// delivers it.
//
// ─────────────────────────────────────────────────────────────────────
// THE MARKER IS THE SESSION, AND THERE IS NO PARAMETER FOR ANOTHER
// ─────────────────────────────────────────────────────────────────────
// The published promise is that a tutor is shown THEIR OWN reliability.
// A `?markerId=` on this route would turn an undertaking to a person
// into a league table over their colleagues, and would do it without
// anybody deciding to — a query parameter is all it takes.
//
// The moderating committee's view of the whole cohort is a different
// instrument with a different authority. It is not this one, and it
// does not arrive by widening this one.

import { jsonResponse, errorResponse, ValidationError } from '../../_lib/db.js';
import { requireStaff } from '../../_lib/auth/session.js';
import { markerAgreement, DEFAULT_WINDOW_DAYS } from '../../_lib/academic/marker-agreement.js';

export async function onRequestGet({ request, env }) {
  try {
    const staff = await requireStaff(request, env);
    const raw = new URL(request.url).searchParams.get('days');
    let windowDays = DEFAULT_WINDOW_DAYS;
    if (raw !== null && raw !== '') {
      if (!/^\d+$/.test(raw)) {
        throw new ValidationError('days must be a whole number.', { days: 'A whole number.' });
      }
      windowDays = Number(raw);
    }
    return jsonResponse(await markerAgreement(env, { markerId: staff.id, windowDays }));
  } catch (err) {
    return errorResponse(err);
  }
}
