/**
 * THE INFORMATION GRAPHICS — drawn in the register of an engraved plate.
 *
 * ════════════════════════════════════════════════════════════════════
 * WHY THIS FILE EXISTS
 * ════════════════════════════════════════════════════════════════════
 * The monograph ran to forty-one pages about the economics of an
 * institution and contained NOT ONE CHART. Every quantity in it was set
 * as a table or a large numeral, which is why it read as a report with
 * good typography rather than as a publication: a table is a place to
 * look something up, and a graphic is an argument you can see.
 *
 * ════════════════════════════════════════════════════════════════════
 * THE REGISTER, AND WHY IT IS NOT THE USUAL ONE
 * ════════════════════════════════════════════════════════════════════
 * These are not business charts. The College already owns an engraved
 * visual language — assets/art/guilloche.svg is banknote ruling,
 * portico.svg is a nineteenth-century prospectus plate drawn in line
 * with no fills at all — and a publication that sets a flat-filled
 * column chart beside those plates has two visual identities and
 * belongs to neither.
 *
 * So everything here is drawn the way an engraver would draw it:
 *
 *   NO FILLS OF FLAT COLOUR. Density is carried by RULED HATCHING at
 *   varying pitch, which is how depth was carried before process
 *   printing. A denser hatch is a heavier quantity.
 *
 *   HAIRLINES, and a strict ladder of them: .3pt for grid, .5pt for
 *   structure, 1.2pt for a struck threshold.
 *
 *   NO GRADIENTS, no shadows, no rounded corners, no legends floating
 *   in boxes. A label sits beside the thing it names.
 *
 *   GOLD MARKS A THRESHOLD, never an outline. Where gold appears it is
 *   because something is being measured against it.
 *
 * Every figure carries ONE idea. A figure that needs a paragraph to
 * explain what to look at has failed and should be two figures.
 */

import ADVANCES from './advances.json' with { type: 'json' };

/**
 * ════════════════════════════════════════════════════════════════════
 * HOW WIDE WILL THAT SET?
 * ════════════════════════════════════════════════════════════════════
 * Every clipped label in this library had the same cause: a gutter, a
 * side, or a margin chosen by REASONING about how wide a string would
 * set. Three plates lost text that way — RESERVE printed as
 * INSTITUTIONAL, a benchmark caption printed as "TISH COUNCIL SAUDI
 * $284", and the decade's dominant closing figure printed as "$17." —
 * and the second and third were each "fixed" by a fresh estimate that
 * was wrong again.
 *
 * So no plate below estimates. `setWidth` sums the measured advance of
 * every character in the string from a table taken off the actual
 * typefaces at the actual sizes (scripts/publication/measure-advances.mjs),
 * and the plates size their own geometry from the answer.
 *
 * It returns a CEILING, deliberately:
 *   · each character is charged the widest advance it takes anywhere
 *     in the publication's size range, because Newsreader's optical
 *     size axis moves advances by ten per cent across that range;
 *   · kerning is not subtracted, and kerning only ever pulls a pair
 *     closer;
 *   · a character the table has never seen is charged at the widest
 *     glyph in the face rather than at nothing.
 *
 * Being a ceiling is the point. A gutter sized from a ceiling is a
 * little wider than it strictly needs to be; a gutter sized from an
 * under-estimate loses a word. `tests/figures.test.mjs` renders every
 * plate and proves the ceiling held.
 */
export function setWidth(text, size, opts = {}) {
  const key = `${opts.face === TEXT || opts.face === DISPLAY || opts.serif ? 'serif' : 'data'}:${opts.weight || 500}`;
  const tbl = ADVANCES.advance[key];
  if (!tbl) throw new Error(`figures: no advance table for ${key} — add it to measure-advances.mjs`);
  const widest = ADVANCES.widest[key];
  const s = opts.caps ? String(text).toUpperCase() : String(text);
  let em = 0;
  for (const ch of s) em += tbl[ch] ?? widest;
  return em * size + Math.max(0, s.length - 1) * (opts.track || 0);
}

/**
 * THE SAME MEASUREMENT, USED TO BREAK A LINE.
 *
 * A closing statement set beside a struck figure has a column width,
 * not a character count, and guessing where it breaks is the same bug
 * as guessing where it ends.
 *
 * It also BALANCES, which greedy wrapping does not. Filled to the
 * measure, the amortisation closer broke three full lines and left
 * "time." alone on a fourth — a widow under a 23-point figure, which
 * is the one place in a plate where a ragged foot is unmissable. So
 * the column is narrowed as far as it will go without costing a line,
 * and the text is set to that narrower measure: the same number of
 * lines, of nearly equal length, which is how a caption is set in a
 * book and not how it falls out of a text box.
 */
export function wrapTo(text, maxWidth, size, opts = {}) {
  const raw = String(text).split(/\s+/).filter(Boolean);
  /* A dash may not begin a line. The risk matrix broke "above the
     line — likely enough" exactly there and set the em dash as the
     first mark of its second line, which is a fault in any book. A
     token that is nothing but punctuation is glued to the word in
     front of it and the pair breaks as one. */
  const words = [];
  for (const w of raw) {
    if (words.length && /^[—–-]+$/.test(w)) words[words.length - 1] += ` ${w}`;
    else words.push(w);
  }
  const fill = (measure) => {
    const lines = [];
    let line = '';
    for (const w of words) {
      const trial = line ? `${line} ${w}` : w;
      if (line && setWidth(trial, size, opts) > measure) { lines.push(line); line = w; }
      else line = trial;
    }
    if (line) lines.push(line);
    return lines;
  };
  const target = fill(maxWidth).length;
  let lo = Math.max(...words.map((w) => setWidth(w, size, opts)));
  let hi = maxWidth;
  /* The narrowest measure that still sets in `target` lines. Twenty
     halvings resolve a 160-unit plate to well under a hair's width. */
  for (let i = 0; i < 20 && hi - lo > 0.25; i += 1) {
    const mid = (lo + hi) / 2;
    if (fill(mid).length <= target) hi = mid; else lo = mid;
  }
  return fill(hi);
}

/* `inkSoft` was used in three places and defined in none of them, so
   every allocation descriptor and the amortisation closer were set in
   `fill="undefined"` — an invalid paint the browser silently replaces
   with flat black, which is the one ink the palette does not contain.
   It is a softened ink, one step off `ink`, which is what a descriptor
   under a struck figure wants. */
/**
 * LABELS THAT WOULD SIT ON TOP OF EACH OTHER, PUSHED APART.
 *
 * Two segments whose researched figures are $15.5k and $13.0k land
 * about four units apart on a 110-unit axis, and their two-line labels
 * are twelve units tall — so the plate printed "United Kingdom"
 * through "$13.0k" and neither could be read. Every de-collision here
 * keeps the order of the series and moves the smallest total distance
 * that opens the required gap, so a displaced label is still obviously
 * the label of the point above it; the plates draw a leader wherever
 * the displacement is large enough to notice.
 */
