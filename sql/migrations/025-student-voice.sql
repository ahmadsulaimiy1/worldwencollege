-- Migration 025 — the student voice.
--
-- probe: SELECT 1 FROM sqlite_master WHERE type='index' AND name='idx_feedback_answers_question'
--
-- Last object created by this file — see the ordering note in
-- scripts/migrate.mjs.
--
-- ============================================================
-- WHY THIS EXISTS
-- ============================================================
--
-- Governance A7 listed three metrics the College could not compute at
-- all and ranked student feedback second: "no instrument collects
-- learner opinion". Migration 024 took the first. This takes the second.
--
-- Nothing in the platform has ever asked a learner what they thought.
-- The College can say what a learner did — every quiz attempt, every
-- minute on task, every submission — and nothing at all about whether
-- any of it was any good. An institution that measures only what it can
-- observe learns only what it already believed.
--
-- ============================================================
-- THE DECISION A7 NAMED, AND HOW THIS ANSWERS IT
-- ============================================================
--
-- A7: "needs an instrument and a decision on anonymity. Anonymous
-- feedback is more honest and harder to act on."
--
-- That is a real trade and it is not one decision, it is one per
-- survey: a course evaluation should be anonymous, and a report of a
-- broken video should not, because nobody can fix it without asking
-- which video.
--
-- So anonymity is a PROPERTY OF THE SURVEY, chosen when it is created,
-- and — this is the part that matters — it is STRUCTURALLY ENFORCED.
-- feedback_responses carries the survey's anonymity as a column bound
-- to the survey by a composite foreign key, so a response to an
-- anonymous survey CANNOT hold a user_id and a response to an
-- attributable one cannot omit it.
--
-- A College that promises anonymity and stores identity anyway has done
-- something worse than not asking. Here it is not a policy that could
-- be forgotten in a hurry; the row will not insert.
--
-- ============================================================
-- A SURVEY MUST SAY WHAT IT IS FOR
-- ============================================================
--
-- `purpose` is NOT NULL. A survey that cannot say what will be done
-- with the answers is harvesting opinion, and learners work that out
-- quickly — the second survey gets a worse response rate than the
-- first, and by the fourth the instrument is dead.
--
-- ============================================================
-- AND SOMETHING MUST HAPPEN
-- ============================================================
--
-- feedback_actions is the difference between a feedback instrument and
-- a quality enhancement system. It records what the College changed
-- because of what learners said, or decided not to change and why. The
-- second is as important as the first: "we heard this and here is why
-- we are not acting on it" is an answer; silence is not.
--
-- ============================================================
-- A SMALL ANONYMOUS COHORT IS NOT ANONYMOUS
-- ============================================================
--
-- Three responses to an anonymous survey about one tutor are not three
-- anonymous opinions; the tutor can usually work out who said what.
-- That is a REPORTING rule, not a storage one, and it lives with the
-- rest of the suppression discipline in
-- functions/_lib/reports/institutional.js.
--
-- ============================================================
-- NO RESPONSES, AND NO SURVEYS
-- ============================================================
--
-- Both registers are empty. Nobody has been taught, so nobody has an
-- opinion of the teaching yet. The metric register reports that as
-- insufficient_data and never as a satisfaction score.

CREATE TABLE IF NOT EXISTS feedback_surveys (
  id            TEXT PRIMARY KEY,     -- 'svy_' + uuid
  code          TEXT NOT NULL UNIQUE, -- 'L1-M03-EVAL'
  title         TEXT NOT NULL,

  -- What is being asked about.
  scope         TEXT NOT NULL CHECK (scope IN ('module','level','programme','support','tutor')),
  level_id      INTEGER REFERENCES programme_levels(id),
  unit_id       TEXT REFERENCES units(id),

  -- What will be done with the answers. See the note above.
  purpose       TEXT NOT NULL,

  -- Chosen per survey, and binding on every response to it.
  anonymous     INTEGER NOT NULL CHECK (anonymous IN (0, 1)),

  opens_at      TEXT NOT NULL,
  closes_at     TEXT NOT NULL,

  created_by    TEXT NOT NULL REFERENCES users(id),
  created_at    TEXT NOT NULL,

  -- A module survey is about a module; naming one is not optional.
  CHECK (scope <> 'module' OR unit_id IS NOT NULL),
  CHECK (scope <> 'level'  OR level_id IS NOT NULL),
  -- A window that closes before it opens collects nothing and looks
  -- like it collected nothing because nobody cared.
  CHECK (closes_at > opens_at),
  CHECK (TRIM(purpose) <> ''),

  -- The target of the composite foreign key below. This is what makes
  -- the anonymity promise structural rather than aspirational.
  UNIQUE (id, anonymous)
);

