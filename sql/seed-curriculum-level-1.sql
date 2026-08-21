-- WEC — Real curriculum content seed: Level I ("Foundation
-- Programme," A1) — ALL 10 MODULES, complete. Authored per the
-- Executive Directive "Curriculum First" — see
-- docs/curriculum-framework.md (the six-level architecture),
-- docs/curriculum-level-1-foundation.md (Module 1's full prose
-- version plus the level-wide module map and revision guide), and
-- docs/curriculum/level-1/module-{02..10}-*.md (Modules 2-10's full
-- prose versions). This file only carries the runnable data for all
-- of that — the pedagogical rationale lives in the docs above.
--
-- Deliberately a SEPARATE file from sql/schema.sql: schema.sql is
-- mechanism-only DDL plus structural seed data (programme levels,
-- currencies, one courses row per level); actual curriculum content
-- will keep growing over many future milestones and does not belong
-- baked into the schema file itself. Apply after schema.sql:
--   wrangler d1 execute wec-lc --file=sql/schema.sql
--   wrangler d1 execute wec-lc --file=sql/seed-curriculum-level-1.sql
--
-- Scope, stated honestly: this is all of Level I — 10 modules, 49
-- learning items, 92 quiz questions, 10 rubric-graded assignments —
-- verified end-to-end via tests/curriculum-level-1-complete.test.mjs.
-- Levels II-VI are not yet seeded anywhere; see
-- docs/curriculum-level-1-foundation.md's closing section for the
-- recommended next step.

INSERT INTO units (id, course_id, sequence, title) VALUES
  ('unt_l1_m1', 'crs_level_1', 1, 'Module 1: Meeting People');

INSERT INTO learning_items (id, unit_id, sequence, kind, title, body) VALUES
('itm_l1_m1_overview', 'unt_l1_m1', 1, 'reading', 'Module Overview & Key Phrases',
'Module 1 is your first contact with WEC''s Foundation Programme. By the end of this module you will be able to greet someone appropriately, introduce yourself, ask someone else''s name and country, and spell your own name aloud using the English alphabet.

Key phrases introduced this module:
Hello / Hi / Good morning / Good afternoon / Good evening / Goodbye / See you later
What''s your name? -- My name is... / I''m...
Nice to meet you.
Where are you from? -- I''m from... / I live in...
How do you spell that? / Can you repeat that, please?

Alphabet note: you are expected to recite the English alphabet and spell your own name aloud by the end of this module -- this is practised directly in Lesson 1.1''s pronunciation segment.

COLLOCATIONS THIS MODULE (new at this level -- words that habitually go together; getting these right does more for natural English at this level than any extra grammar): make a friend -- not ''do a friend''; say hello -- not ''speak hello''; ask a question -- not ''make a question''.'),

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

CRITICAL THINKING / DISCUSSION PROMPT (level-appropriate: a real judgement, expressed with the language available at this level -- pointing, choosing, or a single corrected sentence): Two greetings: "Good morning" and "Hi". Which do you say to a teacher? Point to your answer, then say one word why: FORMAL or FRIENDLY.

HOMEWORK: Introduce yourself to one person outside class; bring one new "nice to meet you" partner name to share next lesson.

REVISION: Lesson 1.2 opens by recapping this lesson''s "What''s your name?" chain drill, and its mingling activity asks for your name alongside your country, so every phrase here is used again there. Module 1''s Quiz and Speaking Assignment draw only on Lessons 1.1 and 1.2. The Level I Revision Guide returns to this material under Module 1 -- Meeting People before the mock exam.

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

CRITICAL THINKING / DISCUSSION PROMPT (level-appropriate: a real judgement, expressed with the language available at this level -- pointing, choosing, or a single corrected sentence): Someone says "Where are you from?" and someone says "Where do you live?". Are these the same question? Show yes or no with your hand, then say your country and your city.

HOMEWORK: Look up and write the capital city of one country introduced in class that is not your own; share briefly next lesson.

REVISION: This lesson opens with a recap of Lesson 1.1. Module 1''s Quiz and Speaking Assignment draw only on Lessons 1.1 and 1.2.

EXTENSION: Write a 4-line dialogue for two new invented people meeting for the first time, using all four target questions/statements from both lessons.'),

('itm_l1_m1_quiz', 'unt_l1_m1', 4, 'quiz', 'Module 1 Quiz -- Meeting People', NULL),

('itm_l1_m1_assignment', 'unt_l1_m1', 5, 'assignment', 'Module 1 Speaking Assignment -- Introduce Yourself',
'INSTRUCTIONS: Record yourself (or perform live for your instructor) a short spoken self-introduction, 30-60 seconds long. Include: a greeting appropriate to the time of day, your name, the country you are from, and the city you live in. Speak clearly and try to use full sentences from this module.

GRADING RUBRIC (for the instructor): (1) Task completion -- all 4 required elements present. (2) Grammatical accuracy -- "to be" forms, "I''m from"/"I live in" distinction. (3) Vocabulary range -- at least 4 of the required content words (greeting, name, country, city) produced without prompting, and the country name said rather than spelled. (4) Clarity & intelligibility -- greeting stress, country-name pronunciation drilled in Lesson 1.2. (5) Fluency and delivery -- audible, reasonably fluent for A1, not read word-by-word from a script.

A grade at or above the platform''s pass threshold marks this module complete for the learner.');

INSERT INTO quiz_questions (id, learning_item_id, sequence, prompt, choices_json, correct_index) VALUES
('qq_l1_m1_1', 'itm_l1_m1_quiz', 1, '"___ name is Sofia."', '["I","Me","Mine","My"]', 3),
('qq_l1_m1_2', 'itm_l1_m1_quiz', 2, '"___ you from Brazil?"', '["Is","Are","Am","Be"]', 1),
('qq_l1_m1_3', 'itm_l1_m1_quiz', 3, '"I ___ from Nigeria."', '["am","is","are","be"]', 0),
('qq_l1_m1_4', 'itm_l1_m1_quiz', 4, '"Nice to ___ you."', '["meeting","met","meet","meets"]', 2),
('qq_l1_m1_5', 'itm_l1_m1_quiz', 5, 'It is 8 o''clock in the evening. What do you say?', '["Good morning","Good evening","Good afternoon","Good night-time"]', 1),
('qq_l1_m1_6', 'itm_l1_m1_quiz', 6, '"What''s your ___?" (asking for someone''s name)', '["from","live","meet","name"]', 3),
('qq_l1_m1_7', 'itm_l1_m1_quiz', 7, '"I''m from Italy. I ___ in Rome."', '["am","from","live","is"]', 2),
('qq_l1_m1_8', 'itm_l1_m1_quiz', 8, 'Which question asks about someone''s country?', '["Where are you from?","What''s your name?","How are you?","Nice to meet you?"]', 0),
('qq_l1_m1_9', 'itm_l1_m1_quiz', 9, '"This is Kenji. ___ is from Japan."', '["His","Him","He","He''s"]', 2),
('qq_l1_m1_10', 'itm_l1_m1_quiz', 10, 'Someone says "Nice to meet you." A natural reply is:', '["You''re welcome.","Nice to meet you too.","Yes, please.","See you."]', 1);

-- ---------------------------------------------------------------------
-- Module 2: Everyday Objects & Places
-- Full prose version: docs/curriculum/level-1/module-02-everyday-objects-places.md
-- ---------------------------------------------------------------------
INSERT INTO units (id, course_id, sequence, title) VALUES
  ('unt_l1_m2', 'crs_level_1', 2, 'Module 2: Everyday Objects & Places');

INSERT INTO learning_items (id, unit_id, sequence, kind, title, body) VALUES
('itm_l1_m2_overview', 'unt_l1_m2', 1, 'reading', 'Module Overview & Key Phrases',
'Key phrases introduced this module: There is a.../There are some... -- Is there a...?/Are there any...? -- This is my.../These are my... -- That is a.../Those are... -- Where is the...?

Key vocabulary previewed: classroom objects (desk, chair, board, book, pen, bag, window, door), home objects (bed, table, sofa, lamp, fridge, TV), places in a city (bank, school, hospital, restaurant, supermarket, park, station, hotel).

COLLOCATIONS THIS MODULE (new at this level -- words that habitually go together; getting these right does more for natural English at this level than any extra grammar): open the door -- not ''open the light''; turn on the light -- for lights and machines; tidy the room -- not ''clean up the room'' at this level.'),

('itm_l1_m2_lesson1', 'unt_l1_m2', 2, 'reading', 'Lesson 2.1 -- There Is / There Are -- My Classroom and Home',
'LEARNING OBJECTIVES: (1) name 8+ classroom and home objects, (2) use "there is" with singular nouns and "there are" with plural nouns correctly, (3) ask "Is there a...?"/"Are there any...?" and give short answers, (4) use "a/an" and plural "-s" correctly.

PREREQUISITE KNOWLEDGE: Module 1 ("to be", basic question formation).

WARM-UP (5 min): Your instructor points to 4-5 real classroom objects, naming each; you name them back.

PRESENTATION (10 min): "There is a board. There is a teacher''s desk. There are ten chairs. There are some books." Singular noun -> "there is a/an"; plural noun -> "there are". Question/short-answer pattern: "Is there a window? Yes, there is. / Are there any pens? Yes, there are."

GUIDED PRACTICE (10 min): In pairs, ask "Is there a...?"/"Are there any...?" about 6 objects in a classroom picture, answering with short forms.

INDEPENDENT PRACTICE / SPEAKING ACTIVITY (10 min): Describe your real classroom aloud in pairs, naming at least 6 real objects, then check each other''s sentences.

LISTENING ACTIVITY (5 min): Listen to a description of an unfamiliar room (read twice); tick which of 8 pictured objects are mentioned.

READING ACTIVITY (5 min): Read a short 5-sentence bedroom description and draw/label a picture matching it.

WRITING TASK (5 min): Write 3-4 sentences describing your own bedroom or living room using "there is/there are".

PRONUNCIATION PRACTICE (5 min): The weak, unstressed "there" in "there is/there are" (schwa) versus the stressed "there" meaning "in that place".

VOCABULARY REINFORCEMENT: picture-matching game, classroom/home objects to English names.

FORMATIVE ASSESSMENT: Instructor monitors practice for correct singular/plural agreement with "there is/are".

CRITICAL THINKING / DISCUSSION PROMPT (level-appropriate: a real judgement, expressed with the language available at this level -- pointing, choosing, or a single corrected sentence): Look at two rooms in the picture. Which is a kitchen? How do you know? Name one object that tells you.

HOMEWORK: Draw a simple floor plan of one room at home and label 6 objects in English.

REVISION: Lesson 2.2 opens with learners describing their homework floor plan aloud.

EXTENSION: Write 2 additional sentences using the negative form: "There isn''t a.../There aren''t any..."'),

('itm_l1_m2_lesson2', 'unt_l1_m2', 3, 'reading', 'Lesson 2.2 -- This, That, These, Those -- Around the City',
'LEARNING OBJECTIVES: (1) use "this/these" for near objects and "that/those" for far objects correctly, (2) name at least 8 common places in a town or city, (3) ask "Where is the...?" and give a simple location answer, (4) distinguish singular (this/that) from plural (these/those) demonstratives.

PREREQUISITE KNOWLEDGE: Lesson 2.1 ("there is/are", classroom/home vocabulary).

WARM-UP (5 min): Your instructor holds an object close ("This is my pen") and points far across the room ("That is the door").

PRESENTATION (10 min): "What''s this? This is a bank. And what''s that, over there? That''s the train station." "this/that" = one thing; "these/those" = more than one thing. 8 city-place words introduced: bank, school, hospital, restaurant, supermarket, park, station, hotel.

GUIDED PRACTICE (10 min): Pair work with a city map -- point to a near place and ask "What''s this?", then a far place with "What''s that?" -- 6 rounds each, swapping roles.

INDEPENDENT PRACTICE / SPEAKING ACTIVITY (10 min): Create a simple "my neighbourhood" sketch map with 5 labelled places; describe it using "this is/these are" for your own map and "that is/those are" for a place on a partner''s map.

LISTENING ACTIVITY (5 min): Listen to directions naming 4 city places in sequence; number them in order on a map worksheet.

READING ACTIVITY (5 min): Read 4 short signs (e.g. "City Hospital -- Open 24 Hours") and match each to the correct place-type picture.

WRITING TASK (5 min): Write 4 sentences naming real places in your town using "this is/these are" for nearby familiar places.

PRONUNCIATION PRACTICE (5 min): The /th/ sound in this/that/these/those, and the vowel-length contrast between "this" (short) and "these" (long).

VOCABULARY REINFORCEMENT: city-places bingo or matching game.

FORMATIVE ASSESSMENT: Exit ticket -- name one real nearby object with "this/these" and one real far object with "that/those".

CRITICAL THINKING / DISCUSSION PROMPT (level-appropriate: a real judgement, expressed with the language available at this level -- pointing, choosing, or a single corrected sentence): Your friend says "There is three chairs." Is this correct? Say the correct sentence.

HOMEWORK: Find or draw a picture of one place in your town not covered in class; bring the English name next lesson.

REVISION: This lesson opens with the Lesson 2.1 floor-plan homework recap. Module 2''s Quiz and Assignment draw on both lessons.

EXTENSION: Write a short 4-sentence "tour guide" description of your neighbourhood mixing "there is/are" with "this/that/these/those".'),

('itm_l1_m2_quiz', 'unt_l1_m2', 4, 'quiz', 'Module 2 Quiz -- Everyday Objects & Places', NULL),

('itm_l1_m2_assignment', 'unt_l1_m2', 5, 'assignment', 'Module 2 Assignment -- Describe Your Room',
'INSTRUCTIONS: Write (or record yourself speaking) 5-6 sentences describing one room in your home. Use "there is/there are" for at least 3 objects, and "this is/that is/these are/those are" for at least 2 objects. Add one sentence naming a nearby place (a shop, park, or similar) using this module''s vocabulary.

GRADING RUBRIC: (1) Grammatical accuracy -- correct "there is/are" agreement, correct demonstrative choice. (2) Vocabulary range -- at least 5 distinct objects/places named correctly. (3) Task completion -- all required sentence types present. (4) Clarity & intelligibility -- describes a real room, not a disconnected list of nouns.

A grade at or above the platform''s pass threshold marks this module complete.');

INSERT INTO quiz_questions (id, learning_item_id, sequence, prompt, choices_json, correct_index) VALUES
('qq_l1_m2_1', 'itm_l1_m2_quiz', 1, '"___ a book on the table."', '["There are","This is","There is","These are"]', 2),
('qq_l1_m2_2', 'itm_l1_m2_quiz', 2, '"___ any chairs in the room?"', '["Are there","Is there","Is this","Are these"]', 0),
('qq_l1_m2_3', 'itm_l1_m2_quiz', 3, 'Pointing at something in your hand: "___ is my pen."', '["That","Those","These","This"]', 3),
('qq_l1_m2_4', 'itm_l1_m2_quiz', 4, 'Pointing at something across the room: "___ is the door."', '["This","That","These","Those"]', 1),
('qq_l1_m2_5', 'itm_l1_m2_quiz', 5, '"There ___ ten students in my class."', '["are","is","am","be"]', 0),
('qq_l1_m2_6', 'itm_l1_m2_quiz', 6, 'Which place do you go to buy food?', '["hospital","station","supermarket","hotel"]', 2),
('qq_l1_m2_7', 'itm_l1_m2_quiz', 7, '"___ are my books." (pointing at several books near you)', '["This","These","That","Those"]', 1),
('qq_l1_m2_8', 'itm_l1_m2_quiz', 8, '"Where ___ the bank?"', '["are","am","do","is"]', 3),
('qq_l1_m2_9', 'itm_l1_m2_quiz', 9, '"There ___ any milk in the fridge." (negative)', '["aren''t","no is","isn''t","not is"]', 2),
('qq_l1_m2_10', 'itm_l1_m2_quiz', 10, 'Pointing at several books across the room: "___ are my books."', '["Those","These","This","That"]', 0);

-- ---------------------------------------------------------------------
-- Module 3: Family & Routines
-- Full prose version: docs/curriculum/level-1/module-03-family-routines.md
-- ---------------------------------------------------------------------
INSERT INTO units (id, course_id, sequence, title) VALUES
  ('unt_l1_m3', 'crs_level_1', 3, 'Module 3: Family & Routines');

INSERT INTO learning_items (id, unit_id, sequence, kind, title, body) VALUES
('itm_l1_m3_overview', 'unt_l1_m3', 1, 'reading', 'Module Overview & Key Phrases',
'Key phrases introduced this module: This is my.../I have a... -- What time is it? / It''s ... o''clock -- What time do you...? / I ... at ... -- Every day I... -- On weekdays/weekends I...

Key vocabulary previewed: family members (mother, father, sister, brother, grandmother, grandfather, wife, husband, son, daughter), daily-routine verbs (wake up, get up, have breakfast, go to work/school, come home, have dinner, go to bed), time expressions (o''clock, half past, quarter past/to, in the morning/afternoon/evening/at night).

COLLOCATIONS THIS MODULE (new at this level -- words that habitually go together; getting these right does more for natural English at this level than any extra grammar): get up -- leave your bed; have breakfast -- not ''eat breakfast'' in most British usage; go to bed -- no ''the''.'),

('itm_l1_m3_lesson1', 'unt_l1_m3', 2, 'reading', 'Lesson 3.1 -- My Family',
'LEARNING OBJECTIVES: (1) name 8+ family members, (2) describe your family using "I have.../This is my...", (3) ask "Do you have any brothers/sisters?" and answer with short forms, (4) use possessive ''s correctly for family relationships.

PREREQUISITE KNOWLEDGE: Module 2 ("there is/are", possessive groundwork from "this/that").

WARM-UP (5 min): Your instructor shows a family-tree picture of their own (or a model) family, naming each person once.

PRESENTATION (10 min): "This is my mother. Her name is Anna. I have two brothers and one sister." Family-tree vocabulary (8-10 words) with a labelled diagram. "have/has" previewed in first person as a fixed useful chunk (full practice in Module 9).

GUIDED PRACTICE (10 min): Label a blank family-tree worksheet, then in pairs quiz each other: "Who is this?"

INDEPENDENT PRACTICE / SPEAKING ACTIVITY (10 min): Draw and label your own real (or, for privacy, an invented) family tree; describe it to a partner using "This is my.../I have...".

LISTENING ACTIVITY (5 min): Listen to a family description (4-5 sentences, read twice); complete a family-tree worksheet with names in the correct boxes.

READING ACTIVITY (5 min): Read a short family description and answer 3 comprehension questions ("How many sisters does she have?").

WRITING TASK (5 min): Write 3-4 sentences describing your own (or an invented) family using "have/has".

PRONUNCIATION PRACTICE (5 min): /f/ vs. /v/ (father/brother; wife/husband); stress on two-syllable family words (grandmother, daughter).

VOCABULARY REINFORCEMENT: family-tree labelling race in pairs or small groups.

FORMATIVE ASSESSMENT: Instructor checks each learner can correctly name and describe at least 4 family relationships.

CRITICAL THINKING / DISCUSSION PROMPT (level-appropriate: a real judgement, expressed with the language available at this level -- pointing, choosing, or a single corrected sentence): Here are two routines: one person gets up at 5, one at 11. Which person works at night? Say one reason.

HOMEWORK: Bring one real (or drawn) family photo/sketch and 3 written sentences about it.

REVISION: Lesson 3.2 opens with 2-3 learners briefly sharing their homework family description.

EXTENSION: Add extended family (cousin, aunt, uncle, niece, nephew) and describe one extended-family relationship.'),

('itm_l1_m3_lesson2', 'unt_l1_m3', 3, 'reading', 'Lesson 3.2 -- My Day -- Present Simple & Time',
'LEARNING OBJECTIVES: (1) tell the time in English (o''clock, half past, quarter past/to), (2) describe a daily routine using present simple with correct third-person -s, (3) ask and answer "What time do you...?", (4) sequence daily activities using "first, then, after that, finally".

PREREQUISITE KNOWLEDGE: Lesson 3.1 (family vocabulary), Module 1 ("to be", question formation).

WARM-UP (5 min): Your instructor draws a large clock face, calling out times for you to point to on the clock.

PRESENTATION (10 min): "I wake up at 7 o''clock. I have breakfast at half past seven. I go to work at eight o''clock." Telling the time drilled with a practice clock. Present-simple third-person -s contrasted explicitly: "I wake up" vs. "She wakes up".

GUIDED PRACTICE (10 min): Pair work -- Learner A says a time, Learner B says what they typically do at that time; swap roles after 5 rounds.

INDEPENDENT PRACTICE / SPEAKING ACTIVITY (10 min): Sequence 6 jumbled routine pictures into a logical order and narrate your own version using time expressions and "first/then/after that".

LISTENING ACTIVITY (5 min): Listen to someone narrating their daily routine (6 sentences, times included); complete a timeline worksheet.

READING ACTIVITY (5 min): Read a short "A Day in the Life of..." paragraph and answer 3 comprehension questions about times and activities.

WRITING TASK (5 min): Write 5-6 sentences describing your own typical day with times, using present simple correctly.

PRONUNCIATION PRACTICE (5 min): The three pronunciations of present-simple -s/-es endings using the routine verbs from this lesson (wakes, goes, watches).

VOCABULARY REINFORCEMENT: time-telling clock-matching game plus a routine-verb sequencing card sort.

FORMATIVE ASSESSMENT: Instructor checks third-person -s accuracy during independent practice.

CRITICAL THINKING / DISCUSSION PROMPT (level-appropriate: a real judgement, expressed with the language available at this level -- pointing, choosing, or a single corrected sentence): "My sister go to school." One word is wrong. Which word? Say the correct sentence.

HOMEWORK: Write out your real daily schedule for tomorrow with times, ready to compare with a partner.

REVISION: This lesson opens with the Lesson 3.1 family-sharing recap. Module 3''s Quiz and Assignment draw on both lessons.

EXTENSION: Write 2 additional sentences contrasting weekday and weekend routines ("On weekdays I... but on weekends I...").'),

('itm_l1_m3_quiz', 'unt_l1_m3', 4, 'quiz', 'Module 3 Quiz -- Family & Routines', NULL),

('itm_l1_m3_assignment', 'unt_l1_m3', 5, 'assignment', 'Module 3 Assignment -- A Typical Day in My Life',
'INSTRUCTIONS: Write (or record) 6-8 sentences describing your typical weekday. Include at least 4 different times (o''clock/half past/quarter past/to), at least 4 routine verbs from this module, and correct present-simple third-person -s if you also describe someone else''s day.

GRADING RUBRIC: (1) Grammatical accuracy -- present-simple -s agreement, correct time expressions. (2) Vocabulary range -- at least 4 distinct routine verbs and 2 family members if describing someone else. (3) Task completion -- at least 6 sentences, at least 4 times stated. (4) Clarity & intelligibility -- activities presented in a logical time sequence.

A grade at or above the platform''s pass threshold marks this module complete.');

INSERT INTO quiz_questions (id, learning_item_id, sequence, prompt, choices_json, correct_index) VALUES
('qq_l1_m3_1', 'itm_l1_m3_quiz', 1, '"She ___ two brothers."', '["have","is","has","are"]', 2),
('qq_l1_m3_2', 'itm_l1_m3_quiz', 2, '"I ___ up at 7 o''clock every day."', '["wake","wakes","waking","woke"]', 0),
('qq_l1_m3_3', 'itm_l1_m3_quiz', 3, '"He ___ to work at 8 o''clock."', '["go","going","gone","goes"]', 3),
('qq_l1_m3_4', 'itm_l1_m3_quiz', 4, 'It is 7:30. How do you say this time?', '["Quarter past seven","Half past seven","Seven o''clock","Quarter to seven"]', 1),
('qq_l1_m3_5', 'itm_l1_m3_quiz', 5, '"This is my father''s sister. She is my ___."', '["aunt","grandmother","cousin","niece"]', 0),
('qq_l1_m3_6', 'itm_l1_m3_quiz', 6, '"What ___ do you have breakfast?"', '["when","who","time","which"]', 2),
('qq_l1_m3_7', 'itm_l1_m3_quiz', 7, '"I have dinner ___ the evening."', '["at","in","on","to"]', 1),
('qq_l1_m3_8', 'itm_l1_m3_quiz', 8, 'Which word means "comes before all the others"?', '["then","finally","after","first"]', 3),
('qq_l1_m3_9', 'itm_l1_m3_quiz', 9, '"My mother''s mother is my ___."', '["aunt","cousin","sister","grandmother"]', 3),
('qq_l1_m3_10', 'itm_l1_m3_quiz', 10, '"___ she work on Saturdays?"', '["Do","Does","Is","Are"]', 1);

-- ---------------------------------------------------------------------
-- Module 4: Food & Shopping
-- Full prose version: docs/curriculum/level-1/module-04-food-shopping.md
-- ---------------------------------------------------------------------
INSERT INTO units (id, course_id, sequence, title) VALUES
  ('unt_l1_m4', 'crs_level_1', 4, 'Module 4: Food & Shopping');

INSERT INTO learning_items (id, unit_id, sequence, kind, title, body) VALUES
('itm_l1_m4_overview', 'unt_l1_m4', 1, 'reading', 'Module Overview & Key Phrases',
'Key phrases introduced this module: Is there any...?/Are there any...? -- I''d like some... -- How much is/are...? -- Can I have..., please? -- That''s $.../£... -- Here you are. / Thank you.

Key vocabulary previewed: foods (bread, rice, milk, eggs, apples, bananas, chicken, water, coffee, tea), shops (bakery, greengrocer, supermarket, market), numbers 20-100, money/price vocabulary.

COLLOCATIONS THIS MODULE (new at this level -- words that habitually go together; getting these right does more for natural English at this level than any extra grammar): do the shopping -- not ''make the shopping''; pay the bill -- not ''pay the money''; make a cake -- ''make'' for things you create.'),

('itm_l1_m4_lesson1', 'unt_l1_m4', 2, 'reading', 'Lesson 4.1 -- Countable & Uncountable -- What''s in the Kitchen?',
'LEARNING OBJECTIVES: (1) distinguish countable nouns (an egg, three apples) from uncountable nouns (rice, milk, water), (2) use "some" in positive statements and "any" in questions/negatives for both noun types, (3) name 10+ common foods, (4) use "a/an" correctly with countable food nouns.

PREREQUISITE KNOWLEDGE: Module 2 ("there is/are", "a/an").

WARM-UP (5 min): Sort real or pictured food items into "things you can count" / "things you can''t count" columns based on guesses.

PRESENTATION (10 min): "There is some rice in the cupboard. There are some eggs in the fridge. Is there any milk? Yes, there is some." Countable nouns take a/an (singular) or a number/some (plural); uncountable nouns never take a/an or a number, only some/any.

GUIDED PRACTICE (10 min): Sort 16 food-word cards into countable/uncountable columns, then build 4 "there is/are some..." sentences each.

INDEPENDENT PRACTICE / SPEAKING ACTIVITY (10 min): Look at a full fridge/cupboard picture, write 5 "some" sentences, then ask a partner 3 "Is there any...?/Are there any...?" questions about it.

LISTENING ACTIVITY (5 min): Listen to a shopping-list dictation (6 items) and write down what''s mentioned, noting countable vs. uncountable correctly.

READING ACTIVITY (5 min): Read a simple recipe ingredient list and sort the ingredients into countable/uncountable.

WRITING TASK (5 min): Write a shopping list of 6 items you need this week, using correct countable/uncountable forms.

PRONUNCIATION PRACTICE (5 min): The reduced, unstressed pronunciation of "some" in fluent speech.

VOCABULARY REINFORCEMENT: food flashcard/realia naming race, sorted live into countable/uncountable.

FORMATIVE ASSESSMENT: Instructor checks correct some/any choice and countable/uncountable agreement.

CRITICAL THINKING / DISCUSSION PROMPT (level-appropriate: a real judgement, expressed with the language available at this level -- pointing, choosing, or a single corrected sentence): You have $5. An apple is $1 and a cake is $6. What can you buy? Say why not the other one.

HOMEWORK: List everything in your real fridge/cupboard at home (6+ items) in English, for Lesson 4.2''s shopping roleplay.

REVISION: Lesson 4.2 opens with a rapid countable/uncountable sorting recap using new food words.

EXTENSION: Write 2 sentences using "a lot of" and "not much/not many" with food nouns.'),

('itm_l1_m4_lesson2', 'unt_l1_m4', 3, 'reading', 'Lesson 4.2 -- At the Shop -- Prices & Requests',
'LEARNING OBJECTIVES: (1) ask "How much is/are...?" correctly for singular/plural items, (2) state and understand prices in English, (3) make a polite purchase request ("Can I have..., please?"), (4) respond appropriately when paying and receiving change.

PREREQUISITE KNOWLEDGE: Lesson 4.1 (food vocabulary, countable/uncountable).

WARM-UP (5 min): Your instructor holds up priced items and models "How much is this? It''s $2." for 3-4 items.

PRESENTATION (10 min): Shop dialogue -- "Can I help you? Yes, please. Can I have some apples? Sure. That''s $3. Here you are. Thank you!" "How much is" (singular/uncountable) vs. "How much are" (plural). Numbers 20-100 and simple prices drilled.

GUIDED PRACTICE (10 min): Pair work with priced picture cards -- ask "How much is/are the...?", answer with the price shown, then swap.

INDEPENDENT PRACTICE / SPEAKING ACTIVITY (10 min): Perform the full shop dialogue in pairs using your Lesson 4.1 shopping list, taking turns as shopkeeper and customer.

LISTENING ACTIVITY (5 min): Listen to 3 short shop exchanges and write down the item and price mentioned in each.

READING ACTIVITY (5 min): Read a simple price list/menu and answer 3 questions ("How much is the coffee?").

WRITING TASK (5 min): Write a short 4-line shop dialogue using at least 2 items and prices from this module.

PRONUNCIATION PRACTICE (5 min): Commonly confused number pairs (thirteen/thirty, fourteen/forty); rising intonation on "How much is/are...?"

VOCABULARY REINFORCEMENT: price-matching game (item cards to price cards) in pairs.

FORMATIVE ASSESSMENT: Instructor observes the roleplay for correct is/are choice and politeness phrases.

CRITICAL THINKING / DISCUSSION PROMPT (level-appropriate: a real judgement, expressed with the language available at this level -- pointing, choosing, or a single corrected sentence): Which is more polite: "Give me coffee" or "Can I have a coffee, please?" Say the polite one aloud.

HOMEWORK: Practise the shop dialogue once more at home before Module 4''s assignment roleplay.

REVISION: This lesson opens with the countable/uncountable recap noted above. Module 4''s Quiz and Assignment draw on both lessons.

EXTENSION: Extend the dialogue with a complaint/request for a different item ("Do you have any bigger ones?").'),

('itm_l1_m4_quiz', 'unt_l1_m4', 4, 'quiz', 'Module 4 Quiz -- Food & Shopping', NULL),

('itm_l1_m4_assignment', 'unt_l1_m4', 5, 'assignment', 'Module 4 Assignment -- At the Market Roleplay',
'INSTRUCTIONS: Record yourself (or perform live) a short shop dialogue, 45-60 seconds, playing both the customer and the shopkeeper (or with a partner). Include: a greeting, a purchase request using "Can I have...?", at least 2 food items (at least one countable, one uncountable), a "How much is/are...?" question with a stated price, and a polite closing exchange.

GRADING RUBRIC: (1) Grammatical accuracy -- correct some/any, correct is/are with prices. (2) Vocabulary range -- at least 2 distinct food items, at least one price stated correctly. (3) Task completion -- all required dialogue elements present. (4) Clarity & intelligibility -- appropriate please/thank you usage, audible and reasonably fluent for A1.

A grade at or above the platform''s pass threshold marks this module complete.');

INSERT INTO quiz_questions (id, learning_item_id, sequence, prompt, choices_json, correct_index) VALUES
('qq_l1_m4_1', 'itm_l1_m4_quiz', 1, '"There is ___ milk in the fridge."', '["some","a","many","an"]', 0),
('qq_l1_m4_2', 'itm_l1_m4_quiz', 2, '"Is there ___ bread?"', '["some","a","any","much"]', 2),
('qq_l1_m4_3', 'itm_l1_m4_quiz', 3, 'Which is uncountable?', '["apple","rice","egg","banana"]', 1),
('qq_l1_m4_4', 'itm_l1_m4_quiz', 4, '"How much ___ the apples?"', '["is","am","be","are"]', 3),
('qq_l1_m4_5', 'itm_l1_m4_quiz', 5, '"Can I ___ some coffee, please?"', '["has","having","have","had"]', 2),
('qq_l1_m4_6', 'itm_l1_m4_quiz', 6, '"That''s $5. Here you ___."', '["are","am","is","be"]', 0),
('qq_l1_m4_7', 'itm_l1_m4_quiz', 7, 'Where do you buy bread?', '["greengrocer","bank","station","bakery"]', 3),
('qq_l1_m4_8', 'itm_l1_m4_quiz', 8, '"There are ___ eggs in the box."', '["any","some","a","an"]', 1),
('qq_l1_m4_9', 'itm_l1_m4_quiz', 9, '"I''d like ___ apples, please."', '["any","much","some","a"]', 2),
('qq_l1_m4_10', 'itm_l1_m4_quiz', 10, '"How ___ sugar do you want?"', '["many","much","a lot","some"]', 1);

-- ---------------------------------------------------------------------
-- Module 5: Around Town
-- Full prose version: docs/curriculum/level-1/module-05-around-town.md
-- ---------------------------------------------------------------------
INSERT INTO units (id, course_id, sequence, title) VALUES
  ('unt_l1_m5', 'crs_level_1', 5, 'Module 5: Around Town');

INSERT INTO learning_items (id, unit_id, sequence, kind, title, body) VALUES
('itm_l1_m5_overview', 'unt_l1_m5', 1, 'reading', 'Module Overview & Key Phrases',
'Key phrases introduced this module: Excuse me, where is the...? -- Go straight on. / Turn left/right. -- It''s next to.../opposite.../between... -- It''s on the corner of... -- Is it far from here? -- It''s five minutes'' walk.

Key vocabulary previewed: prepositions of place (in, on, at, next to, opposite, between, near, in front of, behind), direction verbs (go straight, turn left/right, cross), places (post office, pharmacy, library, cinema).

COLLOCATIONS THIS MODULE (new at this level -- words that habitually go together; getting these right does more for natural English at this level than any extra grammar): catch a bus -- not ''take a bus'' in British usage; cross the road -- not ''pass the road''; wait for a taxi -- ''wait for'', never ''wait''.'),

('itm_l1_m5_lesson1', 'unt_l1_m5', 2, 'reading', 'Lesson 5.1 -- Where Is It? -- Prepositions of Place',
'LEARNING OBJECTIVES: (1) use 6+ prepositions of place correctly, (2) ask "Where is the...?" and answer using a preposition of place, (3) distinguish "next to"/"opposite"/"between" on a simple map.

PREREQUISITE KNOWLEDGE: Module 2 (city-place vocabulary, "this/that").

WARM-UP (5 min): Your instructor places a real object in different positions relative to another object, narrating each placement once.

PRESENTATION (10 min): "The bank is next to the supermarket. The park is opposite the school. The hotel is between the bank and the station." Each preposition shown with a simple diagram icon.

GUIDED PRACTICE (10 min): Pair work -- name a place on a map, say its location using a preposition, then swap; repeat for 6 places.

INDEPENDENT PRACTICE / SPEAKING ACTIVITY (10 min): Given a map with 3 places missing and prepositional clues, place the missing buildings correctly, then check with a partner. Then describe your real route from home to school/work using at least 3 prepositions.

LISTENING ACTIVITY (5 min): Listen to 4 short location descriptions and identify which building on a map is described.

READING ACTIVITY (5 min): Read a paragraph describing a street and draw the buildings in the correct positions on a blank map.

WRITING TASK (5 min): Write 4 sentences locating real places in your town using prepositions from this lesson.

PRONUNCIATION PRACTICE (5 min): Word stress on two-word prepositional phrases (next TO, opPOsite, beTWEEN) and linking to the following noun.

VOCABULARY REINFORCEMENT: preposition mime/action game plus a map-labelling race.

FORMATIVE ASSESSMENT: Instructor checks correct preposition choice during the independent map-completion task.

CRITICAL THINKING / DISCUSSION PROMPT (level-appropriate: a real judgement, expressed with the language available at this level -- pointing, choosing, or a single corrected sentence): Your friend is at the bank and wants the library. Look at the map. Do they turn left or right? Say the direction.

HOMEWORK: Draw a simple map of 4 real places near your home with correct prepositional relationships noted.

REVISION: Lesson 5.2 opens with learners sharing their homework map in pairs.

EXTENSION: Add "in front of" and "behind" to your homework map description.'),

('itm_l1_m5_lesson2', 'unt_l1_m5', 3, 'reading', 'Lesson 5.2 -- Excuse Me, How Do I Get To...? -- Giving Directions',
'LEARNING OBJECTIVES: (1) ask for directions politely ("Excuse me, how do I get to...?"), (2) give simple directions using imperatives ("Go straight on. Turn left/right. Cross the road."), (3) understand and follow a short sequence of spoken directions, (4) estimate/state simple walking distance.

PREREQUISITE KNOWLEDGE: Lesson 5.1 (prepositions of place, town vocabulary).

WARM-UP (5 min): Your instructor gives 3 quick physical imperatives ("Stand up. Turn left. Sit down.") before direction-specific imperatives.

PRESENTATION (10 min): "Excuse me, how do I get to the library? Go straight on, then turn left. It''s on the corner, next to the pharmacy. It''s about five minutes'' walk. Thank you very much!" The imperative form (no subject pronoun) and its politeness frame highlighted.

GUIDED PRACTICE (10 min): Pair work with a street map -- ask for directions, give a 2-3 step direction using imperatives; swap after each round, 4 rounds.

INDEPENDENT PRACTICE / SPEAKING ACTIVITY (10 min): Follow a partner''s spoken directions by tracing a route with your finger on a blank map, then check if you arrived at the correct destination.

LISTENING ACTIVITY (5 min): Listen to a set of directions (4 steps) and draw the route on a map, marking the final destination.

READING ACTIVITY (5 min): Read written directions to a place and identify the destination on a map from 4 options.

WRITING TASK (5 min): Write directions from the school/class location to one real nearby place, using at least 3 imperatives.

PRONUNCIATION PRACTICE (5 min): Imperative sentence stress (GO straight, TURN left) and politeness-softening intonation on "Excuse me."

VOCABULARY REINFORCEMENT: direction-verb charades in small groups.

FORMATIVE ASSESSMENT: Instructor checks whether learners can both give and correctly follow a 2-3 step direction.

CRITICAL THINKING / DISCUSSION PROMPT (level-appropriate: a real judgement, expressed with the language available at this level -- pointing, choosing, or a single corrected sentence): Someone says "Go straight on" but points backwards. Which do you follow -- the words or the hand? Say your answer and one reason.

HOMEWORK: Write directions from your home to one place you visit often, ready to read aloud next lesson.

REVISION: This lesson opens with the Lesson 5.1 homework-map sharing recap. Module 5''s Quiz and Assignment draw on both lessons.

EXTENSION: Add a second destination to your direction-giving dialogue, requiring a longer, multi-step direction.'),

('itm_l1_m5_quiz', 'unt_l1_m5', 4, 'quiz', 'Module 5 Quiz -- Around Town', NULL),

('itm_l1_m5_assignment', 'unt_l1_m5', 5, 'assignment', 'Module 5 Assignment -- Direct a Visitor',
'INSTRUCTIONS: Imagine a visitor to your town asks you for directions to a real place near where you live. Record yourself (or write) giving clear directions, 45-60 seconds or 5-6 sentences. Include: a polite opening, at least 2 imperative direction instructions, at least 1 preposition of place describing the destination''s location, and an estimated walking time.

GRADING RUBRIC: (1) Grammatical accuracy -- correct imperative forms, correct preposition of place. (2) Vocabulary range -- at least 2 distinct direction verbs used. (3) Task completion -- all required elements present. (4) Clarity & intelligibility -- directions are logical and could realistically be followed.

A grade at or above the platform''s pass threshold marks this module complete.');

INSERT INTO quiz_questions (id, learning_item_id, sequence, prompt, choices_json, correct_index) VALUES
('qq_l1_m5_1', 'itm_l1_m5_quiz', 1, '"The bank is ___ the supermarket." (right beside it)', '["opposite","between","next to","behind"]', 2),
('qq_l1_m5_2', 'itm_l1_m5_quiz', 2, '"The park is ___ the school." (facing it, across the street)', '["opposite","next to","in","at"]', 0),
('qq_l1_m5_3', 'itm_l1_m5_quiz', 3, '"The hotel is ___ the bank and the station."', '["next to","opposite","in front of","between"]', 3),
('qq_l1_m5_4', 'itm_l1_m5_quiz', 4, '"Excuse me, how do I ___ to the library?"', '["going","get","goes","went"]', 1),
('qq_l1_m5_5', 'itm_l1_m5_quiz', 5, '"___ straight on, then turn left."', '["Go","Going","Goes","Went"]', 0),
('qq_l1_m5_6', 'itm_l1_m5_quiz', 6, 'Which is a polite way to start asking for help in the street?', '["Hey, you!","Where?","Excuse me","Now!"]', 2),
('qq_l1_m5_7', 'itm_l1_m5_quiz', 7, '"It''s about five ___ walk."', '["minute","minutes''","minutes","minuting"]', 1),
('qq_l1_m5_8', 'itm_l1_m5_quiz', 8, '"The pharmacy is ___ the corner."', '["at","in","next","on"]', 3),
('qq_l1_m5_9', 'itm_l1_m5_quiz', 9, '"Turn ___ at the traffic lights."', '["straight","near","next","right"]', 3),
('qq_l1_m5_10', 'itm_l1_m5_quiz', 10, '"The bus stop is ___ from the station." (a short distance away)', '["not far","no far","not long","not near"]', 0);

-- ---------------------------------------------------------------------
-- Module 6: Describing People & Things
-- Full prose version: docs/curriculum/level-1/module-06-describing-people-things.md
-- ---------------------------------------------------------------------
INSERT INTO units (id, course_id, sequence, title) VALUES
  ('unt_l1_m6', 'crs_level_1', 6, 'Module 6: Describing People & Things');

INSERT INTO learning_items (id, unit_id, sequence, kind, title, body) VALUES
('itm_l1_m6_overview', 'unt_l1_m6', 1, 'reading', 'Module Overview & Key Phrases',
'Key phrases introduced this module: What does he/she look like? -- He/She has.../He/She is... -- It''s mine/yours/his/hers/ours/theirs. -- Whose is this? -- It''s a big red bag.

Key vocabulary previewed: appearance adjectives (tall, short, young, old, thin, curly/straight hair, brown/blue eyes), general adjectives (big, small, new, old, expensive, cheap), colours.

COLLOCATIONS THIS MODULE (new at this level -- words that habitually go together; getting these right does more for natural English at this level than any extra grammar): have long hair -- not ''have longs hairs'' -- hair is uncountable; wear glasses -- not ''use glasses''; look like -- resemble; ''look'' alone means seem.'),

('itm_l1_m6_lesson1', 'unt_l1_m6', 2, 'reading', 'Lesson 6.1 -- What Does She Look Like? -- Describing People',
'LEARNING OBJECTIVES: (1) describe a person''s appearance using "He/She is.../He/She has...", (2) use 8+ appearance adjectives correctly, (3) ask "What does he/she look like?", (4) use "has/have got" (light preview) for physical features.

PREREQUISITE KNOWLEDGE: Module 3 (family vocabulary, have/has preview), Module 1 ("to be").

WARM-UP (5 min): Your instructor describes their own appearance aloud ("I have short hair. I am tall.") while pointing to themselves.

PRESENTATION (10 min): "What does your brother look like? He''s tall. He has short black hair." "is/are" + adjective for general qualities vs. "has/have" + noun for specific features. 8-10 appearance adjectives introduced with picture support.

GUIDED PRACTICE (10 min): Pair work -- describe a mystery picture person using 3 sentences, partner guesses which of 4 pictured people is described.

INDEPENDENT PRACTICE / SPEAKING ACTIVITY (10 min): Describe a real classmate (with permission, kept respectful and positive) using at least 3 target sentences, for a partner to guess who it is.

LISTENING ACTIVITY (5 min): Listen to 3 short person descriptions and match each to the correct picture from a set of 5.

READING ACTIVITY (5 min): Read 3 short playful "lost teddy bear"-style description cards and match to pictures.

WRITING TASK (5 min): Write 4 sentences describing a real or famous person''s appearance.

PRONUNCIATION PRACTICE (5 min): The weak-form "has" in connected speech versus its full form in short answers.

VOCABULARY REINFORCEMENT: appearance-adjective picture-matching game.

FORMATIVE ASSESSMENT: Instructor checks correct is/has choice during the guess-who activity.

CRITICAL THINKING / DISCUSSION PROMPT (level-appropriate: a real judgement, expressed with the language available at this level -- pointing, choosing, or a single corrected sentence): Two people: one is tall with short hair, one is short with long hair. A friend says "the tall one". Which person? Point, then describe them in three words.

HOMEWORK: Write a description of one family member''s appearance (3-4 sentences), for Module 6''s assignment.

REVISION: Lesson 6.2 opens with 2-3 learners reading their homework description aloud for the class to guess the relationship.

EXTENSION: Add a comparison sentence ("My brother is taller than me") as a light preview of Level II''s comparatives.'),

('itm_l1_m6_lesson2', 'unt_l1_m6', 3, 'reading', 'Lesson 6.2 -- Whose Is It? -- Possessives & Describing Things',
'LEARNING OBJECTIVES: (1) use possessive adjectives (my/your/his/her/our/their) correctly, (2) use possessive pronouns (mine/yours/his/hers/ours/theirs) in short answers, (3) ask "Whose is this/are these?", (4) order two adjectives correctly before a noun (size + colour).

PREREQUISITE KNOWLEDGE: Lesson 6.1 (adjectives), Module 3 (possessive ''s).

WARM-UP (5 min): Your instructor picks up a few learners'' real belongings (with permission) and asks "Whose is this?"

PRESENTATION (10 min): "This is my bag. Is this your pen? No, it''s not mine, it''s his." Possessive adjective + noun contrasted with possessive pronoun alone. Basic two-adjective ordering introduced ("a big red bag", "a small blue car").

GUIDED PRACTICE (10 min): Pair work -- mix a small pile of real classroom belongings, take turns asking "Whose is this?" and answering with the correct possessive pronoun.

INDEPENDENT PRACTICE / SPEAKING ACTIVITY (10 min): Describe 4 of your own real belongings using size + colour + noun ("my small black bag"), then swap descriptions with a partner who identifies the item from a set on the table.

LISTENING ACTIVITY (5 min): Listen to 4 short "whose is this" exchanges and note who each item belongs to.

READING ACTIVITY (5 min): Read 4 short "lost and found" notices and match each description to the correct pictured item.

WRITING TASK (5 min): Write a short "lost and found" notice describing one of your own real or imagined lost items using 2 adjectives in correct order.

PRONUNCIATION PRACTICE (5 min): The pronunciation distinction between "whose" and "who''s" (same sound, different spelling/meaning) -- awareness only, not formally tested at this level.

VOCABULARY REINFORCEMENT: "Whose is it?" belongings game in small groups.

FORMATIVE ASSESSMENT: Instructor checks correct possessive adjective/pronoun choice and adjective order.

CRITICAL THINKING / DISCUSSION PROMPT (level-appropriate: a real judgement, expressed with the language available at this level -- pointing, choosing, or a single corrected sentence): Is "a red big car" correct English? Say the correct order.

HOMEWORK: Write 3 sentences describing 3 different belongings using possessives and two-adjective ordering.

REVISION: This lesson opens with the Lesson 6.1 family-description sharing recap. Module 6''s Quiz and Assignment draw on both lessons.

EXTENSION: Write a short "lost and found" notice combining a person description with an object description.'),

('itm_l1_m6_quiz', 'unt_l1_m6', 4, 'quiz', 'Module 6 Quiz -- Describing People & Things', NULL),

('itm_l1_m6_assignment', 'unt_l1_m6', 5, 'assignment', 'Module 6 Assignment -- Describe a Family Member',
'INSTRUCTIONS: Write (or record) 5-6 sentences describing one family member''s appearance and one of their belongings. Use at least 2 has/is appearance sentences, correct possessive adjectives, and one two-adjective description (size + colour) of an object belonging to them.

GRADING RUBRIC: (1) Grammatical accuracy -- correct is/has choice, correct possessives, correct adjective order. (2) Vocabulary range -- at least 3 distinct adjectives used correctly. (3) Task completion -- describes both a person and an object. (4) Clarity & intelligibility -- specific and coherent, not a list of disconnected words.

A grade at or above the platform''s pass threshold marks this module complete.');

INSERT INTO quiz_questions (id, learning_item_id, sequence, prompt, choices_json, correct_index) VALUES
('qq_l1_m6_1', 'itm_l1_m6_quiz', 1, '"She ___ long brown hair."', '["is","have","are","has"]', 3),
('qq_l1_m6_2', 'itm_l1_m6_quiz', 2, '"He ___ tall and young."', '["has","is","have","are"]', 1),
('qq_l1_m6_3', 'itm_l1_m6_quiz', 3, '"___ is this bag? -- It''s mine."', '["Whose","Who","Which","What"]', 0),
('qq_l1_m6_4', 'itm_l1_m6_quiz', 4, '"This isn''t my pen. It''s ___."', '["her","she","hers","she''s"]', 2),
('qq_l1_m6_5', 'itm_l1_m6_quiz', 5, 'Which sentence has the correct adjective order?', '["a red big bag","a big red bag","a bag big red","a big bag red"]', 1),
('qq_l1_m6_6', 'itm_l1_m6_quiz', 6, '"That''s not our car. It''s ___."', '["their","they","them","theirs"]', 3),
('qq_l1_m6_7', 'itm_l1_m6_quiz', 7, '"Is this ___ book?" (asking someone directly)', '["you","yours","your","you''re"]', 2),
('qq_l1_m6_8', 'itm_l1_m6_quiz', 8, '"My sister has short ___ hair."', '["curly","tall","expensive","cheap"]', 0),
('qq_l1_m6_9', 'itm_l1_m6_quiz', 9, '"Maria is my friend. ___ eyes are blue."', '["She","Hers","Her","She''s"]', 2),
('qq_l1_m6_10', 'itm_l1_m6_quiz', 10, '"He''s got a ___ car." (correct adjective order)', '["red small nice","nice small red","small nice red","nice red small"]', 1);

-- ---------------------------------------------------------------------
-- Module 7: Past Experiences
-- Full prose version: docs/curriculum/level-1/module-07-past-experiences-i.md
-- ---------------------------------------------------------------------
INSERT INTO units (id, course_id, sequence, title) VALUES
  ('unt_l1_m7', 'crs_level_1', 7, 'Module 7: Past Experiences');

INSERT INTO learning_items (id, unit_id, sequence, kind, title, body) VALUES
('itm_l1_m7_overview', 'unt_l1_m7', 1, 'reading', 'Module Overview & Key Phrases',
'Key phrases introduced this module: Yesterday I.../Last week I... -- Did you...? Yes, I did. / No, I didn''t. -- What did you do? -- Two days ago... -- I went.../I saw.../I had...

Key vocabulary previewed: regular past verbs (worked, watched, studied, played, cooked, cleaned, visited), common irregular past verbs (went, saw, had, ate, did, made, bought), past-time expressions (yesterday, last night/week/weekend, two days ago).

COLLOCATIONS THIS MODULE (new at this level -- words that habitually go together; getting these right does more for natural English at this level than any extra grammar): have a good time -- not ''pass a good time''; take a photo -- not ''make a photo''; meet a friend -- ''meet'', not ''know'', for arranging to see someone.'),

('itm_l1_m7_lesson1', 'unt_l1_m7', 2, 'reading', 'Lesson 7.1 -- Yesterday -- Regular Past Verbs',
'LEARNING OBJECTIVES: (1) form the regular simple past correctly (-ed), (2) use 8+ regular past verbs to talk about yesterday, (3) form simple past negative statements (didn''t + base verb), (4) use "yesterday"/"last night" correctly with the simple past.

PREREQUISITE KNOWLEDGE: Module 3 (present simple, as the contrast point for this new tense).

WARM-UP (5 min): Your instructor mimes 3-4 yesterday activities ("cooked", "cleaned", "watched TV") for you to guess.

PRESENTATION (10 min): "Yesterday I worked in the morning. I watched TV in the evening. I didn''t study." The -ed ending rule and the negative pattern "didn''t + base verb" (the base verb, not the past form, after didn''t).

GUIDED PRACTICE (10 min): Given a picture sequence of someone''s yesterday, build 5 sentences together using regular past verbs.

INDEPENDENT PRACTICE / SPEAKING ACTIVITY (10 min): Write 5 true sentences about your own real yesterday (at least 1 negative using didn''t), then share with a partner who asks one follow-up "Did you...?" question.

LISTENING ACTIVITY (5 min): Listen to someone describing their yesterday (6 sentences) and tick which of 8 activities they mention.

READING ACTIVITY (5 min): Read a short diary-style paragraph about yesterday and answer 3 comprehension questions.

WRITING TASK (5 min): Write a short diary entry (4-5 sentences) about your real yesterday using regular past verbs.

PRONUNCIATION PRACTICE (5 min): The three pronunciations of regular past -ed (/t/, /d/, /ɪd/), building on Module 3''s introduction of this pattern for present-simple -s.

VOCABULARY REINFORCEMENT: past-tense verb bingo (base form called, learners mark the past form).

FORMATIVE ASSESSMENT: Instructor checks correct -ed formation and correct "didn''t + base verb" during independent writing.

CRITICAL THINKING / DISCUSSION PROMPT (level-appropriate: a real judgement, expressed with the language available at this level -- pointing, choosing, or a single corrected sentence): "Yesterday I go to the park." One word is wrong. Which one? Say the correct sentence.

HOMEWORK: Write 3 more sentences about last night using regular past verbs, for Lesson 7.2.

REVISION: Lesson 7.2 opens with a rapid regular-past-verb recap game before introducing irregular verbs.

EXTENSION: Identify and correct 2 deliberately-wrong -ed forms in a short error-correction exercise.'),

('itm_l1_m7_lesson2', 'unt_l1_m7', 3, 'reading', 'Lesson 7.2 -- Last Weekend -- Irregular Past Verbs & Questions',
'LEARNING OBJECTIVES: (1) use 8+ common irregular past verbs correctly, (2) form simple past yes/no questions ("Did you...?") and short answers, (3) form simple past wh- questions ("What did you...?/Where did you go?"), (4) narrate a short weekend event in logical sequence.

PREREQUISITE KNOWLEDGE: Lesson 7.1 (regular past, didn''t).

WARM-UP (5 min): Your instructor tells one true irregular-verb-rich sentence about their own last weekend for you to identify which verbs are NOT -ed forms.

PRESENTATION (10 min): "Did you go out last weekend? Yes, I did. I went to the beach. I saw my cousins. We had a great time!" 8-10 common irregular verbs presented as a memorisable list (go-went, see-saw, have-had, eat-ate, do-did, make-made, buy-bought, get-got). Question pattern: "Did + subject + base verb" highlighted.

GUIDED PRACTICE (10 min): Pair work -- ask 4 "Did you...?" questions using irregular verbs from a prompt list, answer truthfully with short answers, then swap.

INDEPENDENT PRACTICE / SPEAKING ACTIVITY (10 min): Interview a partner about their real last weekend using at least 2 wh- questions and report back one fact about your partner to the class.

LISTENING ACTIVITY (5 min): Listen to someone narrating their weekend (6-7 sentences, irregular verbs included) and complete a sequencing worksheet.

READING ACTIVITY (5 min): Read a short weekend-diary text and answer 3 wh- comprehension questions.

WRITING TASK (5 min): Write 5-6 sentences narrating a real or invented last weekend, using at least 3 irregular past verbs in logical order.

PRONUNCIATION PRACTICE (5 min): Natural sentence stress in short-answer forms ("Yes, I DID"/"No, I DIDn''t") and correct vowel sounds in commonly mispronounced irregular past forms.

VOCABULARY REINFORCEMENT: irregular-verb pairs memory/matching game.

FORMATIVE ASSESSMENT: Instructor checks correct question formation (Did + base verb) during the interview activity.

CRITICAL THINKING / DISCUSSION PROMPT (level-appropriate: a real judgement, expressed with the language available at this level -- pointing, choosing, or a single corrected sentence): Someone tells you three things they did. Which one happened first? Say the time word that tells you.

HOMEWORK: Prepare 4-5 sentences about a real past holiday or trip, for Module 7''s assignment.

REVISION: This lesson opens with the Lesson 7.1 regular-verb recap. Module 7''s Quiz and Assignment draw on both lessons.

EXTENSION: Add one negative irregular past sentence ("I didn''t see...") and one follow-up question to your weekend narration.'),

('itm_l1_m7_quiz', 'unt_l1_m7', 4, 'quiz', 'Module 7 Quiz -- Past Experiences I', NULL),

('itm_l1_m7_assignment', 'unt_l1_m7', 5, 'assignment', 'Module 7 Assignment -- My Last Holiday',
'INSTRUCTIONS: Write (or record) 6-8 sentences narrating a real (or invented, if preferred) recent holiday or trip. Use at least 3 regular past verbs and at least 3 irregular past verbs. Include at least one past-time expression and present events in a logical time order.

GRADING RUBRIC: (1) Grammatical accuracy -- correct regular -ed forms, correct irregular past forms, correct negative form if used. (2) Vocabulary range -- at least 3 regular and 3 irregular verbs used correctly. (3) Task completion -- at least 6 sentences, at least one time expression. (4) Clarity & intelligibility -- events presented in a logical narrative sequence.

A grade at or above the platform''s pass threshold marks this module complete.');

INSERT INTO quiz_questions (id, learning_item_id, sequence, prompt, choices_json, correct_index) VALUES
('qq_l1_m7_1', 'itm_l1_m7_quiz', 1, '"I ___ TV yesterday evening."', '["watch","watching","watched","watches"]', 2),
('qq_l1_m7_2', 'itm_l1_m7_quiz', 2, '"She ___ study last night."', '["didn''t","don''t","doesn''t","isn''t"]', 0),
('qq_l1_m7_3', 'itm_l1_m7_quiz', 3, '"___ you go to the party?"', '["Do","Does","Were","Did"]', 3),
('qq_l1_m7_4', 'itm_l1_m7_quiz', 4, '"Yes, I ___."', '["do","did","does","was"]', 1),
('qq_l1_m7_5', 'itm_l1_m7_quiz', 5, '"We ___ to the beach last weekend."', '["went","go","goed","going"]', 0),
('qq_l1_m7_6', 'itm_l1_m7_quiz', 6, '"What ___ you eat for breakfast?"', '["do","does","did","were"]', 2),
('qq_l1_m7_7', 'itm_l1_m7_quiz', 7, 'Which is the correct past form of "buy"?', '["buyed","bought","buys","buying"]', 1),
('qq_l1_m7_8', 'itm_l1_m7_quiz', 8, '"Two days ___ I visited my grandmother."', '["before","last","past","ago"]', 3),
('qq_l1_m7_9', 'itm_l1_m7_quiz', 9, '"They ___ at home last night."', '["was","been","are","were"]', 3),
('qq_l1_m7_10', 'itm_l1_m7_quiz', 10, '"I saw her ___ week."', '["ago","last","yesterday","before"]', 1);

-- ---------------------------------------------------------------------
-- Module 8: Plans & Abilities
-- Full prose version: docs/curriculum/level-1/module-08-plans-abilities.md
-- ---------------------------------------------------------------------
INSERT INTO units (id, course_id, sequence, title) VALUES
  ('unt_l1_m8', 'crs_level_1', 8, 'Module 8: Plans & Abilities');

INSERT INTO learning_items (id, unit_id, sequence, kind, title, body) VALUES
('itm_l1_m8_overview', 'unt_l1_m8', 1, 'reading', 'Module Overview & Key Phrases',
'Key phrases introduced this module: I can/can''t... -- Can you...? Yes, I can. / No, I can''t. -- I''m going to... -- What are you going to do this weekend? -- He''s/She''s going to...

Key vocabulary previewed: ability verbs (swim, cook, drive, play an instrument, speak a language, ride a bike), weekend/holiday-plan vocabulary (visit, travel, meet, relax, go shopping).

COLLOCATIONS THIS MODULE (new at this level -- words that habitually go together; getting these right does more for natural English at this level than any extra grammar): play football -- ''play'' for games and sports; ride a bike -- not ''drive a bike''; learn to swim -- ''learn to'' + verb.'),

('itm_l1_m8_lesson1', 'unt_l1_m8', 2, 'reading', 'Lesson 8.1 -- Can You...? -- Talking About Ability',
'LEARNING OBJECTIVES: (1) use can/can''t correctly to talk about ability, (2) ask "Can you...?" and give short answers, (3) use 8+ ability-related verbs, (4) form the negative can''t correctly.

PREREQUISITE KNOWLEDGE: Module 1 ("to be", question formation).

WARM-UP (5 min): Your instructor asks a show-of-hands question ("Who can swim?").

PRESENTATION (10 min): "I can cook. I can''t drive. Can you swim? Yes, I can. / No, I can''t." can/can''t + base verb, same form for all subjects (no -s) -- contrasted with the present-simple -s rule from Module 3.

GUIDED PRACTICE (10 min): Pair work -- ask "Can you...?" using 5 verbs from a prompt list, answer truthfully with short answers, then swap.

INDEPENDENT PRACTICE / SPEAKING ACTIVITY (10 min): Mingle and ask 4 different classmates "Can you...?" questions, recording who can/can''t do each of 4 abilities on a grid.

LISTENING ACTIVITY (5 min): Listen to 4 short self-descriptions of ability and match each speaker to their abilities.

READING ACTIVITY (5 min): Read 3 short "About Me" profile texts and answer 3 comprehension questions about ability.

WRITING TASK (5 min): Write 4 sentences about your own real abilities, at least one negative (can''t).

PRONUNCIATION PRACTICE (5 min): The reduced, unstressed "can" versus the fully stressed, clearly different "can''t" -- the key A1 listening discrimination point.

VOCABULARY REINFORCEMENT: ability-verb charades.

FORMATIVE ASSESSMENT: Instructor listens during the mingling survey for clear can/can''t pronunciation and correct base-verb form.

CRITICAL THINKING / DISCUSSION PROMPT (level-appropriate: a real judgement, expressed with the language available at this level -- pointing, choosing, or a single corrected sentence): "I can swim" and "I am going to swim". One is about ability and one is about a plan. Which is which? Say one sentence about yourself with each.

HOMEWORK: Ask one family member 3 "Can you...?" questions and note the answers.

REVISION: Lesson 8.2 opens with 2-3 learners sharing their homework family-ability findings.

EXTENSION: Add "well"/"a little" to qualify an ability ("I can cook well" / "I can swim a little").'),

('itm_l1_m8_lesson2', 'unt_l1_m8', 3, 'reading', 'Lesson 8.2 -- I''m Going To... -- Talking About Plans',
'LEARNING OBJECTIVES: (1) use "going to" correctly for near-future plans and intentions, (2) ask "What are you going to do...?" and answer appropriately, (3) distinguish "going to" (plan/intention) from "can" (ability), (4) talk about weekend/holiday plans using target vocabulary.

PREREQUISITE KNOWLEDGE: Lesson 8.1 (can/can''t), Module 3 (time expressions).

WARM-UP (5 min): Your instructor states one real plan ("I''m going to have lunch") and one real ability ("I can speak two languages") for you to identify which is about the future.

PRESENTATION (10 min): "What are you going to do this weekend? I''m going to visit my parents. She''s going to go shopping." Form: am/is/are + going to + base verb. Explicit contrast: can = ability; going to = a plan.

GUIDED PRACTICE (10 min): Pair work -- ask "What are you going to do this weekend?", answer using at least 2 plans from the target vocabulary, then swap.

INDEPENDENT PRACTICE / SPEAKING ACTIVITY (10 min): Write your real plans for the coming weekend (4-5 sentences using going to), then interview 2 classmates about their plans.

LISTENING ACTIVITY (5 min): Listen to 3 people describing their weekend plans and match each speaker to their correct plan.

READING ACTIVITY (5 min): Read a short "This Weekend" announcement text and answer 3 comprehension questions about planned activities.

WRITING TASK (5 min): Write a short message to a friend (4-5 sentences) telling them your weekend plans, using going to.

PRONUNCIATION PRACTICE (5 min): The natural connected-speech contraction "gonna" for listening recognition only (not required for production), versus the full, correct "going to" used in production.

VOCABULARY REINFORCEMENT: weekend-plan picture cards matched to "going to" sentence starters.

FORMATIVE ASSESSMENT: Instructor checks correct going-to form and correct distinction from can.

CRITICAL THINKING / DISCUSSION PROMPT (level-appropriate: a real judgement, expressed with the language available at this level -- pointing, choosing, or a single corrected sentence): Your friend says "I can play piano very good." One word is wrong. Which word? Say the correct sentence.

HOMEWORK: Finalise and rehearse your weekend-plans description for Module 8''s assignment.

REVISION: This lesson opens with the Lesson 8.1 family-ability sharing recap. Module 8''s Quiz and Assignment draw on both lessons.

EXTENSION: Add one ability-related justification to a plan ("I''m going to go swimming because I can swim well").'),

('itm_l1_m8_quiz', 'unt_l1_m8', 4, 'quiz', 'Module 8 Quiz -- Plans & Abilities', NULL),

('itm_l1_m8_assignment', 'unt_l1_m8', 5, 'assignment', 'Module 8 Assignment -- My Weekend Plans',
'INSTRUCTIONS: Record yourself (or write) 5-6 sentences about your real plans for the coming weekend, using "going to". Include at least one ability-related sentence using can/can''t that connects logically to one of your plans.

GRADING RUBRIC: (1) Grammatical accuracy -- correct going-to form, correct can/can''t form. (2) Vocabulary range -- at least 3 distinct planned activities named. (3) Task completion -- at least one can/can''t sentence logically connected to a plan. (4) Clarity & intelligibility -- plans are specific and clearly future-oriented.

A grade at or above the platform''s pass threshold marks this module complete.');

INSERT INTO quiz_questions (id, learning_item_id, sequence, prompt, choices_json, correct_index) VALUES
('qq_l1_m8_1', 'itm_l1_m8_quiz', 1, '"I ___ speak French, but I can''t speak German."', '["can","cans","canning","could"]', 0),
('qq_l1_m8_2', 'itm_l1_m8_quiz', 2, '"___ you swim?"', '["Do","Are","Can","Does"]', 2),
('qq_l1_m8_3', 'itm_l1_m8_quiz', 3, '"No, I ___."', '["don''t","can''t","not","isn''t"]', 1),
('qq_l1_m8_4', 'itm_l1_m8_quiz', 4, '"She ___ going to visit her grandmother tomorrow."', '["am","are","do","is"]', 3),
('qq_l1_m8_5', 'itm_l1_m8_quiz', 5, '"What are you ___ to do this weekend?"', '["go","goes","going","went"]', 2),
('qq_l1_m8_6', 'itm_l1_m8_quiz', 6, 'Which sentence is about ability, not a plan?', '["I can cook well.","I''m going to cook dinner.","She''s going to visit Rome.","They''re going to play football."]', 0),
('qq_l1_m8_7', 'itm_l1_m8_quiz', 7, '"We ___ going to travel next month."', '["am","is","be","are"]', 3),
('qq_l1_m8_8', 'itm_l1_m8_quiz', 8, '"He can play the guitar ___."', '["good","well","fine","nice"]', 1),
('qq_l1_m8_9', 'itm_l1_m8_quiz', 9, '"She can''t ___ very well."', '["swims","swim","swimming","to swim"]', 1),
('qq_l1_m8_10', 'itm_l1_m8_quiz', 10, '"I''m going ___ study tonight."', '["for","at","to","of"]', 2);

-- ---------------------------------------------------------------------
-- Module 9: Health & Feelings
-- Full prose version: docs/curriculum/level-1/module-09-health-feelings.md
-- ---------------------------------------------------------------------
INSERT INTO units (id, course_id, sequence, title) VALUES
  ('unt_l1_m9', 'crs_level_1', 9, 'Module 9: Health & Feelings');

INSERT INTO learning_items (id, unit_id, sequence, kind, title, body) VALUES
('itm_l1_m9_overview', 'unt_l1_m9', 1, 'reading', 'Module Overview & Key Phrases',
'Key phrases introduced this module: How are you feeling? -- I have a headache/a cold/a stomachache. -- I feel sick/tired/better. -- You should.../You shouldn''t... -- Get well soon!

Key vocabulary previewed: body parts (head, stomach, back, throat, arm, leg, ear, tooth), health problems (headache, cold, fever, cough, stomachache), feelings (happy, sad, tired, sick, better, worried).

COLLOCATIONS THIS MODULE (new at this level -- words that habitually go together; getting these right does more for natural English at this level than any extra grammar): catch a cold -- not ''take a cold''; take medicine -- not ''drink medicine''; feel better -- not ''feel more good''.'),

('itm_l1_m9_lesson1', 'unt_l1_m9', 2, 'reading', 'Lesson 9.1 -- How Are You Feeling? -- Body & Health',
'LEARNING OBJECTIVES: (1) name 8+ body parts, (2) describe common health problems using have/has, (3) describe feelings using "feel + adjective", (4) ask "What''s the matter?/How are you feeling?" appropriately.

PREREQUISITE KNOWLEDGE: Module 3 and Module 6 (have/has previewed for family and appearance -- this lesson uses it fully and explicitly for the first time).

WARM-UP (5 min): Your instructor mimes 3-4 common ailments (holding head, coughing) for you to guess.

PRESENTATION (10 min): "What''s the matter? I have a headache. I feel terrible." have/has consolidated fully: "I have a headache. She has a cold." "feel + adjective" introduced as a separate pattern ("I feel sick" -- no have here). 8-10 body-part and health-problem words presented with picture support.

GUIDED PRACTICE (10 min): Pair work -- mime an ailment, partner guesses and states it using have/has, then swap, 5 rounds.

INDEPENDENT PRACTICE / SPEAKING ACTIVITY (10 min): Given 4 short "sick day" scenario cards, roleplay a short phone call explaining why you can''t come to school/work today, using have/has and feel.

LISTENING ACTIVITY (5 min): Listen to 4 short exchanges about how someone is feeling and match each speaker to their correct ailment.

READING ACTIVITY (5 min): Read 3 short simple "Dear Doctor" letters describing symptoms and match each to the correct advice card.

WRITING TASK (5 min): Write 3-4 sentences describing how you feel today using have/has and feel.

PRONUNCIATION PRACTICE (5 min): Body-part word stress (STOMach, HEADache) and a relevant vowel contrast for this vocabulary set.

VOCABULARY REINFORCEMENT: body-part labelling diagram race in pairs.

FORMATIVE ASSESSMENT: Instructor checks correct have/has vs. feel + adjective choice during the roleplay.

CRITICAL THINKING / DISCUSSION PROMPT (level-appropriate: a real judgement, expressed with the language available at this level -- pointing, choosing, or a single corrected sentence): A person says "I have a headache" and another says "I have a broken leg". Who needs a doctor today? Say one reason.

HOMEWORK: Write 2 sentences about a time you felt sick (using simple past "had", connecting back to Module 7) and 2 sentences about how you feel today.

REVISION: Lesson 9.2 opens with 2-3 learners sharing their homework sentences.

EXTENSION: Add a cause to your health-problem sentence ("I have a headache because I didn''t sleep well" -- a light preview of "because", formally taught in Level III).'),

('itm_l1_m9_lesson2', 'unt_l1_m9', 3, 'reading', 'Lesson 9.2 -- You Should... -- Giving Simple Advice',
'LEARNING OBJECTIVES: (1) give simple advice using should/shouldn''t + base verb, (2) respond appropriately to advice, (3) connect a health problem to appropriate advice logically, (4) use polite well-wishing expressions ("Get well soon!").

PREREQUISITE KNOWLEDGE: Lesson 9.1 (health vocabulary, have/has/feel).

WARM-UP (5 min): Your instructor states a problem ("I''m very tired today") and elicits informal advice from you in your own words.

PRESENTATION (10 min): "I have a headache. -- You should rest. You shouldn''t look at your phone." should/shouldn''t + base verb, same form for all subjects -- echoing Module 8''s can/can''t pattern.

GUIDED PRACTICE (10 min): Pair work -- state a health problem from a prompt card, give one piece of matching advice using should, then swap, 5 rounds.

INDEPENDENT PRACTICE / SPEAKING ACTIVITY (10 min): In small groups, match 6 health-problem cards to 6 advice cards (more than one logical match is acceptable), then justify one match aloud to the class.

LISTENING ACTIVITY (5 min): Listen to 3 short problem-and-advice exchanges and judge whether the advice given matches the problem logically.

READING ACTIVITY (5 min): Read the 3 "Dear Doctor" letters again, matching each to a written advice response using should/shouldn''t.

WRITING TASK (5 min): Write a short advice reply (3-4 sentences) to one "Dear Doctor" letter, using at least 2 should/shouldn''t sentences.

PRONUNCIATION PRACTICE (5 min): The correct pronunciation of "should" (commonly mispronounced) and the silent "l" awareness point.

VOCABULARY REINFORCEMENT: problem-advice matching game, timed, in small groups.

FORMATIVE ASSESSMENT: Instructor checks that advice given logically matches the stated problem and uses correct should/shouldn''t form.

CRITICAL THINKING / DISCUSSION PROMPT (level-appropriate: a real judgement, expressed with the language available at this level -- pointing, choosing, or a single corrected sentence): Which is kinder to say to a sick friend: "Get well soon" or "Good luck"? Choose, and say when you use the other one.

HOMEWORK: Prepare a short "sick day" roleplay script (problem + advice + well-wishing) for Module 9''s assignment.

REVISION: This lesson opens with the Lesson 9.1 homework-sentence recap. Module 9''s Quiz and Assignment draw on both lessons.

EXTENSION: Add a second piece of advice using shouldn''t to your roleplay script.'),

('itm_l1_m9_quiz', 'unt_l1_m9', 4, 'quiz', 'Module 9 Quiz -- Health & Feelings', NULL),

('itm_l1_m9_assignment', 'unt_l1_m9', 5, 'assignment', 'Module 9 Assignment -- At the Doctor''s Roleplay',
'INSTRUCTIONS: Record yourself (or perform with a partner) a short roleplay, 45-60 seconds, as a patient describing a health problem to a doctor (or friend) and receiving advice. Include: a greeting, at least one have/has or feel sentence describing the problem, at least two pieces of advice using should/shouldn''t, and a polite closing.

GRADING RUBRIC: (1) Grammatical accuracy -- correct have/has/feel choice, correct should/shouldn''t form. (2) Vocabulary range -- at least 2 health/body words and 2 advice verbs used correctly. (3) Task completion -- all required elements present. (4) Clarity & intelligibility -- the advice given genuinely matches the stated problem.

A grade at or above the platform''s pass threshold marks this module complete.');

INSERT INTO quiz_questions (id, learning_item_id, sequence, prompt, choices_json, correct_index) VALUES
('qq_l1_m9_1', 'itm_l1_m9_quiz', 1, '"I ___ a terrible headache."', '["am","has","have","feel"]', 2),
('qq_l1_m9_2', 'itm_l1_m9_quiz', 2, '"I ___ very tired today."', '["feel","have","has","feels"]', 0),
('qq_l1_m9_3', 'itm_l1_m9_quiz', 3, '"She ___ a cold."', '["have","is","feel","has"]', 3),
('qq_l1_m9_4', 'itm_l1_m9_quiz', 4, '"You ___ rest if you feel sick."', '["shoulds","should","shouldn''t","must not"]', 1),
('qq_l1_m9_5', 'itm_l1_m9_quiz', 5, '"You ___ stay up too late -- you need sleep."', '["shouldn''t","should","can","have"]', 0),
('qq_l1_m9_6', 'itm_l1_m9_quiz', 6, 'Which body part do you use to listen?', '["throat","arm","ear","tooth"]', 2),
('qq_l1_m9_7', 'itm_l1_m9_quiz', 7, '"What''s the ___?" (asking what''s wrong)', '["feeling","matter","health","problem"]', 1),
('qq_l1_m9_8', 'itm_l1_m9_quiz', 8, 'A polite thing to say to someone who is sick:', '["Well done!","Good luck!","See you later!","Get well soon!"]', 3),
('qq_l1_m9_9', 'itm_l1_m9_quiz', 9, '"My ___ hurts. I can''t walk."', '["ear","nose","hand","leg"]', 3),
('qq_l1_m9_10', 'itm_l1_m9_quiz', 10, '"You look sad. ___ wrong?"', '["How''s","What''s","Where''s","Who''s"]', 1);

-- ---------------------------------------------------------------------
-- Module 10: Review & Consolidation (Foundation-level end-of-level exam)
-- Full prose version: docs/curriculum/level-1/module-10-review-consolidation.md
-- ---------------------------------------------------------------------
INSERT INTO units (id, course_id, sequence, title) VALUES
  ('unt_l1_m10', 'crs_level_1', 10, 'Module 10: Review & Consolidation');

INSERT INTO learning_items (id, unit_id, sequence, kind, title, body) VALUES
('itm_l1_m10_revguide', 'unt_l1_m10', 1, 'reading', 'Level I Revision Guide',
'Module 1 -- Meeting People: "to be" (am/is/are), subject pronouns, basic question formation; greetings, personal information, nationalities.
Module 2 -- Everyday Objects & Places: "there is/are", demonstratives (this/that/these/those); classroom, home, and city vocabulary.
Module 3 -- Family & Routines: present simple (incl. third-person -s), telling the time; family members, daily-routine verbs, time expressions.
Module 4 -- Food & Shopping: countable/uncountable nouns, some/any; food, shops, numbers, money/prices.
Module 5 -- Around Town: prepositions of place, imperatives; town places, direction language.
Module 6 -- Describing People & Things: possessive adjectives/pronouns, ''s, adjective order; appearance, colours, general adjectives.
Module 7 -- Past Experiences I: simple past (regular -ed and common irregular forms), past questions/negatives; past-time expressions.
Module 8 -- Plans & Abilities: can/can''t (ability), going to (near-future plans); ability verbs, weekend/holiday-plan vocabulary.
Module 9 -- Health & Feelings: have/has and feel + adjective (fully consolidated), should/shouldn''t; body parts, health problems, feelings.

Structural thread across the level: introducing yourself and your world (Modules 1-4), navigating and describing it (Modules 5-6), then talking about time beyond the present moment (Modules 7-9: past, future, and advice).

COLLOCATIONS ACROSS THIS LEVEL: every module in this level introduced words that habitually go together. Revise them all, and add these summary items: make a mistake -- the single most useful collocation at A1 -- never ''do a mistake''; do homework -- ''do'' for work and tasks; have a break -- not ''make a break''.'),

('itm_l1_m10_revlesson', 'unt_l1_m10', 2, 'reading', 'Revision Lesson -- Structured Consolidation Activities',
'LEARNING OBJECTIVES: (1) correctly select the right grammar structure from Modules 1-9 given a real-use context, (2) recall and use at least 60 headwords from across the level''s vocabulary sets, (3) self-identify at least one personal area needing further revision before the mock exam.

PREREQUISITE KNOWLEDGE: All of Modules 1-9.

WARM-UP (5 min): "Grammar auction" -- bid points on whether 6 example sentences (each from a different module) are grammatically correct or incorrect.

PRESENTATION/CONSOLIDATION (15 min): Structure-selection drill -- real-life prompts each requiring a different module''s grammar ("Describe your best friend" -> Module 6; "What did you do last weekend?" -> Module 7; "What are your plans for tonight?" -> Module 8).

GUIDED PRACTICE (15 min): Rotate through 4 stations reviewing 2-3 modules'' target language each through a quick game: Family/Routines + Food/Shopping; Around Town + Describing People/Things; Past Experiences + Plans/Abilities; Health/Feelings + cumulative review.

INDEPENDENT PRACTICE (10 min): Complete a self-assessment checklist (one line per module: "I can... yes/needs practice") and circle your two weakest areas.

SPEAKING ACTIVITY: The structure-selection drill and station rotation above.

LISTENING ACTIVITY (5 min): Listen to a single extended monologue (self-introduction, family, routine, weekend plans, a past holiday) -- a cumulative listening task mirroring the mock exam.

READING ACTIVITY (5 min): Read a similarly cumulative short text and answer mixed comprehension questions spanning several grammar points.

WRITING TASK (5 min): Write one paragraph (5+ sentences) using at least 4 different grammar points from across the level.

PRONUNCIATION PRACTICE (5 min): Rapid-fire review of the level''s key pronunciation points: -s/-ed endings, can/can''t, this/these, weak "there".

VOCABULARY REINFORCEMENT: a cumulative vocabulary relay game covering all 9 modules'' word sets.

FORMATIVE ASSESSMENT: The self-assessment checklist, reviewed individually with the instructor if time allows.

CRITICAL THINKING / DISCUSSION PROMPT (level-appropriate: a real judgement, expressed with the language available at this level -- pointing, choosing, or a single corrected sentence): Look back at the nine modules. Choose the ONE thing you found hardest. Say it in one sentence beginning "For me, the hardest thing was...". Then say one thing you can do now that you could not do in Module 1.

HOMEWORK: Revise your self-identified weak areas using the module you struggled with most.

REVISION: This entire lesson is revision by design.

EXTENSION: Stronger learners help peers at weaker stations during the rotation activity.'),

('itm_l1_m10_examquiz', 'unt_l1_m10', 3, 'quiz', 'Foundation-Level Mock Exam -- Grammar & Vocabulary', NULL),

('itm_l1_m10_examassignment', 'unt_l1_m10', 4, 'assignment', 'Foundation-Level Mock Exam -- Speaking & Writing',
'This is your Level I final assessment. Complete both parts.

PART A -- SPEAKING (2-3 minutes, recorded or live with your instructor): Give an extended self-introduction covering: your name, where you''re from, and where you live (Module 1); your family (Module 3); your daily routine with at least one time expression (Module 3); one thing you did last weekend, using at least one regular and one irregular past verb (Module 7); one plan for the near future using "going to" (Module 8); and one thing you can/can''t do (Module 8). Respond to at least one follow-up question from your instructor.

PART B -- WRITING (10-12 sentences): Write a personal letter to a new pen pal covering: an introduction (Module 1); a description of your home or room using "there is/are" and "this/that" (Module 2); a description of one family member''s appearance (Module 6); how you''re feeling today and one piece of health advice you''d give a friend (Module 9); and directions from your home to one place you often visit (Module 5).

GRADING RUBRIC (weighted toward listening and speaking, per the Foundation-level assessment strategy): (1) Grammatical range and accuracy -- correct, varied use of the level''s grammar points across both parts. (2) Vocabulary range -- words drawn from at least 6 of the 9 modules combined. (3) Task completion -- every required element present in both parts. (4) Clarity & intelligibility -- is the learner understood by a listener who does not already know what they are trying to say, across both parts? (5) Fluency and delivery (Part A) -- reasonably fluent for A1, audible, able to respond to an unscripted follow-up question. (6) Coherence (Part B) -- reads as one connected personal message.

PROGRESSION REQUIREMENT: A grade at or above the platform''s pass threshold on this comprehensive assessment marks Level I complete for the learner.');

INSERT INTO quiz_questions (id, learning_item_id, sequence, prompt, choices_json, correct_index) VALUES
('qq_l1_m10_1', 'itm_l1_m10_examquiz', 1, '(Module 1) "___ name is Carlos."', '["My","I","Me","Mine"]', 0),
('qq_l1_m10_2', 'itm_l1_m10_examquiz', 2, '(Module 1) "I ___ from Mexico."', '["is","are","am","be"]', 2),
('qq_l1_m10_3', 'itm_l1_m10_examquiz', 3, '(Module 2) "There ___ two windows in this room."', '["is","are","am","be"]', 1),
('qq_l1_m10_4', 'itm_l1_m10_examquiz', 4, '(Module 2) "___ is my bag." (in your hand)', '["That","Those","These","This"]', 3),
('qq_l1_m10_5', 'itm_l1_m10_examquiz', 5, '(Module 3) "He ___ breakfast at 7 o''clock."', '["have","is","has","are"]', 2),
('qq_l1_m10_6', 'itm_l1_m10_examquiz', 6, '(Module 3) It is 3:30. How do you say this time?', '["Half past three","Quarter past three","Three o''clock","Quarter to three"]', 0),
('qq_l1_m10_7', 'itm_l1_m10_examquiz', 7, '(Module 4) "Is there ___ milk?"', '["some","a","much","any"]', 3),
('qq_l1_m10_8', 'itm_l1_m10_examquiz', 8, '(Module 4) "How much ___ the apples?"', '["is","are","am","be"]', 1),
('qq_l1_m10_9', 'itm_l1_m10_examquiz', 9, '(Module 5) "The bank is ___ the supermarket." (right beside it)', '["opposite","next to","between","behind"]', 1),
('qq_l1_m10_10', 'itm_l1_m10_examquiz', 10, '(Module 5) "___ straight on, then turn left."', '["Going","Goes","Went","Go"]', 3),
('qq_l1_m10_11', 'itm_l1_m10_examquiz', 11, '(Module 6) "She ___ long brown hair."', '["has","is","have","are"]', 0),
('qq_l1_m10_12', 'itm_l1_m10_examquiz', 12, '(Module 6) "This isn''t my pen. It''s ___."', '["her","she","hers","she''s"]', 2),
('qq_l1_m10_13', 'itm_l1_m10_examquiz', 13, '(Module 7) "I ___ TV yesterday evening."', '["watch","watching","watches","watched"]', 3),
('qq_l1_m10_14', 'itm_l1_m10_examquiz', 14, '(Module 7) "___ you go to the party? -- Yes, I did."', '["Do","Did","Does","Were"]', 1),
('qq_l1_m10_15', 'itm_l1_m10_examquiz', 15, '(Module 8) "I ___ speak French, but I can''t speak German."', '["cans","canning","can","could"]', 2),
('qq_l1_m10_16', 'itm_l1_m10_examquiz', 16, '(Module 8) "What are you ___ to do this weekend?"', '["going","go","goes","went"]', 0),
('qq_l1_m10_17', 'itm_l1_m10_examquiz', 17, '(Module 9) "I ___ a terrible headache."', '["have","am","has","feel"]', 0),
('qq_l1_m10_18', 'itm_l1_m10_examquiz', 18, '(Module 9) "You ___ rest if you feel sick."', '["shoulds","shouldn''t","should","must not"]', 2),
('qq_l1_m10_19', 'itm_l1_m10_examquiz', 19, '(Cumulative vocabulary) Which word is a family member, not a place?', '["hospital","grandmother","station","pharmacy"]', 1),
('qq_l1_m10_20', 'itm_l1_m10_examquiz', 20, '(Cumulative vocabulary) Which word describes ability, not future plans?', '["going to","will","tomorrow","can"]', 3);
