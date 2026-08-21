// Run with: node tests/browser/register.mjs
//
// The browsable Graduate Register, in a real browser.
//
// Two things this page can get wrong in ways no unit test would notice.
//
// It can publish somebody who did not consent — the query is tested, but
// a page that called the endpoint without the filter, or rendered a
// cached list, would leak a name while every backend assertion stayed
// green.
//
// And it can look BROKEN when it is merely EMPTY. Until the first
// conferral, an empty roll is what every visitor sees, and "0 results"
// on the College's own register reads as a fault. That state is
// deliberately the first thing asserted here.
import { chromium } from 'playwright';
import { spawn } from 'node:child_process';
import { existsSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const HERE = dirname(fileURLToPath(import.meta.url));
const PORT = process.env.LAB_PORT || 8826;
const BASE = `http://localhost:${PORT}`;

let pass = 0, fail = 0;
const check = (label, cond, detail) => {
  console.log((cond ? 'PASS ' : 'FAIL ') + label + (cond || detail === undefined ? '' : ` — ${detail}`));
  cond ? pass++ : fail++;
};

// LAB_REQUIRE_AUTH again: the register must be readable with no session.
const server = spawn(process.execPath, ['--experimental-sqlite', join(HERE, 'lab-server.mjs')], {
  env: { ...process.env, LAB_PORT: String(PORT), LAB_REQUIRE_AUTH: '1' }, stdio: ['ignore', 'pipe', 'pipe'],
});
await new Promise((resolve, reject) => {
  const t = setTimeout(() => reject(new Error('server did not start')), 20000);
  server.stdout.on('data', (d) => { if (String(d).includes('ready')) { clearTimeout(t); resolve(); } });
  server.stderr.on('data', (d) => { if (!/ExperimentalWarning|trace-warnings/.test(String(d))) process.stderr.write(d); });
});

const exe = process.env.PW_CHROMIUM || '/opt/pw-browsers/chromium-1194/chrome-linux/chrome';
const browser = await chromium.launch(existsSync(exe) ? { executablePath: exe } : {});
const errs = [];

// Text of a selector that may legitimately not be there, without the
// 30-second wait. Written after a sabotage run proved the point: with
// the empty-state render removed, `page.textContent('.reg-empty')` hung
// and then threw, the process died mid-suite, and every assertion after
// it never ran. A suite that CRASHES on a regression reports one line of
// stack instead of the twelve results that would have located it.
async function textOf(page, sel) {
  const n = page.locator(sel);
  return (await n.count()) ? ((await n.first().textContent()) || '') : '';
}

async function open(url, viewport) {
  const page = await browser.newPage({ viewport: viewport || { width: 1280, height: 1000 } });
  await page.route('**://fonts.googleapis.com/**', (r) => r.abort());
  await page.route('**://fonts.gstatic.com/**', (r) => r.abort());
  page.on('pageerror', (e) => errs.push(e.message));
  await page.goto(url, { waitUntil: 'domcontentloaded' });
  await page.waitForTimeout(700);
  return page;
}

// --- The roll, with no session at all --------------------------------
{
  const page = await open(`${BASE}/register.html`);

  check('The register loads with no account and no sign-in',
    (await page.locator('.reg-entry').count()) > 0);

  const body = await textOf(page, '#list');
  check('It lists award holders at more than one level',
    /Level I\b/.test(body) && /Level VI\b/.test(body), body.slice(0, 160));
  // The directive this page exists to satisfy. A roll showing only its
  // Laureates tells five graduates in six that their award was not worth
  // recording.
  check('...including the lowest award, not only the highest',
    /Aspirant Demonstration/.test(body));
  check('...and the highest', /Laureate Demonstration/.test(body));

  // The consent assertion, checked against a graduate who genuinely
  // exists in the register and genuinely declined. Without that fixture
  // this would be asserting that a filter removes rows nobody added.
  check('A graduate who did not consent is absent from the roll',
    !/Unlisted Demonstration/.test(await page.content()));

  check('Each entry carries the honour where one was awarded',
    (await page.locator('.reg-entry__honour').count()) >= 2,
    await page.locator('.reg-entry__honour').count());
  check('...and a link that verifies that specific award',
    /verify\.html\?code=WEC-/.test(await page.getAttribute('.reg-entry__check a', 'href')));

  const count = await textOf(page, '#count');
  check('The count is stated in words, not left to be counted', /\d+ awards? listed/.test(count), count);
  await page.close();
}

// --- Filtering -------------------------------------------------------
{
  const page = await open(`${BASE}/register.html`);
  await page.selectOption('#level', '6');
  await page.waitForTimeout(700);
  check('Choosing an award narrows the roll without a second click',
    (await page.locator('.reg-entry').count()) === 1,
    await page.locator('.reg-entry').count());
  check('...to that award', /Laureate Demonstration/.test(await textOf(page, '#list')));

  await page.selectOption('#level', '');
  await page.fill('#q', 'aspirant');
  await page.locator('.reg-go').click();
  await page.waitForTimeout(700);
  check('A lower-case name search matches',
    (await page.locator('.reg-entry').count()) === 1 && /Aspirant Demonstration/.test(await textOf(page, '#list')));

  await page.fill('#q', 'Nobody Of That Name');
  await page.locator('.reg-go').click();
  await page.waitForTimeout(700);
  check('A search matching nobody says so, and does not fall back to everybody',
    (await page.locator('.reg-entry').count()) === 0
    && /No listed award matches/i.test(await textOf(page, '.reg-empty')));
  // The distinction that matters to a checker who cannot find someone:
  // absent from this page is not the same as unverified.
  check('...and explains that an unlisted award is still verifiable',
    /still be checked by its code/i.test(await textOf(page, '.reg-empty')));
  await page.close();
}

// --- The empty register is a state, not a fault ----------------------
// The state every visitor sees until the first conferral.
{
  const page = await browser.newPage();
  await page.route('**://fonts.g**', (r) => r.abort());
  await page.route('**/api/register*', (r) =>
    r.fulfill({ status: 200, contentType: 'application/json',
      body: JSON.stringify({ count: 0, limit: 100, truncated: false, entries: [] }) }));
  page.on('pageerror', (e) => errs.push(e.message));
  await page.goto(`${BASE}/register.html`, { waitUntil: 'domcontentloaded' });
  await page.waitForTimeout(700);

  const empty = await textOf(page, '.reg-empty');
  check('An empty register says no awards have been conferred',
    /No awards have yet been conferred/i.test(empty), empty.slice(0, 80));
  check('...and says why the page exists before the first one',
    /verification exists from the first award/i.test(empty));
  check('...without ever showing "0 results" or a stalled loader',
    !/^0\b/.test((await textOf(page, '#count')).trim())
    && !/loading/i.test(await textOf(page, '#count')),
    await textOf(page, '#count'));
  await page.close();
}

// --- A register that cannot be reached is not a statement about awards
{
  const page = await browser.newPage();
  await page.route('**://fonts.g**', (r) => r.abort());
  await page.route('**/api/register*', (r) => r.abort());
  page.on('pageerror', (e) => errs.push(e.message));
  await page.goto(`${BASE}/register.html`, { waitUntil: 'domcontentloaded' });
  await page.waitForTimeout(800);
  const msg = await textOf(page, '.reg-empty');
  check('An unreachable Register blames itself rather than the graduates',
    /fault on our side/i.test(msg) && /not a statement about any award/i.test(msg), msg.slice(0, 90));
  await page.close();
}

// --- What an absence from the roll does and does not mean ------------
// This block used to require a "provisional — the award architecture
// has not yet been approved" notice. That notice was struck when the
// page was ported into pages/: it had stopped being true (awards HAVE
// been conferred at Levels I and II), and the standard ruled on
// 18 August 2026 is that the site states what the College does rather
// than what it has not done.
//
// What must still hold is the thing that notice was standing in for —
// that the roll never implies more than it is. It is a roll of the
// award holders who CONSENTED to appear, so a reader must be told, on
// the page, that an award missing from it is not an award that does not
// exist.
{
  const page = await open(`${BASE}/register.html`);
  const lede = await textOf(page, '.masthead__inner .lede');
  check('The roll says an award absent from it can still be checked by its code',
    /not listed can still be checked/i.test(lede), lede.slice(0, 120));
  check('...and links to the place it is checked',
    (await page.locator('.masthead__inner .lede a[href="/verify.html"]').count()) === 1);
  check('...and no page still carries the retired "provisional" notice',
    (await page.locator('.reg-provisional').count()) === 0);
  await page.close();
}

// --- A name is rendered, never executed ------------------------------
// Holder names are transcribed from certificates by people. This asserts
// the page treats an odd one as odd data rather than as markup.
{
  const page = await browser.newPage();
  await page.route('**://fonts.g**', (r) => r.abort());
  await page.route('**/api/register*', (r) =>
    r.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({
      count: 1, limit: 100, truncated: false,
      entries: [{ holderName: '<img src=x onerror="window.__pwned=1">', awardTitle: 'A', postNominal: 'X',
        honour: 'pass', honourLabel: 'Pass', conferredOn: '2027-03-01',
        verificationCode: 'WEC-AAAA-BBBB-CCCCC', levelId: 1, roman: 'I', levelName: 'L', cefr: 'A1' }] }) }));
  page.on('pageerror', (e) => errs.push(e.message));
  await page.goto(`${BASE}/register.html`, { waitUntil: 'domcontentloaded' });
  await page.waitForTimeout(700);
  check('A holder name containing markup is shown as text, not run as markup',
    (await page.evaluate(() => window.__pwned)) === undefined
    && (await page.locator('.reg-entry__name img').count()) === 0);
  check('...and the name is still displayed to the reader',
    (await textOf(page, '.reg-entry__name')).includes('<img'));
  await page.close();
}

