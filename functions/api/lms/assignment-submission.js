// POST /api/lms/assignment-submission
// Body: { learningItemId, content }
// `content` is a text submission today — a file-upload path isn't
// built yet (no object storage integration exists), so `content` may
// also carry a URL a student pastes to externally-hosted work until
// one does. Marks the unit 'in_progress'; grading (see
// grade-assignment.js) is what can mark it 'completed'.

import { jsonResponse, errorResponse, ValidationError, readJsonBody } from '../../_lib/db.js';
import { requireUser } from '../../_lib/auth/session.js';
import { submitAssignment } from '../../_lib/lms/content.js';

export async function onRequestPost({ request, env }) {
  try {
    const user = await requireUser(request, env);
    const body = await readJsonBody(request);
    if (!body?.learningItemId) throw new ValidationError('learningItemId is required.', { learningItemId: 'Required' });

    const result = await submitAssignment(env, { userId: user.id, learningItemId: body.learningItemId, content: body.content });
    return jsonResponse(result, { status: 201 });
  } catch (err) {
    return errorResponse(err);
  }
}
