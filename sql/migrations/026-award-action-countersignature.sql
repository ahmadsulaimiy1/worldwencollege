-- 026 · Withdrawal and replacement require a countersignature
--
-- probe: SELECT 1 FROM sqlite_master WHERE type='index' AND name='idx_award_action_requests_award'
--
-- ============================================================
-- THE GAP THIS CLOSES
-- ============================================================
--
-- Governance C5 (adopted 14 August 2026) is explicit: withdrawal and
-- replacement are "by the Registrar with a recorded reason,
-- COUNTERSIGNED BY ONE OTHER OFFICER... withdrawing an award is the
-- one operation in the system that destroys something a person owns,
-- and it should not be within the unilateral power of any single
-- account, including the founder's."
--
-- Conferral itself already has this shape — an Independent Examiner
-- confirms via the pass list, a different administrator executes the
-- write (see migration 025 and registry/conferral.js). Withdrawal and
-- replacement had no equivalent second party at all: one administrator
-- session, one POST, one reason string, straight through to
-- registry/awards.js's revokeAward()/replaceAward(). This table gives
-- withdrawal and replacement the same two-step shape conferral already
-- has: one officer PROPOSES the act with a reason (and, for a
-- replacement, the changes), a DIFFERENT officer COUNTERSIGNS it, and
-- only the countersignature actually executes the write. Proposing
-- alone changes nothing on the awards table.
--
-- One row per proposal, never deleted, never reused — the same
-- append-only discipline pass_list_entries uses, for the same reason:
-- a cancelled or superseded proposal is still part of the record of
-- who asked for what and when.
CREATE TABLE award_action_requests (
  id                TEXT PRIMARY KEY,   -- 'aar_' + uuid
  award_id          TEXT NOT NULL REFERENCES awards(id),
  action            TEXT NOT NULL CHECK (action IN ('withdraw','replace')),
  reason            TEXT NOT NULL,
  -- JSON, 'replace' only: the holderName/citation changes proposed.
  -- NULL for 'withdraw'.
  changes           TEXT,
  proposed_by       TEXT NOT NULL REFERENCES users(id),
  proposed_at       TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ','now')),
  -- Set together, by countersignActionRequest(), the moment a second
  -- officer executes the act. Both NULL until then, and permanently
  -- thereafter — an executed request is never re-executed.
  countersigned_by  TEXT REFERENCES users(id),
  countersigned_at  TEXT,
  -- Set only if the act was actually written (revokeAward()/
  -- replaceAward() returns a row). Distinguishes an executed request
  -- from one a second officer opened and then found already stale
  -- (the award had since been withdrawn by another route, say).
  executed          INTEGER NOT NULL DEFAULT 0,
  -- The proposer's own way out before a second officer acts — asking
  -- was a mistake, or the reason needs rewording. Never available once
  -- countersigned.
  cancelled         INTEGER NOT NULL DEFAULT 0,
  cancelled_at      TEXT
);
CREATE INDEX idx_award_action_requests_award ON award_action_requests(award_id);
CREATE INDEX idx_award_action_requests_pending
  ON award_action_requests(countersigned_at, cancelled);
