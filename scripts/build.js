#!/usr/bin/env node
// Assembles partials + a page's content into a full HTML document
// for every entry in pages/manifest.json. No dependencies — Node's
// built-in fs/path only.

const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

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

// A LEAF WITHOUT AN ANCHOR CANNOT BE IN THE RAIL, AND A RAIL THAT LISTS
// HALF A PAGE TEACHES THE READER TO STOP USING IT.
//
// This required an id and skipped anything without one, and most leaves
// have never had one: 14 of Admissions' 22, 11 of the Press's 17, 9 of
// Governance's 20. Those pillars are long ON PURPOSE — the architecture
// consolidated thirty-seven URLs into them and the rail is the whole
// answer to the length that produced — so a rail listing six of
// twenty-two was undoing the decision it exists to serve.
//
// Every leaf already carries a `leaf__label`: a short human name,
// authored, translated, and sitting in the reader's eye at the top of
// the leaf they land in. That is exactly what a rail wants. So a leaf
// with no id is given a positional one, `leaf-N`, which is stable while
// the leaves are, language-independent — an Arabic label slugifies to
// nothing — and cannot collide with a hand-authored anchor, because any
// leaf that deserved a permanent semantic id already has one.
//
// contentsEntries therefore REWRITES the html it was handed, and its
// caller uses the returned copy.
function contentsEntries(html) {
  const out = [];
  let body = html;
  let leafN = 0;
  const open = /<section\b([^>]*)>/g;
  let m;
  while ((m = open.exec(html))) {
    const attrs = m[1];
    const isLeaf = /\bclass="[^"]*\bleaf\b/.test(attrs);
    if (isLeaf) leafN += 1;
    let id = (attrs.match(/\bid="([^"]+)"/) || [])[1];
    if (!id && isLeaf) {
      id = `leaf-${leafN}`;
      const tag = m[0];
      const withId = tag.replace(/^<section\b/, `<section id="${id}"`);
      // Replace this occurrence only — two leaves can share attributes.
      const at = body.indexOf(tag);
      if (at >= 0) body = body.slice(0, at) + withId + body.slice(at + tag.length);
    }
    if (!id) continue;
    // The masthead is where the reader already is; listing it is noise.
    if (/\bpage-hero\b/.test(attrs)) continue;
    // A HIDDEN SECTION IS NOT ON THE PAGE.
    //
    // The verification instrument holds three sections that exist only
    // once a code has resolved — the result, the three layers and what
    // the qualification certifies — and they carry <h2>&mdash;</h2>
    // placeholders that a script fills. The rail read those headings
    // and offered the reader two entries both labelled "—", pointing at
    // nothing they could see. A rail advertising a destination that is
    // display:none is worse than a short rail.
    if (/\shidden(?=[\s>=])/.test(attrs)) continue;
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
    // A leaf names itself in the margin before it says anything else.
    const leafLabel = (rest.match(/<span class="leaf__label"[^>]*>([\s\S]*?)<\/span>/) || [])[1];
    const h2 = (rest.match(/<h2[^>]*>([\s\S]*?)<\/h2>/) || [])[1];
    const src = explicit || marker || leafLabel || h2;
    if (!src) continue;
    const label = src
      .replace(/<[^>]+>/g, '')
      .replace(/&amp;/g, '&').replace(/&middot;/g, '·').replace(/&mdash;/g, '—')
      .replace(/\s+/g, ' ')
      .trim()
      .replace(/[.。]$/, '');
    if (label) out.push({ id, label });
  }
  return { items: out, html: body };
}

