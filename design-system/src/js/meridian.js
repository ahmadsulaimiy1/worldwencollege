/**
 * THE MERIDIAN NODE and the reveal.
 *
 * SEB §30.2, §34.14 pattern 1. The node is a specular point tracking the
 * reader's vertical centre on the spine — the only element on the page
 * bound to scroll position, and the reason a StromeX page reads as an
 * instrument being read rather than a page being scrolled.
 */

import { onFrame, onMotionPreferenceChange, prefersReducedMotion } from './motion.js';

/**
 * Bind the node to the reader's vertical centre within its host.
 *
 * @param {ParentNode} root
 */
export function bindMeridian(root = document) {
  const hosts = root.querySelectorAll('.sx-meridian-host');
  if (!hosts.length) return () => {};

  const paint = () => {
    if (prefersReducedMotion()) return;   // the node is display:none under reduce
    const centre = scrollY + innerHeight / 2;
    for (const host of hosts) {
      const node = host.querySelector('.sx-meridian__node');
      if (!node) continue;
      const box = host.getBoundingClientRect();
      const top = box.top + scrollY;
      // Clamped to the host, so the node never floats past the spine it
      // belongs to and never appears above a section it has not reached.
      const within = Math.min(Math.max(centre - top, 0), box.height);
      node.style.setProperty('--sx-node-top', `${within}px`);
    }
  };

  const stop = onFrame(paint);
  onMotionPreferenceChange(paint);
  return stop;
}

/**
 * Reveal on arrival — `.sx-rise` and `.sx-draw`.
 *
 * IntersectionObserver, once per element, then unobserved: a reveal that
 * re-runs when a reader scrolls back up is an animation performing at
 * them rather than a page responding to them.
 *
 * Under reduced motion the elements are resolved to their FINISHED state
 * immediately — CSS already does this, and this function must not undo
 * it by waiting for an intersection that a reader may never trigger.
 */
export function bindReveal(root = document) {
  const targets = root.querySelectorAll('.sx-rise, .sx-draw');
  if (!targets.length) return;

  if (prefersReducedMotion() || !('IntersectionObserver' in globalThis)) {
    for (const el of targets) el.classList.add('is-revealed');
    return;
  }

  const io = new IntersectionObserver(
    (entries) => {
      for (const entry of entries) {
        if (!entry.isIntersecting) continue;
        entry.target.classList.add('is-revealed');
        io.unobserve(entry.target);
      }
    },
    // A margin, so the element is already settled by the time the reader's
    // eye reaches it. Revealing at the exact edge means the reader watches
    // the animation instead of reading the content.
    { rootMargin: '0px 0px -12% 0px', threshold: 0.1 },
  );
  for (const el of targets) io.observe(el);
}

/**
 * Parallax — imperceptible per element, cumulative per page.
 *
 * Parallax a reader can SEE is a gimmick; parallax they can only feel is
 * craft. The rates come from the stratum tokens, so an element's depth in
 * the model and its rate of travel cannot disagree.
 */
export function bindParallax(root = document) {
  const layers = [...root.querySelectorAll('.sx-parallax')];
  if (!layers.length) return () => {};

  const paint = () => {
    if (prefersReducedMotion()) return;
    const centre = innerHeight / 2;
    for (const layer of layers) {
      const rate = Number(layer.dataset.rate ?? 0.04);
      const box = layer.getBoundingClientRect();
      const offset = (box.top + box.height / 2 - centre) * rate;
      layer.style.setProperty('--sx-shift', `${offset.toFixed(2)}px`);
    }
  };

  return onFrame(paint);
}
