// Run with: node tests/browser/admin-enrolments.mjs
//
// The enrolment administration page, in a real browser, against the
// real enrolment module and the real curriculum database.
//
// The unit tests (tests/admin-enrolments.test.mjs) prove the logic is
// right. They prove nothing about whether the page reaches it — which
// is exactly how both Lab pages once shipped with no Authorization
// header and a green suite. So this drives the page: search, open a
// learner, grant a level, withdraw it, and read the audit trail back.
import { chromium } from 'playwright';
import { spawn } from 'node:child_process';
import { existsSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const HERE = dirname(fileURLToPath(import.meta.url));
const PORT = process.env.LAB_PORT || 8821;
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
const page = await browser.newPage({ viewport: { width: 1280, height: 1000 } });
await page.route('**://fonts.googleapis.com/**', (r) => r.abort());
await page.route('**://fonts.gstatic.com/**', (r) => r.abort());

const errs = [];
page.on('pageerror', (e) => errs.push(e.message));

// The page asks for a reason with window.prompt before it changes
// anything. Answer it, and record what was asked — the wording is the
// feature, not decoration.
let lastPrompt = null, promptAnswer = 'Scholarship 2026-A, approved by the Academic Director';
page.on('dialog', async (d) => { lastPrompt = d.message(); await d.accept(promptAnswer); });

await page.goto(`${BASE}/admin-enrolments.html`, { waitUntil: 'domcontentloaded' });
await page.waitForTimeout(700);

// --- The register, on arrival ----------------------------------------
// Asserted HERE, before anything else happens on the page, and not
// after the appointment further down: appoint() refreshes the register
// itself, so a check placed after it passes even when the page never
// renders the register on load. Found by sabotaging exactly that and
// watching the later assertions stay green.
check('An administrator sees the access register on arrival, without searching for anyone',
  (await page.locator('#registerCard').isVisible()) === true);
const register0 = await page.locator('#register button').allTextContents();
check('...listing everyone who holds access above learner', register0.length >= 2, register0.join(' | '));
check('...with the access level each of them holds',
  register0.some((t) => /Administrator/.test(t)) && register0.some((t) => /Staff/.test(t)), register0.join(' | '));
// Learners are the overwhelming majority; a register that listed them
// would answer a different question than the one being asked.
// `.every()` on an empty list is true, so the length is part of the
// assertion — otherwise a register that rendered nothing at all would
// report that it correctly excluded learners.
check('...but not ordinary learners',
  register0.length > 0 && register0.every((t) => !/Learner$/.test(t.trim())), register0.join(' | '));

// --- Search -----------------------------------------------------------
const initial = await page.locator('#results button').count();
check('The page lists existing accounts without being asked', initial >= 2, initial);

await page.fill('#q', 'demo@');
await page.locator('#searchForm button[type=submit]').click();
await page.waitForTimeout(500);
const found = await page.locator('#results button').allTextContents();
check('Search narrows to the matching learner', found.length === 1 && /demo@example\.com/.test(found[0]), found.join(' | '));
check('...and says what access they already have, not just their name',
  /of 6 levels/.test(found[0]), found[0]);

// --- Open a learner ---------------------------------------------------
await page.locator('#results button').first().click();
await page.waitForTimeout(500);
check('Opening a learner shows their record', (await page.locator('#learnerCard').isVisible()) === true);
const levelRows = await page.locator('#levels > div').count();
check('All six levels are listed, enrolled or not', levelRows === 6, levelRows);

// --- Grant a level a learner does not have ----------------------------
// usr_demo is seeded into all six, so use the staff account as the
// subject: the harness's actor is usr_tutor, so pick the other one.
await page.fill('#q', 'tutor@');
await page.locator('#searchForm button[type=submit]').click();
await page.waitForTimeout(500);
await page.locator('#results button').first().click();
await page.waitForTimeout(500);

const before = await page.locator('#levels > div').first().textContent();
check('A learner with no enrolments reads "Not enrolled", not a blank',
  /Not enrolled/.test(before || ''), (before || '').trim().slice(0, 60));

// NOTE: the harness's actor is usr_tutor and this subject is usr_tutor,
// so the self-enrolment guard should refuse it. That is the assertion.
await page.locator('#levels > div').first().locator('button').first().click();
await page.waitForTimeout(700);
check('The page asks WHY before changing anything, not "are you sure"',
  /^Why /.test(lastPrompt || ''), lastPrompt);
const guardMsg = await page.textContent('#admError');
check('Staff cannot grant themselves a level through the UI either',
  /own enrolments/i.test(guardMsg || ''), (guardMsg || '').trim());
// The first version of this page mapped every 403 to "you do not have
// staff access", so a staff member refused for enrolling THEMSELVES was
// told they were not staff — false, and it would send them to ask for
// access they already had. Assert the message is the real reason.
check('...and is told the real reason, not "you are not staff"',
  !/does not have staff access/i.test(guardMsg || ''), (guardMsg || '').trim());

// --- Grant, then withdraw, a real learner -----------------------------
// usr_demo holds all six from the seed, so withdraw one and re-grant it:
// the full lifecycle, through the page.
await page.fill('#q', 'demo@');
await page.locator('#searchForm button[type=submit]').click();
await page.waitForTimeout(500);
await page.locator('#results button').first().click();
await page.waitForTimeout(500);

promptAnswer = 'Learner deferred to the spring intake';
const row6 = page.locator('#levels > div').nth(5);
const withdrawBtn = row6.locator('button', { hasText: 'Withdraw' });
await withdrawBtn.click();
await page.waitForTimeout(900);
const after6 = await page.locator('#levels > div').nth(5).textContent();
check('Withdrawing a level updates the page immediately',
  /Not enrolled/.test(after6 || ''), (after6 || '').trim().slice(0, 70));

const history = await page.locator('#history > div').allTextContents();
check('The withdrawal appears in the history', history.length >= 1, history.length);
check('...attributed to the staff member who did it',
  /tutor@example\.com/.test(history[0] || ''), (history[0] || '').slice(0, 90));
check('...with the reason they gave',
  /deferred to the spring intake/.test(history[0] || ''), (history[0] || '').slice(0, 120));

promptAnswer = 'Returned for the spring intake as planned';
await page.locator('#levels > div').nth(5).locator('button', { hasText: 'Enrol' }).click();
await page.waitForTimeout(900);
const back6 = await page.locator('#levels > div').nth(5).textContent();
check('A withdrawn learner can be re-enrolled from the page', /Active/.test(back6 || ''), (back6 || '').trim().slice(0, 70));
const history2 = await page.locator('#history > div').allTextContents();
check('...and both events are kept, not overwritten', history2.length >= 2, history2.length);

// --- Cancelling changes nothing ---------------------------------------
let cancelled = false;
page.removeAllListeners('dialog');
page.on('dialog', async (d) => { cancelled = true; await d.dismiss(); });
await page.locator('#levels > div').nth(5).locator('button', { hasText: 'Withdraw' }).click();
await page.waitForTimeout(700);
const stillActive = await page.locator('#levels > div').nth(5).textContent();
check('Dismissing the reason prompt changes nothing', cancelled && /Active/.test(stillActive || ''), (stillActive || '').slice(0, 50));
const history3 = await page.locator('#history > div').allTextContents();
check('...and writes no event', history3.length === history2.length, `${history2.length} -> ${history3.length}`);

// --- Appointments -----------------------------------------------------
// The harness signs in as an administrator, so the access controls
// should be offered on other people's records.
page.removeAllListeners('dialog');
const asked = [];
let answers = ['Appointed to lead the Level II cohort', 'Board minute 2026-03, item 4'];
page.on('dialog', async (d) => { asked.push(d.message()); await d.accept(answers[asked.length - 1] || ''); });

await page.fill('#q', 'learner@');
await page.locator('#searchForm button[type=submit]').click();
await page.waitForTimeout(500);
if (await page.locator('#results button').count() === 0) {
  await page.fill('#q', 'demo@');
  await page.locator('#searchForm button[type=submit]').click();
  await page.waitForTimeout(500);
}
await page.locator('#results button').first().click();
await page.waitForTimeout(600);

check('An administrator is offered access controls on a learner', (await page.locator('#accessBlock').isVisible()) === true);
const accessBtns = await page.locator('#access button').allTextContents();
check('...to appoint as staff or administrator, but not to the role they already hold',
  accessBtns.some((t) => /Appoint as staff/.test(t)) && accessBtns.some((t) => /administrator/i.test(t))
  && !accessBtns.some((t) => /Remove access/.test(t)),
  accessBtns.join(' | '));

await page.locator('#access button', { hasText: 'Appoint as staff' }).click();
await page.waitForTimeout(900);
check('Appointing asks TWO questions — why this person, and under whose decision',
  asked.length === 2, asked.length);
check('...the second being about authority, not a repeat of the first',
  /whose decision/i.test(asked[1] || ''), asked[1]);
const meta = await page.textContent('#learnerMeta');
check('The appointment takes effect on the record', /staff/.test(meta || ''), (meta || '').trim());

// --- The appointment is READABLE afterwards ---------------------------
// role_events was written and unit-tested from the day it was added,
// and for that whole time no page displayed it. An accountability
// record nobody can read without a database query does not do the job
// it exists for, so this asserts the trail is on the page.
await page.waitForTimeout(600);
const appts = await page.locator('#appointments > div').allTextContents();
check('The appointment appears on the record, not only in the database', appts.length >= 1, appts.length);
check('...showing the transition, so a demotion reads differently from a promotion',
  /Learner\s*→\s*Staff/.test(appts[0] || ''), (appts[0] || '').slice(0, 60));
check('...naming who made it', /admin@example\.com/.test(appts[0] || ''), (appts[0] || '').slice(0, 100));
check('...with the reason', /Level II cohort/.test(appts[0] || ''), (appts[0] || '').slice(0, 140));
check('...and the authority on its own line, since that is the line people look for',
  /Authority: Board minute 2026-03/.test(appts[0] || ''), (appts[0] || '').slice(0, 200));

// Enrolment history and appointments are separate sections on purpose:
// what one learner may study and what one person may do to everybody
// else's records are different questions with different readers.
const enrolHist = await page.locator('#history > div').allTextContents();
check('Appointments are kept out of the enrolment history, not merged into it',
  !enrolHist.some((t) => /Board minute/.test(t)), enrolHist.length);

// --- The register keeps up with an appointment ------------------------
// A register that is right only until somebody uses the page is a
// register nobody can trust, so this is asserted against the list read
// at load time rather than merely "is non-empty".
const register = await page.locator('#register button').allTextContents();
check('The register grows when someone is appointed', register.length === register0.length + 1,
  `${register0.length} -> ${register.length}`);
check('...and the person just appointed is in it',
  register.some((t) => /learner@example\.com|demo@example\.com/.test(t)), register.join(' | '));

await page.locator('#register button').first().click();
await page.waitForTimeout(600);
check('Clicking someone in the register opens their record',
  (await page.locator('#learnerCard').isVisible()) === true);

// Nobody may change their own access, so the block must not be offered
// on the viewer's own record — a control that always fails is not one.
await page.fill('#q', 'admin@');
await page.locator('#searchForm button[type=submit]').click();
await page.waitForTimeout(500);
await page.locator('#results button').first().click();
await page.waitForTimeout(600);
check('The access controls are NOT offered on your own record',
  (await page.locator('#accessBlock').isVisible()) === false);

check('No uncaught script errors', errs.length === 0, errs.slice(0, 2).join(' | '));
await page.screenshot({ path: join(HERE, 'screenshots', 'admin-enrolments.png'), fullPage: true }).catch(() => {});

console.log(`\n${pass} passed, ${fail} failed.`);
await browser.close();
server.kill();
process.exit(fail ? 1 : 0);
