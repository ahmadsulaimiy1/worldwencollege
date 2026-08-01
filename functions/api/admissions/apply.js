// POST /api/admissions/apply
// The real implementation of the admissions journey's Step 2 — see
// docs/api-reference.md for the full request/response contract. This
// is the one endpoint in this build a browser can actually exercise
// today, since it needs no gateway/auth keys — only D1.

import { db, newId, jsonResponse, errorResponse, ValidationError } from '../../_lib/db.js';
import { notify, notifyStaff } from '../../_lib/notifications/events.js';

export async function onRequestPost({ request, env }) {
  try {
    const body = await request.json();
    const errors = validate(body);
    if (Object.keys(errors).length) throw new ValidationError('Please check the highlighted fields.', errors);

    const id = newId('app');
    await db(env)
      .prepare(`INSERT INTO applications
        (id, full_name, email, country, self_assessed_level_id, source)
        VALUES (?, ?, ?, ?, ?, ?)`)
      .bind(id, body.fullName.trim(), body.email.trim().toLowerCase(), body.country || null, body.selfAssessedLevelId || null, body.source || 'website')
      .run();

    await notify(env, 'application_received', { to: body.email, name: body.fullName });
    await notifyStaff(env, 'new_application_alert', {
      name: body.fullName, email: body.email, country: body.country, applicationId: id,
    });

    return jsonResponse({ applicationId: id, status: 'submitted' }, { status: 201 });
  } catch (err) {
    return errorResponse(err);
  }
}

function validate(body) {
  const errors = {};
  if (!body?.fullName?.trim()) errors.fullName = 'Full name is required.';
  if (!body?.email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(body.email)) errors.email = 'A valid email is required.';
  return errors;
}
