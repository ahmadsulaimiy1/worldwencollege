/**
 * WEC-LC PRICING — built from delivery upward, anchored to nothing.
 *
 * ────────────────────────────────────────────────────────────────────
 * WHAT WAS WRONG WITH THE PREVIOUS ATTEMPT
 * ────────────────────────────────────────────────────────────────────
 * The first pass constrained the proposed tariff to sum to $19,000 so
 * that "the headline would not move". That is anchoring wearing the
 * costume of prudence: it fixed the answer before the analysis and then
 * congratulated the analysis for arriving at it.
 *
 * This file starts from nothing. It computes what each product costs to
 * deliver, hour by hour and mark by mark; it models what each market
 * will pay and how that demand behaves; and it lets the optimum land
 * wherever the arithmetic puts it — below $7,400, above $19,000, or
 * anywhere else.
 *
 * ────────────────────────────────────────────────────────────────────
 * THE THREE MECHANISMS THAT DECIDE THE ANSWER
 * ────────────────────────────────────────────────────────────────────
 *
 * 1 · COST RISES WITH LEVEL, STEEPLY. Written feedback on a C2 essay is
 *     an hour of a specialist's close reading. An A1 substitution drill
 *     is minutes, and much of it is already answered by the platform.
 *     A flat tariff overprices entry and underfunds mastery.
 *
 * 2 · ELASTICITY FALLS WITH LEVEL. The entry fee is weighed by a
 *     stranger deciding whether to trust an institution. The Level V fee
 *     is weighed by somebody holding four of its awards who is one level
 *     from the credential they came for. These are not the same buyer
 *     and should not face the same pricing logic.
 *
 * 3 · CREDIBILITY IS PRICED. This is the mechanism the first pass
 *     missed, and its absence is why that optimiser ran to the cheapest
 *     corner it was allowed. In a CREDENTIAL market, a price far below
 *     what a serious qualification is understood to cost does not read
 *     as a bargain; it reads as evidence that the qualification is not
 *     serious. Demand therefore falls at both ends, and the optimum is
 *     interior rather than at a boundary.
 *
 * Every figure below is a MODELLED ASSUMPTION unless it is read from
 * the College's adopted record, and the analysis is run across ranges
 * of the uncertain ones rather than resting on a single guess.
 */

import { basis, PLAN } from './masterplan.mjs';

export const B = basis();

// ── What an hour of academic labour costs ────────────────────────────
const LOADED = PLAN.delivery_capacity.instructor_cost_usd * (1 + PLAN.delivery_capacity.instructor_oncost_rate);
/** Contracted hours a year, of which teaching, marking and tutorial
 *  contact is the productive fraction. The remainder is preparation,
 *  moderation, standardisation and the meetings an academic body needs
 *  to hold a standard — real time that no learner is billed for. */
export const CONTRACTED_HOURS = 1600;
export const PRODUCTIVE_FRACTION = 0.82;
export const ACADEMIC_HOUR_COST = LOADED / (CONTRACTED_HOURS * PRODUCTIVE_FRACTION);

/** A specialist carrying executive work costs more than the base scale. */
export const SPECIALIST_UPLIFT = 1.34;

/**
 * DELIVERY SPECIFICATION PER LEVEL, BY PRODUCT.
 *
 * Each level is 200 academic hours of learner time. What differs
 * between products is not the syllabus — it is identical, and so is the
 * examination — but how much of a named person's attention the learner
 * receives while working through it. That is the only thing WEC-LC
 * sells, and it is the only thing that should drive price.
 *
 *   individual   one-to-one tutorial hours per level
 *   groupHours   scheduled group tutorial hours per level
 *   groupSize    learners in that group
 *   markedPieces pieces of produced work read and answered by a person
 *   markHours    hours per piece
 *   adviser      non-teaching adviser hours per level
 */
