/**
 * THE IEFC LEVEL I TEACHER'S COMPANION.
 *
 * ────────────────────────────────────────────────────────────────────
 * WHAT THIS IS NOT
 * ────────────────────────────────────────────────────────────────────
 * It is not the Teacher's Edition. That volume already exists: it is
 * the whole curriculum, every stage of every lesson, set for the desk.
 * A teacher who wants to know WHAT to teach on Tuesday opens that.
 *
 * This is the other question. The lesson plan is in front of them and
 * it is not working: the explanation landed on nobody, one learner is
 * three steps behind and another finished four minutes ago, and the
 * same error has come back for the third week running. Nothing in a
 * lesson plan answers that, because a lesson plan describes the lesson
 * that goes well.
 *
 * So the Companion is organised by DIFFICULTY rather than by sequence.
 * Each lesson gets one spread, and the spread answers, in order:
 *
 *   Before you teach   what the lesson assumes, what it opens up
 *   The difficulty     what goes wrong here, and why it goes wrong
 *   Explaining it      a second route in, an analogy, a board diagram
 *   In the room        the intervention, the smaller version, the
 *                      harder version, the fast route
 *   Afterwards         how to repair the error when it returns
 *
 * ────────────────────────────────────────────────────────────────────
 * THE PART THAT MATTERS MOST: WHERE EACH SENTENCE COMES FROM
 * ────────────────────────────────────────────────────────────────────
 * A teacher is entitled to know whether they are reading a fact about
 * their programme, a finding from the international literature, a
 * designer's proposal, or a report from a real classroom. Those carry
 * different weight and a book that blends them is lying by layout.
 *
 * Every panel in this volume is therefore keyed to one of the record's
 * evidence states, and the key is printed in the front matter rather
 * than buried in a colophon:
 *
 *   DERIVED     read off the programme itself — the prerequisite the
 *               lesson names, the minutes its stages declare, the
 *               confusion its own self-check trap is built to catch.
 *   ESTABLISHED attested in the international teaching of English and
 *               not particular to this institution.
 *   DESIGNED    a judgement by the people who wrote the curriculum.
 *               Defensible, arguable, and improvable by the first
 *               teacher who tries it and finds better.
 *
 * There is a fourth state, OBSERVED, and this book does not use it
 * once. Nothing here reports what happened in a room, because nothing
 * has happened in a room: the College has taught nobody. When it has,
 * the observed layer is where a year of teaching goes, and the panels
 * that are DESIGNED today become the first things to be corrected.
 *
 * That is stated on the page, not only here. A teacher who thinks they
 * are reading experience when they are reading design will trust the
 * wrong sentence at the wrong moment.
 *
 * Nothing in this volume is composed for it. Every objective, mistake,
 * explanation, analogy and intervention is read from the academic
 * record.
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
import { legacyBlock } from './legacy.mjs';
import { formatFor, marginsFor, familyColours } from './house.mjs';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..');
const dash = (s) => String(s ?? '').replace(/\s--\s/g, ' — ');
const esc = (s) => dash(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');

const FAMILY = 'IEFC Teacher Series';
const FMT = formatFor('reference');
const ACCENT = familyColours().find((c) => c.family === FAMILY);
const LEVEL = 'I';

// How the record's five states are shown to a teacher. 'not_yet_evidenced'
// never reaches a panel — an empty field is simply absent — and
// 'observed_in_teaching' is mapped so that the day it carries something,
// this book prints it correctly rather than silently mislabelling it.
const STATE = {
  derived_from_curriculum: { key: 'DERIVED', hue: PAL.royalBlue },
  established_pedagogy: { key: 'ESTABLISHED', hue: PAL.slateGrey },
  educational_expertise: { key: 'DESIGNED', hue: ACCENT.hex },
  observed_in_teaching: { key: 'OBSERVED', hue: PAL.midnightNavy },
};

// ─────────────────────────────────────────────────────────────────────
// THE MODEL
// ─────────────────────────────────────────────────────────────────────

function build() {
  const db = new DatabaseSync(':memory:');
  db.exec(readFileSync(`${ROOT}/sql/schema.sql`, 'utf8'));
  for (let n = 1; n <= 6; n++) {
    db.exec(readFileSync(`${ROOT}/sql/seed-curriculum-level-${n}.sql`, 'utf8'));
    db.exec(readFileSync(`${ROOT}/sql/seed-audio-level-${n}.sql`, 'utf8'));
  }
  for (const f of ['seed-exercises', 'seed-selfchecks', 'seed-pedagogy',
    'seed-vocabulary-level-1', 'seed-solo-level-1', 'seed-competency-level-1',
    'seed-pedagogy-level-1', 'seed-teaching-expertise-level-1']) {
    db.exec(readFileSync(`${ROOT}/sql/${f}.sql`, 'utf8'));
  }
  const REF = `l.roman || '.' || u.sequence || '.' || i.sequence`;
  const LVL = `JOIN units u ON u.id = i.unit_id
               JOIN courses c ON c.id = u.course_id
               JOIN programme_levels l ON l.id = c.level_id
              WHERE l.roman = '${LEVEL}'`;

  const rows = db.prepare(
    `SELECT ${REF} AS ref, e.field_key, e.value, e.evidence_state
       FROM pedagogy_entries e
       JOIN learning_items i ON i.id = e.learning_item_id ${LVL}
        AND e.value IS NOT NULL AND TRIM(e.value) <> ''
      ORDER BY u.sequence, i.sequence`).all();

  // The index. Every target item the level teaches, with the lesson
  // that teaches it and whether the record holds a caution about it.
  // Read from the vocabulary sets rather than parsed out of prose:
  // an index built by regex over teaching text drifts the first time
  // somebody rewrites a sentence.
  const index = db.prepare(
    `SELECT ${REF} AS ref, vi.headword, vi.note
       FROM vocabulary_items vi
       JOIN vocabulary_sets vs ON vs.id = vi.vocabulary_set_id
       JOIN learning_items i ON i.id = vs.learning_item_id ${LVL}
      ORDER BY LOWER(vi.headword)`).all();
  db.close();

  const byRef = new Map();
  for (const r of rows) {
    if (!byRef.has(r.ref)) byRef.set(r.ref, {});
    byRef.get(r.ref)[r.field_key] = { value: r.value, state: r.evidence_state };
  }
  return { byRef, index };
}

const { byRef: PED, index: INDEX } = build();
const C = buildCurriculum();
const ID = publicationIdentity(C, { edition: 1, revision: 0, impression: 1 });
const LV = C.levels.find((l) => l.roman === LEVEL);

// A lesson belongs in the Companion when the record has something to
// say about teaching it. Selecting on the pedagogy rather than on the
// lesson kind means the book cannot claim a spread it has no content
// for, and cannot silently drop a lesson that gained content later.
const LESSONS = [...walk(C)]
  .filter(({ lv, ref }) => lv.roman === LEVEL && PED.has(ref)
    && PED.get(ref).common_mistakes)
  .map(({ ref, mod, item }) => ({ ref, module: mod, title: item.title, ped: PED.get(ref) }));

const M = marginsFor('reference', LESSONS.length * 4 + 30);

// ─────────────────────────────────────────────────────────────────────
// THE PAGES
// ─────────────────────────────────────────────────────────────────────

// Every panel carries its provenance. A panel whose field is empty is
// not printed at all — a heading over nothing teaches a teacher to stop
// reading the headings.
function panel(label, entry) {
  if (!entry || !entry.value) return '';
  const s = STATE[entry.state];
  if (!s) throw new Error(`Unknown evidence state "${entry.state}" for ${label}`);
  return `
<div class="p">
  <p class="p__h">${esc(label)}<span class="tag" style="color:${s.hue};border-color:${s.hue}">${s.key}</span></p>
  <p class="p__b">${esc(entry.value)}</p>
</div>`;
}

const group = (title, panels) => {
  const body = panels.filter(Boolean).join('');
  return body ? `<div class="grp"><h2>${esc(title)}</h2>${body}</div>` : '';
};

const lessonSection = (L) => {
  const p = L.ped;
  const mins = p.time_required ? `<span class="mins">${esc(p.time_required.value)}</span>` : '';
  return `
<section class="lesson">
  <header class="lesson__head">
    <p class="eyebrow">${esc(L.module.title)}</p>
    <p class="lesson__ref">CURRICULUM REF ${esc(L.ref)}${mins}</p>
    <h1>${esc(L.title)}</h1>
  </header>
  ${group('Before you teach', [
    panel('What this lesson assumes', p.prerequisite_concepts),
    panel('What it opens up', p.concepts_unlocked),
  ])}
  ${group('The difficulty', [
    panel('What goes wrong', p.common_mistakes),
    panel('Why it goes wrong', p.why_mistakes),
    panel('What gets confused with what', p.confusable_concepts),
  ])}
  ${group('Explaining it', [
    panel('If the first explanation fails', p.alternative_explanation),
    panel('An analogy', p.analogy),
    panel('On the board', p.visual_explanation),
  ])}
  ${group('In the room', [
    panel('When it is not working', p.intervention),
    panel('For the learner who is behind', p.differentiate_down),
    panel('For the learner who is ahead', p.stretch),
    panel('If the group already has it', p.faster_explanation),
  ])}
  ${group('Afterwards', [
    panel('When the error comes back', p.remediation),
  ])}
</section>`;
};

// ─────────────────────────────────────────────────────────────────────
// Counts printed in the front matter are MEASURED FROM THE RENDERED
// BODY, not from the record the body was drawn from. The two are not
// the same number and the difference is not academic: the record holds
// 93 derived cells for Level I, but 19 of them are time_required, which
// this book prints as a line of stage time in the lesson header rather
// than as a marked panel. Counting the record made the front matter
// promise 93 marks and the body carry 74.
//
// Composing the body first and counting what came out removes the class
// of error rather than the instance of it. The front matter cannot
// drift from the book again, whatever fields are added or moved later.
// ─────────────────────────────────────────────────────────────────────
const BODY = LESSONS.map(lessonSection).join('');

// ─────────────────────────────────────────────────────────────────────
// THE INDEX, AND THE TWO VOLUMES IT REPLACES
// ─────────────────────────────────────────────────────────────────────
// The Stage 1 register carried an Intervention Guide and a
// Differentiation Guide as separate titles. Both became buildable when
// the teaching-support layer was completed, and building either would
// have reprinted panels this book already prints — nineteen
// interventions and nineteen remediations in one, nineteen
// differentiate-downs and nineteen stretches in the other. Two more
// volumes, no more teaching.
//
// What they would genuinely have offered is a different way in. This
// book is ordered by lesson, and a teacher whose learner is stuck does
// not necessarily know which lesson caused it. That is an index
// problem, not a volume problem, and it is solved here: 199 target
// items, alphabetical, each pointing at the lesson that teaches it and
// therefore at the spread that says what goes wrong with it.
//
// One book that can be entered two ways beats three books that cannot
// be kept in step with each other.
const cautioned = INDEX.filter((x) => x.note && x.note.trim()).length;
// Eighteen, not nineteen: the revision lesson consolidates the level
// and introduces no new items, so it contributes nothing to an index of
// target items. Counting the lessons in the book here would have said
// nineteen and been wrong by one — the kind of number a reader checks.
const indexedLessons = new Set(INDEX.map((x) => x.ref)).size;
const indexSection = `
<section class="index">
  <p class="eyebrow">Index</p>
  <h1>Every target item, and where it is taught.</h1>
  <p class="lead">${INDEX.length} items from the ${indexedLessons} lessons of Level I that
    introduce new language, in
    alphabetical order. A dot marks an item the record holds a caution about — a point at
    which English is arbitrary and has to be learned rather than reasoned out. The reference
    is the lesson spread, where the difficulty and what to do about it are set out.</p>
  <ul class="idx">
    ${INDEX.map((x) => `<li>${x.note && x.note.trim() ? '<b class="dot">&middot;</b>' : '<span class="dot"></span>'}${esc(x.headword)}<span class="idx__r">${esc(x.ref)}</span></li>`).join('')}
  </ul>
</section>`;
const printed = (mark) =>
  (BODY.match(new RegExp(`class="tag"[^>]*>${mark}<`, 'g')) || []).length;
const designed = printed('DESIGNED');
const derived = printed('DERIVED');
const established = printed('ESTABLISHED');
const observed = printed('OBSERVED');
const panelCount = designed + derived + established + observed;

// The record's own totals, kept only to explain the gap in the book
// itself. A reader who counts 74 derived panels and reads "93 entries"
// somewhere else is owed the reason.
const cells = LESSONS.flatMap((L) => Object.values(L.ped));
const minutesShown = LESSONS.filter((L) => L.ped.time_required).length;

const LEGACY = legacyBlock({
  id: ID,
  title: "The IEFC Level I Teacher's Companion",
  family: FAMILY,
  audience: 'Instructors teaching IEFC Level I, in preparation and during the lesson',
  subjects: ['English language — Study and teaching',
    'English language — Study and teaching — Foreign speakers',
    'Language teachers — Handbooks, manuals, etc.'],
  artefact: "publication/IEFC Level I Teacher's Companion.pdf",
  siblings: ['publication/.companion.html'],
  relatives: [],
  ink: PAL.royalBlue, rule: PAL.platinum, soft: PAL.slateGrey, accent: ACCENT.hex,
  panel: PAL.softCream,
});

const html = `<!doctype html><html lang="en-GB"><head><meta charset="utf-8">
<title>The IEFC Level I Teacher's Companion</title>
<style>
@page { size:${FMT.w}mm ${FMT.h}mm; margin:${M.head}mm ${M.fore}mm ${M.foot}mm ${M.gutter}mm; }
@page :left  { margin-left:${M.fore}mm; margin-right:${M.gutter}mm; }
@page :right { margin-left:${M.gutter}mm; margin-right:${M.fore}mm; }
* { box-sizing:border-box; }
body { margin:0; font-family:${TYPE.serif}; font-size:9.4pt; line-height:1.54;
  color:${PAL.warmCharcoal}; background:${BRAND.paper};
  -webkit-print-color-adjust:exact; print-color-adjust:exact;
  hyphens:auto; text-wrap:pretty; orphans:3; widows:3; }
h1,h2 { break-after:avoid; font-weight:700; color:${PAL.royalBlue}; }
h1 { font-size:16pt; line-height:1.14; margin:0 0 3pt; }
h2 { font-size:8pt; margin:11pt 0 5pt; color:${ACCENT.hex}; font-family:${TYPE.sans};
  letter-spacing:.18em; text-transform:uppercase; border-bottom:.6pt solid ${PAL.platinum};
  padding-bottom:3pt; }
p { margin:0 0 5pt; }
.eyebrow { font-family:${TYPE.sans}; font-size:6pt; font-weight:700; letter-spacing:.24em;
  text-transform:uppercase; color:${ACCENT.hex}; margin:0 0 3pt; }

/* Title page */
.title { height:${FMT.h - M.head - M.foot - 4}mm; break-after:page; break-inside:avoid;
  background:${PAL.midnightNavy}; color:${BRAND.paper}; padding:14mm 12mm 10mm;
  display:flex; flex-direction:column; }
