// functions/_lib/admin/enrolments.js — staff enrolment management.
//
// The weight here is on the two things that turn an admin tool into a
// liability: granting yourself access, and changing someone's access
// without leaving a trace. A search box that works is the easy part.
//
// Also covers the integrity defect that prompted the whole thing: the
// enrolments table had no uniqueness, so running the manual SQL twice —
// exactly how the platform's first learner was enrolled — created two
// live enrolments in one level, and progression.js would then mark one
// completed while the other stayed active.
import { readFileSync } from 'node:fs';
import { makeD1 } from './d1-shim.mjs';
import { ROOT, loadUrl } from './helpers.mjs';

const admin = await import(loadUrl('functions/_lib/admin/enrolments.js'));

let pass = 0, fail = 0;
const check = (label, cond, detail) => {
  console.log((cond ? 'PASS ' : 'FAIL ') + label + (cond || detail === undefined ? '' : ` — ${detail}`));
  cond ? pass++ : fail++;
};
async function throws(fn) { try { await fn(); return null; } catch (e) { return e; } }

const schema = readFileSync(`${ROOT}/sql/schema.sql`, 'utf8');
function freshEnv() {
  const env = { DB: makeD1(schema) };
  const sql = (s) => env.DB.prepare(s).bind().run();
  sql("INSERT INTO users (id, auth_provider, auth_provider_id, email, role, created_at) VALUES ('usr_learner','clerk','c1','learner@example.com','student','2026-01-01T00:00:00.000Z')");
  sql("INSERT INTO users (id, auth_provider, auth_provider_id, email, role, created_at) VALUES ('usr_other','clerk','c2','other@example.com','student','2026-01-02T00:00:00.000Z')");
  sql("INSERT INTO users (id, auth_provider, auth_provider_id, email, preferred_name, role, created_at) VALUES ('usr_reg','clerk','c3','registrar@example.com','Registrar','staff','2026-01-03T00:00:00.000Z')");
  return env;
}
const STAFF = { id: 'usr_reg', role: 'staff', email: 'registrar@example.com' };

// ---------------------------------------------------------------------
// Enrolling someone who never paid — the actual demonstrated need
// ---------------------------------------------------------------------
{
  const env = freshEnv();
  const res = await admin.setEnrolmentStatus(env, {
    actor: STAFF, userId: 'usr_learner', levelId: 1, status: 'active',
    reason: 'Scholarship award 2026-A, approved by Academic Director',
  });
  check('Staff can enrol a learner with no payment', res.changed === true && res.status === 'active', JSON.stringify(res));

  const row = await env.DB.prepare('SELECT * FROM enrolments WHERE user_id = ?').bind('usr_learner').first();
  check('...the enrolment exists and is active', row && row.status === 'active', row && row.status);
  check('...with a started_at, because it is live from now', !!(row && row.started_at), row && row.started_at);

  const history = await admin.enrolmentHistory(env, { userId: 'usr_learner' });
  check('...and an event records the change', history.length === 1, history.length);
  check('...naming the staff member who made it', history[0].actor === 'registrar@example.com', history[0].actor);
  check('...and the reason, which is the point of keeping it',
    /Scholarship award 2026-A/.test(history[0].reason || ''), history[0].reason);
  check('...with no prior status, because the enrolment is new', history[0].fromStatus === null, history[0].fromStatus);
}

// ---------------------------------------------------------------------
// The two rules that stop this being a liability
// ---------------------------------------------------------------------
{
  const env = freshEnv();
  const self = await throws(() => admin.setEnrolmentStatus(env, {
    actor: STAFF, userId: 'usr_reg', levelId: 1, status: 'active', reason: 'testing the platform',
  }));
  check('A staff member cannot enrol themselves', self && self.name === 'AuthorizationError', self && self.name);
  check('...and is told to ask a colleague, not just refused', /another staff member/i.test(self.message), self.message);
  const none = await env.DB.prepare("SELECT COUNT(*) n FROM enrolments WHERE user_id='usr_reg'").bind().first();
  check('...leaving no enrolment behind', none.n === 0, none.n);

  const noReason = await throws(() => admin.setEnrolmentStatus(env, {
    actor: STAFF, userId: 'usr_learner', levelId: 1, status: 'active',
  }));
  check('A change with no reason is refused', noReason && noReason.name === 'ValidationError', noReason && noReason.name);
  const blank = await throws(() => admin.setEnrolmentStatus(env, {
    actor: STAFF, userId: 'usr_learner', levelId: 1, status: 'active', reason: '  ',
  }));
  check('...and whitespace does not count as a reason', blank && blank.name === 'ValidationError', blank && blank.name);
  const stillNone = await env.DB.prepare("SELECT COUNT(*) n FROM enrolments").bind().first();
  check('...so a reasonless attempt creates nothing at all', stillNone.n === 0, stillNone.n);
}

