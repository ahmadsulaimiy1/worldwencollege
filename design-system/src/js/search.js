/**
 * THE INDEX — search.
 *
 * SEB §34.6. Invoked by `/` and by ⌘K / Ctrl-K, opening as a crown plate
 * on a dimmed plinth at the Meridian, occupying the measure.
 *
 * Keyboard-complete: ↑↓ move, ↵ opens, ⌘↵ opens in a new context, Esc
 * closes and RESTORES FOCUS TO THE INVOKER. Focus restoration is not
 * optional — losing focus on close strands a keyboard user.
 */

import { beat } from './motion.js';

const DEBOUNCE = beat.half;   // one beat/2 — SEB §34.6

export function bindIndex(root = document, { search } = {}) {
  const index = root.querySelector('.sx-index');
  if (!index) return;

  const query = index.querySelector('.sx-index__query');
  const results = index.querySelector('.sx-index__results');
  let invoker = null;
  let cursor = 0;
  let timer = null;

  const open = () => {
    invoker = document.activeElement;
    index.dataset.open = 'true';
    query?.focus();
    query?.select?.();
  };

  const close = () => {
    if (index.dataset.open !== 'true') return;
    delete index.dataset.open;
    // Focus restoration. Not optional.
    (invoker instanceof HTMLElement ? invoker : document.body).focus();
  };

  const rows = () => [...(results?.querySelectorAll('.sx-index__result') ?? [])];

  const mark = () => {
    rows().forEach((row, i) => {
      const on = i === cursor;
      row.setAttribute('aria-selected', String(on));
      // The row scrolls into view without moving the page, so results
      // never reflow under the pointer.
      if (on) row.scrollIntoView({ block: 'nearest' });
    });
  };

  addEventListener('keydown', (e) => {
    const typing = /^(input|textarea|select)$/i.test(document.activeElement?.tagName ?? '')
      || document.activeElement?.isContentEditable;

    if ((e.key === 'k' || e.key === 'K') && (e.metaKey || e.ctrlKey)) {
      e.preventDefault();
      open();
      return;
    }
    // `/` opens ONLY when the reader is not typing into something. A
    // slash key that hijacks a form field is the fastest way to make a
    // search shortcut hated.
    if (e.key === '/' && !typing && index.dataset.open !== 'true') {
      e.preventDefault();
      open();
      return;
    }
    if (index.dataset.open !== 'true') return;

    if (e.key === 'Escape') { e.preventDefault(); close(); }
    else if (e.key === 'ArrowDown') { e.preventDefault(); cursor = Math.min(cursor + 1, rows().length - 1); mark(); }
    else if (e.key === 'ArrowUp') { e.preventDefault(); cursor = Math.max(cursor - 1, 0); mark(); }
    else if (e.key === 'Enter') {
      const row = rows()[cursor];
      if (!row) return;
      e.preventDefault();
      row.dispatchEvent(new CustomEvent('sx:open', { bubbles: true, detail: { newContext: e.metaKey || e.ctrlKey } }));
      close();
    }
  });

  index.querySelector('.sx-index__plinth')?.addEventListener('click', close);

  if (query && typeof search === 'function') {
    query.addEventListener('input', () => {
      clearTimeout(timer);
      timer = setTimeout(async () => {
        cursor = 0;
        const found = await search(query.value);
        render(results, found, query.value);
        mark();
      }, DEBOUNCE);
    });
  }

  return { open, close };
}

/**
 * Results are a LEDGER — type · title · context · the matched fragment,
 * with the match set in aurum-lit. Not a list of cards, which turns a
 * scan into a read.
 */
function render(results, found, term) {
  if (!results) return;
  if (!found?.length) {
    // The empty state carries the three most useful things you could ask
    // for, supplied by the caller — never the words "no results", which
    // tell the reader something they already know.
    results.replaceChildren(Object.assign(document.createElement('div'), {
      className: 'sx-index__empty',
      textContent: results.dataset.emptyCopy ?? '',
    }));
    return;
  }
  const frag = document.createDocumentFragment();
  let group = null;
  for (const item of found) {
    if (item.kind !== group) {
      group = item.kind;
      frag.append(Object.assign(document.createElement('div'), {
        className: 'sx-index__group',
        textContent: group,
      }));
    }
    const row = document.createElement('button');
    row.type = 'button';
    row.className = 'sx-index__result';
    row.setAttribute('role', 'option');
    row.append(
      Object.assign(document.createElement('span'), { className: 'sx-marginalia', textContent: item.kind }),
      highlight(item.title, term),
      Object.assign(document.createElement('span'), { className: 'sx-marginalia', textContent: item.context ?? '' }),
    );
    frag.append(row);
  }
  results.replaceChildren(frag);
}

/**
 * The match, marked. Built with text nodes rather than innerHTML: a
 * search result is the one place on a site where attacker-controlled text
 * is most likely to arrive, and interpolating it into markup is how that
 * becomes an injection.
 */
function highlight(text, term) {
  const span = document.createElement('span');
  const at = term ? text.toLowerCase().indexOf(term.toLowerCase()) : -1;
  if (at < 0) {
    span.textContent = text;
    return span;
  }
  span.append(
    text.slice(0, at),
    Object.assign(document.createElement('mark'), {
      className: 'sx-index__match',
      textContent: text.slice(at, at + term.length),
    }),
    text.slice(at + term.length),
  );
  return span;
}
