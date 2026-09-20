/**
 * THE MONOGRAPH — art direction for the WEC-LC flagship publication.
 *
 * ════════════════════════════════════════════════════════════════════
 * WHAT WAS WRONG, STATED PLAINLY
 * ════════════════════════════════════════════════════════════════════
 * The previous publication was a long report with attractive pages. It
 * failed as a book for four reasons, and only the last is about taste.
 *
 * 1 · IT WAS NEVER SET. The CSS asked for Cambria, Nimbus Roman and
 *     Georgia. The rendering machine has none of them. Every page of
 *     every version was set in a Times metric clone while the stylesheet
 *     described a document nobody had ever seen.
 *
 * 2 · IT HAD ONE COMPOSITION. An opener, then body, then tables, for
 *     twenty sections. A reader could not tell page 9 from page 31.
 *     Rhythm is not decoration; it is how a long document stays legible
 *     as an argument.
 *
 * 3 · IT WAS PAGINATED BY ACCIDENT. Content flowed and the page breaks
 *     fell where they fell, which is why tables stranded their captions
 *     and sections ended in half-empty pages. A book is composed in
 *     SPREADS. Nothing here flows without being told where it may.
 *
 * 4 · ITS GOLD WAS DECORATION. Gold that outlines things is a template.
 *     Gold that MEASURES things — a rule whose length is a quantity, a
 *     hairline that marks a threshold — is architecture.
 *
 * ════════════════════════════════════════════════════════════════════
 * THE DECISIONS, MADE HERE AND NOT DEFERRED
 * ════════════════════════════════════════════════════════════════════
 *
 * FORMAT · 230 × 300mm, not A4. A4 is the shape of correspondence. A
 * commissioned institutional monograph is taller and narrower in its
 * text block than its trim, and the extra 3mm of width over A4 buys a
 * 172mm measure that holds 62 characters of Garamond at 10.5pt — the
 * width at which a long argument is actually read rather than scanned.
 *
 * TYPE · Four faces, each with one job. Cinzel cuts inscriptions.
 * Cormorant Garamond carries display. EB Garamond is the reading voice.
 * Inter is the instrument panel and never speaks. See fetch-fonts.mjs.
 *
 * IMAGERY · There is none, and that is a decision rather than an
 * omission. The College holds no licensed photography of itself, its
 * campus or its people. Stock photography of somebody else's library
 * would be a claim about an institution that does not hold it, which
 * CLAUDE.md §5 forbids, and generated imagery is forbidden by the
 * commission. The full-bleed master is therefore a COLOUR FIELD —
 * midnight, ruled in gold, with monumental type. For a sovereign
 * register that is the stronger instrument anyway: an inscription does
 * not need a photograph.
 */

// ════════════════════════════════════════════════════════════════════
// I · THE PALETTE
// ════════════════════════════════════════════════════════════════════
/*
 * Five colours and two greys. Gold is ONE value plus a pale companion,
 * because a luxury palette with four golds in it is a palette nobody
 * chose. The midnight is warm rather than blue-black; a cold navy reads
 * as finance, and this is an academic institution.
 */
export const C = {
  midnight: '#0A1A2F',
  midnightDeep: '#06111F',
  ink: '#16202C',
  inkSoft: '#3D4654',
  grey: '#79828F',
  rule: '#D9D2C2',
  ruleFaint: '#EBE6DA',
  bone: '#F6F2E9',
  ivory: '#FCFAF5',
  paper: '#FFFFFF',
  gold: '#A9843C',
  goldLeaf: '#C9A961',
  goldPale: '#E8D9B4',
  crimson: '#7E1F2D',
  sage: '#3A6350',
};

/*
 * TWO FACES, AND THE REASON THERE ARE ONLY TWO.
 *
 * The book was set in four: Cinzel for inscriptions, Cormorant Garamond
 * for display, EB Garamond for text, Inter for data. Every one of those
 * choices was wrong, and the fault they shared is that none of them was
 * judged by rendering the actual page.
 *
 *   CINZEL is a Trajan revival that exists only in capitals, so it
 *   CANNOT be set without tracking — the cliché was built into the
 *   typeface selection before a single letter-space was typed.
 *
 *   CORMORANT GARAMOND is drawn for sixty point and above. At the 11pt
 *   a percentage sits at in a financial diagram its hairlines vanish
 *   and its old-style numerals will not hold a column. The figures in
 *   the capital architecture were thin because the face was being asked
 *   to work three sizes below where it lives.
 *
 *   EB GARAMOND then did the text, which meant two different Garamonds
 *   doing one face's job at different sizes and agreeing about nothing.
 *
 *   INTER is the typeface of every software company of the last decade.
 *   It is excellent and it reads as a product.
 *
 * NEWSREADER replaces the three serifs with one superfamily carrying an
 * OPTICAL SIZE axis from 6 to 72 — which is the actual answer to the
 * problem the four faces were failing to solve. Its large sizes take
 * the high contrast and fine terminals that make a title; its small
 * sizes thicken those same hairlines so a seven-point caption survives.
 * Its numerals are lining and tabular, and its italic is a drawn italic
 * rather than a slant.
 *
 * ARCHIVO is the technical face and nothing else: labels, axes, tabular
 * figures. A grotesque in the Neue Haas line, neutral and precise.
 */
export const FACE = {
  display: "'Newsreader', 'Bitstream Charter', serif",
  text: "'Newsreader', 'Bitstream Charter', serif",
  data: "'Archivo', 'Liberation Sans', sans-serif",
};
/* Kept as an alias so nothing breaks while the inscriptional voice is
   retired; it now resolves to the display face set in small capitals,
   which is how an inscription is set in a book rather than on a plinth. */
FACE.inscription = FACE.display;

// ════════════════════════════════════════════════════════════════════
// II · THE PAGE, AND THE GRID INSIDE IT
// ════════════════════════════════════════════════════════════════════
/*
 * Every measurement below is in millimetres and every one of them is
 * deliberate. The inner margin exceeds the outer because a bound book
 * loses a few millimetres to the gutter, and a text block centred on
 * the trim reads off-centre on the spread.
 */
