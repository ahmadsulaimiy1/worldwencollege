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

// ---------------------------------------------------------------------
// THE MASTHEAD, APPLIED AT ASSEMBLY RATHER THAN IN THE SOURCE
//
// Every page but the homepage opens with the same shape: an eyebrow, an
// h1 and a lede inside `<section class="section--dark section-pad">`.
// css/pages.css turns that shape into a masthead — but only if the
// section carries the .page-hero class.
//
// That class was first added by editing the 84 files in pages/ directly,
// and that was wrong in a way nothing would have reported. Most of those
// files are OUTPUT: scripts/build-students.js, build-about.js,
// build-press.js, build-arabic.js and the rest generate them. Running
// any one of those generators silently stripped the class back out, the
// build still succeeded, every test still passed, and the page quietly
// lost its masthead.
//
// So the transform belongs here, at the moment the page is assembled. It
// then holds no matter which generator wrote the source, and it applies
// to pages nobody has written yet without anyone remembering to opt in.
//
// Pages whose opening section is not that shape — the homepage, with its
// own bespoke hero, and the two portal pages — are returned untouched.
// ---------------------------------------------------------------------
const MASTHEAD_OPENING = /^(\s*)<section class="section--dark section-pad"/;

function raiseMasthead(html) {
  if (!MASTHEAD_OPENING.test(html)) return html;
  return html
    .replace(MASTHEAD_OPENING, '$1<section class="page-hero section--dark section-pad"')
    // The first h1 on the page is the masthead's, and it takes the same
    // split-text rise the homepage headline does. Guarded so a source
    // file that already declares it is not given it twice.
    .replace(/<h1(?![^>]*\bdata-split\b)/, '<h1 data-split');
}

// ---------------------------------------------------------------------
// THE CONTENTS RAIL
//
// The architecture in docs/information-architecture.html collapses
// thirty-three routes into deep-linked sections of six pillar pages.
// That trade only works if arriving at an anchor lands somewhere that
// looks like a destination — a reader who clicks "Educational
// Philosophy" in the menu and finds themselves mid-scroll in an
// undifferentiated wall has been given something worse than the thin
// page they had before.
//
// So a flagship page carries a rail: where you are, what else is here,
// one click away. It is generated HERE rather than written into each
// page for the same reason raiseMasthead is — most of pages/ is output,
// and a rail typed into a generated file is stripped out the next time
// its generator runs.
//
// Built from the page's own sections, so it cannot describe a page that
// no longer exists. `data-contents` on a section supplies the rail's
// label; the h2 supplies a fallback with its full stop trimmed, because
// this site writes headings as sentences ("What this level contains.")
// and a rail of sentences is not a rail. tests/contents-rail.test.mjs
// fails on a section that has an id and a heading but no rail entry, so
// a new section cannot quietly drop out of it.
// ---------------------------------------------------------------------
const RAIL_LABEL = { en: 'On this page', ar: 'في هذه الصفحة' };

function contentsEntries(html) {
  const out = [];
  const open = /<section\b([^>]*)>/g;
  let m;
  while ((m = open.exec(html))) {
    const attrs = m[1];
    const id = (attrs.match(/\bid="([^"]+)"/) || [])[1];
    if (!id) continue;
    // The masthead is where the reader already is; listing it is noise.
    if (/\bpage-hero\b/.test(attrs)) continue;
    const explicit = (attrs.match(/\bdata-contents="([^"]+)"/) || [])[1];
    const rest = html.slice(m.index, html.indexOf('</section>', m.index));
    // THE MODULE MARKER IS ALREADY THE SECTION'S SHORT NAME.
    // Every section on this site opens with one — "Overview", "Modules",
    // "Learning Outcomes", "The Award" — sitting above a heading written
    // as a full sentence. The marker is what a rail wants and it is
    // already authored, already translated, and already the thing the
    // reader sees at the top of the section they land in. Preferring it
    // means the rail needs no second set of labels to fall out of step
    // with the first.
    const marker = (rest.match(/<span class="module-marker"[^>]*>([\s\S]*?)<\/span>/) || [])[1];
    const h2 = (rest.match(/<h2[^>]*>([\s\S]*?)<\/h2>/) || [])[1];
    const src = explicit || marker || h2;
    if (!src) continue;
    const label = src
      .replace(/<[^>]+>/g, '')
      .replace(/&amp;/g, '&').replace(/&middot;/g, '·').replace(/&mdash;/g, '—')
      .replace(/\s+/g, ' ')
      .trim()
      .replace(/[.。]$/, '');
    if (label) out.push({ id, label });
  }
  return out;
}

