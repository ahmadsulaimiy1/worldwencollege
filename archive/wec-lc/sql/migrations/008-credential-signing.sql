-- Migration 008 — cryptographic trust for issued credentials.
--
-- probe: SELECT 1 FROM sqlite_master WHERE type='index' AND name='idx_credential_signatures_subject'
--
-- Last object created by this file — see the ordering note in
-- scripts/migrate.mjs.
--
-- ============================================================
-- EXECUTIVE DECISION P2.1 (ADOPTED) — PUBLIC-KEY INFRASTRUCTURE
-- ============================================================
--
-- Every certificate, transcript, award, diploma supplement and
-- verification document is digitally signed. The signing key never
-- appears in application code or in an ordinary environment variable.
-- The architecture targets a KMS or HSM from the outset, and until one
-- is provisioned the signing layer is marked DEVELOPMENT and claims no
-- production-grade assurance. Verification uses the public key only.
-- Rotation must not invalidate credentials already issued. Every signing
-- operation leaves an immutable record.
--
-- HOW THE SCHEMA ENFORCES THAT, RATHER THAN DOCUMENTING IT.
--
-- `dev_private_jwk` exists because development needs *a* key and it has
-- to survive a restart — an ephemeral key would invalidate every
-- credential signed before the process died, which is the exact failure
-- rotation is supposed to prevent. Storing a private key in the database
-- is not good practice and is not defended as such. What makes it
-- acceptable is that the column is STRUCTURALLY incapable of holding a
-- production key:
--
--     CHECK (dev_private_jwk IS NULL OR backend = 'development')
--
-- A row with backend='kms' cannot carry private material. The rule
-- cannot be forgotten in a code path, bypassed by a migration, or lost
-- in a refactor, because the database refuses the write.
--
-- ROTATION WITHOUT INVALIDATION is why keys are rows rather than a
-- single value. Retiring a key sets its status; it never deletes it, and
-- the public half stays published forever. A certificate signed in 2027
-- must still verify in 2047 against the key that signed it, long after
-- that key stopped signing anything new.
--
-- ONE ACTIVE KEY AT A TIME is a partial unique index, not a convention.
-- Two active keys means two answers to "what signed this", and the one
-- moment that matters is mid-rotation, which is exactly when a
-- convention gets broken.

CREATE TABLE IF NOT EXISTS signing_keys (
  -- The key id that travels inside every signature. Long-lived and
  -- public: it appears in the JWKS and in each issued credential.
  kid             TEXT PRIMARY KEY,

  -- 'development' — a key this platform generated and holds.
  -- 'kms'         — a key held by a Key Management Service or HSM; the
  --                 College holds only its public half and asks the
  --                 service to sign.
  backend         TEXT NOT NULL CHECK (backend IN ('development','kms')),

  -- ES256 (ECDSA P-256 + SHA-256). Chosen over RSA for signature size —
  -- these end up in QR codes and printed footers — and because every
  -- major KMS offers it. Recorded per key rather than assumed, so a
  -- future algorithm change is a new key rather than a schema change.
  algorithm       TEXT NOT NULL DEFAULT 'ES256',

  public_jwk      TEXT NOT NULL,

  -- DEVELOPMENT ONLY, and the CHECK is what guarantees that.
  dev_private_jwk TEXT,

  -- For backend='kms': the service's own identifier for the key. The
  -- College never holds the private half; it holds the address of the
  -- thing that does.
  kms_key_ref     TEXT,

  status          TEXT NOT NULL DEFAULT 'active'
                  CHECK (status IN ('active','retired','revoked')),

  -- 'retired' means "no longer signs, still verifies" — the ordinary end
  -- of a key's life. 'revoked' means the key is believed compromised and
  -- signatures made with it can no longer be trusted; that is a
  -- different and much more serious statement, and conflating the two
  -- would let a routine rotation read as a security incident, or worse,
  -- the reverse.
  revoked_reason  TEXT,

  created_at      TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ','now')),
  activated_at    TEXT,
  retired_at      TEXT,

  CHECK (dev_private_jwk IS NULL OR backend = 'development'),
  CHECK (backend != 'kms' OR kms_key_ref IS NOT NULL),
  CHECK (status != 'revoked' OR revoked_reason IS NOT NULL)
);

-- One key signs at a time. Partial, so retired keys accumulate freely.
CREATE UNIQUE INDEX IF NOT EXISTS idx_signing_keys_one_active
  ON signing_keys(status) WHERE status = 'active';

-- Every signing operation, permanently.
--
-- Append-only by intent: nothing in the application updates or deletes a
-- row here. It answers the question an investigator actually asks —
-- "what did this institution sign, with which key, and when" — including
-- for keys since retired and credentials since withdrawn.
CREATE TABLE IF NOT EXISTS credential_signatures (
  id              TEXT PRIMARY KEY,
  kid             TEXT NOT NULL REFERENCES signing_keys(kid),

  -- What was signed. Not a foreign key: the same machinery signs awards,
  -- transcripts, diploma supplements and verification statements, and a
  -- column that could only point at one table would have forced a second
  -- audit trail for the others.
  subject_type    TEXT NOT NULL
                  CHECK (subject_type IN ('award','transcript','diploma_supplement','verification','profile')),
  subject_id      TEXT NOT NULL,

  -- SHA-256 of the canonical payload. The payload itself is NOT stored:
  -- it is reconstructible from the record it describes, and keeping a
  -- second copy would create a second thing that can disagree with the
  -- first.
  payload_digest  TEXT NOT NULL,
  signature       TEXT NOT NULL,

  -- Carried on the record, not inferred from the key at read time. A
  -- credential signed in development must still say so in 2047, even if
  -- the key that signed it has since been re-registered against a KMS.
  mode            TEXT NOT NULL CHECK (mode IN ('development','production')),

  signed_by       TEXT REFERENCES users(id),
  signed_at       TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ','now'))
);
CREATE INDEX IF NOT EXISTS idx_credential_signatures_kid ON credential_signatures(kid, signed_at DESC);
CREATE INDEX IF NOT EXISTS idx_credential_signatures_subject
  ON credential_signatures(subject_type, subject_id);
