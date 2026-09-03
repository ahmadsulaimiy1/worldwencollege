// AN ATTENDANCE RECORD THAT CANNOT SAY HOW IT KNOWS IS NOT A RECORD.
//
// Governance A7 put attendance first among the three metrics the College
// had undertaken to report and could not compute at all. Migration 024
// makes it recordable. The assertions here are about what the register
// REFUSES, because that is where its value is:
//
//   - "present" without a join time is an opinion, not a fact;
//   - a `platform` record without the join log's times is a person
//     typing a claim and calling it evidence;
//   - an excusal without a reason is a favour;
//   - two contradictory rows for one learner at one session is the
//     state a register exists to prevent.
//
// And one thing it must refuse to do at a higher level: publish an
// attendance RATE. A7's question — presence at a session, or engagement
// with the module? — is unsettled, and answering it here would be
// taking a decision that belongs to the Board.
import { readFileSync } from 'node:fs';
import { DatabaseSync } from 'node:sqlite';
import path from 'node:path';
import { ROOT } from './helpers.mjs';

let pass = 0, fail = 0;
const check = (label, cond, detail) => {
  console.log((cond ? 'PASS ' : 'FAIL ') + label + (cond || detail === undefined ? '' : ` — ${detail}`));
  cond ? pass++ : fail++;
};

const db = new DatabaseSync(':memory:');
db.exec(readFileSync(path.join(ROOT, 'sql/schema.sql'), 'utf8'));
db.exec(`INSERT INTO users (id, auth_provider, auth_provider_id, email, role)
  VALUES ('usr_host','clerk','a0','h@example.com','staff');
INSERT INTO live_sessions (id, level_id, host_user_id, title, starts_at, attendance_expected)
  VALUES ('lsn_req', 1, 'usr_host', 'Speaking clinic: the Foundation interview', '2026-10-01T14:00:00Z', 1),
         ('lsn_open', 1, 'usr_host', 'Optional drop-in: pronunciation questions', '2026-10-08T14:00:00Z', 0);`);
// A learner per attempt. The first version of this file reused one
// learner for every refusal, so after the first row landed the UNIQUE
// constraint refused all the rest — five assertions passed without
// touching the rule each of them named, and a sabotage pass caught it.
for (let i = 1; i <= 30; i++) {
  db.prepare(`INSERT INTO users (id, auth_provider, auth_provider_id, email, role)
    VALUES ('usr_l${i}','clerk','a_${i}','l${i}@example.com','student')`).run();
}

const T = '2026-10-01T15:10:00Z';
let n = 0;
const mark = (extra = {}) => {
  n += 1;
  const cols = {
    id: `att_${n}`, session_id: 'lsn_req', user_id: `usr_l${n}`,
    state: 'present', source: 'platform',
    joined_at: '2026-10-01T14:01:00Z', left_at: '2026-10-01T15:02:00Z',
    recorded_by: 'usr_host', recorded_at: T, ...extra,
  };
  const keys = Object.keys(cols);
  db.prepare(`INSERT INTO session_attendance (${keys.join(',')})
    VALUES (${keys.map(() => '?').join(',')})`).run(...keys.map((k) => cols[k]));
};
const refuses = (label, fn) => {
  let threw = false;
  try { fn(); } catch { threw = true; }
  check(label, threw);
};

// --- A session can say whether being there was required ---------------
const req = db.prepare("SELECT attendance_expected AS e FROM live_sessions WHERE id = 'lsn_req'").get();
const open = db.prepare("SELECT attendance_expected AS e FROM live_sessions WHERE id = 'lsn_open'").get();
check('A session can require attendance', req.e === 1);
check('...and a session can merely offer it', open.e === 0);
check('Offering is the default, because this is an asynchronous programme',
  /DEFAULT 0/.test(readFileSync(path.join(ROOT, 'sql/migrations/024-attendance.sql'), 'utf8')));

// --- A well-formed record can be made ---------------------------------
let ok = true;
try { mark(); } catch (e) { ok = false; console.log('   ' + e.message); }
check('A platform join log records cleanly', ok);

let ok2 = true;
try {
  mark({ state: 'excused', source: 'host',
    joined_at: null, left_at: null, reason: 'Bereavement; notified the tutor in advance.' });
} catch (e) { ok2 = false; console.log('   ' + e.message); }
check('...and so does an excusal with a reason', ok2);