export function deCollide(desired, gap, bounds = {}) {
  const order = desired.map((y, i) => i).sort((a, b) => desired[a] - desired[b]);
  const out = desired.slice();
  const top = bounds.top ?? -Infinity;
  const bottom = bounds.bottom ?? Infinity;
  let prev = -Infinity;
  for (const i of order) {
    out[i] = Math.max(desired[i], prev + gap, top);
    prev = out[i];
  }
  /* If the stack has been pushed off the foot of the plate, walk back
     up through it — which is why this runs in two passes rather than
     one greedy sweep. */
  const overflow = prev - bottom;
  if (overflow > 0) {
    let limit = bottom;
    for (const i of order.slice().reverse()) {
      out[i] = Math.min(out[i], limit);
      limit = out[i] - gap;
    }
  }
  return out;
}

export const K = {
  ink: '#16202C', inkSoft: '#2E3A49', midnight: '#0A1A2F', soft: '#5A6479', grey: '#79828F',
  rule: '#D9D2C2', faint: '#EBE6DA', gold: '#A9843C', goldLeaf: '#C9A961',
  goldPale: '#E8D9B4', paper: '#FFFFFF', bone: '#F6F2E9', crimson: '#7E1F2D',
};
export const DATA = "'Archivo','Liberation Sans',sans-serif";
export const DISPLAY = "'Newsreader','Bitstream Charter',serif";
export const TEXT = "'Newsreader','Bitstream Charter',serif";

/* ────────────────────────────────────────────────────────────────────
   TYPOGRAPHY IN THE PLATES

   The first cut set every label in capitals at five point with 1.1
   units of tracking — about .22em — so RESERVE printed as R E S E R V E
   and six allocations read as six unrelated annotations rather than one
   system. Wide tracking was doing work the typeface should do, and the
   typeface could not do it because Cormorant Garamond at eleven point
   is a display face three sizes below where it lives.

   The rules below are the whole policy:

     A DESCRIPTOR IS SET IN SENTENCE CASE. "Reserve", not RESERVE. A
       word only needs capitals when it is a category marker, and a
       category marker only needs .04em.
     A FIGURE IS SET IN THE DISPLAY FACE at a size that dominates, with
       lining tabular numerals, and its per-cent sign is set smaller and
       raised — which is how financial figures have been set in books
       for a century and is not the same as typing 25%.
     NOTHING IS TRACKED past .05em.
     AND THE STRUCTURE IS HEAVIER. Premium is not faint; hairlines at
       .3 read as a wireframe. */
const TRACK = { caps: 0.22, none: 0 };
export const RULE = { grid: 0.5, structure: 0.75, struck: 2.2, hatch: 0.62 };

/**
 * A FIGURE WITH A PROPERLY SET PER-CENT SIGN.
 * The digits carry the size; the sign is set to about 68 per cent of it
 * and raised to sit optically with the cap line rather than the
 * baseline, because a full-size % makes every number look like a
 * dashboard reading.
 */
export function figureValue(x, y, value, size, opts = {}) {
  const m = String(value).match(/^([^%]*)(%?)$/);
  const digits = m ? m[1] : String(value);
  const sign = m && m[2] ? m[2] : '';
  const fill = opts.fill || K.midnight;
  const anchor = opts.anchor || 'start';
  return `<text x="${r2(x)}" y="${r2(y)}" font-family="${DISPLAY}" font-size="${size}"
    font-weight="${opts.weight || 500}" fill="${fill}" text-anchor="${anchor}"
    letter-spacing="${-size * 0.012}"
    style="font-variant-numeric:lining-nums tabular-nums">${esc(digits)}${
  sign ? `<tspan font-size="${r2(size * 0.68)}" dy="${r2(-size * 0.055)}">${sign}</tspan>` : ''}</text>`;
}

export const esc = (v) => String(v).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
export const r2 = (n) => Math.round(n * 100) / 100;

/**
 * THE HATCH. Every density in the publication comes from here, so a
 * reader learns the scale once: pitch is the gap between rules in user
 * units, and a smaller pitch is a heavier quantity.
 */
export function hatchDefs(id, pitch, colour, angle = 45, width = 0.5) {
  return `<pattern id="${id}" patternUnits="userSpaceOnUse" width="${pitch}" height="${pitch}"
    patternTransform="rotate(${angle})">
    <line x1="0" y1="0" x2="0" y2="${pitch}" stroke="${colour}" stroke-width="${width}"/>
  </pattern>`;
}

/* A label. Sentence case and untracked by default; capitals and a
   trace of tracking only where `caps` is asked for, because a label is
   a label and not an effect. */
export const label = (x, y, t, o = {}) => `<text x="${r2(x)}" y="${r2(y)}"
  font-family="${o.face || DATA}" font-size="${o.size || 6.2}"
  font-weight="${o.weight || 500}" letter-spacing="${o.track ?? (o.caps ? TRACK.caps : TRACK.none)}"
  fill="${o.fill || K.grey}" text-anchor="${o.anchor || 'start'}"
  ${o.caps ? 'style="text-transform:uppercase"' : ''}>${esc(t)}</text>`;

/* ════════════════════════════════════════════════════════════════════
   A PLATE HAS A PRINTED SIZE, AND IT IS NOT "AS BIG AS THE PAGE"
   ════════════════════════════════════════════════════════════════════
   These plates were emitted at width:100%, which on this book's
   175mm measure made one viewBox unit 1.04mm — 2.95 POINTS. A label
   authored as `font-size="6.2"` therefore reached the page at
   EIGHTEEN AND A HALF POINTS: larger than the running text, nearly
   the size of the page's own heading, and about two and a half times
   what a plate label should ever be. Every hairline was three times
   too heavy for the same reason — `stroke-width="0.3"` printed at
   nine tenths of a point.

   Nothing in the drawings was wrong. They are internally consistent
   and they were verified, repeatedly, in a browser at 620 pixels
   across, where twenty-two pixels of label looks perfectly small.
   What was wrong was the one number that never appeared in any of
   them: how wide the plate is when it is printed.

   It is declared here, once. At .46mm to the unit a 6.2-unit label
   sets at 8.1pt — a shade above the book's caption size, which is
   where a plate label belongs — a .3-unit hairline at .4pt, and a
   17-unit numeral at 22pt. Every dimension in the library comes right
   together because they were always in proportion to each other.

   The plate is consequently about 77mm wide rather than 175mm, and
   the figure page is composed around that: the drawing in one column
   and its reading in the other, which is a better page than a chart
   alone in a 175mm field with two fifths of it empty. */
export const UNIT_MM = 0.46;
export const printWidthMm = (w) => Math.round(w * UNIT_MM * 100) / 100;

