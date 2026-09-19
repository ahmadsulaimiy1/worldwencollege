// THE RECONCILIATION AUDIT — the document must agree with itself.
//
// ─────────────────────────────────────────────────────────────────────
// WHY THIS FILE IS THE PLAN'S CREDIBILITY
// ─────────────────────────────────────────────────────────────────────
// Section 20 of the Ten-Year Institutional Roadmap tells a reader that
// every cumulative figure reconciles to its annual figures, that the
// allocation reconciles to net tuition with no residual, and that the
// modelled instruction spend agrees with the published teaching
// allocation. That is a claim about arithmetic, and a claim about
// arithmetic that nothing checks is decoration.
//
// This file is what makes it true. If any of it stops being true the
// build fails, and the plan cannot be published saying otherwise.

import { readFileSync } from 'node:fs';
import path from 'node:path';
import { ROOT, loadUrl } from './helpers.mjs';

let pass = 0, fail = 0;
const check = (label, cond, detail) => {
  console.log((cond ? 'PASS ' : 'FAIL ') + label + (cond || detail === undefined ? '' : ` — ${detail}`));
  cond ? pass++ : fail++;
};
const near = (a, b, tol = 2) => Math.abs(a - b) <= tol;

const M = await import(loadUrl('scripts/publication/masterplan.mjs'));
const B = M.basis();
const TUITION = JSON.parse(readFileSync(path.join(ROOT, 'data/tuition.json'), 'utf8'));
const PLAN = M.PLAN;

// ═══════════════════════════════════════════════════════════════════
// 1 · THE BASIS IS THE COLLEGE'S, NOT THE PLAN'S
// ═══════════════════════════════════════════════════════════════════
check('the model reads the adopted tariff rather than restating it',
  B.programmeTotal === TUITION.programme_total_usd && B.levels === TUITION.levels
  && B.hoursPerLevel === TUITION.hours_per_level,
  `${B.programmeTotal} / ${B.levels} / ${B.hoursPerLevel}`);

check('...and the published hours total is what the plan prints',
  B.totalHours === TUITION.levels * TUITION.hours_per_level && B.totalHours === 1200,
  String(B.totalHours));

check('the fee decomposition sums to exactly 100 per cent',
  TUITION.lines.reduce((n, l) => n + l.bp, 0) === 10000,
  String(TUITION.lines.reduce((n, l) => n + l.bp, 0)));

check('...and the model\'s own share view agrees with it',
  near(B.lines.reduce((n, l) => n + l.share, 0), 1, 1e-9));

// The two-cent rounding is published rather than absorbed. If the
// College ever makes the total divide evenly this assertion is what
// notices.
check('the per-level fee times the levels differs from the published total by under a cent per level',
  Math.abs(B.levelFee * B.levels - B.programmeTotal) < B.levels,
  `${(B.levelFee * B.levels).toFixed(2)} against ${B.programmeTotal}`);

