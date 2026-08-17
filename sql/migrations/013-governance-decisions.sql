-- Migration 013 — four adopted governance decisions, given structure.
--
-- probe: SELECT 1 FROM sqlite_master WHERE type='index' AND name='idx_portrait_review'
--
-- Last object created by this file — see the ordering note in
-- scripts/migrate.mjs.
--
-- Each section below implements a decision the Executive has taken. The
-- decisions are recorded in docs/governance-decisions.md; this file is
-- only their shape in the database.

-- ============================================================
-- 1. EXECUTIVE PORTRAIT POLICY (approved)
-- ============================================================
--
-- Optional, never required. Square, professional. Reviewed before
-- publication. Removed immediately if an award is withdrawn or at the
-- graduate's request. Certificates and verification remain valid
-- regardless of portrait status.
--
-- That last clause is the one with teeth, and it is why the portrait
-- lives HERE, on the profile, and not on the award. A certificate is a
-- statement about a qualification; a photograph is not part of it. If
-- these shared a table, a portrait dispute would sit one careless JOIN
-- away from a credential, and some future query would end up filtering
-- awards by portrait status.
ALTER TABLE graduate_profiles ADD COLUMN portrait_key TEXT;
-- 'none' is a state, not an absence: it distinguishes "never uploaded"
-- from "uploaded and removed", and a graduate who withdrew a portrait
-- should not look identical to one who never had one.
ALTER TABLE graduate_profiles ADD COLUMN portrait_status TEXT NOT NULL DEFAULT 'none'
  CHECK (portrait_status IN ('none','pending_review','published','rejected','removed'));
ALTER TABLE graduate_profiles ADD COLUMN portrait_submitted_at TEXT;
ALTER TABLE graduate_profiles ADD COLUMN portrait_reviewed_by TEXT REFERENCES users(id);
ALTER TABLE graduate_profiles ADD COLUMN portrait_reviewed_at TEXT;
-- Why it was rejected or removed. A graduate told only "rejected" cannot
-- fix it, and an institution that cannot say why it refused an image is
-- one nobody can appeal to.
ALTER TABLE graduate_profiles ADD COLUMN portrait_note TEXT;

-- ============================================================
-- 2. ALUMNI CHAPTERS (approved)
-- ============================================================
--
-- One real organisation — the Albalagh International Premium College Alumni Society
-- — with six chapters, one per IEFC award.
--
-- The chapters are reference data because they are real and named. But
-- MEMBERSHIP IS NOT STORED. A graduate belongs to the chapter of their
-- highest live award, which is a fact already in the awards table, and
-- copying it here would create a second answer to the same question
-- that drifts the first time an award is revoked or replaced.
--
-- No officers are seeded, and no membership counts. The Society has no
-- officers yet; inventing a President would be exactly the fabrication
-- this project has refused everywhere else.
CREATE TABLE IF NOT EXISTS alumni_chapters (
  id            TEXT PRIMARY KEY,
  level_id      INTEGER NOT NULL UNIQUE REFERENCES programme_levels(id),
  name          TEXT NOT NULL UNIQUE,
  -- The award whose holders belong here, denormalised for display only.
  award_title   TEXT NOT NULL,
  post_nominal  TEXT NOT NULL,
  description   TEXT NOT NULL,
  -- Officers are elected, not appointed by a migration. Until a chapter
  -- has members enough to hold an election, this stays 0 and the
  -- interface says so.
  officers_elected INTEGER NOT NULL DEFAULT 0 CHECK (officers_elected IN (0, 1))
);

INSERT OR IGNORE INTO alumni_chapters (id, level_id, name, award_title, post_nominal, description) VALUES
  ('chp_aspirant',  1, 'Aspirant Chapter',  'English Aspirant of Albalagh International Premium College',  'ApAIPC',
   'Holders of the Level I award, who entered the tradition.'),
  ('chp_candidate', 2, 'Candidate Chapter', 'English Candidate of Albalagh International Premium College', 'CnAIPC',
   'Holders of the Level II award.'),
  ('chp_associate', 3, 'Associate Chapter', 'English Associate of Albalagh International Premium College', 'AsAIPC',
   'Holders of the Level III award.'),
  ('chp_envoy',     4, 'Envoy Chapter',     'English Envoy of Albalagh International Premium College',     'EnAIPC',
   'Holders of the Level IV award — trusted representatives and communicators.'),
  ('chp_orator',    5, 'Orator Chapter',    'English Orator of Albalagh International Premium College',    'OrAIPC',
   'Holders of the Level V award — high-level intellectual and professional communicators.'),
  ('chp_laureate',  6, 'Laureate Chapter',  'English Laureate of Albalagh International Premium College',  'LrAIPC',
   'Holders of the Level VI award — distinguished masters of the programme.');

