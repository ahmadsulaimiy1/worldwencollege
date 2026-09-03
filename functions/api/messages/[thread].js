// GET  /api/messages/{threadId} — one thread, and reading it marks it read.
// POST /api/messages/{threadId} — reply in it.
//
// THE FAULT THIS FILE EXISTS TO CORRECT. The collection route opened the
// conversation; without this one it could never be continued. The design
// it enforces is in functions/_lib/comms/threads.js and is not restated
// here — but three things about THIS pair are worth stating where they
// are served, because each one is a mistake that would pass review.
//
// 1 · A THREAD YOU ARE NOT IN IS NOT FOUND, NOT FORBIDDEN. Both handlers
//     reach the database through the same join to the caller's own
//     `message_participants` row, and a miss is a 404 — the identical
//     answer to a thread id that was never issued. A 403 here would make
//     the path an oracle: feed it `mth_` ids and the difference between
//     the two answers tells you which conversations exist. The learner
//     probing somebody else's thread is the case tests/messaging.test.mjs
//     drives end-to-end through this file for exactly that reason.
//
// 2 · READING IS A WRITE, AND THE WATERMARK IS NOT THE CLOCK. GET moves
//     the caller's `last_read_at` to the timestamp of the last message it
//     actually returned. Set to `now` instead, a message that arrived
//     while the page was being assembled would be marked read without
//     ever being shown, and nothing would bring the reader back to it.
//     That is why a GET here is not idempotent, and why it is still a GET:
//     the effect is on the reader's own bookmark, not on the record.
//
// 3 · THE THREAD ID COMES FROM THE PATH, AND IS THE ONLY THING THAT DOES.
//     A `threadId` in the body is refused rather than ignored, because a
//     request naming one thread in the path and another in the body has a
//     bug in it, and quietly honouring one of the two is how a reply ends
//     up in the wrong conversation.
//
// The session is verified before the body is read, in both handlers, so
// an unauthenticated caller is refused without the platform parsing
// anything they sent — the property tests/route-guard-census.test.mjs
// exercises at runtime rather than by grepping for the import.

import { jsonResponse, errorResponse, ValidationError, readJsonBody } from '../../_lib/db.js';
import { requireUser } from '../../_lib/auth/session.js';
import {
  readThread, replyToThread, parseLimit, DEFAULT_MESSAGES, MAX_MESSAGES,
} from '../../_lib/comms/threads.js';

export async function onRequestGet({ request, env, params }) {
  try {
    const user = await requireUser(request, env);
    const url = new URL(request.url);
    // The page size is the module's decision, imported rather than
    // restated — a route carrying its own "300" is a second copy of a
    // bound free to drift from the one that is actually enforced.
    const limit = parseLimit(url.searchParams.get('limit'), {
      fallback: DEFAULT_MESSAGES, max: MAX_MESSAGES,
    });
    return jsonResponse(await readThread(env, {
      user, threadId: params && params.thread, limit,
    }));
  } catch (err) {
    return errorResponse(err);
  }
}

export async function onRequestPost({ request, env, params }) {
  try {
    const user = await requireUser(request, env);
    const body = await readJsonBody(request);
    if (!body || typeof body !== 'object' || Array.isArray(body)) {
      throw new ValidationError('A JSON object is required.', {});
    }
    if (body.threadId !== undefined) {
      throw new ValidationError(
        'The thread is named by the path. A reply that also names one in the body is ambiguous and is refused rather than resolved.',
        { threadId: 'Not accepted — the path names the thread' },
      );
    }
    return jsonResponse(await replyToThread(env, {
      user, threadId: params && params.thread, body,
    }), { status: 201 });
  } catch (err) {
    return errorResponse(err);
  }
}
