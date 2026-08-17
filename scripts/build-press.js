#!/usr/bin/env node
/**
 * AIPC PRESS AND THE LIBRARY — six pages.
 *
 * ────────────────────────────────────────────────────────────────────
 * WHAT MAKES THESE PAGES POSSIBLE
 * ────────────────────────────────────────────────────────────────────
 * Almost nothing else on this site can point at a finished object. The
 * Press can: there are typeset volumes on disk, produced from the same
 * record the platform teaches from, and they exist whether or not
 * anyone has enrolled. This is the one section of the College where the
 * work is simply done and can be counted.
 *
 * So the catalogue is READ from the publication directory rather than
 * typed. A title that is listed here is a file that exists. A title
 * that has not been produced does not appear, however far along it is —
 * a catalogue that lists intentions is a prospectus wearing a
 * catalogue's clothes.
 *
 * ────────────────────────────────────────────────────────────────────
 * THE PAGE THAT COSTS SOMETHING
 * ────────────────────────────────────────────────────────────────────
 * /press/review/ states that every volume the College has produced is
 * unreviewed by anyone who did not write it. That is the single most
 * damaging true sentence available about this body of work, and a Press
 * section that omitted it would be advertising rather than publishing.
 * It is given its own page rather than a footnote, because burying it
 * is the same as not saying it.
 *
 * ────────────────────────────────────────────────────────────────────
 * WHY NOTHING IS OFFERED FOR DOWNLOAD
 * ────────────────────────────────────────────────────────────────────
 * The publication directory is excluded from the deploy surface — three
 * of the volumes exceed Cloudflare's 25 MiB per-file limit, and an
 * earlier deploy failed silently on exactly that. So these pages
 * describe the catalogue and give an address to request from. Offering
 * a download the site does not serve would be worse than offering none.
 */

const fs = require('fs');
const path = require('path');

const ROOT = path.resolve(__dirname, '..');
const ltr = (v) => `<span dir="ltr">${v}</span>`;
const esc = (s) => String(s ?? '')
  .replace(/\s--\s/g, ' — ')
  .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');

// ── the catalogue, read from what actually exists ────────────────────
const PUB_DIR = path.join(ROOT, 'publication');
const files = fs.readdirSync(PUB_DIR).filter((f) => /\.(pdf|docx)$/i.test(f));
if (!files.length) throw new Error('No published volumes found — the catalogue would be empty.');

const sizeMb = (f) => fs.statSync(path.join(PUB_DIR, f)).size / (1024 * 1024);
const titleOf = (f) => f.replace(/\.(pdf|docx)$/i, '');

// Cover artwork is a production asset, not a volume. Everything else is
// a volume, and is classified by who it is for.
const artwork = files.filter((f) => /Cover Artwork/i.test(f));
const volumes = files.filter((f) => !/Cover Artwork/i.test(f) && /\.pdf$/i.test(f));

const AUDIENCE = {
  'IEFC Complete Curriculum': 'Institutional',
  'IEFC Complete Curriculum (Student Edition)': 'Learners',
  'IEFC Complete Curriculum (Large Print)': 'Learners',
  'IEFC Flagship Curriculum': 'Institutional',
  'IEFC Programme Architecture (Institutional Edition)': 'Institutional',
  'IEFC Assessment Handbook': 'Examiners',
  'IEFC Level I Student Workbook': 'Learners',
  "IEFC Level I Teacher's Companion": 'Teachers',
  'IEFC Listening Scripts': 'Teachers',
  'IEFC Pronunciation Handbook': 'Teachers',
  'IEFC Production Specifications': 'Internal',
  'IEFC Internal Editorial Bible': 'Internal',
  'AIPC Canon Index': 'Institutional',
  'AIPC Press — The Publishing Constitution': 'Institutional',
};
for (const f of volumes) {
  if (!AUDIENCE[titleOf(f)]) {
    throw new Error(`"${titleOf(f)}" has been produced but is not classified. Add it to AUDIENCE `
      + 'rather than letting the catalogue print a volume with no stated readership.');
  }
}

const publicVolumes = volumes.filter((f) => AUDIENCE[titleOf(f)] !== 'Internal')
  .sort((a, b) => titleOf(a).localeCompare(titleOf(b)));
const internalVolumes = volumes.filter((f) => AUDIENCE[titleOf(f)] === 'Internal')
  .sort((a, b) => titleOf(a).localeCompare(titleOf(b)));
const oversize = volumes.filter((f) => sizeMb(f) > 25);

const card = (num, title, body) => `      <div class="card">
        <span class="card__num">${esc(num)}</span>
        <h3>${esc(title)}</h3>
        <p>${body}</p>
      </div>`;
const darkCard = (num, title, body) => `      <div class="card card--dark">
        <span class="card__num">${esc(num)}</span>
        <h3>${esc(title)}</h3>
        <p>${body}</p>
      </div>`;

const hero = (eyebrow, h1, lede, extra = '') => `<section class="section--dark section-pad">
  <div class="container">
    <span class="eyebrow">${esc(eyebrow)}</span>
    <h1>${h1}</h1>
    <p class="lede">${lede}</p>
    ${extra}
  </div>
</section>`;

const cta = (h2, primary, primaryHref, secondary, secondaryHref) =>
  `<section class="section--dark cta-band">
  <div class="container reveal">
    <h2>${esc(h2)}</h2>
    <div class="btn-row u-center">
      <a href="${primaryHref}" class="btn btn--gold">${esc(primary)}</a>
      <a href="${secondaryHref}" class="btn btn--outline">${esc(secondary)}</a>
    </div>
  </div>
</section>
`;

const requestBlock = `<div class="callout">
      <span class="callout__label">How to obtain a volume</span>
      <p>Nothing is published for download on this site. Volumes are typeset for print and three
        of them are too large to serve here at all. Request any of them from
        <a href="mailto:info@worldwencollege.co.uk?subject=AIPC%20Press%20%E2%80%94%20volume%20request">info@worldwencollege.co.uk</a>,
        naming the title. They are supplied without charge to teachers, reviewers and anyone
        assessing the College&rsquo;s academic work.</p>
    </div>`;

const PAGES = {};