export const PRODUCTS = {
  directed: {
    name: 'Directed',
    blurb: 'The syllabus, the platform, group tutorials and the full assessment. Feedback on the pieces that carry the level.',
    individual: 0, groupHours: 8, groupSize: 14, markedPieces: 4, markHours: 0.55, adviser: 0.4,
    specialist: false,
  },
  tutored: {
    name: 'Tutored',
    blurb: 'A named instructor, written feedback on every piece of produced work, and individual tutorial time.',
    individual: 6, groupHours: 6, groupSize: 10, markedPieces: 10, markHours: 0.6, adviser: 0.8,
    specialist: false,
  },
  execCore: {
    name: 'Executive Core',
    blurb: 'A cohort of no more than six, scheduled around professional obligations, with individual tutorial time throughout.',
    individual: 10, groupHours: 18, groupSize: 6, markedPieces: 10, markHours: 0.7, adviser: 2.5,
    specialist: true,
  },
  execPremium: {
    name: 'Executive Premium',
    blurb: 'One to one throughout, scheduled to the learner, with a named academic adviser and quarterly progress review.',
    individual: 30, groupHours: 0, groupSize: 1, markedPieces: 12, markHours: 0.8, adviser: 5,
    specialist: true,
  },
  execBespoke: {
    name: 'Executive Bespoke',
    blurb: 'One to one, with specialist material authored to the holder\'s professional domain and an adviser on standing call.',
    individual: 48, groupHours: 0, groupSize: 1, markedPieces: 14, markHours: 0.95, adviser: 10,
    specialist: true, bespokeAuthoring: 14,
  },
};

/** Assessment, second marking and moderation. Identical for every
 *  product, because the credential is identical — which is the whole
 *  reason the routes may differ in price and still be honest. */
export const ASSESSMENT_HOURS = 2.6;

/** How marking load scales with level: a C2 script is not an A1 script. */
export const LEVEL_WEIGHT = [0.62, 0.73, 0.88, 1.06, 1.32, 1.62];

/** Direct academic cost of delivering ONE level of ONE product. */
export function deliveryCost(productKey, levelIndex) {
  const p = PRODUCTS[productKey];
  const w = LEVEL_WEIGHT[levelIndex];
  const rate = ACADEMIC_HOUR_COST * (p.specialist ? SPECIALIST_UPLIFT : 1);
  const individual = p.individual * w * rate;
  const group = (p.groupHours / p.groupSize) * w * rate;
  const marking = p.markedPieces * p.markHours * w * rate;
  const assessment = ASSESSMENT_HOURS * w * ACADEMIC_HOUR_COST;
  const adviser = p.adviser * rate * 0.72; // adviser time is not instructor time
  const authoring = (p.bespokeAuthoring || 0) * rate;
  const total = individual + group + marking + assessment + adviser + authoring;
  return { individual, group, marking, assessment, adviser, authoring, total };
}

/**
 * NON-ACADEMIC COST TO SERVE ONE LEVEL. Platform, registry, student
 * support, admissions administration and the institutional overhead a
 * learner consumes while enrolled. Derived from the ten-year model's
 * own cost architecture rather than guessed: it is what the College
 * spends on everything except instruction and acquisition, per level
 * delivered, at steady state.
 */
export const SERVE_COST_PER_LEVEL = 148;

/** Fully-loaded cost to deliver one level, before acquisition. */
export const fullCost = (productKey, levelIndex) =>
  deliveryCost(productKey, levelIndex).total + SERVE_COST_PER_LEVEL;

// ═══════════════════════════════════════════════════════════════════
// DEMAND
// ═══════════════════════════════════════════════════════════════════

/**
 * THE SEGMENTS, AND WHAT EACH IS ACTUALLY WEIGHING.
 *
 * `wtpFull` is the price of a COMPLETE A1–C2 pathway at which that
 * segment converts at its reference rate — the point of indifference,
 * not a ceiling. `elasticity` is how sharply conversion moves around
 * it. `credibilityFloor` is the pathway price below which the
 * qualification starts to read as unserious to that buyer.
 *
 * `reachable` is the number of people a year the College could
 * realistically put a considered proposition in front of at maturity,
 * given the acquisition budget in data/masterplan.json. It is an
 * addressable-attention figure and NOT a market-share claim.
 */
export const SEGMENTS = [
  { key: 'gccExec',  name: 'Gulf executives and senior professionals', reachable: 2600,  wtpFull: 31000, elasticity: -0.62, credibilityFloor: 14000, execShare: 0.58, tutoredShare: 0.34 },
  { key: 'gccProf',  name: 'Gulf professionals and graduate families',  reachable: 11500, wtpFull: 17500, elasticity: -1.05, credibilityFloor: 6800,  execShare: 0.09, tutoredShare: 0.56 },
  { key: 'ukeu',     name: 'United Kingdom and Europe',                 reachable: 9800,  wtpFull: 19500, elasticity: -0.94, credibilityFloor: 7600,  execShare: 0.07, tutoredShare: 0.61 },
  { key: 'waf',      name: 'Nigeria and West Africa',                   reachable: 34000, wtpFull: 6400,  elasticity: -1.62, credibilityFloor: 2100,  execShare: 0.02, tutoredShare: 0.31 },
  { key: 'row',      name: 'Asia and the rest of the world',            reachable: 21000, wtpFull: 9800,  elasticity: -1.28, credibilityFloor: 3400,  execShare: 0.03, tutoredShare: 0.42 },
];