// --- Truncation is disclosed -----------------------------------------
{
  const page = await browser.newPage();
  await page.route('**://fonts.g**', (r) => r.abort());
  await page.route('**/api/register*', (r) =>
    r.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({
      count: 2, limit: 2, truncated: true,
      entries: [1, 2].map((n) => ({ holderName: `Graduate ${n}`, awardTitle: 'A', postNominal: 'X',
        honour: 'pass', honourLabel: 'Pass', conferredOn: '2027-03-01',
        verificationCode: `WEC-AAAA-BBBB-CCCC${n}`, levelId: 1, roman: 'I', levelName: 'L', cefr: 'A1' })) }) }));
  await page.goto(`${BASE}/register.html`, { waitUntil: 'domcontentloaded' });
  await page.waitForTimeout(700);
  // A silently truncated roll invites a false conclusion — "they only
  // have two graduates" — that the visitor never learns is wrong.
  check('A truncated roll says it is truncated',
    (await page.locator('#more').isVisible()) === true
    && /Showing the first 2/.test(await textOf(page, '#more')));
  await page.close();
}

// --- Mobile and accessibility ----------------------------------------
{
  const page = await open(`${BASE}/register.html`, { width: 390, height: 780 });
  const overflow = await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth);
  check('No horizontal overflow at 390px', overflow <= 0, overflow);
  const q = await page.locator('#q').boundingBox();
  check('The search field is a comfortable tap target', !!q && q.height >= 44, q && Math.round(q.height));
  const sel = await page.locator('#level').boundingBox();
  check('So is the award filter', !!sel && sel.height >= 44, sel && Math.round(sel.height));
  check('Both controls have real labels',
    (await page.locator('label[for="q"]').count()) === 1
    && (await page.locator('label[for="level"]').count()) === 1);
  check('The results region announces changes',
    (await page.getAttribute('#results', 'aria-live')) === 'polite');
  check('Exactly one h1', (await page.locator('h1').count()) === 1);
  await page.screenshot({ path: join(HERE, 'screenshots', 'register-mobile.png'), fullPage: true }).catch(() => {});
  await page.close();
}

check('No uncaught script errors', errs.length === 0, errs.slice(0, 2).join(' | '));

console.log(`\n${pass} passed, ${fail} failed.`);
await browser.close();
server.kill();
process.exit(fail ? 1 : 0);
