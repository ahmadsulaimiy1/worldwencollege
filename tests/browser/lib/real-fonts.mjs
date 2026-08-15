// THE FONTS THE VISITOR ACTUALLY GETS.
//
// The site loads Playfair Display, Inter, Cairo and Amiri from Google
// Fonts. Any environment that cannot reach fonts.googleapis.com renders
// the whole site in fallback faces — and renders it CONVINCINGLY, which
// is the dangerous part. Nothing errors. Every existing check passes.
// The page simply is not the page.
//
// That is not hypothetical. An entire redesign was built and verified
// against fallback metrics, shipped, and turned out to have an Arabic
// headline whose lines collided, because Amiri needs roughly half again
// the leading that Playfair Display does and nobody had ever seen the
// two side by side.
//
// So this module removes the network from the question. The four
// families are installed as devDependencies, inlined as data URIs, and
// served to the page by intercepting the Google Fonts request. Every
// browser check that cares what the page LOOKS like uses this, and gets
// the same answer on a laptop, in CI, and inside a sandbox with no
// outbound access at all.

import { readFileSync, existsSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const HERE = dirname(fileURLToPath(import.meta.url));
const ROOT = dirname(dirname(dirname(HERE)));
const FS_DIR = join(ROOT, 'node_modules', '@fontsource');

// Which weights the site actually asks Google for, per partials/head.html.
// Loading only these keeps the payload to what a visitor downloads.
export const FACES = [
  { family: 'Playfair Display', pkg: 'playfair-display', subset: 'latin', weights: ['600', '700'] },
  { family: 'Playfair Display', pkg: 'playfair-display', subset: 'latin', weights: ['400'], style: 'italic' },
  { family: 'Inter', pkg: 'inter', subset: 'latin', weights: ['400', '600', '700', '800'] },
  { family: 'Amiri', pkg: 'amiri', subset: 'arabic', weights: ['400', '700'] },
  { family: 'Cairo', pkg: 'cairo', subset: 'arabic', weights: ['400', '600', '700'] },
];

/** Families that carry NO Arabic glyphs. Arabic text landing on one of
 *  these has silently fallen through to whatever the OS offers. */
export const LATIN_ONLY = ['Playfair Display', 'Inter', 'Georgia', 'Times New Roman'];

/** Families that do carry Arabic. */
export const ARABIC_CAPABLE = ['Amiri', 'Cairo', 'Noto Naskh Arabic', 'Noto Sans Arabic'];

export const HAS_ARABIC = /[؀-ۿݐ-ݿﭐ-﷿ﹰ-﻿]/;

let cached = null;

/** One stylesheet with every face inlined, so there is no second request. */
export function fontCss() {
  if (cached) return cached;
  const missing = [];
  let css = '';
  for (const f of FACES) {
    for (const w of f.weights) {
      const style = f.style || 'normal';
      const suffix = style === 'italic' ? 'italic' : 'normal';
      const file = join(FS_DIR, f.pkg, 'files', `${f.pkg}-${f.subset}-${w}-${suffix}.woff2`);
      if (!existsSync(file)) { missing.push(`${f.family} ${w} ${style}`); continue; }
      const b64 = readFileSync(file).toString('base64');
      css += `@font-face{font-family:'${f.family}';font-style:${style};font-weight:${w};`
        + `font-display:block;src:url(data:font/woff2;base64,${b64}) format('woff2');}\n`;
    }
  }
  if (missing.length) {
    throw new Error(`Missing font files for: ${missing.join(', ')}. `
      + `Run npm install — @fontsource/* are devDependencies precisely so this cannot drift.`);
  }
  cached = css;
  return css;
}

/**
 * Fulfil the page's Google Fonts request from the local copies.
 *
 * `font-display: block` above, not `swap`: a swap would let the check
 * measure the fallback for a frame and race the assertion. Blocking
 * means anything measured is measured in the real face.
 */
export async function serveRealFonts(context) {
  const css = fontCss();
  await context.route('https://fonts.googleapis.com/**', (route) =>
    route.fulfill({ status: 200, contentType: 'text/css; charset=utf-8', body: css }));
  // gstatic is only ever reached from inside the stylesheet above, which
  // no longer points at it — but a stray reference should fail loudly
  // rather than silently fall back.
  await context.route('https://fonts.gstatic.com/**', (route) => route.abort());
  return css.length;
}

/** Wait until the faces have actually painted, not merely been requested. */
export async function fontsSettled(page) {
  await page.evaluate(() => document.fonts.ready);
  const loaded = await page.evaluate(() =>
    [...document.fonts].filter((f) => f.status === 'loaded').map((f) => `${f.family} ${f.weight}`));
  if (!loaded.length) throw new Error('No font faces loaded — the interception did not take.');
  return [...new Set(loaded)];
}
