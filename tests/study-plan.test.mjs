// functions/_lib/student/study-plan.js — where a learner is, and what
// they should open next.
//
// The gap this closes was invisible from inside the code: the Listening
// Lab opens at /listening-lab.html?unit=<id> and without that parameter
// says "No unit specified. Open this page from a module." There was no
// module page. A signed-in learner could not reach a lesson at all.
//
// So the assertions here are mostly about states nobody thinks to
// build for — no enrolment, a level with no content loaded, every unit
// finished — because those are what a learner actually meets on a
// platform in its first months, and each one has a different honest
// answer.
import { readFileSync } from 'node:fs';
import { makeD1 } from './d1-shim.mjs';
import { ROOT, loadUrl } from './helpers.mjs';

const plan = await import(loadUrl('functions/_lib/student/study-plan.js'));

let pass = 0, fail = 0;
const check = (label, cond, detail) => {
  console.log((cond ? 'PASS ' : 'FAIL ') + label + (cond || detail === undefined ? '' : ` — ${detail}`));
  cond ? pass++ : fail++;
};

const schema = readFileSync(`${ROOT}/sql/schema.sql`, 'utf8');

function freshEnv() {
  const env = { DB: makeD1(schema) };
  const run = (sql) => env.DB.prepare(sql).bind().run();
  run(`INSERT INTO users (id, auth_provider, auth_provider_id, email, role)
       VALUES ('usr_l','clerk','c_l','learner@example.com','student')`);
  // programme_levels is seeded by schema.sql; confirm rather than assume.
  return { env, run };
}

// The six courses are seeded by schema.sql — one per level, always
// present. What varies is whether that course has any UNITS, which is
// exactly the "awaiting content" state a part-seeded deployment is in.
function addCourse(run, levelId, unitTitles) {
  unitTitles.forEach((t, i) => {
    run(`INSERT INTO units (id, course_id, sequence, title)
         VALUES ('unt_${levelId}_${i + 1}', 'crs_level_${levelId}', ${i + 1}, '${t.replace(/'/g, "''")}')`);
  });
}
const enrol = (run, levelId, status) =>
  run(`INSERT INTO enrolments (id, user_id, level_id, status, started_at)
       VALUES ('enr_${levelId}', 'usr_l', ${levelId}, '${status}', '2026-01-01T00:00:00.000Z')`);
const progress = (run, unitId, status) =>
  run(`INSERT INTO unit_progress (id, user_id, unit_id, status)
       VALUES ('uprg_${unitId}', 'usr_l', '${unitId}', '${status}')`);

// ---------------------------------------------------------------------
// The states nobody builds for
// ---------------------------------------------------------------------
{
  const { env } = freshEnv();
  const p = await plan.buildStudyPlan(env, 'usr_l');
  check('A learner with no enrolment is told so, not shown an empty list',
    p.state === 'no_enrolment', p.state);
  check('...with no next unit invented', p.nextUnit === null);
  check('...and no level claimed', p.level === null);
}

{
  // Enrolled into a level whose course has not been loaded. Real: six
  // levels are authored, and a deployment can be part way through
  // seeding them.
  const { env, run } = freshEnv();
  enrol(run, 1, 'active');
  const p = await plan.buildStudyPlan(env, 'usr_l');
  check('An enrolment with no content loaded says "awaiting content"',
    p.state === 'awaiting_content', p.state);
  check('...and still names the level, so the learner knows where they are',
    p.level && p.level.id === 1 && p.level.roman === 'I', JSON.stringify(p.level));
  check('...but offers nothing to open', p.nextUnit === null && p.units.length === 0);
}

// ---------------------------------------------------------------------
// The ordinary case
// ---------------------------------------------------------------------
{
  const { env, run } = freshEnv();
  enrol(run, 1, 'active');
  addCourse(run, 1, ['Greetings', 'Everyday Objects', 'Family & Routines']);

  const p = await plan.buildStudyPlan(env, 'usr_l');
  check('A newly enrolled learner is pointed at the first unit',
    p.nextUnit && p.nextUnit.sequence === 1 && /Greetings/.test(p.nextUnit.title), JSON.stringify(p.nextUnit));
  check('...described as not started rather than in progress', p.state === 'not_started', p.state);
  check('...counted honestly', p.completedCount === 0 && p.totalCount === 3, `${p.completedCount}/${p.totalCount}`);

  // The whole point: a link that actually opens the lesson. The Lab
  // needs ?unit=<id> and there was previously nothing producing it.
  check('The next unit carries a working Lab link',
    p.nextUnit.href === '/listening-lab.html?unit=unt_1_1', p.nextUnit.href);
  check('...and every unit does, so the list is navigable too',
    p.units.every((u) => u.href === `/listening-lab.html?unit=${u.id}`), p.units.map((u) => u.href).join(' '));
}

