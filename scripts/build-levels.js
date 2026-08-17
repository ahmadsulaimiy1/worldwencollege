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
// THE WEEKLY COMMITMENT, DERIVED RATHER THAN TYPED.
//
// Total Qualification Time is 200 hours per level, published site-wide
// on /academics/ and the tuition pages. The weekly figure a working
// applicant actually wants is that divided by the level's own duration,
// so it is computed here from `duration_months` — which means a level
// whose duration is ever revised cannot leave a stale "twelve hours a
// week" behind it on six pages.
//
// 4.345 is weeks per average month, not 4: at 4 the figure reads a full
// hour a week high, and a workload claim that overstates the demand is
// as much a defect as one that understates it.
const TQT_HOURS = 200;
const weeklyHours = (lv) => Math.round(TQT_HOURS / (lv.duration_months * 4.345));

// THE ARC OF ONE LEVEL, IN ITS OWN WORDS.
//
// This lede used to be one sentence repeated on all six level pages:
// "the sequence is deliberate: each module assumes what the one before
// it taught, and the final module consolidates rather than introduces."
// True of every level, which is precisely the problem — a reader who
// opens two level pages finds the same paragraph and concludes the
// pages are a template with the numbers changed. Twenty-one paragraphs
// were identical across all six; this is one of the ones that had real
// per-level data sitting unused right beside it.
//
// The module titles ARE the arc. Naming the first and last states what
// this level actually travels between, and it is read from the
// curriculum rather than written by hand, so it cannot drift from the
// table printed directly underneath it.
//
// The uniform sentence is kept as the second clause, because the
// principle is genuinely institution-wide and a reader meeting it once
// per level is being told something true about the whole programme.
const stripModuleNo = (t) => String(t).replace(/^Module\s+\d+:\s*/i, '').replace(/\s*--\s*/g, ' — ');
function moduleArc(lv) {
  const first = stripModuleNo(lv.modules[0].title);
  const last = stripModuleNo(lv.modules[lv.modules.length - 1].title);
  return `Level ${lv.roman} opens at ${first} and closes at ${last}. `
    + 'Each module assumes what the one before it taught, so the order is the argument '
    + 'rather than a filing convenience.';
}

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

