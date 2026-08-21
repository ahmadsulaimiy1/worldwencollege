// Run with: node tests/browser/my-account.mjs
//
// MY ACCOUNT, in a real browser, against the real finance module.
//
// A statement of account is the one screen where a rendering fault is
// not a rendering fault. A figure that is unreadable, a total that does
// not match its own workings, or a currency shown without the date its
// rate was true are all, to the learner, the College getting their money
// wrong. So this suite asserts the things a person would actually check.
//
//   · The balance and every term of the identity are on the page, and
//     the terms are the endpoint's terms rather than the page's own
//     arithmetic.
//   · Both currencies appear wherever the platform holds a rate, and the
//     converted figure carries the date it was true.
//   · A failed payment says WHY it failed, because "failed" and "the
//     card issuer declined it" are different facts and only the second
//     tells a learner whether to try the same card.
//   · A scholarship names the authority that granted it, or says plainly
//     that none is recorded — never a name the schema does not hold.
//   · An invoice opens in place, from the keyboard, and closes on Escape.
//   · No horizontal overflow and no console error at 1440 / 900 / 390,
//     in both directions.
import { chromium } from 'playwright';
import { spawn } from 'node:child_process';
import { existsSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const HERE = dirname(fileURLToPath(import.meta.url));
const PORT = process.env.LAB_PORT || 8834;
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

// The truth the page must agree with, taken from the endpoint itself.
// Asserting the page against a number typed into this file would only
// prove the two agree with each other.
const truth = await (await fetch(`${BASE}/api/student/finance`)).json();

const exe = process.env.PW_CHROMIUM || '/opt/pw-browsers/chromium-1194/chrome-linux/chrome';
const browser = await chromium.launch(existsSync(exe) ? { executablePath: exe } : {});
const errs = [];

async function open(path, viewport) {
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
  await page.waitForTimeout(900);
  return page;
}

const textOf = async (page, sel) => {
  const n = page.locator(sel);
  return (await n.count()) ? ((await n.first().textContent()) || '').trim() : '';
};

// ── The balance and its workings ────────────────────────────────────
{
  const page = await open('/my-account.html');

  check('the statement loads and the balance plate is shown',
    !(await page.locator('#secBalance').isHidden()));
  check('the headline figure is the endpoint\'s outstanding figure, not the page\'s own sum',
    (await textOf(page, '[data-balance-figure]')) === truth.balance.outstanding.ledger.text,
    await textOf(page, '[data-balance-figure]'));
  check('the standing is stated in words rather than left to the figure\'s sign',
    (await textOf(page, '[data-balance-state]')).length > 4);

  const terms = await page.locator('.acc-sum li').count();
  check('all four terms and the total are on the page', terms === 5, String(terms));
  check('the identity itself is printed, so the sum can be followed',
    (await textOf(page, '[data-identity]')).includes('assessed'));
  check('no imbalance warning while the endpoint says its arithmetic holds',
    truth.reconciliation.balances === true && await page.locator('[data-imbalance]').isHidden());

  // Every term against the endpoint, one by one. A page that rendered
  // four right figures and one wrong one still reports a wrong balance.
  const rows = await page.locator('.acc-sum li .acc-sum__value .acc-money__ledger').allTextContents();
  const expected = [
    truth.balance.assessed.ledger.text, truth.balance.relief.ledger.text,
    truth.balance.paid.ledger.text, truth.balance.refunded.ledger.text,
    truth.balance.outstanding.ledger.text,
  ];
  check('every term matches the endpoint, term by term',
    JSON.stringify(rows) === JSON.stringify(expected), `${rows.join(' | ')} vs ${expected.join(' | ')}`);
}

// ── Two currencies, and the date the rate was true ──────────────────
{
  const page = await open('/my-account.html');
  const local = await textOf(page, '[data-balance-local]');
  check('the learner\'s own currency is shown beside the ledger figure',
    local.includes(truth.balance.outstanding.learner.text), local);
  check('...and it carries the date its rate was true, on the figure rather than in a header',
    /\d{4}/.test(local) && local.includes('rate'), local);
  await page.close();
}

// ── The ledger ──────────────────────────────────────────────────────
{
  const page = await open('/my-account.html');
  const rows = await page.locator('[data-ledger] tr').count();
  check('every payment on the account is listed', rows === truth.payments.length, String(rows));

  const failed = truth.payments.find((p) => p.status === 'failed');
  check('a failed payment is on the page rather than quietly omitted',
    (await page.locator(`[data-ledger] tr[data-invoice="${failed.id}"]`).count()) === 1);
  check('...and says WHY it failed, not merely that it did',
    (await textOf(page, `[data-ledger] tr[data-invoice="${failed.id}"]`)).includes(failed.failureReason.slice(0, 20)));

  const receipted = truth.payments.find((p) => p.receiptNumber);
  check('a receipt number is published against the payment it belongs to',
    (await textOf(page, `[data-ledger] tr[data-invoice="${receipted.id}"]`)).includes(receipted.receiptNumber));
  await page.close();
}

// ── Relief, and the authority behind it ─────────────────────────────
{
  const page = await open('/my-account.html');
  check('relief granted is listed', (await page.locator('.acc-relief li').count()) >= 1);
  const relief = await textOf(page, '.acc-relief li');
  const s = truth.relief.scholarships[0];
  check('...naming the authority that granted it, or saying none is recorded',
    s.authority.recorded ? /approved by/i.test(relief) : /no approving authority/i.test(relief), relief);
  check('...and never a person\'s name, which the schema does not hold',
    !/usr_/.test(relief));
  await page.close();
}

// ── One invoice, opened in place ────────────────────────────────────
{
  const page = await open('/my-account.html');
  const first = truth.payments[0];

  check('the invoice plate is closed until one is asked for',
    await page.locator('#secInvoice').isHidden());

  // From the KEYBOARD. A table row is not focusable, which is why the
  // opener is a button inside the cell rather than a handler on the row.
  await page.locator(`[data-open-invoice="${first.id}"]`).focus();
  await page.keyboard.press('Enter');
  await page.waitForTimeout(800);

  check('an invoice opens in place, reachable from the keyboard',
    !(await page.locator('#secInvoice').isHidden()));
  check('...naming the reference it was opened for',
    (await textOf(page, '[data-invoice-ref]')) === first.id, await textOf(page, '[data-invoice-ref]'));
  check('...with at least one line and a total row',
    (await page.locator('[data-invoice-lines] tr').count()) >= 2);
  check('...and what the gateway ACTUALLY took, in the currency it took it in',
    /charged/i.test(await textOf(page, '[data-invoice-charged]')),
    await textOf(page, '[data-invoice-charged]'));

  await page.keyboard.press('Escape');
  await page.waitForTimeout(300);
  check('Escape closes it', await page.locator('#secInvoice').isHidden());

  // The sterling charge, where the recorded fact and the ledger figure
  // genuinely differ — the case the "never re-converted" rule is for.
  const gbp = truth.payments.find((p) => p.charged && p.charged.currency !== 'USD');
  if (gbp) {
    await page.locator(`[data-open-invoice="${gbp.id}"]`).click();
    await page.waitForTimeout(800);
    const charged = await textOf(page, '[data-invoice-charged]');
    check('a charge taken in another currency is reported as taken, not re-converted',
      charged.includes(gbp.charged.text) && charged.includes(gbp.charged.currency), charged);
  }
  await page.close();
}

// ── Instalments ─────────────────────────────────────────────────────
{
  const page = await open('/my-account.html');
  const plan = truth.instalments[0];
  check('the instalment schedule is drawn', (await page.locator('.acc-plan').count()) === truth.instalments.length);
  check('...with one step per instalment',
    (await page.locator('.acc-steps li').count()) === plan.instalmentCount);
  check('...marking what is paid and what is next',
    (await page.locator('.acc-steps li[data-state="paid"]').count()) === plan.paidCount
    && (await page.locator('.acc-steps li[data-state="next"]').count()) === 1);
  // instalment_plans holds no due date and no adopted cadence, so the
  // page must SAY there is none rather than print one it invented.
  check('...and says plainly that no due date is published, rather than inventing one',
    (await textOf(page, '.acc-steps li[data-state="next"]')).includes('no published due date'),
    await textOf(page, '.acc-steps li[data-state="next"]'));
  await page.close();
}

// ── Both editions, three widths, both directions ────────────────────
for (const [path, dirn] of [['/my-account.html', 'ltr'], ['/ar/my-account.html', 'rtl']]) {
  for (const w of [1440, 900, 390]) {
    const page = await open(path, { width: w, height: 900 });
    const over = await page.evaluate(() =>
      document.documentElement.scrollWidth - document.documentElement.clientWidth);
    check(`${dirn} ${w}: no horizontal overflow`, over <= 0, `${over}px`);

    // A five-column money table is wider than a phone. It must scroll
    // inside its own box rather than push the document sideways, which
    // is the whole reason .acc-tablewrap exists.
    const scrolls = await page.evaluate(() => {
      const box = document.querySelector('.acc-tablewrap');
      return box ? getComputedStyle(box).overflowX : null;
    });
    check(`${dirn} ${w}: the money table scrolls inside its own box`, scrolls === 'auto', String(scrolls));
    await page.close();
  }
}

check('no console errors or page errors anywhere', errs.length === 0, errs.slice(0, 4).join(' | '));

await browser.close();
if (server) server.kill();
console.log(`\n${pass} passed, ${fail} failed.`);
process.exit(fail ? 1 : 0);
