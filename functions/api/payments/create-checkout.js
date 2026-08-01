// POST /api/payments/create-checkout
// Body: { levelId, currency?, gateway?, promoCode? } for a single-level
// payment, or { fullProgramme: true, currency?, gateway?, promoCode? }
// for a full-programme payment (Executive Decision #1 — progressive
// unlocking: this creates one payment for all six levels, but
// enrolment still unlocks level-by-level as each is completed, via
// functions/_lib/student/progression.js).
// Requires auth — a payment always belongs to a real user account
// (created at Step 4 of admissions, via Clerk), never an anonymous
// applicant. Full contract in docs/api-reference.md.

import { db, newId, jsonResponse, errorResponse, ValidationError, NotFoundError, readJsonBody } from '../../_lib/db.js';
import { requireUser } from '../../_lib/auth/session.js';
import { convertFromUsdCents, getCurrency, suggestRouting } from '../../_lib/currency.js';
import { createCheckout, suggestGateway, GATEWAYS } from '../../_lib/payments/router.js';
import { getConfigJson } from '../../_lib/config.js';

export async function onRequestPost({ request, env }) {
  try {
    const user = await requireUser(request, env);
    const body = await readJsonBody(request);
    if (!body?.levelId && !body?.fullProgramme) {
      throw new ValidationError('Either levelId or fullProgramme is required.', { levelId: 'Required unless fullProgramme is true' });
    }
    if (body?.levelId && body?.fullProgramme) {
      throw new ValidationError('Provide either levelId or fullProgramme, not both.', {});
    }

    const level = body.levelId
      ? await db(env).prepare('SELECT * FROM programme_levels WHERE id = ?').bind(body.levelId).first()
      : null;
    if (body.levelId && !level) throw new NotFoundError('Unknown programme level.');

    // Gateway name is validated against the known adapter map before
    // it's used anywhere — an unknown name is a routine client bug
    // (typo, stale UI), not a server fault, and should come back as a
    // clean 422 rather than router.js's getGateway() throwing an
    // unclassified Error that errorResponse() turns into a generic 500.
    if (body.gateway && !GATEWAYS[body.gateway]) {
      throw new ValidationError(`Unknown payment gateway "${body.gateway}".`, { gateway: 'Unknown gateway' });
    }

    // Promo code, if supplied, must exist and be active — the column
    // is a REFERENCES promo_codes(code) FK under PRAGMA foreign_keys=ON,
    // so an unvalidated bad code would otherwise fail the INSERT below
    // as a raw constraint violation (another unclassified 500) instead
    // of a clean, field-level 422.
    if (body.promoCode) {
      const promo = await db(env).prepare('SELECT code, active FROM promo_codes WHERE code = ?').bind(body.promoCode).first();
      if (!promo || !promo.active) {
        throw new ValidationError('That promo code is not valid.', { promoCode: 'Invalid or inactive' });
      }
    }

    // Currency: explicit request wins; otherwise fall back to the
    // suggestion for the user's country (still just a suggestion —
    // see docs/payments-architecture.md § UX); otherwise USD.
    const currencyCode = body.currency || (await suggestRouting(env, body.country)).currency;
    const currency = await getCurrency(env, currencyCode);
    if (!currency || !currency.is_active || currency.fx_rate_to_usd == null) {
      throw new ValidationError(`${currencyCode} isn't available for checkout yet.`, { currency: 'Not active' });
    }

    // promo/scholarship discounting: see TODO below
    const amountUsdCents = body.fullProgramme
      ? await getConfigJson(env, 'full_programme_price_usd_cents')
      : level.price_usd_cents;
    const amountMinor = await convertFromUsdCents(env, amountUsdCents, currencyCode);

    // Gateway: explicit request wins; otherwise the routed suggestion
    // for the user's country/currency.
    const routing = await suggestGateway(env, body.country);
    const gatewayName = body.gateway || routing.suggested;

    const paymentId = newId('pay');
    const kind = body.fullProgramme ? 'full_programme' : 'single_level';
    await db(env)
      .prepare(`INSERT INTO payments
        (id, user_id, kind, level_id, amount_cents, currency, amount_usd_cents, promo_code, provider, status)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, 'pending')`)
      .bind(paymentId, user.id, kind, level ? level.id : null, amountMinor, currencyCode, amountUsdCents, body.promoCode || null, gatewayName)
      .run();

    const description = body.fullProgramme ? 'WEC-LC — Full Programme (all six levels)' : `WEC-LC — ${level.name}`;
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

// TODO (schema-ready, not implemented): apply promo_codes / scholarships
// discounts to amountUsdCents before conversion. Deferred because
// discount *policy* (stacking rules, eligibility) is an institutional
// decision, not a technical one — see docs/payments-architecture.md.