function withContentsRail(html, entry, lang) {
  if (!entry.contents) return html;
  const { items, html: anchored } = contentsEntries(html);
  // Under four sections a rail is furniture: it costs a band of chrome
  // to save a reader a scroll they were going to do anyway.
  if (items.length < 4) return html;
  html = anchored;

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

// ---------------------------------------------------------------------
// WHERE THE COLLEGE PUBLICLY IS, AND NOWHERE IT IS NOT
// ---------------------------------------------------------------------
// Three social icons sat in the topbar, the mobile drawer and the
// footer of every page, in both languages, each linking to `#`. Six
// dead controls across 169 routes, invisible to the link census —
// `#` resolves to the page you are already on — and invisible in the
// source, because they looked exactly like the real thing.
//
// A dead social icon is an implied claim that the College keeps an
// account there, placed in the chrome of every page. CLAUDE.md § 5:
// silence about a thing the College does not have is fine; a claim is
// not. So the row is rendered from data/contact.json and from nowhere
// else, an empty object renders NOTHING, and a value that is empty or
// `#` is REFUSED rather than drawn — that being the exact fault this
// replaced.
const CONTACT = JSON.parse(read(path.join(ROOT, 'data', 'contact.json')));

const SOCIAL_MARKS = {
  linkedin: { icon: 'i-linkedin', label: 'LinkedIn' },
  instagram: { icon: 'i-instagram', label: 'Instagram' },
  x: { icon: 'i-x', label: 'X / Twitter' },
};

function socialRow(lang) {
  const entries = Object.entries(CONTACT.social || {});
  for (const [key, url] of entries) {
    if (!SOCIAL_MARKS[key]) {
      throw new Error(`data/contact.json names "${key}", which has no mark in partials/icons.html. `
        + 'An icon-less link in a row of icons is a worse answer than no link.');
    }
    if (!url || url === '#' || !/^https?:\/\//.test(url)) {
      throw new Error(`data/contact.json gives "${key}" the address ${JSON.stringify(url)}. `
        + 'A social icon that leads nowhere is the fault this file was written to close.');
    }
  }
  if (!entries.length) return '';
  const label = lang === 'ar' ? 'روابط التواصل الاجتماعي' : 'Social links';
  const links = entries.map(([key, url]) => {
    const mark = SOCIAL_MARKS[key];
    return `<a href="${url}" aria-label="${mark.label}" rel="me noopener" target="_blank">`
      + `<svg class="icon" aria-hidden="true"><use href="#${mark.icon}"/></svg></a>`;
  }).join('\n        ');
  return `<div class="topbar__social" aria-label="${label}">\n        ${links}\n      </div>`;
}

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

// ── THE EDITIONS PICKER ──────────────────────────────────────────────
// data/languages.json records the editions the College plans and the
// editions it publishes, and it is the only place that distinction
// lives. The picker is generated from it rather than typed into two
// partials, because a language list typed twice is a language list that
// disagrees with itself on the first edit — which is exactly what
// happened to the College's own figures before data/standing.json
// existed.
//
// THE PICKER OFFERS THE EDITIONS THAT EXIST, AND NOTHING ELSE.
//
// It used to render all ten, the eight unpublished ones as text marked
// "In preparation" — deliberately not as links, so that nobody clicked
// through to a 404. That reasoning was right about links and wrong
// about claims: eight rows announcing work the College has not
// finished, in the chrome of all 186 pages and in both editions, is the
// site telling every reader what it has not managed to do. The house
// standard rules that out in as many words — state what the College
// does, not what it has not done — and the same ruling took "eight
// further editions are in preparation" out of the footer band.
//
// The plan stays in the data file, where it belongs: it is how the
// College knows what it intends, and `published` is still the one flag
// that decides. Setting it true renders the row, links it, and announces
// it in the alternate tags. Nothing here has to be edited to publish an
// edition — which is the property the file was built for.
const LANGUAGES = JSON.parse(read(path.join(ROOT, 'data', 'languages.json')));

function languagePicker(lang, altHref) {
  const L = LANGUAGES.labels[lang === 'ar' ? 'ar' : 'en'];
  const rows = LANGUAGES.languages.filter((l) => l.published).map((l) => {
    const current = l.code === lang;
    const label = `<span class="lang__flag" aria-hidden="true">${l.flag}</span>`
      + `<span class="lang__endonym"${l.dir === 'rtl' ? ` dir="rtl" lang="${l.code}"` : ` lang="${l.code}"`}>${l.endonym}</span>`
      + `<span class="lang__english">${l.english}</span>`;
    if (current) {
      return `        <span class="lang__row lang__row--current" aria-current="true">${label}`
        + `<span class="lang__state"><svg class="icon" aria-hidden="true"><use href="#i-struck"/></svg></span></span>`;
    }
    if (l.published) {
      // Two published editions, so "the other one" is unambiguous and
      // altHref is the page-specific twin rather than the front door.
      return `        <a class="lang__row" href="${altHref}" hreflang="${l.code}" lang="${l.code}">${label}</a>`;
    }
    // Unreachable: the list is filtered to published editions above.
    // Kept as a refusal rather than deleted, so that a future edition
    // marked published without a prefix fails the build loudly instead
    // of rendering a row that links to the site's own front door.
    throw new Error(`data/languages.json marks ${l.code} published with no prefix.`);
  }).join('\n');

  return `<div class="langswitch">
    <button type="button" class="langswitch__btn" aria-expanded="false" aria-haspopup="true">
      <svg class="icon" aria-hidden="true"><use href="#i-language"/></svg>
      <span class="langswitch__now">${LANGUAGES.languages.find((l) => l.code === lang).endonym}</span>
      <svg class="icon langswitch__chev" aria-hidden="true"><use href="#i-arrow"/></svg>
    </button>
    <div class="langswitch__menu crystal" role="menu">
      <p class="langswitch__head">${L.heading}</p>
${rows}
    </div>
  </div>`;
}

// ── THE INTAKE PANEL ─────────────────────────────────────────────────
// Three intakes and the seats open in the next one, generated from
// data/intakes.json wherever a page writes `{{INTAKE_PANEL}}`.
//
// It is generated rather than written into each page for the reason
// every other figure on this site is: the homepage, the Admissions
// pillar and both Arabic editions would otherwise each hold their own
// copy of three dates and a seat count, and the first correction would
// leave three of them behind.
//
// The COUNTDOWN is not here. The markup carries each intake's month and
// day; js/intake.js resolves which closes next against the reader's own
// clock. A build-time countdown would be a number that was true when the
// page was generated, which is the one thing a countdown must never be.
const INTAKES = JSON.parse(read(path.join(ROOT, 'data', 'intakes.json')));

function intakePanel(lang) {
  const ar = lang === 'ar';
  const L = INTAKES.labels[ar ? 'ar' : 'en'];
  const seats = STANDING.reach.seats_open;
  if (!Number.isInteger(seats) || seats <= 0) {
    throw new Error('standing.reach.seats_open must be a positive integer; the panel publishes '
      + 'it as the number of places open and a panel that publishes nothing is chrome.');
  }
  const rows = INTAKES.intakes.map((i) => `        <li class="intake__row"
            data-intake-close="${i.closes}" data-intake-begins="${i.begins}"
            data-intake-name="${i[ar ? 'ar' : 'en'].name}">
          <span class="intake__mark" aria-hidden="true"><svg class="icon"><use href="#i-seal"/></svg></span>
          <span class="intake__name">${i[ar ? 'ar' : 'en'].name}</span>
          <span class="intake__term">${i[ar ? 'ar' : 'en'].term}</span>
        </li>`).join('\n');

  return `<div class="intake edge-lit aurum reveal" data-intake>
    <span class="intake__glow" aria-hidden="true"></span>
    <div class="intake__head">
      <span class="intake__eyebrow">${L.eyebrow}</span>
      <p class="intake__seats"><strong>${seats}</strong> ${L.seats}</p>
    </div>

    <div class="intake__clock">
      <span class="intake__closes">${L.closesIn}</span>
      <div class="intake__digits">
        <span class="intake__unit"><b data-count-days>—</b><i>${L.days}</i></span>
        <span class="intake__colon" aria-hidden="true">:</span>
        <span class="intake__unit"><b data-count-hours>—</b><i>${L.hours}</i></span>
        <span class="intake__colon" aria-hidden="true">:</span>
        <span class="intake__unit"><b data-count-mins>—</b><i>${L.minutes}</i></span>
      </div>
      <p class="intake__next">${L.nextIntake}: <strong data-next-name></strong>
        &middot; ${L.teachingBegins} <strong data-next-begins></strong></p>
    </div>

    <ul class="intake__list">
${rows}
    </ul>

    <p class="intake__note">${L.rolling}</p>
    <a class="btn btn--gold magnetic gold-live" href="${ar ? '/ar' : ''}/admissions/apply/">${L.applyNow}</a>
  </div>`;
}

// ── THE ACADEMIC RESOURCES SHELF ─────────────────────────────────────
// Sixteen volumes have been published and downloadable for weeks, at
// /press/library/, and the owner reported looking for the books and
// finding nothing. Both were true: the files serve, and the only route
// to them was a pillar named after the imprint that made them rather
// than the subject they are about. A reader looking for the curriculum
// does not think "Press".
//
// So the shelf is rendered wherever a page writes `{{RESOURCES}}`, and
// it is generated from data/library.json — the same register the
// Library page reads — so a volume cannot appear here with a size or a
// title the Library disagrees with, and a volume withdrawn there cannot
// go on being offered here.
//
// WHAT IS ON IT. Only volumes the register marks `open` and does not
// exclude, in a fixed order set by what a prospective student wants
// first rather than by what the Press published first. An oversize
// volume is shown with its size, because a 26MB download over a phone
// connection in Lagos is a decision and not a click.
const LIBRARY = JSON.parse(read(path.join(ROOT, 'data', 'library.json')));

const SHELF = [
  { slug: 'flagship-curriculum', icon: 'i-layers',
    en: 'What is taught, level by level, with every module named and every outcome stated.',
    ar: 'ما يُدرَّس، مستوًى مستوًى، وكل وحدة مسمّاة وكل ناتج مذكور.' },
  { slug: 'programme-architecture', icon: 'i-columns',
    en: 'The mapping from every lesson to its outcome and to the assessment that tests it.',
    ar: 'ربطُ كل درس بناتجه وبالتقييم الذي يقيسه.' },
  { slug: 'assessment-handbook', icon: 'i-scales',
    en: 'The rubrics, the pass criteria and the skill floors — published before the work they mark.',
    ar: 'معايير التصحيح وشروط النجاح والحدود الدنيا للمهارات — تُنشر قبل العمل الذي تقيسه.' },
  { slug: 'student-workbook-level-1', icon: 'i-book',
    en: 'Level I in the learner\u2019s hands: the exercises, in the order they are set.',
    ar: 'المستوى الأول بين يدي المتعلّم: التمارين بترتيب تكليفها.' },
  { slug: 'teachers-companion-level-1', icon: 'i-lectern',
    en: 'For each Level I lesson: what commonly goes wrong, and a second way to explain it.',
    ar: 'لكل درس في المستوى الأول: ما يُخطئ فيه المتعلمون عادةً، وطريقة ثانية للشرح.' },
  { slug: 'pronunciation-handbook', icon: 'i-waveform',
    en: 'The sound system taught explicitly rather than picked up — every phoneme, with drills.',
    ar: 'النظام الصوتي يُدرَّس صراحةً لا التقاطًا — كل صوت، ومعه تمارينه.' },
  { slug: 'listening-scripts', icon: 'i-quote',
    en: 'Every listening passage as a full script, so nothing is assessed that cannot be read.',
    ar: 'كل نص استماع مكتوبًا كاملًا، فلا يُقاس ما لا يمكن قراءته.' },
];

function resourcesShelf(lang) {
  const ar = lang === 'ar';
  const rows = (LIBRARY.volumes || LIBRARY.rows || []);
  const byslug = new Map(rows.map((r) => [r.slug, r]));

  const cards = SHELF.map((item) => {
    const v = byslug.get(item.slug);
    if (!v) {
      throw new Error(`The resources shelf names "${item.slug}", which data/library.json does not `
        + 'carry. A shelf offering a volume the register does not hold is a broken download '
        + 'waiting for a reader to find it.');
    }
    // OVERSIZE BELONGS IN THIS TEST AND WAS MISSING FROM IT.
    // The first cut checked `access` and `excluded` and shipped a card
    // offering the Complete Curriculum, which is 26.7MB — past
    // Cloudflare's per-asset ceiling, so scripts/build-library.mjs
    // writes it no redirect rule and the URL 404s. The register knew;
    // the guard did not ask. A guard that checks two of the three
    // reasons a volume is unservable is a guard that ships the third.
    if (v.access !== 'open' || v.excluded || v.oversize) {
      const why = [v.access !== 'open' && `access=${v.access}`, v.excluded && 'excluded',
        v.oversize && `oversize at ${v.mb}MB`].filter(Boolean).join(', ');
      throw new Error(`"${item.slug}" is on the resources shelf but the register marks it ${why}. `
        + 'The deployment serves no URL for it, so the card would be a download that 404s. '
        + 'Withdraw it from SHELF in scripts/build.js, or say in prose that it is available on '
        + 'request — which is what the Library page already does.');
    }
    const heavy = Boolean(v.oversize);
    const size = `${v.mb}&nbsp;MB`;
    const label = heavy
      ? (ar ? 'كبير &mdash; نزّله على اتصال ثابت' : 'Large &mdash; download on a steady connection')
      : (ar ? 'تنزيل' : 'Download');
    // `card--dark`, AND IT IS NOT OPTIONAL HERE.
    // `.card` defaults to the paper ground, and this shelf sits on a
    // dark leaf where the surrounding text colour is near-white. The
    // first render put cream cards under white type: the titles and the
    // descriptions were, on screen, almost completely invisible, while
    // the source read as a perfectly ordinary card. CLAUDE.md §6 exists
    // for exactly this — it was legible in the markup and unreadable on
    // the page.
    return `        <a class="shelf__item card card--dark reveal tilt edge-lit aurum" href="${v.href}"
           download data-volume="${v.slug}">
          <span class="tilt__sheen" aria-hidden="true"></span>
          <span class="badge-dome badge-dome--dark badge-dome--lg gold-live"><svg class="icon" aria-hidden="true"><use href="#${item.icon}"/></svg></span>
          <span class="shelf__size">PDF &middot; ${size}</span>
          <h3>${ar ? (v.title_ar || v.title) : v.title}</h3>
          <p>${item[ar ? 'ar' : 'en']}</p>
          <span class="shelf__get${heavy ? ' shelf__get--heavy' : ''}">${label}
            <svg class="icon" aria-hidden="true"><use href="#i-arrow"/></svg></span>
        </a>`;
  }).join('\n');

  return `<div class="shelf grid grid--3">\n${cards}\n      </div>`;
}

// ── FINGERPRINTS, AND THE FOUR HOURS THEY REMOVE ─────────────────────
//
// THE FAULT. On 19 August 2026 a deploy landed, the served HTML carried
// the new build stamp, and worldwencollege.co.uk went on serving the
// PREVIOUS css/brand.css for another forty-eight minutes:
//
//     cf-cache-status: HIT   age: 2868   max-age: 14400
//
// The HTML is `max-age=0, must-revalidate` and updates at once; the
// stylesheet had four hours to run. So for up to four hours after every
// deploy, a returning visitor could be served NEW MARKUP AGAINST OLD
// CSS — which is not a slow update, it is a broken page, and it is
// invisible to everyone who happens to hard-refresh.
//
// _headers already described this exact trade-off and named the exit:
// "Move to long-lived immutable caching only once/if the build gains
// content-hashed filenames." This is the build gaining them.
//
// HOW. Every stylesheet and script the build emits carries `?v=` and
// eight hex of the SHA-256 of its own bytes. A file that changed gets a
// new URL and therefore cannot be served from a cache keyed on the old
// one; a file that did NOT change keeps its URL and stays cached, which
// is why the hash is of the content rather than of the build.
//
// A query string rather than a renamed file, deliberately: the path
// stays /css/brand.css, so _redirects, the CSP, the preload hints and
// every hand-written reference in the repository keep working, and
// there is no build artefact directory to keep swept. Cloudflare's
// cache key includes the query string, which is the only property this
// depends on.
const FINGERPRINTS = new Map();
function fingerprint(href) {
  // Only local, root-relative assets. An absolute URL belongs to
  // somebody else's cache policy and must not be rewritten.
  if (!href.startsWith('/') || href.startsWith('//')) return href;
  const clean = href.split('?')[0].split('#')[0];
  if (FINGERPRINTS.has(clean)) return FINGERPRINTS.get(clean);
  const file = path.join(ROOT, clean.replace(/^\//, ''));
  let out = href;
  if (fs.existsSync(file)) {
    const hash = crypto.createHash('sha256').update(fs.readFileSync(file)).digest('hex').slice(0, 8);
    out = `${clean}?v=${hash}`;
  } else {
    // Not a warning to swallow: a page linking an asset that is not in
    // the tree is a 404 the moment it is served, and the build should
    // say so while somebody is still looking at it.
    console.warn(`  ! ${clean} is linked but not in the tree — shipped unfingerprinted`);
  }
  FINGERPRINTS.set(clean, out);
  return out;
}

// Rewrites every <link rel=stylesheet href="/…"> and <script src="/…">
// in a block of assembled HTML. Applied to the head and the script
// block rather than to the whole page, so nothing in page CONTENT — a
// download link, a plate, an anchor — is touched.
function fingerprintAssets(html) {
  // `(\?v=[0-9a-f]+)?` is load-bearing. Without it the pattern skips a
  // reference that ALREADY carries a stamp, which is fine for a page
  // assembled fresh every build and catastrophic for a hand-authored
  // one: it would keep the first hash it was ever given, for a year,
  // against a file that had changed underneath it.
  return html
    .replace(/(<link[^>]+href=")(\/[^"?#]+\.css)(\?v=[0-9a-f]+)?(")/g,
      (_, a, href, _v, b) => a + fingerprint(href) + b)
    .replace(/(<script[^>]+src=")(\/[^"?#]+\.js)(\?v=[0-9a-f]+)?(")/g,
      (_, a, src, _v, b) => a + fingerprint(src) + b);
}

// ── THE PAGES THIS BUILD DOES NOT OWN ────────────────────────────────
// The portal, the Listening Lab, the verification page, the instructor
// workspace and the admin screens are hand-authored HTML outside
// pages/manifest.json. They link the same stylesheets and scripts, and
// _headers now tells the edge to hold those for a YEAR.
//
// Fingerprinting only the pages the manifest owns would therefore be
// worse than not fingerprinting at all: the marketing site would update
// correctly while the application a student actually signs in to kept a
// stale brand.css pinned in their browser until next August.
//
// So the sweep is over every served page, whoever wrote it. It is
// idempotent — a stamp that is already correct is rewritten to itself —
// and it reports what it touched rather than editing files silently.
function fingerprintUnownedPages(ownedOutputs) {
  const owned = new Set(ownedOutputs);
  const touched = [];
  // `partials` is in this list because the first run swept it and
  // stamped partials/head.html — a SOURCE template, which the build
  // fills and stamps on every page anyway. Baking a hash into a
  // template leaves the source claiming a version it does not control,
  // and the next person reading it has to work out which stamp wins.
  const skip = new Set(['node_modules', 'pages', 'partials', 'tests', 'docs', 'publication', 'sql']);
  (function walk(dir) {
    for (const e of fs.readdirSync(dir, { withFileTypes: true })) {
      if (e.name.startsWith('.') || skip.has(e.name)) continue;
      const full = path.join(dir, e.name);
      if (e.isDirectory()) { walk(full); continue; }
      if (!e.name.endsWith('.html')) continue;
      const rel = path.relative(ROOT, full);
      if (owned.has(rel)) continue;
      const before = fs.readFileSync(full, 'utf8');
      const after = fingerprintAssets(before);
      if (after !== before) { fs.writeFileSync(full, after); touched.push(rel); }
    }
  })(ROOT);
  return touched;
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
// Fraunces — the display face — is SELF-HOSTED from /assets/fonts/ and
// declared in css/brand.css, so it never appears in this URL. Only the
// faces still worth a third-party round trip are requested here.
const LATIN_FONTS = 'family=Cinzel:wght@500;600'
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

    const head = fingerprintAssets(fill(partialFor('head', lang), {
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
      // Emitted on every page so the tag is never simply absent, and
      // the private ones say so in the head as well as by their absence
      // from the sitemap — a crawler that reaches one by a link, a
      // referrer or a pasted address must be told there too.
      ROBOTS: isPrivate(entry)
        ? '<meta name="robots" content="noindex, nofollow">'
        : '<meta name="robots" content="index, follow">',
    }));
    const picker = languagePicker(lang, altHref);
    const social = socialRow(lang);
    const topbar = fill(partialFor('topbar', lang), { ALT_HREF: altHref, LANG_PICKER: picker, SOCIAL: social });
    // The mobile drawer and the footer each carry their own language
    // switch now, so they need the same per-page ALT_HREF the topbar's
    // gets — the page-specific Arabic/English twin, not a blanket link
    // to the other language's front door.
    const header = fill(partialFor('header', lang), { ALT_HREF: altHref, LANG_PICKER: picker, SOCIAL: social });
    const footer = fill(partialFor('footer', lang), { ALT_HREF: altHref, SOCIAL: social });
    const withIntake = (html) => html
      .split('{{INTAKE_PANEL}}').join(intakePanel(lang))
      .split('{{RESOURCES}}').join(resourcesShelf(lang));
    const content = withContentsRail(
      raiseMasthead(
        fillStanding(
          withIntake(inlineSvgIncludes(read(path.join(PAGES, entry.contentFile)), entry.contentFile)),
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
${fingerprintAssets(`<script src="/js/site.js"></script>
<script src="/js/motion.js"></script>
<script src="/js/atelier.js" defer></script>
<script src="/js/worldclock.js" defer></script>
<script src="/js/intake.js" defer></script>
<script src="/js/sonics.js" defer></script>${extraScripts}`)}
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

  // Every page the manifest does NOT own gets the same treatment, for
  // the reason set out above fingerprintUnownedPages: the portal is the
  // page a student signs in to, and a year-long cache on an unstamped
  // stylesheet would pin it there.
  const swept = fingerprintUnownedPages(
    (Array.isArray(manifest) ? manifest : manifest.pages).map((e) => e.output));
  if (swept.length) {
    console.log(`Re-stamped assets on ${swept.length} hand-authored page(s):`);
    for (const f of swept) console.log(`  ${f}`);
  }
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
/**
 * A page behind a sign-in.
 *
 * Decided from the guard the page actually mounts, not from a flag in
 * the manifest that somebody has to remember to set. A page carrying
 * js/portal-guard.js is a learner's own — their marks, their statement
 * of account, their payment confirmation — and there is no case where
 * such a page should be indexed or listed in a public sitemap. Eleven
 * of them were in both.
 */
function isPrivate(entry) {
  // The guard implies it, so a page that gates itself can never be
  // forgotten. `private: true` covers the one learner surface that does
  // not gate — /my-record.html, which renders a transcript and a set of
  // sharing controls behind an authenticated API rather than behind the
  // shell guard — and any future page in the same position.
  return entry.private === true || (entry.scripts || []).includes('/js/portal-guard.js');
}

function writeSitemap(manifest) {
  // 404 is excluded because a sitemap is a list of pages worth indexing
  // and an error page is not one. A learner's own pages are excluded for
  // the same reason from the other direction: they are worth reading,
  // and they are nobody's to index.
  const indexable = manifest
    .filter((e) => !/(^|\/)404\.html$/.test(e.output))
    .filter((e) => !isPrivate(e));
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
