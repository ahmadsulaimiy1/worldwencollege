import { createServer } from 'node:http';
import { readFileSync, existsSync, statSync } from 'node:fs';
import path from 'node:path';
import { chromium } from 'playwright';
const ROOT='/home/user/worldwencollege';
const M={'.html':'text/html','.css':'text/css','.js':'text/javascript','.svg':'image/svg+xml','.jpg':'image/jpeg','.png':'image/png'};
const srv=createServer((q,r)=>{let f=path.join(ROOT,decodeURIComponent(q.url.split('?')[0]));
 if(existsSync(f)&&statSync(f).isDirectory())f=path.join(f,'index.html');
 if(!existsSync(f)){r.writeHead(404);return r.end('nf');}
 r.writeHead(200,{'content-type':M[path.extname(f)]||'application/octet-stream'});r.end(readFileSync(f));});
await new Promise(r=>srv.listen(4211,r));
const b=await chromium.launch({executablePath:'/opt/pw-browsers/chromium-1194/chrome-linux/chrome'});
const urls=['/students/','/students/assessment/','/students/academic-record/','/students/awards/',
 '/students/integrity/','/students/regulations/','/ar/students/','/ar/students/assessment/',
 '/ar/students/academic-record/','/ar/students/awards/','/ar/students/integrity/','/ar/students/regulations/'];
let bad=0;
for (const u of urls){
  const line=[];
  for (const w of [1440,900,390]){
    const p=await b.newPage({viewport:{width:w,height:900}});
    const errs=[];p.on('pageerror',e=>errs.push(e.message));
    await p.goto('http://localhost:4211'+u,{waitUntil:'networkidle'});
    await p.waitForTimeout(500);
    const o=await p.evaluate(()=>document.documentElement.scrollWidth-document.documentElement.clientWidth);
    const leaves=await p.evaluate(()=>document.querySelectorAll('.leaf').length);
    const mast=await p.evaluate(()=>document.querySelectorAll('.masthead').length);
    if(o!==0||errs.length||mast!==1){bad++;line.push(`@${w} overflow=${o} mast=${mast} err=${errs[0]||''}`);}
    if(w===1440) line.unshift(`leaves=${leaves}`);
    await p.close();
  }
  console.log((bad?'!! ':'ok '), u.padEnd(34), line.join('  '));
}
console.log(bad?`${bad} problem(s)`:'all clean');
await b.close();srv.close();
