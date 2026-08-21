-- WEC-LC — Audio curriculum seed: Level IV (Upper Intermediate, B2).
--
-- See sql/seed-audio-level-1.sql and docs/lms-architecture.md
-- § The audio layer. Scripts, cues, questions and targets are complete
-- authored curriculum; recordings are not — every media_url and cue
-- timing is NULL. Adding narration later is an UPDATE.
--
-- B2 delivery is 135-142 wpm — effectively natural professional pace,
-- with unhedged registers, layered time reference and multi-party
-- disagreement.

-- Re-sequence so the audio strand sits where the lessons assume it:
-- present -> practise -> listen -> pronounce -> test.
UPDATE learning_items SET sequence = 6 WHERE id LIKE 'itm_l4_m%_quiz';
UPDATE learning_items SET sequence = 7 WHERE id LIKE 'itm_l4_m%_assignment';
UPDATE learning_items SET sequence = 5 WHERE id = 'itm_l4_m10_examquiz';
UPDATE learning_items SET sequence = 6 WHERE id = 'itm_l4_m10_examassignment';

-- ---------------------------------------------------------------------
-- Module 1: Advanced Present & Past Systems
-- ---------------------------------------------------------------------
INSERT INTO audio_assets (id, kind, title, transcript, variety, speaker_count, target_wpm) VALUES
('aud_l4_m1_listen', 'listening', 'What I Would Have Done Differently', 'By the time I took over, the team had already missed two deadlines. | I assumed they''d been badly managed. That assumption cost me six months. | What had actually happened was simpler: nobody had been told what success looked like. | I''d been solving the wrong problem, quite confidently, for half a year. | Looking back, I should have asked one question in week one — what does done mean? | I still think the diagnosis was reasonable given what I knew. | But reasonable and right aren''t the same thing, and that''s the lesson.', 'BrE', 1, 135),
('aud_l4_m1_pron', 'model_pronunciation', 'Module 1 Pronunciation Model', 'They had already missed two deadlines. | What had actually happened was simpler. | I''d been solving the wrong problem. | Reasonable and right aren''t the same thing.', 'BrE', 1, 120);

INSERT INTO audio_cues (id, audio_asset_id, sequence, speaker, text) VALUES
('cue_l4_m1_1', 'aud_l4_m1_listen', 1, 'Speaker', 'By the time I took over, the team had already missed two deadlines.'),
('cue_l4_m1_2', 'aud_l4_m1_listen', 2, 'Speaker', 'I assumed they''d been badly managed. That assumption cost me six months.'),
('cue_l4_m1_3', 'aud_l4_m1_listen', 3, 'Speaker', 'What had actually happened was simpler: nobody had been told what success looked like.'),
('cue_l4_m1_4', 'aud_l4_m1_listen', 4, 'Speaker', 'I''d been solving the wrong problem, quite confidently, for half a year.'),
('cue_l4_m1_5', 'aud_l4_m1_listen', 5, 'Speaker', 'Looking back, I should have asked one question in week one — what does done mean?'),
('cue_l4_m1_6', 'aud_l4_m1_listen', 6, 'Speaker', 'I still think the diagnosis was reasonable given what I knew.'),
('cue_l4_m1_7', 'aud_l4_m1_listen', 7, 'Speaker', 'But reasonable and right aren''t the same thing, and that''s the lesson.');