.title h1 { color:${BRAND.paper}; font-size:21pt; max-width:11em; }
.title .eyebrow { color:${PAL.champagneGold}; }
.title__rule { height:1.4pt; background:${ACCENT.hex}; width:34mm; margin:8pt 0 10pt; }
.title__sub { font-size:9.5pt; color:${PAL.platinum}; max-width:21em; }
.title__fill { flex:1; }
.title__meta { font-family:${TYPE.sans}; font-size:6.4pt; color:${PAL.platinum}; line-height:1.75; }

.front { break-after:page; }
.front h1 { font-size:14pt; margin-bottom:6pt; }
.lead { font-size:9pt; color:${PAL.slateGrey}; margin:0 0 7pt; }

/* The evidence key — the front matter's real work */
.key { margin:8pt 0 0; }
.key__row { display:flex; gap:7pt; align-items:flex-start; margin:0 0 6pt;
  break-inside:avoid; }
.key__t { flex:0 0 20mm; }
.key__d { flex:1; font-size:8.6pt; }
.absent { background:${PAL.softCream}; border-left:2pt solid ${PAL.midnightNavy};
  padding:7pt 9pt; margin:9pt 0 0; break-inside:avoid; }
.absent__h { font-family:${TYPE.sans}; font-size:6.8pt; font-weight:700; letter-spacing:.14em;
  text-transform:uppercase; color:${PAL.midnightNavy}; margin:0 0 4pt; }

