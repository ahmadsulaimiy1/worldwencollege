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
import { editionMark, runningFoot } from './rights.mjs';
import { legacyBlock, ecosystem } from './legacy.mjs';
import { frontMatter, backMatter, coverSpread, spineWidth, TRIM, BLEED } from './covers.mjs';
import { guillocheRosette, guillocheBand, girihRosette, frame, cornerFan, fleuron, crest, EMBOSS } from './ornament.mjs';
import { stageIcon, GENERIC_ICON } from './icons.mjs';
import { parseRubric } from './curriculum.mjs';
import { ascentChart, architectureGrid, lessonAnatomy, assessmentMap,
  learnerJourney, spiralMap } from './diagrams.mjs';
import { subjectIndex, lexicalIndex, assessmentIndex, alphabetise, topicOf } from './indexes.mjs';
import { crossReferences, pullQuotes, glossary, routes as buildRoutes, revisionByModule,
  pronunciationStrand, grammarStages } from './apparatus.mjs';
import { writeFileSync, readFileSync, mkdirSync, existsSync, rmSync } from 'node:fs';
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

// The apparatus, computed once. Every one of these is an extraction
// from curriculum the College already authored — see apparatus.mjs for
// what each is taken from and what is deliberately not built.
const XREF = crossReferences(C);
const QUOTES = pullQuotes(C);
const GLOSS = glossary(C);
const ROUTES = buildRoutes(C);
const REVISION = revisionByModule(C);
const GRAMMAR = grammarStages(C);
const PRON = pronunciationStrand(C);

/**
 * ────────────────────────────────────────────────────────────────────
 * THREE EDITIONS FROM ONE SOURCE
 * ────────────────────────────────────────────────────────────────────
 * `IEFC_EDITION=student npm run curriculum` and so on. One curriculum,
 * one design system, one set of extractors; what differs is which
 * apparatus each reader is given.
 *
 * TEACHER'S EDITION (the default, and what this book has always been).
 *   Everything: answer keys printed beneath their questions, full
 *   grading rubrics, designed timings, formative-assessment stages, and
 *   the guide to teaching from the volume.
 *
 * STUDENT EDITION.
 *   The same curriculum, with exactly two removals: the answer keys,
 *   because a quiz printed with its key beside it is not an assessment,
 *   and the teacher's guide, which is addressed to somebody else.
 *
 *   Nothing else goes. In particular the grading rubrics STAY — a
 *   learner is entitled to read the criteria they will be marked
 *   against, and hiding them would be a pedagogical choice dressed as
 *   an editorial one. Nor is anything added: there is no motivational
 *   apparatus written for this edition, because writing encouragement
 *   the curriculum does not contain is exactly the invention this
 *   project refuses.
 *
 * INSTITUTIONAL EDITION.
 *   For ministries, accreditation panels, university partners and
 *   employers: the programme's architecture without its 294 lesson
 *   bodies. Front matter, the six measured figures, the awards, every
 *   level's divider and plate and contents, the assessment index, the
 *   glossary and the colophon.
 *
 *   It is a shorter book, and being shorter is the point: a reviewer
 *   asking what this qualification IS should not have to read ninety
 *   thousand words of lesson content to find out. It also carries the
 *   same unflattering figures as the full edition — the competency
 *   column is empty in every edition, because it is empty.
 */
const EDITIONS = {
  teacher: { key: 'teacher', name: 'Teacher’s Edition',
    file: 'IEFC Complete Curriculum',
    lessons: true, answerKeys: true, teacherGuide: true,
    note: 'This is the teacher’s edition. Every assessed quiz prints its answer key immediately '
      + 'beneath the questions, and every assignment carries the full grading rubric a marker '
      + 'works from.' },
  student: { key: 'student', name: 'Student Edition',
    file: 'IEFC Complete Curriculum (Student Edition)',
    lessons: true, answerKeys: false, teacherGuide: false,
    note: 'This is the student edition. It carries the whole curriculum — every lesson, every '
      + 'assessment brief and every grading rubric, so you can read the criteria you will be '
      + 'marked against. The answer keys are printed in the teacher’s edition only.' },
  institutional: { key: 'institutional', name: 'Institutional Edition',
    file: 'IEFC Programme Architecture (Institutional Edition)',
    lessons: false, answerKeys: false, teacherGuide: false,
    note: 'This is the institutional edition: the architecture of the qualification without the '
      + 'lesson content that fills it. Every figure, count and reference in it is generated from '
      + 'the same academic database as the complete curriculum, and the complete curriculum is '
      + 'available in full as a separate volume.' },
};
const EDITION = EDITIONS[process.env.IEFC_EDITION || 'teacher'] || EDITIONS.teacher;

// The edition mark printed in the foot of every page. Keyed on the
// edition as well as the volume, so the teacher's, student's and
// institutional cuts of the same curriculum are separately traceable —
// which is the point, since they are handed to different people. See
// rights.mjs.
const MARK = editionMark(`flagship/${process.env.IEFC_EDITION || 'teacher'}`, ID.contentDigest);


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

// A stage's parenthetical is usually a duration — "(5 min)" — and is set
// as a badge beside the heading. Ninety of the thousand are not: they
// are sentences, up to 142 characters, and setting those as a badge
// wrapped them into a two-line italic block jammed against a two-line
// heading. Anything longer than a short phrase is a note and is set as
// one, on its own line at the full measure.
const DURATION = /^\d+\s*(?:-\s*\d+\s*)?(?:min|minutes|hrs?|hours?)\b/i;
const isBadge = (t) => DURATION.test(t.trim()) || t.trim().length <= 26;

