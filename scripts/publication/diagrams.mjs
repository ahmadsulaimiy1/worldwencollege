/**
 * THE INFORMATION DESIGN.
 *
 * ────────────────────────────────────────────────────────────────────
 * A DIAGRAM THAT DOES NOT MEASURE ANYTHING IS AN ILLUSTRATION
 * ────────────────────────────────────────────────────────────────────
 * Every figure in this file is drawn from the curriculum as it actually
 * stands. Bar lengths are proportional to counts, the ascent's column
 * widths are proportional to duration, the anatomy chart's frequencies
 * are tallied across all 294 items. Nothing is drawn to a shape that
 * looked good and then labelled.
 *
 * That constraint is what separates information design from decoration,
 * and it has teeth: these figures will look wrong the moment the
 * curriculum changes, which is the point. A diagram that cannot become
 * wrong was never telling you anything.
 *
 * The consequence a reader should know about: several of these figures
 * are unflattering. The stage-frequency chart shows a long tail of
 * stages that appear in only a handful of lessons. The assessment map
 * shows every module assessed and no module mapped to a competency.
 * They are printed as measured.
 */
import { LEVEL_PALETTES, C as PAL, TYPE } from './design.mjs';

const esc = (s) => String(s ?? '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
const n = (v) => Math.round(v * 100) / 100;

// Drawn from the type system rather than restated. These were hardcoded
// font strings, which meant the figures were one substitution away from
// being set in a different face from the book around them — the kind of
// drift nobody notices until it is printed.
const FONT = `font-family="${TYPE.sans.replace(/"/g, "'")}"`;
const SERIF = `font-family="${TYPE.serif.replace(/"/g, "'")}"`;

/**
 * One label scale and one rule weight for every figure, so five charts
 * built at different times read as one hand.
 */
export const FIG = {
  axis: 6.2, tick: 6, label: 6.8, value: 8.4, unit: 5.8, roman: 14,
  hair: 0.4, rule: 0.7, bar: 1.3, frame: 1,
};

// ─────────────────────────────────────────────────────────────────────
// 1 · THE ASCENT
// ─────────────────────────────────────────────────────────────────────

/**
 * The ascent: what is constant, and what is not.
 *
 * ────────────────────────────────────────────────────────────────────
 * WHY THIS FIGURE WAS REDRAWN
 * ────────────────────────────────────────────────────────────────────
 * The first version plotted duration against item count and carried the
 * caption "the six levels are not six equal steps". Rendered, it showed
 * six identical columns — because the levels ARE six equal steps: every
 * one is ten modules, forty-nine authored items, a hundred and ten
 * assessment questions and four months. The chart was not wrong. The
 * caption was, and the chart had nothing to say.
 *
 * The quantity that actually varies is depth. Lesson content roughly
 * doubles from the first level to the sixth while the structure holds
 * exactly constant, which is the single most informative fact about the
 * shape of this programme: the architecture is deliberately uniform so
 * that a learner and a teacher always know what a level costs, and the
 * demand inside that architecture rises steeply.
 *
 * So the constants are stated once, in words, at the top — a bar chart
 * of six equal bars is a waste of a page — and the figure plots the
 * variable: words of lesson content per level, with words per item
 * marked, because the second is the one a teacher feels.
 */
export function ascentChart(levels, { w = 760, h = 300 } = {}) {
  const pad = { l: 46, r: 54, t: 52, b: 56 };
  const iw = w - pad.l - pad.r;
  const ih = h - pad.t - pad.b;

  const rows = levels.map((lv) => {
    const items = lv.modules.flatMap((m) => m.lessons);
    const words = items.reduce((a, x) =>
      a + (x.body || '').split(/\s+/).filter(Boolean).length, 0);
    const stages = items.flatMap((x) => x.stages).filter((st) => st.head).length;
    return { lv, items: items.length, words, stages,
      perStage: Math.round(words / (stages || 1)) };
  });
  const max = Math.max(...rows.map((r) => r.words));
  const maxStage = Math.max(...rows.map((r) => r.perStage));

  // The constants, stated rather than plotted.
  const first = rows[0];
  const uniform = rows.every((r) => r.items === first.items)
    && levels.every((l) => l.months === levels[0].months);
  const constants = uniform
    ? `EVERY LEVEL: ${levels[0].modules.length} MODULES · ${first.items} AUTHORED ITEMS · `
      + `${levels[0].modules.flatMap((m) => m.lessons).reduce((a, x) => a + x.questions.length, 0)
      } ASSESSMENT QUESTIONS · ${levels[0].months} MONTHS`
    : 'LEVELS DIFFER IN STRUCTURE — SEE THE MODULE GRID';

  const bw = iw / levels.length;
  const bars = rows.map((r, i) => {
    const p = LEVEL_PALETTES[i];
    const bh = (r.words / max) * ih;
    const x = pad.l + i * bw;
    const y = pad.t + ih - bh;
    const cx = x + bw / 2;
    // The second series is words per NAMED STAGE, not per item.
    //
    // Words per item was plotted here first and was worthless: with the
    // item count identical at every level it is simply the bar height
    // divided by forty-nine, so the marker traced the top of its own bar
    // and its labels collided with the bar labels. Two series that are a
    // linear rescale of each other are one series drawn twice.
    //
    // Words per stage is a genuinely different shape, and it carries the
    // more useful fact: the last level writes FEWER stages, each much
    // longer. That is a real change in how a lesson is built, and it is
    // invisible in the totals.
    const py = pad.t + ih - (r.perStage / maxStage) * ih;
    return `<g>
      <rect x="${n(x + bw * 0.12)}" y="${n(y)}" width="${n(bw * 0.76)}" height="${n(bh)}"
        fill="${p.wash}" stroke="${p.mid}" stroke-width="0.7"/>
      <rect x="${n(x + bw * 0.12)}" y="${n(y)}" width="${n(bw * 0.76)}" height="3" fill="${p.ink}"/>
      <text x="${n(cx)}" y="${n(y - 6)}" text-anchor="middle" ${FONT} font-size="8.4"
        font-weight="700" fill="${p.ink}">${r.words.toLocaleString('en-GB')}</text>
      <line x1="${n(x + bw * 0.06)}" y1="${n(py)}" x2="${n(x + bw * 0.94)}" y2="${n(py)}"
        stroke="${PAL.deepCrimson}" stroke-width="1.3"/>
      <circle cx="${n(cx)}" cy="${n(py)}" r="2.1" fill="${PAL.deepCrimson}"/>
      <text x="${n(x + bw * 0.06)}" y="${n(py - 4)}" ${FONT} font-size="6.8"
        font-weight="700" fill="${PAL.deepCrimson}">${r.perStage}</text>
      <text x="${n(x + bw * 0.06)}" y="${n(py + 9)}" ${FONT} font-size="5.6"
        fill="${PAL.deepCrimson}" opacity=".75">${r.stages} stages</text>
      <text x="${n(cx)}" y="${n(pad.t + ih + 16)}" text-anchor="middle" ${SERIF} font-size="14"
        font-weight="700" fill="${p.ink}">${esc(r.lv.roman)}</text>
      <text x="${n(cx)}" y="${n(pad.t + ih + 27)}" text-anchor="middle" ${FONT} font-size="6.8"
        font-weight="700" fill="${p.mid}">${esc(r.lv.cefr)}</text>
      <text x="${n(cx)}" y="${n(pad.t + ih + 38)}" text-anchor="middle" ${FONT} font-size="6.2"
        fill="${PAL.slateGrey}">${esc(r.lv.name.replace(/ Programme$/, ''))}</text>
    </g>`;
  }).join('');

  const grid = [0.25, 0.5, 0.75, 1].map((f) => {
    const y = pad.t + ih - f * ih;
    return `<line x1="${pad.l}" y1="${n(y)}" x2="${n(pad.l + iw)}" y2="${n(y)}"
        stroke="${PAL.platinum}" stroke-width="0.4"/>
      <text x="${pad.l - 5}" y="${n(y + 3)}" text-anchor="end" ${FONT} font-size="6"
        fill="${PAL.slateGrey}">${Math.round((f * max) / 1000)}k</text>`;
  }).join('');

  const growth = Math.round((rows[rows.length - 1].words / rows[0].words) * 10) / 10;
  const stageGrowth = Math.round((rows[rows.length - 1].perStage / rows[0].perStage) * 10) / 10;

  return `<svg viewBox="0 0 ${w} ${h}" width="100%" role="img"
    aria-label="Words of lesson content at each level, with words per authored item marked; the structural counts are identical at every level"
    xmlns="http://www.w3.org/2000/svg">
    <rect x="0" y="0" width="${w}" height="20" fill="${PAL.softCream}"/>
    <text x="8" y="13.5" ${FONT} font-size="6.6" font-weight="700" letter-spacing="1.1"
      fill="${PAL.bronze}">${constants}</text>
    <text x="${pad.l}" y="36" ${FONT} font-size="6.4" letter-spacing="1.2"
      fill="${PAL.royalBlue}">BARS · WORDS OF LESSON CONTENT</text>
    <text x="${n(pad.l + iw)}" y="36" text-anchor="end" ${FONT} font-size="6.4" letter-spacing="1.2"
      fill="${PAL.deepCrimson}">RULES · WORDS PER NAMED STAGE</text>
    ${grid}${bars}
    <line x1="${pad.l}" y1="${n(pad.t + ih)}" x2="${n(pad.l + iw)}" y2="${n(pad.t + ih)}"
      stroke="${PAL.royalBlue}" stroke-width="1"/>
    <text x="${n(w / 2)}" y="${n(h - 4)}" text-anchor="middle" ${FONT} font-size="6.4"
      fill="${PAL.slateGrey}">Identical architecture throughout: content rises ${growth}× and the
      average stage grows ${stageGrowth}× longer between the first level and the sixth.</text>
  </svg>`;
}

// ─────────────────────────────────────────────────────────────────────
// 2 · THE MODULE ARCHITECTURE
// ─────────────────────────────────────────────────────────────────────

/**
 * All sixty modules as small multiples: one cell per module, six rows
 * of ten, each cell divided into its teaching items, its assessed quiz
 * and its assessed assignment.
 *
 * Small multiples are the right form here because the claim being made
 * is about REGULARITY — every module in the programme has the same
 * assessment spine — and regularity is a pattern the eye reads
 * instantly across a grid and cannot read at all from a table of
 * sixty rows. Where a module departs from the pattern, the grid shows
 * it without a word of commentary.
 */
export function architectureGrid(levels, { w = 760, cell = 62, gap = 5 } = {}) {
  const rowH = 46;
  const labelW = 74;
  const h = levels.length * (rowH + gap) + 34;
  const rows = levels.map((lv, i) => {
    const p = LEVEL_PALETTES[i];
    const y = 26 + i * (rowH + gap);
    const cw = (w - labelW - 8) / 10 - gap;
    const cells = lv.modules.map((m, j) => {
      const x = labelW + j * (cw + gap);
      const teach = m.lessons.filter((l) => l.kind === 'reading').length;
      const quiz = m.lessons.filter((l) => l.kind === 'quiz').length;
      const asg = m.lessons.filter((l) => l.kind === 'assignment').length;
      const totalUnits = teach + quiz + asg;
      const uh = (rowH - 16) / Math.max(totalUnits, 1);
      let uy = y + 13;
      const bars = [
        ...Array(teach).fill(['teach', p.mid, 0.55]),
        ...Array(quiz).fill(['quiz', p.ink, 1]),
        ...Array(asg).fill(['asg', PAL.deepCrimson, 1]),
      ].map(([, col, op]) => {
        const r = `<rect x="${n(x)}" y="${n(uy)}" width="${n(cw)}" height="${n(uh - 0.9)}"
          fill="${col}" opacity="${op}"/>`;
        uy += uh;
        return r;
      }).join('');
      return `${bars}<text x="${n(x + cw / 2)}" y="${n(y + 9)}" text-anchor="middle" ${FONT}
        font-size="5.8" fill="${PAL.slateGrey}">${m.sequence}</text>`;
    }).join('');
    return `<text x="0" y="${n(y + 26)}" ${SERIF} font-size="12" font-weight="700"
        fill="${p.ink}">${esc(lv.roman)}</text>
      <text x="17" y="${n(y + 26)}" ${FONT} font-size="6.2" fill="${PAL.slateGrey}"
        >${esc(lv.cefr)}</text>${cells}`;
  }).join('');

  const key = [['Teaching lesson', LEVEL_PALETTES[0].mid, 0.55],
    ['Assessed quiz', LEVEL_PALETTES[0].ink, 1],
    ['Assessed assignment', PAL.deepCrimson, 1]]
    .map(([label, col, op], i) => `<g transform="translate(${labelW + i * 150} 8)">
      <rect width="9" height="7" fill="${col}" opacity="${op}"/>
      <text x="14" y="6.6" ${FONT} font-size="6.6" fill="${PAL.slateGrey}">${label}</text></g>`).join('');

  return `<svg viewBox="0 0 ${w} ${h}" width="100%" role="img"
    aria-label="All sixty modules, six levels of ten, each divided into teaching items and its two assessments"
    xmlns="http://www.w3.org/2000/svg">${key}${rows}</svg>`;
}

// ─────────────────────────────────────────────────────────────────────
// 3 · THE ANATOMY OF A LESSON
// ─────────────────────────────────────────────────────────────────────

/**
 * Which stages the house structure actually uses, ranked by how often
 * they occur, with the designed timing where the curriculum sets one.
 *
 * This is the figure that tells a teacher what the programme believes a
 * lesson is. It is also the most self-critical page in the book: the
 * tail shows stages that appear in only a handful of lessons, which is
 * either deliberate variation or drift, and the figure does not decide
 * which. It reports.
 */
export function lessonAnatomy(curriculum, { w = 760 } = {}) {
  const stages = curriculum.levels.flatMap((l) => l.modules)
    .flatMap((m) => m.lessons).flatMap((x) => x.stages).filter((s) => s.head);

  const tally = new Map();
  for (const s of stages) {
    const key = s.head;
    const e = tally.get(key) || { head: key, icon: s.icon, count: 0, mins: [] };
    e.count++;
    const mm = s.timing && s.timing.match(/(\d+)/);
    if (mm) e.mins.push(Number(mm[1]));
    tally.set(key, e);
  }
  const ranked = [...tally.values()].sort((a, b) => b.count - a.count);
  const shown = ranked.slice(0, 18);
  const max = shown[0].count;
  const rowH = 15.5;
  const labelW = 210;
  const barW = w - labelW - 96;
  const h = shown.length * rowH + 32;

  const rows = shown.map((e, i) => {
    const y = 20 + i * rowH;
    const bw = (e.count / max) * barW;
    const med = e.mins.length
      ? e.mins.slice().sort((a, b) => a - b)[Math.floor(e.mins.length / 2)] : null;
    return `<text x="${labelW - 6}" y="${n(y + 8)}" text-anchor="end" ${FONT} font-size="7"
        fill="${PAL.warmCharcoal}">${esc(e.head)}</text>
      <rect x="${labelW}" y="${n(y + 1.5)}" width="${n(bw)}" height="8.5"
        fill="${PAL.royalBlue}" opacity="${n(0.35 + 0.55 * (e.count / max))}"/>
      <text x="${n(labelW + bw + 5)}" y="${n(y + 8.4)}" ${FONT} font-size="6.8"
        fill="${PAL.slateGrey}">${e.count}</text>
      <text x="${w}" y="${n(y + 8.4)}" text-anchor="end" ${FONT} font-size="6.6"
        fill="${med ? PAL.bronze : PAL.platinum}">${med ? `${med} min` : 'not timed'}</text>`;
  }).join('');

  const tail = ranked.length - shown.length;
  return `<svg viewBox="0 0 ${w} ${h}" width="100%" role="img"
    aria-label="Lesson stages ranked by frequency across all authored items, with median designed timing"
    xmlns="http://www.w3.org/2000/svg">
    <text x="${labelW}" y="10" ${FONT} font-size="6.2" letter-spacing="1.2"
      fill="${PAL.slateGrey}">OCCURRENCES ACROSS ${stages.length} NAMED STAGES</text>
    <text x="${w}" y="10" text-anchor="end" ${FONT} font-size="6.2" letter-spacing="1.2"
      fill="${PAL.slateGrey}">MEDIAN DESIGNED TIMING</text>
    ${rows}
    ${tail > 0 ? `<text x="${labelW}" y="${n(h - 4)}" ${FONT} font-size="6.4"
      fill="${PAL.slateGrey}">and ${tail} further stage names occurring less often</text>` : ''}
  </svg>`;
}

// ─────────────────────────────────────────────────────────────────────
// 4 · THE ASSESSMENT MAP
// ─────────────────────────────────────────────────────────────────────

/**
 * What is assessed at each level, and against what.
 *
 * The right column is the honest one. Every module carries two
 * assessments and a full grading rubric; not one of the 120 assessments
 * is mapped to a named competency, because that mapping is the founding
 * task of the Board of Academic Standards and Curriculum Excellence and
 * has not yet been done. Printing the column empty is the point — a
 * qualification claiming competency verification has to show where the
 * competencies attach, or show that they do not yet.
 */
export function assessmentMap(levels, rubricCriteria, { w = 760 } = {}) {
  const rowH = 40;
  const h = levels.length * rowH + 46;
  const colX = [0, 150, 300, 420, 540, 640];
  const heads = ['Level', 'Assessed quizzes', 'Questions', 'Assignments',
    'Rubric criteria', 'Mapped to competency'];
  const head = heads.map((t, i) => `<text x="${colX[i]}" y="12" ${FONT} font-size="6.4"
    font-weight="700" letter-spacing="1.1" fill="${PAL.royalBlue}">${t.toUpperCase()}</text>`).join('');

  const rows = levels.map((lv, i) => {
    const p = LEVEL_PALETTES[i];
    const y = 26 + i * rowH;
    const items = lv.modules.flatMap((m) => m.lessons);
    const quizzes = items.filter((x) => x.kind === 'quiz').length;
    const qs = items.reduce((a, x) => a + x.questions.length, 0);
    const asg = items.filter((x) => x.kind === 'assignment').length;
    const crit = rubricCriteria[lv.roman] || 0;
    const cellTxt = (x, t, bold) => `<text x="${x}" y="${n(y + 18)}" ${bold ? SERIF : FONT}
      font-size="${bold ? 12 : 9}" ${bold ? 'font-weight="700"' : ''}
      fill="${bold ? p.ink : PAL.warmCharcoal}">${t}</text>`;
    return `<line x1="0" y1="${n(y - 4)}" x2="${w}" y2="${n(y - 4)}"
        stroke="${PAL.platinum}" stroke-width="0.5"/>
      <rect x="0" y="${n(y - 4)}" width="3" height="${n(rowH - 4)}" fill="${p.mid}"/>
      ${cellTxt(colX[0] + 8, `${lv.roman} · ${esc(lv.name)}`, true)}
      ${cellTxt(colX[1], quizzes)}${cellTxt(colX[2], qs)}${cellTxt(colX[3], asg)}
      ${cellTxt(colX[4], crit)}
      <text x="${colX[5]}" y="${n(y + 18)}" ${FONT} font-size="8" font-weight="700"
        fill="${PAL.deepCrimson}">None</text>`;
  }).join('');

  return `<svg viewBox="0 0 ${w} ${h}" width="100%" role="img"
    aria-label="Assessment at each level: quizzes, questions, assignments, rubric criteria, and competency mapping"
    xmlns="http://www.w3.org/2000/svg">${head}${rows}
    <line x1="0" y1="${n(h - 18)}" x2="${w}" y2="${n(h - 18)}" stroke="${PAL.royalBlue}" stroke-width="1"/>
    <text x="0" y="${n(h - 5)}" ${FONT} font-size="6.6" fill="${PAL.slateGrey}"
      >Counted from the academic database at generation.</text>
    <text x="${colX[5]}" y="${n(h - 5)}" ${FONT} font-size="6.6" fill="${PAL.deepCrimson}"
      >0 of 120 assessments mapped.</text>
  </svg>`;
}

// ─────────────────────────────────────────────────────────────────────
// 5 · THE FOUR SKILLS ACROSS THE ASCENT
// ─────────────────────────────────────────────────────────────────────

/**
 * How often each productive and receptive skill is practised as a named
 * stage, level by level — a small-multiple line for each skill.
 *
 * Normalised per hundred items, because the levels differ in size and
 * raw counts would say only that some levels are longer.
 */
export function skillsAcrossLevels(levels, { w = 760, h = 220 } = {}) {
  const SKILLS = [
    ['Speaking', /SPEAKING/i, PAL.royalBlue],
    ['Listening', /LISTENING/i, PAL.imperialBlue],
    ['Reading', /READING/i, PAL.bronze],
    ['Writing', /WRITING/i, PAL.deepCrimson],
  ];
  const pad = { l: 34, r: 96, t: 20, b: 34 };
  const iw = w - pad.l - pad.r;
  const ih = h - pad.t - pad.b;

  const series = SKILLS.map(([name, re, col]) => {
    const pts = levels.map((lv) => {
      const items = lv.modules.flatMap((m) => m.lessons);
      const hits = items.flatMap((x) => x.stages).filter((s) => s.head && re.test(s.head)).length;
      return items.length ? (hits / items.length) * 100 : 0;
    });
    return { name, col, pts };
  });
  const max = Math.max(10, ...series.flatMap((s) => s.pts));

  const px = (i) => pad.l + (i / (levels.length - 1)) * iw;
  const py = (v) => pad.t + ih - (v / max) * ih;

  const lines = series.map((s) => {
    const d = s.pts.map((v, i) => `${i ? 'L' : 'M'}${n(px(i))} ${n(py(v))}`).join('');
    const dots = s.pts.map((v, i) =>
      `<circle cx="${n(px(i))}" cy="${n(py(v))}" r="2.2" fill="${s.col}"/>`).join('');
    const last = s.pts[s.pts.length - 1];
    return `<path d="${d}" fill="none" stroke="${s.col}" stroke-width="1.4"
        stroke-linejoin="round"/>${dots}
      <text x="${n(px(levels.length - 1) + 8)}" y="${n(py(last) + 3)}" ${FONT} font-size="7.4"
        font-weight="700" fill="${s.col}">${s.name}</text>`;
  }).join('');

  const grid = [0, 0.25, 0.5, 0.75, 1].map((f) => {
    const y = pad.t + ih - f * ih;
    return `<line x1="${pad.l}" y1="${n(y)}" x2="${n(pad.l + iw)}" y2="${n(y)}"
        stroke="${PAL.platinum}" stroke-width="0.4"/>
      <text x="${pad.l - 5}" y="${n(y + 3)}" text-anchor="end" ${FONT} font-size="6"
        fill="${PAL.slateGrey}">${Math.round(f * max)}</text>`;
  }).join('');

  const xlabels = levels.map((lv, i) =>
    `<text x="${n(px(i))}" y="${n(pad.t + ih + 14)}" text-anchor="middle" ${SERIF} font-size="9.5"
      font-weight="700" fill="${LEVEL_PALETTES[i].ink}">${esc(lv.roman)}</text>
     <text x="${n(px(i))}" y="${n(pad.t + ih + 24)}" text-anchor="middle" ${FONT} font-size="6.2"
      fill="${PAL.slateGrey}">${esc(lv.cefr)}</text>`).join('');

  return `<svg viewBox="0 0 ${w} ${h}" width="100%" role="img"
    aria-label="Named skill stages per hundred items at each level, for speaking, listening, reading and writing"
    xmlns="http://www.w3.org/2000/svg">
    <text x="${pad.l}" y="10" ${FONT} font-size="6.2" letter-spacing="1.2"
      fill="${PAL.slateGrey}">NAMED SKILL STAGES PER 100 AUTHORED ITEMS</text>
    ${grid}${lines}${xlabels}</svg>`;
}

void TYPE;
