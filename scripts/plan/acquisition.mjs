/**
 * WHAT A LEARNER COSTS TO FIND, AND WHEN THE COLLEGE HAS IT BACK.
 *
 * The acquisition model the owner asked for: channel -> cost of an
 * enquiry -> conversion -> cost of an enrolment -> payback. Every figure
 * is read from a completed run, never typed: spend is what the plan
 * decides to spend, the cost of an enquiry rises as a market is pushed
 * past its reference spend, and the enrolments are those the funnel and
 * the College's capacity actually admitted.
 *
 * Payback is counted in LEVELS, the unit a learner pays in: how many
 * levels of a learner's fee, after the cost of teaching and assessing
 * them and of collecting the fee, it takes to recover what was spent to
 * find them.
 */
import { MARKETS, PROGRESSION, MARKET_KEYS, ROUTE_KEYS, LEVELS, val } from './record.mjs';

const sum = (xs) => xs.reduce((t, x) => t + x, 0);

/**
 * The number of levels a learner who enters at a given level can be
 * expected to study, from the plan's completion and continuation rates.
 */
export function expectedLevels(entryLevel) {
  const completion = val(PROGRESSION.completion);
  const continuation = val(PROGRESSION.continuation);
  let reach = 1; let total = 0;
  for (let L = entryLevel; L < LEVELS; L++) {
    total += reach;
    if (L < LEVELS - 1) reach *= completion[L] * continuation[L];
  }
  return total;
}

/** Expected levels for a new learner at maturity, across entry levels. */
export function levelsPerLearner() {
  const w = val(PROGRESSION.entryLevel);
  return sum(w.map((p, L) => p * expectedLevels(L))) / sum(w);
}

/**
 * The acquisition economics of each retail market, from a solved plan.
 * @param S  the result of price.solve()
 */
export function acquisition(S) {
  const { tariff, buildUp: b, result } = S;
  const rows = result.rows;
  const levels = levelsPerLearner();
  // What one level of each route leaves after teaching, assessment and
  // collection, in first-year prices.
  const perLevel = Object.fromEntries(ROUTE_KEYS.map((r) => [r,
    tariff[r] * (1 - b.collect) - (b.own[r] ? b.own[r].usd : 0)]));

  const markets = MARKET_KEYS.map((m) => {
    const M = MARKETS.markets[m];
    const mix = val(M.routes) || {};
    const shares = Object.entries(mix);
    if (!shares.length) {
      return { key: m, name: M.name, retail: false };
    }
    const mixSum = sum(shares.map(([, s]) => s));
    const contribution = sum(shares.map(([r, s]) => (s / mixSum) * perLevel[r]));
    // Spend in a term produces the enrolments of the term after.
    let spend = 0; let enrolled = 0; let enquiries = 0;
    const byYear = {};
    rows.forEach((r, t) => {
      const next = rows[t + 1];
      const n = next ? sum(Object.values((next.newBy || {})[m] || {})) : 0;
      if (!next || !(r.spendBy[m] > 0)) return;
      spend += r.spendBy[m]; enrolled += n; enquiries += r.enquiriesBy[m];
      const y = byYear[r.year] || (byYear[r.year] = { spend: 0, enquiries: 0, enrolled: 0 });
      y.spend += r.spendBy[m]; y.enquiries += r.enquiriesBy[m]; y.enrolled += n;
    });
    const cac = enrolled ? spend / enrolled : null;
    // The spend at which the LAST dollar still pays back inside a
    // learner's first level: past its reference spend a market's cost per
    // enquiry rises with spend at the saturation exponent, so the marginal
    // cost of an enrolment is the average divided by (1 - exponent).
    const sat = val(MARKETS.funnel.saturation);
    const yieldShare = val(MARKETS.funnel.enquiryToApplication) * val(MARKETS.funnel.applicationToPlacement)
      * val(MARKETS.funnel.placementToOffer) * val(MARKETS.funnel.offerToEnrolment);
    const base = val(M.costPerEnquiryUsd) / yieldShare;
    const ceilingSpend = val(M.referenceSpendUsd)
      * Math.pow(Math.max(1, (contribution * (1 - sat)) / base), 1 / sat);
    const plannedMax = Math.max(...Object.values(val(M.spendUsd)));
    return {
      key: m, name: M.name, retail: true,
      spend, enquiries, enrolled,
      costPerEnquiry: enquiries ? spend / enquiries : null,
      conversion: enquiries ? enrolled / enquiries : null,
      cac,
      contributionPerLevel: contribution,
      paybackLevels: cac && contribution > 0 ? cac / contribution : null,
      lifetimeToCac: cac ? (contribution * levels) / cac : null,
      ceilingSpend, plannedMax, withinCeiling: plannedMax <= ceilingSpend,
      byYear: Object.entries(byYear).map(([year, v]) => ({
        year: Number(year), ...v, cac: v.enrolled ? v.spend / v.enrolled : null,
      })),
    };
  });
  return { levelsPerLearner: levels, perLevel, markets };
}
