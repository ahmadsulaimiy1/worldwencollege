// Run with: node --experimental-sqlite tests/student-finance.test.mjs
//
// THE LEARNER-FACING FINANCE LAYER, AND THE FOUR WAYS A STATEMENT OF
// ACCOUNT GOES WRONG WITHOUT ANYBODY NOTICING.
//
//  1. THE BALANCE THAT DOES NOT RECONCILE. Every figure in the payload
//     is a summary of other figures in the same payload, and a summary
//     is exactly the kind of thing that stays plausible while being
//     wrong. So the identity is asserted arithmetically for every
//     learner in the fixture, including the one who owes nothing and the
//     one who has nothing — not once against a hand-computed total, but
//     against the components the payload itself published.
//
//  2. THE FLOAT. Money here is integer minor units, and a float that
//     gets in survives every eyeball review: 237500.00000000003 renders
//     as $2375.00. So every number in both payloads is walked and
//     asserted integral, with the only two legitimate non-integers — an
//     FX rate and a percentage — named explicitly rather than tolerated
//     by a loose test.
//
//  3. THE ABANDONED CHECKOUT THAT BECAME A DEBT. A learner who opened a
//     checkout page and closed it leaves a `pending` payment row behind
//     for ever. Reading that as a commitment would invoice them for a
//     level they never bought, and the failure is silent because the
//     number looks like a real tuition figure. Asserted directly.
//
//  4. THE INVOICE THAT ANSWERS TO THE WRONG PERSON. This is the one
//     learner route that takes an id, so it is the one that can be
//     asked for somebody else's invoice. Driven at the route with real
//     signed tokens, in both directions, and the refusal is asserted to
//     be 404 rather than 403 — a 403 would confirm the reference is
//     real and turn the route into an enumeration oracle.
import { readFileSync } from 'node:fs';
import { makeD1 } from './d1-shim.mjs';
import { ROOT, loadUrl } from './helpers.mjs';

let pass = 0, fail = 0;
const check = (label, cond, detail) => {
  console.log((cond ? 'PASS ' : 'FAIL ') + label + (cond || detail === undefined ? '' : ` — ${detail}`));
  cond ? pass++ : fail++;
};

const schema = readFileSync(`${ROOT}/sql/schema.sql`, 'utf8');
const env = { DB: makeD1(schema), CLERK_JWKS_URL: 'https://stub.clerk.accounts.dev/.well-known/jwks.json' };
const db = env.DB;

const {
  buildStudentFinance, buildStudentInvoice, assertInvoiceReference,
  presentAmount, formatAmount, convertUsdCents,
} = await import(loadUrl('functions/_lib/student/finance.js'));
const { convertFromUsdCents } = await import(loadUrl('functions/_lib/currency.js'));
const { computeInstalmentAmounts } = await import(loadUrl('functions/_lib/payments/instalments.js'));
const { computeDiscountedAmount } = await import(loadUrl('functions/_lib/payments/discounts.js'));
const financeRoute = await import(loadUrl('functions/api/student/finance.js'));
const invoiceRoute = await import(loadUrl('functions/api/student/invoice.js'));

const LEVEL_PRICE = 316667;      // programme_levels.price_usd_cents, seeded
const FULL_PRICE = 1900000;      // platform_config.full_programme_price_usd_cents, seeded

// ---------------------------------------------------------------------
// 1 · THE FIXTURE — four learners, each a different shape of account
// ---------------------------------------------------------------------
const insert = (sql) => db.prepare(sql).run();

for (const [id, sub, role] of [
  ['usr_a', 'sub_a', 'student'], ['usr_b', 'sub_b', 'student'],
  ['usr_c', 'sub_c', 'student'], ['usr_d', 'sub_d', 'student'],
  ['usr_reg', 'sub_reg', 'staff'],
]) {
  insert(`INSERT INTO users (id, auth_provider, auth_provider_id, email, role, preferred_name)
    VALUES ('${id}', 'clerk', '${sub}', '${sub}@example.com', '${role}', 'Learner ${id}')`);
}

// A · a level completed under a scholarship and partly refunded, a
// second level running on an instalment plan, an abandoned checkout and
// a failed charge.
insert(`INSERT INTO enrolments (id, user_id, level_id, status, started_at, completed_at)
  VALUES ('enr_a1','usr_a',1,'completed','2026-01-02T00:00:00.000Z','2026-05-01T00:00:00.000Z')`);
