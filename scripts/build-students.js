#!/usr/bin/env node
/**
 * THE STUDENTS CLUSTER — eight pages.
 *
 * ────────────────────────────────────────────────────────────────────
 * THE LINE THIS CLUSTER HAS TO HOLD
 * ────────────────────────────────────────────────────────────────────
 * There are no students. Nobody has enrolled, nobody has been taught,
 * nobody has been assessed and nobody has graduated. A "Student Life"
 * page, a "Results" page, an "Alumni" page or a "Graduation" page would
 * each be a photograph of something that has not happened, and the
 * College refuses to publish those.
 *
 * What genuinely exists is everything a student would MEET: a built
 * platform, an authored curriculum, a written assessment scheme, a
 * records and verification system, and a set of academic rules — some
 * adopted, some explicitly still proposals. So this cluster is written
 * as "what you will meet and how it will treat you", in the future
 * tense where the future tense is honest, and it never narrates a
 * student experience that nobody has had.
 *
 * ────────────────────────────────────────────────────────────────────
 * THE DISTINCTION THAT RUNS THROUGH EVERY PAGE
 * ────────────────────────────────────────────────────────────────────
 * Two different things both look like "the pass mark":
 *
 *   · 70% is what the PLATFORM enforces today to mark a module
 *     complete. It is live, it is in platform_config, and it governs
 *     progression right now.
 *   · The honours scheme — Pass / Merit / Distinction / High
 *     Distinction, with per-skill floors — is a PROPOSAL awaiting
 *     governance decisions B1 and B2 in docs/academic-framework.md.
 *     Nothing has been conferred under it and it can still change.
 *
 * Publishing the second as though it were the first would be the exact
 * category error this project exists to prevent, so every page that
 * touches it labels which is which.
 *
 * The same applies to academic misconduct: the College's POSITION on
 * integrity is adopted and argued (assessment design, not detection
 * software), while the PROCEDURE for handling a suspected breach is
 * governance item C9 and is marked awaiting. A student is told both.
 */

const fs = require('fs');
const path = require('path');
const { DatabaseSync } = require('node:sqlite');

const ROOT = path.resolve(__dirname, '..');
const esc = (s) => String(s ?? '')
  .replace(/\s--\s/g, ' — ')
  .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');

function read() {
  const db = new DatabaseSync(':memory:');
  db.exec(fs.readFileSync(`${ROOT}/sql/schema.sql`, 'utf8'));
  const all = (s) => db.prepare(s).all();
  const cfg = Object.fromEntries(all('SELECT key, value FROM platform_config').map((r) => [r.key, r.value]));
  const out = {
    skills: all('SELECT * FROM language_skills ORDER BY sequence'),
    competencies: all('SELECT * FROM competencies ORDER BY sequence'),
    awards: all('SELECT * FROM award_definitions ORDER BY level_id'),
    levels: all('SELECT * FROM programme_levels ORDER BY id'),
    distinctions: all('SELECT * FROM academic_distinctions'),
    cfg,
  };
  db.close();
  return out;
}
const D = read();

const PASS_PCT = Math.round(Number(JSON.parse(D.cfg.lms_pass_threshold ?? '0.7')) * 100);
if (!Number.isFinite(PASS_PCT) || PASS_PCT <= 0) throw new Error('lms_pass_threshold is not readable');
if (D.skills.length !== 4) throw new Error(`Expected four language skills, read ${D.skills.length}`);
if (D.awards.length !== D.levels.length) {
  throw new Error(`Award definitions (${D.awards.length}) and levels (${D.levels.length}) disagree`);
}
// The pages below say no distinction has been conferred. If one ever is,
// that sentence becomes false and the build should stop rather than
// keep publishing it.
if (D.distinctions.length !== 0) {
  throw new Error(`${D.distinctions.length} distinction(s) now exist — the "none conferred" wording must be rewritten.`);
}

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

const noCohort = `<div class="callout">
      <span class="callout__label">Written before the first student</span>
      <p>No cohort has yet been taught at WEC-LC. Everything on this page describes what is
        built and what the College has decided, not an experience anyone has had. Where a rule
        arrived by executive decision awaiting Senate ratification, it says so.</p>
    </div>`;

const PAGES = {};

