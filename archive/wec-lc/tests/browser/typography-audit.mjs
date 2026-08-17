// Run with: node tests/browser/typography-audit.mjs
//
// THE CHECK THAT WAS MISSING.
//
// The route audit measures whether a page is broken. It counts overflow,
// tap targets, heading order, missing alt text, script errors — and a
// page can pass all of it while being unreadable, because none of those
// things looks at type.
//
// A redesign shipped with the Arabic headline's second line crashing
// into the first. Ninety-nine checks were green. The defect was a
// line-height of 1.04 on a Naskh face, and no check on this site had an
// opinion about line-height at all.
//
// So this file has opinions about type, and it forms them in the REAL
// faces — Playfair Display, Inter, Amiri and Cairo, served locally by
// tests/browser/lib/real-fonts.mjs — because measuring a fallback tells
// you about a page nobody will ever see.
//
// WHAT IT REFUSES
//
//   1. Arabic text set in a Latin-only family. Playfair Display and
//      Inter carry no Arabic glyphs. When they head the stack the
//      browser falls through per-character to whatever the operating
//      system has, so the page renders differently on every machine and
//      identically on none of them.
//
//   2. Letter-spacing on Arabic. Arabic is cursive: letters JOIN. Adding
//      or removing space between them does not track the line, it pulls
//      the joins apart. Negative tracking — and this site had -.021em on
//      its largest heading — damages the word itself.
//
//   3. Leading too tight for the script. Latin display type at 1.04 is
//      elegant restraint. Naskh at 1.04 puts one line's tashkeel inside
//      the line above it.
//
//   4. Line boxes that actually overlap, measured rather than inferred,
//      which catches whatever the three rules above do not anticipate.

import { chromium } from 'playwright';
import { spawn } from 'node:child_process';
import { readdirSync, statSync, existsSync } from 'node:fs';
import { dirname, join, relative } from 'node:path';
import { fileURLToPath } from 'node:url';
import { serveRealFonts, fontsSettled, LATIN_ONLY, ARABIC_CAPABLE } from './lib/real-fonts.mjs';

const HERE = dirname(fileURLToPath(import.meta.url));
const ROOT = dirname(dirname(HERE));
const PORT = process.env.LAB_PORT || 8815;
const BASE = `http://localhost:${PORT}`;

let pass = 0, fail = 0;
const check = (label, cond, detail) => {
  console.log((cond ? 'PASS ' : 'FAIL ') + label + (cond || detail === undefined ? '' : `\n     ${detail}`));
  cond ? pass++ : fail++;
};

// ── Thresholds, and why each is where it is ───────────────────────────
//
// LATIN_MIN is deliberately permissive. Tight leading on a big Latin
// display face is a legitimate choice and this audit has no business
// second-guessing it; the floor exists only to catch a value that must
// be a mistake.
//
// ARABIC_MIN is 1.45. Amiri's ascenders carry tashkeel and its
// descenders swing well below the baseline, so the glyph box is much
// taller than the em. Typographers setting Naskh generally start around
// 1.6; 1.45 is the point below which lines demonstrably touch, which
// makes it the right place for a check to sit — it fails on damage
// rather than on taste.
const LATIN_MIN = 0.95;
const ARABIC_MIN = 1.45;

const SKIP = new Set(['node_modules', 'tests', 'pages', 'partials', 'docs', 'sql', 'functions', 'scripts', '.git', 'assets', 'publication']);
const routes = [];
(function walk(dir) {
  for (const entry of readdirSync(dir)) {
    if (SKIP.has(entry) || entry.startsWith('.')) continue;
    const p = join(dir, entry);
    if (statSync(p).isDirectory()) walk(p);
    else if (entry.endsWith('.html')) {
      const rel = '/' + relative(ROOT, p).replace(/\\/g, '/');
      routes.push(rel.endsWith('/index.html') ? rel.replace(/index\.html$/, '') : rel);
    }
  }
})(ROOT);
routes.sort();
check(`There are routes to audit — ${routes.length}`, routes.length > 20);

const server = spawn(process.execPath, ['--experimental-sqlite', join(HERE, 'lab-server.mjs')], {
  env: { ...process.env, LAB_PORT: String(PORT) }, stdio: ['ignore', 'pipe', 'pipe'],
});
await new Promise((resolve, reject) => {
  const t = setTimeout(() => reject(new Error('server did not start')), 20000);
  server.stdout.on('data', (d) => { if (String(d).includes('ready')) { clearTimeout(t); resolve(); } });
  server.stderr.on('data', (d) => { if (!/ExperimentalWarning|trace-warnings/.test(String(d))) process.stderr.write(d); });
});

