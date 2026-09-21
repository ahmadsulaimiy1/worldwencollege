/**
 * THE SPREAD LAYER — because a book is composed in twos, not ones.
 *
 * ════════════════════════════════════════════════════════════════════
 * WHAT THIS REPLACES, AND WHY THE LAST VERSION FAILED
 * ════════════════════════════════════════════════════════════════════
 * The previous system's unit was `page(content)`. Content was poured
 * into a page, the page was pushed onto a list, and the list became a
 * book. Nothing in that system could express the only relationship that
 * makes a publication a publication: WHAT A PAGE IS FACING.
 *
 * The result was visible and the owner named it exactly — chapter cover,
 * sparse page, table, sparse page, chapter cover, over and over, with
 * three devices doing all the work: a navy field, a gold rule, a serif
 * heading. Repeated seven times, a device stops being art direction and
 * becomes a template.
 *
 * NO GRAPHICS. Forty-one pages about the economics of an institution,
 * and every quantity in them set as a table. See figures.mjs.
 *
 * ════════════════════════════════════════════════════════════════════
 * AND THEN THE PHOTOGRAPHS CAME OUT AGAIN
 * ════════════════════════════════════════════════════════════════════
 * An intermediate version of this file answered the emptiness with
 * eleven licence-cleared photographs and opened all seven chapters on
 * one: Westminster for the proposition, a reading hall for the
 * institution, an old map for the market, a letterpress for commerce,
 * an astrolabe for the decade, a manuscript for method. The owner
 * ruled them out on 20 September 2026, and the reasoning is worth
 * keeping because it is the whole design argument of the book:
 *
 *   the metaphors were legible but unnecessary — London does not need
 *   a photograph of London, education does not need a library, a
 *   market does not need a map — and seven of them in a row made the
 *   publication read as a luxury strategy report rather than as an
 *   institution's intellectual architecture.
 *
 * The plate machinery is therefore GONE from this file rather than
 * left unused, so that "there is already a platePage()" can never be
 * the reason a photograph comes back. What opens a chapter now is the
 * chapter's own content, drawn — see openers.mjs — and the rule is
 * absolute: if a page only looks composed because a picture is filling
 * it, the page has failed and the composition is what gets fixed.
 *
 * ════════════════════════════════════════════════════════════════════
 * THE RULE THIS FILE ENFORCES
 * ════════════════════════════════════════════════════════════════════
 * A spread has ONE dominant idea and a reason for its composition, and
 * the two pages are built together or not at all. `spread()` therefore
 * takes both sides at once and refuses to be given only one.
 */

import * as M from './monograph.mjs';
import { readFileSync } from 'node:fs';
import path from 'node:path';

const ROOT = path.resolve(new URL('../..', import.meta.url).pathname);
export const C = M.C;
export const FACE = M.FACE;

/** An engraved plate from assets/art, inlined as markup so its strokes
 *  take the page's own colour rather than arriving as a flat picture. */
export const engraving = (name) => readFileSync(path.join(ROOT, `assets/art/${name}.svg`), 'utf8')
  .replace(/<\?xml[^>]*\?>/, '')
  .replace(/<!--[\s\S]*?-->/g, '');

