// What the learner owes, what they have paid, and why the two differ.
//
// THE FAULT THIS CORRECTS. The platform has carried a complete money
// apparatus for a long time — `payments`, `receipts`, `refunds`,
// `instalment_plans`, `scholarships`, `promo_codes`, four gateway
// adapters, atomic receipt numbering, a reconciliation report for
// administrators — and a learner had no way whatever to see any of it.
// The one learner-facing surface that touched money,
// functions/_lib/student/dashboard.js, returns a flat list of payment
// rows: amount, status, provider, receipt number. It cannot answer the
// only question a person actually asks about tuition, which is "how
// much do I still owe, and how did you arrive at that?". A scholarship
// they were awarded appeared nowhere. An instalment plan they were on
// appeared nowhere. The College could show a payment it had taken and
// could not show the obligation it was taken against.
//
// THE BALANCE IS NOT STORED, AND MUST NEVER BE. There is no
// `balance_usd_cents` column here and this file does not add one. A
// stored balance is a second copy of a figure that the ledger already
// determines, and the two drift the first time a refund, a scholarship
// or a failed-then-retried charge lands out of order — after which the
// College is telling a learner a number no record supports. Everything
// below is computed from the rows every time it is asked for, and the
// payload carries the arithmetic that produced it so a learner (or a
// registrar reading over their shoulder) can check it line by line:
//
//     outstanding = assessed − relief − paid + refunded
//
// WHAT COUNTS AS AN OBLIGATION, and why a pending checkout does not.
// An abandoned checkout leaves a `pending` payment row behind for ever.
// If a row like that were read as "this learner has committed to Level
// IV", every learner who ever opened a checkout page and closed it
// would be shown a debt the College never assessed. So a payment is
// evidence of commitment only once money was actually received; an
// enrolment or an instalment plan is a commitment on its own, because
// somebody made a decision to create it.
//
// MONEY IS INTEGER MINOR UNITS EVERYWHERE. Not one figure below is a
// float, and presentAmount() throws rather than emit one — a
// fractional cent in a balance means a float crept into the arithmetic
// somewhere upstream, and the only version of that bug anybody ever
// finds is the one that refuses to be presented. The single legitimate
// non-integer in the payload is an FX rate, which is a rate and not an
// amount.

import { db, NotFoundError, ValidationError } from '../db.js';
import { getConfigJson } from '../config.js';
import { formatMinorUnits, usdCentsToMinorUnits } from '../currency.js';
import { computeInstalmentAmounts } from '../payments/instalments.js';

// `payments.amount_usd_cents` is the platform's normalised figure and
// its name says which currency it is in. The College's ledger is
// therefore denominated in USD by schema definition, not by a choice
// made here — hence a constant rather than a config key.
const LEDGER_CURRENCY = 'USD';

// The statuses in which money has actually reached the College. A
// `refunded` payment is still a receipt of money; the return journey is
// a `refunds` row, and counting both is what makes the two cancel
// exactly instead of approximately.
const RECEIVED = new Set(['succeeded', 'refunded', 'partially_refunded']);

// ---------------------------------------------------------------------
// Presentation — pure, and separated from every query below
// ---------------------------------------------------------------------

// THIS USED TO BE A COPY, AND A COPY HELD IN STEP BY A TEST IS STILL
// TWO PLACES THAT CAN BE WRONG.
//
// It was duplicated from functions/_lib/currency.js for a real reason —
// that one reads the currency row per call, and a statement converts
// thirty or more figures, which is thirty round trips to say one thing.
// The reason survives; the duplication does not. The arithmetic now
// lives once, as a pure function in currency.js, and both the async
// wrapper there and this call site use it. When the two-decimal-place
// assumption buried in that arithmetic was found, it had to be fixed
// once instead of twice.
//
// tests/student-finance.test.mjs still asserts that this and
// convertFromUsdCents() agree on the same input. That assertion is now
// tautological, and it is kept deliberately: it is the thing that would
// fail if somebody re-introduced a local copy here.
export function convertUsdCents(usdCents, unitsPerUsd, decimalPlaces) {
  return usdCentsToMinorUnits(usdCents, unitsPerUsd, decimalPlaces);
}

// Two things the shared formatter does not do, both of which matter
// only on a surface where a person reads a balance rather than a
// notification glances at one:
//
//   THE SIGN. A credit reads as -$50.00, never as $-50.00.
//   THE GROUPING. Tuition here runs to five figures, and $1710000.00
//   is a number a reader has to count digits on. $1,710,000.00 is not.
//
// formatMinorUnits() remains the source of the decimal expansion — the
// separators are added around what it returns, so this cannot disagree
// with the figure a payment-confirmation email shows about the number
// of decimal places a currency has.
export function formatAmount(minorUnits, { symbol, decimalPlaces }) {
  const sign = minorUnits < 0 ? '-' : '';
  const [whole, fraction] = formatMinorUnits(Math.abs(minorUnits), decimalPlaces).split('.');
  const grouped = whole.replace(/\B(?=(\d{3})+(?!\d))/g, ',');
  return `${sign}${symbol}${grouped}${fraction === undefined ? '' : `.${fraction}`}`;
}

