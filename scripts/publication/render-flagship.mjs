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
import { paletteFor, BRAND, TYPE, C as PAL, STAGE_MARK, EMPHASIS_STAGES, ascentOrnament } from './design.mjs';
import { publicationIdentity } from './identity.mjs';
import { frontMatter, backMatter, coverSpread, spineWidth, TRIM, BLEED } from './covers.mjs';
import { guillocheRosette, guillocheBand, girihRosette, frame, cornerFan, fleuron, crest, EMBOSS } from './ornament.mjs';
import { writeFileSync, readFileSync, mkdirSync, existsSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { chromium } from 'playwright';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..');
const C = buildCurriculum();
const I = buildInstitutional();
const ID = publicationIdentity(C, { edition: 1, revision: 0, impression: 1 });

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
  const q = lv.modules.reduce((a, m) => a + m.lessons.reduce((b, x) => b + x.questions.length, 0), 0);
  return `<div class="level" data-level="${lv.roman}" style="--ink:${p.ink};--mid:${p.mid};--wash:${p.wash};--edge:${p.edge}">
  <section class="opener" id="lvl-${lv.roman}">
    <div class="opener__field">${girihRosette({ size: 420, stroke: p.mid, width: 0.5, opacity: 0.075 })}</div>
    <div class="opener__frame">${frame({ w: 420, h: 560, colour: p.mid, inset: 12, corner: 26, thick: 1.1, thin: 0.35 })}</div>
    <span class="opener__fan opener__fan--tl">${cornerFan({ size: 30, colour: p.mid, opacity: 0.55 })}</span>
    <span class="opener__fan opener__fan--br">${cornerFan({ size: 30, colour: p.mid, opacity: 0.55 })}</span>
    <div class="opener__in">
      <div class="opener__crest">${crest({ size: 46, gold: p.mid, ink: 'none', mono: true })}</div>
      <p class="opener__eyebrow">The Ascent · Stage ${ROMAN.indexOf(lv.roman) + 1} of 6</p>
      <div class="opener__ros">${guillocheRosette({ size: 190, stroke: p.mid, width: 0.3, opacity: 0.5, rings: 4, seed: ROMAN.indexOf(lv.roman) })}</div>
      <p class="opener__num" style="${EMBOSS.blind}">${lv.roman}</p>
      <h2 class="opener__t">${typo(lv.name)}</h2>
      <p class="opener__cefr">CEFR ${esc(lv.cefr)}</p>
      <div class="opener__orn">${ascentOrnament(lv.roman, p)}</div>
      <div class="opener__awardbox">
        <p class="opener__awardh">The award conferred at this level</p>
        <p class="opener__award">${typo(lv.awardTitle || '')}</p>
        <p class="opener__pn">${esc(lv.postNominal || '')}</p>
        <p class="opener__st">${typo(lv.standing || '')}</p>
      </div>
      <div class="opener__stats">
        <div><b>${lv.modules.length}</b><span>Modules</span></div>
        <div><b>${n}</b><span>Items</span></div>
        <div><b>${q}</b><span>Questions</span></div>
        <div><b>${lv.months}</b><span>Months</span></div>
      </div>
      <div class="opener__band">${guillocheBand({ width: 420, height: 13, stroke: p.mid, opacity: 0.42 })}</div>
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

const CLAIMS = `<table class="claims">
  <thead><tr><th>Element of the definition</th><th>Position</th></tr></thead>
  <tbody>${claimRows}</tbody></table>`;

const CONTENTS = `<section class="contents">
  <p class="ed__eyebrow">Contents</p>
  <h2>The Programme</h2>
  <ol class="clist">${contents}</ol>
  <div class="clist__after">
    <p class="label">Apparatus</p>
    <p>How to Read a Lesson · Register of Omissions · Colophon</p>
  </div>
</section>`;

const HOWTO = `<section class="howto">
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

const FRONT = frontMatter(ID, I, CLAIMS, CONTENTS, HOWTO);
const BACK = backMatter(ID);

// ---- The stylesheet --------------------------------------------------
const CSS = `
@page { size: A4; margin: 20mm 20mm 18mm; }
@page :first { margin: 0; }
:root { --ink:${BRAND.ink}; --mid:${BRAND.gold}; --wash:#F4F6FA; --edge:${BRAND.ink};
  --gold:${BRAND.gold}; --soft:${BRAND.soft}; --rule:${BRAND.rule};
  --navy:${PAL.midnightNavy}; --imperial:${PAL.imperialBlue}; --champagne:${PAL.champagneGold};
  --bronze:${PAL.bronze}; --crimson:${PAL.deepCrimson}; --ivory:${PAL.ivory};
  --cream:${PAL.softCream}; --platinum:${PAL.platinum}; --body:${PAL.warmCharcoal};
  --serif:${TYPE.serif}; --sans:${TYPE.sans}; }
* { box-sizing: border-box; }
body { margin:0; color:var(--body); background:${PAL.pearlWhite};
  font-family: var(--serif); font-size:9.6pt; line-height:1.58;
  -webkit-print-color-adjust:exact; print-color-adjust:exact; }
.sans { font-family: var(--sans); }
p { margin:0 0 5.5pt; orphans:3; widows:3; }
h2,h3,h4,h5 { color:var(--ink); break-after:avoid; }
.label { font-family:Calibri,"Nimbus Sans",Arial,sans-serif; font-size:7pt; font-weight:700;
  letter-spacing:.14em; text-transform:uppercase; color:var(--bronze); margin:12pt 0 3pt; }
.small { font-size:7.6pt; color:var(--soft); font-family:Calibri,"Nimbus Sans",Arial,sans-serif; }
.lead { font-size:11pt; line-height:1.55; color:var(--ink); }

/* ---------- Front matter ---------- */
/* Every full-bleed leaf is built the same way: a 297mm flex column with
   its ornament layers absolutely placed behind the type. Doing it once
   here is why the endpaper, the frontispiece and the title page share a
   register instead of each drifting to its own. */
.endpaper, .half, .frontis, .titlepage, .dedication { height:297mm; break-after:page;
  position:relative; display:flex; flex-direction:column; align-items:center;
  justify-content:center; text-align:center; overflow:hidden; }
.endpaper { background:var(--ivory); }
.endpaper__field { position:absolute; inset:0; }
.endpaper__mark { position:relative; }

.half { background:${PAL.pearlWhite}; }
.half__t { font-family:var(--serif); font-size:15pt; font-weight:700; letter-spacing:.06em;
  color:var(--ink); margin:14pt 0 6pt; line-height:1.7; }
.half__s { font-family:var(--sans); font-size:8pt; letter-spacing:.3em; text-transform:uppercase;
  color:var(--soft); margin:0 0 14pt; }
.half__orn { opacity:.9; }

.frontis { background:var(--ivory); justify-content:flex-start; padding:26mm 22mm 20mm; }
.frontis__plate { position:relative; width:100%; flex:1; background:var(--navy);
  display:flex; flex-direction:column; align-items:center; justify-content:center;
  padding:16mm 12mm; overflow:hidden; }
.frontis__field { position:absolute; inset:0; }
.frontis__ros { position:absolute; top:50%; left:50%; transform:translate(-50%,-58%); }
.frontis__crest { position:relative; margin:0 0 14pt; }
.frontis__ladder { position:relative; width:100%; max-width:66mm; }
.frontis__rung { display:flex; align-items:center; gap:7pt; margin:0 0 6pt; }
.frontis__r { font-family:var(--serif); font-size:9.5pt; font-weight:700; color:var(--champagne);
  min-width:2.2em; text-align:right; }
.frontis__n { font-family:var(--sans); font-size:6.6pt; letter-spacing:.14em; text-transform:uppercase;
  color:#C9CEDA; min-width:11em; text-align:left; }
.frontis__rung i { height:2.6pt; background:var(--champagne); opacity:.85; display:block; }
.frontis__cap { font-size:8pt; color:var(--soft); font-style:italic; margin:9pt 0 0;
  max-width:34em; line-height:1.5; }

.titlepage { background:var(--ivory); }
.tp__frame { position:absolute; inset:14mm; }
.tp__in { position:relative; padding:0 22mm; }
.tp__crest { margin:0 0 12pt; }
.tp__inst { font-family:var(--sans); font-size:8.5pt; font-weight:700;
  letter-spacing:.36em; text-transform:uppercase; color:var(--bronze); margin:0 0 2pt; }
.tp__camp { font-style:italic; color:var(--soft); font-size:9pt; margin:0; }
.tp__hair { width:22%; height:.5pt; background:var(--rule); margin:14pt auto 20pt; }
.tp__the { font-style:italic; font-size:15pt; color:var(--bronze); margin:0 0 2pt; }
.tp__t { margin:0; font-size:32pt; line-height:1.14; letter-spacing:-.015em;
  color:var(--ink); font-weight:700; ${EMBOSS.blind} }
.tp__t span { display:block; }
.tp__orn { margin:14pt auto 12pt; }
.tp__sub { font-style:italic; font-size:14pt; color:var(--ink); margin:0 0 7pt; }
.tp__vol { font-family:var(--sans); font-size:7.6pt; color:var(--soft);
  letter-spacing:.08em; margin:0; }
.tp__spacer { height:34pt; }
.tp__ed { font-family:var(--sans); font-size:8pt; font-weight:700;
  letter-spacing:.24em; text-transform:uppercase; color:var(--ink); margin:0 0 10pt; }
.tp__press { font-family:var(--sans); font-size:7pt;
  letter-spacing:.2em; text-transform:uppercase; color:var(--soft); margin:0 0 3pt; }
.tp__year { font-family:var(--sans); font-size:7pt; letter-spacing:.2em; color:var(--soft); margin:0; }

.dedication { background:${PAL.pearlWhite}; }
.ded__t { font-family:var(--serif); font-style:italic; font-size:12.5pt; line-height:1.9;
  color:var(--ink); max-width:24em; margin:20pt auto; }
.ded__orn { opacity:.85; }

.imprint, .editorial, .contents, .howto, .preface, .omissions, .colophon { break-before:page; }
.imprint h2, .editorial h2, .contents h2, .howto h2, .preface h2, .omissions h2, .colophon h2 {
  font-size:19pt; margin:0 0 4pt; letter-spacing:-.01em; line-height:1.2; }
.imprint h2::after, .editorial h2::after, .contents h2::after, .howto h2::after,
.preface h2::after, .omissions h2::after {
  content:''; display:block; width:100%; height:.8pt;
  background:linear-gradient(90deg,var(--gold) 0 22%,var(--rule) 22%); margin:7pt 0 13pt; }
.editorial h3 { font-size:12pt; margin:18pt 0 6pt; }
.ed__eyebrow, .pre__eyebrow { font-family:var(--sans); font-size:7pt; font-weight:700;
  letter-spacing:.26em; text-transform:uppercase; color:var(--bronze); margin:0 0 4pt; }
.imp__title { font-size:10.5pt; }

/* Identification block — set as a document of record, not as decoration. */
.idblock { border:.7pt solid var(--rule); border-top:2.2pt solid var(--ink);
  background:#FCFCFD; padding:10pt 12pt; margin:14pt 0; display:flex; gap:14pt;
  align-items:flex-start; break-inside:avoid; }
.idblock__h { font-family:var(--sans); font-size:7pt; font-weight:700; letter-spacing:.18em;
  text-transform:uppercase; color:var(--ink); margin:0 0 6pt; }
.idtable { border-collapse:collapse; font-family:var(--sans); font-size:7.4pt; flex:1; }
.idtable th { text-align:left; padding:2.6pt 10pt 2.6pt 0; color:var(--soft); font-weight:700;
  white-space:nowrap; vertical-align:top; border-bottom:.4pt solid #EDEFF3; }
.idtable td { padding:2.6pt 0; color:var(--ink); border-bottom:.4pt solid #EDEFF3;
  vertical-align:top; }
.mono { font-family:"Consolas","DejaVu Sans Mono",monospace; font-size:7.2pt; letter-spacing:.02em; }
.digest { word-break:break-all; line-height:1.35; color:var(--bronze); }
.auth { color:var(--soft); font-weight:400; font-style:italic; }
.idblock__qr { text-align:center; width:26mm; }
.idblock__qr p { font-family:var(--sans); font-size:6pt; color:var(--soft); margin:3pt 0 0;
  line-height:1.35; }
.panel--auth p { font-size:8.2pt; }

/* Preface */
.preface p { font-size:10.2pt; line-height:1.62; margin:0 0 7pt; }
.drop--pre::first-letter { float:left; font-size:36pt; line-height:.82; font-weight:700;
  color:var(--bronze); padding:3pt 6pt 0 0; }
.pre__sign { font-family:var(--sans); font-size:8pt; font-weight:700; letter-spacing:.18em;
  text-transform:uppercase; color:var(--ink); margin:16pt 0 3pt; }
.pre__note { font-size:8pt; font-style:italic; color:var(--soft); border-top:.5pt solid var(--rule);
  padding-top:6pt; }

.panel { border-left:2.4pt solid var(--gold); background:#FBF6EA; padding:9pt 12pt; margin:12pt 0; break-inside:avoid; }
.panel__h { font-family:Calibri,"Nimbus Sans",Arial,sans-serif; font-size:7pt; font-weight:700;
  letter-spacing:.12em; text-transform:uppercase; color:var(--bronze); margin:0 0 4pt; }
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
.legend__m { font-size:10pt; color:var(--bronze); line-height:1.2; min-width:1.2em; text-align:center; }
.legend__i b { font-family:Calibri,"Nimbus Sans",Arial,sans-serif; font-size:8.5pt; color:${BRAND.ink}; }
.legend__i p { font-size:8pt; color:var(--soft); margin:0; line-height:1.4; }

/* ---------- Level divider ---------- */
/* A full leaf, centred, on the level's own tinted stock — the reader
   should know they have crossed into a new level before reading a word. */
.opener { break-before:page; height:256mm; position:relative; display:flex;
  align-items:center; justify-content:center; text-align:center; overflow:hidden;
  background:var(--wash); }
.opener__field { position:absolute; top:50%; left:50%; transform:translate(-50%,-50%); }
.opener__frame { position:absolute; inset:7mm; }
.opener__fan { position:absolute; }
.opener__fan--tl { top:17mm; left:17mm; }
.opener__fan--br { bottom:17mm; right:17mm; transform:rotate(180deg); }
.opener__in { position:relative; padding:0 20mm; width:100%; }
.opener__crest { margin:0 0 8pt; }
.opener__eyebrow { font-family:var(--sans); font-size:7pt; font-weight:700;
  letter-spacing:.28em; text-transform:uppercase; color:var(--mid); margin:0 0 6pt; }
.opener__ros { position:absolute; top:34pt; left:50%; transform:translateX(-50%); }
.opener__num { position:relative; font-size:112pt; line-height:.94; font-weight:700;
  color:var(--ink); margin:0; letter-spacing:.02em; }
.opener__t { font-size:28pt; line-height:1.1; margin:6pt 0 4pt; color:var(--ink); font-weight:700; }
.opener__cefr { font-family:var(--sans); font-size:8.4pt; font-weight:700;
  letter-spacing:.24em; text-transform:uppercase; color:var(--mid); margin:0 0 14pt; }
.opener__orn { margin:0 0 16pt; display:flex; justify-content:center; }
.opener__awardbox { border-top:.6pt solid var(--mid); border-bottom:.6pt solid var(--mid);
  padding:10pt 0 9pt; margin:0 auto 16pt; max-width:32em; }
.opener__awardh { font-family:var(--sans); font-size:6.4pt; font-weight:700; letter-spacing:.22em;
  text-transform:uppercase; color:var(--soft); margin:0 0 5pt; }
.opener__award { font-size:14pt; font-style:italic; color:var(--ink); margin:0 0 3pt; }
.opener__pn { font-family:var(--sans); font-size:9.5pt; font-weight:700;
  letter-spacing:.14em; color:var(--mid); margin:0 0 6pt; }
.opener__st { font-size:9.4pt; color:var(--soft); max-width:30em; margin:0 auto; }
.opener__stats { display:flex; gap:20pt; justify-content:center; margin:0 0 18pt; }
.opener__stats div { text-align:center; min-width:16mm; }
.opener__stats b { display:block; font-size:19pt; color:var(--ink); line-height:1.1; }
.opener__stats span { font-family:var(--sans); font-size:6.4pt;
  letter-spacing:.16em; text-transform:uppercase; color:var(--soft); }
.opener__band { opacity:.9; }

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

/* ---------- Back matter ---------- */
.clist__after { margin-top:12pt; padding-top:8pt; border-top:.5pt solid var(--rule); }
.clist__after p:last-child { font-family:var(--sans); font-size:8pt; color:var(--soft); margin:0; }

.omt { width:100%; border-collapse:collapse; font-size:8.2pt; margin:10pt 0; }
.omt th { background:${BRAND.ink}; color:#fff; text-align:left; padding:5pt 7pt;
  font-family:var(--sans); font-size:6.8pt; letter-spacing:.1em; text-transform:uppercase; }
.omt td { padding:5.5pt 7pt; border-bottom:.5pt solid #E4E8EF; vertical-align:top; line-height:1.45; }
.omt__s { font-family:var(--sans); font-size:6.8pt; font-weight:700; letter-spacing:.1em;
  text-transform:uppercase; color:var(--bronze); white-space:nowrap; }
.omt__i { font-weight:700; color:var(--ink); width:26%; }
.omt__st { font-family:var(--sans); font-size:7.2pt; color:var(--crimson); font-weight:700;
  white-space:nowrap; }

.colophon { text-align:center; }
.colophon h2::after { content:''; display:block; width:24%; height:.7pt; background:var(--gold);
  margin:7pt auto 14pt; }
.colophon p { max-width:30em; margin:0 auto 8pt; font-size:9.4pt; line-height:1.6; text-align:left; }
.col__orn { display:flex; justify-content:center; margin:0 0 10pt; }
.col__meta { font-family:var(--sans); font-size:7pt; letter-spacing:.08em; color:var(--soft);
  text-align:center !important; margin-top:14pt !important; }
.col__band { margin:12pt auto 0; max-width:70%; }
`;

/* The cover artwork is its own document: a spread at trim + bleed, with
   the spine width calculated from the bound page count. */
const COVER_CSS = `
@page { margin:0; }
* { box-sizing:border-box; }
body { margin:0; -webkit-print-color-adjust:exact; print-color-adjust:exact;
  font-family:${TYPE.serif}; }
.spread { position:relative; background:${PAL.midnightNavy}; overflow:hidden; }
.spread__bleedmarks { position:absolute; inset:0; z-index:5; pointer-events:none; }
.face { position:absolute; top:${BLEED}mm; height:${TRIM.h}mm; overflow:hidden; }
.face__field { position:absolute; inset:0; }
.face__frame { position:absolute; inset:9mm; }

.face--front, .face--back { background:${PAL.midnightNavy}; }
.fc__in, .back__in { position:relative; height:100%; display:flex; flex-direction:column;
  align-items:center; text-align:center; padding:17mm 17mm 13mm; color:${PAL.champagneGold}; }
.fc__corners span { position:absolute; }
/* Inside the inner rule, not outside it. The frame's viewBox inset of
   16 units over a 192 mm face puts the outer rule at about 16 mm, so
   anything placed at 13 mm sits outside the border and reads as damage. */
.fc__c--tl { top:20mm; left:20mm; } .fc__c--tr { top:20mm; right:20mm; transform:rotate(90deg); }
.fc__c--bl { bottom:20mm; left:20mm; transform:rotate(-90deg); }
.fc__c--br { bottom:20mm; right:20mm; transform:rotate(180deg); }
.fc__crest { margin:0 0 7mm; }
.fc__inst { font-family:${TYPE.sans}; font-size:9pt; font-weight:700; letter-spacing:.42em;
  text-transform:uppercase; color:${PAL.champagneGold}; margin:0 0 2pt; ${EMBOSS.gold} }
.fc__camp { font-style:italic; font-size:8.5pt; color:#A8B2C6; margin:0; }
.fc__hair { width:16%; height:.5pt; background:${PAL.royalGold}; opacity:.7; margin:5mm auto 0; }
.fc__medallion { position:relative; margin:auto 0 7mm; width:300px; height:300px;
  display:flex; align-items:center; justify-content:center; }
.fc__rosette { position:absolute; top:0; left:0; }
.fc__emblem { position:relative; }
.fc__title { position:relative; margin:11mm 0 0; }
.fc__the { font-style:italic; font-size:16pt; color:${PAL.royalGold}; margin:0 0 2pt; }
.fc__title h1 { font-size:31pt; line-height:1.16; margin:0; font-weight:700;
  color:${PAL.champagneGold}; letter-spacing:-.005em; ${EMBOSS.gold} }
.fc__rule { width:34%; height:1pt; background:${PAL.royalGold}; margin:6mm auto 5mm; }
.fc__sub { font-family:${TYPE.sans}; font-size:9pt; letter-spacing:.34em; text-transform:uppercase;
  color:#C3CBD9; margin:0; }
.fc__marks { font-family:${TYPE.sans}; font-size:6.6pt; letter-spacing:.28em;
  text-transform:uppercase; color:${PAL.royalGold}; margin:0 0 3mm; }
.fc__dot { margin:0 7pt; opacity:.6; }
.fc__ed { font-family:${TYPE.sans}; font-size:7.4pt; letter-spacing:.22em; text-transform:uppercase;
  color:#A8B2C6; margin:0 0 4mm; }
.fc__band { width:100%; margin:0 0 3mm; }
.fc__press { font-family:${TYPE.sans}; font-size:6.4pt; letter-spacing:.24em;
  text-transform:uppercase; color:#8894AB; margin:0; }

.back__eyebrow { font-family:${TYPE.sans}; font-size:7pt; font-weight:700; letter-spacing:.3em;
  text-transform:uppercase; color:${PAL.royalGold}; margin:0 0 4mm; }
.back__orn { margin:0 0 6mm; }
.back__b { font-size:10pt; line-height:1.62; color:#D6DCE7; text-align:left; margin:0 0 4mm;
  max-width:34em; }
.back__stats { display:flex; gap:9mm; justify-content:center; margin:3mm 0 0;
  border-top:.5pt solid rgba(228,213,168,.35); border-bottom:.5pt solid rgba(228,213,168,.35);
  padding:4mm 0; width:100%; }
.back__stats b { display:block; font-size:16pt; color:${PAL.champagneGold}; line-height:1.1; }
.back__stats span { font-family:${TYPE.sans}; font-size:5.8pt; letter-spacing:.14em;
  text-transform:uppercase; color:#8894AB; }
.back__lh { font-family:${TYPE.sans}; font-size:6.4pt; font-weight:700; letter-spacing:.24em;
  text-transform:uppercase; color:${PAL.royalGold}; margin:6mm 0 3mm; }
.back__levels { list-style:none; margin:0; padding:0; width:100%; max-width:74mm;
  text-align:left; }
.back__levels li { display:flex; align-items:baseline; gap:4mm; padding:1.6mm 0;
  border-bottom:.4pt solid rgba(228,213,168,.2); }
.back__lr { font-size:10pt; font-weight:700; color:${PAL.champagneGold}; min-width:6mm;
  text-align:right; }
.back__ln { flex:1; font-size:9pt; color:#D6DCE7; }
.back__lc { font-family:${TYPE.sans}; font-size:6.2pt; letter-spacing:.16em; text-transform:uppercase;
  color:#8894AB; }
.back__seal { margin:0 0 auto; opacity:.85; }
.back__foot { display:flex; gap:6mm; align-items:center; width:100%; text-align:left; margin:0 0 5mm; }
.back__qr { background:#fff; padding:2mm; line-height:0; }
.back__ids { font-family:${TYPE.sans}; font-size:6.6pt; color:#A8B2C6; line-height:1.7; }
.back__idh { font-size:6.4pt; font-weight:700; letter-spacing:.22em; text-transform:uppercase;
  color:${PAL.royalGold}; margin:0 0 1mm; }
.back__ids p { margin:0; }
.back__ids b { color:#D6DCE7; font-weight:700; }
.back__isbn { font-style:italic; opacity:.75; margin-top:1mm !important; }
.back__band { width:100%; margin:0 0 3mm; }
.back__press { font-family:${TYPE.sans}; font-size:6.4pt; letter-spacing:.24em;
  text-transform:uppercase; color:#8894AB; margin:0; }

.face--spine { background:${PAL.midnightNavy}; display:flex; flex-direction:column;
  align-items:center; justify-content:space-between; padding:8mm 0; }
.spine__rule { position:absolute; top:6mm; bottom:6mm; left:50%; transform:translateX(-50%);
  width:.4pt; background:rgba(228,213,168,.28); }
.spine__txt { position:absolute; top:50%; left:50%; transform:translate(-50%,-50%) rotate(90deg);
  white-space:nowrap; display:flex; align-items:baseline; gap:6mm; }
.spine__t { font-size:11pt; font-weight:700; color:${PAL.champagneGold}; letter-spacing:.02em; }
.spine__s { font-family:${TYPE.sans}; font-size:6.4pt; letter-spacing:.24em; text-transform:uppercase;
  color:#8894AB; }
.spine__bars { position:relative; display:flex; flex-direction:column; gap:1mm; align-items:center;
  margin-top:2mm; }
.spine__bars i { display:block; width:3mm; height:1.2mm; }
.spine__crest { position:relative; margin-bottom:1mm; }
`;

const html = `<!doctype html><html lang="en"><head><meta charset="utf-8">
<title>The International English Fluency Certificate — The Complete Curriculum</title>
<meta name="author" content="Worldwide English College">
<meta name="subject" content="English language curriculum; complete teaching programme">
<meta name="keywords" content="IEFC, Worldwide English College, CEFR, English curriculum, lesson plans">
<style>${CSS}</style></head><body>
${FRONT}
${C.levels.map(renderLevel).join('\n')}
${BACK}
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

// ---- The cover artwork ----------------------------------------------
// Produced only after the text block exists, because the spine width is
// a function of the bound page count. Rendering the cover first would
// mean guessing it, and a guessed spine is a cover that wraps.
const pages = countPages(readFileSync(out));
const spine = spineWidth(pages);
const coverHtml = `<!doctype html><html lang="en"><head><meta charset="utf-8">
<title>IEFC Complete Curriculum — cover artwork</title>
<style>${COVER_CSS}</style></head><body>${coverSpread(ID, spine, C.levels)}</body></html>`;
writeFileSync(path.join(ROOT, 'publication', '.cover.html'), coverHtml);

const cpage = await browser.newPage();
await cpage.setContent(coverHtml, { waitUntil: 'load' });
const coverOut = path.join(ROOT, 'publication', 'IEFC Cover Artwork.pdf');
await cpage.pdf({
  path: coverOut, printBackground: true,
  width: `${TRIM.w * 2 + spine + BLEED * 2}mm`, height: `${TRIM.h + BLEED * 2}mm`,
  margin: { top: '0', bottom: '0', left: '0', right: '0' },
});
await browser.close();

/**
 * Count pages by scanning the PDF for page objects.
 *
 * `/Type /Page` also matches the leading substring of `/Type /Pages`,
 * the tree node — so the negative lookahead is not a nicety. Without it
 * the count is one too high, the spine is 0.1 mm too wide, and nothing
 * about the output looks wrong.
 */
function countPages(buf) {
  const s = buf.toString('latin1');
  return (s.match(/\/Type\s*\/Page(?![s])/g) || []).length;
}

console.log(`FLAGSHIP  ${out}`);
console.log(`  ${C.totals.lessons} items · ${C.totals.modules} modules · ${C.totals.questions} questions · `
  + `${C.totals.bodyWords.toLocaleString('en-GB')} words of lesson content`);
console.log(`  ${pages} pages · Document ID ${ID.documentId} · issue ${ID.issueCode}`);
console.log(`COVER     ${coverOut}`);
console.log(`  spread ${TRIM.w * 2 + spine + BLEED * 2} × ${TRIM.h + BLEED * 2} mm · `
  + `spine ${spine} mm at ${pages} pages · ${BLEED} mm bleed`);
