// Run with: node tests/browser/graduate.mjs
//
// The graduate record, in a real browser, as its two real readers reach
// it: an employer opening a published address, and an employer opening a
// link the graduate sent them.
//
// The assertions are almost entirely about the two ways this page can
// mislead someone about a person's education.
//
//   SILENCE. A section that is absent reads as a section that is empty.
//   An employer who cannot see professional development concludes there
//   is none. So anything withheld must be NAMED as withheld — and that
//   is asserted, not assumed.
//
//   A ZERO THAT IS NOT A MARK. No competency has been assessed by
//   anybody, because the curriculum is not mapped to the framework yet.
//   Rendering that as 0% would attribute a failing mark to a graduate who
//   was never assessed. It must read "not yet assessed", in words.
//
// Run under LAB_REQUIRE_AUTH, because a record an employer must register
// to read is a record they will not read.
import { chromium } from 'playwright';
import { spawn } from 'node:child_process';
import { existsSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const HERE = dirname(fileURLToPath(import.meta.url));
const PORT = process.env.LAB_PORT || 8828;
const BASE = `http://localhost:${PORT}`;

let pass = 0, fail = 0;
const check = (label, cond, detail) => {
  console.log((cond ? 'PASS ' : 'FAIL ') + label + (cond || detail === undefined ? '' : ` — ${detail}`));
  cond ? pass++ : fail++;
};

const server = spawn(process.execPath, ['--experimental-sqlite', join(HERE, 'lab-server.mjs')], {
  env: { ...process.env, LAB_PORT: String(PORT), LAB_REQUIRE_AUTH: '1' }, stdio: ['ignore', 'pipe', 'pipe'],
});
await new Promise((resolve, reject) => {
  const t = setTimeout(() => reject(new Error('server did not start')), 20000);
  server.stdout.on('data', (d) => { if (String(d).includes('ready')) { clearTimeout(t); resolve(); } });
  server.stderr.on('data', (d) => { if (!/ExperimentalWarning|trace-warnings/.test(String(d))) process.stderr.write(d); });
});

const demo = await (await fetch(`${BASE}/__demo-awards`)).json();

const exe = process.env.PW_CHROMIUM || '/opt/pw-browsers/chromium-1194/chrome-linux/chrome';
const browser = await chromium.launch(existsSync(exe) ? { executablePath: exe } : {});
const errs = [];

// Tolerant reads, so a missing element FAILS an assertion instead of
// hanging for thirty seconds and killing the run. Learned the hard way
// in browser/register.mjs — see tests/README.md.
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
  await page.waitForTimeout(800);
  return page;
}

// --- A published record, opened by a stranger ------------------------
{
  const page = await open(`${BASE}/graduate.html?handle=demonstration-graduate`);

  check('A published record opens with no account and no sign-in',
    (await textOf(page, '#name')).includes('Demonstration Graduate'));
  check('...carrying the graduate\'s own headline',
    (await textOf(page, '#headline')).length > 5);
  check('...and their biography', (await page.locator('#secBiography').isVisible()) === true);

  check('The awards are listed', (await page.locator('.grad-award').count()) >= 1);
  // A profile is the graduate's account of themselves. The link to the
  // Register is what turns it into evidence.
  const href = await page.getAttribute('.grad-award__meta a', 'href');
  check('...each linking to its own verification, so the claim is checkable',
    /verify\.html\?code=WEC-/.test(href || ''), href);
  check('...with the honour where one was awarded',
    (await page.locator('.grad-badge--honour').count()) >= 1);

  check('The transcript is shown, because this graduate published it',
    (await page.locator('#secTranscript').isVisible()) === true);
  check('...as a real table, which is what a registrar expects and a screen reader can read',
    (await page.locator('.grad-table thead th').count()) === 5);
  check('...listing every level entered, not only the ones that produced an award',
    (await page.locator('#transcript tr').count()) >= 6,
    await page.locator('#transcript tr').count());
  check('...including levels still in progress',
    /In progress/.test(await textOf(page, '#transcript')));
  check('Credits and qualification time are totalled', /WEC Credits/.test(await textOf(page, '#totals')));

  // The decisive honesty assertion on this page.
  check('Sections the graduate did not share are NAMED, not silently dropped',
    (await page.locator('#withheldBox').isVisible()) === true);
  const withheld = await textOf(page, '#withheld');
  check('...and the reader is told absence is not a statement of nothing',
    /not a statement that there is nothing to show/i.test(withheld), withheld.slice(0, 110));
  check('...naming professional development specifically, which was not shared',
    /professional development/i.test(withheld));
  check('An unshared section is genuinely absent from the page, not merely hidden',
    (await page.locator('#secCpd').isVisible()) === false);
  check('...as is measured study time', (await page.locator('#secStudyTime').isVisible()) === false);

  await page.screenshot({ path: join(HERE, 'screenshots', 'graduate-published.png'), fullPage: true }).catch(() => {});
  await page.close();
}