/**
 * One figure, in the College's ledger currency and — where the platform
 * genuinely knows it — in the learner's own, never one without the
 * other. The converted figure carries the rate's date on itself rather
 * than only in the payload's header, because a figure lifted out into a
 * table cell, an email or a screenshot loses its header and must not
 * lose the date on which it was true.
 */
export function presentAmount(usdCents, { ledger, learner }) {
  if (!Number.isInteger(usdCents)) {
    // Deliberately loud. See this file's header: a fractional cent is a
    // float that got into money arithmetic, and refusing to render it
    // is the only reliable way that is ever noticed.
    throw new Error(`Money must be integer minor units; got ${usdCents}.`);
  }
  const presented = {
    usdCents,
    ledger: {
      currency: ledger.code,
      minorUnits: usdCents,
      decimalPlaces: ledger.decimalPlaces,
      text: formatAmount(usdCents, ledger),
    },
    learner: null,
  };
  if (learner) {
    const minorUnits = convertUsdCents(usdCents, learner.unitsPerUsd, learner.decimalPlaces);
    presented.learner = {
      currency: learner.code,
      minorUnits,
      decimalPlaces: learner.decimalPlaces,
      text: formatAmount(minorUnits, learner),
      rateAsOf: learner.rateAsOf,
    };
  }
  return presented;
}

// ---------------------------------------------------------------------
// The statement
// ---------------------------------------------------------------------

export async function buildStudentFinance(env, userId) {
  const ctx = await loadLedger(env, userId);
  const { money, presentation } = ctx;

  const tuition = await assessTuition(env, ctx);
  const relief = summariseRelief(ctx, tuition);
  const settlement = summariseSettlement(ctx);

  const assessedUsdCents = tuition.grossUsdCents;
  const reliefUsdCents = relief.totalUsdCents;
  const netAssessedUsdCents = assessedUsdCents - reliefUsdCents;
  const outstandingUsdCents = netAssessedUsdCents - settlement.paidUsdCents + settlement.refundedUsdCents;

  const instalments = buildInstalments(ctx, money);

  return {
    presentation,
    tuition: {
      scope: tuition.scope,
      components: tuition.components,
      gross: money(assessedUsdCents),
    },
    relief: {
      total: money(reliefUsdCents),
      scholarships: relief.scholarships,
      promoCodes: relief.promoCodes,
    },
    payments: settlement.lines,
    receipts: settlement.receipts,
    refunds: settlement.refunds,
    instalments: instalments.plans,
    nextInstalment: instalments.next,
    balance: {
      assessed: money(assessedUsdCents),
      relief: money(reliefUsdCents),
      netAssessed: money(netAssessedUsdCents),
      paid: money(settlement.paidUsdCents),
      refunded: money(settlement.refundedUsdCents),
      outstanding: money(outstandingUsdCents),
      state: balanceState(tuition.scope, outstandingUsdCents),
    },
    // The workings, published beside the answer. A balance a learner
    // cannot check is a balance they have to take on trust, and this
    // College does not ask for that anywhere else in its record.
    reconciliation: {
      identity: 'outstanding = assessed - relief - paid + refunded',
      assessedUsdCents,
      reliefUsdCents,
      paidUsdCents: settlement.paidUsdCents,
      refundedUsdCents: settlement.refundedUsdCents,
      outstandingUsdCents,
      balances: outstandingUsdCents === assessedUsdCents - reliefUsdCents - settlement.paidUsdCents + settlement.refundedUsdCents,
    },
  };
}

function balanceState(scope, outstandingUsdCents) {
  if (scope === 'none') return 'nothing_assessed';
  if (outstandingUsdCents > 0) return 'outstanding';
  if (outstandingUsdCents < 0) return 'in_credit';
  return 'settled';
}

// ---------------------------------------------------------------------
// One invoice
// ---------------------------------------------------------------------

// An invoice reference is a payment id. There is no `invoices` table:
// what an invoice actually is here is one charge, its composition, and
// whether it settled — which is precisely a `payments` row plus the
// price it was struck against. Validated before it reaches a query so
// a malformed reference is a field-level 422 the UI can highlight,
// never a 404 that reads as "no such invoice" when the real answer is
// "that is not an invoice reference".
export function assertInvoiceReference(id) {
  if (typeof id !== 'string' || id.trim() === '') {
    throw new ValidationError('An invoice reference is required.', { id: 'Required' });
  }
  if (!/^pay_[A-Za-z0-9_-]{1,128}$/.test(id)) {
    throw new ValidationError('That is not an invoice reference.', { id: 'Malformed' });
  }
  return id;
}

