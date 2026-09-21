/**
 * THE CHAPTER DATUMS — seven drawings, each made of its own chapter.
 *
 * ════════════════════════════════════════════════════════════════════
 * WHY THIS FILE EXISTS
 * ════════════════════════════════════════════════════════════════════
 * Every chapter of this book used to open on a photograph. Westminster
 * stood for the proposition, a reading hall for the institution, an old
 * map for the market, a letterpress for commerce, an astrolabe for the
 * decade, a manuscript for method. Each was conceptually legible and
 * none of them was NECESSARY, and seven of them in a row made the
 * publication read as a luxury strategy report rather than as the
 * intellectual architecture of an institution. The owner ruled them
 * out on 20 September 2026 and the ruling is not to be relitigated by
 * finding better photographs.
 *
 * What replaces them is not emptiness. It is the chapter's own content,
 * drawn.
 *
 *   I    THE PROPOSITION   three resolutions, as three struck registers
 *   II   THE INSTITUTION   six levels, as an ascending stair A1 to C2
 *   III  THE MARKET        five segments, ranked by reachable population
 *   IV   COMMERCIAL        six tiers, as a tariff colonnade
 *   V    FINANCIAL         one column divided 25 · 5 · 10 · 10 · 25 · 25
 *   VI   THE DECADE        ten years, with the year the institution turns
 *   VII  METHOD            four files, three engines, one publication
 *
 * Nothing here is decoration. Every rule in every drawing is a quantity
 * the book computes elsewhere, and if a figure moves the drawing moves
 * with it.
 *
 * ════════════════════════════════════════════════════════════════════
 * THE REGISTER, AND WHY IT IS PALER THAN figures.mjs
 * ════════════════════════════════════════════════════════════════════
 * These are DATUMS, not plates. A chapter opener has one job — to say
 * where the reader is and what is coming — so its drawing stands behind
 * the title rather than competing with it. The analytical plates in
 * figures.mjs are struck at full strength because they carry an
 * argument; these are drawn one tone down, with a single gold mark
 * apiece, and they are never the loudest thing on their page.
 *
 * The drawing grammar is shared with figures.mjs deliberately: line
 * only, hatching for density, hairlines in a strict ladder, gold for a
 * threshold and nothing else. A reader who has learnt the plates can
 * read these without being taught twice.
 */

import { setWidth, esc, r2, hatchDefs } from './figures.mjs';

/**
 * A DATUM IS NOT A PLATE, AND IT IS NOT THE SAME SIZE AS ONE.
 *
 * figures.mjs prints its plates at a declared .46mm to the unit —
 * about 77mm across — because those drawings are authored in a
 * chart-sized coordinate system. These are authored in millimetres
 * and run the full 175mm measure under a chapter title, so they emit
 * their own <svg> rather than borrowing that one. Sharing it made
 * every opener print at 80mm: a correct little drawing, marooned in
 * the top-left corner of a page that then had nothing else on it.
 */
const figure = (w, h, inner, defs = '') =>
  `<svg class="fig fig--datum" viewBox="0 0 ${w} ${h}" width="100%"
    xmlns="http://www.w3.org/2000/svg" style="display:block" role="img">
    ${defs ? `<defs>${defs}</defs>` : ''}${inner}</svg>`;

/* One tone down from the plates. `mark` is the single gold; `faint` is
   the ground rule that carries everything. */
/**
 * THE DATUM IS DRAWN IN ITS CHAPTER'S PALETTE.
 *
 * Eight parts, eight combinations, and a drawing that assumed one
 * ground would be invisible on half of them — champagne rules on
 * ivory, or charcoal ink on deep sapphire. So every datum takes a
 * TONE, and the tones below are the drawing side of the same eight
 * palettes the page masters carry.
 *
 * `O` is assigned at the top of each exported function rather than
 * threaded through forty call sites. That is mutable module state,
 * which is normally a mistake and is deliberate here: this is a
 * synchronous build script, one drawing is composed at a time from
 * start to finish, and the alternative was a tone argument on every
 * one of the small helpers that actually emit the marks.
 */
