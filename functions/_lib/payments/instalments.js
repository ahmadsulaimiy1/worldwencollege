// Instalment plans — Executive Decision #5: cadence (how many
// instalments) is a configurable default (platform_config.
// instalment_default_count), not hardcoded. Real cadence *policy*
// (does it vary by level/currency, is there an interest/fee component)
// remains undecided — see docs/executive-decision-brief.md — so this
// deliberately stays simple: N equal instalments, no fees, one plan
// per (student, level-or-full-programme) purchase decision.

import { db, newId, nowIso, NotFoundError, ValidationError } from '../db.js';
import { getConfigJson } from '../config.js';

// Splits a total into `count` integer-cent instalments that sum back
// to the total exactly — the remainder (from integer division) is
// distributed one cent at a time to the first few instalments rather
// than dropped or added only to the last one, so no single instalment
// is skewed.
export function computeInstalmentAmounts(totalUsdCents, count) {
  const base = Math.floor(totalUsdCents / count);
  const remainder = totalUsdCents - base * count;
  return Array.from({ length: count }, (_, i) => base + (i < remainder ? 1 : 0));
}

export async function createInstalmentPlan(env, { userId, levelId, fullProgramme }) {
  const totalAmountUsdCents = fullProgramme
    ? await getConfigJson(env, 'full_programme_price_usd_cents')
    : (await db(env).prepare('SELECT price_usd_cents FROM programme_levels WHERE id = ?').bind(levelId).first())?.price_usd_cents;
  if (totalAmountUsdCents == null) throw new NotFoundError('Unknown programme level.');

  const instalmentCount = await getConfigJson(env, 'instalment_default_count', { required: false }) ?? 4;
  const id = newId('ipl');
  await db(env)
    .prepare(`INSERT INTO instalment_plans (id, user_id, level_id, total_amount_usd_cents, instalment_count, status)
      VALUES (?, ?, ?, ?, ?, 'active')`)
    .bind(id, userId, fullProgramme ? null : levelId, totalAmountUsdCents, instalmentCount)
    .run();

  return { id, userId, levelId: fullProgramme ? null : levelId, totalAmountUsdCents, instalmentCount, status: 'active', amounts: computeInstalmentAmounts(totalAmountUsdCents, instalmentCount) };
}

// The amount due for whichever instalment comes next, based on how
// many have already succeeded — not a stored "instalment number" field
// (which could drift from reality if a charge attempt fails and is
// retried under a fresh payment row).
export async function nextInstalmentAmountUsdCents(env, plan) {
  const { n: paidCount } = await db(env)
    .prepare(`SELECT COUNT(*) as n FROM payments WHERE instalment_plan_id = ? AND status = 'succeeded'`)
    .bind(plan.id)
    .first();
  if (paidCount >= plan.instalment_count) {
    throw new ValidationError('This instalment plan is already fully paid.', { instalmentPlanId: 'Fully paid' });
  }
  const amounts = computeInstalmentAmounts(plan.total_amount_usd_cents, plan.instalment_count);
  return amounts[paidCount];
}

export async function resolveInstalmentPlan(env, { userId, instalmentPlanId }) {
  const plan = await db(env).prepare('SELECT * FROM instalment_plans WHERE id = ?').bind(instalmentPlanId).first();
  if (!plan || plan.user_id !== userId) throw new ValidationError('That instalment plan is not valid for your account.', { instalmentPlanId: 'Invalid' });
  if (plan.status !== 'active') throw new ValidationError(`This instalment plan is "${plan.status}", not active.`, { instalmentPlanId: plan.status });
  return plan;
}

// Called from webhook-handler.js after a succeeded instalment payment.
// Idempotent — a retry that finds the plan already 'completed' is a
// silent no-op via the WHERE clause below, not an error.
export async function markPlanCompletedIfFullyPaid(env, planId) {
  const plan = await db(env).prepare('SELECT * FROM instalment_plans WHERE id = ?').bind(planId).first();
  if (!plan) return;
  const { n: paidCount } = await db(env)
    .prepare(`SELECT COUNT(*) as n FROM payments WHERE instalment_plan_id = ? AND status = 'succeeded'`)
    .bind(planId)
    .first();
  if (paidCount >= plan.instalment_count) {
    await db(env).prepare(`UPDATE instalment_plans SET status = 'completed' WHERE id = ? AND status != 'completed'`).bind(planId).run();
  }
}
