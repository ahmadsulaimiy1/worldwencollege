/* WHAT A CHECKOUT COSTS, AND THE ROW IT OPENS.
 *
 * ─────────────────────────────────────────────────────────────────────
 * WHY THIS IS A MODULE
 * ─────────────────────────────────────────────────────────────────────
 * All of this lived inside `functions/api/payments/create-checkout.js`,
 * which meant the only way to exercise the price a learner is actually
 * charged was to speak HTTP to a live gateway. The browser harness
 * therefore restated the arithmetic — and immediately got it wrong: it
 * charged the published fee to a learner holding a scholarship, while
 * the offer card beside it quoted the discounted one. A test that
 * cannot run production's pricing will eventually assert against a
 * second, worse copy of it.
 *
 * So the pricing and the row are here, the gateway call stays in the
 * route, and the harness stubs only the thing that genuinely cannot run
 * — the bank.
 *
 * ─────────────────────────────────────────────────────────────────────
 * THE RULES IT CARRIES, UNCHANGED
 * ─────────────────────────────────────────────────────────────────────
 * Exactly one of levelId / fullProgramme / instalmentPlanId. A promo
 * code and a scholarship may both be supplied only where
 * platform_config.discount_stacking_policy allows it, and neither may
 * be combined with an instalmentPlanId — dividing relief across
 * instalments is undecided, and docs/executive-decision-brief.md
 * records it as undecided rather than guessing.
 *
 * Every refusal is a field-level 422 rather than an unclassified 500:
 * an unknown gateway name, a bad promo code and an inactive currency
 * are all routine client faults, and each of them would otherwise
 * surface as a raw constraint violation or an unclassified throw.
 */

import { db, newId, ValidationError, NotFoundError } from '../db.js';
import { convertFromUsdCents, getCurrency, suggestRouting } from '../currency.js';
import { suggestGateway, GATEWAYS } from './router.js';
import { getConfigJson } from '../config.js';
import {
  getDiscountStackingPolicy, resolveScholarship, computeDiscountedAmount, assertStackingAllowed,
} from './discounts.js';
import { resolveInstalmentPlan, nextInstalmentAmountUsdCents } from './instalments.js';

/**
 * Everything the payment row and the gateway call both need, decided
 * once. Reads the database; writes nothing.
 */
export async function priceCheckout(env, { user, body = {} } = {}) {
  const modes = [Boolean(body.levelId), Boolean(body.fullProgramme), Boolean(body.instalmentPlanId)];
  if (modes.filter(Boolean).length !== 1) {
    throw new ValidationError('Provide exactly one of levelId, fullProgramme, or instalmentPlanId.', {});
  }
  if (body.instalmentPlanId && (body.promoCode || body.scholarshipId)) {
    throw new ValidationError('A promo code or scholarship cannot be combined with instalmentPlanId.', {});
  }
  // Validated against the known adapter map before it is used anywhere:
  // an unknown name is a typo or a stale interface, and it should come
  // back as a clean 422 rather than as getGateway() throwing an
  // unclassified Error that errorResponse() turns into a 500.
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
    const plan = await resolveInstalmentPlan(env, {
      userId: user.id, instalmentPlanId: body.instalmentPlanId,
    });
    level = plan.level_id
      ? await db(env).prepare('SELECT * FROM programme_levels WHERE id = ?').bind(plan.level_id).first()
      : null;
    kind = 'instalment';
    instalmentPlanId = plan.id;
    baseUsdCents = await nextInstalmentAmountUsdCents(env, plan);
  } else {
    level = body.levelId
      ? await db(env).prepare('SELECT * FROM programme_levels WHERE id = ?').bind(body.levelId).first()
      : null;
    if (body.levelId && !level) throw new NotFoundError('Unknown programme level.');
    kind = body.fullProgramme ? 'full_programme' : 'single_level';

    // The column is REFERENCES promo_codes(code) under
    // PRAGMA foreign_keys=ON, so an unvalidated bad code would fail the
    // INSERT as a raw constraint violation instead of a field-level 422.
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

  // Currency: an explicit request wins; otherwise the suggestion for the
  // country, which stays a suggestion — see
  // docs/payments-architecture.md § UX; otherwise dollars.
  const currencyCode = body.currency || (await suggestRouting(env, body.country)).currency;
  const currency = await getCurrency(env, currencyCode);
  if (!currency || !currency.is_active || currency.fx_rate_to_usd == null) {
    throw new ValidationError(`${currencyCode} isn't available for checkout yet.`, { currency: 'Not active' });
  }

  const amountUsdCents = computeDiscountedAmount({ baseUsdCents, promo, scholarship });
  const amountMinor = await convertFromUsdCents(env, amountUsdCents, currencyCode);

  // Gateway: an explicit request wins; otherwise the routed suggestion.
  const routing = await suggestGateway(env, body.country);
  const gatewayName = body.gateway || routing.suggested;

  return {
    kind,
    level,
    instalmentPlanId,
    promo,
    scholarship,
    baseUsdCents,
    amountUsdCents,
    amountMinor,
    currency,
    currencyCode,
    gatewayName,
    description: body.fullProgramme
      ? 'WEC-LC — Full Programme (all six levels)'
      : instalmentPlanId
        ? `WEC-LC — Instalment${level ? ` (${level.name})` : ' (Full Programme)'}`
        : `WEC-LC — ${level.name}`,
  };
}

/** The pending row, written before anybody is sent to a bank. */
export async function openPayment(env, { user, quote }) {
  const paymentId = newId('pay');
  await db(env)
    .prepare(`INSERT INTO payments
      (id, user_id, kind, level_id, instalment_plan_id, amount_cents, currency, amount_usd_cents, promo_code, scholarship_id, provider, status)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'pending')`)
    .bind(
      paymentId, user.id, quote.kind, quote.level ? quote.level.id : null, quote.instalmentPlanId,
      quote.amountMinor, quote.currencyCode, quote.amountUsdCents,
      quote.promo ? quote.promo.code : null, quote.scholarship ? quote.scholarship.id : null,
      quote.gatewayName,
    )
    .run();
  return paymentId;
}

/**
 * The gateway refused, or errored. Without this the pending row above
 * is orphaned — never failed, never retried, invisible until the
 * reconciliation report's sixty-minute staleness window finds it. The
 * learner sees an honest error now instead of a checkout that silently
 * goes nowhere.
 */
export async function markPaymentFailed(env, paymentId, message) {
  await db(env)
    .prepare('UPDATE payments SET status = ?, failure_reason = ? WHERE id = ?')
    .bind('failed', String(message ?? '').slice(0, 500), paymentId)
    .run();
}

/** The gateway took it, and gave us its own reference for it. */
export async function markPaymentProcessing(env, paymentId, providerRef) {
  await db(env)
    .prepare('UPDATE payments SET provider_ref = ?, status = ? WHERE id = ?')
    .bind(providerRef, 'processing', paymentId)
    .run();
}

/**
 * Where the gateway sends a learner back to.
 *
 * `language` is the ONLY thing a caller may say about the return
 * address, and it is narrowed to two values here. A caller-supplied URL
 * would be an open redirect on a page people arrive at from their bank,
 * which is the last place on the site to have one.
 */
export function returnAddresses(origin, { language, paymentId }) {
  const prefix = language === 'ar' ? '/ar' : '';
  return {
    successUrl: `${origin}${prefix}/student-portal/payment-complete/?payment=${paymentId}`,
    // Back to the statement of account, which is where every checkout on
    // this site now begins — not to the public fee schedule, which is
    // where it went when nothing called this route at all.
    cancelUrl: `${origin}${prefix}/my-account.html`,
  };
}
