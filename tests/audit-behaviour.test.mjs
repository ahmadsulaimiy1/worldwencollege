// PROVE THE REGISTER CAN STILL FIRE.
//
// ─────────────────────────────────────────────────────────────────────
// THE FAILURE THIS EXISTS FOR
// ─────────────────────────────────────────────────────────────────────
// On 18 August 2026 the red-flag register went from fourteen findings
// to nought in one sitting. Two of those findings were fixed on the
// pages; the rest went away because three rules were corrected —
// counting passages instead of word tokens, exempting the status
// register from a remedy that says "put it in the status register", and
// declining to flag sentences addressed to the reader.
//
// Every one of those corrections is defensible. That is exactly the
// problem. A register that reports nothing because the site is clean
// and a register that reports nothing because its rules have been
// widened until they match nothing are indistinguishable from the
// outside, and the second is worse than having no register at all: it
// certifies.
//
// So the rules are exercised here against fixtures with a fault planted
// in them. The auditor reads its pages from WEC_AUDIT_PAGES, this file
// copies pages/ to a temporary directory, plants one fault at a time,
// and asserts the finding appears — and, for each exemption, that the
// thing being exempted still does NOT appear. An exemption that has
// quietly become a blanket fails here.

import { readFileSync, writeFileSync, mkdtempSync, cpSync, rmSync } from 'node:fs';
import { execFileSync } from 'node:child_process';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { ROOT } from './helpers.mjs';

let pass = 0, fail = 0;
const check = (label, cond, detail) => {
  console.log((cond ? 'PASS ' : 'FAIL ') + label + (cond || detail === undefined ? '' : ` — ${detail}`));
  cond ? pass++ : fail++;
};

const AUDIT = path.join(ROOT, 'scripts/red-flag-audit.mjs');

/**
 * Run the auditor over a copy of pages/ with `mutate` applied, and
 * return its register as text. The copy is thrown away afterwards, so
 * nothing here can touch the site.
 */
function auditWith(mutate) {
  const dir = mkdtempSync(path.join(tmpdir(), 'wec-audit-'));
  try {
    cpSync(path.join(ROOT, 'pages'), dir, { recursive: true });
    mutate({
      read: (f) => readFileSync(path.join(dir, f), 'utf8'),
      write: (f, s) => writeFileSync(path.join(dir, f), s),
    });
    return execFileSync(process.execPath, [AUDIT], {
      env: { ...process.env, WEC_AUDIT_PAGES: dir },
      encoding: 'utf8',
      maxBuffer: 1 << 26,
    });
  } finally {
    rmSync(dir, { recursive: true, force: true });
  }
}

const flags = (report, page, phrase) =>
  report.split('\n').some((l) => l.includes(page) && (!phrase || l.includes(phrase)))
  || new RegExp(`\\*\\*${page.replace('.', '\\.')}\\*\\*[\\s\\S]{0,200}?${phrase || ''}`).test(report);

// ── 0 · THE BASELINE ─────────────────────────────────────────────────
// Unmutated, the register is clean. Everything below is measured
// against this, so a fixture that flags proves the rule fired on the
// fault and not on something that was already there.
const clean = auditWith(() => {});
check('The site as it stands carries no findings',
  /\*\*0 findings\*\*/.test(clean),
  clean.split('\n').filter((l) => l.startsWith('- **')).slice(0, 3).join(' / '));

// ── 1 · THE PROGRESS REPORT STILL FIRES ──────────────────────────────
// A page with no allowance gets one construction planted in it. If the
// reader-directed carve-out has become a blanket, this passes silently
// and the check fails.
{
  const r = auditWith(({ read, write }) => {
    const f = 'contact.html';
    write(f, `${read(f)}\n<p>The switchboard has not yet been installed.</p>\n`);
  });
  check('A new construction on an unexempted page is still reported',
    flags(r, 'contact.html', 'narrating what has not happened'),
    'the progress-report rule no longer fires on anything');
}

