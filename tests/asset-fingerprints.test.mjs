// tests/asset-fingerprints.test.mjs — new markup must never be served
// against old CSS.
//
// ─────────────────────────────────────────────────────────────────────
// THE FAULT
// ─────────────────────────────────────────────────────────────────────
// On 19 August 2026 a deploy landed, the served HTML carried the new
// build stamp, and worldwencollege.co.uk went on serving the PREVIOUS
// css/brand.css:
//
//     cf-cache-status: HIT   age: 2868   max-age: 14400
//
// The HTML is `max-age=0, must-revalidate` and updates at once. The
// stylesheet had four hours to run. So for up to four hours after every
// deploy, a returning visitor could receive new markup against old CSS
// — which is not a slow update, it is a broken page, and it is
// invisible to anyone who happens to hard-refresh.
//
// _headers had described the trade-off correctly and named the exit:
// long-lived immutable caching, once the build content-hashes its
// assets. This holds both halves of that bargain, because either half
// alone is worse than what was there before:
//
//   · fingerprints WITHOUT the long cache — correct, and throws away
//     the caching the fingerprints were supposed to buy
//   · the long cache WITHOUT fingerprints — a stylesheet pinned in a
//     visitor's browser for a YEAR after it changed
//
// A test that checked only one of them would pass in the state that is
// most broken.

import { readFileSync, readdirSync, existsSync } from 'node:fs';
import { createHash } from 'node:crypto';
import path from 'node:path';
import { ROOT } from './helpers.mjs';

let pass = 0, fail = 0;
const check = (label, cond, detail) => {
  console.log((cond ? 'PASS ' : 'FAIL ') + label + (cond || detail === undefined ? '' : ` — ${detail}`));
  cond ? pass++ : fail++;
};

// Every served page.
const served = [];
(function walk(dir) {
  for (const e of readdirSync(dir, { withFileTypes: true })) {
    // `partials` is excluded for the same reason the build's sweep
    // excludes it: partials/head.html is a SOURCE template, filled and
    // stamped per page at assembly. Stamping the template itself would
    // bake a version into a file that does not control it.
    if (e.name.startsWith('.') || e.name === 'node_modules' || e.name === 'pages'
      || e.name === 'partials' || e.name === 'tests' || e.name === 'docs') continue;
    const full = path.join(dir, e.name);
    if (e.isDirectory()) walk(full);
    else if (e.name.endsWith('.html')) served.push([path.relative(ROOT, full), readFileSync(full, 'utf8')]);
  }
})(ROOT);
check(`Served pages found — ${served.length}`, served.length > 50);

// ── 1 · EVERY LOCAL CSS AND JS REFERENCE IS FINGERPRINTED ────────────
{
  const bare = [];
  for (const [file, body] of served) {
    for (const m of body.matchAll(/<link[^>]+href="(\/[^"]+\.css)"/g)) {
      if (!/\?v=[0-9a-f]{8}$/.test(m[1])) bare.push(`${file} → ${m[1]}`);
    }
    for (const m of body.matchAll(/<script[^>]+src="(\/[^"]+\.js)"/g)) {
      if (!/\?v=[0-9a-f]{8}$/.test(m[1])) bare.push(`${file} → ${m[1]}`);
    }
  }
  check('Every local stylesheet and script carries a content fingerprint',
    bare.length === 0,
    `${bare.slice(0, 6).join(', ')}${bare.length > 6 ? ` (+${bare.length - 6})` : ''}`);
}

// ── 2 · AND THE FINGERPRINT IS THE FILE'S ACTUAL CONTENT ─────────────
// A stale hash is worse than none: it looks versioned and pins the
// wrong bytes for a year.
{
  const refs = new Map();
  for (const [, body] of served) {
    for (const m of body.matchAll(/(?:href|src)="(\/[^"]+\.(?:css|js))\?v=([0-9a-f]{8})"/g)) {
      refs.set(m[1], m[2]);
    }
  }
  check(`Distinct fingerprinted assets — ${refs.size}`, refs.size >= 6);

  const wrong = [];
  for (const [href, stamp] of refs) {
    const file = path.join(ROOT, href.replace(/^\//, ''));
    if (!existsSync(file)) { wrong.push(`${href} (missing from the tree)`); continue; }
    const real = createHash('sha256').update(readFileSync(file)).digest('hex').slice(0, 8);
    if (real !== stamp) wrong.push(`${href} says ${stamp}, content is ${real}`);
  }
  check('Every fingerprint matches the bytes it names',
    wrong.length === 0,
    `${wrong.join(', ')} — run \`node scripts/build.js\`; a stale hash pins the wrong file for a year`);
}

// ── 3 · THE OTHER HALF OF THE BARGAIN ────────────────────────────────
{
  const headers = readFileSync(path.join(ROOT, '_headers'), 'utf8');
  const rule = (glob) => {
    const i = headers.indexOf(`${glob}\n`);
    return i === -1 ? '' : headers.slice(i, headers.indexOf('\n\n', i) + 1);
  };
  for (const glob of ['/css/*', '/js/*']) {
    const block = rule(glob);
    check(`${glob} is cached long and immutable`,
      /max-age=31536000/.test(block) && /immutable/.test(block),
      `"${block.replace(/\n/g, ' ').trim()}" — fingerprinted assets that are not cached hard throw `
      + 'away the only thing the fingerprints bought');
  }
  // And the HTML must stay revalidated, or a visitor's cached page keeps
  // pointing at last week's fingerprints and the whole scheme is inert.
  const html = rule('/*.html');
  check('HTML is still revalidated on every request',
    /max-age=0/.test(html) && /must-revalidate/.test(html),
    `"${html.replace(/\n/g, ' ').trim()}" — the page is what carries the fingerprints; a cached `
    + 'page pins the old ones and nothing updates at all');
}

console.log(`\n${pass} passed, ${fail} failed.`);
process.exit(fail ? 1 : 0);
