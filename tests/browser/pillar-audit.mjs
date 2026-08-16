// Run with: node tests/browser/pillar-audit.mjs [route ...]
//
// REASONING ABOUT CSS IS NOT VERIFICATION — CLAUDE.md §6.
//
// Every fault this file exists to catch was invisible in the source and
// obvious on screen: domes rendering silver instead of emerald; a nib
// drawn as a map pin; a masthead 190px off its own axis; a lit ninth
// cell in an eight-item grid; 39px of dead space in every card; and
// seven navigation links rendering as literal HTML source.
//
// So this opens the real pages in the real browser, in the real faces,
// at the three widths the house checks at, in both directions, and
// reports what is measurably wrong. It writes a screenshot per route per
// viewport so the render can also be LOOKED at, which is the half no
// assertion covers.
//
// WHAT IT MEASURES
//
//   1. HORIZONTAL OVERFLOW. scrollWidth beyond clientWidth on the
//      document, plus the identity of every element wider than the
//      viewport, so the bleeding ornament can be named rather than
//      hunted. A 58px overflow from .leaf__ornament cost an afternoon.
//
//   2. CONSOLE ERRORS AND FAILED REQUESTS. A missing art plate is a
//      silent 404 that leaves a leaf with no ornament and no complaint.
//
//   3. DEAD SPACE IN CARDS. The reported "blank pages" on Academics
//      were 39px of stretch at the foot of every card in a grid. This
//      measures the gap between a card's last painted child and its own
//      content box.
//
//   4. THE MATERIAL LAW, CLAUDE.md §2. Counts the struck shapes on the
//      page against the major shapes on it. A page of cards with no
//      .aurum and no .edge-lit is the exact defect the material law was
//      written to stop, and it does not announce itself in a diff.
//
//   5. LIT CELLS IN A GRID. A trailing cell with no content, which is
//      what an auto-fit column count that does not divide the item
//      count produces.
//
// WHAT IT DOES NOT DO is pass or fail a build. It is an instrument, not
// a gate — the gates are in tests/*.test.mjs. Read its output.

