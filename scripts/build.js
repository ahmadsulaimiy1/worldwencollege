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

function build() {
  const manifest = JSON.parse(read(path.join(PAGES, 'manifest.json')));
  let count = 0;

  manifest.forEach((entry) => {
    const lang = entry.lang || 'en';
    const dir = entry.dir || 'ltr';

    const head = fill(partialFor('head', lang), {
      TITLE: entry.title,
      DESCRIPTION: entry.description,
    });
    const topbar = fill(partialFor('topbar', lang), {
      ALT_HREF: entry.altHref || '/',
    });
    const header = partialFor('header', lang);
    const footer = partialFor('footer', lang);
    const content = read(path.join(PAGES, entry.contentFile));

    const html = `<!DOCTYPE html>
<html lang="${lang}" dir="${dir}">
<head>
${head}
</head>
<body>
${topbar}
${header}
<main>
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
