#!/usr/bin/env node
// Renders the faculty roster into pages/faculty.html and
// pages/faculty.ar.html from docs/faculty-register.md.
//
// Why a generator rather than hand-edited markup: the roster exists in
// three places that have to agree — the register, the English page and
// the Arabic page — and hand-editing three copies is how the Arabic
// site ends up saying the College is "currently recruiting" while the
// English site lists twenty staff. One source, two outputs, and
// tests/faculty-roster.test.mjs checks the built result.
//
// Run this, then `npm run build`, which assembles pages/ into the
// served directories. Both are wired into `npm run faculty`.
//
// It edits the SOURCE files in pages/, never the generated
// faculty/index.html — tests/generated-pages.test.mjs fails the build
// if a generated page is edited directly, because the next build would
// silently discard the change.

const fs = require('fs');
const path = require('path');
const { emitPage, reportEmit } = require('./lib/emit-page');

const ROOT = path.resolve(__dirname, '..');
const REGISTER = path.join(ROOT, 'docs/faculty-register.md');
const md = fs.readFileSync(REGISTER, 'utf8');

// --- parse the register -------------------------------------------------
function table(heading, stopAt) {
  const start = md.indexOf(heading);
  if (start < 0) throw new Error(`Register is missing the "${heading}" table`);
  const from = start + heading.length;
  const end = stopAt ? md.indexOf(stopAt, from) : -1;
  return md.slice(from, end < 0 ? md.length : end)
    .split('\n')
    .filter((l) => l.trim().startsWith('|'))
    .map((l) => l.trim().replace(/^\|/, '').replace(/\|$/, '').split('|').map((c) => c.trim()))
    .filter((c) => !/^-+$/.test(c[0]) && c[0] !== 'Name' && c[0] !== 'Position (register)');
}

const academic = table('## Academic staff', '## Supporting tutors');
const tutors = table('## Supporting tutors', '\n---');
const arabicRows = table('## Arabic renderings', '\n---');

if (academic.length !== 10 || tutors.length !== 10) {
  throw new Error(`Expected 10 academic and 10 tutors, parsed ${academic.length} and ${tutors.length}`);
}

// Two "English Tutor" rows exist, masculine and feminine. Key the
// feminine one separately rather than letting the second overwrite the
// first, which would silently give every tutor the same form.
const AR = new Map();
for (const [en, ar] of arabicRows) AR.set(en, ar);
const TUTOR_M = AR.get('English Tutor');
const TUTOR_F = AR.get('English Tutor (feminine)');
if (!TUTOR_M || !TUTOR_F) throw new Error('Register is missing a gendered English Tutor rendering');

function arabicPosition(name, position) {
  if (position === 'English Tutor') return /^(Mrs\.|Ms\.)/.test(name) ? TUTOR_F : TUTOR_M;
  const ar = AR.get(position);
  if (!ar) throw new Error(`No Arabic rendering in the register for position: ${position}`);
  return ar;
}

const esc = (s) => s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
// Latin names and English qualifications inside RTL prose need an
// explicit direction, or the punctuation reflows around them.
const ltr = (s) => `<span dir="ltr">${esc(s)}</span>`;

// --- English ------------------------------------------------------------
const enCards = academic.map(([n, p, bg, ex]) => `      <div class="card">
        <span class="card__num">${esc(p)}</span>
        <h3>${esc(n)}</h3>
        <p class="faculty__creds">${esc(bg)}</p>
        <p>${esc(ex)}</p>
      </div>`).join('\n');

const enRows = tutors.map(([n, p, bg]) =>
  `          <tr><td>${esc(n)}</td><td>${esc(p)}</td><td>${esc(bg)}</td></tr>`).join('\n');

const EN = `<section class="section--paper section-pad" id="roster">
  <div class="container reveal">
    <div class="section-head">
      <span class="module-marker">Our Faculty</span>
      <h2>The academic team.</h2>
      <p class="lede">Ten academic staff lead the <span dir="ltr">IEFC</span> programme, supported by ten tutors. Positions and qualifications below are those held on record by the College.</p>
    </div>
    <div class="grid grid--2">
${enCards}
    </div>
  </div>
</section>

<section class="section--light section-pad" id="tutors">
  <div class="container reveal">
    <div class="section-head">
      <span class="module-marker">Supporting Tutors</span>
      <h2>Teaching staff.</h2>
      <p class="lede">Tutors deliver timetabled instruction and small-group speaking practice across the six levels.</p>
    </div>
    <div class="table-scroll">
      <table class="ledger">
        <thead><tr><th scope="col">Name</th><th scope="col">Position</th><th scope="col">Qualifications</th></tr></thead>
        <tbody>
${enRows}
        </tbody>
      </table>
    </div>
    <div class="callout">
      <span class="callout__label">About This Roster</span>
      <p>Positions and qualifications are held on record by the College. <span dir="ltr">WEC</span> has not yet appointed an External Examiner &mdash; the independent post required before any award is conferred &mdash; and the College holds no accreditation. Both are stated in full on <a href="/about/#status">About &middot; Institutional Status</a>.</p>
    </div>
    <div class="btn-row">
      <a href="mailto:info@worldwencollege.co.uk?subject=Faculty%20Enquiry" class="btn btn--red">Enquire About Teaching at WEC</a>
    </div>
  </div>
</section>`;

// --- Arabic -------------------------------------------------------------
const arCards = academic.map(([n, p, bg]) => `      <div class="card">
        <span class="card__num">${esc(arabicPosition(n, p))}</span>
        <h3>${ltr(n)}</h3>
        <p class="faculty__creds">${ltr(bg)}</p>
      </div>`).join('\n');

