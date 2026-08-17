// POST /api/payments/create-checkout
// Body: { levelId, currency?, gateway?, promoCode?, scholarshipId? }
// for a single-level payment, { fullProgramme: true, currency?,
// gateway?, promoCode?, scholarshipId? } for a full-programme payment
// (Executive Decision #1 — progressive unlocking: this creates one
// payment for all six levels, but enrolment still unlocks
// level-by-level as each is completed, via
// functions/_lib/student/progression.js), or { instalmentPlanId,
// currency?, gateway? } to pay the next instalment of a plan created
// via POST /api/payments/instalment-plan (Executive Decision #5) —
// exactly one of levelId/fullProgramme/instalmentPlanId. A promo code
// and a scholarship may both be supplied only if
// platform_config.discount_stacking_policy allows it, and neither can
// be combined with instalmentPlanId (discounting a single instalment
// vs. the plan total is undecided — see
// docs/executive-decision-brief.md) — see
// functions/_lib/payments/discounts.js.
// Requires auth — a payment always belongs to a real user account
// (created at Step 4 of admissions, via Clerk), never an anonymous
// applicant. Full contract in docs/api-reference.md.

import { db, newId, jsonResponse, errorResponse, ValidationError, NotFoundError, readJsonBody } from '../../_lib/db.js';
import { requireUser } from '../../_lib/auth/session.js';
import { convertFromUsdCents, getCurrency, suggestRouting } from '../../_lib/currency.js';
import { createCheckout, suggestGateway, GATEWAYS } from '../../_lib/payments/router.js';
import { getConfigJson } from '../../_lib/config.js';
import { getDiscountStackingPolicy, resolveScholarship, computeDiscountedAmount, assertStackingAllowed } from '../../_lib/payments/discounts.js';
import { resolveInstalmentPlan, nextInstalmentAmountUsdCents } from '../../_lib/payments/instalments.js';

