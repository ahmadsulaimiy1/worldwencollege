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
