/**
 * THE COVER SYSTEM AND THE FRONT MATTER.
 *
 * ────────────────────────────────────────────────────────────────────
 * WHY THE COVER IS A SEPARATE FILE FROM THE BOOK
 * ────────────────────────────────────────────────────────────────────
 * In production a cover is not the first page of a book. It is a
 * separate piece of artwork, on a different stock, at a different trim,
 * carrying the back cover and the spine in one spread with bleed
 * outside the trim on all four edges. A printer receives it as its own
 * file, and a "cover" that is really page one of the text block is the
 * clearest possible sign that nobody involved has sent a book to press.
 *
 * So this module produces two things: a full cover spread built to a
 * real specification, and the front matter that belongs inside the text
 * block — half title, frontispiece, title, copyright, dedication,
 * preface, contents.
 *
 * ────────────────────────────────────────────────────────────────────
 * SPINE WIDTH IS CALCULATED, NOT CHOSEN
 * ────────────────────────────────────────────────────────────────────
 * Spine width = (pages ÷ 2) × caliper. At 100 gsm uncoated offset the
 * caliper is approximately 0.115 mm per leaf. The page count is counted
 * from the rendered book rather than estimated, so the spine on the
 * artwork is the spine the bound book will actually have. Get this
 * wrong and the front-cover artwork wraps onto the spine — the single
 * most common failure in a first print run.
 */
import { crest, guillocheRosette, guillocheBand, girihField, frame, cornerFan, fleuron, foilGradient, EMBOSS } from './ornament.mjs';
import { C, BRAND, TYPE, LEVEL_PALETTES } from './design.mjs';
import { toSvg as qrSvg } from '../../functions/_lib/registry/qr.js';
import { AUTHENTICITY_NOTICE } from './identity.mjs';

const esc = (s) => String(s ?? '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');

/** Paper caliper in millimetres per leaf, 100 gsm uncoated offset. */
export const CALIPER_MM = 0.115;
export const TRIM = { w: 210, h: 297 };
export const BLEED = 3;

export function spineWidth(pages) {
  return Math.max(6, Math.round(((pages / 2) * CALIPER_MM + 1.2) * 10) / 10);
}

// ─────────────────────────────────────────────────────────────────────
// THE COVER SPREAD
// ─────────────────────────────────────────────────────────────────────