export const PAGE = {
  width: 230, height: 300,
  marginTop: 27, marginBottom: 30, marginOuter: 24, marginInner: 31,
  get measure() { return this.width - this.marginOuter - this.marginInner; }, // 175mm
  columns: 12,
  gutter: 4.2,
  /** The baseline everything vertical is a multiple of. */
  baseline: 5.2,
};

/** Width of n columns, in millimetres. */
export const col = (n) => {
  const w = (PAGE.measure - PAGE.gutter * (PAGE.columns - 1)) / PAGE.columns;
  return +(w * n + PAGE.gutter * (n - 1)).toFixed(3);
};

// ════════════════════════════════════════════════════════════════════
// III · THE TYPE SCALE
// ════════════════════════════════════════════════════════════════════
/*
 * A scale, not a list of sizes somebody liked. Base 10.5pt on a 15.6pt
 * line — three baselines of 5.2. Everything above the base steps on a
 * major third (1.25) and is then rounded to land on the baseline grid,
 * because type that does not sit on the grid is the difference between
 * a book and a document.
 */
export const T = {
  micro: 6.8, caption: 7.6, label: 8.2, small: 9.2,
  base: 10.5, lead: 13.2, h3: 15.6, h2: 20.8,
  title: 44, display: 68, monument: 150, colossal: 232,
};

export const LEAD = {
  base: 15.6, lead: 20.8, h3: 20.8, h2: 26, title: 46.8, display: 62,
};

// ════════════════════════════════════════════════════════════════════
// IV · THE STYLESHEET
// ════════════════════════════════════════════════════════════════════

export const css = (faces) => `
${faces}

/* ── The sheet ─────────────────────────────────────────────────── */
@page {
  size: ${PAGE.width}mm ${PAGE.height}mm;
  margin: 0;
}
* { box-sizing: border-box; -webkit-print-color-adjust: exact; print-color-adjust: exact; }
html, body { margin: 0; padding: 0; background: ${C.paper}; }
body {
  font-family: ${FACE.text};
  font-size: ${T.base}pt;
  line-height: ${LEAD.base}pt;
  color: ${C.ink};
  font-feature-settings: 'kern' 1, 'liga' 1, 'onum' 1;
  text-rendering: geometricPrecision;
}

/* ── The page as a composed object ─────────────────────────────────
   Every page is an explicit box. Nothing flows across a break unless
   this file says it may, which is how a spread stays a composition. */
.pg {
  position: relative;
  width: ${PAGE.width}mm;
  height: ${PAGE.height}mm;
  overflow: hidden;
  background: ${C.paper};
  break-after: page;
  page-break-after: always;
}
.pg:last-child { break-after: auto; page-break-after: auto; }

/* Recto and verso mirror their margins, as a bound book does. */
.pg__field {
  position: absolute;
  top: ${PAGE.marginTop}mm; bottom: ${PAGE.marginBottom}mm;
  left: ${PAGE.marginInner}mm; right: ${PAGE.marginOuter}mm;
}
.pg--verso .pg__field { left: ${PAGE.marginOuter}mm; right: ${PAGE.marginInner}mm; }

.pg--dark { background: ${C.midnight}; color: ${C.ivory}; }
.pg--bone { background: ${C.bone}; }
.pg--ivory { background: ${C.ivory}; }

/* ── Running furniture ─────────────────────────────────────────────
   A folio and a running head, set small, in the technical face, in
   grey. They orient a reader and must never be the second thing seen
   on a page. */
.folio {
  position: absolute; z-index: 5; bottom: ${PAGE.marginBottom - 12}mm;
  font-family: ${FACE.data}; font-size: ${T.micro}pt; font-weight: 500;
  letter-spacing: .04em; color: ${C.grey};
  font-variant-numeric: tabular-nums;
}
.pg .folio { right: ${PAGE.marginOuter}mm; }
.pg--verso .folio { left: ${PAGE.marginOuter}mm; right: auto; }
.pg--dark .folio { color: rgba(232,217,180,.55); }

.runhead {
  position: absolute; z-index: 5; top: ${PAGE.marginTop - 13}mm;
  font-family: ${FACE.data}; font-size: ${T.micro}pt; font-weight: 500;
  letter-spacing: .045em; text-transform: uppercase; color: ${C.grey};
}
.pg .runhead { right: ${PAGE.marginOuter}mm; text-align: right; }
.pg--verso .runhead { left: ${PAGE.marginOuter}mm; right: auto; text-align: left; }
.pg--dark .runhead { color: rgba(232,217,180,.5); }

/* ── Gold, used as architecture ────────────────────────────────────
   A rule that marks a threshold, never an outline around a box. */
.rule-struck { height: 1.4pt; background: ${C.gold}; border: 0; margin: 0; }
.rule-hair { height: .35pt; background: ${C.rule}; border: 0; margin: 0; }
.pg--dark .rule-hair { background: rgba(232,217,180,.28); }

/* ── Inscriptional voice ───────────────────────────────────────────*/
.inscr {
  font-family: ${FACE.inscription}; font-weight: 400;
  letter-spacing: .035em; text-transform: uppercase;
}

/* ── Eyebrow: the small line above a thing ─────────────────────────*/
.eyebrow {
  font-family: ${FACE.data}; font-size: ${T.micro}pt; font-weight: 600;
  letter-spacing: .05em; text-transform: uppercase; color: ${C.gold};
  margin: 0 0 ${PAGE.baseline}mm;
}
.pg--dark .eyebrow { color: ${C.goldLeaf}; }

/* ── Text ──────────────────────────────────────────────────────────*/
p { margin: 0 0 ${LEAD.base}pt; orphans: 3; widows: 3; }
p.tight { margin-bottom: ${LEAD.base * 0.4}pt; }
.lede {
  font-family: ${FACE.display}; font-weight: 300;
  font-size: ${T.lead}pt; line-height: ${LEAD.lead}pt; color: ${C.inkSoft};
  margin: 0 0 ${LEAD.lead}pt;
}
.pg--dark .lede { color: rgba(252,250,245,.82); }
/* A dropped initial, on the first paragraph of a narrative page only. */
.drop::first-letter {
  float: left; font-family: ${FACE.display}; font-weight: 400;
  font-size: ${LEAD.base * 3}pt; line-height: ${LEAD.base * 2.72}pt;
  padding: 0 .09em 0 0; color: ${C.gold};
}

h2, h3 { margin: 0; font-weight: 400; }
h2 {
  font-family: ${FACE.display}; font-size: ${T.h2}pt; line-height: ${LEAD.h2}pt;
  color: ${C.midnight}; margin: ${LEAD.base * 1.6}pt 0 ${LEAD.base * 0.55}pt;
  break-after: avoid;
}
h3 {
  font-family: ${FACE.data}; font-size: ${T.label}pt; font-weight: 600;
  letter-spacing: .04em; text-transform: uppercase; color: ${C.gold};
  margin: ${LEAD.base * 1.3}pt 0 ${LEAD.base * 0.45}pt; break-after: avoid;
}
em { font-style: italic; }
strong { font-weight: 600; }

/* ── Columns, where a page uses them ───────────────────────────────*/
.cols-2 { column-count: 2; column-gap: ${PAGE.gutter * 2}mm; }
.cols-2 > :first-child { margin-top: 0; }

/* ── Figures ───────────────────────────────────────────────────────
   Lining and tabular wherever a number must align with the number
   above it, which is every number in this book that is not inside a
   sentence. Both properties are set, because the two are not equivalent
   in every renderer and a money column that fails to align is worse
   than one set in the wrong style. */
.num, .tbl td, .tbl th {
  font-variant-numeric: tabular-nums lining-nums;
  font-feature-settings: 'kern' 1, 'tnum' 1, 'lnum' 1;
}
`;


