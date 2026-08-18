// The event catalog every part of the platform sends through — an
// endpoint calls notify(env, 'payment_confirmed', {...}) and never
// touches the email provider or writes its own copy. Keeps every
// transactional email's wording in one reviewable place, and every
// send logged to notification_log for support/audit regardless of
// whether it succeeded.

import { resendAdapter } from './resend-adapter.js';
import { brevoAdapter } from './brevo-adapter.js';
import { db, newId } from '../db.js';

// CHOSEN BY WHICH KEY IS CONFIGURED, not by editing this line.
//
// Brevo first because it is the provider the College can actually use:
// its free tier authenticates a domain, so admissions@ can write to an
// applicant. Resend stays as a working fallback rather than being
// deleted — it is configured, tested, and one environment variable away
// if Brevo is ever unavailable.
//
// Deciding at runtime rather than at edit time means switching provider
// is a deployment setting, not a code change, and a misconfigured
// environment fails with GatewayNotConfiguredError naming the missing
// variable instead of silently sending from nowhere.
const provider = (env) => (env && env.BREVO_API_KEY ? brevoAdapter : resendAdapter);

// Every template below interpolates caller-supplied data — some of it
// (name/email/country on application_received and new_application_alert)
// traces straight back to an unauthenticated public form
// (POST /api/admissions/apply). Escaping here, once, at the point every
// template's data flows through, closes that off for every template at
// once rather than requiring each one to remember to do it.
export function escapeHtml(value) {
  return String(value ?? '').replace(/[&<>"']/g, (ch) => ({
    '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;',
  }[ch]));
}

function esc(data) {
  const out = {};
  for (const [key, value] of Object.entries(data)) out[key] = escapeHtml(value);
  return out;
}

// For a value going into an email subject line, not an HTML body — no
// entity-escaping needed there (a subject isn't rendered as HTML), but
// stray CR/LF characters must still be stripped so a crafted name can
// never be used to inject extra header-like lines into the request
// sent to the notification provider.
export function sanitizeHeaderText(value) {
  return String(value ?? '').replace(/[\r\n]+/g, ' ').trim();
}

const TEMPLATES = {
  application_received: (rawData) => {
    const data = esc(rawData);
    return {
      subject: 'We\'ve received your WEC-LC application',
      html: `<p>Hi ${data.name},</p><p>Thank you for applying to the International English Fluency Course. Our Admissions team will confirm your placement level and next steps shortly.</p>`,
    };
  },
  payment_confirmed: (rawData) => {
    const data = esc(rawData);
    return {
      subject: 'Payment received — WEC-LC',
      html: `<p>Hi ${data.name},</p><p>We've received your payment of ${data.amountDisplay} for ${data.levelName}. A receipt is attached to your account.</p>`,
    };
  },
  payment_failed: (rawData) => {
    const data = esc(rawData);
    return {
      subject: 'Payment unsuccessful — WEC-LC',
      html: `<p>Hi ${data.name},</p><p>Your payment for ${data.levelName} wasn't successful. No charge was made — you can try again from your dashboard.</p>`,
    };
  },
  enrolment_confirmed: (rawData) => {
    const data = esc(rawData);
    return {
      subject: 'You\'re enrolled — welcome to WEC-LC',
      html: `<p>Hi ${data.name},</p><p>You're enrolled in ${data.levelName}. Your Student Portal access details follow separately.</p>`,
    };
  },
  // Staff-facing, not applicant-facing — see notifyStaff() below. Sent
  // to env.NOTIFICATION_EMAIL, a deploy-time config value rather than
  // anything hardcoded, so the recipient can move from a working inbox
  // during early operations to an official mailbox later with no code
  // change.
  new_application_alert: (rawData) => {
    const data = esc(rawData);
    return {
      // Subject uses the raw (not HTML-escaped) name, stripped of
      // control characters/newlines — an HTML-escaped name would show
      // literal "&amp;"-style entities in a plain-text subject line.
      subject: `New WEC-LC application — ${sanitizeHeaderText(rawData.name)}`,
      html: `<p>A new admissions application was submitted.</p>
      <ul>
        <li>Name: ${data.name}</li>
        <li>Email: ${data.email}</li>
        <li>Country: ${data.country || 'not provided'}</li>
        <li>Application ID: ${data.applicationId}</li>
      </ul>`,
    };
  },
};

// For events WEC-LC staff need to see (a new application, say) rather
// than the applicant. Recipient is env.NOTIFICATION_EMAIL — a single
// deploy-time config value, not a hardcoded address — so the working
// inbox used during early operations can be swapped for an official
// one later purely by changing that one Pages environment variable.
// If it isn't set, the event is logged as skipped rather than thrown,
// since a missing staff notification should never fail the caller's
// real transaction (the application itself is already saved).
export async function notifyStaff(env, eventType, data) {
  if (!env.NOTIFICATION_EMAIL) {
    console.warn(`Staff notification "${eventType}" skipped — NOTIFICATION_EMAIL is not configured.`);
    return { sent: false, skipped: true };
  }
  return notify(env, eventType, { to: env.NOTIFICATION_EMAIL, ...data });
}

export async function notify(env, eventType, { userId, to, ...data }) {
  const template = TEMPLATES[eventType];
  if (!template) throw new Error(`Unknown notification event type "${eventType}".`);
  const { subject, html } = template(data);

  const logId = newId('ntf');
  try {
    const { providerRef } = await provider(env).send({ to, subject, html }, env);
    await db(env)
      .prepare('INSERT INTO notification_log (id, user_id, event_type, channel, provider, provider_ref, status) VALUES (?, ?, ?, ?, ?, ?, ?)')
      .bind(logId, userId || null, eventType, 'email', 'resend', providerRef, 'sent')
      .run();
    return { sent: true };
  } catch (err) {
    await db(env)
      .prepare('INSERT INTO notification_log (id, user_id, event_type, channel, provider, status) VALUES (?, ?, ?, ?, ?, ?)')
      .bind(logId, userId || null, eventType, 'email', 'resend', 'failed')
      .run();
    // A notification failure should never fail the caller's real
    // transaction (e.g. a webhook confirming a payment) — log and
    // swallow, don't throw.
    console.error(`Notification "${eventType}" failed to send:`, err);
    return { sent: false };
  }
}
