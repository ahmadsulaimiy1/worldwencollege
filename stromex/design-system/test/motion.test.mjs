/**
 * The Chronograph, tested.
 *
 * The hysteresis test is the one that matters. A dead band is invisible
 * in a screenshot and obvious in the hand — a header that stutters when a
 * trackpad overscrolls the boundary is the difference between an
 * interface that feels machined and one that feels cheap. It is also the
 * kind of thing that gets "simplified" back to a bare threshold by
 * somebody who cannot see what it was for.
 */

import { test } from 'node:test';
import assert from 'node:assert/strict';
import { BEAT, beat, schmitt } from '../src/js/motion.js';

test('the beat is 240ms and every named duration is a multiple of the tick', () => {
  assert.equal(BEAT, 240);
  const tick = BEAT / 8;
  for (const [name, ms] of Object.entries(beat)) {
    assert.equal(ms % tick, 0, `${name} (${ms}ms) is not a multiple of the ${tick}ms tick`);
  }
});

test('the beat ladder is exactly the tokens in tokens.css', async () => {
  const { readFile } = await import('node:fs/promises');
  const css = await readFile(new URL('../src/tokens.css', import.meta.url), 'utf8');
  for (const [token, ms] of [
    ['--sx-tick', beat.tick], ['--sx-beat-4', beat.quarter], ['--sx-beat-2', beat.half],
    ['--sx-beat', beat.one], ['--sx-beat-x2', beat.x2], ['--sx-beat-x4', beat.x4], ['--sx-beat-x8', beat.x8],
  ]) {
    assert.match(css, new RegExp(`${token}:\\s*${ms}ms`), `${token} in tokens.css disagrees with src/js/motion.js`);
  }
});

test('schmitt: turns on at the threshold, and stays on inside the dead band', () => {
  const condensed = schmitt(90, 40);

  assert.equal(condensed(0), false);
  assert.equal(condensed(89), false, 'below the threshold, off');
  assert.equal(condensed(90), true, 'at the threshold, on');

  // The whole point: coming back DOWN, it does not turn off at 89.
  assert.equal(condensed(89), true, 'inside the dead band, still on');
  assert.equal(condensed(51), true, 'still inside the dead band');
  assert.equal(condensed(50), false, 'at threshold minus band, off');
  assert.equal(condensed(89), false, 'and it does not re-arm until the threshold');
  assert.equal(condensed(90), true);
});

test('schmitt: an oscillation across the threshold produces ONE change, not eight', () => {
  const condensed = schmitt(90, 40);
  const trace = [];
  // A trackpad overscroll: the scroll position bounces around 90px.
  for (const y of [88, 91, 87, 92, 89, 93, 86, 94]) trace.push(condensed(y));

  const changes = trace.filter((v, i) => i > 0 && v !== trace[i - 1]).length;
  assert.equal(changes, 1, 'the header changed state more than once crossing the boundary — it would flicker');
  assert.deepEqual(trace, [false, true, true, true, true, true, true, true]);

  // Without the band, the same trace flips on every sample. This is the
  // comparison the test exists to make.
  const bare = schmitt(90, 0);
  const bareTrace = [88, 91, 87, 92, 89, 93, 86, 94].map(bare);
  const bareChanges = bareTrace.filter((v, i) => i > 0 && v !== bareTrace[i - 1]).length;
  assert.equal(bareChanges, 7, 'a bare threshold should flip on every sample — if it does not, the test is not testing anything');
});

test('schmitt: the default band is 40px, as SEB §34.7 specifies', () => {
  const condensed = schmitt(90);
  condensed(90);
  assert.equal(condensed(51), true);
  assert.equal(condensed(50), false);
});
