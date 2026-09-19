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
  /* THE ROUTE THE RESEARCH SENT US BACK TO, and it was adopted years
     before this analysis began.

     The market evidence says plainly that no taught WEC-LC tier reaches
     Nigeria: a Lagos IELTS course is about $49 a month and the whole
     published Nigerian range tops out near $1,817, against a Directed
     pathway of several thousand. The first instinct is to invent a
     cheap taught tier for that market. That instinct is wrong — it
     would mean selling supervision the College could not staff, which
     is the exact error Alternative Architecture A was rejected for.

     The College already sells the right product. data/commercial.json
     carries an INDEPENDENT ROUTE at $150 materials, $250 assessment and
     $200 conferral a level: the platform, the examination with second
     marking and moderation, and the award with its registry entry —
     everything except the teaching. It is adopted, it is published, it
     costs almost nothing to deliver beyond assessment, and it is the
     only WEC-LC product the researched West African and Asian
     willingness to pay can actually reach.

     Modelling it here is not a new product. It is the portfolio finally
     including one the College already has. */
  independent: {
    name: 'Independent',
    blurb: 'The level inside the platform, the examination with second marking and moderation, and the award with its registry entry. Everything except the teaching.',
    individual: 0, groupHours: 0, groupSize: 1, markedPieces: 0, markHours: 0, adviser: 0.15,
    specialist: false, adopted: true,
  },
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

// ══════════════════════════════════════════════════════════════════
// WHAT THE INSTITUTION COSTS, SPLIT WHERE THE COST ACTUALLY SPLITS
// ══════════════════════════════════════════════════════════════════
/*
 * THE ERROR THIS REPLACES, recorded because it changed the answer.
 *
 * Until market validation forced the cost side to be re-read, this file
 * carried two typed constants: a serving cost of $148 a level and a
 * fixed institutional cost of $1,780,000 a year. Both were described as
 * derived from the ten-year model’s own cost architecture. Neither was
 * derived from anything, and between them they charged the same posts
 * twice.
 *
 * data/masterplan.json § staffing already distinguishes two kinds of
 * post, by whether `per_n_students` is set. A Registrar, a Director of
 * Academic Standards, a finance officer and a marketing lead are
 * appointed because the College exists. An admissions officer per 350
 * learners, a student support officer per 420, an examinations officer
 * per 800 and a platform engineer per 1,200 are appointed because
 * learners arrive. The first kind is fixed. The second kind is not, and
 * treating it as fixed is what produced $1,780,000 — a figure that is
 * neither the fixed establishment ($588,160) nor anything else the plan
 * contains, but the WHOLE establishment at roughly four thousand active
 * learners, charged as though none of it scaled, on top of a serving
 * charge that was already charging the scaling part.
 *
 * Both are now computed from data/masterplan.json. The correction cuts
 * fixed cost and raises serving cost, and both halves are made together
 * for that reason: a correction that only ever flatters the plan is
 * worth less than one that is simply right.
 *
 * masterplan.mjs never made this mistake — its year-by-year model hires
 * against thresholds. The defect was confined to the portfolio model,
 * which is the one the pricing decision rests on.
 */

const OC = 1 + PLAN.staffing.oncost_rate;
const TERMS_PER_YEAR = 12 / PLAN.progression.months_per_level;

/** Levels one enrolled learner completes in a year, at the plan’s own
 *  completion rates. This is the divisor that turns an annual cost into
 *  a per-level one, and it is the reason the serving charge cannot be
 *  read off a calendar. */
export const LEVELS_PER_LEARNER_YEAR = TERMS_PER_YEAR
  * (PLAN.progression.level_completion.reduce((a, b) => a + b, 0)
     / PLAN.progression.level_completion.length);

/** The posts appointed because learners arrive, expressed as the cost
 *  of one more active learner for one year, plus the platform and
 *  office cost that learner consumes.
 *
 *  Read from the establishment’s own ratios rather than from a scale
 *  the College happens to reach, so it carries no assumption about
 *  size. Hiring is lumpy — the twelfth admissions officer arrives at
 *  one particular learner — but lumpiness is a timing effect, and it
 *  belongs to the year-by-year model in masterplan.mjs, not here. */
export const VARIABLE_PER_ACTIVE_YEAR =
  PLAN.staffing.roles
    .filter((r) => r.per_n_students)
    .reduce((a, r) => a + r.salary_usd / r.per_n_students, 0) * OC
  + PLAN.technology_usd.per_active_learner
  + PLAN.operating_usd.per_active_learner;

