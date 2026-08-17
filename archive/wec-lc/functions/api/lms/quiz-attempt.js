// POST /api/lms/quiz-attempt
// Body: { learningItemId, answers: number[] }
// `answers[i]` is the chosen choice index for question `i` (in the
// same order returned by GET /api/lms/unit). Scored server-side only —
// the client never sees a correct_index. Append-only: every attempt is
// its own row (see quiz_attempts), so retakes never overwrite history.

import { jsonResponse, errorResponse, ValidationError, readJsonBody } from '../../_lib/db.js';
import { requireUser } from '../../_lib/auth/session.js';
import { submitQuizAttempt } from '../../_lib/lms/content.js';

export async function onRequestPost({ request, env }) {
  try {
    const user = await requireUser(request, env);
    const body = await readJsonBody(request);
    if (!body?.learningItemId) throw new ValidationError('learningItemId is required.', { learningItemId: 'Required' });
    if (!Array.isArray(body?.answers)) throw new ValidationError('answers must be an array.', { answers: 'Required' });

    const result = await submitQuizAttempt(env, { userId: user.id, learningItemId: body.learningItemId, answers: body.answers });
    return jsonResponse(result, { status: 201 });
  } catch (err) {
    return errorResponse(err);
  }
}