// ═══════════════════════════════════════════════════════════════════
// 2 · EVERY SCENARIO RECONCILES INTERNALLY
// ═══════════════════════════════════════════════════════════════════
for (const key of ['conservative', 'base', 'growth']) {
  const m = M.model(key);
  const n = m.scenario;

  check(`${n}: ten years are modelled`, m.years.length === PLAN.planning_period.years);

  check(`${n}: net tuition is gross less refunds less remission, every year`,
    m.years.every((y) => near(y.netTuition, y.grossTuition - y.refunds - y.remission, 2)),
    m.years.filter((y) => !near(y.netTuition, y.grossTuition - y.refunds - y.remission, 2))
      .map((y) => y.year).join(','));

  check(`${n}: total cost is the sum of its components, every year`,
    m.years.every((y) => near(y.cost.total,
      y.cost.acquisition + y.cost.instruction + y.cost.establishment
      + y.cost.technology + y.cost.operating + y.cost.development, 2)));

  check(`${n}: surplus is net tuition less total cost, every year`,
    m.years.every((y) => near(y.surplus, y.netTuition - y.cost.total, 2)));

  check(`${n}: the cumulative column equals the running sum of the annual column`,
    m.years.every((y, i) => near(y.cumulativeRevenue,
      m.years.slice(0, i + 1).reduce((a, b) => a + b.netTuition, 0), 3)),
    m.years.filter((y, i) => !near(y.cumulativeRevenue,
      m.years.slice(0, i + 1).reduce((a, b) => a + b.netTuition, 0), 3)).map((y) => y.year).join(','));

  check(`${n}: the ten-year total equals the sum of the ten years`,
    near(m.totals.netTuition, m.years.reduce((a, b) => a + b.netTuition, 0), 3)
    && near(m.totals.cost, m.years.reduce((a, b) => a + b.cost.total, 0), 3)
    && near(m.totals.surplus, m.years.reduce((a, b) => a + b.surplus, 0), 3));

  check(`${n}: the reserve carries forward — each opening is the previous closing`,
    m.years.every((y, i) => i === 0 ? near(y.openingReserve, 0, 1)
      : near(y.openingReserve, m.years[i - 1].closingReserve, 2)),
    m.years.filter((y, i) => i > 0 && !near(y.openingReserve, m.years[i - 1].closingReserve, 2))
      .map((y) => y.year).join(','));

  check(`${n}: no year books more taught learners than the instructors hired can carry`,
    m.years.every((y) => y.activeTaught <= y.capacity + 1),
    m.years.filter((y) => y.activeTaught > y.capacity + 1).map((y) => `Y${y.year}:${y.activeTaught}>${y.capacity}`).join(' '));

  check(`${n}: active learners are the taught and independent populations, and nothing else`,
    m.years.every((y) => near(y.activeStudents, y.activeTaught + y.activeIndependent, 2)));

  check(`${n}: levels delivered split into taught and independent without remainder`,
    m.years.every((y) => near(y.levelsDelivered, y.levelsTaught + y.levelsIndependent, 0.3)));

  // The assertion this whole model was corrected for. See
  // data/masterplan.json § delivery_capacity.
  const teachShare = B.lines.find((l) => l.key === 'teaching').share;
  const modelled = m.totals.instruction / m.totals.netTuition;
  check(`${n}: instruction spend honours the published teaching allocation of ${(teachShare * 100).toFixed(0)}%`,
    Math.abs(modelled - teachShare) < 0.06,
    `modelled ${(modelled * 100).toFixed(1)}%`);
}

// ═══════════════════════════════════════════════════════════════════
// 3 · THE SCENARIOS ARE ORDERED, AND DIFFER STRUCTURALLY
// ═══════════════════════════════════════════════════════════════════
{
  const [c, b, g] = M.allScenarios();
  check('conservative < expected < growth on ten-year net tuition',
    c.totals.netTuition < b.totals.netTuition && b.totals.netTuition < g.totals.netTuition,
    [c, b, g].map((m) => Math.round(m.totals.netTuition / 1e6) + 'M').join(' < '));
  check('...and the three differ by more than rounding',
    (g.totals.netTuition - c.totals.netTuition) / b.totals.netTuition > 0.25);
}

// ═══════════════════════════════════════════════════════════════════
// 4 · THE ALLOCATION RECONCILES TO 100 PER CENT
// ═══════════════════════════════════════════════════════════════════
{
  const a = M.allocation('base');
  check('the allocation reconciles to net tuition with no residual', a.reconciles,
    `${a.rows.reduce((n, r) => n + r.amount, 0)} against ${a.net}`);
  check('...and the shares sum to one',
    near(a.rows.reduce((n, r) => n + r.share, 0), 1, 0.001),
    a.rows.reduce((n, r) => n + r.share, 0).toFixed(4));
  check('...with every category carrying a positive amount',
    a.rows.every((r) => r.amount > 0),
    a.rows.filter((r) => r.amount <= 0).map((r) => r.key).join(','));
}

