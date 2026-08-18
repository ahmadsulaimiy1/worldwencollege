// tests/institution.test.mjs — a governance chart cannot flatter itself.
//
// ─────────────────────────────────────────────────────────────────────
// WHAT THIS FILE IS FOR
// ─────────────────────────────────────────────────────────────────────
// The quality architecture is the easiest page on a college website to
// write and the easiest to make dishonest, because every sentence in it
// is about a body rather than about a fact. "The Assessment Integrity
// Committee reviews marking consistency" is true of the instrument the
// moment somebody types it, and says nothing whatever about whether
// anyone has ever reviewed any marking.
//
// So the page publishes a third column — the state of each office — and
// this file holds it to the same distinction the rest of the site
// draws:
//
//     established   the instrument exists; nobody is appointed
//     constituted   members appointed; it has not met
//     operating     it has met, and its decisions are minuted
//
// A body that has never met wears `#i-ring`, the open circle, and never
// `#i-struck`. That is CLAUDE.md §5, and it was a real defect on four
// pages before it was a rule.
//
// ─────────────────────────────────────────────────────────────────────
// AND THE ONE CLAIM THAT IS ABOUT A PERSON
// ─────────────────────────────────────────────────────────────────────
// Every other assertion on that page is about the College and can be
// corrected by the College. "Dr X is our External Examiner" is about Dr
// X: it attributes a professional appointment to a named individual,
// and if they have not accepted it, the College has published something
// damaging about somebody who never agreed to it.
//
// So the office is published as held only when the register carries
// BOTH a holder and an appointment date, and the page says the office is
// vacant in as many words until then.

import { readFileSync, existsSync } from 'node:fs';
import path from 'node:path';
import { ROOT } from './helpers.mjs';

let pass = 0, fail = 0;
const check = (label, cond, detail) => {
  console.log((cond ? 'PASS ' : 'FAIL ') + label + (cond || detail === undefined ? '' : ` — ${detail}`));
  cond ? pass++ : fail++;
};

const D = JSON.parse(readFileSync(path.join(ROOT, 'data/institution.json'), 'utf8'));
const page = (f) => readFileSync(path.join(ROOT, 'pages', f), 'utf8');
const EN = page('governance-quality.html');
const AR = page('governance-quality.ar.html');

const bodies = [
  { ...D.commission, kind: 'commission' },
  ...D.subcommittees.map((s) => ({ ...s, status: 'established', kind: 'subcommittee' })),
  ...D.bodies.map((b) => ({ ...b, kind: 'body' })),
];

// ── 1 · EVERY BODY IS PUBLISHED IN BOTH LANGUAGES ────────────────────
check(`The architecture holds standing bodies — ${bodies.length}`, bodies.length >= 12);
for (const b of bodies) {
  check(`${b.code}: named and given a remit in both editions`,
    Boolean(b.en?.name && b.ar?.name && b.en?.remit && b.ar?.remit));
  check(`${b.code}: appears on the English page`, EN.includes(b.en.name));
  check(`${b.code}: appears on the Arabic page`, AR.includes(b.ar.name));
}

// ── 2 · NOTHING WEARS A TICK IT HAS NOT EARNED ───────────────────────
{
  const STATES = ['established', 'constituted', 'operating'];
  const bad = bodies.filter((b) => !STATES.includes(b.status));
  check('Every body carries one of the three real states',
    bad.length === 0, bad.map((b) => `${b.code}=${b.status}`).join(', '));

  // The mark on the page must follow from the state, not from taste.
  // Counted on the rendered page: one status line per body, and a
  // struck mark only where a body is operating.
  for (const [lang, body] of [['English', EN], ['Arabic', AR]]) {
    const struck = (body.match(/attest__evidence--held/g) || []).length;
    const open = (body.match(/attest__evidence--open/g) || []).length;
    const operating = bodies.filter((b) => b.status === 'operating').length;
    check(`${lang}: struck marks equal the bodies that are operating — ${operating}`,
      struck === operating, `${struck} struck, ${open} open, ${operating} operating`);
    check(`${lang}: every body that has not met wears the open ring`,
      open === bodies.length - operating, `${open} open for ${bodies.length - operating} bodies`);
  }
}

