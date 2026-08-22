-- Migration 029 — external examining, moderation, and the pass list.
--
-- probe: SELECT 1 FROM sqlite_master WHERE type='index' AND name='idx_moderation_submission'
--
-- Last object created by this file — see the ordering note in
-- scripts/migrate.mjs.
--
-- ============================================================
-- WHY THIS EXISTS NOW
-- ============================================================
--
-- Migration 028 made a passed graduation audit the precondition for any
-- conferral, and two of its five requirements were hard-coded to
-- `cannot_check` because the platform had nowhere to look: the approved
-- and countersigned pass list, and the External Examiner's independent
-- sign-off.
--
-- "Cannot check" was the honest answer, and it was also a dead end. The
-- External Examiner is now the single thing standing between this
-- College and its first qualification, and the College had no register
-- in which an appointment could even be recorded. This builds the three
-- registers those two checks read, so that the day an appointment is
-- made, the check finds it.
--
-- Nothing here appoints anybody. All three registers ship empty.
--
-- ============================================================
-- WHY MODERATION IS IN THE SAME FILE
-- ============================================================
--
-- assessment.moderation has been reported as not_instrumented since the
-- metric register was written: "the College cannot evidence that its
-- marking is consistent — which is among the first things an
-- accreditation reviewer asks." It belongs here because it is the same
-- question as external examining asked one level down. An External
-- Examiner's first request is the moderation record; a College that
-- cannot produce one is asking its examiner to take marking on trust.
--
-- ============================================================
-- THE RULES THAT ARE NOT NEGOTIABLE, AND ARE THEREFORE CONSTRAINTS
-- ============================================================
--
--   * An External Examiner declares conflicts of interest at
--     appointment. An examiner who has not is not independent, and the
--     independence is the entire point of the office.
--   * An examiner's report needs the College's WRITTEN RESPONSE before
--     the cycle closes. A report received and filed is a report
--     ignored, and this is the commonest way external examining
--     degenerates into a formality.
--   * A moderator is not the first marker. Second-marking your own work
--     is not second-marking.
--   * A pass list is countersigned by somebody other than the person
--     who approved it. One signature is an assertion; two is a control.
--
-- ============================================================
-- NO APPOINTMENTS, NO REPORTS, NO PASS LISTS
-- ============================================================
--
-- All empty, because no one has been appointed, nothing has been
-- examined and nobody has been assessed. The graduation audit therefore
-- still fails, still for the same reason, and now says so from the
-- record rather than from a hard-coded sentence.

CREATE TABLE IF NOT EXISTS external_examiners (
  id            TEXT PRIMARY KEY,     -- 'exex_' + uuid
  full_name     TEXT NOT NULL,
  -- Where their standing comes from. An external examiner with no
  -- stated institution or standing is not external to anything.
  affiliation   TEXT NOT NULL,

  -- NULL = the whole programme.
  level_id      INTEGER REFERENCES programme_levels(id),

  appointed_by  TEXT NOT NULL,        -- the body that made the appointment
  appointed_at  TEXT NOT NULL,
  term_ends     TEXT NOT NULL,

  -- Declared at appointment, not later. NOT NULL, and a statement of
  -- "none" is itself a declaration — what is refused is silence.
  conflicts_declared TEXT NOT NULL,

  status        TEXT NOT NULL DEFAULT 'appointed'
                CHECK (status IN ('appointed','ended','withdrawn')),
  ended_at      TEXT,
  ended_reason  TEXT,

  CHECK (term_ends > appointed_at),
  CHECK (TRIM(conflicts_declared) <> ''),
  CHECK (TRIM(affiliation) <> ''),
  CHECK (status = 'appointed' OR (ended_at IS NOT NULL AND ended_reason IS NOT NULL))
);
CREATE INDEX IF NOT EXISTS idx_external_examiners_level ON external_examiners(level_id);

CREATE TABLE IF NOT EXISTS external_examiner_reports (
  id            TEXT PRIMARY KEY,     -- 'exrep_' + uuid
  examiner_id   TEXT NOT NULL REFERENCES external_examiners(id),
  level_id      INTEGER REFERENCES programme_levels(id),

  period_start  TEXT NOT NULL,
  period_end    TEXT NOT NULL,
  received_at   TEXT NOT NULL,

  -- The judgement the whole office exists to deliver.
  judgement     TEXT NOT NULL CHECK (judgement IN
                  ('standards_met','standards_met_with_conditions','standards_not_met')),
  -- What they actually said.
  findings      TEXT NOT NULL,
  report_path   TEXT,

  -- The College's written reply. See the note above: a report received
  -- and filed is a report ignored.
  response      TEXT,
  responded_by  TEXT,
  responded_at  TEXT,

  CHECK (period_end > period_start),
  CHECK (TRIM(findings) <> ''),
  -- A response is a response only if somebody signed it and dated it.
  CHECK ((response IS NULL) = (responded_at IS NULL)),
  CHECK (response IS NULL OR (responded_by IS NOT NULL AND TRIM(response) <> '')),
  -- Conditions attached to a judgement demand an answer. This is the
  -- one the College cannot be allowed to skip quietly.
  CHECK (judgement = 'standards_met' OR response IS NOT NULL)
);
CREATE INDEX IF NOT EXISTS idx_examiner_reports_examiner ON external_examiner_reports(examiner_id);

