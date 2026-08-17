// POST /api/admissions/apply
// The real implementation of the admissions journey's Step 2 — see
// docs/api-reference.md for the full request/response contract. This
// is the one endpoint in this build a browser can actually exercise
// today, since it needs no gateway/auth keys — only D1.

import { db, newId, jsonResponse, errorResponse, ValidationError, readJsonBody } from '../../_lib/db.js';
import { notify, notifyStaff } from '../../_lib/notifications/events.js';

const VALID_SOURCES = ['website', 'manual_bridge', 'referral'];
const MAX_NAME_LENGTH = 200;

export async function onRequestPost({ request, env }) {
  try {
    const body = await readJsonBody(request);
    const errors = validate(body);
    if (Object.keys(errors).length) throw new ValidationError('Please check the highlighted fields.', errors);

    const id = newId('app');
    await db(env)
      .prepare(`INSERT INTO applications
        (id, full_name, email, country, self_assessed_level_id, source)
        VALUES (?, ?, ?, ?, ?, ?)`)
      .bind(id, body.fullName.trim(), body.email.trim().toLowerCase(), body.country || null, body.selfAssessedLevelId || null, body.source || 'website')
      .run();

    await notify(env, 'application_received', { to: body.email, name: body.fullName.trim() });
    await notifyStaff(env, 'new_application_alert', {
      name: body.fullName.trim(), email: body.email.trim().toLowerCase(), country: body.country, applicationId: id,
    });

    return jsonResponse({ applicationId: id, status: 'submitted' }, { status: 201 });
  } catch (err) {
    return errorResponse(err);
  }
}

// Every check here exists to keep a routine bad/malicious public input
// (this endpoint has no auth) from reaching the database as anything
// other than a clean 422 — in particular, `source` must be pre-validated
// against sql/schema.sql's CHECK(source IN (...)) constraint, since a
// value that violates it would otherwise surface as a raw, unclassified
// 500 rather than a field-level validation error.
function validate(body) {
  const errors = {};
  const fullName = body?.fullName?.trim();
  if (!fullName) errors.fullName = 'Full name is required.';
  else if (fullName.length > MAX_NAME_LENGTH) errors.fullName = `Full name must be ${MAX_NAME_LENGTH} characters or fewer.`;

  if (!body?.email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(body.email)) errors.email = 'A valid email is required.';
  else if (body.email.length > MAX_NAME_LENGTH) errors.email = 'Email address is too long.';

  if (body?.country != null && !/^[A-Za-z]{2}$/.test(body.country)) {
    errors.country = 'Country must be a 2-letter code.';
  }

  if (body?.selfAssessedLevelId != null) {
    const levelId = Number(body.selfAssessedLevelId);
    if (!Number.isInteger(levelId) || levelId < 1 || levelId > 6) {
      errors.selfAssessedLevelId = 'Invalid level.';
    }
  }

  if (body?.source != null && !VALID_SOURCES.includes(body.source)) {
    errors.source = 'Invalid source.';
  }

  return errors;
}
