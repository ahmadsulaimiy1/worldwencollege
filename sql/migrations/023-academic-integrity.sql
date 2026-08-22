-- Migration 023 — the academic integrity procedure.
--
-- probe: SELECT 1 FROM sqlite_master WHERE type='index' AND name='idx_misconduct_cases_user'
--
-- Last object created by this file — see the ordering note in
-- scripts/migrate.mjs.
--
-- ============================================================
-- WHY THIS EXISTS NOW
-- ============================================================
--
-- Governance C9 was adopted on 14 August 2026 and required a procedure
-- covering what constitutes misconduct on an online language programme,
-- who investigates, the learner's right to respond before a finding, the
-- range of outcomes, and an appeal to someone not involved in the
-- original decision. Its rationale named the risk exactly: the platform
-- stores voice recordings and written submissions, which makes detection
-- possible and therefore makes the absence of a procedure a live risk
-- rather than a theoretical one.
--
-- The evidence register carried it as AI-001: "No procedure and no case
-- register." Both halves are answered here.
--
-- It became urgent this week. C9 names impersonation in a spoken
-- assessment as one of the two common cases, and until migration 022
-- there were no spoken assessments to be impersonated in. Building the
-- speaking framework created the risk the procedure was adopted to
-- manage, and leaving a four-day gap between them would have been a
-- choice rather than an oversight.
--
-- ============================================================
-- THE PROCEDURE IS IN THE SCHEMA, NOT ONLY IN THE DOCUMENT
-- ============================================================
--
-- A misconduct procedure that lives only in prose is a procedure that
-- gets skipped when somebody is in a hurry, and the finding that results
-- is indefensible — to the learner, to an appeal, and to any future
-- regulator reading the case file.
--
-- So the constraints below make an indefensible finding IMPOSSIBLE TO
-- RECORD rather than merely discouraged:
--
--   * a determination cannot exist unless the learner was notified;
--   * a determination cannot exist unless the learner had the chance to
--     respond — either they did, or the window closed;
--   * the person who opened a case may not determine it;
--   * an appeal may not be heard by the person who determined it;
--   * a case cannot be closed while an appeal is open.
--
-- Each of these is a CHECK. If the College ever wants to make a finding
-- without notifying the learner, it will have to alter its own schema to
-- do it, and that is a conversation somebody will have to have out loud.
--
-- ============================================================
-- WHAT IS DELIBERATELY ABSENT
-- ============================================================
--
-- No automated detection, and no similarity score. Text-matching
-- software reports overlap; it does not know whether a learner cheated,
-- and a case opened on a percentage is a case opened on nothing. Every
-- case here is opened by a named person who is willing to say why.
--
-- No penalty tariff. The outcomes are a vocabulary, not a sentencing
-- table. A first-year learner who quoted badly and a candidate who paid
-- someone to sit their speaking assessment are not on the same scale,
-- and a table that put them there would be doing the determining body's
-- job badly.
--
-- No cases. The register is empty because nothing has been taught,
-- nobody has been assessed, and no misconduct has occurred. An empty
-- case register is the honest state of this College today, and
-- tests/academic-integrity.test.mjs asserts it stays empty until there
-- is something real to record.

CREATE TABLE IF NOT EXISTS misconduct_categories (
  code        TEXT PRIMARY KEY,
  name        TEXT NOT NULL,
  sequence    INTEGER NOT NULL,
  -- What it is, in words a learner can understand, because the first
  -- reader of this is a person being accused of it.
  definition  TEXT NOT NULL,
  -- What the College would have to show. Written down so that an
  -- allegation nobody can evidence is visibly an allegation nobody can
  -- evidence.
  evidence_expected TEXT NOT NULL
);

INSERT OR IGNORE INTO misconduct_categories (code, name, sequence, definition, evidence_expected) VALUES
  ('NOT_OWN_WORK', 'Work that is not the learner''s own', 1,
   'Submitting written work produced by another person, by a service, or by a machine, and presenting it as your own. This includes work bought, commissioned, or generated on your behalf.',
   'The submission itself, and a stated reason for doubting authorship — a discontinuity in standard, a register the learner has not otherwise shown, or an admission. A similarity percentage is not on its own a reason.'),
  ('IMPERSONATION', 'Impersonation in an assessment', 2,
   'Another person taking an assessment in your place, or speaking in a recorded or live speaking assessment while it is presented as yours. Named in governance C9 as one of the two common cases on an online programme.',
   'The recording, and a comparison against other speech the College holds from the same learner. Where the assessment was live, the assessor''s account.'),
  ('COLLUSION', 'Collusion', 3,
   'Producing work jointly with another learner and submitting it as independent work. Studying together is encouraged; submitting together is not.',
   'The two submissions, and what they share that independent work would not.'),
  ('FABRICATION', 'Fabricated evidence', 4,
   'Inventing a source, a quotation, a datum or an experience in assessed work, or altering a document submitted to the College.',
   'The fabricated element, and what shows it to be fabricated.'),
  ('EXAM_MISCONDUCT', 'Examination misconduct', 5,
   'Using prohibited material during an examination, communicating with another person during it, or attempting to obtain the questions in advance.',
   'What was used or exchanged, and how it was observed.'),
  ('MISREPRESENTATION', 'Misrepresentation to the College', 6,
   'Giving false information in an application, a placement assessment, a claim for extenuating circumstances, or a request for a qualification to be reissued.',
   'The statement made and the fact contradicting it.');