function renderStage(s) {
  if (!s.head) return `<div class="stage stage--intro">${renderParts(s.parts)}</div>`;
  const mark = (s.icon && stageIcon(s.icon, { size: 13 })) || GENERIC_ICON;
  const emph = s.icon && EMPHASIS_STAGES.has(s.icon) ? ' stage--emph' : '';
  // A stage is held whole so a two-line practice note never straddles
  // the fold. A grading rubric is a stage too, and a five-criterion
  // rubric is a third of a page: held whole it jumped to the next leaf
  // and left the assignment brief sitting above a quarter-page of
  // nothing, sixty times. It is the one stage allowed to split — its
  // table repeats its heading and keeps its rows whole, so a marker
  // reading across the fold loses nothing.
  const splits = s.icon === 'rubric' ? ' stage--splits' : '';

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

  const badge = s.timing && isBadge(s.timing);
  return `<section class="stage${emph}${splits}">
    <h5 class="stage__h"><span class="stage__mk">${mark}</span>${typo(s.head)}${
  badge ? `<span class="stage__t">${typo(s.timing)}</span>` : ''}</h5>
    ${s.timing && !badge ? `<p class="stage__note">${typo(s.timing)}</p>` : ''}
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
    `<li${EDITION.answerKeys && i === q.correctIndex ? ' class="is-key"' : ''}>${typo(c)}</li>`).join('')}</ol>
  </li>`).join('');
  if (!EDITION.answerKeys) return `<ol class="quiz">${qs}</ol>`;
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

  // THE CROSS-REFERENCES.
  //
  // Extracted from the lesson's own PREREQUISITE KNOWLEDGE stage, which
  // says things like "Level V, Module 3 (inversion for emphasis) and
  // Module 4 (hedging)". The prose stays exactly where it was — the
  // parenthetical glosses are more useful than any reference — and this
  // line adds what the prose could not: a scannable set of references in
  // the same numbering as the contents, the indexes and the platform.
  const xrefs = XREF.forward.get(ref) || [];
  const builds = xrefs.length
    ? `<p class="xref"><span class="xref__l">Builds on</span>${xrefs.map((r) =>
      `<span class="xref__r">${esc(r.ref)}</span>`).join('')}</p>` : '';

  return `<article class="lesson${isAssessed ? ' lesson--assessed' : ''}"
    id="l-${lv.roman}-${mod.sequence}-${les.sequence}">
    <header class="lesson__h${isAssessed ? ' lesson__h--cer' : ''}">
      <div class="lesson__top">
        <p class="lesson__k">${esc(kind)}</p>
        <p class="lesson__ref">${ref}</p>
      </div>
      <h4>${typo(les.title)}</h4>
      ${meta ? `<p class="lesson__meta">${meta}</p>` : ''}
      ${builds}
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
/**
 * THE MODULE OPENER'S VISUAL SYSTEM.
 *
 * ────────────────────────────────────────────────────────────────────
 * WHAT WAS WRONG WITH THE PREVIOUS ONE
 * ────────────────────────────────────────────────────────────────────
 * Sixty module openers were laid out identically and ended with the
 * same sentence — "Every module in this programme ends with an assessed
 * quiz and an assessed assignment carrying a full grading rubric. This
 * one is no exception." True, useful once, and printed sixty times. A
 * reader meets it at Module 2 and stops reading the foot of an opener
 * for the rest of the book, which is a poor return on sixty
 * appearances.
 *
 * Four things replace it, and every one of them differs by module
 * because it is read out of that module:
 *
 *   THE STAGE FINGERPRINT — the distinct teaching stages this module
 *     actually uses, drawn from the same icon set as the lesson tapes.
 *     No two modules produce the same row, so an opener now looks like
 *     its own module rather than like the template.
 *
 *   THE CROSS-REFERENCES — what this module builds on, and which later
 *     lessons come back to it. Both extracted; see apparatus.mjs.
 *
 *   THE PULL QUOTE — the module's own discussion prompt, in the
 *     curriculum's voice, with its reference. Present for 48 of the 60;
 *     absent where the curriculum has nothing that stands alone, rather
 *     than relaxed until something qualified.
 *
 *   THE COLOUR BAND — the level's guilloché, as before.
 *
 * No photography. Sixty licensed photographs is a budget rather than a
 * design decision, and the same nine images repeated across sixty
 * openers would read as a shortage. That one stays in the register as
 * external licensing, which is what it is.
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

  // The stage fingerprint: which teaching moves this module uses, in
  // the order they are first met.
  const seen = new Map();
  for (const les of mod.lessons) {
    for (const st of les.stages) {
      if (st.icon && st.head && !seen.has(st.icon)) seen.set(st.icon, st.head);
    }
  }
  const fingerprint = [...seen.entries()].map(([icon, head]) =>
    `<span class="mfp__i" title="${esc(head)}">${stageIcon(icon, { size: 13 }) || GENERIC_ICON}</span>`).join('');

  // What this module's lessons declare they build on, outside itself.
  const own = `${lv.roman}.${mod.sequence}`;
  const buildsOn = [...new Set(mod.lessons.flatMap((l) =>
    (XREF.forward.get(`${lv.roman}.${mod.sequence}.${l.sequence}`) || [])
      .map((r) => `${r.level}.${r.module}`))
    .filter((k) => k !== own))];
  const returned = XREF.back.get(own) || [];

  const refLine = (label, refs, cls) => (refs.length
    ? `<p class="mxr ${cls}"><span class="mxr__l">${label}</span>${refs.map((r) =>
      `<span class="mxr__r">${esc(r)}</span>`).join('')}</p>` : '');

  const quote = QUOTES.get(own);

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
          ${fingerprint ? `<div class="mfp">${fingerprint}</div>` : ''}
        </div>
      </div>
      <div class="moduleopen__stats">
        ${[[mod.lessons.length, 'Items'], [counts.reading || 0, 'Teaching'],
    [qs, 'Questions'], [mins || '—', mins ? 'Minutes designed' : 'Not timed']]
    .map(([v, l]) => `<div><b>${v}</b><span>${l}</span></div>`).join('')}
      </div>
      ${refLine('Builds on', buildsOn, 'mxr--fwd')}
      ${refLine('Returned to in', returned, 'mxr--back')}
      <p class="moduleopen__ch">In this module</p>
      <ol class="moduleopen__list">${contents}</ol>
      ${quote ? `<figure class="mq">
        <blockquote>${typo(quote.quote)}</blockquote>
        <figcaption>Discussion prompt · ${esc(quote.ref)}</figcaption>
      </figure>` : `<div class="moduleopen__foot">
        <span class="moduleopen__seal">${girihRosette({ size: 34, stroke: p.mid, width: 0.7, opacity: 0.7 })}</span>
        <p>This module closes, as all sixty do, with an assessed quiz and an assessed assignment
          carrying a full grading rubric.</p>
      </div>`}
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
  <defs>${ROMAN.map((r) => duotoneFilter(r, paletteFor(r))).join('')}
  ${duotoneFilter('brand', { ink: PAL.royalBlue, wash: '#F4F7FD' })}</defs></svg>`;

/**
 * A photographic band at the head of an institutional section.
 *
 * The level plates belong to their levels and take the level's duotone.
 * These three belong to the institution, so they take the College's own
 * royal blue — the same construction, one tier up. Set as a band rather
 * than a full page because these sections carry reference matter a
 * reader has come to USE, and a full-page image before an index is a
 * page between the reader and the thing they are looking up.
 */
function photoBand(file, alt) {
  return `<div class="band"><img src="${file}" alt="${esc(alt)}"
    style="filter:url(#duo-brand)"><span class="band__rule"></span></div>`;
}

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
    <!-- THE LEVEL'S OWN CONTENTS.
         This page carried the graduate profile and the purpose and
         nothing else, so it filled about a third of its height and then
         stopped — six times, each of them the page facing the first
         module opener of a level. The measurement said 17%.

         What belongs in that space is not decoration but the thing the
         reader has just been promised and cannot see: the ten modules
         of the level they have opened. The global contents lists them
         eighty pages earlier; here they are where a learner starting
         the level actually looks. Everything on it is read from the
         curriculum. -->
    <p class="label lvintro__ch">The ten modules of this level</p>
    <ol class="lvcon">${lv.modules.map((m) => {
    const teach = m.lessons.filter((x) => x.kind === 'reading').length;
    const mins = m.lessons.map(designedMinutes).filter(Boolean).reduce((a, b) => a + b, 0);
    return `<li>
      <span class="lvcon__n">${m.sequence}</span>
      <span class="lvcon__t">${typo(shortModuleTitle(m))}</span>
      <span class="lvcon__m">${teach} teaching · quiz · assignment${mins ? ` · ${mins} min` : ''}</span>
    </li>`;
  }).join('')}</ol>
    <p class="lvintro__close">Every module closes with an assessed quiz and an assessed assignment
      carrying a full grading rubric. Completing all ten confers
      <b>${typo(lv.awardTitle || '')}</b>${lv.postNominal ? ` (${esc(lv.postNominal)})` : ''}.</p>
  </section>
  ${EDITION.lessons ? modules : ''}
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

// The per-claim evidence audit is an internal quality instrument and is
// published in the Internal Editorial Bible, not in a prospectus. What
// remains public is what the curriculum demonstrably contains.
void claimRows;

const CONTENTS = `<section class="contents">
  <p class="ed__eyebrow">Contents</p>
  <h2>The Programme</h2>
  <ol class="clist">${contents}</ol>
  <div class="editionnote">
    <p class="label">This edition</p>
    <p><b>${esc(EDITION.name)}.</b> ${typo(EDITION.note)}</p>
  </div>
  <div class="clist__after">
    <p class="label">Apparatus</p>
    <p>${[EDITION.lessons && 'How to Read a Lesson', 'The Six Awards',
    EDITION.teacherGuide && 'Teaching from This Book', 'The Shape of the Programme', 'Glossary',
    EDITION.lessons && 'Routes Through the Programme', EDITION.lessons && 'The Pronunciation Strand',
    EDITION.lessons && 'Subject Index', EDITION.lessons && 'Vocabulary and Phrase Index',
    'Assessment Index', 'Colophon'].filter(Boolean).join(' · ')}</p>
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
    teacher can find it at a glance.${EDITION.answerKeys
    ? ' An assessed quiz prints its answer key immediately beneath it — this is a teacher\u2019s edition.'
    : ' Answer keys are printed in the teacher\u2019s edition only.'}</p>
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
  <p class="lead">Six figures, each measured from the curriculum in this volume rather than drawn
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

  <figure class="fig fig--break">
    <figcaption class="fig__c"><b>Figure 4</b> The assessment map</figcaption>
    ${assessmentMap(C.levels, critByLevel)}
    <p class="fig__n">The right-hand column is the one that matters. Every module carries two
      assessments and a full grading rubric — 120 assessments and
      ${Object.values(critByLevel).reduce((a, b) => a + b, 0)} rubric criteria in total. None of the
      120 is mapped to a named competency. The College defines the IEFC as a qualification extending
      CEFR proficiency through competency verification; until that column is populated, the
      definition is an intention rather than a demonstration, and establishing the mapping is the
      founding task of the Board of Academic Standards and Curriculum Excellence.</p>
  </figure>

  <figure class="fig fig--break">
    <figcaption class="fig__c"><b>Figure 5</b> A learner's path</figcaption>
    ${learnerJourney(C.levels)}
    <p class="fig__n">The same shape at three scales. A module is a run of teaching lessons closed
      by two assessments; a level is ten modules closed by an award; the programme is six levels,
      each a prerequisite to the next. That recursion is the reason a teacher who has taught one
      module of this programme has learned the shape of all sixty, and the reason a learner always
      knows what the next four months will cost them.</p>
    <p class="fig__n">The third register is the only one that is not uniform, and the rise it shows
      is depth rather than duration — the same finding as Figure 1, drawn here as the ascent a
      learner actually walks.</p>
  </figure>

  <figure class="fig fig--break">
    <figcaption class="fig__c"><b>Figure 6</b> The spiral, measured</figcaption>
    ${spiralMap(C.levels, XREF.back)}
    <p class="fig__n">Every teaching lesson in this programme opens by naming what must already be
      secure, and ${XREF.forward.size} of them name a specific module. Collected, those declarations
      make the spiral testable rather than rhetorical: each cell above is a module, weighted by the
      number of later lessons that come back to it. ${
  [...XREF.back.values()].reduce((a, v) => a + v.length, 0)} such returns are printed in this
      volume, and they are set beside the lessons themselves as cross-references.</p>
    <p class="fig__n">The pale cells are the honest part. Some modules are never named again by a
      later lesson; the count also thins toward Level VI for the arithmetic reason that fewer
      lessons remain to do the naming. Neither observation is a defect on its own, and both are
      printed because a figure showing only the returns would have argued rather than measured.</p>
  </figure>
</section>`;

