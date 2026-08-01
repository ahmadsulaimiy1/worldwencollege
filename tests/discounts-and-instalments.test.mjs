// Run with: node --experimental-sqlite tests/discounts-and-instalments.test.mjs
// Covers Executive Decision #5 (partial): config-driven discount
// stacking policy and instalment plan cadence.
import { readFileSync } from 'node:fs';
import { makeD1 } from './d1-shim.mjs';
import { ROOT, loadUrl } from './helpers.mjs';

const schema = readFileSync(`${ROOT}/sql/schema.sql`, 'utf8');
const env = { DB: makeD1(schema) };
const db = env.DB;

const { computeDiscountedAmount, assertStackingAllowed, resolveScholarship, getDiscountStackingPolicy } = await import(loadUrl('functions/_lib/payments/discounts.js'));
const { computeInstalmentAmounts, createInstalmentPlan, nextInstalmentAmountUsdCents, resolveInstalmentPlan, markPlanCompletedIfFullyPaid } = await import(loadUrl('functions/_lib/payments/instalments.js'));
const { ValidationError } = await import(loadUrl('functions/_lib/db.js'));
const { onRequestPost: instalmentPlanEndpoint } = await import(loadUrl('functions/api/payments/instalment-plan.js'));

let pass = 0, fail = 0;
function check(label, cond) { console.log((cond ? 'PASS ' : 'FAIL ') + label); cond ? pass++ : fail++; }

// --- computeDiscountedAmount: pure math ---
check('computeDiscountedAmount: no discount returns the base amount', computeDiscountedAmount({ baseUsdCents: 316667, promo: null, scholarship: null }) === 316667);
check('computeDiscountedAmount: 15% promo', computeDiscountedAmount({ baseUsdCents: 100000, promo: { kind: 'percent', value: 15 }, scholarship: null }) === 85000);
check('computeDiscountedAmount: fixed-amount promo', computeDiscountedAmount({ baseUsdCents: 100000, promo: { kind: 'fixed_amount', value: 5000 }, scholarship: null }) === 95000);
check('computeDiscountedAmount: full scholarship zeroes the amount regardless of anything else', computeDiscountedAmount({ baseUsdCents: 100000, promo: { kind: 'percent', value: 15 }, scholarship: { kind: 'full' } }) === 0);
check('computeDiscountedAmount: stacked percent promo + percent scholarship', computeDiscountedAmount({ baseUsdCents: 100000, promo: { kind: 'percent', value: 10 }, scholarship: { kind: 'percent', value: 20 } }) === 70000);
check('computeDiscountedAmount: never goes negative even if discounts exceed the total', computeDiscountedAmount({ baseUsdCents: 1000, promo: { kind: 'fixed_amount', value: 5000 }, scholarship: null }) === 0);

// --- assertStackingAllowed ---
check('assertStackingAllowed: promo alone is always fine', (() => { try { assertStackingAllowed({ promo: {}, scholarship: null, policy: { allowPromoAndScholarship: false } }); return true; } catch { return false; } })());
check('assertStackingAllowed: both, policy disallows -> throws', (() => { try { assertStackingAllowed({ promo: {}, scholarship: {}, policy: { allowPromoAndScholarship: false } }); return false; } catch (e) { return e instanceof ValidationError; } })());
check('assertStackingAllowed: both, policy allows -> no throw', (() => { try { assertStackingAllowed({ promo: {}, scholarship: {}, policy: { allowPromoAndScholarship: true } }); return true; } catch { return false; } })());

// --- Seed default policy check ---
check('seed: default discount_stacking_policy disallows stacking (conservative default)', (await getDiscountStackingPolicy(env)).allowPromoAndScholarship === false);

// --- resolveScholarship: ownership boundary ---
db.prepare(`INSERT INTO users (id, auth_provider, auth_provider_id, email, role) VALUES ('usr_a', 'clerk', 'sub_a', 'a@example.com', 'student')`).run();
db.prepare(`INSERT INTO users (id, auth_provider, auth_provider_id, email, role) VALUES ('usr_b', 'clerk', 'sub_b', 'b@example.com', 'student')`).run();
db.prepare(`INSERT INTO scholarships (id, user_id, kind, value) VALUES ('sch_a', 'usr_a', 'percent', 25)`).run();

const ownScholarship = await resolveScholarship(env, { userId: 'usr_a', scholarshipId: 'sch_a' });
check('resolveScholarship: a student can resolve their own scholarship', ownScholarship && ownScholarship.id === 'sch_a');
check('resolveScholarship: no scholarshipId -> null, not an error', (await resolveScholarship(env, { userId: 'usr_a', scholarshipId: undefined })) === null);
check('resolveScholarship: another student cannot use someone else\'s scholarship', await (async () => {
  try { await resolveScholarship(env, { userId: 'usr_b', scholarshipId: 'sch_a' }); return false; } catch (e) { return e instanceof ValidationError; }
})());