// 1 · AIPC PRESS ───────────────────────────────────────────────────────
PAGES.press = {
  slug: 'press', output: 'press/index.html', file: 'press.html',
  contents: true,
  title: 'AIPC Press &mdash; Albalagh International Premium College',
  description: 'The publishing arm of Albalagh International Premium College: what it has produced, the rule '
    + 'it publishes under, and the review it has not yet had.',
  body: `${hero('AIPC Press', 'The College&rsquo;s publishing arm.',
    `${publicVolumes.length} volumes produced, typeset for print, composed from the same record `
    + 'the programme is taught from. This is the part of the College where the work is finished '
    + 'and can be counted rather than described.',
    `<div class="btn-row">
      <a href="/press/catalogue/" class="btn btn--gold">The Catalogue</a>
      <a href="/press/#review" class="btn btn--outline">On Review</a>
    </div>`)}

<section class="section--light section-pad">
  <div class="container reveal">
    <div class="section-head">
      <span class="module-marker">What It Is For</span>
      <h2>An imprint exists to make claims checkable.</h2>
      <p class="lede">A curriculum that lives only in a database can be changed without anyone
        noticing. A printed volume cannot.</p>
    </div>
    <div class="grid grid--3">
${card('One', 'To fix a version', 'A volume is a version of the programme that can be held, dated and disagreed with. Once printed, a claim cannot be quietly revised out of existence &mdash; which is precisely what makes it worth reviewing.')}
${card('Two', 'To be examined by outsiders', 'An accreditation panel, an external examiner or a sceptical teacher can be handed a book. They cannot be handed a login and a promise. Publication is how a new institution makes itself inspectable.')}
${card('Three', 'To carry its own provenance', 'Every volume states what it rests on and what it does not. That is a house rule, not a preference &mdash; see <a href="/press/#standards">House standards</a>.')}
    </div>
  </div>
</section>

<section class="section--paper section-pad">
  <div class="container reveal">
    <div class="section-head">
      <span class="module-marker">The Rule It Publishes Under</span>
      <h2>Never publish to raise the count.</h2>
    </div>
    <div class="callout">
      <span class="callout__label">The standing instruction</span>
      <p>No volume is produced to increase the number of volumes. If a proposed title would not
        improve the education &mdash; a learner&rsquo;s study, a teacher&rsquo;s lesson, an
        examiner&rsquo;s marking &mdash; it is not built. Two planned titles have been formally
        withdrawn under this rule and their withdrawal is recorded rather than forgotten.</p>
    </div>
    <div class="grid grid--2">
${card('Why the rule is needed', 'A publishing programme rewards volume', 'Once a catalogue exists, the easiest way to make it look stronger is to add to it. The rule exists because that pressure is real and does not announce itself.')}
${card('What it costs', 'A shorter list than the College could produce', 'The register behind the Press holds 74 candidate resources. Producing all of them is possible; most of them would not improve anything, and the catalogue is shorter for it.')}
    </div>
  </div>
</section>

<section class="section--dark section-pad">
  <div class="container reveal">
    <div class="section-head">
      <span class="module-marker">The Position</span>
      <h2>Produced, and unreviewed.</h2>
    </div>

    <!-- The funnel. A short catalogue reads as a small operation unless
         you can see what it was selected from — so the register, the
         rule, what the rule cost, and the review gate that is still shut
         are drawn as one figure. Generated by
         scripts/art/generate-publication-funnel.mjs; the numbers are held
         against this page by tests/publication-press.test.mjs. -->
    <figure class="diagram diagram--wide">
      {{SVG:assets/art/publication-funnel.svg}}
      <figcaption class="diagram__caption">
        <svg class="icon" aria-hidden="true"><use href="#i-book"/></svg>
        The narrowing is a decision; the last stage is a vacancy
      </figcaption>
    </figure>

    <div class="grid grid--2">
${darkCard('Done', `${publicVolumes.length} volumes`, 'Composed, typeset, proofed and produced. Each one is a real object that can be requested and read today.')}
${darkCard('Not done', 'Reviewed by anyone independent', 'No Academic Reviewer has been appointed. Every volume the College has produced was reviewed, if at all, by the people who wrote it &mdash; which is to say not reviewed. This has its own page rather than a footnote.')}
    </div>
  </div>
</section>

<section class="section--light section-pad" id="standards" data-contents="House Standards">
  <div class="container reveal">
    <div class="section-head">
      <span class="module-marker">Rule One</span>
      <h2>Generated from the record, never maintained alongside it.</h2>
    </div>
    <div class="grid grid--2">
${card('What it prevents', 'A book that disagrees with the programme', 'A volume maintained by hand drifts from the curriculum within one revision, and every teacher who trusts it then teaches something the College no longer says. Composition from the source makes that drift impossible rather than unlikely.')}
${card('What it costs', 'The book cannot be improved in the book', 'Improving a sentence means improving the record it came from, which is slower and occasionally infuriating. It is also the only arrangement in which the improvement reaches the learners as well as the readers.')}
    </div>
  </div>
</section>

<section class="section--paper section-pad">
  <div class="container reveal">
    <div class="section-head">
      <span class="module-marker">Rule Two</span>
      <h2>One typographic system, four formats.</h2>
      <p class="lede">A house is recognisable because it is consistent, and consistency at this
        scale is enforced by a shared system rather than by remembering.</p>
    </div>
    <div class="grid grid--4">
${card('Reference', 'For consulting', 'Companions and handbooks &mdash; opened at a point rather than read through, so the page is built to be scanned and returned to.')}
${card('Practice', 'For working in', 'Workbooks, where the page has to leave room for a learner to write and still hold its structure.')}
${card('Flagship', 'For the whole programme', 'The curriculum in full, where the reader&rsquo;s problem is navigation across hundreds of pages rather than density on one.')}
${card('Scholarly', 'For examination', 'Institutional and architectural volumes, set for a reader who is checking rather than learning.')}
    </div>
  </div>
</section>

<section class="section--dark section-pad">
  <div class="container reveal">
    <div class="section-head">
      <span class="module-marker">Rule Three</span>
      <h2>Every claim carries its provenance.</h2>
    </div>
    <div class="grid grid--3">
${darkCard('On the page', 'Not in the preface', 'Where a volume states something a teacher will act on, the source of that statement is marked on the panel itself. A provenance note explained once in the front matter is a provenance note nobody reads.')}
${darkCard('Including absence', 'A category that appears nowhere', 'The Teacher&rsquo;s Companion marks each panel as derived, established or designed. The fourth mark &mdash; observed in a classroom &mdash; appears nowhere in the book, and the front matter says why rather than quietly dropping the category.')}
${darkCard('Counted, not asserted', 'The figures are measured from the pages', 'Front-matter counts are taken from the composed pages rather than from the database that fed them, because some entries render in a running head instead of as a panel. A count taken from the wrong place would be wrong in a way nobody would ever check.')}
    </div>
  </div>
</section>

<section class="section--light section-pad" id="review" data-contents="On Review">
  <div class="container reveal">
    <div class="section-head">
      <span class="module-marker">The Fact</span>
      <h2>Authored and reviewed by the same people is not reviewed.</h2>
    </div>
    <div class="grid grid--2">
${card('What was done', 'Internal checking, and a great deal of it', 'Volumes are proofed, cross-checked against the record, and verified automatically for internal consistency &mdash; sequence, arithmetic, terminology, coverage. That catches contradictions and errors of fact.')}
${card('What it cannot catch', 'Being wrong in a way the authors share', 'A shared assumption is invisible from inside. Whether a lesson teaches what it claims to teach, whether an assessment measures what it says it measures, whether the level is pitched where it says it is &mdash; none of that can be established by the people who decided it.')}
    </div>
  </div>
</section>

<section class="section--paper section-pad">
  <div class="container reveal">
    <div class="section-head">
      <span class="module-marker">Why It Is Not Simply Fixed</span>
      <h2>It requires a person, and the post is open.</h2>
    </div>
    <div class="grid grid--3">
${card('The post', 'Academic Reviewer', 'MA TESOL, Applied Linguistics or equivalent, with assessment experience. A defined number of days reading a defined list. It can be a consultancy engagement rather than a salaried role, and it is the appointment that would change more than any other.')}
${card('The separation', 'Author is not reviewer, ever', 'The College treats this as non-negotiable. Appointing an author to review their own work would produce a page saying &ldquo;reviewed&rdquo; and change nothing about the volumes, which is worse than the present position because it would be false.')}
${card('The invitation', 'The volumes are offered for review', 'Any suitably qualified reader willing to review a volume is offered a copy. Write to <a href="mailto:info@worldwencollege.co.uk?subject=Review%20of%20a%20AIPC%20Press%20volume">info@worldwencollege.co.uk</a>. Criticism is the point of the exercise, not a risk of it.')}
    </div>
  </div>
</section>

<section class="section--dark section-pad">
  <div class="container reveal">
    <div class="section-head">
      <span class="module-marker">The Commitment</span>
      <h2>What will happen when review begins.</h2>
    </div>
    <div class="grid grid--2">
${darkCard('Published', 'What review overturns, as an overturning', 'Findings will be recorded against the volumes they concern, visibly. A review whose findings all confirm the author is a review nobody is actually reading.')}
${darkCard('Not retrofitted', 'No volume will be marked reviewed retrospectively', 'Volumes produced before review remain volumes produced before review. Their status will be stated on their own record rather than quietly upgraded by a later appointment.')}
    </div>
  </div>
</section>

<section class="section--light section-pad" id="programme" data-contents="The Publishing Programme">
  <div class="container reveal">
    <div class="section-head">
      <span class="module-marker">The Measure</span>
      <h2>Seven readers, seven questions.</h2>
      <p class="lede">Each asks whether a named person could actually do their work with what
        exists. A resource count answers none of them.</p>
    </div>
    <div class="table-scroll">
      <table class="ledger">
        <thead><tr><th>Reader</th><th>Can they?</th><th>Resources in hand</th></tr></thead>
        <tbody>
CRITERIA_ROWS
        </tbody>
      </table>
    </div>
    <div class="stat-row" style="margin-top:36px">
      <div class="stat-row__item"><strong>CRIT_MET/CRIT_TOTAL</strong><span>Tests passed</span></div>
      <div class="stat-row__item"><strong>AVAIL/TOTAL</strong><span>Resources in hand</span></div>
      <div class="stat-row__item"><strong>RES_PCT%</strong><span>Of the resource list</span></div>
      <div class="stat-row__item"><strong>STAGE_PCT%</strong><span>Stage One overall</span></div>
    </div>
    <p class="form-note">The two figures disagree deliberately. Ninety-three per cent of the
      resources are in hand and the stage is well short of complete, because the last few
      resources are the ones no amount of writing produces.</p>
  </div>
</section>

<section class="section--paper section-pad">
  <div class="container reveal">
    <div class="section-head">
      <span class="module-marker">What Is Blocking It</span>
      <h2>Nothing that can be written.</h2>
      <p class="lede">Every remaining item requires a person, a studio or an outside body. That
        is why the resource figure and the stage figure separated.</p>
    </div>
    <div class="grid grid--3">
${card('Requires a studio', 'The recorded audio', 'The listening scripts are written, marked and published as a volume. The recordings do not exist. Producing them needs voices and a room, and it is the largest single item standing between the programme and first delivery.')}
${card('Requires a classroom', 'Observation evidence', 'Nothing in the record has been observed in teaching. One teacher, one cohort, one term produces evidence that cannot be reasoned out &mdash; see <a href="/academics/teaching/#development">Development and observation</a>.')}
${card('Requires an outside body', 'External examining and review', 'The award cannot be conferred and the volumes cannot be reviewed by anyone inside the College. Both are appointments, not tasks.')}
    </div>
  </div>
</section>

<section class="section--dark section-pad">
  <div class="container reveal">
    <div class="section-head">
      <span class="module-marker">Withdrawn</span>
      <h2>Titles the register has stopped.</h2>
    </div>
    <div class="grid grid--2">
${darkCard('Consolidated', 'Two titles absorbed into others', 'Where a proposed volume turned out to be a chapter of one that already existed, it was withdrawn and its host named. A separate volume would have added a title to the catalogue and nothing to the education.')}
${darkCard('Unsupported', 'Three the curriculum does not justify', 'Where a proposed resource had no basis in what the programme actually teaches, it was recorded as unsupported rather than built. Video support is the clearest case: producing it would be a decision about what the College is, not a gap in what it has written.')}
    </div>
  </div>
</section>

<section class="section--light section-pad" id="library" data-contents="The Library">
  <div class="container reveal">
    <div class="section-head">
      <span class="module-marker">Plainly</span>
      <h2>What it is not.</h2>
    </div>
    <div class="callout">
      <span class="callout__label">No licensed collection</span>
      <p>AIPC holds no subscriptions to academic databases, no licensed journal access, no
        e-book collection and no interlibrary arrangement. A student enrolling here does not gain
        access to a research library. &ldquo;Digital library access&rdquo; on this site means the
        College&rsquo;s own materials, and it is worth being exact about that rather than letting
        the phrase do work it has not earned.</p>
    </div>
  </div>
</section>

<section class="section--paper section-pad">
  <div class="container reveal">
    <div class="section-head">
      <span class="module-marker">What It Holds</span>
      <h2>Three collections, all produced here.</h2>
    </div>
    <div class="grid grid--3">
${card('The programme', 'Everything your level contains', 'Lessons, exercises, listening sets, vocabulary work, self-checks and assessments for the level you are enrolled in, available from the day you enrol.')}
${card('The volumes', `${publicVolumes.length} published titles`, 'The curriculum, the assessment handbook, the workbooks, the companions and the handbooks &mdash; see <a href="/press/catalogue/">the catalogue</a>. Supplied on request rather than downloaded here.')}
${card('The record', 'What the College has decided, and why', 'Frameworks, standards and governance positions are published as pages on this site rather than held back as internal documents. An institution that publishes its reasoning can be argued with, which is the point.')}
    </div>
  </div>
</section>

<section class="section--dark section-pad">
  <div class="container reveal">
    <div class="section-head">
      <span class="module-marker">Reading Beyond The Programme</span>
      <h2>What the College recommends instead.</h2>
      <p class="lede">A language learner needs far more input than any single programme supplies.
        Since the College cannot supply a collection, it says where the input actually is.</p>
    </div>
    <div class="grid grid--3">
${darkCard('Free and vast', 'Public broadcasting and podcasts', 'Hours of natural speech at every level, at no cost, on any subject you already care about. Interest in the subject is what makes listening practice survive week three.')}
${darkCard('Free and vast', 'Public libraries and open collections', 'Graded readers, newspapers and open-access texts. A learner reading one thing a week they chose themselves will out-read the programme&rsquo;s set texts many times over.')}
${darkCard('The one thing to avoid', 'Material far above your level', 'Input just beyond your current reach builds a language; input far beyond it builds nothing but discouragement. Your level page names where you are; choose accordingly.')}
    </div>
  </div>
</section>

${cta('See what has been produced.', 'The Catalogue', '/press/catalogue/', 'The Publishing Programme', '/press/#programme')}`,
};