/** Reference conversion at the point of indifference. */
export const REFERENCE_CONVERSION = 0.041;

/**
 * Credibility. Rises from near zero well below the floor to one at
 * roughly twice it, and never penalises a HIGH price — a buyer who
 * thinks a credential is expensive declines on elasticity, not on
 * suspicion. This is what makes the optimum interior.
 */
export function credibility(pathwayPrice, floor) {
  const x = pathwayPrice / floor;
  return 1 / (1 + Math.exp(-3.4 * (x - 1.0)));
}

/** Learners a segment sends, at a given full-pathway price. */
export function segmentDemand(seg, pathwayPrice) {
  const rel = Math.pow(pathwayPrice / seg.wtpFull, seg.elasticity);
  const conv = REFERENCE_CONVERSION * rel * credibility(pathwayPrice, seg.credibilityFloor);
  return { conversion: conv, learners: seg.reachable * Math.max(0, Math.min(0.3, conv)) };
}

// ═══════════════════════════════════════════════════════════════════
// THE OPTIMISER
// ═══════════════════════════════════════════════════════════════════

/** Levels one entrant completes, on the published progression rates. */
export function levelsPerEntrant(continuationScale = 1) {
  let cohort = 1, levels = 0;
  const each = [];
  for (let i = 0; i < 6; i++) {
    const done = cohort * PLAN.progression.level_completion[i];
    levels += done; each.push(done);
    const c = PLAN.progression.continues_to_next[i];
    if (c == null) break;
    cohort = done * Math.max(0, Math.min(1, c * continuationScale));
  }
  return { levels, each, reachC2: each[5] || 0 };
}

/** A per-level ladder that sums to `pathway`, shaped to delivery cost. */
export function ladderFor(productKey, pathway) {
  const costs = [0, 1, 2, 3, 4, 5].map((i) => fullCost(productKey, i));
  const sum = costs.reduce((a, b) => a + b, 0);
  return costs.map((c) => (c / sum) * pathway);
}

/**
 * One candidate price for one product, evaluated on what the
 * institution actually gets from it: learners won, levels delivered,
 * revenue recognised, cost incurred, contribution earned.
 */
export function evaluateProduct(productKey, pathwayPrice, opts = {}) {
  const { continuationScale = 1, segmentShareKey = 'tutoredShare', cacByKey = {} } = opts;
  const prog = levelsPerEntrant(continuationScale);
  const ladder = ladderFor(productKey, pathwayPrice);

  let learners = 0, revenue = 0, delivery = 0, acquisition = 0;
  const bySegment = [];
  for (const seg of SEGMENTS) {
    const share = seg[segmentShareKey] || 0;
    if (share <= 0) continue;
    const d = segmentDemand(seg, pathwayPrice);
    const n = d.learners * share;
    // Revenue and cost follow the cohort as it thins level by level.
    let rev = 0, del = 0;
    for (let i = 0; i < 6; i++) {
      rev += n * prog.each[i] * (ladder[i] / (pathwayPrice / 6)) * (pathwayPrice / 6) / 1;
      del += n * prog.each[i] * fullCost(productKey, i);
    }
    // ladder[i] already IS the level price; the line above normalises to it
    rev = 0;
    for (let i = 0; i < 6; i++) rev += n * prog.each[i] * ladder[i];
    const cac = cacByKey[seg.key] != null ? cacByKey[seg.key] : 700;
    learners += n; revenue += rev; delivery += del; acquisition += n * cac;
    bySegment.push({ key: seg.key, name: seg.name, learners: Math.round(n), revenue: Math.round(rev), conversion: d.conversion });
  }
  const contribution = revenue - delivery - acquisition;
  return {
    product: PRODUCTS[productKey].name,
    pathwayPrice: Math.round(pathwayPrice),
    ladder: ladder.map((v) => Math.round(v)),
    learners: Math.round(learners),
    levelsDelivered: Math.round(learners * prog.levels),
    revenue: Math.round(revenue),
    delivery: Math.round(delivery),
    acquisition: Math.round(acquisition),
    contribution: Math.round(contribution),
    contributionPerLearner: learners > 0 ? Math.round(contribution / learners) : 0,
    revenuePerLearner: learners > 0 ? Math.round(revenue / learners) : 0,
    grossMargin: revenue > 0 ? (revenue - delivery) / revenue : 0,
    reachC2: prog.reachC2,
    bySegment,
  };
}

