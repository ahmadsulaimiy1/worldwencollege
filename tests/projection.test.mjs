/**
 * THE DECADE IS PROJECTED AT THE PRICES THE COLLEGE ACTUALLY PUBLISHES.
 *
 * ────────────────────────────────────────────────────────────────────
 * WHY THIS EXISTS
 * ────────────────────────────────────────────────────────────────────
 * For one revision the publication printed two different institutions.
 * Part III published a tariff solved from the financial constitution
 * across four regions; Part V projected the decade at a superseded set
 * of prices, at one global figure, selling taught pathways into two
 * markets that do not carry them at retail. Both were internally
 * consistent. Neither agreed with the other, and the only outward sign
 * was that a reader who multiplied one by the other got a third
 * number.
 *
 * Pricing the projection by region costs the plan a fifth of its
 * ten-year revenue and moves the year the institution turns. That is
 * not a loss. It is the removal of revenue the College was never going
 * to collect, from learners who were never going to enrol, at a price
 * two of its four markets do not carry.
 *
 * The size of that correction is REPORTED rather than written into
 * this comment, because it has moved three times — once when the
 * institutional channels were added, once when agreements began to be
 * placed by region, and once when the two files that solve seats per
 * agreement stopped disagreeing with each other. A figure typed into a
 * header here is a figure that will be wrong by the next revision.
 *
 * Everything below exists so that the two halves of the book cannot
 * drift apart again.
 */
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const PJ = await import(path.join(ROOT, 'scripts/publication/projection.mjs'));
const PF = await import(path.join(ROOT, 'scripts/publication/portfolio.mjs'));
const PR = await import(path.join(ROOT, 'scripts/publication/pricing.mjs'));

let pass = 0, fail = 0;
const check = (label, cond, detail) => {
  console.log((cond ? 'PASS ' : 'FAIL ') + label + (cond || detail === undefined ? '' : ` — ${detail}`));
  cond ? pass++ : fail++;
};
const m$ = (n) => '$' + (n / 1e6).toFixed(1) + 'M';
const finite = (n) => Number.isFinite(n);

const T = PF.REFERENCE_TARIFF;
const SC = PJ.scenarios();
const ARCH = PJ.architectures();

// ── 1 · ONE TARIFF, NOT TWO ─────────────────────────────────────────
check('the projection runs on the committed reference tariff',
  Object.entries(PF.SPEC_OF_INTENSITY).every(([i, spec]) => PJ.COMMITTED[spec] === T[i]),
  JSON.stringify(PJ.COMMITTED));
check('...and not on the superseded one',
  PJ.COMMITTED.tutored !== PF.SUPERSEDED_TARIFF.tutored,
  `${PJ.COMMITTED.tutored} against a superseded ${PF.SUPERSEDED_TARIFF.tutored}`);
check('the proposed architecture and all three scenarios are projected regionally',
  ARCH.proposed.regional === true
  && ['conservative', 'core', 'growth'].every((k) => SC[k].regional === true));
/* The adopted flat fee and Alternative A are single global prices BY
   DEFINITION. Indexing them regionally would misrepresent what they
   are, and the difference is the thing the comparison exists to show. */
check('...while the flat-fee comparators stay global, which is what they are',
  ARCH.adopted.regional === false && ARCH.briefA.regional === false);

// ── 2 · A MARKET IS NOT SOLD WHAT IT IS NOT OFFERED ─────────────────
const tariff = PF.segmentTariff(T);
const wafRoutes = Object.entries(tariff.waf).filter(([, v]) => v).map(([k]) => k);
check('West Africa is quoted the access route and nothing else',
  wafRoutes.length === 1 && wafRoutes[0] === 'independent', wafRoutes.join(', '));
const rowRoutes = Object.entries(tariff.row).filter(([, v]) => v).map(([k]) => k);
check('Asia and the wider world are quoted the access and entry taught routes only',
  rowRoutes.length === 2 && rowRoutes.includes('independent') && rowRoutes.includes('directed'),
  rowRoutes.join(', '));

const snapRegional = PR.portfolio(PJ.COMMITTED, {
  reachScale: 1, tariffOf: (k) => tariff[k], placement: PF.agreementPlacement(T, PR.CHANNELS),
});
const snapGlobal = PR.portfolio(PJ.COMMITTED, { reachScale: 1 });
const waf = snapRegional.bySegment.find((s) => s.key === 'waf');
check('a market carries no revenue from a route it is not sold',
  waf.revenue <= waf.learners * tariff.waf.independent * 1.001,
  `${waf.learners} learners, $${waf.revenue} — at most the access tariff each`);

// ── 3 · THE FINDING, GUARDED ────────────────────────────────────────
check('pricing by region collects less than pricing globally',
  snapRegional.revenue < snapGlobal.revenue,
  `${m$(snapRegional.revenue)} against ${m$(snapGlobal.revenue)} — the difference is revenue the College was never going to collect`);
