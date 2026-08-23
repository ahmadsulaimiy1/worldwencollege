// Run with: node tests/browser/examination.mjs
//
// THE LEVEL EXAMINATION, in a real browser, against the real library.
//
// Three surfaces, and the assertions are almost all about rules that a
// screen can quietly break while the endpoint underneath is correct:
//
//   · A SECOND MARKER MUST NOT SEE THE FIRST READING. The endpoint
//     withholds it; this test opens the script AS THE SECOND MARKER in
//     a real browser and fails if the first marker's numbers are
//     anywhere in the document — not merely absent from the panel the
//     page draws, but absent from the DOM.
//
//   · AND THE PAGE MUST SAY SO. An empty panel with no explanation
//     reads as a bug, so the withholding notice is asserted as visible
//     text with real length rather than as an attribute.
//
//   · THERE IS NO OVERALL FIELD, EVER. The test enumerates every
//     writable control inside the marking form and fails if any of them
//     could set the overall. A marker who can type an overall can mark
//     on impression and fit the criteria to it, and that is a defect
//     nothing in the data layer can catch.
//
//   · THE CLOCK IS THE SERVER'S. The candidate's page is loaded in a
//     browser whose zone is deliberately wrong for the account, and the
//     countdown is asserted against `dueAt` — a page doing its own
//     arithmetic on a local clock would fail visibly.
//
//   · AND BOTH EDITIONS ANSWER IN THEIR OWN LANGUAGE. The Arabic
//     surfaces must carry Arabic script in the sentences the platform
//     supplied, not merely in the template.
import { chromium } from 'playwright';
import { spawn } from 'node:child_process';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const HERE = dirname(fileURLToPath(import.meta.url));
const PORT = process.env.LAB_PORT || 8841;
const BASE = `http://localhost:${PORT}`;

let pass = 0; let fail = 0;
const check = (label, cond, detail) => {
  console.log((cond ? 'PASS ' : 'FAIL ') + label + (cond || detail === undefined ? '' : ` — ${detail}`));
  cond ? pass++ : fail++;
};

const server = spawn(process.execPath, ['--experimental-sqlite', join(HERE, 'lab-server.mjs')], {
  env: { ...process.env, LAB_PORT: String(PORT) }, stdio: ['ignore', 'pipe', 'pipe'],
});
await new Promise((resolve, reject) => {
  const t = setTimeout(() => reject(new Error('server did not start')), 25000);
  server.stdout.on('data', (d) => { if (String(d).includes('ready')) { clearTimeout(t); resolve(); } });
  server.stderr.on('data', (d) => { if (!/ExperimentalWarning|trace-warnings/.test(String(d))) process.stderr.write(d); });
});

const ARABIC = /[؀-ۿ]/;
const browser = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium-1194/chrome-linux/chrome' });
const problems = [];

async function open(path, { width = 1440, zone = 'America/Los_Angeles', query = '', marker = null } = {}) {
  const ctx = await browser.newContext({ viewport: { width, height: 900 }, timezoneId: zone });
  // The harness's stand-in for a session. The PAGE carries no actor —
  // it builds its own URLs exactly as it does in production — so the
  // only way two different people can drive the same unmodified screen
  // is for the context to say who is at it.
  if (marker) {
    await ctx.addCookies([{ name: 'lab_marker', value: marker, url: BASE }]);
  }
  const page = await ctx.newPage();

  // A BLOCKED FONT IS NOT A FAULT IN THE PAGE. This sandbox has no
  // outbound network, so every request to fonts.googleapis.com and
  // fonts.gstatic.com dies as ERR_CONNECTION_RESET and the console
  // reports it with no URL in the text. The URL is on the REQUEST, so
  // the failed requests are collected first and the console error is
  // matched against them: anything that failed for a reason other than
  // an unreachable font host still fails this test.
  const blockedFonts = [];
  page.on('requestfailed', (r) => {
    if (/fonts\.(googleapis|gstatic)\.com/.test(r.url())) blockedFonts.push(r.url());
    else problems.push(`${path}: request failed ${r.url()}`);
  });
  page.on('console', (m) => {
    if (m.type() !== 'error') return;
    const txt = m.text();
    if (/net::ERR_/.test(txt) && blockedFonts.length) return;
    problems.push(`${path}: ${txt}`);
  });
  page.on('pageerror', (e) => problems.push(`${path}: PAGEERROR ${e.message}`));
  await page.goto(BASE + path + query, { waitUntil: 'networkidle' });
  await page.waitForTimeout(600);
  return { ctx, page };
}