export const TONES = {
  /* On a deep field a drawing is made of light: champagne rules, pearl
     figures, and the struck mark in leaf gold — the only thing on the
     page brighter than the title. */
  onSapphire: { line: 'rgba(235,201,111,.46)', faint: 'rgba(235,201,111,.20)',
    ink: '#F4F1E8', grey: 'rgba(244,241,232,.66)', mark: '#EBC96F', markPale: 'rgba(235,201,111,.40)' },
  onDeep: { line: 'rgba(235,201,111,.42)', faint: 'rgba(235,201,111,.18)',
    ink: '#F4F1E8', grey: 'rgba(244,241,232,.62)', mark: '#D9A83C', markPale: 'rgba(217,168,60,.38)' },
  /* On a ceremonial field the exception mark is garnet lifted enough to
     hold against sapphire — a seal, seen in low light. */
  onCeremonial: { line: 'rgba(235,201,111,.42)', faint: 'rgba(235,201,111,.18)',
    ink: '#F4F1E8', grey: 'rgba(244,241,232,.66)', mark: '#EBC96F', markPale: 'rgba(201,87,107,.40)' },
  /* On warm grounds the drawing is made of ink again, and the metal
     steps down to bronze so it belongs to the paper. */
  onIvory: { line: '#C6B08A', faint: '#E3D6BA', ink: '#3A4152', grey: '#8A7A62',
    mark: '#8A5A2B', markPale: 'rgba(138,90,43,.34)' },
  onCream: { line: '#CBB68F', faint: '#E6DABF', ink: '#3A4152', grey: '#8A8168',
    mark: '#96671A', markPale: 'rgba(150,103,26,.32)' },
  onPearl: { line: '#C9BFA6', faint: '#E8E1CF', ink: '#39435A', grey: '#7C8496',
    mark: '#96671A', markPale: 'rgba(150,103,26,.30)' },
};

const O = { ...TONES.onSapphire };
const useTone = (tone) => Object.assign(O, TONES[tone] || TONES.onSapphire);

const DATA = "'Archivo','Liberation Sans',sans-serif";
const SERIF = "'Newsreader','Bitstream Charter',serif";

/** The measure, in millimetres. Every datum is drawn to the text block
 *  so it lines up with the title standing above it, which means ONE
 *  VIEWBOX UNIT IS ONE MILLIMETRE. */
export const W = 175;

/**
 * SIZES ARE IN POINTS, AND THEY HAVE TO BE CONVERTED.
 *
 * One unit here is a millimetre, so `font-size="4.8"` is 4.8mm —
 * THIRTEEN AND A HALF POINTS, twice the size of the caption beneath
 * it and a third larger than the running text. The first cut of these
 * datums did exactly that, and the chapter opener came back looking
 * like a slide. The same fault, from the same cause, is written up at
 * length in figures.mjs: the drawing was internally consistent and
 * nobody had written down how big it is on paper.
 *
 * So `P(7)` is seven points, measured on the printed page, and every
 * size and stroke below is stated in the units the book's typography
 * is stated in.
 */
const P = (points) => Math.round(points * (25.4 / 72) * 100) / 100;

const tx = (x, y, t, o = {}) => `<text x="${r2(x)}" y="${r2(y)}"
  font-family="${o.face || DATA}" font-size="${P(o.size || 6.5)}"
  font-weight="${o.weight || 500}" fill="${o.fill || O.grey}"
  text-anchor="${o.anchor || 'start'}"
  ${o.nums === false ? '' : 'style="font-variant-numeric:lining-nums tabular-nums"'}
  >${esc(t)}</text>`;

/** The set width of a label, in millimetres, from its size in points. */
const wide = (t, o = {}) => setWidth(t, P(o.size || 6.5), { weight: o.weight || 500, face: o.face });

/** A label that will not run off the right edge of the measure. */
const txClamped = (x, y, t, o = {}) => tx(Math.min(x, W - 0.5 - wide(t, o)), y, t, o);

/* ════════════════════════════════════════════════════════════════════
   I · THE PROPOSITION — three resolutions, as three struck registers
   ════════════════════════════════════════════════════════════════════
   The chapter asks for exactly three decisions, so the drawing is
   exactly three bars. Their lengths are not arbitrary: each is the
   share of the decade's revenue that the decision governs — the
   framework governs all of it, the tariff governs tuition, the
   channels govern the part of it that arrives through an agreement. */
