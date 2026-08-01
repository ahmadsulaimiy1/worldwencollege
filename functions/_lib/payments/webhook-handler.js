// Shared processing behind every functions/api/payments/webhook-*.js
// endpoint — each of those files is ~5 lines that just names its
// gateway; all the actual logic (verify → idempotency → update →
// side effects) lives here once, not duplicated four times.

import { getGateway } from './router.js';
import { db, newId, nowIso } from '../db.js';
import { notify } from '../notifications/events.js';
import { formatMinorUnits } from '../currency.js';

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

  const event = gateway.parseWebhookEvent(rawBody, request);
  const alreadyProcessed = await logWebhookEvent(env, gatewayName, rawBody, true, event.type, event.reference);
  if (alreadyProcessed) {
    // Same event id seen before (gateway retry) — 200 immediately so
    // the gateway stops retrying, without re-running side effects.
    return new Response('OK (already processed)', { status: 200 });
  }

  if (event.reference) {
    await applyPaymentUpdate(env, event);
  }

  return new Response('OK', { status: 200 });
}

async function logWebhookEvent(env, provider, rawBody, verified, eventType, paymentId) {
  const parsed = JSON.parse(rawBody);
  const eventId = parsed.id || parsed.event_id || parsed.data?.id || crypto.randomUUID();
  const existing = await db(env)
    .prepare('SELECT id FROM payment_webhook_events WHERE provider = ? AND event_id = ?')
    .bind(provider, String(eventId))
    .first();
  if (existing) return true;

  await db(env)
    .prepare(`INSERT INTO payment_webhook_events
      (id, provider, event_id, event_type, payload_json, signature_verified, payment_id, processed_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)`)
    .bind(newId('whe'), provider, String(eventId), eventType || 'unknown', rawBody, verified ? 1 : 0, paymentId || null, verified ? nowIso() : null)
    .run();
  return false;
}

async function applyPaymentUpdate(env, event) {
  const payment = await db(env).prepare('SELECT * FROM payments WHERE id = ?').bind(event.reference).first();
  if (!payment) {
    console.error(`Webhook referenced unknown payment id "${event.reference}".`);
    return;
  }
  if (payment.status === 'succeeded') return; // already handled, e.g. by a duplicate event with a different id

  await db(env)
    .prepare('UPDATE payments SET status = ?, provider_ref = ?, confirmed_at = ? WHERE id = ?')
    .bind(event.status, event.providerRef, event.status === 'succeeded' ? nowIso() : null, payment.id)
    .run();

  const user = await db(env).prepare('SELECT * FROM users WHERE id = ?').bind(payment.user_id).first();
  const level = payment.level_id ? await db(env).prepare('SELECT * FROM programme_levels WHERE id = ?').bind(payment.level_id).first() : null;
  const currency = await db(env).prepare('SELECT * FROM currencies WHERE code = ?').bind(payment.currency).first();

  if (event.status === 'succeeded') {
    await issueReceipt(env, payment.id);
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

async function issueReceipt(env, paymentId) {
  const count = await db(env).prepare('SELECT count(*) as n FROM receipts').first();
  const receiptNumber = `WEC-R-${String((count?.n || 0) + 1).padStart(6, '0')}`;
  await db(env)
    .prepare('INSERT INTO receipts (id, payment_id, receipt_number) VALUES (?, ?, ?)')
    .bind(newId('rcpt'), paymentId, receiptNumber)
    .run();
  // PDF generation is a schema-ready extension point (receipts.pdf_url)
  // — not implemented; a plain receipt record is enough to unblock
  // "did this student pay" checks today.
}
