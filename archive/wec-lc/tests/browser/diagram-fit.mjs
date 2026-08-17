// Run with: node tests/browser/diagram-fit.mjs
//
// EVERY LABEL, MEASURED, IN THE PAGE THAT ACTUALLY SHIPS IT.
//
// The living diagrams (docs/digital-institution-masterplan.md, Layer 3)
// are generated SVG. Their figures are placed by arithmetic, which means
// a label that lands on top of another label, or a hand's width off the
// edge of the canvas, is not a crash and not a test failure. It is a
// drawing that is quietly wrong, and the only thing that had ever caught
// one was somebody looking at it.
//
// Four had already been caught that way: a compensation label sitting on
// the award ladder's axis ticks, a caption laid over the interim box in
// the authority chain, the publication funnel's stage labels running off
// both sides at once, and the withdrawal branch measured from the centre
// instead of the margin.
//
// The fifth is the reason this file exists, because looking at it would
// not have been enough. `text-anchor` resolves against the inline base
// direction, so `end` means the right edge of a label in a left-to-right
// context and the left edge in a right-to-left one. The Arabic authority
// chain was drawn correctly, opened as a file, and checked. Then it was
// placed inside /ar/about/governance/, inherited `dir="rtl"` from the
// page, and threw its entire vacancy register off the right of the
// canvas — a defect that existed only in the combination, and was
// invisible in either half on its own.
//
// So this audit measures the rendered geometry in the page. Two things,
// both of which a human eye is bad at and a browser is exact about:
//
//   1. Nothing is drawn outside the viewBox. Anything past the edge is
//      clipped for every reader, in a drawing whose whole job is to be
//      read in one look.
//   2. No two labels overlap. Not "look close" — overlap, by more than a
//      couple of pixels of kerning slack.
//
// It runs against the built site, in both languages, at the width the
// diagram is actually given.

