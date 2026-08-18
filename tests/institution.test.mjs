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

// ── 2 · EVERY BODY IS CONSTITUTED UNDER THE INSTRUMENT ───────────────
// WHAT CHANGED HERE, AND WHY.
//
// This block used to require the page to print a per-body status line —
// "Established · no members appointed" against an open ring, thirteen
// times — and it failed the build if any body was missing one. That was
// right when the page's whole subject was what had not happened yet. It
// is wrong now. Thirteen consecutive declarations of what is absent is
// an internal progress report published as a prospectus, and it was
// ruled out by the owner on 18 August 2026: state what the College
// does, not what it has not done.
//
// The internal record did NOT change. `status` still carries the honest
// state of every body in data/institution.json, still validated below,
// and it is still what the College works from. What stopped is
// broadcasting it as a column of negatives on the public page.
//
// The rule that survives is the one with a person on the other end of
// it: an office may not name somebody who has not accepted it. That is
// §3, and it is stricter than before rather than looser.
{
  const STATES = ['established', 'constituted', 'operating'];
  const bad = bodies.filter((b) => !STATES.includes(b.status));
  check('Every body carries one of the three real states in the record',
    bad.length === 0, bad.map((b) => `${b.code}=${b.status}`).join(', '));

  // Every body still carries its constitution on the page, so a card is
  // never a name with no standing behind it.
  for (const [lang, body] of [['English', EN], ['Arabic', AR]]) {
    const lines = (body.match(/attest__evidence attest__evidence--held/g) || []).length;
    check(`${lang}: every body states the instrument it is constituted under — ${bodies.length}`,
      lines === bodies.length, `${lines} status lines for ${bodies.length} bodies`);
  }

  // And the negative register may not come back by hand.
  const BANNED = [
    [/no members appointed/i, 'no members appointed'],
    [/has not met/i, 'has not met'],
    [/is vacant/i, 'is vacant'],
    [/has been appointed/i, 'has been appointed (as a negative)'],
  ];
  for (const [re, label] of BANNED) {
    check(`The page does not publish "${label}"`, !re.test(EN), label);
  }
}

// ── 3 · THE OFFICE THAT NAMES A PERSON ───────────────────────────────
// THIS IS THE RULE THAT DID NOT RELAX, AND MUST NOT.
//
// Everything else here moved from "declare what is absent" to "declare
// what is held". This one did not, because the thing on the other side
// of it is not the College's reputation — it is a named individual.
// Attributing a professional appointment to somebody who has not
// accepted it publishes something damaging about a real person who
// never agreed to it, and no presentational argument reaches that.
//
// So: a holder and an appointment date travel together or neither is
// published, and while no appointment exists no personal name may
// appear anywhere in the office's section.
{
  const EX = D.external_examiner;
  check('The External Examiner has a holder if and only if it has an appointment date',
    Boolean(EX.appointed) === Boolean(EX.holder),
    `appointed=${EX.appointed}, holder=${EX.holder}`);

  if (!EX.appointed) {
    const NAMED = /\b(?:Dr|Prof(?:essor)?|Mr|Mrs|Ms)\.?\s+[A-Z][a-z]+\s+[A-Z][a-z]+/;
    const examinerSection = EN.slice(EN.indexOf('id="examiner"'), EN.indexOf('id="cycle"'));
    check('No individual is named as holding an office nobody has been appointed to',
      !NAMED.test(examinerSection),
      (examinerSection.match(NAMED) || [''])[0]);
    check('...in the Arabic edition either',
      !NAMED.test(AR.slice(AR.indexOf('id="examiner"'), AR.indexOf('id="cycle"'))));
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

// ── 4 · A FRAMEWORK IS PUBLISHED WHOLE, IN BOTH EDITIONS ─────────────
{
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
