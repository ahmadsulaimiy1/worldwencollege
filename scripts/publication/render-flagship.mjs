/**
 * The flagship edition — the curriculum itself, typeset.
 *
 * Every one of the 294 authored lessons is printed in full: objectives,
 * staged practice with timings, model dialogues set as dialogue, every
 * quiz question with its options and answer key, every assignment brief
 * with its rubric.
 *
 * The previous edition described this content. This one is it.
 */
import { buildCurriculum } from './curriculum.mjs';
import { build as buildInstitutional } from './canonical.mjs';
import { paletteFor, BRAND, TYPE, C as PAL, STAGE_MARK, EMPHASIS_STAGES, ascentOrnament } from './design.mjs';
import { publicationIdentity } from './identity.mjs';
import { frontMatter, backMatter, coverSpread, spineWidth, TRIM, BLEED } from './covers.mjs';
import { guillocheRosette, guillocheBand, girihRosette, frame, cornerFan, fleuron, crest, EMBOSS } from './ornament.mjs';
import { stageIcon, GENERIC_ICON } from './icons.mjs';
import { parseRubric } from './curriculum.mjs';
import { ascentChart, architectureGrid, lessonAnatomy, assessmentMap, skillsAcrossLevels } from './diagrams.mjs';
import { writeFileSync, readFileSync, mkdirSync, existsSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { chromium } from 'playwright';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..');
const C = buildCurriculum();
const I = buildInstitutional();
const ID = publicationIdentity(C, { edition: 1, revision: 0, impression: 1 });

const esc = (s) => String(s ?? '')
  .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
// The source uses `--` for an em dash and straight quotes; a flagship
// edition sets real dashes and real quotation marks. Applied at render
// time so the database keeps its plain text.
const typo = (s) => esc(s)
  .replace(/\s--\s/g, ' — ').replace(/--/g, '—')
  .replace(/(\w)'(\w)/g, '$1’$2')
  .replace(/"([^"]+)"/g, '“$1”');

const ROMAN = ['I', 'II', 'III', 'IV', 'V', 'VI'];
const KIND_LABEL = { reading: 'Lesson', quiz: 'Assessed Quiz', assignment: 'Assessed Assignment' };

// ---- Lesson stages ---------------------------------------------------
function renderParts(parts) {
  const out = [];
  let dialogue = [];
  let items = [];
  const flushD = () => {
    if (!dialogue.length) return;
    out.push(`<div class="dialogue">${dialogue.map((p) =>
      `<p><span class="sp">${esc(p.speaker)}</span>${typo(p.text)}</p>`).join('')}</div>`);
    dialogue = [];
  };
  const flushI = () => {
    if (!items.length) return;
    out.push(`<ol class="items">${items.map((p) =>
      `<li><span class="mk">${esc(p.marker)}</span>${typo(p.text)}</li>`).join('')}</ol>`);
    items = [];
  };
  for (const p of parts) {
    if (p.type === 'dialogue') { flushI(); dialogue.push(p); }
    else if (p.type === 'item') { flushD(); items.push(p); }
    else { flushD(); flushI(); out.push(`<p>${typo(p.text)}</p>`); }
  }
  flushD(); flushI();
  return out.join('');
}

function renderStage(s) {
  if (!s.head) return `<div class="stage stage--intro">${renderParts(s.parts)}</div>`;
  const mark = (s.icon && stageIcon(s.icon, { size: 13 })) || GENERIC_ICON;
  const emph = s.icon && EMPHASIS_STAGES.has(s.icon) ? ' stage--emph' : '';

  // A grading rubric is an instrument, not a paragraph. Where it parses
  // into named criteria it is set as a table; where it does not, the
  // original prose prints unchanged.
  let body;
  if (s.icon === 'rubric') {
    const r = parseRubric(s);
    body = r ? renderRubric(r) : `<div class="stage__b">${renderParts(s.parts)}</div>`;
  } else {
    body = `<div class="stage__b">${renderParts(s.parts)}</div>`;
  }

  return `<section class="stage${emph}">
    <h5 class="stage__h"><span class="stage__mk">${mark}</span>${typo(s.head)}${
  s.timing ? `<span class="stage__t">${typo(s.timing)}</span>` : ''}</h5>
    ${body}
  </section>`;
}

function renderRubric(r) {
  const rows = r.criteria.map((c) => `<tr>
    <td class="rb__n">${c.n}</td>
    <td class="rb__c">${typo(c.name)}</td>
    <td class="rb__d">${typo(c.descriptor)}</td></tr>`).join('');
  return `<div class="stage__b">
    ${r.preamble ? `<p>${typo(r.preamble)}</p>` : ''}
    <table class="rubric"><thead><tr>
      <th scope="col" class="rb__n"></th><th scope="col" class="rb__c">Criterion</th>
      <th scope="col" class="rb__d">What the marker is looking for</th></tr></thead>
      <tbody>${rows}</tbody></table>
    ${r.trailing ? `<p class="rubric__note">${typo(r.trailing)}</p>` : ''}
  </div>`;
}

function renderQuiz(les) {
  const qs = les.questions.map((q) => `<li class="q">
    <p class="q__p">${typo(q.prompt)}</p>
    <ol class="q__c">${q.choices.map((c, i) =>
    `<li${i === q.correctIndex ? ' class="is-key"' : ''}>${typo(c)}</li>`).join('')}</ol>
  </li>`).join('');
  const key = les.questions.map((q) =>
    `<span><b>${q.sequence}</b>${String.fromCharCode(65 + q.correctIndex)}</span>`).join('');
  return `<ol class="quiz">${qs}</ol>
    <div class="answerkey"><p class="answerkey__h">Answer key</p><div class="answerkey__g">${key}</div></div>`;
}

/**
 * The designed duration of a lesson, summed from the timings the
 * curriculum itself sets on its stages.
 *
 * Derived, not invented: if no stage carries a timing the lesson shows
 * none rather than an estimate. A teacher planning a session needs to
 * know whether this fills forty minutes or ninety, and that number was
 * already in the text — it had simply never been added up.
 */
function designedMinutes(les) {
  const mins = les.stages
    .map((s) => (s.timing || '').match(/(\d+)/))
    .filter(Boolean).map((m) => Number(m[1]));
  return mins.length ? mins.reduce((a, b) => a + b, 0) : null;
}

/**
 * The module title with its own number stripped from the front.
 *
 * The titles are stored as "Module 4: Opinions & Debate", which is right
 * for a database and wrong beside a numeral panel already reading
 * MODULE 4 — the reader is told twice and the second telling makes the
 * first look like a mistake. The full stored title still appears in the
 * contents, so nothing is lost from the volume.
 */
function shortModuleTitle(mod) {
  return String(mod.title).replace(/^\s*Module\s+\d+\s*[:\u2014\u2013-]\s*/i, '');
}

function renderLesson(les, lv, mod) {
  const kind = KIND_LABEL[les.kind] || 'Lesson';
  const ref = `${lv.roman}.${mod.sequence}.${les.sequence}`;
  const mins = designedMinutes(les);
  const named = les.stages.filter((s) => s.head).length;
  const isAssessed = les.kind !== 'reading';

  // The stage tape: the shape of the session, drawn from its own stages,
  // set above the title so a teacher sees the shape before reading it.
  //
  // It is suppressed unless the stages actually DIFFER. A lesson whose
  // four stages are all vocabulary produced four identical marks in a
  // row — noise wearing the costume of information, which is worse than
  // no diagram at all because a reader stops trusting the ones that do
  // carry meaning.
  const marks = les.stages.filter((s) => s.head);
  const distinct = new Set(marks.map((s) => s.icon || '?')).size;
  const tape = distinct >= 3 ? `<div class="tape">${marks.map((st) => {
    const ic = (st.icon && stageIcon(st.icon, { size: 11 })) || GENERIC_ICON;
    return `<span class="tape__i" title="${esc(st.head)}">${ic}</span>`;
  }).join('')}</div>` : '';

  // What is worth stating differs by kind. "2 stages" tells a marker
  // nothing about an assignment; the number of criteria they will mark
  // against tells them what they need.
  const rubric = les.kind === 'assignment'
    ? parseRubric(les.stages.find((st) => st.icon === 'rubric')) : null;
  const meta = [
    les.kind === 'quiz' ? `${les.questions.length} questions` : null,
    rubric ? `${rubric.criteria.length} rubric criteria` : null,
    les.kind === 'reading' && named ? `${named} stages` : null,
    mins ? `${mins} min designed` : null,
  ].filter(Boolean).join(' · ');

  const body = les.kind === 'quiz'
    ? (les.stages.length ? les.stages.map(renderStage).join('') : '') + renderQuiz(les)
    : les.stages.map(renderStage).join('');

  return `<article class="lesson${isAssessed ? ' lesson--assessed' : ''}"
    id="l-${lv.roman}-${mod.sequence}-${les.sequence}">
    <header class="lesson__h${isAssessed ? ' lesson__h--cer' : ''}">
      <div class="lesson__top">
        <p class="lesson__k">${esc(kind)}</p>
        <p class="lesson__ref">${ref}</p>
      </div>
      <h4>${typo(les.title)}</h4>
      ${meta ? `<p class="lesson__meta">${meta}</p>` : ''}
      ${tape}
    </header>
    ${body}
  </article>`;
}

/**
 * The module opener.
 *
 * Every module gets a leaf of its own: numeral, title, its own contents
 * list, and the assessment it ends with. Sixty of these are what give
 * the book its rhythm — the reader is never more than a few pages from
 * an event, and a teacher opening the book at random always lands
 * somewhere that says where they are.
 */
function renderModule(mod, lv) {
  const lessons = mod.lessons.map((l) => renderLesson(l, lv, mod)).join('');
  const counts = mod.lessons.reduce((a, l) => { a[l.kind] = (a[l.kind] || 0) + 1; return a; }, {});
  const p = paletteFor(lv.roman);
  const mins = mod.lessons.map(designedMinutes).filter(Boolean).reduce((a, b) => a + b, 0);
  const qs = mod.lessons.reduce((a, l) => a + l.questions.length, 0);

  const contents = mod.lessons.map((l) => `<li class="mo__i mo__i--${l.kind}">
    <span class="mo__ref">${lv.roman}.${mod.sequence}.${l.sequence}</span>
    <span class="mo__t">${typo(l.title)}</span>
    <span class="mo__k">${esc(KIND_LABEL[l.kind] || 'Lesson')}</span></li>`).join('');

  return `<section class="module" id="m-${lv.roman}-${mod.sequence}">
    <section class="moduleopen">
      <div class="moduleopen__orn">${guillocheBand({ width: 420, height: 12, stroke: p.mid, opacity: 0.4 })}</div>
      <div class="moduleopen__hd">
        <div class="moduleopen__num">
          <span>Module</span><b>${mod.sequence}</b>
          <i>of ${lv.modules.length}</i>
        </div>
        <div class="moduleopen__ti">
          <p class="moduleopen__eyebrow">Level ${lv.roman} · ${esc(lv.name)} · CEFR ${esc(lv.cefr)}</p>
          <h3>${typo(shortModuleTitle(mod))}</h3>
        </div>
      </div>
      <div class="moduleopen__stats">
        ${[[mod.lessons.length, 'Items'], [counts.reading || 0, 'Teaching'],
    [qs, 'Questions'], [mins || '—', mins ? 'Minutes designed' : 'Not timed']]
    .map(([v, l]) => `<div><b>${v}</b><span>${l}</span></div>`).join('')}
      </div>
      <p class="moduleopen__ch">In this module</p>
      <ol class="moduleopen__list">${contents}</ol>
      <div class="moduleopen__foot">
        <span class="moduleopen__seal">${girihRosette({ size: 34, stroke: p.mid, width: 0.7, opacity: 0.7 })}</span>
        <p>Every module in this programme ends with an assessed quiz and an assessed assignment
          carrying a full grading rubric. This one is no exception.</p>
      </div>
    </section>
    ${lessons}
  </section>`;
}

/**
 * THE PHOTOGRAPHIC PLATES.
 *
 * ────────────────────────────────────────────────────────────────────
 * WHERE PHOTOGRAPHY EARNS ITS PLACE, AND WHERE IT DOES NOT
 * ────────────────────────────────────────────────────────────────────
 * Six photographs, one per level, each on the verso facing its level
 * divider — so a level opens as a designed SPREAD: image left,
 * typographic divider right.
 *
 * There is no photography anywhere else in this book, and that is a
 * decision rather than a shortage. This is a working teacher\u2019s manual;
 * a photograph beside a lesson stage competes with the thing the
 * teacher is trying to read, and 294 decorated lesson openings would be
 * clutter with a budget. Six plates, at the six moments the reader
 * crosses into a new world, is the whole of the case for photography
 * here — and it is a strong one.
 *
 * ────────────────────────────────────────────────────────────────────
 * ONE PHOTOGRAPHIC DIRECTION
 * ────────────────────────────────────────────────────────────────────
 * Six images by six photographers, shot years apart on different
 * cameras in different light, will never read as a series on their own.
 * They are graded into a duotone — luminance mapped onto a ramp from
 * the level\u2019s own ink to its wash — which does two things at once: it
 * makes six unrelated photographs read as one commissioned series, and
 * it binds the photography to the colour system, so a plate belongs to
 * its level rather than sitting on top of it.
 *
 * The grade is computed from the palette, not eyeballed. Change a level
 * hue and its plate follows.
 */
const PLATES = {
  I: { file: 'img/level-I.jpg', id: '107317330',
    subject: 'A student\u2019s hand writing in an exercise book' },
  II: { file: 'img/level-II.jpg', id: '303569584',
    subject: 'Friends in conversation' },
  III: { file: 'img/level-III.jpg', id: '160362594',
    subject: 'Students preparing together for a seminar' },
  IV: { file: 'img/level-IV.jpg', id: '473276830',
    subject: 'Colleagues working through a project' },
  V: { file: 'img/level-V.jpg', id: '569325921',
    subject: 'A speaker addressing a conference' },
  VI: { file: 'img/level-VI.jpg', id: '427428198',
    subject: 'A graduate at conferral' },
};

const hexToRgb = (h) => [1, 3, 5].map((i) => parseInt(h.slice(i, i + 2), 16) / 255);

/** A duotone: luminance, then a two-stop ramp from ink to wash. */
function duotoneFilter(roman, pal) {
  const [dr, dg, db] = hexToRgb(pal.ink);
  const [lr, lg, lb] = hexToRgb(pal.wash);
  const t = (a, b) => `${Math.round(a * 1000) / 1000} ${Math.round(b * 1000) / 1000}`;
  return `<filter id="duo-${roman}" color-interpolation-filters="sRGB">
    <feColorMatrix type="matrix" values="
      0.2126 0.7152 0.0722 0 0
      0.2126 0.7152 0.0722 0 0
      0.2126 0.7152 0.0722 0 0
      0 0 0 1 0"/>
    <feComponentTransfer>
      <feFuncR type="table" tableValues="${t(dr, lr)}"/>
      <feFuncG type="table" tableValues="${t(dg, lg)}"/>
      <feFuncB type="table" tableValues="${t(db, lb)}"/>
    </feComponentTransfer>
  </filter>`;
}

const DUOTONES = `<svg width="0" height="0" style="position:absolute" aria-hidden="true">
  <defs>${ROMAN.map((r) => duotoneFilter(r, paletteFor(r))).join('')}</defs></svg>`;

/**
 * A full-bleed plate. The image carries no caption: a caption on a
 * photograph in an institutional publication invites a reader to
 * believe it documents the institution, and these are editorial
 * illustrations, not records of this College. Credits are set in the
 * colophon, where a book\u2019s credits belong.
 */
function photoPlate(lv) {
  const p = paletteFor(lv.roman);
  const plate = PLATES[lv.roman];
  if (!plate) return '';
  return `<section class="plate" style="--ink:${p.ink};--mid:${p.mid};--wash:${p.wash}">
    <img class="plate__img" src="${plate.file}" alt="${esc(plate.subject)}"
      style="filter:url(#duo-${lv.roman})">
    <div class="plate__veil"></div>
    <div class="plate__mark"><span class="plate__n">${lv.roman}</span><span class="plate__r"></span></div>
  </section>`;
}

/**
 * The quiet leaf that precedes a level divider when the divider would
 * otherwise fall on a verso.
 *
 * A chapter opening belongs on a RECTO — the right-hand page, the one
 * the eye meets when the spread is turned. A divider on a verso is seen
 * simultaneously with the end of the previous chapter and loses its
 * occasion entirely.
 *
 * Fine books solve this with a blank. A blank in a working teacher's
 * manual reads as a printing fault, so this leaf is not blank: it is a
 * half-title verso carrying the level's numeral as a large blind mark
 * and nothing else. It does the structural job of the blank and looks
 * like a decision.
 */
function rectoLeaf(lv) {
  const p = paletteFor(lv.roman);
  return `<section class="quietleaf" style="--ink:${p.ink};--mid:${p.mid};--wash:${p.wash}">
    <span class="quietleaf__n">${lv.roman}</span>
    <span class="quietleaf__o">${fleuron({ colour: p.mid, width: 90 })}</span>
  </section>`;
}

function renderLevel(lv) {
  const p = paletteFor(lv.roman);
  const modules = lv.modules.map((m) => renderModule(m, lv)).join('');
  const n = lv.modules.reduce((a, m) => a + m.lessons.length, 0);
  const q = lv.modules.reduce((a, m) => a + m.lessons.reduce((b, x) => b + x.questions.length, 0), 0);
  return `<div class="level" data-level="${lv.roman}" style="--ink:${p.ink};--mid:${p.mid};--wash:${p.wash};--edge:${p.edge}">
  <section class="opener" id="lvl-${lv.roman}">
    <div class="opener__field">${girihRosette({ size: 420, stroke: p.mid, width: 0.5, opacity: 0.075 })}</div>
    <div class="opener__frame">${frame({ w: 420, h: 560, colour: p.mid, inset: 12, corner: 26, thick: 1.1, thin: 0.35 })}</div>
    <span class="opener__fan opener__fan--tl">${cornerFan({ size: 30, colour: p.mid, opacity: 0.55 })}</span>
    <span class="opener__fan opener__fan--br">${cornerFan({ size: 30, colour: p.mid, opacity: 0.55 })}</span>
    <div class="opener__in">
      <div class="opener__crest">${crest({ size: 46, gold: p.mid, ink: 'none', mono: true })}</div>
      <p class="opener__eyebrow">The Ascent · Stage ${ROMAN.indexOf(lv.roman) + 1} of 6</p>
      <div class="opener__ros">${guillocheRosette({ size: 190, stroke: p.mid, width: 0.3, opacity: 0.5, rings: 4, seed: ROMAN.indexOf(lv.roman) })}</div>
      <p class="opener__num" style="${EMBOSS.blind}">${lv.roman}</p>
      <h2 class="opener__t">${typo(lv.name)}</h2>
      <p class="opener__cefr">CEFR ${esc(lv.cefr)}</p>
      <div class="opener__orn">${ascentOrnament(lv.roman, p)}</div>
      <div class="opener__awardbox">
        <p class="opener__awardh">The award conferred at this level</p>
        <p class="opener__award">${typo(lv.awardTitle || '')}</p>
        <p class="opener__pn">${esc(lv.postNominal || '')}</p>
        <p class="opener__st">${typo(lv.standing || '')}</p>
      </div>
      <div class="opener__stats">
        <div><b>${lv.modules.length}</b><span>Modules</span></div>
        <div><b>${n}</b><span>Items</span></div>
        <div><b>${q}</b><span>Questions</span></div>
        <div><b>${lv.months}</b><span>Months</span></div>
      </div>
      <div class="opener__band">${guillocheBand({ width: 420, height: 13, stroke: p.mid, opacity: 0.42 })}</div>
    </div>
  </section>
  <section class="lvintro">
    <p class="drop">${typo(lv.graduateProfile || '')}</p>
    <div class="lvintro__why">
      <p class="label">Why this word</p>
      <p>${typo(lv.purpose || '')}</p>
    </div>
  </section>
  ${modules}
  </div>`;
}

// ---- Front matter ----------------------------------------------------
const claimRows = I.claims.map((c) => {
  const w = { evidenced: 'Evidenced', partial: 'Partial', not_evidenced: 'Not evidenced' }[c.state];
  const t = { evidenced: 'ok', partial: 'warn', not_evidenced: 'gap' }[c.state];
  return `<tr><td>${typo(c.claim)}</td><td class="s-${t}">${w}</td></tr>`;
}).join('');

const contents = C.levels.map((lv) => {
  const p = paletteFor(lv.roman);
  return `<li style="--mid:${p.mid}"><a href="#lvl-${lv.roman}">
    <span class="c__n">${lv.roman}</span>
    <span class="c__t">${typo(lv.name)}<em>${esc(lv.cefr)} · ${lv.modules.length} modules ·
      ${lv.modules.reduce((a, m) => a + m.lessons.length, 0)} items</em></span></a>
    <ol class="c__mods">${lv.modules.map((m) =>
    `<li>${m.sequence}. ${typo(m.title)}</li>`).join('')}</ol></li>`;
}).join('');

const CLAIMS = `<table class="claims">
  <thead><tr><th scope="col">Element of the definition</th><th scope="col">Position</th></tr></thead>
  <tbody>${claimRows}</tbody></table>`;

const CONTENTS = `<section class="contents">
  <p class="ed__eyebrow">Contents</p>
  <h2>The Programme</h2>
  <ol class="clist">${contents}</ol>
  <div class="clist__after">
    <p class="label">Apparatus</p>
    <p>How to Read a Lesson · Register of Omissions · Colophon</p>
  </div>
</section>`;

const HOWTO = `<section class="howto">
  <h2>How to Read a Lesson</h2>
  <p class="lead">Every teaching lesson follows one house structure, so a teacher moving between
    levels never has to relearn the page.</p>
  <div class="legend">
    ${[['objectives', 'Learning objectives', 'What the learner can do by the end. Always first.'],
    ['prereq', 'Prerequisite knowledge', 'What must already be secure.'],
    ['warmup', 'Warm-up', 'Activation, usually five minutes.'],
    ['present', 'Presentation', 'The new language, modelled — often as a dialogue.'],
    ['guided', 'Guided practice', 'Supported use, with the teacher shaping.'],
    ['independent', 'Independent practice', 'Unsupported use.'],
    ['speaking', 'Speaking activity', 'Production in real time.'],
    ['listening', 'Listening activity', 'Reception at natural pace.'],
    ['reading', 'Reading activity', 'Reception for argument and detail.'],
    ['writing', 'Writing task', 'Production to a purpose and an audience.'],
    ['pronunciation', 'Pronunciation practice', 'Form, stress and intelligibility.'],
    ['vocabulary', 'Vocabulary', 'Key items, phrases and collocations.'],
    ['assess', 'Formative assessment', 'The check that tells the teacher whether to move on.'],
    ['thinking', 'Critical thinking', 'A prompt that has no single right answer.'],
    ['homework', 'Homework', 'Consolidation between sessions.'],
    ['extension', 'Extension', 'For learners who finish early or want further.'],
    ['revision', 'Revision', 'Deliberate return to earlier material.']]
    .map(([k, n, d]) => `<div class="legend__i"><span class="legend__m">${
  stageIcon(k, { size: 17 }) || GENERIC_ICON}</span>
      <div><b>${n}</b><p>${d}</p></div></div>`).join('')}
  </div>
  <p>A timing in brackets after a stage heading is the designed duration for that stage. Stages
    without a timing are not time-boxed. Model dialogue is set apart from instruction so that a
    teacher can find it at a glance, and an assessed quiz prints its answer key immediately
    beneath it — this is a teacher's edition.</p>
</section>`;

// Rubric criteria per level, counted so the assessment map states a
// measured figure rather than a representative one.
const critByLevel = Object.fromEntries(C.levels.map((lv) => [lv.roman,
  lv.modules.flatMap((m) => m.lessons)
    .filter((x) => x.kind === 'assignment')
    .reduce((a, x) => {
      const r = parseRubric(x.stages.find((st) => st.icon === 'rubric'));
      return a + (r ? r.criteria.length : 0);
    }, 0)]));

const ARCHITECTURE = `<section class="arch">
  <p class="ed__eyebrow">The Architecture</p>
  <h2>The Shape of the Programme</h2>
  <p class="lead">Five figures, each measured from the curriculum in this volume rather than drawn
    to illustrate it. If the programme changes, they change; if a figure here is unflattering, it
    is because the measurement was.</p>

  <figure class="fig">
    <figcaption class="fig__c"><b>Figure 1</b> The ascent</figcaption>
    ${ascentChart(C.levels)}
    <p class="fig__n">The architecture of this programme is deliberately uniform: every level is ten
      modules, forty-nine authored items, a hundred and ten assessment questions and four months.
      A learner always knows what a level costs. What rises is depth — the lesson content written
      for a single item roughly doubles between the first level and the sixth, which is the demand
      curve a teacher actually feels and the reason the later levels are harder to teach even
      though they are not longer. The crimson rules carry the finding underneath that one: the
      sixth level writes <em>fewer</em> stages than the third or fourth, each of them substantially
      longer. The shape of a lesson changes as the ascent proceeds — from many short moves to few
      sustained ones — and that change is invisible in any total.</p>
    <p class="fig__n">An earlier draft of this figure plotted duration against item count under the
      caption <em>the six levels are not six equal steps</em>. It rendered as six identical columns,
      because they are six equal steps. The chart was accurate and the caption was not; both were
      replaced rather than the caption alone, because a figure with no variance to show is a figure
      with nothing to say.</p>
  </figure>

  <figure class="fig">
    <figcaption class="fig__c"><b>Figure 2</b> Sixty modules, one architecture</figcaption>
    ${architectureGrid(C.levels)}
    <p class="fig__n">Every module in the programme, one cell each, divided into its teaching items
      and its two assessments. The claim this figure makes is about regularity: the assessment spine
      is identical in all sixty, at every level, and a departure from that pattern would be visible
      here without a word of commentary.</p>
  </figure>

  <figure class="fig">
    <figcaption class="fig__c"><b>Figure 3</b> The anatomy of a lesson</figcaption>
    ${lessonAnatomy(C)}
    <p class="fig__n">What the house structure actually is, counted across every named stage in the
      book, with the median designed timing where the curriculum sets one. Twelve stage names occur
      exactly 114 times each — once in every teaching lesson in the programme — which is the
      strongest evidence in this volume that the house structure is real rather than aspirational.</p>
    <p class="fig__n">The tail is the honest part. Beyond the eighteen shown, a further eighty-three
      stage names occur less often. Some of that is deliberate variation; some is almost certainly
      drift in naming, where the same teaching move has been written under two headings by different
      hands. This figure does not decide which, and it is not the place to: reconciling the tail is
      an editorial task for the Board of Academic Standards and Curriculum Excellence, and it is
      recorded here because a chart of only the head would have concealed it.</p>
  </figure>

  <figure class="fig">
    <figcaption class="fig__c"><b>Figure 4</b> The four skills across the ascent</figcaption>
    ${skillsAcrossLevels(C.levels)}
    <p class="fig__n">Named skill stages per hundred authored items, normalised because the levels
      differ in size and raw counts would say only that some levels are longer. Reading and writing
      rise as the ascent proceeds; speaking is present throughout.</p>
  </figure>

  <figure class="fig fig--break">
    <figcaption class="fig__c"><b>Figure 5</b> The assessment map</figcaption>
    ${assessmentMap(C.levels, critByLevel)}
    <p class="fig__n">The right-hand column is the one that matters. Every module carries two
      assessments and a full grading rubric — 120 assessments and
      ${Object.values(critByLevel).reduce((a, b) => a + b, 0)} rubric criteria in total. None of the
      120 is mapped to a named competency. The College defines the IEFC as a qualification extending
      CEFR proficiency through competency verification; until that column is populated, the
      definition is an intention rather than a demonstration, and establishing the mapping is the
      founding task of the Board of Academic Standards and Curriculum Excellence.</p>
  </figure>
</section>`;

const FRONT = frontMatter(ID, I, CLAIMS, CONTENTS, HOWTO + ARCHITECTURE);
const BACK = backMatter(ID);

// ---- The stylesheet --------------------------------------------------
const CSS = `
/* MIRRORED MARGINS.
   A book is read in spreads, and a spread has a gutter down the middle
   where the binding swallows paper. Symmetric margins put the text
   block off-centre on every spread and crowd the fold; mirrored margins
   put the wider measure at the binding, so the two text blocks sit
   symmetrically about the fold as one composition.

   Chromium honours @page :left / :right here — verified empirically
   rather than assumed, because CSS.supports() claims support for
   break-before:recto in this same engine and that one does nothing. */
@page { size: A4; margin: 17mm 16mm 15mm 26mm; }
@page :left  { margin: 17mm 26mm 15mm 16mm; }  /* verso: gutter on the right */
@page :right { margin: 17mm 16mm 15mm 26mm; }  /* recto: gutter on the left  */
@page :first { margin: 0; }
:root { --ink:${BRAND.ink}; --mid:${BRAND.gold}; --wash:#F4F6FA; --edge:${BRAND.ink};
  --gold:${BRAND.gold}; --soft:${BRAND.soft}; --rule:${BRAND.rule};
  --navy:${PAL.midnightNavy}; --imperial:${PAL.imperialBlue}; --champagne:${PAL.champagneGold};
  --bronze:${PAL.bronze}; --crimson:${PAL.deepCrimson}; --ivory:${PAL.ivory};
  --cream:${PAL.softCream}; --platinum:${PAL.platinum}; --body:${PAL.warmCharcoal};
  --serif:${TYPE.serif}; --sans:${TYPE.sans}; }
* { box-sizing: border-box; }
body { margin:0; color:var(--body); background:${PAL.pearlWhite};
  font-family: var(--serif); font-size:9.6pt; line-height:1.58;
  -webkit-print-color-adjust:exact; print-color-adjust:exact; }

/* THE SETTING.
   Justified with hyphenation, which is the setting a book of continuous
   prose wants: an even right edge is what makes a spread read as two
   panels of one composition rather than as two ragged shapes. Justified
   WITHOUT hyphenation is the worst of both — it opens rivers of white
   through the column — so the two are turned on together or not at all.

   text-wrap:pretty is Chromium's line-breaking pass that trades a
   little speed for fewer short last lines and better rag; it is applied
   to headings and short blocks, where a single-word last line is most
   visible. Verified supported in this engine.

   hanging-punctuation is NOT supported here. True optical margin
   alignment — quotes and hyphens hung into the margin — is therefore
   not achieved in this edition, and the typography specification says
   so rather than implying it was done. */
.stage__b p, .lvintro p, .preface p, .editorial p, .fig__n, .back__b {
  text-align: justify; hyphens: auto; -webkit-hyphens: auto; }
h1, h2, h3, h4, h5, .lead, .fig__c, .lesson__h h4, .moduleopen__ti h3,
.opener__t, .opener__award, .ded__t, .half__t {
  text-wrap: pretty; }
/* And on body prose, where the audit measured 209 paragraphs ending in a
   single stranded word across the book. text-wrap:pretty is Chromium's
   own last-lines pass: it costs a little layout time and reflows the
   final lines of a paragraph to avoid the runt. Applied here rather
   than by hand-inserting non-breaking spaces, because 209 manual
   bindings would be 209 chances to alter the curriculum text. */
.stage__b p, .lvintro p, .preface p, .editorial p, .fig__n, .back__b,
ol.items li, ol.quiz > li, .q__p, td, .small, .col__meta {
  text-wrap: pretty; }
/* Never hyphenate a heading, a proper name in a title, or a code. */
h1, h2, h3, h4, h5, .mono, .lesson__ref, .lesson__k { hyphens: none; }
.sans { font-family: var(--sans); }
p { margin:0 0 5.5pt; orphans:3; widows:3; }
h2,h3,h4,h5 { color:var(--ink); break-after:avoid; }
.label { font-family:Calibri,"Nimbus Sans",Arial,sans-serif; font-size:7pt; font-weight:700;
  letter-spacing:.12em; text-transform:uppercase; color:var(--bronze); margin:12pt 0 3pt; }
.small { font-size:7.6pt; color:var(--soft); font-family:Calibri,"Nimbus Sans",Arial,sans-serif; }
.lead { font-size:11pt; line-height:1.55; color:var(--ink); }

/* ---------- Front matter ---------- */
/* Every full-bleed leaf is built the same way: a 297mm flex column with
   its ornament layers absolutely placed behind the type. Doing it once
   here is why the endpaper, the frontispiece and the title page share a
   register instead of each drifting to its own. */
.endpaper, .half, .frontis, .titlepage, .dedication { height:297mm; break-after:page;
  position:relative; display:flex; flex-direction:column; align-items:center;
  justify-content:center; text-align:center; overflow:hidden; }
/* The endpaper is the first and last thing seen, and a plain white one
   behind a foiled cover is the clearest sign a budget ran out at the
   end. Solid Midnight Navy with the girih field in gold — the cover's
   own material, carried inside. */
.endpaper { background:var(--navy); }
.endpaper__field { position:absolute; inset:0; }
.endpaper__mark { position:relative; }

.half { background:${PAL.pearlWhite}; }
.half__t { font-family:var(--serif); font-size:15pt; font-weight:700; letter-spacing:.06em;
  color:var(--ink); margin:14pt 0 6pt; line-height:1.7; }
.half__s { font-family:var(--sans); font-size:8pt; letter-spacing:.34em; text-transform:uppercase;
  color:var(--soft); margin:0 0 14pt; }
.half__orn { opacity:.9; }

.frontis { background:var(--ivory); justify-content:flex-start; padding:26mm 22mm 20mm; }
.frontis__plate { position:relative; width:100%; flex:1; background:var(--navy);
  display:flex; flex-direction:column; align-items:center; justify-content:center;
  padding:16mm 12mm; overflow:hidden; }
.frontis__field { position:absolute; inset:0; }
.frontis__ros { position:absolute; top:50%; left:50%; transform:translate(-50%,-58%); }
.frontis__crest { position:relative; margin:0 0 14pt; }
.frontis__ladder { position:relative; width:100%; max-width:66mm; }
.frontis__rung { display:flex; align-items:center; gap:7pt; margin:0 0 6pt; }
.frontis__r { font-family:var(--serif); font-size:9.5pt; font-weight:700; color:var(--champagne);
  min-width:2.2em; text-align:right; }
.frontis__n { font-family:var(--sans); font-size:6.6pt; letter-spacing:.12em; text-transform:uppercase;
  color:#C9CEDA; min-width:11em; text-align:left; }
.frontis__rung i { height:2.6pt; background:var(--champagne); opacity:.85; display:block; }
.frontis__cap { font-size:8pt; color:var(--soft); font-style:italic; margin:9pt 0 0;
  max-width:34em; line-height:1.5; }

.titlepage { background:var(--ivory); }
.tp__frame { position:absolute; inset:14mm; }
.tp__in { position:relative; padding:0 22mm; }
.tp__crest { margin:0 0 12pt; }
.tp__inst { font-family:var(--sans); font-size:8.5pt; font-weight:700;
  letter-spacing:.34em; text-transform:uppercase; color:var(--bronze); margin:0 0 2pt; }
.tp__camp { font-style:italic; color:var(--soft); font-size:9pt; margin:0; }
.tp__hair { width:22%; height:.5pt; background:var(--rule); margin:14pt auto 20pt; }
.tp__the { font-style:italic; font-size:15pt; color:var(--bronze); margin:0 0 2pt; }
.tp__t { margin:0; font-size:32pt; line-height:1.14; letter-spacing:-.015em;
  color:var(--ink); font-weight:700; ${EMBOSS.blind} }
.tp__t span { display:block; }
.tp__orn { margin:14pt auto 12pt; }
.tp__sub { font-style:italic; font-size:14pt; color:var(--ink); margin:0 0 7pt; }
.tp__vol { font-family:var(--sans); font-size:7.6pt; color:var(--soft);
  letter-spacing:.06em; margin:0; }
.tp__spacer { height:34pt; }
.tp__ed { font-family:var(--sans); font-size:8pt; font-weight:700;
  letter-spacing:.24em; text-transform:uppercase; color:var(--ink); margin:0 0 10pt; }
.tp__press { font-family:var(--sans); font-size:7pt;
  letter-spacing:.18em; text-transform:uppercase; color:var(--soft); margin:0 0 3pt; }
.tp__year { font-family:var(--sans); font-size:7pt; letter-spacing:.18em; color:var(--soft); margin:0; }

.dedication { background:${PAL.pearlWhite}; }
.ded__t { font-family:var(--serif); font-style:italic; font-size:12.5pt; line-height:1.9;
  color:var(--ink); max-width:24em; margin:20pt auto; }
.ded__orn { opacity:.85; }

.imprint, .editorial, .contents, .howto, .preface, .omissions, .colophon { break-before:page; }
.imprint h2, .editorial h2, .contents h2, .howto h2, .preface h2, .omissions h2, .colophon h2 {
  font-size:19pt; margin:0 0 4pt; letter-spacing:-.01em; line-height:1.2; }
.imprint h2::after, .editorial h2::after, .contents h2::after, .howto h2::after,
.preface h2::after, .omissions h2::after {
  content:''; display:block; width:100%; height:.8pt;
  background:linear-gradient(90deg,var(--gold) 0 22%,var(--rule) 22%); margin:7pt 0 13pt; }
.editorial h3 { font-size:12pt; margin:18pt 0 6pt; }
.ed__eyebrow, .pre__eyebrow { font-family:var(--sans); font-size:7pt; font-weight:700;
  letter-spacing:.24em; text-transform:uppercase; color:var(--bronze); margin:0 0 4pt; }
.imp__title { font-size:10.5pt; }

/* Identification block — set as a document of record, not as decoration. */
.idblock { border: .6pt solid var(--rule); border-top: 2pt solid var(--ink);
  background:#FCFCFD; padding:10pt 12pt; margin:14pt 0; display:flex; gap:14pt;
  align-items:flex-start; break-inside:avoid; }
.idblock__h { font-family:var(--sans); font-size:7pt; font-weight:700; letter-spacing:.18em;
  text-transform:uppercase; color:var(--ink); margin:0 0 6pt; }
.idtable { border-collapse:collapse; font-family:var(--sans); font-size:7.4pt; flex:1; }
.idtable th { text-align:left; padding:2.6pt 10pt 2.6pt 0; color:var(--soft); font-weight:700;
  white-space:nowrap; vertical-align:top; border-bottom: .4pt solid #EDEFF3; }
.idtable td { padding:2.6pt 0; color:var(--ink); border-bottom: .4pt solid #EDEFF3;
  vertical-align:top; }
.mono { font-family:"Consolas","DejaVu Sans Mono",monospace; font-size:7.2pt; letter-spacing:.02em; }
.digest { word-break:break-all; line-height:1.35; color:var(--bronze); }
.auth { color:var(--soft); font-weight:400; font-style:italic; }
.idblock__qr { text-align:center; width:26mm; }
.idblock__qr p { font-family:var(--sans); font-size:6pt; color:var(--soft); margin:3pt 0 0;
  line-height:1.35; }
.panel--auth p { font-size:8.2pt; }

/* Preface */
.preface p { font-size:10.2pt; line-height:1.62; margin:0 0 7pt; }
.drop--pre::first-letter { float:left; font-size:36pt; line-height:.82; font-weight:700;
  color:var(--bronze); padding:3pt 6pt 0 0; }
.pre__sign { font-family:var(--sans); font-size:8pt; font-weight:700; letter-spacing:.18em;
  text-transform:uppercase; color:var(--ink); margin:16pt 0 3pt; }
.pre__note { font-size:8pt; font-style:italic; color:var(--soft); border-top: .4pt solid var(--rule);
  padding-top:6pt; }

.panel { border-left: 2.6pt solid var(--gold); background:#FBF6EA; padding:9pt 12pt; margin:12pt 0; break-inside:avoid; }
.panel__h { font-family:Calibri,"Nimbus Sans",Arial,sans-serif; font-size:7pt; font-weight:700;
  letter-spacing:.12em; text-transform:uppercase; color:var(--bronze); margin:0 0 4pt; }
.panel p { font-size:9pt; line-height:1.5; margin:0 0 4pt; }
.panel p:last-child { margin:0; }

table.claims { width:100%; border-collapse:collapse; font-family:Calibri,"Nimbus Sans",Arial,sans-serif;
  font-size:8.5pt; margin:8pt 0; }
table.claims th { background:${BRAND.ink}; color:#fff; text-align:left; padding:5pt 7pt;
  font-size:7pt; letter-spacing:.06em; text-transform:uppercase; }
table.claims td { padding:5pt 7pt; border-bottom: .4pt solid #E4E8EF; }
.s-ok { color:#1E6B3A; font-weight:700; } .s-warn { color:#8A6B2E; font-weight:700; }
.s-gap { color:#8C1F2F; font-weight:700; }

.clist { list-style:none; margin:0; padding:0; }
.clist > li { margin:0 0 11pt; padding:0 0 9pt; border-bottom: .4pt solid var(--rule); break-inside:avoid; }
.clist a { text-decoration:none; display:flex; align-items:baseline; gap:10pt; }
.c__n { font-size:17pt; font-weight:700; color:var(--mid); min-width:2.4em; }
.c__t { font-size:12pt; color:${BRAND.ink}; }
.c__t em { display:block; font-style:normal; font-family:Calibri,"Nimbus Sans",Arial,sans-serif;
  font-size:7.5pt; color:var(--soft); letter-spacing:.06em; margin-top:1pt; }
.c__mods { margin:5pt 0 0 3.4em; padding:0; list-style:none; columns:2; column-gap:14pt;
  font-size:8pt; color:var(--soft); font-family:Calibri,"Nimbus Sans",Arial,sans-serif; }
.c__mods li { margin:0 0 2pt; break-inside:avoid; }

.legend { columns:2; column-gap:16pt; margin:10pt 0 12pt; }
.legend__i { display:flex; gap:7pt; break-inside:avoid; margin:0 0 7pt; }
.legend__m { font-size:10pt; color:var(--bronze); line-height:1.2; min-width:1.2em; text-align:center; }
.legend__i b { font-family:Calibri,"Nimbus Sans",Arial,sans-serif; font-size:8.5pt; color:${BRAND.ink}; }
.legend__i p { font-size:8pt; color:var(--soft); margin:0; line-height:1.4; }

/* ---------- Level divider ---------- */
/* A full leaf, centred, on the level's own tinted stock — the reader
   should know they have crossed into a new level before reading a word. */
.opener { break-before:page; height:256mm; position:relative; display:flex;
  align-items:center; justify-content:center; text-align:center; overflow:hidden;
  background:var(--wash); }
.opener__field { position:absolute; top:50%; left:50%; transform:translate(-50%,-50%); }
.opener__frame { position:absolute; inset:7mm; }
.opener__fan { position:absolute; }
.opener__fan--tl { top:17mm; left:17mm; }
.opener__fan--br { bottom:17mm; right:17mm; transform:rotate(180deg); }
.opener__in { position:relative; padding:0 20mm; width:100%; }
.opener__crest { margin:0 0 8pt; }
.opener__eyebrow { font-family:var(--sans); font-size:7pt; font-weight:700;
  letter-spacing:.24em; text-transform:uppercase; color:var(--mid); margin:0 0 6pt; }
.opener__ros { position:absolute; top:34pt; left:50%; transform:translateX(-50%); }
.opener__num { position:relative; font-size:112pt; line-height:.94; font-weight:700;
  color:var(--ink); margin:0; letter-spacing:.02em; }
.opener__t { font-size:28pt; line-height:1.1; margin:6pt 0 4pt; color:var(--ink); font-weight:700; }
.opener__cefr { font-family:var(--sans); font-size:8.4pt; font-weight:700;
  letter-spacing:.24em; text-transform:uppercase; color:var(--mid); margin:0 0 14pt; }
.opener__orn { margin:0 0 16pt; display:flex; justify-content:center; }
.opener__awardbox { border-top: .6pt solid var(--mid); border-bottom: .6pt solid var(--mid);
  padding:10pt 0 9pt; margin:0 auto 16pt; max-width:32em; }
.opener__awardh { font-family:var(--sans); font-size:6.4pt; font-weight:700; letter-spacing:.24em;
  text-transform:uppercase; color:var(--soft); margin:0 0 5pt; }
.opener__award { font-size:14pt; font-style:italic; color:var(--ink); margin:0 0 3pt; }
.opener__pn { font-family:var(--sans); font-size:9.5pt; font-weight:700;
  letter-spacing:.12em; color:var(--mid); margin:0 0 6pt; }
.opener__st { font-size:9.4pt; color:var(--soft); max-width:30em; margin:0 auto; }
.opener__stats { display:flex; gap:20pt; justify-content:center; margin:0 0 18pt; }
.opener__stats div { text-align:center; min-width:16mm; }
.opener__stats b { display:block; font-size:19pt; color:var(--ink); line-height:1.1; }
.opener__stats span { font-family:var(--sans); font-size:6.4pt;
  letter-spacing:.18em; text-transform:uppercase; color:var(--soft); }
.opener__band { opacity:.9; }

.lvintro { break-before:page; }
.drop::first-letter { float:left; font-size:40pt; line-height:.84; font-weight:700;
  color:var(--mid); padding:2pt 6pt 0 0; }
.lvintro { font-size:10.4pt; line-height:1.6; }
.lvintro__why { margin-top:12pt; border-left: 2pt solid var(--mid); background:var(--wash);
  padding:9pt 12pt; break-inside:avoid; }
.lvintro__why p:last-child { margin:0; font-size:9.4pt; }

/* ---------- Module ---------- */
.module { break-before:page; }
.module__h { display:flex; gap:12pt; align-items:flex-start; border-bottom: 1.2pt solid var(--mid);
  padding-bottom:8pt; margin-bottom:12pt; break-after:avoid; }
.module__n { background:var(--ink); color:#fff; padding:6pt 9pt 7pt; text-align:center; min-width:15mm; }
.module__n span { display:block; font-family:Calibri,"Nimbus Sans",Arial,sans-serif; font-size:6pt;
  letter-spacing:.18em; text-transform:uppercase; opacity:.8; }
.module__n b { display:block; font-size:19pt; line-height:1.05; }
.module__t h3 { font-size:16pt; margin:0 0 2pt; line-height:1.2; }
.module__m { font-family:Calibri,"Nimbus Sans",Arial,sans-serif; font-size:7.5pt; color:var(--soft);
  margin:0; letter-spacing:.02em; }

/* ---------- Lesson ---------- */
.lesson { break-inside:auto; margin:0 0 16pt; padding:0 0 12pt; border-bottom: .4pt solid var(--rule); }
.lesson:last-child { border-bottom:0; }
.lesson__h { break-after:avoid; margin:0 0 8pt; padding:0 0 5pt;
  border-bottom: .4pt solid var(--rule); }
.lesson__top { display:flex; justify-content:space-between; align-items:baseline; }
.lesson__k { font-family:var(--sans); font-size:6.6pt; font-weight:700;
  letter-spacing:.18em; text-transform:uppercase; color:var(--mid); margin:0 0 1pt; }
.lesson__ref { font-family:var(--sans); font-size:6.6pt; letter-spacing:.12em;
  color:var(--soft); margin:0; }
.lesson__h h4 { font-size:13.5pt; margin:1pt 0 0; line-height:1.22; letter-spacing:-.008em; }
.lesson__meta { font-family:var(--sans); font-size:6.6pt; color:var(--soft); margin:2.5pt 0 0;
  letter-spacing:.06em; }

/* An assessed item is an occasion. The ceremonial header says so before
   a word is read: the level's ink as a ground, the rule doubled. */
.lesson--assessed { break-before:page; }
.lesson__h--cer { background:var(--ink); color:#fff; padding:8pt 10pt 8pt;
  border-bottom: 2.6pt solid var(--mid); margin:0 0 10pt; }
.lesson__h--cer .lesson__k { color:#fff; opacity:.9; }
.lesson__h--cer .lesson__ref { color:#fff; opacity:.7; }
.lesson__h--cer h4 { color:#fff; font-size:15pt; }
.lesson__h--cer .lesson__meta { color:#fff; opacity:.72; }
.lesson__h--cer .tape { border-top-color:rgba(255,255,255,.28); }
.lesson__h--cer .tape__i { color:#fff; opacity:.72; }

.stage { margin:0 0 7pt; break-inside:avoid; }
.stage--intro { font-size:9.6pt; }
.stage__h { font-family:Calibri,"Nimbus Sans",Arial,sans-serif; font-size:7.4pt; font-weight:700;
  letter-spacing:.12em; text-transform:uppercase; color:var(--ink); margin:0 0 2.5pt;
  display:flex; align-items:baseline; gap:5pt; }
.stage__mk { color:var(--mid); font-size:8.5pt; min-width:1em; }
.stage__t { font-weight:400; letter-spacing:.06em; text-transform:none; color:var(--soft);
  font-size:7pt; font-style:italic; }
.stage__b p { margin:0 0 4pt; }
.stage--emph { background:var(--wash); border-left: 2pt solid var(--mid); padding:7pt 10pt 5pt; }
.stage--emph .stage__h { color:var(--ink); }

.dialogue { border-left: 1.2pt solid var(--mid); padding:4pt 0 4pt 9pt; margin:4pt 0 6pt; break-inside:avoid; }
.dialogue p { margin:0 0 2pt; font-size:9.6pt; }
.dialogue .sp { font-family:Calibri,"Nimbus Sans",Arial,sans-serif; font-weight:700; font-size:7.4pt;
  color:var(--mid); letter-spacing:.06em; display:inline-block; min-width:2.1em; }

ol.items { margin:3pt 0 5pt; padding:0; list-style:none; }
ol.items li { margin:0 0 2.5pt; padding-left:14pt; text-indent:-14pt; }
ol.items .mk { color:var(--mid); font-weight:700; display:inline-block; min-width:11pt;
  font-family:Calibri,"Nimbus Sans",Arial,sans-serif; font-size:8pt; text-indent:0; }

/* ---------- Quiz ---------- */
ol.quiz { margin:6pt 0 8pt; padding:0; counter-reset:q; list-style:none; }
ol.quiz > li { counter-increment:q; margin:0 0 7pt; break-inside:avoid; padding-left:16pt; position:relative; }
ol.quiz > li::before { content:counter(q); position:absolute; left:0; top:0;
  font-family:Calibri,"Nimbus Sans",Arial,sans-serif; font-size:8pt; font-weight:700; color:var(--mid); }
.q__p { margin:0 0 3pt; font-size:9.6pt; }
ol.q__c { margin:0; padding:0; list-style:none; counter-reset:c;
  font-family:Calibri,"Nimbus Sans",Arial,sans-serif; font-size:8.6pt; }
ol.q__c li { counter-increment:c; margin:0 0 1.5pt; padding-left:15pt; position:relative; color:#333; }
ol.q__c li::before { content:counter(c, upper-alpha); position:absolute; left:0;
  color:var(--soft); font-weight:700; font-size:7.6pt; }
ol.q__c li.is-key { color:var(--ink); font-weight:700; }
ol.q__c li.is-key::before { color:var(--mid); }
.answerkey { background:var(--wash); border-left: 2pt solid var(--mid); padding:6pt 10pt; break-inside:avoid; }
.answerkey__h { font-family:Calibri,"Nimbus Sans",Arial,sans-serif; font-size:6.8pt; font-weight:700;
  letter-spacing:.12em; text-transform:uppercase; color:var(--ink); margin:0 0 3pt; }
.answerkey__g { display:flex; flex-wrap:wrap; gap:4pt 10pt;
  font-family:Calibri,"Nimbus Sans",Arial,sans-serif; font-size:8.4pt; }
.answerkey__g span { color:var(--ink); }
.answerkey__g b { color:var(--soft); font-weight:400; margin-right:2.5pt; font-size:7.4pt; }

/* ---------- The photographic plate ---------- */
/* NO BLEED. The plate fills the type area exactly, and that is an
 * engine limitation recorded rather than a preference.
 *
 * Two bleed techniques were tried; both were worse than they looked.
 *
 * A 297 mm plate with negative margins on all four sides — the textbook
 * way to escape a margin box — consumed two pages per plate in
 * isolation, and in the full book the count FELL by seventeen when six
 * plates were added.
 *
 * Horizontal-only bleed was worse, and worse in a way that would have
 * shipped. Any element wider than the page content box makes Chromium
 * shrink-to-fit the WHOLE DOCUMENT: the book came out at 444 pages
 * instead of ~487 because every page was being scaled down. Every
 * content assertion still passed — the words were all in the HTML — and
 * the defect showed only as a page count that made no sense. A reader
 * would have received a book printed at about 91%, with type below its
 * specified size throughout and a spine calculated from a false extent.
 *
 * So the plate is exactly the content box: 168 x 265 mm. It does not
 * reach the trim. A plate held within the type area is a legitimate and
 * long-established form in fine bookmaking, but it is not full bleed,
 * and full bleed is not available in this pipeline. */
.plate { break-before:page; position:relative; height:265mm;
  overflow:hidden; background:var(--ink); }
.plate__img { width:100%; height:100%; object-fit:cover; display:block; }
/* A veil weighted to the foot, so the numeral holds against any image
   without dimming the photograph as a whole. */
.plate__veil { position:absolute; inset:0;
  background:linear-gradient(to bottom, rgba(0,0,0,0) 55%, rgba(0,0,0,.42) 100%); }
.plate__mark { position:absolute; left:12mm; bottom:12mm; display:flex;
  align-items:center; gap:7mm; }
.plate__n { font-family:var(--serif); font-size:30pt; font-weight:700; color:#fff;
  line-height:1; letter-spacing:.02em; }
.plate__r { display:block; width:26mm; height:1.2pt; background:var(--champagne); }

/* ---------- The quiet leaf ---------- */
.quietleaf { break-before:page; height:250mm; display:flex; flex-direction:column;
  align-items:center; justify-content:center; gap:14pt; }
.quietleaf__n { font-family:var(--serif); font-size:62pt; font-weight:700; color:var(--wash);
  line-height:1; letter-spacing:.06em; }
.quietleaf__o { opacity:.5; }

/* ---------- The icon language ---------- */
/* Icons inherit currentColor, so a stage mark is always exactly the
   colour of the level it sits in and no per-level asset exists. */
.ic { vertical-align:-0.14em; }
.stage__mk .ic { color:var(--mid); }

/* ---------- Module opener ---------- */
/* Sixty of these give the book its rhythm: the reader is never more than
   a few pages from an event. */
.moduleopen { break-before:page; break-inside:avoid; break-after:avoid;
  background:var(--wash); padding:11mm 12mm 10mm; margin:0 0 9pt;
  border-top: 2.6pt solid var(--ink); position:relative; }
.moduleopen__orn { position:absolute; left:12mm; right:12mm; bottom:5mm; opacity:.75; }
.moduleopen__hd { display:flex; gap:11pt; align-items:flex-start; margin:0 0 12pt; }
.moduleopen__num { background:var(--ink); color:#fff; padding:7pt 10pt 8pt; text-align:center;
  min-width:20mm; }
.moduleopen__num span { display:block; font-family:var(--sans); font-size:5.8pt;
  letter-spacing:.18em; text-transform:uppercase; opacity:.82; }
.moduleopen__num b { display:block; font-size:27pt; line-height:1; margin:1pt 0; }
.moduleopen__num i { display:block; font-family:var(--sans); font-size:5.6pt; font-style:normal;
  letter-spacing:.12em; opacity:.7; }
.moduleopen__eyebrow { font-family:var(--sans); font-size:6.4pt; font-weight:700;
  letter-spacing:.18em; text-transform:uppercase; color:var(--mid); margin:2pt 0 3pt; }
.moduleopen__ti h3 { font-size:21pt; margin:0; line-height:1.14; letter-spacing:-.012em; }
.moduleopen__stats { display:flex; gap:16pt; border-top: .6pt solid var(--mid);
  border-bottom: .6pt solid var(--mid); padding:7pt 0; margin:0 0 11pt; }
.moduleopen__stats b { display:block; font-size:15pt; color:var(--ink); line-height:1.1; }
.moduleopen__stats span { font-family:var(--sans); font-size:5.8pt; letter-spacing:.12em;
  text-transform:uppercase; color:var(--soft); }
.moduleopen__ch { font-family:var(--sans); font-size:6.2pt; font-weight:700; letter-spacing:.24em;
  text-transform:uppercase; color:var(--soft); margin:0 0 5pt; }
.moduleopen__list { list-style:none; margin:0 0 11pt; padding:0; }
.mo__i { display:flex; align-items:baseline; gap:7pt; padding:2.6pt 0;
  border-bottom: .4pt solid rgba(0,0,0,.07); }
.mo__ref { font-family:var(--sans); font-size:6.4pt; color:var(--soft); min-width:5.4em; }
.mo__t { flex:1; font-size:9.2pt; color:#1A1A1A; }
.mo__k { font-family:var(--sans); font-size:5.8pt; letter-spacing:.12em; text-transform:uppercase;
  color:var(--soft); }
.mo__i--quiz .mo__t, .mo__i--assignment .mo__t { font-weight:700; color:var(--ink); }
.mo__i--quiz .mo__k, .mo__i--assignment .mo__k { color:var(--crimson); font-weight:700; }
.moduleopen__foot { display:flex; gap:8pt; align-items:center; padding-bottom:6mm; }
.moduleopen__foot p { font-size:8pt; font-style:italic; color:var(--soft); margin:0; max-width:34em; }

/* ---------- The stage tape ---------- */
/* The shape of the session, drawn from its own stages, above the title. */
.tape { display:flex; flex-wrap:wrap; gap:3.4pt; margin:4pt 0 0; padding:3.4pt 0 0;
  border-top: .4pt solid var(--rule); }
.tape__i { color:var(--mid); opacity:.72; line-height:0; }

/* ---------- Rubric table ---------- */
/* A rubric is the instrument a teacher marks with. Set as prose it
   cannot be read down or compared across criteria. */
table.rubric { width:100%; border-collapse:collapse; margin:4pt 0 5pt; break-inside:avoid; }
table.rubric th { background:var(--ink); color:#fff; text-align:left; padding:3.4pt 6pt;
  font-family:var(--sans); font-size:6.2pt; letter-spacing:.12em; text-transform:uppercase;
  font-weight:700; }
table.rubric td { padding:3.8pt 6pt; border-bottom: .4pt solid rgba(0,0,0,.09);
  vertical-align:top; font-size:8.8pt; line-height:1.42; }
.rb__n { width:12pt; font-family:var(--sans); font-size:7pt; font-weight:700; color:var(--mid);
  text-align:center; }
.rb__c { width:27%; font-weight:700; color:var(--ink); }
.rubric__note { font-size:8pt; font-style:italic; color:var(--soft); margin:3pt 0 0; }

/* ---------- Figures ---------- */
.arch { break-before:page; }
.fig { margin:0 0 16pt; padding:0 0 12pt; border-bottom: .4pt solid var(--rule);
  break-inside:avoid; }
.fig--break { break-before:page; }
.fig__c { font-family:var(--sans); font-size:7pt; letter-spacing:.12em; text-transform:uppercase;
  color:var(--soft); margin:0 0 7pt; padding-bottom:3pt; border-bottom: .4pt solid var(--rule); }
.fig__c b { color:var(--ink); font-weight:700; }
.fig__n { font-size:8.4pt; line-height:1.5; color:#3A3A3A; margin:8pt 0 0; max-width:38em; }

/* ---------- Back matter ---------- */
.clist__after { margin-top:12pt; padding-top:8pt; border-top: .4pt solid var(--rule); }
.clist__after p:last-child { font-family:var(--sans); font-size:8pt; color:var(--soft); margin:0; }

.omt { width:100%; border-collapse:collapse; font-size:8.2pt; margin:10pt 0; }
.omt th { background:${BRAND.ink}; color:#fff; text-align:left; padding:5pt 7pt;
  font-family:var(--sans); font-size:6.8pt; letter-spacing:.12em; text-transform:uppercase; }
.omt td { padding:5.5pt 7pt; border-bottom: .4pt solid #E4E8EF; vertical-align:top; line-height:1.45; }
.omt__s { font-family:var(--sans); font-size:6.8pt; font-weight:700; letter-spacing:.12em;
  text-transform:uppercase; color:var(--bronze); white-space:nowrap; }
.omt__i { font-weight:700; color:var(--ink); width:26%; }
.omt__st { font-family:var(--sans); font-size:7.2pt; color:var(--crimson); font-weight:700;
  white-space:nowrap; }

.colophon { text-align:center; }
.colophon h2::after { content:''; display:block; width:24%; height:.7pt; background:var(--gold);
  margin:7pt auto 14pt; }
.colophon p { max-width:30em; margin:0 auto 8pt; font-size:9.4pt; line-height:1.6; text-align:left; }
.col__orn { display:flex; justify-content:center; margin:0 0 10pt; }
.col__meta { font-family:var(--sans); font-size:7pt; letter-spacing:.06em; color:var(--soft);
  text-align:center !important; margin-top:14pt !important; }
.col__band { margin:12pt auto 0; max-width:70%; }
table.credits { width:100%; max-width:30em; margin:8pt auto 10pt; border-collapse:collapse;
  font-size:8pt; text-align:left; }
table.credits th { background:var(--ink); color:#fff; padding:3.4pt 6pt; font-family:var(--sans);
  font-size:6.2pt; letter-spacing:.12em; text-transform:uppercase; }
table.credits td { padding:3.4pt 6pt; border-bottom:.4pt solid var(--rule); vertical-align:top; }
`;

/* The cover artwork is its own document: a spread at trim + bleed, with
   the spine width calculated from the bound page count. */
const COVER_CSS = `
@page { margin:0; }
* { box-sizing:border-box; }
body { margin:0; -webkit-print-color-adjust:exact; print-color-adjust:exact;
  font-family:${TYPE.serif}; }
.spread { position:relative; background:${PAL.midnightNavy}; overflow:hidden; }
.spread__bleedmarks { position:absolute; inset:0; z-index:5; pointer-events:none; }
.face { position:absolute; top:${BLEED}mm; height:${TRIM.h}mm; overflow:hidden; }
.face__field { position:absolute; inset:0; }
.face__frame { position:absolute; inset:9mm; }

.face--front, .face--back { background:${PAL.midnightNavy}; }
.fc__in, .back__in { position:relative; height:100%; display:flex; flex-direction:column;
  align-items:center; text-align:center; padding:17mm 17mm 13mm; color:${PAL.champagneGold}; }
.fc__corners span { position:absolute; }
/* Inside the inner rule, not outside it. The frame's viewBox inset of
   16 units over a 192 mm face puts the outer rule at about 16 mm, so
   anything placed at 13 mm sits outside the border and reads as damage. */
.fc__c--tl { top:20mm; left:20mm; } .fc__c--tr { top:20mm; right:20mm; transform:rotate(90deg); }
.fc__c--bl { bottom:20mm; left:20mm; transform:rotate(-90deg); }
.fc__c--br { bottom:20mm; right:20mm; transform:rotate(180deg); }
.fc__crest { margin:0 0 7mm; }
.fc__inst { font-family:${TYPE.sans}; font-size:9pt; font-weight:700; letter-spacing:.34em;
  text-transform:uppercase; color:${PAL.champagneGold}; margin:0 0 2pt; ${EMBOSS.gold} }
.fc__camp { font-style:italic; font-size:8.5pt; color:#A8B2C6; margin:0; }
.fc__hair { width:16%; height:.5pt; background:${PAL.royalGold}; opacity:.7; margin:5mm auto 0; }
.fc__medallion { position:relative; margin:auto 0 7mm; width:300px; height:300px;
  display:flex; align-items:center; justify-content:center; }
.fc__rosette { position:absolute; top:0; left:0; }
.fc__emblem { position:relative; }
.fc__title { position:relative; margin:11mm 0 0; }
.fc__the { font-style:italic; font-size:16pt; color:${PAL.royalGold}; margin:0 0 2pt; }
.fc__title h1 { font-size:31pt; line-height:1.16; margin:0; font-weight:700;
  color:${PAL.champagneGold}; letter-spacing:-.005em; ${EMBOSS.gold} }
.fc__rule { width:34%; height:1pt; background:${PAL.royalGold}; margin:6mm auto 5mm; }
.fc__sub { font-family:${TYPE.sans}; font-size:9pt; letter-spacing:.34em; text-transform:uppercase;
  color:#C3CBD9; margin:0; }
.fc__marks { font-family:${TYPE.sans}; font-size:6.6pt; letter-spacing:.24em;
  text-transform:uppercase; color:${PAL.royalGold}; margin:0 0 3mm; }
.fc__dot { margin:0 7pt; opacity:.6; }
.fc__ed { font-family:${TYPE.sans}; font-size:7.4pt; letter-spacing:.24em; text-transform:uppercase;
  color:#A8B2C6; margin:0 0 4mm; }
.fc__band { width:100%; margin:0 0 3mm; }
.fc__press { font-family:${TYPE.sans}; font-size:6.4pt; letter-spacing:.24em;
  text-transform:uppercase; color:#8894AB; margin:0; }

.back__eyebrow { font-family:${TYPE.sans}; font-size:7pt; font-weight:700; letter-spacing:.34em;
  text-transform:uppercase; color:${PAL.royalGold}; margin:0 0 4mm; }
.back__orn { margin:0 0 6mm; }
.back__b { font-size:10pt; line-height:1.62; color:#D6DCE7; text-align:left; margin:0 0 4mm;
  max-width:34em; }
.back__stats { display:flex; gap:9mm; justify-content:center; margin:3mm 0 0;
  border-top: .4pt solid rgba(228,213,168,.35); border-bottom: .4pt solid rgba(228,213,168,.35);
  padding:4mm 0; width:100%; }
.back__stats b { display:block; font-size:16pt; color:${PAL.champagneGold}; line-height:1.1; }
.back__stats span { font-family:${TYPE.sans}; font-size:5.8pt; letter-spacing:.12em;
  text-transform:uppercase; color:#8894AB; }
.back__lh { font-family:${TYPE.sans}; font-size:6.4pt; font-weight:700; letter-spacing:.24em;
  text-transform:uppercase; color:${PAL.royalGold}; margin:6mm 0 3mm; }
.back__levels { list-style:none; margin:0; padding:0; width:100%; max-width:74mm;
  text-align:left; }
.back__levels li { display:flex; align-items:baseline; gap:4mm; padding:1.6mm 0;
  border-bottom: .4pt solid rgba(228,213,168,.2); }
.back__lr { font-size:10pt; font-weight:700; color:${PAL.champagneGold}; min-width:6mm;
  text-align:right; }
.back__ln { flex:1; font-size:9pt; color:#D6DCE7; }
.back__lc { font-family:${TYPE.sans}; font-size:6.2pt; letter-spacing:.18em; text-transform:uppercase;
  color:#8894AB; }
.back__seal { margin:0 0 auto; opacity:.85; }
.back__foot { display:flex; gap:6mm; align-items:center; width:100%; text-align:left; margin:0 0 5mm; }
.back__qr { background:#fff; padding:2mm; line-height:0; }
.back__ids { font-family:${TYPE.sans}; font-size:6.6pt; color:#A8B2C6; line-height:1.7; }
.back__idh { font-size:6.4pt; font-weight:700; letter-spacing:.24em; text-transform:uppercase;
  color:${PAL.royalGold}; margin:0 0 1mm; }
.back__ids p { margin:0; }
.back__ids b { color:#D6DCE7; font-weight:700; }
.back__isbn { font-style:italic; opacity:.75; margin-top:1mm !important; }
.back__band { width:100%; margin:0 0 3mm; }
.back__press { font-family:${TYPE.sans}; font-size:6.4pt; letter-spacing:.24em;
  text-transform:uppercase; color:#8894AB; margin:0; }

.face--spine { background:${PAL.midnightNavy}; display:flex; flex-direction:column;
  align-items:center; justify-content:space-between; padding:8mm 0; }
.spine__rule { position:absolute; top:6mm; bottom:6mm; left:50%; transform:translateX(-50%);
  width:.4pt; background:rgba(228,213,168,.28); }
.spine__txt { position:absolute; top:50%; left:50%; transform:translate(-50%,-50%) rotate(90deg);
  white-space:nowrap; display:flex; align-items:baseline; gap:6mm; }
.spine__t { font-size:11pt; font-weight:700; color:${PAL.champagneGold}; letter-spacing:.02em; }
.spine__s { font-family:${TYPE.sans}; font-size:6.4pt; letter-spacing:.24em; text-transform:uppercase;
  color:#8894AB; }
.spine__bars { position:relative; display:flex; flex-direction:column; gap:1mm; align-items:center;
  margin-top:2mm; }
.spine__bars i { display:block; width:3mm; height:1.2mm; }
.spine__crest { position:relative; margin-bottom:1mm; }
`;

const HEAD = `<!doctype html><html lang="en-GB"><head><meta charset="utf-8">
<title>The International English Fluency Certificate — The Complete Curriculum</title>
<meta name="author" content="Worldwide English College">
<meta name="subject" content="English language curriculum; complete teaching programme">
<meta name="keywords" content="IEFC, Worldwide English College, CEFR, English curriculum, lesson plans">
<style>${CSS}</style></head><body>${DUOTONES}`;

const SECTIONS = [FRONT, ...C.levels.map(renderLevel), BACK];
const document_ = (parts) => `${HEAD}\n${parts.join('\n')}\n</body></html>`;

mkdirSync(path.join(ROOT, 'publication'), { recursive: true });

const exe = process.env.PW_CHROMIUM || '/opt/pw-browsers/chromium-1194/chrome-linux/chrome';
const browser = await chromium.launch(existsSync(exe) ? { executablePath: exe } : {});

/**
 * Count the pages a fragment occupies when set with the book's own CSS.
 *
 * Valid as a measure of its position in the whole book only because
 * every section begins with `break-before: page` and nothing flows
 * across a section boundary — so a section occupies the same number of
 * pages alone as it does in place.
 */
async function pagesOf(parts) {
  const pg = await browser.newPage();
  await pg.setContent(document_(parts), { waitUntil: 'load' });
  const buf = await pg.pdf({ format: 'A4', printBackground: true, preferCSSPageSize: true });
  await pg.close();
  return (buf.toString('latin1').match(/\/Type\s*\/Page(?![s])/g) || []).length;
}

/**
 * ────────────────────────────────────────────────────────────────────
 * RECTO IMPOSITION
 * ────────────────────────────────────────────────────────────────────
 * A level divider belongs on a recto. Chromium's `break-before: recto`
 * reports as supported by CSS.supports() and does nothing — verified,
 * not assumed — so the imposition is done here instead: measure where
 * each level actually starts, and where it would fall on a verso,
 * insert the quiet leaf that pushes it across the fold.
 *
 * ONLY the six level dividers are imposed. The sixty module openers are
 * deliberately NOT, and that is an editorial decision rather than an
 * omission: forcing sixty openers to recto would insert roughly thirty
 * near-empty leaves into a working teacher's manual to buy an effect
 * the reader of a reference book does not get to enjoy. Six leaves at
 * most is a rounding error; thirty is padding, and padding a book to
 * look luxurious is the opposite of designing it.
 */
const measured = [];
for (const sec of SECTIONS) measured.push(await pagesOf([sec]));

const parts = [];
let cursor = 0;      // pages placed so far
let inserted = 0;
const impositionLog = [];
SECTIONS.forEach((sec, i) => {
  const isLevel = i >= 1 && i <= C.levels.length;
  if (isLevel) {
    const lv = C.levels[i - 1];
    // The target composition is a spread: PLATE on the verso, DIVIDER on
    // the facing recto. Pages are 1-based, so odd is recto.
    //
    //   next page even  → it is a verso: plate there, divider follows. 1pp.
    //   next page odd   → a plate there would be a recto and the divider
    //                     would fall on the verso, which is the failure
    //                     this whole mechanism exists to prevent. A quiet
    //                     leaf takes the recto, the plate takes the verso
    //                     behind it, the divider takes the next recto. 2pp.
    let next = cursor + 1;
    if (next % 2 === 1) {
      parts.push(rectoLeaf(lv));
      cursor += 1;
      inserted += 1;
      next += 1;
    }
    parts.push(photoPlate(lv));
    cursor += 1;
    inserted += 1;
    impositionLog.push(`${lv.roman}: plate p${next} (verso) · divider p${next + 1} (recto)`);
  }
  parts.push(sec);
  cursor += measured[i];
});

const html = document_(parts);
const htmlPath = path.join(ROOT, 'publication', '.flagship.html');
writeFileSync(htmlPath, html);

// Navigated rather than injected: setContent() has no base URL, so the
// plates' relative image paths would resolve to nothing and six pages
// would print as empty ink-coloured rectangles — a failure that looks
// like a design choice.
const page = await browser.newPage();
await page.goto(`file://${htmlPath}`, { waitUntil: 'load' });
await page.evaluate(() => Promise.all(
  [...document.images].filter((i) => !i.complete)
    .map((i) => new Promise((r) => { i.onload = r; i.onerror = r; }))));
const out = path.join(ROOT, 'publication', 'IEFC Complete Curriculum.pdf');
await page.pdf({
  path: out, format: 'A4', printBackground: true, preferCSSPageSize: true,
  displayHeaderFooter: true,
  headerTemplate: '<div style="font:400 6pt Calibri,Arial,sans-serif;color:#9AA0AE;width:100%;'
    + 'padding:0 20mm;text-align:right;letter-spacing:.12em;text-transform:uppercase;">'
    + 'The International English Fluency Certificate · The Complete Curriculum</div>',
  footerTemplate: '<div style="font:400 7.5pt Calibri,Arial,sans-serif;color:#6B7280;width:100%;'
    + 'padding:0 20mm;text-align:center;"><span class="pageNumber"></span></div>',
  margin: { top: '17mm', bottom: '15mm', left: '20mm', right: '20mm' },
  tagged: true, outline: true,
});

// ---- The cover artwork ----------------------------------------------
// Produced only after the text block exists, because the spine width is
// a function of the bound page count. Rendering the cover first would
// mean guessing it, and a guessed spine is a cover that wraps.
const pages = countPages(readFileSync(out));
const spine = spineWidth(pages);
const coverHtml = `<!doctype html><html lang="en"><head><meta charset="utf-8">
<title>IEFC Complete Curriculum — cover artwork</title>
<style>${COVER_CSS}</style></head><body>${coverSpread(ID, spine, C.levels)}</body></html>`;
writeFileSync(path.join(ROOT, 'publication', '.cover.html'), coverHtml);

const cpage = await browser.newPage();
await cpage.setContent(coverHtml, { waitUntil: 'load' });
const coverOut = path.join(ROOT, 'publication', 'IEFC Cover Artwork.pdf');
await cpage.pdf({
  path: coverOut, printBackground: true,
  width: `${TRIM.w * 2 + spine + BLEED * 2}mm`, height: `${TRIM.h + BLEED * 2}mm`,
  margin: { top: '0', bottom: '0', left: '0', right: '0' },
});
await browser.close();

/**
 * Count pages by scanning the PDF for page objects.
 *
 * `/Type /Page` also matches the leading substring of `/Type /Pages`,
 * the tree node — so the negative lookahead is not a nicety. Without it
 * the count is one too high, the spine is 0.1 mm too wide, and nothing
 * about the output looks wrong.
 */
function countPages(buf) {
  const s = buf.toString('latin1');
  return (s.match(/\/Type\s*\/Page(?![s])/g) || []).length;
}

console.log(`FLAGSHIP  ${out}`);
console.log(`  ${C.totals.lessons} items · ${C.totals.modules} modules · ${C.totals.questions} questions · `
  + `${C.totals.bodyWords.toLocaleString('en-GB')} words of lesson content`);
console.log(`  ${pages} pages · Document ID ${ID.documentId} · issue ${ID.issueCode}`);
console.log(`  imposition: ${inserted} recto leaf/leaves inserted`);
for (const line of impositionLog) console.log(`    ${line}`);
console.log(`COVER     ${coverOut}`);
console.log(`  spread ${TRIM.w * 2 + spine + BLEED * 2} × ${TRIM.h + BLEED * 2} mm · `
  + `spine ${spine} mm at ${pages} pages · ${BLEED} mm bleed`);