insert(`INSERT INTO enrolments (id, user_id, level_id, status, started_at)
  VALUES ('enr_a2','usr_a',2,'active','2026-05-02T00:00:00.000Z')`);
insert(`INSERT INTO scholarships (id, user_id, kind, value, approved_by, notes, created_at)
  VALUES ('sch_a','usr_a','percent',25,'usr_reg','Awarded on the placement assessment.','2025-12-20T00:00:00.000Z')`);

const A1_AMOUNT = computeDiscountedAmount({ baseUsdCents: LEVEL_PRICE, promo: null, scholarship: { kind: 'percent', value: 25 } });
insert(`INSERT INTO payments (id, user_id, kind, level_id, amount_cents, currency, amount_usd_cents, scholarship_id, provider, status, created_at, confirmed_at)
  VALUES ('pay_a1','usr_a','single_level',1,${A1_AMOUNT},'USD',${A1_AMOUNT},'sch_a','stripe','partially_refunded','2026-01-01T00:00:00.000Z','2026-01-01T00:05:00.000Z')`);
insert(`INSERT INTO receipts (id, payment_id, receipt_number, issued_at) VALUES ('rcpt_a1','pay_a1','WEC-R-000001','2026-01-01T00:05:00.000Z')`);
insert(`INSERT INTO refunds (id, payment_id, amount_cents, reason, approved_by, status, created_at)
  VALUES ('ref_a1','pay_a1',10000,'Duplicate charge on the placement fee returned.','usr_reg','processed','2026-01-20T00:00:00.000Z')`);

const A_SCHEDULE = computeInstalmentAmounts(LEVEL_PRICE, 4);
insert(`INSERT INTO instalment_plans (id, user_id, level_id, total_amount_usd_cents, instalment_count, status)
  VALUES ('ipl_a2','usr_a',2,${LEVEL_PRICE},4,'active')`);
insert(`INSERT INTO payments (id, user_id, kind, level_id, instalment_plan_id, amount_cents, currency, amount_usd_cents, provider, status, created_at, confirmed_at)
  VALUES ('pay_a2','usr_a','instalment',2,'ipl_a2',${A_SCHEDULE[0]},'USD',${A_SCHEDULE[0]},'paystack','succeeded','2026-05-02T00:00:00.000Z','2026-05-02T00:04:00.000Z')`);
insert(`INSERT INTO receipts (id, payment_id, receipt_number, issued_at) VALUES ('rcpt_a2','pay_a2','WEC-R-000002','2026-05-02T00:04:00.000Z')`);

// The abandoned checkout (Level V) and the charge the gateway declined
// (Level VI). Neither is a commitment; both are ledger lines.
insert(`INSERT INTO payments (id, user_id, kind, level_id, amount_cents, currency, amount_usd_cents, provider, status, created_at)
  VALUES ('pay_a3','usr_a','single_level',5,${LEVEL_PRICE},'USD',${LEVEL_PRICE},'stripe','pending','2026-07-01T00:00:00.000Z')`);
insert(`INSERT INTO payments (id, user_id, kind, level_id, amount_cents, currency, amount_usd_cents, provider, status, failure_reason, created_at)
  VALUES ('pay_a4','usr_a','single_level',6,${LEVEL_PRICE},'USD',${LEVEL_PRICE},'stripe','failed','Card declined by issuer.','2026-07-02T00:00:00.000Z')`);

// C · the full programme, bought outright under a promotional code,
// with progressive unlocking having created a Level I enrolment.
insert(`INSERT INTO promo_codes (code, kind, value, max_redemptions, redeemed_count, active) VALUES ('AUTUMN10','percent',10,100,1,1)`);
const C1_AMOUNT = computeDiscountedAmount({ baseUsdCents: FULL_PRICE, promo: { kind: 'percent', value: 10 }, scholarship: null });
insert(`INSERT INTO enrolments (id, user_id, level_id, status, started_at) VALUES ('enr_c1','usr_c',1,'active','2026-02-01T00:00:00.000Z')`);
insert(`INSERT INTO payments (id, user_id, kind, amount_cents, currency, amount_usd_cents, promo_code, provider, status, created_at, confirmed_at)
  VALUES ('pay_c1','usr_c','full_programme',${C1_AMOUNT},'USD',${C1_AMOUNT},'AUTUMN10','stripe','succeeded','2026-02-01T00:00:00.000Z','2026-02-01T00:03:00.000Z')`);

