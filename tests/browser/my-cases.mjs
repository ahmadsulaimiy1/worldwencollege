// Run with: node tests/browser/my-cases.mjs
//
// MY CASES, in a real browser, against the real registrar module.
//
// Four things are being proved, and they are all about whether a
// learner can actually USE a procedure the College has adopted.
//
//   THE LADDER IS PUBLISHED BEFORE THE FORM. The three stages, who
//   hears each and how long each takes, are on the page before anything
//   is asked for — and they are the ENDPOINT'S words, not the page's.
//   This suite reads `procedure` from the API and requires the same
//   sentences on screen, so a page that paraphrased the instrument
//   would fail.
//
//   THE UNPUBLISHED INTERVAL STAYS UNPUBLISHED. Stage three has no
//   adopted interval and the payload sends null. A page that rounded
//   that to a number would be adopting one on the Board's behalf, so
//   this suite requires the self-binding sentence and requires the
//   published intervals NOT to be claimed for it.
//
//   THE CLOCK RUNS AND THE TRAIL IS WHOLE. A live case shows the day an
//   answer is owed; every stage change shows the post that made it.
//
//   THE TWO ACTS ARE THE LEARNER'S. An answered case offers escalation
//   and a live one offers withdrawal, and both are driven through the
//   interface here rather than asserted about in a unit test.
import { chromium } from 'playwright';
import { spawn } from 'node:child_process';
import { existsSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const HERE = dirname(fileURLToPath(import.meta.url));
const PORT = process.env.LAB_PORT || 8843;
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

const listed = await (await fetch(`${BASE}/api/student/cases`)).json();
const refs = await (await fetch(`${BASE}/__demo-cases`)).json();

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
  await page.waitForTimeout(1500);
  return page;
}

const textOf = async (page, sel) => {
  const n = page.locator(sel);
  return (await n.count()) ? ((await n.first().textContent()) || '').trim() : '';
};

check('The endpoint carries the whole ladder on the LIST, not only on a case',
  Array.isArray(listed.procedure && listed.procedure.stages)
  && listed.procedure.stages.length === 3,
  `${listed.procedure && listed.procedure.stages && listed.procedure.stages.length} stages`);

const page = await open_('/my-cases.html');
const body = await page.locator('#secLadder').textContent();

// ── The published ladder ────────────────────────────────────────────
{
  check('The rule the whole procedure is built on is on the page, in the instrument’s words',
    (await textOf(page, '[data-principle]')) === listed.procedure.principle);
  check('The instrument is named and dated',
    (await textOf(page, '[data-instrument]')) === listed.procedure.instrument,
    await textOf(page, '[data-instrument]'));
  check('Three rungs are drawn', (await page.locator('.cse-rung').count()) === 3);

  for (const st of listed.procedure.stages) {
    check(`Stage ${st.stage} carries the College’s own published sentence`,
      body.includes(st.published.slice(0, 60)),
      st.published.slice(0, 60));
  }
  check('The published intervals are printed as working days',
    body.includes('10 working days') && body.includes('20 working days'));
  check('The stage with no published interval says so and names the self-binding one',
    /No interval published/.test(body) && body.includes('holds itself to 20 working days'),
    body.slice(body.indexOf('No interval') - 20, body.indexOf('No interval') + 90));
  check('Both stage-three routings are named, because a list spans several matters',
    body.includes('Governor for Academic Affairs')
    && body.includes('Governor for Ethics and Institutional Values'));
  check('The end of the chain is stated rather than implied',
    (await textOf(page, '[data-external]')).includes('not independent of the institution'));
}

// ── The list ────────────────────────────────────────────────────────
{
  check('Every case the learner has is listed',
    (await page.locator('.cse-row').count()) === listed.cases.length,
    `${await page.locator('.cse-row').count()} of ${listed.cases.length}`);
  const marks = (await page.locator('.cse-row__marks').allTextContents()).join(' | ');
  check('Each case states what kind it is and what it concerns',
    marks.includes('Appeal') && marks.includes('Deferral')
    && marks.includes('Complaint') && marks.includes('Transfer'), marks.slice(0, 160));
  check('An answered case shows its outcome on the list',
    marks.includes('Partly upheld'), marks.slice(0, 200));
  const refsOnPage = (await page.locator('.cse-row__ref').allTextContents()).join(' ');
  check('Each case carries the reference the learner quotes back',
    refsOnPage.includes(refs.answered) && refsOnPage.includes(refs.received));
}