export async function buildStudentInvoice(env, { userId, invoiceId }) {
  assertInvoiceReference(invoiceId);

  const payment = await db(env).prepare('SELECT * FROM payments WHERE id = ?').bind(invoiceId).first();
  // Somebody else's invoice is reported as absent, not as forbidden.
  // A 403 here would confirm that the reference exists and belongs to a
  // real learner, turning this endpoint into an oracle that answers
  // "is pay_… a real payment?" for anyone with a session and patience.
  if (!payment || payment.user_id !== userId) {
    throw new NotFoundError('No invoice with that reference.');
  }

  const ctx = await loadLedger(env, userId);
  const { money, presentation } = ctx;
  const level = payment.level_id ? ctx.levels.get(payment.level_id) : null;
  const plan = payment.instalment_plan_id ? ctx.plans.find((p) => p.id === payment.instalment_plan_id) : null;

  const lines = await invoiceLines(env, ctx, payment, { level, plan });
  const grossUsdCents = lines.reduce((sum, l) => sum + l.grossUsdCents, 0);
  const reliefUsdCents = lines.reduce((sum, l) => sum + l.reliefUsdCents, 0);
  const netUsdCents = grossUsdCents - reliefUsdCents;

  const received = RECEIVED.has(payment.status);
  const paidUsdCents = received ? payment.amount_usd_cents : 0;
  const refundRows = ctx.refunds.filter((r) => r.payment_id === payment.id);
  const refundedUsdCents = refundRows
    .filter((r) => r.status === 'processed')
    .reduce((sum, r) => sum + r.amount_cents, 0);

  const receipt = ctx.receiptsByPayment.get(payment.id) || null;

  return {
    presentation,
    invoice: {
      id: payment.id,
      kind: payment.kind,
      status: payment.status,
      settled: received,
      issuedOn: payment.created_at,
      settledOn: payment.confirmed_at || null,
      provider: payment.provider,
      failureReason: payment.failure_reason || null,
      levelId: payment.level_id || null,
      levelName: level ? level.name : null,
      instalmentPlanId: payment.instalment_plan_id || null,
      receiptNumber: receipt ? receipt.receipt_number : null,
      // The learner's own account details, and nothing about anybody
      // else. No issuer block: the College's billing entity, registered
      // address and tax registration are recorded nowhere in this
      // schema, and an invoice that printed a letterhead would be
      // inventing all three.
      issuedTo: { userId: ctx.user.id, email: ctx.user.email, name: ctx.user.preferred_name || null },
    },
    lines: lines.map((line) => ({
      kind: line.kind,
      description: line.description,
      basis: line.basis,
      gross: money(line.grossUsdCents),
      relief: money(line.reliefUsdCents),
      net: money(line.grossUsdCents - line.reliefUsdCents),
      authority: line.authority || null,
    })),
    // What the gateway actually put on the card, in the currency it was
    // taken in. This is a recorded fact, not a conversion, and it is
    // reported separately from the presentation layer for that reason.
    charged: presentCharge(ctx, payment),
    totals: {
      gross: money(grossUsdCents),
      relief: money(reliefUsdCents),
      net: money(netUsdCents),
      paid: money(paidUsdCents),
      refunded: money(refundedUsdCents),
      outstanding: money(netUsdCents - paidUsdCents + refundedUsdCents),
    },
    receipt: receipt
      ? { number: receipt.receipt_number, issuedAt: receipt.issued_at, pdfUrl: receipt.pdf_url || null }
      : null,
    refunds: refundRows.map((r) => presentRefund(r, money)),
    reconciliation: {
      identity: 'outstanding = gross - relief - paid + refunded',
      grossUsdCents,
      reliefUsdCents,
      paidUsdCents,
      refundedUsdCents,
      outstandingUsdCents: netUsdCents - paidUsdCents + refundedUsdCents,
      // The invoice's own net must equal the amount actually struck on
      // the payment row. If it does not, the price the College charged
      // and the price it can account for have parted company, and the
      // learner is entitled to see that said out loud rather than have
      // one of the two figures quietly win.
      matchesChargedAmount: netUsdCents === payment.amount_usd_cents,
    },
  };
}

