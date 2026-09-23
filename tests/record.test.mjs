/**
 * THE PLAN STARTS FROM THE INSTITUTION THAT EXISTS.
 *
 * The master plan modelled a College beginning in 2027 with thirty-four
 * learners, on a reachable market it called unresearched, while the
 * Principal's attested record — eight cohorts since 2023, more than
 * 22,000 learners in over 60 countries, awards conferred at Level I and
 * Level II — sat unread in data/standing.json. The Board paper then
 * told the Board that the College stood two appointments away from its
 * "first conferred award".
 *
 * These checks keep the plan tied to the record, and keep the record's
 * unreleased counts out of the plan.
 */
import path from 'node:path';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const R = await import(path.join(ROOT, 'scripts/publication/record.mjs'));
const S = JSON.parse(readFileSync(path.join(ROOT, 'data/standing.json'), 'utf8'));

let pass = 0, fail = 0;
const check = (label, cond, detail) => {
  console.log((cond ? 'PASS ' : 'FAIL ') + label + (cond || detail === undefined ? '' : ` — ${detail}`));
  cond ? pass++ : fail++;
};

// ── The record is read, not restated ───────────────────────────────
check('the plan reads the reach the College attests',
  R.REACH.learners === S.reach.learners && R.REACH.countries === S.reach.countries,
  `${R.REACH.learners} learners, ${R.REACH.countries} countries`);
check('...and the year it was inaugurated',
  R.INAUGURATED === S.inaugurated, String(R.INAUGURATED));
check('...and says who attested it and from what',
  Boolean(R.ATTESTED.by && R.ATTESTED.on && R.ATTESTED.source), JSON.stringify(R.ATTESTED));

// ── An unreleased count cannot be read quietly ─────────────────────
for (const key of Object.keys(S.counts).filter((k) => k !== 'released')) {
  let threw = false;
  try { R.released(key); } catch { threw = true; }
  check(`an unreleased count ("${key}") refuses to be read`,
    S.counts[key] != null || threw,
    S.counts[key] == null ? 'returned a value for a null count' : 'released');
}

// ── Neither Board document may deny a conferral the record attests ──
const DENIALS = /first conferred award|no award can be conferred|no award has (?:yet )?been conferred|has conferred no award/i;
for (const f of ['render-masterplan.mjs', 'render-monograph.mjs', 'plan-narrative.mjs']) {
  const src = readFileSync(path.join(ROOT, 'scripts/publication', f), 'utf8');
  check(`${f} does not deny a conferral the record attests`,
    !(R.CONFERRAL.conferred && DENIALS.test(src)),
    (src.match(DENIALS) || [''])[0]);
}
check('...and that sweep does catch the sentence that shipped',
  DENIALS.test('The two things standing between this College and its first conferred award are not engineering.'));

console.log(`\n${pass} passed, ${fail} failed.`);
process.exitCode = fail ? 1 : 0;
