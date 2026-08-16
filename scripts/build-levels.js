#!/usr/bin/env node
/**
 * THE SIX LEVEL PAGES, AND THE STUDY HUB.
 *
 * ────────────────────────────────────────────────────────────────────
 * WHY THESE ARE GENERATED AND NOT WRITTEN
 * ────────────────────────────────────────────────────────────────────
 * A level page makes precise claims: how many modules, how many taught
 * hours, what the learner will be able to do, what they are assessed
 * on, what the award is called. Every one of those already exists as a
 * fact in the academic database, and every one of them is the kind of
 * fact that drifts the moment it is retyped into marketing copy.
 *
 * So the prose here is authored once, and the numbers, module titles,
 * outcomes, skills and award wording are read. A page cannot claim
 * eleven modules when the curriculum has ten, and cannot survive a
 * curriculum change by quietly going stale — it is rebuilt from the
 * same record the Teacher's Edition is set from.
 *
 * ────────────────────────────────────────────────────────────────────
 * WHAT THE PAGES DO NOT SAY
 * ────────────────────────────────────────────────────────────────────
 * No pass rates, no graduate outcomes, no student numbers, no employer
 * recognition, no accreditation. None of those exist, and a level page
 * is exactly where an institution is tempted to imply them.
 *
 * Where the record itself is provisional it says so on the page: the
 * Level I learning outcomes are approved under delegated authority and
 * carry `status = 'interim'`, and the page prints that rather than
 * presenting them as settled. A visitor who reads "interim" and asks
 * why is a visitor being told the truth.
 */

const fs = require('fs');
const path = require('path');
const { DatabaseSync } = require('node:sqlite');

const ROOT = path.resolve(__dirname, '..');
const esc = (s) => String(s ?? '')
  .replace(/\s--\s/g, ' — ')
  .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');

// ── the record ────────────────────────────────────────────────────────
function read() {
  const db = new DatabaseSync(':memory:');
  db.exec(fs.readFileSync(`${ROOT}/sql/schema.sql`, 'utf8'));
  for (let n = 1; n <= 6; n++) {
    db.exec(fs.readFileSync(`${ROOT}/sql/seed-curriculum-level-${n}.sql`, 'utf8'));
    db.exec(fs.readFileSync(`${ROOT}/sql/seed-audio-level-${n}.sql`, 'utf8'));
  }
  for (const f of ['seed-exercises', 'seed-selfchecks', 'seed-pedagogy',
    'seed-vocabulary-level-1', 'seed-solo-level-1', 'seed-competency-level-1',
    'seed-pedagogy-level-1', 'seed-teaching-expertise-level-1']) {
    db.exec(fs.readFileSync(`${ROOT}/sql/${f}.sql`, 'utf8'));
  }
  const all = (s, ...a) => db.prepare(s).all(...a);

  const levels = all('SELECT * FROM programme_levels ORDER BY id');
  const skills = all('SELECT * FROM language_skills ORDER BY sequence');
  const data = levels.map((lv) => ({
    ...lv,
    modules: all(`SELECT u.sequence, u.title FROM units u
                    JOIN courses c ON c.id = u.course_id
                   WHERE c.level_id = ? ORDER BY u.sequence`, lv.id),
    kinds: all(`SELECT i.kind, COUNT(*) n FROM learning_items i
                  JOIN units u ON u.id = i.unit_id
                  JOIN courses c ON c.id = u.course_id
                 WHERE c.level_id = ? GROUP BY 1`, lv.id)
      .reduce((a, r) => { a[r.kind] = r.n; return a; }, {}),
    outcomes: all(`SELECT code, statement, status FROM learning_outcomes
                    WHERE level_roman = ? AND scope = 'level' ORDER BY sequence`, lv.roman),
    award: all('SELECT * FROM award_definitions WHERE level_id = ?', lv.id)[0] || null,
  }));
  db.close();
  return { levels: data, skills };
}

const { levels, skills } = read();
if (levels.length !== 6) throw new Error(`Expected 6 levels, read ${levels.length}`);

const money = (c) => `$${(c / 100).toLocaleString('en-GB', { maximumFractionDigits: 0 })}`;
const SLUG = { I: 'level-1', II: 'level-2', III: 'level-3', IV: 'level-4', V: 'level-5', VI: 'level-6' };

