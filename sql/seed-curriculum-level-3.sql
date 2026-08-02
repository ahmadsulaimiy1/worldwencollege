-- WEC-LC — Real curriculum content seed: Level III ("Intermediate
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

KEY VOCABULARY: experience-related nouns (achievement, milestone, turning point, perspective), reflection language (I realised, it taught me, looking back). Intercultural note: what counts as a "big" life experience varies by culture and personal circumstance.'),

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
('qq_l3_m1_1', 'itm_l3_m1_quiz', 1, '"___ you ever visited another country?"', '["Do","Did","Have","Are"]', 2),
('qq_l3_m1_2', 'itm_l3_m1_quiz', 2, '"Yes, I ___. I''ve visited several."', '["did","have","do","was"]', 1),
('qq_l3_m1_3', 'itm_l3_m1_quiz', 3, '"I ___ to Berlin in 2019." (a specific time is given)', '["have gone","went","have been","go"]', 1),
('qq_l3_m1_4', 'itm_l3_m1_quiz', 4, '"When ___ you go?"', '["have","did","do","has"]', 1),
('qq_l3_m1_5', 'itm_l3_m1_quiz', 5, '"I''ve never ___ sushi."', '["try","tried","tries","trying"]', 1),
('qq_l3_m1_6', 'itm_l3_m1_quiz', 6, 'Which sentence uses present perfect correctly for unspecified-time experience?', '["I have visited Paris last year.","I have visited Paris.","I have visit Paris.","I visited Paris ever."]', 1),
('qq_l3_m1_7', 'itm_l3_m1_quiz', 7, '"I lived in Berlin for a year. ___, it changed how I see my own country."', '["In fact","Which is why","It completely changed","Actually"]', 3),
('qq_l3_m1_8', 'itm_l3_m1_quiz', 8, '"It taught me a lot about independence -- ___ I''d recommend it to anyone."', '["in fact","which is why","actually","so far"]', 1),
('qq_l3_m1_9', 'itm_l3_m1_quiz', 9, 'In American English, the past participle of "get" (meaning "become/improve") is often:', '["got","gotten","getting","get"]', 1),
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
('qq_l3_m2_1', 'itm_l3_m2_quiz', 1, '"I''ve ___ studying English since 2022."', '["been","be","was","being"]', 0),
('qq_l3_m2_2', 'itm_l3_m2_quiz', 2, '"I''m taking a course ___ focuses on marketing."', '["who","which","where","when"]', 1),
('qq_l3_m2_3', 'itm_l3_m2_quiz', 3, 'Which sentence uses a correct defining relative clause?', '["I''m taking a course, that focuses on marketing.","I''m taking a course that focuses on marketing.","I''m taking a course which it focuses on marketing.","I''m taking a course focuses on marketing."]', 1),
('qq_l3_m2_4', 'itm_l3_m2_quiz', 4, '"___, time management is a common challenge for students." (a paraphrase signal)', '["According to","In other words","As a matter of fact","Which is why"]', 1),
('qq_l3_m2_5', 'itm_l3_m2_quiz', 5, 'What is the main difference between summarising and paraphrasing?', '["They are exactly the same thing.","Summarising shortens; paraphrasing keeps similar length but different words.","Paraphrasing always uses the exact same words.","Summarising is only for spoken language."]', 1),
('qq_l3_m2_6', 'itm_l3_m2_quiz', 6, '"I''ve been ___ this book for two weeks."', '["read","reading","reads","to read"]', 1),
('qq_l3_m2_7', 'itm_l3_m2_quiz', 7, 'In British English, a student who studies law at university would say:', '["I major in law.","I read law.","I take law.","I grade in law."]', 1),
('qq_l3_m2_8', 'itm_l3_m2_quiz', 8, 'Which word means "stay on schedule with ongoing coursework"?', '["fall behind","keep up with","take in","cram"]', 1),
('qq_l3_m2_9', 'itm_l3_m2_quiz', 9, '"The teacher ___ I mentioned earlier is running the seminar." (a person, defining clause)', '["which","who","whose","when"]', 1),
('qq_l3_m2_10', 'itm_l3_m2_quiz', 10, 'Good note-taking generally means:', '["writing down every word the speaker says","writing only headings and short phrases capturing main points","memorising instead of writing","copying the speaker''s exact sentences"]', 1);

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
('qq_l3_m3_1', 'itm_l3_m3_quiz', 1, '"If you ___ a deadline, your manager is satisfied." (a general fact)', '["meet","will meet","met","meeting"]', 0),
('qq_l3_m3_2', 'itm_l3_m3_quiz', 2, '"If we launch this product in spring, we ___ more customers." (a real future possibility)', '["reach","will reach","reached","reaching"]', 1),
('qq_l3_m3_3', 'itm_l3_m3_quiz', 3, 'Which sentence is a general truth (zero conditional), not a specific future prediction?', '["If we hire more staff, we''ll meet the target.","If a business doesn''t adapt, it fails.","If it rains tomorrow, we''ll cancel the launch.","If sales increase next month, we''ll expand."]', 1),
('qq_l3_m3_4', 'itm_l3_m3_quiz', 4, '"Demand has grown this year. ___, the company needs to hire more staff."', '["If","As a result","Even though","Unless"]', 1),
('qq_l3_m3_5', 'itm_l3_m3_quiz', 5, '"If demand is high, we ___ more funding."', '["need","will need","needed","needing"]', 1),
('qq_l3_m3_6', 'itm_l3_m3_quiz', 6, 'In British English, the document you send when applying for a job is usually called a:', '["resume","CV","portfolio","bio"]', 1),
('qq_l3_m3_7', 'itm_l3_m3_quiz', 7, 'A good short pitch typically includes the idea, the benefit, and also:', '["a list of every possible feature","an honestly acknowledged challenge","a guarantee of success","no questions allowed"]', 1),
('qq_l3_m3_8', 'itm_l3_m3_quiz', 8, 'Which phrase means "start a company"?', '["run a company","set up a business","scale up","take a risk"]', 1),
('qq_l3_m3_9', 'itm_l3_m3_quiz', 9, '"If a competitor launches something similar, we ___ a clear advantage."', '["need","will need","needed","needing"]', 1),
('qq_l3_m3_10', 'itm_l3_m3_quiz', 10, 'Which word describes someone who takes responsibility for their decisions?', '["decisive","accountable","delegate","inspire"]', 1);

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
('qq_l3_m4_1', 'itm_l3_m4_quiz', 1, '"___, remote work benefits most employees." (a formal opinion phrase)', '["I think","In my view","Maybe","Sort of"]', 1),
('qq_l3_m4_2', 'itm_l3_m4_quiz', 2, '"Although some people miss the office, I ___ think the benefits outweigh that."', '["still","never","don''t","barely"]', 0),
('qq_l3_m4_3', 'itm_l3_m4_quiz', 3, 'Which response shows partial agreement?', '["I completely agree.","I see your point, but I''m not sure that''s true in every case.","I''d have to disagree.","That''s completely wrong."]', 1),
('qq_l3_m4_4', 'itm_l3_m4_quiz', 4, '"That''s a fair point, ___ I still think my original idea is stronger."', '["so","however","because","if"]', 1),
('qq_l3_m4_5', 'itm_l3_m4_quiz', 5, 'Which phrase means "support a claim with evidence or reasons"?', '["bring up","back up","get across","weigh up"]', 1),
('qq_l3_m4_6', 'itm_l3_m4_quiz', 6, 'In British English, "That''s quite good" often means:', '["very good","moderately good","not good at all","perfect"]', 1),
('qq_l3_m4_7', 'itm_l3_m4_quiz', 7, 'Conceding a fair point during a debate generally suggests:', '["a weak argument","a thoughtful, genuinely listening arguer","that you have lost","that you agree with everything"]', 1),
('qq_l3_m4_8', 'itm_l3_m4_quiz', 8, '"___ some people prefer working alone, others do their best work in a team."', '["Whereas","Because","So","If"]', 0),
('qq_l3_m4_9', 'itm_l3_m4_quiz', 9, 'Which phrase means "introduce a topic or idea into a discussion"?', '["stand by","weigh up","bring up","back up"]', 2),
('qq_l3_m4_10', 'itm_l3_m4_quiz', 10, '"I''d have to disagree, ___ the evidence doesn''t support that claim."', '["because","although","however","but still"]', 0);

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
('qq_l3_m5_1', 'itm_l3_m5_quiz', 1, '"Plastic ___ in many countries." (present simple passive)', '["recycles","is recycled","recycling","recycled"]', 1),
('qq_l3_m5_2', 'itm_l3_m5_quiz', 2, '"Emissions ___ by environmental agencies."', '["monitor","are monitored","monitoring","monitored by"]', 1),
('qq_l3_m5_3', 'itm_l3_m5_quiz', 3, '"The area ___ by flooding last year." (past simple passive)', '["affects","was affected","affected","is affected"]', 1),
('qq_l3_m5_4', 'itm_l3_m5_quiz', 4, '"A large amount of habitat ___."', '["destroyed","was destroyed","destroys","is destroying"]', 1),
('qq_l3_m5_5', 'itm_l3_m5_quiz', 5, '"Deforestation has increased. ___, biodiversity loss has become a serious issue."', '["Due to","This has led to","On the one hand","Which is why"]', 1),
('qq_l3_m5_6', 'itm_l3_m5_quiz', 6, 'In British English, rubbish is put in a:', '["trash can","bin","garbage can","waste zone"]', 1),
('qq_l3_m5_7', 'itm_l3_m5_quiz', 7, '"___ hand, the factory would create jobs; on the other, it could harm the environment."', '["In one","On the one","From one","At one"]', 1),
('qq_l3_m5_8', 'itm_l3_m5_quiz', 8, 'Which phrase means "gradually stop using something over time"?', '["carry out","give rise to","phase out","cut down"]', 2),
('qq_l3_m5_9', 'itm_l3_m5_quiz', 9, 'Why might a writer choose the passive voice in a factual report?', '["to make the sentence longer","to focus on the action/result rather than who did it","it is always required in reports","to avoid using verbs"]', 1),
('qq_l3_m5_10', 'itm_l3_m5_quiz', 10, '"Several species ___ as a result of the flooding."', '["displaced","were displaced","displace","are displacing"]', 1);

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
('qq_l3_m6_1', 'itm_l3_m6_quiz', 1, 'Direct: "This app is easy to use." Reported: "The reviewer said (that) the app ___ easy to use."', '["is","was","be","has been"]', 1),
('qq_l3_m6_2', 'itm_l3_m6_quiz', 2, 'Direct: "I''ll update it next week." Reported: "She said (that) she ___ update it next week."', '["will","would","updates","updated"]', 1),
('qq_l3_m6_3', 'itm_l3_m6_quiz', 3, '"___ the article, the update improves battery life."', '["Told","According to","Reported","Said"]', 1),
('qq_l3_m6_4', 'itm_l3_m6_quiz', 4, 'Which is a fact, not an opinion?', '["This is the best app ever made.","The app was released in March.","Everyone should use this app.","This app is amazing."]', 1),
('qq_l3_m6_5', 'itm_l3_m6_quiz', 5, 'Which is a sign a claim might be less reliable?', '["A clear source is named.","No source is given at all.","The claim can be checked.","The headline matches the article."]', 1),
('qq_l3_m6_6', 'itm_l3_m6_quiz', 6, 'In British English, the device most people carry is usually called a:', '["cell phone","mobile phone","hand computer","pocket device"]', 1),
('qq_l3_m6_7', 'itm_l3_m6_quiz', 7, '"___, the company has released a statement about the issue." (a hedge for secondhand information)', '["Apparently","Certainly","Definitely","Obviously"]', 0),
('qq_l3_m6_8', 'itm_l3_m6_quiz', 8, 'Which phrase means "spread very quickly online"?', '["come out","go viral","log into","roll out"]', 1),
('qq_l3_m6_9', 'itm_l3_m6_quiz', 9, '"He told me ___ he could fix it himself."', '["that","if","when","so"]', 0),
('qq_l3_m6_10', 'itm_l3_m6_quiz', 10, 'When evaluating a headline, a critical reader should ask:', '["Does the headline match the actual article?","Is the headline exciting?","Is the headline short?","Does the headline use capital letters?"]', 0);