export const figure = (w, h, inner, defs = '') =>
  `<svg class="fig" viewBox="0 0 ${w} ${h}" xmlns="http://www.w3.org/2000/svg"
    style="display:block;width:${printWidthMm(w)}mm;max-width:100%" role="img">
    ${defs ? `<defs>${defs}</defs>` : ''}${inner}</svg>`;

// ════════════════════════════════════════════════════════════════════
// 1 · THE CAPITAL ARCHITECTURE
// ════════════════════════════════════════════════════════════════════
/**
 * The revenue-allocation framework drawn as an ARCHITECTURAL ELEVATION
 * rather than a stacked bar.
 *
 * The previous version was a stack of six flat blocks, which is a bar
 * chart standing up. The framework's whole content is a DIVISION — four
 * lines consumed running the institution, two retained as capital — and
 * a stack shows six things of different sizes without showing the one
 * thing that matters.
 *
 * So it is drawn as a section through a structure: the consumed lines
 * are the shaft, hatched at a density proportional to their weight; the
 * struck gold rule is the entablature; the retained lines are the
 * capital above it, ruled rather than hatched because they are held
 * rather than spent. Dimension lines carry the percentages the way an
 * architect's elevation carries its measurements.
 */
export function capitalArchitecture(lines, opts = {}) {
  /* TALLER THAN IT WAS. At a declared .46mm to the unit the plate is
     77mm across whatever its height, so the height is free — and at
     186 units the elevation was 86mm tall and left the lower half of
     its page empty. An elevation of a structure should be tall. */
  const W = 168, H = 300;
  /* GEOMETRY, CORRECTED. The first cut put the shaft at x=34 with the
     dimension text starting at x=114 and running to wherever the name
     ended — which was past the viewBox on four of the six lines, so
     RESERVE read as "INSTITUTIONAL" with the rest off the plate. The
     measure down the left was negative and clipped too. The column now
     sits where the text has room, and the names are passed in short. */
  const measureX = 13, colX = 26, colW = 44;
  const dimX = colX + colW + 16;
  const top = 14, bot = H - 18;
  const span = bot - top;

  /* The band depth below which a figure and its descriptor cannot
     stack without colliding with the band beneath. */
  const STACK_MIN = 21;
  const consumed = lines.filter((l) => !l.retained);
  const retained = lines.filter((l) => l.retained);
  const retShare = retained.reduce((a, l) => a + l.target, 0);
  const short = (l) => (opts.labels && opts.labels[l.key]) || l.name;

  let defs = '';
  let y = top;
  let body = '';

  retained.forEach((l, i) => {
    const h = span * l.target;
    defs += hatchDefs(`ret${i}`, 2.6, K.goldLeaf, 0, RULE.hatch);
    body += `<rect x="${colX - 5}" y="${r2(y)}" width="${colW + 10}" height="${r2(h)}"
      fill="url(#ret${i})" stroke="${K.gold}" stroke-width="${RULE.structure}"/>`;
    body += dimension(dimX, y, h, `${Math.round(l.target * 100)}%`, short(l), K.gold, h < STACK_MIN);
    y += h;
  });

  const ruleY = top + capOf(span, retShare);
  body += `<line x1="${colX - 12}" y1="${r2(ruleY)}" x2="${colX + colW + 12}" y2="${r2(ruleY)}"
    stroke="${K.gold}" stroke-width="${RULE.struck}"/>`;

  consumed.forEach((l, i) => {
    const h = span * l.target;
    const pitch = r2(1.4 + (1 - l.target / 0.25) * 1.8);
    defs += hatchDefs(`con${i}`, Math.max(1.15, pitch), K.soft, 45, RULE.hatch);
    body += `<rect x="${colX}" y="${r2(y)}" width="${colW}" height="${r2(h)}"
      fill="url(#con${i})" stroke="${K.soft}" stroke-width="${RULE.structure}"/>`;
    /* A band under about seven units cannot carry two lines of text at
       its own centre without touching its neighbour, so its measure is
       set on one line instead. */
    /* TWO TREATMENTS, WHICH IS THE HIERARCHY.
       A stacked figure over its descriptor needs about twenty units of
       band to sit in. A ten-per-cent band is fourteen, so stacking it
       ran the descriptor into the band below — the bottom three
       allocations overlapped each other, and the typography-alone test
       showed it instantly. Bands deep enough take the monumental
       treatment; the rest set on one line at a smaller size on the same
       axis. That is a grammar with a hierarchy in it, not a fallback. */
    body += dimension(dimX, y, h, `${Math.round(l.target * 100)}%`, short(l), K.soft, h < STACK_MIN);
    y += h;
  });

  body += `<rect x="${colX - 8}" y="${r2(bot)}" width="${colW + 16}" height="3"
    fill="none" stroke="${K.ink}" stroke-width="${RULE.structure}"/>`;
  body += `<line x1="${colX - 12}" y1="${r2(bot + 5)}" x2="${colX + colW + 12}" y2="${r2(bot + 5)}"
    stroke="${K.ink}" stroke-width="0.35"/>`;

  body += `<line x1="${measureX + 6}" y1="${top}" x2="${measureX + 6}" y2="${bot}"
    stroke="${K.rule}" stroke-width="${RULE.grid}"/>`;
  for (const t of [0, 0.25, 0.5, 0.75, 1]) {
    const ty = top + span * t;
    body += `<line x1="${measureX + 3.5}" y1="${r2(ty)}" x2="${measureX + 6}" y2="${r2(ty)}"
      stroke="${K.rule}" stroke-width="${RULE.grid}"/>`;
    body += label(measureX + 1.5, ty + 1.9, `${100 - t * 100}`, { anchor: 'end', size: 5.6, fill: K.grey, weight: 400 });
  }
  return figure(W, H, body, defs);
}

const capOf = (span, share) => span * share;

/** A dimension line with its measure, the way an elevation carries one. */
/**
 * A DIMENSION LINE, SET AS ONE SYSTEM.
 *
 * Six of these used to read as six unrelated annotations: a delicate
 * Cormorant percentage over a tracked capital label, each floating at
 * its own band's centre with nothing holding them to a common axis.
 *
 * They now share a grammar. Every figure hangs from ONE optical axis;
 * every descriptor hangs from the same axis directly beneath it; the
 * figure dominates its descriptor by about two to one; and the
 * descriptor is sentence case, untracked, in the text face. A reader
 * takes in "25% Reserve" as one object, and the column of them as one
 * system — which is what the framework is.
 */
/** Width of the figure column in the inline treatment: enough for the
 *  widest figure the framework produces, so every descriptor starts at
 *  the same place. */
const FIG_COL = 17;

