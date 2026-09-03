-- WEC-LC — Audio curriculum seed: Level III (Intermediate, B1).
--
-- See sql/seed-audio-level-1.sql and docs/lms-architecture.md
-- § The audio layer for the design.
--
-- WHAT IS REAL AND WHAT IS NOT: scripts, cues, questions and targets
-- are complete authored curriculum; the recordings are not. Every
-- media_url and cue timing is NULL. Adding narration later is an
-- UPDATE, not a structural change.
--
-- B1 delivery is 120-130 wpm, approaching natural conversational
-- pace, with multi-speaker texts and genuine hedging throughout.

-- Re-sequence so the audio strand sits where the lessons assume it:
-- present -> practise -> listen -> pronounce -> test.
UPDATE learning_items SET sequence = 6 WHERE id LIKE 'itm_l3_m%_quiz';
UPDATE learning_items SET sequence = 7 WHERE id LIKE 'itm_l3_m%_assignment';
UPDATE learning_items SET sequence = 5 WHERE id = 'itm_l3_m10_examquiz';
UPDATE learning_items SET sequence = 6 WHERE id = 'itm_l3_m10_examassignment';

-- ---------------------------------------------------------------------
-- Module 1: Present Perfect & Life Experience
-- ---------------------------------------------------------------------
INSERT INTO audio_assets (id, kind, title, transcript, variety, speaker_count, target_wpm) VALUES
('aud_l3_m1_listen', 'listening', 'The Volunteer Coordinator', 'Have you done any volunteering before? | Yes, I have. I''ve worked with a literacy charity for about two years. | And have you ever taught adults? | I taught a class of adults last summer, but I haven''t done it since. | What''s been the most difficult part? | Honestly, learning not to fill silences. I used to answer my own questions. | That''s a very useful thing to have noticed. | It took me a long time. I still catch myself doing it.', 'BrE', 2, 120),
('aud_l3_m1_pron', 'model_pronunciation', 'Module 1 Pronunciation Model', 'Have you done any volunteering before? | I''ve worked there for two years. | I haven''t done it since. | What''s been the most difficult part?', 'BrE', 1, 105);

INSERT INTO audio_cues (id, audio_asset_id, sequence, speaker, text) VALUES
('cue_l3_m1_1', 'aud_l3_m1_listen', 1, 'Coordinator', 'Have you done any volunteering before?'),
('cue_l3_m1_2', 'aud_l3_m1_listen', 2, 'Applicant', 'Yes, I have. I''ve worked with a literacy charity for about two years.'),
('cue_l3_m1_3', 'aud_l3_m1_listen', 3, 'Coordinator', 'And have you ever taught adults?'),
('cue_l3_m1_4', 'aud_l3_m1_listen', 4, 'Applicant', 'I taught a class of adults last summer, but I haven''t done it since.'),
('cue_l3_m1_5', 'aud_l3_m1_listen', 5, 'Coordinator', 'What''s been the most difficult part?'),
('cue_l3_m1_6', 'aud_l3_m1_listen', 6, 'Applicant', 'Honestly, learning not to fill silences. I used to answer my own questions.'),
('cue_l3_m1_7', 'aud_l3_m1_listen', 7, 'Coordinator', 'That''s a very useful thing to have noticed.'),
('cue_l3_m1_8', 'aud_l3_m1_listen', 8, 'Applicant', 'It took me a long time. I still catch myself doing it.');

