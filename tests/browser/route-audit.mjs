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
import { serveRealFonts, fontsSettled } from './lib/real-fonts.mjs';
import { spawn } from 'node:child_process';
import { readdirSync, statSync, existsSync } from 'node:fs';
import { dirname, join, relative } from 'node:path';
import { fileURLToPath } from 'node:url';

const HERE = dirname(fileURLToPath(import.meta.url));
const ROOT = dirname(dirname(HERE));
// Point at a deployed origin to audit it directly:
//   LAB_BASE=https://wec-lc.pages.dev node tests/browser/route-audit.mjs
// The route LIST still comes from this checkout, which is the point:
// it audits the deployment against the routes this commit says should
// exist, so a page that failed to publish shows up as a 404 rather
// than silently not being checked.
const REMOTE = process.env.LAB_BASE ? process.env.LAB_BASE.replace(/\/$/, '') : null;
const PORT = process.env.LAB_PORT || 8809;
const BASE = REMOTE || `http://localhost:${PORT}`;

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

// Only the local harness needs starting. Against a real origin there is
// nothing to spawn — Cloudflare is the server.
const server = REMOTE ? null : spawn(process.execPath, ['--experimental-sqlite', join(HERE, 'lab-server.mjs')], {
  env: { ...process.env, LAB_PORT: String(PORT) }, stdio: ['ignore', 'pipe', 'pipe'],
});
if (server) {
  await new Promise((resolve, reject) => {
    const t = setTimeout(() => reject(new Error('server did not start')), 20000);
    server.stdout.on('data', (d) => { if (String(d).includes('ready')) { clearTimeout(t); resolve(); } });
    server.stderr.on('data', (d) => { if (!/ExperimentalWarning|trace-warnings/.test(String(d))) process.stderr.write(d); });
  });
} else {
  console.log(`Auditing deployed origin: ${BASE}\n`);
}

const exe = process.env.PW_CHROMIUM || '/opt/pw-browsers/chromium-1194/chrome-linux/chrome';
const browser = await chromium.launch(existsSync(exe) ? { executablePath: exe } : {});
// Google Fonts is unreachable in this sandbox; the pages fall back
// through the font stack in brand.css. Named explicitly so a genuine
// asset failure is never hidden by a blanket filter.
const FONTS = /fonts\.(googleapis|gstatic)\.com/;

// A BUDGET, not zero, and the number is a judgement worth stating.
//
// Inline links inside a paragraph are legitimately the height of their
// line, and demanding 44px for every one of them would force either
// enormous body text or link boxes that overlap the lines above. The
// budget targets NAVIGATION and CONTROLS — the things a thumb actually
// aims at — and a route far above it has a real problem.
//
// Measured before setting: the pages built to the Design Mandate score
// 3-9; the older marketing pages score 22-31, which is what this is here
// to hold the line on.
const TAP_BUDGET = 12;
// How far the actions group may sit from the trailing edge before the
// rail has stopped being a rail. Sub-pixel layout and a scrollbar's
// rounding account for a couple of pixels; the fault this catches was
// 500-odd, so the threshold does not need to be delicate.
const RAIL_SLACK = 4;

const bad = { status: [], assets: [], errors: [], title: [], lang: [], h1: [], alt: [],
  overflow: [], mobileOverflow: [], laptopOverflow: [], laptopClipped: [],
  taps: [], chrome: [], headingSkip: [], rail: [] };

// A SECOND VIEWPORT, because the first one was hiding things.
//
// This audit checked overflow at 1440px only, and passed on every route
// while /student-portal/preview/ overflowed by 40px at 390px. Most
// people who ever open these pages will do so on a phone, so the
// desktop-only check was auditing the least common case and reporting it
// as the whole answer.
const MOBILE = { width: 390, height: 780 };

