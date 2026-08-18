/**
 * The Press, tested — the three thresholds.
 *
 * SEB §34.11 specifies them precisely and almost every implementation of
 * a loading state gets the FIRST one wrong: showing the indicator
 * immediately. A flash of loading state on a 40ms operation is worse than
 * a pause, because the reader sees a flicker and cannot tell what
 * happened. It is also invisible in testing on a fast connection, which
 * is why it is asserted here rather than looked at.
 */

import { test, mock } from 'node:test';
import assert from 'node:assert/strict';
import { press, pressSeal, PRESS_FLOOR, PRESS_NAME_AT, PRESS_RECOURSE_AT } from '../src/js/press.js';

/** The smallest thing that behaves like the element the Press drives. */
function host() {
  const parts = {
    '.sx-press__operation': { textContent: '' },
    '.sx-press__recourse': { textContent: '' },
  };
  const attrs = new Map();
  return {
    dataset: {},
    parts,
    attrs,
    querySelector: (sel) => parts[sel] ?? null,
    setAttribute: (k, v) => attrs.set(k, v),
    removeAttribute: (k) => attrs.delete(k),
  };
}

test('the thresholds are the ones the Bible specifies', () => {
  assert.equal(PRESS_FLOOR, 240);
  assert.equal(PRESS_NAME_AT, 2000);
  assert.equal(PRESS_RECOURSE_AT, 8000);
});

test('under 240ms the Press never appears', async (t) => {
  t.mock.timers.enable({ apis: ['setTimeout'] });
  const el = host();
  let resolve;
  const work = new Promise((r) => { resolve = r; });

  const running = press(el, () => work, { operation: 'Reading the register' });
  t.mock.timers.tick(200);
  assert.equal(el.dataset.state, undefined, 'the Press appeared inside the floor — a 200ms operation would flicker');
  resolve('done');
  assert.equal(await running, 'done');
  assert.equal(el.dataset.state, undefined);
  assert.equal(el.attrs.has('aria-busy'), false);
});

test('between 240ms and 2s the Press shows, unnamed', async (t) => {
  t.mock.timers.enable({ apis: ['setTimeout'] });
  const el = host();
  let resolve;
  const running = press(el, () => new Promise((r) => { resolve = r; }), { operation: 'Reading the register' });

  t.mock.timers.tick(PRESS_FLOOR);
  assert.equal(el.dataset.state, 'loading');
  assert.equal(el.attrs.get('aria-busy'), 'true', 'a loading region that does not announce itself is invisible to a screen reader');
  assert.equal(el.parts['.sx-press__operation'].textContent, '', 'the operation was named too early');

  resolve(null);
  await running;
});

test('past 2s the operation is NAMED, and past 8s it offers recourse', async (t) => {
  t.mock.timers.enable({ apis: ['setTimeout'] });
  const el = host();
  let resolve;
  const running = press(el, () => new Promise((r) => { resolve = r; }), {
    operation: 'Reading the register',
    recourse: 'If this does not finish, the register is reachable directly.',
  });

  t.mock.timers.tick(PRESS_NAME_AT);
  assert.equal(el.parts['.sx-press__operation'].textContent, 'Reading the register',
    'past two seconds a Press with no name is a spinner with better manners');
  assert.equal(el.dataset.elapsed, undefined);

  t.mock.timers.tick(PRESS_RECOURSE_AT - PRESS_NAME_AT);
  assert.equal(el.dataset.elapsed, 'long');
  assert.match(el.parts['.sx-press__recourse'].textContent, /reachable directly/);

  resolve(null);
  await running;
  assert.equal(el.dataset.elapsed, undefined, 'the long-elapsed state outlived the operation');
});

test('a failing operation still tears the Press down, and still throws', async (t) => {
  t.mock.timers.enable({ apis: ['setTimeout'] });
  const el = host();
  const running = press(el, async () => { throw new Error('refused'); });
  t.mock.timers.tick(PRESS_FLOOR);

  await assert.rejects(running, /refused/);
  assert.equal(el.dataset.state, undefined, 'a failed operation left the page loading forever');
  assert.equal(el.attrs.has('aria-busy'), false);
});

test('the Seal is pressed once, and says so', () => {
  const seal = { dataset: {} };

  assert.equal(pressSeal(seal), true, 'the first press did not take');
  assert.equal(seal.dataset.pressed, 'true');

  // The second call is the one that matters: a component that re-renders
  // must not re-press. The Strike is bound to this return value, so a
  // seal that reported `true` twice would sound twice for one act.
  assert.equal(pressSeal(seal), false, 'the Seal pressed twice — a stamp somebody is leaning on');
  assert.equal(pressSeal(seal), false);
});

test('the Seal refuses anything that is not an element, without throwing', () => {
  for (const nothing of [null, undefined, 'not an element', 42, {}]) {
    assert.equal(pressSeal(nothing), false, `pressSeal(${JSON.stringify(nothing)}) should refuse`);
  }
});
