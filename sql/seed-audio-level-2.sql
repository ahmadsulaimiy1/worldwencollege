-- WEC — Audio curriculum seed: Level II (Elementary, A2).
--
-- See sql/seed-audio-level-1.sql for the design rationale and
-- docs/lms-architecture.md § The audio layer for the schema.
--
-- WHAT IS REAL AND WHAT IS NOT: scripts, cue segmentation, speaker
-- attribution, comprehension questions and pronunciation targets are
-- complete authored curriculum. The RECORDINGS are not — every
-- media_url and every cue timing is NULL. Dropping in narration later
-- is an UPDATE, not a structural change.
--
-- A2 delivery is set at 105-115 wpm, up from Level I's 90-105 and
-- still below ~150 for natural conversation.

-- Re-sequence so the audio strand sits where the lessons assume it:
-- present -> practise -> listen -> pronounce -> test.
UPDATE learning_items SET sequence = 6 WHERE id LIKE 'itm_l2_m%_quiz';
UPDATE learning_items SET sequence = 7 WHERE id LIKE 'itm_l2_m%_assignment';
UPDATE learning_items SET sequence = 5 WHERE id = 'itm_l2_m10_examquiz';
UPDATE learning_items SET sequence = 6 WHERE id = 'itm_l2_m10_examassignment';

-- ---------------------------------------------------------------------
-- Module 1: Life Stories
-- ---------------------------------------------------------------------
INSERT INTO audio_assets (id, kind, title, transcript, variety, speaker_count, target_wpm) VALUES
('aud_l2_m1_listen', 'listening', 'How Priya Became a Nurse', 'Priya, how did you become a nurse? | Well, I used to work in an office. I didn''t enjoy it very much. | One afternoon I was walking home when I saw an accident in the street. | A woman was helping the injured man. She was completely calm. | While I was watching her, I realised what I wanted to do. | I started training the following year. That was eight years ago. | And do you ever regret it? | Never. It was the best decision I''ve made.', 'BrE', 2, 105),
('aud_l2_m1_pron', 'model_pronunciation', 'Module 1 Pronunciation Model', 'I used to work in an office. | I was walking home. | While I was watching her... | That was eight years ago.', 'BrE', 1, 90);

INSERT INTO audio_cues (id, audio_asset_id, sequence, speaker, text) VALUES
('cue_l2_m1_1', 'aud_l2_m1_listen', 1, 'Interviewer', 'Priya, how did you become a nurse?'),
('cue_l2_m1_2', 'aud_l2_m1_listen', 2, 'Priya', 'Well, I used to work in an office. I didn''t enjoy it very much.'),
('cue_l2_m1_3', 'aud_l2_m1_listen', 3, 'Priya', 'One afternoon I was walking home when I saw an accident in the street.'),
('cue_l2_m1_4', 'aud_l2_m1_listen', 4, 'Priya', 'A woman was helping the injured man. She was completely calm.'),
('cue_l2_m1_5', 'aud_l2_m1_listen', 5, 'Priya', 'While I was watching her, I realised what I wanted to do.'),
('cue_l2_m1_6', 'aud_l2_m1_listen', 6, 'Priya', 'I started training the following year. That was eight years ago.'),
('cue_l2_m1_7', 'aud_l2_m1_listen', 7, 'Interviewer', 'And do you ever regret it?'),
('cue_l2_m1_8', 'aud_l2_m1_listen', 8, 'Priya', 'Never. It was the best decision I''ve made.');