// 2 · CATALOGUE ───────────────────────────────────────────────────────
PAGES.catalogue = {
  slug: 'press-catalogue', output: 'press/catalogue/index.html', file: 'press-catalogue.html',
  title: 'Catalogue &mdash; AIPC Press',
  description: `The ${publicVolumes.length} volumes AIPC Press has produced, who each is for, and `
    + 'how to obtain one.',
  body: `${hero('AIPC Press', 'The catalogue.',
    'Every title below is a volume that has been produced. Nothing planned, in preparation or '
    + 'forthcoming appears here &mdash; a catalogue that lists intentions is a prospectus '
    + 'wearing a catalogue&rsquo;s clothes.')}

<section class="section--light section-pad">
  <div class="container reveal">
    <div class="section-head">
      <span class="module-marker">In Print</span>
      <h2>${publicVolumes.length} volumes.</h2>
    </div>
    <div class="table-scroll">
      <table class="ledger">
        <thead><tr><th>Title</th><th>For</th></tr></thead>
        <tbody>
${publicVolumes.map((f) => `          <tr><td><strong>${esc(titleOf(f))}</strong></td><td>${esc(AUDIENCE[titleOf(f)])}</td></tr>`).join('\n')}
        </tbody>
      </table>
    </div>
    ${requestBlock}
  </div>
</section>

<section class="section--paper section-pad">
  <div class="container reveal">
    <div class="section-head">
      <span class="module-marker">Editions</span>
      <h2>Why some volumes exist more than once.</h2>
    </div>
    <div class="grid grid--3">
${card('Student edition', 'The curriculum, for the person studying it', 'The same content set for a reader working through it rather than an administrator auditing it. A single edition serving both serves neither well.')}
${card('Large print', 'Not an afterthought', 'A separately composed setting rather than the same file enlarged. Enlarging a page designed for one size breaks its line lengths and its tables, which is how large-print editions come to be unreadable.')}
${card('Institutional edition', 'For a registrar or a panel', 'Specifications, outcomes, hours and quality-assurance apparatus, in the form those readers actually need.')}
    </div>
  </div>
</section>

<section class="section--dark section-pad">
  <div class="container reveal">
    <div class="section-head">
      <span class="module-marker">Internal Volumes</span>
      <h2>${internalVolumes.length} that are produced but not for readers.</h2>
      <p class="lede">Listed because concealing that they exist would be a smaller kind of
        dishonesty than not listing them at all.</p>
    </div>
    <div class="grid grid--2">
${internalVolumes.map((f) => darkCard('Internal', titleOf(f), titleOf(f).includes('Editorial Bible')
    ? 'The house rules every volume is composed against &mdash; typography, structure, tone, and what may and may not be claimed. Internal because it governs production rather than teaching.'
    : 'The physical specification volumes are produced to: trim sizes, margins, paper, binding and colour. Internal because it is a manufacturing document.')).join('\n')}
    </div>
    <p class="form-note">${artwork.length} cover artwork files are also produced. They are
      production assets rather than volumes and are not counted in the catalogue.</p>
  </div>
</section>

${cta('How these are made.', 'House Standards', '/press/#standards', 'On Review', '/press/#review')}`,
};

