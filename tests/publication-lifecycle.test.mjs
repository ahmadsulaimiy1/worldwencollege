/**
 * THE ACADEMIC LIFECYCLE.
 *
 * Two things are at risk here and both are asserted rather than
 * intended.
 *
 * DUPLICATION. Four of the directive's eight properties already live in
 * legacy.mjs. A lifecycle module is exactly the kind of file that
 * restates them "for completeness" and produces a second version free
 * to disagree with the first. The properties map declares where each
 * one lives, and the assertions below check that the delegated ones are
 * genuinely delegated — lifecycleOf's version history must be the same
 * array legacy.mjs returns, not a lookalike.
 *
 * INVENTED PEOPLE. Roles are cheap to write and read as substance. Six
 * posts exist and every one is vacant; the assertion that they stay
 * vacant is the single most important line in this file, because the
 * day a name appears in it, this Press starts claiming an academic
 * office that nobody holds.
 */
import { pathToFileURL } from 'node:url';
import path from 'node:path';

const ROOT = path.resolve(path.dirname(new URL(import.meta.url).pathname), '..');
const load = (p) => import(pathToFileURL(path.join(ROOT, p)).href);

const L = await load('scripts/publication/lifecycle.mjs');
const LEG = await load('scripts/publication/legacy.mjs');

let pass = 0;
let fail = 0;
const check = (name, ok, detail = '') => {
  if (ok) { pass += 1; console.log(`PASS ${name}`); } else {
    fail += 1;
    console.log(`FAIL ${name}${detail ? ` — ${detail}` : ''}`);
  }
};

// ── 1 · The eight properties, and no duplication ─────────────────────

const EIGHT = ['author', 'reviewer', 'approval', 'revisionCycle',
  'versionHistory', 'qualityReview', 'retirement', 'archival'];

check('all eight lifecycle properties the directive names are accounted for',
  L.PROPERTIES.length === 8 && EIGHT.every((k) => L.PROPERTIES.some((p) => p.key === k)),
  L.PROPERTIES.map((p) => p.key).join(' '));

check('every property names the file that owns it',
  L.PROPERTIES.every((p) => p.where === L.HERE || p.where === L.LEGACY),
  L.PROPERTIES.filter((p) => ![L.HERE, L.LEGACY].includes(p.where)).map((p) => p.key).join(' '));

check('every property explains its placement at length, so it is not re-added elsewhere',
  L.PROPERTIES.every((p) => p.why && p.why.length > 60),
  L.PROPERTIES.filter((p) => !p.why || p.why.length <= 60).map((p) => p.key).join(' '));

check('some properties are delegated — this file is an addition, not a restatement',
  L.PROPERTIES.some((p) => p.where === L.LEGACY)
  && L.PROPERTIES.some((p) => p.where === L.HERE),
  `${L.PROPERTIES.filter((p) => p.where === L.HERE).length} here · `
  + `${L.PROPERTIES.filter((p) => p.where === L.LEGACY).length} delegated`);

// The delegation has to be real. Version history is declared as living
// in legacy.mjs, so lifecycleOf must return what legacy.mjs returns for
// the same artefact — not a second history computed here.
{
  const artefact = 'publication/IEFC Complete Curriculum.pdf';
  const mine = L.lifecycleOf({ name: 'x', family: 'IEFC Student Series', artefact }).versions;
  const theirs = LEG.revisionHistory(artefact);
  // revisionHistory returns { available, issued, lastChanged, total,
  // rows } — an object, not an array. The first version of this
  // assertion tested for an array and failed against a working
  // delegation, which also exposed lifecycleOf defaulting to [] and so
  // carrying two different shapes for one field.
  check('the delegated version history is legacy.mjs’s, not a second one computed here',
    mine && theirs && mine.total === theirs.total
    && Array.isArray(mine.rows) && JSON.stringify(mine) === JSON.stringify(theirs),
    `${mine?.total} commits vs ${theirs?.total}`);

  check('a title with no artefact has no history, rather than an empty one of a different shape',
    L.lifecycleOf({ name: 'unbuilt', family: 'IEFC Student Series' }).versions === null,
    JSON.stringify(L.lifecycleOf({ name: 'unbuilt', family: 'IEFC Student Series' }).versions));
}

// ── 2 · Nobody holds any office ──────────────────────────────────────

check('six roles exist, each with a remit',
  L.ROLES.length === 6 && L.ROLES.every((r) => r.remit && r.remit.length > 50),
  L.ROLES.filter((r) => !r.remit || r.remit.length <= 50).map((r) => r.key).join(' '));