// D · a learner who pays in their own currency. The rate is set the way
// functions/_lib/currency/fx-service.js sets one: with a source and a
// date, on a currency somebody deliberately activated.
insert(`UPDATE currencies SET is_active = 1, fx_rate_to_usd = 1580.5, fx_rate_source = 'live_feed', fx_rate_as_of = '2026-08-19T09:00:00.000Z' WHERE code = 'NGN'`);
const D1_MINOR = await convertFromUsdCents(env, LEVEL_PRICE, 'NGN');
insert(`INSERT INTO enrolments (id, user_id, level_id, status, started_at) VALUES ('enr_d1','usr_d',1,'active','2026-06-01T00:00:00.000Z')`);
insert(`INSERT INTO payments (id, user_id, kind, level_id, amount_cents, currency, amount_usd_cents, provider, status, created_at, confirmed_at)
  VALUES ('pay_d1','usr_d','single_level',1,${D1_MINOR},'NGN',${LEVEL_PRICE},'paystack','succeeded','2026-06-01T00:00:00.000Z','2026-06-01T00:02:00.000Z')`);

// ---------------------------------------------------------------------
// 2 · PURE PRESENTATION — the arithmetic that never touches a database
// ---------------------------------------------------------------------
const USD = { code: 'USD', symbol: '$', decimalPlaces: 2 };

check('presentAmount refuses a fractional cent rather than rendering it',
  (() => { try { presentAmount(12.5, { ledger: USD, learner: null }); return false; } catch { return true; } })());
check('presentAmount refuses a float that would round to a clean figure',
  (() => { try { presentAmount(237500.0000001, { ledger: USD, learner: null }); return false; } catch { return true; } })());
check('presentAmount carries the ledger figure unchanged',
  presentAmount(316667, { ledger: USD, learner: null }).ledger.minorUnits === 316667);
check('presentAmount publishes no learner figure when the platform knows no currency',
  presentAmount(316667, { ledger: USD, learner: null }).learner === null);
check('formatAmount puts the sign before the symbol, so a credit reads as one',
  formatAmount(-5000, USD) === '-$50.00' && formatAmount(5000, USD) === '$50.00');
check('formatAmount groups a five-figure balance, which is the difference between reading it and counting it',
  formatAmount(LEVEL_PRICE, USD) === '$3,166.67' && formatAmount(FULL_PRICE, USD) === '$19,000.00',
  formatAmount(FULL_PRICE, USD));
check('formatAmount still expands the decimal places the shared formatter says a currency has',
  formatAmount(1000, { symbol: 'د.ك', decimalPlaces: 3 }) === 'د.ك1.000');
check('convertUsdCents agrees exactly with currency.js convertFromUsdCents on the same rate',
  convertUsdCents(LEVEL_PRICE, 1580.5, 2) === D1_MINOR, `${convertUsdCents(LEVEL_PRICE, 1580.5, 2)} vs ${D1_MINOR}`);
check('a converted figure is still an integer of minor units',
  Number.isInteger(convertUsdCents(LEVEL_PRICE, 1580.5, 2)));

// THE DECIMAL PLACES ARE PART OF THE CONVERSION, NOT A DETAIL OF THE
// FORMATTING. `fx_rate_to_usd` holds units of the target per US dollar,
// so multiplying USD *cents* by it yields hundredths of a unit — the
// target's minor units only when the target has two decimal places.
// Every currency the College has ever charged in has two, which is why
// nothing caught this; `currencies` seeds KWD with three and JPY-shaped
// zero-place currencies exist. Ten dollars is 3.075 dinar at this rate,
// which is 3075 fils and not 307.
check('a three-decimal currency converts into ITS minor unit, not into hundredths',
  convertUsdCents(1000, 0.3075, 3) === 3075, convertUsdCents(1000, 0.3075, 3));
check('...and a zero-decimal currency likewise', convertUsdCents(1000, 150, 0) === 1500,
  convertUsdCents(1000, 150, 0));
check('a conversion with no decimal places stated is refused rather than assumed',
  (() => { try { convertUsdCents(1000, 1.5); return false; } catch { return true; } })());

// ---------------------------------------------------------------------
// 3 · THE STATEMENT — learner A
// ---------------------------------------------------------------------
const finA = await buildStudentFinance(env, 'usr_a');

