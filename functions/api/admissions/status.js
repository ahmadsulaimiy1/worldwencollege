// GET /api/admissions/status?id=app_xxx
// Deliberately looked up by application id, not by session — an
// applicant checking status doesn't have an account yet (that's
// created later, on enrolment). Returns only what's safe to show
// someone holding the id, not the full row.

import { db, jsonResponse, errorResponse, NotFoundError } from '../../_lib/db.js';

export async function onRequestGet({ request, env }) {
  try {
    const id = new URL(request.url).searchParams.get('id');
    if (!id) throw new NotFoundError('Provide ?id=<applicationId>.');

    const app = await db(env)
      .prepare('SELECT id, status, created_at FROM applications WHERE id = ?')
      .bind(id)
      .first();
    if (!app) throw new NotFoundError('No application found with that id.');

    // camelCase in the response, matching every other endpoint's
    // convention (raw snake_case DB columns never cross this API
    // boundary) — see docs/api-reference.md.
    return jsonResponse({ id: app.id, status: app.status, createdAt: app.created_at });
  } catch (err) {
    return errorResponse(err);
  }
}
