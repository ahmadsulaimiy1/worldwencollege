// POST /api/auth/webhook-clerk — configure this URL in the Clerk
// Dashboard (Webhooks) once CLERK_WEBHOOK_SECRET is provisioned,
// subscribed to user.created and user.updated.

import { authProvider, upsertUserFromProviderEvent } from '../../_lib/auth/session.js';
import { errorResponse } from '../../_lib/db.js';

export async function onRequestPost({ request, env }) {
  try {
    const rawBody = await request.text();
    const verified = await authProvider.verifyWebhookSignature(request, rawBody, env);
    if (!verified) return new Response('Signature verification failed.', { status: 400 });

    let event;
    try {
      event = authProvider.parseWebhookEvent(rawBody);
    } catch (err) {
      return new Response('Malformed webhook payload.', { status: 400 });
    }
    if (event.type === 'user.created' || event.type === 'user.updated') {
      const primaryEmail = event.data.email_addresses?.find((e) => e.id === event.data.primary_email_address_id);
      await upsertUserFromProviderEvent(env, {
        providerId: event.data.id,
        email: primaryEmail?.email_address || event.data.email_addresses?.[0]?.email_address,
        emailVerified: primaryEmail?.verification?.status === 'verified',
      });
    }
    // Other event types (user.deleted, session.*, etc.) are received
    // and 200'd but not acted on yet — add a case above when a real
    // need for them arises rather than handling every Clerk event
    // speculatively.

    return new Response('OK', { status: 200 });
  } catch (err) {
    return errorResponse(err);
  }
}
