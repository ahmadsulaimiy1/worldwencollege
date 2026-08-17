// POST /api/payments/webhook-paystack — configure this URL in the
// Paystack Dashboard once PAYSTACK_SECRET_KEY is provisioned.
import { handleWebhook } from '../../_lib/payments/webhook-handler.js';
import { errorResponse } from '../../_lib/db.js';

export async function onRequestPost({ request, env }) {
  try {
    return await handleWebhook('paystack', request, env);
  } catch (err) {
    return errorResponse(err);
  }
}
