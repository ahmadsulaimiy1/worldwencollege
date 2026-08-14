// A DRAWING MUST BE A VALID DOCUMENT, NOT ONLY A VALID FRAGMENT.
//
// Every plate in assets/art/ opens with `<?xml version="1.0"?>`. That
// declaration is a promise: this file is XML, and anything that parses
// XML may open it — an `<img src>`, an object tag, a designer
// double-clicking it, a converter, a CMS.
//
// The plates were breaking that promise. `js/atelier.js` animates
// elements marked `data-pop`, and the generators emitted the attribute
// bare — `<g data-pop>` — which is perfectly legal HTML shorthand and a
// hard syntax error in XML. Inlined into a page by the build, as they
// are today, the HTML parser accepted them and everything worked.
// Opened on their own, every one of the eight files rendered as a
// browser parser-error page instead of a diagram.
//
// It survived because the only route that exercised the files was the
// route that forgave the mistake. So this file tests the plates as
// documents in their own right, independently of how the site consumes
// them — the defect was invisible from inside the site and obvious from
// one step outside it.
//
// Two layers, deliberately:
//
//   1. A structural pass with no dependencies, which runs everywhere.
//      It knows what actually went wrong and refuses it by name.
//   2. A full parse through xmllint where the binary exists. Stricter
//      than anything worth hand-rolling, and skipped rather than
//      guessed at when it is absent — a check that quietly downgrades
//      to nothing is worse than one that says it did not run.

import { readdirSync, readFileSync } from 'node:fs';
import { spawnSync } from 'node:child_process';
import path from 'node:path';
import { ROOT } from './helpers.mjs';

let pass = 0, fail = 0;
const check = (label, cond, detail) => {
  console.log((cond ? 'PASS ' : 'FAIL ') + label + (cond || detail === undefined ? '' : ` — ${detail}`));
  cond ? pass++ : fail++;
};

const ART = path.join(ROOT, 'assets/art');
const plates = readdirSync(ART).filter((f) => f.endsWith('.svg')).sort();

check(`There are plates to check — ${plates.length} found`, plates.length >= 8);

// ── 1 · Structure, without a parser ───────────────────────────────────

