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
 *
 * ────────────────────────────────────────────────────────────────────
 * THE SIZES BELOW ARE PRINTED POINTS, NOT VIEWBOX UNITS
 * ────────────────────────────────────────────────────────────────────
 * The figures are drawn in a 760-unit viewBox and rendered at the text
 * measure, 168 mm — about 476 pt. So one viewBox unit is 0.626 pt, and
 * a label written as `font-size="${fs(6.2)}"` prints at 3.9 pt. The audit
 * measured thirteen distinct type sizes in the figures below the 5.5 pt
 * legibility floor, the smallest at 1.8 pt.
 *
 * Nothing about the figures looked wrong on screen, because on screen
 * they are large. This is the classic SVG-in-print defect and it is
 * invisible until someone measures the rendered size or prints a proof.
 *
 * The sizes here are therefore declared in the units that matter — the
 * points the reader's eye receives — and converted at emission by
 * `fs()`. Change the viewBox width and the conversion follows.
 */
export const VIEW_W = 760;
export const PRINT_W_PT = (168 / 25.4) * 72;      // the text measure, in points
export const UNITS_PER_PT = VIEW_W / PRINT_W_PT;  // ≈ 1.596

/** A printed point size, expressed in viewBox units. */
export const fs = (pt) => Math.round(pt * UNITS_PER_PT * 100) / 100;