-- ============================================================
-- 3. SKILL DESCRIPTORS, NOT PERCENTAGES (Academic Senate)
-- ============================================================
--
-- Executive institutions do not reduce communication ability to a
-- percentage. Five ordered descriptors replace the number.
--
-- The DESCRIPTORS are decided — the Executive named them. The
-- THRESHOLDS are not: nobody has said what evidence makes a graduate
-- "Proficient" rather than "Developing", and that is a harder academic
-- question than naming the bands. It is left explicitly unanswered
-- rather than filled with round numbers that would look decided.
--
-- The consequence is that a skill descriptor requires TWO approvals: the
-- assessment-to-skill mapping, and the threshold that turns evidence
-- into a band. Until both exist, no descriptor is reported.
CREATE TABLE IF NOT EXISTS skill_descriptors (
  id            TEXT PRIMARY KEY,
  sequence      INTEGER NOT NULL UNIQUE,
  code          TEXT NOT NULL UNIQUE,
  name          TEXT NOT NULL UNIQUE,
  description   TEXT NOT NULL,

  -- The evidence threshold for this band, as a proportion of available
  -- marks on approved mapped assessments. NULL until the Senate sets it.
  -- Nullable rather than defaulted: a default would BE a decision, made
  -- by whoever typed the migration.
  threshold_min REAL CHECK (threshold_min IS NULL OR (threshold_min >= 0 AND threshold_min <= 1)),
  approved_by   TEXT REFERENCES users(id),
  approved_at   TEXT,
  CHECK (threshold_min IS NULL OR (approved_by IS NOT NULL AND approved_at IS NOT NULL))
);

INSERT OR IGNORE INTO skill_descriptors (id, sequence, code, name, description) VALUES
  ('skd_emerging',      1, 'EMERGING',      'Emerging',
   'Beginning to operate in the skill, with support and in familiar conditions.'),
  ('skd_developing',    2, 'DEVELOPING',    'Developing',
   'Operates independently in familiar conditions; still effortful in unfamiliar ones.'),
  ('skd_proficient',    3, 'PROFICIENT',    'Proficient',
   'Operates reliably across the range the level describes.'),
  ('skd_advanced',      4, 'ADVANCED',      'Advanced',
   'Operates with control and range beyond what the level requires.'),
  ('skd_distinguished', 5, 'DISTINGUISHED', 'Distinguished',
   'Operates at a standard that would be recognised well outside the College.');

-- ============================================================
-- 4. BOARD OF ACADEMIC STANDARDS AND CURRICULUM EXCELLENCE
-- ============================================================
--
-- Established as the authority for the competency framework. No members
-- are seeded: a board with invented members is worse than no board, and
-- the Executive has established the body without yet appointing to it.
--
-- Recorded in the academic_bodies table so that approvals elsewhere can
-- reference an authority that exists, rather than naming one in prose.
CREATE TABLE IF NOT EXISTS academic_bodies (
  id            TEXT PRIMARY KEY,
  code          TEXT NOT NULL UNIQUE,
  name          TEXT NOT NULL,
  remit         TEXT NOT NULL,
  established_on TEXT NOT NULL,
  -- 0 until people are appointed. The interface must be able to say
  -- "established, not yet constituted", which is the true position.
  members_appointed INTEGER NOT NULL DEFAULT 0
);

INSERT OR IGNORE INTO academic_bodies (id, code, name, remit, established_on) VALUES
  ('bod_basce', 'BASCE', 'Board of Academic Standards and Curriculum Excellence',
   'Defines institutional competencies; maps every assessment to one or more competencies; '
   || 'ensures each competency is assessed multiple times across each level; approves competency '
   || 'descriptors; reviews mappings annually; maintains the integrity of the competency framework.',
   '2026-08-04'),
  ('bod_senate', 'SENATE', 'Academic Senate',
   'Approves the mapping between assessments and the four language skills, and the descriptor '
   || 'thresholds that turn assessed evidence into a skill descriptor.',
   '2026-08-04');

-- Created last: the probe at the top looks for it, so a partially
-- applied migration is never recorded as complete.
CREATE INDEX IF NOT EXISTS idx_portrait_review
  ON graduate_profiles(portrait_status, portrait_submitted_at);