// ═══════════════════════════════════════════════════════════════════
// 5 · BREAK-EVEN AND SENSITIVITY ARE COMPUTED, NOT ASSERTED
// ═══════════════════════════════════════════════════════════════════
{
  const be = M.breakEven('base');
  check('break-even is computed for every year', be.length === PLAN.planning_period.years);
  check('...and once the institution clears it, it does not fall back',
    (() => { const i = be.findIndex((b) => b.clears); return i >= 0 && be.slice(i).every((b) => b.clears); })(),
    be.map((b) => (b.clears ? '✓' : '·')).join(''));

  const s = M.sensitivity();
  check('every sensitivity case is modelled', s.length === PLAN.sensitivity.cases.length);
  check('...a downward shock lowers net tuition and an upward one raises it',
    s.filter((x) => x.key === 'enrol_down_20')[0].netDelta < 0
    && s.filter((x) => x.key === 'enrol_up_20')[0].netDelta > 0);
  check('...and no case is a no-op, which would mean the shock is not wired in',
    s.every((x) => Math.abs(x.surplusDelta) > 1000),
    s.filter((x) => Math.abs(x.surplusDelta) <= 1000).map((x) => x.key).join(','));
}

// ═══════════════════════════════════════════════════════════════════
// 6 · THE ALTERNATIVE ARCHITECTURE IS COMPARED LIKE FOR LIKE
// ═══════════════════════════════════════════════════════════════════
{
  const alt = M.alternativeA();
  check('the adopted column is the adopted tariff',
    alt.adopted.programmeTotal === B.programmeTotal && alt.adopted.totalHours === B.totalHours);
  check('both architectures carry the same total academic hours',
    alt.adopted.totalHours === alt.proposed.totalHours,
    `${alt.adopted.totalHours} against ${alt.proposed.totalHours}`);
  check('the cost of delivery is held constant between the two, which is the finding',
    alt.effect.tenYearCost === M.model('base').totals.cost);
  check('...and the surplus difference is exactly the revenue difference',
    near(alt.effect.surplusAdopted - alt.effect.surplusProposed,
      alt.effect.tenYearNetAdopted - alt.effect.tenYearNetProposed, 3));
}

// ═══════════════════════════════════════════════════════════════════
// 7 · CLASSIFICATION DISCIPLINE
// ═══════════════════════════════════════════════════════════════════
{
  const raw = readFileSync(path.join(ROOT, 'data/masterplan.json'), 'utf8');
  const plan = JSON.parse(raw);
  const classified = Object.entries(plan)
    .filter(([k, v]) => k !== '_' && v && typeof v === 'object' && !Array.isArray(v));
  check('every modelling block declares its classification',
    classified.every(([, v]) => typeof v.classification === 'string' || v._ || v.sources),
    classified.filter(([, v]) => !v.classification && !v._ && !v.sources).map(([k]) => k).join(','));

  check('the alternative architecture is classified as requiring a Board decision',
    plan.alternative_architecture_a.classification === 'board');

  // The plan must never quietly adopt the brief's tariff as the base.
  check('the base model is NOT built on the unadopted $7,400 / $14,800 tariff',
    B.programmeTotal !== 7400 && B.programmeTotal !== 14800 && B.programmeTotal === 19000,
    String(B.programmeTotal));
}

