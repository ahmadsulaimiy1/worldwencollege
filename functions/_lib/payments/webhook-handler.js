// Shared processing behind every functions/api/payments/webhook-*.js
// endpoint — each of those files is ~5 lines that just names its
// gateway; all the actual logic (verify → idempotency → update →
// side effects) lives here once, not duplicated four times.
//
// Concurrency note: this file was audited and found to have three real
// race conditions under concurrent webhook delivery (a realistic case —
// gateways do sometimes fire more than one event close together, or
// retry a delivery in parallel with the original). Each is closed by a
// single atomic SQL statement rather than a transaction, since D1
// doesn't expose multi-statement interactive transactions the way a
// typical RDBMS driver does:
//   1. Receipt numbering used to be `SELECT count(*) FROM receipts`,
//      which two concurrent requests can both read before either
//      INSERT commits. Now an atomic `UPDATE counters ... RETURNING`
//      (sql/schema.sql's `counters` table) — SQLite serializes
//      individual statements, so this can't race.
//   2. The payment-status UPDATE used to be a plain read-then-write. A
//      second event for the same payment could apply its own update
//      before the first's read matured, double-triggering the
//      succeeded/failed side effects. Now `UPDATE ... WHERE status !=
//      'succeeded'`, and `meta.changes === 0` after it means another
//      event already won — a signal to stop, not an error.
//   3. Idempotency was keyed purely on "does an event_id row already
//      exist," which conflated "logged" with "fully handled." If
//      applyPaymentUpdate() threw partway through (e.g. issueReceipt
//      failing), the event row already existed, so a gateway retry of
//      the same event_id short-circuited to "already processed" and
//      never retried the failed side effects — a payment could end up
//      permanently `succeeded` with no receipt and no confirmation
//      email. Now a dedicated `handled_at` column is only set once
//      processing completes without throwing; a retry of an
//      unhandled event re-attempts it.

import { getGateway } from './router.js';
import { db, newId, nowIso } from '../db.js';
import { notify } from '../notifications/events.js';
import { formatMinorUnits } from '../currency.js';
import { markPlanCompletedIfFullyPaid } from './instalments.js';

export async function handleWebhook(gatewayName, request, env) {
  const rawBody = await request.text();
  const gateway = getGateway(gatewayName);

  const verified = await gateway.verifyWebhookSignature(request, rawBody, env);
  if (!verified) {
    // Log the attempt either way — an unverified webhook is worth
    // seeing in the audit trail even though we don't act on it.
    await logWebhookEvent(env, gatewayName, rawBody, false);
    return new Response('Signature verification failed.', { status: 400 });
  }

  let event;
  try {
    event = gateway.parseWebhookEvent(rawBody, request);
  } catch (err) {
    console.error(`Failed to parse ${gatewayName} webhook payload:`, err);
    return new Response('Malformed webhook payload.', { status: 400 });
  }

  const logged = await logWebhookEvent(env, gatewayName, rawBody, true, event.type, event.reference);
  if (logged.alreadyHandled) {
    // A prior delivery of this exact event id was logged AND fully
    // processed — 200 immediately so the gateway stops retrying,
    // without re-running side effects.
    return new Response('OK (already processed)', { status: 200 });
  }

  try {
    if (event.reference) {
      await applyPaymentUpdate(env, event);
    }
    await markWebhookEventHandled(env, logged.id);
    return new Response('OK', { status: 200 });
  } catch (err) {
    // handled_at is deliberately left unset — a gateway retry of this
    // same event id will land back here and try again, which is safe
    // because every step below is itself idempotent.
    console.error(`Failed to process ${gatewayName} webhook event:`, err);
    return new Response('Internal error processing webhook.', { status: 500 });
  }
}

async function logWebhookEvent(env, provider, rawBody, verified, eventType, paymentId) {
  let parsed = {};
  try {
    parsed = JSON.parse(rawBody);
  } catch {
    // Malformed JSON from a verified-signature source is unusual but
    // not impossible (a gateway bug, a body-encoding mismatch) — fall
    // through with a random event id so the attempt is still logged
    // for the audit trail rather than throwing before anything is
    // recorded.
  }
  const eventId = parsed.id || parsed.event_id || parsed.data?.id || crypto.randomUUID();

  const existing = await db(env)
    .prepare('SELECT id, handled_at FROM payment_webhook_events WHERE provider = ? AND event_id = ?')
    .bind(provider, String(eventId))
    .first();
  if (existing) return { id: existing.id, alreadyHandled: Boolean(existing.handled_at) };

  const id = newId('whe');
  try {
    await db(env)
      .prepare(`INSERT INTO payment_webhook_events
        (id, provider, event_id, event_type, payload_json, signature_verified, payment_id, processed_at)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?)`)
      .bind(id, provider, String(eventId), eventType || 'unknown', rawBody, verified ? 1 : 0, paymentId || null, verified ? nowIso() : null)
      .run();
    return { id, alreadyHandled: false };
  } catch (err) {
    // Two concurrent deliveries of the same brand-new event id both
    // reached here at once — UNIQUE(provider, event_id) lets exactly
    // one INSERT win. The loser re-reads what the winner just wrote
    // instead of surfacing a constraint-violation 500.
    const winner = await db(env)
      .prepare('SELECT id, handled_at FROM payment_webhook_events WHERE provider = ? AND event_id = ?')
      .bind(provider, String(eventId))
      .first();
    if (winner) return { id: winner.id, alreadyHandled: Boolean(winner.handled_at) };
    throw err;
  }
}

