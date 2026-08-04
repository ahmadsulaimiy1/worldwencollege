/**
 * THE INTERNAL EDITORIAL BIBLE — the registers.
 *
 * ────────────────────────────────────────────────────────────────────
 * WHY THIS EXISTS AND WHY IT IS NOT THE BOOK
 * ────────────────────────────────────────────────────────────────────
 * The public edition previously carried a Register of Omissions: ten
 * entries naming what the curriculum did not contain, printed inside a
 * volume intended for students, teachers and reviewers. It was honest
 * and it was the wrong instrument in the wrong document. A prospectus
 * that opens by listing its own absences teaches the reader to look for
 * absences.
 *
 * The correction is not to conceal anything. It is to put each finding
 * where it can actually be acted on, and to separate three things the
 * omissions register had collapsed into one:
 *
 *   EDITORIAL OPPORTUNITIES — things the publication can fix itself,
 *     with better presentation, apparatus or design. These belong here
 *     and should simply be done.
 *
 *   AUTHORING WORK — things that need curriculum written by qualified
 *     academics. Not inventable, not an editorial matter.
 *
 *   GOVERNANCE DECISIONS — things only the institution can decide or
 *     assert. Recording them here is the correct escalation; printing
 *     them in a prospectus is not.
 *
 * ────────────────────────────────────────────────────────────────────
 * THE RULE THIS DOCUMENT ENFORCES
 * ────────────────────────────────────────────────────────────────────
 * Nothing here licenses invention. An entry marked AUTHORING or
 * GOVERNANCE must never be satisfied by writing plausible text; that is
 * precisely the failure the omissions register was guarding against,
 * and moving the register internally does not repeal the guard. What
 * changes is only where the finding is filed.
 */

/** Where the work has to happen. */
export const OWNER = {
  EDITORIAL: 'Editorial',
  AUTHORING: 'Academic authoring',
  GOVERNANCE: 'Governance',
  PRODUCTION: 'Production',
  ENGINE: 'Tooling limit',
};

const E = OWNER;

/**
 * 1 · EDITORIAL OPPORTUNITY REGISTER
 * Improvements the publication can make to itself, without new
 * curriculum and without an institutional decision.
 */
export const EDITORIAL_OPPORTUNITIES = [
  { item: 'A subject index',
    state: 'The volume has a contents list but no index.',
    opportunity: 'Every grammar point, function and topic in the programme already exists as a '
      + 'lesson title or a named stage. An index can be generated from that material with no new '
      + 'writing at all, and an index is the single clearest signal that a book is a reference '
      + 'work rather than a brochure.',
    owner: E.EDITORIAL, impact: 'High', effort: 'Medium' },

  { item: 'A vocabulary and phrase index',
    state: 'KEY VOCABULARY, KEY PHRASES and PHRASAL VERBS & COLLOCATIONS appear as named stages '
      + 'throughout, but only in the lesson where they are taught.',
    opportunity: 'Collate them into a back-matter index keyed to level and module. A learner '
      + 'revising for an assessment currently has no way to find where a word was introduced.',
    owner: E.EDITORIAL, impact: 'High', effort: 'Medium' },

  { item: 'A teacher’s introduction',
    state: '"How to Read a Lesson" explains the page. Nothing explains how to run the programme.',
    opportunity: 'A two-page introduction on sequencing, pacing against the designed timings, '
      + 'using the formative checks to decide whether to move on, and marking from the rubrics. '
      + 'All of it describes apparatus that already exists in the book.',
    owner: E.EDITORIAL, impact: 'High', effort: 'Low' },

  { item: 'Pull quotes and highlighted insights',
    state: 'Not used. The lesson pages are evenly weighted from top to bottom.',
    opportunity: 'Lesson bodies already contain memorable formulations. Setting a few per level '
      + 'as pull quotes would give long stretches of instructional text a change of pace — but '
      + 'only where the sentence genuinely carries the idea, never as decoration.',
    owner: E.EDITORIAL, impact: 'Medium', effort: 'Low' },

  { item: 'Cross-references between related modules',
    state: 'Lesson bodies frequently say things like "recycled from Module 3" in prose.',
    opportunity: 'Those references are real and already written. Turning them into printed '
      + 'cross-references with module numbers would make the spiral structure of the programme '
      + 'visible instead of implied.',
    owner: E.EDITORIAL, impact: 'Medium', effort: 'Medium' },

  { item: 'A glossary of programme terminology',
    state: 'Terms such as formative assessment, discourse marker, collocation and CEFR band are '
      + 'used throughout without definition.',
    opportunity: 'A short glossary serves the teacher who is new to the vocabulary of the field. '
      + 'These are standard terms of art with settled meanings — defining them is editorial '
      + 'work, not an institutional claim.',
    owner: E.EDITORIAL, impact: 'Medium', effort: 'Low' },
];

