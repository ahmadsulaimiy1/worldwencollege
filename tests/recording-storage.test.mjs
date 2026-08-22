// functions/_lib/lms/recording-storage.js against a real SQLite engine
// (d1-shim) and an R2 stand-in that enforces the multipart rules that
// actually bite (r2-shim).
//
// The emphasis is deliberately on what must NEVER happen — another
// learner reading a recording, a gap in the parts becoming a valid
// object, an unset retention policy being read as "delete" — because
// those are the failures that are silent in production. A happy-path
// upload that works is the easy half.
import { readFileSync } from 'node:fs';
import { makeD1 } from './d1-shim.mjs';
import { makeR2 } from './r2-shim.mjs';
import { ROOT, loadUrl } from './helpers.mjs';

const storage = await import(loadUrl('functions/_lib/lms/recording-storage.js'));
const { setConfigJson } = await import(loadUrl('functions/_lib/config.js'));

let pass = 0, fail = 0;
const check = (label, cond, detail) => {
  console.log((cond ? 'PASS ' : 'FAIL ') + label + (cond || detail === undefined ? '' : ` — ${detail}`));
  cond ? pass++ : fail++;
};
async function throws(fn, name) {
  try { await fn(); return null; } catch (e) { return e; }
}

function freshEnv() {
  const env = { DB: makeD1(readFileSync(`${ROOT}/sql/schema.sql`, 'utf8')), RECORDINGS: makeR2() };
  const sql = (s, ...b) => env.DB.prepare(s).bind(...b).run();
  sql("INSERT INTO users (id, auth_provider, auth_provider_id, email, role) VALUES ('usr_a','clerk','sub_a','a@example.com','student')");
  sql("INSERT INTO users (id, auth_provider, auth_provider_id, email, role) VALUES ('usr_b','clerk','sub_b','b@example.com','student')");
  sql("INSERT INTO users (id, auth_provider, auth_provider_id, email, role) VALUES ('usr_t','clerk','sub_t','t@example.com','staff')");
  sql("INSERT INTO enrolments (id,user_id,level_id,status,started_at) VALUES ('enr_a','usr_a',1,'active','2026-01-01T00:00:00.000Z')");
  sql("INSERT INTO enrolments (id,user_id,level_id,status,started_at) VALUES ('enr_b','usr_b',1,'active','2026-01-01T00:00:00.000Z')");
  sql("INSERT INTO units (id, course_id, sequence, title) VALUES ('unt_x','crs_level_1',1,'Unit X')");
  sql("INSERT INTO learning_items (id, unit_id, sequence, kind, title, body) VALUES ('itm_p','unt_x',1,'pronunciation','Drill','x')");
  sql("INSERT INTO learning_items (id, unit_id, sequence, kind, title, body) VALUES ('itm_r','unt_x',2,'reading','Read','x')");
  return env;
}

const AUDIO = 'audio/webm';
const bytesOf = (n, fill = 65) => new Uint8Array(n).fill(fill);

// Drives a whole upload the way the endpoints do.
async function uploadTake(env, { userId, itemId = 'itm_p', chunks = [bytesOf(2048)] }) {
  const init = await storage.initRecordingUpload(env, { userId, learningItemId: itemId, contentType: AUDIO, declaredBytes: chunks.reduce((n, c) => n + c.length, 0) });
  for (let i = 0; i < chunks.length; i++) {
    await storage.uploadRecordingPart(env, { userId, recordingId: init.recordingId, partNumber: i + 1, body: chunks[i], bytes: chunks[i].length });
  }
  const done = await storage.completeRecordingUpload(env, { userId, recordingId: init.recordingId, durationMs: 4200 });
  return { init, done };
}

// ---------------------------------------------------------------------
// Happy path
// ---------------------------------------------------------------------
{
  const env = freshEnv();
  const { init, done } = await uploadTake(env, { userId: 'usr_a' });
  check('An upload completes and the row reports stored', done.uploadStatus === 'stored', done.uploadStatus);
  check('The bytes actually reach the bucket', env.RECORDINGS.__objectCount() === 1, env.RECORDINGS.__objectCount());
  check('The stored size is measured, not taken from the client', done.bytes === 2048, done.bytes);
  check('A SHA-256 fingerprint is recorded as evidence', /^[0-9a-f]{64}$/.test(done.sha256 || ''), done.sha256);
  check('mediaUrl points at the authorised endpoint, not a public URL',
    done.mediaUrl === `/api/lms/recording/audio?id=${init.recordingId}`, done.mediaUrl);

  const row = await env.DB.prepare('SELECT * FROM learner_recordings WHERE id = ?').bind(init.recordingId).first();
  check('The object key is namespaced by learner and item',
    row.object_key === `recordings/usr_a/itm_p/${init.recordingId}.webm`, row.object_key);
  check('The multipart upload id is cleared once complete', row.upload_id === null, row.upload_id);
  check('Part bookkeeping is cleaned up after completion',
    (await env.DB.prepare('SELECT COUNT(*) AS n FROM recording_upload_parts').bind().first()).n === 0);
  check('No multipart upload is left open', env.RECORDINGS.__openUploads() === 0, env.RECORDINGS.__openUploads());

  const prog = await env.DB.prepare("SELECT status FROM unit_progress WHERE user_id='usr_a' AND unit_id='unt_x'").bind().first();
  check('Recording counts as engagement, never as completion', prog && prog.status === 'in_progress', prog && prog.status);
}

