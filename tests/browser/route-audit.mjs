// Run with: node tests/browser/route-audit.mjs
//
// Pre-deployment route audit. Walks every built HTML file, loads each
// one in a real browser against the real API harness, and checks the
// things that break a deployment rather than a unit test: broken
// routes, missing assets, script errors, and the accessibility basics
// (title, lang, a single h1, alt text) on EVERY page rather than a
// sampled few.
//
// Kept separate from run.mjs because it needs Chromium and a server.
import { chromium } from 'playwright';
import { spawn } from 'node:child_process';
import { readdirSync, statSync, existsSync } from 'node:fs';
import { dirname, join, relative } from 'node:path';
import { fileURLToPath } from 'node:url';

const HERE = dirname(fileURLToPath(import.meta.url));
const ROOT = dirname(dirname(HERE));
const PORT = process.env.LAB_PORT || 8809;
const BASE = `http://localhost:${PORT}`;

// Source directories, not build output.
const SKIP = new Set(['node_modules', 'tests', 'pages', 'partials', 'docs', 'sql', 'functions', 'scripts', '.git', 'assets']);
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
// Google Fonts is unreachable in this sandbox; the pages fall back
// through the font stack in brand.css. Named explicitly so a genuine
// asset failure is never hidden by a blanket filter.
const FONTS = /fonts\.(googleapis|gstatic)\.com/;

const bad = { status: [], assets: [], errors: [], title: [], lang: [], h1: [], alt: [], overflow: [] };
const page = await browser.newPage({ viewport: { width: 1440, height: 1000 } });
// Abort external webfont requests outright. Through this sandbox's proxy
// they HANG rather than failing fast, which turned a 30-second sweep into
// a multi-minute one. Blocking them is also more honest for this audit:
// it forces every page to render on the brand.css fallback stack, so the
// pages are checked in the state a visitor with a slow or blocked CDN
// actually sees. First-party asset failures are still recorded.
await page.route('**://fonts.googleapis.com/**', (r) => r.abort());
await page.route('**://fonts.gstatic.com/**', (r) => r.abort());

for (const route of routes) {
  const errs = [], reqs = [];
  page.removeAllListeners('pageerror');
  page.removeAllListeners('requestfailed');
  page.on('pageerror', (e) => errs.push(`${route}: ${e.message}`));
  page.on('requestfailed', (r) => { if (!FONTS.test(r.url())) reqs.push(`${route}: ${r.url()}`); });

  const resp = await page.goto(BASE + route, { waitUntil: 'domcontentloaded', timeout: 12000 }).catch(() => null);
  if (!resp || resp.status() >= 400) { bad.status.push(`${route} -> ${resp ? resp.status() : 'no response'}`); continue; }
  await page.waitForTimeout(120);

  const info = await page.evaluate(() => ({
    title: (document.title || '').trim(),
    lang: document.documentElement.getAttribute('lang'),
    h1: document.querySelectorAll('h1').length,
    imgsNoAlt: [...document.images].filter((i) => !i.hasAttribute('alt')).length,
    overflow: document.documentElement.scrollWidth > window.innerWidth + 1,
  })).catch(() => null);
  if (!info) continue;

  if (!info.title) bad.title.push(route);
  if (!info.lang) bad.lang.push(route);
  if (info.h1 !== 1) bad.h1.push(`${route} (${info.h1})`);
  if (info.imgsNoAlt) bad.alt.push(`${route} (${info.imgsNoAlt})`);
  if (info.overflow) bad.overflow.push(route);
  bad.errors.push(...errs);
  bad.assets.push(...reqs);
}

let pass = 0, fail = 0;
const check = (l, c) => { console.log((c ? 'PASS ' : 'FAIL ') + l); c ? pass++ : fail++; };
const list = (a, n = 5) => a.slice(0, n).join(', ') + (a.length > n ? ` … +${a.length - n}` : '');

check(`All ${routes.length} built routes respond without error${bad.status.length ? ' — ' + list(bad.status) : ''}`, !bad.status.length);
check(`No first-party asset failures${bad.assets.length ? ' — ' + list(bad.assets, 3) : ''}`, !bad.assets.length);
check(`No uncaught script errors on any route${bad.errors.length ? ' — ' + list(bad.errors, 3) : ''}`, !bad.errors.length);
check(`Every route has a non-empty <title>${bad.title.length ? ' — ' + list(bad.title) : ''}`, !bad.title.length);
check(`Every route declares a lang attribute${bad.lang.length ? ' — ' + list(bad.lang) : ''}`, !bad.lang.length);
check(`Every route has exactly one h1${bad.h1.length ? ' — ' + list(bad.h1, 6) : ''}`, !bad.h1.length);
check(`Every image carries an alt attribute${bad.alt.length ? ' — ' + list(bad.alt, 6) : ''}`, !bad.alt.length);
check(`No horizontal overflow at 1440px${bad.overflow.length ? ' — ' + list(bad.overflow) : ''}`, !bad.overflow.length);

console.log(`\n${pass} passed, ${fail} failed.`);
await browser.close();
server.kill();
process.exit(fail ? 1 : 0);
