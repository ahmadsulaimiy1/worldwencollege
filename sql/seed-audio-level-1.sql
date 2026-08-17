-- AIPC — Audio curriculum seed: Level I (Foundation, A1).
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
('qq_l1_m1_ls2', 'itm_l1_m1_listening', 2, 'Where is Sofia from?', '["Spain","Portugal","France","Italy"]', 3, 'cue_l1_m1_4'),
('qq_l1_m1_ls3', 'itm_l1_m1_listening', 3, 'Which city does Sofia live in?', '["Milan","Naples","Rome","Turin"]', 2, 'cue_l1_m1_4'),
('qq_l1_m1_ls4', 'itm_l1_m1_listening', 4, 'Which room is her class in?', '["Room four","Room two","Room three","Room fourteen"]', 0, 'cue_l1_m1_7');
-- AIPC — Audio curriculum seed: Level I (Foundation, A1), Modules 2-10.
--
-- Companion to the Module 1 block in this file's sibling section; see
-- docs/lms-architecture.md § The audio layer for the design, and
-- docs/curriculum-programme-review.md Finding 1 for why this exists.
--
-- WHAT IS REAL AND WHAT IS NOT: scripts, cue segmentation, speaker
-- attribution, comprehension questions and pronunciation targets are
-- complete authored curriculum. The RECORDINGS are not — every
-- media_url is NULL and every cue timing is NULL, because recording is
-- a studio task that has not happened. getAudioAsset() reports
-- isRecorded/isSynchronised false and the interface degrades to a
-- readable script. Dropping in narration later means UPDATEing
-- media_url and the cue timings; no structural change is required.
--
-- A1 delivery is set at 92-105 wpm against ~150 for natural
-- conversation, rising across later levels.

-- Re-sequence so the audio strand sits where the lessons assume it:
-- present -> practise -> listen -> pronounce -> test.
UPDATE learning_items SET sequence = 6 WHERE id LIKE 'itm_l1_m%_quiz';
UPDATE learning_items SET sequence = 7 WHERE id LIKE 'itm_l1_m%_assignment';
UPDATE learning_items SET sequence = 5 WHERE id = 'itm_l1_m10_examquiz';
UPDATE learning_items SET sequence = 6 WHERE id = 'itm_l1_m10_examassignment';

-- ---------------------------------------------------------------------
-- Module 2: Everyday Objects & Places
-- ---------------------------------------------------------------------
INSERT INTO audio_assets (id, kind, title, transcript, variety, speaker_count, target_wpm) VALUES
('aud_l1_m2_listen', 'listening', 'Sofia''s New Room', 'Hello Amina! I''m in my new room. | Oh, nice! Is it big? | It''s small, but it''s very comfortable. There is a bed near the window. | And is there a desk? | Yes, there is. There are two chairs, too. And there''s a big bookshelf. | Are there any pictures on the wall? | No, there aren''t. Not yet!', 'BrE', 2, 92),
('aud_l1_m2_pron', 'model_pronunciation', 'Module 2 Pronunciation Model', 'There is a book on the table. | There are two chairs. | This is my pen. | That is the door.', 'BrE', 1, 77);

INSERT INTO audio_cues (id, audio_asset_id, sequence, speaker, text) VALUES
('cue_l1_m2_1', 'aud_l1_m2_listen', 1, 'Sofia', 'Hello Amina! I''m in my new room.'),
('cue_l1_m2_2', 'aud_l1_m2_listen', 2, 'Amina', 'Oh, nice! Is it big?'),
('cue_l1_m2_3', 'aud_l1_m2_listen', 3, 'Sofia', 'It''s small, but it''s very comfortable. There is a bed near the window.'),
('cue_l1_m2_4', 'aud_l1_m2_listen', 4, 'Amina', 'And is there a desk?'),
('cue_l1_m2_5', 'aud_l1_m2_listen', 5, 'Sofia', 'Yes, there is. There are two chairs, too. And there''s a big bookshelf.'),
('cue_l1_m2_6', 'aud_l1_m2_listen', 6, 'Amina', 'Are there any pictures on the wall?'),
('cue_l1_m2_7', 'aud_l1_m2_listen', 7, 'Sofia', 'No, there aren''t. Not yet!');