export function resolutions(rows, tone) {
  useTone(tone);
  const H = 105;
  const x0 = 0, x1 = W;
  const top = 20, step = 32;
  let body = '';
  const widest = Math.max(...rows.map((r) => r.share));
  rows.forEach((r, i) => {
    const y = top + i * step;
    const len = (r.share / widest) * (x1 - x0);
    /* Ordinal and figure share one line ABOVE the bar, at opposite
       ends of the measure; the title sits below it. Set beside the
       bar's own end they drifted with its length and collided with
       the title on the row where the bar ran the full width. */
    body += tx(x0, y - 2.6, r.ordinal, { size: 6.4, weight: 600, fill: O.mark, nums: false });
    /* Inset from the measure, not set on it. Anchored exactly at W the
       advance ends on the edge and the last glyph's side bearing
       crosses it — half a millimetre nobody would see and the fit
       guard would fail on, correctly. */
    body += tx(W - 0.6, y - 2.6, r.figure, { size: 6.6, weight: 600, fill: O.grey, anchor: 'end' });
    body += `<line x1="${x0}" y1="${r2(y)}" x2="${r2(x1)}" y2="${r2(y)}"
      stroke="${O.faint}" stroke-width="${P(0.3)}"/>`;
    body += `<line x1="${x0}" y1="${r2(y)}" x2="${r2(x0 + len)}" y2="${r2(y)}"
      stroke="${i === 0 ? O.mark : O.line}" stroke-width="${P(i === 0 ? 1.6 : 1)}"/>`;
    body += tx(x0, y + 5, r.title, { size: 11, weight: 400, face: SERIF, fill: O.ink, nums: false });
  });
  return figure(W, H, body);
}

/* ════════════════════════════════════════════════════════════════════
   II · THE INSTITUTION — six levels, as an ascending stair
   ════════════════════════════════════════════════════════════════════
   The College's whole academic claim is that it teaches a complete
   ladder from A1 to C2 in six equal levels, each conferring its own
   award. A stair is what that IS, so a stair is what is drawn: six
   equal treads, the cumulative hours climbing with them, and the final
   tread struck because it is the one that completes the pathway. */
export function ascent(levels, hoursPerLevel, tone) {
  useTone(tone);
  const H = 100;
  const base = H - 12;
  const tread = W / levels.length;
  const rise = (base - 10) / levels.length;
  let body = '';
  body += `<line x1="0" y1="${r2(base)}" x2="${W}" y2="${r2(base)}"
    stroke="${O.line}" stroke-width="${P(0.9)}"/>`;
  levels.forEach((l, i) => {
    const x = i * tread;
    const y = base - (i + 1) * rise;
    const last = i === levels.length - 1;
    body += `<path d="M ${r2(x)} ${r2(y + rise)} L ${r2(x)} ${r2(y)} L ${r2(x + tread)} ${r2(y)}"
      fill="none" stroke="${last ? O.mark : O.line}" stroke-width="${P(last ? 1.4 : 0.7)}"/>`;
    /* The riser dropped to the ground rule, so each tread reads as a
       level standing on the same floor rather than as a staircase
       hanging in the air. */
    body += `<line x1="${r2(x)}" y1="${r2(y)}" x2="${r2(x)}" y2="${r2(base)}"
      stroke="${O.faint}" stroke-width="${P(0.3)}"/>`;
    body += tx(x + 1.6, y - 1.6, l.cefr, { size: 9, weight: 600, fill: last ? O.mark : O.ink, face: SERIF });
    body += tx(x + 1.6, base + 4, `${(i + 1) * hoursPerLevel}`, { size: 6.4, fill: O.grey });
  });
  body += txClamped(0, base + 8.4, 'Cumulative academic hours', { size: 6, fill: O.grey });
  return figure(W, H, body);
}

/* ════════════════════════════════════════════════════════════════════
   III · THE MARKET — five segments, ranked by reachable population
   ════════════════════════════════════════════════════════════════════
   The chapter's finding is that the markets are not the sizes an
   earlier draft assumed, and that the largest by population is nearly
   the smallest by willingness to pay. Both facts are in one ranked
   scale: length is reach, and the hatched portion is the part of that
   reach the research actually reached. */
