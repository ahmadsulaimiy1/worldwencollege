// Run with: node tests/browser/gallery.mjs [--full]
//
// Captures a screenshot of every key route at three widths, in both
// languages, for visual review. Not an assertion suite —
// tests/browser/route-audit.mjs and typography-audit.mjs do the
// verifying; this exists so the pages can be LOOKED at.
//
// ── WHY THIS FILE WAS REWRITTEN ──────────────────────────────────────
//
// It used to abort the Google Fonts request:
//
//     await page.route('**://fonts.googleapis.com/**', (r) => r.abort());
//     // Blocked in this sandbox and slow through the proxy; pages fall
//     // back through the brand.css stack, which is what gets captured.
//
// That comment was true and the conclusion drawn from it was wrong. What
// gets captured is not "what a visitor sees" — it is Chromium's fallback
// faces, and Arabic in particular renders in a system Naskh with
// metrics nothing like Amiri's. An entire redesign was reviewed against
// these captures, approved, and shipped with an Arabic headline whose
// lines sat inside one another, because no picture anybody looked at had
// ever contained the real font.
//
// So it now serves the four families from node_modules through
// tests/browser/lib/real-fonts.mjs, the same module the typography audit
// uses. A review capture and a measurement now agree about what the page
// is, which is the least a gallery can be asked to do.
import { chromium } from 'playwright';
import { spawn } from 'node:child_process';
import { mkdirSync, existsSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { serveRealFonts, fontsSettled } from './lib/real-fonts.mjs';

const HERE = dirname(fileURLToPath(import.meta.url));
const OUT = join(HERE, 'screenshots/gallery');
const PORT = process.env.LAB_PORT || 8812;
const BASE = `http://localhost:${PORT}`;
const FULL = process.argv.includes('--full');
mkdirSync(OUT, { recursive: true });

// English and Arabic in matched pairs wherever a pair exists, so a
// reviewer can put the two editions side by side rather than judging the
// Arabic against a memory of the English.
const ROUTES = [
  ['home', '/'],
  ['home-ar', '/ar/'],
  ['about', '/about/'],
  ['about-ar', '/ar/about/'],
  ['governance', '/governance/'],
  ['governance-ar', '/ar/governance/'],
  ['academics', '/academics/'],
  ['academics-ar', '/ar/academics/'],
  ['teaching', '/academics/teaching/'],
  ['admissions', '/admissions/'],
  ['admissions-ar', '/ar/admissions/'],
  ['tuition', '/admissions/tuition/'],
  ['tuition-ar', '/ar/admissions/tuition/'],
  ['faculty', '/faculty/'],
  ['faculty-ar', '/ar/faculty/'],
  ['evidence', '/governance/evidence/'],
  ['press', '/press/'],
  ['library', '/library/'],
  ['contact', '/contact/'],
  ['contact-ar', '/ar/contact/'],
  ['student-portal', '/student-portal/'],
  ['listening-lab', '/listening-lab.html?unit=unt_l1_m1&level=1'],
];

// 1024 is here because the header broke at exactly this width and no
// capture had ever been taken at it: 1440 was wide enough to hide the
// overflow and 390 narrow enough to have collapsed the nav away.
const VIEWPORTS = [
  [{ width: 1440, height: 900 }, 'desktop'],
  [{ width: 1024, height: 800 }, 'laptop'],
  [{ width: 390, height: 844 }, 'mobile'],
];

const server = spawn(process.execPath, ['--experimental-sqlite', join(HERE, 'lab-server.mjs')], {
  env: { ...process.env, LAB_PORT: String(PORT) }, stdio: ['ignore', 'pipe', 'pipe'],
});
await new Promise((r) => server.stdout.on('data', (d) => String(d).includes('ready') && r()));

const exe = process.env.PW_CHROMIUM || '/opt/pw-browsers/chromium-1194/chrome-linux/chrome';
const browser = await chromium.launch(existsSync(exe) ? { executablePath: exe } : {});

let reported = false;
for (const [viewport, label] of VIEWPORTS) {
  const context = await browser.newContext({ viewport, deviceScaleFactor: 2 });
  await serveRealFonts(context);
  const page = await context.newPage();
  let i = 1;
  for (const [name, route] of ROUTES) {
    await page.goto(BASE + route, { waitUntil: 'domcontentloaded', timeout: 15000 }).catch(() => {});
    const faces = await fontsSettled(page).catch(() => []);
    if (!reported && faces.length) { console.log(`Faces served: ${faces.join(', ')}\n`); reported = true; }
    // Entry animations are ~600ms; capturing before they finish shows
    // headings mid-rise, which reads as a layout fault that isn't one.
    await page.waitForTimeout(900);
    await page.screenshot({
      path: join(OUT, `${label}-${String(i).padStart(2, '0')}-${name}.png`),
      fullPage: FULL,
    });
    i++;
  }
  await context.close();
  console.log(`${label} (${viewport.width}px): ${ROUTES.length} captured`);
}
console.log(`\nGallery: ${OUT}${FULL ? ' (full-page)' : ' (above the fold)'}`);
await browser.close();
server.kill();
