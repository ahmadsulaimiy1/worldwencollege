/* WHAT THE COLLEGE WOULD CHARGE, BEFORE ANYTHING IS CREATED.
 *
 * ─────────────────────────────────────────────────────────────────────
 * THE FAULT THIS FILE CORRECTS
 * ─────────────────────────────────────────────────────────────────────
 * `POST /api/payments/create-checkout` decides four things at once —
 * the price, the discount, the currency and the gateway — and it
 * decides them by INSERTING a payments row and handing the learner to a
 * gateway. Until this module there was no way to ask any of those
 * questions without spending that row: a learner who wanted to know
 * what a level costs in their own currency, or what four instalments
 * come to, or which cards the College can actually take, could only
 * find out by starting a checkout.
 *
 * Where no gateway is configured that is worse than inconvenient. The
 * create route marks the row `failed` and reports the refusal, which is
 * correct behaviour and a terrible way to learn that the College is not
 * taking cards today. So: read first, spend second — the same rule
 * `GET /api/student/booking` and `publishedProcedure()` were added for.
 *
 * ─────────────────────────────────────────────────────────────────────
 * THE THREE ARRANGEMENTS ARE THE PUBLISHED THREE
 * ─────────────────────────────────────────────────────────────────────
 * /admissions/tuition/ publishes them under "Three arrangements,
 * smallest first": four instalments of a LEVEL's fee, one level at a
 * time, or the whole programme at once. `data/tuition.json` carries
 * `instalments_per_level: 4` and says the same. So an instalment plan
 * offered here is a plan against a level — `createInstalmentPlan()`
 * will also make one against the full programme, and this module does
 * not offer that, because a checkout that offers an arrangement the fee
 * schedule does not publish is a checkout inventing a price.
 *
 * AND THE FULL PROGRAMME IS NOT DRESSED UP. Six levels at $3,166.67 sum
 * to $19,000.02 and the aggregate is charged at $19,000, so paying at
 * once is two cents cheaper. That is a rounding waiver, not a discount,
 * and the tuition page says outright that paying in full "buys no
 * discount". `fullProgramme.comparison` therefore reports `same` for
 * any difference smaller than one whole unit of the currency, and the
 * exact difference travels beside it for anyone who wants to check.
 *
 * ─────────────────────────────────────────────────────────────────────
 * IT REPORTS WHAT IS CONFIGURED, NOT WHAT IS HOPED FOR
 * ─────────────────────────────────────────────────────────────────────
 * `suggestGateway()` falls back to `['stripe']` when nothing at all is
 * configured — deliberately, because the create route needs a name to
 * attempt. Its own comment says the list exists "so the checkout UI can
 * offer real alternatives, not dead buttons", and that fallback is
 * exactly a dead button. So this module reads `configuredGateways()`,
 * which is the truth with no fallback in it, and an interface that gets
 * an empty list is expected to say the College is not taking cards
 * rather than to draw a button that answers 503.
 *
 * ─────────────────────────────────────────────────────────────────────
 * EVERY FIGURE IS `presentAmount()`, THE SAME AS THE STATEMENT
 * ─────────────────────────────────────────────────────────────────────
 * Not a private money shape. `functions/_lib/student/finance.js` already
 * produces `{usdCents, ledger:{…text}, learner:{…text, rateAsOf}}` and
 * `/my-account.html` already renders it; the checkout stands on that
 * same page and must not quote a price in a second format. It also
 * means the page does no arithmetic and no formatting here either —
 * `presentAmount()` throws on a fractional cent, and a surface that
 * formatted its own figures would step around that guard.
 *
 * Prices are integer USD cents from `programme_levels.price_usd_cents`
 * and the `full_programme_price_usd_cents` configuration — the same two
 * sources the create route reads, imported rather than restated. The
 * instalment split is `computeInstalmentAmounts()`, the same function
 * the create route charges from, so a learner is never quoted a figure
 * the payment endpoint will not take.
 */