check('...and the shortfall is material rather than a rounding artefact',
  1 - snapRegional.revenue / snapGlobal.revenue > 0.10,
  `${((1 - snapRegional.revenue / snapGlobal.revenue) * 100).toFixed(1)}%`);

// ── 4 · AGREEMENTS ARE PLACED, NOT INVENTED ─────────────────────────
const placement = PF.agreementPlacement(T, PR.CHANNELS);
for (const [key, rows] of Object.entries(placement)) {
  const total = rows.reduce((t, r) => t + r.share, 0);
  check(`${key} agreement shares sum to one`, Math.abs(total - 1) < 1e-9, total.toFixed(6));
  check(`${key} prices a seat in every region it is placed in`,
    rows.every((r) => r.seatPrice > 0 && finite(r.cacPerSeat)),
    rows.map((r) => `${r.region} $${r.seatPrice}`).join(', '));
}
/* An employer follows budget; a sponsor follows need. If those ever
   converge, somebody has flattened the one distinction that explains
   why the institutional channels reach markets a price list cannot. */
const corpGulf = placement.corporate.find((r) => r.region === 'gulf').share;
const spGulf = placement.sponsored.find((r) => r.region === 'gulf').share;
const corpWaf = placement.corporate.find((r) => r.region === 'westAfrica').share;
const spWaf = placement.sponsored.find((r) => r.region === 'westAfrica').share;
check('employer agreements concentrate where the budgets are',
  corpGulf > corpWaf, `Gulf ${(corpGulf * 100).toFixed(0)}% against West Africa ${(corpWaf * 100).toFixed(0)}%`);
check('sponsored agreements concentrate where the need is',
  spWaf > spGulf, `West Africa ${(spWaf * 100).toFixed(0)}% against Gulf ${(spGulf * 100).toFixed(0)}%`);

/* WHAT PLACEMENT CONSERVES IS AGREEMENTS, NOT SEATS — AND THIS CHECK
   USED TO ASSERT THE OPPOSITE.

   It read: place the agreements by region and the seat count must come
   out the same. That was true of the first implementation, which took
   one globally-solved seat total and split it four ways, and it was
   WRONG for the same reason that implementation was: it evaluated the
   channel elasticities at a price most of the seats are not sold at.

   Winning an agreement is a sales capacity. It does not rise because a
   seat got cheaper, so the number of agreements is fixed by the
   partnership establishment and merely distributed. How many places an
   agreement then carries is a budget question, answered at the price
   that region actually pays — so the seat total MUST move, and a test
   demanding it stay still was demanding the bug back. */
const agreementsOf = (key) => PF.agreementPlacement(T, PR.CHANNELS)[key]
  .reduce((t, r) => t + r.share, 0);
check('placing agreements by region conserves the AGREEMENTS',
  Object.keys(PR.CHANNELS).every((k) => Math.abs(agreementsOf(k) - 1) < 1e-9),
  Object.keys(PR.CHANNELS).map((k) => `${k} ${agreementsOf(k).toFixed(6)}`).join(', '));

/* And the seats it re-solves are bounded by what the College says it
   can carry. Uncapped, one sponsored agreement in West Africa placed
   266 learners against a published relationship of 120 — every one of
   them owed tutorial time, and the number was generated by the
   College's own contribution floor rather than by any evidence. */
for (const [key, rows] of Object.entries(placement)) {
  const c = PR.CHANNELS[key];
  check(`a ${key} agreement never carries more places than the College publishes`,
    rows.every((r) => r.seatsPerAgreement <= c.maxSeatsPerAgreement + 1e-9),
    rows.map((r) => `${r.region} ${r.seatsPerAgreement.toFixed(1)}`).join(', ') + ` — ceiling ${c.maxSeatsPerAgreement}`);
  check(`...and that ceiling is the figure the payer table publishes`,
    c.maxSeatsPerAgreement === PF.PAYERS[key].seats,
    `${c.maxSeatsPerAgreement} against ${PF.PAYERS[key].seats}`);
  /* ONE CURVE, ONE ANSWER. `portfolio()` used to re-derive this for
     itself and reached a different number — 266 where the placement
     said 120 — then costed acquisition across the larger figure. */
  check(`...and the placement and the projection solve ${key} seats identically`,
    rows.every((r) => Math.abs(PR.seatsPerAgreementAt(key, r.seatPrice) - r.seatsPerAgreement) < 1e-9),
    rows.map((r) => `${r.region} ${r.seatsPerAgreement.toFixed(2)} / ${PR.seatsPerAgreementAt(key, r.seatPrice).toFixed(2)}`).join(', '));
}

/* Seats move, but they move for a reason, and the reason is bounded:
   no channel may swing more than the curve between the cheapest and
   dearest seat it is placed at could account for. */
