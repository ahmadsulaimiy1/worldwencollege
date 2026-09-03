// Run with: node tests/browser/my-desk.mjs
//
// MY DESK, in a real browser, against the real comms modules.
//
// Three things are being proved, and none of them is layout.
//
//   THE AUDIENCE. `ADDRESSED_TO` is a WHERE fragment rather than a
//   filter, so a notice addressed to somebody else is never read out of
//   the database on this learner's request. The harness seeds one notice
//   to a DIFFERENT learner and one still in draft, and this suite fails
//   if either sentence ever reaches the page — in the DOM, not merely in
//   what is visible, because a hidden element carrying a private notice
//   is the same disclosure with a stylesheet in front of it.
//
//   THE RECEIPT. Nothing is marked read on load. The badge is the
//   server's count over the same predicate as the list, so the suite
//   reads it, opens one notice, and requires the count to fall by
//   exactly one — which fails both if the page marks everything read and
//   if it decrements a local variable instead of re-reading.
//
//   THE REFUSAL. A closed thread must render the server's own sentence
//   and no reply box. A page that offers a box and discovers the refusal
//   on submission has told the learner they may write when they may not.
import { chromium } from 'playwright';
import { spawn } from 'node:child_process';
import { existsSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const HERE = dirname(fileURLToPath(import.meta.url));
const PORT = process.env.LAB_PORT || 8841;
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

const feed = await (await fetch(`${BASE}/api/announcements`)).json();
const threads = await (await fetch(`${BASE}/api/messages`)).json();

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
    // The aborted font routes above are this suite's own doing, not the
    // page's. Treating them as faults would train the suite to ignore
    // the console, which is where the real ones appear.
    if (/net::ERR_FAILED|fonts\.(googleapis|gstatic)/.test(txt)) return;
    errs.push(`${path}: console ${txt}`);
  });
  await page.goto(BASE + path, { waitUntil: 'domcontentloaded' });
  await page.waitForTimeout(1400);
  return page;
}

const textOf = async (page, sel) => {
  const n = page.locator(sel);
  return (await n.count()) ? ((await n.first().textContent()) || '').trim() : '';
};

// ── The endpoint, before the page ───────────────────────────────────
check('The feed carries the notices the harness published',
  feed.returned === 4 && feed.unread === 3,
  `returned ${feed.returned}, unread ${feed.unread}`);
check('The feed excludes a notice addressed to another learner and a draft',
  !JSON.stringify(feed).includes('addressed to somebody else')
  && !JSON.stringify(feed).includes('An unpublished draft'));

const page = await open_('/my-desk.html');

// ── What is waiting ─────────────────────────────────────────────────
check('The two counts render the server’s own numbers',
  (await textOf(page, '[data-count-notices]')) === String(feed.unread)
  && (await textOf(page, '[data-count-threads]')) === String(threads.unread),
  `${await textOf(page, '[data-count-notices]')} / ${await textOf(page, '[data-count-threads]')}`);

// ── The audience, in the DOM and not merely in view ─────────────────
{
  const html = await page.content();
  check('A notice addressed to another learner is nowhere in the document',
    !html.includes('addressed to somebody else'));
  check('A draft notice is nowhere in the document',
    !html.includes('An unpublished draft'));
}

// ── The notices ─────────────────────────────────────────────────────
{
  const items = page.locator('.desk-notice');
  const n = await items.count();
  // Three shown: the fourth was put away by the harness and is behind
  // the toggle, which is the whole reason the toggle exists.
  check('Only the notices not put away are listed', n === 3, `${n} listed`);
  check('The put-away toggle names how many are behind it',
    (await textOf(page, '[data-away-toggle]')).includes('(1)'),
    await textOf(page, '[data-away-toggle]'));
  check('The pinned notice is first and is marked as pinned',
    (await items.first().locator('.desk-chip--pinned').count()) === 1);
  check('An unread notice carries the unread mark',
    (await page.locator('.desk-notice[data-read="no"] .desk-chip--unread').count()) >= 1);
  check('The audience of each notice is stated on it',
    (await page.locator('.desk-notice .desk-chip', { hasText: 'To the whole College' }).count()) >= 1
    && (await page.locator('.desk-notice .desk-chip', { hasText: 'To you alone' }).count()) === 1);

  // A body is not on the page until it is opened, which is what makes
  // the receipt honest.
  check('A notice body is closed until it is opened',
    await page.locator('.desk-notice').first().locator('.desk-notice__body').isHidden());
}

