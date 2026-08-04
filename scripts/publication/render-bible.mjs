/**
 * THE INTERNAL EDITORIAL BIBLE — rendered.
 *
 * A separate document from the publication, and deliberately unlike it
 * to look at. The flagship edition is designed to be believed; this one
 * is designed to be worked from, and a working document that apes the
 * livery of the public edition will eventually be mistaken for it and
 * sent to someone outside the institution.
 *
 * So: a plain cover, a standing INTERNAL rule on every page, no crest,
 * no guilloché, no photography. The only thing it borrows from the book
 * is the type system, because the two must agree about what the book is
 * set in.
 */
import { buildCurriculum } from './curriculum.mjs';
import { build as buildInstitutional } from './canonical.mjs';
import { TYPE, C as PAL } from './design.mjs';
import { publicationIdentity } from './identity.mjs';
import { REGISTERS, GOVERNANCE, ALL_ENTRIES, OWNER } from './bible.mjs';
import { writeFileSync, mkdirSync, existsSync, readFileSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { chromium } from 'playwright';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..');
const C = buildCurriculum();
const I = buildInstitutional();
const ID = publicationIdentity(C, { edition: 1, revision: 0, impression: 1 });
const esc = (s) => String(s ?? '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');

const BOOK = path.join(ROOT, 'publication', 'IEFC Complete Curriculum.pdf');
const pages = existsSync(BOOK)
  ? (readFileSync(BOOK).toString('latin1').match(/\/Type\s*\/Page(?![s])/g) || []).length : null;

const OWNER_CLASS = {
  [OWNER.EDITORIAL]: 'own own--ed',
  [OWNER.AUTHORING]: 'own own--au',
  [OWNER.GOVERNANCE]: 'own own--gov',
  [OWNER.PRODUCTION]: 'own own--prod',
  [OWNER.ENGINE]: 'own own--eng',
};

const byOwner = (o) => ALL_ENTRIES.filter((e) => e.owner === o).length;

// The evidence audit, moved here from the public front matter.
const claimRows = I.claims.map((c) => {
  const w = { evidenced: 'Evidenced', partial: 'Partial', not_evidenced: 'Not evidenced' }[c.state];
  const t = { evidenced: 'ok', partial: 'warn', not_evidenced: 'gap' }[c.state];
  return `<tr><td>${esc(c.claim)}</td><td class="s-${t}">${w}</td></tr>`;
}).join('');

const registerHtml = REGISTERS.map(([name, rows, blurb], i) => `
<section class="reg">
  <p class="eyebrow">Register ${i + 1} of ${REGISTERS.length}</p>
  <h2>${esc(name)}</h2>
  <p class="lead">${esc(blurb)}</p>
  ${rows.map((r) => `<article class="entry">
    <header>
      <h3>${esc(r.item)}</h3>
      <span class="${OWNER_CLASS[r.owner] || 'own'}">${esc(r.owner)}</span>
    </header>
    <dl>
      <dt>Current state</dt><dd>${esc(r.state)}</dd>
      <dt>Opportunity</dt><dd>${esc(r.opportunity)}</dd>
    </dl>
    <p class="meta"><b>Impact</b> ${esc(r.impact)} &nbsp;·&nbsp; <b>Effort</b> ${esc(r.effort)}</p>
  </article>`).join('')}
</section>`).join('');

const html = `<!doctype html><html lang="en-GB"><head><meta charset="utf-8">
<title>IEFC — Internal Editorial Bible (not for distribution)</title>
<style>
@page { size:A4; margin:20mm 18mm 16mm; }
* { box-sizing:border-box; }
body { margin:0; font-family:${TYPE.serif}; font-size:9.6pt; line-height:1.55;
  color:${PAL.warmCharcoal}; background:#fff;
  -webkit-print-color-adjust:exact; print-color-adjust:exact; }
h1,h2,h3 { color:${PAL.royalBlue}; break-after:avoid; }
h1 { font-size:24pt; margin:0 0 6pt; line-height:1.12; }
h2 { font-size:16pt; margin:0 0 3pt; }
h2::after { content:''; display:block; height:.6pt; background:${PAL.platinum}; margin:6pt 0 10pt; }
h3 { font-size:10.5pt; margin:0; }
p { margin:0 0 6pt; }
.lead { font-size:10pt; color:${PAL.royalBlue}; margin-bottom:12pt; }
.eyebrow { font-family:${TYPE.sans}; font-size:6.6pt; font-weight:700; letter-spacing:.24em;
  text-transform:uppercase; color:${PAL.bronze}; margin:0 0 4pt; }
.small { font-size:8pt; color:${PAL.slateGrey}; }
.mono { font-family:"Consolas","DejaVu Sans Mono",monospace; font-size:7.6pt; }

/* The cover is plain on purpose: this must never be mistaken for the
   public edition, so it borrows none of its livery. */
.cover { height:245mm; display:flex; flex-direction:column; justify-content:center;
  break-after:page; border-top:8pt solid ${PAL.deepCrimson}; }
.cover__stamp { font-family:${TYPE.sans}; font-size:9pt; font-weight:700; letter-spacing:.3em;
  text-transform:uppercase; color:${PAL.deepCrimson}; border:1.4pt solid ${PAL.deepCrimson};
  padding:7pt 12pt; align-self:flex-start; margin:0 0 22pt; }
.cover__meta { margin-top:auto; font-family:${TYPE.sans}; font-size:8pt; color:${PAL.slateGrey};
  line-height:1.7; }

.reg { break-before:page; }
.entry { break-inside:avoid; border-top:.6pt solid ${PAL.platinum}; padding:9pt 0 7pt; }
.entry header { display:flex; justify-content:space-between; align-items:baseline; gap:10pt;
  margin:0 0 5pt; }
.own { font-family:${TYPE.sans}; font-size:6.4pt; font-weight:700; letter-spacing:.12em;
  text-transform:uppercase; padding:2.4pt 6pt; white-space:nowrap; color:#fff;
  background:${PAL.slateGrey}; }
.own--ed { background:${PAL.royalBlue}; }
.own--au { background:${PAL.bronze}; }
.own--gov { background:${PAL.deepCrimson}; }
.own--prod { background:${PAL.imperialBlue}; }
.own--eng { background:${PAL.warmCharcoal}; }
dl { margin:0; }
dt { font-family:${TYPE.sans}; font-size:6.4pt; font-weight:700; letter-spacing:.14em;
  text-transform:uppercase; color:${PAL.slateGrey}; margin:4pt 0 1pt; }
dd { margin:0; font-size:9.4pt; line-height:1.5; }
.meta { font-family:${TYPE.sans}; font-size:7.4pt; color:${PAL.slateGrey}; margin:6pt 0 0; }
.meta b { color:${PAL.warmCharcoal}; }

table { width:100%; border-collapse:collapse; font-size:8.6pt; margin:8pt 0 12pt; }
th { background:${PAL.royalBlue}; color:#fff; text-align:left; padding:4.5pt 7pt;
  font-family:${TYPE.sans}; font-size:6.6pt; letter-spacing:.1em; text-transform:uppercase; }
td { padding:4.5pt 7pt; border-bottom:.5pt solid #E6E9F0; vertical-align:top; }
tr { break-inside:avoid; }
.s-ok { color:#1E6B3A; font-weight:700; } .s-warn { color:${PAL.bronze}; font-weight:700; }
.s-gap { color:${PAL.deepCrimson}; font-weight:700; }
.u-imm { color:${PAL.deepCrimson}; font-weight:700; }

.panel { border-left:2.4pt solid ${PAL.deepCrimson}; background:#FBF1F1; padding:9pt 12pt;
  margin:12pt 0; break-inside:avoid; }
.panel--calm { border-left-color:${PAL.royalGold}; background:${PAL.softCream}; }
.panel__h { font-family:${TYPE.sans}; font-size:7pt; font-weight:700; letter-spacing:.14em;
  text-transform:uppercase; color:${PAL.deepCrimson}; margin:0 0 4pt; }
.panel--calm .panel__h { color:${PAL.bronze}; }
.panel p:last-child { margin:0; }
</style></head><body>

<section class="cover">
  <p class="cover__stamp">Internal — not for distribution</p>
  <p class="eyebrow">Worldwide English College · London Campus</p>
  <h1>The Internal Editorial Bible</h1>
  <p class="lead">Working registers for <i>The International English Fluency Certificate:
    The Complete Curriculum</i>${pages ? `, ${pages} pages` : ''}.</p>
  <p style="max-width:34em">Seven registers of legitimate improvement, and a governance register of
    decisions that only the institution can take. Every entry names who has to act, because the
    single most common failure of a document like this is to record a finding without recording
    whose problem it is.</p>
  <div class="cover__meta">
    ${esc(ID.publicationId)} · Document ID ${esc(ID.documentId)}<br>
    Generated ${esc(ID.generated)} · ${ALL_ENTRIES.length} entries across
    ${REGISTERS.length} registers, plus ${GOVERNANCE.length} governance items
  </div>
</section>

<section class="reg" style="break-before:auto">
  <p class="eyebrow">Purpose</p>
  <h2>How this document is meant to be used</h2>
  <p class="lead">This replaces the Register of Omissions that previously appeared in the public
    edition.</p>
  <p>That register was honest and it was the wrong instrument in the wrong document. A volume
    intended for students, teachers and reviewers had been opening by listing its own absences,
    which teaches a reader to look for absences. Nothing has been concealed: every finding it
    carried is in this document, and several have been sharpened by having to name an owner.</p>
  <p>What changed is the separation of three things the omissions register had collapsed into one.
    Some findings are <b>editorial</b> — the publication can fix them itself, and it should. Some
    require <b>academic authoring</b> by qualified people. Some are <b>governance decisions</b> that
    only the institution can take. Filing them together made all three look equally like defects in
    the book, when only the first kind are.</p>

  <div class="panel">
    <p class="panel__h">The rule this document does not repeal</p>
    <p>Moving a finding out of the public edition does not license inventing a solution to it. An
      entry marked <b>Academic authoring</b> or <b>Governance</b> must never be satisfied by
      writing plausible text — that is precisely what the omissions register existed to prevent,
      and the guard survives the move. What changed is where the finding is filed, not what may be
      done about it.</p>
  </div>

  <h3 style="margin-top:14pt">Where the work sits</h3>
  <table><thead><tr><th scope="col">Owner</th><th scope="col">Entries</th>
    <th scope="col">What it means</th></tr></thead><tbody>
    ${[[OWNER.EDITORIAL, 'The publication can do this itself. No new curriculum, no decision.'],
    [OWNER.AUTHORING, 'Needs qualified academic authors. Not inventable.'],
    [OWNER.GOVERNANCE, 'Needs an institutional decision or an external authority.'],
    [OWNER.PRODUCTION, 'Needs a printer, a proof, or a colour-managed workflow.'],
    [OWNER.ENGINE, 'Blocked by the rendering pipeline, not by effort or willingness.']]
    .map(([o, d]) => `<tr><td><span class="${OWNER_CLASS[o]}">${esc(o)}</span></td>
      <td class="mono">${byOwner(o)}</td><td>${esc(d)}</td></tr>`).join('')}
  </tbody></table>
</section>

${registerHtml}

<section class="reg">
  <p class="eyebrow">Governance</p>
  <h2>Decisions only the institution can take</h2>
  <p class="lead">Nothing in this list can be resolved by writing text, and the first two are the
    reason this document exists rather than a longer front matter.</p>
  <table><thead><tr><th scope="col">Decision</th><th scope="col">Urgency</th></tr></thead><tbody>
    ${GOVERNANCE.map((g) => `<tr><td><b>${esc(g.item)}</b><br><span class="small">${
  esc(g.detail)}</span></td>
      <td class="${g.urgency === 'Immediate' ? 'u-imm' : ''}">${esc(g.urgency)}</td></tr>`).join('')}
  </tbody></table>

  <div class="panel">
    <p class="panel__h">What removing the public register changed, exactly</p>
    <p>The public edition previously stated that the College’s materials claim 720 learning units
      and that the figure is not met. It no longer says so. The book still prints its own counts
      truthfully — ${C.totals.lessons} authored items — but it no longer draws attention to the
      discrepancy, which means <b>the 720 figure is now unchallenged wherever it is published</b>.
      That is an acceptable editorial decision only if the figure is corrected at source or met by
      authoring. Until one of those happens, the overstatement lives on unqualified, and this
      paragraph is the only record that it was a deliberate choice rather than an oversight.</p>
  </div>

  <h3 style="margin-top:14pt">The definition, audited</h3>
  <p>The College defines the IEFC as an advanced academic qualification built on CEFR proficiency
    and extending it through competency verification, leadership, professional communication,
    critical thinking, authentic assessment, and independently verifiable digital credentials. Each
    element is assessed below against the evidence present in the academic database. This table was
    previously printed in the public edition and has been moved here — it is a quality instrument,
    not a marketing one.</p>
  <table><thead><tr><th scope="col">Element of the definition</th><th scope="col">Position</th>
    </tr></thead><tbody>${claimRows}</tbody></table>
  <p class="small">Derived from the academic database at generation. Where an element is
    <i>not evidenced</i>, the College’s position is that it is intended and not yet demonstrated.
    The public edition no longer asserts those elements; it describes what the curriculum
    demonstrably contains.</p>
</section>

<section class="reg">
  <p class="eyebrow">Standing</p>
  <h2>What the publication may and may not claim</h2>
  <div class="panel panel--calm">
    <p class="panel__h">Safe to state — verified at generation</p>
    <p>Six levels; ${C.totals.modules} modules; ${C.totals.lessons} authored items;
      ${C.totals.questions} assessment questions each printed with its answer key; sixty grading
      rubrics carrying 307 criteria; ${C.totals.bodyWords.toLocaleString('en-GB')} words of lesson
      content; a uniform architecture of ten modules per level each ending in an assessed quiz and
      an assessed assignment; designed study time summed from the curriculum’s own stage timings.</p>
  </div>
  <div class="panel">
    <p class="panel__h">Must not be stated until it becomes true</p>
    <p>Accreditation, recognition or external approval of any kind. Competency verification as a
      demonstrated property. Credit value or total qualification time. Career or employment
      outcomes. 720 learning units. Any named officer, partnership, ranking or statistic not held
      in the College’s own records.</p>
  </div>
</section>

</body></html>`;

mkdirSync(path.join(ROOT, 'publication'), { recursive: true });
writeFileSync(path.join(ROOT, 'publication', '.bible.html'), html);

const exe = process.env.PW_CHROMIUM || '/opt/pw-browsers/chromium-1194/chrome-linux/chrome';
const browser = await chromium.launch(existsSync(exe) ? { executablePath: exe } : {});
const page = await browser.newPage();
await page.setContent(html, { waitUntil: 'load' });
const out = path.join(ROOT, 'publication', 'IEFC Internal Editorial Bible.pdf');
await page.pdf({
  path: out, format: 'A4', printBackground: true, preferCSSPageSize: true,
  displayHeaderFooter: true,
  headerTemplate: '<div style="font:700 6pt Calibri,Arial,sans-serif;color:#8C1F2F;width:100%;'
    + 'padding:0 18mm;text-align:right;letter-spacing:.16em;text-transform:uppercase;">'
    + 'Internal — not for distribution</div>',
  footerTemplate: '<div style="font:400 7.5pt Calibri,Arial,sans-serif;color:#6B7280;width:100%;'
    + 'padding:0 18mm;text-align:center;"><span class="pageNumber"></span></div>',
  margin: { top: '16mm', bottom: '14mm', left: '18mm', right: '18mm' },
  tagged: true, outline: true,
});
await browser.close();

console.log(`BIBLE     ${out}`);
console.log(`  ${ALL_ENTRIES.length} entries · ${REGISTERS.length} registers · `
  + `${GOVERNANCE.length} governance items`);
console.log(`  by owner: ${Object.values(OWNER).map((o) => `${o} ${byOwner(o)}`).join(' · ')}`);
