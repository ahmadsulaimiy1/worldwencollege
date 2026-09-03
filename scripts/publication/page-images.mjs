/**
 * SAMPLE PAGES — the inside of every volume, rendered from the volume.
 *
 * ────────────────────────────────────────────────────────────────────
 * WHY THESE ARE RASTERISED AND THE COVERS ARE NOT
 * ────────────────────────────────────────────────────────────────────
 * A cover is a drawing the College owns and can redraw at any size, so
 * assets/covers/ is vector. A page of a book is a typeset object with
 * its own line breaks, its own tables and its own rules, and the only
 * honest picture of it is a picture of it. Nothing here is a mock-up,
 * an illustration or a placeholder: every image this writes is a page
 * of the PDF a reader can download, rendered by pdf.js at the size the
 * page is displayed at.
 *
 * That distinction matters because the images are labelled "sample
 * pages" on the publication pages. A drawn approximation under that
 * label would be a claim about the contents of a book, made in a
 * picture, which is the hardest kind of claim for a reader to check.
 *
 * ────────────────────────────────────────────────────────────────────
 * WHICH PAGES
 * ────────────────────────────────────────────────────────────────────
 * The title page, then seven more spread evenly through the volume at
 * fixed fractions of its extent. Evenly spaced rather than
 * hand-chosen: a hand-picked sample is a curated sample, and a reader
 * deciding whether a 443-page reference volume is worth their evening
 * is better served by an unflattering honest slice of it than by the
 * eight prettiest pages somebody found.
 *
 * The fractions are constants, so the same volume rendered twice picks
 * the same pages, and a volume that grows by a chapter shows the same
 * PROPORTIONS of itself rather than the same absolute page numbers.
 *
 * ────────────────────────────────────────────────────────────────────
 * RUNNING IT
 * ────────────────────────────────────────────────────────────────────
 *     node scripts/publication/page-images.mjs           # only what is missing
 *     WEC_PAGES_FORCE=1 node scripts/publication/page-images.mjs
 *
 * It needs Chromium (PW_CHROMIUM overrides the path) and it serves the
 * repository over a loopback port for the duration, because pdf.js
 * cannot fetch a file:// URL from a file:// page — the browser refuses
 * it as a cross-origin request, which is correct of the browser and
 * merely inconvenient here.
 */
import { chromium } from 'playwright';
import http from 'node:http';
import {
  createReadStream, statSync, existsSync, writeFileSync, mkdirSync, readFileSync,
} from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..');
const OUT = path.join(ROOT, 'assets/pages');
const LIB = JSON.parse(readFileSync(path.join(ROOT, 'data/library.json'), 'utf8'));
const FORCE = process.env.WEC_PAGES_FORCE === '1';

/** Where in the volume to look, as fractions of the extent. */
const FRACTIONS = [0.10, 0.22, 0.35, 0.48, 0.61, 0.74, 0.88];
/** Rendered width in CSS pixels. Displayed at 420–560; 640 covers 2× on the small end. */
const WIDTH = 640;
const QUALITY = 0.74;

/** The pages to sample from a volume of `extent` pages. */
export function samplePages(extent) {
  if (extent <= 1) return [1];
  if (extent <= 8) return Array.from({ length: extent }, (_, i) => i + 1);
  const wanted = new Set([1]);
  for (const f of FRACTIONS) wanted.add(Math.min(extent, Math.max(2, Math.round(extent * f))));
  return [...wanted].sort((a, b) => a - b);
}

// ── the loopback server ──────────────────────────────────────────────
const MIME = {
  '.html': 'text/html', '.mjs': 'text/javascript', '.js': 'text/javascript',
  '.pdf': 'application/pdf', '.map': 'application/json', '.json': 'application/json',
};
const server = http.createServer((req, res) => {
  const rel = decodeURIComponent(req.url.split('?')[0]);
  const file = path.join(ROOT, rel);
  // Nothing outside the repository, whatever the request says.
  if (!file.startsWith(ROOT)) { res.writeHead(403); res.end('no'); return; }
  try {
    statSync(file);
    res.writeHead(200, { 'Content-Type': MIME[path.extname(file)] || 'application/octet-stream' });
    createReadStream(file).pipe(res);
  } catch { res.writeHead(404); res.end('not found'); }
});
const PORT = Number(process.env.WEC_PAGES_PORT || 8956);
await new Promise((r) => server.listen(PORT, r));