async function invoiceLines(env, ctx, payment, { level, plan }) {
  const discounted = Boolean(payment.promo_code || payment.scholarship_id);

  if (payment.kind === 'instalment') {
    const count = plan ? plan.instalment_count : null;
    const position = plan ? instalmentPosition(ctx, plan, payment) : null;
    const scope = plan && plan.level_id
      ? (ctx.levels.get(plan.level_id)?.name || `Level ${plan.level_id}`)
      : 'the full programme';
    return [{
      kind: 'instalment',
      description: position && count
        ? `Instalment ${position} of ${count} towards ${scope}`
        : `Instalment towards ${scope}`,
      basis: plan
        ? 'instalment_plans.total_amount_usd_cents, divided by functions/_lib/payments/instalments.js computeInstalmentAmounts()'
        : 'payments.amount_usd_cents',
      grossUsdCents: payment.amount_usd_cents,
      // Discounting a single instalment rather than the plan total is
      // refused at checkout (create-checkout.js), so an instalment
      // invoice has no relief line by construction.
      reliefUsdCents: 0,
    }];
  }

  const baseUsdCents = await baseFor(env, ctx, payment, level);
  const lines = [{
    kind: payment.kind === 'full_programme' ? 'full_programme_tuition' : 'level_tuition',
    description: payment.kind === 'full_programme'
      ? 'Tuition — the full programme, all six levels'
      : `Tuition — ${level ? `${level.name} (${level.roman}, ${level.cefr})` : 'programme level'}`,
    basis: payment.kind === 'full_programme'
      ? 'platform_config.full_programme_price_usd_cents'
      : 'programme_levels.price_usd_cents',
    grossUsdCents: baseUsdCents,
    reliefUsdCents: 0,
  }];

  if (discounted) {
    const reliefUsdCents = Math.max(0, baseUsdCents - payment.amount_usd_cents);
    const scholarship = payment.scholarship_id ? ctx.scholarships.find((s) => s.id === payment.scholarship_id) : null;
    const promo = payment.promo_code ? ctx.promoCodes.get(payment.promo_code) : null;
    lines.push({
      kind: 'relief',
      description: describeRelief({ scholarship, promo }),
      basis: scholarship
        ? 'scholarships, applied by functions/_lib/payments/discounts.js computeDiscountedAmount()'
        : 'promo_codes, applied by functions/_lib/payments/discounts.js computeDiscountedAmount()',
      grossUsdCents: 0,
      reliefUsdCents,
      authority: scholarship ? scholarshipAuthority(ctx, scholarship) : { source: 'promo_codes', code: promo ? promo.code : payment.promo_code },
    });
  }
  return lines;
}

// The price a charge was struck against, read from the same source
// create-checkout.js read it from when it struck it — the level's list
// price, or the configured full-programme price. Relief is then the gap
// between that and what was actually taken, which is the only way to
// state a discount that cannot disagree with the ledger.
async function baseFor(env, ctx, payment, level) {
  if (payment.kind === 'full_programme') return getConfigJson(env, 'full_programme_price_usd_cents');
  if (level) return level.price_usd_cents;
  // A single-level payment naming no level should not exist; if one
  // does, its own amount is the only defensible base, which reports
  // relief of zero rather than a difference against a guessed price.
  return payment.amount_usd_cents;
}

function describeRelief({ scholarship, promo }) {
  if (scholarship && promo) return 'Scholarship and promotional relief';
  if (scholarship) {
    if (scholarship.kind === 'full') return 'Scholarship — full remission of tuition';
    if (scholarship.kind === 'percent') return `Scholarship — ${scholarship.value}% of tuition remitted`;
    return 'Scholarship — fixed remission of tuition';
  }
  return `Promotional code applied — ${promo ? promo.code : 'code'}`;
}

// ---------------------------------------------------------------------
// Loading, once, for both answers above
// ---------------------------------------------------------------------

async function loadLedger(env, userId) {
  const [user, levelRows, enrolmentRows, paymentRows, refundRows, planRows, scholarshipRows, currencyRows] = await Promise.all([
    db(env).prepare('SELECT id, email, preferred_name FROM users WHERE id = ?').bind(userId).first(),
    db(env).prepare('SELECT * FROM programme_levels ORDER BY id ASC').all(),
    db(env).prepare(`SELECT id, level_id, status, started_at, completed_at, created_at
      FROM enrolments WHERE user_id = ? ORDER BY level_id ASC`).bind(userId).all(),
    db(env).prepare(`SELECT p.*, r.receipt_number, r.issued_at AS receipt_issued_at, r.pdf_url AS receipt_pdf_url
      FROM payments p LEFT JOIN receipts r ON r.payment_id = p.id
      WHERE p.user_id = ? ORDER BY p.created_at DESC, p.id DESC`).bind(userId).all(),
    db(env).prepare(`SELECT rf.* FROM refunds rf JOIN payments p ON p.id = rf.payment_id
      WHERE p.user_id = ? ORDER BY rf.created_at ASC, rf.id ASC`).bind(userId).all(),
    db(env).prepare('SELECT * FROM instalment_plans WHERE user_id = ? ORDER BY id ASC').bind(userId).all(),
    db(env).prepare('SELECT * FROM scholarships WHERE user_id = ? ORDER BY created_at ASC, id ASC').bind(userId).all(),
    db(env).prepare('SELECT * FROM currencies').all(),
  ]);
  if (!user) throw new NotFoundError('No account found for this session.');

  const payments = paymentRows.results;
  const currencies = new Map(currencyRows.results.map((c) => [c.code, c]));
  const promoCodes = await loadPromoCodes(env, payments);
  const approvers = await loadApprovers(env, scholarshipRows.results);

  const presentation = resolvePresentation({ currencies, payments });
  const money = (usdCents) => presentAmount(usdCents, presentation.frame);

  const receiptsByPayment = new Map();
  for (const p of payments) {
    if (p.receipt_number) {
      receiptsByPayment.set(p.id, { receipt_number: p.receipt_number, issued_at: p.receipt_issued_at, pdf_url: p.receipt_pdf_url });
    }
  }

  return {
    user,
    levels: new Map(levelRows.results.map((l) => [l.id, l])),
    enrolments: enrolmentRows.results,
    payments,
    refunds: refundRows.results,
    plans: planRows.results,
    scholarships: scholarshipRows.results,
    promoCodes,
    approvers,
    currencies,
    receiptsByPayment,
    money,
    presentation: presentation.published,
  };
}