// ════════════════════════════════════════════════════════════════════
// V · THE MASTER COMPOSITIONS
// ════════════════════════════════════════════════════════════════════
/*
 * Thirteen of them, and the point of having thirteen is that a reader
 * turning from page 20 to page 21 can SEE that the argument has moved.
 * The previous publication had one master repeated twenty times, which
 * is why forty pages of genuinely different material all looked the
 * same and none of it looked composed.
 *
 * Each master owns its whole page. None of them flows.
 */
export const masterCss = () => `
/* ── 01 · COVER ────────────────────────────────────────────────────
   TIGHTENED. The first version scattered four elements down the sheet
   with unstructured air between them. The title now sits on the
   optical centre — above the true centre, where a title is read — the
   period is tied to it by a hairline rather than floating, and the
   colophon is ruled off at the foot so the bottom third is a block
   rather than a drift. */
.m-cover { background: ${C.midnightDeep}; color: ${C.ivory}; }
.m-cover__frame { position: absolute; inset: 13mm; border: .4pt solid rgba(201,169,97,.34); }
.m-cover__mark { position: absolute; top: 33mm; left: 0; right: 0; text-align: center; }
.m-cover__mark .inscr { font-size: 9.6pt; letter-spacing: .07em; color: ${C.goldLeaf}; }
.m-cover__rule { position: absolute; top: 48mm; left: 50%; width: 22mm;
  margin-left: -11mm; height: 1pt; background: ${C.gold}; }
.m-cover__title { position: absolute; top: 108mm; left: 24mm; right: 24mm; text-align: center; }
.m-cover__title h1 {
  font-family: ${FACE.display}; font-weight: 300; font-size: 52pt; line-height: 57pt;
  margin: 0; color: ${C.ivory}; letter-spacing: -.008em;
}
.m-cover__title .sub {
  font-family: ${FACE.display}; font-style: italic; font-weight: 300;
  font-size: 16.5pt; line-height: 23pt; color: ${C.goldPale}; margin: 7mm 0 0;
}
/* The period is tied to the title by a hairline, not floating below it. */
.m-cover__period { position: absolute; top: 176mm; left: 0; right: 0; text-align: center; }
.m-cover__period::before {
  content: ''; display: block; width: 14mm; height: .5pt; margin: 0 auto 7mm;
  background: rgba(201,169,97,.52);
}
.m-cover__period span {
  font-family: ${FACE.inscription}; font-size: 12pt; letter-spacing: .06em;
  color: ${C.goldLeaf};
}
.m-cover__foot {
  position: absolute; bottom: 27mm; left: 34mm; right: 34mm; text-align: center;
  padding-top: 6mm; border-top: .4pt solid rgba(201,169,97,.22);
  font-family: ${FACE.data}; font-size: ${T.micro}pt; font-weight: 400;
  letter-spacing: .05em; text-transform: uppercase; color: rgba(252,250,245,.42);
  line-height: 13.4pt;
}

/* ── 02 · CHAPTER OPENER ───────────────────────────────────────────
   RECOMPOSED. The first version put the numeral in the top corner and
   the title at the foot, and left 40 per cent of the page empty
   between them — which is a hole, not space. Space is luxurious when
   something is holding it; two objects at opposite ends of a page are
   just far apart.

   The numeral is now enormous enough to BE the field: it bleeds off
   the outer edge and the top, so the eye reads it as the ground the
   title is set on rather than as a competing object. The title block
   rises to the optical third. */
.m-open__n {
  position: absolute; top: -26mm; right: -34mm;
  font-family: ${FACE.inscription}; font-weight: 400; font-size: 340pt;
  line-height: .74; color: ${C.goldPale}; opacity: .5; letter-spacing: -.045em;
  user-select: none; z-index: 0;
}
.pg--verso .m-open__n { left: -34mm; right: auto; }
/* Marked as deliberate bleed so the page-fit check does not mistake a
   numeral running off the trim for a page losing its last table row. */
.m-open__body { position: absolute; left: 0; right: 0; top: 47%; z-index: 2; }
.m-open__eyebrow {
  font-family: ${FACE.data}; font-size: ${T.micro}pt; font-weight: 600;
  letter-spacing: .05em; text-transform: uppercase; color: ${C.gold};
  margin: 0 0 4.5mm;
}
.m-open h1 {
  font-family: ${FACE.display}; font-weight: 300; font-size: ${T.title}pt;
  line-height: ${LEAD.title}pt; margin: 0 0 7mm; color: ${C.midnight};
  max-width: ${col(9)}mm; letter-spacing: -.008em;
}
.m-open__rubric {
  font-family: ${FACE.display}; font-style: italic; font-weight: 300;
  font-size: 15pt; line-height: 22.6pt; color: ${C.inkSoft};
  max-width: ${col(7)}mm; margin: 0;
}
/* The stats sit at the foot of the page, ruled, as a plinth. */
.m-open__stats { position: absolute; left: 0; right: 0; bottom: 0; z-index: 2;
  display: flex; gap: ${PAGE.gutter * 2}mm; }
.m-open__stat { flex: 1; border-top: 1.2pt solid ${C.gold}; padding-top: 3.6mm; }
.m-open__stat v {
  display: block; font-family: ${FACE.display}; font-weight: 400;
  font-size: 25pt; line-height: 27pt; color: ${C.midnight};
  font-variant-numeric: tabular-nums lining-nums;
}
.m-open__stat l {
  display: block; font-family: ${FACE.data}; font-size: ${T.micro}pt;
  font-weight: 500; letter-spacing: .04em; text-transform: uppercase;
  color: ${C.grey}; margin-top: 2.2mm; line-height: 10pt;
}

/* ── 03 · HERO METRIC ──────────────────────────────────────────────
   One number, and nothing competing with it. The gold rule beneath is
   not an underline; it is a measure — its width is set by the page,
   and the figure sits on it the way a monument sits on a plinth. */
.m-hero { background: ${C.bone}; }
.m-hero__wrap { position: absolute; top: 50%; left: 0; right: 0; transform: translateY(-54%); }
.m-hero__eyebrow {
  font-family: ${FACE.data}; font-size: ${T.label}pt; font-weight: 600;
  letter-spacing: .05em; text-transform: uppercase; color: ${C.gold}; margin: 0 0 7mm;
}
.m-hero__v {
  font-family: ${FACE.display}; font-weight: 300; font-size: ${T.monument}pt;
  line-height: .86; margin: 0; color: ${C.midnight};
  font-variant-numeric: tabular-nums lining-nums; letter-spacing: -.028em;
}
.m-hero__plinth { height: 1.6pt; background: ${C.gold}; margin: 8mm 0 7mm; width: ${col(7)}mm; }
.m-hero__say {
  font-family: ${FACE.display}; font-weight: 300; font-size: 19pt; line-height: 27pt;
  color: ${C.ink}; max-width: ${col(8)}mm; margin: 0 0 7mm;
}
.m-hero__note {
  font-family: ${FACE.text}; font-size: ${T.small}pt; line-height: 14pt;
  color: ${C.inkSoft}; max-width: ${col(7)}mm; margin: 0;
}

/* ── 04 · COLOUR FIELD — the full-bleed master ─────────────────────
   Where a photograph would be, if the College held one. It does not,
   and borrowing somebody else's library is a claim it cannot make. An
   inscription needs no photograph. */
.m-field { background: ${C.midnight}; color: ${C.ivory}; }
.m-field__rule { position: absolute; top: 62mm; left: ${PAGE.marginInner}mm;
  width: ${col(3)}mm; height: 1.4pt; background: ${C.gold}; }
.m-field__wrap { position: absolute; top: 50%; left: 0; right: 0; transform: translateY(-50%); }
.m-field__q {
  font-family: ${FACE.display}; font-weight: 300; font-size: 33pt; line-height: 44pt;
  color: ${C.ivory}; margin: 0; max-width: ${col(10)}mm; letter-spacing: -.006em;
}
.m-field__q em { font-style: italic; color: ${C.goldPale}; }
.m-field__attr {
  font-family: ${FACE.data}; font-size: ${T.micro}pt; font-weight: 500;
  letter-spacing: .05em; text-transform: uppercase; color: ${C.goldLeaf};
  margin: 13mm 0 0;
}

/* ── 05 · NARRATIVE ────────────────────────────────────────────────*/
.m-narr__head { margin-bottom: 9mm; }
.m-narr__head h2 { margin-top: 0; }
.m-narr__body { column-count: 2; column-gap: ${PAGE.gutter * 2}mm; text-align: justify;
  hyphens: auto; -webkit-hyphens: auto; }
.m-narr__body > :first-child { margin-top: 0; }
.m-narr--single .m-narr__body { column-count: 1; max-width: ${col(9)}mm; }

/* ── 06 · INSTITUTIONAL TABLE ──────────────────────────────────────
   Not a spreadsheet. No vertical rules, no fills behind every other
   row, generous leading, figures in tabular numerals, and a struck
   gold rule under the head. */
.tbl { width: 100%; border-collapse: collapse; font-family: ${FACE.data};
  font-size: ${T.small}pt; font-variant-numeric: tabular-nums lining-nums; }
.tbl caption { caption-side: top; text-align: left; padding: 0 0 5mm; }
.tbl caption b {
  display: block; font-family: ${FACE.display}; font-weight: 400;
  font-size: ${T.h3}pt; line-height: 21pt; color: ${C.midnight}; letter-spacing: 0;
}
.tbl caption i {
  display: block; font-family: ${FACE.display}; font-style: italic; font-weight: 300;
  font-size: 11pt; line-height: 16pt; color: ${C.grey}; margin-top: 1.4mm;
}
.tbl thead th {
  font-weight: 600; font-size: ${T.micro}pt; letter-spacing: .035em;
  text-transform: uppercase; color: ${C.grey}; text-align: right;
  padding: 0 0 2.6mm; border-bottom: 1.2pt solid ${C.gold}; vertical-align: bottom;
}
.tbl thead th:first-child { text-align: left; }
.tbl tbody td {
  padding: 3.1mm 0; border-bottom: .35pt solid ${C.ruleFaint};
  text-align: right; vertical-align: top; color: ${C.ink};
}
.tbl tbody td:first-child { text-align: left; font-weight: 500; color: ${C.midnight}; }
.tbl thead th + th, .tbl tbody td + td { padding-left: 5mm; }
.tbl tr.em td { font-weight: 600; color: ${C.midnight}; border-bottom: 1.2pt solid ${C.midnight}; }
.tbl tr.em td:first-child { font-weight: 700; }
.tbl .unit { font-family: ${FACE.text}; font-size: ${T.small}pt; text-align: left;
  font-weight: 400; color: ${C.inkSoft}; line-height: 14pt; }
.tbl__src {
  font-family: ${FACE.data}; font-size: ${T.micro}pt; line-height: 11pt;
  color: ${C.grey}; margin: 4.5mm 0 0; max-width: ${col(9)}mm;
}

/* ── 07 · DATA EDITORIAL ───────────────────────────────────────────*/
.m-data__head { margin-bottom: 7mm; }
.m-data__fig { margin: 0; }
.m-data__read {
  font-family: ${FACE.display}; font-weight: 300; font-size: 14pt; line-height: 21pt;
  color: ${C.ink}; max-width: ${col(8)}mm; margin: 8mm 0 0;
  border-top: .35pt solid ${C.rule}; padding-top: 5mm;
}

/* ── 08 · SPLIT SPREAD ─────────────────────────────────────────────*/
.m-split { display: flex; gap: ${PAGE.gutter * 2}mm; height: 100%; }
.m-split__l { width: ${col(5)}mm; flex: none; }
.m-split__r { flex: 1; }
.m-split--wide .m-split__l { width: ${col(7)}mm; }

/* ── 09 · ARCHITECTURE DIAGRAM ─────────────────────────────────────*/
.m-arch__row { display: flex; align-items: stretch; gap: 3mm; margin-bottom: 3mm; }
.m-arch__cell {
  flex: 1; padding: 5mm 5mm 5.5mm; background: ${C.ivory};
  border-top: 1.2pt solid ${C.gold};
}
.m-arch__cell h4 {
  margin: 0 0 2mm; font-family: ${FACE.data}; font-size: ${T.micro}pt;
  font-weight: 600; letter-spacing: .04em; text-transform: uppercase; color: ${C.gold};
}
.m-arch__cell p { margin: 0; font-size: ${T.small}pt; line-height: 14pt; color: ${C.inkSoft}; }
.m-arch__cell v { display: block; font-family: ${FACE.display}; font-size: 22pt;
  line-height: 25pt; color: ${C.midnight}; font-variant-numeric: tabular-nums; }

/* ── 10 · TIMELINE ─────────────────────────────────────────────────*/
.m-time { position: relative; }
.m-time__spine { position: absolute; left: 0; top: 0; bottom: 0; width: .35pt; background: ${C.rule}; }
.m-time__e { position: relative; padding: 0 0 9mm ${col(1)}mm; }
.m-time__e::before {
  content: ''; position: absolute; left: -1.5mm; top: 2.2mm;
  width: 3mm; height: 3mm; background: ${C.gold}; border-radius: 50%;
}
.m-time__y {
  font-family: ${FACE.inscription}; font-size: 11pt; letter-spacing: .04em;
  color: ${C.gold}; margin: 0 0 1.6mm;
}
.m-time__t {
  font-family: ${FACE.display}; font-size: ${T.h3}pt; line-height: 20pt;
  color: ${C.midnight}; margin: 0 0 2mm;
}
.m-time__d { font-size: ${T.small}pt; line-height: 14.5pt; color: ${C.inkSoft}; margin: 0;
  max-width: ${col(7)}mm; }

/* ── 11 · FINANCIAL ARCHITECTURE ───────────────────────────────────
   The allocation drawn as a structure rather than a pie. A pie chart
   of six near-equal shares is unreadable and says nothing; a stacked
   architectural column says which lines are spent and which are kept,
   which is the whole of the framework. */
/* STRETCH, NOT FLEX-START. With flex-start the key column is only as
   tall as its own paragraphs, so anything placed at its foot lands in
   the middle of the page on top of the text — which is what happened,
   and which the page-fit check could not see, because an overlap is
   not an overflow. */
.m-alloc { display: flex; gap: ${PAGE.gutter * 2}mm; align-items: stretch; }
.m-alloc__col { width: ${col(3)}mm; flex: none; }
.m-alloc__seg { position: relative; color: ${C.ivory}; padding: 3.4mm 4mm;
  font-family: ${FACE.data}; }
.m-alloc__seg b { display: block; font-size: ${T.label}pt; font-weight: 600; letter-spacing: .04em; }
.m-alloc__seg s { display: block; text-decoration: none; font-size: ${T.micro}pt;
  letter-spacing: .04em; opacity: .74; margin-top: .8mm; }
/* A band too shallow for two lines sets them on one. */
.m-alloc__seg--tight { display: flex; align-items: baseline; gap: 3mm; padding-top: 2.2mm; }
.m-alloc__seg--tight s { margin-top: 0; }
/* The struck rule that divides what is spent from what is kept. It is
   the whole point of the diagram and the first proof did not draw it. */
.m-alloc__seg--kept:first-of-type { box-shadow: none; }
.m-alloc__seg--kept { border-top: 0; }
.m-alloc__col .m-alloc__seg--kept:nth-of-type(5) { border-top: 1.6pt solid ${C.paper}; }
.m-alloc__key { flex: 1; }
.m-alloc__row { display: flex; gap: 4mm; padding: 2.1mm 0; border-bottom: .35pt solid ${C.ruleFaint}; }
.m-alloc__row:last-child { border-bottom: 0; }
.m-alloc__swatch { width: 3mm; flex: none; margin-top: 1.2mm; height: 3mm; }
.m-alloc__row h4 { margin: 0 0 0.9mm; font-family: ${FACE.data}; font-size: ${T.label}pt;
  font-weight: 600; color: ${C.midnight}; }
.m-alloc__row p { margin: 0; font-size: ${T.caption}pt; line-height: 11.8pt; color: ${C.inkSoft}; }
.m-alloc__pct { font-family: ${FACE.display}; font-size: 17pt; color: ${C.midnight};
  font-variant-numeric: tabular-nums; margin-left: auto; padding-left: 4mm; }

/* ── 12 · PROPOSITION — a wall inscription ─────────────────────────*/
.m-prop { background: ${C.bone}; }
.m-prop__wrap { position: absolute; top: 50%; left: 0; right: 0; transform: translateY(-52%); }
.m-prop__mark { width: ${col(2)}mm; height: 1.4pt; background: ${C.gold}; margin: 0 0 11mm; }
.m-prop__t {
  font-family: ${FACE.display}; font-weight: 300; font-size: 30pt; line-height: 41pt;
  color: ${C.midnight}; margin: 0; max-width: ${col(10)}mm;
}
.m-prop__t em { font-style: italic; color: ${C.gold}; }
.m-prop__a { font-family: ${FACE.data}; font-size: ${T.micro}pt; font-weight: 500;
  letter-spacing: .05em; text-transform: uppercase; color: ${C.grey}; margin: 12mm 0 0; }

/* ── 13 · CLASSIFICATION MARKS ─────────────────────────────────────
   Small, set in the technical face, and never a warning box. A board
   paper that shouts its own caveats has stopped being read. */
.mark {
  display: inline-block; font-family: ${FACE.data}; font-size: ${T.micro}pt;
  font-weight: 600; letter-spacing: .04em; text-transform: uppercase;
  padding: .9mm 2.4mm .8mm; border: .5pt solid currentColor; white-space: nowrap;
  vertical-align: .12em;
}
.mark--verified { color: ${C.sage}; }
.mark--modelled { color: ${C.grey}; }
.mark--board { color: ${C.crimson}; }
.mark--proposed { color: ${C.gold}; }
`;

