/**
 * THE ACADEMIC LIFECYCLE — who owns a publication, and what happens to
 * it after it is published.
 *
 * ────────────────────────────────────────────────────────────────────
 * WHAT THIS ADDS, AND WHAT IT DELIBERATELY DOES NOT
 * ────────────────────────────────────────────────────────────────────
 * The directive asks that every academic artefact carry eight things:
 * author, reviewer, approval pathway, revision cycle, version history,
 * quality review, retirement policy, archival policy.
 *
 * Four of those already exist. legacy.mjs derives VERSION HISTORY from
 * `git log --follow`, models the states a publication passes through
 * (Concept → Legacy edition), records SUPERSESSION, and probes nine
 * technical READINESS properties including archive-readiness. Restating
 * any of that here would create a second version free to disagree with
 * the first, which is the duplication the Canon forbids.
 *
 * So PROPERTIES below is a map of all eight, each naming where it
 * actually lives. Four say `legacy.mjs`. A test asserts that this
 * module exports nothing for those four — the refusal is enforced, not
 * promised.
 *
 * What is genuinely missing, and is built here:
 *
 *   AUTHOR and REVIEWER as ROLES, not as names. Nobody has been
 *     appointed to anything. The honest form is a post with a remit and
 *     a vacancy, exactly as academic_bodies records BASCE as existing
 *     with members_appointed = 0.
 *
 *   THE APPROVAL PATHWAY — the sequence a publication must pass
 *     through, and which step it is currently stuck at. Every
 *     publication in this Press is stuck at the same step, and saying
 *     so is more useful than a diagram of a process nobody has run.
 *
 *   THE REVISION CYCLE — how often a title is due to be revisited.
 *     Cadence, not history.
 *
 *   THE FOUR PROCESS QUESTIONS the directive names: what process
 *     produces this, maintains it, reviews it, improves it each year.
 *
 * ────────────────────────────────────────────────────────────────────
 * THE THING THIS FILE IS MOST AT RISK OF BECOMING
 * ────────────────────────────────────────────────────────────────────
 * An org chart of an institution that does not exist. Roles are cheap
 * to invent and read as substance. Every role below therefore carries
 * `holder: null` and cannot carry anything else — the type is enforced
 * by a test, because the day someone types a name into it is the day
 * this file starts lying.
 */
import { MATURITY, MATURITY_ORDER, FAMILIES, revisionHistory } from './legacy.mjs';

// ─────────────────────────────────────────────────────────────────────
// 1 · THE EIGHT PROPERTIES, AND WHERE EACH ONE LIVES
// ─────────────────────────────────────────────────────────────────────

export const HERE = 'lifecycle.mjs';
export const LEGACY = 'legacy.mjs';

/**
 * The directive's eight, mapped to their home. `where` is the file that
 * owns the property; `why` explains an entry that is NOT here, so a
 * future editor does not add it a second time.
 */
export const PROPERTIES = [
  { key: 'author', name: 'Author', where: HERE,
    why: 'A role with a remit and a vacancy. No publication in this Press has a named author, '
      + 'and inventing one would attribute academic work to a person who does not exist.' },
  { key: 'reviewer', name: 'Reviewer', where: HERE,
    why: 'A role, and separately a record of reviews that have happened. legacy.mjs keeps the '
      + 'record — it is an empty array, honestly — and this file keeps the post.' },
  { key: 'approval', name: 'Approval pathway', where: HERE,
    why: 'The sequence, and the step each publication is actually stuck at.' },
  { key: 'revisionCycle', name: 'Revision cycle', where: HERE,
    why: 'Cadence: how often a title is due to be revisited, by family.' },
  { key: 'versionHistory', name: 'Version history', where: LEGACY,
    why: 'Already derived from `git log --follow` by revisionHistory(). Deriving it a second '
      + 'time would produce a history free to disagree with the repository.' },
  { key: 'qualityReview', name: 'Quality review', where: HERE,
    why: 'legacy.mjs probes TECHNICAL readiness — tagged, printable, citable. That is not the '
      + 'same question as whether the content is academically sound, and conflating them was '
      + 'how a volume could read as "9 of 9 ready" while nobody had checked a word of it.' },
  { key: 'retirement', name: 'Retirement policy', where: HERE,
    why: 'legacy.mjs records WHICH titles are superseded. It does not say when a title should '
      + 'be withdrawn, or what happens to the learners holding it. That is the policy.' },
  { key: 'archival', name: 'Archival policy', where: LEGACY,
    why: 'Archive-readiness is one of the nine properties legacy.mjs probes per artefact, and '
      + 'the apparatus carries the generation stamp by construction.' },
];