// A THIRD VIEWPORT, for the same reason there was a second one.
//
// 1440 and 390 are the two widths nothing ever breaks at, because they
// are the two widths everything gets designed at. The interesting
// failures live in between, where a rail has almost enough room.
//
// That is not hypothetical either. The header rebuild fitted at 1440
// and collapsed to a menu at 390, and at 1024 — an ordinary laptop —
// the Portal button had vanished and "Apply Now" was clipped by the
// viewport edge. Both existing checks passed. A width nobody measures
// is a width nobody fixes.
const LAPTOP = { width: 1024, height: 800 };
// Routes that only answered on the second attempt. Reported, never
// silently swallowed — a retry that hides a consistently slow page is
// the same lie as a flaky failure, just in the other direction.
const retried = [];
const page = await browser.newPage({ viewport: { width: 1440, height: 1000 } });
// Abort external webfont requests outright. Through this sandbox's proxy
// they HANG rather than failing fast, which turned a 30-second sweep into
// a multi-minute one. Blocking them is also more honest for this audit:
// it forces every page to render on the brand.css fallback stack, so the
// pages are checked in the state a visitor with a slow or blocked CDN
// actually sees. First-party asset failures are still recorded.
await page.route('**://fonts.googleapis.com/**', (r) => r.abort());
await page.route('**://fonts.gstatic.com/**', (r) => r.abort());

// IS THE RAIL STILL A RAIL?
//
// Overflow and clipping catch a header that is too WIDE. Neither catches
// one that has quietly stopped filling its line — and that is exactly
// what happened next. The slack in the header was an `auto` margin on
// the navigation, so the instant the navigation was hidden below the
// collapse breakpoint the margin went with it and the whole trailing
// group snapped back against the wordmark: menu button glued to the
// brand, the entire right half of the rail empty. Nothing overflowed.
// Nothing was clipped. Every check passed, on a header that looked
// broken in the only picture anyone had taken of it.
//
// So this measures the distance from the trailing edge of the actions
// group to the container's trailing content edge, in whichever direction
// the document runs. Zero-ish is a rail. Hundreds of pixels is a fault,
// whatever the other checks say.
await page.addInitScript(() => {
  window.railGap = () => {
    const inner = document.querySelector('.site-header__inner');
    const act = inner && inner.querySelector(':scope > .header__actions');
    if (!inner || !act) return null;
    const r = act.getBoundingClientRect();
    if (r.width === 0) return null;
    const cs = getComputedStyle(inner);
    const box = inner.getBoundingClientRect();
    return Math.round(cs.direction === 'rtl'
      ? r.left - (box.left + parseFloat(cs.paddingLeft))
      : (box.right - parseFloat(cs.paddingRight)) - r.right);
  };
});

