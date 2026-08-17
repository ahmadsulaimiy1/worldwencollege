// Run with: node tests/browser/lab-auth.mjs
//
// The auth-contract test for the Listening Lab and the instructor
// review workspace.
//
// WHY THIS FILE EXISTS. tests/browser/listening-lab.mjs passed 40
// assertions against pages that could not have worked in production for
// a single request: neither page sent an `Authorization` header, and
// every endpoint they call is behind requireUser(). The suite could not
// see it, because lab-server.mjs hard-coded `userId: 'usr_demo'` and
// never looked at the request's headers. The tests measured the page's
// behaviour faithfully — against a server with a hole in it exactly
// where production has a check.
//
// So this file tests the boundary the other one assumes: the harness
// runs with LAB_REQUIRE_AUTH=1, which 401s any /api/ request without a
// Bearer token, and the assertions below are about the header rather
// than about what the page renders.
//
// The token is a stub. Verifying a real Clerk JWT needs a real Clerk
// instance and remains untested from here — see tests/README.md.
import { chromium } from 'playwright';
import { spawn } from 'node:child_process';
import { existsSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const HERE = dirname(fileURLToPath(import.meta.url));
const PORT = process.env.LAB_PORT || 8816;
const BASE = `http://localhost:${PORT}`;

let pass = 0, fail = 0;
const check = (label, cond, detail) => {
  console.log((cond ? 'PASS ' : 'FAIL ') + label + (cond || detail === undefined ? '' : ` — ${detail}`));
  cond ? pass++ : fail++;
};

const server = spawn(process.execPath, ['--experimental-sqlite', join(HERE, 'lab-server.mjs')], {
  env: { ...process.env, LAB_PORT: String(PORT), LAB_REQUIRE_AUTH: '1' },
  stdio: ['ignore', 'pipe', 'pipe'],
});
await new Promise((resolve, reject) => {
  const t = setTimeout(() => reject(new Error('server did not start')), 20000);
  server.stdout.on('data', (d) => { if (String(d).includes('ready')) { clearTimeout(t); resolve(); } });
  server.stderr.on('data', (d) => { if (!/ExperimentalWarning|trace-warnings/.test(String(d))) process.stderr.write(d); });
});

const exe = process.env.PW_CHROMIUM || '/opt/pw-browsers/chromium-1194/chrome-linux/chrome';
const browser = await chromium.launch(existsSync(exe) ? { executablePath: exe } : {});
const FONTS = /fonts\.(googleapis|gstatic)\.com/;

// A stubbed Clerk, injected by replacing the two files the auth chain
// loads before anything else runs. Route interception rather than
// addInitScript because auth-config.js would otherwise overwrite
// whatever we set on window.
function stubAuth(page, who) {
  const js = (body) => (route) => route.fulfill({ contentType: 'text/javascript', body });
  return Promise.all([
    page.route('**/js/auth-config.js', js('window.AIPC_AUTH={clerkPublishableKey:"pk_test_stub"};')),
    page.route('**/js/clerk-loader.js', js(`
      window.AIPC_loadClerk = function (pk, done) {
        var n = 0;
        done(null, {
          user: { id: 'user_${who}', firstName: 'Stub', lastName: 'User',
                  primaryEmailAddress: { emailAddress: '${who}@example.com' } },
          // A counter suffix per call, so the test can tell a token
          // minted per request from one captured at page load.
          session: { getToken: function () { n += 1; return Promise.resolve('stub-${who}#' + n); } },
          signOut: function (cb) { cb && cb(); },
          openUserProfile: function () {},
          redirectToSignIn: function () {}
        });
      };
    `)),
  ]);
}

// Records the Authorization header of every /api/ request a page makes.
function watchApi(page) {
  const seen = [];
  page.on('request', (r) => {
    const u = new URL(r.url());
    if (u.pathname.startsWith('/api/')) {
      seen.push({ path: u.pathname, auth: r.headers()['authorization'] || null });
    }
  });
  return seen;
}

// ---------------------------------------------------------------------
// 1. The shipped state — no Clerk key — against endpoints that require
//    one. This is what a Cloudflare deployment without CLERK_JWKS_URL
//    looks like, and it must degrade to a clear message rather than a
//    blank page or a crash.
// ---------------------------------------------------------------------
{
  const ctx = await browser.newContext({ viewport: { width: 1280, height: 900 }, serviceWorkers: 'block' });
  const page = await ctx.newPage();
  const errs = [];
  page.on('pageerror', (e) => errs.push(e.message));
  page.on('requestfailed', (r) => { if (!FONTS.test(r.url())) errs.push('request failed: ' + r.url()); });
  await page.route('**://fonts.googleapis.com/**', (r) => r.abort());
  await page.route('**://fonts.gstatic.com/**', (r) => r.abort());

  await page.goto(`${BASE}/listening-lab.html?unit=unt_l1_m1&level=1`, { waitUntil: 'domcontentloaded' });
  await page.waitForTimeout(900);
  const msg = (await page.textContent('#labError')) || '';
  check('No key configured: the Lab says to sign in rather than showing a blank page',
    /sign in/i.test(msg), `#labError was "${msg.trim()}"`);
  check('No key configured: no uncaught script errors', errs.length === 0, errs.slice(0, 2).join(' | '));
  await ctx.close();
}

// ---------------------------------------------------------------------
// 2. A real session — the Lab must attach a token to every call, and a
//    freshly minted one each time.
// ---------------------------------------------------------------------
{
  const ctx = await browser.newContext({ viewport: { width: 1280, height: 900 }, serviceWorkers: 'block' });
  const page = await ctx.newPage();
  await page.route('**://fonts.googleapis.com/**', (r) => r.abort());
  await page.route('**://fonts.gstatic.com/**', (r) => r.abort());
  await stubAuth(page, 'demo');
  const api = watchApi(page);
  const errs = [];
  page.on('pageerror', (e) => errs.push(e.message));

  await page.goto(`${BASE}/listening-lab.html?unit=unt_l1_m1&level=1`, { waitUntil: 'domcontentloaded' });
  await page.waitForSelector('body.is-ready', { timeout: 12000 }).catch(() => {});
  await page.waitForTimeout(600);

  const cues = await page.locator('#cues .cue').count();
  check('Signed in: the Lab loads real content through the authenticated endpoint', cues > 0, `${cues} cues`);
  check('Signed in: no uncaught script errors', errs.length === 0, errs.slice(0, 2).join(' | '));

  const unauthed = api.filter((r) => !r.auth);
  check(`Every /api/ request carries an Authorization header (${api.length} requests)`,
    api.length > 0 && unauthed.length === 0, unauthed.map((r) => r.path).join(', '));
  check('The header is a Bearer token for the signed-in user',
    api.every((r) => /^Bearer stub-demo#\d+$/.test(r.auth || '')), api[0] && api[0].auth);

  // The freshness guarantee. Clerk tokens expire in about a minute; the
  // Lab is a page a learner stays on far longer than that. A token
  // captured once at boot passes a page-load test and then 401s for the
  // rest of the session — so assert the token is re-minted per request.
  const tokens = new Set(api.map((r) => r.auth));
  check('Tokens are minted per request, not captured once at page load',
    tokens.size >= 2, `${tokens.size} distinct token(s) across ${api.length} requests`);

  // A mutation, not just reads: submitting comprehension answers.
  const before = api.length;
  // The submit button refuses a partial paper, so answer every question.
  await page.evaluate(() => {
    document.querySelectorAll('#questions .q').forEach((q) => {
      const first = q.querySelector('input[type=radio]');
      if (first) first.checked = true;
    });
  });
  await page.locator('#submitQuiz').click();
  await page.waitForTimeout(1000);
  const submissions = api.slice(before).filter((r) => r.path === '/api/lms/quiz-attempt');
  check('The comprehension submission carries a token too',
    submissions.length > 0 && submissions.every((r) => /^Bearer stub-demo#\d+$/.test(r.auth || '')),
    `${submissions.length} submission request(s)`);
  const graded = (await page.textContent('#quizResult')) || '';
  check('The submission is graded server-side rather than rejected', /%|correct/i.test(graded), graded.trim());
  await ctx.close();
}

// ---------------------------------------------------------------------
// 3. The instructor workspace — same contract, staff identity.
// ---------------------------------------------------------------------
{
  const ctx = await browser.newContext({ viewport: { width: 1280, height: 900 }, serviceWorkers: 'block' });
  const page = await ctx.newPage();
  await page.route('**://fonts.googleapis.com/**', (r) => r.abort());
  await page.route('**://fonts.gstatic.com/**', (r) => r.abort());
  await stubAuth(page, 'tutor');
  const api = watchApi(page);
  await page.goto(`${BASE}/instructor-review.html`, { waitUntil: 'domcontentloaded' });
  await page.waitForTimeout(1200);

  const queueCalls = api.filter((r) => r.path === '/api/lms/review-queue');
  check('The instructor workspace authenticates its queue request',
    queueCalls.length > 0 && queueCalls.every((r) => /^Bearer stub-tutor#\d+$/.test(r.auth || '')),
    `${queueCalls.length} queue request(s), auth ${queueCalls[0] && queueCalls[0].auth}`);
  const err = (await page.textContent('#qError')) || '';
  check('…and gets a queue rather than an auth error', err.trim() === '', err.trim());
  await ctx.close();
}

// ---------------------------------------------------------------------
// 4. Offline cache scoping. The Cache API keys on URL and ignores
//    headers, so /api/lms/unit?id=X is ONE entry regardless of who
//    asked — and that response carries the asker's own recordings and
//    attempt history. On a shared machine an unscoped cache hands the
//    next learner the previous one's work.
// ---------------------------------------------------------------------
{
  const ctx = await browser.newContext({ viewport: { width: 1280, height: 900 } });
  const page = await ctx.newPage();
  await page.route('**://fonts.googleapis.com/**', (r) => r.abort());
  await page.route('**://fonts.gstatic.com/**', (r) => r.abort());
  await stubAuth(page, 'demo');
  const url = `${BASE}/listening-lab.html?unit=unt_l1_m1&level=1`;

  // First load registers the worker; it isn't controlling this page yet,
  // so nothing is cached. The reload is the load that exercises it.
  await page.goto(url, { waitUntil: 'load' });
  await page.evaluate(() => navigator.serviceWorker.ready).catch(() => {});
  await page.waitForTimeout(500);
  await page.reload({ waitUntil: 'load' });
  await page.waitForTimeout(1800);

  const keys = await page.evaluate(() => caches.keys());
  const curriculum = keys.filter((k) => k.includes('-curriculum'));
  check('Cached learner content is namespaced to the signed-in user',
    curriculum.some((k) => k.endsWith('-curriculum-user_demo')), keys.join(', ') || '(no caches)');
  check('No unscoped curriculum cache is written while signed in',
    !keys.some((k) => /-curriculum$/.test(k)), keys.join(', '));

  // Signing out has to take the cached work with it. Requires a cache
  // to have existed first — otherwise "nothing left behind" is
  // vacuously true and the assertion would survive the scoping being
  // removed entirely.
  const hadUserCache = curriculum.some((k) => k.endsWith('-curriculum-user_demo'));
  await page.evaluate(() => window.AIPC_apiAuth.attach(null));
  await page.waitForTimeout(900);
  const after = await page.evaluate(() => caches.keys());
  check('Signing out drops the learner caches from the device',
    hadUserCache && !after.some((k) => k.includes('-curriculum-')),
    hadUserCache ? after.join(', ') : 'no learner cache existed to drop');
  await ctx.close();
}

console.log(`\n${pass} passed, ${fail} failed.`);
await browser.close();
server.kill();
process.exit(fail ? 1 : 0);
