// Discount application — Executive Decision #5: promo codes and
// scholarships are config-driven, not hardcoded checkout logic. The
// *policy* (can a promo code and a scholarship stack on the same
// payment?) lives in platform_config.discount_stacking_policy, read
// here rather than assumed; the actual arithmetic is pure and directly
// testable (computeDiscountedAmount) without a database at all.
//
// All discount math happens in USD cents (amount_usd_cents is the
// platform's normalised currency-independent figure — see
// docs/payments-architecture.md § Multi-currency) — a promo/scholarship
// row's `value` for a 'fixed_amount' kind is always USD cents
// regardless of its own `currency` column, consistent with the
// schema's own comment ("5000 (=$50.00 in cents context)").

import { db, ValidationError } from '../db.js';
import { getConfigJson } from '../config.js';

export async function getDiscountStackingPolicy(env) {
  return getConfigJson(env, 'discount_stacking_policy', { required: false }) ?? { allowPromoAndScholarship: false };
}

// A scholarship can only be applied by the student it was awarded to —
// the same "you can only spend what's yours" boundary create-checkout.js
// already applies to promo codes via the payments.user_id it inserts.
export async function resolveScholarship(env, { userId, scholarshipId }) {
  if (!scholarshipId) return null;
  const scholarship = await db(env).prepare('SELECT * FROM scholarships WHERE id = ?').bind(scholarshipId).first();
  if (!scholarship || scholarship.user_id !== userId) {
    throw new ValidationError('That scholarship is not valid for your account.', { scholarshipId: 'Invalid' });
  }
  return scholarship;
}

export function computeDiscountedAmount({ baseUsdCents, promo, scholarship }) {
  if (scholarship?.kind === 'full') return 0;

  let percentOff = 0;
  let fixedOffCents = 0;
  if (promo) {
    if (promo.kind === 'percent') percentOff += promo.value;
    else fixedOffCents += Math.round(promo.value);
  }
  if (scholarship) {
    if (scholarship.kind === 'percent') percentOff += scholarship.value;
    else if (scholarship.kind === 'fixed_amount') fixedOffCents += Math.round(scholarship.value);
  }

  const afterPercent = baseUsdCents * (1 - Math.min(percentOff, 100) / 100);
  return Math.max(0, Math.round(afterPercent - fixedOffCents));
}

// Validates the stacking policy, throwing a clear 422 rather than
// silently applying only one discount when a student requested both.
export function assertStackingAllowed({ promo, scholarship, policy }) {
  if (promo && scholarship && !policy?.allowPromoAndScholarship) {
    throw new ValidationError(
      'A promo code and a scholarship cannot both be applied to the same payment.',
      { promoCode: 'Cannot combine with a scholarship', scholarshipId: 'Cannot combine with a promo code' },
    );
  }
}