// 1 · STUDENTS HUB ────────────────────────────────────────────────────
PAGES.hub = {
  slug: 'students', output: 'students/index.html', file: 'students.html',
  contents: true,
  title: 'Students &mdash; Worldwide English College',
  description: 'What a WEC-LC student meets: the platform, the assessment scheme, the academic '
    + 'record, and the rules that govern all three.',
  body: `${hero('Students', 'What you will meet.',
    'This section describes the parts of the College a student deals with directly &mdash; how '
    + 'you are taught, how you are assessed, what is recorded about you, and what you can do '
    + 'about any of it.',
    `<div class="btn-row">
      <a href="/student-portal/" class="btn btn--gold">The Student Portal</a>
      <a href="/students/regulations/" class="btn btn--outline">Academic Regulations</a>
    </div>`)}

<section class="section--light section-pad" id="day-one" data-contents="On Day One">
  <div class="container reveal">
    <div class="section-head">
      <span class="module-marker">On Day One</span>
      <h2>What is waiting when you enrol.</h2>
      <p class="lede">All of it is available immediately. Nothing unlocks on a date, because
        there are no dates &mdash; see <a href="/admissions/#dates">Dates</a>.</p>
    </div>
    <div class="grid grid--4">
${card('Your level', 'Ten modules', 'The level you were placed into, with its modules, lessons, exercises and assessments already written and waiting. Nothing is drip-fed.')}
${card('The Listening Lab', 'Recording and pronunciation work', 'Where you record yourself against pronunciation targets and where those recordings are kept, so that six months of change is audible rather than assumed.')}
${card('Your record', 'Your marks, held by you', 'Every attempt, every mark and every piece of feedback, visible to you as it accumulates &mdash; not summarised at the end of the level.')}
${card('The rules', 'Published before assessment', 'Criteria, thresholds and outcomes are published before you are assessed against them. A standard revealed afterwards is not a standard.')}
    </div>
  </div>
</section>

<section class="section--paper section-pad" id="guide" data-contents="Finding Your Way">
  <div class="container reveal">
    <div class="section-head">
      <span class="module-marker">This Section</span>
      <h2>Seven pages, and what each is for.</h2>
    </div>
    <div class="grid grid--3">
${card('Assessment', '<a href="/students/assessment/">How you are assessed</a>', `The four skills, the six competencies, what a mark means, and the ${PASS_PCT}% the platform actually enforces.`)}
${card('Your record', '<a href="/students/academic-record/">Your academic record</a>', 'What is stored, who can see it, and the parts of it you control rather than the College.')}
${card('The Listening Lab', '<a href="/students/#lab">The Listening Lab</a>', 'The one part of the platform students are usually surprised by, and the argument for why it exists.')}
${card('Awards', '<a href="/students/awards/">Awards and honours</a>', 'What each level is called, what the post-nominals mean, and why nothing has been conferred on anyone.')}
${card('Integrity', '<a href="/students/integrity/">Academic integrity</a>', 'The College&rsquo;s position on work that is not your own, and the procedure that has not yet been adopted.')}
${card('Regulations', '<a href="/students/regulations/">Academic regulations</a>', 'Progression, resits, standing and appeals &mdash; all in force, grouped by when each took effect.')}
${card('Support', '<a href="/students/#support">Support</a>', 'What to do when you are stuck, behind, or unhappy, and who actually answers.')}
    </div>
  </div>
</section>

<section class="section--dark section-pad">
  <div class="container reveal">
    ${noCohort}
  </div>
</section>

<section class="section--light section-pad" id="lab" data-contents="The Listening Lab">
  <div class="container reveal">
    <div class="section-head">
      <span class="module-marker">The Argument</span>
      <h2>Why recording is not optional.</h2>
      <p class="lede">Three reasons, in the order they matter.</p>
    </div>
    <div class="grid grid--3">
${card('One', 'You cannot hear yourself while speaking', 'Every learner is a poor judge of their own pronunciation in the moment, because producing a sound and evaluating it compete for the same attention. Recorded, the same sentence is suddenly assessable &mdash; by you, before anyone else hears it.')}
${card('Two', 'Improvement is invisible without a baseline', 'Progress in pronunciation is slow and continuous, which makes it exactly the kind of change nobody notices in themselves. A recording from month one played against month six settles the question in thirty seconds.')}
${card('Three', 'Speaking cannot be assessed any other way', 'A programme that marks speaking from written work is not marking speaking. Recording is not an enhancement to the assessment; it is the assessment.')}
    </div>
  </div>
</section>

<section class="section--paper section-pad">
  <div class="container reveal">
    <div class="section-head">
      <span class="module-marker">How It Works</span>
      <h2>What you actually do.</h2>
    </div>
    <ol class="dot-list">
      <li><span class="num">01</span><span><strong>Listen to the set.</strong> Each listening set carries its own audio, with the specific features the lesson is targeting marked in it &mdash; a linking sound, a stressed syllable, a contraction &mdash; rather than a general instruction to listen carefully.</span><span class="leader"></span></li>
      <li><span class="num">02</span><span><strong>Record yourself against a target.</strong> Pronunciation targets are specific and named. &ldquo;Sound more natural&rdquo; is not a target; the vowel in a particular word is.</span><span class="leader"></span></li>
      <li><span class="num">03</span><span><strong>Listen back before submitting.</strong> This step is where most of the learning happens, and it is the step learners skip. It is built into the flow deliberately.</span><span class="leader"></span></li>
      <li><span class="num">04</span><span><strong>Receive feedback from a person.</strong> Pronunciation feedback is written by a teacher against the target, not generated by a score. No automated pronunciation scoring is used, and none is claimed.</span><span class="leader"></span></li>
      <li><span class="num">05</span><span><strong>Keep the recording.</strong> It stays in your record. In six months it is evidence; deleted, it is nothing.</span><span class="leader"></span></li>
    </ol>
  </div>
</section>

<section class="section--dark section-pad">
  <div class="container reveal">
    <div class="section-head">
      <span class="module-marker">Practicalities</span>
      <h2>What it needs and what it survives.</h2>
    </div>
    <div class="grid grid--3">
${darkCard('Any microphone', 'A phone is enough', 'Studio quality is not required and would not improve the assessment. The features being marked survive an ordinary microphone.')}
${darkCard('An unreliable connection', 'Recording continues offline', 'Recording does not require a live connection. A recording made while offline is held and uploaded when the connection returns, in parts, so that a drop does not lose the whole file. This was built because the College expects students in places where connections drop.')}
${darkCard('Your own ears first', 'Nothing is submitted automatically', 'A recording is submitted when you decide it is. Nothing is captured or sent in the background.')}
    </div>
  </div>
</section>

<section class="section--light section-pad">
  <div class="container reveal">
    <div class="section-head">
      <span class="module-marker">Not Yet Produced</span>
      <h2>The honest gap in the Lab.</h2>
    </div>
    <div class="callout">
      <span class="callout__label">The audio itself</span>
      <p>The listening sets are written &mdash; scripts, targets, marked features and teaching
        notes are all authored. The recorded audio for them has not been produced. Producing it
        requires voices and a studio, and it is one of the small number of things standing
        between the programme and first delivery. It is listed as outstanding rather than
        implied to exist.</p>
    </div>
  </div>
</section>

<section class="section--light section-pad" id="support" data-contents="Support">
  <div class="container reveal">
    <div class="section-head">
      <span class="module-marker">Stuck On The Material</span>
      <h2>Built into the teaching before you have to ask.</h2>
    </div>
    <div class="grid grid--3">
${card('In the lesson', 'A second explanation, already written', 'Every lesson carries an alternative explanation of its hardest point, written in advance for the learner who did not follow the first one. Teaching that has only one route through it fails everyone who needs a different one.')}
${card('In the lesson', 'The mistakes people actually make', 'Each lesson names the common errors for that point and what causes them, so that a mistake is recognisable rather than mysterious. These are written from the language itself, not gathered from students &mdash; the College has taught no one yet, and says so.')}
${card('On demand', 'A tutorial with a teacher', 'Where the written support does not resolve it, a tutorial does. Ask; it is not rationed.')}
    </div>
  </div>
</section>

<section class="section--paper section-pad">
  <div class="container reveal">
    <div class="section-head">
      <span class="module-marker">Falling Behind</span>
      <h2>Noticed early, and answered with help.</h2>
    </div>
    <div class="grid grid--2">
${card('Why it is measured', 'To reach you, never to penalise you', 'Engagement is tracked so that a learner who has gone quiet is contacted in month two rather than discovered in month eleven. It never produces a penalty, and there is no attendance requirement to fail &mdash; the programme is asynchronous, so attendance would be the wrong measure of anything.')}
${card('What happens', 'A message, an offer, a conversation', 'Falling behind produces contact, not consequence. Someone who is behind can still finish; the entire value of noticing is reaching them while that is true.')}
    </div>
  </div>
</section>

<section class="section--dark section-pad">
  <div class="container reveal">
    <div class="section-head">
      <span class="module-marker">Unhappy With Something</span>
      <h2>Who answers, and how honestly.</h2>
    </div>
    <div class="grid grid--2">
${darkCard('Who', 'The founding team, by name', 'Every message to the College is answered by a member of the founding team. There is no ticket queue and no first-line script, which is a genuine advantage of the College&rsquo;s size and will not survive growth &mdash; so it is described as it is now.')}
${darkCard('What is missing', 'A formal complaints procedure', 'There is no independent stage to escalate to, because there is no appointed body to escalate to. That is stated on <a href="/students/regulations/">Academic regulations</a> as well, because it is the kind of gap that should not be findable in only one place.')}
    </div>
  </div>
</section>

<section class="section--light section-pad">
  <div class="container reveal">
    <div class="section-head">
      <span class="module-marker">What The College Does Not Provide</span>
      <h2>Named, so that nobody relies on it.</h2>
    </div>
    <div class="grid grid--3">
${card('No', 'Counselling or wellbeing services', 'WEC-LC has no counselling provision, no wellbeing service and no qualified staff for either. If you need that kind of support, it must come from services where you live. Implying otherwise on a website is how people in difficulty get let down.')}
${card('No', 'Careers or immigration advice', 'No careers service, and no immigration advice of any kind &mdash; see <a href="/admissions/#visas">Visas and study permits</a>.')}
${card('No', 'Disability assessment or formal adjustments', 'The College has no process for assessing a need or granting a formal adjustment. What it can do is arrange practical accommodations informally &mdash; audio-only participation, extended time, alternative formats &mdash; on request. That is a smaller offer than a policy, and it is described as the smaller thing it is.')}
    </div>
  </div>
</section>

${cta('See what a level contains.', 'The Six Levels', '/academics/#levels', 'How to Apply', '/admissions/#apply')}`,
};

