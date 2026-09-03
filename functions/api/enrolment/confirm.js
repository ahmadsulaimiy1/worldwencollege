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
//
// Full-programme payments (kind='full_programme', level_id=NULL) are
// handled here too, per Executive Decision #1: the payment covers all
// six levels financially, but only Level I's enrolment is created now.
// Levels II-VI unlock automatically as each prior level is completed —
// see functions/_lib/student/progression.js.

import { db, newId, nowIso, jsonResponse, errorResponse, ValidationError, NotFoundError, readJsonBody } from '../../_lib/db.js';
import { requireUser } from '../../_lib/auth/session.js';
import { notify } from '../../_lib/notifications/events.js';

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

    // A NULL level_id is valid only for a full_programme payment
    // (enrolment starts at Level I); any other kind with a NULL
    // level_id is a data inconsistency, not something to guess at.
    const enrolLevelId = payment.level_id != null ? payment.level_id : (payment.kind === 'full_programme' ? 1 : null);
    if (enrolLevelId == null) {
      throw new ValidationError('This payment has no programme level to enrol into.', { paymentId: 'No level' });
    }

    const existing = await db(env)
      .prepare('SELECT * FROM enrolments WHERE user_id = ? AND level_id = ?')
      .bind(payment.user_id, enrolLevelId)
      .first();
    if (existing) return jsonResponse(toEnrolmentResponse(existing)); // idempotent

    const level = await db(env).prepare('SELECT * FROM programme_levels WHERE id = ?').bind(enrolLevelId).first();
    const enrolId = newId('enr');
    const startedAt = nowIso(); // matches the ISO format every other timestamp
    // column in the schema uses — the previous SQL-literal
    // datetime('now') produced a different, inconsistent format
    // ("YYYY-MM-DD HH:MM:SS" vs. the rest of the schema's
    // "YYYY-MM-DDTHH:MM:SS.sssZ").
    await db(env)
      .prepare(`INSERT INTO enrolments (id, user_id, application_id, level_id, status, started_at)
        VALUES (?, ?, NULL, ?, 'active', ?)`)
      .bind(enrolId, payment.user_id, enrolLevelId, startedAt)
      .run();

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
