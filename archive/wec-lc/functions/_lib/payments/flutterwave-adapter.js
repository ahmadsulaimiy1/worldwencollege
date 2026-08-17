// Flutterwave adapter — Standard Payments API (Africa + international).
// Requires: FLW_SECRET_KEY, FLW_WEBHOOK_SECRET_HASH (Flutterwave uses
// a static secret hash you set in the dashboard and compare directly
// against the `verif-hash` header — not an HMAC over the body). Neither
// is set anywhere real.

import { GatewayNotConfiguredError } from './provider-interface.js';
import { timingSafeEqual } from '../db.js';

const API_BASE = 'https://api.flutterwave.com/v3';

function requireKey(env) {
  if (!env.FLW_SECRET_KEY) throw new GatewayNotConfiguredError('Flutterwave', 'FLW_SECRET_KEY');
  return env.FLW_SECRET_KEY;
}

export const flutterwaveAdapter = {
  async createCheckout({ amountMinor, currency, reference, customerEmail, successUrl, metadata }, env) {
    const key = requireKey(env);
    // Flutterwave's `amount` field is a decimal major-unit value
    // (e.g. 19000.00), unlike Stripe/Paystack's minor-unit convention
    // — converted here so the rest of the codebase never has to know.
    const decimals = metadata?.currencyDecimalPlaces ?? 2;
    const amountMajor = (amountMinor / 10 ** decimals).toFixed(decimals);

    const resp = await fetch(`${API_BASE}/payments`, {
      method: 'POST',
      headers: { authorization: `Bearer ${key}`, 'content-type': 'application/json' },
      body: JSON.stringify({
        tx_ref: reference,
        amount: amountMajor,
        currency,
        redirect_url: successUrl,
        customer: { email: customerEmail },
        meta: metadata,
      }),
    });
    const data = await resp.json();
    if (!resp.ok || data.status !== 'success') throw new Error(`Flutterwave checkout creation failed: ${data.message || resp.status}`);
    return { checkoutUrl: data.data.link, providerRef: reference };
  },

  async verifyWebhookSignature(request, _rawBody, env) {
    if (!env.FLW_WEBHOOK_SECRET_HASH) throw new GatewayNotConfiguredError('Flutterwave', 'FLW_WEBHOOK_SECRET_HASH');
    const header = request.headers.get('verif-hash');
    return timingSafeEqual(header, env.FLW_WEBHOOK_SECRET_HASH);
  },

  parseWebhookEvent(rawBody) {
    const event = JSON.parse(rawBody);
    const tx = event.data || {};
    return {
      type: event.event,
      providerRef: String(tx.id),
      reference: tx.tx_ref || null,
      status: tx.status === 'successful' ? 'succeeded' : (tx.status === 'failed' ? 'failed' : 'pending'),
      amountMinor: Math.round((tx.amount || 0) * 10 ** 2), // see amountMajor note above; assumes 2dp, revisit for KWD (3dp)
      currency: tx.currency,
    };
  },

  async refund({ providerRef, amountMinor, metadata }, env) {
    const key = requireKey(env);
    const decimals = metadata?.currencyDecimalPlaces ?? 2;
    const resp = await fetch(`${API_BASE}/transactions/${providerRef}/refund`, {
      method: 'POST',
      headers: { authorization: `Bearer ${key}`, 'content-type': 'application/json' },
      body: JSON.stringify({ amount: (amountMinor / 10 ** decimals).toFixed(decimals) }),
    });
    const data = await resp.json();
    if (!resp.ok || data.status !== 'success') throw new Error(`Flutterwave refund failed: ${data.message || resp.status}`);
    return { providerRefundRef: String(data.data.id), status: data.data.status };
  },
};
