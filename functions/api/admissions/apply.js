// POST /api/admissions/apply
// The real implementation of the admissions journey's Step 2 — see
// docs/api-reference.md for the full request/response contract. This
// is the one endpoint in this build a browser can actually exercise
// today, since it needs no gateway/auth keys — only D1.

import { db, newId, jsonResponse, errorResponse, ValidationError, readJsonBody } from '../../_lib/db.js';
import { notify, notifyStaff } from '../../_lib/notifications/events.js';
import { requireUser } from '../../_lib/auth/session.js';
import { markDraftSubmitted } from '../../_lib/admissions/draft.js';
import { ENUMS, MAX_NAME_LENGTH, MAX_FREE_TEXT } from '../../_lib/admissions/fields.js';

const VALID_SOURCES = ['website', 'manual_bridge', 'referral'];

// An Authorization header is accepted but never required — this
// endpoint predates applicant accounts and must keep working for a
// visitor who fills it in without ever signing in (the mailto fallback
// path in docs/api-reference.md's Frontend Integration Pattern assumes
// exactly that). When a valid session IS present, the application is
// linked to that account (`user_id`) and the wizard's draft is marked
// submitted, so /api/admissions/draft can show the applicant their own
// finished application. An invalid or expired token is treated the
// same as no token — this is not the place to reject a request over a
// stale session when the application itself is perfectly valid.
async function optionalUser(request, env) {
  if (!request.headers.get('authorization')) return null;
  try {
    return await requireUser(request, env);
  } catch {
    return null;
  }
}

export async function onRequestPost({ request, env }) {
  try {
    const body = await readJsonBody(request);
    const errors = validate(body);
    if (Object.keys(errors).length) throw new ValidationError('Please check the highlighted fields.', errors);

    const user = await optionalUser(request, env);
    const id = newId('app');
    const t = (v) => (typeof v === 'string' && v.trim() ? v.trim() : null);
    await db(env)
      .prepare(`INSERT INTO applications
        (id, user_id, full_name, email, country, self_assessed_level_id, source,
         phone, city, nationality, is_adult, purpose, start_preference,
         residency_interest, funding, payment_plan, heard_via, notes,
         privacy_agreed_at, residential_address, emergency_contact_name,
         emergency_contact_relationship, emergency_contact_phone,
         education_level, education_institution, sponsor_name, sponsor_relationship,
         passport_number)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`)
      .bind(
        id, user ? user.id : null, body.fullName.trim(), body.email.trim().toLowerCase(),
        body.country || null, body.selfAssessedLevelId || null, body.source || 'website',
        t(body.phone), t(body.city), body.nationality ? body.nationality.toUpperCase() : null,
        body.isAdult ? 1 : 0,
        t(body.purpose), t(body.startPreference), t(body.residencyInterest),
        t(body.funding), t(body.paymentPlan), t(body.heardVia), t(body.notes),
        // Stamped server-side from the request, never taken from the
        // body: a consent timestamp a client can choose is not evidence
        // of anything.
        body.privacyAgreed ? new Date().toISOString() : null,
        t(body.residentialAddress), t(body.emergencyContactName),
        t(body.emergencyContactRelationship), t(body.emergencyContactPhone),
        t(body.educationLevel), t(body.educationInstitution),
        t(body.sponsorName), t(body.sponsorRelationship),
        // Optional and opt-in — see sql/migrations/019-kyc-documents.sql.
        // Never required; provided only by an applicant who chose the
        // full submission from day one rather than a minimal one.
        t(body.passportNumber),
      )
      .run();

    if (user) await markDraftSubmitted(env, user.id, id);

    await notify(env, 'application_received', { to: body.email, name: body.fullName.trim() });
    // The staff alert carries the whole application, not a name and a
    // country. The point of an alert is that somebody can act on it from
    // the notification — deciding what to reply needs the purpose, the
    // funding route and the residency answer, and an alert that omits
    // them just asks a human to go and look the application up.
    await notifyStaff(env, 'new_application_alert', {
      name: body.fullName.trim(), email: body.email.trim().toLowerCase(),
      country: body.country, applicationId: id,
      phone: t(body.phone), city: t(body.city), nationality: body.nationality || null,
      purpose: t(body.purpose), startPreference: t(body.startPreference),
      residencyInterest: t(body.residencyInterest),
      funding: t(body.funding), paymentPlan: t(body.paymentPlan),
      heardVia: t(body.heardVia), notes: t(body.notes),
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

  // The two-letter checks are the same shape the country check uses, and
  // nationality is validated separately from country on purpose: they
  // are different facts about a person and a form that accepts one for
  // the other has quietly lost the distinction the residency depends on.
  if (body?.nationality != null && !/^[A-Za-z]{2}$/.test(body.nationality)) {
    errors.nationality = 'Nationality must be a two-letter country code.';
  }
  for (const [field, allowed] of Object.entries(ENUMS)) {
    const v = body?.[field];
    if (v != null && v !== '' && !allowed.includes(v)) {
      errors[field] = 'Please choose one of the listed options.';
    }
  }
  for (const field of [
    'phone', 'city', 'heardVia', 'residentialAddress',
    'emergencyContactName', 'emergencyContactRelationship', 'emergencyContactPhone',
    'educationInstitution', 'sponsorName',
  ]) {
    if (typeof body?.[field] === 'string' && body[field].length > MAX_NAME_LENGTH) {
      errors[field] = 'This answer is too long.';
    }
  }
  if (typeof body?.notes === 'string' && body.notes.length > MAX_FREE_TEXT) {
    errors.notes = `Please keep this under ${MAX_FREE_TEXT} characters.`;
  }
  if (body?.passportNumber != null && body.passportNumber !== '' && !/^[A-Za-z0-9]{5,20}$/.test(body.passportNumber)) {
    errors.passportNumber = 'Enter the document number as printed — letters and digits only, 5–20 characters.';
  }
  if (body?.source != null && !VALID_SOURCES.includes(body.source)) {
    errors.source = 'Invalid source.';
  }

  return errors;
}
