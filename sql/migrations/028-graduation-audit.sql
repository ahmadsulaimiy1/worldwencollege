-- Migration 028 — the graduation audit.
--
-- probe: SELECT 1 FROM sqlite_master WHERE type='index' AND name='idx_graduation_checks_audit'
--
-- Last object created by this file — see the ordering note in
-- scripts/migrate.mjs.
--
-- ============================================================
-- WHY THIS EXISTS
-- ============================================================
--
-- conferAward() in functions/_lib/registry/awards.js says of itself
-- that it is "the only way a row enters the Register", and it is
-- careful: it hashes the award into a tamper-evident chain, refuses two
-- conferrals racing to extend the same link, and signs the credential
-- at the moment of conferral rather than retrofitting a signature.
--
-- And it never asks whether the learner earned anything.
--
-- It takes the award title, the post-nominal, the CEFR level, the
-- credits and the hours FROM ITS CALLER. A caller could confer a
-- Mastery qualification on somebody who has completed nothing, and
-- every safeguard in that file would faithfully record it: correctly
-- chained, correctly signed, permanently verifiable, and false.
--
-- The College's whole promise is the qualification. Between "somebody
-- calls this function" and "a signed credential exists" there was
-- nothing that asked whether it was true.
--
-- ============================================================
-- THE REQUIREMENTS ARE NOT INVENTED HERE
-- ============================================================
--
-- Every requirement below is taken from text ALREADY ADOPTED in the
-- record — award_definitions.graduation_requirement, written when the
-- Worldwide English Qualifications framework was adopted (migration
-- 021). Each row carries `basis` quoting the clause it comes from. This
-- migration structures what the College already committed to; it does
-- not decide anything new.
--
-- Speaking assessment is deliberately NOT a separate requirement. It
-- already carries a 20 per cent weight in each stage's final assessment
-- (migration 022), so a stage examination passed under the assessment
-- framework has already accounted for it. A second requirement would
-- be double-counting, and double-counting dressed as rigour.
--
-- ============================================================
-- SOME REQUIREMENTS CANNOT BE CHECKED BY SOFTWARE, AND SAY SO
-- ============================================================
--
-- `verifiable_from_record` separates the requirements the platform can
-- confirm from the ones that are human acts. The approved and
-- countersigned pass list is a human act. The External Examiner's
-- independent sign-off is a human act, and there is no External
-- Examiner.
--
-- An audit therefore records THREE possible results per requirement —
-- met, not_met, and cannot_check — because an institution that recorded
-- "met" for something it had no way to confirm would be lying in its
-- own files. `observed` is NOT NULL on every check: what the record
-- actually showed, in words.
--
-- ============================================================
-- WHAT THIS MEANS TODAY: NOTHING CAN BE CONFERRED
-- ============================================================
--
-- EXTERNAL_EXAMINER cannot be met, because no External Examiner is
-- appointed. Every graduation requirement in the WEQ framework already
-- says so in terms — "the College will not confer without one" — and
-- that sentence is now enforced rather than merely published. Until
-- the appointment is made, every audit ends `not_met` and no award can
-- be attached to it.
--
-- That is the correct state, not a defect to engineer around.
--
-- ============================================================
-- HOW MUCH OF THIS IS STRUCTURAL, STATED HONESTLY
-- ============================================================
--
-- `conferrals` binds an award to an audit by a COMPOSITE foreign key
-- onto (id, user_id, level_id, outcome), with a CHECK pinning the
-- outcome to 'met'. So a conferral cannot name an audit that failed,
-- nor one belonging to a different learner, nor one for a different
-- level. That much is impossible to get wrong.
--
-- What a foreign key CANNOT do is force every award to have a
-- conferral row. That would need either a trigger or a rebuild of the
-- awards table. A rebuild would drop and recreate a table that four
-- other tables depend on, on a live database, to solve a problem that
-- has no rows in it yet; and a trigger body contains semicolons, which
-- is exactly where SQL splitters have historically broken, and this
-- deploy has been repaired once already this week.
--
-- So the last link is held by conferAward(), which refuses to confer
-- without a passed audit, by tests that prove it refuses, and by
-- registry.unauditedConferrals, which reports any award lacking one.
-- A guarantee that is only partly structural should say which part.

CREATE TABLE IF NOT EXISTS graduation_requirements (
  code          TEXT PRIMARY KEY,
  name          TEXT NOT NULL,
  sequence      INTEGER NOT NULL,
  -- 'all', or a single award_code where a stage differs.
  applies_to    TEXT NOT NULL DEFAULT 'all',
  description   TEXT NOT NULL,
  -- The adopted clause this comes from. NOT NULL: a requirement nobody
  -- adopted is a requirement somebody invented.
  basis         TEXT NOT NULL,
  -- 1 = the platform can confirm it from its own records.
  -- 0 = a human act, which the audit records rather than checks.
  verifiable_from_record INTEGER NOT NULL CHECK (verifiable_from_record IN (0, 1)),

  CHECK (TRIM(basis) <> ''),
  CHECK (TRIM(description) <> '')
);

