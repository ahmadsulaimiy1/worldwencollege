/**
 * THE BOARD & INVESTMENT EDITION — built, paginated, audited, printed.
 *
 *   node scripts/plan/render-book.mjs
 *
 * Every number comes from one solved run of the plan's model
 * (book/facts.mjs). The book is composed in Node, poured into pages in
 * the browser, and then looked at by the build: a page that overflows,
 * clips, sets text on text, misnumbers itself, carries a photograph or
 * sets a word its ground makes unreadable fails the build.
 */
import { writeFileSync, readFileSync, mkdirSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { chromium } from 'playwright';
import { compose } from './book/compose.mjs';
import { paginate, audit } from './book/browser.mjs';
import { BOOK } from './book/front.mjs';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..');
/* A board paper, not a Press volume: it lives beside the catalogue, not in it. */
const OUT = path.join(ROOT, 'publication/board');
const PDF = path.join(OUT, 'WEC-LC Ten-Year Institutional Master Plan — Board & Investment Edition.pdf');
const HTML = path.join(OUT, '.masterplan-board.html');

const { F, html } = compose();
mkdirSync(OUT, { recursive: true });
writeFileSync(HTML, html);

const browser = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium-1194/chrome-linux/chrome' });
const page = await browser.newPage({ viewport: { width: 1000, height: 1300 } });
const errors = [];
page.on('pageerror', (e) => errors.push(String(e)));
page.on('console', (m) => { if (m.type() === 'error') errors.push(m.text()); });
await page.goto(`file://${HTML}`, { waitUntil: 'load' });
await page.evaluate(() => document.fonts.ready);
await page.emulateMedia({ media: 'print' });
const pag = await page.evaluate(paginate, BOOK);
const bad = await page.evaluate(audit);
writeFileSync(HTML, await page.content());
await page.pdf({ path: PDF, width: '230mm', height: '300mm', printBackground: true, margin: { top: 0, bottom: 0, left: 0, right: 0 } });
await browser.close();

let failed = false;
if (pag.unresolved.length) { console.error(`Unresolved page references: ${pag.unresolved.join(', ')}`); failed = true; }
if (errors.length) { console.error('Browser errors:\n  ' + errors.join('\n  ')); failed = true; }
if (bad.length) {
  failed = true;
  console.error('\nPAGE COMPOSITION FAILED:');
  for (const o of bad) {
    console.error(`  page ${o.page}: ${o.over}px over${o.wide ? `, ${o.wide}px too wide` : ''}${o.clipped ? ', clipped' : ''}`
      + `${o.faint ? `, unreadable — “${o.faint}”` : ''}${o.collided ? `, text on text “${o.collided}…”` : ''}`
      + `${o.misfoliated ? `, prints folio ${o.misfoliated}` : ''}${o.img ? ', carries a raster image' : ''}`);
  }
}
console.log(`Wrote the Board & Investment Edition — ${pag.pages} pages, ${(readFileSync(PDF).length / 1024 / 1024).toFixed(1)} MB.`);
if (failed) process.exitCode = 1;
