// Run with: node --experimental-sqlite tests/hardening.test.mjs
//
// Three findings from the independent audits, closed and held.
//
//   Audit 12 (accessibility): could not confirm from outside that
//     prefers-reduced-motion is honoured.
//   Audit 13 (security): no Content-Security-Policy, and no published
//     security contact.
//
// Each is a floor, not a ceiling. None of them replaces the review that
// found it.
import { readFileSync, readdirSync, existsSync } from 'node:fs';
import path from 'node:path';
import { ROOT } from './helpers.mjs';

let pass = 0, fail = 0;
const check = (label, cond, detail) => {
  console.log((cond ? 'PASS ' : 'FAIL ') + label + (cond || detail === undefined ? '' : ` — ${detail}`));
  cond ? pass++ : fail++;
};

// ---------------------------------------------------------------------
// 1 · Reduced motion is honoured, and provably
// ---------------------------------------------------------------------
// The per-component carve-outs are the right way round and they depend
// on somebody remembering. This asserts the floor beneath them, which
// does not: a universal rule that reduces every animation and
// transition, whoever adds it and whenever.
{
  const brand = readFileSync(path.join(ROOT, 'css/brand.css'), 'utf8');
  const nets = [...brand.matchAll(
    /@media \(prefers-reduced-motion: reduce\) \{\s*\*, \*::before, \*::after \{([\s\S]*?)\}/g)];
  check('brand.css carries a universal reduced-motion floor', nets.length === 1, `${nets.length} found`);
  const net = nets[0] ? nets[0][1] : '';
  for (const prop of ['animation-duration', 'transition-duration', 'animation-iteration-count']) {
    check(`...covering ${prop}`, new RegExp(`${prop}\\s*:[^;]*!important`).test(net));
  }
  // Zero would be wrong, not merely different: an animation with zero
  // duration never fires animationend, and js/motion.js removes the
  // click-light ring on exactly that event.
  check('...at a near-zero duration rather than zero',
    /animation-duration:\s*\.0*[1-9]/.test(net), net.trim().split('\n')[0]);
  check('...and js/motion.js does still rely on animationend',
    /addEventListener\('animationend'/.test(readFileSync(path.join(ROOT, 'js/motion.js'), 'utf8')),
    'if this stops being true the near-zero requirement can be revisited');
}

// A JS-specified `behavior: 'smooth'` overrides CSS scroll-behavior, so
// the CSS floor above does not reach these. Every call site must ask.
{
  const jsDir = path.join(ROOT, 'js');
  // Comments stripped: the guard's own explanatory comment quotes the
  // literal it forbids, and flagging a comment as unguarded code is the
  // scanner being wrong rather than the code. Found immediately, by
  // this check failing on the fix that introduced it.
  const code = (src) => src.replace(/\/\*[\s\S]*?\*\//g, ' ').replace(/^\s*\/\/.*$/gm, ' ');
  const unguarded = [];
  for (const f of readdirSync(jsDir).filter((f) => f.endsWith('.js'))) {
    const src = code(readFileSync(path.join(jsDir, f), 'utf8'));
    for (const m of src.matchAll(/behavior:\s*'smooth'/g)) unguarded.push(`${f}: ${m[0]}`);
  }
  check('No script scrolls smoothly without asking the reader first',
    unguarded.length === 0, unguarded.join(', '));

  // Positive control: the call sites still exist and are guarded, so
  // this cannot pass by the scrolling having been deleted.
  const guarded = readdirSync(jsDir).filter((f) => f.endsWith('.js'))
    .filter((f) => /behavior:\s*scrollPref\(\)/.test(readFileSync(path.join(jsDir, f), 'utf8')));
  check('...and the scrolling call sites are still there, asking',
    guarded.length >= 3, `${guarded.length}: ${guarded.join(', ')}`);
  for (const f of guarded) {
    const src = readFileSync(path.join(jsDir, f), 'utf8');
    check(`${f} defines the preference check it calls`,
      /function scrollPref\(\)[\s\S]{0,200}prefers-reduced-motion/.test(src));
  }
}

// ---------------------------------------------------------------------
// 2 · A Content-Security-Policy exists, in the mode that cannot break
// ---------------------------------------------------------------------
// The argument for shipping no ENFORCING policy is sound: Clerk's SDK
// host is derived at runtime, and a wrong CSP fails one real learner
// silently in production. That argument does not apply to report-only,
// which by construction blocks nothing.
{
  const headers = readFileSync(path.join(ROOT, '_headers'), 'utf8');
  const line = headers.split('\n').find((l) => /Content-Security-Policy-Report-Only:/.test(l)) || '';
  check('A report-only CSP is published', line.length > 0);

  const policy = line.split(':').slice(1).join(':');
  for (const directive of ['default-src', 'base-uri', 'form-action', 'frame-ancestors',
    'object-src', 'script-src', 'connect-src', 'style-src', 'font-src', 'img-src']) {
    check(`...declaring ${directive}`, new RegExp(`\\b${directive}\\s`).test(policy));
  }
  check("...denying object-src and frame-ancestors outright",
    /object-src 'none'/.test(policy) && /frame-ancestors 'none'/.test(policy));
  check('...allowing the fonts the site actually loads',
    /fonts\.gstatic\.com/.test(policy) && /fonts\.googleapis\.com/.test(policy));
  check('...and the auth provider the site actually loads',
    /clerk/.test(policy));

  // The one that matters most: it must NOT be enforcing until a live
  // sign-in has been completed with it active. Shipping an enforcing
  // policy from here would be exactly the failure the existing note
  // warns about.
  const enforcing = headers.split('\n').filter((l) => /^\s*Content-Security-Policy:/.test(l));
  check('It is NOT enforcing yet, and the file says what that needs',
    enforcing.length === 0 && /Complete a real sign-in with this header live/.test(headers),
    enforcing.length ? 'an enforcing CSP was added without a live sign-in check' : undefined);
}

// ---------------------------------------------------------------------
// 3 · A researcher can reach somebody
// ---------------------------------------------------------------------
{
  const p = path.join(ROOT, '.well-known/security.txt');
  check('A security contact is published', existsSync(p));
  if (existsSync(p)) {
    const txt = readFileSync(p, 'utf8');
    check('...with a Contact field', /^Contact:\s*\S+/m.test(txt));
    check('...an Expires field, as the format requires', /^Expires:\s*\S+/m.test(txt));
    check('...and a Canonical URL', /^Canonical:\s*https:\/\//m.test(txt));
    // Not yet expired. A security.txt whose Expires has passed is
    // treated as stale by the tools that read it, which is worse than
    // not publishing one.
    const exp = (txt.match(/^Expires:\s*(\S+)/m) || [])[1];
    check('...that has not expired', exp && new Date(exp) > new Date('2026-08-23'), exp);
    check('...and it does not imply a bounty programme that does not exist',
      /no bounty programme/i.test(txt));
  }
}

// It has to reach the deployed site, or none of the above is published.
{
  const wf = readFileSync(path.join(ROOT, '.github/workflows/deploy-cloudflare.yml'), 'utf8');
  const surface = wf.slice(wf.indexOf('Assemble the deploy surface'), wf.indexOf('- name: Publish'));
  const excluded = [...surface.matchAll(/--exclude='([^']+)'/g)].map((m) => m[1]);
  check('.well-known is not excluded from the deploy surface',
    !excluded.some((e) => /well-known/.test(e)), excluded.join(', '));
}

console.log(`\n${pass} passed, ${fail} failed`);
process.exit(fail ? 1 : 0);
