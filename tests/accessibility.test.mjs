// THE PAGES THE BUILD DOES NOT TOUCH ARE THE ONES THAT DRIFT.
//
// tests/browser/route-audit.mjs already enforces a real accessibility
// baseline across every served route: a non-empty title, a lang
// attribute, exactly one h1, an alt on every image, no skipped heading
// level, tap targets at 390px, no horizontal overflow at three widths.
// That is more than most sites check and it is genuinely enforced.
//
// It did not check for a skip link, and that is where the gap was.
//
// scripts/build.js injects `<a class="skip-link" href="#main">` into
// every page it generates, so 72 pages had one and nobody had to think
// about it. Five did not: my-programme, instructor-review,
// admin-enrolments and the two admissions wizards are hand-maintained
// HTML that bypasses the build entirely. Every one of them already had
// `<main id="main">` — the target was there, the link was missing, and
// a keyboard user on the application form had to tab through the whole
// header on every page of the wizard.
//
// This is the same shape as the sitemap that listed 20 of 76 pages and
// the deploy that named a database nobody had: two artefacts agreeing
// by coincidence rather than by construction. So the rule is asserted
// against every served page, whether the build made it or not.
//
// ────────────────────────────────────────────────────────────────
// AND ONE THING THAT WAS NOT A DEFECT
// ────────────────────────────────────────────────────────────────
// A first pass reported 25 unlabelled form controls. They were all
// properly labelled — wrapped in <label> elements, with sr-only
// <legend> on the fieldsets — and the detector only knew about
// for="id" and aria-label. The check below understands nesting,
// because a test that cries wolf about correct markup gets switched
// off and takes the real findings with it.
import { readFileSync, readdirSync, statSync } from 'node:fs';
import path from 'node:path';
import { ROOT } from './helpers.mjs';

let pass = 0, fail = 0;
const check = (label, cond, detail) => {
  console.log((cond ? 'PASS ' : 'FAIL ') + label + (cond || detail === undefined ? '' : ` — ${detail}`));
  cond ? pass++ : fail++;
};

// Directories that are not the served site.
const SKIP = new Set(['node_modules', '.git', 'stromex', 'pages', 'partials',
  'publication', 'docs', 'tests', 'scripts', 'sql', 'functions', '.github']);

function servedPages(dir = ROOT, out = []) {
  for (const entry of readdirSync(dir)) {
    if (entry.startsWith('.') || SKIP.has(entry)) continue;
    const full = path.join(dir, entry);
    if (statSync(full).isDirectory()) servedPages(full, out);
    else if (entry.endsWith('.html')) out.push(full);
  }
  return out;
}

const pages = servedPages().map((f) => ({ rel: path.relative(ROOT, f), html: readFileSync(f, 'utf8') }));
check(`Every served page is checked — ${pages.length}`, pages.length >= 50, pages.length);

// --- Bypass blocks (WCAG 2.4.1) ---------------------------------------
{
  const missing = pages.filter((p) => !/class="skip-link"/.test(p.html));
  check('Every page offers a way past the header to the content',
    missing.length === 0, missing.map((p) => p.rel).join(', '));

  // A skip link that points at nothing is worse than none: it looks
  // like a bypass and lands the user back at the top.
  const broken = pages.filter((p) => {
    const href = (/class="skip-link"\s+href="#([^"]+)"/.exec(p.html) || [])[1];
    return href && !new RegExp(`id="${href}"`).test(p.html);
  });
  check('...and every skip link lands on a target that exists',
    broken.length === 0, broken.map((p) => p.rel).join(', '));

  // On an Arabic page it has to be in Arabic, or it is a bypass only a
  // reader of English can use.
  const arabic = pages.filter((p) => /<html[^>]*lang="ar"/.test(p.html));
  check(`Arabic pages are checked too — ${arabic.length}`, arabic.length > 0);
  const englishOnly = arabic.filter((p) => /class="skip-link"[^>]*>Skip to main content</.test(p.html));
  check('...and their skip link is written in Arabic',
    englishOnly.length === 0, englishOnly.map((p) => p.rel).join(', '));
}

// --- Form labelling (WCAG 3.3.2), understanding nesting ---------------
{
  const unlabelled = [];
  for (const p of pages) {
    for (const m of p.html.matchAll(/<(input|select|textarea)\b[^>]*>/g)) {
      const tag = m[0];
      if (/type="(hidden|submit|button|image)"/.test(tag)) continue;
      const id = (/\bid="([^"]+)"/.exec(tag) || [])[1];
      // Four ways to be labelled, and the last is the one the first
      // version of this check did not know about.
      const byFor = id && new RegExp(`for="${id}"`).test(p.html);
      const byAria = /aria-label(ledby)?="/.test(tag);
      const byTitle = /\btitle="/.test(tag);
      const before = p.html.slice(Math.max(0, m.index - 400), m.index);
      const nested = /<label\b[^>]*>(?:(?!<\/label>)[\s\S])*$/.test(before);
      if (!(byFor || byAria || byTitle || nested)) {
        unlabelled.push(`${p.rel}: ${tag.slice(0, 48)}`);
      }
    }
  }
  check('Every form control is labelled, by association or by nesting',
    unlabelled.length === 0, unlabelled.slice(0, 4).join(' | '));
}

// --- The affordances the stylesheet has to keep -----------------------
{
  const css = readFileSync(path.join(ROOT, 'css/brand.css'), 'utf8');
  check('The skip link is visually hidden until focused, not hidden outright',
    /\.skip-link\b[\s\S]{0,300}?\.skip-link:focus/.test(css));
  check('Focus is visible — :focus-visible is styled rather than suppressed',
    (css.match(/:focus-visible/g) || []).length >= 4,
    (css.match(/:focus-visible/g) || []).length);
  check('...and focus outlines are never removed without a replacement',
    !/outline:\s*(none|0)\s*;(?![^}]*(outline|box-shadow))/.test(css));
  check('Motion is reduced for readers who ask for it',
    (css.match(/prefers-reduced-motion/g) || []).length >= 1);
}

// --- The rule that lets a hand-written page skip all of this ----------
// The build injects the skip link. A page that bypasses the build gets
// nothing, which is exactly how these five ended up without one, so the
// injection itself is asserted here: if somebody removes it, 72 pages
// lose their bypass at once and this says so.
{
  const build = readFileSync(path.join(ROOT, 'scripts/build.js'), 'utf8');
  check('The build still injects a skip link into every page it generates',
    /<a class="skip-link" href="#main">/.test(build));
  check('...and still gives every generated page the <main id="main"> it points at',
    /<main id="main">/.test(build));
}

console.log(`\n${pass} passed, ${fail} failed.`);
process.exit(fail ? 1 : 0);