// 3 · HOUSE STANDARDS ─────────────────────────────────────────────────


// 4 · ON REVIEW ───────────────────────────────────────────────────────


// 5 · THE PUBLISHING PROGRAMME ────────────────────────────────────────


// 6 · THE LIBRARY ─────────────────────────────────────────────────────



// ── THE ARABIC EDITIONS — the Press pillar and the catalogue ─────────
// Volume titles are the publications' proper names and stay in English,
// wrapped for bidi; audiences and criteria carry translation maps that
// throw on an entry they do not know, so a new volume or criterion
// cannot slip through in the wrong language.
const AR_AUDIENCE = {
  Learners: 'المتعلمون', Teachers: 'المعلمون', Examiners: 'الممتحنون',
  Institutional: 'مؤسسي', Parents: 'أولياء الأمور',
};
const arAudience = (en) => {
  if (!AR_AUDIENCE[en]) throw new Error(`No Arabic audience label for "${en}"`);
  return AR_AUDIENCE[en];
};
const arRequestBlock = `<div class="callout">
      <span class="callout__label">كيف تحصل على مجلد</span>
      <p>لا شيء يُنشر للتنزيل على هذا الموقع. المجلدات منضَّدة للطباعة وثلاثة منها أكبر من أن
        تُقدَّم هنا أصلًا. اطلب أيًا منها من
        <a href="mailto:info@worldwencollege.co.uk?subject=AIPC%20Press%20%E2%80%94%20volume%20request" dir="ltr">info@worldwencollege.co.uk</a>
        مسمّيًا العنوان. وتُقدَّم بلا مقابل للمعلمين والمراجعين وكل من يقيّم عمل الكلية
        الأكاديمي.</p>
    </div>`;