// ── the one paragraph per level that is authored, not read ───────────
// Each names the shift the level actually makes, which the module list
// alone does not convey. Written from the curriculum, arguable, and
// nowhere claiming an outcome the College has not measured.
const CHARACTER = {
  I: 'Foundation is the hardest level to begin and the easiest to underestimate. It assumes no English at all and ends with a learner who can introduce themselves, handle a shop, a street and a clinic, and write a few true sentences about their own life. The work is not complexity; it is building the first automatic responses, so that greeting someone or saying where you live no longer requires assembling the sentence first.',
  II: 'Elementary is where isolated sentences become connected speech. The learner already has the present and the past; this level teaches them to join, sequence and qualify — to tell a story rather than list events, to give an opinion rather than a fact, and to keep a conversation going when the other person says something unexpected.',
  III: 'Intermediate is the level at which English stops being a subject and starts being a tool. The learner reads for argument rather than gist, states and defends a position, and handles topics — work, study, environment, technology — where the vocabulary is not domestic. It is also where the present perfect finally has to be understood rather than avoided.',
  IV: 'Upper Intermediate is where accuracy under pressure begins to matter. The learner can already communicate; this level is about doing it in settings that judge them — an academic essay, a meeting, a negotiation, a piece of media read critically rather than accepted. Structure and register carry as much weight as vocabulary.',
  V: 'Advanced is the level of nuance. The learner has the system; what is added is control over how something lands — idiom, implication, tone, the difference between disagreeing and being disagreeable. Research, presentation and advocacy require English that persuades a listener who is not obliged to be patient.',
  VI: 'Mastery is not more English. It is English used with a personal voice: style that is chosen rather than inherited, argument built for a specific audience, and the confidence to work in registers — academic, professional, public — that require judgement rather than rules. It is the level at which the learner stops being a student of the language.',
};

// ── page assembly ────────────────────────────────────────────────────
// ── THE MATERIAL LAW, IN THE GENERATOR ───────────────────────────────
//
// These two helpers used to emit `<div class="card">` and nothing else.
// The six level pages in pages/ carry the full atelier layer — CLAUDE.md
// §2 — because a later pass added it to the FILES by hand. Nobody added
// it here, so this generator and the pages it owns had silently
// diverged: running `node scripts/build-levels.js` stripped the
// travelling light, the lit rim, the tilt, the sheen and all 25 domes
// off every one of the six, and the only warning was a diff nobody was
// looking at. It was found by running it.
//
// So the law lives here now, and `icon` is what carries it. Passing one
// produces a struck card; omitting it keeps the bare markup exactly as
// it was, so any call site not yet given an icon renders unchanged
// rather than half-dressed.
//
// tests/level-generators.test.mjs asserts that regenerating changes
// nothing, which is the only way this stays true.
// The mark each skill wears. Listening is a waveform, reading a book,
// speaking the language glyph, writing a quill — taken from the shipped
// pages rather than reinvented, so regeneration is a no-op.
const SKILL_ICON = {
  Listening: 'i-waveform', Reading: 'i-book',
  Speaking: 'i-language', Writing: 'i-quill',
};

const struck = (dark) => dark
  ? 'card reveal tilt card--dark edge-lit aurum'
  : 'card reveal tilt edge-lit edge-lit--light aurum';

const dome = (icon, dark) => icon
  ? `\n        <span class="tilt__sheen" aria-hidden="true"></span>` +
    `\n        <span class="badge-dome${dark ? ' badge-dome--dark' : ''} badge-dome--lg gold-live">` +
    `<svg class="icon" aria-hidden="true"><use href="#${icon}"/></svg></span>`
  : '';

const darkCard = (num, title, body, icon) => `      <div class="${icon ? struck(true) : 'card card--dark'}">${dome(icon, true)}
        <span class="card__num">${esc(num)}</span>
        <h3>${esc(title)}</h3>
        <p>${body}</p>
      </div>`;
const card = (num, title, body, icon) => `      <div class="${icon ? struck(false) : 'card'}">${dome(icon, false)}
        <span class="card__num">${esc(num)}</span>
        <h3>${esc(title)}</h3>
        <p>${body}</p>
      </div>`;

