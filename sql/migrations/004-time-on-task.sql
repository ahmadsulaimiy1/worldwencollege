-- Migration 004 — time on task.
--
-- probe: SELECT 1 FROM sqlite_master WHERE type='index' AND name='idx_time_on_task_module'
--
-- Last object created by this file — see the ordering note in
-- scripts/migrate.mjs.
--
-- WHY THIS EXISTS.
--
-- docs/academic-framework.md § I commits the College to publishing
-- MEASURED Guided and Independent Learning Hours rather than asserted
-- ones. Every institution publishes an hours figure; almost none can say
-- where it came from. That commitment is worthless without a
-- measurement, and a measurement cannot be taken retrospectively — the
-- learners who study before this table exists are simply not counted,
-- for ever. That is the whole argument for building it before the
-- learners arrive rather than after.
--
-- WHAT IT DELIBERATELY DOES NOT DO.
--
-- It does not track a learner. There is no page-view log, no clickstream
-- and no session history: one row per learner per module, holding a
-- total. That is the least data that can answer "how long does this
-- module take", and answering that question is the only reason the table
-- is here.
--
-- `seconds` is a total, incremented server-side. The client says only
-- "I am still working"; the server decides how much time that is worth
-- by looking at the clock (see functions/_lib/lms/time-on-task.js). A
-- client-supplied duration would make the College's headline academic
-- metric editable from the browser console.

CREATE TABLE time_on_task (
  id            TEXT PRIMARY KEY,   -- 'tot_' + uuid
  user_id       TEXT NOT NULL REFERENCES users(id),
  unit_id       TEXT NOT NULL REFERENCES units(id),  -- a MODULE in framework terms
  seconds       INTEGER NOT NULL DEFAULT 0,
  -- Kept so a total can be sanity-checked against the span it accrued
  -- over. Forty hours recorded inside one afternoon is not study.
  first_seen_at TEXT NOT NULL,
  last_seen_at  TEXT NOT NULL,
  UNIQUE(user_id, unit_id)
);

CREATE INDEX idx_time_on_task_user ON time_on_task(user_id);
CREATE INDEX idx_time_on_task_module ON time_on_task(unit_id);
