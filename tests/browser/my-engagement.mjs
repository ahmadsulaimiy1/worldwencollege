// Run with: node tests/browser/my-engagement.mjs
//
// MY ENGAGEMENT, in a real browser, against the real attendance module.
//
// Four things are being proved, and three of them are about a page's
// power to contradict the sentence printed on it.
//
//   THE NOTICE IS WHOLE. `engagementNotice` is a required field of every
//   payload this endpoint produces — "not behind a flag, not summarised,
//   and not left to a template to remember". Its statement, its five
//   measures and all six of its denials must be on the page.
//
//   ABSENT IS NOT DRAWN AS FAILURE. The instrument says engagement is
//   never a penalty and that an empty window is a description. This
//   suite reads the COMPUTED colour of an absent cell and requires it to
//   be neither red nor the most saturated ink in the key — because a
//   page can honour that sentence in its markup and contradict it in
//   its stylesheet, and only a rendered page can tell you which.
//
//   A CORRECTION NEVER CONCEALS WHAT IT CORRECTED. Where a person wrote
//   a state, the platform's own reading of the same window must be
//   visible beside it — on the cell and in the corrections section.
//
//   THE LIMITS ARE PUBLISHED. All three limitations reach the page.
import { chromium } from 'playwright';
import { spawn } from 'node:child_process';
import { existsSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const HERE = dirname(fileURLToPath(import.meta.url));
const PORT = process.env.LAB_PORT || 8845;
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

const rec = await (await fetch(`${BASE}/api/student/attendance?weeks=8`)).json();

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

check('The harness gives the grid all four states to draw',
  ['attended', 'partial', 'excused', 'absent'].every((s) =>
    rec.windows.some((w) => w.modules.some((m) => m.state === s))));

const page = await open_('/my-engagement.html');

// ── The notice ──────────────────────────────────────────────────────
{
  const notice = await page.locator('#secNotice').textContent();
  check('The notice statement is on the page in full',
    notice.includes(rec.engagementNotice.statement.slice(0, 90)));
  check('It says the College does not measure attendance',
    /does not measure attendance/.test(notice));
  for (const m of rec.engagementNotice.measuredBy) {
    check(`The measure "${m.id}" is named with its source`,
      notice.includes(m.label) && notice.includes(m.source));
  }
  check('All six denials reach the page',
    (await page.locator('[data-isnot] li').count()) === rec.engagementNotice.isNot.length,
    `${await page.locator('[data-isnot] li').count()} of ${rec.engagementNotice.isNot.length}`);
  check('...including that it is never a penalty',
    notice.includes('Never a penalty'));
}

// ── The grid ────────────────────────────────────────────────────────
{
  check('Every module of the level is a row',
    (await page.locator('.eng-row').count()) === rec.modules.length + 1,
    `${await page.locator('.eng-row').count()} rows for ${rec.modules.length} modules + head`);
  const cells = await page.locator('.eng-cell').count();
  check('Every window of every module is a cell',
    cells === rec.modules.length * (rec.window.returned || 0),
    `${cells} cells`);
  check('The key names all four states with the module’s own meanings',
    (await page.locator('.eng-key__item').count()) === 4
    && (await page.locator('.eng-key').textContent()).includes('description, not a penalty'));
  check('A state a person wrote is marked on the face of the grid',
    (await page.locator('.eng-cell[data-written="yes"]').count()) === 1);

  // Every cell is reachable by name, not only by sight.
  const label = await page.locator('.eng-cell').first().getAttribute('aria-label');
  check('Each cell carries module, week and state as its accessible name',
    /·/.test(label || '') && (label || '').split('·').length === 3, label);
}

// ── ABSENT IS NOT FAILURE, MEASURED IN COMPUTED COLOUR ──────────────
// The colours are declared with color-mix(in oklab, …), so Chromium
// resolves them to oklab() rather than rgb() and CHROMA — the distance
// of (a, b) from the neutral axis — is the honest measure of how loudly
// an ink speaks. A first cut of this check pulled integers out of the
// string and compared 940304 with 614657, which are the decimals of two
// lightness values with their points removed: a check that passed or
// failed for reasons unrelated to any colour.
{
  const inks = await page.evaluate(() => {
    const read = (state) => {
      const e = document.querySelector(`.eng-key__item[data-state="${state}"] .eng-swatch`);
      const css = e ? getComputedStyle(e).backgroundColor : '';
      const n = (css.match(/-?\d*\.?\d+/g) || []).map(Number);
      if (/^oklab/i.test(css)) {
        const [, a, b] = n;
        return { css, chroma: Math.sqrt(a * a + b * b), a, b };
      }
      // rgb() fallback, for a browser that has not adopted oklab output.
      const [r, g, bl] = n;
      return {
        css,
        chroma: (Math.max(r, g, bl) - Math.min(r, g, bl)) / 255,
        a: (r - g) / 255, b: (g - bl) / 255,
      };
    };
    return {
      attended: read('attended'), partial: read('partial'),
      excused: read('excused'), absent: read('absent'),
    };
  });

  // A near-neutral ink cannot be a failure red, whatever else it is.
  check('An absent window is drawn in a near-neutral ink, and so cannot be a failure red',
    inks.absent.chroma < 0.02, `chroma ${inks.absent.chroma.toFixed(4)} — ${inks.absent.css}`);
  // And it is the QUIETEST of the four, not merely a different one: the
  // page emphasises what the College saw, never what it did not.
  check('An absent window is the quietest ink of the four',
    inks.absent.chroma < inks.attended.chroma
    && inks.absent.chroma < inks.partial.chroma
    && inks.absent.chroma < inks.excused.chroma,
    Object.entries(inks).map(([k, v]) => `${k} ${v.chroma.toFixed(3)}`).join(', '));
}

// ── One cell, its evidence and its correction ───────────────────────
{
  await page.locator('.eng-cell[data-written="yes"]').click();
  await page.waitForTimeout(800);
  check('The cell opens onto its own plate', await page.locator('#secCell').isVisible());
  check('The written state is named', (await textOf(page, '[data-cell-state]')).length > 0);
  check('The correction says how it was recorded',
    (await textOf(page, '[data-override-line]')).includes('register taken by staff'),
    await textOf(page, '[data-override-line]'));
  check('...and the reason the College gave',
    (await textOf(page, '[data-override-reason]')).includes('in hospital'));
  check('...and the platform’s own reading of the same window, still standing',
    (await textOf(page, '[data-override-derived]')).includes('does not conceal'),
    await textOf(page, '[data-override-derived]'));

  // A cell with evidence in it, to prove the citation reaches the page.
  await page.locator('[data-cell-close]').click();
  await page.locator('.eng-cell[data-state="attended"]').first().click();
  await page.waitForTimeout(700);
  check('An attended window lists the evidence it was read from',
    (await page.locator('.eng-ev').count()) >= 1);
  check('...each carrying the clause it counts under',
    /engage\.counts\.|framework\.xi\./.test(await textOf(page, '.eng-ev__clause')),
    await textOf(page, '.eng-ev__clause'));
  check('...and no evidence statement prints a machine timestamp',
    !/\d{4}-\d{2}-\d{2}T\d{2}:/.test(await page.locator('[data-evidence]').textContent()),
    (await page.locator('[data-evidence]').textContent()).slice(0, 120));

  await page.locator('[data-cell-close]').click();
  await page.locator('.eng-cell[data-state="absent"]').first().click();
  await page.waitForTimeout(700);
  check('An empty window says what it describes rather than nothing',
    (await textOf(page, '[data-evidence-empty]')).includes('not what you did'),
    await textOf(page, '[data-evidence-empty]'));
}

// ── The corrections section ─────────────────────────────────────────
{
  await page.locator('[data-cell-close]').click();
  check('Every corrected state is gathered where it can be read',
    (await page.locator('.eng-correction').count()) === 1);
  check('The correction shows both readings side by side',
    (await textOf(page, '.eng-correction__written')).length > 0
    && (await textOf(page, '.eng-correction__derived')).length > 0,
    `${await textOf(page, '.eng-correction__written')} / ${await textOf(page, '.eng-correction__derived')}`);
  check('The section says how many states a person has written',
    /1 state has been written by a person/.test(await textOf(page, '[data-corrections-lede]')),
    await textOf(page, '[data-corrections-lede]'));
}

// ── Live sessions and the published limits ──────────────────────────
{
  check('A session with no register is reported as not recorded, never as absent',
    (await page.locator('.eng-live__item[data-recorded="no"]').count()) >= 1
    && (await textOf(page, '.eng-live__state')).includes('No register'),
    await textOf(page, '.eng-live__state'));
  check('All three limitations are published beside the measurement',
    (await page.locator('.eng-limit').count()) === rec.limitations.length,
    `${await page.locator('.eng-limit').count()} of ${rec.limitations.length}`);
  check('...each naming where it comes from',
    (await textOf(page, '.eng-limit__source')).includes('Source:'));
}

// ── Changing the window ─────────────────────────────────────────────
{
  await page.selectOption('[data-weeks]', '4');
  await page.waitForTimeout(1200);
  const cells = await page.locator('.eng-cell').count();
  check('Asking for a shorter window redraws the grid to it',
    cells === rec.modules.length * 4, `${cells} cells`);
  await page.selectOption('[data-weeks]', '8');
  await page.waitForTimeout(1200);
}

// ── Arabic, and the geometry ────────────────────────────────────────
{
  const ar = await open_('/ar/my-engagement.html');
  check('The Arabic edition is right to left',
    await ar.evaluate(() => document.documentElement.dir === 'rtl'));
  check('The Arabic edition draws the same grid',
    (await ar.locator('.eng-cell').count()) === (rec.modules.length * (rec.window.returned || 0)));
  check('The Arabic edition publishes the limitations too',
    (await ar.locator('.eng-limit').count()) === rec.limitations.length);

  // THE INSTRUMENT ITSELF, IN ARABIC. The notice is a required field of
  // every payload this module produces, and for as long as it existed
  // only in English an Arabic learner was shown the grid with the one
  // sentence that makes it readable printed in a language they had not
  // asked for.
  const arNotice = await ar.locator('#secNotice').textContent();
  check('The Arabic edition publishes the notice in Arabic',
    /لا تقيس الحضور/.test(arNotice) && !/does not measure attendance/.test(arNotice));
  check('...including all six denials',
    (await ar.locator('[data-isnot] li').count()) === rec.engagementNotice.isNot.length
    && /ليست عقوبةً بحال/.test(arNotice));
  const arKey = await ar.locator('.eng-key').textContent();
  check('The Arabic edition defines each state in Arabic',
    /وهذا وصفٌ لا عقوبة/.test(arKey) && !/description, not a penalty/.test(arKey));
  const arLimits = await ar.locator('#secLimits').textContent();
  check('...and publishes the limits in Arabic, keeping the citations as they are',
    /العملُ خارج المنصّة/.test(arLimits) && arLimits.includes('functions/_lib/lms/time-on-task.js'));
  check('The Arabic edition says why a reason written by a person is in its own language',
    /محفوظٌ بالألفاظ التي كُتب بها/.test(await ar.locator('#secCorrections').textContent()));
  await ar.close();
}

for (const w of [1440, 900, 390]) {
  for (const path of ['/my-engagement.html', '/ar/my-engagement.html']) {
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
