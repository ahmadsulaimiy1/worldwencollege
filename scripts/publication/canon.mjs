/**
 * THE WORLDWIDE ENGLISH COLLEGE CANON.
 *
 * ────────────────────────────────────────────────────────────────────
 * THE DIFFERENCE BETWEEN A CATALOGUE AND A CANON
 * ────────────────────────────────────────────────────────────────────
 * The catalogue answers "what could we publish, and what stops us?"
 * The canon answers a harder question: "when a student enrols, is
 * everything they need already here, and does it hang together?"
 *
 * A catalogue can be a good list of unrelated books. A canon cannot.
 * Every title in it has a place — before something, alongside
 * something, ahead of something — and a library where a reader has to
 * guess what to open next is a shelf, not a canon.
 *
 * So this file adds three things the catalogue does not have:
 *
 *   DIVISIONS — five, by who the library is for, not by what produced
 *     it. A learner should be able to be told "Division I is yours".
 *   RELATIONSHIPS — for every title: read before, read alongside, read
 *     after. Declared, and checked to resolve.
 *   THE DUPLICATION REGISTER — the rule that a book may not repeat
 *     another, applied to the canon slate itself.
 *
 * ────────────────────────────────────────────────────────────────────
 * WHAT THE DUPLICATION RULE FOUND, AND WHY IT IS PRINTED
 * ────────────────────────────────────────────────────────────────────
 * The canon was specified as fifty-one titles. Eleven of them are not
 * separate books. A Marking Guide and a Rubric Handbook and an
 * Assessment Handbook are one book with three names; a Teacher's Guide
 * and a Teaching Strategies Handbook are the teaching handbook already
 * catalogued; Brand Standards and Design Standards are two chapters of
 * documents that exist.
 *
 * The instruction was explicit: justify, reference, or remove. Each of
 * the eleven is resolved one of those three ways, in the open, with the
 * reason attached — because the alternative is a library that looks
 * larger than it is, which is the failure mode a canon exists to
 * prevent. A press that publishes the same rubric three times under
 * three titles has not published three books.
 *
 * ────────────────────────────────────────────────────────────────────
 * THE RANKING
 * ────────────────────────────────────────────────────────────────────
 * The derivable titles are ranked by educational impact and not by
 * convenience, which was the instruction and is also the harder
 * discipline: the easiest book to produce next is almost never the one
 * that most improves teaching. The criteria are declared, each title is
 * scored against them with a reason, and the order falls out of the
 * arithmetic rather than out of preference.
 */
import { TITLES, STATUS, inventory, catalogue } from './catalogue.mjs';
import { MATURITY, ecosystem } from './legacy.mjs';

// ─────────────────────────────────────────────────────────────────────
// 1 · THE FIVE DIVISIONS
// ─────────────────────────────────────────────────────────────────────

export const DIVISIONS = [
  { n: 'I', key: 'student', name: 'Student Learning Library',
    purpose: 'Everything an enrolled learner needs, from the coursebook they open on day one '
      + 'to the guide they revise from.',
    reader: 'The learner' },
  { n: 'II', key: 'teacher', name: 'Teacher Library',
    purpose: 'Everything required to plan, teach, assess and mark the programme.',
    reader: 'The teacher' },
  { n: 'III', key: 'reference', name: 'Academic Reference Library',
    purpose: 'The architecture of the qualification, for anyone who has to judge it rather '
      + 'than study it.',
    reader: 'The examiner, the reviewer, the partner institution' },
  { n: 'IV', key: 'institutional', name: 'Institutional Library',
    purpose: 'How the College governs, publishes and accounts for itself.',
    reader: 'The institution, and whoever inherits it' },
  { n: 'V', key: 'graduate', name: 'Graduate & Professional Library',
    purpose: 'What a learner needs after the programme, and what a professional needs beside '
      + 'it.',
    reader: 'The graduate, the employer, the practising professional' },
];

// ─────────────────────────────────────────────────────────────────────
// 2 · THE SLATE
// ─────────────────────────────────────────────────────────────────────

/**
 * One entry per requested canon title. `n` maps to the catalogue; a
 * slot with no `n` is one the duplication register resolved, and it
 * still appears — a canon that silently drops what it was asked for is
 * answering a different question from the one it was asked.
 *
 * `before` / `with` / `after` are catalogue numbers. A learner should
 * never have to wonder what comes next, and these are what answer it.
 */
const s = (division, slot, n, before, wth, after) =>
  ({ division, slot, n: n || null, before: before || [], with: wth || [], after: after || [] });

