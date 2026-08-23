/**
 * THE IEFC LISTENING SCRIPTS.
 *
 * First by educational impact of the nineteen derivable titles, and
 * published first for that reason rather than because it was the
 * easiest: a listening lesson currently cannot be run at all. One
 * hundred and twenty scripted assets exist, 497 speaker-attributed cues
 * exist, and nought recordings exist. Until the recording decision is
 * taken, the only way a class hears this material is if a teacher reads
 * it aloud — and a script nobody can see is a script nobody can use.
 *
 * ────────────────────────────────────────────────────────────────────
 * WHAT THIS BOOK IS FOR, WHICH DECIDES ITS SHAPE
 * ────────────────────────────────────────────────────────────────────
 * It is a performance script, not a transcript. A teacher holds it open
 * at the front of a room, reads two speakers aloud at a stated pace,
 * and stops in the right places. That decides everything about the
 * setting:
 *
 *   · every cue on its own line, speaker in the margin, so the eye
 *     finds the next line without tracking back;
 *   · the target pace printed at the head of every script, because the
 *     one thing an untrained reader does wrong is read at their own
 *     speed;
 *   · the comprehension task on the same spread as the script it goes
 *     with, since a teacher who has to turn a page mid-activity will
 *     lose the class;
 *   · nothing decorative anywhere near the cues.
 *
 * The scripts are set in curriculum order, not by topic. This book is
 * opened at the lesson being taught today, which is the opposite of the
 * Pronunciation Handbook's case, and the arrangement follows the use
 * rather than a house preference for consistency.
 *
 * ────────────────────────────────────────────────────────────────────
 * WHAT IS NOT HERE
 * ────────────────────────────────────────────────────────────────────
 * No audio, and the book says so on its title page rather than in a
 * note at the back. No invented timings: `start_ms` and `end_ms` are
 * null for every cue in the database because nothing has been recorded,
 * and a printed timecode would be a fabrication of a measurement.
 */
