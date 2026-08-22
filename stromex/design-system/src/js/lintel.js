/**
 * THE LINTEL and THE KEYSTONE.
 *
 * SEB §34.7: on scroll past 90px the Lintel condenses into the Keystone
 * over one beat on `escapement`, WITH 40px OF HYSTERESIS so a trackpad
 * overscroll cannot make it flicker.
 */

import { onFrame, schmitt } from './motion.js';

export function bindLintel(root = document) {
  const lintel = root.querySelector('.sx-lintel');
  const keystone = root.querySelector('.sx-keystone');
  if (!lintel && !keystone) return () => {};

  const condensed = schmitt(90, 40);

  return onFrame(() => {
    const state = condensed(scrollY);
    lintel?.setAttribute('data-condensed', String(state));
    keystone?.setAttribute('data-shown', String(state));
  });
}

/**
 * The Register menu. One level deep, opening as a crown plate on a
 * plinth, `display:none` until opened.
 *
 * The focus contract is the whole point of writing this rather than
 * reaching for a details/summary: focus moves INTO the sheet on open and
 * is RESTORED to the invoker on close. Losing focus on close strands a
 * keyboard user at the top of the document with no idea where they are.
 */
export function bindRegisterMenu(root = document) {
  const menu = root.querySelector('.sx-register-menu');
  const trigger = root.querySelector('[data-opens="register-menu"]');
  if (!menu || !trigger) return;

  let invoker = null;

  const open = () => {
    invoker = document.activeElement;
    menu.dataset.open = 'true';
    trigger.setAttribute('aria-expanded', 'true');
    menu.querySelector('a, button, [tabindex]')?.focus();
    document.documentElement.style.overflow = 'hidden';
  };

  const close = () => {
    if (menu.dataset.open !== 'true') return;
    delete menu.dataset.open;
    trigger.setAttribute('aria-expanded', 'false');
    document.documentElement.style.overflow = '';
    (invoker instanceof HTMLElement ? invoker : trigger).focus();
  };

  trigger.addEventListener('click', () => (menu.dataset.open === 'true' ? close() : open()));
  menu.querySelector('.sx-register-menu__plinth')?.addEventListener('click', close);
  addEventListener('keydown', (e) => {
    if (e.key === 'Escape') close();
  });
}
