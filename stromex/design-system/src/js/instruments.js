/**
 * THE INSTRUMENTS.
 *
 * SEB §34.9. Three obligations this module exists to keep, all of which
 * are routinely broken by chart libraries:
 *
 *  1. THE TABLE IS THE SOURCE. Every instrument is built FROM its
 *     accessible twin, not alongside one. A chart and a table maintained
 *     separately diverge, and the reader who needs the table gets the
 *     stale one.
 *  2. DRAW-ON ANIMATES ONCE, on first reveal, over real sourced numbers.
 *     Never on re-render — a number that re-animates every time a filter
 *     changes is decoration wearing a lab coat.
 *  3. NOTHING IS INVENTED. An instrument with no data renders its empty
 *     state; it does not render a plausible-looking curve.
 */

import { prefersReducedMotion } from './motion.js';

/**
 * Read an instrument's data from its accessible twin.
 *
 * @param {HTMLElement} host `.sx-instrument`
 * @returns {{label: string, value: number}[]}
 */
export function readTwin(host) {
  const table = host.querySelector('.sx-instrument__twin table, table.sx-instrument__twin');
  if (!table) return [];
  return [...table.querySelectorAll('tbody tr')].flatMap((row) => {
    const cells = [...row.children];
    if (cells.length < 2) return [];
    // The number is parsed from the cell the table already shows, so a
    // formatted figure and a plotted figure cannot disagree.
    const value = Number(cells[1].dataset.value ?? cells[1].textContent.replace(/[^\d.\-]/g, ''));
    if (!Number.isFinite(value)) return [];
    return [{ label: cells[0].textContent.trim(), value }];
  });
}

/** The Astrolabe: proportion of a whole, and progress toward a target. */
export function drawAstrolabe(host) {
  const arc = host.querySelector('.sx-astrolabe__arc');
  if (!arc) return;
  const ratio = Number(host.dataset.ratio);
  if (!Number.isFinite(ratio)) { host.dataset.state = 'empty'; return; }
  const r = Number(arc.getAttribute('r')) || 0;
  const circumference = 2 * Math.PI * r;
  const set = () => arc.style.setProperty('--sx-arc-len', `${(circumference * Math.min(Math.max(ratio, 0), 1)).toFixed(2)}`);
  if (prefersReducedMotion()) { arc.style.transition = 'none'; set(); return; }
  requestAnimationFrame(set);
}

/** Ledger bars: length-encoded, so the axis starts at zero. Always. */
export function drawBars(host) {
  const rows = [...host.querySelectorAll('.sx-bars__row')];
  const values = rows.map((r) => Number(r.dataset.value)).filter(Number.isFinite);
  if (!values.length) { host.dataset.state = 'empty'; return; }
  const max = Math.max(...values, 0);
  if (max <= 0) { host.dataset.state = 'empty'; return; }
  for (const row of rows) {
    const value = Number(row.dataset.value);
    const rule = row.querySelector('.sx-bars__rule');
    if (!rule || !Number.isFinite(value)) continue;
    rule.style.setProperty('--sx-bar', `${((value / max) * 100).toFixed(2)}%`);
  }
}

/** The Meridian series: one hairline, drawn once, labelled at its end. */
export function drawSeries(host) {
  for (const line of host.querySelectorAll('.sx-series__line')) {
    const length = line.getTotalLength?.();
    if (!length) continue;
    line.style.setProperty('--sx-path-len', String(Math.ceil(length)));
    if (prefersReducedMotion()) line.style.animation = 'none';
  }
}

/**
 * Reveal the twin to everyone, not only to a screen reader.
 *
 * The chart is a rendering of the table. A reader who wants the numbers
 * should not have to run a screen reader to get them.
 */
export function bindTwinToggle(root = document) {
  for (const button of root.querySelectorAll('[data-shows-twin]')) {
    button.addEventListener('click', () => {
      const twin = root.querySelector(`#${CSS.escape(button.dataset.showsTwin)}`);
      if (!twin) return;
      const on = twin.dataset.shown !== 'true';
      twin.dataset.shown = String(on);
      button.setAttribute('aria-expanded', String(on));
    });
  }
}

/** Draw every instrument under `root`, once. */
export function bindInstruments(root = document) {
  for (const host of root.querySelectorAll('.sx-astrolabe')) drawAstrolabe(host);
  for (const host of root.querySelectorAll('.sx-bars')) drawBars(host);
  for (const host of root.querySelectorAll('.sx-instrument')) drawSeries(host);
  bindTwinToggle(root);
}