// ---------------------------------------------------------------------
// Resumability — the claim that distinguishes this from "restartable"
// ---------------------------------------------------------------------
{
  const env = freshEnv();
  const big = bytesOf(5 * 1024 * 1024);   // a legal non-final part
  const tail = bytesOf(1024, 66);
  const init = await storage.initRecordingUpload(env, { userId: 'usr_a', learningItemId: 'itm_p', contentType: AUDIO });
  await storage.uploadRecordingPart(env, { userId: 'usr_a', recordingId: init.recordingId, partNumber: 1, body: big, bytes: big.length });

  // ...connection drops here. The client asks what survived.
  const state = await storage.getUploadState(env, { userId: 'usr_a', recordingId: init.recordingId });
  check('A resumed upload is told which parts are already held',
    state.uploadedParts.length === 1 && state.uploadedParts[0] === 1, JSON.stringify(state.uploadedParts));
  check('...and how many bytes that is, so it can seek the file', state.bytesHeld === big.length, state.bytesHeld);
  check('...and the part size to use, rather than guessing', state.partSize === storage.PART_SIZE, state.partSize);

  await storage.uploadRecordingPart(env, { userId: 'usr_a', recordingId: init.recordingId, partNumber: 2, body: tail, bytes: tail.length });
  const done = await storage.completeRecordingUpload(env, { userId: 'usr_a', recordingId: init.recordingId });
  check('Resuming produces one whole object, not a truncated one',
    done.bytes === big.length + tail.length, done.bytes);

  const raw = env.RECORDINGS.__raw(`recordings/usr_a/itm_p/${init.recordingId}.webm`);
  check('The parts are assembled in order', raw[0] === 65 && raw[raw.length - 1] === 66);
}

{
  // Re-sending a part after a timeout is normal, not an error.
  const env = freshEnv();
  const init = await storage.initRecordingUpload(env, { userId: 'usr_a', learningItemId: 'itm_p', contentType: AUDIO });
  await storage.uploadRecordingPart(env, { userId: 'usr_a', recordingId: init.recordingId, partNumber: 1, body: bytesOf(500), bytes: 500 });
  await storage.uploadRecordingPart(env, { userId: 'usr_a', recordingId: init.recordingId, partNumber: 1, body: bytesOf(900, 67), bytes: 900 });
  const done = await storage.completeRecordingUpload(env, { userId: 'usr_a', recordingId: init.recordingId });
  check('Re-uploading a part replaces it rather than duplicating it', done.bytes === 900, done.bytes);
}

{
  // A gap must never assemble into something that looks like a valid take.
  const env = freshEnv();
  const init = await storage.initRecordingUpload(env, { userId: 'usr_a', learningItemId: 'itm_p', contentType: AUDIO });
  await storage.uploadRecordingPart(env, { userId: 'usr_a', recordingId: init.recordingId, partNumber: 1, body: bytesOf(100), bytes: 100 });
  await storage.uploadRecordingPart(env, { userId: 'usr_a', recordingId: init.recordingId, partNumber: 3, body: bytesOf(100), bytes: 100 });
  const err = await throws(() => storage.completeRecordingUpload(env, { userId: 'usr_a', recordingId: init.recordingId }));
  check('A missing part fails completion instead of silently dropping audio',
    err && /part 2 is missing/i.test(err.message), err && err.message);
  check('...and nothing is written to the bucket', env.RECORDINGS.__objectCount() === 0);
}

