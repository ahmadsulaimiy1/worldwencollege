/**
 * THE TEN-YEAR ENGINE — term by term, from zero.
 *
 * One chain, run in the order the owner set for the plan:
 *
 *   acquisition spend -> enquiries -> applications -> placements -> offers
 *   -> enrolments -> learners at each level -> completions and awards
 *   -> the academic work the service specification requires
 *   -> the establishment that work needs, hired a term ahead
 *   -> payroll, technology, operations, acquisition, collection
 *   -> revenue as taught -> cash
 *
 * The time step is the TERM, because the term is the unit the College
 * actually runs on: one level, one intake, one examination, one
 * moderation. Years are sums of terms.
 *
 * Nothing here is a share of revenue. Every cost has a driver, and every
 * driver is counted.
 */
import {
  QUALIFICATION as Q, ROUTES, PEOPLE, PLATFORM, OPERATIONS, MARKETS, POLICY, PROGRESSION,
  val, stepValue, termIndex, yearOf, termLabel, TERMS, TERMS_PER_YEAR, FIRST_YEAR, LAST_YEAR,
  LEVELS, ROUTE_KEYS, MARKET_KEYS, FX,
} from './record.mjs';
import * as SVC from './service.mjs';

const MONTHS = val(Q.structure.monthsPerTerm);
const T3 = TERMS_PER_YEAR;
const ceil = Math.ceil;
const sum = (xs) => xs.reduce((t, x) => t + x, 0);

// ── Pay ─────────────────────────────────────────────────────────────
const OC = PEOPLE.onCosts;
/** A survey salary carried forward to a year of the plan, in GBP. */
export const salaryIn = (salaryGbp, year, scale = 1) =>
  salaryGbp * Math.pow(1 + val(OC.annualPayRise), year - val(OC.salaryBasisYear)) * scale;
/** The parts of one person's annual cost to the College, in GBP. */
export function payParts(salaryGbp, year, scale = 1) {
  const gross = salaryIn(salaryGbp, year, scale);
  const ni = val(OC.employerNiRate) * Math.max(0, gross - val(OC.employerNiThresholdGbp));
  const pension = val(OC.pensionRate) * gross;
  return { gross, ni, pension, total: gross + ni + pension };
}
/** Loaded annual cost in USD of a salary stated in GBP, in a given year.
 *  The Employment Allowance and the Apprenticeship Levy belong to the
 *  employer, not the person, and are charged in the run. */
export function loadedUsd(salaryGbp, year, scale = 1, fx = FX) {
  return payParts(salaryGbp, year, scale).total * fx;
}
const productiveTermHours = (privateSched) => (val(PEOPLE.teaching.contractedHoursPerYear) / T3)
  * (privateSched ? val(PEOPLE.teaching.deliveryShareWhenPrivate) : val(PEOPLE.teaching.deliveryShare));

// ── The curriculum is written before it is taught ───────────────────
/** Which levels are authored and teachable in each term, and the
 *  authoring hours each term carries. The College opens with Levels I to
 *  III written, and writes one further level a term, each a full term
 *  ahead of the first learner who needs it. */
function authoringSchedule(firstTeach) {
  const perModule = val(Q.establishment.authoringHoursPerModule);
  const modules = val(Q.structure.modulesPerLevel);
  const opening = 3;
  const availableFrom = Array.from({ length: LEVELS }, (_, L) => (L < opening ? firstTeach : firstTeach + (L - opening + 1)));
  const strand = val(ROUTES.routes.executive.strandAuthoringHoursPerLevel);
  const hours = new Array(TERMS).fill(0);
  for (let L = 0; L < LEVELS; L++) {
    const work = perModule * modules + strand;
    if (L < opening) {
      // The opening three levels are written across the two terms before launch.
      for (const t of [firstTeach - 2, firstTeach - 1]) if (t >= 0) hours[t] += work / 2;
    } else {
      const t = availableFrom[L] - 1;
      if (t >= 0 && t < TERMS) hours[t] += work;
    }
  }
  const available = (t) => availableFrom.filter((a) => a <= t).length;
  return { hours, available, availableFrom };
}

// ── Demand ──────────────────────────────────────────────────────────
const F = MARKETS.funnel;
const funnelYield = () => val(F.enquiryToApplication) * val(F.applicationToPlacement)
  * val(F.placementToOffer) * val(F.offerToEnrolment);

