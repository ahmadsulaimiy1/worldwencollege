-- Migration 027 — programme review and annual monitoring.
--
-- probe: SELECT 1 FROM sqlite_master WHERE type='index' AND name='idx_review_actions_finding'
--
-- Last object created by this file — see the ordering note in
-- scripts/migrate.mjs.
--
-- ============================================================
-- WHY THIS EXISTS
-- ============================================================
--
-- docs/curriculum-programme-review.md is a real and thorough review of
-- the whole six-level curriculum. It is also a ONE-OFF: it happened
-- because somebody decided to do it, and nothing anywhere obliges it to
-- happen again, records what became of its findings, or notices when an
-- action agreed two years ago has quietly never been done.
--
-- That gap is the difference between a College that reviewed itself
-- once and a College with quality assurance. The first question any
-- accreditation reviewer asks is not "have you reviewed the programme"
-- but "show me the cycle, and show me an action you carried forward".
--
-- This is also what the registers built this week are FOR. Student
-- feedback (025), attendance (024), misconduct (023) and early
-- intervention (026) each collect evidence about the programme, and
-- until now nothing consumed any of it. A finding here names the
-- register it came from.
--
-- ============================================================
-- A FINDING WITHOUT EVIDENCE IS AN OPINION
-- ============================================================
--
-- `evidence` is NOT NULL and non-blank on every finding, and `source`
-- names which register or which body it came from. A review whose
-- findings are impressions is a review that reaches whatever conclusion
-- the room already held, and it is worse than no review because it
-- carries the authority of one.
--
-- ============================================================
-- THE POINT OF ANNUAL MONITORING IS THE CARRY-FORWARD
-- ============================================================
--
-- Anyone can agree an action. The diagnostic question is what happened
-- to the actions nobody did. So an action is either COMPLETED, with a
-- note saying what actually changed, or CARRIED FORWARD into a
-- successor action that says so explicitly — never silently dropped.
--
-- `continues` chains a carried-forward action to the one it succeeds,
-- which makes "this has now been outstanding for three cycles" a
-- computable fact rather than an institutional memory. It is reported
-- in functions/_lib/reports/institutional.js, and it is meant to be
-- uncomfortable reading.
--
-- ============================================================
-- THE CADENCE IS NOT DECIDED HERE
-- ============================================================
--
-- How often a programme must be reviewed is academic governance, and
-- the College has taken no such decision. review_schedule therefore
-- ships with proposed cadences whose `basis` says plainly that nobody
-- has approved them, on the same discipline as migration 026's
-- intervention triggers: a proposal cannot become approved by anybody
-- forgetting to change a default.
--
-- ============================================================
-- NO CYCLES
-- ============================================================
--
-- The register is empty. No cycle has run, because there is no cohort
-- to review and no year to monitor.

CREATE TABLE IF NOT EXISTS review_schedule (
  kind          TEXT PRIMARY KEY CHECK (kind IN ('annual_monitoring','periodic_review','thematic')),
  name          TEXT NOT NULL,
  purpose       TEXT NOT NULL,
  -- Proposed cadence in months. NULL where the kind is by definition
  -- occasional rather than scheduled.
  every_months  INTEGER CHECK (every_months IS NULL OR every_months > 0),
  basis         TEXT NOT NULL,
  status        TEXT NOT NULL DEFAULT 'proposed' CHECK (status IN ('proposed','approved','retired')),
  approved_by   TEXT,
  approved_at   TEXT,

  CHECK (status <> 'approved' OR (approved_by IS NOT NULL AND approved_at IS NOT NULL)),
  CHECK (status =  'approved' OR (approved_by IS NULL AND approved_at IS NULL)),
  CHECK (TRIM(basis) <> '')
);

INSERT OR IGNORE INTO review_schedule (kind, name, purpose, every_months, basis) VALUES
  ('annual_monitoring', 'Annual monitoring',
   'A short yearly account of how each level actually ran: what the registers show, what changed, and what remains outstanding from last year.',
   12,
   'NOT SET. Twelve months is the common sector cadence and is entered here as a proposal only. For Academic Senate.'),
  ('periodic_review', 'Periodic programme review',
   'A full re-examination of a programme against its own qualification framework: whether the outcomes are still the right outcomes and whether the assessment still evidences them.',
   60,
   'NOT SET. Five years is the common sector cadence and is entered here as a proposal only. For Academic Senate.'),
  ('thematic', 'Thematic review',
   'A review of one issue across the whole College — assessment load, speaking assessment, accessibility — commissioned when something needs looking at.',
   NULL,
   'NOT SET, and by nature not scheduled: a thematic review is commissioned. What the College must decide is who may commission one. For Academic Senate.');