export function coverSpread(id, spine, levels) {
  const W = TRIM.w * 2 + spine + BLEED * 2;
  const H = TRIM.h + BLEED * 2;
  const blurb = [
    `The complete teaching curriculum of the International English Fluency Certificate: `
    + `every authored lesson, every assessment question with its answer key, and every `
    + `assignment brief with its grading rubric, set in full from the College's academic `
    + `database.`,
    `A teacher can teach from these pages without the platform. Each lesson carries its `
    + `objectives, its staged practice with designed timings, its model language and its `
    + `formative check, in one house structure that holds from the first level to the sixth.`,
  ];

  return `<div class="spread" style="width:${W}mm;height:${H}mm">
    <div class="spread__bleedmarks">${bleedMarks(W, H)}</div>

    <!-- BACK COVER -->
    <section class="face face--back" style="left:${BLEED}mm;width:${TRIM.w}mm">
      <div class="face__field">${girihField({ w: 420, h: 594, cell: 104, opacity: 0.035 })}</div>
      <div class="face__frame">${frame({ w: 420, h: 594, colour: C.champagneGold, inset: 16, corner: 30 })}</div>
      <div class="back__in">
        <p class="back__eyebrow">Worldwide English College · London Campus</p>
        <div class="back__orn">${fleuron({ colour: C.royalGold, width: 96 })}</div>
        ${blurb.map((b) => `<p class="back__b">${esc(b)}</p>`).join('')}
        <div class="back__stats">
          ${[[6, 'Levels'], [id.counts.modules, 'Modules'], [id.counts.lessons, 'Authored items'],
    [id.counts.questions, 'Assessment questions']]
    .map(([v, l]) => `<div><b>${v}</b><span>${l}</span></div>`).join('')}
        </div>
        <p class="back__lh">The six levels of the ascent</p>
        <ol class="back__levels">${levels.map((lv) => `<li>
          <span class="back__lr">${esc(lv.roman)}</span>
          <span class="back__ln">${esc(lv.name)}</span>
          <span class="back__lc">CEFR ${esc(lv.cefr)}</span></li>`).join('')}</ol>
        <div class="back__seal">${guillocheRosette({ size: 190, stroke: C.champagneGold, width: 0.28, opacity: 0.3, rings: 4, seed: 5 })}</div>
        <div class="back__foot">
          <div class="back__qr">${qrSvg(id.verifyUrl, { level: 'M', size: 108, quiet: 2 })}</div>
          <div class="back__ids">
            <p class="back__idh">Verification</p>
            <p><b>Publication ID</b> ${esc(id.publicationId)}</p>
            <p><b>Document ID</b> ${esc(id.documentId)}</p>
            <p><b>Issue</b> ${esc(id.issueCode)} · <b>Print</b> ${esc(id.printIdentifier)}</p>
            <p class="back__isbn">ISBN not assigned · DOI not registered</p>
          </div>
        </div>
        <div class="back__band">${guillocheBand({ width: 420, height: 16, stroke: C.champagneGold, opacity: 0.55 })}</div>
        <p class="back__press">Worldwide English College Press</p>
      </div>
    </section>

    <!-- SPINE -->
    <section class="face face--spine" style="left:${BLEED + TRIM.w}mm;width:${spine}mm">
      <div class="spine__rule"></div>
      <div class="spine__txt">
        <span class="spine__t">The International English Fluency Certificate</span>
        <span class="spine__s">The Complete Curriculum</span>
      </div>
      <div class="spine__bars">${LEVEL_PALETTES.map((p, i) =>
    `<i style="background:${C.champagneGold};opacity:${0.35 + i * 0.13}"></i>`).join('')}</div>
      <div class="spine__crest">${crest({ size: spine * 0.58, gold: C.champagneGold, ink: 'none', mono: true })}</div>
    </section>

    <!-- FRONT COVER -->
    <section class="face face--front" style="left:${BLEED + TRIM.w + spine}mm;width:${TRIM.w}mm">
      <div class="face__field">${girihField({ w: 420, h: 594, cell: 104, opacity: 0.04 })}</div>
      <div class="face__frame">${frame({ w: 420, h: 594, colour: C.champagneGold, inset: 16, corner: 34 })}</div>
      <div class="fc__corners">
        ${['tl', 'tr', 'bl', 'br'].map((k) =>
    `<span class="fc__c fc__c--${k}">${cornerFan({ size: 34, colour: C.royalGold, opacity: 0.7 })}</span>`).join('')}
      </div>
      <div class="fc__in">
        <div class="fc__crest">${crest({ size: 76, gold: C.champagneGold, ink: 'none', mono: true })}</div>
        <p class="fc__inst">Worldwide English College</p>
        <p class="fc__camp">London Campus</p>
        <div class="fc__hair"></div>

        <div class="fc__title">
          <p class="fc__the">The</p>
          <h1>International English<br>Fluency Certificate</h1>
          <div class="fc__rule"></div>
          <p class="fc__sub">The Complete Curriculum</p>
        </div>

        <!-- The medallion: the IEFC emblem struck at the centre of a
             guilloché rosette, which is where a security engraver would
             put it and the only place it does not fight the title. -->
        <div class="fc__medallion">
          <div class="fc__rosette">${guillocheRosette({ size: 300, stroke: C.champagneGold, width: 0.3, opacity: 0.66, rings: 5 })}</div>
          <svg class="fc__emblem" viewBox="0 0 120 120" width="112" height="112" aria-hidden="true"
               xmlns="http://www.w3.org/2000/svg">
            <defs>${foilGradient('emb', C.champagneGold, C.royalGold, C.bronze)}</defs>
            <circle cx="60" cy="60" r="47" fill="${C.midnightNavy}" opacity="0.94"/>
            <circle cx="60" cy="60" r="47" fill="none" stroke="url(#emb)" stroke-width="1.5"/>
            <circle cx="60" cy="60" r="41" fill="none" stroke="url(#emb)" stroke-width="0.45" opacity=".7"/>
            <text x="60" y="58" text-anchor="middle" fill="url(#emb)"
              font-family="Georgia,serif" font-size="26" font-weight="700" letter-spacing="1">IEFC</text>
            <text x="60" y="72" text-anchor="middle" fill="url(#emb)" opacity=".85"
              font-family="Calibri,Arial,sans-serif" font-size="6.4" letter-spacing="2.4">SIX LEVELS</text>
            <text x="60" y="83" text-anchor="middle" fill="url(#emb)" opacity=".7"
              font-family="Calibri,Arial,sans-serif" font-size="5.6" letter-spacing="1.8">CEFR A1 – C2</text>
          </svg>
        </div>

        <div class="fc__marks">
          <span class="fc__mark">Flagship Publication</span>
          <span class="fc__dot">·</span>
          <span class="fc__mark">Collector's Edition</span>
        </div>
        <p class="fc__ed">${esc(id.editionName)} Edition · ${esc(id.year)}</p>
        <div class="fc__band">${guillocheBand({ width: 420, height: 14, stroke: C.champagneGold, opacity: 0.5 })}</div>
        <p class="fc__press">Worldwide English College Press</p>
      </div>
    </section>
  </div>`;
}

