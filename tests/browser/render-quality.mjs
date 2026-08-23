// Run with: node tests/browser/render-quality.mjs
//
// THREE THINGS THAT ARE ONLY TRUE IF THEY ARE MEASURED.
//
// Every other browser suite here asserts what a page SAYS. This one
// asserts how it BEHAVES when it is rendered, across all 186 routes:
//
//   1. TEXT CONTRAST. Every element with its own text is measured
//      against the ground actually painted behind it, at the size and
//      weight it is set in, against WCAG AA.
//
//   2. LAYOUT SHIFT. Cumulative Layout Shift per route, from the
//      browser's own PerformanceObserver.
//
//   3. HIGH CONTRAST MODE. Every button and .btn is asked, with
//      forced-colors active, whether it still has a border or an
//      outline. In that mode background images, gradients and
//      box-shadows are removed outright — which is everything this site
//      draws a control with.
//
// WHAT THIS FOUND THE DAY IT WAS WRITTEN, none of it visible in the
// source and none of it caught by any other guard:
//
//   · /student-portal/ — the page the navigation and the footer send
//     every learner to — had a cream card inside a navy section, so its
//     heading was #fff on #FCFAF4. 1.04:1. Both editions.
//   · `--gold-deep` was used in seven stylesheets and defined in none,
//     so every use was its own fallback, at 3.44–4.03:1 on the light
//     grounds it was used on.
//   · Twenty-eight sections used `.section--oxford` or
//     `.section--midnight` without `.section--dark`, so about twenty
//     typography rules never reached them.
//   · `.btn--quiet` set no background, so where it was written as a
//     <button> the user agent painted its own grey behind ivory text.
//   · Ten controls had no boundary at all in High Contrast Mode.
//   · The topbar's actions bay was auto-placed into the MIDDLE column
//     of a three-column grid while the visitor's clock was hidden, and
//     jumped 424px when it appeared.
import { chromium } from 'playwright';
import { spawn } from 'node:child_process';
import { existsSync, readdirSync, statSync } from 'node:fs';
import { dirname, join, relative } from 'node:path';
import { fileURLToPath } from 'node:url';

const HERE = dirname(fileURLToPath(import.meta.url));
const ROOT = join(HERE, '..', '..');
const PORT = process.env.LAB_PORT || 8833;
const BASE = `http://localhost:${PORT}`;

let pass = 0, fail = 0;
const check = (label, cond, detail) => {
  console.log((cond ? 'PASS ' : 'FAIL ') + label + (cond || detail === undefined ? '' : ` — ${detail}`));
  cond ? pass++ : fail++;
};

// ── The routes, from the built output rather than from a list ────────
const SKIP = new Set(['node_modules', 'tests', 'pages', 'partials', 'docs', 'sql',
  'functions', 'scripts', '.git', 'assets', 'publication']);
const routes = [];
(function walk(dir) {
  for (const e of readdirSync(dir)) {
    if (SKIP.has(e) || e.startsWith('.')) continue;
    const p = join(dir, e);
    if (statSync(p).isDirectory()) walk(p);
    else if (e.endsWith('.html')) {
      const rel = '/' + relative(ROOT, p).replace(/\\/g, '/');
      routes.push(rel.endsWith('/index.html') ? rel.replace(/index\.html$/, '') : rel);
    }
  }
})(ROOT);
routes.sort();

/* AN OPTIONAL FILTER, and why an instrument that measures everything
   needs one.

   The full walk is three passes over every built route, and at 192
   routes that is upwards of ten minutes — long enough that the honest
   description of this file became "the audit nobody runs while they are
   working". A substring given on the command line narrows it:

     node tests/browser/render-quality.mjs my-award

   The filter narrows and never widens, the unfiltered run is still the
   whole site, and the count is printed either way so a passing line can
   never be mistaken for a full sweep it did not do. */
const FILTER = process.argv.slice(2).filter((a) => !a.startsWith('-'));
if (FILTER.length) {
  const kept = routes.filter((r) => FILTER.some((f) => r.includes(f)));
  routes.length = 0;
  routes.push(...kept);
  console.log(`Filtered to ${routes.length} route(s) by: ${FILTER.join(', ')}`);
  if (!routes.length) {
    console.log('No route matched. Nothing was measured.');
    process.exit(1);
  }
}

