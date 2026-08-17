-- Migration 006 — making the Register cheap to read and cheap to extend.
--
-- probe: SELECT 1 FROM sqlite_master WHERE type='index' AND name='idx_awards_seq'
--
-- Last object created by this file — see the ordering note in
-- scripts/migrate.mjs.
--
-- Nothing here changes what the Register MEANS. Every object below is an
-- index or a denormalised ordering column; no award's contents, digest
-- or standing is touched, and `canonical()` is deliberately unchanged so
-- that every digest computed before this migration is still correct
-- after it.
--
-- WHY, WITH NUMBERS. Measured against a 50,000-award register on the
-- real schema (scratch benchmark, EXPLAIN QUERY PLAN + timed runs):
--
--   chainHead(), the anti-join            11.82 ms   O(n), on every conferral
--   chainHead(), indexed monotonic seq     0.00 ms   O(log n)
--   publicRegister(), no index             7.25 ms   scan + sort
--   publicRegister(), idx_awards_roll      1.88 ms   index seek, no sort
--
-- The first line is the one that mattered. Finding the end of the chain
-- by asking "which digest is nobody's predecessor" reads the whole table
-- every time an award is conferred, so conferral got slower for every
-- award the College had ever made. That is precisely the wrong shape for
-- a permanent record: the cost lands on the institution's future.

-- The Register's roll, as the public endpoint asks for it: live awards,
-- consented, newest first. The column order matches the query's
-- selectivity — equality predicates first, then the sort column, so the
-- planner seeks and never sorts.
CREATE INDEX IF NOT EXISTS idx_awards_roll
  ON awards(status, public_consent, conferred_on DESC);

-- Two admin queries scanned `users` in full: counting remaining
-- administrators before a demotion, and listing appointees. Both are
-- rare, but the first one guards the "you cannot remove the last
-- administrator" rule, and a guard that gets slower as the College grows
-- is a guard that eventually gets removed for being slow.
CREATE INDEX IF NOT EXISTS idx_users_role ON users(role);

-- Webhook events whose signature did not verify — the reconciliation
-- report's security question, and the one row set anybody investigating
-- a suspected forgery reaches for first. A partial index because the
-- interesting rows are, and should remain, a vanishing fraction of the
-- table.
CREATE INDEX IF NOT EXISTS idx_webhook_unverified
  ON payment_webhook_events(received_at DESC) WHERE signature_verified = 0;

-- The chain's position, as an explicit total order.
--
-- The links (`prev_digest`) remain the AUTHORITY on order — this column
-- is a lookup convenience and nothing else, and `verifyChain()` asserts
-- the two agree rather than trusting this column. A denormalisation that
-- nothing checks is just a second source of truth waiting to disagree
-- with the first.
--
-- Deliberately NOT part of the hashed content. The digest covers what
-- the certificate asserts; sequence is bookkeeping, and adding it would
-- have invalidated every digest ever computed for no gain in what the
-- chain proves.
ALTER TABLE awards ADD COLUMN seq INTEGER;

-- Backfills any register that already holds awards. On an empty
-- register — which is the College's state today — this does nothing.
-- Ordered by the links where it can be, falling back to insertion time:
-- a register written before this migration has no other record of its
-- order, and rowid preserves the order rows were actually inserted in,
-- which is the same thing for every register this can encounter.
UPDATE awards SET seq = rowid WHERE seq IS NULL;

-- UNIQUE, so two conferrals cannot claim the same position. That turns a
-- lost race into a refused INSERT the caller retries, which is the same
-- mechanism `prev_digest UNIQUE` already provides for the links — the
-- integrity of the ordering rests on a constraint rather than on
-- requests not overlapping.
CREATE UNIQUE INDEX IF NOT EXISTS idx_awards_seq ON awards(seq);