function withContentsRail(html, entry, lang) {
  if (!entry.contents) return html;
  const items = contentsEntries(html);
  // Under four sections a rail is furniture: it costs a band of chrome
  // to save a reader a scroll they were going to do anyway.
  if (items.length < 4) return html;

  const rail = `<nav class="contents" aria-label="${RAIL_LABEL[lang] || RAIL_LABEL.en}">
  <div class="contents__inner">
    <span class="contents__label">${RAIL_LABEL[lang] || RAIL_LABEL.en}</span>
    <ul class="contents__list">
${items.map((i) => `      <li><a href="#${i.id}">${i.label}</a></li>`).join('\n')}
    </ul>
  </div>
</nav>
`;

  // Directly after the masthead. Placed by structure rather than by a
  // marker in the source: every flagship opens with its hero, and a
  // marker is one more thing a generator can forget.
  const close = html.indexOf('</section>');
  if (close === -1) return rail + html;
  const at = close + '</section>'.length;
  return html.slice(0, at) + '\n\n' + rail + html.slice(at);
}

// ---------------------------------------------------------------------
// INLINE SVG INCLUDES  —  {{SVG:assets/art/whatever.svg}}
//
// The living diagrams (docs/digital-institution-masterplan.md, Layer 3)
// have to be inline SVG, not <img>: js/atelier.js animates their
// internals, and nothing can reach inside an <img>. But pasting a
// generated 18 KB drawing into a page file makes the page the source of
// truth for something a script generates, and the two drift the moment
// anyone regenerates.
//
// So the page references the file and the build inlines it. Regenerate
// the art, rebuild, and every page carrying it is current.
//
// Paths are resolved from the repository root and confined to it: a
// content file cannot reach outside the project with `../`.
// ---------------------------------------------------------------------
function inlineSvgIncludes(html, contentFile) {
  return html.replace(/\{\{SVG:([^}]+)\}\}/g, (_, rel) => {
    const target = path.resolve(ROOT, rel.trim());
    if (!target.startsWith(ROOT + path.sep)) {
      throw new Error(`${contentFile}: SVG include escapes the repository — ${rel}`);
    }
    if (!fs.existsSync(target)) {
      throw new Error(`${contentFile}: SVG include not found — ${rel}`);
    }
    // Strip the XML prolog: it is only legal at the very start of a
    // document, and this is being spliced into the middle of one.
    return read(target).replace(/^<\?xml[^?]*\?>\s*/, '').trimEnd();
  });
}