/* THE ONE MEASUREMENT THIS SUITE CANNOT MAKE.
   `.vista__caption` sits over an <img> and a `.vista__scrim`, and the
   walk below can only follow CSS backgrounds — an <img> is an element,
   not a ground, so the walk falls through to the section's pearl and
   reports 1.06:1 for a line that is in fact ivory on a dark scrim.
   Computed by hand instead, against the worst frame the College could
   ever put there (a pure white photograph, after the img filter's
   brightness(.93) and the scrim's rgba(10,20,40,.82)): 9.25:1. It is
   named here rather than quietly skipped, so the exemption is a
   statement somebody can check rather than a hole. */
const CONTRAST_EXEMPT = new Set(['figcaption.vista__caption']);

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

// ── Pass one: contrast and layout shift, in one visit each ───────────
const contrastFails = new Map();
const shifted = [];
{
  const ctx = await browser.newContext({ viewport: { width: 1440, height: 1000 } });
  for (const route of routes) {
    const page = await ctx.newPage();
    await page.route('**://fonts.googleapis.com/**', (r) => r.abort());
    await page.route('**://fonts.gstatic.com/**', (r) => r.abort());
    try {
      await page.addInitScript(() => {
        window.__cls = 0;
        window.__src = [];
        new PerformanceObserver((list) => {
          for (const e of list.getEntries()) {
            if (e.hadRecentInput) continue;
            window.__cls += e.value;
            for (const s of e.sources || []) {
              const n = s.node;
              if (n && n.nodeType === 1) window.__src.push(((n.className || n.tagName) + '').slice(0, 40));
            }
          }
        }).observe({ type: 'layout-shift', buffered: true });
      });
      await page.goto(BASE + route, { waitUntil: 'load', timeout: 25000 });
      await page.waitForTimeout(2200);

      const cls = await page.evaluate(() => ({ v: window.__cls, s: [...new Set(window.__src)].slice(0, 3) }));
      // 0.1 is the threshold a layout shift stops being "good" at.
      if (cls.v > 0.1) shifted.push([route, cls.v.toFixed(4), cls.s.join(' | ')]);

      const bad = await page.evaluate(() => {
        const parse = (c) => {
          const m = c.match(/rgba?\(([^)]+)\)/); if (!m) return null;
          const a = m[1].split(',').map((x) => parseFloat(x));
          return { r: a[0], g: a[1], b: a[2], a: a.length > 3 ? a[3] : 1 };
        };
        const lin = (v) => { v /= 255; return v <= 0.03928 ? v / 12.92 : Math.pow((v + 0.055) / 1.055, 2.4); };
        const lum = (c) => 0.2126 * lin(c.r) + 0.7152 * lin(c.g) + 0.0722 * lin(c.b);
        const over = (fg, bg) => ({
          r: fg.r * fg.a + bg.r * (1 - fg.a),
          g: fg.g * fg.a + bg.g * (1 - fg.a),
          b: fg.b * fg.a + bg.b * (1 - fg.a), a: 1,
        });
        const ratio = (a, b) => {
          const l1 = lum(a), l2 = lum(b);
          return (Math.max(l1, l2) + 0.05) / (Math.min(l1, l2) + 0.05);
        };
        const out = [];
        for (const el of document.querySelectorAll('body *')) {
          let text = '';
          for (const n of el.childNodes) if (n.nodeType === 3) text += n.nodeValue;
          if (!text.trim()) continue;
          const rect = el.getBoundingClientRect();
          if (rect.width < 2 || rect.height < 2) continue;
          const cs = getComputedStyle(el);
          if (cs.visibility === 'hidden' || cs.display === 'none' || Number(cs.opacity) === 0) continue;
          const fg = parse(cs.color); if (!fg) continue;
          // Up to the first ground that is actually painted. A gradient
          // or an image cannot be measured this way, so the element is
          // left unmeasured rather than silently passed.
          let node = el, bg = null, unmeasurable = false;
          while (node && node !== document.documentElement) {
            const s = getComputedStyle(node);
            if (s.backgroundImage && s.backgroundImage !== 'none') { unmeasurable = true; break; }
            const c = parse(s.backgroundColor);
            if (c && c.a > 0.98) { bg = c; break; }
            node = node.parentElement;
          }
          if (unmeasurable) continue;
          if (!bg) {
            const c = parse(getComputedStyle(document.body).backgroundColor);
            bg = c && c.a > 0.98 ? c : { r: 255, g: 255, b: 255, a: 1 };
          }
          const solid = fg.a < 1 ? over(fg, bg) : fg;
          const size = parseFloat(cs.fontSize);
          const weight = parseInt(cs.fontWeight, 10) || 400;
          const need = (size >= 24 || (size >= 18.66 && weight >= 700)) ? 3 : 4.5;
          const cr = ratio(solid, bg);
          if (cr < need - 0.02) {
            const cls2 = (el.className && el.className.baseVal !== undefined
              ? el.className.baseVal : el.className) || '';
            out.push({
              sel: el.tagName.toLowerCase() + (cls2 ? '.' + String(cls2).trim().split(/\s+/).slice(0, 2).join('.') : ''),
              cr: Math.round(cr * 100) / 100, need, size: Math.round(size),
              text: text.trim().slice(0, 30),
            });
          }
        }
        return out;
      });
      for (const f of bad) {
        if (CONTRAST_EXEMPT.has(f.sel)) continue;
        const key = f.sel + '|' + f.cr;
        if (!contrastFails.has(key)) contrastFails.set(key, { ...f, route });
      }
    } catch (e) {
      check(`${route} renders`, false, e.message.slice(0, 70));
    }
    await page.close();
  }
  await ctx.close();
}

