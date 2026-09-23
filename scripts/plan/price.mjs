/**
 * HOW THE PRICE OF EACH ROUTE IS FORMED — and why the financial
 * constitution is an OUTPUT of it.
 *
 * The owner's ruling: a price must be traceable through market, learner,
 * service specification, staffing, delivery capacity, technology,
 * assessment, acquisition, overhead, capital requirement and margin. So
 * the level fee of each route is built up from the whole cost of the
 * institution at the volume the plan reaches at maturity:
 *
 *   1  the academic work of the route itself — its seminars, at the
 *      section sizes the plan actually fills; its tutorials, feedback and
 *      advising; and the shared assessment every route carries
 *   2  the academic work of the institution — moderation, the Examination
 *      Board, paper authoring, curriculum maintenance, quality review,
 *      academic management, and the capacity carried by hiring whole
 *      people a term ahead
 *   3  the professional establishment, technology, operations and
 *      governance
 *   4  acquisition
 *   5  collection and refunds
 *   6  the margin
 *
 * and the margin is not chosen. It is SOLVED: the smallest margin at
 * which the ten-year plan, run in full, ends its tenth year holding its
 * reserve at target after returning every dollar of founding capital.
 *
 * The same arithmetic, summed across the portfolio, is the financial
 * constitution — what share of every dollar goes to teaching, to running
 * the institution, to technology, to finding learners, and to the
 * reserve. The model determines the constitution; nothing here sets it.
 */
import {
  PEOPLE, POLICY, MARKETS, ROUTE_KEYS, LEVELS, FIRST_YEAR, val, TERMS_PER_YEAR,
} from './record.mjs';
import * as SVC from './service.mjs';
import { run, years, loadedUsd } from './engine.mjs';

const sum = (xs) => xs.reduce((t, x) => t + x, 0);
const PRICING_YEAR = val(POLICY.tariff.pricingVolumeYear);
const INDEX = (y) => Math.pow(1 + val(POLICY.tariff.indexation), y - FIRST_YEAR);
const round = (x) => Math.round(x / val(POLICY.tariff.roundingUsd)) * val(POLICY.tariff.roundingUsd);

/** The cost of one productive academic hour at a grade, in a year. */
export function academicHourUsd(grade, year, privateSched, fx) {
  const salary = grade === 'senior' ? val(PEOPLE.teaching.senior.salaryGbp) : val(PEOPLE.teaching.instructor.salaryGbp);
  const share = privateSched ? val(PEOPLE.teaching.deliveryShareWhenPrivate) : val(PEOPLE.teaching.deliveryShare);
  return loadedUsd(salary, year, 1, fx) / (val(PEOPLE.teaching.contractedHoursPerYear) * share);
}

/**
 * The cost build-up of every route at the plan's pricing volume, read
 * from a completed run. Returned in the prices of the plan's FIRST year,
 * because that is the year the tariff is stated in.
 */
export function buildUp(result) {
  const Y = years(result).find((y) => y.year === PRICING_YEAR);
  const rows = result.rows.filter((r) => r.year === PRICING_YEAR);
  const deflate = 1 / INDEX(PRICING_YEAR);

  // Learners by route and level across the pricing year.
  const rl = {};
  for (const r of rows) for (const [k, n] of Object.entries(r.routeLevels)) rl[k] = (rl[k] || 0) + n;
  const onRoute = (route) => sum(Object.entries(rl).filter(([k]) => k.startsWith(`${route}|`)).map(([, n]) => n));
  const learnerLevels = sum(Object.values(rl));

  // 1 · The route's own academic work, at the sections actually filled.
  const own = {};
  let routeAcademicTotal = 0;
  for (const route of ROUTE_KEYS) {
    const n = onRoute(route);
    if (!(n > 0)) { own[route] = null; continue; }
    const g = SVC.grade(route);
    const rate = academicHourUsd(g, PRICING_YEAR, SVC.isPrivate(route), result.fx);
    let assessment = 0; let sections = 0;
    for (let L = 0; L < LEVELS; L++) {
      // Sections are counted term by term, as the engine counts them.
      for (const r of rows) {
        const m = r.routeLevels[`${route}|${L}`] || 0;
        assessment += m * SVC.assessmentHours(L).total;
        const cap = SVC.sectionCap(route);
        if (cap && m > 0) sections += Math.ceil(m / cap);
      }
    }
    const perLearner = {
      assessment: assessment / n,
      seminar: (sections * SVC.sectionHours(route)) / n,
      individual: SVC.individualHours(route).total,
    };
    const hours = sum(Object.values(perLearner));
    own[route] = {
      learners: n,
      hours: perLearner,
      fill: SVC.sectionCap(route) ? n / (sections * SVC.sectionCap(route)) : null,
      usd: hours * rate * deflate,
    };
    routeAcademicTotal += hours * rate * n;
  }

  // 2 · The institution's academic work: everything the academic payroll
  // carries that is not a route's own — moderation, the Board, papers,
  // maintenance, quality, academic leads, and whole-person capacity.
  const academicPay = Y.cost.academic;
  const institutionalAcademic = Math.max(0, academicPay - routeAcademicTotal);

  // 3 · Running the institution.
  const running = Y.cost.institution + Y.cost.recruitment + Y.cost.technology + Y.cost.operations;
  // 4 · Finding learners.
  const acquisition = Y.cost.acquisition;

  const perLevel = (x) => (x / learnerLevels) * deflate;
  const shared = {
    institutionalAcademic: perLevel(institutionalAcademic),
    running: perLevel(running),
    acquisition: perLevel(acquisition),
  };
  // 5 · Collection and refunds are shares of the fee itself: card fees
  // as the pricing year actually paid them on retail fees, by where the
  // cards were issued, and the refunds of the withdrawal window.
  const collect = (Y.revenue.retail ? Y.cost.collection / Y.revenue.retail : 0)
    + val(POLICY.collection.withdrawalRate);

  return { own, shared, collect, learnerLevels, pricingYear: PRICING_YEAR, year: Y };
}

