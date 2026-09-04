// tests/rights.test.mjs — the licence is one instrument, everywhere.
//
// ─────────────────────────────────────────────────────────────────────
// WHAT THIS GUARDS
// ─────────────────────────────────────────────────────────────────────
// The College publishes its whole curriculum. That is the proposition,
// and it is not being withdrawn. What it did not do was say on what
// terms — eight of the eleven printed volumes carried no rights
// statement at any point in them, and the Library page granted
// "download, print, photocopy and quote" with nothing said about the one
// use that actually costs the College anything: another provider
// standing the curriculum up as its own programme.
//
// So there is now one instrument, in scripts/publication/rights.mjs, and
// it is read by the printed volumes AND by both editions of the Library
// page. This file exists because two copies of a licence are worse than
// one: the moment the page grants something the volume reserves, or the
// Arabic edition reserves something the English grants, the College is
// asserting two different terms to two different readers and neither is
// enforceable.
//
// ─────────────────────────────────────────────────────────────────────
// AND WHAT IT REFUSES TO GUARD
// ─────────────────────────────────────────────────────────────────────
// There is no check here that a volume cannot be copied, because no such
// check could pass. A PDF a reader can read is a PDF a reader can
// photograph, retype or extract, and the permission flags a file can
// carry are honoured by polite software and ignored by everything else.
// The last block below therefore checks the opposite: that the College
// SAYS SO, in both languages, rather than implying a protection it does
// not have. CLAUDE.md §5 — an overstated security claim is the same
// class of defect as an unfinished item wearing a tick.