// ─────────────────────────────────────────────────────────────────────
// 2 · THE ROLES
// ─────────────────────────────────────────────────────────────────────

/**
 * Six posts. Every one is vacant.
 *
 * `holder` is null in all six and a test fails if it is ever anything
 * else, because a name here would be a claim that a real person holds
 * an academic office at this College. `discharge` records who is doing
 * the work in the meantime under the delegation, which is a different
 * and truthful statement.
 */
const role = (o) => ({ holder: null, ...o });

export const ROLES = [
  role({ key: 'author', name: 'Author',
    remit: 'Writes the academic content of a publication and is answerable for its accuracy.',
    discharge: 'AIPC Press, under delegated authority. Everything authored is marked '
      + 'press_drafted rather than approved.' }),
  role({ key: 'reviewer', name: 'Academic reviewer',
    remit: 'Reads a publication against the curriculum it claims to serve and against practice '
      + 'in the teaching of English, and records what is wrong with it.',
    discharge: 'Nobody. No publication in this Press has been read by a qualified academic who '
      + 'did not write it, and the review register in legacy.mjs is empty for that reason.' }),
  role({ key: 'approver', name: 'Approving body',
    remit: 'Resolves that a publication meets the standard and may carry the College imprint.',
    discharge: 'BASCE has no appointed members. The Academic Senate has three and has not yet '
      + 'convened. Neither can therefore have approved anything, so work is recorded as interim '
      + 'in both cases — for two different reasons, which the record keeps apart.' }),
  role({ key: 'maintainer', name: 'Maintaining editor',
    remit: 'Keeps a published title consistent with the curriculum as the curriculum changes, '
      + 'and re-renders it when its source moves.',
    discharge: 'AIPC Press. Mechanised: every volume is derived from the academic record rather '
      + 'than transcribed, so a curriculum change reaches the page on the next build.' }),
  role({ key: 'examiner', name: 'External examiner',
    remit: 'Reads assessments and marked work from outside the institution and reports whether '
      + 'the standard is what the College claims it is.',
    discharge: 'Nobody. This is the post whose absence most limits what the awards can claim.' }),
  role({ key: 'archivist', name: 'Archivist',
    remit: 'Keeps every edition retrievable after the people and the software that made it are '
      + 'gone.',
    discharge: 'The repository and the git history. Adequate for now and not a substitute for '
      + 'legal deposit, which has not been arranged.' }),
];

export const vacancies = () => ROLES.filter((r) => r.holder === null);

// ─────────────────────────────────────────────────────────────────────
// 3 · THE APPROVAL PATHWAY
// ─────────────────────────────────────────────────────────────────────

/**
 * The sequence a publication passes through. `blocking` marks the step
 * that cannot currently be taken by anyone — naming it is the point of
 * the model, because a pathway whose gate is invisible reads as a
 * pathway that has been walked.
 */
export const PATHWAY = [
  { n: 1, step: 'Specified', by: 'Editorial',
    means: 'The title exists in the catalogue with countable requirements against it.',
    blocking: false },
  { n: 2, step: 'Derived or authored', by: 'Author (discharged by the Press)',
    means: 'The content exists, read from the academic record or written under delegation.',
    blocking: false },
  { n: 3, step: 'Produced', by: 'Maintaining editor',
    means: 'A named build script makes the artefact, and the suite verifies its craft.',
    blocking: false },
  { n: 4, step: 'Academically reviewed', by: 'Academic reviewer',
    means: 'Read by a qualified academic who did not write it.',
    blocking: true },
  { n: 5, step: 'Approved', by: 'Approving body',
    means: 'Resolved by a constituted board to meet the standard.',
    blocking: true },
  { n: 6, step: 'Externally examined', by: 'External examiner',
    means: 'Reported on from outside the institution.',
    blocking: true },
];

