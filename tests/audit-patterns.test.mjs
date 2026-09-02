// tests/audit-patterns.test.mjs — the auditors' own Arabic patterns must
// be capable of matching Arabic.
//
// ─────────────────────────────────────────────────────────────────────
// THE FAULT THIS ENCODES
// ─────────────────────────────────────────────────────────────────────
// JavaScript defines \b on [A-Za-z0-9_]. An Arabic letter is not a word
// character, so a \b written beside one can never assert anything: the
// characters on both sides are non-word and there is no boundary to
// find. A pattern like
//
//     /\bلم تُمنح/
//
// matches nothing, on any page, ever — and it PASSES, silently, because
// a check that finds nothing looks exactly like a check that found
// nothing wrong.
//
// There were twenty-three of them across scripts/voice-audit.mjs and
// scripts/red-flag-audit.mjs. The entire Arabic rule set of the voice
// audit was inert, and two rules in the red-flag audit with it. The
// consequence was not hypothetical: /ar/governance/decisions/ told an
// Arabic reader the College had taken 32 decisions while the register
// held 36 and the English edition said so, and the guard written to
// catch exactly that could not see the sentence.
//
// The correct boundary for Arabic is a lookaround on the Arabic block —
// `(?<![؀-ۿ...])` before, `(?![؀-ۿ...])` after. This file holds that
// structurally, because the failure mode is silence and silence is what
// a passing test looks like.
//
// It also enforces the principle the College publishes on its own
// Governance page: a check that has never failed has never been shown to
// work. Each pattern family below is proven against a string it exists
// to catch.

import { readFileSync } from 'node:fs';
import path from 'node:path';
import { ROOT } from './helpers.mjs';

let pass = 0, fail = 0;
const check = (label, cond, detail) => {
  console.log((cond ? 'PASS ' : 'FAIL ') + label + (cond || detail === undefined ? '' : ` — ${detail}`));
  cond ? pass++ : fail++;
};

const ARABIC = /[؀-ۿݐ-ݿﭐ-﷿ﹰ-﻿]/;

const FILES = [
  'scripts/red-flag-audit.mjs',
  'scripts/voice-audit.mjs',
  'scripts/parity-audit.mjs',
  'tests/adopted-decisions.test.mjs',
  'tests/published-claims.test.mjs',
  'tests/commercial-model.test.mjs',
  'tests/quality-cycle.test.mjs',
];

// ── 1 · NO IMPOSSIBLE BOUNDARY ───────────────────────────────────────
const offenders = [];
for (const f of FILES) {
  const lines = readFileSync(path.join(ROOT, f), 'utf8').split('\n');
  lines.forEach((ln, i) => {
    if (!ARABIC.test(ln)) return;
    for (let j = ln.indexOf('\\b'); j !== -1; j = ln.indexOf('\\b', j + 2)) {
      const before = ln.slice(Math.max(0, j - 1), j);
      const after = ln.slice(j + 2, j + 3);
      if (ARABIC.test(before) || ARABIC.test(after)) {
        offenders.push(`${f}:${i + 1}  ${ln.trim().slice(0, 80)}`);
      }
    }
  });
}
check(`No pattern puts \\b beside an Arabic letter — ${FILES.length} files swept`,
  offenders.length === 0,
  `${offenders.length}: ${offenders.slice(0, 3).join(' | ')}`);

// ── 2 · AND THE REASON, DEMONSTRATED ─────────────────────────────────
// Not an article of faith. If a future runtime ever changed this, the
// rule above would be pointless and this check says so first.
check('...because \\b genuinely cannot match beside Arabic in this runtime',
  /\bلم تُمنح/.test('لم تُمنح شهادة') === false
  && /لم تُمنح/.test('لم تُمنح شهادة') === true);

check('...and the Unicode-aware boundary does what \\b was meant to',
  /(?<![؀-ۿ])لم تُمنح/.test('لم تُمنح شهادة') === true
  // ...and still refuses a match inside a longer word
  && /(?<![؀-ۿ])منح/.test('تمنح') === false);

// ── 3 · THE ARABIC RULES ARE STILL THERE TO BE RUN ───────────────────
// A tempting "fix" for a pattern that never matches is to delete it.
// These two files carry the College's only automated reading of its own
// Arabic prose; an empty rule set would pass check 1 perfectly.
for (const [f, min] of [['scripts/voice-audit.mjs', 8], ['scripts/red-flag-audit.mjs', 2]]) {
  const body = readFileSync(path.join(ROOT, f), 'utf8');
  const arabicPatterns = (body.match(/\/[^/\n]*[؀-ۿ][^/\n]*\/[gimsuy]*/g) || []).length;
  check(`${path.basename(f)} still carries Arabic patterns — ${arabicPatterns}`,
    arabicPatterns >= min, `${arabicPatterns} < ${min}`);
}

console.log(`\n${pass} passed, ${fail} failed.`);
process.exit(fail ? 1 : 0);
