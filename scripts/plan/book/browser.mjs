/**
 * WHAT RUNS INSIDE THE BROWSER — pagination, then the audit.
 *
 * Both are plain functions handed to page.evaluate(), so they may not
 * close over anything in this module.
 */

/**
 * Pour every `.flow` into pages. A block that does not fit moves to a
 * new page; a table is split between rows with its head repeated; a
 * heading never ends a page. Then every page is numbered, set recto or
 * verso, given its running head, and every contents reference resolved.
 */
export function paginate(bookTitle) {
  /* Height only: a block too wide for its page is the audit's to report,
     and moving it to another page of the same width would never end. */
  const fits = (f) => f.scrollHeight <= f.clientHeight + 0.5;
  for (const flow of [...document.querySelectorAll('.flow')]) {
    const blocks = [...flow.children];
    let field = null;
    const newPage = () => {
      const pg = document.createElement('section');
      pg.className = `pg ${flow.dataset.tone || ''}`.trim();
      pg.dataset.rh = flow.dataset.rh || '';
      pg.innerHTML = '<div class="rh"></div><div class="pg__field"></div><div class="folio"></div>';
      flow.parentNode.insertBefore(pg, flow);
      field = pg.querySelector('.pg__field');
    };
    const isHead = (b) => b && (b.classList.contains('blk--h') || b.classList.contains('blk--sub'));
    /* Carry trailing headings over to the new page with the block they head. */
    const breakBefore = () => {
      const carry = [];
      while (isHead(field.lastElementChild)) carry.unshift(field.removeChild(field.lastElementChild));
      newPage();
      for (const c of carry) field.appendChild(c);
    };
    /* Place a table, splitting it between rows as often as it needs. */
    const placeTable = (b) => {
      const table = b.querySelector('table');
      const rows = [...table.tBodies[0].rows];
      table.tBodies[0].innerHTML = '';
      const note = b.querySelector('.tb-note');
      if (note) note.remove();
      let current = b; let placedOnPage = 0; let movedOnce = false;
      field.appendChild(current);
      for (let i = 0; i < rows.length; i++) {
        current.querySelector('tbody').appendChild(rows[i]);
        if (fits(field)) { placedOnPage++; continue; }
        // A row taller than a whole page stays where it is; the audit reports it.
        if (placedOnPage === 0 && current !== b) { placedOnPage++; continue; }
        current.querySelector('tbody').removeChild(rows[i]);
        // Too few rows would be an orphan: move the whole start instead.
        if (placedOnPage < 3 && current === b && field.children.length > 1 && !movedOnce) {
          movedOnce = true;
          const moved = [...current.querySelector('tbody').rows];
          field.removeChild(current);
          breakBefore();
          field.appendChild(current);
          for (const r of moved) current.querySelector('tbody').appendChild(r);
          i--; placedOnPage = moved.length; continue;
        }
        const next = current.cloneNode(true);
        next.querySelector('tbody').innerHTML = '';
        const cap = next.querySelector('caption');
        if (cap) {
          const b2 = cap.querySelector('b');
          cap.innerHTML = `<b>${b2 ? b2.textContent.replace(/ — continued$/, '') : ''} — continued</b>`;
        }
        newPage();
        field.appendChild(next);
        current = next; placedOnPage = 0; i--;
      }
      if (note) {
        current.appendChild(note);
        if (!fits(field)) { current.removeChild(note); newPage(); const d = document.createElement('div'); d.className = 'blk blk--full'; d.appendChild(note); field.appendChild(d); }
      }
    };
    newPage();
    for (const b of blocks) {
      if (b.classList.contains('blk--break')) { if (field.children.length) newPage(); continue; }
      if (b.classList.contains('blk--table') && b.dataset.split === 'yes') {
        field.appendChild(b);
        if (fits(field)) continue;
        field.removeChild(b);
        placeTable(b);
        continue;
      }
      field.appendChild(b);
      if (fits(field)) continue;
      field.removeChild(b);
      if (!field.children.length) { field.appendChild(b); continue; } // larger than a page: the audit reports it
      breakBefore();
      field.appendChild(b);
    }
    // A heading may not end a flow's last page either, and an empty page is dropped.
    flow.remove();
  }
  document.querySelectorAll('.pg').forEach((p) => {
    const f = p.querySelector('.pg__field');
    if (f && !f.children.length && !p.classList.contains('keep')) p.remove();
  });
  const pages = [...document.querySelectorAll('.pg')];
  pages.forEach((p, i) => {
    const n = i + 1;
    p.classList.toggle('pg--verso', n % 2 === 0);
    const f = p.querySelector('.folio'); if (f) f.textContent = String(n);
    const rh = p.querySelector('.rh');
    if (rh) rh.innerHTML = n % 2 === 0 ? `<b>${bookTitle}</b><span>${p.dataset.rh || ''}</span>` : `<span>${p.dataset.rh || ''}</span><b>${bookTitle}</b>`;
  });
  // Resolve every page reference: the contents, the openers' lists, the cover's extent.
  for (const ref of document.querySelectorAll('[data-ref]')) {
    const t = document.getElementById(ref.dataset.ref);
    const pg = t && t.closest('.pg');
    ref.textContent = pg ? String(pages.indexOf(pg) + 1) : '?';
  }
  for (const el of document.querySelectorAll('[data-extent]')) el.textContent = String(pages.length);
  return { pages: pages.length, unresolved: [...document.querySelectorAll('[data-ref]')].filter((r) => r.textContent === '?').map((r) => r.dataset.ref) };
}