// ── One case, its clock and its trail ───────────────────────────────
{
  await page.locator('.cse-row__open', { hasText: 'The Unit 7 speaking mark' }).click();
  await page.waitForTimeout(900);
  check('The case opens in place', await page.locator('#secCase').isVisible());
  check('The reference is on the plate',
    (await textOf(page, '[data-case-ref]')).includes(refs.stageOne),
    await textOf(page, '[data-case-ref]'));
  check('A live case shows the day an answer is owed',
    /An answer is owed by/.test(await textOf(page, '[data-clock-due]')),
    await textOf(page, '[data-clock-due]'));
  check('...and says on what basis that day was set',
    (await textOf(page, '[data-clock-basis]')).length > 0,
    await textOf(page, '[data-clock-basis]'));
  check('The trail shows both moves, opening and routing',
    (await page.locator('.cse-trail__item').count()) === 2,
    `${await page.locator('.cse-trail__item').count()} entries`);
  const posts = (await page.locator('.cse-trail__post').allTextContents()).join(' | ');
  check('Every move names the POST that made it, never an account id',
    posts.includes('You') && posts.includes('The Registrar')
    && !(await page.content()).includes('usr_admin'), posts);
  check('A live case may be withdrawn and offers no escalation yet',
    await page.locator('[data-withdraw]').isVisible()
    && await page.locator('[data-escalate]').isHidden());
}

// ── The answered case ───────────────────────────────────────────────
{
  await page.locator('[data-case-close]').click();
  await page.locator('.cse-row__open', { hasText: 'A tutorial hour cancelled twice' }).click();
  await page.waitForTimeout(900);
  check('An answered case prints the outcome in the vocabulary of its kind',
    (await textOf(page, '[data-answer-outcome]')).includes('Partly upheld'),
    await textOf(page, '[data-answer-outcome]'));
  check('...and the reasons given with it',
    (await textOf(page, '[data-answer-decision]')).includes('no notice was given'));
  check('...and the stage it was determined at',
    (await textOf(page, '[data-answer-meta]')).includes('Stage one'),
    await textOf(page, '[data-answer-meta]'));
  check('An answered case offers the next stage, and says whose decision that is',
    await page.locator('[data-escalate]').isVisible()
    && (await textOf(page, '[data-escalate-why]')).includes('your decision'),
    await textOf(page, '[data-escalate-why]'));

  // Empty first: the note is required by the module and the page must
  // say so itself rather than discovering it as a 422.
  await page.locator('[data-escalate-send]').click();
  await page.waitForTimeout(500);
  check('Escalating with no reason is refused on the page, not by the server',
    (await textOf(page, '[data-case-error]')).length > 0
    && (await textOf(page, '[data-clock-stage]')).includes('Determined'),
    await textOf(page, '[data-case-error]'));

  await page.fill('[data-escalate-note]', 'The answer does not address the rubric point, which is the whole of what I raised.');
  await page.locator('[data-escalate-send]').click();
  await page.waitForTimeout(1400);
  check('Escalating moves the case to stage two on the record',
    (await textOf(page, '[data-clock-stage]')).includes('Stage two'),
    await textOf(page, '[data-clock-stage]'));
  const after = await (await fetch(`${BASE}/api/student/cases?case=${refs.answered}`)).json();
  check('...and the server agrees', after.stage === 'stage_two', after.stage);
  check('The trail records who escalated it and why',
    (await page.locator('.cse-trail__item').count()) >= 4,
    `${await page.locator('.cse-trail__item').count()} entries`);
}

// ── The closed case ─────────────────────────────────────────────────
{
  await page.locator('[data-case-close]').click();
  await page.locator('.cse-row__open', { hasText: 'Moving from Level I to Level II' }).click();
  await page.waitForTimeout(900);
  check('A withdrawn case says it was withdrawn by the learner',
    (await textOf(page, '[data-answer-outcome]')).includes('Withdrawn by you'),
    await textOf(page, '[data-answer-outcome]'));
  check('A closed case offers neither act',
    await page.locator('[data-escalate]').isHidden()
    && await page.locator('[data-withdraw]').isHidden());
}

