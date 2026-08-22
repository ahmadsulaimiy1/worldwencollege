// Brevo adapter — the College's email provider.
//
// WHY BREVO RATHER THAN RESEND, recorded because the reasoning is not
// about taste and will be re-litigated otherwise.
//
// Resend's free tier permits exactly ONE verified sending domain per
// account, and this account's slot is held by a live domain belonging
// to another school — one that sends sign-in codes and password resets
// people depend on, so it cannot be reclaimed. Without a verified
// domain, Resend will send only to the account holder's own address.
// That covers the staff alert and leaves every applicant without a
// confirmation, which is the half that matters to the applicant.
//
// Brevo's free tier is 300 emails a day AND allows authenticating your
// own domain, so admissions@worldwencollege.co.uk can send to anyone.
// That is the whole difference, and it is the difference between an
// applicant hearing from the College and hearing nothing.
//
// THE CONSTRAINT THAT DECIDES THE SHAPE OF THIS FILE: Cloudflare
// Workers cannot open a raw TCP connection, so SMTP is unavailable at
// any price. The provider must offer an HTTP API. Brevo does; several
// otherwise-good "free SMTP" services do not, and would have been
// impossible here regardless of their pricing.
//
// CONFIGURATION
//   BREVO_API_KEY        from Brevo -> SMTP & API -> API Keys
//   BREVO_FROM_ADDRESS   e.g. admissions@worldwencollege.co.uk
//   BREVO_FROM_NAME      optional; defaults to the College's name
//
// The from-address must be either a verified sender or an address on a
// domain authenticated in Brevo. Sending from an unauthenticated
// address is not merely discouraged — receiving servers will fail it on
// SPF/DKIM alignment and file it as spam, which looks identical to the
// College never having replied.

import { GatewayNotConfiguredError } from '../payments/provider-interface.js';

const ENDPOINT = 'https://api.brevo.com/v3/smtp/email';
const DEFAULT_FROM_NAME = 'Worldwide English College';

export const brevoAdapter = {
  async send({ to, subject, html }, env) {
    if (!env.BREVO_API_KEY) throw new GatewayNotConfiguredError('Brevo', 'BREVO_API_KEY');
    if (!env.BREVO_FROM_ADDRESS) throw new GatewayNotConfiguredError('Brevo', 'BREVO_FROM_ADDRESS');

    const resp = await fetch(ENDPOINT, {
      method: 'POST',
      headers: {
        // Brevo authenticates with `api-key`, NOT a bearer token. A
        // bearer header returns 401 with a message about the key being
        // missing, which reads like a wrong key rather than a wrong
        // header and costs an hour to find.
        'api-key': env.BREVO_API_KEY,
        'content-type': 'application/json',
        accept: 'application/json',
      },
      body: JSON.stringify({
        sender: { email: env.BREVO_FROM_ADDRESS, name: env.BREVO_FROM_NAME || DEFAULT_FROM_NAME },
        // Brevo takes an ARRAY of {email} objects where Resend takes a
        // string. Passing a bare string is accepted by the API and
        // delivers nothing, which is the worst kind of difference
        // between two providers, so the normalisation is explicit.
        to: (Array.isArray(to) ? to : [to]).map((address) => ({ email: address })),
        subject,
        htmlContent: html,
      }),
    });

    // A 4xx from Brevo carries a JSON body; a 5xx sometimes does not,
    // and calling .json() on an empty body throws a parse error that
    // then masks the real status.
    let data = {};
    try { data = await resp.json(); } catch { /* empty or non-JSON body */ }

    if (!resp.ok) {
      const detail = data.message || data.code || `HTTP ${resp.status}`;
      throw new Error(`Brevo send failed: ${detail}`);
    }
    // Brevo returns `messageId`; the rest of the notification layer
    // stores whatever `providerRef` holds, so the two names are mapped
    // here rather than leaking a provider's vocabulary upward.
    return { providerRef: data.messageId };
  },
};