check('A: the two levels committed to are assessed, and nothing else is',
  finA.tuition.components.length === 2 && finA.tuition.components.every((c) => [1, 2].includes(c.levelId)),
  finA.tuition.components.map((c) => c.levelId).join(','));
check('A: the abandoned Level V checkout is NOT an assessment',
  !finA.tuition.components.some((c) => c.levelId === 5));
check('A: the declined Level VI charge is NOT an assessment',
  !finA.tuition.components.some((c) => c.levelId === 6));
check('A: both refused charges are still on the ledger, stated as what they are',
  finA.payments.find((p) => p.id === 'pay_a3').received === false
  && finA.payments.find((p) => p.id === 'pay_a4').failureReason === 'Card declined by issuer.');
check('A: each component names the source of its figure',
  finA.tuition.components.every((c) => typeof c.basis === 'string' && c.basis.length > 0));
check('A: the level bought outright is priced from programme_levels',
  finA.tuition.components.find((c) => c.levelId === 1).basis === 'programme_levels.price_usd_cents');
check('A: the level on a plan is priced from the plan the College contracted',
  finA.tuition.components.find((c) => c.levelId === 2).basis === 'instalment_plans.total_amount_usd_cents');
check('A: a component says on what evidence it is assessed',
  finA.tuition.components.find((c) => c.levelId === 2).evidence.some((e) => e.source === 'instalment_plans'));
check('A: tuition assessed is the sum of its own components',
  finA.tuition.gross.usdCents === finA.tuition.components.reduce((s, c) => s + c.grossUsdCents, 0)
  && finA.tuition.gross.usdCents === LEVEL_PRICE * 2);

check('A: relief is measured off the ledger, not asserted from the award',
  finA.relief.total.usdCents === LEVEL_PRICE - A1_AMOUNT, finA.relief.total.usdCents);
check('A: the scholarship is listed with the payment it was applied to',
  finA.relief.scholarships.length === 1 && finA.relief.scholarships[0].applied === true
  && finA.relief.scholarships[0].appliedToPaymentIds.join(',') === 'pay_a1');
check('A: a percentage award is published as a percentage, never as a sum of money',
  finA.relief.scholarships[0].percent === 25 && finA.relief.scholarships[0].amountUsdCents === null);
check('A: the authority for the award is named as a role and a record, never as a person',
  finA.relief.scholarships[0].authority.recorded === true
  && finA.relief.scholarships[0].authority.approvedByRole === 'staff'
  && !JSON.stringify(finA.relief.scholarships[0].authority).includes('usr_reg'));

check('A: money received counts both the settled and the partly refunded charge',
  finA.balance.paid.usdCents === A1_AMOUNT + A_SCHEDULE[0], finA.balance.paid.usdCents);
check('A: only a processed refund moves the balance',
  finA.balance.refunded.usdCents === 10000);
check('A: the outstanding balance is what the components make it',
  finA.balance.outstanding.usdCents === (LEVEL_PRICE * 2) - (LEVEL_PRICE - A1_AMOUNT) - (A1_AMOUNT + A_SCHEDULE[0]) + 10000,
  finA.balance.outstanding.usdCents);
check('A: the balance is stated as outstanding', finA.balance.state === 'outstanding');
check('A: the payload publishes the arithmetic that produced the balance',
  finA.reconciliation.identity === 'outstanding = assessed - relief - paid + refunded' && finA.reconciliation.balances === true);

check('A: every receipt issued is listed against its payment',
  finA.receipts.length === 2 && finA.receipts.map((r) => r.number).sort().join(',') === 'WEC-R-000001,WEC-R-000002');
check('A: the refund is listed with its reason and whether the money moved',
  finA.refunds.length === 1 && finA.refunds[0].moved === true && /Duplicate charge/.test(finA.refunds[0].reason));

check('A: the instalment schedule is the same array checkout charges from',
  JSON.stringify(finA.instalments[0].schedule.map((s) => s.amount.usdCents)) === JSON.stringify(A_SCHEDULE));
check('A: the schedule sums back to the plan total exactly',
  finA.instalments[0].schedule.reduce((s, i) => s + i.amount.usdCents, 0) === finA.instalments[0].total.usdCents);
check('A: the paid instalment is marked paid and carries the payment that paid it',
  finA.instalments[0].schedule[0].state === 'paid' && finA.instalments[0].schedule[0].paymentId === 'pay_a2');
