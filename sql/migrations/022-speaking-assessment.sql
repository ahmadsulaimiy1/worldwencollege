-- Migration 022 — the speaking assessment framework.
--
-- probe: SELECT 1 FROM sqlite_master WHERE type='index' AND name='idx_speaking_criteria_level'
--
-- Last object created by this file — see the ordering note in
-- scripts/migrate.mjs.
--
-- ============================================================
-- THE GAP THIS CLOSES
-- ============================================================
--
-- The College examines writing and comprehension. It has never once
-- heard a learner speak.
--
-- Sixty rubric-graded assignments, nine hundred quiz questions, six
-- examinations — and a candidate could hold the Worldwide English
-- Proficiency Certificate, the College's highest qualification in
-- English COMMUNICATION, without any person having listened to them say
-- a sentence. Every qualification descriptor claims spoken capability.
-- Not one of them evidenced it.
--
-- The gap was found by a commercial paper rather than an academic
-- review, which is worth recording: the Finance Committee, asked why a
-- premium price was not defensible, answered that the College sells
-- almost no human contact — and the missing contact turned out to be
-- missing assessment.
--
-- ============================================================
-- ONE STANDARD, TWO METHODS
-- ============================================================
--
-- The Board's direction is that a WEPC is a WEPC however it was taught.
-- So the criteria, the bands and the pass standard below are single and
-- shared. What differs is capture:
--
--   ASYNCHRONOUS. The candidate records against a released prompt and a
--   marker assesses the recording. Buildable today: learner_recordings
--   already carries media, duration, attempt, retention and a sha256,
--   and the recording upload path is tested end to end.
--
--   LIVE. The candidate speaks with an assessor in real time. Richer,
--   and the only way to assess genuine unrehearsed interaction — which
--   is why the INTERACTION criterion is capped for asynchronous capture
--   rather than pretended (see speaking_criteria.async_ceiling).
--
-- The method is recorded against the attempt, not against the
-- qualification, and it never appears on the certificate.
--
-- ============================================================
-- WHAT IS DELIBERATELY ABSENT
-- ============================================================
--
-- No automated scoring. Speech recognition can measure pronunciation
-- against a model; it cannot judge whether a candidate answered the
-- question. A framework that graded speaking by machine would be
-- claiming an academic judgement no machine has made.
--
-- No pass mark that a candidate can reach while unintelligible.
-- INTELLIGIBILITY carries a floor of its own, for the same reason the
-- examination has a per-criterion floor: a candidate who cannot be
-- understood has not demonstrated spoken English, whatever else they did
-- well.
--
-- Nothing is scheduled, delivered or conferred by this migration. It
-- defines the framework. tests/speaking-assessment.test.mjs holds it to
-- the qualification descriptors it must serve.

CREATE TABLE IF NOT EXISTS speaking_criteria (
  id            TEXT PRIMARY KEY,
  level_id      INTEGER NOT NULL REFERENCES programme_levels(id),
  code          TEXT NOT NULL,
  name          TEXT NOT NULL,
  sequence      INTEGER NOT NULL,
  -- What this criterion looks like AT THIS STAGE. The criteria are
  -- constant across the framework so a reader can compare a Foundation
  -- candidate with a Mastery one on the same five dimensions; the
  -- descriptors are what rise.
  descriptor    TEXT NOT NULL,
  -- The highest band this criterion can honestly reach when the
  -- candidate is recorded rather than met.
  --
  -- Asynchronous capture cannot assess genuine interaction: a candidate
  -- speaking to a prompt is not taking a turn, cannot be interrupted,
  -- and has nothing to respond to that they did not already read. The
  -- College's options were to pretend otherwise, to drop the criterion,
  -- or to say plainly that this method reaches PROFICIENT and no
  -- further. It says so.
  --
  -- NULL means no ceiling: the criterion is fully assessable either way.
  -- A candidate assessed asynchronously is told this before they begin.
  async_ceiling TEXT REFERENCES skill_descriptors(code),
  UNIQUE (level_id, code)
);

CREATE TABLE IF NOT EXISTS speaking_assessments (
  id                  TEXT PRIMARY KEY,
  level_id            INTEGER NOT NULL REFERENCES programme_levels(id),
  occasion            TEXT NOT NULL CHECK (occasion IN ('midpoint','final')),
  title               TEXT NOT NULL,
  task                TEXT NOT NULL,
  -- Preparation is zero at Foundation on purpose: at A1 the assessment
  -- is of speech, not of memory, so the prompts are seen in advance and
  -- there is nothing to prepare in the room.
  preparation_minutes INTEGER NOT NULL,
  response_minutes    INTEGER NOT NULL,
  is_summative        INTEGER NOT NULL CHECK (is_summative IN (0,1)),
  -- Percentage of the qualification's final assessment. The midpoint
  -- carries none: it exists to tell a learner where they stand while
  -- there is still time to act on it.
  weight_percent      INTEGER NOT NULL,
  UNIQUE (level_id, occasion)
);

