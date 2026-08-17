#!/usr/bin/env node
// =====================================================================
// AL-MADINAH INTERNATIONAL COLLEGE — site assembly
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
const OUT_DIR = 'madinah';

const SITE_URL = 'https://www.al-madinahcollege.com';

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
// TWO LANGUAGES, ONE MANIFEST
//
// The Arabic tree is NOT a second manifest. Every entry carries an `ar`
// block with its own title and description, and the build emits both
// trees from the one list — so a page cannot be added to the College in
// English and quietly not exist in Arabic. The build says so out loud
// when an `ar` block is missing rather than skipping it silently.
//
// Arabic content lives beside its English counterpart as `<name>.ar.html`
// and is AUTHORED, not translated: `charges.ar.html` is written in Arabic
// from the same institutional facts, which is why it is a file of its own
// rather than a string table.
// ---------------------------------------------------------------------
function arOutputFor(output) {
  return 'ar/' + output;
}

function arContentFileFor(contentFile) {
  return contentFile.replace(/\.html$/, '.ar.html');
}

// A partial may have an Arabic counterpart; where it does not, the
// English one is used. The chrome partials all have one — the RTL header
// and footer are not the LTR ones mirrored, they are authored.
function partialFor(name, lang) {
  const ar = path.join(PARTIALS, name + '.ar.html');
  if (lang === 'ar' && fs.existsSync(ar)) return read(ar);
  return read(path.join(PARTIALS, name + '.html'));
}

const SKIP_LABEL = { en: 'Skip to main content', ar: 'انتقل إلى المحتوى' };
const RAIL_LABEL = { en: 'On this page', ar: 'في هذه الصفحة' };

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
  /* WITHDRAWN. This produced a sticky strip pinned under the header that
     rode down the screen on every long page — a table of contents that
     refused to stay at the front of the book. The manifest's `contents`
     flags are left in place rather than stripped from sixteen entries,
     because the decision is about presentation and may be revisited; the
     rail is simply not built. See the note in css/rusukh.css. */
  return html;
  // eslint-disable-next-line no-unreachable
  if (!entry.contents) return html;
  const items = contentsEntries(html);
  // Under four sections a rail costs a band of chrome to save a scroll.
  if (items.length < 4) return html;

  const label = RAIL_LABEL[entry.lang || 'en'] || RAIL_LABEL.en;
  const rail = `<nav class="contents" aria-label="${label}">
  <div class="contents__inner">
    <span class="contents__label">${label}</span>
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


// ---------------------------------------------------------------------
// THE ORNAMENT PASS
//
// Four of the reference house's techniques — drifting motes on dark
// bands, laid grain on pale ones, letterpress on display type and a
// raking light across headings — are applied HERE rather than typed into
// twelve page files, for the same reason raiseMasthead is: the ornament
// is a property of the SHAPE of a section, not of its content, and a
// class typed into a page is a class the next author forgets.
//
// All four answer to [data-ornament] in css/rusukh.css, so a reader who
// turns ornament down or off is not fighting markup.
// ---------------------------------------------------------------------
function ornament(html) {
  return html
    // Dark bands carry the motes; pale bands carry the grain.
    .replace(/<section class="((?:page-hero )?section--dark section-pad)"/g,
             '<section class="$1 motes"')
    .replace(/<section class="(section--light section-pad)"/g,
             '<section class="$1 grain"')
    // The masthead headline is struck into the ground, and takes the rake.
    // Two shapes qualify: the inner-page .page-hero, and the home page's
    // own .r-hero — which is why this is not one selector.
    .replace(/(<section class="(?:page-hero|r-hero)[^"]*"[^>]*>[\s\S]{0,600}?)<h1>/,
             '$1<h1 class="letterpress rake">')
    // Section headings take the rake only; letterpress on a light ground
    // would be a shadow with nothing to sit against.
    .replace(/<h2>/g, '<h2 class="rake">');
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

  // Each manifest entry produces TWO pages. The Arabic entry is derived
  // rather than authored so the two trees cannot drift: same slug, same
  // nav key, same section anchors, same extra CSS and scripts.
  const routes = [];
  manifest.forEach((entry) => {
    routes.push(Object.assign({}, entry, { lang: 'en' }));
    if (!entry.ar) {
      console.warn(`  ! ${entry.slug}: no "ar" block in the manifest — Arabic page not built`);
      return;
    }
    const arContent = path.join(PAGES, arContentFileFor(entry.contentFile));
    if (!fs.existsSync(arContent)) {
      console.warn(`  ! ${entry.slug}: ${arContentFileFor(entry.contentFile)} missing — Arabic page not built`);
      return;
    }
    routes.push(Object.assign({}, entry, {
      lang: 'ar',
      output: arOutputFor(entry.output),
      contentFile: arContentFileFor(entry.contentFile),
      title: entry.ar.title,
      description: entry.ar.description,
    }));
  });

  // An Arabic page linking to /madinah/regulations/ would throw the reader
  // back into English mid-sentence. Rewritten at assembly rather than typed
  // into every Arabic file, so an author cannot forget the prefix and cannot
  // get it wrong on one link out of two hundred.
  //
  // Twice now this has been the source of a silent, total failure, so both
  // lessons are recorded here rather than rediscovered a third time
  // (EB §13.2.11):
  //
  //   1. The pattern is BUILT FROM OUT_DIR. It used to be written out as a
  //      literal /rusukh/, and the rename to /madinah/ left it matching
  //      nothing at all.
  //   2. It is applied to the CHROME as well as the content. The header and
  //      footer carry 117 of the site's Arabic links between them — every
  //      mega-menu row and every footer register — and rewriting only the
  //      page body left the entire navigation of the Arabic tree pointing
  //      into English.
  //
  // The negative lookahead leaves an already-correct /madinah/ar/ link
  // alone, and the language switch is safe because it travels as the
  // {{ALT_HREF}} token and is substituted after this runs.
  function arLinks(html) {
    return html.replace(
      new RegExp('href="/' + OUT_DIR + '/(?!ar/)', 'g'),
      'href="/' + OUT_DIR + '/ar/'
    );
  }

  routes.forEach((entry) => {
    const lang = entry.lang || 'en';
    const chrome = (name) => {
      const src = partialFor(name, lang).trimEnd();
      return lang === 'ar' ? arLinks(src) : src;
    };
    const canonical = SITE_URL + urlPathFor(entry.output);
    // The switch and the hreflang pair are two different questions with
    // the same answer here: the other tree's URL for THIS page.
    const altOutput = lang === 'ar'
      ? entry.output.replace(/^ar\//, '')
      : arOutputFor(entry.output);
    const altHref = urlPathFor(altOutput);
    const altUrl = SITE_URL + altHref;
    const hasAlt = entry.ar || lang === 'ar';
    const alternates = hasAlt
      ? [
          `<link rel="alternate" hreflang="en" href="${lang === 'en' ? canonical : altUrl}">`,
          `<link rel="alternate" hreflang="ar" href="${lang === 'ar' ? canonical : altUrl}">`,
          `<link rel="alternate" hreflang="x-default" href="${lang === 'en' ? canonical : altUrl}">`,
        ].join('\n')
      : '';
    if (seen.has(canonical)) {
      throw new Error(`Two manifest entries produce the same URL — ${canonical}`);
    }
    seen.add(canonical);

    const contentPath = path.join(PAGES, entry.contentFile);
    if (!fs.existsSync(contentPath)) {
      throw new Error(`${entry.slug}: content file not found — ${entry.contentFile}`);
    }

    const head = fill(partialFor('head', lang), {
      TITLE: entry.title,
      DESCRIPTION: entry.description,
      CANONICAL: canonical,
      FONTS_URL,
      BUILD_ID,
      OG_LOCALE: lang === 'ar' ? 'ar_AR' : 'en_GB',
      ALTERNATES: alternates,
      // css/arabic.css is the type layer for the script — it undoes the
      // Latin tracking and leading that every earlier stylesheet sets, so
      // it must load LAST, after the house layer and after any page CSS.
      EXTRA_CSS: (entry.extraCss || [])
        .map((h) => `\n<link rel="stylesheet" href="${h}">`)
        .join('') + (lang === 'ar' ? '\n<link rel="stylesheet" href="/css/arabic.css">' : ''),
    });

    let content = withContentsRail(
      ornament(raiseMasthead(read(contentPath))),
      entry
    );

    if (lang === 'ar') content = arLinks(content);

    const html = `<!DOCTYPE html>
