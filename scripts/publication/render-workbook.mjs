/**
 * THE IEFC LEVEL I STUDENT WORKBOOK.
 *
 * ────────────────────────────────────────────────────────────────────
 * THE TITLE THIS PROJECT WITHDREW TWICE
 * ────────────────────────────────────────────────────────────────────
 * The Workbook has been the highest-scoring derivable title in the
 * catalogue since the impact ranking was written, and it has been
 * withdrawn from Derivable twice — once for pointing at practice
 * material that did not exist, and once when the measurement that
 * withdrew it turned out to overstate the gap two-fold.
 *
 * It is buildable now because four things were authored since:
 * supplied materials for every practice stage that hands the learner
 * something, a self-check for every lesson, a vocabulary set for every
 * lesson that introduces words, and a solo reinforcement activity for
 * every lesson that needs another person.
 *
 * ────────────────────────────────────────────────────────────────────
 * WHAT A WORKBOOK IS, AND WHAT IT ISN'T
 * ────────────────────────────────────────────────────────────────────
 * It is not the coursebook with the teaching removed. A learner opening
 * this book is not in class: they are at a table, alone, between
 * lessons, and everything on the page has to work without a teacher
 * standing next to it. So each lesson is set as a WORKING SEQUENCE
 * rather than as a summary of the lesson plan:
 *
 *   1 · What you will be able to do   — the objective, in the second
 *       person, because the learner is the one doing it.
 *   2 · Words for this lesson         — the vocabulary set, with the
 *       example sentence and the caution where English is arbitrary.
 *   3 · Practice                      — the guided and independent
 *       stages, with the supplied material printed beneath them where
 *       the stage hands the learner something.
 *   4 · On your own                   — the solo reinforcement
 *       activity, which names the classroom task it prepares or
 *       consolidates. It never claims to replace it, because a
 *       communicative lesson cannot be done alone and saying otherwise
 *       would teach the learner to skip the part that matters.
 *   5 · Check yourself                — the self-check, with the
 *       answers on the facing spread rather than beside the question.
 *   6 · Take it further               — the extension activity.
 *
 * ────────────────────────────────────────────────────────────────────
 * THE ONE PLACE THE ANSWERS ARE NOT
 * ────────────────────────────────────────────────────────────────────
 * The self-check answers exist in the database next to their prompts,
 * and printing them there would destroy the instrument: a learner
 * cannot help reading an answer that is on the same line. They are
 * collected in an answer section at the back, keyed by lesson.
 *
 * That is an editorial decision about paper, not a change to the
 * curriculum — the platform can hide an answer and a page cannot, and
 * the book has to be honest about which medium it is.
 *
 * Nothing in this volume is composed for it. Every objective,
 * instruction, word, example, prompt and answer is read from the
 * academic database.
 */
