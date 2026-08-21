-- ─────────────────────────────────────────────────────────────────────
-- THE LEVEL I COMPETENCY MAPPING AND LEARNING OUTCOMES
--
-- Made under authority delegated to WEC Press in the absence of
-- appointed members of the Board of Academic Standards and Curriculum
-- Excellence. Every row carries status 'interim', not 'approved':
-- BASCE exists as a body with members_appointed = 0, and a mapping
-- cannot be approved by a board that has no members. When members are
-- appointed, these rows are what they review — the work is done and
-- the claim about who approved it stays true.
--
-- ── WHAT IS BEING DECIDED ────────────────────────────────────────────
--
-- Six institutional competencies already existed: Clarity, Command,
-- Judgement, Reason, Bearing, Reach. Nought of Level I's twenty
-- assessments were mapped to any of them, which meant the award rested
-- on twenty marks and no statement of what they were marks IN.
--
-- Two decisions govern the mapping.
--
-- FIRST: weight records how much of an assessment bears on a
-- competency, and the weights for one assessment sum to 1.0. A quiz
-- that tests form is not 30% Judgement because judgement is desirable;
-- it is Command, almost entirely, with a little Clarity where the
-- question asks the learner to choose between two correct forms for a
-- context.
--
-- SECOND, and this is the one an examiner will challenge: REASON and
-- BEARING ARE BARELY PRESENT AT LEVEL I, AND THAT IS CORRECT. A learner
-- with three hundred words of English cannot construct an argument or
-- hold a difficult meeting, and mapping Level I tasks to those
-- competencies to make the grid look complete would be the exact
-- padding the Permanent Academic Rule forbids. Reason appears once, at
-- the mock exam, where a learner selects the right structure for an
-- unseen context — the first genuine act of linguistic judgement the
-- level asks for. Bearing does not appear at all. The framework is
-- six competencies across six levels, not six competencies per level,
-- and a level that cannot evidence a competency should say so.
--
-- ── WHAT IS NOT BEING DECIDED HERE ───────────────────────────────────
--
-- No pass threshold. Turning competency marks into a level result is a
-- decision about consequences for real candidates and it needs real
-- candidates to calibrate against. The skill descriptor thresholds stay
-- NULL for the same reason.
--
-- No claim of external validation. No accreditation, no external
-- examiner, no benchmarking against another institution's framework.
-- ─────────────────────────────────────────────────────────────────────

-- ── The mapping ──────────────────────────────────────────────────────

INSERT INTO assessment_competencies
  (learning_item_id, competency_id, weight, status, authority, rationale, decided_on) VALUES

-- Module 1 · Meeting People
('itm_l1_m1_quiz', 'cmp_command', 0.8, 'interim', 'BASCE',
 'Ten items on the verb "to be", subject pronouns and question formation. This is control of form and nothing else.', '2026-08-06'),
('itm_l1_m1_quiz', 'cmp_clarity', 0.2, 'interim', 'BASCE',
 'Two items require choosing the greeting that fits the time of day and the relationship, which is a first, small act of being understood by the person actually present.', '2026-08-06'),
('itm_l1_m1_assignment', 'cmp_clarity', 0.6, 'interim', 'BASCE',
 'A spoken self-introduction to a listener. The criterion that matters is whether the listener got the name and the country, not whether the grammar was perfect.', '2026-08-06'),
('itm_l1_m1_assignment', 'cmp_command', 0.4, 'interim', 'BASCE',
 'The rubric marks accurate use of "I am" and "my name is", so control of form carries real weight alongside being understood.', '2026-08-06'),

-- Module 2 · Everyday Objects & Places
('itm_l1_m2_quiz', 'cmp_command', 1.0, 'interim', 'BASCE',
 'There is/there are agreement, demonstratives, articles and plural -s. Entirely a test of form.', '2026-08-06'),
('itm_l1_m2_assignment', 'cmp_clarity', 0.55, 'interim', 'BASCE',
 'A description a reader must be able to picture. The test of the piece is whether the room can be drawn from it.', '2026-08-06'),
