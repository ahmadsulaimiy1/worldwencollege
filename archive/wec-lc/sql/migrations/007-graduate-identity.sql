-- Migration 007 — the graduate's permanent academic identity.
--
-- probe: SELECT 1 FROM sqlite_master WHERE type='index' AND name='idx_profile_shares_user'
--
-- Last object created by this file — see the ordering note in
-- scripts/migrate.mjs.
--
-- ============================================================
-- WHAT THIS FIXES, AND WHY IT IS NOT COSMETIC
-- ============================================================
--
-- docs/academic-framework.md — which the Executive directed be treated
-- as constitutional — states the rule that distinguishes the IEFC from a
-- repackaged proficiency scale:
--
--   "every assessment maps to at least one competency, and every
--    competency is assessed at least three times per level. A competency
--    assessed once is an aspiration."
--
-- Nothing in the platform implemented it. There was no competency table,
-- no mapping from assessment to competency, and no per-competency mark;
-- rubrics were prose inside `learning_items.body` and a graded
-- submission carried one aggregate score. The framework also requires
-- "marks by skill and by competency, not one aggregate" — also
-- unimplemented.
--
-- So the College's central academic claim was a document, not a system.
-- An accreditation reviewer asking "show me that competency 5 was
-- assessed three times at Level IV" could not have been answered, and a
-- graduate profile listing "verified competencies" would have been
-- listing nothing.
--
-- This migration builds the spine. It deliberately does NOT populate it:
-- mapping 360 assessments to competencies is academic work for the
-- Academic Director, and inventing the mapping here would produce
-- exactly the fabricated record the Executive forbade. The tables start
-- empty, `competencyCoverage()` reports honestly that the framework's
-- rule is unmet, and the graduate profile says "not yet assessed"
-- instead of showing a number nobody earned.
--
-- Governance: see A6d, A6e and E1 in docs/governance-decisions.md.

-- ------------------------------------------------------------
-- The six competencies
-- ------------------------------------------------------------
-- Seeded, because these are not invented here — they are quoted from the
-- constitutional framework, section IV. Rows are stable identifiers a
-- transcript can reference for the next fifty years, so `code` is the
-- durable key and the display name may be revised without breaking a
-- record that cites it.
CREATE TABLE IF NOT EXISTS competencies (
  id            TEXT PRIMARY KEY,     -- 'cmp_clarity' etc — readable on purpose
  code          TEXT NOT NULL UNIQUE, -- 'CLARITY'
  sequence      INTEGER NOT NULL,
  name          TEXT NOT NULL,
  description   TEXT NOT NULL,
  created_at    TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ','now'))
);

INSERT OR IGNORE INTO competencies (id, code, sequence, name, description) VALUES
  ('cmp_clarity',   'CLARITY',   1, 'Clarity',   'Understood the first time, by the audience actually present'),
  ('cmp_command',   'COMMAND',   2, 'Command',   'Controls the language rather than being carried by it'),
  ('cmp_judgement', 'JUDGEMENT', 3, 'Judgement', 'Chooses register, channel and moment; knows what not to say'),
  ('cmp_reason',    'REASON',    4, 'Reason',    'Constructs an argument, tests it, concedes what should be conceded'),
  ('cmp_bearing',   'BEARING',   5, 'Bearing',   'Holds a room, a call, a difficult conversation'),
  ('cmp_reach',     'REACH',     6, 'Reach',     'Communicates across cultures, and across the distance between expert and layperson');

-- Which competencies an assessment claims to assess. The framework's
-- rule is counted over THIS table, so an unmapped curriculum reports as
-- unmapped rather than as compliant-by-absence.
CREATE TABLE IF NOT EXISTS assessment_competencies (
  learning_item_id  TEXT NOT NULL REFERENCES learning_items(id),
  competency_id     TEXT NOT NULL REFERENCES competencies(id),
  -- Weight is not a mark. It records how much of this assessment bears
  -- on this competency, so a task that touches Reach in passing does not
  -- count the same as one built around it.
  weight            REAL NOT NULL DEFAULT 1.0 CHECK (weight > 0 AND weight <= 1.0),
  PRIMARY KEY (learning_item_id, competency_id)
);
CREATE INDEX IF NOT EXISTS idx_assessment_competencies_competency
  ON assessment_competencies(competency_id);