// 2 · ASSESSMENT ──────────────────────────────────────────────────────
PAGES.assessment = {
  slug: 'students-assessment', output: 'students/assessment/index.html', file: 'students-assessment.html',
  title: 'How You Are Assessed &mdash; Worldwide English College',
  description: 'The four language skills, the six competencies, published rubrics, and the '
    + 'threshold the WEC-LC platform enforces today.',
  body: `${hero('Students', 'How you are assessed.',
    'Assessment at WEC-LC is written before the teaching it tests, published before you sit it, '
    + 'and reported by skill rather than as a single number. This page explains each of those '
    + 'three choices, because each of them costs the College something.')}

<section class="section--light section-pad">
  <div class="container reveal">
    <div class="section-head">
      <span class="module-marker">The Four Skills</span>
      <h2>Marked separately, and reported separately.</h2>
      <p class="lede">One aggregate mark hides the thing a language learner most needs to know.
        These four are scored apart and stay apart on the record.</p>
    </div>
    <div class="grid grid--4">
${D.skills.map((s) => card(s.mode === 'receptive' ? 'Receptive' : 'Productive', s.name, esc(s.description) + '.')).join('\n')}
    </div>
    <div class="callout">
      <span class="callout__label">Why not one mark</span>
      <p>A learner who reads well and cannot be understood aloud has a serious, specific problem,
        and an averaged mark of 74% conceals it perfectly. Separating the skills is what makes
        the weakness visible early enough to work on.</p>
    </div>
  </div>
</section>

<section class="section--paper section-pad">
  <div class="container reveal">
    <div class="section-head">
      <span class="module-marker">The Competencies</span>
      <h2>${D.competencies.length} qualities the programme claims to develop.</h2>
      <p class="lede">Skills are what you can do with the language. Competencies are what the
        College claims about you as a communicator, and each one is mapped to the specific
        assessments that evidence it.</p>
    </div>
    <div class="grid grid--3">
${D.competencies.map((c) => card(c.code, c.name, esc(c.description || c.definition || '').replace(/\.?$/, '.'))).join('\n')}
    </div>
    <p class="form-note">A competency with no assessment behind it is a marketing adjective. Each
      of these is tied to named assessments, and the mapping is inspectable rather than asserted.</p>
  </div>
</section>

<section class="section--dark section-pad">
  <div class="container reveal">
    <div class="section-head">
      <span class="module-marker">What You Sit</span>
      <h2>Four kinds of assessment, each doing a different job.</h2>
    </div>
    <div class="grid grid--4">
${darkCard('Every module', 'A quiz', 'Checks retention of what the module taught. Machine-marked, immediate, and low-stakes by design &mdash; its job is to tell you what to go back to, not to judge you.')}
${darkCard('Every module', 'An assignment', 'Produces something: a piece of writing, a recording, a task completed. Marked against a published rubric by a person.')}
${darkCard('Every module', 'Self-checks', 'Not marked and not recorded against you. They exist so you can find out what you do not know without it costing anything.')}
${darkCard('Spoken', 'Recorded speech', 'Speaking is assessed by recording you speaking. There is no substitute, and a programme that assessed speaking on paper would not be assessing speaking.')}
    </div>
  </div>
</section>

<section class="section--light section-pad">
  <div class="container reveal">
    <div class="section-head">
      <span class="module-marker">Marks</span>
      <h2>The rules that produce a mark.</h2>
      <p class="lede">Three different rules look like a pass mark and govern different things:
        completing a module, passing a level examination, and earning an honour. All three are
        in force. The table says which does what.</p>
    </div>

    <!-- The award ladder, drawn. The table below states the thresholds;
         the diagram shows the one thing a table cannot — that the gap
         between a band's floor and its overall mark narrows as the
         bands rise, which is this framework's distinguishing rule.
         Generated by scripts/art/generate-award-standard.mjs and inlined
         by scripts/build.js; tests/award-diagram.test.mjs holds the two
         in agreement. -->
    <figure class="diagram diagram--wide">
      {{SVG:assets/art/award-standard.svg}}
      <figcaption class="diagram__caption">
        <svg class="icon" aria-hidden="true"><use href="#i-scales"/></svg>
        The bar is the compensation allowed &mdash; and it narrows as the band rises
      </figcaption>
    </figure>

    <div class="table-scroll">
      <table class="ledger">
        <thead><tr><th>Rule</th><th>Status</th><th>What it governs</th></tr></thead>
        <tbody>
          <tr><td><strong>${PASS_PCT}% to complete a module</strong></td><td><strong>In force</strong></td>
              <td>The threshold the platform applies today when marking a module complete. It is set in the College&rsquo;s configuration, not written into the code, so that changing it is a recorded decision rather than a deployment.</td></tr>
          <tr><td>Level examination: ${PASS_PCT}% overall, no criterion below 50%</td><td><strong>In force</strong></td>
              <td>The summative standard. A single aggregate would let a learner pass while failing outright on one dimension; the rubrics already score criteria separately, so the floor costs nothing to enforce.</td></tr>
          <tr><td>Pass at ${PASS_PCT}%, no skill below 60%</td><td><strong>In force</strong></td>
              <td>The award standard, adopted 14 August 2026. It has been applied to nobody, because nobody has yet been assessed.</td></tr>
          <tr><td>Merit at 80%, no skill below 70%</td><td><strong>In force</strong></td><td>As above.</td></tr>
          <tr><td>Distinction at 88%, no skill below 80%</td><td><strong>In force</strong></td><td>As above.</td></tr>
          <tr><td>High Distinction at 94%, no skill below 88%</td><td><strong>In force</strong></td><td>As above.</td></tr>
        </tbody>
      </table>
    </div>
    <div class="callout">
      <span class="callout__label">The floors, and why they are unusual</span>
      <p>Most frameworks let a strong skill compensate for a weak one without limit. This one does
        not: an overall mark cannot carry a skill below its floor. The reason is plain &mdash; a
        graduate who writes excellently and cannot be understood aloud has not mastered English,
        and a certificate saying otherwise is one the College would have to defend the first time
        an employer met them. The floors cost nothing to enforce, because the skills are already
        marked separately.</p>
    </div>
  </div>
</section>

<section class="section--paper section-pad">
  <div class="container reveal">
    <div class="section-head">
      <span class="module-marker">Rubrics</span>
      <h2>You see the criteria before you are marked by them.</h2>
    </div>
    <div class="grid grid--3">
${card('Published first', 'Before the assessment, not after', 'Every assignment carries its rubric with it. Being told afterwards what you were being judged on is not feedback; it is an explanation of a verdict.')}
${card('One policy', 'The same shape everywhere', 'All sixty assignment rubrics follow a single published policy on criteria, weighting and band descriptors, and an automated check fails the build if one drifts from it. Consistency across a programme is not achievable by good intentions.')}
${card('Marked by a person', 'No automated grading of written or spoken work', 'The College has no automated grading engine and does not claim one. Quizzes are machine-marked; everything that requires judgement is judged by someone.')}
    </div>
  </div>
</section>

${cta('See the assessments themselves.', 'The Six Levels', '/academics/#levels', 'Your Academic Record', '/students/academic-record/')}`,
};