function dimension(x, y, h, value, name, colour, oneLine = false) {
  const mid = y + h / 2;
  const tick = `<line x1="${r2(x - 12)}" y1="${r2(y)}" x2="${r2(x)}" y2="${r2(y)}"
    stroke="${K.faint}" stroke-width="${RULE.grid}"/>`;
  const stem = `<line x1="${r2(x - 6)}" y1="${r2(y + 0.8)}" x2="${r2(x - 6)}" y2="${r2(y + h - 0.8)}"
    stroke="${colour}" stroke-width="${RULE.structure}"/>`;
  /* A band too shallow to carry two lines sets them on one, on the same
     axis, so the system does not break where it gets tight. */
  if (oneLine) {
    /* OPTICAL ALIGNMENT, NOT ARITHMETIC.
       Setting the descriptor at a fixed offset from the figure's LEFT
       edge assumes every figure is the same width. "5%" and "10%" are
       not, so 10% printed as "10%Operating" with the descriptor inside
       the figure. The figure is therefore right-aligned to one axis and
       the descriptor left-aligned to a second — which is how a money
       column has been set since before anyone measured one in pixels,
       and it makes the two descriptors align with each other as well. */
    return `<g>${tick}${stem}
      ${figureValue(x + FIG_COL, mid + 2.6, value, 10.5, { anchor: 'end' })}
      <text x="${r2(x + FIG_COL + 4.2)}" y="${r2(mid + 2.2)}" font-family="${TEXT}" font-size="7.4"
        font-weight="400" fill="${K.inkSoft}">${esc(name)}</text>
    </g>`;
  }
  return `<g>${tick}${stem}
    ${figureValue(x, mid - 0.4, value, 15)}
    <text x="${r2(x)}" y="${r2(mid + 7.8)}" font-family="${TEXT}" font-size="7.6"
      font-weight="400" fill="${K.inkSoft}">${esc(name)}</text>
  </g>`;
}

// ════════════════════════════════════════════════════════════════════
// 2 · PRICE AGAINST THE ONE PUBLISHED BENCHMARK
// ════════════════════════════════════════════════════════════════════
/**
 * The single most important commercial claim in the plan, and it was
 * buried in a table: every WEC-LC tier costs LESS per hour of individual
 * instructor attention than the British Council's published Saudi
 * tariff, and confers an award the module does not.
 *
 * Drawn as a threshold. The benchmark is a struck gold vertical; every
 * tier is a rule running to its own value. Anything crossing the gold
 * line would be dearer than the benchmark, and a reader sees in one
 * second that nothing does.
 */
export function attentionThreshold(rows, benchmark, opts = {}) {
  /* TWO COMPARABLES, NOT ONE — AND THE FIGURE IS WHY.

     The first cut drew a single gold line at the British Council's
     published Saudi tariff, and the plan claimed in prose that WEC-LC
     was cheaper than it at every tier. Drawn, two tiers were plainly
     over it. The claim had been checked once at an earlier, lower
     tariff and never re-checked when the price rose — which a table of
     six numbers let pass and a threshold line cannot.

     It is also the wrong single comparable. A British Council module is
     GROUP LANGUAGE TEACHING; an Executive Bespoke pathway is one-to-one
     provision, whose market is executive coaching at $200–600 an hour.
     Judging both against one line asks the wrong question of one of
     them. The band is drawn, the line is drawn, and each tier is read
     against the comparable it actually has. */
  const W = 168, H = 22 + rows.length * 26 + 30;
  /* THREE COLUMNS: NAME, PLOT, VALUE — AND TWO OF THEM ARE MEASURED.
     The gutters used to be flat numbers. 46 held "Independent" and cut
     "Executive Premium"; 20 on the right is correct for $213 and wrong
     for $1,234. They are now the width of the widest thing that has to
     stand in them.

     The values also moved. They were set beside their own dots, which
     put four of the six across the gold rule, because a threshold plot
     is precisely a plot whose dots cluster around one x. In a value
     column they align with each other instead, the rule stays clean,
     and the six figures read as one series — which is the whole point
     of drawing them together. */
  const nameW = Math.max(...rows.map((r) => setWidth(r.name, 6, { face: TEXT, weight: 400 })));
  const valW = Math.max(...rows.map((r) => setWidth(`$${Math.round(r.perHour)}`, 6.6, { weight: 600 })));
  const x0 = Math.ceil(nameW) + 7, x1 = W - Math.ceil(valW) - 9;
  const band = opts.band;
  const ceiling = Math.max(benchmark, band ? band.to : 0, ...rows.map((r) => r.perHour)) * 1.08;
  const sx = (v) => x0 + (v / ceiling) * (x1 - x0);

  const defs = hatchDefs('coach', 2.4, K.goldPale, 45, 0.6);
  let body = '';
  const plotTop = 16, plotBot = H - 22;

  if (band) {
    // Clipped to the plot, so the band never runs past the axis it is
    // measured on.
    const bw = Math.min(sx(band.to), x1) - sx(band.from);
    body += `<rect x="${r2(sx(band.from))}" y="${plotTop}" width="${r2(bw)}"
      height="${r2(plotBot - plotTop)}" fill="url(#coach)" stroke="none"/>`;
    body += `<line x1="${r2(sx(band.from))}" y1="${plotTop}" x2="${r2(sx(band.from))}" y2="${r2(plotBot)}"
      stroke="${K.goldPale}" stroke-width="0.5"/>`;
    const bandW = setWidth(band.label, 4.9, { weight: 500 });
    body += `<text x="${r2(Math.min(sx(band.from) + 2, W - 1 - bandW))}" y="${H - 5}"
      font-family="${DATA}" font-size="4.9"
      font-weight="500" fill="${K.gold}">${esc(band.label)}</text>`;
  }

  const stepFor = (c) => (c > 500 ? 200 : 100);
  for (let v = 0; v <= ceiling; v += stepFor(ceiling)) {
    body += `<line x1="${r2(sx(v))}" y1="${plotTop}" x2="${r2(sx(v))}" y2="${r2(plotBot)}"
      stroke="${K.faint}" stroke-width="0.3"/>`;
    body += label(sx(v), plotBot + 6, `$${v}`, { anchor: 'middle', size: 5 });
  }

  rows.forEach((r, i) => {
    const y = plotTop + 14 + i * 26;
    const over = r.perHour > benchmark && !r.ownBand;
    const col = over ? K.crimson : K.midnight;
    body += label(x0 - 5, y + 2, r.name, { anchor: 'end', size: 6, fill: K.ink, upper: false,
      face: TEXT, weight: 400, track: 0 });
    body += `<line x1="${r2(x0)}" y1="${r2(y)}" x2="${r2(sx(r.perHour))}" y2="${r2(y)}"
      stroke="${col}" stroke-width="1.5"/>`;
    body += `<circle cx="${r2(sx(r.perHour))}" cy="${r2(y)}" r="1.9" fill="${col}"/>`;
    /* A hairline from the dot out to the value column, so the eye can
       cross the gap without counting rows. */
    body += `<line x1="${r2(sx(r.perHour) + 3)}" y1="${r2(y)}" x2="${r2(x1 + 4)}" y2="${r2(y)}"
      stroke="${K.faint}" stroke-width="0.35"/>`;
    body += `<text x="${W - 3}" y="${r2(y + 2.3)}" font-family="${DATA}" font-size="6.6"
      font-weight="600" fill="${col}" text-anchor="end"
      style="font-variant-numeric:lining-nums tabular-nums">$${Math.round(r.perHour)}</text>`;
  });

  const bx = sx(benchmark);
  body += `<line x1="${r2(bx)}" y1="${plotTop - 7}" x2="${r2(bx)}" y2="${r2(plotBot)}"
    stroke="${K.gold}" stroke-width="1.4"/>`;
  /* THE CAPTION SITS BESIDE ITS RULE IF THERE IS ROOM BESIDE ITS RULE.
     Twice it was placed by a rule of thumb about which third of the
     plate the benchmark fell in, and twice it ran off an edge. The
     rule of thumb is gone: the caption is measured, set to the right
     of the rule when the right has room, to the left when the left
     does, and flush to the plate edge when a benchmark lands mid-plate
     and neither side can hold it. */
  const cap = `${opts.benchmarkLabel || 'Benchmark'}, $${Math.round(benchmark)}`;
  const capW = setWidth(cap, 5.2, { weight: 600, track: 0.7 });
  const fitsRight = bx + 3 + capW <= W - 1;
  const fitsLeft = bx - 3 - capW >= 1;
  const capX = fitsRight ? bx + 3 : fitsLeft ? bx - 3 : W - 1 - capW;
  body += `<text x="${r2(capX)}" y="${plotTop - 9}" font-family="${DATA}"
    font-size="5.2" font-weight="600" letter-spacing="0.7" fill="${K.gold}"
    text-anchor="${fitsRight || !fitsLeft ? 'start' : 'end'}"
    >${esc(cap)}</text>`;

  return figure(W, H, body, defs);
}

