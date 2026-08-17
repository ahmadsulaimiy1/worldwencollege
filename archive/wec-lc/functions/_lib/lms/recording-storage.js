// Object storage for learner voice recordings.
//
// The design problem is not "put bytes somewhere". It is that a
// learner's recorded voice is simultaneously: coursework, assessment
// evidence a certificate may later rest on, training input a future
// scorer will read, and personal data with a retention obligation. Each
// of those wants something different from the store, so the decisions
// are spelled out rather than left implicit:
//
//   SECURE       — the bucket is never public. Playback goes through
//                  serveRecording(), which authorises every request
//                  against the same rules as the rest of the LMS: the
//                  learner who made it, or staff. A signed public URL
//                  was rejected: a link that works without a session is
//                  a link that keeps working after one ends.
//
//   RESUMABLE    — R2 multipart, with part etags persisted in
//                  recording_upload_parts. A dropped connection resumes
//                  from the parts already held. Without persisting the
//                  etags this would be restartable, not resumable, and
//                  a learner on a poor connection would never finish a
//                  long take.
//
//   ENCRYPTED    — R2 encrypts objects at rest with AES-256, managed by
//                  Cloudflare. That is stated as what it is; no
//                  application-layer envelope encryption is claimed,
//                  because none is implemented. If key custody ever has
//                  to be ours rather than Cloudflare's, that is a real
//                  piece of work, not a config flag.
//
//   RETENTION    — a stamped retention_until per recording, read from
//                  platform_config at completion time. The default is
//                  null: keep indefinitely, purge nothing. The number
//                  is a governance decision and is not invented here.
//                  Recordings keep the retention they were given, so
//                  changing the policy never retroactively shortens the
//                  terms a learner already recorded under.
//
//   EVIDENCE     — SHA-256 of the assembled object, stored on the row.
//                  A certificate that rests on assessed speaking needs
//                  to be able to show the audio assessed is the audio
//                  held. purge() deletes the object and keeps the row,
//                  so the assessment record survives the audio.
//
//   AI-READY     — nothing here knows about scoring, and it does not
//                  need to: a scorer reads object_key through the same
//                  getRecordingObject() the playback endpoint uses, and
//                  writes to pronunciation_feedback with
//                  source='automated' alongside instructor rows.

import { db, NotFoundError, ValidationError, ConfigError, newId, nowIso } from '../db.js';
import { getConfigJson } from '../config.js';
import { assertLevelAccess, getLevelIdForUnit, upsertUnitProgress } from './content.js';

// R2 multipart requires every part except the last to be at least 5 MiB
// and identically sized. The client is told this number rather than
// guessing it; a client that picks its own smaller size produces an
// upload that only fails at complete(), which is the worst possible
// moment to find out.
export const PART_SIZE = 5 * 1024 * 1024;

// A voice take, not a media library. 100 MB is far beyond any plausible
// spoken response and still well inside R2's limits; the point of the
// cap is to reject a mistake or an abuse early rather than to be
// generous. Enforced against the client's declared size at init AND
// against the bytes actually received, because a declared size is a
// claim, not a fact.
export const MAX_BYTES = 100 * 1024 * 1024;

const ALLOWED_TYPES = new Set([
  'audio/webm', 'audio/ogg', 'audio/mp4', 'audio/mpeg', 'audio/wav', 'audio/x-wav', 'audio/aac',
]);

// MediaRecorder does not hand back a bare MIME type. Chrome reports
// `audio/webm;codecs=opus`, Firefox `audio/ogg; codecs=opus`, and an
// exact-match allow-list rejects every real recording ever made — which
// is what this code did until a browser test with an actual microphone
// caught it. Validate the base type; keep the full string, because the
// codec parameter is genuinely useful on playback.
//
// The full string ends up in a Content-Type response header, so it is
// length-capped and screened for CR/LF and NUL first: a value that
// crosses into a header is a header-injection surface, however
// unlikely a hostile client seems.
function normaliseContentType(raw) {
  if (typeof raw !== 'string') return null;
  const full = raw.trim();
  if (!full || full.length > 120 || /[\r\n\0]/.test(full)) return null;
  const base = full.split(';')[0].trim().toLowerCase();
  if (!ALLOWED_TYPES.has(base)) return null;
  return { base, full };
}

