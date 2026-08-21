-- Migration 003 — appointments: who holds staff or administrator access.
--
-- probe: SELECT 1 FROM sqlite_master WHERE type='index' AND name='idx_role_events_actor'
--
-- Last object created by this file — see the ordering note in
-- scripts/migrate.mjs.
--
-- Until now nothing in the platform could change a person's role. The
-- only way to appoint anyone was an UPDATE in the database console,
-- which means every appointment happened with no record of who made it,
-- on whose authority, or why — and the people who most need to be able
-- to appoint someone are exactly the people who should not be running
-- SQL against a live student database.
--
-- Apply with:
--   wrangler d1 execute wec-lc --remote --file=sql/migrations/003-appointments.sql
-- or via the deploy workflow's `apply_migrations` input.
--
-- NOT idempotent. Run once per database.

-- ---------------------------------------------------------------------
-- Appointment record
-- ---------------------------------------------------------------------
--
-- Separate from enrolment_events on purpose. An enrolment change says
-- what one learner may study; an appointment says what one person may
-- do to everybody else's records. They answer different questions, they
-- will be read by different people, and conflating them would bury the
-- handful of entries that actually matter in thousands that do not.
--
-- `authority` is not the same as `reason`, and both are required:
--   reason    — why this person (e.g. "leading the Level II cohort")
--   authority — under whose decision (e.g. "Board minute 2026-03, item 4")
-- An institution auditing itself later needs the second one. Nothing in
-- this table validates that the authority is real; it records what was
-- claimed, attributed to the person who claimed it.

CREATE TABLE role_events (
  id                TEXT PRIMARY KEY,            -- 'rev_' + uuid
  user_id           TEXT NOT NULL REFERENCES users(id),   -- the appointee
  from_role         TEXT NOT NULL,
  to_role           TEXT NOT NULL,
  actor_id          TEXT NOT NULL REFERENCES users(id),   -- who appointed them
  reason            TEXT NOT NULL,
  authority         TEXT,                        -- the decision this rests on
  created_at        TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ','now'))
);
CREATE INDEX idx_role_events_user ON role_events(user_id, created_at);
CREATE INDEX idx_role_events_actor ON role_events(actor_id, created_at);

-- actor_id is NOT NULL here, unlike enrolment_events. A payment can
-- create an enrolment with no human involved; nothing should ever
-- appoint an administrator with no human involved. If a future
-- automated path needs one, that is a governance decision, and it
-- should have to change this constraint deliberately rather than slip
-- through a nullable column.