INSERT INTO learning_items (id, unit_id, sequence, kind, title, body, audio_asset_id) VALUES
('itm_l4_m1_listening', 'unt_l4_m1', 4, 'listening', 'Listening 1 — What I Would Have Done Differently',
'LISTENING OBJECTIVES: Follow a reflective narrative with layered time reference; distinguish past perfect from past simple; hear regret and hindsight.

BEFORE YOU LISTEN: A former team leader reflects on a project that went wrong. Read the four questions first. Knowing what you are listening for is itself the skill being taught, and it is the difference between hearing words and understanding a conversation.

LISTEN TWICE: First for the general situation only — who is speaking, where, and what they want. Do not stop to decode an unknown word; stopping is what makes learners miss the next sentence. Second time, answer the questions.

THEN: Read the synchronised transcript while listening a third time, and mark every place where what you heard and what is written surprised you. That gap is your own pronunciation target, identified by you rather than assigned to you.

SHADOWING: Record yourself speaking the reflection, keeping the past perfect audible. Your recordings are kept attempt by attempt, so you can hear your own progress, and your instructor can reply in their own voice.', 'aud_l4_m1_listen'),
('itm_l4_m1_pronunciation', 'unt_l4_m1', 5, 'pronunciation', 'Pronunciation Lab 1 — Reduced had, Hindsight Contour & Paired Abstractions',
'HOW TO USE THIS LAB: For each target — listen to the model, say it aloud three times, then record yourself and listen back. Listening back is the step learners skip and the step that works: you cannot correct a sound you have not heard yourself produce.

FOCUS THIS MODULE: The reduced had that carries past-perfect meaning, and the intonation of hindsight.

Your recordings are kept, so attempt one and attempt ten sit side by side. Your instructor can reply with a spoken model rather than only written notes.', 'aud_l4_m1_pron');

INSERT INTO pronunciation_targets (id, learning_item_id, sequence, focus, target, example, guidance) VALUES
('pron_l4_m1_1', 'itm_l4_m1_pronunciation', 1, 'connected_speech', 'had reduces to /əd/ or vanishes into ''d', 'they''d been managed; what had happened -> /wɒtədˈhæpənd/; I''d been solving', 'The past perfect is carried by a sound barely present. Learners hear a past simple and lose the entire time relationship the speaker is building.'),
('pron_l4_m1_2', 'itm_l4_m1_pronunciation', 2, 'intonation', 'Hindsight falls slowly and lengthens the key word', 'I should have asked ONE question in week ONE.', 'Regret is marked by slowing and lengthening rather than by extra words. The contour itself communicates that this is a judgement on the past, not a report of it.'),
('pron_l4_m1_3', 'itm_l4_m1_pronunciation', 3, 'sentence_stress', 'Paired abstractions take equal contrastive stress', 'REASonable and RIGHT aren''t the same thing.', 'When two near-synonyms are set against each other, both are stressed. This is the audible signature of the analytical move this level teaches.');

INSERT INTO quiz_questions (id, learning_item_id, sequence, prompt, choices_json, correct_index, audio_cue_id) VALUES
('qq_l4_m1_ls1', 'itm_l4_m1_listening', 1, 'What had happened before the speaker took over?', '["The team had been replaced","The project had been cancelled","Funding had been cut","The team had missed two deadlines"]', 3, 'cue_l4_m1_1'),
('qq_l4_m1_ls2', 'itm_l4_m1_listening', 2, 'What was the real underlying problem?', '["Bad management","Nobody had been told what success looked like","Insufficient staff","Poor technology"]', 1, 'cue_l4_m1_3'),
('qq_l4_m1_ls3', 'itm_l4_m1_listening', 3, 'How long did the speaker work on the wrong problem?', '["Half a year","Six weeks","Three months","Two years"]', 0, 'cue_l4_m1_4'),
('qq_l4_m1_ls4', 'itm_l4_m1_listening', 4, 'What is the speaker''s final distinction?', '["Fast and slow","Cheap and expensive","Reasonable and right","Simple and complex"]', 2, 'cue_l4_m1_7');

-- ---------------------------------------------------------------------
-- Module 2: Academic Writing I
-- ---------------------------------------------------------------------
INSERT INTO audio_assets (id, kind, title, transcript, variety, speaker_count, target_wpm) VALUES
('aud_l4_m2_listen', 'listening', 'A Thesis Tutorial', 'Read me your thesis statement as it stands. | This essay examines the effects of remote work on productivity. | Right. That''s a topic, not a thesis. What do you actually claim? | That remote work increases productivity? | Better, but nobody would disagree with that as stated. Increases it for whom, and measured how? | For knowledge workers, measured by output rather than hours. | Now we''re somewhere. That''s arguable — which is the point. A thesis someone could contest is a thesis. | So if nobody could disagree, it isn''t one. | Precisely.', 'BrE', 2, 135),
('aud_l4_m2_pron', 'model_pronunciation', 'Module 2 Pronunciation Model', 'That''s a topic, not a thesis. | Increases it for whom, and measured how? | That''s arguable, which is the point. | A thesis someone could contest is a thesis.', 'BrE', 1, 120);

INSERT INTO audio_cues (id, audio_asset_id, sequence, speaker, text) VALUES
('cue_l4_m2_1', 'aud_l4_m2_listen', 1, 'Tutor', 'Read me your thesis statement as it stands.'),
('cue_l4_m2_2', 'aud_l4_m2_listen', 2, 'Student', 'This essay examines the effects of remote work on productivity.'),
('cue_l4_m2_3', 'aud_l4_m2_listen', 3, 'Tutor', 'Right. That''s a topic, not a thesis. What do you actually claim?'),
('cue_l4_m2_4', 'aud_l4_m2_listen', 4, 'Student', 'That remote work increases productivity?'),
('cue_l4_m2_5', 'aud_l4_m2_listen', 5, 'Tutor', 'Better, but nobody would disagree with that as stated. Increases it for whom, and measured how?'),
('cue_l4_m2_6', 'aud_l4_m2_listen', 6, 'Student', 'For knowledge workers, measured by output rather than hours.'),
('cue_l4_m2_7', 'aud_l4_m2_listen', 7, 'Tutor', 'Now we''re somewhere. That''s arguable — which is the point. A thesis someone could contest is a thesis.'),
('cue_l4_m2_8', 'aud_l4_m2_listen', 8, 'Student', 'So if nobody could disagree, it isn''t one.'),
('cue_l4_m2_9', 'aud_l4_m2_listen', 9, 'Tutor', 'Precisely.');

INSERT INTO learning_items (id, unit_id, sequence, kind, title, body, audio_asset_id) VALUES
('itm_l4_m2_listening', 'unt_l4_m2', 4, 'listening', 'Listening 2 — A Thesis Tutorial',
'LISTENING OBJECTIVES: Follow tutorial feedback on argument structure; distinguish a topic from a thesis; hear where an argument is diagnosed as descriptive.

BEFORE YOU LISTEN: A tutor works through a student''s draft thesis statement. Read the four questions first. Knowing what you are listening for is itself the skill being taught, and it is the difference between hearing words and understanding a conversation.

LISTEN TWICE: First for the general situation only — who is speaking, where, and what they want. Do not stop to decode an unknown word; stopping is what makes learners miss the next sentence. Second time, answer the questions.

THEN: Read the synchronised transcript while listening a third time, and mark every place where what you heard and what is written surprised you. That gap is your own pronunciation target, identified by you rather than assigned to you.

SHADOWING: Record yourself speaking the tutor''s diagnosis and the student''s revised statement. Your recordings are kept attempt by attempt, so you can hear your own progress, and your instructor can reply in their own voice.', 'aud_l4_m2_listen'),
('itm_l4_m2_pronunciation', 'unt_l4_m2', 5, 'pronunciation', 'Pronunciation Lab 2 — Diagnostic Contrast, Socratic Rise & Clustered Hedges',
'HOW TO USE THIS LAB: For each target — listen to the model, say it aloud three times, then record yourself and listen back. Listening back is the step learners skip and the step that works: you cannot correct a sound you have not heard yourself produce.

FOCUS THIS MODULE: Academic tutorial register and the stress that marks a diagnostic move.

Your recordings are kept, so attempt one and attempt ten sit side by side. Your instructor can reply with a spoken model rather than only written notes.', 'aud_l4_m2_pron');

INSERT INTO pronunciation_targets (id, learning_item_id, sequence, focus, target, example, guidance) VALUES
('pron_l4_m2_1', 'itm_l4_m2_pronunciation', 1, 'sentence_stress', 'Diagnostic moves stress the corrected term', 'That''s a TOPic, not a THEsis.', 'The two nouns take equal heavy stress. In tutorial speech this contrast pattern is the diagnosis, and hearing it is how you know which word to fix.'),
('pron_l4_m2_2', 'itm_l4_m2_pronunciation', 2, 'intonation', 'Socratic questions rise and hang', 'Increases it for WHOM? // And measured HOW?', 'A tutor''s questions rise and stop, leaving space. That hanging contour is an invitation to answer, not a rhetorical flourish — responding to it is a seminar skill.'),
('pron_l4_m2_3', 'itm_l4_m2_pronunciation', 3, 'connected_speech', 'Academic hedges cluster before the point', 'nobody would disagree -> /ˈnəʊbədiwədˌdɪsəˈɡriː/', 'Even direct academic criticism arrives wrapped in fast unstressed hedging. Hearing the wrapper is what keeps the criticism proportionate.');

INSERT INTO quiz_questions (id, learning_item_id, sequence, prompt, choices_json, correct_index, audio_cue_id) VALUES
('qq_l4_m2_ls1', 'itm_l4_m2_listening', 1, 'What is wrong with the student''s first statement?', '["It is too long","It is ungrammatical","It lacks sources","It is a topic, not a thesis"]', 3, 'cue_l4_m2_3'),
('qq_l4_m2_ls2', 'itm_l4_m2_listening', 2, 'What does the tutor object to in the second attempt?', '["It is too specific","Nobody would disagree with it","It is off-topic","It is too short"]', 1, 'cue_l4_m2_5'),
('qq_l4_m2_ls3', 'itm_l4_m2_listening', 3, 'How does the student narrow the claim?', '["By specifying knowledge workers and output","By adding dates","By citing a study","By reducing the scope to one company"]', 0, 'cue_l4_m2_6'),
('qq_l4_m2_ls4', 'itm_l4_m2_listening', 4, 'What is the tutor''s definition of a thesis?', '["A summary of sources","A question","A statement someone could contest","A description of a topic"]', 2, 'cue_l4_m2_7');

-- ---------------------------------------------------------------------
-- Module 3: The World of Work
-- ---------------------------------------------------------------------
INSERT INTO audio_assets (id, kind, title, transcript, variety, speaker_count, target_wpm) VALUES
('aud_l4_m3_listen', 'listening', 'The Performance Conversation', 'I want to talk about the last two client reports. Is now all right? | Yes, of course. | Both went out after the deadline. I''m not assuming I know why. | The data came to me late both times. I should have flagged it. | That''s useful. So the issue isn''t your work rate, it''s the handover. | I think so, yes. I didn''t want to seem like I was blaming the data team. | Raising a dependency isn''t blame. If it happens again, tell me the same day. | Understood. I''d rather have that conversation than this one. | So would I.', 'BrE', 2, 135),
('aud_l4_m3_pron', 'model_pronunciation', 'Module 3 Pronunciation Model', 'Is now all right? | I''m not assuming I know why. | The issue isn''t your work rate, it''s the handover. | Raising a dependency isn''t blame.', 'BrE', 1, 120);

INSERT INTO audio_cues (id, audio_asset_id, sequence, speaker, text) VALUES
('cue_l4_m3_1', 'aud_l4_m3_listen', 1, 'Manager', 'I want to talk about the last two client reports. Is now all right?'),
('cue_l4_m3_2', 'aud_l4_m3_listen', 2, 'Employee', 'Yes, of course.'),
('cue_l4_m3_3', 'aud_l4_m3_listen', 3, 'Manager', 'Both went out after the deadline. I''m not assuming I know why.'),
('cue_l4_m3_4', 'aud_l4_m3_listen', 4, 'Employee', 'The data came to me late both times. I should have flagged it.'),
('cue_l4_m3_5', 'aud_l4_m3_listen', 5, 'Manager', 'That''s useful. So the issue isn''t your work rate, it''s the handover.'),
('cue_l4_m3_6', 'aud_l4_m3_listen', 6, 'Employee', 'I think so, yes. I didn''t want to seem like I was blaming the data team.'),
('cue_l4_m3_7', 'aud_l4_m3_listen', 7, 'Manager', 'Raising a dependency isn''t blame. If it happens again, tell me the same day.'),
('cue_l4_m3_8', 'aud_l4_m3_listen', 8, 'Employee', 'Understood. I''d rather have that conversation than this one.'),
('cue_l4_m3_9', 'aud_l4_m3_listen', 9, 'Manager', 'So would I.');

INSERT INTO learning_items (id, unit_id, sequence, kind, title, body, audio_asset_id) VALUES
('itm_l4_m3_listening', 'unt_l4_m3', 4, 'listening', 'Listening 3 — The Performance Conversation',
'LISTENING OBJECTIVES: Follow a structured professional conversation; separate observation from judgement; hear a request for change framed as support.

BEFORE YOU LISTEN: A manager holds a performance conversation with a team member. Read the four questions first. Knowing what you are listening for is itself the skill being taught, and it is the difference between hearing words and understanding a conversation.

LISTEN TWICE: First for the general situation only — who is speaking, where, and what they want. Do not stop to decode an unknown word; stopping is what makes learners miss the next sentence. Second time, answer the questions.

THEN: Read the synchronised transcript while listening a third time, and mark every place where what you heard and what is written surprised you. That gap is your own pronunciation target, identified by you rather than assigned to you.

SHADOWING: Record yourself speaking the manager''s framing and the employee''s response. Your recordings are kept attempt by attempt, so you can hear your own progress, and your instructor can reply in their own voice.', 'aud_l4_m3_listen'),
('itm_l4_m3_pronunciation', 'unt_l4_m3', 5, 'pronunciation', 'Pronunciation Lab 3 — Observation-versus-Evaluation Stress, Consent Rise & Reflective Reduction',
'HOW TO USE THIS LAB: For each target — listen to the model, say it aloud three times, then record yourself and listen back. Listening back is the step learners skip and the step that works: you cannot correct a sound you have not heard yourself produce.

FOCUS THIS MODULE: Professional register under mild tension, and the stress that separates observation from evaluation.

Your recordings are kept, so attempt one and attempt ten sit side by side. Your instructor can reply with a spoken model rather than only written notes.', 'aud_l4_m3_pron');

INSERT INTO pronunciation_targets (id, learning_item_id, sequence, focus, target, example, guidance) VALUES
('pron_l4_m3_1', 'itm_l4_m3_pronunciation', 1, 'sentence_stress', 'Observation and evaluation are stressed differently', 'Both went out AFTER the DEADline. // I''m NOT asSUMing I know WHY.', 'The factual observation carries even stress; the disclaimer of judgement stresses the negation. Keeping these apart is what makes feedback land as fair.'),
('pron_l4_m3_2', 'itm_l4_m3_pronunciation', 2, 'intonation', 'Checking consent rises and pauses', 'Is NOW all right? (rise, then wait)', 'Opening a difficult conversation with a genuine rising question, then actually pausing, is a professional norm. A flat delivery makes it a formality rather than a choice.'),
('pron_l4_m3_3', 'itm_l4_m3_pronunciation', 3, 'connected_speech', 'Modal + have compresses in reflection', 'I should have flagged it -> /aɪʃədəvˈflæɡdɪt/; I''d rather -> /aɪdˈrɑːðə/', 'Self-correction and preference structures are heavily reduced. Hearing them accurately is what lets you tell an admission from a deflection.');

INSERT INTO quiz_questions (id, learning_item_id, sequence, prompt, choices_json, correct_index, audio_cue_id) VALUES
('qq_l4_m3_ls1', 'itm_l4_m3_listening', 1, 'What is the subject of the conversation?', '["A pay review","A promotion","Two late client reports","A team restructure"]', 2, 'cue_l4_m3_1'),
('qq_l4_m3_ls2', 'itm_l4_m3_listening', 2, 'What does the manager explicitly avoid doing?', '["Assuming they know why","Setting a deadline","Taking notes","Involving HR"]', 0, 'cue_l4_m3_3'),
('qq_l4_m3_ls3', 'itm_l4_m3_listening', 3, 'What does the employee identify as the real cause?', '["Their own workload","Unclear instructions","Software problems","Late handover of data"]', 3, 'cue_l4_m3_4'),
('qq_l4_m3_ls4', 'itm_l4_m3_listening', 4, 'What does the manager ask for in future?', '["A written report","Being told the same day","A meeting with the data team","Earlier starts"]', 1, 'cue_l4_m3_7');

-- ---------------------------------------------------------------------
-- Module 4: Arguing a Position
-- ---------------------------------------------------------------------
INSERT INTO audio_assets (id, kind, title, transcript, variety, speaker_count, target_wpm) VALUES
('aud_l4_m4_listen', 'listening', 'The Steel and the Straw', 'Most people attack the worst version of the other side. It''s easy and it''s useless. | Take the argument against remote work. The weak version is: managers just want control. | Beat that and you''ve beaten nobody, because no serious opponent says it. | The strong version is: informal knowledge transfer happens in unplanned encounters, and remote work removes them. | That''s a real claim, with evidence behind it, and it is much harder to answer. | So we should argue against the harder one? | Always. If you can''t state your opponent''s case better than they can, you don''t understand it yet. | And if I do beat the strong version? | Then you''ve actually won something.', 'BrE', 2, 138),
('aud_l4_m4_pron', 'model_pronunciation', 'Module 4 Pronunciation Model', 'Most people attack the worst version. | The strong version is much harder to answer. | State your opponent''s case better than they can. | Then you''ve actually won something.', 'BrE', 1, 123);

INSERT INTO audio_cues (id, audio_asset_id, sequence, speaker, text) VALUES
('cue_l4_m4_1', 'aud_l4_m4_listen', 1, 'Coach', 'Most people attack the worst version of the other side. It''s easy and it''s useless.'),
('cue_l4_m4_2', 'aud_l4_m4_listen', 2, 'Coach', 'Take the argument against remote work. The weak version is: managers just want control.'),
('cue_l4_m4_3', 'aud_l4_m4_listen', 3, 'Coach', 'Beat that and you''ve beaten nobody, because no serious opponent says it.'),
('cue_l4_m4_4', 'aud_l4_m4_listen', 4, 'Coach', 'The strong version is: informal knowledge transfer happens in unplanned encounters, and remote work removes them.'),
('cue_l4_m4_5', 'aud_l4_m4_listen', 5, 'Coach', 'That''s a real claim, with evidence behind it, and it is much harder to answer.'),
('cue_l4_m4_6', 'aud_l4_m4_listen', 6, 'Student', 'So we should argue against the harder one?'),
('cue_l4_m4_7', 'aud_l4_m4_listen', 7, 'Coach', 'Always. If you can''t state your opponent''s case better than they can, you don''t understand it yet.'),
('cue_l4_m4_8', 'aud_l4_m4_listen', 8, 'Student', 'And if I do beat the strong version?'),
('cue_l4_m4_9', 'aud_l4_m4_listen', 9, 'Coach', 'Then you''ve actually won something.');

INSERT INTO learning_items (id, unit_id, sequence, kind, title, body, audio_asset_id) VALUES
('itm_l4_m4_listening', 'unt_l4_m4', 4, 'listening', 'Listening 4 — The Steel and the Straw',
'LISTENING OBJECTIVES: Follow an argument about argument; distinguish a strong from a weak version of an opponent''s case; hear a reconstruction.

BEFORE YOU LISTEN: A debating coach shows the difference between attacking a weak version and a strong one. Read the four questions first. Knowing what you are listening for is itself the skill being taught, and it is the difference between hearing words and understanding a conversation.

LISTEN TWICE: First for the general situation only — who is speaking, where, and what they want. Do not stop to decode an unknown word; stopping is what makes learners miss the next sentence. Second time, answer the questions.

THEN: Read the synchronised transcript while listening a third time, and mark every place where what you heard and what is written surprised you. That gap is your own pronunciation target, identified by you rather than assigned to you.

SHADOWING: Record yourself speaking the coach''s reconstruction of the opposing case. Your recordings are kept attempt by attempt, so you can hear your own progress, and your instructor can reply in their own voice.', 'aud_l4_m4_listen'),
('itm_l4_m4_pronunciation', 'unt_l4_m4', 5, 'pronunciation', 'Pronunciation Lab 4 — Voicing Another Position, Weak-versus-Strong Stress & Conditional Chunking',
'HOW TO USE THIS LAB: For each target — listen to the model, say it aloud three times, then record yourself and listen back. Listening back is the step learners skip and the step that works: you cannot correct a sound you have not heard yourself produce.

FOCUS THIS MODULE: The stress pattern of reconstruction — how a speaker signals they are voicing someone else''s view.

Your recordings are kept, so attempt one and attempt ten sit side by side. Your instructor can reply with a spoken model rather than only written notes.', 'aud_l4_m4_pron');

INSERT INTO pronunciation_targets (id, learning_item_id, sequence, focus, target, example, guidance) VALUES
('pron_l4_m4_1', 'itm_l4_m4_pronunciation', 1, 'intonation', 'Voicing another position drops in pitch and flattens', 'The weak version is: MANagers just want conTROL.', 'Speakers lower and flatten their voice when quoting a view they do not hold. That shift is how a listener knows this is a reconstruction, not the speaker''s claim.'),
('pron_l4_m4_2', 'itm_l4_m4_pronunciation', 2, 'sentence_stress', 'Weak and strong take heavy contrastive stress', 'The WEAK version... // The STRONG version...', 'This module''s whole structure is one contrast pair, repeated. Following the stress is following the argument.'),
('pron_l4_m4_3', 'itm_l4_m4_pronunciation', 3, 'rhythm', 'Conditional challenges chunk into three', 'If you CAN''T state your opponent''s case // BETter than THEY can, // you don''t underSTAND it yet.', 'Long conditional sentences break into rhythmic groups at the clause boundaries. Hearing those boundaries is what makes complex sentences followable in real time.');

INSERT INTO quiz_questions (id, learning_item_id, sequence, prompt, choices_json, correct_index, audio_cue_id) VALUES
('qq_l4_m4_ls1', 'itm_l4_m4_listening', 1, 'What does the coach say most people attack?', '["The strongest version","The most recent version","The written version","The worst version"]', 3, 'cue_l4_m4_1'),
('qq_l4_m4_ls2', 'itm_l4_m4_listening', 2, 'What is the weak version of the anti-remote-work case?', '["Productivity falls","Managers just want control","Offices are expensive","Staff prefer offices"]', 1, 'cue_l4_m4_2'),
('qq_l4_m4_ls3', 'itm_l4_m4_listening', 3, 'What is the strong version?', '["Informal knowledge transfer is lost","Costs rise","Staff are less loyal","Training is harder"]', 0, 'cue_l4_m4_4'),
('qq_l4_m4_ls4', 'itm_l4_m4_listening', 4, 'What is the coach''s test of understanding?', '["Winning the debate","Citing more evidence","Stating the opponent''s case better than they can","Speaking for longer"]', 2, 'cue_l4_m4_7');

-- ---------------------------------------------------------------------
-- Module 5: Science, Technology & Ethics
-- ---------------------------------------------------------------------
INSERT INTO audio_assets (id, kind, title, transcript, variety, speaker_count, target_wpm) VALUES
('aud_l4_m5_listen', 'listening', 'The Trial That Was Stopped', 'The trial was suspended in March, and it''s worth separating two different objections. | The first was procedural: consent forms had been translated but not back-translated. | That''s fixable. It was fixed, in fact, within a fortnight. | The second objection was substantive. Participants were being offered payment well above local monthly wages. | The concern there isn''t fraud. It''s that a large enough incentive undermines the voluntariness consent depends on. | So the money made the consent less real? | That''s the argument. It''s contested, and reasonable people land differently on it. | But it can''t be resolved by better paperwork, which is why the trial stayed suspended.', 'BrE', 2, 138),
('aud_l4_m5_pron', 'model_pronunciation', 'Module 5 Pronunciation Model', 'The trial was suspended in March. | The first objection was procedural. | A large incentive undermines voluntariness. | It can''t be resolved by better paperwork.', 'BrE', 1, 123);

INSERT INTO audio_cues (id, audio_asset_id, sequence, speaker, text) VALUES
('cue_l4_m5_1', 'aud_l4_m5_listen', 1, 'Officer', 'The trial was suspended in March, and it''s worth separating two different objections.'),
('cue_l4_m5_2', 'aud_l4_m5_listen', 2, 'Officer', 'The first was procedural: consent forms had been translated but not back-translated.'),
('cue_l4_m5_3', 'aud_l4_m5_listen', 3, 'Officer', 'That''s fixable. It was fixed, in fact, within a fortnight.'),
('cue_l4_m5_4', 'aud_l4_m5_listen', 4, 'Officer', 'The second objection was substantive. Participants were being offered payment well above local monthly wages.'),
('cue_l4_m5_5', 'aud_l4_m5_listen', 5, 'Officer', 'The concern there isn''t fraud. It''s that a large enough incentive undermines the voluntariness consent depends on.'),
('cue_l4_m5_6', 'aud_l4_m5_listen', 6, 'Interviewer', 'So the money made the consent less real?'),
('cue_l4_m5_7', 'aud_l4_m5_listen', 7, 'Officer', 'That''s the argument. It''s contested, and reasonable people land differently on it.'),
('cue_l4_m5_8', 'aud_l4_m5_listen', 8, 'Officer', 'But it can''t be resolved by better paperwork, which is why the trial stayed suspended.');

INSERT INTO learning_items (id, unit_id, sequence, kind, title, body, audio_asset_id) VALUES
('itm_l4_m5_listening', 'unt_l4_m5', 4, 'listening', 'Listening 5 — The Trial That Was Stopped',
'LISTENING OBJECTIVES: Follow an ethical case with technical content; distinguish procedural from moral objection; hear passive constructions at speed.

BEFORE YOU LISTEN: A research ethics officer describes why a trial was halted. Read the four questions first. Knowing what you are listening for is itself the skill being taught, and it is the difference between hearing words and understanding a conversation.

LISTEN TWICE: First for the general situation only — who is speaking, where, and what they want. Do not stop to decode an unknown word; stopping is what makes learners miss the next sentence. Second time, answer the questions.

THEN: Read the synchronised transcript while listening a third time, and mark every place where what you heard and what is written surprised you. That gap is your own pronunciation target, identified by you rather than assigned to you.

SHADOWING: Record yourself speaking the officer''s explanation of the two objections. Your recordings are kept attempt by attempt, so you can hear your own progress, and your instructor can reply in their own voice.', 'aud_l4_m5_listen'),
('itm_l4_m5_pronunciation', 'unt_l4_m5', 5, 'pronunciation', 'Pronunciation Lab 5 — Compressed Passives, Organising Contrasts & Concede-then-Conclude',
'HOW TO USE THIS LAB: For each target — listen to the model, say it aloud three times, then record yourself and listen back. Listening back is the step learners skip and the step that works: you cannot correct a sound you have not heard yourself produce.

FOCUS THIS MODULE: Passive constructions and nominalisation at speed — the register of institutional explanation.

Your recordings are kept, so attempt one and attempt ten sit side by side. Your instructor can reply with a spoken model rather than only written notes.', 'aud_l4_m5_pron');

INSERT INTO pronunciation_targets (id, learning_item_id, sequence, focus, target, example, guidance) VALUES
('pron_l4_m5_1', 'itm_l4_m5_pronunciation', 1, 'connected_speech', 'Passives compress heavily', 'was suspended -> /wəzsəˈspendɪd/; had been translated -> /ədbɪnˈtrænzleɪtɪd/', 'Institutional English is dense with passives, and the auxiliaries carrying them are unstressed. Missing them costs you who did what, and whether it has already happened.'),
('pron_l4_m5_2', 'itm_l4_m5_pronunciation', 2, 'sentence_stress', 'Procedural and substantive are the organising contrast', 'The FIRST was proCEDural... // The SECond objection was subSTANtive.', 'The whole explanation hangs on this pair. Speakers stress such organising terms heavily precisely so listeners can hold the structure.'),
('pron_l4_m5_3', 'itm_l4_m5_pronunciation', 3, 'intonation', 'Concession before a firm conclusion rises then falls hard', 'It''s conTESted, and reasonable people land DIFFerently. // BUT it CAN''T be resolved by better PAPerwork.', 'The rise on the concession followed by a hard fall on the conclusion is the shape of a decision that has already been taken.');

INSERT INTO quiz_questions (id, learning_item_id, sequence, prompt, choices_json, correct_index, audio_cue_id) VALUES
('qq_l4_m5_ls1', 'itm_l4_m5_listening', 1, 'What was the procedural objection?', '["Consent forms were not back-translated","Payments were too high","The sample was too small","Results were withheld"]', 0, 'cue_l4_m5_2'),
('qq_l4_m5_ls2', 'itm_l4_m5_listening', 2, 'How quickly was the procedural issue fixed?', '["Within a day","Within three months","Within a fortnight","It was not fixed"]', 2, 'cue_l4_m5_3'),
('qq_l4_m5_ls3', 'itm_l4_m5_listening', 3, 'What was the substantive objection?', '["Fraud","Payment high enough to undermine voluntariness","Poor data handling","Lack of a control group"]', 1, 'cue_l4_m5_4'),
('qq_l4_m5_ls4', 'itm_l4_m5_listening', 4, 'Why did the trial remain suspended?', '["The paperwork was still wrong","Funding was withdrawn","Participants withdrew","The substantive issue cannot be fixed by paperwork"]', 3, 'cue_l4_m5_8');

-- ---------------------------------------------------------------------
-- Module 6: Global Issues
-- ---------------------------------------------------------------------
INSERT INTO audio_assets (id, kind, title, transcript, variety, speaker_count, target_wpm) VALUES
('aud_l4_m6_listen', 'listening', 'Two Ways to Count the Poor', 'The headline says poverty has fallen by a third. Is that right? | It''s right on that measure. The measure is an absolute income threshold. | On that basis, yes — a substantial fall, and it''s real. | It''s real and it''s incomplete. A relative measure shows almost no change. | So which is correct? | Both, and that''s the uncomfortable answer. They measure different things. | I''d agree with that. Absolute measures track whether people can eat. | And relative measures track whether they can participate. A society can feed people and still exclude them. | So the headline isn''t wrong, it''s partial. | Which is the more dangerous kind of wrong.', 'BrE', 3, 138),
('aud_l4_m6_pron', 'model_pronunciation', 'Module 6 Pronunciation Model', 'It''s right on that measure. | A relative measure shows almost no change. | They measure different things. | It isn''t wrong, it''s partial.', 'BrE', 1, 123);

INSERT INTO audio_cues (id, audio_asset_id, sequence, speaker, text) VALUES
('cue_l4_m6_1', 'aud_l4_m6_listen', 1, 'Presenter', 'The headline says poverty has fallen by a third. Is that right?'),
('cue_l4_m6_2', 'aud_l4_m6_listen', 2, 'Ahmed', 'It''s right on that measure. The measure is an absolute income threshold.'),
('cue_l4_m6_3', 'aud_l4_m6_listen', 3, 'Ahmed', 'On that basis, yes — a substantial fall, and it''s real.'),
('cue_l4_m6_4', 'aud_l4_m6_listen', 4, 'Beatriz', 'It''s real and it''s incomplete. A relative measure shows almost no change.'),
('cue_l4_m6_5', 'aud_l4_m6_listen', 5, 'Presenter', 'So which is correct?'),
('cue_l4_m6_6', 'aud_l4_m6_listen', 6, 'Beatriz', 'Both, and that''s the uncomfortable answer. They measure different things.'),
('cue_l4_m6_7', 'aud_l4_m6_listen', 7, 'Ahmed', 'I''d agree with that. Absolute measures track whether people can eat.'),
('cue_l4_m6_8', 'aud_l4_m6_listen', 8, 'Beatriz', 'And relative measures track whether they can participate. A society can feed people and still exclude them.'),
('cue_l4_m6_9', 'aud_l4_m6_listen', 9, 'Presenter', 'So the headline isn''t wrong, it''s partial.'),
('cue_l4_m6_10', 'aud_l4_m6_listen', 10, 'Beatriz', 'Which is the more dangerous kind of wrong.');

INSERT INTO learning_items (id, unit_id, sequence, kind, title, body, audio_asset_id) VALUES
('itm_l4_m6_listening', 'unt_l4_m6', 4, 'listening', 'Listening 6 — Two Ways to Count the Poor',
'LISTENING OBJECTIVES: Follow a methodological disagreement; understand how a definition changes a finding; catch figures embedded in argument.

BEFORE YOU LISTEN: Two analysts disagree about a poverty statistic on a current-affairs programme. Read the four questions first. Knowing what you are listening for is itself the skill being taught, and it is the difference between hearing words and understanding a conversation.

LISTEN TWICE: First for the general situation only — who is speaking, where, and what they want. Do not stop to decode an unknown word; stopping is what makes learners miss the next sentence. Second time, answer the questions.

THEN: Read the synchronised transcript while listening a third time, and mark every place where what you heard and what is written surprised you. That gap is your own pronunciation target, identified by you rather than assigned to you.

SHADOWING: Record yourself speaking the exchange about what the measure counts. Your recordings are kept attempt by attempt, so you can hear your own progress, and your instructor can reply in their own voice.', 'aud_l4_m6_listen'),
('itm_l4_m6_pronunciation', 'unt_l4_m6', 5, 'pronunciation', 'Pronunciation Lab 6 — Refusing a False Choice, Subordinated Figures & Compressed Agreement',
'HOW TO USE THIS LAB: For each target — listen to the model, say it aloud three times, then record yourself and listen back. Listening back is the step learners skip and the step that works: you cannot correct a sound you have not heard yourself produce.

FOCUS THIS MODULE: Figures embedded in argument, where the number is subordinate to the claim.

Your recordings are kept, so attempt one and attempt ten sit side by side. Your instructor can reply with a spoken model rather than only written notes.', 'aud_l4_m6_pron');

INSERT INTO pronunciation_targets (id, learning_item_id, sequence, focus, target, example, guidance) VALUES
('pron_l4_m6_1', 'itm_l4_m6_pronunciation', 1, 'sentence_stress', 'Both and different carry the resolution', 'BOTH, and that''s the unCOMfortable answer. They measure DIFFerent things.', 'When a speaker refuses a false choice, the stress falls on both and on the distinguishing word. That pattern is the audible shape of a methodological answer.'),
('pron_l4_m6_2', 'itm_l4_m6_pronunciation', 2, 'intonation', 'Figures inside argument are said faster and lower', '...has fallen by A THIRD. // It''s right ON THAT MEASure.', 'When a number is not the point, it is subordinated in pitch. Recognising that tells you the speaker is about to challenge the framing rather than the figure.'),
('pron_l4_m6_3', 'itm_l4_m6_pronunciation', 3, 'connected_speech', 'Agreement formulas compress fully', 'I''d agree with that -> /aɪdəˈɡriːwɪðæt/', 'In fast professional disagreement, the agreements are the most compressed parts. Missing them makes a nuanced exchange sound like a row.');

INSERT INTO quiz_questions (id, learning_item_id, sequence, prompt, choices_json, correct_index, audio_cue_id) VALUES
('qq_l4_m6_ls1', 'itm_l4_m6_listening', 1, 'By how much does the headline say poverty has fallen?', '["A tenth","A third","A quarter","A half"]', 1, 'cue_l4_m6_1'),
('qq_l4_m6_ls2', 'itm_l4_m6_listening', 2, 'What does the absolute measure track?', '["Participation","Income inequality","Housing quality","Whether people can eat"]', 3, 'cue_l4_m6_7'),
('qq_l4_m6_ls3', 'itm_l4_m6_listening', 3, 'What does the relative measure show?', '["A larger fall","A rise","Almost no change","The same result"]', 2, 'cue_l4_m6_4'),
('qq_l4_m6_ls4', 'itm_l4_m6_listening', 4, 'How does Beatriz characterise the headline?', '["Partial","Wrong","Fabricated","Out of date"]', 0, 'cue_l4_m6_10');

-- ---------------------------------------------------------------------
-- Module 7: Media Literacy & Critical Reading
-- ---------------------------------------------------------------------
INSERT INTO audio_assets (id, kind, title, transcript, variety, speaker_count, target_wpm) VALUES
('aud_l4_m7_listen', 'listening', 'The Anonymous Source', 'Who told you the minister knew in advance? | Two people in the department. Both independently. | Did either of them say the minister knew, or did they say the minister should have known? | One said knew. The other said it would have been extraordinary if she hadn''t. | Those aren''t the same claim, and the second one isn''t evidence. | It''s corroborating context. | It''s an inference from a person who wasn''t in the room. Write what the first source said, attribute it, and stop. | That''s a much weaker story. | It''s a story we can stand up. The other one is a story we''d retract.', 'BrE', 2, 138),
('aud_l4_m7_pron', 'model_pronunciation', 'Module 7 Pronunciation Model', 'Who told you the minister knew? | Both said it independently. | Those aren''t the same claim. | It''s a story we can stand up.', 'BrE', 1, 123);

INSERT INTO audio_cues (id, audio_asset_id, sequence, speaker, text) VALUES
('cue_l4_m7_1', 'aud_l4_m7_listen', 1, 'Editor', 'Who told you the minister knew in advance?'),
('cue_l4_m7_2', 'aud_l4_m7_listen', 2, 'Reporter', 'Two people in the department. Both independently.'),
('cue_l4_m7_3', 'aud_l4_m7_listen', 3, 'Editor', 'Did either of them say the minister knew, or did they say the minister should have known?'),
('cue_l4_m7_4', 'aud_l4_m7_listen', 4, 'Reporter', 'One said knew. The other said it would have been extraordinary if she hadn''t.'),
('cue_l4_m7_5', 'aud_l4_m7_listen', 5, 'Editor', 'Those aren''t the same claim, and the second one isn''t evidence.'),
('cue_l4_m7_6', 'aud_l4_m7_listen', 6, 'Reporter', 'It''s corroborating context.'),
('cue_l4_m7_7', 'aud_l4_m7_listen', 7, 'Editor', 'It''s an inference from a person who wasn''t in the room. Write what the first source said, attribute it, and stop.'),
('cue_l4_m7_8', 'aud_l4_m7_listen', 8, 'Reporter', 'That''s a much weaker story.'),
('cue_l4_m7_9', 'aud_l4_m7_listen', 9, 'Editor', 'It''s a story we can stand up. The other one is a story we''d retract.');

INSERT INTO learning_items (id, unit_id, sequence, kind, title, body, audio_asset_id) VALUES
('itm_l4_m7_listening', 'unt_l4_m7', 4, 'listening', 'Listening 7 — The Anonymous Source',
'LISTENING OBJECTIVES: Evaluate spoken sourcing; distinguish attribution from assertion; hear where certainty is manufactured.

BEFORE YOU LISTEN: An editor questions a reporter about a story before publication. Read the four questions first. Knowing what you are listening for is itself the skill being taught, and it is the difference between hearing words and understanding a conversation.

LISTEN TWICE: First for the general situation only — who is speaking, where, and what they want. Do not stop to decode an unknown word; stopping is what makes learners miss the next sentence. Second time, answer the questions.

THEN: Read the synchronised transcript while listening a third time, and mark every place where what you heard and what is written surprised you. That gap is your own pronunciation target, identified by you rather than assigned to you.

SHADOWING: Record yourself speaking the editor''s questioning of the sourcing. Your recordings are kept attempt by attempt, so you can hear your own progress, and your instructor can reply in their own voice.', 'aud_l4_m7_listen'),
('itm_l4_m7_pronunciation', 'unt_l4_m7', 5, 'pronunciation', 'Pronunciation Lab 7 — Fact-versus-Inference Stress, Unhedged Register & Reporting Frames',
'HOW TO USE THIS LAB: For each target — listen to the model, say it aloud three times, then record yourself and listen back. Listening back is the step learners skip and the step that works: you cannot correct a sound you have not heard yourself produce.

FOCUS THIS MODULE: The audible difference between what a source said and what a reporter concluded.

Your recordings are kept, so attempt one and attempt ten sit side by side. Your instructor can reply with a spoken model rather than only written notes.', 'aud_l4_m7_pron');

INSERT INTO pronunciation_targets (id, learning_item_id, sequence, focus, target, example, guidance) VALUES
('pron_l4_m7_1', 'itm_l4_m7_pronunciation', 1, 'sentence_stress', 'Knew versus should have known is the whole distinction', 'Did they say the minister KNEW, or that she SHOULD HAVE known?', 'One stressed word separates a fact from an inference. This module''s analytical objective is audible in that single contrast.'),
('pron_l4_m7_2', 'itm_l4_m7_pronunciation', 2, 'intonation', 'Editorial challenge falls hard and does not soften', 'Those AREN''T the same CLAIM. // And the second one ISN''T EVidence.', 'Unlike the hedged criticism of Level III Module 3, this register is deliberately unhedged. Recognising when English drops its softeners is itself information about the stakes.'),
('pron_l4_m7_3', 'itm_l4_m7_pronunciation', 3, 'connected_speech', 'Reported speech compresses around the verb', 'she said that -> /ʃiˈsedðət/; would have been -> /wʊdəvbɪn/', 'The reporting frame is fast and unstressed while the reported content is clear. That asymmetry is how you separate attribution from assertion in real time.');

INSERT INTO quiz_questions (id, learning_item_id, sequence, prompt, choices_json, correct_index, audio_cue_id) VALUES
('qq_l4_m7_ls1', 'itm_l4_m7_listening', 1, 'How many sources does the reporter have?', '["Two","One","Three","Four"]', 0, 'cue_l4_m7_2'),
('qq_l4_m7_ls2', 'itm_l4_m7_listening', 2, 'What did the second source actually say?', '["The minister knew","The minister denied it","It would have been extraordinary if she had not known","Nothing on the record"]', 2, 'cue_l4_m7_4'),
('qq_l4_m7_ls3', 'itm_l4_m7_listening', 3, 'Why does the editor reject the second source''s statement?', '["It is anonymous","It is an inference from someone not in the room","It is off the record","It contradicts the first source"]', 1, 'cue_l4_m7_7'),
('qq_l4_m7_ls4', 'itm_l4_m7_listening', 4, 'What does the editor instruct?', '["Drop the story","Find a third source","Publish both claims","Write what the first source said and attribute it"]', 3, 'cue_l4_m7_7');

-- ---------------------------------------------------------------------
-- Module 8: Meetings & Negotiation
-- ---------------------------------------------------------------------
INSERT INTO audio_assets (id, kind, title, transcript, variety, speaker_count, target_wpm) VALUES
('aud_l4_m8_listen', 'listening', 'Splitting the Difference', 'Our position is that the rate has to rise by eight per cent. | We can''t do eight. We could do four. | Four doesn''t cover our cost increase. What''s driving your ceiling? | Our budget is fixed until April. It''s a timing problem, not a value judgement. | Then would you do eight from April, with four until then? | If you''ll extend the term to three years, yes. | Three years at eight from April. I can take that to my board. | Good. And to be clear — I''d have said no to eight today whatever you offered. | I know. That''s why I asked what was driving it.', 'BrE', 2, 140),
('aud_l4_m8_pron', 'model_pronunciation', 'Module 8 Pronunciation Model', 'Our position is that the rate has to rise. | What''s driving your ceiling? | If you''ll extend the term, yes. | I can take that to my board.', 'BrE', 1, 125);

INSERT INTO audio_cues (id, audio_asset_id, sequence, speaker, text) VALUES
('cue_l4_m8_1', 'aud_l4_m8_listen', 1, 'Okonjo', 'Our position is that the rate has to rise by eight per cent.'),
('cue_l4_m8_2', 'aud_l4_m8_listen', 2, 'Lindqvist', 'We can''t do eight. We could do four.'),
('cue_l4_m8_3', 'aud_l4_m8_listen', 3, 'Okonjo', 'Four doesn''t cover our cost increase. What''s driving your ceiling?'),
('cue_l4_m8_4', 'aud_l4_m8_listen', 4, 'Lindqvist', 'Our budget is fixed until April. It''s a timing problem, not a value judgement.'),
('cue_l4_m8_5', 'aud_l4_m8_listen', 5, 'Okonjo', 'Then would you do eight from April, with four until then?'),
('cue_l4_m8_6', 'aud_l4_m8_listen', 6, 'Lindqvist', 'If you''ll extend the term to three years, yes.'),
('cue_l4_m8_7', 'aud_l4_m8_listen', 7, 'Okonjo', 'Three years at eight from April. I can take that to my board.'),
('cue_l4_m8_8', 'aud_l4_m8_listen', 8, 'Lindqvist', 'Good. And to be clear — I''d have said no to eight today whatever you offered.'),
('cue_l4_m8_9', 'aud_l4_m8_listen', 9, 'Okonjo', 'I know. That''s why I asked what was driving it.');

INSERT INTO learning_items (id, unit_id, sequence, kind, title, body, audio_asset_id) VALUES
('itm_l4_m8_listening', 'unt_l4_m8', 4, 'listening', 'Listening 8 — Splitting the Difference',
'LISTENING OBJECTIVES: Follow a negotiation to a settlement; track positions and interests; hear where a concession is traded rather than given.

BEFORE YOU LISTEN: Two organisations negotiate a contract renewal. Read the four questions first. Knowing what you are listening for is itself the skill being taught, and it is the difference between hearing words and understanding a conversation.

LISTEN TWICE: First for the general situation only — who is speaking, where, and what they want. Do not stop to decode an unknown word; stopping is what makes learners miss the next sentence. Second time, answer the questions.

THEN: Read the synchronised transcript while listening a third time, and mark every place where what you heard and what is written surprised you. That gap is your own pronunciation target, identified by you rather than assigned to you.

SHADOWING: Record yourself speaking the exchange where the concession is traded. Your recordings are kept attempt by attempt, so you can hear your own progress, and your instructor can reply in their own voice.', 'aud_l4_m8_listen'),
('itm_l4_m8_pronunciation', 'unt_l4_m8', 5, 'pronunciation', 'Pronunciation Lab 8 — Conditional Stress, Probe-versus-Offer Contours & Numeric Clarity',
'HOW TO USE THIS LAB: For each target — listen to the model, say it aloud three times, then record yourself and listen back. Listening back is the step learners skip and the step that works: you cannot correct a sound you have not heard yourself produce.

FOCUS THIS MODULE: Conditional offers, and the stress that marks a trade rather than a gift.

Your recordings are kept, so attempt one and attempt ten sit side by side. Your instructor can reply with a spoken model rather than only written notes.', 'aud_l4_m8_pron');

INSERT INTO pronunciation_targets (id, learning_item_id, sequence, focus, target, example, guidance) VALUES
('pron_l4_m8_1', 'itm_l4_m8_pronunciation', 1, 'sentence_stress', 'A traded concession stresses the condition', 'IF you''ll extend the term to THREE years, YES.', 'The stress on if and on the condition marks this as an exchange, not a gift. Missing it makes a negotiator sound as though they simply conceded.'),
('pron_l4_m8_2', 'itm_l4_m8_pronunciation', 2, 'intonation', 'Probing questions fall, offers rise', 'What''s DRIVing your ceiling? (fall) // Would you do EIGHT from APRIL? (rise)', 'Diagnostic questions fall because they demand information; offers rise because they invite acceptance. The two contours do different work at the table.'),
('pron_l4_m8_3', 'itm_l4_m8_pronunciation', 3, 'connected_speech', 'Negotiation formulas compress', 'we can''t do -> /wiˈkɑːntdu/; I can take that to -> /aɪkənˈteɪkðætə/', 'At full professional speed the framing compresses and only the numbers stay clear. That is deliberate: the figures are what must not be misheard.');

INSERT INTO quiz_questions (id, learning_item_id, sequence, prompt, choices_json, correct_index, audio_cue_id) VALUES
('qq_l4_m8_ls1', 'itm_l4_m8_listening', 1, 'What increase does Okonjo initially demand?', '["Four per cent","Six per cent","Ten per cent","Eight per cent"]', 3, 'cue_l4_m8_1'),
('qq_l4_m8_ls2', 'itm_l4_m8_listening', 2, 'What is the real constraint on Lindqvist''s side?', '["The rate is too high","The budget is fixed until April","Board approval","A competitor''s offer"]', 1, 'cue_l4_m8_4'),
('qq_l4_m8_ls3', 'itm_l4_m8_listening', 3, 'What does Lindqvist ask for in return?', '["Extending the term to three years","A discount","Faster payment","A written guarantee"]', 0, 'cue_l4_m8_6'),
('qq_l4_m8_ls4', 'itm_l4_m8_listening', 4, 'What does Okonjo say was the key move?', '["Offering a discount","Threatening to walk away","Asking what was driving the ceiling","Involving the board"]', 2, 'cue_l4_m8_9');

-- ---------------------------------------------------------------------
-- Module 9: Academic Writing II
-- ---------------------------------------------------------------------
INSERT INTO audio_assets (id, kind, title, transcript, variety, speaker_count, target_wpm) VALUES
('aud_l4_m9_listen', 'listening', 'The Literature Review Supervision', 'Your chapter reads as eight summaries in a row. That''s not a review. | But I''ve covered all the key sources. | Coverage isn''t the problem. Organisation is. What are your sources disagreeing about? | Mostly about whether the effect holds outside laboratory settings. | Then that''s your section heading, and every source goes underneath it according to where it lands. | So I organise by argument rather than by author. | Exactly. When a reader can''t tell whose paragraph it is, you''re synthesising. | And the sources that don''t fit any disagreement? | Ask whether they belong in the chapter at all. Usually they don''t.', 'BrE', 2, 140),
('aud_l4_m9_pron', 'model_pronunciation', 'Module 9 Pronunciation Model', 'Your chapter reads as eight summaries. | Coverage isn''t the problem, organisation is. | Organise by argument, not by author. | When a reader can''t tell whose paragraph it is, you''re synthesising.', 'BrE', 1, 125);

INSERT INTO audio_cues (id, audio_asset_id, sequence, speaker, text) VALUES
('cue_l4_m9_1', 'aud_l4_m9_listen', 1, 'Supervisor', 'Your chapter reads as eight summaries in a row. That''s not a review.'),
('cue_l4_m9_2', 'aud_l4_m9_listen', 2, 'Student', 'But I''ve covered all the key sources.'),
('cue_l4_m9_3', 'aud_l4_m9_listen', 3, 'Supervisor', 'Coverage isn''t the problem. Organisation is. What are your sources disagreeing about?'),
('cue_l4_m9_4', 'aud_l4_m9_listen', 4, 'Student', 'Mostly about whether the effect holds outside laboratory settings.'),
('cue_l4_m9_5', 'aud_l4_m9_listen', 5, 'Supervisor', 'Then that''s your section heading, and every source goes underneath it according to where it lands.'),
('cue_l4_m9_6', 'aud_l4_m9_listen', 6, 'Student', 'So I organise by argument rather than by author.'),
('cue_l4_m9_7', 'aud_l4_m9_listen', 7, 'Supervisor', 'Exactly. When a reader can''t tell whose paragraph it is, you''re synthesising.'),
('cue_l4_m9_8', 'aud_l4_m9_listen', 8, 'Student', 'And the sources that don''t fit any disagreement?'),
('cue_l4_m9_9', 'aud_l4_m9_listen', 9, 'Supervisor', 'Ask whether they belong in the chapter at all. Usually they don''t.');

INSERT INTO learning_items (id, unit_id, sequence, kind, title, body, audio_asset_id) VALUES
('itm_l4_m9_listening', 'unt_l4_m9', 4, 'listening', 'Listening 9 — The Literature Review Supervision',
'LISTENING OBJECTIVES: Follow supervision on synthesis; distinguish summarising from synthesising; hear a structural instruction.

BEFORE YOU LISTEN: A supervisor reviews a student''s literature review chapter. Read the four questions first. Knowing what you are listening for is itself the skill being taught, and it is the difference between hearing words and understanding a conversation.

LISTEN TWICE: First for the general situation only — who is speaking, where, and what they want. Do not stop to decode an unknown word; stopping is what makes learners miss the next sentence. Second time, answer the questions.

THEN: Read the synchronised transcript while listening a third time, and mark every place where what you heard and what is written surprised you. That gap is your own pronunciation target, identified by you rather than assigned to you.

SHADOWING: Record yourself speaking the supervisor''s description of thematic organisation. Your recordings are kept attempt by attempt, so you can hear your own progress, and your instructor can reply in their own voice.', 'aud_l4_m9_listen'),
('itm_l4_m9_pronunciation', 'unt_l4_m9', 5, 'pronunciation', 'Pronunciation Lab 9 — Abstract-Noun Contrast, Instruction Contour & Homophone Disambiguation',
'HOW TO USE THIS LAB: For each target — listen to the model, say it aloud three times, then record yourself and listen back. Listening back is the step learners skip and the step that works: you cannot correct a sound you have not heard yourself produce.

FOCUS THIS MODULE: Structural academic instruction, and the stress that marks an organising principle.

Your recordings are kept, so attempt one and attempt ten sit side by side. Your instructor can reply with a spoken model rather than only written notes.', 'aud_l4_m9_pron');

INSERT INTO pronunciation_targets (id, learning_item_id, sequence, focus, target, example, guidance) VALUES
('pron_l4_m9_1', 'itm_l4_m9_pronunciation', 1, 'sentence_stress', 'Coverage versus organisation is the diagnosis', 'COVerage isn''t the problem. // OrganiSAtion is.', 'Two abstract nouns in contrast, the second stressed and standing alone. This is how academic supervision delivers a structural diagnosis in six words.'),
('pron_l4_m9_2', 'itm_l4_m9_pronunciation', 2, 'intonation', 'Instructions with a following rule fall then level', 'THEN that''s your section HEADing, // and every source goes underNEATH it.', 'The instruction falls; the elaboration levels off. Hearing the drop tells you the actionable part has already been said.'),
('pron_l4_m9_3', 'itm_l4_m9_pronunciation', 3, 'connected_speech', 'Whose and who''s are indistinguishable in speech', 'whose paragraph it is -> /huːzˈpærəɡrɑːfɪtɪz/', 'Context alone disambiguates. At B2 this is worth noticing consciously, because academic English uses both constantly and the ear must rely on syntax rather than sound.');

INSERT INTO quiz_questions (id, learning_item_id, sequence, prompt, choices_json, correct_index, audio_cue_id) VALUES
('qq_l4_m9_ls1', 'itm_l4_m9_listening', 1, 'What is wrong with the student''s chapter?', '["Missing sources","It is too short","It reads as eight summaries in a row","Incorrect citation style"]', 2, 'cue_l4_m9_1'),
('qq_l4_m9_ls2', 'itm_l4_m9_listening', 2, 'What are the sources disagreeing about?', '["Whether the effect holds outside the laboratory","Sample sizes","Funding sources","Definitions of the term"]', 0, 'cue_l4_m9_4'),
('qq_l4_m9_ls3', 'itm_l4_m9_listening', 3, 'How should the chapter be organised?', '["By date","By author","By methodology","By argument"]', 3, 'cue_l4_m9_6'),
('qq_l4_m9_ls4', 'itm_l4_m9_listening', 4, 'What is the supervisor''s test of synthesis?', '["Number of citations","A reader cannot tell whose paragraph it is","Length of each section","Use of subheadings"]', 1, 'cue_l4_m9_7');

-- ---------------------------------------------------------------------
-- Module 10: Review & Consolidation
-- ---------------------------------------------------------------------
INSERT INTO audio_assets (id, kind, title, transcript, variety, speaker_count, target_wpm) VALUES
('aud_l4_m10_listen', 'listening', 'The Faculty Review Board', 'We''re considering the proposal to make the research module compulsory. Dr Vance? | The evidence is that students who took it optionally outperform those who didn''t by a clear margin. | That comparison is confounded. Students who chose it were already stronger. | Accepted. I''d still argue the module does something, but I can''t show how much from this data. | Ms Adeyemi, on the procedural side? | If we make it compulsory, we need staffing approved before we advertise it. That hasn''t been done. | So the substantive case is unproven and the procedural condition is unmet. | I''d support a pilot with random allocation. That would answer Dr Vance''s question properly. | Then that''s the recommendation. Pilot next year, decision the year after.', 'BrE', 4, 142),
('aud_l4_m10_pron', 'model_pronunciation', 'Module 10 Pronunciation Model', 'The evidence is that they outperform by a clear margin. | That comparison is confounded. | Accepted, but I can''t show how much from this data. | Then that''s the recommendation.', 'BrE', 1, 127);

INSERT INTO audio_cues (id, audio_asset_id, sequence, speaker, text) VALUES
('cue_l4_m10_1', 'aud_l4_m10_listen', 1, 'Chair', 'We''re considering the proposal to make the research module compulsory. Dr Vance?'),
('cue_l4_m10_2', 'aud_l4_m10_listen', 2, 'Vance', 'The evidence is that students who took it optionally outperform those who didn''t by a clear margin.'),
('cue_l4_m10_3', 'aud_l4_m10_listen', 3, 'Ferreira', 'That comparison is confounded. Students who chose it were already stronger.'),
('cue_l4_m10_4', 'aud_l4_m10_listen', 4, 'Vance', 'Accepted. I''d still argue the module does something, but I can''t show how much from this data.'),
('cue_l4_m10_5', 'aud_l4_m10_listen', 5, 'Chair', 'Ms Adeyemi, on the procedural side?'),
('cue_l4_m10_6', 'aud_l4_m10_listen', 6, 'Adeyemi', 'If we make it compulsory, we need staffing approved before we advertise it. That hasn''t been done.'),
('cue_l4_m10_7', 'aud_l4_m10_listen', 7, 'Chair', 'So the substantive case is unproven and the procedural condition is unmet.'),
('cue_l4_m10_8', 'aud_l4_m10_listen', 8, 'Ferreira', 'I''d support a pilot with random allocation. That would answer Dr Vance''s question properly.'),
('cue_l4_m10_9', 'aud_l4_m10_listen', 9, 'Chair', 'Then that''s the recommendation. Pilot next year, decision the year after.');

INSERT INTO learning_items (id, unit_id, sequence, kind, title, body, audio_asset_id) VALUES
('itm_l4_m10_listening', 'unt_l4_m10', 4, 'listening', 'Listening 10 — The Faculty Review Board',
'LISTENING OBJECTIVES: Integrate every Level IV listening skill; follow a formal board discussion with evidence, procedure, disagreement and decision.

BEFORE YOU LISTEN: This is the Level IV cumulative listening: a faculty board reviews a proposal, drawing on all nine modules. Read the four questions first. Knowing what you are listening for is itself the skill being taught, and it is the difference between hearing words and understanding a conversation.

LISTEN TWICE: First for the general situation only — who is speaking, where, and what they want. Do not stop to decode an unknown word; stopping is what makes learners miss the next sentence. Second time, answer the questions.

THEN: Read the synchronised transcript while listening a third time, and mark every place where what you heard and what is written surprised you. That gap is your own pronunciation target, identified by you rather than assigned to you.

SHADOWING: Record yourself speaking one full contribution, then the closing decision. Your recordings are kept attempt by attempt, so you can hear your own progress, and your instructor can reply in their own voice.', 'aud_l4_m10_listen'),
('itm_l4_m10_pronunciation', 'unt_l4_m10', 5, 'pronunciation', 'Pronunciation Lab 10 — Level IV Consolidation — Meeting Pace, Verdict Stress & Closure',
'HOW TO USE THIS LAB: For each target — listen to the model, say it aloud three times, then record yourself and listen back. Listening back is the step learners skip and the step that works: you cannot correct a sound you have not heard yourself produce.

FOCUS THIS MODULE: Everything from the level, at close-to-natural professional speed.

Your recordings are kept, so attempt one and attempt ten sit side by side. Your instructor can reply with a spoken model rather than only written notes.', 'aud_l4_m10_pron');

INSERT INTO pronunciation_targets (id, learning_item_id, sequence, focus, target, example, guidance) VALUES
('pron_l4_m10_1', 'itm_l4_m10_pronunciation', 1, 'connected_speech', 'Full professional speed with everything reduced', 'that hasn''t been done -> /ðætˈhæzntbɪnˈdʌn/; I''d still argue -> /aɪdstɪlˈɑːɡjuː/', 'Level IV closes at the pace of a real meeting. Every feature from the level appears at once, and none of it is slowed for the listener.'),
('pron_l4_m10_2', 'itm_l4_m10_pronunciation', 2, 'sentence_stress', 'Summing up stresses the two verdicts', 'The substantive case is unPROVEN and the procedural condition is unMET.', 'A chair''s summary stresses each verdict word. That is how a decision is signalled before it is stated — and how you know a meeting is about to end.'),
('pron_l4_m10_3', 'itm_l4_m10_pronunciation', 3, 'intonation', 'The decision falls flat and final', 'THEN that''s the recommenDAtion. // PIlot next year, deCISion the year after.', 'No rise, no hedge. The flat final fall is the sound of a matter being closed, and it is the same contour used from here to Level VI.');

INSERT INTO quiz_questions (id, learning_item_id, sequence, prompt, choices_json, correct_index, audio_cue_id) VALUES
('qq_l4_m10_ls1', 'itm_l4_m10_listening', 1, 'What is Vance''s evidence?', '["Student satisfaction","Optional takers outperform non-takers","Employer feedback","External benchmarking"]', 1, 'cue_l4_m10_2'),
('qq_l4_m10_ls2', 'itm_l4_m10_listening', 2, 'What is Ferreira''s objection?', '["The data is old","The sample is small","The module is too hard","The comparison is confounded"]', 3, 'cue_l4_m10_3'),
('qq_l4_m10_ls3', 'itm_l4_m10_listening', 3, 'What procedural problem does Adeyemi raise?', '["No student consultation","No room allocation","Staffing not approved before advertising","Missing paperwork"]', 2, 'cue_l4_m10_6'),
('qq_l4_m10_ls4', 'itm_l4_m10_listening', 4, 'What does the board decide?', '["Run a pilot with random allocation","Make it compulsory now","Reject the proposal","Postpone indefinitely"]', 0, 'cue_l4_m10_9');

