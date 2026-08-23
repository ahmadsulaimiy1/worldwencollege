// Run with: node tests/browser/my-downloads.mjs
//
// MY FILES, in a real browser, against the real libraries.
//
// This page has one job and one temptation. The job is to answer "what
// has the College given me, and where is it". The temptation is to
// start answering the questions the four owning pages answer, at which
// point it becomes a second implementation of issuance and the two
// eventually disagree about what a transcript contains.
//
// So the checks are mostly about restraint:
//
//   · NOTHING IS ISSUED HERE. The page must contain no form and no
//     control that writes. Asserted by enumerating every form and
//     submit control in the shell, not by reading the source.
//
//   · EVERY SHELF POINTS SOMEWHERE. A shelf whose route did not
//     resolve would be worse than no shelf.
//
//   · AND EVERY EMPTY SHELF SAYS WHAT WOULD FILL IT. An empty shelf
//     with nothing under it reads as a page that failed to load, which
//     is the one impression a portal for somebody's academic record
//     must never give.
//
// The identity card carries its own risk, and it is the reverse: a card
// that looked like a licence would invite somebody to present it as
// one. The caveat is asserted as visible text.
import { chromium } from 'playwright';
import { spawn } from 'node:child_process';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const HERE = dirname(fileURLToPath(import.meta.url));
const PORT = process.env.LAB_PORT || 8855;
const BASE = `http://localhost:${PORT}`;

let pass = 0; let fail = 0;
const check = (label, cond, detail) => {
  console.log((cond ? 'PASS ' : 'FAIL ') + label + (cond || detail === undefined ? '' : ` — ${detail}`));
  cond ? pass++ : fail++;
};

const server = spawn(process.execPath, ['--experimental-sqlite', join(HERE, 'lab-server.mjs')], {
  env: { ...process.env, LAB_PORT: String(PORT) }, stdio: ['ignore', 'pipe', 'pipe'],
});
await new Promise((resolve, reject) => {
  const t = setTimeout(() => reject(new Error('server did not start')), 25000);
  server.stdout.on('data', (d) => { if (String(d).includes('ready')) { clearTimeout(t); resolve(); } });
  server.stderr.on('data', (d) => { if (!/ExperimentalWarning|trace-warnings/.test(String(d))) process.stderr.write(d); });
});

const ARABIC = /[؀-ۿ]/;
const browser = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium-1194/chrome-linux/chrome' });
const problems = [];

async function open(path, width = 1440) {
  const ctx = await browser.newContext({ viewport: { width, height: 900 } });
  const page = await ctx.newPage();
  const fonts = [];
  page.on('requestfailed', (r) => {
    if (/fonts\.(googleapis|gstatic)\.com/.test(r.url())) fonts.push(r.url());
    else problems.push(`${path}: request failed ${r.url()}`);
  });
  page.on('console', (m) => {
    if (m.type() !== 'error') return;
    if (/net::ERR_/.test(m.text()) && fonts.length) return;
    problems.push(`${path}: ${m.text()}`);
  });
  page.on('pageerror', (e) => problems.push(`${path}: PAGEERROR ${e.message}`));
  await page.goto(BASE + path, { waitUntil: 'networkidle' });
  await page.waitForTimeout(700);
  return { ctx, page };
}

const payload = await (await fetch(`${BASE}/api/student/downloads`)).json();