/**
 * NON-ACADEMIC COST TO SERVE ONE LEVEL. Platform, registry, student
 * support, admissions administration and the institutional overhead a
 * learner consumes while enrolled — the scaling establishment above,
 * over the levels a learner actually completes in a year.
 */
export const SERVE_COST_PER_LEVEL = VARIABLE_PER_ACTIVE_YEAR / LEVELS_PER_LEARNER_YEAR;

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
  /* EVIDENCE-INFORMED, 19 September 2026. Sources and the reasoning
     behind each figure are in data/market-evidence.json. The first
     version of this table was modelled throughout; the research moved
     four of the five materially, and one of them by a factor of three. */
  {
    key: 'gccExec', name: 'Gulf executives and senior professionals', reachable: 2600,
    // WAS $31,000, MODELLED. The published Gulf market tops out far
    // lower: a full British Council Saudi A2–C1 ladder computes to
    // $10,600–$14,100, and one-to-one corporate language training runs
    // $50–$120 an hour. An executive pays above the listed market for
    // scheduling, privacy and a credential — but not three times it.
    wtpFull: 24000, elasticity: -0.62, credibilityFloor: 11000,
    execShare: 0.58, tutoredShare: 0.34,
    evidence: 'british_council_saudi_ladder + corporate_1to1_rates', confidence: 'medium',
  },
  {
    key: 'gccProf', name: 'Gulf professionals and graduate families', reachable: 11500,
    // WAS $17,500, MODELLED. This is the segment the British Council
    // Saudi tariff speaks to directly, and that tariff is published.
    wtpFull: 13000, elasticity: -1.05, credibilityFloor: 5200,
    execShare: 0.09, tutoredShare: 0.56,
    evidence: 'british_council_saudi_ladder', confidence: 'high',
  },
  {
    key: 'ukeu', name: 'United Kingdom and Europe', reachable: 9800,
    // WAS $19,500, MODELLED. Anchored on university pre-sessional
    // English, the closest credentialed comparable: Stirling's ONLINE
    // eight-week course is £5,150, Sheffield £525 a week.
    wtpFull: 15500, elasticity: -0.94, credibilityFloor: 6200,
    execShare: 0.07, tutoredShare: 0.61,
    evidence: 'uk_presessional', confidence: 'high',
  },
  {
    key: 'waf', name: 'Nigeria and West Africa', reachable: 34000,
    // WAS $6,400, MODELLED — AND IT WAS NEARLY THREE TIMES TOO HIGH.
    // A Lagos IELTS course is NGN 75,000 a month, about $49; the whole
    // published Nigerian range tops out near $1,817. Two years of
    // study at the going rate is about $1,176. This single correction
    // removes more demand from the model than every other change
    // combined, and it is the most important result of the research.
    wtpFull: 2200, elasticity: -1.62, credibilityFloor: 900,
    execShare: 0.01, tutoredShare: 0.22,
    evidence: 'nigeria_published_rates', confidence: 'high',
  },
  {
    key: 'row', name: 'Asia and the rest of the world', reachable: 21000,
    // MODELLED — INSUFFICIENT DIRECT MARKET EVIDENCE. No reliable
    // published tariff was found for this group and it is not a
    // founding market. Scaled between the Gulf and West African
    // findings rather than researched, and marked as such.
    wtpFull: 5200, elasticity: -1.28, credibilityFloor: 2100,
    execShare: 0.02, tutoredShare: 0.38,
    evidence: null, confidence: 'modelled — insufficient direct market evidence',
  },
];

/** Hours of individual instructor attention a learner receives, which
 *  is the unit the market evidence is compared in. A group class of
 *  twelve at 90 contact hours gives each learner 7.5 hours; a WEC-LC
 *  Tutored pathway gives 98. */
export function attentionHours(productKey) {
  const p = PRODUCTS[productKey];
  return LEVEL_WEIGHT.reduce((a, w) => a + w * (
    p.individual + p.groupHours / p.groupSize
    + p.markedPieces * p.markHours + ASSESSMENT_HOURS + p.adviser * 0.72), 0);
}

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

/**
 * Fixed institutional cost in a given year: the posts appointed because
 * the College exists, the floor cost of running the platform and the
 * London office at all, and the External Examiner — who is one person
 * however many candidates sit. `year` is 1-based, because two of these
 * posts do not start until Year 2 and a founding year that pays for
 * them is a founding year that is not being modelled honestly.
 */