for (const route of routes) {
  const errs = [], reqs = [];
  page.removeAllListeners('pageerror');
  page.removeAllListeners('requestfailed');
  page.on('pageerror', (e) => errs.push(`${route}: ${e.message}`));
  page.on('requestfailed', (r) => { if (!FONTS.test(r.url())) reqs.push(`${route}: ${r.url()}`); });

  // One retry before calling a route broken. A navigation that times
  // out or returns nothing is far more often a cold start or a network
  // hiccup than a genuinely missing page — and this audit is a
  // pre-deployment gate, so a flaky failure is worse than useless: it
  // trains people to re-run it until it goes green. A real 4xx/5xx is
  // NOT retried, because that is a definite answer from the server.
  let resp = await page.goto(BASE + route, { waitUntil: 'domcontentloaded', timeout: 15000 }).catch(() => null);
  if (!resp) {
    await page.waitForTimeout(500);
    resp = await page.goto(BASE + route, { waitUntil: 'domcontentloaded', timeout: 15000 }).catch(() => null);
    if (resp) retried.push(route);
  }
  if (!resp || resp.status() >= 400) { bad.status.push(`${route} -> ${resp ? resp.status() : 'no response after 2 attempts'}`); continue; }
  await page.waitForTimeout(120);

  const info = await page.evaluate(() => {
    // Heading order, checked because a skipped level is invisible to a
    // sighted reader and disorienting to anyone navigating by headings.
    const levels = [...document.querySelectorAll('h1,h2,h3,h4,h5,h6')].map((h) => +h.tagName[1]);
    let skips = 0;
    for (let i = 1; i < levels.length; i++) if (levels[i] - levels[i - 1] > 1) skips++;
    return {
      title: (document.title || '').trim(),
      lang: document.documentElement.getAttribute('lang'),
      h1: document.querySelectorAll('h1').length,
      imgsNoAlt: [...document.images].filter((i) => !i.hasAttribute('alt')).length,
      overflow: document.documentElement.scrollWidth > window.innerWidth + 1,
      headingSkips: skips,
      // The institution's own chrome. A learner crossing from the
      // marketing site into the portal should not lose the College.
      //
      // The language root counts. An Arabic page linking to /ar/ is
      // correct, and an earlier version of this check demanded "/" —
      // reporting eight correctly-built pages as broken, which is the
      // kind of false finding that teaches people to ignore the audit.
      hasHome: !!document.querySelector(
        'a[href="/"], a[href^="/#"], a[href="/ar/"], a[href="/en/"]'),
    };
  }).catch(() => null);
  if (!info) continue;

  if (!info.title) bad.title.push(route);
  if (!info.lang) bad.lang.push(route);
  if (info.h1 !== 1) bad.h1.push(`${route} (${info.h1})`);
  if (info.imgsNoAlt) bad.alt.push(`${route} (${info.imgsNoAlt})`);
  if (info.overflow) bad.overflow.push(route);
  if (info.headingSkips) bad.headingSkip.push(`${route} (${info.headingSkips})`);
  if (!info.hasHome) bad.chrome.push(route);
  bad.errors.push(...errs);
  bad.assets.push(...reqs);

  // Same route, phone viewport. Reusing one page and resizing is far
  // cheaper than a second browser context, and the reflow is what is
  // being measured anyway.
  await page.setViewportSize(MOBILE);
  await page.waitForTimeout(80);
  const m = await page.evaluate(() => ({
    overflow: document.documentElement.scrollWidth - document.documentElement.clientWidth,
    railGap: railGap(),
    // Interactive targets under 44px. Measured on rendered geometry
    // rather than declared CSS, so padding and line-height count — which
    // is what a thumb encounters.
    // WCAG 2.5.8 EXEMPTS A LINK IN A SENTENCE, and so does this now.
    //
    // The count read every anchor on the page, so a page with rich
    // cross-referencing scored worse than a page with none: /academics/
    // reported 21, and fifteen of those were links inside running
    // prose — a photograph's credit line, "see Dates", an email address
    // in a note. An inline link cannot be 44px tall without wrecking the
    // line it sits in, and the standard says so in as many words:
    // targets "in a sentence or block of text" are excepted.
    //
    // What remains is what the rule is actually about. The same page
    // kept six — the level cards, each titled `<h3><a>` and 21px tall,
    // with nothing around them. Those are targets, they were too small,
    // and they were invisible in a number fifteen false positives deep.
    //
    // A SECOND FALSE POSITIVE: a <label> wrapping its <input> is the
    // real hit target — clicking anywhere in the label activates the
    // control — so my-record.html's deliberately small (22px, styled
    // that way on purpose) share-scope checkboxes were being measured
    // on the visible box instead of the 44px label around it. Measure
    // the wrapping label's box when the element has one; the raw
    // element's own box otherwise.
    smallTaps: [...document.querySelectorAll('a, button, input, select, [role="button"]')]
      .filter((e) => {
        const label = e.closest('label');
        const target = label || e;
        const r = target.getBoundingClientRect();
        if (!(r.height > 0 && r.width > 0 && r.height < 44)) return false;
        // "In a sentence or block of text": laid out inline, and sitting
        // inside more text than its own. A heading that IS the link has
        // no surrounding text and stays counted.
        const own = (e.textContent || '').trim();
        const parent = target.parentElement;
        const around = parent ? (parent.textContent || '').trim() : '';
        const inline = getComputedStyle(target).display === 'inline';
        return !(inline && around.length > own.length + 2);
      }).length,
  })).catch(() => null);
  // The in-between width, measured for overflow and for anything the
  // chrome has pushed off the edge — which is how a clipped button
  // shows up, since it does not necessarily extend the scroll width.
  await page.setViewportSize(LAPTOP);
  await page.waitForTimeout(80);
  const l = await page.evaluate(() => ({
    overflow: document.documentElement.scrollWidth - document.documentElement.clientWidth,
    railGap: railGap(),
    clipped: [...document.querySelectorAll('.site-header__inner *, .topbar__inner *')]
      .filter((e) => {
        const r = e.getBoundingClientRect();
        return r.width > 0 && (r.right > window.innerWidth + 1 || r.left < -1);
      })
      .map((e) => (e.textContent || '').trim().slice(0, 18) || e.className)
      .slice(0, 3),
  })).catch(() => null);

  await page.setViewportSize({ width: 1440, height: 1000 });
  if (l) {
    if (l.overflow > 1) bad.laptopOverflow.push(`${route} (+${l.overflow}px)`);
    if (l.clipped.length) bad.laptopClipped.push(`${route} (${l.clipped.join(', ')})`);
    if (l.railGap !== null && l.railGap > RAIL_SLACK) bad.rail.push(`${route} @1024 (${l.railGap}px adrift)`);
  }
  if (m) {
    if (m.overflow > 1) bad.mobileOverflow.push(`${route} (+${m.overflow}px)`);
    if (m.smallTaps > TAP_BUDGET) bad.taps.push(`${route} (${m.smallTaps})`);
    if (m.railGap !== null && m.railGap > RAIL_SLACK) bad.rail.push(`${route} @390 (${m.railGap}px adrift)`);
  }
}

