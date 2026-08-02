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
('qq_l2_m1_1', 'itm_l2_m1_quiz', 1, '"I ___ TV when the phone rang."', '["watched","watch","am watching","was watching"]', 3),
('qq_l2_m1_2', 'itm_l2_m1_quiz', 2, '"While I ___ dinner, my sister called."', '["cooked","was cooking","cook","cooks"]', 1),
('qq_l2_m1_3', 'itm_l2_m1_quiz', 3, '"___ you use to live in London?"', '["Did","Do","Were","Was"]', 0),
('qq_l2_m1_4', 'itm_l2_m1_quiz', 4, '"I didn''t use to ___ coffee, but now I love it."', '["liked","liking","like","likes"]', 2),
('qq_l2_m1_5', 'itm_l2_m1_quiz', 5, 'Which sentence is correct?', '["I used to visit her last year.","I visited her last year.","I use to visited her last year.","I was visiting her last year only."]', 1),
('qq_l2_m1_6', 'itm_l2_m1_quiz', 6, '"When I ___ the door, I saw my friend outside."', '["was opening","open","opens","opened"]', 3),
('qq_l2_m1_7', 'itm_l2_m1_quiz', 7, '"___ were you doing at 8pm yesterday?"', '["When","Where","What","Who"]', 2),
('qq_l2_m1_8', 'itm_l2_m1_quiz', 8, 'Which describes a repeated past habit, not a single event?', '["I used to go to the cinema every Friday.","I went to Paris in 2019.","I was watching TV at 9pm.","I saw a great film last night."]', 0),
('qq_l2_m1_9', 'itm_l2_m1_quiz', 9, '"She ___ shy when she was a child, but now she''s very confident."', '["used to be","use to be","used to being","was use to be"]', 0),
('qq_l2_m1_10', 'itm_l2_m1_quiz', 10, 'Which word often introduces the "background" action in a past narrative?', '["when","then","while","after"]', 2);

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
('qq_l2_m2_1', 'itm_l2_m2_quiz', 1, '"The train is ___ than the bus." (fast)', '["faster","fastest","more fast","most fast"]', 0),
('qq_l2_m2_2', 'itm_l2_m2_quiz', 2, '"This is ___ hotel in the city." (expensive)', '["more expensive","expensiver","the most expensive","the expensivest"]', 2),
('qq_l2_m2_3', 'itm_l2_m2_quiz', 3, '"Flying is ___ than taking the train, but it''s much faster." (bad)', '["more bad","worse","badder","worst"]', 1),
('qq_l2_m2_4', 'itm_l2_m2_quiz', 4, '"This is ___ way to travel." (good)', '["the goodest","the better","more good","the best"]', 3),
('qq_l2_m2_5', 'itm_l2_m2_quiz', 5, '"I''d ___ to book a ticket, please."', '["liking","likes","like","liked"]', 2),
('qq_l2_m2_6', 'itm_l2_m2_quiz', 6, '"How ___ does the journey take?"', '["long","much","many","far"]', 0),
('qq_l2_m2_7', 'itm_l2_m2_quiz', 7, 'Which British word means the same as the American "vacation"?', '["trip","journey","travel","holiday"]', 3),
('qq_l2_m2_8', 'itm_l2_m2_quiz', 8, '"The train ___ from Platform 4 at 9am."', '["arrives","departs","boards","transfers"]', 1),
('qq_l2_m2_9', 'itm_l2_m2_quiz', 9, '"The bus is cheaper, ___ it takes much longer."', '["so","but","because","and"]', 1),
('qq_l2_m2_10', 'itm_l2_m2_quiz', 10, 'Which is a British term for a long-distance bus?', '["subway","trolley","shuttle","coach"]', 3);

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
('qq_l2_m3_1', 'itm_l2_m3_quiz', 1, '"I ___ in an office, but this week I ___ from home."', '["work / work","am working / work","work / am working","am working / am working"]', 2),
('qq_l2_m3_2', 'itm_l2_m3_quiz', 2, '"She ___ the answer." (a fact, not a temporary state)', '["knows","is knowing","is know","know"]', 0),
('qq_l2_m3_3', 'itm_l2_m3_quiz', 3, '"Look! It ___ outside."', '["rains","rain","raining","is raining"]', 3),
('qq_l2_m3_4', 'itm_l2_m3_quiz', 4, '"I usually ___ the bus to work."', '["am taking","take","takes","taking"]', 1),
('qq_l2_m3_5', 'itm_l2_m3_quiz', 5, '"My main ___ is planning the weekly schedule."', '["responsibility","deadline","colleague","client"]', 0),
('qq_l2_m3_6', 'itm_l2_m3_quiz', 6, '"I''d like to ___ a manager one day."', '["becoming","becomes","become","became"]', 2),
('qq_l2_m3_7', 'itm_l2_m3_quiz', 7, 'Which word means "the document that summarises your work history" in British English?', '["résumé","CV","portfolio","profile"]', 1),
('qq_l2_m3_8', 'itm_l2_m3_quiz', 8, '"I enjoy my job ___ it''s challenging and creative."', '["so","but","although","because"]', 3),
('qq_l2_m3_9', 'itm_l2_m3_quiz', 9, '"At the moment, I ___ on a big project."', '["work","works","worked","am working"]', 3),
('qq_l2_m3_10', 'itm_l2_m3_quiz', 10, 'Which verb is rarely used in the continuous form?', '["run","know","cook","write"]', 1);

-- ---------------------------------------------------------------------
-- Module 4: Likes, Dislikes & Opinions
-- Full prose version: docs/curriculum/level-2/module-04-likes-dislikes-opinions.md
-- ---------------------------------------------------------------------
INSERT INTO units (id, course_id, sequence, title) VALUES
  ('unt_l2_m4', 'crs_level_2', 4, 'Module 4: Likes, Dislikes & Opinions');