('itm_l1_m2_assignment', 'cmp_command', 0.45, 'interim', 'BASCE',
 'Singular and plural agreement across a sustained description is where this structure actually breaks.', '2026-08-06'),

-- Module 3 · Family & Routines
('itm_l1_m3_quiz', 'cmp_command', 1.0, 'interim', 'BASCE',
 'Present simple with third-person -s, and telling the time. Form throughout.', '2026-08-06'),
('itm_l1_m3_assignment', 'cmp_clarity', 0.5, 'interim', 'BASCE',
 'A day narrated in order, with sequence markers. A reader who cannot follow the order has not been communicated with, whatever the grammar did.', '2026-08-06'),
('itm_l1_m3_assignment', 'cmp_command', 0.5, 'interim', 'BASCE',
 'The third-person -s across a sustained piece is the level''s single most persistent error and the rubric weights it accordingly.', '2026-08-06'),

-- Module 4 · Food & Shopping
('itm_l1_m4_quiz', 'cmp_command', 1.0, 'interim', 'BASCE',
 'Countable and uncountable nouns with some/any. A distinction that is arbitrary in English and must be controlled rather than reasoned.', '2026-08-06'),
('itm_l1_m4_assignment', 'cmp_judgement', 0.4, 'interim', 'BASCE',
 'A shop roleplay in which the learner must choose a polite request form. "I want three apples" is grammatical and wrong for the setting, and the rubric penalises it — the first assessment in the programme where register carries marks.', '2026-08-06'),
('itm_l1_m4_assignment', 'cmp_clarity', 0.35, 'interim', 'BASCE',
 'The transaction has to succeed: the shopkeeper must know what is wanted and what it costs.', '2026-08-06'),
('itm_l1_m4_assignment', 'cmp_command', 0.25, 'interim', 'BASCE',
 'How much is against how much are, and number agreement in prices.', '2026-08-06'),

-- Module 5 · Around Town
('itm_l1_m5_quiz', 'cmp_command', 1.0, 'interim', 'BASCE',
 'Prepositions of place and the imperative. Form.', '2026-08-06'),
('itm_l1_m5_assignment', 'cmp_clarity', 0.7, 'interim', 'BASCE',
 'Directing a visitor is the purest clarity task in the level: the listener either arrives or does not, and no other criterion can rescue directions that do not work.', '2026-08-06'),
('itm_l1_m5_assignment', 'cmp_command', 0.3, 'interim', 'BASCE',
 'Imperative form without a subject pronoun, and accurate prepositions.', '2026-08-06'),

-- Module 6 · Describing People & Things
('itm_l1_m6_quiz', 'cmp_command', 1.0, 'interim', 'BASCE',
 'Possessive adjectives and pronouns, adjective order. Form.', '2026-08-06'),
('itm_l1_m6_assignment', 'cmp_clarity', 0.5, 'interim', 'BASCE',
 'A description precise enough to identify one person. The test is whether a stranger could pick them out.', '2026-08-06'),
('itm_l1_m6_assignment', 'cmp_command', 0.3, 'interim', 'BASCE',
 'The is/has split for qualities against features, and adjective order.', '2026-08-06'),
('itm_l1_m6_assignment', 'cmp_judgement', 0.2, 'interim', 'BASCE',
 'The task requires describing a real person respectfully. Choosing what not to say about someone''s appearance is a judgement, and the rubric marks it.', '2026-08-06'),

-- Module 7 · Past Experiences
('itm_l1_m7_quiz', 'cmp_command', 1.0, 'interim', 'BASCE',
 'Regular and irregular simple past, negatives and questions. Form.', '2026-08-06'),
('itm_l1_m7_assignment', 'cmp_clarity', 0.5, 'interim', 'BASCE',
 'A holiday narrated so a reader can follow what happened in what order.', '2026-08-06'),