export const SLATE = [
  // ── Division I · Student Learning Library ─────────────────────────
  s('I', 'Student Coursebook', 2, [], [6, 7, 12], [48]),
  s('I', 'Student Workbook', 6, [2], [2, 7], [47]),
  s('I', 'Listening Scripts', 10, [2], [12, 11], [11]),
  s('I', 'Pronunciation Handbook', 12, [2], [10, 14], [14]),
  s('I', 'Vocabulary Builder', 7, [2], [6, 20], [20]),
  s('I', 'Grammar Companion', 13, [2], [6, 44], [44]),
  s('I', 'Writing Companion', 44, [2, 13], [45], [45]),
  s('I', 'Reading Companion', 15, [2], [7, 44], [45]),
  s('I', 'Speaking Companion', 14, [2], [12, 10], [46]),
  s('I', 'Academic English Handbook', 45, [44], [15, 21], [61]),
  s('I', 'Professional English Handbook', 46, [2], [14], [58]),
  s('I', 'Revision Guide', 47, [2, 6], [21], [48]),
  s('I', 'Examination Guide', 48, [2, 47], [21], [58]),
  s('I', 'Digital Learning Companion', 40, [2], [39, 21], [39]),

  // ── Division II · Teacher Library ─────────────────────────────────
  s('II', 'Teacher’s Edition', 1, [], [49, 50, 8], [17]),
  s('II', 'Teacher’s Guide', null),
  s('II', 'Lesson Planning Manual', 49, [1], [50, 21], [17]),
  s('II', 'Assessment Handbook', 8, [1], [18, 48], [18]),
  s('II', 'Marking Guide', null),
  s('II', 'Rubric Handbook', null),
  s('II', 'Classroom Activities Handbook', 50, [1], [49, 14], [17]),
  s('II', 'Teaching Strategies Handbook', null),
  s('II', 'Professional Development Handbook', 51, [17], [18], []),

  // ── Division III · Academic Reference Library ─────────────────────
  s('III', 'Academic Framework', 23, [3], [22, 52], [25]),
  s('III', 'Curriculum Framework', 52, [3], [23, 21], [23]),
  s('III', 'Competency Framework', null),
  s('III', 'Assessment Framework', null),
  s('III', 'Award Architecture', 22, [3], [23], [58]),
  s('III', 'Academic Regulations', 25, [23], [55, 56], [53]),
  s('III', 'Quality Assurance Manual', 53, [25], [23, 8], []),
  s('III', 'Academic Standards Manual', null),
  s('III', 'Academic Calendar', 54, [], [25], []),
  s('III', 'Academic Glossary', 20, [2], [7, 21], []),

  // ── Division IV · Institutional Library ───────────────────────────
  s('IV', 'Publishing Constitution', 28, [], [29, 30], [29]),
  s('IV', 'Editorial Bible', 30, [28], [29], []),
  s('IV', 'Brand Standards', null),
  s('IV', 'Design Standards', null),
  s('IV', 'Production Standards', 29, [28], [30], []),
  s('IV', 'Governance Manual', 55, [25], [56], [57]),
  s('IV', 'Institutional Policies', 56, [55], [25], []),
  s('IV', 'Strategic Plan', 57, [55], [26], [26]),
  s('IV', 'Annual Report', 26, [57], [27], []),
  s('IV', 'Research Reports', 38, [], [36], [36]),
  s('IV', 'The Canon Index', 62, [28], [28, 30], []),

  // ── Division V · Graduate & Professional Library ──────────────────
  s('V', 'Graduate Handbook', 58, [48], [22], [27]),
  s('V', 'Alumni Handbook', 27, [58], [], []),
  s('V', 'Career Guide', 59, [58], [46], []),
  s('V', 'Professional Communication Guide', null),
  s('V', 'Executive English Manual', 32, [46], [60], []),
  s('V', 'CPD Handbook', 51, [17], [18], []),
  s('V', 'Leadership Handbook', 60, [46], [32], []),
  s('V', 'Research Handbook', 61, [45], [38], [38]),
  // ── Placed by the canon rather than requested by it ───────────────
  // The directive says no publication may exist in isolation. Twenty
  // catalogue titles were not on the requested slate; leaving them
  // unplaced would have obeyed the letter of the list and broken the
  // rule it exists to serve.
  s('I', 'Student Coursebook — Large Print Edition', 4, [2], [2], []),
  s('I', 'Student Coursebook — Arabic Edition', 42, [], [2], []),
  s('I', 'The IEFC Digital Edition', 39, [2], [40], [40]),
  s('I', 'The IEFC Listening Programme', 11, [10], [10, 12], []),
  s('I', 'Examination Papers and Model Answers', 9, [48], [8], []),
  // The one title with no companion volume, and the relationship that
  // is true of it: nothing may be published for children until the
  // regulations and policies that govern admitting them are changed.
  s('I', 'English for Young Learners', 33, [25, 56], [], []),
  s('II', 'Teacher’s Edition — Editable', 5, [1], [1], []),
  s('II', 'Teaching the IEFC', 17, [1, 49], [50, 18], [51]),
  s('II', 'Assessment Literacy for Teachers', 18, [8], [8], [51]),
  s('III', 'Programme Architecture — Institutional Edition', 3, [], [23, 22], [52]),
  s('III', 'The IEFC Flagship Document', 43, [], [3], [23]),
  s('III', 'The IEFC Companion', 21, [1], [49, 20], [52]),
  s('IV', 'The Prospectus', 24, [], [3, 22], [2]),
  s('IV', 'The Staff Induction Manual', 19, [55], [1, 17], []),
  s('IV', 'The Presentation Edition', 41, [1], [29], []),
  s('IV', 'The WEC Journal of English Language Education', 36, [38], [37], [37]),
  s('IV', 'Conference Proceedings', 37, [36], [38], []),
  s('V', 'English for Business', 31, [46], [32], []),
  s('V', 'English for Academic Purposes', 34, [45], [45], [61]),
  s('V', 'In-Company Training Materials', 35, [46], [31], []),
];

