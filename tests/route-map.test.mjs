// NO PAGE MOVES SILENTLY.
//
// The architecture in docs/information-architecture.html retires
// thirty-seven English URLs and their Arabic counterparts. Every one of
// them is indexed, several are printed inside published volumes, and
// the College's own site-integrity test already fails on a broken
// internal link — so the migration is the part that must not be
// improvised.
//
// This file is the harness, and it exists BEFORE any page has moved.
// That is the point: it asserts a different thing depending on whether
// a route has migrated yet, so it is meaningful at every stage rather
// than only at the end.
//
//   migrated: false → the old page must still exist, and nothing may
//     redirect it. The plan describes reality; it does not wish at it.
//   migrated: true  → the old page must be gone, a 301 must exist, the
//     target must resolve (including its anchor), and no internal link,
//     sitemap entry or hreflang may still point at the old URL.
//
// So flipping one flag is what turns the checks on for that route. A
// phase that moves a page without flipping its flag fails. A phase that
// flips a flag without moving the page fails too. Neither can be done
// quietly, which is the whole reason this was built first.

import { readFileSync, existsSync, readdirSync, statSync } from 'node:fs';
import path from 'node:path';
import { createRequire } from 'node:module';
import { ROOT } from './helpers.mjs';

const require = createRequire(import.meta.url);
const { ALL, retiredSet, pageOf } = require(path.join(ROOT, 'scripts/lib/route-map.js'));

let pass = 0, fail = 0;
const check = (label, cond, detail) => {
  console.log((cond ? 'PASS ' : 'FAIL ') + label + (cond || detail === undefined ? '' : ` — ${detail}`));
  cond ? pass++ : fail++;
};
const list = (a, n = 5) => a.slice(0, n).join(' · ') + (a.length > n ? ` … +${a.length - n}` : '');

const redirects = readFileSync(path.join(ROOT, '_redirects'), 'utf8');
const sitemap = readFileSync(path.join(ROOT, 'sitemap.xml'), 'utf8');