// ════════════════════════════════════════════════════════════════════
// VI · THE BUILDERS
// ════════════════════════════════════════════════════════════════════

export const esc = (v) => String(v).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');

let folio = 0;
export const resetFolios = () => { folio = 0; };
/** What the NEXT page will be. A bound book opens a chapter on a
 *  right-hand page, and a renderer that does not know which side it is
 *  about to compose cannot honour that. */
export const nextIsRecto = () => folio % 2 === 0;
/** The folio just composed. The contents page needs it. */
export const folioNow = () => folio;
/** Count a page that carries no folio — the cover. Without this the
 *  cover sat outside the sequence and every recto after it was a
 *  verso, which put the first chapter opener on the wrong side of the
 *  book. */
export const countUnfoliated = () => { folio += 1; };
/**
 * THE VERSO THAT THROWS A CHAPTER ONTO A RECTO.
 *
 * It used to be blank, on the argument that a blank verso before a
 * chapter opening is how books have been made for five hundred years.
 * That is true of a printed book, where the reader feels the paper and
 * the blank reads as a breath. In a PDF read on a screen a blank page
 * reads as a fault — three of them in forty-two pages, and a reviewer
 * counts them as pages nobody bothered to design.
 *
 * So it carries a BASTARD TITLE instead: the part's name, set small and
 * quiet in the inscriptional face, with the hairline above it. Also a
 * five-hundred-year-old device, and one that says the pause is
 * deliberate.
 */
