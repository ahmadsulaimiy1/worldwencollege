/**
 * THE TEN-YEAR PROJECTION under any pricing architecture.
 *
 * ────────────────────────────────────────────────────────────────────
 * WHY THIS EXISTS BESIDE masterplan.mjs RATHER THAN INSIDE IT
 * ────────────────────────────────────────────────────────────────────
 * masterplan.mjs models the College at ONE price for everything, which
 * is what the adopted tariff is. It cannot express a portfolio, and
 * bending it into one would have meant a single file that computes two
 * different institutions depending on a flag — the shape of code that
 * quietly produces the wrong one.
 *
 * This file builds the decade out of the portfolio in pricing.mjs, and
 * it can run the adopted architecture too, by handing it a portfolio in
 * which every product is the same flat fee. That is how the three
 * architectures below are compared on one basis rather than on three.
 *
 * ────────────────────────────────────────────────────────────────────
 * WHAT MAKES A DECADE DIFFERENT FROM A STEADY STATE
 * ────────────────────────────────────────────────────────────────────
 * Three things, and all three are modelled rather than assumed away:
 *
 *   REACH RAMPS. A College with no cohort cannot put a considered
 *   proposition in front of its whole addressable audience in Year 1.
 *   Reach is driven by the acquisition budget and by which markets have
 *   opened, and it arrives at full only in the second half of the plan.
 *
 *   ALUMNI COMPOUND. Every award-holder lowers the cost of the next
 *   acquisition. By Year 10 this is worth more than any margin the
 *   College could have taken by charging more earlier, and it is the
 *   strongest argument in the model for scale over extraction.
 *
 *   CAPACITY BINDS. Learners the College cannot teach are recorded as
 *   turned away, never booked. A projection that ignores this is a
 *   projection of a spreadsheet, not of an institution.
 */

import { PLAN } from './masterplan.mjs';
import * as P from './pricing.mjs';

const round = (n, d = 0) => { const f = 10 ** d; return Math.round((Number(n) || 0) * f) / f; };

/** Reach available in a year: budget, markets open, and alumni pull. */
function reachFor(y, alumni, budgetByYear) {
  const budget = budgetByYear[y];
  const maxBudget = Math.max(...budgetByYear);
  const spendReach = budget / maxBudget;
  // Markets open over the first four years; each opening adds audience.
  const open = PLAN.market.regions.filter((r) => r.opens_year <= y + 1).length;
  const marketReach = open / PLAN.market.regions.length;
  // Alumni lower the cost of being found. Capped, because word of mouth
  // is a discount on acquisition and never a substitute for it.
  const alumniPull = Math.min(0.34, alumni / 26000);
  return Math.min(1, spendReach * marketReach * (1 + alumniPull));
}

/**
 * Ten years under one architecture.
 * `prices` is a portfolio: { directed, tutored, execCore, execPremium, execBespoke }
 */
