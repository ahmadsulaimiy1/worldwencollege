/**
 * THE CHRONOGRAPH — the shared movement.
 *
 * Every animated behaviour in the system reads its beat from here rather
 * than hard-coding a number, so the system has ONE movement that can be
 * retimed in one place. `gates/beat.mjs` fails the build on a duration
 * that is not a multiple of the beat.
 *
 * SEB §30.9.
 */

/** The base beat, in milliseconds. Every permitted duration is a multiple. */
export const BEAT = 240;

export const beat = {
  tick: BEAT / 8,
  quarter: BEAT / 4,
  half: BEAT / 2,
  one: BEAT,
  x2: BEAT * 2,
  x4: BEAT * 4,
  x8: BEAT * 8,
};

const reduced = globalThis.matchMedia?.('(prefers-reduced-motion: reduce)');

/**
 * True when the reader has asked for reduced motion.
 *
 * Read at call time, never cached at module load: a reader can change the
 * setting while the page is open, and a cached value would ignore them
 * until they reloaded — which is exactly the population least likely to
 * be willing to sit through a reload.
 */
export const prefersReducedMotion = () => Boolean(reduced?.matches);

/** Register a listener for changes to the reader's motion preference. */
export function onMotionPreferenceChange(fn) {
  reduced?.addEventListener('change', () => fn(prefersReducedMotion()));
}

/**
 * A frame-throttled callback bound to scroll.
 *
 * Scroll handlers that do layout work synchronously are the single
 * commonest cause of a page that feels expensive to build and cheap to
 * use. Everything scroll-bound in this system goes through here.
 */
export function onFrame(fn, { passive = true } = {}) {
  let queued = false;
  const run = () => {
    queued = false;
    fn();
  };
  const schedule = () => {
    if (queued) return;
    queued = true;
    requestAnimationFrame(run);
  };
  addEventListener('scroll', schedule, { passive });
  addEventListener('resize', schedule, { passive });
  schedule();
  return () => {
    removeEventListener('scroll', schedule);
    removeEventListener('resize', schedule);
  };
}

/**
 * Hysteresis — a dead band around a threshold.
 *
 * SEB §34.14 pattern 8: every scroll- or hover-triggered change has one.
 * Interfaces that flicker at a boundary feel cheap because they are: a
 * trackpad's overscroll oscillates across a bare threshold several times
 * a second, and the reader sees a header stuttering.
 *
 * @param {number} on   the value at which the state turns on
 * @param {number} band the width of the dead band; it turns off at on-band
 */
export function schmitt(on, band = 40) {
  let state = false;
  return (value) => {
    if (!state && value >= on) state = true;
    else if (state && value <= on - band) state = false;
    return state;
  };
}
