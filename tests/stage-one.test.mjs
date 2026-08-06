/**
 * STAGE 1 — IEFC LEVEL I.
 *
 * The directive that created this register also created two ways to
 * cheat it, and both are checked here rather than trusted:
 *
 *   Padding — adding resources to make the list look complete. Every
 *     resource must name a completion criterion it serves and at least
 *     one of the eight educational dimensions it improves, both drawn
 *     from closed vocabularies. A row that improves nothing fails.
 *
 *   Flattering the headline — reporting readiness as a share of the
 *     list, so that publishing fourteen easy volumes moves the number
 *     while the stage stays unteachable. Readiness is a property of the
 *     criteria, and the assertion below breaks if it ever becomes an
 *     average of the rows.
 *
 * And the standing rule: no status is typed. The status assertions run
 * against a deliberately emptied inventory, so a register that reported
 * DERIVABLE from a hard-coded field rather than from a measurement
 * would fail here.
 */
import { pathToFileURL } from 'node:url';
import path from 'node:path';

const ROOT = path.resolve(path.dirname(new URL(import.meta.url).pathname), '..');
const load = (p) => import(pathToFileURL(path.join(ROOT, p)).href).then((m) => m);

const S = await load('scripts/publication/stage.mjs');

let pass = 0;
let fail = 0;
const check = (name, ok, detail = '') => {
  if (ok) { pass += 1; console.log(`PASS ${name}`); } else {
    fail += 1;
    console.log(`FAIL ${name}${detail ? ` — ${detail}` : ''}`);
  }
};

// ── 1 · The stage model ──────────────────────────────────────────────

check('six stages, one per level, in level order',
  S.STAGES.length === 6 && S.STAGES.every((s, i) => s.n === i + 1),
  S.STAGES.map((s) => s.roman).join(' '));

check('exactly one stage is active',
  S.STAGES.filter((s) => s.state === 'active').length === 1,
  S.STAGES.filter((s) => s.state === 'active').map((s) => s.n).join(','));

// The vertical rule, mechanised: nothing after the active stage may
// have been started. If someone marks Stage 2 active or in progress
// while Stage 1 is open, this fails rather than being noticed later.
check('no stage after the active one has been started',
  S.STAGES.filter((s) => s.n > S.ACTIVE.n).every((s) => s.state === 'not started'),
  S.STAGES.filter((s) => s.n > S.ACTIVE.n && s.state !== 'not started')
    .map((s) => `${s.n}:${s.state}`).join(' '));

check('the active stage is Level I',
  S.ACTIVE.roman === 'I', S.ACTIVE.roman);

// ── 2 · The completion criteria ──────────────────────────────────────

check('the six completion criteria from the directive are present, plus the ecosystem test',
  S.COMPLETION.length === 7
  && ['learner', 'teacher', 'examiner', 'institution', 'parent', 'employer', 'ecosystem']
    .every((k) => S.COMPLETION.some((c) => c.key === k)),
  S.COMPLETION.map((c) => c.key).join(' '));

check('every criterion says what it means in more than a phrase',
  S.COMPLETION.every((c) => c.means.length > 80 && c.who && c.can),
  S.COMPLETION.filter((c) => c.means.length <= 80).map((c) => c.key).join(' '));

// ── 3 · The Permanent Academic Rule, mechanised ──────────────────────

const KNOWN_IMPROVES = new Set(S.IMPROVES);
const KNOWN_CRITERIA = new Set(S.COMPLETION.map((c) => c.key));

check('every resource improves at least one declared educational dimension',
  S.RESOURCES.every((r) => Array.isArray(r.improves) && r.improves.length >= 1),
  S.RESOURCES.filter((r) => !r.improves?.length).map((r) => r.name).join(' · '));

check('no resource claims a dimension outside the eight in the rule',
  S.RESOURCES.every((r) => r.improves.every((i) => KNOWN_IMPROVES.has(i))),
  S.RESOURCES.flatMap((r) => r.improves.filter((i) => !KNOWN_IMPROVES.has(i))).join(' · '));

check('every resource serves at least one completion criterion',
  S.RESOURCES.every((r) => Array.isArray(r.serves) && r.serves.length >= 1),
  S.RESOURCES.filter((r) => !r.serves?.length).map((r) => r.name).join(' · '));

check('no resource serves a criterion that does not exist',
  S.RESOURCES.every((r) => r.serves.every((k) => KNOWN_CRITERIA.has(k))),
  S.RESOURCES.flatMap((r) => r.serves.filter((k) => !KNOWN_CRITERIA.has(k))).join(' · '));

check('every completion criterion is served by at least one resource',
  S.COMPLETION.every((c) => S.RESOURCES.some((r) => r.serves.includes(c.key))),
  S.COMPLETION.filter((c) => !S.RESOURCES.some((r) => r.serves.includes(c.key)))
    .map((c) => c.key).join(' · '));

