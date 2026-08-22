/**
 * WORLDWIDE ENGLISH COLLEGE PRESS — THE PUBLISHING CONSTITUTION.
 *
 * ────────────────────────────────────────────────────────────────────
 * WHAT THIS DOCUMENT IS, AND THE ONE THING THAT MAKES IT WORTH HAVING
 * ────────────────────────────────────────────────────────────────────
 * Publishing standards documents fail in a predictable way. They are
 * written once, at the moment of greatest enthusiasm, and they describe
 * a discipline nobody afterwards has any way of checking. Two years
 * later the house style says one thing and the books say another, and
 * the document is not wrong so much as irrelevant.
 *
 * So every clause here declares its own enforcement:
 *
 *   ENFORCED — a named test fails the build if this clause is broken.
 *     The clause is not advice; it is a property of the artefact.
 *   OBSERVED — the clause is followed and the following is visible in
 *     the source, but nothing would stop a future editor departing
 *     from it. Honest status for a rule that cannot be mechanised.
 *   ADOPTED — a policy decision that has been taken and applies, but
 *     has no artefact to check it against yet.
 *   FOR ADOPTION — drafted here, not yet decided by anyone with the
 *     standing to decide it. It binds nothing until it is.
 *
 * A constitution in which every clause is ENFORCED would be a lie about
 * what software can check. A constitution in which none is would be a
 * wish. The proportion is the interesting number, and it is printed on
 * the contents page rather than buried.
 *
 * ────────────────────────────────────────────────────────────────────
 * WHAT THIS DOCUMENT IS NOT
 * ────────────────────────────────────────────────────────────────────
 * It is not a claim that a publishing house exists. Worldwide English
 * College Press is an imprint name carried on one publication. It has
 * no staff, no ISBN prefix, no legal registration and no distribution
 * agreement, and § 1 says so in the first clause rather than the last.
 */

import { COLOURS, TYPE, LEVEL_PALETTES, BRAND } from './design.mjs';
import { contrast } from './colour.mjs';

/** How firmly a clause binds. */
export const FORCE = {
  ENFORCED: 'Enforced',
  OBSERVED: 'Observed',
  ADOPTED: 'Adopted',
  DRAFT: 'For adoption',
};

const F = FORCE;

/**
 * A clause. `by` names the test that enforces it — the clause is only
 * allowed to claim ENFORCED if it names one, and a test asserts that.
 */
const c = (force, rule, by) => ({ force, rule, by: by || null });

