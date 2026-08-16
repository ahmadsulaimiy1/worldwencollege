// Resend adapter — a reasonable default email provider (simple REST
// API, no npm SDK required). Not a stated preference from any
// decision made so far; swap freely for Postmark/SES/SendGrid by
// writing an adapter with the same shape and changing the one import
// in events.js. Requires RESEND_API_KEY and RESEND_FROM_ADDRESS (e.g.
// "admissions@worldwencollege.co.uk" — must be a domain verified in
// Resend first; see docs/notifications-provisioning.md).
//
// WHY THIS FILE IS MORE THAN ONE fetch().
// ---------------------------------------------------------------------
// events.js deliberately swallows send failures so a notification can
// never fail the caller's real transaction — a payment webhook must
// still record the payment even if the receipt email does not go out.
// That is correct, and it means the ONLY signal anyone gets when
// admissions email stops working is the string this file logs and the
// row it leaves in notification_log. So the error has to be worth
// reading, and a failure that a retry would have fixed should not
// reach that log at all.

import { GatewayNotConfiguredError } from '../payments/provider-interface.js';

const ENDPOINT = 'https://api.resend.com/emails';
// Resend's documented default is 2 requests/second, so a burst — two
// applications landing together, or a payment webhook retried by
// Stripe — gets 429ed. One bounded retry turns that into a delivered
// receipt rather than a logged failure.
const RETRY_STATUS = new Set([408, 429, 500, 502, 503, 504]);
const MAX_ATTEMPTS = 3;
const TIMEOUT_MS = 10_000;
const BACKOFF_MS = [400, 1200];

// Resend answers with JSON on success and on its own errors, but the
// things in front of it do not: a 502 from an edge proxy is an HTML
// page, a 429 can be text, and some gateways send an empty body. The
// original code called resp.json() unconditionally, so any of those
// threw "Unexpected token '<'" and the HTTP status — the one fact an
// operator actually needs — never reached the log.
async function readBody(resp) {
  const raw = await resp.text().catch(() => '');
  if (!raw) return {};
  try { return JSON.parse(raw); } catch { return { raw }; }
}

// Prefer Resend's own message, fall back to whatever the proxy said,
// and ALWAYS carry the status code.
function describe(resp, body) {
  const detail = body.message
    || (typeof body.raw === 'string' ? body.raw.slice(0, 140).replace(/\s+/g, ' ').trim() : '');
  return `Resend send failed: HTTP ${resp.status}${detail ? ` — ${detail}` : ''}`;
}

// A plain-text alternative, derived rather than authored. An HTML-only
// message scores worse with spam filters, and these are transactional
// emails an applicant must actually receive. Derived from the same
// html the templates already produce, so the two can never drift.
function toPlainText(html) {
  return String(html)
    .replace(/<style[\s\S]*?<\/style>/gi, '')
    .replace(/<head[\s\S]*?<\/head>/gi, '')
    .replace(/<br\s*\/?>/gi, '\n')
    .replace(/<\/(p|div|h[1-6]|li|tr)>/gi, '\n')
    .replace(/<li[^>]*>/gi, '  · ')
    .replace(/<[^>]+>/g, '')
    .replace(/&nbsp;/g, ' ').replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<').replace(/&gt;/g, '>')
    .replace(/&#39;/g, "'").replace(/&quot;/g, '"')
    .replace(/\n{3,}/g, '\n\n')
    .split('\n').map((l) => l.trim()).join('\n')
    .trim();
}

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

export const resendAdapter = {
  async send({ to, subject, html }, env) {
    if (!env.RESEND_API_KEY) throw new GatewayNotConfiguredError('Resend', 'RESEND_API_KEY');

    const payload = {
      from: env.RESEND_FROM_ADDRESS,
      to,
      subject,
      html,
      text: toPlainText(html),
    };
    // Replies to a transactional email are a real applicant trying to
    // reach a human. Routed to the published inbox when one is set,
    // rather than to whatever the from-address happens to be.
    if (env.RESEND_REPLY_TO) payload.reply_to = env.RESEND_REPLY_TO;

    let lastError;
    for (let attempt = 0; attempt < MAX_ATTEMPTS; attempt++) {
      // Workers give a request a bounded lifetime and the caller here
      // is often a payment webhook the gateway is waiting on. An email
      // send that hangs must give up rather than hold that open.
      const abort = new AbortController();
      const timer = setTimeout(() => abort.abort(), TIMEOUT_MS);
      try {
        const resp = await fetch(ENDPOINT, {
          method: 'POST',
          headers: {
            authorization: `Bearer ${env.RESEND_API_KEY}`,
            'content-type': 'application/json',
            // Resend treats this as an idempotency key, so a retry of
            // a request that DID land server-side does not send the
            // applicant a second copy of their own receipt.
            'idempotency-key': `${subject}:${Array.isArray(to) ? to.join(',') : to}`.slice(0, 256),
          },
          body: JSON.stringify(payload),
          signal: abort.signal,
        });

        const body = await readBody(resp);
        if (resp.ok) return { providerRef: body.id };

        lastError = new Error(describe(resp, body));
        if (!RETRY_STATUS.has(resp.status)) throw lastError;
      } catch (err) {
        // An abort or a network fault is worth one more attempt; a
        // non-retryable status thrown just above is not.
        if (err === lastError) throw err;
        lastError = err.name === 'AbortError'
          ? new Error(`Resend send failed: no response within ${TIMEOUT_MS}ms`)
          : err;
      } finally {
        clearTimeout(timer);
      }

      if (attempt < MAX_ATTEMPTS - 1) await sleep(BACKOFF_MS[attempt]);
    }
    throw lastError;
  },
};
