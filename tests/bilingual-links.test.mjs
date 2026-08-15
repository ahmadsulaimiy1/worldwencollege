// THE READER IS NOT DROPPED INTO A LANGUAGE THEY DID NOT CHOOSE.
//
// Forty-two English routes have no Arabic counterpart yet, and the
// Arabic pages have to link to some of them anyway — the evidence
// record, the six level pages, the portal preview. That is a gap being
// closed over time, not a defect.
//
// What WOULD be a defect is doing it silently. A reader following a
// link from an Arabic page has every reason to expect Arabic at the
// other end, and discovering otherwise after the click is the sort of
// small discourtesy that tells an institutional visitor exactly how
// much thought went into their half of the site.
//
// So the College's convention is that any link out of Arabic into
// English is marked in its own link text — "(EN)" or "(بالإنجليزية)" —
// before the reader commits to it.
//
// That convention was being followed everywhere and enforced nowhere,
// which is the state every convention is in immediately before it
// stops being followed. This test is the enforcement. It is written to
// fail on the NEXT unmarked link, not on the ones that exist, because
// the ones that exist are already correct.
//
// When an Arabic page is published for one of these routes, the link
// should point at /ar/... and lose its marker. This test will not
// complain about that — it only ever objects to an unmarked crossing.

import { readFileSync, readdirSync } from 'node:fs';
import path from 'node:path';
import { ROOT } from './helpers.mjs';

let pass = 0, fail = 0;
const check = (label, cond, detail) => {
  console.log((cond ? 'PASS ' : 'FAIL ') + label + (cond || detail === undefined ? '' : ` — ${detail}`));
  cond ? pass++ : fail++;
};

const PAGES = path.join(ROOT, 'pages');
const manifest = JSON.parse(readFileSync(path.join(PAGES, 'manifest.json'), 'utf8'));
const entries = Array.isArray(manifest) ? manifest : manifest.pages;

// Routes that exist in Arabic, as the manifest actually builds them.
const arabicRoutes = new Set(
  entries.filter((e) => e.output.startsWith('ar/'))
    .map((e) => '/' + e.output.replace(/index\.html$/, ''))
);

// A crossing is marked if its own anchor text says so. Checking the
// anchor's text — rather than the page having a general disclaimer
// somewhere — is deliberate: a reader scanning a list of links reads
// the link, not the footnote.
const MARKED = /\(EN\)|\(بالإنجليزية\)|بالإنجليزية/;

// Assets and API endpoints are not pages and have no language.
const NOT_A_PAGE = /^\/(css|js|assets|api)\//;

const arabicSources = readdirSync(PAGES).filter((f) => f.endsWith('.ar.html'));
check(`There are Arabic pages to check — ${arabicSources.length} found`, arabicSources.length > 10);

const unmarked = [];
const shouldPointAtArabic = [];
let crossings = 0;

for (const file of arabicSources) {
  const html = readFileSync(path.join(PAGES, file), 'utf8');

  // Anchor, with its full inner text — including any <span dir="ltr">
  // wrappers the marker is usually written inside.
  for (const m of html.matchAll(/<a\b[^>]*href="(\/[^"]*)"[^>]*>([\s\S]*?)<\/a>/g)) {
    const href = m[1].split('#')[0].split('?')[0];
    const label = m[2].replace(/<[^>]*>/g, ' ');
    if (!href || NOT_A_PAGE.test(href)) continue;
    if (href.startsWith('/ar/') || href === '/ar') continue;

    crossings++;

    // Worse than an unmarked crossing: crossing when there was no need,
    // because the Arabic page exists and the link simply missed it.
    const arEquivalent = '/ar' + href;
    if (arabicRoutes.has(arEquivalent)) {
      shouldPointAtArabic.push(`${file} → ${href} (but ${arEquivalent} is built)`);
      continue;
    }

    if (!MARKED.test(label)) unmarked.push(`${file} → ${href} — "${label.trim().slice(0, 40)}"`);
  }
}