// ---- The awards, side by side ---------------------------------------
// Every value already exists in the award definitions. Set as one table
// a reader can see the whole qualification at once, which six separate
// dividers cannot do however well each is designed.
const AWARDS = `<section class="awards">
  ${photoBand('img/band-awards.jpg', 'Students in conversation in a university library')}
  <p class="ed__eyebrow">The qualification</p>
  <h2>The Six Awards</h2>
  <p class="lead">Each level confers an award in its own right, and each is a prerequisite to the
    next. A learner whose purpose is met at the third level leaves with the third award.</p>
  <table class="awt"><thead><tr>
    <th scope="col">Level</th><th scope="col">Programme</th><th scope="col">CEFR</th>
    <th scope="col">Award conferred</th><th scope="col">Post-nominal</th>
    <th scope="col">Standing</th></tr></thead>
    <tbody>${C.levels.map((lv) => {
    const p = paletteFor(lv.roman);
    return `<tr>
      <td class="awt__r" style="color:${p.ink}">${esc(lv.roman)}</td>
      <td><b>${typo(lv.name)}</b></td>
      <td class="awt__c">${esc(lv.cefr)}</td>
      <td>${typo(lv.awardTitle || '—')}</td>
      <td class="awt__p" style="color:${p.mid}">${esc(lv.postNominal || '—')}</td>
      <td class="awt__s">${typo(lv.standing || '—')}</td></tr>`;
  }).join('')}</tbody></table>
  <p class="small">Every award, post-nominal and standing above is held in the College\u2019s award
    definitions and printed from them. Duration is four months per level, twenty-four months for
    the full ascent.</p>
</section>`;

// ---- Teaching from this book ----------------------------------------
const GUIDE = `<section class="guide">
  ${photoBand('img/band-guide.jpg', 'A student working at a laptop in a library')}
  <p class="ed__eyebrow">For the teacher</p>
  <h2>Teaching from This Book</h2>
  <p class="lead">The apparatus on every lesson page is designed to be used in a particular way.
    This page explains it once, so the rest of the volume does not have to.</p>

  <h3>Before the session</h3>
  <p>Read the objectives first: they are always the opening stage and they state what the learner
    should be able to do by the end, not what will be covered. Then look at the stage tape beneath
    the lesson title \u2014 the row of marks showing the shape of the session at a glance \u2014 and the
    designed minutes beside it. That figure is summed from the timings the curriculum sets on its
    own stages, so a lesson showing 45 minutes was built to fill 45 minutes.</p>

  <h3>During the session</h3>
  <p>The stages run in the printed order. Timings in brackets are designed durations, not limits;
    a stage without a timing is not time-boxed and is meant to expand or contract with the class.
    Model dialogue is set apart from instruction, with the speaker labels in the level\u2019s colour,
    so it can be found without reading the page. Numbered practice items are the learner\u2019s to do
    \u2014 they are not examples for the teacher to work through.</p>
  <p>The formative assessment stage is the decision point. It exists to tell you whether to move
    on, and it is placed where the answer still changes what you do next. If the check fails, the
    revision stage of the following lesson is the designed place to return.</p>

  <h3>Assessing</h3>
  <p>Every module ends the same way: an assessed quiz, then an assessed assignment. The quiz
    prints its answer key immediately beneath the questions, because this is a teacher\u2019s edition
    and hunting for a key at the back of a 487-page book is a design failure. The assignment
    carries a full grading rubric set as a table \u2014 the criterion on the left, what the marker is
    looking for on the right. Mark down the criteria in order; the rubric is the instrument, not a
    summary of one.</p>

  <h3>Following a thread</h3>
  <p>Beneath the title of most teaching lessons is a line reading <em>Builds on</em>, followed by
    one or more references. Those are not editorial suggestions: they are the modules the lesson\u2019s
    own prerequisite stage names, set as references so they can be followed. The module openers
    carry the same relation in both directions \u2014 what the module builds on, and which later
    lessons come back to it \u2014 which is how the spiral structure of the programme becomes visible
    from inside it. Figure 6 shows the whole of that graph at once.</p>
  <p>Where a module opener ends in a quoted question, that question is the module\u2019s own discussion
    prompt, lifted from the lesson named beside it. It is there to say what the module is really
    about before the reader meets the first stage.</p>

  <h3>Finding your way back</h3>
  <p>Six reference sections close the volume. The <em>Glossary</em> defines the terms of art the
    curriculum uses, with the lesson that first uses each. <em>Routes Through the Programme</em>
    gives four ways to move through the book other than front to back \u2014 vocabulary, communication,
    reading and writing, and the examination route. <em>The Pronunciation Strand</em> collects the
    pronunciation focus of every lesson that has one, in order. Then three indexes: the
    <em>Subject Index</em> answers "which lessons cover this?"; the <em>Vocabulary and Phrase
    Index</em> answers "where was this word taught?"; the <em>Assessment Index</em> lists all 120
    assessed items in one place for planning a term.</p>
  <p>All of them point to lesson references \u2014 ${'IV.7.3'} means Level IV, Module 7, item 3 \u2014 rather
    than page numbers, so they stay correct across editions and match the numbering used on the
    platform.</p>
</section>`;

// ---- The glossary -----------------------------------------------------
// Every headword is counted across the curriculum before it is printed,
// and the count and first use are set beside the definition so a reader
// can check that this page describes the book rather than the field.
// Three proposed headwords were dropped by that check.
const GLOSSARY = `<section class="gloss">
  ${photoBand('img/band-glossary.jpg', 'The thumb index of a printed English dictionary')}
  <p class="ed__eyebrow">Reference</p>
  <h2>Glossary of Programme Terminology</h2>
  <p class="lead">${GLOSS.length} terms of art the curriculum uses, defined as the field defines
    them. Each entry names the lesson that first uses the term and how many times the programme
    uses it in total.</p>
  <p class="gloss__note">These are definitions, not claims. Each states what a term means in
    language teaching and applied linguistics; none describes a standard, a procedure or a
    validation the College has established. Where the curriculum uses a term in one of its
    several senses, the sense defined is the one the curriculum teaches — anaphora, for instance,
    is defined here as the figure of rhetoric taught in Level VI and not as the grammatical
    reference relation, because the second sense appears nowhere in this programme.</p>
  <dl class="gl">${GLOSS.map((e) => `<div class="gl__e">
    <dt>${typo(e.term)}${e.expansion ? `<span class="gl__x">${typo(e.expansion)}</span>` : ''}</dt>
    <dd>${typo(e.definition)}<span class="gl__m">${esc(e.first)} · ${e.count} use${
  e.count === 1 ? '' : 's'}</span></dd>
  </div>`).join('')}</dl>
</section>`;