export const reachableStep = () => PATHWAY.filter((s) => !s.blocking).at(-1);
export const firstBlockingStep = () => PATHWAY.find((s) => s.blocking);

// ─────────────────────────────────────────────────────────────────────
// 4 · THE REVISION CYCLE
// ─────────────────────────────────────────────────────────────────────

/**
 * How often a title is due to be revisited, by family.
 *
 * Cadence is set by what makes the content wrong, not by a uniform
 * house rule. A volume derived from the curriculum is stale the moment
 * the curriculum moves, so its cycle is "on change" and is mechanised.
 * A volume of academic policy goes stale slowly and on a calendar.
 */
export const CADENCE = [
  { cycle: 'On change', months: null,
    means: 'Re-derived whenever its source moves. No calendar, because the trigger is the '
      + 'academic record rather than the date. These are the volumes that would go quietly '
      + 'wrong under an annual cycle, because the curriculum can move the day after a review.',
    families: ['IEFC Student Series', 'IEFC Teacher Series', 'IEFC Reference Library'] },
  { cycle: 'Annual', months: 12,
    means: 'Reviewed once a year against the programme as taught that year. Assessment leads '
      + 'this group: an instrument that never changes stops discriminating once its items are '
      + 'known.',
    families: ['IEFC Assessment Series', 'AIPC Institutional Series',
      'AIPC Professional Development Series', 'AIPC New Programmes Series'] },
  { cycle: 'Editorial cycle', months: 36,
    means: 'Revisited when the standard it describes is itself revised. Faster than that is '
      + 'churn: a constitution that changes every year is not a constitution.',
    families: ['AIPC Academic Framework Series', 'AIPC Governance Series',
      'AIPC Research Series'] },
];

export function cadenceFor(family) {
  return CADENCE.find((c) => c.families.includes(family)) || null;
}

// ─────────────────────────────────────────────────────────────────────
// 5 · THE FOUR PROCESS QUESTIONS
// ─────────────────────────────────────────────────────────────────────

/**
 * "For every publication ask: what institutional process produces this,
 * maintains this, reviews this, improves this every year."
 *
 * Answered once, structurally, rather than per title — because the
 * answer is a property of how this Press works, and repeating it
 * seventy times would be seventy places for it to drift.
 *
 * `exists` is the honest part. Two of the four processes are real and
 * running; two are named and have never been run by anybody.
 */
export const PROCESSES = [
  { question: 'What produces it?',
    process: 'Derivation from the academic record by a named build script, verified by an '
      + 'assertion suite that fails the build on a craft defect.',
    exists: true,
    evidence: 'Every published title names its build script, and a test reads that script to '
      + 'confirm it writes the artefact it claims to.' },
  { question: 'What maintains it?',
    process: 'The same derivation, re-run. Nothing is transcribed, so a curriculum change '
      + 'reaches every volume that prints it on the next build rather than by anyone '
      + 'remembering.',
    exists: true,
    evidence: 'Two-pass rendering: volumes that report on themselves are rendered twice so the '
      + 'figures converge on the impression being printed.' },
  { question: 'What reviews it?',
    process: 'Academic review by a qualified reader who did not write it.',
    exists: false,
    evidence: 'Has never happened. The review register is empty and the post is vacant.' },
  { question: 'What improves it every year?',
    process: 'An annual editorial cycle against the programme as actually taught, informed by '
      + 'the pedagogical record filled in by teaching.',
    exists: false,
    evidence: 'Cannot run yet. The record has no observed_in_teaching entries because the '
      + 'College has taught nobody, so there is nothing a year of teaching would feed back.' },
];

// ─────────────────────────────────────────────────────────────────────
// 6 · RETIREMENT
// ─────────────────────────────────────────────────────────────────────

/**
 * When a title is withdrawn, and what is owed to the people holding it.
 *
 * The second half is the part that gets forgotten. A learner working
 * through a withdrawn workbook is not helped by knowing it is
 * withdrawn; they are helped by the edition staying reachable until
 * they finish.
 */
