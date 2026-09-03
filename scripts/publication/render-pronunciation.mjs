/**
 * THE IEFC PRONUNCIATION HANDBOOK.
 *
 * The first publication derived from the catalogue rather than written
 * for it, and the first to be set at a format other than the flagship's.
 *
 * ────────────────────────────────────────────────────────────────────
 * WHAT WAS ALREADY THERE
 * ────────────────────────────────────────────────────────────────────
 * 180 pronunciation targets, each naming a focus, a target, a worked
 * example and a paragraph of guidance. 114 pronunciation stages inside
 * the teaching lessons, with their timings. 60 model-pronunciation
 * scripts written for the audio platform. All of it authored, all of it
 * in the academic database, none of it ever set as a book — a teacher
 * who wanted to see the whole pronunciation strand had to open 114
 * lessons one at a time.
 *
 * Nothing here is written. Every word of content is read from the
 * database, and the editorial work is the part that a database cannot
 * do: sequence, grouping, apparatus, and the decision about what a
 * reader consulting this book is actually looking for.
 *
 * ────────────────────────────────────────────────────────────────────
 * THE ONE EDITORIAL JUDGEMENT WORTH RECORDING
 * ────────────────────────────────────────────────────────────────────
 * The obvious arrangement is by level, because that is how the
 * curriculum is ordered. It is also the wrong one for this book. A
 * teacher reaching for a pronunciation handbook is not asking "what
 * comes next"; they are asking "my class cannot hear the difference
 * between these two sounds — where is that taught?"
 *
 * So the book is ordered BY FOCUS — phonemes, word stress, sentence
 * stress, rhythm, intonation, connected speech — and the level sequence
 * is preserved inside each focus and recovered by a second index. The
 * curriculum order is not lost; it is demoted to where a reference book
 * needs it.
 *
 * The format follows the house identity: royal octavo, the trim of a
 * book consulted standing up rather than read through.
 */