PAGES.pressAr = {
  slug: 'press-ar', output: 'ar/press/index.html', file: 'press.ar.html',
  contents: true, lang: 'ar', dir: 'rtl', altHref: '/press/',
  title: 'مطبعة الكلية — كلية البلاغ الدولية المتميّزة',
  description: `${publicVolumes.length} مجلدًا منتَجًا، ومعايير الدار، وحقيقة المراجعة، وبرنامج النشر، والمكتبة — بصدقٍ كامل.`,
  body: `<section class="section--dark section-pad">
  <div class="container">
    <span class="eyebrow">مطبعة الكلية</span>
    <h1>ذراع النشر في الكلية.</h1>
    <p class="lede">${ltr(String(publicVolumes.length))} مجلدًا أُنتج ونُضِّد للطباعة، مركَّبًا من
      السجل ذاته الذي يُدرَّس منه البرنامج. هذا هو الجزء من الكلية الذي اكتمل فيه العمل ويمكن
      عدُّه لا وصفه.</p>
    <div class="btn-row">
      <a href="/ar/press/catalogue/" class="btn btn--gold">الكتالوج</a>
      <a href="/ar/press/#review" class="btn btn--outline">عن المراجعة</a>
    </div>
  </div>
</section>

<section class="section--light section-pad">
  <div class="container reveal">
    <div class="section-head">
      <span class="module-marker">لماذا وُجدت</span>
      <h2>الدار توجد لتجعل الادعاءات قابلة للفحص.</h2>
      <p class="lede">منهجٌ يعيش في قاعدة بيانات وحدها يمكن تغييره دون أن يلاحظ أحد. المجلد
        المطبوع لا يمكن.</p>
    </div>
    <div class="grid grid--3">
${card('الأول', 'لتثبيت نسخة', 'المجلد نسخةٌ من البرنامج يمكن إمساكها وتأريخها ومخالفتها. وما إن يُطبع لا يمكن تنقيح ادعاء منه بصمت — وهذا بالضبط ما يجعله جديرًا بالمراجعة.')}
${card('الثاني', 'ليفحصه الخارجيون', 'لجنة اعتماد أو ممتحن خارجي أو معلم متشكك يمكن أن يُناوَل كتابًا. ولا يمكن أن يُناوَل حسابَ دخول ووعدًا. النشر هو كيف تجعل مؤسسةٌ جديدة نفسها قابلة للتفتيش.')}
${card('الثالث', 'ليحمل مصدره بنفسه', 'كل مجلد يذكر ما يستند إليه وما لا يستند. هذه قاعدة دار لا تفضيل — راجع <a href="/ar/press/#standards">معايير الدار</a>.')}
    </div>
  </div>
</section>

<section class="section--paper section-pad">
  <div class="container reveal">
    <div class="section-head">
      <span class="module-marker">قاعدة النشر</span>
      <h2>لا تنشر أبدًا لرفع العدد.</h2>
    </div>
    <div class="callout">
      <span class="callout__label">التعليمة القائمة</span>
      <p>لا يُنتج مجلد لزيادة عدد المجلدات. إن كان عنوان مقترح لا يحسّن التعليم — دراسة متعلم،
        أو درس معلم، أو تصحيح ممتحن — فلا يُبنى. عنوانان مخططان سُحبا رسميًا بموجب هذه القاعدة
        وسحبُهما مسجَّل لا منسي.</p>
    </div>
    <div class="grid grid--2">
${card('لماذا تلزم القاعدة', 'برنامج النشر يكافئ الكثرة', 'ما إن يوجد كتالوج، يصير أسهل طرق تقويته الإضافةَ إليه. القاعدة موجودة لأن هذا الضغط حقيقي ولا يعلن عن نفسه.')}
${card('وما كلفتها', 'قائمة أقصر مما تستطيع الكلية إنتاجه', 'السجل خلف الدار يحمل 74 موردًا مرشحًا. إنتاجها كلها ممكن؛ ومعظمها لن يحسّن شيئًا، والكتالوج أقصر لهذا.')}
    </div>
  </div>
</section>

<section class="section--dark section-pad">
  <div class="container reveal">
    <div class="section-head">
      <span class="module-marker">الموقف</span>
      <h2>منتَجة، وغير مراجَعة.</h2>
    </div>
    <div class="grid grid--2">
${darkCard('أُنجز', `${ltr(String(publicVolumes.length))} مجلدًا`, 'مركَّبة ومنضَّدة ومدققة ومنتَجة. كل واحد منها شيء حقيقي يمكن طلبه وقراءته اليوم.')}
${darkCard('لم يُنجز', 'مراجعةٌ من أحد مستقل', 'لم يُعيَّن مراجع أكاديمي. كل مجلد أنتجته الكلية راجعه، إن رُوجع أصلًا, الذين كتبوه — أي أنه لم يُراجَع. ولهذا قسمه الخاص لا هامش.')}
    </div>
  </div>
</section>

<section class="section--light section-pad" id="standards" data-contents="معايير الدار">
  <div class="container reveal">
    <div class="section-head">
      <span class="module-marker">القاعدة الأولى</span>
      <h2>مولَّد من السجل، لا مصانًا إلى جواره.</h2>
    </div>
    <div class="grid grid--2">
${card('ما تمنعه', 'كتابٌ يخالف البرنامج', 'المجلد المصان يدويًا ينجرف عن المنهج خلال مراجعة واحدة، فيدرّس كلُّ معلم يثق به شيئًا لم تعد الكلية تقوله. التركيب من المصدر يجعل الانجراف مستحيلًا لا مستبعدًا.')}
${card('وما كلفتها', 'الكتاب لا يُحسَّن في الكتاب', 'تحسين جملة يعني تحسين السجل الذي جاءت منه، وهو أبطأ ومزعج أحيانًا. وهو أيضًا الترتيب الوحيد الذي يصل فيه التحسين إلى المتعلمين كما يصل إلى القراء.')}
    </div>
  </div>
</section>

<section class="section--paper section-pad">
  <div class="container reveal">
    <div class="section-head">
      <span class="module-marker">القاعدة الثانية</span>
      <h2>نظام طباعي واحد، أربع صيغ.</h2>
      <p class="lede">الدار تُعرف باتساقها، والاتساق بهذا الحجم يُفرض بنظام مشترك لا
        بالتذكّر.</p>
    </div>
    <div class="grid grid--4">
${card('مرجعي', 'للاستشارة', 'الأدلة المرافقة والكتيبات — تُفتح عند نقطة لا تُقرأ من أولها، فالصفحة مبنية للمسح والعودة.')}
${card('تدريبي', 'للعمل فيه', 'كراسات التمارين، حيث على الصفحة أن تترك مكانًا يكتب فيه المتعلم وتحفظ بنيتها.')}
${card('رئيسي', 'للبرنامج كاملًا', 'المنهج بتمامه، حيث مشكلة القارئ التنقل عبر مئات الصفحات لا الكثافة في واحدة.')}
${card('بحثي', 'للفحص', 'المجلدات المؤسسية والمعمارية، منضَّدة لقارئ يدقق لا يتعلم.')}
    </div>
  </div>
</section>

<section class="section--dark section-pad">
  <div class="container reveal">
    <div class="section-head">
      <span class="module-marker">القاعدة الثالثة</span>
      <h2>كل ادعاء يحمل مصدره.</h2>
    </div>
    <div class="grid grid--3">
${darkCard('على الصفحة', 'لا في المقدمة', 'حيث يقول مجلدٌ شيئًا سيعمل به معلم، يوسم مصدر القول على اللوحة ذاتها. ملاحظة المصدر المشروحة مرة في التصدير ملاحظةٌ لا يقرؤها أحد.')}
${darkCard('بما في ذلك الغياب', 'فئة لا تظهر في أي موضع', 'دليل المعلم المرافق يسم كل لوحة مشتقةً أو مُثبَتة أو مصمَّمة. الوسم الرابع — مُشاهَد في صف — لا يظهر في الكتاب إطلاقًا، والتصدير يقول لماذا بدل إسقاط الفئة بصمت.')}
${darkCard('معدود لا مُدّعى', 'الأرقام تُقاس من الصفحات', 'أعداد التصدير تُؤخذ من الصفحات المركَّبة لا من قاعدة البيانات التي غذّتها، لأن بعض المدخلات يظهر في رأس جارٍ لا لوحةً. العدد المأخوذ من المكان الخطأ خطأٌ لن يفحصه أحد أبدًا.')}
    </div>
  </div>
</section>

<section class="section--light section-pad" id="review" data-contents="عن المراجعة">
  <div class="container reveal">
    <div class="section-head">
      <span class="module-marker">الحقيقة</span>
      <h2>ما ألّفه وراجعه الأشخاص أنفسهم غير مراجَع.</h2>
    </div>
    <div class="grid grid--2">
${card('ما فُعل', 'تدقيق داخلي، وكثير منه', 'المجلدات تُدقق وتُقابَل بالسجل وتُفحص آليًا للاتساق الداخلي — التسلسل والحساب والمصطلح والتغطية. وهذا يصطاد التناقضات وأخطاء الوقائع.')}
${card('وما لا يستطيع اصطياده', 'الخطأ الذي يشترك فيه المؤلفون', 'الافتراض المشترك غير مرئي من الداخل. هل يعلّم الدرس ما يدّعي تعليمه، وهل يقيس التقييم ما يقول إنه يقيسه، وهل المستوى حيث يقول إنه هو — لا شيء من ذلك يستطيع إثباته الذين قرروه.')}
    </div>
    <div class="grid grid--3" style="margin-top:26px">
${card('المنصب', 'مراجع أكاديمي', 'ماجستير في تدريس الإنجليزية أو اللسانيات التطبيقية أو ما يعادلهما، مع خبرة تقييم. أيام محددة لقراءة قائمة محددة. يمكن أن يكون ارتباطًا استشاريًا، وهو التعيين الذي سيغيّر أكثر من أي تعيين آخر.')}
${card('الفصل', 'المؤلف ليس المراجع، أبدًا', 'تعدّه الكلية غير قابل للتفاوض. تعيين مؤلف لمراجعة عمله ينتج صفحةً تقول «رُوجع» ولا يغيّر شيئًا في المجلدات، وهو أسوأ من الوضع الحالي لأنه كاذب.')}
${card('الدعوة', 'المجلدات معروضة للمراجعة', 'كل قارئ مؤهل مستعد لمراجعة مجلد يُعرض عليه نسخة. اكتب إلى <a href="mailto:info@worldwencollege.co.uk?subject=Review%20of%20a%20AIPC%20Press%20volume" dir="ltr">info@worldwencollege.co.uk</a>. النقد غاية التمرين لا خطره.')}
    </div>
    <div class="grid grid--2" style="margin-top:26px">
${darkCard('سيُنشر', 'ما تقلبه المراجعة، بوصفه قلبًا', 'ستُسجَّل النتائج على المجلدات التي تخصها، على مرأى. مراجعةٌ تؤكد نتائجها المؤلفَ دائمًا مراجعةٌ لا يقرؤها أحد فعلًا.')}
${darkCard('ولن يُسترجَع', 'لن يوسم مجلد مراجَعًا بأثر رجعي', 'المجلدات المنتَجة قبل المراجعة تبقى منتَجة قبل المراجعة. حالتها ستُذكر على سجلها لا تُرقّى بصمت بتعيين لاحق.')}
    </div>
  </div>
</section>

<section class="section--light section-pad" id="programme" data-contents="برنامج النشر">
  <div class="container reveal">
    <div class="section-head">
      <span class="module-marker">المقياس</span>
      <h2>سبعة قراء، سبعة أسئلة.</h2>
      <p class="lede">كلٌّ يسأل هل يستطيع شخص مسمًّى أن يؤدي عمله فعلًا بما هو موجود. عدُّ
        الموارد لا يجيب عن أي منها.</p>
    </div>
    <div class="table-scroll">
      <table class="ledger">
        <thead><tr><th>القارئ</th><th>هل يستطيع؟</th><th>الموارد المتوفرة</th></tr></thead>
        <tbody>
AR_CRITERIA_ROWS
        </tbody>
      </table>
    </div>
    <div class="stat-row" style="margin-top:36px">
      <div class="stat-row__item"><strong dir="ltr">CRIT_MET/CRIT_TOTAL</strong><span>اختبارات مجتازة</span></div>
      <div class="stat-row__item"><strong dir="ltr">AVAIL/TOTAL</strong><span>موردًا في اليد</span></div>
      <div class="stat-row__item"><strong dir="ltr">RES_PCT%</strong><span>من قائمة الموارد</span></div>
      <div class="stat-row__item"><strong dir="ltr">STAGE_PCT%</strong><span>المرحلة الأولى إجمالًا</span></div>
    </div>
    <p class="form-note">الرقمان يختلفان عمدًا. ثلاثة وتسعون في المئة من الموارد في اليد
      والمرحلة بعيدة عن الاكتمال، لأن الموارد الأخيرة هي التي لا تنتجها أي كتابة.</p>
    <div class="grid grid--3" style="margin-top:26px">
${card('يتطلب استوديو', 'الصوتيات المسجلة', 'نصوص الاستماع مكتوبة وموسومة ومنشورة مجلدًا. التسجيلات غير موجودة. إنتاجها يحتاج أصواتًا وغرفة، وهو أكبر بند واحد بين البرنامج وأول تدريس.')}
${card('يتطلب صفًا', 'دليل المشاهدة', 'لا شيء في السجل شوهد في تدريس. معلم واحد ودفعة واحدة وفصل واحد ينتج دليلًا لا يُستنتج — راجع <a href="/ar/academics/teaching/#development">التطوير والمشاهدة</a>.')}
${card('يتطلب جهة خارجية', 'الفحص الخارجي والمراجعة', 'الشهادة لا يمكن منحها والمجلدات لا يستطيع مراجعتها أحد داخل الكلية. كلاهما تعيين لا مهمة.')}
    </div>
    <div class="grid grid--2" style="margin-top:26px">
${darkCard('مدموج', 'عنوانان استوعبتهما مجلدات أخرى', 'حيث تبيّن أن مجلدًا مقترحًا فصلٌ من مجلد قائم، سُحب وسُمّي مضيفه. مجلد منفصل كان سيضيف عنوانًا إلى الكتالوج ولا شيء إلى التعليم.')}
${darkCard('غير مسنود', 'ثلاثة لا يسوّغها المنهج', 'حيث لم يكن لمورد مقترح أساس فيما يدرّسه البرنامج فعلًا، سُجّل غير مسنود بدل أن يُبنى. الدعم المرئي أوضح حالة: إنتاجه قرار عمّا هي الكلية، لا ثغرة فيما كتبته.')}
    </div>
  </div>
</section>

<section class="section--light section-pad" id="library" data-contents="المكتبة">
  <div class="container reveal">
    <div class="section-head">
      <span class="module-marker">بوضوح</span>
      <h2>ما ليست هي.</h2>
    </div>
    <div class="callout">
      <span class="callout__label">لا مجموعة مرخَّصة</span>
      <p>لا تحمل الكلية اشتراكات في قواعد بيانات أكاديمية، ولا وصولًا مرخَّصًا إلى دوريات، ولا
        مجموعة كتب إلكترونية، ولا ترتيب إعارة بين مكتبات. الطالب المسجّل هنا لا يكسب وصولًا إلى
        مكتبة بحثية. «الوصول إلى المكتبة الرقمية» في هذا الموقع يعني مواد الكلية نفسها، ويجدر
        أن نكون دقيقين في ذلك بدل أن نترك العبارة تؤدي عملًا لم تكسبه.</p>
    </div>
    <div class="grid grid--3" style="margin-top:26px">
${card('البرنامج', 'كل ما يحويه مستواك', 'الدروس والتمارين ومجموعات الاستماع وعمل المفردات والفحوص الذاتية والتقييمات لمستواك المسجَّل فيه، متاحة من يوم تسجيلك.')}
${card('المجلدات', `${ltr(String(publicVolumes.length))} عنوانًا منشورًا`, 'المنهج وكتيب التقييم والكراسات والأدلة المرافقة والكتيبات — راجع <a href="/ar/press/catalogue/">الكتالوج</a>. تُقدَّم بالطلب لا تُنزَّل هنا.')}
${card('السجل', 'ما قررته الكلية، ولماذا', 'الأطر والمعايير ومواقف الحوكمة منشورة صفحاتٍ على هذا الموقع لا محجوزة وثائق داخلية. المؤسسة التي تنشر منطقها يمكن مجادلتها، وذلك هو المقصود.')}
    </div>
    <div class="grid grid--3" style="margin-top:26px">
${darkCard('مجاني وواسع', 'البث العام والمدونات الصوتية', 'ساعات من الكلام الطبيعي في كل مستوى، بلا كلفة، في أي موضوع تهتم به أصلًا. الاهتمام بالموضوع هو ما يجعل تمرين الاستماع يتجاوز الأسبوع الثالث.')}
${darkCard('مجاني وواسع', 'المكتبات العامة والمجموعات المفتوحة', 'قراءات متدرجة وصحف ونصوص مفتوحة. المتعلم الذي يقرأ أسبوعيًا شيئًا اختاره بنفسه سيقرأ أضعاف نصوص البرنامج المقررة.')}
${darkCard('والشيء الوحيد الذي يُتجنب', 'مادة أعلى بكثير من مستواك', 'المدخل الذي يتجاوز متناولك قليلًا يبني لغة؛ والذي يتجاوزه بكثير لا يبني إلا الإحباط. صفحة مستواك تسمّي أين أنت؛ فاختر وفق ذلك.')}
    </div>
  </div>
</section>

<section class="section--dark cta-band">
  <div class="container reveal">
    <h2>انظر ما الذي أُنتج.</h2>
    <div class="btn-row u-center">
      <a href="/ar/press/catalogue/" class="btn btn--gold">الكتالوج</a>
      <a href="/ar/press/#programme" class="btn btn--outline">برنامج النشر</a>
    </div>
  </div>
</section>`,
};

