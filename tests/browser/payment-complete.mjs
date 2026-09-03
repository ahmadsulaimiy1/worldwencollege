// Run with: node tests/browser/payment-complete.mjs
//
// THE JOURNEY A LEARNER MAKES WITH THEIR MONEY, end to end, in a real
// browser: choose a level on the statement of account, go out to the
// gateway, come back, and end up enrolled.
//
// This suite exists because the half of it nobody could find by reading
// the pages was broken for as long as the platform has had a checkout.
// `create-checkout.js` has always handed every gateway a successUrl of
// /student-portal/payment-complete/, and that route did not exist —
// so a learner who paid was returned from their bank to a 404, and the
// enrolment that page is supposed to ask for was never asked for.
//
// The harness runs with LAB_GATEWAY set, which is the ONLY difference
// from the state tests/browser/my-account.mjs asserts against: there,
// with no gateway configured, the page must draw no button at all. Here
// a bank is simulated at /__demo-gateway — it clears the charge, issues
// the receipt the real webhook handler issues, and redirects exactly
// where a gateway would. Everything either side of it is production
// code against production data.
//
// What is being proved:
//
//   THE PRICE QUOTED IS THE PRICE CHARGED. The figure on the offer card
//   and the figure on the confirmation plate are compared, through a
//   real checkout, in the currency it was taken in.
//
//   THE PAGE NEVER OFFERS AN ACT THAT WOULD BE REFUSED. The confirm
//   button appears only where the endpoint says the enrolment would be
//   granted, and disappears the moment it has been.
//
//   THE LEVEL ACTUALLY OPENS. The enrolment is read back from the
//   server, not from the page that asked for it.
import { chromium } from 'playwright';
import { spawn } from 'node:child_process';
import { existsSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const HERE = dirname(fileURLToPath(import.meta.url));
const PORT = process.env.LAB_PORT || 8851;
const BASE = `http://localhost:${PORT}`;

let pass = 0, fail = 0;
const check = (label, cond, detail) => {
  console.log((cond ? 'PASS ' : 'FAIL ') + label + (cond || detail === undefined ? '' : ` — ${detail}`));
  cond ? pass++ : fail++;
};

const server = spawn(process.execPath, ['--experimental-sqlite', join(HERE, 'lab-server.mjs')], {
  env: { ...process.env, LAB_PORT: String(PORT), LAB_GATEWAY: '1' }, stdio: ['ignore', 'pipe', 'pipe'],
});
await new Promise((resolve, reject) => {
  const t = setTimeout(() => reject(new Error('server did not start')), 20000);
  server.stdout.on('data', (d) => { if (String(d).includes('ready')) { clearTimeout(t); resolve(); } });
  server.stderr.on('data', (d) => { if (!/ExperimentalWarning|trace-warnings/.test(String(d))) process.stderr.write(d); });
});

const exe = process.env.PW_CHROMIUM || '/opt/pw-browsers/chromium-1194/chrome-linux/chrome';
const browser = await chromium.launch(existsSync(exe) ? { executablePath: exe } : {});
const errs = [];

async function open_(path, viewport) {
  const page = await browser.newPage({ viewport: viewport || { width: 1280, height: 1000 } });
  await page.route('**://fonts.googleapis.com/**', (r) => r.abort());
  await page.route('**://fonts.gstatic.com/**', (r) => r.abort());
  page.on('pageerror', (e) => errs.push(`${path}: ${e.message}`));
  page.on('console', (m) => {
    if (m.type() !== 'error') return;
    const txt = m.text();
    if (/net::ERR_FAILED|fonts\.(googleapis|gstatic)/.test(txt)) return;
    errs.push(`${path}: console ${txt}`);
  });
  await page.goto(BASE + path, { waitUntil: 'domcontentloaded' });
  await page.waitForTimeout(1600);
  return page;
}

const textOf = async (page, sel) => {
  const n = page.locator(sel);
  return (await n.count()) ? ((await n.first().textContent()) || '').trim() : '';
};

const options = await (await fetch(`${BASE}/api/payments/options`)).json();
const toBuy = options.levels.find((l) => !l.enrolment.held);

check('the harness leaves one level unbought, or there is nothing to test',
  Boolean(toBuy), toBuy ? toBuy.name : 'every level held');
check('a gateway is configured in this run, which is what makes a button legitimate',
  options.payment.configured.length > 0, options.payment.configured.join(','));

// ── The offer, and going out to the bank ────────────────────────────
let paymentId = null;
{
  const page = await open_('/my-account.html');

  const card = page.locator('.acc-offer').filter({ hasText: toBuy.name }).first();
  check('the level not yet held is offered with a way to pay for it',
    (await card.locator('.acc-offer__acts .btn').count()) === 2,
    String(await card.locator('.acc-offer__acts .btn').count()));

  const quoted = (await card.locator('.acc-offer__price').textContent() || '').trim();
  check('...priced at the figure the endpoint quoted',
    quoted.includes(toBuy.price.ledger.text), quoted);

  // Out to the gateway and back, following the redirect the way a bank
  // would send a browser back.
  await Promise.all([
    page.waitForURL(/payment-complete/, { timeout: 15000 }),
    card.locator('.btn', { hasText: 'Pay in full' }).click(),
  ]);
  await page.waitForTimeout(1600);

  paymentId = new URL(page.url()).searchParams.get('payment');
  check('the gateway returns the learner to a page that exists, carrying the reference',
    Boolean(paymentId) && /\/student-portal\/payment-complete\//.test(page.url()), page.url());

  check('the plate is shown, and says in words what happened',
    !(await page.locator('#secPayment').isHidden())
    && (await textOf(page, '[data-standing]')).length > 3,
    await textOf(page, '[data-standing]'));
  check('the figure on the plate is the figure that was quoted on the offer',
    (await textOf(page, '[data-charged]')) === toBuy.price.ledger.text,
    `${await textOf(page, '[data-charged]')} against ${toBuy.price.ledger.text}`);
  check('a receipt number is issued and printed, rather than left to be asked for',
    /^WEC-R-/.test(await textOf(page, '[data-fact-receipt]')),
    await textOf(page, '[data-fact-receipt]'));
  check('the reference is on the plate, because it is what a person quotes',
    (await textOf(page, '[data-fact-ref]')) === paymentId);
  check('the level the payment opens is named',
    (await textOf(page, '[data-fact-opens]')) === toBuy.name,
    await textOf(page, '[data-fact-opens]'));

  // ── The enrolment, asked for and granted ─────────────────────────
  check('the enrolment is offered, because the endpoint says it would be granted',
    !(await page.locator('[data-confirm]').isHidden()));
  check('...and the button names the level it opens rather than saying "continue"',
    (await textOf(page, '[data-confirm]')).includes(toBuy.name),
    await textOf(page, '[data-confirm]'));

  await page.locator('[data-confirm]').click();
  await page.waitForTimeout(1800);

  check('once the place exists the standing changes, on the same page',
    /open/i.test(await textOf(page, '[data-standing]')),
    await textOf(page, '[data-standing]'));
  check('...the act is not offered a second time',
    await page.locator('[data-confirm]').isHidden());
  check('...and the way into the level is offered instead',
    !(await page.locator('[data-go-programme]').isHidden()));

  const server_ = await (await fetch(`${BASE}/api/payments/verify?id=${paymentId}`)).json();
  check('the enrolment is on the record, read back from the server',
    server_.standing === 'enrolled' && server_.enrolment.levelId === toBuy.levelId,
    JSON.stringify({ standing: server_.standing, level: server_.enrolment && server_.enrolment.levelId }));

  const after = await (await fetch(`${BASE}/api/payments/options`)).json();
  check('...and the checkout stops offering a level the learner now holds',
    after.levels.find((l) => l.levelId === toBuy.levelId).enrolment.held === true);
  await page.close();
}

// ── Asked for twice ─────────────────────────────────────────────────
{
  // A person who reloads the confirmation page, or opens it in a second
  // tab, must not be enrolled twice or told anything different.
  const page = await open_(`/student-portal/payment-complete/?payment=${paymentId}`);
  check('reloading the confirmation says the same thing, and offers nothing again',
    (await page.locator('[data-confirm]').isHidden())
    && /open/i.test(await textOf(page, '[data-standing]')));
  await page.close();
}

// ── A charge still with the bank ────────────────────────────────────
{
  const made = await (await fetch(`${BASE}/api/payments/create-checkout`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ levelId: toBuy.levelId }),
  })).json();
  const page = await open_(`/student-portal/payment-complete/?payment=${made.paymentId}`);
  check('a charge still with the gateway is not reported as a failure',
    !/fail/i.test(await textOf(page, '[data-standing]')), await textOf(page, '[data-standing]'));
  check('...and the page says nothing is lost if it is closed',
    !(await page.locator('[data-wait]').isHidden())
    && /nothing is lost/i.test(await textOf(page, '[data-wait]')),
    await textOf(page, '[data-wait]'));
  check('...and offers no enrolment, because the confirm route would refuse it',
    await page.locator('[data-confirm]').isHidden());
  await page.close();
}