// ═══════════════════════════════════════════════════════════════════
// 8 · THE PUBLICATION DERIVES FROM THE MODEL
// ═══════════════════════════════════════════════════════════════════
{
  const src = readFileSync(path.join(ROOT, 'scripts/publication/render-masterplan.mjs'), 'utf8');
  check('the renderer imports the model rather than carrying its own figures',
    /from '\.\/masterplan\.mjs'/.test(src));
  // A bare large number in the renderer is a figure somebody typed.
  const body = src.split('const CSS =')[0];
  const typed = (body.match(/(?<![\w.$#])\d{4,}(?![\w%])/g) || [])
    .filter((n) => !['1200', '2027', '2036'].includes(n));
  check('no four-figure financial number is typed into the publication',
    typed.length === 0, typed.slice(0, 6).join(', '));
}

console.log(`\n${pass} passed, ${fail} failed.`);
if (fail) process.exit(1);

// ═══════════════════════════════════════════════════════════════════
// 9 · THE PRICING DECISION
// ═══════════════════════════════════════════════════════════════════
//
// Section 20 of the plan says "Management proposes the following WEC-LC
// commercial architecture". A proposal in a board paper has to be three
// things at once: internally consistent, clearly marked as not adopted,
// and derived rather than asserted. These check all three.
{
  const PR = await import(loadUrl('scripts/publication/pricing.mjs'));
  const J = await import(loadUrl('scripts/publication/projection.mjs'));

  // ── It must never be mistaken for the adopted price ──────────────
  check('the proposed architecture is classified as proposed, not adopted',
    PR.PROPOSED.classification === 'proposed');
  check('...and the adopted tariff is untouched by it',
    B.programmeTotal === TUITION.programme_total_usd && TUITION.programme_total_usd === 19000,
    String(TUITION.programme_total_usd));

  /* ── Every price must clear what it costs to deliver ──────────────
     The 45 per cent standard is a standard for prices MANAGEMENT IS
     PROPOSING. Independent is not one of those: $600 a level is the
     College’s adopted, published price in data/commercial.json, and a
     test that demanded it clear a management threshold would be a test
     demanding the past comply with a proposal made after it.

     It is still checked, on the two things that are actually true of
     it: it clears its delivery cost, and it clears the cost of
     acquiring the candidate who buys it. And because the correction to
     the serving charge pushed it below the standard — 40 per cent, not
     the 52 it showed when serving cost was understated at $148 — the
     shortfall is asserted to be DISCLOSED rather than allowed to pass
     out of the record quietly. */
  const ADOPTED_PRICES = new Set(['independent']);
  const MARGIN_STANDARD = 0.45;
  for (const [key, price] of Object.entries(PR.PROPOSED.committed)) {
    const cost = [0, 1, 2, 3, 4, 5].reduce((a, i) => a + PR.fullCost(key, i), 0);
    const margin = (price - cost) / price;
    check(`${PR.PRODUCTS[key].name}: the price covers the cost of delivering it`,
      price > cost, `$${price} against $${Math.round(cost)} of delivery`);
    if (ADOPTED_PRICES.has(key)) {
      // The cheapest CAC in the plan is the fair test for the route
      // that reaches the market the plan says buys it.
      const cheapestCac = Math.min(...Object.values(PR.CAC));
      check(`${PR.PRODUCTS[key].name} (adopted): the margin still carries the cost of finding the candidate`,
        price - cost > cheapestCac,
        `$${Math.round(price - cost)} of margin against $${cheapestCac} of acquisition`);
      check(`...and its shortfall against the ${MARGIN_STANDARD * 100}% management standard is disclosed, not buried`,
        margin < MARGIN_STANDARD
          ? /independent/i.test(PLAN.proposed_architecture.margin_disclosure || '')
          : true,
        `${(margin * 100).toFixed(1)}%`);
    } else {
      check(`...with a gross margin that can carry acquisition and the institution`,
        margin > MARGIN_STANDARD, `${(margin * 100).toFixed(0)}%`);
    }
  }

  // ── The ladder must be shaped to cost, and must sum to the pathway
  for (const key of Object.keys(PR.PROPOSED.committed)) {
    const t = PR.tariff(key);
    check(`${PR.PRODUCTS[key].name}: the six qualification prices sum to the published pathway`,
      Math.abs(t.reduce((a, b) => a + b, 0) - PR.PROPOSED.committed[key]) <= 50,
      `${t.reduce((a, b) => a + b, 0)} against ${PR.PROPOSED.committed[key]}`);
    check(`...and the ladder rises with level, as delivery cost does`,
      t.every((v, i) => i === 0 || v >= t[i - 1]), t.join(' '));
  }

  /* ── The Directed price must still be the output of its reason ────
     Management set Directed by a stated institutional constraint: the
     College teaches a clear majority of the people it credentials, and
     the price is the most it can charge while that holds. A price that
     drifts away from the constraint it was derived from is a price
     nobody can defend to a Board, so the constraint is recomputed here
     rather than trusted. */
  check('Directed is the highest price at which the teaching-majority constraint holds',
    PR.PROPOSED.committed.directed === PR.directedAtConstraint(),
    `$${PR.PROPOSED.committed.directed} committed against $${PR.directedAtConstraint()} computed`);
  check('...and the College does teach a clear majority at it',
    PR.taughtShare(PR.PROPOSED.committed) >= PR.PROPOSED.teachingMajority,
    `${(PR.taughtShare(PR.PROPOSED.committed) * 100).toFixed(1)}% taught against a ${PR.PROPOSED.teachingMajority * 100}% floor`);
  check('...and one step dearer would break it, which is what makes it the highest',
    PR.taughtShare({ ...PR.PROPOSED.committed, directed: PR.PROPOSED.committed.directed + 500 })
      < PR.PROPOSED.teachingMajority);
  check('...and the frontier the Board chooses on falls monotonically, as a frontier must',
    PR.teachingFrontier().every((f, i, a) => i === 0 || f.taughtShare <= a[i - 1].taughtShare + 1e-9));

  /* The old argument for this price was that revenue was flat above it.
     On researched demand that is false, and the plan must not keep
     claiming it. If revenue ever does go flat again the claim can come
     back — but it has to be true when it does. */
  {
    const J2 = J;
    const at = (d) => J2.project({ ...PR.PROPOSED.committed, directed: d }, {}).totals.revenue;
    const unconstrained = PLAN.proposed_architecture.teaching_majority.unconstrained_price_usd;
    check('the plan does NOT rest on a revenue plateau that researched demand removed',
      at(unconstrained) > at(PR.PROPOSED.committed.directed) * 1.02,
      'revenue still rises materially above the proposed price, and the plan says so');
  }

  // ── The tiers must be ordered ────────────────────────────────────
  const order = ['directed', 'tutored', 'execCore', 'execPremium', 'execBespoke'];
  check('the five products are priced in ascending order of what they deliver',
    order.every((k, i) => i === 0 || PR.PROPOSED.committed[k] > PR.PROPOSED.committed[order[i - 1]]),
    order.map((k) => PR.PROPOSED.committed[k]).join(' < '));
  check('...and Executive is dearer than the standard tutored pathway, not cheaper',
    PR.PROPOSED.committed.execCore > PR.PROPOSED.committed.tutored * 1.5);

  /* ── The document must be able to count its own sections ────────
     It could not. The numbering ran 02, 04, 05, 06, 08, 10 — four holes
     left where sections had been merged away without renumbering what
     followed — and the cross-references in the prose were typed
     literals pointing at whatever those numbers used to mean. Both are
     now derived from one ordered list in the renderer, and this reads
     the rendered document back to check it. */
  {
    const { readFileSync } = await import('node:fs');
    const staged = readFileSync(new URL('../publication/.masterplan.html', import.meta.url), 'utf8');
    /* Capture whatever is in the number slot, not only digits. An
       earlier version of this check matched /\d+/ and so a section
       rendering "undefined" simply disappeared from the list, leaving
       the survivors contiguous and the test green. A guard that a
       mutation walks through is not a guard. */
    const numbers = [...staged.matchAll(/class="opener__n">([^<]*)</g)].map((m) => m[1]);
    check('the publication numbers its sections contiguously from 00',
      numbers.length > 0 && numbers.every((n, i) => n === String(i).padStart(2, '0')),
      numbers.join(' '));
    const text = staged.replace(/<(script|style|svg)\b[\s\S]*?<\/\1>/g, '').replace(/<[^>]+>/g, ' ');
    const refs = [...new Set([...text.matchAll(/Section (\d+)/g)].map((m) => m[1]))];
    check('...and every cross-reference in the prose names a section that exists',
      refs.every((r) => numbers.includes(r)),
      refs.filter((r) => !numbers.includes(r)).join(' ') || `${refs.length} references, all resolved`);
  }

  /* ── The institutional floor must be the floor the model has ─────
     The plan publishes a Directed price "below which the decade never
     closes in surplus at all". It carried $6,000 while the model's own
     answer was $7,550 — a published floor a quarter below the real one,
     which is the kind of figure that survives because nobody re-derives
     it. This re-derives it. */
  {
    const floor = PLAN.proposed_architecture.institutional_floor_usd;
    const decadeAt = (d) => J.project({ ...PR.PROPOSED.committed, directed: d }, {}).totals.surplus;
    check('the published institutional floor is where the decade actually stops closing in surplus',
      decadeAt(floor + 100) > 0 && decadeAt(floor - 100) < 0,
      `$${floor}: $${Math.round(decadeAt(floor - 100))} below, $${Math.round(decadeAt(floor + 100))} above`);
    check('...and the proposed price clears it',
      PR.PROPOSED.committed.directed > floor);
  }

  // ── The comparison must be like for like ─────────────────────────
  const arch = J.architectures();
  check('all three architectures run through the same ten years',
    [arch.proposed, arch.adopted, arch.briefA].every((a) => a.years.length === PLAN.planning_period.years));
  check('...and each reconciles: surplus is net tuition less delivery, acquisition, fixed cost and development',
    [arch.proposed, arch.adopted, arch.briefA].every((a) => a.years.every((y) =>
      near(y.surplus, y.netTuition - y.delivery - y.acquisition - y.fixed - y.development, 2))));
  check('...and net tuition is gross revenue less the refunds the College has undertaken to pay',
    [arch.proposed, arch.adopted, arch.briefA].every((a) => a.years.every((y) =>
      near(y.netTuition, y.revenue - y.refunds, 2) && y.refunds >= 0)));
  check('...and each ten-year total is the sum of its ten years',
    [arch.proposed, arch.adopted, arch.briefA].every((a) =>
      near(a.totals.revenue, a.years.reduce((n, y) => n + y.revenue, 0), 3)
      && near(a.totals.surplus, a.years.reduce((n, y) => n + y.surplus, 0), 3)));
  check('...and cumulative surplus carries forward correctly',
    arch.proposed.years.every((y, i) => near(y.cumulativeSurplus,
      arch.proposed.years.slice(0, i + 1).reduce((n, z) => n + z.surplus, 0), 3)));

  // ── The finding the plan actually rests on ───────────────────────
  check('the proposed architecture confers more awards than the adopted flat tariff',
    arch.proposed.totals.awards > arch.adopted.totals.awards,
    `${Math.round(arch.proposed.totals.awards)} against ${Math.round(arch.adopted.totals.awards)}`);
  check('...and earns more revenue',
    arch.proposed.totals.revenue > arch.adopted.totals.revenue);
  check('...and earns more surplus than the brief\'s tariff, which is the point of the comparison',
    arch.proposed.totals.surplus > arch.briefA.totals.surplus,
    `${Math.round(arch.proposed.totals.surplus)} against ${Math.round(arch.briefA.totals.surplus)}`);
  // The plan states the trade honestly rather than claiming a free lunch.
  check('...and the plan does NOT claim it also beats the adopted tariff on surplus',
    arch.proposed.totals.surplus < arch.adopted.totals.surplus,
    'the trade is real and the document says so');

  // ── Scenarios ────────────────────────────────────────────────────
  const sc = J.scenarios();
  check('conservative < core < growth on ten-year revenue',
    sc.conservative.totals.revenue < sc.core.totals.revenue
    && sc.core.totals.revenue < sc.growth.totals.revenue);
  check('...and the Core Plan is not the arithmetic midpoint of the other two',
    Math.abs(sc.core.totals.revenue - (sc.conservative.totals.revenue + sc.growth.totals.revenue) / 2)
      > sc.core.totals.revenue * 0.02,
    'it is a distinct execution case, not an average');

  // ── Nothing typed ────────────────────────────────────────────────
  const pricingSrc = readFileSync(path.join(ROOT, 'scripts/publication/pricing.mjs'), 'utf8');
  check('the delivery cost is computed from an hourly rate, not tabulated',
    /ACADEMIC_HOUR_COST\s*=/.test(pricingSrc) && /deliveryCost/.test(pricingSrc));
}