export const halfTitle = (name) => {
  folio += 1;
  return `<section class="pg pg--verso pg--bone m-half">
    <div class="m-half__wrap">
      <div class="m-half__rule"></div>
      <p class="m-half__t">${esc(name || '')}</p>
    </div>
  </section>`;
};
/** Kept for a genuinely empty leaf, which this book no longer has. */
export const blankVerso = () => { folio += 1; return `<section class="pg pg--verso"></section>`; };

/**
 * A page. `side` alternates automatically so the margins mirror, which
 * is the difference between a bound book and a stack of sheets.
 */
export function page(inner, opts = {}) {
  const { tone = '', runhead = '', bare = false, klass = '', full = false, ground = '' } = opts;
  folio += 1;
  const verso = folio % 2 === 0;
  /* A full-bleed page has no field. A photograph inset inside the text
     margins is an illustration; a photograph running to the trim is a
     plate, and the difference is most of what makes a book feel
     printed rather than typed. */
  const body = full ? inner
    : `<div class="pg__field${opts.stack ? ' pg__field--stack' : ''}">${inner}</div>`;
  /* A GROUND IS NOT CONTENT. An engraved ruling that bleeds off the
     trim belongs to the sheet, not to the text block — put inside the
     field it inflates the field's own height by however far it bleeds,
     and the page-fit check then reports a perfectly composed page as
     losing 121px of content it never had. */
  return `<section class="pg ${verso ? 'pg--verso' : 'pg--recto'} ${tone} ${klass}">
  ${ground}
  ${bare ? '' : (runhead ? `<div class="runhead">${esc(runhead)}</div>` : '')}
  ${body}
  ${bare ? '' : `<div class="folio num">${String(folio).padStart(2, '0')}</div>`}
</section>`;
}

