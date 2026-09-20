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

const K = {
  ink: '#16202C', midnight: '#0A1A2F', soft: '#5A6479', grey: '#79828F',
  rule: '#D9D2C2', faint: '#EBE6DA', gold: '#A9843C', goldLeaf: '#C9A961',
  goldPale: '#E8D9B4', paper: '#FFFFFF', bone: '#F6F2E9', crimson: '#7E1F2D',
};
const DATA = "'Inter','Liberation Sans',sans-serif";
const DISPLAY = "'Cormorant Garamond','Bitstream Charter',serif";
const TEXT = "'EB Garamond','Bitstream Charter',serif";

const esc = (v) => String(v).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
const r2 = (n) => Math.round(n * 100) / 100;

/**
 * THE HATCH. Every density in the publication comes from here, so a
 * reader learns the scale once: pitch is the gap between rules in user
 * units, and a smaller pitch is a heavier quantity.
 */
function hatchDefs(id, pitch, colour, angle = 45, width = 0.5) {
  return `<pattern id="${id}" patternUnits="userSpaceOnUse" width="${pitch}" height="${pitch}"
    patternTransform="rotate(${angle})">
    <line x1="0" y1="0" x2="0" y2="${pitch}" stroke="${colour}" stroke-width="${width}"/>
  </pattern>`;
}

const label = (x, y, t, o = {}) => `<text x="${r2(x)}" y="${r2(y)}"
  font-family="${o.face || DATA}" font-size="${o.size || 6.2}"
  font-weight="${o.weight || 500}" letter-spacing="${o.track ?? 0.9}"
  fill="${o.fill || K.grey}" text-anchor="${o.anchor || 'start'}"
  ${o.upper === false ? '' : 'style="text-transform:uppercase"'}>${esc(t)}</text>`;

