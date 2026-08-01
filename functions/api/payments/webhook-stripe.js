// POST /api/payments/webhook-stripe — configure this URL in the
// Stripe Dashboard once STRIPE_WEBHOOK_SECRET is provisioned.
import { handleWebhook } from '../../_lib/payments/webhook-handler.js';
import { errorResponse } from '../../_lib/db.js';

export async function onRequestPost({ request, env }) {
  try {
    return await handleWebhook('stripe', request, env);
  } catch (err) {
    return errorResponse(err);
  }
}