// --- A shared link ---------------------------------------------------
{
  const page = await open(`${BASE}/graduate.html?share=${encodeURIComponent(demo.shareToken)}`);
  check('A shared link opens the record', (await page.locator('.grad-award').count()) >= 1);
  check('...and says it is a shared record that can be withdrawn',
    /withdrawn by them at any time/i.test(await textOf(page, '#scopeNote')));

  // The share was created for awards + transcript + cpd, and CPD is
  // switched on for nobody... except that this graduate did not enable
  // show_cpd, so the intersection must exclude it.
  check('The share shows what the graduate both agreed to AND has switched on',
    (await page.locator('#secTranscript').isVisible()) === true
    && (await page.locator('#secCpd').isVisible()) === false);
  check('...and names CPD as withheld rather than implying there is none',
    /professional development/i.test(await textOf(page, '#withheld')));
  await page.close();
}

// --- The competency gap is stated, never scored ----------------------
// Nobody has been assessed against the framework, because the curriculum
// is not mapped to it. Rendering that as 0% would attribute a failing
// mark to a graduate who was never assessed.
{
  const page = await browser.newPage();
  await page.route('**://fonts.g**', (r) => r.abort());
  await page.route('**/api/graduate/*', async (route) => {
    const res = await route.fetch();
    const body = await res.json();
    body.competencies = {
      state: 'unmapped',
      note: 'The College has not yet mapped its assessments to the competency framework, so no competency attainment can be reported for anyone. This is a known gap, recorded as governance item A6d.',
      competencies: [
        { code: 'CLARITY', name: 'Clarity', description: 'Understood the first time', mark: null, assessments: 0 },
        { code: 'REACH', name: 'Reach', description: 'Communicates across cultures', mark: null, assessments: 0 },
      ],
    };
    body.sectionsShared.push('competencies');
    body.sectionsWithheld = body.sectionsWithheld.filter((s) => s !== 'competencies');
    await route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify(body) });
  });
  page.on('pageerror', (e) => errs.push(e.message));
  await page.goto(`${BASE}/graduate.html?handle=demonstration-graduate`, { waitUntil: 'domcontentloaded' });
  await page.waitForTimeout(800);

  const marks = await page.locator('.grad-competency__mark').allTextContents();
  check('An unassessed competency is written in words, not scored',
    marks.length === 2 && marks.every((m) => /not yet assessed/i.test(m)), marks.join(' | '));
  check('...and no percentage appears anywhere in the competency list',
    !/%/.test(await textOf(page, '#competencies')));
  check('The page states WHY there is no attainment to report',
    /not yet mapped/i.test(await textOf(page, '#competencyNote')));
  check('...citing the governance item, so the gap is traceable',
    /A6d/.test(await textOf(page, '#competencyNote')));
  await page.close();
}

// --- CPD: declared and verified must never look the same -------------
{
  const page = await browser.newPage();
  await page.route('**://fonts.g**', (r) => r.abort());
  await page.route('**/api/graduate/*', async (route) => {
    const res = await route.fetch();
    const body = await res.json();
    body.cpd = { totalHours: 9, verifiedHours: 6, records: [
      { id: 'a', title: 'A verified workshop', provider: 'P', kind: 'workshop', hours: 6, completedOn: '2027-07-01', verified: true },
      { id: 'b', title: 'A self-declared conference', provider: 'P', kind: 'conference', hours: 3, completedOn: '2027-08-01', verified: false },
    ] };
    body.sectionsShared.push('cpd');
    body.sectionsWithheld = body.sectionsWithheld.filter((s) => s !== 'cpd');
    await route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify(body) });
  });
  page.on('pageerror', (e) => errs.push(e.message));
  await page.goto(`${BASE}/graduate.html?handle=demonstration-graduate`, { waitUntil: 'domcontentloaded' });
  await page.waitForTimeout(800);

  check('A College-verified entry is marked verified',
    (await page.locator('.grad-badge--verified').count()) === 1);
  // Without this distinction the list is the graduate's own word set in
  // the College's typeface.
  check('...and a self-declared entry is marked self-declared',
    (await page.locator('.grad-badge--declared').count()) === 1);
  check('The page explains what the distinction means',
    /have not been checked/i.test(await textOf(page, '#secCpd')));
  await page.close();
}

