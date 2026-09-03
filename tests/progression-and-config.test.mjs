// Run with: node --experimental-sqlite tests/progression-and-config.test.mjs
// Covers Executive Decision #1 (progressive full-programme unlock) and
// the platform_config mechanism (Executive Decision #5) it's built on.
import { readFileSync } from 'node:fs';
import { makeD1 } from './d1-shim.mjs';
import { ROOT, loadUrl } from './helpers.mjs';

const schema = readFileSync(`${ROOT}/sql/schema.sql`, 'utf8');
const env = { DB: makeD1(schema) };
const db = env.DB;

const { getConfigJson, setConfigJson } = await import(loadUrl('functions/_lib/config.js'));
const { completeLevel } = await import(loadUrl('functions/_lib/student/progression.js'));
const { onRequestPost: completeLevelEndpoint } = await import(loadUrl('functions/api/lms/complete-level.js'));
const { ConfigError, NotFoundError, ValidationError } = await import(loadUrl('functions/_lib/db.js'));

let pass = 0, fail = 0;
function check(label, cond) { console.log((cond ? 'PASS ' : 'FAIL ') + label); cond ? pass++ : fail++; }

// --- Seed data sanity: real published facts, not fabricated ---
check('seed: full-programme price is $19,000 (already-published figure)', (await getConfigJson(env, 'full_programme_price_usd_cents')) === 1900000);
check('seed: unlock mode is "progressive" (Executive Decision #1)', (await getConfigJson(env, 'full_programme_unlock_mode')) === 'progressive');
const courseRows = db.prepare('SELECT * FROM courses ORDER BY level_id').all().results;
check('seed: exactly one course per programme level', courseRows.length === 6 && courseRows.every((r, i) => r.level_id === i + 1));

// --- getConfigJson / setConfigJson ---
check('getConfigJson: missing required key throws ConfigError', await (async () => {
  try { await getConfigJson(env, 'no_such_key'); return false; } catch (e) { return e instanceof ConfigError; }
})());
check('getConfigJson: missing optional key returns null', (await getConfigJson(env, 'no_such_key', { required: false })) === null);
await setConfigJson(env, 'instalment_default_count', 6, { updatedBy: null });
check('setConfigJson: value round-trips through getConfigJson', (await getConfigJson(env, 'instalment_default_count')) === 6);

// --- Fixtures ---
db.prepare(`INSERT INTO users (id, auth_provider, auth_provider_id, email, role) VALUES ('usr_solo', 'clerk', 'sub_solo', 'solo@example.com', 'student')`).run();
db.prepare(`INSERT INTO users (id, auth_provider, auth_provider_id, email, role) VALUES ('usr_full', 'clerk', 'sub_full', 'full@example.com', 'student')`).run();

// usr_solo: single-level payment only, no full-programme payment on file.
db.prepare(`INSERT INTO enrolments (id, user_id, level_id, status, started_at) VALUES ('enr_solo_1', 'usr_solo', 1, 'active', '2026-01-01T00:00:00.000Z')`).run();

// usr_full: paid for the full programme, currently active in Level I only.
db.prepare(`INSERT INTO payments (id, user_id, kind, level_id, amount_cents, currency, amount_usd_cents, provider, status, created_at, confirmed_at)
  VALUES ('pay_full_1', 'usr_full', 'full_programme', NULL, 1900000, 'USD', 1900000, 'stripe', 'succeeded', '2026-01-01T00:00:00.000Z', '2026-01-01T00:05:00.000Z')`).run();
db.prepare(`INSERT INTO enrolments (id, user_id, level_id, status, started_at) VALUES ('enr_full_1', 'usr_full', 1, 'active', '2026-01-01T00:00:00.000Z')`).run();

// --- Single-level student completing a level: no auto-unlock (no full-programme payment on file) ---
const soloResult = await completeLevel(env, { userId: 'usr_solo', levelId: 1 });
check('single-level student: enrolment marked completed', soloResult.enrolment.status === 'completed');
check('single-level student: no next level auto-unlocked', soloResult.nextLevelUnlocked === null);
const soloLevel2 = db.prepare(`SELECT * FROM enrolments WHERE user_id = 'usr_solo' AND level_id = 2`).first();
check('single-level student: no Level II enrolment was created', soloLevel2 === null);

