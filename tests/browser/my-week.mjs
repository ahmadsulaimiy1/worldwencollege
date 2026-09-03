// Run with: node tests/browser/my-week.mjs
//
// MY WEEK, in a real browser, against the real timetable module.
//
// The assertions are about the two things a timetable gets wrong when it
// is wrong, and they are both about trust rather than layout.
//
//   TIME. A College teaching into sixty countries cannot show a class
//   time on the browser's clock: a learner travelling with a laptop set
//   to a hotel's zone would be shown two different times for one class
//   on two days. The endpoint returns the moment in UTC, the same moment
//   in the learner's ACCOUNT zone, the offset and the zone's name; the
//   page must print the server's local string and name the zone beside
//   it, never convert the UTC one itself.
//
//   AGREEMENT. Every hour the list offers must be one the booking route
//   accepts. An hour offered and then refused reads as a platform that
//   changed its mind between two clicks, so the page never recomputes
//   `bookable` — and this suite books one through the interface to prove
//   the two agree in the browser and not only in a unit test.
import { chromium } from 'playwright';
import { spawn } from 'node:child_process';
import { existsSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const HERE = dirname(fileURLToPath(import.meta.url));
const PORT = process.env.LAB_PORT || 8838;
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

const feed = await (await fetch(`${BASE}/api/student/timetable?days=14`)).json();
const open = await (await fetch(`${BASE}/api/student/booking?days=14`)).json();

const exe = process.env.PW_CHROMIUM || '/opt/pw-browsers/chromium-1194/chrome-linux/chrome';
// A browser deliberately set to a DIFFERENT zone from the account's, so
// that a page converting the UTC instant itself would produce a visibly
// wrong hour rather than accidentally the right one.
const browser = await chromium.launch(existsSync(exe) ? { executablePath: exe } : {});
const errs = [];

async function open_(path, viewport) {
  const page = await browser.newPage({
    viewport: viewport || { width: 1280, height: 1000 },
    timezoneId: 'America/Los_Angeles',
  });
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
  await page.waitForTimeout(1200);
  return page;
}

const textOf = async (page, sel) => {
  const n = page.locator(sel);
  return (await n.count()) ? ((await n.first().textContent()) || '').trim() : '';
};

// ── The zone, and the times on it ───────────────────────────────────
{
  const page = await open_('/my-week.html');

  check('the zone the times are on is named on the page',
    (await textOf(page, '[data-zone-line]')).includes(feed.zone.timeZone),
    await textOf(page, '[data-zone-line]'));
  check('...with the endpoint\'s own sentence about where it came from',
    (await textOf(page, '[data-zone-note]')).length > 20);

  // THE TEST THAT MATTERS. The browser is in America/Los_Angeles and the
  // account is in Asia/Dubai; the hour printed must be the account's.
  const first = feed.events[0];
  const hh = first.startsAt.local.slice(11, 16);
  const firstRow = await textOf(page, '.wk-event:first-child .wk-event__day');
  check('a class is shown at the hour of the ACCOUNT zone, not the browser\'s',
    firstRow.includes(hh), `${firstRow} should carry ${hh} (${first.startsAt.timeZone})`);
  check('...and the zone is printed beside the time, not left to be assumed',
    (await textOf(page, '.wk-event:first-child .wk-event__zone')).includes(first.startsAt.timeZone));
  await page.close();
}

// ── The feed ────────────────────────────────────────────────────────
{
  const page = await open_('/my-week.html');
  check('every event in the window is listed',
    (await page.locator('.wk-event').count()) === feed.events.length, String(feed.events.length));
  check('each kind is named in words, never only by colour',
    (await page.locator('.wk-event .acc-pill').count()) === feed.events.length);

  const cls = feed.events.find((e) => e.kind === 'class' && e.joinUrl);
  if (cls) {
    check('a class with a join link offers it', (await page.locator('.wk-event a[href^="https://"]').count()) >= 1);
  }
  const tut = feed.events.find((e) => e.kind === 'tutorial');
  if (tut) {
    check('a tutorial the learner holds can be given back from the feed',
      (await page.locator(`[data-cancel="${tut.source.id}"]`).count()) === 1);
  }
  check('the calendar control says it is a FILE and not a subscription',
    /file|subscription/i.test(await textOf(page, '[data-ics-note]')),
    await textOf(page, '[data-ics-note]'));
  await page.close();
}

// ── Hours open to this learner ──────────────────────────────────────
{
  const page = await open_('/my-week.html');
  check('every open hour is listed', (await page.locator('.wk-slot').count()) === open.slots.length);
  check('the ones the endpoint calls bookable are the ones offering a place',
    (await page.locator('[data-book]').count()) === open.counts.bookable, String(open.counts.bookable));

  const full = open.slots.find((s) => s.full && !s.alreadyBooked);
  if (full) {
    check('a FULL hour is listed and says so, rather than being hidden',
      (await page.locator(`.wk-slot[data-state="full"]`).count()) >= 1
      && /full/i.test(await textOf(page, '.wk-slot[data-state="full"]')));
    check('...and offers no place to take', (await page.locator(`.wk-slot[data-state="full"] [data-book]`).count()) === 0);
  }
  const mine = open.slots.find((s) => s.alreadyBooked);
  if (mine) {
    check('an hour the learner already holds says so rather than offering it twice',
      (await page.locator('.wk-slot[data-state="yours"]').count()) >= 1
      && (await page.locator('.wk-slot[data-state="yours"] [data-book]').count()) === 0);
  }
  check('a bookable hour says how many places are left',
    (await textOf(page, '.wk-slot[data-state="open"]')).match(/place|مقعد/i) !== null);
  await page.close();
}

// ── Taking a place, through the interface ───────────────────────────
{
  const page = await open_('/my-week.html');
  const before = await page.locator('[data-book]').count();
  check('there is an hour to take', before >= 1);

  await page.locator('[data-book]').first().click();
  await page.waitForTimeout(500);
  check('the booking panel opens in place, not over the hours it is being compared with',
    !(await page.locator('#secBook').isHidden()));
  check('...naming the hour it is about', (await textOf(page, '[data-book-title]')).length > 3);
  check('...and when it is, with its zone',
    (await textOf(page, '[data-book-when]')).includes(feed.zone.timeZone));

  await page.locator('[data-book-confirm]').click();
  await page.waitForTimeout(1400);

  check('the place is taken and the panel closes', await page.locator('#secBook').isHidden());
  check('...and the hour is no longer offered, because the whole page was re-read',
    (await page.locator('[data-book]').count()) === before - 1,
    `${before} -> ${await page.locator('[data-book]').count()}`);
  check('...and it now shows as an hour the learner holds',
    (await page.locator('.wk-slot[data-state="yours"]').count()) >= 1);
  await page.close();
}

// ── Giving a place back, and the reason that is not optional ────────
{
  const page = await open_('/my-week.html');
  const give = page.locator('[data-cancel]').first();
  if (await give.count()) {
    await give.click();
    await page.waitForTimeout(400);
    check('the cancellation panel opens', !(await page.locator('#secCancel').isHidden()));

    // Refused HERE, not sent to be refused — so the learner reads the
    // reason for the requirement at the moment they meet it.
    await page.locator('[data-cancel-confirm]').click();
    await page.waitForTimeout(400);
    check('an empty reason is refused on the page, with the reason FOR the requirement',
      (await textOf(page, '[data-cancel-error]')).length > 30,
      await textOf(page, '[data-cancel-error]'));
    check('...and nothing was sent: the panel is still open',
      !(await page.locator('#secCancel').isHidden()));

    await page.fill('[data-cancel-reason]', 'A clash with work, given back so somebody else can use the hour.');
    await page.locator('[data-cancel-confirm]').click();
    await page.waitForTimeout(1400);
    check('a reasoned cancellation goes through and closes the panel',
      await page.locator('#secCancel').isHidden());
  }
  await page.close();
}

// ── The window control ──────────────────────────────────────────────
{
  const page = await open_('/my-week.html');
  await page.selectOption('[data-days]', '90');
  await page.waitForTimeout(1200);
  check('widening the window re-reads the feed rather than filtering what is already drawn',
    (await page.locator('.wk-event').count()) >= feed.events.length);
  await page.close();
}

// ── Both editions, three widths, both directions ────────────────────
for (const [path, dirn] of [['/my-week.html', 'ltr'], ['/ar/my-week.html', 'rtl']]) {
  for (const w of [1440, 900, 390]) {
    const page = await open_(path, { width: w, height: 900 });
    const over = await page.evaluate(() =>
      document.documentElement.scrollWidth - document.documentElement.clientWidth);
    check(`${dirn} ${w}: no horizontal overflow`, over <= 0, `${over}px`);

    // The time is a margin above 720 and a first line below it: a 14rem
    // time column at 390 leaves a title four words wide.
    const cols = await page.evaluate(() => {
      const row = document.querySelector('.wk-event');
      return row ? getComputedStyle(row).gridTemplateColumns.split(' ').length : 0;
    });
    check(`${dirn} ${w}: the feed is ${w <= 720 ? 'stacked' : 'two-column'}`,
      w <= 720 ? cols === 1 : cols === 2, String(cols));
    await page.close();
  }
}

check('no console errors or page errors anywhere', errs.length === 0, errs.slice(0, 4).join(' | '));

await browser.close();
if (server) server.kill();
console.log(`\n${pass} passed, ${fail} failed.`);
process.exit(fail ? 1 : 0);
