// Run with: node --experimental-sqlite tests/run.mjs   (or `npm test`)
//
// Runs every *.test.mjs file in this directory as its own subprocess
// (each one calls process.exit() itself, so they can't just be
// imported into one process) plus import-check.mjs, and reports a
// combined summary. A non-zero exit from any file fails the run.
import { readdirSync } from 'node:fs';
import { spawnSync } from 'node:child_process';
import path from 'node:path';
import { ROOT } from './helpers.mjs';

const testsDir = path.join(ROOT, 'tests');
const testFiles = readdirSync(testsDir).filter((f) => f.endsWith('.test.mjs')).sort();

const nodeArgs = process.execArgv.includes('--experimental-sqlite') ? [] : ['--experimental-sqlite'];

let failedFiles = 0;

console.log('=== import-check.mjs ===');
const importCheck = spawnSync(process.execPath, [path.join(testsDir, 'import-check.mjs')], { stdio: 'inherit' });
if (importCheck.status !== 0) failedFiles++;

for (const file of testFiles) {
  console.log(`\n=== ${file} ===`);
  const result = spawnSync(process.execPath, [...nodeArgs, '--no-warnings', path.join(testsDir, file)], { stdio: 'inherit' });
  if (result.status !== 0) failedFiles++;
}

console.log(`\n${failedFiles === 0 ? 'All test files passed.' : `${failedFiles} test file(s) failed.`}`);
process.exit(failedFiles ? 1 : 0);