INSERT OR IGNORE INTO speaking_criteria
  (id, level_id, code, name, sequence, descriptor, async_ceiling) VALUES
  ('spc_1_intelligibility', 1, 'INTELLIGIBILITY', 'Intelligibility', 1, 'Understood by a sympathetic listener used to non-native speech, in familiar topics, with repetition available.', NULL),
  ('spc_1_fluency', 1, 'FLUENCY', 'Fluency', 2, 'Speaks in short phrases with frequent pausing. Pausing to search for a word is expected at this stage and is not penalised.', NULL),
  ('spc_1_range', 1, 'RANGE', 'Range', 3, 'Deploys the present and simple past, everyday nouns and the module vocabulary. Errors are frequent and do not obscure meaning.', NULL),
  ('spc_1_interaction', 1, 'INTERACTION', 'Interaction', 4, 'Answers direct questions and asks simple ones. May need a question repeated.', 'PROFICIENT'),
  ('spc_1_appropriacy', 1, 'APPROPRIACY', 'Appropriacy', 5, 'Distinguishes a greeting from a request. Politeness is formulaic and that is correct at A1.', NULL),
  ('spc_2_intelligibility', 2, 'INTELLIGIBILITY', 'Intelligibility', 1, 'Understood by a listener not used to non-native speech, in familiar topics.', NULL),
  ('spc_2_fluency', 2, 'FLUENCY', 'Fluency', 2, 'Sustains a short account with pausing at clause boundaries rather than mid-phrase.', NULL),
  ('spc_2_range', 2, 'RANGE', 'Range', 3, 'Narrates in past, present and future. Reaches for the right word and often finds it.', NULL),
  ('spc_2_interaction', 2, 'INTERACTION', 'Interaction', 4, 'Sustains a routine exchange, responds to a follow-up, and can ask for clarification.', 'PROFICIENT'),
  ('spc_2_appropriacy', 2, 'APPROPRIACY', 'Appropriacy', 5, 'Adjusts between a friend and a stranger. Can invite, refuse and apologise without giving offence.', NULL),
  ('spc_3_intelligibility', 3, 'INTELLIGIBILITY', 'Intelligibility', 1, 'Understood without strain across familiar and some unfamiliar topics. Stress and rhythm carry meaning rather than obscuring it.', NULL),
  ('spc_3_fluency', 3, 'FLUENCY', 'Fluency', 2, 'Speaks at length on a prepared topic and copes with an unprepared one, with self-repair rather than collapse.', NULL),
  ('spc_3_range', 3, 'RANGE', 'Range', 3, 'Gives structured opinion with a reason and an example. Vocabulary begins to be chosen rather than retrieved.', NULL),
  ('spc_3_interaction', 3, 'INTERACTION', 'Interaction', 4, 'Manages the conversation: follows up, disagrees, and asks the clarifying question that keeps it moving.', 'PROFICIENT'),
  ('spc_3_appropriacy', 3, 'APPROPRIACY', 'Appropriacy', 5, 'Moves between spoken and more formal registers deliberately, if not yet precisely.', NULL),
  ('spc_4_intelligibility', 4, 'INTELLIGIBILITY', 'Intelligibility', 1, 'Understood without strain on abstract topics. Pronunciation does not draw attention to itself.', NULL),
  ('spc_4_fluency', 4, 'FLUENCY', 'Fluency', 2, 'Sustains extended argument with the fluency that lets a listener attend to the content rather than the delivery.', NULL),
  ('spc_4_range', 4, 'RANGE', 'Range', 3, 'Weighs advantage against disadvantage, supports a claim with evidence, and controls the language of comparison and concession.', NULL),
  ('spc_4_interaction', 4, 'INTERACTION', 'Interaction', 4, 'Holds a position under challenge, concedes a point without losing the argument, and can chair a short discussion.', 'PROFICIENT'),
  ('spc_4_appropriacy', 4, 'APPROPRIACY', 'Appropriacy', 5, 'Speaks as a representative — to a client, an interviewer, a meeting — and sounds like one.', NULL),
  ('spc_5_intelligibility', 5, 'INTELLIGIBILITY', 'Intelligibility', 1, 'Fully intelligible including at speed and under interruption.', NULL),
  ('spc_5_fluency', 5, 'FLUENCY', 'Fluency', 2, 'Spontaneous, with little obvious searching. Hesitation is rhetorical rather than lexical.', NULL),
  ('spc_5_range', 5, 'RANGE', 'Range', 3, 'Controls nuance, implication and idiom. Chooses between near-synonyms for effect.', NULL),
  ('spc_5_interaction', 5, 'INTERACTION', 'Interaction', 4, 'Leads a discussion or negotiation to an outcome, manages disagreement, and reads what is not said.', 'PROFICIENT'),
  ('spc_5_appropriacy', 5, 'APPROPRIACY', 'Appropriacy', 5, 'Adjusts register mid-utterance for a mixed audience, deliberately and without visible effort.', NULL),
  ('spc_6_intelligibility', 6, 'INTELLIGIBILITY', 'Intelligibility', 1, 'Fully intelligible in any register, accent-neutral in the sense that accent never impedes.', NULL),
  ('spc_6_fluency', 6, 'FLUENCY', 'Fluency', 2, 'Indistinguishable from a highly educated speaker in ease and precision.', NULL),
  ('spc_6_range', 6, 'RANGE', 'Range', 3, 'Differentiates finer shades of meaning in complex situations; explains the language as a system, not only uses it.', NULL),
  ('spc_6_interaction', 6, 'INTERACTION', 'Interaction', 4, 'Represents an organisation at senior level; mentors another speaker; handles the hostile question.', 'PROFICIENT'),
  ('spc_6_appropriacy', 6, 'APPROPRIACY', 'Appropriacy', 5, 'Judges what a situation requires before speaking, including when not to.', NULL);

