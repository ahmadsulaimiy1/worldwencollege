-- 019 · An identity document can be uploaded, from day one, if chosen
--
-- probe: SELECT 1 FROM sqlite_master WHERE type='index' AND name='idx_kyc_documents_user'
--
-- The probe reads sqlite_master rather than the table it creates. A
-- probe that selects from its own new table throws "no such table" on
-- any database where the migration has not run — which is every
-- database the probe exists to ask about. The index is created LAST,
-- so an interrupted run leaves the probe unsatisfied and the runner
-- retries — see scripts/migrate.mjs.
--
-- WHY THIS MIGRATION EXISTS, AND WHY 017/018 SAID THE OPPOSITE
--
-- Migration 017 declined to collect a passport or ID number, and
-- migration 018 held that position for the wizard it built: "nothing
-- at application stage needs it... that belongs to the residency
-- process, after an offer." That reasoning is correct for the DEFAULT
-- path, and it does not move here.
--
-- What changes is that some applicants genuinely want to submit a
-- complete file from day one rather than a minimal one followed up
-- later — an applicant with an offer already in hand from elsewhere,
-- one who would simply rather do it once. For them, refusing to accept
-- the document at all is not a privacy protection; it is a worse
-- experience in exchange for nothing, since they would send it by
-- email instead and the College would hold it with far less structure
-- than a proper record gives it.
--
-- So this is an OPT-IN step, not a requirement moved earlier. Every
-- column below is nullable, exactly like 017 and 018, and the wizard
-- states plainly that it is optional and can be completed later. A
-- document, once uploaded, is stored — never automatically verified:
-- no licensed identity-verification provider is wired to this build
-- (see functions/_lib/admissions/kyc-storage.js), and the application
-- must say so everywhere it offers the upload, not once in a footnote.
--
-- WHAT THIS DOES NOT DO
--
-- It does not make identity verification a real, checked fact anywhere
-- in the system. `kyc_documents.status` exists so that IS true later
-- (a human review step, or a real provider) without a second
-- migration, but until something sets it to anything other than
-- 'uploaded', every consumer of this table must treat the document as
-- unverified, full stop.

ALTER TABLE applications ADD COLUMN passport_number TEXT;

CREATE TABLE kyc_documents (
  id              TEXT PRIMARY KEY,         -- 'kycdoc_' + uuid
  user_id         TEXT NOT NULL REFERENCES users(id),
  document_type   TEXT NOT NULL DEFAULT 'passport'
                  CHECK (document_type IN ('passport','national_id','other')),
  object_key      TEXT NOT NULL,            -- R2 key; see kyc-storage.js
  original_filename TEXT,
  content_type    TEXT NOT NULL,
  size_bytes      INTEGER NOT NULL,
  -- 'uploaded' is the only status anything in this build ever sets.
  -- 'reviewed'/'rejected' are here so a future human-review or
  -- provider-verification step has somewhere to record its finding
  -- without another migration — not because either happens today.
  status          TEXT NOT NULL DEFAULT 'uploaded'
                  CHECK (status IN ('uploaded','reviewed','rejected')),
  uploaded_at     TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ','now'))
);

CREATE INDEX idx_kyc_documents_user ON kyc_documents(user_id);
