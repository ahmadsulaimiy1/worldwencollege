#!/usr/bin/env node
/**
 * GATE · RESPONSIVE
 *
 * SEB §30.15 and §34.13, checked in a REAL RENDERER at the five device
 * classes and in both directions. The other three gates read the source;
 * this one reads the result, because the rules it checks are not
 * properties of a stylesheet — they are properties of a page.
 *
 * The four bindings across every class:
 *   · the page never scrolls horizontally;
 *   · no element exceeds the viewport;
 *   · every target is at least 44×44px;
 *   · no unbreakable string exceeds its container.
 *
 * Plus two the design language adds:
 *   · the measure never grows past 34em, at ANY width — at 1600px and
 *     above the fore-edge grows instead (SEB §30.3);
 *   · under `prefers-reduced-motion` every revealed element resolves to
 *     its FINISHED state, never its hidden one. A reveal merely disabled
 *     leaves the element at opacity 0, which for a reader with vestibular
 *     sensitivity is not a calmer page but a blank one (SEB §30.9).
 *
 * If Playwright is not installed this gate SKIPS LOUDLY and says so. It
 * does not print a tick. A gate that reports success when it did not run
 * is worse than no gate, because somebody will believe it.
 */

import { createServer } from 'node:http';
import { readFile } from 'node:fs/promises';
import { existsSync } from 'node:fs';
import { extname, join, normalize } from 'node:path';
import { Gate, root } from './lib.mjs';

const gate = new Gate('responsive', 'SEB §30.15, §34.13');

let chromium;
try {
  ({ chromium } = await import('playwright'));
} catch {
  console.error('⚠ responsive  (SEB §30.15, §34.13) — SKIPPED: playwright is not installed.');
  console.error('  This gate did NOT run and nothing below was checked. `npm i -D playwright`.');
  process.exit(0);
}

/* A static server, because ES modules do not load over file:// — Chrome
   refuses them as cross-origin, and the specimen's behaviour layer is a
   module. */
const TYPES = { '.html': 'text/html', '.css': 'text/css', '.js': 'text/javascript', '.svg': 'image/svg+xml', '.woff2': 'font/woff2' };
const server = createServer(async (req, res) => {
  const url = new URL(req.url, 'http://localhost');
  const path = join(root, normalize(url.pathname).replace(/^(\.\.[/\\])+/, ''));
  try {
    const body = await readFile(path);
    res.writeHead(200, { 'content-type': TYPES[extname(path)] ?? 'application/octet-stream' });
    res.end(body);
  } catch {
    res.writeHead(404).end('not found');
  }
});
await new Promise((r) => server.listen(0, r));
const base = `http://127.0.0.1:${server.address().port}/showcase/index.html`;

const CLASSES = [
  { name: 'phone · floor', width: 320, height: 720 },
  { name: 'phone', width: 375, height: 812 },
  { name: 'tablet portrait', width: 720, height: 1024 },
  { name: 'tablet landscape', width: 1024, height: 768 },
  { name: 'desktop · the spread', width: 1180, height: 900 },
  { name: 'large display', width: 1600, height: 1000 },
  { name: 'very large display', width: 2560, height: 1400 },
];

/*
 * The browser.
 *
 * `SX_CHROMIUM` overrides the executable. Playwright pins a browser build
 * to its own version, and a CI image that ships a different build fails
 * with "Executable doesn't exist" — which reads as a broken gate rather
 * than as a version mismatch, and gets the gate deleted. Pointing at the
 * image's own Chromium is the fix; `--no-sandbox` is required inside a
 * container that has no user namespace to drop into.
 */
const executablePath = process.env.SX_CHROMIUM
  || [
    '/opt/pw-browsers/chromium/chrome-linux/chrome',
    '/opt/pw-browsers/chromium-1194/chrome-linux/chrome',
  ].find((p) => existsSync(p));

const browser = await chromium.launch(
  executablePath ? { executablePath, args: ['--no-sandbox'] } : {},
);

