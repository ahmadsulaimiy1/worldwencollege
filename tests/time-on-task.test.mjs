// functions/_lib/lms/time-on-task.js — the measurement behind the
// College's measured-hours commitment.
//
// Most of these assertions are about the ways a measurement becomes a
// lie, because that is the only interesting failure mode here. Publishing
// MEASURED Guided Learning Hours is the strongest claim available to an
// institution with no accreditation, and a measurement anybody can edit
// is worth less than no measurement at all — it invites belief it has not
// earned.
//
// So: the client never supplies a duration, a beat can only ever credit
// the real interval since the last one, a tab left open overnight cannot
// bank eight hours, and a figure derived from four learners is not
// publishable however much anyone would like it to be.
//
// `now` is injected throughout. A test that reads the clock is a test
// that measures the test runner.
import { readFileSync } from 'node:fs';
import { makeD1 } from './d1-shim.mjs';
import { ROOT, loadUrl } from './helpers.mjs';

const tot = await import(loadUrl('functions/_lib/lms/time-on-task.js'));

let pass = 0, fail = 0;
const check = (label, cond, detail) => {
  console.log((cond ? 'PASS ' : 'FAIL ') + label + (cond || detail === undefined ? '' : ` — ${detail}`));
  cond ? pass++ : fail++;
};
async function throws(fn) { try { await fn(); return null; } catch (e) { return e; } }

const schema = readFileSync(`${ROOT}/sql/schema.sql`, 'utf8');
const T0 = Date.parse('2026-09-01T09:00:00.000Z');
const at = (seconds) => T0 + seconds * 1000;

function freshEnv(learners = 1) {
  const env = { DB: makeD1(schema) };
  const run = (sql) => env.DB.prepare(sql).bind().run();
  for (let i = 1; i <= learners; i++) {
    run(`INSERT INTO users (id, auth_provider, auth_provider_id, email, role)
         VALUES ('usr_${i}','clerk','c_${i}','l${i}@example.com','student')`);
  }
  for (let m = 1; m <= 3; m++) {
    run(`INSERT INTO units (id, course_id, sequence, title)
         VALUES ('unt_${m}', 'crs_level_1', ${m}, 'Module ${m}')`);
  }
  return { env, run };
}

// ---------------------------------------------------------------------
// The client never says how long it studied
// ---------------------------------------------------------------------
{
  const { env } = freshEnv();

  const first = await tot.recordBeat(env, { userId: 'usr_1', unitId: 'unt_1', now: at(0) });
  check('The opening beat credits nothing — there is no previous moment to measure from',
    first.seconds === 0 && first.credited === 0, JSON.stringify(first));

  const second = await tot.recordBeat(env, { userId: 'usr_1', unitId: 'unt_1', now: at(60) });
  check('The next beat credits the REAL interval, taken from the clock',
    second.seconds === 60 && second.credited === 60, JSON.stringify(second));

  const third = await tot.recordBeat(env, { userId: 'usr_1', unitId: 'unt_1', now: at(120) });
  check('...and accumulates', third.seconds === 120, third.seconds);

  // The signature of the design: there is nowhere to put a duration.
  const row = await env.DB.prepare("SELECT seconds FROM time_on_task WHERE user_id='usr_1'").bind().first();
  check('The stored total is the server\'s, not the client\'s', row.seconds === 120, row.seconds);
}

// ---------------------------------------------------------------------
// A tab left open cannot bank hours
// ---------------------------------------------------------------------
// The failure this prevents: a learner opens a module, goes to work, and
// beats once on returning. Without a ceiling that single beat credits
// eight hours, and the College's published academic metric quietly
// becomes a measure of how often people forget to close tabs.
{
  const { env } = freshEnv();
  await tot.recordBeat(env, { userId: 'usr_1', unitId: 'unt_1', now: at(0) });
  const late = await tot.recordBeat(env, { userId: 'usr_1', unitId: 'unt_1', now: at(8 * 3600) });

  check('An eight-hour gap credits one interval, not eight hours',
    late.seconds === tot.MAX_BEAT_SECONDS, late.seconds);
  check('...and reports that it was capped, rather than hiding it',
    late.capped === true, late.capped);
}

{
  // A clock that moves backwards — a corrected server time, or two
  // requests racing — credits nothing rather than a negative or a guess.
  const { env } = freshEnv();
  await tot.recordBeat(env, { userId: 'usr_1', unitId: 'unt_1', now: at(600) });
  const back = await tot.recordBeat(env, { userId: 'usr_1', unitId: 'unt_1', now: at(300) });
  check('A backwards clock credits nothing rather than a negative',
    back.seconds === 0 && back.credited === 0, JSON.stringify(back));
}

{
  // Nobody studies one module for more than a working week. Past that a
  // row has stopped being evidence, and noise in the numerator is
  // exactly how a published average becomes a lie.
  const { env, run } = freshEnv();
  run(`INSERT INTO time_on_task (id, user_id, unit_id, seconds, first_seen_at, last_seen_at)
       VALUES ('tot_x','usr_1','unt_1', ${tot.MAX_MODULE_SECONDS - 10}, '2026-09-01T00:00:00.000Z', '2026-09-01T09:00:00.000Z')`);
  const capped = await tot.recordBeat(env, { userId: 'usr_1', unitId: 'unt_1', now: at(120) });
  check('A single module total is capped, so one runaway row cannot move an average',
    capped.seconds === tot.MAX_MODULE_SECONDS, capped.seconds);
}

