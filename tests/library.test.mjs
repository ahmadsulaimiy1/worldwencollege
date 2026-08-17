// tests/library.test.mjs — the Library serves what it lists.
//
// A catalogue that offers a download is a promise, and a broken one is
// worse than an absent one: a visitor who clicks a volume and gets a
// 404 learns something about the institution, not about the file.
//
// This checks the whole chain — register, page, redirect map, deploy
// surface — because every link in it was broken at once before the
// Library existed. publication/ was excluded from the deploy on the
// reasoning that nothing linked it; nothing linked it because nothing
// served it. Fourteen finished volumes existed only on the build
// machine.

import { readFileSync, existsSync, statSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = path.dirname(path.dirname(fileURLToPath(import.meta.url)));
let pass = 0, fail = 0;
const check = (label, ok, detail) => {
  if (ok) { pass++; console.log(`PASS ${label}`); }
  else { fail++; console.log(`FAIL ${label}${detail ? ` — ${detail}` : ''}`); }
};

const reg = JSON.parse(readFileSync(path.join(ROOT, 'data/library.json'), 'utf8'));
const redirects = readFileSync(path.join(ROOT, '_redirects'), 'utf8');
const workflow = readFileSync(path.join(ROOT, '.github/workflows/deploy-cloudflare.yml'), 'utf8');

check(`The register holds volumes — ${reg.total} listed, ${reg.downloadable} downloadable`,
  reg.total >= 14 && reg.downloadable >= 12, `total ${reg.total}, downloadable ${reg.downloadable}`);

// ── 1 · EVERY LISTED VOLUME IS A FILE THAT EXISTS ────────────────────
{
  const gone = reg.volumes.filter((v) => !existsSync(path.join(ROOT, 'publication', v.file)));
  check('Every registered volume is a file in publication/',
    gone.length === 0, gone.map((v) => v.file).join(', '));
}

// ── 2 · EVERY SIZE IS THE FILE'S ACTUAL SIZE ─────────────────────────
// Measured, not typed: a download size is exactly the sort of small
// claim that goes stale on a rebuild and that nobody re-checks.
{
  const wrong = reg.volumes.filter((v) => {
    const full = path.join(ROOT, 'publication', v.file);
    return existsSync(full) && statSync(full).size !== v.bytes;
  });
  check('Every published size matches the file on disk',
    wrong.length === 0,
    wrong.map((v) => `${v.slug}: register ${v.bytes}B`).join(', '));
}

// ── 3 · EVERY DOWNLOADABLE VOLUME HAS A SERVING RULE ─────────────────
{
  const served = reg.volumes.filter((v) => !v.oversize);
  const unrouted = served.filter((v) => !redirects.includes(v.href));
  check(`Every downloadable volume has a rule in _redirects — ${served.length} expected`,
    unrouted.length === 0, unrouted.map((v) => v.href).join(', '));

  // 200, not 301: the slug IS the published address. A redirect would
  // make the ugly underlying path the canonical one.
  const notRewrites = served.filter((v) => {
    const line = redirects.split('\n').find((l) => l.trimStart().startsWith(v.href + ' '));
    return !line || !line.trim().endsWith('200');
  });
  check('...and each is a 200 rewrite rather than a 301 redirect',
    notRewrites.length === 0, notRewrites.map((v) => v.href).join(', '));
}

// ── 4 · AN OVERSIZE VOLUME IS NEVER OFFERED AS A DOWNLOAD ────────────
// Cloudflare Pages rejects any file over 25 MiB and fails the WHOLE
// upload. Offering one would break the deploy and lie to the reader in
// the same move.
{
  const over = reg.volumes.filter((v) => v.oversize);
  const routed = over.filter((v) => redirects.includes(v.href));
  check(`No volume over ${reg.max_bytes / 1048576} MiB is routed for download — ${over.length} oversize`,
    routed.length === 0, routed.map((v) => v.slug).join(', '));

  for (const lang of ['', '.ar']) {
    const body = readFileSync(path.join(ROOT, `pages/press-library${lang}.html`), 'utf8');
    const offered = over.filter((v) => body.includes(`href="${v.href}"`));
    check(`...and the ${lang ? 'Arabic' : 'English'} page offers it on request, not as a file`,
      offered.length === 0, offered.map((v) => v.slug).join(', '));
  }
}

// ── 5 · THE DEPLOY SURFACE ACTUALLY CARRIES THE LIBRARY ──────────────
{
  check('publication/ is no longer excluded wholesale from the deploy',
    !/--exclude='publication\/'/.test(workflow));
  check('...and the two oversize volumes are excluded by name',
    reg.volumes.filter((v) => v.oversize)
      .every((v) => workflow.includes(v.file)));
  check('...and the editable masters and staged HTML stay off it',
    workflow.includes("--exclude='publication/*.docx'")
    && workflow.includes("--exclude='publication/.*'"));
}

// ── 6 · BOTH EDITIONS LIST THE SAME VOLUMES ──────────────────────────
// A volume downloadable in English and absent in Arabic is CLAUDE.md §4
// broken in the way that matters most: the Arabic reader is the one
// likeliest to want the curriculum before committing money to it.
{
  const en = readFileSync(path.join(ROOT, 'pages/press-library.html'), 'utf8');
  const ar = readFileSync(path.join(ROOT, 'pages/press-library.ar.html'), 'utf8');
  const asym = reg.volumes.filter((v) => en.includes(v.title) !== ar.includes(v.title));
  check(`Both editions list every volume — ${reg.total} each`,
    asym.length === 0, asym.map((v) => v.slug).join(', '));

  for (const [name, body] of [['English', en], ['Arabic', ar]]) {
    const bare = (body.match(/<div class="card[^"]*"/g) || []).filter((c) => !c.includes('aurum'));
    check(`Every ${name} volume card wears the material law — CLAUDE.md §2`,
      bare.length === 0, `${bare.length} bare`);
  }
}

// ── 7 · THE LIBRARY IS REACHABLE FROM THE SITE ───────────────────────
// The whole fault this page corrects was unreachability. A Library
// nothing links to is the same failure one directory further on.
{
  const linkers = ['pages/press.html', 'pages/academics.html', 'pages/students.html'];
  const silent = linkers.filter((f) => {
    const full = path.join(ROOT, f);
    return !existsSync(full) || !readFileSync(full, 'utf8').includes('/press/library/');
  });
  check('The Library is linked from Press, Academics and Students',
    silent.length === 0, silent.join(', '));

  const arLinkers = ['pages/press.ar.html', 'pages/academics.ar.html', 'pages/students.ar.html'];
  const arSilent = arLinkers.filter((f) => {
    const full = path.join(ROOT, f);
    return !existsSync(full) || !readFileSync(full, 'utf8').includes('/ar/press/library/');
  });
  check('...and from all three in Arabic',
    arSilent.length === 0, arSilent.join(', '));
}

console.log(`\n${pass} passed, ${fail} failed.`);
process.exit(fail ? 1 : 0);
