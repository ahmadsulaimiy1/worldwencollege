// Run with: node --experimental-sqlite tests/payment-confirmation.test.mjs
//
// THE SCREEN A PERSON IS RETURNED TO AFTER PAYING.
//
// `create-checkout.js` gives every gateway a successUrl of
// /student-portal/payment-complete/, so this is the first thing a
// learner sees after their bank hands them back. Three things have to
// be right on it, and each of them is a different way the screen fails
// somebody who has just parted with $3,166.67.
//
//   IT SAYS ONE THING, DECIDED SERVER-SIDE. Six payment statuses, an
//   optional receipt and an optional enrolment collapse into five
//   standings. Deciding that in the browser would put the rule in two
//   editions of markup and let the Arabic page and the English page
//   disagree about whether somebody had paid.
//
//   IT OFFERS THE ENROLMENT ONLY WHERE IT WOULD BE GRANTED.
//   POST /api/enrolment/confirm refuses anything not `succeeded`, so
//   `mayConfirmEnrolment` must be false on a pending payment or the
//   page draws a button that answers 422.
//
//   IT QUOTES WHAT WAS CHARGED, AS CHARGED. A payment taken in sterling
//   is reported in sterling. Re-converting it at today's rate would
//   replace a recorded fact with an estimate on the one screen where a
//   person is checking the figure against their banking app.
import { readFileSync } from 'node:fs';
import { makeD1 } from './d1-shim.mjs';
import { ROOT, loadUrl } from './helpers.mjs';

const schema = readFileSync(`${ROOT}/sql/schema.sql`, 'utf8');
const env = { DB: makeD1(schema) };
const db = env.DB;

const { paymentStanding, confirmEnrolment } = await import(loadUrl('functions/_lib/payments/confirmation.js'));
const { NotFoundError, ValidationError } = await import(loadUrl('functions/_lib/db.js'));

let pass = 0, fail = 0;
const check = (label, cond, detail) => {
  console.log((cond ? 'PASS ' : 'FAIL ') + label + (cond || detail === undefined ? '' : ` — ${detail}`));
  cond ? pass++ : fail++;
};

const run = (sql, ...args) => db.prepare(sql).bind(...args).run();

await run(`INSERT INTO users (id, auth_provider, auth_provider_id, email, role)
           VALUES ('usr_p', 'clerk', 'sub_p', 'payer@example.com', 'student')`);
await run(`INSERT INTO users (id, auth_provider, auth_provider_id, email, role)
           VALUES ('usr_q', 'clerk', 'sub_q', 'other@example.com', 'student')`);
await run(`UPDATE currencies SET is_active = 1, fx_rate_to_usd = 0.79,
             fx_rate_source = 'test', fx_rate_as_of = '2026-08-01T00:00:00.000Z' WHERE code = 'GBP'`);

const me = { id: 'usr_p', email: 'payer@example.com', role: 'student' };
const someoneElse = { id: 'usr_q', email: 'other@example.com', role: 'student' };

const pay = async (id, cols) => {
  const row = Object.assign({
    user_id: 'usr_p', kind: 'single_level', level_id: null, amount_cents: null,
    currency: 'USD', amount_usd_cents: null, provider: 'stripe', status: 'pending',
    created_at: '2026-08-20T10:00:00.000Z', confirmed_at: null,
    instalment_plan_id: null, failure_reason: null,
  }, cols);
  if (row.amount_cents === null) row.amount_cents = row.amount_usd_cents;
  const keys = Object.keys(row);
  await db.prepare(`INSERT INTO payments (id, ${keys.join(', ')})
                    VALUES (?, ${keys.map(() => '?').join(', ')})`)
    .bind(id, ...keys.map((k) => row[k])).run();
};

// ── A charge still with the bank ────────────────────────────────────
{
  await pay('pay_wait', { level_id: 1, amount_usd_cents: 316667, status: 'processing' });
  const s = await paymentStanding(env, { user: me, paymentId: 'pay_wait' });
  check('a charge still with the gateway stands as awaiting_gateway, not as failed',
    s.standing === 'awaiting_gateway', s.standing);
  check('...and nothing is offered that would be refused: no enrolment to confirm',
    s.mayConfirmEnrolment === false && s.received === false);
  check('...and the level it would open is named while it is still in flight',
    s.opens.id === 1 && s.opens.roman === 'I');
}

