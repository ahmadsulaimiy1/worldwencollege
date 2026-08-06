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
/**
 * EXECUTED. Items that were on the registers and are now in the book.
 *
 * They are kept rather than deleted for two reasons: a register that
 * only ever shrinks gives no account of what the editorial team did,
 * and the next edition's editor needs to know that a subject index
 * exists and how it is derived before proposing one.
 */
export const EXECUTED = [
  { item: 'Glossary of programme terminology', built: '50 terms of art, defined as the field '
    + 'defines them and never as a claim about the College. Every headword is counted across the '
    + 'curriculum before it is printed and carries its first use and total; three proposed '
    + 'headwords were dropped because the curriculum does not use them.' },
  { item: 'Cross-reference system', built: '191 structured references extracted from the '
    + 'PREREQUISITE KNOWLEDGE stages, printed as a "Builds on" line under each lesson title and in '
    + 'both directions on the module openers. 82 of them are cross-level, which required carrying '
    + 'the level context forward through each prerequisite sentence.' },
  { item: 'The spiral, measured (Figure 7)', built: 'All 60 modules weighted by the number of '
    + 'later lessons that name them. The programme described itself as spiral; this is the first '
    + 'edition in which a reader can test that.' },
  { item: 'A learner’s path (Figure 6)', built: 'The module cycle, the ten modules of a level '
    + 'closing in an award, and the six-level ascent — the same shape at three scales.' },
  { item: 'The revision route', built: 'For all 60 modules, what that module’s own revision and '
    + 'prerequisite stages send the class back to, set against the assessments it precedes.' },
  { item: 'The pronunciation strand', built: 'All 114 pronunciation stages collected in order, '
    + 'each printed as the curriculum’s own sentence with its designed timing.' },
  { item: 'Pull quotes', built: '48 module openers carry the module’s own discussion prompt with '
    + 'its lesson reference, replacing a boilerplate paragraph that had been printed 60 times. '
    + 'Level I carries none: its prompts are instructions with a question inside them and do not '
    + 'stand alone, and the rule was not relaxed to reach a round number.' },
  { item: 'Module-opening visual system', built: 'A stage fingerprint drawn from the teaching '
    + 'moves each module actually uses, the level colour band, the cross-references in both '
    + 'directions and the pull quote — so no two openers are the same page.' },
  { item: 'Editable edition brought level with the print edition', built: 'The seven figures '
    + 'rasterised and embedded, the six level plates graded through the print edition’s own '
    + 'duotone filter, per-level colour identity, and the full apparatus: cross-references, '
    + 'glossary, routes, revision route and pronunciation strand.' },
  { item: 'Large-print variant', built: 'IEFC_TYPE_SCALE builds the whole book at any type scale '
    + 'from the same source; npm run curriculum:large produces it at 135%, 563 pages. Built on '
    + 'demand rather than committed, because the capability is the deliverable and the file is a '
    + 'second copy of the same book.' },
  { item: 'Subject index', built: '251 subjects extracted from the titles the curriculum gives '
    + 'its own lessons, indexed by lesson reference rather than page so it survives reflow.' },
  { item: 'Vocabulary and phrase index', built: '352 words, phrases and collocations taken from '
    + 'the terms the curriculum quotes in its own vocabulary stages, each pointing to the lesson '
    + 'where it is taught.' },
  { item: 'Assessment index', built: 'All 120 assessed items in one table per level, with '
    + 'question counts and references, for planning a term.' },
  { item: 'Teacher’s introduction', built: '"Teaching from This Book" — before the session, '
    + 'during it, assessing, and finding your way back. Describes only apparatus that exists.' },
  { item: 'Awards comparison table', built: '"The Six Awards" — level, programme, CEFR band, '
    + 'award, post-nominal and standing side by side, printed from the award definitions.' },
  { item: 'Photography beyond the chapter openings', built: 'Three further licensed photographs '
    + 'as duotone bands at the head of the institutional sections, graded in the College’s own '
    + 'blue rather than a level colour — the same construction one tier up.' },
  { item: 'Module study time', built: 'Designed minutes summed from the curriculum’s own stage '
    + 'timings and printed on every module opener.' },
];