// ---------------------------------------------------------------------
// The system may act without a person — and is recorded as such
// ---------------------------------------------------------------------
{
  const env = freshEnv();
  // This is the payment-webhook shape: no actor, no reason.
  const res = await admin.setEnrolmentStatus(env, { actor: null, userId: 'usr_learner', levelId: 2, status: 'active' });
  check('The system can enrol without an actor or reason (a paid enrolment)', res.changed === true);
  const history = await admin.enrolmentHistory(env, { userId: 'usr_learner' });
  check('...and the event says the system did it, not a blank name',
    history[0].bySystem === true && history[0].actor === null, JSON.stringify(history[0]));
}

// ---------------------------------------------------------------------
// Moving an existing enrolment
// ---------------------------------------------------------------------
{
  const env = freshEnv();
  await admin.setEnrolmentStatus(env, { actor: STAFF, userId: 'usr_learner', levelId: 1, status: 'active', reason: 'bank transfer received' });
  const again = await admin.setEnrolmentStatus(env, { actor: STAFF, userId: 'usr_learner', levelId: 1, status: 'active', reason: 'bank transfer received' });
  check('Setting the same status again reports no change', again.changed === false, JSON.stringify(again));
  const events = await admin.enrolmentHistory(env, { userId: 'usr_learner' });
  check('...and writes no event — an audit trail of "X to X" hides the real entries', events.length === 1, events.length);

  const done = await admin.setEnrolmentStatus(env, { actor: STAFF, userId: 'usr_learner', levelId: 1, status: 'completed', reason: 'passed end-of-level exam' });
  check('An enrolment can be moved to completed', done.changed === true && done.previousStatus === 'active', JSON.stringify(done));
  const row = await env.DB.prepare('SELECT * FROM enrolments WHERE id = ?').bind(done.id).first();
  check('...and completed_at is stamped', !!row.completed_at, row.completed_at);
  const hist = await admin.enrolmentHistory(env, { userId: 'usr_learner' });
  check('...with the transition recorded from-and-to',
    hist[0].fromStatus === 'active' && hist[0].toStatus === 'completed', JSON.stringify(hist[0]));

  const nothing = await throws(() => admin.setEnrolmentStatus(env, { actor: STAFF, userId: 'usr_learner', levelId: 5, status: 'withdrawn', reason: 'mistake' }));
  check('Withdrawing a level they were never in is refused, not silently created',
    nothing && nothing.name === 'ValidationError', nothing && nothing.name);
}

// ---------------------------------------------------------------------
// Withdraw, then re-enrol — a real thing institutions do
// ---------------------------------------------------------------------
{
  const env = freshEnv();
  await admin.setEnrolmentStatus(env, { actor: STAFF, userId: 'usr_learner', levelId: 3, status: 'active', reason: 'corporate seat' });
  await admin.setEnrolmentStatus(env, { actor: STAFF, userId: 'usr_learner', levelId: 3, status: 'withdrawn', reason: 'learner deferred to next intake' });
  const back = await admin.setEnrolmentStatus(env, { actor: STAFF, userId: 'usr_learner', levelId: 3, status: 'active', reason: 'returned for the spring intake' });
  check('A withdrawn learner can be re-enrolled in the same level', back.changed === true && back.status === 'active');

  const all = await env.DB.prepare("SELECT status FROM enrolments WHERE user_id='usr_learner' AND level_id=3 ORDER BY created_at").bind().all();
  check('...as a NEW enrolment, keeping the withdrawn one as history', all.results.length === 2, all.results.length);
  const live = all.results.filter((r) => r.status !== 'withdrawn');
  check('...with exactly one live', live.length === 1, live.length);
  const hist = await admin.enrolmentHistory(env, { userId: 'usr_learner' });
  check('...and the whole sequence readable afterwards', hist.length === 3, hist.length);
}