export function reach(rows, tone) {
  useTone(tone);
  const H = 105;
  /* RANKED, because a ranked scale that is not in rank order is just a
     bar chart. The finding this drawing carries is that the largest
     market by population is nearly the smallest by willingness to pay,
     and that only lands if the order is the order. */
  const sorted = rows.slice().sort((a, b) => b.reachable - a.reachable);
  const gutter = Math.ceil(Math.max(...sorted.map((r) => wide(r.name, { size: 6.6 })))) + 4;
  const x0 = gutter, x1 = W - 16;
  const widest = Math.max(...sorted.map((r) => r.reachable));
  const top = 12, step = (H - 26) / sorted.length;
  const bar = 7;
  let defs = hatchDefs('opEv', P(1.8), O.markPale, 90, P(0.5));
  let body = '';
  sorted.forEach((r, i) => {
    const y = top + i * step;
    const len = (r.reachable / widest) * (x1 - x0);
    body += tx(x0 - 2.4, y + bar / 2 + 1, r.name, { size: 6.6, anchor: 'end', fill: O.ink });
    /* A researched segment is ruled and hatched; a modelled one is
       drawn in a broken line, which is the difference the chapter is
       about and has to survive being seen from a metre away. */
    body += `<rect x="${r2(x0)}" y="${r2(y)}" width="${r2(len)}" height="${bar}"
      fill="${r.researched ? 'url(#opEv)' : 'none'}"
      stroke="${r.researched ? O.mark : O.line}" stroke-width="${P(r.researched ? 0.9 : 0.6)}"
      ${r.researched ? '' : `stroke-dasharray="${P(2.6)} ${P(1.8)}"`}/>`;
    body += tx(x0 + len + 2.4, y + bar / 2 + 1, `${(r.reachable / 1000).toFixed(1)}k`,
      { size: 6.4, fill: O.grey });
  });
  body += `<line x1="${r2(x0)}" y1="${r2(top + sorted.length * step - step + bar + 7)}"
    x2="${r2(W)}" y2="${r2(top + sorted.length * step - step + bar + 7)}"
    stroke="${O.faint}" stroke-width="${P(0.4)}"/>`;
  return figure(W, H, body, defs);
}

/* ════════════════════════════════════════════════════════════════════
   IV · THE COMMERCIAL ARCHITECTURE — six tiers, as a colonnade
   ════════════════════════════════════════════════════════════════════
   Six columns of one order, at six heights. The tariff is a single
   architecture rather than six prices, which is the chapter's whole
   argument, so it is drawn as one row of columns standing on one
   floor — and the gold datum is the entry price, the one every other
   tier is a multiple of. */
export function colonnade(tiers, tone) {
  useTone(tone);
  const H = 100;
  const base = H - 10;
  const cw = W / tiers.length;
  const shaft = cw * 0.4;
  const tallest = Math.max(...tiers.map((t) => t.price));
  const rise = base - 16;
  const entry = (tiers.find((t) => t.entry) || tiers[0]).price;
  let defs = hatchDefs('opCol', P(2.2), O.faint, 90, P(0.45));
  let body = '';
  body += `<line x1="0" y1="${r2(base)}" x2="${W}" y2="${r2(base)}"
    stroke="${O.line}" stroke-width="${P(1.2)}"/>`;
  tiers.forEach((t, i) => {
    const cx = i * cw + cw / 2;
    const h = (t.price / tallest) * rise;
    const y = base - h;
    /* Shaft, then a capital wider than it — an order, not a bar chart.
       The shaft is ruled inside as well as outlined, because at this
       size two hairlines 12mm apart read as two hairlines. */
    body += `<rect x="${r2(cx - shaft / 2)}" y="${r2(y + 1.6)}" width="${r2(shaft)}" height="${r2(Math.max(0.6, h - 1.6))}"
      fill="url(#opCol)" stroke="${t.entry ? O.mark : O.line}" stroke-width="${P(0.8)}"/>`;
    body += `<rect x="${r2(cx - shaft / 2 - 1.4)}" y="${r2(y)}" width="${r2(shaft + 2.8)}" height="1.6"
      fill="none" stroke="${t.entry ? O.mark : O.line}" stroke-width="${P(t.entry ? 1.4 : 0.8)}"/>`;
    /* THE MULTIPLE, which is what the chapter actually argues: the
       routes differ by a factor of thirty-eight because what they
       differ in is human attention. Drawn linearly, the entry tier is
       a line on the floor and the reader cannot see why — the
       multiple says why. */
    const mult = t.price / entry;
    body += tx(cx, y - 3.4, mult < 1.05 ? 'entry' : `×${mult < 10 ? mult.toFixed(1) : Math.round(mult)}`,
      { size: 7, anchor: 'middle', weight: 600, face: SERIF,
        fill: t.entry ? O.mark : O.ink, nums: false });
    body += tx(cx, base + 4.4, t.short, { size: 6, anchor: 'middle', fill: O.ink, nums: false });
    body += tx(cx, base + 8.6, t.money, { size: 6.4, anchor: 'middle', fill: O.grey });
  });
  return figure(W, H, body, defs);
}