export function project(prices, opts = {}) {
  const {
    label = 'Core',
    continuationScale = 1,
    reachMultiplier = 1,
    cacMultiplier = 1,
    fixedFloor = 620000,
    fixedAtScale = P.FIXED_INSTITUTIONAL,
  } = opts;

  const budgets = PLAN.acquisition_budget_usd.by_year;
  const years = [];
  let alumni = 0;
  let cumSurplus = 0;
  let cumRevenue = 0;
  let reserve = 0;
  let instructors = 0;

  for (let y = 0; y < PLAN.planning_period.years; y++) {
    const reach = reachFor(y, alumni, budgets) * reachMultiplier;
    // Fixed institutional cost grows from a founding floor toward the
    // steady-state establishment as the College actually builds it.
    const fixed = fixedFloor + (fixedAtScale - fixedFloor) * Math.min(1, (y + 1) / 7);

    const snap = P.portfolio(prices, { continuationScale, reachScale: reach, fixed });

    // ── Acquisition is bounded by the budget actually available ──────
    const wantSpend = snap.acquisition * cacMultiplier;
    const budget = budgets[y];
    const afford = wantSpend > 0 ? Math.min(1, budget / wantSpend) : 1;

    // ── And by the instructors the College can put in front of them ──
    const taughtLearners = (snap.byProduct.tutored?.learners || 0)
      + (snap.byProduct.execCore?.learners || 0)
      + (snap.byProduct.execPremium?.learners || 0)
      + (snap.byProduct.execBespoke?.learners || 0)
      + (snap.byProduct.directed?.learners || 0) * 0.34; // directed group time is real teaching
    const caseload = 26;
    const want = Math.ceil((taughtLearners * afford) / caseload);
    instructors = Math.max(instructors, Math.min(want, instructors + Math.ceil(instructors * 0.4) + 3));
    const capacityFactor = want > 0 ? Math.min(1, (instructors * caseload) / (taughtLearners * afford)) : 1;

    const scale = afford * capacityFactor;
    const newLearners = snap.learners * scale;
    const revenue = snap.revenue * scale;
    const delivery = snap.delivery * scale;
    const acquisition = Math.min(budget, wantSpend * scale);
    const surplus = revenue - delivery - acquisition - fixed;

    alumni += snap.awardsToC2 * scale * 2.7; // awards at every level, not only C2
    cumRevenue += revenue;
    cumSurplus += surplus;
    reserve = Math.max(0, reserve + (surplus > 0 ? surplus * PLAN.reserve.contribution_share_of_surplus : surplus));

    years.push({
      year: y + 1,
      calendar: PLAN.planning_period.first_year + y,
      reach: round(reach, 3),
      newLearners: round(newLearners),
      activeLearners: round(newLearners * 1.9),
      awardsToC2: round(snap.awardsToC2 * scale),
      totalAwards: round(snap.awardsToC2 * scale * 2.7),
      instructors,
      turnedAwayByCapacity: round(snap.learners * afford * (1 - capacityFactor)),
      revenue: round(revenue),
      delivery: round(delivery),
      acquisition: round(acquisition),
      fixed: round(fixed),
      surplus: round(surplus),
      margin: revenue > 0 ? round(surplus / revenue, 4) : 0,
      cumulativeRevenue: round(cumRevenue),
      cumulativeSurplus: round(cumSurplus),
      reserve: round(reserve),
      revenuePerLearner: newLearners > 0 ? round(revenue / newLearners) : 0,
      byProduct: Object.fromEntries(Object.entries(snap.byProduct).map(([k, v]) => [k, round(v.learners * scale)])),
    });
  }

  return {
    label,
    prices,
    years,
    totals: {
      revenue: round(years.reduce((a, b) => a + b.revenue, 0)),
      delivery: round(years.reduce((a, b) => a + b.delivery, 0)),
      acquisition: round(years.reduce((a, b) => a + b.acquisition, 0)),
      fixed: round(years.reduce((a, b) => a + b.fixed, 0)),
      surplus: round(years.reduce((a, b) => a + b.surplus, 0)),
      newLearners: round(years.reduce((a, b) => a + b.newLearners, 0)),
      awards: round(years.reduce((a, b) => a + b.totalAwards, 0)),
      y10Revenue: years[years.length - 1].revenue,
      y10Active: years[years.length - 1].activeLearners,
      y10New: years[years.length - 1].newLearners,
      reserve: years[years.length - 1].reserve,
    },
  };
}

/** The three architectures, on one basis. */
export function architectures() {
  // The adopted tariff, read from the College's own record rather than
  // restated — the whole point of comparing against it is that it is a
  // fact about the institution and not a number in this file.
  const adoptedFlat = P.B.programmeTotal;
  const AA = PLAN.alternative_architecture_a;
  return {
    proposed: project(P.PROPOSED.committed, { label: 'Proposed portfolio' }),
    adopted: project({
      directed: adoptedFlat, tutored: adoptedFlat,
      execCore: adoptedFlat, execPremium: adoptedFlat, execBespoke: adoptedFlat,
    }, { label: `Adopted flat $${adoptedFlat.toLocaleString()}` }),
    briefA: project({
      directed: AA.directed_total_usd, tutored: AA.tutored_total_usd,
      execCore: AA.tutored_total_usd, execPremium: AA.tutored_total_usd, execBespoke: AA.tutored_total_usd,
    }, { label: `Brief A — $${AA.directed_total_usd.toLocaleString()} / $${AA.tutored_total_usd.toLocaleString()}` }),
  };
}

/** Conservative / Core / High-growth under the proposed architecture. */
export function scenarios() {
  return {
    conservative: project(P.PROPOSED.committed, {
      label: 'Conservative', continuationScale: 0.88, reachMultiplier: 0.74, cacMultiplier: 1.26,
    }),
    core: project(P.PROPOSED.committed, { label: 'Core Management Plan' }),
    growth: project(P.PROPOSED.committed, {
      label: 'High Growth', continuationScale: 1.09, reachMultiplier: 1.28, cacMultiplier: 0.86,
    }),
  };
}