// ─────────────────────────────────────────────────────────────────────
// 3 · THE DUPLICATION REGISTER
// ─────────────────────────────────────────────────────────────────────

export const RESOLUTION = {
  JUSTIFY: 'Justified',
  REFERENCE: 'Referenced',
  REMOVE: 'Removed',
};

/**
 * Every overlap the canon slate contains, and how it was resolved. The
 * rule allows three outcomes and this register uses all three, because
 * a register that only ever justifies is a register that has decided
 * nothing.
 */
export const DUPLICATIONS = [
  { slot: 'Teacher’s Guide', resolution: RESOLUTION.REMOVE, into: [1, 17],
    why: 'The Teacher’s Edition already opens with a guide to using the book, and Teaching the '
      + 'IEFC is the handbook on teaching it. A third volume between them would be the same '
      + 'advice at a third length, and a teacher would have to guess which to open.' },
  { slot: 'Marking Guide', resolution: RESOLUTION.REFERENCE, into: [8],
    why: 'Marking standards are a part of the Assessment Handbook, not a book. Splitting them '
      + 'out would put the criteria in one volume and the assessments they mark in another, '
      + 'which is exactly the arrangement that produces inconsistent marking.' },
  { slot: 'Rubric Handbook', resolution: RESOLUTION.REFERENCE, into: [8],
    why: 'The sixty rubrics and their 307 criteria are printed in the Assessment Handbook '
      + 'beside the assignments they mark. A standalone rubric volume would be the same text '
      + 'without its context.' },
  { slot: 'Teaching Strategies Handbook', resolution: RESOLUTION.REMOVE, into: [17],
    why: 'Indistinguishable from Teaching the IEFC, which is already catalogued and already '
      + 'requires authoring. Two titles for one unwritten book would double the apparent size '
      + 'of the gap and halve the chance of either being written.' },
  { slot: 'Competency Framework', resolution: RESOLUTION.REFERENCE, into: [23],
    why: 'The six competencies with their descriptors and thresholds are the substance of the '
      + 'Academic Framework. Published alone they would state a framework whose mapping to '
      + 'assessment is empty, without the volume that says so.' },
  { slot: 'Assessment Framework', resolution: RESOLUTION.REFERENCE, into: [23, 8],
    why: 'The design of assessment belongs to the Academic Framework; its operation belongs to '
      + 'the Assessment Handbook. There is no third thing left for a separate volume to say.' },
  { slot: 'Academic Standards Manual', resolution: RESOLUTION.REFERENCE, into: [23, 25],
    why: 'Standards are declared by the framework and enforced by the regulations. A manual '
      + 'restating both would be a third statement of the same standards, and the first time '
      + 'the three disagreed nobody would know which governed.' },
  { slot: 'Brand Standards', resolution: RESOLUTION.REFERENCE, into: [29, 28],
    why: 'The brand style guide is a chapter of the Production Specifications and the house '
      + 'identity is Part Three of the Publishing Constitution. Both are measured against the '
      + 'live design system; a third document would be the only one that could drift.' },
  { slot: 'Design Standards', resolution: RESOLUTION.REFERENCE, into: [28, 29],
    why: 'Identical in substance to Brand Standards, and resolved the same way for the same '
      + 'reason.' },
  { slot: 'Professional Communication Guide', resolution: RESOLUTION.REMOVE, into: [46],
    why: 'The Professional English Handbook is this book. Two titles over five workplace '
      + 'modules would have to repeat all five.' },
  { slot: 'Academic Writing in the IEFC', resolution: RESOLUTION.REMOVE, into: [44],
    why: 'Previously catalogued as its own title covering Levels IV to VI. Folded into the '
      + 'Writing Companion, which covers all six levels: two books drawn from one strand would '
      + 'have repeated the senior half word for word. This is the only resolution that removed '
      + 'a title the Press had already catalogued rather than one it had been asked for.' },
];