async function loadPromoCodes(env, payments) {
  const codes = [...new Set(payments.map((p) => p.promo_code).filter(Boolean))];
  if (codes.length === 0) return new Map();
  const { results } = await db(env)
    .prepare(`SELECT * FROM promo_codes WHERE code IN (${codes.map(() => '?').join(',')})`)
    .bind(...codes)
    .all();
  return new Map(results.map((r) => [r.code, r]));
}

// `scholarships.approved_by` holds a staff user id and carries no
// foreign key, so it can name a row that is not there. Only the role is
// read back, never a name: the learner is entitled to know a scholarship
// was approved by somebody holding staff authority, and publishing which
// person into a learner-facing document would put a named individual in
// an office the record does not say they hold (CLAUDE.md §5).
async function loadApprovers(env, scholarships) {
  const ids = [...new Set(scholarships.map((s) => s.approved_by).filter(Boolean))];
  if (ids.length === 0) return new Map();
  const { results } = await db(env)
    .prepare(`SELECT id, role FROM users WHERE id IN (${ids.map(() => '?').join(',')})`)
    .bind(...ids)
    .all();
  return new Map(results.map((r) => [r.id, r]));
}

// The learner's own currency is never guessed. It is either a currency
// they have actually transacted in, or the routing default for the
// country on their application — both are facts the platform holds —
// or it is unknown, and unknown is published as unknown rather than
// filled in with USD and presented as if the College knew.
function resolvePresentation({ currencies, payments }) {
  const ledgerRow = currencies.get(LEDGER_CURRENCY);
  const ledger = {
    code: LEDGER_CURRENCY,
    symbol: ledgerRow ? ledgerRow.symbol : '$',
    decimalPlaces: ledgerRow ? ledgerRow.decimal_places : 2,
  };

  const transacted = payments.find((p) => p.status !== 'failed' && p.currency && p.currency !== LEDGER_CURRENCY);
  const row = transacted ? currencies.get(transacted.currency) : null;

  if (!transacted) {
    return {
      frame: { ledger, learner: null },
      published: {
        ledgerCurrency: ledger,
        learnerCurrency: null,
        learnerCurrencyState: payments.length ? 'same_as_ledger' : 'unknown',
        basis: payments.length
          ? 'Every charge on this account was taken in the ledger currency.'
          : 'No charge has been taken on this account, so no currency is known for this learner.',
      },
    };
  }

  if (!row || row.fx_rate_to_usd == null) {
    // The learner paid in a currency the platform can no longer convert
    // — the rate was withdrawn, or was never configured. Saying so is
    // the only honest answer; converting at a rate nobody set is not.
    return {
      frame: { ledger, learner: null },
      published: {
        ledgerCurrency: ledger,
        learnerCurrency: { code: transacted.currency },
        learnerCurrencyState: 'no_rate',
        basis: `This account transacts in ${transacted.currency}, for which currencies.fx_rate_to_usd holds no rate.`,
      },
    };
  }

  const learner = {
    code: row.code,
    symbol: row.symbol,
    decimalPlaces: row.decimal_places,
    // The column is named fx_rate_to_usd but holds the number of units
    // of this currency per one US dollar — see
    // functions/_lib/currency/fx-service.js, whose provider contract
    // says so, and convertFromUsdCents(), which multiplies by it. The
    // payload names it for what it is so nobody inverts it downstream.
    unitsPerUsd: row.fx_rate_to_usd,
    rateAsOf: row.fx_rate_as_of || null,
    rateSource: row.fx_rate_source || null,
  };
  return {
    frame: { ledger, learner },
    published: {
      ledgerCurrency: ledger,
      learnerCurrency: {
        code: learner.code,
        symbol: learner.symbol,
        decimalPlaces: learner.decimalPlaces,
        rate: {
          unitsPerUsd: learner.unitsPerUsd,
          asOf: learner.rateAsOf,
          source: learner.rateSource,
          column: 'currencies.fx_rate_to_usd',
        },
      },
      learnerCurrencyState: 'converted',
      basis: `This account was last charged in ${learner.code} (payments.currency).`,
    },
  };
}

