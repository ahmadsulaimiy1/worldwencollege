// Generated page sources are actually generated.
//
// THE ASSERTION THIS FILE EXISTS FOR:
//
//   Running every pillar builder changes nothing in pages/. If it does,
//   somebody edited a generated file by hand and the edit is one build
//   away from disappearing.
//
// This was written after it happened three times in one afternoon, to
// three separate published corrections:
//
//   · the tuition ledger's two total rows — the fix for a table that did
//     not add up;
//   · the privacy page's retention and erasure position — the correction
//     of a page that told learners a taken decision was still open;
//   · the six-award key on the academics overview.
//
// All three were made by editing pages/*.html. All three are generated
// by scripts/build-*.js. All three survived only because CI runs
// `npm run build` — which renders pages/ into the served site — and
// never runs the pillar builders that WRITE pages/. The corrections were
// live and simultaneously already lost: the next person to run
// `node scripts/build-admissions.js` would have silently republished the
// arithmetic error.
//
// A published correction that a routine rebuild reverts is not a
// correction. It is a delay.
//
// The check is mechanical: snapshot pages/ and partials/, run every
// builder that writes into pages/, compare, restore. It never leaves the
// tree modified, including when a builder throws.
import { readFileSync, writeFileSync, readdirSync, mkdirSync, rmSync, cpSync, existsSync } from 'node:fs';
import { spawnSync } from 'node:child_process';
import path from 'node:path';
import os from 'node:os';
import { ROOT } from './helpers.mjs';

let pass = 0, fail = 0;
const check = (label, cond, detail) => {
  console.log((cond ? 'PASS ' : 'FAIL ') + label + (cond || detail === undefined ? '' : ` — ${detail}`));
  cond ? pass++ : fail++;
};

// Which builders write into pages/. Derived, not listed, so a pillar
// builder added tomorrow is covered without anyone remembering to add it
// here — the failure mode this file exists to prevent is precisely
// "somebody did not remember".
const scriptsDir = path.join(ROOT, 'scripts');
const BUILDERS = readdirSync(scriptsDir)
  .filter((f) => /^build-.+\.js$/.test(f))
  .filter((f) => /['"`]pages['"`]|pages\/manifest\.json/.test(readFileSync(path.join(scriptsDir, f), 'utf8')))
  .sort();
check('the pillar builders were found', BUILDERS.length >= 8, BUILDERS.join(', '));

const WATCHED = ['pages', 'partials'];
const snapshot = path.join(os.tmpdir(), `wec-generated-${process.pid}`);

function readTree(dir) {
  const out = new Map();
  const walk = (d, prefix) => {
    for (const entry of readdirSync(d, { withFileTypes: true })) {
      const rel = prefix ? `${prefix}/${entry.name}` : entry.name;
      const full = path.join(d, entry.name);
      if (entry.isDirectory()) walk(full, rel);
      else out.set(rel, readFileSync(full, 'utf8'));
    }
  };
  walk(dir, '');
  return out;
}

const before = new Map(WATCHED.map((w) => [w, readTree(path.join(ROOT, w))]));

rmSync(snapshot, { recursive: true, force: true });
mkdirSync(snapshot, { recursive: true });
for (const w of WATCHED) cpSync(path.join(ROOT, w), path.join(snapshot, w), { recursive: true });

const crashed = [];
const changed = [];
try {
  for (const b of BUILDERS) {
    const r = spawnSync(process.execPath, ['--experimental-sqlite', '--no-warnings', path.join(scriptsDir, b)],
      { cwd: ROOT, encoding: 'utf8' });
    if (r.status !== 0) {
      crashed.push(`${b}: ${(r.stderr || '').trim().split('\n').filter((l) => /Error/.test(l))[0] || `exit ${r.status}`}`);
    }
  }
  for (const w of WATCHED) {
    const after = readTree(path.join(ROOT, w));
    for (const [rel, text] of after) {
      const was = before.get(w).get(rel);
      if (was === undefined) changed.push(`${w}/${rel} (built, but not committed)`);
      else if (was !== text) changed.push(`${w}/${rel} (hand-edited: a build reverts it)`);
    }
    for (const rel of before.get(w).keys()) {
      if (!after.has(rel)) changed.push(`${w}/${rel} (a build deletes it)`);
    }
  }
} finally {
  // Restore unconditionally. A test that leaves the working tree rebuilt
  // would make its own finding disappear on a second run.
  for (const w of WATCHED) {
    rmSync(path.join(ROOT, w), { recursive: true, force: true });
    cpSync(path.join(snapshot, w), path.join(ROOT, w), { recursive: true });
  }
  rmSync(snapshot, { recursive: true, force: true });
}

check('every pillar builder runs', crashed.length === 0, `\n  ${crashed.join('\n  ')}`);
check('running the builders changes nothing that is committed',
  changed.length === 0,
  `\n  ${changed.join('\n  ')}\n  Move the edit into the builder that writes the file.`);

// And the tree really was restored — otherwise this file would rewrite
// the repository every time it ran.
let drifted = 0;
for (const w of WATCHED) {
  const now = readTree(path.join(ROOT, w));
  for (const [rel, text] of before.get(w)) if (now.get(rel) !== text) drifted++;
}
check('the working tree is left exactly as it was found', drifted === 0, `${drifted} file(s) differ`);
check('the snapshot was cleaned up', !existsSync(snapshot));

console.log(`\n${pass} passed, ${fail} failed`);
process.exit(fail ? 1 : 0);