// ---------------------------------------------------------------------
// THE RECORD OF STANDING  —  {{S:KEY}}, {{N:key}}, {{V:key}}
//
// data/standing.json is the only place the College's own figures live:
// how many cohorts have been taught, how many students completed a
// level, how many awards were conferred. Before it existed those facts
// were typed into the copy of 56 pages in two languages, which meant
// they could not be corrected — only re-typed, 56 times, with the
// Arabic edition drifting from the English on the first mistake.
//
// Three tokens read it:
//
//   {{S:COHORTS_TAUGHT}}   a sentence, in the page's own language
//   {{N:completed_level_1}} the count and a space — or NOTHING at all
//   {{V:cohorts.run}}      a raw value, spelled where a numeral is wanted
//
// {{N:…}} is the important one, and its emptiness is the whole design.
// A count the College has not released for publication is null, and a
// null renders as the empty string, so
//
//   <p>{{N:completed_level_1}}{{S:COMPLETED_1}} sat the Level II paper.</p>
//
// publishes "students who have completed Level I sat the Level II
// paper" today, and "31 students who have completed Level I sat the
// Level II paper" the moment somebody puts 31 in the record. The
// sentence is true in both states and needs no rewriting between them.
// Every prose string is therefore written to begin with its noun.
//
// tests/published-claims.test.mjs enforces the other half: a numeral
// standing next to a cohort or award claim that this file did not
// supply fails the build. A figure cannot reach the site by being typed
// confidently into a paragraph.
// ---------------------------------------------------------------------
const STANDING = JSON.parse(read(path.join(ROOT, 'data', 'standing.json')));

function standingValue(dotted) {
  return dotted.split('.').reduce((o, k) => (o == null ? o : o[k]), STANDING);
}

function fillStanding(html, lang, contentFile) {
  const prose = STANDING.prose[lang === 'ar' ? 'ar' : 'en'];
  return html
    .replace(/\{\{S:([A-Z0-9_]+)\}\}/g, (_, key) => {
      if (!(key in prose)) {
        throw new Error(`${contentFile}: no standing prose named ${key} for ${lang}`);
      }
      return prose[key];
    })
    .replace(/\{\{N:([a-z0-9_]+)\}\}/g, (_, key) => {
      if (!(key in STANDING.counts)) {
        throw new Error(`${contentFile}: no standing count named ${key}`);
      }
      const n = STANDING.counts[key];
      // Not released is not zero. It renders as nothing, and the
      // sentence carries on without it.
      return n == null ? '' : `${n}&nbsp;`;
    })
    .replace(/\{\{V:([a-z0-9_.]+)\}\}/g, (_, key) => {
      const v = standingValue(key);
      if (v == null) throw new Error(`${contentFile}: standing value ${key} is unset`);
      return String(v);
    });
}

function partialFor(name, lang) {
  const arPath = path.join(PARTIALS, `${name}.ar.html`);
  if (lang === 'ar' && fs.existsSync(arPath)) return read(arPath);
  return read(path.join(PARTIALS, `${name}.html`));
}

const SITE_URL = 'https://www.worldwencollege.co.uk';

// THE TYPE SYSTEM, AS REQUESTED FROM THE FOUNDRY.
//
// Three Latin families, each with one job, plus two Arabic families.
//
//   EB Garamond  — the display face. An old-style serif, requested
//                  VARIABLE on weight (`wght 400..800`) with a matching
//                  italic.
//
//                  IT REPLACED BODONI MODA, and the reasoning is worth
//                  keeping because it inverts the reasoning that put
//                  Bodoni here. Bodoni is a Didone: enormous stroke
//                  contrast, flat unbracketed serifs. That is what made
//                  it magnificent at 64px and illegible at 15px, and it
//                  was carried on the optical-size axis (`opsz 6..96`)
//                  precisely to rescue it — the browser interpolating a
//                  sturdier cut as the type got smaller. It worked, and
//                  it was still a face whose headings read as fashion
//                  rather than as an institution, at every size.
//
//                  EB Garamond needs no such rescue. Its contrast is
//                  moderate everywhere, so it is legible at 15px and
//                  dignified at 64px without an axis mediating between
//                  the two — which is the same property that makes it
//                  easier to read. It therefore carries NO opsz axis
//                  (Google returns 400 for the request), and
//                  `font-optical-sizing: auto` in css/ is now a no-op
//                  rather than load-bearing. Do not add an opsz range
//                  to this family; it does not have one.
//   Cinzel       — ceremonial capitals only. Inscriptional Roman letter-
//                  forms (the Trajan lineage): the crest lockup, chapter
//                  numerals, CEFR marks, seals. Rationed hard — it is
//                  used for perhaps forty characters on a page.
//   Inter        — everything that is read rather than admired: body,
//                  UI, labels, tables, forms.
//
// Weights are the ones actually set in css/ — headings run to 700 and
// the display sizes sit at 500-600, so the roman range covers 400..700;
// the italic is used for pull quotes and typed lines and never above
// 600. Cinzel asks for two weights because it appears at two sizes and
// nowhere else.
const LATIN_FONTS = 'family=EB+Garamond:ital,wght@0,400..700;1,400..600'
  + '&family=Cinzel:wght@500;600'
  + '&family=Inter:wght@400;600;700;800';