const figure = (w, h, inner, defs = '') =>
  `<svg class="fig" viewBox="0 0 ${w} ${h}" width="100%" xmlns="http://www.w3.org/2000/svg"
    style="display:block" role="img">
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
  const W = 168, H = 186;
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

  const consumed = lines.filter((l) => !l.retained);
  const retained = lines.filter((l) => l.retained);
  const retShare = retained.reduce((a, l) => a + l.target, 0);
  const short = (l) => (opts.labels && opts.labels[l.key]) || l.name;

  let defs = '';
  let y = top;
  let body = '';

  retained.forEach((l, i) => {
    const h = span * l.target;
    defs += hatchDefs(`ret${i}`, 2.4, K.goldLeaf, 0, 0.5);
    body += `<rect x="${colX - 5}" y="${r2(y)}" width="${colW + 10}" height="${r2(h)}"
      fill="url(#ret${i})" stroke="${K.gold}" stroke-width="0.45"/>`;
    body += dimension(dimX, y, h, `${Math.round(l.target * 100)}%`, short(l), K.gold);
    y += h;
  });

  const ruleY = top + capOf(span, retShare);
  body += `<line x1="${colX - 12}" y1="${r2(ruleY)}" x2="${colX + colW + 12}" y2="${r2(ruleY)}"
    stroke="${K.gold}" stroke-width="1.5"/>`;

  consumed.forEach((l, i) => {
    const h = span * l.target;
    const pitch = r2(1.4 + (1 - l.target / 0.25) * 1.8);
    defs += hatchDefs(`con${i}`, Math.max(1.05, pitch), K.soft, 45, 0.4);
    body += `<rect x="${colX}" y="${r2(y)}" width="${colW}" height="${r2(h)}"
      fill="url(#con${i})" stroke="${K.soft}" stroke-width="0.35"/>`;
    /* A band under about seven units cannot carry two lines of text at
       its own centre without touching its neighbour, so its measure is
       set on one line instead. */
    body += dimension(dimX, y, h, `${Math.round(l.target * 100)}%`, short(l), K.soft, h < 8);
    y += h;
  });

  body += `<rect x="${colX - 8}" y="${r2(bot)}" width="${colW + 16}" height="3"
    fill="none" stroke="${K.ink}" stroke-width="0.55"/>`;
  body += `<line x1="${colX - 12}" y1="${r2(bot + 5)}" x2="${colX + colW + 12}" y2="${r2(bot + 5)}"
    stroke="${K.ink}" stroke-width="0.35"/>`;

  body += `<line x1="${measureX + 6}" y1="${top}" x2="${measureX + 6}" y2="${bot}"
    stroke="${K.rule}" stroke-width="0.35"/>`;
  for (const t of [0, 0.25, 0.5, 0.75, 1]) {
    const ty = top + span * t;
    body += `<line x1="${measureX + 3.5}" y1="${r2(ty)}" x2="${measureX + 6}" y2="${r2(ty)}"
      stroke="${K.rule}" stroke-width="0.35"/>`;
    body += label(measureX + 1.5, ty + 1.7, `${100 - t * 100}`, { anchor: 'end', size: 4.8, fill: K.grey });
  }
  return figure(W, H, body, defs);
}

const capOf = (span, share) => span * share;

/** A dimension line with its measure, the way an elevation carries one. */
function dimension(x, y, h, value, name, colour, oneLine = false) {
  const mid = y + h / 2;
  if (oneLine) {
    return `<g>
      <line x1="${r2(x - 12)}" y1="${r2(y)}" x2="${r2(x)}" y2="${r2(y)}" stroke="${K.faint}" stroke-width="0.3"/>
      <line x1="${r2(x - 6)}" y1="${r2(y + 0.6)}" x2="${r2(x - 6)}" y2="${r2(y + h - 0.6)}" stroke="${colour}" stroke-width="0.35"/>
      <text x="${r2(x)}" y="${r2(mid + 2.2)}" font-family="${DISPLAY}" font-size="9.5"
        fill="${K.midnight}">${esc(value)}</text>
      <text x="${r2(x + 13)}" y="${r2(mid + 1.8)}" font-family="${DATA}" font-size="5" font-weight="600"
        letter-spacing="1" fill="${K.grey}" style="text-transform:uppercase">${esc(name)}</text>
    </g>`;
  }
  return `<g>
    <line x1="${r2(x - 12)}" y1="${r2(y)}" x2="${r2(x)}" y2="${r2(y)}" stroke="${K.faint}" stroke-width="0.3"/>
    <line x1="${r2(x - 12)}" y1="${r2(y + h)}" x2="${r2(x)}" y2="${r2(y + h)}" stroke="${K.faint}" stroke-width="0.3"/>
    <line x1="${r2(x - 6)}" y1="${r2(y + 1)}" x2="${r2(x - 6)}" y2="${r2(y + h - 1)}" stroke="${colour}" stroke-width="0.35"/>
    <text x="${r2(x)}" y="${r2(mid - 0.4)}" font-family="${DISPLAY}" font-size="11"
      fill="${K.midnight}">${esc(value)}</text>
    <text x="${r2(x)}" y="${r2(mid + 5.4)}" font-family="${DATA}" font-size="5.2" font-weight="600"
      letter-spacing="1.1" fill="${K.grey}" style="text-transform:uppercase">${esc(name)}</text>
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
  const W = 168, H = 18 + rows.length * 15 + 24;
  const x0 = 46, x1 = W - 20;
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
    body += `<text x="${r2(sx(band.from) + 2)}" y="${H - 5}" font-family="${DATA}" font-size="4.9"
      font-weight="600" letter-spacing="1" fill="${K.gold}" style="text-transform:uppercase"
      >${esc(band.label)}</text>`;
  }

  const stepFor = (c) => (c > 500 ? 200 : 100);
  for (let v = 0; v <= ceiling; v += stepFor(ceiling)) {
    body += `<line x1="${r2(sx(v))}" y1="${plotTop}" x2="${r2(sx(v))}" y2="${r2(plotBot)}"
      stroke="${K.faint}" stroke-width="0.3"/>`;
    body += label(sx(v), plotBot + 6, `$${v}`, { anchor: 'middle', size: 5 });
  }

  rows.forEach((r, i) => {
    const y = plotTop + 9 + i * 15;
    const over = r.perHour > benchmark && !r.ownBand;
    const col = over ? K.crimson : K.midnight;
    body += label(x0 - 5, y + 2, r.name, { anchor: 'end', size: 6, fill: K.ink, upper: false,
      face: TEXT, weight: 400, track: 0 });
    body += `<line x1="${r2(x0)}" y1="${r2(y)}" x2="${r2(sx(r.perHour))}" y2="${r2(y)}"
      stroke="${col}" stroke-width="1.5"/>`;
    body += `<circle cx="${r2(sx(r.perHour))}" cy="${r2(y)}" r="1.9" fill="${col}"/>`;
    /* WHERE THE VALUE IS SET. To the right of its dot normally. But a
       value close to the gold rule would print across it, and setting
       it to the LEFT instead printed it across its own bar — the rule
       runs all the way from the axis to the dot, so there is no clear
       ground on that side at all. Near values go ABOVE the bar, where
       there is always room. */
    const near = Math.abs(sx(r.perHour) - sx(benchmark)) < 18;
    body += near
      ? `<text x="${r2(sx(r.perHour))}" y="${r2(y - 3.4)}" font-family="${DATA}" font-size="6"
          font-weight="600" fill="${col}" text-anchor="middle">$${Math.round(r.perHour)}</text>`
      : `<text x="${r2(sx(r.perHour) + 4)}" y="${r2(y + 2.2)}" font-family="${DATA}" font-size="6.2"
          font-weight="600" fill="${col}" text-anchor="start">$${Math.round(r.perHour)}</text>`;
  });

  const bx = sx(benchmark);
  body += `<line x1="${r2(bx)}" y1="${plotTop - 7}" x2="${r2(bx)}" y2="${r2(plotBot)}"
    stroke="${K.gold}" stroke-width="1.4"/>`;
  /* The caption goes on whichever side of the rule has room. Anchored
     end by default, it ran off the left edge of the plate. */
  /* Set to the RIGHT of the rule unless the rule is already in the
     right third. Anchored end it ran off the left edge, because the
     caption plus its tracking is wider than the space to the left of a
     benchmark that sits near the middle of the plate. */
  const capLeft = bx > W * 0.68;
  body += `<text x="${r2(capLeft ? bx - 3 : bx + 3)}" y="${plotTop - 9}" font-family="${DATA}"
    font-size="5.2" font-weight="600" letter-spacing="0.7" fill="${K.gold}"
    text-anchor="${capLeft ? 'end' : 'start'}"
    style="text-transform:uppercase">${esc(opts.benchmarkLabel || 'Benchmark')} $${Math.round(benchmark)}</text>`;

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
  const W = 168, H = 150;
  const xa = 56, xb = 118, top = 22, bot = H - 20;
  const max = Math.max(...rows.flatMap((r) => [r.from, r.to])) * 1.06;
  const sy = (v) => bot - (v / max) * (bot - top);

  let body = '';
  body += `<line x1="${xa}" y1="${top - 6}" x2="${xa}" y2="${bot}" stroke="${K.rule}" stroke-width="0.35"/>`;
  body += `<line x1="${xb}" y1="${top - 6}" x2="${xb}" y2="${bot}" stroke="${K.rule}" stroke-width="0.35"/>`;
  body += label(xa, top - 10, opts.fromLabel || 'Assumed', { anchor: 'middle', size: 5.6, fill: K.grey });
  body += label(xb, top - 10, opts.toLabel || 'Researched', { anchor: 'middle', size: 5.6, fill: K.gold });

  rows.forEach((r) => {
    const ya = sy(r.from), yb = sy(r.to);
    const fell = r.to < r.from;
    const heavy = Math.abs(r.to / r.from - 1) > 0.5;
    body += `<line x1="${xa}" y1="${r2(ya)}" x2="${xb}" y2="${r2(yb)}"
      stroke="${heavy ? K.crimson : K.soft}" stroke-width="${heavy ? 1.1 : 0.6}"/>`;
    body += `<circle cx="${xa}" cy="${r2(ya)}" r="1.5" fill="${K.soft}"/>`;
    body += `<circle cx="${xb}" cy="${r2(yb)}" r="1.9" fill="${heavy ? K.crimson : K.midnight}"/>`;
    body += `<text x="${xa - 4}" y="${r2(ya + 2)}" font-family="${DATA}" font-size="5.8"
      font-weight="500" fill="${K.grey}" text-anchor="end">$${(r.from / 1000).toFixed(1)}k</text>`;
    body += `<text x="${xb + 5}" y="${r2(yb + 0.2)}" font-family="${DATA}" font-size="6"
      font-weight="600" fill="${K.midnight}">$${(r.to / 1000).toFixed(1)}k</text>`;
    body += `<text x="${xb + 5}" y="${r2(yb + 6)}" font-family="${TEXT}" font-size="5.6"
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
  const W = 168, H = 104;
  const x0 = 18, x1 = W - 10, top = 12, bot = H - 18;
  const maxRev = Math.max(...years.map((y) => y.netTuition)) * 1.08;
  const surpluses = years.map((y) => y.surplus);
  const maxSur = Math.max(...surpluses.map(Math.abs)) * 1.25;
  const bw = (x1 - x0) / years.length;
  const sy = (v) => bot - (v / maxRev) * (bot - top);
  const zero = bot - (bot - top) * 0.34;
  const syS = (v) => zero - (v / maxSur) * ((bot - top) * 0.3);

  let defs = hatchDefs('rev', 1.5, '#8FA0B4', 45, 0.42);
  let body = '';
  body += `<line x1="${x0 - 4}" y1="${r2(bot)}" x2="${x1}" y2="${r2(bot)}" stroke="${K.ink}" stroke-width="0.5"/>`;

  years.forEach((y, i) => {
    const bx = x0 + i * bw;
    body += `<rect x="${r2(bx + bw * 0.16)}" y="${r2(sy(y.netTuition))}"
      width="${r2(bw * 0.68)}" height="${r2(bot - sy(y.netTuition))}"
      fill="url(#rev)" stroke="${K.soft}" stroke-width="0.3"/>`;
    if (i % 2 === 0 || i === years.length - 1) {
      body += label(bx + bw / 2, bot + 6.6, String(y.calendar).slice(2), { anchor: 'middle', size: 5, fill: K.grey });
    }
  });

  // The surplus line, and the zero it crosses.
  body += `<line x1="${x0 - 4}" y1="${r2(zero)}" x2="${x1}" y2="${r2(zero)}"
    stroke="${K.gold}" stroke-width="0.7" stroke-dasharray="2 1.6"/>`;
  const pts = years.map((y, i) => `${r2(x0 + i * bw + bw / 2)},${r2(syS(y.surplus))}`).join(' ');
  body += `<polyline points="${pts}" fill="none" stroke="${K.midnight}" stroke-width="1.3"/>`;
  years.forEach((y, i) => {
    body += `<circle cx="${r2(x0 + i * bw + bw / 2)}" cy="${r2(syS(y.surplus))}" r="1.3"
      fill="${y.surplus >= 0 ? K.midnight : K.crimson}"/>`;
  });
  body += label(x1, zero - 3, 'Surplus, nil', { anchor: 'end', size: 5, fill: K.gold });
  body += label(x0 - 4, top + 2, opts.revenueLabel || 'Net tuition', { anchor: 'start', size: 5.2, fill: K.soft });

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
  const W = 168, gutter = 52, x0 = gutter + 4, x1 = W - 28;
  const max = Math.max(...retail.map((r) => r.cac), ...channels.map((c) => c.cac));
  const sx = (v) => x0 + (v / (max * 1.06)) * (x1 - x0);
  const defs = hatchDefs('amort', 1.5, K.goldLeaf, 90, 0.55);
  let body = '';
  let y = 16;

  body += `<text x="4" y="${r2(y - 7)}" font-family="${DATA}" font-size="6" font-weight="600"
    letter-spacing="1.5" fill="${K.soft}" style="text-transform:uppercase">Acquired one at a time</text>`;
  retail.forEach((r) => {
    body += `<text x="${gutter}" y="${r2(y + 2.4)}" font-family="${TEXT}" font-size="7"
      fill="${K.ink}" text-anchor="end">${esc(r.name)}</text>`;
    body += `<rect x="${x0}" y="${r2(y - 2.9)}" width="${r2(sx(r.cac) - x0)}" height="5.8"
      fill="none" stroke="${K.soft}" stroke-width="0.5"/>`;
    body += `<text x="${r2(sx(r.cac) + 3)}" y="${r2(y + 2.4)}" font-family="${DATA}" font-size="7"
      font-weight="500" fill="${K.soft}">$${Math.round(r.cac).toLocaleString()}</text>`;
    y += 13;
  });

  y += 6;
  body += `<line x1="4" y1="${r2(y - 9)}" x2="${x1 + 22}" y2="${r2(y - 9)}"
    stroke="${K.rule}" stroke-width="0.35"/>`;
  body += `<text x="4" y="${r2(y - 3)}" font-family="${DATA}" font-size="6" font-weight="600"
    letter-spacing="1.5" fill="${K.gold}" style="text-transform:uppercase">One negotiation, many seats</text>`;
  y += 9;

  channels.forEach((c) => {
    body += `<text x="${gutter}" y="${r2(y + 2.4)}" font-family="${TEXT}" font-size="7"
      fill="${K.ink}" text-anchor="end">${esc(c.name)}</text>`;
    body += `<rect x="${x0}" y="${r2(y - 2.9)}" width="${r2(Math.max(1.2, sx(c.cac) - x0))}" height="5.8"
      fill="url(#amort)" stroke="${K.gold}" stroke-width="0.55"/>`;
    body += `<text x="${r2(sx(c.cac) + 3)}" y="${r2(y + 2.4)}" font-family="${DATA}" font-size="8"
      font-weight="600" fill="${K.midnight}">$${Math.round(c.cac).toLocaleString()}</text>`;
    body += `<text x="${r2(sx(c.cac) + 3)}" y="${r2(y + 9)}" font-family="${TEXT}" font-size="5.8"
      fill="${K.grey}">${esc(c.note)}</text>`;
    y += 20;
  });

  /* The point of the plate, set once at its foot where the eye lands
     after reading down the two groups. */
  const best = Math.min(...channels.map((c) => c.cac));
  const worst = Math.max(...retail.map((r) => r.cac));
  y += 5;
  body += `<line x1="4" y1="${r2(y)}" x2="${x1 + 22}" y2="${r2(y)}" stroke="${K.gold}" stroke-width="1.2"/>`;
  body += `<text x="4" y="${r2(y + 13)}" font-family="${DISPLAY}" font-size="23"
    fill="${K.midnight}">${(worst / best).toFixed(1)}×</text>`;
  body += `<text x="32" y="${r2(y + 9.5)}" font-family="${TEXT}" font-size="7" fill="${K.inkSoft}"
    >cheaper to acquire a seat through an agreement</text>`;
  body += `<text x="32" y="${r2(y + 16.5)}" font-family="${TEXT}" font-size="7" fill="${K.inkSoft}"
    >than a Gulf executive one at a time.</text>`;

  return figure(W, y + 26, body, defs);
}

// ════════════════════════════════════════════════════════════════════
// 6 · THE RISK MATRIX
// ════════════════════════════════════════════════════════════════════
/** Twenty risks placed on likelihood against impact. A register is a
 *  list; a matrix is a judgement about where attention goes. */
export function riskMatrix(risks) {
  const W = 168, H = 128;
  const L = ['Low', 'Medium', 'High'];
  const I = ['Medium', 'High', 'Severe'];
  const x0 = 34, y0 = 14, cw = (W - x0 - 12) / L.length, ch = (H - y0 - 22) / I.length;
  let defs = hatchDefs('cell', 2.2, K.faint, 45, 0.4);
  let body = '';
  for (let a = 0; a < L.length; a++) {
    for (let b = 0; b < I.length; b++) {
      const n = risks.filter((r) => r[2] === L[a] && r[3] === I[b]).length;
      const x = x0 + a * cw, y = y0 + (I.length - 1 - b) * ch;
      const hot = a >= 1 && b >= 1;
      body += `<rect x="${r2(x)}" y="${r2(y)}" width="${r2(cw)}" height="${r2(ch)}"
        fill="${n ? (hot ? 'url(#cell)' : 'none') : 'none'}"
        stroke="${K.rule}" stroke-width="0.35"/>`;
      if (n) {
        body += `<text x="${r2(x + cw / 2)}" y="${r2(y + ch / 2 + 3)}" font-family="${DISPLAY}"
          font-size="17" fill="${hot ? K.crimson : K.midnight}" text-anchor="middle">${n}</text>`;
      }
    }
  }
  L.forEach((l, a) => { body += label(x0 + a * cw + cw / 2, H - 13, l, { anchor: 'middle', size: 5.2 }); });
  I.forEach((l, b) => { body += label(x0 - 4, y0 + (I.length - 1 - b) * ch + ch / 2 + 1.6, l, { anchor: 'end', size: 5.2 }); });
  body += label(x0 + (W - x0 - 12) / 2, H - 5, 'Likelihood', { anchor: 'middle', size: 5.4, fill: K.gold });
  body += `<text transform="translate(9 ${r2(y0 + (H - y0 - 22) / 2)}) rotate(-90)" font-family="${DATA}"
    font-size="5.4" font-weight="600" letter-spacing="1.1" fill="${K.gold}" text-anchor="middle"
    style="text-transform:uppercase">Impact</text>`;
  return figure(W, H, body, defs);
}

export { K as FIG_COLOURS };
