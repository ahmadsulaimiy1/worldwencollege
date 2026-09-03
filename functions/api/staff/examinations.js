// GET / POST /api/staff/examinations — the marking side of the level
// examination: the queue, one script, the two readings, the written
// reconciliation, the spoken paper, and the release.
//
// TWO THINGS THIS ROUTE IS BUILT TO MAKE IMPOSSIBLE, and both of them
// are published promises rather than engineering preferences:
//
//   · A SECOND MARKER MUST NOT SEE THE FIRST MARK. scriptForMarking()
//     withholds every reading but the marker's own until theirs is on
//     the record. A second reader shown the first number is confirming
//     it, and /academics/tutor-handbook/ § IV is written on the premise
//     that two people read the script independently.
//
//   · A MARK MUST NOT REACH A LEARNER FROM ONE PAIR OF HANDS.
//     release() refuses until every criterion carries a first and a
//     second reading and every reconciliation is settled in writing.
//     "Every judged mark is read by a second marker before it reaches
//     you" — /students/examinations/ § VII.
//
// WHY THE QUEUE IS THE COLLEGE'S AND NOT ONE TUTOR'S. The same reason
// functions/api/lms/marking-queue.js gives: the teaching relation is
// composed from teaching acts, so bounding a queue by it would make a
// candidate's FIRST script invisible to everybody. The payload says so
// in `basis` rather than leaving a page to assert one.
//
// WHY EVERY ACT IS A `?action=` ON ONE POST. Cloudflare Pages routes
// /api/x/y only to functions/api/x/y.js. Nine sub-paths would be nine
// files re-exporting one handler, and docs/platform-capabilities.md
// § 10 already records the ruling: two paths for one act is the
// contradiction, not the query parameter.

import { jsonResponse, errorResponse, readJsonBody, ValidationError, parseLimit } from '../../_lib/db.js';
import { requireStaff } from '../../_lib/auth/session.js';
import { assertMayReadLearner } from '../../_lib/academic/attendance.js';
import {
  markingQueue, scriptForMarking, sittingsFor,
  enterCandidate, recordMarks, settleReconciliation, recordSpokenPaper,
  release, closeModeration, setAside, voidAttempt, liftLateCap,
  publishedProcedure, publishedPaperFor,
} from '../../_lib/academic/examinations.js';

const ACTIONS = [
  'enter', 'mark', 'settle', 'spoken', 'release', 'close_moderation',
  'set_aside', 'void', 'lift_cap',
];

export async function onRequestGet({ request, env }) {
  try {
    const staff = await requireStaff(request, env);
    const url = new URL(request.url);

    const examinationId = url.searchParams.get('examinationId');
    if (examinationId) {
      const role = url.searchParams.get('role') || 'first';
      return jsonResponse(await scriptForMarking(env, { staff, examinationId, role }));
    }

    // A named learner: their sittings, behind the same teaching-relation
    // check every other staff read of a named learner passes through.
    const userId = url.searchParams.get('userId');
    if (userId) {
      const authorisation = await assertMayReadLearner(env, staff, userId);
      const levelParam = url.searchParams.get('levelId');
      return jsonResponse({
        authorisation,
        sittings: await sittingsFor(env, { userId, levelId: levelParam ? Number(levelParam) : null }),
        procedure: publishedProcedure('en'),
      });
    }

    const role = url.searchParams.get('role') || 'first';
    const limit = parseLimit(url.searchParams.get('limit'), { field: 'limit', fallback: 50, max: 200 });
    const queue = await markingQueue(env, { staff, role, limit });
    return jsonResponse({ ...queue, procedure: publishedProcedure('en') });
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
    const url = new URL(request.url);
    const action = url.searchParams.get('action') || body.action;
    if (!ACTIONS.includes(action)) {
      throw new ValidationError('That is not an act on an examination.', { action: `One of: ${ACTIONS.join(', ')}.` });
    }

    if (action === 'enter') {
      if (!body.userId) throw new ValidationError('userId is required.', { userId: 'Required.' });
      // The relation is checked BEFORE anything else, so a member of
      // staff with no relation to a learner cannot use this endpoint's
      // field errors to discover which learners or levels exist.
      await assertMayReadLearner(env, staff, body.userId);
      const paper = await publishedPaperFor(env, body.levelId);
      if (!paper) {
        throw new ValidationError(
          `No examination paper is published for Level ${body.levelId}. A candidate cannot be entered for a paper the College has not set; a paper is authored and published at /api/admin/examination-papers.`,
          { levelId: 'no_published_paper' },
        );
      }
      const sitting = await enterCandidate(env, { actor: staff, userId: body.userId, levelId: body.levelId });
      return jsonResponse({ sitting }, { status: 201 });
    }

    if (!body.examinationId && action !== 'settle') {
      throw new ValidationError('examinationId is required.', { examinationId: 'Required.' });
    }

    switch (action) {
      case 'mark':
        return jsonResponse({
          sitting: await recordMarks(env, {
            actor: staff,
            examinationId: body.examinationId,
            role: body.role,
            marks: body.marks,
          }),
        }, { status: 201 });

      case 'settle':
        if (!body.reconciliationId) {
          throw new ValidationError('reconciliationId is required.', { reconciliationId: 'Required.' });
        }
        return jsonResponse({
          sitting: await settleReconciliation(env, {
            actor: staff,
            reconciliationId: body.reconciliationId,
            settledMark: body.settledMark,
            statement: body.statement,
            how: body.how || 'agreed',
            thirdMarkerId: body.thirdMarkerId ?? null,
          }),
        });

      case 'spoken':
        return jsonResponse({
          sitting: await recordSpokenPaper(env, {
            actor: staff,
            examinationId: body.examinationId,
            recordingId: body.recordingId ?? null,
            passed: body.passed,
          }),
        });

      case 'release':
        return jsonResponse({ sitting: await release(env, { actor: staff, examinationId: body.examinationId }) });

      case 'close_moderation':
        return jsonResponse({ sitting: await closeModeration(env, { actor: staff, examinationId: body.examinationId }) });

      case 'set_aside':
        return jsonResponse({
          sitting: await setAside(env, {
            actor: staff,
            examinationId: body.examinationId,
            reason: body.reason,
            note: body.note ?? null,
          }),
        });

      case 'void':
        return jsonResponse({
          sitting: await voidAttempt(env, {
            actor: staff,
            examinationId: body.examinationId,
            reason: body.reason,
            note: body.note,
          }),
        });

      case 'lift_cap':
        return jsonResponse({
          sitting: await liftLateCap(env, {
            actor: staff,
            examinationId: body.examinationId,
            reason: body.reason,
          }),
        });

      default:
        // Unreachable: ACTIONS is checked above. Present so a value
        // added to that list and forgotten here fails loudly rather
        // than returning a 200 that did nothing.
        throw new ValidationError('That act is listed but not handled.', { action });
    }
  } catch (err) {
    return errorResponse(err);
  }
}