// ---- The routes -------------------------------------------------------
const ROUTE_SECTION = `<section class="routes">
  ${photoBand('img/band-routes.jpg', 'Two students working through notes and textbooks at a desk')}
  <p class="ed__eyebrow">Reference</p>
  <h2>Routes Through the Programme</h2>
  <p class="lead">Ways to move through this book other than front to back — for a learner revising
    before an assessment, or a teacher assembling a short course from what is already written.</p>

  <h3>The strands that are not routes</h3>
  <p>Five strand routes were built for this section and four of them were withdrawn, because when
    they were set they were identical to one another and to the contents list. The reason is worth
    a paragraph, because it is the strongest structural claim this curriculum makes.</p>
  <p>Of the ${ROUTES.pool} teaching lessons in the programme, these carry the named stage in
    question:</p>
  <table class="cov"><thead><tr><th scope="col">Strand</th><th scope="col">Lessons</th>
    <th scope="col">Coverage</th></tr></thead><tbody>${
  ROUTES.universal.map((r) => `<tr><td>${typo(r.name.replace(/^The | route$/g, ''))}</td>
      <td class="mono">${r.total} of ${r.pool}</td>
      <td class="cov__p">${Math.round(r.coverage * 100)}%</td></tr>`).join('')}</tbody></table>
  <p>A filter that selects everything is not a route. A learner asking "where is the vocabulary
    taught?" is asking about all ${ROUTES.pool} lessons, and four pages of references saying so
    would have been apparatus concealing a finding rather than carrying one. Figure 3 sets out the
    same measurement across every named stage in the book.</p>
  <p>There is also no grammar route, and the reason is the same measurement. Across all
    ${C.totals.lessons} authored items the curriculum names a grammar stage
    ${GRAMMAR.length === 1 ? 'exactly once' : `${GRAMMAR.length} times`} —
    ${GRAMMAR.map((g) => `<b>${esc(g.ref)}</b>, <em>${typo(g.head.toLowerCase())}</em>`).join('; ')}
    — which is a revision summary of what has already been taught rather than a strand running
    through the book. Assembling a grammar route from the rest would mean reading every lesson and
    deciding which of the language points it teaches counts as grammar: a subject-matter judgement
    for the Board of Academic Standards and Curriculum Excellence, not an editorial one. It would
    have been set in the same type as the route above and would not have been the same kind of
    thing.</p>

  ${ROUTES.printed.map((r) => `<div class="rt">
    <p class="rt__h">${esc(r.name)}<span>${r.total} of ${r.pool} items</span></p>
    <p class="rt__b">${typo(r.blurb)}</p>
    ${r.perModule
    ? `<p class="rt__p">It is taught in the opening item of ${r.modules} of the
        ${C.totals.modules} modules${r.missingModules.length
  ? `. The ${r.missingModules.length} without it are ${r.missingModules.map((m) =>
    `<b>${esc(m.ref)}</b>`).join(', ')} — the review and consolidation module at the end of
        Levels ${[...new Set(r.missingModules.map((m) => m.ref.split('.')[0]))].join(', ')},
        which consolidates what those levels have already set out rather than introducing a
        further lexical set` : ''}. Because every one of those items is the module opener, the
        route is the module list, and it is stated here rather than tabulated.</p>`
    : r.levels.map(({ lv, mods }) => {
      const p = paletteFor(lv.roman);
      return `<p class="rt__l" style="--mid:${p.mid};--ink:${p.ink}">
        <span class="rt__lv">${esc(lv.roman)}</span>${mods.map((m) =>
    `<span class="rt__m">${m.refs.join(' ')}</span>`).join('')}</p>`;
    }).join('')}
  </div>`).join('')}

  <h3>The revision route</h3>
  <p>Before each assessed quiz, what the module's own lessons send the class back to. Every
    reference below is the union of what that module's revision and prerequisite stages already
    name, outside the module itself — so this is the curriculum's own answer to "what should I
    revise", collected rather than composed.</p>
  ${REVISION.map(({ lv, rows }) => {
    const p = paletteFor(lv.roman);
    return `<div class="rv" style="--ink:${p.ink};--mid:${p.mid}">
      <p class="asx__h">Level ${esc(lv.roman)} · ${typo(lv.name)} · CEFR ${esc(lv.cefr)}</p>
      <table class="rvt"><thead><tr><th scope="col">Module</th>
        <th scope="col">Return to</th><th scope="col">Before</th></tr></thead><tbody>
        ${rows.map((r) => `<tr>
          <td><b>${r.module}</b> ${typo(topicOf(r.title))}</td>
          <td class="mono">${r.targets.length ? r.targets.join(' · ') : '—'}</td>
          <td class="mono">${[r.quizRef, r.asgRef].filter(Boolean).join(' · ')}</td></tr>`).join('')}
      </tbody></table></div>`;
  }).join('')}
  <p class="small">A dash means the module's lessons name no module outside their own — true of
    the first module of the programme, which has nothing behind it.</p>
</section>`;

// ---- The pronunciation strand ----------------------------------------
const PRONUNCIATION = `<section class="pron">
  <p class="ed__eyebrow">Reference</p>
  <h2>The Pronunciation Strand</h2>
  <p class="lead">Pronunciation practice is a named stage in ${
  PRON.reduce((a, g) => a + g.rows.length, 0)} lessons of this programme. Collected here, it can be
    read as the strand it is: what is drilled, in what order, and where.</p>
  <p class="gloss__note">Every focus below is the curriculum's own sentence, printed whole. Nothing
    on this page was written for it.</p>
  ${PRON.map(({ lv, rows }) => {
    const p = paletteFor(lv.roman);
    return `<div class="pron__g" style="--ink:${p.ink};--mid:${p.mid}">
      <p class="asx__h">Level ${esc(lv.roman)} · ${typo(lv.name)} · CEFR ${esc(lv.cefr)}</p>
      <table class="prt"><thead><tr>
        <th scope="col">Item</th><th scope="col">Focus</th><th scope="col">Designed</th>
      </tr></thead><tbody>${rows.map((r) => `<tr>
        <td class="mono">${esc(r.ref)}</td>
        <td>${typo(r.focus)}</td>
        <td class="prt__t">${r.timing ? typo(r.timing) : '—'}</td></tr>`).join('')}
      </tbody></table></div>`;
  }).join('')}
</section>`;

// ---- The indexes ------------------------------------------------------
const SUBJECTS = subjectIndex(C);
const LEXIS = lexicalIndex(C);
const ASSESSMENTS = assessmentIndex(C);

const indexBlock = (entries, cls) => `<div class="idx ${cls}">${
  alphabetise(entries).map(([letter, rows]) => `<div class="idx__g">
    <p class="idx__l">${letter}</p>
    ${rows.map((e) => `<p class="idx__e">${typo(e.term)}<span class="idx__r">${
  e.refs.join(', ')}</span></p>`).join('')}
  </div>`).join('')}</div>`;

const INDEXES = `<section class="index">
  ${photoBand('img/band-index.jpg', 'Students at a university lecture')}
  <p class="ed__eyebrow">Index one of three</p>
  <h2>Subject Index</h2>
  <p class="lead">${SUBJECTS.length} subjects, from the titles the curriculum gives its own
    lessons. References are LEVEL.MODULE.ITEM.</p>
  ${indexBlock(SUBJECTS, 'idx--subject')}
</section>
<section class="index">
  <p class="ed__eyebrow">Index two of three</p>
  <h2>Vocabulary and Phrase Index</h2>
  <p class="lead">${LEXIS.length} words, phrases and collocations, taken from the terms the
    curriculum quotes in its own vocabulary stages \u2014 with the lesson where each is taught.</p>
  ${indexBlock(LEXIS, 'idx--lex')}
</section>`;

const ASSESSMENT_INDEX = `<section class="index index--assess">
  <p class="ed__eyebrow">${EDITION.lessons ? 'Index three of three' : 'Reference'}</p>
  <h2>Assessment Index</h2>
  <p class="lead">All 120 assessed items in the programme: sixty quizzes carrying
    ${C.totals.questions} questions, and sixty assignments carrying 307 rubric criteria.</p>
  ${ASSESSMENTS.map(({ lv, rows }) => {
    const p = paletteFor(lv.roman);
    return `<div class="asx" style="--ink:${p.ink};--mid:${p.mid}">
      <p class="asx__h">Level ${esc(lv.roman)} · ${typo(lv.name)} · CEFR ${esc(lv.cefr)}</p>
      <table class="asx__t"><thead><tr><th scope="col">Module</th>
        <th scope="col">Assessed quiz</th><th scope="col">Qs</th>
        <th scope="col">Assessed assignment</th></tr></thead><tbody>
        ${rows.map((r) => `<tr><td><b>${r.module}</b> ${typo(r.title)}</td>
          <td class="mono">${r.quizRef || '—'}</td><td class="mono">${r.questions || '—'}</td>
          <td class="mono">${r.asgRef || '—'}</td></tr>`).join('')}
      </tbody></table></div>`;
  }).join('')}
</section>`;

