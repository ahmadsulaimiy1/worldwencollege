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
 * Two further things were wrong and neither was a matter of taste.
 *
 * NO IMAGES. The College owns eleven licence-cleared photographs, a set
 * of engraved plates drawn as nineteenth-century prospectus line work,
 * and a banknote guilloche. The monograph used none of them and filled
 * the space with emptiness instead, which is not the same thing as
 * space.
 *
 * NO GRAPHICS. Forty-one pages about the economics of an institution,
 * and every quantity in them set as a table. See figures.mjs.
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

/* ────────────────────────────────────────────────────────────────────
   THE PLATES

   Photographs are read from disk and inlined as data URIs so the PDF
   is self-contained. `colonnade.jpg` is NOT available: it carries
   UNIVERSITY OF LONDON across its lintel and was withdrawn on
   18 August 2026 for naming another institution on this College's
   pages. assets/images/plates/CREDITS.md records why, and this list
   exists so nobody re-adds it by reaching into the directory.
   ──────────────────────────────────────────────────────────────────── */
export const PLATES = {
  westminster: { file: 'westminster.jpg', credit: null,
    alt: 'The Palace of Westminster across the Thames.' },
  library: { file: 'library.jpg', credit: null,
    alt: 'A university reading hall, long tables and shelved stacks.' },
  study: { file: 'study.jpg', credit: null, alt: 'A student at work.' },
  seminar: { file: 'seminar.jpg', credit: null, alt: 'Students in conversation over a laptop.' },
  worldmap: { file: 'worldmap.jpg', credit: null, alt: 'A vintage world map.' },
  charter: { file: 'charter.jpg', credit: null, alt: 'A vintage charter document.' },
  letterpress: { file: 'letterpress.jpg', credit: null, alt: 'Letterpress printing blocks.' },
  stacks: { file: 'stacks.jpg', credit: null, alt: 'Library stacks.' },
  manuscript: { file: 'manuscript.jpg', credit: null, alt: 'An illuminated manuscript leaf.' },
  /* These two are BY or BY-SA. Cropping and toning creates an
     adaptation, ShareAlike attaches to the adaptation, and the credit
     is therefore RENDERED on the page rather than recorded in a file
     nobody reads. CREDITS.md is explicit about this. */
  readingHall: { file: 'reading-hall.jpg', credit: 'robert.claypool, CC BY 2.0',
    alt: 'A reading hall.' },
  astrolabe: { file: 'astrolabe.jpg', credit: 'Ragesoss, CC BY-SA 3.0',
    alt: 'A brass astrolabe.' },
};

const dataUri = (rel) => {
  const buf = readFileSync(path.join(ROOT, rel));
  const ext = path.extname(rel).slice(1).toLowerCase();
  const mime = ext === 'svg' ? 'image/svg+xml' : `image/${ext === 'jpg' ? 'jpeg' : ext}`;
  return `data:${mime};base64,${buf.toString('base64')}`;
};
export const plateSrc = (key) => dataUri(`assets/images/plates/${PLATES[key].file}`);
/** An engraved plate from assets/art, inlined as markup so its strokes
 *  take the page's own colour rather than arriving as a flat picture. */
export const engraving = (name) => readFileSync(path.join(ROOT, `assets/art/${name}.svg`), 'utf8')
  .replace(/<\?xml[^>]*\?>/, '')
  .replace(/<!--[\s\S]*?-->/g, '');

