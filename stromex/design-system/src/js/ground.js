/**
 * THE GROUND — the live guilloché.
 *
 * SEB §30.11. The rosette's phase advances with pointer distance at 0.5%
 * amplitude: no reader consciously sees it, the page is imperceptibly
 * alive, and nothing on it is visibly moving.
 *
 * Removed entirely under reduced motion — by the stylesheet, and by this
 * module declining to bind at all, so there is no listener running for a
 * reader who asked for stillness.
 */

import { prefersReducedMotion } from './motion.js';

export function bindGround(root = document) {
  if (prefersReducedMotion()) return () => {};
  const grounds = [...root.querySelectorAll('.sx-guilloche')];
  if (!grounds.length) return () => {};

  let queued = false;
  let x = 0;
  let y = 0;

  const paint = () => {
    queued = false;
    for (const ground of grounds) {
      const box = ground.getBoundingClientRect();
      const dx = (x - (box.left + box.width / 2)) / innerWidth;
      const dy = (y - (box.top + box.height / 2)) / innerHeight;
      // Phase in the range ±1, scaled to 0.5deg by the stylesheet. The
      // amplitude lives in CSS so it is auditable by the gate rather than
      // buried in a script.
      ground.style.setProperty('--sx-ground-phase', (dx + dy).toFixed(3));
    }
  };

  const onMove = (e) => {
    x = e.clientX;
    y = e.clientY;
    if (queued) return;
    queued = true;
    requestAnimationFrame(paint);
  };

  addEventListener('pointermove', onMove, { passive: true });
  return () => removeEventListener('pointermove', onMove);
}
