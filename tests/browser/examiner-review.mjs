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

// --- The administrator (Registrar stand-in) sees the real confirmation
// and executes the conferral --------------------------------------------
// Two conferral routes exist. staff-conferral.html — linked from
// staff-enrolments.html's nav, the console an administrator actually
// uses — checks the FULL academic standing (a published level
// examination, staff confirmation, approved skill mappings) as well as
// the pass-list confirmation; admin-enrolments.html's simpler,
// pass-list-only UI was retired when that page was superseded. This
// finisher fixture is built to prove the EXAMINER side against real
// evidence (marks, the A6d competency gap) and was never meant to also
// clear the Registrar's full standing bar — doing that here would mean
// fabricating unrelated fixture data (an examination paper, a staff
// confirmation) this file has no reason to carry. Proven here instead,
// against the real endpoints admin-enrolments.html used to front:
{
  const page = await newPage();
  // A real document, not about:blank, so relative fetch() calls below
  // resolve against the harness's own origin.
  await page.goto(`${BASE}/staff-conferral.html`, { waitUntil: 'domcontentloaded' });
  await page.waitForTimeout(900);

  check('The confirmed entry is not (yet) eligible on the fuller console — its own academic standing has unmet conditions this fixture never set out to clear',
    (await page.locator('[data-eligible] li', { hasText: 'finisher@example.com' }).count()) === 0
      && (await page.locator('[data-conditional] li', { hasText: 'finisher@example.com' }).count()) === 1);

  const before = await page.evaluate(() => fetch('/api/admin/pass-list').then((r) => r.json()));
  const entry = before.entries.find((e) => e.email === 'finisher@example.com');
  check('The confirmed entry is real and queryable by the administrator',
    Boolean(entry), JSON.stringify(before.entries.map((e) => e.email)));
  check('It names the Examiner who confirmed it',
    entry && entry.examinerEmail === 'examiner@example.com', entry && entry.examinerEmail);

  const conferred = await page.evaluate(
    (id) => fetch('/api/admin/confer', {
      method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ entryId: id }),
    }).then((r) => r.json()),
    entry.id,
  );
  // pass-list.js's confer() returns conferAward()'s row as-is — raw DB
  // column names, not the camelCase view the UI-facing endpoints map it
  // to.
  check('The Registrar\'s act confers a real award, with a verification code',
    typeof conferred.verification_code === 'string' && conferred.verification_code.length > 0,
    JSON.stringify(conferred).slice(0, 200));

  const after = await page.evaluate(() => fetch('/api/admin/pass-list').then((r) => r.json()));
  check('After conferring, the pass-list queue no longer carries this entry',
    !after.entries.some((e) => e.email === 'finisher@example.com'));

  // The two routes share real state — the entry that was "waiting on
  // the College" on this same console a moment ago is gone from there
  // too, not just from the pass-list API's own view of it.
  await page.reload({ waitUntil: 'domcontentloaded' });
  await page.waitForTimeout(900);
  check('...and staff-conferral.html no longer lists it as waiting, either',
    (await page.locator('[data-conditional] li', { hasText: 'finisher@example.com' }).count()) === 0);

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