const ARABIC_FONTS = '&family=Amiri:wght@400;700&family=Cairo:wght@400;600;700';

// English pages never render Arabic script — skip Amiri/Cairo entirely
// rather than paying for two unused font families on every EN page load.
// Arabic pages still need the Latin families too, for embedded Latin
// runs (IEFC, CEFR codes, emails) wrapped in dir="ltr" spans.
function fontsUrlFor(lang) {
  const families = lang === 'ar' ? LATIN_FONTS + ARABIC_FONTS : LATIN_FONTS;
  return `https://fonts.googleapis.com/css2?${families}&display=swap`;
}

// THE ONE ARABIC WORD ON EVERY ENGLISH PAGE.
//
// Skipping Amiri and Cairo on English pages is right — an English page
// renders no Arabic and should not pay for two families it never uses.
// Except that it does render Arabic: the language switch in the topbar
// reads العربية on all 101 English routes, and css/arabic.css sets it
// in Cairo. With Cairo not loaded there, that word fell through to
// whatever Naskh the visitor's operating system happened to have, so
// the single most identity-bearing word for the primary audience
// rendered differently on every machine and identically on none.
//
// The fix is a TEXT SUBSET, not the family. Google Fonts' `text=`
// parameter returns a face containing only the glyphs asked for, so
// this costs a few hundred bytes instead of ~40KB. It must be its own
// request: `text=` applies to every family in the URL it appears in,
// so folding it into the main one would subset EB Garamond and Inter to
// six Arabic characters and leave the page with no Latin text at all.
//
// Arabic pages get nothing here — they already load Cairo in full.
const AR_SWITCH = encodeURIComponent('العربية');
function fontSubsetUrlFor(lang) {
  if (lang === 'ar') return '';
  return `\n<link href="https://fonts.googleapis.com/css2?family=Cairo:wght@600`
    + `&text=${AR_SWITCH}&display=swap" rel="stylesheet">`;
}

// "about/index.html" -> "/about/"; "index.html" -> "/"
function urlPathFor(outputPath) {
  const trimmed = outputPath.replace(/index\.html$/, '');
  return '/' + trimmed;
}

