/**
 * THE SHELF — sixteen volumes as objects, on a shelf, in one look.
 *
 * (The caption under each book is a <div> of <p>s rather than nested
 * <span>s, and that is not cosmetic: scripts/red-flag-audit.mjs adds a
 * sentence boundary at a block close and none at a span close, so with
 * spans it read four books' captions as one 53-word sentence and sent
 * an editor after prose that does not exist. An <a> may contain flow
 * content; the labels are labels, and they should be blocks.)
 *
 * ────────────────────────────────────────────────────────────────────
 * WHY A SHELF AND NOT A GRID
 * ────────────────────────────────────────────────────────────────────
 * The Library listed its volumes as sixteen text cards with a file size
 * on each. That is a directory, and a directory is what an institution
 * publishes when it has not decided whether its books are objects. A
 * shelf shows what a list cannot: that the reference curriculum is four
 * times the thickness of the specification, that the four Press papers
 * are one livery and the four curriculum volumes are another, and that
 * the whole imprint is sixteen books rather than sixteen links.
 *
 * Each book stands the way a book stands — spine toward the reader,
 * front board turned away — and comes face-on when it is pointed at.
 * No image, no library, no video: two inline SVGs per volume on a CSS
 * 3D transform, and the drawn spine width is the measured extent.
 *
 * ────────────────────────────────────────────────────────────────────
 * WHERE IT GOES, AND HOW IT CAN BE RE-RUN
 * ────────────────────────────────────────────────────────────────────
 * pages/press-library{,.ar}.html are hand-edited sources — every
 * sentence around the catalogue was written by a person and
 * scripts/lib/emit-page.js exists precisely to stop a generator from
 * overwriting them. So this writes only BETWEEN two markers:
 *
 *     <!-- SHELF:BEGIN --> … <!-- SHELF:END -->
 *
 * inserting them once, ahead of the Access leaf, if they are not there.
 * Everything outside the markers is left byte-identical, so this can be
 * re-run after a volume is added without a person's prose being at
 * risk.
 */
