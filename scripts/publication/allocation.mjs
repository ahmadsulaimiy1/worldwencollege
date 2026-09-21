/**
 * THE REVENUE-ALLOCATION FRAMEWORK — the governing financial law, and
 * the thing prices are solved BACKWARDS from.
 *
 * ────────────────────────────────────────────────────────────────────
 * WHY THIS FILE EXISTS, AND WHAT IT REPLACES
 * ────────────────────────────────────────────────────────────────────
 * The previous model priced the programme first and then discovered
 * what the economics happened to be. It arrived at a College that was
 * solvent and thin — a fourteen per cent margin, a reserve at half its
 * own target, and a decade that turned negative on a forty per cent
 * movement in acquisition cost. Nothing in that model was wrong. It
 * simply had no view about what an institution's revenue is FOR, so it
 * reported whatever fell out.
 *
 * data/masterplan.json § revenue_allocation_framework states that view:
 * payroll 25, technology 5, operating 10, marketing 10, reserve 25,
 * strategic 25. This file makes it binding. Given a delivery
 * specification and a scale, it computes the price at which the
 * framework holds — so the price is an OUTPUT of the institution the
 * Board intends to build, not an input somebody chose.
 *
 * ────────────────────────────────────────────────────────────────────
 * THE THREE LEVERS, AND WHY ALL THREE MUST MOVE
 * ────────────────────────────────────────────────────────────────────
 * A price is one of three things that decide whether the framework can
 * hold, and treating it as the only one is what produced both of the
 * previous answers — first a tariff nobody had tested, then a tariff
 * bounded by competitors selling a different product.
 *
 *   PRICE. What the College charges. Swept across a wide range rather
 *   than optimised to a point, because the product it is attached to
 *   has no market price.
 *
 *   SPECIFICATION. What an hour of the pathway actually contains. This
 *   was asserted and then held fixed, which made it invisible. WEC-LC
 *   Tutored gives 98 hours of individual instructor attention across
 *   the pathway. A complete British Council A2–C1 ladder gives about
 *   37. The College is not selling a dear version of that product; it
 *   is selling a different one, roughly two and a half times the size.
 *   Whether it should be that size is a decision, and it is modelled
 *   here as one.
 *
 *   SCALE. How many learners the fixed establishment is spread over.
 *
 * ────────────────────────────────────────────────────────────────────
 * WHAT THE FRAMEWORK DOES NOT DO
 * ────────────────────────────────────────────────────────────────────
 * It does not apply tier by tier. It is a statement about the
 * institution, and the Independent route sits below its own allocation
 * floor deliberately because the Executive tiers carry it. A framework
 * enforced per tier would close the College's cheapest door by
 * arithmetic rather than by anybody's decision.
 */

import { PLAN } from './masterplan.mjs';
import * as P from './pricing.mjs';

const F = PLAN.revenue_allocation_framework;

/** The six shares, keyed. */
export const SHARES = Object.fromEntries(F.shares.map((s) => [s.key, s.share]));
export const FRAMEWORK = F;

/** The two lines that are retained rather than spent. */
export const RETAINED = ['reserve', 'strategic'];
/** ...and the four that are consumed running the institution. */
export const CONSUMED = ['payroll', 'technology', 'opex', 'marketing'];

const OC = 1 + PLAN.staffing.oncost_rate;
const LPY = P.LEVELS_PER_LEARNER_YEAR;

/* ────────────────────────────────────────────────────────────────────
   THE COST BASE, DECOMPOSED INTO THE FRAMEWORK'S OWN CATEGORIES

   The plan already held every one of these figures. What it did not
   hold was the mapping — which meant the cost model and the governance
   framework could not be compared, and a reader had to take on trust
   that the one obeyed the other.
   ──────────────────────────────────────────────────────────────────── */

/** Posts that scale with enrolment, as annual cost per active learner. */
export const VARIABLE = {
  payroll: PLAN.staffing.roles.filter((r) => r.per_n_students)
    .reduce((a, r) => a + r.salary_usd / r.per_n_students, 0) * OC,
  technology: PLAN.technology_usd.per_active_learner,
  opex: PLAN.operating_usd.per_active_learner,
};