// ── The receipt ─────────────────────────────────────────────────────
{
  const before = Number(await textOf(page, '[data-count-notices]'));
  // Held by POSITION, not by [data-read="no"]. The page rewrites that
  // attribute the instant the notice is opened, so a locator written on
  // it would silently re-resolve to the NEXT unread notice and report a
  // hidden body as a fault in the one that was actually opened.
  const all = page.locator('.desk-notice');
  let idx = -1;
  for (let i = 0; i < await all.count(); i++) {
    if (await all.nth(i).getAttribute('data-read') === 'no') { idx = i; break; }
  }
  check('There is an unread notice to open', idx !== -1);
  const first = all.nth(idx);
  await first.locator('button', { hasText: 'Open' }).first().click();
  await page.waitForTimeout(700);
  check('Opening a notice reveals its body',
    await first.locator('.desk-notice__body').isVisible());
  const after = Number(await textOf(page, '[data-count-notices]'));
  check('Opening one notice moves the badge by exactly one',
    after === before - 1, `${before} → ${after}`);

  // Re-read from the server rather than from the page: a badge that is
  // right on screen and wrong in the record is the failure this checks.
  const fresh = await (await fetch(`${BASE}/api/announcements`)).json();
  check('The receipt is on the record, not only on the page',
    fresh.unread === after, `server ${fresh.unread}, page ${after}`);
}

// ── The edition ─────────────────────────────────────────────────────
{
  await page.selectOption('[data-lang]', 'ar');
  await page.waitForTimeout(900);
  check('Reading in Arabic serves the Arabic edition where there is one',
    (await page.locator('.desk-notice__title', { hasText: 'جدول امتحانات الفصل' }).count()) === 1);
  check('A notice with no Arabic edition says so rather than pretending',
    (await page.locator('.desk-notice__edition').count()) >= 1
    && (await textOf(page, '.desk-notice__edition')).includes('English only'),
    await textOf(page, '.desk-notice__edition'));
  await page.selectOption('[data-lang]', 'en');
  await page.waitForTimeout(900);
}

// ── The correspondence ──────────────────────────────────────────────
{
  const rows = page.locator('.desk-thread-row');
  check('Both conversations are listed', (await rows.count()) === 2, `${await rows.count()} listed`);
  check('A conversation states its status',
    (await page.locator('.desk-chip--answered').count()) === 1
    && (await page.locator('.desk-chip--closed').count()) === 1);
  check('The allowance is stated before it is met, not after',
    (await textOf(page, '[data-allowance]')).includes('of 5'),
    await textOf(page, '[data-allowance]'));
  // Across ALL rows, not the first one. The two fixture threads are
  // opened in the same millisecond, so `ORDER BY last_message_at DESC,
  // id DESC` breaks the tie on a random uuid and which one leads the
  // list is not a fact about the page.
  const parties = (await page.locator('.desk-thread-row__parties').allTextContents()).join(' | ');
  check('The parties are named without their email addresses',
    parties.includes('Demonstration Tutor') && parties.includes('Demonstration Registrar')
    && !(await page.content()).includes('tutor@example.com'), parties);
}

// ── One thread, and the reply box ───────────────────────────────────
{
  await page.locator('.desk-thread-row__open', { hasText: 'The second conditional' }).click();
  await page.waitForTimeout(900);
  check('The thread opens in place', await page.locator('#secThread').isVisible());
  check('Both sides of the conversation are shown',
    (await page.locator('.desk-message').count()) === 2);
  check('Your own message is marked as yours',
    (await page.locator('.desk-message[data-mine="yes"]').count()) === 1);
  check('An open thread offers a reply box',
    await page.locator('[data-reply]').isVisible());

  await page.fill('[data-reply-body]', 'Thank you — I will bring the recording on Thursday.');
  await page.locator('[data-reply-send]').click();
  await page.waitForTimeout(1400);
  check('A reply is added to the thread it was written in',
    (await page.locator('.desk-message').count()) === 3);
  const server = await (await fetch(`${BASE}/api/messages`)).json();
  check('The reply reached the record and cleared the unread count',
    server.unread === 0, `server unread ${server.unread}`);
}

// ── The refusal ─────────────────────────────────────────────────────
{
  await page.locator('[data-thread-close]').click();
  await page.locator('.desk-thread-row__open', { hasText: 'Confirming the spelling' }).click();
  await page.waitForTimeout(900);
  check('A closed thread offers no reply box',
    await page.locator('[data-reply]').isHidden());
  check('A closed thread carries the College’s own reason for closing it',
    (await textOf(page, '[data-reply-refusal]')).includes('spelling is confirmed'),
    await textOf(page, '[data-reply-refusal]'));
}