export async function onRequestPost({ request, env }) {
  try {
    const user = await requireUser(request, env);
    const body = await readJsonBody(request);
    const modes = [Boolean(body.levelId), Boolean(body.fullProgramme), Boolean(body.instalmentPlanId)];
    if (modes.filter(Boolean).length !== 1) {
      throw new ValidationError('Provide exactly one of levelId, fullProgramme, or instalmentPlanId.', {});
    }
    if (body.instalmentPlanId && (body.promoCode || body.scholarshipId)) {
      throw new ValidationError('A promo code or scholarship cannot be combined with instalmentPlanId.', {});
    }

    // Gateway name is validated against the known adapter map before
    // it's used anywhere — an unknown name is a routine client bug
    // (typo, stale UI), not a server fault, and should come back as a
    // clean 422 rather than router.js's getGateway() throwing an
    // unclassified Error that errorResponse() turns into a generic 500.
    if (body.gateway && !GATEWAYS[body.gateway]) {
      throw new ValidationError(`Unknown payment gateway "${body.gateway}".`, { gateway: 'Unknown gateway' });
    }

    let level = null;
    let kind;
    let baseUsdCents;
    let promo = null;
    let scholarship = null;
    let instalmentPlanId = null;

    if (body.instalmentPlanId) {
      const plan = await resolveInstalmentPlan(env, { userId: user.id, instalmentPlanId: body.instalmentPlanId });
      level = plan.level_id ? await db(env).prepare('SELECT * FROM programme_levels WHERE id = ?').bind(plan.level_id).first() : null;
      kind = 'instalment';
      instalmentPlanId = plan.id;
      baseUsdCents = await nextInstalmentAmountUsdCents(env, plan);
    } else {
      level = body.levelId
        ? await db(env).prepare('SELECT * FROM programme_levels WHERE id = ?').bind(body.levelId).first()
        : null;
      if (body.levelId && !level) throw new NotFoundError('Unknown programme level.');
      kind = body.fullProgramme ? 'full_programme' : 'single_level';

      // Promo code, if supplied, must exist and be active — the column
      // is a REFERENCES promo_codes(code) FK under PRAGMA foreign_keys=ON,
      // so an unvalidated bad code would otherwise fail the INSERT below
      // as a raw constraint violation (another unclassified 500) instead
      // of a clean, field-level 422.
      if (body.promoCode) {
        promo = await db(env).prepare('SELECT * FROM promo_codes WHERE code = ?').bind(body.promoCode).first();
        if (!promo || !promo.active) {
          throw new ValidationError('That promo code is not valid.', { promoCode: 'Invalid or inactive' });
        }
      }
      scholarship = await resolveScholarship(env, { userId: user.id, scholarshipId: body.scholarshipId });
      assertStackingAllowed({ promo, scholarship, policy: await getDiscountStackingPolicy(env) });

      baseUsdCents = body.fullProgramme
        ? await getConfigJson(env, 'full_programme_price_usd_cents')
        : level.price_usd_cents;
    }

    // Currency: explicit request wins; otherwise fall back to the
    // suggestion for the user's country (still just a suggestion —
    // see docs/payments-architecture.md § UX); otherwise USD.
    const currencyCode = body.currency || (await suggestRouting(env, body.country)).currency;
    const currency = await getCurrency(env, currencyCode);
    if (!currency || !currency.is_active || currency.fx_rate_to_usd == null) {
      throw new ValidationError(`${currencyCode} isn't available for checkout yet.`, { currency: 'Not active' });
    }

    const amountUsdCents = computeDiscountedAmount({ baseUsdCents, promo, scholarship });
    const amountMinor = await convertFromUsdCents(env, amountUsdCents, currencyCode);

    // Gateway: explicit request wins; otherwise the routed suggestion
    // for the user's country/currency.
    const routing = await suggestGateway(env, body.country);
    const gatewayName = body.gateway || routing.suggested;

    const paymentId = newId('pay');
    await db(env)
      .prepare(`INSERT INTO payments
        (id, user_id, kind, level_id, instalment_plan_id, amount_cents, currency, amount_usd_cents, promo_code, scholarship_id, provider, status)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'pending')`)
      .bind(paymentId, user.id, kind, level ? level.id : null, instalmentPlanId, amountMinor, currencyCode, amountUsdCents, promo ? promo.code : null, scholarship ? scholarship.id : null, gatewayName)
      .run();

    const description = body.fullProgramme
      ? 'WEC-LC — Full Programme (all six levels)'
      : instalmentPlanId
        ? `WEC-LC — Instalment${level ? ` (${level.name})` : ' (Full Programme)'}`
        : `WEC-LC — ${level.name}`;
    const origin = new URL(request.url).origin;
    let checkoutUrl, providerRef;
    try {
      ({ checkoutUrl, providerRef } = await createCheckout(gatewayName, {
        amountMinor,
        currency: currencyCode,
        reference: paymentId,
        customerEmail: user.email,
        successUrl: `${origin}/student-portal/payment-complete/?payment=${paymentId}`,
        cancelUrl: `${origin}/admissions/tuition/`,
        metadata: { description, levelId: level ? level.id : null, currencyDecimalPlaces: currency.decimal_places },
      }, env));
    } catch (err) {
      // Without this, a gateway failure (today: always
      // GatewayNotConfiguredError, since no real credentials exist
      // anywhere — but this path is just as real once they do, for an
      // actual declined/errored checkout-session creation) left the
      // 'pending' row inserted just above permanently orphaned —
      // never failed, never retried, invisible until the reconciliation
      // report's 60-minute staleness window catches it. Marking it
      // failed immediately means the student sees an honest error now
      // instead of a checkout that silently goes nowhere.
      await db(env)
        .prepare('UPDATE payments SET status = ?, failure_reason = ? WHERE id = ?')
        .bind('failed', String(err.message || err).slice(0, 500), paymentId)
        .run();
      throw err;
    }

    await db(env).prepare('UPDATE payments SET provider_ref = ?, status = ? WHERE id = ?').bind(providerRef, 'processing', paymentId).run();

    return jsonResponse({ paymentId, checkoutUrl, gateway: gatewayName, currency: currencyCode, amountMinor });
  } catch (err) {
    return errorResponse(err);
  }
}
