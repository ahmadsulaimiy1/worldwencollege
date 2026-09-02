// GET / POST /api/staff/attendance — a tutor's view of their own
// learners' engagement, and the one place a member of staff may state an
// engagement fact the platform could not read.
//
// THE FAULT THIS FILE EXISTS TO CORRECT. The natural staff endpoint for
// this data takes a level and returns everybody at it, because that is
// the shape the query wants to be. It is also how a tutor appointed on
// Monday acquires the complete engagement history of two hundred people
// they have never taught — the exact failure `message_participants` was
// designed against, where the schema notes that "a tutor sees a thread
// only by holding a row here, so no query shape can return a thread they
// were never added to".
//
// There is no tutor-to-learner assignment table to hold that row for
// attendance, so the relation is composed from the teaching acts that
// already exist — a live message thread, a booked tutorial, a marked
// assignment, a register taken — in
// functions/_lib/academic/attendance.js § WHO A TUTOR MAY READ. Every
// read of a named learner passes through assertMayReadLearner() and a
// tutor with no relation gets 403, not a record.
//
// The POST is an override, and it is not a correction of the record so
// much as an addition to it: the platform's own reading is recomputed
// from evidence that is still there and returned beside the new state,
// so a learner shown "your tutor marked this absent" can also be shown
// what the platform read. A reason is required in every case — an
// unexplained mark on somebody's record is the thing this endpoint most
// needs to be incapable of.

import { jsonResponse, errorResponse, ValidationError, readJsonBody } from '../../_lib/db.js';
import { requireStaff } from '../../_lib/auth/session.js';
import {
  learnerEngagement, staffRoster, assertMayReadLearner, recordStaffRegister,
  parseWeeks, parseLevelId,
} from '../../_lib/academic/attendance.js';

/** Enough to work through a tutorial group in one screen; not a bulk export. */
const MAX_ROSTER = 200;

export async function onRequestGet({ request, env }) {
  try {
    const staff = await requireStaff(request, env);
    const url = new URL(request.url);
    const userId = url.searchParams.get('userId');

    // No learner named: the tutor's own roster, which is the only list
    // this endpoint will produce. There is deliberately no search.
    if (!userId) {
      const limit = parseLimit(url.searchParams.get('limit'));
      return jsonResponse(await staffRoster(env, staff, { limit }));
    }

    const authorisation = await assertMayReadLearner(env, staff, userId);
    const weeks = parseWeeks(url.searchParams.get('weeks'));
    const levelId = parseLevelId(url.searchParams.get('levelId'));
    const record = await learnerEngagement(env, { userId, levelId, weeks });

    // The tutor sees the same notice the learner sees. A staff view that
    // strips the definition is how "engagement" becomes "attendance" in
    // the sentence a tutor writes to a learner.
    return jsonResponse({ ...record, authorisation });
  } catch (err) {
    return errorResponse(err);
  }
}

export async function onRequestPost({ request, env }) {
  try {
    const staff = await requireStaff(request, env);
    const body = await readJsonBody(request);

    if (!body || typeof body !== 'object' || Array.isArray(body)) {
      throw new ValidationError('A JSON object is required.', {});
    }
    if (!body.userId || typeof body.userId !== 'string') {
      throw new ValidationError('userId is required.', { userId: 'Required' });
    }
    // The relation is checked BEFORE the body is validated any further,
    // so a tutor with no relation to a learner cannot use this endpoint's
    // field-level errors to probe which module ids or session ids exist.
    await assertMayReadLearner(env, staff, body.userId);

    const result = await recordStaffRegister(env, {
      actor: staff,
      userId: body.userId,
      basis: body.basis,
      unitId: body.unitId ?? null,
      liveSessionId: body.liveSessionId ?? null,
      windowStart: body.windowStart ?? null,
      windowEnd: body.windowEnd ?? null,
      state: body.state,
      minutesPresent: body.minutesPresent ?? null,
      reason: body.reason,
    });
    return jsonResponse(result, { status: 201 });
  } catch (err) {
    return errorResponse(err);
  }
}

function parseLimit(raw) {
  if (raw === null || raw === undefined || raw === '') return 50;
  if (!/^\d+$/.test(String(raw))) {
    throw new ValidationError('limit must be a whole number.', { limit: 'A whole number' });
  }
  const n = Number(raw);
  if (n < 1 || n > MAX_ROSTER) {
    throw new ValidationError(`limit must be between 1 and ${MAX_ROSTER}.`, { limit: `Between 1 and ${MAX_ROSTER}` });
  }
  return n;
}
