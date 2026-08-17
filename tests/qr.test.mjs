// QR encoding — verified by an independent decoder, not by inspection.
//
// A QR code that does not scan fails in front of an employer holding a
// phone, with the graduate standing there. "It looks like a QR code" is
// not a test. So every assertion here runs the output through **jsQR**,
// a decoder written by other people from ISO/IEC 18004 and sharing no
// code with functions/_lib/registry/qr.js. A misreading of the
// specification cannot pass both, which is the property that makes this
// worth running at all.
import jsQRModule from 'jsqr';
import { loadUrl } from './helpers.mjs';

const { encode, toSvg, byteCapacity, _internal } =
  await import(loadUrl('functions/_lib/registry/qr.js'));
const jsQR = jsQRModule.default || jsQRModule;

let pass = 0, fail = 0;
const check = (label, cond, detail) => {
  console.log((cond ? 'PASS ' : 'FAIL ') + label + (cond || detail === undefined ? '' : ` — ${detail}`));
  cond ? pass++ : fail++;
};
function threw(fn, re) {
  try { fn(); return 'did not throw'; } catch (e) { return re.test(e.message) ? null : 'wrong error: ' + e.message; }
}

/**
 * Rasterise a matrix the way a camera would see it: a quiet zone, then
 * one pixel block per module. jsQR wants RGBA.
 */
function raster(qr, { quiet = 4, scale = 4 } = {}) {
  const total = (qr.size + quiet * 2) * scale;
  const data = new Uint8ClampedArray(total * total * 4).fill(255);
  for (let r = 0; r < qr.size; r++) {
    for (let c = 0; c < qr.size; c++) {
      if (!qr.modules[r][c]) continue;
      for (let dy = 0; dy < scale; dy++) {
        for (let dx = 0; dx < scale; dx++) {
          const i = (((r + quiet) * scale + dy) * total + ((c + quiet) * scale + dx)) * 4;
          data[i] = 0; data[i + 1] = 0; data[i + 2] = 0;
        }
      }
    }
  }
  return { data, width: total, height: total };
}

function roundTrip(text, opts) {
  const qr = encode(text, opts);
  const img = raster(qr);
  const out = jsQR(img.data, img.width, img.height);
  return { qr, decoded: out ? out.data : null };
}

// --- The block table itself -------------------------------------------
// A transcription slip here is the likeliest way to produce a
// plausible-looking code that no scanner reads, and it would be
// invisible in the source. Every entry is arithmetic-checked against the
// version's total codeword count, which no wrong entry can satisfy by
// accident.
{
  const { EC_BLOCKS, TOTAL_CODEWORDS, MAX_VERSION } = _internal;
  const wrong = [];
  let checked = 0;
  for (const level of ['L', 'M', 'Q', 'H']) {
    for (let v = 1; v <= MAX_VERSION; v++) {
      const [ec, b1, d1, b2, d2] = EC_BLOCKS[level][v];
      const total = b1 * (d1 + ec) + b2 * (d2 + ec);
      if (total !== TOTAL_CODEWORDS[v]) wrong.push(`v${v}${level}: ${total} != ${TOTAL_CODEWORDS[v]}`);
      checked++;
    }
  }
  check('Every error-correction block entry accounts for exactly the version total',
    wrong.length === 0, wrong.join('; '));
  check('...across all forty version/level combinations', checked === 40, checked);
}

// --- Reed–Solomon -----------------------------------------------------
// The syndrome check is a genuinely independent test of the hardest
// part: for a correct codeword, evaluating the received polynomial at
// every root of the generator must give zero. Wrong field arithmetic,
// a wrong generator polynomial, or codewords in the wrong order all
// break this, and none of them would be visible by reading the output.
{
  const { rsEncode, gfMul } = _internal;
  const data = Uint8Array.from({ length: 30 }, (_, i) => (i * 37 + 11) & 0xff);
  const bad = [];
  for (const degree of [7, 10, 13, 17, 22, 26, 30]) {
    const full = [...data, ...rsEncode(data, degree)];
    for (let root = 0; root < degree; root++) {
      let x = 1;
      for (let k = 0; k < root; k++) x = gfMul(x, 2);   // alpha^root, alpha = 2
      let acc = 0;
      for (const byte of full) acc = gfMul(acc, x) ^ byte;   // Horner
      if (acc !== 0) bad.push(`degree ${degree} root ${root} -> ${acc}`);
    }
  }
  check('Reed–Solomon codewords vanish at every root of their generator',
    bad.length === 0, bad.slice(0, 3).join('; '));
}

