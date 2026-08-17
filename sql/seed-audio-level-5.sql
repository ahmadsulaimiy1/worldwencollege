-- AIPC — Audio curriculum seed: Level V (Advanced, C1).
--
-- See sql/seed-audio-level-1.sql and docs/lms-architecture.md
-- § The audio layer. Scripts, cues, questions and targets are complete
-- authored curriculum; recordings are not — every media_url and cue
-- timing is NULL. Adding narration later is an UPDATE, not a
-- structural change.
--
-- C1 delivery is 145-150 wpm — natural senior-professional pace, with implicature, understatement and unmarked disagreement throughout.

-- Re-sequence so the audio strand sits where the lessons assume it:
-- present -> practise -> listen -> pronounce -> test.
UPDATE learning_items SET sequence = 6 WHERE id LIKE 'itm_l5_m%_quiz';
UPDATE learning_items SET sequence = 7 WHERE id LIKE 'itm_l5_m%_assignment';
UPDATE learning_items SET sequence = 5 WHERE id = 'itm_l5_m10_examquiz';
UPDATE learning_items SET sequence = 6 WHERE id = 'itm_l5_m10_examassignment';

-- ---------------------------------------------------------------------
-- Module 1: Nuance & Idiom
-- ---------------------------------------------------------------------
INSERT INTO audio_assets (id, kind, title, transcript, variety, speaker_count, target_wpm) VALUES
('aud_l5_m1_listen', 'listening', 'Reading the Room', 'Do you think the board will approve it? | They''ll certainly give it a very thorough hearing. | That''s not quite a yes, is it? | It''s not quite a no either. Look -- the paper is good. The timing is dreadful. | Because of the budget round? | Because of the budget round, and because Halloway''s still smarting about the last one. | So I should wait. | I''d never tell you to wait. I''d simply observe that April is a much more forgiving month.', 'BrE', 2, 145),
('aud_l5_m1_pron', 'model_pronunciation', 'Module 1 Pronunciation Model', 'They''ll give it a very thorough hearing. | The paper is good. The timing is dreadful. | I''d never tell you to wait. | April is a much more forgiving month.', 'BrE', 1, 130);

INSERT INTO audio_cues (id, audio_asset_id, sequence, speaker, text) VALUES
('cue_l5_m1_1', 'aud_l5_m1_listen', 1, 'Junior', 'Do you think the board will approve it?'),
('cue_l5_m1_2', 'aud_l5_m1_listen', 2, 'Senior', 'They''ll certainly give it a very thorough hearing.'),
('cue_l5_m1_3', 'aud_l5_m1_listen', 3, 'Junior', 'That''s not quite a yes, is it?'),
('cue_l5_m1_4', 'aud_l5_m1_listen', 4, 'Senior', 'It''s not quite a no either. Look -- the paper is good. The timing is dreadful.'),
('cue_l5_m1_5', 'aud_l5_m1_listen', 5, 'Junior', 'Because of the budget round?'),
('cue_l5_m1_6', 'aud_l5_m1_listen', 6, 'Senior', 'Because of the budget round, and because Halloway''s still smarting about the last one.'),
('cue_l5_m1_7', 'aud_l5_m1_listen', 7, 'Junior', 'So I should wait.'),
('cue_l5_m1_8', 'aud_l5_m1_listen', 8, 'Senior', 'I''d never tell you to wait. I''d simply observe that April is a much more forgiving month.');

