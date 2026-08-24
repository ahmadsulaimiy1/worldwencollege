// Run with: node tests/browser/admissions-wizard.mjs
//
// The consolidated Admissions experience, in a real browser: the
// pillar page's entry card + status-lookup card, and the application
// wizard's shell. lab-server.mjs doesn't wire up functions/api/
// admissions/*.js (only LMS/admin/registry are shimmed there), so this
// can't drive a full authenticated walk through all five stages —
// tests/admissions-wizard.test.mjs already covers the backend directly
// and thoroughly. What THIS file is for: proving the actual served
// HTML/CSS/JS for the redesigned pages loads cleanly, with no console
// errors, no 404'd stylesheet, and the new components (floating
// labels, the interactive stepper, the status-lookup form, the
// no-Clerk-key gate) render and behave as built.
import { chromium } from 'playwright';
import { spawn } from 'node:child_process';
import { existsSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const HERE = dirname(fileURLToPath(import.meta.url));
const PORT = process.env.LAB_PORT || 8827;
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

async function open(url) {
  const page = await browser.newPage({ viewport: { width: 1280, height: 1000 } });
  await page.route('**://fonts.googleapis.com/**', (r) => r.abort());
  await page.route('**://fonts.gstatic.com/**', (r) => r.abort());
  const errs = [];
  const failed404s = [];
  page.on('pageerror', (e) => errs.push(e.message));
  page.on('response', (r) => { if (r.status() === 404 && (r.url().endsWith('.css') || r.url().endsWith('.js'))) failed404s.push(r.url()); });
  await page.goto(url, { waitUntil: 'networkidle' });
  await page.waitForTimeout(400);
  return { page, errs, failed404s };
}

// A real fixture row, inserted the same way any other browser test in
// this harness seeds its own demo data (see verify.mjs's use of
// /__demo-awards) — exercises the actual /api/admissions/status
// success path, not just its 404.
await fetch(`${BASE}/__seed-application`, { method: 'POST' });

// --- Pillar page: the retired form's replacement ----------------------
{
  const { page, errs, failed404s } = await open(`${BASE}/admissions/`);

  check('No console/page errors on the pillar page', errs.length === 0, errs.join('; '));
  check('No 404 stylesheet/script (confirms dashboard.css is actually wired via extraCss)', failed404s.length === 0, failed404s.join(', '));

  const oldForm = await page.locator('[data-admissions-form]').count();
  check('The old 3-field embedded form is gone', oldForm === 0);

  const entryCta = page.locator('a[href="/admissions/apply/"].btn--gold').first();
  check('The entry card\'s "Start Your Application" CTA is present and points at the wizard',
    (await entryCta.count()) > 0 && (await entryCta.getAttribute('href')) === '/admissions/apply/');

  const applyAnchorSection = await page.locator('#apply').count();
  check('The #apply anchor itself survives (footer/homepage CTAs deep-link here)', applyAnchorSection === 1);

  // Status-lookup card
  const lookupForm = page.locator('[data-status-lookup-form]');
  check('The status-lookup form is present', (await lookupForm.count()) === 1);
  await page.fill('#status-id', 'app_does_not_exist');
  await page.locator('[data-status-lookup-btn]').click();
  await page.waitForTimeout(500);
  const errorText = (await page.textContent('[data-status-lookup-error]') || '').trim();
  check('Looking up a bogus id shows the endpoint\'s own honest 404 text, not a generic error',
    /No application found/i.test(errorText), errorText);

  // A real, existing application id — the success path.
  await page.fill('#status-id', 'app_browser_test_fixture');
  await page.locator('[data-status-lookup-btn]').click();
  await page.waitForTimeout(500);
  const pillText = (await page.textContent('[data-status-pill]') || '').trim();
  const pillClass = await page.getAttribute('[data-status-pill]', 'class');
  check('A real application id resolves to its actual status', pillText === 'submitted', pillText);
  check('...styled with the correct semantic status-pill variant', pillClass === 'status-pill status-pill--progress', pillClass);
  const createdText = (await page.textContent('[data-status-lookup-created]') || '').trim();
  check('...and shows the real creation date, not a placeholder', /^Submitted /.test(createdText) && !/Invalid Date/.test(createdText), createdText);

  await page.close();
}

// --- Wizard shell: no Clerk key configured in this checkout ------------
{
  const { page, errs, failed404s } = await open(`${BASE}/admissions/apply/`);

  check('No console/page errors on the wizard page', errs.length === 0, errs.join('; '));
  check('No 404 stylesheet/script (confirms the listening-lab.css dependency was actually dropped)',
    failed404s.length === 0, failed404s.join(', '));
  check('listening-lab.css is not requested at all any more',
    !failed404s.concat(await page.evaluate(() => Array.from(document.querySelectorAll('link[rel=stylesheet]')).map((l) => l.href))).some((u) => /listening-lab\.css/.test(u)));

  const bodyClass = await page.evaluate(() => document.body.className);
  check('The shell uses the new .apply-shell class, not the borrowed .lab', bodyClass === 'apply-shell');

  // No Clerk publishable key is configured in this checkout (js/auth-config.js
  // ships empty by design), so the honest "sign-in not switched on" state
  // is what a real visitor to this exact build would see.
  await page.waitForTimeout(300);
  const unavailableVisible = await page.locator('[data-wizard-unavailable]').isVisible();
  check('With no Clerk key, the honest "sign-in not switched on" notice shows (not a blank/broken page)', unavailableVisible);

  await page.close();
}

await browser.close();
server.kill();

console.log(`\n${fail ? fail + ' FAILED' : 'All admissions-wizard browser checks passed'} (${pass} passed, ${fail} failed)`);
process.exit(fail ? 1 : 0);
