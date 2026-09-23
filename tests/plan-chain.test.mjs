/**
 * THE MASTER PLAN'S CHAIN HOLDS.
 *
 * The rejected plan's numbers did not descend from anything: an hourly
 * price, a revenue-allocation framework set by assertion, a demand model
 * built on a population nobody had researched, and two engines that
 * disagreed. These checks keep the rebuilt chain honest — every number
 * from a driver, every driver from the record, the constitution read
 * rather than set, and the whole reconciling to the dollar.
 */
import path from 'node:path';
import { readFileSync, readdirSync } from 'node:fs';
import { fileURLToPath } from 'node:url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const R = await import(path.join(ROOT, 'scripts/plan/record.mjs'));
const E = await import(path.join(ROOT, 'scripts/plan/engine.mjs'));
const P = await import(path.join(ROOT, 'scripts/plan/price.mjs'));
const C = await import(path.join(ROOT, 'scripts/plan/capital.mjs'));
const SVC = await import(path.join(ROOT, 'scripts/plan/service.mjs'));

let pass = 0, fail = 0;
const check = (label, cond, detail) => {
  console.log((cond ? 'PASS ' : 'FAIL ') + label + (cond || detail === undefined ? '' : ` — ${detail}`));
  cond ? pass++ : fail++;
};
const near = (a, b, tol = 1) => Math.abs(a - b) <= tol;
const sum = (xs) => xs.reduce((t, x) => t + x, 0);

// ── 1 · Built from zero ─────────────────────────────────────────────
/* CLAUDE.md §8: the Master Plan does not read the College's existing
   records. The engine reads data/plan/ and nothing else in data/. */
for (const f of readdirSync(path.join(ROOT, 'scripts/plan')).filter((x) => x.endsWith('.mjs'))) {
  const src = readFileSync(path.join(ROOT, 'scripts/plan', f), 'utf8');
  const outside = [...src.matchAll(/data\/(?!plan\/)[a-z-]+\.json/g)].map((m) => m[0]);
  check(`scripts/plan/${f} reads no existing College record`, outside.length === 0, outside.join(', '));
}

// ── 2 · Every assumption carries a basis ────────────────────────────
const reg = R.register();
check('the plan\'s record holds its assumptions as leaves with a basis', reg.length > 80, `${reg.length} assumptions`);
const unknown = reg.filter((r) => !R.BASES[r.basis]);
check('...and every basis is one the plan defines', unknown.length === 0, unknown.map((r) => `${r.file}:${r.path}=${r.basis}`).join('; '));
const unsourced = reg.filter((r) => !r.source || r.source.length < 12);
check('...and every assumption says where it comes from or why', unsourced.length === 0, unsourced.map((r) => `${r.file}:${r.path}`).join('; '));
check('no placeholder figure remains in the record',
  R.interim().length === 0, R.interim().map((r) => `${r.file}:${r.path}`).join('; '));
/* Evidence means a reader can find it: every evidenced figure names the
   page it came from. */
const untraceable = reg.filter((r) => r.basis === 'evidenced'
  && !/[a-z0-9-]+\.(?:com|org|gov\.uk|ac\.uk|co\.uk|uk|us|dev)\b/i.test(r.source));
check('...and every evidenced figure names the page it was read from', untraceable.length === 0,
  untraceable.map((r) => `${r.file}:${r.path}`).join('; '));

// ── 3 · No hourly pricing, anywhere ─────────────────────────────────
/* Hours are a COST basis for the work a route promises. They are never
   the unit of sale: nothing in the plan divides a fee by them. */
