// The data seam is only worth having if it cannot be quietly bypassed.
//
// js/portal-data.js exists so that moving the College's backend is one
// provider rather than fourteen rewrites. That promise holds exactly as
// long as every endpoint is reachable through an operation. The moment
// somebody adds a fetch('/api/something-new') inside a page, the seam
// still looks complete and is not, and nobody finds out until a
// migration is half done.
//
// So this file asserts two things: that the operation list covers the
// endpoints the REST provider actually serves, and that no portal page
// reaches past the seam to name an endpoint itself.

import { readFileSync, readdirSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const JS = path.join(ROOT, 'js');

let passed = 0, failed = 0;
function check(name, ok, detail) {
  if (ok) { passed++; console.log('PASS ' + name); }
  else { failed++; console.log('FAIL ' + name + (detail ? ' — ' + detail : '')); }
}

const seam = readFileSync(path.join(JS, 'portal-data.js'), 'utf8');

// ---------------------------------------------------------------------
// 1 · The declared operation list matches what the provider implements
// ---------------------------------------------------------------------
const declared = [...seam.matchAll(/^\s*'([a-zA-Z]+)'[,\s]*(?:\/\/.*)?$/gm)]
  .map((m) => m[1]);
const opsBlock = seam.slice(seam.indexOf('var OPERATIONS = ['), seam.indexOf('];', seam.indexOf('var OPERATIONS = [')));
const operations = [...opsBlock.matchAll(/'([a-zA-Z]+)'/g)].map((m) => m[1]);

const restBlock = seam.slice(seam.indexOf('var rest = {'), seam.indexOf('function register('));
const implemented = [...restBlock.matchAll(/^\s{4}([a-zA-Z]+): function/gm)].map((m) => m[1]);

const missing = operations.filter((o) => !implemented.includes(o));
check(`Every declared operation is implemented by the REST provider — ${operations.length} operations`,
  missing.length === 0, missing.join(', '));

const undeclared = implemented.filter((o) => !operations.includes(o) && o !== 'name');
check('The REST provider implements nothing the operation list omits',
  undeclared.length === 0, undeclared.join(', '));

// ---------------------------------------------------------------------
// 2 · Every endpoint the REST provider serves is a real API route
// ---------------------------------------------------------------------
// A seam that maps an operation onto a route nobody serves is worse than
// no seam: the page compiles, the call goes out, and the 404 surfaces as
// an empty screen. Endpoints are checked against functions/api/.
const endpoints = [...restBlock.matchAll(/request\('([^']+)'/g)]
  .map((m) => m[1].replace(/'\s*\+.*$/, ''));

function routeExists(p) {
  // A query string names arguments, not a route: /api/lms/unit?id= is
  // served by functions/api/lms/unit.js like any other path.
  const clean = p.split('?')[0].replace(/^\/api\//, '').replace(/\/$/, '');
  const parts = clean.split('/').filter(Boolean);
  const base = path.join(ROOT, 'functions', 'api');
  // a route is served by <parts>.js, <parts>/index.js, or a [param] file
  const candidates = [
    path.join(base, ...parts) + '.js',
    path.join(base, ...parts, 'index.js'),
  ];
  for (const c of candidates) {
    try { readFileSync(c); return true; } catch { /* keep looking */ }
  }
  // dynamic segment: the parent directory holds a [something].js
  try {
    const dir = path.join(base, ...parts.slice(0, -1));
    if (readdirSync(dir).some((f) => f.startsWith('['))) return true;
  } catch { /* not a directory */ }
  try {
    const dir = path.join(base, ...parts);
    if (readdirSync(dir).some((f) => f.startsWith('[') || f === 'index.js')) return true;
  } catch { /* not a directory */ }
  return false;
}

const dead = [...new Set(endpoints)].filter((e) => !routeExists(e));
check(`Every endpoint the seam serves has a route behind it — ${new Set(endpoints).size} endpoints`,
  dead.length === 0, dead.join(', '));

// ---------------------------------------------------------------------
// 3 · No portal page reaches past the seam
// ---------------------------------------------------------------------
// The modules below have been migrated onto the seam. If one of them
// names an /api/ path again, the seam has been bypassed and the next
// backend migration will miss it.
// Modules still to migrate, and why each is not simply "not done yet":
//
//   listening-lab.js  — uploads recording parts as binary chunks. The
//     seam carries recordingPart() for exactly this, but the module also
//     drives chunked upload, retry and offline queueing around it, and
//     moving that without a real recording to test against risks a
//     corrupt upload that surfaces as a bad recording rather than an
//     error. Migrate with a recording in hand.
//   admin-enrolments.js — six call sites including role changes. Every
//     operation exists on the seam; this is mechanical work that wants
//     its own diff rather than riding along with the seam's.
//   graduate.js — its QR call is migrated. The remaining fetch is a
//     PUBLIC, unauthenticated record lookup whose caller deliberately
//     inspects the body on a non-2xx, so that a withdrawn link and an
//     expired one give the same answer. The seam throws on non-2xx, so
//     migrating it changes that behaviour and needs a non-throwing
//     public pair rather than a find-and-replace.
//
// Add each here as it lands, so the list is a record of what is actually
// guaranteed rather than an aspiration.
const MIGRATED = ['my-programme.js', 'instructor-review.js'];

const offenders = [];
for (const f of MIGRATED) {
  let src;
  try { src = readFileSync(path.join(JS, f), 'utf8'); } catch { continue; }
  const hits = [...src.matchAll(/['"`](\/api\/[^'"`]*)['"`]/g)].map((m) => m[1]);
  if (hits.length) offenders.push(`${f}: ${hits.join(' ')}`);
}
check(`No migrated portal module names an endpoint directly — ${MIGRATED.length} modules`,
  offenders.length === 0, offenders.join(' | '));

// ---------------------------------------------------------------------
// 4 · The seam is loaded wherever a migrated module is used
// ---------------------------------------------------------------------
// A page that loads my-programme.js without portal-data.js throws on
// first call. Cheap to assert, and exactly the kind of wiring mistake
// that only shows up when a real session exists.
const pages = readdirSync(ROOT).filter((f) => f.endsWith('.html'));
const unwired = [];
for (const p of pages) {
  const html = readFileSync(path.join(ROOT, p), 'utf8');
  const uses = MIGRATED.filter((m) => html.includes('/js/' + m));
  if (uses.length && !html.includes('/js/portal-data.js')) {
    unwired.push(`${p} (loads ${uses.join(', ')})`);
  }
}
check('Every page loading a migrated module also loads the seam',
  unwired.length === 0, unwired.join(' | '));

// ---------------------------------------------------------------------
// 5 · No portal page prints a raw server message to a learner
// ---------------------------------------------------------------------
// The transport falls back to HTTP's own statusText when an endpoint
// sends no message of its own, so a page that prints err.message shows
// "File not found" or "Internal Server Error" to a student. That is what
// the portal did on every failure path until humanError() existed. This
// keeps it from coming back.
const PORTAL_MODULES = [
  'my-programme.js', 'my-record.js', 'listening-lab.js',
  'admin-enrolments.js', 'instructor-review.js', 'graduate.js'
];
const raw = [];
for (const f of PORTAL_MODULES) {
  let src;
  try { src = readFileSync(path.join(JS, f), 'utf8'); } catch { continue; }
  for (const [i, line] of src.split('\n').entries()) {
    // A message concatenated into user-facing text. Throwing one (inside
    // the transport, where it is caught and classified) is fine; printing
    // one is not.
    if (/\b(?:textContent|innerHTML)\s*=[^;]*\b(?:err|e|error)\.message\b/.test(line)
      || /['"`][^'"`]*['"`]\s*\+\s*(?:err|e|error)\.message\b/.test(line)) {
      raw.push(`${f}:${i + 1}`);
    }
  }
}
check(`No portal module prints a raw server message — ${PORTAL_MODULES.length} modules`,
  raw.length === 0, raw.join(', '));

// And the helper must classify the statuses the portal actually meets.
const seamSrc = readFileSync(path.join(JS, 'portal-data.js'), 'utf8');
const hasHuman = /function humanError\(/.test(seamSrc);
check('The seam exposes humanError()', hasHuman);
const covered = ['401', '403', '404', '429'].filter((c) => seamSrc.includes(`=== ${c}`));
check('humanError classifies 401, 403, 404 and 429 by status',
  covered.length === 4, 'covered: ' + covered.join(', '));
check('humanError never surfaces HTTP statusText',
  !/return[^;]*statusText/.test(seamSrc.slice(seamSrc.indexOf('function humanError('))));

console.log(`\n${passed} passed, ${failed} failed.`);
if (failed) process.exitCode = 1;
