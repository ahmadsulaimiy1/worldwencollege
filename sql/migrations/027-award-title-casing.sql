-- 027 · Award title casing corrected — "Worldwide" to "WorldWide"
--
-- probe: SELECT 1 FROM award_definitions WHERE official_title = 'English Aspirant of WorldWide English College'
--
-- ============================================================
-- WHAT THIS FIXES, AND WHAT IT DELIBERATELY DOES NOT TOUCH
-- ============================================================
--
-- The College's name is styled "WorldWide English College" — the
-- second W capitalised — throughout its charter, its masthead, and
-- every page of the public site. sql/schema.sql originally seeded
-- award_definitions.official_title and alumni_chapters.award_title
-- with the unstyled "Worldwide", a typo that reached six
-- UNIQUE-constrained award titles and six chapter names before anyone
-- read them against the house style. schema.sql itself was corrected
-- first, which fixes every FRESH install; this migration corrects an
-- already-provisioned database, where the wrong casing was already
-- written to disk before the correction.
--
-- Both columns are explicitly commented in schema.sql as
-- "denormalised for display only" — a display copy of the award's
-- name, kept beside the row that actually owns it for cheap reads.
-- Correcting a display copy corrects nothing about what was actually
-- conferred, which is exactly why this is safe to run against a live
-- database.
--
-- awards.award_title — the per-conferral, denormalised record written
-- at the moment a certificate is issued — is NOT touched here, on
-- purpose, and must never be. schema.sql's own comment on that table
-- explains why: "A certificate conferred in 2027 must still read as
-- it did in 2027 even if the College later renames an award or
-- restructures a level. An academic record that changes retrospectively
-- because a lookup table changed is not a record." A certificate
-- already issued under the old casing keeps the casing it was issued
-- under; only the definitions and the chapter display copies — neither
-- of which is a record of anything already conferred — are corrected
-- going forward.
--
-- Every UPDATE below is keyed to the row's stable id and guarded by
-- the exact OLD value, so it is a no-op rather than an error on a
-- database that already carries the corrected casing (built from the
-- fixed schema.sql, or already migrated), and it changes nothing it
-- was not told, by value, to change.

UPDATE award_definitions SET official_title = 'English Aspirant of WorldWide English College'
  WHERE id = 'awd_def_aspirant' AND official_title = 'English Aspirant of Worldwide English College';
UPDATE award_definitions SET official_title = 'English Candidate of WorldWide English College'
  WHERE id = 'awd_def_candidate' AND official_title = 'English Candidate of Worldwide English College';
UPDATE award_definitions SET official_title = 'English Associate of WorldWide English College'
  WHERE id = 'awd_def_associate' AND official_title = 'English Associate of Worldwide English College';
UPDATE award_definitions SET official_title = 'English Envoy of WorldWide English College'
  WHERE id = 'awd_def_envoy' AND official_title = 'English Envoy of Worldwide English College';
UPDATE award_definitions SET official_title = 'English Orator of WorldWide English College'
  WHERE id = 'awd_def_orator' AND official_title = 'English Orator of Worldwide English College';
UPDATE award_definitions SET official_title = 'English Laureate of WorldWide English College'
  WHERE id = 'awd_def_laureate' AND official_title = 'English Laureate of Worldwide English College';

UPDATE alumni_chapters SET award_title = 'English Aspirant of WorldWide English College'
  WHERE id = 'chp_aspirant' AND award_title = 'English Aspirant of Worldwide English College';
UPDATE alumni_chapters SET award_title = 'English Candidate of WorldWide English College'
  WHERE id = 'chp_candidate' AND award_title = 'English Candidate of Worldwide English College';
UPDATE alumni_chapters SET award_title = 'English Associate of WorldWide English College'
  WHERE id = 'chp_associate' AND award_title = 'English Associate of Worldwide English College';
UPDATE alumni_chapters SET award_title = 'English Envoy of WorldWide English College'
  WHERE id = 'chp_envoy' AND award_title = 'English Envoy of Worldwide English College';
UPDATE alumni_chapters SET award_title = 'English Orator of WorldWide English College'
  WHERE id = 'chp_orator' AND award_title = 'English Orator of Worldwide English College';
UPDATE alumni_chapters SET award_title = 'English Laureate of WorldWide English College'
  WHERE id = 'chp_laureate' AND award_title = 'English Laureate of Worldwide English College';
