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
  // --- Time on task --------------------------------------------------
  // The measured-hours commitment (docs/academic-framework.md § I) is
  // worth exactly as much as the beacon feeding it. A file that loads
  // and never fires is the same defect as the Lab that rendered
  // perfectly and sent no Authorization header, so this asserts a beat
  // actually reached the server from a real browser.
  {
    const res = await fetch(`${BASE}/__beats`);
    const { beats } = await res.json();
    check('Opening a module starts the time-on-task measurement',
      beats.length >= 1, JSON.stringify(beats).slice(0, 120));
    check('...identifying the module being studied',
      beats.every((b) => typeof b.unitId === 'string' && b.unitId.length > 0),
      JSON.stringify(beats[0] || {}));
    // The decision the whole measurement rests on: the browser never
    // says how long it studied, so the published figure cannot be
    // edited from a console.
    check('...and sends NO duration — the server times it, not the client',
      beats.length > 0 && beats.every((b) => Object.keys(b).length === 1 && 'unitId' in b),
      JSON.stringify(beats[0] || {}));
  }

  check(`No uncaught script errors${scriptErrors.length ? ' — ' + scriptErrors.slice(0, 2).join(' | ') : ''}`, scriptErrors.length === 0);
  // The time-on-task beacon is deliberately fire-and-forget, and its
  // final beat is sent as the page is being torn down. A navigation
  // cancelling that request is the expected path, not a defect — the
  // beat is sent with keepalive precisely so the browser may still
  // deliver it, and a learner must never see an error because our
  // bookkeeping request lost a race with their click.
  //
  // Named as one endpoint rather than muting the channel: any OTHER
  // first-party request that fails still fails this test.
  const nonFont = failedRequests.filter((u) =>
    !/fonts\.(googleapis|gstatic)\.com/.test(u) && !/\/api\/lms\/time-on-task/.test(u));
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

  // The standalone instructor workspace is gone; /staff-marking.html
  // absorbed it. The recording queue is the second half of the marking
  // console, on the College's own chrome and inside the staff
  // navigation, rather than an address a tutor had to be told.
  await staff.goto(`${BASE}/staff-marking.html`, { waitUntil: 'networkidle' });
  await staff.waitForSelector('[data-spoken-queue] .stf-item', { timeout: 8000 });
  const q = await staff.evaluate(() => ({
    cards: document.querySelectorAll('[data-spoken-queue] .stf-item').length,
    sliders: document.querySelectorAll('[data-spoken-queue] .stf-item input[type=range]').length,
    targets: (document.querySelector('[data-spoken-queue] .stf-rubric') || {}).textContent || '',
    count: (document.querySelector('[data-tile="spoken"] [data-count]') || {}).textContent,
  }));
  check(`The review queue renders a real pending submission (${q.cards})`, q.cards === 1);
  check('Each submission is scored on the five profile dimensions', q.sliders === 5);
  check('The drill targets the learner worked against are shown to the reviewer',
    q.targets.trim().length > 10, q.targets.slice(0, 60));
  check(`The queue reports its depth (${q.count})`, q.count === '1');
  await staff.screenshot({ path: join(OUT, '07-instructor-queue.png'), fullPage: true });

  // Submit a real review and confirm it clears. The console requires a
  // reason with every review, which the standalone workspace did not —
  // a score with nothing behind it is a score a learner cannot act on.
  await staff.fill('[data-spoken-queue] .stf-item textarea',
    'Clear and audible. The country name is stressed on the wrong syllable — that is the one thing to change.');
  await staff.click('[data-spoken-queue] .stf-item button.btn--gold');
  await staff.waitForFunction(
    () => document.querySelectorAll('[data-spoken-queue] .stf-item').length === 0,
    { timeout: 8000 },
  );
  const cleared = await staff.evaluate(
    () => (document.querySelector('[data-tile="spoken"] [data-count]') || {}).textContent,
  );
  check(`Sending feedback clears the item from the queue (${cleared})`, cleared === '0');
  check(`No script errors in the marking console${staffErrors.length ? ' — ' + staffErrors[0] : ''}`, staffErrors.length === 0);
  await staff.screenshot({ path: join(OUT, '08-instructor-cleared.png') });

  // --- THE ARABIC EDITION ---------------------------------------------
  //
  // The surface a learner spends the most time inside. /ar/listening-lab
  // .html served an Arabic page and ran an English laboratory in it:
  // "Script mode.", "No bookmarks yet.", "Recording unsupported",
  // "Uploading your take…", "Keep offline", "not attempted" — forty
  // sentences of controls and states.
  //
  // The transcript, the pronunciation targets and the comprehension
  // questions stay English on BOTH editions, deliberately: this is an
  // English course and the material being learned is the material. Each
  // now carries dir="auto" so an Arabic page lays it out as English
  // rather than reversing its punctuation.
  {
    const ar = await browser.newPage({ viewport: { width: 1440, height: 1000 } });
    const arErrors = [];
    ar.on('pageerror', (e) => arErrors.push(e.message));
    await ar.goto(`${BASE}/ar/listening-lab.html?unit=unt_l1_m1&level=1`, { waitUntil: 'networkidle' });
    await ar.waitForSelector('.cue', { timeout: 8000 });
    await ar.waitForTimeout(600);

    check('The Arabic laboratory loads the same listening',
      (await ar.locator('.cue').count()) >= 1);
    check('...and says in Arabic that there is no studio recording yet',
      /وضع النصّ/.test((await ar.textContent('#labStatusText')) || ''),
      ((await ar.textContent('#labStatusText')) || '').slice(0, 40));

    // The scoped sweep. Anything isolated — the transcript, a question,
    // a pronunciation target, a tutor's comment — is curriculum or a
    // person's own words and is excluded by the same rule the graduate
    // record and the verification page use.
    const stray = await ar.evaluate(() => {
      const host = document.querySelector('main') || document.body;
      const own = new Set();
      host.querySelectorAll('bdi, [dir="auto"], [lang="en"]').forEach((n) => own.add(n));
      const out = [];
      const walk = document.createTreeWalker(host, NodeFilter.SHOW_TEXT);
      let n;
      while ((n = walk.nextNode())) {
        let p = n.parentElement, mine = false;
        while (p && p !== host) { if (own.has(p)) { mine = true; break; } p = p.parentElement; }
        if (mine) continue;
        if (!n.parentElement.offsetParent && n.parentElement.tagName !== 'BODY') continue;
        const t = n.nodeValue
          .replace(/\b[ABC][12]\b/g, ' ')
          .replace(/WEC-[A-Z0-9-]+/g, ' ')
          .replace(/⁨[^⁩]*⁩/g, ' ');
        (t.match(/[A-Za-z]{3,}/g) || []).forEach((w) => out.push(w));
      }
      return [...new Set(out)];
    });
    check('Nothing the laboratory itself says is left in English on the Arabic edition',
      stray.length === 0, stray.slice(0, 8).join(', '));

    check('...the bookmark list explains itself in Arabic',
      /لا علامات بعد/.test((await ar.textContent('#marks')) || ''));
    check('...the notes field says in Arabic where the notes live',
      /هذا الجهاز/.test((await ar.textContent('#notesSaved')) || ''),
      (await ar.textContent('#notesSaved')) || '');
    // The five dimensions are named in Arabic whether or not this
    // learner has been assessed on them — and by this point in the
    // suite an instructor HAS reviewed a take, so some of them carry a
    // percentage. Asserting the Arabic name holds in both states; the
    // "not yet assessed" wording is asserted by the stray sweep above,
    // which runs over whichever of the two the page is showing.
    const dims = (await ar.textContent('#dims')) || '';
    check('...the five pronunciation dimensions are named in Arabic',
      /وضوح الفهم/.test(dims) && /الطلاقة/.test(dims), dims.slice(0, 60));

    // The transcript is the English being learned. It must be present
    // AND marked, so the bidirectional algorithm lays it out as English.
    const cueDir = await ar.getAttribute('.cue__text', 'dir');
    check('...the transcript is still the English being learned, and takes its own direction',
      cueDir === 'auto', String(cueDir));
    const qDir = await ar.getAttribute('.q__p', 'dir');
    check('...as does each numbered question, so its number stays beside it',
      qDir === 'auto', String(qDir));

    const overflow = await ar.evaluate(() =>
      document.documentElement.scrollWidth - document.documentElement.clientWidth);
    check('...and the Arabic laboratory does not overflow its page', overflow <= 0, String(overflow));
    check(`No script errors on the Arabic edition${arErrors.length ? ' — ' + arErrors[0] : ''}`,
      arErrors.length === 0);

    await ar.screenshot({ path: join(OUT, '09-arabic.png'), fullPage: true });
    await ar.close();
  }

  console.log(`\nScreenshots written to ${OUT}`);
} finally {
  await browser.close();
  server.kill();
}

console.log(`\n${pass} passed, ${fail} failed.`);
process.exit(fail ? 1 : 0);