check('A: the next instalment is named with its amount',
  finA.nextInstalment && finA.nextInstalment.number === 2 && finA.nextInstalment.amount.usdCents === A_SCHEDULE[1]);
check('A: no due date is published, because no cadence has been adopted',
  finA.nextInstalment.dueOn === null && finA.instalments[0].schedule.every((s) => s.dueOn === null));
check('A: the plan states how much of it is left',
  finA.instalments[0].remaining.usdCents === LEVEL_PRICE - A_SCHEDULE[0] && finA.instalments[0].remainingCount === 3);

check('A: charges are reported in the currency they were taken in',
  finA.payments.find((p) => p.id === 'pay_a1').charged.currency === 'USD');
check('A: an account transacting only in the ledger currency says so, rather than converting to itself',
  finA.presentation.learnerCurrencyState === 'same_as_ledger' && finA.presentation.learnerCurrency === null);

// ---------------------------------------------------------------------
// 4 · THE STATEMENT — learner B, who has nothing at all
// ---------------------------------------------------------------------
const finB = await buildStudentFinance(env, 'usr_b');
check('B: a learner with no enrolment and no payment gets a well-formed answer, not an error',
  finB.tuition.scope === 'none' && Array.isArray(finB.tuition.components) && finB.tuition.components.length === 0);
check('B: every collection is present and empty',
  [finB.payments, finB.receipts, finB.refunds, finB.instalments, finB.relief.scholarships, finB.relief.promoCodes]
    .every((a) => Array.isArray(a) && a.length === 0));
check('B: every figure is zero, and zero is a figure, not a null',
  [finB.balance.assessed, finB.balance.relief, finB.balance.paid, finB.balance.refunded, finB.balance.outstanding]
    .every((m) => m.usdCents === 0 && typeof m.ledger.text === 'string'));
check('B: nothing assessed is said as nothing assessed, not as settled',
  finB.balance.state === 'nothing_assessed');
check('B: no instalment is named as next', finB.nextInstalment === null);
check('B: the currency is published as unknown rather than assumed',
  finB.presentation.learnerCurrencyState === 'unknown' && finB.presentation.learnerCurrency === null);
check('B: the empty statement still reconciles', finB.reconciliation.balances === true);
check('B: sees nothing of any other learner',
  !JSON.stringify(finB).includes('usr_a') && !JSON.stringify(finB).includes('pay_a')
  && !JSON.stringify(finB).includes('sch_a'));

// ---------------------------------------------------------------------
// 5 · THE STATEMENT — learner C, the full programme
// ---------------------------------------------------------------------
const finC = await buildStudentFinance(env, 'usr_c');
check('C: the full programme is assessed once, at the published programme price',
  finC.tuition.scope === 'full_programme' && finC.tuition.components.length === 1
  && finC.tuition.gross.usdCents === FULL_PRICE);
check('C: the Level I enrolment progressive unlocking created is access, not a second charge',
  !finC.tuition.components.some((c) => c.levelId === 1));
check('C: the promotional relief is attributed to the code that gave it',
  finC.relief.promoCodes.length === 1 && finC.relief.promoCodes[0].code === 'AUTUMN10'
  && finC.relief.promoCodes[0].remitted.usdCents === FULL_PRICE - C1_AMOUNT);
check('C: a percentage code is published as a percentage',
  finC.relief.promoCodes[0].percent === 10 && finC.relief.promoCodes[0].amountUsdCents === null);
check('C: an account paid in full is stated as settled, at exactly zero',
  finC.balance.outstanding.usdCents === 0 && finC.balance.state === 'settled');
check('C: the statement reconciles', finC.reconciliation.balances === true
  && finC.reconciliation.outstandingUsdCents === FULL_PRICE - (FULL_PRICE - C1_AMOUNT) - C1_AMOUNT);

// ---------------------------------------------------------------------
// 6 · THE STATEMENT — learner D, in their own currency
// ---------------------------------------------------------------------
const finD = await buildStudentFinance(env, 'usr_d');
check('D: the learner\'s own currency is recognised from what they were actually charged',
  finD.presentation.learnerCurrencyState === 'converted' && finD.presentation.learnerCurrency.code === 'NGN');
check('D: the rate is named, with its source and its date',
  finD.presentation.learnerCurrency.rate.unitsPerUsd === 1580.5
  && finD.presentation.learnerCurrency.rate.asOf === '2026-08-19T09:00:00.000Z'
  && finD.presentation.learnerCurrency.rate.source === 'live_feed'
  && finD.presentation.learnerCurrency.rate.column === 'currencies.fx_rate_to_usd');