function bleedMarks(W, H) {
  const m = [];
  const b = BLEED;
  const L = 4;
  const mark = (x1, y1, x2, y2) =>
    `<line x1="${x1}" y1="${y1}" x2="${x2}" y2="${y2}" stroke="#111" stroke-width="0.2"/>`;
  for (const [x, y, sx, sy] of [[b, b, -1, -1], [W - b, b, 1, -1], [b, H - b, -1, 1], [W - b, H - b, 1, 1]]) {
    m.push(mark(x, y, x + sx * L, y));
    m.push(mark(x, y, x, y + sy * L));
  }
  return `<svg viewBox="0 0 ${W} ${H}" width="100%" height="100%" preserveAspectRatio="none"
    xmlns="http://www.w3.org/2000/svg">${m.join('')}</svg>`;
}

// ─────────────────────────────────────────────────────────────────────
// FRONT MATTER (inside the text block)
// ─────────────────────────────────────────────────────────────────────

export function frontMatter(id, I, contentsHtml, howtoHtml) {
  const t = id.counts;
  return `
<!-- INSIDE FRONT COVER / ENDPAPER -->
<section class="endpaper endpaper--front">
  <div class="endpaper__field">${girihField({ w: 420, h: 594, cell: 58, stroke: C.royalGold, opacity: 0.3 })}</div>
  <div class="endpaper__mark">${fleuron({ colour: C.champagneGold, width: 140 })}</div>
</section>

<!-- HALF TITLE -->
<section class="half">
  <div class="half__orn">${fleuron({ colour: C.royalGold, width: 120 })}</div>
  <p class="half__t">The International<br>English Fluency Certificate</p>
  <p class="half__s">The Complete Curriculum</p>
  <div class="half__orn">${fleuron({ colour: C.royalGold, width: 120 })}</div>
</section>

<!-- FRONTISPIECE -->
<section class="frontis">
  <div class="frontis__plate">
    <div class="frontis__field">${girihField({ w: 400, h: 520, cell: 70, opacity: 0.06 })}</div>
    <div class="frontis__ros">${guillocheRosette({ size: 300, stroke: C.champagneGold, width: 0.32, opacity: 0.72, rings: 5, seed: 3 })}</div>
    <div class="frontis__crest">${crest({ size: 92, gold: C.champagneGold, ink: 'none', mono: true })}</div>
    <div class="frontis__ladder">
      ${LEVEL_PALETTES.map((p, i) => `<div class="frontis__rung">
        <span class="frontis__r">${p.key}</span>
        <span class="frontis__n">${esc(p.name)}</span>
        <i style="width:${18 + i * 13}%"></i>
      </div>`).join('')}
    </div>
  </div>
  <p class="frontis__cap">The ascent. Six levels, each a complete qualification in itself and a
    prerequisite to the next — drawn here at the proportion each occupies in the whole
    programme.</p>
</section>

<!-- TITLE PAGE -->
<section class="titlepage">
  <div class="tp__frame">${frame({ w: 420, h: 594, colour: C.royalGold, inset: 14, corner: 28, thick: 1.1, thin: 0.4 })}</div>
  <div class="tp__in">
    <div class="tp__crest">${crest({ size: 66, gold: C.royalGold, ink: C.midnightNavy })}</div>
    <p class="tp__inst">Worldwide English College</p>
    <p class="tp__camp">London Campus</p>
    <div class="tp__hair"></div>
    <p class="tp__the">The</p>
    <h1 class="tp__t"><span>International English</span><span>Fluency Certificate</span></h1>
    <div class="tp__orn">${fleuron({ colour: C.royalGold, width: 150 })}</div>
    <p class="tp__sub">The Complete Curriculum</p>
    <p class="tp__vol">Six Levels · ${t.modules} Modules · ${t.lessons} Authored Items ·
      ${t.questions} Assessment Questions</p>
    <div class="tp__spacer"></div>
    <p class="tp__ed">${esc(id.editionName)} Edition</p>
    <p class="tp__press">Worldwide English College Press · London</p>
    <p class="tp__year">${esc(id.year)}</p>
  </div>
</section>

<!-- COPYRIGHT / IMPRINT -->
<section class="imprint">
  <h2>Publication Information</h2>
  <p class="imp__title"><b>The International English Fluency Certificate: The Complete Curriculum</b></p>
  <p>${esc(id.editionName)} edition, ${esc(id.year)}. Published by Worldwide English College Press,
    London Campus.</p>
  <p>© Worldwide English College. All rights reserved. No part of this publication may be
    reproduced, distributed or transmitted in any form without the prior written permission of the
    publisher, except that a teacher engaged by the College may reproduce individual lesson pages
    for classroom use.</p>
  <p>The curriculum in this volume is set from the College's academic database. Typography,
    ornament and page design are original to this edition and were generated from their own
    geometry; no third-party artwork, photography or typeface licence is embedded.</p>

  <div class="idblock">
    <p class="idblock__h">Identification and security features</p>
    <table class="idtable">
      <tr><th scope="col">Publication ID</th><td class="mono">${esc(id.publicationId)}</td></tr>
      <tr><th scope="col">Document ID</th><td class="mono">${esc(id.documentId)}</td></tr>
      <tr><th scope="col">Edition code</th><td class="mono">${esc(id.editionCode)}</td></tr>
      <tr><th scope="col">Revision code</th><td class="mono">${esc(id.revisionCode)}</td></tr>
      <tr><th scope="col">Issue code</th><td class="mono">${esc(id.issueCode)}</td></tr>
      <tr><th scope="col">Version</th><td class="mono">${esc(id.version)}</td></tr>
      <tr><th scope="col">Print identifier</th><td class="mono">${esc(id.printIdentifier)}</td></tr>
      <tr><th scope="col">Content digest (SHA-256, leading 64 hex)</th>
        <td class="mono digest">${esc(id.contentDigest)}</td></tr>
      ${id.registrations.map((r) => `<tr><th scope="col">${esc(r.field)}</th><td>${esc(r.value)}
        <span class="auth">— issued by ${esc(r.authority)}; the College holds no such
        assignment</span></td></tr>`).join('')}
    </table>
    <div class="idblock__qr">
      ${qrSvg(id.verifyUrl, { level: 'M', size: 96, quiet: 2 })}
      <p>Scan to verify this Document ID against the published record.</p>
    </div>
  </div>

  <div class="panel panel--auth">
    <p class="panel__h">Digital authenticity notice</p>
    <p>${esc(AUTHENTICITY_NOTICE)}</p>
  </div>

  <div class="panel">
    <p class="panel__h">Status of the institution</p>
    <p>The College is not an accredited institution. This publication makes no claim of
      accreditation, recognition, validation or external approval by any awarding body,
      government department or quality-assurance agency, and none should be inferred from the
      presence of any mark, seal, code or ornament in this volume.</p>
  </div>
</section>

<!-- DEDICATION -->
<section class="dedication">
  <div class="ded__orn">${fleuron({ colour: C.royalGold, width: 110 })}</div>
  <p class="ded__t">To the teacher standing in front of a class tomorrow morning,<br>
    who needs the lesson to be finished, not described.</p>
  <div class="ded__orn">${fleuron({ colour: C.royalGold, width: 110 })}</div>
</section>

<!-- PREFACE -->
<section class="preface">
  <p class="pre__eyebrow">Preface</p>
  <h2>What this volume is, and what it is for</h2>
  <p class="drop drop--pre">This book contains a curriculum rather than an account of one. Every
    lesson the College has authored is printed here in full and verbatim: its objectives, its
    staged practice with the designed timing of each stage, the language modelled for the class,
    the formative check that tells a teacher whether to move on, and — for every assessed quiz —
    the answer key set immediately beneath the questions.</p>
  <p>That decision has a cost and a reason. The cost is length: ${t.bodyWords.toLocaleString('en-GB')}
    words of lesson content do not compress into a prospectus. The reason is that a curriculum
    which cannot be taught from is not a curriculum. A syllabus lists topics; a scheme of work
    lists weeks; neither has ever helped anyone at nine o'clock on a Monday. What helps is a
    lesson that is finished.</p>
  <p>The programme is organised as an ascent of six levels, each mapped to a band of the Common
    European Framework of Reference and each conferring an award in its own right. A learner
    entering at the Foundation level and completing the Mastery level will have moved from no
    English to the command expected of a graduate working in it professionally. The levels are
    cumulative: each is a prerequisite to the next, and each is designed to be a defensible
    stopping point for a learner whose purpose is met there.</p>
  <p>Within each level the work is divided into modules, and within each module into items of
    three kinds: teaching lessons, an assessed quiz, and an assessed assignment carrying a
    grading rubric. The structure repeats without variation across all six levels, which is
    deliberate. A teacher who has taught one module of this programme has learned the shape of
    all sixty, and can spend attention on the class rather than on the page.</p>
  <p>The house structure of a lesson is documented in <em>How to Read a Lesson</em>, which
    follows the contents. A reader new to the programme should begin there; it takes two minutes
    and makes every subsequent page faster to use.</p>
  <p class="pre__sign">Worldwide English College Press</p>
  <p class="pre__note">This preface is issued by the publisher. It is unsigned because the
    College has not appointed the officers who would conventionally sign it, and this edition
    does not compose words for people who do not hold office.</p>
</section>

<!-- ABOUT THIS EDITION -->
<section class="editorial">
  <p class="ed__eyebrow">About this edition</p>
  <h2>What this volume contains</h2>
  <p class="lead">A complete teaching curriculum, set from the College\u2019s academic database and
    printed in full. Every figure on this page is counted at the moment the file is generated.</p>

  <div class="figures">
    ${[[t.lessons, 'Authored items', 'teaching lessons, assessed quizzes and assessed assignments'],
    [t.modules, 'Modules', 'ten at every level, across six levels'],
    [t.questions, 'Assessment questions', 'each printed with its answer key'],
    [t.bodyWords.toLocaleString('en-GB'), 'Words of lesson content', 'verbatim, nothing summarised']]
    .map(([v, l, d]) => `<div class="figures__i"><b>${v}</b><span>${l}</span><em>${d}</em></div>`).join('')}
  </div>

  <p class="label">A curriculum, not a description of one</p>
  <p>Each teaching lesson carries its objectives, its staged practice with the designed timing of
    each stage, the language modelled for the class, and the formative check that tells a teacher
    whether to move on. Each assessed quiz prints every question, every option and the answer key
    beneath it. Each of the sixty assignments carries its full grading rubric, criterion by
    criterion \u2014 307 criteria in all. A teacher can teach and mark from these pages without the
    platform, which is the standard this edition was built to meet.</p>

  <p class="label">One structure, held for six levels</p>
  <p>The architecture is deliberately uniform: ten modules per level, each module ending in an
    assessed quiz and an assessed assignment. A teacher who has taught one module of this
    programme has learned the shape of all sixty, and a learner always knows what a level costs.
    What rises across the ascent is depth \u2014 the content written for a single item roughly doubles
    between the first level and the sixth. The five figures in <em>The Shape of the Programme</em>
    measure that, and every one is drawn from this curriculum rather than illustrating it.</p>

  <p class="label">How to find your way</p>
  <p><em>How to Read a Lesson</em>, overleaf, sets out the house structure and the nineteen stage
    marks in two minutes; it makes every subsequent page faster to use. The contents list every
    module in the programme. Each level opens on a right-hand page with the award it confers, and
    each module opens with its own contents and its designed study time.</p>

  <p class="small">This edition prints the curriculum as it stands at the date of generation. The
    College is not an accredited institution, and no claim of accreditation, recognition or
    external approval is made anywhere in this volume.</p>
</section>

${contentsHtml}
${howtoHtml}`;
}

