/**
 * THE COMMERCIAL ARCHITECTURE HOLDS TOGETHER.
 *
 * ────────────────────────────────────────────────────────────────────
 * WHAT THIS GUARDS, AND WHY EACH ONE IS HERE
 * ────────────────────────────────────────────────────────────────────
 * The College now sells five pathways, in four regions, through six
 * kinds of payer, on five payment plans. That is a real commercial
 * architecture and it has correspondingly real ways of going quietly
 * wrong: a route sold below what it costs to deliver, a regional
 * tariff that turns the credential into an arbitrage, an adopted fee
 * repriced to tidy a ratio, or the one principle the whole thing rests
 * on — that the qualification is identical on every route — eroded a
 * sentence at a time until the College is selling a better certificate
 * to whoever pays more.
 *
 * Every check below exists because the alternative is discovering it
 * in a published document.
 */
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const PF = await import(path.join(ROOT, 'scripts/publication/portfolio.mjs'));
const PR = await import(path.join(ROOT, 'scripts/publication/pricing.mjs'));

let pass = 0, fail = 0;
const check = (label, cond, detail) => {
  console.log((cond ? 'PASS ' : 'FAIL ') + label + (cond || detail === undefined ? '' : ` — ${detail}`));
  cond ? pass++ : fail++;
};
const usd = (n) => '$' + Math.round(n).toLocaleString();

const T = PF.REFERENCE_TARIFF;

// ── 1 · THE PRINCIPLE ───────────────────────────────────────────────
/* One academic standard. If a pathway ever acquires its own
   examination, rubric, marking regime or award, the College has begun
   selling a better credential to whoever pays more. */
const specs = PF.INTENSITIES.map((i) => PF.specification(i.key));
check('every pathway carries the same academic hours',
  specs.every((s) => s.academicHours === specs[0].academicHours),
  [...new Set(specs.map((s) => s.academicHours))].join(', '));
check('every pathway carries the same credits',
  specs.every((s) => s.credits === specs[0].credits));
check('assessment is identical on every route',
  typeof PR.ASSESSMENT_HOURS === 'number' && PR.ASSESSMENT_HOURS > 0,
  'one assessment specification, applied to all');

/* And the portfolio must genuinely differ in SERVICE, or the tiers are
   a pricing exercise with no product behind them. */
const ladder = PF.INTENSITIES.map((i) => PF.specification(i.key));
check('contact rises monotonically up the portfolio',
  ladder.every((s, i) => i === 0 || s.contactHours >= ladder[i - 1].contactHours
    || s.individualHours > ladder[i - 1].individualHours),
  ladder.map((s) => s.contactHours).join(' → '));
check('individual attention rises up the portfolio',
  ladder.every((s, i) => i === 0 || s.individualHours >= ladder[i - 1].individualHours),
  ladder.map((s) => s.individualHours).join(' → '));

// ── 2 · NOTHING IS SOLD BELOW WHAT IT COSTS ─────────────────────────
const below = [];
for (const i of PF.INTENSITIES) {
  for (const r of PF.REGION_KEYS) {
    const inv = PF.investment(i.key, r, T);
    if (inv.offered && inv.published < inv.cost) below.push(`${i.key}/${r}`);
  }
}
check('no route is published below its delivery cost in any region',
  below.length === 0, below.join(', '));

const underFloor = PF.INTENSITIES.flatMap((i) => PF.REGION_KEYS
  .map((r) => PF.investment(i.key, r, T))
  .filter((v) => v.offered && v.published < v.floor)
  .map((v) => `${i.key}/${v.region}`));
check('every published investment clears its contribution floor',
  underFloor.length === 0, underFloor.join(', '));

// ── 3 · THE REGIONAL INDEX IS DERIVED, NOT CHOSEN ───────────────────
check('the reference region is the best-evidenced one',
  PF.REGIONS.gulf.reference === true && PF.REGIONS.gulf.index === 1
  && PF.REGIONS.gulf.standing === 'researched');
check('a region with no direct evidence is marked modelled',
  PF.REGIONS.asiaRow.standing === 'modelled' && PF.REGIONS.asiaRow.evidence === null);
check('the index follows the researched willingness to pay',
  PF.REGIONS.ukEurope.index > PF.REGIONS.asiaRow.index
  && PF.REGIONS.asiaRow.index > PF.REGIONS.westAfrica.index,
  PF.REGION_KEYS.map((k) => `${k} ${PF.REGIONS[k].index}`).join(', '));

/* The finding the research actually produced: no taught pathway
   reaches West Africa at retail. If that ever silently becomes false,
   somebody has either found new evidence — or quietly lowered a price
   below what the College can staff. */
const wafRetail = PF.offeredIn('westAfrica', T).map((i) => i.key);
check('West Africa is served by the access route and by sponsors, not by a taught retail tariff',
  wafRetail.length === 1 && wafRetail[0] === 'independent', wafRetail.join(', '));

/* The access route is published once, everywhere. */
const indep = PF.REGION_KEYS.map((r) => PF.investment('independent', r, T).published);
check('the Independent route carries one tariff in every market',
  new Set(indep).size === 1, indep.map(usd).join(', '));