export function fixedEstablishment(year) {
  const ID = PLAN.institutional_development_usd;
  const posts = PLAN.staffing.roles
    .filter((r) => !r.per_n_students && r.from_year <= year)
    .reduce((a, r) => a + r.salary_usd, 0) * OC;
  const examiner = year >= ID.external_examiner_usd_from_year ? ID.external_examiner_usd : 0;
  return posts + PLAN.technology_usd.floor_per_year + PLAN.operating_usd.floor_per_year + examiner;
}

/** The same at steady state — every fixed post in post. */
export const FIXED_INSTITUTIONAL = fixedEstablishment(PLAN.planning_period.years);

/** Institutional development — publishing, accreditation work, academic
 *  research and partnership development — funded as a share of net
 *  tuition rather than out of surplus, because a line funded out of
 *  surplus is the line cut in the year it is most needed. The External
 *  Examiner sits in the fixed establishment above and is NOT charged
 *  again here. */
export const DEVELOPMENT_SHARE = PLAN.institutional_development_usd.share_of_net_tuition;

/** Gross tuition the College bills and then returns under the 14-day
 *  right of withdrawal. Charged, because a model that books it as
 *  revenue is booking money the College has undertaken to give back. */
export const REFUND_RATE = PLAN.progression.refund_rate_of_gross;

