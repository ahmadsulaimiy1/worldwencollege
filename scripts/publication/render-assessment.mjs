/**
 * THE IEFC ASSESSMENT HANDBOOK.
 *
 * First by educational impact once the Workbook was withdrawn — and it
 * was withdrawn by attempting it, which is the part worth recording.
 * The catalogue said the Workbook was derivable because every lesson
 * carries guided practice, homework and extension. Every one of those
 * is a BRIEF: "Combine 8 sentence pairs into one sentence using a
 * defining relative clause." Nought of the 114 lessons carries the
 * eight pairs. A workbook printed from briefs would hand a learner the
 * instruction and not the exercise, which is worse than no workbook,
 * because it looks like one.
 *
 * This volume has no such problem. Every element of it is complete
 * printable content: 660 questions with their options and their answers,
 * 60 assignment briefs, 60 rubrics carrying 307 criteria, and the
 * threshold each is marked against.
 *
 * ────────────────────────────────────────────────────────────────────
 * WHAT IT IS FOR, WHICH DECIDES ITS SHAPE
 * ────────────────────────────────────────────────────────────────────
 * Marking cannot be consistent while sixty rubrics live in sixty
 * places. Two teachers marking the same assignment in different weeks
 * are reading criteria from two different lesson pages, and moderation —
 * the thing that makes an award mean anything — has nowhere to stand.
 *
 * So the arrangement is by what an assessor does, not by curriculum
 * order: the marking standard once at the front rather than sixty
 * times; then, per module, the assignment and its rubric on one spread,
 * with the quiz and its answers following. An assessor works a module
 * at a time and never turns a page mid-criterion.
 *
 * ────────────────────────────────────────────────────────────────────
 * WHY THE ANSWERS ARE HERE AND THE STUDENT EDITION EXISTS
 * ────────────────────────────────────────────────────────────────────
 * This is a teacher and examiner volume, so it prints the correct
 * option for every question. The Examination Guide catalogued alongside
 * it is the same rubrics written for the candidate, without the keys:
 * the two readerships must not be given the same book, which is the
 * justification recorded for it in the duplication register.
 */