/**
 * The audit. A page fails if anything overflows its field or its trim,
 * if any two blocks of text overlap, if its folio is not its page, if it
 * carries a raster image, or if any text on it is unreadable on the
 * ground it is painted on. The thresholds are the house's own (see
 * scripts/publication/render-monograph.mjs): 3:1 for reading sizes,
 * 2.4:1 for the small furniture.
 */
export function audit() {
  const out = [];
  const lum = (c) => {
    const m = String(c).match(/rgba?\(([^)]+)\)/);
    if (!m) return null;
    const [r, g, b, a] = m[1].split(',').map((x) => parseFloat(x));
    if (a !== undefined && a < 0.92) return null;
    const f = (v) => { const x = v / 255; return x <= 0.03928 ? x / 12.92 : ((x + 0.055) / 1.055) ** 2.4; };
    return 0.2126 * f(r) + 0.7152 * f(g) + 0.0722 * f(b);
  };
  /* A page painted with a gradient reports no colour; its ground is the
     darkest stop it declares, which is what small type sits on. */
  const groundOf = (el) => {
    for (let n = el; n && n !== document.documentElement; n = n.parentElement) {
      const cs = getComputedStyle(n);
      const l = lum(cs.backgroundColor);
      if (l !== null) return l;
      if (cs.backgroundImage && cs.backgroundImage !== 'none') {
        const stops = [...cs.backgroundImage.matchAll(/rgba?\([^)]+\)/g)].map((m) => lum(m[0])).filter((x) => x !== null);
        if (stops.length) return Math.max(...stops);
      }
    }
    return 1;
  };
  document.querySelectorAll('.pg').forEach((p, i) => {
    const pr = p.getBoundingClientRect();
    const fieldEl = p.querySelector('.pg__field, .op, .cover');
    const over = fieldEl ? Math.max(0, fieldEl.scrollHeight - fieldEl.clientHeight) : 0;
    const wide = fieldEl ? Math.max(0, fieldEl.scrollWidth - fieldEl.clientWidth) : 0;
    const clipped = [...p.querySelectorAll('.pg__field *, .op *, .cover *')].some((el) => {
      if (el.closest('svg')) return false;
      const r = el.getBoundingClientRect();
      return r.height > 0 && (r.bottom > pr.bottom + 0.5 || r.right > pr.right + 0.5 || r.left < pr.left - 0.5);
    });
    const blocks = [...p.querySelectorAll('p, h1, h2, h3, h4, table, li, dt, dd, .kf .v, .kf .l')];
    let collided = null;
    for (let a = 0; a < blocks.length && !collided; a++) {
      for (let c = a + 1; c < blocks.length && !collided; c++) {
        if (blocks[a].contains(blocks[c]) || blocks[c].contains(blocks[a])) continue;
        for (const r1 of blocks[a].getClientRects()) {
          for (const r2 of blocks[c].getClientRects()) {
            if (r1.width < 2 || r2.width < 2) continue;
            if (Math.min(r1.right, r2.right) - Math.max(r1.left, r2.left) > 3
              && Math.min(r1.bottom, r2.bottom) - Math.max(r1.top, r2.top) > 3) {
              collided = (blocks[a].textContent || '').trim().slice(0, 40); break;
            }
          }
          if (collided) break;
        }
      }
    }
    const f2 = p.querySelector('.folio');
    const folio = f2 && f2.textContent.trim() ? Number(f2.textContent.trim()) : null;
    const misfoliated = folio !== null && folio !== i + 1 ? folio : null;
    const img = p.querySelector('img, picture, video, [style*="url(data:image"]');
    let faint = null;
    for (const el of p.querySelectorAll('p, h1, h2, h3, h4, td, th, li, .kf .v, .kf .l, .rh span, .rh b, .folio')) {
      const t = (el.textContent || '').trim();
      if (t.length < 2 || el.querySelector('p, td, th, li')) continue;
      const r = el.getBoundingClientRect();
      if (r.width < 4 || r.height < 4) continue;
      const cs = getComputedStyle(el);
      if (cs.visibility === 'hidden' || cs.display === 'none' || Number(cs.opacity) < 0.5) continue;
      const ink = lum(cs.color);
      if (ink === null) continue;
      const ground = groundOf(el);
      const ratio = (Math.max(ink, ground) + 0.05) / (Math.min(ink, ground) + 0.05);
      const floor = parseFloat(cs.fontSize) >= 16 ? 3.0 : 2.4;
      if (ratio < floor) { faint = `${t.slice(0, 30)}… at ${ratio.toFixed(2)}:1, wants ${floor}`; break; }
    }
    if (over > 1 || wide > 1 || clipped || collided || misfoliated || img || faint) {
      out.push({ page: i + 1, over: Math.round(over), wide: Math.round(wide), clipped, collided, misfoliated, img: Boolean(img), faint });
    }
  });
  return out;
}
