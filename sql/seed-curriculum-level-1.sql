-- WEC-LC — Real curriculum content seed: Level I, Module 1 ("Meeting
-- People"). Authored per the Executive Directive "Curriculum First" —
-- see docs/curriculum-framework.md (the six-level architecture) and
-- docs/curriculum-level-1-foundation.md (this module's full prose
-- version, including the lesson-design rationale this file only
-- carries the runnable data for).
--
-- Deliberately a SEPARATE file from sql/schema.sql: schema.sql is
-- mechanism-only DDL plus structural seed data (programme levels,
-- currencies, one courses row per level); actual curriculum content
-- will keep growing over many future milestones and does not belong
-- baked into the schema file itself. Apply after schema.sql:
--   wrangler d1 execute wec-lc --file=sql/schema.sql
--   wrangler d1 execute wec-lc --file=sql/seed-curriculum-level-1.sql
--
-- Scope, stated honestly: this is Module 1 of Level I's ten modules —
-- the worked example that sets the authoring standard, not the whole
-- level. See docs/curriculum-level-1-foundation.md's closing section
-- for exactly what is and isn't built yet. No placeholder or
-- lower-quality content is seeded for modules 2-10 to create an
-- appearance of completeness — they simply aren't seeded at all yet.

INSERT INTO units (id, course_id, sequence, title) VALUES
  ('unt_l1_m1', 'crs_level_1', 1, 'Module 1: Meeting People');

INSERT INTO learning_items (id, unit_id, sequence, kind, title, body) VALUES
('itm_l1_m1_overview', 'unt_l1_m1', 1, 'reading', 'Module Overview & Key Phrases',
'Module 1 is your first contact with WEC-LC''s Foundation Programme. By the end of this module you will be able to greet someone appropriately, introduce yourself, ask someone else''s name and country, and spell your own name aloud using the English alphabet.

Key phrases introduced this module:
Hello / Hi / Good morning / Good afternoon / Good evening / Goodbye / See you later
What''s your name? -- My name is... / I''m...
Nice to meet you.
Where are you from? -- I''m from... / I live in...
How do you spell that? / Can you repeat that, please?

Alphabet note: you are expected to recite the English alphabet and spell your own name aloud by the end of this module -- this is practised directly in Lesson 1.1''s pronunciation segment.'),

('itm_l1_m1_lesson1', 'unt_l1_m1', 2, 'reading', 'Lesson 1.1 -- Hello! Introducing Yourself',
'LEARNING OBJECTIVES: By the end of this lesson you can (1) greet someone appropriately for the time of day, (2) say your own name using "My name is.../I''m...", (3) ask someone else''s name using "What''s your name?", (4) spell your name aloud using the English alphabet.

PREREQUISITE KNOWLEDGE: None -- this is your first lesson.

WARM-UP (5 min): Your instructor greets you individually, modelling the response. Notice today''s date and time of day on the board and which greeting fits it.

PRESENTATION (10 min): Model dialogue --
A: Hello! My name is Sofia.
B: Hi, Sofia! I''m Daniel. Nice to meet you.
A: Nice to meet you too!
"My name is ___" and "I''m ___" mean the same thing. "What''s your name?" is the question that gets this answer.

GUIDED PRACTICE (10 min): Chain drill around the room -- ask "What''s your name?", answer, then ask the next person.

INDEPENDENT PRACTICE / SPEAKING ACTIVITY (10 min): "Find Someone Who" -- greet 5 different classmates, exchanging name and greeting, unscripted.

LISTENING ACTIVITY (5 min): Listen to 3 short greeting exchanges at different times of day; identify the time-of-day greeting used in each.

READING ACTIVITY (5 min): Read a short 4-line dialogue and underline every greeting phrase and every "to be" form.

WRITING TASK (5 min): Complete: "Hello! My ___ is ___. I''m ___." with your own real name.

PRONUNCIATION PRACTICE (5 min): Drill the English alphabet, then spell your own first name aloud to a partner, who writes it down and checks it back.

VOCABULARY REINFORCEMENT: hello, hi, goodbye, good morning/afternoon/evening, name, nice to meet you.

FORMATIVE ASSESSMENT: Your instructor checks, during practice, whether you can produce a greeting unprompted, state your name, and ask "What''s your name?" correctly -- observation only, not a formal grade.

HOMEWORK: Introduce yourself to one person outside class; bring one new "nice to meet you" partner name to share next lesson.

EXTENSION (for early finishers): Write and act out a 4-line dialogue introducing two invented people to each other.'),

('itm_l1_m1_lesson2', 'unt_l1_m1', 3, 'reading', 'Lesson 1.2 -- Where Are You From?',
'LEARNING OBJECTIVES: By the end of this lesson you can (1) ask and answer "Where are you from?", (2) name your own country correctly in English, (3) use "I''m from ___" and "I live in ___" correctly and tell them apart, (4) recognise at least 6 country/nationality word pairs.

PREREQUISITE KNOWLEDGE: Lesson 1.1 (greetings, "My name is/I''m", "What''s your name?").

WARM-UP (5 min): Recap "What''s your name?" chain drill, then notice your instructor answer "Where am I from?" pointing to a labelled map.

PRESENTATION (10 min): Extended dialogue --
A: Hi, I''m Sofia. Where are you from?
B: I''m from Brazil. I live in Sao Paulo. Where are you from?
A: I''m from Italy.
"I''m from + country" and "I live in + city" are different and not interchangeable. 6-8 country/nationality pairs are introduced (country names for production; nationality-adjective forms for recognition only at this level).

GUIDED PRACTICE (10 min): Pair work with a country-name card each -- ask and answer "Where are you from?", swap cards, repeat 3 times.

INDEPENDENT PRACTICE / SPEAKING ACTIVITY (10 min): Mingle and ask/answer BOTH "What''s your name?" AND "Where are you from?" with 5 classmates, using your own real information.

LISTENING ACTIVITY (5 min): Listen to 4 short self-introductions (name + country + city); match name to country to city.

READING ACTIVITY (5 min): Read 4 short profile cards and answer simple comprehension questions ("Where is Daniel from?").

WRITING TASK (5 min): Write 4 lines combining both lessons: "Hello! My name is ___. I''m from ___. I live in ___."

PRONUNCIATION PRACTICE (5 min): Drill stress on country names relevant to your class; drill rising intonation on "Where are you from?" vs. falling intonation on the answer.

VOCABULARY REINFORCEMENT: country/nationality pair matching using the pairs introduced above.

FORMATIVE ASSESSMENT: Exit ticket -- say one sentence (name + country + city) to your instructor on the way out.

HOMEWORK: Look up and write the capital city of one country introduced in class that is not your own; share briefly next lesson.

REVISION: This lesson opens with a recap of Lesson 1.1. Module 1''s Quiz and Speaking Assignment draw only on Lessons 1.1 and 1.2.

EXTENSION: Write a 4-line dialogue for two new invented people meeting for the first time, using all four target questions/statements from both lessons.'),

('itm_l1_m1_quiz', 'unt_l1_m1', 4, 'quiz', 'Module 1 Quiz -- Meeting People', NULL),

('itm_l1_m1_assignment', 'unt_l1_m1', 5, 'assignment', 'Module 1 Speaking Assignment -- Introduce Yourself',
'INSTRUCTIONS: Record yourself (or perform live for your instructor) a short spoken self-introduction, 30-60 seconds long. Include: a greeting appropriate to the time of day, your name, the country you are from, and the city you live in. Speak clearly and try to use full sentences from this module.

GRADING RUBRIC (for the instructor): (1) Content completeness -- all 4 required elements present. (2) Grammatical accuracy -- "to be" forms, "I''m from"/"I live in" distinction. (3) Pronunciation & intelligibility -- greeting stress, country-name pronunciation drilled in Lesson 1.2. (4) Delivery -- audible, reasonably fluent for A1, not read word-by-word from a script.

A grade at or above the platform''s pass threshold marks this module complete for the learner.');

INSERT INTO quiz_questions (id, learning_item_id, sequence, prompt, choices_json, correct_index) VALUES
('qq_l1_m1_1', 'itm_l1_m1_quiz', 1, '"___ name is Sofia."', '["I","My","Me","Mine"]', 1),
('qq_l1_m1_2', 'itm_l1_m1_quiz', 2, '"___ you from Brazil?"', '["Are","Is","Am","Be"]', 0),
('qq_l1_m1_3', 'itm_l1_m1_quiz', 3, '"I ___ from Nigeria."', '["is","are","am","be"]', 2),
('qq_l1_m1_4', 'itm_l1_m1_quiz', 4, '"Nice to ___ you."', '["meet","meeting","met","meets"]', 0),
('qq_l1_m1_5', 'itm_l1_m1_quiz', 5, 'It is 8 o''clock in the evening. What do you say?', '["Good morning","Good afternoon","Good evening","Good night-time"]', 2),
('qq_l1_m1_6', 'itm_l1_m1_quiz', 6, '"What''s your ___?" (asking for someone''s name)', '["from","name","live","meet"]', 1),
('qq_l1_m1_7', 'itm_l1_m1_quiz', 7, '"I''m from Italy. I ___ in Rome."', '["am","live","from","is"]', 1),
('qq_l1_m1_8', 'itm_l1_m1_quiz', 8, 'Which question asks about someone''s country?', '["What''s your name?","How are you?","Where are you from?","Nice to meet you?"]', 2);
