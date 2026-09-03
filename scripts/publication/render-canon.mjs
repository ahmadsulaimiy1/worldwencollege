/**
 * THE WORLDWIDE ENGLISH COLLEGE CANON — the living index, rendered.
 *
 * One volume that answers, for any reader: what should I open, what
 * goes with it, and what comes next. It is the only publication of the
 * Press whose job is to describe the others, which makes it the one
 * most likely to drift from them — so nothing in it is transcribed.
 * Every row is read from the catalogue, the legacy layer and the canon
 * at generation, and the duplication register and the impact ranking
 * are printed whole rather than summarised.
 *
 * Set at the scholarly trim rather than the flagship's: it is consulted
 * by staff and reviewers, not read through by learners.
 */
import { writeFileSync, mkdirSync, existsSync, readFileSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { chromium } from 'playwright';
import { buildCurriculum } from './curriculum.mjs';
import { TYPE, C as PAL, BRAND } from './design.mjs';
import { crest, fleuron, guillocheBand } from './ornament.mjs';
import { publicationIdentity } from './identity.mjs';
import { legacyBlock, ecosystem, MATURITY } from './legacy.mjs';
import { STATUS, inventory, catalogue, statusCounts } from './catalogue.mjs';
import { formatFor, marginsFor, familyColours } from './house.mjs';
import {
  DIVISIONS, SLATE, DUPLICATIONS, RESOLUTION, CRITERIA, MAX_SCORE,
  canonIndex, ranking, unplaced,
} from './canon.mjs';
import { dashboard, completion, INTEGRITY } from './coverage.mjs';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..');
const esc = (s) => String(s ?? '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');

const FAMILY = 'WEC Governance Series';
const FMT = formatFor('scholarly');
const M = marginsFor('scholarly', 120);
const ACCENT = familyColours().find((c) => c.family === FAMILY);

const C = buildCurriculum();
const ID = publicationIdentity(C, { edition: 1, revision: 0, impression: 1 });
const INV = inventory(C);
const ROWS = catalogue(INV);
const INDEX = canonIndex(INV);
const RANK = ranking(ROWS);
const ECO = ecosystem(INV);
const COV = dashboard(C, ROWS);
const DONE = completion(SLATE, ROWS);

const STATUS_CLASS = {
  [STATUS.PUBLISHED]: 's--pub', [STATUS.DERIVABLE]: 's--der',
  [STATUS.AUTHORING]: 's--aut', [STATUS.GOVERNANCE]: 's--gov',
};
const RES_CLASS = {
  [RESOLUTION.JUSTIFY]: 'r--just', [RESOLUTION.REFERENCE]: 'r--ref',
  [RESOLUTION.REMOVE]: 'r--rem',
};

const link = (rows) => (rows.length
  ? rows.map((r) => `<span class="lk">${esc(r.name)}</span>`).join('')
  : '<span class="lk lk--none">—</span>');

const entry = (row) => `<article class="ent">
  <header>
    <h3>${esc(row.title)}${row.edition ? ` <span class="ent__ed">${esc(row.edition)}</span>` : ''}</h3>
    ${row.status
    ? `<span class="s ${STATUS_CLASS[row.status]}">${esc(row.status)}</span>`
    : `<span class="s ${RES_CLASS[row.duplication.resolution]}">${esc(row.duplication.resolution)}</span>`}
  </header>
  ${row.duplication ? `<p class="ent__dup"><span>Not a separate volume</span>${
  esc(row.duplication.why)}</p>` : ''}
  ${row.audience ? `<dl class="ent__meta">
    <dt>Requested as</dt><dd>${esc(row.slot)}</dd>
    <dt>Family</dt><dd>${esc(row.family || '—')}</dd>
    <dt>Readership</dt><dd>${esc(row.audience)}</dd>
    <dt>Maturity</dt><dd>${esc(row.maturity)}</dd>
    ${row.artefact ? `<dt>Artefact</dt><dd class="mono">${esc(row.artefact)}</dd>` : ''}
  </dl>` : ''}
  ${row.status ? `<table class="rel"><tbody>
    <tr><td class="rel__k">Read before</td><td>${link(row.before)}</td></tr>
    <tr><td class="rel__k">Read alongside</td><td>${link(row.alongside)}</td></tr>
    <tr><td class="rel__k">Read after</td><td>${link(row.after)}</td></tr>
  </tbody></table>` : ''}
  ${row.shortfall && row.shortfall.length ? `<p class="ent__short"><span>Shortfall</span>${
  row.shortfall.map((x) => `${esc(x.what)}: ${x.have} of ${x.need}`).join(' · ')}</p>` : ''}
  ${row.governance ? `<p class="ent__gov"><span>Governance</span>${esc(row.governance)}</p>` : ''}
</article>`;

const divisionSection = (d) => {
  const rows = INDEX.filter((r) => r.division === d.n);
  const live = rows.filter((r) => r.status);
  return `
<section class="div">
  <div class="div__open">
    <p class="eyebrow">Division ${esc(d.n)}</p>
    <h1>${esc(d.name)}</h1>
    <p class="div__purpose">${esc(d.purpose)}</p>
    <p class="div__reader">For ${esc(d.reader.toLowerCase())} · ${live.length} titles${
  rows.length - live.length
    ? ` · ${rows.length - live.length} requested slot${rows.length - live.length === 1 ? '' : 's'} `
      + 'resolved as not separate volumes' : ''}</p>
  </div>
  ${rows.map(entry).join('')}
</section>`;
};

const LEGACY = legacyBlock({
  id: ID,
  title: 'The Worldwide English College Canon',
  subtitle: 'The Canon Index',
  family: FAMILY,
  audience: 'Every reader of a WEC Press publication, and every editor of a future one',
  subjects: ['Publishers and publishing — Catalogues', 'Educational publishing',
    'Library science — Collection development', 'Scholarly publishing'],
  artefact: 'publication/WEC Canon Index.pdf',
  relatives: (ECO.find((r) => /Publishing Constitution/.test(r.name)) || {}).relatives || [],
  maturity: MATURITY.FIRST,
  ink: PAL.royalBlue, rule: PAL.platinum, soft: PAL.slateGrey, accent: ACCENT.hex,
  panel: PAL.softCream,
});

const html = `<!doctype html><html lang="en-GB"><head><meta charset="utf-8">
<title>The Worldwide English College Canon — The Canon Index</title>
<style>
@page { size:${FMT.w}mm ${FMT.h}mm; margin:${M.head}mm ${M.fore}mm ${M.foot}mm ${M.gutter}mm; }
@page :left  { margin-left:${M.fore}mm; margin-right:${M.gutter}mm; }
@page :right { margin-left:${M.gutter}mm; margin-right:${M.fore}mm; }
* { box-sizing:border-box; }
body { margin:0; font-family:${TYPE.serif}; font-size:9pt; line-height:1.5;
  color:${PAL.warmCharcoal}; background:${BRAND.paper};
  -webkit-print-color-adjust:exact; print-color-adjust:exact;
  hyphens:auto; text-wrap:pretty; orphans:3; widows:3; }
h1,h2,h3 { break-after:avoid; font-weight:700; color:${PAL.royalBlue}; }
h1 { font-size:20pt; line-height:1.12; margin:0 0 5pt; }
h2 { font-size:13pt; margin:16pt 0 5pt; }
h3 { font-size:10pt; margin:0; color:${PAL.midnightNavy}; }
p { margin:0 0 5pt; }
.eyebrow { font-family:${TYPE.sans}; font-size:6.2pt; font-weight:700; letter-spacing:.26em;
  text-transform:uppercase; color:${ACCENT.hex}; margin:0 0 5pt; }
.small { font-family:${TYPE.sans}; font-size:7pt; color:${PAL.slateGrey}; }
.mono { font-family:"Consolas","DejaVu Sans Mono",monospace; font-size:6.8pt; }
.nowrap { white-space:nowrap; }

.title { height:${FMT.h - M.head - M.foot - 4}mm; break-after:page; break-inside:avoid;
  background:${PAL.midnightNavy}; color:${BRAND.paper}; padding:18mm 16mm 12mm;
  display:flex; flex-direction:column; }
.title h1 { color:${BRAND.paper}; font-size:26pt; max-width:12em; }
.title .eyebrow { color:${PAL.champagneGold}; }
.title__rule { height:1.4pt; background:${PAL.royalGold}; width:44mm; margin:10pt 0 12pt; }
.title__sub { font-size:11pt; color:${PAL.platinum}; max-width:24em; }
.title__fill { flex:1; }
.title__meta { font-family:${TYPE.sans}; font-size:7pt; color:${PAL.platinum}; line-height:1.75; }

.div { break-before:page; }
.div__open { break-inside:avoid; break-after:avoid; border-top:2pt solid ${ACCENT.hex};
  padding-top:9pt; margin-bottom:11pt; }
.div__purpose { font-size:10pt; color:${PAL.imperialBlue}; margin:5pt 0 4pt; }
.div__reader { font-family:${TYPE.sans}; font-size:6.8pt; letter-spacing:.1em;
  text-transform:uppercase; color:${PAL.slateGrey}; margin:0; }

.ent { break-inside:avoid; padding:8pt 0 7pt; border-bottom:.4pt solid #EDEFF4; }
.ent header { display:flex; justify-content:space-between; align-items:baseline; gap:8pt;
  margin:0 0 5pt; }
.ent__ed { font-family:${TYPE.sans}; font-size:7pt; font-weight:400; color:${PAL.bronze}; }
.s { font-family:${TYPE.sans}; font-size:6pt; font-weight:700; letter-spacing:.12em;
  text-transform:uppercase; padding:1.8pt 5pt; border-radius:1.5pt; white-space:nowrap; }
.s--pub { background:#E4F0E8; color:#1E6B3A; }
.s--der { background:#EAEFF8; color:${PAL.imperialBlue}; }
.s--aut { background:#F6F1E4; color:${PAL.bronze}; }
.s--gov { background:#FBEAEC; color:${PAL.deepCrimson}; }
.r--just { background:#EAEFF8; color:${PAL.imperialBlue}; }
.r--ref  { background:#F6F1E4; color:${PAL.bronze}; }
.r--rem  { background:#FBEAEC; color:${PAL.deepCrimson}; }

dl.ent__meta { margin:0 0 5pt; font-size:8pt; display:grid; grid-template-columns:24% 1fr;
  column-gap:7pt; }
dl.ent__meta dt { font-family:${TYPE.sans}; font-size:6.4pt; font-weight:700;
  letter-spacing:.08em; text-transform:uppercase; color:${PAL.slateGrey}; padding:1.6pt 0; }
dl.ent__meta dd { margin:0; padding:1.6pt 0; }

table.rel { width:100%; border-collapse:collapse; font-size:8pt; margin:4pt 0 0; }
table.rel td { padding:2.6pt 0; border-top:.4pt solid #F1F3F7; vertical-align:top; }
.rel__k { font-family:${TYPE.sans}; font-size:6.4pt; font-weight:700; letter-spacing:.08em;
  text-transform:uppercase; color:${ACCENT.hex}; width:24%; white-space:nowrap; }
.lk { display:inline-block; font-size:7.6pt; background:${PAL.softCream};
  border-left:1.6pt solid ${PAL.champagneGold}; padding:1.4pt 5pt; margin:0 4pt 3pt 0; }
.lk--none { background:none; border-left-color:${PAL.platinum}; color:${PAL.slateGrey}; }

.ent__dup, .ent__short, .ent__gov { font-size:8pt; padding-left:8pt; margin:0 0 5pt;
  border-left:2pt solid ${PAL.platinum}; }
.ent__dup { border-left-color:${PAL.deepCrimson}; }
.ent__short { border-left-color:${PAL.bronze}; }
.ent__gov { border-left-color:${PAL.deepCrimson}; }
.ent__dup span, .ent__short span, .ent__gov span { display:block; font-family:${TYPE.sans};
  font-size:6.2pt; font-weight:700; letter-spacing:.14em; text-transform:uppercase;
  color:${PAL.slateGrey}; margin-bottom:1.5pt; }

table { width:100%; border-collapse:collapse; font-size:8pt; margin:6pt 0 11pt; }
thead { display:table-header-group; }
th { background:${ACCENT.hex}; color:#fff; text-align:left; padding:3.5pt 6pt;
  font-family:${TYPE.sans}; font-size:6.2pt; letter-spacing:.1em; text-transform:uppercase; }
td { padding:3.5pt 6pt; border-bottom:.4pt solid #E8EBF1; vertical-align:top; }
tr { break-inside:avoid; }
td.ok { color:#1E6B3A; font-weight:700; }
td.no { color:${PAL.deepCrimson}; font-weight:700; }
.rank { font-family:"Consolas","DejaVu Sans Mono",monospace; font-weight:700;
  color:${PAL.royalBlue}; }

.panel { border-left:2.2pt solid ${ACCENT.hex}; background:${PAL.softCream}; padding:8pt 10pt;
  margin:10pt 0; break-inside:avoid; }
.panel--stop { border-left-color:${PAL.deepCrimson}; background:#FBF1F1; }
.panel__h { font-family:${TYPE.sans}; font-size:6.6pt; font-weight:700; letter-spacing:.14em;
  text-transform:uppercase; color:${ACCENT.hex}; margin:0 0 3pt; }
.panel--stop .panel__h { color:${PAL.deepCrimson}; }
.panel p:last-child { margin:0; }
.fleuron { text-align:center; margin:12pt 0; }
</style></head><body>

<section class="title">
  <div>${crest({ size: 60, gold: PAL.royalGold, ink: 'none', mono: true })}</div>
  <p class="eyebrow" style="margin-top:12pt">Worldwide English College · London Campus</p>
  <h1>The Worldwide English College Canon</h1>
  <div class="title__rule"></div>
  <p class="title__sub">The Canon Index: five divisions, every title, and what to read before,
    alongside and after each of them.</p>
  <div class="title__fill"></div>
  <div style="margin-bottom:10pt">${guillocheBand({
  width: 760, height: 32, stroke: PAL.champagneGold, opacity: 0.5,
})}</div>
  <div class="title__meta">
    ${FAMILY} · First edition · ${esc(ID.generated)}<br>
    ${INDEX.filter((r) => r.status).length} titles in five divisions ·
    ${DUPLICATIONS.length} overlaps resolved<br>
    Document ID ${esc(ID.documentId)}
  </div>
</section>

<section>
  <p class="eyebrow">What a canon is</p>
  <h1 style="font-size:16pt">A library, not a list</h1>
  <p>A catalogue answers what could be published and what stops it. This index answers a harder
    question: when a learner enrols, is everything they need already here, and does it hang
    together? A library where a reader has to guess what to open next is a shelf.</p>
  <p>So every title states what should be read before it, what goes alongside it, and what
    follows. Those relationships are declared here and checked by a test: a title that pointed at
    a publication which does not exist would fail the build.</p>

  <table><thead><tr><th scope="col">Division</th><th scope="col">For</th>
    <th scope="col">Titles</th><th scope="col">Purpose</th></tr></thead><tbody>
    ${DIVISIONS.map((d) => `<tr><td class="nowrap"><b>${esc(d.n)} · ${esc(d.name)}</b></td>
      <td>${esc(d.reader)}</td>
      <td class="mono">${INDEX.filter((r) => r.division === d.n && r.status).length}</td>
      <td>${esc(d.purpose)}</td></tr>`).join('')}
  </tbody></table>

  <h2>Where the canon stands</h2>
  <table><thead><tr><th scope="col">Status</th><th scope="col">Titles</th>
    <th scope="col">What it means</th></tr></thead><tbody>
    ${statusCounts(ROWS).map(([st, n]) => `<tr><td><span class="s ${STATUS_CLASS[st]}"
      >${esc(st)}</span></td><td class="mono">${n}</td><td>${esc({
  [STATUS.PUBLISHED]: 'Issued, with an artefact and a build script.',
  [STATUS.DERIVABLE]: 'Every requirement met by material that exists. Editorial work only.',
  [STATUS.AUTHORING]: 'Short of material, by a stated number.',
  [STATUS.GOVERNANCE]: 'Blocked on an authority the Press does not hold.',
}[st])}</td></tr>`).join('')}
  </tbody></table>
  <p class="small">Every catalogue title is placed in a division: ${unplaced().length} are
    unplaced. A publication that belonged to no division would be the thing this index exists to
    prevent.</p>
</section>

<section class="div">
  <div class="div__open">
    <p class="eyebrow">The editorial rule</p>
    <h1>What is not a separate book</h1>
    <p class="div__purpose">No book may duplicate another. Where material appears twice it is
      justified, referenced, or removed — and each of the ${DUPLICATIONS.length} overlaps below
      is resolved one of those three ways, in the open.</p>
    <p class="div__reader">A press that publishes the same rubric three times under three titles
      has not published three books</p>
  </div>
  ${DUPLICATIONS.map((d) => `<article class="ent">
    <header><h3>${esc(d.slot)}</h3>
      <span class="s ${RES_CLASS[d.resolution]}">${esc(d.resolution)}</span></header>
    <p>${esc(d.why)}</p>
    <table class="rel"><tbody><tr><td class="rel__k">Into</td><td>${
  link(d.into.map((n) => ({ n, name: (ECO.find((r) => r.n === n) || {}).name || `#${n}` })))
}</td></tr></tbody></table>
  </article>`).join('')}
</section>

<section class="div">
  <div class="div__open">
    <p class="eyebrow">Publishing order</p>
    <h1>Ranked by educational impact</h1>
    <p class="div__purpose">The easiest book to produce next is almost never the one that most
      improves teaching. These are the ${RANK.length} derivable titles, scored against declared
      criteria, in the order they should be published.</p>
    <p class="div__reader">Score out of ${MAX_SCORE} · weighted · reasons attached</p>
  </div>

  <table><thead><tr><th scope="col">Criterion</th><th scope="col">Weight</th>
    <th scope="col">Scale</th></tr></thead><tbody>
    ${CRITERIA.map((c) => `<tr><td class="nowrap"><b>${esc(c.name)}</b></td>
      <td class="mono">×${c.weight}</td><td>${esc(c.scale)}</td></tr>`).join('')}
  </tbody></table>

  <table><thead><tr><th scope="col">#</th><th scope="col">Title</th><th scope="col">Score</th>
    <th scope="col">Why it sits here</th></tr></thead><tbody>
    ${RANK.map((r, i) => `<tr><td class="rank">${i + 1}</td>
      <td><b>${esc(r.name)}</b></td><td class="mono">${r.score}</td>
      <td>${esc(r.why)}</td></tr>`).join('')}
  </tbody></table>

  <div class="panel">
    <p class="panel__h">The tie, and how it was broken</p>
    <p>The Workbook and the Listening Scripts both score ${RANK[0].score}. The tie-break is
      declared rather than resolved by whichever happened to be listed first: the title that
      unblocks more goes ahead. The scripts unblock listening lessons that cannot currently run
      at all — there are no recordings, and the scripts have never been printed — while the
      workbook improves lessons that already can.</p>
  </div>
</section>

<section class="div">
  <div class="div__open">
    <p class="eyebrow">Coverage</p>
    <h1>Measured by what a lesson has, not by how many books exist</h1>
    <p class="div__purpose">A publication count only goes up, and it goes up whether or not a
      learner is better served. This asks a different question of each of the ${COV.lessons}
      teaching lessons: is the resource needed for THIS lesson in a publication a reader can
      hold?</p>
    <p class="div__reader">${COV.materialPct}% of resources exist as material ·
      ${COV.publishedPct}% are in an issued publication ·
      ${COV.fullyServed} of ${COV.lessons} lessons are fully served today</p>
  </div>

  <div class="panel">
    <p class="panel__h">What this figure does not measure</p>
    <p>Coverage measures availability: is the resource in a volume a reader can open. It does not
      measure usability. The Assessment Handbook ranked first for educational impact and moved
      published coverage by nought points, because every rubric it prints was already available —
      inside the 443-page Teacher's Edition, one rubric per lesson, sixty places. Availability was
      complete; consistent marking was impossible. The two instruments are kept apart rather than
      reconciled, because a coverage figure that rose whenever a book was published would be a
      publication count wearing a percentage sign.</p>
  </div>

  <div class="panel">
    <p class="panel__h">Why two numbers and not one</p>
    <p>Material coverage is what the academic database holds. Published coverage is what a reader
      can actually open. Collapsing them would flatter the Press badly: vocabulary support has
      material coverage of 100 % and published coverage of nought — every lesson teaches lexis,
      and no issued volume gathers it. The distance between the two columns is this Press's
      backlog, stated as a number rather than as an intention.</p>
  </div>

  <table><thead><tr><th scope="col">Resource</th><th scope="col">Material</th>
    <th scope="col">Published</th><th scope="col">Backlog</th>
    <th scope="col">What it is</th></tr></thead><tbody>
    ${COV.byResource.map((r) => `<tr>
      <td class="nowrap"><b>${esc(r.name)}</b></td>
      <td class="mono">${r.materialPct}%</td>
      <td class="mono ${r.publishedPct === 100 ? 'ok' : r.publishedPct === 0 ? 'no' : ''}"
        >${r.publishedPct}%</td>
      <td class="mono">${r.backlog || '—'}</td>
      <td>${esc(r.what)}</td></tr>`).join('')}
  </tbody></table>

  <h2>By level, so a thin level cannot hide inside an average</h2>
  <table><thead><tr><th scope="col">Level</th><th scope="col">Lessons</th>
    <th scope="col">Material</th><th scope="col">Published</th></tr></thead><tbody>
    ${COV.byLevel.map((l) => `<tr><td class="nowrap"><b>Level ${esc(l.roman)}</b></td>
      <td class="mono">${l.lessons}</td><td class="mono">${l.materialPct}%</td>
      <td class="mono">${l.publishedPct}%</td></tr>`).join('')}
  </tbody></table>
  <p class="small">Coverage is even across the levels because the curriculum is: every level
    carries nineteen teaching lessons built to the same template. An uneven row here would mean a
    level had been authored to a different standard.</p>
</section>

<section class="div">
  <div class="div__open">
    <p class="eyebrow">The learning journey</p>
    <h1>Eight questions, answered by named publications</h1>
    <p class="div__purpose">What each reader needs at each moment, and whether an issued
      publication answers it. A question with no issued answer is a canonical gap, computed
      rather than judged.</p>
    <p class="div__reader">${COV.journey.filter((j) => j.servedToday).length} of
      ${COV.journey.length} answered today · ${COV.journey.filter((j) => j.complete).length}
      answered completely</p>
  </div>
  <table><thead><tr><th scope="col">Reader</th><th scope="col">Moment</th>
    <th scope="col">What they need</th><th scope="col">Answered by</th></tr></thead><tbody>
    ${COV.journey.map((j) => `<tr>
      <td class="nowrap"><b>${esc(j.who)}</b></td>
      <td class="nowrap ${j.servedToday ? '' : 'no'}">${esc(j.when)}${
  j.servedToday ? '' : ' · gap'}</td>
      <td>${esc(j.need)}</td>
      <td>${j.titles.map((t) => `<span class="lk">${esc(t.name)}${
  t.status === STATUS.PUBLISHED ? '' : ` — ${esc(t.status.toLowerCase())}`}</span>`).join('')}</td>
    </tr>`).join('')}
  </tbody></table>
</section>

<section class="div">
  <div class="div__open">
    <p class="eyebrow">Canonical gaps</p>
    <h1>Where the canon does not reach</h1>
    <p class="div__purpose">Computed from the matrix and the journey, not compiled by hand. Each
      names who has to act, because a gap without an owner is a complaint.</p>
    <p class="div__reader">${COV.gaps.length} gaps ·
      ${COV.gaps.filter((g) => g.owner === 'Editorial').length} within editorial authority</p>
  </div>
  <table><thead><tr><th scope="col">Kind</th><th scope="col">Resource</th>
    <th scope="col">Position</th><th scope="col">Owner</th></tr></thead><tbody>
    ${COV.gaps.map((g) => `<tr><td class="nowrap">${esc(g.kind)}</td>
      <td class="nowrap"><b>${esc(g.resource)}</b></td><td>${esc(g.detail)}</td>
      <td class="nowrap">${esc(g.owner)}</td></tr>`).join('')}
  </tbody></table>
</section>

<section class="div">
  <div class="div__open">
    <p class="eyebrow">Completion</p>
    <h1>A publication is not finished when its pages are</h1>
    <p class="div__purpose">Every title tells its reader what to read before it, alongside it and
      after it. Where those volumes do not exist, the publication is a book with working pages and
      broken instructions — and nothing else would catch it, because the pages proof
      perfectly.</p>
    <p class="div__reader">${DONE.filter((d) => d.complete).length} of ${DONE.length} issued
      titles have every dependency issued</p>
  </div>
  <table><thead><tr><th scope="col">Issued title</th><th scope="col">Dependencies</th>
    <th scope="col">Not yet issued</th></tr></thead><tbody>
    ${DONE.map((d) => `<tr><td><b>${esc(d.name)}</b></td>
      <td class="mono">${d.deps}</td>
      <td>${d.complete ? '<span class="s s--pub">Complete</span>'
    : d.unmet.map((u) => `<span class="lk">${esc(u.name)} — ${esc(u.status.toLowerCase())}</span>`)
      .join('')}</td></tr>`).join('')}
  </tbody></table>

  <h2>Educational integrity</h2>
  <p>No publication may exist because it could. Each of these names the educational problem it
    solves, and the one that could not name one was not published.</p>
  <table><thead><tr><th scope="col">Publication</th><th scope="col">Problem it solves</th>
    <th scope="col">Verdict</th></tr></thead><tbody>
    ${INTEGRITY.map((i) => `<tr><td class="nowrap"><b>${esc(i.title)}</b></td>
      <td>${esc(i.problem)}</td><td class="nowrap">${esc(i.verdict)}</td></tr>`).join('')}
  </tbody></table>
  <div class="panel">
    <p class="panel__h">The volume this section is not</p>
    <p>Everything above could have been a Coverage Report — a thirteenth title, with a cover and
      a spine, reporting on the other twelve. It is a section of this index instead, beside the
      titles it measures, because a publication created to enlarge the catalogue is precisely
      what the constitution it would be reporting on forbids.</p>
  </div>
</section>

${DIVISIONS.map(divisionSection).join('')}

<section>
  <p class="eyebrow">Closing</p>
  <h2 style="margin-top:0">What this index is measured by</h2>
  <p>Not how many titles it contains. A canon is measured by whether a learner, a teacher, an
    examiner, an employer and a reviewer can each find everything they need inside one system —
    and by whether the system still hangs together when it doubles in size.</p>
  <p>Of ${INDEX.filter((r) => r.status).length} placed titles,
    ${ROWS.filter((r) => r.status === STATUS.PUBLISHED).length} are issued and
    ${ROWS.filter((r) => r.status === STATUS.DERIVABLE).length} can be produced with no new
    curriculum and no institutional decision. ${
  ROWS.filter((r) => r.status === STATUS.AUTHORING).length} wait on academic authoring and each
    states how much; ${ROWS.filter((r) => r.status === STATUS.GOVERNANCE).length} wait on an
    authority the Press does not hold.</p>
  <div class="fleuron">${fleuron({ colour: ACCENT.hex, width: 100 })}</div>
</section>

${LEGACY}
</body></html>`;

mkdirSync(path.join(ROOT, 'publication'), { recursive: true });
writeFileSync(path.join(ROOT, 'publication', '.canon.html'), html);

const exe = process.env.PW_CHROMIUM || '/opt/pw-browsers/chromium-1194/chrome-linux/chrome';
const browser = await chromium.launch(existsSync(exe) ? { executablePath: exe } : {});
const page = await browser.newPage();
await page.setContent(html, { waitUntil: 'load' });
const out = path.join(ROOT, 'publication', 'WEC Canon Index.pdf');
await page.pdf({
  path: out,
  width: `${FMT.w}mm`,
  height: `${FMT.h}mm`,
  printBackground: true,
  preferCSSPageSize: true,
  displayHeaderFooter: true,
  headerTemplate: '<div></div>',
  footerTemplate: `<div style="font:400 6.6pt Calibri,Arial,sans-serif;color:${PAL.slateGrey};`
    + `width:100%;padding:0 ${M.gutter}mm;display:flex;justify-content:space-between;">`
    + '<span>The Worldwide English College Canon</span><span class="pageNumber"></span></div>',
  margin: { top: `${M.head}mm`, bottom: `${M.foot}mm`,
    left: `${M.gutter}mm`, right: `${M.fore}mm` },
  tagged: true,
  outline: true,
});
await browser.close();

const pages = (readFileSync(out).toString('latin1').match(/\/Type\s*\/Page(?![s])/g) || []).length;
console.log(`CANON     ${out}`);
console.log(`  ${pages} pages · ${FMT.w} × ${FMT.h} mm · ${INDEX.filter((r) => r.status).length} `
  + `titles in ${DIVISIONS.length} divisions · ${DUPLICATIONS.length} overlaps resolved`);
console.log(`  next by impact: ${RANK.slice(0, 3).map((r) => `${r.name} (${r.score})`).join(' · ')}`);
