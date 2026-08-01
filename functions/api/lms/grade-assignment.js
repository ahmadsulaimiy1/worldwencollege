// POST /api/lms/grade-assignment
// Body: { submissionId, grade, feedback? }
// Staff/admin only. `grade` is a fraction 0..1 (not a letter/percent —
// display formatting is a frontend concern). Marks the submission's
// unit 'completed' when the grade clears platform_config's
// lms_pass_threshold.

import { jsonResponse, errorResponse, ValidationError, readJsonBody } from '../../_lib/db.js';
import { requireStaff } from '../../_lib/auth/session.js';
import { gradeAssignment } from '../../_lib/lms/content.js';

export async function onRequestPost({ request, env }) {
  try {
    const staff = await requireStaff(request, env);
    const body = await readJsonBody(request);
    if (!body?.submissionId) throw new ValidationError('submissionId is required.', { submissionId: 'Required' });
    if (typeof body?.grade !== 'number') throw new ValidationError('grade is required and must be a number.', { grade: 'Required' });

    const result = await gradeAssignment(env, { gradedBy: staff.id, submissionId: body.submissionId, grade: body.grade, feedback: body.feedback });
    return jsonResponse(result);
  } catch (err) {
    return errorResponse(err);
  }
}
