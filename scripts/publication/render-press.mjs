/**
 * WEC PRESS — THE PUBLISHING CONSTITUTION, rendered.
 *
 * Three parts, and the order is an argument:
 *
 *   I   THE CONSTITUTIONS — what may be published, and by what rules.
 *   II  THE PUBLICATION ARCHITECTURE — what will be published, over ten
 *       years, with the status of every title computed rather than
 *       claimed.
 *   III THE HOUSE IDENTITY — how every one of them looks, so that the
 *       fortieth title is recognisably from the same house as the first.
 *
 * Rules first, catalogue second, appearance last. A publishing house
 * that designs its identity before deciding what it is allowed to say
 * ends up with a beautiful way of saying things that are not true.
 *
 * This volume carries the house livery rather than the internal one: it
 * is a public document, unlike the Editorial Bible, and it is the one
 * publication whose job is to be shown to a printer, a partner or a
 * reviewer as evidence of how the College publishes.
 *
 * It is rendered TWICE by `npm run press`, and the second pass is not
 * redundant. This volume reports on the artefacts of the Press,
 * including itself: its own extent and its own readiness are read from
 * the copy on disk, because a book cannot measure a file it has not yet
 * written. One pass therefore prints the previous impression's figures.
 * The second pass reads what the first wrote and converges — the same
 * reason a typesetting system runs twice to resolve its own
 * cross-references.
 */