// ════════════════════════════════════════════════════════════════════
// 3 · ASSUMED AGAINST RESEARCHED — a slope
// ════════════════════════════════════════════════════════════════════
/**
 * What the market research did to the plan, in one figure. A table of
 * five befores and five afters makes a reader do the subtraction; a
 * slope makes them see it, and the one segment that moved by a factor
 * of three is unmistakable.
 */
export function slope(rows, opts = {}) {
  const W = 168, H = 240;
  /* THE TWO COLUMNS ARE PLACED BY WHAT HANGS OFF THEM. `xb` was 118,
     which left fifty units for a segment name — enough for "Nigeria
     and", not for "Gulf professionals", which ran off the plate. The
     right column now stands as far left as the widest name and the
     widest figure beside it require, and the left column as far right
     as the widest figure behind it requires. */
  const fromW = Math.max(...rows.map((r) => setWidth(`$${(r.from / 1000).toFixed(1)}k`, 5.8, { weight: 500 })));
  const rightW = Math.max(
    ...rows.map((r) => setWidth(`$${(r.to / 1000).toFixed(1)}k`, 6, { weight: 600 })),
    ...rows.map((r) => setWidth(r.name, 5.6, { face: TEXT, weight: 400 })),
  );
  const xa = Math.ceil(fromW) + 10, xb = W - Math.ceil(rightW) - 7;
  const top = 30, bot = H - 26;
  const max = Math.max(...rows.flatMap((r) => [r.from, r.to])) * 1.06;
  const sy = (v) => bot - (v / max) * (bot - top);

  let body = '';
  body += `<line x1="${xa}" y1="${top - 6}" x2="${xa}" y2="${bot}" stroke="${K.rule}" stroke-width="0.35"/>`;
  body += `<line x1="${xb}" y1="${top - 6}" x2="${xb}" y2="${bot}" stroke="${K.rule}" stroke-width="0.35"/>`;
  body += label(xa, top - 10, opts.fromLabel || 'Assumed', { anchor: 'middle', size: 5.6, fill: K.grey });
  body += label(xb, top - 10, opts.toLabel || 'Researched', { anchor: 'middle', size: 5.6, fill: K.gold });

  /* WHERE THE LABELS GO, BEFORE ANYTHING IS DRAWN. The right-hand
     label is two lines tall — a figure and the segment it belongs to —
     and two segments four units apart on the axis printed through each
     other. Both sides are laid out first, pushed apart, and only then
     drawn; a label that had to move carries a leader back to its own
     point. */
  const yaOf = rows.map((r) => sy(r.from));
  const ybOf = rows.map((r) => sy(r.to));
  const yaSet = deCollide(yaOf.map((y) => y + 2), 7.6, { top: top - 2, bottom: bot + 2 });
  const ybSet = deCollide(ybOf.map((y) => y - 1.6), 13.2, { top: top - 4, bottom: bot - 4 });

  rows.forEach((r, i) => {
    const ya = yaOf[i], yb = ybOf[i];
    const fell = r.to < r.from;
    const heavy = Math.abs(r.to / r.from - 1) > 0.5;
    body += `<line x1="${xa}" y1="${r2(ya)}" x2="${xb}" y2="${r2(yb)}"
      stroke="${heavy ? K.crimson : K.soft}" stroke-width="${heavy ? 1.1 : 0.6}"/>`;
    body += `<circle cx="${xa}" cy="${r2(ya)}" r="1.5" fill="${K.soft}"/>`;
    body += `<circle cx="${xb}" cy="${r2(yb)}" r="1.9" fill="${heavy ? K.crimson : K.midnight}"/>`;
    body += `<text x="${xa - 4}" y="${r2(yaSet[i])}" font-family="${DATA}" font-size="5.8"
      font-weight="500" fill="${K.grey}" text-anchor="end"
      style="font-variant-numeric:lining-nums tabular-nums">$${(r.from / 1000).toFixed(1)}k</text>`;
    const moved = Math.abs(ybSet[i] + 1.6 - yb);
    if (moved > 1.2) {
      body += `<path d="M ${r2(xb + 2.4)} ${r2(yb)} L ${r2(xb + 4)} ${r2(ybSet[i] - 0.6)}"
        stroke="${K.rule}" stroke-width="0.35" fill="none"/>`;
    }
    body += `<text x="${xb + 5}" y="${r2(ybSet[i])}" font-family="${DATA}" font-size="6"
      font-weight="600" fill="${K.midnight}"
      style="font-variant-numeric:lining-nums tabular-nums">$${(r.to / 1000).toFixed(1)}k</text>`;
    body += `<text x="${xb + 5}" y="${r2(ybSet[i] + 5.8)}" font-family="${TEXT}" font-size="5.6"
      fill="${K.soft}">${esc(r.name)}</text>`;
    if (heavy) {
      body += `<text x="${r2((xa + xb) / 2)}" y="${r2((ya + yb) / 2 - 2.4)}" font-family="${DATA}"
        font-size="5.4" font-weight="700" fill="${K.crimson}" text-anchor="middle"
        >${fell ? '−' : '+'}${Math.abs(Math.round((r.to / r.from - 1) * 100))}%</text>`;
    }
  });
  return figure(W, H, body);
}

