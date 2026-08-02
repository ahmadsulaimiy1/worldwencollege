-- WEC-LC — Real curriculum content seed: Level IV ("Upper
-- Intermediate Programme," B2). Authored per your Level IV directive
-- — "a significant transition from independent communication to
-- confident academic and professional English" — see
-- docs/curriculum-framework.md (the six-level architecture, including
-- this level's Executive Academic Objective note) and
-- docs/curriculum-level-4-upper-intermediate.md (this level's module
-- map, § What's different from Level III, and Module 1's full prose
-- version) plus docs/curriculum/level-4/module-{02..10}-*.md for
-- Modules 2-10.
--
-- Deliberately a SEPARATE file from sql/schema.sql and from the
-- other level seed files — see any of their headers for why
-- curriculum content is never baked into schema.sql. Apply after
-- schema.sql:
--   wrangler d1 execute wec-lc --file=sql/schema.sql
--   wrangler d1 execute wec-lc --file=sql/seed-curriculum-level-4.sql

-- ---------------------------------------------------------------------
-- Module 1: Advanced Present & Past Systems
-- Full prose version: docs/curriculum-level-4-upper-intermediate.md
-- ---------------------------------------------------------------------
INSERT INTO units (id, course_id, sequence, title) VALUES
  ('unt_l4_m1', 'crs_level_4', 1, 'Module 1: Advanced Present & Past Systems');

INSERT INTO learning_items (id, unit_id, sequence, kind, title, body) VALUES
('itm_l4_m1_overview', 'unt_l4_m1', 1, 'reading', 'Module Overview & Key Phrases',
'KEY PHRASES: By the time..., I had already... -- I''d been working there for... when... -- Looking back,... -- In retrospect,... -- Up until that point,... -- Since then,...

DISCOURSE MARKERS (functional set -- reflective temporal framing): "looking back", "in retrospect", "up until that point", "since then" -- used to frame a narrative explicitly as reflection rather than simple chronological reporting.

PHRASAL VERBS & COLLOCATIONS: "come a long way" (make significant progress over time), "turn a corner" (reach a turning point after a difficult period), "build on [a foundation]" (develop further from an existing base), "move forward" (progress, often after a setback), "take stock (of something)" (pause to assess a situation carefully).

BrE / AmE NOTE: British "whilst" (a more formal, literary variant of "while") is rarely used in American English, where "while" covers both registers; British "amongst" vs. American "among" -- both correct, but American English strongly prefers "among" in every register.

KEY VOCABULARY: change/growth vocabulary (milestone, transition, turning point, progression, evolve), reflective-writing connective language (this experience taught me, what I didn''t realise at the time, with hindsight). Intercultural note: how much personal reflection or vulnerability is appropriate to share in academic or professional writing varies by culture and institutional norm.'),

('itm_l4_m1_lesson1', 'unt_l4_m1', 2, 'reading', 'Lesson 1.1 -- I Had Already Left When... -- Past Perfect, Simple & Continuous',
'LEARNING OBJECTIVES: (1) form past perfect simple correctly (had + past participle), (2) form past perfect continuous correctly (had been + -ing), (3) use past perfect to clarify which of two past events happened first, (4) distinguish past perfect simple (a completed earlier action) from past perfect continuous (an ongoing earlier action, often with duration).

PREREQUISITE KNOWLEDGE: Level II, Module 1 (past simple vs. past continuous); Level III, Module 1 (present perfect simple); Level III, Module 2 (present perfect continuous).

WARM-UP (5 min): Your instructor tells a short two-event story out of order ("I arrived at the station. My train had already left.") -- which event happened first?

PRESENTATION (10 min): "By the time I arrived, the meeting had already started. I''d been working there for two years when the company was acquired." Past perfect simple marks a completed action before another past point; past perfect continuous marks an action in progress up to that past point, often with for/since duration.

GUIDED PRACTICE (10 min): You are given 8 pairs of simple sentences describing two related past events and combine each pair into one sentence using past perfect for the earlier event and simple past for the later one.

INDEPENDENT PRACTICE / SPEAKING ACTIVITY (10 min): Write 5 sentences about real two-event sequences from your own life or work, correctly using past perfect, then explain the sequence to a partner, who confirms they understood which event happened first. Share one especially clear example with the class.

CRITICAL THINKING / DISCUSSION PROMPT: "Why do you think the order events are told in a story doesn''t always match the order they actually happened? Can you think of a story that deliberately told events out of order? What effect did that have?"

LISTENING ACTIVITY (5 min): Listen to a short account with two past events told out of chronological order and reconstruct the actual chronological order on a simple timeline worksheet.

READING ACTIVITY -- EXTENDED READING & ANALYSIS (8 min): Read a short professional/academic-style narrative (150-180 words) using past perfect to establish a complex timeline. Answer 2 literal questions and 2 analytical questions.

WRITING TASK (5 min): Write 4-5 sentences describing a real two-stage sequence from your own life, using past perfect correctly.

PRONUNCIATION PRACTICE (5 min): The contracted, connected form ''d for "had" in natural speech ("I''d already left") versus its full form, and the weak-form pronunciation of "been" in past perfect continuous.

VOCABULARY REINFORCEMENT: a timeline-sequencing game: order 8 event cards into a correct chronology, then describe the sequence aloud using past perfect for earlier events.

FORMATIVE ASSESSMENT: Instructor checks correct past perfect formation and correct logical sequencing during independent practice.

HOMEWORK: Choose one real period of change or growth in your life or career and jot down 4-5 rough notes covering "before," "during," and "after," ready for Lesson 1.2.

REVISION: Lesson 1.2 opens with learners briefly naming their homework period of change in one sentence.

EXTENSION: Add one sentence using past perfect in a negative form ("I hadn''t expected that...") or a question form ("Had you ever...?").'),

('itm_l4_m1_lesson2', 'unt_l4_m1', 3, 'reading', 'Lesson 1.2 -- Looking Back -- Mixed-Tense Narration & Reflective Writing',
'LEARNING OBJECTIVES: (1) combine present perfect, present perfect continuous, past simple, past continuous, and past perfect fluently within one extended narrative, (2) frame a narrative explicitly as reflection using "looking back/in retrospect", (3) identify what you didn''t realise at the time versus what you understand now, (4) write a reflective piece with genuine depth, not just a chronological list.

PREREQUISITE KNOWLEDGE: Lesson 1.1 (past perfect), all prior present/past tense work across Levels I-III.

WARM-UP (5 min): Your instructor shares a short real reflection about something they understand differently now than they did at the time.

PRESENTATION (10 min): A mixed-tense reflective paragraph: "I''ve been thinking about this a lot recently [present perfect continuous]. By the time I changed careers, I''d already spent five years feeling unfulfilled [past perfect]. I didn''t realise it at the time [past simple], but I was slowly losing confidence [past continuous]. Looking back, that period taught me more than any success has [present perfect]." Reflective writing moves between tenses purposefully.

GUIDED PRACTICE (10 min): You are given a jumbled reflective paragraph (6 sentences in mixed tenses, shuffled) and reorder it, identifying which tense each sentence uses and why.

INDEPENDENT PRACTICE (10 min): Using your Lesson 1.1 homework notes, draft a reflective paragraph (6-8 sentences) about your chosen period of change, deliberately using at least 4 different tense forms plus "looking back/in retrospect".

SPEAKING ACTIVITY: Read your reflective paragraph aloud to a partner, who identifies one moment where your understanding seems to have genuinely changed.

CRITICAL THINKING / DISCUSSION PROMPT: "Do you think it''s possible to fully understand an experience while you''re still in the middle of it, or does real understanding only come with distance and time? Why?"

LISTENING ACTIVITY (5 min): Listen to a short spoken reflection (8-9 sentences, deliberately mixed-tense) and identify at least 3 different tense forms used and their function.

READING ACTIVITY (5 min): Read a short written reflective excerpt and annotate it for tense choices and reflective framing language.

WRITING TASK (5 min): Revise your independent-practice paragraph: add one sentence explicitly contrasting what you thought then with what you understand now.

PRONUNCIATION PRACTICE (5 min): Reflective, measured intonation and pacing -- noticeably slower and more thoughtful than narrative storytelling pace.

VOCABULARY REINFORCEMENT: a reflective-language matching game (this experience taught me, what I didn''t realise at the time, with hindsight, in retrospect).

FORMATIVE ASSESSMENT: Instructor checks for genuine tense variety serving a real narrative function and authentic reflective depth during independent practice.

HOMEWORK: Finalise your reflective paragraph into a fuller piece for Module 1''s assignment.

REVISION: This lesson opens with the Lesson 1.1 change-period recap. Module 1''s Quiz and Assignment draw on both lessons.

EXTENSION: Add a closing sentence using "since then" to bridge from the reflected-upon past into your present situation.'),

('itm_l4_m1_quiz', 'unt_l4_m1', 4, 'quiz', 'Module 1 Quiz -- Advanced Present & Past Systems', NULL),

('itm_l4_m1_assignment', 'unt_l4_m1', 5, 'assignment', 'Module 1 Assignment -- Looking Back -- A Reflective Piece on Change',
'INSTRUCTIONS: Write (or record) a reflective piece, 12-15 sentences, about a real period of change or growth in your life or career. This is this level''s first of eight distinct writing genres -- reflective writing -- and should read as genuine reflection, not a chronological list of events. Include: at least one past perfect sentence clarifying the order of two events; at least one present perfect continuous sentence describing an ongoing state or duration; a mix of at least 4 different tense forms overall; "looking back"/"in retrospect" framing; and an explicit contrast between what you understood then and what you understand now.

GRADING RUBRIC: (1) Grammatical accuracy -- correct past perfect (simple and continuous) formation, correct tense choices across the piece. (2) Vocabulary range -- at least 4 distinct change/growth or reflective-language words used correctly, plus one phrasal verb/collocation from this module. (3) Task completion -- clear sequencing of at least two past events, a then-vs-now contrast, and reflective framing language all present. (4) Communicative quality -- does the reflection show genuine, specific insight, and does it read as authentic reflection rather than a plain narrative? (5) Discourse coherence & register -- does the piece flow as one connected reflective account with purposeful tense variety, and is the register appropriately thoughtful and personal without becoming a bare list?

A grade at or above the platform''s pass threshold marks this module complete.');

INSERT INTO quiz_questions (id, learning_item_id, sequence, prompt, choices_json, correct_index) VALUES
('qq_l4_m1_1', 'itm_l4_m1_quiz', 1, '"By the time I arrived, the meeting ___ already started."', '["has","had","was","did"]', 1),
('qq_l4_m1_2', 'itm_l4_m1_quiz', 2, '"I''d ___ working there for two years when the company was acquired."', '["be","been","being","was"]', 1),
('qq_l4_m1_3', 'itm_l4_m1_quiz', 3, 'Which sentence correctly marks the earlier of two past events?', '["I ate breakfast before I woke up.","I had already eaten breakfast when I left the house.","I have eaten breakfast when I left.","I was eating breakfast before I leave."]', 1),
('qq_l4_m1_4', 'itm_l4_m1_quiz', 4, '"I didn''t realise it ___, but I was slowly losing confidence."', '["at the time","since then","up until now","by then"]', 0),
('qq_l4_m1_5', 'itm_l4_m1_quiz', 5, '"___, that period taught me more than any success has." (a reflective framing phrase)', '["By the time","Looking back","Even though","As of yet"]', 1),
('qq_l4_m1_6', 'itm_l4_m1_quiz', 6, 'In British formal writing, a more literary variant of "while" is:', '["whilst","whereas","since","during"]', 0),
('qq_l4_m1_7', 'itm_l4_m1_quiz', 7, 'Which phrase means "make significant progress over time"?', '["turn a corner","come a long way","take stock","move forward"]', 1),
('qq_l4_m1_8', 'itm_l4_m1_quiz', 8, '"I ___ already left when you called."', '["have","had","was","did"]', 1),
('qq_l4_m1_9', 'itm_l4_m1_quiz', 9, 'Which tense best emphasises an ongoing state connecting the past to now?', '["past simple","past perfect","present perfect","past continuous"]', 2),
('qq_l4_m1_10', 'itm_l4_m1_quiz', 10, 'Which phrase means "pause to assess a situation carefully before deciding what''s next"?', '["build on","move forward","take stock","turn a corner"]', 2);

-- ---------------------------------------------------------------------
-- Module 2: Academic Writing I
-- Full prose version: docs/curriculum/level-4/module-02-academic-writing-i.md
-- ---------------------------------------------------------------------
INSERT INTO units (id, course_id, sequence, title) VALUES
  ('unt_l4_m2', 'crs_level_4', 2, 'Module 2: Academic Writing I');

INSERT INTO learning_items (id, unit_id, sequence, kind, title, body) VALUES
('itm_l4_m2_overview', 'unt_l4_m2', 1, 'reading', 'Module Overview & Key Phrases',
'KEY PHRASES: This essay will argue that... -- Moreover,.../Furthermore,... -- Nevertheless,.../However,... -- Consequently,.../As a result,... -- In other words,... -- This suggests/indicates that...

DISCOURSE MARKERS (functional set -- formal academic cohesion): "moreover, furthermore" (adding a further, reinforcing point); "nevertheless" (a formal contrast marker, stronger than "however"); "consequently" (a formal cause-effect marker).

PHRASAL VERBS & COLLOCATIONS: "lay out [an argument]" (present it clearly and in order), "flesh out [an idea]" (develop it with more detail), "hinge on [something]" (depend critically on it), "boil down to [something]" (be reducible to its essential point), "make a case for/against [something]".

BrE / AmE NOTE: British "dissertation" often refers to an extended piece of independent research writing at undergraduate or master''s level, while American English reserves "dissertation" for doctoral-level work and uses "thesis" for undergraduate/master''s -- the reverse of what many learners might guess.

KEY VOCABULARY: essay-architecture vocabulary (thesis, introduction, body paragraph, evidence, counter-argument, conclusion), paraphrasing vocabulary (source, plagiarism, original wording, restate). Intercultural note: the direct, thesis-first essay structure taught here is one widely used international-academic-English convention, not the only valid way to organise a persuasive argument.'),

('itm_l4_m2_lesson1', 'unt_l4_m2', 2, 'reading', 'Lesson 2.1 -- Taking a Position -- Thesis Statements & Essay Architecture',
'LEARNING OBJECTIVES: (1) write a thesis statement that is specific and genuinely arguable, (2) outline a 5-paragraph essay (introduction with a hook and thesis; three body paragraphs, each with a topic sentence, evidence, and brief analysis; a conclusion), (3) distinguish a strong thesis from a weak one, (4) use moreover/furthermore to add a reinforcing point within a paragraph.

PREREQUISITE KNOWLEDGE: Level III, Module 9 (paragraph structure, topic sentences, basic citation awareness).

WARM-UP (5 min): Your instructor shows three candidate "thesis" sentences on the same topic -- one too broad/obvious, one just a topic with no position, one genuinely specific and arguable -- which is strongest and why?

PRESENTATION (10 min): Weak: "Social media is a topic that affects many people" (not arguable). Better: "Social media is bad" (too broad). Strong: "Social media platforms should be required to disclose how their algorithms rank content, because users currently cannot make informed choices about what they see." A strong thesis is specific, takes a genuine position, and often previews why. The 5-paragraph skeleton: Introduction (hook, context, thesis) -> Body 1/2/3 (topic sentence + evidence + brief analysis) -> Conclusion (restate the thesis''s significance).

GUIDED PRACTICE (10 min): Evaluate 8 candidate thesis statements (a mix of weak and strong) and rewrite the weak ones to make them specific and arguable.

INDEPENDENT PRACTICE / SPEAKING ACTIVITY (10 min): Choose a topic you can genuinely argue about and write your own thesis statement, then outline your 5-paragraph essay skeleton, sharing with a partner who checks the thesis is specific and arguable. Explain your outline aloud in under a minute, using moreover/furthermore to connect your planned body points.

CRITICAL THINKING / DISCUSSION PROMPT: "Why do you think a thesis that''s too broad or too obvious makes for a weaker essay, even if every individual sentence in the essay is grammatically correct?"

LISTENING ACTIVITY (5 min): Listen to someone outlining an essay plan aloud (thesis + 3 points + conclusion angle) and note each part on a simple outline worksheet.

READING ACTIVITY -- EXTENDED READING & ANALYSIS (8 min): Read a short 5-paragraph argumentative essay (200-220 words) on a generic topic. Answer 2 literal questions and 2 analytical questions.

WRITING TASK (5 min): Write your own thesis statement plus one body-paragraph topic sentence that clearly supports it.

PRONUNCIATION PRACTICE (5 min): Stress and pacing for moreover/furthermore/nevertheless/consequently at the start of a sentence, typically followed by a brief pause.

VOCABULARY REINFORCEMENT: an essay-architecture vocabulary matching game (thesis, introduction, body paragraph, evidence, counter-argument, conclusion).

FORMATIVE ASSESSMENT: Instructor checks that thesis statements are genuinely specific and arguable during independent practice.

HOMEWORK: Finalise your thesis statement and 3-point outline, ready for Lesson 2.2''s drafting and paraphrasing work.

REVISION: Lesson 2.2 opens with learners briefly sharing their finalised thesis in one sentence.

EXTENSION: Add a brief counter-argument note to your outline to address in Body 3 or the conclusion.'),

('itm_l4_m2_lesson2', 'unt_l4_m2', 3, 'reading', 'Lesson 2.2 -- In Other Words -- Paraphrasing Without Losing Meaning',
'LEARNING OBJECTIVES: (1) genuinely paraphrase an idea by changing both wording and sentence structure, (2) recognise when a "paraphrase" is actually too close to the original, (3) use consequently/nevertheless correctly to connect paraphrased ideas to your own argument, (4) draft a complete 5-paragraph argumentative essay.

PREREQUISITE KNOWLEDGE: Lesson 2.1 (thesis, essay architecture), Level III Module 2 (basic paraphrasing, now developed further).

WARM-UP (5 min): Your instructor shows one original sentence and two "paraphrases" -- one that only swaps a few words, one that genuinely restates the idea differently -- which is the real paraphrase and why?

PRESENTATION (10 min): Original: "Many researchers believe that remote work increases employee satisfaction, though the evidence remains mixed." Weak paraphrase: "Lots of researchers think remote work increases worker satisfaction, though the proof is mixed." Genuine paraphrase: "While the connection between remote work and job satisfaction is not fully settled, a considerable body of research points toward a positive link." A genuine paraphrase changes sentence structure and word choices substantially while preserving the original meaning exactly -- swapping synonyms alone is a common, often accidental form of plagiarism.

GUIDED PRACTICE (10 min): You are given 6 original sentences and, for each, identify which of two provided "paraphrases" is genuine and which is too close to the original, explaining your reasoning.

INDEPENDENT PRACTICE (10 min): Practise paraphrasing 4 short source-style sentences into genuine paraphrases, then swap with a partner, who checks whether each paraphrase is genuinely restructured and whether the meaning is preserved.

SPEAKING ACTIVITY: Discuss with a partner one paraphrase each you found particularly difficult to reword without changing the meaning, and why.

CRITICAL THINKING / DISCUSSION PROMPT: "Why do you think paraphrasing well is actually a harder skill than it first seems? What does it require you to do that simply copying doesn''t?"

LISTENING ACTIVITY (5 min): Listen to someone paraphrasing a short claim aloud and evaluate whether their paraphrase is genuine or too close to a model original read first.

READING ACTIVITY (5 min): Read a short original passage and one paraphrase of it, identifying exactly what changed while the meaning stayed the same.

WRITING TASK (5 min): Draft your essay''s introduction paragraph (hook + brief context + thesis) from Lesson 2.1''s outline, incorporating one genuine paraphrase.

PRONUNCIATION PRACTICE (5 min): Clear, deliberate delivery when reading a paraphrase aloud, differentiated from reading a direct quotation.

VOCABULARY REINFORCEMENT: a paraphrase-quality card-sorting game: sort 8 example paraphrase pairs into "genuine paraphrase" vs. "too close to the original."

FORMATIVE ASSESSMENT: Instructor checks that paraphrases genuinely restructure the sentence and preserve meaning accurately, during independent practice.

HOMEWORK: Draft the remaining paragraphs of your 5-paragraph essay (body paragraphs and conclusion) for Module 2''s assignment.

REVISION: This lesson opens with the Lesson 2.1 thesis recap. Module 2''s Quiz and Assignment draw on both lessons.

EXTENSION: Paraphrase the same sentence twice, in two genuinely different ways, comparing which version fits your essay''s tone better.'),

('itm_l4_m2_quiz', 'unt_l4_m2', 4, 'quiz', 'Module 2 Quiz -- Academic Writing I', NULL),

('itm_l4_m2_assignment', 'unt_l4_m2', 5, 'assignment', 'Module 2 Assignment -- An Argumentative Essay',
'INSTRUCTIONS: Write a full 5-paragraph argumentative essay, 300-400 words, on a topic of your choice that you can genuinely argue a position on. This is this level''s second writing genre -- the argumentative essay. Your essay must include: a clear, specific, arguable thesis statement in the introduction; three body paragraphs, each with a topic sentence, supporting evidence or reasoning, and brief analysis; at least one genuine paraphrase of an idea (not synonym-swapped); at least two of this module''s formal cohesion devices (moreover/furthermore/nevertheless/consequently); and a conclusion that restates the thesis''s significance.

GRADING RUBRIC: (1) Grammatical accuracy -- correct, varied sentence structures appropriate to formal academic writing. (2) Vocabulary range -- at least 4 distinct essay-architecture or argument words used correctly, plus one phrasal verb/collocation from this module. (3) Task completion -- thesis, three supported body paragraphs, a genuine paraphrase, and a conclusion all present. (4) Evidence & argument quality -- is the thesis genuinely specific and arguable, is each body paragraph''s evidence or reasoning actually convincing, and does the essay address the strongest version of the topic? (5) Discourse coherence & register -- does the essay read as one connected, logically structured academic piece, with formal cohesion devices used correctly and register consistently formal throughout?

A grade at or above the platform''s pass threshold marks this module complete.');

INSERT INTO quiz_questions (id, learning_item_id, sequence, prompt, choices_json, correct_index) VALUES
('qq_l4_m2_1', 'itm_l4_m2_quiz', 1, 'Which is the strongest, most specific and arguable thesis statement?', '["Social media is a topic that affects many people.","Social media is bad.","Social media platforms should be required to disclose how their algorithms rank content, because users cannot currently make informed choices.","Many people use social media every day."]', 2),
('qq_l4_m2_2', 'itm_l4_m2_quiz', 2, 'In a 5-paragraph essay, what does the conclusion typically do?', '["introduce a brand new argument","restate the thesis''s significance, not just repeat it","simply repeat the introduction word-for-word","list every source used"]', 1),
('qq_l4_m2_3', 'itm_l4_m2_quiz', 3, '"The first point supports the thesis well. ___, the second point provides even stronger evidence."', '["Moreover","Because","So","If"]', 0),
('qq_l4_m2_4', 'itm_l4_m2_quiz', 4, 'Which is a genuine paraphrase (not just synonym-swapping)?', '["\"Many researchers believe X\" -> \"Lots of researchers think X.\"","\"Many researchers believe X, though evidence is mixed\" -> \"While the connection is not fully settled, a considerable body of research points toward X.\"","\"Many researchers believe X\" -> \"Many researchers believe X.\"","\"Many researchers believe X\" -> \"X is believed by many researchers.\" (word order only)"]', 1),
('qq_l4_m2_5', 'itm_l4_m2_quiz', 5, 'Swapping only a few synonyms while keeping the same sentence structure as the original is:', '["always acceptable","a form of genuine paraphrasing","a common, often accidental form of plagiarism","required by academic convention"]', 2),
('qq_l4_m2_6', 'itm_l4_m2_quiz', 6, 'In American English, an extended piece of independent research writing at the doctoral level is usually called a:', '["thesis","dissertation","paper","report"]', 1),
('qq_l4_m2_7', 'itm_l4_m2_quiz', 7, '"The evidence is limited. ___, the argument remains worth considering."', '["Consequently","Nevertheless","Moreover","Because"]', 1),
('qq_l4_m2_8', 'itm_l4_m2_quiz', 8, 'Which phrase means "present an argument clearly and in order"?', '["flesh out","hinge on","lay out","boil down to"]', 2),
('qq_l4_m2_9', 'itm_l4_m2_quiz', 9, 'A body paragraph''s topic sentence should:', '["introduce a completely unrelated idea","clearly support the essay''s thesis","restate the conclusion","always start with \"Moreover\""]', 1),
('qq_l4_m2_10', 'itm_l4_m2_quiz', 10, 'Which phrase means "depend critically on something"?', '["flesh out","hinge on","lay out","boil down to"]', 1);

-- ---------------------------------------------------------------------
-- Module 3: The World of Work
-- Full prose version: docs/curriculum/level-4/module-03-the-world-of-work.md
-- ---------------------------------------------------------------------
INSERT INTO units (id, course_id, sequence, title) VALUES
  ('unt_l4_m3', 'crs_level_4', 3, 'Module 3: The World of Work');

INSERT INTO learning_items (id, unit_id, sequence, kind, title, body) VALUES
('itm_l4_m3_overview', 'unt_l4_m3', 1, 'reading', 'Module Overview & Key Phrases',
'KEY PHRASES: If I had known..., I would have... -- With regard to.../Further to your email,... -- Please find attached... -- I look forward to hearing from you. -- Could you tell me about a time when...? -- Looking back, I would have approached that differently.

DISCOURSE MARKERS (functional set -- formal correspondence framing): "with regard to", "further to your email/our conversation", "given that", "provided that" -- formulaic formal-register openers and conditional-adjacent connectors specific to professional written communication.

PHRASAL VERBS & COLLOCATIONS: "follow up (on something)" (check on progress or send a reminder), "touch base (with someone)" (make brief contact to check in), "circle back (to something)" (return to a topic later), "reach out (to someone)" (make initial contact, often professionally), "get back to (someone)" (respond to them after some time).

BrE / AmE NOTE: British professional emails often close with "Kind regards" (or "Yours sincerely" when the recipient is named), while American professional emails more commonly close with "Best regards" or "Best,".

KEY VOCABULARY: professional-email vocabulary (attachment, correspondence, recipient, subject line, cc/bcc), interview vocabulary (candidate, qualification, strength, area for development, behavioural question). Intercultural note: interview norms vary by country and workplace culture.'),

('itm_l4_m3_lesson1', 'unt_l4_m3', 2, 'reading', 'Lesson 3.1 -- If I Had Known... -- Third Conditional',
'LEARNING OBJECTIVES: (1) form the third conditional correctly (If + past perfect, would have + past participle), (2) use it to reflect on a hypothetical different outcome to a real past situation, (3) distinguish the third conditional (an unreal past) from the second conditional (an unreal present/future), (4) use the third conditional to reflect honestly on a workplace or career decision.

PREREQUISITE KNOWLEDGE: Level III, Module 8 (second conditional); Level IV, Module 1 (past perfect).

WARM-UP (5 min): Your instructor states one real generic past regret ("I didn''t apply for that job -- I wish I had") -- what tense would you need to express "what would have happened if I had"?

PRESENTATION (10 min): "If I had known about the deadline earlier, I would have submitted my application on time. If she hadn''t taken that internship, she wouldn''t have discovered her interest in data analysis." Third conditional describes a hypothetical different outcome to something that already, definitely happened. Contrast: "If I were braver, I would apply" (second conditional, still possible) vs. "If I had been braver, I would have applied" (third conditional, that chance is gone).

GUIDED PRACTICE (10 min): Convert 8 real-sounding workplace/career scenario pairs into third-conditional sentences.

INDEPENDENT PRACTICE / SPEAKING ACTIVITY (10 min): Write 4-5 third-conditional sentences reflecting on a real or invented career/work decision, then share one with a partner, who asks a genuine follow-up question about what actually happened instead.

CRITICAL THINKING / DISCUSSION PROMPT: "Do you think reflecting on ''what would have happened if...'' is generally useful, or can it become unhelpful if someone does it too much? Where''s the line?"

LISTENING ACTIVITY (5 min): Listen to someone reflecting on a career decision using third conditional and complete a simple "what happened / what might have happened instead" grid.

READING ACTIVITY -- EXTENDED READING & ANALYSIS (8 min): Read a short professional reflection excerpt (150-180 words) using third conditional to discuss a past career turning point. Answer 2 literal questions and 2 analytical questions.

WRITING TASK (5 min): Write 4-5 third-conditional sentences reflecting on a real or invented workplace decision.

PRONUNCIATION PRACTICE (5 min): The heavily contracted, connected pronunciation of third-conditional forms in natural speech ("If I''d known, I would''ve...") versus their fuller form in careful or written register.

VOCABULARY REINFORCEMENT: a conditional-type sorting game: sort 9 example sentences into first/second/third conditional.

FORMATIVE ASSESSMENT: Instructor checks correct third-conditional formation and correct distinction from second conditional during independent practice.

HOMEWORK: Choose one real or invented job you''d like to apply for and jot down 3-4 notes about your relevant experience, ready for Lesson 3.2''s interview practice.

REVISION: Lesson 3.2 opens with learners briefly naming their homework job choice in one sentence.

EXTENSION: Add one mixed-conditional sentence as a recognition-level preview ("If I had taken that job, I would be in a completely different city now").'),

('itm_l4_m3_lesson2', 'unt_l4_m3', 3, 'reading', 'Lesson 3.2 -- Dear Hiring Manager... -- Professional Correspondence & the Job Interview',
'LEARNING OBJECTIVES: (1) write a professional email in correct formal structure and register, (2) draft a short workplace proposal with a clear recommendation and reasoning, (3) answer a behavioural interview question using the STAR-style structure (Situation, Task, Action, Result) with genuine reflection, (4) use professional workplace phrasal verbs naturally in both writing and speech.

PREREQUISITE KNOWLEDGE: Lesson 3.1 (third conditional, for reflective interview answers), Level III Module 3 (workplace vocabulary, a business pitch).

WARM-UP (5 min): Your instructor shows one poorly-structured professional email and one well-structured one on the same topic -- what are the differences?

PRESENTATION (10 min): Professional email structure: SUBJECT LINE (clear and specific), GREETING (Dear [Name] or Dear Hiring Manager if unknown), PURPOSE STATED EARLY (I am writing to...), BODY (clear, organised), CLOSING (I look forward to hearing from you), SIGN-OFF (Kind regards,). A short workplace proposal structure: a brief context, a clear recommendation, 1-2 supporting reasons, a next-step suggestion. The STAR interview-answer structure, with a model answer to "Tell me about a time you solved a difficult problem," including one third-conditional reflective sentence.

GUIDED PRACTICE (10 min): You are given a jumbled professional email (parts shuffled) and reorder it correctly, then practise answering 2 behavioural interview questions aloud in pairs using the STAR structure.

INDEPENDENT PRACTICE (10 min): Draft a short professional email using the full structure and at least one professional phrasal verb, then prepare a STAR-structured answer to one interview question using your Lesson 3.1 homework notes.

SPEAKING ACTIVITY -- INTERVIEW TASK: In pairs, Learner A conducts a short mock job interview (2-3 questions, including at least one behavioural question), Learner B answers using the STAR structure with a genuine third-conditional reflection, then swap roles.

CRITICAL THINKING / DISCUSSION PROMPT: "Why do you think interviewers often ask about a past difficulty rather than just asking ''what are your strengths?'' What does a well-structured answer to a difficulty question reveal that a simple strengths list doesn''t?"

LISTENING ACTIVITY (5 min): Listen to a short mock interview answer using the STAR structure and identify each of the four parts.

READING ACTIVITY (5 min): Read a well-structured professional email and a short workplace proposal, labelling their structural parts.

WRITING TASK (5 min): Finalise your professional email draft, checking register consistency and correct structure.

PRONUNCIATION PRACTICE (5 min): Calm, confident interview-answer pacing and intonation -- clear stress on key result words and composed delivery when answering an unscripted follow-up question.

VOCABULARY REINFORCEMENT: a professional-phrasal-verb matching game (follow up on, touch base, circle back, reach out, get back to).

FORMATIVE ASSESSMENT: Instructor checks correct email structure and register, and a genuine STAR-structured interview answer, during the speaking activity.

HOMEWORK: Refine your professional email and interview answer based on any partner feedback, ready for Module 3''s assignment.

REVISION: This lesson opens with the Lesson 3.1 job-choice recap. Module 3''s Quiz and Assignment draw on both lessons.

EXTENSION: Draft a brief written workplace proposal (3-4 sentences: context, recommendation, reasoning, next step) in addition to your email.'),

('itm_l4_m3_quiz', 'unt_l4_m3', 4, 'quiz', 'Module 3 Quiz -- The World of Work', NULL),

('itm_l4_m3_assignment', 'unt_l4_m3', 5, 'assignment', 'Module 3 Assignment -- A Professional Email & Mock Interview',
'INSTRUCTIONS: Complete two parts. PART A (formal correspondence, this level''s third writing genre): Write a professional email, 150-200 words, either applying for a role, following up after an interview, or proposing a workplace idea. Use correct formal structure (subject line, greeting, clear purpose, body, closing, sign-off) and include at least one phrasal verb from this module. PART B (interview speaking task): Record yourself (or perform live) answering one behavioural interview question ("Tell me about a time when...") using the STAR structure, including at least one third-conditional reflective sentence about what might have happened differently.

GRADING RUBRIC: (1) Grammatical accuracy -- correct third-conditional formation, correct formal email structures. (2) Vocabulary range -- at least 3 distinct professional-correspondence or interview words used correctly, plus one phrasal verb/collocation from this module. (3) Task completion -- full email structure present in Part A; a complete STAR structure with a genuine third-conditional reflection in Part B. (4) Communicative quality -- does the email sound genuinely professional and purposeful, and does the interview answer reveal real reflection, not a rehearsed, generic response? (5) Discourse coherence & register -- is the email''s register consistently formal throughout, and does the interview answer sound composed and appropriately professional in delivery?

A grade at or above the platform''s pass threshold marks this module complete.');

INSERT INTO quiz_questions (id, learning_item_id, sequence, prompt, choices_json, correct_index) VALUES
('qq_l4_m3_1', 'itm_l4_m3_quiz', 1, '"If I ___ known about the deadline earlier, I would have submitted on time." (third conditional)', '["have","had","has","was"]', 1),
('qq_l4_m3_2', 'itm_l4_m3_quiz', 2, '"If she hadn''t taken that internship, she ___ discovered her interest in data analysis."', '["wouldn''t have","wouldn''t","didn''t","hadn''t"]', 0),
('qq_l4_m3_3', 'itm_l4_m3_quiz', 3, 'Which sentence is second conditional (still possible now), not third (an unchangeable past)?', '["If I had been braver, I would have applied.","If I were braver, I would apply.","If I had known, I would have said something.","If she had asked, I would have helped."]', 1),
('qq_l4_m3_4', 'itm_l4_m3_quiz', 4, '"___ your email, please find the attached proposal."', '["With regard to","Further to","Given that","Provided that"]', 1),
('qq_l4_m3_5', 'itm_l4_m3_quiz', 5, 'Which is an appropriate professional email closing before a formal named sign-off in British English?', '["Kind regards","See ya","Talk soon","Bye for now"]', 0),
('qq_l4_m3_6', 'itm_l4_m3_quiz', 6, 'In American English, a common professional email closing is:', '["Yours faithfully","Best regards","Ta","Cheers"]', 1),
('qq_l4_m3_7', 'itm_l4_m3_quiz', 7, 'What does the "R" in the STAR interview-answer structure stand for?', '["Reason","Result","Response","Review"]', 1),
('qq_l4_m3_8', 'itm_l4_m3_quiz', 8, 'Which phrase means "make brief contact to check in"?', '["reach out","touch base","circle back","follow up"]', 1),
('qq_l4_m3_9', 'itm_l4_m3_quiz', 9, '"As a result, we delivered the project on time. ___, we hadn''t asked for help early on, the project would have taken much longer."', '["If","Unless","Because","So"]', 0),
('qq_l4_m3_10', 'itm_l4_m3_quiz', 10, 'Which phrase means "return to a topic later"?', '["reach out","touch base","circle back","get back to"]', 2);