// ── THE CHROME SWEEP ─────────────────────────────────────────────────
//
// Adding a viewport every time something breaks at a width nobody
// measured is not a strategy — it is a list of past failures, and it
// will always be one width short. This walks the whole range instead,
// on four representative routes rather than all 101, and asks the two
// questions that have caught every chrome fault so far: does anything
// grow an extra row, and does anything overflow?
//
// It exists because the utility bar was 60px tall at 900px, 120px tall
// at 820 and 768, and 60px again at 700 — a band bounded on both sides
// by correct behaviour, which is the hardest fault to see by eye and
// the easiest to measure. The header rail below it was fine throughout,
// so nothing else in this file noticed.
//
// A REPRESENTATIVE ROUTE PER CLUSTER, not all 101 and not just the
// homepage. The chrome is identical on every page of a language, so for
// the header and topbar one route would do — but the same sweep also
// measures document overflow, and THAT is per-page. It found the
// homepage's audience grid refusing to shrink below two 156px columns
// and pushing a 320px phone 15px wide. One route per cluster is the
// cheapest sample that can find the same fault in a layout the homepage
// does not use.
//
// English and Arabic both, because the two languages set the same
// content at different widths and therefore break at different ones.
//
// AND IN THE REAL FACES, unlike the rest of this file. Everything above
// renders on the fallback stack deliberately, to check the page a
// visitor with a blocked CDN gets. Wrap points are a different
// question: they depend on the exact width of the glyphs, and the
// fallback stack is not the same width as Playfair, Inter and Cairo.
// Measured on fallbacks this sweep put the topbar's wrap at 768; in the
// real faces it starts at 820. Both are faults and either fails the
// build, but a check that reports the wrong width sends whoever fixes
// it to the wrong breakpoint. 72 page loads is a cheap price for an
// answer that matches the browser.
const SWEEP = [1440, 1280, 1180, 1100, 1024, 960, 900, 860, 820, 768, 700, 640, 560, 480, 430, 390, 360, 320];
const SWEEP_ROUTES = [
  '/', '/ar/',
  '/about/governance/', '/ar/about/governance/',
  '/study/', '/ar/study/',
  '/admissions/tuition/', '/ar/admissions/tuition/',
  '/faculty/', '/ar/faculty/',
  '/press/catalogue/', '/students/assessment/', '/library/', '/contact/',
].filter((r) => routes.includes(r));
const sweepBad = [];
const sweepCtx = await browser.newContext({ viewport: { width: 1440, height: 800 } });
await serveRealFonts(sweepCtx);
const sweepPage = await sweepCtx.newPage();
for (const route of SWEEP_ROUTES) {
  for (const width of SWEEP) {
    await sweepPage.setViewportSize({ width, height: 800 });
    const r = await sweepPage.goto(BASE + route, { waitUntil: 'domcontentloaded', timeout: 15000 }).catch(() => null);
    if (!r || r.status() >= 400) continue;
    await fontsSettled(sweepPage).catch(() => {});
    await sweepPage.waitForTimeout(90);
    const s = await sweepPage.evaluate(() => {
      // A band's row count, from how many non-overlapping vertical
      // bands its children occupy.
      //
      // The first version counted DISTINCT TOPS, and reported the
      // header as three rows at every width including 1440, where it
      // is plainly one. Both bands are `align-items: center`, so a
      // 44px button, a 34px nav link and a 40px wordmark on the same
      // line have three different tops by construction. The check was
      // measuring the alignment mode, not the layout.
      //
      // Overlap is the question actually being asked: two things are on
      // the same row when their vertical extents intersect. Wrapping
      // separates them; centring does not.
      const rows = (sel) => {
        const el = document.querySelector(sel);
        if (!el) return null;
        const spans = [...el.children]
          .map((k) => k.getBoundingClientRect())
          .filter((b) => b.height > 0 && b.width > 0)
          .map((b) => [b.top, b.bottom])
          .sort((a, b) => a[0] - b[0]);
        if (!spans.length) return null;
        let n = 1, end = spans[0][1];
        for (const [top, bottom] of spans.slice(1)) {
          if (top >= end - 1) n++;            // clear of everything so far — a new row
          end = Math.max(end, bottom);
        }
        return n;
      };
      // When the document overflows, name the widest offender — this
      // check failed in CI at +4px on renderer metrics no local run
      // reproduced, and a failure message that says only "+4px" leaves
      // the culprit to be guessed at across a deploy round-trip.
      const cw = document.documentElement.clientWidth;
      let worst = null;
      if (document.documentElement.scrollWidth > cw + 1) {
        for (const el of document.querySelectorAll('body, body *')) {
          const r = el.getBoundingClientRect();
          if (r.width > 0 && (!worst || r.right > worst.right)) {
            const cls = (typeof el.className === 'string' ? el.className : '').split(/\s+/)[0];
            worst = { right: Math.round(r.right), what: el.tagName.toLowerCase() + (cls ? '.' + cls : '') };
          }
        }
      }
      return {
        topbar: rows('.topbar__inner'),
        header: rows('.site-header__inner'),
        overflow: document.documentElement.scrollWidth - document.documentElement.clientWidth,
        worst,
      };
    }).catch(() => null);
    if (!s) continue;
    if (s.topbar > 1) sweepBad.push(`${route} @${width} topbar ${s.topbar} rows`);
    if (s.header > 1) sweepBad.push(`${route} @${width} header ${s.header} rows`);
    if (s.overflow > 1) {
      sweepBad.push(`${route} @${width} overflow +${s.overflow}px`
        + (s.worst ? ` (widest: ${s.worst.what} right=${s.worst.right})` : ''));
    }
  }
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
check(`No horizontal overflow at 1024px${bad.laptopOverflow.length ? ' — ' + list(bad.laptopOverflow) : ''}`, !bad.laptopOverflow.length);
check(`Nothing in the header is clipped at 1024px${bad.laptopClipped.length ? ' — ' + list(bad.laptopClipped, 4) : ''}`, !bad.laptopClipped.length);
check(`No horizontal overflow at 390px${bad.mobileOverflow.length ? ' — ' + list(bad.mobileOverflow) : ''}`, !bad.mobileOverflow.length);
check(`No route skips a heading level${bad.headingSkip.length ? ' — ' + list(bad.headingSkip, 6) : ''}`, !bad.headingSkip.length);
check(`Every route offers a way back to the College${bad.chrome.length ? ' — ' + list(bad.chrome, 8) : ''}`, !bad.chrome.length);
check(`The header rail fills its line at 1024px and 390px${bad.rail.length ? ' — ' + list(bad.rail, 4) : ''}`, !bad.rail.length);
check(`No route exceeds ${TAP_BUDGET} sub-44px tap targets at 390px${bad.taps.length ? ' — ' + list(bad.taps, 8) : ''}`, !bad.taps.length);
check(`Chrome stays one row and inside the viewport across ${SWEEP.length} widths, 320–1440${sweepBad.length ? ' — ' + list(sweepBad, 5) : ''}`, !sweepBad.length);

if (retried.length) {
  console.log(`\nNOTE ${retried.length} route(s) needed a second attempt: ${list(retried)}`);
  console.log('     Not a failure, but worth watching against a deployed origin.');
}
console.log(`\n${pass} passed, ${fail} failed.`);
await browser.close();
if (server) server.kill();
process.exit(fail ? 1 : 0);