import { writeFileSync, mkdirSync, existsSync, readFileSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { DatabaseSync } from 'node:sqlite';
import { chromium } from 'playwright';
import { buildCurriculum } from './curriculum.mjs';
import { TYPE, C as PAL, BRAND, paletteFor } from './design.mjs';
import { crest, fleuron, guillocheBand } from './ornament.mjs';
import { publicationIdentity } from './identity.mjs';
import { legacyBlock, ecosystem } from './legacy.mjs';
import { formatFor, marginsFor, familyColours } from './house.mjs';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..');
const dash = (s) => String(s ?? '').replace(/\s--\s/g, ' — ');
const esc = (s) => dash(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');

const FAMILY = 'IEFC Reference Library';
const FMT = formatFor('flagship');
const M = marginsFor('flagship', 160);
const ACCENT = familyColours().find((c) => c.family === FAMILY);

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

  const assets = db.prepare(`
    SELECT a.id, a.kind, a.title, a.transcript, a.variety, a.speaker_count AS speakers,
           a.target_wpm AS wpm, a.media_url AS media,
           i.title AS lessonTitle, i.sequence AS lessonSeq, i.kind AS itemKind,
           u.sequence AS moduleSeq, u.title AS moduleTitle,
           l.roman, l.name AS levelName, l.cefr
      FROM audio_assets a
      JOIN learning_items i ON i.audio_asset_id = a.id
      JOIN units u ON u.id = i.unit_id
      JOIN courses c ON c.id = u.course_id
      JOIN programme_levels l ON l.id = c.level_id
     GROUP BY a.id
     ORDER BY l.id, u.sequence, i.sequence`).all();

  const cues = db.prepare(`
    SELECT audio_asset_id AS asset, sequence, speaker, text, start_ms AS startMs
      FROM audio_cues ORDER BY audio_asset_id, sequence`).all();

  db.close();
  const byAsset = new Map();
  for (const c of cues) {
    if (!byAsset.has(c.asset)) byAsset.set(c.asset, []);
    byAsset.get(c.asset).push(c);
  }
  for (const a of assets) a.cues = byAsset.get(a.id) || [];
  return assets;
}

const assets = build();
const C = buildCurriculum();
const ID = publicationIdentity(C, { edition: 1, revision: 0, impression: 1 });

// The classroom activity the script belongs to, taken from the lesson
// that carries it: what the class is listening FOR.
const tasks = new Map();
for (const lv of C.levels) {
  for (const mod of lv.modules) {
    for (const item of mod.lessons) {
      const st = item.stages.find((s) => s.icon === 'listening');
      if (!st) continue;
      const key = `${lv.roman}.${mod.sequence}`;
      if (!tasks.has(key)) tasks.set(key, []);
      tasks.get(key).push({
        ref: `${key}.${item.sequence}`,
        lesson: item.title,
        timing: st.timing,
        text: st.parts.map((p) => p.text).join(' ').trim(),
      });
    }
  }
}

const ROMANS = ['I', 'II', 'III', 'IV', 'V', 'VI'];
const listening = assets.filter((a) => a.kind === 'listening');
const models = assets.filter((a) => a.kind === 'model_pronunciation');
const totalCues = assets.reduce((n, a) => n + a.cues.length, 0);
const recorded = assets.filter((a) => a.media).length;
const words = (s) => s.split(/\s+/).filter(Boolean).length;
const runtime = (a) => Math.round((words(a.transcript) / a.wpm) * 60);
const mmss = (sec) => `${Math.floor(sec / 60)}:${String(sec % 60).padStart(2, '0')}`;

// ─────────────────────────────────────────────────────────────────────
// THE PAGES
// ─────────────────────────────────────────────────────────────────────

const scriptBlock = (a) => {
  const pal = paletteFor(a.roman);
  return `<article class="scr">
  <header class="scr__h" style="border-color:${pal.mid}">
    <div>
      <p class="scr__ref" style="color:${pal.ink}">${esc(a.roman)}.${a.moduleSeq}</p>
      <h3>${esc(a.title)}</h3>
      <p class="scr__from">${esc(a.moduleTitle.replace(/^Module \d+:\s*/, ''))} ·
        ${esc(a.lessonTitle)}</p>
    </div>
    <dl class="scr__spec">
      <dt>Voices</dt><dd>${a.speakers}</dd>
      <dt>Variety</dt><dd>${esc(a.variety)}</dd>
      <dt>Pace</dt><dd>${a.wpm} wpm</dd>
      <dt>Read time</dt><dd>${mmss(runtime(a))}</dd>
    </dl>
  </header>
  ${a.cues.length ? `<ol class="cues">
    ${a.cues.map((c) => `<li><span class="cue__sp">${esc(c.speaker || '')}</span>
      <span class="cue__tx">${esc(c.text)}</span></li>`).join('')}
  </ol>` : `<p class="scr__plain">${a.transcript.split('|').map((l) =>
  `<span>${esc(l.trim())}</span>`).join('')}</p>`}
</article>`;
};

const levelSection = (roman) => {
  const rows = listening.filter((a) => a.roman === roman);
  if (!rows.length) return '';
  const pal = paletteFor(roman);
  const lv = rows[0];
  const mins = rows.reduce((n, a) => n + runtime(a), 0);
  return `
<section class="lvl">
  <div class="lvl__open" style="background:${pal.wash};border-color:${pal.mid}">
    <p class="eyebrow" style="color:${pal.ink}">Level ${esc(roman)} · ${esc(lv.cefr)}</p>
    <h1 style="color:${pal.ink}">${esc(lv.levelName)}</h1>
    <p class="lvl__count">${rows.length} scripts ·
      ${rows.reduce((n, a) => n + a.cues.length, 0)} cues ·
      ${mmss(mins)} of reading at the stated pace</p>
  </div>
  ${rows.map((a) => {
    const t = (tasks.get(`${a.roman}.${a.moduleSeq}`) || [])[0];
    return scriptBlock(a) + (t ? `<div class="task" style="border-color:${pal.mid}">
      <p class="task__h">What the class is listening for · ${esc(t.ref)}${
  t.timing ? ` · ${esc(t.timing)}` : ''}</p>
      <p>${esc(t.text)}</p>
    </div>` : '');
  }).join('')}
</section>`;
};

const RECORD = ecosystem().find((r) => /Listening Scripts/.test(r.name));
const LEGACY = legacyBlock({
  id: ID,
  title: 'The IEFC Listening Scripts',
  family: FAMILY,
  audience: RECORD ? RECORD.audience : 'Teachers running listening work without recorded audio',
  subjects: ['English language — Listening comprehension', 'English language — Spoken English',
    'English language — Study and teaching', 'Language laboratories'],
  artefact: 'publication/IEFC Listening Scripts.pdf',
  siblings: ['publication/.listening.html'],
  relatives: RECORD ? RECORD.relatives : [],
  maturity: RECORD ? RECORD.maturity : undefined,
  ink: PAL.royalBlue, rule: PAL.platinum, soft: PAL.slateGrey, accent: ACCENT.hex,
  panel: PAL.softCream,
});

const html = `<!doctype html><html lang="en-GB"><head><meta charset="utf-8">
<title>The IEFC Listening Scripts</title>
<style>
@page { size:${FMT.w}mm ${FMT.h}mm; margin:${M.head}mm ${M.fore}mm ${M.foot}mm ${M.gutter}mm; }
@page :left  { margin-left:${M.fore}mm; margin-right:${M.gutter}mm; }
@page :right { margin-left:${M.gutter}mm; margin-right:${M.fore}mm; }
* { box-sizing:border-box; }
body { margin:0; font-family:${TYPE.serif}; font-size:10pt; line-height:1.5;
  color:${PAL.warmCharcoal}; background:${BRAND.paper};
  -webkit-print-color-adjust:exact; print-color-adjust:exact;
  text-wrap:pretty; orphans:3; widows:3; }
h1,h2,h3 { break-after:avoid; font-weight:700; color:${PAL.royalBlue}; }
h1 { font-size:22pt; line-height:1.12; margin:0 0 5pt; }
h2 { font-size:13pt; margin:14pt 0 5pt; }
h3 { font-size:12pt; margin:0; color:${PAL.midnightNavy}; }
p { margin:0 0 5pt; }
.eyebrow { font-family:${TYPE.sans}; font-size:6.6pt; font-weight:700; letter-spacing:.26em;
  text-transform:uppercase; color:${ACCENT.hex}; margin:0 0 5pt; }
.small { font-family:${TYPE.sans}; font-size:7.4pt; color:${PAL.slateGrey}; }
.mono { font-family:"Consolas","DejaVu Sans Mono",monospace; font-size:7.4pt; }
.nowrap { white-space:nowrap; }

.title { height:${FMT.h - M.head - M.foot - 4}mm; break-after:page; break-inside:avoid;
  background:${PAL.midnightNavy}; color:${BRAND.paper}; padding:24mm 20mm 16mm;
  display:flex; flex-direction:column; }
.title h1 { color:${BRAND.paper}; font-size:30pt; max-width:12em; }
.title .eyebrow { color:${PAL.champagneGold}; }
.title__rule { height:1.5pt; background:${ACCENT.hex}; width:56mm; margin:12pt 0 14pt; }
.title__sub { font-size:12pt; color:${PAL.platinum}; max-width:24em; }
.title__fill { flex:1; }
.title__meta { font-family:${TYPE.sans}; font-size:7.6pt; color:${PAL.platinum}; line-height:1.8; }
.title__warn { border-left:2.4pt solid ${PAL.champagneGold}; padding:8pt 0 8pt 12pt;
  margin:14pt 0 0; max-width:26em; color:${PAL.platinum}; font-size:9.6pt; }

.lvl { break-before:page; }
.lvl__open { break-inside:avoid; break-after:avoid; border-left:3pt solid; padding:10pt 14pt;
  margin:0 0 12pt; }
.lvl__open h1 { font-size:19pt; margin:0 0 4pt; }
.lvl__count { font-family:${TYPE.sans}; font-size:7.2pt; letter-spacing:.1em;
  text-transform:uppercase; color:${PAL.slateGrey}; margin:0; }

/* A script is read aloud from the page: it must never break across a
   spread, and the speaker has to be findable without reading. */
.scr { break-inside:avoid; margin:0 0 4pt; }
.scr__h { display:flex; justify-content:space-between; align-items:flex-start; gap:14pt;
  border-bottom:1.4pt solid; padding:0 0 5pt; margin:0 0 7pt; }
.scr__ref { font-family:${TYPE.sans}; font-size:7pt; font-weight:700; letter-spacing:.18em;
  margin:0 0 2pt; }
.scr__from { font-family:${TYPE.sans}; font-size:7.4pt; color:${PAL.slateGrey}; margin:2pt 0 0; }
dl.scr__spec { margin:0; display:grid; grid-template-columns:auto auto; column-gap:7pt;
  row-gap:1pt; align-content:start; }
dl.scr__spec dt { font-family:${TYPE.sans}; font-size:6.2pt; font-weight:700;
  letter-spacing:.12em; text-transform:uppercase; color:${PAL.slateGrey}; text-align:right; }
dl.scr__spec dd { font-family:${TYPE.sans}; font-size:7.6pt; margin:0; color:${PAL.midnightNavy};
  white-space:nowrap; }

ol.cues { margin:0 0 8pt; padding:0; list-style:none; }
ol.cues li { display:flex; gap:10pt; padding:2.6pt 0; break-inside:avoid;
  border-bottom:.3pt solid #F1F3F7; }
.cue__sp { font-family:${TYPE.sans}; font-size:7.4pt; font-weight:700; color:${ACCENT.hex};
  width:26mm; flex:none; text-align:right; padding-top:1pt; }
.cue__tx { font-size:10.4pt; line-height:1.45; }
.scr__plain span { display:block; font-size:10.4pt; padding:2.4pt 0 2.4pt 10pt;
  border-left:2pt solid ${PAL.platinum}; }

.task { break-inside:avoid; border-left:2.4pt solid; background:${PAL.softCream};
  padding:7pt 11pt; margin:0 0 14pt; }
.task__h { font-family:${TYPE.sans}; font-size:6.6pt; font-weight:700; letter-spacing:.14em;
  text-transform:uppercase; color:${PAL.bronze}; margin:0 0 3pt; }
.task p:last-child { margin:0; font-size:9.4pt; }

table { width:100%; border-collapse:collapse; font-size:8.6pt; margin:6pt 0 12pt; }
thead { display:table-header-group; }
th { background:${ACCENT.hex}; color:#fff; text-align:left; padding:4pt 7pt;
  font-family:${TYPE.sans}; font-size:6.4pt; letter-spacing:.1em; text-transform:uppercase; }
td { padding:4pt 7pt; border-bottom:.4pt solid #E8EBF1; vertical-align:top; }
tr { break-inside:avoid; }

.panel { border-left:2.4pt solid ${ACCENT.hex}; background:${PAL.softCream}; padding:9pt 12pt;
  margin:12pt 0; break-inside:avoid; }
.panel--stop { border-left-color:${PAL.deepCrimson}; background:#FBF1F1; }
.panel__h { font-family:${TYPE.sans}; font-size:6.8pt; font-weight:700; letter-spacing:.14em;
  text-transform:uppercase; color:${ACCENT.hex}; margin:0 0 4pt; }
.panel--stop .panel__h { color:${PAL.deepCrimson}; }
.panel p:last-child { margin:0; }
.fleuron { text-align:center; margin:14pt 0; }
</style></head><body>

<section class="title">
  <div>${crest({ size: 66, gold: PAL.royalGold, ink: 'none', mono: true })}</div>
  <p class="eyebrow" style="margin-top:14pt">Worldwide English College · London Campus</p>
  <h1>The IEFC Listening Scripts</h1>
  <div class="title__rule"></div>
  <p class="title__sub">Every listening and model script in the programme, set to be read
    aloud.</p>
  <p class="title__warn">There are no recordings. ${assets.length} scripts have been written and
    ${recorded} audio files exist. Until that is decided, this book is how the material is
    heard.</p>
  <div class="title__fill"></div>
  <div style="margin-bottom:12pt">${guillocheBand({
  width: 800, height: 34, stroke: PAL.champagneGold, opacity: 0.5,
})}</div>
  <div class="title__meta">
    ${FAMILY} · First edition · ${esc(ID.generated)}<br>
    ${listening.length} listening scripts · ${models.length} pronunciation models ·
    ${totalCues} speaker cues<br>
    Document ID ${esc(ID.documentId)}
  </div>
</section>

<section>
  <p class="eyebrow">How to use this book</p>
  <h1 style="font-size:17pt">A performance script, not a transcript</h1>
  <p>This book is designed to be held open at the front of a room. Every cue is on its own line
    with the speaker in the margin, so the eye finds the next line without tracking back, and no
    script breaks across a page turn.</p>
  <p>The pace is printed at the head of every script and it is not decorative. The single thing
    an untrained reader does wrong is read at their own speed: a Level I script at
    ${listening[0] ? listening[0].wpm : 90} words per minute sounds slow to the reader and is
    already fast to a learner three weeks into English.</p>

  <h2>What is at the head of each script</h2>
  <table><thead><tr><th scope="col">Field</th><th scope="col">What it tells you</th>
    </tr></thead><tbody>
    <tr><td class="nowrap"><b>Voices</b></td><td>How many speakers the script needs. Where there
      are two, one reader can take both by turning the page towards the class between speakers —
      or two teachers can share it.</td></tr>
    <tr><td class="nowrap"><b>Variety</b></td><td>The variety of English the script is written
      in. Declared, not incidental: this programme teaches British and American differences
      explicitly.</td></tr>
    <tr><td class="nowrap"><b>Pace</b></td><td>Target words per minute. Read to it.</td></tr>
    <tr><td class="nowrap"><b>Read time</b></td><td>How long the script takes at that pace,
      computed from its own word count. Not a recording length: nothing has been recorded.</td></tr>
  </tbody></table>

  <div class="panel panel--stop">
    <p class="panel__h">What is not in this book, and why it is on the title page</p>
    <p>No audio. ${assets.length} scripts are written and ${recorded} recordings exist, because
      recording requires a studio, voice casting for the declared variety and a budget — none of
      which is an editorial decision. No timecodes either: the cue timings in the database are
      empty for every one of the ${totalCues} cues, and printing a timecode for audio that does
      not exist would be inventing a measurement. The read times above are arithmetic on the
      word count and are labelled as such.</p>
  </div>

  <h2>What is here</h2>
  <table><thead><tr><th scope="col">Level</th><th scope="col">Scripts</th>
    <th scope="col">Cues</th><th scope="col">Reading time</th>
    <th scope="col">Recordings</th></tr></thead><tbody>
    ${ROMANS.map((r) => {
    const rows = listening.filter((a) => a.roman === r);
    return `<tr><td class="nowrap"><b>Level ${r}</b> ${esc(rows[0] ? rows[0].cefr : '')}</td>
      <td class="mono">${rows.length}</td>
      <td class="mono">${rows.reduce((n, a) => n + a.cues.length, 0)}</td>
      <td class="mono">${mmss(rows.reduce((n, a) => n + runtime(a), 0))}</td>
      <td class="mono">${rows.filter((a) => a.media).length}</td></tr>`;
  }).join('')}
    <tr><td><b>Total</b></td><td class="mono"><b>${listening.length}</b></td>
      <td class="mono"><b>${listening.reduce((n, a) => n + a.cues.length, 0)}</b></td>
      <td class="mono"><b>${mmss(listening.reduce((n, a) => n + runtime(a), 0))}</b></td>
      <td class="mono"><b>${recorded}</b></td></tr>
  </tbody></table>
  <p class="small">The ${models.length} pronunciation model scripts are printed in the
    Pronunciation Handbook, where the targets they model are explained, rather than repeated
    here. The Canon forbids a book repeating another.</p>
  <div class="fleuron">${fleuron({ colour: ACCENT.hex, width: 110 })}</div>
</section>

${ROMANS.map(levelSection).join('')}

${LEGACY}
</body></html>`;

mkdirSync(path.join(ROOT, 'publication'), { recursive: true });
writeFileSync(path.join(ROOT, 'publication', '.listening.html'), html);

const exe = process.env.PW_CHROMIUM || '/opt/pw-browsers/chromium-1194/chrome-linux/chrome';
const browser = await chromium.launch(existsSync(exe) ? { executablePath: exe } : {});
const page = await browser.newPage();
await page.setContent(html, { waitUntil: 'load' });
const out = path.join(ROOT, 'publication', 'IEFC Listening Scripts.pdf');
await page.pdf({
  path: out,
  format: 'A4',
  printBackground: true,
  preferCSSPageSize: true,
  displayHeaderFooter: true,
  headerTemplate: '<div></div>',
  footerTemplate: `<div style="font:400 7.4pt Calibri,Arial,sans-serif;color:${PAL.slateGrey};`
    + `width:100%;padding:0 ${M.gutter}mm;display:flex;justify-content:space-between;">`
    + '<span>The IEFC Listening Scripts</span><span class="pageNumber"></span></div>',
  margin: { top: `${M.head}mm`, bottom: `${M.foot}mm`,
    left: `${M.gutter}mm`, right: `${M.fore}mm` },
  tagged: true,
  outline: true,
});
await browser.close();

const pages = (readFileSync(out).toString('latin1').match(/\/Type\s*\/Page(?![s])/g) || []).length;
console.log(`LISTEN    ${out}`);
console.log(`  ${pages} pages · ${listening.length} scripts · ${totalCues} cues · `
  + `${mmss(listening.reduce((n, a) => n + runtime(a), 0))} of reading · ${recorded} recordings`);
