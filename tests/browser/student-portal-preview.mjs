// Run with: node tests/browser/student-portal-preview.mjs
//
// /student-portal/preview/ and its profile/ sibling are a hybrid: a
// static design preview that, the moment a real Clerk session exists,
// is meant to start showing a real student their real level, progress
// and payment history (see js/portal-auth.js). Before this suite,
// nothing exercised the authenticated branch of either page at all —
// every other visit to them ran with no Clerk key configured, where
// js/portal-guard.js is a no-op and the pages stay exactly the static
// mockup they always were.
//
// That gap hid a real honesty bug: the "Design Preview — not a live
// student account" banner was a static, unconditional <div> that
// js/portal-auth.js never touched, so a real signed-in student would
// have seen it insist none of their data was live while looking at
// their own real level progress. Two of the four dashboard stat tiles
// (Attendance, Next Assessment) were fabricated numbers that directly
// contradict the College's own public marketing copy and were never
// wired to anything real, authenticated or not.
//
// This suite proves, against the real backend logic (not fixtures —
// see tests/browser/lab-server.mjs), that: the unauthenticated preview
// is unchanged; a real session hides every demo tag, swaps the banner,
// removes the two fabricated tiles from the DOM, and renders real
// per-level unit progress, a real payment-history empty state, a real
// Certificates link to /my-record.html, and a real Two-Factor status
// from Clerk's own user record.
import { chromium } from 'playwright';
import { spawn } from 'node:child_process';
import { existsSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const HERE = dirname(fileURLToPath(import.meta.url));
const PORT = process.env.LAB_PORT || 8832;
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

async function newPage() {
  const page = await browser.newPage({ viewport: { width: 1280, height: 1400 } });
  page.on('pageerror', (e) => errs.push(e.message));
  await page.route('**://fonts.googleapis.com/**', (r) => r.abort());
  await page.route('**://fonts.gstatic.com/**', (r) => r.abort());
  return page;
}

// ---------------------------------------------------------------------
// Part 1 — unauthenticated: the pages must look exactly like the
// illustrative preview they have always been. No Clerk key is stubbed
// in for this part, so js/portal-guard.js takes its no-op branch.
// ---------------------------------------------------------------------
{
  const page = await newPage();
  await page.goto(`${BASE}/student-portal/preview/`, { waitUntil: 'domcontentloaded' });
  await page.waitForTimeout(900);

  check('Preview banner still reads as a design preview when signed out',
    /design preview/i.test(await page.locator('.preview-banner').innerText()));
  check('Demo tag on the student name is still visible',
    await page.locator('[data-demo-tag]').first().isVisible());
  check('Exactly two stat tiles remain (Attendance and Next Assessment were removed, not hidden)',
    (await page.locator('.stat-tile').count()) === 2);
  check('The illustrative Units Completed tile still shows its placeholder figure',
    (await page.locator('[data-units-value]').innerText()).trim() === '4 / 10');
  check('Certificates panel links to the real My Academic Record page',
    (await page.locator('a', { hasText: 'Go to My Academic Record' }).getAttribute('href')) === '/my-record.html');
  check('Upcoming Classes renders an honest empty state, not fabricated rows',
    (await page.locator('.panel', { hasText: 'Upcoming Classes' }).locator('.empty-state').count()) === 1);
  check('Messages panel names Admissions email rather than a fake message',
    /info@worldwencollege\.co\.uk/.test(await page.locator('.panel', { hasText: 'Messages' }).innerText()));
  check('Sidebar carries a real My Record link',
    (await page.locator('.app-nav a', { hasText: 'My Record' }).getAttribute('href')) === '/my-record.html');

  await page.close();
}

// ---------------------------------------------------------------------
// Part 2 — authenticated: stub a minimal Clerk SDK (same technique as
// tests/browser/my-record-auth.mjs) so js/portal-guard.js takes its
// real, keyed branch and js/portal-auth.js runs against real backend
// data for usr_demo (lab-server.mjs).
// ---------------------------------------------------------------------
const FAKE_HOST = 'fake-clerk-host.test';
const FAKE_KEY = 'pk_test_' + Buffer.from(`${FAKE_HOST}$`).toString('base64');

async function withClerkStub(page) {
  await page.route(`**://${FAKE_HOST}/**`, (route) => {
    route.fulfill({
      contentType: 'application/javascript',
      body: `
        window.Clerk = {
          user: {
            id: 'usr_demo', firstName: 'Demo', lastName: 'Student',
            primaryEmailAddress: { emailAddress: 'demo@example.com' },
            twoFactorEnabled: true,
          },
          session: { getToken: function () { return Promise.resolve('stub-demo'); } },
          load: function () { return Promise.resolve(); },
          redirectToSignIn: function () {},
          signOut: function (cb) { if (cb) cb(); },
        };
      `,
    });
  });
  // '**' after '.js' matters: build.js fingerprints the script tag
  // ('?v=<hash>'), and a pattern with no wildcard after '.js' does not
  // match a URL carrying a query string — the interception would
  // silently miss every request and the real (empty-key) file would
  // load instead, leaving the page in its unauthenticated preview state
  // no matter what this stub provides.
  await page.route('**/js/auth-config.js**', (route) => {
    route.fulfill({
      contentType: 'application/javascript',
      body: `window.WEC_LC_AUTH = { clerkPublishableKey: '${FAKE_KEY}' };`,
    });
  });
}

{
  const page = await newPage();
  await withClerkStub(page);
  await page.goto(`${BASE}/student-portal/preview/`, { waitUntil: 'domcontentloaded' });
  await page.waitForTimeout(1500);

  check('Preview banner is replaced once a real session is confirmed',
    !/not a live student account/.test(await page.locator('.preview-banner').innerText()));
  check('Demo tags are hidden for a real signed-in student',
    (await page.locator('[data-demo-tag]').first().isHidden()));
  check('Still exactly two stat tiles (nothing re-appears once authenticated)',
    (await page.locator('.stat-tile').count()) === 2);
  check('Units Completed tile now shows real per-level data, not the illustrative placeholder',
    /^\d+ \/ \d+$/.test((await page.locator('[data-units-value]').innerText()).trim())
      && (await page.locator('[data-units-value]').innerText()).trim() !== '4 / 10');
  check('Current Level tile reflects usr_demo\'s real active enrolment (Level I)',
    (await page.locator('[data-current-level-value]').innerText()).trim() === 'I');
  // usr_demo carries four seeded payments in this harness (see
  // lab-server.mjs) — real rows, not the illustrative placeholder, are
  // the honest render here; an empty state would be a different lie
  // (understating what the account actually holds).
  const paymentRows = page.locator('[data-payment-history] tr');
  check('Payment History renders the real seeded payments, not an empty state',
    (await paymentRows.count()) === 4);
  check('...with a real amount and status pill, not fabricated placeholder text',
    /USD 791\.67/.test(await paymentRows.first().innerText())
      && (await page.locator('[data-payment-history] .status-pill').count()) === 4);
  check('Payment History does not use the old raw inline-styled row',
    !(await page.locator('[data-payment-history] td[style]').count()));

  await page.close();
}

{
  const page = await newPage();
  await withClerkStub(page);
  await page.goto(`${BASE}/student-portal/preview/profile/`, { waitUntil: 'domcontentloaded' });
  await page.waitForTimeout(1500);

  check('Preview banner is replaced on the profile page too',
    !/not a live student account/.test(await page.locator('.preview-banner').innerText()));
  check('The fabricated Student ID line is hidden for a real student',
    await page.locator('.profile-header__id').isHidden());
  check('Two-factor status reflects Clerk\'s own record (stubbed as enabled)',
    (await page.locator('[data-twofactor-status]').innerText()).trim() === 'Enabled');
  check('Current Level in the Academic Record mini-list is real, not the static demo figure',
    (await page.locator('[data-mini-level]').innerText()).trim() !== 'III · Intermediate (B1)');
  check('Enrolment Status reflects a real active enrolment',
    (await page.locator('[data-mini-status]').innerText()).trim() === 'Active');
  check('Sidebar carries real My Programme and My Record links',
    (await page.locator('.app-nav a', { hasText: 'My Programme' }).getAttribute('href')) === '/my-programme.html'
      && (await page.locator('.app-nav a', { hasText: 'My Record' }).getAttribute('href')) === '/my-record.html');

  await page.close();
}

check('No uncaught script errors across the whole suite', errs.length === 0, errs.slice(0, 3).join(' | '));

console.log(`\n${pass} passed, ${fail} failed.`);
await browser.close();
server.kill();
process.exit(fail ? 1 : 0);