.tag { font-family:${TYPE.sans}; font-size:5.6pt; font-weight:700; letter-spacing:.14em;
  border:.6pt solid; border-radius:2pt; padding:.8pt 3pt; margin-left:6pt;
  vertical-align:1.5pt; white-space:nowrap; }

.lesson { break-before:page; }
.lesson__head { border-top:2pt solid ${ACCENT.hex}; padding-top:5pt; margin-bottom:2pt;
  break-inside:avoid; break-after:avoid; }
.lesson__ref { font-family:${TYPE.sans}; font-size:6.6pt; letter-spacing:.14em;
  color:${PAL.slateGrey}; margin:0 0 3pt; }
.mins { float:right; letter-spacing:.06em; }

.grp { break-inside:avoid-page; }
.p { margin:0 0 7pt; break-inside:avoid; }
.p__h { font-family:${TYPE.sans}; font-size:7pt; font-weight:700; letter-spacing:.1em;
  text-transform:uppercase; color:${PAL.midnightNavy}; margin:0 0 3pt; }
.p__b { margin:0; }

.index { break-before:page; }
.index h1 { font-size:14pt; margin-bottom:5pt; }
.idx { column-count:2; column-gap:7mm; list-style:none; margin:8pt 0 0; padding:0;
  font-size:8pt; line-height:1.42; }