import { writeFileSync, mkdirSync, existsSync, readFileSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { DatabaseSync } from 'node:sqlite';
import { chromium } from 'playwright';
import { buildCurriculum } from './curriculum.mjs';
import { walk } from './apparatus.mjs';
import { TYPE, C as PAL, BRAND } from './design.mjs';
import { fleuron, guillocheBand } from './ornament.mjs';
import { publicationIdentity } from './identity.mjs';
import { editionMark, runningHead, runningFoot, rightsPage } from './rights.mjs';
import { legacyBlock } from './legacy.mjs';
import { formatFor, marginsFor, familyColours } from './house.mjs';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..');
const dash = (s) => String(s ?? '').replace(/\s--\s/g, ' — ');
const esc = (s) => dash(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');

const FAMILY = 'IEFC Student Series';
const FMT = formatFor('practice');
const ACCENT = familyColours().find((c) => c.family === FAMILY);
const LEVEL = 'I';

// ─────────────────────────────────────────────────────────────────────
// THE MODEL
// ─────────────────────────────────────────────────────────────────────

function build() {
  const db = new DatabaseSync(':memory:');
  db.exec(readFileSync(`${ROOT}/sql/schema.sql`, 'utf8'));
  for (let n = 1; n <= 6; n++) {
    db.exec(readFileSync(`${ROOT}/sql/seed-curriculum-level-${n}.sql`, 'utf8'));
  }
  for (const f of ['seed-exercises', 'seed-selfchecks',
    'seed-vocabulary-level-1', 'seed-solo-level-1']) {
    db.exec(readFileSync(`${ROOT}/sql/${f}.sql`, 'utf8'));
  }
  const REF = `l.roman || '.' || u.sequence || '.' || i.sequence`;
  const JOIN = `JOIN learning_items i ON i.id = %s
                JOIN units u ON u.id = i.unit_id
                JOIN courses c ON c.id = u.course_id
                JOIN programme_levels l ON l.id = c.level_id
               WHERE l.roman = '${LEVEL}'`;

  const q = (sql) => db.prepare(sql).all();

  const vocab = q(`SELECT ${REF} AS ref, v.id, v.title, v.activity
                     FROM vocabulary_sets v ${JOIN.replace('%s', 'v.learning_item_id')}
                    ORDER BY u.sequence, i.sequence`);
  const vocabItems = q('SELECT * FROM vocabulary_items ORDER BY vocabulary_set_id, sequence');

  const solo = q(`SELECT ${REF} AS ref, a.*
                    FROM solo_activities a ${JOIN.replace('%s', 'a.learning_item_id')}
                   ORDER BY u.sequence, i.sequence`);

  const checks = q(`SELECT ${REF} AS ref, s.id, s.intro
                      FROM self_checks s ${JOIN.replace('%s', 's.learning_item_id')}
                     ORDER BY u.sequence, i.sequence`);
  const checkItems = q('SELECT * FROM self_check_items ORDER BY self_check_id, sequence');

  const sets = q(`SELECT ${REF} AS ref, s.id, s.kind, s.stage, s.brief
                    FROM exercise_sets s ${JOIN.replace('%s', 's.learning_item_id')}
                   ORDER BY u.sequence, i.sequence`);
  const setItems = q('SELECT * FROM exercise_items ORDER BY exercise_set_id, sequence');

  db.close();
  return { vocab, vocabItems, solo, checks, checkItems, sets, setItems };
}

const D = build();
const C = buildCurriculum();
const ID = publicationIdentity(C, { edition: 1, revision: 0, impression: 1 });

// This volume's name and its edition mark, printed on every page it
// prints. The mark is derived from the volume and from the curriculum
// edition it was set from, so a page found somewhere else names the
// edition it was taken from — see rights.mjs.
const VOLUME = 'The IEFC Level I Student Workbook';
const MARK = editionMark('workbook-1', ID.contentDigest);
const LV = C.levels.find((l) => l.roman === LEVEL);

const stageText = (item, icon) => {
  const s = item.stages.find((x) => x.icon === icon);
  return s ? { text: s.parts.map((p) => p.text).join(' ').trim(), timing: s.timing } : null;
};

// One entry per teaching lesson, with everything the learner needs
// gathered from the four authored records and the lesson itself.
const LESSONS = [...walk(C)]
  .filter(({ lv, item }) => lv.roman === LEVEL
    && item.stages.some((s) => s.icon === 'objectives'))
  .map(({ ref, mod, item }) => {
    const v = D.vocab.find((x) => x.ref === ref);
    const ch = D.checks.find((x) => x.ref === ref);
    const st = D.sets.find((x) => x.ref === ref);
    return {
      ref,
      module: mod,
      title: item.title,
      objectives: stageText(item, 'objectives'),
      prereq: stageText(item, 'prereq'),
      guided: stageText(item, 'guided'),
      independent: stageText(item, 'speaking') || stageText(item, 'independent'),
      writing: stageText(item, 'writing'),
      homework: stageText(item, 'homework'),
      extension: stageText(item, 'extension'),
      revision: stageText(item, 'revision'),
      words: v ? { ...v, items: D.vocabItems.filter((x) => x.vocabulary_set_id === v.id) } : null,
      solo: D.solo.find((x) => x.ref === ref) || null,
      check: ch
        ? { ...ch, items: D.checkItems.filter((x) => x.self_check_id === ch.id) }
        : null,
      supplied: st
        ? { ...st, items: D.setItems.filter((x) => x.exercise_set_id === st.id) }
        : null,
    };
  });

const M = marginsFor('practice', LESSONS.length * 6 + 40);

// The objective, addressed to the learner. The curriculum writes it as
// "By the end of this lesson you can (1) ... (2) ..." — already second
// person, which is why it can be split rather than rewritten. Anything
// this function cannot split is printed whole rather than mangled.
function objectives(text) {
  if (!text) return [];
  const body = text.replace(/^By the end of this lesson you can\s*/i, '');
  const parts = body.split(/\(\d\)\s*/).map((s) => s.trim()).filter(Boolean);
  return parts.length > 1 ? parts.map((p) => p.replace(/[,.]$/, '')) : [body];
}

// ─────────────────────────────────────────────────────────────────────
// THE PAGES
// ─────────────────────────────────────────────────────────────────────

const step = (n, label, body) => `
<div class="step">
  <p class="step__h"><span class="step__n">${n}</span>${esc(label)}</p>
  ${body}
</div>`;

const wordTable = (w) => `
<table class="words"><thead><tr>
  <th scope="col">Word</th><th scope="col">Example</th><th scope="col">Careful</th>
</tr></thead><tbody>
${w.items.map((x) => `<tr>
  <td><b>${esc(x.headword)}</b><br><span class="pos">${esc(x.part_of_speech)}</span></td>
  <td>${esc(x.example)}</td>
  <td class="care">${x.note ? esc(x.note) : '<span class="none">—</span>'}</td>
</tr>`).join('')}
</tbody></table>`;

const suppliedBlock = (s) => `
<div class="supplied">
  <p class="supplied__h">${esc(s.brief)}</p>
  <ol class="supplied__list">
    ${s.items.map((x) => `<li>${esc(x.prompt)}</li>`).join('')}
  </ol>
</div>`;

const lessonSection = (L) => `
<section class="lesson">
  <header class="lesson__head">
    <p class="eyebrow">${esc(L.module.title)}</p>
    <h1>${esc(L.title.replace(/^Lesson [\d.]+\s*--\s*/, ''))}</h1>
    <p class="lesson__ref">${esc(L.ref)}</p>
  </header>

  ${step(1, 'What you will be able to do', `
    <ul class="objs">${objectives(L.objectives?.text).map((o) =>
    `<li>${esc(o)}</li>`).join('')}</ul>
    ${L.prereq ? `<p class="before"><b>Before this lesson:</b> ${esc(L.prereq.text)}</p>` : ''}`)}

  ${L.words ? step(2, 'Words for this lesson', `
    <p class="lead">${esc(L.words.title)}. In class: ${esc(L.words.activity)}</p>
    ${wordTable(L.words)}`) : ''}

  ${step(L.words ? 3 : 2, 'Practice', `
    ${L.guided ? `<p class="task"><span class="task__k">In class</span>${
  esc(L.guided.text)}</p>` : ''}
    ${L.independent ? `<p class="task"><span class="task__k">In class</span>${
  esc(L.independent.text)}</p>` : ''}
    ${L.writing ? `<p class="task"><span class="task__k">Write</span>${
  esc(L.writing.text)}</p>` : ''}
    ${L.homework ? `<p class="task"><span class="task__k">At home</span>${
  esc(L.homework.text)}</p>` : ''}
    ${L.supplied ? suppliedBlock(L.supplied) : ''}`)}

  ${L.solo ? step(L.words ? 4 : 3, 'On your own', `
    <div class="solo">
      <p class="solo__serves"><b>This ${esc(L.solo.relation)}</b> the class task:
        <i>${esc(L.solo.serves_task)}</i> It does not take its place — that task needs
        another person, and this is how you arrive ready for it${
  L.solo.relation === 'consolidates' ? ', or fix it afterwards' : ''}.</p>
      <p class="solo__do">${esc(L.solo.activity)}</p>
      <p class="solo__chk"><b>Check yourself.</b> ${esc(L.solo.check_yourself)}</p>
    </div>`) : ''}

  ${L.check ? step((L.words ? 4 : 3) + (L.solo ? 1 : 0), 'Check yourself', `
    <p class="lead">${esc(L.check.intro)}</p>
    <ol class="qs">${L.check.items.map((q) =>
    `<li>${esc(q.prompt)}<span class="rule"></span></li>`).join('')}</ol>
    <p class="answers-at">Answers on page — see <b>Answers · ${esc(L.ref)}</b> at the back of
      this book. Do not look until you have written something.</p>`) : ''}

  ${L.extension ? step((L.words ? 5 : 4) + (L.solo ? 1 : 0), 'Take it further', `
    <p class="task">${esc(L.extension.text)}</p>`) : ''}

  ${L.revision ? `<p class="returns"><b>You will come back to this.</b> ${
  esc(L.revision.text)}</p>` : ''}
</section>`;

const answerSection = `
<section class="answers">
  <div class="answers__open">
    <p class="eyebrow">Answers</p>
    <h1>Check yourself — the answers</h1>
    <p class="lead">Every prompt from every <b>Check yourself</b> in this book, with its answer,
      and — where the lesson knows about a common confusion — what it is and why it happens.
      They are here rather than beside the question because a printed page cannot hide an answer
      and a learner cannot help reading one that is on the same line.</p>
  </div>
  ${LESSONS.filter((L) => L.check).map((L) => `
    <div class="ans">
      <h2>${esc(L.ref)} · ${esc(L.title.replace(/^Lesson [\d.]+\s*--\s*/, ''))}</h2>
      <ol>${L.check.items.map((q) => `<li>
        <p class="ans__q">${esc(q.prompt)}</p>
        <p class="ans__a">${esc(q.answer)}</p>
        ${q.trap ? `<p class="ans__t">${esc(q.trap)}</p>` : ''}
      </li>`).join('')}</ol>
    </div>`).join('')}
</section>`;

const words = LESSONS.reduce((n, L) => n + (L.words ? L.words.items.length : 0), 0);
const prompts = LESSONS.reduce((n, L) => n + (L.check ? L.check.items.length : 0), 0);
const traps = LESSONS.reduce((n, L) =>
  n + (L.check ? L.check.items.filter((q) => q.trap).length : 0), 0);
const solos = LESSONS.filter((L) => L.solo).length;

const LEGACY = legacyBlock({
  id: ID,
  title: 'The IEFC Level I Student Workbook',
  family: FAMILY,
  audience: 'Learners working through IEFC Level I, alone and between classes',
  subjects: ['English language — Textbooks for foreign speakers',
    'English language — Study and teaching', 'English language — Problems, exercises'],
  artefact: 'publication/IEFC Level I Student Workbook.pdf',
  siblings: ['publication/.workbook.html'],
  relatives: [],
  ink: PAL.royalBlue, rule: PAL.platinum, soft: PAL.slateGrey, accent: ACCENT.hex,
  panel: PAL.softCream,
});

const html = `<!doctype html><html lang="en-GB"><head><meta charset="utf-8">
<title>The IEFC Level I Student Workbook</title>
<style>
@page { size:${FMT.w}mm ${FMT.h}mm; margin:${M.head}mm ${M.fore}mm ${M.foot}mm ${M.gutter}mm; }
@page :left  { margin-left:${M.fore}mm; margin-right:${M.gutter}mm; }
@page :right { margin-left:${M.gutter}mm; margin-right:${M.fore}mm; }
* { box-sizing:border-box; }
body { margin:0; font-family:${TYPE.serif}; font-size:9.6pt; line-height:1.55;
  color:${PAL.warmCharcoal}; background:${BRAND.paper};
  -webkit-print-color-adjust:exact; print-color-adjust:exact;
  hyphens:auto; text-wrap:pretty; orphans:3; widows:3; }
h1,h2,h3 { break-after:avoid; font-weight:700; color:${PAL.royalBlue}; }
h1 { font-size:19pt; line-height:1.12; margin:0 0 4pt; }
h2 { font-size:11.5pt; margin:12pt 0 4pt; color:${ACCENT.hex}; }
p { margin:0 0 5pt; }
b { color:${PAL.midnightNavy}; }
.eyebrow { font-family:${TYPE.sans}; font-size:6.2pt; font-weight:700; letter-spacing:.24em;
  text-transform:uppercase; color:${ACCENT.hex}; margin:0 0 4pt; }
.lead { font-size:9pt; color:${PAL.slateGrey}; margin:0 0 6pt; }

/* Title page */
.title { height:${FMT.h - M.head - M.foot - 4}mm; break-after:page; break-inside:avoid;
  background:${PAL.midnightNavy}; color:${BRAND.paper}; padding:15mm 13mm 11mm;
  display:flex; flex-direction:column; }
.title h1 { color:${BRAND.paper}; font-size:24pt; max-width:11em; }
.title .eyebrow { color:${PAL.champagneGold}; }
.title__rule { height:1.4pt; background:${ACCENT.hex}; width:38mm; margin:9pt 0 11pt; }
.title__sub { font-size:10pt; color:${PAL.platinum}; max-width:21em; }
.title__fill { flex:1; }
.title__meta { font-family:${TYPE.sans}; font-size:6.6pt; color:${PAL.platinum}; line-height:1.75; }

.front { break-after:page; }
.panel { background:${PAL.softCream}; border-left:2pt solid ${ACCENT.hex};
  padding:7pt 9pt; margin:9pt 0; break-inside:avoid; }
.panel__h { font-family:${TYPE.sans}; font-size:7pt; font-weight:700; letter-spacing:.14em;
  text-transform:uppercase; color:${ACCENT.hex}; margin:0 0 4pt; }

.lesson { break-before:page; }
.lesson__head { border-top:2pt solid ${ACCENT.hex}; padding-top:6pt; margin-bottom:8pt;
  break-inside:avoid; break-after:avoid; position:relative; }
.lesson__ref { font-family:${TYPE.sans}; font-size:6.8pt; letter-spacing:.14em;
  color:${PAL.slateGrey}; margin:0; }

.step { margin:0 0 9pt; break-inside:avoid; }
.step__h { font-family:${TYPE.sans}; font-size:7.6pt; font-weight:700; letter-spacing:.13em;
  text-transform:uppercase; color:${PAL.midnightNavy}; margin:0 0 5pt;
  border-bottom:.6pt solid ${PAL.platinum}; padding-bottom:3pt; }
.step__n { display:inline-block; min-width:11pt; height:11pt; line-height:11pt; text-align:center;
  background:${ACCENT.hex}; color:${BRAND.paper}; border-radius:50%; font-size:6.4pt;
  margin-right:5pt; }

.objs { margin:0 0 5pt; padding-left:14pt; }
.objs li { margin:0 0 2.5pt; }
.before { font-size:8.4pt; color:${PAL.slateGrey}; }

table { width:100%; border-collapse:collapse; margin:5pt 0 6pt; font-size:8.4pt; }
thead { display:table-header-group; }
th { text-align:left; font-family:${TYPE.sans}; font-size:6.6pt; font-weight:700;
  letter-spacing:.13em; text-transform:uppercase; color:${PAL.slateGrey};
  border-bottom:.8pt solid ${PAL.slateGrey}; padding:0 5pt 3pt 0; }
td { vertical-align:top; padding:4pt 5pt 4pt 0; border-bottom:.4pt solid ${PAL.platinum}; }
.words td:first-child { width:26%; }
.words td:last-child { width:34%; }
.pos { font-family:${TYPE.sans}; font-size:6.2pt; letter-spacing:.1em; color:${PAL.slateGrey};
  text-transform:uppercase; }
.care { font-size:8pt; color:${PAL.warmCharcoal}; }
.none { color:${PAL.platinum}; }

.task { margin:0 0 4pt; }
.task__k { display:inline-block; font-family:${TYPE.sans}; font-size:6.2pt; font-weight:700;
  letter-spacing:.14em; text-transform:uppercase; color:${ACCENT.hex};
  min-width:15mm; }

.supplied { background:${PAL.softCream}; padding:6pt 8pt; margin:6pt 0 0;
  border-left:2pt solid ${PAL.champagneGold}; break-inside:avoid; }
.supplied__h { font-size:8.4pt; font-style:italic; margin:0 0 4pt; color:${PAL.midnightNavy}; }
.supplied__list { margin:0; padding-left:14pt; font-size:8.6pt; }
.supplied__list li { margin:0 0 2.5pt; }

.solo { border:.6pt solid ${PAL.platinum}; padding:7pt 8pt; break-inside:avoid; }
.solo__serves { font-size:8.2pt; color:${PAL.slateGrey}; margin:0 0 5pt; }
.solo__do { margin:0 0 5pt; }
.solo__chk { font-size:8.6pt; margin:0; padding-top:4pt;
  border-top:.4pt solid ${PAL.platinum}; }

.qs { margin:0 0 6pt; padding-left:14pt; }
.qs li { margin:0 0 7pt; break-inside:avoid; }
.rule { display:block; border-bottom:.4pt solid ${PAL.platinum}; height:11pt; margin-top:2pt; }
.answers-at { font-size:7.8pt; color:${PAL.slateGrey}; font-style:italic; margin:0; }

.returns { font-size:8.2pt; color:${PAL.slateGrey}; border-top:.6pt solid ${PAL.platinum};
  padding-top:5pt; margin-top:8pt; break-inside:avoid; }

.answers { break-before:page; }
.answers__open { border-top:2pt solid ${ACCENT.hex}; padding-top:6pt; margin-bottom:9pt;
  break-inside:avoid; break-after:avoid; }
.ans { break-inside:avoid; margin:0 0 8pt; }
.ans ol { margin:0; padding-left:14pt; }
.ans li { margin:0 0 5pt; break-inside:avoid; }
.ans__q { font-size:8.4pt; color:${PAL.slateGrey}; margin:0 0 1.5pt; }
.ans__a { margin:0 0 1.5pt; }
.ans__t { font-size:8pt; color:${PAL.warmCharcoal}; background:${PAL.softCream};
  padding:3pt 5pt; margin:2pt 0 0; border-left:1.5pt solid ${ACCENT.hex}; }

.fleuron { text-align:center; margin:10pt 0; }
.band { margin:8pt 0; }
</style></head><body>

<section class="title">
  <p class="eyebrow">WorldWide English College Press</p>
  <h1>The IEFC Level I Student Workbook</h1>
  <div class="title__rule"></div>
  <p class="title__sub">${esc(LV.name)} · ${esc(LV.cefr)} · ${LESSONS.length} lessons,
    ${LV.modules.length} modules. The practice, the words, the work you do alone, and a way to
    find out whether you have understood — before anybody marks you.</p>
  <div class="title__fill"></div>
  <p class="title__meta">${FAMILY}<br>
    Edition ${ID.edition} · Revision ${ID.revision} · Impression ${ID.impression}<br>
    ${esc(ID.stamp || '')}</p>
</section>

<section class="front">
  <p class="eyebrow">How to use this book</p>
  <h1>Six steps, every lesson</h1>
  <p class="lead">This book is not the coursebook with the teaching taken out. It is what you do
    with the lesson: before it, between classes, and after it.</p>

  <table><thead><tr><th scope="col">Step</th><th scope="col">What it is</th>
    <th scope="col">When</th></tr></thead><tbody>
    <tr><td><b>1 · What you will be able to do</b></td>
      <td>The lesson's own objectives, so you know what you are working towards.</td>
      <td>Before</td></tr>
    <tr><td><b>2 · Words for this lesson</b></td>
      <td>Every word the lesson teaches, with a sentence you could say and — where English is
        simply arbitrary — a warning.</td><td>Before and after</td></tr>
    <tr><td><b>3 · Practice</b></td>
      <td>The tasks from the lesson, with the material printed here where the task hands you
        something.</td><td>In class and at home</td></tr>
    <tr><td><b>4 · On your own</b></td>
      <td>Something to do alone that gets you ready for the class task, or fixes it afterwards.
        It is not a replacement: the class task needs another person.</td><td>Alone</td></tr>
    <tr><td><b>5 · Check yourself</b></td>
      <td>Three or four questions with the answers at the back. Write something before you
        look.</td><td>After</td></tr>
    <tr><td><b>6 · Take it further</b></td>
      <td>For when you have finished and want more.</td><td>Any time</td></tr>
  </tbody></table>

  <div class="panel">
    <p class="panel__h">Why some things say "in class"</p>
    <p>You cannot practise asking a stranger their name without a stranger. ${solos} of the
      ${LESSONS.length} lessons in this level are designed around talking to another person,
      and that is the point of them rather than a problem with them. Step 4 gets you ready for
      those tasks; it never pretends to be them. If you do only step 4, you will know the words
      and you will not be able to use them.</p>
  </div>

  <div class="panel">
    <p class="panel__h">What this book contains, counted</p>
    <p>${LESSONS.length} lessons · ${words} words with an example sentence for each ·
      ${solos} activities to do alone, each naming the class task it serves ·
      ${prompts} check-yourself questions with answers, ${traps} of them aimed at a mistake
      learners at this level really make. Nothing here was written for this book: every word is
      read from the same academic record the Complete Curriculum is set from.</p>
  </div>
  <div class="fleuron">${fleuron({ colour: ACCENT.hex, width: 84 })}</div>
</section>

${LESSONS.map(lessonSection).join('')}

${answerSection}

<div class="band">${guillocheBand({ width: 150, height: 9, stroke: ACCENT.hex, opacity: 0.5 })}</div>
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
writeFileSync(path.join(ROOT, 'publication', '.workbook.html'), html);

const exe = process.env.PW_CHROMIUM || '/opt/pw-browsers/chromium-1194/chrome-linux/chrome';
const browser = await chromium.launch(existsSync(exe) ? { executablePath: exe } : {});
const page = await browser.newPage();
await page.setContent(html, { waitUntil: 'load' });
const out = path.join(ROOT, 'publication', 'IEFC Level I Student Workbook.pdf');
await page.pdf({
  path: out,
  width: `${FMT.w}mm`,
  height: `${FMT.h}mm`,
  printBackground: true,
  preferCSSPageSize: true,
  displayHeaderFooter: true,
  headerTemplate: runningHead(MARK, { gutter: M.gutter }),
  footerTemplate: runningFoot(VOLUME, { gutter: M.gutter, size: 6.4 }),
  margin: { top: `${M.head}mm`, bottom: `${M.foot}mm`,
    left: `${M.gutter}mm`, right: `${M.fore}mm` },
  tagged: true,
  outline: true,
});
await browser.close();

const pages = (readFileSync(out).toString('latin1').match(/\/Type\s*\/Page(?![s])/g) || []).length;
console.log(`WORKBOOK  ${out}`);
console.log(`  ${pages} pages · ${FMT.w} × ${FMT.h} mm · ${LESSONS.length} lessons · `
  + `${words} words · ${solos} solo activities · ${prompts} prompts (${traps} traps)`);
