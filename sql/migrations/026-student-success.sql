-- Migration 026 — student success monitoring and early intervention.
--
-- probe: SELECT 1 FROM sqlite_master WHERE type='index' AND name='idx_concerns_learner'
--
-- Last object created by this file — see the ordering note in
-- scripts/migrate.mjs.
--
-- ============================================================
-- WHY THIS EXISTS
-- ============================================================
--
-- On a distance programme a learner does not announce that they are
-- struggling. They simply stop, and the College finds out at the end of
-- the level, when it is too late to do anything about it. Everything
-- needed to notice is already recorded — time on task, quiz attempts,
-- submissions, and since migration 024 attendance — and nothing
-- anywhere read any of it with the intention of helping somebody.
--
-- ============================================================
-- WHAT THIS FILE DELIBERATELY DOES NOT CONTAIN
-- ============================================================
--
-- A RISK SCORE. Not a number, not a weighting, not a model.
--
-- The College has never taught anybody. It therefore has no evidence
-- whatsoever about what predicts failure on its own programmes, and a
-- weighted risk model built today would be a set of invented numbers
-- wearing the costume of educational research. Someone would then act
-- on it, and a learner would be contacted, or not contacted, because of
-- a figure that came from nowhere.
--
-- What is here instead is a register of TRIGGERS — each one a plainly
-- stated, readable rule — and every trigger carries `basis`, which says
-- on what authority its threshold was set, and `status`, which is
-- 'proposed' until an academic body approves it. The triggers seeded
-- below are all 'proposed'. None of them fires yet, and the College can
-- say exactly why: nobody has decided that fourteen days is the right
-- number of days.
--
-- When there are cohorts, the thresholds should be set from what
-- actually happened to them. That is educational research, it is worth
-- doing, and it is recommended rather than simulated.
--
-- ============================================================
-- A CONCERN MUST REACH THE LEARNER
-- ============================================================
--
-- This is the constraint that makes the difference between support and
-- surveillance. A record that says "this person appears to be
-- struggling", held by the institution, never shown to them and never
-- acted on, is a file kept about somebody. So a concern cannot be
-- closed unless either the learner was contacted, or it was closed as
-- needing no contact WITH A STATED REASON — and the reason is required,
-- because "no action needed" is exactly what a busy week writes on
-- everything.
--
-- ============================================================
-- AND SOMEBODY MUST OWN IT
-- ============================================================
--
-- `raised_by` is a person or a named trigger, never nothing. A concern
-- that appeared from nowhere belongs to nobody, and nobody chases what
-- belongs to nobody.
--
-- ============================================================
-- NO CONCERNS
-- ============================================================
--
-- The register is empty. Nobody is enrolled, nobody is studying, and
-- nobody is struggling. It stays empty until there is a learner to be
-- concerned about.

CREATE TABLE IF NOT EXISTS intervention_triggers (
  code        TEXT PRIMARY KEY,
  name        TEXT NOT NULL,
  sequence    INTEGER NOT NULL,

  -- The rule, in words. Readable by the learner it concerns, because
  -- one day it will have to be explained to them.
  rule        TEXT NOT NULL,

  -- What the College already records that this reads.
  reads       TEXT NOT NULL,

  -- On what authority the threshold was set. NOT NULL, and the seeded
  -- rows say honestly that it has not been set on any authority yet.
  basis       TEXT NOT NULL,

  status      TEXT NOT NULL DEFAULT 'proposed'
              CHECK (status IN ('proposed','approved','retired')),
  -- An approved trigger has an approving body and a date. A proposed
  -- one must have neither, so that "approved" cannot happen by
  -- forgetting to change a default.
  approved_by TEXT,
  approved_at TEXT,

  CHECK (status <> 'approved' OR (approved_by IS NOT NULL AND approved_at IS NOT NULL)),
  CHECK (status =  'approved' OR (approved_by IS NULL AND approved_at IS NULL)),
  CHECK (TRIM(basis) <> '')
);