import { chromium } from 'playwright';
import { spawn } from 'node:child_process';
import { readFileSync, readdirSync, existsSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const HERE = dirname(fileURLToPath(import.meta.url));
const ROOT = dirname(dirname(HERE));
const PORT = process.env.LAB_PORT || 8812;
const BASE = `http://localhost:${PORT}`;

let pass = 0, fail = 0;
const check = (label, cond, detail) => {
  console.log((cond ? 'PASS ' : 'FAIL ') + label + (cond || detail === undefined ? '' : `\n     ${detail}`));
  cond ? pass++ : fail++;
};

// The routes to visit are derived from the source pages that include a
// plate, rather than listed here — a diagram placed on a new page is
// audited the day it is placed, without anybody remembering to add it.
const PAGES = join(ROOT, 'pages');
const manifest = JSON.parse(readFileSync(join(PAGES, 'manifest.json'), 'utf8'));
const entries = Array.isArray(manifest) ? manifest : manifest.pages;

const routes = [];
for (const file of readdirSync(PAGES).filter((f) => f.endsWith('.html'))) {
  if (!/\{\{SVG:assets\/art\//.test(readFileSync(join(PAGES, file), 'utf8'))) continue;
  const entry = entries.find((e) => e.contentFile === file);
  if (!entry) { console.log(`NOTE ${file} carries a plate but is not in the manifest — not audited.`); continue; }
  routes.push('/' + entry.output.replace(/index\.html$/, ''));
}
routes.sort();

check(`Every page carrying a diagram is reachable — ${routes.length} routes`, routes.length >= 5,
  routes.join(' · '));

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

// Measured in a real browser at the desktop width, where the diagram is
// given its full 880px and has the least excuse for spilling.
const ctx = await browser.newContext({ viewport: { width: 1440, height: 1000 } });

const spills = [];
const collisions = [];
const seen = [];

for (const route of routes) {
  const page = await ctx.newPage();
  await page.goto(BASE + route, { waitUntil: 'domcontentloaded' }).catch(() => {});

  const found = await page.evaluate(async () => {
    const figures = [...document.querySelectorAll('figure.diagram svg[data-diagram]')];
    const out = [];
    for (const svg of figures) {
      // The plates animate in on intersection. Measuring a diagram that
      // has not arrived measures nothing, so bring it into view and let
      // it finish before reading a single coordinate.
      svg.scrollIntoView({ block: 'center' });
      await new Promise((r) => setTimeout(r, 1400));

      const vb = svg.viewBox.baseVal;
      const rec = {
        id: svg.getAttribute('data-diagram'),
        lang: svg.getAttribute('lang'),
        direction: getComputedStyle(svg).direction,
        w: vb.width, h: vb.height,
        spill: [], boxes: [],
      };

      for (const el of svg.querySelectorAll('text, rect, circle, path')) {
        let bb;
        try { bb = el.getBBox(); } catch { continue; }
        if (!bb.width && !bb.height) continue;
        // A stroke straddles its path, and a round cap adds a little
        // more. One unit of slack rather than nought, so a hairline
        // sitting exactly on the frame is not reported as an escape.
        if (bb.x < -1 || bb.y < -1 || bb.x + bb.width > vb.width + 1 || bb.y + bb.height > vb.height + 1) {
          rec.spill.push({
            tag: el.tagName, text: (el.textContent || '').replace(/[⁦-⁩]/g, '').slice(0, 30),
            x: Math.round(bb.x), y: Math.round(bb.y),
            r: Math.round(bb.x + bb.width), b: Math.round(bb.y + bb.height),
          });
        }
        if (el.tagName === 'text') {
          rec.boxes.push({
            text: (el.textContent || '').replace(/[⁦-⁩]/g, '').slice(0, 30),
            x: bb.x, y: bb.y, w: bb.width, h: bb.height,
          });
        }
      }
      out.push(rec);
    }
    return out;
  });

  for (const d of found) {
    seen.push(`${d.id}${d.lang === 'ar' ? '.ar' : ''}`);

    if (d.direction !== 'ltr') {
      spills.push(`${route} ${d.id}: root direction is "${d.direction}" — anchors will flip against the file`);
    }
    for (const s of d.spill) {
      spills.push(`${route} ${d.id}: <${s.tag}> "${s.text}" at ${s.x},${s.y}–${s.r},${s.b} escapes ${d.w}×${d.h}`);
    }

    // Overlap between two labels. Three units of tolerance: descenders
    // and diacritics extend a glyph box past its visual mass, and Arabic
    // has more of both than the geometry ever intended to model.
    const SLACK = 3;
    for (let i = 0; i < d.boxes.length; i++) {
      for (let j = i + 1; j < d.boxes.length; j++) {
        const a = d.boxes[i], b = d.boxes[j];
        const ox = Math.min(a.x + a.w, b.x + b.w) - Math.max(a.x, b.x);
        const oy = Math.min(a.y + a.h, b.y + b.h) - Math.max(a.y, b.y);
        if (ox > SLACK && oy > SLACK) {
          collisions.push(`${route} ${d.id}: "${a.text}" over "${b.text}" `
            + `(${Math.round(ox)}×${Math.round(oy)} units)`);
        }
      }
    }
  }

  await page.close();
}

check(`Every diagram was found and measured — ${seen.length} placements`, seen.length >= 5, seen.join(' · '));

check('No drawn element escapes its own canvas',
  spills.length === 0, spills.slice(0, 10).join('\n     '));

check('No two labels in a diagram overlap',
  collisions.length === 0, collisions.slice(0, 10).join('\n     '));

// Both languages get measured, or the audit is only checking the half
// that was easy to look at.
{
  const langs = new Set(seen.map((s) => (s.endsWith('.ar') ? 'ar' : 'en')));
  check('Both languages were audited', langs.has('en') && langs.has('ar'), [...langs].join(', '));
}

await browser.close();
server.kill();

console.log(`\n${pass} passed, ${fail} failed.`);
process.exit(fail ? 1 : 0);
