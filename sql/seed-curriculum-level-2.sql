-- WEC-LC — Real curriculum content seed: Level II ("Elementary
-- Programme," A2). Authored per the Executive Directive "Curriculum
-- First," continued per your instruction that curriculum should
-- "evolve in depth and sophistication rather than simply repeating
-- the Level I template" — see docs/curriculum-framework.md (the
-- six-level architecture) and docs/curriculum-level-2-elementary.md
-- (this level's module map, § What's different from Level I, and
-- Module 1's full prose version) plus
-- docs/curriculum/level-2/module-{02,03}-*.md for Modules 2-3.
--
-- Deliberately a SEPARATE file from sql/schema.sql and from
-- sql/seed-curriculum-level-1.sql — see either file's own header for
-- why curriculum content is never baked into schema.sql. Apply after
-- schema.sql (and, if used, seed-curriculum-level-1.sql — the two
-- level seed files are independent of each other):
--   wrangler d1 execute wec-lc --file=sql/schema.sql
--   wrangler d1 execute wec-lc --file=sql/seed-curriculum-level-2.sql
--
-- Scope, stated honestly: Modules 1-3 of Level II's ten modules are
-- built this pass, to a deliberately higher standard than Level I's
-- (see the elevated-standard note in
-- docs/curriculum-level-2-elementary.md). Modules 4-10 are mapped
-- (can-do focus, grammar, vocabulary — see that document's module
-- table) but not yet authored to full lesson-by-lesson depth or
-- seeded here. No placeholder content is seeded for them.

-- ---------------------------------------------------------------------
-- Module 1: Life Stories
-- Full prose version: docs/curriculum-level-2-elementary.md
-- ---------------------------------------------------------------------
INSERT INTO units (id, course_id, sequence, title) VALUES
  ('unt_l2_m1', 'crs_level_2', 1, 'Module 1: Life Stories');

INSERT INTO learning_items (id, unit_id, sequence, kind, title, body) VALUES
('itm_l2_m1_overview', 'unt_l2_m1', 1, 'reading', 'Module Overview & Key Phrases',
'Key phrases introduced this module: I was ...-ing when... -- While I was..., I... -- I used to.../I didn''t use to... -- What was your life like when you were a child? -- That''s really interesting -- tell me more.

BrE / AmE note (introductory, general): from this level onward, spelling differences appear across vocabulary (British favourite, colour, travelled; American favorite, color, traveled). WEC-LC materials use British spelling as the house style, but both are entirely correct, standard English, and learners should be able to recognise either. This module models British spelling/pronunciation; later modules flag specific vocabulary differences as they arise.

Key vocabulary previewed: life-event nouns (childhood, career, marriage, graduation), sequencing/narrative connectors (when, while, during, at that time), used-to-relevant lifestyle-change vocabulary (move, change, grow up).'),

('itm_l2_m1_lesson1', 'unt_l2_m1', 2, 'reading', 'Lesson 1.1 -- What Were You Doing? -- Past Simple vs. Past Continuous',
'LEARNING OBJECTIVES: (1) form past continuous correctly (was/were + -ing), (2) choose correctly between simple past (a completed event) and past continuous (background action in progress), (3) combine both correctly in one sentence with "when" or "while", (4) ask "What were you doing when...?" and answer appropriately.

PREREQUISITE KNOWLEDGE: Level I, Module 7 (simple past, regular and irregular).

WARM-UP (5 min): Your instructor tells a short real anecdote using both tenses ("I was making coffee this morning when my phone rang") for you to identify the "background" action and the "interrupting" one.

PRESENTATION (10 min): "I was walking home when I saw an old friend. While I was waiting for the bus, it started to rain." Past continuous = the "background", ongoing at a moment; simple past = the single completed event that often interrupts it. "when" typically introduces the interrupting event; "while" typically introduces the background action -- useful tendencies, not absolute rules.

GUIDED PRACTICE (10 min): Given 6 sentence-halves (3 background, 3 event), match them into 3 logical combined sentences using when/while.

INDEPENDENT PRACTICE / SPEAKING ACTIVITY (10 min): Write 4 original sentences about real memories using the target pattern, then interview a partner: "What were you doing when [a shared reference point] happened?" Share 2-3 answers with the whole class.

CRITICAL THINKING / DISCUSSION PROMPT: "Do you think it''s easier to remember what you were doing at an important moment, or exactly when it happened? Why?" -- discuss briefly in pairs, then share one idea each with the class.

LISTENING ACTIVITY (5 min): Listen to a short narrated anecdote (5 sentences, mixing both tenses) and identify which actions were "background" and which were "events".

READING ACTIVITY (5 min): Read a short "Where were you when...?" biographical paragraph and answer 3 comprehension questions distinguishing background from event.

WRITING TASK (5 min): Write a short paragraph (4-5 sentences) about a real memory, using at least 2 past continuous and 2 simple past verbs correctly combined.

PRONUNCIATION PRACTICE (5 min): The weak-form "was/were" in connected speech (stress on the main verb) versus the stressed form in short answers.

VOCABULARY REINFORCEMENT: a "life moments" picture set (a wedding, a graduation, a house move) used to elicit both target tenses.

FORMATIVE ASSESSMENT: Instructor checks correct tense selection (not just correct formation) during independent practice.

HOMEWORK: Prepare one real "What was I doing when...?" story (3-4 sentences) to share at the start of Lesson 1.2.

REVISION: Lesson 1.2 opens with 2-3 learners sharing their homework story.

EXTENSION: Add a third clause using "during" ("During the storm, while I was walking home, I saw an old friend").'),

('itm_l2_m1_lesson2', 'unt_l2_m1', 3, 'reading', 'Lesson 1.2 -- I Used To... -- Life Before and Now',
'LEARNING OBJECTIVES: (1) use "used to + base verb" correctly for past habits/states no longer true, (2) form the negative (didn''t use to) and question (Did you use to...?) correctly, (3) contrast "used to" (repeated past habit/state) with simple past (a single completed action), (4) describe your own life "then and now" with reasonable fluency.

PREREQUISITE KNOWLEDGE: Lesson 1.1 (past narration), Level I Module 3 (present simple, as the "now" contrast).

WARM-UP (5 min): Your instructor states one real true "used to" sentence about themselves as a child and one still true now, for you to guess which is which.

PRESENTATION (10 min): "I used to live in a small town. Now I live in a big city. I didn''t use to like coffee, but now I love it." "used to" is for a repeated habit or a state once true, never for a single completed action -- explicitly contrast "I used to visit her every summer" (habit, correct) vs. "I used to visit her last year" (single event -- needs simple past instead), a common A2 error.

GUIDED PRACTICE (10 min): Given 6 "then" prompts (a childhood habit/state), build "used to" sentences, then add a contrasting "now" sentence using present simple for each.

INDEPENDENT PRACTICE / SPEAKING ACTIVITY (10 min): Complete a "Then and Now" worksheet about your own real life (home, hobby, opinion/taste, daily habit), then interview a partner and note one interesting fact to share with the class.

CRITICAL THINKING / DISCUSSION PROMPT: "Is it usually good or bad when people change a lot over time? Can you think of an example of a change that was positive, and one that was difficult?" -- discussed in small groups.

LISTENING ACTIVITY (5 min): Listen to someone describing their life "then and now" (6 sentences) and complete a two-column (then/now) worksheet.

READING ACTIVITY (5 min): Read a short "How I''ve Changed" blog-style text and answer 3 comprehension questions distinguishing past habit from present fact.

WRITING TASK (5 min): Write a short "Then and Now" paragraph (5-6 sentences) about your own real life, using "used to" correctly at least 3 times and present simple for the "now" contrast.

PRONUNCIATION PRACTICE (5 min): The connected-speech reduction of "used to" (distinct from the full-form "use"), a useful A2 point since the two look similar but are pronounced and used very differently.

VOCABULARY REINFORCEMENT: "Then vs. Now" vocabulary sort (bigger, quieter, busier, different) feeding forward into Module 2''s comparatives.

FORMATIVE ASSESSMENT: Instructor checks the used-to/simple-past distinction specifically during independent practice.

HOMEWORK: Finalise your "Then and Now" write-up for Module 1''s assignment, adding at least one more true detail.

REVISION: This lesson opens with the Lesson 1.1 homework-story recap. Module 1''s Quiz and Assignment draw on both lessons.

EXTENSION: Add one sentence using "would" as an alternative to "used to" for a repeated past action only, not a state (would visit is fine; would live is wrong -- used to live is required) -- previewed here, returned to at Level III.'),

('itm_l2_m1_quiz', 'unt_l2_m1', 4, 'quiz', 'Module 1 Quiz -- Life Stories', NULL),

('itm_l2_m1_assignment', 'unt_l2_m1', 5, 'assignment', 'Module 1 Assignment -- My Life Story -- Then and Now',
'INSTRUCTIONS: Write (or record) 8-10 sentences telling the story of one meaningful change in your life. Include: at least one sentence combining past continuous and simple past with when/while; at least two sentences using "used to" to describe how things were before; a clear present-simple contrast showing how things are now; and one sentence explaining, in your own words, why this change mattered to you.

GRADING RUBRIC: (1) Grammatical accuracy -- correct past continuous/simple past combination, correct used-to formation and appropriate use. (2) Vocabulary range -- at least 4 distinct life-event or change-related words. (3) Task completion -- all required grammar elements and the personal reflection sentence present. (4) Communicative quality (new emphasis at this level) -- does the story communicate a clear, followable narrative with a genuine personal reflection, not just correctly formed but disconnected sentences? This should weigh at least as heavily as grammatical accuracy.

A grade at or above the platform''s pass threshold marks this module complete.');

INSERT INTO quiz_questions (id, learning_item_id, sequence, prompt, choices_json, correct_index) VALUES
('qq_l2_m1_1', 'itm_l2_m1_quiz', 1, '"I ___ TV when the phone rang."', '["watched","was watching","watch","am watching"]', 1),
('qq_l2_m1_2', 'itm_l2_m1_quiz', 2, '"While I ___ dinner, my sister called."', '["cooked","was cooking","cook","cooks"]', 1),
('qq_l2_m1_3', 'itm_l2_m1_quiz', 3, '"___ you use to live in London?"', '["Did","Do","Were","Was"]', 0),
('qq_l2_m1_4', 'itm_l2_m1_quiz', 4, '"I didn''t use to ___ coffee, but now I love it."', '["liked","liking","like","likes"]', 2),
('qq_l2_m1_5', 'itm_l2_m1_quiz', 5, 'Which sentence is correct?', '["I used to visit her last year.","I visited her last year.","I use to visited her last year.","I was visiting her last year only."]', 1),
('qq_l2_m1_6', 'itm_l2_m1_quiz', 6, '"When I ___ the door, I saw my friend outside."', '["was opening","opened","open","opens"]', 1),
('qq_l2_m1_7', 'itm_l2_m1_quiz', 7, '"___ were you doing at 8pm yesterday?"', '["What","When","Where","Who"]', 0),
('qq_l2_m1_8', 'itm_l2_m1_quiz', 8, 'Which describes a repeated past habit, not a single event?', '["I went to Paris in 2019.","I used to go to the cinema every Friday.","I was watching TV at 9pm.","I saw a great film last night."]', 1),
('qq_l2_m1_9', 'itm_l2_m1_quiz', 9, '"She ___ shy when she was a child, but now she''s very confident."', '["use to be","used to being","used to be","was use to be"]', 2),
('qq_l2_m1_10', 'itm_l2_m1_quiz', 10, 'Which word often introduces the "background" action in a past narrative?', '["when","while","then","after"]', 1);

-- ---------------------------------------------------------------------
-- Module 2: Travel & Transport
-- Full prose version: docs/curriculum/level-2/module-02-travel-transport.md
-- ---------------------------------------------------------------------
INSERT INTO units (id, course_id, sequence, title) VALUES
  ('unt_l2_m2', 'crs_level_2', 2, 'Module 2: Travel & Transport');

INSERT INTO learning_items (id, unit_id, sequence, kind, title, body) VALUES
('itm_l2_m2_overview', 'unt_l2_m2', 1, 'reading', 'Module Overview & Key Phrases',
'Key phrases introduced this module: ___ is faster/cheaper/more comfortable than ___. -- Which is the best way to get to...? -- I''d prefer to... because... -- How long does it take? -- I''d like to book a...

BrE / AmE note: holiday (BrE) / vacation (AmE); coach (BrE, a long-distance bus) / motorcoach or bus (AmE); return ticket (BrE) / round-trip ticket (AmE); petrol (BrE) / gas (AmE). WEC-LC materials use British terms as the house style; learners should recognise both.

Key vocabulary previewed: transport modes (plane, train, coach/bus, ferry, underground/subway), travel actions (book, check in, board, depart, arrive, transfer), comparison adjectives (fast/faster/fastest, expensive/more expensive/most expensive, good/better/best).'),

('itm_l2_m2_lesson1', 'unt_l2_m2', 2, 'reading', 'Lesson 2.1 -- Which Is Better? -- Comparatives & Superlatives',
'LEARNING OBJECTIVES: (1) form regular comparatives (-er/more) and superlatives (-est/most) correctly, including common irregulars, (2) use "than" correctly, (3) compare three or more options and identify "the most/-est", (4) justify a comparative opinion with "because".

PREREQUISITE KNOWLEDGE: Level I, Module 6 (basic adjectives).

WARM-UP (5 min): Your instructor shows two contrasting transport-related pictures for you to informally compare.

PRESENTATION (10 min): "The train is faster than the coach. The plane is the fastest, but it''s also the most expensive." Short adjectives take -er/-est; longer adjectives take more/most; irregulars (good/bad/far) are memorised exceptions. "because" introduced explicitly as the tool for justifying a comparison.

GUIDED PRACTICE (10 min): Compare 3 transport options on a prompt card (speed, cost, comfort) using the correct form for each, then state which is "the best" overall and why.

INDEPENDENT PRACTICE / SPEAKING ACTIVITY (10 min): Rank 4 real or realistic travel options for a specific trip from best to worst, writing 3 comparative sentences and one superlative conclusion, then present your ranking to a partner who must ask at least one "Why?" question.

CRITICAL THINKING / DISCUSSION PROMPT: "Is the fastest way to travel always the best way? What else matters besides speed?" -- small-group discussion weighing cost, comfort, environmental impact, experience.

LISTENING ACTIVITY (5 min): Listen to two people comparing travel options (5-6 exchanges) and note which option they choose and why.

READING ACTIVITY (5 min): Read a short "Bus vs. Train" style comparison text and answer 3 comprehension questions.

WRITING TASK (5 min): Write 4 sentences comparing two forms of transport you know well, including at least one superlative.

PRONUNCIATION PRACTICE (5 min): The -er/-est suffix pronunciation and word stress shift in longer comparative phrases ("more comFORTable").

VOCABULARY REINFORCEMENT: a comparative-adjective transformation drill covering regular and irregular forms.

FORMATIVE ASSESSMENT: Instructor checks correct -er/-est vs. more/most selection during independent practice.

HOMEWORK: Research or recall 3 real facts comparing two cities or places you know, ready to share as comparative sentences.

REVISION: Lesson 2.2 opens with 2-3 learners sharing their homework comparisons.

EXTENSION: Add "a bit", "much", or "far" to intensify a comparison ("The plane is far more expensive than the coach").'),

('itm_l2_m2_lesson2', 'unt_l2_m2', 3, 'reading', 'Lesson 2.2 -- Booking a Trip -- Travel & Transport Vocabulary',
'LEARNING OBJECTIVES: (1) use 12+ travel and transport vocabulary items correctly, (2) understand and produce simple booking language, (3) ask and answer "How long does it take?"/"How much is it?" in a travel context, (4) understand a simple travel itinerary or timetable.

PREREQUISITE KNOWLEDGE: Lesson 2.1 (comparatives), Level I Module 4 (prices, how much).

WARM-UP (5 min): Your instructor shows a simple travel itinerary or ticket for you to identify what information it contains.

PRESENTATION (10 min): "I''d like to book a return ticket to Manchester, please. Certainly. Would you prefer the morning or afternoon train? The morning one. How long does it take? About two hours." 10-12 travel-process words introduced: book, check in, board, depart, arrive, transfer, platform, gate, timetable, itinerary.

GUIDED PRACTICE (10 min): Pair work -- one learner is a booking agent, the other a customer; using a prompt card, perform a short booking exchange, then swap roles.

INDEPENDENT PRACTICE / SPEAKING ACTIVITY (10 min): Read a simple 2-3 leg travel itinerary and answer 4 comprehension questions, then write your own short 2-leg itinerary for an invented trip.

LISTENING ACTIVITY (5 min): Listen to a short generic airport/station announcement and extract 3 key pieces of information.

READING ACTIVITY (5 min): Read the sample itinerary again plus one more, comparing the two ("Which trip has more transfers?").

WRITING TASK (5 min): Write a short message to a friend describing your travel plans using at least 4 target vocabulary items and one comparative from Lesson 2.1.

PRONUNCIATION PRACTICE (5 min): The BrE/AmE pronunciation difference in "schedule" -- a listening-recognition point, both correct.

VOCABULARY REINFORCEMENT: a travel-vocabulary bingo or matching game.

FORMATIVE ASSESSMENT: Instructor observes the booking roleplay for correct booking language and appropriate politeness.

HOMEWORK: Research or invent a real trip you''d like to take, noting transport options, approximate cost, and travel time, for Module 2''s assignment.

REVISION: This lesson opens with the itinerary-reading vocabulary recap. Module 2''s Quiz and Assignment draw on both lessons.

EXTENSION: Add a "what could go wrong" sentence to your itinerary using "might" as a light preview (formally taught at Level III).'),

('itm_l2_m2_quiz', 'unt_l2_m2', 4, 'quiz', 'Module 2 Quiz -- Travel & Transport', NULL),

('itm_l2_m2_assignment', 'unt_l2_m2', 5, 'assignment', 'Module 2 Assignment -- Plan and Justify a Trip',
'INSTRUCTIONS: Record yourself (or write) a description of a real or realistic trip you''d like to take. Compare at least two transport options using comparatives and state which one you''d choose and why, using "because". Include at least one piece of booking language and at least 3 travel/transport vocabulary items from this module.

GRADING RUBRIC: (1) Grammatical accuracy -- correct comparative/superlative forms, correct "because" usage. (2) Vocabulary range -- at least 3 distinct travel/transport words used correctly. (3) Task completion -- a clear comparison, a stated choice, a reason, and booking language all present. (4) Communicative quality -- does the learner genuinely justify their choice with a real reason, showing actual comparative reasoning, not memorised phrases alone?

A grade at or above the platform''s pass threshold marks this module complete.');

INSERT INTO quiz_questions (id, learning_item_id, sequence, prompt, choices_json, correct_index) VALUES
('qq_l2_m2_1', 'itm_l2_m2_quiz', 1, '"The train is ___ than the bus." (fast)', '["fastest","faster","more fast","most fast"]', 1),
('qq_l2_m2_2', 'itm_l2_m2_quiz', 2, '"This is ___ hotel in the city." (expensive)', '["more expensive","expensiver","the most expensive","the expensivest"]', 2),
('qq_l2_m2_3', 'itm_l2_m2_quiz', 3, '"Flying is ___ than taking the train, but it''s much faster." (bad)', '["worse","more bad","badder","worst"]', 0),
('qq_l2_m2_4', 'itm_l2_m2_quiz', 4, '"This is ___ way to travel." (good)', '["the goodest","the best","the better","more good"]', 1),
('qq_l2_m2_5', 'itm_l2_m2_quiz', 5, '"I''d ___ to book a ticket, please."', '["like","liking","likes","liked"]', 0),
('qq_l2_m2_6', 'itm_l2_m2_quiz', 6, '"How ___ does the journey take?"', '["much","long","many","far"]', 1),
('qq_l2_m2_7', 'itm_l2_m2_quiz', 7, 'Which British word means the same as the American "vacation"?', '["trip","journey","holiday","travel"]', 2),
('qq_l2_m2_8', 'itm_l2_m2_quiz', 8, '"The train ___ from Platform 4 at 9am."', '["departs","arrives","boards","transfers"]', 0),
('qq_l2_m2_9', 'itm_l2_m2_quiz', 9, '"The bus is cheaper, ___ it takes much longer."', '["so","but","because","and"]', 1),
('qq_l2_m2_10', 'itm_l2_m2_quiz', 10, 'Which is a British term for a long-distance bus?', '["subway","coach","trolley","shuttle"]', 1);

-- ---------------------------------------------------------------------
-- Module 3: Work & Study
-- Full prose version: docs/curriculum/level-2/module-03-work-study.md
-- ---------------------------------------------------------------------
INSERT INTO units (id, course_id, sequence, title) VALUES
  ('unt_l2_m3', 'crs_level_2', 3, 'Module 3: Work & Study');

INSERT INTO learning_items (id, unit_id, sequence, kind, title, body) VALUES
('itm_l2_m3_overview', 'unt_l2_m3', 1, 'reading', 'Module Overview & Key Phrases',
'Key phrases introduced this module: What are you doing at the moment? -- I''m working on... -- I usually.../I''m currently... -- What do you do? (job) vs. What are you doing? (right now) -- I''d like to become a... because...

BrE / AmE note: CV (BrE, curriculum vitae) / résumé (AmE) -- both mean the document summarising your work history, though in the US a CV specifically refers to an academic-style long-form document. Also: flat (BrE) / apartment (AmE); "annual leave" is the neutral, formal term for holiday/vacation in international professional writing.

Key vocabulary previewed: job/workplace nouns (colleague, manager, deadline, meeting, project, client), study nouns (assignment, lecture, exam, degree, classmate), ambition language (I''d like to become..., my goal is to..., I''m planning to study...).'),

('itm_l2_m3_lesson1', 'unt_l2_m3', 2, 'reading', 'Lesson 3.1 -- What Are You Doing? -- Present Continuous vs. Present Simple',
'LEARNING OBJECTIVES: (1) use present continuous correctly for actions happening right now or temporarily, (2) use present simple correctly for habits, routines, and permanent facts, (3) choose correctly between the two based on context, (4) recognise state verbs (know, like, believe, want) rarely used in continuous form.

PREREQUISITE KNOWLEDGE: Level I Module 3 (present simple); Level II Module 1 (past continuous, the pattern this lesson extends into the present).

WARM-UP (5 min): Your instructor performs one action ("I''m writing on the board") while stating one routine fact ("I teach English every day") -- two visibly different present-tense sentences.

PRESENTATION (10 min): "I usually work in an office, but this week I''m working from home." Present simple = routine/habit/permanent fact; present continuous = happening now or temporarily. State verbs explicitly contrasted: "I know the answer" (correct) vs. "I''m knowing the answer" (incorrect) -- a common A2 error.

GUIDED PRACTICE (10 min): Sort 10 sentence prompts into "routine" and "right now/temporary", then complete each with the correct form.

INDEPENDENT PRACTICE / SPEAKING ACTIVITY (10 min): Write 3 sentences about your real routine (present simple) and 3 about something different this week/month (present continuous), then interview a partner about both.

CRITICAL THINKING / DISCUSSION PROMPT: "Do you think it''s healthy to have a fixed daily routine, or is it better to do different things all the time? Why?" -- small-group discussion recycling both target structures.

LISTENING ACTIVITY (5 min): Listen to someone describing their week (mixing routine and temporary activities) and sort what they say into the two categories.

READING ACTIVITY (5 min): Read a short "About Me" workplace profile and identify which sentences describe permanent facts and which describe something temporary/current.

WRITING TASK (5 min): Write a paragraph (5-6 sentences) about your real week, using both present simple and present continuous correctly.

PRONUNCIATION PRACTICE (5 min): The contracted ''m/''re/''s + -ing connected-speech forms versus the fuller, more formal pronunciation appropriate for professional contexts.

VOCABULARY REINFORCEMENT: a state-verb vs. action-verb sorting game.

FORMATIVE ASSESSMENT: Instructor checks correct tense selection by context and correct avoidance of continuous forms with state verbs.

HOMEWORK: Note 3 things "usually true" about your work/study life and 3 things different "this week", for Lesson 3.2.

REVISION: Lesson 3.2 opens with 2-3 learners sharing their homework routine/temporary contrasts.

EXTENSION: Add one sentence using present continuous for a fixed future arrangement ("I''m meeting my manager tomorrow") -- formally developed at Level III.'),

('itm_l2_m3_lesson2', 'unt_l2_m3', 3, 'reading', 'Lesson 3.2 -- My Job, My Studies -- Work & Ambition',
'LEARNING OBJECTIVES: (1) use 12+ work/study vocabulary items correctly, (2) describe your job or studies and typical responsibilities, (3) discuss a future ambition using "I''d like to.../My goal is to..." with a reason, (4) ask appropriate professional/academic questions about someone else''s work or studies.

PREREQUISITE KNOWLEDGE: Lesson 3.1 (present simple/continuous), Level I Module 8 (going to, as a contrast with this lesson''s more aspirational "I''d like to").

WARM-UP (5 min): Your instructor asks "What''s one professional goal you have?", eliciting informal responses.

PRESENTATION (10 min): "I work as a teacher. My main responsibility is planning lessons. I''d like to become a head teacher one day because I enjoy leading a team." 10-12 work/study nouns introduced plus the ambition-language frame with "because" justification.

GUIDED PRACTICE (10 min): Ask about a partner''s real (or aspirational) job/studies using 4 target questions, then swap.

INDEPENDENT PRACTICE / SPEAKING ACTIVITY (10 min): Prepare a short "About My Work/Studies" profile (role, responsibility, one thing you enjoy, one future goal with a reason), then present it to a small group, who each ask one follow-up question.

CRITICAL THINKING / DISCUSSION PROMPT: "Is it more important to enjoy your job or to earn a lot of money? Can you have both?" -- small-group discussion weighing competing values.

LISTENING ACTIVITY (5 min): Listen to 3 people briefly describing their jobs and goals, and match each speaker to the correct summary card.

READING ACTIVITY (5 min): Read 2 short professional profile texts and answer comprehension questions about role and ambition.

WRITING TASK (5 min): Write a short "About Me" professional paragraph (5-6 sentences) suitable for introducing yourself to a new colleague or classmate.

PRONUNCIATION PRACTICE (5 min): Word stress in multi-syllable job/workplace nouns (colLEAGUE, deADline, MANager).

VOCABULARY REINFORCEMENT: a work/study vocabulary matching game.

FORMATIVE ASSESSMENT: Instructor checks correct use of ambition language with because-justification during the group presentation.

HOMEWORK: Finalise your "About My Work/Studies" profile for Module 3''s assignment, adding one more specific detail.

REVISION: This lesson opens with the Lesson 3.1 routine/temporary recap. Module 3''s Quiz and Assignment draw on both lessons.

EXTENSION: Add one sentence comparing your current role to a past one using "used to" (recycling Module 1''s grammar in a professional context).'),

('itm_l2_m3_quiz', 'unt_l2_m3', 4, 'quiz', 'Module 3 Quiz -- Work & Study', NULL),

('itm_l2_m3_assignment', 'unt_l2_m3', 5, 'assignment', 'Module 3 Assignment -- A Day in My Working Life',
'INSTRUCTIONS: Record yourself (or write) 8-10 sentences describing your real (or realistic future) work or study life. Include: at least 2 sentences using present simple for routine responsibilities; at least 2 sentences using present continuous for something you''re currently working on or different this week; one sentence stating a professional or academic goal using "I''d like to.../My goal is to..." with a because justification; and at least 4 work/study vocabulary items from this module.

GRADING RUBRIC: (1) Grammatical accuracy -- correct present simple/continuous choice by context, correct avoidance of continuous with state verbs. (2) Vocabulary range -- at least 4 distinct work/study words used correctly. (3) Task completion -- all required elements present. (4) Communicative quality -- is the stated goal genuinely explained with a real, specific reason, and does the description sound like a real person''s working life?

A grade at or above the platform''s pass threshold marks this module complete.');

INSERT INTO quiz_questions (id, learning_item_id, sequence, prompt, choices_json, correct_index) VALUES
('qq_l2_m3_1', 'itm_l2_m3_quiz', 1, '"I ___ in an office, but this week I ___ from home."', '["work / work","work / am working","am working / work","am working / am working"]', 1),
('qq_l2_m3_2', 'itm_l2_m3_quiz', 2, '"She ___ the answer." (a fact, not a temporary state)', '["is knowing","knows","is know","know"]', 1),
('qq_l2_m3_3', 'itm_l2_m3_quiz', 3, '"Look! It ___ outside."', '["rains","is raining","rain","raining"]', 1),
('qq_l2_m3_4', 'itm_l2_m3_quiz', 4, '"I usually ___ the bus to work."', '["am taking","take","takes","taking"]', 1),
('qq_l2_m3_5', 'itm_l2_m3_quiz', 5, '"My main ___ is planning the weekly schedule."', '["responsibility","deadline","colleague","client"]', 0),
('qq_l2_m3_6', 'itm_l2_m3_quiz', 6, '"I''d like to ___ a manager one day."', '["become","becoming","becomes","became"]', 0),
('qq_l2_m3_7', 'itm_l2_m3_quiz', 7, 'Which word means "the document that summarises your work history" in British English?', '["résumé","portfolio","CV","profile"]', 2),
('qq_l2_m3_8', 'itm_l2_m3_quiz', 8, '"I enjoy my job ___ it''s challenging and creative."', '["so","but","because","although"]', 2),
('qq_l2_m3_9', 'itm_l2_m3_quiz', 9, '"At the moment, I ___ on a big project."', '["work","am working","works","worked"]', 1),
('qq_l2_m3_10', 'itm_l2_m3_quiz', 10, 'Which verb is rarely used in the continuous form?', '["run","cook","know","write"]', 2);
