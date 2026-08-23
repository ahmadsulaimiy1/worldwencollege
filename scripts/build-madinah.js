#!/usr/bin/env node
// =====================================================================
// AL-MADINAH INTERNATIONAL COLLEGE — site assembly
//
// A sibling of scripts/build.js, deliberately kept separate rather than
// folded into it. The two sites share a design system (css/brand.css)
// and nothing else: different institution, different chrome, different
// manifest, different output tree. Merging them would mean every WEC-LC
// build touching this College's pages and vice versa, which is exactly
// the coupling that makes a shared generator dangerous. WEC-LC is now
// archived, and this generator is the only one that writes the site.
//
// Source:  madinah-src/{pages,partials}/  + madinah-src/manifest.json
// Output:  ./**/index.html — the College is the site root. The WEC-LC build
//          this file used to sit beside is archived under archive/wec-lc/.
//
// No dependencies — Node's built-in fs/path only.
// =====================================================================

const fs = require('fs');
const path = require('path');

const ROOT = path.resolve(__dirname, '..');
const SRC = path.join(ROOT, 'madinah-src');
const PAGES = path.join(SRC, 'pages');
const PARTIALS = path.join(SRC, 'partials');
// The College is the site. It was built into a `madinah/` subfolder while the
// domain still served WorldWide English College at the root; that build is now
// archived under archive/wec-lc/ and these pages are the root. `_redirects`
// keeps every /madinah/... URL alive as a 301 so nothing already shared breaks.

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

