#!/usr/bin/env node
/* Everything CI runs, in one command.
 *
 * WHY THIS EXISTS. `npm test` runs tests/run.mjs, which auto-discovers
 * tests/*.test.mjs — and does NOT run tests/browser/, which CI executes
 * as ten further steps. So "the suite passes" meant one thing locally
 * and a larger thing in CI, and the gap was invisible from the local
 * side: nothing printed to say that ten suites had not been run.
 *
 * It cost a real failure. The graduation audit (migration 028) made a
 * passed audit a precondition for conferral; tests/browser/lab-server.mjs
 * confers demonstration awards; the local suite was green and CI failed
 * three times before anybody looked.
 *
 * The fix is not to remember. It is for one command to mean everything,
 * and for the list of steps to be READ FROM THE WORKFLOW rather than
 * copied from it — a hand-maintained second list would drift from the
 * first, which is the same defect one level up.
 */
import { readFileSync } from 'node:fs';
import { spawnSync } from 'node:child_process';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const WORKFLOW = path.join(ROOT, '.github/workflows/deploy-cloudflare.yml');

// Take the verify job's commands from the workflow itself. A step added
// there is picked up here without anybody editing this file.
//
// `npm ci` and `playwright install` are skipped: they provision the
// runner, and a local machine already has both. Everything that ASSERTS
// something is run. `npm test` is included and is the reason the first
// version of this file was wrong — it looked only for `node ...` and
// silently dropped the backend suite, which is the same class of gap
// this script exists to close.
const wf = readFileSync(WORKFLOW, 'utf8');
const verifyJob = wf.slice(wf.indexOf('  verify:'), wf.indexOf('\n  deploy:'));
const PROVISIONING = /^(npm ci|npx playwright install)/;
const steps = [...verifyJob.matchAll(/^\s+-?\s*run: ((?:node|npm|npx) .+)$/gm)]
  .map((m) => m[1].trim())
  .filter((cmd) => !PROVISIONING.test(cmd));

if (!steps.length) {
  console.error('No `run: node ...` steps found in the workflow verify job. '
    + 'Either the workflow moved or its shape changed — fix this rather than skipping it.');
  process.exit(1);
}

console.log(`Running ${steps.length} verification step(s), read from the workflow.\n`);

let failed = 0;
for (const cmd of steps) {
  const label = cmd.replace(/^node (--\S+ )*/, '');
  process.stdout.write(`── ${label} `.padEnd(72, '─') + '\n');
  const [bin, ...args] = cmd.split(/\s+/);
  const res = spawnSync(bin, args, { cwd: ROOT, stdio: 'inherit' });
  if (res.status !== 0) {
    failed += 1;
    console.log(`\n✗ FAILED: ${cmd}\n`);
  }
}

console.log('\n' + '═'.repeat(72));
console.log(failed === 0
  ? `All ${steps.length} verification steps passed.`
  : `${failed} of ${steps.length} verification steps FAILED.`);
process.exit(failed ? 1 : 0);
