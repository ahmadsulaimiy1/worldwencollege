// Latin script inside Arabic prose, and the one way of fixing it that
// breaks the page.
//
// The Unicode bidi algorithm reorders a Latin run embedded in an RTL
// sentence unless the run is isolated, which is why this repository's
// README requires the institution name, IEFC and the CEFR codes to be
// wrapped in dir="ltr" spans. An audit of the 32 Arabic pages found 36
// bare runs across pages, partials and the Arabic build scripts.
//
// The fix introduced a worse bug than the one it removed. A regex that
// wrapped the token everywhere also wrapped it INSIDE an href:
//
//   href="mailto:…?subject=<span dir="ltr">IEFC</span>%20Application…"
//
// which corrupts the link and renders raw markup as visible text on the
// page. Three of those shipped into the built site before a second bidi
// pass caught them.
//
// So this file guards both directions: no bare Latin run in Arabic
// prose, and no isolation span inside an attribute value. The second
// check is the important one — it fails loudly on markup that still
// looks fine in a diff.

import { readFileSync, readdirSync, statSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
let passed = 0, failed = 0;
function check(name, ok, detail) {
  if (ok) { passed++; console.log('PASS ' + name); }
  else { failed++; console.log('FAIL ' + name + (detail ? ' — ' + detail : '')); }
}

function walk(dir, out = []) {
  for (const e of readdirSync(dir)) {
    const p = path.join(dir, e);
    if (['.git', 'node_modules', 'publication', 'docs'].includes(e)) continue;
    if (statSync(p).isDirectory()) walk(p, out);
    else if (e.endsWith('.html') || e.endsWith('.js')) out.push(p);
  }
  return out;
}

const files = walk(ROOT);
const rel = (p) => path.relative(ROOT, p);

// ---------------------------------------------------------------------
// 1 · No isolation span inside an attribute value
// ---------------------------------------------------------------------
// This is the regression that actually shipped. An attribute cannot hold
// markup: the tag terminates the value early, the link breaks, and the
// remainder renders as text the reader can see.
const inAttr = [];
for (const f of files) {
  const src = readFileSync(f, 'utf8');
  for (const m of src.matchAll(/\w+="[^"]*<span dir="ltr">[^"]*"/g)) {
    inAttr.push(`${rel(f)}: ${m[0].slice(0, 72)}…`);
  }
}
check(`No dir="ltr" span inside an attribute value — ${files.length} files`,
  inAttr.length === 0, inAttr.slice(0, 4).join(' | '));

// ---------------------------------------------------------------------
// 2 · No bare Latin token in Arabic prose
// ---------------------------------------------------------------------
// Rendered text only: between > and <, never inside an attribute, since
// a <meta content> or data-contents legitimately cannot carry a span.
// A token counts as isolated when it is wrapped in a dir="ltr" span OR
// in the Unicode isolate pair U+2066…U+2069. The second form is not a
// shortcut: a <title>, a <meta content> and a data-contents attribute
// cannot hold markup at all, and the isolate characters are precisely
// what Unicode provides for those places.
const LRI = '\u2066', PDI = '\u2069';
const TOKENS = new RegExp(`(?<!${LRI})\\b(IEFC|CEFR|BASCE|WEC)\\b(?!${PDI})`);
const ARABIC = /[؀-ۿ]/;
const bare = [];
const arabicFiles = files.filter((f) => {
  const r = rel(f);
  return r.startsWith('ar/') || r.includes('.ar.') || r.includes('build-arabic');
});
for (const f of arabicFiles) {
  const src = readFileSync(f, 'utf8');
  for (const m of src.matchAll(/>([^<>]{0,400}?)</g)) {
    const text = m[1];
    if (!ARABIC.test(text) || !TOKENS.test(text)) continue;
    bare.push(`${rel(f)}: "${text.trim().slice(0, 56)}"`);
    if (bare.length > 40) break;
  }
}
check(`No bare Latin token in Arabic prose — ${arabicFiles.length} Arabic files`,
  bare.length === 0, bare.slice(0, 4).join(' | '));

// ---------------------------------------------------------------------
// 3 · Roman numerals are isolated by rule, not by hand
// ---------------------------------------------------------------------
// I, V and X are Latin letters to the bidi algorithm. The elements that
// exist to hold a level numeral carry the isolation so that adding a
// seventh level cannot reintroduce the bug.
const css = readFileSync(path.join(ROOT, 'css', 'brand.css'), 'utf8');
check('Roman-numeral elements are bidi-isolated under [dir="rtl"]',
  /\[dir="rtl"\][^{]*\.ledger__roman[^{]*\{[^}]*unicode-bidi:\s*isolate/.test(css)
  || /\[dir="rtl"\][^{]*\.roman[^{]*\{[^}]*unicode-bidi:\s*isolate/.test(css));

console.log(`\n${passed} passed, ${failed} failed.`);
if (failed) process.exitCode = 1;
