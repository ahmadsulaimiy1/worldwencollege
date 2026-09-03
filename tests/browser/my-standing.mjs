// Run with: node tests/browser/my-standing.mjs
//
// WHERE I STAND, in a real browser, against the real measurement engine.
//
// The assertions here are almost all about ONE rule, because the page
// exists to honour it: a learner must never be told they fell short of
// a record the COLLEGE has not made.
//
// Four of the six level gates are examination records the schema does
// not hold. They come back `met: null` with `owner: 'college'`, and if
// this page put them in the same list as the learner's own outstanding
// work it would be reporting the platform's unfinished business as
// somebody's academic shortfall. So:
//
//   · the two groups are separate and both are headed in words;
//   · nothing owned by the College appears in the learner's group;
//   · the College's group carries the sentence saying so.
//
// And the null-is-not-zero rule, which is the same argument about a
// different quantity: a GPA with nothing conferred prints a sentence,
// a skill nothing evidences prints why, and neither prints 0.
import { chromium } from 'playwright';
import { spawn } from 'node:child_process';
import { existsSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const HERE = dirname(fileURLToPath(import.meta.url));
const PORT = process.env.LAB_PORT || 8836;
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

const standing = await (await fetch(`${BASE}/api/student/standing`)).json();
const achievements = await (await fetch(`${BASE}/api/student/achievements`)).json();
const current = standing.levels.find((l) => l.enrolment && l.enrolment.status === 'active')
  || standing.levels[standing.levels.length - 1];

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
  await page.waitForTimeout(1100);
  return page;
}

const textOf = async (page, sel) => {
  const n = page.locator(sel);
  return (await n.count()) ? ((await n.first().textContent()) || '').trim() : '';
};

// ── The standing plate ──────────────────────────────────────────────
{
  const page = await open('/my-standing.html');

  check('the standing plate is shown', !(await page.locator('#secStanding').isHidden()));
  check('the band is stated in words', (await textOf(page, '[data-standing-band]')).length > 3);
  check('the regulation version every figure was computed under is named',
    (await textOf(page, '[data-regulation]')) === standing.regulationVersion,
    await textOf(page, '[data-regulation]'));

  // NULL IS NOT ZERO.
  const gpa = await textOf(page, '[data-gpa]');
  if (Number.isFinite(standing.gpa && standing.gpa.cumulative)) {
    check('a computed GPA is printed as a figure', gpa === standing.gpa.cumulative.toFixed(2), gpa);
  } else {
    check('a GPA with nothing conferred is a sentence, never 0.00',
      gpa.length > 10 && gpa !== '0.00', gpa);
  }
  await page.close();
}

// ── The level, and the marks under it ───────────────────────────────
{
  const page = await open('/my-standing.html');

  check('the page shows the level the engine itself calls current',
    (await textOf(page, '[data-level-title]')).includes(current.name), await textOf(page, '[data-level-title]'));
  check('every module of the level is listed',
    (await page.locator('[data-modules] tr').count()) === current.modules.length);
  check('a level mark that cannot be computed says WHICH record is missing, not 0%',
    current.levelMark.state === 'marked'
      ? (await textOf(page, '[data-level-mark]')).includes(String(current.levelMark.mark))
      : /recorded|complete/i.test(await textOf(page, '[data-level-mark]')),
    await textOf(page, '[data-level-mark]'));

  check('all four skills are listed', (await page.locator('.std-skills li').count()) === 4);
  const unmapped = current.skills.filter((s) => !Number.isFinite(s.mark)).length;
  check('a skill with no mark is drawn as unmapped and says why',
    (await page.locator('.std-skills li[data-unmapped]').count()) === unmapped
    && (unmapped === 0 || (await textOf(page, '.std-skills li[data-unmapped]')).length > 30));
  check('...and never prints 0% for it',
    !(await textOf(page, '.std-skills')).includes('0%')
    || current.skills.some((s) => s.mark === 0));
  await page.close();
}