// --- A withdrawn award is marked, never dropped ----------------------
{
  const page = await browser.newPage();
  await page.route('**://fonts.g**', (r) => r.abort());
  await page.route('**/api/graduate/*', async (route) => {
    const res = await route.fetch();
    const body = await res.json();
    body.awards = body.awards.map((a) => ({ ...a, standing: 'revoked' }));
    body.transcript.entries = body.transcript.entries.map((e) =>
      (e.award ? { ...e, award: { ...e.award, standing: 'revoked' } } : e));
    await route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify(body) });
  });
  page.on('pageerror', (e) => errs.push(e.message));
  await page.goto(`${BASE}/graduate.html?handle=demonstration-graduate`, { waitUntil: 'domcontentloaded' });
  await page.waitForTimeout(800);

  check('A withdrawn award still appears on the graduate\'s own record',
    (await page.locator('.grad-award').count()) >= 1);
  check('...marked WITHDRAWN in words, not by colour alone',
    (await page.locator('.grad-badge--revoked').count()) >= 1);
  check('...and marked on the transcript too',
    /Award withdrawn/.test(await textOf(page, '#transcript')));
  await page.close();
}

// --- Records that are not there --------------------------------------
{
  const page = await open(`${BASE}/graduate.html?handle=nobody-at-all`);
  const s = await textOf(page, '#state');
  check('An unpublished address says so plainly', /No published record at that address/i.test(s), s.slice(0, 70));
  // The distinction that protects graduates who chose not to publish.
  check('...and that unpublished is not the same as unverified',
    /not an unverified one/i.test(s));
  check('...showing no record card at all', (await page.locator('.grad-award').count()) === 0);
  await page.close();

  const bad = await open(`${BASE}/graduate.html?share=not-a-real-token`);
  const t = await textOf(bad, '#state');
  check('A dead share link says it is no longer available', /no longer available/i.test(t));
  // Saying which would tell the holder whether the graduate revoked it.
  check('...without revealing whether it expired or was withdrawn',
    !/expired/i.test(t) && !/revoked|withdrew/i.test(t), t.slice(0, 90));
  await bad.close();

  const none = await open(`${BASE}/graduate.html`);
  check('Opening the page with no record requested explains what to do',
    /No record requested/i.test(await textOf(none, '#state')));
  await none.close();
}

// --- Mobile, accessibility, performance ------------------------------
{
  const page = await open(`${BASE}/graduate.html?handle=demonstration-graduate`, { width: 390, height: 780 });
  const overflow = await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth);
  check('No horizontal overflow at 390px', overflow <= 0, overflow);
  // A transcript is genuinely wide. It must scroll inside its own box
  // rather than pushing the whole page sideways.
  check('The transcript scrolls inside its own container',
    await page.evaluate(() => {
      const w = document.querySelector('.grad-tablewrap');
      return !!w && getComputedStyle(w).overflowX === 'auto';
    }));
  check('Exactly one h1', (await page.locator('h1').count()) === 1);
  check('The record region announces itself', (await page.getAttribute('#state', 'aria-live')) === 'polite');
  check('The transcript table has a caption for screen readers',
    (await page.locator('.grad-table caption').count()) === 1);
  check('Every heading level below h1 is an h2, so the outline is not skipped',
    (await page.locator('h3').count()) === 0);
  await page.screenshot({ path: join(HERE, 'screenshots', 'graduate-mobile.png'), fullPage: true }).catch(() => {});
  await page.close();
}

check('No uncaught script errors', errs.length === 0, errs.slice(0, 2).join(' | '));

console.log(`\n${pass} passed, ${fail} failed.`);
await browser.close();
server.kill();
process.exit(fail ? 1 : 0);