// ---------------------------------------------------------------------
// The assessment — what the College says is owed, and on what evidence
// ---------------------------------------------------------------------

async function assessTuition(env, ctx) {
  const receivedPayments = ctx.payments.filter((p) => RECEIVED.has(p.status));
  const livePlans = ctx.plans.filter((p) => p.status !== 'cancelled');

  const fullProgrammeEvidence = [
    ...receivedPayments.filter((p) => p.kind === 'full_programme').map((p) => ({ source: 'payments', id: p.id })),
    ...livePlans.filter((p) => p.level_id == null).map((p) => ({ source: 'instalment_plans', id: p.id })),
  ];

  // Level evidence, gathered per level so a component can say why it is
  // there. An enrolment counts on its own — somebody decided to create
  // it — but a payment counts only once money arrived (see the header).
  const byLevel = new Map();
  const note = (levelId, entry) => {
    if (!levelId) return;
    if (!byLevel.has(levelId)) byLevel.set(levelId, []);
    byLevel.get(levelId).push(entry);
  };
  for (const e of ctx.enrolments) {
    if (e.status !== 'withdrawn') note(e.level_id, { source: 'enrolments', id: e.id });
  }
  for (const p of receivedPayments) {
    if (p.kind === 'single_level') note(p.level_id, { source: 'payments', id: p.id });
  }
  for (const p of livePlans) {
    if (p.level_id != null) note(p.level_id, { source: 'instalment_plans', id: p.id });
  }

  const components = [];

  if (fullProgrammeEvidence.length > 0) {
    // A full-programme purchase is one price for all six levels. The
    // per-level enrolments that progressive unlocking creates against it
    // (Executive Decision #1) are access, not additional tuition, and
    // charging for them here would bill the same programme twice.
    const plan = livePlans.find((p) => p.level_id == null);
    const grossUsdCents = plan
      ? plan.total_amount_usd_cents
      : await getConfigJson(env, 'full_programme_price_usd_cents');
    components.push({
      kind: 'full_programme_tuition',
      levelId: null,
      description: 'The full programme — all six levels',
      basis: plan ? 'instalment_plans.total_amount_usd_cents' : 'platform_config.full_programme_price_usd_cents',
      gross: ctx.money(grossUsdCents),
      grossUsdCents,
      evidence: fullProgrammeEvidence,
    });
  }

  for (const [levelId, evidence] of [...byLevel.entries()].sort((a, b) => a[0] - b[0])) {
    // Under a full-programme commitment, a level is only assessed
    // separately when it was separately bought — a plan or a payment
    // naming that level and nothing else.
    if (fullProgrammeEvidence.length > 0 && !evidence.some((e) => e.source !== 'enrolments')) continue;
    const level = ctx.levels.get(levelId);
    if (!level) continue;
    const plan = ctx.plans.find((p) => p.level_id === levelId && p.status !== 'cancelled');
    const grossUsdCents = plan ? plan.total_amount_usd_cents : level.price_usd_cents;
    components.push({
      kind: 'level_tuition',
      levelId,
      description: `${level.name} — Level ${level.roman} (${level.cefr})`,
      basis: plan ? 'instalment_plans.total_amount_usd_cents' : 'programme_levels.price_usd_cents',
      gross: ctx.money(grossUsdCents),
      grossUsdCents,
      evidence,
    });
  }

  const grossUsdCents = components.reduce((sum, c) => sum + c.grossUsdCents, 0);
  const scope = components.length === 0
    ? 'none'
    : (fullProgrammeEvidence.length > 0 ? 'full_programme' : 'by_level');
  return { scope, components, grossUsdCents };
}

// ---------------------------------------------------------------------
// Relief — a discount is only real once it is on the ledger
// ---------------------------------------------------------------------