export const spreadCss = () => `
/* ════════════════════════════════════════════════════════════════════
   MATERIALITY
   ════════════════════════════════════════════════════════════════════
   The brief is controlled magnificence, and magnificence in print is
   not a colour — it is a SURFACE. A cover feels expensive because
   light does something different where the foil is, because the blind
   emboss catches a shadow, because the stock is warm and the ink sits
   on it rather than in it.

   None of that survives being faked. A bevel, a drop shadow, a glow or
   a rainbow gradient reads instantly as a template pretending, which
   is the one outcome forbidden here. So the three treatments below are
   the only ones in the book, they are physically motivated, and each
   is allowed exactly where the thing it imitates would actually be:

     .foil    a struck gold gradient, in the direction of a single
              light, clipped to the glyphs. Display sizes only — foil
              is stamped on a title, never on a paragraph.
     .emboss  a blind impression: one hairline of light above, one of
              shadow below, no fill. Ivory and cream grounds only,
              because you cannot deboss a dark field.
     .field   a sapphire ground lit from one corner, the way a bound
              cover is lit. One light source, never two.

   Anything beyond these three is ornament for its own sake, and the
   composition is supposed to be doing that work. */
.foil {
  background-image: linear-gradient(101deg,
    ${C.bronzeDeep} 0%, ${C.bronze} 11%, ${C.goldRich} 27%, ${C.goldSpec} 41%,
    ${C.goldLeaf} 52%, ${C.goldRich} 66%, ${C.gold} 80%, ${C.bronze} 93%, ${C.bronzeDeep} 100%);
  -webkit-background-clip: text; background-clip: text;
  -webkit-text-fill-color: transparent; color: transparent;
}
/* On a deep field the metal is struck brighter and the shadow steps
   are pulled up, because a ramp that runs to bronze on midnight reads
   as a dirty mark rather than as gold catching light. */
.pg--sapphire .foil, .pg--deep .foil {
  background-image: linear-gradient(101deg,
    ${C.bronze} 0%, ${C.goldRich} 14%, ${C.goldLeaf} 28%, #FFF8E4 42%,
    ${C.goldSpec} 54%, ${C.goldLeaf} 68%, ${C.goldRich} 84%, ${C.gold} 100%);
}
.emboss { color: ${C.cream}; text-shadow: 0 -.35pt 0 rgba(255,255,255,.92), 0 .45pt .4pt rgba(140,106,63,.42); }

/* ════════════════════════════════════════════════════════════════════
   THE PALETTES — one identity, eight combinations
   ════════════════════════════════════════════════════════════════════
   A publication that uses its primary colour everywhere has a brand
   colour, not a visual identity. Sapphire is the institution's
   architecture; it is not the whole of its material.

   So the book carries EIGHT named combinations, one per part plus the
   charter, each drawn from the same ecosystem and each with a
   different temperature and a different job. A reader moving through
   the book should feel the register change at every part opening
   without ever losing the sense that it is one institution.

     authority   sapphire · fresh gold · pearl      the signature
     heritage    ivory · bronze · sapphire          intellectual depth
     luminous    pearl · champagne · sapphire       analytical clarity
     ceremonial  sapphire · garnet · gold           strategy and decision
     constitution deep sapphire · gold · champagne  the financial law
     editorial   cream · champagne · sapphire       long-form reading
     scholarly   ivory · bronze · charcoal          method and sources
     sovereign   deep sapphire · garnet · gold      the charter

   They are CSS custom properties rather than eight copies of the page
   masters, so a palette is applied by putting one class on the page
   and every rule, mark, ground and ink follows it. Adding a ninth is
   eleven lines; forking a stylesheet to get one would have been three
   hundred.
   ──────────────────────────────────────────────────────────────────── */
.pal { --ground: ${C.pearl}; --ink: ${C.ink}; --title: ${C.sapphire};
  --rule: ${C.rule}; --mark: ${C.goldDeep}; --soft: ${C.grey}; --accent: ${C.sapphire};
  background: var(--ground); }
.pal--authority   { --ground: ${C.sapphire};     --ink: ${C.onSapphire}; --title: ${C.onSapphire};
  --rule: rgba(235,201,111,.42); --mark: ${C.goldLeaf};   --soft: rgba(244,241,232,.68); --accent: ${C.champagne}; }
.pal--heritage    { --ground: ${C.ivory};        --ink: ${C.ink};        --title: ${C.bronzeDeep};
  --rule: #DCC9A6;               --mark: ${C.bronze};     --soft: #8A7A62;                --accent: ${C.sapphire}; }
.pal--luminous    { --ground: ${C.pearl};        --ink: ${C.ink};        --title: ${C.sapphire};
  --rule: ${C.rule};             --mark: ${C.goldDeep};   --soft: ${C.grey};              --accent: ${C.champagneDeep}; }
.pal--ceremonial  { --ground: ${C.sapphire};     --ink: ${C.onSapphire}; --title: ${C.onSapphire};
  --rule: rgba(235,201,111,.38); --mark: ${C.goldLeaf};   --soft: rgba(244,241,232,.66); --accent: #C9576B; }
.pal--constitution{ --ground: ${C.sapphireDeep}; --ink: ${C.onSapphire}; --title: ${C.onSapphire};
  --rule: rgba(235,201,111,.34); --mark: ${C.goldRich};   --soft: rgba(244,241,232,.62); --accent: ${C.champagne}; }
.pal--editorial   { --ground: ${C.cream};        --ink: ${C.ink};        --title: ${C.sapphireMid};
  --rule: #DFD0AE;               --mark: ${C.goldDeep};   --soft: #8A8168;                --accent: ${C.champagneDeep}; }
.pal--scholarly   { --ground: ${C.ivory};        --ink: ${C.ink};        --title: ${C.ink};
  --rule: #DCC9A6;               --mark: ${C.bronzeDeep}; --soft: #8A7A62;                --accent: ${C.bronze}; }
.pal--sovereign   { --ground: ${C.sapphireDeep}; --ink: ${C.onSapphire}; --title: ${C.onSapphire};
  --rule: rgba(235,201,111,.40); --mark: ${C.goldRich};   --soft: rgba(244,241,232,.66); --accent: #C9576B; }

/* A palette on a deep ground lights the page the way a bound cover is
   lit, and lifts the running furniture into the metals. */
.pal--authority::before, .pal--ceremonial::before,
.pal--constitution::before, .pal--sovereign::before {
  content: ''; position: absolute; inset: 0; pointer-events: none;
  background:
    radial-gradient(120% 90% at 78% 6%, rgba(126,172,255,.22), transparent 60%),
    linear-gradient(to right, rgba(3,9,26,.36), transparent 32%);
}
.pg--verso.pal--authority::before, .pg--verso.pal--ceremonial::before,
.pg--verso.pal--constitution::before, .pg--verso.pal--sovereign::before {
  background:
    radial-gradient(120% 90% at 22% 6%, rgba(126,172,255,.22), transparent 60%),
    linear-gradient(to left, rgba(3,9,26,.36), transparent 32%);
}
.pal .runhead, .pal .folio { color: var(--soft); }

/* ── THE SAPPHIRE FIELD ────────────────────────────────────────────
   Lit from the upper outer corner, once. The second gradient is not a
   second light: it is the fall-off at the gutter, which is where a
   bound page goes dark. */
.pg--sapphire { background: ${C.sapphire}; color: ${C.onSapphire}; }
.pg--deep { background: ${C.sapphireDeep}; color: ${C.onSapphire}; }
.pg--sapphire::before, .pg--deep::before {
  content: ''; position: absolute; inset: 0; pointer-events: none;
  background:
    radial-gradient(120% 90% at 78% 8%, rgba(120,168,255,.20), transparent 62%),
    linear-gradient(to right, rgba(3,9,26,.34), transparent 34%);
}
.pg--verso.pg--sapphire::before, .pg--verso.pg--deep::before {
  background:
    radial-gradient(120% 90% at 22% 8%, rgba(120,168,255,.20), transparent 62%),
    linear-gradient(to left, rgba(3,9,26,.34), transparent 34%);
}
.pg--sapphire .runhead, .pg--deep .runhead,
.pg--sapphire .folio, .pg--deep .folio { color: ${C.onSapphireSoft}; }
.pg--ivory { background: ${C.ivory}; }
.pg--cream { background: ${C.cream}; }
.pg--pearl { background: ${C.pearl}; }

/* ── ENGRAVED PLATES ───────────────────────────────────────────────
   The house's own prospectus line work. Strokes are recoloured to the
   page rather than left at their web values, so a plate sits in the
   book instead of on it. */
.engr { position: relative; }
.engr svg { display: block; width: 100%; height: auto; }
.engr--gold svg [stroke] { stroke: ${C.gold} !important; }
.engr--ink svg [stroke] { stroke: ${C.midnight} !important; }
.engr--pale svg [stroke] { stroke: rgba(201,169,97,.55) !important; }
.engr--ivory svg [stroke] { stroke: rgba(252,250,245,.42) !important; }

/* ── THE COLOPHON'S LEGEND ─────────────────────────────────────────
   The three classification marks were set INLINE in a sentence, and a
   boxed, ruled, small-caps mark inside running prose breaks the line
   it sits in: the paragraph came out in four ragged fragments with a
   box at the head of three of them. They are a legend, so they are set
   as one. */
.m-colo__key { margin: 6mm 0 0; }
.m-colo__key div { display: flex; align-items: baseline; gap: 4mm; padding: 2.2mm 0;
  border-top: .35pt solid rgba(252,250,245,.16); }
.m-colo__key span { flex: none; width: ${M.col(3)}mm; }
.m-colo__key p { margin: 0; font-family: ${FACE.text}; font-size: ${M.T.caption}pt;
  line-height: 12pt; color: rgba(252,250,245,.64); }

/* ── THE SPECIFICATION ─────────────────────────────────────────────
   A ruled key-and-value register, read the way the specification panel
   of a drawing is read. It is what the frontispiece carries now that
   it no longer carries a photograph of a manuscript, and it is a
   better frontispiece: a reader who opens the book learns what the
   institution IS before being told what it argues. */
.sp { margin: 0; }
.sp__t { font-family: ${FACE.data}; font-size: 5.6pt; font-weight: 600; letter-spacing: .05em;
  text-transform: uppercase; color: ${C.gold}; margin: 0 0 4mm;
  padding-bottom: 3mm; border-bottom: 1.4pt solid ${C.midnight}; }
.sp__r { display: flex; gap: ${M.PAGE.gutter * 2}mm; align-items: baseline;
  padding: 3.2mm 0; border-bottom: .35pt solid ${C.ruleFaint}; }
.sp__r k { flex: none; width: ${M.col(3)}mm; font-family: ${FACE.data}; font-size: 5.4pt;
  font-weight: 600; letter-spacing: .045em; text-transform: uppercase; color: ${C.grey};
  line-height: 9.4pt; }
.sp__r v { flex: 1; font-family: ${FACE.text}; font-size: ${M.T.small}pt; line-height: 14.4pt;
  color: ${C.ink}; }
.sp__r v em { font-style: italic; color: ${C.inkSoft}; }
.sp__r--struck { border-bottom-color: ${C.gold}; border-bottom-width: .9pt; }

/* ── THE FIGURE, AS AN OBJECT ON THE PAGE ──────────────────────────
   A PLATE AND ITS READING, SIDE BY SIDE.

   The plate is about 77mm across — that is what makes its labels come
   out at eight points instead of eighteen — and a 77mm drawing alone
   in a 175mm field leaves three fifths of the page white. So the page
   is built as two columns: the drawing in one and what it is FOR in
   the other. It is also simply the better page. A chart with its
   argument beside it is read; a chart with a one-line caption under it
   is looked at. */
.fg { margin: 0; height: 100%; display: flex; flex-direction: column; }
.fg__eye { font-family: ${FACE.data}; font-size: 5.6pt; font-weight: 600;
  letter-spacing: .05em; text-transform: uppercase; color: ${C.gold}; margin: 0 0 2.4mm; }
.fg__t { font-family: ${FACE.display}; font-weight: 400; font-size: 17.4pt; line-height: 22pt;
  color: ${C.midnight}; margin: 0 0 1.6mm; letter-spacing: -.012em; }
.fg__s { font-family: ${FACE.display}; font-style: italic; font-weight: 400;
  font-size: 11pt; line-height: 16pt; color: ${C.grey}; margin: 0 0 7mm;
  padding-bottom: 5mm; border-bottom: 1.4pt solid ${C.midnight}; }
/* The band between the head and the foot strip, holding the drawing
   and its argument. It FLEXES and centres, so the air on a page whose
   plate is shorter than its field falls above and below the band
   rather than collecting in a hole at the bottom. */
.fg__body { flex: 1; display: flex; gap: ${M.PAGE.gutter * 2}mm; align-items: center;
  padding: 6mm 0; }
.fg__plate { flex: none; }
.fg__read { flex: 1; min-width: 0; }
.fg__read h4 { font-family: ${FACE.data}; font-size: 5.4pt; font-weight: 600;
  letter-spacing: .05em; text-transform: uppercase; color: ${C.gold}; margin: 0 0 2.6mm; }
.fg__read p { font-family: ${FACE.text}; font-size: ${M.T.small}pt; line-height: 14.4pt;
  color: ${C.ink}; margin: 0 0 3.6mm; }
.fg__read p strong { font-weight: 600; }
.fg__n { font-family: ${FACE.data}; font-size: 6pt; line-height: 10.6pt; color: ${C.grey};
  margin: 5mm 0 0; padding-top: 3mm; border-top: .9pt solid ${C.gold}; }
/* ── THE FOOT STRIP ──
   A struck rule across the full measure carrying the four quantities a
   reader would otherwise have to hunt for in the drawing. It anchors
   the page horizontally — a plate and a column of prose both hang from
   the head, and without it the foot of the page has nothing in it —
   and it is information, not filler: every value comes from the same
   engine as the drawing above it. */
.fg__strip { flex: none; display: flex; border-top: 1.4pt solid ${C.midnight}; }
.fg__strip > div { flex: 1; padding: 3.4mm 4mm 0 0; }
.fg__strip > div + div { border-left: .4pt solid ${C.rule}; padding-left: 4mm; }
.fg__strip k { display: block; font-family: ${FACE.data}; font-size: 5.2pt; font-weight: 600;
  letter-spacing: .05em; text-transform: uppercase; color: ${C.gold}; margin-bottom: 1.8mm; }
.fg__strip v { display: block; font-family: ${FACE.display}; font-weight: 400; font-size: 13pt;
  line-height: 16pt; color: ${C.midnight}; font-variant-numeric: lining-nums tabular-nums;
  letter-spacing: -.01em; }
.fg__strip s { display: block; text-decoration: none; font-family: ${FACE.text};
  font-size: ${M.T.micro}pt; line-height: 10.4pt; color: ${C.grey}; margin-top: 1.4mm; }

/* ── THE MARGINAL COLUMN ───────────────────────────────────────────
   A narrow measure beside the text for figures, definitions and the
   classification marks. It is what stops a narrative page being a
   rectangle of prose, and it is the device the last version lacked. */
.mg { display: flex; gap: ${M.PAGE.gutter * 2}mm; height: 100%; }
.mg__side { width: ${M.col(3)}mm; flex: none; }
.mg__main { flex: 1; }
.mg--wide .mg__side { width: ${M.col(4)}mm; }
.mg__note { font-family: ${FACE.data}; font-size: 6pt; line-height: 10.8pt; color: ${C.soft};
  padding-top: 2.6mm; border-top: .9pt solid ${C.gold}; margin: 0 0 6mm; }
.mg__note b { display: block; font-weight: 600; letter-spacing: .035em; text-transform: uppercase;
  font-size: 5.4pt; color: ${C.gold}; margin-bottom: 1.4mm; }
.mg__fig { margin: 0 0 6mm; }

/* ── THE CHAPTER OPENER, WITHOUT A PHOTOGRAPH ──────────────────────
   Seven openers, one structure, seven different drawings — because the
   drawing is made of the chapter it opens (openers.mjs) and no two
   chapters are about the same thing. The structure is an architectural
   one and it reads top to bottom:

     a gold datum at the head carrying the part;
     the roman standing beside the title the way a drop figure stands
       beside a paragraph, so the numeral is part of the line rather
       than a large number floating in space;
     a rubric under a hairline;
     the chapter's own content, drawn, one tone down;
     and a ruled foot rail listing what the part contains, which makes
       the opener a navigational object instead of a divider.

   None of it needs a picture, and a page that would need one is a page
   that has been composed badly. */
.op2__head { display: flex; justify-content: space-between; align-items: baseline;
  padding-bottom: 3.4mm; border-bottom: .9pt solid var(--mark);
  font-family: ${FACE.data}; font-size: 5.8pt; font-weight: 600; letter-spacing: .05em;
  text-transform: uppercase; color: var(--mark); }
/* THE CEREMONIAL LINE. The roman is set in the Didone at fifty-four
   point and struck in foil; the title stands beside it in pearl. This
   is the one line in the book where the two faces are set at the same
   optical weight and the numeral is allowed to be the larger thing. */
.op2__title { display: flex; align-items: baseline; gap: ${M.PAGE.gutter * 2.4}mm; margin: 18mm 0 0; }
.op2__rom { font-family: ${FACE.ceremonial}; font-weight: 500; font-size: 62pt; line-height: 58pt;
  letter-spacing: -.012em; flex: none; min-width: ${M.col(2)}mm; }
.op2__title h1 { font-family: ${FACE.display}; font-weight: 400; font-size: 40pt; line-height: 43pt;
  margin: 0; color: var(--title); letter-spacing: -.016em; }
.op2__rub { font-family: ${FACE.display}; font-style: italic; font-weight: 400; font-size: 13.4pt;
  line-height: 20pt; color: var(--accent); margin: 9mm 0 0; padding-top: 6mm;
  border-top: .5pt solid var(--rule); max-width: ${M.col(9)}mm; }
.op2__datum { margin: 16mm 0 0; }
.op2__datum svg { display: block; width: 100%; height: auto; }
/* A drawing without a caption is decoration, which is the thing this
   whole rebuild exists to remove — so openerPage refuses one. */
.op2__cap { font-family: ${FACE.data}; font-size: 5.8pt; line-height: 9.8pt;
  color: var(--soft); margin: 5mm 0 0; padding-top: 3mm;
  border-top: .35pt solid var(--rule); max-width: ${M.col(9)}mm; }
.op2__rail { position: absolute; left: 0; right: 0; bottom: 0;
  border-top: 1.4pt solid var(--mark); padding-top: 3.4mm; display: flex; gap: ${M.PAGE.gutter * 2}mm; }
.op2__rail k { display: block; font-family: ${FACE.data}; font-size: 5.2pt; font-weight: 600;
  letter-spacing: .05em; text-transform: uppercase; color: var(--mark); margin-bottom: 2mm; }
.op2__rail ol { margin: 0; padding: 0; list-style: none; flex: 1; }
.op2__rail li { display: flex; justify-content: space-between; gap: 3mm;
  font-family: ${FACE.text}; font-size: ${M.T.caption}pt; line-height: 12pt;
  color: var(--ink);
  padding: 1.3mm 0; border-bottom: .3pt solid var(--rule); }
.op2__rail li b { font-family: ${FACE.data}; font-weight: 600; font-size: 5.8pt;
  color: var(--mark); font-variant-numeric: tabular-nums; }

/* ── THE OLD OPENER'S ARGUMENT PAGE ────────────────────────────────
   The recto of an opening spread: the chapter's case, set as text with
   a marginal column beside it. */
.op__num { font-family: ${FACE.inscription}; font-size: 10pt; letter-spacing: .06em;
  color: ${C.gold}; margin: 0 0 6mm; }
.op h1 { font-family: ${FACE.display}; font-weight: 300; font-size: 40pt; line-height: 43pt;
  margin: 0 0 7mm; color: ${C.midnight}; letter-spacing: -.008em; }
.op__arg { font-family: ${FACE.text}; font-size: ${M.T.base}pt; line-height: ${M.LEAD.base}pt;
  color: ${C.ink}; }
.op__arg p:first-child { font-family: ${FACE.display}; font-weight: 300; font-size: 13pt;
  line-height: 19.6pt; color: ${C.inkSoft}; }
.op__rule { width: ${M.col(2)}mm; height: 1.4pt; background: ${C.gold}; margin: 0 0 7mm; }
.op__foot { position: absolute; left: 0; right: 0; bottom: 0; display: flex;
  gap: ${M.PAGE.gutter * 2}mm; }
.op__stat { flex: 1; border-top: .9pt solid ${C.rule}; padding-top: 2.8mm; }
.op__stat v { display: block; font-family: ${FACE.display}; font-size: 19pt; line-height: 21pt;
  color: ${C.midnight}; font-variant-numeric: tabular-nums; }
.op__stat l { display: block; font-family: ${FACE.data}; font-size: 5.2pt; font-weight: 500;
  letter-spacing: .035em; text-transform: uppercase; color: ${C.grey}; margin-top: 1.4mm; line-height: 8.6pt; }

`;

