#!/usr/bin/env node
/**
 * LEARNING AND SUPPORT — five pages.
 *
 * ────────────────────────────────────────────────────────────────────
 * THE THREE PAGES INSTITUTIONS GET WRONG BY COPYING
 * ────────────────────────────────────────────────────────────────────
 * Accessibility, technical requirements and privacy are the three pages
 * most often filled by pasting somebody else's. The result reads well
 * and describes a different organisation: a WCAG conformance claim
 * nobody audited, a browser matrix nobody tested, a cookie policy for
 * cookies the site does not set.
 *
 * So each of these is written from this site as it actually is:
 *
 *   · The accessibility page claims no conformance level, because no
 *     audit has been commissioned. It states what was built
 *     deliberately, what is known to be untested, and what the College
 *     will do on request — which is a smaller and truer offer than a
 *     conformance badge.
 *   · The technical page lists what the programme genuinely uses. The
 *     microphone is there because the Listening Lab needs one; there is
 *     no invented minimum specification.
 *   · The privacy page states the one fact most sites bury: this site
 *     runs no analytics, no advertising trackers and no third-party
 *     measurement of any kind. That is unusual enough to be worth
 *     stating plainly, and it is checked before this file will build.
 *
 * The build fails if a third-party analytics script ever appears in the
 * site's own scripts or partials, because the privacy page asserts
 * there is none.
 */

const fs = require('fs');
const path = require('path');

const ROOT = path.resolve(__dirname, '..');
const esc = (s) => String(s ?? '')
  .replace(/\s--\s/g, ' — ')
  .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');