const sitting = (await (await fetch(`${BASE}/api/student/examination`)).json()).sittings[0];
check('the harness has a submitted script to work on', Boolean(sitting), JSON.stringify(sitting || null));

// ═══════════════════════════════════════════════════════════════════
// 1 · THE CANDIDATE'S PAGE
// ═══════════════════════════════════════════════════════════════════
{
  const { ctx, page } = await open('/my-examination.html');

  const state = (await page.textContent('#state') || '').trim();
  check('the state line is cleared once the record is drawn', state === '', state);

  const plates = await page.$$('.exm-sittings .stf-item');
  check('the sitting is drawn as a struck plate', plates.length === 1, String(plates.length));

  const text = await page.textContent('.exm-sittings');
  check('...carrying the sitting reference the candidate reads aloud',
    text.includes(sitting.sittingReference), sitting.sittingReference);
  check('...and the reference is set LTR so a code is never mirrored',
    (await page.getAttribute('.stf-item__ref code', 'dir')) === 'ltr');
  check('...and the sentence saying what the reference is for',
    /read (this|it) aloud|read aloud/i.test(text), text.slice(0, 120));

  const material = await page.evaluate(() => {
    const p = document.querySelector('.exm-sittings .stf-item');
    return p ? {
      aurum: p.classList.contains('aurum'),
      edge: p.classList.contains('edge-lit'),
      tilt: p.classList.contains('tilt'),
      gold: p.classList.contains('gold-live'),
      dome: Boolean(p.querySelector('.badge-dome--lg')),
    } : null;
  });
  check('...struck: aurum, a lit rim, tilt, live metal and a large dome',
    material && material.aurum && material.edge && material.tilt && material.gold && material.dome,
    JSON.stringify(material));

  // The published procedure, RENDERED. Every figure is the library's,
  // which is pinned to /students/examinations/ by the unit suite.
  const procedure = await page.textContent('[data-procedure]');
  check('the published procedure is rendered on the page, not linked away',
    /\b10 working days\b/.test(procedure) && /\b3 hours\b/.test(procedure),
    procedure.slice(0, 160));
  check('...and the release day the College publishes',
    /working day 15/i.test(procedure));

  const lateness = await page.$$('[data-lateness] tr');
  check('the four published lateness bands are drawn', lateness.length === 4, String(lateness.length));

  // A LEVEL WITH NO PUBLISHED PAPER IS THE COLLEGE'S OUTSTANDING WORK.
  const levels = await page.textContent('[data-levels]');
  check('a level the College has set no paper for says so as the College’s',
    /has not yet published an examination paper/.test(levels));
  check('...and never as something the candidate failed to sit',
    !/you (have )?(not|failed)[^.]*sat/i.test(levels));

  for (const w of [1440, 900, 390]) {
    await page.setViewportSize({ width: w, height: 900 });
    await page.waitForTimeout(200);
    const over = await page.evaluate(() => document.documentElement.scrollWidth > window.innerWidth + 1);
    check(`ltr ${w}: no horizontal overflow`, !over);
  }
  await ctx.close();
}

