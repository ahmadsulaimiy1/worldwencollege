// GET /api/payments/verify?id=pay_xxx
// Used by the checkout success page to poll status while waiting for
// the webhook to land (gateway → our webhook is usually fast, but the
// browser redirect back from checkout can arrive first).

import { db, jsonResponse, errorResponse, NotFoundError } from '../../_lib/db.js';
import { requireUser } from '../../_lib/auth/session.js';

export async function onRequestGet({ request, env }) {
  try {
    const user = await requireUser(request, env);
    const id = new URL(request.url).searchParams.get('id');
    if (!id) throw new NotFoundError('Provide ?id=<paymentId>.');

    const payment = await db(env)
      .prepare('SELECT id, status, currency, amount_cents, level_id FROM payments WHERE id = ? AND user_id = ?')
      .bind(id, user.id)
      .first();
    if (!payment) throw new NotFoundError('No payment found with that id for this account.');

    // camelCase in the response, matching every other endpoint's
    // convention (raw snake_case DB columns never cross this API
    // boundary) — see docs/api-reference.md.
    return jsonResponse({ id: payment.id, status: payment.status, currency: payment.currency, amountCents: payment.amount_cents, levelId: payment.level_id });
  } catch (err) {
    return errorResponse(err);
  }
}
