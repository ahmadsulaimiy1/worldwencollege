-- 025 · The External Examiner can sign in and confirm a pass list
--
-- probe: SELECT 1 FROM sqlite_master WHERE type='index' AND name='idx_pass_list_entries_level'
--
-- The probe reads sqlite_master rather than the table it creates, and
-- names the LAST object this file creates — see scripts/migrate.mjs's
-- own comment on why: a partial failure must leave the probe
-- unsatisfied, so a retry fails loudly rather than reporting a
-- half-migrated database as done.
--
-- ============================================================
-- WHAT THIS DOES, AND WHAT IT DELIBERATELY DOES NOT DO
-- ============================================================
--
-- docs/governance-decisions.md's Adoption Record (14 August 2026) is
-- explicit: the B-series and C-series decisions are already in force —
-- "they govern the platform, and they may be quoted to a student, an
-- applicant or an auditor" — but adopting a standard is not the same as
-- conferring an award. "No award is conferred until [the External
-- Examiner] appointment is made — see docs/appointment-briefs.md."
--
-- That appointment has now been made. This migration gives the College
-- the two things governance C5 actually decided, and nothing beyond
-- them:
--
--   1. 'examiner' becomes a real access level, distinct from 'staff'.
--      Deliberately its own tier, not a permission bolted onto staff —
--      appointment-briefs.md's own condition on the post is
--      independence: "You must have no other role at WEC." An examiner
--      who was also staff would not be an examiner.
--
--   2. A pass list the Examiner can confirm or decline against real
--      evidence — "sit at the board that approves results, and confirm
--      or decline to confirm the pass list" (appointment-briefs.md).
--      Recording the decision is NOT conferring the award: C5 gives
--      that authority to "the Registrar... acting under a Board-approved
--      pass list", specifically so the one review and the one write are
--      never the same act by the same person. This table stores the
--      board's confirmation; functions/_lib/registry/pass-list.js's
--      confer() is the separate, later step that actually writes the
--      Graduate Register, executed by an administrator standing in for
--      the Registrar office (see that file's own comment for why).
--
-- ============================================================
-- WHY THE users TABLE IS REBUILT RATHER THAN ALTERED
-- ============================================================
--
-- SQLite has no `ALTER TABLE ... ADD CHECK` — a CHECK constraint can
-- only be changed by rebuilding the table it lives on. The rebuild
-- preserves every row and every column exactly; only the CHECK on
-- `role` widens by one value. Foreign keys elsewhere in the schema
-- reference `users` by name, not by an internal handle, so they resolve
-- correctly against the rebuilt table without any change of their own.

CREATE TABLE users_new (
  id                TEXT PRIMARY KEY,
  auth_provider     TEXT NOT NULL DEFAULT 'clerk',
  auth_provider_id  TEXT NOT NULL,
  email             TEXT NOT NULL,
  email_verified    INTEGER NOT NULL DEFAULT 0,
  role              TEXT NOT NULL DEFAULT 'student' CHECK (role IN ('student','staff','admin','examiner')),
  preferred_name    TEXT,
  preferred_language TEXT NOT NULL DEFAULT 'en' CHECK (preferred_language IN ('en','ar')),
  created_at        TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ','now')),
  updated_at        TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ','now')),
  UNIQUE(auth_provider, auth_provider_id)
);

INSERT INTO users_new (id, auth_provider, auth_provider_id, email, email_verified, role,
    preferred_name, preferred_language, created_at, updated_at)
  SELECT id, auth_provider, auth_provider_id, email, email_verified, role,
    preferred_name, preferred_language, created_at, updated_at
  FROM users;

DROP TABLE users;
ALTER TABLE users_new RENAME TO users;

CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_users_role ON users(role);

-- ============================================================
-- THE PASS LIST
-- ============================================================
--
-- One row per decision, not one row per learner-level. A learner
-- declined at one sitting and confirmed at the next is a real academic
-- history — a resit passed, an appeal upheld — and overwriting the
-- first decision would erase exactly the record an institution needs
-- if that history is ever questioned. `superseded` marks an entry
-- replaced by a later one for the same learner and level; it is never
-- deleted.
CREATE TABLE pass_list_entries (
  id                TEXT PRIMARY KEY,   -- 'ple_' + uuid
  user_id           TEXT NOT NULL REFERENCES users(id),
  level_id          INTEGER NOT NULL REFERENCES programme_levels(id),
  examiner_id       TEXT NOT NULL REFERENCES users(id),
  decision          TEXT NOT NULL CHECK (decision IN ('confirmed','declined')),
  notes             TEXT,
  superseded        INTEGER NOT NULL DEFAULT 0,
  -- Set once an administrator, standing in for the Registrar, has
  -- executed the conferral this entry authorised. NULL until then, and
  -- permanently thereafter — a conferred entry is never re-executed.
  conferred_award_id TEXT REFERENCES awards(id),
  created_at        TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ','now'))
);
CREATE INDEX idx_pass_list_entries_user ON pass_list_entries(user_id, level_id);
CREATE INDEX idx_pass_list_entries_level ON pass_list_entries(level_id, superseded);
