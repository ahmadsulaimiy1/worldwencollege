-- Migration 010 — the Accreditation Evidence Centre, and the relation
-- model underneath it.
--
-- probe: SELECT 1 FROM sqlite_master WHERE type='index' AND name='idx_academic_relations_object'
--
-- Last object created by this file — see the ordering note in
-- scripts/migrate.mjs.
--
-- ============================================================
-- AN INTERNAL QUALITY SYSTEM. NEVER A CLAIM OF ACCREDITATION.
-- ============================================================
--
-- Worldwide English College holds no accreditation, recognition or
-- affiliation, and has applied for none. This is the instrument by which
-- the College evaluates ITSELF. Nothing in it constitutes, implies or
-- anticipates external recognition, and no view built on it may present
-- it as such.
--
-- ============================================================
-- THE ABSENCE OF EVIDENCE IS ITSELF EVIDENCE
-- ============================================================
--
-- The ordinary failure of a system like this is that it lists what the
-- institution has and omits what it lacks, so a reviewer sees twelve
-- green rows and infers that twelve is the whole of it. Here every item
-- the College has undertaken to hold is registered whether or not it
-- exists, and each carries one of five honest states:
--
--   exists              — the evidence is here, and `source_path` says where
--   scheduled           — it will exist, on a date
--   governance_pending  — it cannot exist until a decision is taken
--   not_instrumented    — the College does not collect this at all
--   not_applicable      — genuinely does not apply, WITH A REASON
--
-- `not_applicable` is the dangerous one, which is why `statement` is
-- NOT NULL for every row: "not applicable" without a reason is how a
-- checklist gets quietly emptied.

CREATE TABLE IF NOT EXISTS evidence_items (
  id              TEXT PRIMARY KEY,   -- 'ev_' + uuid

  -- The human reference an auditor cites in a report: 'GOV-003'.
  -- Stable for the life of the item, across every version of it.
  reference       TEXT NOT NULL UNIQUE,

  collection      TEXT NOT NULL,
  title           TEXT NOT NULL,

  state           TEXT NOT NULL
                  CHECK (state IN ('exists','scheduled','governance_pending','not_instrumented','not_applicable')),

  -- Why this state. NOT NULL for every row, including 'exists' — a
  -- reviewer needs to know what the document demonstrates, not merely
  -- that a file is present.
  statement       TEXT NOT NULL,

  -- Where the evidence is, when it exists. A repository path, and
  -- tests/evidence-centre.test.mjs asserts every 'exists' row with a
  -- path actually resolves to a file. An evidence register that can
  -- cite a document nobody can open is worse than an empty one.
  source_path     TEXT,

  classification  TEXT NOT NULL DEFAULT 'internal'
                  CHECK (classification IN ('public','internal','restricted')),
  retention       TEXT,

  -- Governance metadata. Roles rather than names: naming a person who
  -- does not hold the post would be fabricating personnel, and the post
  -- outlives whoever holds it.
  owner_role      TEXT,
  author_role     TEXT,
  reviewer_role   TEXT,
  approver_role   TEXT,
  approved_at     TEXT,

  review_interval_months INTEGER CHECK (review_interval_months IS NULL OR review_interval_months > 0),
  next_review_at  TEXT,

  version         INTEGER NOT NULL DEFAULT 1 CHECK (version > 0),
  supersedes_id   TEXT REFERENCES evidence_items(id),

  created_at      TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ','now')),
  updated_at      TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ','now')),

  -- An approved item names who approved it. An approval with no
  -- approving role is an assertion.
  CHECK (approved_at IS NULL OR approver_role IS NOT NULL),
  -- Evidence that exists says where it is.
  CHECK (state != 'exists' OR source_path IS NOT NULL)
);
CREATE INDEX IF NOT EXISTS idx_evidence_collection ON evidence_items(collection, reference);
CREATE INDEX IF NOT EXISTS idx_evidence_state ON evidence_items(state);
CREATE INDEX IF NOT EXISTS idx_evidence_review ON evidence_items(next_review_at) WHERE next_review_at IS NOT NULL;

-- Immutable history. Append-only by intent: nothing updates or deletes
-- a row here, so "what did this policy say in March 2028, and who
-- approved it" is answerable years later.
CREATE TABLE IF NOT EXISTS evidence_versions (
  id              TEXT PRIMARY KEY,
  evidence_id     TEXT NOT NULL REFERENCES evidence_items(id),
  version         INTEGER NOT NULL,
  state           TEXT NOT NULL,
  statement       TEXT NOT NULL,
  source_path     TEXT,
  changed_by      TEXT REFERENCES users(id),
  change_note     TEXT NOT NULL,
  recorded_at     TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ','now')),
  UNIQUE (evidence_id, version)
);
CREATE INDEX IF NOT EXISTS idx_evidence_versions_item ON evidence_versions(evidence_id, version DESC);

-- ------------------------------------------------------------
-- The relation model
-- ------------------------------------------------------------
-- One table, deliberately, because the Evidence Centre's cross-
-- references and the Academic Knowledge Graph are the same structure
-- seen from two ends. A governance decision that affects a policy, a
-- policy that governs an assessment, an assessment that verifies a
-- competency, a competency that justifies an award — all one shape.
--
-- STATUS IS WHAT MAKES THIS ACADEMIC RATHER THAN COMPUTATIONAL.
--
-- "This lesson teaches this competency" is an academic judgement. A
-- graph that inferred it from a lesson title would look complete and be
-- fiction. So every relation carries a status:
--
--   proposed  — asserted, not yet reviewed. Present, visible, NOT relied on.
--   approved  — an academic reviewer accepted it. Only these count.
--   retired   — withdrawn, kept for the record.
--
-- Queries that feed academic conclusions read `approved` only. Proposed
-- relations are how the mapping work gets DONE — draft, review, approve —
-- without the draft ever being mistaken for the finding.
CREATE TABLE IF NOT EXISTS academic_relations (
  id              TEXT PRIMARY KEY,

  subject_type    TEXT NOT NULL,
  subject_id      TEXT NOT NULL,
  predicate       TEXT NOT NULL,
  object_type     TEXT NOT NULL,
  object_id       TEXT NOT NULL,

  status          TEXT NOT NULL DEFAULT 'proposed'
                  CHECK (status IN ('proposed','approved','retired')),

  -- Not a foreign key: subjects and objects live in a dozen different
  -- tables, and a column that could only point at one of them would have
  -- forced a separate join table per pair — which is precisely the
  -- design that makes a knowledge graph impossible to extend.
  --
  -- The cost is that referential integrity is the application's job
  -- here. tests/knowledge-graph.test.mjs asserts every relation resolves
  -- to something real, so a dangling edge is a test failure rather than
  -- a silent hole in the graph.
  asserted_by     TEXT REFERENCES users(id),
  approved_by     TEXT REFERENCES users(id),
  approved_at     TEXT,
  retired_at      TEXT,
  note            TEXT,

  created_at      TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ','now')),

  -- One edge per (subject, predicate, object). Re-asserting an existing
  -- relation is not a second fact.
  UNIQUE (subject_type, subject_id, predicate, object_type, object_id),
  CHECK (status != 'approved' OR approved_at IS NOT NULL)
);
CREATE INDEX IF NOT EXISTS idx_academic_relations_subject
  ON academic_relations(subject_type, subject_id, status);
CREATE INDEX IF NOT EXISTS idx_academic_relations_object
  ON academic_relations(object_type, object_id, status);