// ── the assertion the privacy page makes, verified before publishing ──
const TRACKERS = /googletagmanager|google-analytics|gtag\(|facebook\.net|fbq\(|hotjar|mixpanel|segment\.com|matomo|plausible\.io|clarity\.ms/i;
const scanned = [];
for (const dir of ['js', 'partials', 'css']) {
  const abs = path.join(ROOT, dir);
  if (!fs.existsSync(abs)) continue;
  for (const f of fs.readdirSync(abs)) {
    const p = path.join(abs, f);
    if (!fs.statSync(p).isFile()) continue;
    const text = fs.readFileSync(p, 'utf8');
    scanned.push(f);
    // renderAnalytics() in the Listening Lab is the learner's own
    // progress display, not measurement of them — the pattern above is
    // deliberately specific to third-party trackers rather than to the
    // word "analytics".
    if (TRACKERS.test(text)) {
      throw new Error(`${dir}/${f} now loads a third-party tracker. /support/privacy/ states the `
        + 'site runs none — fix the page or the script, but do not publish the claim.');
    }
  }
}
if (scanned.length < 5) throw new Error(`Only scanned ${scanned.length} files — the tracker check would pass vacuously.`);

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

// 1 · HOW LEARNING WORKS ──────────────────────────────────────────────
// ── learning, the platform and technical requirements ────────────────
// Absorbed into the Academics pillar (scripts/build-levels.js) when it
// became /academics/#learning and /academics/#campus. This file keeps
// the two obligation pages: accessibility and privacy.

// 3 · ACCESSIBILITY ───────────────────────────────────────────────────
PAGES.accessibility = {
  slug: 'support-accessibility', output: 'support/accessibility/index.html', file: 'support-accessibility.html',
  title: 'Accessibility &mdash; Worldwide English College',
  description: 'What WEC-LC has built for accessibility, what has not been audited, and what the '
    + 'College will do on request.',
  body: `${hero('Support', 'Accessibility.',
    'This page claims no conformance level, because no audit has been carried out. What follows '
    + 'is what was built deliberately, what is untested, and what happens if you ask.')}

<section class="section--light section-pad">
  <div class="container reveal">
    <div class="section-head">
      <span class="module-marker">No Claim</span>
      <h2>Why there is no conformance statement here.</h2>
    </div>
    <div class="callout">
      <span class="callout__label">An unaudited claim is a claim about nothing</span>
      <p>An accessibility statement asserting a conformance level that nobody has independently
        tested tells a disabled user precisely nothing, and tells them it confidently. No audit
        of this site has been commissioned. Until one is, the College describes what it did
        rather than what standard it meets.</p>
    </div>
  </div>
</section>

<section class="section--paper section-pad">
  <div class="container reveal">
    <div class="section-head">
      <span class="module-marker">Built Deliberately</span>
      <h2>What was done on purpose.</h2>
    </div>
    <div class="grid grid--4">
${card('Structure', 'Real headings and landmarks', 'Pages are built from actual document structure rather than styled text, so a screen reader can navigate them by heading and region.')}
${card('Forms', 'Labelled fields and announced errors', 'Every field has a real label, and validation errors are announced rather than only coloured. A red border communicates nothing to someone who cannot see it.')}
${card('Motion', 'Reveal effects are decoration only', 'Nothing is hidden behind an animation. Content is present whether or not the effect runs.')}
${card('Print', 'A separately composed large-print edition', 'The Large Print curriculum is composed at its own size rather than enlarged, because enlarging a page designed for another size breaks its line lengths and tables.')}
    </div>
  </div>
</section>

<section class="section--dark section-pad">
  <div class="container reveal">
    <div class="section-head">
      <span class="module-marker">Known Gaps</span>
      <h2>Untested, and stated as untested.</h2>
    </div>
    <div class="grid grid--3">
${darkCard('Not tested', 'With actual assistive technology', 'The site has not been tested by screen-reader users. Building to the right structure and being usable are different things, and only the second one matters.')}
${darkCard('Not provided', 'Captions or transcripts for live sessions', 'No live session has run, and no captioning arrangement exists. This is a real barrier for deaf and hard-of-hearing learners and it is named rather than omitted.')}
${darkCard('Not provided', 'A formal adjustments process', 'The College has no process for assessing a need or granting a formal adjustment. What it can do is arrange things informally &mdash; extended time, alternative formats, audio-only participation. That is a smaller offer than a policy and is described as the smaller thing it is.')}
    </div>
    <div class="callout">
      <span class="callout__label">If something on this site is unusable for you</span>
      <p>Write to <a href="mailto:info@worldwencollege.co.uk?subject=Accessibility">info@worldwencollege.co.uk</a>
        and describe what happened. It will be answered by a person and it will be fixed if it
        can be. A report of a real barrier is worth more to this College than any audit it could
        currently afford.</p>
    </div>
  </div>
</section>

${cta('What the College can and cannot support.', 'Support', '/students/#support', 'Technical Requirements', '/academics/#campus')}`,
};

// 4 · TECHNICAL ───────────────────────────────────────────────────────
PAGES.privacy = {
  slug: 'support-privacy', output: 'support/privacy/index.html', file: 'support-privacy.html',
  title: 'Privacy &amp; Your Data &mdash; Worldwide English College',
  description: 'What this site collects, what it does not, who else is involved, and the '
    + 'accountability WEC-LC has not yet appointed.',
  body: `${hero('Support', 'Privacy and your data.',
    'What this website collects, which third parties are involved, and the one gap in '
    + 'accountability the College has to declare rather than gloss.')}

<section class="section--light section-pad">
  <div class="container reveal">
    <div class="section-head">
      <span class="module-marker">The Unusual Part First</span>
      <h2>This site runs no analytics and no trackers.</h2>
    </div>
    <div class="callout">
      <span class="callout__label">No third-party measurement of any kind</span>
      <p>There is no analytics platform, no advertising pixel, no heat-mapping, no session
        recording and no third-party measurement script anywhere on this site. Nobody is
        measuring your visit, here or elsewhere. This is stated first because it is unusual, and
        because a privacy page that opens with definitions and buries the substance is a privacy
        page designed not to be read. An automated check refuses to build this page if a tracker
        ever appears in the site&rsquo;s own scripts.</p>
    </div>
  </div>
</section>

<section class="section--paper section-pad">
  <div class="container reveal">
    <div class="section-head">
      <span class="module-marker">What Is Collected</span>
      <h2>Two forms, and one of them sends nothing.</h2>
    </div>
    <div class="table-scroll">
      <table class="ledger">
        <thead><tr><th>Where</th><th>What</th><th>Goes where</th></tr></thead>
        <tbody>
          <tr><td><strong>The application form</strong></td><td>Name, email address, country, and the self-assessed level if you took the estimate</td><td>The College&rsquo;s own database, over an encrypted connection</td></tr>
          <tr><td><strong>The enquiry form</strong></td><td>Nothing</td><td>Nowhere. It opens your own email application with your message ready to send &mdash; the College has no form service connected.</td></tr>
          <tr><td><strong>The level self-assessment</strong></td><td>Your answer</td><td>Your own browser, so the application form can show it back to you. It is not sent anywhere on its own.</td></tr>
          <tr><td><strong>As a student</strong></td><td>Attempts, marks, feedback, working notes and voice recordings</td><td>The College&rsquo;s database and its own file storage &mdash; see <a href="/students/academic-record/">Your academic record</a></td></tr>
        </tbody>
      </table>
    </div>
  </div>
</section>

<section class="section--dark section-pad">
  <div class="container reveal">
    <div class="section-head">
      <span class="module-marker">Third Parties</span>
      <h2>Three, named.</h2>
      <p class="lede">Saying &ldquo;we may share data with service providers&rdquo; names nobody.
        These are the actual ones.</p>
    </div>
    <div class="grid grid--3">
${darkCard('Hosting', 'Cloudflare', 'This site, the College&rsquo;s database and its file storage all run on Cloudflare&rsquo;s infrastructure. Anything stored is stored there.')}
${darkCard('Sign-in', 'Clerk', 'Student and staff accounts are handled by an authentication service, so your password is held by them rather than by the College. This applies only once you have an account &mdash; browsing this site involves no sign-in at all.')}
${darkCard('Payment', 'The gateway you choose', 'Card and local payment details are entered with the payment provider, never with the College. WEC-LC records that a payment succeeded, its amount and its reference; it never sees or stores a card number.')}
    </div>
  </div>
</section>

<section class="section--light section-pad">
  <div class="container reveal">
    <div class="section-head">
      <span class="module-marker">Accountability</span>
      <h2>The gap, stated rather than glossed.</h2>
    </div>
    <div class="grid grid--2">
${card('Not appointed', 'A Data Protection owner', 'The College cannot yet name a person accountable for how personal data is handled, retained or erased. The post is on its appointments schedule, and until it is filled these questions are answered by the founding team.')}
${card('Not decided', 'Retention and erasure', 'How long a learner&rsquo;s voice recordings are kept, and what erasure means against an academic register intended to be permanent, are both open governance decisions &mdash; see <a href="/governance/decisions/">the decisions register</a>. Publishing a retention period the College had not decided would be inventing a policy on a website.')}
    </div>
    <div class="callout">
      <span class="callout__label">To ask about your data</span>
      <p>Write to <a href="mailto:info@worldwencollege.co.uk?subject=My%20data">info@worldwencollege.co.uk</a>.
        Requests are answered by a person, in writing, and the answer is recorded.</p>
    </div>
  </div>
</section>

${cta('What is held about a student.', 'Your Academic Record', '/students/academic-record/', 'Admissions Policy', '/admissions/policy/')}`,
};

// ── write ────────────────────────────────────────────────────────────
const MANIFEST = path.join(ROOT, 'pages/manifest.json');
const manifest = JSON.parse(fs.readFileSync(MANIFEST, 'utf8'));
const entries = Array.isArray(manifest) ? manifest : manifest.pages;
const written = [];

for (const slug of ['learning', 'learning-platform', 'support-technical']) {
  const i = entries.findIndex((e) => e.slug === slug);
  if (i >= 0) entries.splice(i, 1);
}

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
console.log(`Wrote ${written.length} Learning/Support pages (tracker check: ${scanned.length} files clean):`);
for (const o of written) console.log(`  ${o}`);
console.log('Run `npm run build` to generate the served pages.');
