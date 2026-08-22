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
const RECOMMENDED = [
  840, 920, 1240, 1760, 2140, 2600, 9500, 7400,   // Directed
  2180, 2290, 2760, 3480, 4060, 4780, 19550, 14800, // Tutored
  6900, 5600, 5200, 10400, 2400, 540, 180, 260, 95, // ecosystem
];
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
// The first version of this block hard-coded the figures. Changing a
// price in the paper's own table left the test green — it was checking
// that its own copy of the numbers added up, which it always will. Same
// shape as a sitemap agreeing with a site by coincidence, which is the
// defect this whole suite exists to catch.
//
// Read from the recommendation tables, so the arithmetic checked is the
// arithmetic the Board will actually be shown.
const STAGES = 'Foundation|Development|Application|Professional|Advanced|Mastery';
const SINGLE = [...paper.matchAll(new RegExp(
  `^\\| (?:${STAGES}) \\| [A-Z]+ \\| \\*\\*\\$([\\d,]+)\\*\\* \\|`, 'gm'))]
  .map((m) => Number(m[1].replace(/,/g, '')));
check(`The Directed table lists six prices — ${SINGLE.length}`, SINGLE.length === 6, SINGLE.join(' '));

const TUTORED = [...paper.matchAll(new RegExp(
  `^\\| (?:${STAGES}) \u00b7 [A-Z]+ \\| \\*\\*\\$([\\d,]+)\\*\\* \\| \\$([\\d,]+) \\|`, 'gm'))]
  .map((m) => Number(m[1].replace(/,/g, '')));
check(`The Tutored table lists six prices — ${TUTORED.length}`, TUTORED.length === 6, TUTORED.join(' '));

const num = (re) => Number((paper.match(re) || [])[1]?.replace(/,/g, ''));
const PATHWAY = num(/\| \| \*\*Pathway, committed at entry\*\* \| \*\*\$([\d,]+)\*\* \| \|/);
const TUT_PATHWAY = num(/^\| \*\*Pathway, committed at entry\*\* \| \*\*\$([\d,]+)\*\* \| \|$/m);
check('...and the Directed pathway price', Number.isFinite(PATHWAY), PATHWAY);

const statedSum = num(/\| \*\*Six taken singly\*\* \| \*\*\$([\d,]+)\*\* \|/);
const statedSaving = num(/The commitment saving is \*\*\$([\d,]+)\*\*/);
check('The paper states a total for the six', Number.isFinite(statedSum), statedSum);
check('...and states the saving', Number.isFinite(statedSaving), statedSaving);
const sum = SINGLE.reduce((a, b) => a + b, 0);
check(`The six single prices total what the paper states — $${sum.toLocaleString('en-US')} vs $${statedSum?.toLocaleString('en-US')}`,
  sum === statedSum);
check(`The pathway saving is what the paper states — $${(sum - PATHWAY).toLocaleString('en-US')}`,
  sum - PATHWAY === statedSaving);
check('...and it does exceed the first two qualifications combined, as the paper claims',
  sum - PATHWAY > SINGLE[0] + SINGLE[1], `${sum - PATHWAY} vs ${SINGLE[0] + SINGLE[1]}`);
// Instalments: rounded payment plus a stated final payment, and the two
// must reach the total. The paper says explicitly that it does not
// choose totals because they divide neatly, so the test must not assume
// they do.
const plans = [...paper.matchAll(
  /\| ([A-Za-z ]+pathway, [a-z-]+ months?) \| \*\*\$([\d,]+) a month\*\*, final payment \$([\d,]+)/g)]
  .map((m) => ({ name: m[1], monthly: Number(m[2].replace(/,/g, '')), final: Number(m[3].replace(/,/g, '')) }));
check(`Every payment plan states a monthly and a final payment — ${plans.length}`,
  plans.length === 3, plans.map((p) => p.name).join(', '));
const months = { 'twelve months': 12, 'twenty-four months': 24 };
const planErrors = plans.filter((p) => {
  const n = months[Object.keys(months).find((k) => p.name.endsWith(k))];
  const total = p.name.startsWith('Tutored') ? TUT_PATHWAY : PATHWAY;
  return !n || p.monthly * (n - 1) + p.final !== total;
});
check('...and each reaches its pathway total exactly', planErrors.length === 0,
  planErrors.map((p) => `${p.name}: ${p.monthly}+${p.final}`).join(', '));

check('Tuition rises at every stage, as the architecture claims',
  SINGLE.every((v, i) => i === 0 || v > SINGLE[i - 1]), SINGLE.join(' '));
// The Board directed: no retail pricing.
check('No figure is set at a retail price point', SINGLE.every((v) => v % 100 !== 99));

check('Every Tutored price exceeds its Directed price',
  TUTORED.every((t, i) => t > SINGLE[i]), TUTORED.join(' '));
// The premium is contact hours, so it must widen as the qualification
// demands a more senior tutor. A flat premium would be a margin.
const premiums = TUTORED.map((t, i) => t - SINGLE[i]);
check('...and the tutored premium widens at every stage',
  premiums.every((v, i) => i === 0 || v > premiums[i - 1]), premiums.join(' '));

