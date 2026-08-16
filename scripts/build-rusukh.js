#!/usr/bin/env node
// =====================================================================
// DĀR AL-RUSŪKH — site assembly
//
// A sibling of scripts/build.js, deliberately kept separate rather than
// folded into it. The two sites share a design system (css/brand.css)
// and nothing else: different institution, different chrome, different
// manifest, different output tree. Merging them would mean every WEC-LC
// build touching Dār al-Rusūkh's pages and vice versa, which is exactly
// the coupling that makes a shared generator dangerous.
//
// Source:  rusukh-src/{pages,partials}/  + rusukh-src/manifest.json
// Output:  rusukh/**/index.html
//
// No dependencies — Node's built-in fs/path only.
// =====================================================================

const fs = require('fs');
const path = require('path');

const ROOT = path.resolve(__dirname, '..');
const SRC = path.join(ROOT, 'rusukh-src');
const PAGES = path.join(SRC, 'pages');
const PARTIALS = path.join(SRC, 'partials');
const OUT_DIR = 'rusukh';

const SITE_URL = 'https://www.daralrusukh.com';

const read = (p) => fs.readFileSync(p, 'utf8');

const fill = (tpl, tokens) =>
  Object.keys(tokens).reduce(
    (out, k) => out.split('{{' + k + '}}').join(tokens[k]),
    tpl
  );

// ---------------------------------------------------------------------
// TYPE
//
// The same three Latin families the design system is built on — Bodoni
// Moda variable on the optical-size axis for display, Cinzel for
// ceremonial capitals, Inter for everything read rather than admired.
//
// Amiri and Cairo load on EVERY page here, unlike the WEC-LC build
// which skips them on English routes. That asymmetry is deliberate:
// this is a college of Qur'anic sciences, and Arabic script appears in
// running English copy on every single page — surah names, matn titles,
// the motto, the faculty names. Subsetting would be the wrong economy.
// ---------------------------------------------------------------------
const FONTS =
  'family=Bodoni+Moda:ital,opsz,wght@0,6..96,500..800;1,6..96,400..600' +
  '&family=Cinzel:wght@500;600' +
  '&family=Inter:wght@400;600;700;800' +
  '&family=Amiri:wght@400;700' +
  '&family=Cairo:wght@400;600;700';

const FONTS_URL = `https://fonts.googleapis.com/css2?${FONTS}&display=swap`;

// "about/index.html" -> "/rusukh/about/";  "index.html" -> "/rusukh/"
function urlPathFor(output) {
  return '/' + OUT_DIR + '/' + output.replace(/index\.html$/, '');
}

// ---------------------------------------------------------------------
// THE MASTHEAD
//
// Every page but the home page opens with the same shape — eyebrow, h1,
// lede inside a dark section. css/rusukh.css turns that into a masthead
// only when the section carries .page-hero, and the class is applied
// here at assembly rather than typed into each source file, for the
// reason build.js documents at length: a class typed into a generated
// file is stripped the next time its generator runs.
// ---------------------------------------------------------------------
const MASTHEAD_OPENING = /^(\s*)<section class="section--dark section-pad"/;

function raiseMasthead(html) {
  if (!MASTHEAD_OPENING.test(html)) return html;
  return html.replace(
    MASTHEAD_OPENING,
    '$1<section class="page-hero section--dark section-pad"'
  );
}

// ---------------------------------------------------------------------
// THE CONTENTS RAIL
//
// Built from the page's own sections, so it cannot describe a section
// that no longer exists. A section's `data-contents` supplies the label;
// the module-marker is the fallback, because it is already the section's
// short name and is already authored.
// ---------------------------------------------------------------------
function contentsEntries(html) {
  const out = [];
  const open = /<section\b([^>]*)>/g;
  let m;
  while ((m = open.exec(html))) {
    const attrs = m[1];
    const id = (attrs.match(/\bid="([^"]+)"/) || [])[1];
    if (!id) continue;
    if (/\bpage-hero\b/.test(attrs)) continue;
    const explicit = (attrs.match(/\bdata-contents="([^"]+)"/) || [])[1];
    const rest = html.slice(m.index, html.indexOf('</section>', m.index));
    const marker =
      (rest.match(/<span class="module-marker"[^>]*>([\s\S]*?)<\/span>/) || [])[1];
    const h2 = (rest.match(/<h2[^>]*>([\s\S]*?)<\/h2>/) || [])[1];
    const src = explicit || marker || h2;
    if (!src) continue;
    const label = src
      .replace(/<[^>]+>/g, '')
      .replace(/&amp;/g, '&')
      .replace(/&middot;/g, '·')
      .replace(/&mdash;/g, '—')
      .replace(/\s+/g, ' ')
      .trim()
      .replace(/[.。]$/, '');
    if (label) out.push({ id, label });
  }
  return out;
}

