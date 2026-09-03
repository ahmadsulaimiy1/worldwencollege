// scripts/art/lib/relief.mjs — THE DIMENSIONAL LAYER.
//
// ─────────────────────────────────────────────────────────────────────
// WHY THIS EXISTS
// ─────────────────────────────────────────────────────────────────────
// The plates in scripts/art/ are line drawings: hairlines, small nodes,
// ruled type. That was the right register for a register — an evidence
// column, a decisions docket, a provenance table are DOCUMENTS, and
// documents are drawn, not moulded.
//
// It is the wrong register for the pages that have to persuade. An
// orbit of six levels, a ladder of six awards, the reach of the College
// across sixty countries — those are the figures a reader looks at
// before deciding anything, and a hairline diagram of them reads as a
// technical appendix. The owner asked for the other thing, by example:
// struck, glossy, dimensional objects with light behaving on them.
//
// So this file adds relief to the same palette rather than a second
// palette beside it. Everything here resolves to INK, the same gold and
// the same oxford blue as every other surface on the site, and nothing
// here introduces a colour the brand does not already own — which is
// what separates a house infographic from a stock template.
//
// ─────────────────────────────────────────────────────────────────────
// HOW THE LIGHT WORKS, AND WHY IT IS ONE DECISION
// ─────────────────────────────────────────────────────────────────────
// ONE light source, upper-left, on every object in every plate. That is
// the whole trick and it is the thing stock infographics get wrong: a
// glossy disc lit from the top-left beside a card shadowed to the
// bottom-left reads as two images pasted together. Here the specular
// cap is always at 32%/26%, the cast shadow always falls to +3/+7, and
// the inner rim light always sits on the upper edge.
//
// Consequently every helper takes its geometry and NOT its lighting.
// There is no `angle` parameter, deliberately, so a later drawing
// cannot introduce a second sun.
//
// ─────────────────────────────────────────────────────────────────────
// REDUCED MOTION AND SIZE
// ─────────────────────────────────────────────────────────────────────
// Filters are expensive and a feGaussianBlur per object at plate scale
// is measurable. Every shadow here is a single reusable filter in defs
// referenced by id, never a per-object filter, and the blur radii are
// chosen so one filter serves every size on the plate.
import { INK, n } from './plate.mjs';

