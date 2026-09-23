/**
 * THE FIGURES — drawn from the model, in vector, at print scale.
 *
 * Every figure is 175 mm wide (the full measure) and drawn in a
 * coordinate space of four units to the millimetre, so a type size in
 * points converts exactly: pt(7) is seven-point type on the page. Every
 * value plotted is passed in; nothing here knows a planning number.
 */
import { C, FACE } from './style.mjs';

const U = 4; // units per mm
export const W = 175 * U;
export const pt = (n) => n * 0.3528 * U;
const r2 = (n) => Math.round(n * 100) / 100;
export const esc = (v) => String(v).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
const DATA = FACE.data.replace(/"/g, "'");
const TEXT = FACE.text.replace(/"/g, "'");
const CER = FACE.ceremonial.replace(/"/g, "'");

export const ROUTE_COLOUR = {
  independent: '#BFA974', guided: '#5B77B0', tutored: C.sapphire, executive: C.gold, bespoke: C.crimson,
};

const txt = (x, y, s, o = {}) => `<text x="${r2(x)}" y="${r2(y)}" font-family="${o.family || DATA}" font-size="${r2(pt(o.size || 6.6))}"`
  + ` font-weight="${o.weight || 400}" fill="${o.fill || C.inkSoft}" text-anchor="${o.anchor || 'start'}"`
  + `${o.ls ? ` letter-spacing="${o.ls}"` : ''}${o.italic ? ' font-style="italic"' : ''}>${esc(s)}</text>`;
const line = (x1, y1, x2, y2, stroke, w = 0.35, dash) => `<line x1="${r2(x1)}" y1="${r2(y1)}" x2="${r2(x2)}" y2="${r2(y2)}"`
  + ` stroke="${stroke}" stroke-width="${r2(w * U * 0.3528)}"${dash ? ` stroke-dasharray="${dash}"` : ''}/>`;
const svg = (h, inner, defs = '') => `<svg viewBox="0 0 ${W} ${r2(h)}" xmlns="http://www.w3.org/2000/svg" role="img">`
  + `<defs>${GOLD_DEFS}${defs}</defs>${inner}</svg>`;

const GOLD_DEFS = `<linearGradient id="gold" x1="0" y1="0" x2="0" y2="1">
  <stop offset="0" stop-color="${C.goldSpec}"/><stop offset=".28" stop-color="${C.goldLeaf}"/>
  <stop offset=".55" stop-color="${C.goldRich}"/><stop offset=".8" stop-color="${C.gold}"/><stop offset="1" stop-color="${C.goldDeep}"/></linearGradient>
<linearGradient id="goldh" x1="0" y1="0" x2="1" y2="0">
  <stop offset="0" stop-color="${C.goldDeep}"/><stop offset=".35" stop-color="${C.goldRich}"/>
  <stop offset=".5" stop-color="${C.goldSpec}"/><stop offset=".65" stop-color="${C.goldRich}"/><stop offset="1" stop-color="${C.goldDeep}"/></linearGradient>`;

/** Round a range out to tidy ticks. */
function ticks(lo, hi, n = 5) {
  const span = hi - lo || 1;
  const raw = span / n;
  const mag = Math.pow(10, Math.floor(Math.log10(raw)));
  const step = [1, 2, 2.5, 5, 10].map((m) => m * mag).find((s) => span / s <= n + 0.5) || mag * 10;
  const a = Math.floor(lo / step) * step; const b = Math.ceil(hi / step) * step;
  const out = [];
  for (let v = a; v <= b + step / 2; v += step) out.push(Math.round(v * 1e6) / 1e6);
  return out;
}
const money = (v, d = 1) => `${v < 0 ? '−' : ''}$${Math.abs(v / 1e6).toFixed(d)}M`;

// ── Gold numerals and titles ─────────────────────────────────────────
/** A numeral or short word in struck gold, sized to its box. */
export function goldWord(s, { size = 150, width, weight = 400, family = CER, italic = false } = {}) {
  const w = width || s.length * size * 0.62;
  const h = size * 1.02;
  return `<svg viewBox="0 0 ${r2(w)} ${r2(h)}" xmlns="http://www.w3.org/2000/svg"><defs>${GOLD_DEFS}</defs>`
    + `<text x="0" y="${r2(size * 0.8)}" font-family="${family}" font-size="${size}" font-weight="${weight}"`
    + `${italic ? ' font-style="italic"' : ''} fill="url(#gold)">${esc(s)}</text></svg>`;
}

/** The College's mark: a struck roundel carrying the monogram. */
export function mark() {
  const s = 220; const c = s / 2;
  const ticksRing = Array.from({ length: 72 }, (_, i) => {
    const a = (i / 72) * Math.PI * 2; const r1 = 96; const r0 = i % 6 === 0 ? 88 : 92;
    return `<line x1="${r2(c + r0 * Math.cos(a))}" y1="${r2(c + r0 * Math.sin(a))}" x2="${r2(c + r1 * Math.cos(a))}" y2="${r2(c + r1 * Math.sin(a))}" stroke="url(#goldh)" stroke-width="${i % 6 === 0 ? 1.4 : 0.7}"/>`;
  }).join('');
  return `<svg viewBox="0 0 ${s} ${s}" xmlns="http://www.w3.org/2000/svg"><defs>${GOLD_DEFS}</defs>
    <circle cx="${c}" cy="${c}" r="106" fill="none" stroke="url(#goldh)" stroke-width="1.6"/>
    <circle cx="${c}" cy="${c}" r="100" fill="none" stroke="url(#goldh)" stroke-width="0.6"/>
    ${ticksRing}
    <circle cx="${c}" cy="${c}" r="82" fill="none" stroke="url(#goldh)" stroke-width="0.8"/>
    <text x="${c}" y="${c + 20}" text-anchor="middle" font-family="${CER}" font-size="62" fill="url(#gold)" letter-spacing="1">WEC</text>
    <text x="${c}" y="${c + 46}" text-anchor="middle" font-family="${DATA}" font-size="11" font-weight="600" fill="${C.goldLeaf}" letter-spacing="6">LONDON</text>
  </svg>`;
}

// ── The decade: revenue against cost ────────────────────────────────
export function decade(Y, { firstSurplusYear } = {}) {
  const H = 306; const L = 44; const R = 18; const T = 26; const B = 44;
  const vals = Y.flatMap((y) => [y.revenue.net, y.costs]);
  const tk = ticks(0, Math.max(...vals), 5);
  const top = tk[tk.length - 1];
  const x = (i) => L + ((W - L - R) * (i + 0.5)) / Y.length;
  const y = (v) => T + (H - T - B) * (1 - v / top);
  let g = '';
  for (const v of tk) { g += line(L, y(v), W - R, y(v), C.ruleFaint, 0.35) + txt(L - 6, y(v) + 3, money(v, v % 1e6 ? 1 : 0), { anchor: 'end', size: 6.2, fill: C.grey }); }
  // The gap between the lines: deficit in the seal colour, surplus in gold.
  for (let i = 0; i < Y.length; i++) {
    const r = Y[i].revenue.net; const c = Y[i].costs; const w = (W - L - R) / Y.length * 0.56;
    const up = Math.max(r, c); const lo = Math.min(r, c);
    g += `<rect x="${r2(x(i) - w / 2)}" y="${r2(y(up))}" width="${r2(w)}" height="${r2(y(lo) - y(up))}" fill="${r > c ? C.goldLeaf : '#E7C9CF'}" opacity=".85"/>`;
    g += `<rect x="${r2(x(i) - w / 2)}" y="${r2(y(lo))}" width="${r2(w)}" height="${r2(y(0) - y(lo))}" fill="${C.cream}"/>`;
  }
  const path = (k) => Y.map((yy, i) => `${i ? 'L' : 'M'}${r2(x(i))},${r2(y(k(yy)))}`).join('');
  g += `<path d="${path((yy) => yy.costs)}" fill="none" stroke="${C.bronze}" stroke-width="${r2(1.1 * U * 0.3528)}" stroke-dasharray="7 4"/>`;
  g += `<path d="${path((yy) => yy.revenue.net)}" fill="none" stroke="${C.sapphire}" stroke-width="${r2(1.5 * U * 0.3528)}"/>`;
  Y.forEach((yy, i) => {
    g += `<circle cx="${r2(x(i))}" cy="${r2(y(yy.revenue.net))}" r="3.6" fill="${C.sapphire}"/>`;
    g += txt(x(i), H - B + 16, String(yy.year), { anchor: 'middle', size: 6.6, fill: C.ink, weight: 500 });
  });
  g += line(L, y(0), W - R, y(0), C.ink, 0.6);
  const lx = L + 6;
  g += `<line x1="${lx}" y1="${T - 12}" x2="${lx + 26}" y2="${T - 12}" stroke="${C.sapphire}" stroke-width="2.1"/>` + txt(lx + 32, T - 9, 'Net fee revenue', { size: 6.4, fill: C.ink });
  g += `<line x1="${lx + 150}" y1="${T - 12}" x2="${lx + 176}" y2="${T - 12}" stroke="${C.bronze}" stroke-width="1.55" stroke-dasharray="7 4"/>` + txt(lx + 182, T - 9, 'Whole cost of the institution', { size: 6.4, fill: C.ink });
  g += `<rect x="${lx + 350}" y="${T - 17}" width="14" height="9" fill="#E7C9CF"/>` + txt(lx + 370, T - 9, 'Deficit', { size: 6.4, fill: C.ink });
  g += `<rect x="${lx + 420}" y="${T - 17}" width="14" height="9" fill="${C.goldLeaf}"/>` + txt(lx + 440, T - 9, 'Surplus', { size: 6.4, fill: C.ink });
  if (firstSurplusYear) {
    const i = Y.findIndex((yy) => yy.year === firstSurplusYear);
    g += txt(x(i), H - B + 30, 'First surplus', { anchor: 'middle', size: 6, fill: C.goldDeep, weight: 600 });
  }
  return svg(H, g);
}

// ── Cash, the minimum balance and the tranches ──────────────────────
export function cash(rows, K) {
  const H = 300; const L = 44; const R = 18; const T = 26; const B = 36;
  const bal = K.balance.map((b) => b.balance);
  const mins = K.balance.map((b) => b.minimum);
  const cum = rows.map((r) => r.cumulative);
  const tk = ticks(Math.min(...cum, 0), Math.max(...bal, ...mins), 6);
  const lo = tk[0]; const hi = tk[tk.length - 1];
  const x = (t) => L + ((W - L - R) * (t + 0.5)) / rows.length;
  const y = (v) => T + (H - T - B) * (1 - (v - lo) / (hi - lo));
  let g = '';
  const dp = tk.some((v) => Math.abs(v) % 1e6 > 1) ? 1 : 0;
  for (const v of tk) g += line(L, y(v), W - R, y(v), v === 0 ? C.ink : C.ruleFaint, v === 0 ? 0.6 : 0.35) + txt(L - 6, y(v) + 3, money(v, dp), { anchor: 'end', size: 6.2, fill: C.grey });
  const path = (vs) => vs.map((v, t) => `${t ? 'L' : 'M'}${r2(x(t))},${r2(y(v))}`).join('');
  // Cumulative cash from operations: the hole the capital fills.
  g += `<path d="${path(cum)}L${r2(x(rows.length - 1))},${r2(y(0))}L${r2(x(0))},${r2(y(0))}Z" fill="#EFD9DD" opacity=".7"/>`;
  g += `<path d="${path(cum)}" fill="none" stroke="${C.crimson}" stroke-width="1.6"/>`;
  g += `<path d="${path(mins)}" fill="none" stroke="${C.goldDeep}" stroke-width="1.3" stroke-dasharray="5 4"/>`;
  g += `<path d="${path(bal)}" fill="none" stroke="${C.sapphire}" stroke-width="2.2"/>`;
  rows.forEach((r, t) => { if (t % 3 === 0) g += txt(x(t + 1), H - B + 16, String(r.year), { anchor: 'middle', size: 6.6, fill: C.ink, weight: 500 }); });
  K.tranches.forEach((tr, i) => {
    const cx = x(tr.t); const cy = y(bal[tr.t]);
    const ly = T + 14 + i * 15; const lx = x(9) + 10;
    g += line(cx, cy - 7, cx, ly - 3, C.goldDeep, 0.3) + line(cx, ly - 3, lx - 4, ly - 3, C.goldDeep, 0.3);
    g += `<path d="M${r2(cx)},${r2(cy - 7)}L${r2(cx + 7)},${r2(cy)}L${r2(cx)},${r2(cy + 7)}L${r2(cx - 7)},${r2(cy)}Z" fill="url(#gold)" stroke="${C.goldDeep}" stroke-width=".6"/>`;
    g += txt(lx, ly, `${tr.name}, ${rows[tr.t].label}: ${money(tr.amount, 2)}`, { size: 6.2, fill: C.sapphire, weight: 600 });
  });
  const ti = rows.findIndex((r) => r.label === K.trough.label);
  g += txt(x(ti), y(cum[ti]) - 10, `Lowest point, ${K.trough.label}: ${money(cum[ti])}`, { anchor: 'middle', size: 6.2, fill: C.crimson, weight: 600 });
  const lx = L + 6;
  g += `<line x1="${lx}" y1="${T - 12}" x2="${lx + 26}" y2="${T - 12}" stroke="${C.sapphire}" stroke-width="2.2"/>` + txt(lx + 32, T - 9, 'Cash held, with the founding capital', { size: 6.4, fill: C.ink });
  g += `<line x1="${lx + 210}" y1="${T - 12}" x2="${lx + 236}" y2="${T - 12}" stroke="${C.goldDeep}" stroke-width="1.3" stroke-dasharray="5 4"/>` + txt(lx + 242, T - 9, 'Minimum: three months of cost', { size: 6.4, fill: C.ink });
  g += `<line x1="${lx + 420}" y1="${T - 12}" x2="${lx + 446}" y2="${T - 12}" stroke="${C.crimson}" stroke-width="1.6"/>` + txt(lx + 452, T - 9, 'Cash from operations alone', { size: 6.4, fill: C.ink });
  return svg(H, g);
}

// ── Learners by route, term by term ─────────────────────────────────
export function learners(rows, routeKeys, names) {
  const H = 280; const L = 44; const R = 18; const T = 26; const B = 36;
  const by = rows.map((r) => {
    const o = {}; for (const k of routeKeys) o[k] = 0;
    for (const [rl, n] of Object.entries(r.routeLevels)) o[rl.split('|')[0]] += n;
    return o;
  });
  const tot = by.map((o) => Object.values(o).reduce((a, b) => a + b, 0));
  const tk = ticks(0, Math.max(...tot), 5); const hi = tk[tk.length - 1];
  const bw = (W - L - R) / rows.length;
  const y = (v) => T + (H - T - B) * (1 - v / hi);
  let g = '';
  for (const v of tk) g += line(L, y(v), W - R, y(v), C.ruleFaint, 0.35) + txt(L - 6, y(v) + 3, String(v), { anchor: 'end', size: 6.2, fill: C.grey });
  by.forEach((o, t) => {
    let acc = 0;
    for (const k of routeKeys) {
      const v = o[k]; if (!(v > 0)) continue;
      g += `<rect x="${r2(L + t * bw + bw * 0.14)}" y="${r2(y(acc + v))}" width="${r2(bw * 0.72)}" height="${r2(y(acc) - y(acc + v))}" fill="${ROUTE_COLOUR[k]}"/>`;
      acc += v;
    }
    if (t % 3 === 0) g += txt(L + (t + 1.5) * bw, H - B + 16, String(rows[t].year), { anchor: 'middle', size: 6.6, fill: C.ink, weight: 500 });
  });
  g += line(L, y(0), W - R, y(0), C.ink, 0.6);
  let lx = L + 6;
  for (const k of routeKeys) {
    g += `<rect x="${lx}" y="${T - 18}" width="12" height="9" fill="${ROUTE_COLOUR[k]}"/>` + txt(lx + 16, T - 10, names[k], { size: 6.4, fill: C.ink });
    lx += 20 + names[k].length * pt(6.4) * 0.52 + 18;
  }
  return svg(H, g);
}

// ── The anatomy of a level fee ───────────────────────────────────────
export const FEE_PARTS = [
  { key: 'own', name: 'Teaching and assessment on the route', colour: C.sapphire },
  { key: 'inst', name: 'The institution’s academic work', colour: '#5B77B0' },
  { key: 'running', name: 'Running the institution', colour: '#A9B6D3' },
  { key: 'acq', name: 'Finding the learner', colour: C.champagneDeep },
  { key: 'collect', name: 'Collecting the fee', colour: C.bronze },
  { key: 'margin', name: 'Margin: capital, reserve', colour: C.gold },
];
export function feeAnatomy(routes, b, margin) {
  const rowH = 46; const T = 52; const L = 118; const R = 70;
  const H = T + routes.length * rowH + 12;
  const max = Math.max(...routes.map((r) => r.fee));
  const sx = (v) => ((W - L - R) * v) / max;
  let g = '';
  FEE_PARTS.forEach((p, i) => {
    const lx = (i % 3) * (W / 3); const ly = 6 + Math.floor(i / 3) * 16;
    g += `<rect x="${lx}" y="${ly}" width="12" height="9" fill="${p.colour}"/>` + txt(lx + 16, ly + 8, p.name, { size: 6.1, fill: C.ink });
  });
  routes.forEach((r, i) => {
    const y0 = T + i * rowH;
    const parts = {
      own: r.own ? r.own.usd : 0, inst: b.shared.institutionalAcademic, running: b.shared.running,
      acq: b.shared.acquisition, collect: r.fee * b.collect,
    };
    parts.margin = Math.max(0, r.fee - Object.values(parts).reduce((a, v) => a + v, 0));
    g += txt(L - 10, y0 + 18, r.name.replace('WEC-LC ', ''), { anchor: 'end', size: 8.2, family: TEXT, fill: C.sapphire, weight: 500 });
    let acc = 0;
    for (const p of FEE_PARTS) {
      const v = parts[p.key]; const w = sx(v);
      g += `<rect x="${r2(L + sx(acc))}" y="${y0 + 4}" width="${r2(w)}" height="22" fill="${p.colour}"/>`;
      if (w > 44) g += txt(L + sx(acc) + w / 2, y0 + 18.5, `$${Math.round(v).toLocaleString('en-US')}`, { anchor: 'middle', size: 5.8, fill: ['own', 'inst'].includes(p.key) ? '#FFFFFF' : C.ink, weight: 500 });
      acc += v;
    }
    g += txt(L + sx(acc) + 8, y0 + 19, `$${r.fee.toLocaleString('en-US')}`, { size: 8.4, family: TEXT, fill: C.ink, weight: 600 });
  });
  return svg(H, g);
}

// ── The constitution, as a ledger of bars ───────────────────────────
export function constitution(lines) {
  const rowH = 30; const T = 8; const L = 250; const R = 60;
  const H = T + lines.length * rowH + 4;
  const max = Math.max(...lines.map((l) => l.share));
  let g = '';
  lines.forEach((l, i) => {
    const y0 = T + i * rowH;
    const w = ((W - L - R) * l.share) / max;
    const retained = l.key === 'retained';
    g += txt(0, y0 + 15, l.name, { size: 8, family: TEXT, fill: retained ? C.goldDeep : C.ink, weight: retained ? 600 : 400 });
    g += `<rect x="${L}" y="${y0 + 4}" width="${r2(Math.max(1, w))}" height="15" fill="${retained ? 'url(#goldh)' : C.sapphire}"/>`;
    g += txt(L + w + 8, y0 + 15.5, `${(l.share * 100).toFixed(1)}%`, { size: 7.6, fill: C.ink, weight: 600 });
    g += line(0, y0 + rowH - 2, W, y0 + rowH - 2, C.ruleFaint, 0.3);
  });
  return svg(H, g);
}

// ── The shocks ───────────────────────────────────────────────────────
export function shocks(list, central, reserveTarget) {
  const rowH = 27; const T = 34; const L = 232; const R = 146;
  const H = T + list.length * rowH + 10;
  const vals = [...list.map((s) => s.cumulative), central.cumulative, reserveTarget, 0];
  const tk = ticks(Math.min(...vals), Math.max(...vals), 6);
  const lo = tk[0]; const hi = tk[tk.length - 1];
  const x = (v) => L + ((W - L - R) * (v - lo)) / (hi - lo);
  const col = { reserve: C.sapphire, returned: C.gold, short: C.crimson };
  let g = '';
  for (const v of tk) g += line(x(v), T - 6, x(v), H - 8, v === 0 ? C.ink : C.ruleFaint, v === 0 ? 0.6 : 0.3) + txt(x(v), T - 12, money(v, 0), { anchor: 'middle', size: 6, fill: C.grey });
  g += line(x(reserveTarget), T - 6, x(reserveTarget), H - 8, C.goldDeep, 0.8, '4 3');
  g += txt(x(reserveTarget) + 3, H - 1, 'Reserve target', { size: 5.8, fill: C.goldDeep });
  list.forEach((s, i) => {
    const y0 = T + i * rowH;
    g += txt(0, y0 + 14, s.name, { size: 7.4, family: TEXT, fill: s.key === 'central' ? C.sapphire : C.ink, weight: s.key === 'central' ? 600 : 400 });
    const a = x(Math.min(0, s.cumulative)); const b2 = x(Math.max(0, s.cumulative));
    g += `<rect x="${r2(a)}" y="${y0 + 4}" width="${r2(Math.max(1, b2 - a))}" height="13" fill="${col[s.grade]}"/>`;
    const ret = s.returnYear && s.returnYear.year ? `returnable ${s.returnYear.year}` : 'not by 2046';
    g += txt(W - R + 8, y0 + 14, `${money(s.cumulative)} · ${ret}`, { size: 6.2, fill: C.ink });
  });
  return svg(H, g);
}

// ── The establishment ────────────────────────────────────────────────
export function establishment(rows) {
  const H = 250; const L = 40; const R = 18; const T = 26; const B = 36;
  const parts = [
    { name: 'Instructors', colour: C.sapphire, v: (r) => r.instructors.standard },
    { name: 'Senior academics', colour: '#5B77B0', v: (r) => r.instructors.senior },
    { name: 'Academic leads', colour: '#A9B6D3', v: (r) => r.posts.academicLead || 0 },
    { name: 'Professional staff', colour: C.champagneDeep, v: (r) => r.nonTeaching - (r.posts.academicLead || 0) },
  ];
  const tot = rows.map((r) => parts.reduce((a, p) => a + p.v(r), 0));
  const tk = ticks(0, Math.max(...tot), 5); const hi = tk[tk.length - 1];
  const bw = (W - L - R) / rows.length;
  const y = (v) => T + (H - T - B) * (1 - v / hi);
  let g = '';
  for (const v of tk) g += line(L, y(v), W - R, y(v), C.ruleFaint, 0.35) + txt(L - 6, y(v) + 3, String(v), { anchor: 'end', size: 6.2, fill: C.grey });
  rows.forEach((r, t) => {
    let acc = 0;
    for (const p of parts) {
      const v = p.v(r); if (!v) continue;
      g += `<rect x="${r2(L + t * bw + bw * 0.14)}" y="${r2(y(acc + v))}" width="${r2(bw * 0.72)}" height="${r2(y(acc) - y(acc + v))}" fill="${p.colour}"/>`;
      acc += v;
    }
    if (t % 3 === 0) g += txt(L + (t + 1.5) * bw, H - B + 16, String(r.year), { anchor: 'middle', size: 6.6, fill: C.ink, weight: 500 });
  });
  g += line(L, y(0), W - R, y(0), C.ink, 0.6);
  let lx = L + 6;
  for (const p of parts) {
    g += `<rect x="${lx}" y="${T - 18}" width="12" height="9" fill="${p.colour}"/>` + txt(lx + 16, T - 10, p.name, { size: 6.4, fill: C.ink });
    lx += 26 + p.name.length * pt(6.4) * 0.52 + 14;
  }
  return svg(H, g);
}

// ── The funnel ───────────────────────────────────────────────────────
export function funnel(stages) {
  const rowH = 32; const L = 200; const R = 70; const T = 6;
  const H = T + stages.length * rowH;
  const max = stages[0].n;
  let g = '';
  stages.forEach((s, i) => {
    const y0 = T + i * rowH; const w = ((W - L - R) * s.n) / max;
    g += txt(0, y0 + 16, s.name, { size: 8, family: TEXT, fill: C.ink });
    if (s.rate) g += txt(0, y0 + 26, s.rate, { size: 5.8, fill: C.grey });
    g += `<rect x="${L}" y="${y0 + 5}" width="${r2(Math.max(1.5, w))}" height="17" fill="${i === stages.length - 1 ? 'url(#goldh)' : C.sapphire}" opacity="${1 - i * 0.1}"/>`;
    g += txt(L + w + 8, y0 + 18, Math.round(s.n).toLocaleString('en-US'), { size: 8, fill: C.ink, weight: 600 });
  });
  return svg(H, g);
}

// ── When each market and channel opens ──────────────────────────────
export function openings(items, first, last) {
  const rowH = 30; const L = 200; const R = 10; const T = 28;
  const H = T + items.length * rowH + 6;
  const n = (last - first + 1) * 3;
  const x = (t) => L + ((W - L - R) * t) / n;
  let g = '';
  for (let yv = first; yv <= last; yv++) {
    const t = (yv - first) * 3;
    g += line(x(t), T - 8, x(t), H - 4, C.ruleFaint, 0.3) + txt(x(t + 1.5), T - 12, String(yv), { anchor: 'middle', size: 6.4, fill: C.ink, weight: 500 });
  }
  items.forEach((it, i) => {
    const y0 = T + i * rowH;
    g += txt(0, y0 + 13, it.name, { size: 7.8, family: TEXT, fill: C.ink });
    g += txt(0, y0 + 23, it.note, { size: 5.8, fill: C.grey });
    g += `<rect x="${r2(x(it.t))}" y="${y0 + 5}" width="${r2(x(n) - x(it.t))}" height="13" fill="${it.kind === 'agreement' ? C.goldRich : C.sapphire}" opacity=".92"/>`;
    g += `<path d="M${r2(x(it.t))},${y0 + 2}L${r2(x(it.t) + 5)},${y0 + 11.5}L${r2(x(it.t))},${y0 + 21}Z" fill="${C.crimson}"/>`;
  });
  return svg(H, g);
}

// ── The ten years as phases and gates ───────────────────────────────
export function phases(RY) {
  const H = 96; const T = 30;
  const cw = W / RY.length;
  let g = '';
  RY.forEach((y, i) => {
    const x0 = i * cw;
    g += `<rect x="${r2(x0 + 1)}" y="${T}" width="${r2(cw - 2)}" height="26" fill="${i % 2 ? C.sapphire : C.sapphireMid}"/>`;
    g += txt(x0 + cw / 2, T + 17, String(y.year), { anchor: 'middle', size: 7.4, fill: C.onSapphire, weight: 600 });
    const words = y.phase.split(' ');
    const l1 = words.length > 2 ? words.slice(0, 2).join(' ') : y.phase;
    const l2 = words.length > 2 ? words.slice(2).join(' ') : '';
    g += txt(x0 + cw / 2, T + 42, l1, { anchor: 'middle', size: 6, family: TEXT, fill: C.ink });
    if (l2) g += txt(x0 + cw / 2, T + 52, l2, { anchor: 'middle', size: 6, family: TEXT, fill: C.ink });
    if (y.finance.drawn > 0) {
      const cx = x0 + cw / 2;
      g += `<path d="M${r2(cx)},${T - 22}L${r2(cx + 7)},${T - 14}L${r2(cx)},${T - 6}L${r2(cx - 7)},${T - 14}Z" fill="url(#gold)" stroke="${C.goldDeep}" stroke-width=".6"/>`;
      g += txt(cx + 11, T - 11, money(y.finance.drawn), { size: 6, fill: C.goldDeep, weight: 600 });
    }
  });
  return svg(H, g);
}

/** The cover's title, struck in gold, one line per entry. */
export function coverTitle(lines, { size = 64, lead = 1.08 } = {}) {
  const w = 1000; const h = lines.length * size * lead + size * 0.3;
  const t = lines.map((l, i) => `<text x="${w / 2}" y="${r2(size * (0.92 + i * lead))}" text-anchor="middle" font-family="${CER}" font-size="${size}" fill="url(#gold)">${esc(l)}</text>`).join('');
  return `<svg viewBox="0 0 ${w} ${r2(h)}" xmlns="http://www.w3.org/2000/svg"><defs>${GOLD_DEFS}</defs>${t}</svg>`;
}

/** One year in its decade: the surplus or deficit of every year, this one struck. */
export function yearStrip(Y, year) {
  const H = 150; const L = 44; const R = 18; const T = 14; const B = 26;
  const vals = Y.map((y) => y.surplus);
  const tk = ticks(Math.min(0, ...vals), Math.max(0, ...vals), 4);
  const lo = tk[0]; const hi = tk[tk.length - 1];
  const bw = (W - L - R) / Y.length;
  const y = (v) => T + (H - T - B) * (1 - (v - lo) / (hi - lo));
  const dp = tk.some((v) => Math.abs(v) % 1e6 > 1) ? 1 : 0;
  let g = '';
  for (const v of tk) g += line(L, y(v), W - R, y(v), v === 0 ? C.ink : C.ruleFaint, v === 0 ? 0.6 : 0.3) + txt(L - 6, y(v) + 3, money(v, dp), { anchor: 'end', size: 5.8, fill: C.grey });
  Y.forEach((yy, i) => {
    const on = yy.year === year; const v = yy.surplus;
    const fill = on ? (v < 0 ? C.crimson : C.sapphire) : (v < 0 ? '#E7C9CF' : '#C9D2E6');
    g += `<rect x="${r2(L + i * bw + bw * 0.18)}" y="${r2(y(Math.max(0, v)))}" width="${r2(bw * 0.64)}" height="${r2(Math.abs(y(v) - y(0)))}" fill="${fill}"/>`;
    g += txt(L + (i + 0.5) * bw, H - B + 14, String(yy.year), { anchor: 'middle', size: 6, fill: on ? C.sapphire : C.grey, weight: on ? 700 : 400 });
  });
  return svg(H, g);
}