function routeMix(market, opts) {
  const mix = { ...val(MARKETS.markets[market].routes) };
  const shift = opts.routeShift;
  if (shift) {
    for (const r of shift.from) {
      if (mix[r]) {
        const moved = mix[r] * shift.share;
        mix[r] -= moved;
        mix[shift.to] = (mix[shift.to] || 0) + moved;
      }
    }
  }
  return mix;
}

// ── The run ─────────────────────────────────────────────────────────
/**
 * @param tariff  level fee in USD for each route, in the plan's first year
 * @param opts    scenario settings (see data/plan/scenarios.json)
 */
export function run(tariff, opts = {}) {
  const o = {
    conversionScale: 1, continuationDelta: 0, enquiryCostScale: 1, teachingPayScale: 1,
    technologyScale: 1, agreementDelayYears: 0, marketDelayTerms: {}, priceElasticity: 0,
    turnAway: null, fxScale: 1, seatsScale: 1, ...opts,
  };
  const fx = FX * o.fxScale;
  const gbp = (x) => x * fx;
  const lead = val(F.leadTerms);
  const completion = val(PROGRESSION.completion);
  const continuation = val(PROGRESSION.continuation).map((c) => Math.max(0, Math.min(1, c + o.continuationDelta)));
  const entry = val(PROGRESSION.entryLevel);

  // The curriculum schedule is anchored to the PLANNED launch: a late
  // market does not unwrite the curriculum.
  const plannedFirst = Math.min(...MARKET_KEYS.map((m) => termIndex(MARKETS.markets[m].opens)));
  const authoring = authoringSchedule(plannedFirst);

  const opensOf = (m) => termIndex(MARKETS.markets[m].opens) + (o.marketDelayTerms[m] || 0);
  const priceIndex = (t) => Math.pow(1 + val(POLICY.tariff.indexation), yearOf(t) - FIRST_YEAR);

  // Price response: the dearer a route stands above Guided, the more of
  // its demand a price-sensitive market withholds.
  const priceFactor = (route) => (o.priceElasticity > 0 && tariff[route] > tariff.guided
    ? Math.pow(tariff[route] / tariff.guided, -o.priceElasticity) : 1);

  // Origins: each market (retail) and each agreement channel.
  const CH = MARKETS.agreements;
  const CH_KEYS = Object.keys(CH);
  const origins = [...MARKET_KEYS.map((m) => ({ key: m, kind: 'retail' })), ...CH_KEYS.map((c) => ({ key: c, kind: 'agreement' }))];

  // ── Acquisition and new entrants, before capacity ─────────────────
  const spend = {}; const enquiries = {}; const newPlanned = {};
  for (const m of MARKET_KEYS) {
    spend[m] = new Array(TERMS).fill(0); enquiries[m] = new Array(TERMS).fill(0);
    const M = MARKETS.markets[m];
    const start = opensOf(m) - lead;
    for (let y = FIRST_YEAR; y <= LAST_YEAR; y++) {
      const terms = [0, 1, 2].map((n) => (y - FIRST_YEAR) * T3 + n).filter((t) => t >= start);
      if (!terms.length) continue;
      const annual = stepValue(val(M.spendUsd), y);
      if (!annual) continue;
      const cpe = val(M.costPerEnquiryUsd) * o.enquiryCostScale
        * Math.pow(Math.max(1, annual / val(M.referenceSpendUsd)), val(F.saturation));
      for (const t of terms) { spend[m][t] = annual / terms.length; enquiries[m][t] = spend[m][t] / cpe; }
    }
  }
  const origination = new Array(TERMS).fill(0);
  const agreementsSigned = {};
  for (const c of CH_KEYS) {
    agreementsSigned[c] = new Array(TERMS).fill(0);
    const C = CH[c];
    const openT = termIndex(C.opens) + o.agreementDelayYears * T3;
    for (let y = FIRST_YEAR; y <= LAST_YEAR; y++) {
      const terms = [0, 1, 2].map((n) => (y - FIRST_YEAR) * T3 + n).filter((t) => t >= openT);
      if (!terms.length) continue;
      const annual = stepValue(val(C.agreementsPerYear), y - o.agreementDelayYears);
      for (const t of terms) {
        agreementsSigned[c][t] = annual / terms.length;
        origination[t] += agreementsSigned[c][t] * val(C.originationUsd);
      }
    }
  }
  /** New learners arriving at term t, by origin and route, split across
   *  the levels that are authored and teachable at t. */
  const arrivals = (t) => {
    const avail = authoring.available(t);
    if (avail === 0) return [];
    const w = entry.slice(0, avail); const wSum = sum(w);
    const out = [];
    for (const m of MARKET_KEYS) {
      const src = t - lead;
      if (src < 0 || t < opensOf(m)) continue;
      const n = enquiries[m][src] * funnelYield() * o.conversionScale;
      if (!(n > 0)) continue;
      for (const [route, share] of Object.entries(routeMix(m, o))) {
        const k = n * share * priceFactor(route);
        for (let L = 0; L < avail; L++) out.push({ origin: m, kind: 'retail', route, level: L, n: k * (w[L] / wSum) });
      }
    }
    for (const c of CH_KEYS) {
      const src = t - lead;
      if (src < 0) continue;
      const seats = agreementsSigned[c][src] * val(CH[c].seatsPerAgreement) * o.seatsScale;
      if (!(seats > 0)) continue;
      for (let L = 0; L < avail; L++) out.push({ origin: c, kind: 'agreement', route: CH[c].route, level: L, n: seats * (w[L] / wSum) });
    }
    return out;
  };

  // ── Flow and capacity, solved together ────────────────────────────
  // Four passes: the establishment the College can recruit bounds the
  // learners it can admit, and the learners it admits set the
  // establishment it needs.
  let admitShare = new Array(TERMS).fill(1);
  let result = null;
  for (let pass = 0; pass < 5; pass++) {
    result = simulate(admitShare);
    const next = result.admitShare;
    if (next.every((a, i) => Math.abs(a - admitShare[i]) < 1e-4)) break;
    admitShare = next;
  }
  return result;

  function simulate(admit) {
    const key = (x) => `${x.origin}|${x.route}`;
    const present = []; // present[t] = Map key -> Float64Array(levels)
    const terms = [];
    let carry = new Map();
    let holders = 0;
    const storageStock = [];

    // Pass 1: learners and academic work per term.
    for (let t = 0; t < TERMS; t++) {
      const now = new Map();
      const add = (k, L, n) => {
        if (!now.has(k)) now.set(k, new Float64Array(LEVELS));
        now.get(k)[L] += n;
      };
      for (const [k, arr] of carry) arr.forEach((n, L) => { if (n > 0) add(k, L, n); });
      let newN = 0; let newHolders = 0;
      const newBy = {};
      const arrivalsNow = arrivals(t);
      const plannedN = sum(arrivalsNow.map((a) => a.n));
      for (const a of arrivalsNow) {
        const n = a.n * admit[t];
        add(key(a), a.level, n); newN += n; newHolders += n * completion[a.level];
        newBy[a.origin] = newBy[a.origin] || {};
        newBy[a.origin][a.route] = (newBy[a.origin][a.route] || 0) + n;
      }
      holders += newHolders;
      // Completion and continuation into the next term.
      const next = new Map(); let awards = 0;
      for (const [k, arr] of now) {
        const nx = new Float64Array(LEVELS);
        arr.forEach((n, L) => {
          const done = n * completion[L]; awards += done;
          if (L < LEVELS - 1) nx[L + 1] += done * continuation[L];
        });
        next.set(k, nx);
      }
      carry = next;
      present.push(now);
      terms.push({ t, newN, plannedN, awards, holders, newBy });
    }

    // Pass 2: the work each term requires, by grade.
    const work = terms.map(({ t }) => {
      const now = present[t];
      const hours = { standard: 0, senior: 0, admin: 0 };
      const byRouteLevel = {};
      let active = 0; let learnerLevels = 0;
      for (const [k, arr] of now) {
        const route = k.split('|')[1];
        const g = SVC.grade(route) === 'senior' ? 'senior' : 'standard';
        arr.forEach((n, L) => {
          if (!(n > 0)) return;
          active += n; learnerLevels += n;
          hours[g] += n * (SVC.assessmentHours(L).total + SVC.individualHours(route).total);
          hours.admin += n * SVC.administrativeHours(route);
          const rl = `${route}|${L}`; byRouteLevel[rl] = (byRouteLevel[rl] || 0) + n;
        });
      }
      // Seminar sections: learners on a route at a level share a room,
      // whichever market or buyer brought them.
      let sections = 0; let seminarSeats = 0;
      for (const [rl, n] of Object.entries(byRouteLevel)) {
        const route = rl.split('|')[0];
        const cap = SVC.sectionCap(route);
        if (!cap) continue;
        const s = ceil(n - 1e-9 > 0 ? n / cap : 0);
        sections += s; seminarSeats += s * cap;
        const g = SVC.grade(route) === 'senior' ? 'senior' : 'standard';
        hours[g] += s * SVC.sectionHours(route);
      }
      // Institutional academic work.
      const levelsTaught = new Set(Object.keys(byRouteLevel).map((rl) => rl.split('|')[1])).size;
      const avail = authoring.available(t);
      const inst = {
        authoring: authoring.hours[t],
        moderation: levelsTaught * val(Q.institutionalWork.moderationHoursPerLevelTerm),
        board: active > 0 ? val(Q.institutionalWork.examinationBoardHoursPerTerm) : 0,
        papers: avail > 0 || authoring.available(t + 1) > 0
          ? (Math.max(avail, authoring.available(t + 1)) * val(Q.institutionalWork.paperVersionsPerLevelYear) * val(Q.institutionalWork.hoursPerPaperVersion)) / T3 : 0,
        maintenance: (avail * val(Q.structure.modulesPerLevel) * val(Q.institutionalWork.curriculumMaintenanceHoursPerModuleYear)) / T3,
        quality: yearOf(t) >= FIRST_YEAR + 1 ? val(Q.institutionalWork.qualityReviewHoursPerYear) / T3 : 0,
      };
      hours.standard += sum(Object.values(inst));
      return { hours, inst, active, learnerLevels, sections, seminarSeats, byRouteLevel };
    });

    // Pass 3: the establishment, hired a term ahead and within what
    // recruitment can actually deliver.
    const hireCap = (prev) => Math.max(val(PEOPLE.hiring.minPerTerm), ceil(prev * val(PEOPLE.hiring.growthPerTerm)));
    const need = (g) => work.map((w) => ceil(w.hours[g] / productiveTermHours(g === 'senior') - 1e-9));
    const target = { standard: need('standard'), senior: need('senior') };
    const employed = { standard: [], senior: [] };
    const shortfall = new Array(TERMS).fill(0);
    for (const g of ['standard', 'senior']) {
      let prev = 0;
      for (let t = 0; t < TERMS; t++) {
        const want = Math.max(target[g][t], t + 1 < TERMS ? target[g][t + 1] : target[g][t]);
        const e = Math.min(want, prev + hireCap(prev));
        employed[g].push(e); prev = e;
        const capacityHours = e * productiveTermHours(g === 'senior');
        if (capacityHours + 1e-6 < work[t].hours[g]) shortfall[t] = Math.max(shortfall[t], work[t].hours[g] - capacityHours);
      }
    }
    // Where the establishment could not be recruited in time, continuing
    // learners are taught first and new admissions are held back.
    const nextAdmit = admit.slice();
    for (let t = 0; t < TERMS; t++) {
      if (shortfall[t] > 0 && terms[t].newN > 0) {
        // The share of the term's work that new admissions bring, read
        // from the term itself rather than assumed.
        const newHours = (work[t].hours.standard + work[t].hours.senior) * (terms[t].newN / Math.max(1, work[t].active));
        const cut = Math.min(1, shortfall[t] / Math.max(1, newHours));
        nextAdmit[t] = Math.max(0, admit[t] * (1 - cut));
      } else if (shortfall[t] === 0 && admit[t] < 1) {
        nextAdmit[t] = Math.min(1, admit[t] + (1 - admit[t]) * 0.5);
      }
    }

    // Pass 4: money, term by term.
    const channelSet = new Set(CH_KEYS);
    const rows = [];
    let prevHead = {};
    let cumulative = 0;
    let everEnrolled = 0;
    let receivable = 0;
    // An agreement is invoiced in the term it is taught and paid on its
    // buyer's terms; the part paid after the term ends is carried.
    const DAYS_PER_TERM = 365 / T3;
    for (let t = 0; t < TERMS; t++) {
      const y = yearOf(t); const W = work[t]; const now = present[t];
      const idx = priceIndex(t);

      // Revenue, recognised in the term it is taught.
      let retailGross = 0; let agreementGross = 0; let retailLevels = 0;
      let carried = 0;
      const retailByMarket = {};
      const byRoute = {}; const byMarket = {}; const byOrigin = {};
      for (const [k, arr] of now) {
        const [origin, route] = k.split('|');
        const n = sum([...arr]);
        if (!(n > 0)) continue;
        const isAgreement = channelSet.has(origin);
        const fee = tariff[route] * idx * (isAgreement ? 1 - val(CH[origin].discount) : 1);
        const rev = n * fee;
        if (isAgreement) {
          agreementGross += rev;
          carried += rev * Math.min(1, val(CH[origin].receivableDays) / DAYS_PER_TERM);
          for (const [m, s] of Object.entries(val(CH[origin].markets))) {
            byMarket[m] = byMarket[m] || { learners: 0, revenue: 0, viaAgreement: 0 };
            byMarket[m].learners += n * s; byMarket[m].revenue += rev * s; byMarket[m].viaAgreement += n * s;
          }
        } else {
          retailGross += rev; retailLevels += n;
          retailByMarket[origin] = retailByMarket[origin] || { revenue: 0, levels: 0 };
          retailByMarket[origin].revenue += rev; retailByMarket[origin].levels += n;
          byMarket[origin] = byMarket[origin] || { learners: 0, revenue: 0, viaAgreement: 0 };
          byMarket[origin].learners += n; byMarket[origin].revenue += rev;
        }
        byRoute[route] = byRoute[route] || { learners: 0, revenue: 0 };
        byRoute[route].learners += n; byRoute[route].revenue += rev;
        byOrigin[origin] = (byOrigin[origin] || 0) + n;
      }
      const gross = retailGross + agreementGross;
      const refunds = gross * val(POLICY.collection.withdrawalRate);
      const revenue = gross - refunds;

      // Establishment.
      const firstTeach = authoring.availableFrom[0];
      const active = W.active;
      const activeNext = t + 1 < TERMS ? work[t + 1].active : active;
      const enrolNext = t + 1 < TERMS ? terms[t + 1].newN : terms[t].newN;
      const instructors = employed.standard[t] + employed.senior[t];
      const firstExec = (() => {
        for (let u = 0; u < TERMS; u++) {
          for (const [k] of present[u]) if (/\|(executive|bespoke)$/.test(k)) return u;
        }
        return Infinity;
      })();
      const firstChannel = Math.min(...CH_KEYS.map((c) => termIndex(CH[c].opens) + o.agreementDelayYears * T3));
      const head = {};
      for (const [p, P] of Object.entries(PEOPLE.posts)) {
        let from;
        if (P.from === 'channel') from = firstChannel - 1;
        else if (P.from === 'route:executive') from = firstExec - 1;
        else from = termIndex(P.from);
        if (t < from) { head[p] = 0; continue; }
        if (P.kind === 'standing') { head[p] = 1; continue; }
        let n = P.base || 1;
        if (P.perActive) n = Math.max(n, ceil(Math.max(active, activeNext) / P.perActive));
        if (P.perEnrolmentsPerTerm) n = Math.max(n, ceil(Math.max(terms[t].newN, enrolNext) / P.perEnrolmentsPerTerm));
        if (P.perAdministrativeHours) n = Math.max(n, ceil((Math.max(W.hours.admin, t + 1 < TERMS ? work[t + 1].hours.admin : 0) * T3) / P.perAdministrativeHours));
        head[p] = n;
      }
      head.academicLead = t >= firstTeach - 1 ? Math.max(1, ceil(instructors / val(PEOPLE.teaching.instructorsPerAcademicLead))) : 0;

      const salaryOf = (p) => (p === 'academicLead' ? val(PEOPLE.teaching.senior.salaryGbp) : val(PEOPLE.posts[p].salaryGbp));
      // Every person on the payroll this term, with the salary and scale they are paid at.
      const payroll = [
        [employed.standard[t], val(PEOPLE.teaching.instructor.salaryGbp), o.teachingPayScale, 'academic'],
        [employed.senior[t], val(PEOPLE.teaching.senior.salaryGbp), o.teachingPayScale, 'academic'],
        [head.academicLead, salaryOf('academicLead'), o.teachingPayScale, 'academic'],
        ...Object.keys(PEOPLE.posts).map((p) => [head[p], salaryOf(p), 1, 'institution', p]),
      ];
      const bill = { academic: 0, institution: 0, gross: 0, ni: 0 };
      const payByPost = {};
      for (const [n, sal, sc, side, post] of payroll) {
        if (!n) continue;
        const pp = payParts(sal, y, sc);
        bill[side] += (n * pp.total) / T3;
        if (post) payByPost[post] = gbp((n * pp.total) / T3);
        bill.gross += (n * pp.gross) / T3;
        bill.ni += (n * pp.ni) / T3;
      }
      // The employer's own statutory position: the Employment Allowance
      // is set against its National Insurance, and the Apprenticeship Levy
      // is charged on the pay bill above its allowance. Both are spread
      // evenly across the three terms of the year.
      const employmentAllowance = Math.min(bill.ni, val(OC.employmentAllowanceGbp) / T3);
      const levy = Math.max(0, val(OC.apprenticeshipLevyRate) * bill.gross - val(OC.apprenticeshipLevyAllowanceGbp) / T3);
      const statutory = { employmentAllowance: gbp(employmentAllowance), levy: gbp(levy) };
      const payAcademic = gbp(bill.academic);
      const payInstitution = gbp(bill.institution + levy - employmentAllowance);
      // Recruitment: the cost of each person hired this term.
      let recruitment = 0;
      const hires = (now2, before) => Math.max(0, now2 - (before || 0));
      const hireCost = (n, sal) => n * gbp(salaryIn(sal, y)) * val(OC.recruitmentCostShare);
      recruitment += hireCost(hires(employed.standard[t], t ? employed.standard[t - 1] : 0), val(PEOPLE.teaching.instructor.salaryGbp));
      recruitment += hireCost(hires(employed.senior[t], t ? employed.senior[t - 1] : 0), val(PEOPLE.teaching.senior.salaryGbp));
      for (const p of [...Object.keys(PEOPLE.posts), 'academicLead']) {
        recruitment += hireCost(hires(head[p], prevHead[p]), salaryOf(p));
      }
      prevHead = head;
      const staff = instructors + sum(Object.values(head));
      const nonTeaching = sum(Object.values(head));

      // Technology.
      const L = PLATFORM.lines;
      const at = (label) => termIndex(label) <= t;
      // Metered: what is used beyond the plan's included allowance, at the unit rate.
      const over = (used, included, ratePerMillion) => (Math.max(0, used - val(included)) / 1e6) * val(ratePerMillion);
      const H = L.hosting; const D = L.database;
      const requests = active * val(H.requestsPerActiveLearnerMonth);
      const hostingMonth = val(H.fixedUsdPerMonth)
        + over(requests, H.includedRequestsPerMonth, H.usdPerMillionRequests)
        + over(requests * val(H.cpuMsPerRequest), H.includedCpuMsPerMonth, H.usdPerMillionCpuMs);
      everEnrolled += terms[t].newN;
      const recordGb = (everEnrolled * val(D.mbPerLearner)) / 1024;
      const databaseMonth = over(active * val(D.rowsWrittenPerActiveLearnerMonth), D.includedRowsWrittenPerMonth, D.usdPerMillionRowsWritten)
        + Math.max(0, recordGb - val(D.includedGb)) * val(D.usdPerGbMonth);
      storageStock.push(W.learnerLevels * val(L.storage.gbPerLearnerLevel));
      const retention = Math.round(val(L.storage.retentionMonths) / MONTHS);
      const gbHeld = sum(storageStock.slice(Math.max(0, storageStock.length - retention)));
      const emailsMonth = active * val(L.email.emailsPerActiveLearnerMonth);
      const tier = val(L.email.usdPerMonthAt).filter(([vol]) => emailsMonth >= vol).pop();
      const tech = {
        hosting: MONTHS * (hostingMonth + databaseMonth),
        storage: MONTHS * Math.max(0, gbHeld - val(L.storage.includedGb)) * val(L.storage.usdPerGbMonth),
        email: MONTHS * (tier ? tier[1] : 0),
        classroom: MONTHS * instructors * val(L.classroom.usdPerHostMonth),
        workplace: MONTHS * staff * val(L.workplace.usdPerUserMonth),
        security: at(L.security.from) ? gbp(val(L.security.gbpPerYear)) / T3 : 0,
        registry: (terms[t].holders * val(L.registry.usdPerHolderYear)) / T3,
      };
      for (const k of Object.keys(tech)) tech[k] *= o.technologyScale;
      const technology = sum(Object.values(tech));

      // Operations and governance.
      const OL = OPERATIONS.lines;
      // A line's annual amount, stated in dollars or in pounds.
      const yearly = (line) => ('gbpPerYear' in line ? gbp(val(line.gbpPerYear)) : val(line.usdPerYear) || 0);
      const annual = (line) => (line.from && at(line.from) ? yearly(line) / T3 : 0);
      const once = (line) => (line.at && termIndex(line.at) === t
        ? ('gbpOnce' in line ? gbp(val(line.gbpOnce)) : val(line.usdOnce)) : 0);
      const band = (table, x) => table.filter(([from]) => x >= from).pop()[1];
      const desks = ceil(nonTeaching * val(OL.office.deskShareOfNonTeachingStaff));
      // The audit of a year is priced on that year's turnover and paid the year after.
      const lastYearGbp = sum(rows.filter((r) => r.year === y - 1).map((r) => r.revenue.gross)) / fx;
      const AC = OL.accounting;
      const XE = OL.externalExaminer;
      const BA = OL.accreditation;
      const accredited = termIndex(BA.applies);
      const sinceAccredited = t - accredited;
      const inspection = gbp(val(BA.inspectionManagementGbp) + val(BA.inspectionGbp));
      const ops = {
        premises: annual(OL.registeredOffice) + (at(OL.office.from) ? MONTHS * desks * gbp(val(OL.office.gbpPerDeskMonth)) : 0),
        insurance: annual(OL.insurance) + gross * val(OL.insurance.shareOfRevenue),
        assurance: (at(OL.audit.from) ? gbp(band(val(OL.audit.gbpByTurnoverGbp), lastYearGbp)) / T3 : 0)
          + (at(AC.from) ? MONTHS * gbp(val(AC.gbpPerMonth) + staff * val(AC.gbpPerPayslipMonth)) + gbp(val(AC.gbpPerYear)) / T3 : 0)
          + annual(OL.dataProtection) + annual(OL.companiesHouse) + once(OL.companiesHouse),
        legal: annual(OL.legal) + once(OL.establishmentLegal),
        examiner: at(XE.from) ? gbp(val(XE.examiners) * val(XE.gbpPerExaminerYear) + val(XE.chiefSupplementGbp)) / T3 : 0,
        governance: at(OL.governance.from) ? (val(OL.governance.members) * val(OL.governance.usdPerMemberYear)) / T3 : 0,
        // Application and inspection, the interim inspection a year later,
        // re-inspection every cycle, and the annual fee banded by enrolment.
        accreditation: sinceAccredited < 0 ? 0
          : (sinceAccredited === 0 ? gbp(val(BA.applicationGbp)) + inspection : 0)
          + (sinceAccredited > 0 && sinceAccredited % (val(BA.cycleYears) * T3) === 0 ? inspection : 0)
          + (sinceAccredited === T3 ? gbp(val(BA.interimInspectionGbp)) : 0)
          + (sinceAccredited > 0 ? gbp(band(val(BA.annualGbpByEnrolled), active)) / T3 : 0),
      };
      const operations = sum(Object.values(ops));

      // Acquisition and collection.
      const acqRetail = sum(MARKET_KEYS.map((m) => spend[m][t]));
      const acquisition = acqRetail + origination[t];
      // Card fees by where the card was issued; agreements are invoiced
      // and paid by transfer, so carry none.
      const PC = POLICY.collection; const ST = PC.stripe;
      let collection = 0;
      for (const m of MARKET_KEYS) {
        const R = retailByMarket[m];
        if (!R || !R.revenue) continue;
        const mix = val(MARKETS.markets[m].cardMix) || {};
        const rate = sum(Object.entries(mix).map(([cls, share]) => share * val(ST[cls]))) + val(ST.conversion);
        const card = val(PC.cardShareOfRetail);
        collection += R.revenue * card * rate + R.levels * val(PC.paymentsPerLevel) * card * gbp(val(ST.fixedGbp));
      }

      const academicPay = payAcademic;
      const costs = academicPay + payInstitution + recruitment + technology + operations + acquisition + collection;
      const surplus = revenue - costs;
      const owed = carried * (1 - val(POLICY.collection.withdrawalRate));
      const cashflow = surplus - (owed - receivable);
      receivable = owed;
      cumulative += cashflow;

      rows.push({
        t, label: termLabel(t), year: y,
        newLearners: terms[t].newN, plannedNew: terms[t].plannedN, turnedAway: terms[t].plannedN - terms[t].newN,
        newBy: terms[t].newBy,
        spendBy: Object.fromEntries(MARKET_KEYS.map((m) => [m, spend[m][t]])),
        enquiriesBy: Object.fromEntries(MARKET_KEYS.map((m) => [m, enquiries[m][t]])),
        active, awards: terms[t].awards, holders: terms[t].holders,
        sections: W.sections, seminarFill: W.seminarSeats ? sum(Object.entries(W.byRouteLevel).filter(([rl]) => SVC.sectionCap(rl.split('|')[0])).map(([, n]) => n)) / W.seminarSeats : null,
        hours: W.hours, institutionalHours: W.inst, routeLevels: W.byRouteLevel,
        instructors: { standard: employed.standard[t], senior: employed.senior[t], needed: { standard: target.standard[t], senior: target.senior[t] } },
        posts: head, staff, nonTeaching,
        enquiries: sum(MARKET_KEYS.map((m) => enquiries[m][t])),
        agreements: Object.fromEntries(CH_KEYS.map((c) => [c, agreementsSigned[c][t]])),
        revenue: { retail: retailGross, agreement: agreementGross, gross, refunds, net: revenue },
        byRoute, byMarket, byOrigin,
        cost: {
          academic: academicPay, institution: payInstitution, recruitment, technology, operations,
          acquisition, acquisitionRetail: acqRetail, origination: origination[t], collection,
        },
        tech, ops, statutory, payByPost, costs, surplus, receivable, cashflow, cumulative,
      });
    }
    return { rows, admitShare: nextAdmit, authoring, fx };
  }
}

