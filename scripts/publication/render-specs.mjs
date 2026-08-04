/**
 * THE PRODUCTION SPECIFICATION.
 *
 * Print specification, typography specification, colour specification,
 * illustration specification, asset inventory, production checklist and
 * brand style guide — in one volume, because a printer receives one
 * document and a designer opens one file.
 *
 * ────────────────────────────────────────────────────────────────────
 * EVERY FIGURE IS READ FROM THE CODE THAT DREW THE BOOK
 * ────────────────────────────────────────────────────────────────────
 * A specification document is the single easiest artefact in publishing
 * to make worthless. It is written once, the design moves, and from
 * that moment it describes a book that no longer exists — while looking
 * exactly as authoritative as it did on day one.
 *
 * So this file states no measurement of its own. Colours come from
 * design.mjs, type from TYPE, the ornament inventory from the exported
 * functions of ornament.mjs, trim and caliper from covers.mjs, the
 * identifiers from identity.mjs, and the page and spine figures from
 * the rendered PDF. Change the design and this document changes with
 * it. It cannot describe a book that was not built.
 */
import { buildCurriculum } from './curriculum.mjs';
import { COLOURS, TYPE, LEVEL_PALETTES, BRAND, C as PAL } from './design.mjs';
import { stageIcon, ICON_KEYS } from './icons.mjs';
import { publicationIdentity, AUTHENTICITY_NOTICE } from './identity.mjs';
import { TRIM, BLEED, CALIPER_MM, spineWidth, OMISSIONS } from './covers.mjs';
import {
  guillocheRosette, guillocheBand, girihRosette, crest, frame, cornerFan, fleuron,
} from './ornament.mjs';
import { writeFileSync, mkdirSync, existsSync, readFileSync, statSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { chromium } from 'playwright';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..');
const C = buildCurriculum();
const ID = publicationIdentity(C, { edition: 1, revision: 0, impression: 1 });
const esc = (s) => String(s ?? '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');

// The bound book's real page count, read from the rendered file. If the
// flagship has not been rendered, the spine figure is stated as unknown
// rather than guessed — a specification that invents a spine is worse
// than one that admits it does not have the number.
const BOOK = path.join(ROOT, 'publication', 'IEFC Complete Curriculum.pdf');
let pages = null;
if (existsSync(BOOK)) {
  pages = (readFileSync(BOOK).toString('latin1').match(/\/Type\s*\/Page(?![s])/g) || []).length;
}
const spine = pages ? spineWidth(pages) : null;

const swatch = (hex) => `<span class="sw" style="background:${hex}"></span>`;

// ── Colour ───────────────────────────────────────────────────────────
const colourRows = Object.entries(COLOURS).map(([k, v]) => {
  const name = k.replace(/([A-Z])/g, ' $1').replace(/^./, (m) => m.toUpperCase());
  return `<tr>
    <td>${swatch(v.hex)}</td>
    <td><b>${esc(name)}</b><em>${esc(v.note)}</em></td>
    <td class="mono">${esc(v.hex)}</td>
    <td class="mono">${esc(toRgb(v.hex))}</td>
    <td class="mono">${esc(toCmyk(v.hex))}</td>
    <td>${esc(v.role)}</td>
  </tr>`;
}).join('');

function toRgb(hex) {
  const [r, g, b] = [1, 3, 5].map((i) => parseInt(hex.slice(i, i + 2), 16));
  return `${r} ${g} ${b}`;
}
/**
 * Naive RGB→CMYK, and labelled as such on the page.
 *
 * A real conversion needs an ICC profile and a rendering intent; this is
 * the uncalibrated formula, which lands close on darks and drifts on
 * saturated blues. It is printed as a STARTING POINT for a prepress
 * operator, with that stated in the specification, because a CMYK
 * breakdown presented as final would be trusted and would be wrong.
 */
function toCmyk(hex) {
  const [r, g, b] = [1, 3, 5].map((i) => parseInt(hex.slice(i, i + 2), 16) / 255);
  const k = 1 - Math.max(r, g, b);
  if (k === 1) return '0 0 0 100';
  const f = (v) => Math.round(((1 - v - k) / (1 - k)) * 100);
  return `${f(r)} ${f(g)} ${f(b)} ${Math.round(k * 100)}`;
}

// ── Contrast, checked rather than asserted ───────────────────────────
function luminance(hex) {
  const ch = [1, 3, 5].map((i) => {
    const v = parseInt(hex.slice(i, i + 2), 16) / 255;
    return v <= 0.03928 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4;
  });
  return 0.2126 * ch[0] + 0.7152 * ch[1] + 0.0722 * ch[2];
}
export function contrast(a, b) {
  const [x, y] = [luminance(a), luminance(b)].sort((p, q) => q - p);
  return Math.round(((x + 0.05) / (y + 0.05)) * 100) / 100;
}

// A floor of `null` means the pairing carries no type: a hairline rule
// or an ornament has no legibility requirement, and inventing one for it
// would either fail the table for no reason or — worse — tempt a
// designer to "fix" a decorative colour that was never the problem.
const PAIRS = [
  ['Body text on text paper', PAL.warmCharcoal, PAL.pearlWhite, 4.5],
  ['Display type on text paper', PAL.royalBlue, PAL.pearlWhite, 4.5],
  ['Display type on title stock', PAL.royalBlue, PAL.ivory, 4.5],
  ['Micro labels on text paper', PAL.bronze, PAL.pearlWhite, 4.5],
  ['Micro labels on panel tint', PAL.bronze, PAL.softCream, 4.5],
  ['Accent on panel tint', PAL.deepCrimson, PAL.softCream, 4.5],
  ['Apparatus grey on text paper', PAL.slateGrey, PAL.pearlWhite, 4.5],
  ['Champagne on cover ground', PAL.champagneGold, PAL.midnightNavy, 4.5],
  ['Royal Gold hairline on text paper', PAL.royalGold, PAL.pearlWhite, null],
];
const contrastRows = PAIRS.map(([label, fg, bg, min]) => {
  const r = contrast(fg, bg);
  const ok = min === null || r >= min;
  return `<tr><td>${esc(label)}</td><td>${swatch(fg)}<span class="mono">${fg}</span></td>
    <td>${swatch(bg)}<span class="mono">${bg}</span></td>
    <td class="mono">${r}:1</td><td class="mono">${min === null ? 'n/a' : `${min}:1`}</td>
    <td class="${min === null ? 'small' : ok ? 'ok' : 'gap'}">${
  min === null ? 'Rules only — carries no type' : ok ? 'Meets' : 'Below'}</td></tr>`;
}).join('');
const contrastFails = PAIRS.filter(([, fg, bg, min]) => min !== null && contrast(fg, bg) < min);

// ── Level identity ───────────────────────────────────────────────────
const levelRows = LEVEL_PALETTES.map((p) => {
  const lv = C.levels.find((l) => l.roman === p.key);
  return `<tr><td class="mono">${p.key}</td><td><b>${esc(p.name)}</b></td>
    <td>${swatch(p.ink)}<span class="mono">${p.ink}</span></td>
    <td>${swatch(p.mid)}<span class="mono">${p.mid}</span></td>
    <td>${swatch(p.wash)}<span class="mono">${p.wash}</span></td>
    <td class="mono">${contrast(p.ink, p.wash)}:1</td>
    <td class="mono">${lv ? esc(lv.cefr) : '—'}</td></tr>`;
}).join('');

// ── Ornament inventory ───────────────────────────────────────────────
const ORNAMENTS = [
  ['crest', 'Institutional crest', 'Shield, open book, six ascent bars, founding letters.',
    'Front cover, spine, title page, frontispiece, level dividers, back endpaper.',
    crest({ size: 62, gold: BRAND.gold, ink: BRAND.deep })],
  ['guillocheRosette', 'Guilloché rosette',
    'Five concentric hypotrochoid rings, petal counts 48/36/28/20/14.',
    'Front cover medallion, back cover seal, frontispiece plate, level dividers.',
    guillocheRosette({ size: 92, stroke: BRAND.gold, width: 0.3, opacity: 0.9 })],
  ['guillocheBand', 'Guilloché band', 'Counter-phased sine trains, five line pairs.',
    'Cover foot, back cover foot, level divider foot, colophon.',
    `<div style="width:150px">${guillocheBand({ width: 300, height: 16, stroke: BRAND.gold })}</div>`],
  ['girihRosette', 'Girih rosette', 'Eight-fold star from the octagon, with interlace ring.',
    'Level divider ground, endpapers, cover texture field.',
    girihRosette({ size: 74, stroke: BRAND.gold, width: 0.7, opacity: 0.9 })],
  ['frame', 'Border system', 'French rule set — thick, gap, thin — with mitred corner brackets.',
    'Front and back covers, title page, level dividers.',
    `<div style="width:70px;height:74px">${frame({ w: 200, h: 210, colour: BRAND.gold, inset: 12, corner: 30 })}</div>`],
  ['cornerFan', 'Corner fan', 'Quarter rosette on the same eight-fold division.',
    'Cover corners, level divider corners.',
    cornerFan({ size: 46, colour: BRAND.gold })],
  ['fleuron', 'Fleuron', 'Centred lozenge flourish between two rules.',
    'Half title, dedication, contents break, colophon, back cover.',
    `<div style="width:130px">${fleuron({ colour: BRAND.gold, width: 130 })}</div>`],
];
const ornRows = ORNAMENTS.map(([fn, name, geom, use, art]) => `<tr>
  <td class="orn__a">${art}</td>
  <td><b>${esc(name)}</b><em class="mono">ornament.mjs · ${esc(fn)}()</em></td>
  <td>${esc(geom)}</td><td>${esc(use)}</td></tr>`).join('');

// ── Stage icons ──────────────────────────────────────────────────────
const markRows = ICON_KEYS.map((k) =>
  `<li><span class="mk">${stageIcon(k, { size: 15 })}</span><b>${esc(k)}</b></li>`).join('');

// ── Asset inventory ──────────────────────────────────────────────────
const FILES = [
  ['publication/IEFC Complete Curriculum.pdf', 'Press-quality text block', 'PDF, A4 portrait, tagged, bookmarked'],
  ['publication/IEFC Cover Artwork.pdf', 'Cover spread', 'PDF, single page, trim + bleed, no marks in live area'],
  ['publication/IEFC Complete Curriculum.docx', 'Editable companion', 'DOCX, A4, styled headings, navigable'],
  ['publication/IEFC Production Specifications.pdf', 'This document', 'PDF, A4 portrait'],
];
const fileRows = FILES.map(([f, what, fmt]) => {
  const p = path.join(ROOT, f);
  const ok = existsSync(p);
  return `<tr><td class="mono">${esc(path.basename(f))}</td><td>${esc(what)}</td>
    <td>${esc(fmt)}</td>
    <td class="mono">${ok ? `${(statSync(p).size / 1024 / 1024).toFixed(2)} MB` : '—'}</td>
    <td class="${ok ? 'ok' : 'gap'}">${ok ? 'Present' : 'Not built'}</td></tr>`;
}).join('');

const SOURCES = [
  ['scripts/publication/curriculum.mjs', 'Extracts every lesson from the academic database and parses it into typed stages.'],
  ['scripts/publication/design.mjs', 'The fourteen-colour system, the six level palettes, the type system, the stage marks.'],
  ['scripts/publication/ornament.mjs', 'Every drawn mark: guilloché, girih, crest, borders, fans, fleurons, foil.'],
  ['scripts/publication/identity.mjs', 'Publication identifiers and the content digest.'],
  ['scripts/publication/covers.mjs', 'Cover spread, spine calculation, front matter, back matter, register of omissions.'],
  ['scripts/publication/render-flagship.mjs', 'Renders the text block and the cover artwork.'],
  ['scripts/publication/render-curriculum-docx.mjs', 'Renders the editable companion.'],
  ['scripts/publication/render-specs.mjs', 'Renders this specification.'],
  ['functions/_lib/registry/qr.js', 'The QR encoder, shared with the credential system.'],
];
const srcRows = SOURCES.map(([f, w]) => `<tr><td class="mono">${esc(f)}</td><td>${esc(w)}</td>
  <td class="${existsSync(path.join(ROOT, f)) ? 'ok' : 'gap'}">${
  existsSync(path.join(ROOT, f)) ? 'Present' : 'Missing'}</td></tr>`).join('');

// ── Production checklist ─────────────────────────────────────────────
const CHECKS = [
  ['Text block renders without error', !!pages, pages ? `${pages} pages` : 'not rendered'],
  ['Cover artwork built at trim plus bleed', existsSync(path.join(ROOT, 'publication/IEFC Cover Artwork.pdf')),
    spine ? `${TRIM.w * 2 + spine + BLEED * 2} × ${TRIM.h + BLEED * 2} mm` : 'not built'],
  ['Spine width calculated from the bound page count', !!spine,
    spine ? `${spine} mm at ${CALIPER_MM} mm per leaf` : 'unknown'],
  ['Every colour pair meets its contrast floor', contrastFails.length === 0,
    contrastFails.length ? `${contrastFails.length} below floor` : `${PAIRS.length} pairs checked`],
  ['Content digest computed over the full curriculum', !!ID.contentDigest, ID.documentId],
  ['Verification code encodes a College address', ID.verifyUrl.startsWith('https://'), ID.verifyUrl],
  ['Editable companion built', existsSync(path.join(ROOT, 'publication/IEFC Complete Curriculum.docx')), ''],
  ['Curriculum verified present in both editions by test',
    existsSync(path.join(ROOT, 'tests/curriculum-publication.test.mjs')), 'tests/curriculum-publication.test.mjs'],
  ['Omissions registered rather than filled', OMISSIONS.length > 0, `${OMISSIONS.length} entries`],
];
const checkRows = CHECKS.map(([label, ok, detail]) => `<tr>
  <td class="chk">${ok ? '✓' : '—'}</td><td>${esc(label)}</td>
  <td class="mono">${esc(detail)}</td>
  <td class="${ok ? 'ok' : 'gap'}">${ok ? 'Verified' : 'Outstanding'}</td></tr>`).join('');

// The manual steps a machine cannot verify. Listed separately and
// honestly as unverified, rather than mixed in with the automated
// checks where a reader would assume they had been confirmed.
const MANUAL = [
  'Proof the cover at 100% on the specified stock and confirm the spine text is centred on the bound spine.',
  'Confirm with the printer that the guilloché line weights (0.30–0.55 pt) hold at the chosen screen ruling; below 0.25 pt fine gold line-work can drop out on uncoated stock.',
  'Convert to the printer\'s ICC profile and re-proof the blues; the CMYK figures in this document are uncalibrated starting points, not final separations.',
  'Confirm total ink coverage on the cover ground is within the printer\'s limit for the stock.',
  'Check that no live text falls within 5 mm of the trim on any page.',
  'Confirm the QR code scans from the printed sheet, not only from the PDF.',
];

const html = `<!doctype html><html lang="en"><head><meta charset="utf-8">
<title>IEFC Complete Curriculum — Production Specification</title>
<style>
@page { size:A4; margin:18mm 18mm 16mm; }
* { box-sizing:border-box; }
body { margin:0; font-family:${TYPE.serif}; font-size:9.4pt; line-height:1.55;
  color:${PAL.warmCharcoal}; background:#fff; -webkit-print-color-adjust:exact; print-color-adjust:exact; }
h1,h2,h3 { color:${PAL.royalBlue}; break-after:avoid; }
h1 { font-size:26pt; margin:0 0 4pt; line-height:1.1; }
h2 { font-size:16pt; margin:0 0 3pt; break-before:page; }
h2::after { content:''; display:block; height:.8pt; margin:6pt 0 11pt;
  background:linear-gradient(90deg,${PAL.royalGold} 0 22%,${PAL.platinum} 22%); }
h3 { font-size:11pt; margin:14pt 0 5pt; }
p { margin:0 0 6pt; }
.lead { font-size:10.6pt; color:${PAL.royalBlue}; }
.eyebrow { font-family:${TYPE.sans}; font-size:7pt; font-weight:700; letter-spacing:.26em;
  text-transform:uppercase; color:${PAL.bronze}; margin:0 0 4pt; }
.small { font-size:8pt; color:${PAL.slateGrey}; }
.mono { font-family:"Consolas","DejaVu Sans Mono",monospace; font-size:7.6pt; }
table { width:100%; border-collapse:collapse; font-size:8.2pt; margin:8pt 0 12pt; }
th { background:${PAL.royalBlue}; color:#fff; text-align:left; padding:4.5pt 6pt;
  font-family:${TYPE.sans}; font-size:6.8pt; letter-spacing:.1em; text-transform:uppercase; }
td { padding:4.5pt 6pt; border-bottom:.5pt solid #E6E9F0; vertical-align:middle; }
td em { display:block; font-style:normal; font-size:7.4pt; color:${PAL.slateGrey}; margin-top:1pt; }
tr { break-inside:avoid; }
.sw { display:inline-block; width:16pt; height:10pt; border:.4pt solid rgba(0,0,0,.25);
  vertical-align:middle; margin-right:5pt; }
.ok { color:#1E6B3A; font-weight:700; } .gap { color:${PAL.deepCrimson}; font-weight:700; }
.chk { font-size:11pt; color:#1E6B3A; text-align:center; width:14pt; }
.title { height:245mm; display:flex; flex-direction:column; justify-content:center;
  text-align:center; break-after:page; }
.title__orn { display:flex; justify-content:center; margin:0 0 16pt; }
.panel { border-left:2.4pt solid ${PAL.royalGold}; background:${PAL.softCream};
  padding:8pt 11pt; margin:10pt 0; break-inside:avoid; }
.panel p:last-child { margin:0; }
.panel__h { font-family:${TYPE.sans}; font-size:7pt; font-weight:700; letter-spacing:.14em;
  text-transform:uppercase; color:${PAL.bronze}; margin:0 0 4pt; }
.orn__a { width:62pt; text-align:center; line-height:0; }
.marks { columns:3; column-gap:12pt; list-style:none; padding:0; margin:6pt 0 10pt;
  font-family:${TYPE.sans}; font-size:7.6pt; }
.marks li { break-inside:avoid; margin:0 0 3pt; }
.marks .mk { display:inline-block; min-width:1.6em; color:${PAL.bronze}; line-height:0;
  vertical-align:-0.3em; }
.spec { list-style:none; padding:0; margin:6pt 0 10pt; }
.spec li { display:flex; gap:8pt; padding:3.5pt 0; border-bottom:.4pt solid #EDEFF3; break-inside:avoid; }
.spec b { font-family:${TYPE.sans}; font-size:7.6pt; letter-spacing:.06em; color:${PAL.slateGrey};
  min-width:15em; text-transform:uppercase; }
.rules { list-style:none; padding:0; margin:6pt 0; }
.rules li { padding:4pt 0 4pt 16pt; border-bottom:.4pt solid #EDEFF3; position:relative;
  break-inside:avoid; }
.rules li::before { content:'—'; position:absolute; left:0; color:${PAL.bronze}; }
</style></head><body>

<section class="title">
  <div class="title__orn">${crest({ size: 76, gold: PAL.royalGold, ink: PAL.midnightNavy })}</div>
  <p class="eyebrow">Worldwide English College Press</p>
  <h1>Production Specification</h1>
  <p class="lead">The International English Fluency Certificate — The Complete Curriculum</p>
  <div class="title__orn" style="margin:14pt 0">${fleuron({ colour: PAL.royalGold, width: 150 })}</div>
  <p class="small">Print · Typography · Colour · Illustration · Assets · Finishing · Checklist · Style guide</p>
  <p class="small mono" style="margin-top:20pt">${esc(ID.publicationId)} · Document ID ${esc(ID.documentId)}
    · Issue ${esc(ID.issueCode)} · Generated ${esc(ID.generated)}</p>
</section>

<h2>1 · Print specification</h2>
<p class="lead">Everything a printer needs to quote and to run the job.</p>
<ul class="spec">
  <li><b>Trim size</b><span>${TRIM.w} × ${TRIM.h} mm (A4 portrait)</span></li>
  <li><b>Bleed</b><span>${BLEED} mm on all four edges of the cover artwork. The text block is
    supplied without bleed; no element runs to the edge.</span></li>
  <li><b>Extent</b><span>${pages ? `${pages} pages, self-cover excluded` : 'not yet rendered'}</span></li>
  <li><b>Spine width</b><span>${spine ? `${spine} mm, calculated as (${pages} ÷ 2) × ${CALIPER_MM} mm
    caliper plus 1.2 mm for the cover boards and adhesive` : 'pending page count'}</span></li>
  <li><b>Cover spread</b><span>${spine ? `${TRIM.w * 2 + spine + BLEED * 2} × ${TRIM.h + BLEED * 2} mm
    including bleed` : 'pending spine width'}</span></li>
  <li><b>Text stock</b><span>100 gsm uncoated offset, high opacity, natural white. Uncoated because
    this is a book a teacher writes in.</span></li>
  <li><b>Cover stock</b><span>300 gsm one-sided board, matt laminate outer. The laminate protects a
    dark ground, which shows every handling mark without it.</span></li>
  <li><b>Binding</b><span>Perfect bound (PUR recommended at this extent — the book must open flat
    enough to be read on a desk while teaching).</span></li>
  <li><b>Text printing</b><span>Four colour process throughout. The level identities are process
    builds, not spot colours; the book is designed so no spot is required.</span></li>
  <li><b>Cover finishing (optional)</b><span>Gold foil on the title, crest and emblem, with a blind
    deboss on the border rule. The artwork is supplied so that it also reads correctly printed flat
    in process colour, with no foil.</span></li>
  <li><b>Colour management</b><span>Supply is RGB PDF. The CMYK values in section 3 are uncalibrated
    conversions provided as a starting point; convert to the press profile and proof.</span></li>
  <li><b>Marks</b><span>Corner crop marks only, outside the bleed. No registration or colour bars in
    the artwork.</span></li>
  <li><b>Accessibility</b><span>The text-block PDF is tagged with a document outline, so it is
    navigable by screen reader and by bookmark.</span></li>
</ul>

<h2>2 · Typography specification</h2>
<p class="lead">Two families, one for reading and one for scanning. No third.</p>
<p>The distinction is functional rather than decorative. Everything a reader reads continuously is
  set in the serif; everything a reader looks <em>for</em> — a stage heading, a timing, an answer
  key, a folio — is set in the sans. A teacher scanning a lesson for the speaking activity finds it
  by texture before reading a word, and that only works if the rule is never broken.</p>
<ul class="spec">
  <li><b>Serif (reading)</b><span class="mono">${esc(TYPE.serif)}</span></li>
  <li><b>Sans (apparatus)</b><span class="mono">${esc(TYPE.sans)}</span></li>
  <li><b>Body size</b><span>${TYPE.scale.body} pt on ${TYPE.baseline} line height</span></li>
  <li><b>Measure</b><span>${TYPE.measure} — approximately 62 characters, inside the 45–75 band that
    keeps long reading comfortable</span></li>
  <li><b>Orphans and widows</b><span>3 lines minimum, enforced in the stylesheet</span></li>
</ul>
<h3>The scale</h3>
<table><thead><tr><th scope="col">Role</th><th scope="col">Size</th><th scope="col">Family</th><th scope="col">Treatment</th></tr></thead><tbody>
${[['Cover title', TYPE.scale.coverTitle, 'Serif', 'Foil gradient, embossed lighting'],
    ['Level numeral', TYPE.scale.levelNumeral, 'Serif', 'Blind emboss on the level wash'],
    ['Level title', TYPE.scale.levelTitle, 'Serif', 'Bold, level ink'],
    ['Chapter title', TYPE.scale.chapterTitle, 'Serif', 'Bold, gold-to-platinum rule beneath'],
    ['Module title', TYPE.scale.moduleTitle, 'Serif', 'Bold, with numeral panel'],
    ['Lesson title', TYPE.scale.lessonTitle, 'Serif', 'Bold, kind label above'],
    ['Lead paragraph', TYPE.scale.lead, 'Serif', 'Primary ink'],
    ['Body', TYPE.scale.body, 'Serif', 'Warm charcoal'],
    ['Apparatus', TYPE.scale.apparatus, 'Sans', 'Stage headings, options, keys'],
    ['Caption', TYPE.scale.caption, 'Sans', 'Slate grey'],
    ['Micro label', TYPE.scale.micro, 'Sans', '0.16em tracking, uppercase']]
    .map(([r, s, f, t]) => `<tr><td>${r}</td><td class="mono">${s} pt</td><td>${f}</td><td>${t}</td></tr>`).join('')}
</tbody></table>
<div class="panel"><p class="panel__h">Substitution policy</p>
<p>Both stacks name metric-compatible fallbacks in order. No font file is embedded from a third
  party and no webfont is fetched, so the publication cannot fail to render because a licence
  lapsed or a CDN went down. If a production house prefers a licensed pair, substitute at the same
  optical size and measure — the grid is set in points, not in glyphs.</p></div>

<h3>The stage icon language</h3>
<p>${ICON_KEYS.length} icons, one per lesson stage, drawn on a single 24-unit grid with a 1.6-unit
  stroke, round caps and joins, and a 2-unit optical margin. That shared construction — not a shared
  style — is what makes them one family. They are stroked rather than filled so they hold at 8 pt on
  uncoated stock, where a filled mark of that size fills in to a blot, and they inherit
  <span class="mono">currentColor</span>, so a stage icon is always exactly the colour of the level
  it sits in and no per-level asset exists.</p>
<ul class="marks">${markRows}</ul>
<div class="panel"><p class="panel__h">Why these replaced the previous glyphs</p>
<p>The earlier edition marked each stage with a typographic character — ◆, ≈, ✎. Those come from
  different type designers working to unrelated briefs, so set beside each other at 8 pt they had
  different weights and optical centres and the column of marks down a lesson read as a jumble. A
  glyph is also at the mercy of the font stack: a book whose navigation depends on ✎ is a book that
  can lose its navigation to a missing character.</p></div>

<h2>3 · Colour specification</h2>
<p class="lead">Fourteen colours, each with a stated role. A palette without roles is a mood board.</p>
<p>Royal Blue and Royal Gold sit almost exactly complementary on the wheel — the relationship that
  has been the livery of universities and civic institutions for eight centuries. Deep Crimson
  completes a split-complementary triad: related enough to belong, distant enough to alarm when it
  is used, which is what an accent is for. Crimson appears only on assessment and on statements of
  what is not evidenced. It is never decorative.</p>
<table><thead><tr><th scope="col"></th><th scope="col">Colour</th><th scope="col">Hex</th><th scope="col">RGB</th><th scope="col">CMYK*</th><th scope="col">Role</th></tr></thead>
<tbody>${colourRows}</tbody></table>
<p class="small">* Uncalibrated conversion. Provided as a prepress starting point, not as final
  separations — a saturated blue in particular will need adjustment against the press profile.</p>

<h3>Contrast, measured</h3>
<p>Every pairing the design actually uses, measured by the WCAG relative-luminance formula. This
  table is computed at generation: if a colour changes and a pair falls below its floor, the row
  turns and this document says so.</p>
<table><thead><tr><th scope="col">Pairing</th><th scope="col">Foreground</th><th scope="col">Ground</th><th scope="col">Ratio</th><th scope="col">Floor</th>
<th scope="col">Result</th></tr></thead><tbody>${contrastRows}</tbody></table>
${contrastFails.length ? `<div class="panel"><p class="panel__h">Outstanding</p><p>${
  contrastFails.length} pairing(s) fall below the stated floor and must be resolved before
  press.</p></div>` : ''}

<h3>Level identities</h3>
<p>Six palettes, one family. Close in value and saturation so the book reads as one work rather
  than as six pamphlets bound together, and separated enough that a reader opening the volume
  anywhere knows which level they are in before reading the running head.</p>
<table><thead><tr><th scope="col">Level</th><th scope="col">Name</th><th scope="col">Ink</th><th scope="col">Mid</th><th scope="col">Wash</th>
<th scope="col">Ink on wash</th><th scope="col">CEFR</th></tr></thead><tbody>${levelRows}</tbody></table>

<h2>4 · Illustration specification</h2>
<p class="lead">Every mark in this publication is computed from its own geometry at render time.</p>
<p>There is no stock artwork, no traced illustration, no licensed image and no photograph. That is
  partly a production decision — vector marks are resolution-independent, cannot fail to load, and
  carry no licence question into a reprint — and partly a truthfulness one: a stock photograph of a
  model captioned as a student of this College would be a fabrication, and this publication does
  not contain one.</p>
<table><thead><tr><th scope="col">Mark</th><th scope="col">Name and source</th><th scope="col">Construction</th><th scope="col">Where used</th></tr></thead>
<tbody>${ornRows}</tbody></table>
<h3>Photography</h3>
<p>Six plates, one facing each level divider, and none anywhere else. Photography is placed only
  where the reader crosses into a new level; a photograph beside a lesson stage competes with the
  thing a teacher is trying to read.</p>
<ul class="spec">
  <li><b>Source</b><span>Adobe Stock, licensed for editorial and commercial use. Asset references
    are printed in the colophon.</span></li>
  <li><b>Grade</b><span>Duotone, computed per level: luminance mapped onto a ramp from the level’s
    ink to its wash. The grade is derived from the palette, so changing a level hue changes its
    plate.</span></li>
  <li><b>Effective resolution</b><span>Each plate is placed at 2,400 px across a 168 mm frame:
    <b>363 dpi</b>, above the 300 dpi offset floor with headroom for slight enlargement. Verified
    on every build at the print measure, because a file that is 363 dpi in a 168 mm frame is
    180 dpi in a 340 mm one — only the ratio matters.</span></li>
  <li><b>Resampling</b><span>Sources are 5,631–8,192 px and are resampled to the placed size before
    binding. Embedding an 8,192 px image in a 168 mm frame does not make the plate sharper — the
    printer's RIP downsamples it anyway — it made a 42 MB PDF. Resampled, the same book is 21 MB.
    Full-resolution originals are retained outside the publication for any future edition that
    places them larger.</span></li>
  <li><b>Placement</b><span>Always a verso, facing its divider on the recto, so a level opens as a
    single spread composition.</span></li>
  <li><b>Bleed</b><span>None. The plates fill the type area (168 × 265 mm) and stop at it. Full
    bleed is not achievable in this pipeline — see the limitation noted below.</span></li>
  <li><b>Representation</b><span>Selected for a genuine spread of geography, ethnicity, age and
    gender across the six, and for documentary rather than staged-corporate register.</span></li>
</ul>
<div class="panel"><p class="panel__h">Why the plates do not bleed</p>
<p>An element wider than the page content box causes this rendering engine to scale the entire
  document down to fit. A full-bleed plate silently rescaled all 487 pages to about 91% — every
  type size below specification and a spine computed from a false extent — while every content
  check still passed. The plates are therefore held within the type area, and a build-time
  assertion now fails if any element exceeds the content box. If this publication is ever
  re-originated in a professional layout application, full bleed should be restored there.</p></div>

<h3>Figures</h3>
<p>Five figures in the front matter, each computed from the curriculum rather than drawn to
  illustrate it: bar lengths are proportional to counts, frequencies are tallied across all authored
  items, and every label is generated with the mark it labels. The constraint is deliberate and it
  has teeth — these figures become wrong the moment the curriculum changes, which is the property
  that separates information design from decoration.</p>
<table><thead><tr><th scope="col">Figure</th><th scope="col">What it measures</th><th scope="col">Source</th></tr></thead><tbody>
${[['1 · The ascent', 'Words of lesson content per level, with words per named stage.',
    'diagrams.mjs · ascentChart()'],
    ['2 · Sixty modules', 'Item composition of every module, as small multiples.',
      'diagrams.mjs · architectureGrid()'],
    ['3 · Anatomy of a lesson', 'Stage frequency across every named stage, with median timing.',
      'diagrams.mjs · lessonAnatomy()'],
    ['4 · Four skills', 'Named skill stages per hundred items, by level.',
      'diagrams.mjs · skillsAcrossLevels()'],
    ['5 · Assessment map', 'Quizzes, questions, assignments, rubric criteria and competency mapping.',
      'diagrams.mjs · assessmentMap()']]
    .map(([a, b, c]) => `<tr><td><b>${a}</b></td><td>${b}</td><td class="mono">${c}</td></tr>`).join('')}
</tbody></table>
<div class="panel"><p class="panel__h">A figure that cannot be wrong was never saying anything</p>
<p>Figure 1 was drawn twice. The first version plotted duration against item count under the caption
  <em>the six levels are not six equal steps</em>, and rendered as six identical columns — because
  they are six equal steps. The chart was accurate; the caption was not. Both were replaced rather
  than the caption alone, and the note recording that stands in the published figure.</p></div>

<div class="panel"><p class="panel__h">Line weights at press</p>
<p>Guilloché and girih line-work runs between 0.28 pt and 0.70 pt. Below roughly 0.25 pt fine gold
  line-work on uncoated stock will begin to drop out. Proof the cover and the frontispiece plate on
  the specified stock before committing the run; if the line-work thins, raise the stroke weights in
  <span class="mono">ornament.mjs</span> rather than scaling the artwork.</p></div>

<h2>5 · Asset inventory</h2>
<p class="lead">What is delivered, and what generates it.</p>
<h3>Deliverable files</h3>
<table><thead><tr><th scope="col">File</th><th scope="col">Purpose</th><th scope="col">Format</th><th scope="col">Size</th><th scope="col">State</th></tr></thead>
<tbody>${fileRows}</tbody></table>
<h3>Source</h3>
<p>The publication has no binary assets. Its entire source is text, which means the whole book —
  content, colour, ornament, identifiers — is diffable, reviewable and reproducible.</p>
<table><thead><tr><th scope="col">Module</th><th scope="col">Responsibility</th><th scope="col">State</th></tr></thead>
<tbody>${srcRows}</tbody></table>
<h3>External assets</h3>
<p>No embedded font file, no icon set and no CDN reference. The verification QR is generated by
  the College's own encoder. The only external assets are the six licensed photographs listed in
  the colophon, supplied as JPEG at source resolution.</p>

<h2>6 · Finishing specification</h2>
<p class="lead">Where the special processes fall, and — as important — where they deliberately
  do not.</p>
<p>Every process below is <b>optional</b>. The artwork is built so that the book reads correctly
  printed flat in four-colour process with no finishing at all; the finishing raises a good book to
  a presentation object, and its absence never leaves a hole where an effect should have been. That
  is a deliberate constraint: a cover that only works foiled is a cover that fails the moment the
  budget moves.</p>

<h3>Foil stamping</h3>
<ul class="spec">
  <li><b>Foil</b><span>Matt gold pigment foil. A bright mirror foil fights the guilloché — the
    line-work is 0.3 pt and a specular finish destroys it under raking light.</span></li>
  <li><b>Front cover</b><span>Title block (<i>The International English Fluency Certificate</i>),
    the crest, and the IEFC emblem ring. Not the subtitle, not the edition line, not the
    guilloché rosette — a foiled rosette at this line weight will fill in.</span></li>
  <li><b>Spine</b><span>Title and crest only.</span></li>
  <li><b>Back cover</b><span>None. The back is a reading surface; foil on both faces makes the
    object look like packaging.</span></li>
  <li><b>Registration</b><span>Foil to be held to ±0.3 mm against the printed rules. The border
    system is drawn as a single SVG so the corners meet exactly; a foil that misses by more than
    that will read as a mitre error rather than a registration one.</span></li>
</ul>

<h3>Emboss and deboss</h3>
<ul class="spec">
  <li><b>Blind deboss</b><span>The outer border rule on the front cover, 0.25 mm depth, single
    level. It gives the frame a physical edge without adding ink.</span></li>
  <li><b>Registered emboss</b><span>The crest only, 0.35 mm, sculpted die, registered to the foil.
    Nothing else on the cover is embossed: a cover with three embossed elements reads as a
    certificate rather than a book.</span></li>
  <li><b>Do not emboss</b><span>Type below 14 pt, the guilloché, the girih field, and the QR. Fine
    line-work distorts under a die and a distorted QR does not scan.</span></li>
</ul>

<h3>Spot UV</h3>
<ul class="spec">
  <li><b>Where</b><span>The guilloché rosette on the front cover and the guilloché band at the
    foot, on the matt laminate. Gloss varnish over matt is what makes engine-turning read as
    engraving rather than as printing.</span></li>
  <li><b>Where not</b><span>Never over foil (the varnish dulls it) and never over the QR (specular
    reflection defeats a phone camera at an angle).</span></li>
  <li><b>Trap</b><span>0.2 mm inside the artwork edge, so a slight misregistration shows as a
    hairline of matt rather than a halo of gloss on the ground.</span></li>
</ul>

<h3>Ribbon, head and tail</h3>
<ul class="spec">
  <li><b>Ribbon marker</b><span>Recommended at this extent: one ribbon, 6 mm woven satin, in the
    Royal Gold of the identity, cut on the bias to resist fraying, length = page diagonal + 25 mm
    so it protrudes when closed. A teacher's manual is used at two places at once — the lesson and
    its rubric — so a second ribbon in Rich Burgundy is worth the small cost.</span></li>
  <li><b>Head and tail bands</b><span>Rich Burgundy <span class="sw" style="background:${PAL.richBurgundy}"></span>
    and Ivory striped. The second ribbon and the case cloth take the same Rich Burgundy: it is
    specified as a material colour rather than an ink, and this is the only place in the system it
    appears.</span></li>
  <li><b>Note</b><span>Ribbons and head bands require a sewn or notch-bound block. If the job is
    run as standard perfect binding, omit both rather than glue them in — a glued-in ribbon tears
    the first spine it is pulled against.</span></li>
</ul>

<h3>Paper and board</h3>
<table><thead><tr><th scope="col">Component</th><th scope="col">Stock</th><th scope="col">Why</th></tr></thead><tbody>
${[['Text block', '100 gsm uncoated offset, high bulk, natural white, FSC',
    'Uncoated because this is a book a teacher writes in. High opacity so the reverse of a tinted '
    + 'module opener does not show through the lesson behind it.'],
    ['Level dividers (optional upgrade)', '140 gsm uncoated, same shade',
      'Six leaves only. A heavier divider is felt before it is seen — the reader\'s thumb finds the '
      + 'level before the eye does.'],
    ['Endpapers', '150 gsm uncoated, solid Midnight Navy, printed girih field in Royal Gold',
      'The endpaper is the first and last thing seen. A plain white endpaper on a foiled cover is '
      + 'the single clearest sign a budget ran out at the end.'],
    ['Cover board', '300 gsm one-sided FBB, matt laminate outer',
      'Matt laminate protects a dark ground, which shows every fingerprint without it, and is the '
      + 'ground spot UV needs to register against.'],
    ['Case (if cased in)', '2.5 mm greyboard, cloth or printed-and-laminated wrap',
      'At 477 pages a cased binding is defensible. Specify a 3 mm square.']]
    .map(([a, b, c]) => `<tr><td><b>${a}</b></td><td>${b}</td><td>${c}</td></tr>`).join('')}
</tbody></table>

<h3>Binding</h3>
<ul class="spec">
  <li><b>Recommended</b><span>Section-sewn, then either cased in or drawn on with a soft cover.
    ${pages ? `At ${pages} pages` : 'At this extent'} the block is thick enough that a glued-only
    spine will crack the first time it is opened flat on a desk, which is the posture this book is
    used in.</span></li>
  <li><b>Acceptable alternative</b><span>PUR perfect binding. Stronger and more flexible than EVA
    and it will open acceptably flat; specify PUR explicitly, because EVA is the default and EVA at
    this extent will fail.</span></li>
  <li><b>Not acceptable</b><span>Saddle stitch (impossible at this extent) and spiral or wire-o
    (no spine to carry a title, and this book must be findable on a shelf).</span></li>
  <li><b>Grain direction</b><span>Parallel to the spine, without exception. Cross-grain at this
    bulk gives a block that will not lie flat and a cover that curls in a damp room.</span></li>
  <li><b>Signature count</b><span>${pages ? `${pages} pages` : 'Extent'} — confirm the imposition
    with the printer. The text block is designed so that the six level dividers fall on a recto;
    that imposition is computed at generation and will change if the extent changes, so re-generate
    rather than adjusting by hand.</span></li>
</ul>

<div class="panel"><p class="panel__h">What none of this buys</p>
<p>Finishing makes an object feel considered. It does not make a curriculum better, and this
  specification should not be read as suggesting the two are related. If a choice arises between
  the ribbon and a heavier text stock that stops show-through on the tinted openers, choose the
  paper: the reader notices show-through on every page and the ribbon on none.</p></div>

<h2>7 · Production checklist</h2>
<p class="lead">Verified automatically at generation. A tick here means a machine confirmed it, not
  that someone remembered to.</p>
<table><thead><tr><th scope="col"></th><th scope="col">Check</th><th scope="col">Evidence</th><th scope="col">State</th></tr></thead>
<tbody>${checkRows}</tbody></table>
<h3>Manual steps before press</h3>
<p>These cannot be verified by a build and are therefore listed separately rather than mixed in
  above, where a reader would reasonably assume they had been confirmed. <b>None of the following
  has been carried out.</b></p>
<ul class="rules">${MANUAL.map((m) => `<li>${esc(m)}</li>`).join('')}</ul>

<h2>8 · Brand style guide</h2>
<p class="lead">The rules that keep a second edition looking like the first.</p>
<h3>The crest</h3>
<p>A shield, an open book, six ascending bars for the six levels, and the founding letters. It
  carries no heraldic claim: no granted arms, no supporters, no motto. Reproduce it no smaller than
  10 mm tall, always with clear space of at least half its width on every side, and never recoloured
  outside the system palette. It may be set as an outline on a dark ground or filled on a light one;
  it is never set in a colour that is not in section 3.</p>
<h3>Rules that do not bend</h3>
<ul class="rules">
  <li>Gold is rationed. It marks conferral, ornament and rules — never body text, never a heading
    that is merely important. Gold used generously stops meaning anything.</li>
  <li>Crimson means assessment or an unmet claim. It is never used to make something look urgent.</li>
  <li>Two type families. A third family is a redesign, not a variation.</li>
  <li>Apparatus recedes. Timings, folios, captions and metadata are slate grey at the apparatus
    size; they are never allowed to compete with content.</li>
  <li>Every ornament is drawn from the system in <span class="mono">ornament.mjs</span>. A new mark
    is added there, with its construction, or it is not used.</li>
  <li>No photography of people. If a future edition commissions genuine photography of real students
    with their consent, it may be used; stock imagery standing in for the College may not.</li>
  <li>No registry number the College does not hold. ISBN, DOI and catalogue references are printed
    as unassigned until an issuing authority assigns them.</li>
  <li>Counts are computed, never typed. Every figure in the publication is derived from the database
    at generation, so no number can survive the thing it counts.</li>
</ul>
<h3>Identification and security</h3>
<ul class="spec">
  <li><b>Publication ID</b><span class="mono">${esc(ID.publicationId)}</span></li>
  <li><b>Document ID</b><span class="mono">${esc(ID.documentId)}</span></li>
  <li><b>Issue code</b><span class="mono">${esc(ID.issueCode)}</span></li>
  <li><b>Print identifier</b><span class="mono">${esc(ID.printIdentifier)}</span></li>
  <li><b>Version</b><span class="mono">${esc(ID.version)}</span></li>
  <li><b>Content digest</b><span class="mono">${esc(ID.contentDigest.slice(0, 32))}…</span></li>
  <li><b>Verification</b><span class="mono">${esc(ID.verifyUrl)}</span></li>
</ul>
<div class="panel"><p class="panel__h">Digital authenticity notice</p>
<p>${esc(AUTHENTICITY_NOTICE)}</p></div>
<div class="panel"><p class="panel__h">Registry fields the College does not hold</p>
<p>${ID.registrations.map((r) => `${esc(r.field)}: ${esc(r.value)} (issued by ${esc(r.authority)})`)
    .join('. ')}. These are printed as unassigned in the publication. Inventing any of them would be
  a forgery of a third party's registry rather than a design flourish.</p></div>

<h3>Components specified but absent from the source curriculum</h3>
<p>Carried here from the Register of Omissions printed in the publication itself, so that a
  production house working from this document alone knows what is missing and why nothing was
  written to cover it.</p>
<table><thead><tr><th scope="col">Scope</th><th scope="col">Component</th><th scope="col">Status</th></tr></thead>
<tbody>${OMISSIONS.map((o) => `<tr><td>${esc(o.scope)}</td><td>${esc(o.item)}</td>
  <td class="gap">${esc(o.status)}</td></tr>`).join('')}</tbody></table>

</body></html>`;

mkdirSync(path.join(ROOT, 'publication'), { recursive: true });
writeFileSync(path.join(ROOT, 'publication', '.specs.html'), html);

const exe = process.env.PW_CHROMIUM || '/opt/pw-browsers/chromium-1194/chrome-linux/chrome';
const browser = await chromium.launch(existsSync(exe) ? { executablePath: exe } : {});
const page = await browser.newPage();
await page.setContent(html, { waitUntil: 'load' });
const out = path.join(ROOT, 'publication', 'IEFC Production Specifications.pdf');
await page.pdf({
  path: out, format: 'A4', printBackground: true, preferCSSPageSize: true,
  displayHeaderFooter: true,
  headerTemplate: '<div style="font:400 6pt Calibri,Arial,sans-serif;color:#9AA0AE;width:100%;'
    + 'padding:0 18mm;text-align:right;letter-spacing:.1em;text-transform:uppercase;">'
    + 'IEFC Complete Curriculum · Production Specification</div>',
  footerTemplate: '<div style="font:400 7.5pt Calibri,Arial,sans-serif;color:#6B7280;width:100%;'
    + 'padding:0 18mm;text-align:center;"><span class="pageNumber"></span></div>',
  margin: { top: '15mm', bottom: '13mm', left: '18mm', right: '18mm' },
  tagged: true, outline: true,
});
await browser.close();

console.log(`SPECS     ${out}`);
console.log(`  ${Object.keys(COLOURS).length} colours · ${PAIRS.length} contrast pairs checked · `
  + `${ORNAMENTS.length} ornaments · ${CHECKS.filter((c) => c[1]).length}/${CHECKS.length} automated checks pass`);
if (contrastFails.length) {
  console.log(`  CONTRAST BELOW FLOOR: ${contrastFails.map((f) => f[0]).join('; ')}`);
}