// ── THE ARGUMENT: two groups, and whose is whose ────────────────────
{
  const page = await open('/my-standing.html');
  const g = current.graduation;
  const owedLearner = g.outstandingConditions.filter((c) => c.owner === 'learner');
  const owedCollege = g.outstandingConditions.filter((c) => c.owner !== 'learner');

  check('the conditions section is shown', !(await page.locator('#secConditions').isHidden()));
  check('the learner\'s group holds exactly what the engine says is theirs',
    (await page.locator('[data-learner-conditions] li').count()) === owedLearner.length,
    String(owedLearner.length));
  check('the College\'s group holds exactly what the engine says is the College\'s',
    (await page.locator('[data-college-conditions] li').count()) === owedCollege.length,
    String(owedCollege.length));

  // The fault this page exists to avoid.
  if (owedCollege.length) {
    const learnerText = await textOf(page, '[data-learner-conditions]');
    const collegeLabels = owedCollege.map((c) => c.label);
    check('NOTHING the College owes appears in the learner\'s own list',
      collegeLabels.every((l) => !learnerText.includes(l)),
      collegeLabels.find((l) => learnerText.includes(l)));
    check('...and the College\'s group says in words that none of it counts against the reader',
      /nothing here is your work|does not count|counts against|still owes/i.test(await textOf(page, '#grpCollege')),
      await textOf(page, '.std-group__note'));
    check('...under a heading that names whose it is rather than relying on a colour',
      (await textOf(page, '.std-group__head--ours')).length > 8,
      await textOf(page, '.std-group__head--ours'));
  }

  // Three states, not two.
  check('a condition nobody can yet judge is drawn as unknown, not as failed',
    (await page.locator('.std-conditions li[data-met="unknown"]').count())
      === g.conditions.filter((c) => c.met === null).length);
  await page.close();
}

// ── Milestones ──────────────────────────────────────────────────────
{
  const page = await open('/my-standing.html');
  const total = achievements.earned.length + achievements.unearned.length
    + achievements.withdrawn.length + achievements.notInForce.length;
  check('every milestone in the register is accounted for, held or not',
    (await page.locator('[data-milestones] li').count()) === total, String(total));

  if (achievements.unearned.length) {
    const first = achievements.unearned[0];
    check('a milestone not yet held names the SHORTFALL rather than sitting blank',
      (await textOf(page, '[data-milestones] li[data-kind="unearned"]')).length
        > first.name.en.length + 20);
  }
  if (achievements.withdrawn.length) {
    check('a withdrawn milestone carries its reason',
      /—/.test(await textOf(page, '[data-milestones] li[data-kind="withdrawn"]')));
  }
  check('the register says how much of itself is adopted and in force',
    (await textOf(page, '[data-register-note]')).length > 20);
  await page.close();
}

// ── Both editions, three widths, both directions ────────────────────
for (const [path, dirn] of [['/my-standing.html', 'ltr'], ['/ar/my-standing.html', 'rtl']]) {
  for (const w of [1440, 900, 390]) {
    const page = await open(path, { width: w, height: 900 });
    const over = await page.evaluate(() =>
      document.documentElement.scrollWidth - document.documentElement.clientWidth);
    check(`${dirn} ${w}: no horizontal overflow`, over <= 0, `${over}px`);
    check(`${dirn} ${w}: the module table scrolls inside its own box`,
      (await page.evaluate(() => {
        const box = document.querySelector('.acc-tablewrap');
        return box ? getComputedStyle(box).overflowX : null;
      })) === 'auto');
    await page.close();
  }
}

check('no console errors or page errors anywhere', errs.length === 0, errs.slice(0, 4).join(' | '));

await browser.close();
if (server) server.kill();
console.log(`\n${pass} passed, ${fail} failed.`);
process.exit(fail ? 1 : 0);
