// POST /api/payments/instalment-plan
// Body: { levelId } or { fullProgramme: true }
// Requires auth. Creates an instalment plan — instalment count comes
// from platform_config.instalment_default_count (Executive Decision
// #5). Returns the plan plus its per-instalment amount breakdown; the
// student then calls POST /api/payments/create-checkout with
// { instalmentPlanId } for each instalment in turn.

import { jsonResponse, errorResponse, ValidationError, readJsonBody } from '../../_lib/db.js';
import { requireUser } from '../../_lib/auth/session.js';
import { createInstalmentPlan } from '../../_lib/payments/instalments.js';

export async function onRequestPost({ request, env }) {
  try {
    const user = await requireUser(request, env);
    const body = await readJsonBody(request);
    if (!body?.levelId && !body?.fullProgramme) {
      throw new ValidationError('Either levelId or fullProgramme is required.', { levelId: 'Required unless fullProgramme is true' });
    }
    if (body?.levelId && body?.fullProgramme) {
      throw new ValidationError('Provide either levelId or fullProgramme, not both.', {});
    }

    const plan = await createInstalmentPlan(env, { userId: user.id, levelId: body.levelId, fullProgramme: Boolean(body.fullProgramme) });
    return jsonResponse(plan, { status: 201 });
  } catch (err) {
    return errorResponse(err);
  }
}
