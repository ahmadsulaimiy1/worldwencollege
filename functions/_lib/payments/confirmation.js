/* WHERE A PAYMENT STANDS, AND WHAT HAPPENS NEXT.
 *
 * ─────────────────────────────────────────────────────────────────────
 * THE FAULT THIS FILE CORRECTS
 * ─────────────────────────────────────────────────────────────────────
 * `create-checkout.js` sends every gateway a `successUrl` of
 * `/student-portal/payment-complete/?payment=…`. That route did not
 * exist. Every learner who paid was returned from their bank to a 404,
 * on the one screen where a person most needs to be told the money
 * arrived — and the enrolment that `POST /api/enrolment/confirm`
 * creates is triggered by that page, so nothing enrolled them either
 * unless a webhook happened to land first.
 *
 * The page now exists. This module is what it reads.
 *
 * ─────────────────────────────────────────────────────────────────────
 * ONE STANDING, DECIDED HERE, NEVER ON THE PAGE
 * ─────────────────────────────────────────────────────────────────────
 * Six payment statuses, an optional receipt, an optional enrolment and
 * an optional instalment plan combine into five things a person can
 * actually be told. Working that out in the browser would put the rule
 * in two languages' worth of markup and let the two editions disagree
 * about whether somebody had paid. So `standing` is decided once, here,
 * and each edition renders a sentence for it.
 *
 *   awaiting_gateway  the charge is with the bank and nothing is lost
 *   received          the money arrived; enrolment has not been made
 *   enrolled          the money arrived and the place exists
 *   failed            it did not go through, with the reason if held
 *   returned          refunded, in whole or in part
 *
 * `mayConfirmEnrolment` is the page's cue to POST to
 * /api/enrolment/confirm, and it is true only where that call would
 * actually succeed — the confirm route refuses anything not
 * `succeeded`, and a page that offered the button anyway would be
 * offering a button that answers 422.
 *
 * ─────────────────────────────────────────────────────────────────────
 * WHAT WAS CHARGED IS QUOTED AS CHARGED
 * ─────────────────────────────────────────────────────────────────────
 * `payments.amount_cents` in `payments.currency` is what actually
 * reached the card. It is rendered from those two columns and never
 * re-converted at today's rate: converting a recorded fact into an
 * estimate is the fault `/my-account.html` refuses on an invoice, and
 * a confirmation screen is the first place a learner would catch it.
 * The ledger figure travels beside it, as everywhere else.
 */

import { db, newId, nowIso, NotFoundError, ValidationError } from '../db.js';
import { formatAmount, presentAmount } from '../student/finance.js';
import { notify } from '../notifications/events.js';
import { levelNaming } from '../academic/level-names.js';

const LEDGER_CURRENCY = 'USD';

/** Money is received once the gateway says so, and not before. */
const RECEIVED = new Set(['succeeded', 'refunded', 'partially_refunded']);
const RETURNED = new Set(['refunded', 'partially_refunded']);