import { writeFileSync, mkdirSync, existsSync, readFileSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { chromium } from 'playwright';
import { buildCurriculum, parseRubric } from './curriculum.mjs';
import { walk } from './apparatus.mjs';
import { TYPE, C as PAL, BRAND, paletteFor } from './design.mjs';
import { crest, fleuron, guillocheBand } from './ornament.mjs';
import { publicationIdentity } from './identity.mjs';
import { editionMark, runningHead, runningFoot, rightsPage } from './rights.mjs';
import { legacyBlock, ecosystem } from './legacy.mjs';
import { formatFor, marginsFor, familyColours } from './house.mjs';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..');
const dash = (s) => String(s ?? '').replace(/\s--\s/g, ' — ');
const esc = (s) => dash(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');

const FAMILY = 'IEFC Assessment Series';
const FMT = formatFor('practice');
const M = marginsFor('practice', 220);
const ACCENT = familyColours().find((c) => c.family === FAMILY);

const C = buildCurriculum();
const ID = publicationIdentity(C, { edition: 1, revision: 0, impression: 1 });

// This volume's name and its edition mark, printed on every page it
// prints. The mark is derived from the volume and from the curriculum
// edition it was set from, so a page found somewhere else names the
// edition it was taken from — see rights.mjs.
const VOLUME = 'The IEFC Assessment Handbook';
const MARK = editionMark('assessment', ID.contentDigest);

// ─────────────────────────────────────────────────────────────────────
// THE MODEL
// ─────────────────────────────────────────────────────────────────────

const stageText = (item, icon) => {
  const s = item.stages.find((st) => st.icon === icon);
  if (!s) return null;
  return s.parts.map((p) => (p.type === 'item' ? `(${p.marker}) ${p.text}` : p.text)).join(' ')
    .trim();
};

const modules = [];
for (const lv of C.levels) {
  for (const mod of lv.modules) {
    const quiz = mod.lessons.find((x) => x.kind === 'quiz');
    const assignment = mod.lessons.find((x) => x.kind === 'assignment');
    if (!quiz && !assignment) continue;
    const rubric = assignment ? parseRubric(assignment.stages.find((s) => s.icon === 'rubric')) : null;
    modules.push({
      roman: lv.roman,
      cefr: lv.cefr,
      levelName: lv.name,
      seq: mod.sequence,
      title: mod.title.replace(/^Module \d+:\s*/, ''),
      quiz,
      assignment,
      brief: assignment ? stageText(assignment, 'instructions') : null,
      assess: assignment ? stageText(assignment, 'assess') : null,
      rubric,
    });
  }
}

const teaching = walk(C).filter(({ item }) => item.stages.some((s) => s.icon === 'objectives'));
const totals = {
  modules: modules.length,
  quizzes: modules.filter((m) => m.quiz).length,
  questions: modules.reduce((n, m) => n + (m.quiz ? m.quiz.questions.length : 0), 0),
  assignments: modules.filter((m) => m.assignment).length,
  rubrics: modules.filter((m) => m.rubric).length,
  criteria: modules.reduce((n, m) => n + (m.rubric ? m.rubric.criteria.length : 0), 0),
  lessons: teaching.length,
};

/**
 * The pass threshold, read from the rubrics rather than restated.
 *
 * A first draft compared the whole closing sentence and found three
 * variants, which it was about to print as "the rubrics do not agree on
 * a threshold". They agree completely: 55 of them state the same
 * threshold in the same words, and the two variants differ only in what
 * they say completion means — one adds "for the learner", and Level VI
 * Module 10 adds that the programme itself is complete, which is true
 * of that module and of no other.
 *
 * What the comparison did find is real and different: five rubrics
 * carry no closing statement at all, and they are systematic — the
 * Review & Consolidation module at Levels I to V. An assessor marking
 * those five has no printed threshold. That is an academic-authoring
 * gap and it is printed as one.
 */
const THRESHOLD = /at or above the platform.s pass threshold/i;
const withRubric = modules.filter((m) => m.rubric);
const stating = withRubric.filter((m) => m.rubric.trailing && THRESHOLD.test(m.rubric.trailing));
const silent = withRubric.filter((m) => !m.rubric.trailing || !THRESHOLD.test(m.rubric.trailing));
const thresholdWording = [...new Set(stating.map((m) => m.rubric.trailing))];

const LETTERS = ['A', 'B', 'C', 'D', 'E', 'F'];
const ROMANS = ['I', 'II', 'III', 'IV', 'V', 'VI'];

// ─────────────────────────────────────────────────────────────────────
// THE PAGES
// ─────────────────────────────────────────────────────────────────────

const moduleBlock = (m) => {
  const pal = paletteFor(m.roman);
  return `
<article class="mod">
  <header class="mod__h" style="border-color:${pal.mid}">
    <p class="mod__ref" style="color:${pal.ink}">${esc(m.roman)}.${m.seq}</p>
    <h2 style="color:${pal.ink}">${esc(m.title)}</h2>
    <p class="mod__meta">${m.quiz ? `${m.quiz.questions.length} questions` : 'no quiz'} ·
      ${m.rubric ? `${m.rubric.criteria.length} criteria` : 'no rubric'}</p>
  </header>

  ${m.assignment ? `<section class="asg">
    <h3>Assignment</h3>
    ${m.brief ? `<p class="asg__brief">${esc(m.brief)}</p>` : ''}
    ${m.assess ? `<p class="asg__note"><span>How it is assessed</span>${esc(m.assess)}</p>` : ''}
    ${m.rubric ? `<table class="rub"><thead><tr>
        <th scope="col">#</th><th scope="col">Criterion</th>
        <th scope="col">What earns the mark</th></tr></thead><tbody>
      ${m.rubric.criteria.map((c) => `<tr><td class="mono">${c.n}</td>
        <td class="rub__name">${esc(c.name)}</td><td>${esc(c.descriptor)}</td></tr>`).join('')}
    </tbody></table>` : ''}
  </section>` : ''}

  ${m.quiz && m.quiz.questions.length ? `<section class="qz">
    <h3>Quiz · ${m.quiz.questions.length} questions</h3>
    <ol class="qs">
      ${m.quiz.questions.map((q) => `<li>
        <p class="q__p">${esc(q.prompt)}</p>
        <ul class="q__c">${q.choices.map((ch, i) => `<li class="${
  i === q.correctIndex ? 'is-key' : ''}"><span class="q__l">${LETTERS[i]}</span>${esc(ch)}${
  i === q.correctIndex ? '<span class="q__k">key</span>' : ''}</li>`).join('')}</ul>
      </li>`).join('')}
    </ol>
  </section>` : ''}
</article>`;
};