check('D: the ledger currency is published alongside, never replaced',
  finD.presentation.ledgerCurrency.code === 'USD'
  && finD.balance.assessed.ledger.currency === 'USD' && finD.balance.assessed.learner.currency === 'NGN');
check('D: a converted figure agrees with the platform\'s own conversion',
  finD.balance.assessed.learner.minorUnits === D1_MINOR, finD.balance.assessed.learner.minorUnits);
check('D: a converted figure carries the rate\'s date on itself, not only in the header',
  finD.balance.assessed.learner.rateAsOf === '2026-08-19T09:00:00.000Z');
check('D: what the card was charged is reported as recorded, not reconverted at today\'s rate',
  finD.payments[0].charged.currency === 'NGN' && finD.payments[0].charged.minorUnits === D1_MINOR);
check('D: the account settles to zero across the currency boundary',
  finD.balance.outstanding.usdCents === 0 && finD.reconciliation.balances === true);

// ---------------------------------------------------------------------
// 7 · MONEY IS INTEGER MINOR UNITS, EVERYWHERE, IN BOTH PAYLOADS
// ---------------------------------------------------------------------
// A rate is a rate and a percentage is a percentage; both are named
// here so that nothing else in either payload may be fractional.
const MAY_BE_FRACTIONAL = new Set(['unitsPerUsd', 'percent']);
function floatsIn(value, key = '', path = '$', found = []) {
  if (typeof value === 'number') {
    if (!Number.isInteger(value) && !MAY_BE_FRACTIONAL.has(key)) found.push(`${path} = ${value}`);
    return found;
  }
  if (Array.isArray(value)) { value.forEach((v, i) => floatsIn(v, key, `${path}[${i}]`, found)); return found; }
  if (value && typeof value === 'object') {
    for (const [k, v] of Object.entries(value)) floatsIn(v, k, `${path}.${k}`, found);
  }
  return found;
}
function moneyKeysIn(value, key = '', path = '$', found = []) {
  if (typeof value === 'number' && (/Cents$/.test(key) || key === 'minorUnits')) {
    if (!Number.isInteger(value)) found.push(`${path} = ${value}`);
    return found;
  }
  if (Array.isArray(value)) { value.forEach((v, i) => moneyKeysIn(v, key, `${path}[${i}]`, found)); return found; }
  if (value && typeof value === 'object') {
    for (const [k, v] of Object.entries(value)) moneyKeysIn(v, k, `${path}.${k}`, found);
  }
  return found;
}

const invA1 = await buildStudentInvoice(env, { userId: 'usr_a', invoiceId: 'pay_a1' });
const invA2 = await buildStudentInvoice(env, { userId: 'usr_a', invoiceId: 'pay_a2' });
const invC1 = await buildStudentInvoice(env, { userId: 'usr_c', invoiceId: 'pay_c1' });
const invD1 = await buildStudentInvoice(env, { userId: 'usr_d', invoiceId: 'pay_d1' });

for (const [label, payload] of [
  ['statement A', finA], ['statement B', finB], ['statement C', finC], ['statement D', finD],
  ['invoice pay_a1', invA1], ['invoice pay_a2', invA2], ['invoice pay_c1', invC1], ['invoice pay_d1', invD1],
]) {
  const stray = floatsIn(payload);
  check(`${label}: carries no number that is not a whole one, bar a named rate or percentage`,
    stray.length === 0, stray.join(' · '));
  const strayMoney = moneyKeysIn(payload);
  check(`${label}: every money field is integer minor units`, strayMoney.length === 0, strayMoney.join(' · '));
}
check('the money type is a number, not a string carrying one',
  typeof finA.balance.outstanding.usdCents === 'number' && typeof finA.balance.outstanding.ledger.minorUnits === 'number');

// ---------------------------------------------------------------------
// 8 · ONE INVOICE
// ---------------------------------------------------------------------
check('invoice: a discounted charge is composed, not merely totalled',
  invA1.lines.length === 2 && invA1.lines[0].kind === 'level_tuition' && invA1.lines[1].kind === 'relief');
check('invoice: the tuition line is struck at the published level price',
  invA1.lines[0].gross.usdCents === LEVEL_PRICE);