// ---------------------------------------------------------------------
// Resume before advance
// ---------------------------------------------------------------------
// A half-finished unit is where the learner actually is. Sending them
// past it to the next untouched one loses their place, which is the
// single most irritating thing a learning platform can do.
{
  const { env, run } = freshEnv();
  enrol(run, 1, 'active');
  addCourse(run, 1, ['Greetings', 'Everyday Objects', 'Family & Routines']);
  progress(run, 'unt_1_1', 'completed');
  progress(run, 'unt_1_2', 'in_progress');

  const p = await plan.buildStudyPlan(env, 'usr_l');
  check('A unit in progress is resumed, not skipped',
    p.nextUnit && p.nextUnit.id === 'unt_1_2', JSON.stringify(p.nextUnit));
  check('...and the learner is told it is a resume, not a start',
    p.nextUnit.resuming === true, p.nextUnit.resuming);
  check('...with progress counted from completed units only',
    p.completedCount === 1 && p.totalCount === 3, `${p.completedCount}/${p.totalCount}`);
  check('...and the state reads in_progress', p.state === 'in_progress', p.state);
}

{
  // Nothing in progress: the first untouched unit is next, even though
  // an earlier one is complete.
  const { env, run } = freshEnv();
  enrol(run, 1, 'active');
  addCourse(run, 1, ['A', 'B', 'C']);
  progress(run, 'unt_1_1', 'completed');
  const p = await plan.buildStudyPlan(env, 'usr_l');
  check('With nothing in progress, the first untouched unit is next',
    p.nextUnit.id === 'unt_1_2' && p.nextUnit.resuming === false, JSON.stringify(p.nextUnit));
}

// ---------------------------------------------------------------------
// Every unit finished — and the line this refuses to cross
// ---------------------------------------------------------------------
// Whether finishing the units means the LEVEL is passed is governance
// item B4, and no definition has been adopted. A dashboard saying
// "Level II unlocked" would invent the progression rule in the one
// place a learner would believe it.
{
  const { env, run } = freshEnv();
  enrol(run, 1, 'active');
  addCourse(run, 1, ['A', 'B']);
  progress(run, 'unt_1_1', 'completed');
  progress(run, 'unt_1_2', 'completed');

  const p = await plan.buildStudyPlan(env, 'usr_l');
  check('Every unit finished reports units_complete', p.state === 'units_complete', p.state);
  check('...with no next unit', p.nextUnit === null);
  check('...and the level still listed as the current one, not silently advanced',
    p.level.id === 1, JSON.stringify(p.level));
  check('...and the count says all of them', p.completedCount === 2 && p.totalCount === 2);
  check('The plan never claims a level is passed — that is not its decision',
    !('levelPassed' in p) && !('unlocked' in p) && !('nextLevel' in p), Object.keys(p).join(', '));
}

// ---------------------------------------------------------------------
// Several active enrolments at once — the LOWEST is the one to work on
// ---------------------------------------------------------------------
// Executive Decision #1 enrols a full-programme payer into Level I
// immediately and unlocks later levels as earlier ones complete, so
// holding more than one active enrolment is normal. Sending a learner
// to the highest would skip the work they are meant to be doing.
{
  const { env, run } = freshEnv();
  enrol(run, 1, 'active');
  enrol(run, 2, 'active');
  addCourse(run, 1, ['Level I unit']);
  addCourse(run, 2, ['Level II unit']);

  const p = await plan.buildStudyPlan(env, 'usr_l');
  check('With two active levels the LOWER one is the current one',
    p.level.id === 1, JSON.stringify(p.level));
  check('...and the next unit comes from it', p.nextUnit.id === 'unt_1_1', p.nextUnit.id);
}

{
  // Level I completed, Level II active: the completed one is history
  // and the active one is the work.
  const { env, run } = freshEnv();
  enrol(run, 1, 'completed');
  enrol(run, 2, 'active');
  addCourse(run, 2, ['Life Stories']);
  const p = await plan.buildStudyPlan(env, 'usr_l');
  check('A completed level moves aside for the active one', p.level.id === 2, JSON.stringify(p.level));
  check('...and is still listed as completed, so progress is visible',
    p.completedLevels.length === 1 && p.completedLevels[0].id === 1, JSON.stringify(p.completedLevels));
}

