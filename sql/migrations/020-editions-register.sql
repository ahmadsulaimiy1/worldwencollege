-- 020 · The Editions Register — so a book's printed QR resolves
--
-- probe: SELECT 1 FROM sqlite_master WHERE type='index' AND name='idx_editions_digest'
--
-- The probe reads sqlite_master rather than the table it creates, for the
-- reason 019 gives: a probe that selects from its own new table throws
-- "no such table" on every database the probe exists to ask about. The
-- index is created LAST, so an interrupted run leaves the probe
-- unsatisfied and the runner retries.
--
-- WHY THIS MIGRATION EXISTS
--
-- Every rendered edition already computes a Document ID — a Crockford
-- base-32 rendering of a SHA-256 digest over the complete curriculum
-- content — and PRINTS IT, with a QR, into the physical book
-- (scripts/publication/identity.mjs). The digest is real and the
-- authenticity notice beside it is accurate.
--
-- What did not exist is anywhere that RECORDS it. The Document ID was
-- computed at print time and then forgotten, so the QR in a bound book
-- resolved to nothing. A promise printed into a permanent object, which
-- the College could not keep.
--
-- This table is the record that makes it keepable. It is the
-- artifact-document half of the Verifiable Document Doctrine
-- (`SEB-D 47`): a person-document asks "did the College issue this, to
-- this person"; an artifact-document asks "is this the genuine edition,
-- unaltered". The second question is answered by comparing a digest
-- computed over a copy in hand against the digest of record here.
--
-- WHY THE DIGEST IS THE IDENTITY, NOT A COLUMN BESIDE IT
--
-- `content_digest` is UNIQUE. Two rows with the same digest would mean
-- the register held two different answers for one edition, and a
-- verifier would have no principled way to choose. The digest is what
-- the edition IS.
--
-- WHAT THIS DOES NOT DO
--
-- It does not prove authorship, and it does not prove that a particular
-- physical copy came from the College. A content digest proves content
-- identity and nothing more; the record rendered from this table says
-- so in those words, because a security claim that overstates itself
-- teaches a reader to trust a check that will not hold.
--
-- It also does not sign the edition. Signing would bind the College's
-- key to the content and is the natural next step, but signing.js is
-- still development-mode and a signature that says "production" when it
-- is not would be worse than none (see functions/_lib/registry/signing.js).

CREATE TABLE editions (
  id              TEXT PRIMARY KEY,   -- 'edn_' + uuid

  -- What a reader sees on the cover.
  title           TEXT NOT NULL,

  -- The printed, human-transcribable identifier: grouped Crockford
  -- base-32, e.g. 'GQ08-FZ9Q-DQHB-6X8D'. UNIQUE because it is what a
  -- reader types or scans, and two editions answering to one ID would
  -- make the portal ambiguous at exactly the moment it must not be.
  document_id     TEXT NOT NULL UNIQUE,

  -- The full SHA-256 over the edition's complete content, lowercase hex.
  -- THE IDENTITY OF THE EDITION. See the note above on why it is UNIQUE.
  content_digest  TEXT NOT NULL UNIQUE
                  CHECK (length(content_digest) = 64),

  -- Edition · revision · impression, as printed: 'E01.R00.01'.
  issue_code      TEXT NOT NULL,
  edition_name    TEXT,               -- 'First', 'Second', …
  publication_id  TEXT,               -- 'AIPC/IEFC/CUR/2026/E01'
  print_identifier TEXT,              -- issue code plus digest characters
  year            INTEGER,

  -- The extent (levels, modules, lessons) and the honest
  -- not-assigned registrations (ISBN, DOI, legal deposit), as JSON.
  -- Frozen at registration, exactly like issued_documents.payload_json:
  -- this is the record of what was published, not a cache of what the
  -- curriculum says today.
  counts_json     TEXT,
  registrations_json TEXT,

  -- 'in-print'    — the edition of record
  -- 'superseded'  — a newer edition exists; THIS ONE STILL VERIFIES,
  --                 because a reader holding the 2026 printing needs to
  --                 know the College published it, not merely that a
  --                 2031 printing exists
  -- 'withdrawn'   — the College withdrew it, dated and reasoned
  status          TEXT NOT NULL DEFAULT 'in-print'
                  CHECK (status IN ('in-print','superseded','withdrawn')),
  superseded_by   TEXT REFERENCES editions(id),

  withdrawn_at    TEXT,
  withdrawn_reason TEXT,

  registered_by   TEXT REFERENCES users(id),
  registered_at   TEXT NOT NULL
);

-- Created LAST: it is the probe's subject, so an interrupted run retries.
CREATE INDEX idx_editions_digest ON editions(content_digest);