INSERT INTO learning_items (id, unit_id, sequence, kind, title, body) VALUES
('itm_l2_m4_overview', 'unt_l2_m4', 1, 'reading', 'Module Overview & Key Phrases',
'Key phrases introduced this module: I love/like/enjoy/don''t mind/dislike/hate + -ing -- In my opinion,.../I think.../I don''t think... -- I agree/I disagree, because... -- I''d prefer... to.../I''d rather... -- That''s a good point, but...

BrE / AmE note: British speakers often soften an opinion with "I''d say..."/"I suppose..."; American speakers more often use "I feel like...", notably informal in written British academic register. WEC-LC teaches "In my opinion.../I think..." as the neutral, register-safe form in both varieties.

Key vocabulary previewed: opinion verbs (love, like, enjoy, don''t mind, dislike, hate, prefer), agreement/disagreement language (I agree, I see your point, I''m not so sure, I disagree), comparison connectors (whereas, on the other hand).'),

('itm_l2_m4_lesson1', 'unt_l2_m4', 2, 'reading', 'Lesson 4.1 -- I Love Reading -- Gerunds After Verbs',
'LEARNING OBJECTIVES: (1) form the gerund (-ing form as a noun) correctly after opinion verbs, (2) rank preferences from strongest to weakest, (3) use "prefer + gerund + to + gerund" to compare two activities, (4) avoid the common error of using "to + base verb" after these opinion verbs.

PREREQUISITE KNOWLEDGE: Level I Module 8 (can/can''t -- a structurally similar pattern this lesson deliberately contrasts).

WARM-UP (5 min): Your instructor mimes 3 activities with an exaggerated happy/neutral/unhappy face for you to guess the opinion.

PRESENTATION (10 min): "I love reading. I don''t mind cooking, but I hate cleaning. I prefer walking to driving." These verbs take the -ing form (a gerund), never "to + base verb" -- flagged as a common error, with "prefer + gerund + to + gerund" highlighted as only working with -ing.

GUIDED PRACTICE (10 min): Given a "like scale" (love/like/don''t mind/dislike/hate) and 8 activity pictures, build one true sentence per activity using the correct verb and gerund form.

INDEPENDENT PRACTICE / SPEAKING ACTIVITY (10 min): Rank 6 real leisure activities on your own like-scale, then compare with a partner using "I prefer ___ to ___" for at least 2 pairs. Class survey: share your strongest love and strongest hate.

CRITICAL THINKING / DISCUSSION PROMPT: "Do you think people''s preferences usually stay the same their whole life, or do they change? Give an example." -- connecting to Module 1''s "used to".

LISTENING ACTIVITY (5 min): Listen to someone describing 5 preferences and note which activities they love/like/dislike/hate.

READING ACTIVITY (5 min): Read a short "About Me" hobbies paragraph and answer 3 comprehension questions.

WRITING TASK (5 min): Write 4-5 sentences about your own real leisure preferences using at least 3 different opinion verbs and one "prefer...to..." comparison.

PRONUNCIATION PRACTICE (5 min): Sentence stress on the opinion verb itself (I LOVE reading; I HATE cleaning).

VOCABULARY REINFORCEMENT: a "like scale" card-sorting game ranking 8 activity cards.

FORMATIVE ASSESSMENT: Instructor checks correct gerund formation (not infinitive) after opinion verbs.

HOMEWORK: Prepare 2 sentences using "would rather" for Lesson 4.2''s opening recap.

REVISION: Lesson 4.2 opens with a quick share of the homework "would rather" sentences.

EXTENSION: Add a reason to each preference sentence using "because" ("I prefer walking to driving because it''s healthier").'),

('itm_l2_m4_lesson2', 'unt_l2_m4', 3, 'reading', 'Lesson 4.2 -- I Think... -- Giving and Responding to Opinions',
'LEARNING OBJECTIVES: (1) give an opinion using "I think.../In my opinion..." and support it with a reason, (2) agree and disagree politely, (3) respond to someone else''s opinion with a follow-up question or counter-point, (4) recognise the difference between a fact and an opinion.

PREREQUISITE KNOWLEDGE: Lesson 4.1 (preference language), Level I Module 5 imperatives (a register contrast).

WARM-UP (5 min): Your instructor states one opinion and one fact for you to identify which is which.

PRESENTATION (10 min): "In my opinion, online classes are more convenient. I agree -- you can study anywhere. But I think in-person classes are more motivating. That''s a good point." Polite-disagreement frame highlighted: agree with something first, then add a different view.

GUIDED PRACTICE (10 min): Given 5 mild opinion prompts, practise stating an opinion, then politely agreeing or disagreeing with a partner''s response.

INDEPENDENT PRACTICE / SPEAKING ACTIVITY (10 min): Choose one of 4 discussion topics, prepare a short opinion + reason, then discuss in a group of 3-4, practising both agreement and polite disagreement.

CRITICAL THINKING / DISCUSSION PROMPT: "Is it possible for two people to both be ''right'' when they disagree about an opinion (not a fact)? Why or why not?"

LISTENING ACTIVITY (5 min): Listen to a short discussion (2 speakers) and note each speaker''s opinion and one reason.

READING ACTIVITY (5 min): Read two short opinion paragraphs arguing opposite views and identify each writer''s opinion and supporting reason.

WRITING TASK (5 min): Write a short paragraph (4-5 sentences) giving your opinion on one of the four topics, with at least one clear reason.

PRONUNCIATION PRACTICE (5 min): Falling intonation on confident opinion statements versus the softer, slightly rising pattern used when politely disagreeing.

VOCABULARY REINFORCEMENT: agreement/disagreement phrase matching game, sorted by politeness/strength.

FORMATIVE ASSESSMENT: Instructor listens during group discussion for polite disagreement framing, not blunt rejection.

HOMEWORK: Choose your strongest opinion and write 2 additional supporting reasons, for Module 4''s assignment.

REVISION: This lesson opens with the Lesson 4.1 "would rather" recap. Module 4''s Quiz and Assignment draw on both lessons.

EXTENSION: Practise responding to an opinion you personally disagree with, using at least two different softening phrases.'),

('itm_l2_m4_quiz', 'unt_l2_m4', 4, 'quiz', 'Module 4 Quiz -- Likes, Dislikes & Opinions', NULL),

('itm_l2_m4_assignment', 'unt_l2_m4', 5, 'assignment', 'Module 4 Assignment -- My Opinion -- A Short Debate',
'INSTRUCTIONS: Record yourself (or write) a short response, 6-8 sentences, on one of these topics: online learning vs. in-person learning; city life vs. countryside life. State your opinion clearly, give at least two reasons using gerunds and/or "prefer...to..." where natural, and include one sentence that acknowledges a different view politely before restating your own position.

GRADING RUBRIC: (1) Grammatical accuracy -- correct gerund formation after opinion verbs, correct prefer...to.../would rather usage. (2) Vocabulary range -- at least 3 distinct opinion/preference expressions used correctly. (3) Task completion -- a clear opinion, at least two reasons, one acknowledgement of an alternative view. (4) Communicative quality -- is the opinion genuinely justified with specific reasons, and does the alternative-view acknowledgement sound authentically polite?

A grade at or above the platform''s pass threshold marks this module complete.');

INSERT INTO quiz_questions (id, learning_item_id, sequence, prompt, choices_json, correct_index) VALUES
('qq_l2_m4_1', 'itm_l2_m4_quiz', 1, '"I love ___ books."', '["read","reading","to reading","reads"]', 1),
('qq_l2_m4_2', 'itm_l2_m4_quiz', 2, '"She hates ___ up early."', '["wake","to wake","wakes","waking"]', 3),
('qq_l2_m4_3', 'itm_l2_m4_quiz', 3, '"I prefer tea ___ coffee."', '["than","that","to","from"]', 2),
('qq_l2_m4_4', 'itm_l2_m4_quiz', 4, '"In my ___, this is the best option."', '["opinion","idea","think","mind"]', 0),
('qq_l2_m4_5', 'itm_l2_m4_quiz', 5, '"I ___ disagree -- I think the film was better."', '["totally don''t","really","not","don''t"]', 3),
('qq_l2_m4_6', 'itm_l2_m4_quiz', 6, '"That''s a good point, ___ I still think..."', '["so","but","because","and"]', 1),
('qq_l2_m4_7', 'itm_l2_m4_quiz', 7, 'Which sentence expresses an opinion, not a fact?', '["I think this book is boring.","Water boils at 100C.","London is the capital of the UK.","The meeting is at 3pm."]', 0),
('qq_l2_m4_8', 'itm_l2_m4_quiz', 8, '"I''d ___ walk than take the bus."', '["prefer","like","rather","want"]', 2),
('qq_l2_m4_9', 'itm_l2_m4_quiz', 9, '"He doesn''t ___ waiting in queues."', '["minds","minding","mind","to mind"]', 2),
('qq_l2_m4_10', 'itm_l2_m4_quiz', 10, 'Which response politely disagrees rather than bluntly rejecting the idea?', '["I see your point, but I think...","No, that''s wrong.","That''s not true.","I don''t agree at all."]', 0);

-- ---------------------------------------------------------------------
-- Module 5: Making Plans
-- Full prose version: docs/curriculum/level-2/module-05-making-plans.md
-- ---------------------------------------------------------------------
INSERT INTO units (id, course_id, sequence, title) VALUES
  ('unt_l2_m5', 'crs_level_2', 5, 'Module 5: Making Plans');

INSERT INTO learning_items (id, unit_id, sequence, kind, title, body) VALUES
('itm_l2_m5_overview', 'unt_l2_m5', 1, 'reading', 'Module Overview & Key Phrases',
'Key phrases introduced this module: Would you like to...? -- I''m free on.../I''m busy on... -- Shall we...? -- Let''s... -- I''m afraid I can''t, but how about...? -- That works for me. / Sounds good.

BrE / AmE note: "Shall we...?" sounds formal/dated in American English, where "How about we...?" or "Let''s..." is more natural; both taught here. Diary vocabulary: British "I''m free at the weekend" vs. American "I''m free this weekend".

Key vocabulary previewed: invitation/arrangement verbs (arrange, confirm, reschedule, cancel, postpone), time-arrangement phrases (how about..., what time suits you, I''ll pencil it in), polite refusal language (I''m afraid..., unfortunately..., I already have plans).'),

('itm_l2_m5_lesson1', 'unt_l2_m5', 2, 'reading', 'Lesson 5.1 -- Will, Going To, or Present Continuous? -- Future Forms Review',
'LEARNING OBJECTIVES: (1) distinguish "will" (spontaneous decision/prediction) from "going to" (a prior plan), (2) use present continuous for a fixed, arranged future event, (3) choose the correct future form based on context, (4) use "will" correctly for offers and promises.

PREREQUISITE KNOWLEDGE: Level I Module 8 (going to); Level II Module 3 (present continuous, including its fixed-arrangement extension).

WARM-UP (5 min): Your instructor asks "What are you doing this weekend?" then poses a spontaneous problem ("I''ve forgotten my pen!") for you to respond to.

PRESENTATION (10 min): "I''m going to visit my parents this weekend" (a plan); "I''m meeting my manager at 3pm on Thursday" (a fixed arrangement); "It''s cold -- I''ll close the window" (a spontaneous decision). The decision-timing test: decided before now, or right now?

GUIDED PRACTICE (10 min): Read 8 short context sentences and choose the correct future form for each, justifying your choice using the decision-timing test.

INDEPENDENT PRACTICE / SPEAKING ACTIVITY (10 min): Write 5 sentences about your real near-future plans using all three forms at least once each, then explain to a partner why you chose each form.

CRITICAL THINKING / DISCUSSION PROMPT: "Do you prefer to plan things carefully in advance, or decide things spontaneously? What are the advantages of each?"

LISTENING ACTIVITY (5 min): Listen to 5 short exchanges and identify whether each speaker is making a spontaneous decision, stating a plan, or confirming an arrangement.

READING ACTIVITY (5 min): Read a short diary/calendar text mixing all three future forms and answer 3 comprehension questions.

WRITING TASK (5 min): Write a short message to a friend describing your plans for next week, using at least 2 of the 3 future forms correctly.

PRONUNCIATION PRACTICE (5 min): The contracted ''ll in natural speech versus its full form used for emphasis or careful/written register.

VOCABULARY REINFORCEMENT: a future-forms sorting game (plan/arrangement/spontaneous decision).

FORMATIVE ASSESSMENT: Instructor checks correct justification, not just correct form, during the partner explanation activity.

HOMEWORK: Check your real weekly schedule and note 3 fixed arrangements (present continuous) for Lesson 5.2.

REVISION: Lesson 5.2 opens with learners sharing their homework fixed-arrangement sentences.

EXTENSION: Write one sentence using "will" for a promise ("I''ll call you when I arrive").'),

('itm_l2_m5_lesson2', 'unt_l2_m5', 3, 'reading', 'Lesson 5.2 -- Are You Free on Saturday? -- Invitations & Arrangements',
'LEARNING OBJECTIVES: (1) make an invitation politely ("Would you like to...?"), (2) accept enthusiastically and decline politely with a reason, (3) suggest an alternative time/place when declining, (4) confirm a final arrangement clearly (who, what, when, where).

PREREQUISITE KNOWLEDGE: Lesson 5.1 (future forms), Level I Module 3 (telling the time).

WARM-UP (5 min): Your instructor invites 2-3 learners to a pretend event, modelling both an accept and a polite decline response.

PRESENTATION (10 min): "Would you like to come to the cinema on Saturday? I''d love to! What time? How about 7pm? Sounds good." / "Are you free for lunch tomorrow? I''m afraid I can''t -- I already have plans. How about Friday instead? Friday works for me." Polite-decline structure: soften, give a reason, offer an alternative.

GUIDED PRACTICE (10 min): Invite a partner to 3 different events from prompt cards; they accept one, decline one with an alternative, and negotiate the time for the third.

INDEPENDENT PRACTICE / SPEAKING ACTIVITY (10 min): Plan a real (or realistic invented) get-together with 2 different classmates in turn, confirming a specific day, time, and place for each.

CRITICAL THINKING / DISCUSSION PROMPT: "Why is it important to give a reason when you decline an invitation, rather than just saying ''no''?"

LISTENING ACTIVITY (5 min): Listen to 3 invitation exchanges and note whether each is accepted, declined, or rescheduled, and to when.

READING ACTIVITY (5 min): Read a short exchange of text messages arranging a meet-up and answer 3 comprehension questions.

WRITING TASK (5 min): Write a short message inviting a friend to an event, including a specific day and time.

PRONUNCIATION PRACTICE (5 min): Polite, rising intonation on invitations versus the warmer, falling intonation of enthusiastic acceptance.

VOCABULARY REINFORCEMENT: an invitation-response matching game (accept/decline/reschedule).

FORMATIVE ASSESSMENT: Instructor checks that a decline is always followed by a reason and/or alternative, never a bare "no".

HOMEWORK: Write a short final confirmation message summarising one of your arrangements, for Module 5''s assignment.

REVISION: This lesson opens with the Lesson 5.1 fixed-arrangement sharing recap. Module 5''s Quiz and Assignment draw on both lessons.

EXTENSION: Add a rescheduling exchange ("Actually, something''s come up -- can we move it to Sunday instead?") to one dialogue.'),

('itm_l2_m5_quiz', 'unt_l2_m5', 4, 'quiz', 'Module 5 Quiz -- Making Plans', NULL),

('itm_l2_m5_assignment', 'unt_l2_m5', 5, 'assignment', 'Module 5 Assignment -- Arrange a Meet-Up',
'INSTRUCTIONS: Record yourself (or write) a short dialogue, 8-10 exchanges, in which you invite someone to an event, they initially can''t make it and suggest an alternative, and you agree on a final day, time, and place. Use at least one example of "will", one of "going to", and one of present continuous for a fixed arrangement.

GRADING RUBRIC: (1) Grammatical accuracy -- all three future forms used correctly and appropriately. (2) Vocabulary range -- at least 3 distinct invitation/arrangement phrases used correctly. (3) Task completion -- a full invite / decline-with-alternative / confirm cycle present. (4) Communicative quality -- does the decline sound genuinely polite, and does the dialogue end with a clearly confirmed arrangement?

A grade at or above the platform''s pass threshold marks this module complete.');

INSERT INTO quiz_questions (id, learning_item_id, sequence, prompt, choices_json, correct_index) VALUES
('qq_l2_m5_1', 'itm_l2_m5_quiz', 1, '"It''s cold in here. I ___ close the window." (decided now)', '["am going to","am closing","will","close"]', 2),
('qq_l2_m5_2', 'itm_l2_m5_quiz', 2, '"I ___ my parents this weekend." (already decided)', '["am going to visit","will visit","visit","visited"]', 0),
('qq_l2_m5_3', 'itm_l2_m5_quiz', 3, '"I ___ my manager at 3pm on Thursday." (a fixed arrangement)', '["will meet","meet","am going to meeting","am meeting"]', 3),
('qq_l2_m5_4', 'itm_l2_m5_quiz', 4, '"___ you like to come to the cinema?"', '["Will","Would","Do","Are"]', 1),
('qq_l2_m5_5', 'itm_l2_m5_quiz', 5, '"I''d ___ to! What time?"', '["love","like","prefer","rather"]', 0),
('qq_l2_m5_6', 'itm_l2_m5_quiz', 6, '"I''m afraid I can''t -- I already ___ plans."', '["has","having","have","had"]', 2),
('qq_l2_m5_7', 'itm_l2_m5_quiz', 7, '"How about Friday ___?"', '["already","instead","also","too"]', 1),
('qq_l2_m5_8', 'itm_l2_m5_quiz', 8, 'Which is a polite way to decline an invitation?', '["No.","I can''t.","I don''t want to.","I''m afraid I can''t, but how about Friday?"]', 3),
('qq_l2_m5_9', 'itm_l2_m5_quiz', 9, '"I promise I ___ call you when I arrive."', '["am going to","am calling","call","will"]', 3),
('qq_l2_m5_10', 'itm_l2_m5_quiz', 10, 'Which future form usually describes a spontaneous decision made at the moment of speaking?', '["going to","will","present continuous","present simple"]', 1);

-- ---------------------------------------------------------------------
-- Module 6: Homes & Neighbourhoods
-- Full prose version: docs/curriculum/level-2/module-06-homes-neighbourhoods.md
-- ---------------------------------------------------------------------
INSERT INTO units (id, course_id, sequence, title) VALUES
  ('unt_l2_m6', 'crs_level_2', 6, 'Module 6: Homes & Neighbourhoods');

INSERT INTO learning_items (id, unit_id, sequence, kind, title, body) VALUES
('itm_l2_m6_overview', 'unt_l2_m6', 1, 'reading', 'Module Overview & Key Phrases',
'Key phrases introduced this module: There was/were... -- It used to be.../Now it''s... -- One advantage/disadvantage of... is... -- It''s within walking distance of... -- The best thing about my neighbourhood is...

BrE / AmE note: flat (BrE) / apartment (AmE); ground floor (BrE, street level) / first floor (AmE, street level -- Britain''s "first floor" is one level up, a genuinely confusing false-friend pair); garden (BrE) / yard (AmE); block of flats (BrE) / apartment building (AmE).

Key vocabulary previewed: housing types (flat/apartment, house, terraced house, detached house, block of flats), neighbourhood features (park, playground, shops, public transport links, green space), description adjectives (quiet, lively, convenient, safe, crowded).'),

('itm_l2_m6_lesson1', 'unt_l2_m6', 2, 'reading', 'Lesson 6.1 -- There Was a Park Near My House -- Past Existence & Description',
'LEARNING OBJECTIVES: (1) use "there was/there were" correctly for singular/plural past existence, (2) describe a past home or neighbourhood in reasonable detail, (3) contrast "there was/were" with "there is/are" explicitly, (4) use "used to be" as an alternative way to describe a past state.

PREREQUISITE KNOWLEDGE: Level I Module 2 (there is/are); Level II Module 1 (used to).

WARM-UP (5 min): Your instructor describes their own childhood street from memory ("There was a small shop on the corner. There were lots of trees.").

PRESENTATION (10 min): "When I was a child, there was a park near my house. There were always children playing there. It used to be very quiet." Direct past-tense mapping: there is -> there was; there are -> there were.

GUIDED PRACTICE (10 min): Given a "then" picture of an old neighbourhood, describe it using there was/were, then compare with a "now" picture using there is/are.

INDEPENDENT PRACTICE / SPEAKING ACTIVITY (10 min): Describe a real neighbourhood from your past using at least 4 there was/were sentences, then share with a partner who asks 2 follow-up questions.

CRITICAL THINKING / DISCUSSION PROMPT: "What is one thing about the place you grew up that you miss, and one thing you don''t miss?"

LISTENING ACTIVITY (5 min): Listen to someone describing their childhood neighbourhood (6 sentences) and complete a "then" picture-labelling worksheet.

READING ACTIVITY (5 min): Read a short "How My Neighbourhood Has Changed" text and answer 3 comprehension questions distinguishing past from present.

WRITING TASK (5 min): Write 5-6 sentences describing a place from your past using there was/were and used to be.

PRONUNCIATION PRACTICE (5 min): The weak-form pronunciation of was/were in there was/there were.

VOCABULARY REINFORCEMENT: a housing/neighbourhood-features picture-matching game.

FORMATIVE ASSESSMENT: Instructor checks correct was/were singular/plural agreement.

HOMEWORK: Note 3 things that used to be true about your home/neighbourhood and 3 things true now, for Lesson 6.2.

REVISION: Lesson 6.2 opens with 2-3 learners sharing their homework then/now contrasts.

EXTENSION: Add a reason for one change ("There used to be a cinema, but it closed because a new shopping centre opened").'),

('itm_l2_m6_lesson2', 'unt_l2_m6', 3, 'reading', 'Lesson 6.2 -- City or Countryside? -- Comparing Places to Live',
'LEARNING OBJECTIVES: (1) describe advantages and disadvantages of a place using structured language, (2) use precise prepositions of place relative to amenities, (3) compare two places to live using comparatives, (4) give a balanced opinion weighing more than one factor.

PREREQUISITE KNOWLEDGE: Lesson 6.1 (housing/neighbourhood vocabulary), Level II Module 2 (comparatives), Level I Module 5 (prepositions of place, extended).

WARM-UP (5 min): Your instructor shows two contrasting pictures (a busy city street, a quiet village) for you to describe with one word each.

PRESENTATION (10 min): "One advantage of living in the city is that it''s convenient -- everything is within walking distance. One disadvantage is that it can be crowded and noisy. The countryside is quieter, but it''s further from public transport." The advantage/disadvantage frame highlighted as a structured way to give a balanced opinion.

GUIDED PRACTICE (10 min): Given a "city vs. countryside" chart, complete it with one advantage and one disadvantage of each, using target vocabulary and comparatives.

INDEPENDENT PRACTICE / SPEAKING ACTIVITY (10 min): Choose which you''d personally prefer -- city or countryside living -- and prepare a short justified opinion weighing at least two factors, then discuss in a small group.

CRITICAL THINKING / DISCUSSION PROMPT: "Is the ''best'' place to live the same for everyone, or does it depend on the person? What factors matter most to you personally?"

LISTENING ACTIVITY (5 min): Listen to two people discussing where to live and note each person''s stated advantages/disadvantages and final preference.

READING ACTIVITY (5 min): Read a short comparison article ("City Living vs. Country Living") and identify the main advantage and disadvantage given for each.

WRITING TASK (5 min): Write a short paragraph (5-6 sentences) comparing city and countryside living and stating your own preference with a reason.

PRONUNCIATION PRACTICE (5 min): Sentence stress in advantage/disadvantage structures ("One ADvantage is..."; "One disADvantage is...").

VOCABULARY REINFORCEMENT: an advantage/disadvantage card-sorting game using 10 city/countryside feature cards.

FORMATIVE ASSESSMENT: Instructor checks that opinions are genuinely balanced (both an advantage and a disadvantage considered).

HOMEWORK: Finalise your neighbourhood description (combining past and present) for Module 6''s assignment.

REVISION: This lesson opens with the Lesson 6.1 then/now recap. Module 6''s Quiz and Assignment draw on both lessons.

EXTENSION: Add a third option to your comparison (a suburban town) and rank all three by personal preference.'),

('itm_l2_m6_quiz', 'unt_l2_m6', 4, 'quiz', 'Module 6 Quiz -- Homes & Neighbourhoods', NULL),

('itm_l2_m6_assignment', 'unt_l2_m6', 5, 'assignment', 'Module 6 Assignment -- My Neighbourhood, Then and Now',
'INSTRUCTIONS: Write (or record) 8-10 sentences describing a neighbourhood you know well. Include: at least 2 sentences using there was/were or used to be to describe how it was in the past; at least 2 sentences using there is/are to describe it now; one advantage and one disadvantage of living there; and a comparative sentence comparing it to another place you know.

GRADING RUBRIC: (1) Grammatical accuracy -- correct past/present there is/are/was/were agreement, correct comparative form. (2) Vocabulary range -- at least 4 distinct housing/neighbourhood words used correctly. (3) Task completion -- past description, present description, advantage, disadvantage, and comparison all present. (4) Communicative quality -- does the description genuinely convey what changed and why it matters, and is the advantage/disadvantage balanced?

A grade at or above the platform''s pass threshold marks this module complete.');

INSERT INTO quiz_questions (id, learning_item_id, sequence, prompt, choices_json, correct_index) VALUES
('qq_l2_m6_1', 'itm_l2_m6_quiz', 1, '"There ___ a park near my house when I was young."', '["is","was","were","be"]', 1),
('qq_l2_m6_2', 'itm_l2_m6_quiz', 2, '"There ___ lots of trees on my street."', '["was","is","has","were"]', 3),
('qq_l2_m6_3', 'itm_l2_m6_quiz', 3, '"It ___ be very quiet here, but now it''s busy."', '["is used to","use to","used to","using to"]', 2),
('qq_l2_m6_4', 'itm_l2_m6_quiz', 4, 'In British English, a "flat" is the same as which American word?', '["apartment","house","yard","block"]', 0),
('qq_l2_m6_5', 'itm_l2_m6_quiz', 5, '"One ___ of city life is convenient transport."', '["advantaged","advantages","advantageous","advantage"]', 3),
('qq_l2_m6_6', 'itm_l2_m6_quiz', 6, '"The shop is ___ walking distance of my flat."', '["at","within","in","on"]', 1),
('qq_l2_m6_7', 'itm_l2_m6_quiz', 7, '"The countryside is quieter, ___ it''s further from the city."', '["but","so","because","also"]', 0),
('qq_l2_m6_8', 'itm_l2_m6_quiz', 8, 'Which British term means the same as the American "yard" (private outdoor space at a house)?', '["park","court","garden","green"]', 2),
('qq_l2_m6_9', 'itm_l2_m6_quiz', 9, '"There ___ a cinema here, but it closed."', '["is","are","used to be","uses to be"]', 2),
('qq_l2_m6_10', 'itm_l2_m6_quiz', 10, 'In American English, the ___ floor is at street level.', '["first","ground","second","lobby"]', 0);

-- ---------------------------------------------------------------------
-- Module 7: Food, Health & Habits
-- Full prose version: docs/curriculum/level-2/module-07-food-health-habits.md
-- ---------------------------------------------------------------------
INSERT INTO units (id, course_id, sequence, title) VALUES
  ('unt_l2_m7', 'crs_level_2', 7, 'Module 7: Food, Health & Habits');

INSERT INTO learning_items (id, unit_id, sequence, kind, title, body) VALUES
('itm_l2_m7_overview', 'unt_l2_m7', 1, 'reading', 'Module Overview & Key Phrases',
'Key phrases introduced this module: always/usually/often/sometimes/rarely/never -- How often do you...? -- You should really.../You''d better... -- If I were you, I''d... -- It''s important to.../It''s bad for you to...

BrE / AmE note: chips (BrE, American "fries") vs. crisps (BrE) / chips (AmE, the bagged snack); biscuit (BrE) / cookie (AmE); sweets (BrE) / candy (AmE); courgette (BrE) / zucchini (AmE); aubergine (BrE) / eggplant (AmE) -- one of the highest-practical-value BrE/AmE vocabulary sets in the programme.

Key vocabulary previewed: frequency adverbs (always, usually, often, sometimes, rarely, never), health/lifestyle vocabulary (balanced diet, regular exercise, get enough sleep, stay hydrated, cut down on, give up).'),

('itm_l2_m7_lesson1', 'unt_l2_m7', 2, 'reading', 'Lesson 7.1 -- How Often? -- Adverbs of Frequency',
'LEARNING OBJECTIVES: (1) use 6+ adverbs of frequency correctly and in the correct sentence position, (2) ask and answer "How often do you...?", (3) rank frequency adverbs from "always" to "never", (4) use frequency expressions with a specific time period.

PREREQUISITE KNOWLEDGE: Level I Module 3 (present simple for routine).

WARM-UP (5 min): Your instructor makes 3 true statements about their own routine using different frequency adverbs.

PRESENTATION (10 min): "I usually go to bed at 11pm. I sometimes skip breakfast. I never eat fast food." Word order: frequency adverbs go before the main verb but after "be" ("I am always tired" vs. "I always go"). The "twice a week"/"three times a month" pattern introduced.

GUIDED PRACTICE (10 min): Complete 8 sentences with the correct frequency adverb based on a percentage/frequency prompt, then check correct word order placement.

INDEPENDENT PRACTICE / SPEAKING ACTIVITY (10 min): Interview a partner using 5 "How often do you...?" questions about health/lifestyle habits, recording the answers. Class summary: "Most people in our class usually/rarely..."

CRITICAL THINKING / DISCUSSION PROMPT: "Do you think people are usually honest with themselves about their own habits? Why might someone say they ''sometimes'' do something when it''s really ''often''?"

LISTENING ACTIVITY (5 min): Listen to someone describing their weekly habits (6 sentences, varied frequency adverbs) and complete a frequency-grid worksheet.

READING ACTIVITY (5 min): Read a short lifestyle survey result text and answer 3 comprehension questions.

WRITING TASK (5 min): Write 5-6 sentences about your own real habits using at least 4 different frequency adverbs, correctly positioned.

PRONUNCIATION PRACTICE (5 min): Word stress on multi-syllable frequency adverbs (USually, SOMEtimes, occaSIONally).

VOCABULARY REINFORCEMENT: a frequency-adverb scale-ordering activity (0% to 100%).

FORMATIVE ASSESSMENT: Instructor checks correct adverb position (before main verb, after "be").

HOMEWORK: Note your real answers to 3 of the interview questions, for Lesson 7.2''s advice-giving practice.

REVISION: Lesson 7.2 opens with a quick recap using the homework frequency data as advice-giving material.

EXTENSION: Add "hardly ever" and "occasionally" to your frequency vocabulary, correctly placed on the 0%-100% scale.'),

('itm_l2_m7_lesson2', 'unt_l2_m7', 3, 'reading', 'Lesson 7.2 -- You Really Should... -- Lifestyle Advice',
'LEARNING OBJECTIVES: (1) give lifestyle advice using an extended range of should/shouldn''t (really should, ''d better, if I were you, I''d), (2) justify advice with a health-related reason, (3) respond to advice appropriately, (4) distinguish strength of advice (should vs. the stronger ''d better).

PREREQUISITE KNOWLEDGE: Lesson 7.1 (frequency adverbs), Level I Module 9 (should/shouldn''t, light introduction).

WARM-UP (5 min): Your instructor states a habit ("I never exercise") for you to give informal advice on.

PRESENTATION (10 min): "You should really get more sleep. If I were you, I''d cut down on sugar. You''d better see a doctor if that continues." Strength scale highlighted: should < should really/if I were you, I''d < ''d better (strongest, implies a negative consequence if ignored).

GUIDED PRACTICE (10 min): State a real or invented lifestyle habit using frequency adverbs, partner gives advice at an appropriate strength, then swap.

INDEPENDENT PRACTICE / SPEAKING ACTIVITY (10 min): Choose one real habit you want to change, describe it, then get advice from 2 different classmates in a small group, noting which advice you found most helpful and why.

CRITICAL THINKING / DISCUSSION PROMPT: "Is it always helpful when someone gives you advice you didn''t ask for? When is unsolicited advice welcome, and when isn''t it?"

LISTENING ACTIVITY (5 min): Listen to 3 short advice exchanges and rank the strength of advice given (mild/moderate/strong).

READING ACTIVITY (5 min): Read a short "Dear Coach" advice-column letter and response, identifying the advice given and its strength.

WRITING TASK (5 min): Write a short advice reply (4-5 sentences) to a friend describing one unhealthy habit, using at least 2 different advice structures at different strengths.

PRONUNCIATION PRACTICE (5 min): The natural contraction "''d better" in connected speech, and the stress pattern in "If I WERE you".

VOCABULARY REINFORCEMENT: an advice-strength card-sorting game (mild/moderate/strong).

FORMATIVE ASSESSMENT: Instructor checks that advice strength matches the seriousness of the described habit.

HOMEWORK: Choose the piece of advice you found most useful and write 2-3 sentences on how you''d try to follow it, for Module 7''s assignment.

REVISION: This lesson opens with the Lesson 7.1 frequency-data recap used as advice-giving material. Module 7''s Quiz and Assignment draw on both lessons.

EXTENSION: Write one piece of advice using each of the three strength levels for the same habit, explaining how the meaning shifts.'),

('itm_l2_m7_quiz', 'unt_l2_m7', 4, 'quiz', 'Module 7 Quiz -- Food, Health & Habits', NULL),

('itm_l2_m7_assignment', 'unt_l2_m7', 5, 'assignment', 'Module 7 Assignment -- A Healthier Me -- A Habit Plan',
'INSTRUCTIONS: Write (or record) 8-10 sentences. First, describe 3 of your real current habits using frequency adverbs (at least one healthy, at least one you''d like to change). Then, give yourself advice for the habit you''d like to change, using at least two different advice structures at different strengths. Explain briefly why the change matters to you.

GRADING RUBRIC: (1) Grammatical accuracy -- correct frequency-adverb position, correct advice structures. (2) Vocabulary range -- at least 4 distinct frequency/health words used correctly. (3) Task completion -- 3 habits described, advice given at two different strengths, a personal reason stated. (4) Communicative quality -- is the self-reflection genuine and specific, and does the advice strength genuinely match the seriousness the writer assigns to the habit?

A grade at or above the platform''s pass threshold marks this module complete.');

INSERT INTO quiz_questions (id, learning_item_id, sequence, prompt, choices_json, correct_index) VALUES
('qq_l2_m7_1', 'itm_l2_m7_quiz', 1, '"I ___ go to bed at 11pm." (this is my normal routine)', '["usually","am usually","usual","usually am"]', 0),
('qq_l2_m7_2', 'itm_l2_m7_quiz', 2, '"I am ___ tired in the morning." (frequency + "to be")', '["am always","always am","always","usual"]', 2),
('qq_l2_m7_3', 'itm_l2_m7_quiz', 3, '"___ do you exercise?"', '["How much","How often","How many","How long"]', 1),
('qq_l2_m7_4', 'itm_l2_m7_quiz', 4, '"I go to the gym ___ a week."', '["two time","two times a","second time","twice"]', 3),
('qq_l2_m7_5', 'itm_l2_m7_quiz', 5, 'In British English, "chips" usually means the same as the American word:', '["crisps","cookies","fries","candy"]', 2),
('qq_l2_m7_6', 'itm_l2_m7_quiz', 6, '"You ___ better see a doctor."', '["had","have","should","would"]', 0),
('qq_l2_m7_7', 'itm_l2_m7_quiz', 7, '"If I ___ you, I''d cut down on sugar."', '["am","was","will be","were"]', 3),
('qq_l2_m7_8', 'itm_l2_m7_quiz', 8, 'Which is the strongest piece of advice?', '["You could try...","You''d better...","You should...","Maybe you should..."]', 1),
('qq_l2_m7_9', 'itm_l2_m7_quiz', 9, '"She ___ eats vegetables -- almost every meal."', '["never","usually","rarely","hardly ever"]', 1),
('qq_l2_m7_10', 'itm_l2_m7_quiz', 10, '"It''s important ___ stay hydrated."', '["for","that","of","to"]', 3);

-- ---------------------------------------------------------------------
-- Module 8: Shopping & Services
-- Full prose version: docs/curriculum/level-2/module-08-shopping-services.md
-- ---------------------------------------------------------------------
INSERT INTO units (id, course_id, sequence, title) VALUES
  ('unt_l2_m8', 'crs_level_2', 8, 'Module 8: Shopping & Services');

INSERT INTO learning_items (id, unit_id, sequence, kind, title, body) VALUES
('itm_l2_m8_overview', 'unt_l2_m8', 1, 'reading', 'Module Overview & Key Phrases',
'KEY PHRASES: Did you...? When did you...? Where did you buy it? -- I''m afraid there''s a problem with... -- Could I get a refund/replacement/exchange? -- I''d like to make a complaint. -- I understand your frustration. Let me see what I can do.

BrE / AmE NOTE: "receipt" is used in both varieties, but "till" (BrE, the checkout/cash register) vs. "register"/"checkout" (AmE); "queue" (BrE, a line of waiting people/to wait in line) vs. "line" (AmE) -- "stand in a queue" (BrE) vs. "stand in line" (AmE); "shop assistant" (BrE) vs. "sales associate/clerk" (AmE); "shopping trolley" (BrE) vs. "shopping cart" (AmE).

KEY VOCABULARY: shopping/service nouns (receipt, refund, replacement, exchange, warranty, faulty), complaint language (I''m afraid there''s a problem, this isn''t working properly, I''d like to speak to a manager), polite problem-solving responses (I understand, let me check, I can offer you...).'),

('itm_l2_m8_lesson1', 'unt_l2_m8', 2, 'reading', 'Lesson 8.1 -- Did You Buy It Here? -- Past Simple Questions',
'LEARNING OBJECTIVES: (1) form detailed past simple wh- and yes/no questions correctly (review and extension of Level I Module 7), (2) ask a sequence of questions to establish the facts of a purchase or problem, (3) use past simple questions in a service/shopping context specifically, (4) answer past simple questions with appropriate detail, not just short answers.

PREREQUISITE KNOWLEDGE: Level I, Module 7 (simple past, "Did you...?" questions).

WARM-UP (5 min): Your instructor asks 3 rapid "Did you...?" questions about yesterday before moving into the shopping-specific context.

PRESENTATION (10 min): "A: When did you buy this jacket? B: I bought it last week. A: Where did you buy it? B: I bought it online. A: Did you keep the receipt? B: Yes, I did -- here it is." This is the same "Did/did + subject + base verb" pattern from Level I, now used in a connected sequence to establish facts.

GUIDED PRACTICE (10 min): Pair work: Learner A plays a customer with a purchase problem (prompt card with details), Learner B asks 5 fact-finding past simple questions to understand the situation, then swap.

INDEPENDENT PRACTICE / SPEAKING ACTIVITY (10 min): Invent a purchase story (a real or realistic recent purchase) and answer a partner''s 5 fact-finding questions with full, detailed answers (not just "yes"/"no").

CRITICAL THINKING / DISCUSSION PROMPT: "Why do you think it''s useful to ask several specific questions, rather than one general one, when you''re trying to understand a problem?"

LISTENING ACTIVITY (5 min): Listen to a short fact-finding exchange (5-6 questions) about a purchase problem and complete a simple information-gathering form based on what''s said.

READING ACTIVITY (5 min): Read a short written complaint email and identify what past-simple facts it establishes (when, where, what happened).

WRITING TASK (5 min): Write 5 past simple questions you would ask if a friend told you they had a problem with something they bought.

PRONUNCIATION PRACTICE (5 min): Question intonation (rising for yes/no questions, falling for wh- questions) in a rapid sequence -- natural fact-finding speech moves through several questions quickly.

VOCABULARY REINFORCEMENT: a shopping/service vocabulary matching game (receipt, refund, replacement, exchange, warranty, faulty).

FORMATIVE ASSESSMENT: Instructor checks correct question formation across a connected sequence during guided practice.

HOMEWORK: Prepare a short "problem story" (4-5 facts about an invented purchase problem) ready for Lesson 8.2''s complaint roleplay.

REVISION: Lesson 8.2 opens with learners briefly sharing their homework problem story.

EXTENSION: Add one past continuous sentence to your problem story ("I was using it when it stopped working").'),

('itm_l2_m8_lesson2', 'unt_l2_m8', 3, 'reading', 'Lesson 8.2 -- I''d Like to Make a Complaint -- Handling Problems Politely',
'LEARNING OBJECTIVES: (1) make a complaint politely and clearly, (2) request a specific solution (refund/replacement/exchange), (3) respond professionally to a complaint if you''re the one handling it, (4) resolve a disagreement calmly using appropriate register.

PREREQUISITE KNOWLEDGE: Lesson 8.1 (past simple questions, shopping vocabulary), Level II Module 4 (polite disagreement language, recycled here in a service context).

WARM-UP (5 min): Your instructor models one blunt complaint ("This is broken! I want my money back!") and one polite version, asking you to identify the differences.

PRESENTATION (10 min): "Customer: Excuse me, I''d like to make a complaint. I bought this lamp last week, and it isn''t working properly. Assistant: I''m sorry to hear that. Let me take a look. I understand your frustration -- I can offer you a full refund or a replacement. Which would you prefer? Customer: I''ll take the refund, please." Two-sided skill highlighted: complaining politely (state the problem, no blame language) and handling a complaint professionally (acknowledge, apologise, offer a specific solution).

GUIDED PRACTICE (10 min): Pair work with roleplay cards: Learner A complains about one of 4 problem scenarios, Learner B (as staff) acknowledges, apologises, and offers a solution; swap roles after each scenario.

INDEPENDENT PRACTICE / SPEAKING ACTIVITY (10 min): Combine Lesson 8.1''s problem story with this lesson''s complaint language into a full roleplay (customer describes what happened using past simple questions/answers, then makes the complaint and requests a solution).

CRITICAL THINKING / DISCUSSION PROMPT: "What''s the difference between being assertive (clearly stating what you want) and being rude, when you''re making a complaint? Can you give an example of each?"

LISTENING ACTIVITY (5 min): Listen to 2 complaint-handling exchanges (one handled well, one handled poorly) and identify what made the difference.

READING ACTIVITY (5 min): Read a written complaint and a professional response, evaluating whether the response addresses the complaint appropriately.

WRITING TASK (5 min): Write a short polite complaint email (4-5 sentences) about a real or invented product/service problem, including a specific requested solution.

PRONUNCIATION PRACTICE (5 min): Calm, level intonation for complaint language (avoiding a sharp, accusatory pitch) versus the warmer, reassuring intonation appropriate to the "handling" role.

VOCABULARY REINFORCEMENT: a complaint/response phrase-matching game (problem statements matched to appropriate professional responses).

FORMATIVE ASSESSMENT: Instructor checks that complaints stay polite (no blame language) and that responses include acknowledgement + a specific solution, during the combined roleplay.

HOMEWORK: Finalise your combined complaint roleplay script for Module 8''s assignment.

REVISION: This lesson opens with the Lesson 8.1 problem-story sharing recap. Module 8''s Quiz and Assignment draw on both lessons.

EXTENSION: Add a follow-up negotiation ("Could I get a refund instead of store credit?") to your roleplay.'),

('itm_l2_m8_quiz', 'unt_l2_m8', 4, 'quiz', 'Module 8 Quiz -- Shopping & Services', NULL),

('itm_l2_m8_assignment', 'unt_l2_m8', 5, 'assignment', 'Module 8 Assignment -- Resolve a Service Problem',
'INSTRUCTIONS: Record yourself (or perform with a partner) a roleplay, 60-90 seconds, in which you play a customer with a problem with a product or service. Include: at least 2 past simple questions/answers establishing the facts (when, where, what happened); a polite complaint statement; a specific requested solution; and -- if working with a partner -- a professional response acknowledging the problem and offering a solution.

GRADING RUBRIC: (1) Grammatical accuracy -- correct past simple question formation, correct complaint/request structures. (2) Vocabulary range -- at least 3 distinct shopping/service words used correctly. (3) Task completion -- facts established, complaint made politely, a specific solution requested. (4) Communicative quality -- does the complaint stay assertive without being rude, and is the requested solution clear and reasonable?

A grade at or above the platform''s pass threshold marks this module complete.');

INSERT INTO quiz_questions (id, learning_item_id, sequence, prompt, choices_json, correct_index) VALUES
('qq_l2_m8_1', 'itm_l2_m8_quiz', 1, '"___ you buy this online?"', '["Do","Were","Have","Did"]', 3),
('qq_l2_m8_2', 'itm_l2_m8_quiz', 2, '"When ___ you buy it?"', '["do","did","does","were"]', 1),
('qq_l2_m8_3', 'itm_l2_m8_quiz', 3, '"I ___ it last week."', '["bought","buy","buys","buying"]', 0),
('qq_l2_m8_4', 'itm_l2_m8_quiz', 4, '"I''d like to make a ___."', '["complain","complaining","complaint","complained"]', 2),
('qq_l2_m8_5', 'itm_l2_m8_quiz', 5, '"Could I ___ a refund, please?"', '["getting","get","got","gets"]', 1),
('qq_l2_m8_6', 'itm_l2_m8_quiz', 6, 'In British English, the checkout is often called the:', '["register","counter","desk","till"]', 3),
('qq_l2_m8_7', 'itm_l2_m8_quiz', 7, '"I''m sorry to hear that. ___ me take a look."', '["Lets","Letting","Let","Left"]', 2),
('qq_l2_m8_8', 'itm_l2_m8_quiz', 8, 'Which is the more polite complaint opener?', '["Excuse me, I''d like to make a complaint.","This is broken!","I want my money back.","This doesn''t work!"]', 0),
('qq_l2_m8_9', 'itm_l2_m8_quiz', 9, '"In British English, you stand in a ___; in American English, you stand in a line."', '["queue","row","column","rank"]', 0),
('qq_l2_m8_10', 'itm_l2_m8_quiz', 10, '"I understand your ___ -- let me help."', '["frustrated","frustrating","frustration","frustrate"]', 2);

-- ---------------------------------------------------------------------
-- Module 9: Telling Stories
-- Full prose version: docs/curriculum/level-2/module-09-telling-stories.md
-- ---------------------------------------------------------------------
INSERT INTO units (id, course_id, sequence, title) VALUES
  ('unt_l2_m9', 'crs_level_2', 9, 'Module 9: Telling Stories');

INSERT INTO learning_items (id, unit_id, sequence, kind, title, body) VALUES
('itm_l2_m9_overview', 'unt_l2_m9', 1, 'reading', 'Module Overview & Key Phrases',
'KEY PHRASES: First.../After that.../Then... -- Suddenly.../All of a sudden... -- In the end.../Finally... -- You''ll never believe what happened! -- Guess what happened next...

BrE / AmE NOTE: narrative connectors are almost entirely shared between British and American English, but one small, useful difference: British speakers often say "at the weekend" when placing a story in time ("It happened at the weekend"), while American speakers say "on the weekend" -- the same pattern first introduced with scheduling language in Module 5, now recycled in a storytelling context.

KEY VOCABULARY: sequencing connectors (first, after that, next, then, suddenly, all of a sudden, eventually, in the end, finally), narrative-shape vocabulary (a hook/opening line, a turning point, a problem, a resolution), reaction language for listeners (No way! What happened next? That''s amazing!).'),

('itm_l2_m9_lesson1', 'unt_l2_m9', 2, 'reading', 'Lesson 9.1 -- First... Then... Suddenly... -- Sequencing a Story',
'LEARNING OBJECTIVES: (1) use a full range of sequencing connectors to order events clearly, (2) combine past simple (main events) and past continuous (background/interrupted action) correctly within a single connected narrative, (3) use "suddenly"/"all of a sudden" specifically to mark an unexpected interruption to the background action, (4) tell a short story (5-6 sentences) with clear, correctly sequenced structure.

PREREQUISITE KNOWLEDGE: Level II, Module 1 (past simple vs. past continuous, taught with isolated example sentences -- this lesson extends that grammar into connected, multi-sentence narrative).

WARM-UP (5 min): Your instructor tells a very short story about their own day using 3 different sequencing connectors; identify the connectors you heard.

PRESENTATION (10 min): "First, I left the house at 8am. After that, I walked to the station. I was waiting for my train when suddenly, I realised I''d forgotten my phone. In the end, I went back home to get it, and I was late for work." Sequencing connectors carry the story''s main timeline forward, while past continuous sets up background action that "suddenly" then interrupts.

GUIDED PRACTICE (10 min): You are given 6 jumbled story sentences and reorder them using the sequencing connectors as clues, then read the story aloud.

INDEPENDENT PRACTICE / SPEAKING ACTIVITY (10 min): Write a short 5-6 sentence story about a real or invented minor mishap, using at least 4 different sequencing connectors and at least one past continuous "interrupted action" sentence. Then tell it to a partner from memory, who listens for and names the connectors used.

CRITICAL THINKING / DISCUSSION PROMPT: "Why do you think the word ''suddenly'' makes a story more interesting to listen to? What would the story feel like without it?"

LISTENING ACTIVITY (5 min): Listen to a short narrated story (7-8 sentences) and number a set of 6 picture panels in the correct order based on the sequencing connectors used.

READING ACTIVITY (5 min): Read a short written anecdote and underline every sequencing connector used, then identify which sentences use past continuous and why.

WRITING TASK (5 min): Rewrite 4 unconnected simple sentences ("I woke up late. I missed the bus. I ran to the station. I caught the train.") into a connected short narrative using sequencing connectors.

PRONUNCIATION PRACTICE (5 min): Sentence stress on key sequencing connectors at the start of a sentence ("SUDDenly...", "FINally...") and the natural pause that typically follows them.

VOCABULARY REINFORCEMENT: a sequencing-connector ordering game -- arrange 9 connector cards along a rough "early story" to "late story" timeline.

FORMATIVE ASSESSMENT: Instructor checks correct connector variety and correct past continuous "interruption" formation during independent practice.

HOMEWORK: Choose one real memorable event from your own life and jot down 5-6 rough notes on what happened, in order, ready for Lesson 9.2.

REVISION: Lesson 9.2 opens with learners briefly retelling their homework story notes in rough form, before refining them.

EXTENSION: Add a second past continuous "interrupted action" sentence to your mishap story, using a different interrupting connector ("just as").'),

('itm_l2_m9_lesson2', 'unt_l2_m9', 3, 'reading', 'Lesson 9.2 -- You''ll Never Believe What Happened -- Telling an Engaging Story',
'LEARNING OBJECTIVES: (1) open a story with a "hook" that creates listener interest, (2) identify and narrate a clear turning point or problem within a story, (3) close a story with a satisfying resolution, (4) use listener-reaction language appropriately when someone else is telling a story.

PREREQUISITE KNOWLEDGE: Lesson 9.1 (sequencing connectors, past simple/continuous narrative).

WARM-UP (5 min): Your instructor tells the same short story twice -- once flat with no hook or shape, once shaped with a hook and a turning point. Compare which version you''d rather listen to and why.

PRESENTATION (10 min): The three-part narrative shape: a HOOK ("You''ll never believe what happened..." / "So this is a funny story...") to open; a TURNING POINT OR PROBLEM (what went wrong, what was surprising) as the middle; a RESOLUTION ("In the end..." / "Finally...") to close. Listener-reaction phrases (No way! What happened next? That''s amazing! Oh no, really?) -- a good storyteller pauses to let a listener react.

GUIDED PRACTICE (10 min): Pair work: Learner A retells their Lesson 9.1 homework story using the full hook -> turning point -> resolution shape; Learner B listens actively, using at least 3 different reaction phrases at natural points, then swap.

INDEPENDENT PRACTICE / SPEAKING ACTIVITY (10 min): Revise your homework story notes into a fully shaped short story (a hook, a clear turning point, a resolution) and rehearse telling it once more before the final speaking activity. Then tell your fully shaped personal story to a new partner or small group, who reacts naturally throughout.

CRITICAL THINKING / DISCUSSION PROMPT: "Think of a story someone has told you that you still remember well. What made it memorable -- the events themselves, or the way it was told?"

LISTENING ACTIVITY (5 min): Listen to a well-told short personal anecdote and identify its hook, turning point, and resolution.

READING ACTIVITY (5 min): Read a short written personal story (a blog-style anecdote) and label its hook, turning point, and resolution.

WRITING TASK (5 min): Write a strong one-sentence "hook" opener for 3 different story ideas (a travel mishap, a surprising meeting, a lucky coincidence).

PRONUNCIATION PRACTICE (5 min): Natural, animated intonation for storytelling hooks and reaction phrases ("No WAY!", "What happened NEXT?") -- a noticeably more expressive pitch range than neutral statement intonation.

VOCABULARY REINFORCEMENT: a hook-writing challenge -- compare hooks for the same story prompt and vote on which is most engaging.

FORMATIVE ASSESSMENT: Instructor checks for a genuine three-part shape and appropriate listener reactions during the speaking activity.

HOMEWORK: Finalise your personal story (hook, turning point, resolution, correct sequencing and past simple/continuous use) for Module 9''s assignment.

REVISION: This lesson opens with the Lesson 9.1 homework-story recap. Module 9''s Quiz and Assignment draw on both lessons.

EXTENSION: Add one moment of reported speech to your story ("She said, ''I can''t believe it!''") as a recognition-only preview, formally taught in a later level.'),

('itm_l2_m9_quiz', 'unt_l2_m9', 4, 'quiz', 'Module 9 Quiz -- Telling Stories', NULL),

('itm_l2_m9_assignment', 'unt_l2_m9', 5, 'assignment', 'Module 9 Assignment -- Tell Me a Story',
'INSTRUCTIONS: Record yourself (or perform live) telling a real or realistic personal story, 60-90 seconds long. Your story must include: a clear hook to open; at least 4 different sequencing connectors; at least one past continuous sentence interrupted by a past simple event using "suddenly" or "all of a sudden"; a clear turning point or problem; and a resolution to close.

GRADING RUBRIC: (1) Grammatical accuracy -- correct past simple/past continuous combination, correct sequencing connector use. (2) Vocabulary range -- at least 4 different sequencing connectors used correctly and without excessive repetition of any single one. (3) Task completion -- hook, turning point, and resolution all clearly present, forming a genuine three-part narrative shape. (4) Communicative quality -- is the story genuinely engaging to listen to, and does it flow as connected discourse rather than a list of disconnected sentences?

A grade at or above the platform''s pass threshold marks this module complete.');

INSERT INTO quiz_questions (id, learning_item_id, sequence, prompt, choices_json, correct_index) VALUES
('qq_l2_m9_1', 'itm_l2_m9_quiz', 1, '"___, I left the house at 8am." (the very first event)', '["First","Finally","Suddenly","Eventually"]', 0),
('qq_l2_m9_2', 'itm_l2_m9_quiz', 2, '"I was waiting for the bus when ___ it started to rain."', '["first","after that","suddenly","finally"]', 2),
('qq_l2_m9_3', 'itm_l2_m9_quiz', 3, '"I ___ waiting for the train when I realised I''d forgotten my phone." (background action)', '["am","was","were","is"]', 1),
('qq_l2_m9_4', 'itm_l2_m9_quiz', 4, '"___, everything worked out fine." (the closing event)', '["First","Then","Suddenly","In the end"]', 3),
('qq_l2_m9_5', 'itm_l2_m9_quiz', 5, 'Which word usually signals an unexpected interruption to a story?', '["after that","next","suddenly","finally"]', 2),
('qq_l2_m9_6', 'itm_l2_m9_quiz', 6, '"You''ll ___ believe what happened!"', '["never","not","no","any"]', 0),
('qq_l2_m9_7', 'itm_l2_m9_quiz', 7, 'Which is a good example of a storytelling "hook"?', '["I went shopping yesterday.","I bought a shirt.","Then I went home.","You''ll never believe what happened at the shopping centre!"]', 3),
('qq_l2_m9_8', 'itm_l2_m9_quiz', 8, 'Which is an appropriate listener-reaction phrase?', '["I don''t care.","That''s amazing!","Stop talking.","That''s not true."]', 1),
('qq_l2_m9_9', 'itm_l2_m9_quiz', 9, '"In British English, something might happen ___ the weekend."', '["in","at","on","for"]', 1),
('qq_l2_m9_10', 'itm_l2_m9_quiz', 10, 'Which sentence correctly combines past continuous and past simple?', '["I was walk home when it started to rain.","I walk home when it was starting to rain.","I am walking home when it started to rain.","I was walking home when it started to rain."]', 3);

-- ---------------------------------------------------------------------
-- Module 10: Review & Consolidation (Elementary-Level Mock Exam)
-- Full prose version: docs/curriculum/level-2/module-10-review-consolidation.md
-- ---------------------------------------------------------------------
INSERT INTO units (id, course_id, sequence, title) VALUES
  ('unt_l2_m10', 'crs_level_2', 10, 'Module 10: Review & Consolidation');

INSERT INTO learning_items (id, unit_id, sequence, kind, title, body) VALUES
('itm_l2_m10_revguide', 'unt_l2_m10', 1, 'reading', 'Level II Revision Guide',
'MODULE 1 -- LIFE STORIES: past simple vs. past continuous, "used to"; biography/life-event vocabulary, time-sequencing connectors.

MODULE 2 -- TRAVEL & TRANSPORT: comparatives/superlatives; travel, transport, booking vocabulary.

MODULE 3 -- WORK & STUDY: present continuous (current) vs. present simple (habit); jobs, workplace, study vocabulary.

MODULE 4 -- LIKES, DISLIKES & OPINIONS: gerunds after opinion verbs, "prefer...to...", "would rather"; opinion/preference language, polite agreement/disagreement.

MODULE 5 -- MAKING PLANS: "will" vs. "going to" vs. present continuous for future; invitations, arrangements, polite refusal.

MODULE 6 -- HOMES & NEIGHBOURHOODS: "there was/were", "used to be", comparatives recycled, precise prepositions of place; housing, neighbourhood vocabulary.

MODULE 7 -- FOOD, HEALTH & HABITS: adverbs of frequency, extended "should/shouldn''t" (should really, ''d better, if I were you, I''d); lifestyle, health vocabulary.

MODULE 8 -- SHOPPING & SERVICES: past simple questions extended to fact-finding sequences, polite complaint language; shopping, services, money vocabulary.

MODULE 9 -- TELLING STORIES: sequencing connectors, past simple/past continuous combined in connected narrative; storytelling vocabulary, narrative shape (hook, turning point, resolution).

STRUCTURAL THREAD ACROSS THE LEVEL: Level II took Level I''s isolated single-structure grammar and put it to real communicative work -- contrasting structures against each other in the same lesson, extending short exchanges into connected sequences and full narratives, and adding a genuine critical-thinking and intercultural layer that Level I''s more foundational scope did not yet require. Module 10 tests all of it together, not in isolation.

CUMULATIVE BrE/AmE REFERENCE (all differences introduced this level): flat/apartment, ground floor/first floor (Module 6); till/register or checkout, queue/line, shop assistant/sales associate, shopping trolley/shopping cart (Module 8); chips/fries, crisps/chips, biscuit/cookie, sweets/candy, courgette/zucchini, aubergine/eggplant (Module 7); "Shall we...?"/"How about we...?", free at the weekend/free this weekend (Module 5); at the weekend/on the weekend (Module 9); opinion-softening register ("I''d say.../I suppose..." vs. "I feel like...", Module 4).'),

('itm_l2_m10_revlesson', 'unt_l2_m10', 2, 'reading', 'Revision Lesson -- Structured Consolidation Activities',
'LEARNING OBJECTIVES: (1) correctly select the right grammar structure from Modules 1-9 given a real-use context, (2) recall and use at least 60 headwords from across the level''s vocabulary sets, (3) correctly identify at least 6 BrE/AmE vocabulary pairs from across the level, (4) self-identify at least one personal area needing further revision before the mock exam.

PREREQUISITE KNOWLEDGE: All of Modules 1-9.

WARM-UP (5 min): "Grammar auction" -- bid points on whether 6 example sentences (each drawn from a different module) are grammatically correct or incorrect.

PRESENTATION/CONSOLIDATION (15 min): A structure-selection drill: real-life prompts, each requiring a different module''s grammar to answer correctly ("Tell me about a memorable event from your past" -> Module 9; "What are your plans for next weekend?" -> Module 5; "What do you think about working from home?" -> Module 4) -- choosing the right tool for the task.

GUIDED PRACTICE (15 min): Rotate through 4 stations (pairs or small groups), each reviewing 2-3 modules'' target language through a quick game or short speaking prompt, plus a final "Tell a quick story" cumulative station drawing on Module 9.

INDEPENDENT PRACTICE (10 min): Complete a self-assessment checklist (one line per module: "I can... check/needs practice") and circle your two weakest areas.

SPEAKING ACTIVITY: The structure-selection drill and station rotation above are both fundamentally speaking-driven.

CRITICAL THINKING / DISCUSSION PROMPT: "Across this whole level, which topic did you find easiest to talk about, and which did you find hardest? What made the difference -- the grammar, the vocabulary, or the topic itself?"

LISTENING ACTIVITY (5 min): Listen to a single extended monologue (someone narrating a memorable past event, describing their job, giving an opinion on a topic, and mentioning weekend plans).

READING ACTIVITY (5 min): Read a similarly cumulative short text and answer mixed comprehension questions spanning several grammar points and at least one BrE/AmE vocabulary item.

WRITING TASK (5 min): Write one paragraph (6+ sentences) that uses at least 4 different grammar points from across the level.

PRONUNCIATION PRACTICE (5 min): Rapid-fire review drill of the level''s key pronunciation points: weak-form "was/were", sentence stress on frequency adverbs, question intonation sequences, storytelling intonation.

VOCABULARY REINFORCEMENT: a cumulative vocabulary relay game covering all 9 modules'' word sets, including a dedicated BrE/AmE matching round.

FORMATIVE ASSESSMENT: The self-assessment checklist above, reviewed individually with the instructor if time allows.

HOMEWORK: Revise your self-identified weak areas using the module you struggled with most.

REVISION: This entire lesson is revision by design.

EXTENSION: Stronger learners help peers at weaker stations during the rotation activity.'),

('itm_l2_m10_examquiz', 'unt_l2_m10', 3, 'quiz', 'Elementary-Level Mock Exam -- Grammar & Vocabulary', NULL),

('itm_l2_m10_examassignment', 'unt_l2_m10', 4, 'assignment', 'Elementary-Level Mock Exam -- Speaking & Writing',
'This is your Level II final assessment. Complete both parts.

PART A -- SPEAKING (3-4 minutes, recorded or live with your instructor): Give an extended talk covering: a memorable past event, narrated with sequencing connectors and at least one past simple/past continuous combination (Modules 1 and 9); a comparison between two places you know, using comparatives or superlatives (Module 2); your current job or studies compared with your general routine (Module 3); your opinion on one topic of your choice, with a reason (Module 4); one plan for the near future (Module 5); and a piece of lifestyle advice you''d give a friend (Module 7). Respond to at least one follow-up question from your instructor, and use at least one BrE/AmE vocabulary item correctly and appropriately for the variety you are using.

PART B -- WRITING (12-15 sentences): Write a personal email to a friend covering: a description of your neighbourhood, then and now, using "there was/were" and "there is/are" (Module 6); a short complaint-and-resolution story about a shopping or service problem, using past simple questions and polite complaint language (Module 8); an invitation to meet up, including a specific day, time, and place (Module 5); and a closing paragraph reflecting on what you''re most looking forward to.

GRADING RUBRIC (weighted toward listening and speaking per the Elementary-level assessment strategy): (1) Grammatical range and accuracy -- correct, varied use of the level''s grammar points across both parts. (2) Vocabulary range -- words drawn from at least 6 of the 9 modules across both parts combined, including at least one correctly used BrE/AmE item. (3) Task completion -- every required element present in both Part A and Part B. (4) Fluency and delivery (Part A) -- reasonably fluent for A2, audible, able to respond to an unscripted follow-up question. (5) Coherence (Part B) -- the email reads as one connected personal message with clear paragraph-level organisation. (6) Communicative quality -- is the content genuinely specific and personal, consistent with the "communicative quality" criterion introduced across Level II''s module assignments.

PROGRESSION REQUIREMENT: A grade at or above the platform''s pass threshold on this comprehensive assessment marks Level II as complete for the learner and, for a full-programme student, triggers Level III''s enrolment to unlock automatically.');

INSERT INTO quiz_questions (id, learning_item_id, sequence, prompt, choices_json, correct_index) VALUES
('qq_l2_m10_1', 'itm_l2_m10_examquiz', 1, '(Module 1) "I ___ TV when the phone rang."', '["watch","was watching","watched","am watching"]', 1),
('qq_l2_m10_2', 'itm_l2_m10_examquiz', 2, '(Module 1) "I ___ play football every weekend when I was a child."', '["use to","am used to","was using to","used to"]', 3),
('qq_l2_m10_3', 'itm_l2_m10_examquiz', 3, '(Module 2) "This hotel is ___ than the last one we stayed in."', '["comfortable","most comfortable","more comfortable","comfortabler"]', 2),
('qq_l2_m10_4', 'itm_l2_m10_examquiz', 4, '(Module 2) "This is the ___ flight of the three."', '["cheapest","cheaper","more cheap","most cheap"]', 0),
('qq_l2_m10_5', 'itm_l2_m10_examquiz', 5, '(Module 3) "She ___ for a new job at the moment."', '["looks","look","looked","is looking"]', 3),
('qq_l2_m10_6', 'itm_l2_m10_examquiz', 6, '(Module 3) "He ___ to the gym every Tuesday." (a routine)', '["is going","goes","go","going"]', 1),
('qq_l2_m10_7', 'itm_l2_m10_examquiz', 7, '(Module 4) "I really enjoy ___ new languages."', '["learning","learn","to learning","learns"]', 0),
('qq_l2_m10_8', 'itm_l2_m10_examquiz', 8, '(Module 4) "I''d ___ stay home than go out tonight."', '["prefer","like","rather","want"]', 2),
('qq_l2_m10_9', 'itm_l2_m10_examquiz', 9, '(Module 5) "I ___ visit my parents this weekend." (already decided)', '["will visit","visit","am going to visit","am visit"]', 2),
('qq_l2_m10_10', 'itm_l2_m10_examquiz', 10, '(Module 5) "I''m afraid I can''t -- I already ___ plans."', '["have","has","having","had"]', 0),
('qq_l2_m10_11', 'itm_l2_m10_examquiz', 11, '(Module 6) "There ___ a cinema here, but it closed."', '["is","used to be","are","uses to be"]', 1),
('qq_l2_m10_12', 'itm_l2_m10_examquiz', 12, '(Module 6) "The shop is ___ walking distance of my flat."', '["at","in","on","within"]', 3),
('qq_l2_m10_13', 'itm_l2_m10_examquiz', 13, '(Module 7) "I am ___ tired in the morning." (frequency + "to be")', '["always","am always","always am","usual"]', 0),
('qq_l2_m10_14', 'itm_l2_m10_examquiz', 14, '(Module 7) "You ___ better see a doctor."', '["have","should","had","would"]', 2),
('qq_l2_m10_15', 'itm_l2_m10_examquiz', 15, '(Module 8) "___ you buy this online?"', '["Do","Were","Have","Did"]', 3),
('qq_l2_m10_16', 'itm_l2_m10_examquiz', 16, '(Module 8) "I''d like to make a ___."', '["complain","complaint","complaining","complained"]', 1),
('qq_l2_m10_17', 'itm_l2_m10_examquiz', 17, '(Module 9) "I ___ waiting for the train when suddenly, I realised I''d forgotten my phone."', '["am","was","were","is"]', 1),
('qq_l2_m10_18', 'itm_l2_m10_examquiz', 18, '(Module 9) Which word usually signals an unexpected interruption to a story?', '["after that","next","finally","suddenly"]', 3),
('qq_l2_m10_19', 'itm_l2_m10_examquiz', 19, '(Cumulative BrE/AmE) In British English, "chips" usually means the same as the American word:', '["crisps","cookies","fries","candy"]', 2),
('qq_l2_m10_20', 'itm_l2_m10_examquiz', 20, '(Cumulative BrE/AmE) In American English, the ___ floor is at street level.', '["first","ground","second","lobby"]', 0);