// 3 · ACADEMIC RECORD ─────────────────────────────────────────────────
PAGES.record = {
  slug: 'students-record', output: 'students/academic-record/index.html', file: 'students-record.html',
  title: 'Your Academic Record &mdash; Worldwide English College',
  description: 'What WEC-LC records about a student, who can see it, what the student controls, '
    + 'and how a third party verifies it.',
  body: `${hero('Students', 'Your academic record.',
    'What the College knows about your studying, who else can see it, and which parts of it are '
    + 'yours to decide. The last question is the one most institutions answer badly.')}

<section class="section--light section-pad">
  <div class="container reveal">
    <div class="section-head">
      <span class="module-marker">What Is Recorded</span>
      <h2>Attempts, marks, feedback and time.</h2>
    </div>
    <div class="grid grid--4">
${card('Attempts', 'Every one, not just the best', 'Quiz attempts and assignment submissions are kept with their dates. A record that shows only your best attempt is a record of your best day, not your learning.')}
${card('Marks', 'By skill and by competency', 'Not one aggregate. The whole reason for marking the four skills separately is lost if they are averaged before they reach you.')}
${card('Feedback', 'Attached to the work it is about', 'Feedback lives with the submission it responds to, so that reading it a month later still makes sense.')}
${card('Recordings', 'Your voice, kept deliberately', 'Speaking recordings are retained so that improvement over months can be heard. This is the point of them, and it is why they are not deleted after marking.')}
    </div>
  </div>
</section>

<section class="section--paper section-pad">
  <div class="container reveal">
    <div class="section-head">
      <span class="module-marker">What You Control</span>
      <h2>Three decisions that are yours, not the College&rsquo;s.</h2>
      <p class="lede">An academic record is written about you by an institution. These are the
        points at which that arrangement is deliberately reversed.</p>
    </div>
    <div class="grid grid--3">
${card('One', 'Whether your record is shared at all', 'Nothing about your studying is disclosed to anyone without you deciding it should be. The College does not publish student names, marks or progress.')}
${card('Two', 'What a share link exposes', 'You can create a link that shows a specific view of your record to a specific person &mdash; an employer, a university, a sponsor &mdash; and you decide what it contains and when it stops working.')}
${card('Three', 'Whether you appear in the Graduate Register', 'The Register is a public roll of people who hold a WEC-LC award. Appearing in it is a choice you make, not a consequence of graduating. A graduate who wants no public entry has none.')}
    </div>
  </div>
</section>

<section class="section--dark section-pad">
  <div class="container reveal">
    <div class="section-head">
      <span class="module-marker">Verification</span>
      <h2>How a stranger checks a WEC-LC credential.</h2>
      <p class="lede">A credential nobody can check is a decorated file. The verification route
        is built and open to anyone holding a code.</p>
    </div>
    <div class="grid grid--3">
${darkCard('A code', 'On every credential', 'Each issued credential carries a verification code and a scannable code that resolves to the same place. No account and no relationship with the College is needed to use either.')}
${darkCard('A signature', 'Cryptographic, not decorative', 'Credentials are signed, and the verification page checks the signature rather than merely looking the record up. A record that can be looked up but not verified can be forged by anyone who can make a convincing page.')}
${darkCard('Withdrawal is visible', 'Not deletion', 'If an award is ever withdrawn, the verification page shows it as withdrawn. A register that quietly loses entries is not a register, and the difference matters most to the people whose awards remain valid.')}
    </div>
    <div class="callout">
      <span class="callout__label">The honest state of it</span>
      <p>All of this is built and tested, and none of it has been used, because no award has been
        conferred on anyone &mdash; see <a href="/students/awards/">Awards and honours</a>. The
        verification system exists ahead of the first award deliberately: building it afterwards
        would mean the first graduates held credentials nobody could check.</p>
    </div>
  </div>
</section>

<section class="section--light section-pad">
  <div class="container reveal">
    <div class="section-head">
      <span class="module-marker">Data</span>
      <h2>Where it is held, and the gap in accountability.</h2>
    </div>
    <div class="grid grid--2">
${card('Held', 'In the College&rsquo;s own database and storage', 'Records live in the College&rsquo;s database; voice recordings live in its own object storage. Neither is passed to a third party for analysis, advertising or any other purpose.')}
${card('Missing', 'A named Data Protection owner', 'No such person has been appointed. Until one is, questions about your data are answered by the founding team. The gap is stated here and on the <a href="/admissions/policy/#data">Admissions policy</a> rather than left to be discovered.')}
    </div>
  </div>
</section>

${cta('See how marks are arrived at.', 'How You Are Assessed', '/students/assessment/', 'Awards and Honours', '/students/awards/')}`,
};

