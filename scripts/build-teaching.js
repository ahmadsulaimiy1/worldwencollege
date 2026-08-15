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
 * go, what works with our students. WEC-LC has taught nobody. Every
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
 * The Teacher's Companion is described but not offered as a download.
 * The publication directory is excluded from the deploy surface (see
 * tests/deploy-surface.test.mjs), so a download link here would be a
 * link to a 404, and a page that offers a document the site does not
 * serve is worse than one that says how to ask for it.
 */

const fs = require('fs');
const path = require('path');
const { DatabaseSync } = require('node:sqlite');

const ROOT = path.resolve(__dirname, '..');
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

// 1 · TEACHING AT WEC-LC ──────────────────────────────────────────────
PAGES.hub = {
  slug: 'academics-teaching', output: 'academics/teaching/index.html', file: 'academics-teaching.html',
  contents: true,
  title: 'Teaching Practice &mdash; Worldwide English College',
  description: 'How WEC-LC teaches: the method, how a lesson is designed, the support record a '
    + 'teacher works from, the Companion, and how development and observation are meant to work.',
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
        four decisions that visibly determine what a WEC-LC lesson looks like.</p>
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
      <span class="callout__label">Not a download on this site</span>
      <p>The Companion is a typeset volume produced by WEC Press and is not published for
        download here. Teachers, reviewers and anyone assessing the College&rsquo;s academic work
        can request a copy from
        <a href="mailto:info@worldwencollege.co.uk?subject=Teacher%27s%20Companion">info@worldwencollege.co.uk</a>.
        It is offered particularly to anyone willing to review it &mdash; every volume the
        College has produced is currently unreviewed by anyone who did not write it.</p>
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
        has taught a WEC-LC cohort, because there has been no cohort. Any page describing teacher
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
    contentFile: p.file, lang: 'en', dir: 'ltr',
  };
  if (p.contents) entry.contents = true;
  const i = entries.findIndex((e) => e.slug === p.slug);
  if (i >= 0) entries[i] = { ...entries[i], ...entry }; else entries.push(entry);
  written.push(p.output);
}

fs.writeFileSync(MANIFEST, JSON.stringify(manifest, null, 2) + '\n');
console.log(`Wrote ${written.length} Teaching-cluster pages:`);
for (const o of written) console.log(`  ${o}`);
console.log('Run `npm run build` to generate the served pages.');