// ── the renderer ─────────────────────────────────────────────────────
const HARNESS = `<!doctype html><meta charset="utf-8"><body><canvas id="c"></canvas>
<script type="module">
import * as pdfjs from '/node_modules/pdfjs-dist/build/pdf.mjs';
pdfjs.GlobalWorkerOptions.workerSrc = '/node_modules/pdfjs-dist/build/pdf.worker.mjs';
let doc = null, docUrl = null;
window.openDoc = async (url) => {
  if (docUrl !== url) { doc = await pdfjs.getDocument({ url }).promise; docUrl = url; }
  return doc.numPages;
};
window.renderPage = async (pageNo, targetW) => {
  const page = await doc.getPage(pageNo);
  const base = page.getViewport({ scale: 1 });
  const vp = page.getViewport({ scale: targetW / base.width });
  const c = document.getElementById('c');
  c.width = Math.round(vp.width); c.height = Math.round(vp.height);
  const ctx = c.getContext('2d');
  // The page is painted onto white first. A PDF page has no background
  // of its own — the paper is the absence of ink — and a transparent
  // WebP of black type on nothing renders as black type on whatever
  // the page behind it happens to be.
  ctx.fillStyle = '#ffffff'; ctx.fillRect(0, 0, c.width, c.height);
  await page.render({ canvasContext: ctx, viewport: vp }).promise;
  return { w: c.width, h: c.height, data: c.toDataURL('image/webp', ${QUALITY}) };
};
window.__ready = true;
</script>`;
writeFileSync(path.join(ROOT, '.pdf-harness.html'), HARNESS);

const exe = process.env.PW_CHROMIUM || '/opt/pw-browsers/chromium-1194/chrome-linux/chrome';
const browser = await chromium.launch(existsSync(exe) ? { executablePath: exe } : {});
const page = await browser.newPage();
const failures = [];
page.on('pageerror', (e) => failures.push(String(e).slice(0, 200)));
await page.goto(`http://localhost:${PORT}/.pdf-harness.html`);
await page.waitForFunction('window.__ready === true', { timeout: 30000 });

mkdirSync(OUT, { recursive: true });

const manifest = {};
let rendered = 0; let reused = 0; let bytes = 0;

for (const v of LIB.volumes) {
  const src = `http://localhost:${PORT}${v.source}`;
  const local = path.join(ROOT, decodeURIComponent(v.source).replace(/^\//, ''));
  if (!existsSync(local)) {
    console.log(`  skipped ${v.slug} — ${path.basename(local)} is not in this checkout`);
    continue;
  }
  const declared = await page.evaluate((u) => window.openDoc(u), src);
  if (declared !== v.extent) {
    throw new Error(`page-images: "${v.slug}" is registered at ${v.extent} pages but the `
      + `document reports ${declared}. data/library.json and the file disagree, and the `
      + 'sample would be taken from the wrong places.');
  }
  const rows = [];
  for (const no of samplePages(v.extent)) {
    const name = `${v.slug}-p${String(no).padStart(3, '0')}.webp`;
    const file = path.join(OUT, name);
    if (!FORCE && existsSync(file)) {
      reused += 1;
      const meta = manifestSize(file);
      rows.push({ page: no, src: `/assets/pages/${name}`, ...meta });
      bytes += statSync(file).size;
      continue;
    }
    const r = await page.evaluate(([n, w]) => window.renderPage(n, w), [no, WIDTH]);
    const buf = Buffer.from(r.data.split(',')[1], 'base64');
    writeFileSync(file, buf);
    rendered += 1; bytes += buf.length;
    rows.push({ page: no, src: `/assets/pages/${name}`, w: r.w, h: r.h });
  }
  manifest[v.slug] = rows;
  process.stdout.write(`  ${v.slug}: ${rows.length} pages of ${v.extent}\n`);
}

/**
 * The width and height of an image already on disk, read out of the
 * WebP header rather than by decoding it. A reused image still has to
 * declare its dimensions or the page reflows as the samples load.
 */
function manifestSize(file) {
  const b = readFileSync(file);
  // VP8L (lossless) and VP8 (lossy) carry the size in different places;
  // Chromium writes VP8 for a quality below 1, VP8L above it.
  const fourcc = b.toString('ascii', 12, 16);
  if (fourcc === 'VP8 ') {
    return { w: b.readUInt16LE(26) & 0x3fff, h: b.readUInt16LE(28) & 0x3fff };
  }
  if (fourcc === 'VP8L') {
    const bits = b.readUInt32LE(21);
    return { w: (bits & 0x3fff) + 1, h: ((bits >> 14) & 0x3fff) + 1 };
  }
  if (fourcc === 'VP8X') {
    return {
      w: (b[24] | (b[25] << 8) | (b[26] << 16)) + 1,
      h: (b[27] | (b[28] << 8) | (b[29] << 16)) + 1,
    };
  }
  throw new Error(`page-images: ${path.basename(file)} is not a WebP this can measure.`);
}

await browser.close();
server.close();

if (failures.length) {
  throw new Error(`page-images: the renderer reported ${failures.length} error(s):\n  `
    + failures.slice(0, 5).join('\n  '));
}

writeFileSync(path.join(ROOT, 'data/samples.json'), `${JSON.stringify({
  _: [
    'GENERATED by scripts/publication/page-images.mjs — do not edit by hand.',
    'Every entry is a real page of the volume it names, rendered from the',
    'PDF at the width it is displayed at. Nothing here is a mock-up.',
    `Rendered at ${WIDTH}px wide, WebP quality ${QUALITY}.`,
  ],
  width: WIDTH,
  quality: QUALITY,
  fractions: FRACTIONS,
  volumes: manifest,
}, null, 2)}\n`);

console.log(`pages: ${rendered} rendered, ${reused} reused, `
  + `${(bytes / 1048576).toFixed(1)} MB in assets/pages/`);
