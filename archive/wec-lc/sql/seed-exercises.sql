-- ─────────────────────────────────────────────────────────────────────
-- EXERCISE MATERIALS — Levels I and II (first authoring pass)
--
-- Fifty practice stages in this programme hand the learner something
-- that did not exist: sentence pairs, jumbled paragraphs, prompt cards,
-- source excerpts, "a provided paragraph". Until this file, every one
-- of those was an instruction pointing at nothing. A learner working
-- alone met a task they could not begin; a teacher invented the items
-- before every class, differently each time.
--
-- This is the first pass: the ten sets in Levels I and II, taken first
-- because beginners are the least able to improvise the missing
-- material and the most numerous.
--
-- EVERY SET IS press_drafted. These are curriculum, drafted by the
-- Press to fill a gap the Press measured. The College has no appointed
-- academic body, so nothing here can be academically approved yet, and
-- the approval state says so rather than being assumed. Where a set
-- replaces a PICTURE the curriculum asks for, the frames are described
-- in words a teacher can draw or project — the illustration itself
-- remains outstanding and is recorded as such.
-- ─────────────────────────────────────────────────────────────────────

INSERT INTO exercise_sets (id, learning_item_id, stage, brief, kind) VALUES
  ('exs_l1_m7_l1_guided', 'itm_l1_m7_lesson1', 'guided', 'Given a picture sequence of someone''s yesterday, build 5 sentences together using regular past verbs.', 'sequence');
INSERT INTO exercise_items (id, exercise_set_id, sequence, prompt, answer, note) VALUES
  ('exs_l1_m7_l1_guided_1', 'exs_l1_m7_l1_guided', 1, 'Frame 1 — a woman closes her laptop at a desk; a wall clock reads 6 p.m.', 'She finished work at six o''clock.', 'Target verb: finish'),
  ('exs_l1_m7_l1_guided_2', 'exs_l1_m7_l1_guided', 2, 'Frame 2 — the same woman walks to a bus stop carrying a bag.', 'She walked to the bus stop.', 'Target verb: walk'),
  ('exs_l1_m7_l1_guided_3', 'exs_l1_m7_l1_guided', 3, 'Frame 3 — she waits at the stop; the timetable shows a ten-minute gap.', 'She waited ten minutes for the bus.', 'Target verb: wait'),
  ('exs_l1_m7_l1_guided_4', 'exs_l1_m7_l1_guided', 4, 'Frame 4 — at home, she cooks at a stove with vegetables on the counter.', 'She cooked dinner at home.', 'Target verb: cook'),
  ('exs_l1_m7_l1_guided_5', 'exs_l1_m7_l1_guided', 5, 'Frame 5 — she sits on a sofa watching television; the clock reads 9 p.m.', 'She watched television until nine o''clock.', 'Target verb: watch');

INSERT INTO exercise_sets (id, learning_item_id, stage, brief, kind) VALUES
  ('exs_l2_m1_l1_guided', 'itm_l2_m1_lesson1', 'guided', 'Given 6 sentence-halves (3 background, 3 event), match them into 3 logical combined sentences using when/while.', 'matching');
INSERT INTO exercise_items (id, exercise_set_id, sequence, prompt, answer, note) VALUES
  ('exs_l2_m1_l1_guided_1', 'exs_l2_m1_l1_guided', 1, 'BACKGROUND A — I was waiting for the train', 'Combines with EVENT 2.', 'Background half'),
  ('exs_l2_m1_l1_guided_2', 'exs_l2_m1_l1_guided', 2, 'BACKGROUND B — My sister was cooking dinner', 'Combines with EVENT 3.', 'Background half'),
  ('exs_l2_m1_l1_guided_3', 'exs_l2_m1_l1_guided', 3, 'BACKGROUND C — We were walking home from the cinema', 'Combines with EVENT 1.', 'Background half'),
  ('exs_l2_m1_l1_guided_4', 'exs_l2_m1_l1_guided', 4, 'EVENT 1 — it started to rain heavily', 'While we were walking home from the cinema, it started to rain heavily.', 'Event half'),
  ('exs_l2_m1_l1_guided_5', 'exs_l2_m1_l1_guided', 5, 'EVENT 2 — I saw an old school friend on the platform', 'While I was waiting for the train, I saw an old school friend on the platform.', 'Event half'),
  ('exs_l2_m1_l1_guided_6', 'exs_l2_m1_l1_guided', 6, 'EVENT 3 — the smoke alarm went off', 'My sister was cooking dinner when the smoke alarm went off.', 'Event half');

INSERT INTO exercise_sets (id, learning_item_id, stage, brief, kind) VALUES
  ('exs_l2_m1_l2_guided', 'itm_l2_m1_lesson2', 'guided', 'Given 6 "then" prompts (a childhood habit/state), build "used to" sentences, then add a contrasting "now" sentence using present simple.', 'cards');
INSERT INTO exercise_items (id, exercise_set_id, sequence, prompt, answer, note) VALUES
  ('exs_l2_m1_l2_guided_1', 'exs_l2_m1_l2_guided', 1, 'walk to school every day', 'I used to walk to school every day. Now I take the bus.', NULL),
  ('exs_l2_m1_l2_guided_2', 'exs_l2_m1_l2_guided', 2, 'be afraid of dogs', 'I used to be afraid of dogs. Now I have one.', 'State, not habit: ''be'' takes ''used to be''.'),
  ('exs_l2_m1_l2_guided_3', 'exs_l2_m1_l2_guided', 3, 'watch cartoons on Saturday mornings', 'I used to watch cartoons on Saturday mornings. Now I watch the news.', NULL),
  ('exs_l2_m1_l2_guided_4', 'exs_l2_m1_l2_guided', 4, 'live in a small village', 'I used to live in a small village. Now I live in a city.', NULL),
  ('exs_l2_m1_l2_guided_5', 'exs_l2_m1_l2_guided', 5, 'hate vegetables', 'I used to hate vegetables. Now I eat them every day.', NULL),
  ('exs_l2_m1_l2_guided_6', 'exs_l2_m1_l2_guided', 6, 'play football after school', 'I used to play football after school. Now I go to the gym.', NULL);

INSERT INTO exercise_sets (id, learning_item_id, stage, brief, kind) VALUES
  ('exs_l2_m3_l1_guided', 'itm_l2_m3_lesson1', 'guided', 'Sort 10 sentence prompts into "routine" and "right now/temporary", then complete each with the correct form.', 'sorting');
INSERT INTO exercise_items (id, exercise_set_id, sequence, prompt, answer, note) VALUES
  ('exs_l2_m3_l1_guided_1', 'exs_l2_m3_l1_guided', 1, 'My brother ______ (work) in a bank.', 'works — routine', 'Routine'),
  ('exs_l2_m3_l1_guided_2', 'exs_l2_m3_l1_guided', 2, 'Be quiet — the baby ______ (sleep).', 'is sleeping — right now', 'Right now'),
  ('exs_l2_m3_l1_guided_3', 'exs_l2_m3_l1_guided', 3, 'I usually ______ (start) work at nine.', 'start — routine', 'Routine'),
  ('exs_l2_m3_l1_guided_4', 'exs_l2_m3_l1_guided', 4, 'This month I ______ (study) for my exams.', 'am studying — temporary', 'Temporary'),
  ('exs_l2_m3_l1_guided_5', 'exs_l2_m3_l1_guided', 5, 'Water ______ (boil) at 100 degrees.', 'boils — routine (general truth)', 'Routine'),
  ('exs_l2_m3_l1_guided_6', 'exs_l2_m3_l1_guided', 6, 'Look — it ______ (rain) again.', 'is raining — right now', 'Right now'),
  ('exs_l2_m3_l1_guided_7', 'exs_l2_m3_l1_guided', 7, 'She ______ (not/eat) meat.', 'does not eat — routine', 'Routine'),
  ('exs_l2_m3_l1_guided_8', 'exs_l2_m3_l1_guided', 8, 'They ______ (stay) with friends until their flat is ready.', 'are staying — temporary', 'Temporary'),
  ('exs_l2_m3_l1_guided_9', 'exs_l2_m3_l1_guided', 9, 'The shop ______ (open) at eight every morning.', 'opens — routine', 'Routine'),
  ('exs_l2_m3_l1_guided_10', 'exs_l2_m3_l1_guided', 10, 'Why ______ you ______ (wear) a coat? It is warm today.', 'are you wearing — right now', 'Right now');

INSERT INTO exercise_sets (id, learning_item_id, stage, brief, kind) VALUES
  ('exs_l2_m4_l1_guided', 'itm_l2_m4_lesson1', 'guided', 'Given a "like scale" (love/like/don''t mind/dislike/hate) and 8 activity pictures, build one true sentence per activity using the correct level.', 'cards');
INSERT INTO exercise_items (id, exercise_set_id, sequence, prompt, answer, note) VALUES
  ('exs_l2_m4_l1_guided_1', 'exs_l2_m4_l1_guided', 1, 'cooking at home', NULL, 'The learner''s own answer. Model: I like cooking at home.'),
  ('exs_l2_m4_l1_guided_2', 'exs_l2_m4_l1_guided', 2, 'waiting in queues', NULL, 'Model: I hate waiting in queues.'),
  ('exs_l2_m4_l1_guided_3', 'exs_l2_m4_l1_guided', 3, 'getting up early', NULL, 'Model: I don''t mind getting up early.'),
  ('exs_l2_m4_l1_guided_4', 'exs_l2_m4_l1_guided', 4, 'travelling by plane', NULL, 'Model: I love travelling by plane.'),
  ('exs_l2_m4_l1_guided_5', 'exs_l2_m4_l1_guided', 5, 'doing housework', NULL, 'Model: I dislike doing housework.'),
  ('exs_l2_m4_l1_guided_6', 'exs_l2_m4_l1_guided', 6, 'watching sport on television', NULL, 'Model: I don''t mind watching sport on television.'),
  ('exs_l2_m4_l1_guided_7', 'exs_l2_m4_l1_guided', 7, 'meeting new people', NULL, 'Model: I love meeting new people.'),
  ('exs_l2_m4_l1_guided_8', 'exs_l2_m4_l1_guided', 8, 'shopping for clothes', NULL, 'Model: I like shopping for clothes.');

INSERT INTO exercise_sets (id, learning_item_id, stage, brief, kind) VALUES
  ('exs_l2_m4_l2_guided', 'itm_l2_m4_lesson2', 'guided', 'Given 5 mild opinion prompts, practise stating an opinion, then politely agreeing or disagreeing with a partner''s response.', 'cards');
INSERT INTO exercise_items (id, exercise_set_id, sequence, prompt, answer, note) VALUES
  ('exs_l2_m4_l2_guided_1', 'exs_l2_m4_l2_guided', 1, 'Cities are better places to live than villages.', NULL, 'Agree: I think so too, because... / Disagree: I see what you mean, but...'),
  ('exs_l2_m4_l2_guided_2', 'exs_l2_m4_l2_guided', 2, 'Learning a language is easier for children than for adults.', NULL, NULL),
  ('exs_l2_m4_l2_guided_3', 'exs_l2_m4_l2_guided', 3, 'Public transport should be free.', NULL, NULL),
  ('exs_l2_m4_l2_guided_4', 'exs_l2_m4_l2_guided', 4, 'Working from home is better than working in an office.', NULL, NULL),
  ('exs_l2_m4_l2_guided_5', 'exs_l2_m4_l2_guided', 5, 'It is better to travel alone than with friends.', NULL, NULL);

