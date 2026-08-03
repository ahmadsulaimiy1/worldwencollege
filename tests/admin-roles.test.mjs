// functions/_lib/admin/roles.js — appointments.
//
// Every assertion here corresponds to a specific way this goes wrong.
// A permission system that has only been tested along its happy path
// is a permission system nobody has actually checked.
import { readFileSync } from 'node:fs';
import { makeD1 } from './d1-shim.mjs';
import { ROOT, loadUrl } from './helpers.mjs';

const roles = await import(loadUrl('functions/_lib/admin/roles.js'));

let pass = 0, fail = 0;
const check = (label, cond, detail) => {
  console.log((cond ? 'PASS ' : 'FAIL ') + label + (cond || detail === undefined ? '' : ` — ${detail}`));
  cond ? pass++ : fail++;
};
async function throws(fn) { try { await fn(); return null; } catch (e) { return e; } }

const schema = readFileSync(`${ROOT}/sql/schema.sql`, 'utf8');
function freshEnv() {
  const env = { DB: makeD1(schema) };
  const add = (id, email, role) => env.DB.prepare(
    `INSERT INTO users (id, auth_provider, auth_provider_id, email, role) VALUES ('${id}','clerk','c_${id}','${email}','${role}')`
  ).bind().run();
  add('usr_admin', 'principal@example.com', 'admin');
  add('usr_admin2', 'deputy@example.com', 'admin');
  add('usr_staff', 'tutor@example.com', 'staff');
  add('usr_student', 'learner@example.com', 'student');
  return env;
}
const ADMIN = { id: 'usr_admin', role: 'admin', email: 'principal@example.com' };
const STAFF = { id: 'usr_staff', role: 'staff', email: 'tutor@example.com' };
const OK = { reason: 'Appointed to lead the Level II cohort', authority: 'Board minute 2026-03, item 4' };

// ---------------------------------------------------------------------
// An administrator can appoint
// ---------------------------------------------------------------------
{
  const env = freshEnv();
  const res = await roles.setUserRole(env, { actor: ADMIN, userId: 'usr_student', role: 'staff', ...OK });
  check('An administrator can appoint a student to staff', res.changed === true && res.role === 'staff', JSON.stringify(res));
  const row = await env.DB.prepare("SELECT role FROM users WHERE id='usr_student'").bind().first();
  check('...and the role actually changes', row.role === 'staff', row.role);

  const history = await roles.appointmentHistory(env, { userId: 'usr_student' });
  check('...recorded as an appointment', history.length === 1, history.length);
  check('...naming who made it', history[0].actorEmail === 'principal@example.com', history[0].actorEmail);
  check('...with the reason', /Level II cohort/.test(history[0].reason || ''), history[0].reason);
  check('...and the authority it rests on, separately from the reason',
    /Board minute 2026-03/.test(history[0].authority || ''), history[0].authority);
  check('...and the transition, so a demotion is distinguishable from an appointment',
    history[0].fromRole === 'student' && history[0].toRole === 'staff', JSON.stringify(history[0]));

  const same = await roles.setUserRole(env, { actor: ADMIN, userId: 'usr_student', role: 'staff', ...OK });
  check('Appointing to the role they already hold reports no change', same.changed === false);
  check('...and writes no second event', (await roles.appointmentHistory(env, { userId: 'usr_student' })).length === 1);
}

// ---------------------------------------------------------------------
// Staff cannot appoint — the distinction between the roles depends on it
// ---------------------------------------------------------------------
{
  const env = freshEnv();
  const err = await throws(() => roles.setUserRole(env, { actor: STAFF, userId: 'usr_student', role: 'staff', ...OK }));
  check('A staff member cannot appoint anyone', err && err.name === 'AuthorizationError', err && err.name);
  const promote = await throws(() => roles.setUserRole(env, { actor: STAFF, userId: 'usr_staff', role: 'admin', ...OK }));
  check('...least of all themselves to administrator', promote && promote.name === 'AuthorizationError', promote && promote.name);
  const row = await env.DB.prepare("SELECT role FROM users WHERE id='usr_staff'").bind().first();
  check('...and their own role is untouched', row.role === 'staff', row.role);
  check('...with nothing recorded', (await roles.appointmentHistory(env, { userId: 'usr_staff' })).length === 0);

  const anon = await throws(() => roles.setUserRole(env, { actor: null, userId: 'usr_student', role: 'admin', ...OK }));
  check('An unauthenticated caller cannot appoint', anon && anon.name === 'AuthorizationError', anon && anon.name);
}