{
  // Every enrolment completed. Not the same as never having enrolled,
  // and saying "you have no enrolment" to somebody who finished the
  // programme would be a poor way to end it.
  const { env, run } = freshEnv();
  enrol(run, 1, 'completed');
  const p = await plan.buildStudyPlan(env, 'usr_l');
  check('A learner who has completed everything is not told they have no enrolment',
    p.state === 'programme_complete', p.state);
  check('...and their completed levels are still reported',
    p.completedLevels.length === 1, JSON.stringify(p.completedLevels));
}

// ---------------------------------------------------------------------
// Withdrawn enrolments are not work
// ---------------------------------------------------------------------
{
  const { env, run } = freshEnv();
  enrol(run, 1, 'withdrawn');
  addCourse(run, 1, ['A']);
  const p = await plan.buildStudyPlan(env, 'usr_l');
  check('A withdrawn enrolment does not become the current level',
    p.state === 'no_enrolment' && p.level === null, p.state);
}

// ---------------------------------------------------------------------
// One learner's plan is their own
// ---------------------------------------------------------------------
{
  const { env, run } = freshEnv();
  run(`INSERT INTO users (id, auth_provider, auth_provider_id, email, role)
       VALUES ('usr_other','clerk','c_o','other@example.com','student')`);
  enrol(run, 1, 'active');
  addCourse(run, 1, ['A', 'B']);
  progress(run, 'unt_1_1', 'completed');

  const mine = await plan.buildStudyPlan(env, 'usr_l');
  const theirs = await plan.buildStudyPlan(env, 'usr_other');
  check('Another learner does not inherit my progress',
    mine.completedCount === 1 && theirs.state === 'no_enrolment',
    `${mine.completedCount} vs ${theirs.state}`);
}

// ---------------------------------------------------------------------
// Pace — the learner's own rate against the published design
// ---------------------------------------------------------------------
// Four months per level is in the database (programme_levels), so this
// compares against a real specification. It is measured in MODULES,
// because all sixty exist; the 120-learning-units-per-level figure is a
// design the content has not caught up with, and measuring against a
// number the platform cannot show would be wrong for everybody.
//
// `now` is injected throughout. A test that reads the clock passes on
// Tuesday and fails on the last day of February.
const DAY = 86400000;
const T0 = Date.parse('2026-01-01T00:00:00.000Z');
const at = (days) => T0 + days * DAY;