/**
 * A SPREAD. Both sides or neither — the whole point of the unit.
 * Returns the two page strings, and refuses a half-built one loudly,
 * because a spread with an undefined recto renders as a blank page
 * that looks deliberate.
 */
export function spread(verso, recto, ...rest) {
  if (verso == null || recto == null) {
    throw new Error('a spread is composed in twos: both sides must be given');
  }
  /* AND NOT IN THREES. This function took two arguments and was called
     as `spread(figurePage, ...tablePages(...))`, which passed three —
     so the third was built, took its folio number, and was thrown
     away. It cost the publication the second page of the risk
     register and the second page of the governance schedule: four
     governance rows and two risks were composed, numbered, and never
     printed, and the only outward sign was that the folios after leaf
     34 ran ahead of the page count. A page that is built and dropped
     is worse than one that is missing, because the numbering hides
     it. */
  if (rest.length) {
    throw new Error(`a spread is two pages, and ${2 + rest.length} were given: `
      + 'push the remainder after the spread rather than into it');
  }
  return [verso, recto];
}

/**
 * A CHAPTER OPENER. No photograph, and no page that could take one.
 *
 * `datum` is the chapter's own content drawn as an architectural
 * figure — see openers.mjs. It is required: an opener without one is
 * the empty navy-and-gold page this system was built to stop, and
 * passing nothing here should fail loudly rather than render quietly.
 */
