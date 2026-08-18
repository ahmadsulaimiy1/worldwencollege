-- Migration 002 — enrolment integrity and an audit trail.
--
-- probe: SELECT 1 FROM sqlite_master WHERE type='index' AND name='idx_enrolment_events_enrolment'
--
-- Last object created by this file — see the ordering note in
-- scripts/migrate.mjs. Probing anything earlier would let a partial
-- run be recorded as complete.
--
-- Prompted by real use: the first learner account on the deployed
-- preview had to be enrolled by hand-writing SQL into the D1 console,
-- because nothing in the platform can enrol anybody except a completed
-- payment. That exposed two gaps at once.
--
-- Apply with:
--   wrangler d1 execute wec-lc --remote --file=sql/migrations/002-enrolment-integrity.sql
-- or via the deploy workflow's `apply_migrations` input.
--
-- NOT idempotent. Run once per database.

-- ---------------------------------------------------------------------
-- 1. One LIVE enrolment per learner per level
-- ---------------------------------------------------------------------
--
-- `enrolments` had no uniqueness at all, so the same learner could hold
-- two active enrolments in the same level. Nothing rejected it, and
-- hand-written SQL run twice — precisely how the first enrolment was
-- created — produces exactly that.
--
-- It is not cosmetic. student/progression.js reads
--   SELECT * FROM enrolments WHERE user_id = ? AND level_id = ?
-- and takes the first row. With duplicates, completeLevel() marks one
-- of them completed and leaves the other active: the learner is
-- simultaneously finished and in progress, their dashboard lists the
-- level twice, and which row wins depends on row order.
--
-- PARTIAL index, excluding 'withdrawn', because withdrawing and
-- re-enrolling is a real thing an institution does. History is kept;
-- only two *live* enrolments in one level are forbidden. That is the
-- actual domain rule, and a plain UNIQUE(user_id, level_id) would have
-- made a legitimate re-enrolment impossible.
--
-- If this statement fails with a uniqueness error, the database already
-- holds duplicates. Do NOT delete rows to force it through — enrolments
-- are academic and financial records. Find them with:
--   SELECT user_id, level_id, COUNT(*) c FROM enrolments
--    WHERE status != 'withdrawn' GROUP BY 1,2 HAVING c > 1;
-- and resolve each case deliberately.

CREATE UNIQUE INDEX idx_enrolments_one_live_per_level
  ON enrolments(user_id, level_id)
  WHERE status != 'withdrawn';

-- ---------------------------------------------------------------------
-- 2. Why an enrolment exists
-- ---------------------------------------------------------------------
--
-- An enrolment row says a learner has access. It does not say who
-- granted it or why — and once staff can enrol somebody without a
-- payment, that becomes the important question. A scholarship, a bank
-- transfer, a staff test account and a mistake all look identical in
-- the enrolments table.
--
-- Deliberately narrow: this records enrolment status changes, not a
-- general-purpose audit log. A general one would need retention rules,
-- access controls and a policy nobody has set, and building it
-- speculatively would be inventing exactly that policy.
--
-- actor_id NULL means the system did it (a payment webhook), which is
-- the honest representation — no person made that decision.

CREATE TABLE enrolment_events (
  id                TEXT PRIMARY KEY,           -- 'eev_' + uuid
  enrolment_id      TEXT NOT NULL REFERENCES enrolments(id),
  user_id           TEXT NOT NULL REFERENCES users(id),   -- the learner
  level_id          INTEGER NOT NULL REFERENCES programme_levels(id),
  from_status       TEXT,                       -- NULL when first created
  to_status         TEXT NOT NULL,
  actor_id          TEXT REFERENCES users(id),  -- staff member, or NULL for system
  reason            TEXT,                       -- required for staff-initiated changes
  created_at        TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ','now'))
);
CREATE INDEX idx_enrolment_events_user ON enrolment_events(user_id, created_at);
CREATE INDEX idx_enrolment_events_enrolment ON enrolment_events(enrolment_id);