export const CONSTITUTIONS = [
  {
    n: 1,
    name: 'Institutional Publishing Constitution',
    purpose: 'What the Press is, and what it may say it is.',
    clauses: [
      c(F.ADOPTED, 'Worldwide English College Press is an imprint of Worldwide English College, '
        + 'London Campus. It has no separate legal personality, no appointed staff, no ISBN '
        + 'publisher prefix and no distribution agreement. No publication may imply otherwise.'),
      c(F.ENFORCED, 'No publication may state or imply that the College is accredited, recognised, '
        + 'validated or approved by any awarding body, government department or quality-assurance '
        + 'agency. Where the question could arise, the publication states plainly that it is not.',
      'tests/published-claims.test.mjs'),
      c(F.ENFORCED, 'No publication may print a figure the academic database does not support '
        + 'unless the same publication also states, in the same place, what is designed and what '
        + 'is delivered.', 'tests/published-claims.test.mjs'),
      c(F.ADOPTED, 'The Press publishes in English and in Arabic. A claim corrected in one '
        + 'language is corrected in every language in the same revision — not the next one.'),
      c(F.ENFORCED, 'Every language edition of a public claim is checked, not only the English.',
        'tests/published-claims.test.mjs'),
      c(F.DRAFT, 'An imprint page naming a publisher, a place of publication and a year is '
        + 'required for legal deposit in most jurisdictions. The Press states place and year and '
        + 'cannot state a registered publisher until one exists.'),
    ],
  },

  {
    n: 2,
    name: 'Editorial Constitution',
    purpose: 'What may be written, and by whom.',
    clauses: [
      c(F.ADOPTED, 'Curriculum is authored by qualified academics and is reproduced by the Press '
        + 'verbatim. The Press may organise, typeset, index and cross-reference it. The Press may '
        + 'not write it, extend it, summarise it in place of it, or improve its wording.'),
      c(F.ENFORCED, 'Every authored lesson body reaches the page in full. A parsing or layout '
        + 'change that silently drops curriculum fails the build.',
      'tests/curriculum-publication.test.mjs'),
      c(F.OBSERVED, 'Apparatus is extracted, never composed. An index entry, a cross-reference, a '
        + 'pull quote or a route must be derivable from text the curriculum already contains, and '
        + 'the derivation must be re-runnable by a reader.'),
      c(F.ENFORCED, 'A pull quote appears verbatim in the lesson it cites.',
        'tests/publication-apparatus.test.mjs'),
      c(F.OBSERVED, 'Where an apparatus cannot be built honestly, nothing is printed and the '
        + 'reason is printed instead. The absence of a grammar route is stated on the page it '
        + 'would have occupied.'),
      c(F.OBSERVED, 'A caption is a claim. Any sentence describing what a figure shows is written '
        + 'from the rendered figure, never from memory of the data — two captions have already '
        + 'been withdrawn for failing this.'),
    ],
  },

  {
    n: 3,
    name: 'Design Constitution',
    purpose: 'The house design, and what governs a departure from it.',
    clauses: [
      c(F.ADOPTED, 'One design system serves every publication of the Press. A new title inherits '
        + 'the type, colour, ornament and page architecture of the house; it does not receive a '
        + 'design of its own.'),
      c(F.OBSERVED, 'Restraint is the house manner. Ornament is permitted where it marks a '
        + 'structural event — a cover, a divider, a colophon — and nowhere else.'),
      c(F.ENFORCED, 'No element may exceed the page content box. A single over-wide element makes '
        + 'the engine shrink the entire document and every specified measurement becomes false.',
      'tests/publication-craft.test.mjs'),
      c(F.ENFORCED, 'The median printed page is substantially full, and few pages are left mostly '
        + 'empty. White space is a decision, and an unfinished page is not one.',
      'tests/publication-craft.test.mjs'),
      c(F.OBSERVED, 'A design decision that cannot survive the curriculum changing underneath it '
        + 'is not a design decision. Figures, indexes and counts are generated, never transcribed.'),
    ],
  },

  {
    n: 4,
    name: 'Typography Constitution',
    purpose: 'Two families, one measure, and a floor nothing goes below.',
    derived: () => ([
      ['Serif', TYPE.serif.split(',')[0]],
      ['Sans', TYPE.sans.split(',')[0]],
      ['Measure', TYPE.measure],
      ['Baseline', String(TYPE.baseline)],
      ['Body', `${TYPE.scale.body} pt`],
      ['Apparatus', `${TYPE.scale.apparatus} pt`],
      ['Smallest permitted', '5.5 pt'],
    ]),
    clauses: [
      c(F.ADOPTED, 'Two families and no more: a transitional serif for continuous reading, a '
        + 'humanist sans for apparatus. The distinction is functional — a reader scanning for a '
        + 'stage should find it by texture before reading a word.'),
      c(F.ADOPTED, 'Font stacks name only faces present on the systems the publication is opened '
        + 'on, with metric-compatible fallbacks in order. A flagship that renders in Times '
        + 'because a licensed face was assumed is not a flagship.'),
      c(F.ENFORCED, 'Nothing is set below 5.5 pt as printed. This includes type inside figures, '
        + 'which scales with its viewBox and is where every past violation has been.',
      'tests/publication-craft.test.mjs'),
      c(F.ENFORCED, 'Tracking and rule weights form small declared scales; sprawl is counted and '
        + 'fails.', 'tests/publication-craft.test.mjs'),
      c(F.ENFORCED, 'Runts are measured against the rendered width of the final word and held '
        + 'below a stated floor. The floor is not zero: hand-binding words in curriculum text is '
        + 'not the Press’s text to edit.', 'tests/publication-craft.test.mjs'),
      c(F.OBSERVED, 'Orphans and widows are set on body prose; a heading never breaks from what '
        + 'follows it; a table repeats its column headings on every page it continues onto.'),
    ],
  },

  {
    n: 5,
    name: 'Colour Constitution',
    purpose: 'Fourteen roles, six generated identities, one contrast floor.',
    derived: () => Object.entries(COLOURS).slice(0, 6).map(([k, v]) =>
      [k.replace(/([A-Z])/g, ' $1').replace(/^./, (m) => m.toUpperCase()), v.hex]),
    clauses: [
      c(F.ADOPTED, 'Every colour carries a stated role. A palette without roles is a mood board, '
        + 'and a designer picking prettily loses the argument by chapter three.'),
      c(F.ENFORCED, 'Every ink holds at least 4.5:1 against the paper it is specified on. Royal '
        + 'Gold reaches 2.82:1 on the text paper and may therefore never carry type there; Bronze '
        + 'is the reading-safe gold.', 'tests/publication.test.mjs'),
      c(F.ADOPTED, 'Level identities are generated in a perceptual space at fixed lightness and '
        + 'chroma so that only hue varies. Hand-picking six hexes produced a 2.24× luminance '
        + 'spread and an ascent that sagged in the middle.'),
      c(F.ADOPTED, 'Colour must survive production: distinguishable in greyscale, because a '
        + 'curriculum gets photocopied, and clear of the out-of-gamut blues that shift purple in '
        + 'CMYK.'),
      c(F.DRAFT, 'CMYK separation values are not yet specified. They require a press profile and '
        + 'a stock decision, and until a printer is appointed the Press publishes in sRGB and '
        + 'says so.'),
    ],
  },

  {
    n: 6,
    name: 'Photography Constitution',
    purpose: 'What a photograph is for, and what it may never imply.',
    clauses: [
      c(F.ADOPTED, 'Photography is editorial illustration. No photograph in any publication is a '
        + 'record of this College, its students or its premises, and none is captioned as though '
        + 'it were.'),
      c(F.ADOPTED, 'Every photograph must be fully Islamically appropriate, modest, respectful, '
        + 'professional, internationally credible and commercially licensed. An image failing any '
        + 'one of these is not used, and a spent licence is not a reason to use it.'),
      c(F.ADOPTED, 'One photographic direction per publication family. Images are graded to a '
        + 'duotone drawn from the colour system so that images by different photographers read as '
        + 'one commissioned series and belong to the design rather than sit on top of it.'),
      c(F.ENFORCED, 'Every placed photograph clears 300 dpi at its printed size.',
        'tests/publication-craft.test.mjs'),
      c(F.ENFORCED, 'Every placed photograph is credited with a resolvable licence reference, and '
        + 'the credits are counted against the images the edition actually places.',
      'tests/publication-craft.test.mjs'),
      c(F.ADOPTED, 'No publication ever prints the words "sample image" or "placeholder". An '
        + 'image is licensed and placed, or it is absent.'),
    ],
  },

  {
    n: 7,
    name: 'Illustration Constitution',
    purpose: 'Drawn, not licensed.',
    clauses: [
      c(F.ADOPTED, 'The ornamental language of the Press is computed rather than drawn: '
        + 'hypotrochoid guilloché, eight-fold girih construction, and a crest, border, corner '
        + 'and fleuron system generated from its own geometry at render time. Nothing is a stock '
        + 'asset, a traced image or a licensed illustration.'),
      c(F.ENFORCED, 'No drawn line falls below 0.25 pt, the practical floor for fine line-work on '
        + 'uncoated stock.', 'tests/publication-craft.test.mjs'),
      c(F.OBSERVED, 'Ornament is parametric. A curve that does not close, or a stroke that scales '
        + 'twice, is a defect and not a style.'),
    ],
  },

  {
    n: 8,
    name: 'Infographic Constitution',
    purpose: 'A figure that cannot become wrong was never saying anything.',
    clauses: [
      c(F.ADOPTED, 'Every figure is measured from the source data at build time. Bar lengths are '
        + 'proportional to counts; nothing is drawn to a shape that looked good and then labelled.'),
      c(F.ADOPTED, 'A figure with no variance to show is deleted, not redrawn. Two have been: one '
        + 'plotting six identical columns, one plotting four coincident flat lines under a caption '
        + 'the numbers contradicted.'),
      c(F.ENFORCED, 'No figure label is clipped by its own frame, and no two labels on the same '
        + 'line are printed through each other. SVG reports neither.',
      'tests/publication-craft.test.mjs'),
      c(F.OBSERVED, 'An unflattering measurement is printed as measured. The assessment map prints '
        + 'an empty competency column in every edition, including the one written for '
        + 'accreditation panels.'),
    ],
  },

  {
    n: 9,
    name: 'Iconography Constitution',
    purpose: 'One grid, one weight, one meaning per mark.',
    clauses: [
      c(F.ADOPTED, 'Every icon is drawn on one 24-unit grid at one stroke weight with round caps, '
        + 'and inherits its colour from its context rather than carrying one.'),
      c(F.OBSERVED, 'An icon is judged at its printed size, not at the size it was drawn. Five of '
        + 'the nineteen stage icons were redrawn after inspection at 13 px.'),
      c(F.OBSERVED, 'A row of identical marks is noise wearing the costume of information. The '
        + 'stage tape is suppressed unless the stages it summarises actually differ.'),
    ],
  },

  {
    n: 10,
    name: 'Accessibility Constitution',
    purpose: 'A publication nobody can read is not published.',
    clauses: [
      c(F.ADOPTED, 'Every PDF is tagged, carries a document language, and carries a navigable '
        + 'outline.'),
      c(F.ENFORCED, 'No heading level is skipped anywhere in any publication.',
        'tests/publication-craft.test.mjs'),
      c(F.ENFORCED, 'Every table declares header scope and carries header cells.',
        'tests/publication-craft.test.mjs'),
      c(F.OBSERVED, 'Every photograph carries descriptive alternative text; every decorative '
        + 'ornament is hidden from assistive technology; every figure carries a label.'),
      c(F.ADOPTED, 'A large-print variant is producible from the same source at any type scale, '
        + 'and is a build target rather than a separate design.'),
      c(F.DRAFT, 'PDF/UA conformance has not been validated by an external checker and reading '
        + 'order has not been tested with a screen reader. Both are checks not yet run, not '
        + 'defects found.'),
    ],
  },

  {
    n: 11,
    name: 'Print Production Constitution',
    purpose: 'What a printer receives.',
    clauses: [
      c(F.ENFORCED, 'The text block and the cover are separate files. A cover that is really page '
        + 'one of the text block is the clearest sign nobody involved has sent a book to press.',
      'tests/publication-craft.test.mjs'),
      c(F.ENFORCED, 'The spine is calculated from the bound extent at a stated caliper, per '
        + 'edition. A guessed spine is a cover that wraps.', 'tests/publication-craft.test.mjs'),
      c(F.ENFORCED, 'The cover carries bleed on all four edges.',
        'tests/publication-craft.test.mjs'),
      c(F.ENFORCED, 'A gutter allowance exists in the page setup, and margins are mirrored so the '
        + 'two text blocks of a spread sit symmetrically about the fold.',
      'tests/publication-craft.test.mjs'),
      c(F.ADOPTED, 'Creep compensation is documented rather than applied: it depends on the '
        + 'signature scheme the printer chooses.'),
      c(F.ADOPTED, 'No edition goes to a full run without a wet proof. Ink coverage, show-through '
        + 'and paper interaction are design intentions until a proof says otherwise.'),
    ],
  },

  {
    n: 12,
    name: 'Digital Publishing Constitution',
    purpose: 'The editable edition is not a lesser edition.',
    clauses: [
      c(F.ADOPTED, 'Every print publication has an editable companion carrying the same '
        + 'curriculum and the same apparatus. What the companion may lack is typographic set — '
        + 'drop caps, drawn ornament, chapter openers — never information.'),
      c(F.ENFORCED, 'No curriculum text is present in one edition and missing from another.',
        'tests/publication-editions.test.mjs'),
      c(F.OBSERVED, 'Figures are rasterised for the editable edition at a resolution above screen '
        + 'need, and photographs are graded through the print filter before embedding, so the '
        + 'companion belongs to the same series.'),
      c(F.ADOPTED, 'The digital companion and the public platform must agree. Where they cannot '
        + 'yet, the disagreement is recorded in the Bible, not resolved by editing whichever is '
        + 'easier to change.'),
    ],
  },

  {
    n: 13,
    name: 'Copyright Constitution',
    purpose: 'Who owns what, stated once.',
    clauses: [
      c(F.ADOPTED, 'Copyright in the curriculum and in the publication design vests in Worldwide '
        + 'English College. The imprint line, the year and the reservation of rights appear on '
        + 'the imprint page of every publication.'),
      c(F.ADOPTED, 'Licensed photography is licensed, not owned. It is credited by reference, and '
        + 'a licence permitting editorial use does not permit use as a record of the institution.'),
      c(F.DRAFT, 'A rights-and-permissions contact and a policy on third-party reproduction '
        + 'requests are required before any publication is distributed outside the College. '
        + 'Neither exists.'),
    ],
  },

  {
    n: 14,
    name: 'Licensing Constitution',
    purpose: 'Every asset traceable to its licence.',
    clauses: [
      c(F.ENFORCED, 'Every placed photograph carries a licence reference in the colophon, and no '
        + 'reference is reused for two images.', 'tests/publication-craft.test.mjs'),
      c(F.OBSERVED, 'A licence is recorded when it is acquired, not when the image is placed. '
        + 'Three references were once recoverable only from a session transcript, which is the '
        + 'state a rights query cannot be answered from.'),
      c(F.ADOPTED, 'Typefaces are used under the licences under which they ship with the systems '
        + 'the publication is opened on. No face is embedded that the Press has not the right to '
        + 'embed.'),
      c(F.DRAFT, 'ISBN, DOI and legal deposit are printed as "Not assigned" with the issuing '
        + 'authority named. No edition is distributed commercially until they exist.'),
    ],
  },

  {
    n: 15,
    name: 'Revision Constitution',
    purpose: 'How a publication changes without losing its identity.',
    clauses: [
      c(F.ADOPTED, 'Every publication carries an edition, revision, issue and impression code, a '
        + 'publication identifier and a content digest computed over the curriculum it contains. '
        + 'A change to the curriculum changes the digest.'),
      c(F.ADOPTED, 'A revision that changes what the curriculum says is a new edition. A revision '
        + 'that changes only how it is set is a new impression.'),
      c(F.DRAFT, 'From the second edition onward an edition history is required, stating what '
        + 'changed. There is no previous edition to record a change from, so nothing is printed '
        + 'and nothing is promised.'),
    ],
  },

  {
    n: 16,
    name: 'Translation Constitution',
    purpose: 'One claim, every language.',
    clauses: [
      c(F.ADOPTED, 'A translation is an edition, not a derivative. It carries the same claims, the '
        + 'same disclosures and the same corrections as the language it was translated from.'),
      c(F.ENFORCED, 'Every language edition of a public claim is checked. A guard that reads one '
        + 'language and reports on a bilingual publication is a reassurance, not a guard.',
      'tests/published-claims.test.mjs'),
      c(F.OBSERVED, 'A retired term is retired in every language in the same revision. The Arabic '
        + 'pages carried a superseded figure and a retired pricing basis for an entire revision '
        + 'cycle after the English pages had dropped both.'),
      c(F.DRAFT, 'Arabic typesetting of a full publication — right-to-left page architecture, '
        + 'mirrored gutters, an Arabic text face — has not been designed. The platform is '
        + 'bilingual; the books are not yet.'),
    ],
  },

  {
    n: 17,
    name: 'Quality Assurance Constitution',
    purpose: 'What is checked, and the standing suspicion of what is not.',
    clauses: [
      c(F.ADOPTED, 'Never trust an implementation because it passes its tests. Continuously verify '
        + 'that the tests measure the complete behaviour they claim to guarantee.'),
      c(F.OBSERVED, 'Every fix is confirmed by removing it and watching the test fail. A test that '
        + 'has never failed has never been shown to test anything.'),
      c(F.OBSERVED, 'Every check states what it does NOT measure, in the file, so that coverage is '
        + 'never inferred from a passing suite.'),
      c(F.ADOPTED, 'A defect found by looking rather than by measuring leaves a standing assertion '
        + 'behind, not only a fix.'),
    ],
  },

  {
    n: 18,
    name: 'Academic Integrity Constitution',
    purpose: 'The clause that outranks every other clause.',
    clauses: [
      c(F.ADOPTED, 'Never fabricate accreditation, partnerships, rankings, statistics, history, '
        + 'governance, staff, competencies, student outcomes or institutional achievements. Where '
        + 'a matter requires institutional approval it is recorded, never invented.'),
      c(F.ADOPTED, 'Where appearance and truth conflict, truth. Where decoration and learning '
        + 'conflict, learning. Where novelty and clarity conflict, clarity. Where quantity and '
        + 'craftsmanship conflict, craftsmanship.'),
      c(F.OBSERVED, 'An unflattering finding travels into every edition, including the executive '
        + 'volume written for accreditation panels. An edition that drops its unflattering '
        + 'figures is a prospectus, not an edition.'),
      c(F.ADOPTED, 'A finding filed as requiring academic authoring or governance may never be '
        + 'satisfied by writing plausible text. Moving a finding does not repeal it.'),
    ],
  },

  {
    n: 19,
    name: 'Editorial Review Constitution',
    purpose: 'Who reads before a publication is released.',
    clauses: [
      c(F.ADOPTED, 'No publication is released without a Final Publication Audit under standing '
        + 'headings, each concluding in one of four statuses. A board that approves everything has '
        + 'audited nothing.'),
      c(F.ADOPTED, 'A heading marked Requires Governance Decision blocks the claim it concerns, '
        + 'not the publication, provided the publication states the limitation.'),
      c(F.DRAFT, 'External academic review of the curriculum by a reader outside the College has '
        + 'not taken place. It is not an editorial matter and cannot be arranged from here.'),
    ],
  },

  {
    n: 20,
    name: 'Visual Review Constitution',
    purpose: 'Judged as printed, not as coded.',
    clauses: [
      c(F.ADOPTED, 'A publication is reviewed as spreads, from rasterised pages, not from source. '
        + 'Four defects in the current edition were invisible in the HTML and obvious on the page.'),
      c(F.OBSERVED, 'A figure is inspected at its printed size before it is approved.'),
      c(F.DRAFT, 'Review against a physical proof on the specified stock has not taken place for '
        + 'any publication of the Press.'),
    ],
  },

  {
    n: 21,
    name: 'Production Workflow',
    purpose: 'The order things happen in, and why that order.',
    clauses: [
      c(F.ADOPTED, 'The curriculum is built from the academic database, never transcribed. Text '
        + 'block first, then page count, then spine, then cover: the cover cannot be produced '
        + 'before the extent is known.'),
      c(F.ADOPTED, 'Photographs are resampled to the size they are actually printed at before '
        + 'placement, and the untouched originals are preserved outside version control.'),
      c(F.ADOPTED, 'Figures are rasterised for the editable edition from the same source that sets '
        + 'them in print, in the same run, so the two cannot diverge.'),
      c(F.OBSERVED, 'Every artefact is regenerated from source on every build. No file in the '
        + 'publication directory is hand-edited.'),
    ],
  },

  {
    n: 22,
    name: 'Version Control Policy',
    purpose: 'What is kept, and what is rebuilt.',
    clauses: [
      c(F.ADOPTED, 'Source is committed. Artefacts are committed when they are the deliverable and '
        + 'genuinely distinct. A near-duplicate of a file already in the history is built on '
        + 'demand by a named script rather than stored again.'),
      c(F.ADOPTED, 'Licensed originals are preserved outside version control and their licence '
        + 'references are held in source.'),
      c(F.OBSERVED, 'A generated public page is never edited in place; the source page is edited '
        + 'and the site rebuilt, and the build fails if the two disagree.'),
    ],
  },

  {
    n: 23,
    name: 'Publication Governance',
    purpose: 'Who may decide what.',
    clauses: [
      c(F.ADOPTED, 'Within editorial authority — design, typography, colour, layout, illustration, '
        + 'photography, navigation, book architecture, information design, print preparation, '
        + 'reader experience — the Press acts without seeking approval.'),
      c(F.ADOPTED, 'Outside it — accreditation, competency frameworks, academic authoring, legal '
        + 'registration, external licensing, government recognition, physical proofing — the Press '
        + 'records and escalates, and publishes the limitation rather than working around it.'),
      c(F.ADOPTED, 'The Internal Editorial Bible is the register of everything escalated. It is '
        + 'marked internal on every page and is not a public document.'),
      c(F.DRAFT, 'No officer of the Press has been appointed. Until one is, no publication carries '
        + 'a signed foreword, a named editor or a message from a head of institution, because the '
        + 'Press does not compose words for people who do not hold office.'),
    ],
  },
];

/** Every clause, flat, for counting and for the tests. */
export const CLAUSES = CONSTITUTIONS.flatMap((s) =>
  s.clauses.map((cl) => ({ ...cl, section: s.n, sectionName: s.name })));

export const forceCount = (f) => CLAUSES.filter((cl) => cl.force === f).length;

/**
 * The contrast evidence the Colour Constitution rests on, recomputed
 * rather than restated, so the clause cannot outlive the palette.
 */
export function contrastEvidence() {
  const paper = BRAND.paper;
  return [
    ['Royal Blue on text paper', COLOURS.royalBlue.hex, paper],
    ['Warm Charcoal on text paper', COLOURS.warmCharcoal.hex, paper],
    ['Bronze on text paper', COLOURS.bronze.hex, paper],
    ['Royal Gold on text paper', COLOURS.royalGold.hex, paper],
    ...LEVEL_PALETTES.slice(0, 2).map((p) => [`Level ${p.key} ink on its wash`, p.ink, p.wash]),
  ].map(([label, fg, bg]) => ({
    label, fg, bg, ratio: Math.round(contrast(fg, bg) * 100) / 100,
  }));
}
