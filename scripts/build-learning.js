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
PAGES.learning = {
  slug: 'learning', output: 'learning/index.html', file: 'learning.html',
  title: 'How Learning Works &mdash; Worldwide English College',
  description: 'What a week of study at WEC-LC actually consists of, what is self-paced, what '
    + 'is live, and what the College has not yet run.',
  body: `${hero('Learning', 'What a week actually looks like.',
    'Most of the programme is studied when you can study it. A smaller part is live and depends '
    + 'on other people. This page separates the two, because that separation is what makes an '
    + 'online programme workable or not.',
    `<div class="btn-row">
      <a href="/learning/platform/" class="btn btn--gold">The Platform</a>
      <a href="/study/" class="btn btn--outline">The Six Levels</a>
    </div>`)}

<section class="section--light section-pad">
  <div class="container reveal">
    <div class="section-head">
      <span class="module-marker">The Shape Of A Week</span>
      <h2>Five kinds of work, in the proportion they occur.</h2>
    </div>
    <div class="grid grid--3">
${card('The bulk', 'Working through lessons', 'Each lesson is staged, with the stages timed, and can be paused and resumed. This is where most of the hours go and none of it is scheduled.')}
${card('Daily, briefly', 'Listening and recording', 'Short and frequent beats long and occasional for both listening and pronunciation. The Lab is built for ten minutes a day rather than an hour a week.')}
${card('Weekly', 'An assignment', 'One produced thing per module &mdash; written, spoken or done &mdash; marked by a person against a rubric you saw before you started.')}
${card('Before assessment', 'Self-checking', 'Not marked and not recorded against you. They exist so you can find out what you do not know at no cost.')}
${card('Live', 'Conversation and tutorials', 'The part that depends on other people being present. Recorded for anyone who cannot attend, and recordings are not treated as the lesser option.')}
${card('At the end', 'The level assessment', 'The summative point, against criteria published from the start of the level.')}
    </div>
  </div>
</section>

<section class="section--paper section-pad">
  <div class="container reveal">
    <div class="section-head">
      <span class="module-marker">Self-Paced, With A Caveat The College Will State</span>
      <h2>Self-paced study has a known failure mode.</h2>
    </div>
    <div class="callout">
      <span class="callout__label">Said plainly, because it affects you</span>
      <p>Wholly self-paced language study finishes badly, and the reason is well understood: no
        fixed points, no peers at the same stage, nothing to be late for. WEC-LC currently runs
        self-paced, because that is what is built. The College has drafted a recommendation to
        add a fixed rhythm of live sessions, examination windows and orientation on top of it,
        and that recommendation has not been adopted &mdash; see
        <a href="/admissions/dates/">Dates</a>. Until it is, the structure has to come from you,
        and you should plan for that rather than discover it in month four.</p>
    </div>
    <div class="grid grid--3">
${card('What helps', 'A fixed hour, not a target number of hours', 'A learner who studies at the same time daily finishes; a learner who intends to do six hours a week does not. This is the single most useful thing anyone can tell you about studying alone.')}
${card('What helps', 'Little and often, for listening especially', 'Ten minutes daily beats seventy on Sunday for anything involving the ear. The programme is arranged to make that possible.')}
${card('What the College does', 'Notices, and makes contact', 'Engagement is tracked so that someone who has gone quiet is reached in month two rather than discovered in month eleven. It never produces a penalty &mdash; see <a href="/students/support/">Support</a>.')}
    </div>
  </div>
</section>

<section class="section--dark section-pad">
  <div class="container reveal">
    <div class="section-head">
      <span class="module-marker">Not Yet Run</span>
      <h2>What is designed and has not happened.</h2>
    </div>
    <div class="grid grid--3">
${darkCard('The live timetable', 'No sessions have run', 'Live conversation classes and tutorials are designed and no cohort has been taught, so no timetable has been proven against where students actually are.')}
${darkCard('The recorded audio', 'Scripts written, recordings not produced', 'Listening sets are authored in full &mdash; scripts, marked features, teaching notes. The audio needs voices and a studio.')}
${darkCard('Marking at volume', 'The workspace has marked nothing', 'The instructor workspace is built and tested. It has assessed no real submission, because there have been none.')}
    </div>
  </div>
</section>

${cta('See what is built.', 'The Platform', '/learning/platform/', 'How You Are Assessed', '/students/assessment/')}`,
};

