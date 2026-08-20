import { chromium } from 'playwright';
import { spawn } from 'node:child_process';
const PORT = Number(process.env.LAB_PORT || 8933), OUT = '/tmp/shots';
const server = spawn(process.execPath, ['--experimental-sqlite', 'tests/browser/lab-server.mjs'],
  { cwd: '/home/user/worldwencollege', env: { ...process.env, LAB_PORT: String(PORT) }, stdio: ['ignore','pipe','pipe'] });
await new Promise((r, j) => { const t = setTimeout(() => j(new Error('no server')), 25000);
  server.stdout.on('data', d => { if (String(d).includes('ready')) { clearTimeout(t); r(); } }); });
const b = await chromium.launch({ executablePath: process.env.PW_CHROMIUM || '/opt/pw-browsers/chromium-1194/chrome-linux/chrome' });

const WIDTHS = (process.env.WIDTHS || '360,390,480,620,768,940,1024,1180,1280,1440,1920,2560').split(',').map(Number);
const SHOTS = new Set((process.env.SHOTS || '390,768,1440').split(','));
for (const w of WIDTHS) {
  const ctx = await b.newContext({ viewport: { width: w, height: 900 }, timezoneId: 'Asia/Riyadh' });
  const p = await ctx.newPage();
  await p.goto(`http://localhost:${PORT}${process.env.ROUTE || '/'}`, { waitUntil: 'domcontentloaded' });
  await p.waitForTimeout(600);
  const m = await p.evaluate(() => {
    const box = (el) => { const r = el.getBoundingClientRect(); return { c: (el.className||'').toString().split(' ')[0], x: Math.round(r.x), w: Math.round(r.width) }; };
    const inner = document.querySelector('.topbar__inner');
    const kids = inner ? [...inner.children].filter(e => getComputedStyle(e).display !== 'none').map(box) : [];
    const ir = inner ? inner.getBoundingClientRect() : null;
    const content = kids.reduce((n, k) => n + k.w, 0);
    const track = document.querySelector('.utilrail__track');
    const bays = track ? [...track.children].map(el => {
      const label = el.querySelector('span') || el;
      return { t: (label.textContent||'').trim().slice(0,20), w: Math.round(el.getBoundingClientRect().width),
               sw: el.scrollWidth };
    }) : [];
    return {
      barH: ir ? Math.round(ir.height) : 0, barW: ir ? Math.round(ir.width) : 0, kids, content,
      slack: ir ? Math.round(ir.width - content) : 0,
      railOver: track ? track.scrollWidth - track.clientWidth : 0,
      trackW: track ? Math.round(track.clientWidth) : 0, bays,
      docOver: document.documentElement.scrollWidth - document.documentElement.clientWidth,
    };
  });
  console.log(`${String(w).padStart(4)} h=${String(m.barH).padStart(3)} content=${String(m.content).padStart(4)}/${String(m.barW).padStart(4)} slack=${String(m.slack).padStart(4)} rail+${m.railOver} track=${m.trackW} doc+${m.docOver}  ${m.kids.map(k=>`${k.c}@${k.x}w${k.w}`).join(' ')}`);
  if (w >= 1100) console.log('       bays: ' + m.bays.map(x=>`${x.t}:${x.w}/${x.sw}`).join('  '));
  if (SHOTS.has(String(w))) await p.screenshot({ path: `${OUT}/bar${(process.env.TAG||'')}-${w}.png`, clip: { x: 0, y: 0, width: w, height: 200 } });
  await ctx.close();
}
await b.close(); server.kill();