const chGlobal = Object.keys(PR.CHANNELS).reduce((t, k) => t + (snapGlobal.byProduct[k]?.learners || 0), 0);
const chRegional = Object.keys(PR.CHANNELS).reduce((t, k) => t + (snapRegional.byProduct[k]?.learners || 0), 0);
const widest = Math.max(...Object.entries(placement).map(([key, rows]) => {
  const atGlobalPrice = PR.channelTerms(key, PJ.COMMITTED).seatsPerAgreement;
  return Math.max(...rows.map((r) => r.seatsPerAgreement / atGlobalPrice));
}));
check('re-solving seats by region moves the total, and by no more than the curve allows',
  chRegional !== chGlobal && chRegional <= chGlobal * widest * 1.001 && chRegional > 0,
  `${chGlobal} globally against ${chRegional} placed — the widest regional multiple the curve permits is ${widest.toFixed(2)}×`);

// ── 5 · NOTHING IS NaN ──────────────────────────────────────────────
const NUMERIC = ['reach', 'newLearners', 'activeLearners', 'awardsToC2', 'totalAwards', 'alumni',
  'instructors', 'revenue', 'refunds', 'netTuition', 'delivery', 'acquisition', 'fixed',
  'development', 'surplus', 'margin', 'cumulativeRevenue', 'cumulativeSurplus', 'reserve',
  'revenuePerLearner'];
const bad = [];
for (const [name, run] of [...Object.entries(SC), ...Object.entries(ARCH)]) {
  for (const y of run.years) {
    for (const f of NUMERIC) if (!finite(y[f])) bad.push(`${name} ${y.calendar} ${f}=${y[f]}`);
    for (const [k, v] of Object.entries(y.byProduct)) if (!finite(v)) bad.push(`${name} ${y.calendar} byProduct.${k}=${v}`);
  }
}
check('no year of any run carries a NaN or an infinity',
  bad.length === 0, bad.slice(0, 4).join('; '));

// ── 6 · IT STILL RECONCILES ─────────────────────────────────────────
const near = (a, b, tol = 2) => Math.abs(a - b) <= tol;
check('surplus reconciles in every year of every run',
  [...Object.values(SC), ...Object.values(ARCH)].every((r) => r.years.every((y) =>
    near(y.surplus, y.netTuition - y.delivery - y.acquisition - y.fixed - y.development))));
check('every ten-year total is the sum of its ten years',
  [...Object.values(SC), ...Object.values(ARCH)].every((r) =>
    near(r.totals.revenue, r.years.reduce((t, y) => t + y.revenue, 0), 3)
    && near(r.totals.surplus, r.years.reduce((t, y) => t + y.surplus, 0), 3)));

// ── 7 · THE TRADE IS REAL AND IS NOT HIDDEN ─────────────────────────
check('the proposed architecture retains a higher share of what it collects',
  ARCH.proposed.totals.surplus / ARCH.proposed.totals.revenue
  > ARCH.adopted.totals.surplus / ARCH.adopted.totals.revenue,
  `${(ARCH.proposed.totals.surplus / ARCH.proposed.totals.revenue * 100).toFixed(1)}% against ${(ARCH.adopted.totals.surplus / ARCH.adopted.totals.revenue * 100).toFixed(1)}%`);
check('every scenario crosses cumulative nil, or is reported as not doing so',
  ['conservative', 'core', 'growth'].every((k) => {
    const crossed = SC[k].years.some((y) => y.cumulativeSurplus > 0);
    return crossed || SC[k].totals.surplus <= 0;
  }));
/* The scenarios must be ORDERED. If Conservative ever out-earned Core
   the labels have stopped meaning anything. */
check('the three scenarios are ordered as their names claim',
  SC.conservative.totals.surplus < SC.core.totals.surplus
  && SC.core.totals.surplus < SC.growth.totals.surplus,
  ['conservative', 'core', 'growth'].map((k) => `${k} ${m$(SC[k].totals.surplus)}`).join(', '));

/* ── WHAT THE CORRECTION ACTUALLY COSTS, REPORTED ────────────────────
   Not asserted at a threshold — the point is that it is visible in the
   test log every time the model moves, so nobody has to go and find
   it. */
{
  const reg = PJ.project(PJ.COMMITTED, { label: 'regional', regional: true });
  const glo = PJ.project(PJ.COMMITTED, { label: 'global', regional: false });
  const turn = (r) => (r.years.find((y) => y.cumulativeSurplus > 0) || {}).calendar || 'never';
  console.log(`\nNOTE  pricing the decade by region rather than globally:`
    + ` revenue ${m$(reg.totals.revenue)} against ${m$(glo.totals.revenue)},`
    + ` surplus ${m$(reg.totals.surplus)} against ${m$(glo.totals.surplus)},`
    + ` turns in ${turn(reg)} against ${turn(glo)}.`);
}

console.log(`\n${pass} passed, ${fail} failed.`);
process.exitCode = fail ? 1 : 0;
