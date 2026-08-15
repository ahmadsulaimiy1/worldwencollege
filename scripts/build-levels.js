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
const card = (num, title, body) => `      <div class="card">
        <span class="card__num">${esc(num)}</span>
        <h3>${esc(title)}</h3>
        <p>${body}</p>
      </div>`;

function levelPage(lv, i) {
  const prev = levels[i - 1] || null;
  const next = levels[i + 1] || null;
  const hours = lv.units;
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
      <div class="card">
        <span class="card__num">What it honours</span>
        <h3>Why this award exists</h3>
        <p>${esc(a.academic_purpose)}</p>
      </div>
      <div class="card">
        <span class="card__num">Graduate profile</span>
        <h3>What the holder can do</h3>
        <p>${esc(a.graduate_profile)}</p>
      </div>
    </div>
    <div class="callout">
      <span class="callout__label">What this award is not</span>
      <p>WEC-LC holds no accreditation, and the College has not appointed an External Examiner
        &mdash; the independent post required before any award can properly be conferred. This
        award is defined, its criteria are published, and it has been conferred on nobody. See
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
      <a href="/academics/iefc/" class="btn btn--outline">The Full IEFC Programme</a>
    </div>
  </div>
</section>

<section class="section--light section-pad" id="overview">
  <div class="container reveal">
    <div class="stat-row">
      <div class="stat-row__item"><b>${esc(lv.cefr)}</b><span>CEFR Level</span></div>
      <div class="stat-row__item"><b>${lv.modules.length}</b><span>Modules</span></div>
      <div class="stat-row__item"><b>${hours}</b><span>Taught Hours</span></div>
      <div class="stat-row__item"><b>${lv.duration_months}</b><span>Months</span></div>
      <div class="stat-row__item"><b>${money(lv.price_usd_cents)}</b><span>Tuition</span></div>
    </div>
    <div class="section-head">
      <span class="module-marker">Overview</span>
      <h2>What this level contains.</h2>
    </div>
    <div class="grid grid--3">
${card('Teaching', `${teaching} lessons`, `Each lesson runs a full sequence &mdash; warm-up, presentation, guided practice, independent practice, writing and homework &mdash; with the timing stated in the plan rather than left to the room.`)}
${card('Listening', `${listening} listening sets`, 'A scripted listening set for every module, with speaker cues and comprehension work built against the script rather than added afterwards.')}
${card('Pronunciation', `${pron} laboratories`, 'A pronunciation laboratory per module, targeting the sounds, stress patterns and rhythm the module&rsquo;s own language actually needs.')}
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
${skills.map((s) => `      <div class="card card--dark">
        <span class="card__num">${esc(s.mode === 'receptive' ? 'Receptive' : 'Productive')}</span>
        <h3>${esc(s.name)}</h3>
        <p>${esc(s.description)}</p>
      </div>`).join('\n')}
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
${card('Continuous', `${quizzes} module quizzes`, 'One at the end of each module, testing the language that module taught and nothing else. Marked automatically, with the correct answer and the reason shown.')}
${card('Productive', `${assignments} assignments`, 'Speaking and writing tasks marked by an instructor against a published rubric. These are where the productive skills are actually assessed &mdash; a quiz cannot judge whether someone can hold a conversation.')}
${card('Self-check', 'Before every assessment', 'Each lesson carries a self-check with traps aimed at the mistakes learners at this level really make, so a learner discovers a gap before an examiner does.')}
    </div>
    <div class="btn-row">
      <a href="/academics/iefc/" class="btn btn--red">Assessment &amp; Progression in Full</a>
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
${card('Speaking-first', 'Practice before polish', 'Guided speaking is built into every lesson, not offered as an extra. Learners speak from the first lesson, before their grammar is ready, because waiting for accuracy is how people stay silent for years.')}
${card('Structured', 'A shared standard, not a personal style', 'Every instructor teaches to the same mapped curriculum, so a learner who changes class or cohort does not lose their place, and two learners at the same level have covered the same ground.')}
${card('Supported', 'A teacher who knows what goes wrong', `Instructors work from the Teacher's Companion, which sets out for each lesson what commonly goes wrong, a second way to explain it, and what to do for the learner who is behind and the one who is ahead.`)}
${card('Measured', 'Adjusted to the cohort', 'Quiz and assignment results are visible to the instructor as the level runs, so teaching responds to how this group is actually performing rather than to how the plan assumed they would.')}
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
${card('Platform', 'The learning platform', 'Lessons, quizzes, self-checks and progress tracking, with your marks and feedback in one record you keep.')}
${card('Listening Lab', 'Recorded practice', 'The Listening Lab holds the level&rsquo;s recorded material with the script, and records your own speaking for pronunciation feedback.')}
${card('Press volumes', 'Printed and digital', 'The curriculum is published as a set of volumes by WEC Press &mdash; the Complete Curriculum, the Assessment Handbook, and for Level I a Student Workbook and Teacher&rsquo;s Companion.')}
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
      <div class="card card--dark">
        <span class="card__num">Before</span>
        <h3>${prev ? esc(`Level ${prev.roman} — ${prev.name}`) : 'No prior study required'}</h3>
        <p>${prev
    ? `Level ${esc(lv.roman)} assumes the language taught in ${esc(prev.name)} (${esc(prev.cefr)}). Learners who have not studied with the College take a placement assessment rather than being asked to self-declare.`
    : 'Foundation assumes no English. There is no entry test and no prerequisite &mdash; it is written for a learner starting from nothing.'}</p>
      </div>
      <div class="card card--dark">
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
${card('Duration', `How long does Level ${lv.roman} take?`, `${lv.duration_months} months of study, covering ${hours} taught hours across ${lv.modules.length} modules. Learners who need longer are not penalised; the level is a body of work, not a race.`)}
${card('Entry', prev ? `Do I need Level ${prev.roman} first?` : 'Do I need any English to start?', prev
    ? `Not necessarily. You need the language ${esc(prev.name)} teaches, however you acquired it. A placement assessment establishes that.`
    : 'No. Foundation assumes none, and the first lesson teaches the alphabet and how to say your own name.')}
${card('Assessment', 'What happens if I fail an assessment?', 'Assessments can be resat. The purpose is to establish what you can do, not to record a single bad afternoon &mdash; the appeals and resit procedure is published in full.')}
${card('Recognition', 'Is the award recognised?', 'The award is defined and its criteria published, but WEC-LC holds no accreditation and has appointed no External Examiner. We state this plainly rather than implying recognition the College has not obtained.')}
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
function studyPage() {
  return `<section class="section--dark section-pad">
  <div class="container">
    <span class="eyebrow">Study</span>
    <h1>Six levels, from no English to mastery.</h1>
    <p class="lede">The International English Fluency Certificate is one programme taught in
      six levels, each aligned to a CEFR band and each ending in a defined award. A learner may
      enter at the level their English actually sits at and leave at the level they need.</p>
    <div class="btn-row">
      <a href="/admissions/#apply" class="btn btn--gold">Apply Now</a>
      <a href="/academics/iefc/" class="btn btn--outline">The IEFC in Full</a>
    </div>
  </div>
</section>

<section class="section--light section-pad" id="levels">
  <div class="container reveal">
    <div class="section-head">
      <span class="module-marker">The Programme</span>
      <h2>Choose your level.</h2>
      <p class="lede">Each level is ${levels[0].duration_months} months and
        ${levels[0].units} taught hours, with ${levels[0].modules.length} modules. You do not
        need to start at Level I &mdash; a placement assessment establishes where you belong.</p>
    </div>
    <div class="table-scroll">
      <table class="ledger">
        <thead><tr>
          <th scope="col">Level</th><th scope="col">Programme</th><th scope="col">CEFR</th>
          <th scope="col">Modules</th><th scope="col">Hours</th><th scope="col">Award</th>
        </tr></thead>
        <tbody>
${levels.map((lv) => `          <tr>
            <td><a href="/study/${SLUG[lv.roman]}/"><b>${esc(lv.roman)}</b></a></td>
            <td><a href="/study/${SLUG[lv.roman]}/">${esc(lv.name)}</a></td>
            <td>${esc(lv.cefr)}</td>
            <td>${lv.modules.length}</td>
            <td>${lv.units}</td>
            <td>${lv.award ? esc(lv.award.post_nominal || lv.award.official_title) : '&mdash;'}</td>
          </tr>`).join('\n')}
        </tbody>
      </table>
    </div>
  </div>
</section>

<section class="section--paper section-pad" id="what">
  <div class="container reveal">
    <div class="section-head">
      <span class="module-marker">What Every Level Shares</span>
      <h2>The same standard at every level.</h2>
    </div>
    <div class="grid grid--3">
${card('Structure', 'A mapped curriculum', 'Every lesson states its objectives, its prerequisites and the timing of each stage. Instructors teach to a shared standard rather than a personal syllabus.')}
${card('Assessment', 'Criteria published first', 'Rubrics and pass criteria are published to the learner before the assessment, not explained afterwards.')}
${card('Skills', 'Four skills tracked separately', 'Listening, reading, speaking and writing are assessed and recorded independently, because a single grade hides where the real gap is.')}
    </div>
  </div>
</section>

<section class="section--light section-pad" id="status">
  <div class="container reveal">
    <div class="callout">
      <span class="callout__label">Institutional Status</span>
      <p>WEC-LC holds no accreditation and has appointed no External Examiner. The curriculum,
        assessments and awards described here are fully defined and published; no award has yet
        been conferred on anyone. The College states this on every page where it is relevant
        rather than in a footnote &mdash; see <a href="/about/#status">About &middot;
        Institutional Status</a>.</p>
    </div>
  </div>
</section>

<section class="section--dark cta-band">
  <div class="container reveal">
    <h2>Find the level that fits.</h2>
    <div class="btn-row u-center">
      <a href="/admissions/#apply" class="btn btn--gold">Apply Now</a>
      <a href="/contact/" class="btn btn--outline">Ask About Placement</a>
    </div>
  </div>
</section>
`;
}

// ── write sources + manifest ─────────────────────────────────────────
const MANIFEST = path.join(ROOT, 'pages/manifest.json');
const manifest = JSON.parse(fs.readFileSync(MANIFEST, 'utf8'));
const entries = Array.isArray(manifest) ? manifest : manifest.pages;
const written = [];

function upsert(entry, contentFile, body) {
  fs.writeFileSync(path.join(ROOT, 'pages', contentFile), body);
  const i = entries.findIndex((e) => e.slug === entry.slug);
  if (i >= 0) entries[i] = { ...entries[i], ...entry };
  else entries.push(entry);
  written.push(entry.output);
}

upsert({
  slug: 'study',
  output: 'study/index.html',
  title: 'Study at Worldwide English College &mdash; The Six IEFC Levels',
  description: 'The International English Fluency Certificate in six CEFR-aligned levels, from '
    + 'no English to mastery. Modules, hours, assessment and awards for every level.',
  contentFile: 'study.html',
  lang: 'en', dir: 'ltr',
}, 'study.html', studyPage());

levels.forEach((lv, i) => {
  upsert({
    slug: `study-${SLUG[lv.roman]}`,
    output: `study/${SLUG[lv.roman]}/index.html`,
    title: `Level ${lv.roman}: ${lv.name} (${lv.cefr}) &mdash; Worldwide English College`,
    description: `Level ${lv.roman} of the IEFC: ${lv.modules.length} modules, ${lv.units} `
      + `taught hours over ${lv.duration_months} months, aligned to CEFR ${lv.cefr}. Modules, `
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
