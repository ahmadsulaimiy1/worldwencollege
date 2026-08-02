-- WEC-LC — Audio curriculum seed: Level I (Foundation, A1).
--
-- Adds the listening and pronunciation strands the authored lessons
-- have always specified but the platform previously had nowhere to
-- hold (see docs/curriculum-programme-review.md, Finding 1, and
-- docs/lms-architecture.md § The audio layer).
--
-- WHAT IS REAL HERE AND WHAT IS NOT. The scripts, the cue
-- segmentation, the speaker attribution, the comprehension questions
-- and the pronunciation targets are authored curriculum and are
-- complete. The RECORDINGS are not: every audio_assets row below has a
-- NULL media_url and its cues have NULL timings, because recording
-- them is a studio task with real voice talent that has not happened.
-- That is deliberately visible in the data rather than papered over
-- with placeholder URLs — getAudioAsset() reports isRecorded false and
-- isSynchronised false, and the interface degrades to a readable
-- script. Nothing here pretends audio exists.
--
-- Delivery speeds (target_wpm) are set at 90-110 for A1, well below
-- natural conversational pace (~150), and rise across later levels.
--
-- Apply after schema.sql and seed-curriculum-level-1.sql.

-- Re-sequence so the audio strand sits between the lessons and the
-- assessments, which is the order the lessons themselves assume:
-- present -> practise -> listen -> pronounce -> test.
UPDATE learning_items SET sequence = 6 WHERE id LIKE 'itm_l1_m%_quiz';
UPDATE learning_items SET sequence = 7 WHERE id LIKE 'itm_l1_m%_assignment';
UPDATE learning_items SET sequence = 5 WHERE id = 'itm_l1_m10_examquiz';
UPDATE learning_items SET sequence = 6 WHERE id = 'itm_l1_m10_examassignment';

-- ---------------------------------------------------------------------
-- Module 1: Meeting People
-- ---------------------------------------------------------------------
INSERT INTO audio_assets (id, kind, title, transcript, variety, speaker_count, target_wpm) VALUES
('aud_l1_m1_listen', 'listening', 'At the Language School Reception',
'Good morning. Welcome to the school. | Good morning. My name is Sofia Rossi. | Nice to meet you, Sofia. Where are you from? | I''m from Italy. I live in Rome. | And how do you spell your family name? | R-O-S-S-I. | Thank you. Your class is in room four.', 'BrE', 2, 90),
('aud_l1_m1_pron', 'model_pronunciation', 'Module 1 Pronunciation Model',
'Hello. | How are you? | I''m from Japan. | I''m from China. | Where are you from?', 'BrE', 1, 80);

INSERT INTO audio_cues (id, audio_asset_id, sequence, speaker, text) VALUES
('cue_l1_m1_1', 'aud_l1_m1_listen', 1, 'Receptionist', 'Good morning. Welcome to the school.'),
('cue_l1_m1_2', 'aud_l1_m1_listen', 2, 'Sofia', 'Good morning. My name is Sofia Rossi.'),
('cue_l1_m1_3', 'aud_l1_m1_listen', 3, 'Receptionist', 'Nice to meet you, Sofia. Where are you from?'),
('cue_l1_m1_4', 'aud_l1_m1_listen', 4, 'Sofia', 'I''m from Italy. I live in Rome.'),
('cue_l1_m1_5', 'aud_l1_m1_listen', 5, 'Receptionist', 'And how do you spell your family name?'),
('cue_l1_m1_6', 'aud_l1_m1_listen', 6, 'Sofia', 'R-O-S-S-I.'),
('cue_l1_m1_7', 'aud_l1_m1_listen', 7, 'Receptionist', 'Thank you. Your class is in room four.');

INSERT INTO learning_items (id, unit_id, sequence, kind, title, body, audio_asset_id) VALUES
('itm_l1_m1_listening', 'unt_l1_m1', 4, 'listening', 'Listening 1 -- At the Language School Reception',
'BEFORE YOU LISTEN: You will hear a student arriving at a language school. Look at the four questions first -- knowing what to listen for is itself the skill being taught, and at A1 it is the difference between hearing words and understanding a conversation.

LISTEN TWICE: The first time, listen for the general situation only -- who is speaking and where. Do not try to catch every word; at A1 the commonest mistake is stopping to decode one unknown word and missing the next sentence. The second time, answer the questions.

THEN: Read the transcript while listening a third time. Mark any place where what you heard and what is written surprised you -- that gap is your personal pronunciation target.

SHADOWING: Record yourself saying Sofia''s four lines. Compare your recording with the model.', 'aud_l1_m1_listen'),
('itm_l1_m1_pronunciation', 'unt_l1_m1', 5, 'pronunciation', 'Pronunciation Lab 1 -- Greetings, Country Stress & Wh-Questions',
'HOW TO USE THIS LAB: For each target below -- listen to the model, say it aloud three times, then record yourself and listen back. Listening back is the part learners skip and the part that works: you cannot correct a sound you have not heard yourself make.

Your recordings are kept, so attempt one and attempt ten sit side by side. Your instructor can reply with their own voice rather than only in writing.', 'aud_l1_m1_pron');

INSERT INTO pronunciation_targets (id, learning_item_id, sequence, focus, target, example, guidance) VALUES
('pron_l1_m1_1', 'itm_l1_m1_pronunciation', 1, 'phoneme', '/h/ at the start of a word', 'Hello. How are you?', 'Many languages drop this sound. Breathe out gently before the vowel -- you should feel warm air on your hand held in front of your mouth. Without it, "Hello" becomes "Ello".'),
('pron_l1_m1_2', 'itm_l1_m1_pronunciation', 2, 'word_stress', 'Country names carry fixed stress', 'I''m from JaPAN. I''m from CHIna. I''m from BraZIL.', 'Stress the capitalised syllable and make it longer, not just louder. Country names are among the first words a learner says about themselves, so a misplaced stress here is heard constantly.'),
('pron_l1_m1_3', 'itm_l1_m1_pronunciation', 3, 'intonation', 'Wh-questions fall at the end', 'Where are you FROM? (voice goes down)', 'A rising voice on a Wh-question sounds uncertain or surprised. Let your pitch drop on the last stressed word -- this is what makes a question sound friendly rather than doubtful.');

INSERT INTO quiz_questions (id, learning_item_id, sequence, prompt, choices_json, correct_index, audio_cue_id) VALUES
('qq_l1_m1_ls1', 'itm_l1_m1_listening', 1, 'Where does this conversation happen?', '["At a hotel","At a language school","At an airport","At a shop"]', 1, 'cue_l1_m1_1'),
('qq_l1_m1_ls2', 'itm_l1_m1_listening', 2, 'Where is Sofia from?', '["Italy","Spain","Portugal","France"]', 0, 'cue_l1_m1_4'),
('qq_l1_m1_ls3', 'itm_l1_m1_listening', 3, 'Which city does Sofia live in?', '["Milan","Naples","Rome","Turin"]', 2, 'cue_l1_m1_4'),
('qq_l1_m1_ls4', 'itm_l1_m1_listening', 4, 'Which room is her class in?', '["Room two","Room three","Room fourteen","Room four"]', 3, 'cue_l1_m1_7');
