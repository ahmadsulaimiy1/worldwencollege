// Run with: node tests/browser/my-award.mjs
//
// THE CERTIFICATE, in a real browser, against the real register.
//
// The digital certificate is itemised on /admissions/tuition/ at five
// per cent of every level fee and promised on three other pages. Every
// part of it existed except the route by which the person who paid for
// it could obtain it. These checks are about the two ways a certificate
// page can be wrong while the endpoint under it is right:
//
//   · IT CAN SAY WHAT THE REGISTER DID NOT. Every word on the face is
//     asserted against the payload, because `awards` stores the title,
//     the post-nominal and the citation denormalised precisely so a
//     certificate conferred in 2027 still reads as it did on the day. A
//     page that recomposed any of them from a level id would rewrite
//     old certificates every time a level was renamed.
//
//   · IT CAN VOUCH FOR ITSELF. A certificate that printed
//     "cryptographically signed" without naming the key would be
//     asserting its own trustworthiness. The key id and the moment are
//     asserted as present and as matching the register.
//
// And the code, which is the whole of this College's public position:
// it must be on the face, in a run that is never mirrored, beside a
// square that resolves.
import { chromium } from 'playwright';
import { spawn } from 'node:child_process';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const HERE = dirname(fileURLToPath(import.meta.url));
const PORT = process.env.LAB_PORT || 8849;
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

async function open(path, width = 1440) {
  const ctx = await browser.newContext({ viewport: { width, height: 900 } });
  const page = await ctx.newPage();
  const fonts = [];
  page.on('requestfailed', (r) => {
    if (/fonts\.(googleapis|gstatic)\.com/.test(r.url())) fonts.push(r.url());
    else problems.push(`${path}: request failed ${r.url()}`);
  });
  page.on('console', (m) => {
    if (m.type() !== 'error') return;
    if (/net::ERR_/.test(m.text()) && fonts.length) return;
    problems.push(`${path}: ${m.text()}`);
  });
  page.on('pageerror', (e) => problems.push(`${path}: PAGEERROR ${e.message}`));
  await page.goto(BASE + path, { waitUntil: 'networkidle' });
  await page.waitForTimeout(700);
  return { ctx, page };
}

const payload = await (await fetch(`${BASE}/api/student/awards`)).json();
const award = payload.awards[0];
check('the harness holds a conferred award to draw', Boolean(award), JSON.stringify(payload.awards.length));