check('every resource names an owner from the four who can be blocked',
  S.RESOURCES.every((r) => Object.values(S.OWNER).includes(r.owner)),
  S.RESOURCES.filter((r) => !Object.values(S.OWNER).includes(r.owner))
    .map((r) => r.name).join(' · '));

// ── 4 · Requirements are measured, not asserted ──────────────────────

const INV = S.inventoryL1();
const ROWS = S.stageOne();

check('every resource either states countable requirements or states why it cannot',
  S.RESOURCES.every((r) => r.needs.length > 0 || (r.unsupported && r.why)),
  S.RESOURCES.filter((r) => !r.needs.length && !(r.unsupported && r.why))
    .map((r) => r.name).join(' · '));

check('every requirement names a key the inventory actually measures',
  S.RESOURCES.every((r) => r.needs.every((n) => Object.hasOwn(INV, n.key))),
  S.RESOURCES.flatMap((r) => r.needs.filter((n) => !Object.hasOwn(INV, n.key))
    .map((n) => `${r.name}:${n.key}`)).join(' · '));

check('every unsupported resource states what is missing at length, not with a shrug',
  S.RESOURCES.filter((r) => r.unsupported).every((r) => r.why.length > 120),
  S.RESOURCES.filter((r) => r.unsupported && r.why.length <= 120).map((r) => r.name).join(' · '));

// The sabotage. Every requirement is measured against an inventory of
// zeroes; nothing may still report as available. A register that typed
// its statuses would pass this, which is exactly why it runs.
const EMPTY = Object.fromEntries(Object.keys(INV).map((k) => [k, 0]));
const SABOTAGED = S.RESOURCES.filter((r) => !r.artefact && !r.unsupported)
  .map((r) => S.resolve(r, EMPTY));

check('with nothing measured, no unpublished resource reports as derivable',
  SABOTAGED.every((r) => r.status !== S.STATUS.DERIVABLE),
  SABOTAGED.filter((r) => r.status === S.STATUS.DERIVABLE).map((r) => r.name).join(' · '));

check('a shortfall is reported as a number, so the size of the job is visible',
  SABOTAGED.every((r) => r.short.every((s) => typeof s.deficit === 'number' && s.deficit > 0)),
  SABOTAGED.flatMap((r) => r.short.filter((s) => !(s.deficit > 0)).map((s) => s.key)).join(' · '));

check('a published resource names the file that exists and the script that makes it',
  ROWS.filter((r) => r.status === S.STATUS.PUBLISHED).every((r) => r.artefact && r.build),
  ROWS.filter((r) => r.status === S.STATUS.PUBLISHED && !(r.artefact && r.build))
    .map((r) => r.name).join(' · '));

check('at least one resource is published, or the register is describing nothing',
  ROWS.some((r) => r.status === S.STATUS.PUBLISHED),
  String(ROWS.filter((r) => r.status === S.STATUS.PUBLISHED).length));

// ── 5 · Measurement is scoped to Level I ─────────────────────────────
//
// The whole point of the stage model is that a Level I resource cannot
// pass on Level IV's material. Level I has 19 teaching lessons of 114
// and 10 modules of 60; if either count arrives at the programme-wide
// figure, the inventory has leaked out of the stage.

check('the inventory counts Level I and not the programme',
  INV.teachingLessons === 19 && INV.modules === 10 && INV.items === 49,
  `${INV.teachingLessons} lessons · ${INV.modules} modules · ${INV.items} items`);

check('no measured key exceeds what Level I could contain',
  INV.selfChecks <= INV.teachingLessons && INV.rubrics <= INV.items
  && INV.recordings <= INV.listeningScripts,
  `${INV.selfChecks}/${INV.teachingLessons} · ${INV.rubrics}/${INV.items}`);

// Vocabulary is measured three ways because one of them flatters.
// Twenty-eight lessons carry a vocabulary stage; only a small number
// list the words a flashcard would need. If word lists ever equals
// stages, the honest distinction has been lost.
check('vocabulary word lists are counted apart from vocabulary stages',
  INV.vocabularyWordLists < INV.vocabularyStages
  && INV.collocationEntries > 0,
  `${INV.vocabularyWordLists} lists · ${INV.collocationEntries} collocations `
  + `· ${INV.vocabularyStages} stages`);

check('the terminology glossary is not counted as level vocabulary',
  INV.terminologyHeadwords !== INV.vocabularyWords,
  `${INV.terminologyHeadwords} vs ${INV.vocabularyWords}`);

// ── 6 · Readiness cannot be flattered ────────────────────────────────

const RD = S.readiness(ROWS);

check('readiness reports the criteria figure and the resource figure separately',
  typeof RD.stagePct === 'number' && typeof RD.resourcePct === 'number'
  && RD.criteriaTotal === S.COMPLETION.length,
  `stage ${RD.stagePct}% · resources ${RD.resourcePct}%`);

