/**
 * THE ORNAMENT LIBRARY — the drawn apparatus of a collector's edition.
 *
 * ────────────────────────────────────────────────────────────────────
 * WHY EVERY ORNAMENT IS COMPUTED
 * ────────────────────────────────────────────────────────────────────
 * Nothing here is a stock asset, a traced illustration or a font glyph.
 * Every mark in this file is generated from its own geometry, which
 * means four things a flagship publication needs:
 *
 *   It is vector at any size, so the cover holds at A4 or at a metre.
 *   It cannot fail to load, because there is no external file.
 *   It is honest — no borrowed artwork, no licence question, nothing
 *     that belongs to someone else.
 *   It is reproducible: the same seed draws the same mark forever, so
 *     a reprint in five years is identical to the first impression.
 *
 * ────────────────────────────────────────────────────────────────────
 * THE GUILLOCHÉ
 * ────────────────────────────────────────────────────────────────────
 * Guilloché is the engine-turned line-work engraved on banknotes,
 * share certificates and passports since the eighteenth century. Its
 * value was never decorative: an interlaced curve produced by a
 * geometric lathe was, before photolithography, effectively impossible
 * to copy by hand. It became the visual grammar of documents that must
 * be believed.
 *
 * That is precisely the register this publication needs, and it is
 * mathematics rather than artwork: a hypotrochoid, the curve traced by
 * a point at radius `d` on a circle of radius `r` rolling inside a
 * circle of radius `R`.
 *
 *   x = (R − r)·cos t + d·cos((R − r)/r · t)
 *   y = (R − r)·sin t − d·sin((R − r)/r · t)
 *
 * The curve closes after lcm(R, r)/R turns, so the parameters are
 * chosen to close cleanly — an unclosed guilloché reads as a mistake
 * from across a room.
 *
 * ────────────────────────────────────────────────────────────────────
 * THE GEOMETRIC ROSETTE
 * ────────────────────────────────────────────────────────────────────
 * The eight-fold star and its interlace belong to the girih tradition
 * of Islamic geometric design — a system built on division of the
 * circle rather than on depiction. It is used here for two reasons.
 *
 * The first is that it is the right form: a curriculum that ascends
 * through six levels wants an ornament about ordered progression, and
 * girih is exactly that — everything derived from one circle, divided.
 *
 * The second is that this College teaches English to the world, and
 * the brief asks for a restrained Islamic geometric inspiration. It is
 * given as construction, not as pastiche: real eight-fold symmetry,
 * drawn from the polygon, with no calligraphy, no religious motif and
 * nothing appropriated. Where it appears it is quiet — a blind
 * emboss-weight rosette behind a title, not a pattern shouting for
 * attention.
 */

/** Number formatting that keeps SVG paths small and diff-stable. */
const n = (v) => Math.round(v * 1000) / 1000;

// ─────────────────────────────────────────────────────────────────────
// GUILLOCHÉ
// ─────────────────────────────────────────────────────────────────────

/**
 * One hypotrochoid path, centred on (cx, cy), parametrised by PETAL
 * COUNT rather than by the two raw radii.
 *
 * The reason is closure. A hypotrochoid returns to its start only after
 * r / gcd(R, r) revolutions, so an arbitrary (R, r) pair either takes
 * dozens of turns to close or never closes at the resolution drawn —
 * and an unclosed guilloché does not read as engine-turning. It reads
 * as scribble, which is exactly what the first attempt at this file
 * produced.
 *
 * Fixing the petal count k and deriving r = R / k makes (R − r)/r equal
 * to k − 1 exactly, so the curve closes in a single revolution with k
 * petals, every time, for every k. The parameter that matters visually
 * is then the pen offset: at d ≈ r the petals are cusped, and at
 * d ≈ 2–3 r they loop and interlace the way a lathe cuts them.
 */
export function guillochePath(cx, cy, R, k, dRatio = 2.4, { steps = 1440, phase = 0 } = {}) {
  const r = R / k;
  const d = r * dRatio;
  let out = '';
  for (let i = 0; i <= steps; i++) {
    const t = phase + (i / steps) * Math.PI * 2;
    const x = cx + (R - r) * Math.cos(t) + d * Math.cos((k - 1) * t);
    const y = cy + (R - r) * Math.sin(t) - d * Math.sin((k - 1) * t);
    out += `${i ? 'L' : 'M'}${n(x)} ${n(y)}`;
  }
  return out + 'Z';
}