check('invoice: the relief line carries the authority it rests on',
  invA1.lines[1].relief.usdCents === LEVEL_PRICE - A1_AMOUNT
  && invA1.lines[1].authority.source === 'scholarships.approved_by'
  && invA1.lines[1].authority.approvedByRole === 'staff');
check('invoice: the composed net equals the amount actually charged',
  invA1.totals.net.usdCents === A1_AMOUNT && invA1.reconciliation.matchesChargedAmount === true);
check('invoice: the refund is shown against the invoice it reopened',
  invA1.totals.refunded.usdCents === 10000 && invA1.totals.outstanding.usdCents === 10000);
check('invoice: the receipt number issued for it is carried',
  invA1.invoice.receiptNumber === 'WEC-R-000001' && invA1.receipt.number === 'WEC-R-000001');
check('invoice: it is addressed to the caller and nobody else',
  invA1.invoice.issuedTo.userId === 'usr_a' && !JSON.stringify(invA1).includes('usr_b'));
check('invoice: no officer, office or letterhead the record does not hold is printed on it',
  !/registrar|bursar|director|principal/i.test(JSON.stringify(invA1)));

check('invoice: an instalment states which instalment of how many it is',
  invA2.lines.length === 1 && /Instalment 1 of 4/.test(invA2.lines[0].description));
check('invoice: an instalment carries no relief line, because none can reach one',
  invA2.totals.relief.usdCents === 0 && invA2.reconciliation.matchesChargedAmount === true);
check('invoice: a settled invoice is stated as settled at zero',
  invA2.totals.outstanding.usdCents === 0 && invA2.invoice.settled === true);
check('invoice: a promotional code is named on the line it discounted',
  /AUTUMN10/.test(invC1.lines[1].description) && invC1.lines[1].authority.source === 'promo_codes');
check('invoice: the full-programme line is struck at the configured programme price',
  invC1.lines[0].gross.usdCents === FULL_PRICE && invC1.lines[0].basis === 'platform_config.full_programme_price_usd_cents');
check('invoice: a charge taken in the learner\'s currency reports both',
  invD1.charged.currency === 'NGN' && invD1.totals.net.ledger.currency === 'USD'
  && invD1.totals.net.learner.currency === 'NGN');

// ---------------------------------------------------------------------
// 9 · REFUSALS — validation, then authorisation
// ---------------------------------------------------------------------
const refuses = async (fn, name, field) => {
  try { await fn(); return false; } catch (e) {
    return e.name === name && (!field || (e.fields && e.fields[field]));
  }
};

check('refusal: no reference at all is a 422 naming the field',
  await refuses(() => buildStudentInvoice(env, { userId: 'usr_a', invoiceId: null }), 'ValidationError', 'id'));
check('refusal: an empty reference is refused, not coerced',
  await refuses(() => buildStudentInvoice(env, { userId: 'usr_a', invoiceId: '   ' }), 'ValidationError', 'id'));
check('refusal: a reference of the wrong kind of id is refused',
  await refuses(() => buildStudentInvoice(env, { userId: 'usr_a', invoiceId: 'rcpt_a1' }), 'ValidationError', 'id'));
check('refusal: a reference carrying SQL is refused before it reaches a query',
  await refuses(() => buildStudentInvoice(env, { userId: 'usr_a', invoiceId: "pay_a1'; DROP TABLE payments;--" }), 'ValidationError', 'id'));
check('refusal: a reference of absurd length is refused',
  await refuses(() => buildStudentInvoice(env, { userId: 'usr_a', invoiceId: 'pay_' + 'x'.repeat(400) }), 'ValidationError', 'id'));
check('refusal: a number is not a reference',
  await refuses(() => buildStudentInvoice(env, { userId: 'usr_a', invoiceId: 12345 }), 'ValidationError', 'id'));
check('assertInvoiceReference returns a well-formed reference unchanged',
  assertInvoiceReference('pay_a1') === 'pay_a1');

check('refusal: a well-formed reference that names nothing is absent, not an error',
  await refuses(() => buildStudentInvoice(env, { userId: 'usr_a', invoiceId: 'pay_does-not-exist' }), 'NotFoundError'));
check('refusal: another learner\'s invoice is absent, never forbidden — a 403 would confirm it exists',
  await refuses(() => buildStudentInvoice(env, { userId: 'usr_b', invoiceId: 'pay_a1' }), 'NotFoundError'));
