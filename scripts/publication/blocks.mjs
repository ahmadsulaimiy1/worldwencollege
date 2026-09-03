/**
 * The publication's content, as a renderer-independent block list.
 *
 * ────────────────────────────────────────────────────────────────────
 * WHY THIS FILE EXISTS
 * ────────────────────────────────────────────────────────────────────
 * The brief requires the DOCX and the PDF to be generated from ONE
 * canonical source and to match perfectly. The cleanest way to guarantee
 * that is to render the PDF from the DOCX — but LibreOffice cannot load
 * any document in this environment (it fails on a one-line plain text
 * file, so it is not a fault in ours), which leaves two renderers.
 *
 * Two renderers reading two content definitions would be two chances to
 * diverge. So the content lives HERE, once, as a list of typed blocks,
 * and both renderers consume it. Neither renderer decides what the
 * publication says; they decide only how it looks.
 *
 * tests/publication.test.mjs then extracts the text from both artefacts
 * and compares them token by token, so parity is demonstrated rather
 * than argued for.
 */
import { build } from './canonical.mjs';
import { editionMark, rightsBlocks } from './rights.mjs';

const d = build();

// This publication's edition mark. Derived from the institutional record
// this block list is built from, so it moves when the content moves — the
// property that makes it worth printing on every page.
const MARK = editionMark('iefc-reference', d.generatedFrom || 'canonical');

const STATE_WORD = {
  evidenced: 'Evidenced', partial: 'Partial',
  not_evidenced: 'Not evidenced', governance_pending: 'Governance pending',
};
const STATE_TONE = { evidenced: 'ok', partial: 'warn', not_evidenced: 'gap', governance_pending: 'warn' };

// Block constructors. `kind` is all a renderer needs to switch on.
const t = (kind, o) => ({ kind, ...o });
export const B = {
  halfTitle: (text) => t('halfTitle', { text }),
  title: (o) => t('title', o),
  h1: (text, o = {}) => t('h1', { text, ...o }),
  h2: (text) => t('h2', { text }),
  h3: (text) => t('h3', { text }),
  label: (text) => t('label', { text }),
  p: (text, o = {}) => t('p', { text, ...o }),
  lead: (text) => t('p', { text, lead: true }),
  small: (text) => t('p', { text, small: true }),
  rule: () => t('rule', {}),
  bullets: (items) => t('bullets', { items }),
  table: (headers, rows, widths) => t('table', { headers, rows, widths }),
  panel: (title, lines, tone = 'neutral') => t('panel', { title, lines, tone }),
  state: (text, tone) => t('state', { text, tone }),
  toc: () => t('toc', {}),
  pageBreak: () => t('pageBreak', {}),
};

