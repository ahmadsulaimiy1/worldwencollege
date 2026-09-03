// Run with: node --experimental-sqlite tests/indexing.test.mjs
//
// WHAT THE COLLEGE OFFERS TO A SEARCH ENGINE, AND WHAT IT DOES NOT.
//
// ─────────────────────────────────────────────────────────────────────
// THE DEFECT THIS EXISTS FOR
// ─────────────────────────────────────────────────────────────────────
// scripts/build.js generates sitemap.xml from the manifest, which was
// itself the fix for a hand-maintained sitemap that listed 20 of 76
// pages. It generated every page except 404 — so all twenty-two of the
// learner's own surfaces went in: a statement of account, a set of
// marks, a transcript, a payment confirmation. The College was formally
// submitting them to be indexed.
//
// Nothing leaked: every one of those pages is driven by an
// authenticated endpoint, and a crawler reaching one sees "You are not
// signed in." But that is twenty-two thin, private, near-identical
// pages offered to an index by the institution itself, and a private
// page does not belong in a public sitemap whatever it happens to
// render to a stranger.
//
// ─────────────────────────────────────────────────────────────────────
// WHAT IS HELD
// ─────────────────────────────────────────────────────────────────────
//   · A private page is absent from sitemap.xml and carries
//     noindex, nofollow in its head.
//   · A public page is present and carries index, follow. Every page
//     carries the tag: an absent robots meta is a default nobody has
//     decided, and this site decides.
//   · A page that mounts js/portal-guard.js is private BY DEFINITION.
//     The flag cannot drift away from the guard, because the guard is
//     what sets it.
//   · 404 is in neither: a sitemap is a list of pages worth indexing
//     and an error page is not one.
import { readFileSync, existsSync } from 'node:fs';
import path from 'node:path';
import { ROOT } from './helpers.mjs';

let pass = 0, fail = 0;
const check = (label, cond, detail) => {
  console.log((cond ? 'PASS ' : 'FAIL ') + label + (cond || detail === undefined ? '' : ` — ${detail}`));
  cond ? pass++ : fail++;
};

const manifest = JSON.parse(readFileSync(path.join(ROOT, 'pages/manifest.json'), 'utf8'));
const entries = Array.isArray(manifest) ? manifest : manifest.pages;
const sitemap = readFileSync(path.join(ROOT, 'sitemap.xml'), 'utf8');

const urlFor = (output) => '/' + output.replace(/index\.html$/, '');
const isPrivate = (e) => e.private === true || (e.scripts || []).includes('/js/portal-guard.js');

const priv = entries.filter(isPrivate);
const pub = entries.filter((e) => !isPrivate(e) && !/(^|\/)404\.html$/.test(e.output));

check('The learner has private surfaces, or this file is measuring nothing',
  priv.length >= 10, String(priv.length));
check('...and the College has public ones', pub.length >= 100, String(pub.length));

// --- The sitemap ------------------------------------------------------
{
  const listedPrivate = priv.filter((e) => sitemap.includes(`${urlFor(e.output)}</loc>`));
  check('No private page is submitted to be indexed',
    listedPrivate.length === 0, listedPrivate.map((e) => e.slug).join(', '));

  const missingPublic = pub.filter((e) => !sitemap.includes(`${urlFor(e.output)}</loc>`));
  check('Every public page IS submitted — the fault this sitemap was generated to close',
    missingPublic.length === 0, missingPublic.map((e) => e.slug).slice(0, 6).join(', '));

  check('The error page is in neither', !/404/.test(sitemap));
  const locs = (sitemap.match(/<loc>/g) || []).length;
  check('The sitemap lists exactly the public pages, and nothing else',
    locs === pub.length, `${locs} listed against ${pub.length} public`);
}

// --- The tag on the page itself --------------------------------------
// A crawler can reach a private page from a referrer, a pasted address
// or a link somebody shared. Absence from the sitemap is not an
// instruction; the tag is.
{
  const read = (e) => {
    const f = path.join(ROOT, e.output);
    return existsSync(f) ? readFileSync(f, 'utf8') : null;
  };
  const built = [...priv, ...pub].filter((e) => read(e) !== null);
  check('The site is built, or this file is measuring a stale tree',
    built.length === priv.length + pub.length,
    `${built.length} of ${priv.length + pub.length}`);

  const noTag = built.filter((e) => !/<meta name="robots"/.test(read(e)));
  check('Every page states its own indexing rather than leaving a default',
    noTag.length === 0, noTag.map((e) => e.slug).slice(0, 6).join(', '));

  const wrongPrivate = priv.filter((e) => {
    const html = read(e);
    return html && !/<meta name="robots" content="noindex, nofollow">/.test(html);
  });
  check('Every private page says noindex, nofollow in its own head',
    wrongPrivate.length === 0, wrongPrivate.map((e) => e.slug).slice(0, 6).join(', '));

  const wrongPublic = pub.filter((e) => {
    const html = read(e);
    return html && !/<meta name="robots" content="index, follow">/.test(html);
  });
  check('...and every public page says index, follow',
    wrongPublic.length === 0, wrongPublic.map((e) => e.slug).slice(0, 6).join(', '));
}

// --- The guard sets the flag, so the flag cannot drift ---------------
{
  const guarded = entries.filter((e) => (e.scripts || []).includes('/js/portal-guard.js'));
  check('Every page that gates itself is treated as private',
    guarded.every(isPrivate), guarded.filter((e) => !isPrivate(e)).map((e) => e.slug).join(', '));
  check('...and the build decides this from the guard, not from a list kept by hand',
    /portal-guard\.js/.test(readFileSync(path.join(ROOT, 'scripts/build.js'), 'utf8')));
}

// --- Both editions travel together -----------------------------------
// A private English page with a public Arabic twin would put half the
// learner's own surfaces back in the index.
{
  const bySlug = new Map(entries.map((e) => [e.slug, e]));
  const mismatched = entries.filter((e) => {
    const twin = bySlug.get(e.slug.endsWith('-ar') ? e.slug.slice(0, -3) : `${e.slug}-ar`);
    return twin && isPrivate(e) !== isPrivate(twin);
  });
  check('A page and its Arabic edition agree about being private',
    mismatched.length === 0, mismatched.map((e) => e.slug).join(', '));
}

console.log(`\n${pass} passed, ${fail} failed.`);
process.exit(fail ? 1 : 0);