// ════════════════════════════════════════════════════════════════════
// 4 · THE DECADE
// ════════════════════════════════════════════════════════════════════
/**
 * Net tuition as ruled columns, with surplus drawn as a line against
 * the zero rule, so the year the institution turns is visible rather
 * than looked up.
 */
export function decade(years, opts = {}) {
  /* TWO REGISTERS, BECAUSE THERE ARE TWO QUANTITIES.
   *
   * The first cut drew net tuition as columns and surplus as a line
   * over the top of them, on a second invisible scale, with no axis for
   * either. Two magnitudes sharing one plot and no way to read either
   * is not a compact chart; it is a chart that cannot be read, and the
   * fact that it looked tidy is what let it pass.
   *
   * Net tuition and surplus now have their own registers, stacked, with
   * their own baselines. The surplus register is deliberately shallow —
   * it is the smaller quantity and pretending otherwise was the
   * original sin — and it runs above and below its own nil rule so the
   * year the institution turns is a shape rather than a footnote.
   *
   * AND IT HAS A DOMINANT ELEMENT. A figure with nothing dominant is a
   * diagram; the eye needs somewhere to land, and here it is the
   * closing year's net tuition, set at the right where the columns end.
   */
  const W = 168, H = 210;
  /* The plot stops well short of the plate so the closing figure has
     room to be set. At W-34 the columns ran to 134 and "$17.0M" at
     thirteen point needs about thirty-eight units after them, so the
     dominant element of the figure printed as "$17." and fell off the
     edge — the one element that must not. */
  const x0 = 16, x1 = W - 48;
  const revTop = 14, revBot = 74;          // upper register
  const surTop = 88, surBot = 116;         // lower register
  const bw = (x1 - x0) / years.length;

  const maxRev = Math.max(...years.map((y) => y.netTuition)) * 1.06;
  const maxSur = Math.max(...years.map((y) => Math.abs(y.surplus))) * 1.15;
  const syR = (v) => revBot - (v / maxRev) * (revBot - revTop);
  const nil = surTop + (surBot - surTop) * 0.46;
  const syS = (v) => nil - (v / maxSur) * ((surBot - surTop) * 0.46);

  const defs = hatchDefs('rev', 1.6, '#8194AB', 45, RULE.hatch)
    + hatchDefs('sur', 1.5, K.goldLeaf, 90, RULE.hatch);
  let body = '';
  const turns = years.findIndex((y) => y.surplus >= 0);

  // ── The year the institution turns, ruled through both registers ──
  if (turns > 0) {
    const tx = x0 + turns * bw + bw / 2;
    body += `<line x1="${r2(tx)}" y1="${revTop - 4}" x2="${r2(tx)}" y2="${surBot + 3}"
      stroke="${K.gold}" stroke-width="${RULE.structure}" stroke-dasharray="2.4 1.8"/>`;
    /* Annotated at the FOOT of its own rule, beside the surplus
       register it describes. Set at the top it sat next to the "Net
       tuition" label and the two read as one confused line. */
    body += `<text x="${r2(tx + 2.6)}" y="${r2(surBot + 8)}" font-family="${DATA}" font-size="5.6"
      font-weight="600" fill="${K.gold}">Surplus from ${esc(years[turns].calendar)}</text>`;
  }

  // ── Register one: net tuition ────────────────────────────────────
  body += label(x0, revTop - 5.5, opts.revenueLabel || 'Net tuition', { size: 5.8, fill: K.soft, weight: 500 });
  body += `<line x1="${x0 - 3}" y1="${r2(revBot)}" x2="${r2(x1)}" y2="${r2(revBot)}"
    stroke="${K.ink}" stroke-width="${RULE.structure}"/>`;
  years.forEach((y, i) => {
    const bx = x0 + i * bw;
    body += `<rect x="${r2(bx + bw * 0.15)}" y="${r2(syR(y.netTuition))}"
      width="${r2(bw * 0.7)}" height="${r2(revBot - syR(y.netTuition))}"
      fill="url(#rev)" stroke="${K.soft}" stroke-width="${RULE.grid}"/>`;
  });

  /* THE DOMINANT ELEMENT: what the decade closes at. */
  const last = years[years.length - 1];
  const lastY = syR(last.netTuition);
  body += `<line x1="${r2(x1 + 1)}" y1="${r2(lastY)}" x2="${r2(x1 + 5)}" y2="${r2(lastY)}"
    stroke="${K.gold}" stroke-width="${RULE.structure}"/>`;
  /* RIGHT-ALIGNED TO THE PLATE, not set at an offset and hoped for.
     Estimating the advance width of "$17.0M" got it wrong twice and
     clipped the one element that must not be clipped. Anchored to the
     trim it cannot be clipped whatever the string turns out to be, and
     a terminal figure ranged right is the better composition anyway. */
  const figX = W - 3;
  body += figureValue(figX, lastY + 2.6, `$${(last.netTuition / 1e6).toFixed(1)}M`, 13,
    { weight: 500, anchor: 'end' });
  /* Six and a half units below the figure's baseline put the year's
     cap line into the tail of the dollar sign — which descends in this
     face, as it does in most serifs. The interval is now the figure's
     descender plus a line of air. */
  body += `<text x="${r2(figX)}" y="${r2(lastY + 10.8)}" font-family="${TEXT}" font-size="6.4"
    fill="${K.grey}" text-anchor="end">in ${esc(last.calendar)}</text>`;

  // ── Register two: surplus, on its own baseline ───────────────────
  body += label(x0, surTop - 5, 'Surplus', { size: 5.8, fill: K.soft, weight: 500 });
  body += `<line x1="${x0 - 3}" y1="${r2(nil)}" x2="${r2(x1)}" y2="${r2(nil)}"
    stroke="${K.gold}" stroke-width="${RULE.structure}"/>`;
  years.forEach((y, i) => {
    const bx = x0 + i * bw;
    const yy = syS(y.surplus);
    const h = Math.abs(nil - yy);
    const up = y.surplus >= 0;
    body += `<rect x="${r2(bx + bw * 0.15)}" y="${r2(up ? yy : nil)}"
      width="${r2(bw * 0.7)}" height="${r2(Math.max(0.4, h))}"
      fill="${up ? 'url(#sur)' : 'none'}" stroke="${up ? K.gold : K.crimson}"
      stroke-width="${RULE.grid}"/>`;
    // Axis years sit below the annotation, not in it.
    if (i % 2 === 0) {
      body += label(bx + bw / 2, surBot + 15, String(y.calendar).slice(2),
        { anchor: 'middle', size: 5.6, fill: K.grey, weight: 400 });
    }
  });
  // Beside the rule it marks, not stranded at the trim.
  body += `<text x="${r2(x1 + 4)}" y="${r2(nil + 2)}" font-family="${DATA}" font-size="5.4"
    font-weight="500" fill="${K.gold}">nil</text>`;

  return figure(W, H, body, defs);
}


