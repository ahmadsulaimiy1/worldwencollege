/**
 * The flagship edition — the curriculum itself, typeset.
 *
 * Every one of the 294 authored lessons is printed in full: objectives,
 * staged practice with timings, model dialogues set as dialogue, every
 * quiz question with its options and answer key, every assignment brief
 * with its rubric.
 *
 * The previous edition described this content. This one is it.
 */
import { buildCurriculum } from './curriculum.mjs';
import { build as buildInstitutional } from './canonical.mjs';
import { paletteFor, BRAND, STAGE_MARK, EMPHASIS_STAGES, ascentOrnament } from './design.mjs';
import { writeFileSync, mkdirSync, existsSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { chromium } from 'playwright';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..');
const C = buildCurriculum();
const I = buildInstitutional();

const esc = (s) => String(s ?? '')
  .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
// The source uses `--` for an em dash and straight quotes; a flagship
// edition sets real dashes and real quotation marks. Applied at render
// time so the database keeps its plain text.
const typo = (s) => esc(s)
  .replace(/\s--\s/g, ' — ').replace(/--/g, '—')
  .replace(/(\w)'(\w)/g, '$1’$2')
  .replace(/"([^"]+)"/g, '“$1”');

const ROMAN = ['I', 'II', 'III', 'IV', 'V', 'VI'];
const KIND_LABEL = { reading: 'Lesson', quiz: 'Assessed Quiz', assignment: 'Assessed Assignment' };

// ---- Lesson stages ---------------------------------------------------
function renderParts(parts) {
  const out = [];
  let dialogue = [];
  let items = [];
  const flushD = () => {
    if (!dialogue.length) return;
    out.push(`<div class="dialogue">${dialogue.map((p) =>
      `<p><span class="sp">${esc(p.speaker)}</span>${typo(p.text)}</p>`).join('')}</div>`);
    dialogue = [];
  };
  const flushI = () => {
    if (!items.length) return;
    out.push(`<ol class="items">${items.map((p) =>
      `<li><span class="mk">${esc(p.marker)}</span>${typo(p.text)}</li>`).join('')}</ol>`);
    items = [];
  };
  for (const p of parts) {
    if (p.type === 'dialogue') { flushI(); dialogue.push(p); }
    else if (p.type === 'item') { flushD(); items.push(p); }
    else { flushD(); flushI(); out.push(`<p>${typo(p.text)}</p>`); }
  }
  flushD(); flushI();
  return out.join('');
}

function renderStage(s) {
  if (!s.head) return `<div class="stage stage--intro">${renderParts(s.parts)}</div>`;
  const mark = s.icon ? STAGE_MARK[s.icon] : '·';
  const emph = s.icon && EMPHASIS_STAGES.has(s.icon) ? ' stage--emph' : '';
  return `<section class="stage${emph}">
    <h5 class="stage__h"><span class="stage__mk">${mark}</span>${typo(s.head)}${
  s.timing ? `<span class="stage__t">${typo(s.timing)}</span>` : ''}</h5>
    <div class="stage__b">${renderParts(s.parts)}</div>
  </section>`;
}

function renderQuiz(les) {
  const qs = les.questions.map((q) => `<li class="q">
    <p class="q__p">${typo(q.prompt)}</p>
    <ol class="q__c">${q.choices.map((c, i) =>
    `<li${i === q.correctIndex ? ' class="is-key"' : ''}>${typo(c)}</li>`).join('')}</ol>
  </li>`).join('');
  const key = les.questions.map((q) =>
    `<span><b>${q.sequence}</b>${String.fromCharCode(65 + q.correctIndex)}</span>`).join('');
  return `<ol class="quiz">${qs}</ol>
    <div class="answerkey"><p class="answerkey__h">Answer key</p><div class="answerkey__g">${key}</div></div>`;
}

function renderLesson(les, lv, mod) {
  const kind = KIND_LABEL[les.kind] || 'Lesson';
  const body = les.kind === 'quiz'
    ? (les.stages.length ? les.stages.map(renderStage).join('') : '') + renderQuiz(les)
    : les.stages.map(renderStage).join('');
  return `<article class="lesson" id="l-${lv.roman}-${mod.sequence}-${les.sequence}">
    <header class="lesson__h">
      <p class="lesson__k">${esc(kind)} ${lv.roman}.${mod.sequence}.${les.sequence}</p>
      <h4>${typo(les.title)}</h4>
    </header>
    ${body}
  </article>`;
}

function renderModule(mod, lv) {
  const lessons = mod.lessons.map((l) => renderLesson(l, lv, mod)).join('');
  const counts = mod.lessons.reduce((a, l) => { a[l.kind] = (a[l.kind] || 0) + 1; return a; }, {});
  return `<section class="module" id="m-${lv.roman}-${mod.sequence}">
    <header class="module__h">
      <div class="module__n"><span>Module</span><b>${mod.sequence}</b></div>
      <div class="module__t">
        <h3>${typo(mod.title)}</h3>
        <p class="module__m">Level ${lv.roman} · ${esc(lv.name)} · CEFR ${esc(lv.cefr)} —
          ${mod.lessons.length} items: ${counts.reading || 0} teaching, ${counts.quiz || 0} assessed quiz,
          ${counts.assignment || 0} assessed assignment</p>
      </div>
    </header>
    ${lessons}
  </section>`;
}

function renderLevel(lv) {
  const p = paletteFor(lv.roman);
  const modules = lv.modules.map((m) => renderModule(m, lv)).join('');
  const n = lv.modules.reduce((a, m) => a + m.lessons.length, 0);
  return `<div class="level" data-level="${lv.roman}" style="--ink:${p.ink};--mid:${p.mid};--wash:${p.wash};--edge:${p.edge}">
  <section class="opener" id="lvl-${lv.roman}">
    <div class="opener__rule"></div>
    <p class="opener__eyebrow">The Ascent · Stage ${ROMAN.indexOf(lv.roman) + 1} of 6</p>
    <p class="opener__num">${lv.roman}</p>
    <h2 class="opener__t">${typo(lv.name)}</h2>
    <p class="opener__cefr">CEFR ${esc(lv.cefr)}</p>
    <div class="opener__orn">${ascentOrnament(lv.roman, p)}</div>
    <p class="opener__award">${typo(lv.awardTitle || '')}</p>
    <p class="opener__pn">${esc(lv.postNominal || '')}</p>
    <p class="opener__st">${typo(lv.standing || '')}</p>
    <div class="opener__stats">
      <div><b>${lv.modules.length}</b><span>Modules</span></div>
      <div><b>${n}</b><span>Items</span></div>
      <div><b>${lv.months}</b><span>Months</span></div>
    </div>
  </section>
  <section class="lvintro">
    <p class="drop">${typo(lv.graduateProfile || '')}</p>
    <div class="lvintro__why">
      <p class="label">Why this word</p>
      <p>${typo(lv.purpose || '')}</p>
    </div>
  </section>
  ${modules}
  </div>`;
}

// ---- Front matter ----------------------------------------------------
const claimRows = I.claims.map((c) => {
  const w = { evidenced: 'Evidenced', partial: 'Partial', not_evidenced: 'Not evidenced' }[c.state];
  const t = { evidenced: 'ok', partial: 'warn', not_evidenced: 'gap' }[c.state];
  return `<tr><td>${typo(c.claim)}</td><td class="s-${t}">${w}</td></tr>`;
}).join('');

const contents = C.levels.map((lv) => {
  const p = paletteFor(lv.roman);
  return `<li style="--mid:${p.mid}"><a href="#lvl-${lv.roman}">
    <span class="c__n">${lv.roman}</span>
    <span class="c__t">${typo(lv.name)}<em>${esc(lv.cefr)} · ${lv.modules.length} modules ·
      ${lv.modules.reduce((a, m) => a + m.lessons.length, 0)} items</em></span></a>
    <ol class="c__mods">${lv.modules.map((m) =>
    `<li>${m.sequence}. ${typo(m.title)}</li>`).join('')}</ol></li>`;
}).join('');

const FRONT = `
<section class="half"><p>The International English Fluency Certificate</p></section>

<section class="titlepage">
  <p class="tp__inst">Worldwide English College</p>
  <p class="tp__camp">London Campus</p>
  <h1 class="tp__t"><span>The International</span><span>English Fluency</span><span>Certificate</span></h1>
  <div class="tp__rule"></div>
  <p class="tp__sub">The Complete Curriculum</p>
  <p class="tp__vol">Six Levels · ${C.totals.modules} Modules · ${C.totals.lessons} Items ·
    ${C.totals.questions} Assessment Questions</p>
  <p class="tp__ed">First Edition</p>
  <p class="tp__press">Worldwide English College Press</p>
</section>

<section class="imprint">
  <h2>Publication Information</h2>
  <p><b>The International English Fluency Certificate: The Complete Curriculum</b></p>
  <p>First edition. Published by Worldwide English College Press, London Campus.</p>
  <p>© Worldwide English College. All rights reserved.</p>
  <p class="small">ISBN [to be assigned] · DOI [not registered]</p>
  <div class="panel">
    <p class="panel__h">A note on this edition</p>
    <p>This volume prints the curriculum itself — every authored lesson, every assessment question
      with its answer key, and every assignment brief with its rubric — set from the College's
      academic database. A teacher can teach from these pages without the platform.</p>
    <p>The College is not an accredited institution and this publication makes no claim of
      accreditation, recognition, or external approval.</p>
  </div>
</section>

<section class="editorial">
  <h2>Editorial Note</h2>
  <p class="lead">This is the curriculum, not a description of it. Every lesson the College has
    authored is printed here in full and verbatim.</p>
  <p>Three things a reader should know before the first level, stated here rather than left to be
    inferred.</p>

  <p class="label">One — What this volume contains, counted</p>
  <p>${C.totals.lessons} authored items across ${C.totals.modules} modules and six levels:
    teaching lessons with staged practice and timings, ${C.totals.questions} assessment questions
    with their answer keys, and sixty assignment briefs with their grading rubrics —
    ${C.totals.bodyWords.toLocaleString('en-GB')} words of lesson content. Every figure is counted
    from the database at the moment of generation.</p>

  <p class="label">Two — What it does not contain</p>
  <p>The College's public materials state ${I.totals.publishedUnitsPerLevel} learning units per
    level, which would be ${I.totals.publishedUnitsTotal} across the qualification. That figure is
    not met: the module architecture is complete at ${C.totals.modules} modules, ten at every level,
    each with an assessed quiz and an assessed assignment, but lesson-level depth within those
    modules is still being authored. This volume prints what exists and does not pad it. A reader
    counting the lessons will find ${C.totals.lessons}, and that is the true number.</p>

  <p class="label">Three — No invented voices</p>
  <p>A publication of this kind conventionally opens with a Foreword and a Presidential Message.
    The College has no appointed President, and its Academic Senate and Board of Academic Standards
    and Curriculum Excellence are established but not constituted. Writing those pages would mean
    composing the words of officers who do not exist, so they are absent.</p>

  <h3>What the qualification claims, and what supports it</h3>
  <table class="claims"><thead><tr><th>Element of the definition</th><th>Position</th></tr></thead>
    <tbody>${claimRows}</tbody></table>
  <p class="small">Derived from the academic database, not asserted. The full evidence for each
    element is recorded in the College's governance ledger.</p>
</section>

<section class="contents">
  <h2>Contents</h2>
  <ol class="clist">${contents}</ol>
</section>

<section class="howto">
  <h2>How to Read a Lesson</h2>
  <p class="lead">Every teaching lesson follows one house structure, so a teacher moving between
    levels never has to relearn the page.</p>
  <div class="legend">
    ${[['objectives', 'Learning objectives', 'What the learner can do by the end. Always first.'],
    ['prereq', 'Prerequisite knowledge', 'What must already be secure.'],
    ['warmup', 'Warm-up', 'Activation, usually five minutes.'],
    ['present', 'Presentation', 'The new language, modelled — often as a dialogue.'],
    ['guided', 'Guided practice', 'Supported use, with the teacher shaping.'],
    ['independent', 'Independent practice', 'Unsupported use.'],
    ['speaking', 'Speaking activity', 'Production in real time.'],
    ['listening', 'Listening activity', 'Reception at natural pace.'],
    ['reading', 'Reading activity', 'Reception for argument and detail.'],
    ['writing', 'Writing task', 'Production to a purpose and an audience.'],
    ['pronunciation', 'Pronunciation practice', 'Form, stress and intelligibility.'],
    ['vocabulary', 'Vocabulary', 'Key items, phrases and collocations.'],
    ['assess', 'Formative assessment', 'The check that tells the teacher whether to move on.'],
    ['thinking', 'Critical thinking', 'A prompt that has no single right answer.'],
    ['homework', 'Homework', 'Consolidation between sessions.'],
    ['extension', 'Extension', 'For learners who finish early or want further.'],
    ['revision', 'Revision', 'Deliberate return to earlier material.']]
    .map(([k, n, d]) => `<div class="legend__i"><span class="legend__m">${STAGE_MARK[k]}</span>
      <div><b>${n}</b><p>${d}</p></div></div>`).join('')}
  </div>
  <p>A timing in brackets after a stage heading is the designed duration for that stage. Stages
    without a timing are not time-boxed. Model dialogue is set apart from instruction so that a
    teacher can find it at a glance, and an assessed quiz prints its answer key immediately
    beneath it — this is a teacher's edition.</p>
</section>`;

// ---- The stylesheet --------------------------------------------------
const CSS = `
@page { size: A4; margin: 20mm 20mm 18mm; }
@page :first { margin: 0; }
:root { --ink:${BRAND.ink}; --mid:${BRAND.gold}; --wash:#F4F6FA; --edge:${BRAND.ink};
  --gold:${BRAND.gold}; --soft:${BRAND.soft}; --rule:${BRAND.rule}; }
* { box-sizing: border-box; }
body { margin:0; color:#1A1A1A; background:#fff;
  font-family: Cambria, "Nimbus Roman", Georgia, serif; font-size:9.6pt; line-height:1.58;
  -webkit-print-color-adjust:exact; print-color-adjust:exact; }
.sans { font-family: Calibri, "Nimbus Sans", Arial, sans-serif; }
p { margin:0 0 5.5pt; orphans:3; widows:3; }
h2,h3,h4,h5 { color:var(--ink); break-after:avoid; }
.label { font-family:Calibri,"Nimbus Sans",Arial,sans-serif; font-size:7pt; font-weight:700;
  letter-spacing:.14em; text-transform:uppercase; color:var(--gold); margin:12pt 0 3pt; }
.small { font-size:7.6pt; color:var(--soft); font-family:Calibri,"Nimbus Sans",Arial,sans-serif; }
.lead { font-size:11pt; line-height:1.55; color:var(--ink); }

/* ---------- Front matter ---------- */
.half { height:297mm; display:flex; align-items:center; justify-content:center; break-after:page; }
.half p { font-family:Calibri,"Nimbus Sans",Arial,sans-serif; font-size:10pt; font-weight:700;
  letter-spacing:.34em; text-transform:uppercase; color:var(--ink); text-align:center;
  max-width:16em; line-height:2.4; }
.titlepage { height:297mm; display:flex; flex-direction:column; justify-content:center;
  align-items:center; text-align:center; break-after:page; background:${BRAND.cream};
  border-bottom:14mm solid ${BRAND.ink}; padding:0 24mm 14mm; }
.tp__inst { font-family:Calibri,"Nimbus Sans",Arial,sans-serif; font-size:8.5pt; font-weight:700;
  letter-spacing:.36em; text-transform:uppercase; color:var(--gold); margin:0 0 2pt; }
.tp__camp { font-style:italic; color:var(--soft); font-size:9pt; margin:0 0 40pt; }
.tp__t { margin:0; font-size:36pt; line-height:1.1; letter-spacing:-.02em; color:${BRAND.ink}; font-weight:700; }
.tp__t span { display:block; }
.tp__rule { width:34%; height:1.2pt; background:var(--gold); margin:16pt auto 14pt; }
.tp__sub { font-style:italic; font-size:14pt; color:${BRAND.ink}; margin:0 0 6pt; }
.tp__vol { font-family:Calibri,"Nimbus Sans",Arial,sans-serif; font-size:8pt; color:var(--soft);
  letter-spacing:.06em; margin:0 0 54pt; }
.tp__ed { font-family:Calibri,"Nimbus Sans",Arial,sans-serif; font-size:8pt; font-weight:700;
  letter-spacing:.24em; text-transform:uppercase; color:${BRAND.ink}; margin:0 0 30pt; }
.tp__press { font-family:Calibri,"Nimbus Sans",Arial,sans-serif; font-size:7pt;
  letter-spacing:.2em; text-transform:uppercase; color:var(--soft); margin:0; }

.imprint, .editorial, .contents, .howto { break-before:page; }
.imprint h2, .editorial h2, .contents h2, .howto h2 {
  font-size:19pt; margin:0 0 4pt; letter-spacing:-.01em; }
.imprint h2::after, .editorial h2::after, .contents h2::after, .howto h2::after {
  content:''; display:block; width:100%; height:.8pt; background:var(--rule); margin:6pt 0 12pt; }
.editorial h3 { font-size:12pt; margin:18pt 0 6pt; }

.panel { border-left:2.4pt solid var(--gold); background:#FBF6EA; padding:9pt 12pt; margin:12pt 0; break-inside:avoid; }
.panel__h { font-family:Calibri,"Nimbus Sans",Arial,sans-serif; font-size:7pt; font-weight:700;
  letter-spacing:.12em; text-transform:uppercase; color:#8A6B2E; margin:0 0 4pt; }
.panel p { font-size:9pt; line-height:1.5; margin:0 0 4pt; }
.panel p:last-child { margin:0; }

table.claims { width:100%; border-collapse:collapse; font-family:Calibri,"Nimbus Sans",Arial,sans-serif;
  font-size:8.5pt; margin:8pt 0; }
table.claims th { background:${BRAND.ink}; color:#fff; text-align:left; padding:5pt 7pt;
  font-size:7pt; letter-spacing:.08em; text-transform:uppercase; }
table.claims td { padding:5pt 7pt; border-bottom:.5pt solid #E4E8EF; }
.s-ok { color:#1E6B3A; font-weight:700; } .s-warn { color:#8A6B2E; font-weight:700; }
.s-gap { color:#8C1F2F; font-weight:700; }

.clist { list-style:none; margin:0; padding:0; }
.clist > li { margin:0 0 11pt; padding:0 0 9pt; border-bottom:.5pt solid var(--rule); break-inside:avoid; }
.clist a { text-decoration:none; display:flex; align-items:baseline; gap:10pt; }
.c__n { font-size:17pt; font-weight:700; color:var(--mid); min-width:2.4em; }
.c__t { font-size:12pt; color:${BRAND.ink}; }
.c__t em { display:block; font-style:normal; font-family:Calibri,"Nimbus Sans",Arial,sans-serif;
  font-size:7.5pt; color:var(--soft); letter-spacing:.04em; margin-top:1pt; }
.c__mods { margin:5pt 0 0 3.4em; padding:0; list-style:none; columns:2; column-gap:14pt;
  font-size:8pt; color:var(--soft); font-family:Calibri,"Nimbus Sans",Arial,sans-serif; }
.c__mods li { margin:0 0 2pt; break-inside:avoid; }

.legend { columns:2; column-gap:16pt; margin:10pt 0 12pt; }
.legend__i { display:flex; gap:7pt; break-inside:avoid; margin:0 0 7pt; }
.legend__m { font-size:10pt; color:var(--gold); line-height:1.2; min-width:1.2em; text-align:center; }
.legend__i b { font-family:Calibri,"Nimbus Sans",Arial,sans-serif; font-size:8.5pt; color:${BRAND.ink}; }
.legend__i p { font-size:8pt; color:var(--soft); margin:0; line-height:1.4; }

/* ---------- Level opener ---------- */
.opener { break-before:page; height:250mm; display:flex; flex-direction:column;
  justify-content:center; position:relative; padding-left:6mm; }
.opener__rule { position:absolute; left:0; top:0; bottom:0; width:3.4mm; background:var(--mid); }
.opener__eyebrow { font-family:Calibri,"Nimbus Sans",Arial,sans-serif; font-size:7.5pt; font-weight:700;
  letter-spacing:.2em; text-transform:uppercase; color:var(--mid); margin:0 0 6pt; }
.opener__num { font-size:104pt; line-height:.9; font-weight:700; color:var(--ink); margin:0 0 2pt;
  letter-spacing:-.03em; }
.opener__t { font-size:30pt; line-height:1.08; margin:0 0 4pt; color:var(--ink); font-weight:700; }
.opener__cefr { font-family:Calibri,"Nimbus Sans",Arial,sans-serif; font-size:9pt; font-weight:700;
  letter-spacing:.18em; text-transform:uppercase; color:var(--mid); margin:0 0 18pt; }
.opener__orn { margin:0 0 20pt; }
.opener__award { font-size:13pt; font-style:italic; color:var(--ink); margin:0 0 2pt; }
.opener__pn { font-family:Calibri,"Nimbus Sans",Arial,sans-serif; font-size:10pt; font-weight:700;
  letter-spacing:.1em; color:var(--mid); margin:0 0 6pt; }
.opener__st { font-size:10pt; color:var(--soft); max-width:26em; margin:0 0 24pt; }
.opener__stats { display:flex; gap:24pt; border-top:.8pt solid var(--rule); padding-top:10pt; max-width:30em; }
.opener__stats div { text-align:left; }
.opener__stats b { display:block; font-size:20pt; color:var(--ink); line-height:1.1; }
.opener__stats span { font-family:Calibri,"Nimbus Sans",Arial,sans-serif; font-size:7pt;
  letter-spacing:.14em; text-transform:uppercase; color:var(--soft); }

.lvintro { break-before:page; }
.drop::first-letter { float:left; font-size:40pt; line-height:.84; font-weight:700;
  color:var(--mid); padding:2pt 6pt 0 0; }
.lvintro { font-size:10.4pt; line-height:1.6; }
.lvintro__why { margin-top:12pt; border-left:2.2pt solid var(--mid); background:var(--wash);
  padding:9pt 12pt; break-inside:avoid; }
.lvintro__why p:last-child { margin:0; font-size:9.4pt; }

/* ---------- Module ---------- */
.module { break-before:page; }
.module__h { display:flex; gap:12pt; align-items:flex-start; border-bottom:1.6pt solid var(--mid);
  padding-bottom:8pt; margin-bottom:12pt; break-after:avoid; }
.module__n { background:var(--ink); color:#fff; padding:6pt 9pt 7pt; text-align:center; min-width:15mm; }
.module__n span { display:block; font-family:Calibri,"Nimbus Sans",Arial,sans-serif; font-size:6pt;
  letter-spacing:.16em; text-transform:uppercase; opacity:.8; }
.module__n b { display:block; font-size:19pt; line-height:1.05; }
.module__t h3 { font-size:16pt; margin:0 0 2pt; line-height:1.2; }
.module__m { font-family:Calibri,"Nimbus Sans",Arial,sans-serif; font-size:7.5pt; color:var(--soft);
  margin:0; letter-spacing:.02em; }

/* ---------- Lesson ---------- */
.lesson { break-inside:auto; margin:0 0 16pt; padding:0 0 12pt; border-bottom:.5pt solid var(--rule); }
.lesson:last-child { border-bottom:0; }
.lesson__h { break-after:avoid; margin:0 0 7pt; }
.lesson__k { font-family:Calibri,"Nimbus Sans",Arial,sans-serif; font-size:6.6pt; font-weight:700;
  letter-spacing:.16em; text-transform:uppercase; color:var(--mid); margin:0 0 1pt; }
.lesson__h h4 { font-size:12.5pt; margin:0; line-height:1.25; }

.stage { margin:0 0 7pt; break-inside:avoid; }
.stage--intro { font-size:9.6pt; }
.stage__h { font-family:Calibri,"Nimbus Sans",Arial,sans-serif; font-size:7.4pt; font-weight:700;
  letter-spacing:.1em; text-transform:uppercase; color:var(--ink); margin:0 0 2.5pt;
  display:flex; align-items:baseline; gap:5pt; }
.stage__mk { color:var(--mid); font-size:8.5pt; min-width:1em; }
.stage__t { font-weight:400; letter-spacing:.04em; text-transform:none; color:var(--soft);
  font-size:7pt; font-style:italic; }
.stage__b p { margin:0 0 4pt; }
.stage--emph { background:var(--wash); border-left:2pt solid var(--mid); padding:7pt 10pt 5pt; }
.stage--emph .stage__h { color:var(--ink); }

.dialogue { border-left:1.4pt solid var(--mid); padding:4pt 0 4pt 9pt; margin:4pt 0 6pt; break-inside:avoid; }
.dialogue p { margin:0 0 2pt; font-size:9.6pt; }
.dialogue .sp { font-family:Calibri,"Nimbus Sans",Arial,sans-serif; font-weight:700; font-size:7.4pt;
  color:var(--mid); letter-spacing:.08em; display:inline-block; min-width:2.1em; }

ol.items { margin:3pt 0 5pt; padding:0; list-style:none; }
ol.items li { margin:0 0 2.5pt; padding-left:14pt; text-indent:-14pt; }
ol.items .mk { color:var(--mid); font-weight:700; display:inline-block; min-width:11pt;
  font-family:Calibri,"Nimbus Sans",Arial,sans-serif; font-size:8pt; text-indent:0; }

/* ---------- Quiz ---------- */
ol.quiz { margin:6pt 0 8pt; padding:0; counter-reset:q; list-style:none; }
ol.quiz > li { counter-increment:q; margin:0 0 7pt; break-inside:avoid; padding-left:16pt; position:relative; }
ol.quiz > li::before { content:counter(q); position:absolute; left:0; top:0;
  font-family:Calibri,"Nimbus Sans",Arial,sans-serif; font-size:8pt; font-weight:700; color:var(--mid); }
.q__p { margin:0 0 3pt; font-size:9.6pt; }
ol.q__c { margin:0; padding:0; list-style:none; counter-reset:c;
  font-family:Calibri,"Nimbus Sans",Arial,sans-serif; font-size:8.6pt; }
ol.q__c li { counter-increment:c; margin:0 0 1.5pt; padding-left:15pt; position:relative; color:#333; }
ol.q__c li::before { content:counter(c, upper-alpha); position:absolute; left:0;
  color:var(--soft); font-weight:700; font-size:7.6pt; }
ol.q__c li.is-key { color:var(--ink); font-weight:700; }
ol.q__c li.is-key::before { color:var(--mid); }
.answerkey { background:var(--wash); border-left:2pt solid var(--mid); padding:6pt 10pt; break-inside:avoid; }
.answerkey__h { font-family:Calibri,"Nimbus Sans",Arial,sans-serif; font-size:6.8pt; font-weight:700;
  letter-spacing:.14em; text-transform:uppercase; color:var(--ink); margin:0 0 3pt; }
.answerkey__g { display:flex; flex-wrap:wrap; gap:4pt 10pt;
  font-family:Calibri,"Nimbus Sans",Arial,sans-serif; font-size:8.4pt; }
.answerkey__g span { color:var(--ink); }
.answerkey__g b { color:var(--soft); font-weight:400; margin-right:2.5pt; font-size:7.4pt; }
`;

const html = `<!doctype html><html lang="en"><head><meta charset="utf-8">
<title>The International English Fluency Certificate — The Complete Curriculum</title>
<meta name="author" content="Worldwide English College">
<meta name="subject" content="English language curriculum; complete teaching programme">
<meta name="keywords" content="IEFC, Worldwide English College, CEFR, English curriculum, lesson plans">
<style>${CSS}</style></head><body>
${FRONT}
${C.levels.map(renderLevel).join('\n')}
</body></html>`;

mkdirSync(path.join(ROOT, 'publication'), { recursive: true });
writeFileSync(path.join(ROOT, 'publication', '.flagship.html'), html);

const exe = process.env.PW_CHROMIUM || '/opt/pw-browsers/chromium-1194/chrome-linux/chrome';
const browser = await chromium.launch(existsSync(exe) ? { executablePath: exe } : {});
const page = await browser.newPage();
await page.setContent(html, { waitUntil: 'load' });
const out = path.join(ROOT, 'publication', 'IEFC Complete Curriculum.pdf');
await page.pdf({
  path: out, format: 'A4', printBackground: true, preferCSSPageSize: true,
  displayHeaderFooter: true,
  headerTemplate: '<div style="font:400 6pt Calibri,Arial,sans-serif;color:#9AA0AE;width:100%;'
    + 'padding:0 20mm;text-align:right;letter-spacing:.1em;text-transform:uppercase;">'
    + 'The International English Fluency Certificate · The Complete Curriculum</div>',
  footerTemplate: '<div style="font:400 7.5pt Calibri,Arial,sans-serif;color:#6B7280;width:100%;'
    + 'padding:0 20mm;text-align:center;"><span class="pageNumber"></span></div>',
  margin: { top: '17mm', bottom: '15mm', left: '20mm', right: '20mm' },
  tagged: true, outline: true,
});
await browser.close();
console.log(`FLAGSHIP  ${out}`);
console.log(`  ${C.totals.lessons} items · ${C.totals.modules} modules · ${C.totals.questions} questions · `
  + `${C.totals.bodyWords.toLocaleString('en-GB')} words of lesson content`);