// ── A charge the bank declined ──────────────────────────────────────
{
  const made = await (await fetch(`${BASE}/api/payments/create-checkout`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ levelId: toBuy.levelId }),
  })).json();
  await fetch(`${BASE}/__demo-gateway?payment=${made.paymentId}&outcome=decline`, { redirect: 'manual' });
  const page = await open_(`/student-portal/payment-complete/?payment=${made.paymentId}`);
  check('a declined charge says so plainly',
    /not taken/i.test(await textOf(page, '[data-standing]')), await textOf(page, '[data-standing]'));
  check('...and says WHY, which is the difference between trying the same card and not',
    /declined/i.test(await textOf(page, '[data-reason]')), await textOf(page, '[data-reason]'));
  check('...and offers no enrolment', await page.locator('[data-confirm]').isHidden());
  await page.close();
}

// ── An instalment plan, opened and its first part paid ──────────────
{
  const fresh = await (await fetch(`${BASE}/api/payments/options`)).json();
  const held = fresh.levels.find((l) => l.enrolment.held && !l.instalment.planId);
  if (held) {
    const plan = await (await fetch(`${BASE}/api/payments/instalment-plan`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ levelId: held.levelId }),
    })).json();
    const made = await (await fetch(`${BASE}/api/payments/create-checkout`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ instalmentPlanId: plan.id }),
    })).json();
    await fetch(`${BASE}/__demo-gateway?payment=${made.paymentId}`, { redirect: 'manual' });
    const page = await open_(`/student-portal/payment-complete/?payment=${made.paymentId}`);
    check('an instalment says which one it is, of how many, and how many are left',
      /Instalment 1 of 4/.test(await textOf(page, '[data-instalment]'))
      && /3 still to come/.test(await textOf(page, '[data-instalment]')),
      await textOf(page, '[data-instalment]'));
    await page.close();
  }

  // And the schedule on the statement now carries a way to pay the next.
  const acct = await open_('/my-account.html');
  check('with a gateway configured, the schedule offers the next instalment',
    (await acct.locator('[data-pay-instalment]').count()) >= 1,
    String(await acct.locator('[data-pay-instalment]').count()));
  await acct.close();
}

