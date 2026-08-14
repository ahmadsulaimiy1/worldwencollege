// POST /api/admin/currency/set-rate
// Body: { code, rateToUsd, activate? }
// Staff/admin only. Sets a policy-fixed exchange rate for an existing
// currency — WEC-LC choosing not to float that currency's tuition
// price with daily FX, a legitimate and common institutional choice
// (see docs/payments-architecture.md § Multi-currency). `activate`
// (default false) additionally flips is_active — kept as an explicit,
// separate flag so a staff member can stage a rate before offering the
// currency at checkout.

import { jsonResponse, errorResponse, ValidationError, readJsonBody } from '../../../_lib/db.js';
// Administrator, not staff. This endpoint changes what learners are
// charged. Governance decision A5, adopted 14 August 2026.
import { requireAdmin } from '../../../_lib/auth/session.js';
import { setPolicyFixedRate } from '../../../_lib/currency/fx-service.js';

export async function onRequestPost({ request, env }) {
  try {
    const staff = await requireAdmin(request, env);
    const body = await readJsonBody(request);
    if (!body?.code) throw new ValidationError('code is required.', { code: 'Required' });
    if (typeof body?.rateToUsd !== 'number') throw new ValidationError('rateToUsd is required and must be a number.', { rateToUsd: 'Required' });

    const result = await setPolicyFixedRate(env, {
      code: String(body.code).toUpperCase(),
      rateToUsd: body.rateToUsd,
      updatedBy: staff.id,
      activate: body.activate === true,
    });
    return jsonResponse(result);
  } catch (err) {
    return errorResponse(err);
  }
}