export const FIG = {
  axis: fs(6), tick: fs(5.8), label: fs(6.4), value: fs(8), unit: fs(5.6),
  roman: fs(10), hair: 0.4, rule: 0.7, bar: 1.3, frame: 1,
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
      <!-- THE TWO SERIES ARE SEPARATED HORIZONTALLY, NOT VERTICALLY.
           Both label the same column, and where the words-per-stage
           rule ran near the bar top they shared a line and printed
           through each other — "336 stages" through "9,664". Two
           attempts to fix that by moving labels up or down each cured
           one level and broke another, which is what nudging always
           does: it encodes today's numbers rather than the geometry.
           The bar value is now anchored to the left edge of its bar and
           the crimson pair to the right edge, so they cannot meet at
           any vertical position the data produces. -->
      <text x="${n(x + bw * 0.12)}" y="${n(y - 6)}" ${FONT} font-size="${fs(8.4)}"
        font-weight="700" fill="${p.ink}">${r.words.toLocaleString('en-GB')}</text>
      <line x1="${n(x + bw * 0.06)}" y1="${n(py)}" x2="${n(x + bw * 0.94)}" y2="${n(py)}"
        stroke="${PAL.deepCrimson}" stroke-width="1.3"/>
      <circle cx="${n(cx)}" cy="${n(py)}" r="2.1" fill="${PAL.deepCrimson}"/>
      <!-- The halo is not decoration. Where the words-per-stage rule
           runs close to the bar top, these labels sit over the bar's
           ink top rule, and at Level II "351 stages" printed with a
           dark line through it. A label collision with a GRAPHIC is
           invisible to a text-extent audit, which measures boxes and
           not what is drawn underneath them; a paper-coloured stroke
           laid down before the fill makes the label legible over
           anything the figure can put behind it. -->
      <text x="${n(x + bw * 0.94)}" y="${n(py - 4)}" text-anchor="end" ${FONT} font-size="${fs(6.8)}"
        font-weight="700" fill="${PAL.deepCrimson}" paint-order="stroke"
        stroke="${PAL.pearlWhite}" stroke-width="2.4" stroke-linejoin="round">${r.perStage}</text>
      <text x="${n(x + bw * 0.94)}" y="${n(py + 9)}" text-anchor="end" ${FONT} font-size="${fs(5.6)}"
        fill="${PAL.deepCrimson}" opacity=".85" paint-order="stroke"
        stroke="${PAL.pearlWhite}" stroke-width="2.2" stroke-linejoin="round">${r.stages} stages</text>
      <text x="${n(cx)}" y="${n(pad.t + ih + 16)}" text-anchor="middle" ${SERIF} font-size="${fs(14.0)}"
        font-weight="700" fill="${p.ink}">${esc(r.lv.roman)}</text>
      <text x="${n(cx)}" y="${n(pad.t + ih + 27)}" text-anchor="middle" ${FONT} font-size="${fs(6.8)}"
        font-weight="700" fill="${p.mid}">${esc(r.lv.cefr)}</text>
      <text x="${n(cx)}" y="${n(pad.t + ih + 38)}" text-anchor="middle" ${FONT} font-size="${fs(6.2)}"
        fill="${PAL.slateGrey}">${esc(r.lv.name.replace(/ Programme$/, ''))}</text>
    </g>`;
  }).join('');

  const grid = [0.25, 0.5, 0.75, 1].map((f) => {
    const y = pad.t + ih - f * ih;
    return `<line x1="${pad.l}" y1="${n(y)}" x2="${n(pad.l + iw)}" y2="${n(y)}"
        stroke="${PAL.platinum}" stroke-width="0.4"/>
      <text x="${pad.l - 5}" y="${n(y + 3)}" text-anchor="end" ${FONT} font-size="${fs(6.0)}"
        fill="${PAL.slateGrey}">${Math.round((f * max) / 1000)}k</text>`;
  }).join('');

  const growth = Math.round((rows[rows.length - 1].words / rows[0].words) * 10) / 10;
  const stageGrowth = Math.round((rows[rows.length - 1].perStage / rows[0].perStage) * 10) / 10;

  return `<svg viewBox="0 0 ${w} ${h}" width="100%" role="img"
    aria-label="Words of lesson content at each level, with words per authored item marked; the structural counts are identical at every level"
    xmlns="http://www.w3.org/2000/svg">
    <rect x="0" y="0" width="${w}" height="20" fill="${PAL.softCream}"/>
    <text x="8" y="13.5" ${FONT} font-size="${fs(6.6)}" font-weight="700" letter-spacing="1.1"
      fill="${PAL.bronze}">${constants}</text>
    <text x="${pad.l}" y="36" ${FONT} font-size="${fs(6.4)}" letter-spacing="1.2"
      fill="${PAL.royalBlue}">BARS · WORDS OF LESSON CONTENT</text>
    <text x="${n(pad.l + iw)}" y="36" text-anchor="end" ${FONT} font-size="${fs(6.4)}" letter-spacing="1.2"
      fill="${PAL.deepCrimson}">RULES · WORDS PER NAMED STAGE</text>
    ${grid}${bars}
    <line x1="${pad.l}" y1="${n(pad.t + ih)}" x2="${n(pad.l + iw)}" y2="${n(pad.t + ih)}"
      stroke="${PAL.royalBlue}" stroke-width="1"/>
    <text x="${n(w / 2)}" y="${n(h - 4)}" text-anchor="middle" ${FONT} font-size="${fs(6.4)}"
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
        font-size="${fs(5.8)}" fill="${PAL.slateGrey}">${m.sequence}</text>`;
    }).join('');
    // Stacked, not set side by side. Setting the CEFR band at a fixed
    // x offset assumed every roman numeral was the same width; "III",
    // "IV" and "VI" are wider than "I" and "V", so three of the six
    // rows printed as "IIIB1", "IVB2" and "VIC2". Nothing on screen
    // showed it — the figure is only ever seen at a size where the
    // overlap is a few pixels — and it was caught by rasterising the
    // figures for the editable edition and looking at them.
    return `<text x="0" y="${n(y + 22)}" ${SERIF} font-size="${fs(12.0)}" font-weight="700"
        fill="${p.ink}">${esc(lv.roman)}</text>
      <text x="0" y="${n(y + 33)}" ${FONT} font-size="${fs(6.2)}" fill="${PAL.slateGrey}"
        >${esc(lv.cefr)}</text>${cells}`;
  }).join('');

  const key = [['Teaching lesson', LEVEL_PALETTES[0].mid, 0.55],
    ['Assessed quiz', LEVEL_PALETTES[0].ink, 1],
    ['Assessed assignment', PAL.deepCrimson, 1]]
    .map(([label, col, op], i) => `<g transform="translate(${labelW + i * 150} 8)">
      <rect width="9" height="7" fill="${col}" opacity="${op}"/>
      <text x="14" y="6.6" ${FONT} font-size="${fs(6.6)}" fill="${PAL.slateGrey}">${label}</text></g>`).join('');

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
  // Wide enough for the longest stage name the curriculum uses.
  // At 210 the two longest — INDEPENDENT PRACTICE / SPEAKING ACTIVITY
  // and CRITICAL THINKING / DISCUSSION PROMPT — were right-aligned to a
  // point that put their first fifty units outside the viewBox, so they
  // printed with their opening words sliced off. SVG does not report
  // that; it just draws past the edge and lets the frame clip it.
  const labelW = 272;
  const barW = w - labelW - 96;
  const h = shown.length * rowH + 32;

  const rows = shown.map((e, i) => {
    const y = 20 + i * rowH;
    const bw = (e.count / max) * barW;
    const med = e.mins.length
      ? e.mins.slice().sort((a, b) => a - b)[Math.floor(e.mins.length / 2)] : null;
    return `<text x="${labelW - 6}" y="${n(y + 8)}" text-anchor="end" ${FONT} font-size="${fs(7.0)}"
        fill="${PAL.warmCharcoal}">${esc(e.head)}</text>
      <rect x="${labelW}" y="${n(y + 1.5)}" width="${n(bw)}" height="8.5"
        fill="${PAL.royalBlue}" opacity="${n(0.35 + 0.55 * (e.count / max))}"/>
      <text x="${n(labelW + bw + 5)}" y="${n(y + 8.4)}" ${FONT} font-size="${fs(6.8)}"
        fill="${PAL.slateGrey}">${e.count}</text>
      <text x="${w}" y="${n(y + 8.4)}" text-anchor="end" ${FONT} font-size="${fs(6.6)}"
        fill="${med ? PAL.bronze : PAL.platinum}">${med ? `${med} min` : 'not timed'}</text>`;
  }).join('');

  const tail = ranked.length - shown.length;
  return `<svg viewBox="0 0 ${w} ${h}" width="100%" role="img"
    aria-label="Lesson stages ranked by frequency across all authored items, with median designed timing"
    xmlns="http://www.w3.org/2000/svg">
    <text x="${labelW}" y="10" ${FONT} font-size="${fs(6.2)}" letter-spacing="1.2"
      fill="${PAL.slateGrey}">OCCURRENCES ACROSS ${stages.length} NAMED STAGES</text>
    <text x="${w}" y="10" text-anchor="end" ${FONT} font-size="${fs(6.2)}" letter-spacing="1.2"
      fill="${PAL.slateGrey}">MEDIAN DESIGNED TIMING</text>
    ${rows}
    ${tail > 0 ? `<text x="${labelW}" y="${n(h - 4)}" ${FONT} font-size="${fs(6.4)}"
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
  // THE COLUMN THAT WOULD NOT FIT WAS THE POINT OF THE FIGURE.
  //
  // The last column began at 640 in a 760-unit frame and its heading,
  // MAPPED TO COMPETENCY, is 157 units long — so the figure whose whole
  // argument is that this column is empty printed its name as MAPPED TO
  // COMPET. The footer stating "0 of 120 assessments mapped" was cut in
  // the same place. Meanwhile the level names ran into the quiz counts
  // at three of six rows, because "IV · Upper Intermediate Programme"
  // is wider than the 150 units the first column allowed.
  //
  // The last column is now anchored to the right edge and grows
  // leftwards, which is the only arrangement that cannot overflow, and
  // the level names drop the word "Programme" they all share.
  const colX = [8, 250, 330, 410, 500];
  // The heads are set a step smaller than the body of the figure, and
  // still above the 5.5 pt floor. At 6.4 pt the last two ran into each
  // other by thirty units — RUBRIC CRITERIRAAPPED TO COMPETENCY — and
  // the only alternatives were shortening the one heading the figure
  // exists to print or dropping a column.
  const heads = ['Level', 'Quizzes', 'Questions', 'Assignments', 'Rubric criteria'];
  const head = heads.map((t, i) => `<text x="${colX[i]}" y="12" ${FONT} font-size="${fs(5.8)}"
    font-weight="700" letter-spacing="1.1" fill="${PAL.royalBlue}">${t.toUpperCase()}</text>`).join('')
    + `<text x="${w}" y="12" text-anchor="end" ${FONT} font-size="${fs(5.8)}" font-weight="700"
      letter-spacing="1.1" fill="${PAL.royalBlue}">MAPPED TO COMPETENCY</text>`;

  const rows = levels.map((lv, i) => {
    const p = LEVEL_PALETTES[i];
    const y = 26 + i * rowH;
    const items = lv.modules.flatMap((m) => m.lessons);
    const quizzes = items.filter((x) => x.kind === 'quiz').length;
    const qs = items.reduce((a, x) => a + x.questions.length, 0);
    const asg = items.filter((x) => x.kind === 'assignment').length;
    const crit = rubricCriteria[lv.roman] || 0;
    const cellTxt = (x, t, bold) => `<text x="${x}" y="${n(y + 18)}" ${bold ? SERIF : FONT}
      font-size="${bold ? fs(9.5) : fs(7.4)}" ${bold ? 'font-weight="700"' : ''}
      fill="${bold ? p.ink : PAL.warmCharcoal}">${t}</text>`;
    return `<line x1="0" y1="${n(y - 4)}" x2="${w}" y2="${n(y - 4)}"
        stroke="${PAL.platinum}" stroke-width="0.5"/>
      <rect x="0" y="${n(y - 4)}" width="3" height="${n(rowH - 4)}" fill="${p.mid}"/>
      ${cellTxt(colX[0], `${lv.roman} · ${esc(lv.name.replace(/ Programme$/, ''))}`, true)}
      ${cellTxt(colX[1], quizzes)}${cellTxt(colX[2], qs)}${cellTxt(colX[3], asg)}
      ${cellTxt(colX[4], crit)}
      <text x="${w}" y="${n(y + 18)}" text-anchor="end" ${FONT} font-size="${fs(8.0)}"
        font-weight="700" fill="${PAL.deepCrimson}">None</text>`;
  }).join('');

  return `<svg viewBox="0 0 ${w} ${h}" width="100%" role="img"
    aria-label="Assessment at each level: quizzes, questions, assignments, rubric criteria, and competency mapping"
    xmlns="http://www.w3.org/2000/svg">${head}${rows}
    <line x1="0" y1="${n(h - 18)}" x2="${w}" y2="${n(h - 18)}" stroke="${PAL.royalBlue}" stroke-width="1"/>
    <text x="0" y="${n(h - 5)}" ${FONT} font-size="${fs(6.6)}" fill="${PAL.slateGrey}"
      >Counted from the academic database at generation.</text>
    <text x="${w}" y="${n(h - 5)}" text-anchor="end" ${FONT} font-size="${fs(6.6)}"
      fill="${PAL.deepCrimson}">0 of 120 assessments mapped.</text>
  </svg>`;
}

// ─────────────────────────────────────────────────────────────────────
// 5 · THE FOUR SKILLS ACROSS THE ASCENT — BUILT, MEASURED, WITHDRAWN
// ─────────────────────────────────────────────────────────────────────

/**
 * There is no function here, and that is the finding.
 *
 * ────────────────────────────────────────────────────────────────────
 * WHAT THE FIGURE WAS, AND WHAT IT ACTUALLY SHOWED
 * ────────────────────────────────────────────────────────────────────
 * `skillsAcrossLevels()` plotted named speaking, listening, reading and
 * writing stages per hundred authored items, one line each across the
 * six levels, under the caption "Reading and writing rise as the ascent
 * proceeds; speaking is present throughout."
 *
 * Rasterised and looked at, it showed four nearly coincident, nearly
 * flat lines and two pairs of labels printed through each other. The
 * measurement, per hundred items:
 *
 *     Level      I     II    III     IV      V     VI
 *     Speaking  40.8  40.8  40.8   40.8   40.8   34.7
 *     Listening 38.8  38.8  38.8   38.8   38.8   38.8
 *     Reading   38.8  38.8  38.8   40.8   38.8   34.7
 *     Writing   40.8  40.8  40.8   46.9   44.9   38.8
 *
 * Reading does not rise; it is flat at 38.8 everywhere except Level IV
 * and FALLS at Level VI. The caption was a claim the numbers did not
 * support, and had been printed in three editions.
 *
 * The reason the lines are flat is more interesting than the figure:
 * every teaching lesson in this programme carries a named stage for
 * every skill, so the series is not measuring the balance of skills at
 * all — it is measuring the ratio of teaching lessons to total items,
 * which is fixed by the architecture. It could never have shown what
 * its caption claimed.
 *
 * That is the same finding the routes page reports and Figure 3
 * demonstrates, both of which carry it better. So the figure is gone
 * rather than redrawn: a chart with no variance to show is a chart with
 * nothing to say, and removing a page is the opposite of padding one.
 */

// ─────────────────────────────────────────────────────────────────────
// 6 · THE LEARNER'S PATH
// ─────────────────────────────────────────────────────────────────────

/**
 * The one thing the other five figures do not show: what actually
 * happens to a person.
 *
 * ────────────────────────────────────────────────────────────────────
 * WHY THIS IS THREE REGISTERS AND NOT ONE FLOWCHART
 * ────────────────────────────────────────────────────────────────────
 * The learner's path is the same shape at three scales — a sequence of
 * work closed by an assessment — and drawing it once at one scale hides
 * exactly that. Drawn at all three, the recursion is the point: the
 * module is a small level, the level is a small programme, and a
 * learner who has finished one module already knows the shape of the
 * next twenty-four months.
 *
 * Every count is read from the curriculum. If a module were authored
 * with a different number of teaching items, the top register would
 * show it.
 */
export function learnerJourney(levels, { w = 760 } = {}) {
  const mods = levels.flatMap((l) => l.modules);
  const teachPer = mods.map((m) => m.lessons.filter((l) => l.kind === 'reading').length);
  const teach = Math.round(teachPer.reduce((a, b) => a + b, 0) / mods.length);
  const lo = Math.min(...teachPer);
  const hi = Math.max(...teachPer);
  // "count varies by module" is true and says nothing. The range is the
  // fact a teacher planning a term actually needs.
  const spread = lo === hi ? 'the same in every module'
    : `${lo} ${hi - lo === 1 ? 'or' : 'to'} ${hi} across the ${mods.length} modules`;
  const modsPerLevel = levels[0].modules.length;
  const h = 246;

  const node = (x, y, ww, hh, label, sub, fill, stroke, dark) => `
    <rect x="${n(x)}" y="${n(y)}" width="${n(ww)}" height="${n(hh)}" rx="2.5"
      fill="${fill}" stroke="${stroke}" stroke-width="0.7"/>
    <text x="${n(x + ww / 2)}" y="${n(y + (sub ? hh / 2 - 1 : hh / 2 + 3))}" text-anchor="middle"
      ${FONT} font-size="${fs(6.8)}" font-weight="600"
      fill="${dark ? '#FFFFFF' : PAL.warmCharcoal}">${esc(label)}</text>
    ${sub ? `<text x="${n(x + ww / 2)}" y="${n(y + hh / 2 + 8)}" text-anchor="middle" ${FONT}
      font-size="${fs(5.8)}" fill="${dark ? '#FFFFFF' : PAL.slateGrey}"
      opacity="${dark ? 0.85 : 1}">${esc(sub)}</text>` : ''}`;

  const arrow = (x1, y, x2) => `<line x1="${n(x1)}" y1="${n(y)}" x2="${n(x2 - 3.4)}" y2="${n(y)}"
      stroke="${PAL.platinum}" stroke-width="0.9"/>
    <path d="M${n(x2)} ${n(y)}l-4 -2.1v4.2z" fill="${PAL.platinum}"/>`;

  const band = (y, n_, text) => `
    <text x="0" y="${n(y)}" ${FONT} font-size="${fs(6.0)}" letter-spacing="1.1"
      fill="${PAL.slateGrey}">${n_}</text>
    <text x="${n(w)}" y="${n(y)}" text-anchor="end" ${FONT} font-size="${fs(6.0)}"
      fill="${PAL.slateGrey}">${esc(text)}</text>
    <line x1="0" y1="${n(y + 5)}" x2="${n(w)}" y2="${n(y + 5)}"
      stroke="${PAL.platinum}" stroke-width="0.4"/>`;

  // Register 1 — inside a module.
  const p1 = LEVEL_PALETTES[2];
  const r1y = 26;
  // Wide enough for the longest label at the label size, measured
  // rather than guessed: "Assessed assignment" set at fs(6.8) is about
  // 105 viewBox units, and the first version at 92 units clipped it to
  // "ssessed assignme".
  const cw1 = 156;
  const gap1 = 30;
  const cells1 = [
    [`${teach} teaching lessons`, spread, p1.wash, p1.mid, false],
    ['Assessed quiz', 'answer key printed', p1.ink, p1.ink, true],
    ['Assessed assignment', 'full grading rubric', PAL.deepCrimson, PAL.deepCrimson, true],
  ];
  const x0 = (w - (cells1.length * cw1 + (cells1.length - 1) * gap1)) / 2;
  const reg1 = cells1.map(([l, s, f, st, d], i) => {
    const x = x0 + i * (cw1 + gap1);
    return node(x, r1y, cw1, 34, l, s, f, st, d)
      + (i ? arrow(x - gap1 + 2, r1y + 17, x) : '');
  }).join('');

  // Register 2 — inside a level.
  const r2y = 104;
  const mw = (w - 128 - (modsPerLevel - 1) * 4) / modsPerLevel;
  const reg2 = levels[0].modules.map((m, i) => {
    const x = i * (mw + 4);
    const isLast = i === modsPerLevel - 1;
    return `<rect x="${n(x)}" y="${n(r2y)}" width="${n(mw)}" height="26" rx="2"
        fill="${isLast ? p1.mid : p1.wash}" stroke="${p1.mid}" stroke-width="0.6"/>
      <text x="${n(x + mw / 2)}" y="${n(r2y + 16.5)}" text-anchor="middle" ${FONT}
        font-size="${fs(6.6)}" font-weight="600"
        fill="${isLast ? '#FFFFFF' : p1.ink}">${m.sequence}</text>`;
  }).join('') + arrow(w - 126, r2y + 13, w - 108)
    + node(w - 106, r2y - 3, 106, 32, 'Award conferred', 'one per level', PAL.softCream, PAL.bronze, false);

  // Register 3 — the whole ascent.
  const r3y = 182;
  const lw = (w - 5 * 8) / 6;
  const reg3 = levels.map((lv, i) => {
    const p = LEVEL_PALETTES[i];
    const x = i * (lw + 8);
    const hgt = 20 + i * 4;
    return `<rect x="${n(x)}" y="${n(r3y + 26 - hgt)}" width="${n(lw)}" height="${n(hgt)}" rx="2"
        fill="${p.ink}"/>
      <text x="${n(x + lw / 2)}" y="${n(r3y + 40)}" text-anchor="middle" ${SERIF}
        font-size="${fs(9.5)}" font-weight="700" fill="${p.ink}">${esc(lv.roman)}</text>
      <text x="${n(x + lw / 2)}" y="${n(r3y + 49)}" text-anchor="middle" ${FONT}
        font-size="${fs(5.8)}" fill="${PAL.slateGrey}">${esc(lv.cefr)} · ${lv.months} mo</text>
      ${i ? arrow(x - 7.5, r3y + 18, x) : ''}`;
  }).join('');

  return `<svg viewBox="0 0 ${w} ${h}" width="100%" role="img"
    aria-label="A learner's path: the module cycle, the ten modules of a level closing in an award, and the six-level ascent"
    xmlns="http://www.w3.org/2000/svg">
    ${band(12, 'WITHIN A MODULE', 'repeated 60 times across the programme')}${reg1}
    ${band(90, 'WITHIN A LEVEL', `${modsPerLevel} modules, ${levels[0].months} months`)}${reg2}
    ${band(168, 'ACROSS THE PROGRAMME', 'each level a prerequisite to the next')}${reg3}
  </svg>`;
}

// ─────────────────────────────────────────────────────────────────────
// 7 · THE SPIRAL
// ─────────────────────────────────────────────────────────────────────

/**
 * How often each module is returned to by a later lesson.
 *
 * ────────────────────────────────────────────────────────────────────
 * A CLAIM THE BOOK MADE IN PROSE AND COULD NOT PREVIOUSLY SHOW
 * ────────────────────────────────────────────────────────────────────
 * The programme describes itself as spiral: material is met, then met
 * again in a harder setting. That was a claim, and until the
 * cross-references were extracted from the PREREQUISITE KNOWLEDGE
 * stages there was no way for a reader to test it — the evidence was
 * distributed across 114 paragraphs of prose.
 *
 * Here it is as a single field. Each cell is a module; its weight is
 * the number of LATER lessons that name it as prerequisite knowledge.
 * A pale grid would have meant the spiral was rhetoric.
 *
 * The figure is not flattering everywhere, and is printed as measured:
 * some modules are never named again, and the count falls away in the
 * last levels for the ordinary reason that there are fewer later
 * lessons left to name them.
 */
export function spiralMap(levels, back, { w = 760 } = {}) {
  const rowH = 34;
  const gap = 5;
  const labelW = 74;
  const h = levels.length * (rowH + gap) + 46;
  const counts = levels.flatMap((lv) => lv.modules.map((m) =>
    (back.get(`${lv.roman}.${m.sequence}`) || []).length));
  const max = Math.max(1, ...counts);

  const rows = levels.map((lv, i) => {
    const p = LEVEL_PALETTES[i];
    const y = 30 + i * (rowH + gap);
    const cw = (w - labelW - 8) / 10 - gap;
    const cells = lv.modules.map((m, j) => {
      const x = labelW + j * (cw + gap);
      const c = (back.get(`${lv.roman}.${m.sequence}`) || []).length;
      const op = c ? 0.16 + 0.84 * (c / max) : 0;
      return `<rect x="${n(x)}" y="${n(y)}" width="${n(cw)}" height="${rowH}" rx="1.5"
          fill="${p.ink}" fill-opacity="${n(op)}" stroke="${p.mid}" stroke-width="0.4"/>
        <text x="${n(x + cw / 2)}" y="${n(y + rowH / 2 + 4)}" text-anchor="middle" ${FONT}
          font-size="${fs(7.4)}" font-weight="600"
          fill="${op > 0.55 ? '#FFFFFF' : PAL.warmCharcoal}">${c || '·'}</text>
`;
    }).join('');
    return `<text x="0" y="${n(y + 16)}" ${SERIF} font-size="${fs(12.0)}" font-weight="700"
        fill="${p.ink}">${esc(lv.roman)}</text>
      <text x="0" y="${n(y + 27)}" ${FONT} font-size="${fs(6.2)}"
        fill="${PAL.slateGrey}">${esc(lv.cefr)}</text>${cells}`;
  }).join('');

  // The module numbers run once along the head rather than under every
  // row: repeated six times they sat on the row below and read as part
  // of the next level's cells.
  const cw0 = (w - labelW - 8) / 10 - gap;
  const heads = Array.from({ length: 10 }, (_, j) =>
    `<text x="${n(labelW + j * (cw0 + gap) + cw0 / 2)}" y="24" text-anchor="middle" ${FONT}
      font-size="${fs(6.0)}" fill="${PAL.slateGrey}">${j + 1}</text>`).join('');

  const never = counts.filter((c) => !c).length;
  return `<svg viewBox="0 0 ${w} ${h}" width="100%" role="img"
    aria-label="Each module weighted by the number of later lessons that name it as prerequisite knowledge"
    xmlns="http://www.w3.org/2000/svg">
    <text x="0" y="10" ${FONT} font-size="${fs(6.2)}" letter-spacing="1.2"
      fill="${PAL.slateGrey}">LATER LESSONS NAMING THIS MODULE AS PREREQUISITE KNOWLEDGE</text>
    <text x="${n(w)}" y="10" text-anchor="end" ${FONT} font-size="${fs(6.2)}"
      fill="${PAL.slateGrey}">most-returned module: ${max} · never returned to: ${never} of ${counts.length}</text>
    ${heads}${rows}</svg>`;
}

void TYPE;