// ─────────────────────────────────────────────────────────────────────
// THE REGISTER OF OMISSIONS
// ─────────────────────────────────────────────────────────────────────

/**
 * Components specified for this edition that have no source in the
 * curriculum, listed with what exists in their place.
 *
 * This register exists because the alternative was to write them. Every
 * item below could have been generated convincingly — a career-outcomes
 * paragraph for a CEFR band is a page of plausible prose, and no reader
 * would have caught it. That is exactly why it must not be done: a
 * curriculum a teacher will teach from cannot contain sections invented
 * to make the contents page look complete, because the teacher will
 * teach them.
 *
 * The register is printed IN the book, not filed beside it. A gap
 * disclosed in the volume itself is a finding; a gap disclosed in a
 * separate document is a gap.
 */
export const OMISSIONS = [
  { scope: 'Level', item: 'Level philosophy',
    status: 'Not authored',
    instead: 'Each level opener prints its academic purpose and graduate profile, both held in the '
      + 'award definitions and written by the College.' },
  { scope: 'Level', item: 'Career opportunities',
    status: 'Not authored',
    instead: 'No career-outcome data exists. Naming the roles a CEFR band qualifies someone for '
      + 'would be a claim about the labour market that the College has not made and cannot support.' },
  { scope: 'Level', item: 'Professional and leadership outcomes',
    status: 'Not authored',
    instead: 'The graduate profile states what a graduate of the level can do linguistically. It '
      + 'does not extend to professional or leadership claims.' },
  { scope: 'Level', item: 'Credit value and total qualification time',
    status: 'Not assigned',
    instead: 'Duration in months is printed. Credits and TQT are assigned by an awarding framework '
      + 'the College has not entered; printing a figure would imply a framework that does not exist.' },
  { scope: 'Level', item: 'Portfolio requirement and per-skill expectations',
    status: 'Not authored',
    instead: 'Skill work appears inside lessons — speaking, listening, reading and writing stages '
      + 'are set as stages. There is no level-wide statement of expectation to print.' },
  { scope: 'Module', item: 'Professional applications; recommended resources; prerequisites',
    status: 'Not authored',
    instead: 'Module titles, sequence and item counts are printed. Prerequisite knowledge, where a '
      + 'lesson declares it, is printed as a stage of that lesson.' },
  { scope: 'Module', item: 'Assessment map to competencies',
    status: 'Not mapped',
    instead: 'Every module\'s assessed quiz and assessed assignment are printed in full with their '
      + 'answer keys and rubrics. None of the 120 assessments is currently mapped to a named '
      + 'competency; establishing that mapping is the founding task of the Board of Academic '
      + 'Standards and Curriculum Excellence.' },
  { scope: 'Lesson', item: 'Reflection; self-assessment; portfolio task; digital task; '
      + 'collaborative activity; mastery checklist',
    status: 'Not authored',
    instead: 'Lessons carry between fourteen and eighteen stages each, printed in full. These six '
      + 'stage types are not among the house structure and no lesson contains one.' },
  { scope: 'Volume', item: 'Foreword and message from the head of the institution',
    status: 'No officer appointed',
    instead: 'A publisher\'s preface, unsigned, appears in the front matter with the reason stated.' },
  { scope: 'Volume', item: 'Editorial photography',
    status: 'Not commissioned',
    instead: 'The visual system is drawn: guilloché, girih geometry, crest and ornament are '
      + 'generated from their own construction. No stock image of a person is used, because a '
      + 'photograph of a model captioned as a student of this College would be a fabrication.' },
];