check('refusal: the owner of that same invoice still reads it',
  (await buildStudentInvoice(env, { userId: 'usr_a', invoiceId: 'pay_a1' })).invoice.id === 'pay_a1');

// ---------------------------------------------------------------------
// 10 · THE ROUTES, WITH REAL TOKENS
// ---------------------------------------------------------------------
const b64url = (bytes) => Buffer.from(bytes).toString('base64')
  .replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
const enc = (obj) => b64url(new TextEncoder().encode(JSON.stringify(obj)));
const kp = await crypto.subtle.generateKey(
  { name: 'RSASSA-PKCS1-v1_5', modulusLength: 2048, publicExponent: new Uint8Array([1, 0, 1]), hash: 'SHA-256' },
  true, ['sign', 'verify'],
);
const jwk = { ...(await crypto.subtle.exportKey('jwk', kp.publicKey)), kid: 'kid-1', alg: 'RS256', use: 'sig' };
globalThis.fetch = async () => ({ ok: true, status: 200, json: async () => ({ keys: [jwk] }) });
async function token(sub) {
  const h = enc({ alg: 'RS256', typ: 'JWT', kid: 'kid-1' });
  const t = Math.floor(Date.now() / 1000);
  const p = enc({ sub, email: `${sub}@example.com`, email_verified: true, iat: t - 5, exp: t + 600 });
  const sig = await crypto.subtle.sign('RSASSA-PKCS1-v1_5', kp.privateKey, new TextEncoder().encode(`${h}.${p}`));
  return `${h}.${p}.${b64url(new Uint8Array(sig))}`;
}
const TOK = { a: await token('sub_a'), b: await token('sub_b') };
const get = (url, tok) => new Request(url, tok ? { headers: { Authorization: `Bearer ${tok}` } } : undefined);
const BASE = 'https://wec-lc.test/api';

check('GET /api/student/finance refuses an unauthenticated caller',
  (await financeRoute.onRequestGet({ request: get(`${BASE}/student/finance`), env })).status === 401);
check('GET /api/student/invoice refuses an unauthenticated caller, before it reads the query string',
  (await invoiceRoute.onRequestGet({ request: get(`${BASE}/student/invoice?id=pay_a1`), env })).status === 401);

const routeA = await financeRoute.onRequestGet({ request: get(`${BASE}/student/finance`, TOK.a), env });
const routeABody = await routeA.json();
check('the route returns the caller\'s own statement',
  routeA.status === 200 && routeABody.balance.outstanding.usdCents === finA.balance.outstanding.usdCents);
check('a userId in the query string is simply not a parameter this route has',
  (await (await financeRoute.onRequestGet({ request: get(`${BASE}/student/finance?userId=usr_c`, TOK.a), env })).json())
    .balance.outstanding.usdCents === finA.balance.outstanding.usdCents);
check('the statement route reads no subject from the URL — own-data-only by construction',
  !/searchParams/.test(readFileSync(loadUrl('functions/api/student/finance.js'), 'utf8')));
check('the invoice route reads an object id and never a subject id',
  !/searchParams\.get\(\s*['"](userId|user_id|studentId|learnerId)['"]\s*\)/
    .test(readFileSync(loadUrl('functions/api/student/invoice.js'), 'utf8')));

check('the invoice route serves the owner',
  (await invoiceRoute.onRequestGet({ request: get(`${BASE}/student/invoice?id=pay_a1`, TOK.a), env })).status === 200);
check('the invoice route answers another learner with 404, not 403',
  (await invoiceRoute.onRequestGet({ request: get(`${BASE}/student/invoice?id=pay_a1`, TOK.b), env })).status === 404);
{
  const missing = await invoiceRoute.onRequestGet({ request: get(`${BASE}/student/invoice`, TOK.a), env });
  const body = await missing.json();
  check('the invoice route answers a missing reference with a 422 and a field map the UI can highlight',
    missing.status === 422 && body.fields && body.fields.id === 'Required');
}
check('the invoice route answers a malformed reference with a 422, not a 404',
  (await invoiceRoute.onRequestGet({ request: get(`${BASE}/student/invoice?id=nonsense`, TOK.a), env })).status === 422);
check('a learner with nothing gets a 200 and a well-formed statement from the route too',
  (await financeRoute.onRequestGet({ request: get(`${BASE}/student/finance`, TOK.b), env })).status === 200);

console.log(`\n${pass} passed, ${fail} failed.`);
process.exit(fail ? 1 : 0);