export const UPLOAD_STATUSES = ['pending', 'stored', 'failed', 'purged'];

function bucket(env) {
  if (!env.RECORDINGS) {
    throw new ConfigError('R2 binding "RECORDINGS" is not configured. See wrangler.toml § r2_buckets.');
  }
  return env.RECORDINGS;
}

// Keys are structured so the bucket can be reasoned about without the
// database: user, then item, then recording id. That makes a
// per-learner erasure request a prefix listing rather than a table
// scan, and makes an orphaned object identifiable on sight.
export function objectKeyFor({ userId, learningItemId, recordingId, contentType }) {
  const ext = contentType && contentType.includes('ogg') ? 'ogg'
    : contentType && contentType.includes('mp4') ? 'm4a'
      : contentType && contentType.includes('mpeg') ? 'mp3'
        : contentType && contentType.includes('wav') ? 'wav'
          : 'webm';
  return `recordings/${userId}/${learningItemId}/${recordingId}.${ext}`;
}

// ---------------------------------------------------------------------
// 1. init — authorise, reserve a row, open the multipart upload
// ---------------------------------------------------------------------
export async function initRecordingUpload(env, { userId, learningItemId, contentType, durationMs = null, declaredBytes = null }) {
  const item = await db(env).prepare('SELECT * FROM learning_items WHERE id = ?').bind(learningItemId).first();
  if (!item) throw new NotFoundError('Unknown learning item.');
  if (item.kind !== 'pronunciation' && item.kind !== 'listening') {
    throw new ValidationError('Recordings can only be submitted against a listening or pronunciation item.');
  }
  const type = normaliseContentType(contentType);
  if (!type) {
    throw new ValidationError(`Unsupported audio type "${contentType || ''}".`, { contentType: 'Unsupported' });
  }
  if (declaredBytes != null) {
    if (!Number.isInteger(declaredBytes) || declaredBytes <= 0) {
      throw new ValidationError('declaredBytes must be a positive integer.', { declaredBytes: 'Invalid' });
    }
    if (declaredBytes > MAX_BYTES) {
      throw new ValidationError(`Recording exceeds the ${Math.round(MAX_BYTES / 1048576)} MB limit.`, { declaredBytes: 'Too large' });
    }
  }

  // Authorisation before anything is created. A learner without access
  // to the level must not be able to consume storage against it.
  const levelId = await getLevelIdForUnit(env, item.unit_id);
  await assertLevelAccess(env, userId, levelId);

  const prior = await db(env)
    .prepare('SELECT MAX(attempt) AS maxAttempt FROM learner_recordings WHERE learning_item_id = ? AND user_id = ?')
    .bind(learningItemId, userId)
    .first();
  const attempt = (prior && prior.maxAttempt ? prior.maxAttempt : 0) + 1;

  const id = newId('rec');
  const key = objectKeyFor({ userId, learningItemId, recordingId: id, contentType: type.base });
  const mpu = await bucket(env).createMultipartUpload(key, { httpMetadata: { contentType: type.full } });

  await db(env)
    .prepare(`INSERT INTO learner_recordings
        (id, learning_item_id, user_id, media_url, duration_ms, attempt, status, submitted_at,
         object_key, content_type, upload_status, upload_id)
      VALUES (?, ?, ?, ?, ?, ?, 'submitted', ?, ?, ?, 'pending', ?)`)
    .bind(id, learningItemId, userId, playbackUrlFor(id), durationMs, attempt, nowIso(), key, type.full, mpu.uploadId)
    .run();

  return { recordingId: id, attempt, uploadId: mpu.uploadId, partSize: PART_SIZE, maxBytes: MAX_BYTES, uploadedParts: [] };
}

