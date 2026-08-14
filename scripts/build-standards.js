#!/usr/bin/env node
/**
 * STANDARDS, EVIDENCE AND RESEARCH — five pages.
 *
 * ────────────────────────────────────────────────────────────────────
 * THE SECTION AN ACCREDITATION PANEL READS FIRST
 * ────────────────────────────────────────────────────────────────────
 * These pages exist for the reader who is not a prospective student: a
 * reviewer, a panel, a ministry, an employer checking whether the
 * College is what it says. That reader is not persuaded by a claim of
 * quality; they ask what evidence exists, who approved it, and when it
 * was last looked at.
 *
 * So the evidence page publishes the College's own evidence register as
 * it stands, including that 0 of its 37 items has been approved by
 * anyone — because there is nobody appointed to approve them. Most
 * institutions would not publish that. Publishing it is the only way
 * the 14 items that DO exist mean anything.
 *
 * ────────────────────────────────────────────────────────────────────
 * THE DISTINCTION THE DECISIONS PAGE HOLDS
 * ────────────────────────────────────────────────────────────────────
 * A governance register contains two utterly different kinds of row:
 * decisions that have been taken, and decisions that are waiting. An
 * institution that presents them as one list is claiming settled
 * positions it does not have. The page separates them and gives the
 * waiting ones the larger share of the page, because that is the
 * accurate proportion.
 *
 * ────────────────────────────────────────────────────────────────────
 * RESEARCH
 * ────────────────────────────────────────────────────────────────────
 * The College conducts no research and has published no findings. The
 * research page says so in its first line and then does the one honest
 * thing available: names the questions its own programme has generated
 * that a first cohort could actually answer. That is a research agenda,
 * which is a real thing to have. Research output is not.
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
const E = read();

// The evidence page's central sentence is that nothing has been
// approved, because nobody is appointed to approve it. If that changes,
// the page is wrong and should stop being published.
if (E.approved !== 0) {
  throw new Error(`${E.approved} evidence item(s) are now approved — /standards/evidence/ states none are.`);
}

// The decisions register is a document, so its counts are read from it
// rather than typed here.
const govDoc = fs.readFileSync(path.join(ROOT, 'docs/governance-decisions.md'), 'utf8');
// Three states now exist in the register, and the page has to tell them
// apart. The earlier five carry their adoption in the heading; the
// twenty-five adopted on 14 August carry it in the Decision line; and
// `awaiting` should now be zero, which the page states as an
// achievement rather than silently omitting.
const awaiting = (govDoc.match(/\*\*Decision:\*\*\s*☐\s*awaiting/g) || []).length;
const adoptedEarly = [...govDoc.matchAll(/^### (\w+)\s*[—-]?\s*(.+?)\s*\*\(adopted ([^)]+)\)\*/gm)]
  .map((m) => ({ ref: m[1], title: m[2].replace(/\*+/g, '').trim(), when: m[3] }));
