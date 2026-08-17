// scripts/build-library.mjs — put the College's own books in reach.
//
// ─────────────────────────────────────────────────────────────────────
// THE FAULT THIS EXISTS TO CORRECT
// ─────────────────────────────────────────────────────────────────────
// WEC Press has produced sixteen typeset volumes — a complete
// curriculum in two editions, an assessment handbook, a pronunciation
// handbook, listening scripts, a student workbook, a teacher's
// companion, the programme architecture, the publishing constitution,
// the canon index, the editorial bible, production specifications.
// Seventy-five megabytes of finished academic work.
//
// Not one of them was reachable. No page on the site linked a single
// PDF, and .github/workflows/deploy-cloudflare.yml carried the line
//
//     --exclude='publication/'
//
// with the comment "not linked from any page, so publication/ is
// excluded above" — a self-sealing argument: nothing linked them, so
// they were not deployed, so nothing could link them.
//
// A college whose library exists only on the build machine has no
// library. This script gives every volume a clean, citable URL and
// generates the register that the Library page and the tests read.
//
// ─────────────────────────────────────────────────────────────────────
// WHY REDIRECTS AND NOT COPIES
// ─────────────────────────────────────────────────────────────────────
// The obvious approach is to copy publication/*.pdf into library/ under
// tidy slugs. That doubles seventy-five megabytes inside the git
// history for a naming convenience, and every rebuild of a volume then
// has to remember to re-copy it or the served file goes stale — the
// exact class of drift that cost this repository six level pages.
//
// So the files stay where the publication pipeline writes them, and
// _redirects maps a clean slug onto each one:
//
//     /library/complete-curriculum.pdf  →  /publication/IEFC%20Complete%20…
//
// The citable URL is stable, the served bytes are never duplicated, and
// a rebuilt volume is live the moment it is rebuilt.
//
// ─────────────────────────────────────────────────────────────────────
// THE 25 MiB WALL, STATED RATHER THAN WORKED AROUND
// ─────────────────────────────────────────────────────────────────────
// Cloudflare Pages refuses any single file over 25 MiB. Two volumes
// exceed it — the Complete Curriculum at 26.7 MB and its Student
// Edition at 25.5 MB — because both carry every plate of a six-level
// curriculum in one binding.
//
// That is a hosting limit, not a decision about openness, and the
// Library says so in those words. Both are supplied in full on request,
// and the material in them is downloadable here in three other forms
// that fit: the Flagship Curriculum, the Programme Architecture, and
// the per-level volumes. `oversize` marks them so the page can state
// the reason next to the volume rather than in a footnote.

