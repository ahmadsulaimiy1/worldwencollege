// Run with: node tests/honour-labels.test.mjs
//
// ONE SET OF ARABIC RANK NAMES, NOT TWO.
//
// The five ranks are a published fact. /students/awards/ names them in
// English and /ar/students/awards/ names them in Arabic, and that pair
// of pages is where a reader is sent to learn what a rank means.
//
// The register now hands both names back on every award, because a
// graduate record built for an Arabic employer used to print "High
// Distinction" in the middle of an Arabic transcript. Handing the
// Arabic back means there is a second place the five names are written
// — which is exactly the drift this repository keeps guards for.
//
// This is that guard: functions/_lib/registry/awards.js and the two
// published pages must agree, rank for rank, or the build fails.
import { readFileSync } from 'node:fs';
import path from 'node:path';
import { ROOT, loadUrl } from './helpers.mjs';

const { HONOURS, HONOUR_LABEL, HONOUR_LABEL_AR } =
  await import(loadUrl('functions/_lib/registry/awards.js'));

let pass = 0, fail = 0;
const check = (label, cond, detail) => {
  console.log((cond ? 'PASS ' : 'FAIL ') + label + (cond || detail === undefined ? '' : ` — ${detail}`));
  cond ? pass++ : fail++;
};

// The headings of the rank cards, in source order, from each edition.
const headings = (file) => {
  const html = readFileSync(path.join(ROOT, file), 'utf8');
  const block = html.split('<h3>').slice(1).map((s) => s.split('</h3>')[0].trim());
  return block;
};

const en = headings('pages/students-awards.html');
const ar = headings('pages/students-awards.ar.html');

check('the register knows five ranks', HONOURS.length === 5, String(HONOURS.length));

for (const h of HONOURS) {
  check(`${h} has an English name`, Boolean(HONOUR_LABEL[h]), HONOUR_LABEL[h]);
  check(`...and an Arabic one`, Boolean(HONOUR_LABEL_AR[h]), HONOUR_LABEL_AR[h]);
  check(`...and the English name is a heading on /students/awards/`,
    en.includes(HONOUR_LABEL[h]), HONOUR_LABEL[h]);
  check(`...and the Arabic name is a heading on /ar/students/awards/`,
    ar.includes(HONOUR_LABEL_AR[h]), HONOUR_LABEL_AR[h]);
  check(`...and no Latin letter has leaked into the Arabic name`,
    !/[A-Za-z]/.test(HONOUR_LABEL_AR[h]), HONOUR_LABEL_AR[h]);
}

check('the register names no rank twice in English',
  new Set(Object.values(HONOUR_LABEL)).size === HONOURS.length);
check('...nor in Arabic',
  new Set(Object.values(HONOUR_LABEL_AR)).size === HONOURS.length);
check('the Arabic table names no rank the register does not have',
  Object.keys(HONOUR_LABEL_AR).every((k) => HONOURS.includes(k)));

console.log(`\n${pass} passed, ${fail} failed.`);
process.exit(fail ? 1 : 0);