/** Which product a segment buys, given the three prices on offer. */
function allocate(seg, prices) {
  /* WHO STEPS ALL THE WAY DOWN. A buyer whose willingness to pay is far
     below even the Directed price does not buy a cheaper version of
     teaching — there isn't one — they buy the assessment and the award
     and teach themselves. The share that does so rises as Directed
     moves further beyond what the segment will pay. */
  const reachDirected = prices.directed / Math.max(1, seg.wtpFull);
  const toIndependent = Math.max(0, Math.min(0.82, 0.46 * Math.log(Math.max(1.01, reachDirected)) + 0.08));
  // A segment's executive and tutored propensities are properties of the
  // buyer; what price changes is whether they buy at all, and whether a
  // tutored buyer steps down to directed when tutored is dear.
  const stepDown = Math.max(0, Math.min(0.55,
    0.38 * Math.log(Math.max(1.02, prices.tutored / Math.max(1, prices.directed))) ));
  const exec = seg.execShare * (1 - toIndependent * 0.5);
  const tutored = seg.tutoredShare * (1 - stepDown) * (1 - toIndependent);
  const rest = Math.max(0, 1 - exec - tutored);
  const independent = rest * toIndependent;
  const directed = Math.max(0, rest - independent);
  return { execPremium: exec * 0.34, execCore: exec * 0.66, tutored, directed, independent };
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

  let learners = 0, revenue = 0, delivery = 0, acquisition = 0, levels = 0, c2 = 0, hours = 0;
  /* WHEN THE MONEY ARRIVES, not merely how much. A cohort admitted in
     one year is still being taught in the next: at four months a level,
     Levels I–III fall in the year of entry and Levels IV–VI in the year
     after. A projection that books six levels of fee in the year the
     learner walks in is a projection of a signature, not of teaching.
     Index 0 is the entry year; index 1 is the year following. */
  const byLag = [
    { revenue: 0, delivery: 0, hours: 0 },
    { revenue: 0, delivery: 0, hours: 0 },
  ];
  const LEVELS_PER_YEAR_INT = Math.max(1, Math.round(LEVELS_PER_LEARNER_YEAR));
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
      const perLevelHours = attentionHours(pk) / 6;
      for (let i = 0; i < 6; i++) {
        const r = n * prog.each[i] * ladders[pk][i];
        const d = n * prog.each[i] * fullCost(pk, i);
        rev += r; del += d;
        const lag = Math.min(1, Math.floor(i / LEVELS_PER_YEAR_INT));
        byLag[lag].revenue += r;
        byLag[lag].delivery += d;
        byLag[lag].hours += n * prog.each[i] * perLevelHours;
      }
      const cac = CAC[seg.key];
      learners += n; revenue += rev; delivery += del; acquisition += n * cac;
      levels += n * prog.levels; c2 += n * prog.reachC2;
      // Instructor hours the College commits by admitting these
      // learners. Group time counts at its real share, so a class of
      // twelve costs a twelfth of a contact hour per learner and not a
      // whole one, and the establishment follows the timetable rather
      // than a ratio somebody liked the look of.
      for (let i = 0; i < 6; i++) hours += n * prog.each[i] * perLevelHours;
      segLearners += n; segRevenue += rev;
      byProduct[pk] = byProduct[pk] || { learners: 0, revenue: 0, delivery: 0 };
      byProduct[pk].learners += n; byProduct[pk].revenue += rev; byProduct[pk].delivery += del;
    }
    bySegment.push({ key: seg.key, name: seg.name, learners: Math.round(segLearners), revenue: Math.round(segRevenue) });
  }

  // Money billed and then returned under the 14-day right of withdrawal
  // is not revenue, and the development line is funded from what is
  // left rather than from surplus.
  const refunds = revenue * REFUND_RATE;
  const netTuition = revenue - refunds;
  const development = netTuition * DEVELOPMENT_SHARE;
  const surplus = netTuition - delivery - acquisition - fixed - development;
  return {
    prices: Object.fromEntries(Object.entries(prices).map(([k, v]) => [k, Math.round(v)])),
    learners: Math.round(learners),
    levelsDelivered: Math.round(levels),
    awardsToC2: Math.round(c2),
    academicHours: Math.round(hours),
    /** Share of entrants still enrolled at each of the six levels — the
     *  curve that says how many of this year’s admissions are still
     *  being taught next year. */
    progression: prog.each.slice(),
    byLag: byLag.map((b) => ({
      revenue: Math.round(b.revenue), delivery: Math.round(b.delivery), hours: Math.round(b.hours),
    })),
    revenue: Math.round(revenue),
    refunds: Math.round(refunds),
    netTuition: Math.round(netTuition),
    delivery: Math.round(delivery),
    acquisition: Math.round(acquisition),
    fixed: Math.round(fixed),
    development: Math.round(development),
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
  /* ──────────────────────────────────────────────────────────────────
     REVISED 19 SEPTEMBER 2026, AFTER MARKET VALIDATION.
     ──────────────────────────────────────────────────────────────────
     The previous proposal — $8,900 / $18,500 / $34,000 / $58,000 /
     $96,000 — was built on willingness-to-pay figures that were
     modelled and not researched, and the model said so. The research
     moved four of the five segments and one of them by a factor of
     three. Every taught price below has come down.

     WHAT THE EVIDENCE SAID, in the order it mattered:

     · NIGERIA. A Lagos IELTS course is NGN 75,000 a month, about $49;
       two years of study at the going rate is about $1,176 and the
       whole published Nigerian range tops out near $1,817. The model
       had assumed $6,400. No taught WEC-LC tier reaches that market at
       any price the College could deliver at, and inventing a cheap
       taught tier would be selling supervision it could not staff.
       West Africa is served by the ADOPTED independent route instead.

     · SAUDI ARABIA. The British Council publishes a CEFR-levelled adult
       ladder at SAR 77 an hour; a full A2–C1 ladder computes to about
       $10,600–$14,100. Tutored at $18,500 was above that; $15,500 sits
       between what a Gulf professional family and a European buyer
       will pay.

     · EXECUTIVE. The previous tiers were priced against executive
       COACHING at $200–600 an hour. That was borrowing credibility
       from a different market: executive LANGUAGE training runs $50–
       $120 an hour one to one. The revised tiers sit above the
       language market and below the coaching market, which is where a
       credentialed one-to-one language programme actually belongs.

     AND THE ONE NUMBER THAT WENT UP IN CONFIDENCE RATHER THAN DOWN:
     Tutored at $15,500 is $158 per hour of individual instructor
     attention, against the British Council in Saudi Arabia at $237–
     $331 for the same unit. WEC-LC is cheaper per hour of a teacher's
     attention than the British Council, and it confers an award.
     ────────────────────────────────────────────────────────────────── */
  classification: 'proposed',
  validated: '2026-09-19',
  committed: {
    /* ADOPTED, not proposed: data/commercial.json § routes.independent,
       $150 + $250 + $200 a level across six levels. Unchanged by this
       plan, and now carrying the markets the taught tiers cannot. */
    independent: 3600,
    directed: 8500,
    tutored: 15500,
    execCore: 28000,
    execPremium: 46000,
    execBespoke: 76000,
  },
  previous: {
    _: 'The pre-validation proposal, kept so the change is auditable.',
    directed: 8900, tutored: 18500, execCore: 34000, execPremium: 58000, execBespoke: 96000,
  },
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