export function openerPage({ part, roman, title, say, datum, caption, standing, palette,
  contains = [], runhead }) {
  if (!datum) throw new Error(`chapter opener "${title}" has no datum: the drawing is the page`);
  if (!caption) throw new Error(`chapter opener "${title}" has an uncaptioned drawing, which is decoration`);
  if (!palette) throw new Error(`chapter opener "${title}" has no palette: every part has its own combination`);
  return M.page(`
    <div class="op2__head"><span>${M.esc(part)}</span><span>${standing || ''}</span></div>
    <div class="op2__title">
      <div class="op2__rom foil">${M.esc(roman)}</div>
      <h1>${title}</h1>
    </div>
    <p class="op2__rub">${say}</p>
    <div class="op2__datum">${datum}<p class="op2__cap">${caption}</p></div>
    ${contains.length ? `<div class="op2__rail">
      <ol>${contains.map((c) => `<li><span>${c.t}</span><b>${c.f || ''}</b></li>`).join('')}</ol>
    </div>` : ''}`, { tone: `pal pal--${palette}`, runhead, klass: 'm-open2' });
}

/** A ruled specification register. */
export function specPage({ title, rows, runhead, tone = 'pg--bone' }) {
  return M.page(`
    <div class="sp">
      <p class="sp__t">${M.esc(title)}</p>
      ${rows.map((r) => `<div class="sp__r${r.struck ? ' sp__r--struck' : ''}">
        <k>${M.esc(r.k)}</k><v>${r.v}</v></div>`).join('')}
    </div>`, { runhead, tone });
}