// --- Full-programme student completing Level I: Level II unlocks automatically ---
const fullResult = await completeLevel(env, { userId: 'usr_full', levelId: 1 });
check('full-programme student: Level I marked completed', fullResult.enrolment.status === 'completed' && fullResult.enrolment.completedAt != null);
check('full-programme student: Level II auto-unlocked', fullResult.nextLevelUnlocked && fullResult.nextLevelUnlocked.levelId === 2);
const fullLevel2 = db.prepare(`SELECT * FROM enrolments WHERE user_id = 'usr_full' AND level_id = 2`).first();
check('full-programme student: Level II enrolment row now exists and is active', fullLevel2 && fullLevel2.status === 'active');

// --- Idempotency: completing an already-completed level does not re-create or duplicate anything ---
const fullReplay = await completeLevel(env, { userId: 'usr_full', levelId: 1 });
check('idempotent replay: still completed, no error', fullReplay.enrolment.status === 'completed');
check('idempotent replay: does not report a fresh unlock the second time', fullReplay.nextLevelUnlocked === null);
const level2Count = db.prepare(`SELECT COUNT(*) AS n FROM enrolments WHERE user_id = 'usr_full' AND level_id = 2`).first().n;
check('idempotent replay: still exactly one Level II enrolment (no duplicate)', level2Count === 1);

// --- Error paths ---
check('completeLevel: unknown enrolment throws NotFoundError', await (async () => {
  try { await completeLevel(env, { userId: 'usr_solo', levelId: 4 }); return false; } catch (e) { return e instanceof NotFoundError; }
})());
db.prepare(`INSERT INTO enrolments (id, user_id, level_id, status) VALUES ('enr_pending', 'usr_solo', 2, 'pending_payment')`).run();
check('completeLevel: non-active enrolment throws ValidationError', await (async () => {
  try { await completeLevel(env, { userId: 'usr_solo', levelId: 2 }); return false; } catch (e) { return e instanceof ValidationError; }
})());

// --- Level VI (no next level) completes cleanly with no unlock attempt ---
db.prepare(`INSERT INTO enrolments (id, user_id, level_id, status, started_at) VALUES ('enr_full_6', 'usr_full', 6, 'active', '2026-01-01T00:00:00.000Z')`).run();
const finalResult = await completeLevel(env, { userId: 'usr_full', levelId: 6 });
check('final level: completes with no next level to unlock', finalResult.enrolment.status === 'completed' && finalResult.nextLevelUnlocked === null);

// --- Authorization boundary: no Authorization header -> 401 ---
const noAuthReq = new Request('http://x/api/lms/complete-level', { method: 'POST', body: JSON.stringify({ userId: 'usr_solo', levelId: 1 }) });
const noAuthResp = await completeLevelEndpoint({ request: noAuthReq, env });
check('complete-level endpoint: no Authorization header -> 401', noAuthResp.status === 401);

// ---------------------------------------------------------------------
// THE FIVE OTHER GATES — `level_mark.gates`, enforced since 21 Aug 2026
// ---------------------------------------------------------------------
// Before this, completeLevel() marked an enrolment finished on a staff
// instruction alone and checked nothing — recorded in
// data/academic-regulations.json as `conformance.level_mark`. A staff
// confirmation is the SIXTH gate, not a substitute for the other five.
//
// Everything above this line runs against levels with no authored
// curriculum, which is why it still passes untouched: a level with no
// modules cannot have an incomplete one, and the shortfall then belongs
// to the College's authoring rather than to the learner. That is the
// distinction being asserted here, in both directions.

const { levelGateReport } = await import(loadUrl('functions/_lib/student/progression.js'));

// usr_gate: enrolled at Level III, which now carries the ten authored
// modules `level.gate.modules_complete` expects, each with both
// assessment components and no marks against either.
//
// Ten and not one, deliberately: the gate reads `complete === found &&
// found === expected`, and a level with one authored module of ten is a
// level the COLLEGE has not finished writing. Charging that to the
// learner would be the platform reporting its own gap as their
// shortfall — the distinction `condition.owner` exists to carry.
db.prepare(`INSERT INTO users (id, auth_provider, auth_provider_id, email, role) VALUES ('usr_gate', 'clerk', 'sub_gate', 'gate@example.com', 'student')`).run();
db.prepare(`INSERT INTO enrolments (id, user_id, level_id, status, started_at) VALUES ('enr_gate_3', 'usr_gate', 3, 'active', '2026-01-01T00:00:00.000Z')`).run();
const gateCourse = db.prepare('SELECT id FROM courses WHERE level_id = 3').first().id;
for (let n = 1; n <= 10; n += 1) {
  db.prepare('INSERT INTO units (id, course_id, sequence, title) VALUES (?, ?, ?, ?)')
    .bind(`unt_gate_${n}`, gateCourse, n, `Gate module ${n}`).run();
  db.prepare(`INSERT INTO learning_items (id, unit_id, sequence, kind, title) VALUES (?, ?, 1, 'quiz', 'Gate quiz')`)
    .bind(`itm_gate_q${n}`, `unt_gate_${n}`).run();
  db.prepare(`INSERT INTO learning_items (id, unit_id, sequence, kind, title) VALUES (?, ?, 2, 'assignment', 'Gate assignment')`)
    .bind(`itm_gate_a${n}`, `unt_gate_${n}`).run();
}