/* ════════════════════════════════════════════════════════════════════
   V · THE FINANCIAL ARCHITECTURE — one column, divided
   ════════════════════════════════════════════════════════════════════
   A slim echo of the capital architecture plate that carries the
   argument later in the book: four courses consumed running the
   institution, a struck rule, two retained above it as capital. Laid
   on its side here so it sits under a title rather than beside one,
   and drawn at a fraction of the plate's weight so the reader meets
   the idea before meeting the case for it. */
export function course(lines, tone) {
  useTone(tone);
  const H = 92;
  const y0 = 30, h = 34;
  const total = lines.reduce((t, l) => t + l.share, 0);
  let defs = '';
  const pitchFor = (share) => r2(3.4 - 2.1 * Math.sqrt(share / 0.25));
  lines.forEach((l, i) => { defs += hatchDefs(`opC${i}`, pitchFor(l.share), l.retained ? O.markPale : O.faint, 45, 0.45); });
  let body = '';
  let x = 0;
  lines.forEach((l, i) => {
    const w = (l.share / total) * W;
    body += `<rect x="${r2(x)}" y="${y0}" width="${r2(w)}" height="${h}"
      fill="url(#opC${i})" stroke="${l.retained ? O.mark : O.line}" stroke-width="${P(0.55)}"/>`;
    const pc = `${Math.round(l.share * 100)}%`;
    const pw = wide(pc, { size: 10, face: SERIF, weight: 500 });
    if (w > pw + 3) {
      body += tx(x + w / 2, y0 - 2, pc, { size: 10, anchor: 'middle', face: SERIF, weight: 500,
        fill: l.retained ? O.mark : O.ink });
    }
    /* A NARROW COURSE STILL GETS ITS NAME. Technology is five per
       cent of the column and its cell is nine millimetres wide, so
       the name would not fit under it and was simply dropped — one
       of the six allocations silently unlabelled in the drawing of
       the six allocations. It drops to a second row instead, with a
       tick up to its own cell. */
    const nw = wide(l.name, { size: 6 });
    if (w > nw + 2) {
      body += tx(x + w / 2, y0 + h + 4, l.name, { size: 6, anchor: 'middle', fill: O.grey, nums: false });
    } else {
      body += `<line x1="${r2(x + w / 2)}" y1="${r2(y0 + h + 1)}" x2="${r2(x + w / 2)}" y2="${r2(y0 + h + 6)}"
        stroke="${O.line}" stroke-width="${P(0.4)}"/>`;
      body += tx(x + w / 2, y0 + h + 9.4, l.name, { size: 6, anchor: 'middle', fill: O.grey, nums: false });
    }
    x += w;
  });
  /* The struck rule divides consumed from retained. */
  const cut = lines.reduce((a, l) => a + (l.retained ? 0 : l.share), 0) / total * W;
  body += `<line x1="${r2(cut)}" y1="${r2(y0 - 6)}" x2="${r2(cut)}" y2="${r2(y0 + h + 8)}"
    stroke="${O.mark}" stroke-width="${P(1.6)}"/>`;
  body += tx(0, H - 3, 'Consumed running the institution', { size: 6, fill: O.grey, nums: false });
  const rl = 'Retained as institutional capital';
  body += tx(W, H - 3, rl, { size: 6, anchor: 'end', fill: O.mark, nums: false });
  return figure(W, H, body, defs);
}

