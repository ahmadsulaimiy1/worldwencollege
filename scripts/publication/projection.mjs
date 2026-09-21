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
import * as PF from './portfolio.mjs';

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
 * `prices` is a portfolio keyed by delivery specification:
 * { independent, directed, tutored, execCore, execPremium, execBespoke }
 *
 * `regional: true` prices every market at its OWN published tariff and
 * books no demand at all for a route that market does not carry — see
 * portfolio.mjs § segmentTariff. It is what the proposed architecture
 * is; the adopted flat fee and Alternative A are single global prices
 * by definition, which is the difference the comparison exists to
 * show, so they are projected without it.
 */
export function project(prices, opts = {}) {
  const {
    label = 'Core',
    continuationScale = 1,
    reachMultiplier = 1,
    cacMultiplier = 1,
    regional = false,
  } = opts;
  /* Computed once rather than per year: the tariff a segment faces and
     the regions an agreement is signed in do not change with the
     calendar. */
  const tariffTable = regional ? PF.segmentTariff(PF.REFERENCE_TARIFF) : null;
  const tariffOf = tariffTable ? (k) => tariffTable[k] : null;
  const placement = regional ? PF.agreementPlacement(PF.REFERENCE_TARIFF, P.CHANNELS) : null;

  const budgets = PLAN.acquisition_budget_usd.by_year;
  const productiveHours = P.CONTRACTED_HOURS * P.PRODUCTIVE_FRACTION;
  const years = [];
  let alumni = 0;
  let cumSurplus = 0;
  let cumRevenue = 0;
  let reserve = 0;
  let instructors = 0;
  let prevNew = 0;
  let prevProgression = null;
  /* Teaching, revenue and cost carried into this year by the cohort
     admitted last year, which is halfway through its pathway and has
     not stopped needing an instructor merely because the year ended. */
  let carried = { revenue: 0, delivery: 0, hours: 0, awards: 0, c2: 0 };
  let carriedRegion = {};

  for (let y = 0; y < PLAN.planning_period.years; y++) {
    const reach = reachFor(y, alumni, budgets) * reachMultiplier;
    // Fixed institutional cost is read from the establishment itself,
    // which is why it steps at Year 2 rather than ramping: that is when
    // the Director of Academic Standards and the External Examiner take
    // up post. An invented ramp here would be a smoothing of the plan’s
    // own hiring decisions, and it would hide the year the cost lands.
    const fixed = P.fixedEstablishment(y + 1);

    const snap = P.portfolio(prices, {
      continuationScale, reachScale: reach, fixed, tariffOf, placement, planYear: y + 1,
    });
    const lag0 = snap.byLag[0];
    const lag1 = snap.byLag[1];

    // ── Acquisition is bounded by the budget actually available ──────
    const wantSpend = snap.acquisition * cacMultiplier;
    const budget = budgets[y];
    const afford = wantSpend > 0 ? Math.min(1, budget / wantSpend) : 1;

    // ── And by the instructors the College can put in front of them ──
    /* NOT A CASELOAD. This used to divide taught learners by 26, with
       Directed counted at 0.34 of a learner because "group time is real
       teaching". Both numbers were typed, and a capacity constraint
       invented at the keyboard is not a constraint — it is whatever the
       author needed it to be.

       The College publishes what each product buys: tutorial hours,
       group hours at a stated group size, pieces of produced work and
       the hours they take to read. pricing.mjs adds those up. An
       instructor has CONTRACTED_HOURS a year of which PRODUCTIVE_FRACTION
       reaches a learner. Dividing one by the other gives the
       establishment the timetable actually requires, and it moves when
       the product specification moves, which is the point.

       Last year’s cohort is served FIRST. A College that admits a new
       class while its continuing students go untaught has not managed a
       capacity constraint; it has broken a promise. */
    const wantHours = carried.hours + lag0.hours * afford;
    const want = Math.ceil(wantHours / productiveHours);
    instructors = Math.max(instructors, Math.min(want, instructors + Math.ceil(instructors * 0.4) + 3));
    const freeHours = Math.max(0, instructors * productiveHours - carried.hours);
    const capacityFactor = lag0.hours * afford > 0
      ? Math.min(1, freeHours / (lag0.hours * afford))
      : 1;

    const scale = afford * capacityFactor;
    const newLearners = snap.learners * scale;

    // ── Recognised in the year it is taught, not the year it is sold ─
    /* LAST year's second teaching year, captured before this year's
       replaces it. `carried` is read here and reassigned further down,
       which is correct; the regional carry was read AFTER its own
       reassignment, so every market booked its whole programme value
       in the admission year and the four markets summed $5.2M above
       the decade they are a decomposition of. */
    const prevRegion = carriedRegion;
    const revenue = carried.revenue + lag0.revenue * scale;
    const delivery = carried.delivery + lag0.delivery * scale;
    const acquisition = Math.min(budget, wantSpend * scale);
    const refunds = revenue * P.REFUND_RATE;
    const netTuition = revenue - refunds;
    const development = netTuition * P.DEVELOPMENT_SHARE;
    const surplus = netTuition - delivery - acquisition - fixed - development;

    /* An award is conferred at the end of every level passed, so the
       number of awards is the number of levels delivered — read from
       the model rather than multiplied by a factor somebody chose. */
    const totalAwards = carried.awards + snap.levelsDelivered * scale * (lag0.revenue / snap.revenue);
    const awardsToC2 = carried.c2;

    /* Learners under instruction this year: everybody admitted this
       year, plus last year’s entrants who carried on into Level IV. */
    const continuing = prevProgression ? prevNew * prevProgression[3] : 0;
    const activeLearners = newLearners + continuing;

    /* ALUMNI ARE PEOPLE, NOT CERTIFICATES. The pull a College exerts on
       its next applicant comes from the number of human beings who hold
       one of its awards and will say so — not from the number of awards
       conferred, which is several times larger because a learner who
       reaches C2 collects six of them. Counting certificates here would
       have quietly multiplied the College’s reach by its own pass
       structure. */
    alumni += newLearners * snap.progression[0];
    cumRevenue += revenue;
    cumSurplus += surplus;
    reserve = Math.max(0, reserve + (surplus > 0 ? surplus * PLAN.reserve.contribution_share_of_surplus : surplus));

    /* Each market's second teaching year, carried into the next year
       exactly as the institution's is. */
    carriedRegion = Object.fromEntries(Object.entries(snap.byRegion || {})
      .map(([k, v]) => [k, v.lag1 * scale]));

    carried = {
      revenue: lag1.revenue * scale,
      delivery: lag1.delivery * scale,
      hours: lag1.hours * scale,
      awards: snap.levelsDelivered * scale * (lag1.revenue / snap.revenue),
      c2: snap.awardsToC2 * scale,
    };
    prevNew = newLearners;
    prevProgression = snap.progression;

    years.push({
      year: y + 1,
      calendar: PLAN.planning_period.first_year + y,
      reach: round(reach, 3),
      newLearners: round(newLearners),
      activeLearners: round(activeLearners),
      awardsToC2: round(awardsToC2),
      totalAwards: round(totalAwards),
      alumni: round(alumni),
      instructors,
      turnedAwayByCapacity: round(snap.learners * afford * (1 - capacityFactor)),
      revenue: round(revenue),
      refunds: round(refunds),
      netTuition: round(netTuition),
      delivery: round(delivery),
      acquisition: round(acquisition),
      fixed: round(fixed),
      development: round(development),
      surplus: round(surplus),
      margin: revenue > 0 ? round(surplus / revenue, 4) : 0,
      cumulativeRevenue: round(cumRevenue),
      cumulativeSurplus: round(cumSurplus),
      reserve: round(reserve),
      revenuePerLearner: newLearners > 0 ? round(revenue / newLearners) : 0,
      byProduct: Object.fromEntries(Object.entries(snap.byProduct).map(([k, v]) => [k, round(v.learners * scale)])),
      /* BY MARKET, WHICH THE DECADE HAD NEVER REPORTED. The plan
         prices four markets separately and two of them carry no taught
         route at retail — the largest structural fact in it — and the
         projection reported a decade, a product mix and a channel mix
         and nothing whatever by market, so no page in either
         publication could draw one. */
      byRegion: Object.fromEntries(Object.entries(snap.byRegion || {}).map(([k, v]) => [k, {
        learners: round(v.learners * scale),
        revenue: round(v.lag0 * scale + (prevRegion[k] || 0)),
        retail: round(v.retail * scale),
        agreement: round(v.agreement * scale),
      }])),
    });
  }

  return {
    label,
    prices,
    regional,
    years,
    totals: {
      revenue: round(years.reduce((a, b) => a + b.revenue, 0)),
      delivery: round(years.reduce((a, b) => a + b.delivery, 0)),
      acquisition: round(years.reduce((a, b) => a + b.acquisition, 0)),
      fixed: round(years.reduce((a, b) => a + b.fixed, 0)),
      development: round(years.reduce((a, b) => a + b.development, 0)),
      refunds: round(years.reduce((a, b) => a + b.refunds, 0)),
      surplus: round(years.reduce((a, b) => a + b.surplus, 0)),
      newLearners: round(years.reduce((a, b) => a + b.newLearners, 0)),
      awards: round(years.reduce((a, b) => a + b.totalAwards, 0)),
      awardsToC2: round(years.reduce((a, b) => a + b.awardsToC2, 0)),
      alumni: years[years.length - 1].alumni,
      y10Revenue: years[years.length - 1].revenue,
      y10Active: years[years.length - 1].activeLearners,
      y10New: years[years.length - 1].newLearners,
      reserve: years[years.length - 1].reserve,
      /* Ten years of each market, summed from the years rather than
         re-derived, so the regional total cannot disagree with the
         decade it decomposes. */
      byRegion: years.reduce((acc, y) => {
        for (const [k, v] of Object.entries(y.byRegion || {})) {
          acc[k] = acc[k] || { learners: 0, revenue: 0, retail: 0, agreement: 0 };
          acc[k].learners += v.learners; acc[k].revenue += v.revenue;
          acc[k].retail += v.retail; acc[k].agreement += v.agreement;
        }
        return acc;
      }, {}),
    },
  };
}

