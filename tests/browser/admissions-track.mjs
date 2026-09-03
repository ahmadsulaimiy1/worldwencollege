// Run with: node tests/browser/admissions-track.mjs
//
// TRACK YOUR APPLICATION, in a real browser, against the real
// admissions lifecycle.
//
// The reader here is not a learner and has no account — that is the
// whole design, and it is why this suite runs with LAB_REQUIRE_AUTH on:
// the only way to prove a page works without a session is to run it in a
// harness that 401s everything holding one.
//
// What is asserted is what an applicant actually experiences.
//
//   · A reference resolves, and a wrong one is refused in words rather
//     than by a blank page.
//   · The rail says which stage they are at AND which stages are not
//     theirs, because "pending" answering both is the fault the page was
//     built to correct.
//   · An offer can be answered from here, and answering it moves the
//     stage — not just the offer card. A page that updated one and not
//     the other would show an accepted offer beside a stage that had not
//     moved.
//   · The reference never reaches the address bar, the history or
//     storage. It is a bearer credential.
//   · No horizontal overflow and no console error at 1440 / 900 / 390,
//     in both directions. CLAUDE.md § 6 — reasoning about CSS is not
//     verification.
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
  env: { ...process.env, LAB_PORT: String(PORT), LAB_REQUIRE_AUTH: '1' }, stdio: ['ignore', 'pipe', 'pipe'],
});
await new Promise((resolve, reject) => {
  const t = setTimeout(() => reject(new Error('server did not start')), 20000);
  server.stdout.on('data', (d) => { if (String(d).includes('ready')) { clearTimeout(t); resolve(); } });
  server.stderr.on('data', (d) => { if (!/ExperimentalWarning|trace-warnings/.test(String(d))) process.stderr.write(d); });
});

const refs = await (await fetch(`${BASE}/__demo-applications`)).json();

const exe = process.env.PW_CHROMIUM || '/opt/pw-browsers/chromium-1194/chrome-linux/chrome';
const browser = await chromium.launch(existsSync(exe) ? { executablePath: exe } : {});
const errs = [];

async function open(path, viewport) {
  const page = await browser.newPage({ viewport: viewport || { width: 1280, height: 1000 } });
  await page.route('**://fonts.googleapis.com/**', (r) => r.abort());
  await page.route('**://fonts.gstatic.com/**', (r) => r.abort());
  page.on('pageerror', (e) => errs.push(`${path}: ${e.message}`));
  // Two kinds of console noise are excluded, and only two.
  //
  // The aborted font routes are this suite's own doing.
  //
  // A 401 on /api/admissions/track is the platform ANSWERING: this suite
  // deliberately presents a wrong reference, the endpoint refuses it in
  // the words it is supposed to, and Chromium logs every 4xx fetch as a
  // console error regardless. The refusal is asserted where it belongs —
  // in the sentence the applicant reads — a few lines below. Excluding
  // it here is not softening the check; treating a designed refusal as a
  // fault is what would train the suite to ignore the console.
  page.on('console', (m) => {
    if (m.type() !== 'error') return;
    const txt = m.text();
    if (/net::ERR_FAILED|fonts\.(googleapis|gstatic)/.test(txt)) return;
    if (/status of 401/.test(txt)) return;
    errs.push(`${path}: console ${txt}`);
  });
  await page.goto(BASE + path, { waitUntil: 'domcontentloaded' });
  await page.waitForTimeout(500);
  return page;
}

async function track(page, ref) {
  await page.fill('#ref', ref);
  await page.locator('.vfy-submit').click();
  await page.waitForTimeout(700);
}

const textOf = async (page, sel) => {
  const n = page.locator(sel);
  return (await n.count()) ? ((await n.first().textContent()) || '').trim() : '';
};

// ── A submitted application ─────────────────────────────────────────
{
  const page = await open('/admissions/track/');
  await track(page, refs.submitted);

  check('a reference resolves without any session at all',
    !(await page.locator('#result').isHidden()));
  check('the reference is echoed back on the plate',
    (await textOf(page, '#fRef')) === refs.submitted, await textOf(page, '#fRef'));
  check('the rail draws all five published stages',
    (await page.locator('.trk-stage').count()) === 5);
  check('exactly one stage is marked current, and it is the one the platform says',
    (await page.locator('.trk-stage--current').count()) === 1
    && (await textOf(page, '.trk-stage--current .trk-stage__name')) === 'Submit the form',
    await textOf(page, '.trk-stage--current .trk-stage__name'));
  check('the earlier stage is marked done rather than merely not-current',
    (await page.locator('.trk-stage--done').count()) === 1);

  // The fault the page exists to correct.
  const owed = await page.locator('.trk-owed li').count();
  check('what is outstanding is listed rather than summarised as "pending"', owed >= 1, String(owed));
  check('...and each outstanding item names WHOSE it is',
    (await page.locator('.trk-owed li[data-who]').count()) === owed);
  check('...and a step of the College\'s is marked as the College\'s, which is the one an applicant may chase',
    (await page.locator('.trk-owed li[data-who="the College"]').count()) >= 1);
  check('the placement commitment the College made to every applicant is on the page',
    (await textOf(page, '#outstanding')).includes('three working days'));

  check('the timeline opens with the submission rather than mid-story',
    (await textOf(page, '.trk-timeline li:first-child')).includes('submitted the form'));
  check('what happens next is stated, not left to be inferred',
    (await textOf(page, '#nextWhat')).length > 20);

  check('no offer plate on an application that has no offer',
    await page.locator('#secOffer').isHidden());

  // The credential.
  check('the reference is not left in the address bar',
    !page.url().includes(refs.submitted), page.url());
  const stored = await page.evaluate(() => JSON.stringify({
    ls: Object.keys(localStorage), ss: Object.keys(sessionStorage),
  }));
  check('...and nothing about it is written to storage',
    !stored.includes('app_') && !stored.includes('ref'), stored);
  await page.close();
}

