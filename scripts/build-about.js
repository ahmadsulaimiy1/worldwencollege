#!/usr/bin/env node
/**
 * THE ABOUT CLUSTER — the manifest rows for two pages: the College
 * pillar and Careers. (Governance and standards moved to
 * scripts/build-governance.js.)
 *
 * ────────────────────────────────────────────────────────────────────
 * WHAT THIS FILE IS NOW
 * ────────────────────────────────────────────────────────────────────
 * A router, and nothing else. It writes no page body. Both pages in
 * this cluster are hand-authored in pages/, and this file holds their
 * title, description, contents rail and Arabic twin so that the
 * manifest has one owner per cluster rather than a hand-maintained
 * list.
 *
 * It used to write both bodies from the database, and stopped being
 * able to the day each page was restructured: emitPage's digest guard
 * saw the hand edit and refused to overwrite, correctly, on every run
 * after. What it did not do — could not do — was remove the superseded
 * markup, so this file went on holding a complete second copy of both
 * pages that no run emitted and no reader ever saw. The About copy
 * carried ticks against outstanding work and the phrase "world-class",
 * both of which CLAUDE.md §5 forbids by name, and it was one
 * `WEC_REGENERATE=1` away from being published over the page that had
 * fixed them.
 *
 * A generator that cannot write a page should not keep a copy of it.
 * Both copies are gone, and with them the database reads that existed
 * only to fill them.
 *
 * ────────────────────────────────────────────────────────────────────
 * WHERE THE GOVERNANCE FACTS LIVE
 * ────────────────────────────────────────────────────────────────────
 * They are READ, not written, and they are read by the file that
 * publishes them. The two academic bodies, their remits, their
 * establishment dates and — critically — their `members_appointed`
 * counts come from the database via scripts/build-governance.js. BASCE
 * reads zero; the Senate reads three and has not yet convened. Those
 * are two different positions producing the same outcome today, and
 * the pages distinguish them in the first paragraph rather than in a
 * footnote, because collapsing them is how "constituted" quietly
 * becomes "approved".
 *
 * There was no Leadership page in this cluster for as long as there
 * were no leaders — a Leadership page with nobody on it is either empty
 * or invented, and docs/org-chart-placeholders.md exists precisely
 * because inventing one was considered and refused. That changed on
 * 14 August 2026, when the College attested a Board of Governors, an
 * Academic Senate and an Executive. The leadership now appears on
 * /about/governance/, rendered from docs/governance-register.md by
 * scripts/lib/governance-register.js and held to that register by
 * tests/governance-register.test.mjs: no name reaches a page unless the
 * register carries it, and a credential the College did not supply
 * renders as nothing at all rather than as a plausible guess.
 */
const fs = require('fs');
const path = require('path');
const { emitPage, reportEmit } = require('./lib/emit-page');
const ROOT = path.resolve(__dirname, '..');

// NOTHING IS READ FROM THE DATABASE HERE ANY MORE, AND THAT IS THE
// POINT. This file used to open the schema, read the academic bodies,
// the competency framework and the level ladder, and interpolate them
// into two page bodies. Both bodies are gone — the pages they wrote are
// hand-authored now — so the reads went with them rather than being
// left as a query nobody consumes. What survives is what this file is
// actually still for: routing the About cluster through
// pages/manifest.json. The governance figures it used to cite are read
// by scripts/build-governance.js, which is the file that publishes
// them.

const PAGES = {};

// THE PILLAR BODY IS NOT GENERATED HERE ANY MORE.
//
// pages/about.html was restructured by hand into numbered leaves, and
// its own header records why: the two Vision passages became one, and
// Institutional Status stopped marking confirmed and outstanding work
// with the same tick. emitPage's digest guard has refused to overwrite
// it ever since, which meant the twenty thousand characters of
// superseded markup that used to sit at this line were invisible — a
// second, older About page one `WEC_REGENERATE=1` away from being
// republished, carrying ticks against outstanding work and the phrase
// "world-class", both of which CLAUDE.md §5 forbids by name.
//
// A generator that cannot write a page should not hold a copy of it.
// This entry now carries the manifest row only: the title, the
// description, the contents rail and the Arabic twin, all of which are
// still this file's to state. The body lives in pages/about.html.
PAGES.pillar = {
  slug: 'about', output: 'about/index.html', file: 'about.html',
  contents: true,
  altHref: '/ar/about/',
  title: 'About the College &mdash; WorldWide English College',
  description: 'Who WorldWide English College is: its vision, mission and educational '
    + 'philosophy, how it is organised, and its institutional status stated plainly.',
  manifestOnly: true,
};

// AND THE SAME FOR CAREERS, FOR THE SAME REASON.
// pages/about-careers.html has been rewritten by hand to three times
// the length this generator held, so every run reported that it was
// leaving a hand-edited page untouched — which is the guard working,
// but it leaves a shorter, older Careers page sitting in the generator
// where nobody reads it and one override would publish it.
PAGES.careers = {
  slug: 'about-careers', output: 'about/careers/index.html', file: 'about-careers.html',
  title: 'Careers &mdash; WorldWide English College',
  description: 'Working at WorldWide English College: the posts the College is seeking to fill, '
    + 'what each one unblocks, and how to express interest.',
  manifestOnly: true,
};

// ── write ────────────────────────────────────────────────────────────
const MANIFEST = path.join(ROOT, 'pages/manifest.json');
const manifest = JSON.parse(fs.readFileSync(MANIFEST, 'utf8'));
const entries = Array.isArray(manifest) ? manifest : manifest.pages;
const written = [];
const emitted = [];

// Absorbed into the College pillar as #vision, #mission, #philosophy
// and #structure.
for (const slug of ['about-vision', 'about-mission', 'about-philosophy', 'about-structure']) {
  const i = entries.findIndex((e) => e.slug === slug);
  if (i >= 0) entries.splice(i, 1);
}

for (const p of Object.values(PAGES)) {
  const target = path.join(ROOT, 'pages', p.file);
  if (!p.manifestOnly) emitted.push({ file: target, result: emitPage(target, p.body) });
  const entry = {
    slug: p.slug, output: p.output, title: p.title, description: p.description,
    contentFile: p.file, lang: 'en', dir: 'ltr',
  };
  if (p.contents) entry.contents = true;
  const i = entries.findIndex((e) => e.slug === p.slug);
  if (i >= 0) entries[i] = { ...entries[i], ...entry }; else entries.push(entry);
  written.push(p.output);
}

fs.writeFileSync(MANIFEST, JSON.stringify(manifest, null, 2) + '\n');
// The manifest entry is written for every page; the PAGE BODY is written
// only where the guard allows it. "Routed" rather than "Wrote" because
// the two are no longer the same act — see scripts/lib/emit-page.js, and
// read the guard's own summary below this list for what reached disk.
console.log(`Routed ${written.length} About-cluster pages through the manifest:`);
for (const o of written) console.log(`  ${o}`);
console.log('Run `npm run build` to generate the served pages.');

reportEmit('build-about.js', emitted);
