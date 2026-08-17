import { chromium } from 'playwright';
const b = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium-1194/chrome-linux/chrome' });
for (const [url, y, out, w] of [
  ['/', 0, process.argv[2], 1440],
  ['/academics/', 900, process.argv[3], 1440],
  ['/admissions/tuition/', 700, process.argv[4], 1440],
  ['/ar/', 0, process.argv[5], 1440],
]) {
  const p = await b.newPage(); await p.setViewportSize({ width: w, height: 950 });
  await p.goto('http://127.0.0.1:8099' + url, { waitUntil: 'load' });
  await p.waitForTimeout(1400);
  await p.evaluate((yy) => scrollTo({ top: yy, behavior: 'instant' }), y);
  await p.waitForTimeout(900);
  const face = await p.evaluate(() => {
    const h = document.querySelector('h1');
    return { h1: getComputedStyle(h).fontFamily.split(',')[0], weight: getComputedStyle(h).fontWeight,
      loaded: [...document.fonts].filter(f => f.status === 'loaded').map(f => f.family).filter((v,i,a)=>a.indexOf(v)===i).join(', ') };
  });
  console.log(url, JSON.stringify(face));
  await p.screenshot({ path: out });
  await p.close();
}
await b.close();
