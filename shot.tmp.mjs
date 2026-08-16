import { chromium } from 'playwright';
import { spawn } from 'node:child_process';
import { existsSync } from 'node:fs';
import { serveRealFonts, fontsSettled } from './tests/browser/lib/real-fonts.mjs';
const PORT=8879;
const server = spawn(process.execPath, ['--experimental-sqlite','tests/browser/lab-server.mjs'], {env:{...process.env,LAB_PORT:String(PORT)},stdio:['ignore','pipe','pipe']});
await new Promise(r=>server.stdout.on('data',d=>{if(String(d).includes('ready'))r();}));
const exe='/opt/pw-browsers/chromium-1194/chrome-linux/chrome';
const b=await chromium.launch(existsSync(exe)?{executablePath:exe}:{});
const ctx=await b.newContext({viewport:{width:1440,height:1600},deviceScaleFactor:1});
await serveRealFonts(ctx);
const p=await ctx.newPage();
await p.goto(`http://localhost:${PORT}${process.argv[2]}`,{waitUntil:'networkidle'});
await fontsSettled(p); await p.waitForTimeout(1200);
for (const sel of process.argv.slice(3)) {
  const el = await p.$(sel);
  if (!el) { console.log('missing', sel); continue; }
  await el.scrollIntoViewIfNeeded(); await p.waitForTimeout(700);
  await el.screenshot({ path: `.render-audit/crop-${sel.replace(/[^a-z0-9]/gi,'_')}.png` });
  console.log('shot', sel);
}
await b.close(); server.kill();
