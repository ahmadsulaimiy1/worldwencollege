#!/usr/bin/env node
/**
 * THE ADMISSIONS CLUSTER — nine pages.
 *
 * ────────────────────────────────────────────────────────────────────
 * WHY THESE PAGES ARE THE MOST DANGEROUS ON THE SITE
 * ────────────────────────────────────────────────────────────────────
 * Admissions pages are where a prospective student decides to hand over
 * money. Every sentence here is therefore a representation made to
 * someone about to pay $3,166.67, and the ordinary temptations of
 * admissions copy — implying term dates that do not exist, implying a
 * refund policy that has not been written, implying accreditation by
 * standing next to the word "certificate" — are not stylistic lapses
 * here. They are misrepresentations to a buyer.
 *
 * So this cluster is built from the machine rather than from ambition:
 *
 *   · The application journey is described from the states
 *     `applications.status` can actually hold, and from what
 *     functions/api/admissions/apply.js actually does with a
 *     submission. Nothing in "Step 3" is described as automatic,
 *     because nothing in Step 3 is automatic.
 *   · Prices come from platform_config, currencies from `currencies`,
 *     and the payment page states which currencies are ACTIVE (one)
 *     rather than which are listed (seven).
 *   · The dates page publishes no dates, because
 *     docs/academic-calendar.md is marked NOT ADOPTED and /about/
 *     already lists the calendar as outstanding. A term date invented
 *     here would contradict the College's own status page.
 *   · The scholarships page describes a mechanism, not a scheme,
 *     because a mechanism is what exists.
 *
 * ────────────────────────────────────────────────────────────────────
 * THE THREE THINGS THIS CLUSTER ADMITS THAT ADMISSIONS PAGES DO NOT
 * ────────────────────────────────────────────────────────────────────
 * 1. There is no published refund policy. `refund()` is implemented in
 *    code for three gateways and nothing calls it, because who approves
 *    a refund and on what grounds has never been decided. A buyer is
 *    entitled to know that before paying, not after asking.
 * 2. No safeguarding policy exists and no Safeguarding Lead is
 *    appointed, which bears directly on applicants under 18 — and the
 *    published target audience includes school pupils.
 * 3. The application form stores a name, an email address and a country
 *    in Cloudflare D1, and no Data Protection owner has been appointed.
 *
 * All three are flagged for Academic Senate / Executive decision in
 * docs/appointments-schedule.md. Publishing them is not an apology; it
 * is the only version of these pages that is true.
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
    levels: all('SELECT * FROM programme_levels ORDER BY id'),
    currencies: all('SELECT * FROM currencies ORDER BY code'),
    routing: all('SELECT * FROM country_payment_routing ORDER BY country_code'),
    cfg,
  };
  db.close();
  return out;
}
const D = read();
if (D.levels.length !== 6) throw new Error(`Expected six levels, read ${D.levels.length}`);

const activeCurrencies = D.currencies.filter((c) => c.is_active);
const inactiveCurrencies = D.currencies.filter((c) => !c.is_active);
if (activeCurrencies.length !== 1 || activeCurrencies[0].code !== 'USD') {
  throw new Error('The payment page is written around USD being the only settled currency; '
    + `the record now says ${activeCurrencies.map((c) => c.code).join(', ') || 'none'}. Rewrite the page, not this check.`);
}

const FULL_PRICE_CENTS = Number(D.cfg.full_programme_price_usd_cents);
if (!Number.isFinite(FULL_PRICE_CENTS)) throw new Error('full_programme_price_usd_cents is not readable');
const money = (cents) => '$' + (cents / 100).toLocaleString('en-US', { minimumFractionDigits: 0, maximumFractionDigits: 2 });
const FULL_PRICE = money(FULL_PRICE_CENTS);
const PER_LEVEL = '$3,166.67'; // the published per-level figure — see admissions-tuition.html
const INSTALMENTS = Number(JSON.parse(D.cfg.instalment_default_count ?? '4'));

// ── shared blocks ────────────────────────────────────────────────────
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

const qa = (q, a) => `      <div class="accordion__item">
        <button class="accordion__q"><span>${q}</span><span class="plus" aria-hidden="true">+</span></button>
        <div class="accordion__a"><div class="accordion__a-inner">${a}</div></div>
      </div>`;

const beforeYouPay = `<div class="callout">
      <span class="callout__label">Before you pay, four things you are entitled to know</span>
      <p>WEC-LC holds no accreditation. No External Examiner has been appointed, so no award has
        been conferred on anyone. No cohort has yet been taught. And no refund policy has been
        adopted &mdash; see <a href="/admissions/payment/#refunds">Refunds</a>, which says so
        plainly rather than leaving you to discover it. The full institutional position is at
        <a href="/about/#status">About &middot; Institutional Status</a>.</p>
    </div>`;

// ─────────────────────────────────────────────────────────────────────
const PAGES = {};

// 1 · HOW TO APPLY ────────────────────────────────────────────────────
PAGES.apply = {
  slug: 'admissions-apply', output: 'admissions/apply/index.html', file: 'admissions-apply.html',
  title: 'How to Apply &mdash; Worldwide English College',
  description: 'The five stages of a WEC-LC application, what happens at each one, who does it, '
    + 'and how long the College can honestly say each takes.',
  body: `${hero('Admissions', 'How to apply.',
    'Five stages, described as they actually run. Where a stage is handled by a person rather '
    + 'than by software, this page says so &mdash; because that is what determines how long it '
    + 'takes and who you are dealing with.',
    `<div class="btn-row">
      <a href="/admissions/#apply" class="btn btn--gold">Start Your Application</a>
      <a href="/admissions/entry-requirements/" class="btn btn--outline">Entry Requirements</a>
    </div>`)}

<section class="section--light section-pad">
  <div class="container reveal">
    <div class="section-head">
      <span class="module-marker">The Journey</span>
      <h2>Five stages, and what each one really is.</h2>
      <p class="lede">The application record moves through a fixed set of states, and the state
        it is in is the honest answer to &ldquo;where is my application?&rdquo;. Those states
        are listed here in the order they occur.</p>
    </div>
    <div class="table-scroll">
      <table class="ledger">
        <thead><tr><th>Stage</th><th>What happens</th><th>Who does it</th><th>Application state</th></tr></thead>
        <tbody>
          <tr><td><strong>1 &middot; Estimate your level</strong></td>
              <td>A one-question self-assessment on the Admissions page suggests a starting level. It is not the placement decision and it binds nobody, including you.</td>
              <td>You, in about thirty seconds</td><td>&mdash;</td></tr>
          <tr><td><strong>2 &middot; Submit the form</strong></td>
              <td>Name, email address and country of residence, plus the self-assessed level if you took the estimate. Nothing else is asked for at this point &mdash; no documents, no fee.</td>
              <td>You. The record is created immediately and you are emailed a confirmation.</td><td><code>submitted</code></td></tr>
          <tr><td><strong>3 &middot; Placement</strong></td>
              <td>A conversation and a short assessment to confirm which of the six levels you should enter. There is no automated placement test on this site; a member of the founding team arranges this with you by email.</td>
              <td>A person, not the platform</td><td><code>placement_pending</code></td></tr>
          <tr><td><strong>4 &middot; Offer</strong></td>
              <td>A written offer naming your confirmed entry level, the fee for it, and the payment options open to you.</td>
              <td>Admissions</td><td><code>offer_sent</code> &rarr; <code>accepted</code></td></tr>
          <tr><td><strong>5 &middot; Enrolment</strong></td>
              <td>Payment is confirmed, an account is created, and your enrolment for that level begins. Your first lesson is available the same day.</td>
              <td>You and the platform together</td><td><code>enrolled</code></td></tr>
        </tbody>
      </table>
    </div>
    <p class="form-note">An application can also end at <code>withdrawn</code> or
      <code>rejected</code>. Both are states the College records rather than deletes, so that a
      decision can be looked up later by whoever made it.</p>
  </div>
</section>

<section class="section--paper section-pad">
  <div class="container reveal">
    <div class="section-head">
      <span class="module-marker">Timing</span>
      <h2>How long each stage takes, honestly stated.</h2>
      <p class="lede">WEC-LC has processed no applications at volume, so these are commitments
        rather than measured averages, and they are described that way.</p>
    </div>
    <div class="grid grid--3">
${card('Immediate', 'Submission', 'The record is created and the confirmation email is sent while you are still on the page. If the online form cannot be reached, it hands your details to your email application instead, so nothing is lost.')}
${card('Committed', 'Placement contact within three working days', 'A commitment the College is making, not an average it has measured. If it is missed, write to Admissions and say so &mdash; a stated commitment that goes unenforced is worse than none.')}
${card('Your pace', 'Offer to enrolment', 'An offer does not expire on a timetable, because there is no intake to fill. Take the time you need; nothing is lost by waiting and nothing is gained by hurrying.')}
    </div>
  </div>
</section>

<section class="section--dark section-pad">
  <div class="container reveal">
    <div class="section-head">
      <span class="module-marker">Checking Your Application</span>
      <h2>You can look it up yourself.</h2>
    </div>
    <div class="grid grid--2">
${darkCard('Your reference', 'Keep the application id', 'The confirmation email carries an identifier beginning <code>app_</code>. It is the only key to your record, and it is deliberately the only key &mdash; the College will not disclose an application state to anyone who does not hold it, including someone who knows your email address.')}
${darkCard('No account needed', 'Status without signing in', 'You do not have an account at application stage &mdash; one is created at enrolment. So status is looked up by reference, not by login, and returns the state and the date it was created. Nothing else.')}
    </div>
  </div>
</section>

<section class="section--light section-pad">
  <div class="container reveal">
    ${beforeYouPay}
  </div>
</section>

${cta('Ready to start?', 'Apply Now', '/admissions/#apply', 'Read the Admissions Policy', '/admissions/policy/')}`,
};

// 2 · ENTRY REQUIREMENTS ──────────────────────────────────────────────
PAGES.entry = {
  slug: 'admissions-entry', output: 'admissions/entry-requirements/index.html', file: 'admissions-entry.html',
  title: 'Entry Requirements &mdash; Worldwide English College',
  description: 'What WEC-LC requires of an applicant: no prior qualification, a placement '
    + 'conversation, and the equipment the programme genuinely needs.',
  body: `${hero('Admissions', 'What is actually required.',
    'The IEFC has no academic entry qualification. What it has is a starting point that has to '
    + 'be right, and a small set of practical requirements that are real because the programme '
    + 'genuinely uses them.')}

<section class="section--light section-pad">
  <div class="container reveal">
    <div class="section-head">
      <span class="module-marker">Academic Requirements</span>
      <h2>There is no qualification to hold.</h2>
      <p class="lede">Level I begins at A1 &mdash; the assumption is no usable English, not
        some English. A prior certificate is welcome as evidence and is never a condition.</p>
    </div>
    <div class="grid grid--3">
${card('Not required', 'A school-leaving certificate', 'The College does not ask for one, does not check one, and does not price differently for one. A language programme that gated entry on schooling would be excluding exactly the learners Level I was written for.')}
${card('Not required', 'An IELTS or TOEFL score', 'If you hold one, bring it &mdash; it shortens the placement conversation considerably. It is evidence, not a requirement, and a score that is more than two years old is treated as a starting hypothesis rather than a fact.')}
${card('Required', 'An honest placement', 'The single genuine requirement. Entering at the wrong level is the most common way a language programme fails a learner, and it fails them in both directions: too low is insulting and too high is silent drowning.')}
    </div>
  </div>
</section>

<section class="section--paper section-pad">
  <div class="container reveal">
    <div class="section-head">
      <span class="module-marker">Placement</span>
      <h2>How the entry level is decided.</h2>
      <p class="lede">Two things happen, in this order, and only the second one counts.</p>
    </div>
    <ol class="dot-list">
      <li><span class="num">01</span><span><strong>Your own estimate.</strong> One question, six statements, thirty seconds. It exists so you can apply with a sense of where you are, and it is recorded on your application as a self-assessment &mdash; explicitly non-binding.</span><span class="leader"></span></li>
      <li><span class="num">02</span><span><strong>The placement assessment.</strong> A short assessment and a conversation with a member of the founding team, arranged by email after you apply. It produces the level you actually enter. There is no automated placement test on this site, and describing one would be describing software that does not exist.</span><span class="leader"></span></li>
    </ol>
    <div class="callout">
      <span class="callout__label">If the placement turns out to be wrong</span>
      <p>Say so in the first two weeks. A placement is a judgement made on limited evidence, and
        the evidence improves the moment you start studying. Moving a learner early costs the
        College nothing and saves them a term of the wrong material.</p>
    </div>
  </div>
</section>

<section class="section--dark section-pad">
  <div class="container reveal">
    <div class="section-head">
      <span class="module-marker">Practical Requirements</span>
      <h2>What you need to actually study.</h2>
      <p class="lede">Each of these is listed because a specific part of the programme uses it,
        not because a requirements list looks thorough.</p>
    </div>
    <div class="grid grid--4">
${darkCard('Device', 'A computer, tablet or phone', 'The learning platform runs in a browser. There is nothing to install and no minimum specification worth publishing &mdash; if it can play video, it can run the programme.')}
${darkCard('Connection', 'Enough to stream audio', 'Listening work is the spine of every level, so audio has to arrive. Video calls for live sessions want more; audio-only participation is accepted when a connection will not carry video, and that is a stated accommodation rather than a workaround.')}
${darkCard('Microphone', 'Any microphone', 'The Listening Lab asks you to record yourself and keeps the recordings so you and your teacher can hear the change over months. A phone or a laptop microphone is sufficient. This is the one requirement people are surprised by, which is why it is here rather than in a footnote.')}
${darkCard('Email', 'An address you read', 'Placement, offer and enrolment all move by email. It is the only channel the College currently relies on.')}
    </div>
  </div>
</section>

<section class="section--light section-pad">
  <div class="container reveal">
    <div class="section-head">
      <span class="module-marker">Age</span>
      <h2>Applicants under 18 &mdash; an unresolved question.</h2>
    </div>
    <div class="callout">
      <span class="callout__label">Stated rather than answered</span>
      <p>WEC-LC has published a target audience that includes school pupils. It has not yet
        adopted a safeguarding policy or appointed a named Safeguarding Lead, and both are
        prerequisites for teaching anyone under 18 responsibly. Until they exist, an application
        from someone under 18 is handled individually by the founding team in correspondence
        with a parent or guardian rather than processed as routine. This is recorded as an
        outstanding institutional decision, not presented as a policy.</p>
    </div>
    <div class="grid grid--2">
${card('Why it is not simply answered here', 'Safeguarding is not a website decision', 'A safeguarding policy that appeared on a marketing page without a named person accountable for it would be worse than none, because it would look like an answer. The decision belongs to the Academic Senate and the Executive.')}
${card('What is true today', 'No policy, no appointed lead', 'Both are listed in the College&rsquo;s own appointments schedule as posts that must be filled. The honest consequence is stated above rather than left for an applicant to discover.')}
    </div>
  </div>
</section>

${cta('See what you would be entering.', 'The Six Levels', '/study/', 'How to Apply', '/admissions/apply/')}`,
};

// 3 · PAYING FOR THE PROGRAMME ────────────────────────────────────────
PAGES.payment = {
  slug: 'admissions-payment', output: 'admissions/payment/index.html', file: 'admissions-payment.html',
  title: 'Paying for the Programme &mdash; Worldwide English College',
  description: 'How payment actually works at WEC-LC: which currencies are settled, which '
    + 'payment methods are live, how instalments work, and what has not been decided.',
  body: `${hero('Admissions', 'Paying for the programme.',
    `Tuition is published at <a href="/admissions/tuition/">Tuition &amp; Fees</a>. This page `
    + 'is about the mechanics &mdash; which currency you are charged in, which methods work '
    + 'from your country, and what happens if you need your money back.')}

<section class="section--light section-pad">
  <div class="container reveal">
    <div class="section-head">
      <span class="module-marker">Currency</span>
      <h2>One settled currency, and six that are not.</h2>
      <p class="lede">The College charges in US dollars. Other currencies exist in the system
        as recognised codes, but a currency is only settled once a rate policy stands behind it,
        and none of them has one yet.</p>
    </div>
    <div class="table-scroll">
      <table class="ledger">
        <thead><tr><th>Currency</th><th>Status</th><th>What it means for you</th></tr></thead>
        <tbody>
          <tr><td><strong>USD &mdash; US dollar</strong></td><td>Settled</td>
              <td>Every fee is set and charged in dollars. ${FULL_PRICE} means ${FULL_PRICE}.</td></tr>
${inactiveCurrencies.map((c) => `          <tr><td><strong>${esc(c.code)} &mdash; ${esc(currencyName(c.code))}</strong></td><td>Recognised, not settled</td>
              <td>Your bank or card issuer converts at its own rate on the day. WEC-LC does not publish a ${esc(c.code)} price, because publishing one without a fixed rate behind it would be publishing a number that changes without notice.</td></tr>`).join('\n')}
        </tbody>
      </table>
    </div>
    <p class="form-note">Where a bank converts, the conversion is between you and your bank. The
      College sees only the dollar amount and cannot quote or guarantee the local figure.</p>
  </div>
</section>

<section class="section--paper section-pad">
  <div class="container reveal">
    <div class="section-head">
      <span class="module-marker">Payment Methods</span>
      <h2>Which method reaches you depends on where you are.</h2>
      <p class="lede">The platform holds routing preferences for several countries and offers
        whichever of them the College currently has live merchant credentials for. It suggests;
        it never forces.</p>
    </div>
    <div class="table-scroll">
      <table class="ledger">
        <thead><tr><th>Country</th><th>Preferred order</th></tr></thead>
        <tbody>
${D.routing.map((r) => `          <tr><td><strong>${esc(countryName(r.country_code))}</strong></td><td>${esc(JSON.parse(r.preferred_gateways).map(gatewayName).join(' &rarr; ')).replace(/&amp;rarr;/g, '&rarr;')}</td></tr>`).join('\n')}
        </tbody>
      </table>
    </div>
    <div class="callout">
      <span class="callout__label">Nigeria, specifically</span>
      <p>Nigerian applicants are routed to Paystack first, then Flutterwave, then OPay, with a
        card gateway last. That order is not decorative: several international gateways do not
        support Nigerian cards or Nigerian merchants, and a payment page that offered only those
        would fail silently for a large share of the College&rsquo;s applicants. If a method is
        not yet showing at checkout, it is because those merchant credentials are not live yet
        &mdash; write to Admissions and pay by transfer in the meantime.</p>
    </div>
  </div>
</section>

<section class="section--dark section-pad">
  <div class="container reveal">
    <div class="section-head">
      <span class="module-marker">Ways to Pay</span>
      <h2>Three arrangements.</h2>
    </div>
    <div class="grid grid--3">
${darkCard('Full programme', FULL_PRICE + ' once', `One payment covers all six levels. It enrols you in Level I immediately; Levels II to VI are added to your account one at a time as each preceding level is completed. Nothing is withheld from you &mdash; the arrangement exists so that a paid-for level is a level you are actually ready to study.`)}
${darkCard('Per level', PER_LEVEL + ' at a time', 'Pay at the start of each level. The most common arrangement, and the one that requires the least commitment before you have seen how the College teaches.')}
${darkCard('Instalments', `${INSTALMENTS} payments per level`, `A level&rsquo;s fee split into ${INSTALMENTS} equal parts. The split is equal because no evidence-based cadence policy has been set; when one is, it will be published here rather than changed quietly.`)}
    </div>
  </div>
</section>

<section class="section--light section-pad" id="refunds">
  <div class="container reveal">
    <div class="section-head">
      <span class="module-marker">Refunds</span>
      <h2>There is no refund policy yet, and you should know that before you pay.</h2>
    </div>
    <div class="callout">
      <span class="callout__label">What is true</span>
      <p>The College can process a refund technically &mdash; the mechanism is built and tested
        against the payment gateways. What does not exist is a <em>policy</em>: who authorises a
        refund, on what grounds, within what window, and at what proportion. Those are executive
        decisions and none of them has been taken. Until they are, a refund request is decided
        case by case by the founding team, in writing, and the decision is recorded against the
        payment. That is a weaker guarantee than a published policy and it is stated as one.</p>
    </div>
    <div class="grid grid--2">
${card('If you want certainty first', 'Pay by level, not in full', `The exposure of a per-level payment is ${PER_LEVEL}; the exposure of a full-programme payment is ${FULL_PRICE}. Until a refund policy exists, that difference is the practical protection available to you, and the College would rather tell you that than sell the larger package.`)}
${card('What the College commits to now', 'A written answer, and a record of it', 'Every refund request is answered in writing with a reason. Whatever policy is eventually adopted, decisions taken before it will remain on the record and will not be quietly reinterpreted afterwards.')}
    </div>
  </div>
</section>

<section class="section--paper section-pad">
  <div class="container reveal">
    <div class="section-head">
      <span class="module-marker">Receipts</span>
      <h2>What you get, and what you do not yet.</h2>
    </div>
    <div class="grid grid--2">
${card('Issued', 'A numbered receipt', 'Every successful payment is given a sequential receipt number at the moment the gateway confirms it, and that number is unique and permanent. It is the reference to quote in any correspondence about money.')}
${card('Not issued yet', 'A downloadable PDF receipt', 'The receipt exists as a record; a formatted document you can download is not built. If you need one for an employer or a sponsor, ask Admissions and one will be produced by hand.')}
    </div>
  </div>
</section>

${cta('See the fees themselves.', 'Tuition &amp; Fees', '/admissions/tuition/', 'Scholarships', '/admissions/scholarships/')}`,
};

// 4 · SCHOLARSHIPS ────────────────────────────────────────────────────
PAGES.scholarships = {
  slug: 'admissions-scholarships', output: 'admissions/scholarships/index.html', file: 'admissions-scholarships.html',
  title: 'Scholarships &amp; Financial Support &mdash; Worldwide English College',
  description: 'What financial support WEC-LC can and cannot offer today: no open scholarship '
    + 'scheme, a working award mechanism, and how to ask.',
  body: `${hero('Admissions', 'Scholarships and financial support.',
    'There is no open scholarship scheme. That is the first thing this page has to say, because '
    + 'the alternative is a page that reads like an invitation and produces an application '
    + 'nobody can assess.')}

<section class="section--light section-pad">
  <div class="container reveal">
    <div class="section-head">
      <span class="module-marker">The Position</span>
      <h2>A mechanism exists. A scheme does not.</h2>
      <p class="lede">The distinction matters, so it is drawn plainly rather than blurred.</p>
    </div>
    <div class="grid grid--2">
${card('Exists', 'The award mechanism', 'The College can record a scholarship against a named person, as a percentage, a fixed sum or a full remission, with the approving officer recorded alongside it. It applies automatically at checkout for the person it was awarded to, and for nobody else. This is built and tested.')}
${card('Does not exist', 'Eligibility, criteria, a fund, a deadline', 'No criteria have been adopted, no budget has been allocated, no round has opened and no scholarship has been awarded to anyone. Publishing criteria the College could not fund would be worse than publishing nothing.')}
    </div>
    <div class="callout">
      <span class="callout__label">Why this is not simply written and published</span>
      <p>A scholarship scheme is a spending commitment and an equity commitment at once. Deciding
        it requires a fund, a set of criteria that can be applied consistently to strangers, and
        someone accountable for applying them &mdash; the same three things that are missing from
        every other unfilled post at the College. It is an executive decision, and it has not
        been taken.</p>
    </div>
  </div>
</section>

<section class="section--paper section-pad">
  <div class="container reveal">
    <div class="section-head">
      <span class="module-marker">What You Can Do Today</span>
      <h2>Three routes that are real.</h2>
    </div>
    <div class="grid grid--3">
${card('One', 'Pay level by level', `The programme is deliberately divisible. ${PER_LEVEL} for one level, decided one level at a time, is a materially different commitment from ${FULL_PRICE}, and no explanation is required to choose it.`)}
${card('Two', `Spread a level across ${INSTALMENTS} payments`, 'An instalment plan divides a single level&rsquo;s fee into equal parts. It is available on request rather than by application, and carries no charge for using it.')}
${card('Three', 'Write and ask', 'If the fee is the only thing standing between you and the programme, say so to Admissions in your own words. There is no fund to draw on and no promise attached to this, but a request that is never made cannot be considered when there is one.')}
    </div>
  </div>
</section>

<section class="section--dark section-pad">
  <div class="container reveal">
    <div class="section-head">
      <span class="module-marker">Sponsors and Employers</span>
      <h2>If someone else is paying.</h2>
    </div>
    <div class="grid grid--2">
${darkCard('Possible', 'A third party paying for a named learner', 'An employer, a ministry or a family member can pay for a named learner today. The payment is recorded against the learner&rsquo;s enrolment, and the learner &mdash; not the payer &mdash; controls their own academic record.')}
${darkCard('Not built', 'Organisational invoicing and seats', 'A corporate account with purchase-order invoicing and assignable seats exists in the data model and has no working process behind it. It will be built against a real organisation&rsquo;s requirements rather than guessed at in advance. If that is you, write to Admissions.')}
    </div>
  </div>
</section>

${cta('Ask about a fee.', 'Contact Admissions', '/contact/', 'How Payment Works', '/admissions/payment/')}`,
};

// 5 · INTERNATIONAL APPLICANTS ────────────────────────────────────────
PAGES.international = {
  slug: 'admissions-international', output: 'admissions/international/index.html', file: 'admissions-international.html',
  title: 'International Applicants &mdash; Worldwide English College',
  description: 'WEC-LC teaches online worldwide. What that means for applicants outside the '
    + 'United Kingdom: no relocation, no visa, time zones, and how live teaching is scheduled.',
  body: `${hero('Admissions', 'Applying from outside the United Kingdom.',
    'Every WEC-LC student is an international student, because the College teaches online and '
    + 'has no teaching campus anywhere. There is no separate international admissions route, no '
    + 'international fee, and nothing to relocate for.')}

<section class="section--light section-pad">
  <div class="container reveal">
    <div class="section-head">
      <span class="module-marker">What &ldquo;London Campus&rdquo; Means</span>
      <h2>An administrative headquarters, not a place you attend.</h2>
      <p class="lede">This is stated first because the name invites exactly one wrong
        assumption, and it is an expensive one to make.</p>
    </div>
    <div class="grid grid--3">
${card('Is', 'An administrative address', 'London identifies where the College is administered and managed from. The registered address is being finalised and will be published here when it is settled &mdash; not before.')}
${card('Is not', 'A teaching campus', 'There are no classrooms, no lecture theatres and no student accommodation. Nobody attends WEC-LC in London or anywhere else, and no student has ever been asked to.')}
${card('Therefore', 'No relocation, no visa', 'You study from where you live. See <a href="/admissions/visas/">Visas and study permits</a>, which exists to say clearly that the College issues no immigration documents.')}
    </div>
  </div>
</section>

<section class="section--paper section-pad">
  <div class="container reveal">
    <div class="section-head">
      <span class="module-marker">Time Zones</span>
      <h2>How a programme with no campus handles being everywhere at once.</h2>
    </div>
    <div class="grid grid--2">
${card('Independent of the clock', 'The taught material', 'Lessons, exercises, listening work and assignments are studied when you can study them. This is the majority of the programme by time, and it has no schedule attached to it at all.')}
${card('Dependent on the clock', 'Live sessions', 'Conversation practice and tutorials are live, which means somebody&rsquo;s evening is somebody else&rsquo;s morning. Live sessions are scheduled against where students actually are once there are students; publishing a fixed timetable now would be publishing a guess. Recordings are the standing fallback and are not treated as a lesser option.')}
    </div>
    <div class="callout">
      <span class="callout__label">The honest caveat</span>
      <p>No cohort has yet been taught, so no live timetable has been proven against real student
        locations. What is described here is the design. The first cohort&rsquo;s experience will
        change it, and the change will be published.</p>
    </div>
  </div>
</section>

<section class="section--dark section-pad">
  <div class="container reveal">
    <div class="section-head">
      <span class="module-marker">Language of Instruction</span>
      <h2>English throughout, with one exception.</h2>
    </div>
    <div class="grid grid--2">
${darkCard('Teaching', 'Conducted in English from Level I', 'Including at A1, where it is done with heavy support &mdash; visual, repetition, restricted language, and a teacher who slows down rather than translates. Teaching a language through the language is a method, not an obstacle, and Level I was written on that assumption.')}
${darkCard('The website', 'Available in Arabic', 'The public site is published in English and Arabic. The teaching itself is not translated: a translated lesson would be a different lesson, and the pronunciation and listening work in particular cannot survive translation.')}
    </div>
  </div>
</section>

${cta('Apply from anywhere.', 'Start Your Application', '/admissions/#apply', 'Visas and Study Permits', '/admissions/visas/')}`,
};

// 6 · VISAS ───────────────────────────────────────────────────────────
PAGES.visas = {
  slug: 'admissions-visas', output: 'admissions/visas/index.html', file: 'admissions-visas.html',
  title: 'Visas &amp; Study Permits &mdash; Worldwide English College',
  description: 'WEC-LC is an online institution and issues no immigration documents. What that '
    + 'means, why the page exists, and what to be careful of.',
  body: `${hero('Admissions', 'Visas and study permits.',
    'Worldwide English College cannot sponsor a visa, issue a Confirmation of Acceptance for '
    + 'Studies, or support any immigration application. This page exists to say that in one '
    + 'place, unambiguously, before anyone spends money on the assumption otherwise.')}

<section class="section--light section-pad">
  <div class="container reveal">
    <div class="section-head">
      <span class="module-marker">The Position</span>
      <h2>Stated without qualification.</h2>
    </div>
    <div class="callout">
      <span class="callout__label">What WEC-LC does not do</span>
      <p>The College is not a licensed student sponsor. It issues no Confirmation of Acceptance
        for Studies, no visa letter, no immigration attestation and no document that any
        immigration authority accepts as the basis of a study visa. It does not offer, and will
        not offer, assistance with immigration applications. Nothing on any other page of this
        site should be read as qualifying that.</p>
    </div>
    <div class="grid grid--3">
${card('Why', 'Because it teaches online', 'Study visas exist to permit physical presence for study. The IEFC involves no physical presence anywhere &mdash; there is no campus to attend. A visa is not withheld; it is simply not part of what this programme is.')}
${card('Consequence', 'You study from home', 'Wherever you live, you study there. No travel, no accommodation, no relocation cost, and no immigration risk arising from the programme itself.')}
${card('Exception', 'There is none', 'Not for any level, any fee arrangement, any nationality, or any sponsor. There is no case in which the College can help, and describing edge cases would only create hope where there is none.')}
    </div>
  </div>
</section>

<section class="section--paper section-pad">
  <div class="container reveal">
    <div class="section-head">
      <span class="module-marker">A Warning Worth Printing</span>
      <h2>If someone offers you a WEC-LC visa, they are defrauding you.</h2>
    </div>
    <div class="grid grid--2">
${card('No agent has this authority', 'Because the College does not have it', 'WEC-LC cannot delegate a power it does not hold. Any person or agency offering a WEC-LC study visa, admission letter for immigration purposes, or &ldquo;guaranteed&rdquo; entry to the United Kingdom through this College is making an offer the College could not fulfil itself.')}
${card('What to do', 'Write to us and tell us', `Send it to <a href="mailto:info@worldwencollege.co.uk">info@worldwencollege.co.uk</a>. Publishing this warning is worth little if reports of it go nowhere, and a College that hears about a fraud in its name and stays quiet is participating in it.`)}
    </div>
  </div>
</section>

<section class="section--dark section-pad">
  <div class="container reveal">
    <div class="section-head">
      <span class="module-marker">If Your Goal Is To Study Abroad</span>
      <h2>What the programme can genuinely do for that.</h2>
      <p class="lede">Many applicants come to English study on the way to something else. That
        is a legitimate reason to be here, and it is worth being precise about what helps.</p>
    </div>
    <div class="grid grid--3">
${darkCard('Can', 'Build the English a destination requires', 'The upper levels work directly on academic reading, academic writing, seminar discussion and the discourse of formal argument &mdash; the things that make the difference once you have arrived, and which a test score does not guarantee.')}
${darkCard('Can', 'Prepare you for the tests that are accepted', 'IELTS, TOEFL and Cambridge preparation are built into the curriculum from Upper Intermediate onwards. Those tests, not this College&rsquo;s certificate, are what admitting institutions and immigration systems currently recognise.')}
${darkCard('Cannot', 'Substitute for a recognised qualification', 'No External Examiner has been appointed and the College holds no accreditation, so the IEFC award should not be relied upon by anyone as an admission or immigration credential. That is the plain position and it will change only when it genuinely changes.')}
    </div>
  </div>
</section>

${cta('Study from where you are.', 'Applying From Abroad', '/admissions/international/', 'The Six Levels', '/study/')}`,
};

// 7 · ADMISSIONS POLICY ───────────────────────────────────────────────
PAGES.policy = {
  slug: 'admissions-policy', output: 'admissions/policy/index.html', file: 'admissions-policy.html',
  title: 'Admissions Policy &mdash; Worldwide English College',
  description: 'The rules WEC-LC applies to admissions decisions, the data it collects from '
    + 'applicants, and the policies that have not yet been adopted.',
  body: `${hero('Admissions', 'Admissions policy.',
    'The rules the College applies when deciding an application, written so that a decision can '
    + 'be checked against them afterwards. Where a rule does not yet exist, this page names the '
    + 'gap instead of implying a rule.')}

<section class="section--light section-pad">
  <div class="container reveal">
    <div class="section-head">
      <span class="module-marker">Principles</span>
      <h2>Four rules that govern every decision.</h2>
    </div>
    <div class="grid grid--2">
${card('One', 'Admission is on placement, not on merit', 'The IEFC is not selective. The question at admission is which of the six levels you belong in, not whether you are good enough to be admitted. There is no ranking, no quota and no competitive round.')}
${card('Two', 'The same fee for everyone', `${PER_LEVEL} per level and ${FULL_PRICE} for the programme, regardless of nationality, residence or how the application arrived. There is no international rate and no negotiated rate.`)}
${card('Three', 'A decision is recorded with a reason', 'Applications that are declined or withdrawn stay on the record with their state, so that a decision can be looked up by whoever made it. Nothing is deleted to tidy the numbers.')}
${card('Four', 'Nothing is required that is not used', 'The application asks for a name, an email address and a country. It asks for no documents, no photographs, no identity papers and no fee, because none of those is needed to place a learner in a language level.')}
    </div>
  </div>
</section>

<section class="section--paper section-pad">
  <div class="container reveal">
    <div class="section-head">
      <span class="module-marker">Grounds For Declining</span>
      <h2>The College reserves the right to decline, on stated grounds only.</h2>
    </div>
    <ol class="dot-list">
      <li><span class="num">01</span><span><strong>The College cannot serve the applicant.</strong> The clearest current case is an applicant under 18, for whom no safeguarding policy exists. Declining on this ground is a statement about the College&rsquo;s readiness, not about the applicant.</span><span class="leader"></span></li>
      <li><span class="num">02</span><span><strong>The application is not genuine.</strong> Submitted on someone else&rsquo;s behalf without their knowledge, or made in a name that is not a person&rsquo;s.</span><span class="leader"></span></li>
      <li><span class="num">03</span><span><strong>Payment cannot be lawfully accepted.</strong> Where sanctions or payment regulation prevent the College from taking money from a jurisdiction.</span><span class="leader"></span></li>
    </ol>
    <p class="form-note">Nothing else is a ground. In particular, a low placement result is never
      a ground for declining &mdash; a beginner is precisely who Level I was written for.</p>
  </div>
</section>

<section class="section--dark section-pad" id="data">
  <div class="container reveal">
    <div class="section-head">
      <span class="module-marker">Your Data</span>
      <h2>What is collected, where it goes, and who is accountable.</h2>
    </div>
    <div class="table-scroll">
      <table class="ledger">
        <thead><tr><th>What</th><th>Why</th><th>Where it is held</th></tr></thead>
        <tbody>
          <tr><td>Full name</td><td>To address you, and to place the application on the record</td><td>The College&rsquo;s database, hosted by Cloudflare</td></tr>
          <tr><td>Email address</td><td>The only channel by which placement, offer and enrolment move</td><td>The same database, plus the email service that delivers the messages</td></tr>
          <tr><td>Country of residence</td><td>To offer payment methods that work where you are</td><td>The same database</td></tr>
          <tr><td>Self-assessed level</td><td>Context for the placement conversation. Non-binding.</td><td>The same database</td></tr>
        </tbody>
      </table>
    </div>
    <div class="callout">
      <span class="callout__label">Accountability &mdash; an outstanding appointment</span>
      <p>No Data Protection owner has been appointed. The data listed above is collected,
        transmitted over an encrypted connection and stored, but the College cannot yet name a
        person accountable for how it is handled, retained or erased. That post is on the
        College&rsquo;s appointments schedule. Until it is filled, requests about your data go to
        <a href="mailto:info@worldwencollege.co.uk">info@worldwencollege.co.uk</a> and are
        answered by the founding team.</p>
    </div>
    <div class="grid grid--2">
${darkCard('Not collected', 'Anything the general contact form might suggest', 'The enquiry form on the Contact page does not send anything to the College&rsquo;s systems at all &mdash; it opens your own email application. Only the application form stores data.')}
${darkCard('Not sold, not shared', 'For any purpose', 'Applicant data is not passed to agents, advertisers or partners. There are no partners.')}
    </div>
  </div>
</section>

<section class="section--light section-pad">
  <div class="container reveal">
    <div class="section-head">
      <span class="module-marker">Policies Not Yet Adopted</span>
      <h2>Named, because their absence affects you.</h2>
    </div>
    <div class="grid grid--3">
${card('Refunds', 'No policy adopted', 'Handled case by case, in writing. See <a href="/admissions/payment/#refunds">Refunds</a>.')}
${card('Safeguarding', 'No policy, no named lead', 'Bears directly on applicants under 18. See <a href="/admissions/entry-requirements/">Entry requirements</a>.')}
${card('Complaints and appeals', 'No formal procedure', 'A complaint today is answered by the founding team. There is no independent stage, because there is no appointed body to escalate to &mdash; both academic bodies stand at zero appointed members.')}
    </div>
  </div>
</section>

${cta('Questions this does not answer?', 'Admissions Questions', '/admissions/questions/', 'Contact Admissions', '/contact/')}`,
};

// 8 · DATES ───────────────────────────────────────────────────────────
PAGES.dates = {
  slug: 'admissions-dates', output: 'admissions/dates/index.html', file: 'admissions-dates.html',
  title: 'Dates &amp; the Academic Calendar &mdash; Worldwide English College',
  description: 'When you can start at WEC-LC, why there are no term dates, and what the '
    + 'academic calendar decision actually involves.',
  body: `${hero('Admissions', 'When can I start?',
    'When you enrol. There is no intake to wait for and no term to miss &mdash; and there are '
    + 'no published term dates, which this page explains rather than glosses over.')}

<section class="section--light section-pad">
  <div class="container reveal">
    <div class="section-head">
      <span class="module-marker">Starting</span>
      <h2>Admission is continuous.</h2>
      <p class="lede">This is not a marketing choice. It is what the platform actually does,
        and describing anything else would describe software that does not exist.</p>
    </div>
    <div class="grid grid--3">
${card('The day you enrol', 'Level I opens immediately', 'A confirmed payment creates your enrolment and the first lesson is available the same day. Nothing is held back until a start date.')}
${card('At your own pace', 'Progression is per learner', 'Your progress record is yours alone. There is no class moving ahead of you and none waiting for you, and no lesson unlocks on a date.')}
${card('One level at a time', 'The next level opens when this one closes', 'Levels II to VI are added as each preceding level is completed, whether you paid per level or for the whole programme. Completion is confirmed by a member of staff, not calculated automatically &mdash; the College has no automated grading engine.')}
    </div>
  </div>
</section>

<section class="section--paper section-pad">
  <div class="container reveal">
    <div class="section-head">
      <span class="module-marker">Why There Are No Term Dates</span>
      <h2>Because the decision behind them has not been taken.</h2>
      <p class="lede">A calendar is not a formatting exercise. It encodes an operating model,
        and the College has not yet chosen which model it is.</p>
    </div>
    <div class="grid grid--3">
${card('Option A', 'Rolling and self-paced', 'What runs today. Nobody waits to start. The known weakness is completion: wholly self-paced language study finishes badly, for the well-understood reason that there is never anything to be late for.')}
${card('Option B', 'Fixed cohorts and termly intakes', 'The structure that makes people finish &mdash; shared pace, live classes where everyone is at the same point, a graduation that means something. The cost is an applicant in October waiting until January, and it would require rebuilding how progression works.')}
${card('Option C', 'Rolling entry, fixed rhythm', 'Study self-paced, but with live sessions, examination windows and orientation on a published recurring schedule you join at the next occurrence. This is what the College has drafted as a recommendation. It has not been adopted.')}
    </div>
    <div class="callout">
      <span class="callout__label">What this means for you today</span>
      <p>Everything you study is available on enrolment and paced by you. The recurring live
        timetable described in Option C does not yet run. The College&rsquo;s own status page
        lists the academic calendar and first-cohort start date as outstanding, and this page
        does not contradict it.</p>
    </div>
  </div>
</section>

<section class="section--dark section-pad">
  <div class="container reveal">
    <div class="section-head">
      <span class="module-marker">How Long A Level Takes</span>
      <h2>A design figure, not a measurement.</h2>
    </div>
    <div class="grid grid--2">
${darkCard('200', 'Total qualification hours per level', 'The designed workload for one level, covering taught material, independent study, practice and assessment. It is the figure the curriculum was built to, and it has not yet been measured against real learners because there have not been any.')}
${darkCard('1,200', 'Across all six levels', 'The sum of the six. How long that takes in calendar months depends entirely on the hours a week you can give it, which is why the College publishes the hours rather than a number of months it cannot stand behind.')}
    </div>
  </div>
</section>

${cta('Start whenever you are ready.', 'Apply Now', '/admissions/#apply', 'What a Level Contains', '/study/')}`,
};

// 9 · QUESTIONS ───────────────────────────────────────────────────────
PAGES.questions = {
  slug: 'admissions-questions', output: 'admissions/questions/index.html', file: 'admissions-questions.html',
  title: 'Admissions Questions &mdash; Worldwide English College',
  description: 'Direct answers to the questions applicants actually ask WEC-LC, including the '
    + 'ones with uncomfortable answers.',
  body: `${hero('Admissions', 'Admissions questions.',
    'Answered directly, including where the answer is &ldquo;no&rdquo; or &ldquo;not yet&rdquo;. '
    + 'A question worth asking is worth a straight answer.')}

<section class="section--light section-pad">
  <div class="container reveal">
    <div class="section-head">
      <span class="module-marker">Applying</span>
      <h2>Getting in.</h2>
    </div>
    <div class="accordion">
${qa('Do I need a qualification to apply?', 'No. There is no academic entry requirement of any kind. Level I begins at A1 and assumes no usable English. See <a href="/admissions/entry-requirements/">Entry requirements</a>.')}
${qa('Do I have to start at Level I?', 'No. A placement assessment after you apply confirms which of the six levels you enter. The self-assessment on the Admissions page is your own estimate and binds nobody.')}
${qa('Is there an application fee?', 'No. Applying costs nothing and requires no documents.')}
${qa('How long until I hear back?', 'The College commits to making contact about placement within three working days. That is a commitment rather than a measured average &mdash; WEC-LC has not processed applications at volume, and saying otherwise would be inventing a statistic.')}
${qa('Can I apply if I am under 18?', 'Write to Admissions rather than using the form. The College has not adopted a safeguarding policy or appointed a Safeguarding Lead, and until it has, applications from under-18s are handled individually with a parent or guardian rather than processed as routine.')}
    </div>
  </div>
</section>

<section class="section--paper section-pad">
  <div class="container reveal">
    <div class="section-head">
      <span class="module-marker">Money</span>
      <h2>Fees, payment and refunds.</h2>
    </div>
    <div class="accordion">
${qa('What does it cost?', `${FULL_PRICE} for the full six-level programme, or ${PER_LEVEL} per level. Full breakdown at <a href="/admissions/tuition/">Tuition &amp; Fees</a>.`)}
${qa('Can I pay in my own currency?', 'Fees are set and charged in US dollars. Your bank or card issuer converts at its own rate. The College does not publish local-currency prices because it has not fixed rates behind them, and a published price that changes without notice is not a price.')}
${qa('Can I pay from Nigeria?', 'Yes. Nigerian applicants are routed to Nigerian payment providers ahead of international card gateways, precisely because several international gateways do not work for Nigerian cards or merchants. If a method is not yet showing at checkout, write to Admissions and pay by transfer.')}
${qa('Can I get a refund?', 'There is no adopted refund policy. Requests are decided case by case by the founding team, in writing, and the decision is recorded. That is a weaker guarantee than a published policy, which is why it is stated here rather than discovered later. If certainty matters to you, pay level by level rather than in full.')}
${qa('Are there scholarships?', 'No scheme is open, no fund is allocated and no scholarship has been awarded. The mechanism to record one exists; the policy does not. See <a href="/admissions/scholarships/">Scholarships</a>.')}
    </div>
  </div>
</section>

<section class="section--dark section-pad">
  <div class="container reveal">
    <div class="section-head">
      <span class="module-marker">Studying</span>
      <h2>What it is actually like.</h2>
    </div>
    <div class="accordion">
${qa('Is it fully online?', 'Yes, everywhere. There is no teaching campus. &ldquo;London Campus&rdquo; identifies the administrative headquarters, and nobody attends it.')}
${qa('When do classes start?', 'Your material is available the day you enrol. There is no intake date and no term to wait for. The recurring live timetable is not yet running &mdash; see <a href="/admissions/dates/">Dates</a>.')}
${qa('How long will the programme take?', 'Each level is designed at 200 total qualification hours, 1,200 across all six. How many months that is depends on the hours you can give it each week. The College publishes the hours rather than a number of months it cannot stand behind.')}
${qa('Do I need any equipment?', 'A device that plays video, a connection that carries audio, and a microphone &mdash; the last because the Listening Lab asks you to record yourself so that change over months can be heard. A phone microphone is sufficient.')}
${qa('Will I get a certificate?', 'A transcript is issued after each level. The IEFC award itself cannot yet be conferred: no External Examiner has been appointed, and conferring an award without external examining would make the award worth less, not more. See <a href="/about/quality-assurance/">Quality assurance</a>.')}
    </div>
  </div>
</section>

<section class="section--light section-pad">
  <div class="container reveal">
    <div class="section-head">
      <span class="module-marker">The College</span>
      <h2>The questions with uncomfortable answers.</h2>
    </div>
    <div class="accordion">
${qa('Is WEC-LC accredited?', 'No. The College holds no accreditation and no external quality-assurance affiliation. It is stated on every page where it is relevant rather than once in a footnote, and it will be stated differently only when it is genuinely different.')}
${qa('How many students have graduated?', 'None. No cohort has been taught and no award has been conferred. The College publishes no student numbers, completion rates or graduate outcomes because it has none to publish.')}
${qa('Can the IEFC certificate get me into a university or through immigration?', 'No, and you should not plan on it. What is currently recognised for those purposes is IELTS, TOEFL or Cambridge &mdash; all of which the upper levels prepare for directly. The College would rather tell you that than take your money on a misunderstanding.')}
${qa('Then what am I paying for?', 'A complete, inspectable programme: six levels, sixty modules, every lesson planned stage by stage, every assessment written with published criteria, and a published set of volumes covering the curriculum, the assessment scheme and the teaching. All of it can be examined before you pay a penny, which is more than most language providers offer.')}
    </div>
  </div>
</section>

${cta('Still have a question?', 'Contact Admissions', '/contact/', 'How to Apply', '/admissions/apply/')}`,
};

// ── small lookups, kept honest ───────────────────────────────────────
function currencyName(code) {
  const names = {
    USD: 'US dollar', GBP: 'pound sterling', NGN: 'Nigerian naira', SAR: 'Saudi riyal',
    AED: 'UAE dirham', QAR: 'Qatari riyal', KWD: 'Kuwaiti dinar',
  };
  if (!names[code]) throw new Error(`No name for currency ${code} — add it rather than printing a bare code.`);
  return names[code];
}
function countryName(code) {
  const names = { NG: 'Nigeria', GB: 'United Kingdom', SA: 'Saudi Arabia', AE: 'United Arab Emirates', QA: 'Qatar', KW: 'Kuwait' };
  if (!names[code]) throw new Error(`No name for country ${code} — add it rather than printing a bare code.`);
  return names[code];
}
function gatewayName(key) {
  const names = { stripe: 'Card (Stripe)', paystack: 'Paystack', flutterwave: 'Flutterwave', opay: 'OPay' };
  if (!names[key]) throw new Error(`No name for gateway ${key}`);
  return names[key];
}

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
console.log(`Wrote ${written.length} Admissions-cluster pages:`);
for (const o of written) console.log(`  ${o}`);
console.log('Run `npm run build` to generate the served pages.');