export const mark = (kind) => {
  const m = {
    verified: ['VERIFIED', 'verified'],
    modelled: ['MODELLED', 'modelled'],
    board: ['BOARD DECISION REQUIRED', 'board'],
    proposed: ['PROPOSED — NOT ADOPTED', 'proposed'],
    insufficient: ['INSUFFICIENT DIRECT EVIDENCE', 'modelled'],
  }[kind] || ['MODELLED', 'modelled'];
  return `<span class="mark mark--${m[1]}">${m[0]}</span>`;
};

/** 02 · Chapter opener. */
export function chapterOpener({ n, eyebrow, title, rubric, stats = [] }) {
  return page(`
    <div class="m-open__n bleed">${esc(n)}</div>
    <div class="m-open__body">
      ${eyebrow ? `<p class="m-open__eyebrow">${esc(eyebrow)}</p>` : ''}
      <h1>${title}</h1>
      ${rubric ? `<p class="m-open__rubric">${rubric}</p>` : ''}
    </div>
    ${stats.length ? `<div class="m-open__stats">${stats.map((s) => `
      <div class="m-open__stat"><v>${s.v}</v><l>${esc(s.l)}</l></div>`).join('')}</div>` : ''}`,
  { klass: 'm-open', bare: true });
}

/** 03 · Hero metric. */
export function heroMetric({ eyebrow, value, say, note, runhead }) {
  return page(`
    <div class="m-hero__wrap">
      <p class="m-hero__eyebrow">${esc(eyebrow)}</p>
      <p class="m-hero__v">${value}</p>
      <div class="m-hero__plinth"></div>
      <p class="m-hero__say">${say}</p>
      ${note ? `<p class="m-hero__note">${note}</p>` : ''}
    </div>`, { tone: 'm-hero', runhead });
}

