// THE LOCK FILE AND package.json MUST AGREE.
//
// ─────────────────────────────────────────────────────────────────────
// THE FAILURE THIS EXISTS FOR
// ─────────────────────────────────────────────────────────────────────
// The typography work added @fontsource-variable/eb-garamond to
// package.json and never updated package-lock.json. Nothing local
// noticed: node_modules already held the package, so `npm test` passed
// on every machine that had installed it, and it kept passing for days.
//
// The deploy runs `npm ci`, which refuses outright when the two files
// disagree — correctly, since a clean install cannot resolve a
// dependency that has no locked version. So the site stopped publishing
// while the suite stayed green, which is the worst arrangement of those
// two facts: every signal a person checks said the work was fine.
//
// The gap is structural. A test suite runs against an installed tree
// and can therefore never see an installation problem. This file is the
// one check that reads the two manifests instead of the tree, so the
// failure that only appears on a clean runner appears here first.

import { readFileSync } from 'node:fs';
import path from 'node:path';
import { ROOT } from './helpers.mjs';

let pass = 0, fail = 0;
const check = (label, cond, detail) => {
  console.log((cond ? 'PASS ' : 'FAIL ') + label + (cond || detail === undefined ? '' : ` — ${detail}`));
  cond ? pass++ : fail++;
};

const pj = JSON.parse(readFileSync(path.join(ROOT, 'package.json'), 'utf8'));
const pl = JSON.parse(readFileSync(path.join(ROOT, 'package-lock.json'), 'utf8'));

const declared = { ...(pj.dependencies || {}), ...(pj.devDependencies || {}) };
const names = Object.keys(declared);
const locked = pl.packages || {};

check(`package.json declares dependencies — ${names.length}`, names.length > 0);

// 1 · EVERY DECLARED DEPENDENCY IS LOCKED. This is the exact condition
// `npm ci` enforces, stated as a check that runs in a second instead of
// three minutes into a deploy.
const missing = names.filter((n) => !locked[`node_modules/${n}`]);
check('Every dependency in package.json has an entry in package-lock.json',
  missing.length === 0,
  missing.length
    ? `${missing.join(', ')} — run \`npm install --package-lock-only\` and commit the lock file`
    : undefined);

// 2 · AND THE LOCKED VERSION SATISFIES THE DECLARED RANGE. A lock file
// can be complete and still stale: a range widened in package.json
// without a re-lock installs the old version on every clean runner
// while the developer who widened it has the new one.
const satisfies = (range, version) => {
  const r = String(range).trim();
  if (!/^[\^~]?\d/.test(r)) return true;          // git, file:, tags — not ours to judge
  const clean = r.replace(/^[\^~]/, '');
  const [rMaj, rMin = '0', rPat = '0'] = clean.split('.');
  const [vMaj, vMin = '0', vPat = '0'] = String(version).split('.');
  const n = (x) => Number.parseInt(x, 10) || 0;
  if (r.startsWith('^')) {
    if (n(vMaj) !== n(rMaj)) return false;
    if (n(vMin) !== n(rMin)) return n(vMin) > n(rMin);
    return n(vPat) >= n(rPat);
  }
  if (r.startsWith('~')) {
    return n(vMaj) === n(rMaj) && n(vMin) === n(rMin) && n(vPat) >= n(rPat);
  }
  return `${vMaj}.${vMin}.${vPat}` === `${rMaj}.${rMin}.${rPat}`;
};

const stale = names
  .map((n) => [n, declared[n], locked[`node_modules/${n}`]?.version])
  .filter(([, range, version]) => version && !satisfies(range, version));
check('Every locked version satisfies the range package.json asks for',
  stale.length === 0,
  stale.map(([n, r, v]) => `${n}: wants ${r}, locked ${v}`).join('; '));

// 3 · THE LOCK FILE IS THE FORMAT npm ci EXPECTS. Version 1 lock files
// carry no `packages` map, and the two checks above would pass
// vacuously against one.
check('The lock file is lockfileVersion 2 or later, which the checks above rely on',
  Number(pl.lockfileVersion) >= 2, `lockfileVersion ${pl.lockfileVersion}`);
check('...and names the same project as package.json',
  pl.name === pj.name, `${pl.name} vs ${pj.name}`);

console.log(`\n${pass} passed, ${fail} failed.`);
process.exit(fail ? 1 : 0);
