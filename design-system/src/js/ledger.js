/**
 * THE LEDGER.
 *
 * SEB §34.4. Two behaviours the CSS cannot express on its own:
 *
 *  1. Below 720px a ledger becomes a stack of dockets, and each cell needs
 *     its column's label. Copying them from the head means the labels
 *     cannot drift from the head, which hand-authored `data-label`
 *     attributes always eventually do.
 *  2. Sort is a STATE ON THE COLUMN, expressed as `aria-sort` — which is
 *     both the styling hook and the accessible announcement, so they
 *     cannot disagree.
 */

export function bindLedger(root = document) {
  for (const table of root.querySelectorAll('.sx-ledger')) {
    labelCells(table);
    bindSort(table);
  }
}

function labelCells(table) {
  const heads = [...table.querySelectorAll('thead th')].map((th) => th.textContent.trim());
  if (!heads.length) return;
  for (const row of table.querySelectorAll('tbody tr')) {
    [...row.children].forEach((cell, i) => {
      if (heads[i] && !cell.dataset.label) cell.dataset.label = heads[i];
    });
  }
}

function bindSort(table) {
  const heads = [...table.querySelectorAll('thead th[aria-sort]')];
  for (const th of heads) {
    th.tabIndex = 0;
    const act = () => {
      const next = th.getAttribute('aria-sort') === 'ascending' ? 'descending' : 'ascending';
      // Exactly one column is sorted at a time. Two columns both claiming
      // `aria-sort` is a lie to a screen reader about what it is reading.
      for (const other of heads) other.setAttribute('aria-sort', 'none');
      th.setAttribute('aria-sort', next);
      table.dispatchEvent(new CustomEvent('sx:sort', {
        bubbles: true,
        detail: { column: th.dataset.column ?? th.textContent.trim(), direction: next },
      }));
    };
    th.addEventListener('click', act);
    th.addEventListener('keydown', (e) => {
      if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); act(); }
    });
  }
}