PAGES.catalogueAr = {
  slug: 'press-catalogue-ar', output: 'ar/press/catalogue/index.html', file: 'press-catalogue.ar.html',
  lang: 'ar', dir: 'rtl', altHref: '/press/catalogue/',
  title: 'الكتالوج — مطبعة الكلية',
  description: `المجلدات الـ${publicVolumes.length} التي أنتجتها مطبعة الكلية، ولمن كلٌّ منها، وكيف تحصل على نسخة.`,
  body: `<section class="section--dark section-pad">
  <div class="container">
    <span class="eyebrow">مطبعة الكلية</span>
    <h1>الكتالوج.</h1>
    <p class="lede">كل عنوان أدناه مجلدٌ أُنتج فعلًا. لا شيء مخططًا أو قيد الإعداد أو وشيكًا
      يظهر هنا — الكتالوج الذي يسرد النوايا نشرةٌ ترويجية بثياب كتالوج. عناوين المجلدات أسماء
      أعلام لمنشورات إنجليزية وتبقى بالإنجليزية.</p>
  </div>
</section>

<section class="section--light section-pad">
  <div class="container reveal">
    <div class="section-head">
      <span class="module-marker">في الطباعة</span>
      <h2>${ltr(String(publicVolumes.length))} مجلدًا.</h2>
    </div>
    <div class="table-scroll">
      <table class="ledger">
        <thead><tr><th>العنوان</th><th>لمن</th></tr></thead>
        <tbody>
${publicVolumes.map((f) => `          <tr><td><strong dir="ltr">${esc(titleOf(f))}</strong></td><td>${arAudience(AUDIENCE[titleOf(f)])}</td></tr>`).join('\n')}
        </tbody>
      </table>
    </div>
    ${arRequestBlock}
  </div>
</section>

<section class="section--paper section-pad">
  <div class="container reveal">
    <div class="section-head">
      <span class="module-marker">الطبعات</span>
      <h2>لماذا توجد بعض المجلدات أكثر من مرة.</h2>
    </div>
    <div class="grid grid--3">
${card('طبعة الطالب', 'المنهج، لمن يدرسه', 'المحتوى ذاته منضَّدًا لقارئ يعمل فيه لا لإداري يدققه. الطبعة الواحدة التي تخدم الاثنين لا تخدم أيًا منهما جيدًا.')}
${card('الحروف الكبيرة', 'ليست فكرة لاحقة', 'تنضيد مركَّب على حدة لا الملف ذاته مكبَّرًا. تكبير صفحة صُممت لمقاس واحد يكسر أطوال أسطرها وجداولها، وهكذا تصير طبعات الحروف الكبيرة غير مقروءة.')}
${card('الطبعة المؤسسية', 'لمسجِّل أو لجنة', 'المواصفات والمخرجات والساعات وجهاز ضمان الجودة، بالشكل الذي يحتاجه أولئك القراء فعلًا.')}
    </div>
  </div>
</section>

<section class="section--dark section-pad">
  <div class="container reveal">
    <div class="section-head">
      <span class="module-marker">مجلدات داخلية</span>
      <h2>${ltr(String(internalVolumes.length))} منتَجة وليست للقراء.</h2>
      <p class="lede">مذكورة لأن إخفاء وجودها كان سيكون ضربًا من عدم الصدق أصغر من عدم ذكرها
        أصلًا.</p>
    </div>
    <div class="grid grid--2">
${internalVolumes.map((f) => darkCard('داخلي', ltr(titleOf(f)), titleOf(f).includes('Editorial Bible')
    ? 'قواعد الدار التي يُركَّب كل مجلد وفقها — الطباعة والبنية والنبرة وما يجوز وما لا يجوز ادعاؤه. داخلي لأنه يحكم الإنتاج لا التدريس.'
    : 'مجلدات المواصفات المادية التي تُنتج المجلدات وفقها: مقاسات القطع والهوامش والورق والتجليد والألوان. داخلي لأنه وثيقة تصنيع.')).join('\n')}
    </div>
    <p class="form-note">تُنتج أيضًا ${ltr(String(artwork.length))} ملفات لأغلفة المجلدات. وهي
      أصول إنتاج لا مجلدات، ولا تُعدّ في الكتالوج.</p>
  </div>
</section>

${cta('كيف تُصنع هذه.', 'معايير الدار', '/ar/press/#standards', 'عن المراجعة', '/ar/press/#review')}`,
};


