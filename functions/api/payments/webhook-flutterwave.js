// POST /api/payments/webhook-flutterwave — configure this URL in the
// Flutterwave Dashboard once FLW_WEBHOOK_SECRET_HASH is provisioned.
import { handleWebhook } from '../../_lib/payments/webhook-handler.js';
import { errorResponse } from '../../_lib/db.js';

export async function onRequestPost({ request, env }) {
  try {
    return await handleWebhook('flutterwave', request, env);
  } catch (err) {
    return errorResponse(err);
  }
}