// Relief is measured, not asserted: the difference between the price a
// payment was struck against and the amount actually charged. A
// scholarship the learner holds but has never applied is listed with
// nothing attributed to it, because nothing has been remitted yet.
function summariseRelief(ctx, tuition) {
  const byScholarship = new Map();
  const byPromo = new Map();
  let totalUsdCents = 0;

  for (const payment of ctx.payments) {
    if (!RECEIVED.has(payment.status)) continue;
    if (payment.kind === 'instalment') continue; // no discount can reach one — see invoiceLines()
    if (!payment.promo_code && !payment.scholarship_id) continue;

    const component = tuition.components.find((c) => (
      payment.kind === 'full_programme' ? c.kind === 'full_programme_tuition' : c.levelId === payment.level_id
    ));
    if (!component) continue;
    const reliefUsdCents = Math.max(0, component.grossUsdCents - payment.amount_usd_cents);
    if (reliefUsdCents === 0) continue;
    totalUsdCents += reliefUsdCents;

    if (payment.scholarship_id) {
      const entry = byScholarship.get(payment.scholarship_id) || { usdCents: 0, paymentIds: [] };
      entry.usdCents += reliefUsdCents;
      entry.paymentIds.push(payment.id);
      byScholarship.set(payment.scholarship_id, entry);
    } else {
      const entry = byPromo.get(payment.promo_code) || { usdCents: 0, paymentIds: [] };
      entry.usdCents += reliefUsdCents;
      entry.paymentIds.push(payment.id);
      byPromo.set(payment.promo_code, entry);
    }
  }

  const scholarships = ctx.scholarships.map((s) => {
    const applied = byScholarship.get(s.id) || null;
    return {
      id: s.id,
      kind: s.kind,
      // `value` means two different things depending on kind, and a
      // single ambiguous number is how a percentage gets rendered as a
      // sum of money. Both are named, and the one that does not apply
      // is null.
      percent: s.kind === 'percent' ? s.value : null,
      amountUsdCents: s.kind === 'fixed_amount' ? Math.round(s.value) : null,
      awardedOn: s.created_at,
      notes: s.notes || null,
      authority: scholarshipAuthority(ctx, s),
      applied: Boolean(applied),
      remitted: ctx.money(applied ? applied.usdCents : 0),
      appliedToPaymentIds: applied ? applied.paymentIds : [],
    };
  });

  const promoCodes = [...byPromo.entries()].map(([code, entry]) => {
    const row = ctx.promoCodes.get(code);
    return {
      code,
      kind: row ? row.kind : null,
      percent: row && row.kind === 'percent' ? row.value : null,
      amountUsdCents: row && row.kind === 'fixed_amount' ? Math.round(row.value) : null,
      remitted: ctx.money(entry.usdCents),
      appliedToPaymentIds: entry.paymentIds,
    };
  });

  return { totalUsdCents, scholarships, promoCodes };
}

function scholarshipAuthority(ctx, scholarship) {
  const approver = scholarship.approved_by ? ctx.approvers.get(scholarship.approved_by) : null;
  return {
    source: 'scholarships.approved_by',
    recorded: Boolean(scholarship.approved_by),
    approvedByRole: approver ? approver.role : null,
    notes: scholarship.notes || null,
  };
}

// ---------------------------------------------------------------------
// Settlement — every payment, every receipt, every refund
// ---------------------------------------------------------------------

function summariseSettlement(ctx) {
  const { money } = ctx;
  let paidUsdCents = 0;
  let refundedUsdCents = 0;
  const receipts = [];

  const lines = ctx.payments.map((payment) => {
    const received = RECEIVED.has(payment.status);
    if (received) paidUsdCents += payment.amount_usd_cents;

    const refunds = ctx.refunds.filter((r) => r.payment_id === payment.id);
    const receipt = ctx.receiptsByPayment.get(payment.id) || null;
    if (receipt) {
      receipts.push({
        number: receipt.receipt_number,
        issuedAt: receipt.issued_at,
        pdfUrl: receipt.pdf_url || null,
        paymentId: payment.id,
        amount: money(payment.amount_usd_cents),
      });
    }

    const level = payment.level_id ? ctx.levels.get(payment.level_id) : null;
    return {
      id: payment.id,
      invoiceRef: payment.id,
      kind: payment.kind,
      levelId: payment.level_id || null,
      levelName: level ? level.name : null,
      status: payment.status,
      received,
      provider: payment.provider,
      createdAt: payment.created_at,
      confirmedAt: payment.confirmed_at || null,
      failureReason: payment.failure_reason || null,
      instalmentPlanId: payment.instalment_plan_id || null,
      promoCode: payment.promo_code || null,
      scholarshipId: payment.scholarship_id || null,
      amount: money(payment.amount_usd_cents),
      charged: presentCharge(ctx, payment),
      receiptNumber: receipt ? receipt.receipt_number : null,
      refunds: refunds.map((r) => presentRefund(r, money)),
    };
  });

  for (const refund of ctx.refunds) {
    // Only a processed refund has moved money. A requested or approved
    // one is a decision in progress and must not reduce a balance the
    // learner is still expected to settle.
    if (refund.status === 'processed') refundedUsdCents += refund.amount_cents;
  }

  return {
    lines,
    receipts,
    paidUsdCents,
    refundedUsdCents,
    refunds: ctx.refunds.map((r) => ({ ...presentRefund(r, money), paymentId: r.payment_id })),
  };
}

