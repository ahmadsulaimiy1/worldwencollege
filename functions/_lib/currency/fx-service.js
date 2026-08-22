// Orchestrates updating `currencies.fx_rate_to_usd`, split deliberately
// into a pure, DB-only half (applyRates — trivially testable without a
// network call) and a provider-calling half (refreshFromLiveFeed) —
// the same reason webhook-handler.js's DB logic is separated from its
// HTTP wrapper. Neither function ever flips `is_active` implicitly: a
// rate existing is not the same decision as offering that currency at
// checkout, so activation always needs an explicit `activate: true`.

import { db, nowIso, NotFoundError, ValidationError } from '../db.js';
import { frankfurterAdapter } from './frankfurter-adapter.js';

// rates: { [code]: numberOfCodeUnitsPerUsd }. Only codes that already
// exist in `currencies` are written — an unknown code is reported back
// as skipped, never silently inserted as a new row (currency rows are
// seed data, not something an API call should be able to create).
export async function applyRates(env, { rates, source, updatedBy = null }) {
  const updated = [];
  const skipped = [];
  const asOf = nowIso();
  for (const [code, rate] of Object.entries(rates)) {
    if (typeof rate !== 'number' || !Number.isFinite(rate) || rate <= 0) {
      skipped.push(code);
      continue;
    }
    const result = await db(env)
      .prepare('UPDATE currencies SET fx_rate_to_usd = ?, fx_rate_source = ?, fx_rate_as_of = ? WHERE code = ?')
      .bind(rate, source, asOf, code)
      .run();
    (result.meta.changes > 0 ? updated : skipped).push(code);
  }
  return { updated, skipped };
}

// Fetches real rates for the requested codes from the configured live
// provider and applies them. `codes` is always explicit — no implicit
// "whichever currencies are currently active" scope, so a staff member
// always knows exactly what a given call did.
export async function refreshFromLiveFeed(env, { codes, provider = frankfurterAdapter, updatedBy = null }) {
  if (!Array.isArray(codes) || codes.length === 0) {
    throw new ValidationError('codes must be a non-empty array of currency codes.', { codes: 'Required' });
  }
  const rates = await provider.getRates(env, { base: 'USD', targets: codes });
  const { updated, skipped } = await applyRates(env, { rates, source: 'live_feed', updatedBy });
  const notReturnedByProvider = codes.filter((c) => !(c in rates));
  return { updated, skipped, notReturnedByProvider };
}

// A staff-set rate WEC has deliberately chosen not to float with
// daily FX (common for tuition pricing) — see docs/payments-architecture.md
// § Multi-currency.
export async function setPolicyFixedRate(env, { code, rateToUsd, updatedBy = null, activate = false }) {
  if (typeof rateToUsd !== 'number' || !Number.isFinite(rateToUsd) || rateToUsd <= 0) {
    throw new ValidationError('rateToUsd must be a positive number.', { rateToUsd: 'Invalid' });
  }
  const existing = await db(env).prepare('SELECT code FROM currencies WHERE code = ?').bind(code).first();
  if (!existing) throw new NotFoundError(`Unknown currency code "${code}".`);

  const { updated } = await applyRates(env, { rates: { [code]: rateToUsd }, source: 'policy_fixed', updatedBy });
  if (activate) {
    await db(env).prepare('UPDATE currencies SET is_active = 1 WHERE code = ?').bind(code).run();
  }
  return { code, rateToUsd, activated: activate, updated: updated.includes(code) };
}