{
  const { env, run } = freshEnv();
  enrol(run, 1, 'active');                       // started_at '2026-01-01'
  addCourse(run, 1, ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H', 'I', 'J']); // ten modules, as designed

  // Day 61 of a 4-month (≈122-day) level: half way, so five of ten.
  const half = await plan.buildStudyPlan(env, 'usr_l', { now: at(61) });
  check('Pace says what the designed rate would have reached by now',
    half.pace && half.pace.expectedByNow === 5, half.pace && half.pace.expectedByNow);
  check('...and a learner who has done none of it is behind',
    half.pace.standing === 'behind', half.pace.standing);
  check('...with elapsed time reported, not just a verdict',
    half.pace.elapsedDays === 61, half.pace.elapsedDays);
  check('...and the designed length it is being judged against',
    half.pace.designMonths === 4, half.pace.designMonths);
}

{
  const { env, run } = freshEnv();
  enrol(run, 1, 'active');
  addCourse(run, 1, ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H', 'I', 'J']);
  progress(run, 'unt_1_1', 'completed');
  progress(run, 'unt_1_2', 'completed');
  progress(run, 'unt_1_3', 'completed');
  progress(run, 'unt_1_4', 'completed');
  progress(run, 'unt_1_5', 'completed');

  const p = await plan.buildStudyPlan(env, 'usr_l', { now: at(61) });
  check('A learner exactly at the designed rate reads on_track',
    p.pace.standing === 'on_track', `${p.completedCount} vs ${p.pace.expectedByNow} -> ${p.pace.standing}`);

  // Ordinary fortnight-to-fortnight variation must not read as failure.
  const slightly = await plan.buildStudyPlan(env, 'usr_l', { now: at(73) });
  check('...and one module of ordinary variation is still on_track, not "behind"',
    slightly.pace.standing === 'on_track', `${slightly.completedCount} vs ${slightly.pace.expectedByNow} -> ${slightly.pace.standing}`);
}

{
  const { env, run } = freshEnv();
  enrol(run, 1, 'active');
  addCourse(run, 1, ['A', 'B', 'C', 'D', 'E']);
  progress(run, 'unt_1_1', 'completed');
  progress(run, 'unt_1_2', 'completed');
  progress(run, 'unt_1_3', 'completed');
  progress(run, 'unt_1_4', 'completed');
  const p = await plan.buildStudyPlan(env, 'usr_l', { now: at(30) });
  check('A learner ahead of the designed rate is told so',
    p.pace.standing === 'ahead', `${p.completedCount} vs ${p.pace.expectedByNow}`);
}

// --- Refusing to project when a projection would be noise ------------
{
  const { env, run } = freshEnv();
  enrol(run, 1, 'active');
  addCourse(run, 1, ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H', 'I', 'J']);
  progress(run, 'unt_1_1', 'completed');
  progress(run, 'unt_1_2', 'completed');

  const early = await plan.buildStudyPlan(env, 'usr_l', { now: at(3) });
  check('Two modules in three days is not a rate — no finish date is offered',
    early.pace.projectable === false && early.pace.projectedFinish === null, JSON.stringify(early.pace));

  const settled = await plan.buildStudyPlan(env, 'usr_l', { now: at(24) });
  check('After a fortnight and a couple of modules, a projection is offered',
    settled.pace.projectable === true && !!settled.pace.projectedFinish, JSON.stringify(settled.pace));
  check('...as a plain date a learner can plan around',
    /^\d{4}-\d{2}-\d{2}$/.test(settled.pace.projectedFinish || ''), settled.pace.projectedFinish);
  // 2 modules in 24 days -> 12 days each -> 8 remaining -> 96 days out.
  check('...computed from their actual rate, not the designed one',
    settled.pace.projectedFinish === new Date(at(24) + 96 * DAY).toISOString().slice(0, 10),
    settled.pace.projectedFinish);
}

{
  // A rate implying four times the designed length has not settled.
  // "You will finish in 2031" is worse than saying nothing.
  const { env, run } = freshEnv();
  enrol(run, 1, 'active');
  addCourse(run, 1, ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H', 'I', 'J']);
  progress(run, 'unt_1_1', 'completed');
  progress(run, 'unt_1_2', 'completed');
  const p = await plan.buildStudyPlan(env, 'usr_l', { now: at(200) });
  check('An unsettled, very slow rate produces no projection rather than an absurd date',
    p.pace.projectable === false && p.pace.projectedFinish === null, JSON.stringify(p.pace));
  check('...but the learner is still told plainly they are behind',
    p.pace.standing === 'behind', p.pace.standing);
}

{
  // Nothing finished at all: expected is reported, no projection from
  // a rate of zero (which would divide by nothing and mean nothing).
  const { env, run } = freshEnv();
  enrol(run, 1, 'active');
  addCourse(run, 1, ['A', 'B', 'C']);
  const p = await plan.buildStudyPlan(env, 'usr_l', { now: at(40) });
  check('With nothing completed there is no projection', p.pace.projectable === false);
  check('...but there is still an expectation to compare against', p.pace.expectedByNow >= 0, p.pace.expectedByNow);
}

{
  // Expected can never exceed the level. "Expected 14 of 10" is
  // nonsense a learner would rightly distrust.
  const { env, run } = freshEnv();
  enrol(run, 1, 'active');
  addCourse(run, 1, ['A', 'B', 'C']);
  const p = await plan.buildStudyPlan(env, 'usr_l', { now: at(900) });
  check('Expected-by-now is capped at the size of the level',
    p.pace.expectedByNow === 3, p.pace.expectedByNow);
}

// --- What pace deliberately does not carry ---------------------------
// Access does not expire, nothing is withdrawn, no extension is
// chargeable. None of those policies exists, and each carries
// contractual weight. This reports; it does not enforce.
{
  const { env, run } = freshEnv();
  enrol(run, 1, 'active');
  addCourse(run, 1, ['A', 'B']);
  const p = await plan.buildStudyPlan(env, 'usr_l', { now: at(400) });
  check('Pace carries no deadline, expiry or penalty field',
    !('deadline' in p.pace) && !('expiresAt' in p.pace) && !('atRisk' in p.pace) && !('locked' in p.pace),
    Object.keys(p.pace).join(', '));
  check('...and a long-overdue learner still has their next unit offered',
    p.nextUnit !== null, JSON.stringify(p.nextUnit));
}

{
  // No enrolment, no pace. There is nothing to measure and inventing a
  // zero would render as "behind".
  const { env } = freshEnv();
  const p = await plan.buildStudyPlan(env, 'usr_l', { now: at(30) });
  check('A learner with no enrolment has no pace, not a pace of zero', p.pace === null);
}

console.log(`\n${pass} passed, ${fail} failed.`);
process.exit(fail ? 1 : 0);
