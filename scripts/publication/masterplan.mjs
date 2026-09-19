/**
 * THE TEN-YEAR MODEL — computed, never typed.
 *
 * ────────────────────────────────────────────────────────────────────
 * THE ORDER THIS MODEL RUNS IN, AND WHY THE ORDER IS THE ARGUMENT
 * ────────────────────────────────────────────────────────────────────
 * Most institutional plans run backwards: a revenue target is chosen,
 * an enrolment number is derived that reaches it, and assumptions are
 * fitted afterwards. The number is then unfalsifiable, because nothing
 * in the model could ever have produced a different one.
 *
 * This model runs forwards, and it is constrained twice:
 *
 *   acquisition budget  ÷  cost per acquired learner
 *        → enquiries → qualified → consultation → application
 *        → offer → PAID ENROLMENTS
 *        ↓  capped by
 *   instructors hired  ×  learners each can actually teach
 *        ↓
 *   cohorts progress level by level at published completion and
 *   continuation rates, over four months a level
 *        ↓
 *   revenue is RECOGNISED as levels are delivered, not as cash arrives
 *        ↓
 *   cost of delivering it is subtracted
 *        ↓
 *   surplus, reserve, reinvestment, capacity for the following year
 *
 * It is therefore impossible to improve the headline without either
 * spending more to be found, hiring more people to teach, or keeping
 * more learners — which are the three things a college actually does.
 *
 * ────────────────────────────────────────────────────────────────────
 * WHAT IS GIVEN AND WHAT IS ASSERTED
 * ────────────────────────────────────────────────────────────────────
 * The price, the levels, the hours, the fee decomposition, the
 * independent step fees, the partner bands, the remission fund and the
 * referral credit are READ from data/tuition.json and
 * data/commercial.json. They are the College's adopted commercial
 * record and this file does not restate them.
 *
 * Everything else comes from data/masterplan.json and is classified
 * there as an assumption. tests/masterplan.test.mjs fails the build if
 * any figure in the published plan cannot be traced to one of those
 * three files.
 */

import { readFileSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..');
const read = (p) => JSON.parse(readFileSync(path.join(ROOT, p), 'utf8'));

export const TUITION = read('data/tuition.json');
export const COMMERCIAL = read('data/commercial.json');
export const PLAN = read('data/masterplan.json');

/** The adopted commercial basis, imported rather than restated. */
export function basis() {
  const levelFee = TUITION.level_fee_cents / 100;
  const indep = Object.fromEntries(
    COMMERCIAL.routes.independent.steps.map((s) => [s.key, s.cents / 100]),
  );
  return {
    programmeTotal: TUITION.programme_total_usd,
    levels: TUITION.levels,
    levelFee,
    hoursPerLevel: TUITION.hours_per_level,
    totalHours: TUITION.levels * TUITION.hours_per_level,
    creditsPerLevel: TUITION.credits_per_level,
    totalCredits: TUITION.levels * TUITION.credits_per_level,
    perHour: TUITION.programme_total_usd / (TUITION.levels * TUITION.hours_per_level),
    perCredit: TUITION.programme_total_usd / (TUITION.levels * TUITION.credits_per_level),
    monthsPerLevel: TUITION.levels && PLAN.progression.months_per_level,
    instalmentsPerLevel: TUITION.instalments_per_level,
    instalment: levelFee / TUITION.instalments_per_level,
    refundWindowDays: TUITION.refund_window_days,
    independent: indep,
    independentPerLevel: Object.values(indep).reduce((a, b) => a + b, 0),
    partnerBands: COMMERCIAL.routes.partner.bands.map((b) => ({ from: b.from, to: b.to, rate: b.bp / 10000 })),
    remissionShare: COMMERCIAL.remission.fund_bp_of_tuition / 10000,
    referralCredit: COMMERCIAL.referral.credit_cents / 100,
    lines: TUITION.lines.map((l) => ({
      key: l.key, name: l.en.name, share: l.bp / 10000,
      perLevel: levelFee * (l.bp / 10000),
      perProgramme: TUITION.programme_total_usd * (l.bp / 10000),
    })),
  };
}

const round = (n, p = 0) => {
  const f = 10 ** p;
  return Math.round((Number(n) || 0) * f) / f;
};

/** The weighted price one newly-enrolled learner pays for ONE level. */
function levelPriceFor(region, B, scenarioPartnerDelta) {
  const partner = Math.max(0, Math.min(1, region.partner_share + scenarioPartnerDelta));
  const rest = 1 - partner;
  const scale = region.enrolled_share + region.independent_share;
  const enrolled = scale > 0 ? rest * (region.enrolled_share / scale) : 0;
  const independent = scale > 0 ? rest * (region.independent_share / scale) : 0;

  // A sponsored cohort is enrolled tuition at a band. The middle band
  // is used because it is the one a sponsor of a realistic size falls
  // into; the bands themselves are published and are not modelled away.
  const partnerRate = B.partnerBands[1].rate;
  return {
    price: enrolled * B.levelFee
      + independent * B.independentPerLevel
      + partner * B.levelFee * (1 - partnerRate),
    mix: { enrolled, independent, partner },
  };
}

/**
 * One scenario, ten years, every intermediate quantity retained.
 */
export function model(scenarioKey = 'base') {
  const B = basis();
  const S = PLAN.scenarios[scenarioKey];
  if (!S) throw new Error(`No scenario "${scenarioKey}"`);
  const YEARS = PLAN.planning_period.years;
  const F = PLAN.funnel;
  const P = PLAN.progression;
  const D = PLAN.delivery_capacity;

  /* THE MODEL RUNS IN TERMS, NOT IN YEARS, and that correction is worth
     stating because the first draft of this engine did not and was
     wrong by a factor of three.

     A level takes four months. A learner who enrols in January and
     continues can finish Level I in April, Level II in August and
     Level III in December — three levels in one year, three fee
     events, three assessments, three instructor loads. A year-stepped
     model books one, and then reports an institution whose learners
     each generate a third of the revenue they actually do while
     costing the full year of teaching. It made the College look
     structurally loss-making at every scale, which is not a finding;
     it is an arithmetic error wearing the clothes of one. */
  const TERMS_PER_YEAR = 12 / P.months_per_level;

  /* HOW MANY LEARNERS ONE INSTRUCTOR CARRIES — derived from the fee,
     not asserted beside it. data/tuition.json gives 36 per cent of
     every level fee to a named instructor; that share, divided by what
     an instructor costs, IS the caseload the College has sold. Asserting
     a larger one would be selling supervision at 36 per cent and
     staffing it at 19. See data/masterplan.json § delivery_capacity. */
  const teachingShare = B.lines.find((l) => l.key === 'teaching').share;
  const loadedInstructor = D.instructor_cost_usd * (1 + D.instructor_oncost_rate);

  const offerToPaid = Math.max(0.05, F.offer_to_paid + S.offer_to_paid_delta);
  const funnelRate = F.enquiry_to_qualified * F.qualified_to_consultation
    * F.consultation_to_application * F.application_to_offer * offerToPaid;

  // studying[l] = learners part-way through level l, by route class.
  // Independent candidates are tracked separately throughout because
  // they buy assessment and not teaching, and conflating the two is
  // what makes an unexamined model hire instructors for people who
  // never asked for one.
  let taught = new Array(B.levels).fill(0);
  let indep = new Array(B.levels).fill(0);
  let instructors = 0;
  let reserve = 0;
  let cumRevenue = 0;
  const years = [];

  for (let y = 0; y < YEARS; y++) {
    const budget = PLAN.acquisition_budget_usd.by_year[y];

    const open = PLAN.market.regions.filter((r) => r.opens_year <= y + 1);
    const rawW = open.map((r) => PLAN.acquisition_budget_usd.regional_weights_by_year[r.key][y]);
    const wSum = rawW.reduce((a, b) => a + b, 0) || 1;

    const regional = open.map((r, i) => {
      const share = rawW[i] / wSum;
      const spend = budget * share;
      const cac = r.cac_usd * S.cac_multiplier;
      const paid = spend / cac;
      const enquiries = paid / funnelRate;
      const { price, mix } = levelPriceFor(r, B, S.partner_share_delta);
      return { region: r, share, spend, cac, paid, enquiries, price, mix };
    });

    const demandedYear = regional.reduce((n, r) => n + r.paid, 0);
    const taughtShare = regional.length
      ? regional.reduce((n, r) => n + (r.mix.enrolled + r.mix.partner) * (r.paid / (demandedYear || 1)), 0)
      : 1;
    const weightedPrice = regional.length
      ? regional.reduce((n, r) => n + r.price * (r.paid / (demandedYear || 1)), 0)
      : B.levelFee;
    // What a TAUGHT learner pays, separately from the blended figure —
    // the instructor is hired against this, not against the average.
    const taughtPrice = regional.length
      ? regional.reduce((n, r) => {
        const w = r.paid / (demandedYear || 1);
        const t = r.mix.enrolled + r.mix.partner;
        if (t <= 0) return n;
        const partnerRate = B.partnerBands[1].rate;
        return n + w * ((r.mix.enrolled * B.levelFee + r.mix.partner * B.levelFee * (1 - partnerRate)) / t);
      }, 0)
      : B.levelFee;

    // Levels a taught learner completes in a year, at the published
    // completion rates — the denominator of the caseload.
    const levelsPerLearnerYear = TERMS_PER_YEAR
      * (P.level_completion.reduce((a, b) => a + b, 0) / P.level_completion.length);
    const learnersPerInstructor = Math.max(8,
      loadedInstructor / (taughtPrice * teachingShare * levelsPerLearnerYear));

    let yearLevelsTaught = 0;
    let yearLevelsIndep = 0;
    let yearAdmitted = 0;
    let yearTurnedAway = 0;
    const yearCompletions = new Array(B.levels).fill(0);

    for (let t = 0; t < TERMS_PER_YEAR; t++) {
      const wantTaught = demandedYear / TERMS_PER_YEAR * taughtShare;
      const wantIndep = demandedYear / TERMS_PER_YEAR * (1 - taughtShare);

      // ── The capacity gate, on taught learners only ────────────────
      const taughtInProgress = taught.reduce((a, b) => a + b, 0);
      const need = Math.ceil((taughtInProgress + wantTaught) / learnersPerInstructor);
      // Hiring is bounded: a college cannot double its faculty in a
      // term and keep the standard the faculty exists to hold.
      instructors = Math.max(instructors, Math.min(need, instructors + Math.ceil(instructors * 0.25) + 2));
      const capacity = instructors * learnersPerInstructor;
      const admitTaught = Math.max(0, Math.min(wantTaught, capacity - taughtInProgress));
      yearTurnedAway += wantTaught - admitTaught;
      yearAdmitted += admitTaught + wantIndep;

      taught[0] += admitTaught;
      indep[0] += wantIndep;

      // ── One term passes: every level in progress is completed or not
      const nextTaught = new Array(B.levels).fill(0);
      const nextIndep = new Array(B.levels).fill(0);
      for (let l = 0; l < B.levels; l++) {
        const cRate = P.level_completion[l];
        const doneT = taught[l] * cRate;
        const doneI = indep[l] * cRate;
        yearLevelsTaught += doneT;
        yearLevelsIndep += doneI;
        yearCompletions[l] += doneT + doneI;
        const cont = P.continues_to_next[l];
        if (cont != null) {
          const r = Math.max(0, Math.min(1, cont + S.continuation_delta));
          nextTaught[l + 1] += doneT * r;
          nextIndep[l + 1] += doneI * r;
        }
      }
      taught = nextTaught;
      indep = nextIndep;
    }

    const activeTaught = taught.reduce((a, b) => a + b, 0);
    const activeIndep = indep.reduce((a, b) => a + b, 0);
    const activeNow = activeTaught + activeIndep;

    // ── Revenue, recognised as levels are delivered ──────────────────
    const grossTuition = yearLevelsTaught * taughtPrice + yearLevelsIndep * B.independentPerLevel;
    const refunds = grossTuition * P.refund_rate_of_gross;
    const remission = grossTuition * B.remissionShare;
    const netTuition = grossTuition - refunds - remission;

    // ── Cost ─────────────────────────────────────────────────────────
    const instructorCost = instructors * D.instructor_cost_usd * (1 + D.instructor_oncost_rate);
    const establishment = PLAN.staffing.roles.filter((r) => r.from_year <= y + 1).map((r) => {
      const heads = r.per_n_students ? Math.max(1, Math.ceil(activeNow / r.per_n_students)) : 1;
      return { key: r.key, name: r.name, heads, cost: heads * r.salary_usd * (1 + PLAN.staffing.oncost_rate) };
    });
    const establishmentCost = establishment.reduce((n, r) => n + r.cost, 0);
    const technology = PLAN.technology_usd.floor_per_year + activeNow * PLAN.technology_usd.per_active_learner;
    const operating = PLAN.operating_usd.floor_per_year + activeNow * PLAN.operating_usd.per_active_learner;
    const development = netTuition * PLAN.institutional_development_usd.share_of_net_tuition
      + (y + 1 >= PLAN.institutional_development_usd.external_examiner_usd_from_year
        ? PLAN.institutional_development_usd.external_examiner_usd : 0);

    const totalCost = budget + instructorCost + establishmentCost + technology + operating + development;
    const surplus = netTuition - totalCost;
    const reserveAdd = surplus > 0 ? surplus * PLAN.reserve.contribution_share_of_surplus : surplus;
    const openingReserve = reserve;
    reserve = Math.max(0, reserve + reserveAdd);
    cumRevenue += netTuition;
    const monthlyOperating = totalCost / 12;

    const enq = regional.reduce((n, r) => n + r.enquiries, 0);
    years.push({
      year: y + 1,
      calendar: PLAN.planning_period.first_year + y,
      budget,
      regional: regional.map((r) => ({
        key: r.region.key, name: r.region.name, spend: round(r.spend), cac: round(r.cac),
        enquiries: round(r.enquiries), paid: round(r.paid, 1), price: round(r.price, 2), mix: r.mix,
      })),
      funnel: {
        enquiries: round(enq),
        qualified: round(enq * F.enquiry_to_qualified),
        consultations: round(enq * F.enquiry_to_qualified * F.qualified_to_consultation),
        applications: round(enq * F.enquiry_to_qualified * F.qualified_to_consultation * F.consultation_to_application),
        offers: round(enq * F.enquiry_to_qualified * F.qualified_to_consultation * F.consultation_to_application * F.application_to_offer),
        paid: round(demandedYear),
      },
      demanded: round(demandedYear),
      admitted: round(yearAdmitted),
      turnedAway: round(yearTurnedAway),
      instructors,
      learnersPerInstructor: round(learnersPerInstructor, 1),
      capacity: round(instructors * learnersPerInstructor),
      activeStudents: round(activeNow),
      activeTaught: round(activeTaught),
      activeIndependent: round(activeIndep),
      taughtShare: round(taughtShare, 4),
      levelsDelivered: round(yearLevelsTaught + yearLevelsIndep, 1),
      levelsTaught: round(yearLevelsTaught, 1),
      levelsIndependent: round(yearLevelsIndep, 1),
      completionsByLevel: yearCompletions.map((c) => round(c, 1)),
      awardsConferred: round(yearCompletions.reduce((a, b) => a + b, 0), 1),
      fullPathwayCompletions: round(yearCompletions[B.levels - 1], 1),
      weightedPrice: round(weightedPrice, 2),
      taughtPrice: round(taughtPrice, 2),
      grossTuition: round(grossTuition),
      refunds: round(refunds),
      remission: round(remission),
      netTuition: round(netTuition),
      cost: {
        acquisition: round(budget),
        instruction: round(instructorCost),
        establishment: round(establishmentCost),
        establishmentDetail: establishment.map((e) => ({ ...e, cost: round(e.cost) })),
        technology: round(technology),
        operating: round(operating),
        development: round(development),
        total: round(totalCost),
      },
      surplus: round(surplus),
      margin: netTuition > 0 ? round(surplus / netTuition, 4) : 0,
      openingReserve: round(openingReserve),
      reserveContribution: round(reserveAdd),
      closingReserve: round(reserve),
      reserveMonths: monthlyOperating > 0 ? round(reserve / monthlyOperating, 1) : 0,
      cumulativeRevenue: round(cumRevenue),
      revenuePerActive: activeNow > 0 ? round(netTuition / activeNow) : 0,
      costPerAcquisition: demandedYear > 0 ? round(budget / demandedYear) : 0,
    });
  }

  const total = (f) => round(years.reduce((n, y) => n + f(y), 0));
  return {
    scenario: S.name,
    key: scenarioKey,
    basis: B,
    years,
    totals: {
      grossTuition: total((y) => y.grossTuition),
      refunds: total((y) => y.refunds),
      remission: total((y) => y.remission),
      netTuition: total((y) => y.netTuition),
      cost: total((y) => y.cost.total),
      surplus: total((y) => y.surplus),
      awardsConferred: round(years.reduce((n, y) => n + y.awardsConferred, 0)),
      levelsDelivered: round(years.reduce((n, y) => n + y.levelsDelivered, 0)),
      acquisition: total((y) => y.cost.acquisition),
      instruction: total((y) => y.cost.instruction),
      closingReserve: years[years.length - 1].closingReserve,
      peakActive: Math.max(...years.map((y) => y.activeStudents)),
      finalYearNet: years[years.length - 1].netTuition,
    },
  };
}

/** Every scenario, side by side. */
export function allScenarios() {
  return ['conservative', 'base', 'growth'].map((k) => model(k));
}

/**
 * BREAK-EVEN, stated as the thing a principal actually asks: how many
 * learners must be studying for the year to pay for itself.
 */
export function breakEven(scenarioKey = 'base') {
  const m = model(scenarioKey);
  return m.years.map((y) => {
    // Fixed cost is everything that does not move with one more learner.
    const variable = PLAN.technology_usd.per_active_learner + PLAN.operating_usd.per_active_learner;
    const fixed = y.cost.total - y.activeStudents * variable;
    const contributionPerLearner = (y.activeStudents > 0 ? y.netTuition / y.activeStudents : 0) - variable;
    return {
      year: y.year,
      calendar: y.calendar,
      fixedCost: round(fixed),
      contributionPerLearner: round(contributionPerLearner),
      breakEvenLearners: contributionPerLearner > 0 ? Math.ceil(fixed / contributionPerLearner) : null,
      actualLearners: y.activeStudents,
      clears: contributionPerLearner > 0 && y.activeStudents >= fixed / contributionPerLearner,
    };
  });
}

/** Single-variable shocks against the expected case. */
export function sensitivity() {
  const base = model('base');
  return PLAN.sensitivity.cases.map((c) => {
    const shocked = JSON.parse(JSON.stringify(base));
    let net = 0, surplus = 0;
    for (const y of shocked.years) {
      let n = y.netTuition, s = y.surplus;
      if (c.field === 'enrolment') { n *= (1 + c.delta); s = n - y.cost.total; }
      if (c.field === 'cac') { const extra = y.cost.acquisition * c.delta; s -= extra; }
      if (c.field === 'instructor') { s -= y.cost.instruction * c.delta; }
      if (c.field === 'continuation') { n *= (1 + c.delta * 1.6); s = n - y.cost.total; }
      if (c.field === 'gcc') {
        const g = y.regional.find((r) => r.key === 'gcc');
        const gShare = g ? g.paid / Math.max(1, y.demanded) : 0;
        n *= (1 + gShare * c.delta); s = n - y.cost.total;
      }
      if (c.field === 'refund') { n -= y.refunds * c.delta; s -= y.refunds * c.delta; }
      if (c.field === 'technology') { s -= y.cost.technology * c.delta; }
      net += n; surplus += s;
    }
    return {
      key: c.key, label: c.label,
      netTuition: round(net),
      netDelta: round(net - base.totals.netTuition),
      netDeltaPct: round((net - base.totals.netTuition) / base.totals.netTuition, 4),
      surplus: round(surplus),
      surplusDelta: round(surplus - base.totals.surplus),
    };
  });
}

/**
 * ALTERNATIVE ARCHITECTURE A — the commissioning brief's ten-level,
 * 120-hour, $7,400/$14,800 structure, computed against the same
 * enrolment the adopted architecture produces, so the comparison is of
 * PRICE AND STRUCTURE rather than of two different institutions.
 */
export function alternativeA() {
  const B = basis();
  const A = PLAN.alternative_architecture_a;
  const m = model('base');
  const blended = A.directed_total_usd * (1 - A.assumed_tutored_share)
    + A.tutored_total_usd * A.assumed_tutored_share;
  const perLevelA = blended / A.levels;
  const ratio = blended / B.programmeTotal;

  return {
    adopted: {
      levels: B.levels, hoursPerLevel: B.hoursPerLevel, totalHours: B.totalHours,
      programmeTotal: B.programmeTotal, perLevel: round(B.levelFee, 2),
      perHour: round(B.perHour, 2), perCredit: round(B.perCredit, 2),
    },
    proposed: {
      levels: A.levels, hoursPerLevel: A.hours_per_level, totalHours: A.levels * A.hours_per_level,
      directed: A.directed_total_usd, tutored: A.tutored_total_usd,
      tutoredShare: A.assumed_tutored_share,
      blendedProgramme: round(blended, 2),
      perLevel: round(perLevelA, 2),
      perHour: round(blended / (A.levels * A.hours_per_level), 2),
    },
    effect: {
      priceRatio: round(ratio, 4),
      tenYearNetAdopted: m.totals.netTuition,
      tenYearNetProposed: round(m.totals.netTuition * ratio),
      tenYearDelta: round(m.totals.netTuition * ratio - m.totals.netTuition),
      // The cost of teaching does not fall because the price does. That
      // is the whole finding, and it is arithmetic rather than opinion.
      tenYearCost: m.totals.cost,
      surplusAdopted: m.totals.surplus,
      surplusProposed: round(m.totals.netTuition * ratio - m.totals.cost),
    },
  };
}

/** Where every dollar of net tuition goes, reconciled to 100%. */
export function allocation(scenarioKey = 'base') {
  const m = model(scenarioKey);
  const net = m.totals.netTuition;
  const rows = [
    ['instruction', 'Academic delivery and instruction', m.totals.instruction],
    ['acquisition', 'Student acquisition and admissions', m.totals.acquisition],
    ['establishment', 'Academic administration and establishment', m.years.reduce((n, y) => n + y.cost.establishment, 0)],
    ['technology', 'Platform, infrastructure and security', m.years.reduce((n, y) => n + y.cost.technology, 0)],
    ['operating', 'Institutional operations and compliance', m.years.reduce((n, y) => n + y.cost.operating, 0)],
    ['development', 'Publishing, examination and institutional development', m.years.reduce((n, y) => n + y.cost.development, 0)],
  ].map(([key, name, amount]) => ({ key, name, amount: round(amount), share: round(amount / net, 4) }));

  const spent = rows.reduce((n, r) => n + r.amount, 0);
  const retained = net - spent;
  rows.push({ key: 'retained', name: 'Reserve and institutional capital', amount: round(retained), share: round(retained / net, 4) });
  return { net: round(net), rows, reconciles: Math.abs(rows.reduce((n, r) => n + r.amount, 0) - net) < 2 };
}