INSERT OR IGNORE INTO speaking_assessments
  (id, level_id, occasion, title, task, preparation_minutes, response_minutes, is_summative, weight_percent) VALUES
  ('spa_1_mid', 1, 'midpoint', 'A short guided exchange (formative)', 'Two everyday situations drawn from the modules studied — an introduction and a transaction. Prompts are seen in advance, because at A1 the assessment is of speech, not of memory.', 0, 4, 0, 0),
  ('spa_1_final', 1, 'final', 'A short guided exchange', 'Two everyday situations drawn from the modules studied — an introduction and a transaction. Prompts are seen in advance, because at A1 the assessment is of speech, not of memory.', 0, 4, 1, 20),
  ('spa_2_mid', 2, 'midpoint', 'An account and an exchange (formative)', 'Recount an event, then handle an unprepared follow-up. The follow-up is unseen.', 5, 5, 0, 0),
  ('spa_2_final', 2, 'final', 'An account and an exchange', 'Recount an event, then handle an unprepared follow-up. The follow-up is unseen.', 5, 5, 1, 20),
  ('spa_3_mid', 3, 'midpoint', 'An opinion, defended (formative)', 'State a position on a prepared topic, then answer two unseen challenges to it.', 10, 7, 0, 0),
  ('spa_3_final', 3, 'final', 'An opinion, defended', 'State a position on a prepared topic, then answer two unseen challenges to it.', 10, 7, 1, 20),
  ('spa_4_mid', 4, 'midpoint', 'A structured argument (formative)', 'Present a case for four minutes, then defend it under questioning. Preparation is fifteen minutes with notes permitted.', 15, 10, 0, 0),
  ('spa_4_final', 4, 'final', 'A structured argument', 'Present a case for four minutes, then defend it under questioning. Preparation is fifteen minutes with notes permitted.', 15, 10, 1, 20),
  ('spa_5_mid', 5, 'midpoint', 'A discussion led to an outcome (formative)', 'Take a discussion on an unfamiliar complex topic to a stated conclusion, managing disagreement.', 15, 12, 0, 0),
  ('spa_5_final', 5, 'final', 'A discussion led to an outcome', 'Take a discussion on an unfamiliar complex topic to a stated conclusion, managing disagreement.', 15, 12, 1, 20),
  ('spa_6_mid', 6, 'midpoint', 'A capstone address and defence (formative)', 'Speak for six minutes on a subject of the candidate''s choosing at professional standard, then defend it against expert questioning.', 20, 15, 0, 0),
  ('spa_6_final', 6, 'final', 'A capstone address and defence', 'Speak for six minutes on a subject of the candidate''s choosing at professional standard, then defend it against expert questioning.', 20, 15, 1, 20);

-- Created last: the probe at the top looks for it.
CREATE INDEX IF NOT EXISTS idx_speaking_criteria_level ON speaking_criteria(level_id);
