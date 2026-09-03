// GET  /api/messages — the caller's own threads, newest activity first,
//                      each with its unread count, plus the offices they
//                      may write to and what is left of today's allowance.
// POST /api/messages — open a thread and say the first thing in it.
//
// THE FAULT THIS FILE EXISTS TO CORRECT. Before it, `grep -rn "INSERT
// INTO message" functions/` returned nothing: the platform could enrol a
// learner, mark their work and confer an award on it, and had no way for
// that learner to ask their tutor a question. "Contact tutors" sat on the
// Board's list with no machine under it. The reasoning behind the machine
// — and the reason it is shaped the way it is rather than as a chat box —
// is in functions/_lib/comms/threads.js; this file is the two doors.
//
// THE SUBJECT IS THE SESSION, AND THERE IS NO PARAMETER FOR IT. Both
// handlers derive the caller from requireUser() and neither accepts a
// user id, student id or learner id as the SUBJECT of the request — the
// rule stated in functions/api/student/dashboard.js.
//
// AND THE RECIPIENT IS AN OFFICE, WHICH IS THE PART THAT IS SPECIFIC TO
// THIS ENDPOINT. A learner's POST names `recipient: "tutors"` or
// `recipient: "registrar"` and a scope; it has nowhere to put a person.
// That is not politeness about privacy. functions/_lib/academic/
// attendance.js decides which learners a member of staff may read partly
// from who shares an open thread with them, so a learner who could name
// an arbitrary user id could hand a stranger read access to their own
// engagement record by addressing an envelope to them. The one caller
// who MAY name a person is a member of staff, and only for a learner
// assertMayReadLearner() already says they teach.
//
// NOTHING IN THIS FILE DECIDES WHO MAY SEE WHAT. The thread list is a
// join through the caller's own `message_participants` row — the schema's
// design, kept literally — so a thread the caller was never added to is
// not read out of the database on their request and there is no branch
// here that could be edited into letting one through.
//
// WHY OPENING A THREAD IS A POST TO THE COLLECTION. It creates a thread
// and its first message together, because a thread with no message in it
// is not a conversation; there is no separate "create empty thread"
// state to be left behind by a half-finished request.

import { jsonResponse, errorResponse, ValidationError, readJsonBody } from '../../_lib/db.js';
import { requireUser } from '../../_lib/auth/session.js';
import { listThreads, openThread, parseLimit } from '../../_lib/comms/threads.js';

export async function onRequestGet({ request, env }) {
  try {
    const user = await requireUser(request, env);
    const url = new URL(request.url);
    const limit = parseLimit(url.searchParams.get('limit'));
    return jsonResponse(await listThreads(env, { user, limit }));
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
    // `threadId` here would be a reply sent to the wrong door. Refused
    // rather than ignored, so it fails loudly in development instead of
    // quietly opening a duplicate thread in production.
    if (body.threadId !== undefined) {
      throw new ValidationError(
        'To reply in a thread, POST to /api/messages/{threadId}. This path opens a new one.',
        { threadId: 'Not accepted here' },
      );
    }
    const opened = await openThread(env, { user, body });
    return jsonResponse(opened, { status: 201 });
  } catch (err) {
    // The rate limit carries its own allowance so a client can say when,
    // not merely that it was refused. errorResponse() emits `fields` and
    // the message; the allowance rides beside them.
    if (err.name === 'RateLimitError') {
      return jsonResponse({
        error: err.name, message: err.message, fields: err.fields, allowance: err.allowance,
      }, { status: err.httpStatus });
    }
    return errorResponse(err);
  }
}
