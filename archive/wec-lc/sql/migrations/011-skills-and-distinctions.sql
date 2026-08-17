-- Migration 011 — the language-skill framework, and the record of
-- academic contribution that is not a mark.
--
-- probe: SELECT 1 FROM sqlite_master WHERE type='index' AND name='idx_distinctions_user'
--
-- Last object created by this file — see the ordering note in
-- scripts/migrate.mjs.
--
-- ============================================================
-- WHY A SECOND FRAMEWORK, ALONGSIDE THE COMPETENCIES
-- ============================================================
--
-- The College already has six competencies — Clarity, Command,
-- Judgement, Reason, Bearing, Reach. They describe what a communicator
-- can DO, and they are the College's own contribution.
--
-- They are not the same thing as the four language skills, and neither
-- can be derived from the other. CEFR is DEFINED skill by skill: a
-- reader at B2 may be a speaker at B1, and a qualification that
-- reported a single level without saying which skills stood where
-- would be hiding the most useful thing it knows. An employer hiring
-- for a call centre and a university admitting to a taught master's
-- are asking about different skills, and both are entitled to an
-- answer.
--
-- So this is a second, orthogonal framework, mapped separately.
--
-- ============================================================
-- WHAT THIS MIGRATION DELIBERATELY DOES NOT DO
-- ============================================================
--
-- It does not attribute a single assessment to a single skill.
--
-- Deciding that a particular assignment evidences Writing rather than
-- Reading is academic judgement. It is exactly the kind of judgement
-- the Knowledge Graph directive said must be represented as an
-- explicit relationship that can be reviewed, approved and audited —
-- never inferred by the software because the mapping looked obvious.
--
-- The consequence is that on the day this migration runs, every
-- graduate's skill profile reports `unmapped`. That is not a bug and
-- not an empty result: it is the true statement that the College has
-- not yet mapped its assessments to the skills, and it stays visible
-- until somebody with the authority to do so does it and signs their
-- name to it.

-- ------------------------------------------------------------
-- The four skills
-- ------------------------------------------------------------
-- Seeded, not user-created. These four are fixed by CEFR and by every
-- comparable qualification in the world; making them editable would
-- invite a local variation that nobody outside the College could read.
CREATE TABLE IF NOT EXISTS language_skills (
  id            TEXT PRIMARY KEY,
  code          TEXT NOT NULL UNIQUE,
  sequence      INTEGER NOT NULL UNIQUE,
  name          TEXT NOT NULL,
  -- The pair each skill belongs to. Reception and production are the
  -- distinction that actually predicts difficulty, and a profile that
  -- groups them reads far better than four bars in a row.
  mode          TEXT NOT NULL CHECK (mode IN ('receptive','productive')),
  description   TEXT NOT NULL
);

INSERT OR IGNORE INTO language_skills (id, code, sequence, name, mode, description) VALUES
  ('skl_listening', 'LISTENING', 1, 'Listening', 'receptive',
   'Understands speech at natural pace, including unfamiliar accents and imperfect conditions'),
  ('skl_reading',   'READING',   2, 'Reading',   'receptive',
   'Reads for argument and detail, not only for gist, across registers'),
  ('skl_speaking',  'SPEAKING',  3, 'Speaking',  'productive',
   'Speaks with control of grammar, pronunciation and register, in real time'),
  ('skl_writing',   'WRITING',   4, 'Writing',   'productive',
   'Writes to a purpose and an audience, and revises');