/**
 * 2 · CURRICULUM ENHANCEMENT REGISTER
 * Where the curriculum itself could be strengthened. Every entry here
 * needs qualified academic authoring. None may be filled editorially.
 */
export const CURRICULUM_ENHANCEMENTS = [
  { item: 'Lesson-level depth against the published figure',
    state: 'The curriculum holds 294 authored items. The College’s public materials state 720 '
      + 'learning units.',
    opportunity: 'Either author the remaining items, or correct the public figure. Both are '
      + 'legitimate; leaving the two numbers to disagree is not. See the Governance Register.',
    owner: E.AUTHORING, impact: 'Critical', effort: 'High' },

  { item: 'Stage-name consistency',
    state: 'Twelve stage names occur exactly 114 times each — once in every teaching lesson, '
      + 'which is strong evidence the house structure is real. A further 83 names occur in a long '
      + 'tail.',
    opportunity: 'Some of that tail is deliberate variation and some is almost certainly two '
      + 'authors naming the same teaching move differently. Reconciling it would tighten the '
      + 'programme and shorten the anatomy chart’s tail. Measured, not guessed: the figure is '
      + 'in Figure 3 of the publication.',
    owner: E.AUTHORING, impact: 'Medium', effort: 'Medium' },

  { item: 'Reflection, self-assessment and mastery checklists',
    state: 'Not present in any lesson.',
    opportunity: 'Genuinely valuable pedagogically and genuinely absent. Must be authored by '
      + 'academics against the existing objectives — generating them from lesson text would '
      + 'produce plausible prose that no one had validated as assessment instruments.',
    owner: E.AUTHORING, impact: 'High', effort: 'High' },

  { item: 'Portfolio and collaborative tasks',
    state: 'Not present as named stages, though speaking and writing tasks exist throughout.',
    opportunity: 'Several existing writing tasks would serve as portfolio pieces with an '
      + 'authored wrapper defining what is collected and how it is judged.',
    owner: E.AUTHORING, impact: 'Medium', effort: 'Medium' },
];

/**
 * 3 · PEDAGOGICAL ENHANCEMENT REGISTER
 * Learning support that can be added around the curriculum without
 * altering or inventing it.
 */
export const PEDAGOGICAL_ENHANCEMENTS = [
  { item: 'Designed study time made visible per module',
    state: 'Already computed and printed on each module opener, summed from the timings the '
      + 'curriculum sets on its own stages.',
    opportunity: 'Extend the same derivation to level openers and the contents, so a learner can '
      + 'plan a term. The data exists; only the presentation is missing.',
    owner: E.EDITORIAL, impact: 'Medium', effort: 'Low' },

  { item: 'A revision route through the programme',
    state: 'Every level ends with a Review & Consolidation module, and REVISION appears as a '
      + 'named stage 113 times.',
    opportunity: 'Collate those into a printed revision path — what to return to before each '
      + 'assessed quiz. Derived entirely from existing stages.',
    owner: E.EDITORIAL, impact: 'High', effort: 'Medium' },

  { item: 'Pronunciation support surfaced',
    state: 'PRONUNCIATION PRACTICE occurs in 114 lessons with a median designed timing of five '
      + 'minutes.',
    opportunity: 'A short front-matter note on how the pronunciation strand runs through the '
      + 'programme would help a teacher who currently meets it lesson by lesson.',
    owner: E.EDITORIAL, impact: 'Medium', effort: 'Low' },

  { item: 'Assessment guidance for markers',
    state: 'All 60 rubrics are printed with 307 criteria. There is no guidance on applying them '
      + 'consistently between markers.',
    opportunity: 'Inter-marker reliability guidance is a real institutional need. Writing it '
      + 'requires the Board to set the standard first — it cannot be inferred from the rubrics.',
    owner: E.GOVERNANCE, impact: 'High', effort: 'Medium' },
];

/**
 * 4 · READER EXPERIENCE REGISTER
 */