// ════════════════════════════════════════════════════════════════════
// 5 · WHAT ONE NEGOTIATION BUYS — acquisition, amortised
// ════════════════════════════════════════════════════════════════════
/**
 * Why the institutional channels exist, drawn once. Retail acquisition
 * is paid per learner and never amortises; an agreement is paid once and
 * divided by the seats it carries. Areas are proportional to cost per
 * seat, so the collapse is the figure.
 */
export function amortisation(retail, channels) {
  /* GEOMETRY, CORRECTED. The first cut anchored its section headings to
     the END of x0-5, so "Acquired one at a time" ran off the left of
     the plate and printed as "NE AT A TIME". Headings now start at the
     left margin and the names are right-aligned into a fixed gutter,
     which is the arrangement a table of this shape actually wants. The
     plate is also taller: at 92 units it filled under half its page. */
  const W = 168;
  /* AND THE GUTTER IS MEASURED TOO. At a flat 52 it held "Corporate"
     and cut "Gulf professional" and "UK and Europe" off the left edge.
     It is now the widest name in either group, and the right margin is
     the widest figure plus the note beneath it. */
  const names = [...retail, ...channels].map((r) => r.name);
  const NAME = 6.8;
  const gutter = Math.ceil(Math.max(...names.map((n) => setWidth(n, NAME, { face: TEXT, weight: 400 })))) + 5;
  const x0 = gutter + 4;
  /* The money sits in a column flush to the plate edge, as it does in
     the threshold plate — so five acquisition costs align with one
     another instead of each starting wherever its own bar happened to
     stop, and the bars get the width that arrangement releases. */
  const tailW = Math.max(
    ...retail.map((r) => setWidth(`$${Math.round(r.cac).toLocaleString()}`, 7, { weight: 500 })),
    ...channels.map((c) => setWidth(`$${Math.round(c.cac).toLocaleString()}`, 8.4, { weight: 600 })),
    ...channels.map((c) => setWidth(c.note, 5.8, { face: TEXT, weight: 400 })),
  );
  const x1 = W - Math.ceil(tailW) - 9;
  const max = Math.max(...retail.map((r) => r.cac), ...channels.map((c) => c.cac));
  const sx = (v) => x0 + (v / (max * 1.06)) * (x1 - x0);
  const defs = hatchDefs('amort', 1.5, K.goldLeaf, 90, 0.55);
  let body = '';
  let y = 24;

  body += `<text x="4" y="${r2(y - 7)}" font-family="${DATA}" font-size="6" font-weight="600"
    letter-spacing="${TRACK.caps}" fill="${K.soft}" style="text-transform:uppercase">Acquired one at a time</text>`;
  retail.forEach((r) => {
    body += `<text x="${gutter}" y="${r2(y + 2.4)}" font-family="${TEXT}" font-size="${NAME}"
      fill="${K.ink}" text-anchor="end">${esc(r.name)}</text>`;
    body += `<rect x="${x0}" y="${r2(y - 2.9)}" width="${r2(sx(r.cac) - x0)}" height="5.8"
      fill="none" stroke="${K.soft}" stroke-width="0.5"/>`;
    body += `<text x="${r2(W - 4)}" y="${r2(y + 2.4)}" font-family="${DATA}" font-size="7"
      font-weight="500" fill="${K.soft}" text-anchor="end"
      style="font-variant-numeric:lining-nums tabular-nums">$${Math.round(r.cac).toLocaleString()}</text>`;
    y += 20;
  });

  y += 10;
  body += `<line x1="4" y1="${r2(y - 9)}" x2="${r2(W - 4)}" y2="${r2(y - 9)}"
    stroke="${K.rule}" stroke-width="0.35"/>`;
  body += `<text x="4" y="${r2(y - 3)}" font-family="${DATA}" font-size="6" font-weight="600"
    letter-spacing="${TRACK.caps}" fill="${K.gold}" style="text-transform:uppercase">One negotiation, many seats</text>`;
  y += 9;

  channels.forEach((c) => {
    body += `<text x="${gutter}" y="${r2(y + 2.4)}" font-family="${TEXT}" font-size="${NAME}"
      fill="${K.ink}" text-anchor="end">${esc(c.name)}</text>`;
    body += `<rect x="${x0}" y="${r2(y - 2.9)}" width="${r2(Math.max(1.2, sx(c.cac) - x0))}" height="5.8"
      fill="url(#amort)" stroke="${K.gold}" stroke-width="0.55"/>`;
    body += `<text x="${r2(W - 4)}" y="${r2(y + 2.6)}" font-family="${DATA}" font-size="8.4"
      font-weight="600" fill="${K.midnight}" text-anchor="end"
      style="font-variant-numeric:lining-nums tabular-nums">$${Math.round(c.cac).toLocaleString()}</text>`;
    body += `<text x="${r2(W - 4)}" y="${r2(y + 9.4)}" font-family="${TEXT}" font-size="5.8"
      fill="${K.grey}" text-anchor="end">${esc(c.note)}</text>`;
    y += 30;
  });

  /* The point of the plate, set once at its foot where the eye lands
     after reading down the two groups. */
  const best = Math.min(...channels.map((c) => c.cac));
  const worst = Math.max(...retail.map((r) => r.cac));
  y += 5;
  body += `<line x1="4" y1="${r2(y)}" x2="${r2(W - 4)}" y2="${r2(y)}" stroke="${K.gold}" stroke-width="1.2"/>`;
  /* THE CLOSER. The multiple is struck at 23 point and the sentence
     runs beside it — which means the sentence starts where the
     multiple ends and breaks where the plate does, both measured. It
     was previously set on two hand-broken lines from a fixed x of 32,
     and the first of them ran off the right edge. */
  const mult = `${(worst / best).toFixed(1)}×`;
  const multW = setWidth(mult, 23, { face: DISPLAY, weight: 500 });
  const tx = 4 + multW + 6;
  const lines = wrapTo('cheaper to acquire a seat through an agreement than a Gulf executive one at a time.',
    W - 4 - tx, 7, { face: TEXT, weight: 400 });
  body += `<text x="4" y="${r2(y + 15)}" font-family="${DISPLAY}" font-size="23"
    font-weight="500" letter-spacing="${r2(-23 * 0.012)}" fill="${K.midnight}"
    style="font-variant-numeric:lining-nums tabular-nums">${esc(mult)}</text>`;
  lines.forEach((ln, i) => {
    body += `<text x="${r2(tx)}" y="${r2(y + 10.5 + i * 7.4)}" font-family="${TEXT}" font-size="7"
      fill="${K.inkSoft}">${esc(ln)}</text>`;
  });

  return figure(W, y + 12 + Math.max(8, lines.length * 7.4) + 6, body, defs);
}

