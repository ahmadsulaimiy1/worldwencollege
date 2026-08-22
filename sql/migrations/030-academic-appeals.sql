-- Migration 030 — the academic appeals procedure.
--
-- probe: SELECT 1 FROM sqlite_master WHERE type='index' AND name='idx_appeals_learner'
--
-- Last object created by this file — see the ordering note in
-- scripts/migrate.mjs.
--
-- ============================================================
-- STATUS: NOT ADOPTED. READ THIS FIRST.
-- ============================================================
--
-- Governance C9 (the misconduct procedure) was ADOPTED before migration
-- 023 built it. This one has no such decision behind it. Evidence item
-- AP-001 has sat as `governance_pending` since the register was
-- written: "No procedure exists by which a learner may challenge a
-- mark, a progression decision or a withdrawal. The platform can
-- already record all three; nothing records a challenge to any of
-- them."
--
-- So this file builds the MACHINERY and does not pretend the DECISION
-- has been taken. `appeal_procedure.status` ships as 'proposed', the
-- register ships empty, and docs/governance-decisions.md carries the
-- recommendation as C10, explicitly marked not adopted. The same
-- discipline as migration 026's intervention thresholds: a proposal
-- must not become policy because somebody forgot to change a default.
--
-- ============================================================
-- WHY THIS MATTERS MORE THAN THE MISCONDUCT PROCEDURE
-- ============================================================
--
-- Misconduct affects the few who are accused. Appeals affect EVERY
-- learner, because every learner receives marks, progression decisions
-- and — if it goes badly — a withdrawal. A College that can grade
-- somebody and cannot be argued with about it is not administering
-- academic judgement; it is administering unappealable power.
--
-- ============================================================
-- THE RULE THAT MAKES AN APPEALS PROCESS REAL
-- ============================================================
--
-- ACADEMIC JUDGEMENT IS NOT A GROUND OF APPEAL.
--
-- This is universal practice and it is the load-bearing rule. Without
-- it, "I think I deserved a higher mark" is an appeal, every mark
-- becomes provisional, and the process collapses into a re-marking
-- service that rewards persistence over merit — which is unfair to
-- every learner who accepts their mark.
--
-- What IS appealable is the process: that a procedure was not followed,
-- that the decision-maker had an interest, that evidence the learner
-- submitted was never considered, or that the record contains a plain
-- error of fact. Each of those is a thing the College can be shown to
-- have got wrong, and can put right.
--
-- The grounds are rows, so a learner can read them before deciding
-- whether they have an appeal, rather than discovering afterwards that
-- they never did.
--
-- ============================================================
-- AND THE RULE THAT STOPS IT BEING ENDLESS
-- ============================================================
--
-- One internal appeal, then a COMPLETION OF PROCEDURES statement.
--
-- That statement is not a formality. It is the document that lets a
-- learner take the matter outside the institution — to an ombudsman, a
-- regulator, or a court — and a College that never issues one can keep
-- a complainant inside its own process indefinitely. So the schema
-- refuses to close an appeal without it, and refuses a second internal
-- appeal against the same decision.
--
-- ============================================================
-- NO APPEALS
-- ============================================================
--
-- The register is empty. Nothing has been marked, nobody has
-- progressed, and no one has been withdrawn, so there is nothing to
-- appeal against.

CREATE TABLE IF NOT EXISTS appeal_procedure (
  id            INTEGER PRIMARY KEY CHECK (id = 1),   -- exactly one row
  version       TEXT NOT NULL,
  -- Working days from the decision within which an appeal must be
  -- lodged, and within which the College must answer.
  lodge_within_days   INTEGER NOT NULL CHECK (lodge_within_days > 0),
  respond_within_days INTEGER NOT NULL CHECK (respond_within_days > 0),
  basis         TEXT NOT NULL,
  status        TEXT NOT NULL DEFAULT 'proposed' CHECK (status IN ('proposed','adopted','superseded')),
  adopted_by    TEXT,
  adopted_at    TEXT,

  CHECK (status <> 'adopted' OR (adopted_by IS NOT NULL AND adopted_at IS NOT NULL)),
  CHECK (status =  'adopted' OR (adopted_by IS NULL AND adopted_at IS NULL)),
  CHECK (TRIM(basis) <> '')
);

INSERT OR IGNORE INTO appeal_procedure
  (id, version, lodge_within_days, respond_within_days, basis) VALUES
  (1, 'draft-1', 20, 30,
   'NOT ADOPTED. Twenty working days to lodge and thirty to answer are the common sector figures and are entered here as a proposal. Evidence AP-001; recommended as governance C10. For the Academic Senate.');

CREATE TABLE IF NOT EXISTS appeal_grounds (
  code        TEXT PRIMARY KEY,
  name        TEXT NOT NULL,
  sequence    INTEGER NOT NULL,
  -- Written for the learner deciding whether they have an appeal.
  definition  TEXT NOT NULL,
  -- What they would need to show. Stated so that a ground nobody can
  -- evidence is visibly a ground nobody can evidence.
  evidence_expected TEXT NOT NULL,
  -- 0 for the row that exists to say what is NOT appealable.
  is_a_ground INTEGER NOT NULL DEFAULT 1 CHECK (is_a_ground IN (0, 1))
);