.idx li { break-inside:avoid; padding:0 0 1.2pt; display:flex; align-items:baseline;
  border-bottom:.3pt solid ${PAL.softCream}; }
.idx .dot { display:inline-block; width:5pt; flex:0 0 5pt; color:${ACCENT.hex}; }
.idx__r { margin-left:auto; padding-left:4pt; font-family:${TYPE.sans}; font-size:6.4pt;
  color:${PAL.slateGrey}; letter-spacing:.06em; white-space:nowrap; }

.band { text-align:center; margin:10pt 0 0; }
.fleuron { text-align:center; margin:9pt 0; }
</style></head><body>

<section class="title">
  <p class="eyebrow">${esc(FAMILY)}</p>
  <h1>The IEFC Level I Teacher's Companion</h1>
  <div class="title__rule"></div>
  <p class="title__sub">What to do when the lesson plan is not enough: the difficulty in
    each lesson, a second way to explain it, and what to do for the learner who is behind
    and the learner who is ahead.</p>
  <div class="title__fill"></div>
  <div class="title__meta">
    ${esc(LV ? `Level ${LV.roman} — ${LV.name}` : `Level ${LEVEL}`)}<br>
    ${LESSONS.length} lessons · ${panelCount} panels<br>
    ${esc(ID.edition || 'First edition')}<br>
    Worldwide English College Press
  </div>
