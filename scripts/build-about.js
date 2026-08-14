#!/usr/bin/env node
/**
 * THE ABOUT CLUSTER — nine pages.
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
      <p>WEC-LC holds no accreditation and has appointed no External Examiner. Its Academic
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

// 1 · VISION ──────────────────────────────────────────────────────────
PAGES.vision = {
  slug: 'about-vision', output: 'about/vision/index.html', file: 'about-vision.html',
  title: 'Vision &mdash; Worldwide English College',
  description: 'What Worldwide English College intends to become, and the standard it holds '
    + 'itself to while it gets there.',
  body: `${hero('About', 'Where we are going.',
    'To become one of the world&rsquo;s leading English language institutions, recognised for '
    + 'excellence in English language education, innovation, academic integrity, and graduate '
    + 'success.')}

<section class="section--light section-pad">
  <div class="container reveal">
    <div class="section-head">
      <span class="module-marker">The Vision</span>
      <h2>An ambition, stated as an ambition.</h2>
      <p class="lede">That sentence is a destination, not a description. WEC-LC is a new
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
${card('Three', 'Let the curriculum carry the claim', 'The strongest thing WEC-LC can show a prospective student is the programme itself: six levels, sixty modules, every lesson planned and every assessment mapped. That is inspectable today.')}
    </div>
    ${statusCallout}
  </div>
</section>

${cta('Read what the vision is built around.', 'The IEFC Programme', '/study/', 'Our Mission', '/about/mission/')}`,
};

// 2 · MISSION ─────────────────────────────────────────────────────────
PAGES.mission = {
  slug: 'about-mission', output: 'about/mission/index.html', file: 'about-mission.html',
  title: 'Mission &mdash; Worldwide English College',
  description: 'The five commitments that define what Worldwide English College does, and how '
    + 'each one is delivered in the programme.',
  body: `${hero('About', 'How we get there.',
    'Five commitments. Each one is answerable &mdash; a reader can ask what it means in the '
    + 'programme and be shown, rather than being asked to take it on trust.')}

<section class="section--light section-pad">
  <div class="container reveal">
    <div class="section-head">
      <span class="module-marker">The Mission</span>
      <h2>What the College undertakes to do.</h2>
    </div>
    <div class="grid grid--2">
${card('One', 'Deliver world-class English language education', `Delivered as ${D.levels.length} CEFR-aligned levels, ${D.levels.length * 10} modules, and ${D.levels.reduce((n, l) => n + l.units, 0)} taught hours &mdash; every lesson planned stage by stage rather than left to the room.`)}
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
        WEC-LC it has a concrete meaning, and it has repeatedly cost the College the right to
        say flattering things.</p>
    </div>
    <div class="grid grid--3">
${card('No invented staff', 'Eighteen names that will never be published', 'A realistic staff chart exists for designing the administration screens against. Every name on it is fictional, and an automated check fails the build if any of them reaches a page the public can load.')}
${card('No invented approval', 'Interim means interim', `The Level I learning outcomes and every competency mapping are recorded as interim, not approved, because the board that would approve them has ${D.bodies.find((b) => b.code === 'BASCE').members_appointed} appointed members. The pages say interim.`)}
${card('No invented evidence', 'Books that state what they do not rest on', 'The Teacher&rsquo;s Companion marks every one of its 245 panels with where it came from, and states in its front matter that it contains no classroom observation, because the College has taught nobody.')}
    </div>
  </div>
</section>

${cta('See the programme these commitments produce.', 'Study at WEC-LC', '/study/', 'Our Governance', '/about/governance/')}`,
};

// 3 · EDUCATIONAL PHILOSOPHY ──────────────────────────────────────────
PAGES.philosophy = {
  slug: 'about-philosophy', output: 'about/philosophy/index.html', file: 'about-philosophy.html',
  title: 'Educational Philosophy &mdash; Worldwide English College',
  description: 'What Worldwide English College believes about how English is learned, and how '
    + 'those beliefs shape every lesson, assessment and resource.',
  body: `${hero('About', 'What we believe about learning English.',
    'This page is an argument rather than a record. It sets out what the College holds to be '
    + 'true about language learning, and it is open to being argued with &mdash; which is the '
    + 'point of stating it rather than implying it.')}

<section class="section--light section-pad">
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

${cta('See the philosophy in a real level.', 'Level I &mdash; Foundation', '/study/level-1/', 'Teaching at WEC-LC', '/faculty/')}`,
};

// 4 · GOVERNANCE ──────────────────────────────────────────────────────
// The membership figures are read, never written. BASCE's count comes
// from the database and is expected to stay at nought until somebody is
// actually appointed to it; the Senate's comes from the register via
// scripts/lib/governance-register.js, which the migration mirrors into
// the same database. Two sources for one number is how the two come to
// disagree, so the page reads the body it is talking about.
const basceCount = D.bodies.find((b) => b.code === 'BASCE').members_appointed;
PAGES.governance = {
  slug: 'about-governance', output: 'about/governance/index.html', file: 'about-governance.html',
  title: 'Governance &mdash; Worldwide English College',
  description: 'How academic decisions are made at Worldwide English College, which bodies hold '
    + 'which authority, and which posts are currently vacant.',
  body: `${hero('About', 'Who decides what, and on what authority.',
    'The College separates academic judgement from institutional governance, from quality '
    + 'assurance, from finance, and from day-to-day administration. This page names who holds '
    + 'each of those and states plainly which posts are still unfilled &mdash; because a '
    + 'governance page that reads as though every board sits would be the most consequential '
    + 'untruth on this website.')}

${GOV.leadershipEN()}

<section class="section--light section-pad" id="bodies">
  <div class="container reveal">
    <div class="section-head">
      <span class="module-marker">Academic Bodies</span>
      <h2>The two bodies and their remits.</h2>
    </div>
    <div class="grid grid--2">
${D.bodies.map((b) => `      <div class="card">
        <span class="card__num">${esc(b.code)}</span>
        <h3>${esc(b.name)}</h3>
        <p>${esc(b.remit)}</p>
        <p class="before"><b>Established</b> ${esc(b.established_on)} &middot;
          <b>Members appointed</b> ${b.members_appointed}</p>
      </div>`).join('\n')}
    </div>
    <div class="callout">
      <span class="callout__label">What these two counts mean</span>
      <p><b>BASCE has no members</b>, and a body with no members cannot approve anything. Every
        competency decision that would properly belong to it is recorded as <b>interim</b>,
        taken under authority delegated to the Press, and marked in the database with the body
        it awaits.</p>
      <p><b>The Senate has ${GOV.SENATE_MEMBERS}</b>, and has not yet convened. That is a
        different position from BASCE&rsquo;s and it produces the same outcome for now: a body
        that can approve but has not met has not approved anything, so skill mappings and
        descriptor thresholds also remain interim. They change status when a minuted decision
        exists, not when an appointment letter does.</p>
    </div>

    <!-- The chain, drawn. The callout above states two different
         positions in prose — BASCE has nobody on it, the Senate has
         members and has not met — and prose makes them sound like the
         same sentence twice. The diagram separates them: one route
         severed, one route intact and gated, both landing in interim.
         Generated by scripts/art/generate-authority-chain.mjs, which
         reads both membership figures from the database rather than
         carrying them as text. -->
    <figure class="diagram diagram--wide">
      {{SVG:assets/art/authority-chain.svg}}
      <figcaption class="diagram__caption">
        <svg class="icon" aria-hidden="true"><use href="#i-columns"/></svg>
        Two bodies, two different reasons nothing is approved yet
      </figcaption>
    </figure>
  </div>
</section>

<section class="section--paper section-pad" id="decisions">
  <div class="container reveal">
    <div class="section-head">
      <span class="module-marker">How Decisions Are Recorded</span>
      <h2>Every academic decision carries its authority.</h2>
    </div>
    <div class="grid grid--3">
${card('Who decided', 'A named authority', 'Each mapping, outcome and threshold records the body it was decided under &mdash; BASCE or Senate &mdash; and its status. Nothing is recorded as simply true.')}
${card('On what basis', 'A stated rationale', 'Every competency mapping carries a rationale explaining why that assessment bears on that competency. A mapping without one is an opinion that has acquired the authority of a database row.')}
${card('Reviewed when', 'An annual cycle', 'The framework is reviewed annually against the evidence teaching produces. The first cycle cannot run until a cohort has been taught, and the record says so rather than describing a cycle that has never turned.')}
    </div>
  </div>
</section>

<section class="section--dark section-pad" id="vacant">
  <div class="container reveal">
    <div class="section-head">
      <span class="module-marker">Posts Not Yet Filled</span>
      <h2>What the College does not have.</h2>
      <p class="lede">Listed rather than omitted. Each of these blocks something specific, and
        naming what it blocks is more useful than a page that simply stops short.</p>
    </div>
    <div class="grid grid--2">
${darkCard('External Examiner', 'Required before any award is conferred', 'The independent post whose entire function is to sit outside the College. Until it is filled, awards are defined and published but cannot properly be conferred on anyone. No internal appointment substitutes for it, which is why filling the Board, the Senate and the Executive has not moved this one.')}
${darkCard('BASCE members', 'Required before competencies are approved', `The Board of Academic Standards and Curriculum Excellence stands at ${basceCount} appointed members. Approval, as opposed to interim adoption, waits on appointment. The Board of Governors has a Governor for Academic Affairs; that is a different body with a different remit, and it is not read as BASCE membership.`)}
${darkCard('A convened Senate', 'Required before skill mappings are approved', `The Senate has ${GOV.SENATE_MEMBERS} appointed members and has not yet met. Constituting a body and convening it are two events, and the record holds them separately so that neither can quietly stand in for the other.`)}
${darkCard('Academic Reviewer', 'Required before publications are reviewed', 'Every published volume is authored by the Press and has not been read by a qualified reader who did not write it. Each volume states this on its own imprint page. Any of the ten academic staff may now take it; the assignment simply has to be recorded.')}
    </div>
  </div>
</section>

${GOV.principlesEN()}

${cta('Read the full institutional position.', 'Institutional Status', '/about/#status', 'Quality Assurance', '/about/quality-assurance/')}`,
};

// 5 · ACADEMIC SENATE ─────────────────────────────────────────────────
const senate = D.bodies.find((b) => b.code === 'SENATE');
const senateConstituted = D.bodyEvents.find((e) => e.body_code === 'SENATE' && e.event === 'constituted');
const senateConvened = D.bodyEvents.find((e) => e.body_code === 'SENATE' && e.event === 'convened');
if (senateConvened) {
  throw new Error('The Senate now records a "convened" event. Several pages assert that it has '
    + 'not met — search for "not yet convened" and settle each one before this builds again.');
}
PAGES.senate = {
  slug: 'about-senate', output: 'about/academic-senate/index.html', file: 'about-senate.html',
  title: 'The Academic Senate &mdash; Worldwide English College',
  description: 'The remit of the Academic Senate at Worldwide English College, what it approves, '
    + 'and its current membership position.',
  body: `${hero('Governance', 'The Academic Senate.',
    esc(senate.remit))}

<section class="section--light section-pad">
  <div class="container reveal">
    <div class="stat-row">
      <div class="stat-row__item"><b>${esc(senate.code)}</b><span>Reference</span></div>
      <div class="stat-row__item"><b>${esc(senate.established_on)}</b><span>Established</span></div>
      <div class="stat-row__item"><b>${senate.members_appointed}</b><span>Members Appointed</span></div>
    </div>
    <div class="section-head">
      <span class="module-marker">Remit</span>
      <h2>What the Senate decides.</h2>
      <p class="lede">The Senate owns the relationship between what a learner is assessed on and
        what the College then says they can do. Two things specifically: which assessments count
        as evidence for which of the four language skills, and where the thresholds sit that
        turn that evidence into a descriptor on a learner&rsquo;s record.</p>
    </div>
    <div class="grid grid--2">
${card('Skill mapping', 'Which assessment evidences which skill', 'A speaking assignment is evidence of speaking; a quiz is not, however many questions it asks about spoken language. The Senate holds that boundary, because it is the one an institution is most tempted to blur when it wants a fuller record.')}
${card('Descriptor thresholds', 'How much evidence is enough', 'A descriptor asserts something about a person. The threshold that triggers it is an academic judgement about sufficiency, not a technical default, and it is the Senate&rsquo;s to set.')}
    </div>
    <div class="callout">
      <span class="callout__label">Current position</span>
      <p>The Senate has <b>${senate.members_appointed}</b> appointed members, appointed on
        ${esc(senateConstituted ? senateConstituted.occurred_on : 'a date not yet recorded')}, and
        <b>has not yet convened</b>. Skill mappings and thresholds are therefore still in the
        state the software ships them: thresholds are recorded as mechanism defaults explicitly
        labelled as <em>not an academic standard</em>, and no descriptor has been issued to
        anyone.</p>
      <p>Appointment is what makes those defaults convertible into decisions. A meeting is what
        converts them. The College distinguishes the two because an institution that treats a
        membership list as an approval has approved nothing and said it approved something.</p>
    </div>
  </div>
</section>

${cta('The other academic body.', 'BASCE', '/about/basce/', 'Governance Overview', '/about/governance/')}`,
};

// 6 · BASCE ───────────────────────────────────────────────────────────
const basce = D.bodies.find((b) => b.code === 'BASCE');
PAGES.basce = {
  slug: 'about-basce', output: 'about/basce/index.html', file: 'about-basce.html',
  title: 'BASCE &mdash; Board of Academic Standards and Curriculum Excellence',
  description: 'The Board of Academic Standards and Curriculum Excellence: its remit over the '
    + 'competency framework, and its current membership position.',
  body: `${hero('Governance', esc(basce.name),
    'BASCE owns the competency framework &mdash; what the College claims a graduate can do, and '
    + 'whether the assessments actually establish it.')}

<section class="section--light section-pad">
  <div class="container reveal">
    <div class="stat-row">
      <div class="stat-row__item"><b>${esc(basce.code)}</b><span>Reference</span></div>
      <div class="stat-row__item"><b>${esc(basce.established_on)}</b><span>Established</span></div>
      <div class="stat-row__item"><b>${basce.members_appointed}</b><span>Members Appointed</span></div>
      <div class="stat-row__item"><b>${D.competencies.length}</b><span>Competencies Defined</span></div>
    </div>
    <div class="section-head">
      <span class="module-marker">Remit</span>
      <h2>What BASCE decides.</h2>
      <p class="lede">${esc(basce.remit)}</p>
    </div>
  </div>
</section>

<section class="section--paper section-pad">
  <div class="container reveal">
    <div class="section-head">
      <span class="module-marker">The Framework</span>
      <h2>The ${D.competencies.length} competencies.</h2>
    </div>
    <div class="table-scroll">
      <table class="ledger">
        <thead><tr><th scope="col">Competency</th><th scope="col">Definition</th></tr></thead>
        <tbody>
${D.competencies.map((c) => `          <tr><td><b>${esc(c.name)}</b></td><td>${esc(c.description)}</td></tr>`).join('\n')}
        </tbody>
      </table>
    </div>
  </div>
</section>

<section class="section--dark section-pad">
  <div class="container reveal">
    <div class="section-head">
      <span class="module-marker">Current Position</span>
      <h2>Defined, mapped, and not yet approved.</h2>
    </div>
    <div class="grid grid--3">
${darkCard('Defined', `${D.competencies.length} competencies`, 'Each with a definition written to be arguable rather than unfalsifiable. "Understood the first time, by the audience actually present" can be disagreed with; "excellent communication skills" cannot.')}
${darkCard('Mapped', 'Level I assessments mapped', 'Every Level I assessment is mapped to the competencies it bears on, with a weight and a written rationale. Competencies are evidenced where they are genuinely assessed rather than distributed evenly to look complete.')}
${darkCard('Not approved', `${basce.members_appointed} members appointed`, 'Every mapping is recorded as interim. A board with no members cannot approve, and a test fails the build if any mapping is marked approved while the membership count is zero.')}
    </div>
    ${statusCallout}
  </div>
</section>

${cta('How the framework reaches a learner.', 'Assessment &amp; Awards', '/academics/iefc/', 'The Academic Senate', '/about/academic-senate/')}`,
};

// 7 · QUALITY ASSURANCE ───────────────────────────────────────────────
PAGES.qa = {
  slug: 'about-qa', output: 'about/quality-assurance/index.html', file: 'about-qa.html',
  title: 'Quality Assurance &mdash; Worldwide English College',
  description: 'How Worldwide English College assures academic quality: the mechanisms that run '
    + 'today, and the review cycles that cannot run until a cohort has been taught.',
  body: `${hero('About', 'How quality is assured, and what cannot be assured yet.',
    'Quality assurance in a new institution is mostly design. The mechanisms that check '
    + 'internal consistency run on every change; the cycles that depend on a year of teaching '
    + 'have not turned, and this page separates the two rather than describing them together.')}

<section class="section--light section-pad" id="now">
  <div class="container reveal">
    <div class="section-head">
      <span class="module-marker">Running Today</span>
      <h2>What is actually checked, and how often.</h2>
      <p class="lede">These are automated and run on every change to the curriculum, the
        assessments or the site. They are not aspirations.</p>
    </div>
    <div class="grid grid--2">
${card('Curriculum', 'Programme-wide consistency', 'Every level, module and lesson is checked for structural completeness &mdash; objectives, prerequisites, stage timings, assessment coverage &mdash; across all six levels on every change.')}
${card('Rubrics', 'Against a published policy', 'Assignment rubrics are checked against the College&rsquo;s own rubric policy: criteria count, weightings, and the presence of level-appropriate descriptors.')}
${card('Claims', 'Published figures against the record', 'Figures published on the website are checked against the academic database. A page cannot claim a module count the curriculum does not have.')}
${card('Terminology', 'One word per concept', 'Ambiguous terms are retired and the retirement is enforced automatically. One word was carrying three different meanings across the curriculum, the timetable and the platform, and a published figure drifted from the delivered programme for months because of it. Ambiguity is not a style problem; it is how an institution comes to misdescribe itself.')}
    </div>
  </div>
</section>

<section class="section--paper section-pad" id="cycles">
  <div class="container reveal">
    <div class="section-head">
      <span class="module-marker">Designed, Not Yet Run</span>
      <h2>The cycles that need a cohort.</h2>
      <p class="lede">Each of these is specified &mdash; who does it, on what evidence, how
        often. None has run, because each requires teaching that has not happened.</p>
    </div>
    <div class="grid grid--3">
${card('Annual programme review', 'Needs a year', 'The framework is reviewed annually against what teaching produced. There is no year of teaching to review.')}
${card('Lesson observation', 'Needs a classroom', 'Observed teaching is one of five evidence classes in the pedagogical record, and it is the only one that cannot be reasoned out. It is empty, and marked empty.')}
${card('External review', 'Needs an external reviewer', 'No External Examiner is appointed. Until one is, no award can properly be conferred and no external validation exists to report.')}
    </div>
    ${statusCallout}
  </div>
</section>

<section class="section--dark section-pad" id="principle">
  <div class="container reveal">
    <div class="section-head">
      <span class="module-marker">The Standard Behind It</span>
      <h2>Never trust a check because it passed.</h2>
      <p class="lede">A published engineering principle governs this work: continuously verify
        that the checks themselves measure the complete behaviour they claim to guarantee. It is
        applied by deliberately breaking each assertion and confirming it fails before restoring
        it &mdash; because a test that has never failed has never been shown to work.</p>
    </div>
    <div class="grid grid--2">
${darkCard('A worked example', 'A green deploy that published nothing', 'A deployment reported success while uploading no files: the upload command was piped, and a pipeline takes the last command&rsquo;s exit status. The badge was green and the site was months stale. The check now fails properly, and the incident is recorded rather than quietly fixed.')}
${darkCard('Another', 'A ban that protected nothing', 'A rule banning eighteen fictional names from public pages passed for months while the document containing them was itself published, because the checker assumed a directory was not served and nobody verified the assumption against the deploy.')}
    </div>
  </div>
</section>

${cta('Read the governance behind this.', 'Governance', '/about/governance/', 'Institutional Status', '/about/#status')}`,
};

// 8 · ORGANISATIONAL STRUCTURE ────────────────────────────────────────
PAGES.structure = {
  slug: 'about-structure', output: 'about/structure/index.html', file: 'about-structure.html',
  title: 'Organisational Structure &mdash; Worldwide English College',
  description: 'How Worldwide English College is organised: the academic, administrative and '
    + 'publishing functions, and which posts are currently vacant.',
  body: `${hero('About', 'How the College is organised.',
    'This page describes posts and functions, not people. Where a post is filled a register '
    + 'names the holder &mdash; the faculty register for teaching staff, the governance '
    + 'register for the Board, the Senate and the Executive &mdash; and where it is vacant this '
    + 'page says vacant.')}

<section class="section--light section-pad">
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

${cta('See who is appointed.', 'Faculty', '/faculty/', 'Governance', '/about/governance/')}`,
};

// 9 · CAREERS ─────────────────────────────────────────────────────────
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
      <a href="mailto:info@worldwencollege.co.uk?subject=Interest%20in%20a%20post%20at%20WEC-LC" class="btn btn--gold">Express Interest</a>
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

${cta('Read what you would be reviewing.', 'The IEFC Programme', '/study/', 'Our Standards', '/about/quality-assurance/')}`,
};

// ── write ────────────────────────────────────────────────────────────
const MANIFEST = path.join(ROOT, 'pages/manifest.json');
const manifest = JSON.parse(fs.readFileSync(MANIFEST, 'utf8'));
const entries = Array.isArray(manifest) ? manifest : manifest.pages;
const written = [];

for (const p of Object.values(PAGES)) {
  fs.writeFileSync(path.join(ROOT, 'pages', p.file), p.body + '\n');
  const entry = {
    slug: p.slug, output: p.output, title: p.title, description: p.description,
    contentFile: p.file, lang: 'en', dir: 'ltr',
  };
  const i = entries.findIndex((e) => e.slug === p.slug);
  if (i >= 0) entries[i] = { ...entries[i], ...entry }; else entries.push(entry);
  written.push(p.output);
}

fs.writeFileSync(MANIFEST, JSON.stringify(manifest, null, 2) + '\n');
console.log(`Wrote ${written.length} About-cluster pages:`);
for (const o of written) console.log(`  ${o}`);
console.log('Run `npm run build` to generate the served pages.');
