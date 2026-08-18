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
//
// EXCEPT THE ONES THE REPOSITORY HAS DELIBERATELY NOT COMMITTED, and
// that exception is read from .gitignore rather than listed here.
//
// The Student Edition is a 25 MB near-duplicate of a book already in
// the history — the Teacher's Edition minus the answer keys — so it is
// ignored, and .gitignore says so with the command that rebuilds it.
// This check passed on every machine that had run that command and
// failed on the deploy runner, which is a clean checkout. It failed
// correctly: the file genuinely is not there. What was wrong was the
// question, which asked "is this file present" when the policy is "is
// this file either committed or deliberately excluded".
//
// So an absent volume is still a failure unless .gitignore names it AND
// the build command .gitignore promises actually exists. A volume that
// is merely missing fails; a volume that is missing because somebody
// silently added it to .gitignore without a way to rebuild it fails too.
{
  const gitignore = readFileSync(path.join(ROOT, '.gitignore'), 'utf8');
  const pkg = JSON.parse(readFileSync(path.join(ROOT, 'package.json'), 'utf8'));
  const scripts = Object.keys(pkg.scripts || {});

  const absent = reg.volumes.filter((v) => !existsSync(path.join(ROOT, 'publication', v.file)));
  const excluded = absent.filter((v) => gitignore.includes(`publication/${v.file}`));
  const gone = absent.filter((v) => !excluded.includes(v));

  check('Every registered volume is a file in publication/, or is one .gitignore excludes',
    gone.length === 0, gone.map((v) => v.file).join(', '));

  // The promise .gitignore makes on behalf of an excluded volume.
  const promised = [...gitignore.matchAll(/npm run ([\w:-]+)/g)].map((m) => m[1]);
  check(`...and each exclusion names a build command that exists — ${excluded.length} excluded`,
    excluded.length === 0 || promised.some((s) => scripts.includes(s)),
    `.gitignore promises ${promised.join(', ') || 'nothing'}; package.json has `
    + `${scripts.filter((s) => promised.includes(s)).join(', ') || 'none of them'}`);

  // An excluded volume must not be offered as a download, because the
  // deploy cannot serve a file the repository does not hold.
  const offered = excluded.filter((v) => v.href && redirects.includes(v.href));
  check('...and no excluded volume is served a download URL it cannot honour',
    offered.length === 0, offered.map((v) => v.slug).join(', '));
}

// ── 2 · EVERY PUBLISHED SIZE IS THE FILE'S ACTUAL SIZE ───────────────
// Measured, not typed: a download size is exactly the sort of small
// claim that goes stale on a rebuild and that nobody re-checks.
//
// Compared at the precision the page PUBLISHES — one decimal place of a
// megabyte — and not byte-for-byte. A PDF carries a production
// timestamp, so re-printing a volume changes its length by a few bytes
// without changing anything a reader sees. A byte-exact check here
// failed the suite the first time the publication tests re-rendered the
// Teacher's Companion, which is a test reporting a defect that does not
// exist. The claim on the page is "0.7 MB"; that is what is checked.
{
  const wrong = reg.volumes.filter((v) => {
    const full = path.join(ROOT, 'publication', v.file);
    if (!existsSync(full)) return false;
    return (statSync(full).size / 1048576).toFixed(1) !== v.mb;
  });
  check('Every published size matches the file on disk, to the tenth of a megabyte',
    wrong.length === 0,
    wrong.map((v) => `${v.slug}: page says ${v.mb} MB, file is `
      + `${(statSync(path.join(ROOT, 'publication', v.file)).size / 1048576).toFixed(1)} MB`).join(', '));

  // The oversize decision must be made on the real size, not a stale
  // one: a volume that has grown past the ceiling since the register
  // was written would break the whole deploy.
  const misjudged = reg.volumes.filter((v) => {
    const full = path.join(ROOT, 'publication', v.file);
    if (!existsSync(full)) return false;
    return (statSync(full).size > reg.max_bytes) !== Boolean(v.oversize);
  });
  check('...and no volume has crossed the size ceiling since the register was built',
    misjudged.length === 0, misjudged.map((v) => v.slug).join(', '));
}

// ── 3 · EVERY DOWNLOADABLE VOLUME HAS A SERVING RULE ─────────────────
{
  // "Downloadable" is what the deploy can actually serve, which is not
  // the same as "small enough". A volume the repository deliberately
  // does not carry has no bytes to route to, however small it is — and
  // this check, reading only the size, demanded a serving rule for a
  // file no deployment has ever contained. It got one, and the Library
  // published a link that 404s.
  const served = reg.volumes.filter((v) => !v.oversize && !v.excluded);
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
