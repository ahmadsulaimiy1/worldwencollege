/**
 * Resample the plates to the size they are actually printed at.
 *
 * ────────────────────────────────────────────────────────────────────
 * WHY THIS IS A PRODUCTION STEP AND NOT AN OPTIMISATION
 * ────────────────────────────────────────────────────────────────────
 * The licensed sources are 5,631–8,192 px wide. The plates print 168 mm
 * wide, which at 300 dpi needs 1,984 px. Placing an 8,192 px image in
 * that frame embeds four times the data the press can use: it does not
 * make the plate sharper — the printer's RIP will downsample it anyway —
 * it just makes a 42 MB PDF that some systems will refuse to accept and
 * every reviewer has to wait for.
 *
 * Resampled here to 2,400 px, which is 363 dpi at the placed size: above
 * the 300 dpi floor with headroom for a printer who wants to enlarge the
 * plate slightly, and far below the point of waste.
 *
 * The originals are kept. Resampling is destructive and a future edition
 * may place these images at a different size.
 */
import { chromium } from 'playwright';
import { readdirSync, statSync, renameSync, existsSync, mkdirSync, writeFileSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..');
const IMG = path.join(ROOT, 'publication', 'img');
const ORIG = path.join(IMG, 'source');
const TARGET_W = 2400;
const QUALITY = 0.9;

mkdirSync(ORIG, { recursive: true });

const exe = process.env.PW_CHROMIUM || '/opt/pw-browsers/chromium-1194/chrome-linux/chrome';
// --allow-file-access-from-files is required for two reasons: an
// about:blank page cannot decode a file:// image at all, and even from a
// file:// page Chromium treats each file as an opaque origin, which
// taints the canvas and makes toDataURL throw a SecurityError.
const browser = await chromium.launch({
  ...(existsSync(exe) ? { executablePath: exe } : {}),
  args: ['--allow-file-access-from-files'],
});
const page = await browser.newPage();
// The page must itself be a file:// document, or the images are
// cross-scheme and refuse to decode.
writeFileSync(path.join(IMG, '.resample.html'), '<!doctype html><title>resample</title>');
await page.goto(`file://${path.join(IMG, '.resample.html')}`, { waitUntil: 'load' });

// Enumerate from the preserved originals when they exist, not from the
// live directory. A run that failed part-way had already moved its first
// file aside, so a second run enumerating the live directory silently
// skipped it — the plate stayed at full resolution and nothing said so.
const names = new Set([
  ...readdirSync(IMG).filter((f) => /^level-[IVX]+\.jpg$/.test(f)),
  ...(existsSync(ORIG) ? readdirSync(ORIG).filter((f) => /^level-[IVX]+\.jpg$/.test(f)) : []),
]);
for (const file of [...names].sort()) {
  const live = path.join(IMG, file);
  const kept = path.join(ORIG, file);
  // Move the untouched original aside once; on re-runs resample from it,
  // never from an already-resampled file, or quality compounds away.
  if (!existsSync(kept)) renameSync(live, kept);

  // Idempotent: a file already at the target size is left alone. Without
  // this the step re-encodes on every run and the JPEG degrades a little
  // each time — generation loss that nobody would notice until a proof.
  if (existsSync(live) && statSync(live).size < 1_500_000) {
    console.log(`${file.padEnd(14)} already resampled — skipped`);
    continue;
  }

  const before = statSync(kept).size;
  // A fresh page per image. Decoding several 45-megapixel JPEGs into one
  // page exhausted the renderer and the fifth failed with an
  // EncodingError that looked like a corrupt file rather than a resource
  // limit.
  const pg = await browser.newPage();
  await pg.goto(`file://${path.join(IMG, '.resample.html')}`, { waitUntil: 'load' });
  const data = await pg.evaluate(async ({ src, w, q }) => {
    const img = new Image();
    img.src = src;
    await img.decode();
    const scale = w / img.naturalWidth;
    const c = document.createElement('canvas');
    c.width = w;
    c.height = Math.round(img.naturalHeight * scale);
    const ctx = c.getContext('2d');
    ctx.imageSmoothingQuality = 'high';
    ctx.drawImage(img, 0, 0, c.width, c.height);
    return { url: c.toDataURL('image/jpeg', q), w: c.width, h: c.height,
      from: `${img.naturalWidth}x${img.naturalHeight}` };
  }, { src: `file://${kept}`, w: TARGET_W, q: QUALITY });

  await pg.close();
  writeFileSync(live, Buffer.from(data.url.split(',')[1], 'base64'));
  const after = statSync(live).size;
  const dpi = Math.round(TARGET_W / (168 / 25.4));
  console.log(`${file.padEnd(14)} ${data.from} -> ${data.w}x${data.h}  `
    + `${(before / 1048576).toFixed(1)}MB -> ${(after / 1048576).toFixed(1)}MB  ${dpi} dpi at 168mm`);
}
await browser.close();