// THE LINE THAT MATTERS. A name here is a claim that a real person
// holds an academic office at this College.
check('every post is vacant — no role names a person',
  L.ROLES.every((r) => r.holder === null),
  L.ROLES.filter((r) => r.holder !== null).map((r) => `${r.key}:${r.holder}`).join(' · '));

check('vacancies() reports every role, because every role is vacant',
  L.vacancies().length === L.ROLES.length,
  `${L.vacancies().length} of ${L.ROLES.length}`);

check('every role says who discharges the work in the meantime, including “nobody”',
  L.ROLES.every((r) => r.discharge && r.discharge.length > 30),
  L.ROLES.filter((r) => !r.discharge).map((r) => r.key).join(' '));

// Two of the six are genuinely undischarged. If every role claimed a
// stand-in, the vacancy model would be decorative.
check('at least two roles are discharged by nobody, stated plainly',
  L.ROLES.filter((r) => /^Nobody\./.test(r.discharge)).length >= 2,
  L.ROLES.filter((r) => /^Nobody\./.test(r.discharge)).map((r) => r.key).join(' · '));

// ── 3 · The approval pathway ─────────────────────────────────────────

check('the pathway is a numbered sequence with no gaps',
  L.PATHWAY.every((s, i) => s.n === i + 1) && L.PATHWAY.length >= 5,
  L.PATHWAY.map((s) => s.n).join(' '));

check('every step names who takes it and what it means',
  L.PATHWAY.every((s) => s.by && s.means && s.means.length > 30),
  L.PATHWAY.filter((s) => !s.by || !s.means).map((s) => s.step).join(' · '));

check('some steps are blocking and some are not — the pathway is not aspirational',
  L.PATHWAY.some((s) => s.blocking) && L.PATHWAY.some((s) => !s.blocking),
  `${L.PATHWAY.filter((s) => s.blocking).length} blocking of ${L.PATHWAY.length}`);

// The blocking steps must be contiguous at the end. A reachable step
// after a blocked one would mean the model claims a publication can
// skip review and be externally examined.
check('once the pathway blocks it stays blocked — no step is reachable past the gate',
  (() => {
    const i = L.PATHWAY.findIndex((s) => s.blocking);
    return i === -1 || L.PATHWAY.slice(i).every((s) => s.blocking);
  })(),
  L.PATHWAY.map((s) => (s.blocking ? 'X' : '.')).join(''));

check('the furthest reachable step comes before the first blocking one',
  L.reachableStep().n < L.firstBlockingStep().n,
  `reached ${L.reachableStep().n} · blocked at ${L.firstBlockingStep().n}`);

// The honest finding. Production is as far as anything gets.
check('nothing in this Press can currently pass academic review',
  L.firstBlockingStep().step === 'Academically reviewed',
  L.firstBlockingStep().step);

// ── 4 · Revision cadence ─────────────────────────────────────────────

const FAMILY_KEYS = LEG.FAMILIES.map((f) => f.key);
const NAMED = L.CADENCE.flatMap((c) => c.families);

// This caught four families that did not exist — 'IEFC Teacher Library'
// for 'IEFC Teacher Series', and three others invented outright. A
// cadence naming a family that is not real returns null silently, which
// looks like a title with no revision cycle rather than like a typo.
check('every family named in a cadence is a real family',
  NAMED.every((n) => FAMILY_KEYS.includes(n)),
  NAMED.filter((n) => !FAMILY_KEYS.includes(n)).join(' · '));

check('every family has a cadence',
  FAMILY_KEYS.every((f) => L.cadenceFor(f) !== null),
  FAMILY_KEYS.filter((f) => !L.cadenceFor(f)).join(' · '));

check('no family is given two cadences',
  new Set(NAMED).size === NAMED.length,
  NAMED.filter((n, i) => NAMED.indexOf(n) !== i).join(' · '));

check('cadences differ — a single house rule for every family would be no model at all',
  new Set(L.CADENCE.map((c) => c.cycle)).size === L.CADENCE.length && L.CADENCE.length >= 3,
  L.CADENCE.map((c) => `${c.cycle}:${c.families.length}`).join(' '));

// The volumes derived from the curriculum must not be on a calendar:
// the curriculum can move the day after a review, and an annual cycle
// would leave them wrong for up to a year.
check('curriculum-derived families revise on change, not on a calendar',
  ['IEFC Student Series', 'IEFC Teacher Series', 'IEFC Reference Library']
    .every((f) => L.cadenceFor(f).months === null),
  ['IEFC Student Series', 'IEFC Teacher Series', 'IEFC Reference Library']
    .map((f) => `${f}:${L.cadenceFor(f).cycle}`).join(' · '));

// ── 5 · The four process questions ───────────────────────────────────

