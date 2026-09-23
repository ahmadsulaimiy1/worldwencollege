/**
 * THE BOARD & INVESTMENT EDITION — its page, its type and its materials.
 *
 * The house identity is the College's own (scripts/publication/
 * monograph.mjs): Royal Sapphire for the institution, a five-step gold
 * ramp for metal, pearl, ivory and cream for the grounds, champagne for
 * the rules, bronze for the second metal, and deep crimson as the seal —
 * one to three per cent of any page. The tokens are imported, never
 * re-typed, so this book and the College's other publications cannot
 * drift apart.
 *
 * What is new here is the page. A board paper is read for its argument
 * and checked for its numbers, so the page has two columns of purpose:
 * a rail on the inner side that carries the section's number and name,
 * and a measure of reading width for the argument. Tables and figures
 * take the full measure, because a number that has to be compared with
 * its neighbours needs the width to sit beside them.
 */
import { C, FACE, PAGE } from '../../publication/monograph.mjs';

export { C, FACE, PAGE };
export const RAIL = 46; // mm — the rail that carries section numbers and names

export const css = (faces) => `${faces}
@page { size: ${PAGE.width}mm ${PAGE.height}mm; margin: 0; }
:root {
  --sapphire: ${C.sapphire}; --sapphire-deep: ${C.sapphireDeep}; --sapphire-mid: ${C.sapphireMid};
  --gold-deep: ${C.goldDeep}; --gold: ${C.gold}; --gold-rich: ${C.goldRich}; --gold-leaf: ${C.goldLeaf};
  --gold-spec: ${C.goldSpec}; --champagne: ${C.champagne}; --champagne-deep: ${C.champagneDeep};
  --bronze: ${C.bronze}; --pearl: ${C.pearl}; --ivory: ${C.ivory}; --cream: ${C.cream};
  --ink: ${C.ink}; --ink-soft: ${C.inkSoft}; --grey: ${C.grey}; --rule: ${C.rule}; --rule-faint: ${C.ruleFaint};
  --crimson: ${C.crimson}; --on-sapphire: ${C.onSapphire}; --on-sapphire-soft: ${C.onSapphireSoft};
  --rail: ${RAIL}mm;
}
* { box-sizing: border-box; margin: 0; padding: 0; }
html, body { background: #d9d4c8; }
body { font-family: ${FACE.text}; color: var(--ink); font-size: 10pt; line-height: 1.5;
  font-variant-numeric: lining-nums; -webkit-print-color-adjust: exact; print-color-adjust: exact;
  font-optical-sizing: auto; hyphens: auto; }
@media screen { .pg { margin: 8mm auto; box-shadow: 0 2mm 8mm rgba(0,0,0,.18); } }

/* ── THE PAGE ────────────────────────────────────────────────────── */
.pg { width: ${PAGE.width}mm; height: ${PAGE.height}mm; position: relative; overflow: hidden;
  background: var(--pearl); break-after: page; page-break-after: always; }
.pg__field { position: absolute; top: ${PAGE.marginTop}mm; bottom: ${PAGE.marginBottom}mm;
  left: ${PAGE.marginInner}mm; right: ${PAGE.marginOuter}mm; overflow: hidden; }
.pg--verso .pg__field { left: ${PAGE.marginOuter}mm; right: ${PAGE.marginInner}mm; }
.pg--ivory { background: var(--ivory); }
.pg--cream { background: var(--cream); }
.rh { position: absolute; top: 13mm; left: ${PAGE.marginInner}mm; right: ${PAGE.marginOuter}mm;
  display: flex; justify-content: space-between; align-items: baseline;
  font: 500 6.4pt/1 ${FACE.data}; letter-spacing: .16em; text-transform: uppercase; color: var(--gold-deep);
  padding-bottom: 2.2mm; border-bottom: .35pt solid var(--champagne-deep); }
.pg--verso .rh { left: ${PAGE.marginOuter}mm; right: ${PAGE.marginInner}mm; }
.rh b { font-weight: 600; color: var(--sapphire); letter-spacing: .14em; }
.folio { position: absolute; bottom: 13mm; right: ${PAGE.marginOuter}mm;
  font: 400 9pt/1 ${FACE.display}; color: var(--sapphire); letter-spacing: .04em; }
.pg--verso .folio { right: auto; left: ${PAGE.marginOuter}mm; }
.folio::before { content: ''; display: inline-block; width: 6mm; height: .5pt; background: var(--gold-rich);
  vertical-align: middle; margin-right: 2.2mm; }
.pg--verso .folio::before { display: none; }
.pg--verso .folio::after { content: ''; display: inline-block; width: 6mm; height: .5pt; background: var(--gold-rich);
  vertical-align: middle; margin-left: 2.2mm; }
.pg--bare .rh, .pg--bare .folio { display: none; }

/* ── BLOCKS ──────────────────────────────────────────────────────── */
.blk { break-inside: avoid; }
.blk + .blk { margin-top: 3.4mm; }
.blk--h + .blk, .blk--sub + .blk { margin-top: 2.6mm; }
.blk--h { display: grid; grid-template-columns: var(--rail) 1fr; align-items: baseline; margin-top: 7mm !important;
  padding-top: 3mm; border-top: .5pt solid var(--champagne-deep); }
.blk--h:first-child { margin-top: 0 !important; }
.pg__field > .blk:first-child { margin-top: 0 !important; }
.pg__field > .blk--h:first-child { border-top: none; padding-top: 0; }
.blk--h .n { font: 400 19pt/1 ${FACE.ceremonial}; color: var(--gold); letter-spacing: .02em; }
.blk--h h2 { font: 500 16.5pt/1.18 ${FACE.display}; color: var(--sapphire); letter-spacing: -.004em; }
.blk--sub { margin-left: var(--rail); }
.blk--sub h3 { font: 600 7pt/1.2 ${FACE.data}; letter-spacing: .15em; text-transform: uppercase; color: var(--gold-deep); }
.blk--p { margin-left: var(--rail); }
.blk--p p { text-align: justify; text-justify: inter-word; }
.blk--p p + p { margin-top: 2.2mm; }
.blk--lead { margin-left: var(--rail); }
.blk--lead p { font: 300 13pt/1.42 ${FACE.display}; color: var(--ink-soft); letter-spacing: -.003em; }
.blk--list { margin-left: var(--rail); }
.blk--list li { list-style: none; position: relative; padding-left: 5mm; }
.blk--list li + li { margin-top: 1.4mm; }
.blk--list li::before { content: ''; position: absolute; left: 0; top: 2.35mm; width: 2.2mm; height: 2.2mm;
  transform: rotate(45deg) scale(.62); background: var(--gold-rich); }
.blk--list.num { counter-reset: item; }
.blk--list.num li::before { content: counter(item); counter-increment: item; transform: none; background: none;
  top: 0; width: auto; height: auto; font: 500 8.4pt/1.7 ${FACE.data}; color: var(--gold-deep); }
.blk--full { margin-left: 0; }

/* A decision the Board is asked to take: the seal colour, used sparingly. */
.blk--board { margin-left: var(--rail); padding: 3.4mm 4.4mm 3.6mm; background: var(--ivory);
  border-left: 1.6pt solid var(--crimson); }
.blk--board .lab { font: 600 6.4pt/1 ${FACE.data}; letter-spacing: .18em; text-transform: uppercase; color: var(--crimson); margin-bottom: 1.8mm; }
.blk--board p { font: 400 10pt/1.46 ${FACE.text}; }
.blk--note { border-left-color: var(--gold-rich); }
.blk--note .lab { color: var(--gold-deep); }

/* Key figures: the numbers a reader should leave the page holding. */
.kf { display: grid; gap: 0; border-top: .75pt solid var(--sapphire); border-bottom: .35pt solid var(--champagne-deep); }
.kf > div { padding: 3.2mm 3mm 3.4mm 0; }
.kf > div + div { padding-left: 3.4mm; border-left: .35pt solid var(--rule); }
.kf .v { font: 400 22pt/1 ${FACE.ceremonial}; color: var(--sapphire); letter-spacing: -.01em; white-space: nowrap; }
.kf .v small { font: 400 11pt/1 ${FACE.ceremonial}; color: var(--gold-deep); margin-left: .6mm; }
.kf .l { margin-top: 1.9mm; font: 500 6.3pt/1.32 ${FACE.data}; letter-spacing: .1em; text-transform: uppercase; color: var(--ink-soft); }
.kf .d { margin-top: 1.1mm; font: 400 7.8pt/1.34 ${FACE.text}; color: var(--grey); }

/* ── TABLES ──────────────────────────────────────────────────────── */
.tb { width: 100%; table-layout: fixed; border-collapse: collapse; font: 400 7.6pt/1.34 ${FACE.data}; font-variant-numeric: tabular-nums lining-nums; }
.tb caption { caption-side: top; text-align: left; padding-bottom: 2mm; }
.tb caption b { display: block; font: 500 11pt/1.25 ${FACE.display}; color: var(--sapphire); letter-spacing: -.002em; }
.tb caption span { display: block; margin-top: .8mm; font: italic 400 8.4pt/1.35 ${FACE.text}; color: var(--grey); }
.tb th { font: 600 6pt/1.25 ${FACE.data}; letter-spacing: .12em; text-transform: uppercase; color: var(--sapphire);
  text-align: left; vertical-align: bottom; padding: 0 2mm 1.6mm 0; border-bottom: .75pt solid var(--gold-rich); }
.tb td { overflow-wrap: anywhere; hyphens: auto; padding: 1.35mm 2mm 1.35mm 0; border-bottom: .35pt solid var(--rule); vertical-align: top; color: var(--ink); }
.tb .r { text-align: right; }
.tb th.r { text-align: right; }
.tb td:last-child, .tb th:last-child { padding-right: 0; }
.tb tr.sum td { border-top: .75pt solid var(--sapphire); border-bottom: .75pt solid var(--sapphire); font-weight: 600; color: var(--sapphire); }
.tb tr.sub td { font-weight: 600; color: var(--ink); }
.tb tr.grp td { padding-top: 3mm; font: 600 6.3pt/1.2 ${FACE.data}; letter-spacing: .14em; text-transform: uppercase;
  color: var(--gold-deep); border-bottom: .5pt solid var(--champagne-deep); }
.tb tr.neg td.r, .tb td.neg { color: var(--crimson); }
.tb td.t { font: 400 8.3pt/1.36 ${FACE.text}; }
.tb td.src { font: 400 6.6pt/1.34 ${FACE.data}; color: var(--ink-soft); }
.tb td.nm { font: 500 8.3pt/1.3 ${FACE.text}; color: var(--sapphire); }
.tb .muted { color: var(--grey); }
.tb .dot { color: var(--gold-deep); font-size: 9pt; }
.tb .no { color: var(--rule); }
.tb-note { margin-top: 1.8mm; font: italic 400 7.8pt/1.38 ${FACE.text}; color: var(--grey); }

/* ── FIGURES ─────────────────────────────────────────────────────── */
.fig { margin: 0; }
.fig figcaption { margin-bottom: 2.4mm; }
.fig figcaption b { display: block; font: 500 11pt/1.25 ${FACE.display}; color: var(--sapphire); }
.fig figcaption span { display: block; margin-top: .8mm; font: italic 400 8.4pt/1.35 ${FACE.text}; color: var(--grey); }
.fig svg { display: block; width: 100%; height: auto; }
.fig .reading { margin-top: 2.2mm; font: 400 8.6pt/1.42 ${FACE.text}; color: var(--ink-soft); }

/* ── OPENERS ─────────────────────────────────────────────────────── */
.pg--opener { background: radial-gradient(ellipse 120% 90% at 78% 12%, #173c8c 0%, var(--sapphire-deep) 58%, #050f2c 100%); color: var(--on-sapphire); }
.pg--opener.crimson { background: radial-gradient(ellipse 120% 90% at 78% 12%, #86253a 0%, #4c0f1d 60%, #2e0811 100%); }
.frame { position: absolute; inset: 11mm; border: .6pt solid rgba(217,168,60,.62); pointer-events: none; }
.frame::after { content: ''; position: absolute; inset: 1.6mm; border: .3pt solid rgba(217,168,60,.34); }
.op { position: absolute; left: 26mm; right: 24mm; top: 34mm; bottom: 30mm; display: flex; flex-direction: column; }
.op .eye { font: 600 6.8pt/1 ${FACE.data}; letter-spacing: .3em; text-transform: uppercase; color: var(--gold-leaf); }
.op .num { margin-top: 6mm; height: 58mm; }
.op .num svg { height: 100%; width: auto; display: block; }
.op h1 { margin-top: 8mm; font: 400 33pt/1.08 ${FACE.display}; letter-spacing: -.012em; color: var(--on-sapphire); max-width: 150mm; }
.op .say { margin-top: 7mm; font: 300 13pt/1.46 ${FACE.display}; color: var(--on-sapphire-soft); max-width: 138mm; }
.op .inthis { margin-top: auto; border-top: .5pt solid rgba(217,168,60,.55); padding-top: 4mm; columns: 2; column-gap: 8mm; }
.op .inthis li { list-style: none; break-inside: avoid; display: flex; gap: 3mm; padding: 1.1mm 0;
  font: 400 9.4pt/1.3 ${FACE.text}; color: var(--on-sapphire); }
.op .inthis li i { font: 500 7pt/1.9 ${FACE.data}; color: var(--gold-leaf); font-style: normal; min-width: 7mm; letter-spacing: .06em; }

/* ── COVER ───────────────────────────────────────────────────────── */
.cover { position: absolute; inset: 0; display: flex; flex-direction: column; align-items: center; text-align: center; }
.cover .mark { margin-top: 42mm; width: 52mm; }
.cover .college { margin-top: 12mm; font: 500 7.4pt/1 ${FACE.data}; letter-spacing: .36em; text-transform: uppercase; color: var(--gold-leaf); }
.cover .title { margin-top: 16mm; width: 176mm; }
.cover .edition { margin-top: 10mm; font: 400 italic 14pt/1.3 ${FACE.display}; color: var(--on-sapphire); }
.cover .period { margin-top: 5mm; font: 500 8pt/1 ${FACE.data}; letter-spacing: .42em; color: var(--gold-leaf); }
.cover .foot { margin-top: auto; margin-bottom: 26mm; font: 400 8.6pt/1.5 ${FACE.text}; color: var(--on-sapphire-soft); max-width: 128mm; }
.cover .rule { width: 42mm; height: .6pt; background: linear-gradient(90deg, transparent, var(--gold-rich), transparent); margin-top: 10mm; }

/* ── CONTENTS ────────────────────────────────────────────────────── */
.toc h1 { font: 400 30pt/1 ${FACE.ceremonial}; color: var(--sapphire); letter-spacing: -.01em; }
.toc .sub { margin-top: 3mm; font: italic 300 11pt/1.4 ${FACE.display}; color: var(--ink-soft); }
.toc ol { margin-top: 10mm; }
.toc li { list-style: none; display: grid; grid-template-columns: 16mm 1fr 14mm; align-items: baseline;
  padding: 2.25mm 0; border-bottom: .35pt solid var(--rule); }
.toc li i { font: 400 13pt/1 ${FACE.ceremonial}; color: var(--gold); font-style: normal; }
.toc li b { font: 500 11pt/1.25 ${FACE.display}; color: var(--sapphire); }
.toc li span { display: block; margin-top: .6mm; font: 400 8.2pt/1.35 ${FACE.text}; color: var(--grey); }
.toc li em { font: 400 9.5pt/1 ${FACE.display}; font-style: normal; color: var(--sapphire); text-align: right; }
.toc li.front b { font-weight: 400; }

/* ── ROADMAP YEAR ────────────────────────────────────────────────── */
.yr { display: grid; grid-template-columns: 1fr 1fr; column-gap: 7mm; row-gap: 0; }
.yr__head { grid-column: 1 / -1; display: grid; grid-template-columns: 50mm 1fr; column-gap: 6mm; align-items: end;
  padding-bottom: 4mm; border-bottom: .75pt solid var(--sapphire); }
.yr__head .y svg { width: 50mm; height: auto; display: block; }
.yr__head .ph { font: 600 6.8pt/1 ${FACE.data}; letter-spacing: .24em; text-transform: uppercase; color: var(--gold-deep); }
.yr__head .ob { margin-top: 2.2mm; font: 400 15pt/1.24 ${FACE.display}; color: var(--sapphire); }
.yr__sec { padding-top: 3.2mm; }
.yr__sec h4 { font: 600 6.3pt/1 ${FACE.data}; letter-spacing: .18em; text-transform: uppercase; color: var(--gold-deep);
  padding-bottom: 1.6mm; border-bottom: .35pt solid var(--champagne-deep); margin-bottom: 2mm; }
.yr__sec li { list-style: none; position: relative; padding-left: 4mm; font: 400 9pt/1.42 ${FACE.text}; }
.yr__sec li + li { margin-top: 1.2mm; }
.yr__sec li::before { content: ''; position: absolute; left: 0; top: 2.1mm; width: 1.6mm; height: 1.6mm; transform: rotate(45deg); background: var(--gold-rich); }
.yr__sec.full { grid-column: 1 / -1; }
.yr__nums { display: grid; grid-template-columns: 1fr 1fr; gap: 1.6mm 4mm; }
.yr__nums > div { border-bottom: .35pt solid var(--rule); padding-bottom: 1.2mm; }
.yr__nums .v.small { font: 400 9pt/1.3 ${FACE.text}; color: var(--ink); }
.yr__nums .v { font: 500 12pt/1.1 ${FACE.display}; color: var(--sapphire); font-variant-numeric: tabular-nums lining-nums; }
.yr__nums .v.neg { color: var(--crimson); }
.yr__nums .l { font: 500 6pt/1.3 ${FACE.data}; letter-spacing: .08em; text-transform: uppercase; color: var(--ink-soft); }
.yr__gate { grid-column: 1 / -1; margin-top: 4mm; display: grid; grid-template-columns: 1fr 1fr; column-gap: 7mm;
  padding: 3.4mm 4mm; background: var(--ivory); border-left: 1.6pt solid var(--crimson); }
.yr__gate h4 { font: 600 6.3pt/1 ${FACE.data}; letter-spacing: .18em; text-transform: uppercase; color: var(--crimson); margin-bottom: 1.6mm; }
.yr__gate p { font: 400 9pt/1.42 ${FACE.text}; }
.yr__band { grid-column: 1 / -1; margin-top: 5mm; }
`;
