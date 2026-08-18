#!/usr/bin/env node
/**
 * THE TEACHING CLUSTER — one page: Teaching Practice, the pillar at
 * /academics/teaching/.
 *
 * ────────────────────────────────────────────────────────────────────
 * THE THING THAT CANNOT BE WRITTEN
 * ────────────────────────────────────────────────────────────────────
 * A "Teaching" section on an institution's website usually rests on
 * classroom experience: what our teachers have found, how our lessons
 * go, what works with our students. AIPC has taught nobody. Every
 * sentence of that kind would be fabricated.
 *
 * What it does have is unusual and genuinely publishable: a teaching
 * support record of 530 authored entries across 17 fields, in which
 * every single entry declares WHERE ITS KNOWLEDGE CAME FROM. Read off
 * the curriculum, attested in the international teaching of English, or
 * designed by the people who wrote the programme — and a fourth state,
 * observed in a real classroom, which stands at zero and is the honest
 * shape of a College that has not taught.
 *
 * So this cluster is written about the record rather than about
 * experience. It is the one place on the site where the absence of
 * classroom evidence is not a gap to be apologised for but the subject
 * itself: an institution that separated the four kinds of teaching
 * knowledge instead of blurring them, and can therefore say exactly
 * which of its claims a first term of teaching would confirm, correct
 * or overturn.
 *
 * ────────────────────────────────────────────────────────────────────
 * TWO THINGS DELIBERATELY NOT DONE HERE
 * ────────────────────────────────────────────────────────────────────
 * There is no "Meet our teachers" page — /faculty/ is the published
 * roster and a second version would drift from it. There is no "Join
 * our faculty" page — /about/careers/ names the three posts the College
 * actually needs and what each unblocks, which is the honest version.
 *
 * The Teacher's Companion was described here but not offered, and the
 * reason was sound at the time: publication/ is excluded from the
 * deploy surface (see tests/deploy-surface.test.mjs), so a download
 * link would have been a link to a 404. Since the press catalogue began
 * staging servable volumes into assets/downloads/, which IS deployed,
 * the book is on the site and the page said otherwise. It now links to
 * it, and DOWNLOAD below throws if the file is not where it says.
 */

const fs = require('fs');
const path = require('path');
const { DatabaseSync } = require('node:sqlite');

const ROOT = path.resolve(__dirname, '..');
const ltr = (v) => `<span dir="ltr">${v}</span>`;
const esc = (s) => String(s ?? '')
  .replace(/\s--\s/g, ' — ')
  .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');

const SEEDS = [
  'seed-curriculum-level-1.sql', 'seed-curriculum-level-2.sql', 'seed-curriculum-level-3.sql',
  'seed-curriculum-level-4.sql', 'seed-curriculum-level-5.sql', 'seed-curriculum-level-6.sql',
  'seed-audio-level-1.sql', 'seed-audio-level-2.sql', 'seed-audio-level-3.sql',
  'seed-audio-level-4.sql', 'seed-audio-level-5.sql', 'seed-audio-level-6.sql',
  'seed-competency-level-1.sql', 'seed-exercises.sql', 'seed-selfchecks.sql',
  'seed-vocabulary-level-1.sql', 'seed-solo-level-1.sql',
  'seed-pedagogy.sql', 'seed-pedagogy-level-1.sql', 'seed-teaching-expertise-level-1.sql',
];

function read() {
  const db = new DatabaseSync(':memory:');
  db.exec(fs.readFileSync(`${ROOT}/sql/schema.sql`, 'utf8'));
  for (const f of SEEDS) db.exec(fs.readFileSync(`${ROOT}/sql/${f}`, 'utf8'));
  const all = (s) => db.prepare(s).all();
  const one = (s) => all(s)[0];
  const out = {
    fields: all('SELECT key, name, derivable FROM pedagogy_fields ORDER BY sequence'),
    states: Object.fromEntries(all(
      "SELECT evidence_state, COUNT(*) n FROM pedagogy_entries WHERE value IS NOT NULL AND value <> '' GROUP BY evidence_state",
    ).map((r) => [r.evidence_state, r.n])),
    modules: one('SELECT COUNT(*) n FROM units').n,
    items: one('SELECT COUNT(*) n FROM learning_items').n,
    cpd: one('SELECT COUNT(*) n FROM cpd_records').n,
    // The population the support layer actually covers: distinct Level I
    // lessons with pedagogy entries — the same join tests/teaching-expertise
    // audits. NOT learning_items with kind='lesson': that kind fails the
    // schema's CHECK and cannot exist, so the old query returned 0 and the
    // page published "0 lessons, fully supported" without anything failing.
    levelOneLessons: one(
      `SELECT COUNT(DISTINCT e.learning_item_id) n FROM pedagogy_entries e
       JOIN learning_items i ON i.id = e.learning_item_id
       JOIN units u ON u.id = i.unit_id
       JOIN courses c ON c.id = u.course_id
       JOIN programme_levels l ON l.id = c.level_id
       WHERE l.roman = 'I'`,
    ).n,
  };
  db.close();
  return out;
}
const D = read();

const FILLED = Object.values(D.states).reduce((a, b) => a + b, 0);
const OBSERVED = D.states.observed_in_teaching || 0;

// The whole cluster argues from "nothing has been observed in a
// classroom yet". If that ever stops being true, these pages must be
// rewritten rather than silently kept.
if (OBSERVED !== 0) {
  throw new Error(`${OBSERVED} entries are now marked observed_in_teaching — the Teaching pages `
    + 'argue from an empty observation record and must be rewritten.');
}

