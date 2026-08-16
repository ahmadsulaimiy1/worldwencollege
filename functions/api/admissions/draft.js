// GET/PUT /api/admissions/draft
// The applicant's own in-progress wizard state — what the "My
// Application" dashboard reads to show step-by-step completion.
// Requires auth (an applicant account, the same Clerk-backed session
// the Student Portal uses — see docs/auth-architecture.md). No id/user
// parameter is accepted on either verb, deliberately, so this endpoint
// can never be used to read or edit another applicant's draft.

import { db, jsonResponse, errorResponse, readJsonBody } from '../../_lib/db.js';
import { requireUser } from '../../_lib/auth/session.js';
import { getOrCreateDraft, saveDraftStep } from '../../_lib/admissions/draft.js';
import { STEP_KEYS } from '../../_lib/admissions/fields.js';

export async function onRequestGet({ request, env }) {
  try {
    const user = await requireUser(request, env);
    const draft = await getOrCreateDraft(env, user.id);

    // A submitted application is looked up directly on `applications`
    // rather than trusted from `draft.submittedApplicationId` alone —
    // an applicant who somehow has a real application row but an
    // out-of-sync draft (a retried request, a manually-bridged
    // application later linked to their account) should still see it.
    const application = await db(env)
      .prepare('SELECT id, status, created_at FROM applications WHERE user_id = ? ORDER BY created_at DESC LIMIT 1')
      .bind(user.id)
      .first();

    return jsonResponse({
      steps: STEP_KEYS,
      completedSteps: draft.completedSteps,
      data: draft.data,
      updatedAt: draft.updatedAt,
      application: application
        ? { id: application.id, status: application.status, createdAt: application.created_at }
        : null,
    });
  } catch (err) {
    return errorResponse(err);
  }
}

export async function onRequestPut({ request, env }) {
  try {
    const user = await requireUser(request, env);
    const body = await readJsonBody(request);
    const draft = await saveDraftStep(env, user.id, body.step, body.fields || {});
    return jsonResponse({
      steps: STEP_KEYS,
      completedSteps: draft.completedSteps,
      data: draft.data,
      updatedAt: draft.updatedAt,
    });
  } catch (err) {
    return errorResponse(err);
  }
}