INSERT INTO learning_items (id, unit_id, sequence, kind, title, body, audio_asset_id) VALUES
('itm_l2_m1_listening', 'unt_l2_m1', 4, 'listening', 'Listening 1 — How Priya Became a Nurse',
'LISTENING OBJECTIVES: Follow a personal narrative across several years; distinguish used to from the past simple; hear when a background action is interrupted.

BEFORE YOU LISTEN: Priya tells an interviewer how she chose her career. Read the four questions first. Knowing what you are listening for is itself the skill being taught, and it is the difference between hearing words and understanding a conversation.

LISTEN TWICE: First for the general situation only — who is speaking, where, and what they want. Do not stop to decode an unknown word; stopping is what makes learners miss the next sentence. Second time, answer the questions.

THEN: Read the synchronised transcript while listening a third time, and mark every place where what you heard and what is written surprised you. That gap is your own pronunciation target, identified by you rather than assigned to you.

SHADOWING: Record yourself speaking Priya''s account of the day she changed her mind. Your recordings are kept attempt by attempt, so you can hear your own progress, and your instructor can reply in their own voice.', 'aud_l2_m1_listen'),
('itm_l2_m1_pronunciation', 'unt_l2_m1', 5, 'pronunciation', 'Pronunciation Lab 1 — Used To, Weak Past Forms & Interrupted Actions',
'HOW TO USE THIS LAB: For each target — listen to the model, say it aloud three times, then record yourself and listen back. Listening back is the step learners skip and the step that works: you cannot correct a sound you have not heard yourself produce.

FOCUS THIS MODULE: The weak forms of used to and was/were, which carry the grammar of this module and are almost inaudible at speed.

Your recordings are kept, so attempt one and attempt ten sit side by side. Your instructor can reply with a spoken model rather than only written notes.', 'aud_l2_m1_pron');

INSERT INTO pronunciation_targets (id, learning_item_id, sequence, focus, target, example, guidance) VALUES
('pron_l2_m1_1', 'itm_l2_m1_pronunciation', 1, 'connected_speech', 'used to -> /ˈjuːstə/', 'I used to work in an office.', 'The d disappears entirely and to reduces. Learners who listen for a clear "used TO" miss the structure completely, and with it the whole meaning of a past habit.'),
('pron_l2_m1_2', 'itm_l2_m1_pronunciation', 2, 'phoneme', 'was and were in their weak forms', 'I was /wəz/ walking. They were /wə/ helping.', 'Unstressed, these almost vanish. They only take their strong form in short answers — "Yes, I WAS" — and knowing that is how you tell a past continuous from a present.'),
('pron_l2_m1_3', 'itm_l2_m1_pronunciation', 3, 'intonation', 'An interrupted action drops, the interruption rises then falls', 'I was WALKing home // when I SAW an ACcident.', 'The two clauses form two groups. The junction at when is where the listener understands that one action cut across another.');

INSERT INTO quiz_questions (id, learning_item_id, sequence, prompt, choices_json, correct_index, audio_cue_id) VALUES
('qq_l2_m1_ls1', 'itm_l2_m1_listening', 1, 'What did Priya do before nursing?', '["She was a student","She worked in an office","She worked in a hospital","She was a teacher"]', 1, 'cue_l2_m1_2'),
('qq_l2_m1_ls2', 'itm_l2_m1_listening', 2, 'What was she doing when she saw the accident?', '["Driving home","Working late","Waiting for a bus","Walking home"]', 3, 'cue_l2_m1_3'),
('qq_l2_m1_ls3', 'itm_l2_m1_listening', 3, 'What impressed Priya about the woman helping?', '["She was a doctor","She was very fast","She was completely calm","She knew the man"]', 2, 'cue_l2_m1_4'),
('qq_l2_m1_ls4', 'itm_l2_m1_listening', 4, 'How long ago did Priya start training?', '["Eight years","Two years","Five years","Seven years"]', 0, 'cue_l2_m1_6');

-- ---------------------------------------------------------------------
-- Module 2: Travel & Transport
-- ---------------------------------------------------------------------
INSERT INTO audio_assets (id, kind, title, transcript, variety, speaker_count, target_wpm) VALUES
('aud_l2_m2_listen', 'listening', 'Missing the Connection', 'The sixteen forty service to Manchester has been delayed by thirty minutes. | Excuse me, I''ve missed my connection. What should I do? | Where are you travelling to? | To Leeds. My ticket was for the sixteen fifteen. | Don''t worry. There''s another train at seventeen thirty from platform thirteen. | Platform thirty? | Thirteen. One-three. Your ticket is still valid — just show it to the guard. | Thank you, that''s a relief.', 'BrE', 3, 108),
('aud_l2_m2_pron', 'model_pronunciation', 'Module 2 Pronunciation Model', 'The sixteen forty service. | Platform thirteen. | I''ve missed my connection. | Is this ticket still valid?', 'BrE', 1, 93);

INSERT INTO audio_cues (id, audio_asset_id, sequence, speaker, text) VALUES
('cue_l2_m2_1', 'aud_l2_m2_listen', 1, 'Announcement', 'The sixteen forty service to Manchester has been delayed by thirty minutes.'),
('cue_l2_m2_2', 'aud_l2_m2_listen', 2, 'Traveller', 'Excuse me, I''ve missed my connection. What should I do?'),
('cue_l2_m2_3', 'aud_l2_m2_listen', 3, 'Assistant', 'Where are you travelling to?'),
('cue_l2_m2_4', 'aud_l2_m2_listen', 4, 'Traveller', 'To Leeds. My ticket was for the sixteen fifteen.'),
('cue_l2_m2_5', 'aud_l2_m2_listen', 5, 'Assistant', 'Don''t worry. There''s another train at seventeen thirty from platform thirteen.'),
('cue_l2_m2_6', 'aud_l2_m2_listen', 6, 'Traveller', 'Platform thirty?'),
('cue_l2_m2_7', 'aud_l2_m2_listen', 7, 'Assistant', 'Thirteen. One-three. Your ticket is still valid — just show it to the guard.'),
('cue_l2_m2_8', 'aud_l2_m2_listen', 8, 'Traveller', 'Thank you, that''s a relief.');

INSERT INTO learning_items (id, unit_id, sequence, kind, title, body, audio_asset_id) VALUES
('itm_l2_m2_listening', 'unt_l2_m2', 4, 'listening', 'Listening 2 — Missing the Connection',
'LISTENING OBJECTIVES: Follow travel announcements and a service enquiry; catch platform numbers and times under pressure; recognise British transport vocabulary.

BEFORE YOU LISTEN: A traveller has missed a connection and speaks to a station assistant. Read the four questions first. Knowing what you are listening for is itself the skill being taught, and it is the difference between hearing words and understanding a conversation.

LISTEN TWICE: First for the general situation only — who is speaking, where, and what they want. Do not stop to decode an unknown word; stopping is what makes learners miss the next sentence. Second time, answer the questions.

THEN: Read the synchronised transcript while listening a third time, and mark every place where what you heard and what is written surprised you. That gap is your own pronunciation target, identified by you rather than assigned to you.

SHADOWING: Record yourself speaking the traveller''s enquiry, keeping the polite rise. Your recordings are kept attempt by attempt, so you can hear your own progress, and your instructor can reply in their own voice.', 'aud_l2_m2_listen'),
('itm_l2_m2_pronunciation', 'unt_l2_m2', 5, 'pronunciation', 'Pronunciation Lab 2 — Teen and Ty, Announcement Rhythm & Checking Back',
'HOW TO USE THIS LAB: For each target — listen to the model, say it aloud three times, then record yourself and listen back. Listening back is the step learners skip and the step that works: you cannot correct a sound you have not heard yourself produce.

FOCUS THIS MODULE: Numbers under time pressure — the thirteen/thirty contrast that causes real missed trains.

Your recordings are kept, so attempt one and attempt ten sit side by side. Your instructor can reply with a spoken model rather than only written notes.', 'aud_l2_m2_pron');

INSERT INTO pronunciation_targets (id, learning_item_id, sequence, focus, target, example, guidance) VALUES
('pron_l2_m2_1', 'itm_l2_m2_pronunciation', 1, 'word_stress', '-teen vs -ty', 'thirTEEN vs THIRty; fifTEEN vs FIFty', '-teen numbers stress the second syllable and end with a clear /n/; -ty numbers stress the first and end in a short vowel. Confusing them is the commonest cause of a genuinely missed train.'),
('pron_l2_m2_2', 'itm_l2_m2_pronunciation', 2, 'connected_speech', 'Announcement rhythm is slower and over-articulated', 'The sixTEEN FORty service to MANchester', 'Public-address English is deliberately slowed and chunked. Practising at this pace first makes normal speed easier afterwards, not harder.'),
('pron_l2_m2_3', 'itm_l2_m2_pronunciation', 3, 'intonation', 'Checking back rises steeply', 'Platform THIRty? (sharp rise)', 'A steep rise signals "I am not sure I heard that correctly" and invites repetition. It is a repair strategy, and using it is a skill, not a failure.');

INSERT INTO quiz_questions (id, learning_item_id, sequence, prompt, choices_json, correct_index, audio_cue_id) VALUES
('qq_l2_m2_ls1', 'itm_l2_m2_listening', 1, 'Why is the traveller worried?', '["They have missed a connection","The train is cancelled","They lost their ticket","They are on the wrong platform"]', 0, 'cue_l2_m2_2'),
('qq_l2_m2_ls2', 'itm_l2_m2_listening', 2, 'Where is the traveller going?', '["Manchester","London","Leeds","York"]', 2, 'cue_l2_m2_4'),
('qq_l2_m2_ls3', 'itm_l2_m2_listening', 3, 'Which platform does the next train leave from?', '["Thirty","Thirteen","Three","Thirty-three"]', 1, 'cue_l2_m2_5'),
('qq_l2_m2_ls4', 'itm_l2_m2_listening', 4, 'What must the traveller do with the existing ticket?', '["Buy a new one","Exchange it at the desk","Nothing at all","Show it to the guard"]', 3, 'cue_l2_m2_7');

-- ---------------------------------------------------------------------
-- Module 3: Work & Study
-- ---------------------------------------------------------------------
INSERT INTO audio_assets (id, kind, title, transcript, variety, speaker_count, target_wpm) VALUES
('aud_l2_m3_listen', 'listening', 'A First Day at Work', 'Welcome, Tomas. Let me explain how things work here. | Thank you. What time do I start? | You start at half past eight and finish at five. You get an hour for lunch. | In the morning you answer the phone and deal with emails. | In the afternoon you work with Ana on the reports. She knows the system very well. | Do I need to wear a uniform? | No, but we don''t wear jeans. Smart casual is fine. | Understood. And who do I ask if I have a problem? | Ask me, or Ana if I''m out.', 'BrE', 2, 108),
('aud_l2_m3_pron', 'model_pronunciation', 'Module 3 Pronunciation Model', 'I start at half past eight. | She knows the system. | Do I need a uniform? | Ask me if you have a problem.', 'BrE', 1, 93);

INSERT INTO audio_cues (id, audio_asset_id, sequence, speaker, text) VALUES
('cue_l2_m3_1', 'aud_l2_m3_listen', 1, 'Manager', 'Welcome, Tomas. Let me explain how things work here.'),
('cue_l2_m3_2', 'aud_l2_m3_listen', 2, 'Tomas', 'Thank you. What time do I start?'),
('cue_l2_m3_3', 'aud_l2_m3_listen', 3, 'Manager', 'You start at half past eight and finish at five. You get an hour for lunch.'),
('cue_l2_m3_4', 'aud_l2_m3_listen', 4, 'Manager', 'In the morning you answer the phone and deal with emails.'),
('cue_l2_m3_5', 'aud_l2_m3_listen', 5, 'Manager', 'In the afternoon you work with Ana on the reports. She knows the system very well.'),
('cue_l2_m3_6', 'aud_l2_m3_listen', 6, 'Tomas', 'Do I need to wear a uniform?'),
('cue_l2_m3_7', 'aud_l2_m3_listen', 7, 'Manager', 'No, but we don''t wear jeans. Smart casual is fine.'),
('cue_l2_m3_8', 'aud_l2_m3_listen', 8, 'Tomas', 'Understood. And who do I ask if I have a problem?'),
('cue_l2_m3_9', 'aud_l2_m3_listen', 9, 'Manager', 'Ask me, or Ana if I''m out.');

INSERT INTO learning_items (id, unit_id, sequence, kind, title, body, audio_asset_id) VALUES
('itm_l2_m3_listening', 'unt_l2_m3', 4, 'listening', 'Listening 3 — A First Day at Work',
'LISTENING OBJECTIVES: Follow workplace instructions; understand a sequence of responsibilities; distinguish state verbs used in simple form.

BEFORE YOU LISTEN: A manager explains the job to a new employee. Read the four questions first. Knowing what you are listening for is itself the skill being taught, and it is the difference between hearing words and understanding a conversation.

LISTEN TWICE: First for the general situation only — who is speaking, where, and what they want. Do not stop to decode an unknown word; stopping is what makes learners miss the next sentence. Second time, answer the questions.

THEN: Read the synchronised transcript while listening a third time, and mark every place where what you heard and what is written surprised you. That gap is your own pronunciation target, identified by you rather than assigned to you.

SHADOWING: Record yourself speaking the new employee''s questions. Your recordings are kept attempt by attempt, so you can hear your own progress, and your instructor can reply in their own voice.', 'aud_l2_m3_listen'),
('itm_l2_m3_pronunciation', 'unt_l2_m3', 5, 'pronunciation', 'Pronunciation Lab 3 — Final Clusters, D''you Reduction & Instruction Stress',
'HOW TO USE THIS LAB: For each target — listen to the model, say it aloud three times, then record yourself and listen back. Listening back is the step learners skip and the step that works: you cannot correct a sound you have not heard yourself produce.

FOCUS THIS MODULE: Consonant clusters at the ends of words — asked, worked, next — where learners typically drop the final sound.

Your recordings are kept, so attempt one and attempt ten sit side by side. Your instructor can reply with a spoken model rather than only written notes.', 'aud_l2_m3_pron');

INSERT INTO pronunciation_targets (id, learning_item_id, sequence, focus, target, example, guidance) VALUES
('pron_l2_m3_1', 'itm_l2_m3_pronunciation', 1, 'phoneme', 'Final consonant clusters', 'asked /ɑːskt/; worked; next; helped', 'Three consonants can meet at the end of an English word. Dropping the last one turns asked into ask and loses the past tense entirely — a grammar error caused purely by pronunciation.'),
('pron_l2_m3_2', 'itm_l2_m3_pronunciation', 2, 'connected_speech', 'Do you -> /dʒə/ in questions', 'D''you need a uniform? What time d''you start?', 'This reduction is standard in ordinary speech. Recognising it is essential; learners often fail to notice a question has been asked at all.'),
('pron_l2_m3_3', 'itm_l2_m3_pronunciation', 3, 'sentence_stress', 'Instructions stress the new information', 'You START at half past EIGHT and FINish at FIVE.', 'In a list of duties the times and the verbs carry the meaning. Flat delivery makes an instruction sound optional.');

INSERT INTO quiz_questions (id, learning_item_id, sequence, prompt, choices_json, correct_index, audio_cue_id) VALUES
('qq_l2_m3_ls1', 'itm_l2_m3_listening', 1, 'What time does Tomas finish work?', '["Half past four","Five o''clock","Half past five","Six o''clock"]', 1, 'cue_l2_m3_3'),
('qq_l2_m3_ls2', 'itm_l2_m3_listening', 2, 'What does he do in the mornings?', '["Write reports","Work with Ana","Attend meetings","Answer the phone and deal with emails"]', 3, 'cue_l2_m3_4'),
('qq_l2_m3_ls3', 'itm_l2_m3_listening', 3, 'What must he NOT wear?', '["A uniform","A tie","Jeans","Trainers"]', 2, 'cue_l2_m3_7'),
('qq_l2_m3_ls4', 'itm_l2_m3_listening', 4, 'Who should he ask if the manager is out?', '["Ana","Nobody","The receptionist","Another new employee"]', 0, 'cue_l2_m3_9');

-- ---------------------------------------------------------------------
-- Module 4: Likes, Dislikes & Opinions
-- ---------------------------------------------------------------------
INSERT INTO audio_assets (id, kind, title, transcript, variety, speaker_count, target_wpm) VALUES
('aud_l2_m4_listen', 'listening', 'Choosing a Film', 'Shall we watch the new science fiction film? | Hmm. I''m not really keen on science fiction, to be honest. | Really? I love it. What about you, Marco? | I don''t mind either way. I quite like comedies. | I see your point about the special effects, but I find the stories quite weak. | That''s fair. Shall we compromise and watch the comedy? | That sounds good to me. | Fine by me. I''ll make the popcorn.', 'BrE', 3, 110),
('aud_l2_m4_pron', 'model_pronunciation', 'Module 4 Pronunciation Model', 'I''m not really keen on it. | I don''t mind either way. | I see your point, but... | That sounds good to me.', 'BrE', 1, 95);

INSERT INTO audio_cues (id, audio_asset_id, sequence, speaker, text) VALUES
('cue_l2_m4_1', 'aud_l2_m4_listen', 1, 'Yusuf', 'Shall we watch the new science fiction film?'),
('cue_l2_m4_2', 'aud_l2_m4_listen', 2, 'Lena', 'Hmm. I''m not really keen on science fiction, to be honest.'),
('cue_l2_m4_3', 'aud_l2_m4_listen', 3, 'Yusuf', 'Really? I love it. What about you, Marco?'),
('cue_l2_m4_4', 'aud_l2_m4_listen', 4, 'Marco', 'I don''t mind either way. I quite like comedies.'),
('cue_l2_m4_5', 'aud_l2_m4_listen', 5, 'Lena', 'I see your point about the special effects, but I find the stories quite weak.'),
('cue_l2_m4_6', 'aud_l2_m4_listen', 6, 'Yusuf', 'That''s fair. Shall we compromise and watch the comedy?'),
('cue_l2_m4_7', 'aud_l2_m4_listen', 7, 'Lena', 'That sounds good to me.'),
('cue_l2_m4_8', 'aud_l2_m4_listen', 8, 'Marco', 'Fine by me. I''ll make the popcorn.');

INSERT INTO learning_items (id, unit_id, sequence, kind, title, body, audio_asset_id) VALUES
('itm_l2_m4_listening', 'unt_l2_m4', 4, 'listening', 'Listening 4 — Choosing a Film',
'LISTENING OBJECTIVES: Follow an exchange of opinions; recognise degrees of agreement and disagreement; catch polite disagreement.

BEFORE YOU LISTEN: Three friends are deciding what to watch. Read the four questions first. Knowing what you are listening for is itself the skill being taught, and it is the difference between hearing words and understanding a conversation.

LISTEN TWICE: First for the general situation only — who is speaking, where, and what they want. Do not stop to decode an unknown word; stopping is what makes learners miss the next sentence. Second time, answer the questions.

THEN: Read the synchronised transcript while listening a third time, and mark every place where what you heard and what is written surprised you. That gap is your own pronunciation target, identified by you rather than assigned to you.

SHADOWING: Record yourself speaking the polite disagreement, keeping it warm rather than blunt. Your recordings are kept attempt by attempt, so you can hear your own progress, and your instructor can reply in their own voice.', 'aud_l2_m4_listen'),
('itm_l2_m4_pronunciation', 'unt_l2_m4', 5, 'pronunciation', 'Pronunciation Lab 4 — The Melody of Disagreement, Hedges & Concession',
'HOW TO USE THIS LAB: For each target — listen to the model, say it aloud three times, then record yourself and listen back. Listening back is the step learners skip and the step that works: you cannot correct a sound you have not heard yourself produce.

FOCUS THIS MODULE: The melody of disagreement — how English softens a No with pitch before it softens it with words.

Your recordings are kept, so attempt one and attempt ten sit side by side. Your instructor can reply with a spoken model rather than only written notes.', 'aud_l2_m4_pron');

INSERT INTO pronunciation_targets (id, learning_item_id, sequence, focus, target, example, guidance) VALUES
('pron_l2_m4_1', 'itm_l2_m4_pronunciation', 1, 'intonation', 'Disagreement starts high and falls gently', 'HMM. I''m not REALly keen on it, to be HONest.', 'English softens disagreement with melody first. A flat "I don''t like it" is heard as blunt even when the words are mild — the tune is doing the politeness.'),
('pron_l2_m4_2', 'itm_l2_m4_pronunciation', 2, 'connected_speech', 'Hedges reduce almost to nothing', 'to be honest -> /təbiˈɒnɪst/; sort of -> /ˈsɔːtəv/', 'These softeners are unstressed and fast. Missing them means hearing a much stronger opinion than the speaker actually gave.'),
('pron_l2_m4_3', 'itm_l2_m4_pronunciation', 3, 'sentence_stress', 'Concession stresses the contrast word', 'I see your POINT, BUT I find the stories WEAK.', 'The stress lands on but and on the criticism. This is the rhythm of English concession, and hearing it tells you a disagreement is coming before the words arrive.');

INSERT INTO quiz_questions (id, learning_item_id, sequence, prompt, choices_json, correct_index, audio_cue_id) VALUES
('qq_l2_m4_ls1', 'itm_l2_m4_listening', 1, 'How does Lena feel about science fiction?', '["She is not keen on it","She loves it","She has never seen any","She prefers it to comedy"]', 0, 'cue_l2_m4_2'),
('qq_l2_m4_ls2', 'itm_l2_m4_listening', 2, 'What does Marco prefer?', '["Science fiction","Documentaries","Comedies","He has no preference at all"]', 2, 'cue_l2_m4_4'),
('qq_l2_m4_ls3', 'itm_l2_m4_listening', 3, 'What is Lena''s criticism of science fiction?', '["The effects are poor","The stories are weak","The films are too long","The acting is bad"]', 1, 'cue_l2_m4_5'),
('qq_l2_m4_ls4', 'itm_l2_m4_listening', 4, 'What do they finally decide to watch?', '["The science fiction film","A documentary","Nothing","A comedy"]', 3, 'cue_l2_m4_6');

-- ---------------------------------------------------------------------
-- Module 5: Making Plans
-- ---------------------------------------------------------------------
INSERT INTO audio_assets (id, kind, title, transcript, variety, speaker_count, target_wpm) VALUES
('aud_l2_m5_listen', 'listening', 'Arranging the Weekend', 'Are you doing anything on Saturday? | I''m meeting my brother at eleven, but I''m free after that. | Great. I''m going to visit the new gallery. Do you want to come? | I''d love to. What time does it open? | Ten, I think. Shall we meet at the entrance at half past twelve? | Actually, let''s make it one. My brother is always late. | Fine. I''ll text you if anything changes. | Perfect. See you Saturday.', 'BrE', 2, 110),
('aud_l2_m5_pron', 'model_pronunciation', 'Module 5 Pronunciation Model', 'I''m meeting my brother at eleven. | I''m going to visit the gallery. | Shall we meet at half past twelve? | I''ll text you.', 'BrE', 1, 95);

INSERT INTO audio_cues (id, audio_asset_id, sequence, speaker, text) VALUES
('cue_l2_m5_1', 'aud_l2_m5_listen', 1, 'Sara', 'Are you doing anything on Saturday?'),
('cue_l2_m5_2', 'aud_l2_m5_listen', 2, 'Dan', 'I''m meeting my brother at eleven, but I''m free after that.'),
('cue_l2_m5_3', 'aud_l2_m5_listen', 3, 'Sara', 'Great. I''m going to visit the new gallery. Do you want to come?'),
('cue_l2_m5_4', 'aud_l2_m5_listen', 4, 'Dan', 'I''d love to. What time does it open?'),
('cue_l2_m5_5', 'aud_l2_m5_listen', 5, 'Sara', 'Ten, I think. Shall we meet at the entrance at half past twelve?'),
('cue_l2_m5_6', 'aud_l2_m5_listen', 6, 'Dan', 'Actually, let''s make it one. My brother is always late.'),
('cue_l2_m5_7', 'aud_l2_m5_listen', 7, 'Sara', 'Fine. I''ll text you if anything changes.'),
('cue_l2_m5_8', 'aud_l2_m5_listen', 8, 'Dan', 'Perfect. See you Saturday.');

INSERT INTO learning_items (id, unit_id, sequence, kind, title, body, audio_asset_id) VALUES
('itm_l2_m5_listening', 'unt_l2_m5', 4, 'listening', 'Listening 5 — Arranging the Weekend',
'LISTENING OBJECTIVES: Distinguish arrangements, intentions and spontaneous decisions; catch times and places in an informal exchange.

BEFORE YOU LISTEN: Two friends arrange to meet, changing the plan as they go. Read the four questions first. Knowing what you are listening for is itself the skill being taught, and it is the difference between hearing words and understanding a conversation.

LISTEN TWICE: First for the general situation only — who is speaking, where, and what they want. Do not stop to decode an unknown word; stopping is what makes learners miss the next sentence. Second time, answer the questions.

THEN: Read the synchronised transcript while listening a third time, and mark every place where what you heard and what is written surprised you. That gap is your own pronunciation target, identified by you rather than assigned to you.

SHADOWING: Record yourself speaking the whole exchange, taking both roles. Your recordings are kept attempt by attempt, so you can hear your own progress, and your instructor can reply in their own voice.', 'aud_l2_m5_listen'),
('itm_l2_m5_pronunciation', 'unt_l2_m5', 5, 'pronunciation', 'Pronunciation Lab 5 — Future Reductions, Arrangement Stress & Suggesting',
'HOW TO USE THIS LAB: For each target — listen to the model, say it aloud three times, then record yourself and listen back. Listening back is the step learners skip and the step that works: you cannot correct a sound you have not heard yourself produce.

FOCUS THIS MODULE: The three future forms and how their stress differs, plus the shall/''ll reduction.

Your recordings are kept, so attempt one and attempt ten sit side by side. Your instructor can reply with a spoken model rather than only written notes.', 'aud_l2_m5_pron');

INSERT INTO pronunciation_targets (id, learning_item_id, sequence, focus, target, example, guidance) VALUES
('pron_l2_m5_1', 'itm_l2_m5_pronunciation', 1, 'connected_speech', 'I''ll and shall we reduce heavily', 'I''ll text you -> /aɪl/; Shall we -> /ʃəwi/', 'The future in speech is often just one extra consonant. Learners listening for a whole word will hear the present tense and misunderstand when something is happening.'),
('pron_l2_m5_2', 'itm_l2_m5_pronunciation', 2, 'sentence_stress', 'Present continuous for arrangements stresses the activity', 'I''m MEETing my BROTHer at eLEVen.', 'An arrangement stresses what and when. Compare a spontaneous decision — "I''ll TEXT you" — where the stress falls on the new verb.'),
('pron_l2_m5_3', 'itm_l2_m5_pronunciation', 3, 'intonation', 'Suggestions rise; corrections fall', 'Shall we meet at TWELVE? (up) — Actually, let''s make it ONE. (down)', 'A rising suggestion invites agreement; a falling correction takes it back gently. This pair is the whole grammar of negotiating a plan.');

INSERT INTO quiz_questions (id, learning_item_id, sequence, prompt, choices_json, correct_index, audio_cue_id) VALUES
('qq_l2_m5_ls1', 'itm_l2_m5_listening', 1, 'What is Dan already doing on Saturday morning?', '["Visiting a gallery","Working","Meeting his brother","Nothing"]', 2, 'cue_l2_m5_2'),
('qq_l2_m5_ls2', 'itm_l2_m5_listening', 2, 'What does Sara intend to do?', '["Visit the new gallery","Meet Dan''s brother","Go shopping","Stay at home"]', 0, 'cue_l2_m5_3'),
('qq_l2_m5_ls3', 'itm_l2_m5_listening', 3, 'What time do they finally agree to meet?', '["Half past twelve","Eleven","Ten","One o''clock"]', 3, 'cue_l2_m5_6'),
('qq_l2_m5_ls4', 'itm_l2_m5_listening', 4, 'What will Sara do if the plan changes?', '["Phone Dan","Text Dan","Email Dan","Nothing"]', 1, 'cue_l2_m5_7');

-- ---------------------------------------------------------------------
-- Module 6: Homes & Neighbourhoods
-- ---------------------------------------------------------------------
INSERT INTO audio_assets (id, kind, title, transcript, variety, speaker_count, target_wpm) VALUES
('aud_l2_m6_listen', 'listening', 'Two Flats', 'I''ve seen two flats and I can''t decide. | Tell me about them. | The first one is bigger and much brighter, but it''s further from the station. | The second is smaller and a bit darker, but it''s cheaper and it''s only five minutes'' walk. | Which neighbourhood is nicer? | The second, definitely. It''s quieter, and there''s a lovely park nearby. | Then the second sounds better overall. | I think you''re right. It''s the most sensible choice.', 'BrE', 2, 110),
('aud_l2_m6_pron', 'model_pronunciation', 'Module 6 Pronunciation Model', 'It''s bigger than the other one. | It''s much brighter. | It''s the most sensible choice. | There''s a park nearby.', 'BrE', 1, 95);

INSERT INTO audio_cues (id, audio_asset_id, sequence, speaker, text) VALUES
('cue_l2_m6_1', 'aud_l2_m6_listen', 1, 'Nadia', 'I''ve seen two flats and I can''t decide.'),
('cue_l2_m6_2', 'aud_l2_m6_listen', 2, 'Friend', 'Tell me about them.'),
('cue_l2_m6_3', 'aud_l2_m6_listen', 3, 'Nadia', 'The first one is bigger and much brighter, but it''s further from the station.'),
('cue_l2_m6_4', 'aud_l2_m6_listen', 4, 'Nadia', 'The second is smaller and a bit darker, but it''s cheaper and it''s only five minutes'' walk.'),
('cue_l2_m6_5', 'aud_l2_m6_listen', 5, 'Friend', 'Which neighbourhood is nicer?'),
('cue_l2_m6_6', 'aud_l2_m6_listen', 6, 'Nadia', 'The second, definitely. It''s quieter, and there''s a lovely park nearby.'),
('cue_l2_m6_7', 'aud_l2_m6_listen', 7, 'Friend', 'Then the second sounds better overall.'),
('cue_l2_m6_8', 'aud_l2_m6_listen', 8, 'Nadia', 'I think you''re right. It''s the most sensible choice.');

INSERT INTO learning_items (id, unit_id, sequence, kind, title, body, audio_asset_id) VALUES
('itm_l2_m6_listening', 'unt_l2_m6', 4, 'listening', 'Listening 6 — Two Flats',
'LISTENING OBJECTIVES: Follow a comparison between two places; catch comparative and superlative forms; hear than in its weak form.

BEFORE YOU LISTEN: A woman describes two flats she is choosing between. Read the four questions first. Knowing what you are listening for is itself the skill being taught, and it is the difference between hearing words and understanding a conversation.

LISTEN TWICE: First for the general situation only — who is speaking, where, and what they want. Do not stop to decode an unknown word; stopping is what makes learners miss the next sentence. Second time, answer the questions.

THEN: Read the synchronised transcript while listening a third time, and mark every place where what you heard and what is written surprised you. That gap is your own pronunciation target, identified by you rather than assigned to you.

SHADOWING: Record yourself speaking her comparison of the two flats. Your recordings are kept attempt by attempt, so you can hear your own progress, and your instructor can reply in their own voice.', 'aud_l2_m6_listen'),
('itm_l2_m6_pronunciation', 'unt_l2_m6', 5, 'pronunciation', 'Pronunciation Lab 6 — The Schwa, Weak Than & Comparative Stress',
'HOW TO USE THIS LAB: For each target — listen to the model, say it aloud three times, then record yourself and listen back. Listening back is the step learners skip and the step that works: you cannot correct a sound you have not heard yourself produce.

FOCUS THIS MODULE: The weak form of than and the schwa, the most frequent vowel in English and the one learners most often over-pronounce.

Your recordings are kept, so attempt one and attempt ten sit side by side. Your instructor can reply with a spoken model rather than only written notes.', 'aud_l2_m6_pron');

INSERT INTO pronunciation_targets (id, learning_item_id, sequence, focus, target, example, guidance) VALUES
('pron_l2_m6_1', 'itm_l2_m6_pronunciation', 1, 'phoneme', 'The schwa /ə/ — the most common vowel in English', 'bigger /ˈbɪɡə/; brighter; quieter; nearer', 'Every unstressed syllable tends towards this one neutral sound. Pronouncing the spelled vowel instead is what makes careful speech sound unnatural and, oddly, harder to follow.'),
('pron_l2_m6_2', 'itm_l2_m6_pronunciation', 2, 'connected_speech', 'than reduces to /ðən/ or even /ðn/', 'bigger than that -> /ˈbɪɡəðn ðæt/', 'In comparisons than nearly disappears. It is grammatically essential and phonetically almost absent — a combination that makes comparatives hard to hear.'),
('pron_l2_m6_3', 'itm_l2_m6_pronunciation', 3, 'word_stress', 'Superlatives keep stress on the adjective', 'the most SENsible choice; the QUIEtest street', 'Most and -est are grammatical, not informational, so they stay unstressed. Stressing them sounds like an argument rather than a description.');

INSERT INTO quiz_questions (id, learning_item_id, sequence, prompt, choices_json, correct_index, audio_cue_id) VALUES
('qq_l2_m6_ls1', 'itm_l2_m6_listening', 1, 'What is the advantage of the first flat?', '["It is cheaper","It is bigger and brighter","It is near the station","It is quieter"]', 1, 'cue_l2_m6_3'),
('qq_l2_m6_ls2', 'itm_l2_m6_listening', 2, 'How far is the second flat from the station?', '["Fifteen minutes'' walk","Fifty minutes'' walk","She does not say","Five minutes'' walk"]', 3, 'cue_l2_m6_4'),
('qq_l2_m6_ls3', 'itm_l2_m6_listening', 3, 'Which neighbourhood does Nadia prefer?', '["The first","Neither","The second","She cannot decide"]', 2, 'cue_l2_m6_6'),
('qq_l2_m6_ls4', 'itm_l2_m6_listening', 4, 'What is near the second flat?', '["A park","A station","A school","A shopping centre"]', 0, 'cue_l2_m6_6');

-- ---------------------------------------------------------------------
-- Module 7: Food, Health & Habits
-- ---------------------------------------------------------------------
INSERT INTO audio_assets (id, kind, title, transcript, variety, speaker_count, target_wpm) VALUES
('aud_l2_m7_listen', 'listening', 'A Check-Up', 'How have you been feeling generally? | Quite tired, actually. I don''t sleep very well. | How often do you exercise? | Hardly ever. Maybe once a month. | And how much coffee do you drink? | Four or five cups a day. Sometimes more. | That''s probably part of the problem. Try to cut down gradually. | And you should walk for twenty minutes every day. It''s simpler than joining a gym. | I''ll try. Thank you.', 'BrE', 2, 110),
('aud_l2_m7_pron', 'model_pronunciation', 'Module 7 Pronunciation Model', 'How often do you exercise? | Hardly ever. | Four or five cups a day. | You should cut down gradually.', 'BrE', 1, 95);

INSERT INTO audio_cues (id, audio_asset_id, sequence, speaker, text) VALUES
('cue_l2_m7_1', 'aud_l2_m7_listen', 1, 'Doctor', 'How have you been feeling generally?'),
('cue_l2_m7_2', 'aud_l2_m7_listen', 2, 'Patient', 'Quite tired, actually. I don''t sleep very well.'),
('cue_l2_m7_3', 'aud_l2_m7_listen', 3, 'Doctor', 'How often do you exercise?'),
('cue_l2_m7_4', 'aud_l2_m7_listen', 4, 'Patient', 'Hardly ever. Maybe once a month.'),
('cue_l2_m7_5', 'aud_l2_m7_listen', 5, 'Doctor', 'And how much coffee do you drink?'),
('cue_l2_m7_6', 'aud_l2_m7_listen', 6, 'Patient', 'Four or five cups a day. Sometimes more.'),
('cue_l2_m7_7', 'aud_l2_m7_listen', 7, 'Doctor', 'That''s probably part of the problem. Try to cut down gradually.'),
('cue_l2_m7_8', 'aud_l2_m7_listen', 8, 'Doctor', 'And you should walk for twenty minutes every day. It''s simpler than joining a gym.'),
('cue_l2_m7_9', 'aud_l2_m7_listen', 9, 'Patient', 'I''ll try. Thank you.');

INSERT INTO learning_items (id, unit_id, sequence, kind, title, body, audio_asset_id) VALUES
('itm_l2_m7_listening', 'unt_l2_m7', 4, 'listening', 'Listening 7 — A Check-Up',
'LISTENING OBJECTIVES: Follow a consultation; understand advice and frequency; distinguish how often expressions.

BEFORE YOU LISTEN: A patient has a routine appointment with a doctor. Read the four questions first. Knowing what you are listening for is itself the skill being taught, and it is the difference between hearing words and understanding a conversation.

LISTEN TWICE: First for the general situation only — who is speaking, where, and what they want. Do not stop to decode an unknown word; stopping is what makes learners miss the next sentence. Second time, answer the questions.

THEN: Read the synchronised transcript while listening a third time, and mark every place where what you heard and what is written surprised you. That gap is your own pronunciation target, identified by you rather than assigned to you.

SHADOWING: Record yourself speaking the patient''s answers about habits. Your recordings are kept attempt by attempt, so you can hear your own progress, and your instructor can reply in their own voice.', 'aud_l2_m7_listen'),
('itm_l2_m7_pronunciation', 'unt_l2_m7', 5, 'pronunciation', 'Pronunciation Lab 7 — The /v/ Sound, Frequency Stress & Phrasal-Verb Stress',
'HOW TO USE THIS LAB: For each target — listen to the model, say it aloud three times, then record yourself and listen back. Listening back is the step learners skip and the step that works: you cannot correct a sound you have not heard yourself produce.

FOCUS THIS MODULE: Frequency adverbs and their placement stress, plus the /v/ sound in every and never.

Your recordings are kept, so attempt one and attempt ten sit side by side. Your instructor can reply with a spoken model rather than only written notes.', 'aud_l2_m7_pron');

INSERT INTO pronunciation_targets (id, learning_item_id, sequence, focus, target, example, guidance) VALUES
('pron_l2_m7_1', 'itm_l2_m7_pronunciation', 1, 'phoneme', '/v/ in every, never, have', 'every day; hardly ever; I''ve never', 'Top teeth touch the bottom lip and the voice buzzes. Replacing /v/ with /b/ or /f/ changes very to berry and is highly noticeable.'),
('pron_l2_m7_2', 'itm_l2_m7_pronunciation', 2, 'sentence_stress', 'Frequency adverbs are stressed when they carry the answer', 'HARDly EVer. — SOMEtimes MORE.', 'In a short answer the frequency IS the information, so it takes full stress. Mid-sentence — "I sometimes walk" — it reduces again.'),
('pron_l2_m7_3', 'itm_l2_m7_pronunciation', 3, 'connected_speech', 'cut down, cut out: the phrasal verb stresses the particle', 'cut DOWN gradually; cut it OUT completely', 'English phrasal verbs put the stress on the small word. This is counter-intuitive and is why learners often mishear which advice was given.');

INSERT INTO quiz_questions (id, learning_item_id, sequence, prompt, choices_json, correct_index, audio_cue_id) VALUES
('qq_l2_m7_ls1', 'itm_l2_m7_listening', 1, 'What is the patient''s main complaint?', '["Headaches","Tiredness and poor sleep","Back pain","A cough"]', 1, 'cue_l2_m7_2'),
('qq_l2_m7_ls2', 'itm_l2_m7_listening', 2, 'How often does the patient exercise?', '["Every day","Once a week","Twice a month","Hardly ever"]', 3, 'cue_l2_m7_4'),
('qq_l2_m7_ls3', 'itm_l2_m7_listening', 3, 'How much coffee does the patient drink daily?', '["One or two cups","Two or three cups","Four or five cups","Ten cups"]', 2, 'cue_l2_m7_6'),
('qq_l2_m7_ls4', 'itm_l2_m7_listening', 4, 'What does the doctor recommend?', '["Walking twenty minutes a day","Joining a gym","Stopping coffee immediately","Taking medicine"]', 0, 'cue_l2_m7_8');

-- ---------------------------------------------------------------------
-- Module 8: Shopping & Services
-- ---------------------------------------------------------------------
INSERT INTO audio_assets (id, kind, title, transcript, variety, speaker_count, target_wpm) VALUES
('aud_l2_m8_listen', 'listening', 'A Complaint in a Shop', 'Excuse me. I bought this kettle here last week and it''s stopped working. | I''m sorry to hear that. Do you have the receipt? | Yes, here it is. | Thank you. Would you like a refund or a replacement? | I''d prefer a replacement, if you have the same model. | Let me check. I''m afraid we''ve sold out of that one. | In that case, I''d rather have the refund, please. | Of course. It will go back onto your card within five working days.', 'BrE', 2, 112),
('aud_l2_m8_pron', 'model_pronunciation', 'Module 8 Pronunciation Model', 'It''s stopped working. | Do you have the receipt? | I''d prefer a replacement. | I''d rather have the refund.', 'BrE', 1, 97);

INSERT INTO audio_cues (id, audio_asset_id, sequence, speaker, text) VALUES
('cue_l2_m8_1', 'aud_l2_m8_listen', 1, 'Customer', 'Excuse me. I bought this kettle here last week and it''s stopped working.'),
('cue_l2_m8_2', 'aud_l2_m8_listen', 2, 'Assistant', 'I''m sorry to hear that. Do you have the receipt?'),
('cue_l2_m8_3', 'aud_l2_m8_listen', 3, 'Customer', 'Yes, here it is.'),
('cue_l2_m8_4', 'aud_l2_m8_listen', 4, 'Assistant', 'Thank you. Would you like a refund or a replacement?'),
('cue_l2_m8_5', 'aud_l2_m8_listen', 5, 'Customer', 'I''d prefer a replacement, if you have the same model.'),
('cue_l2_m8_6', 'aud_l2_m8_listen', 6, 'Assistant', 'Let me check. I''m afraid we''ve sold out of that one.'),
('cue_l2_m8_7', 'aud_l2_m8_listen', 7, 'Customer', 'In that case, I''d rather have the refund, please.'),
('cue_l2_m8_8', 'aud_l2_m8_listen', 8, 'Assistant', 'Of course. It will go back onto your card within five working days.');

INSERT INTO learning_items (id, unit_id, sequence, kind, title, body, audio_asset_id) VALUES
('itm_l2_m8_listening', 'unt_l2_m8', 4, 'listening', 'Listening 8 — A Complaint in a Shop',
'LISTENING OBJECTIVES: Follow a service complaint and its resolution; recognise polite complaint language; catch conditions and offers.

BEFORE YOU LISTEN: A customer returns a faulty item. Read the four questions first. Knowing what you are listening for is itself the skill being taught, and it is the difference between hearing words and understanding a conversation.

LISTEN TWICE: First for the general situation only — who is speaking, where, and what they want. Do not stop to decode an unknown word; stopping is what makes learners miss the next sentence. Second time, answer the questions.

THEN: Read the synchronised transcript while listening a third time, and mark every place where what you heard and what is written surprised you. That gap is your own pronunciation target, identified by you rather than assigned to you.

SHADOWING: Record yourself speaking the customer''s complaint, staying polite under frustration. Your recordings are kept attempt by attempt, so you can hear your own progress, and your instructor can reply in their own voice.', 'aud_l2_m8_listen'),
('itm_l2_m8_pronunciation', 'unt_l2_m8', 5, 'pronunciation', 'Pronunciation Lab 8 — Polite Firmness, Offer Reductions & Contrastive Stress',
'HOW TO USE THIS LAB: For each target — listen to the model, say it aloud three times, then record yourself and listen back. Listening back is the step learners skip and the step that works: you cannot correct a sound you have not heard yourself produce.

FOCUS THIS MODULE: Staying polite under frustration — the intonation that separates firm from rude.

Your recordings are kept, so attempt one and attempt ten sit side by side. Your instructor can reply with a spoken model rather than only written notes.', 'aud_l2_m8_pron');

INSERT INTO pronunciation_targets (id, learning_item_id, sequence, focus, target, example, guidance) VALUES
('pron_l2_m8_1', 'itm_l2_m8_pronunciation', 1, 'intonation', 'Firm but polite: falling, steady, unhurried', 'I''d PREfer a replacement, if you HAVE the same model.', 'Rising pitch here sounds uncertain and invites refusal; a sharp fall sounds aggressive. A steady, unhurried fall is the sound of a complaint that gets resolved.'),
('pron_l2_m8_2', 'itm_l2_m8_pronunciation', 2, 'connected_speech', 'would you -> /wʊdʒə/; I''d rather -> /aɪdˈrɑːðə/', 'Would you like a refund? I''d rather have the refund.', 'Offers and preferences are among the most reduced structures in English. Hearing them accurately is what lets you respond to what was actually offered.'),
('pron_l2_m8_3', 'itm_l2_m8_pronunciation', 3, 'word_stress', 'Contrastive stress in a change of mind', 'In THAT case, I''d rather have the reFUND.', 'Stressing that signals the reason has changed the decision. Without it the sentence sounds like the customer is repeating themselves.');

INSERT INTO quiz_questions (id, learning_item_id, sequence, prompt, choices_json, correct_index, audio_cue_id) VALUES
('qq_l2_m8_ls1', 'itm_l2_m8_listening', 1, 'What is wrong with the kettle?', '["It has stopped working","It is the wrong colour","It was too expensive","It is damaged in the box"]', 0, 'cue_l2_m8_1'),
('qq_l2_m8_ls2', 'itm_l2_m8_listening', 2, 'What does the assistant ask for first?', '["The kettle","A bank card","The receipt","The customer''s name"]', 2, 'cue_l2_m8_2'),
('qq_l2_m8_ls3', 'itm_l2_m8_listening', 3, 'What does the customer want at first?', '["A refund","A replacement","A discount","An apology"]', 1, 'cue_l2_m8_5'),
('qq_l2_m8_ls4', 'itm_l2_m8_listening', 4, 'Why does the customer change their mind?', '["The refund is faster","The price has changed","The assistant suggests it","That model has sold out"]', 3, 'cue_l2_m8_6');

-- ---------------------------------------------------------------------
-- Module 9: Telling Stories
-- ---------------------------------------------------------------------
INSERT INTO audio_assets (id, kind, title, transcript, variety, speaker_count, target_wpm) VALUES
('aud_l2_m9_listen', 'listening', 'The Night the Lights Went Out', 'So, this happened about three years ago. | We were having dinner — my whole family, about ten of us. | Suddenly, all the lights went out. The whole street was dark. | Anyway, my uncle went to find candles, and while he was looking, he knocked over a jug of water. | So there we were, in the dark, completely soaked. | And then — you won''t believe this — the lights came back on immediately. | Everyone just started laughing. We still talk about it.', 'BrE', 1, 112),
('aud_l2_m9_pron', 'model_pronunciation', 'Module 9 Pronunciation Model', 'This happened three years ago. | We were having dinner. | Suddenly the lights went out. | Everyone started laughing.', 'BrE', 1, 97);

INSERT INTO audio_cues (id, audio_asset_id, sequence, speaker, text) VALUES
('cue_l2_m9_1', 'aud_l2_m9_listen', 1, 'Speaker', 'So, this happened about three years ago.'),
('cue_l2_m9_2', 'aud_l2_m9_listen', 2, 'Speaker', 'We were having dinner — my whole family, about ten of us.'),
('cue_l2_m9_3', 'aud_l2_m9_listen', 3, 'Speaker', 'Suddenly, all the lights went out. The whole street was dark.'),
('cue_l2_m9_4', 'aud_l2_m9_listen', 4, 'Speaker', 'Anyway, my uncle went to find candles, and while he was looking, he knocked over a jug of water.'),
('cue_l2_m9_5', 'aud_l2_m9_listen', 5, 'Speaker', 'So there we were, in the dark, completely soaked.'),
('cue_l2_m9_6', 'aud_l2_m9_listen', 6, 'Speaker', 'And then — you won''t believe this — the lights came back on immediately.'),
('cue_l2_m9_7', 'aud_l2_m9_listen', 7, 'Speaker', 'Everyone just started laughing. We still talk about it.');

INSERT INTO learning_items (id, unit_id, sequence, kind, title, body, audio_asset_id) VALUES
('itm_l2_m9_listening', 'unt_l2_m9', 4, 'listening', 'Listening 9 — The Night the Lights Went Out',
'LISTENING OBJECTIVES: Follow an extended anecdote; track sequence and background; recognise storytelling discourse markers.

BEFORE YOU LISTEN: A speaker tells a story about a power cut, in the way stories are actually told. Read the four questions first. Knowing what you are listening for is itself the skill being taught, and it is the difference between hearing words and understanding a conversation.

LISTEN TWICE: First for the general situation only — who is speaking, where, and what they want. Do not stop to decode an unknown word; stopping is what makes learners miss the next sentence. Second time, answer the questions.

THEN: Read the synchronised transcript while listening a third time, and mark every place where what you heard and what is written surprised you. That gap is your own pronunciation target, identified by you rather than assigned to you.

SHADOWING: Record yourself speaking the story''s opening and its punchline. Your recordings are kept attempt by attempt, so you can hear your own progress, and your instructor can reply in their own voice.', 'aud_l2_m9_listen'),
('itm_l2_m9_pronunciation', 'unt_l2_m9', 5, 'pronunciation', 'Pronunciation Lab 9 — Narrative Pace, Discourse Markers & Backgrounding',
'HOW TO USE THIS LAB: For each target — listen to the model, say it aloud three times, then record yourself and listen back. Listening back is the step learners skip and the step that works: you cannot correct a sound you have not heard yourself produce.

FOCUS THIS MODULE: Storytelling rhythm — how a speaker slows and drops pitch just before the point of the story.

Your recordings are kept, so attempt one and attempt ten sit side by side. Your instructor can reply with a spoken model rather than only written notes.', 'aud_l2_m9_pron');

INSERT INTO pronunciation_targets (id, learning_item_id, sequence, focus, target, example, guidance) VALUES
('pron_l2_m9_1', 'itm_l2_m9_pronunciation', 1, 'rhythm', 'Storytelling slows before the point', 'And THEN — you won''t beLIEVE this — the LIGHTS came back ON.', 'Speakers slow down and often pause before a punchline. That slowing is a signal to the listener that the important part is arriving; recognising it is a listening skill in itself.'),
('pron_l2_m9_2', 'itm_l2_m9_pronunciation', 2, 'connected_speech', 'Discourse markers are fast and unstressed', 'So, / Anyway, / And then, / Well,', 'These organise the story but carry little meaning, so they are said quickly. Learners who treat them as content words fall behind immediately.'),
('pron_l2_m9_3', 'itm_l2_m9_pronunciation', 3, 'intonation', 'Background information drops in pitch', 'We were having dinner — my whole FAMily, about TEN of us — and...', 'Parenthetical background is said lower and faster, then the main line resumes at normal pitch. This layering is how an English speaker signals what is scene-setting and what is plot.');

INSERT INTO quiz_questions (id, learning_item_id, sequence, prompt, choices_json, correct_index, audio_cue_id) VALUES
('qq_l2_m9_ls1', 'itm_l2_m9_listening', 1, 'When did this happen?', '["About three years ago","Last year","When the speaker was a child","Last month"]', 0, 'cue_l2_m9_1'),
('qq_l2_m9_ls2', 'itm_l2_m9_listening', 2, 'What were they doing when the lights went out?', '["Watching television","Going to bed","Having dinner","Arriving home"]', 2, 'cue_l2_m9_2'),
('qq_l2_m9_ls3', 'itm_l2_m9_listening', 3, 'What did the uncle knock over?', '["A candle","A jug of water","A chair","A plate"]', 1, 'cue_l2_m9_4'),
('qq_l2_m9_ls4', 'itm_l2_m9_listening', 4, 'What happened immediately after they got soaked?', '["They found the candles","They went outside","Someone called for help","The lights came back on"]', 3, 'cue_l2_m9_6');

-- ---------------------------------------------------------------------
-- Module 10: Review & Consolidation
-- ---------------------------------------------------------------------
INSERT INTO audio_assets (id, kind, title, transcript, variety, speaker_count, target_wpm) VALUES
('aud_l2_m10_listen', 'listening', 'The Student Radio Interview', 'Welcome back. Today I''m talking to Elena. Elena, tell us about yourself. | Hi! I''m from Seville, and I''ve been here for eight months. | What did you do before you came? | I used to work in a bookshop. I enjoyed it, but I wanted to study. | How does life here compare with home? | It''s colder, obviously! And the city is bigger and much busier than Seville. | But people are friendlier than I expected. That surprised me. | Any plans for the summer? | I''m going to travel around Scotland with two friends. We''re leaving on the fifteenth of July. | That sounds wonderful. Thanks for joining us, Elena.', 'BrE', 2, 115),
('aud_l2_m10_pron', 'model_pronunciation', 'Module 10 Pronunciation Model', 'I''ve been here for eight months. | I used to work in a bookshop. | It''s bigger and busier than Seville. | We''re leaving on the fifteenth of July.', 'BrE', 1, 100);

INSERT INTO audio_cues (id, audio_asset_id, sequence, speaker, text) VALUES
('cue_l2_m10_1', 'aud_l2_m10_listen', 1, 'Host', 'Welcome back. Today I''m talking to Elena. Elena, tell us about yourself.'),
('cue_l2_m10_2', 'aud_l2_m10_listen', 2, 'Elena', 'Hi! I''m from Seville, and I''ve been here for eight months.'),
('cue_l2_m10_3', 'aud_l2_m10_listen', 3, 'Host', 'What did you do before you came?'),
('cue_l2_m10_4', 'aud_l2_m10_listen', 4, 'Elena', 'I used to work in a bookshop. I enjoyed it, but I wanted to study.'),
('cue_l2_m10_5', 'aud_l2_m10_listen', 5, 'Host', 'How does life here compare with home?'),
('cue_l2_m10_6', 'aud_l2_m10_listen', 6, 'Elena', 'It''s colder, obviously! And the city is bigger and much busier than Seville.'),
('cue_l2_m10_7', 'aud_l2_m10_listen', 7, 'Elena', 'But people are friendlier than I expected. That surprised me.'),
('cue_l2_m10_8', 'aud_l2_m10_listen', 8, 'Host', 'Any plans for the summer?'),
('cue_l2_m10_9', 'aud_l2_m10_listen', 9, 'Elena', 'I''m going to travel around Scotland with two friends. We''re leaving on the fifteenth of July.'),
('cue_l2_m10_10', 'aud_l2_m10_listen', 10, 'Host', 'That sounds wonderful. Thanks for joining us, Elena.');

INSERT INTO learning_items (id, unit_id, sequence, kind, title, body, audio_asset_id) VALUES
('itm_l2_m10_listening', 'unt_l2_m10', 4, 'listening', 'Listening 10 — The Student Radio Interview',
'LISTENING OBJECTIVES: Integrate every Level II listening skill; follow a longer multi-topic interview with past narrative, opinion, comparison and future plans.

BEFORE YOU LISTEN: This is the Level II cumulative listening: a student is interviewed on the school radio, drawing on all nine modules. Read the four questions first. Knowing what you are listening for is itself the skill being taught, and it is the difference between hearing words and understanding a conversation.

LISTEN TWICE: First for the general situation only — who is speaking, where, and what they want. Do not stop to decode an unknown word; stopping is what makes learners miss the next sentence. Second time, answer the questions.

THEN: Read the synchronised transcript while listening a third time, and mark every place where what you heard and what is written surprised you. That gap is your own pronunciation target, identified by you rather than assigned to you.

SHADOWING: Record yourself speaking the interviewee''s longest answer, then the whole interview. Your recordings are kept attempt by attempt, so you can hear your own progress, and your instructor can reply in their own voice.', 'aud_l2_m10_listen'),
('itm_l2_m10_pronunciation', 'unt_l2_m10', 5, 'pronunciation', 'Pronunciation Lab 10 — Level II Consolidation — Weak Forms, Numbers & Conversational Melody',
'HOW TO USE THIS LAB: For each target — listen to the model, say it aloud three times, then record yourself and listen back. Listening back is the step learners skip and the step that works: you cannot correct a sound you have not heard yourself produce.

FOCUS THIS MODULE: Everything from the level together, with particular attention to the weak forms that make natural speed possible.

Your recordings are kept, so attempt one and attempt ten sit side by side. Your instructor can reply with a spoken model rather than only written notes.', 'aud_l2_m10_pron');

INSERT INTO pronunciation_targets (id, learning_item_id, sequence, focus, target, example, guidance) VALUES
('pron_l2_m10_1', 'itm_l2_m10_pronunciation', 1, 'connected_speech', 'Weak forms across a long text', 'have /əv/, was /wəz/, than /ðən/, to /tə/, and /ən/', 'Level II ends where it began: small words shrink. Once you can hear them reliably, natural-speed English stops sounding fast and starts sounding normal.'),
('pron_l2_m10_2', 'itm_l2_m10_pronunciation', 2, 'word_stress', 'Dates and numbers under pressure', 'the FIFTEENTH of juLY; EIGHT months', 'As in Module 2, -teenth and -ty confusions matter most where the information does. Slow slightly on numbers — fluent speakers do.'),
('pron_l2_m10_3', 'itm_l2_m10_pronunciation', 3, 'intonation', 'Sustaining interview rhythm across turns', 'Question rises, answer falls, aside drops lower.', 'The whole level''s melody in one text: rising questions, falling answers, and lowered parenthetical asides. Following those contours is how you follow a conversation you cannot fully decode word by word.');

INSERT INTO quiz_questions (id, learning_item_id, sequence, prompt, choices_json, correct_index, audio_cue_id) VALUES
('qq_l2_m10_ls1', 'itm_l2_m10_listening', 1, 'How long has Elena been here?', '["Three months","Six months","Eight months","A year"]', 2, 'cue_l2_m10_2'),
('qq_l2_m10_ls2', 'itm_l2_m10_listening', 2, 'What did she do before?', '["Worked in a bookshop","Studied at university","Taught English","Travelled"]', 0, 'cue_l2_m10_4'),
('qq_l2_m10_ls3', 'itm_l2_m10_listening', 3, 'What surprised her about the place?', '["The cold weather","The size of the city","The cost of living","How friendly people are"]', 3, 'cue_l2_m10_7'),
('qq_l2_m10_ls4', 'itm_l2_m10_listening', 4, 'When is she leaving for Scotland?', '["The fifth of July","The fifteenth of July","The fiftieth day","In August"]', 1, 'cue_l2_m10_9');

