// Run with: node tests/browser/my-module.mjs
//
// MY MODULE, in a real browser, against the real LMS modules.
//
// This is the surface a learner studies on, and the three things being
// proved are the three ways a study surface fails people.
//
//   THE ALLOWANCE IS READ BEFORE IT IS SPENT. Three sittings, fourteen
//   days between them, no fee, and what happens after the third. All of
//   it must be on the page BEFORE the button, because discovering a
//   fortnight's wait by being refused one is the version of the rule
//   that reads as an obstruction.
//
//   THE ANSWERS ARE MARKED ON THE SERVER. `correct_index` is never sent
//   to the client, and this suite fails if it ever appears in the
//   document — a quiz whose answers are in the page is not an
//   assessment.
//
//   A SITTING IS SPENT ONCE. The quiz is sat here through the
//   interface, and the allowance the page shows afterwards must be the
//   one the server now holds, not one the page worked out for itself.
import { chromium } from 'playwright';
import { spawn } from 'node:child_process';
import { existsSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const HERE = dirname(fileURLToPath(import.meta.url));
const PORT = process.env.LAB_PORT || 8847;
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

const listed = await (await fetch(`${BASE}/api/lms/units?levelId=1`)).json();
const first = listed.units[0];
const detail = await (await fetch(`${BASE}/api/lms/unit?id=${first.id}`)).json();
const quizItem = detail.items.find((i) => i.kind === 'quiz');
const assignItem = detail.items.find((i) => i.kind === 'assignment');

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
  await page.waitForTimeout(1800);
  return page;
}

const textOf = async (page, sel) => {
  const n = page.locator(sel);
  return (await n.count()) ? ((await n.first().textContent()) || '').trim() : '';
};

check('The level has a module with both a quiz and an assignment in it',
  Boolean(quizItem && assignItem));

const page = await open_(`/my-module.html?unit=${first.id}`);

// ── The module opens ────────────────────────────────────────────────
{
  check('The module named in the address is the one that opens',
    (await textOf(page, '[data-module-title]')) === first.title,
    await textOf(page, '[data-module-title]'));
  check('The learner’s level is named on the masthead',
    (await textOf(page, '[data-level-eyebrow]')).startsWith('Level'),
    await textOf(page, '[data-level-eyebrow]'));
  check('Every item of the module is rendered',
    (await page.locator('.mod-item').count()) === detail.items.length,
    `${await page.locator('.mod-item').count()} of ${detail.items.length}`);
  check('Every module of the level is offered in the picker',
    (await page.locator('[data-module-pick] option').count()) === listed.units.length,
    `${await page.locator('[data-module-pick] option').count()} of ${listed.units.length}`);
  // No item may render its database value as a label.
  const chips = (await page.locator('.mod-chip').allTextContents()).join(' | ');
  check('Every kind of item has a name rather than its database value',
    !/live_session|_/.test(chips), chips);
}

// ── The answers are the College's ───────────────────────────────────
{
  const html = await page.content();
  check('No answer key reaches the document',
    !/correct_index|correctIndex/.test(html));
}

// ── The allowance, before the button ────────────────────────────────
{
  const quiz = page.locator('.mod-item[data-kind="quiz"]').first();
  const allow = (await quiz.locator('.mod-allow').textContent()) || '';
  check('The quiz states how many sittings there are and how many stand',
    /Sittings: 0 of 3/.test(allow) && /3 sittings remain/.test(allow), allow.trim());
  check('...and that a resit carries no fee, before one is needed',
    /no fee/.test(allow));
  check('...and which number the next sitting will be',
    /next sitting is number 1/.test(allow), allow.trim());
  // The order matters: a learner meets the allowance while deciding.
  const order = await quiz.evaluate((el) => {
    const a = el.querySelector('.mod-allow');
    const b = el.querySelector('.mod-quiz');
    if (!a || !b) return 'missing';
    return (a.compareDocumentPosition(b) & Node.DOCUMENT_POSITION_FOLLOWING) ? 'before' : 'after';
  });
  check('The allowance is set ABOVE the paper, not under the button',
    order === 'before', order);
}

