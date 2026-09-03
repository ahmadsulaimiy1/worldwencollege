// Currency is entirely config-driven from the `currencies` table — no
// currency code, symbol, or exchange rate is hardcoded in application
// logic. Adding a currency later means an UPDATE/INSERT against this
// table, never a code change or redeploy.
//
// IMPORTANT: a currency is only ever offered at checkout when
// is_active=1 AND fx_rate_to_usd IS NOT NULL. Both must be set
// deliberately — see sql/schema.sql's seed data, which activates only
// USD today. Nothing in this file invents an exchange rate.

import { db } from './db.js';

export async function listActiveCurrencies(env) {
  const { results } = await db(env)
    .prepare('SELECT code, symbol, decimal_places, fx_rate_to_usd FROM currencies WHERE is_active = 1 AND fx_rate_to_usd IS NOT NULL')
    .all();
  return results;
}

export async function getCurrency(env, code) {
  return db(env).prepare('SELECT * FROM currencies WHERE code = ?').bind(code).first();
}

/** USD has two decimal places, and the ledger is denominated in it. */
const LEDGER_DECIMAL_PLACES = 2;

/**
 * USD cents → another currency's minor unit. Pure, so the one caller
 * that converts thirty figures off one rate can use it without thirty
 * round trips to the database (functions/_lib/student/finance.js).
 *
 * THE DECIMAL PLACES ARE AN ARGUMENT BECAUSE THEY WERE AN ASSUMPTION.
 *
 * `fx_rate_to_usd` holds units of the target currency per one US
 * dollar, despite its name. Multiplying USD *cents* by it therefore
 * gives hundredths of a unit of the target — which are its minor units
 * only when the target has two decimal places, and this file used to
 * return that product as though every currency did.
 *
 * `currencies` already disagrees with that in its own seed data: KWD is
 * seeded with `decimal_places = 3` and would have come out ten times
 * too small the day anyone activated it, on a statement, an invoice and
 * a checkout charge simultaneously. A zero-decimal currency such as JPY
 * would have come out a hundred times too large. Neither would have
 * been caught by a test, because only USD and NGN — both two-place —
 * have ever been converted.
 *
 * The scale below is 1 for every two-place currency, so no figure the
 * College has ever charged moves.
 */
export function usdCentsToMinorUnits(amountUsdCents, unitsPerUsd, decimalPlaces) {
  if (!Number.isInteger(decimalPlaces) || decimalPlaces < 0) {
    throw new Error(`A conversion needs the target currency's decimal places; got ${decimalPlaces}.`);
  }
  return Math.round(amountUsdCents * unitsPerUsd * 10 ** (decimalPlaces - LEDGER_DECIMAL_PLACES));
}

// Converts a USD-cents amount into another currency's minor unit,
// using the policy/feed rate stored in the database — never a rate
// computed or guessed here.
export async function convertFromUsdCents(env, amountUsdCents, targetCurrencyCode) {
  if (targetCurrencyCode === 'USD') return amountUsdCents;
  const currency = await getCurrency(env, targetCurrencyCode);
  if (!currency || !currency.is_active || currency.fx_rate_to_usd == null) {
    throw new Error(`Currency ${targetCurrencyCode} is not active or has no configured rate — cannot offer it at checkout.`);
  }
  return usdCentsToMinorUnits(amountUsdCents, currency.fx_rate_to_usd, currency.decimal_places);
}

// Suggests (never forces) a currency + gateway order for a given
// country, falling back to USD/Stripe when the country has no routing
// row or its suggested currency isn't actually active yet. The caller
// (the checkout endpoint) always still lets the student choose any
// active currency — see docs/payments-architecture.md § UX.
export async function suggestRouting(env, countryCode) {
  const fallback = { currency: 'USD', gateways: ['stripe'] };
  if (!countryCode) return fallback;

  const row = await db(env)
    .prepare('SELECT default_currency, preferred_gateways FROM country_payment_routing WHERE country_code = ?')
    .bind(countryCode.toUpperCase())
    .first();
  if (!row) return fallback;

  const currency = await getCurrency(env, row.default_currency);
  const currencyIsUsable = currency && currency.is_active && currency.fx_rate_to_usd != null;

  return {
    currency: currencyIsUsable ? row.default_currency : 'USD',
    gateways: JSON.parse(row.preferred_gateways),
  };
}

export function formatMinorUnits(amountMinor, decimalPlaces) {
  return (amountMinor / 10 ** decimalPlaces).toFixed(decimalPlaces);
}
