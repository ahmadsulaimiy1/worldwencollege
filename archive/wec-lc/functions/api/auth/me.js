// GET /api/auth/me — what the real (non-preview) Student Portal calls
// on load to get the signed-in student's identity. This is the
// endpoint that eventually replaces "A. Student (demo)" in
// /student-portal/preview/ with a real name once auth is wired up.

import { jsonResponse, errorResponse } from '../../_lib/db.js';
import { requireUser } from '../../_lib/auth/session.js';

export async function onRequestGet({ request, env }) {
  try {
    const user = await requireUser(request, env);
    return jsonResponse({
      id: user.id,
      email: user.email,
      preferredName: user.preferred_name,
      preferredLanguage: user.preferred_language,
      role: user.role,
    });
  } catch (err) {
    return errorResponse(err);
  }
}
