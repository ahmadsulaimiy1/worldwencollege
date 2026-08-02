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

-- ---------------------------------------------------------------------
-- Module 7: Media Literacy & Critical Reading
-- Full prose version: docs/curriculum/level-4/module-07-media-literacy-critical-reading.md
-- ---------------------------------------------------------------------
INSERT INTO units (id, course_id, sequence, title) VALUES
  ('unt_l4_m7', 'crs_level_4', 7, 'Module 7: Media Literacy & Critical Reading');

INSERT INTO learning_items (id, unit_id, sequence, kind, title, body) VALUES
('itm_l4_m7_overview', 'unt_l4_m7', 1, 'reading', 'Module Overview & Key Phrases',
'KEY PHRASES: This implies.../The tone here suggests... -- Arguably,... -- It could be inferred that... -- The writer appears to favour... -- This technique is used to... -- In summary, the piece argues...; however, it overlooks...

DISCOURSE MARKERS (functional set -- critical-reading meta-language): "this implies", "the tone here suggests", "arguably", "it could be inferred that" -- hedged, analytical language for describing what a text does and suggests.

PHRASAL VERBS & COLLOCATIONS: "read into [something]" (interpret a deeper or additional meaning), "play down [an issue]" (minimise its apparent importance), "play up [an issue]" (exaggerate its apparent importance), "gloss over [something]" (address briefly and superficially), "spin [a story]" (present information in a biased way).

BrE / AmE NOTE: "op-ed" -- an American-originated term -- has spread internationally, though British publications have traditionally been just as likely to use "opinion piece" or "comment piece" for the same genre.

KEY VOCABULARY: media-analysis vocabulary (bias, tone, rhetoric, framing, loaded language, objectivity), cohesion vocabulary (ellipsis, substitution, antecedent, reference). Intercultural note: what counts as "neutral" versus "biased" media varies by media tradition and country.'),

('itm_l4_m7_lesson1', 'unt_l4_m7', 2, 'reading', 'Lesson 7.1 -- Reading Between the Lines -- Identifying Bias, Tone & Rhetorical Technique',
'LEARNING OBJECTIVES: (1) identify an author''s likely purpose and bias in a text, (2) describe a text''s tone using precise vocabulary, not just "positive/negative", (3) recognise common rhetorical techniques (rhetorical questions, repetition, appeals to emotion or authority) and explain their intended effect, (4) infer implicit meaning and justify it with specific textual evidence.

PREREQUISITE KNOWLEDGE: Level III, Module 6 (basic media-literacy evaluation checklist).

WARM-UP (5 min): Your instructor reads two short opening sentences on the same event, written in noticeably different tones -- describe the difference in one word each.

PRESENTATION (10 min): "This piece uses the rhetorical question ''Can we really afford to wait?'' to create a sense of urgency -- the tone here suggests real alarm, not neutral reporting. The writer appears to favour immediate action, and this is reinforced by the repeated phrase ''time is running out.''" Four things to look for: PURPOSE (to inform, persuade, entertain); BIAS (a leaning revealed through word choice, selective facts, or framing); TONE (the emotional colouring of the language); RHETORICAL TECHNIQUE (a deliberate device used to persuade or engage).

GUIDED PRACTICE (10 min): You are given 3 short text excerpts (generic, invented, representing different tones/biases) and identify the purpose, tone, and at least one rhetorical technique in each.

INDEPENDENT PRACTICE / SPEAKING ACTIVITY (10 min): Choose one excerpt and write a short analysis (4-5 sentences) identifying its purpose, tone, bias, and one rhetorical technique with its intended effect, then compare your analysis with a partner''s.

CRITICAL THINKING / DISCUSSION PROMPT: "Is it possible for a text to be biased and still be honest and useful? Or does bias always mean you should distrust a source?"

LISTENING ACTIVITY (5 min): Listen to a short persuasive speech excerpt and identify its tone and at least one rhetorical technique used.

READING ACTIVITY -- EXTENDED READING & ANALYSIS (8 min): Read a longer authentic-style opinion piece (200-220 words) on a generic topic. Answer 2 literal questions and 2 analytical questions.

WRITING TASK (5 min): Write a short analytical paragraph (5-6 sentences) identifying the purpose, tone, and one rhetorical technique in a text of your choice.

PRONUNCIATION PRACTICE (5 min): Analytical, evaluative intonation when describing a text''s tone or bias aloud -- a measured, slightly detached delivery.

VOCABULARY REINFORCEMENT: a tone-vocabulary expansion game: sort 12 precise tone words by rough emotional "temperature."

FORMATIVE ASSESSMENT: Instructor checks that analyses name specific textual evidence, not just vague impressions, during independent practice.

HOMEWORK: Find (or recall) a short real text excerpt and bring notes on its purpose, tone, and one technique, ready for Lesson 7.2''s summary-and-critique work.

REVISION: Lesson 7.2 opens with learners briefly sharing their homework text''s tone in one word.

EXTENSION: Identify a second rhetorical technique in the same homework text and compare its effect to the first.'),

('itm_l4_m7_lesson2', 'unt_l4_m7', 3, 'reading', 'Lesson 7.2 -- It, This, One -- Ellipsis & Substitution for Cohesion',
'LEARNING OBJECTIVES: (1) use ellipsis correctly to omit repeated words where meaning stays clear, (2) use substitution (one/ones, so/not, do so) to avoid repeating a noun or clause, (3) recognise ellipsis and substitution when reading, correctly identifying what''s been omitted or replaced, (4) write a concise, cohesive summary-and-critique of a media text.

PREREQUISITE KNOWLEDGE: Lesson 7.1 (critical-reading analysis), Level III Module 2 (summarising basics).

WARM-UP (5 min): Your instructor shows one repetitive sentence pair and one economical version using ellipsis -- what was removed and why does it still make sense?

PRESENTATION (10 min): ELLIPSIS: "She wanted to go, but couldn''t [go]" (the repeated verb phrase is omitted). SUBSTITUTION: "I liked the first article, but not the second one" (one substitutes for the repeated noun); "He said the report was biased, and I think so too" (so substitutes for the whole reported clause); "She read the article carefully, and he did so too" (do so substitutes for a repeated verb phrase). Both avoid clunky repetition and are hallmarks of genuinely fluent, cohesive written English.

GUIDED PRACTICE (10 min): Rewrite 8 repetitive sentence pairs using ellipsis or substitution as appropriate, then identify the antecedent in 4 given examples.

INDEPENDENT PRACTICE (10 min): Write a first-draft summary (4-5 sentences) of your Lesson 7.1 homework text, deliberately using at least 2 instances of ellipsis or substitution, then swap with a partner, who checks whether the omitted/substituted meaning is still clear.

SPEAKING ACTIVITY: Discuss with a partner one place where ellipsis or substitution in your summary could be ambiguous, and revise it together.

CRITICAL THINKING / DISCUSSION PROMPT: "Why do you think overusing ellipsis or substitution in a written summary could actually make it harder to understand, even though each individual technique makes a sentence shorter?"

LISTENING ACTIVITY (5 min): Listen to a short spoken summary using ellipsis and substitution naturally, and identify what each instance refers back to.

READING ACTIVITY (5 min): Read a short written summary-and-critique example and identify its use of ellipsis/substitution, its summary section, and its critique section.

WRITING TASK (5 min): Revise your independent-practice summary into a full summary-and-critique: add 2-3 sentences evaluating the original text''s purpose, tone, and at least one rhetorical technique.

PRONUNCIATION PRACTICE (5 min): Natural sentence rhythm around ellipsis and substitution in spoken English -- a brief pause or slight stress shift onto the substituted word.

VOCABULARY REINFORCEMENT: an ellipsis/substitution identification game: find and mark all instances in a short provided text.

FORMATIVE ASSESSMENT: Instructor checks that ellipsis/substitution is used correctly and that the critique section engages with Lesson 7.1''s analytical categories, during independent practice.

HOMEWORK: Finalise your summary-and-critique for Module 7''s assignment.

REVISION: This lesson opens with the Lesson 7.1 tone-word recap. Module 7''s Quiz and Assignment draw on both lessons.

EXTENSION: Identify one place in a provided dense academic-style text where you had to pause and work out what an ellipsis or substitution referred to.'),

('itm_l4_m7_quiz', 'unt_l4_m7', 4, 'quiz', 'Module 7 Quiz -- Media Literacy & Critical Reading', NULL),

('itm_l4_m7_assignment', 'unt_l4_m7', 5, 'assignment', 'Module 7 Assignment -- A Summary-and-Critique of a Media Text',
'INSTRUCTIONS: Write a summary-and-critique, 250-300 words, of a real or realistic media text (an article, opinion piece, or advertisement) of your choice. This is this level''s sixth writing genre -- the summary-and-critique. Structure it in two clear parts: A SUMMARY (3-4 sentences, genuinely condensed, using at least 2 instances of ellipsis or substitution for economy); and A CRITIQUE (5-6 sentences, identifying the text''s purpose, tone, at least one specific bias or rhetorical technique with its intended effect, and your own reasoned evaluation of whether the text is persuasive, fair, or misleading).

GRADING RUBRIC: (1) Grammatical accuracy -- correct, clear ellipsis and substitution use (no ambiguous reference). (2) Vocabulary range -- at least 4 distinct media-analysis words used correctly, plus one phrasal verb/collocation from this module. (3) Task completion -- a genuine summary and a genuine critique, both present and clearly distinguished. (4) Evidence & argument quality -- is the critique''s identification of bias/technique supported by specific textual evidence, and is the overall evaluation reasoned rather than a bare opinion? (5) Discourse coherence & register -- is the summary genuinely condensed, and is the critique''s register appropriately analytical and measured throughout?

A grade at or above the platform''s pass threshold marks this module complete.');

INSERT INTO quiz_questions (id, learning_item_id, sequence, prompt, choices_json, correct_index) VALUES
('qq_l4_m7_1', 'itm_l4_m7_quiz', 1, '"This piece uses the rhetorical question ''Can we really afford to wait?'' to create a sense of urgency." What is being identified here?', '["bias only","a rhetorical technique","a grammar error","a citation"]', 1),
('qq_l4_m7_2', 'itm_l4_m7_quiz', 2, 'Which best describes "tone" in critical reading?', '["whether a text is true or false","the emotional colouring of the language","the number of paragraphs","the author''s job title"]', 1),
('qq_l4_m7_3', 'itm_l4_m7_quiz', 3, '"She wanted to go, but couldn''t ___." (ellipsis -- what''s omitted?)', '["go","went","going","goes"]', 0),
('qq_l4_m7_4', 'itm_l4_m7_quiz', 4, '"I liked the first article, but not the second ___." (substitution)', '["it","one","so","do"]', 1),
('qq_l4_m7_5', 'itm_l4_m7_quiz', 5, '"He said the report was biased, and I think ___ too." (clause substitution)', '["it","one","so","that"]', 2),
('qq_l4_m7_6', 'itm_l4_m7_quiz', 6, 'Which is a genuine risk of overusing ellipsis and substitution?', '["sentences become too long","the reference can become unclear or ambiguous","it is always grammatically incorrect","it makes writing too formal"]', 1),
('qq_l4_m7_7', 'itm_l4_m7_quiz', 7, 'An American-originated term for an opinion piece, now used internationally, is:', '["editorial note","op-ed","comment column","feature article"]', 1),
('qq_l4_m7_8', 'itm_l4_m7_quiz', 8, 'Which phrase means "minimise the apparent importance of an issue"?', '["play up","play down","gloss over","spin"]', 1),
('qq_l4_m7_9', 'itm_l4_m7_quiz', 9, 'Which phrase means "present information in a biased way to create a particular impression"?', '["read into","play down","gloss over","spin"]', 3),
('qq_l4_m7_10', 'itm_l4_m7_quiz', 10, '"The writer appears to favour immediate action. ___, the tone here suggests real alarm." (a critical-reading discourse marker)', '["Arguably","This is reinforced by the fact that","Because","So"]', 1);

-- ---------------------------------------------------------------------
-- Module 8: Meetings & Negotiation
-- Full prose version: docs/curriculum/level-4/module-08-meetings-negotiation.md
-- ---------------------------------------------------------------------
INSERT INTO units (id, course_id, sequence, title) VALUES
  ('unt_l4_m8', 'crs_level_4', 8, 'Module 8: Meetings & Negotiation');

INSERT INTO learning_items (id, unit_id, sequence, kind, title, body) VALUES
('itm_l4_m8_overview', 'unt_l4_m8', 1, 'reading', 'Module Overview & Key Phrases',
'KEY PHRASES: I hear what you''re saying, but... -- Let''s find some middle ground. -- Would you be open to...? -- That''s a good starting point, but... -- Can I just come in here? -- On the condition that.../Provided that...

DISCOURSE MARKERS (functional set -- negotiation conditions): "on the condition that", "provided that", "in exchange for", "as long as" -- connectors specific to proposing and accepting conditional compromises.

PHRASAL VERBS & COLLOCATIONS: "meet halfway" (each side compromises equally), "hammer out [a deal]" (work through difficulties to reach an agreement), "iron out [details]" (resolve minor remaining problems), "hold firm (on a point)" (refuse to compromise on something specific), "sweeten the deal" (make an offer more attractive).

BrE / AmE NOTE: British professionals typically check their "diary" when scheduling, while American English uses "calendar" for the same everyday scheduling sense (British "diary" can also mean a personal journal, while American "diary" is almost always the journal sense).

KEY VOCABULARY: meeting vocabulary (agenda, minutes, action point, chair, quorum), negotiation vocabulary (leverage, concession, stalemate, compromise, terms). Intercultural note: norms around directness in disagreement and negotiation pace vary significantly by culture and industry.'),

('itm_l4_m8_lesson1', 'unt_l4_m8', 2, 'reading', 'Lesson 8.1 -- My Colleague, Who Has Worked Here for Ten Years... -- Non-Defining Relative Clauses',
'LEARNING OBJECTIVES: (1) form non-defining relative clauses correctly, using commas, (2) use them to add extra, non-essential information smoothly, (3) distinguish non-defining relative clauses from defining relative clauses, (4) use "which" correctly to refer back to an entire preceding clause.

PREREQUISITE KNOWLEDGE: Level III, Module 2 (defining relative clauses).

WARM-UP (5 min): Your instructor shows two similar sentences -- one with a defining relative clause, one with a non-defining one -- what changes if the relative clause is removed from each?

PRESENTATION (10 min): "The colleague who reviewed the proposal had some concerns" (defining -- specifies which colleague) vs. "My colleague, who has worked here for ten years, had some concerns" (non-defining -- extra information; removing the clause leaves the core meaning intact). Non-defining clauses are always set off by commas; "that" is never used in a non-defining clause. "Which" can refer back to an entire previous clause: "The meeting ran long, which frustrated several attendees."

GUIDED PRACTICE (10 min): You are given 8 sentence pairs and decide whether each needs a defining or non-defining relative clause based on context, adding commas correctly where needed.

INDEPENDENT PRACTICE / SPEAKING ACTIVITY (10 min): Write 5 sentences about real or invented colleagues, meetings, or projects, using at least 3 non-defining relative clauses, then read them to a partner, who confirms which information was "extra" versus "essential."

CRITICAL THINKING / DISCUSSION PROMPT: "Why do you think it matters, in professional writing, whether information is ''essential'' or just ''extra''? Can you think of a situation where getting this distinction wrong could actually cause confusion?"

LISTENING ACTIVITY (5 min): Listen to a short professional account (6-7 sentences, mixing defining and non-defining relative clauses) and identify which type each clause is and why.

READING ACTIVITY -- EXTENDED READING & ANALYSIS (8 min): Read a short professional report excerpt (180-200 words) using both clause types. Answer 2 literal questions and 2 analytical questions.

WRITING TASK (5 min): Write 4-5 sentences about your own workplace or study context, using at least 2 non-defining relative clauses correctly, with commas.

PRONUNCIATION PRACTICE (5 min): The natural intonation dip and brief pause that typically surrounds a spoken non-defining relative clause, distinct from the smoother, unpaused flow of a defining relative clause.

VOCABULARY REINFORCEMENT: a clause-type sorting game: sort 10 example sentences into defining vs. non-defining relative clauses, checking comma placement.

FORMATIVE ASSESSMENT: Instructor checks correct comma use and correct defining/non-defining distinction during independent practice.

HOMEWORK: Think of one real or invented workplace negotiation scenario and jot down each side''s likely position, ready for Lesson 8.2''s negotiation roleplay.

REVISION: Lesson 8.2 opens with learners briefly naming their homework negotiation scenario.

EXTENSION: Add one sentence combining a defining and a non-defining relative clause in the same sentence, correctly punctuated.'),

('itm_l4_m8_lesson2', 'unt_l4_m8', 3, 'reading', 'Lesson 8.2 -- I Hear What You''re Saying, But... -- Negotiation & Meeting Language',
'LEARNING OBJECTIVES: (1) disagree diplomatically in a professional register, (2) participate in a meeting, proposing and responding to agenda items appropriately, (3) negotiate toward a compromise using structured conditional language, (4) write accurate meeting minutes and a professional follow-up email.

PREREQUISITE KNOWLEDGE: Lesson 8.1 (non-defining relative clauses), Level III Module 4 (formal opinion/agreement language, now extended into live negotiation).

WARM-UP (5 min): Your instructor models one overly blunt disagreement ("No, that''s wrong") and one diplomatically phrased one ("I hear what you''re saying, but I''d push back on one part of that") -- which is more likely to keep a negotiation productive?

PRESENTATION (10 min): "A: We need this delivered by Friday. B: I hear what you''re saying, but that timeline is tight given the resources we have. Would you be open to Monday instead? A: I could accept Monday, provided that we get a progress update on Wednesday. B: That works -- let''s meet halfway and confirm Wednesday and Monday." Diplomatic disagreement (acknowledge, then push back specifically); proposing a condition (provided that/on the condition that); finding middle ground (meet halfway). Meeting participation language: proposing an agenda item, politely interrupting, confirming an action point.

GUIDED PRACTICE (10 min): In pairs, practise 4 short negotiation exchanges from prompt cards, each requiring one diplomatic disagreement, one conditional proposal, and one compromise phrase.

INDEPENDENT PRACTICE (10 min): Using your Lesson 8.1 homework scenario, prepare your side''s opening position, one anticipated point of disagreement, and one possible conditional compromise.

SPEAKING ACTIVITY -- NEGOTIATION & MEETING ROLEPLAY: In pairs or small groups, hold a full negotiation roleplay on your prepared scenario, framed as part of a short meeting (one person acts as chair, opening and closing the discussion and confirming action points).

CRITICAL THINKING / DISCUSSION PROMPT: "Is it always possible to find a compromise that satisfies both sides equally? What happens, professionally, when a negotiation genuinely can''t reach middle ground?"

LISTENING ACTIVITY (5 min): Listen to a short negotiation exchange and identify the diplomatic disagreement, the conditional proposal, and whether a compromise was reached.

READING ACTIVITY (5 min): Read a short set of meeting minutes and identify the agenda items discussed, the decisions made, and the action points assigned.

WRITING TASK (5 min): Write brief minutes (5-6 bullet points) for your Lesson 8.2 negotiation roleplay, including at least one action point with a name and a deadline.

PRONUNCIATION PRACTICE (5 min): Calm, non-confrontational intonation for diplomatic disagreement in a live negotiation, and clear, confirming intonation when stating an agreed action point.

VOCABULARY REINFORCEMENT: a negotiation-phrasal-verb matching game (meet halfway, hammer out, iron out, hold firm, sweeten the deal).

FORMATIVE ASSESSMENT: Instructor checks that disagreement stays diplomatic and specific and that any compromise reached is genuinely two-sided, during the roleplay.

HOMEWORK: Write a short professional follow-up email summarising your negotiation''s outcome and confirming next steps, ready for Module 8''s assignment.

REVISION: This lesson opens with the Lesson 8.1 scenario-naming recap. Module 8''s Quiz and Assignment draw on both lessons.

EXTENSION: Add a moment where your negotiation nearly reaches a stalemate, then practise language for proposing a genuinely creative alternative to break the deadlock.'),

('itm_l4_m8_quiz', 'unt_l4_m8', 4, 'quiz', 'Module 8 Quiz -- Meetings & Negotiation', NULL),

('itm_l4_m8_assignment', 'unt_l4_m8', 5, 'assignment', 'Module 8 Assignment -- A Negotiation Roleplay & Meeting Minutes',
'INSTRUCTIONS: Complete two parts based on a real or invented workplace negotiation scenario. PART A (speaking): Record yourself (or perform with a partner) a negotiation roleplay, 90 seconds to 2 minutes, including at least one diplomatic disagreement, one conditional proposal (provided that/on the condition that), and a clear outcome. Use at least one non-defining relative clause naturally within the roleplay. PART B (formal correspondence): Write brief meeting minutes (5-8 bullet points, including at least one action point with a name and deadline) and a short professional follow-up email summarising the outcome.

GRADING RUBRIC: (1) Grammatical accuracy -- correct non-defining relative clause formation, correct negotiation conditional structures. (2) Vocabulary range -- at least 3 distinct meeting/negotiation words used correctly, plus one phrasal verb/collocation from this module. (3) Task completion -- diplomatic disagreement, a conditional proposal, and a clear outcome in Part A; complete minutes with an action point and a follow-up email in Part B. (4) Communicative quality -- does the negotiation sound genuinely professional and realistic, and do the minutes accurately and concisely capture what was decided? (5) Discourse coherence & register -- is the spoken negotiation''s tone diplomatic throughout, and is the written correspondence''s register consistently professional?

A grade at or above the platform''s pass threshold marks this module complete.');

INSERT INTO quiz_questions (id, learning_item_id, sequence, prompt, choices_json, correct_index) VALUES
('qq_l4_m8_1', 'itm_l4_m8_quiz', 1, 'Which sentence uses a non-defining relative clause correctly?', '["The colleague who reviewed the proposal had concerns.","My colleague, who has worked here for ten years, had concerns.","My colleague that has worked here for ten years had concerns.","My colleague, that has worked here, had concerns."]', 1),
('qq_l4_m8_2', 'itm_l4_m8_quiz', 2, '"The meeting ran long, ___ frustrated several attendees." (referring to the whole previous clause)', '["that","which","who","whose"]', 1),
('qq_l4_m8_3', 'itm_l4_m8_quiz', 3, 'If a non-defining relative clause is removed from a sentence, the core meaning:', '["is completely lost","stays essentially intact","becomes grammatically incorrect","reverses entirely"]', 1),
('qq_l4_m8_4', 'itm_l4_m8_quiz', 4, '"I hear what you''re saying, ___ I''d push back on one part of that."', '["so","but","because","if"]', 1),
('qq_l4_m8_5', 'itm_l4_m8_quiz', 5, '"I could accept Monday, ___ we get a progress update on Wednesday."', '["provided that","because","so","unless"]', 0),
('qq_l4_m8_6', 'itm_l4_m8_quiz', 6, 'Which phrase means "each side compromises equally"?', '["hold firm","meet halfway","sweeten the deal","hammer out"]', 1),
('qq_l4_m8_7', 'itm_l4_m8_quiz', 7, 'In British English, checking your schedule for a meeting is often called checking your:', '["calendar","diary","planner","agenda"]', 1),
('qq_l4_m8_8', 'itm_l4_m8_quiz', 8, 'Which phrase means "resolve minor remaining problems"?', '["hammer out","iron out","hold firm","meet halfway"]', 1),
('qq_l4_m8_9', 'itm_l4_m8_quiz', 9, '"So, to confirm, [name] will handle X by [date]." This sentence is an example of:', '["a diplomatic disagreement","an action point","a rhetorical question","a non-defining relative clause"]', 1),
('qq_l4_m8_10', 'itm_l4_m8_quiz', 10, 'Which phrase means "refuse to compromise on something specific"?', '["meet halfway","sweeten the deal","hold firm","iron out"]', 2);

-- ---------------------------------------------------------------------
-- Module 9: Academic Writing II
-- Full prose version: docs/curriculum/level-4/module-09-academic-writing-ii.md
-- ---------------------------------------------------------------------
INSERT INTO units (id, course_id, sequence, title) VALUES
  ('unt_l4_m9', 'crs_level_4', 9, 'Module 9: Academic Writing II');

INSERT INTO learning_items (id, unit_id, sequence, kind, title, body) VALUES
('itm_l4_m9_overview', 'unt_l4_m9', 1, 'reading', 'Module Overview & Key Phrases',
'KEY PHRASES: According to Source A,..., while Source B suggests... -- Both sources agree that... -- This is corroborated by... -- Taken together, these sources suggest... -- (Source A) / (Source B) -- a genuine point of tension between these two perspectives is...

DISCOURSE MARKERS (functional set -- synthesis): "both sources agree that", "while Source A suggests..., Source B indicates...", "taken together", "this is corroborated by" -- the level''s most academically demanding connector set, for holding two sources in relation to each other.

PHRASAL VERBS & COLLOCATIONS: "draw together [ideas]" (combine them into one coherent whole), "tie in with [something]" (connect naturally or logically to it), "cross-reference [two things]" (check them against each other), "build a case (from multiple sources)", "corroborate [a claim]" (confirm it using independent evidence).

BrE / AmE NOTE: British academic writing commonly uses single quotation marks ('' '') as the default for a direct quotation, with double marks reserved for a quote-within-a-quote; American academic writing commonly uses double quotation marks ("" "") as the default, with single marks reserved for a quote-within-a-quote.

KEY VOCABULARY: citation vocabulary (source, citation, attribution, corroborate, synthesis, in-text citation), the module''s consolidated cohesion toolkit (nominalisation, ellipsis, substitution, non-defining relative clauses, formal connectors). Intercultural note: formal citation systems vary by academic discipline and country; full mastery of any one system is deferred to Level V+.'),

('itm_l4_m9_lesson1', 'unt_l4_m9', 2, 'reading', 'Lesson 9.1 -- According to Source A... -- Synthesising Multiple Sources',
'LEARNING OBJECTIVES: (1) accurately identify a source''s main claim and key supporting points, (2) compare two sources, identifying where they agree, disagree, or offer complementary angles, (3) use basic citation mechanics ((Source A)-style attribution) consistently, (4) begin synthesising two sources into one coherent point, rather than summarising each separately.

PREREQUISITE KNOWLEDGE: Level III, Module 9 (basic citation awareness); Level IV, Module 2 (genuine paraphrasing) and Module 7 (summary skills).

WARM-UP (5 min): Your instructor reads two short, generic invented "source" statements on the same topic that partially agree and partially disagree -- where do they align and where do they differ?

PRESENTATION (10 min): Reading two short supplied source excerpts (Source A and Source B, 80-100 words each) and identifying: Source A''s main claim, Source B''s main claim, where they agree, where they disagree or offer a different angle. Synthesis: "According to Source A, remote work improves focus; Source B largely agrees, though it notes this depends heavily on having a dedicated workspace (Source B). Taken together, these sources suggest that the benefit is real but conditional." Genuine synthesis relates the two claims to each other, not two separate summaries.

GUIDED PRACTICE (10 min): You are given two more short source excerpts and identify each one''s main claim, then write one sentence using "both sources agree that" or "while Source A suggests..., Source B indicates..." to relate them.

INDEPENDENT PRACTICE / SPEAKING ACTIVITY (10 min): Read a new pair of source excerpts and write a short synthesised paragraph (4-5 sentences) that genuinely combines both sources'' perspectives, using basic citation mechanics, then swap with a partner, who checks whether the paragraph synthesises or merely summarises each source in turn. Discuss one point of genuine tension between the two sources and how you each handled it.

CRITICAL THINKING / DISCUSSION PROMPT: "Why do you think it''s tempting to just summarise sources one after another rather than truly synthesising them? What does genuine synthesis require that summary alone doesn''t?"

LISTENING ACTIVITY (5 min): Listen to someone verbally synthesising two sources and identify where they state agreement, disagreement, and their own overall conclusion.

READING ACTIVITY -- EXTENDED READING & ANALYSIS (8 min): Read two short source excerpts (150 words each) on a generic academic/professional topic. Answer 2 literal questions (one per source) and 2 analytical/synthesis questions.

WRITING TASK (5 min): Write 2-3 sentences synthesising the two reading-activity sources, using at least one citation mechanic and one synthesis discourse marker.

PRONUNCIATION PRACTICE (5 min): Clear stress on source attribution when speaking ("According to SOURCE A..." with a brief pause before naming the source).

VOCABULARY REINFORCEMENT: a synthesis-language matching game (both sources agree that, while X suggests Y indicates, taken together, this is corroborated by).

FORMATIVE ASSESSMENT: Instructor checks for genuine synthesis, not parallel summary, and consistent citation mechanics, during independent practice.

HOMEWORK: Re-read your two Lesson 9.1 source excerpts and jot down one additional point of connection or tension you haven''t yet used, ready for Lesson 9.2''s full essay draft.

REVISION: Lesson 9.2 opens with learners briefly sharing their additional point in one sentence.

EXTENSION: Identify a plausible reason why the two sources might disagree (different context, different timeframe, different assumptions) rather than simply noting that they do.'),

('itm_l4_m9_lesson2', 'unt_l4_m9', 3, 'reading', 'Lesson 9.2 -- Bringing It All Together -- Coherence, Cohesion & the Research-Based Essay',
'LEARNING OBJECTIVES: (1) deploy the level''s full cohesion toolkit (nominalisation, ellipsis/substitution, non-defining relative clauses, formal connectors) within one extended piece, (2) structure a research-based essay that synthesises two sources into a genuine argument, (3) maintain coherence across multiple paragraphs, (4) draft a complete research-based essay using supplied source material.

PREREQUISITE KNOWLEDGE: Lesson 9.1 (synthesis, citation mechanics); Module 2 (thesis/essay architecture), Module 6 (nominalisation), Module 7 (ellipsis/substitution), Module 8 (non-defining relative clauses).

WARM-UP (5 min): Your instructor shows one short paragraph missing clear logical progression and one revised version with clear coherence -- what specifically was fixed?

PRESENTATION (10 min): The research-based essay structure: INTRODUCTION (context, a thesis informed by both sources); BODY PARAGRAPHS (each developing one point, synthesising both sources where relevant, using citation mechanics); CONCLUSION (restating the synthesised position''s significance). A worked paragraph combining a nominalisation ("the implementation of this policy"), a non-defining relative clause ("Source A, which surveyed over a thousand employees, found..."), substitution ("Source B reached a similar conclusion, and Source A did so too"), and a formal connector ("Moreover, both sources note..."). COHERENCE is the logical flow of ideas; COHESION is the grammatical "glue" that makes that flow readable.

GUIDED PRACTICE (10 min): Revise a provided paragraph with weak coherence by reordering sentences and adding appropriate connectors, then identify which cohesion devices could strengthen it further.

INDEPENDENT PRACTICE (10 min): Using your Lesson 9.1 synthesis work, draft your research-based essay''s introduction and first body paragraph, deliberately incorporating at least 2 different cohesion devices.

SPEAKING ACTIVITY: Read your draft introduction aloud to a partner, who identifies the thesis and checks whether it genuinely reflects a synthesis of both sources.

CRITICAL THINKING / DISCUSSION PROMPT: "Looking back across this entire level, which of the cohesion devices you''ve learned do you find yourself using most naturally now, and which still feels effortful? Why might that be?"

LISTENING ACTIVITY (5 min): Listen to a short research-based talk that synthesises two sources and identify at least 3 different cohesion devices used.

READING ACTIVITY (5 min): Read a model research-based essay excerpt (200-220 words) and annotate it for coherence and specific cohesion devices used.

WRITING TASK (5 min): Continue drafting your essay''s second body paragraph and conclusion.

PRONUNCIATION PRACTICE (5 min): Sustained, well-paced formal delivery appropriate to presenting a research-based argument aloud.

VOCABULARY REINFORCEMENT: a cohesion-device identification relay: find one example of each of the level''s five major cohesion devices within a single provided dense paragraph.

FORMATIVE ASSESSMENT: Instructor checks for genuine coherence and correct, purposeful use of cohesion devices during independent practice.

HOMEWORK: Complete your full research-based essay draft for Module 9''s assignment.

REVISION: This lesson opens with the Lesson 9.1 connection-point recap. Module 9''s Quiz and Assignment draw on both lessons.

EXTENSION: Add a brief acknowledgement of a limitation in your own synthesis as a sophisticated closing move.'),

('itm_l4_m9_quiz', 'unt_l4_m9', 4, 'quiz', 'Module 9 Quiz -- Academic Writing II', NULL),

('itm_l4_m9_assignment', 'unt_l4_m9', 5, 'assignment', 'Module 9 Assignment -- A Research-Based Essay from Supplied Sources',
'INSTRUCTIONS: You will be given two short supplied source excerpts (generic, invented, 100-120 words each) on the same topic, representing partially agreeing, partially disagreeing, or complementary perspectives. Write a research-based essay, 400-500 words, that synthesises both sources into one coherent argument. This is this level''s capstone, eighth writing genre. Your essay must include: a clear thesis informed by both sources; at least 2 genuine synthesis statements using this module''s discourse markers; consistent basic citation mechanics throughout; and at least 3 different cohesion devices from this level''s toolkit, used purposefully.

GRADING RUBRIC: (1) Grammatical accuracy -- correct, varied use of the level''s cohesion devices. (2) Vocabulary range -- at least 4 distinct citation/synthesis words used correctly, plus one phrasal verb/collocation from this module. (3) Task completion -- a synthesised thesis, genuine synthesis, consistent citation, and at least 3 cohesion devices all present. (4) Evidence & argument quality -- does the essay genuinely engage with both sources'' claims, and is the final position actually justified by that engagement? (5) Discourse coherence & register -- does the essay read as one logically progressing, well-glued piece of formal academic writing?

A grade at or above the platform''s pass threshold marks this module complete.');

INSERT INTO quiz_questions (id, learning_item_id, sequence, prompt, choices_json, correct_index) VALUES
('qq_l4_m9_1', 'itm_l4_m9_quiz', 1, 'What is genuine synthesis, as opposed to parallel summary?', '["summarising Source A, then separately summarising Source B","relating two sources'' claims to each other in one coherent point","only using Source A and ignoring Source B","copying both sources word-for-word"]', 1),
('qq_l4_m9_2', 'itm_l4_m9_quiz', 2, '"___ Source A suggests remote work improves focus, Source B notes this depends on having a dedicated workspace."', '["While","Because","So","Since"]', 0),
('qq_l4_m9_3', 'itm_l4_m9_quiz', 3, '"Taken together, these sources ___ that the benefit is real but conditional."', '["suggest","suggests","suggesting","suggested"]', 0),
('qq_l4_m9_4', 'itm_l4_m9_quiz', 4, 'What does "coherence" refer to in academic writing?', '["the specific grammatical devices used","the logical flow and progression of ideas","the total word count","the citation style used"]', 1),
('qq_l4_m9_5', 'itm_l4_m9_quiz', 5, 'What does "cohesion" refer to in academic writing?', '["the logical flow of ideas only","the grammatical \"glue\" (specific devices) that makes that flow readable","the essay''s overall length","the number of sources used"]', 1),
('qq_l4_m9_6', 'itm_l4_m9_quiz', 6, 'In American academic writing, the default quotation mark for a direct quote is usually:', '["single ('' '')","double (\"\" \"\")","angled (guillemets)","none are used"]', 1),
('qq_l4_m9_7', 'itm_l4_m9_quiz', 7, 'Which phrase means "confirm a claim using independent evidence or a second source"?', '["draw together","tie in with","corroborate","cross-reference"]', 2),
('qq_l4_m9_8', 'itm_l4_m9_quiz', 8, '"This is ___ by a second, independent study."', '["corroborated","drawn together","tied in","cross-referenced"]', 0),
('qq_l4_m9_9', 'itm_l4_m9_quiz', 9, 'Which best describes this level''s stated goal for citation mechanics?', '["full mastery of one formal system (APA/MLA/Chicago)","the underlying habit and logic of honest, consistent attribution","avoiding citation entirely","memorising citation rules without applying them"]', 1),
('qq_l4_m9_10', 'itm_l4_m9_quiz', 10, 'Which phrase means "combine ideas into one coherent whole"?', '["tie in with","draw together","corroborate","cross-reference"]', 1);
