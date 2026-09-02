// tests/resources-shelf.test.mjs — a download offered is a download that
// serves.
//
// ─────────────────────────────────────────────────────────────────────
// THE TWO FAULTS BEHIND THIS FILE
// ─────────────────────────────────────────────────────────────────────
// 1 · SIXTEEN VOLUMES NOBODY COULD FIND. They had been published,
//     typeset, redirected and downloadable for weeks, and the owner
//     reported looking for the books and finding nothing. Both were
//     true. The only route to them was a pillar named after the imprint
//     that made them rather than the subject they are about, and a
//     reader looking for the curriculum does not think "Press".
//
// 2 · AND ONE OF THEM COULD NOT BE SERVED AT ALL. The IEFC Complete
//     Curriculum is 26.7MB, past Cloudflare's per-asset ceiling, so
//     scripts/build-library.mjs deliberately writes it no redirect rule.
//     The first cut of the shelf offered it anyway: the generator's own
//     guard checked `access` and `excluded` and did not ask about
//     `oversize`, which is a guard that checks two of the three reasons
//     a volume is unservable and therefore ships the third.
//
// So this holds the whole chain, from the register to the rule to the
// file on disk. A card exists only if a reader tapping it gets a PDF.

import { readFileSync, existsSync } from 'node:fs';
import path from 'node:path';
import { ROOT } from './helpers.mjs';

let pass = 0, fail = 0;
const check = (label, cond, detail) => {
  console.log((cond ? 'PASS ' : 'FAIL ') + label + (cond || detail === undefined ? '' : ` — ${detail}`));
  cond ? pass++ : fail++;
};

const LIB = JSON.parse(readFileSync(path.join(ROOT, 'data/library.json'), 'utf8'));
const rows = LIB.volumes || LIB.rows || [];
const REDIRECTS = readFileSync(path.join(ROOT, '_redirects'), 'utf8');

// The shelf as it was actually built, read off the served pages rather
// than off the generator — what shipped is what is checked.
const PAGES = ['academics/index.html', 'ar/academics/index.html'];

for (const rel of PAGES) {
  const page = readFileSync(path.join(ROOT, rel), 'utf8');
  const slugs = [...page.matchAll(/data-volume="([\w-]+)"/g)].map((m) => m[1]);

  check(`${rel}: the shelf is on the page — ${slugs.length} volumes`, slugs.length >= 5);

  for (const slug of slugs) {
    const v = rows.find((r) => r.slug === slug);
    check(`${rel} · ${slug}: is in the register`, Boolean(v));
    if (!v) continue;

    // ── the three reasons a volume cannot be served ─────────────────
    check(`${slug}: open access`, v.access === 'open', v.access);
    check(`${slug}: not excluded from the deployment`, !v.excluded);
    check(`${slug}: within the size a page may serve — ${v.mb}MB`, !v.oversize,
      `${v.mb}MB is past the per-asset ceiling, so no redirect rule is written for it and the `
      + 'card would be a download that 404s');

    // ── the rule that makes the URL work ────────────────────────────
    const rule = REDIRECTS.split('\n')
      .map((l) => l.trim())
      .find((l) => l.startsWith(`${v.href} `) || l.startsWith(`${v.href}\t`));
    check(`${slug}: _redirects carries a rule for ${v.href}`, Boolean(rule),
      'the shelf links a URL the deployment has never been told about');
    if (!rule) continue;

    const parts = rule.split(/\s+/);
    check(`${slug}: served as a rewrite, not a redirect`, parts[2] === '200',
      `status ${parts[2]} — a 30x would send the reader to the raw publication path and expose `
      + 'the file name, which is what the rewrite exists to avoid');

    // ── and the file it points at ───────────────────────────────────
    const target = decodeURIComponent(parts[1]).replace(/^\//, '');
    check(`${slug}: the file it points at exists — ${target.slice(0, 60)}`,
      existsSync(path.join(ROOT, target)),
      'a redirect to a file no deployment carries is the exact fault that shipped once already');
  }
}

// ── AND THE ROUTE IN, WHICH IS THE POINT OF THE SHELF ────────────────
{
  const acad = readFileSync(path.join(ROOT, 'academics/index.html'), 'utf8');
  check('Academics carries the shelf under its own anchor', /id="resources"/.test(acad));
  check('...and still points at the full register',
    /href="\/press\/library\/"/.test(acad),
    'the shelf is a selection; the Library is the record, and a reader must be able to reach it');
}

console.log(`\n${pass} passed, ${fail} failed.`);
process.exit(fail ? 1 : 0);
