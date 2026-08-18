-- Migration 001 — object storage for learner recordings.
--
-- probe: SELECT 1 FROM sqlite_master WHERE type='table' AND name='recording_upload_parts'
--
-- The probe names recording_upload_parts because this file creates it
-- LAST. scripts/migrate.mjs treats a satisfied probe as "already
-- applied", so the probe target must be the final object created —
-- otherwise a run that failed part way would look complete.
--
-- Applies to a database already created from sql/schema.sql. Fresh
-- databases get the same shape directly from schema.sql; the two are
-- kept deliberately identical (see the note on CHECK below), because a
-- migrated production database that differs from the schema the tests
-- load is the classic source of "passes locally, fails in production".
--
-- Apply with:
--   wrangler d1 execute wec-lc --remote --file=sql/migrations/001-recording-storage.sql
-- or via the deploy workflow's `apply_migrations` input.
--
-- NOT idempotent: ALTER TABLE ADD COLUMN errors if the column already
-- exists. Run once per database.

-- ---------------------------------------------------------------------
-- learner_recordings — where the bytes actually live
-- ---------------------------------------------------------------------
--
-- `media_url` deliberately stays NOT NULL and keeps its meaning: where
-- to play this recording from. For an R2-backed take that is the
-- authorised streaming endpoint (/api/lms/recording/audio?id=...), not
-- a public URL — the bytes are never publicly addressable. Keeping the
-- column non-null avoids a table rebuild and means every existing
-- reader (the Listening Lab, the instructor queue) keeps working
-- against the same field with no change.
--
-- No CHECK constraint on upload_status: SQLite's ALTER TABLE ADD COLUMN
-- support for CHECK is not something to rely on across engines, and a
-- constraint that exists on fresh databases but not migrated ones is
-- worse than none. The allowed values are enforced in
-- functions/_lib/lms/recording-storage.js and asserted in the tests.
--   pending  — row created, bytes not yet complete
--   stored   — object committed to R2 and playable
--   failed   — upload abandoned; no object to serve
--   purged   — object deleted under a retention policy; row kept as the
--              assessment record, audio gone

ALTER TABLE learner_recordings ADD COLUMN object_key TEXT;
ALTER TABLE learner_recordings ADD COLUMN content_type TEXT;
ALTER TABLE learner_recordings ADD COLUMN bytes INTEGER;
ALTER TABLE learner_recordings ADD COLUMN sha256 TEXT;
ALTER TABLE learner_recordings ADD COLUMN upload_status TEXT NOT NULL DEFAULT 'stored';
ALTER TABLE learner_recordings ADD COLUMN upload_id TEXT;
ALTER TABLE learner_recordings ADD COLUMN retention_until TEXT;
ALTER TABLE learner_recordings ADD COLUMN purged_at TEXT;

-- Existing rows default to 'stored', not 'pending': they were created
-- before object storage existed and hold a blob URL that was playable
-- in the tab that made it. Marking them 'pending' would imply an upload
-- is in flight that never was, and would make them candidates for
-- cleanup. They are what they are — historical rows with no object —
-- and object_key IS NULL is what distinguishes them.

CREATE INDEX idx_learner_recordings_upload_status ON learner_recordings(upload_status);
CREATE INDEX idx_learner_recordings_retention ON learner_recordings(retention_until)
  WHERE retention_until IS NOT NULL AND purged_at IS NULL;

-- ---------------------------------------------------------------------
-- recording_upload_parts — what makes an upload resumable
-- ---------------------------------------------------------------------
--
-- R2 multipart state lives in R2, but the part numbers and etags needed
-- to COMPLETE an upload are returned per request and would otherwise be
-- lost the moment the Worker invocation ends. Each part is recorded
-- here as it lands, so a learner whose connection drops can resume:
-- the client asks which parts are already held and sends only the rest.
-- Without this table "resumable" would mean "restartable", which is not
-- the same promise.

CREATE TABLE recording_upload_parts (
  recording_id      TEXT NOT NULL REFERENCES learner_recordings(id),
  part_number       INTEGER NOT NULL,
  etag              TEXT NOT NULL,
  bytes             INTEGER NOT NULL,
  uploaded_at       TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ','now')),
  PRIMARY KEY (recording_id, part_number)
);

-- ---------------------------------------------------------------------
-- Retention policy — the mechanism, NOT the policy
-- ---------------------------------------------------------------------
--
-- How long a learner's voice recording may be kept is a governance
-- decision with data-protection consequences, and is NOT invented here.
-- The key is seeded as `null`, which means: keep indefinitely, purge
-- nothing. Only when an approved figure is written into this row does
-- any recording acquire a retention_until date, and only rows with such
-- a date are ever eligible for deletion.
--
-- Set it, once approved, with:
--   UPDATE platform_config SET value = '365' WHERE key = 'recording_retention_days';
--
-- Changing it affects recordings completed AFTER the change. Existing
-- rows keep the retention_until they were given, so a learner's terms
-- at the time of recording are not retroactively shortened.

INSERT INTO platform_config (key, value) VALUES ('recording_retention_days', 'null');