const levelSection = (roman) => {
  const rows = modules.filter((m) => m.roman === roman);
  if (!rows.length) return '';
  const pal = paletteFor(roman);
  return `
<section class="lvl">
  <div class="lvl__open" style="background:${pal.wash};border-color:${pal.mid}">
    <p class="eyebrow" style="color:${pal.ink}">Level ${esc(roman)} · ${esc(rows[0].cefr)}</p>
    <h1 style="color:${pal.ink}">${esc(rows[0].levelName)}</h1>
    <p class="lvl__count">${rows.length} modules ·
      ${rows.reduce((n, m) => n + (m.quiz ? m.quiz.questions.length : 0), 0)} questions ·
      ${rows.reduce((n, m) => n + (m.rubric ? m.rubric.criteria.length : 0), 0)} criteria</p>
  </div>
  ${rows.map(moduleBlock).join('')}
</section>`;
};

const RECORD = ecosystem().find((r) => /Assessment Handbook/.test(r.name));
const LEGACY = legacyBlock({
  id: ID,
  title: 'The IEFC Assessment Handbook',
  family: FAMILY,
  audience: RECORD ? RECORD.audience : 'Teaching staff, examiners, moderators',
  subjects: ['English language — Ability testing', 'Educational tests and measurements',
    'Grading and marking (Students)', 'English language — Examinations'],
  artefact: 'publication/IEFC Assessment Handbook.pdf',
  siblings: ['publication/.assessment.html'],
  relatives: RECORD ? RECORD.relatives : [],
  maturity: RECORD ? RECORD.maturity : undefined,
  ink: PAL.royalBlue, rule: PAL.platinum, soft: PAL.slateGrey, accent: ACCENT.hex,
  panel: PAL.softCream,
});

