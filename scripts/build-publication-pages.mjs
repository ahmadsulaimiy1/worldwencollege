/**
 * ONE PAGE PER VOLUME — the thing that stands between a click and a
 * 26-megabyte download.
 *
 * ────────────────────────────────────────────────────────────────────
 * THE FAULT THIS EXISTS TO CORRECT
 * ────────────────────────────────────────────────────────────────────
 * Every volume in the Library was a link straight at its PDF. Click it
 * and a file began arriving — no title page, no extent, no idea what
 * was inside, no way to look first, and on the largest volumes no
 * warning that a phone on a Gulf mobile connection was about to be
 * handed twenty-six megabytes. The owner put it plainly: it "doesn't
 * notify somebody and show it appropriately that I am about to
 * download... it should even give preview and then full information
 * about the book and everything, the picture and everything else, even
 * the mock-up of the book before we even download it."
 *
 * A publisher does not hand you a file. It shows you the book: the
 * object, its three faces, its extent, its edition, who it is for,
 * what is in it, what it will let you do, and a few real pages of it —
 * and then, once you know all of that, it offers you the download.
 *
 * ────────────────────────────────────────────────────────────────────
 * WHAT IS ON THE PAGE, AND WHERE EACH PART COMES FROM
 * ────────────────────────────────────────────────────────────────────
 *   the drawn object   assets/covers/ — three faces, generated
 *   the extent, size   data/library.json — measured, never typed
 *   the sample pages   assets/pages/ — real pages of the real PDF
 *   the editorial      data/publications.json — written by a person
 *
 * Nothing on the page is invented here. The generator's own job is
 * arrangement, and it refuses to run rather than arrange a gap.
 *
 * ────────────────────────────────────────────────────────────────────
 * THE LOCKED TIER IS SHOWN, NOT HIDDEN
 * ────────────────────────────────────────────────────────────────────
 * A volume whose access is `enrolled` gets exactly the same page: the
 * same object, the same specification, the same sample pages, the same
 * contents. What changes is the action — the download becomes an
 * invitation to enrol, and it says so in words rather than by being
 * a dead button. A reader must always be able to see that the
 * publication exists and what is in it.
 */
