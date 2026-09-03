// GET / POST / PATCH / DELETE /api/staff/announcements — the desk the
// College speaks from.
//
// THE FAULT THIS FILE EXISTS TO CORRECT. `applications.status` carries
// seven values and `grep -rn "UPDATE applications" functions/` returns
// nothing, so six of them are unreachable and the CHECK constraint
// describes an admissions process no code performs. `announcements` is
// the same shape of table arriving with the same risk: three statuses, a
// publication window, a withdrawal with a reason, and every one of them
// dead unless something can actually move a row through them. This file
// is that something, and it is written so that each state is reachable
// only by the act that state is a record of.
//
// FOUR VERBS, AND WHAT EACH ONE REFUSES:
//
//   GET     the board this member of staff may see. Not the whole board:
//           institution and level notices are addressed to everybody at
//           that level and have nothing to protect, but a learner-scoped
//           notice is a private letter, and there is no participant row
//           to hold that relation. So staff read the private notices
//           they wrote; administrators read the board. The payload says
//           which basis it came back on.
//
//   POST    authors one. The author is the session and there is no
//           authorId field — `announcements.author_id` is NOT NULL so
//           that "nothing should address every learner in the College
//           with no person behind it", and a body parameter would let one
//           member of staff sign another's name to a notice.
//
//   PATCH   amends one, and what it will not amend is the point: the
//           audience of a PUBLISHED notice is frozen, because the table
//           keeps no `updated_at` and there is no announcement_events
//           trail, so re-scoping a notice that went to the whole College
//           down to one learner would be an unrecorded rewrite of what
//           the College told everybody. It also refuses to set
//           'withdrawn', because that verb is DELETE and DELETE demands
//           a reason.
//
//   DELETE  withdraws one. It deletes nothing. The row, its publication
//           date and its read receipts all survive, and a reason is
//           mandatory — what the College said and then took back is
//           precisely what a reviewer asks about, and a withdrawal with
//           no reason answers them with a blank.
//
// EVERY VERB IS requireStaff(). Deliberately not requireAdmin(): a tutor
// writing to their own level is the ordinary case this exists for, and
// the narrowing that matters is not the role but the visibility rule
// above, which is enforced in the SELECT rather than in a branch here.
// Amending or withdrawing is narrower again — author or administrator,
// asserted in the library beside the row it is asserted about.

import { jsonResponse, errorResponse, ValidationError, readJsonBody } from '../../_lib/db.js';
import { requireStaff } from '../../_lib/auth/session.js';
import {
  staffList, staffAnnouncement, createAnnouncement, updateAnnouncement,
  withdrawAnnouncement, parseLimit,
} from '../../_lib/comms/announcements.js';

export async function onRequestGet({ request, env }) {
  try {
    const staff = await requireStaff(request, env);
    const url = new URL(request.url);

    const id = url.searchParams.get('id');
    if (id) return jsonResponse(await staffAnnouncement(env, staff, id));

    return jsonResponse(await staffList(env, staff, {
      status: url.searchParams.get('status'),
      scope: url.searchParams.get('audienceScope'),
      levelId: parseOptionalLevel(url.searchParams.get('levelId')),
      limit: parseLimit(url.searchParams.get('limit'), 50),
    }));
  } catch (err) {
    return errorResponse(err);
  }
}

export async function onRequestPost({ request, env }) {
  try {
    const staff = await requireStaff(request, env);
    const body = await readJsonBody(request);
    assertNoAuthorClaim(body);
    return jsonResponse(await createAnnouncement(env, { actor: staff, body }), { status: 201 });
  } catch (err) {
    return errorResponse(err);
  }
}

export async function onRequestPatch({ request, env }) {
  try {
    const staff = await requireStaff(request, env);
    const body = await readJsonBody(request);
    assertNoAuthorClaim(body);
    return jsonResponse(await updateAnnouncement(env, {
      actor: staff,
      id: identify(request, body),
      body,
    }));
  } catch (err) {
    return errorResponse(err);
  }
}

export async function onRequestDelete({ request, env }) {
  try {
    const staff = await requireStaff(request, env);
    const body = await readJsonBody(request);
    return jsonResponse(await withdrawAnnouncement(env, {
      actor: staff,
      id: identify(request, body),
      reason: body ? body.reason : undefined,
    }));
  } catch (err) {
    return errorResponse(err);
  }
}

/**
 * The announcement being acted on, from `?id=` or from the body.
 *
 * Both are accepted because a DELETE with a body is awkward for some
 * clients and a PATCH without one is meaningless, but they are never
 * allowed to disagree: a request naming two different announcements has
 * a bug in it and guessing which one was meant is how the wrong notice
 * gets withdrawn.
 */
function identify(request, body) {
  const fromQuery = new URL(request.url).searchParams.get('id');
  const fromBody = body && typeof body.id === 'string' ? body.id : null;
  if (fromQuery && fromBody && fromQuery !== fromBody) {
    throw new ValidationError('The id in the query string and the id in the body are different.', { id: 'Ambiguous' });
  }
  const id = fromQuery || fromBody;
  if (!id) throw new ValidationError('id is required.', { id: 'Required' });
  return id;
}

/**
 * Refused, not ignored. A dropped `authorId` would leave a caller
 * believing the College had published under the name they supplied.
 */
function assertNoAuthorClaim(body) {
  if (body && typeof body === 'object' && !Array.isArray(body)
      && (body.authorId !== undefined || body.author !== undefined)) {
    throw new ValidationError(
      'The author of an announcement is the signed-in member of staff and cannot be set.',
      { authorId: 'Not accepted' },
    );
  }
}

function parseOptionalLevel(raw) {
  if (raw === null || raw === undefined || raw === '') return null;
  if (!/^\d+$/.test(String(raw))) {
    throw new ValidationError('levelId must be a whole number.', { levelId: 'A whole number' });
  }
  return Number(raw);
}