/**
 * A guilloché rosette: concentric petal rings, the way a security lathe
 * cuts a medallion — the outer rings finest and densest, the inner ones
 * fewer and heavier, so the figure has a centre.
 */
export function guillocheRosette({
  size = 320, stroke = '#B4933E', width = 0.35, opacity = 0.9, rings = 5, seed = 0,
} = {}) {
  const c = size / 2;
  // radius as a fraction of the half-size, petal count, pen ratio
  const specs = [
    { R: 0.97, k: 48, d: 1.55 },
    { R: 0.88, k: 36, d: 1.7 },
    { R: 0.75, k: 28, d: 1.75 },
    { R: 0.60, k: 20, d: 1.85 },
    { R: 0.44, k: 14, d: 1.95 },
  ];
  const half = size / 2;
  const paths = specs.slice(0, rings).map((s, i) => {
    const phase = ((seed + i) * Math.PI) / s.k;
    const p = guillochePath(c, c, s.R * half, s.k, s.d, { steps: s.k * 36, phase });
    return `<path d="${p}" fill="none" stroke="${stroke}" stroke-width="${
      n(width * (1 + i * 0.16))}" opacity="${n(opacity * (1 - i * 0.06))}"/>`;
  }).join('');
  const guides = `<circle cx="${c}" cy="${c}" r="${n(half * 0.995)}" fill="none"
      stroke="${stroke}" stroke-width="${n(width * 1.4)}" opacity="${n(opacity * 0.55)}"/>
    <circle cx="${c}" cy="${c}" r="${n(half * 0.2)}" fill="none"
      stroke="${stroke}" stroke-width="${n(width * 1.6)}" opacity="${n(opacity * 0.7)}"/>`;
  return `<svg viewBox="0 0 ${size} ${size}" width="${size}" height="${size}" aria-hidden="true"
    xmlns="http://www.w3.org/2000/svg">${guides}${paths}</svg>`;
}

/**
 * A guilloché band — the interlaced wave that runs along the edge of a
 * banknote. Two counter-phased sine trains plus a fine spine.
 */
export function guillocheBand({
  width = 800, height = 26, stroke = '#B4933E', lines = 5, cycles = 14, opacity = 0.8,
} = {}) {
  const mid = height / 2;
  const amp = height * 0.36;
  const step = width / 400;
  const out = [];
  for (let l = 0; l < lines; l++) {
    const off = (l / lines) * Math.PI * 2;
    const a = amp * (1 - Math.abs(l - (lines - 1) / 2) / lines * 0.5);
    for (const dir of [1, -1]) {
      let d = '';
      for (let x = 0; x <= width; x += step) {
        const t = (x / width) * cycles * Math.PI * 2;
        const y = mid + dir * a * Math.sin(t + off) * Math.cos(t / 3 + off / 2);
        d += `${x ? 'L' : 'M'}${n(x)} ${n(y)}`;
      }
      out.push(`<path d="${d}" fill="none" stroke="${stroke}" stroke-width="0.3"
        opacity="${n(opacity * (0.45 + 0.55 * (1 - l / lines)))}"/>`);
    }
  }
  return `<svg viewBox="0 0 ${width} ${height}" width="100%" height="${height}"
    preserveAspectRatio="none" aria-hidden="true" xmlns="http://www.w3.org/2000/svg"
    >${out.join('')}</svg>`;
}

// ─────────────────────────────────────────────────────────────────────
// GIRIH — the eight-fold geometric rosette
// ─────────────────────────────────────────────────────────────────────

/**
 * An eight-fold star rosette constructed from the circle, in the girih
 * manner: an octagon, its extended edges forming the star, and an
 * interlace ring. Everything derives from one division of 2π by 8.
 */