// What the card was actually charged, in the currency of the charge.
// `payments.amount_cents` is a recorded fact about a transaction and
// deliberately does not travel through the FX presenter — converting a
// figure that is already in the learner's own currency, at today's
// rate, would overwrite what they were charged with what it would cost
// now.
function presentCharge(ctx, payment) {
  const row = ctx.currencies.get(payment.currency);
  const frame = {
    symbol: row ? row.symbol : '',
    decimalPlaces: row ? row.decimal_places : 2,
  };
  return {
    currency: payment.currency,
    minorUnits: payment.amount_cents,
    decimalPlaces: frame.decimalPlaces,
    text: formatAmount(payment.amount_cents, frame),
  };
}

// `refunds.amount_cents` is read as USD cents, agreeing exactly with
// functions/_lib/reports/revenue.js, which sums the same column as
// `refundedUsdCents`. The table carries no currency and no
// amount_usd_cents column, so the two readings cannot both be
// supported; agreeing with the existing reader is what keeps a
// learner's statement and the administrator's revenue report from
// disagreeing about the same refund. Reported as a schema gap.
function presentRefund(refund, money) {
  return {
    id: refund.id,
    status: refund.status,
    reason: refund.reason,
    requestedOn: refund.created_at,
    moved: refund.status === 'processed',
    amount: money(refund.amount_cents),
  };
}

// ---------------------------------------------------------------------
// Instalments
// ---------------------------------------------------------------------

function instalmentPosition(ctx, plan, payment) {
  const paid = ctx.payments
    .filter((p) => p.instalment_plan_id === plan.id && p.status === 'succeeded')
    .sort((a, b) => String(a.created_at).localeCompare(String(b.created_at)) || a.id.localeCompare(b.id));
  const index = paid.findIndex((p) => p.id === payment.id);
  return index === -1 ? null : index + 1;
}

function buildInstalments(ctx, money) {
  const plans = ctx.plans.map((plan) => {
    // The same array checkout draws from, from the same function, so a
    // learner is never quoted a figure the payment endpoint will not
    // charge. nextInstalmentAmountUsdCents() is deliberately not called:
    // its refusal on a fully-paid plan is a guard for taking money, and
    // a statement of account must be able to describe a finished plan
    // rather than throw at it.
    const amounts = computeInstalmentAmounts(plan.total_amount_usd_cents, plan.instalment_count);
    const paid = ctx.payments
      .filter((p) => p.instalment_plan_id === plan.id && p.status === 'succeeded')
      .sort((a, b) => String(a.created_at).localeCompare(String(b.created_at)) || a.id.localeCompare(b.id));

    const schedule = amounts.map((amountUsdCents, i) => {
      const payment = paid[i] || null;
      return {
        number: i + 1,
        amount: money(amountUsdCents),
        state: payment ? 'paid' : (i === paid.length ? 'next' : 'scheduled'),
        paymentId: payment ? payment.id : null,
        paidOn: payment ? (payment.confirmed_at || payment.created_at) : null,
        // There is no due-date column on instalment_plans and no adopted
        // cadence policy (see functions/_lib/payments/instalments.js),
        // so no date is published. A date invented here would be a
        // deadline the College never set.
        dueOn: null,
      };
    });

    const level = plan.level_id != null ? ctx.levels.get(plan.level_id) : null;
    const next = paid.length < plan.instalment_count ? schedule[paid.length] : null;
    const paidUsdCents = paid.reduce((sum, p) => sum + p.amount_usd_cents, 0);

    return {
      id: plan.id,
      scope: plan.level_id == null ? 'full_programme' : 'level',
      levelId: plan.level_id,
      levelName: level ? level.name : null,
      status: plan.status,
      instalmentCount: plan.instalment_count,
      paidCount: paid.length,
      remainingCount: Math.max(0, plan.instalment_count - paid.length),
      total: money(plan.total_amount_usd_cents),
      paid: money(paidUsdCents),
      remaining: money(plan.total_amount_usd_cents - paidUsdCents),
      schedule,
      next: next ? { number: next.number, amount: next.amount, dueOn: null } : null,
    };
  });

  // With no due dates there is no basis on which to order two live
  // plans against each other, so the one that is named is named
  // explicitly rather than presented as "the next payment".
  const live = plans.filter((p) => p.status === 'active' && p.next);
  const next = live.length
    ? { planId: live[0].id, scope: live[0].scope, levelId: live[0].levelId, ...live[0].next, ofPlans: live.length }
    : null;

  return { plans, next };
}
