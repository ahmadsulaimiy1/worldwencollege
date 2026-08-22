#!/usr/bin/env node
/**
 * THE ABOUT CLUSTER — two pages: the College pillar and Careers.
 * (Governance and standards moved to scripts/build-governance.js.)
 *
 * ────────────────────────────────────────────────────────────────────
 * THE PAGES AN INSTITUTION LIES ON
 * ────────────────────────────────────────────────────────────────────
 * Governance, Leadership and Quality Assurance are the three pages a
 * prospective student never reads and an accreditation panel reads
 * first. They are also the easiest pages in the world to fill with
 * organisational fiction: a board with no members described as though
 * it sits, a quality cycle described as though it has run, a leadership
 * page with names on it.
 *
 * So the governance facts are READ, not written. The two academic
 * bodies, their remits, their establishment dates and — critically —
 * their `members_appointed` counts come from the database. BASCE reads
 * zero; the Senate reads three and has not yet convened. Those are two
 * different positions producing the same outcome today, and the pages
 * distinguish them in the first paragraph rather than in a footnote,
 * because collapsing them is how "constituted" quietly becomes
 * "approved".
 *
 * ────────────────────────────────────────────────────────────────────
 * WHAT IS AUTHORED AND WHAT IS QUOTED
 * ────────────────────────────────────────────────────────────────────
 * The vision, mission and core values already exist on /about/ and are
 * quoted verbatim rather than rewritten — a second version of an
 * institution's mission is how two versions come to disagree. The
 * programme statement and the seven competencies are read from the
 * record.
 *
 * The educational philosophy is authored. It is the one page here that
 * is genuinely an argument rather than a record, and it is written as
 * one: it states what the College believes about language teaching and
 * why, and it is arguable.
 *
 * There was no Leadership page in this cluster for as long as there
 * were no leaders — a Leadership page with nobody on it is either empty
 * or invented, and docs/org-chart-placeholders.md exists precisely
 * because inventing one was considered and refused.
 *
 * That changed on 14 August 2026, when the College attested a Board of
 * Governors, an Academic Senate and an Executive. The leadership now
 * appears on /about/governance/, rendered from
 * docs/governance-register.md by scripts/lib/governance-register.js and
 * held to that register by tests/governance-register.test.mjs. The
 * discipline is unchanged and is now enforced rather than merely
 * observed: no name reaches a page unless the register carries it, and
 * a credential the College did not supply renders as nothing at all
 * rather than as a plausible guess.
 */

const fs = require('fs');
const path = require('path');
const { DatabaseSync } = require('node:sqlite');
const GOV = require('./lib/governance-register');

const ROOT = path.resolve(__dirname, '..');
const esc = (s) => String(s ?? '')
  .replace(/\s--\s/g, ' — ')
  .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');

function read() {
  const db = new DatabaseSync(':memory:');
  db.exec(fs.readFileSync(`${ROOT}/sql/schema.sql`, 'utf8'));
  const all = (s) => db.prepare(s).all();
  const out = {
    bodies: all('SELECT * FROM academic_bodies ORDER BY code'),
    // Constituted and convened are different events (migration 016). The
    // pages need to be able to say which have happened.
    bodyEvents: all('SELECT * FROM academic_body_events ORDER BY body_code, occurred_on'),
    competencies: all('SELECT * FROM competencies ORDER BY sequence'),
    programme: all('SELECT * FROM programme_definition')[0] || null,
    levels: all('SELECT * FROM programme_levels ORDER BY id'),
  };
  db.close();
  return out;
}
const D = read();
if (D.bodies.length < 2) throw new Error(`Expected the academic bodies, read ${D.bodies.length}`);
// The structure page still cites BASCE's membership count. The rest of
// the governance cluster lives in scripts/build-governance.js now.
const basce = D.bodies.find((b) => b.code === 'BASCE');

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

const hero = (eyebrow, h1, lede, buttons = '') => `<section class="section--dark section-pad">
  <div class="container">
    <span class="eyebrow">${esc(eyebrow)}</span>
    <h1>${h1}</h1>
    <p class="lede">${lede}</p>
    ${buttons}
  </div>
</section>`;

const statusCallout = `<div class="callout">
      <span class="callout__label">Institutional Status</span>
      <p>WEC holds no accreditation and has appointed no External Examiner. Its Academic
        Senate is constituted and has not yet convened; BASCE has no appointed members. The
        College states this wherever it is relevant rather than once in a footnote &mdash; see
        <a href="/about/#status">About &middot; Institutional Status</a>.</p>
    </div>`;

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

