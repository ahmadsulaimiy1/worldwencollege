#!/usr/bin/env node
// Assembles partials + a page's content into a full HTML document
// for every entry in pages/manifest.json. No dependencies — Node's
// built-in fs/path only.

const fs = require('fs');
const path = require('path');

const ROOT = path.resolve(__dirname, '..');
const PAGES = path.join(ROOT, 'pages');
const PARTIALS = path.join(ROOT, 'partials');

function read(p) {
  return fs.readFileSync(p, 'utf8');
}

function fill(template, tokens) {
  return Object.keys(tokens).reduce(
    (out, key) => out.split('{{' + key + '}}').join(tokens[key]),
    template
  );
}

function partialFor(name, lang) {
  const arPath = path.join(PARTIALS, `${name}.ar.html`);
  if (lang === 'ar' && fs.existsSync(arPath)) return read(arPath);
  return read(path.join(PARTIALS, `${name}.html`));
}

const SITE_URL = 'https://www.worldwencollege.co.uk';

// Weight 500 deliberately omitted from both families below — verified
// (grep across css/ and every page) that no font-weight:500 is used
// anywhere in the codebase, so requesting it would just be unused
// bytes on every single page load. Italic Playfair requests weight
// 400, not 600/700: the only italic usage (.pull-quote, a bare
// <blockquote>) sets no explicit font-weight, so it renders at the
// browser default (400) — the previously-requested italic 500/600
// were never actually the weight being displayed.
const LATIN_FONTS = 'family=Playfair+Display:ital,wght@0,600;0,700;1,400&family=Inter:wght@400;600;700;800';
const ARABIC_FONTS = '&family=Amiri:wght@400;700&family=Cairo:wght@400;600;700';

// English pages never render Arabic script — skip Amiri/Cairo entirely
// rather than paying for two unused font families on every EN page load.
// Arabic pages still need Playfair/Inter too, for embedded Latin runs
// (IEFC, CEFR codes, emails) wrapped in dir="ltr" spans.
function fontsUrlFor(lang) {
  const families = lang === 'ar' ? LATIN_FONTS + ARABIC_FONTS : LATIN_FONTS;
  return `https://fonts.googleapis.com/css2?${families}&display=swap`;
}

// "about/index.html" -> "/about/"; "index.html" -> "/"
function urlPathFor(outputPath) {
  const trimmed = outputPath.replace(/index\.html$/, '');
  return '/' + trimmed;
}

function build() {
  const manifest = JSON.parse(read(path.join(PAGES, 'manifest.json')));
  let count = 0;

  // The icon sprite, read once rather than per page. It is the same
  // bytes on all 88 outputs, and it is inlined rather than linked
  // because `currentColor` does not inherit across an external <use>
  // reference in several browsers — which is the entire mechanism the
  // icon set relies on to work on navy, on paper and in gold from one
  // definition. See partials/icons.html.
  const icons = read(path.join(PARTIALS, 'icons.html')).trimEnd();

  manifest.forEach((entry) => {
    const lang = entry.lang || 'en';
    const dir = entry.dir || 'ltr';
    const canonical = SITE_URL + urlPathFor(entry.output);
    const altUrl = SITE_URL + (entry.altHref || '/');
    const hreflangEn = lang === 'en' ? canonical : altUrl;
    const hreflangAr = lang === 'ar' ? canonical : altUrl;

    // Per-page stylesheets, declared in the manifest, on the same
    // opt-in principle as `scripts` below: css/home.css is 300 lines of
    // homepage composition, and there is no reason for the tuition page
    // to download it. Absent key produces an empty string, so the built
    // output of every page that declares none is byte-identical to what
    // it was before this key existed.
    const extraCss = (entry.extraCss || [])
      .map((href) => `\n<link rel="stylesheet" href="${href}">`)
      .join('');

    const head = fill(partialFor('head', lang), {
      TITLE: entry.title,
      DESCRIPTION: entry.description,
      CANONICAL: canonical,
      HREFLANG_EN: hreflangEn,
      HREFLANG_AR: hreflangAr,
      FONTS_URL: fontsUrlFor(lang),
      EXTRA_CSS: extraCss,
      OG_LOCALE: lang === 'ar' ? 'ar_AR' : 'en_GB',
      OG_SITE_NAME: lang === 'ar' ? 'الكلية العالمية للغة الإنجليزية' : 'WorldWide English College',
    });
    const topbar = fill(partialFor('topbar', lang), {
      ALT_HREF: entry.altHref || '/',
    });
    const header = partialFor('header', lang);
    const footer = partialFor('footer', lang);
    const content = read(path.join(PAGES, entry.contentFile));
    const skipLabel = lang === 'ar' ? 'تخطَّ إلى المحتوى الرئيسي' : 'Skip to main content';
    // Per-page scripts, declared in the manifest. Opt-in rather than
    // loaded everywhere: js/portal-entry.js reaches for the auth
    // provider, and there is no reason for the tuition page to do that.
    // The leading newline is part of the value so a page that declares
    // none produces no blank line, and the built output of the other
    // thirty pages stays byte-identical.
    const extraScripts = (entry.scripts || [])
      .map((src) => `\n<script src="${src}"></script>`)
      .join('');

    const html = `<!DOCTYPE html>
<html lang="${lang}" dir="${dir}">
<head>
${head}
</head>
<body>
<a class="skip-link" href="#main">${skipLabel}</a>
${icons}
${topbar}
${header}
<main id="main">
${content}
</main>
${footer}
<script src="/js/site.js"></script>
<script src="/js/motion.js"></script>${extraScripts}
</body>
</html>
`;

    const outPath = path.join(ROOT, entry.output);
    fs.mkdirSync(path.dirname(outPath), { recursive: true });
    fs.writeFileSync(outPath, html);
    count++;
  });

  writeSitemap(manifest);
  console.log(`Built ${count} pages from pages/manifest.json`);
}

// ---------------------------------------------------------------------
// THE SITEMAP, WHICH WAS MAINTAINED BY HAND AND STOPPED BEING TRUE
//
// sitemap.xml listed 20 URLs while the manifest built 76 pages. Fifty-
// six published pages were unreachable to any crawler that trusted it —
// not broken, not slow, simply invisible, and nothing anywhere would
// ever have said so.
//
// That is the same failure this project keeps finding: a file that
// looks maintained, passes every test that exists, and quietly stopped
// describing reality. The fix is not to update it. The fix is to make
// it impossible for it to disagree with the manifest, by generating it
// from the manifest at the same moment the pages are written.
//
// 404 is excluded because a sitemap is a list of pages worth indexing
// and an error page is not one.
// ---------------------------------------------------------------------
function writeSitemap(manifest) {
  const indexable = manifest.filter((e) => !/(^|\/)404\.html$/.test(e.output));
  const urls = indexable
    .map((e) => SITE_URL + urlPathFor(e.output))
    // Longest-lived convention on this site: the English page and its
    // Arabic counterpart are separate URLs and both belong in the map.
    .sort((a, b) => a.localeCompare(b));

  const unique = [...new Set(urls)];
  if (unique.length !== urls.length) {
    throw new Error('Two manifest entries produce the same URL — the sitemap would list a duplicate.');
  }

  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<!-- Generated by scripts/build.js from pages/manifest.json. Do not edit:
     an edit here would be overwritten by the next build, and a
     hand-maintained sitemap is how this file came to list 20 of 76
     pages in the first place. -->
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${unique.map((u) => `  <url><loc>${u}</loc></url>`).join('\n')}
</urlset>
`;
  fs.writeFileSync(path.join(ROOT, 'sitemap.xml'), xml);
}

build();
