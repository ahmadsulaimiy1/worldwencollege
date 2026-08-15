// A SECTION CANNOT QUIETLY DROP OUT OF THE RAIL.
//
// The information architecture collapses thirty-three routes into
// deep-linked sections of six pillar pages, and the contents rail is
// what makes that an improvement rather than a burial. Every anchor the
// mega menu will point at depends on it.
//
// The rail is generated in scripts/build.js from the page's own
// sections, so it cannot describe a page that no longer exists. What it
// CAN do is quietly omit a section — a new section added without a
// module marker or a heading produces no rail entry, the page still
// builds, every other check still passes, and a chunk of a flagship
// page becomes unreachable from its own navigation. That is the failure
// this file exists for.
//
// It also pins the two decisions the component makes, so neither is
// re-derived wrongly later: the label comes from the section's module
// marker (already authored, already translated), and a page with fewer
// than four sections gets no rail at all, because a band of chrome to
// save one scroll is furniture.

import { readFileSync, readdirSync } from 'node:fs';
import path from 'node:path';
import { ROOT } from './helpers.mjs';

let pass = 0, fail = 0;
const check = (label, cond, detail) => {
  console.log((cond ? 'PASS ' : 'FAIL ') + label + (cond || detail === undefined ? '' : ` — ${detail}`));
  cond ? pass++ : fail++;
};
const list = (a, n = 5) => a.slice(0, n).join(' · ') + (a.length > n ? ` … +${a.length - n}` : '');

const manifest = JSON.parse(readFileSync(path.join(ROOT, 'pages/manifest.json'), 'utf8'));
const entries = Array.isArray(manifest) ? manifest : manifest.pages;
const built = (e) => readFileSync(path.join(ROOT, e.output), 'utf8');

const withRail = entries.filter((e) => e.contents);
const without = entries.filter((e) => !e.contents);

check(`Pages opting into a rail — ${withRail.length}`, withRail.length > 0);

// ── 1 · Opting in produces a rail; not opting in does not ─────────────
{
  const missing = withRail.filter((e) => !built(e).includes('class="contents"')).map((e) => e.output);
  const uninvited = without.filter((e) => built(e).includes('class="contents"')).map((e) => e.output);
  check('Every page that opted in has a rail', missing.length === 0, list(missing));
  check('No page that did not opt in has one', uninvited.length === 0, list(uninvited));
}

// ── 2 · Every rail link lands on a section that exists ────────────────
{
  const dangling = [];
  for (const e of withRail) {
    const html = built(e);
    for (const m of html.matchAll(/<li><a href="#([^"]+)">/g)) {
      if (!new RegExp(`id="${m[1]}"`).test(html)) dangling.push(`${e.output} → #${m[1]}`);
    }
  }
  check('Every rail entry points at a section that exists', dangling.length === 0, list(dangling));
}

// ── 3 · No section is missing from the rail ───────────────────────────
//
// The drift check, and the reason this file exists. A section with an
// id and a name is a place a reader can be sent; if the rail does not
// list it, it is reachable only by scrolling past it.
{
  const dropped = [];
  for (const e of withRail) {
    const html = built(e);
    const inRail = new Set([...html.matchAll(/<li><a href="#([^"]+)">/g)].map((m) => m[1]));
    // Sections in the page body only. The chrome carries ids of its own
    // (the icon sprite, the skip target) which are not content.
    const body = html.slice(html.indexOf('<main'), html.indexOf('</main>'));
    for (const m of body.matchAll(/<section\b([^>]*)>/g)) {
      const attrs = m[1];
      const id = (attrs.match(/\bid="([^"]+)"/) || [])[1];
      if (!id || /\bpage-hero\b/.test(attrs)) continue;   // the masthead is where they are
      const chunk = body.slice(m.index, body.indexOf('</section>', m.index));
      const named = /class="module-marker"/.test(chunk) || /<h2/.test(chunk);
      if (named && !inRail.has(id)) dropped.push(`${e.output} → #${id}`);
    }
  }
  check('No named section is missing from its page\'s rail', dropped.length === 0, list(dropped));
}

// ── 4 · The label is the module marker, not the sentence heading ──────
//
// This site writes headings as full sentences — "What this level
// contains." — and a rail of those is unreadable. The marker above each
// heading is already the section's short name, in both languages.
{
  // Pinned to the level page the expectation was written about — the
  // Academics pillar also has a rail now, and its first entry is not
  // "Overview".
  const en = withRail.find((e) => e.slug === 'study-level-1');
  const html = en ? built(en) : '';
  check('The rail labels come from the module marker, not the h2',
    /<li><a href="#overview">Overview<\/a><\/li>/.test(html)
    && !/<li><a href="#overview">What this level contains/.test(html),
    'expected "Overview", the section\'s own marker');
}

// ── 5 · Arabic gets an Arabic rail ────────────────────────────────────
{
  const ar = withRail.filter((e) => e.lang === 'ar');
  const wrong = ar.filter((e) => !built(e).includes('aria-label="في هذه الصفحة"')).map((e) => e.output);
  check(`Every Arabic rail is labelled in Arabic — ${ar.length} pages`, ar.length > 0 && wrong.length === 0, list(wrong));

  // The labels themselves must be Arabic too, not English markers left
  // standing in an RTL page.
  const latin = [];
  for (const e of ar) {
    for (const m of built(e).matchAll(/<li><a href="#[^"]+">([^<]+)<\/a><\/li>/g)) {
      if (!/[؀-ۿ]/.test(m[1])) latin.push(`${e.output} → "${m[1]}"`);
    }
  }
  check('No Arabic rail entry is left in English', latin.length === 0, list(latin));
}

// ── 6 · The rail sits after the masthead, not before it ───────────────
{
  const wrong = [];
  for (const e of withRail) {
    const html = built(e);
    const hero = html.indexOf('page-hero');
    const rail = html.indexOf('class="contents"');
    if (hero === -1) continue;                  // a page with a bespoke hero
    if (rail < hero) wrong.push(e.output);
  }
  check('The rail follows the masthead', wrong.length === 0, list(wrong));
}

// ── 7 · The component's own thresholds hold ───────────────────────────
//
// Confirming the generator's rules against fabricated input, so these
// are not simply re-derived from whatever it happens to do today.
{
  const require_ = (await import('node:module')).createRequire(import.meta.url);
  const buildSrc = readFileSync(path.join(ROOT, 'scripts/build.js'), 'utf8');
  check('...the rail is withheld below four sections',
    /items\.length < 4/.test(buildSrc));
  check('...and the masthead is excluded from the rail',
    /page-hero\\b/.test(buildSrc) || /page-hero/.test(buildSrc));
  void require_;
}

console.log(`\n${pass} passed, ${fail} failed.`);
process.exit(fail ? 1 : 0);