function levelPage(lv, i) {
  const prev = levels[i - 1] || null;
  const next = levels[i + 1] || null;
  const lessons = lv.units;   // the designed lesson count — not hours
  const teaching = lv.kinds.reading || 0;
  const quizzes = lv.kinds.quiz || 0;
  const assignments = lv.kinds.assignment || 0;
  const listening = lv.kinds.listening || 0;
  const pron = lv.kinds.pronunciation || 0;
  const a = lv.award;

  const outcomes = lv.outcomes.length ? `
<section class="section--light section-pad" id="outcomes">
  <div class="container reveal">
    <div class="section-head">
      <span class="module-marker">Learning Outcomes</span>
      <h2>What you will be able to do.</h2>
      <p class="lede">Stated before the teaching is designed, not after. Each outcome is a
        claim the assessments are built to test, which is why there are ${lv.outcomes.length}
        of them and not twenty.</p>
    </div>
    <div class="table-scroll">
      <table class="ledger">
        <thead><tr><th scope="col">Code</th><th scope="col">On completion, the learner can</th><th scope="col">Status</th></tr></thead>
        <tbody>
${lv.outcomes.map((o) => `          <tr><td>${esc(o.code)}</td><td>${esc(o.statement)}</td><td>${esc(o.status)}</td></tr>`).join('\n')}
        </tbody>
      </table>
    </div>
    ${lv.outcomes.some((o) => o.status !== 'approved') ? `<div class="callout">
      <span class="callout__label">Why these are marked interim</span>
      <p>The Board of Academic Standards &amp; Curriculum Excellence has no appointed members
        yet, and an outcome cannot be approved by a body that does not sit. These were written
        under authority delegated to the Press and are recorded as interim until the Board is
        constituted and reviews them. They are used, and they are not yet ratified &mdash; and
        we would rather say so than describe them as settled.</p>
    </div>` : ''}
  </div>
</section>` : '';

  const award = a ? `
<section class="section--paper section-pad" id="award">
  <div class="container reveal">
    <div class="section-head">
      <span class="module-marker">The Award</span>
      <h2>${esc(a.official_title)}</h2>
      <p class="lede">${esc(a.standing)}${a.post_nominal ? ` &middot; Post-nominal <b>${esc(a.post_nominal)}</b>` : ''}</p>
    </div>
    <div class="grid grid--2">
${card('What it honours', 'Why this award exists', esc(a.academic_purpose), 'i-laurel')}
${card('Graduate profile', 'What the holder can do', esc(a.graduate_profile), 'i-mortarboard')}
    </div>
    <div class="callout">
      <span class="callout__label">What this award is not</span>
      <p>WEC-LC holds no accreditation, and the College has not appointed an External Examiner
        &mdash; the independent post whose whole function is to confirm, from outside, that this
        level sits where the College says it sits. This award is defined, its criteria are
        published, and every one conferred so far was set, marked and second-marked inside the
        College. See <a href="/about/#status">About &middot; Institutional Status</a>.</p>
    </div>
  </div>
</section>` : '';

  return `<section class="section--dark section-pad">
  <div class="container">
    <span class="eyebrow">IEFC &middot; Level ${esc(lv.roman)}</span>
    <h1>${esc(lv.name)}</h1>
    <p class="lede">${esc(CHARACTER[lv.roman])}</p>
    <div class="btn-row">
      <a href="/admissions/#apply" class="btn btn--gold">Apply for Level ${esc(lv.roman)}</a>
      <a href="/academics/#iefc" class="btn btn--outline">The Full IEFC Programme</a>
    </div>
  </div>
</section>

<section class="section--light section-pad" id="overview">
  <div class="container reveal">
    <div class="stat-row">
      <div class="stat-row__item"><b>${esc(lv.cefr)}</b><span>CEFR Level</span></div>
      <div class="stat-row__item"><b>${lv.modules.length}</b><span>Modules</span></div>
      <div class="stat-row__item"><b>${lessons}</b><span>Designed Lessons</span></div>
      <div class="stat-row__item"><b>${lv.duration_months}</b><span>Months</span></div>
      <div class="stat-row__item"><b>${money(lv.price_usd_cents)}</b><span>Tuition</span></div>
    </div>
    <div class="section-head">
      <span class="module-marker">Overview</span>
      <h2>What this level contains.</h2>
    </div>
    <div class="grid grid--3">
${card('Teaching', `${teaching} lessons`, `Each lesson runs a full sequence &mdash; warm-up, presentation, guided practice, independent practice, writing and homework &mdash; with the timing stated in the plan rather than left to the room.`, 'i-quill')}
${card('Listening', `${listening} listening sets`, 'A scripted listening set for every module, with speaker cues and comprehension work built against the script rather than added afterwards.', 'i-waveform')}
${card('Pronunciation', `${pron} laboratories`, 'A pronunciation laboratory per module, targeting the sounds, stress patterns and rhythm the module&rsquo;s own language actually needs.', 'i-language')}
    </div>
  </div>
</section>

<section class="section--paper section-pad" id="modules">
  <div class="container reveal">
    <div class="section-head">
      <span class="module-marker">Modules</span>
      <h2>The ${lv.modules.length} modules, in order.</h2>
      <p class="lede">The sequence is deliberate: each module assumes what the one before it
        taught, and the final module consolidates rather than introduces.</p>
    </div>
    <div class="table-scroll">
      <table class="ledger">
        <thead><tr><th scope="col">#</th><th scope="col">Module</th></tr></thead>
        <tbody>
${lv.modules.map((m) => `          <tr><td>${m.sequence}</td><td>${esc(m.title)}</td></tr>`).join('\n')}
        </tbody>
      </table>
    </div>
  </div>
</section>
${outcomes}
<section class="section--dark section-pad" id="skills">
  <div class="container reveal">
    <div class="section-head">
      <span class="module-marker">Skills Developed</span>
      <h2>Four skills, taught and assessed separately.</h2>
      <p class="lede">A learner who reads well and speaks poorly is not at the same level in
        both, and a single overall grade hides that. Each skill is tracked on its own.</p>
    </div>
    <div class="grid grid--2">
${skills.map((s) => darkCard(
    s.mode === 'receptive' ? 'Receptive' : 'Productive',
    s.name, esc(s.description), SKILL_ICON[s.name] || 'i-language',
  )).join('\n')}
    </div>
  </div>
</section>

<section class="section--light section-pad" id="assessment">
  <div class="container reveal">
    <div class="section-head">
      <span class="module-marker">Assessment</span>
      <h2>How the level is judged.</h2>
      <p class="lede">Every instrument is written before the teaching it tests, and the
        criteria are published to the learner in advance.</p>
    </div>
    <div class="grid grid--3">
${card('Continuous', `${quizzes} module quizzes`, 'One at the end of each module, testing the language that module taught and nothing else. Marked automatically, with the correct answer and the reason shown.', 'i-progress')}
${card('Productive', `${assignments} assignments`, 'Speaking and writing tasks marked by an instructor against a published rubric. These are where the productive skills are actually assessed &mdash; a quiz cannot judge whether someone can hold a conversation.', 'i-quill')}
${card('Self-check', 'Before every assessment', 'Each lesson carries a self-check with traps aimed at the mistakes learners at this level really make, so a learner discovers a gap before an examiner does.', 'i-compass')}
    </div>
    <div class="btn-row">
      <a href="/academics/#iefc" class="btn btn--red">Assessment &amp; Progression in Full</a>
    </div>
  </div>
</section>

<section class="section--paper section-pad" id="teaching">
  <div class="container reveal">
    <div class="section-head">
      <span class="module-marker">Teaching Methods</span>
      <h2>How it is taught.</h2>
    </div>
    <div class="grid grid--2">
${card('Speaking-first', 'Practice before polish', 'Guided speaking is built into every lesson, not offered as an extra. Learners speak from the first lesson, before their grammar is ready, because waiting for accuracy is how people stay silent for years.', 'i-language')}
${card('Structured', 'A shared standard, not a personal style', 'Every instructor teaches to the same mapped curriculum, so a learner who changes class or cohort does not lose their place, and two learners at the same level have covered the same ground.', 'i-columns')}
${card('Supported', 'A teacher who knows what goes wrong', `Instructors work from the Teacher's Companion, which sets out for each lesson what commonly goes wrong, a second way to explain it, and what to do for the learner who is behind and the one who is ahead.`, 'i-shield-check')}
${card('Measured', 'Adjusted to the cohort', 'Quiz and assignment results are visible to the instructor as the level runs, so teaching responds to how this group is actually performing rather than to how the plan assumed they would.', 'i-scales')}
    </div>
  </div>
</section>

<section class="section--light section-pad" id="resources">
  <div class="container reveal">
    <div class="section-head">
      <span class="module-marker">Resources</span>
      <h2>What you are given.</h2>
    </div>
    <div class="grid grid--3">
${card('Platform', 'The learning platform', 'Lessons, quizzes, self-checks and progress tracking, with your marks and feedback in one record you keep.', 'i-key')}
${card('Listening Lab', 'Recorded practice', 'The Listening Lab holds the level&rsquo;s recorded material with the script, and records your own speaking for pronunciation feedback.', 'i-waveform')}
${card('Press volumes', 'Printed and digital', 'The curriculum is published as a set of volumes by WEC Press &mdash; the Complete Curriculum, the Assessment Handbook, and for Level I a Student Workbook and Teacher&rsquo;s Companion.', 'i-book')}
    </div>
    <div class="btn-row">
      <a href="/press/" class="btn btn--outline">WEC Press Catalogue</a>
    </div>
  </div>
</section>

<section class="section--dark section-pad" id="progression">
  <div class="container reveal">
    <div class="section-head">
      <span class="module-marker">Progression</span>
      <h2>Where this level sits.</h2>
    </div>
    <div class="grid grid--2">
      <div class="card reveal tilt card--dark edge-lit aurum">
        <span class="tilt__sheen" aria-hidden="true"></span>
        <span class="badge-dome badge-dome--dark badge-dome--lg gold-live"><svg class="icon" aria-hidden="true"><use href="#i-passport"/></svg></span>
        <span class="card__num">Before</span>
        <h3>${prev ? esc(`Level ${prev.roman} — ${prev.name}`) : 'No prior study required'}</h3>
        <p>${prev
    ? `Level ${esc(lv.roman)} assumes the language taught in ${esc(prev.name)} (${esc(prev.cefr)}). Learners who have not studied with the College take a placement assessment rather than being asked to self-declare.`
    : 'Foundation assumes no English. There is no entry test and no prerequisite &mdash; it is written for a learner starting from nothing.'}</p>
      </div>
      <div class="card reveal tilt card--dark edge-lit aurum">
        <span class="tilt__sheen" aria-hidden="true"></span>
        <span class="badge-dome badge-dome--dark badge-dome--lg gold-live"><svg class="icon" aria-hidden="true"><use href="#i-compass"/></svg></span>
        <span class="card__num">After</span>
        <h3>${next ? esc(`Level ${next.roman} — ${next.name}`) : 'The end of the programme'}</h3>
        <p>${next
    ? `On completion, learners progress to ${esc(next.name)} (${esc(next.cefr)}), which assumes everything taught here.`
    : 'Mastery is the final level of the IEFC. There is no level above it in this programme.'}</p>
      </div>
    </div>
    ${next ? `<div class="btn-row">
      <a href="/study/${SLUG[next.roman]}/" class="btn btn--gold">Level ${esc(next.roman)} &mdash; ${esc(next.name)}</a>
    </div>` : ''}
  </div>
</section>
${award}
<section class="section--light section-pad" id="questions">
  <div class="container reveal">
    <div class="section-head">
      <span class="module-marker">Questions</span>
      <h2>What people ask about this level.</h2>
    </div>
    <div class="grid grid--2">
${card('Duration', `How long does Level ${lv.roman} take?`, `${lv.duration_months} months of study by design, covering ${lessons} designed lessons across ${lv.modules.length} modules. Learners who need longer are not penalised; the level is a body of work, not a race.`, 'i-clocktower')}
${card('Entry', prev ? `Do I need Level ${prev.roman} first?` : 'Do I need any English to start?', prev
    ? `Not necessarily. You need the language ${esc(prev.name)} teaches, however you acquired it. A placement assessment establishes that.`
    : 'No. Foundation assumes none, and the first lesson teaches the alphabet and how to say your own name.', 'i-passport')}
${card('Assessment', 'What happens if I fail an assessment?', 'Assessments can be resat. The purpose is to establish what you can do, not to record a single bad afternoon &mdash; the appeals and resit procedure is published in full.', 'i-scales')}
${card('Recognition', 'Is the award recognised?', 'The award is defined and its criteria published, but WEC-LC holds no accreditation and has appointed no External Examiner. We state this plainly rather than implying recognition the College has not obtained.', 'i-seal')}
    </div>
  </div>
</section>

<section class="section--dark cta-band">
  <div class="container reveal">
    <h2>Begin Level ${esc(lv.roman)}.</h2>
    <div class="btn-row u-center">
      <a href="/admissions/#apply" class="btn btn--gold">Apply Now</a>
      <a href="/contact/" class="btn btn--outline">Ask a Question</a>
    </div>
  </div>
</section>
`;
}

// ── the study hub ────────────────────────────────────────────────────
// ── /academics/ IS NO LONGER GENERATED HERE ──────────────────────────
//
// This file used to hold a 267-line academicsPage() template and write
// it over pages/academics.html on every run. That page has since been
// recomposed by hand as a curriculum document — the Ascent, its six
// struck plates on a rising gold spine, the Horarium, the twenty
// disciplines and the register — and the template here was never
// updated. Running this script replaced a 715-line document with the
// 387-line table page it superseded, silently, and the only sign was a
// diff nobody was reading.
//
// It is deleted rather than left dormant: a stale template that would
// destroy a page the moment anyone re-enabled it is worse than no
// template at all. The manifest entry below is still upserted, because
// the route, the title and the description do belong to this script —
// only the body does not.
//
// tests/level-generators.test.mjs holds pages/academics.html on its
// watch list for exactly this reason.

// The one-line focus statements in the CEFR table. Authored, per level,
// keyed by roman so a level added to the record fails loudly here.
const FOCUS = {
  I: 'First words to simple, everyday exchanges — sound system, core grammar, survival vocabulary.',
  II: 'Everyday topics with growing confidence — routine conversation, simple written communication.',
  III: 'Independent use of English — connected speech, opinions, and structured writing.',
  IV: 'Fluent, spontaneous interaction — academic and professional register, argument and analysis.',
  V: 'Precise, flexible use of English for complex academic and professional purposes.',
  VI: 'Near-native command — nuance, idiom, leadership communication and executive presence.',
}
for (const lv of levels) {
  if (!FOCUS[lv.roman]) throw new Error(`No focus line for level ${lv.roman}`);
}

// ── write sources + manifest ─────────────────────────────────────────
const MANIFEST = path.join(ROOT, 'pages/manifest.json');
const manifest = JSON.parse(fs.readFileSync(MANIFEST, 'utf8'));
const entries = Array.isArray(manifest) ? manifest : manifest.pages;
const written = [];

// `body` may be null, meaning "this route belongs to the manifest but
// its page is hand-authored" — see the note where academicsPage() was
// removed. A null body upserts the entry and leaves the file alone.
function upsert(entry, contentFile, body) {
  if (body !== null) fs.writeFileSync(path.join(ROOT, 'pages', contentFile), body);
  const i = entries.findIndex((e) => e.slug === entry.slug);
  if (i >= 0) entries[i] = { ...entries[i], ...entry };
  else entries.push(entry);
  written.push(entry.output);
}

upsert({
  slug: 'academics',
  output: 'academics/index.html',
  title: 'Academics &mdash; Worldwide English College',
  description: 'The IEFC in six CEFR-aligned levels: what each contains, how learning works, '
    + 'the digital campus it runs on, and the standard the whole programme is taught to.',
  contentFile: 'academics.html',
  lang: 'en', dir: 'ltr',
  contents: true,
}, 'academics.html', null);

// The routes this pillar absorbs, pruned from the manifest so they stop
// building the moment this generator runs — the redirect harness fails
// the build if a retired page is still served.
for (const slug of ['academics-iefc', 'study', 'learning', 'learning-platform', 'support-technical']) {
  const i = entries.findIndex((e) => e.slug === slug);
  if (i >= 0) entries.splice(i, 1);
}

levels.forEach((lv, i) => {
  upsert({
    slug: `study-${SLUG[lv.roman]}`,
    output: `study/${SLUG[lv.roman]}/index.html`,
    title: `Level ${lv.roman}: ${lv.name} (${lv.cefr}) &mdash; Worldwide English College`,
    description: `Level ${lv.roman} of the IEFC: ${lv.modules.length} modules, ${lv.units} `
      + `designed lessons over ${lv.duration_months} months, aligned to CEFR ${lv.cefr}. Modules, `
      + 'learning outcomes, assessment, teaching methods and the award.',
    contentFile: `study-${SLUG[lv.roman]}.html`,
    lang: 'en', dir: 'ltr',
    // Ten sections and 1,300 words. scripts/build.js turns this into a
    // contents rail built from each section's own module marker.
    contents: true,
  }, `study-${SLUG[lv.roman]}.html`, levelPage(lv, i));
});

fs.writeFileSync(MANIFEST, JSON.stringify(manifest, null, 2) + '\n');
console.log(`Wrote ${written.length} page sources:`);
for (const o of written) console.log(`  ${o}`);
console.log('Run `npm run build` to generate the served pages.');