/** The committed reference tariff, in the vocabulary the cost engine
 *  speaks. The projection ran on a superseded tariff for one revision
 *  after the portfolio adopted this one — Part III published one set of
 *  figures and Part V projected another. */
export const COMMITTED = Object.fromEntries(
  Object.entries(PF.SPEC_OF_INTENSITY).map(([intensity, spec]) => [spec, PF.REFERENCE_TARIFF[intensity]]),
);

/** The three architectures, on one basis. */
export function architectures() {
  // The adopted tariff, read from the College's own record rather than
  // restated — the whole point of comparing against it is that it is a
  // fact about the institution and not a number in this file.
  const adoptedFlat = P.B.programmeTotal;
  const AA = PLAN.alternative_architecture_a;
  return {
    proposed: project(COMMITTED, { label: 'Proposed portfolio', regional: true }),
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
    conservative: project(COMMITTED, {
      label: 'Conservative', regional: true,
      continuationScale: 0.88, reachMultiplier: 0.74, cacMultiplier: 1.26,
    }),
    core: project(COMMITTED, { label: 'Core Management Plan', regional: true }),
    growth: project(COMMITTED, {
      label: 'High Growth', regional: true,
      continuationScale: 1.09, reachMultiplier: 1.28, cacMultiplier: 0.86,
    }),
  };
}