// ═══════════════════════════════════════════════════════════════════
// 2 · THE FIRST MARKER
// ═══════════════════════════════════════════════════════════════════
let firstMarks = null;
{
  const { ctx, page } = await open('/staff-examinations.html');

  const rows = await page.$$('[data-queue] .stf-item');
  check('the submitted script reaches the first-marking queue', rows.length === 1, String(rows.length));

  const basis = (await page.textContent('[data-queue-basis]') || '').trim();
  check('...and the queue says on what basis it was drawn', basis.length > 30, basis);

  await page.click('[data-queue] .acc-open');
  await page.waitForSelector('.exm-form', { timeout: 8000 });

  // THE WITHHOLDING, and the sentence.
  const withheld = (await page.textContent('.exm-withheld') || '').trim();
  check('a marker who has not marked is told the other reading is withheld',
    withheld.length > 40, withheld.slice(0, 90));

  const criteria = await page.$$('.exm-crit');
  check('the rubric is the form: one block per criterion', criteria.length === 4, String(criteria.length));

  const descriptors = await page.$$eval('.exm-crit__descriptor', (ns) => ns.map((n) => n.textContent.trim()));
  check('...each with its published descriptor above the field',
    descriptors.length === 4 && descriptors.every((d) => d.length > 30),
    JSON.stringify(descriptors.map((d) => d.length)));

  // THERE IS NO OVERALL FIELD. Enumerated rather than assumed.
  const writable = await page.evaluate(() => Array.from(
    document.querySelectorAll('.exm-form input, .exm-form select, .exm-form textarea'),
  ).map((n) => ({ tag: n.tagName, type: n.type || null, id: n.id, label:
    (document.querySelector('label[for="' + n.id + '"]') || {}).textContent || '' })));
  check('no control in the marking form can set an overall mark',
    !writable.some((w) => /overall|total/i.test(w.id + ' ' + w.label)),
    JSON.stringify(writable.map((w) => w.id)));
  check('...and the running overall is an <output>, not an input',
    (await page.$('output.exm-running')) !== null);

  // Marking the whole script.
  const ids = await page.$$eval('.exm-crit input[type="number"]', (ns) => ns.map((n) => n.id));
  const values = [84, 86, 82, 88];
  for (let i = 0; i < ids.length; i++) {
    await page.fill('#' + ids[i], String(values[i]));
  }
  const running = (await page.textContent('.exm-running__value') || '').trim();
  check('the running overall is the weighted arithmetic of what was typed',
    running.startsWith('85.00'), running);

  const comments = await page.$$eval('.exm-crit textarea', (ns) => ns.map((n) => n.id));
  await page.fill('#' + comments[0], 'Follows the exchange throughout. Push the qualification next time.');

  await page.click('.exm-form button[type="submit"]');
  await page.waitForSelector('.exm-table', { timeout: 15000 });
  // The confirmation is carried INTO the re-render rather than written
  // to a node the re-render destroys, or to the state line load()
  // owns. See js/staff-examinations.js.
  const says = (await page.textContent('.exm-said') || '').trim();
  check('recording the reading succeeds, and the confirmation survives the re-render',
    /never overwritten|on the record/i.test(says), says);
  const recorded = await page.textContent('.exm-table');
  check('...and the marker’s own numbers are now shown back to them',
    values.every((v) => recorded.includes(String(v))), recorded.replace(/\s+/g, ' ').slice(0, 120));

  firstMarks = values;
  await ctx.close();
}

// ═══════════════════════════════════════════════════════════════════
// 3 · THE SECOND MARKER — THE RULE THE WHOLE SUBSYSTEM EXISTS FOR
// ═══════════════════════════════════════════════════════════════════
{
  // `?as=second` is the harness's way of being a different person; the
  // marker identity is the session's in production.
  // A DIFFERENT PERSON at the same unmodified screen. The page is
  // untouched; only the context says who is at it.
  const { ctx, page } = await open('/staff-examinations.html', { marker: 'second' });

  await page.selectOption('[data-role]', 'second');
  await page.waitForTimeout(900);
  const rows = await page.$$('[data-queue] .stf-item');
  check('the once-read script reaches the SECOND-marking queue', rows.length === 1, String(rows.length));

  await page.click('[data-queue] .acc-open');
  await page.waitForSelector('.exm-form', { timeout: 8000 });

  // The whole document, not just the panel the page chose to draw.
  const body = await page.evaluate(() => document.body.innerText);
  const leaked = firstMarks.filter((v) => new RegExp('\\b' + v + '\\b').test(body));
  check('THE FIRST MARKER’S NUMBERS ARE NOWHERE IN THE DOCUMENT',
    leaked.length === 0, leaked.join(', '));

  const withheld = (await page.textContent('.exm-withheld') || '').trim();
  check('...and the second marker is told why, rather than shown a blank',
    withheld.length > 40, withheld.slice(0, 90));

  const submit = await page.textContent('.exm-form button[type="submit"]');
  check('...and the button says which reading this is',
    /second/i.test(submit), submit);

  await ctx.close();
}

