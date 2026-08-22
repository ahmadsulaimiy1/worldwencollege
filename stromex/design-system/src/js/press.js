/**
 * THE PRESS — the loading state.
 *
 * SEB §34.11. No spinners, no skeletons. A skeleton is a lie about layout
 * that resolves into a different layout.
 *
 * The three thresholds are the whole design, and they are the part every
 * implementation gets wrong:
 *
 *   under 240ms  show NOTHING. A flash of loading state is worse than a
 *                pause — the reader sees a flicker and cannot tell what
 *                happened.
 *   240ms – 2s   the Press.
 *   over 2s      the Press plus the operation's NAME — "Reading the
 *                register", not "Loading…".
 *   over 8s      plus what to do if it does not finish.
 */

import { beat } from './motion.js';

export const PRESS_FLOOR = beat.one;      // 240ms — below this, nothing
export const PRESS_NAME_AT = 2000;
export const PRESS_RECOURSE_AT = 8000;

/**
 * Run an async operation behind the Press.
 *
 * @param {HTMLElement} host      the `.sx-press` element
 * @param {() => Promise<any>} work
 * @param {{ operation?: string, recourse?: string }} [copy]
 *        `operation` NAMES what is happening. A press with no name past
 *        two seconds is a spinner with better manners.
 */
export async function press(host, work, copy = {}) {
  const timers = [];
  let shown = false;

  timers.push(
    setTimeout(() => {
      shown = true;
      host.dataset.state = 'loading';
      host.setAttribute('aria-busy', 'true');
    }, PRESS_FLOOR),
  );

  if (copy.operation) {
    timers.push(
      setTimeout(() => {
        const el = host.querySelector('.sx-press__operation');
        if (el) el.textContent = copy.operation;
      }, PRESS_NAME_AT),
    );
  }

  if (copy.recourse) {
    timers.push(
      setTimeout(() => {
        host.dataset.elapsed = 'long';
        const el = host.querySelector('.sx-press__recourse');
        if (el) el.textContent = copy.recourse;
      }, PRESS_RECOURSE_AT),
    );
  }

  try {
    return await work();
  } finally {
    for (const t of timers) clearTimeout(t);
    delete host.dataset.elapsed;
    host.removeAttribute('aria-busy');
    if (shown) delete host.dataset.state;
  }
}

/**
 * The Seal, pressed once, at a threshold.
 *
 * SEB §30.10 #7 and §34.11: consequential acts — a certificate issued, a
 * payment settled, a deployment verified — get the Seal, and are the only
 * place the Strike may sound. It is pressed ONCE. A seal that re-presses
 * on every render is a stamp somebody is leaning on.
 *
 * @returns {boolean} whether this call pressed it — so a caller can sound
 *          the Strike on the press and not on the re-render.
 */
export function pressSeal(seal) {
  // Duck-typed rather than `instanceof HTMLElement`: the guard exists to
  // avoid throwing on a missing element, and an instanceof check against
  // a global that does not exist outside a browser makes the function
  // untestable without one — which is how a one-line function ends up
  // unverified.
  if (!seal || typeof seal !== 'object' || !seal.dataset) return false;
  if (seal.dataset.pressed === 'true') return false;
  seal.dataset.pressed = 'true';
  return true;
}
