#!/usr/bin/env node
/**
 * THE GOVERNANCE PILLAR — one flagship page and its two registers.
 *
 * ────────────────────────────────────────────────────────────────────
 * WHY THIS GENERATOR EXISTS
 * ────────────────────────────────────────────────────────────────────
 * The information architecture (docs/information-architecture.html)
 * moves Governance to the top level and collapses seven routes into it:
 * the old /about/governance/, the Academic Senate, BASCE, Quality
 * Assurance, /standards/, verification and research. The two registers
 * — evidence and decisions — move with the pillar but keep pages of
 * their own, because a register is generated from the record and
 * changes on the record's schedule, not the site's.
 *
 * Before this file, that material lived in two generators: the
 * governance cluster in build-about.js and the standards cluster in
 * build-standards.js. It is re-homed rather than duplicated — both
 * donors no longer render any of it — because the alternative was a
 * pillar page assembled from fragments owned by two other files, which
 * is how one section gets updated and its neighbour does not.
 *
 * ────────────────────────────────────────────────────────────────────
 * THE SHAPE OF THE PILLAR
 * ────────────────────────────────────────────────────────────────────
 * Thirteen anchored sections, and the anchor set is load-bearing: the
 * redirect map (scripts/lib/route-map.js) points every retired route at
 * one of these ids, and tests/route-map.test.mjs fails if an anchor a
 * redirect lands on does not exist. Absorbed pages contribute their
 * original bands nearly verbatim; only the FIRST band of each carries
 * the anchor id, so the contents rail lists thirteen destinations
 * rather than every stripe of colour on a very long page.
 *
 * Everything the donors enforced still holds here: the Senate's
 * convened-event tripwire, the zero-approvals guard on the evidence
 * register, the refusal to publish decision counts that could not be
 * read from the register itself.
 */

const fs = require('fs');
const path = require('path');
const { DatabaseSync } = require('node:sqlite');
const GOV = require('./lib/governance-register');

const ROOT = path.resolve(__dirname, '..');
const ltr = (v) => `<span dir="ltr">${v}</span>`;
const esc = (s) => String(s ?? '')
  .replace(/\s--\s/g, ' — ')
  .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');

// ── the record: academic bodies and the competency framework ─────────
function readBodies() {
  const db = new DatabaseSync(':memory:');
  db.exec(fs.readFileSync(`${ROOT}/sql/schema.sql`, 'utf8'));
  const all = (s) => db.prepare(s).all();
  const out = {
    bodies: all('SELECT * FROM academic_bodies ORDER BY code'),
    bodyEvents: all('SELECT * FROM academic_body_events ORDER BY body_code, occurred_on'),
    competencies: all('SELECT * FROM competencies ORDER BY sequence'),
  };
  db.close();
  return out;
}
const D = readBodies();
if (D.bodies.length < 2) throw new Error(`Expected the academic bodies, read ${D.bodies.length}`);
const senate = D.bodies.find((b) => b.code === 'SENATE');
const basce = D.bodies.find((b) => b.code === 'BASCE');
const senateConstituted = D.bodyEvents.find((e) => e.body_code === 'SENATE' && e.event === 'constituted');
if (D.bodyEvents.find((e) => e.body_code === 'SENATE' && e.event === 'convened')) {
  throw new Error('The Senate now records a "convened" event. This page asserts it has not met — '
    + 'search for "not yet convened" and settle each claim before this builds again.');
}
const basceCount = basce.members_appointed;

// ── the record: the evidence register ────────────────────────────────
function readEvidence() {
  const db = new DatabaseSync(':memory:');
  db.exec(fs.readFileSync(`${ROOT}/sql/schema.sql`, 'utf8'));
  db.exec(fs.readFileSync(`${ROOT}/sql/seed-evidence-centre.sql`, 'utf8'));
  const all = (s) => db.prepare(s).all();
  const out = {
    total: all('SELECT COUNT(*) n FROM evidence_items')[0].n,
    approved: all('SELECT COUNT(*) n FROM evidence_items WHERE approved_at IS NOT NULL')[0].n,
    states: Object.fromEntries(all('SELECT state, COUNT(*) n FROM evidence_items GROUP BY state').map((r) => [r.state, r.n])),
    collections: all('SELECT collection, state, COUNT(*) n FROM evidence_items GROUP BY collection, state ORDER BY collection'),
    publicItems: all("SELECT reference, title FROM evidence_items WHERE classification = 'public' ORDER BY reference"),
  };
  db.close();
  return out;
}
const E = readEvidence();

// The register's central sentence is that nothing has been approved,
// because nobody is appointed to approve it. If that changes, the page
// is wrong and should stop being published until it is rewritten.
if (E.approved !== 0) {
  throw new Error(`${E.approved} evidence item(s) are now approved — /governance/evidence/ states none are.`);
}

