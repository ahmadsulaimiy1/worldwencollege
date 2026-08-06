/**
 * WEC PRESS — THE LEGACY CONSTITUTION.
 *
 * ────────────────────────────────────────────────────────────────────
 * THE PROBLEM THIS LAYER EXISTS TO SOLVE
 * ────────────────────────────────────────────────────────────────────
 * Everything built before this file assumed one editor. Not by
 * intention — by omission. The design system is documented, the claims
 * are tested, the catalogue is computed; but if every person who worked
 * on these publications left tomorrow, the person who arrived would
 * find nine artefacts with no revision history, no citation form, no
 * cataloguing data, no statement of which publication supersedes which,
 * and no way to tell a first edition from a mature one except by
 * reading all of it.
 *
 * That is how institutional publishing dies quietly. Not in a disaster;
 * in a handover.
 *
 * So this layer adds the apparatus that lets a publication outlive the
 * people who made it:
 *
 *   FAMILIES — every title belongs to a named family with a stated
 *     purpose and readership, and no title exists in isolation.
 *   MATURITY — a lifecycle status, derived rather than claimed, so a
 *     first edition is never mistaken for a settled one.
 *   REVISION HISTORY — derived from the source repository at build
 *     time. Not a hand-kept list that drifts: the actual commits that
 *     changed the artefact, with their dates and their reasons.
 *   CITATION — a form a scholar can cite and a librarian can catalogue,
 *     printed in the publication rather than left to be guessed.
 *   CATALOGUING — the fields a depository library needs, including the
 *     identifiers the College does not hold, named as not assigned.
 *   READINESS — nine properties, each PROBED against the rendered
 *     artefact rather than asserted about it.
 *
 * ────────────────────────────────────────────────────────────────────
 * WHY THE READINESS PROPERTIES ARE PROBES
 * ────────────────────────────────────────────────────────────────────
 * "Accessibility-ready" is the easiest sentence in publishing to write
 * and the easiest to be wrong about. A publication is accessibility-
 * ready if the file carries a structure tree and a declared language,
 * which is a fact about the file and can be read off it. So each of the
 * nine properties below is a function from the rendered PDF to true or
 * false, and the Press prints the result rather than the intention.
 *
 * Two of the nine are deliberately NOT provable here — external PDF/UA
 * validation and physical proofing — and they say so instead of
 * quietly passing.
 */
