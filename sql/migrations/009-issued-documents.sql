-- Migration 009 — issued documents, and institutional verification.
--
-- probe: SELECT 1 FROM sqlite_master WHERE type='index' AND name='idx_institution_checks_institution'
--
-- Last object created by this file — see the ordering note in
-- scripts/migrate.mjs.
--
-- ============================================================
-- WHY AN ISSUED DOCUMENT IS NOT AN AWARD
-- ============================================================
--
-- An award is immutable: conferred once, chained, and it never changes.
-- A TRANSCRIPT is not. It grows as the learner progresses, and the
-- transcript a graduate sent a university in 2027 is not the transcript
-- the platform would generate for them in 2030.
--
-- That difference decides the whole design. If an issued transcript were
-- verified by regenerating it from live data, every transcript would
-- start failing verification the moment its holder completed another
-- module — and the failure would be indistinguishable from forgery. A
-- university checking a three-year-old document would be told it had
-- been altered.
--
-- So `payload_json` freezes the document AS ISSUED. This is the one
-- place the platform deliberately keeps a second copy of data it could
-- otherwise derive, and the reason is precise: the copy is not a cache
-- of the current truth, it is the historical record of what the College
-- asserted on a particular day. Those are different facts and both are
-- needed.
--
-- The signature covers the frozen payload, so verification is a pure
-- function of the document plus the published public key. A third party
-- can archive the document and re-verify it in twenty years without
-- asking the College anything — which is what "another university can
-- confidently rely on this" actually requires.

CREATE TABLE IF NOT EXISTS issued_documents (
  id              TEXT PRIMARY KEY,   -- 'doc_' + uuid

  document_type   TEXT NOT NULL
                  CHECK (document_type IN ('transcript','diploma_supplement','verification_statement')),

  user_id         TEXT NOT NULL REFERENCES users(id),

  -- Same code scheme as awards: unguessable, transcribable, self-checking.
  -- A document code and an award code are told apart by which table
  -- answers, not by their shape — so a checker who types either into the
  -- portal gets the right answer without having to know what they hold.
  verification_code TEXT NOT NULL UNIQUE,

  -- The document exactly as issued. See the note above: this is not a
  -- cache, it is the record of what was asserted on the day.
  payload_json    TEXT NOT NULL,

  signature       TEXT NOT NULL,
  kid             TEXT NOT NULL REFERENCES signing_keys(kid),

  -- 'issued'      — current
  -- 'superseded'  — a newer document of the same type was issued
  -- 'withdrawn'   — the College withdrew it (an error, or a withdrawn award)
  --
  -- Superseded documents STILL VERIFY. A university that received a
  -- transcript in 2027 needs to confirm the College really issued that
  -- document; whether a fuller one exists now is a separate question,
  -- and the answer says both.
  status          TEXT NOT NULL DEFAULT 'issued'
                  CHECK (status IN ('issued','superseded','withdrawn')),
  superseded_by   TEXT REFERENCES issued_documents(id),
  withdrawn_at    TEXT,
  withdrawn_reason TEXT,

  -- Optional validity window. Institutions often require a transcript
  -- issued within the last N months; expiry here means "the College no
  -- longer vouches this is current", never "this was not issued".
  expires_at      TEXT,

  issued_by       TEXT REFERENCES users(id),
  issued_at       TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ','now')),

  CHECK (status != 'withdrawn' OR withdrawn_reason IS NOT NULL)
);
CREATE INDEX IF NOT EXISTS idx_issued_documents_user
  ON issued_documents(user_id, document_type, issued_at DESC);
CREATE INDEX IF NOT EXISTS idx_issued_documents_code ON issued_documents(verification_code);

-- ------------------------------------------------------------
-- Institutional verification
-- ------------------------------------------------------------
-- An employer checking one certificate uses the public portal. A
-- university admissions office checking four hundred applicants in
-- February needs an interface, and giving them one is how the College
-- stops them screen-scraping the portal.
--
-- REGISTERED, not anonymous — and that is a deliberate asymmetry with
-- the public portal, which records nothing about who is checking. The
-- difference is consent: a graduate hands their code to an employer
-- knowing it will be checked, whereas an institution making bulk
-- automated queries against the register is doing something the College
-- should be able to see, attribute and stop.
--
-- The key is stored as a HASH. A leaked table of live API keys would be
-- a leaked ability to query the register at scale under someone else's
-- name.
CREATE TABLE IF NOT EXISTS verifying_institutions (
  id              TEXT PRIMARY KEY,
  name            TEXT NOT NULL,
  kind            TEXT NOT NULL DEFAULT 'employer'
                  CHECK (kind IN ('employer','university','government','agency')),
  contact_email   TEXT,
  country_code    TEXT,

  api_key_hash    TEXT UNIQUE,

  -- Per-day cap. Not billing — a limit is what turns "somebody is
  -- enumerating the register" from an unbounded harvest into a bounded
  -- one that shows up in the audit the next morning.
  daily_limit     INTEGER NOT NULL DEFAULT 500 CHECK (daily_limit > 0),

  status          TEXT NOT NULL DEFAULT 'active'
                  CHECK (status IN ('active','suspended','revoked')),
  suspended_reason TEXT,

  approved_by     TEXT REFERENCES users(id),
  created_at      TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ','now')),

  CHECK (status = 'active' OR suspended_reason IS NOT NULL)
);

-- Every institutional check, attributed.
--
-- Deliberately unlike `award_verifications`, which records NOTHING about
-- who checked. The public portal promises anonymity because a stranger
-- verifying a certificate they were handed deserves it. An institution
-- holding an API key agreed to be identified as a condition of holding
-- one, and the College needs the record to answer "who has been reading
-- our register, and how much of it".
CREATE TABLE IF NOT EXISTS institution_checks (
  id              TEXT PRIMARY KEY,
  institution_id  TEXT NOT NULL REFERENCES verifying_institutions(id),
  code_attempted  TEXT NOT NULL,
  outcome         TEXT NOT NULL,
  checked_at      TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ','now'))
);
CREATE INDEX IF NOT EXISTS idx_institution_checks_institution
  ON institution_checks(institution_id, checked_at DESC);