export function girihRosette({ size = 240, stroke = '#B4933E', width = 0.6, opacity = 0.5 } = {}) {
  const c = size / 2;
  const R = size * 0.46;
  const pt = (radius, i, off = 0) => {
    const a = ((i + off) * Math.PI * 2) / 8 - Math.PI / 2;
    return [c + radius * Math.cos(a), c + radius * Math.sin(a)];
  };
  const poly = (radius, off = 0) => Array.from({ length: 8 }, (_, i) => pt(radius, i, off))
    .map(([x, y], i) => `${i ? 'L' : 'M'}${n(x)} ${n(y)}`).join('') + 'Z';

  // The eight-point star: two squares of points, inner and outer,
  // alternating — the classic khatem construction.
  const star = Array.from({ length: 16 }, (_, i) => {
    const [x, y] = pt(i % 2 ? R * 0.42 : R, Math.floor(i / 2), i % 2 ? 0.5 : 0);
    return `${i ? 'L' : 'M'}${n(x)} ${n(y)}`;
  }).join('') + 'Z';

  const spokes = Array.from({ length: 8 }, (_, i) => {
    const [x1, y1] = pt(R * 0.42, i, 0.5);
    const [x2, y2] = pt(R * 0.94, i, 0.5);
    return `M${n(x1)} ${n(y1)}L${n(x2)} ${n(y2)}`;
  }).join('');

  return `<svg viewBox="0 0 ${size} ${size}" width="${size}" height="${size}" aria-hidden="true"
    xmlns="http://www.w3.org/2000/svg">
    <g fill="none" stroke="${stroke}" stroke-width="${width}" opacity="${opacity}"
       stroke-linejoin="round">
      <circle cx="${c}" cy="${c}" r="${n(R)}"/>
      <circle cx="${c}" cy="${c}" r="${n(R * 0.72)}" opacity="0.6"/>
      <path d="${poly(R)}"/>
      <path d="${poly(R * 0.72, 0.5)}" opacity="0.7"/>
      <path d="${star}" stroke-width="${n(width * 1.4)}"/>
      <path d="${spokes}" opacity="0.5"/>
      <circle cx="${c}" cy="${c}" r="${n(R * 0.16)}"/>
    </g></svg>`;
}

/**
 * A tiling of the eight-fold star for use as a blind (very low
 * contrast) texture behind a cover panel — the paper-embossing effect,
 * achieved by contrast rather than by a raster.
 */
export function girihField({ w = 600, h = 840, cell = 84, stroke = '#FFFFFF', opacity = 0.055 } = {}) {
  const tiles = [];
  for (let y = -cell / 2; y < h + cell; y += cell) {
    for (let x = -cell / 2; x < w + cell; x += cell) {
      tiles.push(`<g transform="translate(${n(x)} ${n(y)})">${
        girihRosette({ size: cell, stroke, width: 0.5, opacity: 1 })
          .replace(/^<svg[^>]*>/, '').replace(/<\/svg>$/, '')}</g>`);
    }
  }
  return `<svg viewBox="0 0 ${w} ${h}" width="100%" height="100%" preserveAspectRatio="xMidYMid slice"
    aria-hidden="true" xmlns="http://www.w3.org/2000/svg"
    ><g opacity="${opacity}">${tiles.join('')}</g></svg>`;
}

// ─────────────────────────────────────────────────────────────────────
// THE CREST
// ─────────────────────────────────────────────────────────────────────

/**
 * The institutional crest. Drawn, not illustrated: a shield on the
 * classical proportion, an open book (the College teaches), six bars
 * (the six levels of the ascent), and the founding letters.
 *
 * It carries no heraldic claim — no granted arms, no supporters, no
 * motto in a language the College has not adopted. It is a mark, and
 * it says only what is true: a college, a book, six levels.
 */
/**
 * MINIMUM SIZES FOR THE CREST'S LETTERING.
 *
 * A mark that carries type has a size below which the type stops being
 * type. The audit measured "LONDON" rendering at 1.8 pt on the level
 * dividers and 2.6 pt on the title page — sizes at which the counters
 * close up on uncoated stock and the word becomes a grey smudge that
 * looks like a printing fault.
 *
 * The lettering is therefore dropped below these thresholds and the
 * device — shield, book, six bars — carries the mark alone. This is the
 * ordinary practice for an identity used across a size range, and it is
 * better than the alternative of scaling the whole crest up: the crest
 * is small on a divider because it should be small there.
 *
 * The numbers are derived, not chosen. The svg is `size` px wide over a
 * 120-unit viewBox, so a glyph at N units renders at N × size / 120 px,
 * which is × 0.75 in points. Solving for 5.5 pt gives the two floors
 * below.
 */
export const WEC_MIN = Math.ceil((5.5 / 0.75) * (120 / 15));      // ≈ 59 px
export const LONDON_MIN = Math.ceil((5.5 / 0.75) * (120 / 6.4));  // ≈ 138 px

