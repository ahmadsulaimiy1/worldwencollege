// Run with: node --experimental-sqlite tests/currency-fx.test.mjs
// Covers Executive Decision #2 (configurable multi-currency FX
// service) — the DB-writing half of functions/_lib/currency/fx-service.js
// is exercised directly against a real SQLite engine; the live-feed
// half is exercised with a stub provider (no real network call is
// made or needed to prove the orchestration logic is correct — see
// frankfurter-adapter.js's header for why the adapter itself can't be
// tested against a live endpoint from this environment).
import { readFileSync } from 'node:fs';
import { makeD1 } from './d1-shim.mjs';
import { ROOT, loadUrl } from './helpers.mjs';

const schema = readFileSync(`${ROOT}/sql/schema.sql`, 'utf8');
const env = { DB: makeD1(schema) };
const db = env.DB;

const { applyRates, refreshFromLiveFeed, setPolicyFixedRate } = await import(loadUrl('functions/_lib/currency/fx-service.js'));
const { NotFoundError, ValidationError } = await import(loadUrl('functions/_lib/db.js'));
const { onRequestPost: setRateEndpoint } = await import(loadUrl('functions/api/admin/currency/set-rate.js'));
const { onRequestPost: refreshRatesEndpoint } = await import(loadUrl('functions/api/admin/currency/refresh-rates.js'));

let pass = 0, fail = 0;
function check(label, cond) { console.log((cond ? 'PASS ' : 'FAIL ') + label); cond ? pass++ : fail++; }

function getCurrency(code) {
  return db.prepare('SELECT * FROM currencies WHERE code = ?').bind(code).first();
}

// --- Seed sanity: nothing but USD starts active/rated ---
check('seed: GBP starts inactive with no rate (no fabricated FX)', getCurrency('GBP').is_active === 0 && getCurrency('GBP').fx_rate_to_usd === null);

// --- applyRates: pure DB-writing logic ---
{
  const { updated, skipped } = await applyRates(env, { rates: { GBP: 0.79, ZZZ: 1.5 }, source: 'live_feed' });
  check('applyRates: known code is updated', updated.includes('GBP'));
  check('applyRates: unknown code is skipped, not inserted', skipped.includes('ZZZ'));
  check('applyRates: rate/source/as_of are written', getCurrency('GBP').fx_rate_to_usd === 0.79 && getCurrency('GBP').fx_rate_source === 'live_feed' && getCurrency('GBP').fx_rate_as_of != null);
  check('applyRates: does NOT activate the currency', getCurrency('GBP').is_active === 0);

  const { skipped: badSkipped } = await applyRates(env, { rates: { NGN: -5, SAR: 'not-a-number' }, source: 'live_feed' });
  check('applyRates: a negative rate is rejected, not written', badSkipped.includes('NGN') && getCurrency('NGN').fx_rate_to_usd === null);
  check('applyRates: a non-numeric rate is rejected, not written', badSkipped.includes('SAR') && getCurrency('SAR').fx_rate_to_usd === null);
}

// --- refreshFromLiveFeed: stub provider, no real network call ---
{
  const stubProvider = { async getRates(_env, { targets }) {
    // Simulates Frankfurter's real, documented limitation: GBP is
    // covered by ECB reference rates, NGN/SAR/AED/QAR/KWD are not.
    const rates = {};
    if (targets.includes('GBP')) rates.GBP = 0.8;
    return rates;
  } };
  const result = await refreshFromLiveFeed(env, { codes: ['GBP', 'NGN'], provider: stubProvider });
  check('refreshFromLiveFeed: GBP updated from the (stub) live feed', result.updated.includes('GBP') && getCurrency('GBP').fx_rate_to_usd === 0.8);
  check('refreshFromLiveFeed: NGN reported as not covered by the provider, not fabricated', result.notReturnedByProvider.includes('NGN') && getCurrency('NGN').fx_rate_to_usd === null);

  check('refreshFromLiveFeed: empty codes array throws ValidationError', await (async () => {
    try { await refreshFromLiveFeed(env, { codes: [], provider: stubProvider }); return false; } catch (e) { return e instanceof ValidationError; }
  })());
}

// --- setPolicyFixedRate ---
{
  const result = await setPolicyFixedRate(env, { code: 'AED', rateToUsd: 3.67, activate: true, updatedBy: 'usr_staff' });
  check('setPolicyFixedRate: returns the applied rate', result.rateToUsd === 3.67 && result.activated === true);
  check('setPolicyFixedRate: writes policy_fixed source', getCurrency('AED').fx_rate_source === 'policy_fixed');
  check('setPolicyFixedRate: activates when requested', getCurrency('AED').is_active === 1);

  check('setPolicyFixedRate: unknown currency code throws NotFoundError', await (async () => {
    try { await setPolicyFixedRate(env, { code: 'ZZZ', rateToUsd: 1 }); return false; } catch (e) { return e instanceof NotFoundError; }
  })());
  check('setPolicyFixedRate: non-positive rate throws ValidationError', await (async () => {
    try { await setPolicyFixedRate(env, { code: 'QAR', rateToUsd: 0 }); return false; } catch (e) { return e instanceof ValidationError; }
  })());

  const activatedRow = await db.prepare(`SELECT * FROM currencies WHERE code = 'AED'`).first();
  check('setPolicyFixedRate: a currency activated this way is now usable at checkout (is_active + a rate both set)', activatedRow.is_active === 1 && activatedRow.fx_rate_to_usd != null);
}

// --- Authorization boundary: both admin endpoints require auth ---
const noAuthSetRateReq = new Request('http://x/api/admin/currency/set-rate', { method: 'POST', body: JSON.stringify({ code: 'GBP', rateToUsd: 0.79 }) });
check('set-rate endpoint: no Authorization header -> 401', (await setRateEndpoint({ request: noAuthSetRateReq, env })).status === 401);

const noAuthRefreshReq = new Request('http://x/api/admin/currency/refresh-rates', { method: 'POST', body: JSON.stringify({ codes: ['GBP'] }) });
check('refresh-rates endpoint: no Authorization header -> 401', (await refreshRatesEndpoint({ request: noAuthRefreshReq, env })).status === 401);

console.log(`\n${pass} passed, ${fail} failed.`);
process.exit(fail ? 1 : 0);
