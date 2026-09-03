// Run with: node tests/browser/examiner-review.mjs
//
// The External Examiner's pass list, end to end, against real backend
// logic (tests/browser/lab-server.mjs) and a learner who has genuinely
// finished a level with real marks — not a fixture that merely renders.
// Confirms the whole chain governance C5 describes: the Examiner
// reviews real evidence and confirms a decision; that decision is NOT
// itself a conferral; a separate administrator, standing in for the
// Registrar, executes the actual write to the Graduate Register; and
// once conferred, the pass list clears on both sides.
import { chromium } from 'playwright';
import { spawn } from 'node:child_process';
import { existsSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const HERE = dirname(fileURLToPath(import.meta.url));
const PORT = process.env.LAB_PORT || 8833;
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

async function newPage() {
  const page = await browser.newPage({ viewport: { width: 1280, height: 1400 } });
  page.on('pageerror', (e) => errs.push(e.message));
  await page.route('**://fonts.googleapis.com/**', (r) => r.abort());
  await page.route('**://fonts.gstatic.com/**', (r) => r.abort());
  await page.route(`**://${FAKE_HOST}/**`, (route) => {
    route.fulfill({
      contentType: 'application/javascript',
      body: `window.Clerk = {
        user: { id: 'usr_examiner', firstName: 'Independent' },
        session: { getToken: function () { return Promise.resolve('stub-examiner'); } },
        load: function () { return Promise.resolve(); },
        redirectToSignIn: function () {}, signOut: function (cb) { if (cb) cb(); },
      };`,
    });
  });
  // '**' after '.js' matters: build.js fingerprints the script tag
  // ('?v=<hash>'), and a pattern with no wildcard after '.js' does not
  // match a URL carrying a query string — the interception would
  // silently miss every request and the real (empty-key) file would
  // load instead.
  await page.route('**/js/auth-config.js**', (route) => {
    route.fulfill({ contentType: 'application/javascript', body: `window.WEC_LC_AUTH = { clerkPublishableKey: '${FAKE_KEY}' };` });
  });
  return page;
}

// --- The Examiner reviews real evidence and confirms ------------------
{
  const page = await newPage();
  await page.goto(`${BASE}/examiner-review.html`, { waitUntil: 'domcontentloaded' });
  await page.waitForTimeout(900);

  check('The finisher appears on the pass list',
    /finisher@example\.com/.test(await page.locator('#queue').innerText()));
  check('Their level is shown correctly',
    /Level I —/.test(await page.locator('#queue').innerText()));

  await page.locator('button', { hasText: 'Review the evidence' }).click();
  await page.waitForTimeout(500);

  const evidenceText = await page.locator('#queue').innerText();
  check('Real marks are shown, not a placeholder', /Overall 85%/.test(evidenceText), evidenceText.slice(0, 200));
  check('The calculated honour reflects the real marks (Merit at 85%/85%)', /Merit/.test(evidenceText));
  check('The competency-mapping gap (governance A6d) is shown honestly, not hidden',
    /commissioned under governance A6d/.test(evidenceText));

  await page.locator('button', { hasText: 'Confirm' }).click();
  await page.waitForTimeout(700);
  check('After confirming, the card clears from view (a fresh queue load keeps showing it, awaiting conferral)',
    !(await page.locator('#queue').innerText()).includes('Overall 85%'));

  await page.close();
}

// --- A second, independent confirmation exists in the harness's D1 ----
// (implicitly proven by the admin step below actually finding it)

// --- The administrator (Registrar stand-in) executes the conferral ----
{
  const page = await newPage();
  // admin-enrolments.html's own auth chain checks state.viewer.role via
  // /api/admin/learners, which the harness always answers as ADMIN_ACTOR
  // — see lab-server.mjs. No further stubbing needed for that part.
  await page.goto(`${BASE}/admin-enrolments.html`, { waitUntil: 'domcontentloaded' });
  await page.waitForTimeout(900);

  const passListText = await page.locator('#passListBox').innerText();
  check('The confirmed entry appears in the administrator\'s pass-list queue',
    /finisher@example\.com|Level I/.test(passListText), passListText.slice(0, 200));
  check('It names the Examiner who confirmed it',
    /examiner@example\.com/.test(passListText), passListText.slice(0, 200));

  page.once('dialog', (d) => d.accept());
  await page.locator('#passListBox button', { hasText: 'Confer' }).click();
  await page.waitForTimeout(700);

  check('After conferring, the pass-list queue is empty',
    /Nothing is currently confirmed/.test(await page.locator('#passListBox').innerText()));

  await page.close();
}

// --- The award is real: the examiner's queue no longer shows Level I --
{
  const page = await newPage();
  await page.goto(`${BASE}/examiner-review.html`, { waitUntil: 'domcontentloaded' });
  await page.waitForTimeout(900);
  check('Once conferred, the learner no longer appears awaiting a decision for this level',
    !/finisher@example\.com/.test(await page.locator('#queue').innerText()));
  await page.close();
}

check('No uncaught script errors across the whole suite', errs.length === 0, errs.slice(0, 3).join(' | '));

console.log(`\n${pass} passed, ${fail} failed.`);
await browser.close();
server.kill();
process.exit(fail ? 1 : 0);