// ─────────────────────────────────────────────────────────────────────
// 4 · EDUCATIONAL IMPACT
// ─────────────────────────────────────────────────────────────────────

/**
 * The ranking criteria, declared before the scores so that the order is
 * an argument rather than a preference. Weighted, because they are not
 * equally important: a book that lets teaching happen which currently
 * cannot is worth more than a book that makes existing teaching tidier.
 */
export const CRITERIA = [
  { key: 'reach', weight: 3, name: 'Who it reaches',
    scale: '5 = every learner and teacher on the programme · 1 = a small subset' },
  { key: 'frequency', weight: 3, name: 'How often it is opened',
    scale: '5 = in every session · 1 = once a year' },
  { key: 'unblocks', weight: 4, name: 'What it makes possible',
    scale: '5 = teaching or learning that currently cannot happen at all · '
      + '1 = a convenience' },
  { key: 'invisible', weight: 2, name: 'How hidden the material is now',
    scale: '5 = exists but can only be reached by opening lessons one at a time · '
      + '1 = already published in another form' },
];

/**
 * Scores, with a reason for each. The reason is the part that matters:
 * a number without one is a preference wearing a jacket.
 */
const R = (n, reach, frequency, unblocks, invisible, why) =>
  ({ n, reach, frequency, unblocks, invisible, why });

export const IMPACT = [
  R(6, 5, 5, 4, 4, 'Every learner, every week. The practice a learner does alone is currently '
    + 'buried inside a 443-page teacher’s book; a workbook is the difference between homework '
    + 'being set and homework being done.'),
  R(8, 4, 5, 5, 3, 'Marking cannot be consistent while sixty rubrics live in sixty places. '
    + 'This is the volume that makes moderation possible, and moderation is what makes an '
    + 'award mean anything.'),
  R(10, 3, 5, 5, 5, 'A hundred and twenty scripts with speaker cues, invisible in a database '
    + 'since the audio platform was built. Without them a teacher cannot run a listening '
    + 'lesson at all, because there are no recordings.'),
  R(50, 4, 5, 3, 5, 'Four hundred and thirty activities a teacher can currently only find by '
    + 'reading the lesson they are in. The material is complete and completely unreachable.'),
  R(49, 4, 5, 3, 4, 'Planning is the daily act of teaching. The stage structure and designed '
    + 'timings exist for all 114 lessons and have never been arranged for the person planning '
    + 'a week.'),
  R(48, 5, 3, 4, 3, 'A candidate is entitled to know how they are marked before they are '
    + 'marked. At present the criteria exist only in the teacher’s book.'),
  R(7, 5, 4, 3, 3, 'Vocabulary is the strand learners ask for most and the one most scattered '
    + '— 276 stages across 168 items, with the recycling invisible.'),
  R(13, 4, 4, 3, 3, 'A grammar reference keyed to the lessons that teach it. Useful daily, but '
    + 'grammar is the strand learners can most easily supplement elsewhere.'),
  R(44, 4, 4, 3, 3, 'Writing is assessed in every level and taught in every lesson; the strand '
    + 'has never been gathered.'),
  R(47, 4, 3, 3, 4, 'Revision is the one thing every learner does alone and unsupervised, and '
    + 'the material for it is the last stage of 114 separate lessons. Became derivable when the '
    + 'first lesson of the programme was given the revision stage it had never had. The volume '
    + 'gathers the strand rather than creating it, which is why it ranks below the workbook.'),
  R(45, 3, 3, 4, 3, 'For learners entering English-medium study, the difference between passing '
    + 'and coping. Reaches fewer people than the coursebook strands.'),
  R(2, 5, 5, 2, 1, 'Already published. Listed for completeness: it is the spine of the '
    + 'division and everything else in Division I refers to it.'),
  R(20, 3, 3, 2, 2, 'Fifty headwords defined in the sense the curriculum uses. Genuinely '
    + 'useful, rarely urgent.'),
  R(21, 3, 3, 3, 4, 'The cross-reference graph and revision routes, already extracted for the '
    + 'flagship and printed inside it. A separate volume mostly helps planners.'),
  R(52, 2, 2, 3, 3, 'Read by reviewers and curriculum designers rather than by learners; '
    + 'important when it is needed, and needed rarely.'),
  R(58, 2, 1, 4, 3, 'Read once, by every graduate, at the moment the award has to mean '
    + 'something to an employer. Low frequency, high consequence.'),
  R(40, 4, 4, 2, 2, 'The platform already serves this material; the companion improves access '
    + 'rather than creating it.'),
  R(39, 3, 3, 2, 2, 'A reflowable edition of a book that already exists and is already tagged.'),
  R(24, 2, 1, 2, 2, 'Read before enrolment, once. Real value, but it does not improve teaching '
    + 'or learning for anyone already here.'),
  R(14, 3, 4, 3, 3, 'Speaking is the skill learners most want and the strand that thins as the '
    + 'levels rise — 19 lessons at Level I, 10 at Level VI. The volume would make that shape '
    + 'visible, which is worth doing and is not the same as fixing it.'),
  R(22, 2, 1, 3, 2, 'Read by employers and partner institutions verifying an award, and by '
    + 'nobody during teaching. High consequence at a single moment, low frequency.'),
];