// ── 2 · THE EXEMPTIONS ARE CEILINGS, NOT BLANKETS ────────────────────
// Each exempted page is allowed the passages it already carries and not
// one more. Planting a second on a page allowed one must flag.
{
  const r = auditWith(({ read, write }) => {
    const f = 'students-awards.html';
    write(f, `${read(f)}\n<p>The bursar has not yet been appointed.</p>\n`);
  });
  check('An exempted page flags as soon as it acquires one MORE construction',
    flags(r, 'students-awards.html', 'narrating what has not happened'),
    'the decision-turns-on allowance is behaving as a blanket exemption');
}
{
  // And the status register, which has the widest allowance of all, is
  // still bounded. Fifteen constructions is a wall of hedging on any
  // page, including the instrument.
  const r = auditWith(({ read, write }) => {
    const f = 'governance.html';
    const filler = Array.from({ length: 15 },
      (_, i) => `<p>Provision ${i} has not yet been applied.</p>`).join('\n');
    write(f, `${read(f)}\n${filler}\n`);
  });
  check('Even the status register flags when it passes its ceiling',
    flags(r, 'governance.html', 'narrating what has not happened'),
    'the status-register allowance is unbounded');
}

// ── 3 · THE CARVE-OUTS STILL CARVE ───────────────────────────────────
// The reader-directed test is the widest of the three corrections, so
// it is worth proving it applies to the reader and not to the College.
{
  const r = auditWith(({ read, write }) => {
    const f = 'contact.html';
    write(f, `${read(f)}\n<p>A message you have not yet sent is never lost.</p>\n`);
  });
  check('A sentence addressed to the reader is not reported as the College hedging',
    !flags(r, 'contact.html', 'narrating what has not happened'),
    'the reader-directed carve-out has stopped working');
}

// ── 4 · ACCREDITATION: PASSAGES, NOT WORDS ───────────────────────────
// One question and its answer is one raising. Three separate passages
// is the institution volunteering its weakest fact where nothing asked.
{
  const r = auditWith(({ read, write }) => {
    const f = 'contact.html';
    write(f, `${read(f)}\n<div><p>Is the College accredited? It holds no accreditation.</p></div>\n`);
  });
  check('A question and its own answer count as one raising, not two',
    !flags(r, 'contact.html', 'Accreditation raised'),
    'the accreditation rule is counting word tokens again');
}
{
  const r = auditWith(({ read, write }) => {
    const f = 'contact.html';
    write(f, `${read(f)}\n<p>Not accredited.</p>\n<p>No accreditation.</p>\n<p>Accreditation is absent.</p>\n`);
  });
  check('Three separate passages on one page are still reported',
    flags(r, 'contact.html', 'Accreditation raised'),
    'the accreditation rule no longer fires on repetition');
}

// ── 5 · THE VOICE AUDIT'S ONE RULING ─────────────────────────────────
// The owner ruled on 18 August 2026 that the motto stays. It is
// protected by name rather than by removing `Empowering` from the
// machine-register list, and the difference between those two is
// exactly what this pair of checks measures.
const VOICE = path.join(ROOT, 'scripts/voice-audit.mjs');
function voiceWith(mutate) {
  const dir = mkdtempSync(path.join(tmpdir(), 'wec-voice-'));
  try {
    cpSync(path.join(ROOT, 'pages'), dir, { recursive: true });
    mutate({
      read: (f) => readFileSync(path.join(dir, f), 'utf8'),
      write: (f, s) => writeFileSync(path.join(dir, f), s),
    });
    return execFileSync(process.execPath, [VOICE], {
      env: { ...process.env, WEC_AUDIT_PAGES: dir }, encoding: 'utf8', maxBuffer: 1 << 26,
    });
  } finally {
    rmSync(dir, { recursive: true, force: true });
  }
}
{
  const r = voiceWith(() => {});
  check('The motto no longer reports as machine register',
    /0 machine phrases/.test(r), r.split('\n').slice(-2)[0]);
  check('...and nothing on the site reports as a hedge to cut',
    /0 dead hedges to cut/.test(r));
}
{
  const r = voiceWith(({ read, write }) => {
    const f = 'contact.html';
    write(f, `${read(f)}\n<p>Empowering learners with robust solutions.</p>\n`);
  });
  check('The exemption is the motto by name, not the word — `Empowering` elsewhere still fires',
    !/0 machine phrases/.test(r),
    'protecting the motto has disabled the machine-register rule');
}

console.log(`\n${pass} passed, ${fail} failed.`);
process.exit(fail ? 1 : 0);
