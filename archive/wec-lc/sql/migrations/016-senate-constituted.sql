-- Migration 016 — the Academic Senate is constituted.
--
-- probe: SELECT 1 FROM sqlite_master WHERE type='index' AND name='idx_academic_body_events'
--
-- The probe reads sqlite_master rather than the table it creates. A
-- probe that selects from its own new table throws "no such table" on
-- any database where the migration has not run — which is every
-- database the probe exists to ask about.
--
-- Last object created by this file is the index — see the ordering note
-- in scripts/migrate.mjs.
--
-- ============================================================
-- CONSTITUTED IS NOT CONVENED, AND THE SCHEMA HAS TO KNOW THE
-- DIFFERENCE
-- ============================================================
--
-- Until now `academic_bodies` held a single number, `members_appointed`,
-- and the whole site read one fact off it: nought members, therefore
-- nothing can be approved, therefore every decision is interim. That
-- was sufficient while the number was nought, because at nought the two
-- questions a governance record has to answer collapse into one.
--
-- They separate the moment anybody is appointed. A body with members
-- CAN approve; it has not necessarily approved anything. If the site
-- reads only the membership count it will start describing decisions as
-- approved on the day the appointment letters are signed, which is a
-- claim about a meeting that has not happened.
--
-- So this migration adds the event, not just the number. A body is
-- established, then constituted, then convened, and each is a dated fact
-- with a stated authority. The Senate is now constituted. It has not
-- convened, and the record says so by the absence of that row rather
-- than by a comment somebody has to remember to update.
--
-- ============================================================
-- WHY BASCE IS NOT IN THIS MIGRATION
-- ============================================================
--
-- The roster the College attested on 14 August 2026 names a Board of
-- Governors, an Academic Senate and a College Executive. It does not
-- name a single member of the Board of Academic Standards and Curriculum
-- Excellence. BASCE therefore stays at nought and its competency
-- mappings stay interim.
--
-- The temptation is to read the Board's "Governor for Academic Affairs"
-- as BASCE membership, because the remits rhyme. They are different
-- bodies: one is a governor of the institution, the other approves
-- competency descriptors. Inferring one from the other would silently
-- convert thirty interim mappings into approved ones on the strength of
-- a job title, and there is no worse way for this record to become
-- untrue.
--
-- ============================================================
-- WHERE THE PEOPLE ARE
-- ============================================================
--
-- Not here. docs/governance-register.md is the attested source of truth
-- for who holds which post, and tests/governance-register.test.mjs holds
-- the published pages to it. This table records what the BODY did and
-- when; it does not carry a second copy of fifteen names that would then
-- have to be kept in step with the register.

CREATE TABLE IF NOT EXISTS academic_body_events (
  id            TEXT PRIMARY KEY,
  body_code     TEXT NOT NULL REFERENCES academic_bodies(code),
  -- established: the body exists on paper.
  -- constituted: members have been appointed to it.
  -- convened:    it has met and can have decided things.
  -- dissolved:   it no longer exists.
  event         TEXT NOT NULL
                CHECK (event IN ('established','constituted','convened','dissolved')),
  occurred_on   TEXT NOT NULL,
  members_after INTEGER NOT NULL,
  -- Who did this, in the College's own terms. Not a user id: the people
  -- who constitute a board are not necessarily platform accounts.
  authority     TEXT NOT NULL,
  note          TEXT NOT NULL,
  UNIQUE (body_code, event)
);

-- The establishment of both bodies, backfilled from the dates already in
-- academic_bodies so the timeline does not begin halfway through.
INSERT OR IGNORE INTO academic_body_events
  (id, body_code, event, occurred_on, members_after, authority, note)
SELECT 'abe_' || lower(code) || '_established', code, 'established', established_on, 0,
       'Founder, under delegated authority to the Press',
       'Body constituted on paper with no members appointed.'
FROM academic_bodies;

-- The Senate is constituted: three members, per the register.
INSERT OR IGNORE INTO academic_body_events
  (id, body_code, event, occurred_on, members_after, authority, note)
VALUES
  ('abe_senate_constituted', 'SENATE', 'constituted', '2026-08-14', 3,
   'Board of Governors',
   'Three members appointed and attested by the College: Dean of Academic Affairs, '
   || 'Professor of English Language Education, Professor of Applied Linguistics. '
   || 'Named in docs/governance-register.md. The Senate has not yet convened, so the '
   || 'mappings and thresholds within its remit remain interim.');

UPDATE academic_bodies
   SET members_appointed = 3
 WHERE code = 'SENATE';

CREATE INDEX IF NOT EXISTS idx_academic_body_events
  ON academic_body_events(body_code, event);