/**
 * WHAT THE PROPOSAL BUYS, AND WHAT IT GIVES UP TO BUY IT.
 *
 * ────────────────────────────────────────────────────────────────────
 * THIS COMPARISON HAS FALLEN THREE DIFFERENT WAYS IN THREE REVISIONS.
 * ────────────────────────────────────────────────────────────────────
 * When the portfolio was retail only it bought reach by giving up
 * margin, and the plan said so. Adding the institutional channels made
 * it beat a single global fee on revenue, surplus, learners and awards
 * at once. Pricing the decade by region took revenue back — two of the
 * College's four markets carry no taught route at retail, so a flat fee
 * books income from learners who would not have enrolled at it.
 *
 * Each time, a sentence written against the previous shape survived in
 * the publication describing a trade the model no longer had — once
 * claiming a clean sweep it had lost, once claiming a sacrifice it had
 * stopped making, and once about to print "−2,102 fewer learners".
 *
 * So the sentence is no longer written. It is COMPOSED, from whichever
 * way the model actually falls, and the only thing fixed in advance is
 * that both halves of it get said.
 */
export function compare(a = architectures()) {
  const p = a.proposed.totals, q = a.adopted.totals;
  const dims = [
    { key: 'revenue', unit: 'money', noun: 'ten-year revenue', ours: p.revenue, theirs: q.revenue },
    { key: 'learners', unit: 'count', noun: 'admissions', ours: p.newLearners, theirs: q.newLearners },
    { key: 'awards', unit: 'count', noun: 'qualifications conferred', ours: p.awards, theirs: q.awards },
    { key: 'surplus', unit: 'money', noun: 'retained surplus', ours: p.surplus, theirs: q.surplus },
  ].map((d) => ({ ...d, delta: d.ours - d.theirs }));
  return {
    dims,
    ahead: dims.filter((d) => d.delta > 0),
    behind: dims.filter((d) => d.delta < 0),
    level: dims.filter((d) => d.delta === 0),
    ourMargin: p.surplus / p.revenue,
    theirMargin: q.surplus / q.revenue,
    /** True when the proposal is ahead on everything — which is a
     *  claim that must be EARNED each time it is printed, not a
     *  default. */
    sweep: dims.every((d) => d.delta > 0),
  };
}