// ---------------------------------------------------------------------
// It measures modules that exist, for the learner who did the work
// ---------------------------------------------------------------------
{
  const { env } = freshEnv(2);
  const bad = await throws(() => tot.recordBeat(env, { userId: 'usr_1', unitId: 'unt_nope', now: at(0) }));
  check('An unknown module is a clean 404, not a silent row',
    bad && bad.name === 'NotFoundError', bad && bad.name);

  const missing = await throws(() => tot.recordBeat(env, { userId: 'usr_1', unitId: '', now: at(0) }));
  check('A missing module id is a validation error', missing && missing.name === 'ValidationError');

  await tot.recordBeat(env, { userId: 'usr_1', unitId: 'unt_1', now: at(0) });
  await tot.recordBeat(env, { userId: 'usr_1', unitId: 'unt_1', now: at(100) });
  const mine = await tot.learnerTime(env, { userId: 'usr_1', levelId: 1 });
  const theirs = await tot.learnerTime(env, { userId: 'usr_2', levelId: 1 });
  check('A learner sees their own time', mine.totalSeconds === 100, mine.totalSeconds);
  check('...and not anybody else\'s', theirs.totalSeconds === 0, theirs.totalSeconds);
  check('...broken down by module, so a hard module is visible',
    mine.modules.length === 3 && mine.modules[0].seconds === 100, JSON.stringify(mine.modules.map((m) => m.seconds)));
  check('...and in hours, because that is the unit the framework publishes',
    mine.totalHours === 0, mine.totalHours);
}

// ---------------------------------------------------------------------
// The institutional figure, and when it may be published
// ---------------------------------------------------------------------
{
  const { env } = freshEnv();
  const none = await tot.measuredWorkload(env, { levelId: 1 });
  check('With no data at all the figure is not publishable', none.publishable === false, JSON.stringify(none));
  check('...and says so in words, so nobody publishes a null',
    typeof none.reason === 'string' && none.reason.length > 10, none.reason);
  check('...reporting no median rather than a zero', none.medianHours === null);
}

{
  // Four learners is an anecdote with a decimal point.
  const { env, run } = freshEnv(4);
  for (let i = 1; i <= 4; i++) {
    run(`INSERT INTO time_on_task (id, user_id, unit_id, seconds, first_seen_at, last_seen_at)
         VALUES ('tot_${i}','usr_${i}','unt_1', ${10 * 3600}, '2026-09-01T00:00:00.000Z','2026-09-02T00:00:00.000Z')`);
  }
  const small = await tot.measuredWorkload(env, { levelId: 1 });
  check('A figure from four learners is computed but NOT publishable',
    small.medianHours === 10 && small.publishable === false, JSON.stringify(small));
  check('...and the reason names how many are required',
    /30 are required/.test(small.reason || ''), small.reason);
}

{
  // The median, not the mean, is what gets published. One learner who
  // left a module open for a week moves a mean and does not move a
  // median, and the published figure has to survive exactly that learner.
  const { env, run } = freshEnv(31);
  for (let i = 1; i <= 31; i++) {
    const hours = i === 31 ? 39 : 10;   // one extreme outlier
    run(`INSERT INTO time_on_task (id, user_id, unit_id, seconds, first_seen_at, last_seen_at)
         VALUES ('tot_${i}','usr_${i}','unt_1', ${hours * 3600}, '2026-09-01T00:00:00.000Z','2026-09-02T00:00:00.000Z')`);
  }
  const big = await tot.measuredWorkload(env, { levelId: 1 });
  check('With a real cohort the figure becomes publishable',
    big.publishable === true && big.learners === 31, JSON.stringify({ p: big.publishable, n: big.learners }));
  check('The published median is unmoved by one extreme outlier',
    big.medianHours === 10, big.medianHours);
  check('...while the mean IS moved, which is why the median is the published one',
    big.meanHours > big.medianHours, `mean ${big.meanHours} vs median ${big.medianHours}`);
  check('...and both are reported, so the gap between them is itself visible',
    typeof big.meanHours === 'number' && typeof big.medianHours === 'number');
  check('A publishable figure carries no apology text', big.reason === null, big.reason);
}

// ---------------------------------------------------------------------
// The client sends no duration — asserted against the client itself
// ---------------------------------------------------------------------
// The server is safe whatever the browser sends, but a client that
// *tried* to send a duration would mean somebody had misunderstood the
// design, and the next person might implement the server to match.
{
  const client = readFileSync(`${ROOT}/js/time-on-task.js`, 'utf8');
  const body = (client.match(/body:\s*JSON\.stringify\(([^)]*)\)/) || [])[1] || '';
  check('The beacon sends only a module id — no duration, no timestamp',
    /unitId/.test(body) && !/second|duration|elapsed|ms\b|time/i.test(body), body.trim());
  check('...and only beats while the page is visible',
    /visibilityState/.test(client));
  check('...and stops when the learner has gone idle',
    /IDLE_MS/.test(client) && /lastActivity/.test(client));
  // Audio counts as activity: a learner listening to a two-minute
  // recording with their hands still is studying, and an idle rule built
  // only on input would score the programme's core practice at zero.
  check('...but treats playing audio as activity, or listening practice would score zero',
    /anyAudioPlaying/.test(client));
}

console.log(`\n${pass} passed, ${fail} failed.`);
process.exit(fail ? 1 : 0);