/**
 * The photographic credits.
 *
 * Set in the colophon rather than beside the images. A caption under a
 * photograph in an institutional publication invites the reader to read
 * it as a record of that institution; these are editorial illustrations
 * and are credited as such, in the place a book credits its sources.
 */
/**
 * EVERY PLACED PHOTOGRAPH, NOT EVERY LEVEL PLATE.
 *
 * This table listed the six level plates and nothing else, while five
 * further licensed photographs were printed as section bands with no
 * credit and \u2014 worse \u2014 no recorded licence reference anywhere in the
 * source. The images were properly licensed; the record that they were
 * had simply never been written down, which is the state a rights
 * query cannot be answered from.
 *
 * The three missing references were recovered from the session that
 * licensed them and are set here. Adding a photograph to this book now
 * means adding a row here: tests/publication-craft.test.mjs counts the
 * placed images and this table and fails if they disagree.
 */
export const PHOTO_CREDITS = [
  ['Plate I', 'A student\u2019s hand writing in an exercise book', 'AdobeStock_107317330', 'level-I.jpg'],
  ['Plate II', 'Friends in conversation', 'AdobeStock_303569584', 'level-II.jpg'],
  ['Plate III', 'Students preparing together for a seminar', 'AdobeStock_160362594', 'level-III.jpg'],
  ['Plate IV', 'Colleagues working through a project', 'AdobeStock_473276830', 'level-IV.jpg'],
  ['Plate V', 'A speaker addressing a conference', 'AdobeStock_569325921', 'level-V.jpg'],
  ['Plate VI', 'A graduate at conferral', 'AdobeStock_427428198', 'level-VI.jpg'],
  ['The Six Awards', 'Two students in conversation in a university library',
    'AdobeStock_489036417', 'band-awards.jpg'],
  ['Teaching from This Book', 'A student working at a laptop in a library',
    'AdobeStock_494627505', 'band-guide.jpg'],
  ['Glossary', 'The thumb index of a printed English dictionary',
    'AdobeStock_326365561', 'band-glossary.jpg'],
  ['Routes Through the Programme', 'Two students working through notes and textbooks at a desk',
    'AdobeStock_280184475', 'band-routes.jpg'],
  ['Subject Index', 'Students at a university lecture', 'AdobeStock_522561589', 'band-index.jpg'],
];

