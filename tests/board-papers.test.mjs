// A BOARD PAPER IS A PROPOSAL. IT MUST NOT LEAK ONTO THE SITE.
//
// docs/board-paper-01-commercial-architecture.md recommends replacing
// the College's entire tuition architecture. It is not adopted. Until
// the Board resolves, every figure in it is a suggestion, and a
// suggestion that reaches a public page is a price a real applicant
// will try to pay.
//
// The failure this guards is not malice. It is a session six weeks from
// now reading the Board Paper, finding it more complete and better
// reasoned than the live tuition page — which it is — and treating it as
// the source of truth. That is exactly the mistake a good document
// invites.
//
// So: the recommended figures may live in the paper and nowhere else,
// and the live record must still hold the price the Board has actually
// approved. When the Board adopts it, this file is what gets rewritten
// to point the other way — and the rewrite is the moment somebody has
// to look at it deliberately.
import { readFileSync, readdirSync, existsSync } from 'node:fs';
import { DatabaseSync } from 'node:sqlite';
import path from 'node:path';
import { ROOT } from './helpers.mjs';

let pass = 0, fail = 0;
const check = (label, cond, detail) => {
  console.log((cond ? 'PASS ' : 'FAIL ') + label + (cond || detail === undefined ? '' : ` — ${detail}`));
  cond ? pass++ : fail++;
};

const PAPER = 'docs/board-paper-01-commercial-architecture.md';
const paper = readFileSync(path.join(ROOT, PAPER), 'utf8');

check('The commercial Board Paper exists', paper.length > 4000, `${paper.length} chars`);
check('...and says on its face that it is not adopted',
  /NOT ADOPTED/.test(paper) && /NOT PUBLISHED/.test(paper));

// ---------------------------------------------------------------------
// 1 · THE RECOMMENDED FIGURES ARE NOT ON THE SITE
// ---------------------------------------------------------------------
// Matched with a currency symbol and a word boundary so "690" inside a
// lesson count or a pixel value cannot trip it.
const RECOMMENDED = [690, 740, 880, 1140, 1380, 1650, 4980, 415, 430, 3900, 3600];
const money = (n) => new RegExp(`\\$${n.toLocaleString('en-US')}\\b|\\$${n}\\b`);

const publicDirs = ['pages', 'partials'];
const pageFiles = publicDirs.flatMap((d) => {
  const dir = path.join(ROOT, d);
  return existsSync(dir)
    ? readdirSync(dir).filter((f) => f.endsWith('.html')).map((f) => path.join(d, f))
    : [];
});
check(`Public sources exist to check — ${pageFiles.length}`, pageFiles.length > 50);

const leaked = [];
for (const rel of pageFiles) {
  const body = readFileSync(path.join(ROOT, rel), 'utf8');
  for (const n of RECOMMENDED) {
    if (money(n).test(body)) leaked.push(`${rel}: $${n}`);
  }
}
check('No recommended figure appears on a public page', leaked.length === 0,
  leaked.slice(0, 6).join(', '));

// ---------------------------------------------------------------------
// 2 · THE RECORD STILL HOLDS THE APPROVED PRICE
// ---------------------------------------------------------------------
const db = new DatabaseSync(':memory:');
db.exec(readFileSync(path.join(ROOT, 'sql/schema.sql'), 'utf8'));
const prices = db.prepare('SELECT DISTINCT price_usd_cents AS c FROM programme_levels').all();
check('programme_levels still carries the Board-approved price, not the proposal',
  prices.length === 1 && prices[0].c === 316667,
  prices.map((p) => `$${(p.c / 100).toFixed(2)}`).join(', '));

