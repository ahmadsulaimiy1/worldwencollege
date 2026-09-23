/**
 * EVERYTHING THE BOOK SAYS, COMPUTED ONCE.
 *
 * The book never computes and never types a planning number. It reads
 * this object, which is one solved run of the plan's model and every
 * reading taken from it. If a figure is on a page, it is here, and it is
 * here because the model produced it.
 */
import * as R from '../record.mjs';
import * as E from '../engine.mjs';
import * as P from '../price.mjs';
import * as C from '../capital.mjs';
import * as A from '../acquisition.mjs';
import * as SC from '../scenarios.mjs';
import * as RM from '../roadmap.mjs';
import * as SVC from '../service.mjs';

const sum = (xs) => xs.reduce((t, x) => t + x, 0);

export function facts() {
  const S = P.solve();
  const Y = E.years(S.result);
  const rows = S.result.rows;
  const K = C.capital(S.result);
  const AQ = A.acquisition(S);
  const X = SC.scenarios(S);
  const RY = RM.roadmap(S);
  const constitution = P.constitution(S.result);
  const last = Y[Y.length - 1];
  const lastRow = rows[rows.length - 1];
  const firstIntake = rows.find((r) => r.newLearners > 0);

  const routes = R.ROUTE_KEYS.map((k) => {
    const def = R.ROUTES.routes[k];
    const own = S.buildUp.own[k];
    const ind = SVC.individualHours(k);
    return {
      key: k, name: def.name, for: def.for, promise: def.promise,
      fee: S.tariff[k], pathway: P.pathway(S.tariff, k),
      grade: SVC.grade(k), private: SVC.isPrivate(k),
      seminarHours: SVC.sectionHours(k), sectionCap: SVC.sectionCap(k),
      tutorialHours: ind.tutorials, feedbackHours: ind.feedback, advisingHours: ind.advising,
      oversightHours: ind.oversight, authoringHours: ind.authoring,
      adminHours: SVC.administrativeHours(k),
      components: Object.fromEntries(Object.entries(def.components).map(([c, v]) => [c, R.val(v)])),
      own, // the route's own academic cost per learner-level, first-year prices
      learners2036: (last.byRoute[k] || { learners: 0 }).learners / R.TERMS_PER_YEAR,
      revenue2036: (last.byRoute[k] || { revenue: 0 }).revenue,
    };
  });

  const markets = R.MARKET_KEYS.map((k) => {
    const M = R.MARKETS.markets[k];
    const aq = AQ.markets.find((m) => m.key === k);
    const bm = last.byMarket[k] || { learners: 0, revenue: 0, viaAgreement: 0 };
    return {
      key: k, name: M.name, opens: M.opens, why: M.why, routes: R.val(M.routes),
      spend: R.val(M.spendUsd), cardMix: R.val(M.cardMix),
      aq, learners2036: bm.learners / R.TERMS_PER_YEAR, revenue2036: bm.revenue,
      viaAgreement2036: bm.viaAgreement / R.TERMS_PER_YEAR,
    };
  });

  const agreements = Object.entries(R.MARKETS.agreements).map(([k, v]) => ({
    key: k, name: v.name, what: v.what, opens: v.opens, route: v.route,
    discount: R.val(v.discount), seats: R.val(v.seatsPerAgreement),
    perYear: R.val(v.agreementsPerYear), origination: R.val(v.originationUsd),
    receivableDays: R.val(v.receivableDays), markets: R.val(v.markets),
  }));

  const posts = Object.entries(R.PEOPLE.posts).map(([k, v]) => ({
    key: k, name: v.name, salary: R.val(v.salaryGbp), source: v.salaryGbp.s,
    from: v.from, kind: v.kind, base: v.base, perActive: v.perActive,
    perEnrolmentsPerTerm: v.perEnrolmentsPerTerm, perAdministrativeHours: v.perAdministrativeHours,
    firstTerm: rows.find((r) => (r.posts[k] || 0) > 0)?.label || null,
    in2036: lastRow.posts[k] || 0,
  }));

  // Scale is the lever on price: the same institution, run for markets
  // half as large again and twice as large, re-solved in full.
  const scaleLever = [1, 1.5, 2].map((k) => {
    const Sk = k === 1 ? S : P.solve({ marketScale: k });
    const rk = Sk.result.rows;
    return {
      scale: k, tariff: Sk.tariff, margin: Sk.margin,
      capital: C.capital(Sk.result).requirement,
      active: rk[rk.length - 1].active,
      shared: Sk.buildUp.shared.institutionalAcademic + Sk.buildUp.shared.running + Sk.buildUp.shared.acquisition,
    };
  });
  const comparables = Object.entries(R.COMPARABLES.items).map(([k, v]) => ({ key: k, ...v, usd: R.val(v.usd) }));

  const register = R.register();
  const bases = Object.fromEntries(Object.keys(R.BASES).map((b) => [b, register.filter((r) => r.basis === b).length]));

  return {
    R, E, P, C, SVC, S, Y, rows, K, AQ, X, RY, constitution, routes, markets, agreements, posts,
    register, bases, scaleLever, comparables,
    first: R.FIRST_YEAR, lastYear: R.LAST_YEAR,
    period: `${R.FIRST_YEAR}–${R.LAST_YEAR}`,
    last, lastRow, firstIntake,
    fx: R.FX,
    tariff: S.tariff, margin: S.margin,
    capital: K.requirement,
    contingency: (X.combined.find((c) => c.key === 'slowStart') || {}).capital - K.requirement,
    firstSurplusYear: X.central.firstSurplusYear,
    returnYear: X.central.returnYear.year,
    trough: K.trough,
    reserveTarget: X.central.reserveTarget,
    activeEnd: lastRow.active,
    newPerYear: last.newLearners,
    instructors: lastRow.instructors.standard + lastRow.instructors.senior,
    academicStaff: lastRow.instructors.standard + lastRow.instructors.senior + (lastRow.posts.academicLead || 0),
    professionalStaff: lastRow.nonTeaching - (lastRow.posts.academicLead || 0),
    staff: lastRow.staff,
    levelsPerLearner: AQ.levelsPerLearner,
    funnel: Object.fromEntries(Object.entries(R.MARKETS.funnel).map(([k, v]) => [k, R.val(v)])),
    sum,
  };
}