// ---------------------------------------------------------------------
// Authorisation — someone else's voice
// ---------------------------------------------------------------------
{
  const env = freshEnv();
  const { init } = await uploadTake(env, { userId: 'usr_a' });
  const owner = { id: 'usr_a', role: 'student' };
  const other = { id: 'usr_b', role: 'student' };
  const staff = { id: 'usr_t', role: 'staff' };

  const mine = await storage.getRecordingObject(env, { recordingId: init.recordingId, requester: owner });
  check('The learner can play back their own recording', mine && mine.size === 2048, mine && mine.size);

  const asStaff = await storage.getRecordingObject(env, { recordingId: init.recordingId, requester: staff });
  check('Staff can play it back for review', asStaff && asStaff.size === 2048);

  const denied = await throws(() => storage.getRecordingObject(env, { recordingId: init.recordingId, requester: other }));
  check('Another learner cannot play it back', denied && denied.name === 'NotFoundError', denied && denied.name);
  check('...and is told "unknown", not "forbidden", so ids cannot be probed',
    denied && /unknown recording/i.test(denied.message), denied && denied.message);

  const hijack = await throws(() => storage.uploadRecordingPart(env, { userId: 'usr_b', recordingId: init.recordingId, partNumber: 1, body: bytesOf(10), bytes: 10 }));
  check('Another learner cannot upload into someone else\'s recording',
    hijack && hijack.name === 'NotFoundError', hijack && hijack.name);
}

{
  const env = freshEnv();
  const denied = await throws(() => storage.initRecordingUpload(env, { userId: 'usr_a', learningItemId: 'itm_r', contentType: AUDIO }));
  check('A reading item cannot accept a recording', denied && denied.name === 'ValidationError', denied && denied.name);

  const badType = await throws(() => storage.initRecordingUpload(env, { userId: 'usr_a', learningItemId: 'itm_p', contentType: 'application/x-msdownload' }));
  check('A non-audio content type is refused at init', badType && badType.name === 'ValidationError', badType && badType.name);
  check('...before any storage is reserved', env.RECORDINGS.__openUploads() === 0);

  const tooBig = await throws(() => storage.initRecordingUpload(env, { userId: 'usr_a', learningItemId: 'itm_p', contentType: AUDIO, declaredBytes: storage.MAX_BYTES + 1 }));
  check('An oversized declared size is refused at init', tooBig && tooBig.name === 'ValidationError', tooBig && tooBig.name);
}

{
  // Regression: MediaRecorder never reports a bare MIME type. An
  // exact-match allow-list rejected every real recording, and only a
  // browser test with an actual microphone caught it — a unit test
  // that picks its own tidy content type never would.
  const env = freshEnv();
  for (const real of ['audio/webm;codecs=opus', 'audio/ogg; codecs=opus', 'audio/mp4;codecs=mp4a.40.2', 'AUDIO/WEBM;codecs=opus']) {
    const init = await throws(() => storage.initRecordingUpload(env, { userId: 'usr_a', learningItemId: 'itm_p', contentType: real }));
    check(`A real MediaRecorder type is accepted: ${real}`, init === null, init && init.message);
  }
  const row = await env.DB.prepare("SELECT content_type, object_key FROM learner_recordings WHERE content_type LIKE 'audio/ogg%'").bind().first();
  check('The codec parameter is preserved for playback', row && /codecs=opus/.test(row.content_type), row && row.content_type);
  check('...while the file extension comes from the base type', row && row.object_key.endsWith('.ogg'), row && row.object_key);

  // The stored type reaches a Content-Type response header.
  const injected = await throws(() => storage.initRecordingUpload(env, {
    userId: 'usr_a', learningItemId: 'itm_p', contentType: 'audio/webm\r\nX-Injected: yes',
  }));
  check('A content type carrying CRLF is refused, not echoed into a header',
    injected && injected.name === 'ValidationError', injected && injected.name);
  const longType = await throws(() => storage.initRecordingUpload(env, {
    userId: 'usr_a', learningItemId: 'itm_p', contentType: 'audio/webm;codecs=' + 'x'.repeat(200),
  }));
  check('An absurdly long content type is refused', longType && longType.name === 'ValidationError', longType && longType.name);
}

{
  // A declared size is a claim. The cap has to hold against what arrives.
  const env = freshEnv();
  const init = await storage.initRecordingUpload(env, { userId: 'usr_a', learningItemId: 'itm_p', contentType: AUDIO, declaredBytes: 1024 });
  const err = await throws(() => storage.uploadRecordingPart(env, {
    userId: 'usr_a', recordingId: init.recordingId, partNumber: 1,
    body: bytesOf(1024), bytes: storage.MAX_BYTES + 1,
  }));
  check('The size cap is enforced against bytes received, not bytes declared',
    err && err.name === 'ValidationError', err && err.name);
  const row = await env.DB.prepare('SELECT upload_status FROM learner_recordings WHERE id = ?').bind(init.recordingId).first();
  check('...and the over-large attempt is marked failed, not left pending', row.upload_status === 'failed', row.upload_status);
}