const html = `<!doctype html><html lang="en-GB"><head><meta charset="utf-8">
<title>The IEFC Assessment Handbook</title>
<style>
@page { size:${FMT.w}mm ${FMT.h}mm; margin:${M.head}mm ${M.fore}mm ${M.foot}mm ${M.gutter}mm; }
@page :left  { margin-left:${M.fore}mm; margin-right:${M.gutter}mm; }
@page :right { margin-left:${M.gutter}mm; margin-right:${M.fore}mm; }
* { box-sizing:border-box; }
body { margin:0; font-family:${TYPE.serif}; font-size:9pt; line-height:1.48;
  color:${PAL.warmCharcoal}; background:${BRAND.paper};
  -webkit-print-color-adjust:exact; print-color-adjust:exact;
  hyphens:auto; text-wrap:pretty; orphans:3; widows:3; }
h1,h2,h3 { break-after:avoid; font-weight:700; color:${PAL.royalBlue}; }
h1 { font-size:19pt; line-height:1.12; margin:0 0 5pt; }
h2 { font-size:13pt; margin:0 0 3pt; }
h3 { font-size:8.4pt; margin:0 0 4pt; color:${ACCENT.hex}; font-family:${TYPE.sans};
  letter-spacing:.16em; text-transform:uppercase; }
p { margin:0 0 4pt; }
.eyebrow { font-family:${TYPE.sans}; font-size:6.2pt; font-weight:700; letter-spacing:.26em;
  text-transform:uppercase; color:${ACCENT.hex}; margin:0 0 4pt; }
.small { font-family:${TYPE.sans}; font-size:7pt; color:${PAL.slateGrey}; }
.mono { font-family:"Consolas","DejaVu Sans Mono",monospace; font-size:7pt; }
.nowrap { white-space:nowrap; }

.title { height:${FMT.h - M.head - M.foot - 4}mm; break-after:page; break-inside:avoid;
  background:${PAL.midnightNavy}; color:${BRAND.paper}; padding:18mm 15mm 12mm;
  display:flex; flex-direction:column; }
.title h1 { color:${BRAND.paper}; font-size:25pt; max-width:12em; }
.title .eyebrow { color:${PAL.champagneGold}; }
.title__rule { height:1.4pt; background:${ACCENT.hex}; width:44mm; margin:10pt 0 12pt; }
.title__sub { font-size:10.5pt; color:${PAL.platinum}; max-width:22em; }
.title__fill { flex:1; }
.title__meta { font-family:${TYPE.sans}; font-size:6.8pt; color:${PAL.platinum}; line-height:1.75; }

.lvl { break-before:page; }
.lvl__open { break-inside:avoid; break-after:avoid; border-left:3pt solid; padding:9pt 12pt;
  margin:0 0 11pt; }
.lvl__open h1 { font-size:17pt; margin:0 0 3pt; }
.lvl__count { font-family:${TYPE.sans}; font-size:6.8pt; letter-spacing:.1em;
  text-transform:uppercase; color:${PAL.slateGrey}; margin:0; }

.mod { break-inside:auto; margin:0 0 14pt; }
.mod__h { break-inside:avoid; break-after:avoid; border-bottom:1.2pt solid; padding:0 0 4pt;
  margin:0 0 7pt; }
.mod__ref { font-family:${TYPE.sans}; font-size:6.8pt; font-weight:700; letter-spacing:.18em;
  margin:0 0 1pt; }
.mod__meta { font-family:${TYPE.sans}; font-size:6.8pt; color:${PAL.slateGrey}; margin:2pt 0 0; }

.asg { break-inside:avoid; margin:0 0 8pt; }
.asg__brief { font-size:9.4pt; }
.asg__note { font-size:8.4pt; padding-left:8pt; border-left:2pt solid ${PAL.champagneGold};
  margin:4pt 0 6pt; }
.asg__note span { display:block; font-family:${TYPE.sans}; font-size:6.2pt; font-weight:700;
  letter-spacing:.14em; text-transform:uppercase; color:${PAL.bronze}; margin-bottom:1pt; }

table { width:100%; border-collapse:collapse; font-size:8pt; margin:5pt 0 8pt; }
thead { display:table-header-group; }
th { background:${ACCENT.hex}; color:#fff; text-align:left; padding:3pt 6pt;
  font-family:${TYPE.sans}; font-size:6pt; letter-spacing:.1em; text-transform:uppercase; }
td { padding:3pt 6pt; border-bottom:.4pt solid #E8EBF1; vertical-align:top; }
tr { break-inside:avoid; }
.rub__name { font-weight:700; color:${PAL.midnightNavy}; white-space:nowrap; }

ol.qs { margin:0; padding:0 0 0 16pt; }
ol.qs > li { break-inside:avoid; margin:0 0 6pt; }
.q__p { font-size:9pt; margin:0 0 2pt; }
ul.q__c { list-style:none; margin:0; padding:0; }
ul.q__c li { font-size:8.4pt; padding:1pt 0 1pt 0; color:${PAL.warmCharcoal}; }
.q__l { font-family:${TYPE.sans}; font-size:6.6pt; font-weight:700; color:${PAL.slateGrey};
  display:inline-block; width:12pt; }
ul.q__c li.is-key { color:${PAL.midnightNavy}; font-weight:700; }
.q__k { font-family:${TYPE.sans}; font-size:5.8pt; font-weight:700; letter-spacing:.12em;
  text-transform:uppercase; color:#fff; background:#1E6B3A; padding:.8pt 3.5pt; margin-left:5pt;
  vertical-align:1pt; }

.panel { border-left:2.2pt solid ${ACCENT.hex}; background:${PAL.softCream}; padding:8pt 10pt;
  margin:9pt 0; break-inside:avoid; }
.panel--stop { border-left-color:${PAL.deepCrimson}; background:#FBF1F1; }
.panel__h { font-family:${TYPE.sans}; font-size:6.4pt; font-weight:700; letter-spacing:.14em;
  text-transform:uppercase; color:${ACCENT.hex}; margin:0 0 3pt; }
.panel--stop .panel__h { color:${PAL.deepCrimson}; }
.panel p:last-child { margin:0; }
.fleuron { text-align:center; margin:12pt 0; }
</style></head><body>

<section class="title">
  <div>${crest({ size: 54, gold: PAL.royalGold, ink: 'none', mono: true })}</div>
  <p class="eyebrow" style="margin-top:12pt">Worldwide English College · London Campus</p>
  <h1>The IEFC Assessment Handbook</h1>
  <div class="title__rule"></div>
  <p class="title__sub">Every assignment, every rubric and every question in the programme, with
    the marking standard stated once.</p>
  <div class="title__fill"></div>
  <div style="margin-bottom:10pt">${guillocheBand({
  width: 700, height: 30, stroke: PAL.champagneGold, opacity: 0.5,
})}</div>
  <div class="title__meta">
    ${FAMILY} · First edition · ${esc(ID.generated)}<br>
    ${totals.assignments} assignments · ${totals.rubrics} rubrics · ${totals.criteria} criteria ·
    ${totals.questions} questions with answer keys<br>
    Document ID ${esc(ID.documentId)}
  </div>
</section>

<section>
  <p class="eyebrow">The marking standard</p>
  <h1 style="font-size:15pt">Stated once, not sixty times</h1>
  <p>Marking cannot be consistent while sixty rubrics live in sixty places. Two teachers marking
    the same assignment in different weeks read their criteria from two different lesson pages,
    and moderation — the thing that makes an award mean anything — has nowhere to stand.</p>
  <p>This volume puts every assignment beside its rubric and every quiz beside its answers, in
    one place, arranged by what an assessor does rather than by curriculum order.</p>

  <div class="panel">
    <p class="panel__h">The threshold, read from the rubrics themselves</p>
    <p>${esc(thresholdWording[0])}</p>
    <p class="small" style="margin-top:4pt">${stating.length} of ${withRubric.length} rubrics
      state this threshold, in these words${thresholdWording.length > 1
    ? `. ${thresholdWording.length - 1} carry a variant that differs only in what completion
      means — Level VI Module 10 adds that the programme itself is complete, which is true of
      that module and of no other` : ''}. It is read from them at generation rather than restated
      here, so a rubric that ever stopped agreeing would show as a disagreement.</p>
  </div>

  ${silent.length ? `<div class="panel panel--stop">
    <p class="panel__h">${silent.length} rubrics state no threshold, and they are not random</p>
    <p>${silent.map((m) => `${esc(m.roman)}.${m.seq}`).join(' · ')} — the Review &amp;
      Consolidation module of every level except the last. An assessor marking those five has no
      printed pass threshold to mark against, and this handbook will not invent one: the
      threshold belongs to the rubric, and the rubric belongs to the academic staff who wrote it.
      Recorded here so that the gap is visible at the moment of marking rather than discovered
      afterwards.</p>
  </div>` : ''}

  <h2 style="font-size:11pt;margin-top:10pt">What is here</h2>
  <table><thead><tr><th scope="col">Level</th><th scope="col">Modules</th>
    <th scope="col">Assignments</th><th scope="col">Rubrics</th><th scope="col">Criteria</th>
    <th scope="col">Questions</th></tr></thead><tbody>
    ${ROMANS.map((r) => {
    const rows = modules.filter((m) => m.roman === r);
    return `<tr><td class="nowrap"><b>Level ${r}</b></td><td class="mono">${rows.length}</td>
      <td class="mono">${rows.filter((m) => m.assignment).length}</td>
      <td class="mono">${rows.filter((m) => m.rubric).length}</td>
      <td class="mono">${rows.reduce((n, m) => n + (m.rubric ? m.rubric.criteria.length : 0), 0)}</td>
      <td class="mono">${rows.reduce((n, m) => n + (m.quiz ? m.quiz.questions.length : 0), 0)}</td>
      </tr>`;
  }).join('')}
    <tr><td><b>Total</b></td><td class="mono"><b>${totals.modules}</b></td>
      <td class="mono"><b>${totals.assignments}</b></td>
      <td class="mono"><b>${totals.rubrics}</b></td>
      <td class="mono"><b>${totals.criteria}</b></td>
      <td class="mono"><b>${totals.questions}</b></td></tr>
  </tbody></table>

  <div class="panel panel--stop">
    <p class="panel__h">Two things this volume does not do</p>
    <p>It does not map an assessment to a competency. Nought of the ${totals.assignments * 2}
      assessed items in this programme carries a competency mapping, so an assessor cannot use
      this book to report against the College's own framework — and that is a fact about the
      academic database, not about the book. It also prints the correct option for every question:
      it is a teacher and examiner volume, and the candidate's edition of the same material is
      catalogued separately as the Examination Guide, without the keys.</p>
  </div>
  <div class="fleuron">${fleuron({ colour: ACCENT.hex, width: 90 })}</div>
</section>

${ROMANS.map(levelSection).join('')}

${LEGACY}
${rightsPage({
  title: VOLUME,
  mark: MARK,
  edition: `${ID.editionName} edition`,
  year: ID.year,
  series: FAMILY,
  palette: {
    ink: PAL.warmCharcoal, deep: PAL.royalBlue, grey: PAL.slateGrey, gold: PAL.bronze,
    rule: PAL.platinum, wash: PAL.softCream, serif: TYPE.serif, sans: TYPE.sans,
  },
})}
</body></html>`;

