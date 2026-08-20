/**
 * QR encoding for credential verification — ISO/IEC 18004, byte mode,
 * versions 1–10, all four error-correction levels.
 *
 * ────────────────────────────────────────────────────────────────────
 * WHY THIS IS HAND-WRITTEN
 * ────────────────────────────────────────────────────────────────────
 * Pages Functions run with no npm runtime dependencies, by design, and
 * a QR code on a certificate is not a place for a dependency that could
 * be unpublished, compromised or simply abandoned. It is also a closed,
 * fully specified problem: there is one right answer and it does not
 * change.
 *
 * ────────────────────────────────────────────────────────────────────
 * WHY YOU CAN BELIEVE IT WORKS
 * ────────────────────────────────────────────────────────────────────
 * A QR code that does not scan fails in the worst possible place — in
 * front of an employer holding a phone, with the graduate standing
 * there. So this is not verified by inspection.
 *
 * tests/qr.test.mjs encodes, rasterises, and decodes the result with
 * **jsQR**, a decoder written by other people from the same
 * specification and sharing no code with this file. A shared
 * misreading of the spec cannot pass both. The suite covers every
 * version 1–10 at every error-correction level, the byte-mode
 * boundaries, the 8-bit/16-bit character-count switch at version 10,
 * and a damaged code that error correction must still recover.
 *
 * That is the difference between "this looks like a QR code" and "an
 * independent decoder read it back".
 */

// ---- Galois field GF(256), the Reed–Solomon arithmetic -------------
// Primitive polynomial x^8 + x^4 + x^3 + x^2 + 1 (0x11D), as the
// specification requires.
const EXP = new Uint8Array(512);
const LOG = new Uint8Array(256);
(function buildTables() {
  let x = 1;
  for (let i = 0; i < 255; i++) {
    EXP[i] = x;
    LOG[x] = i;
    x <<= 1;
    if (x & 0x100) x ^= 0x11d;
  }
  for (let i = 255; i < 512; i++) EXP[i] = EXP[i - 255];
})();

function gfMul(a, b) {
  if (a === 0 || b === 0) return 0;
  return EXP[LOG[a] + LOG[b]];
}

/** The generator polynomial for `degree` error-correction codewords. */
function rsGenerator(degree) {
  let poly = [1];
  for (let d = 0; d < degree; d++) {
    const next = new Array(poly.length + 1).fill(0);
    for (let i = 0; i < poly.length; i++) {
      next[i] ^= poly[i];
      next[i + 1] ^= gfMul(poly[i], EXP[d]);
    }
    poly = next;
  }
  return poly;
}

/** Remainder of data × x^degree divided by the generator — the ECC. */
function rsEncode(data, degree) {
  const gen = rsGenerator(degree);
  const res = new Uint8Array(degree);
  for (const byte of data) {
    const factor = byte ^ res[0];
    res.copyWithin(0, 1);
    res[degree - 1] = 0;
    for (let i = 0; i < degree; i++) res[i] ^= gfMul(gen[i + 1], factor);
  }
  return res;
}

// ---- Version tables ------------------------------------------------
// Total codewords (data + error correction) per version.
const TOTAL_CODEWORDS = [0, 26, 44, 70, 100, 134, 172, 196, 242, 292, 346];

// [ecCodewordsPerBlock, group1Blocks, group1DataCodewords,
//  group2Blocks, group2DataCodewords] per version, per level.
// Cross-checked in tests/qr.test.mjs against TOTAL_CODEWORDS: for every
// one of the 40 entries, blocks×(data+ec) must equal the version total.
// A transcription slip in this table is the likeliest way to get a
// plausible-looking code that no scanner reads, so it is not trusted.
const EC_BLOCKS = {
  L: [null,
    [7, 1, 19, 0, 0], [10, 1, 34, 0, 0], [15, 1, 55, 0, 0], [20, 1, 80, 0, 0],
    [26, 1, 108, 0, 0], [18, 2, 68, 0, 0], [20, 2, 78, 0, 0], [24, 2, 97, 0, 0],
    [30, 2, 116, 0, 0], [18, 2, 68, 2, 69]],
  M: [null,
    [10, 1, 16, 0, 0], [16, 1, 28, 0, 0], [26, 1, 44, 0, 0], [18, 2, 32, 0, 0],
    [24, 2, 43, 0, 0], [16, 4, 27, 0, 0], [18, 4, 31, 0, 0], [22, 2, 38, 2, 39],
    [22, 3, 36, 2, 37], [26, 4, 43, 1, 44]],
  Q: [null,
    [13, 1, 13, 0, 0], [22, 1, 22, 0, 0], [18, 2, 17, 0, 0], [26, 2, 24, 0, 0],
    [18, 2, 15, 2, 16], [24, 4, 19, 0, 0], [18, 2, 14, 4, 15], [22, 4, 18, 2, 19],
    [20, 4, 16, 4, 17], [24, 6, 19, 2, 20]],
  H: [null,
    [17, 1, 9, 0, 0], [28, 1, 16, 0, 0], [22, 2, 13, 0, 0], [16, 4, 9, 0, 0],
    [22, 2, 11, 2, 12], [28, 4, 15, 0, 0], [26, 4, 13, 1, 14], [26, 4, 14, 2, 15],
    [24, 4, 12, 4, 13], [28, 6, 15, 2, 16]],
};