// ── DEFS ─────────────────────────────────────────────────────────────
// Emitted once per plate. `reliefDefs()` returns the whole block; a
// plate that calls it twice would duplicate ids, so it is called once
// at the top of a body and never inside a map.
export function reliefDefs({ id = 'r' } = {}) {
  return `  <defs>
    <!-- GOLD, STRUCK. Three stops rather than two: a struck metal
         surface is bright at the lit edge, saturated in the body and
         warm-dark in the shadow, and a two-stop ramp reads as plastic
         because plastic is exactly the material with no mid-tone. -->
    <linearGradient id="${id}-gold" x1="0.18" y1="0" x2="0.82" y2="1">
      <stop offset="0"    stop-color="${INK.goldChampagne}"/>
      <stop offset="0.34" stop-color="${INK.goldSoft}"/>
      <stop offset="0.68" stop-color="${INK.goldRich}"/>
      <stop offset="1"    stop-color="${INK.bronze}"/>
    </linearGradient>

    <!-- The same metal turned over, for a face that catches light from
         below — the underside of a ribbon, the return of a fold. -->
    <linearGradient id="${id}-gold-under" x1="0.2" y1="1" x2="0.8" y2="0">
      <stop offset="0"    stop-color="${INK.bronze}"/>
      <stop offset="0.55" stop-color="${INK.goldRoyal}"/>
      <stop offset="1"    stop-color="${INK.goldSoft}"/>
    </linearGradient>

    <!-- OXFORD, DEEP. The ground a struck object sits in. -->
    <linearGradient id="${id}-deep" x1="0.2" y1="0" x2="0.8" y2="1">
      <stop offset="0"    stop-color="${INK.navy}"/>
      <stop offset="0.5"  stop-color="${INK.midnight}"/>
      <stop offset="1"    stop-color="${INK.oxford}"/>
    </linearGradient>

    <!-- GLASS. A pale tablet on a dark ground: mostly transparent, with
         a lit top edge and a faint warm cast at the foot where the gold
         beneath it bounces. -->
    <linearGradient id="${id}-glass" x1="0.15" y1="0" x2="0.85" y2="1">
      <stop offset="0"   stop-color="#FFFFFF" stop-opacity="0.20"/>
      <stop offset="0.4" stop-color="#FFFFFF" stop-opacity="0.06"/>
      <stop offset="1"   stop-color="${INK.goldRoyal}" stop-opacity="0.09"/>
    </linearGradient>

    <!-- The specular cap: a bright crescent across the upper third,
         falling off to nothing before the equator. Radial rather than
         linear because a highlight on a curved body is a patch, not a
         band, and the linear version is the single most common tell of
         a flat object pretending to be round. -->
    <radialGradient id="${id}-spec" cx="0.32" cy="0.26" r="0.62">
      <stop offset="0"   stop-color="#FFFFFF" stop-opacity="0.62"/>
      <stop offset="0.38" stop-color="#FFFFFF" stop-opacity="0.16"/>
      <stop offset="1"   stop-color="#FFFFFF" stop-opacity="0"/>
    </radialGradient>

    <!-- The halo a lit object throws onto the ground behind it. -->
    <radialGradient id="${id}-halo" cx="0.5" cy="0.5" r="0.5">
      <stop offset="0"    stop-color="${INK.goldSoft}" stop-opacity="0.26"/>
      <stop offset="0.55" stop-color="${INK.goldRoyal}" stop-opacity="0.08"/>
      <stop offset="1"    stop-color="${INK.goldRoyal}" stop-opacity="0"/>
    </radialGradient>

    <!-- ONE cast shadow for the whole plate. Objects differ in size by
         a factor of six here and still share it: the blur is set for
         the middle of that range, and at both ends the error is smaller
         than the stroke width. A filter per object would be honest and
         would also be sixty filters. -->
    <filter id="${id}-cast" x="-40%" y="-40%" width="180%" height="200%">
      <feDropShadow dx="3" dy="7" stdDeviation="7"
                    flood-color="${INK.oxford}" flood-opacity="0.55"/>
    </filter>
    <filter id="${id}-cast-sm" x="-40%" y="-40%" width="180%" height="200%">
      <feDropShadow dx="1.5" dy="3" stdDeviation="3.2"
                    flood-color="${INK.oxford}" flood-opacity="0.5"/>
    </filter>
    <filter id="${id}-glow" x="-60%" y="-60%" width="220%" height="220%">
      <feGaussianBlur stdDeviation="9"/>
    </filter>
  </defs>`;
}

// ── A STRUCK DISC ────────────────────────────────────────────────────
// The medallion the orbit hangs on. Four painted layers in one order,
// every time: halo, body, specular cap, rim.
export function disc(cx, cy, r, { id = 'r', tone = 'gold', halo = true } = {}) {
  const fill = tone === 'gold' ? `url(#${id}-gold)` : `url(#${id}-deep)`;
  const rim = tone === 'gold' ? INK.goldChampagne : INK.goldRoyal;
  return `${halo ? `    <circle cx="${n(cx)}" cy="${n(cy)}" r="${n(r * 1.55)}" fill="url(#${id}-halo)"/>` : ''}
    <circle cx="${n(cx)}" cy="${n(cy)}" r="${n(r)}" fill="${fill}" filter="url(#${id}-cast)"/>
    <circle cx="${n(cx)}" cy="${n(cy)}" r="${n(r)}" fill="url(#${id}-spec)"/>
    <circle cx="${n(cx)}" cy="${n(cy)}" r="${n(r)}" fill="none"
            stroke="${rim}" stroke-opacity="0.55" stroke-width="${n(Math.max(0.9, r * 0.035))}"/>
    <circle cx="${n(cx)}" cy="${n(cy)}" r="${n(r * 0.9)}" fill="none"
            stroke="${INK.oxford}" stroke-opacity="0.18" stroke-width="0.8"/>`;
}