// ─────────────────────────────────────────────────────────────────────
// EACH LEVEL IS A COMPLETE QUALIFICATION
// ─────────────────────────────────────────────────────────────────────
// The six levels form one pathway, and the pathway framing had a cost
// nobody had priced: it made Level VI the only finish line. A learner
// who took Level I and stopped read these pages as somebody who had
// abandoned a course a sixth of the way through.
//
// That is false, and it is expensive. Level I is a taught, assessed,
// certificated qualification with its own entry standard, its own exit
// standard and its own uses in the world. A learner who completes it
// has FINISHED something. The pathway is what they may do next, not
// what they failed to do.
//
// So every level page now carries what a qualification has to state to
// be recognised as one: who it is for, what it takes to enter, what it
// takes to be awarded, what a holder can do with it at work and in
// study, and what stopping here actually means. Authored per level
// because the answer genuinely differs — an A1 award is used to open a
// door, a C1 award is used to chair a meeting.
const QUALIFICATION = {
  1: {
    forWhom: 'An adult beginning English as an adult — with no usable English, or with school English that never became speech. It assumes nothing and starts at nothing.',
    entry: 'Nothing. No qualification, no test, no documents, no prior study. The placement assessment exists to confirm this is the right level for you, not to keep you out of it.',
    exit: '70% overall on the level examination with no single skill below 50%, all ten module assignments submitted and marked, and the spoken paper recorded and passed. The skill floor is why a pass here means you can speak, not that you compensated with reading.',
    work: 'Understood in a workplace where instructions, safety notices and short exchanges happen in English. It is the level that turns "no English" into "some English" on an application form, and that is the largest single change in employability on the whole pathway.',
    study: 'Satisfies the entry standard for Level&nbsp;II. Recognised by this College as evidence of A1 attainment; no external body recognises it, and the page below says so.',
    stopping: 'A complete A1 qualification, certificated and verifiable. If you stop here you hold a finished award from a College that publishes what it was marked against &mdash; not an abandoned course.',
  },
  2: {
    forWhom: 'A learner who can already handle single sentences and needs connected speech: the person who is understood word by word and wants to be understood in paragraphs.',
    entry: 'The Level&nbsp;I award, or A2 attainment demonstrated through the placement assessment or a recognised external qualification. See the recognition table on Admissions.',
    exit: '70% overall with no skill below 50%, ten assignments marked, and a spoken paper at A2 &mdash; where the standard becomes sustained speech rather than accurate fragments.',
    work: 'Enough English to hold a service, retail, hospitality or administrative role conducted partly in English: taking an instruction, describing a problem, writing a short message that reads as intended.',
    study: 'Satisfies the entry standard for Level&nbsp;III. The last level at which a learner is usually described as a beginner, and the first at which they are not.',
    stopping: 'A complete A2 qualification. Most language learning in the world stops somewhere around here without anything to show for it; this stops with an award and a transcript naming every skill separately.',
  },
  3: {
    forWhom: 'A learner who needs English for work or study rather than for survival: the point at which the language stops being the subject and starts being the tool.',
    entry: 'The Level&nbsp;II award, or B1 attainment demonstrated through the placement assessment or a recognised external qualification.',
    exit: '70% overall with no skill below 50%, ten assignments, and a spoken paper at B1 requiring an opinion held and defended rather than information reported.',
    work: 'The threshold most employers mean by "English required": correspondence handled, a meeting followed, a problem explained to somebody who was not there. It is the level at which English stops limiting which jobs you can apply for.',
    study: 'Satisfies the entry standard for Level&nbsp;IV, and is the level from which the College&rsquo;s IELTS, TOEFL and Cambridge preparation begins to be useful rather than premature.',
    stopping: 'A complete B1 qualification, and a defensible place to stop. B1 is the level at which a great many professional lives are conducted entirely adequately, and the award says B1 rather than implying more.',
  },
  4: {
    forWhom: 'A professional or a university-bound student who is already functional and is being held back by precision: register, structure, and the difference between being understood and being persuasive.',
    entry: 'The Level&nbsp;III award, or B2 attainment demonstrated through the placement assessment or a recognised external qualification.',
    exit: '70% overall with no skill below 50%, ten assignments, and a spoken paper at B2 requiring a technical topic discussed in the candidate&rsquo;s own field.',
    work: 'The level at which you can represent a position rather than only state one: chair a routine meeting, write a document that goes out under your name, negotiate a detail. Most international employers treat B2 as the working standard for professional English.',
    study: 'Satisfies the entry standard for Level&nbsp;V. B2 is the band most universities require for admission to an English-taught programme, and this is where the College&rsquo;s examination preparation is at its most direct.',
    stopping: 'A complete B2 qualification &mdash; the most commonly required level in the world of work and study, and a finish line rather than a way station for most of the people who reach it.',
  },
  5: {
    forWhom: 'Somebody whose English is already good and whose ceiling is now judgement: knowing which register a situation takes, and what not to say.',
    entry: 'The Level&nbsp;IV award, or C1 attainment demonstrated through the placement assessment or a recognised external qualification.',
    exit: '70% overall with no skill below 50%, ten assignments, and a spoken paper at C1 requiring flexible, effective use under conditions the candidate has not rehearsed.',
    work: 'Senior professional English: leading a discussion, arguing a case, writing at length for a demanding reader, and handling the register shifts a difficult conversation needs. The level at which English is no longer a consideration in what you can be asked to do.',
    study: 'Satisfies the entry standard for Level&nbsp;VI, and meets or exceeds the language requirement of most postgraduate programmes taught in English.',
    stopping: 'A complete C1 qualification. Very few learners need anything beyond C1 for any professional purpose, and the College would rather say that than sell a sixth level to somebody who is finished.',
  },
  6: {
    forWhom: 'A learner at the top of the framework who wants a personal voice rather than more accuracy: style chosen instead of inherited, and argument built for a specific audience.',
    entry: 'The Level&nbsp;V award, or C2 attainment demonstrated through the placement assessment or a recognised external qualification.',
    exit: '70% overall with no skill below 50%, ten assignments, and a spoken paper at C2 requiring precision fine enough to carry shades of meaning in a complex situation.',
    work: 'Work in which the English itself is the product: public argument, published writing, advocacy, teaching the language, or any role where nuance decides the outcome.',
    study: 'The end of this programme. There is no level above it here, and the College does not invent one.',
    stopping: 'A complete C2 qualification and the highest award the College confers. It is the end of the pathway rather than a stage of it, and the transcript records the whole of the route taken to reach it.',
  },
};

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


  const q = QUALIFICATION[lv.id];
  const qualification = q ? `
<section class="section--light section-pad" id="qualification">
  <div class="container reveal">
    <div class="section-head">
      <span class="module-marker">A Complete Qualification</span>
      <h2>Level ${esc(lv.roman)} is a qualification, not a stage of one.</h2>
      <p class="lede">Six levels form one pathway, and every one of them is also a finished
        award with its own entry standard, its own exit standard and its own uses. A learner who
        completes this level and stops has completed something.</p>
    </div>
    <div class="grid grid--3">
${card('Who it is for', 'The reader this level was written for', esc(q.forWhom), 'i-portico')}
${card('To enter', 'What is required to start', esc(q.entry), 'i-key')}
${card('To be awarded', 'What is required to finish', esc(q.exit), 'i-seal')}
    </div>
    <h3 style="margin-top:2.6em">What the award is used for</h3>
    <div class="grid grid--2">
${card('At work', 'What a holder can do professionally', esc(q.work), 'i-ledger')}
${card('In study', 'Where it is accepted academically', esc(q.study), 'i-mortarboard')}
    </div>
    <div class="callout">
      <span class="callout__label">If you stop at Level ${esc(lv.roman)}</span>
      <p>${esc(q.stopping)} The College recommends the full pathway to anyone whose purpose needs
        it, and recommends stopping to anyone whose purpose does not. A provider that treats every
        exit as a failure is selling levels rather than teaching English.</p>
    </div>
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
      <span class="callout__label">How this award is moderated</span>
      <p>Every award at this level is set, marked and second-marked inside the College, against
        the criteria published above and before the work is attempted. That moderation is
        internal: the College has not appointed an External Examiner, the independent post that
        would confirm from outside that this level sits where the College says it sits. See
        <a href="/about/#status">About &middot; Institutional Status</a>.</p>
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
      <div class="stat-row__item"><b>${money(lv.price_usd_cents)}</b><span>This level</span></div>
    </div>
    <p class="form-note">You begin with one instalment of $791.67, not with the level fee.
      Instalments are the default arrangement and carry no charge &mdash; see
      <a href="/admissions/tuition/#ladder">the ladder</a>.</p>
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
      <p class="lede">${esc(moduleArc(lv))}</p>
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
${qualification}
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
${card('Commitment', 'Can I study this alongside a job?', `Yes, and it is designed to be. Level ${lv.roman} is ${TQT_HOURS} designed hours across ${lv.duration_months} months &mdash; about ${weeklyHours(lv)} hours a week, spent when you choose to spend them. Nothing opens on a fixed date and nothing closes if a week goes badly.`, 'i-hourglass')}
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
