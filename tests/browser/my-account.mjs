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

// ── WHAT YOU MAY PAY FOR NOW ────────────────────────────────────────
// The harness runs with NO gateway configured, which is the platform's
// actual state: no STRIPE_SECRET_KEY exists anywhere. So the whole of
// this block is about the honest refusal — the College saying it cannot
// take a card today rather than drawing a button that answers 503. The
// paying journey is driven, end to end, in tests/browser/payment-complete.mjs.
const options = await (await fetch(`${BASE}/api/payments/options`)).json();
{
  const page = await open('/my-account.html');

  check('the checkout section is on the statement of account, where money already lives',
    !(await page.locator('#secBuy').isHidden()));
  check('every level is offered, and the whole programme beside them',
    (await page.locator('.acc-offer').count()) === options.levels.length + 1,
    String(await page.locator('.acc-offer').count()));

  const first = page.locator('.acc-offer').first();
  check('a price on the page is the price the endpoint quoted, not one the page worked out',
    (await first.locator('.acc-offer__price').textContent() || '').trim()
      === options.levels[0].price.ledger.text,
    await first.locator('.acc-offer__price').textContent());
  check('...and the four instalments are named beside it, before anything is committed to',
    /791\.67/.test(await first.locator('.acc-offer__under').textContent() || ''),
    await first.locator('.acc-offer__under').textContent());

  // THE HARNESS LEARNER HOLDS A 25% SCHOLARSHIP, so this is the case
  // where two prices sit on one card and the difference has to be
  // explained rather than left to be worked out.
  check('relief the College granted is quoted into the price, not ignored by the checkout',
    options.levels[0].price.usdCents < options.levels[0].published.usdCents,
    `${options.levels[0].price.usdCents} of ${options.levels[0].published.usdCents}`);
  check('...with the published fee named beside it on the card',
    (await first.locator('.acc-offer__relief').textContent() || '')
      .includes(options.levels[0].published.ledger.text),
    await first.locator('.acc-offer__relief').textContent());
  // The create route refuses to discount an instalment and the plan is
  // struck on the published fee. Two prices on one card with nothing
  // between them is how a learner concludes the College has mispriced
  // their level.
  check('...and the card SAYS why the instalments are the undiscounted figure',
    /struck against the published fee/i.test(await first.locator('.acc-offer__caveat').textContent() || ''),
    await first.locator('.acc-offer__caveat').textContent());

  // A level already held is a STATEMENT, never a greyed-out button: a
  // control that cannot be used and is drawn anyway is one a person tries.
  const held = options.levels.filter((l) => l.enrolment.held).length;
  check('a level the learner already holds says so rather than offering a second purchase',
    (await page.locator('.acc-offer__note').count()) >= held, String(held));

  // THE REFUSAL. With no gateway configured there must be no button at
  // all in the grid, and the College's own answer in its place.
  check('with no gateway configured, the College says so in its own words',
    !(await page.locator('[data-buy-closed]').isHidden())
    && /not taking cards/i.test(await textOf(page, '[data-buy-closed]')),
    await textOf(page, '[data-buy-closed]'));
  check('...and draws no button that would answer 503',
    (await page.locator('.acc-offer__acts .btn').count()) === 0,
    String(await page.locator('.acc-offer__acts .btn').count()));
  check('...and offers no way to pay the next instalment either',
    (await page.locator('[data-pay-instalment]').count()) === 0);
  check('...while still publishing the prices, which are the prices',
    (await page.locator('.acc-offer__price').count()) === options.levels.length + 1);

  // The refund window, before the money moves rather than after.
  const terms = await textOf(page, '[data-buy-terms]');
  check('the fourteen-day window is stated before anything is paid, not after',
    /fourteen days/i.test(terms) && /refunded in full/i.test(terms), terms.slice(0, 80));
  check('...and the closed fee schedule is linked from it',
    (await page.locator('[data-buy-terms] a[href="/admissions/tuition/"]').count()) === 1);

  check('the full programme is not presented as a saving over its six levels',
    /same money/i.test(await page.locator('.acc-offer').last().locator('.acc-offer__note').textContent() || ''),
    await page.locator('.acc-offer').last().locator('.acc-offer__note').textContent());

  check('the most recent payment is reachable from the statement',
    (await page.locator('#latest a[href="/student-portal/payment-complete/"]').count()) === 1);
  await page.close();
}

// ── The currency the learner is charged in, chosen by them ──────────
{
  const page = await open('/my-account.html');
  check('a currency the College can take is offered as a choice',
    (await page.locator('[data-currency-pick] option').count()) === options.currency.choices.length,
    String(await page.locator('[data-currency-pick] option').count()));

  await page.locator('[data-currency-pick]').selectOption('GBP');
  await page.waitForTimeout(1200);
  const gbp = await (await fetch(`${BASE}/api/payments/options?currency=GBP`)).json();
  const priced = (await page.locator('.acc-offer').first().locator('.acc-offer__price').textContent() || '').trim();
  check('choosing sterling re-quotes every price in sterling, from the endpoint',
    priced.includes(gbp.levels[0].price.learner.text), priced);
  // The ledger figure LEADS, here as everywhere else on this page. A
  // price card that reversed the pair would read differently from every
  // other figure beside it, and moneyInto() is deliberately the one
  // place that decides the order.
  check('...beside the ledger figure, in that order, never one without the other',
    priced.indexOf(gbp.levels[0].price.ledger.text) === 0
    && priced.includes(gbp.levels[0].price.learner.text), priced);
  check('...and the rate that converted it is published under the picker',
    /0\.79/.test(await textOf(page, '[data-currency-rate]')), await textOf(page, '[data-currency-rate]'));
  await page.close();
}

// ── The Arabic edition names the levels in Arabic ───────────────────
// `programme_levels` holds one name and it is English, so every Arabic
// surface that rendered a level name rendered it in English — in the
// middle of an Arabic sentence, on a page about somebody's money.
{
  const ar = await open('/ar/my-account.html');
  const names = await ar.locator('.acc-offer__name').allTextContents();
  check('every level offered is named in Arabic',
    names.length > 0 && names.slice(0, 6).every((n) => !/[A-Za-z]/.test(n)),
    names.join(' | '));
  check('...and the level is numbered with an Arabic ordinal rather than a roman numeral',
    !/[IVX]/.test(await textOf(ar, '.acc-offer__eyebrow')),
    await textOf(ar, '.acc-offer__eyebrow'));
  const plan = await textOf(ar, '.acc-plan__name');
  check('...and so is the level an instalment plan is struck against',
    plan.length > 0 && !/[A-Za-z]/.test(plan), plan);
  await ar.close();
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