// ── A GLASS TABLET ───────────────────────────────────────────────────
// The card that carries a sentence beside a disc. Rounded, lit along
// its top edge, with the hairline gold border the site's own cards wear
// so the plate and the page around it read as one material system.
export function tablet(x, y, w, h, { id = 'r', r = 14, accent = INK.goldRoyal } = {}) {
  return `    <rect x="${n(x)}" y="${n(y)}" width="${n(w)}" height="${n(h)}" rx="${n(r)}"
          fill="url(#${id}-deep)" filter="url(#${id}-cast-sm)"/>
    <rect x="${n(x)}" y="${n(y)}" width="${n(w)}" height="${n(h)}" rx="${n(r)}" fill="url(#${id}-glass)"/>
    <rect x="${n(x + 0.5)}" y="${n(y + 0.5)}" width="${n(w - 1)}" height="${n(h - 1)}" rx="${n(r)}"
          fill="none" stroke="${accent}" stroke-opacity="0.42" stroke-width="1"/>
    <path d="M ${n(x + r)} ${n(y + 0.9)} H ${n(x + w - r)}" stroke="#FFFFFF" stroke-opacity="0.22"
          stroke-width="1.1" stroke-linecap="round" fill="none"/>`;
}

// ── A DIMENSIONAL RIBBON ─────────────────────────────────────────────
// One rung of a stacked ladder, drawn as a solid with a visible return
// edge on its right — the shape in the reference the owner sent, in the
// College's metal. `depth` is the thickness of the solid, and the
// return is drawn from the SAME gradient turned over, which is what
// makes it read as one object folded rather than two shapes abutting.
export function ribbon(x, y, w, h, { id = 'r', depth = 13, r = 9, lit = false } = {}) {
  const face = lit ? `url(#${id}-gold)` : `url(#${id}-deep)`;
  const edge = lit ? INK.goldChampagne : INK.goldRoyal;
  return `    <path d="M ${n(x + w)} ${n(y + r)}
             a ${n(r)} ${n(r)} 0 0 0 ${n(-r)} ${n(-r)}
             l ${n(depth)} ${n(-depth * 0.42)}
             a ${n(r)} ${n(r)} 0 0 1 ${n(r)} ${n(r)}
             v ${n(h - r * 2)}
             a ${n(r)} ${n(r)} 0 0 1 ${n(-r)} ${n(r)}
             l ${n(-depth)} ${n(-depth * 0.42)}
             a ${n(r)} ${n(r)} 0 0 0 ${n(r)} ${n(-r)} Z"
          fill="url(#${id}-gold-under)" opacity="${lit ? '0.95' : '0.5'}"/>
    <rect x="${n(x)}" y="${n(y)}" width="${n(w)}" height="${n(h)}" rx="${n(r)}"
          fill="${face}" filter="url(#${id}-cast)"/>
    <rect x="${n(x)}" y="${n(y)}" width="${n(w)}" height="${n(h)}" rx="${n(r)}"
          fill="url(#${lit ? `${id}-spec` : `${id}-glass`})"/>
    <rect x="${n(x + 0.5)}" y="${n(y + 0.5)}" width="${n(w - 1)}" height="${n(h - 1)}" rx="${n(r)}"
          fill="none" stroke="${edge}" stroke-opacity="${lit ? '0.7' : '0.4'}" stroke-width="1"/>`;
}