// 4 · LISTENING LAB ───────────────────────────────────────────────────


// 5 · AWARDS ──────────────────────────────────────────────────────────
PAGES.awards = {
  slug: 'students-awards', output: 'students/awards/index.html', file: 'students-awards.html',
  title: 'Awards &amp; Honours &mdash; Worldwide English College',
  description: 'The six WEC-LC awards, their post-nominals, the adopted honours scheme, and '
    + 'why no award has yet been conferred on anyone.',
  body: `${hero('Students', 'Awards and honours.',
    'Six awards, one for each level, each with its own title and post-nominal. None of them has '
    + 'been conferred on anyone, and this page explains why that is a decision rather than a '
    + 'delay.')}

<section class="section--light section-pad">
  <div class="container reveal">
    <div class="section-head">
      <span class="module-marker">The Awards</span>
      <h2>One for each level.</h2>
      <p class="lede">Each award names a real standing rather than decorating a completion. The
        first is deliberately modest, because the first is where most people stop.</p>
    </div>
    <div class="table-scroll">
      <table class="ledger">
        <thead><tr><th>Level</th><th>CEFR</th><th>Award</th><th>Post-nominal</th><th>Standing</th></tr></thead>
        <tbody>
${D.awards.map((a) => {
    const lvl = D.levels.find((l) => l.id === a.level_id);
    if (!lvl) throw new Error(`Award ${a.id} names level ${a.level_id}, which does not exist`);
    return `          <tr><td><strong>${esc(lvl.roman)} &middot; ${esc(lvl.name)}</strong></td><td>${esc(a.cefr)}</td><td>${esc(a.official_title)}</td><td><strong>${esc(a.post_nominal)}</strong></td><td>${esc(a.standing)}</td></tr>`;
  }).join('\n')}
        </tbody>
      </table>
    </div>
  </div>
</section>

<section class="section--paper section-pad">
  <div class="container reveal">
    <div class="section-head">
      <span class="module-marker">Honours</span>
      <h2>Adopted, and applied to nobody.</h2>
      <p class="lede">The scheme below was adopted by the Executive on 14 August 2026, subject to
        ratification by the Academic Senate once that body has appointed members. It is in force.
        It has been applied to no one, because no one has yet been assessed &mdash; and those are
        different statements.</p>
    </div>
    <div class="table-scroll">
      <table class="ledger">
        <thead><tr><th>Honour</th><th>Overall</th><th>Skill floor</th></tr></thead>
        <tbody>
          <tr><td><strong>Pass</strong></td><td>${PASS_PCT}%</td><td>No skill below 60%</td></tr>
          <tr><td><strong>Merit</strong></td><td>80%</td><td>No skill below 70%</td></tr>
          <tr><td><strong>Distinction</strong></td><td>88%</td><td>No skill below 80%</td></tr>
          <tr><td><strong>High Distinction</strong></td><td>94%</td><td>No skill below 88%</td></tr>
          <tr><td><strong>Distinction of the College</strong></td><td colspan="2">Conferred by decision, never calculated &mdash; and may be conferred in no cycle at all. It is named for the institution because the College has no Chancellor.</td></tr>
        </tbody>
      </table>
    </div>
    <p class="form-note">No academic distinction of any kind has been conferred on anyone. The
      record that would hold them is empty, and this page is generated from it.</p>
  </div>
</section>

<section class="section--dark section-pad">
  <div class="container reveal">
    <div class="section-head">
      <span class="module-marker">Why Nothing Has Been Conferred</span>
      <h2>The missing person, not the missing paperwork.</h2>
    </div>
    <div class="grid grid--3">
${darkCard('The reason', 'No External Examiner is appointed', 'An external examiner exists to be outside the College &mdash; to confirm that its standards are what it says they are, by someone with nothing to gain from the answer. Conferring an award without one would make the award worth less, not more, and would have to be undone rather than upgraded later.')}
${darkCard('The consequence', 'No graduates, and no graduate statistics', 'The College publishes no completion rates, employment outcomes or graduate numbers, because there are none. Every figure of that kind on a new institution&rsquo;s website is either borrowed or invented.')}
${darkCard('The commitment', 'The order will not be reversed', 'The examiner is appointed first and awards are conferred after. Doing it the other way would be cheaper, faster, and would permanently compromise every credential the College ever issues.')}
    </div>
  </div>
</section>

${cta('See how the standard is set.', 'Quality Assurance', '/governance/#quality', 'Your Academic Record', '/students/academic-record/')}`,
};