CREATE TABLE IF NOT EXISTS review_cycles (
  id            TEXT PRIMARY KEY,     -- 'rev_' + uuid
  reference     TEXT NOT NULL UNIQUE, -- 'AM-2027-L1'
  kind          TEXT NOT NULL REFERENCES review_schedule(kind),
  title         TEXT NOT NULL,

  level_id      INTEGER REFERENCES programme_levels(id),   -- NULL = whole programme
  period_start  TEXT NOT NULL,
  period_end    TEXT NOT NULL,
  due_at        TEXT NOT NULL,

  status        TEXT NOT NULL DEFAULT 'scheduled'
                CHECK (status IN ('scheduled','in_progress','considered','closed')),

  -- Who considered it. A review nobody senior read is a document.
  considered_by TEXT,
  considered_at TEXT,
  report_path   TEXT,

  CHECK (period_end > period_start),
  CHECK (status NOT IN ('considered','closed')
         OR (considered_by IS NOT NULL AND considered_at IS NOT NULL)),
  CHECK (status IN ('considered','closed')
         OR (considered_by IS NULL AND considered_at IS NULL))
);
CREATE INDEX IF NOT EXISTS idx_review_cycles_due
  ON review_cycles(due_at) WHERE status IN ('scheduled','in_progress');

CREATE TABLE IF NOT EXISTS review_findings (
  id            TEXT PRIMARY KEY,     -- 'rf_' + uuid
  cycle_id      TEXT NOT NULL,
  sequence      INTEGER NOT NULL,
  finding       TEXT NOT NULL,

  -- Which register or body this came from. The reason the College
  -- collects anything.
  source        TEXT NOT NULL CHECK (source IN
                  ('student_feedback','attendance','assessment_data','integrity_cases',
                   'early_intervention','external_examiner','staff','learner_representation','other')),
  -- What it rests on. See the note above: a finding without this is an
  -- opinion wearing a review's authority.
  evidence      TEXT NOT NULL,

  UNIQUE (cycle_id, sequence),
  UNIQUE (id, cycle_id),          -- target of the composite key below
  FOREIGN KEY (cycle_id) REFERENCES review_cycles(id),
  CHECK (TRIM(evidence) <> ''),
  CHECK (TRIM(finding) <> '')
);
CREATE INDEX IF NOT EXISTS idx_review_findings_cycle ON review_findings(cycle_id);

CREATE TABLE IF NOT EXISTS review_actions (
  id            TEXT PRIMARY KEY,     -- 'ra_' + uuid
  finding_id    TEXT NOT NULL,
  -- Carried alongside so an action can be counted against its cycle
  -- without a join, and bound to the finding's cycle by the composite
  -- key below so the two cannot disagree.
  cycle_id      TEXT NOT NULL,

  action        TEXT NOT NULL,
  owner_role    TEXT NOT NULL,   -- a ROLE, not a person: people leave
  due_at        TEXT NOT NULL,

  completed_at  TEXT,
  outcome_note  TEXT,            -- what actually changed

  -- The successor action, when this one was carried forward instead of
  -- done. See the note above.
  continues     TEXT REFERENCES review_actions(id),

  FOREIGN KEY (finding_id, cycle_id) REFERENCES review_findings(id, cycle_id),

  -- Completing means saying what changed.
  CHECK (completed_at IS NULL OR (outcome_note IS NOT NULL AND TRIM(outcome_note) <> '')),
  -- An action cannot be both done and carried forward.
  CHECK (completed_at IS NULL OR continues IS NULL),
  -- An action does not continue itself.
  CHECK (continues IS NULL OR continues <> id),
  CHECK (TRIM(owner_role) <> '')
);
CREATE INDEX IF NOT EXISTS idx_review_actions_cycle ON review_actions(cycle_id);
CREATE INDEX IF NOT EXISTS idx_review_actions_open
  ON review_actions(due_at) WHERE completed_at IS NULL;
-- Created last: the probe at the top looks for it.
CREATE INDEX IF NOT EXISTS idx_review_actions_finding ON review_actions(finding_id);
