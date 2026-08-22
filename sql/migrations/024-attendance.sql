-- Migration 024 — the attendance record.
--
-- probe: SELECT 1 FROM sqlite_master WHERE type='index' AND name='idx_session_attendance_session'
--
-- Last object created by this file — see the ordering note in
-- scripts/migrate.mjs.
--
-- ============================================================
-- WHY THIS EXISTS
-- ============================================================
--
-- Governance A7 listed three metrics the College had undertaken to
-- report and could not compute at all, and put attendance FIRST:
-- "live_sessions exists; nothing records who attended". That has been
-- true since live sessions were built. A College that schedules
-- teaching and does not record who came to it cannot answer the first
-- question any reviewer asks about a cohort, and cannot notice a
-- learner disappearing until they have already gone.
--
-- ============================================================
-- THE DECISION THIS FILE DOES NOT TAKE
-- ============================================================
--
-- A7 named the one decision attendance needs: "does attendance mean
-- presence at a live session, or engagement with the module? The
-- platform can measure both."
--
-- That is a decision about what the College believes teaching is on an
-- asynchronous programme, and it is not the author's to take. So this
-- migration records the FACT and leaves the DEFINITION open: it stores
-- who was present at which session and how the College knows, and it
-- does not compute an attendance rate. The metric register reports
-- presence counts and says plainly that the rate is undefined pending
-- the Board — see functions/_lib/reports/institutional.js.
--
-- Recording the fact is not a judgement. Deciding that a learner who
-- attended no live sessions but completed every unit was "absent"
-- very much is.
--
-- ============================================================
-- WHY EVERY ROW SAYS HOW THE COLLEGE KNOWS
-- ============================================================
--
-- `source` is not metadata. An attendance record that cannot say how it
-- was made cannot be used for anything that matters — not for an
-- intervention, not for a progression decision, and certainly not for a
-- statement to a sponsor or a visa authority.
--
-- Three sources, and they are not equivalent:
--
--   platform — join and leave times from the meeting provider. The only
--              source that is evidence rather than testimony.
--   host     — a named member of staff marked the register. Testimony,
--              attributable, contemporaneous.
--   self     — the learner said they were there. Recorded because it is
--              sometimes all there is, and flagged because a College
--              that treats self-report as equivalent to a join log is
--              not really keeping a register.
--
-- ============================================================
-- ATTENDANCE IS NOT EXPECTED AT EVERY SESSION
-- ============================================================
--
-- This is an asynchronous programme. Most live sessions are an offer,
-- not an obligation, and marking a learner "absent" from something they
-- were never required to attend manufactures a problem out of the
-- programme working as designed. So live_sessions gains
-- `attendance_expected`, defaulting to 0, and absence only means
-- anything where it is 1.
--
-- ============================================================
-- NO ATTENDANCE
-- ============================================================
--
-- The table is empty. No live session has been held, because nothing
-- has been taught. The metric register reports that as
-- insufficient_data and never as a zero attendance rate.

-- Whether being there was required, or offered.
ALTER TABLE live_sessions ADD COLUMN attendance_expected INTEGER NOT NULL DEFAULT 0
  CHECK (attendance_expected IN (0, 1));

CREATE TABLE IF NOT EXISTS session_attendance (
  id            TEXT PRIMARY KEY,   -- 'att_' + uuid
  session_id    TEXT NOT NULL REFERENCES live_sessions(id),
  user_id       TEXT NOT NULL REFERENCES users(id),

  state         TEXT NOT NULL CHECK (state IN ('present','absent','excused')),

  -- How the College knows. See the note above: these are not equivalent.
  source        TEXT NOT NULL CHECK (source IN ('platform','host','self')),

  -- Present only. A join time is what makes 'present' a fact rather
  -- than an opinion.
  joined_at     TEXT,
  left_at       TEXT,

  -- Excused only: why. An excusal nobody has to justify is an excusal
  -- that will be handed out to whoever asks most persistently.
  reason        TEXT,

  recorded_by   TEXT NOT NULL REFERENCES users(id),
  recorded_at   TEXT NOT NULL,

  -- One record per learner per session. Two contradictory rows is the
  -- state a register exists to prevent.
  UNIQUE (session_id, user_id),

  -- Present means there is a join time.
  CHECK (state <> 'present' OR joined_at IS NOT NULL),
  -- Absent and excused mean there is not.
  CHECK (state = 'present' OR joined_at IS NULL),
  -- Nobody leaves before they arrive.
  CHECK (left_at IS NULL OR (joined_at IS NOT NULL AND left_at >= joined_at)),
  -- An excusal carries a reason.
  CHECK (state <> 'excused' OR (reason IS NOT NULL AND TRIM(reason) <> '')),
  -- A platform record is a join log; a person cannot enter one by hand
  -- and call it evidence, so it must carry the times the log produced.
  CHECK (source <> 'platform' OR (joined_at IS NOT NULL AND left_at IS NOT NULL))
);

CREATE INDEX IF NOT EXISTS idx_session_attendance_user ON session_attendance(user_id);
-- Created last: the probe at the top looks for it.
CREATE INDEX IF NOT EXISTS idx_session_attendance_session ON session_attendance(session_id);