INSERT INTO learning_items (id, unit_id, sequence, kind, title, body, audio_asset_id) VALUES
('itm_l1_m2_listening', 'unt_l1_m2', 4, 'listening', 'Listening 2 -- Sofia''s New Room',
'LISTENING OBJECTIVES: Understand a short description of a room; identify objects and their positions; recognise there is / there are in connected speech.

BEFORE YOU LISTEN: Sofia is describing her new room to a friend on the phone. Read the four questions first. Knowing what you are listening for is itself the skill being taught, and it is the difference between hearing words and understanding a conversation.

LISTEN TWICE: First for the general situation only -- who is speaking, where, and what they want. Do not stop to decode an unknown word; stopping is what makes learners miss the next sentence. Second time, answer the questions.

THEN: Read the synchronised transcript while listening a third time, and mark every place where what you heard and what is written surprised you. That gap is your own pronunciation target, identified by you rather than assigned to you.

SHADOWING: Record yourself speaking Sofia''s three longest lines, matching her pausing. Your recordings are kept attempt by attempt, so you can hear your own progress, and your instructor can reply in their own voice.', 'aud_l1_m2_listen'),
('itm_l1_m2_pronunciation', 'unt_l1_m2', 5, 'pronunciation', 'Pronunciation Lab 2 -- The /ð/ Sound, Short Forms & Sentence Rhythm',
'HOW TO USE THIS LAB: For each target -- listen to the model, say it aloud three times, then record yourself and listen back. Listening back is the step learners skip and the step that works: you cannot correct a sound you have not heard yourself produce.

FOCUS THIS MODULE: The /ð/ sound in there, this and that -- the single most useful consonant at this level, and one that does not exist in many languages.

Your recordings are kept, so attempt one and attempt ten sit side by side. Your instructor can reply with a spoken model rather than only written notes.', 'aud_l1_m2_pron');

INSERT INTO pronunciation_targets (id, learning_item_id, sequence, focus, target, example, guidance) VALUES
('pron_l1_m2_1', 'itm_l1_m2_pronunciation', 1, 'phoneme', '/ð/ in there, this, that', 'There is a desk. This is my room.', 'Put the tip of your tongue lightly between your teeth and let your voice buzz. If it becomes /d/ ("dere") or /z/ ("zere"), your tongue is behind the teeth instead of between them.'),
('pron_l1_m2_2', 'itm_l1_m2_pronunciation', 2, 'connected_speech', 'There is -> there''s; there are -> there''re', 'There''s a bed. There''re two chairs.', 'Fluent speakers rarely say the full form. Learn to HEAR the short form even if you say the long one; this is why listening feels fast.'),
('pron_l1_m2_3', 'itm_l1_m2_pronunciation', 3, 'sentence_stress', 'Content words carry the beat', 'There''s a BED near the WINdow.', 'Say only the capitalised words first, keeping the rhythm, then add the small words quietly between them. English rhythm is built on stressed words, not on syllable count.');

INSERT INTO quiz_questions (id, learning_item_id, sequence, prompt, choices_json, correct_index, audio_cue_id) VALUES
('qq_l1_m2_ls1', 'itm_l1_m2_listening', 1, 'Where is Sofia?', '["In her new room","At school","At a shop","In the garden"]', 0, 'cue_l1_m2_1'),
('qq_l1_m2_ls2', 'itm_l1_m2_listening', 2, 'What is near the window?', '["A desk","A chair","A bed","A bookshelf"]', 2, 'cue_l1_m2_3'),
('qq_l1_m2_ls3', 'itm_l1_m2_listening', 3, 'How many chairs are there?', '["One","Two","Three","Four"]', 1, 'cue_l1_m2_5'),
('qq_l1_m2_ls4', 'itm_l1_m2_listening', 4, 'Are there pictures on the wall?', '["Yes, two","Yes, many","The speaker does not say","No, none yet"]', 3, 'cue_l1_m2_7');

-- ---------------------------------------------------------------------
-- Module 3: Family & Routines
-- ---------------------------------------------------------------------
INSERT INTO audio_assets (id, kind, title, transcript, variety, speaker_count, target_wpm) VALUES
('aud_l1_m3_listen', 'listening', 'A Morning in the Okafor Family', 'In my family, we get up early. | My mother gets up at half past five. She makes breakfast. | My father leaves the house at seven o''clock. He works in a bank. | I get up at six. First I wash, then I have breakfast, and finally I walk to school. | My sister watches television for ten minutes before school. She is always late!', 'BrE', 1, 95),
('aud_l1_m3_pron', 'model_pronunciation', 'Module 3 Pronunciation Model', 'He works in a bank. | She leaves at seven. | She watches television. | I get up at six.', 'BrE', 1, 80);

INSERT INTO audio_cues (id, audio_asset_id, sequence, speaker, text) VALUES
('cue_l1_m3_1', 'aud_l1_m3_listen', 1, 'Chidi', 'In my family, we get up early.'),
('cue_l1_m3_2', 'aud_l1_m3_listen', 2, 'Chidi', 'My mother gets up at half past five. She makes breakfast.'),
('cue_l1_m3_3', 'aud_l1_m3_listen', 3, 'Chidi', 'My father leaves the house at seven o''clock. He works in a bank.'),
('cue_l1_m3_4', 'aud_l1_m3_listen', 4, 'Chidi', 'I get up at six. First I wash, then I have breakfast, and finally I walk to school.'),
('cue_l1_m3_5', 'aud_l1_m3_listen', 5, 'Chidi', 'My sister watches television for ten minutes before school. She is always late!');

INSERT INTO learning_items (id, unit_id, sequence, kind, title, body, audio_asset_id) VALUES
('itm_l1_m3_listening', 'unt_l1_m3', 4, 'listening', 'Listening 3 -- A Morning in the Okafor Family',
'LISTENING OBJECTIVES: Follow a description of a daily routine; catch clock times; hear third-person -s endings accurately.

BEFORE YOU LISTEN: Chidi describes a normal weekday morning in his family. Read the four questions first. Knowing what you are listening for is itself the skill being taught, and it is the difference between hearing words and understanding a conversation.

LISTEN TWICE: First for the general situation only -- who is speaking, where, and what they want. Do not stop to decode an unknown word; stopping is what makes learners miss the next sentence. Second time, answer the questions.

THEN: Read the synchronised transcript while listening a third time, and mark every place where what you heard and what is written surprised you. That gap is your own pronunciation target, identified by you rather than assigned to you.

SHADOWING: Record yourself speaking Chidi''s description of his own morning. Your recordings are kept attempt by attempt, so you can hear your own progress, and your instructor can reply in their own voice.', 'aud_l1_m3_listen'),
('itm_l1_m3_pronunciation', 'unt_l1_m3', 5, 'pronunciation', 'Pronunciation Lab 3 -- Third-Person Endings, Linking & Clock Times',
'HOW TO USE THIS LAB: For each target -- listen to the model, say it aloud three times, then record yourself and listen back. Listening back is the step learners skip and the step that works: you cannot correct a sound you have not heard yourself produce.

FOCUS THIS MODULE: The three sounds of third-person -s: /s/, /z/ and /iz/ -- chosen by the sound before the ending, never by the spelling.

Your recordings are kept, so attempt one and attempt ten sit side by side. Your instructor can reply with a spoken model rather than only written notes.', 'aud_l1_m3_pron');

INSERT INTO pronunciation_targets (id, learning_item_id, sequence, focus, target, example, guidance) VALUES
('pron_l1_m3_1', 'itm_l1_m3_pronunciation', 1, 'phoneme', '-s endings: /s/, /z/, /iz/', 'He works /s/. She leaves /z/. She watches /iz/.', 'After a voiceless sound (k, p, t, f) say /s/; after a voiced sound or vowel say /z/; after s, sh, ch, j, z add a whole syllable /iz/. Your ears already know this in your own language -- the rule just makes it conscious.'),
('pron_l1_m3_2', 'itm_l1_m3_pronunciation', 2, 'connected_speech', 'Linking a final consonant to a following vowel', 'gets up -> "get-sup"; walks_ to school', 'English does not put a gap between words. Joining them is not sloppy speech; it is correct speech, and expecting gaps is why fluent English sounds too fast.'),
('pron_l1_m3_3', 'itm_l1_m3_pronunciation', 3, 'word_stress', 'Clock times keep the stress on the number', 'half past FIVE; SEven o''CLOCK', 'Times carry information, so the numbers are stressed. Flattening them makes a time hard to catch even when every sound is correct.');

INSERT INTO quiz_questions (id, learning_item_id, sequence, prompt, choices_json, correct_index, audio_cue_id) VALUES
('qq_l1_m3_ls1', 'itm_l1_m3_listening', 1, 'What time does Chidi''s mother get up?', '["Five o''clock","Six o''clock","Half past five","Seven o''clock"]', 2, 'cue_l1_m3_2'),
('qq_l1_m3_ls2', 'itm_l1_m3_listening', 2, 'Where does Chidi''s father work?', '["In a bank","In a school","In a shop","In a hospital"]', 0, 'cue_l1_m3_3'),
('qq_l1_m3_ls3', 'itm_l1_m3_listening', 3, 'What does Chidi do FIRST?', '["He has breakfast","He walks to school","He watches television","He washes"]', 3, 'cue_l1_m3_4'),
('qq_l1_m3_ls4', 'itm_l1_m3_listening', 4, 'Why is Chidi''s sister always late?', '["She gets up at seven","She watches television","She walks to school","She makes breakfast"]', 1, 'cue_l1_m3_5');

-- ---------------------------------------------------------------------
-- Module 4: Food & Shopping
-- ---------------------------------------------------------------------
INSERT INTO audio_assets (id, kind, title, transcript, variety, speaker_count, target_wpm) VALUES
('aud_l1_m4_listen', 'listening', 'At the Market', 'Good morning! Can I help you? | Yes, please. I''d like some apples. | How many would you like? | Six, please. And is there any bread? | Yes, there is. Brown or white? | Brown, please. How much is that altogether? | That''s four pounds fifty. | Here you are. Thank you!', 'BrE', 2, 95),
('aud_l1_m4_pron', 'model_pronunciation', 'Module 4 Pronunciation Model', 'I''d like some apples. | Is there any bread? | How much is that? | That''s four pounds fifty.', 'BrE', 1, 80);

INSERT INTO audio_cues (id, audio_asset_id, sequence, speaker, text) VALUES
('cue_l1_m4_1', 'aud_l1_m4_listen', 1, 'Seller', 'Good morning! Can I help you?'),
('cue_l1_m4_2', 'aud_l1_m4_listen', 2, 'Customer', 'Yes, please. I''d like some apples.'),
('cue_l1_m4_3', 'aud_l1_m4_listen', 3, 'Seller', 'How many would you like?'),
('cue_l1_m4_4', 'aud_l1_m4_listen', 4, 'Customer', 'Six, please. And is there any bread?'),
('cue_l1_m4_5', 'aud_l1_m4_listen', 5, 'Seller', 'Yes, there is. Brown or white?'),
('cue_l1_m4_6', 'aud_l1_m4_listen', 6, 'Customer', 'Brown, please. How much is that altogether?'),
('cue_l1_m4_7', 'aud_l1_m4_listen', 7, 'Seller', 'That''s four pounds fifty.'),
('cue_l1_m4_8', 'aud_l1_m4_listen', 8, 'Customer', 'Here you are. Thank you!');

INSERT INTO learning_items (id, unit_id, sequence, kind, title, body, audio_asset_id) VALUES
('itm_l1_m4_listening', 'unt_l1_m4', 4, 'listening', 'Listening 4 -- At the Market',
'LISTENING OBJECTIVES: Follow a short shopping transaction; catch quantities and prices; distinguish some and any in fast speech.

BEFORE YOU LISTEN: A customer is buying fruit and bread at a market stall. Read the four questions first. Knowing what you are listening for is itself the skill being taught, and it is the difference between hearing words and understanding a conversation.

LISTEN TWICE: First for the general situation only -- who is speaking, where, and what they want. Do not stop to decode an unknown word; stopping is what makes learners miss the next sentence. Second time, answer the questions.

THEN: Read the synchronised transcript while listening a third time, and mark every place where what you heard and what is written surprised you. That gap is your own pronunciation target, identified by you rather than assigned to you.

SHADOWING: Record yourself speaking the customer''s lines, including the price question. Your recordings are kept attempt by attempt, so you can hear your own progress, and your instructor can reply in their own voice.', 'aud_l1_m4_listen'),
('itm_l1_m4_pronunciation', 'unt_l1_m4', 5, 'pronunciation', 'Pronunciation Lab 4 -- Long and Short i, Prices & Polite Requests',
'HOW TO USE THIS LAB: For each target -- listen to the model, say it aloud three times, then record yourself and listen back. Listening back is the step learners skip and the step that works: you cannot correct a sound you have not heard yourself produce.

FOCUS THIS MODULE: The long /i:/ and short /I/ contrast -- the difference between cheap and chip, and between this sheet and a rude mistake.

Your recordings are kept, so attempt one and attempt ten sit side by side. Your instructor can reply with a spoken model rather than only written notes.', 'aud_l1_m4_pron');

INSERT INTO pronunciation_targets (id, learning_item_id, sequence, focus, target, example, guidance) VALUES
('pron_l1_m4_1', 'itm_l1_m4_pronunciation', 1, 'phoneme', 'Long /i:/ vs short /I/', 'cheap / chip; sheet / shit; these / this', 'For /i:/ spread your lips as if smiling and hold the sound; for /I/ relax the lips and keep it short. This pair causes more genuine embarrassment than any other vowel contrast in English.'),
('pron_l1_m4_2', 'itm_l1_m4_pronunciation', 2, 'word_stress', 'Prices: the numbers take the stress', 'four POUNDS FIFty; TWO fifty', 'Money is the information in a shopping exchange, so it is stressed and slightly slowed. Say it flat and the listener will ask again.'),
('pron_l1_m4_3', 'itm_l1_m4_pronunciation', 3, 'intonation', 'Polite requests rise at the end', 'Can I have some bread, please? (voice goes up)', 'A falling voice on a request sounds like an instruction. The rise is what makes it polite -- in English, politeness is carried by melody at least as much as by the word please.');

INSERT INTO quiz_questions (id, learning_item_id, sequence, prompt, choices_json, correct_index, audio_cue_id) VALUES
('qq_l1_m4_ls1', 'itm_l1_m4_listening', 1, 'What does the customer want first?', '["Bread","Milk","Eggs","Apples"]', 3, 'cue_l1_m4_2'),
('qq_l1_m4_ls2', 'itm_l1_m4_listening', 2, 'How many apples does the customer buy?', '["Four","Six","Five","Seven"]', 1, 'cue_l1_m4_4'),
('qq_l1_m4_ls3', 'itm_l1_m4_listening', 3, 'Which bread does the customer choose?', '["Brown","White","Both","Neither"]', 0, 'cue_l1_m4_6'),
('qq_l1_m4_ls4', 'itm_l1_m4_listening', 4, 'How much is the total?', '["Four pounds fifteen","Fourteen pounds","Four pounds fifty","Five pounds forty"]', 2, 'cue_l1_m4_7');

-- ---------------------------------------------------------------------
-- Module 5: Around Town
-- ---------------------------------------------------------------------
INSERT INTO audio_assets (id, kind, title, transcript, variety, speaker_count, target_wpm) VALUES
('aud_l1_m5_listen', 'listening', 'Finding the Library', 'Excuse me, how do I get to the library? | The library? Go straight on to the traffic lights. | Then turn right into King Street. | The library is opposite the post office, next to a small cafe. | Is it far? | No, it''s about five minutes'' walk. | Thank you very much!', 'BrE', 2, 98),
('aud_l1_m5_pron', 'model_pronunciation', 'Module 5 Pronunciation Model', 'Excuse me. | Go straight on. | Turn right. | It''s next to the bank.', 'BrE', 1, 83);

INSERT INTO audio_cues (id, audio_asset_id, sequence, speaker, text) VALUES
('cue_l1_m5_1', 'aud_l1_m5_listen', 1, 'Visitor', 'Excuse me, how do I get to the library?'),
('cue_l1_m5_2', 'aud_l1_m5_listen', 2, 'Local', 'The library? Go straight on to the traffic lights.'),
('cue_l1_m5_3', 'aud_l1_m5_listen', 3, 'Local', 'Then turn right into King Street.'),
('cue_l1_m5_4', 'aud_l1_m5_listen', 4, 'Local', 'The library is opposite the post office, next to a small cafe.'),
('cue_l1_m5_5', 'aud_l1_m5_listen', 5, 'Visitor', 'Is it far?'),
('cue_l1_m5_6', 'aud_l1_m5_listen', 6, 'Local', 'No, it''s about five minutes'' walk.'),
('cue_l1_m5_7', 'aud_l1_m5_listen', 7, 'Visitor', 'Thank you very much!');

INSERT INTO learning_items (id, unit_id, sequence, kind, title, body, audio_asset_id) VALUES
('itm_l1_m5_listening', 'unt_l1_m5', 4, 'listening', 'Listening 5 -- Finding the Library',
'LISTENING OBJECTIVES: Follow spoken directions; hold a sequence of instructions in memory; recognise prepositions of place in connected speech.

BEFORE YOU LISTEN: A visitor stops someone in the street to ask for directions. Read the four questions first. Knowing what you are listening for is itself the skill being taught, and it is the difference between hearing words and understanding a conversation.

LISTEN TWICE: First for the general situation only -- who is speaking, where, and what they want. Do not stop to decode an unknown word; stopping is what makes learners miss the next sentence. Second time, answer the questions.

THEN: Read the synchronised transcript while listening a third time, and mark every place where what you heard and what is written surprised you. That gap is your own pronunciation target, identified by you rather than assigned to you.

SHADOWING: Record yourself speaking the visitor''s questions, keeping the polite rise. Your recordings are kept attempt by attempt, so you can hear your own progress, and your instructor can reply in their own voice.', 'aud_l1_m5_listen'),
('itm_l1_m5_pronunciation', 'unt_l1_m5', 5, 'pronunciation', 'Pronunciation Lab 5 -- The English r, Chunking Directions & Opening Politely',
'HOW TO USE THIS LAB: For each target -- listen to the model, say it aloud three times, then record yourself and listen back. Listening back is the step learners skip and the step that works: you cannot correct a sound you have not heard yourself produce.

FOCUS THIS MODULE: The English /r/ and the rhythm of direction-giving, where each instruction is a separate rhythmic group.

Your recordings are kept, so attempt one and attempt ten sit side by side. Your instructor can reply with a spoken model rather than only written notes.', 'aud_l1_m5_pron');

INSERT INTO pronunciation_targets (id, learning_item_id, sequence, focus, target, example, guidance) VALUES
('pron_l1_m5_1', 'itm_l1_m5_pronunciation', 1, 'phoneme', 'English /r/ is not rolled or tapped', 'right; street; library', 'The tongue tip curls back slightly and touches nothing. Rolling or tapping it is the single most recognisable accent marker for many learners, and it is easy to change once noticed.'),
('pron_l1_m5_2', 'itm_l1_m5_pronunciation', 2, 'rhythm', 'One instruction, one rhythmic group', 'Go STRAIGHT ON // then turn RIGHT // into KING Street.', 'Directions are chunked with a small pause between each step. Delivered as one long line they cannot be followed even when every word is clear.'),
('pron_l1_m5_3', 'itm_l1_m5_pronunciation', 3, 'intonation', 'Excuse me rises to open politely', 'exCUSE me (voice up), how do I GET to the library? (voice down)', 'The opening rise gets attention politely; the Wh-question then falls. Getting these the wrong way round sounds either aggressive or uncertain.');

INSERT INTO quiz_questions (id, learning_item_id, sequence, prompt, choices_json, correct_index, audio_cue_id) VALUES
('qq_l1_m5_ls1', 'itm_l1_m5_listening', 1, 'What is the visitor looking for?', '["The library","The post office","A cafe","King Street"]', 0, 'cue_l1_m5_1'),
('qq_l1_m5_ls2', 'itm_l1_m5_listening', 2, 'Which way do they turn at the traffic lights?', '["Left","Straight on","Right","Back"]', 2, 'cue_l1_m5_3'),
('qq_l1_m5_ls3', 'itm_l1_m5_listening', 3, 'What is the library opposite?', '["A cafe","The post office","A school","The station"]', 1, 'cue_l1_m5_4'),
('qq_l1_m5_ls4', 'itm_l1_m5_listening', 4, 'How long does it take to walk there?', '["About fifteen minutes","About fifty minutes","The speaker does not say","About five minutes"]', 3, 'cue_l1_m5_6');

-- ---------------------------------------------------------------------
-- Module 6: Describing People & Things
-- ---------------------------------------------------------------------
INSERT INTO audio_assets (id, kind, title, transcript, variety, speaker_count, target_wpm) VALUES
('aud_l1_m6_listen', 'listening', 'The Lost Bag', 'Good afternoon. How can I help? | I''ve lost my bag. I left it on the train. | Can you describe it? | Yes. It''s a small black bag. It''s not new -- it''s quite old. | Is there anything in it? | There''s a red notebook and an old camera. And my glasses. | One moment. Is this it? | Yes! That''s mine. Thank you so much.', 'BrE', 2, 98),
('aud_l1_m6_pron', 'model_pronunciation', 'Module 6 Pronunciation Model', 'It''s a small black bag. | She has long brown hair. | He''s tall and young. | That''s mine.', 'BrE', 1, 83);

INSERT INTO audio_cues (id, audio_asset_id, sequence, speaker, text) VALUES
('cue_l1_m6_1', 'aud_l1_m6_listen', 1, 'Clerk', 'Good afternoon. How can I help?'),
('cue_l1_m6_2', 'aud_l1_m6_listen', 2, 'Traveller', 'I''ve lost my bag. I left it on the train.'),
('cue_l1_m6_3', 'aud_l1_m6_listen', 3, 'Clerk', 'Can you describe it?'),
('cue_l1_m6_4', 'aud_l1_m6_listen', 4, 'Traveller', 'Yes. It''s a small black bag. It''s not new -- it''s quite old.'),
('cue_l1_m6_5', 'aud_l1_m6_listen', 5, 'Clerk', 'Is there anything in it?'),
('cue_l1_m6_6', 'aud_l1_m6_listen', 6, 'Traveller', 'There''s a red notebook and an old camera. And my glasses.'),
('cue_l1_m6_7', 'aud_l1_m6_listen', 7, 'Clerk', 'One moment. Is this it?'),
('cue_l1_m6_8', 'aud_l1_m6_listen', 8, 'Traveller', 'Yes! That''s mine. Thank you so much.');

INSERT INTO learning_items (id, unit_id, sequence, kind, title, body, audio_asset_id) VALUES
('itm_l1_m6_listening', 'unt_l1_m6', 4, 'listening', 'Listening 6 -- The Lost Bag',
'LISTENING OBJECTIVES: Understand a physical description; hold several details at once; hear adjective order in natural speech.

BEFORE YOU LISTEN: A traveller is describing a lost bag at a station lost-property desk. Read the four questions first. Knowing what you are listening for is itself the skill being taught, and it is the difference between hearing words and understanding a conversation.

LISTEN TWICE: First for the general situation only -- who is speaking, where, and what they want. Do not stop to decode an unknown word; stopping is what makes learners miss the next sentence. Second time, answer the questions.

THEN: Read the synchronised transcript while listening a third time, and mark every place where what you heard and what is written surprised you. That gap is your own pronunciation target, identified by you rather than assigned to you.

SHADOWING: Record yourself speaking the traveller''s description of the bag. Your recordings are kept attempt by attempt, so you can hear your own progress, and your instructor can reply in their own voice.', 'aud_l1_m6_listen'),
('itm_l1_m6_pronunciation', 'unt_l1_m6', 5, 'pronunciation', 'Pronunciation Lab 6 -- Short Vowels, Adjective Stress & Marking Contrast',
'HOW TO USE THIS LAB: For each target -- listen to the model, say it aloud three times, then record yourself and listen back. Listening back is the step learners skip and the step that works: you cannot correct a sound you have not heard yourself produce.

FOCUS THIS MODULE: The /ae/ and /e/ contrast -- bad and bed, man and men -- and the stress pattern of adjective + noun.

Your recordings are kept, so attempt one and attempt ten sit side by side. Your instructor can reply with a spoken model rather than only written notes.', 'aud_l1_m6_pron');

INSERT INTO pronunciation_targets (id, learning_item_id, sequence, focus, target, example, guidance) VALUES
('pron_l1_m6_1', 'itm_l1_m6_pronunciation', 1, 'phoneme', '/ae/ vs /e/', 'bad / bed; man / men; sat / set', 'For /ae/ drop the jaw and open wide; for /e/ the mouth is much more closed. Many learners produce one sound for both, which makes bad and bed identical to a listener.'),
('pron_l1_m6_2', 'itm_l1_m6_pronunciation', 2, 'word_stress', 'Adjective + noun: stress the noun', 'a small black BAG; a red NOTEbook', 'In an ordinary description the noun carries the main stress. Stressing the adjective instead signals contrast -- "the BLACK bag, not the brown one" -- so misplacing it changes the meaning.'),
('pron_l1_m6_3', 'itm_l1_m6_pronunciation', 3, 'sentence_stress', 'Correcting information moves the stress', 'It''s not NEW -- it''s quite OLD.', 'English marks contrast by stress, not by word order. Learning to hear this is how you catch which part of a sentence is the point.');

INSERT INTO quiz_questions (id, learning_item_id, sequence, prompt, choices_json, correct_index, audio_cue_id) VALUES
('qq_l1_m6_ls1', 'itm_l1_m6_listening', 1, 'Where did the traveller leave the bag?', '["On a bus","On the train","In a taxi","At the hotel"]', 1, 'cue_l1_m6_2'),
('qq_l1_m6_ls2', 'itm_l1_m6_listening', 2, 'What colour is the bag?', '["Brown","Blue","Grey","Black"]', 3, 'cue_l1_m6_4'),
('qq_l1_m6_ls3', 'itm_l1_m6_listening', 3, 'What colour is the notebook?', '["Black","Green","Red","White"]', 2, 'cue_l1_m6_6'),
('qq_l1_m6_ls4', 'itm_l1_m6_listening', 4, 'What else is in the bag, besides the notebook and the glasses?', '["A camera","A phone","A book","A wallet"]', 0, 'cue_l1_m6_6');

-- ---------------------------------------------------------------------
-- Module 7: Past Experiences
-- ---------------------------------------------------------------------
INSERT INTO audio_assets (id, kind, title, transcript, variety, speaker_count, target_wpm) VALUES
('aud_l1_m7_listen', 'listening', 'Amina''s Weekend', 'Hi Amina. Did you have a good weekend? | Yes, thanks! On Saturday I visited my grandmother. | We cooked together and talked for hours. | On Sunday morning I played football with my brother. Our team won. | Then it rained, so we went home early and watched a film. | That sounds lovely. I studied all weekend!', 'BrE', 2, 100),
('aud_l1_m7_pron', 'model_pronunciation', 'Module 7 Pronunciation Model', 'I visited my grandmother. | We cooked together. | They played football. | It rained.', 'BrE', 1, 85);

INSERT INTO audio_cues (id, audio_asset_id, sequence, speaker, text) VALUES
('cue_l1_m7_1', 'aud_l1_m7_listen', 1, 'Kwame', 'Hi Amina. Did you have a good weekend?'),
('cue_l1_m7_2', 'aud_l1_m7_listen', 2, 'Amina', 'Yes, thanks! On Saturday I visited my grandmother.'),
('cue_l1_m7_3', 'aud_l1_m7_listen', 3, 'Amina', 'We cooked together and talked for hours.'),
('cue_l1_m7_4', 'aud_l1_m7_listen', 4, 'Amina', 'On Sunday morning I played football with my brother. Our team won.'),
('cue_l1_m7_5', 'aud_l1_m7_listen', 5, 'Amina', 'Then it rained, so we went home early and watched a film.'),
('cue_l1_m7_6', 'aud_l1_m7_listen', 6, 'Kwame', 'That sounds lovely. I studied all weekend!');

INSERT INTO learning_items (id, unit_id, sequence, kind, title, body, audio_asset_id) VALUES
('itm_l1_m7_listening', 'unt_l1_m7', 4, 'listening', 'Listening 7 -- Amina''s Weekend',
'LISTENING OBJECTIVES: Follow a short past narrative; catch -ed endings; put past events in the order they happened.

BEFORE YOU LISTEN: Amina tells a classmate about her weekend. Read the four questions first. Knowing what you are listening for is itself the skill being taught, and it is the difference between hearing words and understanding a conversation.

LISTEN TWICE: First for the general situation only -- who is speaking, where, and what they want. Do not stop to decode an unknown word; stopping is what makes learners miss the next sentence. Second time, answer the questions.

THEN: Read the synchronised transcript while listening a third time, and mark every place where what you heard and what is written surprised you. That gap is your own pronunciation target, identified by you rather than assigned to you.

SHADOWING: Record yourself speaking Amina''s account, keeping the -ed endings clear. Your recordings are kept attempt by attempt, so you can hear your own progress, and your instructor can reply in their own voice.', 'aud_l1_m7_listen'),
('itm_l1_m7_pronunciation', 'unt_l1_m7', 5, 'pronunciation', 'Pronunciation Lab 7 -- Past-Tense Endings, Weak Forms & Narrative Rhythm',
'HOW TO USE THIS LAB: For each target -- listen to the model, say it aloud three times, then record yourself and listen back. Listening back is the step learners skip and the step that works: you cannot correct a sound you have not heard yourself produce.

FOCUS THIS MODULE: The three sounds of -ed: /t/, /d/ and /Id/ -- chosen by the sound before the ending, exactly like the -s rule in Module 3.

Your recordings are kept, so attempt one and attempt ten sit side by side. Your instructor can reply with a spoken model rather than only written notes.', 'aud_l1_m7_pron');

INSERT INTO pronunciation_targets (id, learning_item_id, sequence, focus, target, example, guidance) VALUES
('pron_l1_m7_1', 'itm_l1_m7_pronunciation', 1, 'phoneme', '-ed endings: /t/, /d/, /Id/', 'watched /t/; played /d/; visited /Id/', 'After a voiceless sound say /t/; after a voiced sound or vowel say /d/; only after t or d does -ed become a whole extra syllable /Id/. Adding a syllable everywhere -- "watch-ed" -- is the commonest A1 past-tense error.'),
('pron_l1_m7_2', 'itm_l1_m7_pronunciation', 2, 'connected_speech', 'Weak was and were', 'I was /wəz/ tired. They were /wə/ late.', 'In natural speech these are almost never stressed. Learners who expect the strong form miss them entirely, and then miss that the sentence was in the past.'),
('pron_l1_m7_3', 'itm_l1_m7_pronunciation', 3, 'rhythm', 'Time phrases open the sentence and take their own group', 'On SATurday // I visited my GRANDmother.', 'Fronted time phrases form a separate rhythmic chunk with a small pause. This is how a listener knows immediately that the story has moved to a new day.');

INSERT INTO quiz_questions (id, learning_item_id, sequence, prompt, choices_json, correct_index, audio_cue_id) VALUES
('qq_l1_m7_ls1', 'itm_l1_m7_listening', 1, 'What did Amina do on Saturday?', '["Played football","Visited her grandmother","Watched a film","Studied"]', 1, 'cue_l1_m7_2'),
('qq_l1_m7_ls2', 'itm_l1_m7_listening', 2, 'Who did she play football with?', '["Her grandmother","Kwame","Her team","Her brother"]', 3, 'cue_l1_m7_4'),
('qq_l1_m7_ls3', 'itm_l1_m7_listening', 3, 'Why did they go home early on Sunday?', '["They were tired","The film started","It rained","Her brother was ill"]', 2, 'cue_l1_m7_5'),
('qq_l1_m7_ls4', 'itm_l1_m7_listening', 4, 'What did Kwame do at the weekend?', '["He studied","He cooked","He played football","He visited family"]', 0, 'cue_l1_m7_6');

-- ---------------------------------------------------------------------
-- Module 8: Plans & Abilities
-- ---------------------------------------------------------------------
INSERT INTO audio_assets (id, kind, title, transcript, variety, speaker_count, target_wpm) VALUES
('aud_l1_m8_listen', 'listening', 'Saturday Plans', 'What are you going to do on Saturday? | I''m going to visit my cousin in the morning. | In the afternoon I''m going to play tennis. Can you play? | No, I can''t. But I can swim quite well. | Then we''re going to go to the pool instead. Can you come at two? | Yes, I can. See you at two!', 'BrE', 2, 100),
('aud_l1_m8_pron', 'model_pronunciation', 'Module 8 Pronunciation Model', 'I''m going to visit my cousin. | Can you play tennis? | No, I can''t. | I can swim quite well.', 'BrE', 1, 85);

INSERT INTO audio_cues (id, audio_asset_id, sequence, speaker, text) VALUES
('cue_l1_m8_1', 'aud_l1_m8_listen', 1, 'Marta', 'What are you going to do on Saturday?'),
('cue_l1_m8_2', 'aud_l1_m8_listen', 2, 'Leo', 'I''m going to visit my cousin in the morning.'),
('cue_l1_m8_3', 'aud_l1_m8_listen', 3, 'Leo', 'In the afternoon I''m going to play tennis. Can you play?'),
('cue_l1_m8_4', 'aud_l1_m8_listen', 4, 'Marta', 'No, I can''t. But I can swim quite well.'),
('cue_l1_m8_5', 'aud_l1_m8_listen', 5, 'Leo', 'Then we''re going to go to the pool instead. Can you come at two?'),
('cue_l1_m8_6', 'aud_l1_m8_listen', 6, 'Marta', 'Yes, I can. See you at two!');

INSERT INTO learning_items (id, unit_id, sequence, kind, title, body, audio_asset_id) VALUES
('itm_l1_m8_listening', 'unt_l1_m8', 4, 'listening', 'Listening 8 -- Saturday Plans',
'LISTENING OBJECTIVES: Understand stated plans and abilities; distinguish can and can''t reliably; catch going to in fast speech.

BEFORE YOU LISTEN: Two friends are making plans for Saturday. Read the four questions first. Knowing what you are listening for is itself the skill being taught, and it is the difference between hearing words and understanding a conversation.

LISTEN TWICE: First for the general situation only -- who is speaking, where, and what they want. Do not stop to decode an unknown word; stopping is what makes learners miss the next sentence. Second time, answer the questions.

THEN: Read the synchronised transcript while listening a third time, and mark every place where what you heard and what is written surprised you. That gap is your own pronunciation target, identified by you rather than assigned to you.

SHADOWING: Record yourself speaking Leo''s lines, using the natural gonna reduction. Your recordings are kept attempt by attempt, so you can hear your own progress, and your instructor can reply in their own voice.', 'aud_l1_m8_listen'),
('itm_l1_m8_pronunciation', 'unt_l1_m8', 5, 'pronunciation', 'Pronunciation Lab 8 -- Gonna, the can/can''t Contrast & Negative Stress',
'HOW TO USE THIS LAB: For each target -- listen to the model, say it aloud three times, then record yourself and listen back. Listening back is the step learners skip and the step that works: you cannot correct a sound you have not heard yourself produce.

FOCUS THIS MODULE: The going to reduction and the can/can''t contrast -- where a single missed sound reverses the meaning.

Your recordings are kept, so attempt one and attempt ten sit side by side. Your instructor can reply with a spoken model rather than only written notes.', 'aud_l1_m8_pron');

INSERT INTO pronunciation_targets (id, learning_item_id, sequence, focus, target, example, guidance) VALUES
('pron_l1_m8_1', 'itm_l1_m8_pronunciation', 1, 'connected_speech', 'going to -> /ˈɡənə/ before a verb', 'I''m gonna visit my cousin.', 'This reduction is normal educated speech, not slang -- but only before a verb. "I''m going to London" never reduces. Recognising it matters more at A1 than producing it.'),
('pron_l1_m8_2', 'itm_l1_m8_pronunciation', 2, 'phoneme', 'can vs can''t', 'I CAN swim. I CAN''T swim.', 'In British English can''t has a long clear vowel and can is reduced to /kən/. The /t/ is often almost inaudible, so the VOWEL carries the meaning -- listen for the vowel, not the t.'),
('pron_l1_m8_3', 'itm_l1_m8_pronunciation', 3, 'sentence_stress', 'Stress falls on can''t, never on can', 'I can SWIM. -- I CAN''T swim.', 'In the positive, the verb is stressed; in the negative, can''t is. This stress difference is what a listener actually uses to tell them apart.');

INSERT INTO quiz_questions (id, learning_item_id, sequence, prompt, choices_json, correct_index, audio_cue_id) VALUES
('qq_l1_m8_ls1', 'itm_l1_m8_listening', 1, 'What is Leo going to do in the morning?', '["Play tennis","Go swimming","Stay at home","Visit his cousin"]', 3, 'cue_l1_m8_2'),
('qq_l1_m8_ls2', 'itm_l1_m8_listening', 2, 'Can Marta play tennis?', '["Yes, very well","No, she can''t","Yes, a little","She does not say"]', 1, 'cue_l1_m8_4'),
('qq_l1_m8_ls3', 'itm_l1_m8_listening', 3, 'What can Marta do well?', '["Swim","Play tennis","Cook","Drive"]', 0, 'cue_l1_m8_4'),
('qq_l1_m8_ls4', 'itm_l1_m8_listening', 4, 'What time are they going to meet?', '["At one","At three","At two","At four"]', 2, 'cue_l1_m8_5');

-- ---------------------------------------------------------------------
-- Module 9: Health & Feelings
-- ---------------------------------------------------------------------
INSERT INTO audio_assets (id, kind, title, transcript, variety, speaker_count, target_wpm) VALUES
('aud_l1_m9_listen', 'listening', 'At the Pharmacy', 'Good morning. What''s the matter? | I have a bad headache, and I feel very tired. | Oh dear, I''m sorry to hear that. How long have you felt like this? | Since yesterday. My throat hurts too. | You should drink plenty of water and rest today. | You shouldn''t go to work. Take these twice a day, after food. | Thank you. How much are they? | Three pounds twenty.', 'BrE', 2, 98),
('aud_l1_m9_pron', 'model_pronunciation', 'Module 9 Pronunciation Model', 'I have a bad headache. | My throat hurts. | You should rest. | You shouldn''t go to work.', 'BrE', 1, 83);

INSERT INTO audio_cues (id, audio_asset_id, sequence, speaker, text) VALUES
('cue_l1_m9_1', 'aud_l1_m9_listen', 1, 'Pharmacist', 'Good morning. What''s the matter?'),
('cue_l1_m9_2', 'aud_l1_m9_listen', 2, 'Customer', 'I have a bad headache, and I feel very tired.'),
('cue_l1_m9_3', 'aud_l1_m9_listen', 3, 'Pharmacist', 'Oh dear, I''m sorry to hear that. How long have you felt like this?'),
('cue_l1_m9_4', 'aud_l1_m9_listen', 4, 'Customer', 'Since yesterday. My throat hurts too.'),
('cue_l1_m9_5', 'aud_l1_m9_listen', 5, 'Pharmacist', 'You should drink plenty of water and rest today.'),
('cue_l1_m9_6', 'aud_l1_m9_listen', 6, 'Pharmacist', 'You shouldn''t go to work. Take these twice a day, after food.'),
('cue_l1_m9_7', 'aud_l1_m9_listen', 7, 'Customer', 'Thank you. How much are they?'),
('cue_l1_m9_8', 'aud_l1_m9_listen', 8, 'Pharmacist', 'Three pounds twenty.');

INSERT INTO learning_items (id, unit_id, sequence, kind, title, body, audio_asset_id) VALUES
('itm_l1_m9_listening', 'unt_l1_m9', 4, 'listening', 'Listening 9 -- At the Pharmacy',
'LISTENING OBJECTIVES: Understand a health problem and advice; catch should for advice; recognise sympathetic intonation.

BEFORE YOU LISTEN: A customer describes a health problem to a pharmacist. Read the four questions first. Knowing what you are listening for is itself the skill being taught, and it is the difference between hearing words and understanding a conversation.

LISTEN TWICE: First for the general situation only -- who is speaking, where, and what they want. Do not stop to decode an unknown word; stopping is what makes learners miss the next sentence. Second time, answer the questions.

THEN: Read the synchronised transcript while listening a third time, and mark every place where what you heard and what is written surprised you. That gap is your own pronunciation target, identified by you rather than assigned to you.

SHADOWING: Record yourself speaking the customer''s description of the problem. Your recordings are kept attempt by attempt, so you can hear your own progress, and your instructor can reply in their own voice.', 'aud_l1_m9_listen'),
('itm_l1_m9_pronunciation', 'unt_l1_m9', 5, 'pronunciation', 'Pronunciation Lab 9 -- The /3:/ Vowel, Sympathetic Intonation & Modal Stress',
'HOW TO USE THIS LAB: For each target -- listen to the model, say it aloud three times, then record yourself and listen back. Listening back is the step learners skip and the step that works: you cannot correct a sound you have not heard yourself produce.

FOCUS THIS MODULE: The /3:/ vowel in hurts and the falling, warm contour that carries sympathy in English.

Your recordings are kept, so attempt one and attempt ten sit side by side. Your instructor can reply with a spoken model rather than only written notes.', 'aud_l1_m9_pron');

INSERT INTO pronunciation_targets (id, learning_item_id, sequence, focus, target, example, guidance) VALUES
('pron_l1_m9_1', 'itm_l1_m9_pronunciation', 1, 'phoneme', 'The /3:/ vowel', 'hurts; word; nurse; work', 'Lips relaxed and neutral, tongue in the middle of the mouth, and the sound is LONG. Replacing it with a short vowel makes hurt and hut sound the same.'),
('pron_l1_m9_2', 'itm_l1_m9_pronunciation', 2, 'intonation', 'Sympathy falls gently and slows', 'Oh DEAR. I''m SORry to hear that. (falling, slower)', 'A rise here sounds like surprise or disbelief. Warmth in English is carried by a gentle fall and a slower pace, not by extra words.'),
('pron_l1_m9_3', 'itm_l1_m9_pronunciation', 3, 'sentence_stress', 'should and shouldn''t in advice', 'You should DRINK plenty of water. You SHOULDN''T go to work.', 'As with can, the positive stresses the main verb and the negative stresses the modal. This is how advice and prohibition are told apart at speed.');

INSERT INTO quiz_questions (id, learning_item_id, sequence, prompt, choices_json, correct_index, audio_cue_id) VALUES
('qq_l1_m9_ls1', 'itm_l1_m9_listening', 1, 'What is the customer''s main problem?', '["A cold","A broken arm","A bad headache","A cough"]', 2, 'cue_l1_m9_2'),
('qq_l1_m9_ls2', 'itm_l1_m9_listening', 2, 'What else hurts?', '["Her throat","Her back","Her leg","Her ear"]', 0, 'cue_l1_m9_4'),
('qq_l1_m9_ls3', 'itm_l1_m9_listening', 3, 'What does the pharmacist advise?', '["Go to work","Take a long walk","Come back tomorrow","Drink water and rest"]', 3, 'cue_l1_m9_5'),
('qq_l1_m9_ls4', 'itm_l1_m9_listening', 4, 'How often should the customer take the medicine?', '["Once a day","Twice a day","Three times a day","Before food only"]', 1, 'cue_l1_m9_6');

-- ---------------------------------------------------------------------
-- Module 10: Review & Consolidation
-- ---------------------------------------------------------------------
INSERT INTO audio_assets (id, kind, title, transcript, variety, speaker_count, target_wpm) VALUES
('aud_l1_m10_listen', 'listening', 'A Week at the School', 'Good morning, everyone, and welcome to the school. | My name is Grace, and I work in the main office. It''s next to the library. | Classes start at nine o''clock every day and finish at half past three. | Last week the new students visited the city centre. They walked to the museum and had lunch in the park. | On Friday there is going to be a welcome party. It starts at six. | If you feel ill, you should tell your teacher. You shouldn''t come to class. | Are there any questions? My door is always open.', 'BrE', 1, 105),
('aud_l1_m10_pron', 'model_pronunciation', 'Module 10 Pronunciation Model', 'Classes start at nine o''clock. | They walked to the museum. | You should tell your teacher. | There is going to be a party.', 'BrE', 1, 90);

INSERT INTO audio_cues (id, audio_asset_id, sequence, speaker, text) VALUES
('cue_l1_m10_1', 'aud_l1_m10_listen', 1, 'Administrator', 'Good morning, everyone, and welcome to the school.'),
('cue_l1_m10_2', 'aud_l1_m10_listen', 2, 'Administrator', 'My name is Grace, and I work in the main office. It''s next to the library.'),
('cue_l1_m10_3', 'aud_l1_m10_listen', 3, 'Administrator', 'Classes start at nine o''clock every day and finish at half past three.'),
('cue_l1_m10_4', 'aud_l1_m10_listen', 4, 'Administrator', 'Last week the new students visited the city centre. They walked to the museum and had lunch in the park.'),
('cue_l1_m10_5', 'aud_l1_m10_listen', 5, 'Administrator', 'On Friday there is going to be a welcome party. It starts at six.'),
('cue_l1_m10_6', 'aud_l1_m10_listen', 6, 'Administrator', 'If you feel ill, you should tell your teacher. You shouldn''t come to class.'),
('cue_l1_m10_7', 'aud_l1_m10_listen', 7, 'Administrator', 'Are there any questions? My door is always open.');

INSERT INTO learning_items (id, unit_id, sequence, kind, title, body, audio_asset_id) VALUES
('itm_l1_m10_listening', 'unt_l1_m10', 4, 'listening', 'Listening 10 -- A Week at the School',
'LISTENING OBJECTIVES: Integrate every listening skill from Level I; follow a longer text with several speakers, times, places and past events.

BEFORE YOU LISTEN: This is the Level I cumulative listening. A school administrator describes the week to new students, drawing on all nine modules. Read the four questions first. Knowing what you are listening for is itself the skill being taught, and it is the difference between hearing words and understanding a conversation.

LISTEN TWICE: First for the general situation only -- who is speaking, where, and what they want. Do not stop to decode an unknown word; stopping is what makes learners miss the next sentence. Second time, answer the questions.

THEN: Read the synchronised transcript while listening a third time, and mark every place where what you heard and what is written surprised you. That gap is your own pronunciation target, identified by you rather than assigned to you.

SHADOWING: Record yourself speaking the whole announcement in sections, then all of it without stopping. Your recordings are kept attempt by attempt, so you can hear your own progress, and your instructor can reply in their own voice.', 'aud_l1_m10_listen'),
('itm_l1_m10_pronunciation', 'unt_l1_m10', 5, 'pronunciation', 'Pronunciation Lab 10 -- Level I Consolidation -- Endings, Weak Forms & Rhythm',
'HOW TO USE THIS LAB: For each target -- listen to the model, say it aloud three times, then record yourself and listen back. Listening back is the step learners skip and the step that works: you cannot correct a sound you have not heard yourself produce.

FOCUS THIS MODULE: Everything from the level, together: -s endings, -ed endings, weak forms, and the sounds most likely to reduce your intelligibility.

Your recordings are kept, so attempt one and attempt ten sit side by side. Your instructor can reply with a spoken model rather than only written notes.', 'aud_l1_m10_pron');

INSERT INTO pronunciation_targets (id, learning_item_id, sequence, focus, target, example, guidance) VALUES
('pron_l1_m10_1', 'itm_l1_m10_pronunciation', 1, 'phoneme', 'The level''s three ending rules together', 'works /s/, leaves /z/, watches /Iz/; walked /t/, played /d/, visited /Id/', 'Both rules follow the same logic: the sound BEFORE the ending decides. Getting these consistently right does more for intelligibility at A1 than any vowel.'),
('pron_l1_m10_2', 'itm_l1_m10_pronunciation', 2, 'connected_speech', 'Weak forms across a long text', 'was /wəz/, are /ə/, to /tə/, and /ən/', 'Small words shrink. A learner who expects every word at full strength hears English as impossibly fast; recognising weak forms is what makes normal speed become normal.'),
('pron_l1_m10_3', 'itm_l1_m10_pronunciation', 3, 'sentence_stress', 'Sustaining rhythm across a whole paragraph', 'CLASSES start at NINE and FINish at half past THREE.', 'Level I ends here: keeping stressed words on a steady beat while everything between them is compressed. This is the foundation every later level builds on.');

INSERT INTO quiz_questions (id, learning_item_id, sequence, prompt, choices_json, correct_index, audio_cue_id) VALUES
('qq_l1_m10_ls1', 'itm_l1_m10_listening', 1, 'Where does Grace work?', '["In the main office","In the library","In the museum","In the park"]', 0, 'cue_l1_m10_2'),
('qq_l1_m10_ls2', 'itm_l1_m10_listening', 2, 'What time do classes finish?', '["Three o''clock","Six o''clock","Half past three","Nine o''clock"]', 2, 'cue_l1_m10_3'),
('qq_l1_m10_ls3', 'itm_l1_m10_listening', 3, 'What did the new students do last week?', '["They had a party","They walked to the museum","They started classes","They visited the office"]', 1, 'cue_l1_m10_4'),
('qq_l1_m10_ls4', 'itm_l1_m10_listening', 4, 'What should you do if you feel ill?', '["Come to class anyway","Go to the party","Wait until Friday","Tell your teacher"]', 3, 'cue_l1_m10_6');