/** Posts and costs that exist because the College does. `year` is
 *  1-based: two of these posts do not start until Year 2. */
export function fixed(year = PLAN.planning_period.years) {
  const ID = PLAN.institutional_development_usd;
  return {
    payroll: PLAN.staffing.roles
      .filter((r) => !r.per_n_students && r.from_year <= year)
      .reduce((a, r) => a + r.salary_usd, 0) * OC,
    technology: PLAN.technology_usd.floor_per_year,
    // The External Examiner is one person however many candidates sit,
    // and is a professional service rather than an employee.
    opex: PLAN.operating_usd.floor_per_year
      + (year >= ID.external_examiner_usd_from_year ? ID.external_examiner_usd : 0),
  };
}

/**
 * WHAT ONE COMPLETE PATHWAY COSTS, in the framework's categories.
 *
 * `specScale` scales the instructor hours in the delivery
 * specification — the lever that was invisible while the spec was
 * asserted and then held fixed. 1.0 is the published specification.
 *
 * This is the cost of a pathway SOMEBODY COMPLETES. Most do not, and
 * anything that reasons about the institution rather than about one
 * purchase must weight by progression — see `consumedBy` below, and
 * the note on it, which is there because getting this wrong charged
 * six levels of teaching to every learner who enrolled and put payroll
 * at 125 per cent of revenue.
 */
export function pathwayCost(productKey, specScale = 1) {
  // Resolves channels to the specification they are taught at.
  let academic = 0;
  for (let i = 0; i < 6; i++) academic += levelAcademic(productKey, i, specScale);
  return {
    payroll: academic + (VARIABLE.payroll / LPY) * 6,
    technology: (VARIABLE.technology / LPY) * 6,
    opex: (VARIABLE.opex / LPY) * 6,
    academic,
  };
}

/** Academic cost of one level at a given specification. Assessment does
 *  not scale with teaching: a C2 script takes the time it takes however
 *  the learner was prepared for it, and the award rests on it. */
function levelAcademic(productKey, i, specScale) {
  const d = P.deliveryCost(P.specOf(productKey), i);
  return (d.total - d.assessment) * specScale + d.assessment;
}

/**
 * WHAT A COHORT ACTUALLY CONSUMES, weighted by how far its members get.
 *
 * `progression[i]` is the share of entrants still enrolled at level i.
 * A College bills for the levels it teaches, not the levels it sold.
 */
export function consumedBy(productKey, learners, progression, specScale = 1) {
  let academic = 0, levels = 0;
  for (let i = 0; i < 6; i++) {
    academic += learners * progression[i] * levelAcademic(productKey, i, specScale);
    levels += learners * progression[i];
  }
  return {
    payroll: academic + levels * (VARIABLE.payroll / LPY),
    technology: levels * (VARIABLE.technology / LPY),
    opex: levels * (VARIABLE.opex / LPY),
    academic, levels,
  };
}

/**
 * THE WHOLE INSTITUTION, TESTED AGAINST THE FRAMEWORK.
 *
 * Returns what each category actually consumes as a share of gross
 * collected revenue, beside what the framework says it should, and the
 * shortfall or headroom on each. This is the instrument the Board reads
 * to know whether a proposed architecture obeys its own law.
 */