// 2 · THE PLATFORM ────────────────────────────────────────────────────
PAGES.platform = {
  slug: 'learning-platform', output: 'learning/platform/index.html', file: 'learning-platform.html',
  title: 'The Platform &mdash; Worldwide English College',
  description: 'What the WEC-LC digital campus consists of, what each part does, and which parts '
    + 'have never been used.',
  body: `${hero('Learning', 'The digital campus.',
    'Six things a person signs into, and what each is for. Where something is built but unused, '
    + 'this page says unused rather than available.')}

<section class="section--light section-pad">
  <div class="container reveal">
    <div class="section-head">
      <span class="module-marker">For Learners</span>
      <h2>Four places you work.</h2>
    </div>
    <div class="grid grid--4">
${card('Portal', 'Where you start', 'Your enrolment, your level, and what you were doing last. Designed to answer &ldquo;what now?&rdquo; in one screen rather than to present a dashboard.')}
${card('My Programme', 'The route through the level', 'Modules, lessons, exercises and assessments in order, with what is complete and what is next. Progression is per learner, so this is genuinely your own path.')}
${card('The Listening Lab', 'Recording and pronunciation', 'Listening sets, pronunciation targets, your own recordings and the feedback on them &mdash; see <a href="/students/listening-lab/">the Listening Lab</a>.')}
${card('My Record', 'What is held about you', 'Attempts, marks by skill, feedback and recordings, plus the controls for sharing any of it. The sharing decisions are yours, not the College&rsquo;s.')}
    </div>
  </div>
</section>

<section class="section--paper section-pad">
  <div class="container reveal">
    <div class="section-head">
      <span class="module-marker">For Staff And The Public</span>
      <h2>Two more.</h2>
    </div>
    <div class="grid grid--2">
${card('Instructor workspace', 'Marking and feedback', 'Where submissions are marked against their rubrics and pronunciation feedback is written against its target. Built, tested, and it has marked nothing, because there is nothing to mark yet.')}
${card('Verification', 'Open to anyone', 'A credential check requiring no account and no relationship with the College &mdash; see <a href="/standards/verification/">Verification</a>. Nothing has been issued through it, because no award has been conferred.')}
    </div>
  </div>
</section>

<section class="section--dark section-pad">
  <div class="container reveal">
    <div class="section-head">
      <span class="module-marker">Two Design Decisions Worth Naming</span>
      <h2>Built for connections that drop.</h2>
    </div>
    <div class="grid grid--2">
${darkCard('Offline recording', 'The Lab does not require a live connection', 'A recording made offline is held and uploaded in parts when the connection returns, so a drop does not lose the file. This was built because the College expects learners in places where connections drop, not as a nicety.')}
${darkCard('Drafts stay local', 'A half-written note is not sent anywhere', 'Working notes are kept on your own device until you submit. Only submission needs the network, and the interface says which is which rather than leaving you guessing.')}
    </div>
  </div>
</section>

${cta('What you need to run it.', 'Technical Requirements', '/support/technical/', 'Privacy and Your Data', '/support/privacy/')}`,
};

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

${cta('What the College can and cannot support.', 'Support', '/students/support/', 'Technical Requirements', '/support/technical/')}`,
};

// 4 · TECHNICAL ───────────────────────────────────────────────────────
PAGES.technical = {
  slug: 'support-technical', output: 'support/technical/index.html', file: 'support-technical.html',
  title: 'Technical Requirements &mdash; Worldwide English College',
  description: 'What you need to study at WEC-LC, why each item is on the list, and what to do '
    + 'when something does not work.',
  body: `${hero('Support', 'What you need.',
    'Four things, each on this list because a specific part of the programme uses it. There is '
    + 'no invented minimum specification and no browser matrix nobody has tested.')}

<section class="section--light section-pad">
  <div class="container reveal">
    <div class="section-head">
      <span class="module-marker">Required</span>
      <h2>Four things, and what each is for.</h2>
    </div>
    <div class="grid grid--4">
${card('Device', 'Anything that plays video', 'A computer, tablet or phone. The platform runs in a browser; there is nothing to install. If it plays video, it runs the programme.')}
${card('Browser', 'A current one', 'Any browser kept up to date. Stating a version matrix would imply testing across it that has not been done &mdash; keeping yours current is the honest version of that advice.')}
${card('Connection', 'Enough to stream audio', 'Listening is the spine of every level. Video calls want more; audio-only participation in live sessions is accepted, and is a stated accommodation rather than a workaround.')}
${card('Microphone', 'A phone or laptop one', 'The Listening Lab asks you to record yourself. This is the requirement people are surprised by, so it is here rather than in a footnote. Studio quality is not needed and would not improve the assessment.')}
    </div>
  </div>
</section>

<section class="section--paper section-pad">
  <div class="container reveal">
    <div class="section-head">
      <span class="module-marker">When It Does Not Work</span>
      <h2>Three common cases, answered.</h2>
    </div>
    <ol class="dot-list">
      <li><span class="num">01</span><span><strong>The recorder will not start.</strong> The browser has to be given permission to use the microphone, and that permission is per site and easily denied by accident. Check the browser&rsquo;s site permissions before assuming anything is broken.</span><span class="leader"></span></li>
      <li><span class="num">02</span><span><strong>The connection dropped mid-recording.</strong> Nothing is lost. Recording does not need the network; the file is held and uploaded in parts when the connection returns.</span><span class="leader"></span></li>
      <li><span class="num">03</span><span><strong>An application or payment form did not go through.</strong> The application form falls back to your own email application with your details filled in, so the application still reaches Admissions. For a payment, do not retry repeatedly &mdash; write to the College with the time and the amount, and it will be checked against the record.</span><span class="leader"></span></li>
    </ol>
  </div>
</section>

<section class="section--dark section-pad">
  <div class="container reveal">
    <div class="section-head">
      <span class="module-marker">Who Answers</span>
      <h2>There is no help desk.</h2>
    </div>
    <div class="grid grid--2">
${darkCard('Who', 'A member of the founding team', 'Technical problems are answered by the people who built the thing. There is no ticket queue and no first-line script, which is an advantage of the College&rsquo;s size and will not survive growth &mdash; so it is described as it is now, not as a permanent promise.')}
${darkCard('How', 'Email, with what you were doing', 'Write to <a href="mailto:info@worldwencollege.co.uk?subject=Technical">info@worldwencollege.co.uk</a> saying what you were trying to do, what happened, and on what device. Those three facts resolve most of it in one message rather than four.')}
    </div>
  </div>
</section>

${cta('What is held about you.', 'Privacy and Your Data', '/support/privacy/', 'Accessibility', '/support/accessibility/')}`,
};

// 5 · PRIVACY ─────────────────────────────────────────────────────────
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
${card('Not decided', 'Retention and erasure', 'How long a learner&rsquo;s voice recordings are kept, and what erasure means against an academic register intended to be permanent, are both open governance decisions &mdash; see <a href="/standards/decisions/">the decisions register</a>. Publishing a retention period the College had not decided would be inventing a policy on a website.')}
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