// ── 3 · THE OFFICE THAT NAMES A PERSON ───────────────────────────────
{
  const EX = D.external_examiner;
  check('The External Examiner has a holder if and only if it has an appointment date',
    Boolean(EX.appointed) === Boolean(EX.holder),
    `appointed=${EX.appointed}, holder=${EX.holder}`);

  if (!EX.appointed) {
    check('English: the page says the office is vacant',
      /The office is vacant\. No External Examiner has been appointed/.test(EN));
    check('Arabic: the same', /المنصب شاغر\. لم يُعيَّن ممتحن خارجي/.test(AR));
    // And no name may appear in the office while it is vacant. This is
    // the check that would have caught a name pasted straight onto the
    // page from an email.
    const NAMED = /\b(?:Dr|Prof(?:essor)?|Mr|Mrs|Ms)\.?\s+[A-Z][a-z]+\s+[A-Z][a-z]+/;
    const examinerSection = EN.slice(EN.indexOf('id="examiner"'), EN.indexOf('id="cycle"'));
    check('...and no individual is named as holding a vacant office',
      !NAMED.test(examinerSection),
      (examinerSection.match(NAMED) || [''])[0]);
  } else {
    check('The appointment date is a real date', /^\d{4}-\d{2}-\d{2}$/.test(EX.appointed));
    check('English: the page names the holder', EN.includes(EX.holder));
    check('Arabic: the page names the holder', AR.includes(EX.holder));
  }

  check('The examiner’s review areas are published in both editions',
    EX.en.reviews.length === EX.ar.reviews.length && EX.en.reviews.length >= 7);
  for (const r of EX.en.reviews) {
    check(`English: the page lists "${r}"`, EN.includes(r));
  }
}

// ── 4 · A FRAMEWORK THAT HAS NOT RUN SAYS SO ─────────────────────────
{
  check('The annual cycle has completed no turns in the register',
    D.quality_review.turns_completed === 0,
    'if a cycle HAS turned, the page copy about producing nothing yet must be rewritten '
    + 'rather than left standing');
  if (D.quality_review.turns_completed === 0) {
    check('English: the page says the cycle has produced nothing yet',
      /No annual cycle has completed a turn against it/.test(EN));
    check('Arabic: the same', /ولم تُتِمّ أي دورة سنوية دورةً كاملة وفقه/.test(AR));
  }

  check('No observation is recorded in the register',
    D.observation.observations_recorded === 0);
  if (D.observation.observations_recorded === 0) {
    check('English: the page says no lesson has been observed under the framework',
      /No lesson has been observed under it/.test(EN));
    check('Arabic: the same', /ولم يُشاهَد درسٌ وفقه/.test(AR));
  }

  // The two editions must carry the same number of items, or one page
  // is publishing a framework the other does not have.
  check('The annual reviews match across editions',
    D.quality_review.en.reviews.length === D.quality_review.ar.reviews.length);
  check('The observation areas match across editions',
    D.observation.en.areas.length === D.observation.ar.areas.length);
  check('The excellence measures match across editions',
    D.excellence.en.measures.length === D.excellence.ar.measures.length);
}

// ── 5 · THE PAGE IS REACHABLE ────────────────────────────────────────
// A published page nothing links is the Library fault again: sixteen
// finished volumes existed for months and no page pointed at one.
{
  const manifest = JSON.parse(readFileSync(path.join(ROOT, 'pages/manifest.json'), 'utf8'));
  const list = Array.isArray(manifest) ? manifest : manifest.pages;
  for (const slug of ['governance-quality', 'governance-quality-ar']) {
    const entry = list.find((e) => e.slug === slug);
    check(`The manifest carries ${slug}`, Boolean(entry));
    if (entry) {
      check(`...and ${slug} points at a page that exists`,
        existsSync(path.join(ROOT, 'pages', entry.contentFile)), entry.contentFile);
    }
  }
  for (const [what, file, href] of [
    ['The English governance pillar', 'pages/governance.html', '/governance/quality/'],
    ['The Arabic governance pillar', 'pages/governance.ar.html', '/ar/governance/quality/'],
    ['The English header', 'partials/header.html', '/governance/quality/'],
    ['The Arabic header', 'partials/header.ar.html', '/ar/governance/quality/'],
  ]) {
    check(`${what} links the quality architecture`,
      readFileSync(path.join(ROOT, file), 'utf8').includes(`href="${href}"`));
  }
}

console.log(`\n${pass} passed, ${fail} failed.`);
process.exit(fail ? 1 : 0);