// Row/column centres of the alignment patterns. Version 1 has none.
const ALIGNMENT = [null, [], [6, 18], [6, 22], [6, 26], [6, 30], [6, 34],
  [6, 22, 38], [6, 24, 42], [6, 26, 46], [6, 28, 50]];

// Bits left over after the codewords, which are placed as zeros.
const REMAINDER_BITS = [0, 0, 7, 7, 7, 7, 7, 0, 0, 0, 0];

// The two-bit level indicator that goes into the format information.
const LEVEL_BITS = { L: 0b01, M: 0b00, Q: 0b11, H: 0b10 };

const MAX_VERSION = 10;

/** Data capacity in bytes for a version/level in byte mode. */
export function byteCapacity(version, level) {
  const [ec, b1, d1, b2, d2] = EC_BLOCKS[level][version];
  const dataCodewords = b1 * d1 + b2 * d2;
  // 4 bits of mode indicator, then the character count: 8 bits below
  // version 10, 16 bits at version 10 and above.
  const headerBits = 4 + (version < 10 ? 8 : 16);
  void ec;
  return Math.floor((dataCodewords * 8 - headerBits) / 8);
}

/** The smallest version that holds `byteLength` bytes at `level`. */
function smallestVersion(byteLength, level) {
  for (let v = 1; v <= MAX_VERSION; v++) {
    if (byteCapacity(v, level) >= byteLength) return v;
  }
  return null;
}

// ---- Bit stream ----------------------------------------------------
function bitWriter() {
  const bits = [];
  return {
    push(value, length) {
      for (let i = length - 1; i >= 0; i--) bits.push((value >> i) & 1);
    },
    bits,
  };
}

/** Mode indicator, length, payload, terminator, padding. */
function buildCodewords(bytes, version, level) {
  const [, b1, d1, b2, d2] = EC_BLOCKS[level][version];
  const dataCodewords = b1 * d1 + b2 * d2;
  const capacityBits = dataCodewords * 8;

  const w = bitWriter();
  w.push(0b0100, 4);                               // byte mode
  w.push(bytes.length, version < 10 ? 8 : 16);
  for (const b of bytes) w.push(b, 8);

  // Terminator: up to four zero bits, fewer if the stream is nearly full.
  const terminator = Math.min(4, capacityBits - w.bits.length);
  w.push(0, terminator);
  while (w.bits.length % 8 !== 0) w.bits.push(0);

  const out = new Uint8Array(dataCodewords);
  for (let i = 0; i < w.bits.length; i += 8) {
    let byte = 0;
    for (let j = 0; j < 8; j++) byte = (byte << 1) | w.bits[i + j];
    out[i / 8] = byte;
  }
  // Alternating pad bytes, as specified, for whatever remains.
  const PAD = [0xec, 0x11];
  for (let i = w.bits.length / 8, k = 0; i < dataCodewords; i++, k++) {
    out[i] = PAD[k % 2];
  }
  return out;
}

/**
 * Split into blocks, compute error correction, and interleave.
 *
 * The interleaving is what makes a QR code survive a coffee ring: a
 * contiguous smudge damages a few codewords of every block rather than
 * destroying one block entirely, and each block can then be repaired
 * within its own correction budget.
 */
function interleave(dataCodewords, version, level) {
  const [ecCount, b1, d1, b2, d2] = EC_BLOCKS[level][version];
  const blocks = [];
  let offset = 0;
  for (let i = 0; i < b1; i++) {
    blocks.push(dataCodewords.slice(offset, offset + d1));
    offset += d1;
  }
  for (let i = 0; i < b2; i++) {
    blocks.push(dataCodewords.slice(offset, offset + d2));
    offset += d2;
  }
  const ecBlocks = blocks.map((b) => rsEncode(b, ecCount));

  const result = [];
  const maxData = Math.max(d1, d2);
  for (let i = 0; i < maxData; i++) {
    for (const block of blocks) if (i < block.length) result.push(block[i]);
  }
  for (let i = 0; i < ecCount; i++) {
    for (const block of ecBlocks) result.push(block[i]);
  }
  return result;
}

