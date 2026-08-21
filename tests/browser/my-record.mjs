// Run with: node tests/browser/my-record.mjs
//
// My Academic Record — the learner's own view of what the College holds,
// and the controls over who else may see it.
//
// The APIs behind this page existed with no interface at all, which
// meant a graduate could not exercise a single one of the privacy
// decisions the platform was built to give them. So the assertions here
// are mostly about whether the controls actually control anything, and
// whether a person is told what a decision means AT THE MOMENT they make
// it rather than in a policy nobody opens.
//
// The decisive one: creating a share link and then turning that section
// private must remove it from the link ALREADY ISSUED. That is the
// single most reassuring property of the mechanism, the page states it
// in words, and a page that stated it while the server did otherwise
// would be worse than silence.
import { chromium } from 'playwright';
import { spawn } from 'node:child_process';
import { existsSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const HERE = dirname(fileURLToPath(import.meta.url));
const PORT = process.env.LAB_PORT || 8830;
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
const errs = [];

async function textOf(page, sel) {
  const n = page.locator(sel);
  return (await n.count()) ? ((await n.first().textContent()) || '') : '';
}

async function open(url, viewport) {
  const page = await browser.newPage({ viewport: viewport || { width: 1280, height: 1100 } });
  await page.route('**://fonts.googleapis.com/**', (r) => r.abort());
  await page.route('**://fonts.gstatic.com/**', (r) => r.abort());
  page.on('pageerror', (e) => errs.push(e.message));
  await page.goto(url, { waitUntil: 'domcontentloaded' });
  await page.waitForTimeout(800);
  return page;
}

// --- The record loads, and shows the whole of it ---------------------
{
  const page = await open(`${BASE}/my-record.html`);

  check('A learner can see their own record', (await page.locator('#secRecord').isVisible()) === true);
  // Against the record itself, not against a number typed here. The
  // harness's learner was enrolled on all six levels until a checkout
  // needed one left to buy; an assertion mirroring a fixture is the one
  // that breaks when the fixture changes for a good reason.
  const enrolled = (await (await fetch(`${BASE}/api/student/standing`)).json())
    .levels.filter((l) => l.enrolment).length;
  check('...with every level they entered', (await page.locator('#transcript tr').count()) >= enrolled,
    `${await page.locator('#transcript tr').count()} rows against ${enrolled} enrolments`);
  check('...including ones still in progress', /In progress/.test(await textOf(page, '#transcript')));
  check('...and their credits totalled', /WEC Credits/.test(await textOf(page, '#totals')));

  check('The privacy controls are shown', (await page.locator('#secPrivacy').isVisible()) === true);
  check('The sharing section is shown', (await page.locator('#secShares').isVisible()) === true);
  check('The documents section is shown', (await page.locator('#secDocuments').isVisible()) === true);
  await page.close();
}

// --- Every control says what it means, where the decision is made ----
{
  const page = await open(`${BASE}/my-record.html`);
  const privacy = await textOf(page, '#secPrivacy');

  check('The page states that everything starts private',
    /starts private/i.test(privacy) && /until you switch it on/i.test(privacy));
  // The property that makes sharing safe to use, stated before use.
  check('...and that turning a section off removes it from links already shared',
    /removes it from every link you have already shared/i.test(privacy), privacy.slice(0, 120));

  // The most personal figure in the record gets the most explanation.
  const study = await textOf(page, 'label[for="showStudyTime"]');
  check('Study time explains that it is not part of the qualification',
    /not part of your qualification/i.test(study), study);
  check('...and says most graduates keep it private', /keep it private/i.test(study));

  const shares = await textOf(page, '#secShares');
  check('Sharing explains that a link never exceeds current settings',
    /never shows more than your settings above allow/i.test(shares));
  const docs = await textOf(page, '#secDocuments');
  check('Documents explain that a transcript is a permanent snapshot',
    /snapshot/i.test(docs) && /years later/i.test(docs));
  check('...and that issuing a new one supersedes rather than invalidates',
    /still verifies/i.test(docs));
  await page.close();
}

// --- The controls actually control something ------------------------
{
  const page = await open(`${BASE}/my-record.html`);

  await page.check('#showTranscript');
  await page.check('#showStudyTime');
  await page.locator('#privacyForm button[type="submit"]').click();
  await page.waitForTimeout(700);
  check('Saving privacy settings confirms in words',
    /Saved/i.test(await textOf(page, '#saved')), await textOf(page, '#saved'));

  // Read back from the API rather than from the form, which would only
  // prove the checkbox stayed checked.
  const saved = await page.evaluate(async () => (await (await fetch('/api/student/profile')).json()).visibility);
  check('...and the setting actually reached the record',
    saved.transcript === true && saved.studyTime === true, JSON.stringify(saved));

  await page.uncheck('#showStudyTime');
  await page.locator('#privacyForm button[type="submit"]').click();
  await page.waitForTimeout(700);
  const after = await page.evaluate(async () => (await (await fetch('/api/student/profile')).json()).visibility);
  check('Turning one off turns it off', after.studyTime === false && after.transcript === true,
    JSON.stringify(after));
  await page.close();
}

// --- THE DECISIVE ONE: a share never outlives its consent ------------
{
  const page = await open(`${BASE}/my-record.html`);

  // Publish the transcript, then share a link that includes it.
  await page.check('#showTranscript');
  await page.locator('#privacyForm button[type="submit"]').click();
  await page.waitForTimeout(600);

  await page.locator('.rec-newshare summary').click();
  await page.check('input[name="sections"][value="transcript"]');
  await page.fill('#shareLabel', 'For a demonstration employer');
  await page.locator('#shareForm button[type="submit"]').click();
  await page.waitForTimeout(800);

  const link = await textOf(page, '#newLink code');
  check('A share link is created', /graduate\.html\?share=/.test(link), link.slice(0, 60));
  // Shown once, because the College keeps only a hash.
  check('...and the page says it cannot be shown again',
    /cannot show it to you again/i.test(await textOf(page, '#newLink')));

  const token = (link.split('share=')[1] || '').trim();
  const seenBefore = await page.evaluate(async (t) => {
    const r = await (await fetch('/api/share/' + encodeURIComponent(t))).json();
    return r.ok ? r.profile.sectionsShared : null;
  }, token);
  check('The shared link shows the transcript while it is published',
    seenBefore && seenBefore.includes('transcript'), JSON.stringify(seenBefore));

  // Now withdraw consent for that section. The link was issued with it.
  await page.uncheck('#showTranscript');
  await page.locator('#privacyForm button[type="submit"]').click();
  await page.waitForTimeout(700);

  const seenAfter = await page.evaluate(async (t) => {
    const r = await (await fetch('/api/share/' + encodeURIComponent(t))).json();
    return r.ok ? { shared: r.profile.sectionsShared, withheld: r.profile.sectionsWithheld,
      hasTranscript: r.profile.transcript !== undefined } : null;
  }, token);
  check('Turning the section private removes it from the link ALREADY ISSUED',
    seenAfter && seenAfter.hasTranscript === false, JSON.stringify(seenAfter));
  check('...and the link names it as withheld rather than staying silent',
    seenAfter && seenAfter.withheld.includes('transcript'), JSON.stringify(seenAfter && seenAfter.withheld));
  await page.close();
}

// --- Withdrawing a link ----------------------------------------------
{
  const page = await open(`${BASE}/my-record.html`);
  check('Issued links are listed', (await page.locator('.rec-share').count()) >= 1,
    await page.locator('.rec-share').count());
  // Knowing an employer opened the link is the reassurance a graduate
  // actually wants from this list.
  check('...showing how often each was opened', /opened \d+ time/.test(await textOf(page, '#shares')));

  const live = page.locator('.rec-share .rec-revoke').first();
  if (await live.count()) {
    await live.click();
    await page.waitForTimeout(800);
    check('A withdrawn link is marked withdrawn rather than disappearing',
      /Withdrawn/.test(await textOf(page, '#shares')));
    check('...and can no longer be withdrawn again',
      (await page.locator('.rec-share.is-inactive').count()) >= 1);
  } else {
    check('A live link was available to withdraw', false, 'no revoke control found');
  }
  await page.close();
}

// --- Issuing a document ----------------------------------------------
{
  const page = await open(`${BASE}/my-record.html`);
  await page.locator('[data-issue="transcript"]').click();
  await page.waitForTimeout(1000);

  check('A transcript can be issued', (await page.locator('.rec-doc').count()) >= 1,
    await textOf(page, '#docError'));
  check('...carrying a verification code', /code WEC-/.test(await textOf(page, '#documents')));
  check('...and a link to check it', /verify\.html\?code=WEC-/.test(
    await page.getAttribute('.rec-doc a', 'href') || ''));

  await page.locator('[data-issue="transcript"]').click();
  await page.waitForTimeout(1000);
  // Superseded, not deleted. The older document still verifies.
  check('Issuing a second transcript marks the first superseded, not gone',
    (await page.locator('.rec-doc').count()) === 2
    && /Superseded/.test(await textOf(page, '#documents')),
    await page.locator('.rec-doc').count());
  await page.close();
}

// --- Not signed in ----------------------------------------------------
// The harness identifies a learner, so this is exercised by refusing the
// call rather than by removing a session that does not exist here.
{
  const page = await browser.newPage();
  await page.route('**://fonts.g**', (r) => r.abort());
  await page.route('**/api/student/profile', (r) =>
    r.fulfill({ status: 401, contentType: 'application/json', body: '{"error":"AuthError"}' }));
  page.on('pageerror', (e) => errs.push(e.message));
  await page.goto(`${BASE}/my-record.html`, { waitUntil: 'domcontentloaded' });
  await page.waitForTimeout(700);

  const s = await textOf(page, '#state');
  check('Without a session the page says so plainly', /not signed in/i.test(s), s.slice(0, 60));
  check('...explaining the record is private to them', /private to you/i.test(s));
  // A signed-out visitor must not see an empty shell that reads as a
  // record with nothing in it.
  check('...and shows no empty record shell', (await page.locator('#secRecord').isVisible()) === false);
  check('...nor empty privacy controls', (await page.locator('#secPrivacy').isVisible()) === false);
  await page.close();
}

// --- The learner can move between their own surfaces ------------------
{
  const page = await open(`${BASE}/my-record.html`);
  check('The record links to the programme', (await page.locator('.rec-nav a[href="/my-programme.html"]').count()) === 1);
  check('...and marks where the learner is', (await page.getAttribute('.rec-nav a[aria-current="page"]', 'href')) === '/my-record.html');

  // The route INTO these pages. /student-portal/ is where the site's
  // navigation and footer send every learner, and it loads
  // js/portal-entry.js to offer a signed-in one the way through. The
  // script fails silent if the host is missing — which is exactly what
  // the Arabic build did, downloading three scripts to do nothing — so
  // both builds are checked for a host carrying every string the script
  // needs. An attribute missing here is a band that never renders.
  const NEEDED = ['welcome', 'welcomeAnon', 'lede', 'go', 'record'];
  const bands = {};
  for (const [label, route] of [['English', '/student-portal/'], ['Arabic', '/ar/student-portal/']]) {
    const pp = await open(BASE + route);
    // Read through evaluate rather than a locator: when the host is
    // absent this must return null and FAIL, not time out and take the
    // rest of the suite down with it.
    const data = await pp.evaluate(() => {
      const h = document.getElementById('portalEntry');
      return h ? { ...h.dataset, hidden: h.hidden } : null;
    });
    bands[label] = data;
    check(`The ${label} Student Portal carries the signed-in entry band`, !!data);
    check(`...with wording for every part of it`,
      !!data && NEEDED.every((k) => (data[k] || '').trim().length > 0),
      data && NEEDED.filter((k) => !(data[k] || '').trim()).join(','));
    check(`...hidden until a real session exists`, !!data && data.hidden === true);
    await pp.close();
  }
  // The two builds must not share wording, or one of them is untranslated.
  check('...and the Arabic band is not the English one',
    !!bands.Arabic && !!bands.English && bands.Arabic.lede !== bands.English.lede);

  const prog = await open(`${BASE}/my-programme.html`);
  // The finding that started this: the working portal was reachable
  // from nowhere, and reached nothing.
  check('The programme links back to the record',
    (await prog.locator('.rec-nav a[href="/my-record.html"]').count()) === 1);
  // The crest this looked for was the standalone-page pattern, and
  // /my-programme.html is no longer one: it was given the site's own
  // chrome, so the way back to the College is the header's own mark.
  check('...and to the College', (await prog.locator('header a.brand[href="/"]').count()) === 1);
  await prog.close();
  await page.close();
}

// --- Mobile and accessibility ----------------------------------------
{
  const page = await open(`${BASE}/my-record.html`, { width: 390, height: 780 });
  const overflow = await page.evaluate(() =>
    document.documentElement.scrollWidth - document.documentElement.clientWidth);
  check('No horizontal overflow at 390px', overflow <= 0, overflow);

  // The target is the region that accepts the pointer, not the painted
  // control. A 28px checkbox beside a 60px label that toggles it is a
  // 60px target; measuring the box alone would report a defect that no
  // thumb can feel. The label must actually cover the control's row,
  // though — a caption sitting somewhere else on the page is not a
  // target, and this still fails a control that has no label at all.
  const small = await page.evaluate(() => {
    const labelFor = (e) => e.closest('label')
      || (e.id ? document.querySelector(`label[for="${CSS.escape(e.id)}"]`) : null);
    // Inline in running text: the anchor has a sibling text node with
    // words in it. A link that is the whole of its parent is a control
    // and stays in scope.
    const inline = (e) => [...(e.parentElement ? e.parentElement.childNodes : [])]
      .some((n) => n !== e && n.nodeType === Node.TEXT_NODE && /\S/.test(n.textContent));
    return [...document.querySelectorAll('a, button, input, select, summary')]
      .map((e) => {
        const r = e.getBoundingClientRect();
        if (r.height === 0) return null;             // not rendered
        // WCAG 2.5.8 exempts a link inline in a sentence, and it is
        // right to: a 14px link inside a paragraph of running text
        // cannot be given a 44px box without pushing the lines around
        // it apart, and the sentence is what a reader aims at. This
        // rule is for CONTROLS. Without the exemption it reported the
        // footer's legal sentence and a help note's "see an example"
        // link as defects — a rule nobody can satisfy, and therefore a
        // rule that gets ignored.
        if (e.tagName === 'A' && inline(e)) return null;
        let h = r.height;
        const lab = labelFor(e);
        if (lab) {
          const lr = lab.getBoundingClientRect();
          const mid = r.top + r.height / 2;
          if (lr.top <= mid && lr.bottom >= mid) h = Math.max(h, lr.height);
        }
        return h < 44 ? `${e.tagName}.${e.className || e.id || e.type} ${Math.round(h)}px` : null;
      })
      .filter(Boolean);
  });
  check('Every control is a comfortable tap target', small.length === 0, small.join(', '));

  // A skip link that never becomes visible helps nobody: a sighted
  // keyboard user tabs onto it, sees no change, and cannot tell the
  // route past the header exists. Height alone would not catch this —
  // an element can be a comfortable size and still be parked off-screen
  // permanently — so the test moves focus and looks at where it lands.
  const skip = page.locator('a[href="#main"]').first();
  await skip.focus();
  await page.waitForTimeout(400);   // the link slides in over .15s
  const box = await skip.boundingBox();
  check('The skip link becomes visible when it takes focus',
    !!box && box.y >= 0 && box.y + box.height <= 780, JSON.stringify(box));
  check('...and is announced with what it skips to',
    /skip to/i.test((await skip.textContent()) || ''));

  check('Exactly one h1', (await page.locator('h1').count()) === 1);
  check('Every switch has a real label',
    await page.evaluate(() => [...document.querySelectorAll('.rec-toggle input')]
      .every((i) => !!document.querySelector(`label[for="${i.id}"]`))));
  check('The sharing options are grouped in a fieldset with a legend',
    (await page.locator('.rec-fieldset legend').count()) === 1);
  check('The status region announces itself', (await page.getAttribute('#state', 'aria-live')) === 'polite');
  await page.screenshot({ path: join(HERE, 'screenshots', 'my-record-mobile.png'), fullPage: true }).catch(() => {});
  await page.close();
}

check('No uncaught script errors', errs.length === 0, errs.slice(0, 2).join(' | '));

console.log(`\n${pass} passed, ${fail} failed.`);
await browser.close();
server.kill();
process.exit(fail ? 1 : 0);
