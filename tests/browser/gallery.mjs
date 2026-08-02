// Run with: node tests/browser/gallery.mjs
// Captures a screenshot of every key route at desktop and mobile, for
// visual review. Not an assertion suite — tests/browser/route-audit.mjs
// does the verifying; this exists so the pages can be looked at.
import { chromium } from 'playwright';
import { spawn } from 'node:child_process';
import { mkdirSync, existsSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const HERE = dirname(fileURLToPath(import.meta.url));
const OUT = join(HERE, 'screenshots/gallery');
const PORT = process.env.LAB_PORT || 8812;
const BASE = `http://localhost:${PORT}`;
mkdirSync(OUT, { recursive: true });

const ROUTES = [
  ['home', '/'],
  ['about', '/about/'],
  ['academics', '/academics/'],
  ['iefc', '/academics/iefc/'],
  ['admissions', '/admissions/'],
  ['tuition', '/admissions/tuition/'],
  ['faculty', '/faculty/'],
  ['faq', '/faq/'],
  ['contact', '/contact/'],
  ['student-portal', '/student-portal/'],
  ['student-portal-preview', '/student-portal/preview/'],
  ['finance-preview', '/finance/preview/'],
  ['arabic-home', '/ar/'],
  ['listening-lab', '/listening-lab.html?unit=unt_l1_m1&level=1'],
  ['instructor-review', '/instructor-review.html'],
];

const server = spawn(process.execPath, ['--experimental-sqlite', join(HERE, 'lab-server.mjs')], {
  env: { ...process.env, LAB_PORT: String(PORT) }, stdio: ['ignore', 'pipe', 'pipe'],
});
await new Promise((r) => server.stdout.on('data', (d) => String(d).includes('ready') && r()));

const exe = process.env.PW_CHROMIUM || '/opt/pw-browsers/chromium-1194/chrome-linux/chrome';
const browser = await chromium.launch(existsSync(exe) ? { executablePath: exe } : {});

for (const [vp, label] of [[{ width: 1440, height: 900 }, 'desktop'], [{ width: 390, height: 844 }, 'mobile']]) {
  const page = await browser.newPage({ viewport: vp });
  // Blocked in this sandbox and slow through the proxy; pages fall back
  // through the brand.css stack, which is what gets captured.
  await page.route('**://fonts.googleapis.com/**', (r) => r.abort());
  await page.route('**://fonts.gstatic.com/**', (r) => r.abort());
  let i = 1;
  for (const [name, route] of ROUTES) {
    await page.goto(BASE + route, { waitUntil: 'domcontentloaded', timeout: 12000 }).catch(() => {});
    await page.waitForTimeout(400);
    await page.screenshot({ path: join(OUT, `${label}-${String(i).padStart(2, '0')}-${name}.png`) });
    i++;
  }
  await page.close();
  console.log(`${label}: ${ROUTES.length} captured`);
}
console.log(`\nGallery: ${OUT}`);
await browser.close();
server.kill();