const beforeGate = await levelGateReport(env, { userId: 'usr_gate', levelId: 3 });
check('gate report: an unmarked authored module is outstanding WITH THE LEARNER',
  beforeGate.blocking.some((c) => c.id === 'level.gate.modules_complete'));
check('gate report: the staff confirmation is not counted against the act performing it',
  beforeGate.conditions.every((c) => c.id !== 'level.gate.staff_confirmation'));
check('gate report: the examination gates are listed as the College\'s, not the learner\'s',
  beforeGate.awaitingCollege.some((c) => c.id === 'level.gate.examination_overall')
  && beforeGate.blocking.every((c) => c.id !== 'level.gate.examination_overall'));

check('completeLevel: refuses while a module the learner owes is unfinished', await (async () => {
  try { await completeLevel(env, { userId: 'usr_gate', levelId: 3 }); return false; }
  catch (e) { return e instanceof ValidationError && 'level.gate.modules_complete' in (e.fields || {}); }
})());
check('completeLevel: the refusal did not half-write the enrolment',
  db.prepare(`SELECT status FROM enrolments WHERE id = 'enr_gate_3'`).first().status === 'active');

// Both components marked at the composite pass — the module completes,
// and with it the only gate the learner owed.
const markModule = (n) => {
  db.prepare(`INSERT INTO quiz_attempts (id, learning_item_id, user_id, answers_json, score, submitted_at) VALUES (?, ?, 'usr_gate', '[0]', 0.8, '2026-02-01T00:00:00.000Z')`)
    .bind(`qat_gate_${n}`, `itm_gate_q${n}`).run();
  db.prepare(`INSERT INTO assignment_submissions (id, learning_item_id, user_id, content, status, grade, submitted_at, graded_at) VALUES (?, ?, 'usr_gate', 'x', 'graded', 0.8, '2026-02-01T00:00:00.000Z', '2026-02-02T00:00:00.000Z')`)
    .bind(`asub_gate_${n}`, `itm_gate_a${n}`).run();
};

// Nine of ten first. A near miss is the case a gate is FOR: the count
// that lets nine through is the count that lets none of them mean
// anything.
for (let n = 1; n <= 9; n += 1) markModule(n);
const nineOfTen = await levelGateReport(env, { userId: 'usr_gate', levelId: 3 });
check('gate report: nine modules of ten is still outstanding, and says which count it is',
  nineOfTen.blocking.some((c) => c.id === 'level.gate.modules_complete' && c.detail.includes('9 of 10')),
  nineOfTen.blocking.map((c) => c.detail).join(' | '));
check('completeLevel: refuses at nine of ten', await (async () => {
  try { await completeLevel(env, { userId: 'usr_gate', levelId: 3 }); return false; }
  catch (e) { return e instanceof ValidationError; }
})());
markModule(10);

const afterGate = await levelGateReport(env, { userId: 'usr_gate', levelId: 3 });
check('gate report: nothing is outstanding with the learner once the module is marked',
  afterGate.blocking.length === 0, afterGate.blocking.map((c) => c.id).join(','));
check('gate report: what remains is named as the College\'s own unmade record',
  afterGate.awaitingCollege.length > 0 && afterGate.statement.includes('the College'));

const gateResult = await completeLevel(env, { userId: 'usr_gate', levelId: 3 });
check('completeLevel: proceeds once the learner owes nothing, without waiting on the College',
  gateResult.enrolment.status === 'completed');

// And the closure is recorded where the divergence was recorded.
const regs = JSON.parse(readFileSync(`${ROOT}/data/academic-regulations.json`, 'utf8'));
const levelDivergence = regs.conformance.divergences.find((d) => d.id === 'conformance.level_mark');
check('the regulations record this divergence as closed, with a date',
  Boolean(levelDivergence && levelDivergence.closed_on), levelDivergence && levelDivergence.observed);

console.log(`\n${pass} passed, ${fail} failed.`);
process.exit(fail ? 1 : 0);