export const EDITORIAL_OPPORTUNITIES = [
  { item: 'Edition history',
    state: 'The identity block carries edition, revision and issue codes; there is no page '
      + 'recording what changed between editions, because there is not yet a previous edition to '
      + 'record a change from.',
    opportunity: 'Deferred by design rather than outstanding. From the second edition onward a '
      + 'short edition history is standard in a reference work and is the reader’s only way to '
      + 'know whether their copy is current. The apparatus to generate it already exists: the '
      + 'content digest changes whenever any lesson does.',
    owner: E.EDITORIAL, impact: 'Medium', effort: 'Low' },

  { item: 'Per-module photography',
    state: 'Sixty module openers, each with a stage fingerprint, colour band, cross-references '
      + 'and — for 48 of them — a pull quote. No photography.',
    opportunity: 'The visual system is built and the photography is not, for one reason: sixty '
      + 'licensed editorial photographs is a licensing budget, and repeating the nine images this '
      + 'edition holds across sixty openers would read as a shortage rather than a series. This '
      + 'is an external-licensing item, not an editorial one.',
    owner: E.EDITORIAL, impact: 'Low', effort: 'High' },
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

  // Surfaced by building the routes: the filter that found the strand
  // also found where it stops.
  { item: 'The collocation strand stops at the consolidation modules',
    state: 'Phrasal verbs, collocations and discourse markers are set out in the opening item of '
      + '56 of the 60 modules. The four without are III.10, IV.10, V.10 and VI.10 — the review '
      + 'and consolidation module at the end of Levels III to VI. Levels I and II carry one in '
      + 'their tenth module; the upper four do not.',
    opportunity: 'This may be deliberate — a consolidation module reviews what has been taught '
      + 'rather than introducing a further lexical set — or it may be drift between the levels '
      + 'authored earlier and those authored later. The publication states the fact and does not '
      + 'decide which, because deciding is an academic judgement about the design of a '
      + 'consolidation module.',
    owner: E.AUTHORING, impact: 'Low', effort: 'Low' },

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
  { item: 'A grammar route through the programme',
    state: 'The curriculum names a grammar stage exactly once, at VI.10.1 — GRAMMAR CONSOLIDATED '
      + 'ACROSS LEVEL VI — which is a revision summary rather than a strand. The prerequisite '
      + 'stages name grammar points in parentheses ("Module 2 (“there is/are”, possessive '
      + 'groundwork)") throughout, so the material to build one exists.',
    opportunity: 'Every other route in the published edition is a filter on a named stage that '
      + 'any reader can re-run. A grammar route would mean deciding which of the language points '
      + 'in each of 294 items counts as grammar — a subject-matter judgement that would be set in '
      + 'the same type as the verifiable routes and would not be the same kind of thing. It '
      + 'belongs to the Board, and the published edition says so on the page rather than leaving '
      + 'the absence to be noticed.',
    owner: E.AUTHORING, impact: 'High', effort: 'Medium' },

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
    state: 'A single running head runs throughout. Partly mitigated: every lesson header now '
      + 'carries its full reference (IV.7.3), every module opener names its level and CEFR band, '
      + 'and the cross-references beneath each lesson title are in the same numbering — so a '
      + 'reader opening at random is never more than a few lines from knowing where they are.',
    opportunity: 'The running head itself is still the same on every page. Chromium cannot vary '
      + 'a running head by page side or section in its print pipeline — verified, not assumed — '
      + 'so closing this needs either a different tool or a printed thumb-index on the page edge, '
      + 'which needs bleed, which this pipeline also cannot produce.',
    owner: E.ENGINE, impact: 'Medium', effort: 'High' },

  { item: 'Level thumb index',
    state: 'Not present.',
    opportunity: 'A block of colour bleeding off the outer edge, stepping down the page as the '
      + 'levels progress, would make the six levels findable with the book closed. This is a '
      + 'classic reference-book device and needs no new content — but it requires bleed, which '
      + 'this pipeline cannot currently produce.',
    owner: E.ENGINE, impact: 'Medium', effort: 'Medium' },

];

/**
 * 5 · VISUAL ENHANCEMENT REGISTER
 */
export const VISUAL_ENHANCEMENTS = [
  { item: 'Plates do not bleed to the trim',
    state: 'The six plates fill the type area and stop at it.',
    opportunity: 'Full bleed is not achievable in this rendering pipeline: any element wider than '
      + 'the page content box makes the engine scale the entire document. If the book is ever '
      + 'originated in a professional layout application, restore full bleed there.',
    owner: E.ENGINE, impact: 'Medium', effort: 'High' },

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
