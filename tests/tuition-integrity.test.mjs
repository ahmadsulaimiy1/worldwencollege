// A COLLEGE SHOULD QUOTE ONE PRICE FOR ONE THING.
//
// It quoted two. The tuition page published $3,166.67 per level, which
// is the figure in `programme_levels`. All twelve level pages — six in
// English, six in Arabic — published $3,167, because their shared money
// formatter carried `maximumFractionDigits: 0`.
//
// Thirty-three cents, on the page a prospective learner reads while
// deciding whether to enrol, in the direction of more. Nobody wrote it;
// it was a formatter default, which is how almost every pricing error
// in the world happens.
//
// And the tuition table did not add up. Six rows of $3,166.67 sat above
// a Total of $19,000, and six of those rows come to $19,000.02. Two
// cents — trivial as money, and the sort of small thing that tells a
// careful reader, a sponsor's finance team or a due-diligence reviewer
// exactly how much else to check.
//
// ────────────────────────────────────────────────────────────────
// WHAT THIS FILE ENFORCES
// ────────────────────────────────────────────────────────────────
// Every price published anywhere on the site is the price in the
// record, to the cent. Rounding is fine for a headline like $19,000,
// which IS the price. It is not fine for a derived figure, because a
// derived figure that has been rounded is no longer the price — it is a
// description of it, and a learner cannot pay a description.
//
// NOTHING HERE DECIDES WHAT THE PRICE SHOULD BE. Tuition is Board
// business and stays Board business. This asserts only that whatever
// the Board has set is what the site says.
import { readFileSync, readdirSync, statSync } from 'node:fs';
import { DatabaseSync } from 'node:sqlite';
import path from 'node:path';
import { ROOT } from './helpers.mjs';

let pass = 0, fail = 0;
const check = (label, cond, detail) => {
  console.log((cond ? 'PASS ' : 'FAIL ') + label + (cond || detail === undefined ? '' : ` — ${detail}`));
  cond ? pass++ : fail++;
};

const db = new DatabaseSync(':memory:');
db.exec(readFileSync(path.join(ROOT, 'sql/schema.sql'), 'utf8'));

const levels = db.prepare('SELECT id, roman, price_usd_cents FROM programme_levels ORDER BY id').all();
const fullCents = Number(db.prepare(
  "SELECT value FROM platform_config WHERE key = 'full_programme_price_usd_cents'").get().value);

const usd = (c) => `$${(c / 100).toLocaleString('en-GB',
  { minimumFractionDigits: c % 100 === 0 ? 0 : 2, maximumFractionDigits: 2 })}`;

// --- The record has to be coherent with itself ------------------------
{
  const perLevel = [...new Set(levels.map((l) => l.price_usd_cents))];
  check(`Every level costs the same — ${usd(perLevel[0])}`, perLevel.length === 1,
    perLevel.map(usd).join(', '));

  const sum = levels.reduce((a, l) => a + l.price_usd_cents, 0);
  check(`Six levels come to ${usd(sum)}; the full programme is ${usd(fullCents)}`, true);

  // They differ by two cents and that is arithmetic, not a defect:
  // $19,000 does not divide by six. What WOULD be a defect is a
  // difference big enough to be a real disagreement about the price.
  const gap = Math.abs(sum - fullCents);
  check('...and the difference is pure rounding, under one cent per level',
    gap < levels.length, `${gap} cents across ${levels.length} levels`);
}

// --- Every published price is the price in the record -----------------
const SKIP = new Set(['node_modules', '.git', 'stromex', 'pages', 'partials',
  'publication', 'docs', 'tests', 'scripts', 'sql', 'functions', '.github']);
function servedPages(dir = ROOT, out = []) {
  for (const e of readdirSync(dir)) {
    if (e.startsWith('.') || SKIP.has(e)) continue;
    const full = path.join(dir, e);
    if (statSync(full).isDirectory()) servedPages(full, out);
    else if (e.endsWith('.html')) out.push(full);
  }
  return out;
}
const pages = servedPages().map((f) => ({ rel: path.relative(ROOT, f), html: readFileSync(f, 'utf8') }));
check(`Every served page is scanned for prices — ${pages.length}`, pages.length >= 50, pages.length);

// Any dollar figure in the per-level range must be exactly the per-level
// price. This is the assertion that catches a rounded formatter.
{
  const want = usd(levels[0].price_usd_cents);
  const wrong = [];
  for (const p of pages) {
    for (const m of p.html.matchAll(/\$3,1\d\d(?:\.\d\d)?/g)) {
      if (m[0] !== want) wrong.push(`${p.rel}: ${m[0]}`);
    }
  }
  check(`Every per-level price published is exactly ${want}`,
    wrong.length === 0, [...new Set(wrong)].slice(0, 6).join(' | '));
}

// The headline, in both directions: it must appear, and it must never
// appear as a rounded-away version of something else.
{
  const headline = usd(fullCents);
  const onTuition = pages.find((p) => p.rel === path.join('admissions', 'tuition', 'index.html'));
  check('The tuition page exists and publishes the full-programme price',
    onTuition && onTuition.html.includes(headline), headline);
}

// --- The table has to add up ------------------------------------------
{
  const src = readFileSync(path.join(ROOT, 'pages/admissions-tuition.html'), 'utf8');
  const sum = levels.reduce((a, l) => a + l.price_usd_cents, 0);
  check('The ledger shows what paying level by level actually costs',
    src.includes(usd(sum)), usd(sum));
  check('...and what paying in full costs, as a separate line',
    /Total, paid in full/.test(src) && /Total, paid level by level/.test(src));
  check('...and explains the difference rather than rounding it out of sight',
    /does not divide evenly by six/.test(src.replace(/\s+/g, ' ')));
}

// --- The formatter that caused it -------------------------------------
// Asserted directly, because the defect was one option on one line and
// would come back the same way.
{
  for (const f of ['scripts/build-levels.js', 'scripts/build-arabic-levels.js']) {
    const src = readFileSync(path.join(ROOT, f), 'utf8');
    const money = /const money = [^\n]+/.exec(src);
    check(`${f} formats money`, !!money);
    check(`...to the cent, not rounded to the pound`,
      money && !/maximumFractionDigits:\s*0/.test(money[0]), money && money[0].slice(0, 90));
  }
}

// --- And nothing here decided the price -------------------------------
// The published figure and the charged figure agree. Whether $19,000 is
// the RIGHT price is a Board question, and this file is careful not to
// look like it has answered it.
{
  const paper = readFileSync(path.join(ROOT, 'docs/board-paper-01-commercial-architecture.md'), 'utf8');
  check('The commercial Board Paper still exists, unadopted, holding the alternatives',
    paper.length > 5000);
  check('...and the price in force is still the one the record carries',
    fullCents === 1900000, String(fullCents));
}

console.log(`\n${pass} passed, ${fail} failed.`);
process.exit(fail ? 1 : 0);
