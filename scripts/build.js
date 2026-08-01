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

  manifest.forEach((entry) => {
    const lang = entry.lang || 'en';
    const dir = entry.dir || 'ltr';
    const canonical = SITE_URL + urlPathFor(entry.output);
    const altUrl = SITE_URL + (entry.altHref || '/');
    const hreflangEn = lang === 'en' ? canonical : altUrl;
    const hreflangAr = lang === 'ar' ? canonical : altUrl;

    const head = fill(partialFor('head', lang), {
      TITLE: entry.title,
      DESCRIPTION: entry.description,
      CANONICAL: canonical,
      HREFLANG_EN: hreflangEn,
      HREFLANG_AR: hreflangAr,
      FONTS_URL: fontsUrlFor(lang),
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

    const html = `<!DOCTYPE html>
<html lang="${lang}" dir="${dir}">
<head>
${head}
</head>
<body>
<a class="skip-link" href="#main">${skipLabel}</a>
${topbar}
${header}
<main id="main">
${content}
</main>
${footer}
<script src="/js/site.js"></script>
</body>
</html>
`;

    const outPath = path.join(ROOT, entry.output);
    fs.mkdirSync(path.dirname(outPath), { recursive: true });
    fs.writeFileSync(outPath, html);
    count++;
  });

  console.log(`Built ${count} pages from pages/manifest.json`);
}

build();
