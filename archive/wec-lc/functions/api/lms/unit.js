// GET /api/lms/unit?id=unt_xxx
// Full detail for one unit — ordered learning items, quiz questions
// (choices only, never the correct answer — see content.js), and the
// signed-in student's own latest assignment submission per item.

import { jsonResponse, errorResponse, ValidationError } from '../../_lib/db.js';
import { requireUser } from '../../_lib/auth/session.js';
import { getUnitDetail } from '../../_lib/lms/content.js';

export async function onRequestGet({ request, env }) {
  try {
    const user = await requireUser(request, env);
    const id = new URL(request.url).searchParams.get('id');
    if (!id) throw new ValidationError('Provide ?id=<unitId>.', { id: 'Required' });

    const unit = await getUnitDetail(env, { userId: user.id, unitId: id });
    return jsonResponse(unit);
  } catch (err) {
    return errorResponse(err);
  }
}
