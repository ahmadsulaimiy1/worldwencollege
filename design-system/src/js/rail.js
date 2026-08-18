/**
 * THE RAIL — the chapter rail.
 *
 * SEB §30.10 #8: GENERATED from `[data-chapter]`, so it cannot fall out
 * of step with the page. A hand-written index of a page's own sections is
 * a second source of truth that goes stale the first time somebody
 * renames a heading.
 *
 * It also inverts over light chapters, read from each section's own
 * `data-register`.
 */

import { onFrame, prefersReducedMotion } from './motion.js';

export function bindRail(root = document) {
  const rail = root.querySelector('.sx-rail');
  if (!rail) return () => {};

  const chapters = [...root.querySelectorAll('[data-chapter]')];
  if (!chapters.length) {
    rail.hidden = true;               // no chapters, no rail — not an empty rail
    return () => {};
  }

  rail.replaceChildren(
    ...chapters.map((section, i) => {
      const station = document.createElement('button');
      station.type = 'button';
      station.className = 'sx-rail__station';
      // The accessible name carries the number AND the title; a rail that
      // announces "1, 2, 3" to a screen reader is a rail only a sighted
      // reader can use.
      const label = section.dataset.chapter || section.querySelector('.sx-chapter')?.textContent?.trim() || `Chapter ${i + 1}`;
      station.append(String(i + 1).padStart(2, '0'), ' ', label);
      station.setAttribute('aria-label', label);
      station.addEventListener('click', () => {
        section.scrollIntoView({
          behavior: prefersReducedMotion() ? 'auto' : 'smooth',
          block: 'start',
        });
        // Focus follows the scroll, or a keyboard reader has moved the
        // viewport and not themselves.
        section.setAttribute('tabindex', '-1');
        section.focus({ preventScroll: true });
      });
      return station;
    }),
  );

  const stations = [...rail.children];

  return onFrame(() => {
    const line = innerHeight * 0.38;         // the minor golden section
    let current = 0;
    chapters.forEach((section, i) => {
      if (section.getBoundingClientRect().top <= line) current = i;
    });
    stations.forEach((s, i) => {
      if (i === current) s.setAttribute('aria-current', 'true');
      else s.removeAttribute('aria-current');
    });
    const register = chapters[current]?.dataset.register;
    if (register) rail.dataset.over = register;
    else delete rail.dataset.over;
  });
}