// 6 · INTEGRITY ───────────────────────────────────────────────────────
PAGES.integrity = {
  slug: 'students-integrity', output: 'students/integrity/index.html', file: 'students-integrity.html',
  title: 'Academic Integrity &mdash; Worldwide English College',
  description: 'The WEC-LC position on work that is not the learner’s own: assessment design '
    + 'rather than detection software, and the adopted procedure for a suspected breach.',
  body: `${hero('Students', 'Academic integrity.',
    'The College expects the work to be yours. It says that once, plainly, spends its effort on '
    + 'assessment that is hard to fake rather than software that tries to catch you, and has a '
    + 'procedure for a suspected breach that gives you a reply and an appeal.')}

<section class="section--light section-pad">
  <div class="container reveal">
    <div class="section-head">
      <span class="module-marker">The Position</span>
      <h2>Design, not detection.</h2>
      <p class="lede">This is a considered institutional position with a cost attached, not a
        soft-pedalled policy.</p>
    </div>
    <div class="grid grid--2">
${card('The reasoning', 'Detection is an arms race the institution loses', 'Any system built on catching people depends on staying ahead of tools that improve monthly and cost nothing. An institution whose integrity rests on detection has staked it on a race it will not win. One whose assessments require a person to be present and accountable is not in the race at all.')}
${card('The cost', 'It is more expensive to run', 'Live defence and recorded speech take staff time; a plagiarism scanner takes a subscription. The College accepts the more expensive arrangement because the cheaper one does not work.')}
    </div>
  </div>
</section>

<section class="section--paper section-pad">
  <div class="container reveal">
    <div class="section-head">
      <span class="module-marker">What Makes It Hard To Fake</span>
      <h2>Four features of the assessment scheme.</h2>
    </div>
    <div class="grid grid--4">
${card('Defended', 'The capstone is defended live', 'A learner who did not produce the work cannot defend it, and establishing that requires no detection tool &mdash; only a conversation.')}
${card('Spoken', 'Recorded speech at every level', 'Speaking assessments are your voice. Substituting for them requires substituting a person.')}
${card('Cumulative', 'A portfolio that develops', 'Development over months is visible in a portfolio, and a sudden discontinuity in voice is obvious to any reader without any tool being involved.')}
${card('Applied', 'Tasks, not essay prompts', 'Assessments ask you to do something in a situation rather than to produce prose on a topic &mdash; which is precisely what generative tools answer most easily.')}
    </div>
  </div>
</section>

<section class="section--dark section-pad">
  <div class="container reveal">
    <div class="section-head">
      <span class="module-marker">On AI Tools</span>
      <h2>Stated plainly, because you will use them.</h2>
    </div>
    <div class="grid grid--2">
${darkCard('The line', 'Submitted work must be yours', 'Work you submit for assessment must be your own production. That is the whole rule, and it applies to a generative tool exactly as it applies to a friend who writes it for you.')}
${darkCard('Not a ban on tools', 'Because a ban would be unenforceable and dishonest', 'Looking a word up, checking a phrase, asking for an explanation &mdash; these are studying. The College does not pretend to police them and does not moralise about them. What it does is assess in ways where the distinction stops mattering.')}
    </div>
  </div>
</section>

<section class="section--light section-pad">
  <div class="container reveal">
    <div class="section-head">
      <span class="module-marker">If A Breach Is Suspected</span>
      <h2>The procedure, adopted 14 August 2026.</h2>
    </div>
    <div class="grid grid--4">
${card('One', 'It is put to you first', 'A suspected breach is put to the learner before any finding is made, in writing, with what is alleged and what it rests on. A finding made without that is not defensible &mdash; to you, or to any later reviewer.')}
${card('Two', 'You respond', 'Your response is part of the record and is considered before the decision, not after it. There is no stage at which a conclusion is reached and then explained to you.')}
${card('Three', 'The Board decides', 'The decision, the reason and the evidence relied on are recorded together. An outcome without a recorded reason cannot be appealed against, which makes the appeal a formality.')}
${card('Four', 'You may appeal', 'To someone not involved in the original decision. This is the part that makes the rest of it mean anything, and it is not an optional extra.')}
    </div>
    <div class="callout">
      <span class="callout__label">What the procedure covers, and what it does not</span>
      <p>The two cases it is written for are submitted work that is not the learner&rsquo;s own,
        and impersonation in a spoken assessment. Where an award is withdrawn following a
        finding, the verification page shows it as <em>withdrawn</em> rather than deleting it
        &mdash; a register that quietly loses entries cannot be trusted about the entries it
        keeps. No misconduct case has been opened against anyone, because nobody has been
        taught; the procedure exists ahead of the first allegation rather than after it, which is
        the only order in which it can be fair.</p>
    </div>
  </div>
</section>

${cta('See how assessments are designed.', 'How You Are Assessed', '/students/assessment/', 'Academic Regulations', '/students/regulations/')}`,
};

