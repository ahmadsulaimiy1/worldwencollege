/**
 * WHAT HAPPENS IF THE PLAN IS WRONG.
 *
 * Each named shock in data/plan/scenarios.json is run through the whole
 * model at the central tariff — the price the College publishes does not
 * move because a year goes badly — and read for what a Board needs: the
 * capital the College would then need, how deep and how late the trough
 * falls, when the College first earns a surplus, and whether the tenth
 * year still passes the plan's own test.
 */
import { SCENARIOS, POLICY, val } from './record.mjs';
import { run, years } from './engine.mjs';
import { capital } from './capital.mjs';

/** Settings the capital module reads rather than the engine. */
const CAPITAL_KEYS = new Set(['trancheDelayTerms']);

/** Combine several shocks into one set of settings. Scales multiply,
 *  shifts and delays add, and per-market delays merge. */
export function combine(sets) {
  const out = {};
  for (const set of sets) {
    for (const [k, v] of Object.entries(set)) {
      if (/Scale$/.test(k)) out[k] = (out[k] ?? 1) * v;
      else if (k === 'marketDelayTerms') {
        out[k] = { ...(out[k] || {}) };
        for (const [m, d] of Object.entries(v)) out[k][m] = (out[k][m] || 0) + d;
      } else if (typeof v === 'number') out[k] = (out[k] || 0) + v;
      else out[k] = v;
    }
  }
  return out;
}

/** The figures a Board reads from one run. */
export const GRADES = {
  reserve: 'Capital returnable and the reserve at target by the tenth year',
  returned: 'Capital returnable by the tenth year; the reserve drawn below target',
  short: 'Capital not yet returnable by the tenth year',
};

export function outcome(result, set = {}) {
  const runSet = {}; const capSet = {};
  for (const [k, v] of Object.entries(set)) (CAPITAL_KEYS.has(k) ? capSet : runSet)[k] = v;
  const K = capital(result, capSet);
  const Y = years(result);
  const last = Y[Y.length - 1];
  const reserveTarget = (last.costs / 12) * val(POLICY.reserve.targetMonths);
  const firstSurplus = Y.find((y) => y.surplus > 0);
  // The year the founding capital could be returned in full: inside the
  // plan where it can be read, or beyond it at the tenth year's rate.
  const inside = Y.find((y) => y.cumulative >= 0);
  const returnYear = inside ? { year: inside.year, beyond: false }
    : last.cashflow > 0 && -last.cumulative / last.cashflow <= 10
      ? { year: last.year + Math.ceil(-last.cumulative / last.cashflow), beyond: true }
      : { year: null, beyond: true };
  // Three outcomes, in the order a Board cares about them.
  const grade = last.cumulative >= reserveTarget ? 'reserve'
    : last.cumulative >= 0 ? 'returned' : 'short';
  return {
    grade,
    capital: K.requirement,
    trough: K.trough,
    lowestHeadroom: K.lowest,
    firstSurplusYear: firstSurplus ? firstSurplus.year : null,
    returnYear,
    cumulative: last.cumulative,
    reserveTarget,
    passes: last.cumulative >= reserveTarget,
    learners: last.activeEnd,
    revenue: last.revenue.net,
    staff: last.staff,
  };
}

/**
 * Run every shock and every combination at the central tariff.
 * @param S  the result of price.solve()
 */
export function scenarios(S) {
  const central = outcome(S.result);
  const one = (key, name, s, set, extra = {}) => {
    const runSet = Object.fromEntries(Object.entries(set).filter(([k]) => !CAPITAL_KEYS.has(k)));
    const o = outcome(run(S.tariff, runSet), set);
    return {
      key, name, s, ...extra, set, ...o,
      capitalDelta: o.capital - central.capital,
      cumulativeDelta: o.cumulative - central.cumulative,
    };
  };
  const shocks = Object.entries(SCENARIOS.shocks).map(([k, v]) =>
    one(k, v.name, v.s, v.set, { warning: v.warning, response: v.response }));
  const combined = Object.entries(SCENARIOS.combined).map(([k, v]) =>
    one(k, v.name, v.s, combine(v.shocks.map((x) => SCENARIOS.shocks[x].set)), { shocks: v.shocks, response: v.response }));
  return { central, shocks, combined };
}
