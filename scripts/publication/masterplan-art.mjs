/**
 * THE TEN-YEAR INSTITUTIONAL ROADMAP — the publication.
 *
 * ────────────────────────────────────────────────────────────────────
 * EVERY FIGURE ON EVERY PAGE COMES FROM THE MODEL
 * ────────────────────────────────────────────────────────────────────
 * There is no number typed into this file. Each one is read from
 * scripts/publication/masterplan.mjs, which computes it from
 * data/tuition.json, data/commercial.json and data/masterplan.json.
 * Every chart is drawn from the same arrays the tables are printed
 * from, so a chart and its table cannot disagree — a failure mode that
 * is invisible in a finished PDF and fatal in a board paper.
 *
 * ────────────────────────────────────────────────────────────────────
 * THE DESIGN, AND THE ONE RULE IT IS BUILT ON
 * ────────────────────────────────────────────────────────────────────
 * Authority through precision, never through ornament. No gradients
 * used as decoration, no icon that does not carry information, no chart
 * that does not answer a question a reader actually has. Gold appears
 * on roughly one element a spread; it stops meaning anything the moment
 * it is everywhere.
 *
 * The register to beat is a sovereign-scale institutional publication:
 * if the crest were removed, the page should still read as commissioned
 * by a serious institution. That is the test each layout below was
 * built against.
 */

