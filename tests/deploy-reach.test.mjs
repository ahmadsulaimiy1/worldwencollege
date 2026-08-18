// COMMITTED IS NOT PUBLISHED, AND THE DIFFERENCE MUST NOT BE SILENT.
//
// ─────────────────────────────────────────────────────────────────────
// THE FAILURE THIS EXISTS FOR
// ─────────────────────────────────────────────────────────────────────
// On 18 August 2026 the live site was found to be serving a commit from
// 16 August. Ninety-six commits had been made since — the Library, the
// tuition ladder, the commercial model, the Record of Standing, the
// confidence sweep, nine drawn plates — every one of them committed,
// tested, pushed, and invisible to anybody who typed the domain.
//
// The deploy fired on pushes to `main` and to one feature branch. There
// was no `main` in the repository, and the feature branch named was not
// the one the work was on. So every push ran no workflow at all, and
// nothing anywhere said so: the suite was green, the branch was pushed,
// the tree was clean. Every signal a person checks reported success.
//
// The workflow's own header had warned about this exact outcome, in
// these words — "work was described as live when nothing had been
// published" — and it happened anyway, because that warning was about a
// missing trigger and this was a trigger pointing somewhere else.
//
// So the question is asked here, on every run, in the one place that
// cannot be forgotten:
//
//     does a push of THIS branch publish anything?
//
// ─────────────────────────────────────────────────────────────────────
// AND THE OTHER HALF
// ─────────────────────────────────────────────────────────────────────
// The branch that WAS wired to production has since been rebranded to
// Albalagh International Premium College — a separate institution
// (CLAUDE.md §7). One green run there would have published another
// college to this one's domain. That branch must never appear in this
// list again, and the check says so by name.

import { readFileSync, existsSync } from 'node:fs';
import { execFileSync } from 'node:child_process';
import path from 'node:path';
import { ROOT } from './helpers.mjs';

let pass = 0, fail = 0;
const check = (label, cond, detail) => {
  console.log((cond ? 'PASS ' : 'FAIL ') + label + (cond || detail === undefined ? '' : ` — ${detail}`));
  cond ? pass++ : fail++;
};

const WORKFLOW = path.join(ROOT, '.github/workflows/deploy-cloudflare.yml');
check('The deploy workflow exists', existsSync(WORKFLOW));
const yml = readFileSync(WORKFLOW, 'utf8');

// The branch list under `on: push: branches:`, read without a YAML
// parser so the suite carries no dependency for one field.
//
// Line-wise rather than by one regex: the list carries comment blocks
// between its entries — the reason each branch is there is written
// beside it — and the first cut of this check spanned from `branches:`
// to the next key with `[\s\S]*?`, read nothing, and reported that the
// deploy publishes from nowhere. A guard against silent non-publication
// that itself fails silently is worse than none.
const branches = (() => {
  const lines = yml.split('\n');
  const start = lines.findIndex((l) => /^ {4}branches:\s*$/.test(l));
  if (start === -1) return [];
  const out = [];
  for (let i = start + 1; i < lines.length; i += 1) {
    const line = lines[i];
    if (/^\s*(#|$)/.test(line)) continue;            // a comment or a blank
    const item = line.match(/^ {6,}-\s*(\S+)\s*$/);
    if (item) { out.push(item[1]); continue; }
    break;                                           // the next key ends the list
  }
  return out;
})();

check(`The deploy publishes from named branches — ${branches.length}`,
  branches.length > 0, 'no `on: push: branches:` list could be read');

// ── 1 · THE BRANCH THIS WORK IS ON MUST PUBLISH ──────────────────────
const current = (() => {
  // GitHub Actions checks out a detached HEAD, so the ref comes from the
  // environment there and from git everywhere else.
  if (process.env.GITHUB_REF_NAME) return process.env.GITHUB_REF_NAME;
  try {
    return execFileSync('git', ['rev-parse', '--abbrev-ref', 'HEAD'],
      { cwd: ROOT, encoding: 'utf8' }).trim();
  } catch { return ''; }
})();

if (!current || current === 'HEAD') {
  console.log('NOTE  No branch name available; the publish check is skipped in this context.');
} else {
  check(`Pushing this branch publishes the site — ${current}`,
    branches.includes(current),
    `${current} is not in the deploy trigger (${branches.join(', ') || 'empty'}). `
    + 'Work committed here reaches nobody. Add it to `on: push: branches:` in '
    + '.github/workflows/deploy-cloudflare.yml, or move the work to a branch that is listed.');
}

// ── 2 · EVERY BRANCH NAMED MUST EXIST ────────────────────────────────
// `main` was listed for weeks and did not exist, which left exactly one
// live trigger and nobody realised it.
{
  let known = [];
  try {
    known = execFileSync('git', ['branch', '--format=%(refname:short)', '--all'],
      { cwd: ROOT, encoding: 'utf8' })
      .split('\n').map((s) => s.trim().replace(/^remotes\/origin\//, '')).filter(Boolean);
  } catch { known = []; }
  if (known.length) {
    const phantom = branches.filter((b) => !known.includes(b));
    check('Every branch the deploy names exists',
      phantom.length === 0,
      `${phantom.join(', ')} named in the trigger but not in this repository — `
      + 'a trigger on a branch that does not exist is a trigger that never fires');
  }
}

// ── 3 · A SEPARATE INSTITUTION CANNOT PUBLISH TO THIS DOMAIN ─────────
{
  const ALBALAGH = 'claude/worldwide-english-college-site-ezy1zo';
  check('The Albalagh branch cannot deploy to this College',
    !branches.includes(ALBALAGH),
    'that branch is Albalagh International Premium College (CLAUDE.md §7); '
    + 'a green run there would publish another institution to worldwencollege.co.uk');
}

// ── 4 · THE GATE IS STILL IN FRONT OF THE DEPLOY ─────────────────────
// A publish step that stopped depending on the tests would turn every
// check in this directory into decoration.
check('The deploy job still waits on the verify job',
  /\n {2}deploy:\n[\s\S]*?needs:\s*(?:\[[^\]]*verify[^\]]*\]|verify)\b/.test(yml),
  'the publish step does not declare `needs: verify`');

console.log(`\n${pass} passed, ${fail} failed.`);
process.exit(fail ? 1 : 0);
