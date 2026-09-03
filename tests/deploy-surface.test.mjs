// WHAT THE PUBLIC CAN ACTUALLY READ.
//
// tests/demo-people.test.mjs bans eighteen invented staff names from
// "every file the site serves", and decides what that means with a
// SKIP_DIRS list: docs, tests, sql, scripts, .github. Every scan in this
// project inherited the same list.
//
// Nothing ever checked it against the deploy. The deploy step was
// `wrangler pages deploy .` — the working directory, all of it — so
// docs/org-chart-placeholders.md was readable at
// /docs/org-chart-placeholders.md on the live site, along with the SQL
// seeds, the test suite and the build scripts. The ban held perfectly
// across the files the test looked at, and the banned document itself
// was public.
//
// That is the failure mode this whole project is built to avoid: not a
// test that fails, but a test that passes while measuring the wrong
// surface. So this file asserts the one thing that makes the others
// mean anything — that the set of directories the tests treat as
// private is exactly the set the deploy refuses to upload.
import { readFileSync, existsSync } from 'node:fs';
import path from 'node:path';
import { ROOT } from './helpers.mjs';

let pass = 0, fail = 0;
const check = (label, cond, detail) => {
  console.log((cond ? 'PASS ' : 'FAIL ') + label + (cond || detail === undefined ? '' : ` — ${detail}`));
  cond ? pass++ : fail++;
};

const WORKFLOW_REL = '.github/workflows/deploy-cloudflare.yml';
const workflow = readFileSync(path.join(ROOT, WORKFLOW_REL), 'utf8');

// ---------------------------------------------------------------------
// The deploy must upload an assembled directory, not the repository
// ---------------------------------------------------------------------
check('The deploy publishes a staging directory, not the working tree',
  /wrangler pages deploy \.deploy\b/.test(workflow),
  (workflow.match(/wrangler pages deploy \S+/) || ['(not found)'])[0]);
check('...and never the working tree', !/wrangler pages deploy \.\s/.test(workflow));
check('The staging directory is assembled fresh each run',
  /rm -rf \.deploy/.test(workflow));
check('...and the job fails loudly if an internal directory reaches it',
  /Internal directories reached the deploy surface/.test(workflow));

// ── THE ONE THAT COST TWO DEPLOYS ──
//
// `wrangler pages deploy | tee deploy.log` takes tee's exit status, not
// wrangler's. Run #11 failed on Cloudflare's 25 MiB file limit, uploaded
// nothing, and the job reported success — twice, across runs #10 and
// #11, both announced as live. A green deploy that published nothing is
// worse than a red one.
check('The publish step sets pipefail, so a failed upload fails the job',
  /set -o pipefail/.test(workflow));
check('...and refuses to pass when wrangler printed no deployment URL',
  /wrangler printed no deployment URL/.test(workflow));
check('The assembly step rejects files over Cloudflare\'s 25 MiB limit',
  /-size \+25M/.test(workflow) && /25 MiB limit would fail the upload/.test(workflow));

// ── WHAT A push: TRIGGER MUST NEVER DO ──
//
// The workflow now deploys on push, which removes the "pushing does not
// deploy" trap that let work be described as live twice while nothing
// had been published. It also means steps that were previously reached
// only by a human filling in a form are now reached automatically, and
// one of them is destructive-adjacent: the seed step runs INSERTs that
// are not idempotent, against the REMOTE database.
//
// A push carries no inputs, so `inputs.seed_database` is empty and
// falsy — which happens to be correct today and would silently stop
// being correct if anyone gave that input a default of true. The guard
// below requires the step to be gated on the event type as well, so
// seeding stays something a person decides to do.
check('Seeding the remote database can never be triggered by a push',
  /if:\s*\$\{\{\s*github\.event_name == 'workflow_dispatch' && inputs\.seed_database\s*\}\}/.test(workflow),
  'the seed step is not gated on the event type');
check('The deploy still runs only after the verify job',
  /needs:\s*verify/.test(workflow));
check('A push publishes to the production Pages branch, not a preview',
  /--branch="\$\{\{ inputs\.branch \|\| 'main' \}\}"/.test(workflow),
  'a push would publish somewhere other than where the live site is served from');
{
  // Sabotage: an input default of true must not be enough to seed.
  const regressed = workflow.replace(
    /if: \$\{\{ github\.event_name == 'workflow_dispatch' && inputs\.seed_database \}\}/,
    'if: ${{ inputs.seed_database }}');
  check('...and this check catches the gate being loosened back',
    !/github\.event_name == 'workflow_dispatch' && inputs\.seed_database/.test(regressed));
}

