// GET /api/lms/live-sessions?levelId=<n>
// Scheduled live classes for a programme level — external join links
// (Zoom/Meet/Teams), not custom WebRTC. See docs/lms-architecture.md
// for why that's the right MVP scope.

import { jsonResponse, errorResponse, ValidationError } from '../../_lib/db.js';
import { requireUser } from '../../_lib/auth/session.js';
import { listLiveSessions } from '../../_lib/lms/content.js';

export async function onRequestGet({ request, env }) {
  try {
    const user = await requireUser(request, env);
    const levelId = Number(new URL(request.url).searchParams.get('levelId'));
    if (!Number.isInteger(levelId)) throw new ValidationError('Provide ?levelId=<integer>.', { levelId: 'Required' });

    const sessions = await listLiveSessions(env, { userId: user.id, levelId });
    return jsonResponse({ levelId, sessions });
  } catch (err) {
    return errorResponse(err);
  }
}