// The programme page's figures are substituted after composition so
// that they come from the register rather than being typed in prose.
async function fillProgramme() {
  const stage = await import('./publication/stage.mjs');
  const r = stage.report();
  const s = r.readiness;
  const rows = s.criteria.map((c) => `          <tr><td><strong>${esc(c.who)}</strong></td>`
    + `<td>${esc(c.can.replace(/^can /, ''))}</td>`
    + `<td>${c.available} of ${c.total}${c.satisfied ? ' &mdash; <strong>yes</strong>' : ''}</td></tr>`).join('\n');
  // The programme section lives inside the Press pillar now; its
  // placeholders travelled with it.
  PAGES.press.body = PAGES.press.body
    .replace('CRITERIA_ROWS', rows)
    .replace('CRIT_MET', s.criteriaSatisfied).replace('CRIT_TOTAL', s.criteriaTotal)
    .replace('AVAIL', s.available).replace('TOTAL', s.resources)
    .replace('RES_PCT', s.resourcePct).replace('STAGE_PCT', s.stagePct);

  // The Arabic pillar renders the same register through a translation
  // map that refuses an entry it does not know.
  const AR_WHO = {
    'A learner': 'متعلم', 'A teacher': 'معلم', 'An examiner': 'ممتحن',
    'An institution': 'مؤسسة', 'A parent': 'ولي أمر', 'An employer': 'صاحب عمل',
    'The publications, platform and classroom resources': 'المنشورات والمنصة والموارد الصفية',
  };
  const AR_CAN = {
    'can successfully study Level I': 'أن يدرس المستوى الأول بنجاح',
    'can confidently teach Level I': 'أن يدرّس المستوى الأول بثقة',
    'can accurately assess Level I': 'أن يقيّم المستوى الأول بدقة',
    'can administer Level I': 'أن تدير المستوى الأول',
    'can understand Level I': 'أن يفهم المستوى الأول',
    'can understand the Level I achievement': 'أن يفهم إنجاز المستوى الأول',
    'work together as one coherent ecosystem': 'أن تعمل معًا منظومةً واحدة متسقة',
  };
  const arRows = s.criteria.map((c) => {
    const who = AR_WHO[c.who]; const can = AR_CAN[c.can];
    if (!who || !can) throw new Error(`No Arabic rendering for criterion "${c.who}" / "${c.can}"`);
    return `          <tr><td><strong>${who}</strong></td><td>${can}</td>`
      + `<td><span dir="ltr">${c.available} / ${c.total}</span>${c.satisfied ? ' — <strong>نعم</strong>' : ''}</td></tr>`;
  }).join('\n');
  PAGES.pressAr.body = PAGES.pressAr.body
    .replace('AR_CRITERIA_ROWS', arRows)
    .replace('CRIT_MET', s.criteriaSatisfied).replace('CRIT_TOTAL', s.criteriaTotal)
    .replace('AVAIL', s.available).replace('TOTAL', s.resources)
    .replace('RES_PCT', s.resourcePct).replace('STAGE_PCT', s.stagePct);
  for (const [name, body] of [['press', PAGES.press.body], ['pressAr', PAGES.pressAr.body]]) {
    if (/CRITERIA_ROWS|CRIT_MET|RES_PCT|STAGE_PCT/.test(body)) {
      throw new Error(`A figure placeholder survived substitution in ${name} — the page would publish a token.`);
    }
  }
}