// ── Opening one ─────────────────────────────────────────────────────
{
  await page.locator('[data-case-close]').click();
  await page.locator('[data-open-form]').click();
  await page.waitForTimeout(400);
  const kinds = await page.locator('[data-kind] option').count();
  const matters = await page.locator('[data-matter] option').count();
  check('The kinds and matters offered are the endpoint’s vocabulary',
    kinds === listed.kinds.length && matters === listed.matters.length,
    `${kinds} kinds, ${matters} matters`);
  check('The form says what naming the matter actually does',
    (await textOf(page, '[data-matter-note]')).includes('routes stage three'),
    await textOf(page, '[data-matter-note]'));
  check('The form says the College asks for no fee and no document',
    (await textOf(page, '[data-form-why]')).includes('no document'),
    await textOf(page, '[data-form-why]'));
  // The levels offered are the learner's own, read from the standing
  // endpoint — a form offering a level nobody is enrolled on discovers
  // by refusal what it should have known.
  // Counted from the standing endpoint rather than typed here — the
  // harness's learner was enrolled on all six levels until a checkout
  // needed one left to buy, and an assertion mirroring a fixture is the
  // one that breaks when the fixture changes for a good reason. The
  // extra option is "not about a level", which every case may be.
  const held = (await (await fetch(`${BASE}/api/student/standing`)).json())
    .levels.filter((l) => l.enrolment).length;
  check('The levels offered are the learner’s own enrolments, and nothing else',
    (await page.locator('[data-level] option').count()) === held + 1,
    `${await page.locator('[data-level] option').count()} options against ${held} enrolments`);

  await page.selectOption('[data-kind]', 'complaint');
  await page.waitForTimeout(200);
  check('Choosing a kind explains it in plain words',
    (await textOf(page, '[data-kind-note]')).includes('put it right'),
    await textOf(page, '[data-kind-note]'));

  await page.fill('[data-summary]', 'The listening laboratory would not accept my recording');
  await page.fill('[data-detail]', 'Three attempts on two days, each ending with the upload failing after the recording had finished. I have the recordings and can send them.');
  await page.locator('[data-form-send]').click();
  await page.waitForTimeout(1600);
  check('The new case is opened and shown at once, with its reference',
    (await textOf(page, '[data-case-ref]')).includes('CMP-'),
    await textOf(page, '[data-case-ref]'));
  const now = await (await fetch(`${BASE}/api/student/cases`)).json();
  check('...and it is on the record', now.cases.length === listed.cases.length + 1,
    `${now.cases.length} cases`);
  check('The acknowledgement clock starts the moment the case exists',
    /An answer is owed by/.test(await textOf(page, '[data-clock-due]')),
    await textOf(page, '[data-clock-due]'));
}

// ── Refusing an empty case before it costs a round trip ─────────────
{
  await page.locator('[data-case-close]').click();
  await page.locator('[data-open-form]').click();
  await page.fill('[data-summary]', '');
  await page.fill('[data-detail]', '');
  await page.locator('[data-form-send]').click();
  await page.waitForTimeout(400);
  check('An empty case is refused on the page, with the reason',
    (await textOf(page, '[data-form-error]')).length > 0,
    await textOf(page, '[data-form-error]'));
}

// ── Arabic, and the geometry ────────────────────────────────────────
{
  const ar = await open_('/ar/my-cases.html');
  check('The Arabic edition is right to left',
    await ar.evaluate(() => document.documentElement.dir === 'rtl'));
  check('The Arabic edition draws the same three rungs',
    (await ar.locator('.cse-rung').count()) === 3);
  check('The Arabic edition lists the cases',
    (await ar.locator('.cse-row').count()) >= 4,
    `${await ar.locator('.cse-row').count()} listed`);
  // THE INSTRUMENT ITSELF, IN ARABIC. The College publishes Decision E2
  // in both languages on /students/regulations/, and the module now
  // carries both editions — so an Arabic reader must not be shown the
  // English ladder right-aligned with its full stops at the head of the
  // line, which is what they were shown before this check existed.
  const arLadder = await ar.locator('#secLadder').textContent();
  check('The Arabic edition publishes the ladder in Arabic',
    /اكتب إلى الكلية خلال عشرين يوم عمل/.test(arLadder)
    && !/Write to the College/.test(arLadder));
  check('...in the site’s own published vocabulary for its standing bodies',
    arLadder.includes('المجلس الأكاديمي') && arLadder.includes('أمين الشؤون الأكاديمية')
    && !arLadder.includes('مجلس الشيوخ'));
  check('The Arabic edition names the instrument in Arabic',
    (await ar.locator('[data-instrument]').textContent()).includes('القرار E2'),
    await ar.locator('[data-instrument]').textContent());
  const groundOf = (p, sel) => p.evaluate(
    (s) => getComputedStyle(document.querySelector(s)).backgroundImage, sel);
  check('The dark plate paints the same ground in both editions',
    (await groundOf(page, '#secForm')) === (await groundOf(ar, '#secForm')));
  await ar.close();
}

for (const w of [1440, 900, 390]) {
  for (const path of ['/my-cases.html', '/ar/my-cases.html']) {
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