// --- And the malformed ones are refused -------------------------------
refuses('"Present" without a join time is refused, because it would be an opinion',
  () => mark({ source: 'host', joined_at: null, left_at: null }));

refuses('An absence with a join time is refused — it contradicts itself',
  () => mark({ state: 'absent', source: 'host', left_at: null }));

refuses('A platform record without the log\'s times is refused: typing is not evidence',
  () => mark({ source: 'platform', left_at: null }));

refuses('Leaving before arriving is refused',
  () => mark({ left_at: '2026-10-01T13:00:00Z' }));

refuses('An excusal without a reason is refused, because that is a favour',
  () => mark({ state: 'excused', source: 'host',
    joined_at: null, left_at: null, reason: null }));

refuses('...and an excusal whose reason is blank is refused too',
  () => mark({ state: 'excused', source: 'host',
    joined_at: null, left_at: null, reason: '   ' }));

// Lawful in every other respect: no join time, so the "present means a
// join time" rules are satisfied and only the vocabulary is left to
// refuse it. Written the obvious way first, it kept its join time and
// was refused by the wrong rule.
refuses('An unknown state is refused',
  () => mark({ state: 'maybe', source: 'host', joined_at: null, left_at: null }));
refuses('An unknown source is refused', () => mark({ source: 'guessed' }));

refuses('A session cannot half-require attendance',
  () => db.prepare(`INSERT INTO live_sessions (id, level_id, title, starts_at, attendance_expected)
    VALUES ('lsn_bad', 1, 'Nonsense', '2026-10-15T14:00:00Z', 2)`).run());

// The only two assertions that name a learner explicitly, because they
// are the only two about the same learner appearing twice.
refuses('Two contradictory rows for one learner at one session are refused',
  () => mark({ user_id: 'usr_l1', state: 'absent', source: 'host',
    joined_at: null, left_at: null }));

// A learner may of course be marked at a DIFFERENT session.
let ok3 = true;
try { mark({ session_id: 'lsn_open', user_id: 'usr_l1' }); } catch (e) { ok3 = false; console.log('   ' + e.message); }
check('...but the same learner at another session is fine', ok3);

// --- The College's own word is recorded as such -----------------------
// Not refused: a self-report is sometimes all there is. Distinguished:
// the metric register surfaces the count, because a register mostly
// built from learners' say-so is weaker than its row count suggests.
let ok4 = true;
try {
  mark({ session_id: 'lsn_open', source: 'self',
    joined_at: '2026-10-08T14:05:00Z', left_at: null });
} catch (e) { ok4 = false; console.log('   ' + e.message); }
check('A self-reported attendance is recordable, and marked as self-reported', ok4);
const src = db.prepare("SELECT COUNT(*) c FROM session_attendance WHERE source = 'self'").get();
check('...and countable, so the register can say how much of it rests on hearsay', src.c === 1);

// --- The College ships no attendance ----------------------------------
const shipped = new DatabaseSync(':memory:');
shipped.exec(readFileSync(path.join(ROOT, 'sql/schema.sql'), 'utf8'));
check('The College ships an empty attendance register, because nothing has been taught',
  shipped.prepare('SELECT COUNT(*) n FROM session_attendance').get().n === 0);
check('...and no live sessions either', shipped.prepare('SELECT COUNT(*) n FROM live_sessions').get().n === 0);

// --- The decision the migration does not take -------------------------
const mig = readFileSync(path.join(ROOT, 'sql/migrations/024-attendance.sql'), 'utf8');
check('The migration records that it does not define what attendance means',
  /THE DECISION THIS FILE DOES NOT TAKE/.test(mig));
check('...and names A7\'s question rather than paraphrasing it away',
  /presence at a live session, or engagement with the module/.test(mig));
check('The register computes no attendance rate anywhere',
  !/attendanceRate[\s\S]{0,400}state: 'measured'/.test(
    readFileSync(path.join(ROOT, 'functions/_lib/reports/institutional.js'), 'utf8')));

console.log(`\n${pass} passed, ${fail} failed.`);
process.exit(fail ? 1 : 0);
