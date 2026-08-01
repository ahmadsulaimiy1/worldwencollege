// Stripe adapter — Checkout Sessions API, called via fetch (no `stripe`
// npm package) to stay dependency-free and portable.
// Requires: STRIPE_SECRET_KEY, STRIPE_WEBHOOK_SECRET. Neither is set
// anywhere real — see docs/payments-architecture.md.

import { GatewayNotConfiguredError } from './provider-interface.js';

const API_BASE = 'https://api.stripe.com/v1';

function requireKey(env) {
  if (!env.STRIPE_SECRET_KEY) throw new GatewayNotConfiguredError('Stripe', 'STRIPE_SECRET_KEY');
  return env.STRIPE_SECRET_KEY;
}

function formEncode(obj, prefix = '') {
  const parts = [];
  for (const [key, val] of Object.entries(obj)) {
    const k = prefix ? `${prefix}[${key}]` : key;
    if (val && typeof val === 'object' && !Array.isArray(val)) {
      parts.push(formEncode(val, k));
    } else if (Array.isArray(val)) {
      val.forEach((v, i) => {
        parts.push(typeof v === 'object' ? formEncode(v, `${k}[${i}]`) : `${encodeURIComponent(`${k}[${i}]`)}=${encodeURIComponent(v)}`);
      });
    } else if (val !== undefined && val !== null) {
      parts.push(`${encodeURIComponent(k)}=${encodeURIComponent(val)}`);
    }
  }
  return parts.join('&');
}

export const stripeAdapter = {
  async createCheckout({ amountMinor, currency, reference, customerEmail, successUrl, cancelUrl, metadata }, env) {
    const key = requireKey(env);
    const body = formEncode({
      mode: 'payment',
      client_reference_id: reference,
      customer_email: customerEmail,
      success_url: successUrl,
      cancel_url: cancelUrl,
      metadata,
      line_items: [{
        quantity: 1,
        price_data: {
          currency: currency.toLowerCase(),
          unit_amount: amountMinor,
          product_data: { name: metadata?.description || 'WEC-LC — IEFC tuition' },
        },
      }],
    });

    const resp = await fetch(`${API_BASE}/checkout/sessions`, {
      method: 'POST',
      headers: { authorization: `Bearer ${key}`, 'content-type': 'application/x-www-form-urlencoded' },
      body,
    });
    if (!resp.ok) throw new Error(`Stripe checkout creation failed: ${resp.status} ${await resp.text()}`);
    const session = await resp.json();
    return { checkoutUrl: session.url, providerRef: session.id };
  },

  // Signature scheme: header `t=<timestamp>,v1=<hex hmac>`, verified
  // over `${timestamp}.${rawBody}` with HMAC-SHA256.
  async verifyWebhookSignature(request, rawBody, env) {
    if (!env.STRIPE_WEBHOOK_SECRET) throw new GatewayNotConfiguredError('Stripe', 'STRIPE_WEBHOOK_SECRET');
    const sigHeader = request.headers.get('stripe-signature');
    if (!sigHeader) return false;
    const parts = Object.fromEntries(sigHeader.split(',').map((p) => p.split('=')));
    if (!parts.t || !parts.v1) return false;

    const key = await crypto.subtle.importKey(
      'raw', new TextEncoder().encode(env.STRIPE_WEBHOOK_SECRET), { name: 'HMAC', hash: 'SHA-256' }, false, ['sign']
    );
    const mac = await crypto.subtle.sign('HMAC', key, new TextEncoder().encode(`${parts.t}.${rawBody}`));
    const expectedHex = [...new Uint8Array(mac)].map((b) => b.toString(16).padStart(2, '0')).join('');
    return expectedHex === parts.v1;
  },

  parseWebhookEvent(rawBody) {
    const event = JSON.parse(rawBody);
    const session = event.data?.object || {};
    const statusMap = { 'checkout.session.completed': 'succeeded', 'checkout.session.expired': 'failed' };
    return {
      type: event.type,
      providerRef: session.id,
      reference: session.client_reference_id || null,
      status: statusMap[event.type] || 'pending',
      amountMinor: session.amount_total,
      currency: (session.currency || '').toUpperCase(),
    };
  },

  async refund({ providerRef, amountMinor, reason }, env) {
    const key = requireKey(env);
    // providerRef here is the Checkout Session id; a real integration
    // resolves it to the underlying PaymentIntent (stored at
    // confirmation time) before refunding — noted as a TODO rather
    // than guessed at, since it depends on how confirm.js stores it.
    const body = formEncode({ payment_intent: providerRef, amount: amountMinor, reason: reason || undefined });
    const resp = await fetch(`${API_BASE}/refunds`, {
      method: 'POST',
      headers: { authorization: `Bearer ${key}`, 'content-type': 'application/x-www-form-urlencoded' },
      body,
    });
    if (!resp.ok) throw new Error(`Stripe refund failed: ${resp.status} ${await resp.text()}`);
    const refund = await resp.json();
    return { providerRefundRef: refund.id, status: refund.status };
  },
};