/* ════════════════════════════════════════════════════════════════════
   VI · THE DECADE — ten years, and the one that turns
   ════════════════════════════════════════════════════════════════════
   A rule with ten stations on it. The station where cumulative surplus
   first crosses nil is struck in gold, because that single year is what
   the chapter is about, and the two ends carry the figures that bound
   the decade. */
export function decadeRule(years, turnIndex, tone) {
  useTone(tone);
  /* DRAWN AS COLUMNS, NOT TICKS. The first cut set ten hairlines on a
     rule, which read as a comb: the struck year was barely taller than
     its neighbours, the ground rule was invisible at .35mm, and the
     caption floated twenty millimetres above the year it names with
     nothing joining them. Ten ruled columns on a struck floor, with a
     gold leader from the turning year up to its own caption, is the
     same information and an architecture. */
  const H = 95;
  const base = 72;
  const x0 = 2, x1 = W - 2;
  const step = (x1 - x0) / years.length;
  const colW = step * 0.34;
  const tallest = Math.max(...years.map((v) => v.height));
  const rise = base - 26;
  const defs = hatchDefs('opDec', P(2), O.faint, 90, P(0.45))
    + hatchDefs('opDecTurn', P(1.4), O.markPale, 90, P(0.6));
  let body = '';
  body += `<line x1="${r2(x0)}" y1="${r2(base)}" x2="${r2(x1)}" y2="${r2(base)}"
    stroke="${O.line}" stroke-width="${P(1.6)}"/>`;
  years.forEach((v, i) => {
    const cx = x0 + i * step + step / 2;
    const turn = i === turnIndex;
    const h = Math.max(0.8, (v.height / tallest) * rise);
    body += `<rect x="${r2(cx - colW / 2)}" y="${r2(base - h)}" width="${r2(colW)}" height="${r2(h)}"
      fill="url(#${turn ? 'opDecTurn' : 'opDec'})"
      stroke="${turn ? O.mark : O.line}" stroke-width="${P(turn ? 1.2 : 0.6)}"/>`;
    body += tx(cx, base + 5, String(v.calendar).slice(2), { size: 6, anchor: 'middle',
      fill: turn ? O.mark : O.grey });
  });
  /* The leader, so the caption belongs to a year instead of hovering
     over the decade in general. */
  const turnX = x0 + turnIndex * step + step / 2;
  const turnTop = base - Math.max(0.8, (years[turnIndex].height / tallest) * rise);
  body += `<path d="M ${r2(turnX)} ${r2(turnTop - 2)} L ${r2(turnX)} ${r2(14)} L ${r2(turnX + 3)} ${r2(14)}"
    fill="none" stroke="${O.mark}" stroke-width="${P(0.7)}"/>`;
  const cap = `Surplus from ${years[turnIndex].calendar}`;
  body += txClamped(turnX + 5, 15.6, cap, { size: 7, weight: 600, fill: O.mark });
  body += tx(0, base + 12.6, years[0].note, { size: 6.6, fill: O.grey });
  const clw = wide(years[years.length - 1].note, { size: 6.6 });
  body += tx(W - clw, base + 12.6, years[years.length - 1].note, { size: 6.6, fill: O.grey });
  return figure(W, H, body, defs);
}

/* ════════════════════════════════════════════════════════════════════
   VII · METHOD — four files, three engines, one publication
   ════════════════════════════════════════════════════════════════════
   The chapter's claim is that no figure is typed into a page: data
   enters in four files, is computed by three modules, and leaves as one
   document. A chain is the honest drawing of that, and the gold mark is
   on the join the reader is being asked to trust — the test that
   re-derives the price from the framework on every build. */