mkdirSync(path.join(ROOT, 'publication'), { recursive: true });
writeFileSync(path.join(ROOT, 'publication', '.assessment.html'), html);

const exe = process.env.PW_CHROMIUM || '/opt/pw-browsers/chromium-1194/chrome-linux/chrome';
const browser = await chromium.launch(existsSync(exe) ? { executablePath: exe } : {});
const page = await browser.newPage();
await page.setContent(html, { waitUntil: 'load' });
const out = path.join(ROOT, 'publication', 'IEFC Assessment Handbook.pdf');
await page.pdf({
  path: out,
  width: `${FMT.w}mm`,
  height: `${FMT.h}mm`,
  printBackground: true,
  preferCSSPageSize: true,
  displayHeaderFooter: true,
  headerTemplate: runningHead(MARK, { gutter: M.gutter }),
  footerTemplate: runningFoot(VOLUME, { gutter: M.gutter, size: 6.6 }),
  margin: { top: `${M.head}mm`, bottom: `${M.foot}mm`,
    left: `${M.gutter}mm`, right: `${M.fore}mm` },
  tagged: true,
  outline: true,
});
await browser.close();

const pages = (readFileSync(out).toString('latin1').match(/\/Type\s*\/Page(?![s])/g) || []).length;
console.log(`ASSESS    ${out}`);
console.log(`  ${pages} pages · ${FMT.w} × ${FMT.h} mm · ${totals.assignments} assignments · `
  + `${totals.rubrics} rubrics · ${totals.criteria} criteria · ${totals.questions} questions`);
console.log(`  threshold stated by ${stating.length} of ${withRubric.length} rubrics · `
  + `${silent.length} silent: ${silent.map((m) => `${m.roman}.${m.seq}`).join(' ')}`);