-- A mark against one competency, for one submission.
--
-- Separate from `assignment_submissions.score` rather than replacing it.
-- The aggregate is what a learner sees today and what every existing
-- test asserts; removing it to make room for this would have been a
-- migration that breaks working behaviour to enable behaviour that does
-- not exist yet.
CREATE TABLE IF NOT EXISTS competency_marks (
  id            TEXT PRIMARY KEY,
  submission_id TEXT NOT NULL REFERENCES assignment_submissions(id),
  competency_id TEXT NOT NULL REFERENCES competencies(id),
  -- 0..1, matching pronunciation_feedback. NOT a percentage and not a
  -- grade: the translation from competency marks to a level result is
  -- governance B1/B2 and is not decided.
  mark          REAL NOT NULL CHECK (mark >= 0 AND mark <= 1),
  marked_by     TEXT REFERENCES users(id),
  -- 'instructor' | 'moderator' | 'automated'. A moderated mark and a
  -- first-marker mark are different evidence and an assessment board
  -- must be able to tell them apart.
  source        TEXT NOT NULL DEFAULT 'instructor'
                CHECK (source IN ('instructor','moderator','automated')),
  comment       TEXT,
  created_at    TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ','now')),
  UNIQUE (submission_id, competency_id, source)
);
CREATE INDEX IF NOT EXISTS idx_competency_marks_submission ON competency_marks(submission_id);

-- ------------------------------------------------------------
-- The graduate profile
-- ------------------------------------------------------------
-- One row per person, created on demand. Everything defaults to PRIVATE.
--
-- Each visibility flag is a separate named column rather than a single
-- "public" switch, because they are separate decisions: a graduate may
-- want an employer to see their awards and not their study hours, and
-- collapsing that into one boolean would force them to publish more than
-- they meant to in order to publish anything.
CREATE TABLE IF NOT EXISTS graduate_profiles (
  user_id           TEXT PRIMARY KEY REFERENCES users(id),
  -- The public address, chosen by the graduate. Nullable: a profile
  -- exists before it has a name, and a private profile never needs one.
  handle            TEXT UNIQUE,
  display_name      TEXT,
  biography         TEXT,
  headline          TEXT,
  country_code      TEXT,

  is_public         INTEGER NOT NULL DEFAULT 0,
  show_transcript   INTEGER NOT NULL DEFAULT 0,
  show_competencies INTEGER NOT NULL DEFAULT 0,
  show_cpd          INTEGER NOT NULL DEFAULT 0,
  -- Study hours are the most personal of these. Measured time on task
  -- says how long someone struggled, which is not what a certificate
  -- asserts and not an employer's business unless the graduate says so.
  show_study_time   INTEGER NOT NULL DEFAULT 0,

  created_at        TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ','now')),
  updated_at        TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ','now'))
);
CREATE INDEX IF NOT EXISTS idx_graduate_profiles_public
  ON graduate_profiles(handle) WHERE is_public = 1;

-- Continuing Professional Development, after the award.
--
-- `verified_by` is nullable and means what it says: a self-declared
-- entry is evidence of intent, a verified one is evidence of fact, and
-- the profile must show which is which. A CPD list that presented both
-- identically would be the graduate's word rendered in the College's
-- typeface.
CREATE TABLE IF NOT EXISTS cpd_records (
  id            TEXT PRIMARY KEY,
  user_id       TEXT NOT NULL REFERENCES users(id),
  title         TEXT NOT NULL,
  provider      TEXT,
  kind          TEXT NOT NULL DEFAULT 'course'
                CHECK (kind IN ('course','workshop','conference','examination','publication','teaching','other')),
  hours         REAL CHECK (hours IS NULL OR hours > 0),
  completed_on  TEXT NOT NULL,
  evidence_url  TEXT,
  verified_by   TEXT REFERENCES users(id),
  verified_at   TEXT,
  created_at    TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ','now'))
);
CREATE INDEX IF NOT EXISTS idx_cpd_user ON cpd_records(user_id, completed_on DESC);

-- ------------------------------------------------------------
-- Consent-based sharing
-- ------------------------------------------------------------
-- A graduate hands an employer a link that shows an agreed slice of
-- their record for an agreed time, and can withdraw it.
--
-- THE TOKEN IS STORED AS A HASH, never in the clear. A share link is a
-- bearer credential: anyone holding it sees the record. A database dump
-- of live tokens would therefore be a dump of live access to every
-- graduate's academic history, and hashing means that even the College
-- cannot reconstruct a link it has issued.
--
-- `expires_at` is NOT NULL on purpose. A share that never expires is a
-- publication the graduate did not consent to; they consented to showing
-- one employer, once.
CREATE TABLE IF NOT EXISTS profile_shares (
  id            TEXT PRIMARY KEY,
  user_id       TEXT NOT NULL REFERENCES users(id),
  token_hash    TEXT NOT NULL UNIQUE,
  label         TEXT,                 -- 'Application to X' — the graduate's own note
  scope_json    TEXT NOT NULL,        -- which sections this link may show
  expires_at    TEXT NOT NULL,
  revoked_at    TEXT,
  view_count    INTEGER NOT NULL DEFAULT 0,
  last_viewed_at TEXT,
  created_at    TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ','now'))
);
CREATE INDEX IF NOT EXISTS idx_profile_shares_token ON profile_shares(token_hash);
CREATE INDEX IF NOT EXISTS idx_profile_shares_user ON profile_shares(user_id, created_at DESC);