const weighted = (r) => CRITERIA.reduce((n, c) => n + c.weight * (r[c.key] || 0), 0);
export const MAX_SCORE = CRITERIA.reduce((n, c) => n + c.weight * 5, 0);

/**
 * The publishing order. Derivable titles only — a ranking that included
 * books nobody can produce would be a wish list with numbers on it.
 */
export function ranking(rows = catalogue()) {
  const derivable = rows.filter((r) => r.status === STATUS.DERIVABLE);
  return derivable.map((r) => {
    const scored = IMPACT.find((i) => i.n === r.n);
    return {
      ...r,
      score: scored ? weighted(scored) : null,
      scores: scored || null,
      why: scored ? scored.why : 'Not yet scored.',
    };
  }).sort((a, b) => (b.score ?? -1) - (a.score ?? -1)
    // Declared tie-break, so a tie is not resolved by array order: the
    // title that unblocks more goes first, then the one that reaches
    // more people. The Workbook and the Listening Scripts both score
    // 54; the scripts unblock lessons that cannot currently run at all,
    // and the workbook improves lessons that can.
    || (b.scores?.unblocks ?? 0) - (a.scores?.unblocks ?? 0)
    || (b.scores?.reach ?? 0) - (a.scores?.reach ?? 0));
}

// ─────────────────────────────────────────────────────────────────────
// 5 · THE CANON INDEX
// ─────────────────────────────────────────────────────────────────────

/**
 * The living index: one row per canon slot, with everything the G10
 * directive requires recorded — and every field either measured or
 * resolved, never typed twice.
 */
export function canonIndex(INV = inventory()) {
  const eco = ecosystem(INV);
  const byN = new Map(eco.map((r) => [r.n, r]));
  const name = (n) => (byN.get(n) ? byN.get(n).name : `#${n}`);

  return SLATE.map((slot) => {
    const dup = DUPLICATIONS.find((d) => d.slot === slot.slot);
    const row = slot.n ? byN.get(slot.n) : null;
    return {
      division: slot.division,
      slot: slot.slot,
      n: slot.n,
      title: row ? row.name : slot.slot,
      edition: row ? row.edition : null,
      family: row && row.family ? row.family.key : null,
      audience: row ? row.audience : null,
      status: row ? row.status : null,
      maturity: row ? row.maturity : MATURITY.CONCEPT,
      derivedFrom: row ? row.source : null,
      artefact: row ? row.artefact : null,
      before: slot.before.map((n) => ({ n, name: name(n) })),
      alongside: slot.with.map((n) => ({ n, name: name(n) })),
      after: slot.after.map((n) => ({ n, name: name(n) })),
      duplication: dup || null,
      shortfall: row ? row.short : [],
      governance: row ? row.governance : null,
    };
  });
}

export const divisionOf = (n) => {
  const slot = SLATE.find((x) => x.n === n);
  return slot ? DIVISIONS.find((d) => d.n === slot.division) : null;
};

/** Catalogue titles the canon does not place. Reported, not hidden. */
export function unplaced(rows = TITLES) {
  const placed = new Set(SLATE.map((x) => x.n).filter(Boolean));
  return rows.filter((t) => !placed.has(t.n));
}