/** A tariff from a build-up and a margin: the level fee of each route in
 *  the plan's first-year prices. */
export function tariffFrom(b, margin) {
  const out = {};
  for (const route of ROUTE_KEYS) {
    const o = b.own[route];
    const base = (o ? o.usd : 0) + b.shared.institutionalAcademic + b.shared.running + b.shared.acquisition;
    out[route] = round(base / (1 - b.collect - margin));
  }
  return out;
}

/** The test the margin must pass: after ten years, with every dollar of
 *  founding capital returned, the College holds its reserve at target. */
export function passes(result) {
  const Y = years(result);
  const last = Y[Y.length - 1];
  const reserveTarget = (last.costs / 12) * val(POLICY.reserve.targetMonths);
  return { cumulative: last.cumulative, reserveTarget, ok: last.cumulative >= reserveTarget };
}

/**
 * Solve the tariff. Volumes do not depend on price in the plan's central
 * case — price decides which routes a market is offered, not how many
 * enquiries it produces — so the build-up is read from a run, the margin
 * is bisected against the ten-year test, and the build-up is re-read at
 * the solved tariff until it stops moving.
 */
export function solve(opts = {}) {
  let tariff = { independent: 1000, guided: 2500, tutored: 4000, executive: 7000, bespoke: 15000 };
  let b = buildUp(run(tariff, opts));
  let margin = 0.2;
  for (let outer = 0; outer < 6; outer++) {
    let lo = 0; let hi = 0.6;
    for (let i = 0; i < 40; i++) {
      const mid = (lo + hi) / 2;
      if (passes(run(tariffFrom(b, mid), opts)).ok) hi = mid; else lo = mid;
    }
    margin = hi;
    const next = tariffFrom(b, margin);
    const same = ROUTE_KEYS.every((k) => next[k] === tariff[k]);
    tariff = next;
    b = buildUp(run(tariff, opts));
    if (same) break;
  }
  const result = run(tariff, opts);
  return { tariff, margin, buildUp: b, result, test: passes(result) };
}

/**
 * THE CONSTITUTION THE MODEL PRODUCES — the share of every dollar of net
 * revenue each part of the institution consumes, and the share retained,
 * over a stated period. Never set; always read.
 */
export function constitution(result, fromYear = PRICING_YEAR, toYear = PRICING_YEAR) {
  const Y = years(result).filter((y) => y.year >= fromYear && y.year <= toYear);
  const net = sum(Y.map((y) => y.revenue.net));
  const c = (k) => sum(Y.map((y) => y.cost[k]));
  // The people who build and run the platform are technology, not
  // administration: their pay is read out of the establishment's.
  const engineering = sum(result.rows.filter((r) => r.year >= fromYear && r.year <= toYear)
    .map((r) => r.payByPost.platformEngineer || 0));
  const lines = [
    { key: 'teaching', name: 'Teaching and assessment', usd: c('academic') },
    { key: 'institution', name: 'Professional staff and administration', usd: c('institution') + c('recruitment') - engineering },
    { key: 'technology', name: 'The platform: its engineers and its services', usd: c('technology') + engineering },
    { key: 'operations', name: 'Premises, assurance and governance', usd: c('operations') },
    { key: 'acquisition', name: 'Finding learners', usd: c('acquisition') },
    { key: 'collection', name: 'Collecting fees', usd: c('collection') },
  ];
  const spent = sum(lines.map((l) => l.usd));
  lines.push({ key: 'retained', name: 'Retained — reserve and the return of capital', usd: net - spent });
  return { fromYear, toYear, net, lines: lines.map((l) => ({ ...l, share: net ? l.usd / net : 0 })) };
}

/** Pathway price — a complete six-level route — in the plan's first year. */
export const pathway = (tariff, route) => tariff[route] * LEVELS;
export { TERMS_PER_YEAR };