export function playbackUrlFor(recordingId) {
  return `/api/lms/recording/audio?id=${recordingId}`;
}

// ---------------------------------------------------------------------
// 2. part — stream one chunk, remember its etag
// ---------------------------------------------------------------------
export async function uploadRecordingPart(env, { userId, recordingId, partNumber, body, bytes }) {
  const rec = await ownedPendingRecording(env, { userId, recordingId });
  if (!Number.isInteger(partNumber) || partNumber < 1) {
    throw new ValidationError('partNumber must be a positive integer.', { partNumber: 'Invalid' });
  }

  // Enforce the cap against bytes actually received, across all parts —
  // the declared size at init was a claim by the client.
  const held = await db(env)
    .prepare('SELECT COALESCE(SUM(bytes), 0) AS total FROM recording_upload_parts WHERE recording_id = ? AND part_number != ?')
    .bind(recordingId, partNumber)
    .first();
  if ((held.total || 0) + bytes > MAX_BYTES) {
    await failUpload(env, rec);
    throw new ValidationError(`Recording exceeds the ${Math.round(MAX_BYTES / 1048576)} MB limit.`, { bytes: 'Too large' });
  }

  const mpu = bucket(env).resumeMultipartUpload(rec.object_key, rec.upload_id);
  const part = await mpu.uploadPart(partNumber, body);

  // Re-uploading a part after a dropped connection is normal, not an
  // error: the new etag replaces the old one for that part number.
  await db(env)
    .prepare(`INSERT INTO recording_upload_parts (recording_id, part_number, etag, bytes, uploaded_at)
      VALUES (?, ?, ?, ?, ?)
      ON CONFLICT(recording_id, part_number) DO UPDATE SET etag = excluded.etag, bytes = excluded.bytes, uploaded_at = excluded.uploaded_at`)
    .bind(recordingId, partNumber, part.etag, bytes, nowIso())
    .run();

  return { recordingId, partNumber, etag: part.etag, bytes };
}

// What the client asks for when resuming: which parts are already held,
// so it sends only what is missing.
export async function getUploadState(env, { userId, recordingId }) {
  const rec = await ownedPendingRecording(env, { userId, recordingId });
  const { results } = await db(env)
    .prepare('SELECT part_number AS partNumber, bytes FROM recording_upload_parts WHERE recording_id = ? ORDER BY part_number')
    .bind(recordingId)
    .all();
  return {
    recordingId,
    uploadStatus: rec.upload_status,
    partSize: PART_SIZE,
    uploadedParts: results.map((r) => r.partNumber),
    bytesHeld: results.reduce((n, r) => n + r.bytes, 0),
  };
}