// --- computeInstalmentAmounts: exact sum, remainder spread to the front ---
{
  const amounts = computeInstalmentAmounts(316667, 4);
  check('computeInstalmentAmounts: sums back to the exact total (no cent lost/gained to rounding)', amounts.reduce((a, b) => a + b, 0) === 316667);
  check('computeInstalmentAmounts: 4 instalments returned', amounts.length === 4);
  check('computeInstalmentAmounts: remainder distributed 1 cent at a time to the first instalments, not all in the last', amounts[0] - amounts[amounts.length - 1] <= 1);
}

// --- createInstalmentPlan / nextInstalmentAmountUsdCents / resolveInstalmentPlan ---
{
  const plan = await createInstalmentPlan(env, { userId: 'usr_a', levelId: 1 });
  check('createInstalmentPlan: total matches Level I price', plan.totalAmountUsdCents === 316667);
  check('createInstalmentPlan: default instalment count is 4 (seeded platform_config)', plan.instalmentCount === 4);
  check('createInstalmentPlan: status starts active', plan.status === 'active');

  const resolved = await resolveInstalmentPlan(env, { userId: 'usr_a', instalmentPlanId: plan.id });
  check('resolveInstalmentPlan: the owning student can resolve their own plan', resolved.id === plan.id);
  check('resolveInstalmentPlan: another student cannot resolve someone else\'s plan', await (async () => {
    try { await resolveInstalmentPlan(env, { userId: 'usr_b', instalmentPlanId: plan.id }); return false; } catch (e) { return e instanceof ValidationError; }
  })());

  const planRow = db.prepare('SELECT * FROM instalment_plans WHERE id = ?').bind(plan.id).first();
  const first = await nextInstalmentAmountUsdCents(env, planRow);
  check('nextInstalmentAmountUsdCents: first instalment before any payment', first === plan.amounts[0]);

  // Simulate 3 succeeded instalment payments (not fully paid yet).
  for (let i = 0; i < 3; i++) {
    db.prepare(`INSERT INTO payments (id, user_id, kind, level_id, instalment_plan_id, amount_cents, currency, amount_usd_cents, provider, status)
      VALUES (?, 'usr_a', 'instalment', 1, ?, ?, 'USD', ?, 'stripe', 'succeeded')`).bind(`pay_inst_${i}`, plan.id, plan.amounts[i], plan.amounts[i]).run();
  }
  const fourth = await nextInstalmentAmountUsdCents(env, planRow);
  check('nextInstalmentAmountUsdCents: 4th instalment amount matches the plan breakdown', fourth === plan.amounts[3]);

  await markPlanCompletedIfFullyPaid(env, plan.id);
  check('markPlanCompletedIfFullyPaid: not yet completed after only 3 of 4 paid', db.prepare('SELECT status FROM instalment_plans WHERE id = ?').bind(plan.id).first().status === 'active');

  db.prepare(`INSERT INTO payments (id, user_id, kind, level_id, instalment_plan_id, amount_cents, currency, amount_usd_cents, provider, status)
    VALUES ('pay_inst_3', 'usr_a', 'instalment', 1, ?, ?, 'USD', ?, 'stripe', 'succeeded')`).bind(plan.id, plan.amounts[3], plan.amounts[3]).run();
  await markPlanCompletedIfFullyPaid(env, plan.id);
  check('markPlanCompletedIfFullyPaid: marks completed once all 4 instalments have succeeded', db.prepare('SELECT status FROM instalment_plans WHERE id = ?').bind(plan.id).first().status === 'completed');

  check('nextInstalmentAmountUsdCents: throws once a plan is fully paid', await (async () => {
    const fullyPaidRow = db.prepare('SELECT * FROM instalment_plans WHERE id = ?').bind(plan.id).first();
    try { await nextInstalmentAmountUsdCents(env, fullyPaidRow); return false; } catch (e) { return e instanceof ValidationError; }
  })());
}

// --- instalment-plan endpoint: validation + auth boundary ---
{
  const noAuthReq = new Request('http://x/api/payments/instalment-plan', { method: 'POST', body: JSON.stringify({ levelId: 1 }) });
  check('instalment-plan endpoint: no Authorization header -> 401', (await instalmentPlanEndpoint({ request: noAuthReq, env })).status === 401);
}

console.log(`\n${pass} passed, ${fail} failed.`);
process.exit(fail ? 1 : 0);
