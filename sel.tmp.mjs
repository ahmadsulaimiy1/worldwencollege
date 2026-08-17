// Every sonics selector must MATCH SOMETHING somewhere on the site, or
// a component was added to the list under a name it does not have and
// the shape stays silent — the exact failure CLAUDE.md §3 warns about.
import { chromium } from 'playwright';
import { spawn } from 'node:child_process';
import { readFileSync } from 'node:fs';
const src = readFileSync('js/sonics.js','utf8');
const lists = [...src.matchAll(/var (CHIME|SEAL|OPEN|TAP)\s*=\s*([\s\S]*?);\n/g)];
const sels = [];
for (const [,name,body] of lists) {
  const s = body.replace(/\/\*[\s\S]*?\*\//g,'').replace(/\+/g,'').replace(/'/g,'').replace(/\s+/g,' ');
  for (const p of s.split(',').map(x=>x.trim()).filter(Boolean)) sels.push([name,p]);
}
const PORT=8891;
const server=spawn(process.execPath,['--experimental-sqlite','tests/browser/lab-server.mjs'],{env:{...process.env,LAB_PORT:String(PORT)},stdio:['ignore','pipe','pipe']});
await new Promise(r=>server.stdout.on('data',d=>{if(String(d).includes('ready'))r();}));
const b=await chromium.launch({executablePath:'/opt/pw-browsers/chromium-1194/chrome-linux/chrome'});
const routes=['/','/about/','/academics/','/admissions/','/students/','/governance/','/press/','/press/catalogue/','/faculty/','/faq/','/academics/teaching/','/students/awards/','/study/level-1/'];
const seen=new Set();
for (const r of routes) {
  const p=await b.newPage({viewport:{width:1440,height:1000}});
  await p.goto(`http://localhost:${PORT}${r}`,{waitUntil:'domcontentloaded'});
  const hit=await p.evaluate(list=>list.filter(s=>{try{return !!document.querySelector(s)}catch(e){return false}}), sels.map(s=>s[1]));
  hit.forEach(h=>seen.add(h));
  await p.close();
}
const dead=sels.filter(([,s])=>!seen.has(s));
console.log(`${sels.length} selectors · ${seen.size} matched somewhere`);
if (dead.length) { console.log('SILENT — matched nothing on any route:'); dead.forEach(([n,s])=>console.log(`  ${n.padEnd(6)} ${s}`)); }
await b.close(); server.kill();