export function chain(stages, tone) {
  useTone(tone);
  const top = 20, rowStep = 14, boxH = 10;
  const deepest = Math.max(...stages.map((st) => st.items.length));
  const H = top + deepest * rowStep + 8;
  const colW = W / stages.length;
  let body = '';
  stages.forEach((st, i) => {
    const x = i * colW;
    /* The last stage runs to the trim: a chain whose final link stops
       short of the edge reads as unfinished. */
    const w = i === stages.length - 1 ? W - x : colW - 10;
    body += tx(x, top - 3, st.caption, { size: 6, weight: 600, fill: i === stages.length - 1 ? O.mark : O.grey, nums: false });
    st.items.forEach((it, j) => {
      const y = top + j * rowStep;
      body += `<rect x="${r2(x)}" y="${r2(y)}" width="${r2(w)}" height="${boxH}"
        fill="none" stroke="${i === stages.length - 1 ? O.mark : O.line}" stroke-width="${P(0.5)}"/>`;
      /* Fitted, not cut. A source file whose name is trimmed to
         sixteen characters is a source nobody can look up. */
      const perPoint = wide(it, { size: 1 });
      const size = Math.min(6, (w - 2.6) / perPoint);
      body += tx(x + 2.2, y + boxH / 2 + 1.1, it, { size: r2(size), fill: O.ink, nums: false });
    });
    if (i < stages.length - 1) {
      const my = top + boxH / 2;
      body += `<path d="M ${r2(x + w + 1.4)} ${r2(my)} L ${r2(x + colW - 1.4)} ${r2(my)}"
        stroke="${O.line}" stroke-width="${P(0.5)}"/>`;
      body += `<path d="M ${r2(x + colW - 3.4)} ${r2(my - 1.4)} L ${r2(x + colW - 1.4)} ${r2(my)}
        L ${r2(x + colW - 3.4)} ${r2(my + 1.4)}" fill="none" stroke="${O.line}" stroke-width="${P(0.5)}"/>`;
    }
  });
  return figure(W, H, body);
}

/* ════════════════════════════════════════════════════════════════════
   THE COVER'S DECADE
   ════════════════════════════════════════════════════════════════════
   The cover carries no photograph and no ornament, so the one drawn
   element on it is the period the document covers: ten stations on a
   rule, the first and last named. It is the plainest possible drawing
   and it is made of the only thing a cover is entitled to assert. */
export function coverRule(first, last, n = 10, tone) {
  useTone(tone);
  const H = 12, y = 5;
  const x0 = 0, x1 = W;
  const step = (x1 - x0) / (n - 1);
  let body = `<line x1="${x0}" y1="${r2(y)}" x2="${r2(x1)}" y2="${r2(y)}"
    stroke="rgba(201,169,97,.5)" stroke-width="${P(0.5)}"/>`;
  for (let i = 0; i < n; i += 1) {
    const x = x0 + i * step;
    const edge = i === 0 || i === n - 1;
    body += `<line x1="${r2(x)}" y1="${r2(y)}" x2="${r2(x)}" y2="${r2(y - (edge ? 4 : 2))}"
      stroke="${edge ? '#C9A961' : 'rgba(201,169,97,.5)'}" stroke-width="${P(edge ? 1 : 0.5)}"/>`;
  }
  body += tx(0, y + 4.6, String(first), { size: 9, weight: 600, fill: '#C9A961' });
  const lw = wide(String(last), { size: 9, weight: 600 });
  body += tx(W - lw, y + 4.6, String(last), { size: 9, weight: 600, fill: '#C9A961' });
  return figure(W, H, body);
}

/* ════════════════════════════════════════════════════════════════════
   THE LEARNER'S PASSAGE — eight stations, one procession
   ════════════════════════════════════════════════════════════════════
   Part II is about what actually happens to a person who enrols, so
   the datum is the passage itself: eight stations on one rule, each
   struck, with the two that confer something — the examination and the
   award — marked in the metal. It is drawn as a procession rather than
   a flow chart because a flow chart is a diagram of a process and this
   is a diagram of an education. */
