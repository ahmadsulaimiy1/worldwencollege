import jsQRModule from 'jsqr';
import { readFileSync, writeFileSync } from 'node:fs';
const jsQR = jsQRModule.default || jsQRModule;
const SRC = 'functions/_lib/registry/qr.js';
const orig = readFileSync(SRC, 'utf8');

function raster(qr, quiet=4, scale=4) {
  const total = (qr.size + quiet*2)*scale;
  const data = new Uint8ClampedArray(total*total*4).fill(255);
  for (let r=0;r<qr.size;r++) for (let c=0;c<qr.size;c++) { if(!qr.modules[r][c]) continue;
    for(let dy=0;dy<scale;dy++) for(let dx=0;dx<scale;dx++){
      const i=(((r+quiet)*scale+dy)*total+((c+quiet)*scale+dx))*4; data[i]=0;data[i+1]=0;data[i+2]=0; } }
  return {data,width:total,height:total};
}

const variants = {
  'as-written': orig,
  'format MSB-first': orig.replace('const bit = (i) => (bits >> i) & 1;', 'const bit = (i) => (bits >> (14 - i)) & 1;'),
};
for (const [name, src] of Object.entries(variants)) {
  writeFileSync('/tmp/qrv.mjs', src);
  const { encode } = await import('/tmp/qrv.mjs?v=' + encodeURIComponent(name));
  const qr = encode('HELLO', { level: 'Q' });
  const img = raster(qr);
  const out = jsQR(img.data, img.width, img.height);
  console.log(name.padEnd(20), out ? 'DECODED: ' + out.data : 'no decode');
}