('itm_l1_m7_assignment', 'cmp_command', 0.5, 'interim', 'BASCE',
 'Sustained past tense across a narrative, where the base verb after didn''t and the irregular forms both fail under load.', '2026-08-06'),

-- Module 8 · Plans & Abilities
('itm_l1_m8_quiz', 'cmp_command', 1.0, 'interim', 'BASCE',
 'can/can''t and going to, and the contrast between them. Form.', '2026-08-06'),
('itm_l1_m8_assignment', 'cmp_clarity', 0.55, 'interim', 'BASCE',
 'Plans stated so a listener knows what will happen and when.', '2026-08-06'),
('itm_l1_m8_assignment', 'cmp_command', 0.45, 'interim', 'BASCE',
 'The going-to structure with the base verb, and the invariant modal.', '2026-08-06'),

-- Module 9 · Health & Feelings
('itm_l1_m9_quiz', 'cmp_command', 1.0, 'interim', 'BASCE',
 'have/has for illness, feel + adjective, and should/shouldn''t. Form.', '2026-08-06'),
('itm_l1_m9_assignment', 'cmp_clarity', 0.4, 'interim', 'BASCE',
 'A doctor roleplay in which the problem must be conveyed accurately. A misdescribed symptom is a communication failure with consequences, which is why this task exists at Level I at all.', '2026-08-06'),
('itm_l1_m9_assignment', 'cmp_judgement', 0.35, 'interim', 'BASCE',
 'Advice must fit the problem and be offered rather than ordered. "You should see a doctor" and "See a doctor" differ in a way the rubric marks.', '2026-08-06'),
('itm_l1_m9_assignment', 'cmp_command', 0.25, 'interim', 'BASCE',
 'The have/feel split, and should plus the base verb.', '2026-08-06'),

-- Module 10 · The Foundation-Level Mock Examination
('itm_l1_m10_examquiz', 'cmp_command', 0.75, 'interim', 'BASCE',
 'Grammar and vocabulary drawn from all nine modules. Predominantly form, as an examination of this kind should be.', '2026-08-06'),
('itm_l1_m10_examquiz', 'cmp_reason', 0.25, 'interim', 'BASCE',
 'The structure-selection items give an unseen real-use context and require the learner to choose which of nine modules'' grammar it calls for. That is the first genuine act of reasoning about language the level asks for, and it is the ONLY place Reason is assessed at Level I.', '2026-08-06'),
('itm_l1_m10_examassignment', 'cmp_clarity', 0.4, 'interim', 'BASCE',
 'Sustained speaking and writing on an unseen prompt, judged first on whether the examiner understood it.', '2026-08-06'),
('itm_l1_m10_examassignment', 'cmp_command', 0.35, 'interim', 'BASCE',
 'Accuracy across the whole level''s grammar under examination conditions.', '2026-08-06'),
('itm_l1_m10_examassignment', 'cmp_judgement', 0.25, 'interim', 'BASCE',
 'The prompt names an audience, and the register has to fit it. A learner who addresses an examiner as a friend has made a judgement error, not a grammar error.', '2026-08-06');


-- ── Level outcomes ───────────────────────────────────────────────────
--
-- Four. Not six, and not five.
--
-- There is no Bearing outcome: nothing at Level I holds a room, and
-- there never was a candidate task for one.
--
-- There is no Reach outcome either, and that one had to be withdrawn
-- after it was written. The first draft claimed Reach — "communicates
-- across the distance between expert and layperson" — on the strength
-- of three tasks: directing a visitor, describing a room a reader must
-- picture, conveying a symptom to someone who has to act. They are good
-- tasks and they are all CLARITY, which is where the mapping above
-- assigns them. An outcome whose competency no assessment is mapped to
-- is exactly the claim-nothing-tests failure this table exists to
-- prevent, and it does not become true because the tasks underneath it
-- are real. Level I evidences four of the six competencies.

INSERT INTO learning_outcomes
  (id, scope, level_roman, unit_id, code, sequence, statement, competency_id,
   status, authority, decided_on) VALUES