import { readFileSync, existsSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import {
  HOLDER, CONTACT, SUMMARY, GRANTED, RESERVED, CHANNEL, TRACEABLE, NO_LOCK,
  SUMMARY_AR, GRANTED_AR, RESERVED_AR, CHANNEL_AR, TRACEABLE_AR, NO_LOCK_AR,
  editionMark, runningFoot, runningHead, rightsPage,
} from '../scripts/publication/rights.mjs';

const ROOT = path.dirname(path.dirname(fileURLToPath(import.meta.url)));
let pass = 0, fail = 0;
const check = (label, ok, detail) => {
  if (ok) { pass++; console.log(`PASS ${label}`); }
  else { fail++; console.log(`FAIL ${label}${detail ? ` — ${detail}` : ''}`); }
};

// Every renderer that produces a distributable volume. The Editorial
// Bible and the Production Specifications keep their own running heads
// (a distribution warning and a title line respectively), so they carry
// the mark in the foot only — `head: false` records that rather than
// leaving the difference to be rediscovered.
const RENDERERS = [
  { file: 'render-assessment.mjs', head: true },
  { file: 'render-canon.mjs', head: true },
  { file: 'render-listening.mjs', head: true },
  { file: 'render-pronunciation.mjs', head: true },
  { file: 'render-workbook.mjs', head: true },
  { file: 'render-companion.mjs', head: true },
  { file: 'render-press.mjs', head: true },
  { file: 'render-bible.mjs', head: false },
  { file: 'render-specs.mjs', head: false },
];

// ── 1 · EVERY VOLUME CARRIES THE INSTRUMENT ──────────────────────────
{
  const missing = [], noFoot = [], noHead = [], noPage = [];
  for (const r of RENDERERS) {
    const src = readFileSync(path.join(ROOT, 'scripts/publication', r.file), 'utf8');
    if (!src.includes("from './rights.mjs'")) missing.push(r.file);
    if (!/footerTemplate: runningFoot\(VOLUME,/.test(src)) noFoot.push(r.file);
    if (r.head && !/headerTemplate: runningHead\(MARK,/.test(src)) noHead.push(r.file);
    if (!/\$\{rightsPage\(\{/.test(src)) noPage.push(r.file);
  }
  check(`Every volume reads the one rights instrument — ${RENDERERS.length} renderers`,
    missing.length === 0, missing.join(', '));
  check('...and prints the volume, the holder and the mark in the foot of every page',
    noFoot.length === 0, noFoot.join(', '));
  check('...and the edition mark in the head, wherever the head is not already spoken for',
    noHead.length === 0, noHead.join(', '));
  check('...and carries a Rights and Permissions page',
    noPage.length === 0, noPage.join(', '));
}

// ── 2 · THE THREE THAT DO NOT USE rightsPage() STILL CARRY IT ────────
// The flagship curriculum states the licence through covers.mjs, and the
// DOCX/PDF twins state it through the shared block list. Different
// mechanisms, same instrument — so each is named and checked, rather
// than being quietly exempt because it did not match the pattern above.
{
  const cases = [
    ['scripts/publication/covers.mjs', 'the flagship imprint page',
      [/from '\.\/rights\.mjs'/, /GRANTED\.map/, /RESERVED\.map/, /NO_LOCK/]],
    ['scripts/publication/blocks.mjs', 'the shared block list',
      [/from '\.\/rights\.mjs'/, /rightsBlocks\(B, \{/, /editionMark\(/]],
    ['scripts/publication/render-docx.mjs', 'the editable edition’s running foot',
      [/from '\.\/rights\.mjs'/, /HOLDER/, /MARK/]],
    ['scripts/publication/render-pdf.mjs', 'the print edition’s running foot',
      [/from '\.\/rights\.mjs'/, /runningFoot\(/]],
    ['scripts/publication/render-flagship.mjs', 'the flagship’s running foot',
      [/from '\.\/rights\.mjs'/, /runningFoot\(EDITION\.file/]],
  ];
  for (const [file, what, pats] of cases) {
    const src = readFileSync(path.join(ROOT, file), 'utf8');
    const absent = pats.filter((p) => !p.test(src));
    check(`The instrument reaches ${what}`, absent.length === 0,
      `${file}: ${absent.map(String).join(', ')}`);
  }
}

// ── 3 · NO VOLUME CONTRADICTS THE LICENCE ────────────────────────────
// The flagship imprint used to read "No part of this publication may be
// reproduced, distributed or transmitted in any form without the prior
// written permission of the publisher" while the Library page invited
// the reader to photocopy it. Both were the College's own words, on the
// same material, in opposite directions. That sentence is now the one
// thing the publication pipeline may not say.
{
  const CONTRADICTS = /no part of this publication may be reproduced/i;
  const offenders = RENDERERS.map((r) => `scripts/publication/${r.file}`)
    .concat(['scripts/publication/covers.mjs', 'scripts/publication/blocks.mjs',
      'scripts/publication/render-curriculum-docx.mjs'])
    .filter((f) => existsSync(path.join(ROOT, f))
      && CONTRADICTS.test(readFileSync(path.join(ROOT, f), 'utf8')));
  check('No volume revives the all-rights-reserved clause the licence replaced',
    offenders.length === 0, offenders.join(', '));
}

// ── 4 · THE MARK IS A MARK: STABLE, AND DIFFERENT PER VOLUME ─────────
// An identifier that changes between two builds of the same content
// proves nothing, and one that is the same for every volume identifies
// nothing. Both properties are checked, because the mark is printed as
// evidence and evidence that does neither is decoration.
{
  const digest = 'a'.repeat(64);
  check('The edition mark is stable for the same volume and content',
    editionMark('workbook-1', digest) === editionMark('workbook-1', digest));
  check('...and different for a different volume of the same edition',
    editionMark('workbook-1', digest) !== editionMark('companion-1', digest));
  check('...and different when the content moves',
    editionMark('workbook-1', digest) !== editionMark('workbook-1', 'b'.repeat(64)));
  check('...and is legible as a College mark',
    /^WEC-LC·[0-9A-Z]{4}-[0-9A-Z]{4}$/.test(editionMark('x', digest)),
    editionMark('x', digest));
  // Crockford base-32 drops I, L, O and U so a mark read down a
  // telephone is unambiguous. identity.mjs states that rule; this holds
  // the mark to it.
  const marks = ['a', 'b', 'c', 'd', 'e', 'f', 'g', 'h'].map((s) => editionMark(s, digest));
  check('...with no ambiguous character in any mark',
    marks.every((m) => !/[ILOU]/.test(m.replace('WEC-LC', ''))), marks.join(' '));
}

// ── 5 · THE RUNNING MARKS FIT INSIDE THE SHEET ───────────────────────
// A printed header or footer template is a document of its own with none
// of the volume's stylesheet, so it gets the initial content-box and
// `width:100%` plus millimetre padding produces a strip WIDER THAN THE
// PAGE. Every volume's footer had that fault, which is why the folio sat
// nearer the trim than the type block it was meant to align with. It was
// invisible in the source and obvious the first time the strips were
// rendered at their true page widths.
{
  for (const [what, html] of [['foot', runningFoot('A Volume', { gutter: 18, mark: 'M' })],
    ['head', runningHead('M', { gutter: 18 })]]) {
    check(`The running ${what} is sized border-box, so it cannot exceed the sheet`,
      html.includes('box-sizing:border-box'), html.slice(0, 80));
  }
  check('The running foot names the volume, the holder and the folio',
    ['A Volume', HOLDER, 'pageNumber']
      .every((s) => runningFoot('A Volume', {}).includes(s)));
}

// ── 6 · BOTH EDITIONS STATE THE SAME LICENCE ─────────────────────────
// CLAUDE.md §4 in the form that matters most here: a term a reader
// cannot read is not a term they have agreed to, and the Arabic reader
// is the one likeliest to be weighing this curriculum against a year's
// fees.
{
  check(`Granted and reserved are matched clause for clause — ${GRANTED.length} and ${RESERVED.length}`,
    GRANTED.length === GRANTED_AR.length && RESERVED.length === RESERVED_AR.length,
    `en ${GRANTED.length}/${RESERVED.length}, ar ${GRANTED_AR.length}/${RESERVED_AR.length}`);

  const pages = {
    en: readFileSync(path.join(ROOT, 'pages/press-library.html'), 'utf8'),
    ar: readFileSync(path.join(ROOT, 'pages/press-library.ar.html'), 'utf8'),
  };
  for (const lang of ['en', 'ar']) {
    check(`The ${lang === 'en' ? 'English' : 'Arabic'} Library carries the licence leaf`,
      pages[lang].includes('id="licence"'));
  }

  // Every clause, present verbatim. A licence summarised on the page and
  // stated in the volume is two licences.
  const absent = [];
  for (const [lang, list] of [['en', [SUMMARY, ...GRANTED, ...RESERVED, CHANNEL, TRACEABLE, NO_LOCK]],
    ['ar', [SUMMARY_AR, ...GRANTED_AR, ...RESERVED_AR, CHANNEL_AR, TRACEABLE_AR, NO_LOCK_AR]]]) {
    for (const clause of list) if (!pages[lang].includes(clause)) absent.push(`${lang}: ${clause.slice(0, 46)}…`);
  }
  check('Every clause of the instrument reaches both editions verbatim',
    absent.length === 0, absent.join(' | '));

  // The register, not two card lists: a granted permission and a
  // reserved one are two different states and take two different marks.
  // Giving both a tick would say the columns mean the same thing, which
  // is the defect css/pillar.css records the register as built to fix.
  for (const lang of ['en', 'ar']) {
    const leaf = pages[lang].split('id="licence"')[1] || '';
    check(`...and the ${lang === 'en' ? 'English' : 'Arabic'} leaf marks the two states differently`,
      leaf.includes('#i-struck') && leaf.includes('#i-lock')
      && leaf.includes('register__list--held') && leaf.includes('register__list--open'));
  }
}

// ── 7 · THE PAGE STILL GRANTS WHAT IT ALWAYS GRANTED ─────────────────
// The point of publishing the curriculum is that a family can read it
// before paying for it. A licence that quietly took that back would have
// solved the copying problem by abandoning the reason for the Library.
{
  const en = readFileSync(path.join(ROOT, 'pages/press-library.html'), 'utf8');
  const ar = readFileSync(path.join(ROOT, 'pages/press-library.ar.html'), 'utf8');
  check('Downloading is still free, with no account, in English',
    /free to download/i.test(en) && /no account/i.test(en));
  check('...and in Arabic', ar.includes('لا تسجيل') && ar.includes('ولا حساب'));
  check('Photocopying for a class you teach is still granted outright',
    GRANTED.some((g) => /photocopy/i.test(g)) && GRANTED_AR.some((g) => g.includes('انسخه')));
  check('Teaching from it in another institution’s classroom is still granted',
    GRANTED.some((g) => /another institution/i.test(g))
    && GRANTED_AR.some((g) => g.includes('مؤسسة أخرى')));
  check('And a reserved use is licensable rather than merely forbidden',
    CHANNEL.includes(CONTACT) && CHANNEL_AR.includes(CONTACT)
    && /usually given/i.test(CHANNEL));
}

// ── 8 · NO CLAIM OF A LOCK THE COLLEGE DOES NOT HAVE ─────────────────
// The instruction this work answers was to make the curriculum
// uncopyable. It cannot be, and the honest form of that answer is
// printed rather than hidden: the volumes are not encrypted, their text
// is not disabled, and the page says which of those things is true.
{
  const en = readFileSync(path.join(ROOT, 'pages/press-library.html'), 'utf8');
  const ar = readFileSync(path.join(ROOT, 'pages/press-library.ar.html'), 'utf8');
  check('The English edition discloses that the volumes are not locked',
    /not encrypted/i.test(en) && /not a lock/i.test(en));
  check('...and the Arabic edition says the same',
    ar.includes('غير مشفَّر') && ar.includes('لا قُفل'));
  check('Traceability is claimed as identification, not as prevention',
    /identifiable as to volume, edition and page/i.test(TRACEABLE)
    && !/prevent|impossible|cannot be copied/i.test(TRACEABLE), TRACEABLE.slice(0, 60));
  check('The rights page prints the mark it says is on every page',
    rightsPage({ title: 'A Volume', mark: 'WEC-LC·TEST-MARK' })
      .includes('WEC-LC·TEST-MARK'));
  check('The disclosure travels with the volumes, not only with the website',
    rightsPage({ title: 'A Volume', mark: 'M' }).includes('not encrypted'));
}

// ── 9 · AND IT IS TRUE OF THE FILES THAT ARE ACTUALLY SERVED ─────────
// Everything above reads source. This reads the artefacts, because the
// claim on the Library page is about the SERVED volumes — "every page of
// every volume carries the volume title, the College's name and an
// edition mark" — and a claim about a file has to be checked against the
// file. It was not true of three of them when first checked: the cover
// spreads are artwork with bleed and take no running foot, so they
// carried no rights line at all until one was set on the back panel
// where a bound book carries it.
//
// Sampled rather than exhaustive: five pages spread through each volume,
// which is 443 pages' worth of confidence for the reference edition at a
// cost the suite can afford. A running foot either prints on every page
// or on none — it is one printer directive — so a sample is the right
// instrument here in a way it would not be for hand-set matter.
{
  const reg = path.join(ROOT, 'data/library.json');
  if (!existsSync(reg)) {
    check('The library register exists, so the served volumes can be checked', false, reg);
  } else {
    const { getDocument } = await import('pdfjs-dist/legacy/build/pdf.mjs');
    const volumes = JSON.parse(readFileSync(reg, 'utf8')).volumes.filter((v) => v.file.endsWith('.pdf'));
    const bad = [];
    for (const v of volumes) {
      const file = path.join(ROOT, 'publication', v.file);
      if (!existsSync(file)) { bad.push(`${v.slug}: absent`); continue; }
      const doc = await getDocument({
        data: new Uint8Array(readFileSync(file)), useSystemFonts: true,
      }).promise;
      const n = doc.numPages;
      const probe = [...new Set([1, 2, Math.ceil(n / 2), n - 1, n])].filter((p) => p >= 1 && p <= n);
      for (const i of probe) {
        const text = (await (await doc.getPage(i)).getTextContent()).items.map((x) => x.str).join('');
        // The holder's name may carry a year between the symbol and the
        // name — "© 2026 WorldWide English College" on a cover panel,
        // "© WorldWide English College" in a running foot. Both are the
        // notice; only the absence of one is a fault.
        if (!/©\s*(?:\d{4}\s*)?WorldWide\s*English\s*College/.test(text)) {
          bad.push(`${v.slug} p${i}: no copyright notice`);
        }
        if (!/WEC-LC[·.·]/.test(text)) bad.push(`${v.slug} p${i}: no edition mark`);
      }
    }
    check(`Every served volume carries the notice and the mark on the pages sampled — ${volumes.length} volumes`,
      bad.length === 0, bad.slice(0, 8).join(', '));
  }
}

console.log(`\n${pass} passed, ${fail} failed.`);
process.exit(fail ? 1 : 0);