async function markWebhookEventHandled(env, id) {
  await db(env).prepare('UPDATE payment_webhook_events SET handled_at = ? WHERE id = ?').bind(nowIso(), id).run();
}

async function applyPaymentUpdate(env, event) {
  const payment = await db(env).prepare('SELECT * FROM payments WHERE id = ?').bind(event.reference).first();
  if (!payment) {
    console.error(`Webhook referenced unknown payment id "${event.reference}".`);
    return;
  }

  if (payment.status !== 'succeeded') {
    const result = await db(env)
      .prepare(`UPDATE payments SET status = ?, provider_ref = ?, confirmed_at = ?
        WHERE id = ? AND status != 'succeeded'`)
      .bind(event.status, event.providerRef, event.status === 'succeeded' ? nowIso() : null, payment.id)
      .run();
    if (result.meta.changes === 0) {
      // A concurrent event for this same payment won the race between
      // our SELECT and this UPDATE and already resolved its status —
      // nothing left for us to do.
      return;
    }
  }
  // If payment.status was already 'succeeded' when we read it, we
  // deliberately still fall through below rather than returning early
  // — a prior attempt may have updated status but then failed before
  // issuing a receipt (this is exactly the class of partial failure
  // handled_at is designed to let retry). issueReceiptIfMissing() and
  // notify() are both safe to call again.

  if (event.status !== 'succeeded' && event.status !== 'failed') return;

  const user = await db(env).prepare('SELECT * FROM users WHERE id = ?').bind(payment.user_id).first();
  const level = payment.level_id ? await db(env).prepare('SELECT * FROM programme_levels WHERE id = ?').bind(payment.level_id).first() : null;
  const currency = await db(env).prepare('SELECT * FROM currencies WHERE code = ?').bind(payment.currency).first();

  if (event.status === 'succeeded') {
    await issueReceiptIfMissing(env, payment.id);
    if (payment.instalment_plan_id) {
      await markPlanCompletedIfFullyPaid(env, payment.instalment_plan_id);
    }
    await notify(env, 'payment_confirmed', {
      to: user.email,
      name: user.preferred_name || user.email,
      levelName: level?.name || 'your programme',
      amountDisplay: currency ? `${currency.symbol}${formatMinorUnits(payment.amount_cents, currency.decimal_places)}` : `${payment.amount_cents}`,
    });
    // Enrolment confirmation is deliberately a separate call
    // (functions/api/enrolment/confirm.js), not inlined here, so it
    // can also be triggered manually by staff for edge cases (a
    // corporate invoice paid outside any gateway, for instance)
    // without duplicating this webhook's logic.
  } else if (event.status === 'failed') {
    await notify(env, 'payment_failed', { to: user.email, name: user.preferred_name || user.email, levelName: level?.name || 'your programme' });
  }
}

async function issueReceiptIfMissing(env, paymentId) {
  const existing = await db(env).prepare('SELECT id FROM receipts WHERE payment_id = ?').bind(paymentId).first();
  if (existing) return; // already issued by this or a prior attempt

  const counter = await db(env)
    .prepare(`UPDATE counters SET value = value + 1 WHERE name = 'receipt_number' RETURNING value`)
    .first();
  const receiptNumber = `WEC-R-${String(counter.value).padStart(6, '0')}`;

  try {
    await db(env)
      .prepare('INSERT INTO receipts (id, payment_id, receipt_number) VALUES (?, ?, ?)')
      .bind(newId('rcpt'), paymentId, receiptNumber)
      .run();
  } catch (err) {
    // Lost a race against UNIQUE(payment_id) — a concurrent attempt's
    // receipt already exists, so there's nothing left to do. The
    // counter value drawn above is simply unused, leaving a small gap
    // in the numbering sequence, which is fine for an internal
    // reference number (not an invoice number with legal sequencing
    // requirements).
    const stillMissing = await db(env).prepare('SELECT id FROM receipts WHERE payment_id = ?').bind(paymentId).first();
    if (!stillMissing) throw err;
  }
}