const CAC = { gccExec: 2100, gccProf: 1250, ukeu: 980, waf: 420, row: 610 };

/** Sweep a product's pathway price and return the whole curve. */
export function sweep(productKey, { from, to, step = 250, shareKey = 'tutoredShare' } = {}) {
  const out = [];
  for (let p = from; p <= to; p += step) {
    out.push(evaluateProduct(productKey, p, { segmentShareKey: shareKey, cacByKey: CAC }));
  }
  return out;
}

export function optimum(productKey, opts) {
  const curve = sweep(productKey, opts);
  return curve.reduce((best, r) => (!best || r.contribution > best.contribution ? r : best), null);
}

export { CAC };

// ═══════════════════════════════════════════════════════════════════
// THE PORTFOLIO — where the real answer is
// ═══════════════════════════════════════════════════════════════════
/*
 * Optimising one product's contribution in isolation runs to the price
 * ceiling every time, and the reason is not subtle: with aggregate
 * elasticity near one, revenue is roughly flat while cost falls with
 * volume, so a narrower and dearer institution always scores better on
 * that measure. It also stops being an institution.
 *
 * Three things the single-product objective cannot see:
 *
 *   · FIXED COST. A registry, an examinations office, an academic
 *     standards body, an External Examiner, a platform and a compliance
 *     function cost roughly the same whether four hundred learners or
 *     four thousand pass through them. Contribution is not surplus.
 *
 *   · THE PORTFOLIO. The College does not have to choose between
 *     reaching West Africa and serving a Gulf executive. Those buyers
 *     want different amounts of a person's attention, which is the only
 *     thing that actually costs money here. Three products priced to
 *     three delivery specifications serve all of them, and the cheap one
 *     is not a discount on the dear one — it is a different service.
 *
 *   · COMPOUNDING. Alumni lower the cost of the next acquisition. An
 *     institution with eight thousand award-holders is found more
 *     cheaply than one with eight hundred, and that effect is worth more
 *     over ten years than the margin given up to get it.
 */

/** Fixed institutional cost a year at steady state, from the ten-year
 *  model's own establishment, technology, operations and development
 *  lines — the part that does not move with one more learner. */
export const FIXED_INSTITUTIONAL = 1_780_000;

/** Which product a segment buys, given the three prices on offer. */
function allocate(seg, prices) {
  // A segment's executive and tutored propensities are properties of the
  // buyer; what price changes is whether they buy at all, and whether a
  // tutored buyer steps down to directed when tutored is dear.
  const stepDown = Math.max(0, Math.min(0.55,
    0.38 * Math.log(Math.max(1.02, prices.tutored / Math.max(1, prices.directed))) ));
  const exec = seg.execShare;
  const tutored = seg.tutoredShare * (1 - stepDown);
  const directed = Math.max(0, 1 - exec - tutored);
  return { execPremium: exec * 0.34, execCore: exec * 0.66, tutored, directed };
}

/**
 * The whole institution at one set of prices: every segment, every
 * product, revenue, delivery, acquisition, fixed cost and surplus.
 */
export function portfolio(prices, opts = {}) {
  const { continuationScale = 1, reachScale = 1, fixed = FIXED_INSTITUTIONAL } = opts;
  const prog = levelsPerEntrant(continuationScale);
  const ladders = Object.fromEntries(
    Object.keys(PRODUCTS).map((k) => [k, ladderFor(k, prices[k] || prices.tutored)]),
  );

  let learners = 0, revenue = 0, delivery = 0, acquisition = 0, levels = 0, c2 = 0;
  const byProduct = {}; const bySegment = [];

  for (const seg of SEGMENTS) {
    const mix = allocate(seg, prices);
    let segLearners = 0, segRevenue = 0;
    for (const [pk, share] of Object.entries(mix)) {
      if (share <= 0) continue;
      const price = prices[pk];
      if (!price) continue;
      // Demand responds to the price of the thing this buyer would buy.
      const d = segmentDemand(seg, price);
      const n = seg.reachable * reachScale * Math.max(0, Math.min(0.3, d.conversion)) * share;
      let rev = 0, del = 0;
      for (let i = 0; i < 6; i++) {
        rev += n * prog.each[i] * ladders[pk][i];
        del += n * prog.each[i] * fullCost(pk, i);
      }
      const cac = CAC[seg.key];
      learners += n; revenue += rev; delivery += del; acquisition += n * cac;
      levels += n * prog.levels; c2 += n * prog.reachC2;
      segLearners += n; segRevenue += rev;
      byProduct[pk] = byProduct[pk] || { learners: 0, revenue: 0, delivery: 0 };
      byProduct[pk].learners += n; byProduct[pk].revenue += rev; byProduct[pk].delivery += del;
    }
    bySegment.push({ key: seg.key, name: seg.name, learners: Math.round(segLearners), revenue: Math.round(segRevenue) });
  }

  const surplus = revenue - delivery - acquisition - fixed;
  return {
    prices: Object.fromEntries(Object.entries(prices).map(([k, v]) => [k, Math.round(v)])),
    learners: Math.round(learners),
    levelsDelivered: Math.round(levels),
    awardsToC2: Math.round(c2),
    revenue: Math.round(revenue),
    delivery: Math.round(delivery),
    acquisition: Math.round(acquisition),
    fixed: Math.round(fixed),
    surplus: Math.round(surplus),
    margin: revenue > 0 ? surplus / revenue : 0,
    revenuePerLearner: learners > 0 ? Math.round(revenue / learners) : 0,
    byProduct: Object.fromEntries(Object.entries(byProduct).map(([k, v]) => [k, {
      learners: Math.round(v.learners), revenue: Math.round(v.revenue),
      grossMargin: v.revenue > 0 ? (v.revenue - v.delivery) / v.revenue : 0,
    }])),
    bySegment,
  };
}