// ── Nothing at all on the account ───────────────────────────────────
// Reached from a statement rather than from a gateway, the page answers
// for the most recent payment — which is what makes it a surface a
// person can navigate to rather than one reachable only by holding a
// generated reference.
{
  const page = await open_('/student-portal/payment-complete/');
  check('with no reference on the address, the most recent payment is shown',
    !(await page.locator('#secPayment').isHidden())
    && (await textOf(page, '[data-fact-ref]')).startsWith('pay_'),
    await textOf(page, '[data-fact-ref]'));
  await page.close();
}

// ── Arabic, and the geometry ────────────────────────────────────────
{
  const ar = await open_(`/ar/student-portal/payment-complete/?payment=${paymentId}`);
  check('the Arabic edition is right to left',
    await ar.evaluate(() => document.documentElement.dir === 'rtl'));
  check('...and states the standing in Arabic rather than falling back to the enum',
    !/^[a-z_]+$/.test(await textOf(ar, '[data-standing]')) && (await textOf(ar, '[data-standing]')).length > 3,
    await textOf(ar, '[data-standing]'));
  check('...and sends the reader on to the Arabic programme page',
    (await ar.locator('[data-go-programme]').getAttribute('href')) === '/ar/my-programme.html');
  // `programme_levels` holds ONE name and it is English. An Arabic
  // sentence ending in "English Mastery Programme" was on this page
  // until the endpoint started handing back nameAr beside name.
  check('...and names the level in Arabic, not in the middle of an Arabic sentence in English',
    !/[A-Za-z]/.test(await textOf(ar, '[data-fact-opens]')),
    await textOf(ar, '[data-fact-opens]'));
  check('...and says what the payment was for in Arabic too',
    !/[A-Za-z]/.test((await textOf(ar, '[data-what]')).replace(/[\d.,$£]/g, '')),
    await textOf(ar, '[data-what]'));
  await ar.close();
}

for (const w of [1440, 900, 390]) {
  for (const path of [
    `/student-portal/payment-complete/?payment=${paymentId}`,
    `/ar/student-portal/payment-complete/?payment=${paymentId}`,
  ]) {
    const p = await open_(path, { width: w, height: 900 });
    const over = await p.evaluate(() =>
      document.documentElement.scrollWidth - document.documentElement.clientWidth);
    check(`No horizontal overflow at ${w}px on ${path.split('?')[0]}`, over <= 1, `${over}px`);
    await p.close();
  }
}

check('No uncaught script errors on either edition', errs.length === 0, errs.slice(0, 4).join(' | '));

await browser.close();
server.kill();
console.log(`\n${pass} passed, ${fail} failed.`);
process.exit(fail ? 1 : 0);