// 7 · REGULATIONS ─────────────────────────────────────────────────────
PAGES.regulations = {
  slug: 'students-regulations', output: 'students/regulations/index.html', file: 'students-regulations.html',
  title: 'Academic Regulations &mdash; Worldwide English College',
  description: 'Progression, resits, academic standing and appeals at WEC-LC, separated into '
    + 'when each rule took effect and on whose authority.',
  body: `${hero('Students', 'Academic regulations.',
    'The rules that govern progression and standing. All of them are in force. The page keeps '
    + 'them in two groups because they took effect at different times, and a student is entitled '
    + 'to see which rule arrived when.')}

<section class="section--light section-pad">
  <div class="container reveal">
    <div class="section-head">
      <span class="module-marker">In Force</span>
      <h2>Rules operating today.</h2>
    </div>
    <div class="grid grid--3">
${card('Progression', 'One level at a time', 'A level opens when the level before it is completed. This applies whether you paid per level or for the whole programme &mdash; nothing is withheld from you; a level simply opens when you are ready for it.')}
${card('Completion', `${PASS_PCT}% to complete a module`, 'The threshold the platform applies. It is held in configuration rather than in code, so changing it is a recorded decision.')}
${card('Confirmation', 'A person confirms a level is finished', 'There is no automated grading engine. A member of staff confirms completion, which then opens the next level. The College says so rather than implying automation it does not have.')}
    </div>
  </div>
</section>

<section class="section--paper section-pad">
  <div class="container reveal">
    <div class="section-head">
      <span class="module-marker">Also In Force</span>
      <h2>Adopted on 14 August 2026.</h2>
      <p class="lede">These were carried as drafted recommendations for months. They are now
        decisions of the Executive, in force, and the academic ones are subject to ratification
        by the Academic Senate once it has appointed members.</p>
    </div>
    <div class="table-scroll">
      <table class="ledger">
        <thead><tr><th>Rule</th><th>Proposal</th></tr></thead>
        <tbody>
          <tr><td><strong>Resits</strong></td><td>Two resits per summative assessment; no resit sooner than 14 days after the previous attempt; a capstone resit requires a new task rather than a resubmission; a third failure means the level is repeated.</td></tr>
          <tr><td><strong>Resit marks</strong></td><td>Capped at Pass. An honour should reflect performance at the standard the first time it was met.</td></tr>
          <tr><td><strong>Honours thresholds</strong></td><td>Pass, Merit, Distinction and High Distinction with per-skill floors &mdash; see <a href="/students/awards/">Awards and honours</a>.</td></tr>
          <tr><td><strong>Misconduct procedure</strong></td><td>Investigation, right of reply before any finding, defined range of outcomes, and appeal to someone not involved in the original decision &mdash; see <a href="/students/integrity/">Academic integrity</a>.</td></tr>
        </tbody>
      </table>
    </div>
  </div>
</section>

<section class="section--dark section-pad">
  <div class="container reveal">
    <div class="section-head">
      <span class="module-marker">Academic Standing</span>
      <h2>Three states, and one rule that overrides them.</h2>
    </div>
    <div class="grid grid--3">
${darkCard('In Good Standing', 'Meeting requirements', 'The ordinary state, and the one nobody needs to think about.')}
${darkCard('Under Review', 'Two failed summatives, or a flagged review', 'Triggers a tutorial, not a sanction. The purpose of noticing that someone is struggling is to reach them, and a penalty reaches nobody.')}
${darkCard('Suspended Progression', 'Pending resolution of an integrity matter', 'Progression pauses; access does not stop. It is the narrowest measure that resolves the situation.')}
    </div>
    <div class="callout">
      <span class="callout__label">The overriding rule</span>
      <p>No standing removes your access to learning. Nothing expires, locks or is withdrawn.
        That is partly principle and partly plain sense: each of those would carry contractual
        and consumer-protection weight the College has not taken on and does not intend to.</p>
    </div>
  </div>
</section>

<section class="section--light section-pad">
  <div class="container reveal">
    <div class="section-head">
      <span class="module-marker">Appeals</span>
      <h2>What you can do, and what does not exist yet.</h2>
    </div>
    <div class="grid grid--2">
${card('Exists', 'A written answer from a person', 'Challenge a mark, a decision or a piece of feedback by writing to the College, and you will receive a written response with reasons. Every such exchange is kept on the record.')}
${card('Does not exist', 'An independent stage', 'There is no body to escalate to. Both of the College&rsquo;s academic bodies stand at zero appointed members, so an &ldquo;independent&rdquo; appeal would currently be the same people reconsidering. Publishing an appeals procedure with no independent stage would be publishing a formality.')}
    </div>
  </div>
</section>

${cta('See who is meant to hear an appeal.', 'Governance', '/governance/', 'Support', '/students/#support')}`,
};

// 8 · SUPPORT ─────────────────────────────────────────────────────────


// ── write ────────────────────────────────────────────────────────────
const MANIFEST = path.join(ROOT, 'pages/manifest.json');
const manifest = JSON.parse(fs.readFileSync(MANIFEST, 'utf8'));
const entries = Array.isArray(manifest) ? manifest : manifest.pages;
const written = [];

// Absorbed into the Student Life pillar as #lab and #support.
for (const slug of ['students-listening-lab', 'students-support']) {
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
console.log(`Wrote ${written.length} Students-cluster pages:`);
for (const o of written) console.log(`  ${o}`);
console.log('Run `npm run build` to generate the served pages.');