// "about/index.html" -> "/about/";  "index.html" -> "/"
function urlPathFor(output) {
  return '/' + output.replace(/index\.html$/, '');
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
// lede inside a dark section. css/madinah.css turns that into a masthead
// only when the section carries .page-hero, and the class is applied
// here at assembly rather than typed into each source file, for the
// reason build.js documents at length: a class typed into a generated
// file is stripped the next time its generator runs.
// ---------------------------------------------------------------------
const MASTHEAD_OPENING = /^(\s*)<section class="section--dark section-pad"/;

// ---------------------------------------------------------------------
// PHOTOGRAPHS
//
// A page asks for a photograph with a token:
//
//     {{PHOTO:study-01|4x5|A reading room in Lagos, 1447.}}
//              file     ratio  caption
//
// and the build emits the full figure ONLY IF THE FILE EXISTS on disk. If
// it does not, the token resolves to nothing at all — no <img>, no broken
// icon, no reserved gap, no console 404.
//
// That check is the whole point of doing this at build time rather than in
// CSS. `:has()` can collapse a figure with no <img> inside it, but it
// cannot help once an <img> is present with a src that 404s: the browser
// has already requested it, logged it, and drawn the broken-image glyph.
// The generator knows what is on disk; the stylesheet never can.
//
// So the slots can be written into the pages NOW, before a single
// photograph exists, and the pages stay correct in the meantime. Drop a
// file into assets/photography/ with the right name, run the build, and it
// appears — treated, art-directed and lazy-loaded — with no edit to any
// page.
// ---------------------------------------------------------------------
const PHOTO_DIR = path.join(ROOT, 'assets', 'photography');
const PHOTO_EXT = ['.jpg', '.jpeg', '.webp', '.avif', '.png'];

function photoFile(name) {
  for (const ext of PHOTO_EXT) {
    if (fs.existsSync(path.join(PHOTO_DIR, name + ext))) return '/assets/photography/' + name + ext;
  }
  return null;
}

let photoMissing = new Set();

// A photograph is cropped to the page's ratio, and `object-fit: cover` crops
// from the CENTRE. That is the wrong default for most of these: a majlis has
// its people along the top and half a room of carpet below, and a portrait of
// someone winding a ghutrah has the whole subject in the upper third. Cropped
// centrally, both lost their subject and kept the floor.
//
// So the ratio field takes an optional focal point after an `@`:
//
//     {{PHOTO:majlis-02|3x2@top|…}}      keep the top edge
//     {{PHOTO:x|4x5@30-20|…}}            or a precise point, x-y in percent
//
// Without one the behaviour is exactly as before, so every slot written
// before this stays valid and unchanged.
const FOCAL = {
  top: '50% 0%', bottom: '50% 100%', left: '0% 50%', right: '100% 50%',
  'top-left': '0% 0%', 'top-right': '100% 0%',
  'bottom-left': '0% 100%', 'bottom-right': '100% 100%', center: '50% 50%',
};
function focalFor(spec) {
  if (!spec) return null;
  if (FOCAL[spec]) return FOCAL[spec];
  const pair = /^(\d{1,3})-(\d{1,3})$/.exec(spec);
  if (pair && +pair[1] <= 100 && +pair[2] <= 100) return pair[1] + '% ' + pair[2] + '%';
  throw new Error('PHOTO: unknown focal point "' + spec + '"');
}
// ---------------------------------------------------------------------
// SELECT LISTS, BUILT IN RATHER THAN FETCHED
//
// The Founder's instruction on the application: a reader should SELECT
// from what is relevant, not be told to type it. Two lists follow from
// that — every country in the world, and the states of Nigeria — and both
// are written into the markup at build time rather than fetched at
// runtime. Three reasons, in order of weight:
//
//   · a form that needs a network request before it can be filled in is a
//     form that fails on a bad connection, which is a great many of the
//     students this College exists for;
//   · it works with JavaScript disabled;
//   · and the option list is then in the page a search engine and a
//     screen reader both read, rather than assembled after the fact.
//
// THE COUNTRIES ARE NOT MY LIST. They are enumerated from ICU — every
// ISO 3166-1 alpha-2 code the platform recognises, named in English and
// in Arabic by the same authority — with the thirteen exceptionally
// reserved and user-assigned codes removed, because the European Union
// and Diego Garcia are not nationalities. 267 remain.
// ---------------------------------------------------------------------
const COUNTRIES = JSON.parse(fs.readFileSync(path.join(SRC, 'data', 'countries.json'), 'utf8'));
const NG_STATES = JSON.parse(fs.readFileSync(path.join(SRC, 'data', 'nigeria-states.json'), 'utf8'));

// ---------------------------------------------------------------------
// THE APPLICATION, RENDERED FROM ONE SPEC INTO BOTH TREES
//
// Ten steps and fifty-six fields, authored once in
// madinah-src/data/application.json with an `en` and an `ar` on every
// label, hint and option. The two trees are GENERATED from it, which is
// the only arrangement under which they cannot drift: a field added in
// English is a field added in Arabic, and a label that has no Arabic is
// a build-time failure rather than a page a reader meets in the wrong
// language.
//
// The alternative — two hand-written forms — was tried on this site at
// smaller scale and produced exactly what the grid audit later found:
// an Arabic page missing a fallback the English one had, and two ledes
// telling readers different things.
// ---------------------------------------------------------------------
const APPLICATION = JSON.parse(fs.readFileSync(path.join(SRC, 'data', 'application.json'), 'utf8'));

const AR_DIGITS = ['٠','١','٢','٣','٤','٥','٦','٧','٨','٩'];
function num(n, lang) {
  return lang === 'ar' ? String(n).replace(/[0-9]/g, (d) => AR_DIGITS[+d]) : String(n);
}

function L(row, lang) { return lang === 'ar' ? (row.ar || row.en) : row.en; }

function fieldHtml(f, lang) {
  const label = L(f, lang);
  const req = f.req ? ' <span class="apply__req" aria-hidden="true">*</span>' : '';
  const reqAttr = f.req ? ' required' : '';
  const ac = f.ac ? ' autocomplete="' + f.ac + '"' : '';
  const hint = f.hint
    ? '\n          <p class="form-note">' + (lang === 'ar' ? (f.hintAr || f.hint) : f.hint) + '</p>'
    : '';
  let control;
  if (f.type === 'select') {
    const opts = (f.opts || []).map((o) =>
      '<option value="' + o.v + '">' + L(o, lang) + '</option>').join('\n            ');
    control = '<select id="f-' + f.id + '" data-label="' + label + '"' + reqAttr + '>\n'
      + '            <option value="">&mdash;</option>\n            ' + opts + '\n          </select>';
  } else if (f.type === 'country') {
    control = '<select id="f-' + f.id + '" data-label="' + label + '"' + reqAttr + ac + '>\n'
      + '            <option value="">&mdash;</option>\n              {{COUNTRY_OPTIONS}}\n          </select>';
  } else if (f.type === 'ngstate') {
    control = '<select id="f-' + f.id + '" data-label="' + label + '"' + reqAttr + '>\n'
      + '            <option value="">&mdash;</option>\n              {{NG_STATE_OPTIONS}}\n          </select>';
  } else if (f.type === 'textarea') {
    control = '<textarea id="f-' + f.id + '" data-label="' + label + '" rows="4"' + reqAttr + '></textarea>';
  } else {
    control = '<input id="f-' + f.id + '" data-label="' + label + '" type="' + f.type + '"' + reqAttr + ac + '>';
  }
  return '        <div class="field' + (f.full ? ' field--full' : '') + '">\n'
    + '          <label for="f-' + f.id + '">' + label + req + '</label>\n'
    + '          ' + control + hint + '\n        </div>';
}

function applicationHtml(lang) {
  const steps = APPLICATION.steps;
  const total = steps.length + 1;   // + declarations and review

  const ledger = steps.map((st, i) =>
    '        <li class="apply__ledger-row" data-ledger="' + st.id + '">'
    + '<span class="apply__ledger-n">' + num(i + 1, lang) + '</span>'
    + '<span class="apply__ledger-t">' + L(st, lang) + '</span></li>'
  ).concat([
    '        <li class="apply__ledger-row" data-ledger="declare">'
    + '<span class="apply__ledger-n">' + num(total, lang) + '</span>'
    + '<span class="apply__ledger-t">'
    + (lang === 'ar' ? 'الإقرار والمراجعة' : 'Declarations and review')
    + '</span></li>'
  ]).join('\n');

  const panels = steps.map((st, i) => {
    const note = (lang === 'ar' ? st.noteAr : st.noteEn);
    return '      <fieldset class="apply__step" data-step="' + st.id + '" hidden>\n'
      + '        <legend class="apply__legend">'
      + '<span class="apply__legend-n">' + (lang === 'ar' ? 'الخطوة ' : 'Step ') + num(i + 1, lang)
      + (lang === 'ar' ? ' من ' : ' of ') + num(total, lang) + '</span>'
      + '<span class="apply__legend-t">' + L(st, lang) + '</span></legend>\n'
      + (note ? '        <p class="apply__note">' + note + '</p>\n' : '')
      + '        <div class="form-grid">\n'
      + st.fields.map((f) => fieldHtml(f, lang)).join('\n') + '\n'
      + '        </div>\n      </fieldset>';
  }).join('\n\n');

  const t = lang === 'ar' ? {
    legendN: 'الخطوة ' + num(total, lang) + ' من ' + num(total, lang),
    legendT: 'الإقرار والمراجعة',
    note: 'اقرأ ما حرَّرته كاملًا قبل إرساله. وهذا نصُّ ما يصل شؤون الطلاب، حرفًا بحرف.',
    d1: 'أقرُّ بأن ما ذكرته في هذا الطلب صحيحٌ على حدِّ علمي، وأن الوثيقة التي ذكرتُها لي.',
    d2: 'قرأتُ صفحة <a href="/ar/safeguarding/">حماية الطلاب وضوابط التدريس</a> وأقبل ما فيها.',
    d3: 'أعلم أن الكلية لا تأخذ رسومًا دراسية، وأن ما يُدفع إنما هو ثمنُ أعيانٍ اختيارية.',
    sig: 'التوقيع — اكتب اسمك كاملًا',
    sheet: 'ما سيصل شؤون الطلاب',
    empty: 'يُكتب الطلب ها هنا كلَّما تقدَّمت.',
  } : {
    legendN: 'Step ' + num(total, lang) + ' of ' + num(total, lang),
    legendT: 'Declarations and review',
    note: 'Read the whole of what you have written before it is sent. What follows is the text the Registry receives, character for character.',
    d1: 'I declare that what I have entered is true to the best of my knowledge, and that the identity document I named is mine.',
    d2: 'I have read <a href="/safeguarding/">Safeguarding &amp; Conduct of Teaching</a> and accept it.',
    d3: 'I understand that the College charges no tuition, and that anything paid is the price of an optional object.',
    sig: 'Signature &mdash; type your full name',
    sheet: 'What the Registry will receive',
    empty: 'The application is composed here as you go.',
  };

  const declare = '      <fieldset class="apply__step" data-step="declare" hidden>\n'
    + '        <legend class="apply__legend"><span class="apply__legend-n">' + t.legendN + '</span>'
    + '<span class="apply__legend-t">' + t.legendT + '</span></legend>\n'
    + '        <p class="apply__note">' + t.note + '</p>\n'
    + '        <div class="form-grid">\n'
    + ['d-true', 'd-safeguarding', 'd-charges'].map((id, i) =>
        '        <div class="field field--full apply__check">\n'
        + '          <label for="f-' + id + '"><input id="f-' + id + '" type="checkbox" data-declaration required>'
        + '<span>' + [t.d1, t.d2, t.d3][i] + '</span></label>\n        </div>').join('\n') + '\n'
    + '        <div class="field field--full">\n'
    + '          <label for="f-signature">' + t.sig + ' <span class="apply__req" aria-hidden="true">*</span></label>\n'
    + '          <input id="f-signature" data-label="' + (lang === 'ar' ? 'التوقيع' : 'Signature') + '" type="text" required>\n'
    + '        </div>\n        </div>\n'
    + '        <div class="apply__sheet-wrap">\n'
    + '          <p class="apply__sheet-label">' + t.sheet + '</p>\n'
    + '          <pre class="apply__sheet" data-apply-preview>' + t.empty + '</pre>\n'
    + '        </div>\n      </fieldset>';

  return { ledger, panels: panels + '\n\n' + declare, total };
}

function optionsFrom(list, lang, valueKey) {
  return list.map(function (row) {
    const label = lang === 'ar' ? (row.ar || row.en) : row.en;
    const value = valueKey ? row[valueKey] : row.en;
    return '<option value="' + value + '">' + label + '</option>';
  }).join('\n              ');
}

function fillPhotos(html) {
  return html.replace(/\{\{PHOTO:([a-z0-9-]+)\|([a-z0-9]+)(?:@([a-z0-9-]+))?\|([^}]*)\}\}/g,
    (m, name, ratio, focal, caption) => {
    const src = photoFile(name);
    if (!src) { photoMissing.add(name); return ''; }
    const cap = caption.trim();
    const pos = focalFor(focal);
    return '<figure class="r-photo r-photo--' + ratio + '">' +
      '<img src="' + src + '" alt="' + cap.replace(/"/g, '&quot;') + '" ' +
      (pos ? 'style="object-position:' + pos + '" ' : '') +
      'loading="lazy" decoding="async">' +
      (cap ? '<figcaption class="r-photo__cap">' + cap + '</figcaption>' : '') +
      '</figure>';
  });
}

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
     rail is simply not built. See the note in css/madinah.css. */
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
// All four answer to [data-ornament] in css/madinah.css, so a reader who
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

  // An Arabic page linking to /regulations/ would throw the reader back into
  // English mid-sentence. Rewritten at assembly rather than typed into every
  // Arabic file, so an author cannot forget the prefix and cannot get it
  // wrong on one link out of three hundred and forty-seven.
  //
  // This has silently failed twice, and both failures were caused by the
  // rewrite being a PATTERN over strings rather than a lookup over routes
  // (EB §13.2.11):
  //
  //   1. It was written out as a literal `/rusukh/`, and the rename to
  //      `/madinah/` left it matching nothing at all.
  //   2. It was applied to the page body but not to the chrome. The header
  //      and footer carry 117 of the site's Arabic links between them, so
  //      the entire navigation of the Arabic tree pointed into English.
  //
  // It is now neither a pattern nor a prefix: it is an exact lookup built
  // from the manifest's own English routes, which is what makes it safe at
  // the root. A prefix rule here would have had to guess whether `/css/`,
  // `/js/`, `/assets/` and `/api/` were pages — and would have rewritten
  // the stylesheets on every Arabic page the first time someone tried it.
  //
  // A route only rewrites if the manifest says it exists in Arabic. The
  // language switch is safe because it travels as the {{ALT_HREF}} token and
  // is substituted after this runs.
  const AR_ROUTE = new Map(
    routes
      .filter((e) => (e.lang || 'en') === 'en' && e.ar)
      .map((e) => [urlPathFor(e.output), urlPathFor(arOutputFor(e.output))])
  );

  function arLinks(html) {
    return html.replace(/href="(\/[^"#]*)(#[^"]*)?"/g, (m, path, frag) => {
      const to = AR_ROUTE.get(path);
      if (!to) return m;
      return 'href="' + to + (frag || '') + '"';
    });
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
      // The share card is the first thing most people will ever see of this
      // College — a link pasted into WhatsApp is how a prospectus travels
      // now. It must be an absolute URL: every scraper resolves og:image
      // against nothing. One card per tree, each set in its own script.
      OG_IMAGE: SITE_URL + (lang === 'ar'
        ? '/assets/madinah/og-card.ar.jpg'
        : '/assets/madinah/og-card.jpg'),
      OG_IMAGE_ALT: lang === 'ar'
        ? 'كلية المدينة العالمية — علوم القرآن والدراسات الإسلامية'
        : 'Al-Madinah International College — Qur\u2019\u0101nic and Islamic Sciences',
      // Two manifests, because a manifest carries lang, dir and start_url,
      // and an Arabic reader installing the site should get the Arabic tree.
      MANIFEST: lang === 'ar' ? '/ar/site.webmanifest' : '/site.webmanifest',
      ALTERNATES: alternates,
      // css/arabic.css is the type layer for the script — it undoes the
      // Latin tracking and leading that every earlier stylesheet sets, so
      // it must load LAST, after the house layer and after any page CSS.
      EXTRA_CSS: (entry.extraCss || [])
        .map((h) => `\n<link rel="stylesheet" href="${h}">`)
        .join('') + (lang === 'ar' ? '\n<link rel="stylesheet" href="/css/arabic.css">' : ''),
    });

    // Content data, filled in order: the application markup is generated
    // first, and the option lists are then filled INSIDE it — the generated
    // selects carry the same {{COUNTRY_OPTIONS}} token every hand-written
    // one does, so there is one code path and not two.
    const app = applicationHtml(lang);
    const withOptions = (h) => h
      .replace(/\{\{APPLICATION_LEDGER\}\}/g, app.ledger)
      .replace(/\{\{APPLICATION_STEPS\}\}/g, app.panels)
      .replace(/\{\{COUNTRY_OPTIONS\}\}/g, optionsFrom(COUNTRIES, lang, 'en'))
      .replace(/\{\{NG_STATE_OPTIONS\}\}/g, optionsFrom(NG_STATES, lang, 'en'));

    let content = withOptions(fillPhotos(withContentsRail(
      ornament(raiseMasthead(read(contentPath))),
      entry
    )));

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
<script src="/js/madinah-clock.js" defer></script>
<script src="/js/madinah-atelier.js" defer></script>
<script src="/js/madinah-dock.js" defer></script>
<script src="/js/madinah-tactile.js" defer></script>${(entry.scripts || []).map(function (src) { return '\n<script src="' + src + '" defer></script>'; }).join('')}
</body>
</html>
`;

    const outPath = path.join(ROOT, entry.output);
    fs.mkdirSync(path.dirname(outPath), { recursive: true });
    fs.writeFileSync(outPath, html);
    count++;
  });

  writeSitemap(routes);
  console.log(`Al-Madinah International College — built ${count} pages at the root.`);
  if (photoMissing.size) {
    console.log(`  photographs awaited (slots are live, nothing is rendered until the file exists):`);
    [...photoMissing].sort().forEach((n) => console.log(`    assets/photography/${n}.jpg`));
  }
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
<!-- Generated by scripts/build-madinah.js from madinah-src/manifest.json.
     Do not edit: the next build overwrites it. -->
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${urls.map((u) => `  <url><loc>${u}</loc></url>`).join('\n')}
</urlset>
`;
  fs.writeFileSync(path.join(ROOT, 'sitemap.xml'), xml);
}

build();