// ---------------------------------------------------------------------
// 3 · THE PAPER'S OWN ARITHMETIC HOLDS
// ---------------------------------------------------------------------
// A Board Paper whose figures do not add up is worse than no paper: it
// invites a decision on numbers nobody checked. These are the four
// claims the recommendation actually rests on.
// PARSED FROM THE PAPER, NOT COPIED FROM IT.
//
// The first version of this block hard-coded the six figures. Changing
// $1,650 to $1,600 in the paper's own table left the test green — it was
// checking that its own copy of the numbers added up, which it always
// will. That is the same defect as a sitemap that agrees with the site
// by coincidence, and it is the defect this whole suite exists to catch.
//
// Read from the recommendation table, so the arithmetic checked is the
// arithmetic the Board will actually be shown.
const SINGLE = [...paper.matchAll(/^\| (?:Foundation|Development|Application|Professional|Advanced|Mastery) \| [A-Z]+ \| \*\*\$([\d,]+)\*\* \|/gm)]
  .map((m) => Number(m[1].replace(/,/g, '')));
check(`The recommendation table lists six prices — ${SINGLE.length}`, SINGLE.length === 6,
  SINGLE.join(' '));
const pathwayMatch = paper.match(/All six, committed at entry: \$([\d,]+)/);
check('...and names the committed pathway price', !!pathwayMatch,
  pathwayMatch ? pathwayMatch[1] : 'not found');
const PATHWAY = pathwayMatch ? Number(pathwayMatch[1].replace(/,/g, '')) : NaN;

// The stated totals, also read rather than assumed.
const statedSum = Number((paper.match(/\*\*Six taken singly\*\* \| \*\*\$([\d,]+)\*\*/) || [])[1]
  ?.replace(/,/g, ''));
const statedSaving = Number((paper.match(/The saving is \$([\d,]+)/) || [])[1]?.replace(/,/g, ''));
check('The paper states a total for the six', Number.isFinite(statedSum), statedSum);
check('...and states the saving', Number.isFinite(statedSaving), statedSaving);
const sum = SINGLE.reduce((a, b) => a + b, 0);
check(`The six single prices total what the paper states — $${sum.toLocaleString('en-US')} vs $${statedSum?.toLocaleString('en-US')}`,
  sum === statedSum);
check(`The pathway saving is what the paper states — $${(sum - PATHWAY).toLocaleString('en-US')}`,
  sum - PATHWAY === statedSaving);
check('...and it does exceed the first two qualifications combined, as the paper claims',
  sum - PATHWAY > SINGLE[0] + SINGLE[1], `${sum - PATHWAY} vs ${SINGLE[0] + SINGLE[1]}`);
const twelve = Number((paper.match(/\*\*\$([\d,]+) a month\*\* for twelve months/) || [])[1]?.replace(/,/g, ''));
check(`The twelve-month plan divides exactly — $${twelve} x 12`, PATHWAY / 12 === twelve, PATHWAY / 12);
const monthly18 = Number((paper.match(/\| Pathway, eighteen instalments \| \*\*\$([\d,]+) a month\*\*/) || [])[1]
  ?.replace(/,/g, ''));
const final18 = Number((paper.match(/with the last payment \$([\d,]+)/) || [])[1]?.replace(/,/g, ''));
check(`The eighteen-month plan reaches the total — $${monthly18} x 17 + $${final18}`,
  monthly18 * 17 + final18 === PATHWAY, monthly18 * 17 + final18);
check('Tuition rises at every stage, as the architecture claims',
  SINGLE.every((v, i) => i === 0 || v > SINGLE[i - 1]), SINGLE.join(' '));
// The Board directed: no retail pricing.
check('No figure is set at a retail price point', SINGLE.every((v) => v % 100 !== 99));

// ---------------------------------------------------------------------
// 4 · THE PAPER STILL CARRIES ITS OWN LIMITS
// ---------------------------------------------------------------------
// These are the sentences most likely to be trimmed by someone tidying
// the document before a meeting, and each is load-bearing.
for (const [what, re] of [
  ['that the independent learner route stays closed', /RECOMMENDED, DEFERRED|Keep the independent learner route closed/],
  ['that a marker rate must be set in the same resolution', /set a marker rate/i],
  ['that no revenue forecast is offered, and why', /no applicants|fabrication with a chart/i],
  ['that two premium benchmarks could not be retrieved', /could not be retrieved|refused those hosts/i],
]) {
  check(`The paper still records ${what}`, re.test(paper));
}

console.log(`\n${pass} passed, ${fail} failed.`);
process.exit(fail ? 1 : 0);