/**
 * The credits for the photographs a given edition actually places.
 *
 * The student edition has no teaching guide and the institutional
 * edition has neither routes nor a subject index, so each places fewer
 * images than the teacher's edition. A colophon crediting a photograph
 * "placed at Teaching from This Book" inside a volume that contains no
 * such section is a false statement about the book in the reader's
 * hands \u2014 small, but the same kind of false as any other. Passing in
 * the files actually placed is what keeps the credit page describing
 * this copy rather than a different one.
 */
export const creditsFor = (placedFiles) => (placedFiles
  ? PHOTO_CREDITS.filter(([, , , file]) => placedFiles.includes(file))
  : PHOTO_CREDITS);

export function backMatter(id, pages, placedFiles, legacyHtml = '') {
  const credits = creditsFor(placedFiles);
  return `
<section class="colophon">
  <div class="col__orn">${fleuron({ colour: C.royalGold, width: 130 })}</div>
  <h2>Colophon</h2>
  <p>This edition was set in a two-family system: a transitional serif for continuous reading and
    a humanist sans for apparatus — headings, stage marks, timings, folios and tables. The measure
    is set at ${esc(TYPE.measure)} on a ${esc(TYPE.baseline)} baseline, the proportion at which a
    teacher can scan a lesson stage without losing the line.</p>
  <p>The ornament is computed rather than drawn. The rosettes on the cover and the frontispiece are
    hypotrochoids — the engine-turned guilloché of security printing, produced from the same
    equations a geometric lathe describes mechanically. The star figures are eight-fold girih
    constructions, derived from a single division of the circle. The crest, the border system, the
    corner fans and the fleurons are generated from their own geometry at render time. Nothing in
    this volume is a stock asset, a traced image or a licensed illustration.</p>
  <p>The verification codes are produced by the same encoder that prints the code on a graduate's
    certificate, and are verified in the College's test suite against an independently written
    decoder.</p>
  <p>Every photograph in this volume is licensed editorial photography, graded to a duotone: the six
    plates facing the level dividers take their own level\u2019s ink, and the section bands take the
    College\u2019s blue. Grading them is what makes ${credits.length} images by
    ${credits.length} photographers read as one commissioned series and belong to the colour
    system rather than sit on top of it. They illustrate the educational settings the programme is
    taught in; they are not records of this College, its students or its premises, and none is
    captioned as though it were.</p>
  <table class="credits"><thead><tr><th scope="col">Placed at</th><th scope="col">Subject</th>
    <th scope="col">Source</th></tr></thead><tbody>${credits.map(([r, sub, ref]) =>
    `<tr><td>${esc(r)}</td><td>${esc(sub)}</td>
      <td class="mono">${esc(ref)} · Adobe Stock, licensed</td></tr>`).join('')}</tbody></table>
  <p class="col__meta">${esc(id.publicationId)} · Document ID ${esc(id.documentId)} ·
    Issue ${esc(id.issueCode)} · ${pages ? `${pages} pages · ` : ''}Generated ${esc(id.generated)}</p>
  <div class="col__band">${guillocheBand({ width: 480, height: 18, stroke: C.royalGold, opacity: 0.5 })}</div>
</section>
${legacyHtml}
<section class="endpaper endpaper--back">
  <div class="endpaper__field">${girihField({ w: 420, h: 594, cell: 58, stroke: C.royalGold, opacity: 0.3 })}</div>
  <div class="endpaper__mark">${crest({ size: 70, gold: C.champagneGold, ink: 'none', mono: true })}</div>
</section>`;
}

export { esc as _esc };
void BRAND; void TYPE; void EMBOSS;