// ---- Matrix --------------------------------------------------------
/**
 * A matrix of module values plus a parallel map of which positions are
 * function patterns. The second is not optional bookkeeping: data
 * placement and masking must both skip function modules, and a mask
 * applied over a finder pattern produces a code no scanner can lock on.
 */
function newMatrix(size) {
  return {
    size,
    modules: Array.from({ length: size }, () => new Uint8Array(size)),
    reserved: Array.from({ length: size }, () => new Uint8Array(size)),
  };
}

function placeFinder(m, row, col) {
  for (let r = -1; r <= 7; r++) {
    for (let c = -1; c <= 7; c++) {
      const rr = row + r;
      const cc = col + c;
      if (rr < 0 || rr >= m.size || cc < 0 || cc >= m.size) continue;
      const inRing = (r >= 0 && r <= 6 && (c === 0 || c === 6))
        || (c >= 0 && c <= 6 && (r === 0 || r === 6));
      const inCore = r >= 2 && r <= 4 && c >= 2 && c <= 4;
      m.modules[rr][cc] = inRing || inCore ? 1 : 0;
      m.reserved[rr][cc] = 1;
    }
  }
}

function placeFunctionPatterns(m, version) {
  const size = m.size;
  placeFinder(m, 0, 0);
  placeFinder(m, 0, size - 7);
  placeFinder(m, size - 7, 0);

  // Timing patterns.
  for (let i = 8; i < size - 8; i++) {
    const v = i % 2 === 0 ? 1 : 0;
    m.modules[6][i] = v; m.reserved[6][i] = 1;
    m.modules[i][6] = v; m.reserved[i][6] = 1;
  }

  // Alignment patterns, except where they would collide with a finder.
  const centres = ALIGNMENT[version];
  for (const r of centres) {
    for (const c of centres) {
      const nearFinder = (r <= 8 && c <= 8)
        || (r <= 8 && c >= size - 9)
        || (r >= size - 9 && c <= 8);
      if (nearFinder) continue;
      for (let dr = -2; dr <= 2; dr++) {
        for (let dc = -2; dc <= 2; dc++) {
          const ring = Math.max(Math.abs(dr), Math.abs(dc));
          m.modules[r + dr][c + dc] = ring === 1 ? 0 : 1;
          m.reserved[r + dr][c + dc] = 1;
        }
      }
    }
  }

  // The dark module — always set, always at this position.
  m.modules[size - 8][8] = 1;
  m.reserved[size - 8][8] = 1;

  // Reserve the format information areas.
  for (let i = 0; i <= 8; i++) {
    if (i !== 6) { m.reserved[8][i] = 1; m.reserved[i][8] = 1; }
  }
  for (let i = 0; i < 8; i++) {
    m.reserved[8][size - 1 - i] = 1;
    m.reserved[size - 1 - i][8] = 1;
  }

  // Version information, from version 7.
  if (version >= 7) {
    for (let i = 0; i < 18; i++) {
      const r = Math.floor(i / 3);
      const c = i % 3;
      m.reserved[r][size - 11 + c] = 1;
      m.reserved[size - 11 + c][r] = 1;
    }
  }
}

/** The zigzag walk: two-module columns, right to left, alternating up and down. */
function placeData(m, codewords, version) {
  const size = m.size;
  const bits = [];
  for (const cw of codewords) for (let i = 7; i >= 0; i--) bits.push((cw >> i) & 1);
  for (let i = 0; i < REMAINDER_BITS[version]; i++) bits.push(0);

  let bitIndex = 0;
  let upward = true;
  for (let col = size - 1; col > 0; col -= 2) {
    if (col === 6) col--;              // the vertical timing pattern is skipped entirely
    for (let i = 0; i < size; i++) {
      const row = upward ? size - 1 - i : i;
      for (let c = 0; c < 2; c++) {
        const cc = col - c;
        if (m.reserved[row][cc]) continue;
        m.modules[row][cc] = bitIndex < bits.length ? bits[bitIndex] : 0;
        bitIndex++;
      }
    }
    upward = !upward;
  }
  return bitIndex;
}

const MASKS = [
  (r, c) => (r + c) % 2 === 0,
  (r) => r % 2 === 0,
  (r, c) => c % 3 === 0,
  (r, c) => (r + c) % 3 === 0,
  (r, c) => (Math.floor(r / 2) + Math.floor(c / 3)) % 2 === 0,
  (r, c) => ((r * c) % 2) + ((r * c) % 3) === 0,
  (r, c) => (((r * c) % 2) + ((r * c) % 3)) % 2 === 0,
  (r, c) => (((r + c) % 2) + ((r * c) % 3)) % 2 === 0,
];