<html lang="${lang}" dir="${lang === 'ar' ? 'rtl' : 'ltr'}">
<head>
${head}
</head>
<body data-section="${entry.nav || 'root'}" data-lang="${lang}">
<a class="skip-link" href="#main">${SKIP_LABEL[lang] || SKIP_LABEL.en}</a>
${icons}
${fill(chrome('topbar'), { ALT_HREF: altHref })}
${markCurrentNav(fill(chrome('header'), { ALT_HREF: altHref }), entry.nav)}
<main id="main">
${content}
</main>
${fill(chrome('footer'), { ALT_HREF: altHref })}
${chrome('dock')}
<script src="/js/site.js"></script>
<script src="/js/motion.js"></script>
<script src="/js/atelier.js" defer></script>
<script src="/js/rusukh-clock.js" defer></script>
<script src="/js/rusukh-atelier.js" defer></script>
<script src="/js/rusukh-dock.js" defer></script>${(entry.scripts || []).map(function (src) { return '\n<script src="' + src + '" defer></script>'; }).join('')}
</body>
</html>
`;

    const outPath = path.join(ROOT, OUT_DIR, entry.output);
    fs.mkdirSync(path.dirname(outPath), { recursive: true });
    fs.writeFileSync(outPath, html);
    count++;
  });

  writeSitemap(routes);
  console.log(`Al-Madinah International College — built ${count} pages into ${OUT_DIR}/`);
}

function writeSitemap(routes) {
  const urls = [
    ...new Set(
      routes
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
