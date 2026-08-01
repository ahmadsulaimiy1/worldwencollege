// Paystack adapter — Transaction API (Nigeria + selected African
// markets). Requires: PAYSTACK_SECRET_KEY, PAYSTACK_WEBHOOK_SECRET
// (Paystack webhooks are verified with the same secret key, not a
// separate signing secret). Neither is set anywhere real.

import { GatewayNotConfiguredError } from './provider-interface.js';
import { timingSafeEqual } from '../db.js';

const API_BASE = 'https://api.paystack.co';

function requireKey(env) {
  if (!env.PAYSTACK_SECRET_KEY) throw new GatewayNotConfiguredError('Paystack', 'PAYSTACK_SECRET_KEY');
  return env.PAYSTACK_SECRET_KEY;
}

export const paystackAdapter = {
  // Paystack amounts are in the currency's smallest unit (kobo for
  // NGN) — same convention as amountMinor throughout this codebase,
  // so no conversion needed here.
  async createCheckout({ amountMinor, currency, reference, customerEmail, successUrl, metadata }, env) {
    const key = requireKey(env);
    const resp = await fetch(`${API_BASE}/transaction/initialize`, {
      method: 'POST',
      headers: { authorization: `Bearer ${key}`, 'content-type': 'application/json' },
      body: JSON.stringify({
        email: customerEmail,
        amount: amountMinor,
        currency,
        reference,
        callback_url: successUrl,
        metadata,
      }),
    });
    const data = await resp.json();
    if (!resp.ok || !data.status) throw new Error(`Paystack checkout creation failed: ${data.message || resp.status}`);
    return { checkoutUrl: data.data.authorization_url, providerRef: data.data.reference };
  },

  // Signature: HMAC-SHA512 of the raw body using the secret key,
  // hex-encoded, sent in the `x-paystack-signature` header.
  async verifyWebhookSignature(request, rawBody, env) {
    const key = requireKey(env);
    const sigHeader = request.headers.get('x-paystack-signature');
    if (!sigHeader) return false;
    const cryptoKey = await crypto.subtle.importKey(
      'raw', new TextEncoder().encode(key), { name: 'HMAC', hash: 'SHA-512' }, false, ['sign']
    );
    const mac = await crypto.subtle.sign('HMAC', cryptoKey, new TextEncoder().encode(rawBody));
    const expectedHex = [...new Uint8Array(mac)].map((b) => b.toString(16).padStart(2, '0')).join('');
    return timingSafeEqual(expectedHex, sigHeader);
  },

  parseWebhookEvent(rawBody) {
    const event = JSON.parse(rawBody);
    const tx = event.data || {};
    const statusMap = { 'charge.success': 'succeeded' };
    return {
      type: event.event,
      providerRef: String(tx.reference || tx.id),
      reference: tx.reference || null, // Paystack's reference is the one we supplied — same as our payments.id
      status: statusMap[event.event] || (tx.status === 'failed' ? 'failed' : 'pending'),
      amountMinor: tx.amount,
      currency: tx.currency,
    };
  },

  async refund({ providerRef, amountMinor, reason }, env) {
    const key = requireKey(env);
    const resp = await fetch(`${API_BASE}/refund`, {
      method: 'POST',
      headers: { authorization: `Bearer ${key}`, 'content-type': 'application/json' },
      body: JSON.stringify({ transaction: providerRef, amount: amountMinor, customer_note: reason }),
    });
    const data = await resp.json();
    if (!resp.ok || !data.status) throw new Error(`Paystack refund failed: ${data.message || resp.status}`);
    return { providerRefundRef: String(data.data.id), status: data.data.status };
  },
};
