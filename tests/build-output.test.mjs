// The 22 generated pages match their sources.
//
// The site is assembled by `scripts/build.js` from `pages/*.html` plus
// `partials/`, and the OUTPUT is committed — Cloudflare Pages serves the
// repository root directly, so the built files have to be in git. That
// is a legitimate deployment choice with one sharp edge: the repository
// now contains two copies of every marketing page, and nothing notices
// when they disagree.
//
// The failure is quiet and one-directional. Someone fixes a typo in
// `about/index.html` — the file whose path matches the URL, and the
// obvious one to open. It looks correct, it reviews correctly, it even
// deploys correctly once. Then the next build regenerates that file from
// `pages/about.html`, which never had the fix, and the typo returns with
// no diff, no error and nobody able to explain it.
//
// CI already runs `npm run build`, which means CI was actively hiding
// this: it rebuilt over the hand edit in the runner, tested the
// regenerated file, and passed.
//
// This test builds and compares. It restores whatever it found before
// reporting, so a failing run leaves the working tree exactly as it was.
import { readFileSync, writeFileSync, existsSync } from 'node:fs';
import { execFileSync } from 'node:child_process';
import path from 'node:path';
import { ROOT } from './helpers.mjs';

let pass = 0, fail = 0;
const check = (label, cond, detail) => {
  console.log((cond ? 'PASS ' : 'FAIL ') + label + (cond || detail === undefined ? '' : ` — ${detail}`));
  cond ? pass++ : fail++;
};

const manifest = JSON.parse(readFileSync(path.join(ROOT, 'pages/manifest.json'), 'utf8'));
check('The manifest lists the pages to generate', manifest.length >= 20, `${manifest.length} pages`);

// Snapshot what is committed, so the build can be compared against it
// and the tree put back either way.
const before = new Map();
const missing = [];
for (const page of manifest) {
  const full = path.join(ROOT, page.output);
  if (!existsSync(full)) { missing.push(page.output); continue; }
  before.set(page.output, readFileSync(full, 'utf8'));
}
check('Every manifest entry has a generated file committed', missing.length === 0, missing.join(', '));

execFileSync(process.execPath, [path.join(ROOT, 'scripts/build.js')], { cwd: ROOT, stdio: 'pipe' });

const drifted = [];
for (const page of manifest) {
  const full = path.join(ROOT, page.output);
  const after = existsSync(full) ? readFileSync(full, 'utf8') : null;
  if (before.has(page.output) && after !== before.get(page.output)) {
    drifted.push(page.output);
    writeFileSync(full, before.get(page.output));   // leave the tree as found
  }
}

check('No generated page differs from what its source produces',
  drifted.length === 0,
  drifted.length
    ? `edited directly instead of in pages/: ${drifted.join(', ')} — the next build would discard those changes`
    : undefined);

// The other direction: a source with no output is a page somebody wrote
// and nobody can reach. It fails the same way a broken link does, except
// there is no link to notice is broken.
const outputs = new Set(manifest.map((p) => p.contentFile));
const orphans = [];
for (const f of (await import('node:fs')).readdirSync(path.join(ROOT, 'pages'))) {
  if (!f.endsWith('.html')) continue;
  if (!outputs.has(f)) orphans.push(f);
}
check('Every page source is reachable through the manifest', orphans.length === 0,
  orphans.length ? `${orphans.join(', ')} — authored but never built, so never served` : undefined);

console.log(`\n${pass} passed, ${fail} failed.`);
process.exit(fail ? 1 : 0);