</section>

<section class="front">
  <p class="eyebrow">How to read this book</p>
  <h1>Every sentence says where it came from.</h1>
  <p class="lead">A teacher is entitled to know whether they are reading a fact about this
    programme, a finding from the international teaching of English, or a proposal from the
    people who designed the curriculum. Those carry different weight, and a book that blends
    them is misleading by layout rather than by wording. Each panel in this volume is
    therefore marked.</p>

  <div class="key">
    <div class="key__row">
      <div class="key__t"><span class="tag" style="color:${PAL.royalBlue};border-color:${PAL.royalBlue}">DERIVED</span></div>
      <div class="key__d">Read off the programme itself — the prerequisite the lesson names,
        the minutes its stages declare, the confusion its own self-check trap is built to
        catch. ${derived} panels, plus the stage time printed in each lesson header.</div>
    </div>
    <div class="key__row">
      <div class="key__t"><span class="tag" style="color:${PAL.slateGrey};border-color:${PAL.slateGrey}">ESTABLISHED</span></div>
      <div class="key__d">Attested in the international teaching of English, and not
        particular to this institution. ${established} panels.</div>
    </div>
    <div class="key__row">
      <div class="key__t"><span class="tag" style="color:${ACCENT.hex};border-color:${ACCENT.hex}">DESIGNED</span></div>
      <div class="key__d">A judgement by the people who wrote the curriculum. Defensible,
        arguable, and improvable by the first teacher who tries it and finds better.
        ${designed} panels.</div>
    </div>
  </div>

  <div class="absent">
    <p class="absent__h">The fourth mark, and why it appears ${observed === 0 ? 'nowhere' : 'here'}</p>
    <p>There is a fourth kind of knowledge about teaching: what actually happened, in a real
      room, with real learners. It cannot be reasoned out and it cannot be written in
      advance. This edition carries ${observed === 0 ? 'none of it' : `${observed} entries of it`},
      because the College has taught nobody yet, and a book that dressed a designer's proposal
      as a classroom finding would be asking for trust it has not earned.</p>
    <p>So read the ${designed} DESIGNED panels as what they are: careful, defensible starting
      points, written by people who know the curriculum and have not met your class. The first
      teacher to run this level will know things this book does not. That is the intended
      order of events, and the observed layer is where their year goes.</p>
  </div>
  <div class="fleuron">${fleuron({ colour: ACCENT.hex, width: 76 })}</div>