// ======================================================================
export const FRONT = [
  B.halfTitle('The International English Fluency Certificate'),
  B.pageBreak(),
  B.title({
    institution: 'Worldwide English College',
    campus: 'London Campus',
    lines: ['The International', 'English Fluency', 'Certificate'],
    subtitle: 'The Curriculum, Award Architecture and Academic Framework',
    edition: 'First Edition',
    editionNote: 'Reference Edition',
    press: 'Worldwide English College Press',
  }),
  B.pageBreak(),

  B.h1('Publication Information', { noBreak: true }),
  B.rule(),
  B.p('The International English Fluency Certificate', { bold: true }),
  B.p('The Curriculum, Award Architecture and Academic Framework', { italic: true }),
  B.p('First edition, reference edition.'),
  B.p('Published by Worldwide English College Press, London Campus.'),
  B.p('© Worldwide English College. All rights reserved except as granted on the Rights and '
    + 'Permissions page that follows.'),
  B.small('ISBN [to be assigned]  ·  DOI [not registered]'),
  B.small(`Edition mark ${MARK} — printed in the foot of every page. See Rights and Permissions.`),
  B.panel('A note on this edition', [
    'This edition is generated directly from the College\'s academic database and its approved '
    + 'institutional documents. Every figure in it is counted from that source at the moment of '
    + 'generation rather than transcribed by hand, and the generator refuses to publish a figure it '
    + 'cannot count.',
    'The College is not an accredited institution and this publication makes no claim of '
    + 'accreditation, recognition, or external approval. Where the College cannot yet evidence '
    + 'something it states, the shortfall is named in the text rather than omitted.',
  ]),
  B.small(`Generated from: ${d.generatedFrom}`),
  B.pageBreak(),

  // The rights instrument, on the recto after the imprint — the place a
  // reader looks for it, and the place its absence was noticed. See
  // rights.mjs for why a stated licence is the protection and a lock is
  // not.
  ...rightsBlocks(B, {
    title: 'The International English Fluency Certificate',
    mark: MARK,
  }),

  B.h1('Contents', { noBreak: true }),
  B.rule(),
  B.toc(),
  B.pageBreak(),

  B.h1('Editorial Note', { noBreak: true }),
  B.rule(),
  B.lead('This publication was prepared to the standards of a scholarly reference edition. Its '
    + 'governing rule is the one stated in the commissioning directive: where a claim cannot be '
    + 'supported, it is qualified or omitted rather than overstated.'),
  B.p('Three consequences of that rule are visible in the pages that follow, and are stated here so '
    + 'that a reader does not have to infer them.'),

  B.label('One — Sections that would require inventing people'),
  B.p('A publication of this kind conventionally opens with a Foreword, a Presidential Message and a '
    + 'message from the Academic Senate. Those are signed statements by named officers. Worldwide '
    + 'English College has no appointed President, and its Academic Senate and its '
    + 'Board of Academic '
    + 'Standards and Curriculum Excellence are established but not yet constituted — no members have '
    + 'been appointed to either. Composing those sections would mean writing the words of officers '
    + 'who do not exist. They are omitted. The institutional voice in this edition is the College\'s '
    + 'own, unsigned, and it does not pretend otherwise.'),

  B.label('Two — The extent of the curriculum'),
  B.p(`The College's public materials state ${d.totals.publishedUnitsPerLevel} learning units per `
    + `level, which would be ${d.totals.publishedUnitsTotal} across the qualification. The academic `
    + `database holds ${d.totals.learningItems} authored learning items, approximately `
    + `${d.totals.itemsPerLevel} per level. Both figures are counted, not estimated.`),
  B.p(`What is complete is the module structure: ${d.totals.modules} modules, ten at every one of the `
    + `six levels, each with an assessed assignment and an assessed quiz. What is in progress is `
    + `lesson-level depth within those modules. This edition presents the module architecture in `
    + `full and describes lesson-level content as it stands. It does not repeat the `
    + `${d.totals.publishedUnitsTotal} figure, which the College cannot presently evidence.`),

  B.label('Three — What the qualification claims about itself'),
  B.p('The College\'s definition of the IEFC asserts seven things. Six are evidenced by the platform '
    + 'today and one is not. Rather than soften the definition or bury the gap, both are printed '
    + 'together in the chapter that follows, with the evidence for each element and the shortfall '
    + 'where there is one.'),
  B.panel('On generated editions', [
    'Because this edition is generated from the academic database, it is a snapshot. Every count in '
    + 'it was true at the moment of generation and will change as the curriculum grows. A reader '
    + 'comparing this edition against the College\'s live systems should expect the systems to be '
    + 'ahead of the page, never behind it.',
  ]),
];