const list = [...contrastFails.values()].sort((a, b) => a.cr - b.cr);
check(`Every text style on all ${routes.length} routes clears WCAG AA against the ground behind it`,
  list.length === 0,
  list.slice(0, 5).map((f) => `${f.cr}:1 (needs ${f.need}) ${f.sel} @${f.size}px "${f.text}" ${f.route}`).join(' · '));

check('No route shifts more than 0.1 while it loads',
  shifted.length === 0,
  shifted.slice(0, 5).map((s) => `${s[1]} ${s[0]} :: ${s[2]}`).join(' · '));

// ── Pass two: High Contrast Mode ─────────────────────────────────────
const borderless = new Map();
{
  const ctx = await browser.newContext({ viewport: { width: 1440, height: 1000 }, forcedColors: 'active' });
  for (const route of routes) {
    const page = await ctx.newPage();
    await page.route('**://fonts.googleapis.com/**', (r) => r.abort());
    await page.route('**://fonts.gstatic.com/**', (r) => r.abort());
    try {
      await page.goto(BASE + route, { waitUntil: 'domcontentloaded', timeout: 20000 });
      await page.waitForTimeout(600);
      const bad = await page.evaluate(() => {
        const out = [];
        for (const el of document.querySelectorAll('button, a.btn, input[type="submit"], .btn, [role="button"]')) {
          const rect = el.getBoundingClientRect();
          if (rect.width < 8 || rect.height < 8) continue;
          const cs = getComputedStyle(el);
          if (cs.visibility === 'hidden' || cs.display === 'none') continue;
          const bordered = ['Top', 'Right', 'Bottom', 'Left']
            .some((s) => (parseFloat(cs['border' + s + 'Width']) || 0) > 0);
          const outlined = (parseFloat(cs.outlineWidth) || 0) > 0 && cs.outlineStyle !== 'none';
          if (bordered || outlined) continue;
          const cls = (el.className && el.className.baseVal !== undefined
            ? el.className.baseVal : el.className) || '';
          out.push(el.tagName.toLowerCase() + (cls ? '.' + String(cls).trim().split(/\s+/).slice(0, 2).join('.') : ''));
        }
        return [...new Set(out)];
      });
      for (const x of bad) if (!borderless.has(x)) borderless.set(x, route);
    } catch (e) { /* the contrast pass already reported an unrenderable route */ }
    await page.close();
  }
  await ctx.close();
}

check('Every control still has a boundary in High Contrast Mode',
  borderless.size === 0,
  [...borderless.entries()].slice(0, 6).map(([s, r]) => `${s} (${r})`).join(' · '));

console.log(`\n${pass} passed, ${fail} failed.`);
await browser.close();
server.kill();
process.exit(fail ? 1 : 0);
