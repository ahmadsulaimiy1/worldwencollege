-- WEC-LC — Audio curriculum seed: Level VI (English Mastery, C2).
--
-- See sql/seed-audio-level-1.sql and docs/lms-architecture.md
-- § The audio layer. Scripts, cues, questions and targets are complete
-- authored curriculum; recordings are not — every media_url and cue
-- timing is NULL. Adding narration later is an UPDATE, not a
-- structural change.
--
-- C2 delivery is 152-158 wpm — unmodified native professional speed, with no accommodation for the listener at any point.

-- Re-sequence so the audio strand sits where the lessons assume it:
-- present -> practise -> listen -> pronounce -> test.
UPDATE learning_items SET sequence = 6 WHERE id LIKE 'itm_l6_m%_quiz';
UPDATE learning_items SET sequence = 7 WHERE id LIKE 'itm_l6_m%_assignment';
UPDATE learning_items SET sequence = 5 WHERE id = 'itm_l6_m10_examquiz';
UPDATE learning_items SET sequence = 6 WHERE id = 'itm_l6_m10_examassignment';

-- ---------------------------------------------------------------------
-- Module 1: Mastery Diagnostic & Executive Leadership
-- ---------------------------------------------------------------------
INSERT INTO audio_assets (id, kind, title, transcript, variety, speaker_count, target_wpm) VALUES
('aud_l6_m1_listen', 'listening', 'The Executive Briefing', 'I''d recommend that the committee approve the restructure this month rather than next. | Why the urgency? | Because the uncertainty is costing us people. Three senior engineers have left since June. | Some would say the restructure is what''s driving them out. | Some would, and I''ve heard it. My assessment is that it''s the ambiguity, not the direction. | I could be wrong about that. If I am, the decision was still mine and I''d own the consequence. | It''s essential that the staff hear this from you, not from a memo. | Agreed. I''ll do the all-hands myself on Thursday.', 'BrE', 2, 155),
('aud_l6_m1_pron', 'model_pronunciation', 'Module 1 Pronunciation Model', 'I''d recommend that the committee approve it. | It''s essential that the staff hear this from you. | The decision was mine. | I''d own the consequence.', 'BrE', 1, 140);

INSERT INTO audio_cues (id, audio_asset_id, sequence, speaker, text) VALUES
('cue_l6_m1_1', 'aud_l6_m1_listen', 1, 'CEO', 'I''d recommend that the committee approve the restructure this month rather than next.'),
('cue_l6_m1_2', 'aud_l6_m1_listen', 2, 'Chair', 'Why the urgency?'),
('cue_l6_m1_3', 'aud_l6_m1_listen', 3, 'CEO', 'Because the uncertainty is costing us people. Three senior engineers have left since June.'),
('cue_l6_m1_4', 'aud_l6_m1_listen', 4, 'Chair', 'Some would say the restructure is what''s driving them out.'),
('cue_l6_m1_5', 'aud_l6_m1_listen', 5, 'CEO', 'Some would, and I''ve heard it. My assessment is that it''s the ambiguity, not the direction.'),
('cue_l6_m1_6', 'aud_l6_m1_listen', 6, 'CEO', 'I could be wrong about that. If I am, the decision was still mine and I''d own the consequence.'),
('cue_l6_m1_7', 'aud_l6_m1_listen', 7, 'Chair', 'It''s essential that the staff hear this from you, not from a memo.'),
('cue_l6_m1_8', 'aud_l6_m1_listen', 8, 'CEO', 'Agreed. I''ll do the all-hands myself on Thursday.');

