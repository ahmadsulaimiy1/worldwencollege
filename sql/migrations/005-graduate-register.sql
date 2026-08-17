-- Migration 005 — the Graduate Register.
--
-- probe: SELECT 1 FROM sqlite_master WHERE type='index' AND name='idx_award_verifications_award'
--
-- Last object created by this file — see the ordering note in
-- scripts/migrate.mjs.
--
-- This is the College's permanent academic record. Everything else in
-- the credential architecture — certificates, transcripts, digital
-- badges, the alumni Chapters — derives its worth from being checkable
-- against this table, which is why the Board's build order puts it
-- first (docs/iefc-award-architecture.md § XIV).
--
-- THREE PROPERTIES IT IS BUILT FOR.
--
-- 1. TAMPER-EVIDENT. Every award carries a SHA-256 digest over its own
--    substantive fields AND the digest of the award conferred before it.
--    Altering a record — a date, an honour, a name — changes its digest
--    and breaks every link after it. The register cannot be quietly
--    edited; it can only be edited detectably.
--
--    `prev_digest` is UNIQUE, which is what makes the chain a chain
--    rather than a tree. Two conferrals racing to extend the same head
--    cannot both succeed: the database refuses the second, and it
--    retries against the new head. The integrity guarantee is enforced
--    by a constraint, not by hoping requests do not overlap.
--
--    This is deliberately NOT a blockchain and must never be described
--    as one. It is a hash chain in one institution's database. It would
--    make external anchoring straightforward later, which is the only
--    honest meaning of "blockchain-ready".
--
-- 2. REVOCATION IS VISIBLE. A withdrawn award is never deleted. It is
--    marked, dated and reasoned, and its verification page says so. A
--    register that quietly loses entries is not a register, and a
--    verification page that 404s tells a checker nothing.
--
-- 3. CONSENT-SCOPED PUBLICATION. `public_consent` controls whether a
--    graduate appears in the browsable register. It does NOT control
--    verification by code: a code is something the graduate chose to
--    hand someone, and honouring it is the entire purpose.

CREATE TABLE awards (
  id                TEXT PRIMARY KEY,   -- 'awd_' + uuid
  user_id           TEXT NOT NULL REFERENCES users(id),
  level_id          INTEGER NOT NULL REFERENCES programme_levels(id),

  -- Denormalised on purpose. A certificate conferred in 2027 must still
  -- read as it did in 2027 even if the College later renames an award or
  -- restructures a level. An academic record that changes retrospectively
  -- because a lookup table changed is not a record.
  award_title       TEXT NOT NULL,      -- 'English Associate of Albalagh International Premium College'
  post_nominal      TEXT NOT NULL,      -- 'AsAIPC'
  cefr              TEXT NOT NULL,
  honour            TEXT NOT NULL DEFAULT 'pass'
                    CHECK (honour IN ('pass','merit','distinction','high_distinction','college_distinction')),
  credits           INTEGER NOT NULL,
  tqt_hours         INTEGER NOT NULL,
  citation          TEXT,
  holder_name       TEXT NOT NULL,      -- as it appears on the certificate

  conferred_on      TEXT NOT NULL,      -- date, not timestamp: a conferral is a day
  verification_code TEXT NOT NULL UNIQUE,

  status            TEXT NOT NULL DEFAULT 'conferred'
                    CHECK (status IN ('conferred','revoked','replaced')),
  revoked_at        TEXT,
  revoked_reason    TEXT,
  replaced_by_id    TEXT REFERENCES awards(id),

  -- Publication consent, separate from verification. Default 0: a
  -- graduate opts IN to being listed, never out.
  public_consent    INTEGER NOT NULL DEFAULT 0,

  prev_digest       TEXT NOT NULL UNIQUE,
  digest            TEXT NOT NULL UNIQUE,

  created_at        TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ','now'))
);
CREATE INDEX idx_awards_user ON awards(user_id);
CREATE INDEX idx_awards_conferred ON awards(conferred_on);
-- One LIVE award per learner per level. PARTIAL, excluding replaced and
-- revoked rows, because a certificate can legitimately be replaced more
-- than once — a name correction, then a later one — and every superseded
-- row must survive. A plain UNIQUE(user_id, level_id, status) was tried
-- first and is wrong twice over: it forbids a second replacement, and it
-- blocks replacement entirely, since the successor is conferred before
-- the predecessor is marked. Found by tests/registry.test.mjs.
CREATE UNIQUE INDEX idx_awards_one_live_per_level
  ON awards(user_id, level_id) WHERE status = 'conferred';

-- Verification audit — WITHOUT identifying the checker.
--
-- The graduate and the College can see that an award was verified, how
-- often and with what result. Nobody can see WHO checked. That is not an
-- omission: the whole value of the portal is that a stranger can verify
-- without an account, and a log of checkers' identities would both
-- destroy that and create a personal-data holding with no purpose the
-- College could defend.
--
-- `code_attempted` is stored even when it matches nothing, because a run
-- of failed lookups is the signature of somebody enumerating the
-- register, and that is worth being able to see.
CREATE TABLE award_verifications (
  id                TEXT PRIMARY KEY,   -- 'ver_' + uuid
  award_id          TEXT REFERENCES awards(id),   -- NULL when the code matched nothing
  code_attempted    TEXT NOT NULL,
  outcome           TEXT NOT NULL CHECK (outcome IN ('valid','revoked','replaced','not_found','malformed')),
  channel           TEXT NOT NULL DEFAULT 'public' CHECK (channel IN ('public','api','qr')),
  created_at        TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ','now'))
);
CREATE INDEX idx_award_verifications_time ON award_verifications(created_at);
CREATE INDEX idx_award_verifications_award ON award_verifications(award_id);