export function achieved(prices, opts = {}) {
  const {
    specScale = 1, reachScale = 1, year = PLAN.planning_period.years,
    /* ══════════════════════════════════════════════════════════════
       THE CONSTITUTION IS TESTED ON THE INSTITUTION THE BOOK
       PROJECTS, OR IT IS TESTED ON NOTHING.
       ══════════════════════════════════════════════════════════════
       This took one global price vector and re-ran the whole demand
       model on it — no regional tariff, no agreement placement — so
       the tariff was certified against a College that sells one price
       everywhere. The projection was made region-aware and this, which
       sits upstream of it and produces the number every other number
       descends from, was not. */
    tariffOf = null, placement = null, planYear = null,
  } = opts;
  const snap = P.portfolio(prices, { reachScale, fixed: 0, tariffOf, placement, planYear });
  const fx = fixed(year);
  const prog = snap.progression;

  const consumed = { payroll: fx.payroll, technology: fx.technology, opex: fx.opex, marketing: snap.acquisition };
  let levels = 0;
  for (const [k, v] of Object.entries(snap.byProduct)) {
    const c = consumedBy(k, v.learners, prog, specScale);
    consumed.payroll += c.payroll;
    consumed.technology += c.technology;
    consumed.opex += c.opex;
    levels += c.levels;
  }

  const spent = CONSUMED.reduce((a, k) => a + consumed[k], 0);
  const revenue = snap.revenue;
  const retained = revenue - spent;

  const lines = F.shares.map((s) => {
    const isRetained = RETAINED.includes(s.key);
    // The two retained lines share whatever is left, in the proportion
    // the framework sets between them.
    const amount = isRetained
      ? retained * (s.share / RETAINED.reduce((a, k) => a + SHARES[k], 0))
      : consumed[s.key];
    return {
      key: s.key, name: s.name, target: s.share,
      amount: Math.round(amount),
      actual: revenue > 0 ? amount / revenue : 0,
      variance: revenue > 0 ? amount / revenue - s.share : 0,
      retained: isRetained,
    };
  });

  return {
    revenue: Math.round(revenue),
    learners: snap.learners,
    levelsDelivered: Math.round(levels),
    spent: Math.round(spent),
    retained: Math.round(retained),
    retainedShare: revenue > 0 ? retained / revenue : 0,
    lines,
    // The framework holds when no CONSUMED line is over its target. A
    // line under target is headroom, not a failure.
    holds: lines.filter((l) => !l.retained).every((l) => l.variance <= 0.0001),
    binding: lines.filter((l) => !l.retained)
      .reduce((w, l) => (!w || l.variance > w.variance ? l : w), null),
  };
}

/**
 * SOLVE THE PORTFOLIO FOR THE FRAMEWORK.
 *
 * Scales every taught price by one multiplier until the framework holds
 * with nothing to spare, leaving the adopted Independent route where it
 * is. Bisection rather than a formula, because demand moves with price
 * and the cost base moves with demand.
 */
export function solve(base, opts = {}) {
  const {
    specScale = 1, hold = ['independent'],
    lo = 0.4, hi = 5.0, step = 0.02,
  } = opts;
  /* A SWEEP, NOT A BISECTION. Retained share is not monotone in price:
     it rises while the cost base is being spread over a price that is
     growing faster than demand falls, and then turns over when demand
     falls faster. A bisection assumes a crossing that may not exist and
     silently returns the ceiling when it does not — which it did, and
     reported a $456,000 Executive Bespoke as though it were an answer. */
  const at = (m) => {
    const prices = Object.fromEntries(Object.entries(base)
      .map(([k, v]) => [k, hold.includes(k) ? v : Math.round(v * m / 50) * 50]));
    return { multiplier: m, prices, result: achieved(prices, { specScale }) };
  };
  const curve = [];
  for (let m = lo; m <= hi + 1e-9; m += step) curve.push(at(m));
  const target = SHARES.reserve + SHARES.strategic;
  const holding = curve.filter((c) => c.result.retainedShare >= target);
  return {
    curve,
    /** The cheapest tariff that satisfies the framework — the one to
     *  propose, because everything above it charges more for the same
     *  compliance. */
    cheapest: holding.length ? holding[0] : null,
    /** And the tariff that retains most, for the Board to see what it
     *  is declining when it takes the cheapest. */
    richest: curve.reduce((w, c) => (!w || c.result.retainedShare > w.result.retainedShare ? c : w), null),
    holds: holding.length > 0,
  };
}

/* ── Convenience entry points ────────────────────────────────────────
   The workbook asks the engine for JSON over a one-line node process,
   so anything it needs must be reachable from this module alone. */

/** The framework as the proposed tariff actually achieves it. */
export const achievedProposed = (opts) => achieved(P.PROPOSED.committed, opts);

/** The sweep the proposed tariff is the output of. */
export const solveProposed = (opts) => solve(P.PROPOSED.committed, opts);