check('the headline figure is the criteria figure, not an average of the rows',
  RD.stagePct === Math.round((RD.criteriaSatisfied / RD.criteriaTotal) * 100),
  `${RD.stagePct} vs ${RD.criteriaSatisfied}/${RD.criteriaTotal}`);

check('an unsatisfied criterion names every resource blocking it',
  RD.criteria.filter((c) => !c.satisfied).every((c) => c.blockers.length > 0
    && c.blockers.every((b) => b.name && b.status && b.owner)),
  RD.criteria.filter((c) => !c.satisfied && !c.blockers.length).map((c) => c.key).join(' · '));

check('a satisfied criterion has no blockers, and the counts agree',
  RD.criteria.every((c) => c.satisfied === (c.blockers.length === 0)
    && c.available === c.total - c.blockers.length),
  RD.criteria.map((c) => `${c.key}:${c.available}/${c.total}`).join(' '));

// Classroom readiness is not the same question as publication
// readiness, and collapsing them would let the stage be declared ready
// for a room it cannot yet be administered in.
check('classroom readiness and publication readiness are separate questions',
  RD.classroomReady === (RD.criteria.find((c) => c.key === 'teacher').satisfied
    && RD.criteria.find((c) => c.key === 'learner').satisfied)
  && RD.publicationReady === RD.criteria.every((c) => c.satisfied),
  `classroom ${RD.classroomReady} · publication ${RD.publicationReady}`);

check('the stage is not reported ready while any criterion is unsatisfied',
  RD.publicationReady === (RD.criteriaSatisfied === RD.criteriaTotal),
  `${RD.criteriaSatisfied}/${RD.criteriaTotal} · ready ${RD.publicationReady}`);

// A resource the curriculum does not support still blocks its
// criterion. An absence with a good reason is still an absence, and a
// register that excused itself would report a preference.
check('an unsupported resource still blocks the criterion it serves',
  S.RESOURCES.filter((r) => r.unsupported).every((r) => r.serves.every((k) =>
    RD.criteria.find((c) => c.key === k).blockers.some((b) => b.name === r.name))),
  S.RESOURCES.filter((r) => r.unsupported).map((r) => r.name).join(' · '));

// ── 7 · The report buckets the directive asks for ────────────────────

const REP = S.report(ROWS);

check('the report splits the register into the buckets the directive names',
  ['completed', 'derivable', 'remaining', 'academicAuthoring', 'governance',
    'externalReview', 'unsupported'].every((k) => Array.isArray(REP[k])),
  Object.keys(REP).join(' '));

check('completed plus remaining plus derivable accounts for every resource',
  REP.completed.length + REP.derivable.length + REP.remaining.length === ROWS.length,
  `${REP.completed.length}+${REP.derivable.length}+${REP.remaining.length} of ${ROWS.length}`);

check('nothing appears in both the completed and the remaining bucket',
  !REP.completed.some((c) => REP.remaining.some((r) => r.name === c.name)),
  REP.completed.filter((c) => REP.remaining.some((r) => r.name === c.name))
    .map((c) => c.name).join(' · '));

check('every resource blocked on academic authoring says so and is not counted as editorial',
  REP.academicAuthoring.every((r) => r.owner === S.OWNER.ACADEMIC),
  REP.academicAuthoring.filter((r) => r.owner !== S.OWNER.ACADEMIC)
    .map((r) => r.name).join(' · '));

check('every resource blocked on governance is blocked on an authority, not on effort',
  REP.governance.every((r) => r.owner === S.OWNER.GOVERNANCE),
  REP.governance.filter((r) => r.owner !== S.OWNER.GOVERNANCE).map((r) => r.name).join(' · '));

check('no resource name appears twice in the register',
  new Set(S.RESOURCES.map((r) => r.name)).size === S.RESOURCES.length,
  S.RESOURCES.map((r) => r.name)
    .filter((n, i, a) => a.indexOf(n) !== i).join(' · '));

// The honest finding this register exists to keep visible: nothing an
// employer reads is available, because every one of those resources
// rests on a competency mapping that does not exist. If this assertion
// ever passes silently it will be because the mapping was done, and it
// should be re-read then rather than deleted.
check('the employer criterion is blocked, and every blocker traces to the competency mapping',
  RD.criteria.find((c) => c.key === 'employer').blockers.length > 0
  && ROWS.filter((r) => r.serves.includes('employer') && r.short.length)
    .every((r) => r.short.some((s) => s.key === 'competencyMappedAssessments')),
  RD.criteria.find((c) => c.key === 'employer').blockers.map((b) => b.name).join(' · '));

console.log(`\n${pass} passed, ${fail} failed`);
if (fail) process.exitCode = 1;
