// Opay adapter — Nigerian market checkout.
//
// CONFIDENCE FLAG, read before wiring this up: Opay's merchant API
// (endpoints, signing scheme, and field names) is less standardised
// in public documentation than Stripe/Paystack/Flutterwave, and I
// don't have high confidence the exact request/response shape below
// matches Opay's *current* API version. This file implements the
// same provider-interface.js contract as the other three gateways so
// the rest of the platform is ready for it, but treat every literal
// endpoint path and field name here as a best-effort placeholder to
// be verified — and very likely corrected — against Opay's current
// merchant integration documentation before this gateway goes live.
// That verification is real integration work, not a "finish the
// code" task I can complete without an Opay merchant account.
//
// Requires (not set anywhere real): OPAY_MERCHANT_ID, OPAY_PUBLIC_KEY,
// OPAY_SECRET_KEY.

import { GatewayNotConfiguredError } from './provider-interface.js';
import { timingSafeEqual } from '../db.js';

const API_BASE = 'https://api.opaycheckout.com/api/v1/international/cashier'; // VERIFY against current Opay docs

function requireConfig(env) {
  if (!env.OPAY_MERCHANT_ID || !env.OPAY_SECRET_KEY) {
    throw new GatewayNotConfiguredError('Opay', 'OPAY_MERCHANT_ID / OPAY_SECRET_KEY');
  }
}

async function hmacSha512Hex(secret, message) {
  const key = await crypto.subtle.importKey('raw', new TextEncoder().encode(secret), { name: 'HMAC', hash: 'SHA-512' }, false, ['sign']);
  const mac = await crypto.subtle.sign('HMAC', key, new TextEncoder().encode(message));
  return [...new Uint8Array(mac)].map((b) => b.toString(16).padStart(2, '0')).join('');
}

export const opayAdapter = {
  async createCheckout({ amountMinor, currency, reference, customerEmail, successUrl, cancelUrl }, env) {
    requireConfig(env);
    const payload = {
      country: 'NG',
      reference,
      amount: { total: amountMinor, currency },
      returnUrl: successUrl,
      callbackUrl: successUrl,
      cancelUrl,
      userInfo: { userEmail: customerEmail },
    };
    const signature = await hmacSha512Hex(env.OPAY_SECRET_KEY, JSON.stringify(payload));

    const resp = await fetch(`${API_BASE}/create`, {
      method: 'POST',
      headers: {
        authorization: `Bearer ${env.OPAY_PUBLIC_KEY}`,
        merchantid: env.OPAY_MERCHANT_ID,
        signature,
        'content-type': 'application/json',
      },
      body: JSON.stringify(payload),
    });
    const data = await resp.json();
    if (!resp.ok || data.code !== '00000') throw new Error(`Opay checkout creation failed: ${data.message || resp.status}`);
    return { checkoutUrl: data.data.cashierUrl, providerRef: data.data.orderNo || reference };
  },

  async verifyWebhookSignature(request, rawBody, env) {
    requireConfig(env);
    const header = request.headers.get('signature') || request.headers.get('x-opay-signature');
    if (!header) return false;
    const expected = await hmacSha512Hex(env.OPAY_SECRET_KEY, rawBody);
    return timingSafeEqual(header, expected);
  },

  parseWebhookEvent(rawBody) {
    const event = JSON.parse(rawBody);
    const data = event.data || event;
    return {
      type: event.type || 'payment.callback',
      providerRef: data.orderNo,
      reference: data.reference || null,
      status: data.status === 'SUCCESS' ? 'succeeded' : (data.status === 'FAIL' ? 'failed' : 'pending'),
      amountMinor: data.amount?.total,
      currency: data.amount?.currency,
    };
  },

  async refund() {
    throw new Error('Opay refund flow not yet implemented — verify Opay\'s refund endpoint against current docs before building this.');
  },
};
