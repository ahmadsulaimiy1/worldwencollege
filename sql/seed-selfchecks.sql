-- ─────────────────────────────────────────────────────────────────────
-- SELF-CHECKS — Level I (first authoring pass)
--
-- No lesson in this programme gave a learner any way to find out
-- whether they had understood it. The module quiz arrives up to ten
-- lessons later, which is where a learner discovers they misunderstood
-- lesson three.
--
-- These are not quizzes. Three or four prompts, attempted alone,
-- immediately, with the answer beside them — and where the curriculum's
-- own material shows a known confusion, one prompt targets it and the
-- `trap` column says what it is. Where no confusion is known, the
-- column is NULL rather than a guess.
--
-- Press-drafted. Nineteen lessons of 114.
-- ─────────────────────────────────────────────────────────────────────

INSERT INTO self_checks (id, learning_item_id, intro) VALUES
  ('sc_l1_m1_lesson1', 'itm_l1_m1_lesson1', 'Before you move on, check that you can greet someone and give your name without stopping to think.');
INSERT INTO self_check_items (id, self_check_id, sequence, prompt, answer, trap) VALUES
  ('sc_l1_m1_lesson1_1', 'sc_l1_m1_lesson1', 1, 'It is 4 p.m. and you meet your new teacher. What do you say?', 'Good afternoon. — ''Good evening'' begins at about 6 p.m.', 'Learners often use ''Good night'' as a greeting. It is a farewell.'),
  ('sc_l1_m1_lesson1_2', 'sc_l1_m1_lesson1', 2, 'Complete: "______ name is Ana."', 'My name is Ana. / I''m Ana.', '''I''m name is Ana'' is the commonest first-week error: choose one form, not both.'),
  ('sc_l1_m1_lesson1_3', 'sc_l1_m1_lesson1', 3, 'Ask a stranger their name politely.', 'What''s your name? / May I ask your name?', NULL);

INSERT INTO self_checks (id, learning_item_id, intro) VALUES
  ('sc_l1_m1_lesson2', 'itm_l1_m1_lesson2', 'Check that you can ask and answer where someone is from, and name your own country in English.');
INSERT INTO self_check_items (id, self_check_id, sequence, prompt, answer, trap) VALUES
  ('sc_l1_m1_lesson2_1', 'sc_l1_m1_lesson2', 1, 'Answer: "Where are you from?"', 'I''m from + country. E.g. I''m from Brazil.', '''I come from Brazil'' is correct but less common in speech; ''I''m from'' is the default.'),
  ('sc_l1_m1_lesson2_2', 'sc_l1_m1_lesson2', 2, 'What is wrong with: "I''m from the Japan"?', 'No article: I''m from Japan. But: the United Kingdom, the Netherlands, the USA.', 'Article use with country names is arbitrary and must be learned, not reasoned.'),
  ('sc_l1_m1_lesson2_3', 'sc_l1_m1_lesson2', 3, 'Ask the question in a way that works for a city, not a country.', 'Where in Italy are you from? / Which city are you from?', NULL);

INSERT INTO self_checks (id, learning_item_id, intro) VALUES
  ('sc_l1_m2_lesson1', 'itm_l1_m2_lesson1', 'Check that you can say what is in a room using there is and there are.');
INSERT INTO self_check_items (id, self_check_id, sequence, prompt, answer, trap) VALUES
  ('sc_l1_m2_lesson1_1', 'sc_l1_m2_lesson1', 1, 'Two chairs and one table. Write both sentences.', 'There are two chairs. There is one table.', NULL),
  ('sc_l1_m2_lesson1_2', 'sc_l1_m2_lesson1', 2, 'Make a question: (a book / on the desk)', 'Is there a book on the desk?', 'Word order: Is there, not There is?'),
  ('sc_l1_m2_lesson1_3', 'sc_l1_m2_lesson1', 3, 'Correct: "There is three windows."', 'There are three windows.', 'The verb agrees with what follows, not with ''there''.');

INSERT INTO self_checks (id, learning_item_id, intro) VALUES
  ('sc_l1_m2_lesson2', 'itm_l1_m2_lesson2', 'Check that you can point at things near and far, and ask where a place is.');
INSERT INTO self_check_items (id, self_check_id, sequence, prompt, answer, trap) VALUES
  ('sc_l1_m2_lesson2_1', 'sc_l1_m2_lesson2', 1, 'A cup in your hand, and a building across the street. Which word for each?', 'this cup (near) / that building (far)', 'Many learners have one word for both distances in their first language and reach for ''this'' by default.'),
  ('sc_l1_m2_lesson2_2', 'sc_l1_m2_lesson2', 2, 'Make the plural of both.', 'these cups / those buildings', NULL),
  ('sc_l1_m2_lesson2_3', 'sc_l1_m2_lesson2', 3, 'Ask where the station is.', 'Where is the station?', NULL);

INSERT INTO self_checks (id, learning_item_id, intro) VALUES
  ('sc_l1_m3_lesson1', 'itm_l1_m3_lesson1', 'Check that you can introduce your family and ask about someone else''s.');
INSERT INTO self_check_items (id, self_check_id, sequence, prompt, answer, trap) VALUES
  ('sc_l1_m3_lesson1_1', 'sc_l1_m3_lesson1', 1, 'Introduce your mother''s sister.', 'This is my aunt.', NULL),
  ('sc_l1_m3_lesson1_2', 'sc_l1_m3_lesson1', 2, 'Ask whether someone has brothers or sisters, and give a short answer.', 'Do you have any brothers or sisters? — Yes, I do. / No, I don''t.', '''Yes, I have'' is incomplete in English: the short answer repeats the auxiliary.'),
  ('sc_l1_m3_lesson1_3', 'sc_l1_m3_lesson1', 3, 'Say you have two children using ''have''.', 'I have two children.', NULL);

INSERT INTO self_checks (id, learning_item_id, intro) VALUES
  ('sc_l1_m3_lesson2', 'itm_l1_m3_lesson2', 'Check that you can tell the time and describe a routine.');
INSERT INTO self_check_items (id, self_check_id, sequence, prompt, answer, trap) VALUES
  ('sc_l1_m3_lesson2_1', 'sc_l1_m3_lesson2', 1, 'Say 7:30 and 8:45 in English.', 'half past seven / quarter to nine', 'Quarter to NINE, not quarter to eight: ''to'' looks forward.'),
  ('sc_l1_m3_lesson2_2', 'sc_l1_m3_lesson2', 2, 'Complete: "She ______ (start) work at nine."', 'starts — third person singular takes -s.', 'The missing -s is the most common Level I grammar error and it persists for months.'),
  ('sc_l1_m3_lesson2_3', 'sc_l1_m3_lesson2', 3, 'Ask what time someone gets up.', 'What time do you get up?', NULL);

INSERT INTO self_checks (id, learning_item_id, intro) VALUES
  ('sc_l1_m4_lesson1', 'itm_l1_m4_lesson1', 'Check that you can tell countable from uncountable, and use some and any.');
INSERT INTO self_check_items (id, self_check_id, sequence, prompt, answer, trap) VALUES
  ('sc_l1_m4_lesson1_1', 'sc_l1_m4_lesson1', 1, 'Countable or uncountable: rice, apple, water, egg, bread?', 'Uncountable: rice, water, bread. Countable: apple, egg.', NULL),
  ('sc_l1_m4_lesson1_2', 'sc_l1_m4_lesson1', 2, 'Complete: "I have ______ milk" and "Do you have ______ eggs?"', 'some milk / any eggs', '''some'' in positives, ''any'' in questions and negatives — with the polite-offer exception (''Would you like some tea?'').'),
  ('sc_l1_m4_lesson1_3', 'sc_l1_m4_lesson1', 3, 'How do you count an uncountable noun?', 'With a container or measure: a bottle of water, two slices of bread.', NULL);

INSERT INTO self_checks (id, learning_item_id, intro) VALUES
  ('sc_l1_m4_lesson2', 'itm_l1_m4_lesson2', 'Check that you can ask a price and make a polite request.');
INSERT INTO self_check_items (id, self_check_id, sequence, prompt, answer, trap) VALUES
  ('sc_l1_m4_lesson2_1', 'sc_l1_m4_lesson2', 1, 'Ask the price of one apple, then of three apples.', 'How much is this apple? / How much are these apples?', '''How much are'' with plurals: the verb changes, ''how much'' does not become ''how many'' for price.'),
  ('sc_l1_m4_lesson2_2', 'sc_l1_m4_lesson2', 2, 'Say £4.50 aloud.', 'four pounds fifty', NULL),
  ('sc_l1_m4_lesson2_3', 'sc_l1_m4_lesson2', 3, 'Ask politely for a coffee.', 'Can I have a coffee, please? / Could I have a coffee, please?', NULL);

INSERT INTO self_checks (id, learning_item_id, intro) VALUES
  ('sc_l1_m5_lesson1', 'itm_l1_m5_lesson1', 'Check that you can say where something is.');
INSERT INTO self_check_items (id, self_check_id, sequence, prompt, answer, trap) VALUES
  ('sc_l1_m5_lesson1_1', 'sc_l1_m5_lesson1', 1, 'The cat is not on the box, not in it, but touching its side. Which preposition?', 'next to (or beside).', NULL),
  ('sc_l1_m5_lesson1_2', 'sc_l1_m5_lesson1', 2, 'What is the difference between ''opposite'' and ''next to''?', 'Opposite = facing, across from. Next to = at the side of.', 'These two are confused more than any other pair at this level.'),
  ('sc_l1_m5_lesson1_3', 'sc_l1_m5_lesson1', 3, 'Ask where the keys are and answer with a preposition.', 'Where are the keys? — They''re under the newspaper.', NULL);

INSERT INTO self_checks (id, learning_item_id, intro) VALUES
  ('sc_l1_m5_lesson2', 'itm_l1_m5_lesson2', 'Check that you can ask for and give directions.');
INSERT INTO self_check_items (id, self_check_id, sequence, prompt, answer, trap) VALUES
  ('sc_l1_m5_lesson2_1', 'sc_l1_m5_lesson2', 1, 'Stop a stranger and ask for the museum.', 'Excuse me, how do I get to the museum?', 'Start with ''Excuse me'' — the request without it sounds abrupt in English.'),
  ('sc_l1_m5_lesson2_2', 'sc_l1_m5_lesson2', 2, 'Give three directions using imperatives.', 'Go straight on. Turn left at the lights. Cross the bridge.', NULL),
  ('sc_l1_m5_lesson2_3', 'sc_l1_m5_lesson2', 3, 'What do you say if you did not understand?', 'Sorry, could you say that again, please?', NULL);

INSERT INTO self_checks (id, learning_item_id, intro) VALUES
  ('sc_l1_m6_lesson1', 'itm_l1_m6_lesson1', 'Check that you can describe how someone looks.');
INSERT INTO self_check_items (id, self_check_id, sequence, prompt, answer, trap) VALUES
  ('sc_l1_m6_lesson1_1', 'sc_l1_m6_lesson1', 1, 'Complete: "She ______ tall and she ______ short hair."', 'She IS tall and she HAS short hair.', '''She has tall'' is the classic error: appearance uses both verbs, and which one depends on the word.'),
  ('sc_l1_m6_lesson1_2', 'sc_l1_m6_lesson1', 2, 'Ask what someone looks like.', 'What does he/she look like?', 'Not ''How does she look like?'' — the two questions differ.'),
  ('sc_l1_m6_lesson1_3', 'sc_l1_m6_lesson1', 3, 'Give three appearance adjectives in the right order: hair that is short, dark and curly.', 'short dark curly hair — size, then colour, then shape is not the only order, but ''curly short'' is wrong.', NULL);

INSERT INTO self_checks (id, learning_item_id, intro) VALUES
  ('sc_l1_m6_lesson2', 'itm_l1_m6_lesson2', 'Check that you can say what belongs to whom.');
INSERT INTO self_check_items (id, self_check_id, sequence, prompt, answer, trap) VALUES
  ('sc_l1_m6_lesson2_1', 'sc_l1_m6_lesson2', 1, 'Complete both: "That is ______ book" and "That book is ______." (I)', 'my book / mine', NULL),
  ('sc_l1_m6_lesson2_2', 'sc_l1_m6_lesson2', 2, 'Correct: "This is hers book."', 'This is her book. / This book is hers.', 'Possessive adjective before a noun, possessive pronoun alone.'),
  ('sc_l1_m6_lesson2_3', 'sc_l1_m6_lesson2', 3, 'Ask who owns something.', 'Whose is this? / Whose book is this?', NULL);

INSERT INTO self_checks (id, learning_item_id, intro) VALUES
  ('sc_l1_m7_lesson1', 'itm_l1_m7_lesson1', 'Check that you can talk about yesterday with regular verbs.');
INSERT INTO self_check_items (id, self_check_id, sequence, prompt, answer, trap) VALUES
  ('sc_l1_m7_lesson1_1', 'sc_l1_m7_lesson1', 1, 'Past of: work, live, study, stop.', 'worked, lived, studied, stopped', 'Spelling changes: -y to -ied, and the doubled consonant in stopped.'),
  ('sc_l1_m7_lesson1_2', 'sc_l1_m7_lesson1', 2, 'Make negative: "I watched television."', 'I didn''t watch television.', 'The -ed disappears after ''didn''t''. Learners keep it for weeks.'),
  ('sc_l1_m7_lesson1_3', 'sc_l1_m7_lesson1', 3, 'Say how you pronounce the -ed in ''watched'', ''played'', ''wanted''.', '/t/, /d/, /ɪd/ — three sounds, one spelling.', NULL);

INSERT INTO self_checks (id, learning_item_id, intro) VALUES
  ('sc_l1_m7_lesson2', 'itm_l1_m7_lesson2', 'Check that you can use irregular pasts and ask past questions.');
INSERT INTO self_check_items (id, self_check_id, sequence, prompt, answer, trap) VALUES
  ('sc_l1_m7_lesson2_1', 'sc_l1_m7_lesson2', 1, 'Past of: go, have, see, eat, come.', 'went, had, saw, ate, came', NULL),
  ('sc_l1_m7_lesson2_2', 'sc_l1_m7_lesson2', 2, 'Ask: did they arrive? Then answer no.', 'Did they arrive? — No, they didn''t.', NULL),
  ('sc_l1_m7_lesson2_3', 'sc_l1_m7_lesson2', 3, 'Ask where someone went last weekend.', 'Where did you go last weekend?', 'Not ''Where did you went'' — the auxiliary carries the past.');

INSERT INTO self_checks (id, learning_item_id, intro) VALUES
  ('sc_l1_m8_lesson1', 'itm_l1_m8_lesson1', 'Check that you can talk about what you can and cannot do.');
INSERT INTO self_check_items (id, self_check_id, sequence, prompt, answer, trap) VALUES
  ('sc_l1_m8_lesson1_1', 'sc_l1_m8_lesson1', 1, 'Say you are able to swim but not to drive.', 'I can swim but I can''t drive.', NULL),
  ('sc_l1_m8_lesson1_2', 'sc_l1_m8_lesson1', 2, 'Ask if someone can cook, and give a short answer.', 'Can you cook? — Yes, I can. / No, I can''t.', NULL),
  ('sc_l1_m8_lesson1_3', 'sc_l1_m8_lesson1', 3, 'What is wrong with "I can to play the piano"?', 'No ''to'' after can: I can play the piano.', 'The infinitive marker after modals is a persistent error.');

INSERT INTO self_checks (id, learning_item_id, intro) VALUES
  ('sc_l1_m8_lesson2', 'itm_l1_m8_lesson2', 'Check that you can talk about plans.');
INSERT INTO self_check_items (id, self_check_id, sequence, prompt, answer, trap) VALUES
  ('sc_l1_m8_lesson2_1', 'sc_l1_m8_lesson2', 1, 'Say what you intend to do tomorrow.', 'I''m going to + base verb. E.g. I''m going to visit my sister.', NULL),
  ('sc_l1_m8_lesson2_2', 'sc_l1_m8_lesson2', 2, 'Ask what someone is going to do at the weekend.', 'What are you going to do at the weekend?', NULL),
  ('sc_l1_m8_lesson2_3', 'sc_l1_m8_lesson2', 3, 'What is the difference between "I''m going to the shop" and "I''m going to buy bread"?', 'The first is movement; the second is intention. ''Going to'' plus a verb is a plan.', 'The overlap between the two ''going to'' uses causes real confusion here.');

INSERT INTO self_checks (id, learning_item_id, intro) VALUES
  ('sc_l1_m9_lesson1', 'itm_l1_m9_lesson1', 'Check that you can describe a health problem and how you feel.');
INSERT INTO self_check_items (id, self_check_id, sequence, prompt, answer, trap) VALUES
  ('sc_l1_m9_lesson1_1', 'sc_l1_m9_lesson1', 1, 'Name five parts of the body.', 'e.g. head, arm, leg, stomach, back', NULL),
  ('sc_l1_m9_lesson1_2', 'sc_l1_m9_lesson1', 2, 'Complete: "I ______ a headache" and "I ______ tired."', 'I HAVE a headache / I FEEL tired.', 'Have for the problem, feel for the state — mixing them is very common.'),
  ('sc_l1_m9_lesson1_3', 'sc_l1_m9_lesson1', 3, 'Ask someone what is wrong.', 'What''s the matter? / How are you feeling?', NULL);

INSERT INTO self_checks (id, learning_item_id, intro) VALUES
  ('sc_l1_m9_lesson2', 'itm_l1_m9_lesson2', 'Check that you can give and receive simple advice.');
INSERT INTO self_check_items (id, self_check_id, sequence, prompt, answer, trap) VALUES
  ('sc_l1_m9_lesson2_1', 'sc_l1_m9_lesson2', 1, 'Give advice to someone with a cold.', 'You should drink water and rest. / You shouldn''t go to work.', NULL),
  ('sc_l1_m9_lesson2_2', 'sc_l1_m9_lesson2', 2, 'What is wrong with "You should to see a doctor"?', 'No ''to'': You should see a doctor.', NULL),
  ('sc_l1_m9_lesson2_3', 'sc_l1_m9_lesson2', 3, 'Respond to advice you intend to follow.', 'That''s a good idea, thank you. / You''re right, I will.', 'Silence or a bare ''OK'' reads as dismissal in English; the response has to acknowledge the advice.');

INSERT INTO self_checks (id, learning_item_id, intro) VALUES
  ('sc_l1_m10_revlesson', 'itm_l1_m10_revlesson', 'Check that you can choose the right structure from the whole level without being told which one.');
INSERT INTO self_check_items (id, self_check_id, sequence, prompt, answer, trap) VALUES
  ('sc_l1_m10_revlesson_1', 'sc_l1_m10_revlesson', 1, 'You want to describe what is in your bag right now.', 'There is / There are + objects.', NULL),
  ('sc_l1_m10_revlesson_2', 'sc_l1_m10_revlesson', 2, 'You want to describe what you did yesterday evening.', 'Simple past — regular and irregular verbs.', NULL),
  ('sc_l1_m10_revlesson_3', 'sc_l1_m10_revlesson', 3, 'You want to say what you intend to do next month.', 'Going to + base verb.', NULL),
  ('sc_l1_m10_revlesson_4', 'sc_l1_m10_revlesson', 4, 'You want to give a friend advice about studying.', 'should / shouldn''t + base verb.', 'Selecting the structure without a prompt is the skill this level ends on; recognising each in isolation is easier than choosing between them.');
