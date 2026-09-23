/**
 * THE BOOK'S BUILDING BLOCKS.
 *
 * Two kinds of page. A FIXED page is composed whole — a cover, an
 * opener, a year of the roadmap — and must fit its trim or the build
 * fails. A FLOW is a sequence of blocks that the browser pours into as
 * many pages as it needs (render-book.mjs), moving a block that will not
 * fit to the next page, splitting a table between its rows, and keeping
 * a heading with what it heads. Nothing is estimated: the page is
 * measured as it is filled.
 */
import { esc } from './charts.mjs';

export { esc };
export const usd = (n, d = 0) => `${n < 0 ? '−' : ''}$${Math.abs(Number(n)).toLocaleString('en-US', { minimumFractionDigits: d, maximumFractionDigits: d })}`;
export const usdM = (n, d = 1) => `${n < 0 ? '−' : ''}$${Math.abs(n / 1e6).toFixed(d)}M`;
export const usdK = (n) => `${n < 0 ? '−' : ''}$${Math.round(Math.abs(n) / 1000).toLocaleString('en-US')}k`;
export const gbp = (n) => `£${Number(n).toLocaleString('en-GB', { maximumFractionDigits: 2 })}`;
export const num = (n, d = 0) => Number(n).toLocaleString('en-US', { minimumFractionDigits: d, maximumFractionDigits: d });
export const pct = (x, d = 0) => `${(x * 100).toFixed(d)}%`;
export const round = (n, to) => Math.round(n / to) * to;

// ── Fixed pages ─────────────────────────────────────────────────────
/** A page composed whole. `rh` is the running head; `bare` drops head and folio. */
export const fixed = (inner, { rh = '', tone = '', bare = false, id = '' } = {}) =>
  `<section class="pg ${tone}${bare ? ' pg--bare' : ''}" data-rh="${esc(rh)}"${id ? ` id="${id}"` : ''}>`
  + `<div class="rh"></div>${inner}<div class="folio"></div></section>`;
export const field = (inner) => `<div class="pg__field">${inner}</div>`;

// ── Flows ───────────────────────────────────────────────────────────
export const flow = (blocks, { rh = '', tone = '' } = {}) =>
  `<section class="flow" data-rh="${esc(rh)}" data-tone="${tone}">${blocks.join('')}</section>`;

/** A numbered section heading, anchored so the contents can find its page. */
export const H = (n, title, id) => `<div class="blk blk--h"${id ? ` id="${id}"` : ''}><span class="n">${esc(n)}</span><h2>${esc(title)}</h2></div>`;
export const SUB = (t) => `<div class="blk blk--sub"><h3>${esc(t)}</h3></div>`;
/** Paragraphs set in the reading measure. Each argument is one paragraph; each paragraph is its own block so a page can break between them. */
export const Pp = (...paras) => paras.map((p) => `<div class="blk blk--p"><p>${p}</p></div>`).join('');
export const LEAD = (t) => `<div class="blk blk--lead"><p>${t}</p></div>`;
export const LIST = (items, { numbered = false } = {}) =>
  `<div class="blk blk--list${numbered ? ' num' : ''}"><ul>${items.map((i) => `<li>${i}</li>`).join('')}</ul></div>`;
export const BOARD = (label, text) => `<div class="blk blk--board"><div class="lab">${esc(label)}</div><p>${text}</p></div>`;
/** A reader's note: the same form as a Board decision, in the metal rather than the seal. */
export const NOTE = (label, text) => `<div class="blk blk--board blk--note"><div class="lab">${esc(label)}</div><p>${text}</p></div>`;

/** Key figures: the numbers a reader leaves the page holding. */
export const KF = (items, cols = items.length) => `<div class="blk blk--full"><div class="kf" style="grid-template-columns:repeat(${cols},1fr)">${
  items.map((i) => `<div><div class="v">${i.v}${i.small ? `<small>${i.small}</small>` : ''}</div><div class="l">${esc(i.l)}</div>${i.d ? `<div class="d">${i.d}</div>` : ''}</div>`).join('')}</div></div>`;

/**
 * A table in the full measure. `head` is a list of { t, r } (r = right-
 * aligned); a row is a list of cells, or { cells, cls } for a group,
 * subtotal or total row. A table longer than a page is split between
 * rows, and its head repeats.
 */
export function TABLE({ title, sub, head, rows, note, widths, split = true }) {
  const cg = widths ? `<colgroup>${widths.map((w) => `<col style="width:${w}">`).join('')}</colgroup>` : '';
  const th = `<thead><tr>${head.map((h) => `<th class="${h.r ? 'r' : ''}">${h.t}</th>`).join('')}</tr></thead>`;
  const tr = rows.map((r) => {
    const cells = Array.isArray(r) ? r : r.cells;
    const cls = Array.isArray(r) ? '' : r.cls || '';
    if (cls === 'grp') return `<tr class="grp"><td colspan="${head.length}">${cells[0]}</td></tr>`;
    return `<tr class="${cls}">${cells.map((c, i) => {
      const o = typeof c === 'object' && c !== null ? c : { v: c };
      const k = [head[i] && head[i].r ? 'r' : '', o.cls || '', head[i] && head[i].cls ? head[i].cls : ''].join(' ').trim();
      return `<td class="${k}"${o.span ? ` colspan="${o.span}"` : ''}>${o.v}</td>`;
    }).join('')}</tr>`;
  }).join('');
  const cap = title ? `<caption><b>${title}</b>${sub ? `<span>${sub}</span>` : ''}</caption>` : '';
  return `<div class="blk blk--full blk--table" data-split="${split ? 'yes' : 'no'}"><table class="tb">${cap}${cg}${th}<tbody>${tr}</tbody></table>${note ? `<div class="tb-note">${note}</div>` : ''}</div>`;
}

/** A figure in the full measure, with the sentence that says what it shows. */
export const FIG = ({ title, sub, svg, reading }) => `<div class="blk blk--full"><figure class="fig">`
  + `<figcaption><b>${title}</b>${sub ? `<span>${sub}</span>` : ''}</figcaption>${svg}`
  + `${reading ? `<div class="reading">${reading}</div>` : ''}</figure></div>`;

/** Forces the next block onto a new page. */
export const BREAK = '<div class="blk blk--break"></div>';