export function crest({ size = 120, gold = '#B4933E', ink = '#0F1D38', mono = false } = {}) {
  const g = mono ? gold : gold;
  // NOTE: there is deliberately no scale helper here.
  //
  // An earlier version multiplied every stroke width, bar width and font
  // size by size/120 before writing it into the markup. But the markup
  // is a viewBox — the browser ALREADY scales user units by size/120 —
  // so those values were scaled twice. At the 46 px crest on a level
  // divider the shield outline came out at 0.09 px, and the six ascent
  // bars at two-fifths of their intended width.
  //
  // Nothing looked wrong at size 120, where the factor is 1 and the bug
  // is invisible. It was found by the craftsmanship audit measuring a
  // drawn line at 0.23 units against the 0.25 floor below which fine
  // line-work drops out on press.
  //
  // Every number below is therefore in plain viewBox units, the same
  // units the path coordinates already use.
  const s = (v) => v;
  return `<svg viewBox="0 0 120 140" width="${size}" height="${n(size * 140 / 120)}"
    role="img" aria-label="Worldwide English College crest"
    xmlns="http://www.w3.org/2000/svg">
    <path d="M8 6 H112 V78 C112 104 92 122 60 134 C28 122 8 104 8 78 Z"
      fill="${mono ? 'none' : ink}" stroke="${g}" stroke-width="${s(2)}"/>
    <path d="M14 12 H106 V77 C106 100 88 116 60 127 C32 116 14 100 14 77 Z"
      fill="none" stroke="${g}" stroke-width="${s(0.6)}" opacity="0.65"/>
    <!-- the open book -->
    <path d="M28 60 C40 54 52 54 60 58 C68 54 80 54 92 60 L92 82 C80 76 68 76 60 80
             C52 76 40 76 28 82 Z" fill="none" stroke="${g}" stroke-width="${s(1.6)}"
      stroke-linejoin="round"/>
    <path d="M60 58 V80" stroke="${g}" stroke-width="${s(1.2)}"/>
    <!-- six bars: the ascent -->
    ${Array.from({ length: 6 }, (_, i) =>
    `<rect x="${n(34 + i * 9)}" y="${n(46 - i * 3)}" width="${s(5)}" height="${n(3 + i * 3)}"
       fill="${g}" opacity="${n(0.45 + i * 0.11)}"/>`).join('')}
    ${size >= WEC_MIN ? `<text x="60" y="103" text-anchor="middle" fill="${g}"
      font-family="Georgia, 'Times New Roman', serif" font-size="${s(15)}"
      letter-spacing="${s(2)}" font-weight="700">WEC</text>` : ''}
    ${size >= LONDON_MIN ? `<text x="60" y="115" text-anchor="middle" fill="${g}" opacity="0.8"
      font-family="Calibri, Arial, sans-serif" font-size="${s(6.4)}"
      letter-spacing="${s(2.4)}">LONDON</text>` : ''}
  </svg>`;
}

// ─────────────────────────────────────────────────────────────────────
// BORDER SYSTEM
// ─────────────────────────────────────────────────────────────────────

/**
 * The premium border: a French rule set — thick, gap, thin — with
 * mitred corner marks. Drawn as one SVG so the corners meet exactly,
 * which is the whole difficulty and the whole point.
 */
export function frame({
  w = 560, h = 800, colour = '#B4933E', inset = 18, corner = 34, thick = 1.6, thin = 0.5, gap = 4,
} = {}) {
  const a = inset, b = inset + gap;
  const rect = (o, sw, op = 1) =>
    `<rect x="${n(o)}" y="${n(o)}" width="${n(w - o * 2)}" height="${n(h - o * 2)}"
      fill="none" stroke="${colour}" stroke-width="${n(sw)}" opacity="${op}"/>`;
  // Corner marks: a short bracket set inside the inner rule.
  const c = corner, m = b + 6;
  const bracket = (x, y, sx, sy) =>
    `<path d="M${n(x + sx * c)} ${n(y)} L${n(x)} ${n(y)} L${n(x)} ${n(y + sy * c)}"
      fill="none" stroke="${colour}" stroke-width="${n(thick)}" opacity="0.95"/>`;
  return `<svg viewBox="0 0 ${w} ${h}" width="100%" height="100%" preserveAspectRatio="none"
    aria-hidden="true" xmlns="http://www.w3.org/2000/svg">
    ${rect(a, thick)}${rect(b, thin, 0.75)}
    ${bracket(m, m, 1, 1)}${bracket(w - m, m, -1, 1)}
    ${bracket(m, h - m, 1, -1)}${bracket(w - m, h - m, -1, -1)}
  </svg>`;
}

/**
 * A corner ornament: a quarter-rosette fan, drawn from the same
 * eight-fold division so it belongs to the girih family rather than
 * being a second, unrelated decorative language.
 */