import { execFileSync } from 'node:child_process';
import { existsSync, readFileSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { TITLES, STATUS, resolve, inventory } from './catalogue.mjs';
import { FORMATS } from './house.mjs';

/** The declared trims, in points, for the print-readiness probe. */
const TRIMS_PT = FORMATS.map((f) => [f.w * 72 / 25.4, f.h * 72 / 25.4]);

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..');

// ─────────────────────────────────────────────────────────────────────
// 1 · FAMILIES
// ─────────────────────────────────────────────────────────────────────

/**
 * Ten families. A family is the SCHOLARLY grouping — what shelf a
 * librarian puts the book on and what a reader is looking for when they
 * reach for it. It is the only grouping axis: an earlier draft carried
 * both a "series" for colour and a "family" for meaning, which is two
 * taxonomies for one distinction and the sort of thing that survives
 * one editor and confuses the next.
 */
export const FAMILIES = [
  { key: 'IEFC Student Series',
    purpose: 'Everything a learner reads, works in, or carries.',
    readership: 'Enrolled learners and self-study readers' },
  { key: 'IEFC Teacher Series',
    purpose: 'The curriculum as a teacher needs it: with the keys, the rubrics and the '
      + 'apparatus for running a session.',
    readership: 'Teaching staff' },
  { key: 'IEFC Assessment Series',
    purpose: 'What is assessed, how it is marked, and to what standard.',
    readership: 'Examiners, moderators, teaching staff' },
  { key: 'IEFC Reference Library',
    purpose: 'Consulted rather than read through: grammar, vocabulary, pronunciation, '
      + 'listening scripts, glossary, cross-references.',
    readership: 'Teachers and advanced learners' },
  { key: 'WEC Academic Framework Series',
    purpose: 'The architecture of the qualification: levels, competencies, skills, '
      + 'descriptors, awards and their standing.',
    readership: 'Partner institutions, quality reviewers, employers' },
  { key: 'WEC Governance Series',
    purpose: 'How the College publishes, produces and regulates. Includes the documents '
      + 'that bind the Press itself.',
    readership: 'Staff, reviewers, printers, future editors' },
  { key: 'WEC Research Series',
    purpose: 'Peer-reviewed and scholarly work in language education.',
    readership: 'Researchers, teacher educators and the wider field of language education' },
  { key: 'WEC Professional Development Series',
    purpose: 'Continuing development for practising teachers, beyond the delivery of one '
      + 'programme.',
    readership: 'Teaching staff and the wider profession' },
  { key: 'WEC New Programmes Series',
    purpose: 'Programmes the College does not yet teach, published only once the syllabus '
      + 'behind them exists.',
    readership: 'Prospective new markets' },
  { key: 'WEC Institutional Series',
    purpose: 'The College speaking as an institution: prospectus, annual report, alumni.',
    readership: 'Applicants, sponsors, graduates, the public record' },
];

export const familyOf = (name) => FAMILIES.find((f) => f.key === name) || null;

// ─────────────────────────────────────────────────────────────────────
// 2 · MATURITY
// ─────────────────────────────────────────────────────────────────────

export const MATURITY = {
  CONCEPT: 'Concept',
  DEVELOPMENT: 'Under development',
  FIRST: 'First edition',
  REVIEWED: 'Reviewed edition',
  MATURE: 'Mature publication',
  LEGACY: 'Legacy edition',
};

export const MATURITY_ORDER = [
  MATURITY.CONCEPT, MATURITY.DEVELOPMENT, MATURITY.FIRST,
  MATURITY.REVIEWED, MATURITY.MATURE, MATURITY.LEGACY,
];

export const MATURITY_MEANS = [
  [MATURITY.CONCEPT, 'Specified in the catalogue. Nothing has been produced.'],
  [MATURITY.DEVELOPMENT, 'Production has begun: a renderer exists and the volume builds, but '
    + 'no edition has been issued.'],
  [MATURITY.FIRST, 'One edition issued. It has not been reviewed by anyone other than its '
    + 'makers, and a reader should weigh it accordingly.'],
  [MATURITY.REVIEWED, 'An edition has been through a recorded review by a reader who did not '
    + 'produce it.'],
  [MATURITY.MATURE, 'Two or more editions, at least one reviewed. The publication has been '
    + 'revised in the light of use.'],
  [MATURITY.LEGACY, 'Superseded by a later publication, kept in the record because it was '
    + 'issued and citations to it must still resolve.'],
];

/**
 * The review register. A publication may only claim REVIEWED if a
 * review is recorded here by someone who did not produce it, and the
 * register is empty, which is the truthful position: nine artefacts
 * have been issued and none has been independently reviewed.
 *
 * It is written as an empty array rather than omitted so that the
 * absence is a recorded fact with a place to be corrected, not a gap
 * somebody has to notice.
 */
export const REVIEWS = [];

/** Publications superseded by a later one. Empty, and stated as such. */
export const SUPERSEDED = {};

/**
 * Maturity is DERIVED. It cannot be typed into a title, because the one
 * thing a maturity status must never do is flatter: the temptation to
 * call a first edition "mature" arrives exactly when the book is being
 * shown to someone.
 */
export function maturityOf(row, { revisions = [], reviews = REVIEWS } = {}) {
  if (SUPERSEDED[row.artefact]) return MATURITY.LEGACY;
  if (row.status !== STATUS.PUBLISHED) {
    return row.build ? MATURITY.DEVELOPMENT : MATURITY.CONCEPT;
  }
  const reviewed = reviews.filter((r) => r.artefact === row.artefact);
  const editions = new Set(revisions.map((r) => r.edition || 1)).size || 1;
  if (editions >= 2 && reviewed.length) return MATURITY.MATURE;
  if (reviewed.length) return MATURITY.REVIEWED;
  return MATURITY.FIRST;
}

// ─────────────────────────────────────────────────────────────────────
// 3 · REVISION HISTORY
// ─────────────────────────────────────────────────────────────────────

/**
 * Derived from the source repository, not kept by hand.
 *
 * A hand-kept revision list is a promise that every future editor will
 * remember to update it, and that promise is broken within a year. The
 * commits that changed the artefact are the revision history; they have
 * dates, they have reasons, and nobody has to remember anything.
 *
 * Best-effort by design: outside a repository checkout there is no
 * history to read, and the publication says so rather than printing an
 * empty table that reads like a claim of never having been revised.
 */
export function revisionHistory(artefact, { limit = 8 } = {}) {
  if (!artefact) return { available: false, why: 'This publication has no artefact yet.', rows: [] };
  try {
    const out = execFileSync('git',
      ['log', '--follow', '--date=short', '--format=%ad%s', '--', artefact],
      { cwd: ROOT, encoding: 'utf8', stdio: ['ignore', 'pipe', 'ignore'] });
    const rows = out.split('\n').filter(Boolean).map((line) => {
      const [date, subject] = line.split('');
      return { date, subject };
    });
    if (!rows.length) {
      return { available: false, rows: [],
        why: 'The artefact is not yet in the source repository’s history.' };
    }
    return {
      available: true,
      issued: rows[rows.length - 1].date,
      lastChanged: rows[0].date,
      total: rows.length,
      rows: rows.slice(0, limit),
      truncated: Math.max(0, rows.length - limit),
    };
  } catch {
    return { available: false, rows: [],
      why: 'Revision history is read from the source repository, which was not available when '
        + 'this copy was generated.' };
  }
}

// ─────────────────────────────────────────────────────────────────────
// 4 · CITATION AND CATALOGUING
// ─────────────────────────────────────────────────────────────────────

export const IMPRINT = {
  publisher: 'Worldwide English College Press',
  parent: 'Worldwide English College, London Campus',
  place: 'London',
  language: 'English (en-GB)',
};

/**
 * The citation form, printed in the publication so that everyone who
 * cites it cites it the same way. The corporate author is the College,
 * because no individual is named as author of any publication of this
 * Press and none may be until someone holds the office.
 */
export function citation({ title, edition, year, documentId, subtitle, artefact }) {
  const full = subtitle ? `${title}: ${subtitle}` : title;
  return {
    note: `Worldwide English College. ${full}. ${edition} edition. ${IMPRINT.place}: `
      + `${IMPRINT.publisher}, ${year}. Document ID ${documentId}.`,
    inText: `(Worldwide English College ${year})`,
    fields: [
      ['Corporate author', 'Worldwide English College, London Campus'],
      ['Title', full],
      ['Edition', `${edition} edition`],
      ['Place of publication', IMPRINT.place],
      ['Publisher', IMPRINT.publisher],
      ['Year', String(year)],
      ['Document ID', documentId],
      ['File', artefact || 'Not yet issued'],
    ],
  };
}

/**
 * Cataloguing-in-publication data. The fields a depository library
 * needs, with the four identifiers the College does not hold printed as
 * not assigned and the issuing authority named — a librarian can then
 * see at a glance what is missing and who would have to issue it.
 */
export function cataloguing({ title, subtitle, family, edition, year, pages, audience,
  subjects, registrations }) {
  const fam = familyOf(family);
  return [
    ['Title', subtitle ? `${title}: ${subtitle}` : title],
    ['Statement of responsibility', 'Worldwide English College, London Campus'],
    ['Family', fam ? fam.key : family],
    ['Edition', `${edition} edition`],
    ['Imprint', `${IMPRINT.place}: ${IMPRINT.publisher}, ${year}`],
    ['Extent', pages ? `${pages} pages` : 'Not yet paginated'],
    ['Intended readership', audience],
    ['Subject terms', (subjects || []).join(' · ')],
    ['Language', IMPRINT.language],
    ...(registrations || []).map((r) => [r.field, `${r.value} — ${r.authority}`]),
  ];
}

// ─────────────────────────────────────────────────────────────────────
// 5 · THE NINE READINESS PROPERTIES
// ─────────────────────────────────────────────────────────────────────

/**
 * Each property is a probe against the rendered file. `probe` returns
 * true, false, or null where the property cannot be established from
 * the file at all — and null is a result, not a failure to check.
 */
export const READINESS = [
  {
    key: 'edition', name: 'Edition-aware', where: 'document',
    means: 'The publication states which edition it is, in a form that distinguishes it from '
      + 'the next.',
    probe: (raw) => /E\d\d\.R\d\d\.\d\d/.test(raw) || /First edition/i.test(raw),
  },
  {
    key: 'revision', name: 'Revision-aware', where: 'document',
    means: 'The file carries an issue code and a revision history, so a reader holding two '
      + 'copies can tell which is later and why.',
    probe: (raw) => /Revision history/i.test(raw) && /E\d\d\.R\d\d/.test(raw),
  },
  {
    key: 'citation', name: 'Citation-aware', where: 'document',
    means: 'The file prints the form in which it should be cited, so every citation to it '
      + 'agrees.',
    probe: (raw) => /How to cite/i.test(raw),
  },
  {
    key: 'translation', name: 'Translation-ready', where: 'file',
    means: 'The file declares its language, and the text is generated from a model rather '
      + 'than typed into a layout, so a translation is a second rendering and not a second book.',
    probe: (raw) => /\/Lang/.test(raw),
  },
  {
    key: 'accessibility', name: 'Accessibility-ready', where: 'file',
    means: 'The file carries a structure tree and a declared language. External PDF/UA '
      + 'conformance has not been validated for any publication of the Press.',
    probe: (raw) => /\/StructTreeRoot/.test(raw) && /\/Lang/.test(raw),
  },
  {
    key: 'archive', name: 'Archive-ready', where: 'document',
    means: 'The publication carries a content digest and a generation date, so a copy found '
      + 'in twenty years can be identified without trusting its filename.',
    probe: (raw) => /Document ID/.test(raw) && /Generated \d{4}-\d{2}-\d{2}/.test(raw),
  },
  {
    key: 'print', name: 'Print-ready', where: 'file',
    means: 'The file is set at one of the house\u2019s four declared trims. A first version of '
      + 'this probe tested for A4 and failed the first publication set at royal octavo — it was '
      + 'measuring the flagship rather than the standard.',
    probe: (raw) => {
      const m = raw.match(/\/MediaBox\s*\[\s*0\s+0\s+([\d.]+)\s+([\d.]+)/);
      if (!m) return false;
      const w = Number(m[1]), h = Number(m[2]);
      return TRIMS_PT.some(([tw, th]) => Math.abs(w - tw) < 2 && Math.abs(h - th) < 2);
    },
  },
  {
    key: 'digital', name: 'Digital-ready', where: 'file',
    means: 'The file carries a document outline that matches its contents, so it is navigable '
      + 'on a screen and not merely printable.',
    probe: (raw) => /\/Outlines/.test(raw),
  },
  {
    key: 'library', name: 'Library-ready', where: 'document',
    means: 'The publication carries cataloguing data and names the identifiers it does not '
      + 'hold, with the authority that would issue each.',
    probe: (raw) => /Cataloguing/i.test(raw) && /Not assigned/i.test(raw),
  },
];

/**
 * The probes are split by WHERE the evidence lives, which is the only
 * way to make them reliable.
 *
 * Structural properties — language, structure tree, outline, trim — are
 * facts about the FILE and are read from the PDF, where they appear in
 * the clear.
 *
 * Content properties — a citation form, a revision history, cataloguing
 * data — are facts about the DOCUMENT and are read from the HTML the
 * renderer wrote. They are not read from the PDF text layer: a first
 * attempt did that by inflating every stream and matching parenthesised
 * strings, which blew the stack on a 441-page book and would have been
 * unreliable anyway, because a PDF splits a phrase across text-showing
 * operators wherever it kerns.
 */
export function readinessOf(artefact, htmlSource) {
  const pdf = artefact ? path.join(ROOT, artefact) : null;
  const src = htmlSource ? path.join(ROOT, htmlSource) : null;
  // Structural probes are PDF probes. Run against a DOCX they report
  // false, which reads as "this publication is not accessible" when the
  // truth is that a Word file expresses these properties elsewhere and
  // this instrument cannot see them.
  const isPdf = pdf && /\.pdf$/i.test(pdf) && existsSync(pdf);
  const rawPdf = isPdf ? readFileSync(pdf).toString('latin1') : null;
  const rawSrc = src && existsSync(src) ? readFileSync(src, 'utf8') : null;

  return READINESS.map((r) => {
    const raw = r.where === 'file' ? rawPdf : rawSrc;
    if (raw === null) {
      return { ...r, result: null,
        why: r.where === 'file'
          ? 'This property is read from a PDF. The artefact is not one, or is not on disk.'
          : 'This publication is produced by a rendering path that writes no HTML source, so '
            + 'the document properties cannot be read off it.' };
    }
    return { ...r, result: r.probe(raw) };
  });
}

/**
 * The properties no probe can establish, stated once rather than
 * silently passing. A readiness report that only lists what it can
 * check teaches the reader that the list is complete.
 */
export const UNPROVABLE = [
  ['External accessibility conformance', 'PDF/UA has not been validated by an external tool '
    + 'or an assistive-technology user for any publication of the Press. The structural checks '
    + 'above are necessary and not sufficient.'],
  ['Physical print quality', 'No publication of the Press has been printed. Trim, stock, ink '
    + 'coverage and finishing are specified from trade data and have not been proofed on press.'],
  ['Long-term archival deposit', 'No copy has been deposited with a legal-deposit library, '
    + 'because deposit requires a registered publisher and the Press is not one.'],
];

// ─────────────────────────────────────────────────────────────────────
// 6 · THE ECOSYSTEM: NO PUBLICATION IN ISOLATION
// ─────────────────────────────────────────────────────────────────────

/**
 * Related publications, computed from the family plus any explicit
 * links a title declares. The rule the Legacy Constitution imposes is
 * that every title resolves to at least one other, and it is checked
 * rather than hoped for.
 */
export function relatives(title, all = TITLES) {
  const explicit = (title.related || []).map((n) => all.find((t) => t.n === n)).filter(Boolean);
  const kin = all.filter((t) => t.n !== title.n && t.family === title.family);
  const seen = new Set();
  return [...explicit, ...kin].filter((t) => !seen.has(t.n) && seen.add(t.n));
}

/** Every title, resolved and given its legacy layer. */
export function ecosystem(INV = inventory()) {
  return TITLES.map((t) => {
    const row = resolve(t, INV);
    const revisions = revisionHistory(row.artefact);
    return {
      ...row,
      maturity: maturityOf(row, { revisions: revisions.rows }),
      revisions,
      relatives: relatives(t).map((r) => ({ n: r.n, name: r.name })),
      family: familyOf(t.family),
    };
  });
}

export function familyTable(rows = ecosystem()) {
  return FAMILIES.map((f) => ({
    ...f,
    titles: rows.filter((r) => r.family && r.family.key === f.key),
  }));
}

// ─────────────────────────────────────────────────────────────────────
// 7 · THE FOUR QUESTIONS
// ─────────────────────────────────────────────────────────────────────

/**
 * Asked of every publication before it is approved. They are recorded
 * here rather than in a reviewer's head, with the answer this Press
 * currently gives and the reason.
 */
export const FUTURE_PROOFING = [
  ['Can this still be maintained in ten years?',
    'Yes, conditionally. Every artefact is generated from the academic database and a named '
    + 'script; none is hand-edited. The condition is the toolchain: the renderers depend on one '
    + 'browser engine’s paged-media implementation, and that is the single point at which this '
    + 'system would have to be rebuilt rather than maintained.'],
  ['Can this still be expanded in twenty years?',
    'Yes. Adding a publication means adding a title with its measured requirements and a '
    + 'renderer; the identity, the readiness probes, the citation form and the cataloguing '
    + 'apparatus apply to it without modification.'],
  ['Can another editorial board continue this work without redesigning the system?',
    'Yes for the system, no for the judgement. Every design decision is in the source with its '
    + 'reasoning, every standard is measured, and every claim is tested. What a new board '
    + 'inherits is a working system and a written account of why it is the way it is — not a '
    + 'set of files whose logic died with the people who wrote them.'],
  ['Would this publication still feel like ours in twenty years?',
    'That is the question the Press is measured by, and it cannot be answered by the people '
    + 'asking it. What can be done is to make the answer possible: one identity, derived rather '
    + 'than remembered; one truth standard, tested rather than trusted; and one place — this '
    + 'volume — where both are written down.'],
];

// ─────────────────────────────────────────────────────────────────────
// 8 · THE APPARATUS, RENDERED
// ─────────────────────────────────────────────────────────────────────

const esc = (s) => String(s ?? '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');

/**
 * The legacy apparatus as a block of HTML, generated once and inserted
 * into every publication of the Press.
 *
 * It is generated rather than written into each renderer because the
 * whole point of the layer is that the fortieth publication carries the
 * same apparatus as the first without anyone remembering to add it. A
 * citation form copied by hand into four documents is four citation
 * forms within a year.
 *
 * It carries its own scoped styles: the four renderers have different
 * stylesheets, and an apparatus that inherits whatever it lands in
 * would look like a different section of each book.
 */
/**
 * The extent, read from the copy on disk.
 *
 * A publication cannot count its own pages while it is being set: the
 * file does not exist until the run finishes. So the extent quoted in
 * the cataloguing data is that of the impression on file when this copy
 * was generated, and the note under the table says so rather than
 * implying the number was measured from this copy. Extents are stable
 * between impressions; a claim of "not yet paginated" on a 443-page
 * book would be a plain falsehood, which is the alternative.
 */
export function extentOf(artefact) {
  if (!artefact) return null;
  const file = path.join(ROOT, artefact);
  if (!existsSync(file) || !/\.pdf$/i.test(file)) return null;
  const n = (readFileSync(file).toString('latin1').match(/\/Type\s*\/Page(?![s])/g) || []).length;
  return n || null;
}

export function legacyBlock({
  id, title, subtitle, family, audience, subjects = [], pages, artefact,
  relatives = [], maturity = MATURITY.FIRST, ink = '#1F3E7C', rule = '#D8DCE3',
  soft = '#6B7280', accent = '#B4933E', panel = '#F6F1E4',
}) {
  const fam = familyOf(family);
  const cite = citation({
    title, subtitle, edition: id.editionName, year: id.year,
    documentId: id.documentId, artefact,
  });
  const extent = pages || extentOf(artefact);
  const cip = cataloguing({
    title, subtitle, family, edition: id.editionName, year: id.year, pages: extent, audience,
    subjects, registrations: id.registrations,
  });
  const hist = revisionHistory(artefact);
  const means = MATURITY_MEANS.find(([m]) => m === maturity);

  // Definition lists, not tables. These are key–value pairs, and an
  // earlier draft set them as tables with no header row — which the
  // craft test caught, correctly: a table without headers is a data
  // structure a screen reader cannot navigate and a layout device
  // pretending to be one.
  const row = ([k, v]) => `<dt>${esc(k)}</dt><dd>${esc(v)}</dd>`;

  return `
<style>
.lg { break-before:page; }
.lg h2 { color:${ink}; }
.lg__eyebrow { font-size:6.6pt; font-weight:700; letter-spacing:.26em; text-transform:uppercase;
  color:${accent}; margin:0 0 5pt; }
.lg dl { margin:6pt 0 12pt; font-size:8.4pt; display:grid; grid-template-columns:34% 1fr;
  column-gap:8pt; }
.lg dt { padding:3.4pt 0; border-bottom:.4pt solid ${rule}; font-size:7.2pt; font-weight:700;
  letter-spacing:.04em; color:${ink}; }
.lg dd { padding:3.4pt 0; border-bottom:.4pt solid ${rule}; margin:0; }
.lg__cite { border-left:2.4pt solid ${accent}; background:${panel}; padding:9pt 12pt;
  margin:8pt 0 12pt; break-inside:avoid; }
.lg__cite p { margin:0 0 5pt; }
.lg__cite p:last-child { margin:0; }
.lg__note { font-size:7.6pt; color:${soft}; margin:0 0 10pt; }
.lg h3 { font-size:10pt; margin:12pt 0 3pt; }
.lg ul { margin:0 0 10pt; padding-left:14pt; font-size:8.6pt; }
.lg li { margin:0 0 2pt; }
</style>
<section class="lg">
  <p class="lg__eyebrow">The record</p>
  <h2>This publication in the WEC Press record</h2>
  <p class="lg__note">Every publication of the Press carries this apparatus, generated from one
    source, so that a reader in twenty years can identify this copy, cite it, catalogue it, and
    find the publications it belongs beside — without needing anyone who made it.</p>

  <h3>Place in the ecosystem</h3>
  <dl>
    ${row(['Issue', `${id.issueCode} — edition ${id.editionCode.slice(1)}, revision `
      + `${id.revisionCode.slice(1)}, impression ${String(id.impression).padStart(2, '0')}`])}
    ${row(['Family', fam ? fam.key : family])}
    ${fam ? row(['What the family is for', fam.purpose]) : ''}
    ${row(['Maturity', maturity])}
    ${means ? row(['What that means', means[1]]) : ''}
  </dl>
  ${relatives.length ? `<h3>Published beside this volume</h3>
  <ul>${relatives.slice(0, 8).map((r) => `<li>${esc(r.name)}</li>`).join('')}</ul>` : ''}

  <h3>How to cite</h3>
  <div class="lg__cite">
    <p>${esc(cite.note)}</p>
    <p class="lg__note" style="margin:0">In text: ${esc(cite.inText)}</p>
  </div>

  <h3>Cataloguing</h3>
  <p class="lg__note">Cataloguing-in-publication data, prepared by the Press. The four
    identifiers below are not held by the College; each names the authority that would issue it.
    The extent is that of the impression on file when this copy was generated: a publication
    cannot count its own pages while it is being set.</p>
  <dl>${cip.map(row).join('')}</dl>

  <h3>Revision history</h3>
  ${hist.available
    ? `<p class="lg__note">Derived from the source repository at generation, not kept by hand.
        First issued ${esc(hist.issued)} · ${hist.total} revision${hist.total === 1 ? '' : 's'}
        · last changed ${esc(hist.lastChanged)}.</p>
       <dl>${hist.rows.map((r) => row([r.date, r.subject])).join('')}</dl>
       ${hist.truncated ? `<p class="lg__note">${hist.truncated} earlier revision${
  hist.truncated === 1 ? '' : 's'} not listed.</p>` : ''}`
    : `<p class="lg__note">${esc(hist.why)}</p>`}

  <p class="lg__note">Generated ${esc(id.generated)} · Document ID ${esc(id.documentId)} ·
    Issue ${esc(id.issueCode)} · ${IMPRINT.publisher}, an imprint of ${IMPRINT.parent}.</p>
</section>`;
}

// ─────────────────────────────────────────────────────────────────────
// 9 · DECLARED EXCEPTIONS
// ─────────────────────────────────────────────────────────────────────

/**
 * Where a publication fails a readiness property, the failure is
 * DECLARED here with its reason — and the test suite holds the
 * declaration to account in both directions:
 *
 *   an undeclared failure fails the build, so a property cannot quietly
 *     stop being true;
 *   a declared failure that has started passing also fails the build,
 *     so the list cannot silt up with exceptions nobody revisits.
 *
 * The second half is the one that matters in twenty years. Every
 * standards regime accumulates permanent temporary exemptions; this one
 * cannot, because a stale exemption is an error.
 */
export const READINESS_EXCEPTIONS = [
  {
    artefact: 'publication/IEFC Flagship Curriculum.pdf',
    properties: ['revision', 'citation', 'archive', 'library'],
    why: 'This publication is produced through a different path from every other: one block '
      + 'list rendered twice, to Word and to print, with a test comparing the two token by '
      + 'token. Injecting the apparatus as HTML into the print side alone would break that '
      + 'comparison — the guard that keeps the two artefacts identical. The apparatus has to be '
      + 'expressed as blocks so both renderers emit it, and until it is, this publication is '
      + 'outside the record. Registered in the Internal Editorial Bible under editorial '
      + 'opportunities.',
  },
];
