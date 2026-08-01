// POST /api/enrolment/confirm
// Body: { paymentId }
// Called by the payment-success page once functions/api/payments/verify.js
// reports status=succeeded. Idempotent — calling it twice for the same
// payment does not create a duplicate enrolment.
//
// Deliberately a separate step from the payment webhook (see the
// comment in webhook-handler.js) so staff can also trigger it for a
// payment confirmed outside any gateway (a corporate invoice, a
// manual bank transfer during the Stage C manual-bridge period) —
// same enrolment logic either way.

import { db, newId, nowIso, jsonResponse, errorResponse, ValidationError, NotFoundError, readJsonBody } from '../../_lib/db.js';
import { requireUser } from '../../_lib/auth/session.js';
import { notify } from '../../_lib/notifications/events.js';
import { LmsProviderInterface } from '../../_lib/lms/provider-interface.js';

const lms = new LmsProviderInterface(); // no adapter yet — see that file's header

export async function onRequestPost({ request, env }) {
  try {
    const user = await requireUser(request, env);
    const body = await readJsonBody(request);
    if (!body?.paymentId) throw new ValidationError('paymentId is required.', { paymentId: 'Required' });

    const payment = await db(env).prepare('SELECT * FROM payments WHERE id = ?').bind(body.paymentId).first();
    if (!payment) throw new NotFoundError('Unknown payment.');
    if (payment.user_id !== user.id && user.role === 'student') {
      throw new ValidationError('This payment does not belong to your account.', {});
    }
    if (payment.status !== 'succeeded') {
      throw new ValidationError('Payment has not succeeded yet — nothing to enrol.', { status: payment.status });
    }
    // A NULL level_id (schema-documented as "full-programme payment")
    // has no single-level enrolment to create — there's no endpoint
    // that can produce this today (see docs/payments-architecture.md),
    // but guarding it here means a future or manually-inserted
    // full-programme payment fails cleanly with a 422 explaining why,
    // instead of the level lookup below silently returning nothing and
    // every field access on it throwing a raw TypeError.
    if (payment.level_id == null) {
      throw new ValidationError(
        'This payment covers the full programme, which has no single-level enrolment to confirm — full-programme enrolment isn\'t implemented yet.',
        { paymentId: 'Full-programme enrolment not supported' },
      );
    }

    const existing = await db(env)
      .prepare('SELECT * FROM enrolments WHERE user_id = ? AND level_id = ?')
      .bind(payment.user_id, payment.level_id)
      .first();
    if (existing) return jsonResponse(toEnrolmentResponse(existing)); // idempotent

    const level = await db(env).prepare('SELECT * FROM programme_levels WHERE id = ?').bind(payment.level_id).first();
    const enrolId = newId('enr');
    const startedAt = nowIso(); // matches the ISO format every other timestamp
    // column in the schema uses — the previous SQL-literal
    // datetime('now') produced a different, inconsistent format
    // ("YYYY-MM-DD HH:MM:SS" vs. the rest of the schema's
    // "YYYY-MM-DDTHH:MM:SS.sssZ").
    await db(env)
      .prepare(`INSERT INTO enrolments (id, user_id, application_id, level_id, status, started_at)
        VALUES (?, ?, NULL, ?, 'active', ?)`)
      .bind(enrolId, payment.user_id, payment.level_id, startedAt)
      .run();

    // LMS enrolment: attempted, but a missing vendor must not block
    // the platform's own enrolment record from existing — a student
    // who paid is enrolled in WEC-LC's records regardless of whether
    // the (not yet chosen) LMS integration succeeded.
    try {
      await lms.enrolStudent({ userId: payment.user_id, email: user.email, name: user.preferred_name || user.email, levelId: level.id, levelName: level.name }, env);
    } catch (err) {
      console.error('LMS enrolment step skipped (no vendor configured yet):', err.message);
    }

    await notify(env, 'enrolment_confirmed', { to: user.email, name: user.preferred_name || user.email, levelName: level.name });

    return jsonResponse(
      { id: enrolId, userId: payment.user_id, applicationId: null, levelId: level.id, status: 'active', startedAt, completedAt: null },
      { status: 201 },
    );
  } catch (err) {
    return errorResponse(err);
  }
}

// Both response paths (fresh creation and the idempotent-replay path
// for an existing enrolment) return this same camelCase shape now —
// previously the replay path returned the raw DB row verbatim
// (snake_case columns), a different shape than a fresh confirmation
// got, which is exactly the kind of inconsistency a client polling
// this endpoint after a page reload would actually hit.
function toEnrolmentResponse(row) {
  return {
    id: row.id,
    userId: row.user_id,
    applicationId: row.application_id,
    levelId: row.level_id,
    status: row.status,
    startedAt: row.started_at,
    completedAt: row.completed_at,
  };
}