// A zero here once reached the page as "Level I — 0 lessons, fully
// supported". A count that feeds a "fully supported" claim must refuse
// to be nothing.
if (!D.levelOneLessons) {
  throw new Error('levelOneLessons is 0 — the support-coverage claims on the Teaching pages '
    + 'would publish a zero. The query or the seed data has broken.');
}
if (D.cpd !== 0) {
  throw new Error(`${D.cpd} CPD record(s) now exist — /teaching/development/ states there are none.`);
}
if (D.fields.length < 10) throw new Error(`Expected the full support field set, read ${D.fields.length}`);

// ---------------------------------------------------------------------
// THE COMPANION AS A FILE, MEASURED RATHER THAN DESCRIBED.
//
// This page told teachers to write in and ask for a book that is served
// two directories away. The extent and the size are read from the file
// itself so the page cannot describe a volume that is not there: if the
// press build stops staging it, this throws instead of publishing a
// link to a 404 — which is exactly the failure the old paragraph was
// written to avoid, and the reason it is safe to stop avoiding it.
// ---------------------------------------------------------------------
const COMPANION_HREF = '/assets/downloads/iefc-level-i-teacher-s-companion.pdf';
const COMPANION_FILE = path.join(ROOT, COMPANION_HREF.replace(/^\//, ''));
if (!fs.existsSync(COMPANION_FILE)) {
  throw new Error(`The Teaching pages link to ${COMPANION_HREF} and it is not staged. `
    + 'Run the press build, or rewrite the availability section — do not publish the link.');
}
const COMPANION = (() => {
  const buf = fs.readFileSync(COMPANION_FILE);
  const pages = (buf.toString('latin1').match(/\/Type\s*\/Page(?![s])/g) || []).length;
  if (!pages) throw new Error(`${COMPANION_HREF} has no countable pages — it is not a PDF.`);
  return { pages, mb: (buf.length / (1024 * 1024)).toFixed(1) };
})();

const derivable = D.fields.filter((f) => f.derivable);
const authored = D.fields.filter((f) => !f.derivable);

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

const PAGES = {};

// 1 · TEACHING AT AIPC ──────────────────────────────────────────────
PAGES.hub = {
  slug: 'academics-teaching', output: 'academics/teaching/index.html', file: 'academics-teaching.html',
  contents: true, altHref: '/ar/academics/teaching/',
  title: 'Teaching Practice &mdash; Albalagh International Premium College',
  // Kept under 160 characters on purpose: past that, a search result
  // cuts the sentence off mid-clause, and the manifest was being
  // hand-truncated after the fact — an edit the next build silently
  // undid. Written short at the source, it cannot drift.
  description: 'How AIPC teaches: the method, how a lesson is designed, the support record a '
    + "teacher works from, and the Teacher's Companion, free to download.",
  body: `${hero('Academics', 'How the College teaches.',
    'Every lesson in the programme is planned before it is taught, and every planned lesson '
    + 'carries a record of what a teacher will need at each point in it. This page describes '
    + 'the method, the record, and the part of the record that is empty.',
    `<div class="btn-row">
      <a href="/faculty/" class="btn btn--gold">The Faculty</a>
      <a href="/academics/" class="btn btn--outline">Academics</a>
    </div>`)}

<section class="section--light section-pad" id="method" data-contents="The Method">
  <div class="container reveal">
    <div class="section-head">
      <span class="module-marker">The Method</span>
      <h2>Four commitments that shape every lesson.</h2>
      <p class="lede">Not a philosophy of language teaching in the abstract &mdash; these are the
        four decisions that visibly determine what a AIPC lesson looks like.</p>
    </div>
    <div class="grid grid--4">
${card('One', 'Taught in English, from Level I', 'Including at A1, where it is done through restricted language, repetition, visual support and a teacher who slows down instead of translating. Teaching a language through the language is a method, and Level I was written on that assumption rather than adapted to it afterwards.')}
${card('Two', 'The assessment is written first', 'Each assessment exists before the teaching it tests, so that the lesson is built toward a standard rather than the standard assembled afterwards from whatever was taught.')}
${card('Three', 'Speaking is assessed by speaking', 'Recorded, marked by a person, with feedback written against a named pronunciation target. There is no automated pronunciation score, and none is claimed.')}
${card('Four', 'Every lesson plans for the learner who does not follow', 'A second explanation, the mistakes that point provokes, and what causes them, are written into the plan in advance &mdash; not improvised when someone looks lost.')}
    </div>
  </div>
</section>

<section class="section--paper section-pad">
  <div class="container reveal">
    <div class="section-head">
      <span class="module-marker">The Record</span>
      <h2>What is written down.</h2>
      <p class="lede">The programme is not a syllabus with lesson titles. It is
        ${D.modules} modules, ${D.items} planned items, and a teaching support record
        of ${FILLED} authored entries across ${D.fields.length} fields.</p>
    </div>
    <div class="stat-row">
      <div class="stat-row__item"><strong>${D.modules}</strong><span>Modules</span></div>
      <div class="stat-row__item"><strong>${D.items}</strong><span>Planned items</span></div>
      <div class="stat-row__item"><strong>${D.fields.length}</strong><span>Support fields per lesson</span></div>
      <div class="stat-row__item"><strong>${FILLED}</strong><span>Authored support entries</span></div>
    </div>
    <p class="form-note">The authored support layer is complete for Level I; three further
      record fields hold no entries yet and are listed as not yet evidenced. The figures above
      are what exists, not what is planned.</p>
  </div>
</section>

<section class="section--dark section-pad">
  <div class="container reveal">
    <div class="section-head">
      <span class="module-marker">The Empty Column</span>
      <h2>Nothing here has been observed in a classroom.</h2>
      <p class="lede">This is the most important sentence in the section, so it is not in a
        footnote.</p>
    </div>
    <div class="grid grid--2">
${darkCard('Why it is empty', 'The College has taught no one', 'Every entry in the support record declares where its knowledge came from, and one of the four possible sources is a real classroom. That column stands at zero and will stand at zero until a teacher teaches a cohort and writes down what happened.')}
${darkCard('Why it is a column at all', 'So that it cannot be quietly filled by something else', 'The easy version of this record would mark everything simply "our teaching experience". Keeping observation separate means the College can say precisely which of its claims a first term would confirm, correct or overturn &mdash; and cannot pass off design for evidence.')}
    </div>
  </div>
</section>

<section class="section--light section-pad" id="design" data-contents="Lesson Design">
  <div class="container reveal">
    <div class="section-head">
      <span class="module-marker">The Anatomy</span>
      <h2>What every lesson carries.</h2>
    </div>
    <div class="grid grid--3">
${card('Before', 'A named prerequisite', 'What the learner must already hold for this lesson to work. Stating it makes the sequence checkable: a lesson whose prerequisite is not taught anywhere earlier is a defect, and it can be found automatically rather than discovered by a confused class.')}
${card('During', 'Stages with declared minutes', 'Each stage has a purpose and a duration. The durations sum to the lesson, and the sum is checked. A lesson plan whose stages do not add up is a plan nobody has actually run through.')}
${card('After', 'A named outcome and its assessment', 'What the learner can now do, and the assessment that would show it. Both are written before the lesson is delivered, which is the only order in which the lesson can be built toward the standard.')}
    </div>
  </div>
</section>

<section class="section--paper section-pad">
  <div class="container reveal">
    <div class="section-head">
      <span class="module-marker">Planned For</span>
      <h2>The learner who does not follow the first explanation.</h2>
      <p class="lede">Most lesson plans describe the successful path. These describe the
        unsuccessful one too, in advance, because that is where teaching actually happens.</p>
    </div>
    <div class="grid grid--4">
${card('Written in advance', 'A second explanation', 'A different route to the same point, for the learner the first route did not reach. Improvising this at the moment of confusion is what experienced teachers do; writing it down is what lets a less experienced teacher do it too.')}
${card('Written in advance', 'The mistakes this point provokes', 'Named specifically, for this lesson, rather than as general advice. A mistake you were expecting is a teaching opportunity; the same mistake unexpected is an interruption.')}
${card('Written in advance', 'Why those mistakes happen', 'The cause, not just the symptom &mdash; interference from a first language, an over-applied rule, an arbitrary feature of English that simply has to be learned. A teacher who knows the cause can address it; one who only knows the error can only correct it.')}
${card('Written in advance', 'What to do with the learner who finishes early', 'An extension that is genuinely harder rather than merely longer. Otherwise the strongest learner in the room spends the lesson waiting.')}
    </div>
  </div>
</section>

<section class="section--dark section-pad">
  <div class="container reveal">
    <div class="section-head">
      <span class="module-marker">Checked, Not Trusted</span>
      <h2>The plan is verified against itself.</h2>
      <p class="lede">A programme this size cannot be kept consistent by care alone. Several
        properties are checked automatically and fail the build when broken.</p>
    </div>
    <div class="grid grid--3">
${darkCard('Sequence', 'Every prerequisite is taught earlier', 'A lesson that depends on something the programme never teaches, or teaches later, is a defect that no amount of proofreading reliably finds.')}
${darkCard('Timing', 'Stage minutes sum to the lesson', 'Checked arithmetically. It is the cheapest possible signal that a plan has been thought through rather than assembled.')}
${darkCard('Coverage', 'Every module carries its assessments', `Quiz, assignment and rubric, to one published policy, across all ${D.modules} modules. Consistency at that scale is enforced or it does not exist.`)}
    </div>
  </div>
</section>

<section class="section--light section-pad" id="support" data-contents="The Support Record">
  <div class="container reveal">
    <div class="section-head">
      <span class="module-marker">Four Kinds of Knowledge</span>
      <h2>Not all teaching knowledge is the same kind of thing.</h2>
      <p class="lede">Blurring these is how a designed judgement comes to be cited as evidence.
        Each entry in the record is marked with exactly one.</p>
    </div>
    <div class="grid grid--4">
${card('Derived', `${D.states.derived_from_curriculum || 0} entries`, 'Read off the programme itself: the prerequisite a lesson names, the minutes its stages declare, the confusion its own self-check was written to trap. Not an opinion &mdash; a fact about the curriculum, and checkable against it.')}
${card('Established', `${D.states.established_pedagogy || 0} entries`, 'Attested in the international teaching of English and not particular to this College &mdash; that the third-person <em>-s</em> is among the most persistent errors for learners of every first language, that countability in English is arbitrary and must be memorised. Synthesis, and marked as synthesis.')}
${card('Designed', `${D.states.educational_expertise || 0} entries`, 'An authored judgement by the people who wrote the curriculum: how else to explain this, which analogy holds, how to stretch a learner who has finished early. Defensible, and improvable by anyone who teaches it and finds better.')}
${card('Observed', `${OBSERVED} entries`, 'What actually happened in a room with real learners. This is empty, and it is empty because the College has taught nobody. It is not filled with the other three.')}
    </div>
    <div class="callout">
      <span class="callout__label">Why this record was rebuilt</span>
      <p>It began with three states and most of it empty, on the reasoning that a teacher&rsquo;s
        knowledge comes from teaching and this College has taught no one. That was right about
        one kind of knowledge and wrong about three others &mdash; and the conflation left the
        Teacher&rsquo;s Companion unwritable for a reason that did not actually apply to most of
        what it would contain.</p>
    </div>
  </div>
</section>

<section class="section--paper section-pad">
  <div class="container reveal">
    <div class="section-head">
      <span class="module-marker">The Fields</span>
      <h2>${D.fields.length} of them, in two groups.</h2>
      <p class="lede">${derivable.length} can be read from the curriculum itself.
        ${authored.length} cannot, and are authored or synthesised &mdash; which is why each one
        carries its source alongside it.</p>
    </div>
    <div class="table-scroll">
      <table class="ledger">
        <thead><tr><th>Field</th><th>Source</th></tr></thead>
        <tbody>
${D.fields.map((f) => `          <tr><td><strong>${esc(f.name)}</strong></td><td>${f.derivable ? 'Read from the curriculum' : 'Authored or synthesised, with its source recorded'}</td></tr>`).join('\n')}
        </tbody>
      </table>
    </div>
  </div>
</section>

<section class="section--dark section-pad">
  <div class="container reveal">
    <div class="section-head">
      <span class="module-marker">Coverage</span>
      <h2>Complete for Level I, and honest about the rest.</h2>
    </div>
    <div class="grid grid--3">
${darkCard('Level I', `${D.levelOneLessons} teaching lessons, supported in depth`, `The eight authored support fields are written for every Level I teaching lesson &mdash; the level a beginner meets first and the level where a teacher has least room to improvise. Three of the seventeen record fields hold no entries yet, and the record lists them as not yet evidenced rather than hiding them.`)}
${darkCard('Levels II&ndash;VI', 'Partially written', 'The fields readable from the curriculum are populated across the programme; the authored fields are being written level by level. What exists is what is published; nothing is projected.')}
${darkCard('The whole record', 'Openly countable', `${FILLED} authored entries today. The figure moves as the work proceeds and is generated from the record rather than typed into this page.`)}
    </div>
  </div>
</section>

<section class="section--light section-pad" id="companion" data-contents="The Companion">
  <div class="container reveal">
    <div class="section-head">
      <span class="module-marker">The Volume</span>
      <h2>What it contains.</h2>
    </div>
    <div class="grid grid--3">
${card('Every lesson', `All ${D.levelOneLessons} teaching lessons of Level I`, 'Each with its stages and their declared minutes in the running head, so a teacher can see the shape of the lesson without turning back to the plan.')}
${card('Every panel', 'Marked with its provenance', 'DERIVED, ESTABLISHED or DESIGNED, printed on the panel itself rather than explained once in a preface. A teacher disagreeing with a panel can see immediately whether they are disagreeing with the curriculum, with the field, or with the authors.')}
${card('One mark absent', 'OBSERVED', 'The fourth mark does not appear anywhere in the book, and the front matter says why. A companion that quietly dropped the category would be claiming a kind of authority it does not have.')}
    </div>
  </div>
</section>

<section class="section--paper section-pad">
  <div class="container reveal">
    <div class="section-head">
      <span class="module-marker">How It Is Made</span>
      <h2>Generated from the record, not written alongside it.</h2>
    </div>
    <div class="grid grid--2">
${card('One source', 'The book cannot disagree with the curriculum', 'It is composed directly from the same record the platform teaches from. A companion maintained by hand drifts from the programme within one revision, and every teacher who trusts it then teaches something the College no longer says.')}
${card('Counted, not asserted', 'The figures in the front matter are measured', 'The number of panels of each kind is counted from the pages as composed, not from the database that fed them &mdash; because some entries render in a running head rather than as a panel, and a front matter that said otherwise would be wrong in a way nobody would ever check.')}
    </div>
  </div>
</section>

<section class="section--dark section-pad">
  <div class="container reveal">
    <div class="section-head">
      <span class="module-marker">Availability</span>
      <h2>How to obtain a copy.</h2>
    </div>
    <div class="callout">
      <span class="callout__label">Read it before you teach from it</span>
      <p>The Companion is a typeset volume produced by AIPC Press, and the whole of it is
        here: <a href="${COMPANION_HREF}" download><strong>the Teacher&rsquo;s Companion,
        Level I</strong></a> &mdash; ${COMPANION.pages}&nbsp;pages, ${COMPANION.mb}&nbsp;MB, PDF.
        No account, no request, no form.</p>
      <p>One thing to know before you open it: every volume the College has produced is
        currently unreviewed by anyone who did not write it. If you teach and are willing to
        say where the book is wrong, that is the most useful thing anyone can do with it, and
        <a href="mailto:info@worldwencollege.co.uk?subject=Teacher%27s%20Companion">info@worldwencollege.co.uk</a>
        reaches the editors who would have to act on it.</p>
    </div>
  </div>
</section>

<section class="section--light section-pad" id="development" data-contents="Development">
  <div class="container reveal">
    <div class="section-head">
      <span class="module-marker">The Position</span>
      <h2>Stated at the top, not at the bottom.</h2>
    </div>
    <div class="callout">
      <span class="callout__label">What is true today</span>
      <p>No lesson has been observed. No continuing professional development has been recorded
        for anyone &mdash; the record that would hold it contains ${D.cpd} entries. No teacher
        has taught a AIPC cohort, because there has been no cohort. Any page describing teacher
        development at this College as a running programme would be describing something that
        does not exist.</p>
    </div>
  </div>
</section>

<section class="section--paper section-pad">
  <div class="container reveal">
    <div class="section-head">
      <span class="module-marker">Why It Matters More Than It Sounds</span>
      <h2>One term of teaching is worth more than another year of writing.</h2>
      <p class="lede">This is the College&rsquo;s own assessment of where it stands, and it is
        uncomfortable enough to be worth publishing.</p>
    </div>
    <div class="grid grid--3">
${card('What writing produced', 'A complete, inspectable programme', `${D.modules} modules, ${D.items} planned items, every assessment written with published criteria, and ${FILLED} entries of teaching support. All of it can be examined by anyone.`)}
${card('What writing cannot produce', 'Any of the fourth kind of knowledge', 'What a real class does with a lesson, where the plan breaks, which explanation works with which learner, how long a stage actually takes. None of it can be reasoned out. It can only be observed.')}
${card('The consequence', 'The single most valuable appointment is a practising teacher', 'One teacher, one cohort, one term generates evidence the College cannot obtain any other way &mdash; and would immediately improve material that is currently designed rather than tested. It is named as a priority on <a href="/about/careers/">Careers</a>.')}
    </div>
  </div>
</section>

<section class="section--dark section-pad">
  <div class="container reveal">
    <div class="section-head">
      <span class="module-marker">Built and Waiting</span>
      <h2>What the first term will be written into.</h2>
    </div>
    <div class="grid grid--3">
${darkCard('The observation state', 'A field on every support entry', 'When a lesson is observed, what was learned is recorded against the specific entry it revises, marked as observed rather than designed. The revision is visible as a revision instead of replacing the original silently.')}
${darkCard('The development record', 'Per member of staff', 'A record of continuing professional development exists per person and stands empty. It will be filled by what is actually undertaken, not by what is intended.')}
${darkCard('The instructor workspace', 'Where marking and feedback happen', 'Built and tested, and it has marked nothing, because there is nothing to mark yet.')}
    </div>
    <div class="callout">
      <span class="callout__label">The commitment attached to this</span>
      <p>When observation begins, what it overturns will be published as an overturning. A record
        in which the designed judgement always turns out to have been right is a record nobody
        is actually checking.</p>
    </div>
  </div>
</section>

${cta('Who teaches to this standard.', 'The Faculty', '/faculty/', 'Academics', '/academics/')}`,
};


// 2 · TEACHING AT AIPC — THE ARABIC EDITION ─────────────────────────
// Same record, same figures, same honesty. The seventeen field names
// are English record identifiers, so the Arabic edition describes the
// two field groups in prose with the live counts instead of rendering
// an English-only table; everything else is the full page.
PAGES.hubAr = {
  slug: 'academics-teaching-ar', output: 'ar/academics/teaching/index.html', file: 'academics-teaching.ar.html',
  contents: true, lang: 'ar', dir: 'rtl', altHref: '/academics/teaching/',
  title: 'ممارسة التدريس — كلية البلاغ الدولية المتميّزة',
  description: 'كيف تدرّس الكلية: المنهجية، وكيف يُصمَّم الدرس، وسجل الدعم الذي يعمل منه المعلم، '
    + 'والدليل المرافق، وكيف يُفترض أن يعمل التطوير والمشاهدة.',
  body: `<section class="section--dark section-pad">
  <div class="container">
    <span class="eyebrow">البرامج الأكاديمية</span>
    <h1>كيف تدرّس الكلية.</h1>
    <p class="lede">كل درس في البرنامج يُخطَّط قبل أن يُدرَّس، وكل درس مخطَّط يحمل سجلًا بما
      سيحتاجه المعلم عند كل نقطة فيه. هذه الصفحة تصف المنهجية، والسجل، والجزء الفارغ من
      السجل.</p>
    <div class="btn-row">
      <a href="/ar/faculty/" class="btn btn--gold">هيئة التدريس</a>
      <a href="/ar/academics/" class="btn btn--outline">البرامج الأكاديمية</a>
    </div>
  </div>
</section>

<section class="section--light section-pad" id="method" data-contents="المنهجية">
  <div class="container reveal">
    <div class="section-head">
      <span class="module-marker">المنهجية</span>
      <h2>أربعة التزامات تشكّل كل درس.</h2>
      <p class="lede">ليست فلسفةً مجردة في تعليم اللغات — هذه هي القرارات الأربعة التي تحدد،
        على نحو مرئي، شكل الدرس في الكلية.</p>
    </div>
    <div class="grid grid--4">
${card('الأول', 'يُدرَّس بالإنجليزية من المستوى الأول', `حتى عند ${ltr('A1')}، حيث يجري ذلك بلغة مقيدة وتكرار ودعم بصري ومعلم يُبطئ بدل أن يترجم. تعليم اللغة باللغة منهجيةٌ، والمستوى الأول كُتب على هذا الافتراض لا عُدِّل إليه لاحقًا.`)}
${card('الثاني', 'التقييم يُكتب أولًا', 'كل تقييم يوجد قبل التدريس الذي يختبره، فيُبنى الدرس نحو معيار بدل أن يُجمَّع المعيار لاحقًا مما دُرِّس.')}
${card('الثالث', 'التحدث يُقيَّم بالتحدث', 'تسجيلًا يصححه إنسان، بملاحظات مكتوبة مقابل هدف نطق مسمّى. لا توجد درجة نطق آلية، ولا تُدّعى.')}
${card('الرابع', 'كل درس يخطط للمتعلم الذي لا يتابع', 'شرح ثانٍ، والأخطاء التي تثيرها هذه النقطة، وأسبابها — كلها مكتوبة في الخطة سلفًا، لا مرتجلة حين يبدو أحدهم تائهًا.')}
    </div>
  </div>
</section>

<section class="section--paper section-pad">
  <div class="container reveal">
    <div class="section-head">
      <span class="module-marker">السجل</span>
      <h2>ما هو مكتوب.</h2>
      <p class="lede">البرنامج ليس منهجًا بعناوين دروس. إنه ${ltr(String(D.modules))} وحدة،
        و${ltr(String(D.items))} عنصرًا مخططًا، وسجل دعم تعليمي من ${ltr(String(FILLED))} مدخلة
        مؤلفة عبر ${ltr(String(D.fields.length))} حقلًا.</p>
    </div>
    <div class="stat-row">
      <div class="stat-row__item"><strong>${ltr(String(D.modules))}</strong><span>وحدة</span></div>
      <div class="stat-row__item"><strong>${ltr(String(D.items))}</strong><span>عنصرًا مخططًا</span></div>
      <div class="stat-row__item"><strong>${ltr(String(D.fields.length))}</strong><span>حقل دعم لكل درس</span></div>
      <div class="stat-row__item"><strong>${ltr(String(FILLED))}</strong><span>مدخلة دعم مؤلفة</span></div>
    </div>
    <p class="form-note">طبقة الدعم المؤلفة مكتملة للمستوى الأول؛ وثلاثة حقول أخرى في السجل لا
      تحمل مدخلات بعد ومدرجة على أنها غير مُثبَتة بعد. الأرقام أعلاه هي ما هو قائم، لا ما هو
      مخطط له.</p>
  </div>
</section>

<section class="section--dark section-pad">
  <div class="container reveal">
    <div class="section-head">
      <span class="module-marker">العمود الفارغ</span>
      <h2>لا شيء هنا شوهد في صفٍّ حقيقي.</h2>
      <p class="lede">هذه أهم جملة في هذا القسم، ولهذا ليست في هامش.</p>
    </div>
    <div class="grid grid--2">
${darkCard('لماذا هو فارغ', 'الكلية لم تدرّس أحدًا', 'كل مدخلة في سجل الدعم تعلن مصدر معرفتها، وأحد المصادر الأربعة الممكنة هو صف حقيقي. هذا العمود يقف عند الصفر وسيبقى عند الصفر حتى يدرّس معلمٌ دفعةً ويكتب ما حدث.')}
${darkCard('ولماذا هو عمود أصلًا', 'كي لا يُملأ خلسةً بشيء آخر', 'النسخة السهلة من هذا السجل كانت ستصف كل شيء بعبارة «خبرتنا التدريسية». إبقاء المشاهدة منفصلةً يعني أن الكلية تستطيع أن تقول بدقة أي ادعاءاتها سيؤكده فصلٌ أول من التدريس أو يصححه أو يقلبه — ولا تستطيع أن تقدّم التصميم على أنه دليل.')}
    </div>
  </div>
</section>

<section class="section--light section-pad" id="design" data-contents="تصميم الدرس">
  <div class="container reveal">
    <div class="section-head">
      <span class="module-marker">التشريح</span>
      <h2>ما يحمله كل درس.</h2>
    </div>
    <div class="grid grid--3">
${card('قبل', 'متطلب سابق مسمّى', 'ما يجب أن يحمله المتعلم سلفًا ليعمل هذا الدرس. تسميته تجعل التسلسل قابلًا للفحص: درسٌ متطلبه لا يُدرَّس في أي موضع أسبق عيبٌ، ويمكن العثور عليه آليًا بدل أن يكتشفه صفٌّ حائر.')}
${card('أثناء', 'مراحل بدقائق معلنة', 'لكل مرحلة غرض ومدة. والمدد تُجمَع إلى زمن الدرس، والمجموع يُفحَص. خطة درس لا تجتمع مراحلها خطةٌ لم يجرّبها أحد فعلًا.')}
${card('بعد', 'مخرج مسمّى وتقييمه', 'ما صار المتعلم قادرًا عليه، والتقييم الذي يُظهره. كلاهما يُكتب قبل تقديم الدرس، وهو الترتيب الوحيد الذي يمكن به بناء الدرس نحو المعيار.')}
    </div>
  </div>
</section>

<section class="section--paper section-pad">
  <div class="container reveal">
    <div class="section-head">
      <span class="module-marker">مخطط له</span>
      <h2>المتعلم الذي لا يتابع الشرح الأول.</h2>
      <p class="lede">معظم خطط الدروس تصف المسار الناجح. هذه تصف المسار غير الناجح أيضًا،
        سلفًا، لأن هناك يحدث التدريس فعلًا.</p>
    </div>
    <div class="grid grid--4">
${card('مكتوب سلفًا', 'شرح ثانٍ', 'طريق مختلف إلى النقطة ذاتها، للمتعلم الذي لم يصله الطريق الأول. ارتجال هذا لحظة الحيرة هو ما يفعله المعلم الخبير؛ وكتابته هي ما يتيح لمعلم أقل خبرة أن يفعله أيضًا.')}
${card('مكتوب سلفًا', 'الأخطاء التي تثيرها هذه النقطة', 'مسمّاة تحديدًا، لهذا الدرس، لا نصيحةً عامة. الخطأ الذي كنت تتوقعه فرصة تعليمية؛ والخطأ ذاته غير متوقَّع مقاطعة.')}
${card('مكتوب سلفًا', 'ولماذا تحدث تلك الأخطاء', 'السبب لا العرَض وحده — تداخل من اللغة الأم، أو قاعدة مفرطة التطبيق، أو سمة اعتباطية في الإنجليزية لا بد من حفظها. المعلم الذي يعرف السبب يعالجه؛ ومن يعرف الخطأ وحده لا يملك إلا تصحيحه.')}
${card('مكتوب سلفًا', 'وماذا تفعل بمن ينتهي مبكرًا', 'امتداد أصعب حقًا لا أطول فحسب. وإلا قضى أقوى متعلم في الصف درسه منتظرًا.')}
    </div>
  </div>
</section>

<section class="section--dark section-pad">
  <div class="container reveal">
    <div class="section-head">
      <span class="module-marker">مفحوص لا موثوق</span>
      <h2>الخطة تُتحقق ضد نفسها.</h2>
      <p class="lede">برنامج بهذا الحجم لا يبقى متسقًا بالعناية وحدها. عدة خصائص تُفحَص آليًا
        ويفشل البناء إن انكسرت.</p>
    </div>
    <div class="grid grid--3">
${darkCard('التسلسل', 'كل متطلب يُدرَّس أسبق', 'درسٌ يعتمد على شيء لا يدرّسه البرنامج أبدًا، أو يدرّسه لاحقًا، عيبٌ لا يجده التدقيق البشري على نحو موثوق.')}
${darkCard('التوقيت', 'دقائق المراحل تجتمع إلى الدرس', 'يُفحَص حسابيًا. وهو أرخص إشارة ممكنة إلى أن الخطة فُكِّر فيها لا جُمِّعت.')}
${darkCard('التغطية', 'كل وحدة تحمل تقييماتها', 'اختبار قصير وواجب ومعيار تصحيح، وفق سياسة واحدة منشورة، عبر الوحدات الستين كلها. الاتساق بهذا الحجم يُفرَض أو لا يوجد.')}
    </div>
  </div>
</section>

<section class="section--light section-pad" id="support" data-contents="سجل الدعم">
  <div class="container reveal">
    <div class="section-head">
      <span class="module-marker">أربعة أنواع من المعرفة</span>
      <h2>ليست كل معرفة تدريسية شيئًا واحدًا.</h2>
      <p class="lede">طمس الفوارق بينها هو كيف يصير الاجتهاد المصمَّم يُستشهَد به دليلًا. كل
        مدخلة في السجل موسومة بنوع واحد بالضبط.</p>
    </div>
    <div class="grid grid--4">
${card('مشتق', `${ltr(String(D.states.derived_from_curriculum || 0))} مدخلة`, 'مقروء من البرنامج نفسه: المتطلب الذي يسمّيه الدرس، والدقائق التي تعلنها مراحله، والالتباس الذي كُتب فحصه الذاتي ليصطاده. ليس رأيًا — حقيقة عن المنهج، وقابلة للفحص ضده.')}
${card('مُثبَت', `${ltr(String(D.states.established_pedagogy || 0))} مدخلة`, 'مشهود له في التدريس الدولي للإنجليزية وليس خاصًا بهذه الكلية — أن سين الغائب من أعند الأخطاء لدى متعلمي كل لغة أم، وأن العدّ في الإنجليزية اعتباطي ولا بد من حفظه. تركيبٌ، وموسوم أنه تركيب.')}
${card('مصمَّم', `${ltr(String(D.states.educational_expertise || 0))} مدخلة`, 'اجتهاد مؤلف من الذين كتبوا المنهج: كيف يُشرح هذا بطريقة أخرى، وأي تشبيه يصمد، وكيف يُمدّ من أنهى مبكرًا. قابل للدفاع عنه، وقابل للتحسين ممن يدرّسه فيجد أفضل.')}
${card('مُشاهَد', `${ltr(String(OBSERVED))} مدخلة`, 'ما حدث فعلًا في غرفة فيها متعلمون حقيقيون. هذا فارغ، وفارغ لأن الكلية لم تدرّس أحدًا. ولا يُملأ بالأنواع الثلاثة الأخرى.')}
    </div>
    <div class="callout">
      <span class="callout__label">الحقول</span>
      <p>${ltr(String(D.fields.length))} حقلًا في مجموعتين: ${ltr(String(derivable.length))}
        منها يُقرأ من المنهج نفسه، و${ltr(String(authored.length))} لا يُقرأ منه، فيُؤلَّف أو
        يُركَّب — ولهذا يحمل كلٌّ منها مصدره إلى جواره. أسماء الحقول معرّفات تقنية في السجل
        وتُنشر بالإنجليزية في النسخة الإنجليزية من هذه الصفحة — مبدّل اللغة أعلى
        الصفحة ينقلك إليها.</p>
    </div>
  </div>
</section>

<section class="section--dark section-pad">
  <div class="container reveal">
    <div class="section-head">
      <span class="module-marker">التغطية</span>
      <h2>مكتملة للمستوى الأول، وصادقة عن البقية.</h2>
    </div>
    <div class="grid grid--3">
${darkCard('المستوى الأول', `${ltr(String(D.levelOneLessons))} درسًا تعليميًا مدعومًا بعمق`, 'حقول الدعم المؤلفة الثمانية مكتوبة لكل درس تعليمي في المستوى الأول — المستوى الذي يلقاه المبتدئ أولًا والذي يملك المعلم فيه أضيق مساحة للارتجال. ثلاثة من حقول السجل السبعة عشر لا تحمل مدخلات بعد، والسجل يدرجها على أنها غير مُثبَتة بعد بدل أن يخفيها.')}
${darkCard('المستويات الثاني–السادس', 'مكتوبة جزئيًا', 'الحقول المقروءة من المنهج معبأة عبر البرنامج؛ والحقول المؤلفة تُكتب مستوى بمستوى. ما هو قائم هو ما هو منشور؛ ولا شيء يُستشرَف.')}
${darkCard('السجل كله', 'قابل للعدّ علنًا', `${ltr(String(FILLED))} مدخلة مؤلفة اليوم. الرقم يتحرك مع تقدم العمل ويُولَّد من السجل لا يُكتب في هذه الصفحة.`)}
    </div>
  </div>
</section>

<section class="section--light section-pad" id="companion" data-contents="الدليل المرافق">
  <div class="container reveal">
    <div class="section-head">
      <span class="module-marker">المجلد</span>
      <h2>ما يحتويه دليل المعلم المرافق.</h2>
    </div>
    <div class="grid grid--3">
${card('كل درس', `كل الدروس التعليمية الـ${ltr(String(D.levelOneLessons))} للمستوى الأول`, 'كلٌّ بمراحله ودقائقها المعلنة في رأس الصفحة الجاري، ليرى المعلم شكل الدرس دون أن يعود إلى الخطة.')}
${card('كل لوحة', 'موسومة بمصدرها', 'مشتق أو مُثبَت أو مصمَّم، مطبوعًا على اللوحة ذاتها لا مشروحًا مرة في مقدمة. المعلم الذي يخالف لوحةً يرى فورًا أيخالف المنهج أم الميدان أم المؤلفين.')}
${card('وسمٌ واحد غائب', 'المُشاهَد', 'الوسم الرابع لا يظهر في أي موضع من الكتاب، والتصدير يقول لماذا. دليلٌ يُسقط الفئة بصمت يدّعي نوعًا من السلطة لا يملكه.')}
    </div>
    <div class="callout">
      <span class="callout__label">اقرأه قبل أن تُعلّم منه</span>
      <p>الدليل المرافق مجلد منضَّد تنتجه مطبعة الكلية، وهو هنا كاملًا:
        <a href="${COMPANION_HREF}" download><strong>الدليل المرافق للمعلم، المستوى الأول</strong></a>
        — ${ltr(String(COMPANION.pages))} صفحة، ${ltr(COMPANION.mb)} ميغابايت، بصيغة PDF.
        بلا حساب ولا طلب ولا استمارة.</p>
      <p>وأمرٌ يُعرف قبل فتحه: كل مجلد أنتجته الكلية لم يراجعه بعدُ أحدٌ لم يكتبه. فإن كنت
        تُعلّم وتقبل أن تقول أين أخطأ الكتاب، فذلك أنفع ما يُصنع به، و
        <a href="mailto:info@worldwencollege.co.uk?subject=Teacher%27s%20Companion" dir="ltr">info@worldwencollege.co.uk</a>
        يبلغ المحررين الذين عليهم أن يعملوا به.</p>
    </div>
  </div>
</section>

<section class="section--light section-pad" id="development" data-contents="التطوير">
  <div class="container reveal">
    <div class="section-head">
      <span class="module-marker">الموقف</span>
      <h2>يُقال في الأعلى، لا في الأسفل.</h2>
    </div>
    <div class="callout">
      <span class="callout__label">ما هو صحيح اليوم</span>
      <p>لم يُشاهَد أي درس. ولم يُسجَّل تطوير مهني مستمر لأحد — السجل الذي سيحمله يحتوي
        ${ltr(String(D.cpd))} مدخلة. ولم يدرّس معلمٌ دفعةً في الكلية، لأنه لا توجد دفعة. وأي
        صفحة تصف تطوير المعلمين هنا برنامجًا جاريًا تصف شيئًا غير موجود.</p>
    </div>
    <div class="grid grid--3" style="margin-top:26px">
${card('ما أنتجته الكتابة', 'برنامج كامل قابل للفحص', `${ltr(String(D.modules))} وحدة، و${ltr(String(D.items))} عنصرًا مخططًا، وكل تقييم مكتوب بمعايير منشورة، و${ltr(String(FILLED))} مدخلة دعم تعليمي. وكل ذلك يستطيع أي أحد فحصه.`)}
${card('ما لا تنتجه الكتابة', 'أيًّا من النوع الرابع من المعرفة', 'ما يفعله صف حقيقي بالدرس، وأين تنكسر الخطة، وأي شرح يعمل مع أي متعلم، وكم تستغرق المرحلة فعلًا. لا شيء من هذا يُستنتَج. إنما يُشاهَد.')}
${card('والنتيجة', 'أثمن تعيين هو معلم ممارس', 'معلم واحد ودفعة واحدة وفصل واحد ينتج دليلًا لا تستطيع الكلية الحصول عليه بطريقة أخرى — وسيحسّن فورًا مادةً هي اليوم مصمَّمة لا مجرَّبة. وهو مسمًّى أولويةً في <a href="/ar/about/#structure">هيكل الكلية</a>.')}
    </div>
    <div class="callout" style="margin-top:26px">
      <span class="callout__label">الالتزام المرتبط بهذا</span>
      <p>حين تبدأ المشاهدة، سيُنشر ما تقلبه بوصفه قلبًا للحكم السابق. سجلٌّ يتبين فيه دائمًا أن
        الاجتهاد المصمَّم كان صائبًا سجلٌّ لا يفحصه أحد فعلًا.</p>
    </div>
  </div>
</section>

${cta('من يدرّس بهذا المعيار.', 'هيئة التدريس', '/ar/faculty/', 'البرامج الأكاديمية', '/ar/academics/')}`,
};

// ── write ────────────────────────────────────────────────────────────
const MANIFEST = path.join(ROOT, 'pages/manifest.json');
const manifest = JSON.parse(fs.readFileSync(MANIFEST, 'utf8'));
const entries = Array.isArray(manifest) ? manifest : manifest.pages;
const written = [];

// The four sub-pages this hub absorbs, plus its own old address.
for (const slug of ['teaching', 'teaching-lesson-design', 'teaching-support', 'teaching-companion', 'teaching-development']) {
  const i = entries.findIndex((e) => e.slug === slug);
  if (i >= 0) entries.splice(i, 1);
}

for (const p of Object.values(PAGES)) {
  fs.writeFileSync(path.join(ROOT, 'pages', p.file), p.body + '\n');
  const entry = {
    slug: p.slug, output: p.output, title: p.title, description: p.description,
    contentFile: p.file, lang: p.lang || 'en', dir: p.dir || 'ltr',
  };
  if (p.altHref) entry.altHref = p.altHref;
  if (p.contents) entry.contents = true;
  const i = entries.findIndex((e) => e.slug === p.slug);
  if (i >= 0) entries[i] = { ...entries[i], ...entry }; else entries.push(entry);
  written.push(p.output);
}

fs.writeFileSync(MANIFEST, JSON.stringify(manifest, null, 2) + '\n');
console.log(`Wrote ${written.length} Teaching-cluster pages:`);
for (const o of written) console.log(`  ${o}`);
console.log('Run `npm run build` to generate the served pages.');