/** A figure with its reading — the graphic IS the page, not an inset. */
export function figurePage({ eyebrow, title, sub, figure, reading, note, strip = [], runhead, tone = '' }) {
  if (!reading) {
    throw new Error(`the plate "${title}" has no reading: a drawing needs its argument beside it`);
  }
  if (strip.length < 3) {
    throw new Error(`the plate "${title}" has no foot strip: the page would end in white`);
  }
  return M.page(`
    <div class="fg">
      ${eyebrow ? `<p class="fg__eye">${M.esc(eyebrow)}</p>` : ''}
      <h2 class="fg__t">${title}</h2>
      ${sub ? `<p class="fg__s">${sub}</p>` : ''}
      <div class="fg__body">
        <div class="fg__plate">${figure}</div>
        <div class="fg__read">
          <h4>${M.esc(reading.head)}</h4>
          ${reading.body}
          ${note ? `<p class="fg__n">${note}</p>` : ''}
        </div>
      </div>
      <div class="fg__strip">${strip.map((c) => `<div><k>${M.esc(c.k)}</k><v>${c.v}</v>${
  c.s ? `<s>${c.s}</s>` : ''}</div>`).join('')}</div>
    </div>`, { runhead, tone });
}

/** A narrative page with a marginal column — the device that stops a
 *  page of prose being a rectangle. */
export function marginPage({ side, main, runhead, tone = '', wide = false }) {
  return M.page(`
    <div class="mg ${wide ? 'mg--wide' : ''}">
      <div class="mg__side">${side || ''}</div>
      <div class="mg__main">${main}</div>
    </div>`, { runhead, tone });
}

export const marginNote = (label, body) =>
  `<div class="mg__note"><b>${M.esc(label)}</b>${body}</div>`;