// ======================================================================
export const BODY = [
  B.h1('About Worldwide English College'),
  B.rule(),
  B.lead('Worldwide English College — London Campus, is an online institution teaching English as an '
    + 'international language. It confers its own awards, maintains its own Graduate Register, and '
    + 'publishes the architecture of its qualification so that the awards can be read and checked by '
    + 'people who have never met the College.'),
  B.p('The College is not accredited by any external body, and makes no claim to be. Its academic '
    + 'architecture is built so that accreditation could be sought on the evidence the platform '
    + 'already produces — a hash-chained register, signed credentials, published assessment policy, '
    + 'and an evidence centre that records what is missing as carefully as what exists.'),

  B.h2('Governance'),
  B.p('Academic authority rests with two bodies, both established by the Executive and recorded in '
    + 'the College\'s governance ledger.'),
  B.table(['Body', 'Remit', 'Status'],
    d.bodies.map((b) => [
      `${b.name} (${b.code})`,
      b.remit.length > 180 ? b.remit.slice(0, 177) + '…' : b.remit,
      b.members > 0 ? `${b.members} members appointed` : 'Established; not yet constituted',
    ]), [24, 55, 21]),
  B.panel('Established is not constituted', [
    'Both bodies exist as offices with defined remits. Neither has appointed members. Until they do, '
    + 'the academic judgements reserved to them — principally the mapping of assessments to the '
    + 'competency framework — cannot be made, and the platform reports them as outstanding rather '
    + 'than as complete.',
  ], 'warn'),

  B.h1('About the IEFC'),
  B.rule(),
  B.label('The definition, as adopted'),
  B.p(d.programme.statement, { quote: true }),
  B.small(`Adopted ${d.programme.adopted_on} by the ${d.programme.adopted_by}.`),

  B.h2('What supports each element'),
  B.p('A definition cannot be verified as a sentence. The College therefore decomposes its own '
    + 'definition into the seven things it asserts, and records the evidence for each. The states '
    + 'below are derived from the academic database, not asserted.'),
  B.table(['Element', 'Position'], d.claims.map((c) => [c.claim, STATE_WORD[c.state]]), [72, 28]),

  ...d.claims.flatMap((c) => [
    B.h3(c.claim),
    B.state(STATE_WORD[c.state], STATE_TONE[c.state]),
    B.p(c.evidence),
    ...(c.shortfall ? [B.panel('Shortfall', [c.shortfall], 'warn')] : []),
  ]),

  B.h1('The Qualification Framework'),
  B.rule(),
  // The award named in this sentence is read from the record rather than
  // typed, because it was typed once and went stale: this paragraph named
  // "English Associate of Worldwide English College" — a title the College
  // retired when it adopted the Worldwide English Qualifications framework —
  // in a document whose own table, three lines below, named the replacement.
  B.lead('The International English Fluency Course (IEFC) is a six-level ascent, mapped to the '
    + 'Common European Framework of Reference from A1 to C2. Each level confers its own award, '
    + 'and each award is complete in itself: a learner who stops at Level III has not failed to '
    + `become something. They hold the ${d.levels[2].awardTitle} of Worldwide English College, `
    + 'permanently, and the College says so in those words.'),
  B.p('That is the load-bearing decision of the architecture. An award that only means something as '
    + 'a step toward the next is not an award; it is a receipt.'),
  B.table(['Level', 'CEFR', 'Award', 'Post-nominal'],
    d.levels.map((l) => [`${l.roman} — ${l.name}`, l.cefr, l.awardTitle, l.postNominal]),
    [27, 9, 47, 17]),
  B.h2('The standing each award confers'),
  B.table(['Award', 'Standing conferred'],
    d.levels.map((l) => [l.postNominal, l.standing]), [18, 82]),

  B.h1('The Competency Framework'),
  B.rule(),
  B.lead('Six competencies describe what a communicator can do, independently of the language level '
    + 'at which they do it. They are the College\'s own contribution and are not derived from CEFR, '
    + 'which describes proficiency rather than conduct.'),
  B.table(['Competency', 'What it means'],
    d.competencies.map((c) => [c.name, c.description]), [21, 79]),
  B.panel('The framework is defined and not yet applied', [
    `${d.totals.competenciesMapped} of the ${d.totals.assignments + d.totals.quizzes} assessments in `
    + 'the curriculum are mapped to any competency. No competency has therefore been verified for any '
    + 'graduate, and no competency attainment appears on any record.',
    'This is the element of the College\'s own definition that it cannot currently evidence, and it '
    + 'is the founding task of the Board of Academic Standards and Curriculum Excellence. Mapping an '
    + 'assessment to a competency is an academic judgement; the platform records such judgements for '
    + 'review and approval and does not make them.',
  ], 'gap'),

  B.h1('The Language Skill Framework'),
  B.rule(),
  B.lead('CEFR is defined skill by skill: a reader at B2 may be a speaker at B1. A qualification '
    + 'reporting a single level without saying which skills stood where would hide the most useful '
    + 'thing it knows.'),
  B.table(['Skill', 'Mode', 'What it certifies'],
    d.skills.map((s) => [s.name, s.mode === 'receptive' ? 'Receptive' : 'Productive', s.description]),
    [15, 15, 70]),
  B.h2('Attainment descriptors'),
  B.p('Attainment is reported as one of five ordered descriptors, never as a percentage. '
    + '"Writing: 82%" claims a precision that no rubric supports and invites comparisons between '
    + 'graduates that the marks cannot bear.'),
  B.table(['Descriptor', 'Definition'],
    d.descriptors.map((x) => [x.name, x.description]), [21, 79]),
  B.panel('The descriptors are decided; the thresholds are not', [
    'The Executive has named the five bands. Nobody has yet determined what evidence earns a graduate '
    + 'Proficient rather than Developing — a harder academic question than naming the bands, and one '
    + 'reserved to the Academic Senate. Until both the assessment mapping and the thresholds are '
    + 'approved, no skill descriptor is reported for any graduate.',
  ], 'warn'),

  B.h1('The Assessment Framework'),
  B.rule(),
  B.lead('Assessment in the IEFC is authentic: learners are asked to do the thing, and a person '
    + 'judges how well they did it against a published rubric.'),
  B.table(['Instrument', 'Count', 'How it is judged'], [
    ['Assessed assignments', String(d.totals.assignments), 'Marked by a person against a published rubric normalised to the College rubric policy'],
    ['Assessed quizzes', String(d.totals.quizzes), 'Scored server-side at submission'],
    ['Quiz questions authored', String(d.totals.quizQuestions), 'Authored per module and reviewed for consistency'],
    ['Reading and study items', String(d.totals.readings), 'Formative; not separately assessed'],
  ], [26, 11, 63]),
  B.bullets([
    'Every module carries exactly one assessed assignment and one assessed quiz, at every level.',
    'Assignment marks are recorded on a 0 to 1 scale by a named marker, with written feedback, and are never auto-generated.',
    'Spoken work is captured as learner recordings and reviewed in the instructor workspace, so speaking is assessed on evidence rather than on impression.',
    'A moderated mark and a first-marker mark are recorded distinctly, so an assessment board can tell them apart.',
  ]),

  B.h1('Credentials and Verification'),
  B.rule(),
  B.lead('An award is worth what it can be checked against. The College therefore publishes a '
    + 'verification service that answers a stranger — an employer, a registrar — without requiring '
    + 'them to hold an account, and without requiring the College to participate in the check.'),
  B.h2('The Principle of Institutional Verification'),
  B.p('Every verification answers across three independent layers, and the answers are never '
    + 'averaged into one verdict.'),
  B.table(['Layer', 'The question it answers'], [
    ['Identity authenticity', 'Is this the person the College awarded?'],
    ['Credential integrity', 'Has this credential been altered?'],
    ['Institutional standing', 'What is the status of this award today?'],
  ], [28, 72]),
  B.p('They are separated because they genuinely disagree. A withdrawn award reports identity '
    + 'verified, integrity verified and standing failed, simultaneously. A single verdict cannot '
    + 'express that, and every way of collapsing it misleads somebody: "invalid" tells an employer a '
    + 'genuine certificate is a forgery, which is a serious accusation about a real person; "valid" '
    + 'admits a candidate on a qualification the College has withdrawn.'),
  B.h2('What the College operates today'),
  B.bullets([
    'A Graduate Register in which every award is hash-chained to its predecessor, so an altered record breaks the chain and says so.',
    'ES256 credential signing, with the public keys published so that verification does not require the College\'s cooperation.',
    'QR codes on credentials, verified against an independently written decoder across every version and error-correction level.',
    'Issued transcripts and diploma supplements frozen at the moment of issue, so a document keeps saying what it said on the day it was issued.',
    'A public verification portal, and a separate key-authenticated service for institutions verifying in volume.',
  ]),
  B.panel('The signing layer is in development mode', [
    'The College\'s signing key is held in development key management rather than a production '
    + 'hardware security module. Under the Executive decision governing credential trust, the signing '
    + 'layer therefore claims no production-grade assurance, and every verification says so on its '
    + 'face. The Graduate Register — not the signature — remains the authoritative record until a '
    + 'production key management service is provisioned.',
  ], 'warn'),

  B.h1('The Curriculum'),
  B.rule(),
  B.lead(`Six levels, ${d.totals.modules} modules, ${d.totals.learningItems} authored learning items. `
    + 'The module architecture is complete: ten modules at every level, each with an assessed '
    + 'assignment and an assessed quiz. Lesson-level depth within those modules is in progress, and '
    + 'the per-level tables state what each level currently holds.'),

  ...d.levels.flatMap((lv) => {
    const counts = Object.fromEntries(lv.itemCounts.map((c) => [c.kind, c.n]));
    const total = lv.itemCounts.reduce((a, c) => a + c.n, 0);
    return [
      B.h1(`Level ${lv.roman} — ${lv.name}`),
      B.p(`${lv.awardTitle}  ·  ${lv.postNominal}  ·  CEFR ${lv.cefr}`, { eyebrow: true }),
      B.rule(),
      B.label('Academic overview'),
      B.p(lv.overview),
      B.label('Graduate profile'),
      B.p(lv.graduateProfile),
      B.label('Learning outcomes'),
      B.p(lv.canDo),
      B.label('The award, and why this word'),
      B.p(`${lv.awardTitle} (${lv.postNominal}). ${lv.standing}.`, { bold: true }),
      B.p(lv.purpose),
      B.h2('Programme structure'),
      B.table(['Measure', 'This level'], [
        ['Duration', `${lv.months} months`],
        ['Modules', String(lv.modules.length)],
        ['Assessed assignments', String(counts.assignment || 0)],
        ['Assessed quizzes', String(counts.quiz || 0)],
        ['Reading and study items', String(counts.reading || 0)],
        ['Authored learning items, total', String(total)],
      ], [52, 48]),
      B.h2('Modules'),
      B.table(['No.', 'Module'], lv.modules.map((m) => [String(m.sequence), m.title]), [10, 90]),
    ];
  }),

  B.h1('The Alumni Society'),
  B.rule(),
  B.lead('Every graduate belongs to the Worldwide English College Alumni Society, and within it to '
    + 'the chapter of their highest award. Membership is not applied for and is not recorded '
    + 'separately: it follows from the award, and it moves when the award does.'),
  B.table(['Chapter', 'Award', 'Officers'],
    d.chapters.map((c) => [c.name, c.postNominal, c.officersElected ? 'Elected' : 'Not yet elected']),
    [32, 34, 34]),
  B.p('No chapter has elected officers. The Society is newly established, and officers are elected '
    + 'by members rather than appointed — a chapter elects when it has members enough to hold an '
    + 'election.'),

  B.h1('Glossary'),
  B.rule(),
  B.table(['Term', 'Definition'], [
    ['IEFC', 'The International English Fluency Certificate, the College\'s qualification.'],
    ['CEFR', 'The Common European Framework of Reference for Languages, the international scale from A1 to C2 against which the six levels are mapped.'],
    ['WEC Credit', 'The College\'s unit of academic credit, recorded on each award at conferral.'],
    ['Total Qualification Time', 'The College\'s design figure for the hours a level represents. It is the same for every holder and is not a measure of any individual\'s effort.'],
    ['Guided Learning Hours', 'The portion of Total Qualification Time delivered under instruction.'],
    ['Post-nominal', 'The abbreviation a holder may place after their name, conferred with the award.'],
    ['Graduate Register', 'The College\'s hash-chained record of every award conferred, publicly checkable by verification code.'],
    ['Verification code', 'The permanent identifier printed on a credential, carrying a check character so a mistyped code is refused rather than misread.'],
    ['Competency', 'One of the College\'s six descriptions of what a communicator can do, independent of language level.'],
    ['Descriptor', 'One of the five ordered bands in which skill attainment is reported.'],
    ['BASCE', 'The Board of Academic Standards and Curriculum Excellence, the authority for the competency framework.'],
  ], [24, 76]),

  B.h1('Colophon'),
  B.rule(),
  B.p('This edition was generated from the College\'s academic database and its approved '
    + 'institutional documents. Both the editable and the print editions are rendered from one '
    + 'content definition, and their text is compared token by token before release, so they are '
    + 'identical by verification rather than by proofreading.'),
  B.p('Set in Cambria and Calibri in the editable edition, and in their metric equivalents in the '
    + 'print edition. Faces were chosen because they are present wherever this document will be '
    + 'opened; a more distinguished face that is substituted silently at the printer is a worse '
    + 'choice than a plainer one that renders as set.'),
  B.small(`Counts in this edition: ${d.totals.levels} levels · ${d.totals.modules} modules · `
    + `${d.totals.learningItems} learning items · ${d.totals.quizQuestions} quiz questions.`),
  B.small('Worldwide English College Press · London Campus'),
];

export const DATA = d;