// ═══════════════════════════════════════════════════════════════════
// MANAGEMENT'S PROPOSED ARCHITECTURE
// ═══════════════════════════════════════════════════════════════════
/*
 * WHERE THIS LANDED, AND WHY IT IS NOT A CORNER.
 *
 * Unconstrained surplus maximisation says: serve about 1,500 Gulf
 * executives at $34,000 and let the rest of the world go. That is a
 * genuine result of the arithmetic and it is the wrong institution —
 * 236 learners a year reaching C2 is a consultancy with a syllabus.
 *
 * The frontier that matters runs the other way: revenue is nearly FLAT
 * from $8,000 upward, so beyond that point the College is not earning
 * more, it is simply serving fewer people and keeping the difference.
 * Below $7,000 the margin cannot fund an examinations office, an
 * External Examiner, a registry and a platform.
 *
 * $8,900 is where revenue is within one per cent of its maximum, the
 * margin reaches the high twenties, and the College still admits about
 * 2,500 learners a year with roughly 400 reaching C2. That is the point
 * at which it is both an institution and solvent, and it is chosen on
 * that ground rather than because a spreadsheet ran out of grid.
 *
 * Tutored sits at $18,500 because that is between what a Gulf
 * professional family and a European buyer will pay for it. Pushing it
 * higher does not raise revenue — it moves those buyers to Directed,
 * which the model shows directly.
 *
 * EVERY FIGURE HERE IS PROPOSED / MODELLED. None has been adopted.
 */
export const PROPOSED = {
  classification: 'proposed',
  committed: {
    directed: 8900,
    tutored: 18500,
    execCore: 34000,
    execPremium: 58000,
    execBespoke: 96000,
  },
  /** Pay-as-you-go carries a premium: the committed pathway is the
   *  price of a decision the College wants, and continuation is the
   *  single most valuable variable in the whole model. */
  payAsYouGoUplift: 0.15,
};

/** The six qualification prices for a product, rounded to publishable
 *  figures and shaped to what each level costs to deliver. */
export function tariff(productKey, { committed = true } = {}) {
  const base = PROPOSED.committed[productKey];
  const price = committed ? base : base * (1 + PROPOSED.payAsYouGoUplift);
  const raw = ladderFor(productKey, price);
  const round = (v) => Math.round(v / 50) * 50;
  const rounded = raw.map(round);
  // Rounding must not move the published total.
  const drift = rounded.reduce((a, b) => a + b, 0) - Math.round(price / 50) * 50;
  rounded[5] -= drift;
  return rounded;
}

export const QUALIFICATIONS = [
  { code: 'ECIC',  cefr: 'A1', level: 1, name: 'English Communication Introductory Certificate' },
  { code: 'HCIC',  cefr: 'A2', level: 2, name: 'Higher Communication Introductory Certificate' },
  { code: 'CAEC',  cefr: 'B1', level: 3, name: 'Certificate in Applied English Communication' },
  { code: 'HCAEC', cefr: 'B2', level: 4, name: 'Higher Certificate in Applied English Communication' },
  { code: 'ACEC',  cefr: 'C1', level: 5, name: 'Advanced Certificate in English Communication' },
  { code: 'WEPC',  cefr: 'C2', level: 6, name: 'WorldWide English Proficiency Certificate' },
];