import { writeFileSync, mkdirSync, existsSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { chromium } from 'playwright';
import { model, allScenarios, allocation, breakEven, sensitivity, alternativeA, basis, PLAN } from './masterplan.mjs';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..');
const OUT_DIR = path.join(ROOT, 'publication');
const OUT_PDF = path.join(OUT_DIR, 'WEC-LC Ten-Year Institutional Roadmap.pdf');
const OUT_HTML = path.join(OUT_DIR, '.masterplan.html');

// ── The palette. Five colours and two neutrals, and that is all. ─────
const K = {
  oxford: '#0A1428',
  navy: '#14264A',
  imperial: '#1B3566',
  gold: '#C7A24A',
  goldPale: '#E7C97A',
  goldWash: '#F0E6CC',
  ivory: '#FBF8F0',
  paper: '#FFFFFF',
  panel: '#F5F1E6',
  ink: '#16202E',
  soft: '#5A6479',
  rule: '#D9D3C4',
  crimson: '#8C1F2F',
  sage: '#3F6B52',
};
const SERIF = 'Cambria, "Nimbus Roman", Georgia, "Times New Roman", serif';
const SANS = 'Calibri, "Nimbus Sans", "Segoe UI", Arial, sans-serif';

const esc = (s) => String(s ?? '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
const usd = (n, d = 0) => '$' + Number(n || 0).toLocaleString('en-GB', { minimumFractionDigits: d, maximumFractionDigits: d });
const m$ = (n) => '$' + (Number(n || 0) / 1e6).toFixed(2) + 'M';
const k$ = (n) => '$' + Math.round(Number(n || 0) / 1e3).toLocaleString('en-GB') + 'k';
const num = (n, d = 0) => Number(n || 0).toLocaleString('en-GB', { minimumFractionDigits: d, maximumFractionDigits: d });
const pct = (n, d = 1) => (Number(n || 0) * 100).toFixed(d) + '%';

let FIG = 0;
const figure = (title, sub, svg, source) => {
  FIG += 1;
  return `<figure class="fig">
    <figcaption class="fig__cap">
      <span class="fig__n">Figure ${FIG}</span>
      <span class="fig__t">${esc(title)}</span>
      ${sub ? `<span class="fig__s">${esc(sub)}</span>` : ''}
    </figcaption>
    <div class="fig__art">${svg}</div>
    <p class="fig__src">${esc(source || 'WEC-LC Financial Model. Planning estimates, not historical results.')}</p>
  </figure>`;
};

let TAB = 0;

/* A COLUMN IS RIGHT-ALIGNED BECAUSE IT HOLDS FIGURES, NOT BECAUSE IT IS
   NOT THE FIRST ONE. The first draft right-aligned every column after
   column one, which is correct for a financial ledger and wrong the
   moment a table carries a qualification name or a mitigation in the
   middle of it: the prose ragged left, wrapped against the number
   beside it, and read as a fault. Alignment is decided per column from
   what the column actually contains. */
const NUMERIC = /^[-+(]?[$£€]?[\d.,]+[%)MKk]*$|^[—–-]$|^$/;
const columnIsNumeric = (rows, i) => {
  const cells = rows.map((r) => (r.cells || r)[i])
    .map((c) => String(c ?? '').replace(/<[^>]*>/g, '').trim());
  const real = cells.filter((c) => c !== '');
  return real.length > 0 && real.every((c) => NUMERIC.test(c));
};

const table = (title, sub, head, rows, source, opts = {}) => {
  TAB += 1;
  const cls = opts.compact ? ' ledger--compact' : '';
  const right = head.map((_, i) => (i === 0 ? false : columnIsNumeric(rows, i)));
  const a = (i) => (right[i] ? ' class="r"' : '');
  return `<div class="tbl">
    <div class="tbl__cap"><span class="tbl__n">Table ${TAB}</span><span class="tbl__t">${esc(title)}</span>
    ${sub ? `<span class="tbl__s">${esc(sub)}</span>` : ''}</div>
    <table class="ledger${cls}">
      <thead><tr>${head.map((h, i) => `<th${a(i)}>${h}</th>`).join('')}</tr></thead>
      <tbody>${rows.map((r) => `<tr${r.strong ? ' class="strong"' : ''}${r.rule ? ' class="ruled"' : ''}>${
        (r.cells || r).map((c, i) => `<td${a(i)}>${c}</td>`).join('')}</tr>`).join('')}</tbody>
    </table>
    <p class="tbl__src">${esc(source || 'WEC-LC Financial Model.')}</p>
  </div>`;
};

const chip = (kind) => {
  const map = {
    verified: ['VERIFIED', K.sage],
    assumption: ['MODELLED ASSUMPTION', K.imperial],
    board: ['BOARD DECISION REQUIRED', K.crimson],
    illustrative: ['ILLUSTRATIVE / DIRECTIONAL', K.soft],
    target: ['TARGET', K.gold],
  };
  const [label, colour] = map[kind] || map.assumption;
  return `<span class="chip" style="--c:${colour}">${label}</span>`;
};

// ═══════════════════════════════════════════════════════════════════
// THE DRAWING TOOLKIT
// Every chart is an inline SVG with its own axis, its own labels and
// its own annotation. None of them is decorative.
// ═══════════════════════════════════════════════════════════════════

function axes(w, h, pad, { xLabels, yMax, yTicks = 5, yFmt = m$ }) {
  const x0 = pad.l, y0 = h - pad.b, x1 = w - pad.r, y1 = pad.t;
  let g = '';
  for (let i = 0; i <= yTicks; i++) {
    const v = (yMax / yTicks) * i;
    const y = y0 - ((y0 - y1) * i) / yTicks;
    g += `<line x1="${x0}" y1="${y}" x2="${x1}" y2="${y}" stroke="${K.rule}" stroke-width="${i ? 0.5 : 1}"/>`;
    g += `<text x="${x0 - 8}" y="${y + 3}" text-anchor="end" font-size="8" fill="${K.soft}" font-family="${SANS}">${yFmt(v)}</text>`;
  }
  xLabels.forEach((lab, i) => {
    const x = x0 + ((x1 - x0) / (xLabels.length - 1 || 1)) * i;
    g += `<text x="${x}" y="${y0 + 15}" text-anchor="middle" font-size="8" fill="${K.soft}" font-family="${SANS}">${esc(lab)}</text>`;
  });
  return { g, x0, y0, x1, y1, xAt: (i) => x0 + ((x1 - x0) / (xLabels.length - 1 || 1)) * i, yAt: (v) => y0 - ((y0 - y1) * v) / yMax };
}

/** Three scenarios as a band with the expected case drawn through it. */
function scenarioBand(all) {
  const w = 720, h = 300, pad = { l: 58, r: 20, t: 18, b: 30 };
  const years = all[1].years.map((y) => String(y.calendar));
  const yMax = Math.ceil(Math.max(...all[2].years.map((y) => y.netTuition)) / 5e6) * 5e6;
  const A = axes(w, h, pad, { xLabels: years, yMax });
  const pts = (m) => m.years.map((y, i) => `${A.xAt(i)},${A.yAt(y.netTuition)}`).join(' ');
  const band = all[2].years.map((y, i) => `${A.xAt(i)},${A.yAt(y.netTuition)}`).join(' ')
    + ' ' + all[0].years.map((y, i) => `${A.xAt(i)},${A.yAt(y.netTuition)}`).reverse().join(' ');
  return `<svg viewBox="0 0 ${w} ${h}" width="100%">
    ${A.g}
    <polygon points="${band}" fill="${K.goldWash}" opacity=".55"/>
    <polyline points="${pts(all[0])}" fill="none" stroke="${K.soft}" stroke-width="1" stroke-dasharray="3 2"/>
    <polyline points="${pts(all[2])}" fill="none" stroke="${K.gold}" stroke-width="1"/>
    <polyline points="${pts(all[1])}" fill="none" stroke="${K.navy}" stroke-width="2.4"/>
    ${all[1].years.map((y, i) => `<circle cx="${A.xAt(i)}" cy="${A.yAt(y.netTuition)}" r="2.6" fill="${K.navy}"/>`).join('')}
    <text x="${A.xAt(9)}" y="${A.yAt(all[2].years[9].netTuition) - 8}" text-anchor="end" font-size="8.5" fill="${K.gold}" font-family="${SANS}">Growth ${m$(all[2].years[9].netTuition)}</text>
    <text x="${A.xAt(9)}" y="${A.yAt(all[1].years[9].netTuition) - 8}" text-anchor="end" font-size="9" font-weight="700" fill="${K.navy}" font-family="${SANS}">Expected ${m$(all[1].years[9].netTuition)}</text>
    <text x="${A.xAt(9)}" y="${A.yAt(all[0].years[9].netTuition) + 14}" text-anchor="end" font-size="8.5" fill="${K.soft}" font-family="${SANS}">Conservative ${m$(all[0].years[9].netTuition)}</text>
  </svg>`;
}

/** Active learners, taught and independent, stacked. */
function enrolmentCurve(m) {
  const w = 720, h = 260, pad = { l: 52, r: 20, t: 16, b: 30 };
  const years = m.years.map((y) => String(y.calendar));
  const yMax = Math.ceil(Math.max(...m.years.map((y) => y.activeStudents)) / 500) * 500;
  const A = axes(w, h, pad, { xLabels: years, yMax, yFmt: (v) => num(v) });
  const bw = (A.x1 - A.x0) / m.years.length * 0.52;
  let bars = '';
  m.years.forEach((y, i) => {
    const x = A.xAt(i) - bw / 2;
    const yt = A.yAt(y.activeTaught), yi = A.yAt(y.activeStudents);
    bars += `<rect x="${x}" y="${yi}" width="${bw}" height="${A.yAt(y.activeTaught) - yi}" fill="${K.goldPale}"/>`;
    bars += `<rect x="${x}" y="${yt}" width="${bw}" height="${A.y0 - yt}" fill="${K.navy}"/>`;
  });
  return `<svg viewBox="0 0 ${w} ${h}" width="100%">${A.g}${bars}
    <rect x="${A.x1 - 168}" y="${A.y1}" width="9" height="9" fill="${K.navy}"/><text x="${A.x1 - 155}" y="${A.y1 + 8}" font-size="8" fill="${K.soft}" font-family="${SANS}">Taught (enrolled and sponsored)</text>
    <rect x="${A.x1 - 168}" y="${A.y1 + 14}" width="9" height="9" fill="${K.goldPale}"/><text x="${A.x1 - 155}" y="${A.y1 + 22}" font-size="8" fill="${K.soft}" font-family="${SANS}">Independent candidates</text>
  </svg>`;
}

/** Gross tuition down to surplus, as a waterfall. */
function waterfall(m) {
  const t = m.totals;
  const steps = [
    ['Gross tuition', t.grossTuition, 'up'],
    ['Refunds', -t.refunds, 'down'],
    ['Fee remission', -t.remission, 'down'],
    ['Net tuition', t.netTuition, 'total'],
    ['Acquisition', -t.acquisition, 'down'],
    ['Instruction', -t.instruction, 'down'],
    ['Establishment', -m.years.reduce((n, y) => n + y.cost.establishment, 0), 'down'],
    ['Technology', -m.years.reduce((n, y) => n + y.cost.technology, 0), 'down'],
    ['Operations', -m.years.reduce((n, y) => n + y.cost.operating, 0), 'down'],
    ['Development', -m.years.reduce((n, y) => n + y.cost.development, 0), 'down'],
    ['Surplus', t.surplus, 'total'],
  ];
  const w = 720, h = 300, pad = { l: 58, r: 16, t: 20, b: 58 };
  const yMax = Math.ceil(t.grossTuition / 1e7) * 1e7;
  const x0 = pad.l, y0 = h - pad.b, x1 = w - pad.r, y1 = pad.t;
  const yAt = (v) => y0 - ((y0 - y1) * v) / yMax;
  let g = '';
  for (let i = 0; i <= 5; i++) {
    const v = (yMax / 5) * i, y = yAt(v);
    g += `<line x1="${x0}" y1="${y}" x2="${x1}" y2="${y}" stroke="${K.rule}" stroke-width="${i ? 0.5 : 1}"/>`;
    g += `<text x="${x0 - 8}" y="${y + 3}" text-anchor="end" font-size="8" fill="${K.soft}" font-family="${SANS}">${m$(v)}</text>`;
  }
  const bw = (x1 - x0) / steps.length * 0.62;
  let run = 0;
  steps.forEach((s, i) => {
    const [label, val, kind] = s;
    const cx = x0 + ((x1 - x0) / steps.length) * (i + 0.5);
    let top, bot, fill;
    if (kind === 'total') { top = yAt(Math.max(0, val)); bot = yAt(0); fill = K.navy; run = val; }
    else if (val >= 0) { top = yAt(run + val); bot = yAt(run); fill = K.imperial; run += val; }
    else { top = yAt(run); bot = yAt(run + val); fill = K.goldPale; run += val; }
    g += `<rect x="${cx - bw / 2}" y="${Math.min(top, bot)}" width="${bw}" height="${Math.max(1.5, Math.abs(bot - top))}" fill="${fill}"/>`;
    g += `<text x="${cx}" y="${y0 + 14}" text-anchor="end" font-size="7.4" fill="${K.soft}" font-family="${SANS}" transform="rotate(-42 ${cx} ${y0 + 14})">${esc(label)}</text>`;
    g += `<text x="${cx}" y="${Math.min(top, bot) - 4}" text-anchor="middle" font-size="7.4" font-weight="${kind === 'total' ? 700 : 400}" fill="${kind === 'total' ? K.navy : K.soft}" font-family="${SANS}">${m$(Math.abs(val))}</text>`;
  });
  return `<svg viewBox="0 0 ${w} ${h}" width="100%">${g}</svg>`;
}

/** Where every dollar goes, as one proportional bar. */
function allocationBar(a) {
  const w = 720, h = 132;
  const colours = [K.navy, K.imperial, '#2F4F86', K.gold, K.goldPale, K.goldWash, K.sage];
  let x = 0, bars = '', legend = '';
  a.rows.forEach((r, i) => {
    const bwid = r.share * w;
    bars += `<rect x="${x}" y="24" width="${Math.max(0, bwid)}" height="40" fill="${colours[i % colours.length]}"/>`;
    if (r.share > 0.05) bars += `<text x="${x + bwid / 2}" y="49" text-anchor="middle" font-size="9" font-weight="700" fill="#fff" font-family="${SANS}">${pct(r.share, 0)}</text>`;
    const col = i % 2, row = Math.floor(i / 2);
    legend += `<rect x="${col * 370}" y="${80 + row * 15}" width="9" height="9" fill="${colours[i % colours.length]}"/>`
      + `<text x="${col * 370 + 14}" y="${88 + row * 15}" font-size="8" fill="${K.ink}" font-family="${SANS}">${esc(r.name)} — ${m$(r.amount)} (${pct(r.share)})</text>`;
    x += bwid;
  });
  return `<svg viewBox="0 0 ${w} ${h}" width="100%">
    <text x="0" y="14" font-size="8.5" fill="${K.soft}" font-family="${SANS}">Ten-year net tuition, ${m$(a.net)}, allocated in full</text>
    ${bars}${legend}</svg>`;
}

/** Reserve against the months-of-cost target. */
function reserveChart(m) {
  const w = 720, h = 240, pad = { l: 58, r: 42, t: 18, b: 30 };
  const years = m.years.map((y) => String(y.calendar));
  const yMax = Math.ceil(Math.max(...m.years.map((y) => y.closingReserve)) / 5e6) * 5e6 || 5e6;
  const A = axes(w, h, pad, { xLabels: years, yMax });
  const bw = (A.x1 - A.x0) / m.years.length * 0.5;
  let bars = '', line = '';
  const mMax = Math.max(12, ...m.years.map((y) => y.reserveMonths));
  m.years.forEach((y, i) => {
    const yy = A.yAt(y.closingReserve);
    bars += `<rect x="${A.xAt(i) - bw / 2}" y="${yy}" width="${bw}" height="${A.y0 - yy}" fill="${K.navy}" opacity=".88"/>`;
    line += `${A.xAt(i)},${A.y0 - ((A.y0 - A.y1) * y.reserveMonths) / mMax} `;
  });
  const targetY = A.y0 - ((A.y0 - A.y1) * PLAN.reserve.target_months_of_operating_cost) / mMax;
  return `<svg viewBox="0 0 ${w} ${h}" width="100%">${A.g}${bars}
    <line x1="${A.x0}" y1="${targetY}" x2="${A.x1}" y2="${targetY}" stroke="${K.crimson}" stroke-width="1" stroke-dasharray="4 3"/>
    <text x="${A.x1 + 4}" y="${targetY + 3}" font-size="7.6" fill="${K.crimson}" font-family="${SANS}">target ${PLAN.reserve.target_months_of_operating_cost} mo</text>
    <polyline points="${line}" fill="none" stroke="${K.gold}" stroke-width="1.6"/>
    <text x="${A.x0}" y="${A.y1 - 4}" font-size="8" fill="${K.soft}" font-family="${SANS}">Bars: closing reserve · Gold line: months of operating cost covered</text>
  </svg>`;
}

/** Break-even: what the year needs against what it has. */
function breakEvenChart(be) {
  const w = 720, h = 250, pad = { l: 58, r: 20, t: 18, b: 30 };
  const years = be.map((b) => String(b.calendar));
  const yMax = Math.ceil(Math.max(...be.map((b) => Math.max(b.actualLearners, b.breakEvenLearners || 0))) / 500) * 500;
  const A = axes(w, h, pad, { xLabels: years, yMax, yFmt: (v) => num(v) });
  const bw = (A.x1 - A.x0) / be.length * 0.34;
  let g = '';
  be.forEach((b, i) => {
    const need = b.breakEvenLearners || 0;
    g += `<rect x="${A.xAt(i) - bw}" y="${A.yAt(need)}" width="${bw}" height="${A.y0 - A.yAt(need)}" fill="${K.goldPale}"/>`;
    g += `<rect x="${A.xAt(i)}" y="${A.yAt(b.actualLearners)}" width="${bw}" height="${A.y0 - A.yAt(b.actualLearners)}" fill="${b.clears ? K.navy : K.crimson}"/>`;
  });
  const first = be.find((b) => b.clears);
  return `<svg viewBox="0 0 ${w} ${h}" width="100%">${A.g}${g}
    <rect x="${A.x1 - 240}" y="${A.y1}" width="9" height="9" fill="${K.goldPale}"/><text x="${A.x1 - 227}" y="${A.y1 + 8}" font-size="8" fill="${K.soft}" font-family="${SANS}">Learners needed to break even</text>
    <rect x="${A.x1 - 240}" y="${A.y1 + 14}" width="9" height="9" fill="${K.navy}"/><text x="${A.x1 - 227}" y="${A.y1 + 22}" font-size="8" fill="${K.soft}" font-family="${SANS}">Learners the plan produces</text>
    ${first ? `<text x="${A.xAt(first.year - 1)}" y="${A.y1 + 40}" text-anchor="middle" font-size="8.4" font-weight="700" fill="${K.navy}" font-family="${SANS}">breaks even ${first.calendar}</text>` : ''}
  </svg>`;
}

/** Sensitivity, as a tornado about the expected case. */
function tornado(sens) {
  const w = 720, rowH = 22, h = sens.length * rowH + 48;
  const sorted = [...sens].sort((a, b) => Math.abs(b.netDelta) - Math.abs(a.netDelta));
  const max = Math.max(...sorted.map((s) => Math.abs(s.netDelta))) || 1;
  const cx = 330;
  let g = `<line x1="${cx}" y1="22" x2="${cx}" y2="${h - 18}" stroke="${K.navy}" stroke-width="1"/>`;
  g += `<text x="${cx}" y="16" text-anchor="middle" font-size="8" fill="${K.soft}" font-family="${SANS}">expected case</text>`;
  sorted.forEach((s, i) => {
    const y = 28 + i * rowH;
    const len = (Math.abs(s.netDelta) / max) * 300;
    const neg = s.netDelta < 0;
    g += `<rect x="${neg ? cx - len : cx}" y="${y}" width="${len}" height="13" fill="${neg ? K.crimson : K.sage}" opacity=".85"/>`;
    g += `<text x="${cx - 310}" y="${y + 10}" font-size="8.2" fill="${K.ink}" font-family="${SANS}">${esc(s.label)}</text>`;
    g += `<text x="${neg ? cx - len - 6 : cx + len + 6}" y="${y + 10}" text-anchor="${neg ? 'end' : 'start'}" font-size="8" font-weight="700" fill="${neg ? K.crimson : K.sage}" font-family="${SANS}">${neg ? '' : '+'}${m$(s.netDelta)}</text>`;
  });
  return `<svg viewBox="0 0 ${w} ${h}" width="100%">${g}</svg>`;
}

/** The funnel, as a proportional stack. */
function funnelChart(y) {
  const stages = [
    ['Enquiries', y.funnel.enquiries], ['Qualified', y.funnel.qualified],
    ['Consultations', y.funnel.consultations], ['Applications', y.funnel.applications],
    ['Offers', y.funnel.offers], ['Paid enrolments', y.funnel.paid],
  ];
  const w = 720, rowH = 30, h = stages.length * rowH + 26;
  const max = stages[0][1] || 1;
  let g = '';
  stages.forEach(([label, v], i) => {
    const bw = (v / max) * 430;
    const yy = 16 + i * rowH;
    const shade = [K.goldWash, K.goldPale, K.gold, '#2F4F86', K.imperial, K.navy][i];
    g += `<rect x="176" y="${yy}" width="${Math.max(2, bw)}" height="20" fill="${shade}"/>`;
    g += `<text x="168" y="${yy + 14}" text-anchor="end" font-size="8.6" fill="${K.ink}" font-family="${SANS}">${esc(label)}</text>`;
    g += `<text x="${176 + bw + 8}" y="${yy + 14}" font-size="8.6" font-weight="${i === stages.length - 1 ? 700 : 400}" fill="${K.ink}" font-family="${SANS}">${num(Math.round(v))}</text>`;
    if (i) {
      const rate = v / stages[i - 1][1];
      g += `<text x="${176 + bw + 58}" y="${yy + 14}" font-size="7.6" fill="${K.soft}" font-family="${SANS}">${pct(rate, 0)} of previous</text>`;
    }
  });
  return `<svg viewBox="0 0 ${w} ${h}" width="100%">${g}</svg>`;
}

/** The qualification ladder, drawn as an ascent. */
function ladder(B) {
  const names = ['Foundation', 'Elementary', 'Intermediate', 'Upper Intermediate', 'Advanced', 'English Mastery'];
  const cefr = ['A1', 'A2', 'B1', 'B2', 'C1', 'C2'];
  const romans = ['I', 'II', 'III', 'IV', 'V', 'VI'];
  const w = 720, h = 250;
  let g = '';
  const bw = 96, gap = 18;
  names.forEach((n, i) => {
    const bh = 32 + i * 26;
    const x = 40 + i * (bw + gap), y = h - 54 - bh;
    const dark = i >= 3;
    g += `<rect x="${x}" y="${y}" width="${bw}" height="${bh}" fill="${dark ? K.navy : K.imperial}" opacity="${0.55 + i * 0.075}"/>`;
    g += `<text x="${x + bw / 2}" y="${y - 8}" text-anchor="middle" font-size="13" font-weight="700" fill="${K.gold}" font-family="${SERIF}">${romans[i]}</text>`;
    g += `<text x="${x + bw / 2}" y="${h - 36}" text-anchor="middle" font-size="8.4" fill="${K.ink}" font-family="${SANS}">${esc(n)}</text>`;
    g += `<text x="${x + bw / 2}" y="${h - 24}" text-anchor="middle" font-size="8.4" font-weight="700" fill="${K.navy}" font-family="${SANS}">${cefr[i]}</text>`;
    g += `<text x="${x + bw / 2}" y="${h - 12}" text-anchor="middle" font-size="7.6" fill="${K.soft}" font-family="${SANS}">${B.hoursPerLevel}h · ${usd(B.levelFee, 0)}</text>`;
  });
  g += `<line x1="40" y1="${h - 50}" x2="${w - 40}" y2="${h - 50}" stroke="${K.gold}" stroke-width="1"/>`;
  return `<svg viewBox="0 0 ${w} ${h}" width="100%">${g}</svg>`;
}

export const figureCount = () => FIG;
export const tableCount = () => TAB;

export { K, SERIF, SANS, esc, usd, m$, k$, num, pct, figure, table, chip,
  scenarioBand, enrolmentCurve, waterfall, allocationBar, reserveChart,
  breakEvenChart, tornado, funnelChart, ladder, OUT_DIR, OUT_PDF, OUT_HTML, ROOT };