// ── Sitting the quiz ────────────────────────────────────────────────
{
  const quiz = page.locator('.mod-item[data-kind="quiz"]').first();
  check('The paper is on the page with its questions',
    (await quiz.locator('.mod-q').count()) === (quizItem.questions || []).length,
    `${await quiz.locator('.mod-q').count()} questions`);

  // Submitting without answering everything is refused on the page: a
  // partial paper would spend one of only three sittings.
  await quiz.locator('.btn', { hasText: 'Submit your answers' }).click();
  await page.waitForTimeout(500);
  check('A half-answered paper is refused before it costs a sitting',
    (await quiz.locator('.vfy-error').textContent() || '').length > 0,
    await quiz.locator('.vfy-error').textContent());

  const qs = await quiz.locator('.mod-q').count();
  for (let i = 0; i < qs; i++) {
    await quiz.locator('.mod-q').nth(i).locator('input[type="radio"]').first().check();
  }
  await quiz.locator('.btn', { hasText: 'Submit your answers' }).click();
  await page.waitForTimeout(1600);

  check('The mark comes back and is stated as a fraction and a percentage',
    /You answered \d+ of \d+ correctly — \d+%/.test(await quiz.locator('.mod-result').textContent() || ''),
    await quiz.locator('.mod-result').textContent());
  const after = (await quiz.locator('.mod-allow').textContent()) || '';
  check('The allowance is re-read from the answer, not decremented on the page',
    /Sittings: 1 of 3/.test(after) && /2 sittings remain/.test(after), after.trim());
  check('...and the fortnight between sittings is named with the day it clears',
    /next sitting opens on/.test(after), after.trim());
  check('The paper is put away once it has been sat',
    (await quiz.locator('.mod-quiz').count()) === 0);

  const server = await (await fetch(`${BASE}/api/lms/unit?id=${first.id}`)).json();
  const q = server.items.find((i) => i.kind === 'quiz');
  check('The sitting is on the record, and the interval is held against it',
    q.reassessment.attemptsTaken === 1 && q.reassessment.mayAttempt === false,
    JSON.stringify({ taken: q.reassessment.attemptsTaken, may: q.reassessment.mayAttempt }));
}

// ── Submitting the assignment ───────────────────────────────────────
{
  const asg = page.locator('.mod-item[data-kind="assignment"]').first();
  await asg.locator('textarea').fill('Good afternoon. My name is the demonstration learner and I am studying at Level One. I come from Muscat and I have been learning English for two years.');
  await asg.locator('.btn', { hasText: 'Submit the assignment' }).click();
  await page.waitForTimeout(1900);

  const fresh = page.locator('.mod-item[data-kind="assignment"]').first();
  check('The submission is shown back with its state and its date',
    (await fresh.locator('.mod-sub').count()) === 1
    && /Submitted/.test(await fresh.locator('.mod-sub').textContent() || ''),
    await fresh.locator('.mod-sub__head').textContent());
  check('...and the allowance moves with it',
    /Sittings: 1 of 3/.test(await fresh.locator('.mod-allow').textContent() || ''),
    (await fresh.locator('.mod-allow').textContent() || '').trim());
  check('...and it says the work is waiting to be marked',
    /waiting to be marked/.test(await fresh.locator('.mod-allow').textContent() || ''));

  const server = await (await fetch(`${BASE}/api/lms/unit?id=${first.id}`)).json();
  const a = server.items.find((i) => i.kind === 'assignment');
  check('The assignment is on the record', Boolean(a.mySubmission));
}

// ── Audio work is sent to the laboratory ────────────────────────────
{
  const lab = page.locator('.mod-item[data-kind="listening"]').first();
  check('A listening item sends the learner to the Lab rather than half-building one',
    (await lab.locator('a.btn').getAttribute('href') || '').startsWith('/listening-lab.html?unit='),
    await lab.locator('a.btn').getAttribute('href'));
  check('...and says why the Lab is where that work happens',
    /waveform/.test(await lab.locator('.mod-lab__why').textContent() || ''));
}

// ── The level's live hours ──────────────────────────────────────────
{
  const live = await page.locator('#secLive').textContent();
  check('The live hours of the level are on the module page',
    await page.locator('#secLive').isVisible());
  check('...and where there are none, the page says a live hour is never a condition',
    (await page.locator('.mod-live__item').count()) > 0
    || /never a condition of it/.test(live), live.slice(0, 120));
}

// ── My Programme links here ─────────────────────────────────────────
{
  const prog = await open_('/my-programme.html');
  check('My Programme carries a static link into the module page',
    (await prog.locator('a[href="/my-module.html"]').count()) === 1);
  await prog.close();
}

// ── Arabic, and the geometry ────────────────────────────────────────
{
  const ar = await open_(`/ar/my-module.html?unit=${first.id}`);
  check('The Arabic edition is right to left',
    await ar.evaluate(() => document.documentElement.dir === 'rtl'));
  check('The Arabic edition renders the same module',
    (await ar.locator('.mod-item').count()) === detail.items.length);
  check('The Arabic edition sends audio work to the Arabic Lab',
    (await ar.locator('.mod-item[data-kind="listening"] a.btn').getAttribute('href') || '')
      .startsWith('/ar/listening-lab.html?unit='));
  await ar.close();
}

for (const w of [1440, 900, 390]) {
  for (const path of [`/my-module.html?unit=${first.id}`, `/ar/my-module.html?unit=${first.id}`]) {
    const p = await open_(path, { width: w, height: 900 });
    const over = await p.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth);
    check(`No horizontal overflow at ${w}px on ${path.split('?')[0]}`, over <= 1, `${over}px`);
    await p.close();
  }
}

check('No uncaught script errors on either edition', errs.length === 0, errs.join(' | '));

await page.close();
await browser.close();
server.kill();
console.log(`\n${pass} passed, ${fail} failed.`);
process.exit(fail ? 1 : 0);