INSERT OR IGNORE INTO intervention_triggers (code, name, sequence, rule, reads, basis) VALUES
  ('DORMANT', 'No study activity', 1,
   'An active enrolment with no recorded study time for a set number of consecutive days.',
   'time_on_task.last_seen_at against the enrolment''s status.',
   'NOT SET. The number of days is an academic judgement and the College has no cohort data from which to choose it. For Academic Senate.'),
  ('NEVER_STARTED', 'Enrolled but never started', 2,
   'An enrolment that became active and has no recorded study time at all after a set number of days.',
   'enrolments.started_at against the absence of any time_on_task row.',
   'NOT SET. Distinct from DORMANT because the causes differ — a learner who never began often never received their access details, which is a support failure rather than a study one. For Academic Senate.'),
  ('ASSESSMENT_MISSED', 'Assessment not attempted', 3,
   'A module''s assessment not attempted by a learner who has studied the module.',
   'quiz_attempts and submissions against the module''s learning items.',
   'NOT SET. Whether one missed assessment warrants contact, or two, is an academic judgement. For Academic Senate.'),
  ('MARKS_FALLING', 'A sustained fall in marks', 4,
   'A learner''s marks declining across consecutive assessed pieces.',
   'The marks already recorded against submissions.',
   'NOT SET. How many pieces constitute a trend rather than a bad week is precisely the kind of question that should be answered from real cohort data, and the College has none. Recommended for study once a cohort has completed a level.'),
  ('ABSENT_WHEN_EXPECTED', 'Absent from required teaching', 5,
   'Absence from live sessions the College required attendance at.',
   'session_attendance against live_sessions.attendance_expected (migration 024).',
   'NOT SET. Depends on the unsettled question governance A7 raised — what attendance means on an asynchronous programme. Blocked behind that decision, and honestly so.');

CREATE TABLE IF NOT EXISTS learner_concerns (
  id            TEXT PRIMARY KEY,     -- 'con_' + uuid
  user_id       TEXT NOT NULL REFERENCES users(id),
  enrolment_id  TEXT REFERENCES enrolments(id),

  -- Exactly one origin: a person noticed, or a named trigger fired.
  -- Never neither. See the note above.
  raised_by     TEXT REFERENCES users(id),
  trigger_code  TEXT REFERENCES intervention_triggers(code),
  raised_at     TEXT NOT NULL,

  -- What was actually observed. Not an inference, not a score.
  observation   TEXT NOT NULL,

  -- Reaching the learner.
  contacted_at  TEXT,
  contacted_by  TEXT REFERENCES users(id),
  contact_note  TEXT,
  -- What the learner said back, when they did. Recorded because the
  -- most useful thing in the whole file is usually this sentence.
  learner_response TEXT,

  outcome       TEXT CHECK (outcome IS NULL OR outcome IN
                  ('resumed','support_arranged','deferred','withdrew',
                   'no_contact_possible','no_action_needed')),
  outcome_note  TEXT,
  closed_at     TEXT,

  CHECK ((raised_by IS NOT NULL) + (trigger_code IS NOT NULL) >= 1),
  CHECK (TRIM(observation) <> ''),
  -- A contact has a time and a person.
  CHECK ((contacted_at IS NULL) = (contacted_by IS NULL)),
  -- A closed concern reached the learner, or says in writing why it did
  -- not need to. This is the whole difference between support and a
  -- file kept about somebody.
  CHECK (closed_at IS NULL OR contacted_at IS NOT NULL
         OR (outcome IN ('no_action_needed','no_contact_possible')
             AND outcome_note IS NOT NULL AND TRIM(outcome_note) <> '')),
  -- Closing needs an outcome; an outcome means it is closed.
  CHECK ((closed_at IS NULL) = (outcome IS NULL))
);

CREATE INDEX IF NOT EXISTS idx_concerns_open
  ON learner_concerns(raised_at) WHERE closed_at IS NULL;
-- Created last: the probe at the top looks for it.
CREATE INDEX IF NOT EXISTS idx_concerns_learner ON learner_concerns(user_id);