import { db, NotFoundError } from '../db.js';
import { getConfigJson } from '../config.js';
import { getCurrency, suggestRouting } from '../currency.js';
import { presentAmount } from '../student/finance.js';
import { configuredGateways, GATEWAYS } from './router.js';
import { computeInstalmentAmounts } from './instalments.js';
import { LEVEL_NAMES_AR, LEVEL_ORDINALS_AR } from '../academic/level-names.js';
import { computeDiscountedAmount, getDiscountStackingPolicy } from './discounts.js';

/** The College's books are kept in dollars — finance.js § LEDGER_CURRENCY. */
const LEDGER_CURRENCY = 'USD';

/** The default when the College has adopted no instalment count. */
const DEFAULT_INSTALMENTS = 4;

/** A currency row, as `presentAmount()` wants to be handed one. */
function frameOf(ledgerRow, chosenRow) {
  const ledger = {
    code: LEDGER_CURRENCY,
    symbol: ledgerRow ? ledgerRow.symbol : '$',
    decimalPlaces: ledgerRow ? ledgerRow.decimal_places : 2,
  };
  // Quoting the same figure twice in the same currency is noise, not
  // transparency, so the learner frame is null where the two agree.
  if (!chosenRow || chosenRow.code === LEDGER_CURRENCY) return { ledger, learner: null };
  return {
    ledger,
    learner: {
      code: chosenRow.code,
      symbol: chosenRow.symbol,
      decimalPlaces: chosenRow.decimal_places,
      // Named for what the column HOLDS — units of this currency per one
      // dollar — because `fx_rate_to_usd` reads like its inverse and
      // something downstream would eventually invert it.
      unitsPerUsd: chosenRow.fx_rate_to_usd,
      rateAsOf: chosenRow.fx_rate_as_of || null,
      rateSource: chosenRow.fx_rate_source || null,
    },
  };
}

/**
 * What this learner may pay for, at what price, in which currency, by
 * which arrangement, and by what means.
 *
 * `country` is a suggestion and nothing more — see
 * docs/payments-architecture.md § UX. It selects a default currency; it
 * never restricts one, and every active currency is returned beside it
 * so a learner can choose the one their card is denominated in.
 */