/**
 * The four penalty rules. Their job is to pick the mask that makes the
 * code easiest for a scanner to read — punishing long runs, solid
 * blocks, patterns that look like a finder, and an unbalanced ratio of
 * dark to light.
 */
function penalty(m) {
  const size = m.size;
  const at = (r, c) => m.modules[r][c];
  let score = 0;

  // Rule 1 — runs of five or more of the same colour, by row and column.
  for (let i = 0; i < size; i++) {
    for (const byRow of [true, false]) {
      let run = 1;
      let prev = byRow ? at(i, 0) : at(0, i);
      for (let j = 1; j < size; j++) {
        const v = byRow ? at(i, j) : at(j, i);
        if (v === prev) {
          run++;
        } else {
          if (run >= 5) score += 3 + (run - 5);
          run = 1;
          prev = v;
        }
      }
      if (run >= 5) score += 3 + (run - 5);
    }
  }

  // Rule 2 — every 2×2 block of one colour.
  for (let r = 0; r < size - 1; r++) {
    for (let c = 0; c < size - 1; c++) {
      const v = at(r, c);
      if (v === at(r, c + 1) && v === at(r + 1, c) && v === at(r + 1, c + 1)) score += 3;
    }
  }

  // Rule 3 — the finder-like sequence 1:1:3:1:1 with four light modules
  // on either side, in either orientation.
  const A = [1, 0, 1, 1, 1, 0, 1, 0, 0, 0, 0];
  const B = [0, 0, 0, 0, 1, 0, 1, 1, 1, 0, 1];
  for (let r = 0; r < size; r++) {
    for (let c = 0; c <= size - 11; c++) {
      let matchA = true; let matchB = true;
      for (let k = 0; k < 11; k++) {
        const v = at(r, c + k);
        if (v !== A[k]) matchA = false;
        if (v !== B[k]) matchB = false;
      }
      if (matchA || matchB) score += 40;
    }
  }
  for (let c = 0; c < size; c++) {
    for (let r = 0; r <= size - 11; r++) {
      let matchA = true; let matchB = true;
      for (let k = 0; k < 11; k++) {
        const v = at(r + k, c);
        if (v !== A[k]) matchA = false;
        if (v !== B[k]) matchB = false;
      }
      if (matchA || matchB) score += 40;
    }
  }

  // Rule 4 — deviation from an even balance of dark and light.
  let dark = 0;
  for (let r = 0; r < size; r++) for (let c = 0; c < size; c++) dark += at(r, c);
  const percent = (dark * 100) / (size * size);
  score += Math.floor(Math.abs(percent - 50) / 5) * 10;

  return score;
}

/** BCH(15,5) format information, with the specified final XOR. */
function formatBits(level, mask) {
  const data = (LEVEL_BITS[level] << 3) | mask;
  let rem = data << 10;
  for (let i = 14; i >= 10; i--) {
    if ((rem >> i) & 1) rem ^= 0b10100110111 << (i - 10);
  }
  return ((data << 10) | rem) ^ 0b101010000010010;
}

/** BCH(18,6) version information, for versions 7 and above. */
function versionBits(version) {
  let rem = version << 12;
  for (let i = 17; i >= 12; i--) {
    if ((rem >> i) & 1) rem ^= 0b1111100100101 << (i - 12);
  }
  return (version << 12) | rem;
}

function placeFormat(m, level, mask) {
  const size = m.size;
  const bits = formatBits(level, mask);
  // Most significant bit FIRST: position 0 of the sequence below takes
  // bit 14 of the format word, not bit 0. Getting this backwards
  // produces a structurally perfect code — correct finders, timing,
  // data and error correction — that every scanner refuses, because the
  // format word is what tells it the mask and the correction level.
  // There is nothing to see in the image; only a decoder finds it.
  const bit = (i) => (bits >> (14 - i)) & 1;

  // Copy one: around the top-left finder.
  for (let i = 0; i <= 5; i++) m.modules[8][i] = bit(i);
  m.modules[8][7] = bit(6);
  m.modules[8][8] = bit(7);
  m.modules[7][8] = bit(8);
  for (let i = 9; i <= 14; i++) m.modules[14 - i][8] = bit(i);

  // Copy two: split between the other two finders, so the format
  // survives damage to any one corner. The split is 7 bits vertically
  // and 8 horizontally, NOT 8 and 7 — the eighth row of that column is
  // the dark module, and taking it for the format overwrites the dark
  // module and shifts every remaining bit by one. The result still
  // looks like a QR code and decodes as nothing.
  for (let i = 0; i <= 6; i++) m.modules[size - 1 - i][8] = bit(i);
  for (let i = 7; i <= 14; i++) m.modules[8][size - 15 + i] = bit(i);
}