// ── the record: the decisions register ───────────────────────────────
const govDoc = fs.readFileSync(path.join(ROOT, 'docs/governance-decisions.md'), 'utf8');
const awaiting = (govDoc.match(/\*\*Decision:\*\*\s*☐\s*awaiting/g) || []).length;
const adoptedEarly = [...govDoc.matchAll(/^### (\w+)\s*[—-]?\s*(.+?)\s*\*\(adopted ([^)]+)\)\*/gm)]
  .map((m) => ({ ref: m[1], title: m[2].replace(/\*+/g, '').trim(), when: m[3] }));
const ADOPTION_DATE = '14 August 2026';
const adoptedNow = [...govDoc.matchAll(/^### ([A-Z]\d+[a-z]?)\.\s*(.+)$/gm)]
  .map((m) => ({ ref: m[1], title: m[2].replace(/\*+/g, '').trim() }))
  .filter((d) => {
    const i = govDoc.indexOf(`### ${d.ref}.`);
    const next = govDoc.indexOf('\n### ', i + 1);
    const body = govDoc.slice(i, next === -1 ? undefined : next);
    return body.includes(`ADOPTED ${ADOPTION_DATE}`);
  });
const totalAdopted = adoptedEarly.length + adoptedNow.length;
if (!adoptedNow.length || !adoptedEarly.length) {
  throw new Error(`Read ${adoptedEarly.length} early and ${adoptedNow.length} newly adopted `
    + 'decisions — refusing to publish a governance page whose figures could not be read from '
    + 'the register.');
}
if (awaiting) {
  throw new Error(`${awaiting} decision(s) are outstanding again. The decisions page states that `
    + 'none is — rewrite the page rather than letting it publish a number it did not read.');
}

// ── shared components ────────────────────────────────────────────────
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

// ── the Senate's remit, folded into its roster section ───────────────
// The absorbed Academic Senate page becomes part of the roster's own
// #senate section rather than a second section with a near-identical
// name — one place for the Senate: who sits on it, what it decides, and
// where that leaves the record today.
const senateExtra = `
    <div class="section-head" style="margin-top:44px">
      <h3 style="font-size:1.2rem">What the Senate decides.</h3>
      <p class="lede">The Senate owns the relationship between what a learner is assessed on and
        what the College then says they can do: which assessments count as evidence for which of
        the four language skills, and where the thresholds sit that turn that evidence into a
        descriptor on a learner&rsquo;s record.</p>
    </div>
    <div class="grid grid--2">
      <div class="card card--dark">
        <span class="card__num">Skill mapping</span>
        <h3>Which assessment evidences which skill</h3>
        <p>A speaking assignment is evidence of speaking; a quiz is not, however many questions
          it asks about spoken language. The Senate holds that boundary, because it is the one an
          institution is most tempted to blur when it wants a fuller record.</p>
      </div>
      <div class="card card--dark">
        <span class="card__num">Descriptor thresholds</span>
        <h3>How much evidence is enough</h3>
        <p>A descriptor asserts something about a person. The threshold that triggers it is an
          academic judgement about sufficiency, not a technical default, and it is the
          Senate&rsquo;s to set. Its ${GOV.SENATE_MEMBERS} members were appointed on
          ${esc(senateConstituted ? senateConstituted.occurred_on : 'a date not yet recorded')};
          until a minuted meeting exists, thresholds remain the mechanism defaults the software
          ships, labelled as such.</p>
      </div>
    </div>`;

// 1 · THE PILLAR ──────────────────────────────────────────────────────
PAGES.pillar = {
  slug: 'governance', output: 'governance/index.html', file: 'governance.html',
  contents: true,
  title: 'Governance &mdash; Worldwide English College',
  // Under 160 characters — see the note in scripts/build-teaching.js.
  description: 'How WEC is governed: its Board, Senate and Executive, the academic bodies and their '
    + 'remits, how quality is assured, and which posts remain unfilled.',
  body: `${hero('Governance', 'Who decides what, and on what authority.',
    'The College separates academic judgement from institutional governance, from quality '
    + 'assurance, from finance, and from day-to-day administration. This page names who holds '
    + 'each of those, how the standard is set and checked, and which posts are still unfilled '
    + '&mdash; because a governance page that reads as though every board sits would be the '
    + 'most consequential untruth on this website.',
    `<div class="btn-row">
      <a href="/governance/evidence/" class="btn btn--gold">The Evidence Record</a>
      <a href="/governance/decisions/" class="btn btn--outline">The Decisions Register</a>
    </div>`)}

${GOV.leadershipEN({ senate: senateExtra })
    .replace('id="examiner">', 'id="examiner" data-contents="External Examiner">')}

<section class="section--light section-pad" id="authority" data-contents="The Chain of Authority">
  <div class="container reveal">
    <div class="section-head">
      <span class="module-marker">The Chain of Authority</span>
      <h2>Two bodies, two different reasons nothing is approved yet.</h2>
    </div>
    <div class="callout">
      <span class="callout__label">What the two membership counts mean</span>
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
        One route severed, one gated, both landing in interim
      </figcaption>
    </figure>
  </div>
</section>

<section class="section--paper section-pad" id="basce" data-contents="BASCE">
  <div class="container reveal">
    <div class="stat-row">
      <div class="stat-row__item"><b>${esc(basce.code)}</b><span>Reference</span></div>
      <div class="stat-row__item"><b>${esc(basce.established_on)}</b><span>Established</span></div>
      <div class="stat-row__item"><b>${basce.members_appointed}</b><span>Members Appointed</span></div>
      <div class="stat-row__item"><b>${D.competencies.length}</b><span>Competencies Defined</span></div>
    </div>
    <div class="section-head">
      <span class="module-marker">BASCE</span>
      <h2>The Board of Academic Standards and Curriculum Excellence.</h2>
      <p class="lede">${esc(basce.remit)}</p>
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

<section class="section--light section-pad">
  <div class="container reveal">
    <div class="section-head">
      <span class="module-marker">Coverage</span>
      <h2>How often each competency is actually assessed.</h2>
      <p class="lede">The table above says what the six competencies are. It cannot say how much
        weight each one currently carries, and the answer is the most useful thing in this
        section.</p>
    </div>

    <!-- The wheel, drawn. BASCE's remit — quoted verbatim above — says
         each competency is to be assessed multiple times across each
         level. The drawing measures the framework against that sentence
         and shows the polygon collapsing on the two axes that carry
         nothing, which is a thing prose can state but not show.
         Generated by scripts/art/generate-competency-wheel.mjs, which
         reads every figure from the competency mapping rather than
         carrying it as text. -->
    <figure class="diagram diagram--wide">
      {{SVG:assets/art/competency-wheel.svg}}
      <figcaption class="diagram__caption">
        <svg class="icon" aria-hidden="true"><use href="#i-compass"/></svg>
        Measured against BASCE&rsquo;s own remit
      </figcaption>
    </figure>

    <div class="callout">
      <span class="callout__label">What the shape says</span>
      <p>Command and Clarity carry most of Level I. Judgement is assessed four times, Reason
        once, and Bearing and Reach are not assessed at Level I at all. Against the remit quoted
        above &mdash; <em>each competency assessed multiple times across each level</em> &mdash;
        three of the six clear the bar today. Levels II to VI carry no competency mapping yet.</p>
      <p>This is published rather than smoothed for the same reason the mappings are recorded as
        interim: a framework that reports even coverage it does not have is worth less than one
        that reports uneven coverage it does. The gap is the work, and naming it is how it gets
        closed.</p>
    </div>
    <div class="grid grid--3">
${card('Defined', `${D.competencies.length} competencies`, 'Each with a definition written to be arguable rather than unfalsifiable. &ldquo;Understood the first time, by the audience actually present&rdquo; can be disagreed with; &ldquo;excellent communication skills&rdquo; cannot.')}
${card('Mapped', 'Level I only, so far', 'Every Level I assessment is mapped to the competencies it bears on, with a weight and a written rationale. Competencies are evidenced where they are genuinely assessed rather than distributed evenly to look complete.')}
${card('Not approved', `${basceCount} members appointed`, 'Every mapping is recorded as interim. A board with no members cannot approve, and a test fails the build if any mapping is marked approved while the membership count is zero.')}
    </div>
  </div>
</section>

<section class="section--paper section-pad" id="quality" data-contents="Quality Assurance">
  <div class="container reveal">
    <div class="section-head">
      <span class="module-marker">Quality Assurance</span>
      <h2>What is actually checked, and how often.</h2>
      <p class="lede">Quality assurance in a new institution is mostly design. The mechanisms
        that check internal consistency run on every change; the cycles that depend on a year of
        teaching have not turned. This section separates the two rather than describing them
        together.</p>
    </div>
    <div class="grid grid--2">
${card('Curriculum', 'Programme-wide consistency', 'Every level, module and lesson is checked for structural completeness &mdash; objectives, prerequisites, stage timings, assessment coverage &mdash; across all six levels on every change.')}
${card('Rubrics', 'Against a published policy', 'Assignment rubrics are checked against the College&rsquo;s own rubric policy: criteria count, weightings, and the presence of level-appropriate descriptors.')}
${card('Claims', 'Published figures against the record', 'Figures published on the website are checked against the academic database. A page cannot claim a module count the curriculum does not have.')}
${card('Terminology', 'One word per concept', 'Ambiguous terms are retired and the retirement is enforced automatically. One word was carrying three different meanings across the curriculum, the timetable and the platform, and a published figure drifted from the delivered programme for months because of it.')}
    </div>
  </div>
</section>

<section class="section--light section-pad">
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

    <!-- The cycle, drawn. The inner ring is closed and gold because the
         automated checks genuinely run on every change; the outer ring
         is open across the four stations that need a taught cohort.
         Drawing only the open ring would say the College has no quality
         assurance, which is false; drawing only the closed one would be
         the more familiar failure. Generated by
         scripts/art/generate-quality-cycle.mjs, which refuses to render
         at all if enrolments, sessions or awards stop being nought. -->
    <figure class="diagram diagram--wide">
      {{SVG:assets/art/quality-cycle.svg}}
      <figcaption class="diagram__caption">
        <svg class="icon" aria-hidden="true"><use href="#i-clocktower"/></svg>
        A cycle is only a cycle once it has come round
      </figcaption>
    </figure>
  </div>
</section>

<section class="section--dark section-pad">
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

<section class="section--paper section-pad" id="standard" data-contents="The Standard">
  <div class="container reveal">
    <div class="section-head">
      <span class="module-marker">The Standard</span>
      <h2>What holding a standard actually requires.</h2>
      <p class="lede">Written for the reader who is not a prospective student &mdash; a
        reviewer, a panel, a ministry, an employer checking a credential.</p>
    </div>
    <div class="grid grid--4">
${card('One', 'Published before it is applied', 'Outcomes, rubrics and pass criteria are published to learners before assessment, not explained afterwards. A standard revealed after the fact is not a standard; it is a justification.')}
${card('Two', 'Marked separately, floored separately', 'The four language skills are marked apart and an overall mark cannot carry a skill below its floor. Unlimited compensation is how a certificate comes to describe someone who cannot be understood aloud.')}
${card('Three', 'Written before the teaching', 'Each assessment exists before the lesson it tests, so the teaching is built toward the standard rather than the standard assembled afterwards from whatever was taught.')}
${card('Four', 'Confirmed from outside, or not confirmed', 'Nothing internal can establish that a level is pitched where it says it is. That requires an External Examiner, and none is appointed &mdash; which is why no award has been conferred.')}
    </div>
  </div>
</section>

<section class="section--light section-pad">
  <div class="container reveal">
    <div class="section-head">
      <span class="module-marker">Enforced, Not Intended</span>
      <h2>The parts a machine checks.</h2>
      <p class="lede">A programme of this size cannot be held consistent by care. Several
        properties fail the build when broken, which is the only form of consistency that
        survives a year of revisions.</p>
    </div>
    <div class="grid grid--3">
${card('Sequence', 'Every prerequisite is taught earlier', 'A lesson depending on something the programme teaches later, or never, is a defect proofreading does not reliably find.')}
${card('Rubrics', 'One published policy across all of them', 'Criteria, weighting and band descriptors follow a single policy, checked automatically. Sixty rubrics drift apart otherwise.')}
${card('Claims', 'Published figures match the record', 'Every figure on this website is checked against the curriculum it describes. A published number that quietly stopped being true is how an institution comes to misdescribe itself.')}
    </div>
    <div class="grid grid--2" style="margin-top:26px">
${card('Present', 'A complete, documented programme', `Specifications, outcomes, hours, rubrics, competency mappings and an evidence register of ${E.total} items across ${new Set(E.collections.map((c) => c.collection)).size} collections.`)}
${card('Absent', 'Everything requiring an outside party', `No accreditation, no External Examiner, no Academic Reviewer, no approved evidence item, no taught cohort and no graduates. The Board, the Senate and the Executive were appointed on ${ADOPTION_DATE} and moved none of it: every item on that list requires somebody the College cannot appoint to itself, or a meeting that has not yet happened. The ${totalAdopted} governance decisions are all taken, and they moved none of it either.`)}
    </div>
  </div>
</section>

<section class="section--paper section-pad" id="verification" data-contents="Verification">
  <div class="container reveal">
    <div class="section-head">
      <span class="module-marker">Verification</span>
      <h2>Anyone can check a credential. Nothing has been issued to check.</h2>
      <p class="lede">Anyone holding a WEC credential code can verify it without an account, a
        relationship with the College or its permission. The route is built and open, and it was
        built ahead of the first award deliberately: retrofitting a signature onto an
        already-issued credential proves nothing about when it was issued.</p>
    </div>
    <div class="grid grid--3">
${card('The holder', 'Controls what is disclosed', 'A graduate decides what a share exposes and whether they appear in the public register at all. A credential the issuer publishes without consent is a disclosure, not a credential.')}
${card('The checker', 'Needs nothing from the College', 'An employer or an institution verifying a claim should not have to write to WEC and wait. The check resolves for anyone holding the code, immediately.')}
${card('The issuer', 'Must be able to be wrong in public', 'Withdrawal shows as withdrawal rather than deletion. A register that silently loses entries cannot be trusted about the entries it keeps.')}
    </div>
    <div class="grid grid--3" style="margin-top:26px">
${card('The code', 'On every credential', 'A verification code, and a scannable code resolving to the same place. Either can be used by anyone.')}
${card('The signature', 'Checked, not displayed', 'Credentials are cryptographically signed and the verification checks the signature. A record that can only be looked up can be forged by anyone able to build a convincing page.')}
${card('The register', 'Browsable, and opt-in', 'A public roll of award-holders exists for anyone wanting to confirm a person rather than a document. Appearing in it is the graduate&rsquo;s decision, not a consequence of graduating.')}
    </div>
  </div>
</section>

<section class="section--light section-pad" id="research" data-contents="Research">
  <div class="container reveal">
    <div class="section-head">
      <span class="module-marker">Research</span>
      <h2>No findings. Four answerable questions.</h2>
      <p class="lede">Worldwide English College conducts no research: no papers, no conference
        contributions, no funded projects, no research staff, no findings. A new
        institution&rsquo;s research position is an agenda, not an output &mdash; these four
        questions came out of building the programme, and each is answerable with evidence a
        first term would generate.</p>
    </div>
    <div class="grid grid--2">
${card('One', 'Does declaring stage timings change how a lesson runs?', 'Every lesson declares minutes per stage. Nobody knows whether real teaching converges on them, exceeds them systematically, or ignores them &mdash; and the answer would revise either the plans or the practice.')}
${card('Two', 'Do the written &ldquo;common mistakes&rdquo; match the mistakes learners make?', 'The support record names the errors each point provokes, derived from the language rather than from observation. A single term of marked work would test that directly, point by point.')}
${card('Three', 'Does keeping recordings change pronunciation outcomes?', 'The Listening Lab retains recordings so improvement is audible. Whether hearing your own earlier attempt actually improves the later one is an empirical question with an obvious design and no answer here.')}
${card('Four', 'Do the per-skill floors change who passes?', 'The adopted honours scheme refuses unlimited compensation between skills. Whether that materially changes outcomes, or merely feels more rigorous, is measurable the moment there are marks.')}
    </div>
    <div class="callout">
      <span class="callout__label">If any of these is answered, the answer gets published</span>
      <p>Including &mdash; particularly &mdash; against the College. Each question could return
        an answer that embarrasses a design decision already published and printed, and those
        are the answers an institution has every incentive to lose. Until then, nothing here
        should be read as a finding, a preliminary result or work in progress. They are
        questions.</p>
    </div>
  </div>
</section>

<section class="section--paper section-pad" id="decisions" data-contents="The Registers">
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
    <div class="grid grid--2" style="margin-top:26px">
${card('The Decisions Register', `${totalAdopted} decisions, all in force`, `Every institutional decision, with its date and the authority that took it. <a href="/governance/decisions/">Read the register</a>.`)}
${card('The Evidence Record', `${E.total} items, none approved`, `Everything an external reviewer would ask for, each in one of four states &mdash; including the empty ones. <a href="/governance/evidence/">Read the record</a>.`)}
    </div>
  </div>
</section>

<section class="section--dark section-pad" id="vacant" data-contents="Posts Not Filled">
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

${cta('Read the full institutional position.', 'Institutional Status', '/about/#status', 'The Evidence Record', '/governance/evidence/')}`,
};

// 2 · THE EVIDENCE RECORD — moved from /standards/evidence/ ─────────
PAGES.evidence = {
  slug: 'governance-evidence', output: 'governance/evidence/index.html', file: 'governance-evidence.html',
  altHref: '/ar/governance/evidence/',
  title: 'The Evidence Record &mdash; Worldwide English College',
  description: `WEC's register of quality-assurance evidence: ${E.total} items, what state `
    + 'each is in, and why none has been approved.',
  body: `${hero('Governance', 'The evidence record.',
    `${E.total} items an external reviewer would ask for, each recorded in one of four states. `
    + 'This page publishes the register as it stands, including the parts of it that are empty.')}

<section class="section--light section-pad">
  <div class="container reveal">
    <div class="section-head">
      <span class="module-marker">Four States</span>
      <h2>What each item is.</h2>
      <p class="lede">An evidence register that recorded only what exists would be a list of
        strengths. This one records the absences in the same table, in the same terms.</p>
    </div>
    <div class="grid grid--4">
${card('Exists', `${E.states.exists || 0} items`, 'Written, in the College&rsquo;s possession, and producible on request. The programme specifications, the curriculum maps, the assessment regulations, the governance register itself.')}
${card('Governance pending', `${E.states.governance_pending || 0} items`, 'Not written. For five of them the decision has now been taken &mdash; the Executive adopted all twenty-five outstanding decisions on 14 August 2026 &mdash; and what is missing is the regulation somebody must draft from it. For the rest, including the College&rsquo;s own constitution, no document exists and no body with the standing to approve one has been constituted.')}
${card('Not instrumented', `${E.states.not_instrumented || 0} items`, 'Nothing collects the data at all. Live-session attendance, student feedback and academic misconduct are the clearest cases. Recorded as not instrumented rather than as zero, because &ldquo;no cases recorded&rdquo; and &ldquo;no cases occurred&rdquo; are different statements and only the first is true.')}
${card('Scheduled', `${E.states.scheduled || 0} items`, 'Cannot exist yet by their own nature &mdash; an annual monitoring report before a first year, a graduate outcomes record before a first graduate. Dated rather than pretended.')}
    </div>
  </div>
</section>

<section class="section--paper section-pad">
  <div class="container reveal">
    <div class="section-head">
      <span class="module-marker">The Number That Matters</span>
      <h2>${E.approved} of ${E.total} items have been approved.</h2>
    </div>
    <div class="callout">
      <span class="callout__label">Why it is zero</span>
      <p>Approval is not a formality &mdash; it is a named person accepting responsibility for a
        document. Both of the College&rsquo;s academic bodies stand at zero appointed members, so
        there is nobody who can approve anything. Every item in the register therefore carries an
        owner and a review interval and an empty approval field, and will keep carrying one until
        appointments are made. An institution that quietly self-approved its own evidence would
        have a full register and no assurance at all.</p>
    </div>
  </div>
</section>

<section class="section--dark section-pad">
  <div class="container reveal">
    <div class="section-head">
      <span class="module-marker">The Collections</span>
      <h2>What the register covers.</h2>
    </div>
    <div class="table-scroll">
      <table class="ledger">
        <thead><tr><th>Collection</th><th>Items</th><th>State</th></tr></thead>
        <tbody>
${(() => {
    const byCollection = new Map();
    for (const r of E.collections) {
      if (!byCollection.has(r.collection)) byCollection.set(r.collection, []);
      byCollection.get(r.collection).push(r);
    }
    const label = {
      exists: 'Exists', governance_pending: 'Drafted, awaiting an approver',
      not_instrumented: 'Nothing collects it', scheduled: 'Not yet possible',
    };
    return [...byCollection.entries()].sort((a, b) => a[0].localeCompare(b[0])).map(([name, rows]) => {
      const n = rows.reduce((a, r) => a + r.n, 0);
      const states = rows.map((r) => {
        if (!label[r.state]) throw new Error(`Unlabelled evidence state "${r.state}"`);
        return rows.length > 1 ? `${label[r.state]} (${r.n})` : label[r.state];
      }).join(', ');
      return `          <tr><td><strong>${esc(name)}</strong></td><td>${n}</td><td>${esc(states)}</td></tr>`;
    }).join('\n');
  })()}
        </tbody>
      </table>
    </div>
  </div>
</section>

<section class="section--light section-pad">
  <div class="container reveal">
    <div class="section-head">
      <span class="module-marker">Published Openly</span>
      <h2>${E.publicItems.length} items are public rather than internal.</h2>
      <p class="lede">Most of a quality register is properly internal. These are not, because a
        reader is entitled to check them without asking anyone&rsquo;s permission.</p>
    </div>
    <div class="table-scroll">
      <table class="ledger">
        <thead><tr><th>Reference</th><th>Item</th></tr></thead>
        <tbody>
${E.publicItems.map((i) => `          <tr><td><strong>${esc(i.reference)}</strong></td><td>${esc(i.title)}</td></tr>`).join('\n')}
        </tbody>
      </table>
    </div>
    <p class="form-note">Any internal item can be requested by a reviewer, a panel or a
      prospective institutional partner from
      <a href="mailto:info@worldwencollege.co.uk?subject=Evidence%20record%20request">info@worldwencollege.co.uk</a>.</p>
  </div>
</section>

${cta('See what is waiting on a decision.', 'The Decisions Register', '/governance/decisions/', 'Governance', '/governance/')}`,
};

// 3 · THE DECISIONS REGISTER — moved from /standards/decisions/ ─────
PAGES.decisions = {
  slug: 'governance-decisions', output: 'governance/decisions/index.html', file: 'governance-decisions.html',
  altHref: '/ar/governance/decisions/',
  title: 'The Decisions Register &mdash; Worldwide English College',
  description: `All ${totalAdopted} of the College's institutional decisions, in force, with the `
    + 'date and the authority that took each one.',
  body: `${hero('Governance', 'The decisions register.',
    `${totalAdopted} decisions, all of them in force, none outstanding. This page previously `
    + 'listed twenty-five as awaiting somebody with authority to say yes. It is kept in two '
    + 'groups because they took effect at different times, and a reader is entitled to see '
    + 'which rule arrived when.')}

<section class="section--light section-pad">
  <div class="container reveal">
    <div class="section-head">
      <span class="module-marker">Adopted ${esc(ADOPTION_DATE)}</span>
      <h2>${adoptedNow.length} decisions taken in one sitting.</h2>
      <p class="lede">Each had been drafted with a recommendation and carried as outstanding for
        months. Each was adopted on the recommendation as drafted, by the Executive of the
        College.</p>
    </div>
    <div class="table-scroll">
      <table class="ledger">
        <thead><tr><th>Ref</th><th>Decision</th></tr></thead>
        <tbody>
${adoptedNow.map((d) => `          <tr><td><strong>${esc(d.ref)}</strong></td><td>${esc(d.title)}</td></tr>`).join('\n')}
        </tbody>
      </table>
    </div>
    <div class="callout">
      <span class="callout__label">Which authority, precisely</span>
      <p>These are decisions of the Executive, which is the College&rsquo;s constituted
        decision-making authority. They were <em>not</em> taken by the Academic Senate or by
        BASCE, because neither body has appointed members. The academic items &mdash; the
        assessment standards and the credential rules &mdash; are therefore adopted subject to
        ratification by the Academic Senate at its first properly constituted meeting. That is
        recorded so the ratification can be a real act rather than a rubber stamp on something
        already described as senate policy.</p>
    </div>
  </div>
</section>

<section class="section--paper section-pad">
  <div class="container reveal">
    <div class="section-head">
      <span class="module-marker">Adopted Earlier</span>
      <h2>${adoptedEarly.length} taken before that.</h2>
    </div>
    <div class="table-scroll">
      <table class="ledger">
        <thead><tr><th>Ref</th><th>Decision</th><th>Adopted</th></tr></thead>
        <tbody>
${adoptedEarly.map((d) => `          <tr><td><strong>${esc(d.ref)}</strong></td><td>${esc(d.title)}</td><td>${esc(d.when)}</td></tr>`).join('\n')}
        </tbody>
      </table>
    </div>
  </div>
</section>

<section class="section--dark section-pad">
  <div class="container reveal">
    <div class="section-head">
      <span class="module-marker">What Adoption Did Not Do</span>
      <h2>Two things a decision cannot manufacture.</h2>
      <p class="lede">Deciding something is not the same as being able to act on it, and the
        difference is worth stating in the same breath as the adoption.</p>
    </div>
    <div class="grid grid--2">
${darkCard('Not conferred', 'No award, still', 'Adopting a pass mark, an honours scale and a conferral procedure makes the standard exist. It does not supply the External Examiner whose independence the standard rests on. No award is conferred until that appointment is made.')}
${darkCard('Not evidenced', 'Two decisions say so themselves', 'Speaking is adopted as <em>not yet</em> counting toward certification, precisely because no moderated marking standard exists. The competency mapping is adopted as a commission for work that has to be done, not as a claim the work is finished.')}
    </div>
  </div>
</section>

<section class="section--light section-pad">
  <div class="container reveal">
    <div class="section-head">
      <span class="module-marker">Why This Is Public</span>
      <h2>A register nobody outside can read is an internal memo.</h2>
    </div>
    <div class="grid grid--2">
${card('For a reviewer', 'It shows what was settled, when, and by whom', 'A panel&rsquo;s first question is which of an institution&rsquo;s stated positions are actually decisions, and on whose authority. This answers both without them having to ask, including where the authority was executive rather than academic.')}
${card('For a student', 'It shows which rules govern you', 'Every rule on this site now appears here as a decision with a date. Where a rule awaits Senate ratification, this page says so rather than presenting it as settled academic policy.')}
    </div>
  </div>
</section>

${cta('See the bodies that will ratify these.', 'Governance', '/governance/', 'The Evidence Record', '/governance/evidence/')}`,
};


// ── THE ARABIC EDITIONS OF THE REGISTERS ─────────────────────────────
// A register is one document, not two: translating its entries would
// create a second version of the evidence record that could disagree
// with the first. So the Arabic editions carry Arabic chrome and the
// same counts from the same reads, render the fixed collection and
// state vocabularies through guarded maps, and keep entry titles and
// references in the record's original English, wrapped for bidi and
// declared as such on the page.
const AR_COLLECTION = {
  'Academic Integrity': 'النزاهة الأكاديمية', 'Academic Regulations': 'اللوائح الأكاديمية',
  'Annual Monitoring': 'الرصد السنوي', 'Appeals': 'الاستئنافات',
  'Assessment Moderation': 'معايرة التقييم', 'Assessment Regulations': 'لوائح التقييم',
  'Competency Framework': 'إطار الكفايات', 'Continuous Improvement Register': 'سجل التحسين المستمر',
  'Curriculum Maps': 'خرائط المنهج', 'Executive Decisions': 'القرارات التنفيذية',
  'External Review Reports': 'تقارير المراجعة الخارجية', 'Faculty Qualifications': 'مؤهلات هيئة التدريس',
  'Governance': 'الحوكمة', 'Graduate Outcomes': 'مخرجات الخريجين',
  'Institutional Self-Evaluation': 'التقييم الذاتي المؤسسي', 'Internal Review Reports': 'تقارير المراجعة الداخلية',
  'Learning Outcomes': 'مخرجات التعلم', 'Policy Register': 'سجل السياسات',
  'Programme Specifications': 'مواصفات البرنامج', 'Quality Assurance': 'ضمان الجودة',
  'Risk Registers': 'سجلات المخاطر', 'Staff Development': 'تطوير الموظفين',
  'Student Feedback': 'ملاحظات الطلاب',
};
const arCollection = (en) => {
  if (!AR_COLLECTION[en]) throw new Error(`No Arabic name for evidence collection "${en}"`);
  return AR_COLLECTION[en];
};
const AR_STATE = {
  exists: 'موجود', governance_pending: 'مصاغ، بانتظار من يعتمده',
  not_instrumented: 'لا شيء يجمعه', scheduled: 'غير ممكن بعد',
};
const arRegisterNote = `<div class="callout">
      <span class="callout__label">لغة السجل</span>
      <p>السجل وثيقة واحدة لا نسختان. عناوين القيود ومراجعها تُنشر بلغتها الأصلية الإنجليزية —
        ترجمة قيود سجل أدلة تنشئ نسخة ثانية يمكن أن تخالف الأولى، وهو بالضبط ما يوجد السجل
        لمنعه. الشرح والأعداد على هذه الصفحة عربية، ومصدرها القراءات ذاتها التي تغذي النسخة
        الإنجليزية.</p>
    </div>`;

PAGES.evidenceAr = {
  slug: 'governance-evidence-ar', output: 'ar/governance/evidence/index.html', file: 'governance-evidence.ar.html',
  lang: 'ar', dir: 'rtl', altHref: '/governance/evidence/',
  title: 'سجل الأدلة — الكلية العالمية للغة الإنجليزية',
  description: `سجل أدلة ضمان الجودة في الكلية: ${E.total} قيدًا، وحالة كل منها، ولماذا لم يُعتمد أي منها.`,
  body: `<section class="section--dark section-pad">
  <div class="container">
    <span class="eyebrow">الحوكمة</span>
    <h1>سجل الأدلة.</h1>
    <p class="lede">${ltr(String(E.total))} قيدًا سيطلبها مراجع خارجي، كلٌّ مسجَّل في واحدة من
      أربع حالات. هذه الصفحة تنشر السجل كما هو، بما في ذلك أجزاؤه الفارغة.</p>
  </div>
</section>

<section class="section--light section-pad">
  <div class="container reveal">
    <div class="section-head">
      <span class="module-marker">أربع حالات</span>
      <h2>ما هو كل قيد.</h2>
      <p class="lede">سجل أدلة لا يسجل إلا ما هو موجود قائمةُ مزايا. هذا يسجل الغيابات في
        الجدول ذاته وبالمصطلحات ذاتها.</p>
    </div>
    <div class="grid grid--4">
${card('موجود', `${ltr(String(E.states.exists || 0))} قيدًا`, 'مكتوب، في حوزة الكلية، وقابل للإبراز عند الطلب. مواصفات البرنامج، وخرائط المنهج، ولوائح التقييم، وسجل الحوكمة نفسه.')}
${card('بانتظار الحوكمة', `${ltr(String(E.states.governance_pending || 0))} قيدًا`, 'مصاغ، وينتظر قرارًا لم يُتخذ. ليست وثائق مفقودة؛ إنها وثائق لم يُعيَّن بعدُ من يعتمدها.')}
${card('لا أداة تجمعه', `${ltr(String(E.states.not_instrumented || 0))} قيدًا`, 'لا شيء يجمع البيانات أصلًا. حضور الجلسات الحية وملاحظات الطلاب وسوء السلوك الأكاديمي أوضح الحالات. تُسجَّل «لا أداة تجمعه» لا صفرًا، لأن «لا حالات مسجلة» و«لا حالات وقعت» قولان مختلفان والأول وحده صحيح.')}
${card('مجدوَل', `${ltr(String(E.states.scheduled || 0))} قيدًا`, 'لا يمكن أن يوجد بعدُ بطبيعته — تقرير رصد سنوي قبل سنة أولى، وسجل مخرجات خريجين قبل خريج أول. مؤرَّخ لا مُتظاهَر به.')}
    </div>
  </div>
</section>

<section class="section--paper section-pad">
  <div class="container reveal">
    <div class="section-head">
      <span class="module-marker">الرقم المهم</span>
      <h2>${ltr(String(E.approved))} من ${ltr(String(E.total))} قيدًا اعتُمد.</h2>
    </div>
    <div class="callout">
      <span class="callout__label">لماذا هو صفر</span>
      <p>الاعتماد ليس شكلية — إنه شخص مسمًّى يقبل المسؤولية عن وثيقة. كلا الهيئتين الأكاديميتين
        في الكلية عند صفر عضو معيَّن، فلا أحد يستطيع اعتماد شيء. لذا يحمل كل قيد في السجل
        مالكًا وفاصل مراجعة وخانة اعتماد فارغة، وسيبقى كذلك حتى تُجرى التعيينات. المؤسسة التي
        تعتمد أدلتها لنفسها بصمت سجلُّها ممتلئ وضمانها معدوم.</p>
    </div>
    ${arRegisterNote}
  </div>
</section>

<section class="section--dark section-pad">
  <div class="container reveal">
    <div class="section-head">
      <span class="module-marker">المجموعات</span>
      <h2>ما يغطيه السجل.</h2>
    </div>
    <div class="table-scroll">
      <table class="ledger">
        <thead><tr><th>المجموعة</th><th>القيود</th><th>الحالة</th></tr></thead>
        <tbody>
${(() => {
    const byCollection = new Map();
    for (const r of E.collections) {
      if (!byCollection.has(r.collection)) byCollection.set(r.collection, []);
      byCollection.get(r.collection).push(r);
    }
    return [...byCollection.entries()].sort((a, b) => a[0].localeCompare(b[0])).map(([name, rows]) => {
      const n = rows.reduce((a, r) => a + r.n, 0);
      const states = rows.map((r) => {
        if (!AR_STATE[r.state]) throw new Error(`Unlabelled evidence state "${r.state}" (Arabic)`);
        return rows.length > 1 ? `${AR_STATE[r.state]} (${ltr(String(r.n))})` : AR_STATE[r.state];
      }).join('، ');
      return `          <tr><td><strong>${arCollection(name)}</strong></td><td>${ltr(String(n))}</td><td>${states}</td></tr>`;
    }).join('\n');
  })()}
        </tbody>
      </table>
    </div>
  </div>
</section>

<section class="section--light section-pad">
  <div class="container reveal">
    <div class="section-head">
      <span class="module-marker">منشور علنًا</span>
      <h2>${ltr(String(E.publicItems.length))} قيدًا علني لا داخلي.</h2>
      <p class="lede">معظم سجل الجودة داخلي بحق. هذه ليست كذلك، لأن من حق القارئ فحصها دون
        استئذان أحد. العناوين بلغة السجل الأصلية.</p>
    </div>
    <div class="table-scroll">
      <table class="ledger">
        <thead><tr><th>المرجع</th><th>القيد</th></tr></thead>
        <tbody>
${E.publicItems.map((i) => `          <tr><td><strong dir="ltr">${esc(i.reference)}</strong></td><td><span dir="ltr">${esc(i.title)}</span></td></tr>`).join('\n')}
        </tbody>
      </table>
    </div>
    <p class="form-note">يستطيع أي مراجع أو لجنة أو شريك مؤسسي محتمل طلب أي قيد داخلي من
      <a href="mailto:info@worldwencollege.co.uk?subject=Evidence%20record%20request" dir="ltr">info@worldwencollege.co.uk</a>.</p>
  </div>
</section>

${cta('انظر ما الذي كان ينتظر قرارًا.', 'سجل القرارات', '/ar/governance/decisions/', 'الحوكمة', '/ar/governance/')}`,
};

PAGES.decisionsAr = {
  slug: 'governance-decisions-ar', output: 'ar/governance/decisions/index.html', file: 'governance-decisions.ar.html',
  lang: 'ar', dir: 'rtl', altHref: '/governance/decisions/',
  title: 'سجل القرارات — الكلية العالمية للغة الإنجليزية',
  description: `قرارات الكلية المؤسسية كلها — ${totalAdopted} قرارًا نافذًا — بتاريخ كل منها والسلطة التي اتخذته.`,
  body: `<section class="section--dark section-pad">
  <div class="container">
    <span class="eyebrow">الحوكمة</span>
    <h1>سجل القرارات.</h1>
    <p class="lede">${ltr(String(totalAdopted))} قرارًا، كلها نافذة، ولا شيء منها معلَّق. كانت
      هذه الصفحة تسرد خمسة وعشرين قرارًا بانتظار من يملك سلطة الموافقة. وهي في مجموعتين لأنها
      دخلت النفاذ في وقتين مختلفين، ومن حق القارئ أن يرى أي قاعدة وصلت متى.</p>
  </div>
</section>

<section class="section--light section-pad">
  <div class="container reveal">
    <div class="section-head">
      <span class="module-marker">اعتُمدت في 14 أغسطس 2026</span>
      <h2>${ltr(String(adoptedNow.length))} قرارًا اتُّخذ في جلسة واحدة.</h2>
      <p class="lede">كلٌّ منها كان مصاغًا بتوصية ومحمولًا معلَّقًا شهورًا. واعتُمد كلٌّ على
        التوصية كما صيغت، من الإدارة التنفيذية للكلية. نصوص القرارات بلغة السجل الأصلية.</p>
    </div>
    <div class="table-scroll">
      <table class="ledger">
        <thead><tr><th>المرجع</th><th>القرار</th></tr></thead>
        <tbody>
${adoptedNow.map((d) => `          <tr><td><strong dir="ltr">${esc(d.ref)}</strong></td><td><span dir="ltr">${esc(d.title)}</span></td></tr>`).join('\n')}
        </tbody>
      </table>
    </div>
    <div class="callout">
      <span class="callout__label">أي سلطة، بدقة</span>
      <p>هذه قرارات الإدارة التنفيذية، وهي سلطة اتخاذ القرار المشكَّلة في الكلية. ولم تتخذها
        الهيئةُ الأكاديمية ولا مجلس المعايير، لأن كليهما بلا أعضاء معيَّنين. البنود الأكاديمية
        — معايير التقييم وقواعد الشهادات — معتمدة إذن رهنَ تصديق المجلس الأكاديمي في أول
        اجتماع مكتمل التشكيل له. ويُسجَّل ذلك ليكون التصديق فعلًا حقيقيًا لا ختمًا على شيء وُصف
        سلفًا بأنه سياسة المجلس.</p>
    </div>
    ${arRegisterNote}
  </div>
</section>

<section class="section--paper section-pad">
  <div class="container reveal">
    <div class="section-head">
      <span class="module-marker">اعتُمدت قبل ذلك</span>
      <h2>${ltr(String(adoptedEarly.length))} اتُّخذت قبلها.</h2>
    </div>
    <div class="table-scroll">
      <table class="ledger">
        <thead><tr><th>المرجع</th><th>القرار</th><th>تاريخ الاعتماد</th></tr></thead>
        <tbody>
${adoptedEarly.map((d) => `          <tr><td><strong dir="ltr">${esc(d.ref)}</strong></td><td><span dir="ltr">${esc(d.title)}</span></td><td><span dir="ltr">${esc(d.when)}</span></td></tr>`).join('\n')}
        </tbody>
      </table>
    </div>
  </div>
</section>

<section class="section--dark section-pad">
  <div class="container reveal">
    <div class="section-head">
      <span class="module-marker">ما لم يفعله الاعتماد</span>
      <h2>شيئان لا يستطيع قرارٌ تصنيعهما.</h2>
      <p class="lede">أن تقرر شيئًا ليس كأن تستطيع العمل به، والفرق يستحق أن يُقال في النفَس
        ذاته مع الاعتماد.</p>
    </div>
    <div class="grid grid--2">
${darkCard('لم يُمنح', 'لا شهادة، بعدُ', 'اعتماد درجة نجاح وسلّم مراتب وإجراء منح يجعل المعيار موجودًا. ولا يوفر الممتحن الخارجي الذي تقوم استقلاليتُه عليها قيمةُ المعيار. لا شهادة تُمنح حتى يُجرى ذلك التعيين.')}
${darkCard('لم يُدلَّل عليه', 'قراران يقولان ذلك بنفسيهما', 'التحدث معتمد بوصفه لا يُحتسب بعد في الشهادة، بالضبط لأنه لا يوجد معيار تصحيح مُعايَر. وخريطة الكفايات معتمدة بوصفها تكليفًا بعمل يجب أن يُنجز، لا ادعاءً بأن العمل منجز.')}
    </div>
  </div>
</section>

<section class="section--light section-pad">
  <div class="container reveal">
    <div class="section-head">
      <span class="module-marker">لماذا هذا علني</span>
      <h2>سجلٌّ لا يقرؤه من في الخارج مذكرةٌ داخلية.</h2>
    </div>
    <div class="grid grid--2">
${card('للمراجع', 'يُظهر ما حُسم، ومتى، وبيد من', 'أول سؤال للجنة: أي المواقف المعلنة للمؤسسة قراراتٌ فعلًا، وبسلطة من. هذا يجيب عن الاثنين دون أن يسألوا، بما في ذلك حيث كانت السلطة تنفيذية لا أكاديمية.')}
${card('للطالب', 'يُظهر أي القواعد تحكمك', 'كل قاعدة على هذا الموقع تظهر هنا الآن قرارًا بتاريخ. وحيث تنتظر قاعدةٌ تصديق المجلس، تقول هذه الصفحة ذلك بدل عرضها سياسةً أكاديمية محسومة.')}
    </div>
  </div>
</section>

${cta('انظر الهيئتين اللتين ستصدّقان عليها.', 'الحوكمة', '/ar/governance/', 'سجل الأدلة', '/ar/governance/evidence/')}`,
};


// ── write ────────────────────────────────────────────────────────────
const MANIFEST = path.join(ROOT, 'pages/manifest.json');
const manifest = JSON.parse(fs.readFileSync(MANIFEST, 'utf8'));
const entries = Array.isArray(manifest) ? manifest : manifest.pages;
const written = [];

// The slugs this pillar replaces. Pruned here so a manifest that once
// carried the retired pages sheds them the first time this generator
// runs — leaving them would keep building pages the redirect map says
// are gone, and tests/route-map.test.mjs would fail the build.
const RETIRED_SLUGS = [
  'about-governance', 'about-senate', 'about-basce', 'about-qa',
  'standards', 'standards-evidence', 'standards-decisions',
  'standards-verification', 'standards-research',
];
for (const slug of RETIRED_SLUGS) {
  const i = entries.findIndex((e) => e.slug === slug);
  if (i >= 0) entries.splice(i, 1);
}

for (const p of Object.values(PAGES)) {
  fs.writeFileSync(path.join(ROOT, 'pages', p.file), p.body + '\n');
  const entry = {
    slug: p.slug, output: p.output, title: p.title, description: p.description,
    contentFile: p.file, lang: p.lang || 'en', dir: p.dir || (p.lang === 'ar' ? 'rtl' : 'ltr'),
  };
  if (p.contents) entry.contents = true;
  if (p.altHref) entry.altHref = p.altHref;
  const i = entries.findIndex((e) => e.slug === p.slug);
  if (i >= 0) entries[i] = { ...entries[i], ...entry }; else entries.push(entry);
  written.push(p.output);
}

fs.writeFileSync(MANIFEST, JSON.stringify(manifest, null, 2) + '\n');
console.log(`Wrote ${written.length} Governance-pillar pages:`);
for (const o of written) console.log(`  ${o}`);
console.log(`Evidence: ${E.total} items, ${E.approved} approved. `
  + `Decisions: ${totalAdopted} adopted, ${awaiting} awaiting.`);
console.log('Run `npm run build` to generate the served pages.');
