/**
 * The contrast arithmetic, tested against known values.
 *
 * A gate is only as trustworthy as its measurement. If `contrast()` were
 * wrong, gates/contrast.mjs would report a palette as accessible with
 * complete confidence, and everyone would believe it — which is worse
 * than having no gate, because nobody would look again.
 */

import { test } from 'node:test';
import assert from 'node:assert/strict';
import { contrast, luminance, hexToRgb, palette } from '../gates/lib.mjs';

test('the anchors: black on white is 21:1, and a colour on itself is 1:1', () => {
  assert.equal(contrast('#000000', '#FFFFFF'), 21);
  assert.equal(contrast('#FFFFFF', '#FFFFFF'), 1);
  assert.equal(contrast('#C8A24C', '#C8A24C'), 1);
});

test('contrast is symmetric', () => {
  assert.equal(contrast('#0B0C10', '#F6F4EF'), contrast('#F6F4EF', '#0B0C10'));
});

test('luminance matches the WCAG reference points', () => {
  assert.equal(Math.round(luminance(hexToRgb('#FFFFFF')) * 1000) / 1000, 1);
  assert.equal(luminance(hexToRgb('#000000')), 0);
  // #808080 — the standard worked example, 0.2158.
  assert.equal(Math.round(luminance(hexToRgb('#808080')) * 10000) / 10000, 0.2159);
});

test('three-digit hex expands', () => {
  assert.deepEqual(hexToRgb('#fff'), [255, 255, 255]);
  assert.equal(contrast('#000', '#fff'), 21);
});

test('the palette resolves var() chains rather than skipping them', async () => {
  const { ceremonial, reading } = await palette();
  // --sx-metal-text is `var(--sx-aurum-lit)` in one register and
  // `var(--sx-brass-deep)` in the other. A resolver that only read hex
  // literals would silently check neither.
  assert.match(ceremonial.get('--sx-metal-text'), /^#[0-9A-F]{6}$/i);
  assert.match(reading.get('--sx-metal-text'), /^#[0-9A-F]{6}$/i);
  assert.notEqual(ceremonial.get('--sx-metal-text'), reading.get('--sx-metal-text'),
    'the two registers resolve metal text to the same colour — one of them cannot be legible');
});

test('the reading register really is a different palette', async () => {
  const { ceremonial, reading } = await palette();
  assert.notEqual(ceremonial.get('--sx-bg'), reading.get('--sx-bg'));
  assert.notEqual(ceremonial.get('--sx-fg'), reading.get('--sx-fg'));
  assert.notEqual(ceremonial.get('--sx-boundary'), reading.get('--sx-boundary'));
});

test('the defects the gate was written to catch are actually below AA', async () => {
  const { ceremonial } = await palette();
  const obsidian = ceremonial.get('--sx-bg');
  // These are the base pigments. They are kept in the palette as the
  // institution's colours and are NOT used as foregrounds on obsidian —
  // this test records why.
  assert.ok(contrast(ceremonial.get('--sx-lapis'), obsidian) < 3,
    'if base lapis now clears 3:1 on obsidian the palette changed; re-derive --sx-lapis-lit rather than deleting it');
  assert.ok(contrast(ceremonial.get('--sx-carnelian'), obsidian) < 4.5);
  assert.ok(contrast(ceremonial.get('--sx-verdigris'), obsidian) < 4.5);
});