export async function checkoutOptions(env, { user, country = null, currency: asked = null } = {}) {
  const routing = await suggestRouting(env, country);
  const code = (asked || routing.currency || LEDGER_CURRENCY).toUpperCase();
  const chosen = await getCurrency(env, code);
  if (!chosen || !chosen.is_active || chosen.fx_rate_to_usd == null) {
    // Named rather than silently swapped for dollars: a learner who
    // asked for a currency the College cannot take is owed the refusal,
    // and a page that quietly re-quoted in dollars would look like a
    // price that changed by itself.
    throw new NotFoundError(`${code} is not a currency the College can take today.`);
  }
  const ledgerRow = await getCurrency(env, LEDGER_CURRENCY);
  const frame = frameOf(ledgerRow, chosen);
  const money = (usdCents) => presentAmount(usdCents, frame);

  const { results: levels } = await db(env)
    .prepare(`SELECT id, roman, name, cefr, price_usd_cents
                FROM programme_levels ORDER BY id ASC`)
    .all();

  // What they already hold, and what they already have a plan against.
  // A checkout offering a level somebody is enrolled on is a checkout
  // taking money for nothing; a checkout offering a SECOND plan against
  // a level already on a plan is a checkout creating a duplicate the
  // ledger then has to be read carefully to untangle.
  const { results: held } = await db(env)
    .prepare(`SELECT level_id AS levelId, status FROM enrolments
               WHERE user_id = ? AND status != 'withdrawn'`)
    .bind(user.id).all();
  const heldLevels = new Map((held || []).map((r) => [r.levelId, r.status]));

  const { results: plans } = await db(env)
    .prepare(`SELECT id, level_id AS levelId, instalment_count AS instalmentCount, status
                FROM instalment_plans WHERE user_id = ? AND status = 'active'`)
    .bind(user.id).all();
  const planForLevel = new Map((plans || []).filter((p) => p.levelId != null).map((p) => [p.levelId, p]));

  const fullProgrammeUsdCents = await getConfigJson(env, 'full_programme_price_usd_cents');
  const instalmentCount = await getConfigJson(env, 'instalment_default_count', { required: false })
    ?? DEFAULT_INSTALMENTS;

  // RELIEF THE LEARNER ALREADY HOLDS, quoted into the price.
  //
  // `resolveScholarship()` is not used here: it answers null unless it
  // is handed an id, because the create route's job is to validate the
  // one a caller named. This surface has the opposite job — to find out
  // whether the College has granted this person anything at all — so it
  // reads the table. The most recent award is the one quoted; the
  // create route takes exactly one `scholarshipId`, so quoting two
  // would be quoting a price it cannot charge.
  const { results: awards } = await db(env)
    .prepare(`SELECT id, kind, value, notes FROM scholarships
               WHERE user_id = ? ORDER BY created_at DESC, id DESC`)
    .bind(user.id).all();
  const scholarship = (awards || [])[0] || null;

  // Struck by the SAME function the create route strikes it with, so a
  // learner is never quoted a figure the payment endpoint will not
  // take. Two places computing one price is how two prices appear.
  const chargeable = (usdCents) => (scholarship
    ? computeDiscountedAmount({ baseUsdCents: usdCents, promo: null, scholarship })
    : usdCents);

  const levelOptions = (levels || []).map((l) => {
    // AGAINST THE PUBLISHED FEE, deliberately. `createInstalmentPlan()`
    // strikes a plan on `programme_levels.price_usd_cents`, and the
    // create route refuses to combine a scholarship with an
    // instalmentPlanId at all — dividing relief across instalments is
    // undecided, and docs/executive-decision-brief.md records it as
    // undecided. So the four figures quoted here are the four that will
    // actually be charged, relief or no relief, and `reliefApplies`
    // says which it is rather than leaving a surface to infer it from
    // two prices that disagree.
    const amounts = computeInstalmentAmounts(l.price_usd_cents, instalmentCount);
    const plan = planForLevel.get(l.id) || null;
    const net = chargeable(l.price_usd_cents);
    return {
      levelId: l.id,
      roman: l.roman,
      name: l.name,
      // BOTH NAMES, and the page chooses. `programme_levels` holds one
      // string, so an Arabic learner used to be told mid-sentence that
      // they had paid for the "English Mastery Programme".
      nameAr: LEVEL_NAMES_AR[l.id] || null,
      ordinalAr: LEVEL_ORDINALS_AR[l.id] || null,
      cefr: l.cefr,
      // What paying in full would cost today — after any relief.
      price: money(net),
      // The published fee, and the relief taken off it. Both null where
      // there is no relief: printing "$3,166.67, reduced from $3,166.67"
      // is a page inventing a discount.
      published: net === l.price_usd_cents ? null : money(l.price_usd_cents),
      relief: net === l.price_usd_cents ? null : money(l.price_usd_cents - net),
      instalment: {
        count: instalmentCount,
        // Equal parts to the cent, remainder to the front — the College
        // absorbs the rounding rather than handing anyone a fraction of
        // a cent. Both figures are published because four instalments
        // that are not all identical is a fact, not a defect.
        amounts: amounts.map(money),
        first: money(amounts[0]),
        reliefApplies: false,
        planId: plan ? plan.id : null,
      },
      enrolment: {
        held: heldLevels.has(l.id),
        status: heldLevels.get(l.id) || null,
      },
    };
  });

  const sumOfLevels = (levels || []).reduce((n, l) => n + l.price_usd_cents, 0);
  const difference = sumOfLevels - fullProgrammeUsdCents;
  // ONE WHOLE UNIT is the threshold, and it is deliberate. The whole
  // programme is two cents under the sum of its six levels because
  // 19,000 does not divide by six and the College waives the remainder
  // — data/tuition.json § _rounding. Reporting that as a saving would
  // be the checkout contradicting the fee schedule, which states in
  // terms that paying in full buys no discount.
  const wholeUnit = 10 ** frame.ledger.decimalPlaces;
  const comparison = Math.abs(difference) < wholeUnit
    ? 'same'
    : (difference > 0 ? 'cheaper_in_full' : 'dearer_in_full');

  const gateways = configuredGateways(env);

  return {
    asAt: new Date().toISOString(),
    currency: {
      code: chosen.code,
      symbol: chosen.symbol,
      decimalPlaces: chosen.decimal_places,
      rate: chosen.code === LEDGER_CURRENCY ? null : {
        unitsPerUsd: chosen.fx_rate_to_usd,
        asOf: chosen.fx_rate_as_of || null,
        source: chosen.fx_rate_source || null,
        column: 'currencies.fx_rate_to_usd',
      },
      ledgerCurrency: frame.ledger,
      // A suggestion, and the payload says so in the field name. The
      // learner chooses; the College does not decide for them.
      suggestedFor: country ? String(country).toUpperCase() : null,
      choices: (await listChoices(env)).map((c) => ({
        code: c.code, symbol: c.symbol, decimalPlaces: c.decimal_places,
      })),
    },
    levels: levelOptions,
    fullProgramme: {
      price: money(chargeable(fullProgrammeUsdCents)),
      published: chargeable(fullProgrammeUsdCents) === fullProgrammeUsdCents
        ? null : money(fullProgrammeUsdCents),
      relief: chargeable(fullProgrammeUsdCents) === fullProgrammeUsdCents
        ? null : money(fullProgrammeUsdCents - chargeable(fullProgrammeUsdCents)),
      // Saying what the whole costs against the sum of its parts is the
      // one comparison a person actually makes here, and leaving them
      // to add six figures up is how a College looks like it would
      // rather they did not.
      sumOfLevels: money(sumOfLevels),
      difference: money(Math.abs(difference)),
      comparison,
      unlockMode: await getConfigJson(env, 'full_programme_unlock_mode', { required: false }) || 'progressive',
    },
    instalments: {
      count: instalmentCount,
      // Per LEVEL, which is what the fee schedule publishes. The
      // absence of a charge is stated rather than left to be inferred
      // from silence.
      appliesTo: 'level',
      surcharge: money(0),
    },
    scholarship: scholarship
      ? {
        id: scholarship.id,
        kind: scholarship.kind,
        value: scholarship.value ?? null,
        // The caller must send this id back on the checkout, or the
        // create route will charge the published fee and the learner
        // will have been quoted a price the College did not take.
        sendAsScholarshipId: scholarship.id,
        // Stated rather than left to be worked out from two prices: an
        // instalment plan is struck on the published fee and the create
        // route will not discount one.
        appliesToInstalments: false,
        held: (awards || []).length,
      }
      : null,
    discountPolicy: await getDiscountStackingPolicy(env),
    payment: {
      // THE HONEST LIST. Empty means the College cannot take a card
      // today, and an interface that draws a button anyway is drawing
      // one that answers 503.
      configured: gateways,
      known: Object.keys(GATEWAYS),
      suggested: gateways.includes(routing.gateways[0])
        ? routing.gateways[0]
        : (gateways[0] || null),
    },
  };
}

async function listChoices(env) {
  const { results } = await db(env)
    .prepare(`SELECT code, symbol, decimal_places FROM currencies
               WHERE is_active = 1 AND fx_rate_to_usd IS NOT NULL ORDER BY code ASC`)
    .all();
  return results || [];
}
