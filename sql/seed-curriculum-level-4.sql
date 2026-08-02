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

-- ---------------------------------------------------------------------
-- Module 4: Arguing a Position
-- Full prose version: docs/curriculum/level-4/module-04-arguing-a-position.md
-- ---------------------------------------------------------------------
INSERT INTO units (id, course_id, sequence, title) VALUES
  ('unt_l4_m4', 'crs_level_4', 4, 'Module 4: Arguing a Position');

INSERT INTO learning_items (id, unit_id, sequence, kind, title, body) VALUES
('itm_l4_m4_overview', 'unt_l4_m4', 1, 'reading', 'Module Overview & Key Phrases',
'KEY PHRASES: While it''s true that..., this doesn''t undermine... -- Granted,...; nevertheless,... -- It would be naive to deny that..., yet... -- I''d like to propose the motion that... -- In rebuttal,... -- To conclude, the case for/against this motion is...

DISCOURSE MARKERS (functional set -- advanced concession): "granted", "admittedly", "while it''s true that", "it would be naive to deny that" -- more sophisticated concession openers than Level III''s "that''s a fair point, however."

PHRASAL VERBS & COLLOCATIONS: "hold up (under scrutiny)" (remain valid when closely examined), "poke holes in [an argument]" (identify weaknesses in it), "come round to [a viewpoint]" (gradually start to agree with it), "dig in" (refuse to change position, often stubbornly), "give ground" (make a concession, especially reluctantly).

BrE / AmE NOTE: "moot point" has genuinely drifted apart in meaning: in British English (and the term''s original legal sense), a moot point is open to debate or uncertain; in informal American usage, "moot" has increasingly come to mean irrelevant or no longer worth discussing -- almost opposite meanings.

KEY VOCABULARY: debate vocabulary (motion, proposition, opposition, rebuttal, floor, adjudicator), leadership vocabulary recycled from Level III Module 4 (decisive, accountable, delegate, inspire). Intercultural note: formal competitive debate is one widely used international-academic convention, not a universal way of resolving disagreement.'),

('itm_l4_m4_lesson1', 'unt_l4_m4', 2, 'reading', 'Lesson 4.1 -- While It''s True That... -- Advanced Concession Language',
'LEARNING OBJECTIVES: (1) use advanced concession phrases (granted, admittedly, while it''s true that, it would be naive to deny that) to acknowledge a genuine counter-point, (2) follow a concession with a clear reason your overall position still holds, (3) distinguish a genuine, confidence-building concession from a rhetorical trap, (4) evaluate whether an argument "holds up under scrutiny."

PREREQUISITE KNOWLEDGE: Level III, Module 4 (formal opinion language, the basic agree/partially-agree/disagree/concede scale).

WARM-UP (5 min): Your instructor states one opinion, then models two different concessions to the same counter-point -- one that accidentally undermines their whole position, one that strengthens it -- what''s the difference?

PRESENTATION (10 min): "Granted, remote work can make spontaneous collaboration harder. Nevertheless, the flexibility it offers most employees outweighs that cost for the majority of roles." Then: "While it''s true that some roles genuinely require in-person presence, this doesn''t undermine the case for flexible policies more broadly." A strong concession acknowledges something real and specific, then explains precisely why the overall position still holds; a weak concession accidentally admits something that breaks the whole argument.

GUIDED PRACTICE (10 min): You are given 6 argument-plus-counter-point pairs and, for each, write a strong concession that acknowledges the counter-point without undermining the overall position.

INDEPENDENT PRACTICE / SPEAKING ACTIVITY (10 min): Choose one of your own opinions and prepare a concession to the strongest counter-argument you can think of, then present both the concession and your maintained position to a partner, who evaluates whether the concession was genuine and whether the position still "held up."

CRITICAL THINKING / DISCUSSION PROMPT: "Why do you think acknowledging a weakness in your own argument can sometimes make you more persuasive, not less? Is there a risk to conceding too much?"

LISTENING ACTIVITY (5 min): Listen to a short structured argument including a concession and evaluate whether the concession is strong or weak.

READING ACTIVITY -- EXTENDED READING & ANALYSIS (8 min): Read a short opinion-piece excerpt (180-200 words) that includes at least one concession. Answer 2 literal questions and 2 analytical questions.

WRITING TASK (5 min): Write a short paragraph (5-6 sentences) presenting an opinion, a genuine concession, and a clear explanation of why your position still holds.

PRONUNCIATION PRACTICE (5 min): Measured, confident intonation on concession openers ("Granted...", "Admittedly...") followed by a clear strengthening of tone on the "nevertheless" clause.

VOCABULARY REINFORCEMENT: a concession-strength card-sorting game: sort 8 example concessions into "strengthens the argument" vs. "accidentally undermines it."

FORMATIVE ASSESSMENT: Instructor checks that concessions are genuine and specific and that the maintained position is clearly reasoned, during independent practice.

HOMEWORK: Choose a position on a leadership-related motion and prepare 2-3 reasons plus one anticipated counter-argument, ready for Lesson 4.2''s formal debate.

REVISION: Lesson 4.2 opens with learners briefly stating their homework position in one sentence.

EXTENSION: Prepare a concession to your own anticipated strongest counter-argument in advance.'),

('itm_l4_m4_lesson2', 'unt_l4_m4', 3, 'reading', 'Lesson 4.2 -- The Motion Is... -- Formal Debate Structure',
'LEARNING OBJECTIVES: (1) understand and use standard formal-debate structure and vocabulary (motion, proposition, opposition, rebuttal), (2) deliver a structured opening statement for a position, (3) rebut an opposing argument directly and specifically, (4) deliver a closing statement that synthesises the debate, including at least one graceful concession.

PREREQUISITE KNOWLEDGE: Lesson 4.1 (concession language), Level III Module 4 (the 3-round mini-debate).

WARM-UP (5 min): Your instructor states a debate motion ("This house believes that remote work should be the default for all office-based roles") and asks you to quickly generate one argument for and one against.

PRESENTATION (10 min): The formal debate structure: THE MOTION (a clear, debatable statement); PROPOSITION (arguing for) and OPPOSITION (arguing against); OPENING STATEMENTS (each side states its position and 2 main reasons); REBUTTAL (each side directly addresses and challenges the other side''s specific points); CLOSING STATEMENTS (each side synthesises their case, ideally including one graceful concession, before a final restatement). Rebuttal must engage with what the other side actually said, not a generic restatement.

GUIDED PRACTICE (10 min): In small groups, you are assigned proposition or opposition on a provided motion and prepare a 2-point opening statement together, then practise rebutting a sample opposing point provided by the instructor.

INDEPENDENT PRACTICE (10 min): Finalise your opening statement and prepare at least one anticipated rebuttal point for the other side''s likely argument.

SPEAKING ACTIVITY -- FORMAL DEBATE: The class holds a full structured debate on the leadership-related motion from Lesson 4.1''s homework: opening statements, a rebuttal round, and closing statements (including at least one genuine concession).

CRITICAL THINKING / DISCUSSION PROMPT: "After the debate, has anyone''s actual opinion shifted, even slightly? What was it that moved you, if anything?"

LISTENING ACTIVITY (5 min): Listen to a short formal debate exchange (an opening statement and a rebuttal) and identify whether the rebuttal genuinely engages with the opening statement''s specific points.

READING ACTIVITY (5 min): Read a short written debate transcript excerpt (opening statement + rebuttal + closing) and label each structural part.

WRITING TASK (5 min): Write your side''s closing statement (4-5 sentences) as a clean written version, including at least one concession.

PRONUNCIATION PRACTICE (5 min): Confident, persuasive delivery pace and pausing for a formal opening/closing statement, and a composed, non-defensive tone when delivering a rebuttal.

VOCABULARY REINFORCEMENT: a debate-vocabulary matching game (motion, proposition, opposition, rebuttal, floor, adjudicator).

FORMATIVE ASSESSMENT: Instructor checks that rebuttals genuinely engage with the other side''s specific points and that closing statements include a real concession, during the debate.

HOMEWORK: Write a short written reflection (3-4 sentences) on which side''s argument you found most compelling and why, ready for Module 4''s assignment.

REVISION: This lesson opens with the Lesson 4.1 position recap. Module 4''s Quiz and Assignment draw on both lessons.

EXTENSION: Argue the side you personally disagree with, as an exercise in genuine perspective-taking.'),

('itm_l4_m4_quiz', 'unt_l4_m4', 4, 'quiz', 'Module 4 Quiz -- Arguing a Position', NULL),

('itm_l4_m4_assignment', 'unt_l4_m4', 5, 'assignment', 'Module 4 Assignment -- A Formal Debate -- Leadership Communication',
'INSTRUCTIONS: Record yourself (or perform live, alone or with a partner) delivering a formal debate contribution on a leadership-related motion of your choice, 2-3 minutes total. Include: a clear opening statement with your position and at least 2 reasons; at least one direct rebuttal of a specific opposing point (real or anticipated); at least one advanced concession using this module''s language (granted/admittedly/while it''s true that), followed by a clear reason your position still holds; and a closing statement synthesising your case.

GRADING RUBRIC: (1) Grammatical accuracy -- correct, varied use of concession and debate structures. (2) Vocabulary range -- at least 3 distinct debate/concession phrases used correctly, plus one phrasal verb/collocation from this module. (3) Task completion -- opening statement, a specific rebuttal, a genuine concession, and a closing statement all present. (4) Evidence & argument quality -- is the reasoning genuinely persuasive and specific, does the rebuttal actually engage with the opposing point, and does the concession strengthen rather than undermine the overall position? (5) Discourse coherence & register -- is the register appropriately formal throughout, and does the contribution stay respectful and evidence-based, even under the pressure of rebuttal?

A grade at or above the platform''s pass threshold marks this module complete.');

INSERT INTO quiz_questions (id, learning_item_id, sequence, prompt, choices_json, correct_index) VALUES
('qq_l4_m4_1', 'itm_l4_m4_quiz', 1, '"___, remote work can make spontaneous collaboration harder." (an advanced concession opener)', '["Because","Granted","Therefore","So"]', 1),
('qq_l4_m4_2', 'itm_l4_m4_quiz', 2, 'What distinguishes a strong concession from a weak/trap-like one?', '["A strong concession is longer.","A strong concession acknowledges something specific without undermining the overall position.","A strong concession always agrees completely with the other side.","A weak concession is always false."]', 1),
('qq_l4_m4_3', 'itm_l4_m4_quiz', 3, '"___ some roles genuinely require in-person presence, this doesn''t undermine the broader case."', '["While it''s true that","Because","So","Unless"]', 0),
('qq_l4_m4_4', 'itm_l4_m4_quiz', 4, 'In a formal debate, what is "the motion"?', '["a side''s final score","a clear, debatable statement the debate is about","a type of rebuttal","the adjudicator''s decision"]', 1),
('qq_l4_m4_5', 'itm_l4_m4_quiz', 5, 'What should a rebuttal do?', '["simply restate your own opening argument","directly address and challenge the other side''s specific points","ignore what the other side said","only ask questions"]', 1),
('qq_l4_m4_6', 'itm_l4_m4_quiz', 6, 'In British English (and originally), a "moot point" is one that is:', '["irrelevant","open to debate or uncertain","always false","already decided"]', 1),
('qq_l4_m4_7', 'itm_l4_m4_quiz', 7, 'Which phrase means "identify weaknesses in an argument"?', '["hold up","poke holes in","come round to","dig in"]', 1),
('qq_l4_m4_8', 'itm_l4_m4_quiz', 8, 'A closing statement in a formal debate should ideally include:', '["a completely new argument","at least one graceful concession","no reference to the other side","only a summary of the motion"]', 1),
('qq_l4_m4_9', 'itm_l4_m4_quiz', 9, 'Which phrase means "refuse to change position, often stubbornly"?', '["give ground","come round to","dig in","hold up"]', 2),
('qq_l4_m4_10', 'itm_l4_m4_quiz', 10, 'Which phrase means "make a concession, especially reluctantly"?', '["give ground","dig in","hold up","poke holes in"]', 0);

-- ---------------------------------------------------------------------
-- Module 5: Science, Technology & Ethics
-- Full prose version: docs/curriculum/level-4/module-05-science-technology-ethics.md
-- ---------------------------------------------------------------------
INSERT INTO units (id, course_id, sequence, title) VALUES
  ('unt_l4_m5', 'crs_level_4', 5, 'Module 5: Science, Technology & Ethics');

INSERT INTO learning_items (id, unit_id, sequence, kind, title, body) VALUES
('itm_l4_m5_overview', 'unt_l4_m5', 1, 'reading', 'Module Overview & Key Phrases',
'KEY PHRASES: It has been argued/suggested that... -- This technology should be regulated... -- Concerns have been raised about... -- She asked whether/if... -- He urged them to... -- On balance,.../When weighed against...

DISCOURSE MARKERS (functional set -- formal comparison and evaluation): "on balance", "when weighed against", "by comparison", "by contrast" -- more formal comparison connectors than Level III''s "whereas/in contrast."

PHRASAL VERBS & COLLOCATIONS: "grapple with [an issue]" (struggle seriously to understand or resolve it), "call into question [something]" (cause doubt about its validity), "shed light on [something]" (help explain or clarify it), "raise concerns about [something]", "strike a balance (between two things)".

BrE / AmE NOTE: British English distinguishes "programme" (a general plan, schedule, or broadcast) from "program" (specifically computer software, matching American spelling); American English uses "program" for both meanings without distinction.

KEY VOCABULARY: technology/ethics vocabulary (algorithm, regulation, innovation, unintended consequence, safeguard, dilemma), academic hedging language (it could be argued, arguably, to some extent). Intercultural note: attitudes toward new technology vary significantly by country, generation, and institution.'),

('itm_l4_m5_lesson1', 'unt_l4_m5', 2, 'reading', 'Lesson 5.1 -- It Has Been Argued That... -- Passive Voice II, Advanced Tenses',
'LEARNING OBJECTIVES: (1) form present perfect passive correctly (has/have been + past participle), (2) form modal passive correctly (modal + be + past participle), (3) form future passive correctly (will be + past participle), (4) choose the passive deliberately for academic distance when discussing technology and ethics.

PREREQUISITE KNOWLEDGE: Level III, Module 5 (present/past simple passive).

WARM-UP (5 min): Your instructor shows one active sentence about a technology issue and models converting it through several passive forms -- what changes in meaning/emphasis each time?

PRESENTATION (10 min): "It has been argued that artificial intelligence will transform the workplace. This technology should be regulated to prevent misuse. Concerns have been raised about data privacy. The industry will be significantly affected by new legislation." Present perfect passive reports an ongoing or recently established claim; modal passive expresses necessity, possibility, or recommendation; future passive predicts a future effect.

GUIDED PRACTICE (10 min): Convert 8 active sentences about technology/ethics topics into the passive form indicated (present perfect, modal, or future).

INDEPENDENT PRACTICE / SPEAKING ACTIVITY (10 min): Write 5 sentences about a technology or ethical issue of your choice, using at least 3 different passive forms, then explain to a partner why you chose the passive rather than active voice for each.

CRITICAL THINKING / DISCUSSION PROMPT: "Why do you think academic and journalistic writing about technology and ethics often uses passive constructions like ''it has been argued that'' rather than naming exactly who argued it? Is this always a good thing?"

LISTENING ACTIVITY (5 min): Listen to a short news-style report about a technology issue and identify each passive construction and its tense/modal.

READING ACTIVITY -- EXTENDED READING & ANALYSIS (8 min): Read a short technology-ethics article excerpt (180-200 words) using a range of passive constructions. Answer 2 literal questions and 2 analytical questions.

WRITING TASK (5 min): Write 4-5 sentences about a technology or ethical issue, using present perfect, modal, and future passive at least once each.

PRONUNCIATION PRACTICE (5 min): Stress on the past participle in passive constructions across longer verb phrases ("has been REGulated," "should be adDRESSed").

VOCABULARY REINFORCEMENT: a technology/ethics vocabulary matching game (algorithm, regulation, innovation, unintended consequence, safeguard, dilemma).

FORMATIVE ASSESSMENT: Instructor checks correct formation across all three advanced passive forms and deliberate choice of passive during independent practice.

HOMEWORK: Choose two related technologies or two ethical approaches to the same issue and jot down 2-3 notes on each, ready for Lesson 5.2''s panel discussion.

REVISION: Lesson 5.2 opens with learners briefly naming their two chosen technologies/approaches.

EXTENSION: Add one present continuous passive sentence as a recognition-level review ("The technology is being adopted rapidly").'),

('itm_l4_m5_lesson2', 'unt_l4_m5', 3, 'reading', 'Lesson 5.2 -- She Asked Whether... -- Reported Speech II & a Panel Discussion',
'LEARNING OBJECTIVES: (1) report yes/no questions correctly using whether/if, (2) report wh-questions correctly, with correct word order (no inversion), (3) report commands and strong recommendations using advanced reporting verbs (urged, insisted, warned), (4) participate in a panel discussion, representing an assigned position and responding to other panellists'' points.

PREREQUISITE KNOWLEDGE: Level III, Module 6 (reported speech for statements).

WARM-UP (5 min): Your instructor asks the class a direct question ("Is this technology ethical?") and immediately models reporting it ("I just asked whether this technology was ethical").

PRESENTATION (10 min): Direct: "Is this ethical?" -> Reported: "She asked whether/if it was ethical." Direct: "What are the risks?" -> Reported: "He asked what the risks were" (no question-word inversion). Direct: "Regulate this now!" -> Reported: "The panellist urged the committee to regulate it immediately." Advanced reporting verbs beyond say/tell/ask: urged, insisted, warned, claimed, argued.

GUIDED PRACTICE (10 min): Convert 8 direct questions/commands (yes/no questions, wh-questions, and commands, technology/ethics-themed) into reported speech, choosing an appropriate reporting verb for each.

INDEPENDENT PRACTICE (10 min): In small groups (3-4), you are each assigned a distinct position on a technology-ethics issue and prepare 2-3 points for your assigned position, including at least one passive construction from Lesson 5.1.

SPEAKING ACTIVITY -- PANEL DISCUSSION: Groups hold a structured panel discussion: each panellist states their position, responds to at least one other panellist directly (using reported speech), and the discussion closes with each panellist briefly summarising where they''d be willing to compromise.

CRITICAL THINKING / DISCUSSION PROMPT: "When you represented a position in this discussion that wasn''t necessarily your own personal view, did preparing good arguments for it change how you think about that position at all? Why might that be useful?"

LISTENING ACTIVITY (5 min): Listen to a short panel exchange and note each panellist''s position and one instance of accurate reported-speech relay of another panellist''s point.

READING ACTIVITY (5 min): Read a short written panel-discussion transcript excerpt and identify its reported questions/commands and the reporting verbs used.

WRITING TASK (5 min): Write a short summary (5-6 sentences) of your panel discussion, using reported speech to relay at least 2 different panellists'' positions accurately.

PRONUNCIATION PRACTICE (5 min): Composed, professional intonation for panel-discussion turn-taking -- a brief, polite interruption phrase and clear, non-confrontational stress when directly referencing another speaker''s point.

VOCABULARY REINFORCEMENT: an advanced-reporting-verb matching game (urged, insisted, warned, claimed, argued) matched to example direct quotations.

FORMATIVE ASSESSMENT: Instructor checks correct reported-question/command formation and accurate, fair representation of other panellists'' points during the discussion.

HOMEWORK: Begin drafting your compare-and-contrast essay outline using your Lesson 5.1 homework notes.

REVISION: This lesson opens with the Lesson 5.1 technology/approach-naming recap. Module 5''s Quiz and Assignment draw on both lessons.

EXTENSION: Add a reported command using a stronger reporting verb than "urged" ("insisted that... must..."), noting the increased force this conveys.'),

('itm_l4_m5_quiz', 'unt_l4_m5', 4, 'quiz', 'Module 5 Quiz -- Science, Technology & Ethics', NULL),

('itm_l4_m5_assignment', 'unt_l4_m5', 5, 'assignment', 'Module 5 Assignment -- A Compare-and-Contrast Essay -- Two Technologies or Approaches',
'INSTRUCTIONS: Write a compare-and-contrast essay, 350-450 words, evaluating two related technologies or two different ethical/regulatory approaches to the same issue. This is this level''s fourth writing genre -- compare-and-contrast writing. Structure your essay clearly (either point-by-point or subject-by-subject organisation). Include: at least 2 passive constructions from Lesson 5.1 (present perfect, modal, or future); at least one reported-speech sentence relaying a claim or argument you''ve encountered about either option; at least one formal comparison connector (on balance/when weighed against/by comparison/by contrast); and a reasoned conclusion about which option you find more compelling, or under what conditions each might be preferable.

GRADING RUBRIC: (1) Grammatical accuracy -- correct advanced passive formation, correct reported speech. (2) Vocabulary range -- at least 4 distinct technology/ethics words used correctly, plus one phrasal verb/collocation from this module. (3) Task completion -- both options genuinely compared, a passive construction, a reported claim, and a reasoned conclusion all present. (4) Evidence & argument quality -- is the comparison genuinely balanced and specific, and is the conclusion actually justified by the comparison? (5) Discourse coherence & register -- is the essay''s organisation clear and consistent, and is the register appropriately formal and academic throughout?

A grade at or above the platform''s pass threshold marks this module complete.');

INSERT INTO quiz_questions (id, learning_item_id, sequence, prompt, choices_json, correct_index) VALUES
('qq_l4_m5_1', 'itm_l4_m5_quiz', 1, '"It ___ argued that artificial intelligence will transform the workplace." (present perfect passive)', '["is","has been","was","will be"]', 1),
('qq_l4_m5_2', 'itm_l4_m5_quiz', 2, '"This technology ___ regulated to prevent misuse." (modal passive)', '["should be","should","is","has been"]', 0),
('qq_l4_m5_3', 'itm_l4_m5_quiz', 3, '"The industry ___ significantly affected by new legislation." (future passive)', '["is","was","will be","has been"]', 2),
('qq_l4_m5_4', 'itm_l4_m5_quiz', 4, 'Direct: "Is this ethical?" Reported: "She asked ___ it was ethical."', '["that","whether","what","which"]', 1),
('qq_l4_m5_5', 'itm_l4_m5_quiz', 5, 'Direct: "What are the risks?" Reported: "He asked what the risks ___."', '["are","were","is","was being"]', 1),
('qq_l4_m5_6', 'itm_l4_m5_quiz', 6, 'Direct: "Regulate this now!" Reported: "The panellist ___ the committee to regulate it immediately."', '["said","told","urged","asked"]', 2),
('qq_l4_m5_7', 'itm_l4_m5_quiz', 7, 'In British English, "___" specifically refers to computer software, matching the American spelling, while the general sense (a plan, schedule, broadcast) uses a different spelling.', '["programme","program","progam","programe"]', 1),
('qq_l4_m5_8', 'itm_l4_m5_quiz', 8, 'Which phrase means "struggle seriously to understand or resolve an issue"?', '["shed light on","call into question","grapple with","raise concerns about"]', 2),
('qq_l4_m5_9', 'itm_l4_m5_quiz', 9, '"___, the benefits of this approach outweigh the risks." (a formal comparison/evaluation marker)', '["On balance","Although","Because","So"]', 0),
('qq_l4_m5_10', 'itm_l4_m5_quiz', 10, 'Which phrase means "find a reasonable middle position"?', '["grapple with","call into question","shed light on","strike a balance"]', 3);

-- ---------------------------------------------------------------------
-- Module 6: Global Issues
-- Full prose version: docs/curriculum/level-4/module-06-global-issues.md
-- ---------------------------------------------------------------------
INSERT INTO units (id, course_id, sequence, title) VALUES
  ('unt_l4_m6', 'crs_level_4', 6, 'Module 6: Global Issues');

INSERT INTO learning_items (id, unit_id, sequence, kind, title, body) VALUES
('itm_l4_m6_overview', 'unt_l4_m6', 1, 'reading', 'Module Overview & Key Phrases',
'KEY PHRASES: This is likely due to... -- This could potentially lead to... -- The reduction of.../The awareness of... -- Let me begin by... -- Moving on to... -- To summarise,...

DISCOURSE MARKERS (functional set -- presentation signposting): "let me begin by", "moving on to", "turning now to", "to summarise" -- spoken structural signposts that let an audience follow a longer talk''s shape by ear.

PHRASAL VERBS & COLLOCATIONS: "draw attention to [something]" (highlight it for an audience), "touch on [a point]" (mention it briefly), "wrap up" (bring a talk to a close), "open the floor (to questions)", "field a question" (respond to an unexpected audience question).

BrE / AmE NOTE: British English writes dates day/month/year (15 March 2026, or 15/03/2026), while American English writes month/day/year (March 15, 2026, or 3/15/2026) -- the same numeric date can refer to two different actual dates depending on the convention used.

KEY VOCABULARY: global-issues vocabulary (inequality, sustainability, migration, public health, resource scarcity, governance), nominalised academic vocabulary (reduction, awareness, implementation, urgency, intervention). Intercultural note: which global issues are treated as most urgent varies significantly by country, resource level, and political context.'),

('itm_l4_m6_lesson1', 'unt_l4_m6', 2, 'reading', 'Lesson 6.1 -- This Is Likely Due To... -- Modals for Speculation & Nominalisation',
'LEARNING OBJECTIVES: (1) use a precise range of modal expressions to speculate about causes and outcomes of a global issue, (2) form nominalisations correctly (verb/adjective -> noun: reduce -> reduction, aware -> awareness, decide -> decision, urgent -> urgency), (3) use nominalisation to shift a sentence into a more formal, academic register, (4) discuss a global issue''s causes and outcomes with appropriate speculative hedging.

PREREQUISITE KNOWLEDGE: Level III, Module 7 (modals of deduction).

WARM-UP (5 min): Your instructor states a global-issue fact and models two ways of speculating about its cause -- one casual, one nominalised and formal -- what''s the register difference?

PRESENTATION (10 min): "This is likely due to a combination of factors. This could potentially lead to further instability in the region." Nominalisation: "Governments decided to intervene" -> "the decision to intervene"; "People are becoming more aware of the issue" -> "growing awareness of the issue"; "It is urgent that we act" -> "the urgency of the situation." Nominalisation turns a verb or adjective into a noun, letting a writer build a longer, more formal noun phrase.

GUIDED PRACTICE (10 min): Convert 8 verb/adjective phrases into nominalised noun forms, then use each in a short formal sentence about a global issue.

INDEPENDENT PRACTICE / SPEAKING ACTIVITY (10 min): Write 5 sentences speculating about the causes or outcomes of a global issue of your choice, using at least 3 different speculative modal expressions and at least 2 nominalisations, then read one aloud to a partner, who identifies the nominalisation used.

CRITICAL THINKING / DISCUSSION PROMPT: "Why do you think formal, nominalised language (''the reduction of emissions'') can sometimes feel more distant or impersonal than the equivalent verb form (''reducing emissions'')? Is that distance always a disadvantage in formal writing?"

LISTENING ACTIVITY (5 min): Listen to a short formal talk speculating about a global issue''s causes and note each speculative expression and nominalised noun phrase used.

READING ACTIVITY -- EXTENDED READING & ANALYSIS (8 min): Read a short policy-report-style excerpt (180-200 words) on a global issue, heavy with nominalisation. Answer 2 literal questions and 2 analytical questions.

WRITING TASK (5 min): Write 4-5 sentences about a global issue''s likely causes and outcomes, using speculative modals and at least 2 nominalisations.

PRONUNCIATION PRACTICE (5 min): Stress patterns on longer nominalised words (imPLEmentation, interVENtion, sustainaBILity) and clear, measured pacing appropriate to formal speculation.

VOCABULARY REINFORCEMENT: a nominalisation-conversion relay game: convert 10 verb/adjective cards into their noun forms as quickly and accurately as possible.

FORMATIVE ASSESSMENT: Instructor checks correct nominalisation formation and appropriate, non-mechanical use of speculative modals during independent practice.

HOMEWORK: Choose one real global issue for your Module 6 report/presentation and jot down 3-4 notes on its likely causes and possible responses, ready for Lesson 6.2.

REVISION: Lesson 6.2 opens with learners briefly naming their chosen global issue.

EXTENSION: Nominalise a full sentence from your independent-practice work into an even more formal, report-style single noun-phrase-heavy sentence.'),

('itm_l4_m6_lesson2', 'unt_l4_m6', 3, 'reading', 'Lesson 6.2 -- Ladies and Gentlemen... -- Briefing an Audience: The Formal Presentation',
'LEARNING OBJECTIVES: (1) structure a formal 4-5 minute presentation with a clear opening, body, and close, (2) verbally reference and describe a visual aid naturally, (3) use presentation signposting language to help an audience follow a longer talk, (4) handle unscripted audience questions calmly and professionally, including one you don''t fully know the answer to.

PREREQUISITE KNOWLEDGE: Lesson 6.1 (speculation, nominalisation), Level III Module 9 (the capstone thesis + two-points + conclusion talk).

WARM-UP (5 min): Your instructor delivers 30 seconds of a talk with no signposting at all, then the same content with clear signposting -- which was easier to follow and why?

PRESENTATION (10 min): The formal presentation structure: OPENING ("Let me begin by outlining...", a brief statement of what the talk will cover); BODY (2-3 main points, each clearly signposted -- "Moving on to..., Turning now to..." -- each ideally referencing a described visual aid, "As you can see on this chart, ... This illustrates..."); CLOSE ("To summarise...", a clear final takeaway); Q&A ("I''d be happy to open the floor to questions" / calmly fielding a question you''re unsure of: "That''s a fair question -- based on what I know, I''d say..., though I''d want to look into it further"). A confident answer to a difficult question doesn''t require pretending certainty.

GUIDED PRACTICE (10 min): In pairs, take turns delivering a 60-second mini-version of a presentation on a provided topic, using at least 2 signposting phrases and one described visual-aid reference, while your partner listens for and names the structural parts.

INDEPENDENT PRACTICE (10 min): Develop your Lesson 6.1 homework notes into a full presentation outline (opening, 2-3 signposted body points each with a described visual aid, a close), and rehearse it once.

SPEAKING ACTIVITY -- FLAGSHIP FORMAL PRESENTATION: Deliver your full 4-5 minute presentation to a small group (or the class), describing at least one visual aid naturally within the talk, using signposting throughout, and fielding at least 2 unscripted audience questions.

CRITICAL THINKING / DISCUSSION PROMPT: "What''s the difference between confidently answering a question and confidently pretending to know something you don''t? Why does that distinction matter, especially in a professional or academic setting?"

LISTENING ACTIVITY (5 min): Listen to a short formal presentation excerpt (opening + one signposted body point) and identify the signposting language and the described visual-aid reference used.

READING ACTIVITY (5 min): Read a short written presentation script excerpt and label its opening, signposted body points, and close.

WRITING TASK (5 min): Write your presentation''s opening and closing statements as clean written text (3-4 sentences each).

PRONUNCIATION PRACTICE (5 min): Confident, well-paced formal delivery across a longer talk -- deliberate pauses at each signposted transition, varied pitch to maintain audience engagement, and calm, unhurried intonation when fielding an unscripted question.

VOCABULARY REINFORCEMENT: a presentation-signposting phrase-matching game (let me begin by, moving on to, turning now to, to summarise) matched to their position in a talk.

FORMATIVE ASSESSMENT: Instructor checks for a genuine, clearly signposted structure, natural visual-aid description, and composed handling of unscripted questions during the presentation task.

HOMEWORK: Refine your presentation based on any audience feedback or questions received, and draft the accompanying written report for Module 6''s assignment.

REVISION: This lesson opens with the Lesson 6.1 issue-naming recap. Module 6''s Quiz and Assignment draw on both lessons.

EXTENSION: Add a second described visual aid to your presentation, choosing a genuinely different type and describing each appropriately.'),

('itm_l4_m6_quiz', 'unt_l4_m6', 4, 'quiz', 'Module 6 Quiz -- Global Issues', NULL),

('itm_l4_m6_assignment', 'unt_l4_m6', 5, 'assignment', 'Module 6 Assignment -- A Global Issue Briefing -- Report & Formal Presentation',
'INSTRUCTIONS: Complete two parts on one real global issue of your choice. PART A (report/proposal writing, this level''s fifth writing genre): Write a short analytical report, 250-350 words, describing the issue, speculating about its likely causes using this module''s modal expressions, and proposing a response -- use at least 3 nominalisations. PART B (the flagship formal presentation): Record yourself (or perform live) a 4-5 minute presentation based on your report, with a clearly signposted opening, body, and close; describe at least one visual aid naturally within the talk; and respond to at least 2 unscripted follow-up questions from your audience.

GRADING RUBRIC: (1) Grammatical accuracy -- correct speculative modal use, correct nominalisation formation. (2) Vocabulary range -- at least 4 distinct global-issues or nominalised academic words used correctly, plus one phrasal verb/collocation from this module. (3) Task completion -- the report describes the issue, speculates about causes, and proposes a response; the presentation includes a signposted structure, a described visual aid, and composed Q&A handling. (4) Evidence & argument quality -- is the proposed response genuinely justified by the analysis, and are the speculative claims appropriately hedged rather than overstated? (5) Discourse coherence & register -- is the report''s register formal and report-appropriate throughout, and does the presentation sound genuinely structured and audience-aware, not just read aloud?

A grade at or above the platform''s pass threshold marks this module complete.');

INSERT INTO quiz_questions (id, learning_item_id, sequence, prompt, choices_json, correct_index) VALUES
('qq_l4_m6_1', 'itm_l4_m6_quiz', 1, '"This is likely ___ a combination of factors."', '["due to","because","since","so"]', 0),
('qq_l4_m6_2', 'itm_l4_m6_quiz', 2, '"This could potentially ___ further instability in the region."', '["leads to","lead to","leading to","led to"]', 1),
('qq_l4_m6_3', 'itm_l4_m6_quiz', 3, 'Which is the correct nominalisation of "decide"?', '["decisive","decision","deciding","decided"]', 1),
('qq_l4_m6_4', 'itm_l4_m6_quiz', 4, 'Which is the correct nominalisation of "aware"?', '["awareness","awaring","awared","awarely"]', 0),
('qq_l4_m6_5', 'itm_l4_m6_quiz', 5, '"___ by outlining the three main causes of this issue." (a presentation opening signpost)', '["Let me begin","Moving on","To summarise","In conclusion"]', 0),
('qq_l4_m6_6', 'itm_l4_m6_quiz', 6, '"___ to the second point, the economic impact is significant."', '["Moving on","Let me begin","To summarise","On balance"]', 0),
('qq_l4_m6_7', 'itm_l4_m6_quiz', 7, 'In British English, 15 March 2026 written numerically is:', '["3/15/2026","15/03/2026","2026/03/15","03/2026/15"]', 1),
('qq_l4_m6_8', 'itm_l4_m6_quiz', 8, 'Which phrase means "highlight something for an audience, often referring to a visual aid"?', '["touch on","draw attention to","wrap up","field a question"]', 1),
('qq_l4_m6_9', 'itm_l4_m6_quiz', 9, 'When fielding a difficult question you''re unsure of, the most professional response is to:', '["pretend to know the answer with full confidence","honestly hedge and offer to look into it further","refuse to answer at all","change the subject"]', 1),
('qq_l4_m6_10', 'itm_l4_m6_quiz', 10, 'Which phrase means "respond to an audience question, especially an unexpected one"?', '["open the floor","wrap up","touch on","field a question"]', 3);
