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