const arRows = tutors.map(([n, p, bg]) =>
  `          <tr><td>${ltr(n)}</td><td>${esc(arabicPosition(n, p))}</td><td>${ltr(bg)}</td></tr>`).join('\n');

const AR_SECTION = `<section class="section--paper section-pad" id="roster">
  <div class="container reveal">
    <div class="section-head">
      <span class="module-marker">هيئة التدريس</span>
      <h2>الفريق الأكاديمي.</h2>
      <p class="lede">يقود برنامج <span dir="ltr">IEFC</span> عشرة من أعضاء هيئة التدريس، يعاونهم عشرة مدرّسين. المناصب والمؤهلات المذكورة أدناه هي المسجّلة لدى الكلية.</p>
    </div>
    <div class="grid grid--2">
${arCards}
    </div>
  </div>
</section>

<section class="section--light section-pad" id="tutors">
  <div class="container reveal">
    <div class="section-head">
      <span class="module-marker">المدرّسون المساعدون</span>
      <h2>الكادر التدريسي.</h2>
      <p class="lede">يتولى المدرّسون الحصص المجدولة وحلقات التحدث في مجموعات صغيرة عبر المستويات الستة.</p>
    </div>
    <div class="table-scroll">
      <table class="ledger">
        <thead><tr><th scope="col">الاسم</th><th scope="col">المنصب</th><th scope="col">المؤهلات</th></tr></thead>
        <tbody>
${arRows}
        </tbody>
      </table>
    </div>
    <div class="callout">
      <span class="callout__label">بشأن هذا السجل</span>
      <p>المناصب والمؤهلات مسجّلة لدى الكلية. لم تعيّن الكلية بعد ممتحنًا خارجيًا &mdash; وهو المنصب المستقل المطلوب قبل منح أي شهادة &mdash; ولا تحمل الكلية أي اعتماد. وكلاهما موضّح بالكامل في <a href="/ar/about/#status">عن الكلية · الوضع المؤسسي</a>.</p>
    </div>
    <div class="btn-row">
      <a href="mailto:info@worldwencollege.co.uk?subject=Faculty%20Enquiry" class="btn btn--red">استفسر عن التدريس في الكلية</a>
    </div>
  </div>
</section>`;

// --- splice into the page sources --------------------------------------
// The roster replaces the old "#status" recruiting section and stops at
// the closing CTA band, which both language sources share. The result
// goes through emitPage() rather than a bare writeFileSync: this
// generator's template does not know about hand-added presentation
// (the atelier material-law classes on each card, a rewritten callout,
// per-person icons) and must not silently strip it the next time
// somebody edits docs/faculty-register.md. If the page has drifted from
// what this generator last produced, the guard refuses and the page —
// not the template — stays the source of record. See
// scripts/lib/emit-page.js.
function splice(rel, section) {
  const p = path.join(ROOT, rel);
  const src = fs.readFileSync(p, 'utf8');
  const start = src.indexOf('<section class="section--light section-pad" id="status">');
  const alt = src.indexOf('<section class="section--paper section-pad" id="roster">');
  const from = start >= 0 ? start : alt;
  if (from < 0) throw new Error(`${rel}: found neither the #status section nor a previous #roster to replace`);
  const end = src.indexOf('<section class="section--dark cta-band">', from);
  if (end < 0) throw new Error(`${rel}: no closing cta-band section after the roster`);
  return src.slice(0, from) + section + '\n\n' + src.slice(end);
}

const emitted = [
  ['pages/faculty.html', EN],
  ['pages/faculty.ar.html', AR_SECTION],
].map(([rel, section]) => {
  const file = path.join(ROOT, rel);
  return { file, result: emitPage(file, splice(rel, section)) };
});

// --- manifest descriptions ---------------------------------------------
// The generated pages take their <meta name="description"> from the
// manifest, so editing the built file would be discarded by the next
// build. Update the source of that string instead.
const MANIFEST = path.join(ROOT, 'pages/manifest.json');
const manifest = JSON.parse(fs.readFileSync(MANIFEST, 'utf8'));
const entries = Array.isArray(manifest) ? manifest : manifest.pages;
const DESCRIPTIONS = {
  // A meta description is a plain-text attribute, so no markup goes in
  // it. In the English one the wrapper was inert anyway; in the Arabic
  // one the direction still has to be stated, and the Unicode isolates
  // U+2066/U+2069 do it without markup.
  faculty: 'The academic staff and tutors who deliver the IEFC programme at WEC-LC, and the teaching standards they are appointed against.',
  'faculty-ar': 'أعضاء هيئة التدريس والمدرّسون الذين يقدّمون برنامج ⁦IEFC⁩ في الكلية، والمعايير التدريسية التي عُيّنوا وفقها.',
};
let manifestChanged = false;
for (const e of entries) {
  if (DESCRIPTIONS[e.slug] && e.description !== DESCRIPTIONS[e.slug]) {
    e.description = DESCRIPTIONS[e.slug];
    manifestChanged = true;
  }
}
if (manifestChanged) {
  fs.writeFileSync(MANIFEST, JSON.stringify(manifest, null, 2) + '\n');
}

console.log(`Faculty roster: ${academic.length} academic, ${tutors.length} tutors.`);
console.log(manifestChanged ? 'Updated: pages/manifest.json' : 'pages/manifest.json already up to date.');
console.log('Now run `npm run build` to regenerate the served pages.');

reportEmit('build-faculty.js', emitted);