// ---------------------------------------------------------------------
// 4 · THE PAPER STILL CARRIES ITS OWN LIMITS
// ---------------------------------------------------------------------
// These are the sentences most likely to be trimmed by someone tidying
// the document before a meeting, and each is load-bearing.
for (const [what, re] of [
  ['that the independent learner route stays closed', /RECOMMENDED, DEFERRED|Keep the independent learner route closed/],
  ['that a marker rate must be set in the same resolution', /marker rate/i],
  ['that no revenue forecast is offered, and why', /no applicants|fabrication with a chart/i],
  ['that two premium benchmarks could not be retrieved', /could not be retrieved|refused the network/i],
  ['that the tutored tier may not be sold before tutors exist', /before it is sold|Tutors are appointed/i],
  ['that a tutor rate must be set alongside the marker rate', /tutor rate/i],
  ['that the College never hears a learner speak', /never once hears the learner speak|never hears the learner/i],
  ['that the qualification does not differ between tiers', /It does not sell different amounts of qualification/],
  ['both options, as the Board directed', /Option A .{0,10}Premium Digital College/ ],
  ['...and the second of them', /Option B .{0,10}Premium Global English College/],
  ['what Option B requires before it may be sold', /What must be built/],
  ['that Option B brings a payroll, which Option A does not', /acquires a payroll/],
  ['that growth under Option B is bounded by hiring', /bounded by hiring/],
  ['that speaking assessment is delivered under Option A too', /a learner should not\s*\n?\s*have to buy a tier to be heard/],
  ['that recorded interaction is capped rather than pretended', /Proficient.{0,40}no further|async_ceiling/i],
]) {
  check(`The paper still records ${what}`, re.test(paper));
}

// ---------------------------------------------------------------------
// Board Paper 02 — Data Protection
// ---------------------------------------------------------------------
// The inventory in section 2 is GENERATED from processing_activities.
// A paper whose figures are typed is a paper that drifts from the thing
// it describes, and this one exists precisely because the governance
// register and the database had drifted.
{
  const raw = readFileSync(path.join(ROOT, 'docs/board-paper-02-data-protection.md'), 'utf8');
  // Prose in these documents wraps, so a sentence is one thing to a
  // reader and several lines to a regex. Matching the raw text has now
  // produced a false failure twice — here and in the governance
  // register — so the whitespace-normalised copy is what phrase
  // assertions read. Line-structure assertions still use `raw`.
  const flat = raw.replace(/\s+/g, ' ');
  const paper = raw;
  const pdb = new DatabaseSync(':memory:');
  pdb.exec(readFileSync(path.join(ROOT, 'sql/schema.sql'), 'utf8'));
  const acts = pdb.prepare('SELECT * FROM processing_activities ORDER BY sequence').all();

  check('The paper is marked for decision, not for information',
    /\*\*Status: for decision\.\*\*/.test(paper));
  check(`Every processing activity appears in the inventory — ${acts.length}`,
    acts.every((a) => paper.includes(a.name)),
    acts.filter((a) => !paper.includes(a.name)).map((a) => a.code).join(', '));
  check('...and the higher-risk ones are marked as such in the paper',
    acts.filter((a) => a.higher_risk === 1).every((a) => {
      const row = paper.split('\n').find((l) => l.includes(a.name));
      return row && /\*\*Yes\*\*/.test(row);
    }));

  const undetermined = acts.filter((a) => a.retention === 'NOT DETERMINED').length;
  check(`The paper counts the undetermined retentions correctly — ${undetermined}`,
    new RegExp(`\\*\\*${undetermined === 9 ? 'Nine' : undetermined}\\*\\* are not determined|${undetermined === 9 ? 'Nine' : undetermined} are not determined`, 'i').test(paper),
    `${undetermined} undetermined in the record`);

  check('It puts four decisions to the Board', (paper.match(/^### Decision \d/gm) || []).length === 4,
    (paper.match(/^### Decision \d/gm) || []).length);
  check('...each with options and consequences', (paper.match(/\| Option \| Consequence \|/g) || []).length >= 1);
  check('...and each with a recommendation', (paper.match(/\*\*Recommendation[:,]/g) || []).length >= 4,
    (paper.match(/\*\*Recommendation[:,]/g) || []).length);

  // The refusals that keep it honest.
  // The paper's refusal, restated after a correction. An earlier draft
  // said the College had published no privacy notice at all; it has,
  // at /support/privacy/, and I missed it by surveying one directory
  // deep. The refusal that survives is the one that matters: the page
  // is not to be completed with plausible text where a decision
  // belongs.
  check('It refuses to fill the notice\'s gaps with text where decisions belong',
    /Filling those blanks with plausible text/.test(flat));
  check('...and owns the error rather than quietly rewriting the paper',
    /\*\*Correction, and it is mine\.\*\*/.test(flat));
  check('...and reports that the page understated what had been decided',
    /previously described as open|previously said otherwise/.test(flat));
  check('...and does not claim the College is compliant with anything',
    /is progress and it is not compliance/.test(flat));
  check('It reports the D1 finding rather than presenting a clean history',
    /was still not in force/.test(flat) && /luck, not design/.test(flat));
}

console.log(`\n${pass} passed, ${fail} failed.`);
process.exit(fail ? 1 : 0);
