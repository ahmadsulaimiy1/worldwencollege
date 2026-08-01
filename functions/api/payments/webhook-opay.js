// POST /api/payments/webhook-opay — endpoint path and header names are
// best-effort until verified against Opay's current docs; see the
// CONFIDENCE FLAG in functions/_lib/payments/opay-adapter.js.
import { handleWebhook } from '../../_lib/payments/webhook-handler.js';
import { errorResponse } from '../../_lib/db.js';

export async function onRequestPost({ request, env }) {
  try {
    return await handleWebhook('opay', request, env);
  } catch (err) {
    return errorResponse(err);
  }
}
