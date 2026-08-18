#!/usr/bin/env node
/**
 * THE GUILLOCHÉ — generated, not sourced.
 *
 * SEB §30.11: `src/art/` is AUTHORED, never sourced. No stock vectors, no
 * raster ornament. The rosette is generated from layered hypotrochoids by
 * this script, so it is deterministic, re-runnable and diffable — a
 * change to the ornament arrives in a pull request as a change to the
 * parameters that produced it, rather than as an opaque new binary.
 *
 * A hypotrochoid is the curve traced by a point fixed to a circle rolling
 * inside another circle. It is what a rose engine lathe draws, which is
 * what a banknote is engraved with, which is why this reads as security
 * printing rather than as a decorative swirl:
 *
 *     x(t) = (R − r)·cos t + d·cos((R − r)/r · t)
 *     y(t) = (R − r)·sin t − d·sin((R − r)/r · t)
 *
 * Two properties of the curve govern everything below:
 *
 *   LOBES = R / gcd(R, r)    the petals the reader actually sees
 *   TURNS = r / gcd(R, r)    the revolutions before the figure CLOSES
 *
 * The script computes both rather than drawing "enough" of the curve. An
 * unclosed guilloché has a visible seam, and a seam is the one thing a
 * banknote engraving may not have.
 *
 * SAMPLING IS PER LOBE, NOT PER TURN. Sampling per turn is the obvious
 * thing to write and it is wrong twice over: a figure closing in seven
 * turns gets seven times the points of one closing in one, and the
 * resolution the reader perceives is set by the lobe, not the revolution.
 * The first draft of this file sampled per turn and emitted a 2.1MB
 * background ornament.
 *
 * Deterministic: no randomness, no clock. Running it twice produces
 * byte-identical files, so `npm run art` is safe in CI and any diff means
 * somebody changed a parameter.
 */

import { mkdir, writeFile } from 'node:fs/promises';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const here = dirname(fileURLToPath(import.meta.url));
const outDir = join(here, '..', 'src', 'art');

/** Points per lobe. Forty-eight is smooth at any size the ornament is used at. */
const SAMPLES_PER_LOBE = 48;

/** Two decimals. Enough for a 1400px figure, and it diffs cleanly. */
const PRECISION = 2;

const gcd = (a, b) => (b === 0 ? a : gcd(b, a % b));

/**
 * One hypotrochoid, as an SVG path `d` attribute plus the figure's facts.
 *
 * @param {{R:number,r:number,d:number,scale:number}} spec
 */
function hypotrochoid({ R, r, d, scale }) {
  const g = gcd(R, r);
  const lobes = R / g;
  const turns = r / g;
  const samples = lobes * SAMPLES_PER_LOBE;
  const k = (R - r) / r;

  const points = [];
  for (let i = 0; i < samples; i += 1) {
    const t = (i / samples) * turns * 2 * Math.PI;
    const x = (R - r) * Math.cos(t) + d * Math.cos(k * t);
    const y = (R - r) * Math.sin(t) - d * Math.sin(k * t);
    points.push(`${(x * scale).toFixed(PRECISION)},${(y * scale).toFixed(PRECISION)}`);
  }
  // `Z` closes it back to the first point exactly, which is why the loop
  // stops one sample short of the full revolution.
  return { d: `M${points.join('L')}Z`, lobes, turns, points: samples };
}

/**
 * The rosette. Layer ratios are chosen so no two layers share a lobe
 * count: layers that share one superimpose into a single thicker line,
 * which is exactly the failure that makes a generated ornament look
 * generated. The extents nest, so the figure reads as concentric rings
 * cut at different depths rather than as five drawings on top of one
 * another.
 */
const ROSETTE = [
  { R: 37, r: 7, d: 9, opacity: 0.90, width: 0.5 },   // 37 lobes, extent 39
  { R: 29, r: 6, d: 8, opacity: 0.72, width: 0.45 },  // 29 lobes, extent 31
  { R: 23, r: 5, d: 7, opacity: 0.58, width: 0.4 },   // 23 lobes, extent 25
  { R: 19, r: 4, d: 6, opacity: 0.44, width: 0.35 },  // 19 lobes, extent 21
  { R: 13, r: 3, d: 5, opacity: 0.32, width: 0.3 },   // 13 lobes, extent 15
];

/**
 * The seal ground: a tighter figure for the 88px Seal, where the full
 * five-layer rosette resolves to a grey disc. Drawn at its OWN parameters
 * rather than scaled down — line art does not scale, which is the whole
 * reason a type family carries an optical size axis (SEB §30.6).
 */
const SEAL = [
  { R: 11, r: 3, d: 4, opacity: 0.90, width: 1.1 },
  { R: 7,  r: 2, d: 3, opacity: 0.60, width: 0.9 },
];

function rosette({ size = 1000, layers = ROSETTE, name = '' } = {}) {
  const half = size / 2;
  const extent = Math.max(...layers.map((l) => l.R - l.r + l.d));
  const scale = (half * 0.96) / extent;

  const figures = layers.map((layer) => ({ layer, figure: hypotrochoid({ ...layer, scale }) }));

  const paths = figures
    .map(({ layer, figure }) =>
      `    <!-- ${figure.lobes} lobes · closes in ${figure.turns} turn(s) · R${layer.R} r${layer.r} d${layer.d} -->\n` +
      `    <path d="${figure.d}" stroke-opacity="${layer.opacity}" stroke-width="${layer.width}"/>`)
    .join('\n');

  const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="${-half} ${-half} ${size} ${size}" role="presentation" aria-hidden="true">
  <!--
    StromeX guilloché${name ? ` · ${name}` : ''}. Generated by
    build/generate-guilloche.mjs — do not edit by hand; change the
    parameters and re-run \`npm run art\`. SEB §30.11.
  -->
  <g fill="none" stroke="currentColor" stroke-linejoin="round" vector-effect="non-scaling-stroke">
${paths}
  </g>
</svg>
`;
  return { svg, points: figures.reduce((n, f) => n + f.figure.points, 0) };
}

const artefacts = [
  ['guilloche.svg', rosette({ name: 'ground' })],
  ['guilloche-seal.svg', rosette({ size: 200, layers: SEAL, name: 'seal' })],
];

await mkdir(outDir, { recursive: true });
for (const [name, { svg, points }] of artefacts) {
  await writeFile(join(outDir, name), svg, 'utf8');
  console.log(`art: src/art/${name} — ${points} points, ${(Buffer.byteLength(svg) / 1024).toFixed(1)}kB`);
}
console.log('art: deterministic — re-running produces byte-identical files');