// ── A charge that arrived, before any enrolment exists ──────────────
{
  await pay('pay_ok', {
    level_id: 2, amount_usd_cents: 316667, status: 'succeeded',
    confirmed_at: '2026-08-20T10:02:00.000Z',
  });
  await run(`INSERT INTO receipts (id, payment_id, receipt_number, issued_at)
             VALUES ('rcp_ok', 'pay_ok', 'WEC-R-000042', '2026-08-20T10:03:00.000Z')`);
  const s = await paymentStanding(env, { user: me, paymentId: 'pay_ok' });
  check('money that arrived with no enrolment behind it stands as received',
    s.standing === 'received', s.standing);
  check('...and the enrolment IS offered, because the confirm route would grant it',
    s.mayConfirmEnrolment === true);
  check('the receipt number reaches the page, so nobody has to go and look for it',
    s.receipt.number === 'WEC-R-000042');
  check('the figure is formatted by the same function the statement of account uses',
    s.ledgerAmount.ledger.text === '$3,166.67', s.ledgerAmount.ledger.text);

  await run(`INSERT INTO enrolments (id, user_id, level_id, status, started_at)
             VALUES ('enr_ok', 'usr_p', 2, 'active', '2026-08-20T10:04:00.000Z')`);
  const after = await paymentStanding(env, { user: me, paymentId: 'pay_ok' });
  check('once the place exists the standing becomes enrolled',
    after.standing === 'enrolled', after.standing);
  check('...and the act is not offered a second time',
    after.mayConfirmEnrolment === false);
  check('...and the enrolment itself is on the payload, with the day it started',
    after.enrolment.id === 'enr_ok' && after.enrolment.startedAt === '2026-08-20T10:04:00.000Z');
}

// ── A full-programme payment names the level it actually opens ──────
{
  await pay('pay_full', {
    kind: 'full_programme', level_id: null, amount_usd_cents: 1900000,
    status: 'succeeded', confirmed_at: '2026-08-20T11:02:00.000Z',
  });
  const s = await paymentStanding(env, { user: me, paymentId: 'pay_full' });
  check('a full-programme payment carries no level of its own', s.level === null);
  check('...but names Level I, which is the one it opens today',
    s.opens.id === 1 && s.opens.name === 'Foundation Programme');
  check('...and offers the enrolment against that level',
    s.mayConfirmEnrolment === true);
}

// ── What was charged, as charged ────────────────────────────────────
{
  await pay('pay_gbp', {
    level_id: 3, amount_usd_cents: 316667, amount_cents: 250167, currency: 'GBP',
    status: 'succeeded', confirmed_at: '2026-08-20T12:02:00.000Z',
  });
  const s = await paymentStanding(env, { user: me, paymentId: 'pay_gbp' });
  check('a charge taken in sterling is reported in sterling, in its own minor units',
    s.charged.currency === 'GBP' && s.charged.minorUnits === 250167);
  check('...with the currency\'s own symbol rather than a bare number',
    s.charged.text === '£2,501.67', s.charged.text);
  check('...and the ledger figure travels beside it, never instead of it',
    s.ledgerAmount.ledger.text === '$3,166.67');
}

// ── A charge that did not go through ────────────────────────────────
{
  await pay('pay_no', {
    level_id: 4, amount_usd_cents: 316667, status: 'failed',
    failure_reason: 'The card issuer declined the charge.',
  });
  const s = await paymentStanding(env, { user: me, paymentId: 'pay_no' });
  check('a declined charge stands as failed', s.standing === 'failed');
  check('...and says WHY, which is the difference between trying again and not',
    s.failureReason === 'The card issuer declined the charge.');
  check('...and offers no enrolment', s.mayConfirmEnrolment === false);
}

// ── A refund ────────────────────────────────────────────────────────
{
  await pay('pay_back', {
    level_id: 5, amount_usd_cents: 316667, status: 'refunded',
    confirmed_at: '2026-08-20T13:02:00.000Z',
  });
  const s = await paymentStanding(env, { user: me, paymentId: 'pay_back' });
  check('a refunded charge stands as returned rather than as paid or as failed',
    s.standing === 'returned', s.standing);
  check('...and is still counted as money that was received, because it was',
    s.received === true);
}