// --- The version and format words -------------------------------------
// jsQR infers a code's version from its dimensions, so the round trips
// below do NOT exercise the version-information block that versions 7
// and up carry. Verified by sabotage: corrupting versionBits() left all
// forty round trips passing. Some real scanners DO read that block, so
// it is checked here directly instead of being assumed.
//
// Both words are BCH codewords, and that is a property no wrong value
// can satisfy by accident: dividing by the generator polynomial must
// leave no remainder. It checks the published table and this
// implementation against each other without either being taken on
// trust.
{
  const { versionBits, formatBits, MAX_VERSION } = _internal;

  const divisible = (word, generator, genBits) => {
    let rem = word;
    for (let i = 17; i >= genBits - 1; i--) {
      if ((rem >> i) & 1) rem ^= generator << (i - (genBits - 1));
    }
    return rem === 0;
  };

  const badVersion = [];
  for (let v = 7; v <= MAX_VERSION; v++) {
    const w = versionBits(v);
    // The top six bits must be the version number itself...
    if ((w >> 12) !== v) badVersion.push(`v${v}: data bits say ${w >> 12}`);
    // ...and the whole 18-bit word must divide by the BCH generator.
    else if (!divisible(w, 0b1111100100101, 13)) badVersion.push(`v${v}: not a BCH codeword`);
  }
  check('Version information is a valid BCH codeword carrying the right version',
    badVersion.length === 0, badVersion.join('; '));

  // Against the published table, so a systematic error in my own BCH
  // routine cannot validate itself.
  const PUBLISHED = { 7: 0b000111110010010100, 8: 0b001000010110111100,
    9: 0b001001101010011001, 10: 0b001010010011010011 };
  const mismatched = Object.entries(PUBLISHED)
    .filter(([v, want]) => versionBits(Number(v)) !== want)
    .map(([v, want]) => `v${v}: ${versionBits(Number(v)).toString(2)} != ${want.toString(2)}`);
  check('...and matches the specification\'s published version table',
    mismatched.length === 0, mismatched.join('; '));

  const badFormat = [];
  for (const level of ['L', 'M', 'Q', 'H']) {
    for (let mask = 0; mask < 8; mask++) {
      // Undo the specified final XOR, then the remainder must vanish.
      const w = formatBits(level, mask) ^ 0b101010000010010;
      let rem = w;
      for (let i = 14; i >= 10; i--) if ((rem >> i) & 1) rem ^= 0b10100110111 << (i - 10);
      if (rem !== 0) badFormat.push(`${level}/${mask}`);
    }
  }
  check('Every format word is a valid BCH codeword under its mask',
    badFormat.length === 0, badFormat.join(','));
}

// --- Round trips through the independent decoder ----------------------
{
  const url = 'https://www.worldwencollege.co.uk/verify.html?code=AIPC-7K3M-QP2V-XJ4NR';
  const { decoded } = roundTrip(url);
  check('A verification URL survives the round trip through an independent decoder',
    decoded === url, decoded);
}

{
  const { MAX_VERSION } = _internal;
  const failures = [];
  let checked = 0;
  for (const level of ['L', 'M', 'Q', 'H']) {
    for (let v = 1; v <= MAX_VERSION; v++) {
      // Fill the version exactly, so the version chosen IS v.
      const text = 'W'.repeat(byteCapacity(v, level));
      const { qr, decoded } = roundTrip(text, { level });
      if (qr.version !== v) failures.push(`v${v}${level}: chose ${qr.version}`);
      else if (decoded !== text) failures.push(`v${v}${level}: did not decode`);
      checked++;
    }
  }
  check('Every version 1 to 10 decodes at every error-correction level',
    failures.length === 0, failures.slice(0, 4).join('; '));
  check('...all forty combinations exercised', checked === 40, checked);
}

{
  // Below version 10 the character count is 8 bits; at 10 and above it
  // is 16. A code using the wrong width still looks well-formed.
  const nine = 'x'.repeat(byteCapacity(9, 'Q'));
  const ten = 'x'.repeat(byteCapacity(10, 'Q'));
  const a = roundTrip(nine, { level: 'Q' });
  const b = roundTrip(ten, { level: 'Q' });
  check('The character-count field widens at version 10', a.qr.version === 9 && b.qr.version === 10,
    `${a.qr.version}/${b.qr.version}`);
  check('...and both sides of the switch still decode',
    a.decoded === nine && b.decoded === ten);
}

{
  const over = 'y'.repeat(byteCapacity(1, 'Q') + 1);
  const { qr, decoded } = roundTrip(over, { level: 'Q' });
  check('One byte over a version boundary steps up rather than truncating',
    qr.version === 2 && decoded === over, `v${qr.version}, ${decoded === over ? 'intact' : 'lost'}`);
}

{
  // The College serves an Arabic site; a graduate's name is not ASCII.
  const text = 'شهادة — Aisha Al-Rashid — AIPC-7K3M-QP2V-XJ4NR';
  const { decoded } = roundTrip(text, { level: 'Q' });
  check('Non-ASCII text survives as UTF-8', decoded === text, decoded);
}