import { readFileSync, writeFileSync, existsSync, statSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = path.dirname(path.dirname(fileURLToPath(import.meta.url)));
const PUB = path.join(ROOT, 'publication');

// Cloudflare Pages' hard per-file ceiling.
const MAX_BYTES = 25 * 1024 * 1024;

// ── THE REGISTER ─────────────────────────────────────────────────────
// One row per volume the Press has actually produced. `collection`
// groups them the way a reader looks for them, not the way the build
// happens to order them. `audience` is who the volume is FOR, which is
// the question a visitor is actually asking.
const VOLUMES = [
  // ── The curriculum ────────────────────────────────────────────────
  { slug: 'complete-curriculum', file: 'IEFC Complete Curriculum.pdf',
    title: 'IEFC Complete Curriculum',
    collection: 'The Curriculum', audience: 'Institutional',
    note: 'Every lesson of all six levels, with objectives, prerequisites, staged timings and the assessment each one is built toward. The reference edition.' },
  { slug: 'complete-curriculum-student', file: 'IEFC Complete Curriculum (Student Edition).pdf',
    title: 'IEFC Complete Curriculum — Student Edition',
    collection: 'The Curriculum', audience: 'Students',
    note: 'The same curriculum, set for a reader working through it rather than auditing it: the internal apparatus removed, the learning path kept.' },
  { slug: 'flagship-curriculum', file: 'IEFC Flagship Curriculum.pdf',
    title: 'IEFC Flagship Curriculum',
    collection: 'The Curriculum', audience: 'Everyone',
    note: 'The programme in brief — the six levels, their CEFR alignment, credits, hours and awards. The volume to read first, and the smallest.' },
  { slug: 'programme-architecture', file: 'IEFC Programme Architecture (Institutional Edition).pdf',
    title: 'IEFC Programme Architecture — Institutional Edition',
    collection: 'The Curriculum', audience: 'Institutional',
    note: 'How the programme is constructed: the credit framework, the competency framework, the mapping from lesson to outcome to assessment, and where the mapping is still interim.' },

  // ── Teaching and assessment ───────────────────────────────────────
  { slug: 'assessment-handbook', file: 'IEFC Assessment Handbook.pdf',
    title: 'IEFC Assessment Handbook',
    collection: 'Teaching and Assessment', audience: 'Teachers and examiners',
    note: 'Every rubric, every pass criterion, every skill floor, and the marking standard each is applied to. Published in full, because a criterion a candidate cannot read is not a criterion.' },
  { slug: 'teachers-companion-level-1', file: "IEFC Level I Teacher's Companion.pdf",
    title: "IEFC Level I Teacher's Companion",
    collection: 'Teaching and Assessment', audience: 'Teachers',
    note: 'For each lesson of Level I: what commonly goes wrong, why, a second way to explain it, and what to do for the learner who is behind and the one who finished early. Its front matter states that it contains no classroom observation.' },
  { slug: 'pronunciation-handbook', file: 'IEFC Pronunciation Handbook.pdf',
    title: 'IEFC Pronunciation Handbook',
    collection: 'Teaching and Assessment', audience: 'Students and teachers',
    note: 'The pronunciation targets by name, level by level, with what each one is and how it is marked. The reference behind every recording in the Listening Lab.' },
  { slug: 'listening-scripts', file: 'IEFC Listening Scripts.pdf',
    title: 'IEFC Listening Scripts',
    collection: 'Teaching and Assessment', audience: 'Teachers',
    note: 'All 120 listening sets in full script, with the speakers marked and the features each set targets. The audio has not been produced; the scripts are complete and are published as scripts.' },

  // ── Student material ──────────────────────────────────────────────
  { slug: 'student-workbook-level-1', file: 'IEFC Level I Student Workbook.pdf',
    title: 'IEFC Level I Student Workbook',
    collection: 'Student Material', audience: 'Students',
    note: 'The Level I exercises as a printable book, for a learner who wants the work away from a screen. Free to download, print and photocopy.' },

  // ── The Press itself ──────────────────────────────────────────────
  { slug: 'publishing-constitution', file: 'WEC Press — The Publishing Constitution.pdf',
    title: 'WEC Press — The Publishing Constitution',
    collection: 'The Press', audience: 'Institutional',
    note: 'What the Press may publish, who may review it, and the separations it holds — author is never reviewer. The instrument the imprint is bound by.' },
  { slug: 'canon-index', file: 'WEC Canon Index.pdf',
    title: 'WEC Canon Index',
    collection: 'The Press', audience: 'Institutional',
    note: 'Every volume the Press has produced or planned, with what each one requires and whether the material for it exists. Computed against the academic record rather than typed.' },
  { slug: 'editorial-bible', file: 'IEFC Internal Editorial Bible.pdf',
    title: 'IEFC Internal Editorial Bible',
    collection: 'The Press', audience: 'Institutional',
    note: 'The house standard every volume is set to: orthography, terminology, citation, and the rules that keep twelve books reading as one press.' },
  { slug: 'production-specifications', file: 'IEFC Production Specifications.pdf',
    title: 'IEFC Production Specifications',
    collection: 'The Press', audience: 'Institutional',
    note: 'Trim sizes, margins, type sizes, paper and binding for each format. Published so that anyone can reproduce a volume to the same specification.' },

  // ── Cover artwork ─────────────────────────────────────────────────
  { slug: 'cover-artwork-curriculum', file: 'IEFC Cover Artwork.pdf',
    title: 'IEFC Complete Curriculum — Cover Artwork',
    collection: 'Cover Artwork', audience: 'Institutional',
    note: 'Print-ready cover, supplied so a licensed reprint carries the correct one.' },
  { slug: 'cover-artwork-curriculum-student', file: 'IEFC Complete Curriculum (Student Edition) — Cover Artwork.pdf',
    title: 'IEFC Complete Curriculum, Student Edition — Cover Artwork',
    collection: 'Cover Artwork', audience: 'Institutional',
    note: 'Print-ready cover for the Student Edition.' },
  { slug: 'cover-artwork-architecture', file: 'IEFC Programme Architecture (Institutional Edition) — Cover Artwork.pdf',
    title: 'IEFC Programme Architecture — Cover Artwork',
    collection: 'Cover Artwork', audience: 'Institutional',
    note: 'Print-ready cover for the Institutional Edition.' },
];

// ── MEASURE, NEVER ASSERT ────────────────────────────────────────────
// Sizes are read off the files. A published figure that was typed is a
// figure that goes stale on the next rebuild, and a download size is
// exactly the kind of small claim nobody ever re-checks.
const rows = [];
const missing = [];
for (const v of VOLUMES) {
  const full = path.join(PUB, v.file);
  if (!existsSync(full)) { missing.push(v.file); continue; }
  const bytes = statSync(full).size;
  rows.push({
    ...v,
    bytes,
    mb: (bytes / 1048576).toFixed(1),
    oversize: bytes > MAX_BYTES,
    href: `/library/${v.slug}.pdf`,
    source: `/publication/${encodeURIComponent(v.file)}`,
  });
}

if (missing.length) {
  throw new Error(
    `build-library: ${missing.length} registered volume(s) are not in publication/:\n  `
    + missing.join('\n  ')
    + '\nEither the volume has not been built or the register names it wrongly. '
    + 'A Library that lists a book it cannot serve is worse than one that lists fewer.');
}

// ── THE REGISTER, WRITTEN OUT ────────────────────────────────────────
// data/library.json is what pages/press-library.html and
// tests/library.test.mjs both read, so the page, the redirects and the
// tests cannot disagree about what the College publishes.
const served = rows.filter((r) => !r.oversize);
const out = {
  _: [
    'GENERATED by scripts/build-library.mjs — do not edit by hand.',
    'Sizes are measured from publication/, never typed.',
    'oversize: true means the file exceeds the 25 MiB Cloudflare Pages',
    'per-file limit and cannot be served from this host. That is a',
    'hosting constraint and the Library says so in those words.',
  ],
  generated_from: 'publication/',
  max_bytes: MAX_BYTES,
  total: rows.length,
  downloadable: served.length,
  total_bytes: rows.reduce((n, r) => n + r.bytes, 0),
  collections: [...new Set(rows.map((r) => r.collection))],
  volumes: rows,
};
writeFileSync(path.join(ROOT, 'data', 'library.json'), JSON.stringify(out, null, 2) + '\n');

// ── THE CLEAN URLS ───────────────────────────────────────────────────
const OPEN = '# >>> GENERATED FROM scripts/build-library.mjs — DO NOT EDIT BY HAND';
const CLOSE = '# <<< END LIBRARY';
const width = Math.max(...served.map((r) => r.href.length));
const block = `${OPEN}
#
# The Library's citable URLs. Each one maps a stable slug onto the file
# the publication pipeline writes, so a volume rebuilt under its own
# name is live immediately and no PDF is duplicated into this repo.
#
# 200 rather than 301: the slug IS the address the College publishes and
# prints. A redirect would make the ugly path the real one.
#
${served.map((r) => `${r.href.padEnd(width)}  ${r.source}  200`).join('\n')}
${CLOSE}`;

const FILE = path.join(ROOT, '_redirects');
let text = readFileSync(FILE, 'utf8');
if (text.includes(OPEN)) {
  const start = text.indexOf(OPEN);
  const end = text.indexOf(CLOSE) + CLOSE.length;
  if (end < start) throw new Error('_redirects: the library markers are out of order.');
  text = text.slice(0, start) + block + text.slice(end);
} else {
  text = `${text.trimEnd()}\n\n${block}\n`;
}
writeFileSync(FILE, text);

const oversize = rows.filter((r) => r.oversize);
console.log(`library: ${served.length} of ${rows.length} volumes served, `
  + `${(out.total_bytes / 1048576).toFixed(0)} MB registered.`);
for (const r of oversize) {
  console.log(`  over 25 MiB, on request only: ${r.title} (${r.mb} MB)`);
}

// ─────────────────────────────────────────────────────────────────────
// THE LIBRARY PAGE, IN BOTH LANGUAGES
// ─────────────────────────────────────────────────────────────────────
// Generated from the register above rather than hand-written, for the
// reason recorded in tests/level-generators.test.mjs: a page listing
// sixteen files, their sizes and their URLs is a page that will drift
// from the files the moment anybody rebuilds a volume. The prose is
// authored — in the register — and the assembly is not.

const LANG = {
  en: {
    dir: 'ltr', base: '',
    eyebrow: 'WEC Press &middot; The Library',
    h1: 'Read the whole of it before you pay for any of it.',
    stake: 'Most institutions publish a prospectus and keep the curriculum. <strong>This College publishes the curriculum</strong> &mdash; every lesson, every rubric, every pass mark, every pronunciation target &mdash; as typeset volumes you can download now, without an account and without asking.',
    lede: 'Fourteen volumes of the College&rsquo;s own academic work, free to download, print and quote. No registration, no email address, no licence to accept.',
    facts: [['Volumes', 'V'], ['Downloadable', 'D'], ['Free', 'Always'], ['Account needed', 'None']],
    leafLabel: 'The Library',
    rubric: 'What the College has produced, and where to get it.',
    h2: 'The volumes, by collection.',
    lede2: 'Grouped the way a reader looks for them. Every size is measured from the file, not typed.',
    audience: 'For',
    download: 'Download',
    onRequest: 'On request',
    overNote: 'Over the 25&nbsp;MB limit this host accepts for a single file. That is a hosting constraint and nothing else: the volume is supplied in full on request, and the same material is downloadable above in the Flagship Curriculum and the Programme Architecture.',
    citeLabel: 'How to cite, and what you may do with these',
    cite: 'Cite as <em>Worldwide English College</em>, WEC Press, with the volume title and the edition year. You may download, print, photocopy and quote any volume here for teaching or study, including in another institution&rsquo;s classroom. You may not present the College&rsquo;s material as another body&rsquo;s work, and you may not sell it. Nothing here has been reviewed by anyone who did not write it &mdash; <a href="/press/#review">On review</a> says exactly what that means and offers a copy to anyone willing to change it.',
    ctaH2: 'The curriculum is open. The programme is the part you enrol in.',
    ctaA: ['/academics/#levels', 'The Six Levels'],
    ctaB: ['/admissions/tuition/#ladder', 'What It Costs'],
    onRequestCta: 'Request a volume',
    // The volumes are English documents in both editions, so the
    // English page needs no marker and the Arabic page needs one.
    enNote: '',
  },
  ar: {
    dir: 'rtl', base: '/ar',
    eyebrow: 'مطبعة الكلية &middot; المكتبة',
    h1: 'اقرأه كله قبل أن تدفع في أيٍّ منه.',
    stake: 'تنشر أكثر المؤسسات كُتيّبًا تعريفيًا وتحتفظ بالمنهج. <strong>وهذه الكلية تنشر المنهج</strong> &mdash; كل درس، وكل معيار تصحيح، وكل درجة نجاح، وكل هدف نطق &mdash; مجلداتٍ مركَّبة تستطيع تنزيلها الآن، بلا حساب وبلا استئذان.',
    lede: 'أربعة عشر مجلدًا من العمل الأكاديمي للكلية، حرةَ التنزيل والطباعة والاقتباس. لا تسجيل، ولا بريد إلكتروني، ولا ترخيص تقبله.',
    facts: [['المجلدات', 'V'], ['قابلة للتنزيل', 'D'], ['التكلفة', 'مجانًا'], ['الحساب', 'غير مطلوب']],
    leafLabel: 'المكتبة',
    rubric: 'ما أنتجته الكلية، ومن أين تحصل عليه.',
    h2: 'المجلدات، بحسب المجموعة.',
    lede2: 'مجموعة بالطريقة التي يبحث بها القارئ عنها. وكل حجم مقيس من الملف لا مكتوب باليد.',
    audience: 'لِمَن',
    download: 'تنزيل',
    onRequest: 'بالطلب',
    overNote: 'يتجاوز حدَّ الـ25&nbsp;ميجابايت الذي يقبله هذا المستضيف للملف الواحد. وهذا قيد استضافة لا غير: يُسلَّم المجلد كاملًا بالطلب، والمادة نفسها قابلة للتنزيل أعلاه في المنهج الموجز وفي بنية البرنامج.',
    citeLabel: 'كيف تُستشهد، وما يُباح لك بها',
    cite: 'استشهد بها بوصفها من إصدار <em>الكلية العالمية للغة الإنجليزية</em>، مطبعة الكلية، مع عنوان المجلد وسنة الطبعة. ويُباح لك تنزيل أي مجلد هنا وطباعته ونسخه والاقتباس منه للتدريس أو الدراسة، بما في ذلك في صفٍّ تابع لمؤسسة أخرى. ولا يُباح لك أن تَعرِض مادة الكلية بوصفها عمل جهة أخرى، ولا أن تبيعها. ولم يراجع شيئًا هنا أحدٌ لم يكتبه &mdash; و<a href="/ar/press/#review">عن المراجعة</a> يقول ما يعنيه ذلك بالضبط، ويعرض نسخة على كل من يستعد لتغيير ذلك.',
    ctaH2: 'المنهج مفتوح. والبرنامج هو ما تلتحق به.',
    ctaA: ['/ar/academics/#levels', 'المستويات الستة'],
    ctaB: ['/ar/admissions/tuition/#ladder', 'ما تكلفته'],
    onRequestCta: 'اطلب مجلدًا',
    // tests/bilingual-links.test.mjs: a crossing into English is marked
    // in its own anchor text, never in a footnote, because a reader
    // scanning a list of downloads reads the link.
    enNote: ' (بالإنجليزية)',
  },
};

// The Arabic titles and notes live beside the English ones so a
// translator edits one file, not two — and so a volume can never appear
// in one edition and not the other.
const AR = {
  'The Curriculum': 'المنهج', 'Teaching and Assessment': 'التدريس والتقييم',
  'Student Material': 'مادة الطالب', 'The Press': 'المطبعة', 'Cover Artwork': 'أعمال الأغلفة',
  Institutional: 'المؤسسات', Students: 'الطلاب', Everyone: 'الجميع',
  Teachers: 'المدرّسون', 'Teachers and examiners': 'المدرّسون والممتحنون',
  'Students and teachers': 'الطلاب والمدرّسون',
};

const GROUND = ['section--light grain', 'section--paper grain', 'section--dark grain aurora',
  'section--light grain', 'section--paper grain'];
const ROMAN = ['I', 'II', 'III', 'IV', 'V'];
const ARNUM = ['١', '٢', '٣', '٤', '٥'];
const PLATE = ['library-plate.svg', 'award-standard.svg', 'authority-chain.svg',
  'competency-wheel.svg', 'crest-plate.svg'];
// Columns by volume count, so no collection ends on an orphaned card.
// Four volumes in a three-column grid render 3 + 1, which puts one book
// alone on a second row and reads as emphasis rather than as a list —
// the same fault the tuition ladder had, and the same fix: state the
// columns instead of letting them be inferred. Never a remainder of 1.
const COLS = { 1: 2, 2: 2, 3: 3, 4: 2, 5: 3, 6: 3, 7: 4, 8: 4 };

const SLUG = {
  'The Curriculum': 'curriculum', 'Teaching and Assessment': 'teaching',
  'Student Material': 'student-material', 'The Press': 'the-press',
  'Cover Artwork': 'cover-artwork',
};
const ICON = { 'The Curriculum': 'i-columns', 'Teaching and Assessment': 'i-scales',
  'Student Material': 'i-book', 'The Press': 'i-portico', 'Cover Artwork': 'i-crest' };

function page(lang) {
  const L = LANG[lang];
  const ar = lang === 'ar';
  const tr = (s) => (ar ? (AR[s] || s) : s);
  const facts = L.facts.map(([dt, dd]) => {
    const v = dd === 'V' ? String(rows.length) : dd === 'D' ? String(served.length) : dd;
    return `      <div class="masthead__fact"><dt>${dt}</dt><dd>${v}</dd></div>`;
  }).join('\n');

  const leaves = out.collections.map((coll, i) => {
    const vols = rows.filter((r) => r.collection === coll);
    const dark = GROUND[i % GROUND.length].includes('--dark');
    const cards = vols.map((r) => {
      const dl = r.oversize
        ? `<a class="btn btn--outline magnetic" href="mailto:info@worldwencollege.co.uk?subject=${encodeURIComponent(r.title)}">${L.onRequestCta}</a>`
        : `<a class="btn btn--gold magnetic aurum aurum--twin" href="${r.href}" download>${L.download} &middot; ${r.mb}&nbsp;MB${L.enNote}</a>`;
      const note = ar ? (r.note_ar || r.note) : r.note;
      return `      <div class="card${dark ? ' card--dark' : ''} reveal tilt edge-lit${dark ? '' : ' edge-lit--light'} aurum">
        <span class="tilt__sheen" aria-hidden="true"></span>
        <span class="badge-dome${dark ? ' badge-dome--dark' : ''} badge-dome--lg gold-live"><svg class="icon" aria-hidden="true"><use href="#${ICON[coll] || 'i-book'}"/></svg></span>
        <span class="card__num">${L.audience} ${tr(r.audience).toLowerCase()}</span>
        <h3>${r.title}</h3>
        <p>${note}</p>${r.oversize ? `\n        <p class="form-note">${L.overNote}</p>` : ''}
        <div class="btn-row">${dl}</div>
      </div>`;
    }).join('\n');
    const anchor = SLUG[coll] || `collection-${i + 1}`;
    return `<section class="leaf ${GROUND[i % GROUND.length]}" id="${anchor}" data-contents="${tr(coll)}">
  <span class="leaf__ornament" aria-hidden="true" style="--leaf-plate:url(/assets/art/${PLATE[i % PLATE.length]})"></span>
  <div class="container leaf__grid">
    <div class="leaf__margin">
      <span class="leaf__num foil">${ar ? ARNUM[i] : ROMAN[i]}</span>
      <span class="leaf__label">${tr(coll)}</span>
    </div>
    <div class="leaf__body reveal">
      <div class="section-head">
      <h2>${tr(coll)}</h2>
    </div>
    <div class="grid grid--${COLS[vols.length] || 3}">
${cards}
    </div>
  </div>
  </div>
</section>`;
  }).join('\n\n');

  return `<!--
  THE LIBRARY — GENERATED by scripts/build-library.mjs. Do not edit.
  Every volume, size and URL comes from data/library.json, which is
  measured from publication/. Edit the register in the script.
-->
<section class="page-hero masthead guilloche grain">
  <canvas class="constellation" aria-hidden="true"></canvas>
  <img class="masthead__plate" src="/assets/art/library-plate.svg" alt="" aria-hidden="true" width="320" height="400" data-depth="0.05">
  <div class="container masthead__inner">
    <p class="masthead__rule" aria-hidden="true"><svg class="icon" aria-hidden="true"><use href="#i-book"/></svg></p>

    <p class="masthead__eyebrow">${L.eyebrow}</p>
    <h1>${L.h1}</h1>
    <p class="masthead__stake">${L.stake}</p>
    <p class="lede">${L.lede}</p>

    <dl class="masthead__facts">
${facts}
    </dl>
    <p class="masthead__rule masthead__rule--foot" aria-hidden="true"><svg class="icon" aria-hidden="true"><use href="#i-laurel"/></svg></p>
  </div>
</section>

${leaves}

<section class="leaf section--light grain" id="citation" data-contents="${ar ? 'الاستشهاد' : 'Citation'}">
  <span class="leaf__ornament" aria-hidden="true" style="--leaf-plate:url(/assets/art/portico.svg)"></span>
  <div class="container leaf__grid">
    <div class="leaf__margin">
      <span class="leaf__num foil">${ar ? '٦' : 'VI'}</span>
      <span class="leaf__label">${ar ? 'الاستشهاد والاستعمال' : 'Citation and Use'}</span>
    </div>
    <div class="leaf__body reveal">
      <div class="callout">
        <span class="callout__label">${L.citeLabel}</span>
        <p>${L.cite}</p>
      </div>
    </div>
  </div>
</section>

<section class="section--dark cta-band">
  <div class="container reveal">
    <h2>${L.ctaH2}</h2>
    <div class="btn-row u-center">
      <a href="${L.ctaA[0]}" class="btn btn--gold magnetic aurum aurum--twin">${L.ctaA[1]}</a>
      <a href="${L.ctaB[0]}" class="btn btn--outline magnetic">${L.ctaB[1]}</a>
    </div>
  </div>
</section>
`;
}

writeFileSync(path.join(ROOT, 'pages', 'press-library.html'), page('en'));
writeFileSync(path.join(ROOT, 'pages', 'press-library.ar.html'), page('ar'));

// ── THE MANIFEST ENTRIES ─────────────────────────────────────────────
const MAN = path.join(ROOT, 'pages', 'manifest.json');
const manifest = JSON.parse(readFileSync(MAN, 'utf8'));
const entries = Array.isArray(manifest) ? manifest : manifest.pages;
const ENTRIES = [
  { slug: 'press-library', output: 'press/library/index.html',
    title: 'The Library &mdash; WEC Press',
    description: `${served.length} volumes of the College's own curriculum, assessment and teaching work, free to download without an account.`,
    contentFile: 'press-library.html', lang: 'en', dir: 'ltr',
    altHref: '/ar/press/library/', extraCss: ['/css/pillar.css', '/css/press.css'], contents: true },
  { slug: 'press-library-ar', output: 'ar/press/library/index.html',
    title: 'المكتبة — مطبعة الكلية',
    description: `${served.length} مجلدًا من منهج الكلية وتقييمها وعملها التدريسي، حرةَ التنزيل بلا حساب.`,
    contentFile: 'press-library.ar.html', lang: 'ar', dir: 'rtl',
    altHref: '/press/library/', extraCss: ['/css/pillar.css', '/css/press.css'], contents: true },
];
for (const e of ENTRIES) {
  const i = entries.findIndex((x) => x.slug === e.slug);
  if (i >= 0) entries[i] = { ...entries[i], ...e }; else entries.push(e);
}
writeFileSync(MAN, JSON.stringify(manifest, null, 2) + '\n');
console.log(`library: pages/press-library{,.ar}.html written, manifest updated.`);