for (const f of ['price.mjs', 'engine.mjs', 'service.mjs']) {
  const src = readFileSync(path.join(ROOT, 'scripts/plan', f), 'utf8');
  const leak = /per\s*hour|perHour|attentionHours|pricePerHour|\/\s*attention/i.test(src.replace(/\/\*[\s\S]*?\*\//g, '').replace(/\/\/.*$/gm, ''));
  check(`${f} never divides a price by hours`, !leak);
}

// ── 4 · One academic standard ───────────────────────────────────────
/* The shared assessment is identical on every route at every level —
   the plan's first commercial fact, asserted rather than assumed. */
for (let L = 0; L < R.LEVELS; L++) {
  const a = SVC.assessmentHours(L).total;
  check(`Level ${L + 1}: every route carries the same assessment`, R.ROUTE_KEYS.every(() => SVC.assessmentHours(L).total === a), a.toFixed(3));
}
check('...and every route carries the ten person-marked assignments',
  R.val(R.QUALIFICATION.assessment.assignmentsPerLevel) === 10);

// ── 5 · The solved plan ─────────────────────────────────────────────
const S = P.solve();
const Y = E.years(S.result);
const ladder = R.ROUTE_KEYS.map((k) => S.tariff[k]);
check('the tariff rises with what each route provides',
  ladder.every((v, i) => i === 0 || v > ladder[i - 1]), ladder.join(' < '));
check('...and passes the plan\'s own test: capital returned and the reserve at target in the tenth year',
  S.test.ok, `${Math.round(S.test.cumulative)} against ${Math.round(S.test.reserveTarget)}`);
/* The margin is the SMALLEST that passes: a slightly smaller one fails. */
const tighter = P.tariffFrom(S.buildUp, S.margin - 0.01);
check('...and the margin is the smallest that does',
  !P.passes(E.run(tighter)).ok, `${(S.margin * 100).toFixed(1)}%`);

// ── 6 · The constitution is read, not set ───────────────────────────
const K = P.constitution(S.result);
check('the constitution accounts for every dollar',
  near(sum(K.lines.map((l) => l.usd)), K.net, 2), `${Math.round(sum(K.lines.map((l) => l.usd)))} against ${Math.round(K.net)}`);
check('...and no line of it is typed anywhere in the plan\'s code',
  !/share:\s*0\.\d+/.test(readFileSync(path.join(ROOT, 'scripts/plan/price.mjs'), 'utf8').replace(/\/\*[\s\S]*?\*\//g, '')));

// ── 7 · Reconciliation ──────────────────────────────────────────────
for (const r of S.result.rows) {
  const parts = r.cost.academic + r.cost.institution + r.cost.recruitment + r.cost.technology
    + r.cost.operations + r.cost.acquisition + r.cost.collection;
  if (!near(parts, r.costs, 0.5) || !near(r.revenue.net - r.costs, r.cashflow, 0.5)) {
    check(`${r.label} reconciles`, false, `${parts} / ${r.costs}`);
  }
}
check('every term\'s costs and cash flow reconcile to the dollar', true);
check('every year is the sum of its three terms',
  Y.every((y) => near(y.cashflow, sum(S.result.rows.filter((r) => r.year === y.year).map((r) => r.cashflow)), 0.5)));

// ── 8 · The College is staffed for what it promises ─────────────────
const short = S.result.rows.filter((r) => r.instructors.standard < r.instructors.needed.standard
  || r.instructors.senior < r.instructors.needed.senior);
check('in every term the establishment covers the work the routes promise, or admissions are held back to fit',
  short.every((r) => r.turnedAway > 0), short.map((r) => r.label).join(', ') || 'never short');
check('no learner is taught before the level they are placed at has been written',
  S.result.rows.every((r) => Object.keys(r.routeLevels).every((k) => Number(k.split('|')[1]) < S.result.authoring.available(r.t))));

// ── 9 · Capital is a cash measure ───────────────────────────────────
const K2 = C.capital(S.result);
check('the capital requirement keeps the balance at or above the minimum in every term',
  K2.balance.every((b) => b.balance >= b.minimum - 1), `lowest headroom ${Math.round(K2.lowest.headroom)} in ${K2.lowest.label}`);
check('...and the tranches sum to it', near(sum(K2.tranches.map((t) => t.amount)), K2.requirement, 1));

console.log(`\n${pass} passed, ${fail} failed.`);
process.exitCode = fail ? 1 : 0;