INSERT INTO learning_items (id, unit_id, sequence, kind, title, body, audio_asset_id) VALUES
('itm_l5_m1_listening', 'unt_l5_m1', 4, 'listening', 'Listening 1 -- Reading the Room',
'LISTENING OBJECTIVES: Detect implicature; hear what is meant but not said; recognise register-shifting within one turn.

BEFORE YOU LISTEN: A senior colleague gives an answer that means considerably less than it appears to. Read the four questions first. Knowing what you are listening for is itself the skill being taught, and it is the difference between hearing words and understanding a conversation.

LISTEN TWICE: First for the general situation only -- who is speaking, where, and what they want. Do not stop to decode an unknown word; stopping is what makes learners miss the next sentence. Second time, answer the questions.

THEN: Read the synchronised transcript while listening a third time, and mark every place where what you heard and what is written surprised you. That gap is your own pronunciation target, identified by you rather than assigned to you.

SHADOWING: Record yourself speaking the ambiguous answer, keeping the implicature intact. Your recordings are kept attempt by attempt, so you can hear your own progress, and your instructor can reply in their own voice.', 'aud_l5_m1_listen'),
('itm_l5_m1_pronunciation', 'unt_l5_m1', 5, 'pronunciation', 'Pronunciation Lab 1 -- Implicature by Intonation, Evaluative Contrast & Deniable Advice',
'HOW TO USE THIS LAB: For each target -- listen to the model, say it aloud three times, then record yourself and listen back. Listening back is the step learners skip and the step that works: you cannot correct a sound you have not heard yourself produce.

FOCUS THIS MODULE: Implicature carried by intonation alone -- where the words say yes and the melody says no.

Your recordings are kept, so attempt one and attempt ten sit side by side. Your instructor can reply with a spoken model rather than only written notes.', 'aud_l5_m1_pron');

INSERT INTO pronunciation_targets (id, learning_item_id, sequence, focus, target, example, guidance) VALUES
('pron_l5_m1_1', 'itm_l5_m1_pronunciation', 1, 'intonation', 'A very thorough hearing said with a level tone means no', 'They''ll CERTainly give it a very THORough hearing. (level, unenthusiastic)', 'Enthusiasm would rise and vary; a level contour on positive words is heard by native listeners as polite refusal. This is the single most important C1 listening skill.'),
('pron_l5_m1_2', 'itm_l5_m1_pronunciation', 2, 'sentence_stress', 'Contrastive pairs carry the real message', 'The PAPer is GOOD. The TIMing is DREADful.', 'Two short parallel sentences with heavy stress on the evaluations. The structure does the work; the speaker never says the proposal will fail.'),
('pron_l5_m1_3', 'itm_l5_m1_pronunciation', 3, 'connected_speech', 'Distancing formulas compress', 'I''d never tell you to -> /aɪdˈnevəteljutə/; I''d simply observe -> /aɪdˈsɪmpliəbˈzɜːv/', 'These constructions let a speaker advise without advising. They are fast, formulaic, and their compression is precisely what makes them deniable.');

INSERT INTO quiz_questions (id, learning_item_id, sequence, prompt, choices_json, correct_index, audio_cue_id) VALUES
('qq_l5_m1_ls1', 'itm_l5_m1_listening', 1, 'What does the senior colleague actually communicate about approval?', '["It is unlikely now","It is certain","It has already been refused","It is not their decision"]', 0, 'cue_l5_m1_2'),
('qq_l5_m1_ls2', 'itm_l5_m1_listening', 2, 'What does the senior say is good?', '["The timing","The budget","The paper","The board''s mood"]', 2, 'cue_l5_m1_4'),
('qq_l5_m1_ls3', 'itm_l5_m1_listening', 3, 'What second reason is given for the poor timing?', '["A staffing change","Halloway''s residual annoyance","A missed deadline","A rival proposal"]', 1, 'cue_l5_m1_6'),
('qq_l5_m1_ls4', 'itm_l5_m1_listening', 4, 'How does the senior deliver the advice to wait?', '["As a direct instruction","In writing","By refusing to answer","As an observation they will not call advice"]', 3, 'cue_l5_m1_8');

-- ---------------------------------------------------------------------
-- Module 2: Academic Writing III
-- ---------------------------------------------------------------------
INSERT INTO audio_assets (id, kind, title, transcript, variety, speaker_count, target_wpm) VALUES
('aud_l5_m2_listen', 'listening', 'The Viva Question', 'Your sample is drawn entirely from one institution. Why should we generalise from it? | We shouldn''t, and I don''t. Chapter six limits the claim to comparable institutions. | Comparable on what dimension? | Size, funding model, and intake profile. I set those out on page one hundred and four. | Suppose intake profile is doing all the work. Your effect might be an artefact of selection. | That''s the strongest objection to the thesis, and I can''t fully exclude it. | What I can show is that the effect persists within intake bands, which narrows the space for that explanation. | Narrows, but does not close. | No. Closing it would need a multi-site design, which I recommend in chapter eight.', 'BrE', 2, 145),
('aud_l5_m2_pron', 'model_pronunciation', 'Module 2 Pronunciation Model', 'Why should we generalise from it? | We shouldn''t, and I don''t. | That''s the strongest objection to the thesis. | Narrows, but does not close.', 'BrE', 1, 130);

INSERT INTO audio_cues (id, audio_asset_id, sequence, speaker, text) VALUES
('cue_l5_m2_1', 'aud_l5_m2_listen', 1, 'Examiner', 'Your sample is drawn entirely from one institution. Why should we generalise from it?'),
('cue_l5_m2_2', 'aud_l5_m2_listen', 2, 'Candidate', 'We shouldn''t, and I don''t. Chapter six limits the claim to comparable institutions.'),
('cue_l5_m2_3', 'aud_l5_m2_listen', 3, 'Examiner', 'Comparable on what dimension?'),
('cue_l5_m2_4', 'aud_l5_m2_listen', 4, 'Candidate', 'Size, funding model, and intake profile. I set those out on page one hundred and four.'),
('cue_l5_m2_5', 'aud_l5_m2_listen', 5, 'Examiner', 'Suppose intake profile is doing all the work. Your effect might be an artefact of selection.'),
('cue_l5_m2_6', 'aud_l5_m2_listen', 6, 'Candidate', 'That''s the strongest objection to the thesis, and I can''t fully exclude it.'),
('cue_l5_m2_7', 'aud_l5_m2_listen', 7, 'Candidate', 'What I can show is that the effect persists within intake bands, which narrows the space for that explanation.'),
('cue_l5_m2_8', 'aud_l5_m2_listen', 8, 'Examiner', 'Narrows, but does not close.'),
('cue_l5_m2_9', 'aud_l5_m2_listen', 9, 'Candidate', 'No. Closing it would need a multi-site design, which I recommend in chapter eight.');

INSERT INTO learning_items (id, unit_id, sequence, kind, title, body, audio_asset_id) VALUES
('itm_l5_m2_listening', 'unt_l5_m2', 4, 'listening', 'Listening 2 -- The Viva Question',
'LISTENING OBJECTIVES: Follow high-level academic questioning; distinguish a challenge to method from a challenge to claim; hear a defensible concession.

BEFORE YOU LISTEN: An examiner questions a doctoral candidate about methodology. Read the four questions first. Knowing what you are listening for is itself the skill being taught, and it is the difference between hearing words and understanding a conversation.

LISTEN TWICE: First for the general situation only -- who is speaking, where, and what they want. Do not stop to decode an unknown word; stopping is what makes learners miss the next sentence. Second time, answer the questions.

THEN: Read the synchronised transcript while listening a third time, and mark every place where what you heard and what is written surprised you. That gap is your own pronunciation target, identified by you rather than assigned to you.

SHADOWING: Record yourself speaking the candidate''s concession and defence. Your recordings are kept attempt by attempt, so you can hear your own progress, and your instructor can reply in their own voice.', 'aud_l5_m2_listen'),
('itm_l5_m2_pronunciation', 'unt_l5_m2', 5, 'pronunciation', 'Pronunciation Lab 2 -- Concede-then-Defend, Modal Boundary Stress & Protected References',
'HOW TO USE THIS LAB: For each target -- listen to the model, say it aloud three times, then record yourself and listen back. Listening back is the step learners skip and the step that works: you cannot correct a sound you have not heard yourself produce.

FOCUS THIS MODULE: Sustained academic register under challenge, and the pitch of a concession that does not surrender.

Your recordings are kept, so attempt one and attempt ten sit side by side. Your instructor can reply with a spoken model rather than only written notes.', 'aud_l5_m2_pron');

INSERT INTO pronunciation_targets (id, learning_item_id, sequence, focus, target, example, guidance) VALUES
('pron_l5_m2_1', 'itm_l5_m2_pronunciation', 1, 'intonation', 'Concession falls, defence rises again immediately', 'That''s the STRONGest objection, and I CAN''T fully exclude it. // What I CAN show is...', 'The fall concedes; the immediate re-rise on what I CAN show is the defence. Delivered without that re-rise, the concession sounds like collapse.'),
('pron_l5_m2_2', 'itm_l5_m2_pronunciation', 2, 'sentence_stress', 'Modal contrast carries the whole answer', 'I CAN''T fully exclude it. // What I CAN show is...', 'Stress on can''t and can in successive clauses marks the exact boundary of the claim. This is the audible form of scholarly precision.'),
('pron_l5_m2_3', 'itm_l5_m2_pronunciation', 3, 'connected_speech', 'Page and chapter references stay clear while framing compresses', 'I set those out on page one hundred and four -> framing fast, NUMBER clear', 'As in negotiation, the citable facts resist compression. Speakers protect the parts a listener must be able to check.');

INSERT INTO quiz_questions (id, learning_item_id, sequence, prompt, choices_json, correct_index, audio_cue_id) VALUES
('qq_l5_m2_ls1', 'itm_l5_m2_listening', 1, 'What is the examiner''s first challenge?', '["The sample is too small","The statistics are wrong","The literature is dated","The sample is from one institution"]', 3, 'cue_l5_m2_1'),
('qq_l5_m2_ls2', 'itm_l5_m2_listening', 2, 'On what dimensions does the candidate define comparability?', '["Age, location, size","Size, funding model, intake profile","Funding, staffing, results","Intake, results, reputation"]', 1, 'cue_l5_m2_4'),
('qq_l5_m2_ls3', 'itm_l5_m2_listening', 3, 'What does the candidate concede?', '["The selection artefact cannot be fully excluded","The thesis is wrong","The method was inappropriate","The data is unreliable"]', 0, 'cue_l5_m2_6'),
('qq_l5_m2_ls4', 'itm_l5_m2_listening', 4, 'What would be needed to close the objection?', '["A larger sample","A longer study","A multi-site design","Different statistics"]', 2, 'cue_l5_m2_9');

-- ---------------------------------------------------------------------
-- Module 3: Leadership & Persuasion
-- ---------------------------------------------------------------------
INSERT INTO audio_assets (id, kind, title, transcript, variety, speaker_count, target_wpm) VALUES
('aud_l5_m3_listen', 'listening', 'The Announcement Nobody Wanted', 'I''ll give you the decision first, then the reasoning, then take questions. | We''re closing the Bristol office at the end of the financial year. | This was my recommendation and the board accepted it. I''m not going to hide behind them. | The reasoning is that we cannot fund three sites at current occupancy, and Bristol is the least used. | Least used because you cut the local team two years ago. | That''s a fair point and it''s partly true. The cut made the occupancy problem worse. | It doesn''t change the arithmetic now, but you''re right that we contributed to it. | So what happens to us? | Everyone is offered relocation or redundancy on enhanced terms. Details this afternoon, in writing.', 'BrE', 2, 145),
('aud_l5_m3_pron', 'model_pronunciation', 'Module 3 Pronunciation Model', 'I''ll give you the decision first. | This was my recommendation. | That''s a fair point and it''s partly true. | It doesn''t change the arithmetic now.', 'BrE', 1, 130);

INSERT INTO audio_cues (id, audio_asset_id, sequence, speaker, text) VALUES
('cue_l5_m3_1', 'aud_l5_m3_listen', 1, 'Director', 'I''ll give you the decision first, then the reasoning, then take questions.'),
('cue_l5_m3_2', 'aud_l5_m3_listen', 2, 'Director', 'We''re closing the Bristol office at the end of the financial year.'),
('cue_l5_m3_3', 'aud_l5_m3_listen', 3, 'Director', 'This was my recommendation and the board accepted it. I''m not going to hide behind them.'),
('cue_l5_m3_4', 'aud_l5_m3_listen', 4, 'Director', 'The reasoning is that we cannot fund three sites at current occupancy, and Bristol is the least used.'),
('cue_l5_m3_5', 'aud_l5_m3_listen', 5, 'Staff member', 'Least used because you cut the local team two years ago.'),
('cue_l5_m3_6', 'aud_l5_m3_listen', 6, 'Director', 'That''s a fair point and it''s partly true. The cut made the occupancy problem worse.'),
('cue_l5_m3_7', 'aud_l5_m3_listen', 7, 'Director', 'It doesn''t change the arithmetic now, but you''re right that we contributed to it.'),
('cue_l5_m3_8', 'aud_l5_m3_listen', 8, 'Staff member', 'So what happens to us?'),
('cue_l5_m3_9', 'aud_l5_m3_listen', 9, 'Director', 'Everyone is offered relocation or redundancy on enhanced terms. Details this afternoon, in writing.');

INSERT INTO learning_items (id, unit_id, sequence, kind, title, body, audio_asset_id) VALUES
('itm_l5_m3_listening', 'unt_l5_m3', 4, 'listening', 'Listening 3 -- The Announcement Nobody Wanted',
'LISTENING OBJECTIVES: Follow leadership communication under pressure; distinguish acknowledgement from justification; hear where a leader takes ownership.

BEFORE YOU LISTEN: A director announces an unpopular decision to staff and takes questions. Read the four questions first. Knowing what you are listening for is itself the skill being taught, and it is the difference between hearing words and understanding a conversation.

LISTEN TWICE: First for the general situation only -- who is speaking, where, and what they want. Do not stop to decode an unknown word; stopping is what makes learners miss the next sentence. Second time, answer the questions.

THEN: Read the synchronised transcript while listening a third time, and mark every place where what you heard and what is written surprised you. That gap is your own pronunciation target, identified by you rather than assigned to you.

SHADOWING: Record yourself speaking the ownership statement and the answer to the hostile question. Your recordings are kept attempt by attempt, so you can hear your own progress, and your instructor can reply in their own voice.', 'aud_l5_m3_listen'),
('itm_l5_m3_pronunciation', 'unt_l5_m3', 5, 'pronunciation', 'Pronunciation Lab 3 -- Ownership Stress, Slowed Concession & Three-Beat Framing',
'HOW TO USE THIS LAB: For each target -- listen to the model, say it aloud three times, then record yourself and listen back. Listening back is the step learners skip and the step that works: you cannot correct a sound you have not heard yourself produce.

FOCUS THIS MODULE: The register of ownership -- first person, unhedged, and slower than the surrounding speech.

Your recordings are kept, so attempt one and attempt ten sit side by side. Your instructor can reply with a spoken model rather than only written notes.', 'aud_l5_m3_pron');

INSERT INTO pronunciation_targets (id, learning_item_id, sequence, focus, target, example, guidance) VALUES
('pron_l5_m3_1', 'itm_l5_m3_pronunciation', 1, 'sentence_stress', 'Ownership stresses the first-person pronoun', 'This was MY recommendation. // I''m NOT going to hide behind them.', 'Stressing I and my is how English marks accountability. Unstressed, the same sentence reads as procedural information rather than as taking responsibility.'),
('pron_l5_m3_2', 'itm_l5_m3_pronunciation', 2, 'intonation', 'Acknowledging a hostile point falls and slows', 'That''s a FAIR point // and it''s PARTly TRUE.', 'Slowing down while conceding signals it is genuine. Speeding through a concession is heard, correctly, as getting past it.'),
('pron_l5_m3_3', 'itm_l5_m3_pronunciation', 3, 'rhythm', 'Structure announced in three beats', 'the deCISion first, // then the REAsoning, // then take QUESTions.', 'Announcing the shape of a difficult message before delivering it is a leadership convention, and the three-beat rhythm makes it memorable under stress.');

INSERT INTO quiz_questions (id, learning_item_id, sequence, prompt, choices_json, correct_index, audio_cue_id) VALUES
('qq_l5_m3_ls1', 'itm_l5_m3_listening', 1, 'What decision is announced?', '["A merger","A pay freeze","A restructure of the board","Closing the Bristol office"]', 3, 'cue_l5_m3_2'),
('qq_l5_m3_ls2', 'itm_l5_m3_listening', 2, 'How does the director handle responsibility?', '["Attributes it to the board","States it was their own recommendation","Blames market conditions","Declines to say"]', 1, 'cue_l5_m3_3'),
('qq_l5_m3_ls3', 'itm_l5_m3_listening', 3, 'What does the staff member point out?', '["The low usage followed an earlier cut","The figures are wrong","The timing is bad","Other sites are worse"]', 0, 'cue_l5_m3_5'),
('qq_l5_m3_ls4', 'itm_l5_m3_listening', 4, 'What is offered to staff?', '["Redundancy only","Nothing yet","Relocation or enhanced redundancy","A consultation period"]', 2, 'cue_l5_m3_9');

-- ---------------------------------------------------------------------
-- Module 4: Complex Systems
-- ---------------------------------------------------------------------
INSERT INTO audio_assets (id, kind, title, transcript, variety, speaker_count, target_wpm) VALUES
('aud_l5_m4_listen', 'listening', 'Why the Model Was Wrong', 'The forecast was out by about forty per cent. I want to know whether that''s the model or the inputs. | Both, but not equally. The inputs were roughly right -- within about five per cent. | So the structure is wrong. | The structure assumed demand responds to price with a one-month lag. In practice there''s a feedback loop. | Higher prices reduced demand, which reduced supply, which raised prices again. | Which the model treats as independent. | Exactly. It''s not a calibration problem. You can''t tune your way out of a missing relationship. | How confident are you in that diagnosis? | Fairly. I''d want to test it against the 2019 series before I''d commit to it in writing.', 'BrE', 2, 148),
('aud_l5_m4_pron', 'model_pronunciation', 'Module 4 Pronunciation Model', 'The forecast was out by about forty per cent. | The inputs were within about five per cent. | It''s not a calibration problem. | I''d want to test it before committing in writing.', 'BrE', 1, 133);

INSERT INTO audio_cues (id, audio_asset_id, sequence, speaker, text) VALUES
('cue_l5_m4_1', 'aud_l5_m4_listen', 1, 'Analyst A', 'The forecast was out by about forty per cent. I want to know whether that''s the model or the inputs.'),
('cue_l5_m4_2', 'aud_l5_m4_listen', 2, 'Analyst B', 'Both, but not equally. The inputs were roughly right -- within about five per cent.'),
('cue_l5_m4_3', 'aud_l5_m4_listen', 3, 'Analyst A', 'So the structure is wrong.'),
('cue_l5_m4_4', 'aud_l5_m4_listen', 4, 'Analyst B', 'The structure assumed demand responds to price with a one-month lag. In practice there''s a feedback loop.'),
('cue_l5_m4_5', 'aud_l5_m4_listen', 5, 'Analyst B', 'Higher prices reduced demand, which reduced supply, which raised prices again.'),
('cue_l5_m4_6', 'aud_l5_m4_listen', 6, 'Analyst A', 'Which the model treats as independent.'),
('cue_l5_m4_7', 'aud_l5_m4_listen', 7, 'Analyst B', 'Exactly. It''s not a calibration problem. You can''t tune your way out of a missing relationship.'),
('cue_l5_m4_8', 'aud_l5_m4_listen', 8, 'Analyst A', 'How confident are you in that diagnosis?'),
('cue_l5_m4_9', 'aud_l5_m4_listen', 9, 'Analyst B', 'Fairly. I''d want to test it against the 2019 series before I''d commit to it in writing.');

INSERT INTO learning_items (id, unit_id, sequence, kind, title, body, audio_asset_id) VALUES
('itm_l5_m4_listening', 'unt_l5_m4', 4, 'listening', 'Listening 4 -- Why the Model Was Wrong',
'LISTENING OBJECTIVES: Follow a technical post-mortem; distinguish model error from data error; hear quantified uncertainty.

BEFORE YOU LISTEN: Two analysts review why a forecasting model failed. Read the four questions first. Knowing what you are listening for is itself the skill being taught, and it is the difference between hearing words and understanding a conversation.

LISTEN TWICE: First for the general situation only -- who is speaking, where, and what they want. Do not stop to decode an unknown word; stopping is what makes learners miss the next sentence. Second time, answer the questions.

THEN: Read the synchronised transcript while listening a third time, and mark every place where what you heard and what is written surprised you. That gap is your own pronunciation target, identified by you rather than assigned to you.

SHADOWING: Record yourself speaking the explanation of the feedback loop. Your recordings are kept attempt by attempt, so you can hear your own progress, and your instructor can reply in their own voice.', 'aud_l5_m4_listen'),
('itm_l5_m4_pronunciation', 'unt_l5_m4', 5, 'pronunciation', 'Pronunciation Lab 4 -- Quantified Hedging, Category Diagnosis & Audible Feedback Loops',
'HOW TO USE THIS LAB: For each target -- listen to the model, say it aloud three times, then record yourself and listen back. Listening back is the step learners skip and the step that works: you cannot correct a sound you have not heard yourself produce.

FOCUS THIS MODULE: Quantified hedging -- the difference between roughly, approximately and within a stated range.

Your recordings are kept, so attempt one and attempt ten sit side by side. Your instructor can reply with a spoken model rather than only written notes.', 'aud_l5_m4_pron');

INSERT INTO pronunciation_targets (id, learning_item_id, sequence, focus, target, example, guidance) VALUES
('pron_l5_m4_1', 'itm_l5_m4_pronunciation', 1, 'word_stress', 'Quantified hedges stress the quantity, not the hedge', 'within about FIVE per cent; out by about FORty per cent', 'The hedge is grammatical; the number is the claim. Speakers who stress roughly or about instead sound evasive about figures they have actually measured.'),
('pron_l5_m4_2', 'itm_l5_m4_pronunciation', 2, 'sentence_stress', 'Diagnosis stresses the category, not the symptom', 'It''s NOT a caliBRAtion problem. // You can''t TUNE your way out of a MISSing relationship.', 'The distinction between kinds of error is the whole analysis. Stress marks which category is being excluded.'),
('pron_l5_m4_3', 'itm_l5_m4_pronunciation', 3, 'intonation', 'Chained causation steps down then resets', 'Higher PRICes reduced DEMAND, // which reduced SUPPly, // which RAISED prices aGAIN.', 'Each link drops slightly; the return to the starting term rises. That contour is how a speaker makes a loop audible as a loop.');

INSERT INTO quiz_questions (id, learning_item_id, sequence, prompt, choices_json, correct_index, audio_cue_id) VALUES
('qq_l5_m4_ls1', 'itm_l5_m4_listening', 1, 'By how much was the forecast wrong?', '["About forty per cent","Five per cent","Twenty per cent","Sixty per cent"]', 0, 'cue_l5_m4_1'),
('qq_l5_m4_ls2', 'itm_l5_m4_listening', 2, 'How accurate were the inputs?', '["Completely wrong","Within twenty per cent","Within about five per cent","Not measured"]', 2, 'cue_l5_m4_2'),
('qq_l5_m4_ls3', 'itm_l5_m4_listening', 3, 'What did the model wrongly assume?', '["Prices are fixed","Demand and supply are independent","Demand is constant","There is no lag"]', 1, 'cue_l5_m4_6'),
('qq_l5_m4_ls4', 'itm_l5_m4_listening', 4, 'How confident is Analyst B in the diagnosis?', '["Certain","Not at all","Certain only about the inputs","Fairly, pending a test against 2019 data"]', 3, 'cue_l5_m4_9');

-- ---------------------------------------------------------------------
-- Module 5: Cross-Cultural Communication
-- ---------------------------------------------------------------------
INSERT INTO audio_assets (id, kind, title, transcript, variety, speaker_count, target_wpm) VALUES
('aud_l5_m5_listen', 'listening', 'The Silence in the Meeting', 'I thought that went badly. Nobody on the Tokyo side pushed back at all. | They pushed back three times. You didn''t hear it. | When? | When Watanabe-san said the schedule was ambitious. That was a no. | And when he paused for four seconds before agreeing. That was a stronger no. | I read the pause as thinking. | It was thinking -- about how to disagree without embarrassing you in front of your own team. | So what should I have done? | Asked him privately afterwards. He''d have told you plainly. He was waiting to be asked.', 'BrE', 2, 145),
('aud_l5_m5_pron', 'model_pronunciation', 'Module 5 Pronunciation Model', 'Nobody pushed back at all. | They pushed back three times. | That was a stronger no. | He was waiting to be asked.', 'BrE', 1, 130);

INSERT INTO audio_cues (id, audio_asset_id, sequence, speaker, text) VALUES
('cue_l5_m5_1', 'aud_l5_m5_listen', 1, 'Reid', 'I thought that went badly. Nobody on the Tokyo side pushed back at all.'),
('cue_l5_m5_2', 'aud_l5_m5_listen', 2, 'Sato', 'They pushed back three times. You didn''t hear it.'),
('cue_l5_m5_3', 'aud_l5_m5_listen', 3, 'Reid', 'When?'),
('cue_l5_m5_4', 'aud_l5_m5_listen', 4, 'Sato', 'When Watanabe-san said the schedule was ambitious. That was a no.'),
('cue_l5_m5_5', 'aud_l5_m5_listen', 5, 'Sato', 'And when he paused for four seconds before agreeing. That was a stronger no.'),
('cue_l5_m5_6', 'aud_l5_m5_listen', 6, 'Reid', 'I read the pause as thinking.'),
('cue_l5_m5_7', 'aud_l5_m5_listen', 7, 'Sato', 'It was thinking -- about how to disagree without embarrassing you in front of your own team.'),
('cue_l5_m5_8', 'aud_l5_m5_listen', 8, 'Reid', 'So what should I have done?'),
('cue_l5_m5_9', 'aud_l5_m5_listen', 9, 'Sato', 'Asked him privately afterwards. He''d have told you plainly. He was waiting to be asked.');

INSERT INTO learning_items (id, unit_id, sequence, kind, title, body, audio_asset_id) VALUES
('itm_l5_m5_listening', 'unt_l5_m5', 4, 'listening', 'Listening 5 -- The Silence in the Meeting',
'LISTENING OBJECTIVES: Interpret conversational silence across cultures; distinguish disagreement from deference; hear a repair of a cultural misreading.

BEFORE YOU LISTEN: Two managers debrief after a meeting that went differently than one expected. Read the four questions first. Knowing what you are listening for is itself the skill being taught, and it is the difference between hearing words and understanding a conversation.

LISTEN TWICE: First for the general situation only -- who is speaking, where, and what they want. Do not stop to decode an unknown word; stopping is what makes learners miss the next sentence. Second time, answer the questions.

THEN: Read the synchronised transcript while listening a third time, and mark every place where what you heard and what is written surprised you. That gap is your own pronunciation target, identified by you rather than assigned to you.

SHADOWING: Record yourself speaking the reinterpretation of the silence. Your recordings are kept attempt by attempt, so you can hear your own progress, and your instructor can reply in their own voice.', 'aud_l5_m5_listen'),
('itm_l5_m5_pronunciation', 'unt_l5_m5', 5, 'pronunciation', 'Pronunciation Lab 5 -- Pause as Meaning, Falling Evaluations & Non-Contradictory Correction',
'HOW TO USE THIS LAB: For each target -- listen to the model, say it aloud three times, then record yourself and listen back. Listening back is the step learners skip and the step that works: you cannot correct a sound you have not heard yourself produce.

FOCUS THIS MODULE: Pause length as meaning, and how English speakers misread pauses calibrated to other norms.

Your recordings are kept, so attempt one and attempt ten sit side by side. Your instructor can reply with a spoken model rather than only written notes.', 'aud_l5_m5_pron');

INSERT INTO pronunciation_targets (id, learning_item_id, sequence, focus, target, example, guidance) VALUES
('pron_l5_m5_1', 'itm_l5_m5_pronunciation', 1, 'rhythm', 'Pause length is meaning, not hesitation', '...the schedule was ambitious. [4 second pause] ...Yes, we can try.', 'In several conversational cultures a long pause before agreement IS the disagreement. English speakers typically fill pauses at around one second and so hear silence as absence rather than as content.'),
('pron_l5_m5_2', 'itm_l5_m5_pronunciation', 2, 'intonation', 'Ambitious said with a slight fall is a refusal', 'The schedule is amBITious. (falling, unhurried)', 'A positive-sounding evaluation with a falling, flat contour functions as an objection. This is the same mechanism as Module 1''s thorough hearing, in a different cultural register.'),
('pron_l5_m5_3', 'itm_l5_m5_pronunciation', 3, 'sentence_stress', 'Reinterpretation stresses the corrected reading', 'I read the pause as THINKing. -- It WAS thinking. About how to disaGREE.', 'Repeating the other speaker''s word with stress, then extending it, is how English performs a correction that does not contradict.');

INSERT INTO quiz_questions (id, learning_item_id, sequence, prompt, choices_json, correct_index, audio_cue_id) VALUES
('qq_l5_m5_ls1', 'itm_l5_m5_listening', 1, 'What did Reid believe about the meeting?', '["It went well","Nobody pushed back","Too many objections were raised","The schedule was agreed"]', 1, 'cue_l5_m5_1'),
('qq_l5_m5_ls2', 'itm_l5_m5_listening', 2, 'How many times does Sato say the Tokyo side pushed back?', '["Once","Twice","Not at all","Three times"]', 3, 'cue_l5_m5_2'),
('qq_l5_m5_ls3', 'itm_l5_m5_listening', 3, 'What did the four-second pause signal?', '["Confusion","Agreement","A stronger disagreement","Boredom"]', 2, 'cue_l5_m5_5'),
('qq_l5_m5_ls4', 'itm_l5_m5_listening', 4, 'What does Sato say Reid should have done?', '["Asked privately afterwards","Pressed harder in the meeting","Sent an email","Changed the schedule"]', 0, 'cue_l5_m5_9');

-- ---------------------------------------------------------------------
-- Module 6: Advanced Media & Discourse Analysis
-- ---------------------------------------------------------------------
INSERT INTO audio_assets (id, kind, title, transcript, variety, speaker_count, target_wpm) VALUES
('aud_l5_m6_listen', 'listening', 'Unpacking the Interview', 'Listen to three moves in ninety seconds. First, the reframe. | Will you resign if the report criticises you? | What matters to the public is that the report is published in full, and it will be. | The question was about resignation. The answer is about publication. That''s a reframe, not a lie. | Second, the premise correction. | You were warned two years ago. | I was warned eleven months ago. The date matters, and I''ll come to why. | That''s legitimate. A false premise should be corrected before it''s answered. | Third, the non-answer dressed as candour: I''ve been completely open about this throughout. | That sounds like an answer. Notice it contains no information at all.', 'BrE', 3, 148),
('aud_l5_m6_pron', 'model_pronunciation', 'Module 6 Pronunciation Model', 'Will you resign if the report criticises you? | What matters to the public is that it''s published. | I was warned eleven months ago. | Notice it contains no information at all.', 'BrE', 1, 133);

INSERT INTO audio_cues (id, audio_asset_id, sequence, speaker, text) VALUES
('cue_l5_m6_1', 'aud_l5_m6_listen', 1, 'Analyst', 'Listen to three moves in ninety seconds. First, the reframe.'),
('cue_l5_m6_2', 'aud_l5_m6_listen', 2, 'Interviewer', 'Will you resign if the report criticises you?'),
('cue_l5_m6_3', 'aud_l5_m6_listen', 3, 'Minister', 'What matters to the public is that the report is published in full, and it will be.'),
('cue_l5_m6_4', 'aud_l5_m6_listen', 4, 'Analyst', 'The question was about resignation. The answer is about publication. That''s a reframe, not a lie.'),
('cue_l5_m6_5', 'aud_l5_m6_listen', 5, 'Analyst', 'Second, the premise correction.'),
('cue_l5_m6_6', 'aud_l5_m6_listen', 6, 'Interviewer', 'You were warned two years ago.'),
('cue_l5_m6_7', 'aud_l5_m6_listen', 7, 'Minister', 'I was warned eleven months ago. The date matters, and I''ll come to why.'),
('cue_l5_m6_8', 'aud_l5_m6_listen', 8, 'Analyst', 'That''s legitimate. A false premise should be corrected before it''s answered.'),
('cue_l5_m6_9', 'aud_l5_m6_listen', 9, 'Analyst', 'Third, the non-answer dressed as candour: I''ve been completely open about this throughout.'),
('cue_l5_m6_10', 'aud_l5_m6_listen', 10, 'Analyst', 'That sounds like an answer. Notice it contains no information at all.');

INSERT INTO learning_items (id, unit_id, sequence, kind, title, body, audio_asset_id) VALUES
('itm_l5_m6_listening', 'unt_l5_m6', 4, 'listening', 'Listening 6 -- Unpacking the Interview',
'LISTENING OBJECTIVES: Analyse a political interview in real time; identify evasion, premise correction and non-answers; hear a question being reframed.

BEFORE YOU LISTEN: A media analyst breaks down a short interview extract for students. Read the four questions first. Knowing what you are listening for is itself the skill being taught, and it is the difference between hearing words and understanding a conversation.

LISTEN TWICE: First for the general situation only -- who is speaking, where, and what they want. Do not stop to decode an unknown word; stopping is what makes learners miss the next sentence. Second time, answer the questions.

THEN: Read the synchronised transcript while listening a third time, and mark every place where what you heard and what is written surprised you. That gap is your own pronunciation target, identified by you rather than assigned to you.

SHADOWING: Record yourself speaking the analyst''s identification of the three moves. Your recordings are kept attempt by attempt, so you can hear your own progress, and your instructor can reply in their own voice.', 'aud_l5_m6_listen'),
('itm_l5_m6_pronunciation', 'unt_l5_m6', 5, 'pronunciation', 'Pronunciation Lab 6 -- Reframe Detection, Correction Rhythm & Over-Stressed Emptiness',
'HOW TO USE THIS LAB: For each target -- listen to the model, say it aloud three times, then record yourself and listen back. Listening back is the step learners skip and the step that works: you cannot correct a sound you have not heard yourself produce.

FOCUS THIS MODULE: The audible difference between answering, reframing and evading.

Your recordings are kept, so attempt one and attempt ten sit side by side. Your instructor can reply with a spoken model rather than only written notes.', 'aud_l5_m6_pron');

INSERT INTO pronunciation_targets (id, learning_item_id, sequence, focus, target, example, guidance) VALUES
('pron_l5_m6_1', 'itm_l5_m6_pronunciation', 1, 'sentence_stress', 'A reframe stresses a different noun from the question', 'Will you reSIGN? -- What matters is that the report is PUBlished.', 'The substituted noun carries the stress. Hearing which noun was swapped is the fastest way to detect a reframe in real time.'),
('pron_l5_m6_2', 'itm_l5_m6_pronunciation', 2, 'intonation', 'Premise correction is delivered flat and fast, then slows', 'I was warned ELEVen months ago. // The DATE matters, and I''ll come to WHY.', 'The correction itself is quick and unemphatic; the significance is delivered slowly. That two-part rhythm is what makes a correction sound like precision rather than defensiveness.'),
('pron_l5_m6_3', 'itm_l5_m6_pronunciation', 3, 'word_stress', 'Empty candour phrases are over-stressed', 'I''ve been COMPLETEly OPEN about this THROUGHout.', 'Heavy stress on every content word with no specific information is a reliable marker of a non-answer. Real answers distribute stress unevenly.');

INSERT INTO quiz_questions (id, learning_item_id, sequence, prompt, choices_json, correct_index, audio_cue_id) VALUES
('qq_l5_m6_ls1', 'itm_l5_m6_listening', 1, 'What is the first move the analyst identifies?', '["A reframe","Evasion","A premise correction","A denial"]', 0, 'cue_l5_m6_4'),
('qq_l5_m6_ls2', 'itm_l5_m6_listening', 2, 'What did the minister correct about the warning?', '["Who gave it","Its content","The timing -- eleven months, not two years","Whether it existed"]', 2, 'cue_l5_m6_7'),
('qq_l5_m6_ls3', 'itm_l5_m6_listening', 3, 'How does the analyst characterise premise correction?', '["Evasion","Legitimate","Dishonest","Irrelevant"]', 1, 'cue_l5_m6_8'),
('qq_l5_m6_ls4', 'itm_l5_m6_listening', 4, 'What is wrong with ''I''ve been completely open throughout''?', '["It is untrue","It is off topic","It is too long","It contains no information"]', 3, 'cue_l5_m6_10');

-- ---------------------------------------------------------------------
-- Module 7: Research & Presentation
-- ---------------------------------------------------------------------
INSERT INTO audio_assets (id, kind, title, transcript, variety, speaker_count, target_wpm) VALUES
('aud_l5_m7_listen', 'listening', 'Twelve Minutes, Then Questions', 'One argument today, in three steps: the effect is real, it''s smaller than reported, and it''s conditional. | That''s the whole talk. The limitation, before anyone asks, is that my sample is urban only. | Could you clarify what you mean by conditional? | Conditional on prior exposure. Without it, we see nothing. Next question. | Have you read Ekstrom''s 2024 paper? | I haven''t. I''ll read it this week and I''ll write to you if it changes anything. | Would your finding hold in rural populations? | That''s outside what my data can support. I''d want to test it before answering. | We''ll leave it there. Thank you.', 'BrE', 5, 148),
('aud_l5_m7_pron', 'model_pronunciation', 'Module 7 Pronunciation Model', 'One argument today, in three steps. | The limitation, before anyone asks, is... | I haven''t. I''ll read it this week. | That''s outside what my data can support.', 'BrE', 1, 133);

INSERT INTO audio_cues (id, audio_asset_id, sequence, speaker, text) VALUES
('cue_l5_m7_1', 'aud_l5_m7_listen', 1, 'Speaker', 'One argument today, in three steps: the effect is real, it''s smaller than reported, and it''s conditional.'),
('cue_l5_m7_2', 'aud_l5_m7_listen', 2, 'Speaker', 'That''s the whole talk. The limitation, before anyone asks, is that my sample is urban only.'),
('cue_l5_m7_3', 'aud_l5_m7_listen', 3, 'Q1', 'Could you clarify what you mean by conditional?'),
('cue_l5_m7_4', 'aud_l5_m7_listen', 4, 'Speaker', 'Conditional on prior exposure. Without it, we see nothing. Next question.'),
('cue_l5_m7_5', 'aud_l5_m7_listen', 5, 'Q2', 'Have you read Ekstrom''s 2024 paper?'),
('cue_l5_m7_6', 'aud_l5_m7_listen', 6, 'Speaker', 'I haven''t. I''ll read it this week and I''ll write to you if it changes anything.'),
('cue_l5_m7_7', 'aud_l5_m7_listen', 7, 'Q3', 'Would your finding hold in rural populations?'),
('cue_l5_m7_8', 'aud_l5_m7_listen', 8, 'Speaker', 'That''s outside what my data can support. I''d want to test it before answering.'),
('cue_l5_m7_9', 'aud_l5_m7_listen', 9, 'Chair', 'We''ll leave it there. Thank you.');

INSERT INTO learning_items (id, unit_id, sequence, kind, title, body, audio_asset_id) VALUES
('itm_l5_m7_listening', 'unt_l5_m7', 4, 'listening', 'Listening 7 -- Twelve Minutes, Then Questions',
'LISTENING OBJECTIVES: Follow a conference-style presentation and its Q&A; distinguish the four question types; hear a speaker stop cleanly.

BEFORE YOU LISTEN: A researcher presents briefly and takes three questions of different kinds. Read the four questions first. Knowing what you are listening for is itself the skill being taught, and it is the difference between hearing words and understanding a conversation.

LISTEN TWICE: First for the general situation only -- who is speaking, where, and what they want. Do not stop to decode an unknown word; stopping is what makes learners miss the next sentence. Second time, answer the questions.

THEN: Read the synchronised transcript while listening a third time, and mark every place where what you heard and what is written surprised you. That gap is your own pronunciation target, identified by you rather than assigned to you.

SHADOWING: Record yourself speaking the answer that declines to speculate. Your recordings are kept attempt by attempt, so you can hear your own progress, and your instructor can reply in their own voice.', 'aud_l5_m7_listen'),
('itm_l5_m7_pronunciation', 'unt_l5_m7', 5, 'pronunciation', 'Pronunciation Lab 7 -- Three-Beat Structure, The Clean Stop & Principled Limits',
'HOW TO USE THIS LAB: For each target -- listen to the model, say it aloud three times, then record yourself and listen back. Listening back is the step learners skip and the step that works: you cannot correct a sound you have not heard yourself produce.

FOCUS THIS MODULE: Presentation pacing and the clean stop -- the hardest thing to do after answering.

Your recordings are kept, so attempt one and attempt ten sit side by side. Your instructor can reply with a spoken model rather than only written notes.', 'aud_l5_m7_pron');

INSERT INTO pronunciation_targets (id, learning_item_id, sequence, focus, target, example, guidance) VALUES
('pron_l5_m7_1', 'itm_l5_m7_pronunciation', 1, 'rhythm', 'Three announced steps take three equal beats', 'the effect is REAL, // it''s SMALLer than reported, // and it''s condITional.', 'Equal rhythmic weight on each step makes a three-part structure memorable to an audience without slides. Uneven delivery loses the third item.'),
('pron_l5_m7_2', 'itm_l5_m7_pronunciation', 2, 'intonation', 'The clean stop falls and does not trail', 'Without it, we see NOTHing. // Next QUESTion.', 'Nervous speakers let their pitch trail upward and keep talking. The decisive fall followed by silence is what makes an answer sound complete.'),
('pron_l5_m7_3', 'itm_l5_m7_pronunciation', 3, 'sentence_stress', 'Declining to speculate stresses the boundary', 'That''s OUTSIDE what my DATA can supPORT.', 'Stressing outside and data marks this as a principled limit rather than an evasion. Said flatly, the same words sound like avoidance.');

INSERT INTO quiz_questions (id, learning_item_id, sequence, prompt, choices_json, correct_index, audio_cue_id) VALUES
('qq_l5_m7_ls1', 'itm_l5_m7_listening', 1, 'How many steps does the speaker announce?', '["Two","Four","Five","Three"]', 3, 'cue_l5_m7_1'),
('qq_l5_m7_ls2', 'itm_l5_m7_listening', 2, 'What limitation does the speaker state unprompted?', '["Small sample","The sample is urban only","Short time frame","Self-reported data"]', 1, 'cue_l5_m7_2'),
('qq_l5_m7_ls3', 'itm_l5_m7_listening', 3, 'How does the speaker handle the question about Ekstrom''s paper?', '["Admits not having read it and commits to follow up","Claims to have read it","Dismisses it","Asks the chair to move on"]', 0, 'cue_l5_m7_6'),
('qq_l5_m7_ls4', 'itm_l5_m7_listening', 4, 'How does the speaker answer the rural question?', '["Speculates confidently","Refuses to answer","States it is outside what the data supports","Says it would definitely hold"]', 2, 'cue_l5_m7_8');

-- ---------------------------------------------------------------------
-- Module 8: Professional Advocacy
-- ---------------------------------------------------------------------
INSERT INTO audio_assets (id, kind, title, transcript, variety, speaker_count, target_wpm) VALUES
('aud_l5_m8_listen', 'listening', 'The Crisis Line', 'Here is what we know. At around six this morning a fault affected our payment system. | Here is what we do not yet know: how many customers were affected, and whether any data was exposed. | Here is what we are doing. The system is offline, an external firm is auditing it, and we have informed the regulator. | You will hear from us again at four o''clock this afternoon, whether or not we have more to say. | Isn''t it true you were warned about this last year? | I don''t know whether that''s true. If it is, it will be in the audit, and we''ll publish the audit. | So you might have ignored a warning. | I''m not going to speculate about a document I haven''t seen. I''ve told you what I''ll do about it.', 'BrE', 2, 148),
('aud_l5_m8_pron', 'model_pronunciation', 'Module 8 Pronunciation Model', 'Here is what we know. | Here is what we do not yet know. | You will hear from us at four o''clock. | I''m not going to speculate about a document I haven''t seen.', 'BrE', 1, 133);

INSERT INTO audio_cues (id, audio_asset_id, sequence, speaker, text) VALUES
('cue_l5_m8_1', 'aud_l5_m8_listen', 1, 'Spokesperson', 'Here is what we know. At around six this morning a fault affected our payment system.'),
('cue_l5_m8_2', 'aud_l5_m8_listen', 2, 'Spokesperson', 'Here is what we do not yet know: how many customers were affected, and whether any data was exposed.'),
('cue_l5_m8_3', 'aud_l5_m8_listen', 3, 'Spokesperson', 'Here is what we are doing. The system is offline, an external firm is auditing it, and we have informed the regulator.'),
('cue_l5_m8_4', 'aud_l5_m8_listen', 4, 'Spokesperson', 'You will hear from us again at four o''clock this afternoon, whether or not we have more to say.'),
('cue_l5_m8_5', 'aud_l5_m8_listen', 5, 'Reporter', 'Isn''t it true you were warned about this last year?'),
('cue_l5_m8_6', 'aud_l5_m8_listen', 6, 'Spokesperson', 'I don''t know whether that''s true. If it is, it will be in the audit, and we''ll publish the audit.'),
('cue_l5_m8_7', 'aud_l5_m8_listen', 7, 'Reporter', 'So you might have ignored a warning.'),
('cue_l5_m8_8', 'aud_l5_m8_listen', 8, 'Spokesperson', 'I''m not going to speculate about a document I haven''t seen. I''ve told you what I''ll do about it.');

INSERT INTO learning_items (id, unit_id, sequence, kind, title, body, audio_asset_id) VALUES
('itm_l5_m8_listening', 'unt_l5_m8', 4, 'listening', 'Listening 8 -- The Crisis Line',
'LISTENING OBJECTIVES: Follow crisis communication under hostile questioning; identify the four-part holding statement; hear a refusal to speculate.

BEFORE YOU LISTEN: A spokesperson gives a holding statement and takes a hostile question. Read the four questions first. Knowing what you are listening for is itself the skill being taught, and it is the difference between hearing words and understanding a conversation.

LISTEN TWICE: First for the general situation only -- who is speaking, where, and what they want. Do not stop to decode an unknown word; stopping is what makes learners miss the next sentence. Second time, answer the questions.

THEN: Read the synchronised transcript while listening a third time, and mark every place where what you heard and what is written surprised you. That gap is your own pronunciation target, identified by you rather than assigned to you.

SHADOWING: Record yourself speaking the four-part holding statement. Your recordings are kept attempt by attempt, so you can hear your own progress, and your instructor can reply in their own voice.', 'aud_l5_m8_listen'),
('itm_l5_m8_pronunciation', 'unt_l5_m8', 5, 'pronunciation', 'Pronunciation Lab 8 -- Four-Part Crisis Rhythm, Tempo Under Interruption & Ending on Action',
'HOW TO USE THIS LAB: For each target -- listen to the model, say it aloud three times, then record yourself and listen back. Listening back is the step learners skip and the step that works: you cannot correct a sound you have not heard yourself produce.

FOCUS THIS MODULE: Crisis register -- steady pace under interruption, and the sound of not knowing.

Your recordings are kept, so attempt one and attempt ten sit side by side. Your instructor can reply with a spoken model rather than only written notes.', 'aud_l5_m8_pron');

INSERT INTO pronunciation_targets (id, learning_item_id, sequence, focus, target, example, guidance) VALUES
('pron_l5_m8_1', 'itm_l5_m8_pronunciation', 1, 'rhythm', 'The four-part statement takes four equal blocks', 'what we KNOW // what we do NOT yet know // what we are DOing // when you''ll HEAR from us', 'Equal rhythmic weight signals a structure the audience can hold. The second block is the one organisations omit, and delivering it at full weight is what builds credibility.'),
('pron_l5_m8_2', 'itm_l5_m8_pronunciation', 2, 'intonation', 'Steady pace under interruption', 'Maintain unchanged tempo when cut across; do not accelerate.', 'Accelerating signals panic; stopping concedes the floor. Holding tempo is a trained physical skill and is the core of this module''s pronunciation work.'),
('pron_l5_m8_3', 'itm_l5_m8_pronunciation', 3, 'sentence_stress', 'Refusal to speculate stresses the action, not the denial', 'I''m not going to SPECulate about a document I HAVEN''T SEEN. // I''ve told you what I''ll DO about it.', 'Ending on the commitment rather than the refusal is what stops a non-answer sounding evasive.');

INSERT INTO quiz_questions (id, learning_item_id, sequence, prompt, choices_json, correct_index, audio_cue_id) VALUES
('qq_l5_m8_ls1', 'itm_l5_m8_listening', 1, 'What are the two things the spokesperson says are NOT yet known?', '["How many customers were affected and whether data was exposed","The cause and the cost","The time and the regulator''s view","Nothing is unknown"]', 0, 'cue_l5_m8_2'),
('qq_l5_m8_ls2', 'itm_l5_m8_listening', 2, 'What three actions are described?', '["Refund, apology, review","Investigation, dismissal, report","Offline, external audit, regulator informed","Nothing yet"]', 2, 'cue_l5_m8_3'),
('qq_l5_m8_ls3', 'itm_l5_m8_listening', 3, 'When will the next update come?', '["Tomorrow","At four o''clock this afternoon","When the audit finishes","No date given"]', 1, 'cue_l5_m8_4'),
('qq_l5_m8_ls4', 'itm_l5_m8_listening', 4, 'How does the spokesperson respond to the warning allegation?', '["Denies it","Confirms it","Refuses to comment at all","Says they do not know and will publish the audit"]', 3, 'cue_l5_m8_6');

-- ---------------------------------------------------------------------
-- Module 9: Style & Voice
-- ---------------------------------------------------------------------
INSERT INTO audio_assets (id, kind, title, transcript, variety, speaker_count, target_wpm) VALUES
('aud_l5_m9_listen', 'listening', 'Two Drafts, One Argument', 'Same argument, two drafts. Draft one. | The implementation of the policy resulted in a reduction in participation among younger applicants. | Draft two. | When we introduced the policy, fewer young people applied. | Identical claim. The first has twelve syllables of abstraction before it says anything. | Notice also that draft one has no people in it. Implementation did it; participation happened. | Draft two has us and them, and it takes responsibility by naming who acted. | Nominalisation isn''t a sin. But it hides agents, and hiding agents is sometimes the point. | Ask of any sentence: who did what to whom? If you can''t tell, decide whether that''s deliberate.', 'BrE', 2, 148),
('aud_l5_m9_pron', 'model_pronunciation', 'Module 9 Pronunciation Model', 'The implementation resulted in a reduction in participation. | When we introduced the policy, fewer young people applied. | Nominalisation hides agents. | Who did what to whom?', 'BrE', 1, 133);

INSERT INTO audio_cues (id, audio_asset_id, sequence, speaker, text) VALUES
('cue_l5_m9_1', 'aud_l5_m9_listen', 1, 'Editor', 'Same argument, two drafts. Draft one.'),
('cue_l5_m9_2', 'aud_l5_m9_listen', 2, 'Reader', 'The implementation of the policy resulted in a reduction in participation among younger applicants.'),
('cue_l5_m9_3', 'aud_l5_m9_listen', 3, 'Editor', 'Draft two.'),
('cue_l5_m9_4', 'aud_l5_m9_listen', 4, 'Reader', 'When we introduced the policy, fewer young people applied.'),
('cue_l5_m9_5', 'aud_l5_m9_listen', 5, 'Editor', 'Identical claim. The first has twelve syllables of abstraction before it says anything.'),
('cue_l5_m9_6', 'aud_l5_m9_listen', 6, 'Editor', 'Notice also that draft one has no people in it. Implementation did it; participation happened.'),
('cue_l5_m9_7', 'aud_l5_m9_listen', 7, 'Editor', 'Draft two has us and them, and it takes responsibility by naming who acted.'),
('cue_l5_m9_8', 'aud_l5_m9_listen', 8, 'Editor', 'Nominalisation isn''t a sin. But it hides agents, and hiding agents is sometimes the point.'),
('cue_l5_m9_9', 'aud_l5_m9_listen', 9, 'Editor', 'Ask of any sentence: who did what to whom? If you can''t tell, decide whether that''s deliberate.');

INSERT INTO learning_items (id, unit_id, sequence, kind, title, body, audio_asset_id) VALUES
('itm_l5_m9_listening', 'unt_l5_m9', 4, 'listening', 'Listening 9 -- Two Drafts, One Argument',
'LISTENING OBJECTIVES: Hear the difference style makes to identical content; distinguish nominalised from verbal style; recognise voice.

BEFORE YOU LISTEN: An editor reads the same paragraph in two styles and comments. Read the four questions first. Knowing what you are listening for is itself the skill being taught, and it is the difference between hearing words and understanding a conversation.

LISTEN TWICE: First for the general situation only -- who is speaking, where, and what they want. Do not stop to decode an unknown word; stopping is what makes learners miss the next sentence. Second time, answer the questions.

THEN: Read the synchronised transcript while listening a third time, and mark every place where what you heard and what is written surprised you. That gap is your own pronunciation target, identified by you rather than assigned to you.

SHADOWING: Record yourself speaking both drafts, feeling the rhythmic difference. Your recordings are kept attempt by attempt, so you can hear your own progress, and your instructor can reply in their own voice.', 'aud_l5_m9_listen'),
('itm_l5_m9_pronunciation', 'unt_l5_m9', 5, 'pronunciation', 'Pronunciation Lab 9 -- The Rhythm of Nominalisation, Verbal Beat & The Diagnostic Question',
'HOW TO USE THIS LAB: For each target -- listen to the model, say it aloud three times, then record yourself and listen back. Listening back is the step learners skip and the step that works: you cannot correct a sound you have not heard yourself produce.

FOCUS THIS MODULE: The rhythmic cost of nominalisation, heard rather than explained.

Your recordings are kept, so attempt one and attempt ten sit side by side. Your instructor can reply with a spoken model rather than only written notes.', 'aud_l5_m9_pron');

INSERT INTO pronunciation_targets (id, learning_item_id, sequence, focus, target, example, guidance) VALUES
('pron_l5_m9_1', 'itm_l5_m9_pronunciation', 1, 'rhythm', 'Nominalised prose has fewer stresses per second', 'the imPLEMENTation of the POLicy resulted in a reDUCtion...', 'Abstract nouns bury stress in long unstressed runs. The flatness is why nominalised prose is tiring to hear, and hearing that flatness is how a writer learns to detect it in their own drafts.'),
('pron_l5_m9_2', 'itm_l5_m9_pronunciation', 2, 'sentence_stress', 'Verbal style restores a regular beat', 'When we introDUCED the POLicy, FEWer YOUNG people apPLIED.', 'Verbs and concrete nouns produce evenly spaced stresses. This is what readers experience as clarity.'),
('pron_l5_m9_3', 'itm_l5_m9_pronunciation', 3, 'intonation', 'The diagnostic question is delivered slowly and falls', 'WHO did WHAT to WHOM?', 'Three stresses, evenly weighted, ending on a fall. Delivered as a real question rather than a rhetorical one, it is the module''s whole method in four words.');

INSERT INTO quiz_questions (id, learning_item_id, sequence, prompt, choices_json, correct_index, audio_cue_id) VALUES
('qq_l5_m9_ls1', 'itm_l5_m9_listening', 1, 'What is the relationship between the two drafts?', '["Different claims","One is a summary","One is a translation","The same claim in different styles"]', 3, 'cue_l5_m9_5'),
('qq_l5_m9_ls2', 'itm_l5_m9_listening', 2, 'What does the editor say draft one lacks?', '["Evidence","People, or agents","Length","A conclusion"]', 1, 'cue_l5_m9_6'),
('qq_l5_m9_ls3', 'itm_l5_m9_listening', 3, 'Is nominalisation condemned outright?', '["No -- but it hides agents","Yes","Only in academic writing","Only in speech"]', 0, 'cue_l5_m9_8'),
('qq_l5_m9_ls4', 'itm_l5_m9_listening', 4, 'What test does the editor recommend?', '["Count the syllables","Read it aloud","Ask who did what to whom","Check the passive voice"]', 2, 'cue_l5_m9_9');

-- ---------------------------------------------------------------------
-- Module 10: Review & Consolidation
-- ---------------------------------------------------------------------
INSERT INTO audio_assets (id, kind, title, transcript, variety, speaker_count, target_wpm) VALUES
('aud_l5_m10_listen', 'listening', 'The Advisory Board', 'We have a recommendation to expand into two new markets. Views? | The analysis is thorough. I''d want to understand the assumption about regulatory timelines. | Which is that approval takes nine months. | In one of the two markets, that would be unusually fast. | I''d put it more strongly. I''ve not seen it done under eighteen. | So the model is out by roughly a year in one market. | Which changes the payback period from three years to something closer to five. | I''m not opposed. I''m opposed to approving it on this arithmetic. | Then we approve market one, defer market two pending regulatory advice, and revisit in the autumn. | That I can support.', 'BrE', 3, 150),
('aud_l5_m10_pron', 'model_pronunciation', 'Module 10 Pronunciation Model', 'I''d want to understand the assumption. | That would be unusually fast. | I''m opposed to approving it on this arithmetic. | Approve market one, defer market two.', 'BrE', 1, 135);

INSERT INTO audio_cues (id, audio_asset_id, sequence, speaker, text) VALUES
('cue_l5_m10_1', 'aud_l5_m10_listen', 1, 'Chair', 'We have a recommendation to expand into two new markets. Views?'),
('cue_l5_m10_2', 'aud_l5_m10_listen', 2, 'Nakamura', 'The analysis is thorough. I''d want to understand the assumption about regulatory timelines.'),
('cue_l5_m10_3', 'aud_l5_m10_listen', 3, 'Chair', 'Which is that approval takes nine months.'),
('cue_l5_m10_4', 'aud_l5_m10_listen', 4, 'Nakamura', 'In one of the two markets, that would be unusually fast.'),
('cue_l5_m10_5', 'aud_l5_m10_listen', 5, 'Okoro', 'I''d put it more strongly. I''ve not seen it done under eighteen.'),
('cue_l5_m10_6', 'aud_l5_m10_listen', 6, 'Chair', 'So the model is out by roughly a year in one market.'),
('cue_l5_m10_7', 'aud_l5_m10_listen', 7, 'Okoro', 'Which changes the payback period from three years to something closer to five.'),
('cue_l5_m10_8', 'aud_l5_m10_listen', 8, 'Nakamura', 'I''m not opposed. I''m opposed to approving it on this arithmetic.'),
('cue_l5_m10_9', 'aud_l5_m10_listen', 9, 'Chair', 'Then we approve market one, defer market two pending regulatory advice, and revisit in the autumn.'),
('cue_l5_m10_10', 'aud_l5_m10_listen', 10, 'Okoro', 'That I can support.');

INSERT INTO learning_items (id, unit_id, sequence, kind, title, body, audio_asset_id) VALUES
('itm_l5_m10_listening', 'unt_l5_m10', 4, 'listening', 'Listening 10 -- The Advisory Board',
'LISTENING OBJECTIVES: Integrate every Level V listening skill; follow a senior advisory discussion with implicature, quantified hedging, concession and decision.

BEFORE YOU LISTEN: This is the Level V cumulative listening: an advisory board discusses a difficult recommendation, drawing on all nine modules. Read the four questions first. Knowing what you are listening for is itself the skill being taught, and it is the difference between hearing words and understanding a conversation.

LISTEN TWICE: First for the general situation only -- who is speaking, where, and what they want. Do not stop to decode an unknown word; stopping is what makes learners miss the next sentence. Second time, answer the questions.

THEN: Read the synchronised transcript while listening a third time, and mark every place where what you heard and what is written surprised you. That gap is your own pronunciation target, identified by you rather than assigned to you.

SHADOWING: Record yourself speaking the chair''s summary and the dissent. Your recordings are kept attempt by attempt, so you can hear your own progress, and your instructor can reply in their own voice.', 'aud_l5_m10_listen'),
('itm_l5_m10_pronunciation', 'unt_l5_m10', 5, 'pronunciation', 'Pronunciation Lab 10 -- Level V Consolidation -- Understatement, Narrowing Stress & Board Closure',
'HOW TO USE THIS LAB: For each target -- listen to the model, say it aloud three times, then record yourself and listen back. Listening back is the step learners skip and the step that works: you cannot correct a sound you have not heard yourself produce.

FOCUS THIS MODULE: Everything from the level, at senior professional speed, including what is meant but not said.

Your recordings are kept, so attempt one and attempt ten sit side by side. Your instructor can reply with a spoken model rather than only written notes.', 'aud_l5_m10_pron');

INSERT INTO pronunciation_targets (id, learning_item_id, sequence, focus, target, example, guidance) VALUES
('pron_l5_m10_1', 'itm_l5_m10_pronunciation', 1, 'intonation', 'Understatement as objection, at senior register', 'That would be unusually FAST. (level, unhurried)', 'Level V closes where it opened: a positive-sounding evaluation delivered level is a refusal. At board level almost all disagreement arrives this way.'),
('pron_l5_m10_2', 'itm_l5_m10_pronunciation', 2, 'sentence_stress', 'The distinction that resolves the meeting', 'I''m not opPOSED. I''m opposed to approving it on THIS arithmetic.', 'Stress on this narrows the objection from the proposal to its basis, which is what makes a compromise possible. One stressed word changes the outcome of the meeting.'),
('pron_l5_m10_3', 'itm_l5_m10_pronunciation', 3, 'rhythm', 'The chair''s resolution takes three beats', 'approve MARKet one, // deFER market two, // reVISit in the AUtumn.', 'The same three-beat closure heard at Levels III and IV, now carrying a compromise rather than a decision. It is the standard shape of senior resolution in English.');

INSERT INTO quiz_questions (id, learning_item_id, sequence, prompt, choices_json, correct_index, audio_cue_id) VALUES
('qq_l5_m10_ls1', 'itm_l5_m10_listening', 1, 'What assumption does Nakamura question?', '["The nine-month regulatory timeline","The cost estimates","The market size","The staffing plan"]', 0, 'cue_l5_m10_2'),
('qq_l5_m10_ls2', 'itm_l5_m10_listening', 2, 'What does Okoro say about that timeline?', '["It is generous","It is accurate","They have not seen it done under eighteen months","It is irrelevant"]', 2, 'cue_l5_m10_5'),
('qq_l5_m10_ls3', 'itm_l5_m10_listening', 3, 'How does the payback period change?', '["From five to three years","From three to five years","It is unchanged","It cannot be calculated"]', 1, 'cue_l5_m10_7'),
('qq_l5_m10_ls4', 'itm_l5_m10_listening', 4, 'What is the final decision?', '["Approve both markets","Reject both","Postpone everything","Approve market one, defer market two"]', 3, 'cue_l5_m10_9');

