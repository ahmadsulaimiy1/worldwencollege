// THE SIX LEVEL PAGES, IN ARABIC, SAY THE SAME THINGS THE ENGLISH ONES DO.
//
// Two language editions of one page are two chances to be wrong, and
// only one of them is ever read by the person maintaining the site. The
// Arabic level pages are generated from the same curriculum record as
// the English ones precisely so they cannot drift — this file is what
// checks that the generator kept that promise, rather than trusting it.
//
// What is checked, and why each one:
//
//   · Every module carries an Arabic title. The generator throws on a
//     missing one, but a throw only fires when somebody runs the
//     generator. A curriculum change lands in the database first.
//
//   · The English title is still printed. It is the syllabus of record —
//     what the Complete Curriculum, the Assessment Handbook and the
//     learner's transcript all say — so an Arabic reader who cannot see
//     it cannot match the page to their own record.
//
//   · The numbers match the English edition exactly. Module counts,
//     taught hours, months, CEFR band, fee. A contradiction between two
//     language editions is worse than an error in one, because a reader
//     can find it and neither page tells them which is true.
//
//   · No English prose leaked into the Arabic body. A generated page is
//     assembled from fragments and the easy failure is a card whose
//     body was never translated.

import { readFileSync, existsSync } from 'node:fs';
import path from 'node:path';
import { ROOT } from './helpers.mjs';

let pass = 0, fail = 0;
const check = (label, cond, detail) => {
  console.log((cond ? 'PASS ' : 'FAIL ') + label + (cond || detail === undefined ? '' : ` — ${detail}`));
  cond ? pass++ : fail++;
};

const LEVELS = [1, 2, 3, 4, 5, 6];
const enPath = (n) => path.join(ROOT, 'study', `level-${n}`, 'index.html');
const arPath = (n) => path.join(ROOT, 'ar', 'study', `level-${n}`, 'index.html');

check('All six Arabic level pages are built', LEVELS.every((n) => existsSync(arPath(n))),
  LEVELS.filter((n) => !existsSync(arPath(n))).map((n) => `level-${n}`).join(', '));

const en = Object.fromEntries(LEVELS.map((n) => [n, existsSync(enPath(n)) ? readFileSync(enPath(n), 'utf8') : '']));
const ar = Object.fromEntries(LEVELS.map((n) => [n, existsSync(arPath(n)) ? readFileSync(arPath(n), 'utf8') : '']));

const ARABIC = /[؀-ۿ]/;

// ── 1 · Every module has an Arabic title, beside its English one ──────
{
  // The module table is the one place both scripts appear in the same
  // row, so it is where a missing translation would show.
  const badRow = [], noEnglish = [];
  for (const n of LEVELS) {
    const rows = [...ar[n].matchAll(/<tr><td><span dir="ltr">(\d+)<\/span><\/td><td>([^<]*)<\/td><td><span dir="ltr" lang="en">([^<]*)<\/span><\/td><\/tr>/g)];
    if (rows.length !== 10) { badRow.push(`level-${n} has ${rows.length} module rows, expected 10`); continue; }
    for (const [, seq, arTitle, enTitle] of rows) {
      if (!ARABIC.test(arTitle)) badRow.push(`level-${n} module ${seq}: "${arTitle}" is not Arabic`);
      if (!enTitle.trim()) noEnglish.push(`level-${n} module ${seq}`);
    }
  }
  check('Every module in every Arabic level page carries an Arabic title — 60 modules',
    badRow.length === 0, badRow.slice(0, 5).join(' · '));
  check('...and the English title of record is printed beside it',
    noEnglish.length === 0, noEnglish.slice(0, 5).join(' · '));
}

// ── 2 · The two editions agree about the facts ────────────────────────
{
  // Pulled out of the rendered stat row rather than from the database:
  // reading the record would only prove the record agrees with itself.
  // What matters is that the two PAGES agree, which is what a reader
  // comparing them sees.
  const stats = (html) => [...html.matchAll(/<div class="stat-row__item"><b>(?:<span dir="ltr">)?([^<]+)(?:<\/span>)?<\/b>/g)]
    .map((m) => m[1].trim());

  const mismatches = [];
  for (const n of LEVELS) {
    const e = stats(en[n]), a = stats(ar[n]);
    if (e.length !== a.length) { mismatches.push(`level-${n}: ${e.length} English figures vs ${a.length} Arabic`); continue; }
    for (let i = 0; i < e.length; i++) {
      if (e[i] !== a[i]) mismatches.push(`level-${n} figure ${i + 1}: English "${e[i]}" vs Arabic "${a[i]}"`);
    }
  }
  check('The Arabic and English editions publish identical figures — CEFR, modules, hours, months, fee',
    mismatches.length === 0, mismatches.slice(0, 6).join(' · '));

  // A check that only ever sees agreement proves nothing about its own
  // reach, so confirm it can tell two different figures apart.
  check('...and the comparison does distinguish a changed figure',
    stats('<div class="stat-row__item"><b>A1</b>')[0] === 'A1'
    && stats('<div class="stat-row__item"><b>A1</b>')[0] !== 'A2');
}