// ---------------------------------------------------------------------
// 3. complete — assemble, fingerprint, stamp retention, count progress
// ---------------------------------------------------------------------
export async function completeRecordingUpload(env, { userId, recordingId, durationMs = null }) {
  const rec = await ownedPendingRecording(env, { userId, recordingId });
  const { results: parts } = await db(env)
    .prepare('SELECT part_number AS partNumber, etag, bytes FROM recording_upload_parts WHERE recording_id = ? ORDER BY part_number')
    .bind(recordingId)
    .all();
  if (!parts.length) throw new ValidationError('No parts have been uploaded for this recording.');

  // Gaps would produce an object silently missing audio in the middle —
  // worse than a failed upload, because it looks like a valid take.
  for (let i = 0; i < parts.length; i++) {
    if (parts[i].partNumber !== i + 1) {
      throw new ValidationError(`Upload is incomplete: part ${i + 1} is missing.`, { parts: 'Incomplete' });
    }
  }

  const mpu = bucket(env).resumeMultipartUpload(rec.object_key, rec.upload_id);
  await mpu.complete(parts.map((p) => ({ partNumber: p.partNumber, etag: p.etag })));

  // Fingerprint the assembled object, not the parts as sent. This is
  // the artefact a certificate would rest on, so it is hashed as
  // stored — and reading it back also proves the object is retrievable
  // before the row is called 'stored'.
  const stored = await bucket(env).get(rec.object_key);
  if (!stored) throw new ConfigError('Upload completed but the object could not be read back.');
  const bytesActual = stored.size ?? null;
  const sha256 = await sha256Hex(await stored.arrayBuffer());

  const retentionUntil = await computeRetentionUntil(env);

  await db(env)
    .prepare(`UPDATE learner_recordings
       SET upload_status = 'stored', bytes = ?, sha256 = ?, retention_until = ?, upload_id = NULL,
           duration_ms = COALESCE(?, duration_ms)
       WHERE id = ?`)
    .bind(bytesActual, sha256, retentionUntil, durationMs, recordingId)
    .run();
  await db(env).prepare('DELETE FROM recording_upload_parts WHERE recording_id = ?').bind(recordingId).run();

  // Speaking practice counts as engagement with the unit, never as
  // completion — a recording is only complete once it has been
  // assessed. Same rule as the pre-storage path it replaces.
  const item = await db(env).prepare('SELECT unit_id FROM learning_items WHERE id = ?').bind(rec.learning_item_id).first();
  if (item) await upsertUnitProgress(env, { userId, unitId: item.unit_id, status: 'in_progress' });

  return {
    id: recordingId,
    attempt: rec.attempt,
    status: 'submitted',
    uploadStatus: 'stored',
    bytes: bytesActual,
    sha256,
    retentionUntil,
    mediaUrl: playbackUrlFor(recordingId),
  };
}

// ---------------------------------------------------------------------
// 4. playback — authorised streaming, with Range support
// ---------------------------------------------------------------------
//
// Returns a plain descriptor rather than a Response so the endpoint
// owns HTTP and this module stays testable without a Workers runtime.
export async function getRecordingObject(env, { recordingId, requester, range = null }) {
  const rec = await db(env).prepare('SELECT * FROM learner_recordings WHERE id = ?').bind(recordingId).first();
  if (!rec) throw new NotFoundError('Unknown recording.');

  // The learner who recorded it, or staff. Nobody else — not another
  // learner on the same module, not an unauthenticated link holder.
  const isOwner = rec.user_id === requester.id;
  const isStaff = requester.role === 'staff' || requester.role === 'admin';
  if (!isOwner && !isStaff) throw new NotFoundError('Unknown recording.');

  if (rec.purged_at) {
    throw new NotFoundError('This recording was deleted under the retention policy. The assessment record remains.');
  }
  if (!rec.object_key) {
    throw new NotFoundError('This recording predates object storage and has no stored audio.');
  }
  if (rec.upload_status !== 'stored') {
    throw new NotFoundError('This recording has not finished uploading.');
  }

  const object = await bucket(env).get(rec.object_key, range ? { range } : undefined);
  if (!object) throw new NotFoundError('The stored audio for this recording is missing.');

  return {
    body: object.body,
    size: rec.bytes ?? object.size ?? null,
    contentType: rec.content_type || 'application/octet-stream',
    sha256: rec.sha256,
    range: object.range || null,
  };
}

// ---------------------------------------------------------------------
// 5. retention — the mechanism; the policy is a governance decision
// ---------------------------------------------------------------------
export async function computeRetentionUntil(env, now = new Date()) {
  const days = await getConfigJson(env, 'recording_retention_days', { required: false });
  if (days == null) return null;               // no policy set: keep indefinitely
  if (typeof days !== 'number' || !Number.isFinite(days) || days <= 0) {
    throw new ConfigError('platform_config "recording_retention_days" must be a positive number or null.');
  }
  return new Date(now.getTime() + days * 86400000).toISOString().replace(/\.\d+Z$/, '.000Z');
}