-- ------------------------------------------------------------
-- Which assessments evidence which skill — a reviewable claim
-- ------------------------------------------------------------
-- Mirrors assessment_competencies deliberately. Two frameworks with
-- two different mapping mechanisms would be two things to audit, two
-- places to be inconsistent, and two explanations to give a reviewer.
CREATE TABLE IF NOT EXISTS assessment_skills (
  id                TEXT PRIMARY KEY,
  -- Keyed on the learning item, exactly as assessment_competencies is.
  -- The unit is the module; the learning item is the individual quiz or
  -- assignment, and that is the thing an academic actually judges.
  learning_item_id  TEXT NOT NULL REFERENCES learning_items(id),
  skill_id          TEXT NOT NULL REFERENCES language_skills(id),

  -- How much of this assessment is really about this skill. A speaking
  -- task assessed for pronunciation is not 100% Speaking if half the
  -- marks are for the argument.
  weight            REAL NOT NULL DEFAULT 1.0 CHECK (weight > 0 AND weight <= 1.0),

  -- The governance trail. A mapping with no proposer and no approver is
  -- an opinion that has acquired the authority of a database row.
  status            TEXT NOT NULL DEFAULT 'proposed'
                    CHECK (status IN ('proposed','approved','retired')),
  proposed_by       TEXT REFERENCES users(id),
  proposed_at       TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ','now')),
  approved_by       TEXT REFERENCES users(id),
  approved_at       TEXT,
  rationale         TEXT,

  -- An approval must record who and when. Without this, 'approved' is a
  -- word rather than an act.
  CHECK (status != 'approved' OR (approved_by IS NOT NULL AND approved_at IS NOT NULL))
);
CREATE INDEX IF NOT EXISTS idx_assessment_skills_skill ON assessment_skills(skill_id, status);
CREATE INDEX IF NOT EXISTS idx_assessment_skills_item ON assessment_skills(learning_item_id, status);
-- One live claim per assessment per skill. A retired mapping stays, so
-- the partial index excludes it rather than the row being deleted.
CREATE UNIQUE INDEX IF NOT EXISTS idx_assessment_skills_unique
  ON assessment_skills(learning_item_id, skill_id)
  WHERE status != 'retired';

-- ------------------------------------------------------------
-- Academic distinctions — contribution that is not a mark
-- ------------------------------------------------------------
-- ONE table for leadership, presentation, research and service rather
-- than four bespoke features. They differ in what they describe, not in
-- how the institution handles them: each is a claim about a person,
-- each needs evidence, each needs somebody willing to approve it, and
-- each must be withdrawable without vanishing.
--
-- Nothing here is inferred from platform activity. "Led a seminar" is
-- not something the software can observe, and a record generated from
-- attendance data would be a plausible-sounding fabrication with a
-- timestamp on it.
CREATE TABLE IF NOT EXISTS academic_distinctions (
  id            TEXT PRIMARY KEY,
  user_id       TEXT NOT NULL REFERENCES users(id),

  kind          TEXT NOT NULL CHECK (kind IN (
                  'leadership',     -- held a role: cohort representative, mentor
                  'presentation',   -- presented to an audience beyond the class
                  'research',       -- a project or investigation with an output
                  'service',        -- contribution to the College or its community
                  'prize'           -- a named award decided by a panel
                )),
  title         TEXT NOT NULL,
  summary       TEXT,
  -- Where it happened, in the College's own structure where it applies.
  level_id      INTEGER REFERENCES programme_levels(id),
  awarded_on    TEXT NOT NULL,
  -- Who says so. An external body's name is recorded as text because
  -- the College does not hold a register of other institutions.
  awarded_by    TEXT,
  evidence_url  TEXT,

  -- The same three-state life as every other institutional claim.
  status        TEXT NOT NULL DEFAULT 'proposed'
                CHECK (status IN ('proposed','approved','withdrawn')),
  approved_by   TEXT REFERENCES users(id),
  approved_at   TEXT,
  withdrawn_at  TEXT,
  withdrawn_reason TEXT,

  created_at    TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ','now')),

  CHECK (status != 'approved' OR (approved_by IS NOT NULL AND approved_at IS NOT NULL)),
  -- A withdrawal without a reason is a deletion wearing a status
  -- column. The reason is what makes the record still auditable.
  CHECK (status != 'withdrawn' OR (withdrawn_at IS NOT NULL AND withdrawn_reason IS NOT NULL))
);
-- Created last: the probe at the top of this file looks for it, so a
-- partially applied migration is never recorded as complete.
CREATE INDEX IF NOT EXISTS idx_distinctions_user ON academic_distinctions(user_id, status);