INSERT INTO exercise_sets (id, learning_item_id, stage, brief, kind) VALUES
  ('exs_l2_m6_l1_guided', 'itm_l2_m6_lesson1', 'guided', 'Given a "then" picture of an old neighbourhood, describe it using there was/were, then compare with a "now" picture using there is/are.', 'sequence');
INSERT INTO exercise_items (id, exercise_set_id, sequence, prompt, answer, note) VALUES
  ('exs_l2_m6_l1_guided_1', 'exs_l2_m6_l1_guided', 1, 'THEN (1985) — a narrow street with a bakery, a butcher, two small houses, a red telephone box, and no cars.', 'There was a bakery on the corner. There were two small houses next to it. There was a telephone box outside the butcher''s.', 'Describe with there was/were.'),
  ('exs_l2_m6_l1_guided_2', 'exs_l2_m6_l1_guided', 2, 'NOW (today) — the same street with a supermarket, a coffee shop, four flats, a bus stop, and cars parked along both sides.', 'There is a supermarket where the bakery was. There are four flats instead of the two houses. There is a bus stop, and there are cars on both sides.', 'Describe with there is/are, then compare the two.');

INSERT INTO exercise_sets (id, learning_item_id, stage, brief, kind) VALUES
  ('exs_l2_m6_l2_guided', 'itm_l2_m6_lesson2', 'guided', 'Given a "city vs. countryside" chart, complete it with one advantage and one disadvantage of each, using target vocabulary and comparatives.', 'sorting');
INSERT INTO exercise_items (id, exercise_set_id, sequence, prompt, answer, note) VALUES
  ('exs_l2_m6_l2_guided_1', 'exs_l2_m6_l2_guided', 1, 'CITY — advantage', NULL, 'Model: There are more job opportunities in the city than in the countryside.'),
  ('exs_l2_m6_l2_guided_2', 'exs_l2_m6_l2_guided', 2, 'CITY — disadvantage', NULL, 'Model: The city is noisier and more expensive than the countryside.'),
  ('exs_l2_m6_l2_guided_3', 'exs_l2_m6_l2_guided', 3, 'COUNTRYSIDE — advantage', NULL, 'Model: The countryside is quieter and the air is cleaner.'),
  ('exs_l2_m6_l2_guided_4', 'exs_l2_m6_l2_guided', 4, 'COUNTRYSIDE — disadvantage', NULL, 'Model: There are fewer buses, so it is harder to travel without a car.');

INSERT INTO exercise_sets (id, learning_item_id, stage, brief, kind) VALUES
  ('exs_l2_m7_l1_guided', 'itm_l2_m7_lesson1', 'guided', 'Complete 8 sentences with the correct frequency adverb based on a percentage/frequency prompt, then check correct word order placement.', 'gapped');
INSERT INTO exercise_items (id, exercise_set_id, sequence, prompt, answer, note) VALUES
  ('exs_l2_m7_l1_guided_1', 'exs_l2_m7_l1_guided', 1, '(100%) I ______ have breakfast before work.', 'always — I always have breakfast before work.', 'Adverb before the main verb.'),
  ('exs_l2_m7_l1_guided_2', 'exs_l2_m7_l1_guided', 2, '(90%) She is ______ late for class.', 'usually — She is usually late for class.', 'After ''be'', not before.'),
  ('exs_l2_m7_l1_guided_3', 'exs_l2_m7_l1_guided', 3, '(70%) We ______ go to the cinema on Fridays.', 'often — We often go to the cinema on Fridays.', NULL),
  ('exs_l2_m7_l1_guided_4', 'exs_l2_m7_l1_guided', 4, '(50%) He ______ works at the weekend.', 'sometimes — He sometimes works at the weekend.', NULL),
  ('exs_l2_m7_l1_guided_5', 'exs_l2_m7_l1_guided', 5, '(20%) They ______ eat meat.', 'rarely — They rarely eat meat.', NULL),
  ('exs_l2_m7_l1_guided_6', 'exs_l2_m7_l1_guided', 6, '(0%) I ______ drink coffee after six.', 'never — I never drink coffee after six.', NULL),
  ('exs_l2_m7_l1_guided_7', 'exs_l2_m7_l1_guided', 7, '(100%) The shop is ______ closed on Sundays.', 'always — The shop is always closed on Sundays.', 'After ''be''.'),
  ('exs_l2_m7_l1_guided_8', 'exs_l2_m7_l1_guided', 8, '(90%) My parents ______ call me on Sunday evening.', 'usually — My parents usually call me on Sunday evening.', NULL);

INSERT INTO exercise_sets (id, learning_item_id, stage, brief, kind) VALUES
  ('exs_l2_m9_l1_guided', 'itm_l2_m9_lesson1', 'guided', 'You are given 6 jumbled story sentences and reorder them using the sequencing connectors as clues, then read the story aloud.', 'jumbled');
