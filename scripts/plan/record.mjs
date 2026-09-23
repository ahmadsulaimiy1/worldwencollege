/**
 * THE PLAN'S OWN RECORD — the one place a number enters the Master Plan.
 *
 * Every assumption lives in data/plan/*.json as a leaf { v, b, s, u }:
 * its value, its basis, its source or reasoning, and its unit. Nothing
 * in the engine types a planning number into code; it reads one from
 * here, which is what lets the Assumptions and Evidence Register at the
 * back of the book be generated rather than written, and lets the Basis
 * of Plan be exact about what is evidence and what is judgement.
 *
 * Built from zero (CLAUDE.md §8). This module reads data/plan/ and
 * nothing else in data/.
 */
import { readFileSync, readdirSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..');
const DIR = path.join(ROOT, 'data/plan');

export const BASES = {
  design: 'A specification or decision the plan makes for the institution',
  policy: 'A rule the institution will run by',
  evidenced: 'A published external source',
  management: 'A planning assumption, to be replaced by the College’s own measurement',
  interim: 'A placeholder awaiting evidence; may not be published',
};

const load = (name) => JSON.parse(readFileSync(path.join(DIR, `${name}.json`), 'utf8'));

export const QUALIFICATION = load('qualification');
export const ROUTES = load('routes');
export const PEOPLE = load('people');
export const PLATFORM = load('platform');
export const OPERATIONS = load('operations');
export const MARKETS = load('markets');
export const POLICY = load('policy');
export const PROGRESSION = load('progression');
export const SCENARIOS = load('scenarios');
export const COMPARABLES = load('comparables');
export const ROADMAP_TEXT = load('roadmap');

/** A leaf is any object carrying both a value and a basis. */
export const isLeaf = (x) => x && typeof x === 'object' && !Array.isArray(x) && 'v' in x && 'b' in x;

/** The value of a leaf; a plain value passes through unchanged. */
export const val = (x) => (isLeaf(x) ? x.v : x);

/**
 * Every assumption in the record, with the path it lives at. This IS the
 * Assumptions and Evidence Register: the appendix renders it, and the
 * tests walk it.
 */
export function register() {
  const rows = [];
  const files = readdirSync(DIR).filter((f) => f.endsWith('.json')).sort();
  for (const f of files) {
    const walk = (node, at) => {
      if (isLeaf(node)) {
        rows.push({ file: f, path: at, value: node.v, basis: node.b, source: node.s || '', unit: node.u || '' });
        return;
      }
      if (node && typeof node === 'object' && !Array.isArray(node)) {
        for (const [k, v] of Object.entries(node)) if (k !== '_') walk(v, at ? `${at}.${k}` : k);
      }
    };
    walk(load(f.replace(/\.json$/, '')), '');
  }
  return rows;
}

/** Figures the evidence sweep has yet to replace. The book will not
 *  render while any remain. */
export const interim = () => register().filter((r) => r.basis === 'interim');

// ── Time ────────────────────────────────────────────────────────────
export const FIRST_YEAR = val(POLICY.horizon.first);
export const LAST_YEAR = val(POLICY.horizon.last);
export const TERMS_PER_YEAR = val(QUALIFICATION.structure.termsPerYear);
export const TERMS = (LAST_YEAR - FIRST_YEAR + 1) * TERMS_PER_YEAR;
export const TERM_NAMES = ['Spring', 'Summer', 'Autumn'];

/** "2027-3" -> term index 2. Term 0 is Spring of the first year. */
export const termIndex = (label) => {
  const [y, n] = String(label).split('-').map(Number);
  return (y - FIRST_YEAR) * TERMS_PER_YEAR + (n - 1);
};
export const yearOf = (t) => FIRST_YEAR + Math.floor(t / TERMS_PER_YEAR);
export const termLabel = (t) => `${TERM_NAMES[t % TERMS_PER_YEAR]} ${yearOf(t)}`;

/** A per-year schedule { "2027": x, "2030": y } read as a step function:
 *  each year takes the latest stated value at or before it. */
export function stepValue(schedule, year) {
  let out = 0;
  for (const [y, v] of Object.entries(schedule).sort((a, b) => Number(a[0]) - Number(b[0]))) {
    if (Number(y) <= year) out = v;
  }
  return out;
}

export const LEVELS = val(QUALIFICATION.structure.levels);
export const ROUTE_KEYS = ROUTES.order;
export const MARKET_KEYS = MARKETS.order;
export const FX = val(POLICY.fxUsdPerGbp);
