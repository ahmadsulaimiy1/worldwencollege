// Run with: node tests/browser/listening-lab.mjs
//
// Browser test for the Listening Lab. Unlike the rest of tests/, this
// one needs a browser and a server, so it is not part of tests/run.mjs
// — run it explicitly (see tests/README.md).
//
// It starts tests/browser/lab-server.mjs, which serves the real static
// files and runs the REAL functions/_lib/lms/content.js against the
// REAL seeded curriculum. So this exercises production logic and
// production content through the production page; only the HTTP shell
// is local.
//
// It asserts behaviour, not appearance: that the transcript renders from
// seeded cues, that clicking a line activates exactly one, that
// bookmarks and notes persist across a reload, that every comprehension
// question carries a cue anchor, that a real submission is scored
// server-side without the answer key ever reaching the browser, and
// that the unrecorded state is presented as a usable mode rather than an
// error. Screenshots are a by-product for human review.
import { chromium } from 'playwright';
import { spawn } from 'node:child_process';
import { mkdirSync, existsSync, readFileSync } from 'node:fs';
import { DatabaseSync } from 'node:sqlite';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const HERE = dirname(fileURLToPath(import.meta.url));
const OUT = join(HERE, 'screenshots');
const PORT = process.env.LAB_PORT || 8791;
const BASE = `http://localhost:${PORT}`;
mkdirSync(OUT, { recursive: true });

let pass = 0, fail = 0;
const check = (label, cond) => { console.log((cond ? 'PASS ' : 'FAIL ') + label); cond ? pass++ : fail++; };

const server = spawn(process.execPath, ['--experimental-sqlite', join(HERE, 'lab-server.mjs')], {
  env: { ...process.env, LAB_PORT: String(PORT) }, stdio: ['ignore', 'pipe', 'pipe'],
});
await new Promise((resolve, reject) => {
  const t = setTimeout(() => reject(new Error('server did not start')), 20000);
  server.stdout.on('data', (d) => { if (String(d).includes('ready')) { clearTimeout(t); resolve(); } });
  server.stderr.on('data', (d) => process.stderr.write(d));
});

// This environment ships a pre-installed Chromium that may not match the
// build the locally-installed Playwright expects. Prefer the provided
// binary via PW_CHROMIUM (or the known path) and fall back to
// Playwright's own resolution, so the test runs in CI and here alike
// without ever downloading a browser.
const explicit = process.env.PW_CHROMIUM || '/opt/pw-browsers/chromium-1194/chrome-linux/chrome';
// The answer key is read HERE, in the test process, from the same seed
// files the server loads — never from the page. That preserves the
// property under test (the key never reaches the browser) while keeping
// the test independent of answer POSITIONS. An earlier version hard-coded
// the indices and broke the moment the programme-wide answer-key rebalance
// permuted them; deriving it is the fix, exactly as in
// tests/curriculum-level-1.test.mjs.
function seededKey(learningItemId) {
  const mem = new DatabaseSync(':memory:');
  mem.exec(readFileSync(join(HERE, '../../sql/schema.sql'), 'utf8'));
  for (let n = 1; n <= 6; n++) mem.exec(readFileSync(join(HERE, `../../sql/seed-curriculum-level-${n}.sql`), 'utf8'));
  for (let n = 1; n <= 6; n++) {
    const p = join(HERE, `../../sql/seed-audio-level-${n}.sql`);
    if (existsSync(p)) mem.exec(readFileSync(p, 'utf8'));
  }
  const rows = mem.prepare('SELECT id, correct_index FROM quiz_questions WHERE learning_item_id = ? ORDER BY sequence ASC').all(learningItemId);
  const key = {};
  for (const r of rows) key[r.id] = r.correct_index;
  return key;
}
const LISTENING_KEY = seededKey('itm_l1_m1_listening');