// ── An instalment knows which one it is ─────────────────────────────
{
  await run(`INSERT INTO instalment_plans (id, user_id, level_id, total_amount_usd_cents, instalment_count, status)
             VALUES ('ipl_c', 'usr_p', 6, 316667, 4, 'active')`);
  await pay('pay_i1', {
    kind: 'instalment', level_id: 6, amount_usd_cents: 79167, instalment_plan_id: 'ipl_c',
    status: 'succeeded', created_at: '2026-08-01T10:00:00.000Z', confirmed_at: '2026-08-01T10:02:00.000Z',
  });
  await pay('pay_i2', {
    kind: 'instalment', level_id: 6, amount_usd_cents: 79167, instalment_plan_id: 'ipl_c',
    status: 'succeeded', created_at: '2026-08-15T10:00:00.000Z', confirmed_at: '2026-08-15T10:02:00.000Z',
  });
  const s = await paymentStanding(env, { user: me, paymentId: 'pay_i2' });
  check('an instalment is numbered by its position among the ones that succeeded',
    s.instalment.number === 2 && s.instalment.of === 4,
    `${s.instalment.number} of ${s.instalment.of}`);
  check('...and says how many are still to come, which is what a payer asks next',
    s.instalment.remainingCount === 2);

  await pay('pay_i3', {
    kind: 'instalment', level_id: 6, amount_usd_cents: 79167, instalment_plan_id: 'ipl_c',
    status: 'processing', created_at: '2026-08-21T09:00:00.000Z',
  });
  const inflight = await paymentStanding(env, { user: me, paymentId: 'pay_i3' });
  check('an instalment still in flight has no number yet, and does not guess one',
    inflight.instalment.number === null && inflight.instalment.paidCount === 2);
}

// ── The boundary ────────────────────────────────────────────────────
{
  check('somebody else\'s payment is indistinguishable from one that does not exist',
    await (async () => {
      let a, b;
      try { await paymentStanding(env, { user: someoneElse, paymentId: 'pay_ok' }); } catch (e) { a = e; }
      try { await paymentStanding(env, { user: someoneElse, paymentId: 'pay_nope' }); } catch (e) { b = e; }
      return a instanceof NotFoundError && b instanceof NotFoundError && a.message === b.message;
    })());
  // Not an error: a person who lost the tab the gateway returned them
  // to is asking a good question, and answering it is what stops this
  // being a surface reachable only by holding a generated reference.
  const latest = await paymentStanding(env, { user: me });
  check('with no reference at all, the most recent payment on the account is answered',
    latest.id === 'pay_i3', latest.id);
  check('...and an account with nothing on it is told so, rather than shown a blank',
    await (async () => {
      try { await paymentStanding(env, { user: someoneElse }); return false; }
      catch (e) { return e instanceof NotFoundError && /No payment has been recorded/.test(e.message); }
    })());
}

// ── The keys the route has always answered with ─────────────────────
{
  const s = await paymentStanding(env, { user: me, paymentId: 'pay_gbp' });
  check('id, status, currency, amountCents and levelId are all still answered',
    s.id === 'pay_gbp' && s.status === 'succeeded' && s.currency === 'GBP'
    && s.amountCents === 250167 && s.levelId === 3);
}

// ── Turning a cleared payment into a place ──────────────────────────
{
  await pay('pay_enrol', {
    level_id: 4, amount_usd_cents: 316667, status: 'succeeded',
    confirmed_at: '2026-08-21T10:02:00.000Z', created_at: '2026-08-21T10:00:00.000Z',
  });
  const first = await confirmEnrolment(env, { user: me, paymentId: 'pay_enrol' });
  check('a cleared payment creates the enrolment it was struck for',
    first.created === true && first.enrolment.levelId === 4 && first.enrolment.status === 'active');

  const again = await confirmEnrolment(env, { user: me, paymentId: 'pay_enrol' });
  check('...and asking twice returns the same place rather than making a second',
    again.created === false && again.enrolment.id === first.enrolment.id);
  check('...in the same shape, so a page reloading mid-flow does not meet two payloads',
    JSON.stringify(Object.keys(again.enrolment)) === JSON.stringify(Object.keys(first.enrolment)));

  const rows = await db.prepare('SELECT COUNT(*) AS n FROM enrolments WHERE user_id = ? AND level_id = 4')
    .bind('usr_p').first();
  check('...and the ledger holds exactly one', rows.n === 1, String(rows.n));

  check('a payment still with the gateway is refused, and the refusal names the status',
    await (async () => {
      try { await confirmEnrolment(env, { user: me, paymentId: 'pay_wait' }); return false; }
      catch (e) { return e instanceof ValidationError && e.fields.status === 'processing'; }
    })());
  check('a learner cannot enrol themselves on somebody else\'s payment',
    await (async () => {
      try { await confirmEnrolment(env, { user: someoneElse, paymentId: 'pay_enrol' }); return false; }
      catch (e) { return e instanceof ValidationError; }
    })());

  // The standing follows the act, which is what the page redraws on.
  const after = await paymentStanding(env, { user: me, paymentId: 'pay_enrol' });
  check('once confirmed, the payment stands as enrolled and offers the act no more',
    after.standing === 'enrolled' && after.mayConfirmEnrolment === false);
}

console.log(`\n${pass} passed, ${fail} failed.`);
process.exit(fail ? 1 : 0);
