/**
 * THE ARABIC EDITION KIT.
 *
 * ────────────────────────────────────────────────────────────────────
 * WHY THIS FILE EXISTS
 * ────────────────────────────────────────────────────────────────────
 * scripts/build-arabic.js authored the first Arabic pages and, with
 * them, the College's Arabic house style: how a level is named, how a
 * card is set, how a link into an English-only page is marked, how the
 * institutional-status notice is worded. All of it lived inside that
 * one file as private constants.
 *
 * The moment a second generator needed to publish in Arabic — the six
 * level pages — there were exactly two options: copy that vocabulary,
 * or share it. Copying is how a College ends up with two Arabic names
 * for Level III and no way to tell which one is right. Everything here
 * is therefore moved rather than reinvented: same wording, one home.
 *
 * ────────────────────────────────────────────────────────────────────
 * WHAT BELONGS HERE
 * ────────────────────────────────────────────────────────────────────
 * Vocabulary the institution has settled on, and layout primitives that
 * more than one Arabic generator needs. Page CONTENT does not belong
 * here — a page's argument is written where the page is written.
 *
 * ────────────────────────────────────────────────────────────────────
 * WHAT IS DELIBERATELY LEFT IN LATIN SCRIPT
 * ────────────────────────────────────────────────────────────────────
 * Personal names, degree titles, award titles, post-nominals, CEFR
 * codes, prices and the programme's initials. Rendering a degree or an
 * award title into Arabic risks stating a credential that does not
 * exist under that name; the awards in particular are defined objects
 * with an official title and a post-nominal, and translating either
 * would create a second award. They are wrapped in dir="ltr" so a
 * browser sets them correctly inside right-to-left text rather than
 * reordering them, and the Arabic prose explains what they are.
 */

// ── The six levels, as the Arabic pages already name them ─────────────
// Reusing the established wording rather than coining a second set:
// two Arabic names for one level is how the two come to disagree.
const AR_LEVEL = {
  1: { ord: 'الأول', name: 'برنامج التأسيس' },
  2: { ord: 'الثاني', name: 'البرنامج الابتدائي' },
  3: { ord: 'الثالث', name: 'البرنامج المتوسط' },
  4: { ord: 'الرابع', name: 'المتوسط المتقدم' },
  5: { ord: 'الخامس', name: 'البرنامج المتقدم' },
  6: { ord: 'السادس', name: 'برنامج الإتقان' },
};

// Roman numerals as Arabic ordinals, keyed the way the curriculum
// record keys them.
const AR_ROMAN = { I: 'الأول', II: 'الثاني', III: 'الثالث', IV: 'الرابع', V: 'الخامس', VI: 'السادس' };

// ── Inline apparatus ──────────────────────────────────────────────────
const ltr = (s) => `<span dir="ltr">${s}</span>`;

/** A link into a page that exists only in English, marked as such
 *  BEFORE the reader commits to the click. tests/bilingual-links.test.mjs
 *  enforces that every such crossing carries this marker. */
const EN = (href, label) => `<a href="${href}">${label} <span dir="ltr">(EN)</span></a>`;

const esc = (s) => String(s ?? '').replace(/&(?![a-z]+;|#)/g, '&amp;');

// ── Layout primitives ─────────────────────────────────────────────────
// ── THE MATERIAL LAW, IN THE KIT ─────────────────────────────────────
//
// The same divergence recorded in scripts/build-levels.js, on the other
// side of the language line: these helpers emitted bare cards while the
// Arabic pages in pages/ carried the full atelier layer, added to the
// FILES by a later pass and never to the generator. Running
// build-arabic-levels.js stripped 46 domes off each of the six Arabic
// level pages. It was found by running it.
//
// `icon` carries the law. Passing one produces a struck card; omitting
// it keeps the bare markup byte-for-byte, so every call site not yet
// given an icon renders exactly as before rather than half-dressed.
const struckClass = (dark) => dark
  ? 'card reveal tilt card--dark edge-lit aurum'
  : 'card reveal tilt edge-lit edge-lit--light aurum';

const domeMark = (icon, dark) => icon
  ? `\n        <span class="tilt__sheen" aria-hidden="true"></span>` +
    `\n        <span class="badge-dome${dark ? ' badge-dome--dark' : ''} badge-dome--lg gold-live">` +
    `<svg class="icon" aria-hidden="true"><use href="#${icon}"/></svg></span>`
  : '';

const card = (num, title, body, icon) => `      <div class="${icon ? struckClass(false) : 'card'}">${domeMark(icon, false)}
        <span class="card__num">${num}</span>
        <h3>${title}</h3>
        <p>${body}</p>
      </div>`;

const darkCard = (num, title, body, icon) => `      <div class="${icon ? struckClass(true) : 'card card--dark'}">${domeMark(icon, true)}
        <span class="card__num">${num}</span>
        <h3>${title}</h3>
        <p>${body}</p>
      </div>`;

const hero = (eyebrow, h1, lede, extra = '') => `<section class="section--dark section-pad">
  <div class="container">
    <span class="eyebrow">${eyebrow}</span>
    <h1>${h1}</h1>
    <p class="lede">${lede}</p>
    ${extra}
  </div>
</section>`;

const cta = (h2, primary, primaryHref, secondary, secondaryHref) =>
  `<section class="section--dark cta-band">
  <div class="container reveal">
    <h2>${h2}</h2>
    <div class="btn-row u-center">
      <a href="${primaryHref}" class="btn btn--gold">${primary}</a>
      <a href="${secondaryHref}" class="btn btn--outline">${secondary}</a>
    </div>
  </div>
</section>
`;

// ── The two standing notices ──────────────────────────────────────────
// Worded once. Both make claims about the institution, and a claim
// worded twice is a claim that will eventually be worded differently.

/** Carried by every Arabic page that links onward into English. */
const enOnly = `<div class="callout">
      <span class="callout__label">عن الصفحات الإنجليزية</span>
      <p>تحمل بعض الروابط في هذه الصفحة علامة <span dir="ltr">(EN)</span>. هذه صفحات لم تُنشر بعد
        بالعربية، وتفتح بالإنجليزية. الكلية تذكر ذلك مسبقًا بدل أن يكتشفه القارئ بعد الضغط،
        وتُنشر النسخ العربية تباعًا.</p>
    </div>`;

/** Carried wherever the College's standing bears on a reader's decision. */
const noAccreditation = `<div class="callout">
      <span class="callout__label">وضع الكلية</span>
      <p>الكلية العالمية للغة الإنجليزية لا تحمل أي اعتماد أكاديمي، ولم تُعيّن ممتحنًا خارجيًا،
        ولم تمنح أي شهادة لأي شخص حتى اليوم، ولم تُدرّس أي دفعة بعد، ولم تُعتمد
        <a href="/ar/admissions/tuition/#refunds">سياسة استرداد</a>. تُذكر هذه الحقائق في كل
        صفحة تؤثر فيها على قرارك، لا مرة واحدة في هامش.</p>
    </div>`;

module.exports = {
  AR_LEVEL, AR_ROMAN, ltr, EN, esc,
  card, darkCard, hero, cta, enOnly, noAccreditation,
};