export async function paymentStanding(env, { user, paymentId = null } = {}) {
  // Bound to the account in the WHERE clause rather than checked after
  // the read: a payment belonging to somebody else must be indis-
  // tinguishable from one that does not exist, or the endpoint becomes
  // a way of confirming that a given reference is real.
  //
  // NO REFERENCE MEANS THE LATEST. A gateway returns a learner here
  // with ?payment= on the address, but a person who lost that tab, or
  // who reaches the page from their statement of account, is asking a
  // perfectly good question — what happened to the last thing I paid —
  // and answering it is what stops this being a page reachable only by
  // holding a reference somebody else generated.
  const payment = paymentId
    ? await db(env).prepare('SELECT * FROM payments WHERE id = ? AND user_id = ?')
      .bind(paymentId, user.id).first()
    : await db(env).prepare(`SELECT * FROM payments WHERE user_id = ?
                              ORDER BY created_at DESC, id DESC LIMIT 1`)
      .bind(user.id).first();
  if (!payment) {
    throw new NotFoundError(paymentId
      ? 'No payment found with that id for this account.'
      : 'No payment has been recorded on this account yet.');
  }

  const ledgerRow = await db(env).prepare('SELECT * FROM currencies WHERE code = ?').bind(LEDGER_CURRENCY).first();
  const chargedRow = await db(env).prepare('SELECT * FROM currencies WHERE code = ?').bind(payment.currency).first();
  const ledger = {
    code: LEDGER_CURRENCY,
    symbol: ledgerRow ? ledgerRow.symbol : '$',
    decimalPlaces: ledgerRow ? ledgerRow.decimal_places : 2,
  };

  const level = payment.level_id != null
    ? await db(env).prepare('SELECT id, roman, name, cefr FROM programme_levels WHERE id = ?')
      .bind(payment.level_id).first()
    : null;
  const receipt = await db(env)
    .prepare('SELECT receipt_number, issued_at FROM receipts WHERE payment_id = ?')
    .bind(payment.id).first();

  // The level a full-programme payment actually opens. Executive
  // Decision #1: the money covers six levels, the enrolment covers the
  // first, and the rest are added as each is completed. Saying "you are
  // enrolled" without saying which level would be the page implying all
  // six exist today.
  const opensLevelId = payment.level_id != null
    ? payment.level_id
    : (payment.kind === 'full_programme' ? 1 : null);
  const opensLevel = opensLevelId === payment.level_id
    ? level
    : (opensLevelId != null
      ? await db(env).prepare('SELECT id, roman, name, cefr FROM programme_levels WHERE id = ?')
        .bind(opensLevelId).first()
      : null);

  const enrolment = opensLevelId != null
    ? await db(env)
      .prepare('SELECT id, level_id, status, started_at FROM enrolments WHERE user_id = ? AND level_id = ?')
      .bind(payment.user_id, opensLevelId).first()
    : null;

  const instalment = payment.instalment_plan_id
    ? await instalmentPosition(env, payment)
    : null;

  const received = RECEIVED.has(payment.status);
  const standing = RETURNED.has(payment.status) ? 'returned'
    : payment.status === 'failed' ? 'failed'
      : !received ? 'awaiting_gateway'
        : enrolment ? 'enrolled' : 'received';

  return {
    // The four keys `GET /api/payments/verify` has always answered with,
    // unchanged. js/portal-auth.js and anything else polling this must
    // not have to be found and edited to keep working.
    id: payment.id,
    status: payment.status,
    currency: payment.currency,
    amountCents: payment.amount_cents,
    levelId: payment.level_id,

    standing,
    received,
    // True only where POST /api/enrolment/confirm would actually
    // succeed. That route refuses anything not 'succeeded', so offering
    // the act on a pending payment is offering a 422.
    mayConfirmEnrolment: payment.status === 'succeeded' && !enrolment && opensLevelId != null,
    kind: payment.kind,
    gateway: payment.provider,
    createdAt: payment.created_at,
    confirmedAt: payment.confirmed_at || null,
    failureReason: payment.failure_reason || null,

    charged: {
      currency: payment.currency,
      minorUnits: payment.amount_cents,
      decimalPlaces: chargedRow ? chargedRow.decimal_places : 2,
      text: formatAmount(payment.amount_cents, {
        symbol: chargedRow ? chargedRow.symbol : payment.currency + ' ',
        decimalPlaces: chargedRow ? chargedRow.decimal_places : 2,
      }),
    },
    ledgerAmount: presentAmount(payment.amount_usd_cents, { ledger, learner: null }),

    // Both names on both, and the page chooses — `programme_levels`
    // holds one string, and an Arabic learner was being told in the
    // middle of an Arabic sentence that they had paid for the "English
    // Mastery Programme".
    level: levelNaming(level),
    opens: levelNaming(opensLevel),
    instalment,
    receipt: receipt ? { number: receipt.receipt_number, issuedAt: receipt.issued_at } : null,
    enrolment: enrolment
      ? {
        id: enrolment.id, levelId: enrolment.level_id,
        status: enrolment.status, startedAt: enrolment.started_at,
      }
      : null,
  };
}

/**
 * Which instalment this payment is, of how many, and how many are left.
 *
 * Counted from the succeeded rows in order rather than read off a
 * stored number, for the reason `nextInstalmentAmountUsdCents()` gives:
 * a stored number drifts the moment an attempt fails and is retried
 * under a fresh row.
 */
async function instalmentPosition(env, payment) {
  const plan = await db(env)
    .prepare('SELECT id, instalment_count, level_id, status FROM instalment_plans WHERE id = ?')
    .bind(payment.instalment_plan_id).first();
  if (!plan) return null;
  const { results } = await db(env)
    .prepare(`SELECT id, created_at FROM payments
               WHERE instalment_plan_id = ? AND status = 'succeeded'
               ORDER BY created_at ASC, id ASC`)
    .bind(plan.id).all();
  const paid = results || [];
  const index = paid.findIndex((p) => p.id === payment.id);
  return {
    planId: plan.id,
    // Null rather than a guess while the charge is still in flight: a
    // pending instalment has no number yet, because the number is the
    // position it takes among the ones that succeeded.
    number: index === -1 ? null : index + 1,
    of: plan.instalment_count,
    paidCount: paid.length,
    remainingCount: Math.max(0, plan.instalment_count - paid.length),
    status: plan.status,
  };
}