// ---------------------------------------------------------------------
// THE ONE THAT MATTERS — the two lists are the same list
// ---------------------------------------------------------------------
// Read both from their real sources. A hard-coded expectation here
// would be a third list that could drift from the other two.
const scanner = readFileSync(path.join(ROOT, 'tests/demo-people.test.mjs'), 'utf8');
const skipMatch = scanner.match(/const SKIP_DIRS = new Set\(\[([^\]]*)\]\)/);
check('The name scan declares which directories it treats as private', !!skipMatch);

const excluded = [...workflow.matchAll(/--exclude='([^']+)\/'/g)].map((m) => m[1]);
check('The deploy declares which directories it refuses to upload',
  excluded.length > 0, excluded.join(', '));

if (!skipMatch || !excluded.length) {
  console.log('\nRefusing to compare lists that could not be read — the comparison would pass vacuously.');
  console.log(`\n${pass} passed, ${fail} failed.`);
  process.exit(1);
}

const skipped = skipMatch[1].split(',').map((s) => s.trim().replace(/^['"]|['"]$/g, '')).filter(Boolean);
// .git and node_modules are excluded from the upload for obvious
// reasons and are not part of the scan's question, so compare only the
// directories that carry project content.
const INFRASTRUCTURE = new Set(['.git', 'node_modules', '.deploy']);
const deployPrivate = excluded.filter((d) => !INFRASTRUCTURE.has(d)).sort();
const scanPrivate = skipped.filter((d) => !INFRASTRUCTURE.has(d)).sort();

// THE LOAD-BEARING DIRECTION. A directory the scan skips is a
// directory nothing checks for banned names, so it MUST NOT ship. The
// reverse is not a fault: the deploy withholding something the scan
// still reads only means the scan is stricter than it needs to be,
// which costs nothing and catches more.
//
// Asserting the two lists were identical was the first version of this
// check and it was wrong. It failed on scripts/ — withheld by the
// deploy, scanned by the scan — and the only ways to make it pass were
// to ship the build tooling or to stop scanning it. Both are worse
// than the difference.
check('EVERY directory the scan treats as private is refused by the deploy',
  scanPrivate.every((d) => deployPrivate.includes(d)),
  `unscanned but shipped: ${scanPrivate.filter((d) => !deployPrivate.includes(d)).join(', ') || 'none'}`);

// Three directories the deploy withholds while the scan still reads
// them, and all three are deliberate:
//
//   scripts/        build tooling.
//   publication/    the Press PDFs — three exceed Cloudflare's 25 MiB
//                   per-file limit and none is linked from any page.
//   .render-audit/  the screenshots tests/browser/pillar-audit.mjs
//                   writes. An instrument's output, not source: it is
//                   git-ignored, it is regenerated on every run, and it
//                   reaches tens of megabytes of PNG. Excluded here as
//                   well as ignored, because `wrangler pages deploy .`
//                   run by hand from a working tree does not consult
//                   .gitignore.
//
// The scan keeps reading all three, which costs nothing and catches
// more.
const stricter = deployPrivate.filter((d) => !scanPrivate.includes(d));
check('...and where the deploy is stricter, the difference is accounted for',
  stricter.every((d) => ['scripts', 'publication', '.render-audit'].includes(d)),
  `deploy withholds but scan reads: ${stricter.join(', ') || 'none'}`);
console.log(`      deploy withholds [${deployPrivate.join(', ')}] · scan skips [${scanPrivate.join(', ')}]`);

// ---------------------------------------------------------------------
// The document that made this urgent
// ---------------------------------------------------------------------
const BANNED_DOC = 'docs/org-chart-placeholders.md';
check('The banned placeholder chart still exists to be protected',
  existsSync(path.join(ROOT, BANNED_DOC)));
check('...and lives in a directory the deploy withholds',
  deployPrivate.includes(BANNED_DOC.split('/')[0]), BANNED_DOC);

// The faculty register is the opposite case and worth stating: it is
// internal too, and it holds twenty real people's names and stated
// qualifications. Whether or not it would be harmful public, it is not
// the published form — /faculty/ is — and it should not ship either.
check('The faculty register is withheld as well — the page is the published form, not the record',
  deployPrivate.includes('docs'));

// A guard that only ever inspects a compliant workflow proves nothing
// about its own reach. Confirm it catches the exact regression it was
// written for: the deploy going back to uploading the repository root.
{
  const regressed = workflow.replace(/wrangler pages deploy \.deploy/, 'wrangler pages deploy .');
  const caught = !/wrangler pages deploy \.deploy\b/.test(regressed);
  check('...and this check does catch a deploy reverted to the repository root', caught);
}
{
  const dropped = workflow.replace("--exclude='docs/' \\\n", '');
  const stillExcluded = [...dropped.matchAll(/--exclude='([^']+)\/'/g)].map((m) => m[1]);
  check('...and catches docs/ being dropped from the exclusion list',
    !stillExcluded.includes('docs'), stillExcluded.join(', '));
}

console.log(`\n${pass} passed, ${fail} failed.`);
process.exit(fail ? 1 : 0);