// ── Writing a new one ───────────────────────────────────────────────
{
  await page.locator('[data-thread-close]').click();
  await page.locator('[data-compose-open]').click();
  await page.waitForTimeout(300);
  const options = await page.locator('[data-recipient] option').count();
  check('The recipients offered are the server’s list',
    options === threads.canOpen.length && options > 0, `${options} offered`);
  check('The page says how many people stand behind the chosen desk',
    (await textOf(page, '[data-recipient-note]')).includes('behind this desk'),
    await textOf(page, '[data-recipient-note]'));

  await page.fill('[data-subject]', 'A question about the listening laboratory');
  await page.fill('[data-body]', 'May I re-sit the Unit 4 laboratory before the tutorial, or does the earlier attempt stand?');
  await page.locator('[data-compose-send]').click();
  await page.waitForTimeout(1600);
  const after = await (await fetch(`${BASE}/api/messages`)).json();
  check('A new conversation is opened and opened against a real level',
    after.returned === 3 && after.threads.some((t) => t.subject.includes('listening laboratory')),
    `${after.returned} threads`);
  check('The new conversation is shown straight away rather than left to be found',
    (await textOf(page, '[data-thread-subject]')).includes('listening laboratory'),
    await textOf(page, '[data-thread-subject]'));
  check('The allowance moves with it',
    (await textOf(page, '[data-allowance]')).includes('3 of 5'),
    await textOf(page, '[data-allowance]'));
}

// ── Refusing an empty message before it costs a round trip ──────────
{
  await page.locator('[data-thread-close]').click();
  await page.locator('[data-compose-open]').click();
  await page.fill('[data-subject]', '');
  await page.fill('[data-body]', '');
  await page.locator('[data-compose-send]').click();
  await page.waitForTimeout(400);
  check('An empty message is refused on the page, with the reason',
    (await textOf(page, '[data-compose-error]')).length > 0,
    await textOf(page, '[data-compose-error]'));
}

// ── The clock is named ──────────────────────────────────────────────
check('The page names the zone its times are shown on',
  (await textOf(page, '#scope')).includes('time zone'),
  await textOf(page, '#scope'));

// ── Arabic, and the geometry ────────────────────────────────────────
{
  const ar = await open_('/ar/my-desk.html');
  check('The Arabic edition is right to left',
    await ar.evaluate(() => document.documentElement.dir === 'rtl'));
  check('The Arabic edition renders the same notices',
    (await ar.locator('.desk-notice').count()) === 3,
    `${await ar.locator('.desk-notice').count()} listed`);
  check('The Arabic edition renders the correspondence',
    (await ar.locator('.desk-thread-row').count()) === 3,
    `${await ar.locator('.desk-thread-row').count()} listed`);

  // THE GUARD ON THE OWN-GROUND PLATE. `[dir="rtl"] .card` in
  // css/brand.css re-declares background-image at two-class
  // specificity, and for as long as four surfaces on this site
  // declared their dark ground locally it beat every one of them —
  // putting champagne text on gold at about 1.3:1, on the Arabic
  // edition only. `.plate-dark` now declares that ground once, in both
  // directions. This asserts the two editions paint the SAME ground,
  // which is the only form of the check that would have caught it.
  const groundOf = (p, sel) => p.evaluate(
    (s) => getComputedStyle(document.querySelector(s)).backgroundImage, sel);
  for (const sel of ['.desk-count', '#secCompose']) {
    const en = await groundOf(page, sel);
    const rtl = await groundOf(ar, sel);
    check(`${sel} paints the same ground in both editions`,
      en === rtl && /linear-gradient/.test(en), `${en.slice(0, 60)} vs ${rtl.slice(0, 60)}`);
  }
  await ar.close();
}

for (const w of [1440, 900, 390]) {
  for (const path of ['/my-desk.html', '/ar/my-desk.html']) {
    const p = await open_(path, { width: w, height: 900 });
    const over = await p.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth);
    check(`No horizontal overflow at ${w}px on ${path}`, over <= 1, `${over}px`);
    await p.close();
  }
}

check('No uncaught script errors on either edition', errs.length === 0, errs.join(' | '));

await page.close();
await browser.close();
server.kill();
console.log(`\n${pass} passed, ${fail} failed.`);
process.exit(fail ? 1 : 0);