// An attribute inside a tag, with no `="..."` after its name. Written
// against the tag rather than the whole file so text content — which may
// legitimately contain a hyphenated word before a space — cannot match.
const TAG = /<([a-zA-Z][\w:-]*)((?:"[^"]*"|'[^']*'|[^>"'])*?)(\/?)>/g;
const BARE_ATTR = /(^|\s)([a-zA-Z][\w:.-]*)(?=\s|$)/;

const bare = [];
const unescaped = [];
const unbalanced = [];

for (const file of plates) {
  const svg = readFileSync(path.join(ART, file), 'utf8');
  const stack = [];
  let m;
  TAG.lastIndex = 0;
  while ((m = TAG.exec(svg))) {
    const [, name, attrs, selfClose] = m;
    // Strip every well-formed name="value" pair; whatever bare word is
    // left over is the thing XML will reject.
    const leftover = attrs.replace(/[a-zA-Z][\w:.-]*\s*=\s*("[^"]*"|'[^']*')/g, ' ');
    const b = leftover.match(BARE_ATTR);
    if (b) bare.push(`${file}: <${name} … ${b[2]}>`);

    if (selfClose) continue;
    stack.push(name);
    // Consume the matching close tag if the next thing is one.
    const after = svg.slice(m.index + m[0].length);
    const close = after.match(new RegExp(`^[^<]*<\\/${name}>`));
    if (close) stack.pop();
  }
  // Anything still open must be closed somewhere later in the file.
  for (const name of stack) {
    const opens = (svg.match(new RegExp(`<${name}[\\s>]`, 'g')) || []).length;
    const closes = (svg.match(new RegExp(`<\\/${name}>`, 'g')) || []).length;
    const selfs = (svg.match(new RegExp(`<${name}[^>]*\\/>`, 'g')) || []).length;
    if (opens - selfs !== closes) unbalanced.push(`${file}: <${name}> ${opens - selfs} open / ${closes} closed`);
  }

  // A bare `&` is the other way a generated SVG stops being XML, and the
  // one most likely to arrive with a piece of copy rather than with code.
  for (const amp of svg.matchAll(/&(?!(amp|lt|gt|quot|apos|#\d+|#x[0-9a-fA-F]+);)/g)) {
    unescaped.push(`${file}: unescaped & at ${amp.index}`);
  }
}

check(`No plate carries a bare attribute — ${plates.length} files scanned`,
  bare.length === 0, bare.slice(0, 6).join(' · '));

check('No plate carries an unescaped ampersand',
  unescaped.length === 0, unescaped.slice(0, 6).join(' · '));

check('Every element in every plate is closed',
  unbalanced.length === 0, [...new Set(unbalanced)].slice(0, 6).join(' · '));

// The scan is only worth what it catches, and it has nothing to catch
// once the plates are correct — so hand it the exact shape of the bug
// it was written for and confirm it still objects.
{
  const attrs = ' d="M0 0l6 5 -6 5Z" fill="#C7A24A" data-pop';
  const leftover = attrs.replace(/[a-zA-Z][\w:.-]*\s*=\s*("[^"]*"|'[^']*')/g, ' ');
  const clean = ' d="M0 0" fill="#C7A24A" data-pop=""';
  const cleanLeft = clean.replace(/[a-zA-Z][\w:.-]*\s*=\s*("[^"]*"|'[^']*')/g, ' ');
  check('...and the bare-attribute scan does catch the bug it was written for',
    BARE_ATTR.test(leftover) && !BARE_ATTR.test(cleanLeft));
}

// ── 2 · The accessibility contract ────────────────────────────────────
// A diagram on this site argues something (masterplan, Layer 3). A
// reader who cannot see it is owed the argument, not a filename.

const missingDesc = [];
for (const file of plates) {
  const svg = readFileSync(path.join(ART, file), 'utf8');
  // Only the generated plates carry the contract; the older ornaments
  // (guilloche, laurel, portico) are decorative and correctly hidden.
  if (!/data-diagram=/.test(svg)) continue;
  const title = svg.match(/<title[^>]*>([\s\S]*?)<\/title>/);
  const desc = svg.match(/<desc[^>]*>([\s\S]*?)<\/desc>/);
  if (!/role="img"/.test(svg)) missingDesc.push(`${file}: no role="img"`);
  if (!title || title[1].trim().length < 12) missingDesc.push(`${file}: no usable title`);
  // 200 characters is roughly two sentences. Below that it is a caption
  // restating the heading, which is the failure mode this guards.
  if (!desc || desc[1].trim().length < 200) missingDesc.push(`${file}: description too short to be the diagram`);
  if (!/aria-labelledby="[^"]*-title [^"]*-desc"/.test(svg)) missingDesc.push(`${file}: title and desc not both referenced`);
}
check('Every generated diagram states its argument in text',
  missingDesc.length === 0, missingDesc.slice(0, 6).join(' · '));

// Both languages, or it has not shipped — the master plan's rule, held
// against the files rather than against intent.
{
  const generated = plates.filter((f) => !f.endsWith('.ar.svg')
    && /data-diagram=/.test(readFileSync(path.join(ART, f), 'utf8')));
  const orphans = generated.filter((f) => !plates.includes(f.replace(/\.svg$/, '.ar.svg')));
  check(`Every generated diagram has an Arabic edition — ${generated.length} diagrams`,
    orphans.length === 0, orphans.join(' · '));

  // And the Arabic edition must actually be in Arabic, not a copy with
  // an .ar in the filename.
  const notTranslated = generated
    .map((f) => f.replace(/\.svg$/, '.ar.svg'))
    .filter((f) => plates.includes(f))
    .filter((f) => {
      const svg = readFileSync(path.join(ART, f), 'utf8');
      return !/lang="ar"/.test(svg) || !/[؀-ۿ]{4}/.test(svg);
    });
  check('...and every Arabic edition is marked and written in Arabic',
    notTranslated.length === 0, notTranslated.join(' · '));
}

// ── 3 · A real parser, where one is installed ─────────────────────────
{
  const probe = spawnSync('xmllint', ['--version'], { stdio: 'ignore' });
  if (probe.error || probe.status !== 0) {
    console.log('SKIP xmllint not installed — structural pass above stands alone on this machine.');
  } else {
    const broken = [];
    for (const file of plates) {
      const r = spawnSync('xmllint', ['--noout', path.join(ART, file)], { encoding: 'utf8' });
      if (r.status !== 0) broken.push(`${file}: ${(r.stderr || '').split('\n')[0]}`);
    }
    check(`Every plate parses as XML — xmllint, ${plates.length} files`,
      broken.length === 0, broken.slice(0, 4).join(' · '));
  }
}

console.log(`\n${pass} passed, ${fail} failed.`);
process.exit(fail ? 1 : 0);
