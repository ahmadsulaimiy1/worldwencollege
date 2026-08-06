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
  { item: 'Learning modes, and a metric that was measuring pedagogy as a defect',
    built: 'Lessons independently learnable read 54 per cent, and the obvious response was to '
      + 'author solo alternatives for the other 53 until the number rose. That would have been '
      + 'the worst decision in the project: a speaking lesson that requires another speaker is '
      + 'stronger than a weaker exercise redesigned to satisfy a percentage. Every lesson now '
      + 'declares the mode its objective requires — independent 33, collaborative 68, authentic '
      + 'communication 12, instructor-led 1, guided nought — summing to 114, and a lesson is '
      + 'measured against its own mode. Lessons whose mode is fully supported: 100 per cent. '
      + 'Guided is defined and unused, and reported as nought rather than hidden. The '
      + 'classification is STRUCTURAL — derived from the lesson text — and awaits expert '
      + 'review.' },
  { item: 'Self-checks: Levels I to III complete', built: '57 of 114 lessons, 174 prompts, 70 '
    + 'of them targeting a named confusion — the present perfect that survives a question naming '
    + 'a time, "In my opinion, I think", the dropped passive auxiliary, over-deduction with '
    + '"must", "responsible of", and the learner who uses "after that" for every transition and '
    + 'flattens a story into a list. Complete mastery coverage: nought to 16 to 49 per cent, each '
    + 'step bounded by what was authored rather than by how the metric was defined. Eight '
    + 'self-checks in the second batch carried no identified confusion; rather than relax the '
    + 'standard the eight confusions were written.' },
  { item: 'Self-checks, and the first non-zero mastery reading', built: '19 self-checks for '
    + 'Level I — 58 prompts, every one with an answer beside it, and 25 targeting a named '
    + 'confusion: the missing third-person -s, "quarter to nine" rather than eight, "she has '
    + 'tall", the -ed that vanishes after didn\u2019t. A self-check is not a lesson stage, '
    + 'because a printed stage cannot hide an answer; it is a separate record the learner '
    + 'attempts alone, immediately, rather than discovering ten lessons later at the module quiz '
    + 'that they misunderstood lesson three. Complete mastery coverage moved from nought to 16 '
    + 'per cent — bounded by the 19 authored, not by intent. 95 lessons remain.' },
  { item: 'The pedagogical record, and the 1,616 fields deliberately left empty', built: '17 '
    + 'fields for each of the 114 teaching lessons: common mistakes, why they are made, '
    + 'misconceptions, intervention, alternative and faster and visual explanations, analogy, '
    + 'remediation, differentiation both ways, confusable concepts, prerequisites, time, and what '
    + 'the lesson unlocks. Three are derived from the curriculum — prerequisites from the lesson '
    + 'stage, time from its own stage timings, and what it unlocks from the cross-reference '
    + 'graph. The other fourteen are what a teacher learns by teaching, and this College has '
    + 'taught nobody, so 1,616 of 1,938 entries are marked not_yet_evidenced and carry no value. '
    + 'That emptiness is the deliverable: a record filled with plausible prose about '
    + 'misconceptions nobody has observed would look like classroom knowledge, be guesswork, and '
    + 'be inherited as fact by every future edition. A test asserts that no field is ever marked '
    + 'observed_in_teaching while nobody has taught.' },
  { item: 'All 49 supplied-material sets authored', built: 'Every practice stage in the '
    + 'programme that hands a learner something now has the something: 49 sets, 282 items, '
    + 'across all six levels. Complete practice rose from 67 per cent of lessons to 100; lessons '
    + 'independently teachable from print rose from 67 to 100; lessons learnable without a '
    + 'teacher rose from 33 to 54. Every set is press_drafted and none claims academic approval, '
    + 'because there is nobody with standing to give it. The Workbook, withdrawn two passes ago '
    + 'for pointing at material that did not exist, is derivable again — and this time the '
    + 'material is there.' },
  { item: 'Fifty instructions pointing at nothing, found and counted', built: 'Asking the '
    + 'mastery question — can a learner who finishes this lesson do something they could not '
    + 'do before — found 50 practice stages across 48 lessons that hand the learner material '
    + 'which did not exist: "you are given 8 sentence pairs", "sort 10 sentence prompts", '
    + '"revise a provided paragraph". A learner alone met a task they could not begin; a teacher '
    + 'invented the items before every class, differently each time. Detection is mechanised and '
    + 'classification is declared in two registers, so a candidate in neither fails the build — '
    + 'and the first version of that check was false, passing by construction until a sabotage '
    + 'run exposed it.' },
  { item: 'The first ten exercise sets authored', built: 'sql/seed-exercises.sql: 10 sets, 60 '
    + 'items, 43 with model answers, covering every supplied-material stage in Levels I and II — '
    + 'taken first because beginners are least able to improvise what is missing. Every set is '
    + 'press_drafted and none claims academic approval, because the College has no appointed '
    + 'academic body to give it. Three sets replace a picture the curriculum asks for by '
    + 'describing the frames in words; the illustration itself is recorded as outstanding rather '
    + 'than pretended away. 39 sets remain, each one named.' },
  { item: 'The Workbook requirement, corrected twice', built: 'First it measured that practice '
    + 'was DESCRIBED and found the Workbook derivable when it was not. Then it measured printable '
    + 'items and reported nought of 114 lessons, which overstated the gap by a factor of two: '
    + 'most practice here is learner-generated and needs nothing supplied. The requirement now '
    + 'reads 49 supplied-material sets, of which 10 exist. A metric that overstates a gap is not '
    + 'safer than one that understates it — it costs the same credibility and sends the authoring '
    + 'effort to the wrong place.' },
  { item: 'The Workbook was withdrawn by attempting it', built: 'It ranked first for '
    + 'educational impact and the catalogue said it was derivable: every lesson carries guided '
    + 'practice, homework and extension. Every one of those is a BRIEF — "Combine 8 sentence '
    + 'pairs into one sentence using a defining relative clause" — and nought of 114 lessons '
    + 'carries the eight pairs. The requirement had measured that practice was DESCRIBED, not '
    + 'that a learner had anything to work on. A new measured requirement was added, the title '
    + 'moved to Requires authoring with a deficit of 114 lessons, and the Assessment Handbook '
    + 'was published instead. The Classroom Activities Handbook stays derivable from the same '
    + 'briefs, because a teacher reads a brief and writes the pairs on the board; a learner '
    + 'alone cannot.' },
  { item: 'The IEFC Assessment Handbook', built: '154 pages at B5. 60 assignments, 60 rubrics, '
    + '307 criteria and 660 questions with their answer keys, arranged by what an assessor does '
    + 'rather than by curriculum order. Producing it found that five rubrics state no pass '
    + 'threshold, and that they are systematic rather than random: the Review & Consolidation '
    + 'module of every level except the last. The volume prints the gap where an assessor will '
    + 'meet it rather than filling it in.' },
  { item: 'First off the impact ranking: The IEFC Listening Scripts', built: '48 pages at the '
    + 'flagship trim. 60 listening scripts, 497 speaker-attributed cues and 46 minutes of '
    + 'reading, written for the audio platform and never printed. It was published first because '
    + 'it scored first, not because it was easiest: a listening lesson currently cannot be run at '
    + 'all — nought of 60 scripts has a recording — so this is the only way the material reaches '
    + 'a class. Set as a performance script rather than a transcript: speaker in the margin, one '
    + 'cue per line, no script broken across a page turn, target pace at the head of every '
    + 'script, and the comprehension task on the same spread as the script it belongs to. The '
    + 'title page states there is no audio rather than burying it in a note. No timecodes are '
    + 'printed: every cue timing in the database is empty, and a timecode for audio that does not '
    + 'exist would be inventing a measurement.' },
  { item: 'The Canon: five divisions, and the eleven titles that were not books',
    built: 'Every one of the 62 catalogue titles is now placed in one of five divisions, and '
      + 'every one states what to read before it, alongside it and after it — checked by a test '
      + 'that fails if a relationship points at a publication which does not exist. The canon was '
      + 'specified as 51 titles; 11 of them were the same book under another name — a Marking '
      + 'Guide and a Rubric Handbook and an Assessment Handbook are one volume with three '
      + 'titles — and each is resolved in the open as justified, referenced or removed, with the '
      + 'reason printed. One of the eleven was a title the Press had already catalogued itself. '
      + 'The Canon Index is published as a volume at the scholarly trim.' },
  { item: 'The publishing order, ranked by educational impact rather than by convenience',
    built: 'Nineteen derivable titles scored against four weighted criteria — reach, frequency, '
      + 'what it makes possible, and how hidden the material is now — each with a written reason. '
      + 'The order falls out of the arithmetic. The Workbook and the Listening Scripts tie at 54, '
      + 'and the tie-break is declared rather than settled by array order: the title that unblocks '
      + 'more goes first, so the scripts lead, because listening lessons cannot currently run at '
      + 'all and workbook lessons can.' },
  { item: 'The first title derived from the catalogue', built: 'The IEFC Pronunciation Handbook '
    + '— 70 pages at royal octavo, the first publication of the Press set at a format other than '
    + 'the flagship\u2019s. 180 pronunciation targets, 114 classroom stages and 60 model scripts '
    + 'that were authored for the platform and had never been set as a book: a teacher who wanted '
    + 'to see the pronunciation strand whole had to open 114 lessons one at a time. Nothing in it '
    + 'is composed for the volume. The one editorial judgement is the arrangement — by the six '
    + 'kinds of difficulty rather than by level, because a teacher reaching for a pronunciation '
    + 'handbook is asking where a problem is taught, not what comes next; the curriculum order is '
    + 'recovered in an appendix.' },
  { item: 'The legacy apparatus, and two probes it corrected', built: 'Every publication now '
    + 'carries family, maturity, issue code, citation form, cataloguing data and a revision '
    + 'history derived from the source repository. Building the first new title immediately found '
    + 'two defects in the readiness probes themselves: archive-readiness depended on each renderer '
    + 'printing a generation stamp, so the apparatus now carries it by construction; and '
    + 'print-readiness tested for A4, which failed the first book set at one of the house\u2019s '
    + 'own four trims. The probe was measuring the flagship rather than the standard.' },
  { item: 'The Press constituted as a set of checkable rules', built: 'Twenty-three '
    + 'constitutions covering institutional publishing, editorial, design, typography, colour, '
    + 'photography, illustration, infographics, iconography, accessibility, print production, '
    + 'digital publishing, copyright, licensing, revision, translation, quality assurance, '
    + 'academic integrity, editorial review, visual review, production workflow, version control '
    + 'and governance. Every clause declares its own force — Enforced (a named test fails the '
    + 'build), Observed, Adopted, or For adoption — and tests/publication-press.test.mjs asserts '
    + 'that a clause may only claim enforcement if it names a test file that is on disk, and may '
    + 'only name one if it claims enforcement.' },
  { item: 'The ten-year publication architecture, computed rather than promised', built: '42 '
    + 'titles across 10 series and four waves. No status is typed: each title declares what a '
    + 'real edition would require in countable units, and Published / Derivable / Requires '
    + 'authoring / Requires governance falls out of the live academic database. The result is '
    + 'unflattering in the right places — the Reading Programme reports 78 of the 114 lessons it '
    + 'needs, the Academic Framework volume reports nought of 120 assessments mapped, and the '
    + 'Listening Programme reports 120 scripts and nought recordings. The test empties the '
    + 'inventory and asserts every derivable title stops being derivable, which is how a typed '
    + 'status would be caught.' },
  { item: 'The house visual identity, as a system for the second book', built: 'The Production '
    + 'Specifications describe one book exactly and cannot govern the next. The house identity '
    + 'separates constants (crest, two families, ground, metal, folio, spine architecture) from '
    + 'what varies by series, and derives every number: four formats with margins as proportions '
    + 'of trim under a 75-character measure ceiling, spine bands from the same caliper formula '
    + 'that produced the flagship cover, and one colour per series checked for contrast against '
    + 'the ground it is actually printed on. Three defects in the first assignment were caught by '
    + 'that check — two shared hues, and midnight navy assigned to a series, which measures '
    + '1.00 : 1 on a midnight navy spine.' },
  { item: 'Three editions from one source', built: 'IEFC_EDITION selects between the Teacher’s '
    + 'Edition (441pp, answer keys and the teaching guide), the Student Edition (437pp, the same '
    + 'curriculum with the keys and the guide withheld — the rubrics stay, because a learner is '
    + 'entitled to the criteria they are marked against) and the Institutional Edition (53pp: the '
    + 'architecture, the six figures, the awards, every level’s contents and the assessment index, '
    + 'without the lesson bodies). One curriculum, one design system, one set of extractors; each '
    + 'edition binds to its own extent and gets its own cover. tests/publication-editions.test.mjs '
    + 'holds them together — including that the student edition marks no correct answers, that no '
    + 'curriculum text is in one full edition and missing from the other, and that the empty '
    + 'competency column travels into the executive volume rather than being quietly dropped.' },
  { item: 'Photographic credits follow the edition', built: 'The colophon credited a photograph '
    + '"placed at Teaching from This Book" in the student edition, which has no such section. '
    + 'Credits are now filtered by the images actually placed, read off the assembled markup — '
    + 'and the first attempt at that fix listed the sections by hand and reproduced the same bug, '
    + 'which the edition test caught.' },
  { item: 'The printed page, rasterised and measured', built: 'The book is now rendered back to '
    + 'pixels page by page and each page asked how far down its ink reaches. Pagination happens '
    + 'inside the print pipeline, after every CSS decision, so this is the only place the question '
    + '"is this page finished?" can be answered. The first run found 172 of 522 pages filling '
    + 'under 60% of the text block and 106 under 40%.' },
  { item: 'The forced page breaks, removed', built: 'A ceremonial page break stood before each of '
    + 'the 120 assessed items and each of the 60 module openers. The idea was sound and its price '
    + 'was a hole on the page before it, every time — one fifth of the book. The dark assessment '
    + 'header is a strong enough event without a page turn, and mid-page it arguably interrupts '
    + 'more decisively. 522 pages to 441 with not one word removed; pages under 40% full from 106 '
    + 'to 15, and most of those fifteen are designed full-page leaves the metric reads as empty.' },
  { item: 'Every level opens with its own contents', built: 'The level introduction carried the '
    + 'graduate profile and the purpose and filled 17% of its page — six times, each of them the '
    + 'page facing a level’s first module. It now carries the ten modules of that level with '
    + 'their teaching counts and designed minutes, and closes on the award they confer. The global '
    + 'contents lists them eighty pages earlier; this is where a learner starting the level '
    + 'actually looks.' },
  { item: 'Long stage parentheticals set as notes', built: 'Ninety of the thousand stage '
    + 'parentheticals are not durations but sentences, up to 142 characters. Set as a timing badge '
    + 'they wrapped into a two-line italic block jammed against a two-line heading. Anything longer '
    + 'than a short phrase is now a note on its own line at the full measure.' },
  { item: 'Figure text measured, not assumed', built: 'Every label in every figure is now measured '
    + 'as a rendered box against its own frame and against its neighbours. SVG has no layout '
    + 'engine: a label that runs past the edge is clipped in silence and one drawn at the same '
    + 'height as another simply prints through it. Four defects were found this way, in three of '
    + 'the seven figures — including the assessment map printing its last column as MAPPED TO '
    + 'COMPET, in the figure whose whole argument is that the column is empty.' },
  { item: 'The four-skills figure, withdrawn', built: 'Built, measured, and removed. It plotted '
    + 'four series that are flat at 38.8–40.8 per hundred items across all six levels, under a '
    + 'caption claiming reading and writing rise — reading is flat everywhere but Level IV and '
    + 'falls at Level VI. The lines are flat because every teaching lesson carries a stage for '
    + 'every skill, so the figure was measuring the ratio of teaching lessons to total items and '
    + 'could never have shown what it claimed. Figure 3 and the routes coverage table carry the '
    + 'finding properly.' },
  { item: 'Photographic credits completed', built: 'The colophon credited the six level plates '
    + 'while five further licensed photographs printed as section bands with no credit and no '
    + 'licence reference recorded anywhere in the source. Nothing was unlicensed; the record did '
    + 'not exist. All eleven are now credited with their references, and the test suite counts the '
    + 'placed images against the credits table so the two cannot drift apart again.' },
  { item: 'Two further licensed photographs', built: 'A dictionary thumb index opening the '
    + 'glossary and a revision desk opening the routes, so the reference apparatus at the back of '
    + 'the book carries the same photographic rhythm as the front. A third was licensed for the '
    + 'pronunciation strand and not used: a posed classroom with a bare-shouldered top, which '
    + 'fails the modesty requirement and does not match the observational direction of the other '
    + 'ten. The licence is spent; printing it would have cost more.' },
  { item: 'Table headings that survive a page break', built: 'thead is set to table-header-group '
    + 'and rows are kept whole, so the pronunciation strand and the revision route repeat their '
    + 'column headings on every page they continue onto instead of presenting a reader with three '
    + 'unlabelled columns of references.' },
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
  { item: 'The legacy apparatus in the institutional flagship document',
    owner: OWNER.EDITORIAL,
    state: 'Eight of the nine issued artefacts now carry the Press apparatus — family, maturity, '
      + 'issue code, citation form, cataloguing data and revision history. The institutional '
      + 'flagship document does not. It is produced through a different path: one block list '
      + 'rendered twice, to Word and to print, with a test comparing the two token by token. '
      + 'Injecting HTML into the print side alone would break that comparison, which is the '
      + 'guard that keeps the two artefacts identical.',
    opportunity: 'Express the apparatus as blocks rather than as HTML, so both renderers emit '
      + 'it and the token comparison still holds. The readiness table in the Press volume shows '
      + 'this publication failing three properties until that is done, which is the correct '
      + 'behaviour: the gap is visible in print rather than recorded in a file nobody opens.',
    impact: 'Medium — one publication of nine is outside the record apparatus.',
    effort: 'Medium — three new block kinds and a rebuild of both artefacts.' },
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