/** Sum terms into years. */
export function years(result) {
  const out = [];
  for (let y = FIRST_YEAR; y <= LAST_YEAR; y++) {
    const rs = result.rows.filter((r) => r.year === y);
    const s = (f) => sum(rs.map(f));
    const last = rs[rs.length - 1];
    const cost = {};
    for (const k of Object.keys(rs[0].cost)) cost[k] = s((r) => r.cost[k]);
    const byMarket = {}; const byRoute = {};
    for (const r of rs) {
      for (const [m, v] of Object.entries(r.byMarket)) {
        byMarket[m] = byMarket[m] || { learners: 0, revenue: 0, viaAgreement: 0 };
        for (const k of Object.keys(v)) byMarket[m][k] += v[k];
      }
      for (const [k, v] of Object.entries(r.byRoute)) {
        byRoute[k] = byRoute[k] || { learners: 0, revenue: 0 };
        byRoute[k].learners += v.learners; byRoute[k].revenue += v.revenue;
      }
    }
    out.push({
      year: y,
      newLearners: s((r) => r.newLearners), turnedAway: s((r) => r.turnedAway),
      learnerLevels: s((r) => r.active), activeEnd: last.active, awards: s((r) => r.awards), holders: last.holders,
      instructors: last.instructors.standard + last.instructors.senior, staff: last.staff,
      enquiries: s((r) => r.enquiries),
      revenue: { gross: s((r) => r.revenue.gross), refunds: s((r) => r.revenue.refunds), net: s((r) => r.revenue.net), retail: s((r) => r.revenue.retail), agreement: s((r) => r.revenue.agreement) },
      cost, costs: s((r) => r.costs), surplus: s((r) => r.surplus), receivable: last.receivable,
      cashflow: s((r) => r.cashflow), cumulative: last.cumulative,
      byMarket, byRoute,
    });
  }
  return out;
}