import { writeFileSync, mkdirSync, existsSync, readFileSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { DatabaseSync } from 'node:sqlite';
import { chromium } from 'playwright';
import { buildCurriculum } from './curriculum.mjs';
import { TYPE, C as PAL, BRAND } from './design.mjs';
import { crest, fleuron, guillocheBand } from './ornament.mjs';
import { publicationIdentity } from './identity.mjs';
import { editionMark, runningHead, runningFoot, rightsPage } from './rights.mjs';
import { legacyBlock, ecosystem } from './legacy.mjs';
import { formatFor, marginsFor, familyColours } from './house.mjs';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..');
// The curriculum source writes the dash as a double hyphen, because it
// was authored as plain text for a database rather than for a page.
// Setting it as typed would put "-- is the commonest" in a printed
// book; the flagship converts it and so does this.
const dash = (s) => String(s ?? '').replace(/\s--\s/g, ' — ');
const esc = (s) => dash(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');

const FAMILY = 'IEFC Reference Library';
const FMT = formatFor('reference');
const M = marginsFor('reference', 200);
const ACCENT = familyColours().find((c) => c.family === FAMILY);

// ─────────────────────────────────────────────────────────────────────
// THE MODEL
// ─────────────────────────────────────────────────────────────────────

const FOCUSES = [
  { key: 'phoneme', name: 'Individual sounds',
    gloss: 'A single consonant or vowel a learner’s first language does not use, or uses '
      + 'differently. The hardest to hear and the quickest to fossilise.' },
  { key: 'word_stress', name: 'Word stress',
    gloss: 'Which syllable of a word carries the beat. English listeners recognise words by '
      + 'their stress pattern before they parse the sounds, so a misplaced stress can make a '
      + 'correctly pronounced word unrecognisable.' },
  { key: 'sentence_stress', name: 'Sentence stress',
    gloss: 'Which words in an utterance are given weight. It carries meaning: the same '
      + 'sentence stressed differently is a different statement.' },
  { key: 'rhythm', name: 'Rhythm',
    gloss: 'English is stress-timed — the beats fall at roughly even intervals and the '
      + 'unstressed syllables compress to fit. Learners from syllable-timed languages have to '
      + 'unlearn evenness.' },
  { key: 'intonation', name: 'Intonation',
    gloss: 'The melody of the utterance: where the pitch rises, falls, and where it does both. '
      + 'It carries attitude, and getting it wrong sounds like rudeness rather than error.' },
  { key: 'connected_speech', name: 'Connected speech',
    gloss: 'What happens to words when they meet: linking, elision, assimilation, weak forms. '
      + 'The single largest cause of "I can read it but I cannot hear it".' },
];

function build() {
  const db = new DatabaseSync(':memory:');
  db.exec(readFileSync(`${ROOT}/sql/schema.sql`, 'utf8'));
  for (let n = 1; n <= 6; n++) {
    db.exec(readFileSync(`${ROOT}/sql/seed-curriculum-level-${n}.sql`, 'utf8'));
    db.exec(readFileSync(`${ROOT}/sql/seed-audio-level-${n}.sql`, 'utf8'));
  }

  // Every target, with the lesson, module and level it belongs to, and
  // the model script for its module — joined through the declared
  // foreign keys rather than through the shape of the identifiers.
  const targets = db.prepare(`
    SELECT t.sequence, t.focus, t.target, t.example, t.guidance,
           i.title AS lessonTitle, i.sequence AS lessonSeq,
           u.sequence AS moduleSeq, u.title AS moduleTitle,
           l.roman, l.name AS levelName, l.cefr,
           a.transcript AS model
      FROM pronunciation_targets t
      JOIN learning_items i ON i.id = t.learning_item_id
      JOIN units u ON u.id = i.unit_id
      JOIN courses c ON c.id = u.course_id
      JOIN programme_levels l ON l.id = c.level_id
      LEFT JOIN audio_assets a ON a.id = i.audio_asset_id AND a.kind = 'model_pronunciation'
     ORDER BY l.id, u.sequence, i.sequence, t.sequence`).all();

  const models = db.prepare(`
    SELECT a.title, a.transcript, a.variety, a.target_wpm AS wpm,
           u.sequence AS moduleSeq, u.title AS moduleTitle, l.roman
      FROM audio_assets a
      JOIN learning_items i ON i.audio_asset_id = a.id
      JOIN units u ON u.id = i.unit_id
      JOIN courses c ON c.id = u.course_id
      JOIN programme_levels l ON l.id = c.level_id
     WHERE a.kind = 'model_pronunciation'
     GROUP BY a.id
     ORDER BY l.id, u.sequence`).all();

  db.close();
  return { targets, models };
}

const { targets, models } = build();
const C = buildCurriculum();
const ID = publicationIdentity(C, { edition: 1, revision: 0, impression: 1 });

// This volume's name and its edition mark, printed on every page it
// prints. The mark is derived from the volume and from the curriculum
// edition it was set from, so a page found somewhere else names the
// edition it was taken from — see rights.mjs.
const VOLUME = 'The IEFC Pronunciation Handbook';
const MARK = editionMark('pronunciation', ID.contentDigest);

// The classroom stages, from the lessons themselves: what the teacher
// does with the target, and how long it is designed to take.
const stages = [];
for (const lv of C.levels) {
  for (const mod of lv.modules) {
    for (const item of mod.lessons) {
      const st = item.stages.find((s) => s.icon === 'pronunciation');
      if (!st) continue;
      stages.push({
        ref: `${lv.roman}.${mod.sequence}.${item.sequence}`,
        roman: lv.roman,
        moduleSeq: mod.sequence,
        lessonTitle: item.title,
        timing: st.timing,
        text: st.parts.map((p) => p.text).join(' ').trim(),
      });
    }
  }
}

const ROMANS = ['I', 'II', 'III', 'IV', 'V', 'VI'];
const byFocus = FOCUSES.map((f) => ({
  ...f,
  rows: targets.filter((t) => t.focus === f.key),
}));
const stageFor = (roman, moduleSeq) =>
  stages.filter((s) => s.roman === roman && s.moduleSeq === moduleSeq);

const REF = (t) => `${t.roman}.${t.moduleSeq}`;

// ─────────────────────────────────────────────────────────────────────
// THE PAGES
// ─────────────────────────────────────────────────────────────────────

const focusSection = (f, i) => `
<section class="focus">
  <div class="focus__open">
    <p class="eyebrow">Part ${ROMANS[i]} of ${FOCUSES.length}</p>
    <h1>${esc(f.name)}</h1>
    <p class="focus__gloss">${esc(f.gloss)}</p>
    <p class="focus__count">${f.rows.length} target${f.rows.length === 1 ? '' : 's'} across
      ${new Set(f.rows.map(REF)).size} modules ·
      ${ROMANS.filter((r) => f.rows.some((t) => t.roman === r)).join(' · ') || 'no level'}</p>
  </div>
  ${ROMANS.filter((r) => f.rows.some((t) => t.roman === r)).map((roman) => {
    const rows = f.rows.filter((t) => t.roman === roman);
    return `<div class="lvl">
      <h2>Level ${esc(roman)} · ${esc(rows[0].levelName)} <span>${esc(rows[0].cefr)}</span></h2>
      ${rows.map((t) => `<article class="tgt">
        <header>
          <h3>${esc(t.target)}</h3>
          <span class="tgt__ref">${esc(REF(t))}</span>
        </header>
        <p class="tgt__ex">${esc(t.example)}</p>
        <p class="tgt__gd">${esc(t.guidance)}</p>
        <p class="tgt__src">${esc(t.moduleTitle)} · ${esc(t.lessonTitle)}</p>
      </article>`).join('')}
    </div>`;
  }).join('')}
</section>`;

const curriculumOrder = ROMANS.map((roman) => {
  const rows = targets.filter((t) => t.roman === roman);
  const mods = [...new Set(rows.map((t) => t.moduleSeq))].sort((a, b) => a - b);
  return `<div class="ord">
    <h2>Level ${esc(roman)}</h2>
    <table><thead><tr><th scope="col">Module</th><th scope="col">Targets</th>
      <th scope="col">Focus</th><th scope="col">Classroom stage</th></tr></thead><tbody>
      ${mods.map((m) => {
    const rs = rows.filter((t) => t.moduleSeq === m);
    const st = stageFor(roman, m);
    const mins = st.reduce((n, s) => n + (parseInt(s.timing, 10) || 0), 0);
    return `<tr><td class="nowrap"><b>${roman}.${m}</b><br><span class="small">${
      esc(rs[0].moduleTitle.replace(/^Module \d+:\s*/, ''))}</span></td>
      <td class="mono">${rs.length}</td>
      <td>${[...new Set(rs.map((r) => FOCUSES.find((f) => f.key === r.focus).name))].join(', ')}</td>
      <td class="mono">${st.length} lesson${st.length === 1 ? '' : 's'}${
  mins ? ` · ${mins} min` : ''}</td></tr>`;
  }).join('')}
    </tbody></table>
  </div>`;
}).join('');

const modelSection = `
<section class="focus">
  <div class="focus__open">
    <p class="eyebrow">Appendix A</p>
    <h1>The model scripts</h1>
    <p class="focus__gloss">One model per module, written for the audio programme. The recordings
      have not been produced: ${models.length} scripts exist and no audio file does. They are
      printed here because a teacher can read a model aloud, and a script nobody can see is a
      script nobody can use.</p>
  </div>
  ${ROMANS.map((roman) => {
    const rows = models.filter((m) => m.roman === roman);
    if (!rows.length) return '';
    return `<div class="lvl">
      <h2>Level ${esc(roman)}</h2>
      ${rows.map((m) => `<article class="mdl">
        <header><h3>${esc(m.moduleTitle.replace(/^Module \d+:\s*/, ''))}</h3>
          <span class="tgt__ref">${esc(roman)}.${m.moduleSeq}</span></header>
        <p class="mdl__lines">${m.transcript.split('|').map((l) =>
    `<span>${esc(l.trim())}</span>`).join('')}</p>
        <p class="tgt__src">${esc(m.variety)} · ${m.wpm} words per minute</p>
      </article>`).join('')}
    </div>`;
  }).join('')}
</section>`;

const RECORD = ecosystem().find((r) => /Pronunciation Handbook/.test(r.name));
const LEGACY = legacyBlock({
  id: ID,
  title: 'The IEFC Pronunciation Handbook',
  family: FAMILY,
  audience: RECORD ? RECORD.audience : 'Learners and teachers across all six levels',
  subjects: ['English language — Pronunciation', 'English language — Study and teaching',
    'Phonetics', 'English language — Spoken English'],
  artefact: 'publication/IEFC Pronunciation Handbook.pdf',
  siblings: ['publication/.pronunciation.html'],
  relatives: RECORD ? RECORD.relatives : [],
  maturity: RECORD ? RECORD.maturity : undefined,
  ink: PAL.royalBlue, rule: PAL.platinum, soft: PAL.slateGrey, accent: ACCENT.hex,
  panel: PAL.softCream,
});

const html = `<!doctype html><html lang="en-GB"><head><meta charset="utf-8">
<title>The IEFC Pronunciation Handbook</title>
<style>
@page { size:${FMT.w}mm ${FMT.h}mm; margin:${M.head}mm ${M.fore}mm ${M.foot}mm ${M.gutter}mm; }
@page :left  { margin-left:${M.fore}mm; margin-right:${M.gutter}mm; }
@page :right { margin-left:${M.gutter}mm; margin-right:${M.fore}mm; }
* { box-sizing:border-box; }
body { margin:0; font-family:${TYPE.serif}; font-size:9.2pt; line-height:1.5;
  color:${PAL.warmCharcoal}; background:${BRAND.paper};
  -webkit-print-color-adjust:exact; print-color-adjust:exact;
  hyphens:auto; text-wrap:pretty; orphans:3; widows:3; }
h1,h2,h3 { break-after:avoid; font-weight:700; color:${PAL.royalBlue}; }
h1 { font-size:21pt; line-height:1.12; margin:0 0 6pt; }
h2 { font-size:12.5pt; margin:14pt 0 5pt; color:${ACCENT.hex}; }
h2 span { font-family:${TYPE.sans}; font-size:7pt; letter-spacing:.16em; color:${PAL.slateGrey};
  margin-left:5pt; }
h3 { font-size:10pt; margin:0; color:${PAL.midnightNavy}; }
p { margin:0 0 5pt; }
.eyebrow { font-family:${TYPE.sans}; font-size:6.2pt; font-weight:700; letter-spacing:.26em;
  text-transform:uppercase; color:${ACCENT.hex}; margin:0 0 5pt; }
.small { font-family:${TYPE.sans}; font-size:6.8pt; color:${PAL.slateGrey}; }
.mono { font-family:"Consolas","DejaVu Sans Mono",monospace; font-size:7pt; }
.nowrap { white-space:nowrap; }

/* Title page: a deep panel filling the text area. The printed cover is
   a separate artefact at the cover trim, as Part Three of the Press
   Constitution requires. */
.title { height:${FMT.h - M.head - M.foot - 4}mm; break-after:page; break-inside:avoid;
  background:${PAL.midnightNavy}; color:${BRAND.paper}; padding:16mm 14mm 12mm;
  display:flex; flex-direction:column; }
.title h1 { color:${BRAND.paper}; font-size:25pt; max-width:12em; }
.title .eyebrow { color:${PAL.champagneGold}; }
.title__rule { height:1.4pt; background:${ACCENT.hex}; width:40mm; margin:10pt 0 12pt; }
.title__sub { font-size:10.5pt; color:${PAL.platinum}; max-width:22em; }
.title__fill { flex:1; }
.title__meta { font-family:${TYPE.sans}; font-size:6.8pt; color:${PAL.platinum}; line-height:1.75; }

.focus { break-before:page; }
.focus__open { break-inside:avoid; break-after:avoid; border-top:2pt solid ${ACCENT.hex};
  padding-top:9pt; margin-bottom:12pt; }
.focus__gloss { font-size:10pt; color:${PAL.imperialBlue}; margin:6pt 0 5pt; }
.focus__count { font-family:${TYPE.sans}; font-size:6.8pt; letter-spacing:.1em;
  text-transform:uppercase; color:${PAL.slateGrey}; margin:0; }
.lvl { break-inside:auto; }
.lvl h2 { break-after:avoid; border-bottom:.5pt solid ${PAL.platinum}; padding-bottom:3pt; }

.tgt { break-inside:avoid; padding:7pt 0 6pt; border-bottom:.4pt solid #EDEFF4; }
.tgt header { display:flex; justify-content:space-between; align-items:baseline; gap:8pt;
  margin:0 0 4pt; }
.tgt__ref { font-family:${TYPE.sans}; font-size:6.6pt; font-weight:700; letter-spacing:.1em;
  color:#fff; background:${ACCENT.hex}; padding:1.6pt 4.5pt; white-space:nowrap; }
.tgt__ex { font-style:italic; font-size:9.6pt; color:${PAL.midnightNavy};
  border-left:2pt solid ${PAL.champagneGold}; padding-left:7pt; margin:0 0 5pt; }
.tgt__gd { margin:0 0 4pt; }
.tgt__src { font-family:${TYPE.sans}; font-size:6.6pt; color:${PAL.slateGrey}; margin:0; }

.mdl { break-inside:avoid; padding:7pt 0 6pt; border-bottom:.4pt solid #EDEFF4; }
.mdl header { display:flex; justify-content:space-between; align-items:baseline; gap:8pt;
  margin:0 0 4pt; }
.mdl__lines span { display:block; font-size:9.6pt; color:${PAL.midnightNavy};
  border-left:2pt solid ${PAL.platinum}; padding:1pt 0 1pt 7pt; }

table { width:100%; border-collapse:collapse; font-size:8pt; margin:6pt 0 10pt; }
thead { display:table-header-group; }
th { background:${ACCENT.hex}; color:#fff; text-align:left; padding:3.5pt 6pt;
  font-family:${TYPE.sans}; font-size:6.2pt; letter-spacing:.1em; text-transform:uppercase; }
td { padding:3.5pt 6pt; border-bottom:.4pt solid #E8EBF1; vertical-align:top; }
tr { break-inside:avoid; }
.ord { break-inside:auto; }

.panel { border-left:2.2pt solid ${ACCENT.hex}; background:${PAL.softCream}; padding:8pt 10pt;
  margin:10pt 0; break-inside:avoid; }
.panel__h { font-family:${TYPE.sans}; font-size:6.6pt; font-weight:700; letter-spacing:.14em;
  text-transform:uppercase; color:${ACCENT.hex}; margin:0 0 3pt; }
.panel p:last-child { margin:0; }
.fleuron { text-align:center; margin:12pt 0; }
</style></head><body>

<section class="title">
  <div>${crest({ size: 56, gold: PAL.royalGold, ink: 'none', mono: true })}</div>
  <p class="eyebrow" style="margin-top:12pt">Worldwide English College · London Campus</p>
  <h1>The IEFC Pronunciation Handbook</h1>
  <div class="title__rule"></div>
  <p class="title__sub">Every pronunciation target in the International English Fluency
    Certificate, arranged by what a teacher is looking for.</p>
  <div class="title__fill"></div>
  <div style="margin-bottom:10pt">${guillocheBand({
  width: 700, height: 30, stroke: PAL.champagneGold, opacity: 0.5,
})}</div>
  <div class="title__meta">
    ${FAMILY} · First edition · ${esc(ID.generated)}<br>
    ${targets.length} targets · ${stages.length} classroom stages · ${models.length} model scripts<br>
    Document ID ${esc(ID.documentId)}
  </div>
</section>

<section>
  <p class="eyebrow">How to use this book</p>
  <h1 style="font-size:16pt">Ordered by what you are looking for</h1>
  <p>The curriculum teaches pronunciation level by level, and this book does not. A teacher
    reaching for a pronunciation handbook is rarely asking what comes next; they are asking where
    a particular difficulty is taught, and the answer is spread across six levels.</p>
  <p>So the six parts are the six kinds of pronunciation difficulty. Inside each, the curriculum
    sequence is preserved, level by level, so the progression is still visible. Appendix B
    recovers the curriculum order for anyone planning a term rather than solving a problem.</p>

  <h2 style="margin-top:12pt">What is in each entry</h2>
  <table><thead><tr><th scope="col">Element</th><th scope="col">What it is</th></tr></thead><tbody>
    <tr><td class="nowrap"><b>Target</b></td><td>The feature being taught, in the curriculum's own
      words.</td></tr>
    <tr><td class="nowrap"><b>Example</b></td><td>The worked example the lesson uses. Stressed
      syllables are capitalised where the curriculum capitalises them.</td></tr>
    <tr><td class="nowrap"><b>Guidance</b></td><td>What to tell a learner who cannot produce it —
      written for the classroom, not for a phonetics course.</td></tr>
    <tr><td class="nowrap"><b>Reference</b></td><td>Level and module, so the target can be traced
      to the lesson that teaches it in the Complete Curriculum.</td></tr>
  </tbody></table>

  <div class="panel">
    <p class="panel__h">What this book does not contain</p>
    <p>No phonemic transcription: the curriculum does not use the International Phonetic Alphabet,
      and adding a transcription this programme does not teach would be a different book with a
      different syllabus behind it. No audio: the ${models.length} model scripts in Appendix A
      have been written and none has been recorded. Nothing in these pages has been composed for
      this volume — every target, example, guidance note and script is read from the academic
      database that the Complete Curriculum is set from.</p>
  </div>

  <h2>The six parts</h2>
  <table><thead><tr><th scope="col">Part</th><th scope="col">Focus</th>
    <th scope="col">Targets</th><th scope="col">Levels</th></tr></thead><tbody>
    ${byFocus.map((f, i) => `<tr><td class="mono">${ROMANS[i]}</td>
      <td><b>${esc(f.name)}</b></td><td class="mono">${f.rows.length}</td>
      <td class="mono">${ROMANS.filter((r) => f.rows.some((t) => t.roman === r)).join(' ')}</td>
    </tr>`).join('')}
  </tbody></table>
  <div class="fleuron">${fleuron({ colour: ACCENT.hex, width: 90 })}</div>
</section>

${byFocus.map(focusSection).join('')}

${modelSection}

<section class="focus">
  <div class="focus__open">
    <p class="eyebrow">Appendix B</p>
    <h1>The curriculum order</h1>
    <p class="focus__gloss">The same targets in the order the programme teaches them, for planning
      a term rather than solving a problem in class. Classroom stage times are the curriculum's
      own designed minutes.</p>
  </div>
  ${curriculumOrder}
</section>

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
writeFileSync(path.join(ROOT, 'publication', '.pronunciation.html'), html);

const exe = process.env.PW_CHROMIUM || '/opt/pw-browsers/chromium-1194/chrome-linux/chrome';
const browser = await chromium.launch(existsSync(exe) ? { executablePath: exe } : {});
const page = await browser.newPage();
await page.setContent(html, { waitUntil: 'load' });
const out = path.join(ROOT, 'publication', 'IEFC Pronunciation Handbook.pdf');
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
console.log(`PRON      ${out}`);
console.log(`  ${pages} pages · ${FMT.w} × ${FMT.h} mm · ${targets.length} targets · `
  + `${stages.length} classroom stages · ${models.length} model scripts`);
console.log(`  ${byFocus.map((f) => `${f.name} ${f.rows.length}`).join(' · ')}`);
