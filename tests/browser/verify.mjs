// Run with: node tests/browser/verify.mjs
//
// The Award Verification portal, in a real browser, against the real
// Register.
//
// This page is opened by a stranger — an employer, an admissions officer
// — who has never seen the College and will spend about eight seconds
// deciding whether it is real. So the assertions are about what that
// stranger actually experiences: does a code they scanned resolve
// without an account, does a WITHDRAWN award say withdrawn rather than
// looking broken, and does the page ever show them more than the
// certificate already asserts.
import { chromium } from 'playwright';
import { spawn } from 'node:child_process';
import { existsSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const HERE = dirname(fileURLToPath(import.meta.url));
const PORT = process.env.LAB_PORT || 8824;
const BASE = `http://localhost:${PORT}`;

let pass = 0, fail = 0;
const check = (label, cond, detail) => {
  console.log((cond ? 'PASS ' : 'FAIL ') + label + (cond || detail === undefined ? '' : ` — ${detail}`));
  cond ? pass++ : fail++;
};

// LAB_REQUIRE_AUTH is ON deliberately. Verification must work with no
// session at all, and the only way to prove that is to run it in the
// harness that 401s everything else.
const server = spawn(process.execPath, ['--experimental-sqlite', join(HERE, 'lab-server.mjs')], {
  env: { ...process.env, LAB_PORT: String(PORT), LAB_REQUIRE_AUTH: '1' }, stdio: ['ignore', 'pipe', 'pipe'],
});
await new Promise((resolve, reject) => {
  const t = setTimeout(() => reject(new Error('server did not start')), 20000);
  server.stdout.on('data', (d) => { if (String(d).includes('ready')) { clearTimeout(t); resolve(); } });
  server.stderr.on('data', (d) => { if (!/ExperimentalWarning|trace-warnings/.test(String(d))) process.stderr.write(d); });
});

const codes = await (await fetch(`${BASE}/__demo-awards`)).json();

const exe = process.env.PW_CHROMIUM || '/opt/pw-browsers/chromium-1194/chrome-linux/chrome';
const browser = await chromium.launch(existsSync(exe) ? { executablePath: exe } : {});
const errs = [];

// Tolerant reads, so a missing element FAILS an assertion instead of
// hanging for thirty seconds and killing the run. This suite lost a
// whole run to exactly that when the QR stub was removed and an
// assertion kept waiting for the sentence that used to explain it.
async function textOf(page, sel) {
  const n = page.locator(sel);
  return (await n.count()) ? ((await n.first().textContent()) || '') : '';
}

async function open(url, viewport) {
  const page = await browser.newPage({ viewport: viewport || { width: 1280, height: 1000 } });
  await page.route('**://fonts.googleapis.com/**', (r) => r.abort());
  await page.route('**://fonts.gstatic.com/**', (r) => r.abort());
  page.on('pageerror', (e) => errs.push(e.message));
  await page.goto(url, { waitUntil: 'domcontentloaded' });
  await page.waitForTimeout(600);
  return page;
}

async function verify(page, code) {
  await page.fill('#code', code);
  await page.locator('.vfy-submit').click();
  await page.waitForTimeout(700);
}

// --- A valid award, with no session at all ---------------------------
{
  const page = await open(`${BASE}/verify.html`);
  await verify(page, codes.valid);

  check('A code verifies with no account and no sign-in',
    (await page.locator('#result').isVisible()) === true);
  const status = (await page.textContent('#status') || '').trim();
  check('...and the standing is stated in words, never colour alone',
    /verified/i.test(status), status);
  check('...naming the holder', (await page.textContent('#holder')) === 'Demonstration Graduate');
  check('...and the award in full', /English Associate of Worldwide English College/.test(await page.textContent('#awardTitle')));
  check('...with the post-nominal', (await page.textContent('#postNominal')) === 'AsWEC');
  check('...the level, CEFR band, honour, credits and qualification time',
    /Level III/.test(await page.textContent('#fLevel'))
    && (await page.textContent('#fCefr')) === 'B1'
    && (await page.textContent('#fHonour')) === 'Distinction'
    && (await page.textContent('#fCredits')) === '20'
    && /200 hours/.test(await page.textContent('#fTqt')));
  check('...and the citation, which is what makes it an award rather than a score',
    /defended under questioning/.test(await page.textContent('#citation')));

  // The scope promise, checked against what the page is actually SENT
  // rather than against what it happens to render. A response carrying
  // the graduate's internal identifier is a leak even if no element
  // displays it — devtools and any API consumer see the whole payload.
  //
  // An allowlist, not a denylist. A denylist only catches the leaks
  // someone thought of; this fails the moment publicView starts
  // returning a field nobody approved, which is how the leak would
  // actually arrive (a `...a` spread in a refactor).
  const ALLOWED = ['holderName', 'awardTitle', 'postNominal', 'level', 'cefr', 'honour',
    'honourLabel', 'credits', 'tqtHours', 'citation', 'conferredOn', 'verificationCode',
    'status', 'revokedAt', 'revokedReason', 'replacementCode', 'digest'];
  const payload = await page.evaluate(async (code) => {
    const r = await fetch('/api/verify/' + encodeURIComponent(code));
    return r.json();
  }, codes.valid);
  const extra = Object.keys(payload.award).filter((k) => !ALLOWED.includes(k));
  check('The verification response carries only the fields the certificate asserts',
    extra.length === 0, `unapproved: ${extra.join(', ')}`);
  check('...and the level object exposes no identifier beyond the level itself',
    Object.keys(payload.award.level).every((k) => ['id', 'roman', 'name'].includes(k)),
    Object.keys(payload.award.level).join(', '));
  // usr_demo is the holder's real internal id in this fixture, so unlike
  // a made-up address this string genuinely exists and can genuinely escape.
  const body = await page.content();
  check('The page never renders the holder\'s internal identifier',
    !body.includes('usr_demo'), 'internal user id reached the page');

  check('A permanent link is offered for the record',
    /verify\.html\?code=WEC-/.test(await page.getAttribute('#permalink', 'href')));
  // The QR was a stub for months, and the page said so rather than
  // showing an empty box. It is real now — proven against an
  // independent decoder — so the assertion is that it renders AND
  // carries the same code the page prints, not that it is absent.
  await page.waitForTimeout(400);
  const qrCount = await page.locator('#qr svg').count();
  check('A QR code is rendered', qrCount === 1, qrCount);
  const qrLabel = qrCount ? await page.getAttribute('#qr svg', 'aria-label') : '';
  const printed = (await textOf(page, '#codeOut')).trim();
  check('...for the same code the page prints',
    !!printed && (qrLabel || '').includes(printed), `${qrLabel} vs ${printed}`);
  // The page must no longer claim the QR is unbuilt. Left in place, that
  // sentence would be the platform understating itself — the same
  // direction of error the Student Portal was making.
  check('...and the page no longer says QR is not yet issued',
    !/not yet issued/i.test(await textOf(page, '.vfy-seal')));

  // --- The Principle of Institutional Verification -------------------
  // Three layers, answered separately, because they genuinely disagree.
  check('The three-layer verification panel is shown',
    (await page.locator('#layers').isVisible()) === true);
  check('...naming identity authenticity, credential integrity and standing',
    (await page.locator('#layerIdentity').isVisible())
    && (await page.locator('#layerIntegrity').isVisible())
    && (await page.locator('#layerStanding').isVisible()));
  check('...with the question each layer answers, beside its name',
    /Is this the person the College awarded/.test(await textOf(page, '#layerIdentity'))
    && /Has this credential been altered/.test(await textOf(page, '#layerIntegrity')),
    (await textOf(page, '#layerIdentity')).slice(0, 80));
  // Every status carries its explanation, so a verifier never has to
  // guess what was and was not checked.
  const explained = await page.evaluate(() => [...document.querySelectorAll('.vfy-check')]
    .every((c) => (c.querySelector('.vfy-check__what')?.textContent || '').length > 20));
  check('...and every single check explains itself in words', explained);

  // The signature must not overclaim. Executive decision P2.1.
  const sigTxt = await page.evaluate(() => {
    const c = [...document.querySelectorAll('.vfy-check')]
      .find((n) => /Digital signature/.test(n.textContent));
    return c ? { cls: c.className, text: c.textContent } : null;
  });
  check('A development-mode signature is styled and labelled as its own state',
    !!sigTxt && /vfy-check--development/.test(sigTxt.cls), sigTxt && sigTxt.cls);
  check('...saying it is not production-grade',
    !!sigTxt && /not yet carry production-grade assurance/.test(sigTxt.text),
    sigTxt && sigTxt.text.slice(0, 100));

  // What the qualification certifies, from the institutional data model.
  check('The qualification\'s official meaning is shown',
    (await page.locator('#meaning').isVisible()) === true);
  const meaning = await textOf(page, '#meaning');
  check('...its official title and post-nominal',
    /English Associate of Worldwide English College/.test(meaning) && /AsWEC/.test(meaning),
    meaning.slice(0, 90));
  check('...the standing it confers', /Established member of the academic community/.test(meaning));
  check('...and what the holder can do', /Learning objectives|can:/.test(meaning) || meaning.length > 600,
    meaning.length);
  await page.close();
}

// --- A withdrawn award must NOT look like a failure ------------------
// The decisive case. If a revoked certificate produced an error or an
// empty page, a holder could present it and claim the portal was down.
{
  const page = await open(`${BASE}/verify.html`);
  await verify(page, codes.revoked);
  check('A withdrawn award still resolves — it does not look broken',
    (await page.locator('#result').isVisible()) === true);
  const status = (await page.textContent('#status') || '').trim();
  check('...and says WITHDRAWN in words', /withdrawn/i.test(status), status);
  const alert = (await page.textContent('#alert') || '').trim();
  check('...with the date it was withdrawn', /\d{4}/.test(alert), alert.slice(0, 90));
  check('...the reason recorded', /conferred in error/i.test(alert), alert.slice(0, 120));
  check('...and an instruction not to rely on it', /should not be relied upon/i.test(alert));
  check('The card is visually distinct from a valid one',
    (await page.getAttribute('#card', 'class')).includes('is-revoked'));

  // THE ASSERTION THE THREE-LAYER DESIGN EXISTS FOR.
  //
  // The three layers must disagree here, on the page, in front of the
  // employer. Identity and integrity pass — this IS the person, and the
  // certificate is NOT a forgery — while standing fails. Every
  // single-verdict system gets this wrong in one of two ways, and both
  // are serious: "invalid" accuses a real person of forgery, "valid"
  // admits them on a qualification the College has withdrawn.
  const states = await page.evaluate(() => {
    const read = (sel) => [...document.querySelectorAll(sel + ' .vfy-check')]
      .map((c) => (c.className.match(/vfy-check--(\w+)/) || [])[1]);
    return { identity: read('#layerIdentity'), integrity: read('#layerIntegrity'),
      standing: read('#layerStanding') };
  });
  check('Identity still reads VERIFIED for a withdrawn award',
    states.identity.length > 0 && states.identity.every((x) => x === 'verified'),
    JSON.stringify(states.identity));
  check('...integrity too: the certificate is not called a forgery',
    states.integrity.includes('verified') && !states.integrity.includes('failed'),
    JSON.stringify(states.integrity));
  check('...while standing reads NOT VERIFIED',
    states.standing.includes('failed'), JSON.stringify(states.standing));

  // Standing leads the summary, whatever the other layers say.
  check('The headline says Withdrawn, not a count of passing checks',
    (await textOf(page, '#summaryHeadline')).trim() === 'Withdrawn',
    await textOf(page, '#summaryHeadline'));
  check('...and tells the verifier the credential is authentic but does not stand',
    /authentic but the award it records does not currently stand/.test(
      await textOf(page, '#summaryStatement')),
    await textOf(page, '#summaryStatement'));
  await page.close();
}

// --- A replaced award points forward ---------------------------------
{
  const page = await open(`${BASE}/verify.html`);
  await verify(page, codes.replaced);
  check('A superseded certificate resolves rather than dead-ending',
    (await page.locator('#result').isVisible()) === true);
  check('...and says it has been replaced', /superseded/i.test(await page.textContent('#status')));
  const alert = await page.textContent('#alert');
  check('...naming the code of the current record, so the checker is not stranded',
    alert.includes(codes.replacement), alert.slice(0, 140));

  await verify(page, codes.replacement);
  check('The replacement verifies as valid', /verified/i.test(await page.textContent('#status')));
  check('...with the correction applied', (await page.textContent('#holder')) === 'Corrected Demonstration');
  await page.close();
}

// --- Wrong codes fail cleanly ----------------------------------------
{
  const page = await open(`${BASE}/verify.html`);
  await verify(page, 'WEC-AAAA-BBBB-CCCCC');
  check('An unknown code shows no record card at all',
    (await page.locator('#result').isVisible()) === false);
  const err = (await page.textContent('#codeError') || '').trim();
  check('...and says so in the form, where the checker is looking', err.length > 15, err);

  await verify(page, 'not-a-code');
  check('Nonsense is refused without a stack trace',
    (await page.locator('#result').isVisible()) === false && errs.length === 0);

  await page.fill('#code', '');
  await page.locator('.vfy-submit').click();
  await page.waitForTimeout(300);
  check('An empty submission asks for the code rather than querying the Register',
    /enter the verification code/i.test(await page.textContent('#codeError')));
  await page.close();
}

// --- The QR/permalink path -------------------------------------------
// A scan must land on the RECORD, not on a form the scanner has to fill
// in from the certificate they are already holding.
{
  const page = await open(`${BASE}/verify.html?code=${encodeURIComponent(codes.valid)}&via=qr`);
  await page.waitForTimeout(900);
  check('A code in the URL verifies immediately, without a second action',
    (await page.locator('#result').isVisible()) === true);
  check('...showing the right record', (await page.textContent('#holder')) === 'Demonstration Graduate');
  await page.close();
}

// --- Case, spacing and a missing prefix ------------------------------
// People retype these from print. Refusing a lower-case code would cost
// the College a verification for no reason.
{
  const page = await open(`${BASE}/verify.html`);
  await verify(page, codes.valid.toLowerCase());
  check('A lower-case code verifies', (await page.locator('#result').isVisible()) === true);
  await verify(page, codes.valid.replace(/-/g, ' '));
  check('A code typed with spaces instead of dashes verifies',
    (await page.locator('#result').isVisible()) === true);
  await page.close();
}

// --- Mobile ----------------------------------------------------------
// The overwhelmingly common case: a phone camera on a printed
// certificate. If the record is below the fold or the field is too small
// to tap, the portal fails at the only moment it is used.
{
  const page = await open(`${BASE}/verify.html?code=${encodeURIComponent(codes.valid)}`, { width: 390, height: 780 });
  await page.waitForTimeout(900);
  const band = await page.locator('#status').boundingBox();
  check('On a phone the standing is visible without scrolling',
    !!band && band.y + band.height <= 780, band ? `${Math.round(band.y)}px` : 'not found');
  const input = await page.locator('#code').boundingBox();
  check('The code field is a comfortable tap target', !!input && input.height >= 44, input && Math.round(input.height));
  const overflow = await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth);
  check('No horizontal overflow at 390px', overflow <= 0, overflow);
  await page.screenshot({ path: join(HERE, 'screenshots', 'verify-mobile.png'), fullPage: true }).catch(() => {});
  await page.close();
}

// --- Accessibility basics --------------------------------------------
{
  const page = await open(`${BASE}/verify.html?code=${encodeURIComponent(codes.valid)}`);
  await page.waitForTimeout(900);
  check('The code field has a real label',
    (await page.locator('label[for="code"]').count()) === 1);
  check('The result region announces itself',
    (await page.getAttribute('#result', 'aria-live')) === 'polite');
  check('Focus moves to the outcome after a verification, not left on the button',
    await page.evaluate(() => document.activeElement && document.activeElement.id === 'status'));
  check('Exactly one h1', (await page.locator('h1').count()) === 1);
  await page.close();
}

check('No uncaught script errors', errs.length === 0, errs.slice(0, 2).join(' | '));

console.log(`\n${pass} passed, ${fail} failed.`);
await browser.close();
server.kill();
process.exit(fail ? 1 : 0);
