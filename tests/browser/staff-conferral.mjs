// Run with: node tests/browser/staff-conferral.mjs
//
// The countersignature queue on staff-conferral.html, end to end,
// against real backend logic (tests/browser/lab-server.mjs) and a real
// conferred demonstration award. Confirms governance C5 as a Registrar
// actually experiences it: proposing a withdrawal PROPOSES rather than
// executes it; the proposing officer sees their own request as
// self-proposed, with a Cancel control and no Countersign control; a
// DIFFERENT officer sees the same request as countersignable; executing
// the countersignature clears the request from the queue and the
// empty-state copy comes back. See registry/conferral.js's head
// comment and js/staff-conferral.js's for the reasoning.
import { chromium } from 'playwright';
import { spawn } from 'node:child_process';
import { existsSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const HERE = dirname(fileURLToPath(import.meta.url));
const PORT = process.env.LAB_PORT || 8919;
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

const FAKE_HOST = 'fake-clerk-host.test';
const FAKE_KEY = 'pk_test_' + Buffer.from(`${FAKE_HOST}$`).toString('base64');

// `stubToken` picks which of the harness's two administrators
// (usr_admin / usr_admin2) the page authenticates as — see
// tests/browser/lab-server.mjs's STUB_TOKENS and its /api/auth/me and
// /api/admin/conferral handlers, which resolve the real bearer token
// rather than a fixed actor precisely so this distinction is testable
// from a real browser.
async function newPage(stubToken) {
  const page = await browser.newPage({ viewport: { width: 1280, height: 1400 } });
  page.on('pageerror', (e) => errs.push(e.message));
  await page.route('**://fonts.googleapis.com/**', (r) => r.abort());
  await page.route('**://fonts.gstatic.com/**', (r) => r.abort());
  await page.route(`**://${FAKE_HOST}/**`, (route) => {
    route.fulfill({
      contentType: 'application/javascript',
      body: `window.Clerk = {
        user: { id: '${stubToken}', firstName: 'Stub' },
        session: { getToken: function () { return Promise.resolve('${stubToken}'); } },
        load: function () { return Promise.resolve(); },
        redirectToSignIn: function () {}, signOut: function (cb) { if (cb) cb(); },
      };`,
    });
  });
  // '**' after '.js' matters: build.js fingerprints the script tag
  // ('?v=<hash>'), and a pattern with no wildcard after '.js' does not
  // match a URL carrying a query string.
  await page.route('**/js/auth-config.js**', (route) => {
    route.fulfill({ contentType: 'application/javascript', body: `window.WEC_LC_AUTH = { clerkPublishableKey: '${FAKE_KEY}' };` });
  });
  return page;
}

// --- usr_admin proposes a withdrawal on the live DEMO award ------------
let requestAppeared = false;
{
  const page = await newPage('stub-admin');
  await page.goto(`${BASE}/staff-conferral.html`, { waitUntil: 'domcontentloaded' });
  await page.waitForTimeout(1200);

  check('The conferred group shows the demonstration award',
    /Demonstration Learner/.test(await page.locator('[data-conferred]').innerText().catch(() => '')));

  await page.locator('[data-conferred] .stf-item', { hasText: 'Demonstration Learner' }).locator('.acc-open').click();
  await page.waitForTimeout(600);
  await page.locator('#cnfReason').fill('Removing this demonstration award.');
  await page.locator('.cnf-withdraw button.btn--outline').first().click();
  await page.waitForTimeout(200);
  await page.locator('.cnf-withdraw button.btn--red').click();
  await page.waitForTimeout(1500);

  const said = await page.locator('[data-candidate] .cnf-said').innerText().catch(() => '');
  check('The withdrawal is PROPOSED, not executed', /not take effect/i.test(said), said);

  const pendingText = await page.locator('#secPending').innerText().catch(() => '');
  requestAppeared = /Demonstration Graduate/.test(pendingText);
  check('The proposal appears in the pending queue', requestAppeared, pendingText.slice(0, 200));
  check('...marked self-proposed, with a Cancel control',
    /awaiting a different officer/i.test(pendingText) && /Cancel this request/i.test(pendingText));
  check('...and NOT offering to countersign it', !/Countersign and execute/.test(pendingText));

  await page.close();
}

// --- A DIFFERENT officer sees the same request as countersignable ------
if (requestAppeared) {
  const page = await newPage('stub-admin2');
  await page.goto(`${BASE}/staff-conferral.html`, { waitUntil: 'domcontentloaded' });
  await page.waitForTimeout(1200);

  const pendingText = await page.locator('#secPending').innerText().catch(() => '');
  check('A different officer sees a Countersign control instead',
    /Countersign and execute/.test(pendingText), pendingText.slice(0, 200));
  check('...and no self-proposed note', !/awaiting a different officer/i.test(pendingText));

  await page.locator('#secPending button.seal').click();
  await page.waitForTimeout(1500);

  const afterText = await page.locator('#secPending').innerText().catch(() => '');
  check('After countersignature the request leaves the pending queue',
    !/Demonstration Graduate/.test(afterText), afterText.slice(0, 200));

  const emptyState = await page.evaluate(() => {
    const box = document.querySelector('[data-pending-empty]');
    const note = document.querySelector('[data-pending-empty-note]');
    return { hidden: box ? box.hidden : null, note: note ? note.textContent : null };
  });
  check('...and the empty-state box shows, with real copy',
    emptyState.hidden === false && /waiting on a countersignature/i.test(emptyState.note || ''),
    JSON.stringify(emptyState));

  const conferredCount = await page.locator('[data-tile="conferred"] [data-count]').innerText().catch(() => '?');
  check('...and the award itself is really withdrawn (Awards held tile reads 0)',
    conferredCount.trim() === '0', conferredCount);

  await page.close();
} else {
  check('(skipped countersignature check — the proposal never appeared)', false);
}

check('No uncaught script errors across the whole suite', errs.length === 0, errs.slice(0, 3).join(' | '));

console.log(`\n${pass} passed, ${fail} failed.`);
await browser.close();
server.kill();
process.exit(fail ? 1 : 0);
