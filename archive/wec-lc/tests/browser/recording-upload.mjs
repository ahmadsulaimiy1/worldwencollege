// Run with: node tests/browser/recording-upload.mjs
//
// The end-to-end test for learner recording: a real browser, a real
// MediaRecorder fed by Chromium's fake microphone, the real upload code
// in js/listening-lab.js, the real recording-storage.js on the server,
// and a real playback request for the bytes that came back.
//
// It exists because tests/recording-storage.test.mjs can prove the
// STORAGE is correct while proving nothing about whether the Lab ever
// calls it — which is exactly the shape of the defect that let both
// pages ship with no Authorization header and a green suite
// (tests/browser/lab-auth.mjs). Unit-testing a subsystem and never
// exercising its only caller is how that happens.
//
// The microphone is Chromium's synthetic device (a tone), so the audio
// is real audio produced by a real encoder — not a fixture blob
// pretending to be one.
import { chromium } from 'playwright';
import { spawn } from 'node:child_process';
import { existsSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const HERE = dirname(fileURLToPath(import.meta.url));
const PORT = process.env.LAB_PORT || 8819;
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
const browser = await chromium.launch({
  ...(existsSync(exe) ? { executablePath: exe } : {}),
  args: [
    '--use-fake-device-for-media-stream',   // a synthetic microphone that produces a tone
    '--use-fake-ui-for-media-stream',       // auto-grant, so getUserMedia does not block on a prompt
    '--autoplay-policy=no-user-gesture-required',
  ],
});
const ctx = await browser.newContext({ viewport: { width: 1280, height: 950 }, permissions: ['microphone'] });
const page = await ctx.newPage();
await page.route('**://fonts.googleapis.com/**', (r) => r.abort());
await page.route('**://fonts.gstatic.com/**', (r) => r.abort());

const errs = [];
page.on('pageerror', (e) => errs.push(e.message));
const calls = [];
page.on('request', (r) => {
  const u = new URL(r.url());
  if (u.pathname.startsWith('/api/lms/recording')) calls.push(`${r.method()} ${u.pathname}`);
});

await page.goto(`${BASE}/listening-lab.html?unit=unt_l1_m1&level=1`, { waitUntil: 'domcontentloaded' });
await page.waitForSelector('body.is-ready', { timeout: 15000 });

const supported = await page.evaluate(() => !!(navigator.mediaDevices && window.MediaRecorder));
check('The browser under test can actually record (fake device attached)', supported);

// Record for a moment, then stop. Both are the real button.
await page.locator('#rec').click();
await page.waitForTimeout(1500);
await page.locator('#rec').click();

// Wait for the take to leave the 'uploading' state.
await page.waitForFunction(
  () => { const t = (window.__lab.takes || [])[0]; return t && t.status !== 'uploading'; },
  { timeout: 20000 },
).catch(() => {});

const take = await page.evaluate(() => (window.__lab.takes || [])[0] || null);
check('A take was created by pressing Record', !!take, JSON.stringify(take));
check('The take finished uploading rather than staying local',
  take && take.status === 'submitted' && take.local === false, take && `${take.status}/local=${take.local}`);
check('It was given a real attempt number by the server', take && take.attempt === 1, take && take.attempt);
check('Playback now points at the authorised endpoint, not a blob: URL',
  take && /^\/api\/lms\/recording\/audio\?id=rec_/.test(take.mediaUrl || ''), take && take.mediaUrl);

check('The upload used the resumable three-step path',
  calls.includes('POST /api/lms/recording/init')
  && calls.some((c) => c.startsWith('PUT /api/lms/recording/part'))
  && calls.includes('POST /api/lms/recording/complete'),
  calls.join(' | '));
check('The obsolete single-shot endpoint is no longer used',
  !calls.includes('POST /api/lms/recording'), calls.join(' | '));

// The real proof: fetch the bytes back through the playback endpoint.
//
// Guarded on the URL being the API path, and not merely on there being
// a URL. A blob: URL fetches successfully from inside the page, so an
// unguarded version of this assertion passed while the upload was
// failing and the audio had never left the browser — which is the same
// class of false confidence this whole file exists to prevent.
const served = take && /^\/api\/lms\/recording\/audio\?id=rec_/.test(take.mediaUrl || '');
const played = served ? await page.evaluate(async (u) => {
  const r = await fetch(u);
  if (!r.ok) return { ok: false, status: r.status };
  const b = await r.arrayBuffer();
  return { ok: true, bytes: b.byteLength, type: r.headers.get('content-type') };
}, take.mediaUrl) : { ok: false, reason: 'mediaUrl is not a server URL — nothing was uploaded' };
check('The recorded audio can be fetched back from the server', played.ok, JSON.stringify(played));
check('...and it is a non-trivial amount of real audio', played.ok && played.bytes > 1000, played.bytes);
check('...served with an audio content type', played.ok && /^audio\//.test(played.type || ''), played.type);

const label = await page.locator('#takes li').first().textContent();
check('The learner is told the take is uploaded and awaiting review',
  /awaiting review/i.test(label || ''), (label || '').trim().slice(0, 80));
const note = await page.textContent('#recNote');
check('...and the status line says uploaded, not merely saved',
  /uploaded and sent for review/i.test(note || ''), (note || '').trim());

check('No uncaught script errors during recording and upload', errs.length === 0, errs.slice(0, 2).join(' | '));

await page.screenshot({ path: join(HERE, 'screenshots', 'recording-upload.png'), fullPage: false }).catch(() => {});

console.log(`\n${pass} passed, ${fail} failed.`);
await browser.close();
server.kill();
process.exit(fail ? 1 : 0);