export function passage(stations, tone) {
  useTone(tone);
  const H = 92;
  const y = 44;
  const x0 = 2, x1 = W - 2;
  const step = (x1 - x0) / stations.length;
  let body = '';
  body += `<line x1="${r2(x0)}" y1="${r2(y)}" x2="${r2(x1)}" y2="${r2(y)}"
    stroke="${O.line}" stroke-width="${P(1.2)}"/>`;
  stations.forEach((st, i) => {
    const cx = x0 + i * step + step / 2;
    const struck = Boolean(st.confers);
    /* A station is a column standing ON the rule, not a dot sitting on
       it: the institution does something at each one. */
    const h = struck ? 13 : 8;
    body += `<rect x="${r2(cx - 2.4)}" y="${r2(y - h)}" width="4.8" height="${r2(h)}"
      fill="none" stroke="${struck ? O.mark : O.line}" stroke-width="${P(struck ? 1.2 : 0.7)}"/>`;
    if (struck) {
      body += `<line x1="${r2(cx - 4)}" y1="${r2(y - h)}" x2="${r2(cx + 4)}" y2="${r2(y - h)}"
        stroke="${O.mark}" stroke-width="${P(1.4)}"/>`;
    }
    /* Alternating above and below the rule, so eight names fit a
       175mm measure without being set at five point. */
    const above = i % 2 === 0;
    const ny = above ? y - h - 5 : y + 7.4;
    const nw = wide(st.name, { size: 6.4, weight: struck ? 600 : 500 });
    body += tx(Math.max(0, Math.min(cx - nw / 2, W - nw)), ny, st.name,
      { size: 6.4, weight: struck ? 600 : 500, fill: struck ? O.mark : O.ink, nums: false });
    if (st.note) {
      const w2 = wide(st.note, { size: 5.6 });
      body += tx(Math.max(0, Math.min(cx - w2 / 2, W - w2)), above ? ny - 5.2 : ny + 5.2,
        st.note, { size: 5.6, fill: O.grey, nums: false });
    }
  });
  return figure(W, H, body);
}

/* ════════════════════════════════════════════════════════════════════
   THE CHAIN OF AUTHORITY — where a decision stops
   ════════════════════════════════════════════════════════════════════
   Governance drawn as what it is: a descending series of rooms, each
   narrower than the one above it, with the separations that protect a
   learner drawn as the gaps between them. The struck tier is the one
   that cannot be overruled on an academic question, which is the
   single most important fact about the whole structure. */
export function authority(tiers, tone) {
  useTone(tone);
  const H = 24 + tiers.length * 18;
  const top = 12;
  let body = '';
  tiers.forEach((t, i) => {
    const y = top + i * 18;
    /* Each tier is inset from the one above: authority narrows as it
       descends, and the drawing should say so before the labels do. */
    const inset = i * 9;
    const w = W - inset * 2;
    body += `<rect x="${r2(inset)}" y="${r2(y)}" width="${r2(w)}" height="11"
      fill="none" stroke="${t.struck ? O.mark : O.line}" stroke-width="${P(t.struck ? 1.3 : 0.7)}"/>`;
    body += tx(inset + 3, y + 7.2, t.name, { size: 7, weight: t.struck ? 600 : 500,
      face: SERIF, fill: t.struck ? O.mark : O.ink, nums: false });
    const rw = wide(t.holds, { size: 5.8 });
    body += tx(inset + w - 3 - rw, y + 7, t.holds, { size: 5.8, fill: O.grey, nums: false });
    if (i < tiers.length - 1) {
      body += `<line x1="${r2(W / 2)}" y1="${r2(y + 11)}" x2="${r2(W / 2)}" y2="${r2(y + 18)}"
        stroke="${O.faint}" stroke-width="${P(0.5)}"/>`;
    }
  });
  return figure(W, H, body);
}

/* ════════════════════════════════════════════════════════════════════
   THE CHARTER — the principles, cut
   ════════════════════════════════════════════════════════════════════
   The closing part of the book is a charter, and a charter is read the
   way an inscription is read: numbered, ruled, and each line standing
   on its own. Two columns of struck registers, with the numeral in the
   metal and the principle beside it. No ornament at all — the
   composition is the ceremony. */
export function charter(principles, tone) {
  useTone(tone);
  const cols = 2;
  const rows = Math.ceil(principles.length / cols);
  const H = 12 + rows * 15;
  const colW = (W - 10) / cols;
  let body = '';
  principles.forEach((p, i) => {
    const c = Math.floor(i / rows), r = i % rows;
    const x = c * (colW + 10), y = 12 + r * 15;
    body += `<line x1="${r2(x)}" y1="${r2(y - 5)}" x2="${r2(x + colW)}" y2="${r2(y - 5)}"
      stroke="${O.faint}" stroke-width="${P(0.5)}"/>`;
    const n = String(i + 1).padStart(2, '0');
    body += tx(x, y + 2.6, n, { size: 11, weight: 500, face: SERIF, fill: O.mark });
    const nw = wide(n, { size: 11, weight: 500, face: SERIF });
    body += tx(x + nw + 4, y + 2.2, p, { size: 7.4, face: SERIF, weight: 400, fill: O.ink, nums: false });
  });
  return figure(W, H, body);
}