/** A route's built file on disk. */
const fileFor = (url) => path.join(ROOT, url.replace(/^\//, '') + (url.endsWith('/') ? 'index.html' : ''));

/** Every rule in _redirects, as [from, to]. */
const rules = redirects.split('\n')
  .filter((l) => l.trim() && !l.trim().startsWith('#'))
  .map((l) => l.trim().split(/\s+/))
  .filter((p) => p.length >= 2)
  .map(([from, to]) => [from, to]);
const ruleFor = (url) => rules.find(([from]) => from === url);

// Every built HTML page, for the link sweep.
const built = [];
(function walk(dir) {
  for (const entry of readdirSync(dir)) {
    if (['node_modules', 'tests', 'pages', 'partials', 'docs', 'sql', 'functions', 'scripts', '.git', 'assets'].includes(entry)
      || entry.startsWith('.')) continue;
    const p = path.join(dir, entry);
    if (statSync(p).isDirectory()) walk(p);
    else if (entry.endsWith('.html')) built.push(p);
  }
})(ROOT);

check(`The route map is loaded — ${ALL.length} planned retirements`, ALL.length > 0);
check(`There are built pages to check against — ${built.length}`, built.length > 20);

// ── 1 · The map is internally coherent, migrated or not ───────────────
{
  const dupes = [], chains = [], selfies = [], malformed = [];
  const seen = new Set();
  for (const r of ALL) {
    if (seen.has(r.from)) dupes.push(r.from); else seen.add(r.from);
    if (!r.from.startsWith('/') || !r.to.startsWith('/')) malformed.push(`${r.from} → ${r.to}`);
    if (r.from === pageOf(r.to)) selfies.push(r.from);
    // A target may not itself be retired: two hops for one move.
    if (retiredSet.has(pageOf(r.to)) && pageOf(r.to) !== r.from) chains.push(`${r.from} → ${r.to} (also retired)`);
  }
  check('No URL is retired twice', dupes.length === 0, list(dupes));
  check('Every entry is a well-formed absolute path', malformed.length === 0, list(malformed));
  check('No route is retired to itself', selfies.length === 0, list(selfies));
  check('No redirect target is itself a retired URL', chains.length === 0, list(chains));
}

// ── 2 · Every English retirement has an Arabic counterpart ────────────
{
  const en = ALL.filter((r) => !r.from.startsWith('/ar/'));
  const ar = new Set(ALL.filter((r) => r.from.startsWith('/ar/')).map((r) => r.from));
  const orphans = en.filter((r) => !ar.has(`/ar${r.from}`)).map((r) => r.from);
  check(`Every English retirement has its Arabic twin — ${en.length} pairs`,
    orphans.length === 0, list(orphans));
}

// ── 3 · Not-yet-migrated routes still serve their own page ────────────
//
// The check that keeps the plan honest. A route listed as pending whose
// page has already gone means the migration happened without the
// harness, which is exactly the failure this file exists to prevent.
{
  const vanished = [], premature = [];
  for (const r of ALL.filter((x) => !x.migrated)) {
    // The Arabic twin of a route with no Arabic edition yet is expected
    // to be absent — the backlog, not a fault.
    const isAr = r.from.startsWith('/ar/');
    if (!existsSync(fileFor(r.from)) && !isAr) vanished.push(r.from);
    if (ruleFor(r.from)) premature.push(r.from);
  }
  check('Every route still marked pending is still being served',
    vanished.length === 0, list(vanished));
  check('No pending route has a redirect shadowing it',
    premature.length === 0, list(premature));
}

// ── 4 · Migrated routes are gone, redirected, and land somewhere ──────
{
  const stillThere = [], noRule = [], badTarget = [], noAnchor = [];
  for (const r of ALL.filter((x) => x.migrated)) {
    if (existsSync(fileFor(r.from))) stillThere.push(r.from);
    const rule = ruleFor(r.from);
    if (!rule) { noRule.push(r.from); continue; }
    const target = fileFor(pageOf(rule[1]));
    if (!existsSync(target)) { badTarget.push(`${r.from} → ${rule[1]}`); continue; }
    // An anchor that does not exist is a redirect that dumps the reader
    // at the top of a 3,000-word page with no idea what they came for.
    const frag = rule[1].split('#')[1];
    if (frag && !new RegExp(`id="${frag}"`).test(readFileSync(target, 'utf8'))) {
      noAnchor.push(`${r.from} → ${rule[1]}`);
    }
  }
  check('Every migrated route has stopped serving its own page', stillThere.length === 0, list(stillThere));
  check('Every migrated route has a redirect', noRule.length === 0, list(noRule));
  check('Every redirect target resolves to a built page', badTarget.length === 0, list(badTarget));
  check('Every redirect anchor exists on the page it points at', noAnchor.length === 0, list(noAnchor));
}

// ── 5 · Nothing on the site still points at a migrated URL ────────────
//
// A 301 is a courtesy to the outside world, not a licence to leave
// stale links inside the site. An internal link to a redirected URL
// costs the reader a round trip and tells a search engine the site
// disagrees with itself.
{
  const stale = [], staleMap = [];
  const gone = ALL.filter((r) => r.migrated).map((r) => r.from);
  for (const file of built) {
    const html = readFileSync(file, 'utf8');
    for (const url of gone) {
      // Escaped properly rather than just the slashes: today every
      // retired path is plain word characters, but a route with a dot
      // in it would silently turn into a wildcard and this check would
      // start reporting matches it had not really found.
      const lit = url.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
      // The absolute-URL arm is anchored to the site's own host. As
      // `https://[^"]*` it swallowed any prefix, so a canonical URL of
      // /press/standards/ matched the retired /standards/ and a live
      // page was reported stale.
      if (new RegExp(`(?:href|content)="(?:https://www\\.worldwencollege\\.co\\.uk)?${lit}"`).test(html)) {
        stale.push(`${path.relative(ROOT, file)} → ${url}`);
      }
    }
  }
  // Anchored to the host: a bare includes() of '/standards/<' also
  // matches '/press/standards/</loc>' and reported a live page as stale.
  for (const url of gone) if (sitemap.includes(`worldwencollege.co.uk${url}<`)) staleMap.push(url);
  check('No page links to a URL that has been retired', stale.length === 0, list(stale, 6));
  check('The sitemap lists no retired URL', staleMap.length === 0, list(staleMap));
}

// ── 6 · The generated block matches the map ───────────────────────────
//
// The redirect file is generated; a hand edit inside the markers, or a
// forgotten run of the generator, would put the two out of step
// silently.
{
  const OPEN = '# >>> GENERATED FROM scripts/lib/route-map.js';
  check('_redirects carries the generated block', redirects.includes(OPEN));
  const block = redirects.slice(redirects.indexOf(OPEN));
  const missing = ALL.filter((r) => r.migrated && !block.includes(r.from)).map((r) => r.from);
  check('The generated block lists every migrated route — run scripts/build-redirects.js if not',
    missing.length === 0, list(missing));
}

// ── 7 · The harness can actually catch what it exists for ─────────────
//
// A check whose only observed state is its own passing state proves
// nothing about its reach. These exercise each rule against a
// fabricated map rather than against the real one.
{
  const fake = [
    { from: '/a/', to: '/b/#x' },
    { from: '/b/', to: '/c/' },          // /a/ chains through a retired /b/
    { from: '/d/', to: '/d/#y' },        // retired to itself
    { from: '/e/', to: 'nowhere' },      // malformed
  ];
  const fakeSet = new Set(fake.map((r) => r.from));
  const chains = fake.filter((r) => fakeSet.has(pageOf(r.to)) && pageOf(r.to) !== r.from);
  const selfies = fake.filter((r) => r.from === pageOf(r.to));
  const malformed = fake.filter((r) => !r.to.startsWith('/'));
  check('...and the coherence rules do fire on a broken map',
    chains.length === 1 && selfies.length === 1 && malformed.length === 1,
    `chains ${chains.length}, self ${selfies.length}, malformed ${malformed.length}`);

  check('...and pageOf strips the fragment',
    pageOf('/about/#vision') === '/about/' && pageOf('/about/') === '/about/');
}

const pending = ALL.filter((r) => !r.migrated).length;
console.log(`\nNOTE ${ALL.length - pending} of ${ALL.length} planned retirements have migrated; ${pending} still serving.`);
console.log('     Tracked in docs/information-architecture.html. Not a failure — a migration in progress.');

console.log(`\n${pass} passed, ${fail} failed.`);
process.exit(fail ? 1 : 0);
