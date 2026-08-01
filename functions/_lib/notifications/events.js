// The event catalog every part of the platform sends through — an
// endpoint calls notify(env, 'payment_confirmed', {...}) and never
// touches the email provider or writes its own copy. Keeps every
// transactional email's wording in one reviewable place, and every
// send logged to notification_log for support/audit regardless of
// whether it succeeded.

import { resendAdapter } from './resend-adapter.js';
import { db, newId } from '../db.js';

const provider = resendAdapter;

const TEMPLATES = {
  application_received: (data) => ({
    subject: 'We\'ve received your WEC-LC application',
    html: `<p>Hi ${data.name},</p><p>Thank you for applying to the International English Fluency Course. Our Admissions team will confirm your placement level and next steps shortly.</p>`,
  }),
  payment_confirmed: (data) => ({
    subject: 'Payment received — WEC-LC',
    html: `<p>Hi ${data.name},</p><p>We've received your payment of ${data.amountDisplay} for ${data.levelName}. A receipt is attached to your account.</p>`,
  }),
  payment_failed: (data) => ({
    subject: 'Payment unsuccessful — WEC-LC',
    html: `<p>Hi ${data.name},</p><p>Your payment for ${data.levelName} wasn't successful. No charge was made — you can try again from your dashboard.</p>`,
  }),
  enrolment_confirmed: (data) => ({
    subject: 'You\'re enrolled — welcome to WEC-LC',
    html: `<p>Hi ${data.name},</p><p>You're enrolled in ${data.levelName}. Your Student Portal access details follow separately.</p>`,
  }),
  // Staff-facing, not applicant-facing — see notifyStaff() below. Sent
  // to env.NOTIFICATION_EMAIL, a deploy-time config value rather than
  // anything hardcoded, so the recipient can move from a working inbox
  // during early operations to an official mailbox later with no code
  // change.
  new_application_alert: (data) => ({
    subject: `New WEC-LC application — ${data.name}`,
    html: `<p>A new admissions application was submitted.</p>
      <ul>
        <li>Name: ${data.name}</li>
        <li>Email: ${data.email}</li>
        <li>Country: ${data.country || 'not provided'}</li>
        <li>Application ID: ${data.applicationId}</li>
      </ul>`,
  }),
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
    const { providerRef } = await provider.send({ to, subject, html }, env);
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