INSERT OR IGNORE INTO appeal_grounds
  (code, name, sequence, definition, evidence_expected, is_a_ground) VALUES
  ('PROCEDURE_NOT_FOLLOWED', 'The procedure was not followed', 1,
   'A published procedure that applied to your case was not followed, and the outcome might have been different if it had been.',
   'Which procedure, which step, and why it could have changed the outcome.', 1),
  ('CONFLICT_OR_BIAS', 'The decision-maker had an interest', 2,
   'Somebody who took or influenced the decision had a personal interest in it, or had already formed a view of you that they should have declared.',
   'The relationship or the prior involvement, and where it touched the decision.', 1),
  ('EVIDENCE_NOT_CONSIDERED', 'Evidence you submitted was not considered', 3,
   'You told the College something material — illness, bereavement, a technical failure, a disability adjustment — through the proper channel, in time, and the decision was taken without it.',
   'What you submitted, when, to whom, and that it is absent from the decision record.', 1),
  ('ERROR_OF_FACT', 'The record contains an error of fact', 4,
   'Something recorded about you is plainly wrong: a mark transcribed incorrectly, a submission recorded as missing that was received, a module credited to the wrong person.',
   'The record, and what it should say.', 1),
  ('ACADEMIC_JUDGEMENT', 'Disagreement with academic judgement is NOT a ground', 9,
   'You may not appeal on the basis that the work deserved a higher mark. Marking is the academic judgement the qualification rests on, and a College that re-marks on request has no standard at all — it has a standard for whoever asks twice. If you believe the MARKING PROCESS went wrong, that is a different thing, and grounds 1 to 4 above are how to say so.',
   'Nothing. This is not a ground, and an appeal resting only on it will be refused with this row quoted as the reason.', 0);

CREATE TABLE IF NOT EXISTS appeals (
  id            TEXT PRIMARY KEY,     -- 'apl_' + uuid
  reference     TEXT NOT NULL UNIQUE, -- 'AP-2027-001'
  user_id       TEXT NOT NULL REFERENCES users(id),

  -- What is being appealed against.
  subject       TEXT NOT NULL CHECK (subject IN
                  ('mark','progression','withdrawal','award','admission','misconduct_finding')),
  subject_ref   TEXT NOT NULL,        -- the id of the thing, in its own table
  decision_at   TEXT NOT NULL,        -- when the decision being appealed was taken

  ground_code   TEXT NOT NULL REFERENCES appeal_grounds(code),
  lodged_at     TEXT NOT NULL,
  statement     TEXT NOT NULL,        -- the learner's own words

  -- Who decided it. NOT the person who took the original decision.
  original_decision_by TEXT REFERENCES users(id),
  decided_by    TEXT REFERENCES users(id),
  decided_at    TEXT,
  outcome       TEXT CHECK (outcome IS NULL OR outcome IN
                  ('upheld','partly_upheld','not_upheld','out_of_time','not_a_ground')),
  reasons       TEXT,

  -- What actually changed as a result. An appeal upheld that changed
  -- nothing is an apology, not a remedy.
  remedy        TEXT,

  -- The learner has to be told, and told when.
  learner_informed_at TEXT,

  -- The document that lets the learner go outside the College. See the
  -- note above: without it, a complainant can be kept inside the
  -- institution's own process for ever.
  completion_of_procedures_at TEXT,
  closed_at     TEXT,

  CHECK (TRIM(statement) <> ''),
  -- The appeal is not heard by the person appealed against.
  CHECK (decided_by IS NULL OR original_decision_by IS NULL OR decided_by <> original_decision_by),
  -- A decision has a decider and a date.
  CHECK ((decided_at IS NULL) = (decided_by IS NULL)),
  CHECK ((outcome IS NULL) = (decided_at IS NULL)),
  -- No outcome without reasons the learner could take further.
  CHECK (outcome IS NULL OR (reasons IS NOT NULL AND TRIM(reasons) <> '')),
  -- An appeal upheld has to say what changed.
  CHECK (outcome IS NULL OR outcome NOT IN ('upheld','partly_upheld')
         OR (remedy IS NOT NULL AND TRIM(remedy) <> '')),
  -- Nothing closes until the learner has been told AND has the document
  -- that lets them go elsewhere.
  CHECK (closed_at IS NULL
         OR (learner_informed_at IS NOT NULL AND completion_of_procedures_at IS NOT NULL)),
  -- One internal appeal per decision.
  UNIQUE (subject, subject_ref)
);

CREATE INDEX IF NOT EXISTS idx_appeals_open
  ON appeals(lodged_at) WHERE closed_at IS NULL;
-- Created last: the probe at the top looks for it.
CREATE INDEX IF NOT EXISTS idx_appeals_learner ON appeals(user_id);