import { writeFileSync, mkdirSync, existsSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { chromium } from 'playwright';
import { buildCurriculum } from './curriculum.mjs';
import { TYPE, C as PAL, BRAND } from './design.mjs';
import { crest, guillocheBand, fleuron } from './ornament.mjs';
import { publicationIdentity } from './identity.mjs';
import { editionMark, runningHead, runningFoot, rightsPage } from './rights.mjs';
import { CONSTITUTIONS, CLAUSES, FORCE, forceCount, contrastEvidence } from './press.mjs';
import {
  STATUS, STATUS_ORDER, WAVES, inventory, catalogue, statusCounts, plan, FAMILIES_IN_USE,
} from './catalogue.mjs';
import {
  FAMILIES, MATURITY, MATURITY_ORDER, MATURITY_MEANS, READINESS, UNPROVABLE, FUTURE_PROOFING,
  REVIEWS, ecosystem, familyTable, readinessOf, legacyBlock,
} from './legacy.mjs';
import {
  CONSTANTS, FORMATS, MARGINS, marginsFor, NAVIGATION, COVER_GRID, COVER_FIELDS, BACK_COVER,
  SPINE_RULES, spineFor, familyColours, COLOUR_USE, OPENERS, ENDPAPERS, FIGURE_RULES,
  TABLE_RULES, PHOTOGRAPHY, ICONOGRAPHY, EDITION_CLASSES, DIGITAL_STANDARDS,
} from './house.mjs';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..');
const esc = (s) => String(s ?? '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');

const C = buildCurriculum();
const ID = publicationIdentity(C, { edition: 1, revision: 0, impression: 1 });

// This volume's name and its edition mark, printed on every page it
// prints. The mark is derived from the volume and from the curriculum
// edition it was set from, so a page found somewhere else names the
// edition it was taken from — see rights.mjs.
const VOLUME = 'WorldWide English College Press — The Publishing Constitution';
const MARK = editionMark('press-constitution', ID.contentDigest);
const INV = inventory(C);
const ROWS = catalogue(INV);
const SERIES = FAMILIES_IN_USE;
const COLOURS = familyColours();
const ECO = ecosystem(INV);
const OWN = ECO.find((r) => /Publishing Constitution/.test(r.name));

// Every published artefact, probed against the nine readiness
// properties. The DOCX is included and reports what a DOCX can report:
// omitting it would have made the table look complete.
const PROBED = ECO.filter((r) => r.artefact).map((r) => ({
  name: r.name, edition: r.edition,
  readiness: readinessOf(r.artefact, r.htmlSource),
}));

const FORCE_CLASS = {
  [FORCE.ENFORCED]: 'f--enf', [FORCE.OBSERVED]: 'f--obs',
  [FORCE.ADOPTED]: 'f--ado', [FORCE.DRAFT]: 'f--drf',
};
const STATUS_CLASS = {
  [STATUS.PUBLISHED]: 's--pub', [STATUS.DERIVABLE]: 's--der',
  [STATUS.AUTHORING]: 's--aut', [STATUS.GOVERNANCE]: 's--gov',
};

const num = (n) => n.toLocaleString('en-GB');

// ── Part I ───────────────────────────────────────────────────────────

const constitutionHtml = CONSTITUTIONS.map((s) => `
<section class="con">
  <div class="con__h">
    <p class="eyebrow">Constitution ${s.n} of ${CONSTITUTIONS.length}</p>
    <h2>${esc(s.name)}</h2>
    <p class="lead">${esc(s.purpose)}</p>
  </div>
  <ol class="clauses">
    ${s.clauses.map((cl) => `<li>
      <span class="f ${FORCE_CLASS[cl.force]}">${esc(cl.force)}</span>
      <span class="cl">${esc(cl.rule)}</span>
      ${cl.by ? `<span class="by">${esc(cl.by)}</span>` : ''}
    </li>`).join('')}
  </ol>
  ${s.derived ? `<table class="der"><tbody>${s.derived().map((r) => `<tr>${
    r.map((cell, i) => `<td${i === 0 ? ' class="der__k"' : ''}>${esc(cell)}</td>`).join('')
  }</tr>`).join('')}</tbody></table>` : ''}
</section>`).join('');

// ── Part II ──────────────────────────────────────────────────────────

const titleRow = (r) => `<article class="tit">
  <header>
    <span class="tit__n">${r.n}</span>
    <div>
      <h3>${esc(r.name)}</h3>
      ${r.edition ? `<p class="tit__ed">${esc(r.edition)}</p>` : ''}
    </div>
    <span class="s ${STATUS_CLASS[r.status]}">${esc(r.status)}</span>
  </header>
  <p class="tit__aud"><b>Family</b> ${esc(r.family)} &nbsp;·&nbsp;
    <b>Maturity</b> ${esc(ECO.find((e) => e.n === r.n).maturity)}</p>
  <p class="tit__aud"><b>Readership</b> ${esc(r.audience)}</p>
  <p class="tit__src">${esc(r.source)}</p>
  ${r.governance ? `<p class="tit__gov"><span>Governance</span>${esc(r.governance)}</p>` : ''}
  ${r.met.length ? `<p class="tit__met"><span>Material in hand</span>${
    r.met.map((m) => `${num(m.have)} ${esc(m.what)}`).join(' · ')}</p>` : ''}
  ${r.short.length ? `<p class="tit__short"><span>Shortfall</span>${
    r.short.map((m) => `${esc(m.what)}: ${num(m.have)} of ${num(m.need)} — ${num(m.deficit)} to author`)
      .join(' · ')}</p>` : ''}
  ${r.artefact ? `<p class="tit__art"><span>Artefact</span>${esc(r.artefact)}${
    r.build ? ` · npm run ${esc(r.build)}` : ''}${
    r.onDemand ? ' · built on demand rather than stored' : ''}</p>` : ''}
</article>`;

const planHtml = plan(ROWS).map((w) => `
<section class="wave">
  <div class="con__h">
  <p class="eyebrow">Wave ${w.n} · ${esc(w.years)}</p>
  <h2>${esc(w.name)}</h2>
  <p class="lead">${esc(w.gate)}</p>
  <p class="small">${w.titles.length} title${w.titles.length === 1 ? '' : 's'} · ${
  STATUS_ORDER.filter((s) => w.titles.some((t) => t.status === s))
    .map((s) => `${w.titles.filter((t) => t.status === s).length} ${s.toLowerCase()}`).join(' · ')}</p>
  </div>
  ${w.titles.map(titleRow).join('')}
</section>`).join('');

// ── Part III ─────────────────────────────────────────────────────────

const pairs = (rows) => `<table class="pairs"><tbody>${rows.map(([k, v]) =>
  `<tr><td class="pairs__k">${esc(k)}</td><td>${esc(v)}</td></tr>`).join('')}</tbody></table>`;

const html = `<!doctype html><html lang="en-GB"><head><meta charset="utf-8">
<title>WorldWide English College Press — The Publishing Constitution</title>
<style>
@page { size:A4; margin:22mm 20mm 18mm; }
@page :left  { margin-left:20mm; margin-right:24mm; }
@page :right { margin-left:24mm; margin-right:20mm; }
* { box-sizing:border-box; }
body { margin:0; font-family:${TYPE.serif}; font-size:9.8pt; line-height:1.56;
  color:${PAL.warmCharcoal}; background:${BRAND.paper};
  -webkit-print-color-adjust:exact; print-color-adjust:exact;
  hyphens:auto; text-wrap:pretty; orphans:3; widows:3; }
h1,h2,h3 { color:${PAL.royalBlue}; break-after:avoid; font-weight:700; }
h1 { font-size:26pt; line-height:1.1; margin:0 0 8pt; }
h2 { font-size:17pt; margin:0 0 4pt; letter-spacing:-.005em; }
h3 { font-size:10.8pt; margin:0; color:${PAL.midnightNavy}; }
p { margin:0 0 6pt; max-width:34em; }
.lead { font-size:10.4pt; color:${PAL.imperialBlue}; margin:0 0 12pt; }
.eyebrow { font-family:${TYPE.sans}; font-size:6.6pt; font-weight:700; letter-spacing:.26em;
  text-transform:uppercase; color:${PAL.bronze}; margin:0 0 5pt; }
.small { font-family:${TYPE.sans}; font-size:7.6pt; color:${PAL.slateGrey}; }
.nowrap { white-space:nowrap; }
td.ok { color:#1E6B3A; font-weight:700; text-align:center; }
td.no { color:${PAL.deepCrimson}; font-weight:700; text-align:center; }
.mono { font-family:"Consolas","DejaVu Sans Mono",monospace; font-size:7.4pt; }

/* ---------- Title page and part openers ----------
   Deep panels that fill the text area rather than bleeding off the
   trim. This PDF is a text block: the printed cover is a separate
   artefact, produced at the cover trim with its bleed, exactly as
   Part Three specifies. Negative margins were tried and leak a strip
   of navy onto the foot of the preceding page — Chromium resolves a
   negative top margin against the previous page box, not the new one. */
.cover { position:relative; height:243mm; break-after:page; break-inside:avoid;
  background:${PAL.midnightNavy}; color:${BRAND.paper}; padding:24mm 22mm 18mm;
  display:flex; flex-direction:column; }
.cover h1 { color:${BRAND.paper}; font-size:32pt; max-width:15em; }
.cover .eyebrow { color:${PAL.champagneGold}; }
.cover__rule { height:1.6pt; background:${PAL.royalGold}; width:64mm; margin:14pt 0 16pt; }
.cover__sub { font-size:12pt; color:${PAL.platinum}; max-width:26em; }
.cover__crest { margin:0 0 16pt; }
.cover__band { margin:0 0 14pt; }
.cover__meta { font-family:${TYPE.sans}; font-size:7.8pt; color:${PAL.platinum};
  line-height:1.8; }
.cover__fill { flex:1; }
.part { break-before:page; break-after:page; break-inside:avoid; height:243mm;
  background:${PAL.midnightNavy}; color:${BRAND.paper}; padding:52mm 22mm 24mm; }
.part h1 { color:${BRAND.paper}; font-size:30pt; }
.part .eyebrow { color:${PAL.champagneGold}; }
.part p { color:${PAL.platinum}; font-size:11pt; max-width:30em; }
.part .part__n { font-family:${TYPE.sans}; font-size:64pt; font-weight:700; line-height:1;
  color:${PAL.royalGold}; opacity:.32; margin:0 0 6pt; }

/* ---------- Clauses ----------
   These flowed as one continuous sequence after a page-per-section
   draft was rasterised: twenty-three constitutions each starting a new
   page left between a quarter and a half of most pages white, and the
   volume read as a stack of short documents rather than one. The heads
   are kept whole and tied to what follows instead. */
.con { break-before:auto; margin-top:20pt; }
.con__h { break-inside:avoid; break-after:avoid; }
.con > .eyebrow, .con > h2, .con > .lead { break-after:avoid; }
.con h2::after { content:''; display:block; height:.6pt; background:${PAL.platinum};
  margin:7pt 0 11pt; }
ol.clauses { margin:0; padding:0; list-style:none; counter-reset:cl; }
ol.clauses li { break-inside:avoid; counter-increment:cl; position:relative;
  padding:7pt 0 7pt 0; border-top:.4pt solid #E6E9F0; }
ol.clauses li::before { content:counter(cl); font-family:${TYPE.sans}; font-size:7pt;
  font-weight:700; color:${PAL.slateGrey}; display:block; margin-bottom:3pt; }
.cl { display:block; max-width:34em; }
.f { font-family:${TYPE.sans}; font-size:6.2pt; font-weight:700; letter-spacing:.12em;
  text-transform:uppercase; padding:2pt 5.5pt; border-radius:1.5pt; float:right;
  margin:0 0 3pt 8pt; white-space:nowrap; }
.f--enf { background:#E4F0E8; color:#1E6B3A; }
.f--obs { background:#F6F1E4; color:${PAL.bronze}; }
.f--ado { background:#EAEFF8; color:${PAL.imperialBlue}; }
.f--drf { background:#FBEAEC; color:${PAL.deepCrimson}; }
.by { display:block; font-family:"Consolas","DejaVu Sans Mono",monospace; font-size:6.8pt;
  color:${PAL.slateGrey}; margin-top:3pt; }
table.der { width:100%; border-collapse:collapse; font-size:8.2pt; margin:9pt 0 0; }
table.der td { padding:3pt 8pt 3pt 0; border-bottom:.4pt solid #EDEFF4; vertical-align:top; }
.der__k { font-family:${TYPE.sans}; font-size:7pt; font-weight:700; color:${PAL.midnightNavy};
  white-space:nowrap; }

/* ---------- Catalogue ----------
   Waves flow for the same reason the constitutions do: a page break per
   wave left one page 15 % full and another 38 %. */
.wave { break-before:auto; margin-top:20pt; }
.wave h2::after { content:''; display:block; height:.6pt; background:${PAL.platinum};
  margin:7pt 0 11pt; }
.tit { break-inside:avoid; border-top:.4pt solid #E6E9F0; padding:9pt 0 8pt; }
.tit header { display:flex; gap:9pt; align-items:baseline; margin:0 0 5pt; }
.tit header div { flex:1; }
.tit__n { font-family:${TYPE.sans}; font-size:8pt; font-weight:700; color:${PAL.slateGrey};
  min-width:14pt; }
.tit__ed { font-family:${TYPE.sans}; font-size:7.6pt; color:${PAL.bronze}; margin:1pt 0 0; }
.s { font-family:${TYPE.sans}; font-size:6.2pt; font-weight:700; letter-spacing:.12em;
  text-transform:uppercase; padding:2pt 5.5pt; border-radius:1.5pt; white-space:nowrap; }
.s--pub { background:#E4F0E8; color:#1E6B3A; }
.s--der { background:#EAEFF8; color:${PAL.imperialBlue}; }
.s--aut { background:#F6F1E4; color:${PAL.bronze}; }
.s--gov { background:#FBEAEC; color:${PAL.deepCrimson}; }
.tit p { margin:0 0 4pt; font-size:9.2pt; }
.tit__aud { font-family:${TYPE.sans}; font-size:7.8pt; color:${PAL.slateGrey}; }
.tit__aud b { color:${PAL.midnightNavy}; letter-spacing:.1em; text-transform:uppercase;
  font-size:6.6pt; }
.tit__gov, .tit__met, .tit__short, .tit__art { font-size:8.4pt; padding-left:9pt;
  border-left:2pt solid ${PAL.platinum}; margin-top:5pt; }
.tit__gov { border-left-color:${PAL.deepCrimson}; }
.tit__short { border-left-color:${PAL.bronze}; }
.tit__met { border-left-color:${PAL.imperialBlue}; }
.tit__art { border-left-color:#1E6B3A; font-family:"Consolas","DejaVu Sans Mono",monospace;
  font-size:7.2pt; }
.tit__gov span, .tit__met span, .tit__short span, .tit__art span { display:block;
  font-family:${TYPE.sans}; font-size:6.4pt; font-weight:700; letter-spacing:.14em;
  text-transform:uppercase; color:${PAL.slateGrey}; margin-bottom:1.5pt; }

/* ---------- Tables ---------- */
table { width:100%; border-collapse:collapse; font-size:8.6pt; margin:8pt 0 13pt; }
thead { display:table-header-group; }
th { background:${PAL.royalBlue}; color:#fff; text-align:left; padding:4.5pt 7pt;
  font-family:${TYPE.sans}; font-size:6.6pt; letter-spacing:.1em; text-transform:uppercase; }
td { padding:4.5pt 7pt; border-bottom:.4pt solid #E8EBF1; vertical-align:top; }
tr { break-inside:avoid; }
table.pairs th, table.pairs td { border-bottom:.4pt solid #EDEFF4; }
.pairs__k { font-family:${TYPE.sans}; font-size:7.4pt; font-weight:700;
  color:${PAL.midnightNavy}; width:30%; }
.swatch { display:inline-block; width:9pt; height:9pt; border-radius:1pt; vertical-align:-1pt;
  margin-right:5pt; border:.3pt solid rgba(0,0,0,.15); }

.panel { border-left:2.4pt solid ${PAL.royalGold}; background:${PAL.softCream};
  padding:9pt 12pt; margin:13pt 0; break-inside:avoid; }
.panel p { max-width:32em; }
.panel p:last-child { margin:0; }
.panel__h { font-family:${TYPE.sans}; font-size:7pt; font-weight:700; letter-spacing:.14em;
  text-transform:uppercase; color:${PAL.bronze}; margin:0 0 4pt; }
.panel--stop { border-left-color:${PAL.deepCrimson}; background:#FBF1F1; }
.panel--stop .panel__h { color:${PAL.deepCrimson}; }
.fleuron { text-align:center; margin:14pt 0; }
</style></head><body>

<section class="cover">
  <div class="cover__crest">${crest({ size: 74, gold: PAL.royalGold, ink: 'none', mono: true })}</div>
  <p class="eyebrow">WorldWide English College · London Campus</p>
  <h1>WorldWide English College Press</h1>
  <div class="cover__rule"></div>
  <p class="cover__sub">The Publishing Constitution, the Ten-Year Publication Architecture,
    and the House Visual Identity.</p>
  <div class="cover__fill"></div>
  <div class="cover__band">${guillocheBand({
  width: 900, height: 40, stroke: PAL.champagneGold, opacity: 0.55,
})}</div>
  <div class="cover__meta">
    First edition · ${esc(ID.generated)}<br>
    ${CONSTITUTIONS.length} constitutions · ${CLAUSES.length} clauses ·
    ${ROWS.length} titles · ${SERIES.length} series<br>
    Document ID ${esc(ID.documentId)}
  </div>
</section>

<section>
  <p class="eyebrow">Preface</p>
  <h2>What this volume is, and what it is not</h2>
  <p class="lead">WorldWide English College Press is an imprint, not a company.</p>
  <p>It has no separate legal personality, no appointed staff, no ISBN publisher prefix and no
    distribution agreement. It has published ${ROWS.filter((r) => r.status === STATUS.PUBLISHED).length}
    artefacts, all of them derived from one academic programme. This volume states that in its
    first constitution rather than its last, because a publishing house that opens by describing
    its ambitions and closes by admitting its position has the two the wrong way round.</p>
  <p>What the Press does have is a body of rules that can be checked. Of the ${CLAUSES.length}
    clauses in Part I, ${forceCount(FORCE.ENFORCED)} are enforced by a named test that fails the
    build when they are broken. That number is not high because software cannot check taste; it is
    not low because the clauses that matter most — truth in public claims, contrast, structural
    accessibility, artefact integrity — are exactly the ones a machine can check.</p>

  <table><thead><tr><th scope="col">Force</th><th scope="col">Clauses</th>
    <th scope="col">What it means</th></tr></thead><tbody>
    ${[[FORCE.ENFORCED, 'A named test fails the build if this clause is broken. The clause is a '
      + 'property of the artefact, not advice about it.'],
    [FORCE.OBSERVED, 'Followed, and the following is visible in the source. Nothing would stop a '
      + 'future editor departing from it.'],
    [FORCE.ADOPTED, 'A decision that has been taken and applies, with no artefact yet to check '
      + 'it against.'],
    [FORCE.DRAFT, 'Drafted here and not yet decided by anyone with the standing to decide it. '
      + 'It binds nothing until it is.']]
    .map(([f, d]) => `<tr><td><span class="f ${FORCE_CLASS[f]}" style="float:none;margin:0"
      >${esc(f)}</span></td><td class="mono">${forceCount(f)}</td><td>${esc(d)}</td></tr>`).join('')}
  </tbody></table>

  <div class="panel">
    <p class="panel__h">The absolute rule, restated because it governs everything after it</p>
    <p>Nothing is invented. Not accreditation, partnerships, rankings, statistics, history,
      governance, staff, competencies, student outcomes or institutional achievements. Where a
      decision belongs to the institution, it is recorded as an institutional decision and left
      undecided in print. Where a figure cannot be evidenced, it is not printed. Every claim in
      every publication of this Press is intended to survive being checked by someone who does
      not trust it.</p>
  </div>
</section>

<section class="part">
  <p class="part__n">I</p>
  <p class="eyebrow">Part One</p>
  <h1>The Constitutions</h1>
  <p>Twenty-three constitutions governing every publication the College will ever issue. Each
    clause declares how firmly it binds, and the clauses that claim enforcement name the test
    that enforces them.</p>
</section>

${constitutionHtml}

<section class="con">
  <p class="eyebrow">Evidence</p>
  <h2>The colour clauses, recomputed</h2>
  <p class="lead">Restating a contrast ratio in prose is how a colour policy outlives its palette.
    These are measured at the moment this page is set.</p>
  <table><thead><tr><th scope="col">Pairing</th><th scope="col">Foreground</th>
    <th scope="col">Ground</th><th scope="col">Ratio</th></tr></thead><tbody>
    ${contrastEvidence().map((r) => `<tr><td>${esc(r.label)}</td>
      <td class="mono"><span class="swatch" style="background:${esc(r.fg)}"></span>${esc(r.fg)}</td>
      <td class="mono">${esc(r.bg)}</td><td class="mono">${r.ratio.toFixed(2)} : 1</td></tr>`).join('')}
  </tbody></table>
</section>

<section class="part">
  <p class="part__n">II</p>
  <p class="eyebrow">Part Two</p>
  <h1>The Publication Architecture</h1>
  <p>Every publication the College should issue over ten years, with the status of each computed
    against the academic database rather than asserted. Where a title is short of material, the
    shortfall is printed as a number.</p>
</section>

<section>
  <p class="eyebrow">How to read Part Two</p>
  <h2>Four statuses, and none of them is an opinion</h2>
  <table><thead><tr><th scope="col">Status</th><th scope="col">Titles</th>
    <th scope="col">What it means</th></tr></thead><tbody>
    ${[[STATUS.PUBLISHED, 'The artefact exists and a named build script produces it.'],
    [STATUS.DERIVABLE, 'Every stated requirement is met by material that already exists. '
      + 'Producing it is editorial work and nothing else.'],
    [STATUS.AUTHORING, 'At least one requirement is short. The deficit is stated so the academic '
      + 'staff who would author it can size the job before agreeing to it.'],
    [STATUS.GOVERNANCE, 'Blocked on an authority the Press does not hold. No amount of editorial '
      + 'work unblocks it.']]
    .map(([s, d]) => `<tr><td><span class="s ${STATUS_CLASS[s]}">${esc(s)}</span></td>
      <td class="mono">${statusCounts(ROWS).find(([k]) => k === s)[1]}</td>
      <td>${esc(d)}</td></tr>`).join('')}
  </tbody></table>

  <h3 style="margin-top:12pt">The material the catalogue is measured against</h3>
  <table><thead><tr><th scope="col">Material</th><th scope="col">Count</th></tr></thead><tbody>
    ${[['Modules', INV.modules], ['Authored items', INV.items],
    ['Teaching lessons', INV.teachingLessons], ['Words of lesson content', INV.bodyWords],
    ['Assessment questions', INV.questions], ['Rubric criteria', INV.rubricCriteria],
    ['Listening scripts', INV.listeningScripts], ['Speaker cues', INV.audioCues],
    ['Recorded audio files', INV.recordedAudio],
    ['Pronunciation targets', INV.pronunciationTargets],
    ['Lesson-to-lesson cross-references', INV.crossRefs],
    ['Glossary headwords', INV.glossaryHeadwords],
    ['Assessments carrying a competency mapping', INV.assessmentsMapped],
    ['Appointed members of the academic bodies', INV.appointedMembers],
    ['Awards issued', INV.awardsIssued]]
    .map(([k, v]) => `<tr><td>${esc(k)}</td><td class="mono">${num(v)}</td></tr>`).join('')}
  </tbody></table>
  <p class="small">Measured from the academic database at generation. The zeroes are measured too:
    they are not blanks awaiting text, they are the current state of the institution.</p>

  <div class="panel panel--stop">
    <p class="panel__h">What a status of Derivable does not mean</p>
    <p>It means the material exists, not that the book is written. A derivable title still needs
      editing, sequencing, design and proofing — the judgement that turns a database into
      something worth reading. What it does not need is new curriculum or a decision from anyone.
      Treating <i>derivable</i> as <i>done</i> is the single most likely way for this catalogue to
      be misused.</p>
  </div>
</section>

${planHtml}

<section class="part">
  <p class="part__n">III</p>
  <p class="eyebrow">Part Three</p>
  <h1>The House Identity</h1>
  <p>What never varies, what varies by series and only by series, and every number derived from
    the system that sets the books rather than restated from memory.</p>
</section>

<section class="con">
  <p class="eyebrow">The signature</p>
  <h2>Constants</h2>
  <p class="lead">A publication that departs from these is not a publication of this Press.</p>
  ${pairs(CONSTANTS)}
</section>

<section class="con">
  <p class="eyebrow">Formats</p>
  <h2>Four trims, chosen for how the book is held</h2>
  <table><thead><tr><th scope="col">Format</th><th scope="col">Trim</th>
    <th scope="col">Used for</th><th scope="col">Why this size</th></tr></thead><tbody>
    ${FORMATS.map((f) => `<tr><td><b>${esc(f.name)}</b></td>
      <td class="mono nowrap">${f.w}&nbsp;×&nbsp;${f.h}&nbsp;mm</td><td>${esc(f.use)}</td>
      <td>${esc(f.why)}</td></tr>`).join('')}
  </tbody></table>

  <h3>The text block, derived</h3>
  <p>Margins are proportions of the trim, so one rule governs four formats: ${
  Object.entries(MARGINS.ratios).map(([k, v]) => `${k} ${(v * 100).toFixed(1)} %`).join(', ')}.
    ${esc(MARGINS.note)} A measure ceiling of ${MARGINS.maxMeasureChars} characters is applied
    afterwards, because the ratios alone produce an unreadably long line at the larger trims.</p>
  <table><thead><tr><th scope="col">Format</th><th scope="col">Gutter</th><th scope="col">Fore</th>
    <th scope="col">Head</th><th scope="col">Foot</th><th scope="col">Measure</th></tr></thead><tbody>
    ${FORMATS.map((f) => {
    const m = marginsFor(f.key, 300);
    return `<tr><td>${esc(f.name)}</td><td class="mono">${m.gutter} mm</td>
      <td class="mono">${m.fore} mm</td><td class="mono">${m.head} mm</td>
      <td class="mono">${m.foot} mm</td>
      <td class="mono">${m.measureChars} ch${m.measureConstrained ? ' *' : ''}</td></tr>`;
  }).join('')}
  </tbody></table>
  <p class="small">At 300 pages. * The fore-edge has been widened beyond its ratio to hold the
    measure at the ceiling. Gutter allowance by extent: ${
  MARGINS.gutterAllowance.map(([band, mm]) => `${band} + ${mm} mm`).join(' · ')}.</p>
</section>

<section class="con">
  <p class="eyebrow">Series</p>
  <h2>One colour per series, printed on the ground where it is legible</h2>
  <p class="lead">A series colour appears as a rule on a cover and a band on a spine, and both
    carry meaning at a distance. It is assigned as a decision and then checked as a measurement.</p>
  <table><thead><tr><th scope="col">Series</th><th scope="col">Colour</th>
    <th scope="col">On text paper</th><th scope="col">On the navy ground</th>
    <th scope="col">Printed on</th></tr></thead><tbody>
    ${COLOURS.map((c) => `<tr><td><b>${esc(c.series)}</b></td>
      <td class="mono"><span class="swatch" style="background:${esc(c.hex)}"></span>${esc(c.hex)}</td>
      <td class="mono">${c.onPaper.toFixed(2)} : 1</td>
      <td class="mono">${c.onNavy.toFixed(2)} : 1</td>
      <td>${esc(c.ground)}</td></tr>`).join('')}
  </tbody></table>
  ${pairs(COLOUR_USE)}
  <div class="panel">
    <p class="panel__h">Three rules, all three broken by the first assignment made by eye</p>
    <p>One colour, one series — two series had been given the same blue and two more the same
      gold. The house ground is not a series colour — midnight navy had been assigned to the
      Reference series, and midnight navy on a midnight navy spine measures 1.00 : 1. And every
      series colour is printed on the ground where it reaches 3 : 1, stated here rather than left
      to whoever sets the next cover. All three are now checked when this page is generated, which
      is why the assignment above is different from the one first written down.</p>
  </div>
</section>

<section class="con">
  <p class="eyebrow">Covers</p>
  <h2>The cover system</h2>
  <p class="lead">A grid in twelfths of the trim, so one composition holds at every format.</p>
  ${pairs(COVER_GRID)}
  <h3 style="margin-top:12pt">Cover fields, by readership</h3>
  ${pairs(COVER_FIELDS)}
  <h3 style="margin-top:12pt">The back cover</h3>
  ${pairs(BACK_COVER)}
</section>

<section class="con">
  <p class="eyebrow">Spines</p>
  <h2>Spine width is computed; what it carries follows from the width</h2>
  <p class="lead">Caliper ${spineFor(400).caliper} mm per leaf, from the same function that
    produced the flagship cover artwork. A spine estimated rather than computed wraps the front
    cover artwork onto the edge of the book, and it is discovered after printing.</p>
  <table><thead><tr><th scope="col">Extent</th><th scope="col">Spine</th>
    <th scope="col">Band</th><th scope="col">Carries</th></tr></thead><tbody>
    ${[64, 160, 320, 441].map((p) => {
    const s = spineFor(p);
    return `<tr><td class="mono">${p} pp</td><td class="mono">${s.mm} mm</td>
      <td>${esc(s.band)}</td><td>${esc(s.carries)}</td></tr>`;
  }).join('')}
  </tbody></table>
  <p class="small">Bleed ${spineFor(400).bleed} mm on all four edges of the cover spread.
    ${SPINE_RULES[0].carries}</p>
</section>

<section class="con">
  <p class="eyebrow">Interior</p>
  <h2>Openers, dividers and endpapers</h2>
  ${pairs(OPENERS)}
  <h3 style="margin-top:12pt">Endpapers</h3>
  ${pairs(ENDPAPERS)}
  <h3 style="margin-top:12pt">Navigation</h3>
  ${pairs(NAVIGATION)}
</section>

<section class="con">
  <p class="eyebrow">Information design</p>
  <h2>Figures and tables</h2>
  ${pairs(FIGURE_RULES)}
  <h3 style="margin-top:12pt">Tables</h3>
  ${pairs(TABLE_RULES)}
</section>

<section class="con">
  <p class="eyebrow">Image</p>
  <h2>Photography, illustration and iconography</h2>
  ${pairs(PHOTOGRAPHY)}
  <h3 style="margin-top:12pt">Iconography</h3>
  ${pairs(ICONOGRAPHY)}
</section>

<section class="con">
  <p class="eyebrow">Production</p>
  <h2>Edition classes</h2>
  <p class="lead">Physical standards stated per class, so a new publication inherits a complete
    specification by declaring which class it belongs to. Costs are absent because they are a
    procurement matter and would be invented here.</p>
  <table><thead><tr><th scope="col">Class</th><th scope="col">Paper</th><th scope="col">Binding</th>
    <th scope="col">Cover</th><th scope="col">Finish</th></tr></thead><tbody>
    ${EDITION_CLASSES.map((e) => `<tr><td><b>${esc(e.name)}</b><br>
      <span class="small">${esc(e.use)}</span></td>
      <td>${esc(e.paper)}</td><td>${esc(e.binding)}</td><td>${esc(e.cover)}</td>
      <td>${esc(e.finish)}</td></tr>`).join('')}
  </tbody></table>
  <h3 style="margin-top:12pt">Digital standards</h3>
  ${pairs(DIGITAL_STANDARDS)}

  <div class="panel panel--stop">
    <p class="panel__h">The limitation that governs every specification above</p>
    <p>No publication of this Press has ever been printed. Every stock, caliper, binding and
      finish here is specified from published trade data and has not been proofed on press. The
      spine widths are computed from a caliper that has not been verified against a physical
      sample. Nothing in Part Three should be sent to a full print run without a wet proof, and
      this paragraph exists so that no future editor can claim they were not told.</p>
  </div>

  <div class="fleuron">${fleuron({ colour: PAL.royalGold, width: 110 })}</div>
</section>

<section class="part">
  <p class="part__n">IV</p>
  <p class="eyebrow">Part Four</p>
  <h1>The Legacy Constitution</h1>
  <p>Everything before this part assumed one editor — not by intention, by omission. This part
    adds the apparatus that lets a publication outlive the people who made it.</p>
</section>

<section class="con">
  <div class="con__h">
    <p class="eyebrow">Families</p>
    <h2>No publication exists in isolation</h2>
    <p class="lead">Every title belongs to one family with a stated purpose and readership. It is
      the only grouping axis: an earlier draft carried a series for colour and a family for
      meaning, which is two taxonomies for one distinction.</p>
  </div>
  <table><thead><tr><th scope="col">Family</th><th scope="col">Titles</th>
    <th scope="col">What it is for</th><th scope="col">Readership</th></tr></thead><tbody>
    ${familyTable(ECO).map((f) => {
    const col = COLOURS.find((c) => c.family === f.key);
    return `<tr><td><b>${col ? `<span class="swatch" style="background:${esc(col.hex)}"></span>` : ''
    }${esc(f.key)}</b></td><td class="mono">${f.titles.length}</td>
      <td>${esc(f.purpose)}</td><td>${esc(f.readership)}</td></tr>`;
  }).join('')}
  </tbody></table>
  <p class="small">Every family carries at least one title and every title carries a family; both
    are asserted by a test rather than checked by eye.</p>
</section>

<section class="con">
  <div class="con__h">
    <p class="eyebrow">Maturity</p>
    <h2>A first edition is never a settled one</h2>
    <p class="lead">Maturity is derived, not typed. The temptation to call a first edition mature
      arrives exactly when the book is being shown to someone.</p>
  </div>
  <table><thead><tr><th scope="col">Status</th><th scope="col">Titles</th>
    <th scope="col">What it means</th></tr></thead><tbody>
    ${MATURITY_MEANS.map(([m, meaning]) => `<tr><td><b>${esc(m)}</b></td>
      <td class="mono">${ECO.filter((r) => r.maturity === m).length}</td>
      <td>${esc(meaning)}</td></tr>`).join('')}
  </tbody></table>
  <div class="panel panel--stop">
    <p class="panel__h">Why nothing is above First edition</p>
    <p>A publication may only be called Reviewed if a review is recorded by a reader who did not
      produce it. The review register holds ${REVIEWS.length} entries. Nine artefacts have been
      issued and not one has been read by anybody outside the editorial function, which is a fact
      about this Press rather than a judgement about the books, and it is printed here because
      the alternative is that a reader assumes otherwise.</p>
  </div>
</section>

<section class="con">
  <div class="con__h">
    <p class="eyebrow">Readiness</p>
    <h2>Nine properties, probed rather than promised</h2>
    <p class="lead">"Accessibility-ready" is the easiest sentence in publishing to write and the
      easiest to be wrong about. Each property below is a function from the artefact to true or
      false, and the Press prints the result.</p>
  </div>
  <table><thead><tr><th scope="col">Property</th>${
  PROBED.map((p, i) => `<th scope="col" class="nowrap">${String.fromCharCode(65 + i)}</th>`).join('')
}<th scope="col">What it means</th></tr></thead><tbody>
    ${READINESS.map((prop, pi) => `<tr><td class="nowrap"><b>${esc(prop.name)}</b></td>${
  PROBED.map((p) => {
    const r = p.readiness[pi].result;
    return `<td class="mono ${r === true ? 'ok' : r === false ? 'no' : ''}">${
      r === true ? '✓' : r === false ? '✗' : '–'}</td>`;
  }).join('')}<td>${esc(prop.means)}</td></tr>`).join('')}
  </tbody></table>
  <table class="pairs"><tbody>${PROBED.map((p, i) =>
    `<tr><td class="pairs__k">${String.fromCharCode(65 + i)}</td><td>${esc(p.name)}${
      p.edition ? ` — ${esc(p.edition)}` : ''}</td></tr>`).join('')}</tbody></table>
  <p class="small">✓ present · ✗ absent · – not establishable from this artefact. Each publication
    is probed as it stands on disk when this copy is generated, so this volume's own row describes
    its previous impression: a book cannot read a file it has not yet written. Structural
    properties are read from the PDF; document properties from the source the renderer wrote.</p>

  <h3 style="margin-top:12pt">What no probe here can establish</h3>
  ${pairs(UNPROVABLE)}
</section>

<section class="con">
  <div class="con__h">
    <p class="eyebrow">Continuity</p>
    <h2>The four questions asked before any publication is approved</h2>
    <p class="lead">Recorded here rather than in a reviewer's head, with the answer this Press
      currently gives.</p>
  </div>
  ${pairs(FUTURE_PROOFING)}
  <div class="panel">
    <p class="panel__h">What a future editorial board inherits</p>
    <p>A working system and a written account of why it is the way it is. Every artefact is
      generated from the academic database by a named script and none is hand-edited; every
      standard is measured rather than remembered; every claim is tested; and every revision is
      derived from the source repository rather than from a list somebody has to keep updating.
      The one dependency that would force a rebuild rather than a repair is the toolchain: the
      renderers rest on one browser engine's paged-media implementation, and that is stated here
      so that the board which has to replace it knows it was known.</p>
  </div>
</section>

<section>
  <p class="eyebrow">Closing</p>
  <h2>What is settled here, and what is not</h2>
  <p>Settled: the rules, the catalogue, the identity, and the arithmetic underneath all three.
    ${forceCount(FORCE.ENFORCED)} clauses are enforced by tests. ${
  ROWS.filter((r) => r.status === STATUS.DERIVABLE).length} titles can be produced with no new
    curriculum and no institutional decision. Every format, margin, spine and series colour in
    Part Three is derived from the system that sets the books rather than restated beside it.</p>
  <p>Not settled, and not the Press's to settle: ${
  ROWS.filter((r) => r.status === STATUS.GOVERNANCE).length} titles wait on institutional
    decisions — appointed officers, a registered publisher prefix, a print budget, a completed
    academic year, a signed contract. ${
  ROWS.filter((r) => r.status === STATUS.AUTHORING).length} wait on academic authoring, and each
    one states how much. ${forceCount(FORCE.DRAFT)} clauses are drafted and bind nothing until
    somebody with the standing to adopt them does.</p>
  <p>The distinction between those two paragraphs is the whole discipline of this volume. A
    publishing house that cannot say which of its plans are its own to execute will eventually
    execute one that was not.</p>
  <p class="small" style="margin-top:14pt">${esc(ID.publicationId)} · Document ID
    ${esc(ID.documentId)} · Generated ${esc(ID.generated)} · WorldWide English College Press,
    an imprint of WorldWide English College — London Campus · London,
    ${new Date().getFullYear()}</p>
</section>

${legacyBlock({
  id: ID,
  title: 'WorldWide English College Press',
  subtitle: 'The Publishing Constitution',
  family: OWN.family.key,
  audience: OWN.audience,
  subjects: ['Publishers and publishing — Standards', 'Book design', 'Editorial policy',
    'Scholarly publishing', 'Educational publishing'],
  relatives: OWN.relatives,
  maturity: OWN.maturity,
  artefact: OWN.artefact,
  ink: PAL.royalBlue, rule: PAL.platinum, soft: PAL.slateGrey, accent: PAL.royalGold,
  panel: PAL.softCream,
})}

${rightsPage({
  title: VOLUME,
  mark: MARK,
  edition: `${ID.editionName} edition`,
  year: ID.year,
  palette: {
    ink: PAL.warmCharcoal, deep: PAL.royalBlue, grey: PAL.slateGrey, gold: PAL.bronze,
    rule: PAL.platinum, wash: PAL.softCream, serif: TYPE.serif, sans: TYPE.sans,
  },
})}
</body></html>`;

mkdirSync(path.join(ROOT, 'publication'), { recursive: true });
writeFileSync(path.join(ROOT, 'publication', '.press.html'), html);

const exe = process.env.PW_CHROMIUM || '/opt/pw-browsers/chromium-1194/chrome-linux/chrome';
const browser = await chromium.launch(existsSync(exe) ? { executablePath: exe } : {});
const page = await browser.newPage();
await page.setContent(html, { waitUntil: 'load' });
const out = path.join(ROOT, 'publication', 'WEC Press — The Publishing Constitution.pdf');
await page.pdf({
  path: out,
  format: 'A4',
  printBackground: true,
  preferCSSPageSize: true,
  displayHeaderFooter: true,
  headerTemplate: runningHead(MARK, { gutter: 20 }),
  footerTemplate: runningFoot(VOLUME, { gutter: 20, size: 7.2 }),
  margin: { top: '18mm', bottom: '15mm', left: '20mm', right: '20mm' },
  tagged: true,
  outline: true,
});
await browser.close();

const pages = (await import('node:fs')).readFileSync(out).toString('latin1')
  .match(/\/Type\s*\/Page(?![s])/g)?.length ?? 0;

console.log(`PRESS     ${out}`);
console.log(`  ${pages} pages · ${CONSTITUTIONS.length} constitutions · ${CLAUSES.length} clauses `
  + `(${forceCount(FORCE.ENFORCED)} enforced) · ${ROWS.length} titles across ${SERIES.length} series`);
console.log(`  ${statusCounts(ROWS).map(([s, n]) => `${s} ${n}`).join(' · ')}`);
console.log(`  waves: ${plan(ROWS).map((w) => `${w.n}:${w.titles.length}`).join(' ')}`);