// ---------------------------------------------------------------------
// Attempt history — re-recording must not overwrite
// ---------------------------------------------------------------------
{
  const env = freshEnv();
  const first = await uploadTake(env, { userId: 'usr_a' });
  const second = await uploadTake(env, { userId: 'usr_a', chunks: [bytesOf(3000, 90)] });
  check('A second take is attempt 2, not a replacement',
    first.done.attempt === 1 && second.done.attempt === 2, `${first.done.attempt}/${second.done.attempt}`);
  check('Both takes exist in the bucket', env.RECORDINGS.__objectCount() === 2, env.RECORDINGS.__objectCount());
  const rows = await env.DB.prepare('SELECT COUNT(*) AS n FROM learner_recordings WHERE user_id = ?').bind('usr_a').all();
  check('Both rows survive as assessment history', rows.results[0].n === 2, rows.results[0].n);
}

// ---------------------------------------------------------------------
// Retention — the mechanism exists; the policy is not invented
// ---------------------------------------------------------------------
{
  // THE SAFETY PROPERTY: if the retention policy is ever unset, nothing
  // is deleted. Still true, still worth asserting — but the premise is
  // now established by the test rather than inherited from the shipped
  // default, because that default changed.
  //
  // Governance D1 adopted 730 days on 14 August 2026 and it sat
  // unimplemented until migration 031 put it in force. These three
  // assertions read as "with no policy set" and were silently testing
  // "with the policy the College ships", which is a different and much
  // weaker thing. They now set it to null themselves.
  const env = freshEnv();
  await setConfigJson(env, 'recording_retention_days', null);
  const until = await storage.computeRetentionUntil(env);
  check('With no policy set, a recording gets no expiry date', until === null, until);

  const { init } = await uploadTake(env, { userId: 'usr_a' });
  const row = await env.DB.prepare('SELECT retention_until FROM learner_recordings WHERE id = ?').bind(init.recordingId).first();
  check('...so nothing is stamped for deletion by default', row.retention_until === null, row.retention_until);

  const swept = await storage.purgeExpiredRecordings(env, { now: '2099-01-01T00:00:00.000Z' });
  check('An unset policy is never read as "delete everything"', swept.purged === 0, JSON.stringify(swept));
  check('...and the audio is still there', env.RECORDINGS.__objectCount() === 1);
}

// The policy the College actually ships, as distinct from the mechanism
// above. Governance D1, in force since migration 031.
{
  const env = freshEnv();
  const until = await storage.computeRetentionUntil(env);
  check('The shipped policy stamps an expiry, because D1 is in force',
    typeof until === 'string' && until.endsWith('Z'), until);
  const days = until ? Math.round((Date.parse(until) - Date.now()) / 86400000) : null;
  check('...730 days out, which is the figure the Executive adopted',
    days !== null && Math.abs(days - 730) <= 1, `${days} days`);
}

{
  const env = freshEnv();
  await setConfigJson(env, 'recording_retention_days', 30);
  const { init } = await uploadTake(env, { userId: 'usr_a' });
  const row = await env.DB.prepare('SELECT retention_until FROM learner_recordings WHERE id = ?').bind(init.recordingId).first();
  check('With a policy set, each recording is stamped with its own expiry',
    typeof row.retention_until === 'string' && row.retention_until.endsWith('Z'), row.retention_until);

  const early = await storage.purgeExpiredRecordings(env, { now: '2026-01-01T00:00:00.000Z' });
  check('A recording inside its retention window is not touched', early.purged === 0, JSON.stringify(early));

  const dry = await storage.purgeExpiredRecordings(env, { now: '2099-01-01T00:00:00.000Z', dryRun: true });
  check('A dry run reports what would go without deleting it',
    dry.examined === 1 && dry.purged === 0 && env.RECORDINGS.__objectCount() === 1, JSON.stringify(dry));

  const done = await storage.purgeExpiredRecordings(env, { now: '2099-01-01T00:00:00.000Z' });
  check('An expired recording is purged when confirmed', done.purged === 1, JSON.stringify(done));
  check('...the audio is gone from the bucket', env.RECORDINGS.__objectCount() === 0);

  const after = await env.DB.prepare('SELECT * FROM learner_recordings WHERE id = ?').bind(init.recordingId).first();
  check('...but the assessment row survives the audio',
    after && after.upload_status === 'purged' && after.purged_at, after && after.upload_status);
  check('...and its fingerprint is kept as evidence of what was assessed',
    /^[0-9a-f]{64}$/.test(after.sha256 || ''), after && after.sha256);

  const gone = await throws(() => storage.getRecordingObject(env, { recordingId: init.recordingId, requester: { id: 'usr_a', role: 'student' } }));
  check('Playing a purged recording explains itself rather than 500ing',
    gone && gone.name === 'NotFoundError' && /retention policy/i.test(gone.message), gone && gone.message);
}

