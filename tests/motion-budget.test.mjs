// tests/motion-budget.test.mjs — an effect that is everywhere is not an
// effect. It is a condition.
//
// ─────────────────────────────────────────────────────────────────────
// WHAT THIS HOLDS AND WHY IT IS A CEILING RATHER THAN A FLOOR
// ─────────────────────────────────────────────────────────────────────
// The typewriter is for the two or three lines on this site where the
// sentence IS the event. A page on which several headings type
// themselves is a page nobody can skim, and skimming is the first thing
// a reader does — so the effect that was added to make the site feel
// alive would be the thing that stops it being read.
//
// It is applied by hand, never by a rule, and the number is held here.
// The ceiling is deliberately low enough that raising it is a decision
// somebody has to make in this file rather than a thing that happens by
// accretion across twenty commits.
//
// ─────────────────────────────────────────────────────────────────────
// AND THE THREE PROPERTIES THAT MAKE IT SAFE
// ─────────────────────────────────────────────────────────────────────
// Checked in js/motion.js rather than assumed, because each of them is
// the difference between an effect and a defect:
//
//   · the finished sentence stays in the accessibility tree, so a
//     screen reader never hears a line assembled character by character
//   · the box is measured and held, so nothing below it walks up the
//     page while the line types
//   · reduced motion resolves to the FINISHED state (CLAUDE.md §2) —
//     never to a hidden element and never to a half-typed one

import { readFileSync, readdirSync } from 'node:fs';
import path from 'node:path';
import { ROOT } from './helpers.mjs';

let pass = 0, fail = 0;
const check = (label, cond, detail) => {
  console.log((cond ? 'PASS ' : 'FAIL ') + label + (cond || detail === undefined ? '' : ` — ${detail}`));
  cond ? pass++ : fail++;
};

// ── 1 · THE RATION ───────────────────────────────────────────────────
{
  const PER_PAGE = 1;      // one typed line on any single page
  const TOTAL = 6;         // and across the whole site, both editions

  const pages = readdirSync(path.join(ROOT, 'pages')).filter((f) => f.endsWith('.html'));
  let total = 0;
  const over = [];
  for (const f of pages) {
    const body = readFileSync(path.join(ROOT, 'pages', f), 'utf8');
    const n = (body.match(/class="[^"]*\btypeset\b/g) || []).length;
    total += n;
    if (n > PER_PAGE) over.push(`${f} (${n})`);
  }
  check(`No page types more than ${PER_PAGE} line — ${pages.length} pages checked`,
    over.length === 0,
    `${over.join(', ')} — a page where several headings type themselves cannot be skimmed`);
  check(`The site types ${total} lines in total, at most ${TOTAL}`,
    total <= TOTAL,
    `${total} — the effect is for the lines where the sentence is the event; past that it is `
    + 'a house style, and a house style made of motion is exhausting');
  check('And it is used at least once, or the machinery is dead code', total >= 1);
}

// ── 2 · THE THREE PROPERTIES ─────────────────────────────────────────
{
  const motion = readFileSync(path.join(ROOT, 'js/motion.js'), 'utf8');
  const block = motion.slice(motion.indexOf('function typewriter'),
    motion.indexOf('3 · DRAWN RULES'));
  check('The typewriter is in js/motion.js', block.length > 200);

  check('The finished sentence is put in the accessibility tree',
    /setAttribute\('aria-label', text\)/.test(block),
    'without it a screen reader hears the line assembled one character at a time');

  check('The typing span is hidden from assistive technology',
    /setAttribute\('aria-hidden', 'true'\)/.test(block));

  check('The box is measured and held before the text is emptied',
    /getBoundingClientRect\(\)[\s\S]{0,200}minHeight/.test(block),
    'otherwise everything below the line walks up the page while it types');

  check('Reduced motion returns before the element is emptied',
    /if \(prefersReduced\(\)\) return;[\s\S]{0,120}var ink/.test(block),
    'the carve-out must resolve to the FINISHED state, not to a hidden or half-typed one');
}

// ── 3 · THE FIFTH VOICE ──────────────────────────────────────────────
// Glass is for the chrome; tap is for the page's own struck surfaces.
// The ranking is the design, so it is held here rather than trusted.
{
  const sonics = readFileSync(path.join(ROOT, 'js/sonics.js'), 'utf8');
  check('There is a glass voice', /glass:\s*\(\)/.test(sonics));
  check('It is a sine, not a triangle',
    /glass:[\s\S]{0,200}type:\s*'sine'/.test(sonics),
    'glass has almost no harmonic content above its first partials; a triangle here is a bell, '
    + 'which is what `seal` already is');
  check('The chrome answers with it',
    /var GLASS = [\s\S]{0,300}utilrail__item[\s\S]{0,300}lang__row/.test(sonics));
  check('And it is ranked below `open` and above `tap`',
    /closest\(OPEN\)\) return 'open';\s*\n\s*if \(el\.closest\(GLASS\)\) return 'glass';\s*\n\s*if \(el\.closest\(TAP\)\)/.test(sonics),
    'a disclosure button IS an opening act; a language row is not');
}

console.log(`\n${pass} passed, ${fail} failed.`);
process.exit(fail ? 1 : 0);