const browser = await chromium.launch(existsSync(explicit) ? { executablePath: explicit } : {});
try {
  const page = await browser.newPage({ viewport: { width: 1440, height: 1000 }, deviceScaleFactor: 2 });
  // Split the two failure channels. Script errors are always the page's
  // fault; a failed network request may be the sandbox's. Console text
  // for a blocked request omits the URL, so the URL is captured from the
  // requestfailed event and the two are correlated below.
  const scriptErrors = [];
  const failedRequests = [];
  page.on('pageerror', (e) => scriptErrors.push(e.message));
  page.on('requestfailed', (r) => failedRequests.push(r.url()));

  await page.goto(`${BASE}/listening-lab.html?unit=unt_l1_m1&level=1`, { waitUntil: 'networkidle' });
  await page.waitForSelector('.cue', { timeout: 8000 });
  await page.waitForTimeout(600);
  await page.screenshot({ path: join(OUT, '01-loaded-full.png'), fullPage: true });
  await page.screenshot({ path: join(OUT, '02-loaded-fold.png') });

  // --- content comes from the seeded curriculum ------------------------
  const meta = await page.evaluate(() => ({
    variety: document.getElementById('labVariety').textContent,
    wpm: document.getElementById('labWpm').textContent,
    cues: document.querySelectorAll('.cue').length,
    speakers: [...new Set([...document.querySelectorAll('.cue__speaker')].map((e) => e.textContent))],
    questions: document.querySelectorAll('.q').length,
    replay: document.querySelectorAll('.q__replay').length,
    targets: document.querySelectorAll('.target').length,
  }));
  check(`Transcript renders all 7 seeded cues (got ${meta.cues})`, meta.cues === 7);
  check(`Speaker attribution survives to the page (${meta.speakers.join(', ')})`, meta.speakers.includes('Receptionist') && meta.speakers.includes('Sofia'));
  check('The declared English variety is shown to the learner', meta.variety === 'British English');
  check(`The intended delivery pace is shown (${meta.wpm})`, /90 words per minute/.test(meta.wpm));
  check(`All 4 comprehension questions render (got ${meta.questions})`, meta.questions === 4);
  check('Every comprehension question offers a jump to the line it tests', meta.replay === meta.questions);
  check(`The pronunciation lab's 3 targets render (got ${meta.targets})`, meta.targets === 3);

  // --- the unrecorded state is a usable mode, not an error -------------
  const unrec = await page.evaluate(() => ({
    shown: !document.getElementById('labStatus').hidden,
    text: document.getElementById('labStatusText').textContent,
    playDisabled: document.getElementById('play').disabled,
    speedDisabled: document.getElementById('speed').disabled,
    transcriptUsable: document.querySelectorAll('.cue').length > 0,
    recordEnabled: !document.getElementById('rec').disabled,
    errorEmpty: document.getElementById('labError').textContent.trim() === '',
  }));
  check('Script mode is announced explicitly to the learner', unrec.shown && /Script mode/.test(unrec.text));
  check('Script mode disables only the transport', unrec.playDisabled && unrec.speedDisabled && unrec.transcriptUsable);
  check('Script mode is not rendered as an error', unrec.errorEmpty);
  check('Recording still works when there is no recording to listen to', unrec.recordEnabled);

  // --- transcript interaction ------------------------------------------
  await page.click('.cue:nth-child(3)');
  const afterClick = await page.evaluate(() => ({
    active: document.querySelectorAll('.cue.is-active').length,
    idx: [...document.querySelectorAll('.cue')].findIndex((e) => e.classList.contains('is-active')),
    live: document.getElementById('cueLive').textContent,
  }));
  check('Selecting a line activates exactly one cue', afterClick.active === 1 && afterClick.idx === 2);
  check('The active line is announced to screen readers', /Receptionist|Sofia/.test(afterClick.live));

  // --- bookmarks + notes persist across reload -------------------------
  await page.click('.cue:nth-child(3) .cue__mark');
  await page.click('.cue:nth-child(5) .cue__mark');
  await page.fill('#notes', 'I heard "class is in" as one word — that linking is my target.');
  await page.waitForTimeout(800);
  await page.screenshot({ path: join(OUT, '03-bookmarks-notes.png'), fullPage: true });
  const marksBefore = await page.evaluate(() => document.querySelectorAll('#marks li button:first-child').length);
  check(`Two bookmarks recorded (got ${marksBefore})`, marksBefore === 2);

  await page.reload({ waitUntil: 'networkidle' });
  await page.waitForSelector('.cue');
  await page.waitForTimeout(500);
  const persisted = await page.evaluate(() => ({
    marks: document.querySelectorAll('#marks li button:first-child').length,
    notes: document.getElementById('notes').value,
    pressed: document.querySelectorAll('.cue__mark[aria-pressed="true"]').length,
  }));
  check(`Bookmarks survive a reload (got ${persisted.marks})`, persisted.marks === 2);
  check('Bookmark buttons restore their pressed state', persisted.pressed === 2);
  check('Notes survive a reload', /linking is my target/.test(persisted.notes));

  // --- comprehension is graded server-side ------------------------------
  const picked = await page.evaluate((key) => {
    let n = 0;
    for (const [qid, idx] of Object.entries(key)) {
      const el = document.querySelector(`input[name="${qid}"][value="${idx}"]`);
      if (el) { el.checked = true; n++; }
    }
    return n;
  }, LISTENING_KEY);
  check(`All four questions could be answered (key read from the seed, not the page)`, picked === 4);
  const leaked = await page.evaluate(() => /correctIndex|correct_index/.test(JSON.stringify(window.__lab.item.questions)));
  check('The answer key is never delivered to the browser', leaked === false);

  await page.click('#submitQuiz');
  await page.waitForFunction(() => /%/.test(document.getElementById('quizResult').textContent), { timeout: 5000 });
  const result = (await page.textContent('#quizResult')).trim();
  check(`A real submission is scored server-side ("${result.slice(0, 34)}…")`, /100%/.test(result) && /passed/.test(result));
  await page.locator('#qH').scrollIntoViewIfNeeded();
  await page.waitForTimeout(400);
  await page.screenshot({ path: join(OUT, '04-comprehension-scored.png') });

  // --- an incomplete submission is refused before it reaches the server -
  await page.reload({ waitUntil: 'networkidle' });
  await page.waitForSelector('.q');
  await page.click('#submitQuiz');
  const guard = (await page.textContent('#quizResult')).trim();
  check('An incomplete answer set is refused with a count', /still unanswered/.test(guard));

  // Scoped to first-party failures. This sandbox has no route to
  // fonts.googleapis.com, so the webfont request always fails here; that
  // is an environment fact, not a defect, and the page is designed to
  // fall back through the font stack in brand.css. Any OTHER console
  // error still fails the test — the filter names exactly one host
  // rather than muting the channel.
  check(`No uncaught script errors${scriptErrors.length ? ' — ' + scriptErrors.slice(0, 2).join(' | ') : ''}`, scriptErrors.length === 0);
  const nonFont = failedRequests.filter((u) => !/fonts\.(googleapis|gstatic)\.com/.test(u));
  const fontFails = failedRequests.length - nonFont.length;
  check(`Every failed request is an external webfont the sandbox blocks${nonFont.length ? ' — also failed: ' + nonFont.slice(0, 2).join(', ') : ''}${fontFails ? ` (${fontFails} font request(s))` : ''}`, nonFont.length === 0);

  // The webfont being unreachable must not leave the page unstyled.
  const typography = await page.evaluate(() => {
    const t = getComputedStyle(document.querySelector('.lab-title')).fontFamily;
    const b = getComputedStyle(document.body).fontFamily;
    return { title: t, body: b };
  });
  check(`Display type falls back through a real serif stack (${typography.title.split(',').slice(0, 2).join(',')})`, /serif|Georgia|Playfair/i.test(typography.title));

  const focusable = await page.evaluate(() => {
    document.querySelector('.cue').focus();
    return document.activeElement.classList.contains('cue');
  });
  check('Transcript lines are keyboard focusable', focusable === true);

  // --- C2 module, mobile, reduced motion --------------------------------
  const mob = await browser.newPage({ viewport: { width: 390, height: 900 }, deviceScaleFactor: 2, reducedMotion: 'reduce' });
  await mob.goto(`${BASE}/listening-lab.html?unit=unt_l6_m10&level=6`, { waitUntil: 'networkidle' });
  await mob.waitForSelector('.cue');
  await mob.waitForTimeout(500);
  await mob.screenshot({ path: join(OUT, '05-mobile-reduced-motion.png'), fullPage: true });
  const mobState = await mob.evaluate(() => ({
    cues: document.querySelectorAll('.cue').length,
    wpm: document.getElementById('labWpm').textContent,
    opacity: getComputedStyle(document.querySelector('.lab-card')).opacity,
    noOverflow: document.documentElement.scrollWidth <= window.innerWidth + 1,
  }));
  check(`The C2 capstone listening renders on mobile (${mobState.cues} cues)`, mobState.cues === 10);
  check(`C2 pace is carried through (${mobState.wpm})`, /158 words per minute/.test(mobState.wpm));
  check('Cards are fully visible under reduced motion — nothing depends on a transition having run', mobState.opacity === '1');
  check('No horizontal overflow at 390px', mobState.noOverflow === true);

  // Submitting the comprehension quiz ON A PHONE. This is where the
  // desktop tests were blind: at 1440px the result box is already on
  // screen, so "the score appears" passed while a real learner on a
  // real phone tapped Submit, was graded correctly, and saw nothing —
  // the result sits below a full screen of questions.
  //
  // Assert what the learner actually experiences: after submitting, the
  // outcome is IN THE VIEWPORT. Not merely that the text changed.
  const before = await mob.evaluate(() => {
    document.querySelectorAll('#questions .q').forEach((q) => {
      const first = q.querySelector('input[type=radio]');
      if (first) first.checked = true;
    });
    // Back to the top, so the result is genuinely off-screen when the
    // quiz is submitted. Without this the test proves nothing.
    window.scrollTo(0, 0);
    const r = document.getElementById('quizResult').getBoundingClientRect();
    return { resultVisible: r.top < window.innerHeight && r.bottom > 0 };
  });
  // The precondition, asserted rather than assumed: if the result were
  // already on screen there would be nothing to scroll and the check
  // below would pass for the wrong reason.
  check('Precondition: at 390px the result starts below the fold', before.resultVisible === false);

  // Clicked from inside the page, NOT via Playwright's locator.click().
  // Playwright scrolls an element into view before clicking it, which
  // drags the result box up as a side effect — the first version of
  // this test passed even with the fix removed, for exactly that
  // reason. A real thumb does not scroll the page before tapping.
  await mob.evaluate(() => document.getElementById('submitQuiz').click());
  await mob.waitForTimeout(1200);
  const resultView = await mob.evaluate(() => {
    const el = document.getElementById('quizResult');
    const r = el.getBoundingClientRect();
    return {
      text: el.textContent.trim(),
      inViewport: r.top < window.innerHeight && r.bottom > 0,
    };
  });
  check(`The score is reported on mobile (${resultView.text.slice(0, 24)}…)`, /%/.test(resultView.text));
  check('...and is scrolled into view, not left below the fold', resultView.inViewport === true,
    `"${resultView.text.slice(0, 40)}" out of view`);
  await mob.screenshot({ path: join(OUT, '05b-mobile-quiz-result.png') });

  // --- listening progress panel ----------------------------------------
  const prog = await page.evaluate(() => ({
    tiles: document.querySelectorAll('#lpSummary div').length,
    rows: document.querySelectorAll('#lpModules .prog__row').length,
    notAttempted: [...document.querySelectorAll('.prog__v')].filter((e) => e.dataset.none === 'true').length,
    meta: document.getElementById('lpMeta').textContent,
  }));
  check(`Listening progress shows all 10 modules of the level (got ${prog.rows})`, prog.rows === 10);
  check('Coverage and outcome are reported as separate figures', prog.tiles === 3);
  check('An unattempted listening reads "not attempted", never 0%', prog.notAttempted >= 1);

  // --- download management ----------------------------------------------
  const dl = await page.evaluate(() => ({
    disabled: document.getElementById('dl').disabled,
    state: document.getElementById('dlState').textContent,
  }));
  check('Download is disabled in script mode and explains why', dl.disabled === true && /has not been made/.test(dl.state));

  // --- loading states ----------------------------------------------------
  const skel = await page.evaluate(() => document.querySelectorAll('.lab-skel').length);
  check(`Skeletons are replaced once content arrives (${skel} remaining)`, skel === 0);

  await page.screenshot({ path: join(OUT, '06-progress-and-download.png'), fullPage: true });

  // --- instructor workspace ---------------------------------------------
  const staff = await browser.newPage({ viewport: { width: 1280, height: 1000 }, deviceScaleFactor: 1 });
  const staffErrors = [];
  staff.on('pageerror', (e) => staffErrors.push(e.message));
  // Seed a submission so the queue has something real in it.
  await staff.goto(`${BASE}/listening-lab.html?unit=unt_l1_m2&level=1`, { waitUntil: 'networkidle' });
  await staff.evaluate(() => fetch('/api/lms/recording', {
    method: 'POST', headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ learningItemId: 'itm_l1_m2_pronunciation', mediaUrl: 'blob:demo-take-1', durationMs: 9200 }),
  }).then((r) => r.json()));

  await staff.goto(`${BASE}/instructor-review.html`, { waitUntil: 'networkidle' });
  await staff.waitForSelector('article.lab-card', { timeout: 8000 });
  const q = await staff.evaluate(() => ({
    cards: document.querySelectorAll('article.lab-card').length,
    sliders: document.querySelectorAll('article input[type=range]').length,
    targets: document.querySelectorAll('article .target').length,
    count: document.getElementById('qCount').textContent,
  }));
  check(`The review queue renders a real pending submission (${q.cards})`, q.cards === 1);
  check('Each submission is scored on the five profile dimensions', q.sliders === 5);
  check('The drill targets the learner worked against are shown to the reviewer', q.targets >= 2);
  check(`The queue reports its depth (${q.count})`, /awaiting review/.test(q.count));
  await staff.screenshot({ path: join(OUT, '07-instructor-queue.png'), fullPage: true });

  // submit a real review and confirm it clears
  await staff.click('article .tbtn--primary');
  await staff.waitForFunction(() => document.querySelectorAll('article.lab-card').length === 0, { timeout: 6000 });
  const cleared = await staff.evaluate(() => document.getElementById('qCount').textContent);
  check(`Sending feedback clears the item from the queue (${cleared})`, /queue clear/.test(cleared));
  check(`No script errors in the instructor workspace${staffErrors.length ? ' — ' + staffErrors[0] : ''}`, staffErrors.length === 0);
  await staff.screenshot({ path: join(OUT, '08-instructor-cleared.png') });

  console.log(`\nScreenshots written to ${OUT}`);
} finally {
  await browser.close();
  server.kill();
}

console.log(`\n${pass} passed, ${fail} failed.`);
process.exit(fail ? 1 : 0);