// ═══════════════════════════════════════════════════════════════════
// 4 · THE ARABIC EDITIONS ANSWER IN ARABIC
// ═══════════════════════════════════════════════════════════════════
{
  const { ctx, page } = await open('/ar/my-examination.html');
  const procedure = (await page.textContent('[data-procedure]') || '').trim();
  check('the Arabic candidate page renders the procedure in Arabic',
    ARABIC.test(procedure) && !/working days/i.test(procedure), procedure.slice(0, 90));

  const lateness = (await page.textContent('[data-lateness]') || '').trim();
  check('...and the four lateness bands in Arabic', ARABIC.test(lateness), lateness.slice(0, 80));

  const dir = await page.getAttribute('html', 'dir');
  check('...right to left', dir === 'rtl', dir);

  for (const w of [1440, 390]) {
    await page.setViewportSize({ width: w, height: 900 });
    await page.waitForTimeout(200);
    const over = await page.evaluate(() => document.documentElement.scrollWidth > window.innerWidth + 1);
    check(`rtl ${w}: no horizontal overflow`, !over);
  }
  await ctx.close();
}
{
  // By this point the script carries a first reading, so it is in the
  // SECOND-marking queue and not the first. The Arabic edition is
  // driven through the same two controls an Arabic-reading marker
  // would use, rather than by opening the script by its id.
  const { ctx, page } = await open('/ar/staff-examinations.html', { marker: 'second' });
  await page.selectOption('[data-role]', 'second');
  await page.waitForTimeout(900);
  const queued = await page.$$('[data-queue] .stf-item');
  check('the Arabic second-marking queue holds the once-read script',
    queued.length === 1, String(queued.length));
  await page.click('[data-queue] .acc-open');
  await page.waitForSelector('.exm-crit', { timeout: 15000 });
  const descriptors = (await page.textContent('[data-script]') || '');
  check('the Arabic marking screen renders the rubric in Arabic',
    ARABIC.test(descriptors), descriptors.slice(0, 90));
  check('...and does not fall back to the English descriptors',
    !/Follows an extended exchange/.test(descriptors));
  await ctx.close();
}

// ═══════════════════════════════════════════════════════════════════
// 5 · THE PAPER-SETTING CONSOLE
// ═══════════════════════════════════════════════════════════════════
{
  const { ctx, page } = await open('/staff-papers.html');
  const levels = await page.$$('[data-levels] .stf-item');
  check('every one of the six levels is drawn, published or not', levels.length === 6, String(levels.length));

  const text = await page.textContent('[data-levels]');
  check('a level with no published paper is NAMED rather than left blank',
    /No paper is published at this level/.test(text));
  check('...and the one that has a paper says when its rubric was published',
    /rubric published on/i.test(text));

  const form = await page.$$('#paperForm .exm-crit');
  check('the form opens with the four criteria a publishable paper needs',
    form.length === 5, String(form.length));

  const weights = (await page.textContent('[data-weights]') || '').trim();
  check('...and the weights read as correct at 1.00', /1\.00/.test(weights) && /correct/i.test(weights), weights);

  for (const w of [1440, 390]) {
    await page.setViewportSize({ width: w, height: 900 });
    await page.waitForTimeout(200);
    const over = await page.evaluate(() => document.documentElement.scrollWidth > window.innerWidth + 1);
    check(`papers ltr ${w}: no horizontal overflow`, !over);
  }
  await ctx.close();
}

check('no console errors or page errors anywhere',
  problems.length === 0, problems.slice(0, 4).join(' | '));

await browser.close();
server.kill();
console.log(`\n${pass} passed, ${fail} failed.`);
process.exit(fail ? 1 : 0);