// ─────────────────────────────────────────────────────────────────────
const PAGES = {};

// The membership figures are read, never written. BASCE's count comes
// from the database and is expected to stay at nought until somebody is
// actually appointed to it; the Senate's comes from the register via
// scripts/lib/governance-register.js, which the migration mirrors into
// the same database. Two sources for one number is how the two come to
// disagree, so the page reads the body it is talking about.
const basceCount = D.bodies.find((b) => b.code === 'BASCE').members_appointed;
// ── governance, the Senate, BASCE and quality assurance ──────────────
// Moved to scripts/build-governance.js on the day Governance became a
// top-level pillar (docs/information-architecture.html). This file
// keeps the pillar, which absorbed vision, mission, philosophy and
// structure as anchored sections, and Careers.

// THE COLLEGE PILLAR ──────────────────────────────────────────────────
PAGES.pillar = {
  slug: 'about', output: 'about/index.html', file: 'about.html',
  contents: true,
  altHref: '/ar/about/',
  title: 'About the College &mdash; Worldwide English College',
  description: 'Who Worldwide English College is: its vision, mission and educational '
    + 'philosophy, how it is organised, and its institutional status stated plainly.',
  body: `<section class="section--dark section-pad">
  <div class="container">
    <span class="eyebrow">About WEC</span>
    <h1>An institution built on one conviction: English fluency changes what's possible.</h1>
    <p class="lede">Worldwide English College — London Campus is being built as an international English-language institution: one programme, six CEFR-aligned levels, taught and assessed online, for students wherever they are in the world.</p>
  </div>
</section>

<section class="section--light section-pad">
  <div class="container two-col reveal">
    <div>
      <span class="module-marker">Vision</span>
      <h2>Where we're going.</h2>
      <blockquote class="pull-quote">To become one of the world's leading English language institutions, recognised for excellence in English language education, innovation, academic integrity, and graduate success.</blockquote>
    </div>
    <div>
      <span class="module-marker">Mission</span>
      <h2>How we get there.</h2>
      <ul class="check-list">
        <li>Deliver world-class English language education.</li>
        <li>Develop confident, fluent and academically competent English speakers.</li>
        <li>Prepare learners for international study, employment and professional communication.</li>
        <li>Integrate modern educational technology with expert instruction.</li>
        <li>Provide accessible, high-quality English education to learners worldwide.</li>
      </ul>
    </div>
  </div>
</section>

<section class="section--dark section-pad">
  <div class="container reveal">
    <div class="section-head">
      <span class="module-marker">Who It Serves</span>
      <h2>Built for readers who check claims.</h2>
      <p class="lede">Families, professionals and institutions across the Gulf, Europe, Africa and Asia — students who read what they are buying before they buy it. The College writes for that reader: the full syllabus, the pricing, the policies and the current institutional status are published before enrolment, in English and in Arabic.</p>
    </div>
  </div>
</section>

<section class="section--paper section-pad" id="operating-model">
  <div class="container reveal">
    <div class="section-head">
      <span class="module-marker">Our Operating Model</span>
      <h2>Online-first by design. London-based by administration.</h2>
      <p class="lede">"London Campus" identifies WEC's administrative and management headquarters — it is not a claim of a physical teaching campus, and it never referred to more than one. Our educational delivery is intentionally online-first: every level of the IEFC is taught through live and recorded instruction inside our digital campus, so a student in Lagos, Riyadh, or Manila studies on equal footing with one in London. This is a deliberate strategic choice for global accessibility and flexibility, not a stand-in for premises we don't yet have.</p>
    </div>
    <div class="grid grid--2">
      <div class="card"><h3>What "London Campus" means</h3><p>The institution's administrative and management headquarters, and the seat of its governance — the brand and legal home of WEC.</p></div>
      <div class="card"><h3>What "London Campus" doesn't mean</h3><p>A physical building where classes are taught, or a network of regional campuses. Every student, everywhere, studies through the same online digital campus.</p></div>
    </div>
  </div>
</section>

<section class="section--light section-pad" id="status">
  <div class="container reveal">
    <div class="section-head">
      <span class="module-marker">Institutional Status</span>
      <h2>What's confirmed, and what's still being built.</h2>
      <p class="lede">Trust is earned through precision, not promises. Here is the current state of WEC.</p>
    </div>
    <div class="grid grid--2">
      <div class="card">
        <h3>Confirmed today</h3>
        <ul class="check-list">
          <li>Institutional name, motto, vision, mission and core values</li>
          <li>The full International English Fluency Course structure — six levels, CEFR alignment, curriculum and methodology</li>
          <li>Tuition structure and per-level pricing</li>
          <li>Admissions process and target learner profile</li>
          <li>Named academic leadership and the faculty roster (see <a href="/faculty/#roster">Faculty</a>)</li>
          <li>Operating model — online-first delivery worldwide, with a London administrative headquarters</li>
        </ul>
      </div>
      <div class="card">
        <h3>In progress — to be published here as confirmed</h3>
        <ul class="check-list">
          <li>Registered administrative headquarters address in London</li>
          <li>Formal accreditation and external quality-assurance affiliations</li>
          <li>Academic calendar and first-cohort start date</li>
          <li>Completion of the full lesson content within each module — all sixty modules are live; the lessons inside them are still being written (see <a href="/academics/#curriculum-status">Curriculum status</a>)</li>
        </ul>
      </div>
    </div>
    <div class="callout">
      <span class="callout__label">Our Commitment</span>
      <p>We would rather tell you plainly what isn't finished yet than dress up an incomplete claim as a settled fact. Every section on this site follows that rule — including this one.</p>
    </div>
  </div>
</section>

<section class="section--light section-pad" id="vision" data-contents="Vision">
  <div class="container reveal">
    <div class="section-head">
      <span class="module-marker">The Vision</span>
      <h2>An ambition, stated as an ambition.</h2>
      <p class="lede">That sentence is a destination, not a description. WEC is a new
        institution: it holds no accreditation, has conferred no award, and has taught no
        cohort. Publishing a vision does not change any of that, and this page does not pretend
        otherwise.</p>
    </div>
    <div class="grid grid--3">
${card('Recognised', 'Recognition has to be earned from outside', 'Recognition means external bodies attesting to quality &mdash; accreditation, external examining, professional endorsement. None of it can be self-awarded, and none of it has been obtained. The College is building the evidence such bodies ask for rather than describing itself as though they had already asked.')}
${card('Excellent', 'Excellence is a standard, not a claim', 'What can be shown today is the standard the work is held to: a mapped curriculum, published rubrics, assessments written before the teaching they test, and a policy of recording what is missing. That is measurable now; graduate success is not.')}
${card('Honest', 'The vision includes how it is pursued', 'An institution that overstates itself while becoming excellent is not becoming excellent. The refusal to publish unearned claims is part of the vision, not a constraint on it.')}
    </div>
  </div>
</section>

<section class="section--paper section-pad">
  <div class="container reveal">
    <div class="section-head">
      <span class="module-marker">What This Means In Practice</span>
      <h2>Three commitments that follow from it.</h2>
    </div>
    <div class="grid grid--3">
${card('One', 'Publish the standard before the result', 'Rubrics, pass criteria and learning outcomes are published to learners before assessment, not explained afterwards. A standard revealed after the fact is not a standard.')}
${card('Two', 'Record the gap rather than fill it', 'Where the College lacks something &mdash; an external examiner, appointed board members, classroom evidence &mdash; the record says so. Every published volume states what it does not yet rest on.')}
${card('Three', 'Let the curriculum carry the claim', 'The strongest thing WEC can show a prospective student is the programme itself: six levels, sixty modules, every lesson planned and every assessment mapped. That is inspectable today.')}
    </div>
    ${statusCallout}
  </div>
</section>

<section class="section--light section-pad" id="mission" data-contents="Mission">
  <div class="container reveal">
    <div class="section-head">
      <span class="module-marker">The Mission</span>
      <h2>What the College undertakes to do.</h2>
    </div>
    <div class="grid grid--2">
${card('One', 'Deliver world-class English language education', `Delivered as ${D.levels.length} CEFR-aligned levels, ${D.levels.length * 10} modules, and ${D.levels.reduce((n, l) => n + l.units, 0)} designed lessons &mdash; every one planned stage by stage rather than left to the room.`)}
${card('Two', 'Develop confident, fluent and academically competent speakers', 'Guided speaking is built into every lesson from the first, and the four skills are assessed separately so a learner strong in reading and weak in speaking is not described as simply "intermediate".')}
${card('Three', 'Prepare learners for study, employment and professional communication', 'The upper levels teach academic writing, meetings, negotiation, advocacy and research presentation &mdash; the registers that decide outcomes rather than the ones that pass a test.')}
${card('Four', 'Integrate modern educational technology with expert instruction', 'A learning platform carrying lessons, quizzes, self-checks and progress, plus a Listening Lab that records the learner&rsquo;s own speech for pronunciation feedback. Technology serving instruction, not replacing it.')}
${card('Five', 'Provide accessible, high-quality English education worldwide', 'Taught online from a London administrative base, with multi-currency pricing and payment routing built for learners in Africa, the Gulf, Europe and Asia rather than retrofitted for them.')}
    </div>
  </div>
</section>

<section class="section--dark section-pad">
  <div class="container reveal">
    <div class="section-head">
      <span class="module-marker">Core Values</span>
      <h2>What we hold ourselves to.</h2>
      <p class="lede">Eight values. They are ordinary words, and what makes them meaningful is
        whether an institution can be shown to act on them when it costs something.</p>
    </div>
    <div class="grid grid--4">
${['Academic Excellence', 'Integrity', 'Innovation', 'Professionalism',
    'Inclusiveness', 'Lifelong Learning', 'Global Citizenship', 'Student-Centred Education']
    .map((v) => `      <div class="card card--dark"><h3>${esc(v)}</h3></div>`).join('\n')}
    </div>
  </div>
</section>

<section class="section--paper section-pad">
  <div class="container reveal">
    <div class="section-head">
      <span class="module-marker">Integrity, Specifically</span>
      <h2>The value that costs something.</h2>
      <p class="lede">Integrity is the easiest value to list and the hardest to demonstrate. At
        WEC it has a concrete meaning, and it has repeatedly cost the College the right to
        say flattering things.</p>
    </div>
    <div class="grid grid--3">
${card('No invented staff', 'Eighteen names that will never be published', 'A realistic staff chart exists for designing the administration screens against. Every name on it is fictional, and an automated check fails the build if any of them reaches a page the public can load.')}
${card('No invented approval', 'Interim means interim', `The Level I learning outcomes and every competency mapping are recorded as interim, not approved, because the board that would approve them has ${D.bodies.find((b) => b.code === 'BASCE').members_appointed} appointed members. The pages say interim.`)}
${card('No invented evidence', 'Books that state what they do not rest on', 'The Teacher&rsquo;s Companion marks every one of its 245 panels with where it came from, and states in its front matter that it contains no classroom observation, because the College has taught nobody.')}
    </div>
  </div>
</section>

<section class="section--light section-pad" id="philosophy" data-contents="Educational Philosophy">
  <div class="container reveal">
    <div class="section-head">
      <span class="module-marker">Five Positions</span>
      <h2>The beliefs that shape every lesson.</h2>
    </div>
    <div class="grid grid--2">
${card('One', 'Speaking comes before readiness', 'Learners are asked to speak from the first lesson, before their grammar can support it. Waiting until you are accurate enough to speak is how people study a language for years and cannot use it. Accuracy is built through use, not before it.')}
${card('Two', 'A curriculum is a promise, not a suggestion', 'Every lesson states its objectives, its prerequisites and the timing of each stage, and every instructor teaches to it. This is not distrust of teachers; it is what lets a learner change class, pause and return, or be taught by two people, without losing their place.')}
${card('Three', 'Assessment criteria belong to the learner', 'Rubrics and pass criteria are published before the assessment. A learner who does not know what is being judged is being tested on guessing the examiner, and the least advantaged learners guess worst.')}
${card('Four', 'Four skills, four measurements', 'Listening, reading, speaking and writing are recorded separately. A single overall grade averages away exactly the information a learner needs &mdash; which skill is holding them back.')}
${card('Five', 'Error is data, not failure', 'Each lesson carries a self-check built around the mistakes learners at that level actually make, so a learner meets their own error privately before an examiner meets it. The traps are deliberate.')}
    </div>
  </div>
</section>

<section class="section--paper section-pad">
  <div class="container reveal">
    <div class="section-head">
      <span class="module-marker">The Competency Framework</span>
      <h2>Beyond proficiency: what fluency is for.</h2>
      <p class="lede">${esc(D.programme ? D.programme.statement : '')}</p>
    </div>
    <div class="table-scroll">
      <table class="ledger">
        <thead><tr><th scope="col">Competency</th><th scope="col">What it means</th></tr></thead>
        <tbody>
${D.competencies.map((c) => `          <tr><td><b>${esc(c.name)}</b></td><td>${esc(c.description)}</td></tr>`).join('\n')}
        </tbody>
      </table>
    </div>
    <div class="callout">
      <span class="callout__label">The status of this framework</span>
      <p>The competencies are defined and every Level I assessment is mapped to them. Those
        mappings are recorded as <b>interim</b>, approved under authority delegated to the
        Press, because the Board that would ratify them has not been constituted. They are used
        and they are not yet ratified, and the difference is recorded in the database rather
        than smoothed over.</p>
    </div>
  </div>
</section>

<section class="section--dark section-pad">
  <div class="container reveal">
    <div class="section-head">
      <span class="module-marker">What Follows</span>
      <h2>How belief becomes practice.</h2>
    </div>
    <div class="grid grid--3">
${darkCard('In the lesson', 'A plan with timings', 'Warm-up, presentation, guided practice, independent practice, listening, reading, writing, pronunciation, homework &mdash; each with stated minutes, so the speaking stage is not the one that gets cut when time runs short.')}
${darkCard('In the room', 'A teacher who knows what fails', 'Instructors work from a Companion that names, for each lesson, what commonly goes wrong, a second way to explain it, and what to do for the learner who is behind and the one who finished early.')}
${darkCard('After the lesson', 'Evidence that accumulates', 'Quiz and assignment results, time on task and pronunciation attempts build a record the learner owns and can show &mdash; not a certificate asserting a level, but evidence of what was done.')}
    </div>
  </div>
</section>

<section class="section--light section-pad" id="structure" data-contents="How It Is Organised">
  <div class="container reveal">
    <div class="section-head">
      <span class="module-marker">Three Functions</span>
      <h2>Academic, administrative, publishing.</h2>
    </div>
    <div class="grid grid--3">
${card('Academic', 'Teaching and standards', `Academic staff and tutors deliver the programme; the two academic bodies &mdash; ${D.bodies.map((b) => b.code).join(' and ')} &mdash; hold standards and the competency framework. The roster is published on the Faculty page.`)}
${card('Administrative', 'Admissions, records, finance', 'Admissions, student records, assessment administration and finance. At the College&rsquo;s current size these are designed to be held by few people rather than many, and the platform&rsquo;s access levels reflect that.')}
${card('Publishing', 'WEC Press', 'The College&rsquo;s imprint publishes the curriculum, assessment and teaching volumes. It has no separate legal personality and no staff of its own, and every volume says so.')}
    </div>
  </div>
</section>

<section class="section--paper section-pad">
  <div class="container reveal">
    <div class="section-head">
      <span class="module-marker">Separation of Duties</span>
      <h2>Three separations that are not negotiable.</h2>
      <p class="lede">These exist only to keep certain people independent of each other. They
        are the first thing an accreditation panel looks for, they cost nothing to preserve now,
        and they are expensive to unpick later.</p>
    </div>
    <div class="grid grid--3">
${card('First', 'Author &ne; Academic Reviewer', 'Nobody reviews their own work. A publication reviewed by its author has not been reviewed.')}
${card('Second', 'Reviewer &ne; External Examiner', 'The examiner&rsquo;s whole function is being outside the College. It cannot be doubled with an internal role.')}
${card('Third', 'Conferring &ne; examining', 'Whoever confers an award is not whoever examined it.')}
    </div>
    <div class="callout">
      <span class="callout__label">What this means for staffing</span>
      <p>The minimum credible academic staffing is two qualified people who are not each other,
        plus one external. Everything else at this size can legitimately be combined &mdash;
        records with assessment administration, finance with procurement, IT with learning
        technologies.</p>
    </div>
  </div>
</section>

<section class="section--dark section-pad">
  <div class="container reveal">
    <div class="section-head">
      <span class="module-marker">Vacant</span>
      <h2>Posts the College has not filled.</h2>
    </div>
    <div class="grid grid--2">
${darkCard('External Examiner', 'Blocks conferral', 'Independent of the College by definition. No award can properly be conferred until it is filled.')}
${darkCard('Academic Reviewer', 'Blocks review', 'Every published volume is authored and unreviewed by anyone who did not write it.')}
${darkCard('BASCE members', 'Blocks approval', `The Board of Academic Standards and Curriculum Excellence stands at ${basce.members_appointed} appointed members. The Academic Senate is constituted; this one is not.`)}
${darkCard('A convened Senate', 'Blocks approval', `The Senate has ${GOV.SENATE_MEMBERS} members and has not met. Appointment makes approval possible; only a meeting makes it happen.`)}
    </div>
  </div>
</section>

<section class="section--dark cta-band">
  <div class="container reveal">
    <h2>See the programme this vision is built around.</h2>
    <div class="btn-row u-center">
      <a href="/academics/#iefc" class="btn btn--gold">Explore the English programme</a>
    </div>
  </div>
</section>
`,
};

