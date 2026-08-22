/**
 * THE STRIKE — the one sound.
 *
 * SEB §30.13. A struck-metal tone: ~1.2kHz fundamental, 180ms decay, at
 * −34 LUFS. It marks the COMPLETION OF A CONSEQUENTIAL ACT and nothing
 * else. Never on hover, navigation, notification, error or arrival.
 *
 * OFF BY DEFAULT. Enabled only by an explicit preference, and never
 * played when the reader has asked for reduced motion, until a dedicated
 * sound preference exists to ask separately.
 *
 * A product with a sound for everything has a sound for nothing.
 *
 * Synthesised rather than shipped as a file: one authored tone, no asset
 * to license, no request to make, and it is diffable.
 */

import { prefersReducedMotion } from './motion.js';

const FUNDAMENTAL = 1200;   // Hz
const DECAY = 0.18;         // seconds
const PEAK = 0.05;          // ≈ −34 LUFS at the default output gain

let enabled = false;
let context = null;

/** Enable the Strike. Requires an explicit act by the reader. */
export function enableStrike(on = true) {
  enabled = Boolean(on);
}

export function strikeEnabled() {
  return enabled;
}

/**
 * Sound the Strike. Silent unless explicitly enabled, and silent under
 * reduced motion regardless.
 *
 * @returns {boolean} whether it actually sounded — so a caller can tell
 *                    the difference between "played" and "suppressed"
 *                    rather than assuming.
 */
export function strike() {
  if (!enabled || prefersReducedMotion()) return false;
  const Ctx = globalThis.AudioContext ?? globalThis.webkitAudioContext;
  if (!Ctx) return false;

  context ??= new Ctx();
  const now = context.currentTime;

  // Struck metal is not a sine. Two inharmonic partials over the
  // fundamental give it the ring of a small bell rather than the beep of
  // a microwave; the ratios are inharmonic on purpose.
  const gain = context.createGain();
  gain.gain.setValueAtTime(PEAK, now);
  gain.gain.exponentialRampToValueAtTime(0.0001, now + DECAY);
  gain.connect(context.destination);

  for (const [ratio, level] of [[1, 1], [2.76, 0.34], [5.4, 0.12]]) {
    const osc = context.createOscillator();
    const partial = context.createGain();
    osc.frequency.value = FUNDAMENTAL * ratio;
    partial.gain.value = level;
    osc.connect(partial).connect(gain);
    osc.start(now);
    osc.stop(now + DECAY);
  }
  return true;
}