{
  // Level Q tolerates roughly a quarter of the code being unreadable,
  // and interleaving is what turns a contiguous blot into recoverable
  // damage spread across blocks. This fails if the interleave order is
  // wrong even when a clean code reads perfectly.
  const url = 'https://www.worldwencollege.co.uk/verify.html?code=AIPC-7K3M-QP2V-XJ4NR';
  const img = raster(encode(url, { level: 'Q' }));
  const x0 = Math.floor(img.width * 0.42);
  const y0 = Math.floor(img.height * 0.62);
  const blot = Math.floor(img.width * 0.13);
  for (let y = y0; y < y0 + blot; y++) {
    for (let x = x0; x < x0 + blot; x++) {
      const i = (y * img.width + x) * 4;
      img.data[i] = 0; img.data[i + 1] = 0; img.data[i + 2] = 0;
    }
  }
  const out = jsQR(img.data, img.width, img.height);
  check('Error correction recovers a code with a blot across it',
    !!out && out.data === url, out ? out.data : 'no decode at all');
}

// --- The SVG the page actually ships ----------------------------------
{
  const text = 'https://example.org/x';
  const svg = toSvg(text, { level: 'Q' });
  const qr = encode(text, { level: 'Q' });
  const m = svg.match(/viewBox="0 0 (\d+) (\d+)"/);
  // Cutting the quiet zone is the commonest reason a code that looks
  // right will not scan, and it is invisible in a screenshot.
  check('The SVG carries the full four-module quiet zone',
    !!m && Number(m[1]) === qr.size + 8 && Number(m[2]) === qr.size + 8,
    m ? `${m[1]}x${m[2]} for a ${qr.size}-module code` : 'no viewBox');
}

{
  // Rasterise the SVG's OWN path data rather than the matrix, so this
  // measures what a browser would draw. A wrong coordinate in toSvg()
  // passes every matrix assertion above and still ships a broken image.
  const url = 'https://www.worldwencollege.co.uk/verify.html?code=AIPC-AB12-CD34-EF56G';
  const svg = toSvg(url, { level: 'Q' });
  const total = encode(url, { level: 'Q' }).size + 8;

  const grid = Array.from({ length: total }, () => new Uint8Array(total));
  const re = /M(\d+) (\d+)h1v1h-1z/g;
  let match, drawn = 0;
  while ((match = re.exec(svg)) !== null) { grid[Number(match[2])][Number(match[1])] = 1; drawn++; }

  const scale = 4;
  const px = total * scale;
  const data = new Uint8ClampedArray(px * px * 4).fill(255);
  for (let r = 0; r < total; r++) {
    for (let c = 0; c < total; c++) {
      if (!grid[r][c]) continue;
      for (let dy = 0; dy < scale; dy++) {
        for (let dx = 0; dx < scale; dx++) {
          const i = ((r * scale + dy) * px + (c * scale + dx)) * 4;
          data[i] = 0; data[i + 1] = 0; data[i + 2] = 0;
        }
      }
    }
  }
  const out = jsQR(data, px, px);
  check('The SVG the page ships decodes when rendered', drawn > 0 && !!out && out.data === url,
    drawn === 0 ? 'the path drew nothing' : (out ? out.data : 'no decode'));
}

{
  const svg = toSvg('https://example.org/', { label: 'Verify "Aisha" & co <check>' });
  check('A label becomes an accessible name',
    svg.includes('aria-label="Verify &quot;Aisha&quot; &amp; co &lt;check&gt;"'));
  check('...with the markup escaped', !svg.includes('<check>'));
  // Without a label it is decoration beside a visible code, not content,
  // and announcing it would read a URL aloud to no purpose.
  check('...and an unlabelled code is hidden from a screen reader',
    toSvg('https://example.org/').includes('aria-hidden="true"'));
}

// --- Refusals ---------------------------------------------------------
{
  const huge = 'z'.repeat(byteCapacity(10, 'H') + 1);
  check('Too much text is refused rather than silently truncated',
    threw(() => encode(huge, { level: 'H' }), /exceeds version 10/) === null);
  // A refusal that does not name the real limit cannot be acted on.
  let msg = '';
  try { encode(huge, { level: 'H' }); } catch (e) { msg = e.message; }
  check('...and the refusal names the actual capacity',
    msg.includes(String(byteCapacity(10, 'H'))), msg);

  check('An empty string is refused', threw(() => encode(''), /nothing to encode/) === null);
  check('...as is a non-string', threw(() => encode(null), /nothing to encode/) === null);
  check('An unknown error-correction level is refused',
    threw(() => encode('x', { level: 'Z' }), /unknown error-correction level/) === null);
}

console.log(`\n${pass} passed, ${fail} failed.`);
process.exit(fail ? 1 : 0);