// ── 3 · Nothing untranslated leaked into the Arabic body ──────────────
{
  // Latin script is legitimate in these pages — CEFR codes, prices, the
  // programme's initials, award titles, the English module titles and
  // the English outcome statements — but every one of those is either
  // wrapped in dir="ltr" or sits in a lang="en" cell. A run of English
  // WORDS in the open is a fragment somebody forgot.
  const leaks = [];
  for (const n of LEVELS) {
    const body = ar[n]
      .replace(/<head>[\s\S]*?<\/head>/g, '')
      // Comments are not prose a reader sees, and the icon sprite
      // carries a long English one explaining how it was drawn. The
      // first version of this check reported it as an untranslated
      // fragment on all six pages.
      .replace(/<!--[\s\S]*?-->/g, '')
      .replace(/<svg[\s\S]*?<\/svg>/g, '')
      .replace(/<script[\s\S]*?<\/script>/g, '')
      // The chrome is shared and already covered by other checks.
      .replace(/<header[\s\S]*?<\/header>/g, '')
      .replace(/<footer[\s\S]*?<\/footer>/g, '')
      .replace(/<div class="topbar">[\s\S]*?<\/div>\s*<\/div>/g, '')
      // Everything deliberately set in Latin script declares itself.
      .replace(/<span dir="ltr"[^>]*>[\s\S]*?<\/span>/g, '')
      .replace(/<[^>]+>/g, ' ');
    // Four or more consecutive Latin words is prose, not a stray code.
    for (const m of body.matchAll(/(?:\b[A-Za-z][a-z']{2,}\b[ ,.;:]+){3,}\b[A-Za-z][a-z']{2,}\b/g)) {
      leaks.push(`level-${n}: "${m[0].trim().slice(0, 60)}"`);
    }
  }
  check('No untranslated English prose in the Arabic level pages',
    leaks.length === 0, leaks.slice(0, 4).join(' · '));
}

// ── 4 · The pair points at each other ─────────────────────────────────
{
  const wrong = [];
  for (const n of LEVELS) {
    if (!new RegExp(`class="topbar__lang" href="/ar/study/level-${n}/"`).test(en[n])) {
      wrong.push(`English level-${n} does not switch to its Arabic edition`);
    }
    if (!new RegExp(`class="topbar__lang" href="/study/level-${n}/"`).test(ar[n])) {
      wrong.push(`Arabic level-${n} does not switch to its English edition`);
    }
    if (!new RegExp(`hreflang="ar" href="[^"]*/ar/study/level-${n}/"`).test(en[n])) {
      wrong.push(`English level-${n} declares no Arabic alternate`);
    }
  }
  check('Each level page and its Arabic edition point at each other', wrong.length === 0,
    wrong.slice(0, 6).join(' · '));
}

// ── 5 · The awards keep their official titles ─────────────────────────
{
  // An award is a defined object with an official title and a
  // post-nominal. Translating either would create a second award that
  // nobody has defined and nobody can confer — so the Arabic page
  // prints the title as it stands and explains it in Arabic beside it.
  const TITLES = {
    1: 'English Aspirant of Albalagh International Premium College',
    2: 'English Candidate of Albalagh International Premium College',
    3: 'English Associate of Albalagh International Premium College',
    4: 'English Envoy of Albalagh International Premium College',
    5: 'English Orator of Albalagh International Premium College',
    6: 'English Laureate of Albalagh International Premium College',
  };
  const missing = LEVELS.filter((n) => !ar[n].includes(TITLES[n]));
  check('Every Arabic level page prints its award\'s official title unaltered',
    missing.length === 0, missing.map((n) => `level-${n}`).join(', '));

  // And says, in Arabic, that nothing has been conferred.
  // Whitespace-normalised: the sentence wraps across a line in the
  // generated HTML, and the first version of this check failed on all
  // six pages for a newline between "ولم" and "تُمنح".
  const flat = (h) => h.replace(/\s+/g, ' ');
  const silent = LEVELS.filter((n) => !/لم تُمنح لأحد|لم تمنح لأحد/.test(flat(ar[n])));
  check('...and each says in Arabic that the award has been conferred on nobody',
    silent.length === 0, silent.map((n) => `level-${n}`).join(', '));
}

console.log(`\n${pass} passed, ${fail} failed.`);
process.exit(fail ? 1 : 0);