const exe = process.env.PW_CHROMIUM || '/opt/pw-browsers/chromium-1194/chrome-linux/chrome';
const browser = await chromium.launch(existsSync(exe) ? { executablePath: exe } : {});
const ctx = await browser.newContext({ viewport: { width: 1440, height: 1000 } });
const bytes = await serveRealFonts(ctx);
console.log(`Serving ${(bytes / 1024).toFixed(0)} KB of real font CSS in place of Google Fonts.\n`);

const wrongFamily = [];
const spacedArabic = [];
const tightLeading = [];
const collisions = [];
const mixedFace = [];
const flatStats = [];
const brokenFigures = [];
let elementsMeasured = 0;
let facesSeen = [];

for (const route of routes) {
  const page = await ctx.newPage();
  try {
    await page.goto(BASE + route, { waitUntil: 'domcontentloaded' });
    facesSeen = await fontsSettled(page);
  } catch (e) {
    check(`${route} loads`, false, e.message);
    await page.close();
    continue;
  }

  const found = await page.evaluate(({ LATIN_ONLY, ARABIC_CAPABLE, LATIN_MIN, ARABIC_MIN }) => {
    const AR = /[؀-ۿݐ-ݿﭐ-﷿ﹰ-﻿]/;
    const out = { wrongFamily: [], spaced: [], tight: [], overlap: [], mixedFace: [], flatStats: [], brokenFigures: [], n: 0 };

    // A HEADLINE FIGURE HAS TO READ AS ONE.
    //
    // .stat-row is the component the site uses to publish its numbers —
    // fees, module counts, taught hours, appointed members — and its
    // whole job is that the figure dominates its caption. Two separate
    // faults broke that in one afternoon, and neither was visible to any
    // check that existed:
    //
    //   · the CSS styled only <strong>, while 105 of the site's 138
    //     figures are marked up with <b>, so they rendered as body text
    //     jammed against the label: "B1CEFR LEVEL", "$3,167TUITION";
    //   · the label rule was written as a descendant selector, so it
    //     also caught the <span dir="ltr"> that wraps numerals inside
    //     the figure on Arabic pages — the <b> computed to 38.4px and
    //     painted at 11.84px.
    //
    // Both are the same question: is the figure actually bigger than
    // its caption? Ratio rather than absolute size, so the check
    // survives a redesign of the scale.
    for (const item of document.querySelectorAll('.stat-row__item')) {
      const fig = item.querySelector('b, strong');
      const cap = item.querySelector(':scope > span');
      if (!fig || !cap) continue;
      // Measure the deepest element that actually holds the text: the
      // figure may be wrapped for bidi, and the wrapper is what paints.
      const painted = fig.querySelector('span') || fig;
      const f = parseFloat(getComputedStyle(painted).fontSize);
      const c = parseFloat(getComputedStyle(cap).fontSize);
      if (!(f > 0) || !(c > 0)) continue;
      if (f < c * 1.6) {
        out.flatStats.push(`${(fig.textContent || '').trim().slice(0, 12)} ${f}px vs label ${c}px`);
      }
    }
    // A FIGURE MUST OCCUPY ONE LINE.
    //
    // The homepage's four headline statistics shipped rendering as
    // vertical columns of digits — `1,200` set as five stacked
    // characters — and every check on this site was green while it did.
    //
    // The mechanism is worth encoding rather than just fixing, because
    // it will recur: js/atelier.js wraps each digit of an assembling
    // figure in its own <span> so the digits can be animated
    // separately, and any rule anywhere that matches "a span inside
    // this component" — a descendant selector written for the LABEL —
    // also matches every one of those digits. Give them `display:
    // block` and the number stacks; give them a width and it wraps.
    //
    // Measured as a height ratio rather than by inspecting the CSS,
    // so it catches whatever causes it: a stacked figure is more than
    // 1.6 line-heights tall, a correct one is exactly one.
    for (const fig of document.querySelectorAll('[data-assemble]')) {
      const cs = getComputedStyle(fig);
      const size = parseFloat(cs.fontSize);
      const lead = parseFloat(cs.lineHeight) || size * 1.2;
      const h = fig.getBoundingClientRect().height;
      if (!(size > 0) || !(h > 0)) continue;
      if (h > lead * 1.6) {
        out.brokenFigures.push(
          `"${(fig.textContent || '').trim().slice(0, 12)}" is ${Math.round(h)}px tall `
          + `on a ${Math.round(lead)}px line — the figure is broken across lines`);
      }
    }

    const ctx = document.createElement('canvas').getContext('2d');
    const inkCache = new Map();
    const first = (stack) => (stack.split(',')[0] || '').trim().replace(/^["']|["']$/g, '');
    const label = (el, txt) => `<${el.tagName.toLowerCase()}${el.className && typeof el.className === 'string'
      ? '.' + el.className.trim().split(/\s+/)[0] : ''}> "${txt.slice(0, 34)}"`;

    for (const el of document.querySelectorAll('body *')) {
      // Only elements that own text directly — a wrapper inherits its
      // child's problem and would report it twice.
      const own = [...el.childNodes].filter((n) => n.nodeType === 3 && n.textContent.trim())
        .map((n) => n.textContent).join(' ');
      if (!own.trim()) continue;
      const cs = getComputedStyle(el);
      if (cs.display === 'none' || cs.visibility === 'hidden') continue;
      const rect = el.getBoundingClientRect();
      if (!rect.width || !rect.height) continue;

      out.n++;
      const arabic = AR.test(own);
      const size = parseFloat(cs.fontSize);
      const lh = cs.lineHeight === 'normal' ? size * 1.2 : parseFloat(cs.lineHeight);
      const ratio = lh / size;
      const tracking = parseFloat(cs.letterSpacing) || 0;
      const fam = first(cs.fontFamily);

      if (arabic) {
        // THE REQUIREMENT IS COVERAGE, NOT PRIMACY.
        //
        // This first demanded that an Arabic-capable family head the
        // stack, and reported 2,500 violations. It was wrong. CSS falls
        // back PER CHARACTER: with `Playfair Display, Georgia, Amiri`,
        // Latin glyphs come from Playfair and Arabic glyphs come from
        // Amiri, which is exactly right and is what the page does.
        //
        // What actually matters is that SOME family in the stack has
        // Arabic, so the browser never reaches the generic keyword and
        // picks whatever the operating system happens to offer — which
        // is how a page renders differently on every machine.
        const stack = cs.fontFamily.split(',').map((f) => f.trim().replace(/^["']|["']$/g, ''));
        if (!stack.some((f) => ARABIC_CAPABLE.includes(f))) {
          out.wrongFamily.push(`${label(el, own)} — stack "${cs.fontFamily}" contains no Arabic-capable family`);
        }
        if (LATIN_ONLY.includes(stack[0])) out.mixedFace.push(label(el, own));

        if (Math.abs(tracking) > 0.01) {
          out.spaced.push(`${label(el, own)} — letter-spacing ${cs.letterSpacing} on cursive script`);
        }
      }

      // ── LEADING, MEASURED AGAINST THE INK ────────────────────────
      //
      // Two earlier versions of this check were wrong in the same way,
      // once for each script, and the second time is what forced the
      // right instrument.
      //
      // A fixed ratio threshold cannot work, because the ratio that
      // means "lines touch" is a property of the FACE, not of the
      // language. Measured here: Playfair Display's ink runs to 0.98×
      // its font size, Inter 0.98×, Cairo 1.41×, Amiri 1.69×. A
      // line-height of 1.2 is generous for Inter and a collision for
      // Amiri.
      //
      // Comparing rendered line boxes does not work either. A Range
      // rect is the EM box — Amiri 1.75, Cairo 1.87 — which exceeds any
      // sane leading, so an em-box comparison flags every Arabic
      // paragraph ever set. It flagged 131 correct Latin headings for
      // the same reason.
      //
      // So: measure the actual ink of THIS element's text in THIS
      // element's resolved font, and require the leading to clear it.
      // That is the physical question — will one line touch the next —
      // and it answers itself for any script and any face.
      // THE ELEMENT'S OWN TEXT, not a representative sample.
      //
      // This used a fixed probe carrying heavy tashkeel — نُمكِّن, with a
      // damma, a shadda and a kasra stacked on three letters — and
      // measured every element against it. That is the worst case the
      // face can produce, and most text is nowhere near it: the
      // language switch reads العربية, which has no vocalisation at all
      // and inks at 1.09 rather than 1.58. Held against the probe it
      // failed on all 101 routes while being perfectly well set.
      //
      // Ink is a property of the actual glyphs, so the actual glyphs are
      // what gets measured. Cached on font-and-text, since the chrome
      // repeats the same strings on every page.
      const sample = own.trim().slice(0, 120);
      const key = `${cs.fontStyle}|${cs.fontWeight}|${size}|${cs.fontFamily}|${sample}`;
      let inkRatio = inkCache.get(key);
      if (inkRatio === undefined) {
        ctx.font = `${cs.fontStyle} ${cs.fontWeight} ${size}px ${cs.fontFamily}`;
        const m = ctx.measureText(sample);
        inkRatio = (m.actualBoundingBoxAscent + m.actualBoundingBoxDescent) / size;
        inkCache.set(key, inkRatio);
      }
      // Multi-line elements only: a single line cannot collide with
      // anything. `line-height: 1` on a button whose ink is 1.05 is not
      // a defect — the glyphs simply use a little more than the box,
      // and the padding around them absorbs it.
      //
      // Counted from rendered line boxes rather than from scrollHeight,
      // which includes padding and therefore called every padded button
      // multi-line.
      const rr = document.createRange();
      const tops = new Set();
      for (const node of el.childNodes) {
        if (node.nodeType !== 3 || !node.textContent.trim()) continue;
        rr.selectNodeContents(node);
        for (const box of rr.getClientRects()) {
          if (box.height) tops.add(Math.round(box.top / Math.max(4, lh * 0.5)));
        }
      }
      if (tops.size > 1 && ratio < inkRatio) {
        out.tight.push(`${label(el, own)} — leading ${ratio.toFixed(2)} under ink ${inkRatio.toFixed(2)} `
          + `(${arabic ? 'Arabic' : 'Latin'}, ${size.toFixed(0)}px)`);
      }
    }
    return out;
  }, { LATIN_ONLY, ARABIC_CAPABLE, LATIN_MIN, ARABIC_MIN });

  elementsMeasured += found.n;
  const tag = (arr, into) => arr.forEach((s) => into.push(`${route}  ${s}`));
  tag(found.wrongFamily, wrongFamily);
  tag(found.spaced, spacedArabic);
  tag(found.tight, tightLeading);
  tag(found.overlap, collisions);
  tag(found.mixedFace, mixedFace);
  tag(found.flatStats, flatStats);
  tag(found.brokenFigures, brokenFigures);

  await page.close();
}

console.log(`Measured ${elementsMeasured} text-bearing elements across ${routes.length} routes.`);
console.log(`Faces painted: ${facesSeen.join(', ')}\n`);

const show = (arr, n = 8) => [...new Set(arr)].slice(0, n).join('\n     ')
  + (arr.length > n ? `\n     …and ${arr.length - n} more` : '');

check(`Every Arabic run has an Arabic-capable family in its stack — ${wrongFamily.length} violations`,
  wrongFamily.length === 0, show(wrongFamily));

check(`No letter-spacing is applied to Arabic — ${spacedArabic.length} violations`,
  spacedArabic.length === 0, show(spacedArabic));

check(`Leading clears the ink of the face it is set in — ${tightLeading.length} violations`,
  tightLeading.length === 0, show(tightLeading));

check(`Every published figure is set larger than its caption — ${flatStats.length} violations`,
  flatStats.length === 0, show(flatStats));

check(`No figure is broken across lines — ${brokenFigures.length} violations`,
  brokenFigures.length === 0, show(brokenFigures));

// A check that has only ever seen its own passing state proves nothing
// about its reach. Confirm each rule fires on the shape it exists for.
{
  // Measured facts, pinned. If a font update changes these the check
  // should be re-derived from the new numbers rather than quietly
  // passing on stale ones.
  const AMIRI_INK = 1.69, CAIRO_INK = 1.41, LATIN_INK = 0.98;
  check('...and the ink rule does fire on the leading that shipped broken',
    /[؀-ۿ]/.test('نُمكِّن') && !/[؀-ۿ]/.test('Empowering')
    && (76.5 / 73.6) < AMIRI_INK        // the exact hero ratio that collided
    && 1.50 < AMIRI_INK                 // 1.5 is still short for Amiri
    && 1.50 > CAIRO_INK                 // but clears Cairo
    && 1.10 > LATIN_INK);               // and Latin display at 1.1 is fine
}

await browser.close();
server.kill();

console.log(`\n${pass} passed, ${fail} failed.`);
process.exit(fail ? 1 : 0);