// Deletes audio whose retention has expired and keeps the row. Never
// touches a row with retention_until NULL — an unset policy means
// "keep", and a purge that quietly interpreted it as "delete" would be
// the single worst bug this module could have.
export async function purgeExpiredRecordings(env, { now = nowIso(), limit = 200, dryRun = false } = {}) {
  const { results } = await db(env)
    .prepare(`SELECT id, object_key FROM learner_recordings
       WHERE retention_until IS NOT NULL AND retention_until <= ? AND purged_at IS NULL AND object_key IS NOT NULL
       ORDER BY retention_until LIMIT ?`)
    .bind(now, limit)
    .all();

  if (dryRun) return { examined: results.length, purged: 0, dryRun: true, ids: results.map((r) => r.id) };

  const purged = [];
  for (const row of results) {
    await bucket(env).delete(row.object_key);
    await db(env)
      .prepare("UPDATE learner_recordings SET upload_status = 'purged', purged_at = ? WHERE id = ?")
      .bind(now, row.id)
      .run();
    purged.push(row.id);
  }
  return { examined: results.length, purged: purged.length, dryRun: false, ids: purged };
}

// Erasure on request — distinct from retention expiry, and deliberately
// separate. Retention is a schedule; this is a person asking. Both keep
// the assessment row and destroy the audio.
export async function purgeRecordingsForUser(env, { userId }) {
  const { results } = await db(env)
    .prepare('SELECT id, object_key FROM learner_recordings WHERE user_id = ? AND object_key IS NOT NULL AND purged_at IS NULL')
    .bind(userId)
    .all();
  const at = nowIso();
  for (const row of results) {
    await bucket(env).delete(row.object_key);
    await db(env)
      .prepare("UPDATE learner_recordings SET upload_status = 'purged', purged_at = ? WHERE id = ?")
      .bind(at, row.id)
      .run();
  }
  return { purged: results.length, ids: results.map((r) => r.id) };
}

// ---------------------------------------------------------------------
// internals
// ---------------------------------------------------------------------
async function ownedPendingRecording(env, { userId, recordingId }) {
  const rec = await db(env).prepare('SELECT * FROM learner_recordings WHERE id = ?').bind(recordingId).first();
  // Same 404 for "does not exist" and "is not yours": a distinguishable
  // response would let anyone probe which recording ids are real.
  if (!rec || rec.user_id !== userId) throw new NotFoundError('Unknown recording.');
  if (rec.upload_status !== 'pending') {
    throw new ValidationError(`This recording is already ${rec.upload_status}; start a new attempt instead.`);
  }
  if (!rec.upload_id || !rec.object_key) throw new ConfigError('Recording is pending but has no upload in progress.');
  return rec;
}

async function failUpload(env, rec) {
  try {
    await bucket(env).resumeMultipartUpload(rec.object_key, rec.upload_id).abort();
  } catch {
    // An abort that fails leaves an incomplete multipart upload, which
    // R2 expires on its own. Never let it mask the real error.
  }
  await db(env)
    .prepare("UPDATE learner_recordings SET upload_status = 'failed', upload_id = NULL WHERE id = ?")
    .bind(rec.id)
    .run();
  await db(env).prepare('DELETE FROM recording_upload_parts WHERE recording_id = ?').bind(rec.id).run();
}

export async function abandonRecordingUpload(env, { userId, recordingId }) {
  const rec = await ownedPendingRecording(env, { userId, recordingId });
  await failUpload(env, rec);
  return { id: recordingId, uploadStatus: 'failed' };
}

async function sha256Hex(buffer) {
  const digest = await crypto.subtle.digest('SHA-256', buffer);
  return [...new Uint8Array(digest)].map((b) => b.toString(16).padStart(2, '0')).join('');
}
