/**
 * The guilloché, tested.
 *
 * The ornament is generated rather than sourced (SEB §30.11), and the
 * three properties that makes worth doing are the three tested here:
 * it is deterministic, it closes, and it is small enough to ship.
 */

import { test } from 'node:test';
import assert from 'node:assert/strict';
import { execFileSync } from 'node:child_process';
import { readFile, stat } from 'node:fs/promises';

const generator = new URL('../build/generate-guilloche.mjs', import.meta.url);
const ground = new URL('../src/art/guilloche.svg', import.meta.url);

test('re-running the generator produces a byte-identical file', async () => {
  const before = await readFile(ground, 'utf8');
  execFileSync(process.execPath, [generator.pathname], { stdio: 'pipe' });
  const after = await readFile(ground, 'utf8');
  assert.equal(after, before, 'the ornament is not deterministic — a diff would be noise, not a change');
});

test('every layer closes', async () => {
  const svg = await readFile(ground, 'utf8');
  const paths = [...svg.matchAll(/ d="(M[^"]+)"/g)].map((m) => m[1]);
  assert.ok(paths.length >= 5, 'expected the five-layer rosette');
  for (const d of paths) {
    assert.ok(d.endsWith('Z'), 'a guilloché that does not close has a visible seam');
  }
});

test('no two layers share a lobe count', async () => {
  const svg = await readFile(ground, 'utf8');
  const lobes = [...svg.matchAll(/(\d+) lobes/g)].map((m) => Number(m[1]));
  assert.equal(new Set(lobes).size, lobes.length, 'layers sharing a lobe count superimpose into one thicker line');
});

test('the ground is small enough to ship as a background', async () => {
  const { size } = await stat(ground);
  // The first version of the generator sampled per turn instead of per
  // lobe and emitted 2.1MB. This is the regression test for that.
  assert.ok(size < 200 * 1024, `the ornament is ${(size / 1024).toFixed(0)}kB — a background ornament over 200kB is a payload`);
});