import { chromium } from 'playwright';
import { spawn } from 'node:child_process';
import { existsSync, mkdirSync, rmSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { serveRealFonts, fontsSettled } from './lib/real-fonts.mjs';

const HERE = dirname(fileURLToPath(import.meta.url));
const ROOT = dirname(dirname(HERE));
const PORT = process.env.LAB_PORT || 8871;
const BASE = `http://localhost:${PORT}`;
const SHOTS = process.env.SHOT_DIR || join(ROOT, '.render-audit');

// 1440 desktop, 900 the tablet fold where the leaf margins unstick,
// 390 the phone. Anything that survives all three survives.
const VIEWPORTS = [
  { name: '1440', width: 1440, height: 1000 },
  { name: '900', width: 900, height: 1000 },
  { name: '390', width: 390, height: 844 },
];

const routes = process.argv.slice(2);
if (!routes.length) {
  console.error('usage: node tests/browser/pillar-audit.mjs /academics/ /ar/academics/ ...');
  process.exit(2);
}

rmSync(SHOTS, { recursive: true, force: true });
mkdirSync(SHOTS, { recursive: true });

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

let faults = 0;
const fault = (route, vp, msg) => { faults++; console.log(`  ✗ [${vp}] ${msg}`); };

for (const route of routes) {
  console.log(`\n═══ ${route}`);
  for (const vp of VIEWPORTS) {
    const ctx = await browser.newContext({ viewport: { width: vp.width, height: vp.height } });
    await serveRealFonts(ctx);
    const page = await ctx.newPage();

    const errors = [];
    const failedReqs = [];
    page.on('pageerror', (e) => errors.push(String(e)));
    page.on('console', (m) => { if (m.type() === 'error') errors.push(m.text()); });
    page.on('requestfailed', (r) => failedReqs.push(r.url()));
    page.on('response', (r) => { if (r.status() >= 400) failedReqs.push(`${r.status()} ${r.url()}`); });

    await page.goto(BASE + route, { waitUntil: 'networkidle' });
    await fontsSettled(page);
    // Let .reveal resolve and the single-rAF loop settle before measuring.
    await page.waitForTimeout(900);

    const report = await page.evaluate(() => {
      const doc = document.documentElement;
      const vw = doc.clientWidth;

      const wide = [];
      for (const el of document.querySelectorAll('body *')) {
        const r = el.getBoundingClientRect();
        if (r.width === 0 || r.height === 0) continue;
        // Right edge past the viewport, or left edge before it.
        if (r.right > vw + 1 || r.left < -1) {
          const cs = getComputedStyle(el);
          if (cs.position === 'fixed') continue;
          wide.push({
            sel: el.tagName.toLowerCase() + (el.className && typeof el.className === 'string'
              ? '.' + el.className.trim().split(/\s+/).slice(0, 3).join('.') : ''),
            left: Math.round(r.left), right: Math.round(r.right),
          });
        }
      }

      // Dead space: slack at the FOOT of a shape that is not matched at
      // its head. .card::after is the struck baseline rule and is
      // deliberately pushed to the foot, so it counts as painted
      // content.
      //
      // THE HEAD GAP IS SUBTRACTED, and that is the whole subtlety. A
      // shape whose content is CENTRED has the same slack above and
      // below; that is a deliberate composition and flagging it teaches
      // you to ignore this instrument. The defect being hunted is
      // content pinned to the TOP with the slack all at the bottom —
      // the 39px that read as a blank page. Only the asymmetry counts.
      const dead = [];
      for (const card of document.querySelectorAll('.card, .ascent__step, .discipline, .register__col')) {
        const kids = [...card.children].filter((k) => k.getBoundingClientRect().height > 0);
        if (!kids.length) continue;
        const cr = card.getBoundingClientRect();
        const cs = getComputedStyle(card);
        const innerBottom = cr.bottom - parseFloat(cs.paddingBottom) - parseFloat(cs.borderBottomWidth);
        const innerTop = cr.top + parseFloat(cs.paddingTop) + parseFloat(cs.borderTopWidth);
        const last = Math.max(...kids.map((k) => k.getBoundingClientRect().bottom));
        const first = Math.min(...kids.map((k) => k.getBoundingClientRect().top));
        const gap = Math.round((innerBottom - last) - (first - innerTop));
        if (gap > 12) dead.push({ sel: card.className.split(/\s+/)[0], gap });
      }

      // Empty trailing grid cells — the lit ninth cell in an eight-item
      // grid, which reads as a rendering fault and is a column count
      // that does not divide the item count.
      const emptyCells = [];
      for (const grid of document.querySelectorAll('.grid, .disciplines, .quad, .creed, .honours, .ascent')) {
        for (const cell of grid.children) {
          if (!cell.textContent.trim() && !cell.querySelector('img, svg, canvas')) {
            emptyCells.push(grid.className.split(/\s+/)[0]);
          }
        }
      }

      // THE MATERIAL LAW, counted.
      const major = document.querySelectorAll(
        '.card, .ascent__step, .discipline, .register__col, .quad__skill, .honour, '
        + '.matricula, .clause, .tenet, .creed__item, .sep__role, .vacancy, .passage__stage, '
        + '.article, .attest, .folio, .horarium').length;
      const struck = document.querySelectorAll('.aurum').length;
      const rimmed = document.querySelectorAll('.edge-lit').length;
      const domes = document.querySelectorAll('.badge-dome').length;
      const domesLg = document.querySelectorAll('.badge-dome--lg').length;
      const live = document.querySelectorAll('.gold-live').length;

      return {
        overflow: Math.round(doc.scrollWidth - vw),
        wide: wide.slice(0, 8),
        dead, emptyCells, major, struck, rimmed, domes, domesLg, live,
        title: document.title,
        // Literal markup rendering as text — the &lt;a href=…&gt; class
        // of defect, found on students.html after it had shipped.
        rawMarkup: /&lt;\s*a\s|&lt;\s*h[1-6]|&amp;[lr]squo;|&amp;[lr]dquo;|&amp;mdash;/
          .test(document.body.innerText) ? 'literal entity or tag in rendered text' : null,
      };
    });

    // ── SCROLL BEFORE THE SHUTTER ───────────────────────────────────
    //
    // Every .reveal element starts at opacity 0 and is raised by an
    // IntersectionObserver (js/site.js, js/motion.js). A fullPage
    // screenshot does not scroll the page, so before this loop existed
    // no observer below the first viewport ever fired and every leaf
    // body, card and register in the capture was blank cream.
    //
    // That is precisely the half CLAUDE.md §6 says no assertion
    // covers — and it was covering nothing. The measurements above were
    // unaffected (an opacity-0 element still has its full layout box),
    // which is why this went unnoticed: the numbers were right and the
    // pictures were empty.
    //
    // So walk the page a viewport at a time, let each step's observers
    // fire, then return to the top and capture. A page is at most a few
    // dozen steps, and the cost buys a screenshot that shows the page a
    // reader would actually see.
    // `behavior: 'instant'` is not decoration. css/brand.css sets
    // `html { scroll-behavior: smooth }`, so a plain scrollTo ANIMATES:
    // stepping every 60ms, the page never arrived anywhere before the
    // next call retargeted it, and the first version of this loop moved
    // the document about one viewport in total. Every observer below
    // that stayed unfired and the capture was as blank as before —
    // a fix that reported success and changed nothing.
    // HALF a viewport per step, not a whole one. IntersectionObserver
    // callbacks are asynchronous and coalesced: jumping a full viewport
    // every 60ms let short elements enter and leave between delivered
    // notifications, and four .stat-row__item on /press/ were reported
    // as never rising when they rise perfectly well for a reader. The
    // overlap guarantees every element is inside the viewport across at
    // least two steps.
    await page.evaluate(async () => {
      const step = Math.round(window.innerHeight / 2);
      for (let y = 0; y < document.body.scrollHeight; y += step) {
        window.scrollTo({ top: y, behavior: 'instant' });
        await new Promise((r) => setTimeout(r, 60));
      }
      window.scrollTo({ top: 0, behavior: 'instant' });
      await new Promise((r) => setTimeout(r, 200));
    });
    // The reveal transition itself still has to play out.
    await page.waitForTimeout(700);

    // And say so if it did not work, rather than filing another blank
    // picture: a still-hidden .reveal after a full pass is either a
    // broken observer or a script that threw.
    const stillHidden = await page.evaluate(() =>
      [...document.querySelectorAll('.reveal')]
        .filter((e) => getComputedStyle(e).opacity === '0').length);
    if (stillHidden) {
      fault(route, vp.name, `${stillHidden} .reveal element(s) never rose — screenshot is not the page`);
    }

    const shot = join(SHOTS, `${route.replace(/\//g, '_') || 'root'}-${vp.name}.png`);
    await page.screenshot({ path: shot, fullPage: true });

    if (report.overflow > 0) {
      fault(route, vp.name, `horizontal overflow ${report.overflow}px`);
      for (const w of report.wide) console.log(`      ${w.sel}  [${w.left} → ${w.right}]`);
    }
    for (const d of report.dead) fault(route, vp.name, `${d.gap}px dead space in .${d.sel}`);
    if (report.emptyCells.length) fault(route, vp.name, `empty grid cell(s) in .${[...new Set(report.emptyCells)].join(', .')}`);
    if (report.rawMarkup) fault(route, vp.name, report.rawMarkup);
    for (const e of [...new Set(errors)]) fault(route, vp.name, `console: ${e.slice(0, 140)}`);
    for (const r of [...new Set(failedReqs)]) fault(route, vp.name, `request: ${r.slice(0, 140)}`);

    if (vp.name === '1440') {
      const bare = report.major > 0 && report.struck === 0;
      console.log(`  material: ${report.major} major shapes · ${report.struck} aurum · `
        + `${report.rimmed} edge-lit · ${report.domes} domes (${report.domesLg} lg) · ${report.live} gold-live`
        + (bare ? '   ✗ BARE — see CLAUDE.md §2' : ''));
      if (bare) faults++;
    }

    await ctx.close();
  }
}

await browser.close();
server.kill();
console.log(`\n${faults} fault(s). Screenshots in ${SHOTS}`);
process.exit(faults ? 1 : 0);