function withContentsRail(html, entry) {
  if (!entry.contents) return html;
  const items = contentsEntries(html);
  // Under four sections a rail costs a band of chrome to save a scroll.
  if (items.length < 4) return html;

  const rail = `<nav class="contents" aria-label="On this page">
  <div class="contents__inner">
    <span class="contents__label">On this page</span>
    <ul class="contents__list">
${items.map((i) => `      <li><a href="#${i.id}">${i.label}</a></li>`).join('\n')}
    </ul>
  </div>
</nav>
`;
  const close = html.indexOf('</section>');
  if (close === -1) return rail + html;
  const at = close + '</section>'.length;
  return html.slice(0, at) + '\n\n' + rail + html.slice(at);
}

// ---------------------------------------------------------------------
// NAVIGATION STATE
//
// The header is one partial serving every page, so "which nav item is
// current" cannot be authored into it. Each entry declares its `nav`
// key and the matching link gets aria-current — set here so that adding
// a page cannot forget to light its own nav item.
// ---------------------------------------------------------------------
function markCurrentNav(header, navKey) {
  if (!navKey) return header;
  return header.replace(
    new RegExp(`(<a\\b[^>]*\\bdata-nav="${navKey}")`, 'g'),
    '$1 aria-current="page"'
  );
}

const BUILD_ID = (process.env.GITHUB_SHA || '').slice(0, 12);

function build() {
  // The icon sprite, read once rather than per page. Inlined rather than
  // linked because `currentColor` does not inherit across an external
  // <use> reference in several browsers — which is the whole mechanism
  // that lets one symbol render on navy, on paper and in gold.
  const icons = read(path.join(PARTIALS, 'icons.html')).trimEnd();

  const manifest = JSON.parse(read(path.join(SRC, 'manifest.json')));
  const seen = new Set();
  let count = 0;

  manifest.forEach((entry) => {
    const canonical = SITE_URL + urlPathFor(entry.output);
    if (seen.has(canonical)) {
      throw new Error(`Two manifest entries produce the same URL — ${canonical}`);
    }
    seen.add(canonical);

    const contentPath = path.join(PAGES, entry.contentFile);
    if (!fs.existsSync(contentPath)) {
      throw new Error(`${entry.slug}: content file not found — ${entry.contentFile}`);
    }

    const head = fill(read(path.join(PARTIALS, 'head.html')), {
      TITLE: entry.title,
      DESCRIPTION: entry.description,
      CANONICAL: canonical,
      FONTS_URL,
      BUILD_ID,
      EXTRA_CSS: (entry.extraCss || [])
        .map((h) => `\n<link rel="stylesheet" href="${h}">`)
        .join(''),
    });

    const content = withContentsRail(
      raiseMasthead(read(contentPath)),
      entry
    );

    const html = `<!DOCTYPE html>
<html lang="en" dir="ltr">
<head>
${head}
</head>
<body data-section="${entry.nav || 'root'}">
<a class="skip-link" href="#main">Skip to main content</a>
${icons}
${read(path.join(PARTIALS, 'topbar.html')).trimEnd()}
${markCurrentNav(read(path.join(PARTIALS, 'header.html')).trimEnd(), entry.nav)}
<main id="main">
${content}
</main>
${read(path.join(PARTIALS, 'footer.html')).trimEnd()}
<script src="/js/site.js"></script>
<script src="/js/motion.js"></script>
<script src="/js/atelier.js" defer></script>
<script src="/js/rusukh-clock.js" defer></script>
</body>
</html>
`;

    const outPath = path.join(ROOT, OUT_DIR, entry.output);
    fs.mkdirSync(path.dirname(outPath), { recursive: true });
    fs.writeFileSync(outPath, html);
    count++;
  });

  writeSitemap(manifest);
  console.log(`Dār al-Rusūkh — built ${count} pages into ${OUT_DIR}/`);
}

function writeSitemap(manifest) {
  const urls = [
    ...new Set(
      manifest
        .filter((e) => !/(^|\/)404\.html$/.test(e.output))
        .map((e) => SITE_URL + urlPathFor(e.output))
    ),
  ].sort((a, b) => a.localeCompare(b));

  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<!-- Generated by scripts/build-rusukh.js from rusukh-src/manifest.json.
     Do not edit: the next build overwrites it. -->
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${urls.map((u) => `  <url><loc>${u}</loc></url>`).join('\n')}
</urlset>
`;
  fs.mkdirSync(path.join(ROOT, OUT_DIR), { recursive: true });
  fs.writeFileSync(path.join(ROOT, OUT_DIR, 'sitemap.xml'), xml);
}

build();