check(`Every link out of Arabic into English is marked as English — ${crossings} crossings checked`,
  unmarked.length === 0,
  unmarked.slice(0, 6).join(' · '));

check('No Arabic page links to an English page that already has an Arabic edition',
  shouldPointAtArabic.length === 0,
  shouldPointAtArabic.slice(0, 6).join(' · '));

// A check that only ever sees compliant pages proves nothing about its
// own reach, so confirm the pattern catches what it exists for.
check('...and the marker test does catch an unmarked crossing',
  !MARKED.test('سجل الأدلة')
  && MARKED.test('سجل الأدلة (بالإنجليزية)')
  && MARKED.test('المستوى الأول  (EN) '));

// ── THE LANGUAGE SWITCH ITSELF ────────────────────────────────────────
//
// Every rule above is about links a page's author wrote. The topbar's
// switch is written once, by the build, for all ninety pages — and it
// was wrong on forty of them.
//
// `altHref` names a page's counterpart in the other language. Where the
// manifest has none, the fallback was `/`: so on every English page
// without an Arabic edition, العربية sent the reader to the ENGLISH
// homepage. A language switch that returns you to the language you are
// already reading does not read as a missing translation. It reads as a
// broken site.
//
// Two things are checked, because they are two different claims. The
// SWITCH is navigation and must always cross — to the counterpart where
// one exists, to the other language's front door otherwise. The
// hreflang ALTERNATE is an assertion to a search engine that a given
// URL is this page in that language, and a front door is not a
// translation of the Level I syllabus, so a page without a counterpart
// declares no alternate at all.
{
  const built = (out) => path.join(ROOT, out);
  const switchOf = (html) => (html.match(/class="topbar__lang"[^>]*href="([^"]*)"/) || [])[1];
  const altsOf = (html) => [...html.matchAll(/rel="alternate" hreflang="([^"]+)" href="([^"]+)"/g)]
    .map((m) => [m[1], m[2]]);

  const wrongWay = [], falseAlternate = [], missingAlternate = [];
  for (const e of entries) {
    let html;
    try { html = readFileSync(built(e.output), 'utf8'); } catch { continue; }
    const isAr = e.output.startsWith('ar/');
    const href = switchOf(html);
    if (!href) continue;                       // no topbar on this page

    // The switch must land in the OTHER language, always.
    const landsInArabic = href === '/ar/' || href.startsWith('/ar/');
    if (isAr === landsInArabic) wrongWay.push(`${e.output} → ${href}`);

    const alts = altsOf(html);
    const hasCounterpart = Boolean(e.altHref);
    const other = alts.find(([hl]) => hl === (isAr ? 'en' : 'ar'));
    if (!hasCounterpart && other) falseAlternate.push(`${e.output} claims ${other[0]}: ${other[1]}`);
    if (hasCounterpart && !other) missingAlternate.push(e.output);
  }

  check(`The language switch always crosses languages — ${entries.length} pages`,
    wrongWay.length === 0, wrongWay.slice(0, 6).join(' · '));
  check('No page claims an hreflang alternate it does not have',
    falseAlternate.length === 0, falseAlternate.slice(0, 6).join(' · '));
  check('Every page that HAS a counterpart declares it',
    missingAlternate.length === 0, missingAlternate.slice(0, 6).join(' · '));
}

// ── The gap itself, reported rather than asserted ─────────────────────
// This is not a failure — it is the number the master plan is working
// down. Printing it keeps it visible in every test run instead of
// needing somebody to go and count.
{
  const englishRoutes = entries
    .filter((e) => !e.output.startsWith('ar/') && !/404\.html$/.test(e.output))
    .map((e) => '/' + e.output.replace(/index\.html$/, ''));
  const missing = englishRoutes.filter((r) => !arabicRoutes.has('/ar' + r));
  console.log(`\nNOTE ${missing.length} of ${englishRoutes.length} English routes have no Arabic edition yet.`);
  console.log('     Tracked in docs/digital-institution-masterplan.md. Not a failure — a backlog.');
}

console.log(`\n${pass} passed, ${fail} failed.`);
process.exit(fail ? 1 : 0);