// ═══════════════════════════════════════════════════════════════════
// THE FACE OF THE CERTIFICATE IS THE REGISTER'S
// ═══════════════════════════════════════════════════════════════════
{
  const { ctx, page } = await open('/my-award.html');

  check('the state line is cleared once the certificate is drawn',
    (await page.textContent('#state') || '').trim() === '');

  const certs = await page.$$('.awd');
  check('one certificate per award in the register',
    certs.length === payload.awards.length, `${certs.length} vs ${payload.awards.length}`);

  const face = {
    title: (await page.textContent('.awd__title')).trim(),
    post: (await page.textContent('.awd__post')).trim(),
    holder: (await page.textContent('.awd__holder')).trim(),
    citation: (await page.textContent('.awd__citation')).trim(),
    code: (await page.textContent('.awd__code-value')).trim(),
  };
  check('the award title is the register\'s, character for character',
    face.title === award.awardTitle, face.title);
  check('...and the post-nominal', face.post === award.postNominal, face.post);
  check('...and the holder\'s name as held', face.holder === award.holderName, face.holder);
  check('...and the citation as written', face.citation === award.citation, face.citation.slice(0, 60));
  check('...and the verification code', face.code === award.verificationCode, face.code);

  check('the code is set LTR so it is never mirrored',
    (await page.getAttribute('.awd__code-value', 'dir')) === 'ltr');

  // THE SIGNATURE, or its absence, named.
  const sig = (await page.textContent('.awd__sig')).trim();
  if (award.signature) {
    check('the signing key is named on the face', sig.includes(award.signature.kid), sig);
    check('...and whether it was a development or a managed key',
      /development key|managed key/.test(sig), sig);
  } else {
    check('an unsigned award says so, and says a missing signature is not a failed one',
      /Unsigned/.test(sig) && /not a failed one/.test(sig), sig);
  }

  // The square that makes it checkable.
  const qr = await page.evaluate(() => {
    const i = document.querySelector('.awd__qr');
    return i ? { w: i.naturalWidth, alt: i.alt, src: i.getAttribute('src') } : null;
  });
  check('the QR square resolves rather than 404ing', qr && qr.w > 0, JSON.stringify(qr));
  check('...and carries the code in its alternative text',
    qr && qr.alt.includes(award.verificationCode), qr && qr.alt);

  // .btn--outline and never .btn--ghost. Ghost is a dark-ground
  // control — css/brand.css now says so beside the rule — and it
  // measures 1.54:1 on a paper card. The class is asserted rather than
  // the contrast, because the contrast is measured by
  // tests/browser/render-quality.mjs and asserting it twice in two
  // instruments is how two instruments come to disagree.
  check('the actions use the light-ground button, not the dark-ground one',
    await page.evaluate(() => {
      const b = document.querySelector('.awd__acts a');
      return b.classList.contains('btn--outline') && !b.classList.contains('btn--ghost');
    }));

  const verify = await page.getAttribute('.awd__acts a', 'href');
  check('the check link points at the public verification page for this code',
    verify === award.verifyPath, verify);

  // MATERIAL LAW.
  const material = await page.evaluate(() => {
    const c = document.querySelector('.awd');
    return {
      aurum: c.classList.contains('aurum'),
      edge: c.classList.contains('edge-lit'),
      tilt: c.classList.contains('tilt'),
      gold: c.classList.contains('gold-live'),
      reveal: c.classList.contains('reveal'),
      crest: Boolean(c.querySelector('.awd-crest')),
      seal: Boolean(c.querySelector('.awd-seal')),
    };
  });
  check('the certificate is a struck object with a crest and a seal',
    Object.values(material).every(Boolean), JSON.stringify(material));

  check('nothing takes the pseudo-elements .aurum and .edge-lit claim',
    await page.evaluate(() => {
      const c = document.querySelector('.awd');
      const before = getComputedStyle(c, '::before').content;
      const after = getComputedStyle(c, '::after').content;
      // Both must be the atelier's own, which set a content value; the
      // test is that neither is 'none', i.e. neither was cancelled by a
      // rule in css/award.css.
      return before !== 'none' && after !== 'none';
    }));

  // The published terms, rendered rather than linked away.
  const terms = await page.textContent('[data-terms]');
  check('what the certificate costs and who may check it is on the page',
    /no charge for it now or later/.test(terms) && /without an account/.test(terms),
    terms.replace(/\s+/g, ' ').slice(0, 120));
  check('...including that a printed copy is a separate, paid service',
    /printed copy/i.test(terms) && /published fee/i.test(terms));

  for (const w of [1440, 900, 390]) {
    await page.setViewportSize({ width: w, height: 900 });
    await page.waitForTimeout(200);
    const over = await page.evaluate(() => document.documentElement.scrollWidth > window.innerWidth + 1);
    check(`ltr ${w}: no horizontal overflow`, !over);
  }
  await ctx.close();
}

// ═══════════════════════════════════════════════════════════════════
// THE ARABIC EDITION
// ═══════════════════════════════════════════════════════════════════
{
  const { ctx, page } = await open('/ar/my-award.html');

  check('the Arabic certificate renders right to left',
    (await page.getAttribute('html', 'dir')) === 'rtl');

  const labels = await page.textContent('.awd__facts');
  check('...with the field labels in Arabic', ARABIC.test(labels), labels.replace(/\s+/g, ' ').slice(0, 70));

  const terms = await page.textContent('[data-terms]');
  check('...and the published terms in Arabic, not the English fallback',
    ARABIC.test(terms) && !/no charge for it now or later/.test(terms));

  // THE ONE THING THAT MUST NOT BE TRANSLATED. A holder's name and an
  // award title are the register's own strings; the Arabic edition
  // SELECTS between editions the platform supplied and invents neither.
  check('the holder\'s name is the register\'s, unchanged in the Arabic edition',
    (await page.textContent('.awd__holder')).trim() === award.holderName);
  check('...and the code is still LTR inside a right-to-left page',
    (await page.getAttribute('.awd__code-value', 'dir')) === 'ltr');

  for (const w of [1440, 390]) {
    await page.setViewportSize({ width: w, height: 900 });
    await page.waitForTimeout(200);
    const over = await page.evaluate(() => document.documentElement.scrollWidth > window.innerWidth + 1);
    check(`rtl ${w}: no horizontal overflow`, !over);
  }
  await ctx.close();
}

check('no console errors or page errors anywhere',
  problems.length === 0, problems.slice(0, 4).join(' | '));

await browser.close();
server.kill();
console.log(`\n${pass} passed, ${fail} failed.`);
process.exit(fail ? 1 : 0);
