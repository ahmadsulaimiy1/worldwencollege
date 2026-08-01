// Every payment gateway adapter implements this exact shape. Nothing
// outside this directory (and router.js) ever imports a gateway
// adapter directly or knows a gateway-specific field name — that's
// what "no gateway tightly coupled to the core application" means in
// practice: functions/api/payments/create-checkout.js calls
// router.createCheckout(...) and has no idea whether that resolved to
// Stripe or Paystack.
//
// createCheckout(params, env) => Promise<{ checkoutUrl: string, providerRef: string }>
//   params: { amountMinor, currency, reference, customerEmail,
//             successUrl, cancelUrl, metadata }
//   `reference` is OUR payment id (payments.id) — every adapter must
//   thread it through to the gateway (as client_reference_id, tx_ref,
//   metadata, whichever that gateway calls it) so the webhook handler
//   can always resolve back to our row without an extra lookup table.
//
// verifyWebhookSignature(request, rawBody, env) => Promise<boolean>
//   Must be checked before parseWebhookEvent's result is trusted for
//   anything — see each functions/api/payments/webhook-*.js.
//
// parseWebhookEvent(rawBody, request) => {
//   type: string,              // gateway's own event name, logged as-is
//   providerRef: string,       // gateway's charge/transaction id
//   reference: string | null,  // OUR payments.id, if the gateway echoed it back
//   status: 'succeeded' | 'failed' | 'pending',
//   amountMinor: number,
//   currency: string,
// }
//
// refund(params, env) => Promise<{ providerRefundRef: string, status: string }>
//   params: { providerRef, amountMinor, reason }

export class PaymentProviderInterface {
  async createCheckout(_params, _env) { throw new Error('Not implemented'); }
  async verifyWebhookSignature(_request, _rawBody, _env) { throw new Error('Not implemented'); }
  parseWebhookEvent(_rawBody, _request) { throw new Error('Not implemented'); }
  async refund(_params, _env) { throw new Error('Not implemented'); }
}

export class GatewayNotConfiguredError extends Error {
  constructor(gateway, envVar) {
    super(`${gateway} is not configured — missing ${envVar}. This is expected until real credentials are provisioned; see docs/payments-architecture.md.`);
    this.name = 'GatewayNotConfiguredError';
    this.httpStatus = 503;
  }
}
