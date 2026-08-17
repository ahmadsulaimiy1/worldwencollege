// Payment reconciliation reporting — pure query logic, no HTTP/auth
// concerns (see functions/_lib/reports/revenue.js for why this is
// split out). Surfaces exactly what the schema can actually prove
// today — see docs/payments-architecture.md § Payment reconciliation.
// Deliberately does NOT attempt to compare against a gateway's own
// dashboard (Stripe/Paystack/Flutterwave/Opay) — no such integration
// exists, and faking that comparison would be worse than not having it.

import { db } from '../db.js';

const STALE_AFTER_MINUTES = 60;

export async function buildReconciliationReport(env) {
  const [webhookVolume, unverified, orphaned, stalePayments, missingReceipts] = await Promise.all([
    db(env).prepare(`SELECT provider, event_type, signature_verified, count(*) as count
      FROM payment_webhook_events GROUP BY provider, event_type, signature_verified
      ORDER BY provider, event_type`).all(),

    db(env).prepare(`SELECT id, provider, event_type, received_at
      FROM payment_webhook_events WHERE signature_verified = 0
      ORDER BY received_at DESC LIMIT 50`).all(),

    // Verified webhooks that named a payment id we don't have —
    // possible only if the payment record was deleted after the fact,
    // or the gateway sent a reference for a payment WEC-LC never
    // created. Either is worth a human look.
    db(env).prepare(`SELECT w.id, w.provider, w.event_type, w.payment_id, w.received_at
      FROM payment_webhook_events w
      LEFT JOIN payments p ON p.id = w.payment_id
      WHERE w.signature_verified = 1 AND w.payment_id IS NOT NULL AND p.id IS NULL
      ORDER BY w.received_at DESC LIMIT 50`).all(),

    // Payments left pending/processing well past when a gateway
    // round-trip should have resolved them — the checkout was started
    // but never confirmed or failed. Doesn't prove the gateway lost
    // the webhook (the student may simply have abandoned checkout),
    // but it's the actionable "go look at this" list either way.
    db(env).prepare(`SELECT id, user_id, provider, amount_usd_cents, status, created_at
      FROM payments
      WHERE status IN ('pending', 'processing')
      AND created_at <= datetime('now', ?)
      ORDER BY created_at ASC LIMIT 50`).bind(`-${STALE_AFTER_MINUTES} minutes`).all(),

    // Every succeeded payment should have exactly one receipt
    // (webhook-handler.js's issueReceipt() runs unconditionally on
    // success) — any gap here means that step silently failed.
    db(env).prepare(`SELECT p.id, p.user_id, p.amount_usd_cents, p.confirmed_at
      FROM payments p
      LEFT JOIN receipts r ON r.payment_id = p.id
      WHERE p.status = 'succeeded' AND r.id IS NULL
      ORDER BY p.confirmed_at DESC LIMIT 50`).all(),
  ]);

  return {
    generatedAt: new Date().toISOString(),
    staleAfterMinutes: STALE_AFTER_MINUTES,
    webhookVolume: webhookVolume.results,
    unverifiedWebhooks: unverified.results,
    orphanedWebhooks: orphaned.results,
    stalePayments: stalePayments.results,
    succeededPaymentsMissingReceipts: missingReceipts.results,
  };
}