/** 04 · Colour field. */
export function colourField({ quote, attribution, runhead }) {
  return page(`
    <div class="m-field__rule"></div>
    <div class="m-field__wrap">
      <p class="m-field__q">${quote}</p>
      ${attribution ? `<p class="m-field__attr">${esc(attribution)}</p>` : ''}
    </div>`, { tone: 'pg--dark m-field', runhead });
}

/** 05 · Narrative. */
export function narrative({ head, body, runhead, single = false, tone = '' }) {
  return page(`
    ${head ? `<div class="m-narr__head">${head}</div>` : ''}
    <div class="m-narr__body">${body}</div>`,
  { klass: `m-narr ${single ? 'm-narr--single' : ''}`, runhead, tone });
}

/** 06 · Institutional table. */
export function table({ title, sub, head, rows, source }) {
  const cell = (c, tag) => (typeof c === 'object' && c !== null)
    ? `<${tag}${c.cls ? ` class="${c.cls}"` : ''}>${c.v}</${tag}>`
    : `<${tag}>${c}</${tag}>`;
  return `<table class="tbl">
  <caption><b>${esc(title)}</b>${sub ? `<i>${esc(sub)}</i>` : ''}</caption>
  <thead><tr>${head.map((h) => `<th>${esc(h)}</th>`).join('')}</tr></thead>
  <tbody>${rows.map((r) => {
    const cells = Array.isArray(r) ? r : r.cells;
    const cls = (!Array.isArray(r) && r.em) ? ' class="em"' : '';
    return `<tr${cls}>${cells.map((c) => cell(c, 'td')).join('')}</tr>`;
  }).join('')}</tbody>
</table>${source ? `<p class="tbl__src">${source}</p>` : ''}`;
}

/** 12 · Proposition. */
export function proposition({ text, attribution, runhead }) {
  return page(`
    <div class="m-prop__wrap">
      <div class="m-prop__mark"></div>
      <p class="m-prop__t">${text}</p>
      ${attribution ? `<p class="m-prop__a">${esc(attribution)}</p>` : ''}
    </div>`, { tone: 'm-prop', runhead });
}

// ════════════════════════════════════════════════════════════════════
// VII · THE REMAINING MASTERS
// ════════════════════════════════════════════════════════════════════

export const masterCssTwo = () => `
/* ── 14 · PART OPENER ──────────────────────────────────────────────
   Above a chapter. Six of these divide the book, and they are set on
   midnight so that turning to one is unmistakable — the reader should
   feel a section end without reading a word. */
.m-part { background: ${C.midnight}; color: ${C.ivory}; }
.m-part__n {
  font-family: ${FACE.inscription}; font-size: 13pt; letter-spacing: .06em;
  color: ${C.goldLeaf}; margin: 0 0 8mm;
}
.m-part__rule { width: ${col(2)}mm; height: 1.4pt; background: ${C.gold}; margin: 0 0 12mm; }
.m-part__wrap { position: absolute; top: 46%; left: 0; right: 0; transform: translateY(-50%); }
.m-part h1 {
  font-family: ${FACE.display}; font-weight: 300; font-size: 50pt; line-height: 54pt;
  margin: 0 0 9mm; color: ${C.ivory}; max-width: ${col(9)}mm; letter-spacing: -.01em;
}
.m-part__say {
  font-family: ${FACE.display}; font-style: italic; font-weight: 300;
  font-size: 16pt; line-height: 24pt; color: ${C.goldPale};
  max-width: ${col(7)}mm; margin: 0;
}
.m-part__list {
  position: absolute; left: 0; right: 0; bottom: 0;
  border-top: .5pt solid rgba(201,169,97,.3); padding-top: 5mm;
  font-family: ${FACE.data}; font-size: ${T.micro}pt; font-weight: 500;
  letter-spacing: .04em; text-transform: uppercase; color: rgba(252,250,245,.5);
  line-height: 14pt; columns: 2; column-gap: ${PAGE.gutter * 2}mm;
}

/* ── 15 · CONTENTS ─────────────────────────────────────────────────*/
.m-toc h1 {
  font-family: ${FACE.display}; font-weight: 300; font-size: 31pt; line-height: 34pt;
  margin: 0 0 7mm; color: ${C.midnight};
}
.m-toc__part {
  font-family: ${FACE.inscription}; font-size: 8.4pt; letter-spacing: .05em;
  color: ${C.gold}; margin: 5mm 0 2mm; padding-top: 2.2mm;
  border-top: .9pt solid ${C.gold};
}
.m-toc__part:first-of-type { margin-top: 0; }
.m-toc__row { display: flex; align-items: baseline; gap: 3mm; padding: 0.9mm 0; }
.m-toc__row t { flex: none; font-family: ${FACE.text}; font-size: ${T.base}pt; color: ${C.ink}; }
.m-toc__row d { flex: 1; border-bottom: .35pt dotted ${C.rule}; transform: translateY(-1mm); }
.m-toc__row f { flex: none; font-family: ${FACE.data}; font-size: ${T.small}pt;
  color: ${C.grey}; font-variant-numeric: tabular-nums; }

/* ── 16 · TIMELINE ─────────────────────────────────────────────────
   Vertical, because five phases with three lines of text each read as
   a list when set horizontally and as a chronology when set down the
   page. The spine is a hairline and the markers are struck gold. */
.m-time { position: relative; padding-left: ${col(1)}mm; }
.m-time__spine { position: absolute; left: 1.4mm; top: 3mm; bottom: 6mm; width: .4pt; background: ${C.rule}; }
.m-time__e { position: relative; padding: 0 0 7.5mm 0; }
.m-time__e:last-child { padding-bottom: 0; }
.m-time__e::before {
  content: ''; position: absolute; left: ${-col(1)}mm; top: 2.6mm;
  width: 3.2mm; height: 3.2mm; background: ${C.gold}; border-radius: 50%;
  box-shadow: 0 0 0 1.6mm ${C.paper};
}
.m-time__h { display: flex; align-items: baseline; gap: 4mm; margin: 0 0 1.8mm; }
.m-time__h n {
  font-family: ${FACE.inscription}; font-size: 10.5pt; letter-spacing: .045em; color: ${C.gold};
}
.m-time__h t {
  font-family: ${FACE.display}; font-size: ${T.h3}pt; line-height: 19pt; color: ${C.midnight};
}
.m-time__h y {
  margin-left: auto; font-family: ${FACE.data}; font-size: ${T.micro}pt; font-weight: 500;
  letter-spacing: .04em; text-transform: uppercase; color: ${C.grey};
}
.m-time__d { font-size: ${T.small}pt; line-height: 14.6pt; color: ${C.inkSoft}; margin: 0 0 2mm;
  max-width: ${col(9)}mm; }
.m-time__f {
  font-family: ${FACE.data}; font-size: ${T.micro}pt; font-weight: 600; letter-spacing: .035em;
  color: ${C.midnight}; font-variant-numeric: tabular-nums; margin: 0;
}

/* ── 17 · THE COLOPHON ─────────────────────────────────────────────*/
.m-colo { background: ${C.midnightDeep}; color: rgba(252,250,245,.72); }
.m-colo__wrap { position: absolute; left: 0; right: 0; bottom: 0; }
.m-colo h2 {
  font-family: ${FACE.display}; font-weight: 300; font-size: 26pt; line-height: 32pt;
  color: ${C.ivory}; margin: 0 0 7mm;
}
.m-colo p { font-size: ${T.small}pt; line-height: 15pt; max-width: ${col(7)}mm;
  color: rgba(252,250,245,.66); }
.m-colo .rule-hair { background: rgba(201,169,97,.3); margin: 8mm 0 6mm; }
.m-colo__meta { font-family: ${FACE.data}; font-size: ${T.micro}pt; letter-spacing: .04em;
  text-transform: uppercase; color: rgba(201,169,97,.7); line-height: 13pt; }

/* ── THE BASTARD TITLE ─────────────────────────────────────────────*/
.m-half__wrap { position: absolute; top: 46%; left: ${PAGE.marginOuter}mm; right: ${PAGE.marginInner}mm;
  transform: translateY(-50%); text-align: center; }
.m-half__rule { width: 14mm; height: .6pt; background: ${C.gold}; margin: 0 auto 7mm; }
.m-half__t { font-family: ${FACE.inscription}; font-size: 9.6pt; letter-spacing: .06em;
  color: ${C.grey}; margin: 0; }

/* ── A TABLE WITH ITS READING ──────────────────────────────────────
   A short schedule floating at the top of a page with two thirds of
   white beneath it is not restraint, it is an unfinished page. The
   reading sits under the rule and gives the table a foot to stand on. */
.rd { margin-top: auto; padding-top: 6mm; border-top: .9pt solid ${C.gold}; }
.rd h4 { font-family: ${FACE.data}; font-size: 5.6pt; font-weight: 600; letter-spacing: .05em;
  text-transform: uppercase; color: ${C.gold}; margin: 0 0 2.6mm; }
.rd p { font-family: ${FACE.text}; font-size: ${T.small}pt; line-height: 15.4pt;
  color: ${C.inkSoft}; margin: 0 0 3mm; max-width: ${col(9)}mm; }
.rd p:last-child { margin-bottom: 0; }
.rd--col { column-count: 2; column-gap: ${PAGE.gutter * 2}mm; }
.pg__field--stack { display: flex; flex-direction: column; }

/* A continued table carries its title once and says so thereafter. */
.tbl__cont { font-family: ${FACE.data}; font-size: ${T.micro}pt; letter-spacing: .04em;
  text-transform: uppercase; color: ${C.grey}; margin: 0 0 4mm; }
`;