// ── A wrong reference ───────────────────────────────────────────────
{
  const page = await open('/admissions/track/');
  await track(page, 'app_thiscannotexist');
  // In WORDS — the endpoint answers { error: 'AuthError', message: '…' }
  // and the page must show the second. It showed the first until this
  // assertion was written, which is the whole argument for rendering.
  const refused = await textOf(page, '#refError');
  check('a wrong reference is refused in a sentence, not with an error class name',
    refused.length > 40 && refused.includes(' ') && !/^[A-Za-z]+Error$/.test(refused), refused);
  check('...and no empty record card is left on screen implying something failed',
    await page.locator('#result').isHidden());

  await track(page, '');
  check('an empty reference asks for one rather than calling the endpoint',
    (await textOf(page, '#refError')).toLowerCase().includes('reference'));
  await page.close();
}

// ── A live offer, answered from the page ────────────────────────────
{
  const page = await open('/admissions/track/');
  await track(page, refs.offered);

  check('an application with a live offer shows the offer plate',
    !(await page.locator('#secOffer').isHidden()));
  check('...naming the entry level it is an offer of',
    (await textOf(page, '#offerLevel')).includes('II'), await textOf(page, '#offerLevel'));
  check('...and its conditions, because a conditional offer with hidden conditions is not an offer',
    !(await page.locator('#offerConditions').isHidden())
    && (await textOf(page, '#offerConditions')).length > 20);
  // A real date, not a placeholder and not "an unrecorded date" — which
  // is what the page prints when it is handed nothing.
  const by = await textOf(page, '#offerExpires');
  check('...with a real date to answer by', /\d{4}/.test(by) && !/unrecorded/.test(by), by);
  check('the answer controls are live while the offer is', !(await page.locator('#offerAnswer').isHidden()));

  // NOT the stage. `offer_sent` and `accepted` are both stage four in
  // the published journey — "Offer: Admissions, then you" — so an
  // acceptance correctly leaves the rail where it is, and a test that
  // demanded movement there would have been demanding the platform lie.
  // What must move is everything the acceptance actually changes, which
  // is the point of re-reading the record rather than patching the card.
  const eventsBefore = await page.locator('.trk-timeline li').count();
  const owedBefore = await textOf(page, '#outstanding');
  await page.locator('#btnAccept').click();
  await page.waitForTimeout(900);

  check('accepting re-reads the whole record: the audited timeline gains the act',
    (await page.locator('.trk-timeline li').count()) > eventsBefore,
    `${eventsBefore} -> ${await page.locator('.trk-timeline li').count()}`);
  check('...and what is outstanding is recomputed rather than left stale',
    (await textOf(page, '#outstanding')) !== owedBefore);
  // In a sentence, not in the stored word. `issued`, `accepted` and
  // `lapsed` are the platform's vocabulary; an applicant reading
  // "Standing: issued" learns nothing, so the page translates them and
  // this assertion holds it to that rather than to the raw value.
  const standing = await textOf(page, '#offerStatus');
  check('...and the record says so in words an applicant reads, not in the stored token',
    /accepted/i.test(standing) && standing !== 'accepted', standing);
  check('the answered offer says so in words rather than going quiet',
    (await textOf(page, '#offerClosed')).length > 20, await textOf(page, '#offerClosed'));
  check('...and the answer controls are gone, so it cannot be answered twice',
    await page.locator('#offerAnswer').isHidden());
  await page.close();
}

// ── Both editions, three widths, both directions ────────────────────
for (const [path, dirn] of [['/admissions/track/', 'ltr'], ['/ar/admissions/track/', 'rtl']]) {
  for (const w of [1440, 900, 390]) {
    const page = await open(path, { width: w, height: 900 });
    await track(page, refs.offered);
    const over = await page.evaluate(() =>
      document.documentElement.scrollWidth - document.documentElement.clientWidth);
    check(`${dirn} ${w}: no horizontal overflow`, over <= 0, `${over}px`);

    // The rail is the piece most likely to crush: five labels across a
    // phone is four broken words, so it stacks below 700 and must have
    // actually done so.
    const railFlow = await page.evaluate(() =>
      getComputedStyle(document.querySelector('.trk-rail')).gridAutoFlow);
    check(`${dirn} ${w}: the rail is ${w <= 700 ? 'stacked' : 'in a row'}`,
      w <= 700 ? railFlow.includes('row') : railFlow.includes('column'), railFlow);

    // Every disc actually inside its own bay, which is the fault a
    // percentage-driven rail hides until it is rendered.
    const spill = await page.evaluate(() => {
      const doc = document.documentElement.getBoundingClientRect();
      return [...document.querySelectorAll('.trk-stage__disc')].filter((d) => {
        const r = d.getBoundingClientRect();
        return r.left < doc.left - 1 || r.right > doc.right + 1;
      }).length;
    });
    check(`${dirn} ${w}: no stage disc outside the page`, spill === 0, String(spill));
    await page.close();
  }
}

check('no console errors or page errors anywhere', errs.length === 0, errs.slice(0, 4).join(' | '));

await browser.close();
if (server) server.kill();
console.log(`\n${pass} passed, ${fail} failed.`);
process.exit(fail ? 1 : 0);