check('all four process questions the directive asks are answered',
  L.PROCESSES.length === 4 && L.PROCESSES.every((p) => p.question && p.process),
  L.PROCESSES.map((p) => p.question).join(' '));

check('every process states whether it actually exists, and the evidence',
  L.PROCESSES.every((p) => typeof p.exists === 'boolean' && p.evidence.length > 40),
  L.PROCESSES.filter((p) => typeof p.exists !== 'boolean').map((p) => p.question).join(' '));

// If all four claimed to exist, the model would be a description of an
// institution rather than of this one.
check('not every process exists — two are named and have never been run',
  L.PROCESSES.some((p) => p.exists) && L.PROCESSES.some((p) => !p.exists),
  `${L.PROCESSES.filter((p) => p.exists).length} running of ${L.PROCESSES.length}`);

check('the review and annual-improvement processes are the ones that do not exist',
  L.PROCESSES.filter((p) => !p.exists).every((p) => /review|improve/i.test(p.question)),
  L.PROCESSES.filter((p) => !p.exists).map((p) => p.question).join(' · '));

// ── 6 · Retirement ───────────────────────────────────────────────────

check('every retirement trigger states the action taken',
  L.RETIREMENT.every((r) => r.trigger && r.action && r.action.length > 30),
  L.RETIREMENT.filter((r) => !r.action).map((r) => r.trigger).join(' · '));

// The half that gets forgotten: what is owed to the person holding the
// withdrawn edition.
check('every real trigger states what is owed to the people holding the edition',
  L.RETIREMENT.filter((r) => r.owed !== null).length >= 3
  && L.RETIREMENT.filter((r) => r.owed !== null).every((r) => r.owed.length > 40),
  `${L.RETIREMENT.filter((r) => r.owed !== null).length} of ${L.RETIREMENT.length}`);

check('the register records at least one thing that is NOT a reason to withdraw a title',
  L.RETIREMENT.some((r) => r.owed === null && /Not a trigger/i.test(r.action)),
  L.RETIREMENT.filter((r) => r.owed === null).map((r) => r.trigger).join(' · '));

// ── 7 · Quality review is not readiness ──────────────────────────────

check('quality asks at least five questions, each naming who could answer it',
  L.QUALITY.length >= 5 && L.QUALITY.every((q) => q.answerableBy && q.state.length > 30),
  L.QUALITY.filter((q) => !q.answerableBy).map((q) => q.key).join(' '));

check('some quality questions are mechanised and some are not',
  L.QUALITY.some((q) => q.mechanised) && L.QUALITY.some((q) => !q.mechanised),
  `${L.QUALITY.filter((q) => q.mechanised).length} mechanised of ${L.QUALITY.length}`);

// The distinction this section exists to make. A machine can check that
// a book is well made; it cannot check that it is true.
check('no question about correctness or standard is claimed as mechanised',
  L.QUALITY.filter((q) => ['accuracy', 'pedagogy', 'standard'].includes(q.key))
    .every((q) => !q.mechanised),
  L.QUALITY.filter((q) => ['accuracy', 'pedagogy', 'standard'].includes(q.key) && q.mechanised)
    .map((q) => q.key).join(' · '));

check('the unanswered quality questions say so rather than reading as satisfied',
  L.QUALITY.filter((q) => !q.mechanised).every((q) => /unanswered|unanswerable/i.test(q.state)),
  L.QUALITY.filter((q) => !q.mechanised && !/unanswered/i.test(q.state))
    .map((q) => q.key).join(' · '));

// ── 8 · The summary a governance reader reads first ──────────────────

const S = L.institutionalState();

check('the institutional summary reports vacancies rather than burying them',
  S.vacant === S.roles && S.roles === 6,
  `${S.vacant} vacant of ${S.roles}`);

check('the summary reports how many processes run against how many are named',
  S.processesRunning === 2 && S.processesNamed === 4,
  `${S.processesRunning} of ${S.processesNamed}`);

check('the summary names the step everything is blocked at',
  S.blockedAt && S.blockedAt.blocking === true && S.furthestReachable.blocking === false,
  `${S.furthestReachable.step} → blocked at ${S.blockedAt.step}`);

check('lifecycleOf resolves a title to its cadence, state and blocking step',
  (() => {
    const r = L.lifecycleOf({
      name: 'The IEFC Level I Student Workbook',
      family: 'IEFC Student Series',
      artefact: 'publication/IEFC Level I Student Workbook.pdf',
    });
    return r.cadence.cycle === 'On change' && r.blockedAt.n === 4
      && Array.isArray(r.versions.rows) && r.versions.total > 0;
  })(),
  '');

console.log(`\n${pass} passed, ${fail} failed`);
if (fail) process.exitCode = 1;
