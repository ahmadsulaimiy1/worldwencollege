// Run with: node tests/browser/my-record-auth.mjs
//
// The bug this file exists to prove is fixed: my-record.js used to mint
// ONE Clerk session token at page load and reuse it for every request
// for the rest of the visit. Clerk session tokens are short-lived (about
// a minute) — js/api-auth.js exists specifically so a page mints a fresh
// token PER REQUEST instead. No existing browser test exercises the
// "keyed" path at all (every other suite runs in the shipped
// no-Clerk-key harness, where the guard is a no-op and no token is ever
// sent) — this is the first one that does, by faking a minimal Clerk SDK
// in the page rather than trying to reach the real Clerk service.
import { chromium } from 'playwright';
import { spawn } from 'node:child_process';
import { existsSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const HERE = dirname(fileURLToPath(import.meta.url));
const PORT = process.env.LAB_PORT || 8831;
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

const page = await browser.newPage({ viewport: { width: 1280, height: 1000 } });
page.on('pageerror', (e) => errs.push(e.message));
await page.route('**://fonts.googleapis.com/**', (r) => r.abort());
await page.route('**://fonts.gstatic.com/**', (r) => r.abort());

// A minimal Clerk stub — just enough of the real SDK's shape for
// js/clerk-loader.js, js/portal-guard.js and js/api-auth.js to run their
// real code paths against. Each getToken() call returns a NEW value, so
// a test that captures two calls' worth of outgoing Authorization
// headers and finds them identical has caught the exact regression this
// file is for.
await page.route(`**://${FAKE_HOST}/**`, (route) => {
  route.fulfill({
    contentType: 'application/javascript',
    body: `
      window.Clerk = {
        user: { id: 'usr_demo', firstName: 'Demo' },
        session: {
          _n: 0,
          getToken: function () { this._n += 1; return Promise.resolve('tok_' + this._n + '_' + Date.now()); }
        },
        load: function () { return Promise.resolve(); },
        redirectToSignIn: function () {},
        signOut: function (cb) { if (cb) cb(); },
      };
    `,
  });
});

// js/auth-config.js sets window.WEC_LC_AUTH unconditionally, so an
// addInitScript assignment would just get clobbered the moment that
// script tag loads — intercept the request itself instead, so
// js/portal-guard.js sees a real key and takes the authenticated branch
// instead of the no-op one every other suite exercises.
//
// The trailing '**' matters: build.js fingerprints every script tag
// ('/js/auth-config.js?v=<hash>'), and a pattern ending in '.js' with
// no wildcard after it does not match a URL with a query string —
// the interception silently missed every request, the real (empty-key)
// file loaded instead, and the whole "keyed" path this file exists to
// exercise never actually ran.
await page.route('**/js/auth-config.js**', (route) => {
  route.fulfill({
    contentType: 'application/javascript',
    body: `window.WEC_LC_AUTH = { clerkPublishableKey: '${FAKE_KEY}' };`,
  });
});

const authHeaders = [];
await page.route('**/api/student/**', (route) => {
  const h = route.request().headers()['authorization'];
  if (h) authHeaders.push(h);
  route.continue();
});

await page.goto(`${BASE}/my-record.html`, { waitUntil: 'domcontentloaded' });
await page.waitForTimeout(1200);

check('The keyed path actually ran (the auth gate engaged and cleared)',
  (await page.locator('#secRecord').isVisible()) === true);

check('At least two authenticated requests were captured (profile, then shares/documents)',
  authHeaders.length >= 2, `captured ${authHeaders.length}`);

const unique = new Set(authHeaders);
check('Every request carried a FRESH token — none reused',
  unique.size === authHeaders.length,
  `${authHeaders.length} requests, only ${unique.size} distinct tokens: ${authHeaders.join(' | ')}`);

check('No uncaught script errors', errs.length === 0, errs.slice(0, 2).join(' | '));

console.log(`\n${pass} passed, ${fail} failed.`);
await browser.close();
server.kill();
process.exit(fail ? 1 : 0);
