// Run with: node tests/browser/my-programme.mjs
//
// The page that closes the journey gap, driven in a real browser
// against the real study-plan module and the real seeded curriculum.
//
// The gap: /listening-lab.html requires ?unit=<id> and without it says
// "No unit specified. Open this page from a module." There was no
// module page. A signed-in learner could not reach a lesson. So the
// assertion that matters most here is not that the page renders — it is
// that the button on it actually lands in a working lesson. A "Begin"
// button that leads to the Lab's own error message would look like
// success in every screenshot.
import { chromium } from 'playwright';
import { spawn } from 'node:child_process';
import { existsSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const HERE = dirname(fileURLToPath(import.meta.url));
const PORT = process.env.LAB_PORT || 8823;
const BASE = `http://localhost:${PORT}`;

let pass = 0, fail = 0;
const check = (label, cond, detail) => {
  console.log((cond ? 'PASS ' : 'FAIL ') + label + (cond || detail === undefined ? '' : ` — ${detail}`));
  cond ? pass++ : fail++;
};

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

const errs = [];

// Which learner the harness answers as. Done by rewriting the request
// rather than by adding a parameter to the page, because a production
// page that can ask for somebody else's study plan is a page that will
// eventually be asked to.
async function openAs(who, viewport) {
  const page = await browser.newPage({ viewport: viewport || { width: 1280, height: 1000 } });
  await page.route('**://fonts.googleapis.com/**', (r) => r.abort());
  await page.route('**://fonts.gstatic.com/**', (r) => r.abort());
  page.on('pageerror', (e) => errs.push(e.message));
  if (who) {
    await page.route('**/api/student/study-plan*', (route) => {
      const u = new URL(route.request().url());
      u.searchParams.set('as', who);
      route.continue({ url: u.toString() });
    });
  }
  await page.goto(`${BASE}/my-programme.html`, { waitUntil: 'domcontentloaded' });
  await page.waitForTimeout(700);
  return page;
}

// --- A learner who has never opened anything -------------------------
{
  const page = await openAs('usr_demo');
  check('A learner is shown one next step, not a menu',
    (await page.locator('#nextCard').isVisible()) === true);
  const title = await page.textContent('#nextTitle');
  check('...naming the first unit of their lowest active level',
    /^Unit 1 —/.test((title || '').trim()), (title || '').trim());
  const cta = await page.textContent('#nextCta');
  check('...with a call to action that says it is their first',
    /Begin your first unit/i.test(cta || ''), (cta || '').trim());

  const href = await page.getAttribute('#nextCta', 'href');
  check('...and a link that carries a unit id, which is what the Lab requires',
    /^\/listening-lab\.html\?unit=.+/.test(href || ''), href);

  // THE ASSERTION THIS FILE EXISTS FOR. A button that leads to the
  // Lab's "No unit specified" error would look identical in a
  // screenshot to one that works.
  await page.goto(`${BASE}${href}`, { waitUntil: 'domcontentloaded' });
  await page.waitForTimeout(1200);
  const labErr = await page.textContent('#labError').catch(() => '');
  check('Following it reaches a real lesson, not the Lab\'s "no unit" error',
    !/No unit specified/i.test(labErr || ''), (labErr || '').trim() || '(no error)');
  const labTitle = await page.textContent('h1').catch(() => '');
  check('...with the lesson actually rendered', (labTitle || '').trim().length > 0, (labTitle || '').trim().slice(0, 60));
  await page.close();
}

// --- A learner part way through --------------------------------------
{
  const page = await openAs('usr_prog');
  const eyebrow = await page.textContent('#nextEyebrow');
  check('A learner with a unit in progress is offered a RESUME, not a restart',
    /Continue where you left off/i.test(eyebrow || ''), (eyebrow || '').trim());
  const title = await page.textContent('#nextTitle');
  check('...pointing at the unfinished unit, not the next untouched one',
    /^Unit 2 —/.test((title || '').trim()), (title || '').trim());

  const count = await page.textContent('#progressCount');
  check('Progress is a fraction of units, not a bare percentage',
    /1 of \d+ units completed/.test(count || ''), (count || '').trim());

  const rows = await page.locator('.mp-unit').count();
  check('Every unit in the level is listed, not only the next one', rows >= 3, rows);
  check('...with the finished one marked done',
    (await page.locator('.mp-unit.is-done').count()) === 1, await page.locator('.mp-unit.is-done').count());
  check('...and exactly one marked as where to go',
    (await page.locator('.mp-unit.is-current').count()) === 1);

  // The bar is decoration over the count; a screen reader should get
  // the same sentence rather than a naked percentage.
  const barLabel = await page.getAttribute('#progressBar', 'aria-label');
  check('The progress bar carries the same meaning for a screen reader',
    /units completed/.test(barLabel || ''), barLabel);

  // Every unit row is a link, so the list is a way in and not a display.
  const hrefs = await page.locator('.mp-unit').evaluateAll((els) => els.map((e) => e.getAttribute('href')));
  check('Every unit row links into the Lab',
    hrefs.length > 0 && hrefs.every((h) => /^\/listening-lab\.html\?unit=/.test(h || '')), hrefs.slice(0, 2).join(' '));
  await page.close();
}

// --- A learner with no enrolment -------------------------------------
{
  const page = await openAs('usr_none');
  check('An unenrolled learner is not shown a next step', (await page.locator('#nextCard').isVisible()) === false);
  check('...but IS shown an explanation', (await page.locator('#stateCard').isVisible()) === true);
  const body = await page.textContent('#stateCard');
  check('...that says what to do about it rather than only what is missing',
    /Admissions/i.test(body || ''), (body || '').trim().slice(0, 140));
  check('...and does not render an empty unit list under a progress heading',
    (await page.locator('#progressCard').isVisible()) === false);
  await page.close();
}

// --- Mobile ----------------------------------------------------------
// The one control this page exists to offer is most often tapped on a
// phone, and a primary action below the fold is a primary action nobody
// takes. This is the defect class that already bit once, on the quiz
// result card.
{
  const page = await openAs('usr_prog', { width: 390, height: 780 });
  const cta = page.locator('#nextCta');
  const box = await cta.boundingBox();
  check('On a phone the primary action is above the fold without scrolling',
    !!box && box.y + box.height <= 780, box ? `${Math.round(box.y)}px` : 'not found');
  check('...and is a comfortable tap target', !!box && box.height >= 44, box ? `${Math.round(box.height)}px` : '—');

  const overflow = await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth);
  check('No horizontal overflow at 390px', overflow <= 0, overflow);
  await page.screenshot({ path: join(HERE, 'screenshots', 'my-programme-mobile.png'), fullPage: true }).catch(() => {});
  await page.close();
}

check('No uncaught script errors', errs.length === 0, errs.slice(0, 2).join(' | '));

console.log(`\n${pass} passed, ${fail} failed.`);
await browser.close();
server.kill();
process.exit(fail ? 1 : 0);