const ADOPTION_DATE = '14 August 2026';
const adoptedNow = [...govDoc.matchAll(/^### ([A-Z]\d+[a-z]?)\.\s*(.+)$/gm)]
  .map((m) => ({ ref: m[1], title: m[2].replace(/\*+/g, '').trim() }))
  .filter((d) => {
    // Only the sections that actually carry the adoption line.
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

// 1 · STANDARDS ───────────────────────────────────────────────────────
PAGES.hub = {
  slug: 'standards', output: 'standards/index.html', file: 'standards.html',
  title: 'Academic Standards &mdash; Worldwide English College',
  description: 'How WEC-LC sets and holds an academic standard, and what an external reviewer '
    + 'would find if they looked today.',
  body: `${hero('Standards', 'How a standard is held.',
    'This section is written for the reader who is not a prospective student &mdash; a reviewer, '
    + 'a panel, a ministry, an employer checking a credential. It sets out what the College has '
    + 'decided, what evidence exists behind it, and what is missing.',
    `<div class="btn-row">
      <a href="/standards/evidence/" class="btn btn--gold">The Evidence Record</a>
      <a href="/standards/decisions/" class="btn btn--outline">The Decisions Register</a>
    </div>`)}

<section class="section--light section-pad">
  <div class="container reveal">
    <div class="section-head">
      <span class="module-marker">Four Principles</span>
      <h2>What holding a standard actually requires.</h2>
    </div>
    <div class="grid grid--4">
${card('One', 'Published before it is applied', 'Outcomes, rubrics and pass criteria are published to learners before assessment, not explained afterwards. A standard revealed after the fact is not a standard; it is a justification.')}
${card('Two', 'Marked separately, floored separately', 'The four language skills are marked apart and an overall mark cannot carry a skill below its floor. Unlimited compensation is how a certificate comes to describe someone who cannot be understood aloud.')}
${card('Three', 'Written before the teaching', 'Each assessment exists before the lesson it tests, so the teaching is built toward the standard rather than the standard assembled afterwards from whatever was taught.')}
${card('Four', 'Confirmed from outside, or not confirmed', 'Nothing internal can establish that a level is pitched where it says it is. That requires an External Examiner, and none is appointed &mdash; which is why no award has been conferred.')}
    </div>
  </div>
</section>

<section class="section--paper section-pad">
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
  </div>
</section>

<section class="section--dark section-pad">
  <div class="container reveal">
    <div class="section-head">
      <span class="module-marker">What A Reviewer Would Find</span>
      <h2>Stated before they ask.</h2>
    </div>
    <div class="grid grid--2">
${darkCard('Present', 'A complete, documented programme', `Specifications, outcomes, hours, rubrics, competency mappings and an evidence register of ${E.total} items across ${new Set(E.collections.map((c) => c.collection)).size} collections.`)}
${darkCard('Absent', 'Everything requiring an outside party', `No accreditation, no External Examiner, no Academic Reviewer, no approved evidence item, no taught cohort and no graduates. The Board, the Senate and the Executive were appointed on 14 August 2026 and moved none of it, which is the point: every item on that list requires somebody the College cannot appoint to itself, or a meeting that has not yet happened. The ${totalAdopted} governance decisions are all taken, and they moved none of it either.`)}
    </div>
  </div>
</section>

${cta('See the register itself.', 'The Evidence Record', '/standards/evidence/', 'Quality Assurance', '/about/quality-assurance/')}`,
};

// 2 · EVIDENCE ────────────────────────────────────────────────────────
PAGES.evidence = {
  slug: 'standards-evidence', output: 'standards/evidence/index.html', file: 'standards-evidence.html',
  title: 'The Evidence Record &mdash; Worldwide English College',
  description: `WEC-LC's register of quality-assurance evidence: ${E.total} items, what state `
    + 'each is in, and why none has been approved.',
  body: `${hero('Standards', 'The evidence record.',
    `${E.total} items an external reviewer would ask for, each recorded in one of four states. `
    + 'This page publishes the register as it stands, including the parts of it that are empty.')}

<section class="section--light section-pad">
  <div class="container reveal">
    <div class="section-head">
      <span class="module-marker">Four States</span>
      <h2>What each item is, honestly.</h2>
      <p class="lede">An evidence register that recorded only what exists would be a list of
        strengths. This one records the absences in the same table, in the same terms.</p>
    </div>
    <div class="grid grid--4">
${card('Exists', `${E.states.exists || 0} items`, 'Written, in the College&rsquo;s possession, and producible on request. The programme specifications, the curriculum maps, the assessment regulations, the governance register itself.')}
${card('Governance pending', `${E.states.governance_pending || 0} items`, 'Drafted, and waiting on a decision that has not been taken. These are not missing documents; they are documents nobody has yet been appointed to approve.')}
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

${cta('See what is waiting on a decision.', 'The Decisions Register', '/standards/decisions/', 'Governance', '/about/governance/')}`,
};

// 3 · DECISIONS ───────────────────────────────────────────────────────
PAGES.decisions = {
  slug: 'standards-decisions', output: 'standards/decisions/index.html', file: 'standards-decisions.html',
  title: 'The Decisions Register &mdash; Worldwide English College',
  description: `All ${totalAdopted} of the College's institutional decisions, in force, with the `
    + 'date and the authority that took each one.',
  body: `${hero('Standards', 'The decisions register.',
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

${cta('See the bodies that will ratify these.', 'Governance', '/about/governance/', 'The Evidence Record', '/standards/evidence/')}`,
};

// 4 · VERIFICATION ────────────────────────────────────────────────────
PAGES.verification = {
  slug: 'standards-verification', output: 'standards/verification/index.html', file: 'standards-verification.html',
  title: 'Verification &mdash; Worldwide English College',
  description: 'How anyone can check a WEC-LC credential, the principle behind it, and the fact '
    + 'that nothing has yet been issued to check.',
  body: `${hero('Standards', 'Checking a credential.',
    'Anyone holding a WEC-LC credential code can verify it without an account, a relationship '
    + 'with the College or its permission. The route is built and open. Nothing has been issued '
    + 'through it yet.')}

<section class="section--light section-pad">
  <div class="container reveal">
    <div class="section-head">
      <span class="module-marker">The Principle</span>
      <h2>The College is not the only party to a credential.</h2>
      <p class="lede">An adopted institutional principle, not a feature description.</p>
    </div>
    <div class="grid grid--3">
${card('The holder', 'Controls what is disclosed', 'A graduate decides what a share exposes and whether they appear in the public register at all. A credential the issuer publishes without consent is a disclosure, not a credential.')}
${card('The checker', 'Needs nothing from the College', 'An employer or an institution verifying a claim should not have to write to WEC-LC and wait. The check resolves for anyone holding the code, immediately.')}
${card('The issuer', 'Must be able to be wrong in public', 'Withdrawal shows as withdrawal rather than deletion. A register that silently loses entries cannot be trusted about the entries it keeps.')}
    </div>
  </div>
</section>

<section class="section--paper section-pad">
  <div class="container reveal">
    <div class="section-head">
      <span class="module-marker">How It Works</span>
      <h2>Signed, not merely stored.</h2>
    </div>
    <div class="grid grid--3">
${card('The code', 'On every credential', 'A verification code, and a scannable code resolving to the same place. Either can be used by anyone.')}
${card('The signature', 'Checked, not displayed', 'Credentials are cryptographically signed and the verification checks the signature. A record that can only be looked up can be forged by anyone able to build a convincing page.')}
${card('The register', 'Browsable, and opt-in', 'A public roll of award-holders exists for anyone wanting to confirm a person rather than a document. Appearing in it is the graduate&rsquo;s decision, not a consequence of graduating.')}
    </div>
  </div>
</section>

<section class="section--dark section-pad">
  <div class="container reveal">
    <div class="section-head">
      <span class="module-marker">The State Of It</span>
      <h2>Built ahead of the first award, deliberately.</h2>
    </div>
    <div class="callout">
      <span class="callout__label">Nothing has been issued</span>
      <p>No award has been conferred, so nothing has ever been verified through this route. It
        was built first on purpose: constructing verification after the first graduates would
        mean the first graduates held credentials nobody could check, and retrofitting a
        signature onto an already-issued credential proves nothing about when it was issued.</p>
    </div>
  </div>
</section>

${cta('Why no award has been conferred.', 'Awards and Honours', '/students/awards/', 'Academic Standards', '/standards/')}`,
};

// 5 · RESEARCH ────────────────────────────────────────────────────────
PAGES.research = {
  slug: 'standards-research', output: 'standards/research/index.html', file: 'standards-research.html',
  title: 'Research &mdash; Worldwide English College',
  description: 'WEC-LC conducts no research and has published no findings. What it has instead '
    + 'is a set of answerable questions its own programme generated.',
  body: `${hero('Standards', 'Research.',
    'Worldwide English College conducts no research. It has published no findings, holds no '
    + 'grants, employs no researchers and makes no research claims. What it has is a set of '
    + 'questions its own programme generated, and those are worth publishing.')}

<section class="section--light section-pad">
  <div class="container reveal">
    <div class="section-head">
      <span class="module-marker">Plainly</span>
      <h2>What does not exist.</h2>
    </div>
    <div class="callout">
      <span class="callout__label">No research output of any kind</span>
      <p>No papers, no conference contributions, no funded projects, no research staff, no
        research degrees, no findings. Any statement on this site that resembles a research
        finding is either a citation of established practice in the international teaching of
        English, marked as such, or a designed judgement by the curriculum&rsquo;s authors,
        marked as that. The distinction is kept in the record itself &mdash; see
        <a href="/teaching/support/">the teaching support record</a>.</p>
    </div>
  </div>
</section>

<section class="section--paper section-pad">
  <div class="container reveal">
    <div class="section-head">
      <span class="module-marker">What Does Exist</span>
      <h2>Questions a first cohort could actually answer.</h2>
      <p class="lede">A new institution&rsquo;s honest research position is an agenda, not an
        output. These four came out of building the programme, and each is answerable with
        evidence a first term would generate.</p>
    </div>
    <div class="grid grid--2">
${card('One', 'Does declaring stage timings change how a lesson runs?', 'Every lesson declares minutes per stage. Nobody knows whether real teaching converges on them, exceeds them systematically, or ignores them &mdash; and the answer would revise either the plans or the practice.')}
${card('Two', 'Do the written &ldquo;common mistakes&rdquo; match the mistakes learners make?', 'The support record names the errors each point provokes, derived from the language rather than from observation. A single term of marked work would test that directly, point by point.')}
${card('Three', 'Does keeping recordings change pronunciation outcomes?', 'The Listening Lab retains recordings so improvement is audible. Whether hearing your own earlier attempt actually improves the later one is an empirical question with an obvious design and no answer here.')}
${card('Four', 'Do the per-skill floors change who passes?', 'The adopted honours scheme refuses unlimited compensation between skills. Whether that materially changes outcomes, or merely feels more rigorous, is measurable the moment there are marks.')}
    </div>
  </div>
</section>

<section class="section--dark section-pad">
  <div class="container reveal">
    <div class="section-head">
      <span class="module-marker">The Commitment</span>
      <h2>If any of these is answered, the answer gets published.</h2>
    </div>
    <div class="grid grid--2">
${darkCard('Including against the College', 'Particularly against it', 'Each question above could return an answer that embarrasses a design decision already published and printed. Those are the answers most worth publishing, and they are the ones an institution has every incentive to lose.')}
${darkCard('And no claim before then', 'The agenda is not an output', 'Nothing on this page should be read as a finding, a preliminary result or work in progress. They are questions. The College will say so until it can say otherwise.')}
    </div>
  </div>
</section>

${cta('See what would be studied.', 'The Teaching Support Record', '/teaching/support/', 'Academic Standards', '/standards/')}`,
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
console.log(`Wrote ${written.length} Standards-cluster pages:`);
for (const o of written) console.log(`  ${o}`);
console.log(`Evidence: ${E.total} items, ${E.approved} approved. `
  + `Governance: ${totalAdopted} adopted (${adoptedNow.length} on ${ADOPTION_DATE}), ${awaiting} awaiting.`);
console.log('Run `npm run build` to generate the served pages.');