// ════════════════════════════════════════════════════════════════════
// 6 · THE RISK MATRIX
// ════════════════════════════════════════════════════════════════════
/** Twenty risks placed on likelihood against impact. A register is a
 *  list; a matrix is a judgement about where attention goes. */
export function riskMatrix(risks) {
  /* WHAT THE FIRST VERSION DID NOT SAY.
     It drew nine cells, put a numeral in the six that had risks in
     them, and left the other three blank — so a cell that holds no
     risk looked exactly like a cell the plate had forgotten, which is
     dead space in a figure whose entire subject is where attention
     goes. It also hatched the two cells that were both hot AND
     occupied, which drew a band across the middle of the grid rather
     than the region a board would actually watch.

     Redrawn, it carries three readings instead of one: the count in
     every cell, the weight of each cell as hatch density, and a struck
     gold threshold around the region where likelihood is at least
     medium and impact at least high — the region whose contents are
     the ones that get managed. The figure closes on how many of the
     register stand inside it. */
  const W = 168;
  const L = ['Low', 'Medium', 'High'];
  const I = ['Medium', 'High', 'Severe'];
  const x0 = 34, y0 = 15;
  const gridW = W - x0 - 10, gridH = 132;
  const cw = gridW / L.length, ch = gridH / I.length;
  const cellX = (a) => x0 + a * cw;
  const cellY = (b) => y0 + (I.length - 1 - b) * ch;
  const count = (a, b) => risks.filter((r) => r[2] === L[a] && r[3] === I[b]).length;
  /* ABOVE THE LINE: likely enough to expect and heavy enough to hurt. */
  const above = (a, b) => a >= 1 && b >= 1;

  const counts = [];
  for (let a = 0; a < L.length; a += 1) for (let b = 0; b < I.length; b += 1) counts.push(count(a, b));
  const heaviest = Math.max(1, ...counts);

  /* One hatch per distinct count, pitched by weight — a denser cell is
     a fuller cell, which is the same rule every other plate uses. */
  /* On the square root, not the count. Pitched linearly, a cell of one
     and a cell of six hatched at 3.2 and 1.6 units and the grid read
     as uniformly busy; the difference has to be visible at a glance or
     the density is decoration. */
  const pitchFor = (n) => r2(4.8 - 3.7 * Math.sqrt(n / heaviest));
  let defs = '';
  const seen = new Set();
  for (const n of counts) {
    if (!n || seen.has(n)) continue;
    seen.add(n);
    defs += hatchDefs(`rk${n}`, pitchFor(n), K.faint, 45, 0.42);
  }

  let body = '';
  for (let a = 0; a < L.length; a += 1) {
    for (let b = 0; b < I.length; b += 1) {
      const n = count(a, b);
      const x = cellX(a), y = cellY(b);
      body += `<rect x="${r2(x)}" y="${r2(y)}" width="${r2(cw)}" height="${r2(ch)}"
        fill="${n ? `url(#rk${n})` : 'none'}" stroke="${K.rule}" stroke-width="${RULE.grid}"/>`;
      /* Optically centred on the CAP LINE, not on the baseline. A
         17-point figure hung three units under the middle of its cell
         sat visibly in the upper half of it and disagreed with the row
         label beside it. */
      const cx = x + cw / 2, cy = y + ch / 2;
      body += n
        ? `<text x="${r2(cx)}" y="${r2(cy + 6)}" font-family="${DISPLAY}" font-size="17"
            font-weight="500" letter-spacing="${r2(-17 * 0.012)}"
            fill="${above(a, b) ? K.crimson : K.midnight}" text-anchor="middle"
            style="font-variant-numeric:lining-nums tabular-nums">${n}</text>`
        : `<line x1="${r2(cx - 3)}" y1="${r2(cy)}" x2="${r2(cx + 3)}" y2="${r2(cy)}"
            stroke="${K.rule}" stroke-width="0.6"/>`;
    }
  }

  /* THE THRESHOLD, struck in gold along the two sides that divide the
     watched region from the rest. Gold marks a threshold in this
     library and never an outline, so it traces the boundary rather
     than boxing the corner. */
  const tx = cellX(1), ty = cellY(I.length - 1);
  body += `<path d="M ${r2(tx)} ${r2(ty + gridH - ch * 1)} L ${r2(tx)} ${r2(ty)}
    L ${r2(x0 + gridW)} ${r2(ty)}" fill="none" stroke="${K.gold}" stroke-width="${RULE.struck}"
    stroke-linejoin="miter"/>`;

  const bot = y0 + gridH;
  L.forEach((l, a) => { body += label(cellX(a) + cw / 2, bot + 7, l, { anchor: 'middle', size: 5.4, fill: K.soft }); });
  I.forEach((l, b) => { body += label(x0 - 4, cellY(b) + ch / 2 + 1.8, l, { anchor: 'end', size: 5.4, fill: K.soft }); });
  body += label(x0 + gridW / 2, bot + 15, 'Likelihood', { anchor: 'middle', size: 6, fill: K.gold, weight: 600 });
  body += `<text transform="translate(9 ${r2(y0 + gridH / 2)}) rotate(-90)" font-family="${DATA}"
    font-size="6" font-weight="600" fill="${K.gold}" text-anchor="middle">Impact</text>`;

  /* THE READING. A matrix that does not say how much of the register
     is above its own line has made the reader count nine cells. */
  const watched = counts.reduce((t, n, i) => {
    const a = Math.floor(i / I.length), b = i % I.length;
    return t + (above(a, b) ? n : 0);
  }, 0);
  const footY = bot + 36;
  body += `<line x1="4" y1="${r2(footY - 11)}" x2="${r2(W - 4)}" y2="${r2(footY - 11)}"
    stroke="${K.rule}" stroke-width="0.35"/>`;
  const nW = setWidth(String(watched), 13, { face: DISPLAY, weight: 500 });
  const tx0 = 4 + nW + 5;
  const lines = wrapTo(`of ${risks.length} stand above the line — likely enough to expect, `
    + 'heavy enough to plan for.', W - 4 - tx0, 6.8, { face: TEXT, weight: 400 });
  /* Aligned on the CAP LINE with the first line beside it, not on its
     own baseline — a 13-point figure and a 6.8-point line share a
     baseline only by accident. */
  body += figureValue(4, footY + 0.9, String(watched), 13, { weight: 500 });
  lines.forEach((ln, i) => {
    body += `<text x="${r2(tx0)}" y="${r2(footY - 3.4 + i * 7)}" font-family="${TEXT}" font-size="6.8"
      fill="${K.inkSoft}">${esc(ln)}</text>`;
  });

  /* The plate is exactly as tall as it needs to be — the foot rule,
     the struck total, and however many lines the statement takes,
     with room under the last baseline for its descenders. */
  const lastBaseline = footY - 3.4 + (lines.length - 1) * 7;
  return figure(W, Math.max(lastBaseline + 6, footY + 8), body, defs);
}

export { K as FIG_COLOURS };
