-- 021 · An assessment record that cannot say which attempt it was
--
-- probe: SELECT 1 FROM sqlite_master WHERE type='index' AND name='idx_assignment_submissions_attempt'
--
-- The probe reads sqlite_master rather than any column this file adds,
-- for the reason 020 gives at length: a probe that selects from its own
-- new object throws on every database the probe exists to ask about.
-- The index below is the LAST object this file creates.
--
-- ============================================================
-- WHY THIS MIGRATION EXISTS
-- ============================================================
--
-- data/academic-regulations.json § reassessment adopts four rules about
-- resits, and all four are about a NUMBERED attempt:
--
--   · resit.attempts   — two resits per summative assessment, three
--                        sittings in all; after that the level is
--                        repeated and the assessment is set afresh.
--   · resit.interval   — no resit sooner than fourteen days after the
--                        previous attempt. "A resit two days later
--                        measures memory of the paper rather than
--                        command of the language."
--   · resit.cap        — a resit mark counts at the pass mark, with the
--                        mark actually achieved recorded in full.
--   · resit.task_refresh — after a year the assessment is set afresh.
--                        Not a limit on the learner: a limit on the
--                        paper.
--
-- `quiz_attempts` and `assignment_submissions` recorded neither an
-- ordinal nor which sitting was the counting one, so the instrument
-- recorded that gap itself, as `conformance.schema.assessment_attempts`:
-- "Neither table records an attempt ordinal or which attempt is the
-- counting one, so resit.attempts, resit.interval and resit.cap cannot
-- be enforced or audited from the data as it stands."
--
-- The arithmetic was never the missing half. countingMarkForAttempts()
-- in functions/_lib/academic/marks.js has always ordered the rows by
-- date and applied the cap. What could not be done was REFUSING a
-- fourth sitting or a resit taken the next morning — and a rule the
-- platform reports on but never enforces is a rule a learner meets only
-- if they happen to comply with it.
--
-- ============================================================
-- WHY AN ORDINAL AND NOT A COUNT AT READ TIME
-- ============================================================
--
-- ORDER BY submitted_at answers "which attempt is this" only while
-- every row survives. An attempt voided for academic misconduct, a
-- sitting struck out on appeal, a row removed under the retention
-- schedule — each of those silently renumbers every attempt after it,
-- and `resit.attempts` would then hand a learner a fourth sitting
-- because their second was expunged. The ordinal is assigned once, at
-- submission, and never recomputed. `learner_recordings.attempt` has
-- worked exactly this way since the audio layer shipped; this brings
-- the two summative tables into line with it.
--
-- The backfill numbers existing rows by submission order per learner
-- per item, which is correct because nothing has ever been voided.
-- ============================================================

ALTER TABLE quiz_attempts ADD COLUMN attempt INTEGER;
ALTER TABLE assignment_submissions ADD COLUMN attempt INTEGER;

-- Backfill: 1, 2, 3 … per (learner, item), oldest first. Ties on the
-- millisecond break on `id`, so the numbering is total and repeatable
-- rather than dependent on the order SQLite happens to return.
UPDATE quiz_attempts SET attempt = (
  SELECT COUNT(*) FROM quiz_attempts p
   WHERE p.learning_item_id = quiz_attempts.learning_item_id
     AND p.user_id = quiz_attempts.user_id
     AND (p.submitted_at < quiz_attempts.submitted_at
          OR (p.submitted_at = quiz_attempts.submitted_at AND p.id <= quiz_attempts.id))
) WHERE attempt IS NULL;

UPDATE assignment_submissions SET attempt = (
  SELECT COUNT(*) FROM assignment_submissions p
   WHERE p.learning_item_id = assignment_submissions.learning_item_id
     AND p.user_id = assignment_submissions.user_id
     AND (p.submitted_at < assignment_submissions.submitted_at
          OR (p.submitted_at = assignment_submissions.submitted_at AND p.id <= assignment_submissions.id))
) WHERE attempt IS NULL;

CREATE UNIQUE INDEX idx_quiz_attempts_attempt
  ON quiz_attempts(user_id, learning_item_id, attempt);
CREATE UNIQUE INDEX idx_assignment_submissions_attempt
  ON assignment_submissions(user_id, learning_item_id, attempt);