INSERT INTO learning_items (id, unit_id, sequence, kind, title, body, audio_asset_id) VALUES
('itm_l3_m1_listening', 'unt_l3_m1', 4, 'listening', 'Listening 1 — The Volunteer Coordinator',
'LISTENING OBJECTIVES: Distinguish finished from unfinished time; hear present perfect against past simple at speed; infer experience from indirect statements.

BEFORE YOU LISTEN: A volunteer coordinator interviews an applicant about their experience. Read the four questions first. Knowing what you are listening for is itself the skill being taught, and it is the difference between hearing words and understanding a conversation.

LISTEN TWICE: First for the general situation only — who is speaking, where, and what they want. Do not stop to decode an unknown word; stopping is what makes learners miss the next sentence. Second time, answer the questions.

THEN: Read the synchronised transcript while listening a third time, and mark every place where what you heard and what is written surprised you. That gap is your own pronunciation target, identified by you rather than assigned to you.

SHADOWING: Record yourself speaking the applicant''s answers, keeping have and has unstressed. Your recordings are kept attempt by attempt, so you can hear your own progress, and your instructor can reply in their own voice.', 'aud_l3_m1_listen'),
('itm_l3_m1_pronunciation', 'unt_l3_m1', 5, 'pronunciation', 'Pronunciation Lab 1 — Reduced Auxiliaries, Strong Forms & Experience Questions',
'HOW TO USE THIS LAB: For each target — listen to the model, say it aloud three times, then record yourself and listen back. Listening back is the step learners skip and the step that works: you cannot correct a sound you have not heard yourself produce.

FOCUS THIS MODULE: The near-invisible auxiliaries have, has and ''ve, which carry the entire present-perfect/past-simple distinction.

Your recordings are kept, so attempt one and attempt ten sit side by side. Your instructor can reply with a spoken model rather than only written notes.', 'aud_l3_m1_pron');

INSERT INTO pronunciation_targets (id, learning_item_id, sequence, focus, target, example, guidance) VALUES
('pron_l3_m1_1', 'itm_l3_m1_pronunciation', 1, 'connected_speech', 'have, has and ''ve almost disappear', 'I''ve worked -> /aɪvˈwɜːkt/; has been -> /əzbɪn/', 'The auxiliary is unstressed and often reduced to a single consonant. This is why learners hear "I worked" when the speaker said "I''ve worked" — and lose the distinction the whole module teaches.'),
('pron_l3_m1_2', 'itm_l3_m1_pronunciation', 2, 'sentence_stress', 'Strong forms only in short answers and contrast', 'Yes, I HAVE. — I HAVEN''T done it since.', 'Auxiliaries take full stress only when carrying the answer or a negative. Learning both forms of the same word is what makes this grammar audible.'),
('pron_l3_m1_3', 'itm_l3_m1_pronunciation', 3, 'intonation', 'Ever-questions rise; experience answers fall', 'Have you EVER taught adults? (rise) — I TAUGHT a class last summer. (fall)', 'The rise invites a yes/no; the falling answer signals a completed anecdote is starting. Following that shift is how you know an answer is going to be a story.');

INSERT INTO quiz_questions (id, learning_item_id, sequence, prompt, choices_json, correct_index, audio_cue_id) VALUES
('qq_l3_m1_ls1', 'itm_l3_m1_listening', 1, 'How long has the applicant worked with the literacy charity?', '["Six months","About a year","Since last summer","About two years"]', 3, 'cue_l3_m1_2'),
('qq_l3_m1_ls2', 'itm_l3_m1_listening', 2, 'When did the applicant teach adults?', '["This year","Last summer","For two years","They never have"]', 1, 'cue_l3_m1_4'),
('qq_l3_m1_ls3', 'itm_l3_m1_listening', 3, 'What has been the hardest part for the applicant?', '["Learning not to fill silences","Finding time","Managing large classes","Speaking in public"]', 0, 'cue_l3_m1_6'),
('qq_l3_m1_ls4', 'itm_l3_m1_listening', 4, 'Has the applicant fully solved that difficulty?', '["Yes, completely","They never had it","No, they still catch themselves","They do not say"]', 2, 'cue_l3_m1_8');

-- ---------------------------------------------------------------------
-- Module 2: Education & Learning
-- ---------------------------------------------------------------------
INSERT INTO audio_assets (id, kind, title, transcript, variety, speaker_count, target_wpm) VALUES
('aud_l3_m2_listen', 'listening', 'A Study Skills Seminar', 'Right. Today I want to cover three things: how we forget, why re-reading fails, and what to do instead. | So, first, forgetting. Most of what you hear today will be gone within a week unless you do something about it. | That''s not a failure of intelligence; it''s simply how memory works. | Moving on to re-reading. Re-reading feels productive because the text becomes familiar. | But familiarity is not the same as recall, and that is precisely the trap. | Which brings me to my third point: testing yourself. Retrieving information strengthens it far more than reviewing it. | So the practical advice is simple. Close the book and try to write down what you remember. Then check.', 'BrE', 1, 125),
('aud_l3_m2_pron', 'model_pronunciation', 'Module 2 Pronunciation Model', 'I want to cover three things. | Moving on to my second point. | Which brings me to... | That is precisely the trap.', 'BrE', 1, 110);

INSERT INTO audio_cues (id, audio_asset_id, sequence, speaker, text) VALUES
('cue_l3_m2_1', 'aud_l3_m2_listen', 1, 'Tutor', 'Right. Today I want to cover three things: how we forget, why re-reading fails, and what to do instead.'),
('cue_l3_m2_2', 'aud_l3_m2_listen', 2, 'Tutor', 'So, first, forgetting. Most of what you hear today will be gone within a week unless you do something about it.'),
('cue_l3_m2_3', 'aud_l3_m2_listen', 3, 'Tutor', 'That''s not a failure of intelligence; it''s simply how memory works.'),
('cue_l3_m2_4', 'aud_l3_m2_listen', 4, 'Tutor', 'Moving on to re-reading. Re-reading feels productive because the text becomes familiar.'),
('cue_l3_m2_5', 'aud_l3_m2_listen', 5, 'Tutor', 'But familiarity is not the same as recall, and that is precisely the trap.'),
('cue_l3_m2_6', 'aud_l3_m2_listen', 6, 'Tutor', 'Which brings me to my third point: testing yourself. Retrieving information strengthens it far more than reviewing it.'),
('cue_l3_m2_7', 'aud_l3_m2_listen', 7, 'Tutor', 'So the practical advice is simple. Close the book and try to write down what you remember. Then check.');

INSERT INTO learning_items (id, unit_id, sequence, kind, title, body, audio_asset_id) VALUES
('itm_l3_m2_listening', 'unt_l3_m2', 4, 'listening', 'Listening 2 — A Study Skills Seminar',
'LISTENING OBJECTIVES: Follow an extended monologue with signposting; take notes from speech; distinguish a main claim from its supporting example.

BEFORE YOU LISTEN: A study skills tutor gives the opening of a seminar. Take notes as you listen — this is the module''s real task. Read the four questions first. Knowing what you are listening for is itself the skill being taught, and it is the difference between hearing words and understanding a conversation.

LISTEN TWICE: First for the general situation only — who is speaking, where, and what they want. Do not stop to decode an unknown word; stopping is what makes learners miss the next sentence. Second time, answer the questions.

THEN: Read the synchronised transcript while listening a third time, and mark every place where what you heard and what is written surprised you. That gap is your own pronunciation target, identified by you rather than assigned to you.

SHADOWING: Record yourself speaking the tutor''s three signposted sections. Your recordings are kept attempt by attempt, so you can hear your own progress, and your instructor can reply in their own voice.', 'aud_l3_m2_listen'),
('itm_l3_m2_pronunciation', 'unt_l3_m2', 5, 'pronunciation', 'Pronunciation Lab 2 — Section Resets, Signposting Chunks & Contrast Stress',
'HOW TO USE THIS LAB: For each target — listen to the model, say it aloud three times, then record yourself and listen back. Listening back is the step learners skip and the step that works: you cannot correct a sound you have not heard yourself produce.

FOCUS THIS MODULE: Signposting language and the pitch reset that marks a new section in a lecture.

Your recordings are kept, so attempt one and attempt ten sit side by side. Your instructor can reply with a spoken model rather than only written notes.', 'aud_l3_m2_pron');

INSERT INTO pronunciation_targets (id, learning_item_id, sequence, focus, target, example, guidance) VALUES
('pron_l3_m2_1', 'itm_l3_m2_pronunciation', 1, 'intonation', 'A new section resets to a higher pitch', 'MOVING ON to re-reading. // WHICH BRINGS ME to my third point.', 'Lecturers restart high at each new section. That reset is the clearest structural signal in academic listening, and note-takers who hear it never lose their place.'),
('pron_l3_m2_2', 'itm_l3_m2_pronunciation', 2, 'connected_speech', 'Signposting phrases are fast and formulaic', 'which brings me to -> /wɪtʃˈbrɪŋzmɪtə/', 'These phrases carry structure, not content, so they are compressed. Learn them as single units rather than word by word.'),
('pron_l3_m2_3', 'itm_l3_m2_pronunciation', 3, 'sentence_stress', 'The contrast pair takes the heaviest stress', 'FaMILiarity is not the same as reCALL.', 'When a speaker sets two ideas against each other, both take strong stress. That double stress is the audible marker of the main point of a section.');

INSERT INTO quiz_questions (id, learning_item_id, sequence, prompt, choices_json, correct_index, audio_cue_id) VALUES
('qq_l3_m2_ls1', 'itm_l3_m2_listening', 1, 'How many topics does the tutor announce at the start?', '["Three","Two","Four","Five"]', 0, 'cue_l3_m2_1'),
('qq_l3_m2_ls2', 'itm_l3_m2_listening', 2, 'Why does re-reading feel productive?', '["It takes a long time","It is recommended by tutors","The text becomes familiar","It improves recall"]', 2, 'cue_l3_m2_4'),
('qq_l3_m2_ls3', 'itm_l3_m2_listening', 3, 'What is the tutor''s central distinction?', '["Reading versus listening","Familiarity versus recall","Speed versus accuracy","Notes versus highlighting"]', 1, 'cue_l3_m2_5'),
('qq_l3_m2_ls4', 'itm_l3_m2_listening', 4, 'What practical step does the tutor recommend?', '["Re-read three times","Highlight key points","Study with others","Close the book and write what you remember"]', 3, 'cue_l3_m2_7');

-- ---------------------------------------------------------------------
-- Module 3: Work, Careers & Entrepreneurship
-- ---------------------------------------------------------------------
INSERT INTO audio_assets (id, kind, title, transcript, variety, speaker_count, target_wpm) VALUES
('aud_l3_m3_listen', 'listening', 'The Pitch Feedback', 'Thanks for that. There''s a lot here that works. | Thank you. Where would you push back? | Well, the problem you''re solving is clear, which is more than most pitches manage. | I suppose my only real concern is the pricing. It feels slightly optimistic. | Optimistic in what sense? | You''re assuming customers switch within three months. I''d want to see evidence for that. | That''s fair. We based it on two interviews. | Then say so. A stated assumption is far stronger than a hidden one.', 'BrE', 2, 122),
('aud_l3_m3_pron', 'model_pronunciation', 'Module 3 Pronunciation Model', 'There''s a lot here that works. | My only real concern is the pricing. | It feels slightly optimistic. | A stated assumption is stronger than a hidden one.', 'BrE', 1, 107);

INSERT INTO audio_cues (id, audio_asset_id, sequence, speaker, text) VALUES
('cue_l3_m3_1', 'aud_l3_m3_listen', 1, 'Mentor', 'Thanks for that. There''s a lot here that works.'),
('cue_l3_m3_2', 'aud_l3_m3_listen', 2, 'Entrepreneur', 'Thank you. Where would you push back?'),
('cue_l3_m3_3', 'aud_l3_m3_listen', 3, 'Mentor', 'Well, the problem you''re solving is clear, which is more than most pitches manage.'),
('cue_l3_m3_4', 'aud_l3_m3_listen', 4, 'Mentor', 'I suppose my only real concern is the pricing. It feels slightly optimistic.'),
('cue_l3_m3_5', 'aud_l3_m3_listen', 5, 'Entrepreneur', 'Optimistic in what sense?'),
('cue_l3_m3_6', 'aud_l3_m3_listen', 6, 'Mentor', 'You''re assuming customers switch within three months. I''d want to see evidence for that.'),
('cue_l3_m3_7', 'aud_l3_m3_listen', 7, 'Entrepreneur', 'That''s fair. We based it on two interviews.'),
('cue_l3_m3_8', 'aud_l3_m3_listen', 8, 'Mentor', 'Then say so. A stated assumption is far stronger than a hidden one.');

INSERT INTO learning_items (id, unit_id, sequence, kind, title, body, audio_asset_id) VALUES
('itm_l3_m3_listening', 'unt_l3_m3', 4, 'listening', 'Listening 3 — The Pitch Feedback',
'LISTENING OBJECTIVES: Follow professional feedback; distinguish praise from qualified praise; hear hedged criticism.

BEFORE YOU LISTEN: An entrepreneur receives feedback on a business pitch from a mentor. Read the four questions first. Knowing what you are listening for is itself the skill being taught, and it is the difference between hearing words and understanding a conversation.

LISTEN TWICE: First for the general situation only — who is speaking, where, and what they want. Do not stop to decode an unknown word; stopping is what makes learners miss the next sentence. Second time, answer the questions.

THEN: Read the synchronised transcript while listening a third time, and mark every place where what you heard and what is written surprised you. That gap is your own pronunciation target, identified by you rather than assigned to you.

SHADOWING: Record yourself speaking the mentor''s hedged criticism, keeping it constructive. Your recordings are kept attempt by attempt, so you can hear your own progress, and your instructor can reply in their own voice.', 'aud_l3_m3_listen'),
('itm_l3_m3_pronunciation', 'unt_l3_m3', 5, 'pronunciation', 'Pronunciation Lab 3 — Hedged Criticism, Compressed Softeners & Limiters',
'HOW TO USE THIS LAB: For each target — listen to the model, say it aloud three times, then record yourself and listen back. Listening back is the step learners skip and the step that works: you cannot correct a sound you have not heard yourself produce.

FOCUS THIS MODULE: Hedging and the intonation of criticism that is meant to be heard as help.

Your recordings are kept, so attempt one and attempt ten sit side by side. Your instructor can reply with a spoken model rather than only written notes.', 'aud_l3_m3_pron');

INSERT INTO pronunciation_targets (id, learning_item_id, sequence, focus, target, example, guidance) VALUES
('pron_l3_m3_1', 'itm_l3_m3_pronunciation', 1, 'intonation', 'Hedged criticism falls slowly and stays warm', 'I SUPPOSE my only real conCERN is the PRICing.', 'The slow fall and the hedges together signal help rather than attack. Delivered fast and flat, the identical words land as a dismissal.'),
('pron_l3_m3_2', 'itm_l3_m3_pronunciation', 2, 'connected_speech', 'Hedges compress to near nothing', 'I suppose -> /aɪspəʊz/; sort of -> /sɔːtəv/; I''d want -> /aɪdwɒnt/', 'Professional English is dense with these. A learner who does not hear them receives a much blunter message than the speaker sent.'),
('pron_l3_m3_3', 'itm_l3_m3_pronunciation', 3, 'word_stress', 'Slightly and only limit the criticism, and are stressed', 'It feels SLIGHTly optimistic. My ONly concern is...', 'These limiters carry real meaning: they tell you how big the problem is. Missing their stress means missing the size of the objection.');

INSERT INTO quiz_questions (id, learning_item_id, sequence, prompt, choices_json, correct_index, audio_cue_id) VALUES
('qq_l3_m3_ls1', 'itm_l3_m3_listening', 1, 'What does the mentor praise?', '["The pricing","The market size","The clarity of the problem","The team"]', 2, 'cue_l3_m3_3'),
('qq_l3_m3_ls2', 'itm_l3_m3_listening', 2, 'What is the mentor''s main concern?', '["The pricing","The team","The technology","The timeline for launch"]', 0, 'cue_l3_m3_4'),
('qq_l3_m3_ls3', 'itm_l3_m3_listening', 3, 'What assumption does the mentor question?', '["That the product works","That funding is available","That competitors will not react","That customers switch within three months"]', 3, 'cue_l3_m3_6'),
('qq_l3_m3_ls4', 'itm_l3_m3_listening', 4, 'What does the mentor advise doing with the assumption?', '["Remove it","State it openly","Test it for a year","Base it on more interviews first"]', 1, 'cue_l3_m3_8');

-- ---------------------------------------------------------------------
-- Module 4: Opinions & Debate
-- ---------------------------------------------------------------------
INSERT INTO audio_assets (id, kind, title, transcript, variety, speaker_count, target_wpm) VALUES
('aud_l3_m4_listen', 'listening', 'Should Cities Ban Cars?', 'Rachel, you support car-free centres. Why? | Because the air quality data is unambiguous. Cities that have done it breathe better. | Sam? | I don''t dispute the air quality. My worry is who it affects. | Delivery drivers and disabled residents can''t simply cycle instead. | That''s a fair point, and any scheme has to carry exemptions for exactly those groups. | But exemptions are a design problem, not a reason to abandon the policy. | Agreed — provided the exemptions are real and not just promised.', 'BrE', 3, 125),
('aud_l3_m4_pron', 'model_pronunciation', 'Module 4 Pronunciation Model', 'The data is unambiguous. | I don''t dispute the air quality. | That''s a fair point, but... | Provided the exemptions are real.', 'BrE', 1, 110);

INSERT INTO audio_cues (id, audio_asset_id, sequence, speaker, text) VALUES
('cue_l3_m4_1', 'aud_l3_m4_listen', 1, 'Host', 'Rachel, you support car-free centres. Why?'),
('cue_l3_m4_2', 'aud_l3_m4_listen', 2, 'Rachel', 'Because the air quality data is unambiguous. Cities that have done it breathe better.'),
('cue_l3_m4_3', 'aud_l3_m4_listen', 3, 'Host', 'Sam?'),
('cue_l3_m4_4', 'aud_l3_m4_listen', 4, 'Sam', 'I don''t dispute the air quality. My worry is who it affects.'),
('cue_l3_m4_5', 'aud_l3_m4_listen', 5, 'Sam', 'Delivery drivers and disabled residents can''t simply cycle instead.'),
('cue_l3_m4_6', 'aud_l3_m4_listen', 6, 'Rachel', 'That''s a fair point, and any scheme has to carry exemptions for exactly those groups.'),
('cue_l3_m4_7', 'aud_l3_m4_listen', 7, 'Rachel', 'But exemptions are a design problem, not a reason to abandon the policy.'),
('cue_l3_m4_8', 'aud_l3_m4_listen', 8, 'Sam', 'Agreed — provided the exemptions are real and not just promised.');

INSERT INTO learning_items (id, unit_id, sequence, kind, title, body, audio_asset_id) VALUES
('itm_l3_m4_listening', 'unt_l3_m4', 4, 'listening', 'Listening 4 — Should Cities Ban Cars?',
'LISTENING OBJECTIVES: Follow a two-sided discussion; identify each speaker''s position and their strongest concession; hear where an argument shifts ground.

BEFORE YOU LISTEN: Two speakers discuss car-free city centres on a discussion programme. Read the four questions first. Knowing what you are listening for is itself the skill being taught, and it is the difference between hearing words and understanding a conversation.

LISTEN TWICE: First for the general situation only — who is speaking, where, and what they want. Do not stop to decode an unknown word; stopping is what makes learners miss the next sentence. Second time, answer the questions.

THEN: Read the synchronised transcript while listening a third time, and mark every place where what you heard and what is written surprised you. That gap is your own pronunciation target, identified by you rather than assigned to you.

SHADOWING: Record yourself speaking the concession each speaker makes. Your recordings are kept attempt by attempt, so you can hear your own progress, and your instructor can reply in their own voice.', 'aud_l3_m4_listen'),
('itm_l3_m4_pronunciation', 'unt_l3_m4', 5, 'pronunciation', 'Pronunciation Lab 4 — Concede-and-Turn, Connector Pitch & Formulaic Concessions',
'HOW TO USE THIS LAB: For each target — listen to the model, say it aloud three times, then record yourself and listen back. Listening back is the step learners skip and the step that works: you cannot correct a sound you have not heard yourself produce.

FOCUS THIS MODULE: The rhythm of concession and counter-argument, where stress marks the turn.

Your recordings are kept, so attempt one and attempt ten sit side by side. Your instructor can reply with a spoken model rather than only written notes.', 'aud_l3_m4_pron');

INSERT INTO pronunciation_targets (id, learning_item_id, sequence, focus, target, example, guidance) VALUES
('pron_l3_m4_1', 'itm_l3_m4_pronunciation', 1, 'sentence_stress', 'Concession stresses the thing conceded, then the turn', 'I don''t dispute the AIR quality. My WORRy is WHO it affects.', 'The pattern is concede-then-turn. Both halves take strong stress, and the stress on the turn word is what tells you the disagreement is arriving.'),
('pron_l3_m4_2', 'itm_l3_m4_pronunciation', 2, 'intonation', 'But and however reset the pitch upward', '...for exactly those groups. // BUT exemptions are a DESIGN problem.', 'A raised pitch on the connector marks a change of direction. In debate this is the single most useful contour to recognise.'),
('pron_l3_m4_3', 'itm_l3_m4_pronunciation', 3, 'connected_speech', 'That''s a fair point compresses to a single unit', '/ðætsəˈfeəpɔɪnt/', 'Formulaic concessions are said as one word. Treating them as four separate words costs you the following clause, which is where the actual argument is.');

INSERT INTO quiz_questions (id, learning_item_id, sequence, prompt, choices_json, correct_index, audio_cue_id) VALUES
('qq_l3_m4_ls1', 'itm_l3_m4_listening', 1, 'What is Rachel''s main argument?', '["Air quality data","Cost savings","Traffic reduction","Tourism"]', 0, 'cue_l3_m4_2'),
('qq_l3_m4_ls2', 'itm_l3_m4_listening', 2, 'What does Sam explicitly NOT dispute?', '["The cost","The public support","The air quality","The legality"]', 2, 'cue_l3_m4_4'),
('qq_l3_m4_ls3', 'itm_l3_m4_listening', 3, 'Who does Sam say would be affected?', '["Tourists","Delivery drivers and disabled residents","Shop owners","Cyclists"]', 1, 'cue_l3_m4_5'),
('qq_l3_m4_ls4', 'itm_l3_m4_listening', 4, 'What does Rachel call a design problem rather than an objection?', '["Cost","Enforcement","Public consultation","Exemptions"]', 3, 'cue_l3_m4_7');

-- ---------------------------------------------------------------------
-- Module 5: Environment, Ethics & Global Citizenship
-- ---------------------------------------------------------------------
INSERT INTO audio_assets (id, kind, title, transcript, variety, speaker_count, target_wpm) VALUES
('aud_l3_m5_listen', 'listening', 'The Recycling Audit', 'Thank you all for coming. I''ll present the figures first, then what we think they mean. | Household recycling rose from thirty-one per cent to thirty-eight per cent last year. | Food waste collection, however, fell by about four per cent. | Now, in our view, the fall is explained by the change in collection days rather than by any loss of goodwill. | That is an interpretation, and I want to be clear it is not established fact. | We''re proposing a return to weekly collection from April. | And if it doesn''t improve? | Then our interpretation was wrong, and we''ll say so.', 'BrE', 2, 125),
('aud_l3_m5_pron', 'model_pronunciation', 'Module 5 Pronunciation Model', 'It rose from thirty-one to thirty-eight per cent. | It fell by about four per cent. | In our view, the fall is explained by... | That is an interpretation, not established fact.', 'BrE', 1, 110);

INSERT INTO audio_cues (id, audio_asset_id, sequence, speaker, text) VALUES
('cue_l3_m5_1', 'aud_l3_m5_listen', 1, 'Officer', 'Thank you all for coming. I''ll present the figures first, then what we think they mean.'),
('cue_l3_m5_2', 'aud_l3_m5_listen', 2, 'Officer', 'Household recycling rose from thirty-one per cent to thirty-eight per cent last year.'),
('cue_l3_m5_3', 'aud_l3_m5_listen', 3, 'Officer', 'Food waste collection, however, fell by about four per cent.'),
('cue_l3_m5_4', 'aud_l3_m5_listen', 4, 'Officer', 'Now, in our view, the fall is explained by the change in collection days rather than by any loss of goodwill.'),
('cue_l3_m5_5', 'aud_l3_m5_listen', 5, 'Officer', 'That is an interpretation, and I want to be clear it is not established fact.'),
('cue_l3_m5_6', 'aud_l3_m5_listen', 6, 'Officer', 'We''re proposing a return to weekly collection from April.'),
('cue_l3_m5_7', 'aud_l3_m5_listen', 7, 'Resident', 'And if it doesn''t improve?'),
('cue_l3_m5_8', 'aud_l3_m5_listen', 8, 'Officer', 'Then our interpretation was wrong, and we''ll say so.');

INSERT INTO learning_items (id, unit_id, sequence, kind, title, body, audio_asset_id) VALUES
('itm_l3_m5_listening', 'unt_l3_m5', 4, 'listening', 'Listening 5 — The Recycling Audit',
'LISTENING OBJECTIVES: Follow a factual report with figures; distinguish reported fact from evaluation; catch numbers in continuous speech.

BEFORE YOU LISTEN: A council officer presents the results of a recycling audit to residents. Read the four questions first. Knowing what you are listening for is itself the skill being taught, and it is the difference between hearing words and understanding a conversation.

LISTEN TWICE: First for the general situation only — who is speaking, where, and what they want. Do not stop to decode an unknown word; stopping is what makes learners miss the next sentence. Second time, answer the questions.

THEN: Read the synchronised transcript while listening a third time, and mark every place where what you heard and what is written surprised you. That gap is your own pronunciation target, identified by you rather than assigned to you.

SHADOWING: Record yourself speaking the officer''s presentation of the figures. Your recordings are kept attempt by attempt, so you can hear your own progress, and your instructor can reply in their own voice.', 'aud_l3_m5_listen'),
('itm_l3_m5_pronunciation', 'unt_l3_m5', 5, 'pronunciation', 'Pronunciation Lab 5 — Figures in Speech, Fact-versus-Judgement Pitch & Linking Numbers',
'HOW TO USE THIS LAB: For each target — listen to the model, say it aloud three times, then record yourself and listen back. Listening back is the step learners skip and the step that works: you cannot correct a sound you have not heard yourself produce.

FOCUS THIS MODULE: Numbers and percentages in continuous speech, and the difference in pitch between a fact and a judgement.

Your recordings are kept, so attempt one and attempt ten sit side by side. Your instructor can reply with a spoken model rather than only written notes.', 'aud_l3_m5_pron');

INSERT INTO pronunciation_targets (id, learning_item_id, sequence, focus, target, example, guidance) VALUES
('pron_l3_m5_1', 'itm_l3_m5_pronunciation', 1, 'word_stress', 'Percentages stress the number, not per cent', 'THIRty-EIGHT per cent; about FOUR per cent', 'The unit is predictable; the number is the information. Speakers slow slightly on figures, and matching that slowing is what makes your own data delivery followable.'),
('pron_l3_m5_2', 'itm_l3_m5_pronunciation', 2, 'intonation', 'Facts are level; interpretations dip and slow', '...fell by about four per cent. // NOW, in OUR VIEW, the fall is exPLAINED by...', 'English marks a shift from reporting to interpreting with a pitch and pace change. Hearing it is the listening half of the module''s critical-thinking objective.'),
('pron_l3_m5_3', 'itm_l3_m5_pronunciation', 3, 'connected_speech', 'rose from X to Y links across the numbers', 'from thirty-one to thirty-eight -> /frəmˌθɜːtiˈwʌntəˌθɜːtiˈeɪt/', 'The prepositions vanish between the figures. Learners often hear two unconnected numbers and miss which direction the change went.');

INSERT INTO quiz_questions (id, learning_item_id, sequence, prompt, choices_json, correct_index, audio_cue_id) VALUES
('qq_l3_m5_ls1', 'itm_l3_m5_listening', 1, 'What happened to household recycling?', '["It fell to 31 per cent","It stayed the same","It rose to 31 per cent","It rose to 38 per cent"]', 3, 'cue_l3_m5_2'),
('qq_l3_m5_ls2', 'itm_l3_m5_listening', 2, 'What happened to food waste collection?', '["It rose by 4 per cent","It fell by about 4 per cent","It doubled","It was not measured"]', 1, 'cue_l3_m5_3'),
('qq_l3_m5_ls3', 'itm_l3_m5_listening', 3, 'What does the officer explicitly label as interpretation rather than fact?', '["The explanation for the fall","The recycling figures","The April proposal","The resident''s question"]', 0, 'cue_l3_m5_5'),
('qq_l3_m5_ls4', 'itm_l3_m5_listening', 4, 'What does the officer promise if things do not improve?', '["To repeat the audit","To change officers","To admit the interpretation was wrong","To reduce collections"]', 2, 'cue_l3_m5_8');

-- ---------------------------------------------------------------------
-- Module 6: Technology & Media
-- ---------------------------------------------------------------------
INSERT INTO audio_assets (id, kind, title, transcript, variety, speaker_count, target_wpm) VALUES
('aud_l3_m6_listen', 'listening', 'Two Headlines, One Study', 'Here are two reports of the same study. Listen for what changes. | A new study suggests that people who sleep less than six hours may be more likely to report low mood. | Scientists prove: lack of sleep causes depression. | Same research. Notice what happened to the hedges. | Suggests became prove. May be more likely to report became causes. | And a correlation between two things became a claim about cause. | The second headline is not a summary. It is a different claim. | Your task is not to distrust everything. It is to notice the swap.', 'BrE', 3, 125),
('aud_l3_m6_pron', 'model_pronunciation', 'Module 6 Pronunciation Model', 'A new study suggests that... | People may be more likely to report low mood. | Scientists prove: lack of sleep causes depression. | Notice what happened to the hedges.', 'BrE', 1, 110);

INSERT INTO audio_cues (id, audio_asset_id, sequence, speaker, text) VALUES
('cue_l3_m6_1', 'aud_l3_m6_listen', 1, 'Tutor', 'Here are two reports of the same study. Listen for what changes.'),
('cue_l3_m6_2', 'aud_l3_m6_listen', 2, 'Reader A', 'A new study suggests that people who sleep less than six hours may be more likely to report low mood.'),
('cue_l3_m6_3', 'aud_l3_m6_listen', 3, 'Reader B', 'Scientists prove: lack of sleep causes depression.'),
('cue_l3_m6_4', 'aud_l3_m6_listen', 4, 'Tutor', 'Same research. Notice what happened to the hedges.'),
('cue_l3_m6_5', 'aud_l3_m6_listen', 5, 'Tutor', 'Suggests became prove. May be more likely to report became causes.'),
('cue_l3_m6_6', 'aud_l3_m6_listen', 6, 'Tutor', 'And a correlation between two things became a claim about cause.'),
('cue_l3_m6_7', 'aud_l3_m6_listen', 7, 'Tutor', 'The second headline is not a summary. It is a different claim.'),
('cue_l3_m6_8', 'aud_l3_m6_listen', 8, 'Tutor', 'Your task is not to distrust everything. It is to notice the swap.');

INSERT INTO learning_items (id, unit_id, sequence, kind, title, body, audio_asset_id) VALUES
('itm_l3_m6_listening', 'unt_l3_m6', 4, 'listening', 'Listening 6 — Two Headlines, One Study',
'LISTENING OBJECTIVES: Compare two reports of the same research; detect selective emphasis; hear where a hedge is dropped.

BEFORE YOU LISTEN: A media-literacy tutor reads two news summaries of one study, then comments. Read the four questions first. Knowing what you are listening for is itself the skill being taught, and it is the difference between hearing words and understanding a conversation.

LISTEN TWICE: First for the general situation only — who is speaking, where, and what they want. Do not stop to decode an unknown word; stopping is what makes learners miss the next sentence. Second time, answer the questions.

THEN: Read the synchronised transcript while listening a third time, and mark every place where what you heard and what is written surprised you. That gap is your own pronunciation target, identified by you rather than assigned to you.

SHADOWING: Record yourself speaking the tutor''s comparison of the two hedges. Your recordings are kept attempt by attempt, so you can hear your own progress, and your instructor can reply in their own voice.', 'aud_l3_m6_listen'),
('itm_l3_m6_pronunciation', 'unt_l3_m6', 5, 'pronunciation', 'Pronunciation Lab 6 — Contrastive Stress, Headline Register & Vanishing Qualifiers',
'HOW TO USE THIS LAB: For each target — listen to the model, say it aloud three times, then record yourself and listen back. Listening back is the step learners skip and the step that works: you cannot correct a sound you have not heard yourself produce.

FOCUS THIS MODULE: The hedges that survive and the hedges that get dropped — an audible difference with real consequences.

Your recordings are kept, so attempt one and attempt ten sit side by side. Your instructor can reply with a spoken model rather than only written notes.', 'aud_l3_m6_pron');

INSERT INTO pronunciation_targets (id, learning_item_id, sequence, focus, target, example, guidance) VALUES
('pron_l3_m6_1', 'itm_l3_m6_pronunciation', 1, 'sentence_stress', 'The swapped words take contrastive stress', 'SUGGESTS became PROVE. MAY BE LIKELY became CAUSES.', 'When a speaker contrasts two versions, both words are heavily stressed. This is the audible shape of the module''s whole analytical point.'),
('pron_l3_m6_2', 'itm_l3_m6_pronunciation', 2, 'intonation', 'Headline delivery is flat, fast and assertive', 'SCIENtists PROVE: LACK of SLEEP CAUSES dePRESSion.', 'Headline register removes hedges and levels the pitch. Recognising that flat assertive contour is itself a critical-reading skill.'),
('pron_l3_m6_3', 'itm_l3_m6_pronunciation', 3, 'connected_speech', 'more likely to report compresses heavily', '/mɔːˈlaɪklitərɪˈpɔːt/', 'The careful qualifiers of research language are exactly the parts that compress in speech, which is part of why they are so easily lost.');

INSERT INTO quiz_questions (id, learning_item_id, sequence, prompt, choices_json, correct_index, audio_cue_id) VALUES
('qq_l3_m6_ls1', 'itm_l3_m6_listening', 1, 'What word does the first report use for its finding?', '["Suggests","Proves","Demonstrates","Confirms"]', 0, 'cue_l3_m6_2'),
('qq_l3_m6_ls2', 'itm_l3_m6_listening', 2, 'What does the second report claim?', '["Sleep may affect mood","Scientists disagree","Lack of sleep causes depression","More research is needed"]', 2, 'cue_l3_m6_3'),
('qq_l3_m6_ls3', 'itm_l3_m6_listening', 3, 'What has changed between the two reports?', '["The sample size","The hedges have been removed","The topic","The date of the study"]', 1, 'cue_l3_m6_5'),
('qq_l3_m6_ls4', 'itm_l3_m6_listening', 4, 'What does the tutor say the task is?', '["To distrust all news","To read only the original study","To avoid headlines","To notice the swap"]', 3, 'cue_l3_m6_8');

-- ---------------------------------------------------------------------
-- Module 7: Health, Body & Mind
-- ---------------------------------------------------------------------
INSERT INTO audio_assets (id, kind, title, transcript, variety, speaker_count, target_wpm) VALUES
('aud_l3_m7_listen', 'listening', 'The Sleep Clinic', 'So why do people wake at three in the morning? | It''s usually not the waking that''s the problem. Everyone wakes briefly several times a night. | The difference is what happens next. If you check the clock, you start calculating. | Four hours left. Then three. And that calculation must raise your alertness, which makes sleep less likely. | So the worry causes the insomnia, rather than the other way round? | Partly, yes. It can''t be the whole story, but it''s a large part of it. | What should people do? | Turn the clock away. It sounds trivial. It isn''t.', 'BrE', 2, 125),
('aud_l3_m7_pron', 'model_pronunciation', 'Module 7 Pronunciation Model', 'Everyone wakes briefly several times a night. | That must raise your alertness. | It can''t be the whole story. | Turn the clock away.', 'BrE', 1, 110);

INSERT INTO audio_cues (id, audio_asset_id, sequence, speaker, text) VALUES
('cue_l3_m7_1', 'aud_l3_m7_listen', 1, 'Presenter', 'So why do people wake at three in the morning?'),
('cue_l3_m7_2', 'aud_l3_m7_listen', 2, 'Specialist', 'It''s usually not the waking that''s the problem. Everyone wakes briefly several times a night.'),
('cue_l3_m7_3', 'aud_l3_m7_listen', 3, 'Specialist', 'The difference is what happens next. If you check the clock, you start calculating.'),
('cue_l3_m7_4', 'aud_l3_m7_listen', 4, 'Specialist', 'Four hours left. Then three. And that calculation must raise your alertness, which makes sleep less likely.'),
('cue_l3_m7_5', 'aud_l3_m7_listen', 5, 'Presenter', 'So the worry causes the insomnia, rather than the other way round?'),
('cue_l3_m7_6', 'aud_l3_m7_listen', 6, 'Specialist', 'Partly, yes. It can''t be the whole story, but it''s a large part of it.'),
('cue_l3_m7_7', 'aud_l3_m7_listen', 7, 'Presenter', 'What should people do?'),
('cue_l3_m7_8', 'aud_l3_m7_listen', 8, 'Specialist', 'Turn the clock away. It sounds trivial. It isn''t.');

INSERT INTO learning_items (id, unit_id, sequence, kind, title, body, audio_asset_id) VALUES
('itm_l3_m7_listening', 'unt_l3_m7', 4, 'listening', 'Listening 7 — The Sleep Clinic',
'LISTENING OBJECTIVES: Follow a specialist explanation for a general listener; understand cause and effect chains; catch deduction modals.

BEFORE YOU LISTEN: A sleep specialist explains a problem and its likely cause on a health programme. Read the four questions first. Knowing what you are listening for is itself the skill being taught, and it is the difference between hearing words and understanding a conversation.

LISTEN TWICE: First for the general situation only — who is speaking, where, and what they want. Do not stop to decode an unknown word; stopping is what makes learners miss the next sentence. Second time, answer the questions.

THEN: Read the synchronised transcript while listening a third time, and mark every place where what you heard and what is written surprised you. That gap is your own pronunciation target, identified by you rather than assigned to you.

SHADOWING: Record yourself speaking the specialist''s explanation of the cycle. Your recordings are kept attempt by attempt, so you can hear your own progress, and your instructor can reply in their own voice.', 'aud_l3_m7_listen'),
('itm_l3_m7_pronunciation', 'unt_l3_m7', 5, 'pronunciation', 'Pronunciation Lab 7 — Deduction Modals, can/can''t at Speed & Causal Pitch Steps',
'HOW TO USE THIS LAB: For each target — listen to the model, say it aloud three times, then record yourself and listen back. Listening back is the step learners skip and the step that works: you cannot correct a sound you have not heard yourself produce.

FOCUS THIS MODULE: Deduction modals — must, might, can''t — and how their stress signals certainty.

Your recordings are kept, so attempt one and attempt ten sit side by side. Your instructor can reply with a spoken model rather than only written notes.', 'aud_l3_m7_pron');

INSERT INTO pronunciation_targets (id, learning_item_id, sequence, focus, target, example, guidance) VALUES
('pron_l3_m7_1', 'itm_l3_m7_pronunciation', 1, 'sentence_stress', 'Deduction modals are stressed and carry certainty', 'That MUST raise your alertness. It CAN''T be the whole story.', 'Must and can''t take strong stress because they are the claim. A flat delivery makes a confident deduction sound like a guess.'),
('pron_l3_m7_2', 'itm_l3_m7_pronunciation', 2, 'phoneme', 'can''t versus can, again but faster', 'It CAN''T be — It can /kən/ be', 'At B1 speed this contrast reappears under pressure. As at A1, listen for the vowel length rather than the /t/, which is often unreleased entirely.'),
('pron_l3_m7_3', 'itm_l3_m7_pronunciation', 3, 'intonation', 'Cause-and-effect chains step down in pitch', 'FOUR hours left. // Then THREE. // And that CALculation must RAISE your alertness.', 'Each step in a causal chain sits slightly lower than the last, then resets at the conclusion. Following the steps is how you follow the reasoning.');

INSERT INTO quiz_questions (id, learning_item_id, sequence, prompt, choices_json, correct_index, audio_cue_id) VALUES
('qq_l3_m7_ls1', 'itm_l3_m7_listening', 1, 'According to the specialist, what is usually NOT the problem?', '["Waking briefly at night","Worrying","Going to bed late","Caffeine"]', 0, 'cue_l3_m7_2'),
('qq_l3_m7_ls2', 'itm_l3_m7_listening', 2, 'What starts the harmful cycle?', '["Noise","Eating late","Checking the clock","Screen light"]', 2, 'cue_l3_m7_3'),
('qq_l3_m7_ls3', 'itm_l3_m7_listening', 3, 'How certain is the specialist that worry is the whole explanation?', '["Completely certain","Certain it is not the whole story","Certain it is irrelevant","Undecided"]', 1, 'cue_l3_m7_6'),
('qq_l3_m7_ls4', 'itm_l3_m7_listening', 4, 'What practical advice is given?', '["Take medication","Get up and read","Set an alarm","Turn the clock away"]', 3, 'cue_l3_m7_8');

-- ---------------------------------------------------------------------
-- Module 8: Travel & Culture
-- ---------------------------------------------------------------------
INSERT INTO audio_assets (id, kind, title, transcript, variety, speaker_count, target_wpm) VALUES
('aud_l3_m8_listen', 'listening', 'The Homestay Misunderstanding', 'Amir, can I have a quick word? Nothing serious. | Of course. Is something wrong? | It''s just that we tend to eat together at seven, and this week the food''s gone cold a few times. | Oh — I''m so sorry. I didn''t realise it mattered. In my family people eat when they''re hungry. | That makes complete sense. I should have explained rather than assumed. | No, I should have asked. I''ll text you if I''m going to be late. | That would be perfect. And honestly, it wasn''t a complaint. | It was a bit, though.', 'BrE', 2, 125),
('aud_l3_m8_pron', 'model_pronunciation', 'Module 8 Pronunciation Model', 'Can I have a quick word? | It''s just that we tend to eat at seven. | I didn''t realise it mattered. | I should have explained.', 'BrE', 1, 110);

INSERT INTO audio_cues (id, audio_asset_id, sequence, speaker, text) VALUES
('cue_l3_m8_1', 'aud_l3_m8_listen', 1, 'Host', 'Amir, can I have a quick word? Nothing serious.'),
('cue_l3_m8_2', 'aud_l3_m8_listen', 2, 'Amir', 'Of course. Is something wrong?'),
('cue_l3_m8_3', 'aud_l3_m8_listen', 3, 'Host', 'It''s just that we tend to eat together at seven, and this week the food''s gone cold a few times.'),
('cue_l3_m8_4', 'aud_l3_m8_listen', 4, 'Amir', 'Oh — I''m so sorry. I didn''t realise it mattered. In my family people eat when they''re hungry.'),
('cue_l3_m8_5', 'aud_l3_m8_listen', 5, 'Host', 'That makes complete sense. I should have explained rather than assumed.'),
('cue_l3_m8_6', 'aud_l3_m8_listen', 6, 'Amir', 'No, I should have asked. I''ll text you if I''m going to be late.'),
('cue_l3_m8_7', 'aud_l3_m8_listen', 7, 'Host', 'That would be perfect. And honestly, it wasn''t a complaint.'),
('cue_l3_m8_8', 'aud_l3_m8_listen', 8, 'Amir', 'It was a bit, though.');

INSERT INTO learning_items (id, unit_id, sequence, kind, title, body, audio_asset_id) VALUES
('itm_l3_m8_listening', 'unt_l3_m8', 4, 'listening', 'Listening 8 — The Homestay Misunderstanding',
'LISTENING OBJECTIVES: Follow an intercultural misunderstanding and its resolution; distinguish intention from effect; hear indirect complaint.

BEFORE YOU LISTEN: A homestay student and host discuss a misunderstanding about mealtimes. Read the four questions first. Knowing what you are listening for is itself the skill being taught, and it is the difference between hearing words and understanding a conversation.

LISTEN TWICE: First for the general situation only — who is speaking, where, and what they want. Do not stop to decode an unknown word; stopping is what makes learners miss the next sentence. Second time, answer the questions.

THEN: Read the synchronised transcript while listening a third time, and mark every place where what you heard and what is written surprised you. That gap is your own pronunciation target, identified by you rather than assigned to you.

SHADOWING: Record yourself speaking the host''s indirect complaint and the student''s repair. Your recordings are kept attempt by attempt, so you can hear your own progress, and your instructor can reply in their own voice.', 'aud_l3_m8_listen'),
('itm_l3_m8_pronunciation', 'unt_l3_m8', 5, 'pronunciation', 'Pronunciation Lab 8 — Hinted Complaint, Minimisers & Pronoun Stress in Repair',
'HOW TO USE THIS LAB: For each target — listen to the model, say it aloud three times, then record yourself and listen back. Listening back is the step learners skip and the step that works: you cannot correct a sound you have not heard yourself produce.

FOCUS THIS MODULE: Indirect complaint — how English criticises without naming the person, and how to hear it.

Your recordings are kept, so attempt one and attempt ten sit side by side. Your instructor can reply with a spoken model rather than only written notes.', 'aud_l3_m8_pron');

INSERT INTO pronunciation_targets (id, learning_item_id, sequence, focus, target, example, guidance) VALUES
('pron_l3_m8_1', 'itm_l3_m8_pronunciation', 1, 'intonation', 'Indirect complaint stays light and rises slightly', 'It''s JUST that we tend to eat toGETHer at SEVen...', 'The upward, light delivery is what makes it a hint rather than an accusation. A falling delivery of identical words would be a formal complaint.'),
('pron_l3_m8_2', 'itm_l3_m8_pronunciation', 2, 'connected_speech', 'Minimisers compress and cluster', 'it''s just that -> /ɪtsˈdʒʌstðət/; a bit -> /əˈbɪt/', 'English wraps criticism in small fast words. Learners who hear only the stressed content receive the complaint without its softening — and often overreact.'),
('pron_l3_m8_3', 'itm_l3_m8_pronunciation', 3, 'sentence_stress', 'Repair stresses the pronoun taking responsibility', 'I should have exPLAINED. — No, I should have ASKED.', 'Stressing the pronoun is how each speaker claims the fault. That pronoun stress is the audible mechanism of a repair, and it is easy to miss.');

INSERT INTO quiz_questions (id, learning_item_id, sequence, prompt, choices_json, correct_index, audio_cue_id) VALUES
('qq_l3_m8_ls1', 'itm_l3_m8_listening', 1, 'How does the host open the conversation?', '["By minimising it — nothing serious","Directly and formally","With an apology","By email"]', 0, 'cue_l3_m8_1'),
('qq_l3_m8_ls2', 'itm_l3_m8_listening', 2, 'What has been happening?', '["Amir has missed lessons","Amir has been noisy","The food has gone cold","The rent is late"]', 2, 'cue_l3_m8_3'),
('qq_l3_m8_ls3', 'itm_l3_m8_listening', 3, 'Why did Amir not realise?', '["He was told the wrong time","In his family people eat when hungry","He does not eat dinner","He was working late"]', 1, 'cue_l3_m8_4'),
('qq_l3_m8_ls4', 'itm_l3_m8_listening', 4, 'How does the exchange end?', '["In disagreement","With the host apologising only","With no resolution","With both taking some responsibility"]', 3, 'cue_l3_m8_8');

-- ---------------------------------------------------------------------
-- Module 9: Academic Foundations
-- ---------------------------------------------------------------------
INSERT INTO audio_assets (id, kind, title, transcript, variety, speaker_count, target_wpm) VALUES
('aud_l3_m9_listen', 'listening', 'Referencing and the Missing Source', 'I''ve used an idea but I can''t find where I read it. What do I do? | First, don''t panic, and don''t guess a source. Guessing is worse than omitting. | Worse? Why? | Because a wrong citation sends your reader somewhere that doesn''t support the claim. That damages trust more than a gap does. | If you genuinely can''t trace it, either find a source that does support the point, or state the idea as your own reasoning. | And if I find the original later? | Add it. Referencing isn''t a formality — it''s how a reader checks you. | That''s a much better reason than the one I was given at school.', 'BrE', 2, 128),
('aud_l3_m9_pron', 'model_pronunciation', 'Module 9 Pronunciation Model', 'Don''t guess a source. | A wrong citation damages trust. | If you can''t trace it, state it as your own reasoning. | Referencing is how a reader checks you.', 'BrE', 1, 113);

INSERT INTO audio_cues (id, audio_asset_id, sequence, speaker, text) VALUES
('cue_l3_m9_1', 'aud_l3_m9_listen', 1, 'Student', 'I''ve used an idea but I can''t find where I read it. What do I do?'),
('cue_l3_m9_2', 'aud_l3_m9_listen', 2, 'Librarian', 'First, don''t panic, and don''t guess a source. Guessing is worse than omitting.'),
('cue_l3_m9_3', 'aud_l3_m9_listen', 3, 'Student', 'Worse? Why?'),
('cue_l3_m9_4', 'aud_l3_m9_listen', 4, 'Librarian', 'Because a wrong citation sends your reader somewhere that doesn''t support the claim. That damages trust more than a gap does.'),
('cue_l3_m9_5', 'aud_l3_m9_listen', 5, 'Librarian', 'If you genuinely can''t trace it, either find a source that does support the point, or state the idea as your own reasoning.'),
('cue_l3_m9_6', 'aud_l3_m9_listen', 6, 'Student', 'And if I find the original later?'),
('cue_l3_m9_7', 'aud_l3_m9_listen', 7, 'Librarian', 'Add it. Referencing isn''t a formality — it''s how a reader checks you.'),
('cue_l3_m9_8', 'aud_l3_m9_listen', 8, 'Student', 'That''s a much better reason than the one I was given at school.');

INSERT INTO learning_items (id, unit_id, sequence, kind, title, body, audio_asset_id) VALUES
('itm_l3_m9_listening', 'unt_l3_m9', 4, 'listening', 'Listening 9 — Referencing and the Missing Source',
'LISTENING OBJECTIVES: Follow academic procedural advice; distinguish rule from rationale; catch conditional consequences.

BEFORE YOU LISTEN: A librarian explains referencing to a first-year student who has lost a source. Read the four questions first. Knowing what you are listening for is itself the skill being taught, and it is the difference between hearing words and understanding a conversation.

LISTEN TWICE: First for the general situation only — who is speaking, where, and what they want. Do not stop to decode an unknown word; stopping is what makes learners miss the next sentence. Second time, answer the questions.

THEN: Read the synchronised transcript while listening a third time, and mark every place where what you heard and what is written surprised you. That gap is your own pronunciation target, identified by you rather than assigned to you.

SHADOWING: Record yourself speaking the librarian''s explanation of why referencing exists. Your recordings are kept attempt by attempt, so you can hear your own progress, and your instructor can reply in their own voice.', 'aud_l3_m9_listen'),
('itm_l3_m9_pronunciation', 'unt_l3_m9', 5, 'pronunciation', 'Pronunciation Lab 9 — Rule-versus-Reason Stress, Academic Reduction & Conditional Shape',
'HOW TO USE THIS LAB: For each target — listen to the model, say it aloud three times, then record yourself and listen back. Listening back is the step learners skip and the step that works: you cannot correct a sound you have not heard yourself produce.

FOCUS THIS MODULE: Academic register at speed, and the stress that separates a rule from the reason behind it.

Your recordings are kept, so attempt one and attempt ten sit side by side. Your instructor can reply with a spoken model rather than only written notes.', 'aud_l3_m9_pron');

INSERT INTO pronunciation_targets (id, learning_item_id, sequence, focus, target, example, guidance) VALUES
('pron_l3_m9_1', 'itm_l3_m9_pronunciation', 1, 'sentence_stress', 'Rules are stressed on the verb; reasons on the cause', 'DON''T GUESS a source. — BeCAUSE a wrong citation sends your reader SOMEwhere WRONG.', 'Instruction and justification have different rhythms. Recognising the switch tells you when the speaker has moved from what to why.'),
('pron_l3_m9_2', 'itm_l3_m9_pronunciation', 2, 'connected_speech', 'Academic register still reduces', 'that doesn''t -> /ðətˈdʌznt/; can''t you -> /kɑːntʃə/', 'Formality does not stop reduction. Expecting careful full forms in academic speech is why lectures feel faster than seminars, when both are equally reduced.'),
('pron_l3_m9_3', 'itm_l3_m9_pronunciation', 3, 'intonation', 'Conditional consequences fall on the outcome', 'If you genuinely CAN''T trace it, // either FIND a source // or STATE it as your own.', 'The condition rises, the options fall. Hearing that shape lets you count the options before you have decoded them.');

INSERT INTO quiz_questions (id, learning_item_id, sequence, prompt, choices_json, correct_index, audio_cue_id) VALUES
('qq_l3_m9_ls1', 'itm_l3_m9_listening', 1, 'What does the librarian say NOT to do?', '["Cite the idea","Ask a tutor","Guess a source","Remove the sentence"]', 2, 'cue_l3_m9_2'),
('qq_l3_m9_ls2', 'itm_l3_m9_listening', 2, 'Why is a wrong citation worse than none?', '["It sends the reader somewhere that does not support the claim","It is easier to detect","It takes longer to fix","It breaks the word limit"]', 0, 'cue_l3_m9_4'),
('qq_l3_m9_ls3', 'itm_l3_m9_listening', 3, 'What two options does the librarian offer?', '["Delete it or rewrite it","Ask a friend or guess","Cite the textbook or omit","Find a supporting source or claim it as own reasoning"]', 3, 'cue_l3_m9_5'),
('qq_l3_m9_ls4', 'itm_l3_m9_listening', 4, 'How does the librarian define referencing?', '["A formality","How a reader checks you","A style requirement","A university rule"]', 1, 'cue_l3_m9_7');

-- ---------------------------------------------------------------------
-- Module 10: Review & Consolidation
-- ---------------------------------------------------------------------
INSERT INTO audio_assets (id, kind, title, transcript, variety, speaker_count, target_wpm) VALUES
('aud_l3_m10_listen', 'listening', 'The End-of-Term Panel', 'We''ve asked three people what they''d change about the course. Dr Osei? | I''d extend the project work. Attendance has risen since we introduced it — about twelve per cent. | I don''t dispute the figure, but I suspect attendance rose for other reasons too. | That''s fair. It might be the timetable change rather than the projects. | Ms Tanaka, you''ve taught the module twice now. | I have, yes. My worry is workload. Students say they''ve enjoyed it, but several have told me they''re exhausted. | So the recommendation would be...? | Keep the projects, halve the reading. If we don''t, we''ll lose the benefit to tiredness.', 'BrE', 4, 130),
('aud_l3_m10_pron', 'model_pronunciation', 'Module 10 Pronunciation Model', 'Attendance has risen by about twelve per cent. | I don''t dispute the figure. | It might be the timetable change. | Keep the projects, halve the reading.', 'BrE', 1, 115);

INSERT INTO audio_cues (id, audio_asset_id, sequence, speaker, text) VALUES
('cue_l3_m10_1', 'aud_l3_m10_listen', 1, 'Chair', 'We''ve asked three people what they''d change about the course. Dr Osei?'),
('cue_l3_m10_2', 'aud_l3_m10_listen', 2, 'Osei', 'I''d extend the project work. Attendance has risen since we introduced it — about twelve per cent.'),
('cue_l3_m10_3', 'aud_l3_m10_listen', 3, 'Marín', 'I don''t dispute the figure, but I suspect attendance rose for other reasons too.'),
('cue_l3_m10_4', 'aud_l3_m10_listen', 4, 'Osei', 'That''s fair. It might be the timetable change rather than the projects.'),
('cue_l3_m10_5', 'aud_l3_m10_listen', 5, 'Chair', 'Ms Tanaka, you''ve taught the module twice now.'),
('cue_l3_m10_6', 'aud_l3_m10_listen', 6, 'Tanaka', 'I have, yes. My worry is workload. Students say they''ve enjoyed it, but several have told me they''re exhausted.'),
('cue_l3_m10_7', 'aud_l3_m10_listen', 7, 'Chair', 'So the recommendation would be...?'),
('cue_l3_m10_8', 'aud_l3_m10_listen', 8, 'Tanaka', 'Keep the projects, halve the reading. If we don''t, we''ll lose the benefit to tiredness.');

INSERT INTO learning_items (id, unit_id, sequence, kind, title, body, audio_asset_id) VALUES
('itm_l3_m10_listening', 'unt_l3_m10', 4, 'listening', 'Listening 10 — The End-of-Term Panel',
'LISTENING OBJECTIVES: Integrate every Level III listening skill; follow a multi-speaker panel with opinion, concession, data, hedging and advice.

BEFORE YOU LISTEN: This is the Level III cumulative listening: three speakers on an end-of-term panel, drawing on all nine modules. Read the four questions first. Knowing what you are listening for is itself the skill being taught, and it is the difference between hearing words and understanding a conversation.

LISTEN TWICE: First for the general situation only — who is speaking, where, and what they want. Do not stop to decode an unknown word; stopping is what makes learners miss the next sentence. Second time, answer the questions.

THEN: Read the synchronised transcript while listening a third time, and mark every place where what you heard and what is written surprised you. That gap is your own pronunciation target, identified by you rather than assigned to you.

SHADOWING: Record yourself speaking one full speaker turn, then the disagreement sequence. Your recordings are kept attempt by attempt, so you can hear your own progress, and your instructor can reply in their own voice.', 'aud_l3_m10_listen'),
('itm_l3_m10_pronunciation', 'unt_l3_m10', 5, 'pronunciation', 'Pronunciation Lab 10 — Level III Consolidation — Auxiliaries, Hedges & Panel Rhythm',
'HOW TO USE THIS LAB: For each target — listen to the model, say it aloud three times, then record yourself and listen back. Listening back is the step learners skip and the step that works: you cannot correct a sound you have not heard yourself produce.

FOCUS THIS MODULE: Everything from the level, with attention to the auxiliaries and hedges that carry meaning while being nearly inaudible.

Your recordings are kept, so attempt one and attempt ten sit side by side. Your instructor can reply with a spoken model rather than only written notes.', 'aud_l3_m10_pron');

INSERT INTO pronunciation_targets (id, learning_item_id, sequence, focus, target, example, guidance) VALUES
('pron_l3_m10_1', 'itm_l3_m10_pronunciation', 1, 'connected_speech', 'Auxiliaries and hedges together at full speed', 'they''ve /ðeɪv/, I suspect /aɪsəˈspekt/, it might be /ɪtˈmaɪtbi/', 'Level III closes on its central listening problem: the words carrying grammar and certainty are the least audible ones. Hearing them is the level''s real achievement.'),
('pron_l3_m10_2', 'itm_l3_m10_pronunciation', 2, 'sentence_stress', 'Panel disagreement keeps the concede-and-turn rhythm', 'I don''t dispute the FIGure, BUT I suSPECT...', 'Module 4''s pattern, now among three speakers. Tracking who concedes what is how you follow a panel without decoding every word.'),
('pron_l3_m10_3', 'itm_l3_m10_pronunciation', 3, 'intonation', 'Recommendations end on a fall, conditions on a rise', 'KEEP the projects, HALVE the reading. // If we DON''T, we''ll LOSE the benefit.', 'A firm falling recommendation followed by a rising-then-falling conditional warning. This is the shape of professional advice, and it recurs throughout Levels IV to VI.');

INSERT INTO quiz_questions (id, learning_item_id, sequence, prompt, choices_json, correct_index, audio_cue_id) VALUES
('qq_l3_m10_ls1', 'itm_l3_m10_listening', 1, 'By how much has attendance risen?', '["Two per cent","About twelve per cent","Ten per cent","Twenty per cent"]', 1, 'cue_l3_m10_2'),
('qq_l3_m10_ls2', 'itm_l3_m10_listening', 2, 'What does Marín NOT dispute?', '["The recommendation","The workload","The timetable","The figure"]', 3, 'cue_l3_m10_3'),
('qq_l3_m10_ls3', 'itm_l3_m10_listening', 3, 'What alternative explanation is offered?', '["Better teaching","Smaller classes","The timetable change","Easier assessment"]', 2, 'cue_l3_m10_4'),
('qq_l3_m10_ls4', 'itm_l3_m10_listening', 4, 'What is Tanaka''s final recommendation?', '["Keep the projects and halve the reading","Remove the projects","Increase the reading","Postpone the decision"]', 0, 'cue_l3_m10_8');

