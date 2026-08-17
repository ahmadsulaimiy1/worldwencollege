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

console.log(`\n${pass} passed, ${fail} failed.`);
process.exit(fail ? 1 : 0);