CREATE TABLE IF NOT EXISTS feedback_questions (
  id            TEXT PRIMARY KEY,     -- 'fq_' + uuid
  survey_id     TEXT NOT NULL REFERENCES feedback_surveys(id),
  sequence      INTEGER NOT NULL,
  prompt        TEXT NOT NULL,
  kind          TEXT NOT NULL CHECK (kind IN ('scale','text','choice')),

  -- Scale only, and both ends or neither.
  scale_min     INTEGER,
  scale_max     INTEGER,
  -- Choice only.
  choices_json  TEXT,

  required      INTEGER NOT NULL DEFAULT 0 CHECK (required IN (0, 1)),

  UNIQUE (survey_id, sequence),
  CHECK (kind <> 'scale' OR (scale_min IS NOT NULL AND scale_max IS NOT NULL AND scale_max > scale_min)),
  CHECK (kind = 'scale' OR (scale_min IS NULL AND scale_max IS NULL)),
  CHECK (kind <> 'choice' OR choices_json IS NOT NULL),
  CHECK (kind = 'choice' OR choices_json IS NULL),

  -- The target of the composite foreign key on feedback_answers: an
  -- answer must be shaped like the question it answers.
  UNIQUE (id, kind)
);
CREATE INDEX IF NOT EXISTS idx_feedback_questions_survey ON feedback_questions(survey_id);

CREATE TABLE IF NOT EXISTS feedback_responses (
  id            TEXT PRIMARY KEY,     -- 'fr_' + uuid
  survey_id     TEXT NOT NULL,

  -- Carried from the survey and bound to it. Not a copy that could
  -- drift: the composite foreign key makes the pair unforgeable.
  anonymous     INTEGER NOT NULL CHECK (anonymous IN (0, 1)),

  user_id       TEXT REFERENCES users(id),
  submitted_at  TEXT NOT NULL,

  FOREIGN KEY (survey_id, anonymous) REFERENCES feedback_surveys(id, anonymous),

  -- An anonymous survey cannot know who answered.
  CHECK (anonymous = 0 OR user_id IS NULL),
  -- An attributable one must.
  CHECK (anonymous = 1 OR user_id IS NOT NULL)
);
CREATE INDEX IF NOT EXISTS idx_feedback_responses_survey ON feedback_responses(survey_id);
-- One response per learner per survey — but only where there is a
-- learner to count. A partial index, because an anonymous survey has
-- no identity to deduplicate on and pretending otherwise would be the
-- de-anonymisation this file exists to prevent.
CREATE UNIQUE INDEX IF NOT EXISTS idx_feedback_one_per_learner
  ON feedback_responses(survey_id, user_id) WHERE user_id IS NOT NULL;

CREATE TABLE IF NOT EXISTS feedback_answers (
  id            TEXT PRIMARY KEY,
  response_id   TEXT NOT NULL REFERENCES feedback_responses(id),
  question_id   TEXT NOT NULL,
  question_kind TEXT NOT NULL,

  scale_value   INTEGER,
  text_value    TEXT,
  choice_index  INTEGER,

  FOREIGN KEY (question_id, question_kind) REFERENCES feedback_questions(id, kind),

  UNIQUE (response_id, question_id),

  -- Exactly one answer, of the shape the question asked for.
  CHECK ((scale_value IS NOT NULL) + (text_value IS NOT NULL) + (choice_index IS NOT NULL) = 1),
  CHECK (question_kind <> 'scale'  OR scale_value  IS NOT NULL),
  CHECK (question_kind <> 'text'   OR text_value   IS NOT NULL),
  CHECK (question_kind <> 'choice' OR choice_index IS NOT NULL)
);
CREATE INDEX IF NOT EXISTS idx_feedback_answers_response ON feedback_answers(response_id);

-- What the College did about it. See the note above: the second kind of
-- row — heard and not acted on, with a reason — matters as much as the
-- first.
CREATE TABLE IF NOT EXISTS feedback_actions (
  id            TEXT PRIMARY KEY,
  survey_id     TEXT NOT NULL REFERENCES feedback_surveys(id),
  finding       TEXT NOT NULL,   -- what learners said, in summary
  outcome       TEXT NOT NULL CHECK (outcome IN ('changed','planned','declined','referred')),
  detail        TEXT NOT NULL,   -- what was changed, or why it was not
  decided_by    TEXT NOT NULL REFERENCES users(id),
  decided_at    TEXT NOT NULL,
  -- Where learners can read the answer. A decision nobody told them
  -- about is a decision they will report as being ignored.
  reported_to_learners_at TEXT,

  CHECK (TRIM(detail) <> '')
);
CREATE INDEX IF NOT EXISTS idx_feedback_actions_survey ON feedback_actions(survey_id);
-- Created last: the probe at the top looks for it.
CREATE INDEX IF NOT EXISTS idx_feedback_answers_question ON feedback_answers(question_id);