('lo_l1_1', 'level', 'I', NULL, 'IEFC-I-LO1', 1,
 'Exchange personal information, needs and simple plans with a cooperative speaker, and be understood the first time on familiar everyday topics.',
 'cmp_clarity', 'interim', 'BASCE', '2026-08-06'),
('lo_l1_2', 'level', 'I', NULL, 'IEFC-I-LO2', 2,
 'Use the present simple, the simple past, there is/are, countable and uncountable nouns, possessives, modals of ability and going to, with the accuracy required for a listener to follow without repair.',
 'cmp_command', 'interim', 'BASCE', '2026-08-06'),
('lo_l1_3', 'level', 'I', NULL, 'IEFC-I-LO3', 3,
 'Choose between a polite and a direct form according to the setting and the person addressed, in transactions, requests and advice.',
 'cmp_judgement', 'interim', 'BASCE', '2026-08-06'),
('lo_l1_4', 'level', 'I', NULL, 'IEFC-I-LO4', 4,
 'Select the grammatical structure a described real-life situation requires, from the range taught across the level, without being told which one applies.',
 'cmp_reason', 'interim', 'BASCE', '2026-08-06');

-- ── What evidences each outcome ──────────────────────────────────────

INSERT INTO learning_outcome_evidence (outcome_id, learning_item_id, shows) VALUES
('lo_l1_1', 'itm_l1_m1_assignment', 'A spoken self-introduction judged on whether the listener received the name and country.'),
('lo_l1_1', 'itm_l1_m3_assignment', 'A daily routine a reader can follow in sequence.'),
('lo_l1_1', 'itm_l1_m7_assignment', 'A past experience narrated so a reader can follow what happened.'),
('lo_l1_1', 'itm_l1_m8_assignment', 'Plans stated so a listener knows what will happen and when.'),
('lo_l1_1', 'itm_l1_m10_examassignment', 'Sustained speaking and writing on an unseen prompt under examination conditions.'),

('lo_l1_2', 'itm_l1_m2_quiz', 'There is/are agreement, demonstratives and plurals.'),
('lo_l1_2', 'itm_l1_m3_quiz', 'Present simple with third-person -s.'),
('lo_l1_2', 'itm_l1_m4_quiz', 'Countable and uncountable nouns with some and any.'),
('lo_l1_2', 'itm_l1_m6_quiz', 'Possessive adjectives and pronouns, adjective order.'),
('lo_l1_2', 'itm_l1_m7_quiz', 'Regular and irregular simple past, negatives and questions.'),
('lo_l1_2', 'itm_l1_m8_quiz', 'Modals of ability and the going-to future.'),
('lo_l1_2', 'itm_l1_m10_examquiz', 'The whole level''s grammar under examination conditions.'),

('lo_l1_3', 'itm_l1_m4_assignment', 'A purchase request in a shop, where a grammatical but blunt form loses marks.'),
('lo_l1_3', 'itm_l1_m6_assignment', 'Describing a real person, where what is not said is part of the task.'),
('lo_l1_3', 'itm_l1_m9_assignment', 'Advice offered rather than ordered, fitted to the problem.'),
('lo_l1_3', 'itm_l1_m10_examassignment', 'A prompt that names its audience, requiring the register to fit it.'),

('lo_l1_4', 'itm_l1_m10_examquiz', 'Structure-selection items giving an unseen context and requiring the learner to identify which of nine modules'' grammar it calls for.'),

-- The three tasks that were briefly a Reach outcome, recorded against
-- Clarity where the mapping actually places them.
('lo_l1_1', 'itm_l1_m5_assignment', 'Directions a visitor must be able to act on — the listener either arrives or does not.'),
('lo_l1_1', 'itm_l1_m2_assignment', 'A room description precise enough for a reader to draw.'),
('lo_l1_1', 'itm_l1_m9_assignment', 'A symptom conveyed accurately to someone who must act on it.');