export const spreadCss = () => `
/* ── THE DUOTONE ───────────────────────────────────────────────────
   The College's own plate treatment, lifted from css/atelier.css so the
   monograph and the site tone a photograph identically: desaturate,
   take hue from a navy-to-cream ramp in 'color', then put the gold back
   into the highlights in 'soft-light', which 'color' alone leaves
   flat. */
.plate { position: absolute; inset: 0; overflow: hidden; background: ${C.midnightDeep}; }
.plate img { position: absolute; inset: 0; width: 100%; height: 100%; object-fit: cover;
  filter: grayscale(1) contrast(1.09) brightness(.92); }
.plate__tone { position: absolute; inset: 0;
  background: linear-gradient(158deg, #0A1428 0%, #1F3D7A 42%, #8C6A3F 78%, #F2E3C0 100%);
  mix-blend-mode: color; }
.plate__warm { position: absolute; inset: 0;
  background: radial-gradient(ellipse 80% 70% at 68% 22%, rgba(212,175,55,.42), transparent 66%);
  mix-blend-mode: soft-light; }
/* A scrim only where type sits, so a caption never fights its picture. */
.plate__scrim { position: absolute; inset: 0;
  background: linear-gradient(to top, rgba(6,17,31,.82) 0%, rgba(6,17,31,.34) 34%, transparent 62%); }
.plate__credit { position: absolute; right: 4mm; bottom: 3mm; z-index: 6;
  font-family: ${FACE.data}; font-size: 4.6pt; letter-spacing: .12em;
  color: rgba(252,250,245,.5); text-transform: uppercase; }

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

/* Guilloche as a ground. Banknote ruling is the one ornament that
   reads as sovereign rather than decorative, and it is the College's
   own file. */
/* Marked bleed: a ground runs off the trim by design. */
.guilloche { position: absolute; pointer-events: none; }
.guilloche svg { width: 100%; height: 100%; display: block; }
.guilloche--cover { inset: -18% -30% auto auto; width: 132%; height: 132%; opacity: .5; }
.guilloche--corner { right: -26mm; bottom: -32mm; width: 118mm; height: 118mm; opacity: .3; }

/* ── THE FIGURE, AS AN OBJECT ON THE PAGE ──────────────────────────*/
.fg { margin: 0; }
.fg__eye { font-family: ${FACE.data}; font-size: 5.6pt; font-weight: 600;
  letter-spacing: .28em; text-transform: uppercase; color: ${C.gold}; margin: 0 0 2.4mm; }
.fg__t { font-family: ${FACE.display}; font-weight: 400; font-size: 15.6pt; line-height: 20pt;
  color: ${C.midnight}; margin: 0 0 1.6mm; }
.fg__s { font-family: ${FACE.display}; font-style: italic; font-weight: 300;
  font-size: 10.6pt; line-height: 15pt; color: ${C.grey}; margin: 0 0 6mm; }
.fg__n { font-family: ${FACE.data}; font-size: 6pt; line-height: 10.6pt; color: ${C.grey};
  margin: 5mm 0 0; padding-top: 3mm; border-top: .35pt solid ${C.rule}; }

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
.mg__note b { display: block; font-weight: 600; letter-spacing: .16em; text-transform: uppercase;
  font-size: 5.4pt; color: ${C.gold}; margin-bottom: 1.4mm; }
.mg__fig { margin: 0 0 6mm; }

/* ── THE OPENING SPREAD OF A CHAPTER ───────────────────────────────
   A plate on the verso, the argument on the recto. Each chapter takes a
   different plate and a different treatment, so the seven openings are
   a family rather than seven copies. */
.op__num { font-family: ${FACE.inscription}; font-size: 10pt; letter-spacing: .46em;
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
  letter-spacing: .16em; text-transform: uppercase; color: ${C.grey}; margin-top: 1.4mm; line-height: 8.6pt; }

/* ── A PLATE THAT CARRIES ITS OWN TITLE ────────────────────────────*/
.pt__wrap { position: absolute; left: ${M.PAGE.marginOuter}mm; right: ${M.PAGE.marginOuter}mm;
  bottom: ${M.PAGE.marginBottom - 8}mm; z-index: 5; }
.pt__n { font-family: ${FACE.inscription}; font-size: 9pt; letter-spacing: .44em;
  color: ${C.goldLeaf}; margin: 0 0 5mm; }
.pt__t { font-family: ${FACE.display}; font-weight: 300; font-size: 34pt; line-height: 37pt;
  color: ${C.ivory}; margin: 0; letter-spacing: -.006em; }
.pt__s { font-family: ${FACE.display}; font-style: italic; font-weight: 300; font-size: 12pt;
  line-height: 17pt; color: ${C.goldPale}; margin: 4mm 0 0; max-width: ${M.col(7)}mm; }
`;

/**
 * A SPREAD. Both sides or neither — the whole point of the unit.
 * Returns the two page strings, and refuses a half-built one loudly,
 * because a spread with an undefined recto renders as a blank page
 * that looks deliberate.
 */
export function spread(verso, recto) {
  if (verso == null || recto == null) {
    throw new Error('a spread is composed in twos: both sides must be given');
  }
  return [verso, recto];
}

/** A full-bleed photographic page, toned in the house ramp. */
export function platePage(key, opts = {}) {
  const p = PLATES[key];
  if (!p) throw new Error(`no such plate: ${key}`);
  return M.page(`
    <div class="plate">
      <img src="${plateSrc(key)}" alt="${M.esc(p.alt)}">
      <div class="plate__tone"></div>
      <div class="plate__warm"></div>
      ${opts.scrim === false ? '' : '<div class="plate__scrim"></div>'}
      ${p.credit ? `<div class="plate__credit">${M.esc(p.credit)}</div>` : ''}
    </div>
    ${opts.title ? `<div class="pt__wrap">
      ${opts.numeral ? `<p class="pt__n">${M.esc(opts.numeral)}</p>` : ''}
      <h2 class="pt__t">${opts.title}</h2>
      ${opts.say ? `<p class="pt__s">${opts.say}</p>` : ''}
    </div>` : ''}`, { tone: 'pg--dark', bare: true, full: true });
}

/** A figure with its reading — the graphic IS the page, not an inset. */
export function figurePage({ eyebrow, title, sub, figure, note, runhead, tone = '' }) {
  return M.page(`
    <div class="fg">
      ${eyebrow ? `<p class="fg__eye">${M.esc(eyebrow)}</p>` : ''}
      <h2 class="fg__t">${title}</h2>
      ${sub ? `<p class="fg__s">${sub}</p>` : ''}
      ${figure}
      ${note ? `<p class="fg__n">${note}</p>` : ''}
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
