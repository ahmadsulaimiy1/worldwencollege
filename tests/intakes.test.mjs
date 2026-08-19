// tests/intakes.test.mjs — the admissions calendar, and the one number
// that has to agree with itself in two files.
//
// ─────────────────────────────────────────────────────────────────────
// WHAT THIS HOLDS
// ─────────────────────────────────────────────────────────────────────
// The seat count is published in the intake panel and lives in
// data/standing.json with the rest of the College's attested figures.
// data/intakes.json holds the dates. Two files, one number visible to a
// reader, and that is precisely the arrangement that produced "three
// cohorts" on seven pages and "eight cohorts" in the record.
//
// So: the panel reads `seats_open` from the record and never from the
// calendar, and this fails the build if the calendar grows its own copy.
//
// ─────────────────────────────────────────────────────────────────────
// AND THE THING A COUNTDOWN DOES THAT NOTHING ELSE ON THE SITE DOES
// ─────────────────────────────────────────────────────────────────────
// It expires. A dated intake list is correct on the day it is written
// and wrong forever afterwards, and an expired countdown does not fail
// quietly — it advertises to every visitor that nobody has looked at
// the page since the date it names.
//
// The dates are therefore stored as a month and a day with no year, and
// js/intake.js resolves the next occurrence against the reader's clock.
// This checks the shape that makes that possible: no year anywhere, and
// a close that precedes its own teaching start within the cycle.

import { readFileSync } from 'node:fs';
import path from 'node:path';
import { ROOT } from './helpers.mjs';

let pass = 0, fail = 0;
const check = (label, cond, detail) => {
  console.log((cond ? 'PASS ' : 'FAIL ') + label + (cond || detail === undefined ? '' : ` — ${detail}`));
  cond ? pass++ : fail++;
};

const I = JSON.parse(readFileSync(path.join(ROOT, 'data/intakes.json'), 'utf8'));
const S = JSON.parse(readFileSync(path.join(ROOT, 'data/standing.json'), 'utf8'));

// ── 1 · THREE INTAKES, BOTH EDITIONS ─────────────────────────────────
check(`The calendar carries three intakes — ${I.intakes.length}`, I.intakes.length === 3);
check('And the record says three a year',
  S.cohorts.intakes_per_year === I.intakes.length,
  `standing says ${S.cohorts.intakes_per_year}, the calendar has ${I.intakes.length}`);

for (const intake of I.intakes) {
  check(`${intake.key}: named and termed in both editions`,
    Boolean(intake.en?.name && intake.en?.term && intake.ar?.name && intake.ar?.term));
}

// ── 2 · NO DATE CARRIES A YEAR ───────────────────────────────────────
// The whole reason the countdown cannot expire.
for (const intake of I.intakes) {
  check(`${intake.key}: closes on a month and a day, with no year — ${intake.closes}`,
    /^(0[1-9]|1[0-2])-(0[1-9]|[12]\d|3[01])$/.test(intake.closes), intake.closes);
  check(`${intake.key}: begins on a month and a day, with no year — ${intake.begins}`,
    /^(0[1-9]|1[0-2])-(0[1-9]|[12]\d|3[01])$/.test(intake.begins), intake.begins);
}

// ── 3 · THE SEAT COUNT HAS ONE HOME ──────────────────────────────────
{
  check('The record carries the seats open',
    Number.isInteger(S.reach?.seats_open) && S.reach.seats_open > 0,
    String(S.reach?.seats_open));

  // The calendar must NOT carry its own. Two copies of one number is
  // how the figure that is corrected stops being the figure that is
  // published.
  const raw = readFileSync(path.join(ROOT, 'data/intakes.json'), 'utf8');
  check('The calendar does not keep a second copy of the seat count',
    !/"seats_open"/.test(raw),
    'data/intakes.json declares seats_open; it belongs in data/standing.json, which records who '
    + 'attested it and when, and the panel reads it from there');

  // And the built pages publish the record's figure.
  const page = readFileSync(path.join(ROOT, 'admissions/index.html'), 'utf8');
  check(`The served page publishes the record's seat count — ${S.reach.seats_open}`,
    new RegExp(`<strong>${S.reach.seats_open}</strong>`).test(page));
}

// ── 4 · THE PANEL IS ON THE PAGES THAT NEED IT, IN BOTH EDITIONS ─────
for (const rel of ['index.html', 'ar/index.html', 'admissions/index.html', 'ar/admissions/index.html']) {
  const page = readFileSync(path.join(ROOT, rel), 'utf8');
  check(`${rel}: carries the intake panel`, /data-intake\b/.test(page));
  check(`${rel}: carries all three intakes`,
    (page.match(/data-intake-close=/g) || []).length === 3,
    `${(page.match(/data-intake-close=/g) || []).length} rows`);
}

// ── 5 · AND IT IS NOT SILENT ─────────────────────────────────────────
// A struck surface with a lit rim and no voice reads as a fault —
// CLAUDE.md §3.
{
  const sonics = readFileSync(path.join(ROOT, 'js/sonics.js'), 'utf8');
  check('The intake rows are in the sonics register', sonics.includes('.intake__row'));
}

console.log(`\n${pass} passed, ${fail} failed.`);
process.exit(fail ? 1 : 0);
