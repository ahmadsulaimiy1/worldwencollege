// Run with: node tests/import-check.mjs
// Syntax + ES-module import-resolution check for every .js file under
// functions/ — every `import` path actually resolves to an existing
// file/export, not just a syntax check. Auto-discovers files (rather
// than a hand-maintained list) so a new file under functions/ is
// covered automatically, not silently skipped.
import { readdirSync, statSync } from 'node:fs';
import path from 'node:path';
import { ROOT } from './helpers.mjs';

function findJsFiles(dir) {
  const out = [];
  for (const entry of readdirSync(dir)) {
    const full = path.join(dir, entry);
    if (statSync(full).isDirectory()) out.push(...findJsFiles(full));
    else if (entry.endsWith('.js')) out.push(full);
  }
  return out;
}

const files = findJsFiles(path.join(ROOT, 'functions')).sort();
let failed = 0;

for (const f of files) {
  const rel = path.relative(ROOT, f);
  try {
    await import('file://' + f);
    console.log('OK  ', rel);
  } catch (e) {
    console.log('FAIL', rel, '->', e.message);
    failed++;
  }
}

console.log(`\nChecked ${files.length} files.`);
console.log(failed === 0 ? 'All modules import cleanly.' : `${failed} module(s) failed to import.`);
process.exit(failed ? 1 : 0);
