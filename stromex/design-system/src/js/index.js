/**
 * THE STROMEX DESIGN LANGUAGE — the behaviour layer.
 *
 * One entry point. Everything is opt-in by markup: a page that does not
 * contain a Meridian binds no Meridian, and a page with no chapters gets
 * no rail rather than an empty one.
 *
 * Nothing here is required to READ a StromeX page. The CSS is complete on
 * its own: the reveal states resolve, the ledger stacks, the print form
 * prints, and every control works. This layer adds the instrument
 * behaviours on top. A design system whose content disappears without
 * JavaScript is a design system that fails the one reader it should have
 * been built for first.
 */

export { BEAT, beat, prefersReducedMotion, onMotionPreferenceChange, onFrame, schmitt } from './motion.js';
export { bindMeridian, bindReveal, bindParallax } from './meridian.js';
export { bindLintel, bindRegisterMenu } from './lintel.js';
export { bindRail } from './rail.js';
export { press, pressSeal, PRESS_FLOOR, PRESS_NAME_AT, PRESS_RECOURSE_AT } from './press.js';
export { bindIndex } from './search.js';
export { bindLedger } from './ledger.js';
export { bindInstruments, readTwin, drawAstrolabe, drawBars, drawSeries } from './instruments.js';
export { bindGround } from './ground.js';
export { strike, enableStrike, strikeEnabled } from './strike.js';

import { bindMeridian, bindReveal, bindParallax } from './meridian.js';
import { bindLintel, bindRegisterMenu } from './lintel.js';
import { bindRail } from './rail.js';
import { bindIndex } from './search.js';
import { bindLedger } from './ledger.js';
import { bindInstruments } from './instruments.js';
import { bindGround } from './ground.js';

/**
 * Bind everything a page declares.
 *
 * @param {ParentNode} root
 * @param {{ search?: (q: string) => Promise<any[]> }} [options]
 * @returns {() => void} a teardown, so a single-page application can
 *          unbind on navigation rather than accumulating scroll listeners
 *          until the page stutters.
 */
export function bindAll(root = document, options = {}) {
  const teardowns = [
    bindMeridian(root),
    bindParallax(root),
    bindLintel(root),
    bindRail(root),
    bindGround(root),
  ].filter((fn) => typeof fn === 'function');

  bindReveal(root);
  bindRegisterMenu(root);
  bindIndex(root, options);
  bindLedger(root);
  bindInstruments(root);

  return () => { for (const fn of teardowns) fn(); };
}
