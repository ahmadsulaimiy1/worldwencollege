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