{
  const { ctx, page } = await open('/my-downloads.html');

  check('the state line is cleared once the page is drawn',
    (await page.textContent('#state') || '').trim() === '');

  // ── THE IDENTITY CARD ──────────────────────────────────────────
  check('the identity card is drawn once', (await page.$$('.dl-id')).length === 1);
  check('...carrying the name the College holds',
    (await page.textContent('.dl-id__name')).trim() === payload.identity.name,
    payload.identity.name);

  const caveat = (await page.textContent('.dl-id__caveat')).trim();
  check('...and saying in as many words that it is not a government document',
    /not a government identity document/.test(caveat), caveat);

  const statement = (await page.textContent('.dl-id__statement')).trim();
  check('...and carrying the published identity sentence, not a paraphrase',
    statement.includes('identity the College holds from admission'), statement.slice(0, 80));

  const source = await page.getAttribute('.dl-id__source a', 'href');
  check('...linked to the instrument that says it', source === payload.identity.source, source);

  const enrolments = await page.$$('.dl-enrolments li');
  check('every enrolment on the record is listed with its state',
    enrolments.length === payload.identity.enrolments.length,
    `${enrolments.length} vs ${payload.identity.enrolments.length}`);

  // ── THE SHELVES ────────────────────────────────────────────────
  const shelves = await page.$$('.dl-shelf');
  check('one shelf per kind of file the College gives',
    shelves.length === payload.shelves.length, String(shelves.length));

  const routes = await page.$$eval('.dl-shelf a.btn', (ns) => ns.map((n) => n.getAttribute('href')));
  check('every shelf points at the page that owns it',
    routes.length === payload.shelves.length
    && payload.shelves.every((s) => routes.includes(s.route)),
    JSON.stringify(routes));

  const light = await page.$$eval('.dl-shelf a.btn',
    (ns) => ns.every((n) => n.classList.contains('btn--outline')));
  check('...with the light-ground button, never the dark-ground one', light);

  // NOTHING IS ISSUED HERE. Enumerated rather than assumed.
  const writes = await page.evaluate(() => {
    const shell = document.querySelector('.stf-shell');
    return {
      forms: shell.querySelectorAll('form').length,
      submits: shell.querySelectorAll('button[type="submit"], input[type="submit"]').length,
      inputs: shell.querySelectorAll('input, textarea, select').length,
    };
  });
  check('nothing on this page can write: no form, no submit, no field',
    writes.forms === 0 && writes.submits === 0 && writes.inputs === 0,
    JSON.stringify(writes));

  // AN EMPTY SHELF SAYS WHAT WOULD FILL IT.
  const empties = await page.evaluate(() => Array.from(document.querySelectorAll('.dl-shelf'))
    .filter((s) => /Nothing yet/.test(s.textContent))
    .map((s) => (s.querySelector('.dl-shelf__note') || {}).textContent || ''));
  check('every empty shelf carries a sentence saying what would fill it',
    empties.length > 0 && empties.every((t) => t.trim().length > 20),
    JSON.stringify(empties));

  // The finance shelf tells invoices and receipts apart rather than
  // printing a payment id in a column headed "receipt".
  const finance = payload.shelves.find((s) => s.id === 'finance');
  if (finance && finance.count) {
    const withCode = finance.items.filter((i) => i.code).length;
    check('receipts are counted only where a receipt number exists',
      finance.receipts === withCode, `${finance.receipts} vs ${withCode}`);
  }

  for (const w of [1440, 900, 390]) {
    await page.setViewportSize({ width: w, height: 900 });
    await page.waitForTimeout(200);
    const over = await page.evaluate(() => document.documentElement.scrollWidth > window.innerWidth + 1);
    check(`ltr ${w}: no horizontal overflow`, !over);
  }
  await ctx.close();
}

{
  const { ctx, page } = await open('/ar/my-downloads.html');
  check('the Arabic edition renders right to left',
    (await page.getAttribute('html', 'dir')) === 'rtl');
  const caveat = (await page.textContent('.dl-id__caveat')).trim();
  check('...with the caveat in Arabic, not the English fallback',
    ARABIC.test(caveat) && !/not a government identity document/.test(caveat), caveat.slice(0, 60));
  const shelfTitles = await page.$$eval('.dl-shelf h3', (ns) => ns.map((n) => n.textContent.trim()));
  check('...and the shelf names in Arabic',
    shelfTitles.every((t) => ARABIC.test(t)), JSON.stringify(shelfTitles));

  for (const w of [1440, 390]) {
    await page.setViewportSize({ width: w, height: 900 });
    await page.waitForTimeout(200);
    const over = await page.evaluate(() => document.documentElement.scrollWidth > window.innerWidth + 1);
    check(`rtl ${w}: no horizontal overflow`, !over);
  }
  await ctx.close();
}

check('no console errors or page errors anywhere',
  problems.length === 0, problems.slice(0, 4).join(' | '));

await browser.close();
server.kill();
console.log(`\n${pass} passed, ${fail} failed.`);
process.exit(fail ? 1 : 0);