export const READER_EXPERIENCE = [
  { item: 'Running heads do not identify the level',
    state: 'A single running head runs throughout.',
    opportunity: 'A reader opening the book at random relies on the level dividers. Chromium '
      + 'cannot vary a running head by page side or section in its print pipeline, so this needs '
      + 'either a different tool or a printed thumb-index on the page edge.',
    owner: E.ENGINE, impact: 'Medium', effort: 'High' },

  { item: 'Level thumb index',
    state: 'Not present.',
    opportunity: 'A block of colour bleeding off the outer edge, stepping down the page as the '
      + 'levels progress, would make the six levels findable with the book closed. This is a '
      + 'classic reference-book device and needs no new content — but it requires bleed, which '
      + 'this pipeline cannot currently produce.',
    owner: E.ENGINE, impact: 'Medium', effort: 'Medium' },

  { item: 'Editable edition lacks the figures and plates',
    state: 'The DOCX carries every word of the curriculum but none of the five figures, the six '
      + 'photographic plates or the level colour identity.',
    opportunity: 'Faculty editing the curriculum currently work without the apparatus their '
      + 'readers will see. The figures could be embedded as images.',
    owner: E.EDITORIAL, impact: 'Medium', effort: 'Medium' },

  { item: 'No large-print or screen-reading variant',
    state: 'One typographic specification serves both print and screen.',
    opportunity: 'The source is HTML and the type scale is declared in one place, so a '
      + 'larger-type variant is a configuration rather than a redesign.',
    owner: E.EDITORIAL, impact: 'Medium', effort: 'Low' },
];

/**
 * 5 · VISUAL ENHANCEMENT REGISTER
 */
export const VISUAL_ENHANCEMENTS = [
  { item: 'Module openers carry no imagery',
    state: 'Sixty typographic module openers; photography appears only on the six level plates.',
    opportunity: 'Deliberately so. Sixty images would be clutter with a budget and would compete '
      + 'with the contents list each opener carries. Recorded here as considered and declined, so '
      + 'it is not repeatedly re-proposed.',
    owner: E.EDITORIAL, impact: 'Low', effort: 'High' },

  { item: 'Plates do not bleed to the trim',
    state: 'The six plates fill the type area and stop at it.',
    opportunity: 'Full bleed is not achievable in this rendering pipeline: any element wider than '
      + 'the page content box makes the engine scale the entire document. If the book is ever '
      + 'originated in a professional layout application, restore full bleed there.',
    owner: E.ENGINE, impact: 'Medium', effort: 'High' },

  { item: 'Process diagrams for the learner journey',
    state: 'Five figures describe the programme’s shape. None describes a learner’s path '
      + 'through a level.',
    opportunity: 'The path is real and documented — modules in sequence, an assessed quiz and '
      + 'an assessed assignment at the end of each. A process graphic would carry it better than '
      + 'the prose currently does.',
    owner: E.EDITORIAL, impact: 'Medium', effort: 'Medium' },

  { item: 'Comparison table of the six awards',
    state: 'Each award appears on its own level divider.',
    opportunity: 'A single table setting the six awards, post-nominals, CEFR bands and standings '
      + 'side by side would let a reader see the whole qualification at once. Every value already '
      + 'exists in the award definitions.',
    owner: E.EDITORIAL, impact: 'High', effort: 'Low' },
];

/**
 * 6 · PUBLISHING IMPROVEMENT REGISTER
 */
export const PUBLISHING_IMPROVEMENTS = [
  { item: 'No ISBN, DOI or legal deposit',
    state: 'Printed as unassigned, with the issuing authority named.',
    opportunity: 'An ISBN is inexpensive and makes the volume orderable and catalogable. A DOI '
      + 'makes it citable. Both require the College to apply; neither can be self-issued.',
    owner: E.GOVERNANCE, impact: 'High', effort: 'Low' },

  { item: 'Never proofed on paper',
    state: 'Every finding in this project is measured from source. Nothing has been read on a '
      + 'printed sheet.',
    opportunity: 'Six checks in the production specification cannot be verified any other way — '
      + 'guilloché line weights at the chosen screen ruling, spot UV trap, show-through on tinted '
      + 'module openers, and whether the QR scans off matt laminate.',
    owner: E.PRODUCTION, impact: 'Critical', effort: 'Low' },

  { item: 'CMYK values are uncalibrated',
    state: 'The colour specification prints a naive conversion and says so.',
    opportunity: 'Convert against the printer’s ICC profile and re-proof the blues, which drift '
      + 'furthest.',
    owner: E.PRODUCTION, impact: 'High', effort: 'Low' },

  { item: 'No edition history',
    state: 'The identity block carries edition, revision and issue codes but the volume has no '
      + 'page recording what changed between editions.',
    opportunity: 'From the second edition onward, a short edition history is standard in a '
      + 'reference work and is the reader’s only way to know whether their copy is current.',
    owner: E.EDITORIAL, impact: 'Medium', effort: 'Low' },
];

/**
 * 7 · FUTURE DEVELOPMENT REGISTER
 */