INSERT INTO exercise_items (id, exercise_set_id, sequence, prompt, answer, note) VALUES
  ('exs_l2_m9_l1_guided_1', 'exs_l2_m9_l1_guided', 1, 'Finally, the driver stopped and handed me my wallet through the window.', '6', 'Ends the story: ''Finally''.'),
  ('exs_l2_m9_l1_guided_2', 'exs_l2_m9_l1_guided', 2, 'Last summer I was travelling home on a crowded bus.', '1', 'Sets the scene: ''Last summer''.'),
  ('exs_l2_m9_l1_guided_3', 'exs_l2_m9_l1_guided', 3, 'After a few minutes, I realised my wallet was not in my bag.', '3', '''After a few minutes'' follows the opening.'),
  ('exs_l2_m9_l1_guided_4', 'exs_l2_m9_l1_guided', 4, 'At first I thought I had left it at the office.', '4', '''At first'' introduces the wrong assumption.'),
  ('exs_l2_m9_l1_guided_5', 'exs_l2_m9_l1_guided', 5, 'Suddenly, the bus braked hard and everyone fell forward.', '2', '''Suddenly'' interrupts the background.'),
  ('exs_l2_m9_l1_guided_6', 'exs_l2_m9_l1_guided', 6, 'Then a woman behind me tapped my shoulder and pointed at the floor.', '5', '''Then'' moves to the discovery.');

-- ─────────────────────────────────────────────────────────────────────
-- LEVEL III — the seven supplied-material sets
-- ─────────────────────────────────────────────────────────────────────

INSERT INTO exercise_sets (id, learning_item_id, stage, brief, kind) VALUES
  ('exs_l3_m2_l1_guided', 'itm_l3_m2_lesson1', 'guided', 'Combine 8 sentence pairs into one sentence using a defining relative clause, then add a present perfect continuous sentence about your own real study history.', 'sentence_pairs');
INSERT INTO exercise_items (id, exercise_set_id, sequence, prompt, answer, note) VALUES
  ('exs_l3_m2_l1_guided_1', 'exs_l3_m2_l1_guided', 1, 'The teacher was very patient. She taught me last year.', 'The teacher who taught me last year was very patient.', 'Subject relative pronoun: who.'),
  ('exs_l3_m2_l1_guided_2', 'exs_l3_m2_l1_guided', 2, 'I still use the dictionary. My father gave it to me.', 'I still use the dictionary that my father gave me.', 'Object relative pronoun: that/which, and it may be omitted.'),
  ('exs_l3_m2_l1_guided_3', 'exs_l3_m2_l1_guided', 3, 'The course is fully booked. It starts in September.', 'The course that starts in September is fully booked.', NULL),
  ('exs_l3_m2_l1_guided_4', 'exs_l3_m2_l1_guided', 4, 'She works with a colleague. His English is excellent.', 'She works with a colleague whose English is excellent.', 'Possessive: whose.'),
  ('exs_l3_m2_l1_guided_5', 'exs_l3_m2_l1_guided', 5, 'We visited the school. I studied there as a child.', 'We visited the school where I studied as a child.', 'Place: where.'),
  ('exs_l3_m2_l1_guided_6', 'exs_l3_m2_l1_guided', 6, 'The exam was harder than expected. I took it in June.', 'The exam that I took in June was harder than expected.', NULL),
  ('exs_l3_m2_l1_guided_7', 'exs_l3_m2_l1_guided', 7, 'I have a friend. She has lived in four countries.', 'I have a friend who has lived in four countries.', NULL),
  ('exs_l3_m2_l1_guided_8', 'exs_l3_m2_l1_guided', 8, 'That is the building. The evening classes are held in it.', 'That is the building where the evening classes are held.', NULL);

INSERT INTO exercise_sets (id, learning_item_id, stage, brief, kind) VALUES
  ('exs_l3_m3_l2_guided', 'itm_l3_m3_lesson2', 'guided', 'Pair work: take turns pitching a simple, pre-given business idea (from prompt cards) to a partner using the four-part structure, with the partner asking one follow-up question at the end.', 'cards');
INSERT INTO exercise_items (id, exercise_set_id, sequence, prompt, answer, note) VALUES
  ('exs_l3_m3_l2_guided_1', 'exs_l3_m3_l2_guided', 1, 'A repair café: a weekly space where people bring broken appliances and volunteers help them fix them, funded by donations and a small tool-hire fee.', NULL, 'Four-part structure: problem, solution, who it is for, why now.'),
  ('exs_l3_m3_l2_guided_2', 'exs_l3_m3_l2_guided', 2, 'A language exchange delivery service: restaurant meals delivered by students who stay for twenty minutes to practise conversation with the customer.', NULL, NULL),
  ('exs_l3_m3_l2_guided_3', 'exs_l3_m3_l2_guided', 3, 'A tool library: an annual membership that lets households borrow drills, ladders and garden tools instead of buying them.', NULL, NULL),
  ('exs_l3_m3_l2_guided_4', 'exs_l3_m3_l2_guided', 4, 'A revision app for shift workers: study sessions of nine minutes, designed to fit a break, with progress carried across devices.', NULL, NULL),
  ('exs_l3_m3_l2_guided_5', 'exs_l3_m3_l2_guided', 5, 'A second-hand uniform exchange for schools, run at the school gate twice a term, with the school taking a small commission.', NULL, NULL),
  ('exs_l3_m3_l2_guided_6', 'exs_l3_m3_l2_guided', 6, 'A quiet-hours supermarket: one morning a week with no music, dimmed lighting and no announcements, for shoppers who find noise difficult.', NULL, NULL);

INSERT INTO exercise_sets (id, learning_item_id, stage, brief, kind) VALUES
  ('exs_l3_m4_l1_guided', 'itm_l3_m4_lesson1', 'guided', 'You are given 6 opinion prompts and build a full opinion statement for each using a formal phrase + a reason + an "although" counter-point acknowledgement.', 'cards');
INSERT INTO exercise_items (id, exercise_set_id, sequence, prompt, answer, note) VALUES
  ('exs_l3_m4_l1_guided_1', 'exs_l3_m4_l1_guided', 1, 'Homework should be abolished in primary schools.', 'In my view, homework should be limited rather than abolished in primary schools, because short reading tasks build a daily habit — although I accept that long written assignments at that age achieve very little.', 'Model: formal phrase + reason + although.'),
  ('exs_l3_m4_l1_guided_2', 'exs_l3_m4_l1_guided', 2, 'Universities should be free for everyone.', NULL, NULL),
  ('exs_l3_m4_l1_guided_3', 'exs_l3_m4_l1_guided', 3, 'Social media does more harm than good to young people.', NULL, NULL),
  ('exs_l3_m4_l1_guided_4', 'exs_l3_m4_l1_guided', 4, 'Every citizen should be required to vote.', NULL, NULL),
  ('exs_l3_m4_l1_guided_5', 'exs_l3_m4_l1_guided', 5, 'Cars should be banned from city centres.', NULL, NULL),
  ('exs_l3_m4_l1_guided_6', 'exs_l3_m4_l1_guided', 6, 'Employers should be allowed to read their staff''s work email.', NULL, NULL);

INSERT INTO exercise_sets (id, learning_item_id, stage, brief, kind) VALUES
  ('exs_l3_m5_l2_independent', 'itm_l3_m5_lesson2', 'independent', 'In small groups, you are given one of 3 short ethical case-study scenarios (a resource trade-off, a technology-vs-privacy dilemma, a development-vs-conservation conflict) and prepare a position.', 'excerpts');
INSERT INTO exercise_items (id, exercise_set_id, sequence, prompt, answer, note) VALUES
  ('exs_l3_m5_l2_independent_1', 'exs_l3_m5_l2_independent', 1, 'RESOURCE TRADE-OFF — A town of 40,000 people has one hospital budget increase to spend. It can fund either a new children''s ward, serving about 900 children a year, or a mobile clinic reaching 3,000 elderly residents in outlying villages who currently travel two hours for appointments. Both are needed. Only one can be funded this year.', NULL, 'Position must name who benefits, who loses, and the principle used to choose.'),
  ('exs_l3_m5_l2_independent_2', 'exs_l3_m5_l2_independent', 2, 'TECHNOLOGY VERSUS PRIVACY — A city proposes cameras with automatic number-plate recognition at every entrance. Modelling suggests vehicle theft would fall by around a third. The system would also record the movements of every resident, and the records would be kept for two years.', NULL, NULL),
  ('exs_l3_m5_l2_independent_3', 'exs_l3_m5_l2_independent', 3, 'DEVELOPMENT VERSUS CONSERVATION — A wind farm would supply clean electricity to 30,000 homes and create 60 permanent jobs in an area with high unemployment. It would be built on a wetland that is the last regional breeding site for two wading bird species.', NULL, NULL);

INSERT INTO exercise_sets (id, learning_item_id, stage, brief, kind) VALUES
  ('exs_l3_m7_l1_guided', 'itm_l3_m7_lesson1', 'guided', 'You are given 8 short scenario cards (each with 2-3 pieces of evidence) and make a deduction for each using must/might/can''t, stating your reason.', 'cards');
INSERT INTO exercise_items (id, exercise_set_id, sequence, prompt, answer, note) VALUES
  ('exs_l3_m7_l1_guided_1', 'exs_l3_m7_l1_guided', 1, 'The lights are on in the office. Her coat is on the chair. Her car is in the car park.', 'She must still be at work — all three pieces of evidence point the same way.', NULL),
  ('exs_l3_m7_l1_guided_2', 'exs_l3_m7_l1_guided', 2, 'His phone goes straight to voicemail. He said he was flying to Madrid this morning.', 'He must be on the plane. / He can''t answer because the phone is switched off.', NULL),
  ('exs_l3_m7_l1_guided_3', 'exs_l3_m7_l1_guided', 3, 'There is a wet umbrella by the door and the pavement outside is dry.', 'It might have rained earlier, or the umbrella might have been used somewhere else — the evidence does not settle it.', 'A deliberately weak case: ''might'' is the correct strength.'),
  ('exs_l3_m7_l1_guided_4', 'exs_l3_m7_l1_guided', 4, 'She has lived in Berlin for ten years and has a German passport.', 'She must speak German well. / She can''t be a recent arrival.', NULL),
  ('exs_l3_m7_l1_guided_5', 'exs_l3_m7_l1_guided', 5, 'The restaurant is empty at eight o''clock on a Saturday. The lights are on and the door is open.', 'It might be new, or it might have a poor reputation — but it can''t be closed.', NULL),
  ('exs_l3_m7_l1_guided_6', 'exs_l3_m7_l1_guided', 6, 'He is wearing a suit and carrying a folder of papers. It is nine in the morning.', 'He might be going to an interview or to a meeting. He can''t be on holiday.', NULL),
  ('exs_l3_m7_l1_guided_7', 'exs_l3_m7_l1_guided', 7, 'The milk in the fridge is fresh and there is a full bag of shopping on the table.', 'Somebody must have been to the shops very recently.', NULL),
  ('exs_l3_m7_l1_guided_8', 'exs_l3_m7_l1_guided', 8, 'She has not answered any messages for three days and her social media has not been updated.', 'She might have lost her phone, she might be busy, or she might be away — three days is not enough evidence for ''must''.', 'Tests restraint: learners often over-deduce here.');

INSERT INTO exercise_sets (id, learning_item_id, stage, brief, kind) VALUES
  ('exs_l3_m8_l2_guided', 'itm_l3_m8_lesson2', 'guided', 'You are given 6 "custom" prompt cards (generic, non-stereotyping) and build a second-conditional + whereas comparison sentence for each, comparing two ways of doing the same thing.', 'cards');
INSERT INTO exercise_items (id, exercise_set_id, sequence, prompt, answer, note) VALUES
  ('exs_l3_m8_l2_guided_1', 'exs_l3_m8_l2_guided', 1, 'Greeting someone you have just met: a handshake, or a slight bow.', 'If I greeted a new colleague with a bow, it would seem unusual in some workplaces, whereas a handshake would pass without comment.', 'The comparison is between practices, never between peoples.'),
  ('exs_l3_m8_l2_guided_2', 'exs_l3_m8_l2_guided', 2, 'Arriving at a dinner invitation: exactly on time, or fifteen minutes later.', NULL, NULL),
  ('exs_l3_m8_l2_guided_3', 'exs_l3_m8_l2_guided', 3, 'Giving a gift: opening it immediately, or setting it aside to open later.', NULL, NULL),
  ('exs_l3_m8_l2_guided_4', 'exs_l3_m8_l2_guided', 4, 'Disagreeing in a meeting: saying so directly, or asking a question instead.', NULL, NULL),
  ('exs_l3_m8_l2_guided_5', 'exs_l3_m8_l2_guided', 5, 'Splitting a restaurant bill: dividing it equally, or each paying for what they ordered.', NULL, NULL),
  ('exs_l3_m8_l2_guided_6', 'exs_l3_m8_l2_guided', 6, 'Addressing a manager: by first name, or by title and family name.', NULL, NULL);

INSERT INTO exercise_sets (id, learning_item_id, stage, brief, kind) VALUES
  ('exs_l3_m9_l1_guided', 'itm_l3_m9_lesson1', 'guided', 'You are given a jumbled paragraph (topic sentence, 2 supporting details, and a conclusion, all mixed up) and reorder it correctly, identifying each part.', 'jumbled');
INSERT INTO exercise_items (id, exercise_set_id, sequence, prompt, answer, note) VALUES
  ('exs_l3_m9_l1_guided_1', 'exs_l3_m9_l1_guided', 1, 'A study of 2,000 commuters found that those who cycled reported lower stress levels than those who drove.', '3', 'Supporting detail 2 — evidence.'),
  ('exs_l3_m9_l1_guided_2', 'exs_l3_m9_l1_guided', 2, 'Cycling to work brings benefits that go well beyond fitness.', '1', 'Topic sentence — states the claim the paragraph will support.'),
  ('exs_l3_m9_l1_guided_3', 'exs_l3_m9_l1_guided', 3, 'For these reasons, employers who provide secure bicycle storage are investing in more than a car park.', '5', 'Conclusion — draws the consequence.'),
  ('exs_l3_m9_l1_guided_4', 'exs_l3_m9_l1_guided', 4, 'First, it removes the daily uncertainty of traffic, since a cyclist''s journey time varies far less than a driver''s.', '2', 'Supporting detail 1 — reason.'),
  ('exs_l3_m9_l1_guided_5', 'exs_l3_m9_l1_guided', 5, 'It also costs almost nothing once the bicycle is bought.', '4', 'Supporting detail 3 — a second reason, which some learners will place before the study; either order can be defended, and the discussion is the point.');

-- ─────────────────────────────────────────────────────────────────────
-- LEVEL IV — the thirteen supplied-material sets
-- ─────────────────────────────────────────────────────────────────────

INSERT INTO exercise_sets (id, learning_item_id, stage, brief, kind) VALUES
  ('exs_l4_m1_l1_guided', 'itm_l4_m1_lesson1', 'guided', 'You are given 8 pairs of simple sentences describing two related past events and combine each pair into one sentence using past perfect for the earlier event.', 'sentence_pairs');
INSERT INTO exercise_items (id, exercise_set_id, sequence, prompt, answer, note) VALUES
  ('exs_l4_m1_l1_guided_1', 'exs_l4_m1_l1_guided', 1, 'The train left. We arrived at the station.', 'When we arrived at the station, the train had already left.', NULL),
  ('exs_l4_m1_l1_guided_2', 'exs_l4_m1_l1_guided', 2, 'She studied French for six years. She moved to Lyon.', 'She had studied French for six years before she moved to Lyon.', NULL),
  ('exs_l4_m1_l1_guided_3', 'exs_l4_m1_l1_guided', 3, 'I finished the report. My manager asked for it.', 'I had finished the report by the time my manager asked for it.', NULL),
  ('exs_l4_m1_l1_guided_4', 'exs_l4_m1_l1_guided', 4, 'They ate dinner. We got there.', 'They had eaten dinner by the time we got there.', NULL),
  ('exs_l4_m1_l1_guided_5', 'exs_l4_m1_l1_guided', 5, 'He lost his keys. He realised at the front door.', 'He realised at the front door that he had lost his keys.', NULL),
  ('exs_l4_m1_l1_guided_6', 'exs_l4_m1_l1_guided', 6, 'The shop closed. She walked across town to reach it.', 'The shop had closed by the time she walked across town to reach it.', 'Order of events is not order of mention: the closing is earlier.'),
  ('exs_l4_m1_l1_guided_7', 'exs_l4_m1_l1_guided', 7, 'I never saw the sea. I was twenty.', 'I had never seen the sea until I was twenty.', NULL),
  ('exs_l4_m1_l1_guided_8', 'exs_l4_m1_l1_guided', 8, 'The meeting started. He sent the apology.', 'The meeting had already started when he sent the apology.', NULL);

INSERT INTO exercise_sets (id, learning_item_id, stage, brief, kind) VALUES
  ('exs_l4_m1_l2_guided', 'itm_l4_m1_lesson2', 'guided', 'You are given a jumbled reflective paragraph (6 sentences in mixed tenses, shuffled) and reorder it, identifying which tense each sentence uses and why.', 'jumbled');
INSERT INTO exercise_items (id, exercise_set_id, sequence, prompt, answer, note) VALUES
  ('exs_l4_m1_l2_guided_1', 'exs_l4_m1_l2_guided', 1, 'I have been teaching for eleven years now, and I still use it.', '6', 'Present perfect continuous — the practice continues to today.'),
  ('exs_l4_m1_l2_guided_2', 'exs_l4_m1_l2_guided', 2, 'When I began teaching, I had never planned a lesson for adults.', '1', 'Past perfect — the state before the starting point.'),
  ('exs_l4_m1_l2_guided_3', 'exs_l4_m1_l2_guided', 3, 'I spent my first term copying whatever the teacher next door did.', '2', 'Past simple — a completed period.'),
  ('exs_l4_m1_l2_guided_4', 'exs_l4_m1_l2_guided', 4, 'By the end of that year I had developed a routine of my own.', '3', 'Past perfect — completed before a stated past point.'),
  ('exs_l4_m1_l2_guided_5', 'exs_l4_m1_l2_guided', 5, 'It was not a good routine, but it was mine.', '4', 'Past simple — description within the same past frame.'),
  ('exs_l4_m1_l2_guided_6', 'exs_l4_m1_l2_guided', 6, 'Since then I have changed almost everything about it except one habit: I write the lesson''s question on the board before anything else.', '5', 'Present perfect — a change from a past point up to now.');

INSERT INTO exercise_sets (id, learning_item_id, stage, brief, kind) VALUES
  ('exs_l4_m2_l2_guided', 'itm_l4_m2_lesson2', 'guided', 'You are given 6 original sentences and, for each, identify which of two provided "paraphrases" is genuine and which is too close to the original, explaining the difference.', 'excerpts');
INSERT INTO exercise_items (id, exercise_set_id, sequence, prompt, answer, note) VALUES
  ('exs_l4_m2_l2_guided_1', 'exs_l4_m2_l2_guided', 1, 'ORIGINAL: Remote working reduced office costs but made informal knowledge-sharing significantly harder.
A: Remote working cut office costs but made casual knowledge-sharing considerably harder.
B: Firms saved on premises when staff worked from home, but lost the incidental learning that happens when colleagues sit together.', 'B is the genuine paraphrase. A has changed six words and kept the sentence''s structure and order — that is substitution, not paraphrase.', NULL),
  ('exs_l4_m2_l2_guided_2', 'exs_l4_m2_l2_guided', 2, 'ORIGINAL: The policy was announced without consultation and was withdrawn within a month.
A: Ministers published the policy before asking anyone affected, and abandoned it four weeks later.
B: The measure was introduced without consultation and was cancelled within a month.', 'A is genuine; B swaps synonyms into the same frame.', NULL),
  ('exs_l4_m2_l2_guided_3', 'exs_l4_m2_l2_guided', 3, 'ORIGINAL: Students who received weekly feedback improved faster than those who received feedback only at the end of term.
A: Learners given weekly comments progressed more quickly than those given comments only at term''s end.
B: Feedback given little and often produced faster progress than a single end-of-term report.', 'B is genuine.', NULL),
  ('exs_l4_m2_l2_guided_4', 'exs_l4_m2_l2_guided', 4, 'ORIGINAL: The technology is promising, but it has not yet been tested outside laboratory conditions.
A: Early results are encouraging; what is missing is evidence from real-world use.
B: The technology looks promising, but it has not been tested beyond laboratory conditions yet.', 'A is genuine.', NULL),
  ('exs_l4_m2_l2_guided_5', 'exs_l4_m2_l2_guided', 5, 'ORIGINAL: Rising rents pushed younger residents out of the city centre and into the surrounding towns.
A: Increasing rents forced younger inhabitants out of the city centre and into the neighbouring towns.
B: As the centre became unaffordable, the people who left first were the young, and they settled in the towns around it.', 'B is genuine.', NULL),
  ('exs_l4_m2_l2_guided_6', 'exs_l4_m2_l2_guided', 6, 'ORIGINAL: The report acknowledges the problem but proposes no timetable for solving it.
A: The report admits there is a problem but suggests no schedule for fixing it.
B: The problem is recognised in the report; what the report does not do is say when it will be addressed.', 'B is genuine.', NULL);

INSERT INTO exercise_sets (id, learning_item_id, stage, brief, kind) VALUES
  ('exs_l4_m3_l2_guided', 'itm_l4_m3_lesson2', 'guided', 'You are given a jumbled professional email (parts shuffled) and reorder it correctly, then practise answering 2 behavioural interview questions aloud.', 'jumbled');
INSERT INTO exercise_items (id, exercise_set_id, sequence, prompt, answer, note) VALUES
  ('exs_l4_m3_l2_guided_1', 'exs_l4_m3_l2_guided', 1, 'I would be glad to talk this through at a time that suits you.', '5', 'Offer / next step.'),
  ('exs_l4_m3_l2_guided_2', 'exs_l4_m3_l2_guided', 2, 'Dear Ms Okonjo,', '1', 'Salutation.'),
  ('exs_l4_m3_l2_guided_3', 'exs_l4_m3_l2_guided', 3, 'I am writing about the training budget for the coming quarter.', '2', 'Purpose — stated in the first line, not the third paragraph.'),
  ('exs_l4_m3_l2_guided_4', 'exs_l4_m3_l2_guided', 4, 'Kind regards,
Daniel Arriaga', '6', 'Sign-off.'),
  ('exs_l4_m3_l2_guided_5', 'exs_l4_m3_l2_guided', 5, 'Two members of the team have asked to take the advanced certificate, and the cost would be approximately £1,800 in total.', '3', 'Detail.'),
  ('exs_l4_m3_l2_guided_6', 'exs_l4_m3_l2_guided', 6, 'If the budget cannot cover both this quarter, I would suggest approving one now and the second in July.', '4', 'Recommendation — a proposal, not a complaint.');

INSERT INTO exercise_sets (id, learning_item_id, stage, brief, kind) VALUES
  ('exs_l4_m4_l1_guided', 'itm_l4_m4_lesson1', 'guided', 'You are given 6 argument-plus-counter-point pairs and, for each, write a strong concession that acknowledges the counter-point without undermining the argument.', 'sentence_pairs');
INSERT INTO exercise_items (id, exercise_set_id, sequence, prompt, answer, note) VALUES
  ('exs_l4_m4_l1_guided_1', 'exs_l4_m4_l1_guided', 1, 'ARGUMENT: Cities should charge drivers to enter the centre.
COUNTER: Charges fall hardest on low-paid shift workers who cannot use public transport at night.', 'While it is true that a flat charge would penalise night-shift workers most, that is an argument for exempting them rather than for abandoning a measure which demonstrably reduces congestion.', 'A strong concession names the counter accurately, then limits its scope.'),
  ('exs_l4_m4_l1_guided_2', 'exs_l4_m4_l1_guided', 2, 'ARGUMENT: Examinations should be replaced by continuous assessment.
COUNTER: Continuous assessment is easier to plagiarise.', NULL, NULL),
  ('exs_l4_m4_l1_guided_3', 'exs_l4_m4_l1_guided', 3, 'ARGUMENT: Companies should publish salary ranges in job advertisements.
COUNTER: Doing so can compress pay for existing staff.', NULL, NULL),
  ('exs_l4_m4_l1_guided_4', 'exs_l4_m4_l1_guided', 4, 'ARGUMENT: Schools should start later in the morning.
COUNTER: Later starts create childcare problems for working parents.', NULL, NULL),
  ('exs_l4_m4_l1_guided_5', 'exs_l4_m4_l1_guided', 5, 'ARGUMENT: Public libraries should stay open in the evening.
COUNTER: Evening opening costs more per visitor than daytime opening.', NULL, NULL),
  ('exs_l4_m4_l1_guided_6', 'exs_l4_m4_l1_guided', 6, 'ARGUMENT: Air travel should be taxed more heavily.
COUNTER: Higher taxes make travel a privilege of the wealthy.', NULL, NULL);

INSERT INTO exercise_sets (id, learning_item_id, stage, brief, kind) VALUES
  ('exs_l4_m4_l2_guided', 'itm_l4_m4_lesson2', 'guided', 'In small groups, you are assigned proposition or opposition on a provided motion and prepare a 2-point opening statement together, then practise rebuttal.', 'cards');
INSERT INTO exercise_items (id, exercise_set_id, sequence, prompt, answer, note) VALUES
  ('exs_l4_m4_l2_guided_1', 'exs_l4_m4_l2_guided', 1, 'MOTION: This house would make voting compulsory.', NULL, 'Assign one side; the other prepares the rebuttal.'),
  ('exs_l4_m4_l2_guided_2', 'exs_l4_m4_l2_guided', 2, 'MOTION: This house would ban advertising aimed at children under twelve.', NULL, NULL),
  ('exs_l4_m4_l2_guided_3', 'exs_l4_m4_l2_guided', 3, 'MOTION: This house believes a four-day working week should be the legal standard.', NULL, NULL),
  ('exs_l4_m4_l2_guided_4', 'exs_l4_m4_l2_guided', 4, 'MOTION: This house would require every new building to generate its own electricity.', NULL, NULL),
  ('exs_l4_m4_l2_guided_5', 'exs_l4_m4_l2_guided', 5, 'MOTION: This house believes universities should admit students by lottery above a qualifying grade.', NULL, NULL),
  ('exs_l4_m4_l2_guided_6', 'exs_l4_m4_l2_guided', 6, 'MOTION: This house would abolish homework in secondary schools.', NULL, NULL);

INSERT INTO exercise_sets (id, learning_item_id, stage, brief, kind) VALUES
  ('exs_l4_m6_l2_guided', 'itm_l4_m6_lesson2', 'guided', 'In pairs, take turns delivering a 60-second mini-version of a presentation on a provided topic, using at least 2 signposting phrases and one described visual.', 'cards');
INSERT INTO exercise_items (id, exercise_set_id, sequence, prompt, answer, note) VALUES
  ('exs_l4_m6_l2_guided_1', 'exs_l4_m6_l2_guided', 1, 'TOPIC: One change that would improve your city. VISUAL: a two-column table — ''now'' and ''after the change''.', NULL, 'Signposting: ''I''ll cover two things...'', ''Turning to the second...'''),
  ('exs_l4_m6_l2_guided_2', 'exs_l4_m6_l2_guided', 2, 'TOPIC: A skill everyone should learn before leaving school. VISUAL: a simple bar chart of how often the skill is used in adult life.', NULL, NULL),
  ('exs_l4_m6_l2_guided_3', 'exs_l4_m6_l2_guided', 3, 'TOPIC: The best way to learn a language as an adult. VISUAL: a timeline of a learner''s first six months.', NULL, NULL),
  ('exs_l4_m6_l2_guided_4', 'exs_l4_m6_l2_guided', 4, 'TOPIC: Whether working from home suits every job. VISUAL: a two-by-two grid — ''needs a place'' against ''needs people''.', NULL, NULL),
  ('exs_l4_m6_l2_guided_5', 'exs_l4_m6_l2_guided', 5, 'TOPIC: A piece of technology that has been overrated. VISUAL: a line showing promised benefit against delivered benefit.', NULL, NULL),
  ('exs_l4_m6_l2_guided_6', 'exs_l4_m6_l2_guided', 6, 'TOPIC: What a good manager does in the first month. VISUAL: a numbered list of four actions in order.', NULL, NULL);

INSERT INTO exercise_sets (id, learning_item_id, stage, brief, kind) VALUES
  ('exs_l4_m7_l1_guided', 'itm_l4_m7_lesson1', 'guided', 'You are given 3 short text excerpts (generic, invented, representing different tones/biases) and identify the purpose, tone, and at least one rhetorical device in each.', 'excerpts');
INSERT INTO exercise_items (id, exercise_set_id, sequence, prompt, answer, note) VALUES
  ('exs_l4_m7_l1_guided_1', 'exs_l4_m7_l1_guided', 1, 'EXCERPT A — "The council''s new parking scheme has been in place for six weeks. Traffic counts show a nine per cent fall in vehicles entering the centre. Businesses report mixed effects: two of the eleven surveyed reported lower takings, six reported no change, and three reported an increase."', 'Purpose: to inform. Tone: neutral and measured. Device: precise quantification, which invites the reader to draw their own conclusion.', NULL),
  ('exs_l4_m7_l1_guided_2', 'exs_l4_m7_l1_guided', 2, 'EXCERPT B — "Six weeks. Six weeks is all it took for the council''s parking scheme to empty our high street, silence our shops and drive away the customers who kept them alive. How much longer must local traders pay for a decision they were never asked about?"', 'Purpose: to persuade. Tone: indignant. Devices: anaphora (''six weeks''), the tricolon ''empty, silence, drive away'', and a rhetorical question that assumes what it should prove.', NULL),
  ('exs_l4_m7_l1_guided_3', 'exs_l4_m7_l1_guided', 3, 'EXCERPT C — "We understand that change is difficult, and we have listened carefully to the concerns raised. The scheme will continue as planned, with a review in the spring."', 'Purpose: to reassure while conceding nothing. Tone: emollient. Device: the concessive opening followed by ''will continue as planned'' — the sentence structure grants feeling and refuses substance.', NULL);

INSERT INTO exercise_sets (id, learning_item_id, stage, brief, kind) VALUES
  ('exs_l4_m7_l2_guided', 'itm_l4_m7_lesson2', 'guided', 'Rewrite 8 repetitive sentence pairs using ellipsis or substitution as appropriate, then identify the antecedent in 4 given examples.', 'sentence_pairs');
INSERT INTO exercise_items (id, exercise_set_id, sequence, prompt, answer, note) VALUES
  ('exs_l4_m7_l2_guided_1', 'exs_l4_m7_l2_guided', 1, 'She applied for the grant and her colleague applied for the grant too.', 'She applied for the grant and her colleague did too.', 'Substitution with ''did''.'),
  ('exs_l4_m7_l2_guided_2', 'exs_l4_m7_l2_guided', 2, 'I have not read the report yet. My manager has not read the report yet either.', 'I have not read the report yet, and nor has my manager.', NULL),
  ('exs_l4_m7_l2_guided_3', 'exs_l4_m7_l2_guided', 3, 'He wanted to attend the conference but he could not attend the conference.', 'He wanted to attend the conference but could not.', 'Ellipsis after the modal.'),
  ('exs_l4_m7_l2_guided_4', 'exs_l4_m7_l2_guided', 4, 'The first proposal was expensive. The second proposal was expensive as well.', 'The first proposal was expensive and so was the second.', NULL),
  ('exs_l4_m7_l2_guided_5', 'exs_l4_m7_l2_guided', 5, 'They said they would send the figures and they sent the figures.', 'They said they would send the figures, and they did.', NULL),
  ('exs_l4_m7_l2_guided_6', 'exs_l4_m7_l2_guided', 6, 'Some students finished early. Other students did not finish early.', 'Some students finished early; others did not.', NULL),
  ('exs_l4_m7_l2_guided_7', 'exs_l4_m7_l2_guided', 7, 'You can submit the form online or you can submit the form by post.', 'You can submit the form online or by post.', NULL),
  ('exs_l4_m7_l2_guided_8', 'exs_l4_m7_l2_guided', 8, 'She has visited Japan twice. I have never visited Japan.', 'She has visited Japan twice; I never have.', NULL);

INSERT INTO exercise_sets (id, learning_item_id, stage, brief, kind) VALUES
  ('exs_l4_m7_l2_extension', 'itm_l4_m7_lesson2', 'extension', 'Identify one place in a provided dense academic-style text where you had to pause and work out what an ellipsis or substitution referred to.', 'excerpts');
INSERT INTO exercise_items (id, exercise_set_id, sequence, prompt, answer, note) VALUES
  ('exs_l4_m7_l2_extension_1', 'exs_l4_m7_l2_extension', 1, '"Early studies of remote assessment reported broadly positive results; later ones did not. This was attributed at first to differences in cohort size, though subsequent work suggested otherwise. Where institutions had invested in invigilation technology, outcomes held up; where they had not, they fell away sharply. The difference is not trivial, and it has not been adequately explained."', 'Four places demand recovery work: ''later ones'' (later studies), ''did not'' (did not report positive results), ''otherwise'' (that the cause was not cohort size), and ''they had not'' (had not invested). The last is the hardest, because the antecedent is two clauses back.', 'Ask the learner which one made them pause, not which ones exist.');

INSERT INTO exercise_sets (id, learning_item_id, stage, brief, kind) VALUES
  ('exs_l4_m8_l1_guided', 'itm_l4_m8_lesson1', 'guided', 'You are given 8 sentence pairs and decide whether each needs a defining or non-defining relative clause based on context, adding commas correctly where required.', 'sentence_pairs');
INSERT INTO exercise_items (id, exercise_set_id, sequence, prompt, answer, note) VALUES
  ('exs_l4_m8_l1_guided_1', 'exs_l4_m8_l1_guided', 1, 'My sister lives in Oslo. I have only one sister.', 'My sister, who lives in Oslo, is a translator.', 'Non-defining: there is only one sister, so the clause adds information rather than identifying.'),
  ('exs_l4_m8_l1_guided_2', 'exs_l4_m8_l1_guided', 2, 'The candidate has the most experience. There were four candidates.', 'The candidate who has the most experience should be appointed.', 'Defining: it identifies which candidate.'),
  ('exs_l4_m8_l1_guided_3', 'exs_l4_m8_l1_guided', 3, 'Our head office is in Manchester. The company has one head office.', 'Our head office, which is in Manchester, will move next year.', NULL),
  ('exs_l4_m8_l1_guided_4', 'exs_l4_m8_l1_guided', 4, 'The train stops at every station. There are several trains.', 'The train that stops at every station takes an hour longer.', NULL),
  ('exs_l4_m8_l1_guided_5', 'exs_l4_m8_l1_guided', 5, 'Dr Halvorsen wrote the report. She is the only author.', 'Dr Halvorsen, who wrote the report, will present the findings.', NULL),
  ('exs_l4_m8_l1_guided_6', 'exs_l4_m8_l1_guided', 6, 'The email arrived after the deadline. Several emails arrived.', 'The email that arrived after the deadline was not counted.', NULL),
  ('exs_l4_m8_l1_guided_7', 'exs_l4_m8_l1_guided', 7, 'Their new building opened last month. They have one new building.', 'Their new building, which opened last month, has already won an award.', NULL),
  ('exs_l4_m8_l1_guided_8', 'exs_l4_m8_l1_guided', 8, 'The students passed on the first attempt. Not all students did.', 'The students who passed on the first attempt were exempted from the retake.', NULL);

INSERT INTO exercise_sets (id, learning_item_id, stage, brief, kind) VALUES
  ('exs_l4_m9_l1_guided', 'itm_l4_m9_lesson1', 'guided', 'You are given two more short source excerpts and identify each one''s main claim, then write one sentence using "both sources agree that" or "while Source A..., Source B...".', 'excerpts');
INSERT INTO exercise_items (id, exercise_set_id, sequence, prompt, answer, note) VALUES
  ('exs_l4_m9_l1_guided_1', 'exs_l4_m9_l1_guided', 1, 'SOURCE A — "Our three-year study of 4,000 pupils found that class size had a measurable effect below twenty pupils and almost none above it. Below that threshold, each pupil removed from a class was worth roughly two weeks of additional progress a year."', 'Main claim: class size matters, but only below a threshold of about twenty.', NULL),
  ('exs_l4_m9_l1_guided_2', 'exs_l4_m9_l1_guided', 2, 'SOURCE B — "Reducing class sizes is among the most expensive interventions available and among the least reliable. The same money spent on teacher development produced larger gains in every comparison we ran."', 'Main claim: class-size reduction is poor value compared with teacher development. Combined: While Source A finds a real effect below twenty pupils, Source B argues that the same expenditure achieves more elsewhere — the two are not in contradiction, since one measures effect and the other measures value for money.', 'The productive point: agreement and disagreement are not the only two options.');

INSERT INTO exercise_sets (id, learning_item_id, stage, brief, kind) VALUES
  ('exs_l4_m9_l2_guided', 'itm_l4_m9_lesson2', 'guided', 'Revise a provided paragraph with weak coherence by reordering sentences and adding appropriate connectors, then identify which cohesion devices could be added.', 'jumbled');
INSERT INTO exercise_items (id, exercise_set_id, sequence, prompt, answer, note) VALUES
  ('exs_l4_m9_l2_guided_1', 'exs_l4_m9_l2_guided', 1, 'Cycling infrastructure is expensive to build.', '2', 'Concession — belongs after the claim, not first.'),
  ('exs_l4_m9_l2_guided_2', 'exs_l4_m9_l2_guided', 2, 'Cities that have invested in protected cycle lanes have seen cycling rates rise sharply.', '1', 'Topic sentence.'),
  ('exs_l4_m9_l2_guided_3', 'exs_l4_m9_l2_guided', 3, 'The cost per journey is far lower than for road building.', '3', 'Answer to the concession — needs ''However'' or ''Even so''.'),
  ('exs_l4_m9_l2_guided_4', 'exs_l4_m9_l2_guided', 4, 'Seville built eighty kilometres of protected lanes in four years.', '4', 'Example — needs ''For instance''.'),
  ('exs_l4_m9_l2_guided_5', 'exs_l4_m9_l2_guided', 5, 'Cycling there rose from under one per cent of journeys to around seven.', '5', 'Evidence — needs ''and'' or a semicolon to bind it to the example.'),
  ('exs_l4_m9_l2_guided_6', 'exs_l4_m9_l2_guided', 6, 'Building the lanes is the intervention that works, not encouraging people to cycle on roads they find frightening.', '6', 'Conclusion — needs ''The lesson is that''.');

-- ─────────────────────────────────────────────────────────────────────
-- LEVEL V — the nine supplied-material sets
-- ─────────────────────────────────────────────────────────────────────

INSERT INTO exercise_sets (id, learning_item_id, stage, brief, kind) VALUES
  ('exs_l5_m1_l1_guided', 'itm_l5_m1_lesson1', 'guided', 'You are given 8 real-sounding reflective sentence pairs and combine each into a correctly mixed conditional, identifying which clause is past and which is present.', 'sentence_pairs');
INSERT INTO exercise_items (id, exercise_set_id, sequence, prompt, answer, note) VALUES
  ('exs_l5_m1_l1_guided_1', 'exs_l5_m1_l1_guided', 1, 'I did not study engineering. I am not working in construction now.', 'If I had studied engineering, I would be working in construction now.', 'Past condition, present result.'),
  ('exs_l5_m1_l1_guided_2', 'exs_l5_m1_l1_guided', 2, 'She missed the last train. She is staying at a hotel tonight.', 'If she had not missed the last train, she would not be staying at a hotel tonight.', NULL),
  ('exs_l5_m1_l1_guided_3', 'exs_l5_m1_l1_guided', 3, 'We did not buy the flat in 2015. We are renting now.', 'If we had bought the flat in 2015, we would not be renting now.', NULL),
  ('exs_l5_m1_l1_guided_4', 'exs_l5_m1_l1_guided', 4, 'He is not a careful driver. He had an accident last month.', 'If he were a careful driver, he would not have had an accident last month.', 'Present condition, past result — the mirror image.'),
  ('exs_l5_m1_l1_guided_5', 'exs_l5_m1_l1_guided', 5, 'I am afraid of flying. I did not take the job in Singapore.', 'If I were not afraid of flying, I would have taken the job in Singapore.', NULL),
  ('exs_l5_m1_l1_guided_6', 'exs_l5_m1_l1_guided', 6, 'They did not learn the language. They find daily life difficult.', 'If they had learned the language, they would not find daily life difficult.', NULL),
  ('exs_l5_m1_l1_guided_7', 'exs_l5_m1_l1_guided', 7, 'She is not a morning person. She turned down the early shift.', 'If she were a morning person, she would have taken the early shift.', NULL),
  ('exs_l5_m1_l1_guided_8', 'exs_l5_m1_l1_guided', 8, 'I did not keep the receipt. I cannot return the jacket.', 'If I had kept the receipt, I could return the jacket.', NULL);

INSERT INTO exercise_sets (id, learning_item_id, stage, brief, kind) VALUES
  ('exs_l5_m1_l2_guided', 'itm_l5_m1_lesson2', 'guided', 'You are given 8 idiomatic expressions/collocations and sort them by register (formal/neutral/informal), then rewrite 3 informal sentences into neutral register.', 'sorting');
INSERT INTO exercise_items (id, exercise_set_id, sequence, prompt, answer, note) VALUES
  ('exs_l5_m1_l2_guided_1', 'exs_l5_m1_l2_guided', 1, 'bear in mind', 'Neutral — usable in speech and most writing.', NULL),
  ('exs_l5_m1_l2_guided_2', 'exs_l5_m1_l2_guided', 2, 'take into consideration', 'Formal.', NULL),
  ('exs_l5_m1_l2_guided_3', 'exs_l5_m1_l2_guided', 3, 'keep an eye on', 'Informal to neutral.', NULL),
  ('exs_l5_m1_l2_guided_4', 'exs_l5_m1_l2_guided', 4, 'monitor closely', 'Formal.', NULL),
  ('exs_l5_m1_l2_guided_5', 'exs_l5_m1_l2_guided', 5, 'get the hang of', 'Informal.', NULL),
  ('exs_l5_m1_l2_guided_6', 'exs_l5_m1_l2_guided', 6, 'acquire proficiency in', 'Formal, and stiff outside academic prose.', NULL),
  ('exs_l5_m1_l2_guided_7', 'exs_l5_m1_l2_guided', 7, 'sort out', 'Informal.', NULL),
  ('exs_l5_m1_l2_guided_8', 'exs_l5_m1_l2_guided', 8, 'resolve', 'Formal to neutral.', NULL);

INSERT INTO exercise_sets (id, learning_item_id, stage, brief, kind) VALUES
  ('exs_l5_m2_l1_guided', 'itm_l5_m2_lesson1', 'guided', 'You are given 3 more short source excerpts and identify: the shared theme, one point of convergence, one point of divergence or added nuance, and one gap.', 'excerpts');
INSERT INTO exercise_items (id, exercise_set_id, sequence, prompt, answer, note) VALUES
  ('exs_l5_m2_l1_guided_1', 'exs_l5_m2_l1_guided', 1, 'SOURCE A — "Four-day-week trials in 61 organisations found no fall in output and a sharp fall in reported burnout. Ninety-two per cent chose to continue after the trial ended."', 'Claim: shorter weeks maintain output and improve wellbeing.', NULL),
  ('exs_l5_m2_l1_guided_2', 'exs_l5_m2_l1_guided', 2, 'SOURCE B — "Participation in these trials was voluntary. Organisations that expected difficulty did not take part, and the sectors best represented were those where output is measured in projects rather than hours."', 'Claim: the evidence is drawn from a self-selected sample. Convergence: neither source disputes that trials went well. Divergence: B questions what the result generalises to.', NULL),
  ('exs_l5_m2_l1_guided_3', 'exs_l5_m2_l1_guided', 3, 'SOURCE C — "In hospital and social care settings, a four-day week has been achieved only by increasing headcount, which shifts the question from productivity to funding."', 'Claim: in staffed services the reform is a budget question. Shared theme: whether shorter weeks are transferable. Gap: no source reports what happened after two or three years.', NULL);

INSERT INTO exercise_sets (id, learning_item_id, stage, brief, kind) VALUES
  ('exs_l5_m2_l2_guided', 'itm_l5_m2_lesson2', 'guided', 'Revise a provided multi-paragraph excerpt with weak essay-level cohesion, adding appropriate back-referencing devices to connect later paragraphs to earlier ones.', 'excerpts');
INSERT INTO exercise_items (id, exercise_set_id, sequence, prompt, answer, note) VALUES
  ('exs_l5_m2_l2_guided_1', 'exs_l5_m2_l2_guided', 1, 'PARAGRAPH 1 — "Machine translation has improved faster than almost anyone predicted. Systems that produced unusable output a decade ago now handle routine business correspondence competently."', 'Retain as the anchor. The later paragraphs must refer back to ''this improvement'' rather than restarting.', NULL),
  ('exs_l5_m2_l2_guided_2', 'exs_l5_m2_l2_guided', 2, 'PARAGRAPH 2 — "Language teaching enrolments have not fallen. Universities report stable numbers in most languages and growth in some."', 'Needs a back-reference: ''Despite this improvement, language teaching enrolments have not fallen.''', NULL),
  ('exs_l5_m2_l2_guided_3', 'exs_l5_m2_l2_guided', 3, 'PARAGRAPH 3 — "Employers say they need people who can judge whether a translation is right, not people who can produce one from nothing."', 'Needs the explanatory link: ''The reason appears in what employers now ask for...''', NULL),
  ('exs_l5_m2_l2_guided_4', 'exs_l5_m2_l2_guided', 4, 'PARAGRAPH 4 — "The skill being bought has changed rather than disappeared."', 'Needs a summarising back-reference across all three: ''Taken together, these findings suggest that the skill being bought has changed rather than disappeared.''', NULL);

INSERT INTO exercise_sets (id, learning_item_id, stage, brief, kind) VALUES
  ('exs_l5_m3_l2_guided', 'itm_l5_m3_lesson2', 'guided', 'Practise reframing 4 narrowly-stated issues into more compelling, higher-stakes framings, then practise the vision-rationale-call-to-action structure.', 'cards');
INSERT INTO exercise_items (id, exercise_set_id, sequence, prompt, answer, note) VALUES
  ('exs_l5_m3_l2_guided_1', 'exs_l5_m3_l2_guided', 1, 'NARROW: We need to buy new laptops for the design team.', 'REFRAMED: We are asking our designers to compete against studios whose tools render in seconds while ours take minutes — and we are paying for that difference in missed deadlines.', 'Reframing raises the stakes without exaggerating the facts.'),
  ('exs_l5_m3_l2_guided_2', 'exs_l5_m3_l2_guided', 2, 'NARROW: Attendance at the Tuesday training session is low.', NULL, NULL),
  ('exs_l5_m3_l2_guided_3', 'exs_l5_m3_l2_guided', 3, 'NARROW: The customer complaints form is too long.', NULL, NULL),
  ('exs_l5_m3_l2_guided_4', 'exs_l5_m3_l2_guided', 4, 'NARROW: We should update the staff handbook.', NULL, NULL);

INSERT INTO exercise_sets (id, learning_item_id, stage, brief, kind) VALUES
  ('exs_l5_m4_l2_guided', 'itm_l5_m4_lesson2', 'guided', 'You are given 6 claims at varying strength and revise each to be appropriately, precisely hedged for the strength of evidence described.', 'cards');
INSERT INTO exercise_items (id, exercise_set_id, sequence, prompt, answer, note) VALUES
  ('exs_l5_m4_l2_guided_1', 'exs_l5_m4_l2_guided', 1, 'CLAIM: Coffee prevents heart disease. EVIDENCE: one observational study of 900 people, correlation only.', 'Coffee consumption was associated with lower rates of heart disease in one observational study; no causal claim can be made from this design.', NULL),
  ('exs_l5_m4_l2_guided_2', 'exs_l5_m4_l2_guided', 2, 'CLAIM: The new timetable improved punctuality. EVIDENCE: punctuality rose four points in the month after the change; no comparison period.', 'Punctuality rose four points in the month following the change, although without a comparison period the improvement cannot be attributed to the timetable with confidence.', NULL),
  ('exs_l5_m4_l2_guided_3', 'exs_l5_m4_l2_guided', 3, 'CLAIM: Remote work damages team cohesion. EVIDENCE: survey of managers'' opinions in one company.', NULL, NULL),
  ('exs_l5_m4_l2_guided_4', 'exs_l5_m4_l2_guided', 4, 'CLAIM: This teaching method works. EVIDENCE: two randomised trials, 3,000 pupils, consistent results.', NULL, 'Here the correct move is to hedge LESS: over-hedging strong evidence is also a failure.'),
  ('exs_l5_m4_l2_guided_5', 'exs_l5_m4_l2_guided', 5, 'CLAIM: Sea levels will rise by one metre by 2100. EVIDENCE: a range of models projecting 0.4 to 1.1 metres depending on emissions.', NULL, NULL),
  ('exs_l5_m4_l2_guided_6', 'exs_l5_m4_l2_guided', 6, 'CLAIM: The drug has no side effects. EVIDENCE: trial of 200 participants over eight weeks.', NULL, 'Absence of evidence at this scale is not evidence of absence.');

INSERT INTO exercise_sets (id, learning_item_id, stage, brief, kind) VALUES
  ('exs_l5_m5_l1_guided', 'itm_l5_m5_lesson1', 'guided', 'You are given 8 scenarios varying in social distance/imposition and choose the most appropriate politeness level for a request in each, justifying your choice.', 'cards');
INSERT INTO exercise_items (id, exercise_set_id, sequence, prompt, answer, note) VALUES
  ('exs_l5_m5_l1_guided_1', 'exs_l5_m5_l1_guided', 1, 'Asking a close colleague at the next desk to pass you a stapler.', 'Can you pass me the stapler? — low distance, tiny imposition.', NULL),
  ('exs_l5_m5_l1_guided_2', 'exs_l5_m5_l1_guided', 2, 'Asking your manager for two days off at short notice during a busy period.', 'I realise this is short notice, and I would not ask if there were another way — would it be possible to take Thursday and Friday?', 'High imposition: the request needs grounding before it is made.'),
  ('exs_l5_m5_l1_guided_3', 'exs_l5_m5_l1_guided', 3, 'Asking a stranger on a train to watch your bag for two minutes.', NULL, NULL),
  ('exs_l5_m5_l1_guided_4', 'exs_l5_m5_l1_guided', 4, 'Asking a senior academic you have never met to read a draft chapter.', NULL, NULL),
  ('exs_l5_m5_l1_guided_5', 'exs_l5_m5_l1_guided', 5, 'Asking a friend to lend you a small amount of money until Friday.', NULL, NULL),
  ('exs_l5_m5_l1_guided_6', 'exs_l5_m5_l1_guided', 6, 'Asking a supplier to bring a delivery date forward by a week.', NULL, NULL),
  ('exs_l5_m5_l1_guided_7', 'exs_l5_m5_l1_guided', 7, 'Asking a neighbour to reduce noise late at night, for the third time.', NULL, 'Repetition changes the calculation: the same politeness level now reads as ineffective.'),
  ('exs_l5_m5_l1_guided_8', 'exs_l5_m5_l1_guided', 8, 'Asking a team member you manage to redo a piece of work.', NULL, NULL);

INSERT INTO exercise_sets (id, learning_item_id, stage, brief, kind) VALUES
  ('exs_l5_m6_l2_guided', 'itm_l5_m6_lesson2', 'guided', 'You are given 3 short media excerpts and write a combined subtext analysis for each -- explaining how 2-3 techniques work together.', 'excerpts');
INSERT INTO exercise_items (id, exercise_set_id, sequence, prompt, answer, note) VALUES
  ('exs_l5_m6_l2_guided_1', 'exs_l5_m6_l2_guided', 1, 'EXCERPT A — "Local families are once again being asked to shoulder the burden, while those in comfortable offices decide what is affordable."', 'Techniques: the contrast pair (''local families'' against ''comfortable offices''), the passive ''are being asked'' which hides who is asking, and ''once again'' which asserts a pattern without evidencing one. Together they build a grievance without naming an agent who could answer it.', NULL),
  ('exs_l5_m6_l2_guided_2', 'exs_l5_m6_l2_guided', 2, 'EXCERPT B — "Experts broadly agree that the measure is unlikely to achieve its stated aims."', 'Techniques: unattributed authority (''experts''), the hedge ''broadly'', and the double negative framing (''unlikely to achieve'') which sounds measured while conceding nothing checkable.', NULL),
  ('exs_l5_m6_l2_guided_3', 'exs_l5_m6_l2_guided', 3, 'EXCERPT C — "After years of neglect, the town finally has the transport links it deserves."', 'Techniques: ''finally'' presupposes the wait was unjust, ''neglect'' assigns blame without naming anyone, and ''deserves'' converts a policy choice into a moral entitlement.', NULL);

INSERT INTO exercise_sets (id, learning_item_id, stage, brief, kind) VALUES
  ('exs_l5_m7_l1_guided', 'itm_l5_m7_lesson1', 'guided', 'Complete 8 sentence pairs using the correct connector from this module''s set for the structural relationship described.', 'gapped');
INSERT INTO exercise_items (id, exercise_set_id, sequence, prompt, answer, note) VALUES
  ('exs_l5_m7_l1_guided_1', 'exs_l5_m7_l1_guided', 1, 'The trial showed a clear benefit. ______, it was conducted on a single site. [concession that limits]', 'Admittedly / That said', NULL),
  ('exs_l5_m7_l1_guided_2', 'exs_l5_m7_l1_guided', 2, 'Costs rose in every region. ______, the increase was sharpest in the north. [narrowing to a specific]', 'In particular', NULL),
  ('exs_l5_m7_l1_guided_3', 'exs_l5_m7_l1_guided', 3, 'The first approach failed. ______, the second was abandoned before testing. [adding a parallel negative]', 'Similarly / Equally', NULL),
  ('exs_l5_m7_l1_guided_4', 'exs_l5_m7_l1_guided', 4, 'The data were incomplete. ______, the conclusion cannot stand. [consequence]', 'Consequently / It follows that', NULL),
  ('exs_l5_m7_l1_guided_5', 'exs_l5_m7_l1_guided', 5, 'The policy was popular. ______, it was expensive. [contrast of equal weight]', 'At the same time / Equally, however', NULL),
  ('exs_l5_m7_l1_guided_6', 'exs_l5_m7_l1_guided', 6, 'Attendance improved. ______, results did not. [contrast where the second surprises]', 'Even so / Nevertheless', NULL),
  ('exs_l5_m7_l1_guided_7', 'exs_l5_m7_l1_guided', 7, 'We reviewed four studies. ______, none met the inclusion criteria. [contrast that undercuts]', 'Of these, however / In the event', NULL),
  ('exs_l5_m7_l1_guided_8', 'exs_l5_m7_l1_guided', 8, 'The method is expensive and slow. ______, it is the only one that produces reliable results. [concession reversed to favour]', 'Against that / For all that', NULL);

-- ─────────────────────────────────────────────────────────────────────
-- LEVEL VI — the ten supplied-material sets
-- ─────────────────────────────────────────────────────────────────────

INSERT INTO exercise_sets (id, learning_item_id, stage, brief, kind) VALUES
  ('exs_l6_m2_l2_guided', 'itm_l6_m2_lesson2', 'guided', 'You are given 6 stated positions and infer a plausible underlying interest for each, then propose one option that could satisfy two apparently opposed positions.', 'cards');
INSERT INTO exercise_items (id, exercise_set_id, sequence, prompt, answer, note) VALUES
  ('exs_l6_m2_l2_guided_1', 'exs_l6_m2_l2_guided', 1, 'POSITION: "We will not accept any reduction in the training budget."', 'Possible interest: protecting the team''s ability to keep a professional qualification current — which a cheaper accredited provider might also satisfy.', 'Position is what is demanded; interest is why.'),
  ('exs_l6_m2_l2_guided_2', 'exs_l6_m2_l2_guided', 2, 'POSITION: "The deadline cannot move."', NULL, NULL),
  ('exs_l6_m2_l2_guided_3', 'exs_l6_m2_l2_guided', 3, 'POSITION: "We insist the work is done in-house."', NULL, NULL),
  ('exs_l6_m2_l2_guided_4', 'exs_l6_m2_l2_guided', 4, 'POSITION: "Nobody is returning to the office five days a week."', NULL, NULL),
  ('exs_l6_m2_l2_guided_5', 'exs_l6_m2_l2_guided', 5, 'POSITION: "The price is not negotiable."', NULL, NULL),
  ('exs_l6_m2_l2_guided_6', 'exs_l6_m2_l2_guided', 6, 'POSITION: "We want the review published in full."', NULL, NULL);

INSERT INTO exercise_sets (id, learning_item_id, stage, brief, kind) VALUES
  ('exs_l6_m3_l2_guided', 'itm_l6_m3_lesson2', 'guided', 'Sort 9 statements from a provided report into evidence, inference, and recommendation, then identify the two unstated assumptions the report depends on.', 'sorting');
INSERT INTO exercise_items (id, exercise_set_id, sequence, prompt, answer, note) VALUES
  ('exs_l6_m3_l2_guided_1', 'exs_l6_m3_l2_guided', 1, 'Applications from mature students fell 18 per cent between 2021 and 2024.', 'Evidence', NULL),
  ('exs_l6_m3_l2_guided_2', 'exs_l6_m3_l2_guided', 2, 'This decline reflects the removal of the part-time maintenance grant.', 'Inference', 'Causal claim: the report offers no counterfactual.'),
  ('exs_l6_m3_l2_guided_3', 'exs_l6_m3_l2_guided', 3, 'The grant should be restored for part-time students over 25.', 'Recommendation', NULL),
  ('exs_l6_m3_l2_guided_4', 'exs_l6_m3_l2_guided', 4, 'Sixty-one per cent of surveyed non-applicants cited cost as their main barrier.', 'Evidence', NULL),
  ('exs_l6_m3_l2_guided_5', 'exs_l6_m3_l2_guided', 5, 'Cost is therefore the principal obstacle to mature participation.', 'Inference', 'Moves from what people said to what is true.'),
  ('exs_l6_m3_l2_guided_6', 'exs_l6_m3_l2_guided', 6, 'Institutions should publish total cost of study before application.', 'Recommendation', NULL),
  ('exs_l6_m3_l2_guided_7', 'exs_l6_m3_l2_guided', 7, 'Completion rates among mature students are 4 points below the cohort average.', 'Evidence', NULL),
  ('exs_l6_m3_l2_guided_8', 'exs_l6_m3_l2_guided', 8, 'Mature students need additional academic support.', 'Inference', NULL),
  ('exs_l6_m3_l2_guided_9', 'exs_l6_m3_l2_guided', 9, 'A dedicated adviser should be funded at every institution.', 'Recommendation', NULL);

INSERT INTO exercise_sets (id, learning_item_id, stage, brief, kind) VALUES
  ('exs_l6_m4_l2_guided', 'itm_l6_m4_lesson2', 'guided', 'Assess 3 provided options against 3 provided criteria in a simple matrix, then identify which single criterion, if reweighted, would change the winning option.', 'sorting');
INSERT INTO exercise_items (id, exercise_set_id, sequence, prompt, answer, note) VALUES
  ('exs_l6_m4_l2_guided_1', 'exs_l6_m4_l2_guided', 1, 'OPTION 1 — Refurbish the existing building.', 'Cost: low. Disruption: high (18 months in occupation). Long-term capacity: unchanged.', NULL),
  ('exs_l6_m4_l2_guided_2', 'exs_l6_m4_l2_guided', 2, 'OPTION 2 — Build new on the adjacent site.', 'Cost: high. Disruption: low. Long-term capacity: doubled.', NULL),
  ('exs_l6_m4_l2_guided_3', 'exs_l6_m4_l2_guided', 3, 'OPTION 3 — Lease space three miles away and keep both.', 'Cost: medium, recurring. Disruption: medium. Long-term capacity: increased but split.', NULL),
  ('exs_l6_m4_l2_guided_4', 'exs_l6_m4_l2_guided', 4, 'CRITERION A — Capital cost.', 'Weight it heavily and Option 1 wins.', NULL),
  ('exs_l6_m4_l2_guided_5', 'exs_l6_m4_l2_guided', 5, 'CRITERION B — Disruption to current users.', 'Weight it heavily and Option 2 wins.', NULL),
  ('exs_l6_m4_l2_guided_6', 'exs_l6_m4_l2_guided', 6, 'CRITERION C — Capacity in ten years.', 'Weight it heavily and Option 2 wins decisively. The criterion that flips the result is A: it is the only one under which Option 1 can win at all.', NULL);

INSERT INTO exercise_sets (id, learning_item_id, stage, brief, kind) VALUES
  ('exs_l6_m5_l2_guided', 'itm_l6_m5_lesson2', 'guided', 'You are given 6 criticisms and classify each as attacking a premise, warrant, inference, or scope -- then identify the two that attack a straw version of the argument.', 'cards');
INSERT INTO exercise_items (id, exercise_set_id, sequence, prompt, answer, note) VALUES
  ('exs_l6_m5_l2_guided_1', 'exs_l6_m5_l2_guided', 1, '"Your figures come from a survey with a 12 per cent response rate."', 'Premise — it disputes the evidence itself.', NULL),
  ('exs_l6_m5_l2_guided_2', 'exs_l6_m5_l2_guided', 2, '"Even if those figures are right, they were collected in one city and you are recommending national policy."', 'Scope.', NULL),
  ('exs_l6_m5_l2_guided_3', 'exs_l6_m5_l2_guided', 3, '"You assume that what people report doing matches what they do."', 'Warrant — it attacks the unstated bridge from evidence to conclusion.', NULL),
  ('exs_l6_m5_l2_guided_4', 'exs_l6_m5_l2_guided', 4, '"So you are saying we should abolish assessment altogether."', 'Straw version — the argument said no such thing.', NULL),
  ('exs_l6_m5_l2_guided_5', 'exs_l6_m5_l2_guided', 5, '"Your conclusion does not follow: reduced absence could equally be explained by the timetable change in the same term."', 'Inference.', NULL),
  ('exs_l6_m5_l2_guided_6', 'exs_l6_m5_l2_guided', 6, '"You want us to spend money we do not have on something no one has asked for."', 'Straw version — it substitutes a caricature for the proposal.', NULL);

INSERT INTO exercise_sets (id, learning_item_id, stage, brief, kind) VALUES
  ('exs_l6_m6_l2_guided', 'itm_l6_m6_lesson2', 'guided', 'You are given 4 keynote outlines and identify which have a genuine controlling idea and which are surveys; then draft an anchoring analogy for one unfocused outline.', 'excerpts');
INSERT INTO exercise_items (id, exercise_set_id, sequence, prompt, answer, note) VALUES
  ('exs_l6_m6_l2_guided_1', 'exs_l6_m6_l2_guided', 1, 'OUTLINE A — "1. History of language testing. 2. Current approaches. 3. Technology in assessment. 4. Future directions."', 'A survey. Nothing is argued; the four parts could be reordered without loss.', NULL),
  ('exs_l6_m6_l2_guided_2', 'exs_l6_m6_l2_guided', 2, 'OUTLINE B — "We test what is easy to score rather than what matters, and every reform of the last thirty years has made that worse rather than better."', 'A controlling idea: contestable, and it determines what belongs in the talk.', NULL),
  ('exs_l6_m6_l2_guided_3', 'exs_l6_m6_l2_guided', 3, 'OUTLINE C — "1. What employers want. 2. What universities teach. 3. The gap. 4. Whose job is it to close it?"', 'Borderline — it has a shape and a question, but no position. It becomes a controlling idea the moment part 4 is answered in the title.', NULL),
  ('exs_l6_m6_l2_guided_4', 'exs_l6_m6_l2_guided', 4, 'OUTLINE D — "1. Motivation research. 2. Classroom practice. 3. Digital tools. 4. Case studies."', 'A survey. Anchoring analogy for it: ''We have spent forty years studying why people set out on the journey, and almost none studying why they stop at the third junction.''', NULL);

INSERT INTO exercise_sets (id, learning_item_id, stage, brief, kind) VALUES
  ('exs_l6_m7_l1_guided', 'itm_l6_m7_lesson1', 'guided', 'Construct one tricolon, one anaphora, and one antithesis on a shared topic, then evaluate 4 provided passages for whether each device earns its place.', 'excerpts');
INSERT INTO exercise_items (id, exercise_set_id, sequence, prompt, answer, note) VALUES
  ('exs_l6_m7_l1_guided_1', 'exs_l6_m7_l1_guided', 1, 'PASSAGE 1 — "We must teach better, assess better, and fund better."', 'Tricolon, but it earns nothing: the three members are the same claim three times with one word changed.', NULL),
  ('exs_l6_m7_l1_guided_2', 'exs_l6_m7_l1_guided', 2, 'PASSAGE 2 — "It is not that our students cannot write. It is that we have never told them what good writing does."', 'Antithesis, and it earns its place: the second clause is not the negation of the first but a redirection of it.', NULL),
  ('exs_l6_m7_l1_guided_3', 'exs_l6_m7_l1_guided', 3, 'PASSAGE 3 — "Every year we promise reform. Every year we publish a strategy. Every year the same students leave without the same qualification."', 'Anaphora, earned: the repetition enacts the futility it describes, and the third member breaks the pattern in meaning while keeping it in form.', NULL),
  ('exs_l6_m7_l1_guided_4', 'exs_l6_m7_l1_guided', 4, 'PASSAGE 4 — "Assessment should be fair, transparent, valid, reliable, useful and humane."', 'Not a tricolon and not a list that earns its length: six abstract adjectives, none of which can be disagreed with, which is the sign that none is doing work.', NULL);

INSERT INTO exercise_sets (id, learning_item_id, stage, brief, kind) VALUES
  ('exs_l6_m8_l1_guided', 'itm_l6_m8_lesson1', 'guided', 'Learners are given 6 findings paired with 6 claim sentences and must identify which are over-claimed, which are over-hedged, and rewrite each at the correct strength.', 'sentence_pairs');
INSERT INTO exercise_items (id, exercise_set_id, sequence, prompt, answer, note) VALUES
  ('exs_l6_m8_l1_guided_1', 'exs_l6_m8_l1_guided', 1, 'FINDING: In a randomised trial of 1,200 pupils, the intervention group scored 0.3 standard deviations higher.
CLAIM: The intervention may possibly have had some effect.', 'Over-hedged. Correct: The intervention produced a moderate improvement in a randomised trial of 1,200 pupils.', NULL),
  ('exs_l6_m8_l1_guided_2', 'exs_l6_m8_l1_guided', 2, 'FINDING: Two of nine studies found an association; seven found none.
CLAIM: The evidence shows the treatment works.', 'Over-claimed. Correct: Most studies found no association; two did, and the difference between them has not been explained.', NULL),
  ('exs_l6_m8_l1_guided_3', 'exs_l6_m8_l1_guided', 3, 'FINDING: A survey of 80 self-selected respondents reported high satisfaction.
CLAIM: Users are highly satisfied with the service.', NULL, NULL),
  ('exs_l6_m8_l1_guided_4', 'exs_l6_m8_l1_guided', 4, 'FINDING: Three independent replications produced the same result.
CLAIM: There is some tentative indication of a possible relationship.', NULL, NULL),
  ('exs_l6_m8_l1_guided_5', 'exs_l6_m8_l1_guided', 5, 'FINDING: The correlation was 0.21 in a sample of 300.
CLAIM: X causes Y.', NULL, NULL),
  ('exs_l6_m8_l1_guided_6', 'exs_l6_m8_l1_guided', 6, 'FINDING: The effect was observed in men but not in women; the sample contained 40 women.
CLAIM: The effect is specific to men.', NULL, 'The honest reading is that the study was underpowered to detect it in women.');

INSERT INTO exercise_sets (id, learning_item_id, stage, brief, kind) VALUES
  ('exs_l6_m8_l2_guided', 'itm_l6_m8_lesson2', 'guided', 'Learners are given 8 questions and classify each into the four types, then draft a one-clause restatement for each. Two of the eight are deliberately hostile.', 'cards');
INSERT INTO exercise_items (id, exercise_set_id, sequence, prompt, answer, note) VALUES
  ('exs_l6_m8_l2_guided_1', 'exs_l6_m8_l2_guided', 1, '"Could you say more about how you selected the sample?"', 'Clarification.', NULL),
  ('exs_l6_m8_l2_guided_2', 'exs_l6_m8_l2_guided', 2, '"Have you considered the 2019 Reyes study, which found the opposite?"', 'Challenge to evidence.', NULL),
  ('exs_l6_m8_l2_guided_3', 'exs_l6_m8_l2_guided', 3, '"Isn''t this just the same idea that failed in the 1990s?"', 'Hostile — dismissal disguised as a question.', 'Restate it as the fair question underneath: what distinguishes this from the earlier approach?'),
  ('exs_l6_m8_l2_guided_4', 'exs_l6_m8_l2_guided', 4, '"How would this work in a school with no specialist staff?"', 'Application.', NULL),
  ('exs_l6_m8_l2_guided_5', 'exs_l6_m8_l2_guided', 5, '"What would falsify your conclusion?"', 'Challenge to reasoning — and the most useful question in the room.', NULL),
  ('exs_l6_m8_l2_guided_6', 'exs_l6_m8_l2_guided', 6, '"Do you have any actual classroom experience?"', 'Hostile — attacks the speaker, not the argument.', 'Restate: what does the classroom evidence say?'),
  ('exs_l6_m8_l2_guided_7', 'exs_l6_m8_l2_guided', 7, '"Is the effect large enough to justify the cost?"', 'Application.', NULL),
  ('exs_l6_m8_l2_guided_8', 'exs_l6_m8_l2_guided', 8, '"When you say ''engagement'', do you mean attendance or attention?"', 'Clarification.', NULL);

INSERT INTO exercise_sets (id, learning_item_id, stage, brief, kind) VALUES
  ('exs_l6_m9_l2_guided', 'itm_l6_m9_lesson2', 'guided', 'Learners are given 6 deliberation moments and choose and justify a chairing intervention for each.', 'cards');
INSERT INTO exercise_items (id, exercise_set_id, sequence, prompt, answer, note) VALUES
  ('exs_l6_m9_l2_guided_1', 'exs_l6_m9_l2_guided', 1, 'A dominant speaker has held the floor for six minutes of a twenty-minute discussion.', 'Name the constraint, not the person: "I want to make sure we hear from everyone in the time we have — can we come back to you after we have heard two more views?"', NULL),
  ('exs_l6_m9_l2_guided_2', 'exs_l6_m9_l2_guided', 2, 'One participant has not spoken at all and twice drew breath as if to.', NULL, NULL),
  ('exs_l6_m9_l2_guided_3', 'exs_l6_m9_l2_guided', 3, 'A factual dispute about a number is derailing a disagreement about values.', NULL, 'Separate them explicitly and park the factual question.'),
  ('exs_l6_m9_l2_guided_4', 'exs_l6_m9_l2_guided', 4, 'Two people are agreeing loudly with each other and calling it consensus.', NULL, NULL),
  ('exs_l6_m9_l2_guided_5', 'exs_l6_m9_l2_guided', 5, 'A participant restates an argument that was answered ten minutes ago.', NULL, NULL),
  ('exs_l6_m9_l2_guided_6', 'exs_l6_m9_l2_guided', 6, 'The group is five minutes from the end with no decision and no sign of one.', NULL, NULL);

INSERT INTO exercise_sets (id, learning_item_id, stage, brief, kind) VALUES
  ('exs_l6_m10_rev_guided', 'itm_l6_m10_revlesson', 'guided', 'Learners run the CLAIM PASS on a provided 300-word extract, compare marks in pairs, and account for every disagreement.', 'excerpts');
INSERT INTO exercise_items (id, exercise_set_id, sequence, prompt, answer, note) VALUES
  ('exs_l6_m10_rev_guided_1', 'exs_l6_m10_rev_guided', 1, '"The case for a national tutoring programme is now settled. Trials in four countries have shown that small-group tutoring adds between three and five months of additional progress, and the pupils who gain most are those furthest behind. England''s own programme reached over a million pupils in its first two years, and independent evaluation found gains for those who received the full course of sessions. Critics point to variable delivery and to the number of pupils who did not complete, but these are implementation problems rather than objections in principle. The evidence is as strong as anything in education, and the remaining question is not whether to fund tutoring but how to deliver it well. Where programmes have failed, the failure has been administrative: schools were given too little notice, tutors were recruited too quickly, and the least experienced tutors were sent to the schools with the greatest need. None of that is an argument against tutoring. It is an argument for planning it properly, funding it for longer than a single parliament, and measuring it against what pupils actually received rather than what was commissioned."', 'CLAIM PASS marks to expect: ''now settled'' (over-claim); ''between three and five months'' (evidence, cited without source); ''those furthest behind'' (finding, unattributed); ''independent evaluation found gains for those who received the full course'' (a conditional finding presented as general); ''implementation problems rather than objections in principle'' (a warrant doing heavy work); ''as strong as anything in education'' (comparative over-claim); ''the remaining question is not whether but how'' (a rhetorical closure that assumes the conclusion).', 'Disagreements between pairs are the lesson: the productive ones are about where evidence ends and inference begins.');