// The commit this build came from — but ONLY when a release build is
// producing it. In CI, GITHUB_SHA; everywhere else, empty.
//
// The first version read `git rev-parse HEAD` as a local fallback, and
// that was wrong in a way worth recording. The stamp is a function of
// the commit, so every local rebuild after every commit rewrote the
// stamp on all 64 pages — sixty-six modified files of pure churn,
// forever, on a repository whose built output is committed. The signal
// the stamp exists to carry was drowning in the noise of carrying it.
//
// Empty locally is not a loss: the stamp exists to let the DEPLOY prove
// itself against the live domain, and the deploy job builds immediately
// before publishing with GITHUB_SHA set. Committed output therefore
// holds a stable empty stamp, and the only build that ever writes a
// real one is the build that is about to be served.
const BUILD_ID = (process.env.GITHUB_SHA || '').slice(0, 12);

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

    // THE OTHER LANGUAGE, and where to send someone who asks for it.
    //
    // `altHref` names a page's genuine counterpart. Forty of the ninety
    // entries do not have one yet, and the fallback for those was `/` —
    // so on every one of them the topbar's العربية sent an Arabic
    // reader to the ENGLISH homepage. A language switch that returns
    // you to the language you are already reading is worse than no
    // switch: it looks like the Arabic edition is broken rather than
    // absent. The fallback now depends on which language is asking, and
    // lands on that language's front door.
    const altHref = entry.altHref || (lang === 'ar' ? '/' : '/ar/');
    const altUrl = SITE_URL + altHref;

    // hreflang is a different question from the switch, and it was
    // being answered with the same value. `alternate hreflang="ar"`
    // asserts to a search engine that a given URL IS this page in
    // Arabic. Pointing /study/level-1/ at the Arabic homepage does not
    // degrade gracefully — it states something untrue, and the front
    // door is not a translation of the Level I syllabus. A page with no
    // counterpart therefore declares no alternate at all.
    const hasCounterpart = Boolean(entry.altHref);
    const hreflangEn = lang === 'en' ? canonical : altUrl;
    const hreflangAr = lang === 'ar' ? canonical : altUrl;
    // x-default names the page to send a reader whose language we do
    // not serve. That is the English edition where one exists, and this
    // page otherwise.
    const alternates = (hasCounterpart
      ? [['en', hreflangEn], ['ar', hreflangAr], ['x-default', hreflangEn]]
      : [[lang, canonical], ['x-default', lang === 'en' ? canonical : SITE_URL + '/']]
    ).map(([hl, href]) => `<link rel="alternate" hreflang="${hl}" href="${href}">`).join('\n');

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
      ALTERNATES: alternates,
      FONTS_URL: fontsUrlFor(lang),
      FONTS_SUBSET: fontSubsetUrlFor(lang),
      BUILD_ID,
      EXTRA_CSS: extraCss,
      OG_LOCALE: lang === 'ar' ? 'ar_AR' : 'en_GB',
      OG_SITE_NAME: lang === 'ar' ? 'الكلية العالمية للغة الإنجليزية' : 'WorldWide English College',
    });
    const topbar = fill(partialFor('topbar', lang), { ALT_HREF: altHref });
    // The mobile drawer and the footer each carry their own language
    // switch now, so they need the same per-page ALT_HREF the topbar's
    // gets — the page-specific Arabic/English twin, not a blanket link
    // to the other language's front door.
    const header = fill(partialFor('header', lang), { ALT_HREF: altHref });
    const footer = fill(partialFor('footer', lang), { ALT_HREF: altHref });
    const content = withContentsRail(
      raiseMasthead(
        fillStanding(
          inlineSvgIncludes(read(path.join(PAGES, entry.contentFile)), entry.contentFile),
          lang, entry.contentFile
        )
      ),
      entry, lang
    );
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

    // THE SECTION A PAGE BELONGS TO.
    //
    // Derived from the output path rather than declared per entry, so a
    // new page cannot be added to a cluster and forget to say so. The
    // Arabic mirror resolves to the same section as its English
    // counterpart — /ar/admissions/ is Admissions, not "ar".
    //
    // css/pages.css keys each cluster's hero accent off this, which is
    // what gives every major page its own opening while keeping one
    // component. Everything else on the site ignores it.
    const sectionOf = (output) => {
      const parts = output.replace(/^ar\//, '').split('/');
      return parts.length > 1 ? parts[0] : 'root';
    };

    const html = `<!DOCTYPE html>
<html lang="${lang}" dir="${dir}">
<head>
${head}
</head>
<body data-section="${sectionOf(entry.output)}">
<a class="skip-link" href="#main">${skipLabel}</a>
${icons}
${topbar}
${header}
<main id="main">
${content}
</main>
${footer}
<script src="/js/site.js"></script>
<script src="/js/motion.js"></script>
<script src="/js/atelier.js" defer></script>
<script src="/js/worldclock.js" defer></script>
<script src="/js/sonics.js" defer></script>${extraScripts}
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
