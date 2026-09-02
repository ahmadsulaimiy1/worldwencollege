// GET /api/lms/marking-queue?levelId=3&status=submitted
//
// The written work waiting to be marked, oldest first. Staff only.
//
// THE FAULT THIS ROUTE EXISTS TO CORRECT. POST /api/lms/grade-assignment
// takes a `submissionId` and nothing anywhere produced one — so on a
// platform where learners submit assignments through /my-module.html,
// no member of staff could find a submission to mark. The work arrived
// and sat there. `GET /api/lms/review-queue` had already solved exactly
// this for pronunciation recordings; this is the same answer for
// written work, and functions/_lib/lms/content.js records why the queue
// is the College's rather than one tutor's.

import { jsonResponse, errorResponse, ValidationError } from '../../_lib/db.js';
import { requireStaff } from '../../_lib/auth/session.js';
import { listSubmissionsForMarking } from '../../_lib/lms/content.js';

/** Enough to work a queue in one sitting; not a bulk export. */
const MAX = 200;
const STATUSES = ['submitted', 'graded', 'returned'];

export async function onRequestGet({ request, env }) {
  try {
    await requireStaff(request, env);
    const q = new URL(request.url).searchParams;

    const rawLevel = q.get('levelId');
    let levelId = null;
    if (rawLevel !== null && rawLevel !== '') {
      levelId = Number(rawLevel);
      if (!Number.isInteger(levelId) || levelId < 1) {
        throw new ValidationError('levelId must be a programme level.', { levelId: 'A whole number' });
      }
    }

    const status = q.get('status') || 'submitted';
    if (!STATUSES.includes(status)) {
      throw new ValidationError(`status must be one of: ${STATUSES.join(', ')}.`, { status: STATUSES.join(' or ') });
    }

    const rawLimit = Number(q.get('limit'));
    const limit = Number.isInteger(rawLimit) && rawLimit > 0 ? Math.min(rawLimit, MAX) : 50;

    return jsonResponse(
      await listSubmissionsForMarking(env, { levelId, status, limit }),
      // A queue of unmarked work is stale the moment somebody else marks
      // one of them, and it names learners. Neither belongs in a cache.
      { headers: { 'cache-control': 'private, no-store' } },
    );
  } catch (err) {
    return errorResponse(err);
  }
}