import { readFileSync, writeFileSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const LIB = JSON.parse(readFileSync(path.join(ROOT, 'data/library.json'), 'utf8'));
const PUBS = JSON.parse(readFileSync(path.join(ROOT, 'data/publications.json'), 'utf8'));

const esc = (s) => String(s ?? '')
  .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');

function spinePx(pages) {
  const mm = Math.max(5, (pages / 2) * 0.115 + 1.5);
  return Math.min(64, Math.max(11, Math.round(mm * 2)));
}

const COLLECTION_AR = {
  'The Curriculum': 'المنهج',
  'Teaching and Assessment': 'التدريس والتقييم',
  'Student Material': 'مادة الطالب',
  'The Press': 'المطبعة',
  'Cover Artwork': 'أعمال الغلاف',
};

const T = {
  en: {
    contents: 'The shelf',
    h2: 'Sixteen volumes, and you can see which is which from across the room.',
    lede: 'Every book the Press has issued, drawn at its own thickness — the spine of each one is calculated from the pages actually in it. Point at a volume to turn it face-on; open it for the specification, the sample pages and the download.',
    open: 'Open to everyone',
    held: 'On enrolment',
    pages: (n) => (n === 1 ? '1 page' : `${n} pages`),
    yours: 'Your Study Library',
    yoursNote: 'The volumes you have kept, in this browser. Nothing was sent anywhere and no account was made.',
    countLabel: 'kept',
  },
  ar: {
    contents: 'الرفّ',
    h2: 'ستة عشر مجلدًا، ويُعرَف كلٌّ منها من آخر الغرفة.',
    lede: 'كل كتاب أصدرته المطبعة، مرسومًا بسُمكه الحقيقي — فكعب كل مجلد محسوب من صفحاته فعلًا. أشِر إلى مجلد ليستدير إليك؛ وافتحه لترى المواصفة وصفحات منه ورابط التنزيل.',
    open: 'مفتوح للجميع',
    held: 'مع القيد',
    pages: (n) => (n === 1 ? 'صفحة واحدة' : n === 2 ? 'صفحتان' : `${n} صفحة`),
    yours: 'مكتبتك',
    yoursNote: 'المجلدات التي احتفظتَ بها، في هذا المتصفح. لم يُرسَل شيء إلى أي مكان ولم يُنشأ حساب.',
    countLabel: 'محفوظ',
  },
};

function book(v, meta, lang, i) {
  const ar = lang === 'ar';
  const sfx = ar ? '.ar' : '';
  const p = ar ? '/ar' : '';
  const L = T[lang];
  const held = meta.access === 'enrolled';
  const title = (ar && meta.cover_title_ar) || meta.cover_title;
  const under = (ar && meta.cover_under_ar) || meta.cover_under;
  return `<a class="stack__book${held ? ' stack__book--held' : ''}" href="${p}/press/${v.slug}/"
            style="--spine: ${spinePx(v.extent)}px; --lean: ${(i % 5) - 2}deg"
            data-shelf-item="${v.slug}">
            <span class="stack__obj" aria-hidden="true">
              <span class="stack__face stack__face--spine">{{SVG:assets/covers/${v.slug}-spine${sfx}.svg}}</span>
              <span class="stack__face stack__face--front">{{SVG:assets/covers/${v.slug}-front${sfx}.svg}}</span>
              <span class="stack__block"></span>
            </span>
            <div class="stack__label">
              <p class="stack__title">${esc(title)}</p>
              ${under ? `<p class="stack__under">${esc(under)}</p>` : ''}
              <p class="stack__meta">${esc(L.pages(v.extent))}
                <span class="stack__state${held ? ' stack__state--held' : ''}">${esc(held ? L.held : L.open)}</span></p>
            </div>
          </a>`;
}

function block(lang) {
  const L = T[lang];
  const ar = lang === 'ar';
  const groups = LIB.collections.map((c) => ({
    name: c,
    label: ar ? (COLLECTION_AR[c] || c) : c,
    rows: LIB.volumes.filter((v) => v.collection === c),
  })).filter((g) => g.rows.length);

  let i = 0;
  const shelves = groups.map((g) => {
    const books = g.rows.map((v) => book(v, PUBS.volumes[v.slug], lang, i++)).join('\n          ');
    return `<div class="stack">
          <p class="stack__shelfname">${esc(g.label)}</p>
          <div class="stack__row">
          ${books}
          </div>
          <span class="stack__plank" aria-hidden="true"></span>
        </div>`;
  }).join('\n        ');

  return `<!-- SHELF:BEGIN — generated by scripts/build-shelf.mjs. Everything
     between these two markers is written by that script; everything
     outside them is hand-edited prose it must never touch. -->
<section class="leaf section--dark aurora grain" id="shelf" data-contents="${esc(L.contents)}">
  <div class="container leaf__grid">
    <div class="leaf__margin">
      <span class="leaf__num foil">&mdash;</span>
      <span class="leaf__label">${esc(L.contents)}</span>
    </div>
    <div class="leaf__body reveal">
      <div class="section-head">
        <h2>${esc(L.h2)}</h2>
        <p class="lede">${esc(L.lede)}</p>
      </div>
      <div class="bookcase">
        ${shelves}
      </div>

      <div class="yours card card--dark edge-lit aurum" data-shelf-view hidden>
        <h3>${esc(L.yours)} <span class="yours__count" data-shelf-count hidden>0</span></h3>
        <p>${esc(L.yoursNote)}</p>
      </div>
    </div>
  </div>
</section>
<!-- SHELF:END -->`;
}

const BEGIN = '<!-- SHELF:BEGIN';
const END = '<!-- SHELF:END -->';
/** Ahead of the Access leaf, which is the first thing after the plate. */
const ANCHOR = '<section class="leaf section--paper grain" id="access"';

for (const [file, lang] of [['pages/press-library.html', 'en'], ['pages/press-library.ar.html', 'ar']]) {
  const full = path.join(ROOT, file);
  let s = readFileSync(full, 'utf8');
  const fresh = block(lang);
  if (s.includes(BEGIN) && s.includes(END)) {
    const a = s.indexOf(BEGIN);
    const b = s.indexOf(END) + END.length;
    s = s.slice(0, a) + fresh + s.slice(b);
  } else {
    const at = s.indexOf(ANCHOR);
    if (at < 0) {
      throw new Error(`build-shelf: ${file} has no Access leaf to insert ahead of, and no `
        + 'SHELF markers to write between. Refusing to guess where the shelf goes.');
    }
    s = `${s.slice(0, at) + fresh}\n\n${s.slice(at)}`;
  }
  writeFileSync(full, s);
  console.log(`shelf: ${file} — ${LIB.volumes.length} volumes on ${LIB.collections.length} shelves`);
}
