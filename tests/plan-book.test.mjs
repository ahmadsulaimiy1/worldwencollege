/**
 * THE BOARD & INVESTMENT EDITION SAYS WHAT THE MODEL SAYS, AND SAYS IT
 * THE WAY THE OWNER RULED.
 *
 * The book is composed without a browser and read whole. It must carry
 * no broken value, no page reference to nothing, none of the shouted
 * status labels the owner retired, no price per hour, no claim of
 * recognition the College does not hold, and every stage in the order
 * the owner set.
 */
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const { compose } = await import(path.join(ROOT, 'scripts/plan/book/compose.mjs'));

let pass = 0, fail = 0;
const check = (label, cond, detail) => {
  console.log((cond ? 'PASS ' : 'FAIL ') + label + (cond || detail === undefined ? '' : ` — ${detail}`));
  cond ? pass++ : fail++;
};

const { F, html } = compose();
const body = html.slice(html.indexOf('<body>'));
const text = body.replace(/<style[\s\S]*?<\/style>/g, '').replace(/<svg[\s\S]*?<\/svg>/g, (s) => s.replace(/<[^>]+>/g, ' ')).replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ');

// ── Nothing broken ──────────────────────────────────────────────────
const broken = text.match(/\b(undefined|NaN|Infinity|null)\b|\[object Object\]/g) || [];
check('no value in the book is undefined, NaN, infinite or an object', broken.length === 0, [...new Set(broken)].join(', '));
const ids = new Set([...body.matchAll(/\sid="([^"]+)"/g)].map((m) => m[1]));
const refs = [...body.matchAll(/data-ref="([^"]+)"/g)].map((m) => m[1]);
const dangling = refs.filter((r) => !ids.has(r));
check('every page reference points at something in the book', dangling.length === 0, dangling.join(', '));

// ── The order the owner set ─────────────────────────────────────────
const STAGES = ['Institutional doctrine', 'Academic architecture', 'Market architecture', 'Commercial architecture',
  'Operating model', 'Financial model', 'Ten-year roadmap', 'Governance', 'Investment case', 'Appendices'];
const at = STAGES.map((s) => body.indexOf(`<h1>${s}</h1>`));
check('the ten stages open in the order the owner set', at.every((p, i) => p > 0 && (i === 0 || p > at[i - 1])), at.join(' '));
check('the plan in brief comes before the first stage', body.indexOf('id="brief"') > 0 && body.indexOf('id="brief"') < at[0]);

// ── The voice the owner ruled ───────────────────────────────────────
/* Ruled at the reset: internal uncertainty is stated once, in the Basis
   of the Plan, not shouted page by page. */
for (const label of ['PROPOSED — NOT ADOPTED', 'NOT ADOPTED', 'BOARD DECISION REQUIRED', 'WHAT IS NOT CLAIMED', 'NO ACTION', 'MODELLED', 'INTERIM', 'TO BE CONFIRMED']) {
  check(`the book never shouts “${label}”`, !text.toUpperCase().includes(label) || !new RegExp(`\\b${label}\\b`).test(text), label);
}
check('no price is quoted per hour', !/\$[\d,.]+\s*(an|per|\/)\s*hour/i.test(text) && !/per contact hour/i.test(text));
check('no fee is divided by hours anywhere in the book', !/(fee|price|tariff)[^.]{0,40}\bper hour\b/i.test(text));

// ── Honest about what the College holds ─────────────────────────────
check('the College is never said to be accredited, recognised or partnered',
  !/\b(College|WEC-LC|qualification|award)\b[^.]{0,20}\b(is|are|was|has been) (accredited|recognised|recognized|endorsed)\b|accredited by|in partnership with/i.test(text));
check('...and the book says plainly that it will hold none of these when it opens', /hold no accreditation, recognition or partnership/.test(text));
check('no office is published with a person in it', !/\b(Dr|Prof|Professor|Mr|Mrs|Ms)\.? [A-Z][a-z]+/.test(text));

// ── The book's numbers are the model's ──────────────────────────────
const m = (n) => `$${(n / 1e6).toFixed(2)}M`;
check('the capital the book asks for is the capital the model needs', text.includes(m(F.capital)), m(F.capital));
for (const r of F.routes) {
  check(`${r.name}: the book prints the solved level fee`, text.includes(`$${r.fee.toLocaleString('en-US')}`), r.fee);
}
check('the book prints every year of the roadmap', F.RY.every((y) => body.includes(`id="y${y.year}"`)));
check('the register prints every assumption', (body.match(/<tr class="">[^]*?<\/tr>/g) || []).length >= F.register.length);

console.log(`\n${pass} passed, ${fail} failed.`);
process.exitCode = fail ? 1 : 0;
