// tests/generator-guard.test.mjs — the nine generators cannot silently
// revert the site's prose.
//
// ────────────────────────────────────────────────────────────────────
// THE DEFECT THIS EXISTS FOR
// ────────────────────────────────────────────────────────────────────
// Nine scripts in scripts/ author pages into pages/, and every one of
// them used to finish with a bare fs.writeFileSync. CLAUDE.md §4 makes
// pages/*.html the source, so those files are edited by hand, in two
// languages, in every session. Running `npm run arabic` would therefore
// have overwritten twelve Arabic pages carrying 4,389 lines of drift —
// published, browser-checked sentences — and printed "Wrote 12 Arabic
// editions" while doing it. Across all nine generators, 42 pages were
// one command away from reverting.
//
// scripts/lib/emit-page.js closes that, and this file holds it closed
// from two directions:
//
//   1 · STRUCTURE — no generator writes into pages/ except through the
//       guard. A tenth generator written next year fails this test
//       rather than quietly reopening the hole.
//   2 · BEHAVIOUR — the guard's four outcomes are exercised against a
//       scratch directory: absent file written, matching file left
//       alone, generator-owned file regenerated, hand-edited file
//       REFUSED. A guard whose refusal path is never executed is a
//       comment, not a guard.

import { readFileSync, readdirSync, mkdtempSync, writeFileSync, existsSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';

const ROOT = path.dirname(path.dirname(fileURLToPath(import.meta.url)));
let pass = 0, fail = 0;
const check = (label, ok, detail) => {
  if (ok) { pass++; console.log(`PASS ${label}`); }
  else { fail++; console.log(`FAIL ${label}${detail ? ` — ${detail}` : ''}`); }
};

// ── 1 · STRUCTURE ────────────────────────────────────────────────────
const scriptsDir = path.join(ROOT, 'scripts');
const builders = readdirSync(scriptsDir)
  .filter((f) => /^build.*\.(js|mjs)$/.test(f))
  .map((f) => [f, readFileSync(path.join(scriptsDir, f), 'utf8')]);

// A generator that touches pages/ at all. build-tuition.mjs is here too:
// it splices a marked block into two pages rather than authoring whole
// files, which is a different mechanism and exempt — it never replaces a
// page, and the markers make its territory explicit in the page itself.
const SPLICERS = new Set(['build-tuition.mjs', 'build-redirects.js']);
// Two ways to qualify: it already goes through the guard, or it writes a
// file into pages/ itself. The second half is what catches a generator
// written next year that never heard of the guard.
const writesPages = builders.filter(([f, s]) => {
  if (SPLICERS.has(f)) return false;
  const flat = s.replace(/\s+/g, ' ');
  return /emitPage\(/.test(flat)
    || /writeFileSync\(\s*path\.join\(ROOT, 'pages'/.test(flat);
});

check(`Every generator that authors pages/ is known — ${writesPages.length} found`,
  writesPages.length >= 9, writesPages.map(([f]) => f).join(', '));

// The CommonJS generators require it; build-library.mjs imports it. Both
// reach the same module, so the check is for the module, not the syntax.
const unguarded = writesPages.filter(([, s]) => !/['"]\.\/lib\/emit-page(\.js)?['"]/.test(s));
check('No generator writes a page without the guard',
  unguarded.length === 0, `unguarded: ${unguarded.map(([f]) => f).join(', ')}`);

// The guard is only load-bearing if the raw write is gone as well as
// imported-around. Anything writing a *page body* straight to disk
// bypasses it; the manifest is not a page and is expected to be written.
const rawWrites = writesPages.filter(([, s]) => {
  const flat = s.replace(/\s+/g, ' ');
  const hits = flat.match(/writeFileSync\(\s*path\.join\(ROOT, 'pages'[^)]*\)[^;]*/g) || [];
  return hits.some((h) => !/manifest|MANIFEST/i.test(h));
});
check('No generator still writes a page body with a bare writeFileSync',
  rawWrites.length === 0, `raw: ${rawWrites.map(([f]) => f).join(', ')}`);

// Each of them has to report, or a refusal happens in silence — which
// is the failure mode the whole guard exists to end.
const silent = writesPages.filter(([, s]) => !/reportEmit\(/.test(s));
check('Every guarded generator reports what reached disk',
  silent.length === 0, `silent: ${silent.map(([f]) => f).join(', ')}`);

// ── 2 · THE LEDGER SHIPS ─────────────────────────────────────────────
const ledgerPath = path.join(ROOT, 'pages/.generated.json');
check('The digest ledger is committed, not left to be regenerated',
  existsSync(ledgerPath));
if (existsSync(ledgerPath)) {
  const ledger = JSON.parse(readFileSync(ledgerPath, 'utf8'));
  const keys = Object.keys(ledger);
  check(`Every ledger key names a page that exists — ${keys.length} recorded`,
    keys.every((k) => existsSync(path.join(ROOT, 'pages', k))),
    keys.filter((k) => !existsSync(path.join(ROOT, 'pages', k))).join(', '));
  check('Every ledger value is a digest, not a placeholder',
    keys.every((k) => /^[0-9a-f]{32}$/.test(ledger[k])));
}

// ── 3 · BEHAVIOUR ────────────────────────────────────────────────────
// Exercised in-process against a scratch ledger, so nothing here can
// stamp or disturb the real one.
const scratch = mkdtempSync(path.join(tmpdir(), 'wec-guard-'));
process.env.WEC_PAGE_LEDGER = path.join(scratch, 'ledger.json');
const { emitPage, reportEmit } = await import(
  pathToFileURL(path.join(ROOT, 'scripts/lib/emit-page.js')).href);

const page = path.join(scratch, 'a-page.html');
const V1 = '<h1>One</h1>';
const V2 = '<h1>Two</h1>';

check('Absent page: written', emitPage(page, V1) === 'created'
  && readFileSync(page, 'utf8').trim() === V1);

check('Identical page: left alone and reported as matching',
  emitPage(page, V1) === 'unchanged');

check('Generator-owned page: regenerated', emitPage(page, V2) === 'regenerated'
  && readFileSync(page, 'utf8').trim() === V2);

// The one that matters. A human edits the page; the generator must not
// win.
const EDITED = '<h1>Two</h1><p>A sentence somebody wrote and checked.</p>';
writeFileSync(page, `${EDITED}\n`);
check('Hand-edited page: REFUSED', emitPage(page, V1) === 'refused');
check('...and the edit survives on disk',
  readFileSync(page, 'utf8').trim() === EDITED);

// Whitespace is not an edit. A page that differs only by indentation or
// a trailing newline must still count as the generator's own, or the
// guard fires on every page and everyone reaches for the override.
const ws = path.join(scratch, 'whitespace.html');
emitPage(ws, '<p>x</p>');
writeFileSync(ws, '   <p>x</p>   \n\n');
check('Whitespace-only difference is not treated as an edit',
  emitPage(ws, '<p>x</p>') === 'unchanged');

// A page with no ledger entry is unknowable, so it is refused. This is
// the case that protected all 42 pages: the ledger did not exist yet.
const stranger = path.join(scratch, 'stranger.html');
writeFileSync(stranger, '<p>authored before the guard</p>\n');
check('Page with no ledger entry: REFUSED rather than assumed',
  emitPage(stranger, '<p>generated</p>') === 'refused');

// The ledger is what makes ownership knowable, so it has to record the
// pages the guard wrote and nothing else. A refused page must not be
// stamped — stamping it would hand the generator ownership of prose it
// did not write, one run later.
reportEmit('generator-guard.test.mjs', []);
const stamped = Object.keys(JSON.parse(readFileSync(process.env.WEC_PAGE_LEDGER, 'utf8')));
check('The ledger records the pages the guard wrote',
  stamped.includes('a-page.html') && stamped.includes('whitespace.html'), stamped.join(', '));
check('...and never stamps a page it refused',
  !stamped.includes('stranger.html'), stamped.join(', '));

rmSync(scratch, { recursive: true, force: true });

console.log(`\n${pass} passed, ${fail} failed.`);
process.exit(fail ? 1 : 0);