</section>

${BODY}

${indexSection}

<div class="band">${guillocheBand({ width: 140, height: 9, stroke: ACCENT.hex, opacity: 0.5 })}</div>
${LEGACY}
</body></html>`;

mkdirSync(path.join(ROOT, 'publication'), { recursive: true });
writeFileSync(path.join(ROOT, 'publication', '.companion.html'), html);

const exe = process.env.PW_CHROMIUM || '/opt/pw-browsers/chromium-1194/chrome-linux/chrome';
const browser = await chromium.launch(existsSync(exe) ? { executablePath: exe } : {});
const page = await browser.newPage();
await page.setContent(html, { waitUntil: 'load' });
const out = path.join(ROOT, 'publication', "IEFC Level I Teacher's Companion.pdf");
await page.pdf({
  path: out,
  width: `${FMT.w}mm`,
  height: `${FMT.h}mm`,
  printBackground: true,
  preferCSSPageSize: true,
  displayHeaderFooter: true,
  headerTemplate: '<div></div>',
  footerTemplate: `<div style="font:400 6.4pt Calibri,Arial,sans-serif;color:${PAL.slateGrey};`
    + `width:100%;padding:0 ${M.gutter}mm;display:flex;justify-content:space-between;">`
    + "<span>The IEFC Level I Teacher's Companion</span><span class=\"pageNumber\"></span></div>",
  margin: { top: `${M.head}mm`, bottom: `${M.foot}mm`,
    left: `${M.gutter}mm`, right: `${M.fore}mm` },
  tagged: true,
  outline: true,
});
await browser.close();

const pages = (readFileSync(out).toString('latin1').match(/\/Type\s*\/Page(?![s])/g) || []).length;
console.log(`COMPANION  ${out}`);
console.log(`  ${pages} pages · ${FMT.w} × ${FMT.h} mm · ${LESSONS.length} lessons · `
  + `${panelCount} panels (${derived} derived, ${established} established, `
  + `${designed} designed, ${observed} observed) · ${minutesShown} stage times in headers · `
  + `${cells.length} record cells behind them\n  index: ${INDEX.length} target items `
  + `(${cautioned} cautioned) — replaces the Intervention and Differentiation Guides`);