INSERT OR IGNORE INTO graduation_requirements
  (code, name, sequence, description, basis, verifiable_from_record) VALUES
  ('MODULES_COMPLETE', 'All ten modules completed', 1,
   'Every module of the stage has been completed by the learner.',
   'WEQ graduation requirement, adopted migration 021: "All ten modules completed".', 1),
  ('ASSIGNMENTS_GRADED', 'All ten assignments submitted and graded', 2,
   'Every assignment of the stage has been submitted and carries a mark. A submission without a mark is not a graded assignment.',
   'WEQ graduation requirement, adopted migration 021: "all ten assignments submitted and graded".', 1),
  ('EXAM_PASSED', 'The stage examination passed', 3,
   'The end-of-stage examination has been passed under the stage assessment framework, which includes the speaking component at its stated weight.',
   'WEQ graduation requirement, adopted migration 021: "the end-of-stage examination passed"; assessment framework and speaking weights, migration 022.', 1),
  ('PASS_LIST', 'An approved and countersigned pass list', 4,
   'The learner appears on a pass list approved by the Registrar and countersigned. This is a human act; the audit records whether it happened, and cannot itself perform it.',
   'WEQ graduation requirement, adopted migration 021: "Conferral is on the authority of the Registrar acting under an approved pass list, countersigned".', 0),
  ('EXTERNAL_EXAMINER', 'Independent External Examiner sign-off', 5,
   'An appointed External Examiner has independently signed off the standard of the assessment. No External Examiner is appointed, so this requirement cannot be met by anybody, and no qualification can be conferred.',
   'WEQ graduation requirement, adopted migration 021: "the College has not yet appointed the External Examiner whose independent sign-off it requires before it will confer anything".', 0);

CREATE TABLE IF NOT EXISTS graduation_audits (
  id            TEXT PRIMARY KEY,     -- 'gaud_' + uuid
  user_id       TEXT NOT NULL REFERENCES users(id),
  level_id      INTEGER NOT NULL REFERENCES programme_levels(id),
  award_code    TEXT NOT NULL,        -- ECIC, HCIC, CAEC, HCAEC, ACEC, WEPC

  run_at        TEXT NOT NULL,
  run_by        TEXT REFERENCES users(id),   -- NULL where the audit ran unattended

  -- NULL while the audit is open. Set once, on closing.
  outcome       TEXT CHECK (outcome IS NULL OR outcome IN ('met','not_met')),
  closed_at     TEXT,
  -- Why, in words. Required on any closed audit, including a passed
  -- one: "met" with no statement of what was seen is not an audit.
  summary       TEXT,

  CHECK ((outcome IS NULL) = (closed_at IS NULL)),
  CHECK (outcome IS NULL OR (summary IS NOT NULL AND TRIM(summary) <> '')),

  -- Target of the composite key on `conferrals`. This is what makes a
  -- conferral against a failed, borrowed, or wrong-level audit
  -- impossible rather than merely discouraged.
  UNIQUE (id, user_id, level_id, outcome)
);
CREATE INDEX IF NOT EXISTS idx_graduation_audits_learner ON graduation_audits(user_id, level_id);

CREATE TABLE IF NOT EXISTS graduation_audit_checks (
  id            TEXT PRIMARY KEY,
  audit_id      TEXT NOT NULL REFERENCES graduation_audits(id),
  requirement_code TEXT NOT NULL REFERENCES graduation_requirements(code),

  -- Three results, not two. See the note above: recording "met" for
  -- something the College had no way to confirm would be a lie in its
  -- own files.
  result        TEXT NOT NULL CHECK (result IN ('met','not_met','cannot_check')),
  -- What the record actually showed. NOT NULL on every result.
  observed      TEXT NOT NULL,

  UNIQUE (audit_id, requirement_code),
  CHECK (TRIM(observed) <> '')
);

CREATE TABLE IF NOT EXISTS conferrals (
  award_id      TEXT PRIMARY KEY REFERENCES awards(id),
  audit_id      TEXT NOT NULL,
  user_id       TEXT NOT NULL,
  level_id      INTEGER NOT NULL,
  -- Pinned. The composite key below then makes it structurally
  -- impossible to attach an award to an audit that did not pass.
  audit_outcome TEXT NOT NULL DEFAULT 'met' CHECK (audit_outcome = 'met'),
  conferred_at  TEXT NOT NULL,

  FOREIGN KEY (audit_id, user_id, level_id, audit_outcome)
    REFERENCES graduation_audits(id, user_id, level_id, outcome)
);
CREATE INDEX IF NOT EXISTS idx_conferrals_audit ON conferrals(audit_id);
-- Created last: the probe at the top looks for it.
CREATE INDEX IF NOT EXISTS idx_graduation_checks_audit ON graduation_audit_checks(audit_id);