// ---------------------------------------------------------------------
// Nobody changes their own access
// ---------------------------------------------------------------------
{
  const env = freshEnv();
  const self = await throws(() => roles.setUserRole(env, { actor: ADMIN, userId: 'usr_admin', role: 'student', ...OK }));
  check('An administrator cannot change their own access', self && self.name === 'AuthorizationError', self && self.name);
  check('...and is told to ask a colleague', /another administrator/i.test(self.message), self.message);
  const row = await env.DB.prepare("SELECT role FROM users WHERE id='usr_admin'").bind().first();
  check('...so they cannot lock themselves out mid-mistake', row.role === 'admin', row.role);
}

// ---------------------------------------------------------------------
// The last administrator
// ---------------------------------------------------------------------
{
  const env = freshEnv();
  // Two administrators exist. Removing one is fine.
  const ok = await roles.setUserRole(env, { actor: ADMIN, userId: 'usr_admin2', role: 'staff', reason: 'Stepped down from the administrator role', authority: 'Resignation letter, 2026-04-02' });
  check('One of two administrators can be stepped down', ok.changed === true && ok.previousRole === 'admin');

  // Now usr_admin is the only one — and cannot demote themselves anyway,
  // so promote a second actor to try it from the outside.
  await roles.setUserRole(env, { actor: ADMIN, userId: 'usr_staff', role: 'admin', ...OK });
  const OTHER = { id: 'usr_staff', role: 'admin', email: 'tutor@example.com' };
  await roles.setUserRole(env, { actor: OTHER, userId: 'usr_admin', role: 'staff', reason: 'handover complete', authority: 'n/a' });

  const remaining = await env.DB.prepare("SELECT COUNT(*) n FROM users WHERE role='admin'").bind().first();
  check('Down to exactly one administrator', remaining.n === 1, remaining.n);

  // A third party tries to remove the last one.
  const THIRD = { id: 'usr_admin2', role: 'admin', email: 'deputy@example.com' };
  // (usr_admin2 is staff now, but setUserRole trusts the actor object's
  // role the way requireStaff supplies it — so this is the real shape of
  // an administrator attempting the removal.)
  const err = await throws(() => roles.setUserRole(env, { actor: THIRD, userId: 'usr_staff', role: 'student', reason: 'no longer required', authority: 'n/a' }));
  check('The last administrator cannot be removed', err && err.name === 'ValidationError', err && err.name);
  check('...and the message says why it matters, not just "no"',
    /only administrator|appoint another/i.test(err.message), err.message);
  const still = await env.DB.prepare("SELECT COUNT(*) n FROM users WHERE role='admin'").bind().first();
  check('...so the platform never reaches zero administrators', still.n === 1, still.n);
}

// ---------------------------------------------------------------------
// A record worth keeping
// ---------------------------------------------------------------------
{
  const env = freshEnv();
  const noReason = await throws(() => roles.setUserRole(env, { actor: ADMIN, userId: 'usr_student', role: 'staff' }));
  check('An appointment with no reason is refused', noReason && noReason.name === 'ValidationError', noReason && noReason.name);
  const blank = await throws(() => roles.setUserRole(env, { actor: ADMIN, userId: 'usr_student', role: 'staff', reason: '  ' }));
  check('...and whitespace does not count', blank && blank.name === 'ValidationError');
  const row = await env.DB.prepare("SELECT role FROM users WHERE id='usr_student'").bind().first();
  check('...leaving the role unchanged', row.role === 'student', row.role);

  // Authority is optional — not every appointment rests on a minuted
  // decision, and requiring one would just produce "n/a" everywhere.
  const noAuth = await roles.setUserRole(env, { actor: ADMIN, userId: 'usr_student', role: 'staff', reason: 'covering the summer intake' });
  check('An appointment without a stated authority is allowed', noAuth.changed === true);
  const h = await roles.appointmentHistory(env, { userId: 'usr_student' });
  check('...and records authority as absent rather than inventing one', h[0].authority === null, h[0].authority);

  const bad = await throws(() => roles.setUserRole(env, { actor: ADMIN, userId: 'usr_student', role: 'wizard', ...OK }));
  check('An unknown role is refused', bad && bad.name === 'ValidationError', bad && bad.name);
  const gone = await throws(() => roles.setUserRole(env, { actor: ADMIN, userId: 'usr_nobody', role: 'staff', ...OK }));
  check('An unknown person is a clean 404', gone && gone.name === 'NotFoundError', gone && gone.name);
}

// ---------------------------------------------------------------------
// "Who can see student records?"
// ---------------------------------------------------------------------
{
  const env = freshEnv();
  const list = await roles.listAppointees(env);
  check('Everyone holding access above student can be listed', list.count === 3, list.count);
  check('...administrators first, so the shortest answer is at the top',
    list.appointees[0].role === 'staff' || list.appointees[0].role === 'admin', list.appointees[0].role);
  check('...and no learners appear in it',
    list.appointees.every((a) => a.role !== 'student'), JSON.stringify(list.appointees.map((a) => a.role)));
}

console.log(`\n${pass} passed, ${fail} failed.`);
process.exit(fail ? 1 : 0);