// ── AN ORBIT RING ────────────────────────────────────────────────────
// The band the discs sit on. Two arcs rather than a circle so the ring
// can be lit on one side and fall away on the other, which is what
// stops a flat stroke reading as a wireframe.
export function orbit(cx, cy, r, { id = 'r', width = 16 } = {}) {
  return `    <circle cx="${n(cx)}" cy="${n(cy)}" r="${n(r)}" fill="none"
            stroke="url(#${id}-deep)" stroke-width="${n(width)}" filter="url(#${id}-cast-sm)"/>
    <circle cx="${n(cx)}" cy="${n(cy)}" r="${n(r)}" fill="none"
            stroke="${INK.goldRoyal}" stroke-opacity="0.5" stroke-width="1"/>
    <circle cx="${n(cx)}" cy="${n(cy)}" r="${n(r - width / 2)}" fill="none"
            stroke="${INK.goldSoft}" stroke-opacity="0.22" stroke-width="0.8"/>
    <path d="M ${n(cx - r)} ${n(cy)} A ${n(r)} ${n(r)} 0 0 1 ${n(cx)} ${n(cy - r)}"
          fill="none" stroke="${INK.goldSoft}" stroke-opacity="0.5"
          stroke-width="1.6" stroke-linecap="round"/>`;
}

// Points evenly around a circle, starting at twelve o'clock and
// running clockwise. Returned rather than drawn, so a caller can put
// anything at them.
export function around(cx, cy, r, count, { start = -90 } = {}) {
  return Array.from({ length: count }, (_, i) => {
    const a = ((start + (360 / count) * i) * Math.PI) / 180;
    return { x: cx + r * Math.cos(a), y: cy + r * Math.sin(a), angle: a, index: i };
  });
}

// ── RESPONSIVE TYPE INSIDE THE PLATE ─────────────────────────────────
// A 980-wide plate on a 390-wide phone is scaled to 0.4, and a 19px
// label becomes 7.6px, which is not a label. The site's answer until now
// was a horizontal scroller with a 700px floor — which is exactly the
// "cut off towards the right side" the owner reported, and they were
// right: a reader on a phone should not have to drag a diagram
// sideways to read it.
//
// This is the fix, and it works because an INLINE svg lives in the host
// document: a <style> inside it is subject to the document's own media
// queries. So the plate carries its own narrow-screen type scale, the
// element is allowed to shrink to the container, and the text grows in
// user units by roughly the reciprocal of the scale.
//
// Emitted once per plate, immediately after the defs.
export function reliefType() {
  return `  <style>
    /* Sizes are set per-element; these classes only override at the
       widths where the plate has been scaled down enough to need it.
       Two steps rather than a continuous ramp: a diagram is either
       being read at its designed size or it is being read small, and
       the intermediate widths are where it is still comfortable. */
    @media (max-width: 780px) {
      .t-lbl  { font-size: 26px; }
      .t-sub  { font-size: 17px; }
      .t-num  { font-size: 46px; }
      .t-eyeb { font-size: 17px; }
      .t-note { font-size: 17px; }
      .t-mini { font-size: 14px; }
    }
    @media (max-width: 520px) {
      .t-lbl  { font-size: 32px; }
      .t-sub  { font-size: 21px; }
      .t-num  { font-size: 54px; }
      .t-eyeb { font-size: 20px; }
      .t-note { font-size: 21px; }
      .t-mini { font-size: 17px; }
    }

    /* THE ONE THING GROWING THE TYPE CANNOT FIX.
       A radial layout puts its labels on the horizontal, anchored away
       from the centre, and a 28-character label grown to stay legible
       simply runs off the plate — the ring has no more room to give it
       and no font size satisfies both constraints at 390px.
       So a plate may carry a label twice: the full form for the widths
       that can hold it, and a short form — a CEFR band, a numeral, a
       code — for the widths that cannot. Exactly one is ever visible,
       so neither is dead weight and the drawing never carries a label
       it has to clip. */
    .lbl-narrow { display: none; }
    @media (max-width: 780px) {
      .lbl-wide { display: none; }
      .lbl-narrow { display: inline; }
    }
  </style>`;
}