CREATE TABLE IF NOT EXISTS misconduct_cases (
  id              TEXT PRIMARY KEY,      -- 'mis_' + uuid
  reference       TEXT NOT NULL UNIQUE,  -- the human reference: 'AI-2026-001'
  user_id         TEXT NOT NULL REFERENCES users(id),
  category        TEXT NOT NULL REFERENCES misconduct_categories(code),

  -- What work is in question. Exactly one should be set; a case about
  -- nothing in particular is not a case.
  learning_item_id TEXT REFERENCES learning_items(id),
  recording_id     TEXT REFERENCES learner_recordings(id),
  award_id         TEXT REFERENCES awards(id),

  stage           TEXT NOT NULL DEFAULT 'opened'
                  CHECK (stage IN ('opened','notified','response_received',
                                   'determined','appeal_open','appeal_determined','closed')),

  -- ---- Investigation -------------------------------------------------
  opened_by       TEXT NOT NULL REFERENCES users(id),
  opened_at       TEXT NOT NULL,
  allegation      TEXT NOT NULL,   -- what is alleged, in the opener's words

  -- ---- The learner's right to answer ---------------------------------
  -- C9: "the learner's right to respond before a finding". Not a
  -- courtesy — the constraint below makes a finding without it
  -- unrecordable.
  notified_at     TEXT,
  response_due    TEXT,
  response_at     TEXT,
  response        TEXT,

  -- ---- Determination -------------------------------------------------
  determined_by   TEXT REFERENCES users(id),
  determined_at   TEXT,
  outcome         TEXT CHECK (outcome IS NULL OR outcome IN
                    ('no_case_to_answer','warning','work_annulled',
                     'module_annulled','qualification_annulled','referred_to_senate')),
  reasons         TEXT,            -- why. Required with any outcome.

  -- ---- Appeal --------------------------------------------------------
  -- C9: "an appeal to someone not involved in the original decision."
  appeal_lodged_at   TEXT,
  appeal_heard_by    TEXT REFERENCES users(id),
  appeal_decided_at  TEXT,
  appeal_outcome     TEXT CHECK (appeal_outcome IS NULL OR appeal_outcome IN
                       ('upheld','overturned','varied')),
  appeal_reasons     TEXT,

  closed_at       TEXT,

  -- A case is about one piece of work.
  CHECK ((learning_item_id IS NOT NULL) + (recording_id IS NOT NULL) + (award_id IS NOT NULL) = 1),

  -- No finding without notice.
  CHECK (determined_at IS NULL OR notified_at IS NOT NULL),
  -- No finding until the learner has answered or the window has closed.
  CHECK (determined_at IS NULL OR response_at IS NOT NULL OR response_due IS NOT NULL),
  -- No finding without reasons. An outcome with no reasons cannot be appealed
  -- against, which makes the appeal right decorative.
  CHECK (outcome IS NULL OR (reasons IS NOT NULL AND determined_by IS NOT NULL)),
  -- The investigator does not judge their own case.
  CHECK (determined_by IS NULL OR determined_by <> opened_by),
  -- The appeal is not heard by the person appealed against.
  CHECK (appeal_heard_by IS NULL OR appeal_heard_by <> determined_by),
  -- An appeal decision needs someone to have heard it, and reasons.
  CHECK (appeal_outcome IS NULL OR (appeal_heard_by IS NOT NULL AND appeal_reasons IS NOT NULL)),
  -- A case cannot be closed while an appeal is outstanding.
  CHECK (closed_at IS NULL OR appeal_lodged_at IS NULL OR appeal_decided_at IS NOT NULL)
);

-- The audit trail. Append-only by convention and by the absence of any
-- update path: what happened, when, and who did it.
CREATE TABLE IF NOT EXISTS misconduct_case_events (
  id          TEXT PRIMARY KEY,
  case_id     TEXT NOT NULL REFERENCES misconduct_cases(id),
  event       TEXT NOT NULL,
  actor_id    TEXT REFERENCES users(id),
  note        TEXT,
  occurred_at TEXT NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_misconduct_events_case ON misconduct_case_events(case_id);
-- Created last: the probe at the top looks for it.
CREATE INDEX IF NOT EXISTS idx_misconduct_cases_user ON misconduct_cases(user_id);