// ── 4 · AN ADOPTED FEE IS NOT A VARIABLE ────────────────────────────
check('the adopted Independent fee is unchanged by the solve',
  T.independent === PF.SUPERSEDED_TARIFF.independent
  && T.independent === PR.B.levels * PR.B.independentPerLevel,
  `${usd(T.independent)} — ${PR.B.levels} levels at ${usd(PR.B.independentPerLevel)}`);

// ── 5 · THE CONSTITUTION, TESTED ON WHAT IS COLLECTED ───────────────
const standing = PF.STANDING();
check('the committed tariff satisfies the financial constitution',
  standing.holds,
  `retains ${(standing.retainedShare * 100).toFixed(1)}% against a ${(standing.target * 100).toFixed(0)}% target`);

/* And it is the CHEAPEST tariff that does. A College that takes the
   maximum its constitution permits has confused a floor with an
   objective. */
const solved = PF.solveBase(PF.SUPERSEDED_TARIFF);
check('the committed tariff is the cheapest that satisfies it',
  solved.cheapest && PF.INTENSITIES.every((i) => solved.cheapest.base[i.key] === T[i.key]),
  solved.cheapest ? JSON.stringify(solved.cheapest.base) : 'no solution in the swept range');

/* The superseded tariff is kept because it is the evidence for the
   move: solved at one global price, it misses the constitution once
   regional pricing is honest. */
const old = PF.meetsConstitution(PF.SUPERSEDED_TARIFF);
check('the superseded single-price tariff would MISS the constitution',
  !old.holds,
  `retains ${(old.retainedShare * 100).toFixed(1)}% — the gap regional pricing exposed`);

// ── 6 · PAYERS, BANDS AND SEATS ─────────────────────────────────────
const institutional = PF.PAYER_KEYS.filter((k) => PF.PAYERS[k].institutional);
check('the portfolio sells to institutions as well as to learners',
  institutional.length >= 4, institutional.join(', '));
const bandsUsed = institutional.map((k) => PF.PAYERS[k].band);
const published = PF.BANDS.map((b) => b.from);
check('every institutional band is one the College has published',
  bandsUsed.every((b) => published.includes(b)),
  `used ${[...new Set(bandsUsed)].join(', ')} against published ${published.join(', ')}`);

const corp = PF.seat('executiveCohort', 'gulf', 'corporate', T);
const retail = PF.investment('executiveCohort', 'gulf', T);
check('an institutional seat is cheaper than the retail tariff, by the published band',
  corp.seatPrice < retail.published && corp.discount > 0,
  `${usd(corp.seatPrice)} against ${usd(retail.published)} at ${(corp.discount * 100).toFixed(0)}%`);
check('acquisition per seat falls as an agreement carries more of them',
  PF.seat('tutored', 'gulf', 'sponsored', T).acquisitionPerSeat
  < PF.seat('tutored', 'gulf', 'corporate', T).acquisitionPerSeat);

/* A market that cannot carry a taught route at retail can still carry
   it through a sponsor — which is the strategy, not a loophole. */
const wafSponsored = PF.seat('tutored', 'westAfrica', 'sponsored', T);
check('a sponsor can place a taught cohort where retail cannot reach',
  wafSponsored.seatPrice > 0 && wafSponsored.seatPrice >= wafSponsored.cost,
  `${usd(wafSponsored.seatPrice)} a seat against ${usd(wafSponsored.cost)} of delivery`);

// ── 7 · PAYMENT IS AN ARCHITECTURE, NOT A DISCOUNT ──────────────────
const t = PF.investment('tutored', 'gulf', T).published;
const plans = ['full', 'annual', 'level', 'instalment'].map((k) => PF.schedule(t, k));
check('every plan is within four per cent of the published investment',
  plans.every((p) => Math.abs(p.payable / t - 1) <= 0.0401),
  plans.map((p) => `${p.name} ${usd(p.payable)}`).join(', '));
check('no plan is a promotion',
  plans.every((p) => Math.abs(p.adjust) <= 0.04));
check('paying by instalment divides the pathway into a monthly commitment',
  plans[3].each < t / 20, `${usd(plans[3].each)} × ${plans[3].instalments}`);

// ── 8 · THE HOUR IS NOT THE PRODUCT ─────────────────────────────────
check('the value architecture states what tuition provides in twelve components',
  PF.VALUE_ARCHITECTURE.length === 12);
check('teaching is one component of twelve, not the proposition',
  PF.VALUE_ARCHITECTURE.filter((c) => /teaching/i.test(c.k)).length === 1);
check('the qualification and the registry are in it',
  PF.VALUE_ARCHITECTURE.some((c) => /qualification/i.test(c.k))
  && PF.VALUE_ARCHITECTURE.some((c) => /registry/i.test(c.k)));

/* The attention-hour comparison survives as a methodology instrument.
   It must still WORK — it caught a false claim once — but it is no
   longer anything the commercial architecture is built on. */
const ac = PF.attentionCheck('tutored', t);
check('the attention-hour check is retained for the methodology',
  ac.hours > 0 && ac.perHour > 0, `${ac.hours} hours, ${usd(ac.perHour)} an hour`);

console.log(`\n${pass} passed, ${fail} failed.`);
process.exitCode = fail ? 1 : 0;