export const RETIREMENT = [
  { trigger: 'Superseded by a new edition',
    action: 'The old edition stays retrievable and is marked superseded, naming its successor.',
    owed: 'A learner mid-programme finishes on the edition they started. Editions are not '
      + 'withdrawn from under people.' },
  { trigger: 'The curriculum it serves is withdrawn',
    action: 'The title is retired with the curriculum, on the same date, not before it.',
    owed: 'Anyone assessed against it keeps access to the version they were assessed against, '
      + 'for as long as the award is verifiable — which is indefinitely.' },
  { trigger: 'Found to be academically wrong',
    action: 'Withdrawn immediately and the fault stated in the record, not quietly replaced.',
    owed: 'Everyone who used it is entitled to know what was wrong, not merely to receive a '
      + 'corrected copy.' },
  { trigger: 'Nobody opens it',
    action: 'Not a trigger. Low use is a reason to ask whether it was the right book, not to '
      + 'withdraw a book that is correct.',
    owed: null },
];

// ─────────────────────────────────────────────────────────────────────
// 7 · QUALITY REVIEW, WHICH IS NOT READINESS
// ─────────────────────────────────────────────────────────────────────

/**
 * legacy.mjs answers "is this artefact technically fit to publish" —
 * tagged, printable, citable, archivable. This answers "is it any
 * good", which no probe can measure and which is why every row below
 * names WHO would have to answer it.
 *
 * Recording the distinction matters: a volume reporting 9 of 9 on
 * readiness has been checked by a machine for nine things, none of
 * which is whether a word of it is true.
 */
export const QUALITY = [
  { key: 'accuracy', question: 'Is the content correct?',
    answerableBy: 'Academic reviewer', mechanised: false,
    state: 'Unanswered. No qualified reader has checked any volume.' },
  { key: 'pedagogy', question: 'Does it teach well?',
    answerableBy: 'Teaching and Learning Committee, informed by teaching', mechanised: false,
    state: 'Unanswered, and unanswerable until the programme is taught.' },
  { key: 'coherence', question: 'Does it agree with the other volumes?',
    answerableBy: 'The apparatus', mechanised: true,
    state: 'Answered continuously. Every volume derives from one record, so two volumes cannot '
      + 'state different figures for the same thing.' },
  { key: 'craft', question: 'Is it well made as a book?',
    answerableBy: 'The assertion suite', mechanised: true,
    state: 'Answered on every build: page fill, contrast, table headers, tagging, trim.' },
  { key: 'standard', question: 'Is the standard what the College claims?',
    answerableBy: 'External examiner', mechanised: false,
    state: 'Unanswered. The post is vacant and this is the limit on what the awards can claim.' },
];

// ─────────────────────────────────────────────────────────────────────
// 8 · RESOLUTION
// ─────────────────────────────────────────────────────────────────────

/**
 * The lifecycle of one publication: its cadence, the furthest step it
 * has reached, what blocks the next one, and its version history read
 * from git rather than restated.
 */
export function lifecycleOf({ name, family, artefact, maturity } = {}) {
  const reached = maturity && MATURITY_ORDER.includes(maturity)
    ? maturity : MATURITY.CONCEPT;
  return {
    name,
    family,
    cadence: cadenceFor(family),
    maturity: reached,
    stepReached: reachableStep(),
    blockedAt: firstBlockingStep(),
    // Not restated. Read from the same function legacy.mjs uses, so a
    // second history cannot come into existence and disagree.
    //
    // The shape is legacy.mjs's own — { available, issued, lastChanged,
    // total, rows } — and is passed through untouched. It defaulted to
    // [] here, which was a second shape for the same field and would
    // have made `versions.rows` throw for any title without an
    // artefact. null says "no artefact, so no history" without
    // pretending to be an empty one.
    versions: artefact ? revisionHistory(artefact) : null,
    roles: ROLES.map((r) => ({ role: r.name, holder: r.holder, discharge: r.discharge })),
  };
}

/** The honest summary a governance reader wants first. */
export function institutionalState() {
  const running = PROCESSES.filter((p) => p.exists).length;
  return {
    roles: ROLES.length,
    vacant: vacancies().length,
    processesRunning: running,
    processesNamed: PROCESSES.length,
    furthestReachable: reachableStep(),
    blockedAt: firstBlockingStep(),
    qualityMechanised: QUALITY.filter((q) => q.mechanised).length,
    qualityUnanswered: QUALITY.filter((q) => !q.mechanised).length,
    families: FAMILIES.length,
  };
}