/**
 * Turn a payment that has actually cleared into a place on the
 * programme. Idempotent: called twice for one payment it returns the
 * enrolment it already made.
 *
 * ─────────────────────────────────────────────────────────────────────
 * WHY THIS IS A MODULE AND NOT A ROUTE BODY
 * ─────────────────────────────────────────────────────────────────────
 * It lived inside `functions/api/enrolment/confirm.js`, which meant the
 * only way to exercise it was to mint a session token and speak HTTP.
 * The rest of this platform keeps the decision in a `_lib` module and
 * the HTTP in the route — the route reads the session, the module does
 * the work — and this is that pattern applied to the one place that had
 * grown out of it.
 *
 * It is deliberately a SEPARATE STEP from the payment webhook (see the
 * note in webhook-handler.js) so staff can also trigger it for a
 * payment confirmed outside any gateway: a corporate invoice, or a bank
 * transfer taken during the manual-bridge period. Same enrolment logic
 * either way.
 *
 * A full-programme payment (kind='full_programme', level_id=NULL) is
 * handled here too, per Executive Decision #1: the money covers all six
 * levels, and only Level I's enrolment is created now. Levels II to VI
 * unlock as each prior level is completed — see
 * functions/_lib/student/progression.js.
 */
export async function confirmEnrolment(env, { user, paymentId }) {
  if (!paymentId) throw new ValidationError('paymentId is required.', { paymentId: 'Required' });

  const payment = await db(env).prepare('SELECT * FROM payments WHERE id = ?').bind(paymentId).first();
  if (!payment) throw new NotFoundError('Unknown payment.');
  if (payment.user_id !== user.id && user.role === 'student') {
    throw new ValidationError('This payment does not belong to your account.', {});
  }
  if (payment.status !== 'succeeded') {
    throw new ValidationError('Payment has not succeeded yet — nothing to enrol.', { status: payment.status });
  }

  // A NULL level_id is valid only for a full_programme payment
  // (enrolment starts at Level I); any other kind with a NULL level_id
  // is a data inconsistency, not something to guess at.
  const enrolLevelId = payment.level_id != null
    ? payment.level_id
    : (payment.kind === 'full_programme' ? 1 : null);
  if (enrolLevelId == null) {
    throw new ValidationError('This payment has no programme level to enrol into.', { paymentId: 'No level' });
  }

  const existing = await db(env)
    .prepare('SELECT * FROM enrolments WHERE user_id = ? AND level_id = ?')
    .bind(payment.user_id, enrolLevelId)
    .first();
  if (existing) return { enrolment: toEnrolmentResponse(existing), created: false };

  const level = await db(env).prepare('SELECT * FROM programme_levels WHERE id = ?').bind(enrolLevelId).first();
  const enrolId = newId('enr');
  // Matches the ISO format every other timestamp column in the schema
  // uses — the SQL-literal datetime('now') this replaced produced a
  // different one ("YYYY-MM-DD HH:MM:SS" against the rest of the
  // schema's "YYYY-MM-DDTHH:MM:SS.sssZ").
  const startedAt = nowIso();
  await db(env)
    .prepare(`INSERT INTO enrolments (id, user_id, application_id, level_id, status, started_at)
      VALUES (?, ?, NULL, ?, 'active', ?)`)
    .bind(enrolId, payment.user_id, enrolLevelId, startedAt)
    .run();

  await notify(env, 'enrolment_confirmed', {
    to: user.email, name: user.preferred_name || user.email, levelName: level.name,
  });

  return {
    enrolment: {
      id: enrolId,
      userId: payment.user_id,
      applicationId: null,
      levelId: level.id,
      status: 'active',
      startedAt,
      completedAt: null,
    },
    created: true,
  };
}

// Both paths — a fresh creation and the idempotent replay for an
// enrolment that already exists — answer in this one camelCase shape.
// The replay path used to return the raw DB row verbatim (snake_case
// columns), a different shape than a fresh confirmation got, which is
// exactly the inconsistency a client polling after a page reload hits.
function toEnrolmentResponse(row) {
  return {
    id: row.id,
    userId: row.user_id,
    applicationId: row.application_id,
    levelId: row.level_id,
    status: row.status,
    startedAt: row.started_at,
    completedAt: row.completed_at,
  };
}