export const FUTURE_DEVELOPMENT = [
  { item: 'Competency mapping',
    state: '0 of 120 assessments are mapped to any named competency.',
    opportunity: 'This is the element that distinguishes the IEFC from a CEFR course, and it is '
      + 'the founding task of the Board of Academic Standards and Curriculum Excellence. Until it '
      + 'exists the public definition should not assert it.',
    owner: E.GOVERNANCE, impact: 'Critical', effort: 'High' },

  { item: 'Credit value and total qualification time',
    state: 'Not assigned. Duration in months is printed instead.',
    opportunity: 'Credits and TQT are assigned by an awarding framework the College has not '
      + 'entered. Printing a figure would imply a framework that does not exist.',
    owner: E.GOVERNANCE, impact: 'High', effort: 'High' },

  { item: 'Career and professional outcomes',
    state: 'Not authored, and no outcome data exists.',
    opportunity: 'Naming the roles a CEFR band qualifies someone for is a claim about the labour '
      + 'market. It requires evidence the College does not hold, and should not be written until '
      + 'it does.',
    owner: E.GOVERNANCE, impact: 'Medium', effort: 'High' },

  { item: 'A Foreword by an officer of the College',
    state: 'No President is appointed; the Academic Senate and the Board are established but not '
      + 'constituted. The preface is issued unsigned by the publisher.',
    opportunity: 'When officers are appointed, a signed Foreword is the single strongest '
      + 'institutional signal a publication of this kind can carry.',
    owner: E.GOVERNANCE, impact: 'High', effort: 'Low' },

  { item: 'Translated and localised editions',
    state: 'English only.',
    opportunity: 'The platform already serves an Arabic interface. The curriculum apparatus — '
      + 'stage names, rubric criteria, front matter — is separable from the English content a '
      + 'learner is studying, so a bilingual teacher’s edition is feasible.',
    owner: E.GOVERNANCE, impact: 'Medium', effort: 'High' },
];

/**
 * 8 · GOVERNANCE REGISTER
 * Decisions only the institution can make. Nothing in this list may be
 * resolved by writing text.
 */
export const GOVERNANCE = [
  { item: 'Reconcile the published 720-unit figure',
    detail: 'Public materials state 720 learning units across the qualification; the curriculum '
      + 'holds 294 authored items. The publication states its own counts truthfully and no longer '
      + 'comments on the discrepancy — which means the public figure is now the only place the '
      + 'overstatement appears, and it must be corrected there or met by authoring.',
    urgency: 'Immediate' },

  { item: 'Competency verification in the public definition',
    detail: 'The adopted definition asserts that the IEFC extends CEFR proficiency through '
      + 'competency verification. No assessment is mapped to a competency. Either establish the '
      + 'mapping or qualify the definition wherever it is published.',
    urgency: 'Immediate' },

  { item: 'Constitute the Board of Academic Standards and Curriculum Excellence',
    detail: 'Established but not constituted. It is the body that would own the competency '
      + 'mapping, the stage-name reconciliation and inter-marker reliability.',
    urgency: 'High' },

  { item: 'Appoint officers',
    detail: 'No President is appointed. This is why the publication carries no Foreword and no '
      + 'signed message, and why its preface is issued by the publisher.',
    urgency: 'Medium' },

  { item: 'Apply for an ISBN and a DOI',
    detail: 'Neither can be self-issued. Both are inexpensive and both materially change how the '
      + 'volume can be distributed and cited.',
    urgency: 'Medium' },

  { item: 'Approve the photography policy',
    detail: 'Six licensed editorial photographs are used as level plates, credited in the '
      + 'colophon and explicitly not presented as records of the College. Confirm this is the '
      + 'institution’s standing position before the edition is distributed.',
    urgency: 'Medium' },
];

export const REGISTERS = [
  ['Editorial Opportunity Register', EDITORIAL_OPPORTUNITIES,
    'Improvements the publication can make to itself — no new curriculum, no institutional '
    + 'decision. These should simply be done.'],
  ['Curriculum Enhancement Register', CURRICULUM_ENHANCEMENTS,
    'Where the curriculum itself could be stronger. Every entry needs qualified academic '
    + 'authoring; none may be filled editorially.'],
  ['Pedagogical Enhancement Register', PEDAGOGICAL_ENHANCEMENTS,
    'Learning support that can be built around the curriculum without altering or inventing it.'],
  ['Reader Experience Register', READER_EXPERIENCE,
    'How the volume behaves in the hands of the person using it.'],
  ['Visual Enhancement Register', VISUAL_ENHANCEMENTS,
    'Including one opportunity considered and deliberately declined, recorded so it is not '
    + 'repeatedly re-proposed.'],
  ['Publishing Improvement Register', PUBLISHING_IMPROVEMENTS,
    'The apparatus of a published work, and the steps between this file and a printed book.'],
  ['Future Development Register', FUTURE_DEVELOPMENT,
    'Longer-horizon work, most of it gated on institutional decisions rather than effort.'],
];

/** Every entry, for counting and for the summary table. */
export const ALL_ENTRIES = REGISTERS.flatMap(([name, rows]) =>
  rows.map((r) => ({ ...r, register: name })));
