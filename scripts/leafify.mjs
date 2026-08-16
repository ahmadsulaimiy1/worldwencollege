// scripts/leafify.mjs — set a flat pillar page as a bound document.
//
// WHY THIS IS A SCRIPT AND NOT A HAND EDIT.
//
// The College page and the Students page were each recomposed by hand,
// and both were worth it: their content was duplicated, mis-marked and
// in the wrong order, so the recomposition was an editorial act as much
// as a structural one. Admissions, Governance and Press are not in that
// state. Their prose is sound, correct and already in the right order;
// what they lack is the INSTRUMENT — the masthead, the numbered leaves,
// the rubric in each margin, the ornament plate, the colophon.
//
// Retyping four thousand lines of correct prose to wrap it in a
// different div is how content gets quietly lost. This transforms the
// structure and does not touch a word of the text.
//
// WHAT IT DOES, per section:
//
//   <section class="section--paper section-pad" id="x">        becomes
//     <div class="container reveal">                    a numbered leaf
//       <div class="section-head">                   with its margin,
//         <span class="module-marker">Label</span>     its numeral, its
//         <h2>…</h2>                                rubric and its
//                                                   ornament plate,
// with the module-marker becoming the margin label — it is already the
// section's short name, already authored and already translated, which
// is the same reason scripts/build.js prefers it for the contents rail.
//
// It is idempotent: a section already carrying .leaf is left alone.
//
// USAGE
//   node scripts/leafify.mjs <page.html> <plan.json>
//
// The plan is an array, one entry per section-pad section in document
// order, each { num, label?, rubric, plate }. label defaults to the
// section's own module-marker. A null entry skips that section — for
// the hero, the CTA band and anything else that is not a leaf.

import { readFileSync, writeFileSync } from 'node:fs';

const [, , pagePath, planPath] = process.argv;
if (!pagePath || !planPath) {
  console.error('usage: node scripts/leafify.mjs <page.html> <plan.json>');
  process.exit(2);
}

const plan = JSON.parse(readFileSync(planPath, 'utf8'));
let html = readFileSync(pagePath, 'utf8');

// Find each top-level <section …>…</section> by depth counting, because
// sections do not nest on these pages but divs inside them certainly do
// and a lazy regex would close on the first </section> it met.
function sections(src) {
  const out = [];
  const open = /<section\b[^>]*>/g;
  let m;
  while ((m = open.exec(src))) {
    const start = m.index;
    let depth = 1;
    const scan = /<\/?section\b[^>]*>/g;
    scan.lastIndex = open.lastIndex;
    let s;
    while (depth > 0 && (s = scan.exec(src))) {
      depth += s[0].startsWith('</') ? -1 : 1;
    }
    out.push({ start, end: scan.lastIndex, tag: m[0] });
    open.lastIndex = scan.lastIndex;
  }
  return out;
}

const found = sections(html).filter((s) => /\bsection-pad\b/.test(s.tag));
if (found.length !== plan.length) {
  console.error(`plan has ${plan.length} entries, page has ${found.length} section-pad sections`);
  process.exit(1);
}

let done = 0;
// Back to front, so earlier offsets stay valid.
for (let i = found.length - 1; i >= 0; i--) {
  const spec = plan[i];
  if (!spec) continue;
  const sec = found[i];
  let block = html.slice(sec.start, sec.end);
  if (/\bleaf\b/.test(block)) continue;

  const marker = (block.match(/<span class="module-marker"[^>]*>([\s\S]*?)<\/span>/) || [])[1];
  const label = spec.label || (marker || '').trim();

  // The ground keeps whatever it had; grain and aurora are the leaf's
  // texture, and aurora belongs only on a dark ground.
  const dark = /section--(dark|oxford|midnight)/.test(block);
  block = block.replace(/<section class="([^"]*)\bsection-pad\b([^"]*)"/,
    (_, a, b) => `<section class="leaf ${(a + b).trim()} grain${dark ? ' aurora' : ''}"`);

  const margin =
    `\n  <span class="leaf__ornament" aria-hidden="true" style="--leaf-plate:url(${spec.plate})"></span>`
    + `\n  <div class="container leaf__grid">`
    + `\n    <div class="leaf__margin">`
    + `\n      <span class="leaf__num foil">${spec.num}</span>`
    + `\n      <span class="leaf__label">${label}</span>`
    + `\n      <p class="leaf__rubric">${spec.rubric}</p>`
    + `\n    </div>`
    + `\n    <div class="leaf__body reveal">`;

  // The container becomes the grid; the old .reveal moves onto the body,
  // where it belongs — a margin that fades in is a margin a reader
  // watches instead of reads.
  const cIdx = block.search(/<div class="container[^"]*">/);
  if (cIdx < 0) { console.error(`section ${i + 1}: no container`); continue; }
  const cTag = block.match(/<div class="container[^"]*">/)[0];
  block = block.slice(0, cIdx) + margin + block.slice(cIdx + cTag.length);

  // Close the body before the container's own close, which is the last
  // </div> before </section>.
  const tail = block.lastIndexOf('</div>');
  block = block.slice(0, tail) + '</div>\n  ' + block.slice(tail);

  // The section-head's marker is now the margin label; the heading stays
  // where the reader is looking.
  block = block.replace(/\s*<div class="section-head"([^>]*)>\s*<span class="module-marker"[^>]*>[\s\S]*?<\/span>/,
    '\n      <div class="section-head"$1>');

  html = html.slice(0, sec.start) + block + html.slice(sec.end);
  done++;
}

writeFileSync(pagePath, html);
console.log(`${pagePath}: ${done} section(s) set as leaves`);