PAGES.careers = {
  slug: 'about-careers', output: 'about/careers/index.html', file: 'about-careers.html',
  title: 'Careers &mdash; Worldwide English College',
  description: 'Working at Worldwide English College: the posts the College is seeking to fill, '
    + 'what each one unblocks, and how to express interest.',
  body: `${hero('About', 'Working at Worldwide English College.',
    'The College is early. That is the honest framing for anyone considering joining it, and it '
    + 'is more useful than an invitation that implies an established department. What follows '
    + 'is what is genuinely needed and what each post would unblock.',
    `<div class="btn-row">
      <a href="mailto:info@worldwencollege.co.uk?subject=Interest%20in%20a%20post%20at%20WEC" class="btn btn--gold">Express Interest</a>
    </div>`)}

<section class="section--light section-pad">
  <div class="container reveal">
    <div class="section-head">
      <span class="module-marker">What We Are Looking For</span>
      <h2>Three posts, in order of what they unblock.</h2>
      <p class="lede">Two of these can be fractional or consultancy engagements rather than
        salaried roles. That is stated because it is true, not to diminish them.</p>
    </div>
    <div class="grid grid--3">
${card('One', 'Academic Reviewer', 'MA TESOL, Applied Linguistics or equivalent, with assessment experience. A defined number of days reading a defined list. Every publication the College has produced is currently unreviewed by anyone who did not write it, and this post changes that more than any other.')}
${card('Two', 'Practising teacher', 'Any level, any hours. One teacher, one cohort, one term generates the classroom evidence the College entirely lacks &mdash; and which cannot be reasoned out, only observed.')}
${card('Three', 'External Examiner', 'Standard sector practice, engaged per cycle. The one post whose entire function is being outside the College, and the one that must be filled before any award can be conferred.')}
    </div>
  </div>
</section>

<section class="section--paper section-pad">
  <div class="container reveal">
    <div class="section-head">
      <span class="module-marker">What You Would Be Joining</span>
      <h2>What exists, plainly.</h2>
    </div>
    <div class="grid grid--2">
${card('Exists', 'A complete programme', `${D.levels.length} levels, ${D.levels.length * 10} modules, every lesson planned stage by stage, every assessment written with published criteria, and a published set of volumes covering curriculum, assessment and teaching.`)}
${card('Does not exist', 'Everything that needs people', 'No accreditation, no external examiner, no appointed board members, no taught cohort, no graduates. A candidate should know this before the first conversation, not after.')}
    </div>
    <div class="callout">
      <span class="callout__label">How to express interest</span>
      <p>Write to <a href="mailto:info@worldwencollege.co.uk">info@worldwencollege.co.uk</a>
        naming the post. There is no application portal and no closing date; these posts are
        filled when the right person is found rather than on a schedule.</p>
    </div>
  </div>
</section>

${cta('Read what you would be reviewing.', 'The English programme', '/academics/#levels', 'Our Standards', '/governance/#quality')}`,
};

// ── write ────────────────────────────────────────────────────────────
const MANIFEST = path.join(ROOT, 'pages/manifest.json');
const manifest = JSON.parse(fs.readFileSync(MANIFEST, 'utf8'));
const entries = Array.isArray(manifest) ? manifest : manifest.pages;
const written = [];

// Absorbed into the College pillar as #vision, #mission, #philosophy
// and #structure.
for (const slug of ['about-vision', 'about-mission', 'about-philosophy', 'about-structure']) {
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
console.log(`Wrote ${written.length} About-cluster pages:`);
for (const o of written) console.log(`  ${o}`);
console.log('Run `npm run build` to generate the served pages.');