// ── write ────────────────────────────────────────────────────────────
(async () => {
  await fillProgramme();

  const MANIFEST = path.join(ROOT, 'pages/manifest.json');
  const manifest = JSON.parse(fs.readFileSync(MANIFEST, 'utf8'));
  const entries = Array.isArray(manifest) ? manifest : manifest.pages;
  const written = [];

// Absorbed into the Press & Library pillar.
for (const slug of ['press-standards', 'press-review', 'press-programme', 'library']) {
  const i = entries.findIndex((e) => e.slug === slug);
  if (i >= 0) entries.splice(i, 1);
}

  for (const p of Object.values(PAGES)) {
    fs.writeFileSync(path.join(ROOT, 'pages', p.file), p.body + '\n');
    const entry = {
      slug: p.slug, output: p.output, title: p.title, description: p.description,
      contentFile: p.file, lang: p.lang || 'en', dir: p.dir || (p.lang === 'ar' ? 'rtl' : 'ltr'),
    };
    if (p.altHref) entry.altHref = p.altHref;
    if (p.contents) entry.contents = true;
    const i = entries.findIndex((e) => e.slug === p.slug);
    if (i >= 0) entries[i] = { ...entries[i], ...entry }; else entries.push(entry);
    written.push(p.output);
  }

  fs.writeFileSync(MANIFEST, JSON.stringify(manifest, null, 2) + '\n');
  console.log(`Wrote ${written.length} Press/Library pages:`);
  for (const o of written) console.log(`  ${o}`);
  console.log(`Catalogue: ${publicVolumes.length} volumes for readers, ${internalVolumes.length} internal, `
    + `${artwork.length} artwork files, ${oversize.length} over 25 MiB.`);
  console.log('Run `npm run build` to generate the served pages.');
})();