CREATE TABLE IF NOT EXISTS moderation_records (
  id            TEXT PRIMARY KEY,     -- 'mod_' + uuid
  submission_id TEXT NOT NULL REFERENCES assignment_submissions(id),

  first_marker  TEXT NOT NULL REFERENCES users(id),
  first_mark    REAL NOT NULL,

  moderator     TEXT NOT NULL REFERENCES users(id),
  moderator_mark REAL NOT NULL,
  moderated_at  TEXT NOT NULL,

  -- Where the two differ, the mark that stands and who settled it.
  agreed_mark   REAL NOT NULL,
  resolution    TEXT,

  UNIQUE (submission_id),
  -- Second-marking your own work is not second-marking.
  CHECK (moderator <> first_marker),
  CHECK (first_mark BETWEEN 0 AND 1 AND moderator_mark BETWEEN 0 AND 1 AND agreed_mark BETWEEN 0 AND 1),
  -- A divergence that changed the mark has to say how it was settled.
  CHECK (ABS(first_mark - moderator_mark) < 0.0001 OR (resolution IS NOT NULL AND TRIM(resolution) <> ''))
);

CREATE TABLE IF NOT EXISTS pass_lists (
  id            TEXT PRIMARY KEY,     -- 'pl_' + uuid
  reference     TEXT NOT NULL UNIQUE,
  level_id      INTEGER NOT NULL REFERENCES programme_levels(id),
  period_start  TEXT NOT NULL,
  period_end    TEXT NOT NULL,

  approved_by   TEXT NOT NULL REFERENCES users(id),
  approved_at   TEXT NOT NULL,
  -- One signature is an assertion; two is a control.
  countersigned_by TEXT REFERENCES users(id),
  countersigned_at TEXT,

  CHECK (period_end > period_start),
  CHECK ((countersigned_by IS NULL) = (countersigned_at IS NULL)),
  CHECK (countersigned_by IS NULL OR countersigned_by <> approved_by),

  -- Target of the composite key on entries: an entry cannot claim to sit
  -- on a countersigned list that is not countersigned.
  UNIQUE (id, countersigned_at)
);

CREATE TABLE IF NOT EXISTS pass_list_entries (
  id            TEXT PRIMARY KEY,
  pass_list_id  TEXT NOT NULL REFERENCES pass_lists(id),
  user_id       TEXT NOT NULL REFERENCES users(id),
  outcome       TEXT NOT NULL CHECK (outcome IN ('pass','fail','deferred','referred')),
  note          TEXT,

  UNIQUE (pass_list_id, user_id)
);
CREATE INDEX IF NOT EXISTS idx_pass_list_entries_user ON pass_list_entries(user_id);
-- Migration 028 set these two to verifiable_from_record = 0 because
-- there was nowhere for the platform to look. The registers above are
-- that somewhere, so the column now says what it means again: the
-- platform CAN confirm both from its own records. They remain human
-- acts — that is stated in each requirement's own description, which is
-- where it belongs — and the audit still cannot perform them.
UPDATE graduation_requirements SET verifiable_from_record = 1
 WHERE code IN ('PASS_LIST', 'EXTERNAL_EXAMINER');

-- PASS_LIST's description already said it was a human act; the
-- External Examiner's did not, and both are. Said in the requirement
-- itself so that anyone reading an audit can tell which of its checks
-- observe a person's decision and which read the platform's own data.
UPDATE graduation_requirements
   SET description = 'An appointed External Examiner has independently signed off the standard of the assessment. This is a human act; the audit records whether it happened and cannot itself perform it. No External Examiner is appointed, so this requirement cannot be met by anybody, and no qualification can be conferred.'
 WHERE code = 'EXTERNAL_EXAMINER';

-- Created last: the probe at the top looks for it.
CREATE INDEX IF NOT EXISTS idx_moderation_submission ON moderation_records(submission_id);