/** 14 · Part opener. Always on a recto; the caller arranges that. */
export function partOpener({ numeral, title, say, contents = [] }) {
  return page(`
    <div class="m-part__wrap">
      <p class="m-part__n">${esc(numeral)}</p>
      <div class="m-part__rule"></div>
      <h1>${title}</h1>
      ${say ? `<p class="m-part__say">${say}</p>` : ''}
    </div>
    ${contents.length ? `<div class="m-part__list">${contents.map((c) => `<div>${esc(c)}</div>`).join('')}</div>` : ''}`,
  { tone: 'pg--dark m-part', bare: true });
}

/** 15 · Contents. */
export function contents({ title, parts }) {
  return page(`
    <h1>${esc(title)}</h1>
    ${parts.map((p) => `
      <div class="m-toc__part">${esc(p.part)}</div>
      ${p.rows.map((r) => `<div class="m-toc__row"><t>${esc(r.t)}</t><d></d><f>${String(r.f).padStart(2, '0')}</f></div>`).join('')}
    `).join('')}`, { klass: 'm-toc', runhead: 'Contents' });
}

/** 16 · Timeline. */
export function timeline(entries) {
  return `<div class="m-time"><div class="m-time__spine"></div>
    ${entries.map((e) => `<div class="m-time__e">
      <div class="m-time__h"><n>${esc(e.numeral)}</n><t>${esc(e.name)}</t><y>Years ${esc(e.years)}</y></div>
      <p class="m-time__d">${esc(e.text)}</p>
      ${e.figure ? `<p class="m-time__f">${e.figure}</p>` : ''}
    </div>`).join('')}
  </div>`;
}

/**
 * A LONG TABLE, CHUNKED RATHER THAN FLOWED.
 *
 * A twenty-row register does not fit a page and must not be allowed to
 * decide for itself where it breaks. `rowsPerPage` is a composition
 * decision, and the continuation pages say they are continuations
 * instead of appearing to start a new table.
 */
export function tablePages(spec, rowsPerPage, opts = {}) {
  const out = [];
  for (let i = 0; i < spec.rows.length; i += rowsPerPage) {
    const part = spec.rows.slice(i, i + rowsPerPage);
    const first = i === 0;
    out.push(page(`
      ${first ? '' : `<p class="tbl__cont">${esc(spec.title)} &mdash; continued</p>`}
      ${table({ ...spec, title: first ? spec.title : '', sub: first ? spec.sub : '',
    rows: part, source: (i + rowsPerPage >= spec.rows.length) ? spec.source : '' })}`,
    { runhead: opts.runhead, tone: opts.tone || '' }));
  }
  return out;
}
