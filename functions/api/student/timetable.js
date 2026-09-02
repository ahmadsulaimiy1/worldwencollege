// GET /api/student/timetable — what is next for the caller, in one list,
// in their own hours.
//
// THE FAULT THIS FILE EXISTS TO CORRECT. Before it, a learner answering
// "what have I got this week" read three screens: the level's class list
// from the LMS, their tutorial bookings from nowhere at all (nothing
// read `slot_bookings`), and the expiry on their offer from an email
// they may still have. The item with a deadline on it was reliably the
// one they did not check. This route merges the three and sorts them,
// and functions/_lib/lms/timetable.js carries the reasoning for each
// stream and for the one stream the schema cannot yet supply.
//
// NO SUBJECT PARAMETER, by the rule functions/api/student/dashboard.js
// sets out: the learner IS the session. `days` and `limit` shape the
// window and are validated; neither can name another person, and there
// is no third parameter that could.
//
// TWO REPRESENTATIONS, ONE QUERY. `?format=ics` returns the same events
// as iCalendar for the calendar the learner already keeps. It is a
// download rather than a subscription, and deliberately so — a webcal
// URL a calendar client can poll must authenticate itself without a
// header, which means a long-lived secret in the URL and a table to
// revoke it. Neither exists. A download from a session-guarded route
// leaks nothing; a subscription link would leak a person's whole
// timetable to anyone who ever saw the URL.

import { jsonResponse, errorResponse, ValidationError } from '../../_lib/db.js';
import { requireUser } from '../../_lib/auth/session.js';
import { learnerTimetable, toIcs, parseLimit, parseHorizonDays } from '../../_lib/lms/timetable.js';

export async function onRequestGet({ request, env }) {
  try {
    const user = await requireUser(request, env);
    const url = new URL(request.url);

    const format = (url.searchParams.get('format') || 'json').toLowerCase();
    if (format !== 'json' && format !== 'ics') {
      throw new ValidationError('format must be json or ics.', { format: 'json or ics' });
    }

    const horizonDays = parseHorizonDays(url.searchParams.get('days'));
    // A calendar export that stopped at twenty events would silently
    // hand a learner a term with most of it missing, so the ICS takes
    // the whole window unless the caller asks for fewer. The JSON keeps
    // the smaller default because it renders a screen, not a file.
    const limit = url.searchParams.get('limit') !== null
      ? parseLimit(url.searchParams.get('limit'))
      : (format === 'ics' ? 200 : undefined);

    const feed = await learnerTimetable(env, {
      userId: user.id,
      horizonDays,
      ...(limit === undefined ? {} : { limit }),
    });

    if (format === 'ics') {
      return new Response(toIcs(feed), {
        headers: {
          'content-type': 'text/calendar; charset=utf-8',
          // A filename, because a browser handed text/calendar with no
          // disposition saves it as the route name and the learner
          // double-clicks something their calendar will not open.
          'content-disposition': 'attachment; filename="worldwide-english-college-timetable.ics"',
          // A timetable is a personal record. Nothing between here and
          // the learner may keep a copy of it.
          'cache-control': 'private, no-store',
        },
      });
    }

    return jsonResponse(feed, { headers: { 'cache-control': 'private, no-store' } });
  } catch (err) {
    return errorResponse(err);
  }
}
