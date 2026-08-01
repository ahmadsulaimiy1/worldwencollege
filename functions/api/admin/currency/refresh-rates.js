// POST /api/admin/currency/refresh-rates
// Body: { codes: string[] }
// Staff/admin only. Fetches current rates for the given currency codes
// from the configured live feed (Frankfurter/ECB today — see
// functions/_lib/currency/frankfurter-adapter.js) and updates
// `currencies.fx_rate_to_usd` for whichever codes the feed actually
// covers. Does not activate a currency — see set-rate.js's `activate`
// flag for that, a separate deliberate step.
//
// Frankfurter's ECB-sourced rates do not cover NGN, SAR, AED, QAR, or
// KWD (see frankfurter-adapter.js's header comment) — requesting those
// codes here will return them in `notReturnedByProvider`, not a
// fabricated rate. Those five need either a different live-feed
// adapter (a future addition behind the same
// FxProviderInterface) or a staff-set policy-fixed rate via
// set-rate.js.

import { jsonResponse, errorResponse, ValidationError, readJsonBody } from '../../../_lib/db.js';
import { requireStaff } from '../../../_lib/auth/session.js';
import { refreshFromLiveFeed } from '../../../_lib/currency/fx-service.js';

export async function onRequestPost({ request, env }) {
  try {
    const staff = await requireStaff(request, env);
    const body = await readJsonBody(request);
    if (!Array.isArray(body?.codes) || body.codes.length === 0) {
      throw new ValidationError('codes must be a non-empty array of currency codes.', { codes: 'Required' });
    }

    const result = await refreshFromLiveFeed(env, {
      codes: body.codes.map((c) => String(c).toUpperCase()),
      updatedBy: staff.id,
    });
    return jsonResponse(result);
  } catch (err) {
    return errorResponse(err);
  }
}