/**
 * ─────────────────────────────────────────────────────────────────────
 * THE FINAL PUBLICATION AUDIT
 * ─────────────────────────────────────────────────────────────────────
 * The Editorial Board's sign-off, section by section, before the
 * edition is released.
 *
 * Four statuses, and they are not interchangeable:
 *
 *   APPROVED — nothing within editorial authority would materially
 *     improve this heading.
 *   APPROVED WITH OBSERVATION — releasable, with a limitation stated
 *     rather than left to be discovered.
 *   REQUIRES GOVERNANCE DECISION — the work is blocked on a decision
 *     no editor may take: an academic mapping, a legal registration,
 *     an institutional appointment.
 *   NOT READY FOR PUBLICATION — do not release this heading.
 *
 * A board that approves everything has audited nothing. Two headings
 * below are not approved, and one of them is the reason this audit
 * exists rather than a summary of it.
 */
export const AUDIT_STATUS = {
  APPROVED: 'Approved',
  OBSERVED: 'Approved with Observation',
  GOVERNANCE: 'Requires Governance Decision',
  NOT_READY: 'Not Ready for Publication',
};

const A = AUDIT_STATUS;

export const AUDIT = [
  { heading: 'Educational Excellence', status: A.APPROVED,
    finding: 'Every one of the 294 authored items is printed whole: objectives, staged practice '
      + 'with the designed timing of each stage, modelled language, the formative check that tells '
      + 'a teacher whether to move on, and — in the teacher’s edition — the answer key beneath '
      + 'each quiz. A teacher can teach from these pages without the platform, which is the only '
      + 'test of a curriculum that matters.' },

  { heading: 'Academic Integrity', status: A.OBSERVED,
    finding: 'No fact in this volume is unsupported by the curriculum or the institutional record. '
      + 'The figures are generated at build time and several are unflattering: the assessment map '
      + 'prints a competency column that is empty in all six levels, and the stage-frequency figure '
      + 'prints the naming tail rather than the head alone.',
    observation: 'Two claims were withdrawn during this audit rather than defended. A four-skills '
      + 'figure carried the caption "reading and writing rise as the ascent proceeds"; measured, '
      + 'reading is flat everywhere but one level and falls at the last. It had been printed in '
      + 'three editions. And the routes page asserted the curriculum names no grammar stage; it '
      + 'names one, at VI.10.1. Both are corrected, and both are recorded here because the pattern '
      + 'matters more than either instance: a sentence written from memory of the data outlives '
      + 'the data.' },

  { heading: 'Editorial Excellence', status: A.APPROVED,
    finding: 'The apparatus is extracted, never composed: 191 cross-references pulled from the '
      + 'prerequisite stages, 48 pull quotes that are the curriculum’s own discussion prompts, '
      + 'a 50-term glossary in which every headword is counted across the corpus before it prints, '
      + 'and three indexes keyed to lesson references rather than page numbers so they survive '
      + 'reflow. Where an extraction could not be made honestly — a grammar route, a fourth-skills '
      + 'figure — nothing was printed and the reason is on the page.' },

  { heading: 'Information Architecture', status: A.APPROVED,
    finding: 'One house structure holds from the first level to the sixth, and the reader is never '
      + 'more than a few pages from an event: the measured distance between designed events in the '
      + 'curriculum body is a median of four pages and a maximum of five. Six figures carry the '
      + 'architecture, each measured from the database rather than drawn to illustrate it.' },

  { heading: 'Typography', status: A.APPROVED,
    finding: 'Two families, one measure, one baseline. Nothing is set below the 5.5 pt print '
      + 'legibility floor — thirteen sizes once were, all inside figures that scale with their '
      + 'viewBox. Rule weights and tracking are held to small declared scales and counted on every '
      + 'build. Orphans and widows are set on body prose, headings never break from what follows '
      + 'them, and table headings repeat across a page break.' },

  { heading: 'Colour', status: A.APPROVED,
    finding: 'Fourteen institutional colours, each with a stated role, and six level identities '
      + 'generated in OKLCH at one lightness so only hue varies — the measured ink-luminance '
      + 'spread is 1.23× where hand-picked hexes gave 2.24×. Every ink carries at least '
      + '4.5:1 against the paper it is specified on; nine contrast pairs are checked on every '
      + 'build. Royal Gold is barred from type on light paper at 2.82:1 and Bronze carries it '
      + 'instead.' },

  { heading: 'Photography', status: A.OBSERVED,
    finding: 'Eleven licensed editorial photographs, each graded to a duotone — the level plates in '
      + 'their own level’s ink, the section bands in the College’s blue — so that eleven '
      + 'images by eleven photographers read as one commissioned series. None is captioned as a '
      + 'record of this College, because none is.',
    observation: 'A twelfth was licensed for the pronunciation strand and is not used: a posed '
      + 'classroom with a bare-shouldered top, failing both the modesty requirement and the '
      + 'observational direction of the other eleven. The licence is spent. Per-module photography '
      + 'across all sixty openers remains a licensing question, not an editorial one.' },

  { heading: 'Illustration', status: A.APPROVED,
    finding: 'Nothing in this volume is a stock illustration or a traced image. The rosettes are '
      + 'hypotrochoids, the star figures eight-fold girih constructions, and the crest, borders, '
      + 'corner fans and fleurons are generated from their own geometry at render time. Nineteen '
      + 'stage icons are drawn on one 24-unit grid at one stroke weight; five were redrawn after '
      + 'inspection at their printed size of 13 px.' },

  { heading: 'Navigation', status: A.OBSERVED,
    finding: 'Every lesson carries its reference, its prerequisites and — on the module openers — '
      + 'the later lessons that return to it. Each level opens with its own ten modules. Six '
      + 'reference sections close the volume.',
    observation: 'The running head is the same on every page. Chromium cannot vary a running head '
      + 'by section in its print pipeline — verified, not assumed — and the printed thumb index '
      + 'that would replace it needs bleed, which this pipeline also cannot produce. Both are '
      + 'engine limits, and both are mitigated rather than solved.' },

  { heading: 'Reader Experience', status: A.APPROVED,
    finding: 'The printed book is rasterised page by page and every page measured for how far its '
      + 'ink reaches. The first such measurement found 172 of 522 pages under 60% full and 106 '
      + 'under 40% — one fifth of the book was white space nobody had chosen, inherited from a '
      + 'forced page break before every assessed item. Removing it took the volume from 522 pages '
      + 'to 441 with not one word cut. The median page now fills 96%.' },

  { heading: 'Teacher Experience', status: A.APPROVED,
    finding: 'This is a teacher’s edition and says so. The answer key sits beneath its own '
      + 'quiz rather than at the back of a 441-page book; every rubric is set as an instrument '
      + 'with the criterion on the left and what the marker is looking for on the right; the '
      + 'designed duration of each lesson is summed from timings the curriculum already carried '
      + 'and had never added up.' },

  { heading: 'Assessment Design', status: A.GOVERNANCE,
    finding: 'The instrument is complete and regular: 120 assessed items, 660 questions with '
      + 'answer keys, and 307 rubric criteria across sixty rubrics, identical in structure at '
      + 'every level.',
    observation: 'None of the 120 is mapped to a named competency. The College defines the IEFC as '
      + 'a qualification extending CEFR proficiency through competency verification; until that '
      + 'column is populated the definition is an intention rather than a demonstration. '
      + 'Establishing the mapping is academic authoring and belongs to the Board of Academic '
      + 'Standards and Curriculum Excellence. The empty column is printed in all three editions, '
      + 'including the one written for accreditation panels.' },

  { heading: 'Print Production', status: A.OBSERVED,
    finding: 'The text block and the cover are separate files, as a printer receives them. The '
      + 'spine is calculated from the bound extent at a stated caliper and recalculated per '
      + 'edition. The cover carries 3 mm bleed on all four edges. Every placed photograph clears '
      + '300 dpi at its printed size, and no drawn line falls below the 0.25 pt press floor.',
    observation: 'This book has never been printed. Colour is specified in sRGB and has not been '
      + 'separated or proofed; ink coverage, show-through and paper interaction are design '
      + 'intentions until a wet proof says otherwise. Creep compensation is documented rather than '
      + 'applied, because it depends on the signature scheme the printer chooses. No edition '
      + 'should go to a full run without a proof.' },

  { heading: 'Accessibility', status: A.OBSERVED,
    finding: 'The PDF is tagged, carries a document language and a navigable outline. No heading '
      + 'level is skipped anywhere in the volume; all 82 tables declare header scope and carry '
      + 'header cells; every placed photograph has descriptive alternative text and every '
      + 'decorative SVG is hidden from assistive technology while every figure carries a label. A '
      + 'large-print variant builds from the same source at any type scale.',
    observation: 'Tagging has not been validated against PDF/UA by an external checker, and the '
      + 'reading order of the figures has not been tested with a screen reader. Neither is a '
      + 'defect found; both are checks not yet run.' },

  { heading: 'Brand Identity', status: A.APPROVED,
    finding: 'One crest, one colour system, one type system, one ornamental language, applied '
      + 'across the cover, the three editions, the specifications and the platform. The design is '
      + 'deliberately unfashionable — a transitional serif, a humanist sans, engine-turned '
      + 'ornament and a blue-and-gold livery — because the volume has to look current in twenty '
      + 'years, not this season.' },

  { heading: 'Institutional Credibility', status: A.OBSERVED,
    finding: 'Every public claim in the volume is verifiable. The College is stated plainly to be '
      + 'unaccredited, in all three editions. No officer is quoted, no partnership named, no '
      + 'ranking claimed, and the conventional Foreword is absent rather than composed for people '
      + 'who do not hold office.',
    observation: 'The volume’s credibility now exceeds the platform’s in one respect: '
      + 'seven registers of internal findings exist because the institution has more open '
      + 'questions than a prospectus would admit. That is the right way round, and it means the '
      + 'Bible must be read alongside the book by anyone answering for it.' },

  { heading: 'Legal & Licensing Compliance', status: A.GOVERNANCE,
    finding: 'All eleven placed photographs are licensed, credited, and carry a resolvable licence '
      + 'reference; the credits table is checked against the images actually placed in each '
      + 'edition on every build. No typeface is used that is not present on the systems the volume '
      + 'is opened on. Nothing is traced, scraped or generated in imitation of a licensed work.',
    observation: 'ISBN, DOI and legal deposit are printed as "Not assigned" with the issuing '
      + 'authority named. Assigning them is an institutional act, not an editorial one, and no '
      + 'edition should be distributed commercially until they exist.' },

  { heading: 'Digital Companion Consistency', status: A.OBSERVED,
    finding: 'The editable edition now carries what the print edition carries: the six figures, '
      + 'the six graded plates, per-level colour identity, the cross-references, the glossary, the '
      + 'routes and the pronunciation strand. Faculty editing the curriculum had been the only '
      + 'readers unable to see the figure showing no competency mapping.',
    observation: 'THIS HEADING FAILED ITS FIRST AUDIT AND IS THE REASON THE AUDIT WAS WORTH '
      + 'RUNNING. The English site had been migrated to WEC Credits and Total Qualification Time; '
      + 'the Arabic site had not, and went on publishing the retired scheme in full — 720 learning '
      + 'units in the lede, in two stat rows, in the fee table and twice in the FAQ — together '
      + 'with per-unit pricing at $26.39, which the English pages had removed precisely because it '
      + 'ties a price to content that is 41% authored. The English fee table was separately wrong: '
      + 'its total row read 720 in a credits column whose own six rows read 20, and carried four '
      + 'cells where the header declares five, so the tuition total printed under the wrong '
      + 'heading. All corrected. The guard that should have caught it read only the English pages '
      + 'and never read the table as a table; it now does both.' },

  { heading: 'Long-term Maintainability', status: A.APPROVED,
    finding: 'Nothing in the volume is transcribed. Every count, figure, index, cross-reference '
      + 'and identity code is generated from the academic database at build time, so the book '
      + 'cannot drift from the curriculum without the build saying so. Three editions and a '
      + 'large-print variant come from one source. 49 test files stand behind it, and each of the '
      + 'defects found in this audit left a standing assertion behind rather than a fix alone.' },
];
