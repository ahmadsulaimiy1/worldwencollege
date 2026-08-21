-- WEC — Real curriculum content seed: Level III ("Intermediate
-- Programme," B1). Authored per your Level III directive — "an
-- important academic transition... students are no longer simply
-- learning English, they are becoming independent users of the
-- language" — see docs/curriculum-framework.md (the six-level
-- architecture, including this level's Executive Directive note on
-- the elevated skill set) and docs/curriculum-level-3-intermediate.md
-- (this level's module map, § What's different from Level II, and
-- Module 1's full prose version) plus
-- docs/curriculum/level-3/module-{02..10}-*.md for Modules 2-10.
--
-- Deliberately a SEPARATE file from sql/schema.sql and from the
-- other level seed files — see any of their headers for why
-- curriculum content is never baked into schema.sql. Apply after
-- schema.sql:
--   wrangler d1 execute wec-lc --file=sql/schema.sql
--   wrangler d1 execute wec-lc --file=sql/seed-curriculum-level-3.sql

-- ---------------------------------------------------------------------
-- Module 1: Present Perfect & Life Experience
-- Full prose version: docs/curriculum-level-3-intermediate.md
-- ---------------------------------------------------------------------
INSERT INTO units (id, course_id, sequence, title) VALUES
  ('unt_l3_m1', 'crs_level_3', 1, 'Module 1: Present Perfect & Life Experience');

INSERT INTO learning_items (id, unit_id, sequence, kind, title, body) VALUES
('itm_l3_m1_overview', 'unt_l3_m1', 1, 'reading', 'Module Overview & Key Phrases',
'KEY PHRASES: Have you ever...? -- I''ve never... -- I have, actually -- In fact,.../As a matter of fact,... -- That''s/It''s had a real impact on me. -- Looking back, I think...

DISCOURSE MARKERS (functional set -- adding emphasis or detail): "in fact", "actually", "as a matter of fact" -- all used to add a stronger or more specific detail to a statement someone has just made ("I''ve travelled a lot. In fact, I''ve visited over ten countries."). These intensify or specify a claim, unlike Level II''s sequencing connectors.

PHRASAL VERBS & COLLOCATIONS: "grow up" (spend your childhood somewhere), "look back on [something]" (think about a past experience, often reflectively), "get used to [something]" (become familiar/comfortable with something over time), "broaden your horizons" (gain wider experience/perspective), "make a lasting impression" (have a memorable, long-term effect on someone).

BrE / AmE NOTE: the present perfect itself is used somewhat more in British English than American English in everyday speech (British speakers often prefer "I''ve just eaten" where American speakers often say "I just ate," both entirely correct within their own variety); the clearest concrete difference is the past participle of "get": British English uses "got" ("I''ve got better at this"), American English commonly uses "gotten" ("I''ve gotten better at this") for the "become/improve" meaning -- both correct, genuinely one of the most noticeable grammatical BrE/AmE differences learners will encounter.

KEY VOCABULARY: experience-related nouns (achievement, milestone, turning point, perspective), reflection language (I realised, it taught me, looking back). Intercultural note: what counts as a "big" life experience varies by culture and personal circumstance.

ENTRY DIAGNOSTIC (new at this level -- the same diagnostic-and-revisit loop used at Levels IV and VI).
Before Module 1''s language work begins, complete a short four-skills self-audit with your instructor. It is not graded and it is not a placement test -- you are already placed. Its purpose is to make you the author of your own priorities for this level.

(1) SPEAKING: talk for 90 seconds about a change in your life. Your instructor notes, without correcting you in the moment, where you hesitated and what you avoided saying.
(2) LISTENING: listen once to the Module 1 recording and write down what you understood. Note specifically what you MISSED, not what you caught.
(3) READING: read the Module 1 extract and mark every point where you had to re-read.
(4) WRITING: write six sentences about the same change. Your instructor marks only recurring patterns, not individual errors.

THEN WRITE YOUR PERSONAL FOCUS PLAN: three sentences naming the ONE thing you will work on in each of speaking, listening and writing across this level, each specific enough to be checked. "Improve my English" is not a focus. "Stop translating from my first language before I speak" is.

Keep this plan. Module 10 asks you to return to it and say honestly which aims you met and which you did not. That honesty is the point: a plan you cannot fail is not a plan.'),

('itm_l3_m1_lesson1', 'unt_l3_m1', 2, 'reading', 'Lesson 1.1 -- Have You Ever...? -- Present Perfect for Experience',
'LEARNING OBJECTIVES: (1) form present perfect correctly (have/has + past participle) including common irregular participles, (2) ask "Have you ever...?" questions and answer with "I have/I haven''t (ever)...", (3) use present perfect specifically for unspecified-time life experience, not a single completed action, (4) add a brief reason or reaction to an experience answer, not just a bare "yes/no."

PREREQUISITE KNOWLEDGE: Level II, Module 1 (past simple narration); Level I, Module 7 (irregular past participles overlap partly with irregular past simple forms).

WARM-UP (5 min): Your instructor asks 3 rapid "Have you ever...?" questions and takes a quick show-of-hands count.

PRESENTATION (10 min): "Have you ever visited another country? -- Yes, I have. I''ve visited several, actually. Have you ever tried surfing? -- No, I haven''t, but I''d like to." Present perfect here reports that something has happened at some point, with no specific time attached -- the moment a specific time is named, the conversation naturally shifts to past simple.

GUIDED PRACTICE (10 min): Pair work with 8 "Have you ever...?" prompt cards spanning travel, food, skills, achievements, and minor mishaps; interview each other, noting yes/no answers.

INDEPENDENT PRACTICE / SPEAKING ACTIVITY (10 min): Write 5 real "Have you ever...?" questions of your own and interview a new partner, requiring the partner to add one sentence of reaction or reason to every "yes" answer ("Yes, I have -- it was one of the best weeks of my life"). Then share your most interesting finding with the class.

CRITICAL THINKING / DISCUSSION PROMPT: "Do you think it matters more what experiences someone has had, or how they think and talk about those experiences afterwards? Why?"

LISTENING ACTIVITY (5 min): Listen to a short interview (6-7 exchanges) about life experiences and identify which questions use present perfect and which shift to past simple once a specific time is mentioned.

READING ACTIVITY -- EXTENDED READING & INFERENCE (8 min): Read a short first-person reflection (120-150 words) about a formative life experience. Answer 2 literal comprehension questions and 2 inference questions ("The writer doesn''t say this directly, but what can you infer about how they felt beforehand? What evidence in the text supports your answer?").

WRITING TASK (5 min): Write 4-5 present perfect sentences about your own real experiences, then rewrite one of them adding a specific time and switching correctly to past simple.

PRONUNCIATION PRACTICE (5 min): The contracted, connected form ''ve/''s in natural speech ("I''ve been," "She''s tried") versus the full form used for emphasis or negation; rising intonation on "Have you ever...?" questions as genuinely curious in tone.

VOCABULARY REINFORCEMENT: a present-perfect experience "bingo" -- mingle to find a classmate who matches each experience square.

FORMATIVE ASSESSMENT: Instructor checks the core target error (using past simple where present perfect is needed for unspecified-time experience, and vice versa) during independent practice.

HOMEWORK: Choose your single most meaningful life experience and jot down 4-5 rough notes about it (what, roughly when, why it mattered), ready for Lesson 1.2.

REVISION: Lesson 1.2 opens with learners briefly sharing their homework notes in rough form.

EXTENSION: Add present perfect continuous for an experience still relevant/ongoing ("I''ve been learning Spanish for two years") as a recognition-level preview.'),

('itm_l3_m1_lesson2', 'unt_l3_m1', 3, 'reading', 'Lesson 1.2 -- I Went There in 2019 -- Present Perfect vs. Past Simple in Conversation',
'LEARNING OBJECTIVES: (1) correctly shift from present perfect to past simple once a specific time is mentioned or asked for, (2) ask natural specific-time follow-up questions (When did you...? What was it like?), (3) narrate a real life experience as a short connected mini-story, combining both tenses appropriately, (4) briefly explain the significance of an experience, using "which is why" to connect a fact to its consequence.

PREREQUISITE KNOWLEDGE: Lesson 1.1 (present perfect for experience), Level II Module 9 (sequencing connectors and narrative shape, now extended into a mixed-tense narrative).

WARM-UP (5 min): Your instructor tells a real "Have you ever...?" answer about themselves; the class asks 3 specific-time follow-up questions.

PRESENTATION (10 min): "A: Have you ever lived abroad? B: Yes, I have. I lived in Berlin for a year. A: Really? When did you go? B: I went in 2019, actually. It completely changed how I see my own country -- which is why I''d recommend it to anyone." Present perfect opens the topic; once a specific time is given or asked for, the conversation moves to past simple for the specific event and its details; "which is why" links a stated fact to a personal consequence or opinion.

GUIDED PRACTICE (10 min): Pair work: Learner A shares a real experience (from Lesson 1.1''s homework notes) starting with present perfect; Learner B asks at least 2 specific-time follow-up questions, and Learner A answers in past simple with detail, then swap.

INDEPENDENT PRACTICE / SPEAKING ACTIVITY (10 min): Write and then tell a short (6-8 sentence) mini-story about your chosen experience, correctly combining present perfect (the opening claim) and past simple (the specific narrated detail), including one "which is why" sentence connecting the experience to something it taught you or changed about you. Then tell your mini-story to a small group, who ask at least one genuine follow-up question each.

CRITICAL THINKING / DISCUSSION PROMPT: "Is it possible for a small, ordinary experience to matter just as much as a big, dramatic one? Can you think of an example?"

LISTENING ACTIVITY (5 min): Listen to someone narrating a life experience (8-9 sentences, mixing both tenses) and complete a simple timeline/detail-grid worksheet.

READING ACTIVITY (5 min): Read a short "This changed how I see the world" personal essay excerpt and identify: (a) the present-perfect opening claim, (b) the past-simple specific detail, (c) the stated or implied significance.

WRITING TASK (5 min): Write your mini-story into a clean final short paragraph (6-8 sentences), checked for correct present perfect/past simple shifts.

PRONUNCIATION PRACTICE (5 min): Sentence stress for contrast across a longer utterance -- stressing the shift word itself ("I lived in Berlin for a YEAR" vs. "I''ve LIVED there") -- how stress placement signals which part of a sentence carries new information.

VOCABULARY REINFORCEMENT: a "specific-time" vocabulary bank review (in 2019, a few years ago, when I was younger, back then) matched against the "unspecified-time" bank from Lesson 1.1 (ever, never, so far, in my life).

FORMATIVE ASSESSMENT: Instructor checks the tense-shift accuracy and the presence of a genuine "which is why" (or equivalent) significance statement during the speaking activity.

HOMEWORK: Finalise your mini-story into Module 1''s assignment format, adding at least one more true, specific detail.

REVISION: This lesson opens with the Lesson 1.1 homework-notes recap. Module 1''s Quiz and Assignment draw on both lessons.

EXTENSION: Add a second "which is why" sentence connecting a different consequence, and try substituting "as a result" as an alternative connector with the same function.'),

('itm_l3_m1_quiz', 'unt_l3_m1', 4, 'quiz', 'Module 1 Quiz -- Present Perfect & Life Experience', NULL),

('itm_l3_m1_assignment', 'unt_l3_m1', 5, 'assignment', 'Module 1 Assignment -- A Life Experience That Changed My Perspective',
'INSTRUCTIONS: Write (or record) a short, connected account, 8-10 sentences, of one real life experience that mattered to you. Structure it exactly as this module practised: open with a present-perfect claim (what you have experienced); shift to past simple for the specific time and detail; include at least one discourse marker from this module (in fact/actually/as a matter of fact); include at least one significance connector (which is why/as a result) explaining why the experience mattered; and use at least one phrasal verb or collocation from this module''s list.

GRADING RUBRIC: (1) Grammatical accuracy -- correct present perfect formation and correct, appropriately timed shift to past simple. (2) Vocabulary range -- at least one discourse marker, one significance connector, and one phrasal verb/collocation from this module used correctly. (3) Task completion -- the experience is opened, narrated with specific detail, and its significance is explicitly stated. (4) Communicative quality -- is the reflection genuine and specific, not generic? (5) Discourse coherence & register -- does the account read as one connected, logically ordered piece of writing, and is the register appropriate to a genuine personal reflection?

A grade at or above the platform''s pass threshold marks this module complete.');

INSERT INTO quiz_questions (id, learning_item_id, sequence, prompt, choices_json, correct_index) VALUES
('qq_l3_m1_1', 'itm_l3_m1_quiz', 1, '"___ you ever visited another country?"', '["Do","Did","Are","Have"]', 3),
('qq_l3_m1_2', 'itm_l3_m1_quiz', 2, '"Yes, I ___. I''ve visited several."', '["did","have","do","was"]', 1),
('qq_l3_m1_3', 'itm_l3_m1_quiz', 3, '"I ___ to Berlin in 2019." (a specific time is given)', '["went","have gone","have been","go"]', 0),
('qq_l3_m1_4', 'itm_l3_m1_quiz', 4, '"When ___ you go?"', '["have","do","did","has"]', 2),
('qq_l3_m1_5', 'itm_l3_m1_quiz', 5, '"I''ve never ___ sushi."', '["try","tried","tries","trying"]', 1),
('qq_l3_m1_6', 'itm_l3_m1_quiz', 6, 'Which sentence uses present perfect correctly for unspecified-time experience?', '["I have visited Paris last year.","I have visit Paris.","I visited Paris ever.","I have visited Paris."]', 3),
('qq_l3_m1_7', 'itm_l3_m1_quiz', 7, '"I lived in Berlin for a year. ___, it changed how I see my own country."', '["In fact","Which is why","Actually","It completely changed"]', 2),
('qq_l3_m1_8', 'itm_l3_m1_quiz', 8, '"It taught me a lot about independence -- ___ I''d recommend it to anyone."', '["which is why","in fact","actually","so far"]', 0),
('qq_l3_m1_9', 'itm_l3_m1_quiz', 9, 'In American English, the past participle of "get" (meaning "become/improve") is often:', '["gotten","got","getting","get"]', 0),
('qq_l3_m1_10', 'itm_l3_m1_quiz', 10, 'Which phrase means "become familiar or comfortable with something over time"?', '["grow up","look back on","get used to","make an impression"]', 2);

-- ---------------------------------------------------------------------
-- Module 2: Education & Learning
-- Full prose version: docs/curriculum/level-3/module-02-education-learning.md
-- ---------------------------------------------------------------------
INSERT INTO units (id, course_id, sequence, title) VALUES
  ('unt_l3_m2', 'crs_level_3', 2, 'Module 2: Education & Learning');

INSERT INTO learning_items (id, unit_id, sequence, kind, title, body) VALUES
('itm_l3_m2_overview', 'unt_l3_m2', 1, 'reading', 'Module Overview & Key Phrases',
'KEY PHRASES: I''ve been studying... for/since... -- a course that.../a subject which... -- What I find most useful is... -- In other words,.../To put it another way,... -- According to the talk/text,...

DISCOURSE MARKERS (functional set -- rephrasing and attributing): "in other words", "to put it another way" (signal a paraphrase); "according to" (attribute an idea to its source).

PHRASAL VERBS & COLLOCATIONS: "keep up with [coursework]" (stay on schedule with ongoing work), "fall behind" (stop keeping pace), "take in [information]" (absorb/understand), "make notes/take notes", "hands-on learning" (learning through direct practice).

BrE / AmE NOTE: British "university" and American "college" are both used for higher education generally, but American English also uses "college" specifically for a 4-year undergraduate institution (a British "college" more often means a secondary or further-education institution, or a division within a university); British students "do a degree" or "read a subject" ("she read law at university"), while American students "major in a subject"; British "marks" vs. American "grades" for assessment results.

KEY VOCABULARY: academic vocabulary I (lecture, seminar, assignment, deadline, coursework, tutor/professor, plagiarism, independent study), study-habit vocabulary (procrastinate, revise, cram, prioritise). Intercultural note: educational systems and study expectations vary significantly by country.'),

('itm_l3_m2_lesson1', 'unt_l3_m2', 2, 'reading', 'Lesson 2.1 -- I''ve Been Studying... -- Present Perfect Continuous & Defining Relative Clauses',
'LEARNING OBJECTIVES: (1) form present perfect continuous correctly (have/has been + -ing), (2) use it to describe an activity that started in the past and continues now, with for/since, (3) form a defining relative clause with who/which/that to specify exactly which person, course, or thing you mean, (4) combine both structures to describe your own study situation precisely.

PREREQUISITE KNOWLEDGE: Level III, Module 1 (present perfect simple); Level I, Module 3 (present simple for routine, the "non-continuing" contrast point).

WARM-UP (5 min): Your instructor states how long they''ve been teaching and elicits a guess from learners on the structure''s meaning.

PRESENTATION (10 min): "I''ve been studying English since 2022. I''ve been taking a course that focuses on business communication." Present perfect continuous emphasises the ongoing, continuing nature of an activity (contrast with Module 1''s present perfect simple); the defining relative clause ("a course that focuses on...") specifies exactly which course, with no comma.

GUIDED PRACTICE (10 min): Combine 8 sentence pairs into one sentence using a defining relative clause, then add a present perfect continuous sentence about your own real study history.

INDEPENDENT PRACTICE / SPEAKING ACTIVITY (10 min): Write 4-5 sentences describing your own English-learning journey so far, using present perfect continuous for duration and at least 2 defining relative clauses, then compare with a partner. Then join a short "who has been studying longest?" whole-class poll.

CRITICAL THINKING / DISCUSSION PROMPT: "Do you think the amount of time someone has spent studying something always matches how good they are at it? Why or why not?"

LISTENING ACTIVITY (5 min): Listen to a student describing their course of study and complete a simple fact-grid worksheet.

READING ACTIVITY -- EXTENDED READING & INFERENCE (8 min): Read a short university-life text (150 words) about a student''s study routine. Answer 2 literal questions and 2 inference questions.

WRITING TASK (5 min): Write 4-5 sentences describing something you''ve been doing for a period of time, including at least one defining relative clause.

PRONUNCIATION PRACTICE (5 min): The connected, weak-form pronunciation of "been" in fast speech ("I''ve been STUDying") versus its stressed form in short answers; "that/which/who" as unstressed function words within a defining relative clause.

VOCABULARY REINFORCEMENT: an academic-vocabulary matching game (lecture, seminar, assignment, deadline, coursework, tutor, plagiarism, independent study) paired with simple definitions.

FORMATIVE ASSESSMENT: Instructor checks correct present perfect continuous formation with for/since, and correct defining relative clause formation, during independent practice.

HOMEWORK: Note 3 real facts about your own learning history, ready for Lesson 2.2''s note-taking and summarising practice.

REVISION: Lesson 2.2 opens with a brief recap using the homework facts as note-taking material.

EXTENSION: Add a non-defining relative clause example for contrast (recognition only) -- e.g. "My English teacher, who has taught for ten years, ..."'),

('itm_l3_m2_lesson2', 'unt_l3_m2', 3, 'reading', 'Lesson 2.2 -- Taking Notes -- Note-Taking, Summarising & Paraphrasing',
'LEARNING OBJECTIVES: (1) take brief, structured notes from a short spoken talk, capturing main points rather than every word, (2) summarise a short text or talk in 2-3 sentences, in your own words, (3) paraphrase a specific sentence without changing its meaning, (4) use "in other words"/"to put it another way" to signal you are rephrasing.

PREREQUISITE KNOWLEDGE: Lesson 2.1 (academic vocabulary, listening for detail).

WARM-UP (5 min): Your instructor reads a short paragraph aloud once, at normal speed; write down only the 3 most important words or ideas you caught.

PRESENTATION (10 min): A simple, practical note-taking system: headings, short phrases (not full sentences), abbreviations and symbols (&, w/, ->, e.g.), and numbers/bullets for structure. Summarising a short paragraph aloud in one sentence, and paraphrasing a specific sentence ("Many students find it difficult to manage their time" -> "In other words, time management is a common challenge for students") -- paraphrasing keeps roughly the same length and detail, just different words; summarising deliberately shortens.

GUIDED PRACTICE (10 min): Listen to a short talk (played twice) and take notes using the modelled system, then compare notes with a partner and discuss what each of you chose to include or leave out, and why.

INDEPENDENT PRACTICE / SPEAKING ACTIVITY (10 min): Using your notes, write a 2-3 sentence summary of the talk, then paraphrase one specific sentence from a short written excerpt of the same topic, using "in other words"/"to put it another way." Then explain your summary to a partner from your notes alone.

CRITICAL THINKING / DISCUSSION PROMPT: "When you take notes, how do you decide what''s important enough to write down and what isn''t? Is this a skill you think can be taught, or does it just come with practice?"

LISTENING ACTIVITY (5 min): Listen to a second, different short talk and take notes independently, then self-check against 3 key points the instructor names afterward.

READING ACTIVITY (5 min): Read a short academic-style paragraph and write one paraphrase sentence and one one-sentence summary of it.

WRITING TASK (5 min): Using your Lesson 2.1 homework facts, write a short paragraph about your own learning journey that includes one paraphrased idea using "in other words."

PRONUNCIATION PRACTICE (5 min): Natural stress and pacing for summarising aloud -- slightly slower, more clearly stressed key words than casual conversation.

VOCABULARY REINFORCEMENT: a note-taking abbreviation/symbol matching game (&, w/, ->, e.g., i.e., etc.).

FORMATIVE ASSESSMENT: Instructor checks that summaries are genuinely shorter and in the learner''s own words, and that paraphrases preserve meaning, during independent practice.

HOMEWORK: Draft your reflective learning-journey paragraph into a fuller version for Module 2''s assignment.

REVISION: This lesson opens with the Lesson 2.1 fact recap used as note-taking material. Module 2''s Quiz and Assignment draw on both lessons.

EXTENSION: Summarise the same talk in exactly one sentence, forcing a sharper judgement about the single most essential point.'),

('itm_l3_m2_quiz', 'unt_l3_m2', 4, 'quiz', 'Module 2 Quiz -- Education & Learning', NULL),

('itm_l3_m2_assignment', 'unt_l3_m2', 5, 'assignment', 'Module 2 Assignment -- My Learning Journey -- A Short Reflective Report',
'INSTRUCTIONS: Write (or record) a short reflective report, 10-12 sentences, about your own experience learning English (or another subject of your choice). Include: at least one present perfect continuous sentence describing how long you''ve been studying; at least two defining relative clauses specifying particular courses, resources, or people; a short summary (2-3 sentences) of what you find most useful about how you study; and at least one paraphrase using "in other words" or "to put it another way."

GRADING RUBRIC: (1) Grammatical accuracy -- correct present perfect continuous formation, correct defining relative clause formation. (2) Vocabulary range -- at least 4 distinct academic/study-habit words used correctly, plus one phrasal verb/collocation from this module. (3) Task completion -- duration statement, defining relative clauses, a genuine summary, and a paraphrase all present. (4) Communicative quality -- is the reflection genuinely specific about the writer''s own real learning process, not generic? (5) Discourse coherence & register -- does the report read as one connected reflective piece with an appropriate semi-formal academic register, and is the summary genuinely condensed rather than just copied from earlier sentences?

A grade at or above the platform''s pass threshold marks this module complete.');

INSERT INTO quiz_questions (id, learning_item_id, sequence, prompt, choices_json, correct_index) VALUES
('qq_l3_m2_1', 'itm_l3_m2_quiz', 1, '"I''ve ___ studying English since 2022."', '["be","was","being","been"]', 3),
('qq_l3_m2_2', 'itm_l3_m2_quiz', 2, '"I''m taking a course ___ focuses on marketing."', '["who","which","where","when"]', 1),
('qq_l3_m2_3', 'itm_l3_m2_quiz', 3, 'Which sentence uses a correct defining relative clause?', '["I''m taking a course that focuses on marketing.","I''m taking a course, that focuses on marketing.","I''m taking a course which it focuses on marketing.","I''m taking a course focuses on marketing."]', 0),
('qq_l3_m2_4', 'itm_l3_m2_quiz', 4, '"___, time management is a common challenge for students." (a paraphrase signal)', '["According to","As a matter of fact","In other words","Which is why"]', 2),
('qq_l3_m2_5', 'itm_l3_m2_quiz', 5, 'What is the main difference between summarising and paraphrasing?', '["They are exactly the same thing.","Summarising shortens; paraphrasing keeps similar length but different words.","Paraphrasing always uses the exact same words.","Summarising is only for spoken language."]', 1),
('qq_l3_m2_6', 'itm_l3_m2_quiz', 6, '"I''ve been ___ this book for two weeks."', '["read","reads","to read","reading"]', 3),
('qq_l3_m2_7', 'itm_l3_m2_quiz', 7, 'In British English, a student who studies law at university would say:', '["I major in law.","I take law.","I read law.","I grade in law."]', 2),
('qq_l3_m2_8', 'itm_l3_m2_quiz', 8, 'Which word means "stay on schedule with ongoing coursework"?', '["keep up with","fall behind","take in","cram"]', 0),
('qq_l3_m2_9', 'itm_l3_m2_quiz', 9, '"The teacher ___ I mentioned earlier is running the seminar." (a person, defining clause)', '["who","which","whose","when"]', 0),
('qq_l3_m2_10', 'itm_l3_m2_quiz', 10, 'Good note-taking generally means:', '["writing down every word the speaker says","memorising instead of writing","writing only headings and short phrases capturing main points","copying the speaker''s exact sentences"]', 2);

-- ---------------------------------------------------------------------
-- Module 3: Work, Careers & Entrepreneurship
-- Full prose version: docs/curriculum/level-3/module-03-work-careers-entrepreneurship.md
-- ---------------------------------------------------------------------
INSERT INTO units (id, course_id, sequence, title) VALUES
  ('unt_l3_m3', 'crs_level_3', 3, 'Module 3: Work, Careers & Entrepreneurship');

INSERT INTO learning_items (id, unit_id, sequence, kind, title, body) VALUES
('itm_l3_m3_overview', 'unt_l3_m3', 1, 'reading', 'Module Overview & Key Phrases',
'KEY PHRASES: If you..., you... (general fact) -- If we..., we''ll... (real future possibility) -- I''d like to propose... -- One challenge we might face is... -- My plan is to... -- Any questions?

DISCOURSE MARKERS (functional set -- cause/effect, professional register): "as a result", "therefore", "this means that" -- used to connect a workplace cause to its consequence in a more formal register than Level II''s so/because.

PHRASAL VERBS & COLLOCATIONS: "set up a business" (start a company), "come up with [an idea]" (think of/invent an idea), "take a risk/take on a risk", "run a company" (manage/operate a business day to day), "scale up" (grow a business''s operations).

BrE / AmE NOTE: job-application vocabulary differs: British "CV" (curriculum vitae) vs. American "resume/résumé" for the same document; British "made redundant" (a position is eliminated) vs. American "laid off"; British "line manager" vs. American "manager/supervisor" for one''s direct superior.

KEY VOCABULARY: workplace vocabulary (deadline, target, client, colleague, promotion, workload), entrepreneurship vocabulary (start-up, funding, investor, launch, competitor, revenue), leadership vocabulary (decisive, accountable, delegate, inspire). Intercultural note: attitudes toward risk-taking, hierarchy, and directness in the workplace vary significantly across cultures.'),

('itm_l3_m3_lesson1', 'unt_l3_m3', 2, 'reading', 'Lesson 3.1 -- If You Meet the Deadline... -- Zero Conditional for Workplace Facts & Policies',
'LEARNING OBJECTIVES: (1) form the zero conditional correctly (If + present simple, present simple), (2) use it to state general workplace facts, routines, and policies, (3) distinguish a general truth from a specific, real-future prediction, (4) use "as a result"/"therefore" to connect a workplace cause to its effect.

PREREQUISITE KNOWLEDGE: Level I, Module 3 (present simple for routine/fact -- the zero conditional''s grammatical foundation).

WARM-UP (5 min): Your instructor states one true general workplace rule and asks whether the same rule is generally true where you''ve worked or studied.

PRESENTATION (10 min): "If you meet a deadline, your manager is satisfied. If a team communicates well, projects usually go more smoothly. Demand has grown this year. As a result, the company needs to hire more staff." The zero conditional states something generally, reliably true using present simple in both clauses; "as a result" and "therefore" connect a stated fact to its typical workplace consequence, a more formal register than "so."

GUIDED PRACTICE (10 min): Complete 8 zero-conditional sentence halves about general workplace facts/policies, then add an "as a result"/"therefore" sentence to two of them.

INDEPENDENT PRACTICE / SPEAKING ACTIVITY (10 min): Write 4-5 zero-conditional sentences about general truths in a workplace or field you know, then explain one to a partner, who asks one clarifying question. Then share one particularly interesting workplace "general truth" with the class.

CRITICAL THINKING / DISCUSSION PROMPT: "Do you think most workplace rules exist for good reasons, or are some just tradition with no real purpose anymore? Can you think of an example of each?"

LISTENING ACTIVITY (5 min): Listen to someone describing their company''s general policies (5-6 zero-conditional sentences) and complete a simple policy-summary worksheet.

READING ACTIVITY -- EXTENDED READING & INFERENCE (8 min): Read a short workplace-culture article excerpt (150 words) describing general practices at a generic, unnamed company. Answer 2 literal questions and 2 inference questions.

WRITING TASK (5 min): Write 4-5 zero-conditional sentences about general facts or policies in a field you''re interested in, including at least one "as a result"/"therefore" connector.

PRONUNCIATION PRACTICE (5 min): Sentence stress that falls on the key content words in a zero-conditional sentence ("If you MEET the DEADline, your MANager is SATisfied") rather than on the function words.

VOCABULARY REINFORCEMENT: a workplace-vocabulary matching game (deadline, target, client, colleague, promotion, workload) with simple definitions.

FORMATIVE ASSESSMENT: Instructor checks correct zero-conditional formation (present simple in both clauses, not a mix with "will") during independent practice.

HOMEWORK: Think of one real or realistic business idea and jot down 3-4 rough notes about it, ready for Lesson 3.2''s pitch task.

REVISION: Lesson 3.2 opens with learners briefly describing their homework business idea in one sentence.

EXTENSION: Add one zero-conditional sentence about a scientific or natural general truth (not workplace-related) -- e.g. "If you heat water to 100C, it boils."'),

('itm_l3_m3_lesson2', 'unt_l3_m3', 3, 'reading', 'Lesson 3.2 -- If We Launch This Product... -- First Conditional & Pitching a Business Idea',
'LEARNING OBJECTIVES: (1) form the first conditional correctly (If + present simple, will + base verb), (2) use it to describe a real, specific future possibility, (3) structure and deliver a short prepared talk (a "pitch") with a clear idea, at least one benefit, and one acknowledged challenge, (4) respond calmly and clearly to an unscripted follow-up question.

PREREQUISITE KNOWLEDGE: Lesson 3.1 (zero conditional, workplace vocabulary).

WARM-UP (5 min): Your instructor contrasts one zero-conditional sentence and one first-conditional sentence about the same general topic and asks you to identify the difference in meaning.

PRESENTATION (10 min): "If we launch this product in spring, we''ll reach more customers before summer. If demand is high, we''ll need more funding. One challenge we might face is competition -- if a competitor launches something similar first, we''ll need a clear advantage." First conditional describes one real, specific possible future situation and its likely result. A short pitch structure: the idea (what it is, in one sentence) -> the benefit (why it matters, using a first-conditional sentence) -> one challenge, acknowledged honestly -> a brief closing invitation for questions.

GUIDED PRACTICE (10 min): Pair work: take turns pitching a simple, pre-given business idea (from prompt cards) to a partner using the four-part structure, with the partner asking one follow-up question at the end.

INDEPENDENT PRACTICE (10 min): Develop your own homework business idea into a full short pitch (4-5 sentences: idea, benefit using first conditional, one honest challenge, an invitation for questions), and rehearse it once.

SPEAKING ACTIVITY -- PRESENTATION TASK: Deliver your 60-90 second pitch to a small group (or the whole class), who listen and ask at least one genuine follow-up question each. Respond to at least one question on the spot, unscripted.

CRITICAL THINKING / DISCUSSION PROMPT: "When someone pitches you an idea and honestly admits a challenge or weakness, does that make you trust the idea more or less? Why?"

LISTENING ACTIVITY (5 min): Listen to a short business pitch and identify its idea, benefit, acknowledged challenge, and the presenter''s answer to a follow-up question.

READING ACTIVITY (5 min): Read a short written pitch summary (a one-paragraph business proposal) and label its four structural parts.

WRITING TASK (5 min): Write your pitch as a clean short written version (5-6 sentences), checked for correct first-conditional formation.

PRONUNCIATION PRACTICE (5 min): Confident, clear delivery pace and pausing for a prepared talk, plus falling intonation on statements of fact to sound assured rather than hesitant.

VOCABULARY REINFORCEMENT: an entrepreneurship-vocabulary matching game (start-up, funding, investor, launch, competitor, revenue) with simple definitions.

FORMATIVE ASSESSMENT: Instructor checks correct first-conditional formation and a genuine four-part pitch structure during the presentation task.

HOMEWORK: Refine your pitch based on any feedback received, ready for Module 3''s assignment.

REVISION: This lesson opens with the Lesson 3.1 business-idea one-sentence recap. Module 3''s Quiz and Assignment draw on both lessons.

EXTENSION: Add a second first-conditional sentence addressing what happens if the acknowledged challenge actually occurs.'),

('itm_l3_m3_quiz', 'unt_l3_m3', 4, 'quiz', 'Module 3 Quiz -- Work, Careers & Entrepreneurship', NULL),

('itm_l3_m3_assignment', 'unt_l3_m3', 5, 'assignment', 'Module 3 Assignment -- Pitch a Business Idea',
'INSTRUCTIONS: Record yourself (or perform live) delivering a short business pitch, 60-90 seconds. Your pitch must include: at least one zero-conditional sentence stating a general truth relevant to your idea or its market; at least two first-conditional sentences describing real future possibilities (a benefit, and what happens if a challenge occurs); one honestly acknowledged challenge; and a closing invitation for questions, followed by a written answer to one likely question someone might ask.

GRADING RUBRIC: (1) Grammatical accuracy -- correct zero-conditional and first-conditional formation, used in the right context for each. (2) Vocabulary range -- at least 4 distinct workplace/entrepreneurship words used correctly, plus one phrasal verb/collocation from this module. (3) Task completion -- idea, benefit, honest challenge, and question-response all present. (4) Communicative quality -- is the idea genuinely specific and understandable, and does the acknowledged challenge sound honest rather than token? (5) Discourse coherence & register -- does the pitch use professional-register connectors appropriately, and does it flow as one persuasive, connected talk?

A grade at or above the platform''s pass threshold marks this module complete.');

INSERT INTO quiz_questions (id, learning_item_id, sequence, prompt, choices_json, correct_index) VALUES
('qq_l3_m3_1', 'itm_l3_m3_quiz', 1, '"If you ___ a deadline, your manager is satisfied." (a general fact)', '["will meet","met","meeting","meet"]', 3),
('qq_l3_m3_2', 'itm_l3_m3_quiz', 2, '"If we launch this product in spring, we ___ more customers." (a real future possibility)', '["reach","will reach","reached","reaching"]', 1),
('qq_l3_m3_3', 'itm_l3_m3_quiz', 3, 'Which sentence is a general truth (zero conditional), not a specific future prediction?', '["If a business doesn''t adapt, it fails.","If we hire more staff, we''ll meet the target.","If it rains tomorrow, we''ll cancel the launch.","If sales increase next month, we''ll expand."]', 0),
('qq_l3_m3_4', 'itm_l3_m3_quiz', 4, '"Demand has grown this year. ___, the company needs to hire more staff."', '["If","Even though","As a result","Unless"]', 2),
('qq_l3_m3_5', 'itm_l3_m3_quiz', 5, '"If demand is high, we ___ more funding."', '["need","will need","needed","needing"]', 1),
('qq_l3_m3_6', 'itm_l3_m3_quiz', 6, 'In British English, the document you send when applying for a job is usually called a:', '["resume","portfolio","bio","CV"]', 3),
('qq_l3_m3_7', 'itm_l3_m3_quiz', 7, 'A good short pitch typically includes the idea, the benefit, and also:', '["a list of every possible feature","a guarantee of success","an honestly acknowledged challenge","no questions allowed"]', 2),
('qq_l3_m3_8', 'itm_l3_m3_quiz', 8, 'Which phrase means "start a company"?', '["set up a business","run a company","scale up","take a risk"]', 0),
('qq_l3_m3_9', 'itm_l3_m3_quiz', 9, '"If a competitor launches something similar, we ___ a clear advantage."', '["will need","need","needed","needing"]', 0),
('qq_l3_m3_10', 'itm_l3_m3_quiz', 10, 'Which word describes someone who takes responsibility for their decisions?', '["decisive","delegate","accountable","inspire"]', 2);

-- ---------------------------------------------------------------------
-- Module 4: Opinions & Debate
-- Full prose version: docs/curriculum/level-3/module-04-opinions-debate.md
-- ---------------------------------------------------------------------
INSERT INTO units (id, course_id, sequence, title) VALUES
  ('unt_l3_m4', 'crs_level_3', 4, 'Module 4: Opinions & Debate');

INSERT INTO learning_items (id, unit_id, sequence, kind, title, body) VALUES
('itm_l3_m4_overview', 'unt_l3_m4', 1, 'reading', 'Module Overview & Key Phrases',
'KEY PHRASES: In my view,.../From my perspective,... -- I would argue that... -- Although..., I still think... -- I see your point, but... -- I''d have to disagree, because... -- That''s a fair point, however...

DISCOURSE MARKERS (functional set -- contrast within an argument): "although", "however", "on the other hand", "whereas" -- used to hold two ideas in tension within a single, more sophisticated opinion.

PHRASAL VERBS & COLLOCATIONS: "back up [an argument]" (support a claim with evidence), "bring up [a point]" (introduce a topic), "get across [an idea]" (successfully communicate it), "stand by [an opinion]" (continue to support it when challenged), "weigh up [the pros and cons]" (carefully consider both sides).

BrE / AmE NOTE: the word "quite" is a genuine false-friend between the two varieties with a gradable adjective: in British English, "That''s quite good" often means moderately good; in American English, "That''s quite good" more often means very good.

KEY VOCABULARY: opinion/argument vocabulary (perspective, standpoint, counter-argument, evidence, concede, persuasive), leadership vocabulary recycled from Module 3 (decisive, accountable, delegate, inspire). Intercultural note: how directly people are expected to disagree in a discussion varies significantly by culture.'),

('itm_l3_m4_lesson1', 'unt_l3_m4', 2, 'reading', 'Lesson 4.1 -- In My View... -- Structured Opinion Language',
'LEARNING OBJECTIVES: (1) state an opinion using a range of formal opinion phrases (in my view, from my perspective, I would argue that), (2) justify an opinion with at least one clear reason, (3) use although/however to acknowledge a counter-point within your own argument, (4) recognise the difference in strength between a tentative opinion and a firmly stated one.

PREREQUISITE KNOWLEDGE: Level II, Module 4 (basic opinion-giving: I think.../I don''t think...).

WARM-UP (5 min): Your instructor states one opinion using "I think..." and then restates it using formal language ("In my view..."); which sounds more suited to a serious discussion?

PRESENTATION (10 min): "In my view, remote work benefits most employees. I would argue that it improves focus and reduces wasted commuting time. Although some people miss the social side of an office, I still think the benefits outweigh that drawback." Formal opinion phrases sound more considered than "I think"; a reason makes an opinion an argument, not just a preference; "although" acknowledges a real counter-point without abandoning your position.

GUIDED PRACTICE (10 min): You are given 6 opinion prompts and build a full opinion statement for each using a formal phrase + a reason + an "although" counter-point acknowledgement.

INDEPENDENT PRACTICE / SPEAKING ACTIVITY (10 min): Choose one topic you genuinely have an opinion on and prepare a 3-4 sentence structured opinion, then share it with a partner, who identifies the opinion, the reason, and the counter-point. Share one particularly persuasive opinion with the class.

CRITICAL THINKING / DISCUSSION PROMPT: "Do you think acknowledging the other side of an argument makes your own opinion seem weaker, or actually stronger? Why?"

LISTENING ACTIVITY (5 min): Listen to someone giving a structured opinion and identify each of the three parts on a simple worksheet.

READING ACTIVITY -- EXTENDED READING & INFERENCE (8 min): Read a short opinion-column excerpt (150-180 words) on a generic, everyday debatable topic. Answer 2 literal questions and 2 inference questions.

WRITING TASK (5 min): Write a structured opinion paragraph (4-5 sentences) on a topic of your choice, using a formal opinion phrase, a reason, and an although/however counter-point.

PRONUNCIATION PRACTICE (5 min): Falling intonation for a firmly stated opinion ("In my VIEW, remote work BENefits most employees") versus a more level, tentative intonation for a hedged opinion.

VOCABULARY REINFORCEMENT: an opinion-strength card-sorting game: sort 9 opinion phrases from tentative to firm.

FORMATIVE ASSESSMENT: Instructor checks that opinions include a genuine reason and a genuine although/however counter-point during independent practice.

HOMEWORK: Choose a position on "What makes a good leader?" and prepare 2-3 reasons for Lesson 4.2''s debate.

REVISION: Lesson 4.2 opens with learners briefly stating their homework position in one sentence.

EXTENSION: Add a second although counter-point addressing a different possible objection to your opinion.'),

('itm_l3_m4_lesson2', 'unt_l3_m4', 3, 'reading', 'Lesson 4.2 -- I See Your Point, But... -- Formal Agreement, Disagreement & Debate',
'LEARNING OBJECTIVES: (1) fully agree, partially agree, or disagree with an opinion using appropriate formal language, (2) respond to a counter-argument without becoming personal or dismissive, (3) participate in a structured debate: state a position, respond to a challenge, and (where genuinely warranted) concede a fair point, (4) discuss leadership qualities with justified reasons.

PREREQUISITE KNOWLEDGE: Lesson 4.1 (structured opinion language), Level II Module 4 (basic agree/disagree language, now formalised).

WARM-UP (5 min): Your instructor states a debatable opinion and asks 3 learners in turn to respond with full agreement, partial agreement, and disagreement respectively.

PRESENTATION (10 min): The agreement/disagreement scale: FULL AGREEMENT ("I completely agree -- in fact,..."), PARTIAL AGREEMENT ("I see your point, but I''m not sure that''s true in every case..."), DISAGREEMENT ("I''d have to disagree, because...", "That''s a fair point, however I think..."), and CONCEDING A POINT ("That''s true, I hadn''t considered that -- although I still think..."). A strong debater genuinely listens and can concede a fair point without abandoning their overall position -- a mark of a stronger arguer, not a weaker one.

GUIDED PRACTICE (10 min): Pair work: Learner A states an opinion from a prompt card; Learner B responds using one of the four response types (rotating), then discuss what changed about the tone with each response type.

INDEPENDENT PRACTICE (10 min): In small groups, hold a structured 3-round mini-debate on "What makes a good leader?": Round 1 -- each person states their position with a reason; Round 2 -- each person responds to one other person''s position; Round 3 -- each person gives a brief closing statement, conceding at least one fair point if genuinely warranted.

SPEAKING ACTIVITY -- PRESENTATION/DISCUSSION TASK: The 3-round mini-debate above. Groups briefly report their range of positions to the class afterward.

CRITICAL THINKING / DISCUSSION PROMPT: "Have you ever changed your mind during a discussion because someone made a good point? What was it that convinced you?"

LISTENING ACTIVITY (5 min): Listen to a short debate exchange (2 speakers, 3-4 turns) and classify each response as full agreement, partial agreement, disagreement, or a conceded point.

READING ACTIVITY (5 min): Read a short written debate transcript excerpt and identify one example of each of the four response types.

WRITING TASK (5 min): Write a short written response (4-5 sentences) to an opinion given in a prompt, using partial agreement followed by a clearly reasoned disagreement on one specific point.

PRONUNCIATION PRACTICE (5 min): Calm, level intonation for disagreement (avoiding a sharp, confrontational pitch) and warmer, validating intonation for conceding a point genuinely.

VOCABULARY REINFORCEMENT: a response-type matching game (opinion statements matched to an appropriate response).

FORMATIVE ASSESSMENT: Instructor checks that disagreement stays respectful and reasoned, and that at least one genuine concession occurs somewhere in each group''s debate.

HOMEWORK: Write a short reflection (3-4 sentences) on which leadership quality you found most convincing across the debate and why, ready for Module 4''s assignment.

REVISION: This lesson opens with the Lesson 4.1 position recap. Module 4''s Quiz and Assignment draw on both lessons.

EXTENSION: Research (or reason through) a counter-argument to your own original position and present it fairly.'),

('itm_l3_m4_quiz', 'unt_l3_m4', 4, 'quiz', 'Module 4 Quiz -- Opinions & Debate', NULL),

('itm_l3_m4_assignment', 'unt_l3_m4', 5, 'assignment', 'Module 4 Assignment -- Structured Debate -- What Makes a Good Leader?',
'INSTRUCTIONS: Record yourself (or perform live with a partner or small group) a structured discussion, 90 seconds to 2 minutes, on "What makes a good leader?" Your contribution must include: a clearly stated position using a formal opinion phrase and at least one reason; at least one although/however counter-point acknowledgement within your own argument; at least one response to someone else''s point using full agreement, partial agreement, or disagreement language; and one genuinely conceded point.

GRADING RUBRIC: (1) Grammatical accuracy -- correct formal opinion structures, correct although/however contrast formation. (2) Vocabulary range -- at least 3 distinct opinion/argument words or phrases used correctly, plus one phrasal verb/collocation from this module. (3) Task completion -- position, reason, counter-point acknowledgement, a response to another view, and a genuine concession all present. (4) Communicative quality -- is the argument genuinely reasoned and specific, not a vague generalisation? (5) Discourse coherence & register -- is the register appropriately formal for a structured debate, and does the contribution stay respectful and evidence-based throughout, even in disagreement?

A grade at or above the platform''s pass threshold marks this module complete.');

INSERT INTO quiz_questions (id, learning_item_id, sequence, prompt, choices_json, correct_index) VALUES
('qq_l3_m4_1', 'itm_l3_m4_quiz', 1, '"___, remote work benefits most employees." (a formal opinion phrase)', '["I think","Maybe","In my view","Sort of"]', 2),
('qq_l3_m4_2', 'itm_l3_m4_quiz', 2, '"Although some people miss the office, I ___ think the benefits outweigh that."', '["still","never","don''t","barely"]', 0),
('qq_l3_m4_3', 'itm_l3_m4_quiz', 3, 'Which response shows partial agreement?', '["I completely agree.","I''d have to disagree.","That''s completely wrong.","I see your point, but I''m not sure that''s true in every case."]', 3),
('qq_l3_m4_4', 'itm_l3_m4_quiz', 4, '"That''s a fair point, ___ I still think my original idea is stronger."', '["so","however","because","if"]', 1),
('qq_l3_m4_5', 'itm_l3_m4_quiz', 5, 'Which phrase means "support a claim with evidence or reasons"?', '["back up","bring up","get across","weigh up"]', 0),
('qq_l3_m4_6', 'itm_l3_m4_quiz', 6, 'In British English, "That''s quite good" often means:', '["very good","not good at all","moderately good","perfect"]', 2),
('qq_l3_m4_7', 'itm_l3_m4_quiz', 7, 'Conceding a fair point during a debate generally suggests:', '["a weak argument","a thoughtful, genuinely listening arguer","that you have lost","that you agree with everything"]', 1),
('qq_l3_m4_8', 'itm_l3_m4_quiz', 8, '"___ some people prefer working alone, others do their best work in a team."', '["Because","So","If","Whereas"]', 3),
('qq_l3_m4_9', 'itm_l3_m4_quiz', 9, 'Which phrase means "introduce a topic or idea into a discussion"?', '["stand by","weigh up","back up","bring up"]', 3),
('qq_l3_m4_10', 'itm_l3_m4_quiz', 10, '"I''d have to disagree, ___ the evidence doesn''t support that claim."', '["although","because","however","but still"]', 1);

-- ---------------------------------------------------------------------
-- Module 5: Environment, Ethics & Global Citizenship
-- Full prose version: docs/curriculum/level-3/module-05-environment-ethics-global-citizenship.md
-- ---------------------------------------------------------------------
INSERT INTO units (id, course_id, sequence, title) VALUES
  ('unt_l3_m5', 'crs_level_3', 5, 'Module 5: Environment, Ethics & Global Citizenship');

INSERT INTO learning_items (id, unit_id, sequence, kind, title, body) VALUES
('itm_l3_m5_overview', 'unt_l3_m5', 1, 'reading', 'Module Overview & Key Phrases',
'KEY PHRASES: [Something] is done/is made/is used... -- [Something] was affected/was caused/was reduced... -- As a consequence,.../This has led to... -- Due to.../Owing to... -- On the one hand..., on the other hand...

DISCOURSE MARKERS (functional set -- formal cause and consequence): "as a consequence", "this has led to", "due to", "owing to" -- a more formal register than Module 3''s "as a result," suited to reporting on issues.

PHRASAL VERBS & COLLOCATIONS: "carry out [a study/research]" (conduct it), "cut down [trees]", "give rise to [a problem]" (cause something to begin or develop), "take action (on)" (do something in response to an issue), "phase out [something]" (gradually stop using something over time).

BrE / AmE NOTE: British "rubbish"/"bin" vs. American "trash/garbage"/"trash can"; British "petrol" vs. American "gas/gasoline" for vehicle fuel -- a pair that can cause real confusion, since British "gas" usually means a cooking/heating gas, not vehicle fuel.

KEY VOCABULARY: environmental vocabulary (emissions, sustainability, renewable, biodiversity, deforestation, pollution), ethics/global-citizenship vocabulary (dilemma, trade-off, responsible, stakeholder, impact). Intercultural note: environmental priorities and what counts as an urgent issue can differ significantly by country and circumstance.'),

('itm_l3_m5_lesson1', 'unt_l3_m5', 2, 'reading', 'Lesson 5.1 -- Plastic Is Recycled... -- Passive Voice, Present Simple',
'LEARNING OBJECTIVES: (1) form the present simple passive correctly (is/are + past participle), (2) use it to describe general processes and facts where the action matters more than who performs it, (3) choose actively vs. passively depending on what should be emphasised, (4) use "as a consequence"/"this has led to"/"due to" to explain cause and effect formally.

PREREQUISITE KNOWLEDGE: Level I, Module 3 (present simple); Level II, Module 4 (opinion language, lightly recycled for the discussion activity).

WARM-UP (5 min): Your instructor shows two versions of the same sentence -- one active ("Factories produce a lot of waste"), one passive ("A lot of waste is produced") -- what feels different about each?

PRESENTATION (10 min): "Plastic is recycled in many countries. Renewable energy is used more and more. Emissions are monitored by environmental agencies." The passive voice shifts focus onto the action or the result, not the doer -- useful when the doer is unknown, unimportant, or already obvious from context.

GUIDED PRACTICE (10 min): Convert 8 active sentences about environmental processes into passive voice, discussing for each whether the passive genuinely improves the sentence or whether the active would actually be clearer.

INDEPENDENT PRACTICE / SPEAKING ACTIVITY (10 min): Write 5 present-simple passive sentences describing a process or general fact related to the environment or global systems, including at least one "as a consequence"/"due to" sentence. Then explain one sentence to a partner, who asks "Why do you think the passive is used here, rather than saying who does it?"

CRITICAL THINKING / DISCUSSION PROMPT: "Can you think of a global issue where it matters a lot who is responsible for a problem, and one where it matters less? What''s the difference?"

LISTENING ACTIVITY (5 min): Listen to a short factual report (6-7 sentences, mostly passive voice) about an environmental process and complete a simple process-sequence worksheet.

READING ACTIVITY -- EXTENDED READING & INFERENCE (8 min): Read a short factual article excerpt (150-180 words) about an environmental or global issue, written largely in passive voice. Answer 2 literal questions and 2 inference questions.

WRITING TASK (5 min): Rewrite 4 active-voice sentences about an environmental topic into passive voice, then explain in one sentence why the passive suits a factual report better here.

PRONUNCIATION PRACTICE (5 min): The natural stress pattern of passive constructions ("Plastic is REcycled," stress on the past participle) and clear, level intonation appropriate to reporting facts neutrally.

VOCABULARY REINFORCEMENT: an environmental-vocabulary matching game (emissions, sustainability, renewable, biodiversity, deforestation, pollution).

FORMATIVE ASSESSMENT: Instructor checks correct passive formation and a genuine understanding of when passive suits the sentence better than active, during guided practice.

HOMEWORK: Choose one real global issue you''re interested in and jot down 3-4 facts about it, ready for Lesson 5.2''s case-study discussion.

REVISION: Lesson 5.2 opens with learners briefly naming their chosen issue.

EXTENSION: Add one present-continuous passive sentence as a recognition-level preview ("Renewable energy is being adopted more widely").'),

('itm_l3_m5_lesson2', 'unt_l3_m5', 3, 'reading', 'Lesson 5.2 -- The Area Was Affected... -- Passive Voice, Past Simple & an Ethical Case Study',
'LEARNING OBJECTIVES: (1) form the past simple passive correctly (was/were + past participle), (2) use it to report a past event where the result matters more than the agent, (3) present both sides of an ethical dilemma using "on the one hand.../on the other hand...", (4) participate in a structured case-study discussion, weighing trade-offs rather than giving a single simple answer.

PREREQUISITE KNOWLEDGE: Lesson 5.1 (present simple passive), Level I Module 7 (past simple, the past passive''s grammatical foundation).

WARM-UP (5 min): Your instructor states one real generic past-event sentence in active voice and asks you to convert it to passive.

PRESENTATION (10 min): "The area was affected by flooding last year. A large amount of habitat was destroyed. As a consequence, several species were displaced." Case-study structure: a short, realistic ethical dilemma is presented -- e.g. a coastal town choosing between a new factory (jobs, but pollution risk) and no factory (fewer jobs, cleaner environment). Weighing it explicitly: "On the one hand, the factory would create jobs. On the other hand, it could harm the local environment."

GUIDED PRACTICE (10 min): Convert 6 active past-tense sentences about an environmental event into passive voice, checking past participle accuracy including irregular forms.

INDEPENDENT PRACTICE (10 min): In small groups, you are given one of 3 short ethical case-study scenarios (a resource trade-off, a technology-vs-privacy dilemma, a development-vs-conservation choice) and discuss it, each person contributing at least one "on the one hand/on the other hand" weighing statement and one past-passive sentence reporting a relevant past fact.

SPEAKING ACTIVITY -- PRESENTATION/DISCUSSION TASK: Each group briefly presents their case study and their range of views to the class (1-2 minutes per group).

CRITICAL THINKING / DISCUSSION PROMPT: "Is it possible to make a decision that''s completely good for everyone, or does almost every real decision involve some kind of trade-off? Can you think of an example from your own life?"

LISTENING ACTIVITY (5 min): Listen to a short case-study discussion (2-3 speakers weighing a dilemma) and note each speaker''s "on the one hand/on the other hand" points.

READING ACTIVITY (5 min): Read a short written case study and identify the trade-off being described and at least one passive-voice sentence reporting a past fact within it.

WRITING TASK (5 min): Write a short paragraph (5-6 sentences) presenting both sides of an ethical dilemma of your choice, using "on the one hand/on the other hand" and at least one past-simple passive sentence.

PRONUNCIATION PRACTICE (5 min): The weak-form pronunciation of "was/were" in past passive constructions ("The area was afFECTed").

VOCABULARY REINFORCEMENT: an ethics/global-citizenship vocabulary matching game (dilemma, trade-off, responsible, stakeholder, impact).

FORMATIVE ASSESSMENT: Instructor checks correct past-passive formation and a genuine, balanced weighing of both sides during the case-study discussion.

HOMEWORK: Choose one global issue and draft a short factual report paragraph for Module 5''s assignment.

REVISION: This lesson opens with the Lesson 5.1 issue-naming recap. Module 5''s Quiz and Assignment draw on both lessons.

EXTENSION: Propose one possible compromise or partial solution to your case study''s dilemma.'),

('itm_l3_m5_quiz', 'unt_l3_m5', 4, 'quiz', 'Module 5 Quiz -- Environment, Ethics & Global Citizenship', NULL),

('itm_l3_m5_assignment', 'unt_l3_m5', 5, 'assignment', 'Module 5 Assignment -- A Global Issue -- Report & Reflection',
'INSTRUCTIONS: Write (or record) a short factual report and reflection, 10-12 sentences, on one real global issue you''re interested in. Include: at least 2 present-simple passive sentences describing a general process or fact; at least 2 past-simple passive sentences reporting a specific past event; one "as a consequence"/"due to"-style cause-effect sentence; and a short "on the one hand/on the other hand" section weighing at least two sides of the issue.

GRADING RUBRIC: (1) Grammatical accuracy -- correct present-simple and past-simple passive formation. (2) Vocabulary range -- at least 4 distinct environmental/ethics words used correctly, plus one phrasal verb/collocation from this module. (3) Task completion -- both passive tenses, a cause-effect sentence, and a genuinely balanced trade-off section all present. (4) Communicative quality -- is the issue described with genuine, specific detail, and is the trade-off weighing genuinely balanced? (5) Discourse coherence & register -- is the register appropriately formal and report-like throughout, and does the passive voice genuinely improve clarity where it''s used?

A grade at or above the platform''s pass threshold marks this module complete.');

INSERT INTO quiz_questions (id, learning_item_id, sequence, prompt, choices_json, correct_index) VALUES
('qq_l3_m5_1', 'itm_l3_m5_quiz', 1, '"Plastic ___ in many countries." (present simple passive)', '["recycles","recycling","recycled","is recycled"]', 3),
('qq_l3_m5_2', 'itm_l3_m5_quiz', 2, '"Emissions ___ by environmental agencies."', '["monitor","are monitored","monitoring","monitored by"]', 1),
('qq_l3_m5_3', 'itm_l3_m5_quiz', 3, '"The area ___ by flooding last year." (past simple passive)', '["was affected","affects","affected","is affected"]', 0),
('qq_l3_m5_4', 'itm_l3_m5_quiz', 4, '"A large amount of habitat ___."', '["destroyed","destroys","was destroyed","is destroying"]', 2),
('qq_l3_m5_5', 'itm_l3_m5_quiz', 5, '"Deforestation has increased. ___, biodiversity loss has become a serious issue."', '["Due to","This has led to","On the one hand","Which is why"]', 1),
('qq_l3_m5_6', 'itm_l3_m5_quiz', 6, 'In British English, rubbish is put in a:', '["trash can","garbage can","waste zone","bin"]', 3),
('qq_l3_m5_7', 'itm_l3_m5_quiz', 7, '"___ hand, the factory would create jobs; on the other, it could harm the environment."', '["In one","From one","On the one","At one"]', 2),
('qq_l3_m5_8', 'itm_l3_m5_quiz', 8, 'Which phrase means "gradually stop using something over time"?', '["phase out","carry out","give rise to","cut down"]', 0),
('qq_l3_m5_9', 'itm_l3_m5_quiz', 9, 'Why might a writer choose the passive voice in a factual report?', '["to focus on the action/result rather than who did it","to make the sentence longer","it is always required in reports","to avoid using verbs"]', 0),
('qq_l3_m5_10', 'itm_l3_m5_quiz', 10, '"Several species ___ as a result of the flooding."', '["displaced","displace","were displaced","are displacing"]', 2);

-- ---------------------------------------------------------------------
-- Module 6: Technology & Media
-- Full prose version: docs/curriculum/level-3/module-06-technology-media.md
-- ---------------------------------------------------------------------
INSERT INTO units (id, course_id, sequence, title) VALUES
  ('unt_l3_m6', 'crs_level_3', 6, 'Module 6: Technology & Media');

INSERT INTO learning_items (id, unit_id, sequence, kind, title, body) VALUES
('itm_l3_m6_overview', 'unt_l3_m6', 1, 'reading', 'Module Overview & Key Phrases',
'KEY PHRASES: She said (that).../He told me (that)... -- According to [the article/the review],... -- It is reported that... -- Apparently,... -- That''s a fact, not just an opinion. -- The headline suggests..., but the article actually says...

DISCOURSE MARKERS (functional set -- reporting and attributing): "according to", "it is reported that", "apparently" (a hedge marking information as secondhand, not personally verified).

PHRASAL VERBS & COLLOCATIONS: "come out" (be published/released), "go viral" (spread very quickly online), "keep up with [the news/technology]", "log into/log onto [an account]", "roll out [a new feature]" (gradually release something to users).

BrE / AmE NOTE: British "mobile phone" (or "mobile") vs. American "cell phone" (or "cell") for the same device -- both universally understood internationally, but the default term differs by variety.

KEY VOCABULARY: media/technology vocabulary (headline, source, bias, credible, algorithm, platform, update, feature), media-literacy vocabulary (fact-check, misleading, evidence, context). Intercultural note: trust in different types of media varies significantly by country and personal experience; the critical-evaluation method applies everywhere.'),

('itm_l3_m6_lesson1', 'unt_l3_m6', 2, 'reading', 'Lesson 6.1 -- She Said That... -- Reported Speech for Statements',
'LEARNING OBJECTIVES: (1) report what someone said using "said (that)"/"told [someone] (that)", (2) apply the correct backshift (present -> past, will -> would, can -> could) when reporting a statement, (3) attribute a claim formally using "according to", (4) recognise when backshift is not required (when the reported statement is still generally true).

PREREQUISITE KNOWLEDGE: Level I, Module 7 (past simple); Level II, Module 4 (opinion language, now reported rather than given directly).

WARM-UP (5 min): Your instructor makes one true direct statement and immediately reports it in third person ("I just said that I loved this new app") -- what changed?

PRESENTATION (10 min): Direct: "This app is really easy to use." -> Reported: "The reviewer said (that) the app was really easy to use." Direct: "I''ll update it next week." -> Reported: "She said (that) she would update it next week." The backshift pattern: is -> was, will -> would, can -> could. Exception: if a statement is still generally true at the time of reporting, backshift is often optional.

GUIDED PRACTICE (10 min): Convert 8 direct statements (a mix of technology/media opinions and simple facts) into reported speech, applying correct backshift.

INDEPENDENT PRACTICE / SPEAKING ACTIVITY (10 min): In pairs, Learner A makes 4 real direct statements about technology they use or a piece of media they''ve seen recently; Learner B reports each one back correctly in reported speech, then swap. Then report one interesting statement about your partner to the whole class ("[Name] told me that...").

CRITICAL THINKING / DISCUSSION PROMPT: "When you repeat something someone else said, do you think it''s possible to accidentally change its meaning, even a little? Can you think of an example?"

LISTENING ACTIVITY (5 min): Listen to a short interview, then listen to someone reporting 5 statements from it, and check whether each reported statement accurately reflects what was actually said.

READING ACTIVITY -- EXTENDED READING & INFERENCE (8 min): Read a short news-style text (150-180 words) about a new piece of technology, containing several reported statements from named (generic) sources. Answer 2 literal questions and 2 inference questions.

WRITING TASK (5 min): Write 4-5 reported-speech sentences based on real or invented statements someone has made to you about technology or media, applying correct backshift.

PRONUNCIATION PRACTICE (5 min): The natural, unstressed pronunciation of "that" in reported speech (often dropped or reduced in fast, natural speech -- "She said she''d update it") versus its fuller pronunciation in careful or written-style speech.

VOCABULARY REINFORCEMENT: a backshift-pairs matching game (is/was, will/would, can/could, have/had).

FORMATIVE ASSESSMENT: Instructor checks correct backshift application (and correct recognition of when it''s optional) during independent practice.

HOMEWORK: Find (or recall) one real headline or claim about technology/media you''ve recently seen and bring a one-sentence note of it to Lesson 6.2.

REVISION: Lesson 6.2 opens with learners reporting their homework headline using reported speech.

EXTENSION: Convert one reported statement back into an "according to [source]" attribution sentence.'),

('itm_l3_m6_lesson2', 'unt_l3_m6', 3, 'reading', 'Lesson 6.2 -- Is That Actually True? -- Media Literacy & Evaluating Claims',
'LEARNING OBJECTIVES: (1) distinguish a fact from an opinion in a media text, (2) identify signs of possible bias or a misleading headline, (3) evaluate whether a claim is adequately supported by evidence, (4) discuss the impact of technology on daily life or society, with justified reasons.

PREREQUISITE KNOWLEDGE: Lesson 6.1 (reported speech, attributing claims), Level III Module 4 (opinion/argument language, now applied critically to someone else''s claims).

WARM-UP (5 min): Your instructor shows two headlines about the same generic, invented event -- one neutral, one deliberately sensational -- which seems designed to grab attention rather than simply inform?

PRESENTATION (10 min): A simple evaluation checklist: Is this a fact or an opinion? (a fact can be checked; an opinion is a judgement); Does the headline match the article?; Is a source given?; Could there be bias? (who benefits if you believe this claim?). Apply it to one short example text aloud.

GUIDED PRACTICE (10 min): In pairs, apply the evaluation checklist to 3 short example texts (a mix of well-supported and poorly-supported claims, all generic/invented), discussing your conclusions.

INDEPENDENT PRACTICE / SPEAKING ACTIVITY (10 min): Using your Lesson 6.1 homework headline (or a new one), apply the full evaluation checklist in writing, then discuss your evaluation with a partner, who can challenge or agree with the reasoning. Then join a short whole-group discussion: "How has technology changed the way we get and evaluate information, compared to twenty years ago?"

CRITICAL THINKING / DISCUSSION PROMPT: "Do you think it''s becoming easier or harder to know what''s true online? What''s one thing you personally do (or could do) to check whether something is reliable?"

LISTENING ACTIVITY (5 min): Listen to two short reported claims about technology (one well-supported, one poorly-supported/vague) and identify which is which and why.

READING ACTIVITY (5 min): Read two short article excerpts on the same topic from differently-toned (generic, invented) sources and compare how each frames the same underlying facts.

WRITING TASK (5 min): Write a short evaluation paragraph (5-6 sentences) of one claim, using reported speech to state the claim and your own opinion language to evaluate it.

PRONUNCIATION PRACTICE (5 min): Sceptical, questioning intonation ("Is that ACTually true?") versus neutral, reporting intonation.

VOCABULARY REINFORCEMENT: a media-literacy vocabulary matching game (fact-check, misleading, evidence, context, credible, bias).

FORMATIVE ASSESSMENT: Instructor checks that evaluations are genuinely reasoned (referencing the checklist criteria), not just a gut reaction, during independent practice.

HOMEWORK: Choose one piece of technology you use regularly and prepare 3-4 notes (a fact, an opinion, and a claim about its impact) for Module 6''s assignment.

REVISION: This lesson opens with the Lesson 6.1 headline-reporting recap. Module 6''s Quiz and Assignment draw on both lessons.

EXTENSION: Find (or invent, plausibly) a counter-claim to your chosen technology''s impact, applying the evaluation checklist to both sides.'),

('itm_l3_m6_quiz', 'unt_l3_m6', 4, 'quiz', 'Module 6 Quiz -- Technology & Media', NULL),

('itm_l3_m6_assignment', 'unt_l3_m6', 5, 'assignment', 'Module 6 Assignment -- A Technology Review & Media Critique',
'INSTRUCTIONS: Write (or record) a short review and critique, 10-12 sentences, of one piece of technology or one media claim you''ve recently encountered. Include: at least 2 reported-speech sentences relaying what someone else said or claimed, with correct backshift; at least one "according to"/"apparently"-style attribution; an evaluation of whether the claim is well-supported, referencing at least one checklist criterion from Lesson 6.2; and your own reasoned opinion on the technology''s impact.

GRADING RUBRIC: (1) Grammatical accuracy -- correct reported-speech formation and backshift. (2) Vocabulary range -- at least 4 distinct media/technology words used correctly, plus one phrasal verb/collocation from this module. (3) Task completion -- reported claim, attribution, a reasoned evaluation, and a personal opinion all present. (4) Communicative quality -- is the critique genuinely reasoned, not just a stated gut feeling? (5) Discourse coherence & register -- does the piece distinguish clearly between what was reported and what is the writer''s own evaluation, and is the register appropriately measured and critical?

A grade at or above the platform''s pass threshold marks this module complete.');

INSERT INTO quiz_questions (id, learning_item_id, sequence, prompt, choices_json, correct_index) VALUES
('qq_l3_m6_1', 'itm_l3_m6_quiz', 1, 'Direct: "This app is easy to use." Reported: "The reviewer said (that) the app ___ easy to use."', '["is","be","has been","was"]', 3),
('qq_l3_m6_2', 'itm_l3_m6_quiz', 2, 'Direct: "I''ll update it next week." Reported: "She said (that) she ___ update it next week."', '["will","would","updates","updated"]', 1),
('qq_l3_m6_3', 'itm_l3_m6_quiz', 3, '"___ the article, the update improves battery life."', '["According to","Told","Reported","Said"]', 0),
('qq_l3_m6_4', 'itm_l3_m6_quiz', 4, 'Which is a fact, not an opinion?', '["This is the best app ever made.","Everyone should use this app.","The app was released in March.","This app is amazing."]', 2),
('qq_l3_m6_5', 'itm_l3_m6_quiz', 5, 'Which is a sign a claim might be less reliable?', '["A clear source is named.","No source is given at all.","The claim can be checked.","The headline matches the article."]', 1),
('qq_l3_m6_6', 'itm_l3_m6_quiz', 6, 'In British English, the device most people carry is usually called a:', '["cell phone","hand computer","pocket device","mobile phone"]', 3),
('qq_l3_m6_7', 'itm_l3_m6_quiz', 7, '"___, the company has released a statement about the issue." (a hedge for secondhand information)', '["Certainly","Definitely","Apparently","Obviously"]', 2),
('qq_l3_m6_8', 'itm_l3_m6_quiz', 8, 'Which phrase means "spread very quickly online"?', '["go viral","come out","log into","roll out"]', 0),
('qq_l3_m6_9', 'itm_l3_m6_quiz', 9, '"He told me ___ he could fix it himself."', '["that","if","when","so"]', 0),
('qq_l3_m6_10', 'itm_l3_m6_quiz', 10, 'When evaluating a headline, a critical reader should ask:', '["Is the headline exciting?","Is the headline short?","Does the headline match the actual article?","Does the headline use capital letters?"]', 2);

-- ---------------------------------------------------------------------
-- Module 7: Health, Body & Mind
-- Full prose version: docs/curriculum/level-3/module-07-health-body-mind.md
-- ---------------------------------------------------------------------
INSERT INTO units (id, course_id, sequence, title) VALUES
  ('unt_l3_m7', 'crs_level_3', 7, 'Module 7: Health, Body & Mind');

INSERT INTO learning_items (id, unit_id, sequence, kind, title, body) VALUES
('itm_l3_m7_overview', 'unt_l3_m7', 1, 'reading', 'Module Overview & Key Phrases',
'KEY PHRASES: He must be.../She might be... -- That can''t be right. -- It''s likely that.../It''s possible that... -- Could you describe your symptoms? -- I''ve been feeling... -- There''s no way that...

DISCOURSE MARKERS (functional set -- degrees of certainty): "it''s likely that", "it''s possible that", "there''s no way that" -- hedging language expressing confidence in a claim, alongside the modal verbs themselves.

PHRASAL VERBS & COLLOCATIONS: "come down with [an illness]" (start to suffer from it), "look after [yourself/someone]" (take care of), "get over [an illness]" (recover from), "wear off" (an effect gradually disappears), "feel run down" (feel exhausted or below your normal energy level).

BrE / AmE NOTE: British "chemist''s" (the shop, also "pharmacy") vs. American "drugstore/pharmacy"; British "GP" (general practitioner) vs. American "primary care physician"; British "off sick" vs. American "out sick."

KEY VOCABULARY: physical health vocabulary (symptom, diagnosis, prescription, recovery, exhausted, dizzy), mental wellbeing vocabulary (stress, anxious, overwhelmed, burnout, cope with). Intercultural note: openness about discussing mental health varies significantly by culture and personal comfort -- all scenarios here are invented/generic.'),

('itm_l3_m7_lesson1', 'unt_l3_m7', 2, 'reading', 'Lesson 7.1 -- He Must Be Exhausted -- Modals of Deduction, Present',
'LEARNING OBJECTIVES: (1) use must + base verb to express a confident deduction based on evidence, (2) use might/could + base verb to express a possible, less certain deduction, (3) use can''t + base verb to express that something is logically impossible given the evidence, (4) support a deduction with a stated reason.

PREREQUISITE KNOWLEDGE: Level III, Module 3 (modal-adjacent conditional forms).

WARM-UP (5 min): Your instructor describes a simple scenario with clear evidence ("My colleague has been yawning all day and drinking a lot of coffee") and asks you to guess what''s true.

PRESENTATION (10 min): "He''s been yawning all day. He must be exhausted. She''s smiling and humming -- she might be in a good mood. It can''t be that serious -- she''s still laughing about it." "Must" = a confident, evidence-based conclusion (a different use from obligation); "might/could" = a plausible but uncertain guess; "can''t" = confident that something is NOT true, based on contradicting evidence.

GUIDED PRACTICE (10 min): You are given 8 short scenario cards (each with 2-3 pieces of evidence) and make a deduction for each using must/might/can''t, stating your reason.

INDEPENDENT PRACTICE / SPEAKING ACTIVITY (10 min): In pairs, Learner A describes a short invented scenario with some evidence; Learner B makes a deduction using the correct modal and explains their reasoning, then swap. Then join a whole-class "mystery scenario" activity.

CRITICAL THINKING / DISCUSSION PROMPT: "Is it possible to be completely confident about a deduction and still be wrong? Can you think of a time you were sure about something and later found out you were mistaken?"

LISTENING ACTIVITY (5 min): Listen to a short conversation in which two people make deductions about a third person''s wellbeing and note which modal each speaker uses and why.

READING ACTIVITY -- EXTENDED READING & INFERENCE (8 min): Read a short text (150 words) describing someone''s recent behaviour. Answer 2 literal questions and 2 inference questions using deduction modals in your answers.

WRITING TASK (5 min): Write 4-5 deduction sentences about an invented scenario of your choice, using must/might/could/can''t correctly with a stated reason for each.

PRONUNCIATION PRACTICE (5 min): The contracted, connected form "can''t" (BrE vs. AmE pronunciation) and stress on the modal itself when the deduction is the main point of the sentence ("She MUST be exhausted").

VOCABULARY REINFORCEMENT: a deduction-strength card-sorting game (sort 9 example sentences by must/might/can''t).

FORMATIVE ASSESSMENT: Instructor checks that the chosen modal matches the strength of the evidence given during independent practice.

HOMEWORK: Prepare one invented healthcare-style scenario (3-4 symptoms or pieces of evidence, entirely fictional) ready for Lesson 7.2''s interview roleplay.

REVISION: Lesson 7.2 opens with learners briefly describing their homework scenario in one sentence.

EXTENSION: Add one sentence using "must not" (a confident negative obligation-based deduction).'),

('itm_l3_m7_lesson2', 'unt_l3_m7', 3, 'reading', 'Lesson 7.2 -- She Might Have Been Stressed -- Modals of Deduction, Past & a Healthcare Interview',
'LEARNING OBJECTIVES: (1) form past deduction modals correctly (must have/might have/can''t have + past participle), (2) use them to deduce about a past situation based on later evidence, (3) ask and answer healthcare-interview-style questions clearly, sensitively, and with appropriate formality, (4) describe both physical and mental wellbeing using appropriate vocabulary and register.

PREREQUISITE KNOWLEDGE: Lesson 7.1 (present deduction modals), Level III Module 1 (present perfect, the past participle''s other major use).

WARM-UP (5 min): Your instructor describes a simple past scenario with evidence discovered afterward ("The meeting room light was still on when I left last night") and elicits a guess using must have/might have.

PRESENTATION (10 min): "She looked exhausted this morning -- she must have slept badly. He didn''t answer any calls yesterday -- he might have been busy, or he might have been unwell. That can''t have been easy for them." Direct present->past mapping: must be -> must have been; might be -> might have been; can''t be -> can''t have been. Healthcare-interview structure: a clear opening question, specific follow-up questions, and a clear, calm closing summary.

GUIDED PRACTICE (10 min): Convert 6 present-deduction sentences into past-deduction sentences, checking past participle accuracy.

INDEPENDENT PRACTICE (10 min): In pairs, Learner A plays a patient describing invented symptoms using present perfect ("I''ve been feeling...") from their Lesson 7.1 homework scenario; Learner B plays a healthcare professional, asking clarifying questions and making one appropriate past-deduction statement, then swap roles.

SPEAKING ACTIVITY -- INTERVIEW TASK: The full patient/professional interview roleplay above. All scenarios are invented; the goal is clear, sensitive communication, not medical accuracy.

CRITICAL THINKING / DISCUSSION PROMPT: "Why do you think it''s important for a healthcare professional to ask several specific questions, rather than just guessing what''s wrong? How is this similar to the fact-finding questions you practised in Level II?"

LISTENING ACTIVITY (5 min): Listen to a short healthcare-style interview (5-6 exchanges) and note the symptoms described and the professional''s closing summary.

READING ACTIVITY (5 min): Read a short written healthcare-advice text (generic, fictional, for language purposes only) and identify its opening question, follow-up questions, and closing summary structure.

WRITING TASK (5 min): Write a short written summary (5-6 sentences) of an invented healthcare interview, using at least one present-deduction and one past-deduction sentence.

PRONUNCIATION PRACTICE (5 min): The connected, weak-form pronunciation of "have" in past deduction modals ("must have") in natural fast speech, and calm, reassuring intonation appropriate to a healthcare-interview context.

VOCABULARY REINFORCEMENT: a wellbeing-vocabulary matching game (symptom, diagnosis, prescription, recovery, stress, anxious, overwhelmed, cope with).

FORMATIVE ASSESSMENT: Instructor checks correct past-deduction modal formation and a genuinely sensitive, appropriately formal interview register during the roleplay.

HOMEWORK: Finalise your interview roleplay (or a written summary of it) for Module 7''s assignment.

REVISION: This lesson opens with the Lesson 7.1 scenario recap. Module 7''s Quiz and Assignment draw on both lessons.

EXTENSION: Add one "must not have" sentence, correctly distinguishing it from "can''t have."'),

('itm_l3_m7_quiz', 'unt_l3_m7', 4, 'quiz', 'Module 7 Quiz -- Health, Body & Mind', NULL),

('itm_l3_m7_assignment', 'unt_l3_m7', 5, 'assignment', 'Module 7 Assignment -- A Healthcare Interview -- Roleplay & Reflection',
'INSTRUCTIONS: Record yourself (or perform with a partner) a healthcare-interview roleplay, 90 seconds to 2 minutes, using entirely invented/fictional symptoms and details (never real personal health information). Include: a healthcare professional opening with "Could you describe your symptoms?" and at least 2 specific follow-up questions; a patient describing symptoms using present perfect ("I''ve been feeling..."); at least one present-deduction sentence (must/might/can''t be); at least one past-deduction sentence (must have/might have/can''t have been); and a clear closing summary from the professional.

GRADING RUBRIC: (1) Grammatical accuracy -- correct present- and past-deduction modal formation, correct present perfect for describing ongoing symptoms. (2) Vocabulary range -- at least 4 distinct health/wellbeing words used correctly, plus one phrasal verb/collocation from this module. (3) Task completion -- opening question, follow-up questions, symptom description, both deduction types, and a closing summary all present. (4) Communicative quality -- does the interview sound genuinely attentive and sensitive, not mechanical or rushed? (5) Discourse coherence & register -- is the register calm, professional, and appropriately formal throughout, and does the closing summary genuinely and accurately reflect what was discussed?

A grade at or above the platform''s pass threshold marks this module complete.');

INSERT INTO quiz_questions (id, learning_item_id, sequence, prompt, choices_json, correct_index) VALUES
('qq_l3_m7_1', 'itm_l3_m7_quiz', 1, '"He''s been yawning all day. He ___ be exhausted." (confident deduction)', '["might","can''t","should","must"]', 3),
('qq_l3_m7_2', 'itm_l3_m7_quiz', 2, '"She''s smiling and humming. She ___ be in a good mood." (a plausible, less certain guess)', '["must","might","can''t","has to"]', 1),
('qq_l3_m7_3', 'itm_l3_m7_quiz', 3, '"It ___ be that serious -- she''s still laughing about it." (evidence contradicts it)', '["can''t","must","might","could"]', 0),
('qq_l3_m7_4', 'itm_l3_m7_quiz', 4, '"She looked exhausted this morning. She ___ badly." (past deduction)', '["must sleep","must slept","must have slept","must sleeping"]', 2),
('qq_l3_m7_5', 'itm_l3_m7_quiz', 5, '"He didn''t answer any calls. He ___ busy." (a plausible past guess)', '["might be","might have been","might been","might has been"]', 1),
('qq_l3_m7_6', 'itm_l3_m7_quiz', 6, '"___, he''s just tired from the journey." (a paraphrase for "must be")', '["There''s no way that","It''s impossible that","It''s certain that never","It''s likely that"]', 3),
('qq_l3_m7_7', 'itm_l3_m7_quiz', 7, 'In British English, you would go to the ___ to buy over-the-counter medicine.', '["drugstore","clinic","chemist''s","surgery store"]', 2),
('qq_l3_m7_8', 'itm_l3_m7_quiz', 8, 'Which phrase means "feel exhausted or below your normal energy level"?', '["feel run down","come down with","get over","wear off"]', 0),
('qq_l3_m7_9', 'itm_l3_m7_quiz', 9, '"Could you describe your ___?" (an opening healthcare-interview question)', '["symptoms","opinion","history","plans"]', 0),
('qq_l3_m7_10', 'itm_l3_m7_quiz', 10, '"That ___ have been easy for them." (a sympathetic past deduction)', '["mustn''t","shouldn''t","can''t","won''t"]', 2);

-- ---------------------------------------------------------------------
-- Module 8: Travel & Culture
-- Full prose version: docs/curriculum/level-3/module-08-travel-culture.md
-- ---------------------------------------------------------------------
INSERT INTO units (id, course_id, sequence, title) VALUES
  ('unt_l3_m8', 'crs_level_3', 8, 'Module 8: Travel & Culture');

INSERT INTO learning_items (id, unit_id, sequence, kind, title, body) VALUES
('itm_l3_m8_overview', 'unt_l3_m8', 1, 'reading', 'Module Overview & Key Phrases',
'KEY PHRASES: If I travelled more, I would... -- If you could live anywhere, where would you live? -- That would be considered.../In my culture,... -- Whereas.../In contrast,... -- I don''t think there''s a "right" way -- just a different one.

DISCOURSE MARKERS (functional set -- comparison across two things): "whereas", "in contrast", "similarly" -- used to compare two customs, places, or norms directly and evenhandedly, without implying one is better.

PHRASAL VERBS & COLLOCATIONS: "fit in" (feel/be accepted as part of a group or place), "stand out" (be noticeably different, not necessarily negative), "pick up [a language/habit]" (learn informally), "settle in [a new place]" (become comfortable somewhere new), "adjust to [a new culture]" (gradually adapt).

BrE / AmE NOTE: "gap year" -- a British-originated term (a year students often take between school and university to travel, work, or volunteer) that has spread internationally; British "fancy dress" (a costume for a themed party) vs. American "costume" for the same idea.

KEY VOCABULARY: travel vocabulary (itinerary, excursion, accommodation, local customs, jet lag), intercultural vocabulary (etiquette, norm, custom, culture shock, hospitality). Intercultural note: this module is explicitly about comparing cultures respectfully -- "different, not better or worse."'),

('itm_l3_m8_lesson1', 'unt_l3_m8', 2, 'reading', 'Lesson 8.1 -- If I Travelled More... -- Second Conditional',
'LEARNING OBJECTIVES: (1) form the second conditional correctly (If + past simple, would + base verb), (2) use it for hypothetical, imaginary, or unlikely situations, (3) ask and answer classic hypothetical questions, (4) use the second conditional to imagine a travel scenario in reasonable detail.

PREREQUISITE KNOWLEDGE: Level III, Module 3 (first conditional -- the essential contrast point).

WARM-UP (5 min): Your instructor asks one classic hypothetical question ("If you could visit any country tomorrow, where would you go?") and takes a few quick answers.

PRESENTATION (10 min): "If I travelled more, I would learn about different cultures. If I had more time off, I''d visit South America." Contrast with a first-conditional sentence about a real plan: "If I travel next year, I will visit three countries" vs. "If I travelled every year, I''d run out of savings." Second conditional uses past simple in the if-clause (despite present/future meaning) and would + base verb in the result clause.

GUIDED PRACTICE (10 min): Complete 8 second-conditional sentence halves about hypothetical travel scenarios, then identify which of 4 additional example sentences are first vs. second conditional, explaining your reasoning.

INDEPENDENT PRACTICE / SPEAKING ACTIVITY (10 min): Write 5 second-conditional sentences about hypothetical travel scenarios, then interview a partner using at least 3 "If you could..., would you...?" questions. Share one especially interesting hypothetical travel answer with the class.

CRITICAL THINKING / DISCUSSION PROMPT: "Do you think imagining a hypothetical situation (like an unlimited travel budget) can actually teach you something real about your own priorities? Why or why not?"

LISTENING ACTIVITY (5 min): Listen to someone describing a hypothetical travel dream (6-7 sentences, second conditional) and complete a simple "if / would" grid worksheet.

READING ACTIVITY -- EXTENDED READING & INFERENCE (8 min): Read a short "If I could travel anywhere..." blog-style excerpt (150 words). Answer 2 literal questions and 2 inference questions.

WRITING TASK (5 min): Write a short paragraph (5-6 sentences) describing your own hypothetical dream trip, using second conditional correctly at least 3 times.

PRONUNCIATION PRACTICE (5 min): The contracted, connected form "''d" for "would" in natural speech ("I''d visit South America") and the correct, non-reduced pronunciation of "if" at the start of a sentence versus its weak, unstressed form mid-sentence.

VOCABULARY REINFORCEMENT: a travel-vocabulary matching game (itinerary, excursion, accommodation, local customs, jet lag).

FORMATIVE ASSESSMENT: Instructor checks correct second-conditional formation and correct distinction from first conditional during guided practice.

HOMEWORK: Think of one real custom or norm from your own culture or background that might surprise someone from elsewhere, and jot down a few notes, ready for Lesson 8.2''s comparison activity.

REVISION: Lesson 8.2 opens with learners briefly naming their homework custom in one sentence.

EXTENSION: Add one sentence using "were" instead of "was" in the second conditional for all subjects ("If I were you, I''d...").'),

('itm_l3_m8_lesson2', 'unt_l3_m8', 3, 'reading', 'Lesson 8.2 -- That Would Be Considered Rude Where I''m From -- Cultural Comparison',
'LEARNING OBJECTIVES: (1) use the second conditional to describe how a hypothetical action would be perceived in a particular cultural context, (2) compare two customs or norms respectfully using whereas/in contrast/similarly, (3) discuss what "culture shock" or adjusting to a new place might involve, (4) avoid overgeneralising when describing a culture, using appropriately hedged language.

PREREQUISITE KNOWLEDGE: Lesson 8.1 (second conditional), Level III Module 4 (formal opinion/contrast language, now applied to cultural comparison).

WARM-UP (5 min): Your instructor shares one genuine, respectfully-framed example of a cultural norm difference and models hedged language ("In many places I''ve read about... though this certainly isn''t true everywhere").

PRESENTATION (10 min): "If you arrived a few minutes late to a casual meeting in my country, people probably wouldn''t mind much. In contrast, in some other places, that would be considered quite rude." The second conditional describes a hypothetical social reaction; deliberate hedging language ("in many places," "some other places," "this varies") avoids sweeping claims about an entire country or culture.

GUIDED PRACTICE (10 min): You are given 6 "custom" prompt cards (generic, non-stereotyping) and build a second-conditional + whereas comparison sentence for each, comparing two hypothetical/generalised contexts without naming specific real countries reductively.

INDEPENDENT PRACTICE (10 min): Using your Lesson 8.1 homework notes, prepare a short comparison (3-4 sentences) of a real custom from your own background against a different one you''ve learned about or experienced, using hedged, respectful language and at least one second-conditional sentence.

SPEAKING ACTIVITY: Share your comparison in a small group, discussing: "What''s something you found surprising or interesting (not right or wrong) about a custom different from your own?"

CRITICAL THINKING / DISCUSSION PROMPT: "Why do you think it''s easy to accidentally make a whole culture sound like it''s ''one way,'' even when that''s not true? How can careful language help avoid that?"

LISTENING ACTIVITY (5 min): Listen to someone describing a moment of "culture shock" or adjustment (6-7 sentences) and note what surprised them and how they adapted.

READING ACTIVITY (5 min): Read a short respectful cultural-comparison text (generic, hedged, non-stereotyping) and identify its whereas/in contrast/similarly comparison points and its hedging language.

WRITING TASK (5 min): Write a short paragraph (5-6 sentences) comparing two customs respectfully, using whereas/in contrast and at least one second-conditional sentence.

PRONUNCIATION PRACTICE (5 min): Warm, curious intonation for asking about someone''s customs ("What would happen if...?") versus flat, potentially judgemental-sounding intonation.

VOCABULARY REINFORCEMENT: an intercultural-vocabulary matching game (etiquette, norm, custom, culture shock, hospitality).

FORMATIVE ASSESSMENT: Instructor checks that comparisons stay hedged and respectful (no sweeping "all people from X do Y" statements) during independent practice.

HOMEWORK: Finalise your cultural comparison paragraph for Module 8''s assignment.

REVISION: This lesson opens with the Lesson 8.1 custom-naming recap. Module 8''s Quiz and Assignment draw on both lessons.

EXTENSION: Add one sentence acknowledging that customs vary within a culture too, not just between cultures.'),

('itm_l3_m8_quiz', 'unt_l3_m8', 4, 'quiz', 'Module 8 Quiz -- Travel & Culture', NULL),

('itm_l3_m8_assignment', 'unt_l3_m8', 5, 'assignment', 'Module 8 Assignment -- Comparing Customs -- A Respectful Cultural Comparison',
'INSTRUCTIONS: Write (or record) a short respectful comparison, 10-12 sentences, of one custom or norm from your own background and a different one you''ve learned about or experienced. Include: at least 2 second-conditional sentences describing a hypothetical situation and how it might be perceived; at least one whereas/in contrast/similarly comparison sentence; hedged, non-stereotyping language throughout; and a brief reflection on what you found interesting about the difference.

GRADING RUBRIC: (1) Grammatical accuracy -- correct second-conditional formation. (2) Vocabulary range -- at least 4 distinct travel/intercultural words used correctly, plus one phrasal verb/collocation from this module. (3) Task completion -- hypothetical comparison, a direct whereas/in contrast comparison, and a personal reflection all present. (4) Communicative quality -- is the comparison genuinely specific and thoughtful, not generic? (5) Discourse coherence & register -- is the language appropriately hedged and respectful throughout, and does the piece read as a genuine, curious comparison rather than a ranking of "better" and "worse"?

A grade at or above the platform''s pass threshold marks this module complete.');

INSERT INTO quiz_questions (id, learning_item_id, sequence, prompt, choices_json, correct_index) VALUES
('qq_l3_m8_1', 'itm_l3_m8_quiz', 1, '"If I ___ more, I would learn about different cultures." (second conditional)', '["travel","travelled","will travel","am travelling"]', 1),
('qq_l3_m8_2', 'itm_l3_m8_quiz', 2, '"If I had more time off, I ___ visit South America."', '["will","am","do","would"]', 3),
('qq_l3_m8_3', 'itm_l3_m8_quiz', 3, 'Which sentence describes a real, likely plan (first conditional), not a hypothetical?', '["If I travelled every year, I''d run out of savings.","If I could live anywhere, I''d choose the coast.","If I travel next year, I will visit three countries.","If money were no object, I''d travel constantly."]', 2),
('qq_l3_m8_4', 'itm_l3_m8_quiz', 4, '"If you ___ late to a casual meeting here, people probably wouldn''t mind."', '["arrived","arrive","will arrive","arriving"]', 0),
('qq_l3_m8_5', 'itm_l3_m8_quiz', 5, '"In my country, that''s fine. ___, in some other places, it would be considered rude."', '["Similarly","Because","Therefore","In contrast"]', 3),
('qq_l3_m8_6', 'itm_l3_m8_quiz', 6, 'Which phrase means "become comfortable and adjusted somewhere new"?', '["stand out","settle in","fit in","pick up"]', 1),
('qq_l3_m8_7', 'itm_l3_m8_quiz', 7, 'What does "gap year" traditionally refer to?', '["a year students take between school and university to travel, work, or volunteer","a type of passport","a discount on flights","a type of visa"]', 0),
('qq_l3_m8_8', 'itm_l3_m8_quiz', 8, 'Which is the more respectful, hedged way to describe a custom?', '["All people from that country do this.","Everyone there believes this.","In many places I''ve read about, this is common, though it varies.","This is simply how that culture is."]', 2),
('qq_l3_m8_9', 'itm_l3_m8_quiz', 9, '"If I ___ you, I''d try the local food." (recycling a familiar structure)', '["am","was","were","will be"]', 2),
('qq_l3_m8_10', 'itm_l3_m8_quiz', 10, 'Which phrase means "be noticeably different from those around you"?', '["stand out","fit in","settle in","adjust to"]', 0);

-- ---------------------------------------------------------------------
-- Module 9: Academic Foundations
-- Full prose version: docs/curriculum/level-3/module-09-academic-foundations.md
-- ---------------------------------------------------------------------
INSERT INTO units (id, course_id, sequence, title) VALUES
  ('unt_l3_m9', 'crs_level_3', 9, 'Module 9: Academic Foundations');

INSERT INTO learning_items (id, unit_id, sequence, kind, title, body) VALUES
('itm_l3_m9_overview', 'unt_l3_m9', 1, 'reading', 'Module Overview & Key Phrases',
'KEY PHRASES: This paragraph will focus on... -- For example,.../For instance,... -- In conclusion,.../To sum up,... -- According to [the source],... -- This idea comes from... -- Firstly,.../Secondly,.../Finally,...

DISCOURSE MARKERS (a consolidation set -- the level''s full connector toolkit, used together for the first time): cause (because, so), contrast (although, however), illustration (for example, for instance), sequencing an argument (firstly, secondly, finally), and closing (in conclusion, to sum up).

PHRASAL VERBS & COLLOCATIONS: "draw on [a source/idea]" (use it as a basis for your own point), "point out [something]" (highlight or mention it explicitly), "set out [an argument]" (present it clearly, in order), "sum up" (summarise, especially at the end), "build on [an idea]" (develop or extend it further).

BrE / AmE NOTE: British "full stop" vs. American "period" for the "." punctuation mark; British "brackets" vs. American "parentheses" for "( )".

KEY VOCABULARY: academic-writing vocabulary (topic sentence, supporting detail, thesis, structure, coherence, source), consolidating academic vocabulary from Module 2 (lecture, seminar, coursework). Intercultural note: expectations around how directly a thesis should be stated up front can differ across academic and rhetorical traditions.'),

('itm_l3_m9_lesson1', 'unt_l3_m9', 2, 'reading', 'Lesson 9.1 -- One Idea, Well Supported -- Paragraph Structure & Topic Sentences',
'LEARNING OBJECTIVES: (1) write a clear topic sentence stating a paragraph''s one main idea, (2) support it with 2-3 specific details or examples, using for example/for instance, (3) use because/so/although/however to connect ideas smoothly within the paragraph, (4) write a concluding sentence that closes the paragraph without simply repeating the topic sentence word-for-word.

PREREQUISITE KNOWLEDGE: Level III, Module 2 (note-taking, summarising); Modules 3-8 (all the discourse markers this lesson now consolidates).

WARM-UP (5 min): Your instructor shows one well-organised paragraph and one disorganised list of the same facts -- which is easier to follow and why?

PRESENTATION (10 min): A full annotated paragraph: TOPIC SENTENCE: "Remote work has changed how many people balance their professional and personal lives." SUPPORTING DETAIL: "For example, employees no longer lose time commuting..." SUPPORTING DETAIL WITH CONTRAST: "Although some workers miss daily in-person contact, most report feeling more in control of their schedule." CONCLUDING SENTENCE: "Overall, remote work seems to offer more flexibility than it costs in connection." One paragraph = one main idea; supporting details make it concrete; the concluding sentence closes the thought, restating significance rather than exact wording.

GUIDED PRACTICE (10 min): You are given a jumbled paragraph (topic sentence, 2 supporting details, and a conclusion, all mixed up) and reorder it correctly, identifying each part''s function.

INDEPENDENT PRACTICE / SPEAKING ACTIVITY (10 min): Choose one topic you know well and write a full structured paragraph (topic sentence + 2 supporting details using "for example" + one "although/however" contrast + a concluding sentence), then swap with a partner, who identifies each structural part. Read your paragraph aloud to a partner, who summarises it back in one sentence.

CRITICAL THINKING / DISCUSSION PROMPT: "Why do you think starting a paragraph with the main idea is a useful convention in a lot of academic and professional English writing? Can you think of a situation where a different structure might work better?"

LISTENING ACTIVITY (5 min): Listen to a short spoken explanation structured as a paragraph and identify each part on a simple worksheet.

READING ACTIVITY -- EXTENDED READING & INFERENCE (8 min): Read a well-structured paragraph (150-180 words) on a generic academic or professional topic. Answer 2 literal questions and 2 inference questions.

WRITING TASK (5 min): Revise your independent-practice paragraph based on your partner''s one-sentence summary -- does it match what you intended?

PRONUNCIATION PRACTICE (5 min): Clear, deliberate pausing between a paragraph''s structural parts when reading aloud.

VOCABULARY REINFORCEMENT: an academic-writing vocabulary matching game (topic sentence, supporting detail, thesis, structure, coherence, source).

FORMATIVE ASSESSMENT: Instructor checks that each paragraph has one clear main idea, genuine specific supporting detail, and a real concluding sentence, during independent practice.

HOMEWORK: Choose a topic you''d like to argue an opinion about and jot down a thesis statement and 2 supporting points, ready for Lesson 9.2.

REVISION: Lesson 9.2 opens with learners briefly stating their homework thesis in one sentence.

EXTENSION: Add a second supporting paragraph on a different aspect of the same topic.'),

('itm_l3_m9_lesson2', 'unt_l3_m9', 3, 'reading', 'Lesson 9.2 -- According to the Source... -- Acknowledging Ideas & a Structured Talk',
'LEARNING OBJECTIVES: (1) acknowledge where an idea, fact, or opinion comes from using basic citation-awareness language, (2) outline a short structured essay or talk (thesis + two supporting points + conclusion), (3) deliver a longer (2-3 minute) structured prepared talk using the level''s full discourse-marker toolkit, (4) respond calmly and clearly to two follow-up questions.

PREREQUISITE KNOWLEDGE: Lesson 9.1 (paragraph structure), Level III Module 3 (presentation skills, now extended), Level III Module 6 (attributing a claim to a source, now formalised).

WARM-UP (5 min): Your instructor makes one claim and then immediately models acknowledging where it came from ("...this is based on what I''ve read in several general news reports, not a specific statistic I can cite precisely").

PRESENTATION (10 min): The thesis + two supporting points + conclusion structure: THESIS (your main argued position, one sentence) -> POINT 1 (with a supporting example, "for example") -> POINT 2, ideally acknowledging a counter-consideration ("although") -> CONCLUSION ("in conclusion/to sum up", restating the thesis''s significance). Basic citation awareness: name where a fact generally comes from ("According to several studies I''ve come across.../This idea draws on something I read recently...") rather than stating it as pure personal knowledge. Full citation mechanics are a Level IV+ skill; this level''s goal is the habit of acknowledging sources honestly.

GUIDED PRACTICE (10 min): Take your Lesson 9.1 homework thesis and 2 points and build a full outline using the four-part structure, checking with a partner that the thesis is a genuine, arguable position.

INDEPENDENT PRACTICE (10 min): Develop your outline into a full short talk script (using firstly/secondly/finally, for example, although/however, and in conclusion), and rehearse it once.

SPEAKING ACTIVITY -- PRESENTATION TASK (CAPSTONE): Deliver your 2-3 minute structured talk to a small group (or the class), who listen for the four structural parts and ask 2 follow-up questions each, which you answer on the spot.

CRITICAL THINKING / DISCUSSION PROMPT: "When you don''t have an exact source for something you believe to be true, do you think it''s better to state it plainly, acknowledge the uncertainty honestly, or avoid mentioning it at all? Why?"

LISTENING ACTIVITY (5 min): Listen to a short structured talk (the four-part shape) and take notes identifying each part.

READING ACTIVITY (5 min): Read a short written short-essay excerpt using the same four-part structure and one basic citation-awareness phrase, and label each structural part.

WRITING TASK (5 min): Write your talk''s four-part outline as a clean short written version (a short essay, 8-10 sentences).

PRONUNCIATION PRACTICE (5 min): Confident, clearly-paced delivery across a longer, multi-part talk, including deliberate, brief pauses at each structural transition, and calm, composed intonation when answering an unscripted follow-up question.

VOCABULARY REINFORCEMENT: a citation-awareness phrase-matching game (according to, this idea comes from, based on, draws on).

FORMATIVE ASSESSMENT: Instructor checks for a genuine four-part structure, at least one honest source-acknowledgement, and composed responses to follow-up questions during the presentation task.

HOMEWORK: Refine your talk script based on any questions or feedback received, ready for Module 9''s assignment.

REVISION: This lesson opens with the Lesson 9.1 thesis recap. Module 9''s Quiz and Assignment draw on both lessons.

EXTENSION: Add a third supporting point to your talk, adjusting your firstly/secondly/finally sequencing language accordingly.'),

('itm_l3_m9_quiz', 'unt_l3_m9', 4, 'quiz', 'Module 9 Quiz -- Academic Foundations', NULL),

('itm_l3_m9_assignment', 'unt_l3_m9', 5, 'assignment', 'Module 9 Assignment -- A Short Structured Essay & Talk',
'INSTRUCTIONS: Prepare and deliver (record yourself, or perform live) a structured talk, 2-3 minutes, on a topic of your choice that you can genuinely argue a position on. Your talk must include: a clear one-sentence thesis; two supporting points, each with a specific example (for example/for instance); at least one although/however acknowledgement of a counter-consideration; at least one honest citation-awareness phrase; and a conclusion that restates your thesis''s significance (in conclusion/to sum up). Also submit your talk''s written outline (8-10 sentences).

GRADING RUBRIC: (1) Grammatical accuracy -- correct, varied use of the discourse markers practised this module. (2) Vocabulary range -- at least 4 distinct academic-writing words used correctly, plus one phrasal verb/collocation from this module. (3) Task completion -- thesis, two supported points, a counter-consideration, a citation-awareness phrase, and a conclusion all present in both the spoken talk and the written outline. (4) Fluency and delivery -- reasonably fluent and clearly paced for B1, with composed responses to any follow-up questions received. (5) Discourse coherence & register -- does the talk read/sound as one connected, logically structured argument, and is the register appropriately academic/professional throughout?

A grade at or above the platform''s pass threshold marks this module complete.');

INSERT INTO quiz_questions (id, learning_item_id, sequence, prompt, choices_json, correct_index) VALUES
('qq_l3_m9_1', 'itm_l3_m9_quiz', 1, 'What is the main function of a topic sentence?', '["to state the paragraph''s one main idea","to end the paragraph","to give an example","to cite a source"]', 0),
('qq_l3_m9_2', 'itm_l3_m9_quiz', 2, '"___, employees no longer lose time commuting." (introducing an example)', '["However","In conclusion","For example","So"]', 2),
('qq_l3_m9_3', 'itm_l3_m9_quiz', 3, '"Although some workers miss in-person contact, ___ report feeling more in control of their schedule."', '["none","most","nobody","any"]', 1),
('qq_l3_m9_4', 'itm_l3_m9_quiz', 4, 'What should a concluding sentence generally do?', '["repeat the topic sentence word-for-word","introduce a brand new idea","ask a question","close the paragraph, often restating the main idea''s significance"]', 3),
('qq_l3_m9_5', 'itm_l3_m9_quiz', 5, 'Which phrase shows honest, basic citation awareness (not full formal citation)?', '["This is definitely 100% true.","Everyone knows this.","According to several studies I''ve come across...","I read it somewhere, so it must be true."]', 2),
('qq_l3_m9_6', 'itm_l3_m9_quiz', 6, 'In British English, the "." punctuation mark is usually called a:', '["full stop","period","point","dot"]', 0),
('qq_l3_m9_7', 'itm_l3_m9_quiz', 7, 'A short structured talk in this module generally follows which order?', '["conclusion, thesis, points","points, conclusion, thesis","no particular order","thesis, supporting points, conclusion"]', 3),
('qq_l3_m9_8', 'itm_l3_m9_quiz', 8, 'Which phrase means "use something as a basis for your own point"?', '["point out","draw on","sum up","set out"]', 1),
('qq_l3_m9_9', 'itm_l3_m9_quiz', 9, '"___, remote work seems to offer more flexibility than it costs in connection." (closing a paragraph)', '["For example","Overall","Firstly","Because"]', 1),
('qq_l3_m9_10', 'itm_l3_m9_quiz', 10, 'What is this level''s stated goal regarding citation, as opposed to full academic citation mechanics?', '["memorising formal reference formats","avoiding mentioning sources at all","quoting sources word-for-word only","the habit of honestly acknowledging where an idea comes from"]', 3);

-- ---------------------------------------------------------------------
-- Module 10: Review & Consolidation (Intermediate-Level Mock Exam)
-- Full prose version: docs/curriculum/level-3/module-10-review-consolidation.md
-- ---------------------------------------------------------------------
INSERT INTO units (id, course_id, sequence, title) VALUES
  ('unt_l3_m10', 'crs_level_3', 10, 'Module 10: Review & Consolidation');

INSERT INTO learning_items (id, unit_id, sequence, kind, title, body) VALUES
('itm_l3_m10_revguide', 'unt_l3_m10', 1, 'reading', 'Level III Revision Guide',
'MODULE 1 -- PRESENT PERFECT & LIFE EXPERIENCE: present perfect (experience) vs. past simple; discourse markers in fact/actually/as a matter of fact; phrasal verbs grow up, look back on, get used to.

MODULE 2 -- EDUCATION & LEARNING: present perfect continuous, defining relative clauses; discourse markers in other words/to put it another way; note-taking, summarising, and paraphrasing formally introduced.

MODULE 3 -- WORK, CAREERS & ENTREPRENEURSHIP: zero and first conditionals; discourse markers as a result/therefore; the programme''s first structured presentation task.

MODULE 4 -- OPINIONS & DEBATE: formal opinion language; discourse markers although/however/on the other hand/whereas; the full agree/partially-agree/disagree/concede scale; structured debate.

MODULE 5 -- ENVIRONMENT, ETHICS & GLOBAL CITIZENSHIP: present and past simple passive voice; discourse markers as a consequence/this has led to/due to; a structured ethical case-study discussion.

MODULE 6 -- TECHNOLOGY & MEDIA: reported speech for statements (with backshift); discourse markers according to/apparently; a media-literacy evaluation checklist.

MODULE 7 -- HEALTH, BODY & MIND: present and past modals of deduction (must/might/can''t, must have/might have/can''t have); discourse markers it''s likely that/there''s no way that; a healthcare-interview roleplay.

MODULE 8 -- TRAVEL & CULTURE: second conditional; discourse markers whereas/in contrast/similarly; respectful, hedged cultural comparison.

MODULE 9 -- ACADEMIC FOUNDATIONS: paragraph structure and topic sentences; the full connector toolkit consolidated; basic citation awareness; a capstone thesis + two-points + conclusion structured talk.

STRUCTURAL THREAD ACROSS THE LEVEL: Level III moved learners from narrating their own experience through describing their learning and working lives, arguing and evaluating ideas, reasoning about health, culture, and abstract situations, before formalising everything into structured academic writing and speaking. Each module''s grammar was chosen for a real communicative job rather than taught as an abstract rule in isolation. Module 10 tests all of it together, in connected use.

CUMULATIVE DISCOURSE-MARKER TOOLKIT: emphasis/detail (in fact, actually); paraphrase (in other words, to put it another way); cause/effect (as a result, therefore, as a consequence, this has led to, due to); contrast (although, however, on the other hand, whereas); attribution (according to, apparently, this idea comes from); certainty (it''s likely that, there''s no way that); illustration (for example, for instance); sequencing (firstly, secondly, finally); closing (in conclusion, to sum up).

CUMULATIVE BrE/AmE REFERENCE: got/gotten (M1); university/college, read a subject/major in, marks/grades (M2); CV/resume, made redundant/laid off, line manager/manager (M3); "quite" moderately vs. very (M4); rubbish-bin/trash-garbage, petrol/gas (M5); mobile phone/cell phone (M6); chemist''s/drugstore, GP/primary care physician, off sick/out sick (M7); gap year, fancy dress/costume (M8); full stop/period, brackets/parentheses (M9).'),

('itm_l3_m10_revlesson', 'unt_l3_m10', 2, 'reading', 'Revision Lesson -- Structured Consolidation Activities',
'LEARNING OBJECTIVES: (1) correctly select the right grammar structure from Modules 1-9 given a real-use context, (2) deploy at least 8 discourse markers from across the level''s functional sets fluently within one connected talk, (3) correctly identify at least 8 BrE/AmE differences from across the level, (4) self-identify at least one personal area needing further revision before the mock exam.

PREREQUISITE KNOWLEDGE: All of Modules 1-9.

WARM-UP (5 min): "Grammar auction" -- bid points on whether 8 example sentences (each drawn from a different module) are grammatically correct or incorrect.

PRESENTATION/CONSOLIDATION (15 min): A structure-selection drill: real-life prompts, each requiring a different module''s grammar to answer correctly ("Describe something you''ve never done but would like to" -> Module 1/8; "Explain a general workplace policy" -> Module 3/5; "Relay what a colleague told you" -> Module 6; "Guess why someone looks tired" -> Module 7).

GUIDED PRACTICE (15 min): Rotate through 4 stations, each reviewing 2-3 modules'' target language, with a final "Give a 30-second structured mini-talk" station recycling Module 9''s capstone skill on a new, simple topic.

INDEPENDENT PRACTICE (10 min): Complete a self-assessment checklist (one line per module: "I can... check/needs practice") and circle your two weakest areas.

SPEAKING ACTIVITY: The structure-selection drill and station rotation above are both fundamentally speaking-driven.

CRITICAL THINKING / DISCUSSION PROMPT: "Across this whole level, which skill do you think will be most useful to you outside the classroom -- presenting, debating, deducing, or structuring an argument in writing? Why?"

LISTENING ACTIVITY (5 min): Listen to a single extended talk (someone narrating an experience, describing their work, giving a reasoned opinion, and reporting something they read).

READING ACTIVITY (5 min): Read a similarly cumulative short text and answer mixed comprehension and inference questions spanning several grammar points and at least one BrE/AmE vocabulary item.

WRITING TASK (5 min): Write one well-structured paragraph (topic sentence, supporting detail, conclusion) that uses at least 4 different grammar points from across the level.

PRONUNCIATION PRACTICE (5 min): Rapid-fire review drill of the level''s key pronunciation points: connected ''ve/been, weak-form was/were, stress in passive constructions, can''t (BrE vs. AmE), and confident presentation pacing.

VOCABULARY REINFORCEMENT: a cumulative discourse-marker and phrasal-verb relay game covering all 9 modules'' functional-language sets, including a dedicated BrE/AmE matching round.

FORMATIVE ASSESSMENT: The self-assessment checklist above, reviewed individually with the instructor if time allows.

HOMEWORK: Revise your self-identified weak areas using the module you struggled with most.

REVISION: This entire lesson is revision by design.

EXTENSION: Stronger learners help peers at weaker stations during the rotation activity.

REVISITING YOUR ENTRY DIAGNOSTIC: return to the personal focus plan you wrote in Module 1. For each of your three aims, say plainly: met, partly met, or not met -- and give the evidence, not the impression. "I met it" is not an answer; "I met it, and the evidence is that I no longer pause before the past simple" is.

Then name one aim you would set for Level IV that you could not have named at the start of this level, because you did not yet know it was a problem. That last item is usually the most valuable thing a learner produces at the end of a level.'),

('itm_l3_m10_examquiz', 'unt_l3_m10', 3, 'quiz', 'Intermediate-Level Mock Exam -- Grammar & Vocabulary', NULL),

('itm_l3_m10_examassignment', 'unt_l3_m10', 4, 'assignment', 'Intermediate-Level Mock Exam -- Speaking & Writing',
'This is your Level III final assessment. Complete both parts.

PART A -- SPEAKING (4-5 minutes, recorded or live with your instructor): Deliver a structured talk covering: a real life experience narrated using present perfect and past simple, with at least one discourse marker for emphasis (Module 1); a description of something you''ve been doing for a period of time, using present perfect continuous (Module 2); a stated opinion on a topic of your choice, using formal opinion language and at least one although/however counter-point (Module 4); a deduction about a hypothetical or uncertain situation, using a modal of deduction (Module 7); and a brief hypothetical reflection using the second conditional (Module 8). Structure the whole talk with a clear opening, body, and conclusion (Module 9), and respond to at least two unscripted follow-up questions from your instructor.

PART B -- WRITING (a short structured essay, 15-18 sentences): Write a structured opinion essay on a topic of your choice. Include: a clear thesis stated in your opening paragraph; at least one paragraph using the passive voice to describe a general process or past event (Module 5); at least one reported-speech sentence relaying a claim you have read or heard (Module 6); at least one whereas/in contrast comparison (Module 8); correctly used topic sentences and a concluding paragraph that restates your thesis''s significance (Module 9); and at least one honest citation-awareness phrase.

GRADING RUBRIC (weighted toward listening and speaking per the Intermediate-level assessment strategy): (1) Grammatical range and accuracy -- correct, varied use of the level''s grammar points across both parts. (2) Vocabulary range -- discourse markers and phrasal verbs/collocations drawn from at least 6 of the 9 modules across both parts combined. (3) Task completion -- every required element present in both Part A and Part B. (4) Communicative quality -- does each part communicate a clear, followable message with genuine content, rather than correct sentences assembled around nothing? (5) Fluency and delivery (Part A) -- reasonably fluent for B1, audible, able to sustain a longer structured turn and respond composedly to unscripted follow-up questions. (6) Coherence (Part B) -- the essay reads as one connected, logically structured piece with clear topic sentences and paragraph-level organisation. (7) Discourse coherence & register -- is the register appropriately formal/academic throughout, and does the connector toolkit genuinely aid clarity rather than being inserted mechanically?

PROGRESSION REQUIREMENT: A grade at or above the platform''s pass threshold on this comprehensive assessment marks Level III as complete for the learner and, for a full-programme student, triggers Level IV''s enrolment to unlock automatically.');

INSERT INTO quiz_questions (id, learning_item_id, sequence, prompt, choices_json, correct_index) VALUES
('qq_l3_m10_1', 'itm_l3_m10_examquiz', 1, '(M1) "___ you ever visited another country?"', '["Have","Do","Did","Are"]', 0),
('qq_l3_m10_2', 'itm_l3_m10_examquiz', 2, '(M1) "I ___ to Berlin in 2019." (a specific time is given)', '["have gone","have been","went","go"]', 2),
('qq_l3_m10_3', 'itm_l3_m10_examquiz', 3, '(M2) "I''ve ___ studying English since 2022."', '["be","been","was","being"]', 1),
('qq_l3_m10_4', 'itm_l3_m10_examquiz', 4, '(M2) "I''m taking a course ___ focuses on marketing."', '["who","where","when","which"]', 3),
('qq_l3_m10_5', 'itm_l3_m10_examquiz', 5, '(M3) "If you ___ a deadline, your manager is satisfied." (a general fact)', '["will meet","met","meet","meeting"]', 2),
('qq_l3_m10_6', 'itm_l3_m10_examquiz', 6, '(M3) "If we launch this product in spring, we ___ more customers." (a real future possibility)', '["will reach","reach","reached","reaching"]', 0),
('qq_l3_m10_7', 'itm_l3_m10_examquiz', 7, '(M4) "___, remote work benefits most employees." (a formal opinion phrase)', '["I think","Maybe","Sort of","In my view"]', 3),
('qq_l3_m10_8', 'itm_l3_m10_examquiz', 8, '(M4) Which response shows partial agreement?', '["I completely agree.","I see your point, but I''m not sure that''s true in every case.","I''d have to disagree.","That''s completely wrong."]', 1),
('qq_l3_m10_9', 'itm_l3_m10_examquiz', 9, '(M5) "Plastic ___ in many countries." (present simple passive)', '["recycles","is recycled","recycling","recycled"]', 1),
('qq_l3_m10_10', 'itm_l3_m10_examquiz', 10, '(M5) "The area ___ by flooding last year." (past simple passive)', '["affects","affected","is affected","was affected"]', 3),
('qq_l3_m10_11', 'itm_l3_m10_examquiz', 11, '(M6) Direct: "This app is easy to use." Reported: "The reviewer said (that) the app ___ easy to use."', '["was","is","be","has been"]', 0),
('qq_l3_m10_12', 'itm_l3_m10_examquiz', 12, '(M6) "___ the article, the update improves battery life."', '["Told","Reported","According to","Said"]', 2),
('qq_l3_m10_13', 'itm_l3_m10_examquiz', 13, '(M7) "He''s been yawning all day. He ___ be exhausted." (confident deduction)', '["might","can''t","should","must"]', 3),
('qq_l3_m10_14', 'itm_l3_m10_examquiz', 14, '(M7) "She looked exhausted this morning. She ___ badly." (past deduction)', '["must sleep","must have slept","must slept","must sleeping"]', 1),
('qq_l3_m10_15', 'itm_l3_m10_examquiz', 15, '(M8) "If I ___ more, I would learn about different cultures." (second conditional)', '["travel","will travel","travelled","am travelling"]', 2),
('qq_l3_m10_16', 'itm_l3_m10_examquiz', 16, '(M8) Which is the more respectful, hedged way to describe a custom?', '["In many places I''ve read about, this is common, though it varies.","All people from that country do this.","Everyone there believes this.","This is simply how that culture is."]', 0),
('qq_l3_m10_17', 'itm_l3_m10_examquiz', 17, '(M9) What is the main function of a topic sentence?', '["to state the paragraph''s one main idea","to end the paragraph","to give an example","to cite a source"]', 0),
('qq_l3_m10_18', 'itm_l3_m10_examquiz', 18, '(M9) Which phrase shows honest, basic citation awareness?', '["This is definitely 100% true.","Everyone knows this.","According to several studies I''ve come across...","I read it somewhere, so it must be true."]', 2),
('qq_l3_m10_19', 'itm_l3_m10_examquiz', 19, '(Cumulative discourse markers) Which discourse marker signals a paraphrase (rephrasing an idea in different words)?', '["as a result","in other words","although","apparently"]', 1),
('qq_l3_m10_20', 'itm_l3_m10_examquiz', 20, '(Cumulative BrE/AmE) In American English, the past participle of "get" (meaning "become/improve") is often:', '["got","getting","get","gotten"]', 3);