import { readFileSync, writeFileSync, existsSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { createRequire } from 'node:module';

const require = createRequire(import.meta.url);
const { emitPage, reportEmit } = require('./lib/emit-page.js');

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const LIB = JSON.parse(readFileSync(path.join(ROOT, 'data/library.json'), 'utf8'));
const PUBS = JSON.parse(readFileSync(path.join(ROOT, 'data/publications.json'), 'utf8'));
const SAMPLES = existsSync(path.join(ROOT, 'data/samples.json'))
  ? JSON.parse(readFileSync(path.join(ROOT, 'data/samples.json'), 'utf8'))
  : { volumes: {} };

const esc = (s) => String(s ?? '')
  .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
const ROMAN = ['', 'I', 'II', 'III', 'IV', 'V', 'VI'];

// ─────────────────────────────────────────────────────────────────────
// THE TWO EDITIONS' WORDS
// ─────────────────────────────────────────────────────────────────────
const T = {
  en: {
    press: 'WEC Press',
    library: 'The Library',
    backToLibrary: 'All sixteen volumes',
    theVolume: 'The volume',
    turnIt: 'Turn the volume',
    front: 'Front', spine: 'Spine', back: 'Back',
    turnHint: 'Drag the book to turn it, or use the three marks below.',
    specification: 'The specification',
    series: 'Series', edition: 'Edition', levels: 'Levels', level: 'Level',
    language: 'Language', extent: 'Extent', format: 'Format', imprint: 'Imprint',
    fileSize: 'File', rights: 'Rights', identifiers: 'Identifiers',
    pages: (n) => (n === 1 ? '1 page' : `${n} pages`),
    a4: '210 × 297 mm, portrait',
    imprintLine: 'London: WorldWide English College Press',
    rightsLine: 'Free to download, print, photocopy and quote, with attribution.',
    idsLine: 'ISBN not assigned · DOI not registered',
    allLevels: 'All six',
    read: 'Read online',
    readHint: 'Opens in your browser. Nothing is downloaded.',
    download: 'Download',
    preview: 'Look inside',
    save: 'Add to Study Library',
    saved: 'In your Study Library',
    openAccess: 'Open to everyone',
    openAccessNote: 'No account. No enrolment. No email address.',
    enrolAccess: 'Available on enrolment',
    apply: 'Apply for a place',
    signIn: 'Already enrolled? Sign in',
    oversize: 'Too large to serve from this host',
    oversizeNote: (t, mb) => `${t} is ${mb} MB, over the 25 MiB per-file limit of the College’s host. It cannot be handed over as a direct download from this page. It is issued inside the portal, where no such limit applies.`,
    inside: 'Inside',
    insideH: 'A few real pages, taken from the volume itself.',
    insideLede: (t, n, k) => (n === 1
      ? `${t} is a single sheet, and this is the whole of it, rendered from the file itself.`
      : `Not a mock-up, and not a flattering selection. ${k} pages of ${t}, taken at fixed fractions of its ${n}-page extent. Each one is rendered from the same file you would download.`),
    pageOf: (a, b) => `Page ${a} of ${b}`,
    prev: 'Previous page', next: 'Next page',
    studyH: 'What is in this volume',
    outcomesH: 'What it lets you do',
    audienceH: 'Who it is for',
    relatedH: 'Read alongside it',
    contentsInside: 'Inside', contentsStudy: 'Contents', contentsOut: 'Use',
    contentsRelated: 'Alongside', contentsSpec: 'Specification',
    ctaH: 'Read the rest of the shelf.',
    ctaA: ['/press/library/', 'All sixteen volumes'],
    ctaB: ['/admissions/apply/', 'Apply for a place'],
    of: 'of',
  },
  ar: {
    press: 'مطبعة الكلية',
    library: 'المكتبة',
    backToLibrary: 'المجلدات الستة عشر',
    theVolume: 'المجلد',
    turnIt: 'أدر المجلد',
    front: 'الغلاف', spine: 'الكعب', back: 'الظهر',
    turnHint: 'اسحب الكتاب لتديره، أو استعمل العلامات الثلاث أدناه.',
    specification: 'المواصفة',
    series: 'السلسلة', edition: 'الطبعة', levels: 'المستويات', level: 'المستوى',
    language: 'اللغة', extent: 'عدد الصفحات', format: 'القطع', imprint: 'الناشر',
    fileSize: 'الملف', rights: 'الحقوق', identifiers: 'المعرّفات',
    pages: (n) => (n === 1 ? 'صفحة واحدة' : n === 2 ? 'صفحتان' : `${n} صفحة`),
    a4: '٢١٠ × ٢٩٧ ملم، طولي',
    imprintLine: 'لندن: مطبعة الكلية العالمية للغة الإنجليزية',
    rightsLine: 'حرّ التنزيل والطباعة والنسخ والاقتباس، مع النسبة.',
    idsLine: 'لم يُخصَّص ردمك · لم يُسجَّل معرّف رقمي',
    allLevels: 'الستة جميعًا',
    read: 'اقرأه في المتصفح (بالإنجليزية)',
    readHint: 'يُفتح في متصفحك. لا يُنزَّل شيء.',
    download: 'تنزيل (بالإنجليزية)',
    preview: 'انظر في داخله',
    save: 'أضِفه إلى مكتبتي',
    saved: 'في مكتبتك',
    openAccess: 'مفتوح للجميع',
    openAccessNote: 'بلا حساب. بلا قيد. بلا بريد إلكتروني.',
    enrolAccess: 'يصل مع القيد',
    apply: 'قدِّم على مقعد',
    signIn: 'مقيَّد بالفعل؟ سجِّل الدخول',
    oversize: 'أكبر من أن يُقدَّم من هذا المستضيف',
    oversizeNote: (t, mb) => `حجم «${t}» ${mb} ميغابايت، فوق حدِّ الخمسة والعشرين ميبي‑بايت للملف الواحد لدى مستضيف الكلية. فلا يمكن تسليمه تنزيلًا مباشرًا من هذه الصفحة. ويُصدَر داخل البوابة حيث لا يسري هذا الحد.`,
    inside: 'في الداخل',
    insideH: 'صفحات حقيقية من المجلد نفسه.',
    insideLede: (t, n, k) => (n === 1
      ? `«${t}» ورقة واحدة، وهذه هي كاملة، مصوّرة من الملف نفسه.`
      : `ليست محاكاة ولا انتقاءً مُجمَّلًا. ${k} صفحات من «${t}»، البالغ ${n} صفحة، مأخوذة بنسب ثابتة من عدد صفحاته. وكلٌّ منها مصوَّرة من الملف نفسه الذي ستنزّله.`),
    pageOf: (a, b) => `صفحة ${a} من ${b}`,
    prev: 'الصفحة السابقة', next: 'الصفحة التالية',
    studyH: 'ما في هذا المجلد',
    outcomesH: 'ما الذي يتيحه لك',
    audienceH: 'لمن هو',
    relatedH: 'اقرأه إلى جانبه',
    contentsInside: 'في الداخل', contentsStudy: 'المحتوى', contentsOut: 'الفائدة',
    contentsRelated: 'إلى جانبه', contentsSpec: 'المواصفة',
    ctaH: 'اقرأ بقية الرفّ.',
    ctaA: ['/ar/press/library/', 'المجلدات الستة عشر'],
    ctaB: ['/ar/admissions/apply/', 'قدِّم على مقعد'],
    of: 'من',
  },
};

const AUDIENCE_AR = {
  Institutional: 'مؤسسي',
  Students: 'الطلاب',
  Everyone: 'الجميع',
  Teachers: 'المعلّمون',
  'Teachers and examiners': 'المعلّمون والممتحِنون',
  'Students and teachers': 'الطلاب والمعلّمون',
};

/**
 * A CONTENTS LINE THAT NAMES SOMETHING NOT DONE TAKES A RING.
 *
 * CLAUDE.md §5: #i-struck is settled, #i-ring is outstanding, and
 * scripts/red-flag-audit.mjs fails the build on a struck tick beside a
 * "not yet". The Listening Scripts volume says in its own contents that
 * the audio is published as script and is not yet recorded — which is
 * true, is the right thing for the volume to say, and is exactly the
 * sentence that must not carry a tick.
 *
 * The pattern below is a copy of the audit's, deliberately, and the
 * test at the bottom of that file is what keeps the two from drifting:
 * if the audit ever widens its rule, this generator's output starts
 * failing it, which is the correct direction for the coupling to run.
 * The decision is taken on the ENGLISH line for both editions, so a
 * ring never appears on one edition and a tick on the other.
 */
const OUTSTANDING = /\bnot (?:yet|appointed|obtained|adopted|held|awarded)\b|\bnone\b|\bno\b\s*(?:—|-)/i;
function outstanding(meta, i) {
  return OUTSTANDING.test(String((meta.study || [])[i] || ''));
}

/**
 * The drawn spine in CSS pixels. The cover generator derives the same
 * figure from the same extent; this repeats the calculation rather than
 * importing it because the two are answering different questions — one
 * sizes an SVG viewBox, the other sizes a DOM box — and a shared
 * constant that silently governs both is how a drawing and its frame
 * come to disagree by a pixel and nobody can say why.
 */
function spinePx(pages) {
  const mm = Math.max(5, (pages / 2) * 0.115 + 1.5);
  return Math.min(64, Math.max(11, Math.round(mm * 2)));
}

// ─────────────────────────────────────────────────────────────────────
// THE PIECES
// ─────────────────────────────────────────────────────────────────────
function tome(v, lang) {
  const sfx = lang === 'ar' ? '.ar' : '';
  const s = spinePx(v.extent);
  return `<div class="tome" data-tome style="--spine: ${s}px">
        <div class="tome__stage">
          <div class="tome__box" data-tome-box>
            <div class="tome__face tome__face--front">{{SVG:assets/covers/${v.slug}-front${sfx}.svg}}</div>
            <div class="tome__face tome__face--back">{{SVG:assets/covers/${v.slug}-back${sfx}.svg}}</div>
            <div class="tome__face tome__face--spine">{{SVG:assets/covers/${v.slug}-spine${sfx}.svg}}</div>
            <div class="tome__face tome__face--fore" aria-hidden="true"></div>
            <div class="tome__face tome__face--head" aria-hidden="true"></div>
            <div class="tome__face tome__face--tail" aria-hidden="true"></div>
          </div>
          <span class="tome__shadow" aria-hidden="true"></span>
        </div>
      </div>`;
}

function actions(v, meta, L, lang) {
  const ar = lang === 'ar';
  const p = ar ? '/ar' : '';
  const enrolled = meta.access === 'enrolled';
  const servable = !v.oversize && !v.excluded && !enrolled;
  const rows = [];

  rows.push(`<a class="btn btn--outline vol__act" href="#inside">
          <svg class="icon" aria-hidden="true"><use href="#i-book"/></svg>${esc(L.preview)}</a>`);

  if (servable) {
    rows.unshift(`<a class="btn btn--gold magnetic gold-live aurum aurum--twin vol__act"
          href="${v.href}" target="_blank" rel="noopener">
          <svg class="icon" aria-hidden="true"><use href="#i-scroll"/></svg>${esc(L.read)}</a>`);
    rows.push(`<a class="btn btn--outline vol__act" href="${v.href}" download>
          <svg class="icon" aria-hidden="true"><use href="#i-arrow"/></svg>${esc(L.download)}
          <span class="vol__size">${esc(v.mb)}&nbsp;MB</span></a>`);
  } else if (enrolled) {
    rows.unshift(`<a class="btn btn--gold magnetic gold-live aurum aurum--twin vol__act"
          href="${p}/admissions/apply/">
          <svg class="icon" aria-hidden="true"><use href="#i-seal"/></svg>${esc(L.apply)}</a>`);
    rows.push(`<a class="btn btn--outline vol__act" href="${p}/student-portal/">
          <svg class="icon" aria-hidden="true"><use href="#i-key"/></svg>${esc(L.signIn)}</a>`);
  }

  rows.push(`<button type="button" class="btn btn--quiet vol__act vol__save"
          data-shelf-add="${v.slug}" aria-pressed="false">
          <svg class="icon" aria-hidden="true"><use href="#i-layers"/></svg>
          <span data-shelf-label>${esc(L.save)}</span></button>`);

  return rows.join('\n        ');
}

function accessNote(v, meta, L, lang) {
  const enrolled = meta.access === 'enrolled';
  const ar = lang === 'ar';
  if (enrolled) {
    return `<div class="vol__access vol__access--held">
          <span class="badge-dome badge-dome--sm" aria-hidden="true"><svg class="icon" aria-hidden="true"><use href="#i-key"/></svg></span>
          <div><p class="vol__accessh">${esc(L.enrolAccess)}</p>
          <p>${esc((ar && meta.access_note_ar) || meta.access_note || '')}</p></div>
        </div>`;
  }
  if (v.oversize || v.excluded) {
    return `<div class="vol__access vol__access--held">
          <span class="badge-dome badge-dome--sm" aria-hidden="true"><svg class="icon" aria-hidden="true"><use href="#i-ledger"/></svg></span>
          <div><p class="vol__accessh">${esc(L.oversize)}</p>
          <p>${esc(L.oversizeNote((ar && PUBS.volumes[v.slug].cover_title_ar) || PUBS.volumes[v.slug].cover_title, v.mb))}</p></div>
        </div>`;
  }
  return `<div class="vol__access vol__access--open">
          <span class="badge-dome badge-dome--sm" aria-hidden="true"><svg class="icon" aria-hidden="true"><use href="#i-globe"/></svg></span>
          <div><p class="vol__accessh">${esc(L.openAccess)}</p><p>${esc(L.openAccessNote)}</p></div>
        </div>`;
}

function spec(v, meta, L, lang) {
  const ar = lang === 'ar';
  const series = (PUBS.series[meta.series] || {})[ar ? 'ar' : 'en'] || meta.series;
  const levels = meta.levels || [];
  const levelValue = levels.length === 0 ? '—'
    : levels.length === 6 ? L.allLevels
      : levels.map((l) => ROMAN[l]).join(', ');
  const rows = [
    [L.series, series],
    [L.edition, (ar && meta.edition_ar) || meta.edition],
    [levels.length === 1 ? L.level : L.levels, levelValue],
    [L.language, (ar && meta.language_ar) || meta.language],
    [L.extent, L.pages(v.extent)],
    [L.format, L.a4],
    [L.imprint, L.imprintLine],
    [L.fileSize, `${v.mb} MB · PDF`],
    [L.rights, L.rightsLine],
    [L.identifiers, L.idsLine],
  ];
  return `<dl class="vol__spec">
          ${rows.map(([k, val]) => `<div class="vol__specrow"><dt>${esc(k)}</dt><dd>${esc(val)}</dd></div>`).join('\n          ')}
        </dl>`;
}

function flipbook(v, L, lang) {
  const rows = (SAMPLES.volumes || {})[v.slug] || [];
  if (!rows.length) return '';
  const ar = lang === 'ar';
  const leaves = rows.map((r, i) => `<figure class="flip__leaf${i === 0 ? ' is-current' : ''}"
              data-flip-leaf="${i}"${i === 0 ? '' : ' aria-hidden="true"'}>
              <img src="${r.src}" width="${r.w}" height="${r.h}"
                   alt="${esc(ar ? `صفحة ${r.page} من ${v.title}` : `Page ${r.page} of ${v.title}`)}"
                   loading="${i < 2 ? 'eager' : 'lazy'}" decoding="async">
              <figcaption>${esc(L.pageOf(r.page, v.extent))}</figcaption>
            </figure>`).join('\n            ');

  return `<div class="flip" data-flip data-flip-count="${rows.length}">
          <div class="flip__book">
            <span class="flip__block" aria-hidden="true"></span>
            ${leaves}
          </div>
          <div class="flip__bar">
            <button type="button" class="flip__nav" data-flip-prev aria-label="${esc(L.prev)}">
              <svg class="icon" aria-hidden="true"><use href="#i-arrow"/></svg></button>
            <ol class="flip__dots" role="tablist">
              ${rows.map((r, i) => `<li><button type="button" role="tab" data-flip-to="${i}"
                aria-selected="${i === 0 ? 'true' : 'false'}"
                aria-label="${esc(L.pageOf(r.page, v.extent))}"><span>${r.page}</span></button></li>`).join('\n              ')}
            </ol>
            <button type="button" class="flip__nav" data-flip-next aria-label="${esc(L.next)}">
              <svg class="icon" aria-hidden="true"><use href="#i-arrow"/></svg></button>
          </div>
        </div>`;
}

function relatedCards(v, meta, lang) {
  const ar = lang === 'ar';
  const sfx = ar ? '.ar' : '';
  const p = ar ? '/ar' : '';
  const rel = (meta.related || [])
    .map((slug) => LIB.volumes.find((x) => x.slug === slug))
    .filter(Boolean).slice(0, 3);
  return rel.map((r) => {
    const rm = PUBS.volumes[r.slug];
    const held = rm.access === 'enrolled';
    return `<a class="card card--dark relcard reveal tilt gold-live edge-lit aurum aurum--hover"
            href="${p}/press/${r.slug}/">
            <span class="tilt__sheen" aria-hidden="true"></span>
            <span class="relcard__cover">{{SVG:assets/covers/${r.slug}-front${sfx}.svg}}</span>
            <span class="relcard__body">
              <span class="relcard__series">${esc((PUBS.series[rm.series] || {})[ar ? 'ar' : 'en'] || rm.series)}</span>
              <span class="relcard__title">${esc((ar && rm.cover_title_ar) || rm.cover_title)}</span>
              <span class="relcard__meta">${esc(T[lang].pages(r.extent))}${held ? ` · ${esc(T[lang].enrolAccess)}` : ''}</span>
            </span>
          </a>`;
  }).join('\n          ');
}

// ─────────────────────────────────────────────────────────────────────
// THE PAGE
// ─────────────────────────────────────────────────────────────────────
function page(v, meta, lang) {
  const L = T[lang];
  const ar = lang === 'ar';
  const p = ar ? '/ar' : '';
  const sfx = ar ? '.ar' : '';
  const title = (ar && meta.cover_title_ar) || meta.cover_title;
  const under = (ar && meta.cover_under_ar) || meta.cover_under;
  const note = (ar && v.note_ar) || v.note;
  const series = (PUBS.series[meta.series] || {})[ar ? 'ar' : 'en'] || meta.series;
  const study = (ar && meta.study_ar) || meta.study || [];
  const outcomes = (ar && meta.outcomes_ar) || meta.outcomes || [];
  const audience = ar ? (AUDIENCE_AR[v.audience] || v.audience) : v.audience;
  const enrolled = meta.access === 'enrolled';
  const sampleCount = ((SAMPLES.volumes || {})[v.slug] || []).length;

  return `<!--
  ${esc(v.title)} — GENERATED by scripts/build-publication-pages.mjs.
  The object is drawn from assets/covers/, the extent and file size are
  measured into data/library.json, the sample pages are real pages of
  the PDF, and the editorial matter is data/publications.json. Edit
  those, not this.
-->
<section class="page-hero masthead volhero guilloche grain">
  <canvas class="constellation" aria-hidden="true"></canvas>
  <div class="container masthead__inner">
    <p class="masthead__rule" aria-hidden="true"><svg class="icon" aria-hidden="true"><use href="#i-book"/></svg></p>
    <p class="masthead__eyebrow">${esc(L.press)} &middot; ${esc(series)}</p>
    <h1>${esc(title)}</h1>
    ${under ? `<p class="volhero__under">${esc(under)}</p>` : ''}
    <p class="lede">${esc(note)}</p>
    <dl class="masthead__facts">
      <div class="masthead__fact"><dt>${esc(L.extent)}</dt><dd>${v.extent}</dd></div>
      <div class="masthead__fact"><dt>${esc(L.audienceH)}</dt><dd>${esc(audience)}</dd></div>
      <div class="masthead__fact"><dt>${esc(L.edition)}</dt><dd>${esc((ar && meta.edition_ar) || meta.edition)}</dd></div>
      <div class="masthead__fact"><dt>${esc(ar ? 'الوصول' : 'Access')}</dt><dd>${esc(enrolled ? L.enrolAccess : L.openAccess)}</dd></div>
    </dl>
    <p class="masthead__rule masthead__rule--foot" aria-hidden="true"><svg class="icon" aria-hidden="true"><use href="#i-laurel"/></svg></p>
  </div>
</section>

<section class="section--dark section-pad volstage aurora" id="volume" data-contents="${esc(L.contentsSpec)}">
  <div class="container vol">
    <div class="vol__object reveal">
      ${tome(v, lang)}
      <div class="tome__controls" role="group" aria-label="${esc(L.turnIt)}">
        <button type="button" class="tome__ctl is-on" data-tome-face="front">${esc(L.front)}</button>
        <button type="button" class="tome__ctl" data-tome-face="spine">${esc(L.spine)}</button>
        <button type="button" class="tome__ctl" data-tome-face="back">${esc(L.back)}</button>
      </div>
      <p class="tome__hint">${esc(L.turnHint)}</p>
    </div>

    <div class="vol__panel card card--dark edge-lit aurum reveal">
      ${accessNote(v, meta, L, lang)}
      <div class="vol__acts">
        ${actions(v, meta, L, lang)}
      </div>
      <p class="vol__readhint">${esc(L.readHint)}</p>
      <h2 class="vol__spech">${esc(L.specification)}</h2>
      ${spec(v, meta, L, lang)}
    </div>
  </div>
</section>

<section class="leaf section--paper grain" id="inside" data-contents="${esc(L.contentsInside)}">
  <span class="leaf__ornament" aria-hidden="true" style="--leaf-plate:url(/assets/art/portico.svg)"></span>
  <div class="container leaf__grid">
    <div class="leaf__margin">
      <span class="leaf__num foil">I</span>
      <span class="leaf__label">${esc(L.inside)}</span>
    </div>
    <div class="leaf__body reveal">
      <div class="section-head">
        <h2>${esc(L.insideH)}</h2>
        <p class="lede">${esc(L.insideLede(under ? `${title} — ${under}` : title, v.extent, sampleCount))}</p>
      </div>
      ${flipbook(v, L, lang)}
    </div>
  </div>
</section>

<section class="leaf section--light" id="contents" data-contents="${esc(L.contentsStudy)}">
  <div class="container leaf__grid">
    <div class="leaf__margin">
      <span class="leaf__num foil">II</span>
      <span class="leaf__label">${esc(L.contentsStudy)}</span>
    </div>
    <div class="leaf__body reveal">
      <div class="section-head"><h2>${esc(L.studyH)}</h2></div>
      <ul class="check-list check-list--open">
        ${study.map((sline, i) => `<li><svg class="icon" aria-hidden="true"><use href="#i-${outstanding(meta, i) ? 'ring' : 'struck'}"/></svg>${esc(sline)}</li>`).join('\n        ')}
      </ul>
    </div>
  </div>
</section>

<section class="leaf section--paper grain" id="use" data-contents="${esc(L.contentsOut)}">
  <div class="container leaf__grid">
    <div class="leaf__margin">
      <span class="leaf__num foil">III</span>
      <span class="leaf__label">${esc(L.contentsOut)}</span>
    </div>
    <div class="leaf__body reveal">
      <div class="section-head"><h2>${esc(L.outcomesH)}</h2></div>
      <div class="grid grid--3 grid--close">
        ${outcomes.map((o, i) => `<div class="card tilt gold-live edge-lit edge-lit--light aurum aurum--hover reveal">
          <span class="tilt__sheen" aria-hidden="true"></span>
          <span class="badge-dome badge-dome--lg" aria-hidden="true"><svg class="icon" aria-hidden="true"><use href="#i-${['compass', 'scales', 'mortarboard'][i % 3]}"/></svg></span>
          <p>${esc(o)}</p>
        </div>`).join('\n        ')}
      </div>
    </div>
  </div>
</section>

<section class="leaf section--dark aurora" id="alongside" data-contents="${esc(L.contentsRelated)}">
  <div class="container leaf__grid">
    <div class="leaf__margin">
      <span class="leaf__num foil">IV</span>
      <span class="leaf__label">${esc(L.contentsRelated)}</span>
    </div>
    <div class="leaf__body reveal">
      <div class="section-head"><h2>${esc(L.relatedH)}</h2></div>
      <div class="relgrid">
          ${relatedCards(v, meta, lang)}
      </div>
    </div>
  </div>
</section>

<section class="section--dark cta-band">
  <div class="container reveal">
    <h2>${esc(L.ctaH)}</h2>
    <div class="btn-row u-center">
      <a href="${L.ctaA[0]}" class="btn btn--gold magnetic aurum aurum--twin">${esc(L.ctaA[1])}</a>
      <a href="${L.ctaB[0]}" class="btn btn--outline magnetic">${esc(L.ctaB[1])}</a>
    </div>
  </div>
</section>
`;
}

// ─────────────────────────────────────────────────────────────────────
// THE RUN
// ─────────────────────────────────────────────────────────────────────
const problems = [];
for (const v of LIB.volumes) {
  const meta = PUBS.volumes[v.slug];
  if (!meta) { problems.push(`data/publications.json has no entry for "${v.slug}"`); continue; }
  if (meta.access !== v.access) {
    problems.push(`"${v.slug}" is ${v.access} in data/library.json and ${meta.access} in `
      + 'data/publications.json. The page would state one and the download would honour the other.');
  }
  for (const f of ['front', 'spine', 'back']) {
    for (const sfx of ['', '.ar']) {
      const art = path.join(ROOT, `assets/covers/${v.slug}-${f}${sfx}.svg`);
      if (!existsSync(art)) problems.push(`missing cover face: assets/covers/${v.slug}-${f}${sfx}.svg`);
    }
  }
}
if (problems.length) {
  throw new Error(`build-publication-pages: ${problems.length} problem(s):\n  `
    + problems.join('\n  ')
    + '\nRun `node scripts/build-library.mjs` then `node scripts/art/generate-covers.mjs`.');
}

const emitted = [];
const entries = [];
for (const v of LIB.volumes) {
  const meta = PUBS.volumes[v.slug];
  for (const lang of ['en', 'ar']) {
    const ar = lang === 'ar';
    const file = path.join(ROOT, 'pages', `publication-${v.slug}${ar ? '.ar' : ''}.html`);
    emitted.push({ file, result: emitPage(file, page(v, meta, lang)) });
    const title = (ar && meta.cover_title_ar) || meta.cover_title;
    const under = (ar && meta.cover_under_ar) || meta.cover_under;
    entries.push({
      slug: `publication-${v.slug}${ar ? '-ar' : ''}`,
      output: `${ar ? 'ar/' : ''}press/${v.slug}/index.html`,
      title: `${title}${under ? ` — ${under}` : ''} ${ar ? '— مطبعة الكلية' : '— WEC Press'}`,
      description: ((ar && v.note_ar) || v.note).slice(0, 300),
      contentFile: `publication-${v.slug}${ar ? '.ar' : ''}.html`,
      lang, dir: ar ? 'rtl' : 'ltr',
      altHref: `${ar ? '' : '/ar'}/press/${v.slug}/`,
      extraCss: ['/css/pillar.css', '/css/press.css'],
      scripts: ['/js/bookcase.js'],
      contents: true,
    });
  }
}

const MAN = path.join(ROOT, 'pages', 'manifest.json');
const manifest = JSON.parse(readFileSync(MAN, 'utf8'));
const list = Array.isArray(manifest) ? manifest : manifest.pages;
for (const e of entries) {
  const i = list.findIndex((x) => x.slug === e.slug);
  if (i >= 0) list[i] = { ...list[i], ...e }; else list.push(e);
}
writeFileSync(MAN, `${JSON.stringify(manifest, null, 2)}\n`);

reportEmit('build-publication-pages.mjs', emitted);
console.log(`publications: ${entries.length} pages registered `
  + `(${LIB.volumes.length} volumes × 2 editions).`);