function placeVersion(m, version) {
  if (version < 7) return;
  const size = m.size;
  const bits = versionBits(version);
  for (let i = 0; i < 18; i++) {
    const v = (bits >> i) & 1;
    const r = Math.floor(i / 3);
    const c = i % 3;
    m.modules[r][size - 11 + c] = v;
    m.modules[size - 11 + c][r] = v;
  }
}

/**
 * Encode `text` as a QR matrix.
 *
 * Returns { size, modules, version, level } where `modules` is an array
 * of Uint8Array rows, 1 for dark. No quiet zone: the caller decides how
 * to present it, and a quiet zone baked into the data would be an
 * invisible constraint on every renderer.
 */
export function encode(text, { level = 'Q', minVersion = 1 } = {}) {
  if (typeof text !== 'string' || text.length === 0) {
    throw new Error('qr: nothing to encode');
  }
  if (!EC_BLOCKS[level]) throw new Error(`qr: unknown error-correction level ${level}`);

  const bytes = new TextEncoder().encode(text);
  const needed = smallestVersion(bytes.length, level);
  if (needed === null) {
    throw new Error(
      `qr: ${bytes.length} bytes exceeds version ${MAX_VERSION} at level ${level} `
      + `(${byteCapacity(MAX_VERSION, level)} bytes)`);
  }
  const version = Math.max(needed, minVersion);
  if (version > MAX_VERSION) throw new Error(`qr: version ${version} not supported`);

  const codewords = interleave(buildCodewords(bytes, version, level), version, level);
  const size = 17 + 4 * version;

  // Every mask is built and scored, and the best kept. Trying to
  // predict the winner is both wrong and no faster than eight passes
  // over a matrix this small.
  let best = null;
  for (let mask = 0; mask < 8; mask++) {
    const m = newMatrix(size);
    placeFunctionPatterns(m, version);
    placeData(m, codewords, version);
    for (let r = 0; r < size; r++) {
      for (let c = 0; c < size; c++) {
        if (!m.reserved[r][c] && MASKS[mask](r, c)) m.modules[r][c] ^= 1;
      }
    }
    placeFormat(m, level, mask);
    placeVersion(m, version);
    const score = penalty(m);
    if (best === null || score < best.score) best = { score, matrix: m, mask };
  }

  return {
    size,
    modules: best.matrix.modules,
    version,
    level,
    mask: best.mask,
  };
}

/**
 * The same code as an SVG string.
 *
 * SVG rather than a raster: it stays sharp on a certificate printed at
 * any size, it costs a few hundred bytes, and it needs no canvas — which
 * a Worker does not have.
 *
 * The quiet zone is four modules, as the specification requires. Cutting
 * it to save space is the single most common reason a QR code that
 * "looks fine" will not scan.
 */
export function toSvg(text, { level = 'Q', quiet = 4, size = 240, label = null } = {}) {
  const qr = encode(text, { level });
  const total = qr.size + quiet * 2;

  // One path for every dark module, which keeps the file small enough
  // to inline as a data URI and avoids hairline seams between adjacent
  // rectangles that some renderers show at fractional zoom.
  let path = '';
  for (let r = 0; r < qr.size; r++) {
    for (let c = 0; c < qr.size; c++) {
      if (qr.modules[r][c]) path += `M${c + quiet} ${r + quiet}h1v1h-1z`;
    }
  }

  const title = label ? `<title>${escapeXml(label)}</title>` : '';
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}" `
    + `viewBox="0 0 ${total} ${total}" shape-rendering="crispEdges" `
    + `role="img"${label ? ' aria-label="' + escapeXml(label) + '"' : ' aria-hidden="true"'}>`
    + title
    + `<rect width="${total}" height="${total}" fill="#fff"/>`
    + `<path d="${path}" fill="#14264A"/>`
    + '</svg>';
}

function escapeXml(s) {
  return String(s).replace(/[<>&"']/g, (ch) => (
    { '<': '&lt;', '>': '&gt;', '&': '&amp;', '"': '&quot;', "'": '&apos;' }[ch]
  ));
}

export const _internal = { EC_BLOCKS, TOTAL_CODEWORDS, rsEncode, rsGenerator, gfMul, formatBits, versionBits, MAX_VERSION };