{
  // Changing the policy must not retroactively shorten what a learner
  // already recorded under.
  const env = freshEnv();
  await setConfigJson(env, 'recording_retention_days', 3650);
  const { init } = await uploadTake(env, { userId: 'usr_a' });
  const before = await env.DB.prepare('SELECT retention_until FROM learner_recordings WHERE id = ?').bind(init.recordingId).first();
  await setConfigJson(env, 'recording_retention_days', 1);
  const after = await env.DB.prepare('SELECT retention_until FROM learner_recordings WHERE id = ?').bind(init.recordingId).first();
  check('Shortening the policy does not re-date existing recordings',
    before.retention_until === after.retention_until, `${before.retention_until} -> ${after.retention_until}`);
}

{
  const env = freshEnv();
  await setConfigJson(env, 'recording_retention_days', 'soon');
  const err = await throws(() => storage.computeRetentionUntil(env));
  check('A nonsense retention value is a configuration error, not a silent no-op',
    err && err.name === 'ConfigError', err && err.name);
}

// ---------------------------------------------------------------------
// Erasure on request
// ---------------------------------------------------------------------
{
  const env = freshEnv();
  await uploadTake(env, { userId: 'usr_a' });
  await uploadTake(env, { userId: 'usr_a' });
  await uploadTake(env, { userId: 'usr_b' });
  const result = await storage.purgeRecordingsForUser(env, { userId: 'usr_a' });
  check('Erasure removes every recording for that learner', result.purged === 2, JSON.stringify(result));
  check('...and nobody else\'s', env.RECORDINGS.__objectCount() === 1, env.RECORDINGS.__objectCount());
  const b = await env.DB.prepare("SELECT upload_status FROM learner_recordings WHERE user_id='usr_b'").bind().first();
  check('...leaving the other learner\'s row untouched', b.upload_status === 'stored', b.upload_status);
}

// ---------------------------------------------------------------------
// Range requests, and the states playback must refuse
// ---------------------------------------------------------------------
{
  const env = freshEnv();
  const { init } = await uploadTake(env, { userId: 'usr_a', chunks: [bytesOf(4096)] });
  const part = await storage.getRecordingObject(env, {
    recordingId: init.recordingId, requester: { id: 'usr_a', role: 'student' }, range: { offset: 100, length: 50 },
  });
  check('A range request returns just that slice', part.body.length === 50, part.body.length);
  check('...while still reporting the whole object size, so Content-Range is right',
    part.size === 4096, part.size);

  const pending = await storage.initRecordingUpload(env, { userId: 'usr_a', learningItemId: 'itm_p', contentType: AUDIO });
  const notReady = await throws(() => storage.getRecordingObject(env, { recordingId: pending.recordingId, requester: { id: 'usr_a', role: 'student' } }));
  check('An unfinished upload is not playable', notReady && /not finished uploading/i.test(notReady.message), notReady && notReady.message);
}

{
  // Rows that predate object storage must degrade honestly.
  const env = freshEnv();
  env.DB.prepare(`INSERT INTO learner_recordings (id, learning_item_id, user_id, media_url, attempt, status, submitted_at, upload_status)
    VALUES ('rec_legacy','itm_p','usr_a','blob:https://example/abc',1,'submitted','2026-01-01T00:00:00.000Z','stored')`).bind().run();
  const err = await throws(() => storage.getRecordingObject(env, { recordingId: 'rec_legacy', requester: { id: 'usr_a', role: 'student' } }));
  check('A pre-storage recording says so instead of pretending to have audio',
    err && /predates object storage/i.test(err.message), err && err.message);
}

// ---------------------------------------------------------------------
// Configuration
// ---------------------------------------------------------------------
{
  const env = { DB: makeD1(readFileSync(`${ROOT}/sql/schema.sql`, 'utf8')) };   // no RECORDINGS binding
  const err = await throws(() => storage.initRecordingUpload(env, { userId: 'usr_a', learningItemId: 'itm_p', contentType: AUDIO }));
  check('A missing R2 binding is a clear configuration error',
    err && (err.name === 'ConfigError' || err.name === 'NotFoundError'), err && `${err.name}: ${err.message}`);
}

console.log(`\n${pass} passed, ${fail} failed.`);
process.exit(fail ? 1 : 0);