// ---------------------------------------------------------------------
// The integrity defect that started this
// ---------------------------------------------------------------------
{
  const env = freshEnv();
  await admin.setEnrolmentStatus(env, { actor: null, userId: 'usr_learner', levelId: 1, status: 'active' });
  // The manual SQL from the console, run a second time. Before
  // migration 002 this succeeded and left the learner holding two live
  // enrolments in one level.
  const dup = await throws(() => env.DB
    .prepare("INSERT INTO enrolments (id, user_id, level_id, status, started_at) VALUES ('enr_dup','usr_learner',1,'active','2026-01-01T00:00:00.000Z')")
    .bind().run());
  check('A duplicate live enrolment is rejected by the database itself', dup !== null, 'the INSERT succeeded');
  const n = await env.DB.prepare("SELECT COUNT(*) n FROM enrolments WHERE user_id='usr_learner' AND level_id=1 AND status!='withdrawn'").bind().first();
  check('...so exactly one live enrolment survives', n.n === 1, n.n);
}

// ---------------------------------------------------------------------
// Bad input never reaches the database
// ---------------------------------------------------------------------
{
  const env = freshEnv();
  for (const [label, args] of [
    ['unknown learner', { userId: 'usr_nobody', levelId: 1, status: 'active' }],
    ['unknown level', { userId: 'usr_learner', levelId: 99, status: 'active' }],
    ['invalid status', { userId: 'usr_learner', levelId: 1, status: 'enrolled-ish' }],
  ]) {
    const err = await throws(() => admin.setEnrolmentStatus(env, { actor: STAFF, reason: 'valid reason here', ...args }));
    check(`Rejected: ${label}`, err !== null, 'no error thrown');
  }
  const n = await env.DB.prepare('SELECT COUNT(*) n FROM enrolments').bind().first();
  check('...and nothing was written', n.n === 0, n.n);
}

// ---------------------------------------------------------------------
// Finding a learner
// ---------------------------------------------------------------------
{
  const env = freshEnv();
  await admin.setEnrolmentStatus(env, { actor: null, userId: 'usr_learner', levelId: 1, status: 'active' });

  const byEmail = await admin.searchLearners(env, { q: 'learner@' });
  check('Search finds a learner by email', byEmail.count === 1 && byEmail.learners[0].id === 'usr_learner', JSON.stringify(byEmail.count));
  check('...with their enrolments attached, which is the actual question',
    byEmail.learners[0].enrolments.length === 1 && byEmail.learners[0].enrolments[0].status === 'active');
  check('...including the level name, not just an id',
    byEmail.learners[0].enrolments[0].name === 'Foundation Programme', byEmail.learners[0].enrolments[0].name);

  const byName = await admin.searchLearners(env, { q: 'Registrar' });
  check('Search also matches a preferred name', byName.count === 1 && byName.learners[0].id === 'usr_reg');

  const empty = await admin.searchLearners(env, { q: '' });
  check('An empty search lists recent accounts, newest first',
    empty.count === 3 && empty.learners[0].id === 'usr_reg', JSON.stringify(empty.learners.map((l) => l.id)));

  // A search term is user input that reaches a LIKE pattern.
  const wild = await admin.searchLearners(env, { q: '%' });
  check('A wildcard in the search term matches literally, not everything', wild.count === 0, wild.count);

  const detail = await admin.getLearner(env, { userId: 'usr_learner' });
  check('A learner detail includes enrolments and history',
    detail.enrolments.length === 1 && detail.history.length === 1, JSON.stringify({ e: detail.enrolments.length, h: detail.history.length }));
  const gone = await throws(() => admin.getLearner(env, { userId: 'usr_nobody' }));
  check('An unknown learner is a clean 404', gone && gone.name === 'NotFoundError', gone && gone.name);
}

console.log(`\n${pass} passed, ${fail} failed.`);
process.exit(fail ? 1 : 0);