export function cornerFan({ size = 40, colour = '#B4933E', opacity = 0.8 } = {}) {
  const arcs = Array.from({ length: 5 }, (_, i) => {
    const r = size * (0.28 + i * 0.17);
    return `<path d="M0 ${n(r)} A${n(r)} ${n(r)} 0 0 0 ${n(r)} 0" fill="none"
      stroke="${colour}" stroke-width="${n(0.5 + (4 - i) * 0.12)}"
      opacity="${n(opacity * (1 - i * 0.13))}"/>`;
  }).join('');
  const rays = Array.from({ length: 4 }, (_, i) => {
    const a = ((i + 1) * Math.PI) / 10;
    return `<path d="M0 0 L${n(size * 0.9 * Math.cos(a))} ${n(size * 0.9 * Math.sin(a))}"
      stroke="${colour}" stroke-width="0.35" opacity="${n(opacity * 0.5)}"/>`;
  }).join('');
  return `<svg viewBox="0 0 ${size} ${size}" width="${size}" height="${size}" aria-hidden="true"
    xmlns="http://www.w3.org/2000/svg">${rays}${arcs}</svg>`;
}

/** A centred typographic flourish for section breaks. */
export function fleuron({ colour = '#B4933E', width = 120 } = {}) {
  const h = 18, c = width / 2;
  return `<svg viewBox="0 0 ${width} ${h}" width="${width}" height="${h}" aria-hidden="true"
    xmlns="http://www.w3.org/2000/svg">
    <path d="M0 ${h / 2} H${n(c - 22)}" stroke="${colour}" stroke-width="0.6"/>
    <path d="M${n(c + 22)} ${h / 2} H${width}" stroke="${colour}" stroke-width="0.6"/>
    <path d="M${n(c - 14)} ${h / 2} L${c} ${n(h / 2 - 6)} L${n(c + 14)} ${h / 2}
             L${c} ${n(h / 2 + 6)} Z" fill="none" stroke="${colour}" stroke-width="0.9"/>
    <circle cx="${c}" cy="${h / 2}" r="1.8" fill="${colour}"/>
  </svg>`;
}

/**
 * The embossing effect, in CSS. Real embossing is a physical deformation
 * of the sheet; on screen and in PDF it is simulated by lighting — a
 * light edge on the upper-left and a shadow on the lower-right, tight
 * enough to read as relief rather than as a drop shadow.
 *
 * Returned as a declaration string so the callers share one definition
 * and the effect cannot drift between the cover and the dividers.
 */
export const EMBOSS = {
  /** Gold foil on a dark ground. */
  gold: 'text-shadow: 0 0.6pt 0 rgba(255,246,214,.55), 0 -0.5pt 0 rgba(90,64,18,.75),'
    + ' 0.4pt 0 0 rgba(255,246,214,.25), 0 1.6pt 2.4pt rgba(0,0,0,.4);',
  /** Blind emboss: no ink, relief only, on a pale ground. */
  blind: 'text-shadow: 0 1pt 0 rgba(255,255,255,.95), 0 -0.7pt 0.6pt rgba(20,38,74,.22);',
  /** Deboss into a dark ground. */
  deboss: 'text-shadow: 0 -0.7pt 0 rgba(0,0,0,.55), 0 0.7pt 0 rgba(255,255,255,.16);',
};

/** A metallic gradient for foil-stamped display type. */
export function foilGradient(id = 'foil', a = '#F3E3B3', b = '#B4933E', c = '#8A6A3B') {
  return `<linearGradient id="${id}" x1="0" y1="0" x2="1" y2="1">
    <stop offset="0%" stop-color="${c}"/><stop offset="22%" stop-color="${b}"/>
    <stop offset="46%" stop-color="${a}"/><stop offset="58%" stop-color="${b}"/>
    <stop offset="78%" stop-color="${a}"/><stop offset="100%" stop-color="${c}"/>
  </linearGradient>`;
}

/** Foil-stamped display line, set as SVG so the gradient fills the glyphs. */
export function foilText(text, { size = 40, width = 520, family = 'Georgia, serif',
  weight = 700, tracking = 0, id = 'foil' } = {}) {
  const h = size * 1.35;
  return `<svg viewBox="0 0 ${width} ${h}" width="100%" height="${h}" aria-hidden="true"
    xmlns="http://www.w3.org/2000/svg"><defs>${foilGradient(id)}</defs>
    <text x="${width / 2}" y="${n(h * 0.74)}" text-anchor="middle" fill="url(#${id})"
      font-family="${family}" font-size="${size}" font-weight="${weight}"
      letter-spacing="${tracking}">${text}</text></svg>`;
}
