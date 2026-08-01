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

import { db, newId, jsonResponse, errorResponse, ValidationError, NotFoundError } from '../../_lib/db.js';
import { requireUser } from '../../_lib/auth/session.js';
import { notify } from '../../_lib/notifications/events.js';
import { LmsProviderInterface } from '../../_lib/lms/provider-interface.js';

const lms = new LmsProviderInterface(); // no adapter yet — see that file's header

export async function onRequestPost({ request, env }) {
  try {
    const user = await requireUser(request, env);
    const body = await request.json();
    if (!body?.paymentId) throw new ValidationError('paymentId is required.', { paymentId: 'Required' });

    const payment = await db(env).prepare('SELECT * FROM payments WHERE id = ?').bind(body.paymentId).first();
    if (!payment) throw new NotFoundError('Unknown payment.');
    if (payment.user_id !== user.id && user.role === 'student') {
      throw new ValidationError('This payment does not belong to your account.', {});
    }
    if (payment.status !== 'succeeded') {
      throw new ValidationError('Payment has not succeeded yet — nothing to enrol.', { status: payment.status });
    }

    const existing = await db(env)
      .prepare('SELECT * FROM enrolments WHERE user_id = ? AND level_id = ?')
      .bind(payment.user_id, payment.level_id)
      .first();
    if (existing) return jsonResponse(existing); // idempotent

    const level = await db(env).prepare('SELECT * FROM programme_levels WHERE id = ?').bind(payment.level_id).first();
    const enrolId = newId('enr');
    await db(env)
      .prepare(`INSERT INTO enrolments (id, user_id, application_id, level_id, status, started_at)
        VALUES (?, ?, NULL, ?, 'active', datetime('now'))`)
      .bind(enrolId, payment.user_id, payment.level_id)
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

    return jsonResponse({ id: enrolId, status: 'active', levelId: level.id }, { status: 201 });
  } catch (err) {
    return errorResponse(err);
  }
}
