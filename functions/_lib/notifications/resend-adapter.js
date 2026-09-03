// Resend adapter — a reasonable default email provider (simple REST
// API, no npm SDK required). Not a stated preference from any
// decision made so far; swap freely for Postmark/SES/SendGrid by
// writing an adapter with the same shape and changing the one import
// in events.js. Requires RESEND_API_KEY (not set anywhere real) and
// RESEND_FROM_ADDRESS (e.g. "admissions@worldwencollege.co.uk" — must
// be a domain verified in Resend first).

import { GatewayNotConfiguredError } from '../payments/provider-interface.js';

export const resendAdapter = {
  async send({ to, subject, html }, env) {
    if (!env.RESEND_API_KEY) throw new GatewayNotConfiguredError('Resend', 'RESEND_API_KEY');
    const resp = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: { authorization: `Bearer ${env.RESEND_API_KEY}`, 'content-type': 'application/json' },
      body: JSON.stringify({ from: env.RESEND_FROM_ADDRESS, to, subject, html }),
    });
    const data = await resp.json();
    if (!resp.ok) throw new Error(`Resend send failed: ${data.message || resp.status}`);
    return { providerRef: data.id };
  },
};