INSERT INTO learning_items (id, unit_id, sequence, kind, title, body, audio_asset_id) VALUES
('itm_l6_m1_listening', 'unt_l6_m1', 4, 'listening', 'Listening 1 -- The Executive Briefing',
'LISTENING OBJECTIVES: Follow executive-register communication at full speed; hear the subjunctive in use; identify where responsibility is assigned.

BEFORE YOU LISTEN: A chief executive briefs a board committee and answers a direct challenge. Read the four questions first. Knowing what you are listening for is itself the skill being taught, and it is the difference between hearing words and understanding a conversation.

LISTEN TWICE: First for the general situation only -- who is speaking, where, and what they want. Do not stop to decode an unknown word; stopping is what makes learners miss the next sentence. Second time, answer the questions.

THEN: Read the synchronised transcript while listening a third time, and mark every place where what you heard and what is written surprised you. That gap is your own pronunciation target, identified by you rather than assigned to you.

SHADOWING: Record yourself speaking the briefing''s opening and the accountability statement. Your recordings are kept attempt by attempt, so you can hear your own progress, and your instructor can reply in their own voice.', 'aud_l6_m1_listen'),
('itm_l6_m1_pronunciation', 'unt_l6_m1', 5, 'pronunciation', 'Pronunciation Lab 1 -- The Subjunctive in Speech, Ownership Stress & Holding a Position',
'HOW TO USE THIS LAB: For each target -- listen to the model, say it aloud three times, then record yourself and listen back. Listening back is the step learners skip and the step that works: you cannot correct a sound you have not heard yourself produce.

FOCUS THIS MODULE: The mandative subjunctive in natural speech, and the register of unqualified accountability.

Your recordings are kept, so attempt one and attempt ten sit side by side. Your instructor can reply with a spoken model rather than only written notes.', 'aud_l6_m1_pron');

INSERT INTO pronunciation_targets (id, learning_item_id, sequence, focus, target, example, guidance) VALUES
('pron_l6_m1_1', 'itm_l6_m1_pronunciation', 1, 'word_stress', 'Mandative subjunctive: the bare verb, unstressed but present', 'I''d recommend that the committee APPROVE... // It''s essential that the staff HEAR this.', 'The subjunctive verb takes no -s and no auxiliary. In fast speech the absence is easy to miss, and mishearing it as an indicative flattens a recommendation into a description.'),
('pron_l6_m1_2', 'itm_l6_m1_pronunciation', 2, 'sentence_stress', 'Accountability stresses the possessive and the modal', 'The decision was still MINE and I''D OWN the consequence.', 'Unqualified ownership is marked by stress on mine and would. This is the executive register the whole level opens with.'),
('pron_l6_m1_3', 'itm_l6_m1_pronunciation', 3, 'intonation', 'Acknowledging criticism without conceding it', 'SOME would, and I''ve HEARD it. // My asSESSment is that it''s the amBIGuity.', 'The acknowledgement rises; the counter-assessment falls. Neither dismisses nor accepts -- this contour is how senior speakers hold a position under challenge.');

INSERT INTO quiz_questions (id, learning_item_id, sequence, prompt, choices_json, correct_index, audio_cue_id) VALUES
('qq_l6_m1_ls1', 'itm_l6_m1_listening', 1, 'What does the CEO recommend?', '["Delaying the restructure","Cancelling it","Approving it this month","Consulting staff first"]', 2, 'cue_l6_m1_1'),
('qq_l6_m1_ls2', 'itm_l6_m1_listening', 2, 'What evidence is given for urgency?', '["Three senior engineers have left since June","Falling revenue","Competitor activity","Board pressure"]', 0, 'cue_l6_m1_3'),
('qq_l6_m1_ls3', 'itm_l6_m1_listening', 3, 'What is the CEO''s assessment of the cause?', '["The restructure itself","Pay levels","Management quality","The ambiguity, not the direction"]', 3, 'cue_l6_m1_5'),
('qq_l6_m1_ls4', 'itm_l6_m1_listening', 4, 'What does the chair insist on?', '["A written memo","Staff hearing it from the CEO directly","A delay","External advice"]', 1, 'cue_l6_m1_7');

-- ---------------------------------------------------------------------
-- Module 2: Diplomacy & International Relations
-- ---------------------------------------------------------------------
INSERT INTO audio_assets (id, kind, title, transcript, variety, speaker_count, target_wpm) VALUES
('aud_l6_m2_listen', 'listening', 'The Communiqué Negotiation', 'My delegation would find it difficult to accept the current paragraph four. | It would not be unhelpful to know which part. | The word ''immediate''. We are not in a position to commit to a timetable. | Would ''without undue delay'' be more comfortable? | It would be considerably more comfortable. | Then may I suggest we set aside the adjective and ask what each of us needs the paragraph to achieve? | We need to avoid a binding date before our own review concludes. | And we need to be able to show movement. Those are not incompatible. | No. They are not.', 'BrE', 2, 152),
('aud_l6_m2_pron', 'model_pronunciation', 'Module 2 Pronunciation Model', 'My delegation would find it difficult to accept. | It would not be unhelpful to know which part. | We are not in a position to commit. | What does each of us need the paragraph to achieve?', 'BrE', 1, 137);

INSERT INTO audio_cues (id, audio_asset_id, sequence, speaker, text) VALUES
('cue_l6_m2_1', 'aud_l6_m2_listen', 1, 'Delegate A', 'My delegation would find it difficult to accept the current paragraph four.'),
('cue_l6_m2_2', 'aud_l6_m2_listen', 2, 'Delegate B', 'It would not be unhelpful to know which part.'),
('cue_l6_m2_3', 'aud_l6_m2_listen', 3, 'Delegate A', 'The word ''immediate''. We are not in a position to commit to a timetable.'),
('cue_l6_m2_4', 'aud_l6_m2_listen', 4, 'Delegate B', 'Would ''without undue delay'' be more comfortable?'),
('cue_l6_m2_5', 'aud_l6_m2_listen', 5, 'Delegate A', 'It would be considerably more comfortable.'),
('cue_l6_m2_6', 'aud_l6_m2_listen', 6, 'Delegate B', 'Then may I suggest we set aside the adjective and ask what each of us needs the paragraph to achieve?'),
('cue_l6_m2_7', 'aud_l6_m2_listen', 7, 'Delegate A', 'We need to avoid a binding date before our own review concludes.'),
('cue_l6_m2_8', 'aud_l6_m2_listen', 8, 'Delegate B', 'And we need to be able to show movement. Those are not incompatible.'),
('cue_l6_m2_9', 'aud_l6_m2_listen', 9, 'Delegate A', 'No. They are not.');

INSERT INTO learning_items (id, unit_id, sequence, kind, title, body, audio_asset_id) VALUES
('itm_l6_m2_listening', 'unt_l6_m2', 4, 'listening', 'Listening 2 -- The Communiqué Negotiation',
'LISTENING OBJECTIVES: Follow diplomatic negotiation; decode litotes and impersonal constructions; distinguish position from interest.

BEFORE YOU LISTEN: Two delegates negotiate the wording of a joint statement. Read the four questions first. Knowing what you are listening for is itself the skill being taught, and it is the difference between hearing words and understanding a conversation.

LISTEN TWICE: First for the general situation only -- who is speaking, where, and what they want. Do not stop to decode an unknown word; stopping is what makes learners miss the next sentence. Second time, answer the questions.

THEN: Read the synchronised transcript while listening a third time, and mark every place where what you heard and what is written surprised you. That gap is your own pronunciation target, identified by you rather than assigned to you.

SHADOWING: Record yourself speaking the litotes exchange and the reframing to interests. Your recordings are kept attempt by attempt, so you can hear your own progress, and your instructor can reply in their own voice.', 'aud_l6_m2_listen'),
('itm_l6_m2_pronunciation', 'unt_l6_m2', 5, 'pronunciation', 'Pronunciation Lab 2 -- Litotes Delivery, Degree Adverbs & Impersonal Formulas',
'HOW TO USE THIS LAB: For each target -- listen to the model, say it aloud three times, then record yourself and listen back. Listening back is the step learners skip and the step that works: you cannot correct a sound you have not heard yourself produce.

FOCUS THIS MODULE: Litotes and impersonal constructions -- understatement as a precision instrument.

Your recordings are kept, so attempt one and attempt ten sit side by side. Your instructor can reply with a spoken model rather than only written notes.', 'aud_l6_m2_pron');

INSERT INTO pronunciation_targets (id, learning_item_id, sequence, focus, target, example, guidance) VALUES
('pron_l6_m2_1', 'itm_l6_m2_pronunciation', 1, 'intonation', 'Litotes is delivered level and unhurried', 'It would NOT be unHELPful to know which part.', 'Double negation said with any emphasis becomes sarcasm. Level, slow delivery is what makes it read as courteous precision -- the whole point of the form.'),
('pron_l6_m2_2', 'itm_l6_m2_pronunciation', 2, 'sentence_stress', 'Comparatives carry the concession''s size', 'It would be conSIDerably more COMfortable.', 'In diplomatic register the degree adverb is the message. Considerably versus somewhat is the difference between agreement and a further round of talks.'),
('pron_l6_m2_3', 'itm_l6_m2_pronunciation', 3, 'connected_speech', 'Impersonal formulas compress into single units', 'would find it difficult to -> /wədˈfaɪndɪtˈdɪfɪkəltə/; may I suggest -> /meɪaɪsəˈdʒest/', 'These constructions remove the person from the objection. They are formulaic and fast, and hearing them as units rather than words is essential at this speed.');

INSERT INTO quiz_questions (id, learning_item_id, sequence, prompt, choices_json, correct_index, audio_cue_id) VALUES
('qq_l6_m2_ls1', 'itm_l6_m2_listening', 1, 'What does Delegate A object to?', '["The whole statement","The word ''immediate'' in paragraph four","The signing date","The venue"]', 1, 'cue_l6_m2_3'),
('qq_l6_m2_ls2', 'itm_l6_m2_listening', 2, 'What alternative wording is proposed?', '["''As soon as possible''","''In due course''","''Promptly''","''Without undue delay''"]', 3, 'cue_l6_m2_4'),
('qq_l6_m2_ls3', 'itm_l6_m2_listening', 3, 'What does Delegate A actually need?', '["A stronger commitment","More time to translate","To avoid a binding date before their review concludes","A different chair"]', 2, 'cue_l6_m2_7'),
('qq_l6_m2_ls4', 'itm_l6_m2_listening', 4, 'What does Delegate B need?', '["To be able to show movement","A binding date","A public signing","Nothing specific"]', 0, 'cue_l6_m2_8');

-- ---------------------------------------------------------------------
-- Module 3: Global Business Strategy
-- ---------------------------------------------------------------------
INSERT INTO audio_assets (id, kind, title, transcript, variety, speaker_count, target_wpm) VALUES
('aud_l6_m3_listen', 'listening', 'The Board Challenges the Assumption', 'Three facts. Volume is down eleven per cent. Our price is unchanged. Competitor price fell nine per cent. | My inference is that we are losing volume to price, not to product. | My recommendation is a targeted discount in two segments, not across the board. | What would have to be true for that inference to be wrong? | That the lost customers were leaving for features rather than cost. I''ve tested it: exit interviews say cost. | Sample size? | Forty-one. Small. I''d call it indicative, not conclusive. | Central to my concern is that a discount is very hard to reverse. | Agreed. That''s why I''ve proposed it in two segments and for six months only.', 'BrE', 2, 155),
('aud_l6_m3_pron', 'model_pronunciation', 'Module 3 Pronunciation Model', 'Volume is down eleven per cent. | My inference is that we are losing volume to price. | What would have to be true for that to be wrong? | Indicative, not conclusive.', 'BrE', 1, 140);

INSERT INTO audio_cues (id, audio_asset_id, sequence, speaker, text) VALUES
('cue_l6_m3_1', 'aud_l6_m3_listen', 1, 'Director', 'Three facts. Volume is down eleven per cent. Our price is unchanged. Competitor price fell nine per cent.'),
('cue_l6_m3_2', 'aud_l6_m3_listen', 2, 'Director', 'My inference is that we are losing volume to price, not to product.'),
('cue_l6_m3_3', 'aud_l6_m3_listen', 3, 'Director', 'My recommendation is a targeted discount in two segments, not across the board.'),
('cue_l6_m3_4', 'aud_l6_m3_listen', 4, 'Board member', 'What would have to be true for that inference to be wrong?'),
('cue_l6_m3_5', 'aud_l6_m3_listen', 5, 'Director', 'That the lost customers were leaving for features rather than cost. I''ve tested it: exit interviews say cost.'),
('cue_l6_m3_6', 'aud_l6_m3_listen', 6, 'Board member', 'Sample size?'),
('cue_l6_m3_7', 'aud_l6_m3_listen', 7, 'Director', 'Forty-one. Small. I''d call it indicative, not conclusive.'),
('cue_l6_m3_8', 'aud_l6_m3_listen', 8, 'Board member', 'Central to my concern is that a discount is very hard to reverse.'),
('cue_l6_m3_9', 'aud_l6_m3_listen', 9, 'Director', 'Agreed. That''s why I''ve proposed it in two segments and for six months only.');

INSERT INTO learning_items (id, unit_id, sequence, kind, title, body, audio_asset_id) VALUES
('itm_l6_m3_listening', 'unt_l6_m3', 4, 'listening', 'Listening 3 -- The Board Challenges the Assumption',
'LISTENING OBJECTIVES: Follow strategic reasoning at board level; separate evidence, inference and recommendation; hear an assumption stated in falsifiable terms.

BEFORE YOU LISTEN: A strategy director presents and the board challenges the assumption rather than the conclusion. Read the four questions first. Knowing what you are listening for is itself the skill being taught, and it is the difference between hearing words and understanding a conversation.

LISTEN TWICE: First for the general situation only -- who is speaking, where, and what they want. Do not stop to decode an unknown word; stopping is what makes learners miss the next sentence. Second time, answer the questions.

THEN: Read the synchronised transcript while listening a third time, and mark every place where what you heard and what is written surprised you. That gap is your own pronunciation target, identified by you rather than assigned to you.

SHADOWING: Record yourself speaking the statement of the working assumption. Your recordings are kept attempt by attempt, so you can hear your own progress, and your instructor can reply in their own voice.', 'aud_l6_m3_listen'),
('itm_l6_m3_pronunciation', 'unt_l6_m3', 5, 'pronunciation', 'Pronunciation Lab 3 -- Three-Layer Rhythm, Falsifiability Stress & Fronted Complements',
'HOW TO USE THIS LAB: For each target -- listen to the model, say it aloud three times, then record yourself and listen back. Listening back is the step learners skip and the step that works: you cannot correct a sound you have not heard yourself produce.

FOCUS THIS MODULE: The three-layer discipline made audible: evidence, inference, recommendation.

Your recordings are kept, so attempt one and attempt ten sit side by side. Your instructor can reply with a spoken model rather than only written notes.', 'aud_l6_m3_pron');

INSERT INTO pronunciation_targets (id, learning_item_id, sequence, focus, target, example, guidance) VALUES
('pron_l6_m3_1', 'itm_l6_m3_pronunciation', 1, 'rhythm', 'The three layers take three distinct rhythmic blocks', 'THREE FACTS... // My INference is... // My recommenDAtion is...', 'Separating the layers rhythmically is what allows a board to challenge one without rejecting the others. Collapsing them is the characteristic failure of the genre.'),
('pron_l6_m3_2', 'itm_l6_m3_pronunciation', 2, 'sentence_stress', 'Falsifiability stresses the condition', 'What would have to be TRUE for that inference to be WRONG?', 'The stress on true and wrong marks this as a test rather than a rhetorical challenge. It is the module''s central technique, and it is a question that expects an answer.'),
('pron_l6_m3_3', 'itm_l6_m3_pronunciation', 3, 'word_stress', 'Fronted complements with inversion', 'CENtral to my concern IS that a discount is hard to reVERSE.', 'Fronting places the evaluation first and delays the subject. The heavy stress on the fronted element is what makes the inversion sound deliberate rather than awkward.');

INSERT INTO quiz_questions (id, learning_item_id, sequence, prompt, choices_json, correct_index, audio_cue_id) VALUES
('qq_l6_m3_ls1', 'itm_l6_m3_listening', 1, 'What are the three facts presented?', '["Volume, price, competitor price","Revenue, cost, margin","Volume, staff, cost","Price, product, place"]', 0, 'cue_l6_m3_1'),
('qq_l6_m3_ls2', 'itm_l6_m3_listening', 2, 'What is the director''s inference?', '["Losing volume to product","Gaining share","Losing volume to price","Market is shrinking"]', 2, 'cue_l6_m3_2'),
('qq_l6_m3_ls3', 'itm_l6_m3_listening', 3, 'What would make the inference wrong?', '["Competitor price rising","Customers leaving for features rather than cost","A larger sample","Regulatory change"]', 1, 'cue_l6_m3_5'),
('qq_l6_m3_ls4', 'itm_l6_m3_listening', 4, 'How does the director characterise the evidence?', '["Conclusive","Irrelevant","Definitive","Indicative, not conclusive"]', 3, 'cue_l6_m3_7');

-- ---------------------------------------------------------------------
-- Module 4: Public Policy
-- ---------------------------------------------------------------------
INSERT INTO audio_assets (id, kind, title, transcript, variety, speaker_count, target_wpm) VALUES
('aud_l6_m4_listen', 'listening', 'Shall, Must and May', 'Clause seven says the authority may require an inspection. Is that what we intend? | We intended must. May confers discretion. | Then it will be read as optional, and it will be litigated within a year. | Agreed. But if we write must, we create a duty we cannot resource. | Then the honest options are: must, with funding; may, with published criteria for when it is exercised; or shall, within a stated period. | Assessed against enforceability, the second is weakest. | Assessed against deliverability, the first is. | Then it is a resourcing decision dressed as a drafting decision, and it should go to ministers as such.', 'BrE', 2, 152),
('aud_l6_m4_pron', 'model_pronunciation', 'Module 4 Pronunciation Model', 'The authority may require an inspection. | May confers discretion. | Assessed against enforceability, the second is weakest. | It should go to ministers as such.', 'BrE', 1, 137);

INSERT INTO audio_cues (id, audio_asset_id, sequence, speaker, text) VALUES
('cue_l6_m4_1', 'aud_l6_m4_listen', 1, 'Official A', 'Clause seven says the authority may require an inspection. Is that what we intend?'),
('cue_l6_m4_2', 'aud_l6_m4_listen', 2, 'Official B', 'We intended must. May confers discretion.'),
('cue_l6_m4_3', 'aud_l6_m4_listen', 3, 'Official A', 'Then it will be read as optional, and it will be litigated within a year.'),
('cue_l6_m4_4', 'aud_l6_m4_listen', 4, 'Official B', 'Agreed. But if we write must, we create a duty we cannot resource.'),
('cue_l6_m4_5', 'aud_l6_m4_listen', 5, 'Official A', 'Then the honest options are: must, with funding; may, with published criteria for when it is exercised; or shall, within a stated period.'),
('cue_l6_m4_6', 'aud_l6_m4_listen', 6, 'Official B', 'Assessed against enforceability, the second is weakest.'),
('cue_l6_m4_7', 'aud_l6_m4_listen', 7, 'Official A', 'Assessed against deliverability, the first is.'),
('cue_l6_m4_8', 'aud_l6_m4_listen', 8, 'Official B', 'Then it is a resourcing decision dressed as a drafting decision, and it should go to ministers as such.');

INSERT INTO learning_items (id, unit_id, sequence, kind, title, body, audio_asset_id) VALUES
('itm_l6_m4_listening', 'unt_l6_m4', 4, 'listening', 'Listening 4 -- Shall, Must and May',
'LISTENING OBJECTIVES: Follow policy drafting discussion; distinguish the operative force of modals; hear criterion-based appraisal.

BEFORE YOU LISTEN: Two officials review draft regulations and argue about a single word. Read the four questions first. Knowing what you are listening for is itself the skill being taught, and it is the difference between hearing words and understanding a conversation.

LISTEN TWICE: First for the general situation only -- who is speaking, where, and what they want. Do not stop to decode an unknown word; stopping is what makes learners miss the next sentence. Second time, answer the questions.

THEN: Read the synchronised transcript while listening a third time, and mark every place where what you heard and what is written surprised you. That gap is your own pronunciation target, identified by you rather than assigned to you.

SHADOWING: Record yourself speaking the exchange about may and must. Your recordings are kept attempt by attempt, so you can hear your own progress, and your instructor can reply in their own voice.', 'aud_l6_m4_listen'),
('itm_l6_m4_pronunciation', 'unt_l6_m4', 5, 'pronunciation', 'Pronunciation Lab 4 -- Operative Modal Stress, Enumerated Options & Criterion Framing',
'HOW TO USE THIS LAB: For each target -- listen to the model, say it aloud three times, then record yourself and listen back. Listening back is the step learners skip and the step that works: you cannot correct a sound you have not heard yourself produce.

FOCUS THIS MODULE: The operative modals, where one unstressed word decides whether a provision binds.

Your recordings are kept, so attempt one and attempt ten sit side by side. Your instructor can reply with a spoken model rather than only written notes.', 'aud_l6_m4_pron');

INSERT INTO pronunciation_targets (id, learning_item_id, sequence, focus, target, example, guidance) VALUES
('pron_l6_m4_1', 'itm_l6_m4_pronunciation', 1, 'word_stress', 'Operative modals are stressed when contrasted', 'We intended MUST. MAY confers discretion.', 'These words are normally unstressed function words. In drafting discussion they become the content, and the stress shift signals that the argument is about the word itself.'),
('pron_l6_m4_2', 'itm_l6_m4_pronunciation', 2, 'rhythm', 'Enumerated options take equal weight', 'MUST with funding, // MAY with published criteria, // or SHALL within a stated period.', 'Three options in equal rhythmic blocks. Uneven delivery signals a preference the speaker may not intend to reveal.'),
('pron_l6_m4_3', 'itm_l6_m4_pronunciation', 3, 'sentence_stress', 'Criterion framing stresses the criterion', 'AsSESSed against ENFORCEability, the second is WEAKest.', 'Naming the criterion before the verdict is the module''s discipline, and stressing it is how a listener knows a new criterion has been introduced.');

INSERT INTO quiz_questions (id, learning_item_id, sequence, prompt, choices_json, correct_index, audio_cue_id) VALUES
('qq_l6_m4_ls1', 'itm_l6_m4_listening', 1, 'What does clause seven currently say?', '["The authority may require an inspection","The authority must require an inspection","The authority shall inspect","Inspections are prohibited"]', 0, 'cue_l6_m4_1'),
('qq_l6_m4_ls2', 'itm_l6_m4_listening', 2, 'What does ''may'' confer?', '["An obligation","A prohibition","Discretion","A deadline"]', 2, 'cue_l6_m4_2'),
('qq_l6_m4_ls3', 'itm_l6_m4_listening', 3, 'Why is ''must'' problematic?', '["It is unclear","It creates a duty they cannot resource","It is old-fashioned","It requires ministerial approval"]', 1, 'cue_l6_m4_4'),
('qq_l6_m4_ls4', 'itm_l6_m4_listening', 4, 'What do the officials conclude the decision really is?', '["A drafting decision","A legal decision","A political decision only","A resourcing decision dressed as a drafting decision"]', 3, 'cue_l6_m4_8');

-- ---------------------------------------------------------------------
-- Module 5: Law & Justice
-- ---------------------------------------------------------------------
INSERT INTO audio_assets (id, kind, title, transcript, variety, speaker_count, target_wpm) VALUES
('aud_l6_m5_listen', 'listening', 'Notwithstanding and Subject To', 'Two phrases students confuse constantly. Subject to, and notwithstanding. | ''Subject to section nine'' means section nine wins. Your clause yields. | ''Notwithstanding section nine'' means your clause wins. Section nine yields. | They are opposites, and a drafting error between them reverses the provision entirely. | Now, critique. Take the strongest version of the opposing argument first. | The best case for the defendant is that the notice period was ambiguous and they acted in good faith. | That is a serious argument. My disagreement is not with the premise but with the scope. | Good faith excuses the delay. It does not excuse the failure to notify at all.', 'BrE', 1, 152),
('aud_l6_m5_pron', 'model_pronunciation', 'Module 5 Pronunciation Model', 'Subject to section nine, this clause applies. | Notwithstanding section nine, this clause applies. | The best case for the defendant is... | Not with the premise but with the scope.', 'BrE', 1, 137);

INSERT INTO audio_cues (id, audio_asset_id, sequence, speaker, text) VALUES
('cue_l6_m5_1', 'aud_l6_m5_listen', 1, 'Lecturer', 'Two phrases students confuse constantly. Subject to, and notwithstanding.'),
('cue_l6_m5_2', 'aud_l6_m5_listen', 2, 'Lecturer', '''Subject to section nine'' means section nine wins. Your clause yields.'),
('cue_l6_m5_3', 'aud_l6_m5_listen', 3, 'Lecturer', '''Notwithstanding section nine'' means your clause wins. Section nine yields.'),
('cue_l6_m5_4', 'aud_l6_m5_listen', 4, 'Lecturer', 'They are opposites, and a drafting error between them reverses the provision entirely.'),
('cue_l6_m5_5', 'aud_l6_m5_listen', 5, 'Lecturer', 'Now, critique. Take the strongest version of the opposing argument first.'),
('cue_l6_m5_6', 'aud_l6_m5_listen', 6, 'Lecturer', 'The best case for the defendant is that the notice period was ambiguous and they acted in good faith.'),
('cue_l6_m5_7', 'aud_l6_m5_listen', 7, 'Lecturer', 'That is a serious argument. My disagreement is not with the premise but with the scope.'),
('cue_l6_m5_8', 'aud_l6_m5_listen', 8, 'Lecturer', 'Good faith excuses the delay. It does not excuse the failure to notify at all.');

INSERT INTO learning_items (id, unit_id, sequence, kind, title, body, audio_asset_id) VALUES
('itm_l6_m5_listening', 'unt_l6_m5', 4, 'listening', 'Listening 5 -- Notwithstanding and Subject To',
'LISTENING OBJECTIVES: Follow legal reasoning; distinguish overriding from subordinating provisions; hear a steelman before a critique.

BEFORE YOU LISTEN: A lecturer explains two operators that are opposites in effect, then models a critique. Read the four questions first. Knowing what you are listening for is itself the skill being taught, and it is the difference between hearing words and understanding a conversation.

LISTEN TWICE: First for the general situation only -- who is speaking, where, and what they want. Do not stop to decode an unknown word; stopping is what makes learners miss the next sentence. Second time, answer the questions.

THEN: Read the synchronised transcript while listening a third time, and mark every place where what you heard and what is written surprised you. That gap is your own pronunciation target, identified by you rather than assigned to you.

SHADOWING: Record yourself speaking the steelman, then the located disagreement. Your recordings are kept attempt by attempt, so you can hear your own progress, and your instructor can reply in their own voice.', 'aud_l6_m5_listen'),
('itm_l6_m5_pronunciation', 'unt_l6_m5', 5, 'pronunciation', 'Pronunciation Lab 5 -- Opposed Operators, Warm Steelmanning & Locating Disagreement',
'HOW TO USE THIS LAB: For each target -- listen to the model, say it aloud three times, then record yourself and listen back. Listening back is the step learners skip and the step that works: you cannot correct a sound you have not heard yourself produce.

FOCUS THIS MODULE: Two phrases that reverse each other, and the stress that separates them.

Your recordings are kept, so attempt one and attempt ten sit side by side. Your instructor can reply with a spoken model rather than only written notes.', 'aud_l6_m5_pron');

INSERT INTO pronunciation_targets (id, learning_item_id, sequence, focus, target, example, guidance) VALUES
('pron_l6_m5_1', 'itm_l6_m5_pronunciation', 1, 'sentence_stress', 'The two operators are stressed against each other', 'SUBject to section nine means section NINE wins. NOTwithSTANDing section nine means YOUR clause wins.', 'Two long phrases distinguished by heavy stress on the operator and on the winner. This parallel structure is how the distinction is taught and how it is remembered.'),
('pron_l6_m5_2', 'itm_l6_m5_pronunciation', 2, 'intonation', 'The steelman is delivered with genuine warmth', 'The BEST case for the defendant is that the notice period was amBIGuous...', 'A steelman said flatly sounds like a formality. Delivering it as though you believe it is what makes the subsequent critique credible.'),
('pron_l6_m5_3', 'itm_l6_m5_pronunciation', 3, 'word_stress', 'Locating disagreement stresses the level', 'My disagreement is not with the PREMise but with the SCOPE.', 'Naming premise, warrant, inference or scope, with stress on the chosen term, is the module''s analytical instrument made audible.');

INSERT INTO quiz_questions (id, learning_item_id, sequence, prompt, choices_json, correct_index, audio_cue_id) VALUES
('qq_l6_m5_ls1', 'itm_l6_m5_listening', 1, 'What does ''subject to section nine'' mean?', '["Your clause overrides section nine","Both apply equally","Section nine overrides your clause","Section nine is repealed"]', 2, 'cue_l6_m5_2'),
('qq_l6_m5_ls2', 'itm_l6_m5_listening', 2, 'What does ''notwithstanding section nine'' mean?', '["Your clause wins","Section nine wins","Neither applies","They must be read together"]', 0, 'cue_l6_m5_3'),
('qq_l6_m5_ls3', 'itm_l6_m5_listening', 3, 'What is the strongest case for the defendant?', '["The notice was never sent","The section does not apply","The claimant delayed","The notice period was ambiguous and they acted in good faith"]', 3, 'cue_l6_m5_6'),
('qq_l6_m5_ls4', 'itm_l6_m5_listening', 4, 'Where does the lecturer locate the disagreement?', '["The premise","The scope","The evidence","The procedure"]', 1, 'cue_l6_m5_7');

-- ---------------------------------------------------------------------
-- Module 6: Innovation & Emerging Technologies
-- ---------------------------------------------------------------------
INSERT INTO audio_assets (id, kind, title, transcript, variety, speaker_count, target_wpm) VALUES
('aud_l6_m6_listen', 'listening', 'Were This to Succeed', 'Were this approach to work, it would reduce screening time from weeks to hours. | And should it not work? | Then we will have established that the binding assumption is false, which is itself publishable. | What is your principal risk? | The reagent supply. There is one manufacturer, and had they raised prices last year as expected, this proposal would not exist. | You''re disclosing that rather than burying it. | Because you would find it, and because a proposal claiming no risk tells you the applicant hasn''t looked. | What would have to be true for the timeline to hold? | Two things: reagent supply stable for eighteen months, and ethics approval by March.', 'BrE', 2, 155),
('aud_l6_m6_pron', 'model_pronunciation', 'Module 6 Pronunciation Model', 'Were this approach to work... | Should it not work, we will have learned something. | Had they raised prices, this proposal would not exist. | What would have to be true for the timeline to hold?', 'BrE', 1, 140);

INSERT INTO audio_cues (id, audio_asset_id, sequence, speaker, text) VALUES
('cue_l6_m6_1', 'aud_l6_m6_listen', 1, 'Researcher', 'Were this approach to work, it would reduce screening time from weeks to hours.'),
('cue_l6_m6_2', 'aud_l6_m6_listen', 2, 'Panel', 'And should it not work?'),
('cue_l6_m6_3', 'aud_l6_m6_listen', 3, 'Researcher', 'Then we will have established that the binding assumption is false, which is itself publishable.'),
('cue_l6_m6_4', 'aud_l6_m6_listen', 4, 'Panel', 'What is your principal risk?'),
('cue_l6_m6_5', 'aud_l6_m6_listen', 5, 'Researcher', 'The reagent supply. There is one manufacturer, and had they raised prices last year as expected, this proposal would not exist.'),
('cue_l6_m6_6', 'aud_l6_m6_listen', 6, 'Panel', 'You''re disclosing that rather than burying it.'),
('cue_l6_m6_7', 'aud_l6_m6_listen', 7, 'Researcher', 'Because you would find it, and because a proposal claiming no risk tells you the applicant hasn''t looked.'),
('cue_l6_m6_8', 'aud_l6_m6_listen', 8, 'Panel', 'What would have to be true for the timeline to hold?'),
('cue_l6_m6_9', 'aud_l6_m6_listen', 9, 'Researcher', 'Two things: reagent supply stable for eighteen months, and ethics approval by March.');

INSERT INTO learning_items (id, unit_id, sequence, kind, title, body, audio_asset_id) VALUES
('itm_l6_m6_listening', 'unt_l6_m6', 4, 'listening', 'Listening 6 -- Were This to Succeed',
'LISTENING OBJECTIVES: Follow speculative technical register; hear inverted conditionals; distinguish disclosed risk from concealed risk.

BEFORE YOU LISTEN: A researcher presents a funding proposal and is questioned on risk. Read the four questions first. Knowing what you are listening for is itself the skill being taught, and it is the difference between hearing words and understanding a conversation.

LISTEN TWICE: First for the general situation only -- who is speaking, where, and what they want. Do not stop to decode an unknown word; stopping is what makes learners miss the next sentence. Second time, answer the questions.

THEN: Read the synchronised transcript while listening a third time, and mark every place where what you heard and what is written surprised you. That gap is your own pronunciation target, identified by you rather than assigned to you.

SHADOWING: Record yourself speaking the inverted conditionals and the risk disclosure. Your recordings are kept attempt by attempt, so you can hear your own progress, and your instructor can reply in their own voice.', 'aud_l6_m6_listen'),
('itm_l6_m6_pronunciation', 'unt_l6_m6', 5, 'pronunciation', 'Pronunciation Lab 6 -- Fronted Auxiliaries, Unapologetic Disclosure & Enumerated Conditions',
'HOW TO USE THIS LAB: For each target -- listen to the model, say it aloud three times, then record yourself and listen back. Listening back is the step learners skip and the step that works: you cannot correct a sound you have not heard yourself produce.

FOCUS THIS MODULE: Inverted conditionals with ''if'' omitted, and the register of honest risk.

Your recordings are kept, so attempt one and attempt ten sit side by side. Your instructor can reply with a spoken model rather than only written notes.', 'aud_l6_m6_pron');

INSERT INTO pronunciation_targets (id, learning_item_id, sequence, focus, target, example, guidance) VALUES
('pron_l6_m6_1', 'itm_l6_m6_pronunciation', 1, 'word_stress', 'Inverted conditionals stress the fronted auxiliary', 'WERE this approach to work... // SHOULD it not work... // HAD they raised prices...', 'With if omitted, the auxiliary carries the conditional meaning and takes the stress. Unstressed, the clause is heard as a statement and the conditionality is lost.'),
('pron_l6_m6_2', 'itm_l6_m6_pronunciation', 2, 'intonation', 'Honest risk disclosure is level and unapologetic', 'The reAGent supply. There is ONE manufacturer.', 'Hedging or trailing off signals the speaker is uncomfortable. Flat, factual delivery is what makes disclosed risk read as competence rather than weakness.'),
('pron_l6_m6_3', 'itm_l6_m6_pronunciation', 3, 'rhythm', 'Enumerated conditions land in equal blocks', 'TWO things: // reagent supply stable for eighteen MONTHS, // and ethics approval by MARCH.', 'Announcing the count then delivering equal blocks lets a panel record both without asking for repetition.');

INSERT INTO quiz_questions (id, learning_item_id, sequence, prompt, choices_json, correct_index, audio_cue_id) VALUES
('qq_l6_m6_ls1', 'itm_l6_m6_listening', 1, 'What would the approach achieve if it worked?', '["Halve costs","Double accuracy","Reduce screening from weeks to hours","Replace existing methods entirely"]', 2, 'cue_l6_m6_1'),
('qq_l6_m6_ls2', 'itm_l6_m6_listening', 2, 'What does the researcher say happens if it fails?', '["They will have shown the binding assumption is false, which is publishable","The funding is wasted","The project restarts","Nothing useful"]', 0, 'cue_l6_m6_3'),
('qq_l6_m6_ls3', 'itm_l6_m6_listening', 3, 'What is the principal risk?', '["Staffing","Ethics approval","Equipment failure","Reagent supply from a single manufacturer"]', 3, 'cue_l6_m6_5'),
('qq_l6_m6_ls4', 'itm_l6_m6_listening', 4, 'Why does the researcher disclose the risk?', '["It is required","The panel would find it, and claiming no risk signals the applicant has not looked","To reduce the budget","A supervisor advised it"]', 1, 'cue_l6_m6_7');

-- ---------------------------------------------------------------------
-- Module 7: Media & Public Communication
-- ---------------------------------------------------------------------
INSERT INTO audio_assets (id, kind, title, transcript, variety, speaker_count, target_wpm) VALUES
('aud_l6_m7_listen', 'listening', 'The Interview That Turned', 'You''ve known about this fault for two years and done nothing. | Let me correct the premise. We''ve known for eleven months, and we issued a recall in the third month. | A recall that reached a fraction of customers. | That''s true, and it''s the part I''d defend least. Our contact data was poor. | So you failed. | On reaching customers, yes. On identifying the fault and acting, no. I''d rather be judged on both than on either. | What changes? | Three things: verified contact details at point of sale, a public register of open faults, and I''ve asked for the recall process to be audited externally. | And if the audit criticises you personally? | Then it will say so publicly, because I''ve asked for it to be published unedited.', 'BrE', 2, 155),
('aud_l6_m7_pron', 'model_pronunciation', 'Module 7 Pronunciation Model', 'Let me correct the premise. | That''s the part I''d defend least. | On reaching customers, yes. On acting, no. | I''ve asked for it to be published unedited.', 'BrE', 1, 140);

INSERT INTO audio_cues (id, audio_asset_id, sequence, speaker, text) VALUES
('cue_l6_m7_1', 'aud_l6_m7_listen', 1, 'Interviewer', 'You''ve known about this fault for two years and done nothing.'),
('cue_l6_m7_2', 'aud_l6_m7_listen', 2, 'CEO', 'Let me correct the premise. We''ve known for eleven months, and we issued a recall in the third month.'),
('cue_l6_m7_3', 'aud_l6_m7_listen', 3, 'Interviewer', 'A recall that reached a fraction of customers.'),
('cue_l6_m7_4', 'aud_l6_m7_listen', 4, 'CEO', 'That''s true, and it''s the part I''d defend least. Our contact data was poor.'),
('cue_l6_m7_5', 'aud_l6_m7_listen', 5, 'Interviewer', 'So you failed.'),
('cue_l6_m7_6', 'aud_l6_m7_listen', 6, 'CEO', 'On reaching customers, yes. On identifying the fault and acting, no. I''d rather be judged on both than on either.'),
('cue_l6_m7_7', 'aud_l6_m7_listen', 7, 'Interviewer', 'What changes?'),
('cue_l6_m7_8', 'aud_l6_m7_listen', 8, 'CEO', 'Three things: verified contact details at point of sale, a public register of open faults, and I''ve asked for the recall process to be audited externally.'),
('cue_l6_m7_9', 'aud_l6_m7_listen', 9, 'Interviewer', 'And if the audit criticises you personally?'),
('cue_l6_m7_10', 'aud_l6_m7_listen', 10, 'CEO', 'Then it will say so publicly, because I''ve asked for it to be published unedited.');

INSERT INTO learning_items (id, unit_id, sequence, kind, title, body, audio_asset_id) VALUES
('itm_l6_m7_listening', 'unt_l6_m7', 4, 'listening', 'Listening 7 -- The Interview That Turned',
'LISTENING OBJECTIVES: Follow hostile broadcast questioning; distinguish premise correction from evasion; hear rhetorical devices used sparingly.

BEFORE YOU LISTEN: A chief executive is interviewed after a product failure. Read the four questions first. Knowing what you are listening for is itself the skill being taught, and it is the difference between hearing words and understanding a conversation.

LISTEN TWICE: First for the general situation only -- who is speaking, where, and what they want. Do not stop to decode an unknown word; stopping is what makes learners miss the next sentence. Second time, answer the questions.

THEN: Read the synchronised transcript while listening a third time, and mark every place where what you heard and what is written surprised you. That gap is your own pronunciation target, identified by you rather than assigned to you.

SHADOWING: Record yourself speaking the premise correction and the concession. Your recordings are kept attempt by attempt, so you can hear your own progress, and your instructor can reply in their own voice.', 'aud_l6_m7_listen'),
('itm_l6_m7_pronunciation', 'unt_l6_m7', 5, 'pronunciation', 'Pronunciation Lab 7 -- Premise Correction Speed, Partial Concession & The Single Tricolon',
'HOW TO USE THIS LAB: For each target -- listen to the model, say it aloud three times, then record yourself and listen back. Listening back is the step learners skip and the step that works: you cannot correct a sound you have not heard yourself produce.

FOCUS THIS MODULE: Rhetorical devices used sparingly, and the difference between correcting and dodging.

Your recordings are kept, so attempt one and attempt ten sit side by side. Your instructor can reply with a spoken model rather than only written notes.', 'aud_l6_m7_pron');

INSERT INTO pronunciation_targets (id, learning_item_id, sequence, focus, target, example, guidance) VALUES
('pron_l6_m7_1', 'itm_l6_m7_pronunciation', 1, 'intonation', 'Premise correction is quick, level and then moves on', 'Let me correct the PREMise. We''ve known for eLEVen months.', 'Speed and levelness signal precision. Slowing down or emphasising heavily makes the same correction sound defensive, which invites the interviewer to press.'),
('pron_l6_m7_2', 'itm_l6_m7_pronunciation', 2, 'sentence_stress', 'Partial concession stresses both halves', 'On REACHing customers, YES. On idENtifying the fault and ACTing, NO.', 'Parallel structure with opposed answers. Both stressed equally, this is a genuine partial concession; stressing only one half is heard as spin.'),
('pron_l6_m7_3', 'itm_l6_m7_pronunciation', 3, 'rhythm', 'The tricolon earns its place by being the only one', 'THREE things: verified contact DEtails, // a public REGister, // and an external AUdit.', 'One rhetorical device in a whole interview lands. Used repeatedly it reads as evasion, which is the module''s governing rule.');

INSERT INTO quiz_questions (id, learning_item_id, sequence, prompt, choices_json, correct_index, audio_cue_id) VALUES
('qq_l6_m7_ls1', 'itm_l6_m7_listening', 1, 'What premise does the CEO correct?', '["The timeline -- eleven months, not two years","That a recall happened","The number of customers","The cause of the fault"]', 0, 'cue_l6_m7_2'),
('qq_l6_m7_ls2', 'itm_l6_m7_listening', 2, 'What does the CEO say they would defend least?', '["The timeline","The product design","The poor reach of the recall","The audit"]', 2, 'cue_l6_m7_4'),
('qq_l6_m7_ls3', 'itm_l6_m7_listening', 3, 'How does the CEO answer ''So you failed''?', '["Denies it entirely","Accepts it on reach, rejects it on identification and action","Refuses to answer","Accepts it fully"]', 1, 'cue_l6_m7_6'),
('qq_l6_m7_ls4', 'itm_l6_m7_listening', 4, 'What has the CEO asked for regarding the audit?', '["That it be internal","That it be delayed","That it exclude them personally","That it be published unedited"]', 3, 'cue_l6_m7_10');

-- ---------------------------------------------------------------------
-- Module 8: Research & Scholarship
-- ---------------------------------------------------------------------
INSERT INTO audio_assets (id, kind, title, transcript, variety, speaker_count, target_wpm) VALUES
('aud_l6_m8_listen', 'listening', 'The Reviewer''s Objection', 'Your abstract says the intervention ''demonstrates'' improved retention. Your data does not demonstrate that. | You''re right. The correct verb is ''is consistent with''. | Then why did you write demonstrates? | Honestly? Because the abstract was written last, in a hurry, and stronger verbs feel like better writing. | They feel like better writing and they are worse scholarship. | Agreed. I''ll recalibrate the abstract and the discussion. | One more. You cite Aldridge as supporting your position. Aldridge is more equivocal than that. | That''s a fair reading. I''ll change ''argues'' to ''suggests'' and quote the qualification directly.', 'BrE', 2, 155),
('aud_l6_m8_pron', 'model_pronunciation', 'Module 8 Pronunciation Model', 'The intervention demonstrates improved retention. | The correct verb is ''is consistent with''. | They feel like better writing and they are worse scholarship. | Aldridge is more equivocal than that.', 'BrE', 1, 140);

INSERT INTO audio_cues (id, audio_asset_id, sequence, speaker, text) VALUES
('cue_l6_m8_1', 'aud_l6_m8_listen', 1, 'Reviewer', 'Your abstract says the intervention ''demonstrates'' improved retention. Your data does not demonstrate that.'),
('cue_l6_m8_2', 'aud_l6_m8_listen', 2, 'Author', 'You''re right. The correct verb is ''is consistent with''.'),
('cue_l6_m8_3', 'aud_l6_m8_listen', 3, 'Reviewer', 'Then why did you write demonstrates?'),
('cue_l6_m8_4', 'aud_l6_m8_listen', 4, 'Author', 'Honestly? Because the abstract was written last, in a hurry, and stronger verbs feel like better writing.'),
('cue_l6_m8_5', 'aud_l6_m8_listen', 5, 'Reviewer', 'They feel like better writing and they are worse scholarship.'),
('cue_l6_m8_6', 'aud_l6_m8_listen', 6, 'Author', 'Agreed. I''ll recalibrate the abstract and the discussion.'),
('cue_l6_m8_7', 'aud_l6_m8_listen', 7, 'Reviewer', 'One more. You cite Aldridge as supporting your position. Aldridge is more equivocal than that.'),
('cue_l6_m8_8', 'aud_l6_m8_listen', 8, 'Author', 'That''s a fair reading. I''ll change ''argues'' to ''suggests'' and quote the qualification directly.');

INSERT INTO learning_items (id, unit_id, sequence, kind, title, body, audio_asset_id) VALUES
('itm_l6_m8_listening', 'unt_l6_m8', 4, 'listening', 'Listening 8 -- The Reviewer''s Objection',
'LISTENING OBJECTIVES: Follow publication-standard academic exchange; hear the hedging ladder in use; distinguish calibrated from over-claimed statements.

BEFORE YOU LISTEN: An author responds to a peer reviewer at a seminar. Read the four questions first. Knowing what you are listening for is itself the skill being taught, and it is the difference between hearing words and understanding a conversation.

LISTEN TWICE: First for the general situation only -- who is speaking, where, and what they want. Do not stop to decode an unknown word; stopping is what makes learners miss the next sentence. Second time, answer the questions.

THEN: Read the synchronised transcript while listening a third time, and mark every place where what you heard and what is written surprised you. That gap is your own pronunciation target, identified by you rather than assigned to you.

SHADOWING: Record yourself speaking the recalibration of the claim. Your recordings are kept attempt by attempt, so you can hear your own progress, and your instructor can reply in their own voice.', 'aud_l6_m8_listen'),
('itm_l6_m8_pronunciation', 'unt_l6_m8', 5, 'pronunciation', 'Pronunciation Lab 8 -- Ladder Verb Stress, Academic Antithesis & Clean Acceptance',
'HOW TO USE THIS LAB: For each target -- listen to the model, say it aloud three times, then record yourself and listen back. Listening back is the step learners skip and the step that works: you cannot correct a sound you have not heard yourself produce.

FOCUS THIS MODULE: The hedging ladder made audible -- demonstrates, indicates, suggests, is consistent with.

Your recordings are kept, so attempt one and attempt ten sit side by side. Your instructor can reply with a spoken model rather than only written notes.', 'aud_l6_m8_pron');

INSERT INTO pronunciation_targets (id, learning_item_id, sequence, focus, target, example, guidance) VALUES
('pron_l6_m8_1', 'itm_l6_m8_pronunciation', 1, 'word_stress', 'The ladder rungs are stressed as the claim', 'Your abstract says it DEMonstrates. Your data does NOT demonstrate that.', 'Reporting verbs are normally unstressed. When the verb IS the dispute, it takes full stress, and that shift is how a listener knows the argument is about calibration.'),
('pron_l6_m8_2', 'itm_l6_m8_pronunciation', 2, 'sentence_stress', 'The parallel judgement stresses both evaluations', 'They FEEL like better WRITing and they ARE worse SCHOLarship.', 'Antithesis in academic speech, with heavy stress on both halves. One sentence carries the module''s entire ethic.'),
('pron_l6_m8_3', 'itm_l6_m8_pronunciation', 3, 'intonation', 'Accepting correction falls cleanly without excess apology', 'You''re RIGHT. The correct verb is ''is consistent WITH''.', 'A short fall and immediate move to the fix. Extended apology in scholarly exchange reads as defensiveness; the clean acceptance is the professional norm.');

INSERT INTO quiz_questions (id, learning_item_id, sequence, prompt, choices_json, correct_index, audio_cue_id) VALUES
('qq_l6_m8_ls1', 'itm_l6_m8_listening', 1, 'What verb does the abstract use?', '["Suggests","Demonstrates","Indicates","Implies"]', 1, 'cue_l6_m8_1'),
('qq_l6_m8_ls2', 'itm_l6_m8_listening', 2, 'What does the author say the correct verb is?', '["Proves","Establishes","Confirms","Is consistent with"]', 3, 'cue_l6_m8_2'),
('qq_l6_m8_ls3', 'itm_l6_m8_listening', 3, 'Why does the author say they over-claimed?', '["Pressure from a supervisor","A translation error","Stronger verbs feel like better writing","The data changed"]', 2, 'cue_l6_m8_4'),
('qq_l6_m8_ls4', 'itm_l6_m8_listening', 4, 'What is the second objection about?', '["Misrepresenting how strongly Aldridge supports the position","Sample size","Missing citations","Statistical method"]', 0, 'cue_l6_m8_7');

-- ---------------------------------------------------------------------
-- Module 9: Ethics & Responsible Leadership
-- ---------------------------------------------------------------------
INSERT INTO audio_assets (id, kind, title, transcript, variety, speaker_count, target_wpm) VALUES
('aud_l6_m9_listen', 'listening', 'Even If That Were True', 'We''re deciding whether to publish the dataset. Dr Ibarra? | Even though the consent forms permit it, I don''t think permission settles it. | Even if publication caused no identifiable harm, it would still breach what participants believed they agreed to. | That''s a different argument from mine, and it''s worth saying so. | I''m arguing from consequences. You''re arguing from an obligation. | Yes. And however strong the research case, I don''t think the obligation yields to it. | Let me summarise where you differ. You agree on the facts and disagree on what counts. | That''s fair. And I should say plainly what my position costs: if I''m right, some participants will feel deceived even though nothing improper occurred. | Thank you. That''s the most useful sentence anyone has said this morning.', 'BrE', 3, 155),
('aud_l6_m9_pron', 'model_pronunciation', 'Module 9 Pronunciation Model', 'Even though the forms permit it... | Even if publication caused no harm... | I''m arguing from consequences. You''re arguing from an obligation. | However strong the research case...', 'BrE', 1, 140);

INSERT INTO audio_cues (id, audio_asset_id, sequence, speaker, text) VALUES
('cue_l6_m9_1', 'aud_l6_m9_listen', 1, 'Chair', 'We''re deciding whether to publish the dataset. Dr Ibarra?'),
('cue_l6_m9_2', 'aud_l6_m9_listen', 2, 'Ibarra', 'Even though the consent forms permit it, I don''t think permission settles it.'),
('cue_l6_m9_3', 'aud_l6_m9_listen', 3, 'Osman', 'Even if publication caused no identifiable harm, it would still breach what participants believed they agreed to.'),
('cue_l6_m9_4', 'aud_l6_m9_listen', 4, 'Ibarra', 'That''s a different argument from mine, and it''s worth saying so.'),
('cue_l6_m9_5', 'aud_l6_m9_listen', 5, 'Ibarra', 'I''m arguing from consequences. You''re arguing from an obligation.'),
('cue_l6_m9_6', 'aud_l6_m9_listen', 6, 'Osman', 'Yes. And however strong the research case, I don''t think the obligation yields to it.'),
('cue_l6_m9_7', 'aud_l6_m9_listen', 7, 'Chair', 'Let me summarise where you differ. You agree on the facts and disagree on what counts.'),
('cue_l6_m9_8', 'aud_l6_m9_listen', 8, 'Ibarra', 'That''s fair. And I should say plainly what my position costs: if I''m right, some participants will feel deceived even though nothing improper occurred.'),
('cue_l6_m9_9', 'aud_l6_m9_listen', 9, 'Chair', 'Thank you. That''s the most useful sentence anyone has said this morning.');

INSERT INTO learning_items (id, unit_id, sequence, kind, title, body, audio_asset_id) VALUES
('itm_l6_m9_listening', 'unt_l6_m9', 4, 'listening', 'Listening 9 -- Even If That Were True',
'LISTENING OBJECTIVES: Follow ethical deliberation; distinguish even if from even though; hear a speaker name the frame they argue from.

BEFORE YOU LISTEN: A chaired deliberation on an ethical case, where a participant names the disagreement''s real source. Read the four questions first. Knowing what you are listening for is itself the skill being taught, and it is the difference between hearing words and understanding a conversation.

LISTEN TWICE: First for the general situation only -- who is speaking, where, and what they want. Do not stop to decode an unknown word; stopping is what makes learners miss the next sentence. Second time, answer the questions.

THEN: Read the synchronised transcript while listening a third time, and mark every place where what you heard and what is written surprised you. That gap is your own pronunciation target, identified by you rather than assigned to you.

SHADOWING: Record yourself speaking the frame-naming turn. Your recordings are kept attempt by attempt, so you can hear your own progress, and your instructor can reply in their own voice.', 'aud_l6_m9_listen'),
('itm_l6_m9_pronunciation', 'unt_l6_m9', 5, 'pronunciation', 'Pronunciation Lab 9 -- Concessive Contrast, However-Inversion & Naming the Cost',
'HOW TO USE THIS LAB: For each target -- listen to the model, say it aloud three times, then record yourself and listen back. Listening back is the step learners skip and the step that works: you cannot correct a sound you have not heard yourself produce.

FOCUS THIS MODULE: Concessive conditionals, and the stress that separates a granted premise from an accepted one.

Your recordings are kept, so attempt one and attempt ten sit side by side. Your instructor can reply with a spoken model rather than only written notes.', 'aud_l6_m9_pron');

INSERT INTO pronunciation_targets (id, learning_item_id, sequence, focus, target, example, guidance) VALUES
('pron_l6_m9_1', 'itm_l6_m9_pronunciation', 1, 'word_stress', 'Even though concedes a fact; even if concedes a hypothesis', 'EVEN THOUGH the forms permit it... // EVEN IF publication caused no harm...', 'The stress falls on the concessive phrase itself. Mishearing one for the other means mishearing whether the speaker accepts the premise -- which reverses their position.'),
('pron_l6_m9_2', 'itm_l6_m9_pronunciation', 2, 'intonation', 'However-inversion rises through the concession, falls on the claim', 'HowEVer strong the research case, // I don''t think the obligation YIELDS to it.', 'The fronted concession rises and holds; the main clause falls hard. That contour is what makes a concession sound like strength rather than retreat.'),
('pron_l6_m9_3', 'itm_l6_m9_pronunciation', 3, 'sentence_stress', 'Naming the cost stresses who bears it', 'Some PARTicipants will feel deCEIVED even though nothing imPROPer occurred.', 'Stating a position''s cost, with stress on who pays it, is the module''s ethical discipline. The chair''s response marks it as the valuable move.');

INSERT INTO quiz_questions (id, learning_item_id, sequence, prompt, choices_json, correct_index, audio_cue_id) VALUES
('qq_l6_m9_ls1', 'itm_l6_m9_listening', 1, 'What is being decided?', '["Whether to fund a study","Whether to seek new consent","Whether to publish the dataset","Whether to halt research"]', 2, 'cue_l6_m9_1'),
('qq_l6_m9_ls2', 'itm_l6_m9_listening', 2, 'Does Ibarra accept that the consent forms permit publication?', '["Yes, but does not think it settles the matter","No","The forms are unclear","It is not discussed"]', 0, 'cue_l6_m9_2'),
('qq_l6_m9_ls3', 'itm_l6_m9_listening', 3, 'What frame does Osman argue from?', '["Consequences","Character","Precedent","An obligation"]', 3, 'cue_l6_m9_5'),
('qq_l6_m9_ls4', 'itm_l6_m9_listening', 4, 'What does the chair identify as the real disagreement?', '["The facts","What counts","The procedure","The timing"]', 1, 'cue_l6_m9_7');

-- ---------------------------------------------------------------------
-- Module 10: Capstone: Global Challenges
-- ---------------------------------------------------------------------
INSERT INTO audio_assets (id, kind, title, transcript, variety, speaker_count, target_wpm) VALUES
('aud_l6_m10_listen', 'listening', 'The Oral Defence', 'Your portfolio argues that adaptation funding should be prioritised over mitigation. Defend the premise, not the conclusion. | The premise is that near-term harm is already locked in, so some adaptation spending has a return mitigation cannot match. | That assumes the two compete for one budget. | It does, and that''s the weakest link. If they don''t compete, my ranking is unnecessary rather than wrong. | Would your conclusion hold for a state with no coastline? | That''s outside what my evidence covers. I''d expect it to weaken, and I''d want to test it before saying so in print. | You could simply have said yes. | I could. It wouldn''t have been true. | Final question. What in your portfolio would you now withdraw? | The policy brief''s cost figure. I sourced it from a secondary summary and I''ve since found the original disagrees.', 'BrE', 3, 158),
('aud_l6_m10_pron', 'model_pronunciation', 'Module 10 Pronunciation Model', 'Defend the premise, not the conclusion. | That''s the weakest link. | That''s outside what my evidence covers. | I could. It wouldn''t have been true.', 'BrE', 1, 143);

INSERT INTO audio_cues (id, audio_asset_id, sequence, speaker, text) VALUES
('cue_l6_m10_1', 'aud_l6_m10_listen', 1, 'Examiner A', 'Your portfolio argues that adaptation funding should be prioritised over mitigation. Defend the premise, not the conclusion.'),
('cue_l6_m10_2', 'aud_l6_m10_listen', 2, 'Candidate', 'The premise is that near-term harm is already locked in, so some adaptation spending has a return mitigation cannot match.'),
('cue_l6_m10_3', 'aud_l6_m10_listen', 3, 'Examiner A', 'That assumes the two compete for one budget.'),
('cue_l6_m10_4', 'aud_l6_m10_listen', 4, 'Candidate', 'It does, and that''s the weakest link. If they don''t compete, my ranking is unnecessary rather than wrong.'),
('cue_l6_m10_5', 'aud_l6_m10_listen', 5, 'Examiner B', 'Would your conclusion hold for a state with no coastline?'),
('cue_l6_m10_6', 'aud_l6_m10_listen', 6, 'Candidate', 'That''s outside what my evidence covers. I''d expect it to weaken, and I''d want to test it before saying so in print.'),
('cue_l6_m10_7', 'aud_l6_m10_listen', 7, 'Examiner B', 'You could simply have said yes.'),
('cue_l6_m10_8', 'aud_l6_m10_listen', 8, 'Candidate', 'I could. It wouldn''t have been true.'),
('cue_l6_m10_9', 'aud_l6_m10_listen', 9, 'Examiner A', 'Final question. What in your portfolio would you now withdraw?'),
('cue_l6_m10_10', 'aud_l6_m10_listen', 10, 'Candidate', 'The policy brief''s cost figure. I sourced it from a secondary summary and I''ve since found the original disagrees.');

INSERT INTO learning_items (id, unit_id, sequence, kind, title, body, audio_asset_id) VALUES
('itm_l6_m10_listening', 'unt_l6_m10', 4, 'listening', 'Listening 10 -- The Oral Defence',
'LISTENING OBJECTIVES: Integrate every listening skill in the programme; follow a capstone defence with challenge to premise, honest non-answer and reasoned concession.

BEFORE YOU LISTEN: This is the final listening of the WEC-LC programme: a candidate defends a capstone portfolio before examiners, drawing on all six levels. Read the four questions first. Knowing what you are listening for is itself the skill being taught, and it is the difference between hearing words and understanding a conversation.

LISTEN TWICE: First for the general situation only -- who is speaking, where, and what they want. Do not stop to decode an unknown word; stopping is what makes learners miss the next sentence. Second time, answer the questions.

THEN: Read the synchronised transcript while listening a third time, and mark every place where what you heard and what is written surprised you. That gap is your own pronunciation target, identified by you rather than assigned to you.

SHADOWING: Record yourself speaking the whole defence, then the answer the candidate handled worst. Your recordings are kept attempt by attempt, so you can hear your own progress, and your instructor can reply in their own voice.', 'aud_l6_m10_listen'),
('itm_l6_m10_pronunciation', 'unt_l6_m10', 5, 'pronunciation', 'Pronunciation Lab 10 -- Programme Consolidation -- Premise Stress, The Honest Limit & Knowing When to Stop',
'HOW TO USE THIS LAB: For each target -- listen to the model, say it aloud three times, then record yourself and listen back. Listening back is the step learners skip and the step that works: you cannot correct a sound you have not heard yourself produce.

FOCUS THIS MODULE: Everything the programme has taught, at unmodified professional speed.

Your recordings are kept, so attempt one and attempt ten sit side by side. Your instructor can reply with a spoken model rather than only written notes.', 'aud_l6_m10_pron');

INSERT INTO pronunciation_targets (id, learning_item_id, sequence, focus, target, example, guidance) VALUES
('pron_l6_m10_1', 'itm_l6_m10_pronunciation', 1, 'sentence_stress', 'Defending a premise stresses the premise, not the conclusion', 'The PREMise is that near-term harm is already LOCKED IN.', 'The examiner asked for the premise; the answer must stress it. Answering the question actually asked, audibly, is the whole skill of an oral defence.'),
('pron_l6_m10_2', 'itm_l6_m10_pronunciation', 2, 'intonation', 'The honest non-answer falls and does not apologise', 'That''s OUTside what my evidence COVers. // I''d want to TEST it.', 'No rise, no trailing. The programme has taught this contour since Level V Module 7; here it appears under maximum pressure, which is the point.'),
('pron_l6_m10_3', 'itm_l6_m10_pronunciation', 3, 'rhythm', 'The clean short answer as the strongest answer', 'You could simply have said YES. -- I COULD. It WOULDn''t have been TRUE.', 'Six words, three stresses, complete stop. After six levels of learning to elaborate, the capstone tests whether a speaker knows when not to.');

INSERT INTO quiz_questions (id, learning_item_id, sequence, prompt, choices_json, correct_index, audio_cue_id) VALUES
('qq_l6_m10_ls1', 'itm_l6_m10_listening', 1, 'What does the portfolio argue?', '["Adaptation funding should be prioritised over mitigation","Mitigation over adaptation","Both should be cut","Neither is affordable"]', 0, 'cue_l6_m10_1'),
('qq_l6_m10_ls2', 'itm_l6_m10_listening', 2, 'What does the candidate identify as the weakest link?', '["The evidence base","The time horizon","The assumption that the two compete for one budget","The sample of countries"]', 2, 'cue_l6_m10_4'),
('qq_l6_m10_ls3', 'itm_l6_m10_listening', 3, 'How does the candidate answer the question about a landlocked state?', '["Claims it holds","States it is outside the evidence and would test it first","Refuses to answer","Says it definitely fails"]', 1, 'cue_l6_m10_6'),
('qq_l6_m10_ls4', 'itm_l6_m10_listening', 4, 'What does the candidate volunteer to withdraw?', '["The whole argument","The literature review","Nothing","The policy brief''s cost figure"]', 3, 'cue_l6_m10_10');