const FRONT_INNER = (EDITION.lessons ? HOWTO : '') + AWARDS
  + (EDITION.teacherGuide ? GUIDE : '') + ARCHITECTURE;
const FRONT = frontMatter(ID, I, CONTENTS, FRONT_INNER);
// The reference apparatus, in the order a reader reaches for it: what a
// word means, how to move through the book, the pronunciation strand as
// a strand, then the three indexes.
const BODY_BEFORE_COLOPHON = EDITION.lessons
  ? GLOSSARY + ROUTE_SECTION + PRONUNCIATION + INDEXES + ASSESSMENT_INDEX
  : GLOSSARY + ASSESSMENT_INDEX;

// Which photographs this edition actually places, read off the markup
// rather than declared, so the colophon can credit exactly those.
// Scanned off the markup that is ACTUALLY assembled for this edition,
// not a hand-listed set of sections. The first version listed the
// sections by name and included the teaching guide unconditionally, so
// the student edition credited a photograph placed in a section it does
// not contain — which is the defect this whole mechanism exists to
// prevent, reproduced inside the fix for it.
const PLACED_IMAGES = [...new Set([...(`${CONTENTS}${FRONT_INNER}${BODY_BEFORE_COLOPHON}`
  .matchAll(/img\/([a-z0-9-]+\.jpg)/gi))].map((m) => m[1])
  .concat(Object.values(PLATES).map((p) => p.file.split('/').pop())))];

// The legacy apparatus: family, maturity, citation form, cataloguing
// data and revision history, generated from one source for every
// publication of the Press rather than written into each renderer.
const RECORD = ecosystem().find((r) => r.artefact
  && r.artefact.endsWith(`${EDITION.file}.pdf`));
const LEGACY = legacyBlock({
  id: ID,
  title: 'The International English Fluency Certificate',
  subtitle: EDITION.key === 'institutional' ? 'Programme Architecture' : 'The Complete Curriculum',
  family: RECORD ? RECORD.family.key : 'IEFC Teacher Series',
  audience: RECORD ? RECORD.audience : 'Teaching staff',
  subjects: ['English language — Study and teaching', 'Language and languages — Curricula',
    'English language — Examinations', 'Common European Framework of Reference'],
  pages: null,
  artefact: RECORD ? RECORD.artefact : null,
  relatives: RECORD ? RECORD.relatives : [],
  maturity: RECORD ? RECORD.maturity : undefined,
  ink: PAL.royalBlue, rule: PAL.platinum, soft: PAL.slateGrey, accent: PAL.royalGold,
  panel: PAL.softCream,
});

const BACK = BODY_BEFORE_COLOPHON + backMatter(ID, null, PLACED_IMAGES, LEGACY);

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

/* TABLES THAT CROSS A PAGE.
   The pronunciation strand runs to nineteen rows in a level and the
   revision route to ten in each of six; both are longer than a page can
   hold. When such a table breaks, the reader on the second page sees
   three columns of references with nothing saying which is which — and
   nothing about the first page looks wrong, which is why this kind of
   defect survives a proofread of the opening spread.

   table-header-group makes Chromium repeat the thead at the top of
   every page the table continues onto. break-inside:avoid on the row
   stops a two-line focus splitting its own sentence across the fold.
   Neither is visible when the table fits; both are the difference
   between a reference table and a heap of numbers when it does not. */
thead { display: table-header-group; }
tr { break-inside: avoid; }
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
.figures { display:flex; gap:10pt; margin:14pt 0 16pt; }
.figures__i { flex:1; border-top:2pt solid var(--ink); padding-top:7pt; }
.figures__i b { display:block; font-size:20pt; color:var(--ink); line-height:1.05;
  letter-spacing:-.01em; }
.figures__i span { display:block; font-family:var(--sans); font-size:6.4pt; font-weight:700;
  letter-spacing:.12em; text-transform:uppercase; color:var(--bronze); margin:3pt 0 2pt; }
.figures__i em { display:block; font-style:normal; font-size:7.6pt; color:var(--soft);
  line-height:1.35; }
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
.lvintro__ch { margin:16pt 0 5pt; }
.lvcon { list-style:none; margin:0 0 12pt; padding:0; }
.lvcon li { display:flex; align-items:baseline; gap:9pt; padding:4pt 0;
  border-bottom:.4pt solid var(--rule); break-inside:avoid; }
.lvcon__n { font-family:var(--serif); font-size:13pt; font-weight:700; color:var(--mid);
  min-width:1.6em; text-align:right; }
.lvcon__t { flex:1; font-size:10.4pt; color:var(--ink); }
.lvcon__m { font-family:var(--sans); font-size:6.8pt; letter-spacing:.02em; color:var(--soft);
  white-space:nowrap; }
.lvintro__close { font-size:9.2pt; color:var(--soft); border-top:1.2pt solid var(--mid);
  padding-top:7pt; margin:0; }
.lvintro__close b { color:var(--ink); font-style:italic; font-weight:400; }

/* ---------- Module ---------- */
.module { break-before:auto; }
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
.lesson--assessed { break-before:auto; }
.lesson--assessed > .lesson__h--cer { break-after:avoid; }
.lesson__h--cer { background:var(--ink); color:#fff; padding:8pt 10pt 8pt;
  border-bottom: 2.6pt solid var(--mid); margin:0 0 10pt; }