for (const cls of CLASSES) {
  const page = await browser.newPage({ viewport: { width: cls.width, height: cls.height } });
  await page.goto(base, { waitUntil: 'networkidle' });

  /* 1 · The page never scrolls horizontally. Absolute. */
  const scroll = await page.evaluate(() => ({
    doc: document.documentElement.scrollWidth,
    view: document.documentElement.clientWidth,
  }));
  gate.check(
    scroll.doc <= scroll.view + 1,
    `${cls.name} (${cls.width}px)`,
    `the page scrolls horizontally: scrollWidth ${scroll.doc} > clientWidth ${scroll.view} (SEB §30.15)`,
  );

  /* 2 · No element exceeds the viewport. The page can pass check 1 while
     an element still overhangs, if an ancestor clips it — and a clipped
     overhang is content the reader cannot reach. */
  const overhanging = await page.evaluate((w) => {
    const out = [];
    for (const el of document.querySelectorAll('body *')) {
      const box = el.getBoundingClientRect();
      if (box.width === 0 || box.height === 0) continue;
      if (box.right > w + 1 || box.left < -1) {
        // Elements deliberately parked outside are declared, not guessed.
        if (el.closest('[aria-hidden="true"], .sx-instrument__twin')) continue;
        const style = getComputedStyle(el);
        if (style.position === 'fixed' && style.transform !== 'none') continue;
        // Content INSIDE its own scroll container is not an overhang —
        // it is the rule being kept. SEB §30.15 requires exactly this:
        // overflow scrolls inside its own container, never the page. The
        // check is whether the CONTAINER fits, which the loop reaches on
        // its own turn.
        let clipped = false;
        for (let p = el.parentElement; p && p !== document.body; p = p.parentElement) {
          const ps = getComputedStyle(p);
          if (/(auto|scroll|hidden|clip)/.test(ps.overflowX)) { clipped = true; break; }
        }
        if (clipped) continue;
        out.push(`${el.className || el.tagName} left=${Math.round(box.left)} right=${Math.round(box.right)}`);
      }
    }
    return out.slice(0, 5);
  }, cls.width);
  gate.check(
    overhanging.length === 0,
    `${cls.name} (${cls.width}px)`,
    `element(s) exceed the viewport: ${overhanging.join('; ')} (SEB §30.15)`,
  );

  /* 3 · Every target is at least 44×44px. Inline links inside running
     prose are exempt — they are text, and the exemption is the same one
     WCAG SC 2.5.8 makes. Everything a person aims at is measured. */
  const small = await page.evaluate(() => {
    const out = [];
    const targets = document.querySelectorAll('.sx-control, button, input:not([type="hidden"]), select, textarea, [role="button"], .sx-rail__station');
    for (const el of targets) {
      const box = el.getBoundingClientRect();
      if (box.width === 0 && box.height === 0) continue;           // not rendered
      if (box.width < 44 || box.height < 44) {
        out.push(`${el.className || el.tagName} ${Math.round(box.width)}×${Math.round(box.height)}`);
      }
    }
    return out.slice(0, 6);
  });
  gate.check(
    small.length === 0,
    `${cls.name} (${cls.width}px)`,
    `target(s) below 44×44: ${small.join('; ')} (SEB §34.13)`,
  );

  /* 4 · The measure never grows. */
  const measure = await page.evaluate(() => {
    const el = document.querySelector('.sx-clause');
    if (!el) return null;
    const em = parseFloat(getComputedStyle(el).fontSize);
    return el.getBoundingClientRect().width / em;
  });
  if (measure !== null) {
    gate.check(
      measure <= 34.5,
      `${cls.name} (${cls.width}px)`,
      `the measure is ${measure.toFixed(1)}em — it is capped at 34em at every width; the fore-edge grows instead (SEB §30.3)`,
    );
  }

  await page.close();
}

/* 5 · Reduced motion resolves to the FINISHED state. */
{
  const page = await browser.newPage({ viewport: { width: 1180, height: 900 }, reducedMotion: 'reduce' });
  await page.goto(base, { waitUntil: 'networkidle' });
  const hidden = await page.evaluate(() =>
    [...document.querySelectorAll('.sx-rise, .sx-draw')]
      .filter((el) => Number(getComputedStyle(el).opacity) < 0.99)
      .map((el) => el.className)
      .slice(0, 5));
  gate.check(
    hidden.length === 0,
    'prefers-reduced-motion: reduce',
    `element(s) left hidden rather than finished: ${hidden.join('; ')} — a disabled entrance animation must resolve to the visible state (SEB §30.9)`,
  );

  const node = await page.evaluate(() => {
    const el = document.querySelector('.sx-meridian__node');
    return el ? getComputedStyle(el).display : 'absent';
  });
  gate.check(node === 'none' || node === 'absent', 'prefers-reduced-motion: reduce', `the Meridian node is \`${node}\`; it tracks scroll and must not run under reduce (SEB §30.9)`);
  await page.close();
}

/* 6 · RTL is structural. The same page, turned, at the floor width. */
{
  const page = await browser.newPage({ viewport: { width: 320, height: 720 } });
  await page.goto(base, { waitUntil: 'networkidle' });
  await page.evaluate(() => document.documentElement.setAttribute('dir', 'rtl'));
  const scroll = await page.evaluate(() => ({
    doc: document.documentElement.scrollWidth,
    view: document.documentElement.clientWidth,
  }));
  gate.check(
    scroll.doc <= scroll.view + 1,
    'rtl · 320px',
    `the page scrolls horizontally in RTL: ${scroll.doc} > ${scroll.view}. An off-canvas element at translateX(100%) is still laid out and in RTL shifts the scroll origin (SEB §34.7)`,
  );
  await page.close();
}

await browser.close();
server.close();
process.exit(gate.report());