.lesson__h--cer .lesson__k { color:#fff; opacity:.9; }
.lesson__h--cer .lesson__ref { color:#fff; opacity:.7; }
.lesson__h--cer h4 { color:#fff; font-size:15pt; }
.lesson__h--cer .lesson__meta { color:#fff; opacity:.72; }
.lesson__h--cer .tape { border-top-color:rgba(255,255,255,.28); }
.lesson__h--cer .tape__i { color:#fff; opacity:.72; }

.stage { margin:0 0 7pt; break-inside:avoid; }
.stage--splits { break-inside:auto; }
.stage--intro { font-size:9.6pt; }
.stage__h { font-family:Calibri,"Nimbus Sans",Arial,sans-serif; font-size:7.4pt; font-weight:700;
  letter-spacing:.12em; text-transform:uppercase; color:var(--ink); margin:0 0 2.5pt;
  display:flex; align-items:baseline; gap:5pt; }
.stage__mk { color:var(--mid); font-size:8.5pt; min-width:1em; }
.stage__note { font-family:var(--sans); font-size:7.4pt; font-style:italic; line-height:1.4;
  color:var(--soft); margin:1.5pt 0 3pt; max-width:40em; }
.stage--emph .stage__note { color:#5C6472; }
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
.moduleopen { break-before:auto; break-inside:avoid; break-after:avoid;
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
/* The rubric may now split across a page. Held whole it repeatedly
   pushed a five-criterion table to the next leaf and stranded a quarter
   of a page behind it; with thead repeating and rows kept whole, a
   split rubric loses nothing a marker needs. */
table.rubric { width:100%; border-collapse:collapse; margin:4pt 0 5pt; }
table.rubric th { background:var(--ink); color:#fff; text-align:left; padding:3.4pt 6pt;
  font-family:var(--sans); font-size:6.2pt; letter-spacing:.12em; text-transform:uppercase;
  font-weight:700; }
table.rubric td { padding:3.8pt 6pt; border-bottom: .4pt solid rgba(0,0,0,.09);
  vertical-align:top; font-size:8.8pt; line-height:1.42; }
.rb__n { width:12pt; font-family:var(--sans); font-size:7pt; font-weight:700; color:var(--mid);
  text-align:center; }
.rb__c { width:27%; font-weight:700; color:var(--ink); }
/* The pass-threshold sentence belongs to the rubric above it. Once the
   rubric stage was allowed to split, this two-line tail could tip onto
   the next leaf and sit there alone above 95% white — which is what it
   did at the end of Level II and at the Mastery Examination. */
.rubric__note { font-size:8pt; font-style:italic; color:var(--soft); margin:3pt 0 0;
  break-before:avoid; }
/* A companion rule was tried on the closing stage of an assessed item
   and is not here: break-before:avoid moved two orphaned tails and
   created a third, at a cost of three pages. Chromium honours it only
   when the preceding block can be pulled forward, so as a general rule
   it trades one widow for another. Measured, reverted, recorded. */

/* ---------- Figures ---------- */
.arch { break-before:page; }
.fig { margin:0 0 16pt; padding:0 0 12pt; border-bottom: .4pt solid var(--rule);
  break-inside:avoid; }
.fig--break { break-before:page; }
.fig__c { font-family:var(--sans); font-size:7pt; letter-spacing:.12em; text-transform:uppercase;
  color:var(--soft); margin:0 0 7pt; padding-bottom:3pt; border-bottom: .4pt solid var(--rule); }
.fig__c b { color:var(--ink); font-weight:700; }
.fig__n { font-size:8.4pt; line-height:1.5; color:#3A3A3A; margin:8pt 0 0; max-width:38em; }

/* ---------- Photographic band ---------- */
/* Width is the content box exactly. Anything wider triggers the
   document-wide shrink-to-fit the plates already taught this book about. */
.band { position:relative; height:52mm; overflow:hidden; margin:0 0 11pt;
  background:${PAL.royalBlue}; break-inside:avoid; break-after:avoid; }
.band img { width:100%; height:100%; object-fit:cover; display:block; }
.band__rule { position:absolute; left:0; right:0; bottom:0; height:2pt;
  background:${BRAND.gold}; }

/* ---------- Awards table ---------- */
.awards, .guide, .index { break-before:page; }
.awards h2, .guide h2, .index h2 { font-size:19pt; margin:0 0 4pt; }
.awards h2::after, .guide h2::after, .index h2::after { content:''; display:block; width:100%;
  height:.6pt; background:linear-gradient(90deg,var(--gold) 0 22%,var(--rule) 22%);
  margin:7pt 0 13pt; }
.guide h3 { font-size:11pt; margin:14pt 0 4pt; }
table.awt { width:100%; border-collapse:collapse; font-size:8.4pt; margin:10pt 0; }
table.awt th { background:${BRAND.ink}; color:#fff; text-align:left; padding:4.5pt 6pt;
  font-family:var(--sans); font-size:6.4pt; letter-spacing:.12em; text-transform:uppercase; }
table.awt td { padding:5pt 6pt; border-bottom:.4pt solid var(--rule); vertical-align:top;
  line-height:1.4; }
.awt__r { font-family:var(--serif); font-size:13pt; font-weight:700; text-align:center; }
.awt__c { font-family:var(--sans); font-size:7.4pt; font-weight:700; white-space:nowrap; }
.awt__p { font-family:var(--sans); font-size:7.6pt; font-weight:700; white-space:nowrap; }
.awt__s { font-size:7.8pt; color:var(--soft); }

/* ---------- Indexes ---------- */
/* Two columns, because an index in one column wastes half the page and
   an index in three sets the references too tight to scan. */
.idx { columns:2; column-gap:12pt; margin-top:8pt; }
.idx__g { break-inside:avoid-column; margin:0 0 7pt; }
/* Bronze, not Royal Gold: these are 9pt letter heads on the text paper,
   where Royal Gold reaches only 2.82:1. Introduced as gold and caught by
   the standing check within minutes of being written. */
.idx__l { font-family:var(--sans); font-size:9pt; font-weight:700; color:var(--bronze);
  border-bottom:.6pt solid var(--rule); margin:0 0 3pt; padding-bottom:1.5pt; }
.idx__e { font-size:8.2pt; line-height:1.38; margin:0 0 1.2pt; padding-left:9pt;
  text-indent:-9pt; break-inside:avoid; }
.idx__r { font-family:var(--sans); font-size:7pt; color:var(--soft); margin-left:5pt; }
.idx--lex .idx__e { font-style:italic; }
.idx--lex .idx__r { font-style:normal; }
.index--assess { columns:auto; }
.asx { break-inside:avoid; margin:0 0 12pt; }
.asx__h { font-family:var(--sans); font-size:7.4pt; font-weight:700; letter-spacing:.14em;
  text-transform:uppercase; color:var(--ink); margin:0 0 4pt; padding-bottom:2.5pt;
  border-bottom:1.2pt solid var(--mid); }
table.asx__t { width:100%; border-collapse:collapse; font-size:8.2pt; }
table.asx__t th { text-align:left; padding:2.6pt 6pt; font-family:var(--sans); font-size:6.2pt;
  letter-spacing:.12em; text-transform:uppercase; color:var(--soft);
  border-bottom:.4pt solid var(--rule); }
table.asx__t td { padding:2.8pt 6pt; border-bottom:.4pt solid #EEF0F4; }
table.asx__t .mono { font-family:"Consolas","DejaVu Sans Mono",monospace; font-size:7.4pt;
  color:var(--mid); }

/* ---------- Cross-references ---------- */
/* Apparatus, not content: set in the sans at apparatus size so it reads
   as a finding aid and never competes with the lesson title above it.
   The references themselves take the level's mid tone, which is the
   same colour the contents list and the indexes use for a reference —
   one meaning, one colour, throughout the book. */
.xref { font-family:var(--sans); font-size:6.6pt; margin:3pt 0 0; display:flex;
  flex-wrap:wrap; align-items:baseline; gap:4pt; }
.xref__l { letter-spacing:.14em; text-transform:uppercase; color:var(--soft); font-weight:700; }
.xref__r { color:var(--mid); font-weight:700; letter-spacing:.02em; }
.lesson__h--cer .xref__l { color:rgba(255,255,255,.62); }
.lesson__h--cer .xref__r { color:#fff; opacity:.9; }

/* ---------- Module opener additions ---------- */
.mfp { display:flex; flex-wrap:wrap; gap:4pt; margin:6pt 0 0; padding:5pt 0 0;
  border-top:.4pt solid var(--rule); }
.mfp__i { color:var(--mid); opacity:.8; line-height:0; }
.mxr { font-family:var(--sans); font-size:6.6pt; margin:0 0 3pt; display:flex;
  flex-wrap:wrap; align-items:baseline; gap:4pt; }
.mxr__l { letter-spacing:.14em; text-transform:uppercase; color:var(--soft); font-weight:700;
  min-width:9em; }
.mxr__r { color:var(--mid); font-weight:700; }
.mxr--back .mxr__r { color:var(--soft); font-weight:400; }
/* The cross-reference lines and the contents heading are set in the
   same uppercase sans, so without this the heading read as a third
   cross-reference row. */
.mxr + .moduleopen__ch, .mxr ~ .moduleopen__ch { margin-top:9pt; padding-top:6pt;
  border-top:.4pt solid var(--rule); }

/* The pull quote. Its job is a change of pace on a page that is
   otherwise a list, so it is set in the serif at display size with the
   level's rule above it — and it is deliberately NOT centred: a
   flush-left quote beside a flush-left contents list reads as part of
   the same composition rather than as an ornament dropped on top. */
.mq { margin:9pt 0 0; padding:8pt 0 0; border-top:1.2pt solid var(--mid); break-inside:avoid; }
.mq blockquote { margin:0; font-size:11.4pt; line-height:1.42; font-style:italic;
  color:var(--ink); max-width:32em; }
.mq blockquote::before { content:'\\201C'; }
.mq blockquote::after { content:'\\201D'; }
.mq figcaption { font-family:var(--sans); font-size:6.2pt; font-weight:700; letter-spacing:.18em;
  text-transform:uppercase; color:var(--soft); margin:5pt 0 0; }

/* ---------- Glossary, routes, pronunciation ---------- */
.gloss, .routes, .pron { break-before:page; }
.editionnote { border-left:2.6pt solid var(--gold); background:#FBF6EA; padding:8pt 12pt;
  margin:14pt 0 0; break-inside:avoid; }
.editionnote p:last-child { margin:0; font-size:9pt; line-height:1.5; }
.editionnote b { color:${BRAND.ink}; }
.gloss h2, .routes h2, .pron h2 { font-size:19pt; margin:0 0 4pt; }
.gloss h2::after, .routes h2::after, .pron h2::after { content:''; display:block; width:100%;
  height:.6pt; background:linear-gradient(90deg,var(--gold) 0 22%,var(--rule) 22%);
  margin:7pt 0 13pt; }
.gloss__note { font-size:8.2pt; line-height:1.5; color:var(--soft); border-left:2pt solid var(--rule);
  padding-left:9pt; margin:0 0 12pt; max-width:40em; }

.gl { columns:2; column-gap:14pt; margin:0; }
.gl__e { break-inside:avoid; margin:0 0 7pt; }
.gl dt { font-family:var(--sans); font-size:8.2pt; font-weight:700; color:${BRAND.ink}; }
.gl__x { display:block; font-weight:400; font-size:6.6pt; letter-spacing:.02em;
  color:var(--soft); text-transform:none; }
.gl dd { margin:1.5pt 0 0; font-size:8.4pt; line-height:1.42; color:#3A3A3A; }
.gl__m { display:block; font-family:var(--sans); font-size:6.2pt; letter-spacing:.12em;
  color:var(--soft); margin-top:1.5pt; }

.rt { break-inside:avoid; margin:0 0 13pt; padding:0 0 10pt; border-bottom:.4pt solid var(--rule); }
.rt__h { font-family:var(--sans); font-size:9pt; font-weight:700; color:${BRAND.ink};
  margin:0 0 2pt; display:flex; justify-content:space-between; align-items:baseline; }
.rt__h span { font-size:6.6pt; font-weight:400; letter-spacing:.14em; text-transform:uppercase;
  color:var(--soft); }
.rt__b { font-size:8.4pt; color:var(--soft); margin:0 0 6pt; max-width:40em; }
.rt__l { display:flex; align-items:baseline; gap:6pt; margin:0 0 2pt;
  font-family:var(--sans); font-size:7.2pt; }
.rt__lv { font-family:var(--serif); font-size:10pt; font-weight:700; color:var(--ink);
  min-width:2.4em; }
.rt__m { color:var(--mid); letter-spacing:.02em; }
.rt__m + .rt__m { border-left:.4pt solid var(--rule); padding-left:5pt; }
.routes h3 { font-size:11pt; margin:16pt 0 5pt; }
.rt__p { font-size:8.8pt; line-height:1.5; margin:0; max-width:40em; }
.rt__p b { color:var(--ink); font-family:var(--sans); font-size:7.6pt; }
.routes p { font-size:9.2pt; line-height:1.55; margin:0 0 6pt; max-width:38em; }
table.cov { border-collapse:collapse; font-size:8.4pt; margin:6pt 0 10pt; min-width:56%; }
table.cov th { text-align:left; padding:2.6pt 10pt 2.6pt 0; font-family:var(--sans);
  font-size:6.2pt; letter-spacing:.12em; text-transform:uppercase; color:var(--soft);
  border-bottom:.4pt solid var(--rule); }
table.cov td { padding:3pt 10pt 3pt 0; border-bottom:.4pt solid #EEF0F4; }
.cov__p { font-family:var(--sans); font-size:8pt; font-weight:700; color:${BRAND.ink}; }
.rv { break-inside:avoid; margin:0 0 12pt; }
table.rvt { width:100%; border-collapse:collapse; font-size:8.2pt; }
table.rvt th { text-align:left; padding:2.6pt 6pt; font-family:var(--sans); font-size:6.2pt;
  letter-spacing:.12em; text-transform:uppercase; color:var(--soft);
  border-bottom:.4pt solid var(--rule); }
table.rvt td { padding:2.8pt 6pt; border-bottom:.4pt solid #EEF0F4; vertical-align:top; }
table.rvt .mono { font-family:"Consolas","DejaVu Sans Mono",monospace; font-size:7.4pt;
  color:var(--mid); white-space:nowrap; }

.pron__g { margin:0 0 13pt; }
table.prt { width:100%; border-collapse:collapse; font-size:8.4pt; }
table.prt th { text-align:left; padding:2.6pt 6pt; font-family:var(--sans); font-size:6.2pt;
  letter-spacing:.12em; text-transform:uppercase; color:var(--soft);
  border-bottom:.4pt solid var(--rule); }
table.prt td { padding:3pt 6pt; border-bottom:.4pt solid #EEF0F4; vertical-align:top;
  line-height:1.4; }
table.prt .mono { font-family:"Consolas","DejaVu Sans Mono",monospace; font-size:7.4pt;
  color:var(--mid); white-space:nowrap; }
.prt__t { font-family:var(--sans); font-size:7pt; color:var(--soft); white-space:nowrap;
  text-align:right; }

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

/**
 * THE LARGE-PRINT VARIANT.
 *
 * ────────────────────────────────────────────────────────────────────
 * A SCALE FACTOR, NOT A SECOND DESIGN
 * ────────────────────────────────────────────────────────────────────
 * `IEFC_TYPE_SCALE=1.35 npm run curriculum` sets the whole book at 135%
 * and writes it beside the standard edition. Every type size in this
 * stylesheet is declared in points, so multiplying them all is the
 * whole of the transformation: the type scale keeps its proportions,
 * the leading follows because it is a unitless multiple, and the page
 * furniture stays in millimetres so the trim does not change.
 *
 * WHAT THIS DELIBERATELY DOES NOT SCALE. Rules, borders and hairlines
 * are also declared in points and are left alone. A 0.4 pt rule at
 * 135% is a 0.54 pt rule, which is a different design rather than the
 * same one enlarged — and the reader who needs 13 pt body text does not
 * need heavier rules. Anything below the 0.25 pt press floor would be
 * a defect; nothing here is.
 *
 * The variant is built on demand rather than committed. It is a second
 * thirty-megabyte artefact of the same book, and the capability, not
 * the file, is what the register asked for. It renders from this same
 * source, so it cannot drift from the edition it enlarges.
 */
const TYPE_SCALE = Number(process.env.IEFC_TYPE_SCALE || 1);
const LARGE = TYPE_SCALE !== 1;

/**
 * HTML only: stop after the typeset text block, before any PDF.
 *
 * The edition test measures the three editions against one another, and
 * everything it measures is in the HTML. Rendering the books as well
 * cost it about seventy seconds and — for the institutional edition,
 * whose PDF and cover are committed — rewrote two tracked files on
 * every run, so a test suite left the working tree dirty.
 *
 * This is not a lesser render. The imposition, the plate insertion and
 * the page measurement all happen above, because the HTML is what they
 * produce; what is skipped is printing it, rasterising the figures, and
 * wrapping a cover round a page count.
 */
const HTML_ONLY = process.env.IEFC_HTML_ONLY === '1';
const scaleType = (css) => (LARGE
  ? css.replace(/font-size:\s*([\d.]+)pt/g, (_, v) =>
    `font-size:${Math.round(Number(v) * TYPE_SCALE * 100) / 100}pt`)
  : css);

const HEAD = `<!doctype html><html lang="en-GB"><head><meta charset="utf-8">
<title>The International English Fluency Certificate — ${EDITION.name}${
  LARGE ? ' · Large Print' : ''}</title>
<meta name="author" content="WorldWide English College">
<meta name="subject" content="English language curriculum; complete teaching programme">
<meta name="keywords" content="IEFC, WorldWide English College, CEFR, English curriculum, lesson plans">
<style>${scaleType(CSS)}</style></head><body>${DUOTONES}`;

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
const htmlPath = path.join(ROOT, 'publication',
  `.${EDITION.key === 'teacher' ? 'flagship' : EDITION.key}${LARGE ? '-large' : ''}.html`);
writeFileSync(htmlPath, html);

if (HTML_ONLY) {
  await browser.close();
  console.log(`${EDITION.name.toUpperCase()} — text block only\n  ${htmlPath}`);
  console.log(`  ${C.totals.lessons} items · ${C.totals.modules} modules · `
    + `${C.totals.questions} questions · `
    + `${C.totals.bodyWords.toLocaleString('en-GB')} words of lesson content`);
  console.log(`  imposition: ${inserted} recto leaf/leaves inserted`);
  process.exit(0);
}

// Navigated rather than injected: setContent() has no base URL, so the
// plates' relative image paths would resolve to nothing and six pages
// would print as empty ink-coloured rectangles — a failure that looks
// like a design choice.
const page = await browser.newPage();
await page.goto(`file://${htmlPath}`, { waitUntil: 'load' });
await page.evaluate(() => Promise.all(
  [...document.images].filter((i) => !i.complete)
    .map((i) => new Promise((r) => { i.onload = r; i.onerror = r; }))));
const out = path.join(ROOT, 'publication',
  `${EDITION.file}${LARGE ? ' (Large Print)' : ''}.pdf`);
await page.pdf({
  path: out, format: 'A4', printBackground: true, preferCSSPageSize: true,
  displayHeaderFooter: true,
  headerTemplate: '<div style="font:400 6pt Calibri,Arial,sans-serif;color:#9AA0AE;width:100%;'
    + 'padding:0 20mm;text-align:right;letter-spacing:.12em;text-transform:uppercase;">'
    + `The International English Fluency Certificate · ${EDITION.lessons
      ? 'The Complete Curriculum' : 'Programme Architecture'}</div>`,
  footerTemplate: runningFoot(EDITION.file, { gutter: 20, size: 6.6, mark: MARK }),
  margin: { top: '17mm', bottom: '15mm', left: '20mm', right: '20mm' },
  tagged: true, outline: true,
});

/**
 * ────────────────────────────────────────────────────────────────────
 * THE FIGURES, RASTERISED FOR THE EDITABLE EDITION
 * ────────────────────────────────────────────────────────────────────
 * The DOCX carried every word of the curriculum and none of the seven
 * figures, so a faculty member editing the programme worked without the
 * apparatus their readers would see — which is exactly the reader who
 * most needs to know that Figure 4 shows no competency mapping.
 *
 * DOCX cannot hold SVG in a form Word and LibreOffice both render, so
 * the figures are rasterised here, where a browser is already running,
 * at three times the printed width: 1,440 px across a 168 mm measure is
 * about 218 dpi, which is more than a screen needs and enough that an
 * office printer does not show the pixels.
 *
 * They are written as files rather than passed in memory because the
 * two renderers are separate processes, and separate processes are what
 * keeps a browser out of the DOCX build.
 */
const FIG_DIR = path.join(ROOT, 'publication', 'fig');
if (!LARGE) mkdirSync(FIG_DIR, { recursive: true });
const FIGURES = [
  ['fig-1-ascent', 'Figure 1 · The ascent', ascentChart(C.levels)],
  ['fig-2-architecture', 'Figure 2 · Sixty modules, one architecture', architectureGrid(C.levels)],
  ['fig-3-anatomy', 'Figure 3 · The anatomy of a lesson', lessonAnatomy(C)],
  ['fig-4-assessment', 'Figure 4 · The assessment map', assessmentMap(C.levels, critByLevel)],
  ['fig-5-journey', 'Figure 5 · A learner’s path', learnerJourney(C.levels)],
  ['fig-6-spiral', 'Figure 6 · The spiral, measured', spiralMap(C.levels, XREF.back)],
];
if (!LARGE) {
  const fp = await browser.newPage({ viewport: { width: 1480, height: 900 },
    deviceScaleFactor: 1 });
  for (const [slug, , svg] of FIGURES) {
    await fp.setContent(`<!doctype html><meta charset="utf-8">
      <style>html,body{margin:0;background:#fff;font-family:${TYPE.sans}}
        #f{width:1440px;padding:20px;background:#fff}</style>
      <div id="f">${svg}</div>`, { waitUntil: 'load' });
    await fp.locator('#f').screenshot({ path: path.join(FIG_DIR, `${slug}.png`) });
  }
  // The six level plates, graded. The duotone is an SVG filter, so the
  // editable edition cannot apply it and embedding the raw photographs
  // there would have put six ungraded images into a book whose whole
  // photographic argument is that they read as one series. Rendered
  // here, through the same filter the print edition uses, they arrive
  // in the DOCX already belonging to their level.
  // NAVIGATED, NOT setContent().
  //
  // The first version used setContent() with a <base href> pointing at
  // the publication directory. A page created by setContent() has an
  // about:blank origin, a <base> does not give it one, and the six
  // plates rendered as six flat rectangles in the level's ink — with a
  // broken-image glyph two pixels across in the corner. In the editable
  // edition they would have read as deliberate colour fields.
  //
  // This is the same defect the print renderer already carried a
  // comment about, made a second time in a second place, which is why
  // the plates now have a size floor asserted in the test suite: a flat
  // fill compresses to about 9 KB and a photograph cannot.
  const pw = 1800;
  const ph = 850;
  const pp = await browser.newPage({ viewport: { width: pw, height: ph } });
  const shim = path.join(ROOT, 'publication', '.plate.html');
  for (const roman of ROMAN) {
    const plate = PLATES[roman];
    if (!plate) continue;
    const p = paletteFor(roman);
    writeFileSync(shim, `<!doctype html><meta charset="utf-8">
      <style>html,body{margin:0}#p{width:${pw}px;height:${ph}px;overflow:hidden;background:${p.ink}}
        img{width:100%;height:100%;object-fit:cover;display:block}</style>
      ${DUOTONES}<div id="p"><img src="${plate.file}" style="filter:url(#duo-${roman})"></div>`);
    await pp.goto(`file://${shim}`, { waitUntil: 'load' });
    await pp.evaluate(() => Promise.all([...document.images]
      .filter((i) => !i.complete).map((i) => new Promise((r) => { i.onload = r; i.onerror = r; }))));
    const ok = await pp.evaluate(() => {
      const i = document.images[0];
      return Boolean(i && i.naturalWidth > 0);
    });
    if (!ok) throw new Error(`plate ${roman}: ${plate.file} did not load — the grade would have `
      + 'been written as a flat rectangle');
    await pp.locator('#p').screenshot({ path: path.join(FIG_DIR, `plate-${roman}.jpg`),
      type: 'jpeg', quality: 84 });
  }
  await pp.close();
  rmSync(shim, { force: true });

  await fp.close();
  writeFileSync(path.join(FIG_DIR, 'figures.json'),
    `${JSON.stringify({
      figures: FIGURES.map(([slug, caption]) => ({ slug, caption })),
      plates: ROMAN.filter((r) => PLATES[r]).map((r) => ({ roman: r,
        file: `plate-${r}.jpg`, subject: PLATES[r].subject })),
    }, null, 2)}\n`);
}

// ---- The cover artwork ----------------------------------------------
// Produced only after the text block exists, because the spine width is
// a function of the bound page count. Rendering the cover first would
// mean guessing it, and a guessed spine is a cover that wraps.
//
// The large-print variant does not produce a cover. Its extent is
// different, so its spine is different, and writing it to the same file
// would leave the standard edition with a cover that does not fit it —
// a failure that is invisible until a printer wraps five hundred
// copies.
const pages = countPages(readFileSync(out));
const spine = spineWidth(pages);
const coverHtml = `<!doctype html><html lang="en"><head><meta charset="utf-8">
<title>IEFC Complete Curriculum — cover artwork</title>
<style>${COVER_CSS}</style></head><body>${coverSpread(ID, spine, C.levels)}</body></html>`;
if (!LARGE) {
  writeFileSync(path.join(ROOT, 'publication',
    `.cover${EDITION.key === 'teacher' ? '' : `-${EDITION.key}`}.html`), coverHtml);
}

// Each edition binds to a different extent, so each needs its own
// spine. One cover file for three books is a cover that fits none.
const coverOut = path.join(ROOT, 'publication',
  `${EDITION.file} — Cover Artwork.pdf`.replace('IEFC Complete Curriculum — Cover', 'IEFC Cover'));
if (!LARGE) {
  const cpage = await browser.newPage();
  await cpage.setContent(coverHtml, { waitUntil: 'load' });
  await cpage.pdf({
    path: coverOut, printBackground: true,
    width: `${TRIM.w * 2 + spine + BLEED * 2}mm`, height: `${TRIM.h + BLEED * 2}mm`,
    margin: { top: '0', bottom: '0', left: '0', right: '0' },
  });
}
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

console.log(`${(LARGE ? 'LARGE PRINT' : EDITION.name).toUpperCase()}\n  ${out}`);
console.log(`  ${C.totals.lessons} items · ${C.totals.modules} modules · ${C.totals.questions} questions · `
  + `${C.totals.bodyWords.toLocaleString('en-GB')} words of lesson content`);
console.log(`  ${pages} pages · Document ID ${ID.documentId} · issue ${ID.issueCode}`);
console.log(`  imposition: ${inserted} recto leaf/leaves inserted`);
for (const line of impositionLog) console.log(`    ${line}`);
if (LARGE) {
  console.log(`  set at ${Math.round(TYPE_SCALE * 100)}% of the standard type size; `
    + 'no cover is produced for this variant');
} else {
  console.log(`COVER     ${coverOut}`);
  console.log(`  spread ${TRIM.w * 2 + spine + BLEED * 2} × ${TRIM.h + BLEED * 2} mm · `
    + `spine ${spine} mm at ${pages} pages · ${BLEED} mm bleed`);
}
