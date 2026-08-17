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

-- ── Levels II and III ────────────────────────────────────────────────

INSERT INTO self_checks (id, learning_item_id, intro) VALUES
  ('sc_l2_m1_lesson1', 'itm_l2_m1_lesson1', 'Check that you can tell a background from an event, and choose the right past tense for each.');
INSERT INTO self_check_items (id, self_check_id, sequence, prompt, answer, trap) VALUES
  ('sc_l2_m1_lesson1_1', 'sc_l2_m1_lesson1', 1, 'Complete: "I ______ (cook) when the phone ______ (ring)."', 'was cooking / rang', 'The longer action takes the continuous; the interrupting event takes the simple past.'),
  ('sc_l2_m1_lesson1_2', 'sc_l2_m1_lesson1', 2, 'Which is the background and which is the event: "While we were walking, it started to rain"?', 'Background: we were walking. Event: it started to rain.', NULL),
  ('sc_l2_m1_lesson1_3', 'sc_l2_m1_lesson1', 3, 'Correct: "What did you doing at eight o''clock?"', 'What were you doing at eight o''clock?', 'Mixing the two auxiliaries is the commonest error here.');

INSERT INTO self_checks (id, learning_item_id, intro) VALUES
  ('sc_l2_m1_lesson2', 'itm_l2_m1_lesson2', 'Check that you can talk about what was true before but is not now.');
INSERT INTO self_check_items (id, self_check_id, sequence, prompt, answer, trap) VALUES
  ('sc_l2_m1_lesson2_1', 'sc_l2_m1_lesson2', 1, 'Say you played football as a child but no longer do.', 'I used to play football.', NULL),
  ('sc_l2_m1_lesson2_2', 'sc_l2_m1_lesson2', 2, 'Make the negative and the question.', 'I didn''t use to play football. / Did you use to play football?', 'Note the spelling: ''use to'', not ''used to'', after did.'),
  ('sc_l2_m1_lesson2_3', 'sc_l2_m1_lesson2', 3, 'Is "I used to living in Rome" correct?', 'No: I used to live in Rome. ''Used to'' takes the base verb.', 'Confusion with ''be used to + -ing'', which means something different.');

INSERT INTO self_checks (id, learning_item_id, intro) VALUES
  ('sc_l2_m2_lesson1', 'itm_l2_m2_lesson1', 'Check that you can compare two things and pick out the best of many.');
INSERT INTO self_check_items (id, self_check_id, sequence, prompt, answer, trap) VALUES
  ('sc_l2_m2_lesson1_1', 'sc_l2_m2_lesson1', 1, 'Comparative and superlative of: big, expensive, good, far.', 'bigger/biggest, more expensive/most expensive, better/best, further/furthest', NULL),
  ('sc_l2_m2_lesson1_2', 'sc_l2_m2_lesson1', 2, 'Complete: "This hotel is cheaper ______ that one."', 'than', '''Cheaper that'' and ''more cheaper'' are the two errors to watch for.'),
  ('sc_l2_m2_lesson1_3', 'sc_l2_m2_lesson1', 3, 'What is wrong with "She is the most tallest"?', 'Double superlative: she is the tallest.', NULL);

INSERT INTO self_checks (id, learning_item_id, intro) VALUES
  ('sc_l2_m2_lesson2', 'itm_l2_m2_lesson2', 'Check that you can book travel and ask about times.');
INSERT INTO self_check_items (id, self_check_id, sequence, prompt, answer, trap) VALUES
  ('sc_l2_m2_lesson2_1', 'sc_l2_m2_lesson2', 1, 'Ask for a return ticket to Manchester.', 'A return to Manchester, please. / Could I have a return to Manchester?', NULL),
  ('sc_l2_m2_lesson2_2', 'sc_l2_m2_lesson2', 2, 'Ask what time the last train leaves.', 'What time does the last train leave?', NULL),
  ('sc_l2_m2_lesson2_3', 'sc_l2_m2_lesson2', 3, 'What is the difference between ''single'' and ''return''?', 'Single = one way. Return = there and back.', 'In American English these are ''one-way'' and ''round-trip''.');

INSERT INTO self_checks (id, learning_item_id, intro) VALUES
  ('sc_l2_m3_lesson1', 'itm_l2_m3_lesson1', 'Check that you can tell a habit from something happening now.');
INSERT INTO self_check_items (id, self_check_id, sequence, prompt, answer, trap) VALUES
  ('sc_l2_m3_lesson1_1', 'sc_l2_m3_lesson1', 1, 'Complete: "He usually ______ (work) in Rome, but this month he ______ (work) in Paris."', 'works / is working', 'Habit takes the simple; the temporary situation takes the continuous.'),
  ('sc_l2_m3_lesson1_2', 'sc_l2_m3_lesson1', 2, 'Which verbs do not normally take the continuous? Name three.', 'know, want, believe, understand, like, need — state verbs.', '''I am knowing'' is a persistent error at this level.'),
  ('sc_l2_m3_lesson1_3', 'sc_l2_m3_lesson1', 3, 'Correct: "What do you do right now?"', 'What are you doing right now?', NULL);

INSERT INTO self_checks (id, learning_item_id, intro) VALUES
  ('sc_l2_m3_lesson2', 'itm_l2_m3_lesson2', 'Check that you can describe your work or studies.');
INSERT INTO self_check_items (id, self_check_id, sequence, prompt, answer, trap) VALUES
  ('sc_l2_m3_lesson2_1', 'sc_l2_m3_lesson2', 1, 'Describe what you are responsible for.', 'I''m responsible for + noun/-ing. E.g. I''m responsible for training new staff.', NULL),
  ('sc_l2_m3_lesson2_2', 'sc_l2_m3_lesson2', 2, 'Ask someone what their job involves.', 'What does your job involve? / What do you do exactly?', NULL),
  ('sc_l2_m3_lesson2_3', 'sc_l2_m3_lesson2', 3, 'Say what you want to do in five years.', 'I''d like to / I hope to + base verb.', NULL);

INSERT INTO self_checks (id, learning_item_id, intro) VALUES
  ('sc_l2_m4_lesson1', 'itm_l2_m4_lesson1', 'Check that you can say what you enjoy using the -ing form.');
INSERT INTO self_check_items (id, self_check_id, sequence, prompt, answer, trap) VALUES
  ('sc_l2_m4_lesson1_1', 'sc_l2_m4_lesson1', 1, 'Complete: "I enjoy ______ (read) before bed."', 'reading', '''I enjoy to read'' is wrong: enjoy takes the gerund.'),
  ('sc_l2_m4_lesson1_2', 'sc_l2_m4_lesson1', 2, 'Which of these take the gerund: enjoy, want, avoid, decide, mind?', 'enjoy, avoid, mind take the gerund. want and decide take the infinitive.', 'There is no rule — the verb decides, and the list has to be learned.'),
  ('sc_l2_m4_lesson1_3', 'sc_l2_m4_lesson1', 3, 'Rank three activities from strongest liking to weakest.', 'I love... I quite like... I don''t really like...', NULL);

INSERT INTO self_checks (id, learning_item_id, intro) VALUES
  ('sc_l2_m4_lesson2', 'itm_l2_m4_lesson2', 'Check that you can give an opinion and respond to someone else''s.');
INSERT INTO self_check_items (id, self_check_id, sequence, prompt, answer, trap) VALUES
  ('sc_l2_m4_lesson2_1', 'sc_l2_m4_lesson2', 1, 'Give an opinion with a reason.', 'I think + opinion + because + reason.', NULL),
  ('sc_l2_m4_lesson2_2', 'sc_l2_m4_lesson2', 2, 'Disagree politely.', 'I see what you mean, but... / I''m not sure I agree, because...', 'A bare ''No, you''re wrong'' is heard as rude in most English-speaking settings.'),
  ('sc_l2_m4_lesson2_3', 'sc_l2_m4_lesson2', 3, 'Ask what someone else thinks.', 'What do you think? / How do you feel about that?', NULL);

INSERT INTO self_checks (id, learning_item_id, intro) VALUES
  ('sc_l2_m5_lesson1', 'itm_l2_m5_lesson1', 'Check that you can choose between will, going to and the present continuous.');
INSERT INTO self_check_items (id, self_check_id, sequence, prompt, answer, trap) VALUES
  ('sc_l2_m5_lesson1_1', 'sc_l2_m5_lesson1', 1, 'You decide right now to help. Which form?', 'I''ll help — ''will'' for a decision made at the moment of speaking.', NULL),
  ('sc_l2_m5_lesson1_2', 'sc_l2_m5_lesson1', 2, 'You decided last week to move house. Which form?', 'I''m going to move house — a plan already made.', NULL),
  ('sc_l2_m5_lesson1_3', 'sc_l2_m5_lesson1', 3, 'You have a dentist appointment booked for Tuesday. Which form?', 'I''m seeing the dentist on Tuesday — present continuous for a fixed arrangement.', 'All three are ''future''; the difference is when the decision was made and how fixed it is.');

INSERT INTO self_checks (id, learning_item_id, intro) VALUES
  ('sc_l2_m5_lesson2', 'itm_l2_m5_lesson2', 'Check that you can invite, accept and decline.');
INSERT INTO self_check_items (id, self_check_id, sequence, prompt, answer, trap) VALUES
  ('sc_l2_m5_lesson2_1', 'sc_l2_m5_lesson2', 1, 'Invite someone to dinner politely.', 'Would you like to come to dinner on Friday?', NULL),
  ('sc_l2_m5_lesson2_2', 'sc_l2_m5_lesson2', 2, 'Decline without giving offence.', 'I''d love to, but I''m afraid I''m busy on Friday. Could we do another day?', 'A decline without a reason or an alternative reads as a rejection of the person.'),
  ('sc_l2_m5_lesson2_3', 'sc_l2_m5_lesson2', 3, 'Accept with enthusiasm.', 'I''d love to, thank you! What time?', NULL);

INSERT INTO self_checks (id, learning_item_id, intro) VALUES
  ('sc_l2_m6_lesson1', 'itm_l2_m6_lesson1', 'Check that you can describe a place as it used to be.');
INSERT INTO self_check_items (id, self_check_id, sequence, prompt, answer, trap) VALUES
  ('sc_l2_m6_lesson1_1', 'sc_l2_m6_lesson1', 1, 'Complete: "______ a cinema here, and ______ two shops next to it."', 'There was a cinema / there were two shops', NULL),
  ('sc_l2_m6_lesson1_2', 'sc_l2_m6_lesson1', 2, 'Make it negative and a question.', 'There wasn''t a cinema. / Was there a cinema here?', NULL),
  ('sc_l2_m6_lesson1_3', 'sc_l2_m6_lesson1', 3, 'Combine with ''used to'': describe the street.', 'There used to be a cinema here.', '''There used to be'' works for both singular and plural — a useful shortcut.');

INSERT INTO self_checks (id, learning_item_id, intro) VALUES
  ('sc_l2_m6_lesson2', 'itm_l2_m6_lesson2', 'Check that you can weigh one place against another.');
INSERT INTO self_check_items (id, self_check_id, sequence, prompt, answer, trap) VALUES
  ('sc_l2_m6_lesson2_1', 'sc_l2_m6_lesson2', 1, 'Give one advantage of the countryside using a comparative.', 'The countryside is quieter than the city.', NULL),
  ('sc_l2_m6_lesson2_2', 'sc_l2_m6_lesson2', 2, 'Give a disadvantage using ''fewer'' or ''less''.', 'There are fewer buses. / There is less noise.', '''Fewer'' for countable, ''less'' for uncountable — a distinction native speakers often lose but examiners keep.'),
  ('sc_l2_m6_lesson2_3', 'sc_l2_m6_lesson2', 3, 'Balance the two in one sentence.', 'Although the city is more expensive, it offers more opportunities.', NULL);

INSERT INTO self_checks (id, learning_item_id, intro) VALUES
  ('sc_l2_m7_lesson1', 'itm_l2_m7_lesson1', 'Check that you can say how often and put the adverb in the right place.');
INSERT INTO self_check_items (id, self_check_id, sequence, prompt, answer, trap) VALUES
  ('sc_l2_m7_lesson1_1', 'sc_l2_m7_lesson1', 1, 'Put ''always'' in: "I am late." and "I get up at six."', 'I am always late. / I always get up at six.', 'After ''be'', before other verbs — the single rule that governs all of them.'),
  ('sc_l2_m7_lesson1_2', 'sc_l2_m7_lesson1', 2, 'Order from most to least often: rarely, always, often, never, sometimes.', 'always, often, sometimes, rarely, never', NULL),
  ('sc_l2_m7_lesson1_3', 'sc_l2_m7_lesson1', 3, 'Ask how often someone exercises.', 'How often do you exercise?', NULL);

INSERT INTO self_checks (id, learning_item_id, intro) VALUES
  ('sc_l2_m7_lesson2', 'itm_l2_m7_lesson2', 'Check that you can give stronger advice than ''should''.');
INSERT INTO self_check_items (id, self_check_id, sequence, prompt, answer, trap) VALUES
  ('sc_l2_m7_lesson2_1', 'sc_l2_m7_lesson2', 1, 'Give advice using ''if I were you''.', 'If I were you, I''d see a doctor.', '''If I was you'' is heard, but ''were'' is the form assessed here.'),
  ('sc_l2_m7_lesson2_2', 'sc_l2_m7_lesson2', 2, 'Give urgent advice using "''d better".', 'You''d better call them today.', NULL),
  ('sc_l2_m7_lesson2_3', 'sc_l2_m7_lesson2', 3, 'Which is strongest: should, really should, had better?', 'had better — it implies a bad consequence if ignored.', NULL);

INSERT INTO self_checks (id, learning_item_id, intro) VALUES
  ('sc_l2_m8_lesson1', 'itm_l2_m8_lesson1', 'Check that you can ask a full range of past questions.');
INSERT INTO self_check_items (id, self_check_id, sequence, prompt, answer, trap) VALUES
  ('sc_l2_m8_lesson1_1', 'sc_l2_m8_lesson1', 1, 'Ask three questions about a purchase: where, when, how much.', 'Where did you buy it? When did you buy it? How much did it cost?', NULL),
  ('sc_l2_m8_lesson1_2', 'sc_l2_m8_lesson1', 2, 'Correct: "Where you bought it?"', 'Where did you buy it?', 'The auxiliary is compulsory in wh- questions except when asking about the subject.'),
  ('sc_l2_m8_lesson1_3', 'sc_l2_m8_lesson1', 3, 'Ask who paid — the subject question.', 'Who paid?', 'No ''did'' when the wh- word IS the subject. This exception catches almost everyone.');

INSERT INTO self_checks (id, learning_item_id, intro) VALUES
  ('sc_l2_m8_lesson2', 'itm_l2_m8_lesson2', 'Check that you can complain and ask for a solution without rudeness.');
INSERT INTO self_check_items (id, self_check_id, sequence, prompt, answer, trap) VALUES
  ('sc_l2_m8_lesson2_1', 'sc_l2_m8_lesson2', 1, 'Open a complaint politely.', 'I''m afraid there''s a problem with... / I''d like to make a complaint about...', NULL),
  ('sc_l2_m8_lesson2_2', 'sc_l2_m8_lesson2', 2, 'Ask for a specific remedy.', 'Could I have a refund/replacement, please?', 'A complaint without a requested remedy usually produces sympathy and no action.'),
  ('sc_l2_m8_lesson2_3', 'sc_l2_m8_lesson2', 3, 'Respond when the answer is no.', 'I understand, but I''d like to speak to a manager, please.', NULL);

INSERT INTO self_checks (id, learning_item_id, intro) VALUES
  ('sc_l2_m9_lesson1', 'itm_l2_m9_lesson1', 'Check that you can order the events of a story clearly.');
INSERT INTO self_check_items (id, self_check_id, sequence, prompt, answer, trap) VALUES
  ('sc_l2_m9_lesson1_1', 'sc_l2_m9_lesson1', 1, 'Put in order: Suddenly, At first, Finally, Then.', 'At first, Then, Suddenly, Finally', NULL),
  ('sc_l2_m9_lesson1_2', 'sc_l2_m9_lesson1', 2, 'Which tense for the scene, and which for the events?', 'Past continuous sets the scene; past simple carries the events.', NULL),
  ('sc_l2_m9_lesson1_3', 'sc_l2_m9_lesson1', 3, 'Join two events showing one interrupted the other.', 'I was leaving the house when the phone rang.', NULL);

INSERT INTO self_checks (id, learning_item_id, intro) VALUES
  ('sc_l2_m9_lesson2', 'itm_l2_m9_lesson2', 'Check that you can open a story so that someone wants to hear the rest.');
INSERT INTO self_check_items (id, self_check_id, sequence, prompt, answer, trap) VALUES
  ('sc_l2_m9_lesson2_1', 'sc_l2_m9_lesson2', 1, 'Open a story with a hook.', 'You''ll never believe what happened to me yesterday. / The strangest thing happened on the way home.', NULL),
  ('sc_l2_m9_lesson2_2', 'sc_l2_m9_lesson2', 2, 'Where should the turning point come — early, middle, or end?', 'After the scene is set and before the resolution. A story with the surprise in the first sentence has nowhere to go.', NULL),
  ('sc_l2_m9_lesson2_3', 'sc_l2_m9_lesson2', 3, 'End without trailing off.', 'And that''s why I never take that route any more.', 'Learners often stop when the events stop, leaving the listener waiting for a point.');

INSERT INTO self_checks (id, learning_item_id, intro) VALUES
  ('sc_l2_m10_revlesson', 'itm_l2_m10_revlesson', 'Check that you can choose the right structure from the whole level without being told which.');
INSERT INTO self_check_items (id, self_check_id, sequence, prompt, answer, trap) VALUES
  ('sc_l2_m10_revlesson_1', 'sc_l2_m10_revlesson', 1, 'You want to describe what you were doing when something interrupted.', 'Past continuous + past simple.', NULL),
  ('sc_l2_m10_revlesson_2', 'sc_l2_m10_revlesson', 2, 'You want to compare two cities.', 'Comparatives, and ''than''.', NULL),
  ('sc_l2_m10_revlesson_3', 'sc_l2_m10_revlesson', 3, 'You want to describe an arrangement already fixed for Saturday.', 'Present continuous for the future.', NULL),
  ('sc_l2_m10_revlesson_4', 'sc_l2_m10_revlesson', 4, 'You want to give strong advice to a friend.', 'If I were you, I''d... / You''d better...', 'Choosing between the structures unprompted is the skill; recognising each alone is easier.');

INSERT INTO self_checks (id, learning_item_id, intro) VALUES
  ('sc_l3_m1_lesson1', 'itm_l3_m1_lesson1', 'Check that you can talk about experience without saying when.');
INSERT INTO self_check_items (id, self_check_id, sequence, prompt, answer, trap) VALUES
  ('sc_l3_m1_lesson1_1', 'sc_l3_m1_lesson1', 1, 'Ask whether someone has ever been to Japan, and answer no.', 'Have you ever been to Japan? — No, I haven''t.', NULL),
  ('sc_l3_m1_lesson1_2', 'sc_l3_m1_lesson1', 2, 'Past participles of: go, see, write, eat, take.', 'gone/been, seen, written, eaten, taken', '''Been'' and ''gone'' differ: she has been (and returned) / she has gone (and is still there).'),
  ('sc_l3_m1_lesson1_3', 'sc_l3_m1_lesson1', 3, 'What is wrong with "I have seen him yesterday"?', 'A specific past time forces the past simple: I saw him yesterday.', 'This is the single most persistent error at Level III.');

INSERT INTO self_checks (id, learning_item_id, intro) VALUES
  ('sc_l3_m1_lesson2', 'itm_l3_m1_lesson2', 'Check that you can switch to the past simple as soon as a time is named.');
INSERT INTO self_check_items (id, self_check_id, sequence, prompt, answer, trap) VALUES
  ('sc_l3_m1_lesson2_1', 'sc_l3_m1_lesson2', 1, 'Continue: "I''ve been to Rome." — "When ______ you ______ there?"', 'did you go — the question names a time, so the tense shifts.', NULL),
  ('sc_l3_m1_lesson2_2', 'sc_l3_m1_lesson2', 2, 'Which is right: "I''ve lived here in 2019" or "I lived here in 2019"?', 'I lived here in 2019.', NULL),
  ('sc_l3_m1_lesson2_3', 'sc_l3_m1_lesson2', 3, 'Ask a natural follow-up to "I''ve read that book."', 'When did you read it? / What did you think of it?', NULL);

INSERT INTO self_checks (id, learning_item_id, intro) VALUES
  ('sc_l3_m2_lesson1', 'itm_l3_m2_lesson1', 'Check that you can describe an activity still going on.');
INSERT INTO self_check_items (id, self_check_id, sequence, prompt, answer, trap) VALUES
  ('sc_l3_m2_lesson1_1', 'sc_l3_m2_lesson1', 1, 'Complete: "I ______ ______ ______ (study) English for three years."', 'have been studying', NULL),
  ('sc_l3_m2_lesson1_2', 'sc_l3_m2_lesson1', 2, 'What is the difference between "I''ve read that book" and "I''ve been reading that book"?', 'The first is finished; the second is still going on.', 'The continuous emphasises duration and incompleteness.'),
  ('sc_l3_m2_lesson1_3', 'sc_l3_m2_lesson1', 3, 'Which is wrong: "I''ve been knowing him for years"?', 'State verbs do not take the continuous: I''ve known him for years.', NULL);

INSERT INTO self_checks (id, learning_item_id, intro) VALUES
  ('sc_l3_m2_lesson2', 'itm_l3_m2_lesson2', 'Check that you can take notes and say something back in your own words.');
INSERT INTO self_check_items (id, self_check_id, sequence, prompt, answer, trap) VALUES
  ('sc_l3_m2_lesson2_1', 'sc_l3_m2_lesson2', 1, 'What should a note capture — the words or the point?', 'The point. Notes that copy wording become transcription and stop being useful.', NULL),
  ('sc_l3_m2_lesson2_2', 'sc_l3_m2_lesson2', 2, 'Paraphrase: "The scheme was introduced without consultation and abandoned within a month."', 'Nobody was asked before it started, and it was dropped four weeks later.', 'Changing six words and keeping the structure is substitution, not paraphrase.'),
  ('sc_l3_m2_lesson2_3', 'sc_l3_m2_lesson2', 3, 'What must a summary always keep?', 'The source''s main claim, and the proportion — a minor point must not become the headline.', NULL);

INSERT INTO self_checks (id, learning_item_id, intro) VALUES
  ('sc_l3_m3_lesson1', 'itm_l3_m3_lesson1', 'Check that you can state a general rule with the zero conditional.');
INSERT INTO self_check_items (id, self_check_id, sequence, prompt, answer, trap) VALUES
  ('sc_l3_m3_lesson1_1', 'sc_l3_m3_lesson1', 1, 'Complete: "If you ______ (heat) water to 100 degrees, it ______ (boil)."', 'heat / boils', 'Both clauses are present simple. ''Will boil'' turns a fact into a prediction.'),
  ('sc_l3_m3_lesson1_2', 'sc_l3_m3_lesson1', 2, 'Write a workplace rule with ''if''.', 'If a client complains, we respond within 24 hours.', NULL),
  ('sc_l3_m3_lesson1_3', 'sc_l3_m3_lesson1', 3, 'Can ''when'' replace ''if'' here?', 'Yes, when the result is certain: When water reaches 100 degrees, it boils.', NULL);

INSERT INTO self_checks (id, learning_item_id, intro) VALUES
  ('sc_l3_m3_lesson2', 'itm_l3_m3_lesson2', 'Check that you can talk about a real future possibility.');
INSERT INTO self_check_items (id, self_check_id, sequence, prompt, answer, trap) VALUES
  ('sc_l3_m3_lesson2_1', 'sc_l3_m3_lesson2', 1, 'Complete: "If we ______ (launch) in June, we ______ (reach) more customers."', 'launch / will reach', 'No ''will'' in the if-clause: ''If we will launch'' is the error to watch.'),
  ('sc_l3_m3_lesson2_2', 'sc_l3_m3_lesson2', 2, 'What is the difference between the zero and first conditional?', 'Zero = always true. First = one specific future possibility.', NULL),
  ('sc_l3_m3_lesson2_3', 'sc_l3_m3_lesson2', 3, 'Make it less certain using ''might''.', 'If we launch in June, we might reach more customers.', NULL);

INSERT INTO self_checks (id, learning_item_id, intro) VALUES
  ('sc_l3_m4_lesson1', 'itm_l3_m4_lesson1', 'Check that you can state an opinion formally and justify it.');
INSERT INTO self_check_items (id, self_check_id, sequence, prompt, answer, trap) VALUES
  ('sc_l3_m4_lesson1_1', 'sc_l3_m4_lesson1', 1, 'Give an opinion using a formal phrase.', 'In my view... / From my perspective... / I would argue that...', NULL),
  ('sc_l3_m4_lesson1_2', 'sc_l3_m4_lesson1', 2, 'Add a justification and a limit.', '...because..., although I accept that...', NULL),
  ('sc_l3_m4_lesson1_3', 'sc_l3_m4_lesson1', 3, 'Why is "I think it''s good" weak in an academic setting?', 'No reason and no qualification: an opinion without either cannot be argued with or agreed with usefully.', NULL);

INSERT INTO self_checks (id, learning_item_id, intro) VALUES
  ('sc_l3_m4_lesson2', 'itm_l3_m4_lesson2', 'Check that you can agree partially rather than only yes or no.');
INSERT INTO self_check_items (id, self_check_id, sequence, prompt, answer, trap) VALUES
  ('sc_l3_m4_lesson2_1', 'sc_l3_m4_lesson2', 1, 'Agree partially with: "Exams should be abolished."', 'I agree up to a point — high-stakes exams are a problem, but some form of assessment is necessary.', NULL),
  ('sc_l3_m4_lesson2_2', 'sc_l3_m4_lesson2', 2, 'Disagree formally without hostility.', 'I take your point, but the evidence suggests otherwise.', NULL),
  ('sc_l3_m4_lesson2_3', 'sc_l3_m4_lesson2', 3, 'What does a partial agreement need that a full agreement does not?', 'A statement of exactly which part you accept, and which you do not.', '''I agree and disagree'' without naming the parts says nothing.');

INSERT INTO self_checks (id, learning_item_id, intro) VALUES
  ('sc_l3_m5_lesson1', 'itm_l3_m5_lesson1', 'Check that you can describe a process without naming who does it.');
INSERT INTO self_check_items (id, self_check_id, sequence, prompt, answer, trap) VALUES
  ('sc_l3_m5_lesson1_1', 'sc_l3_m5_lesson1', 1, 'Make passive: "They recycle plastic in this plant."', 'Plastic is recycled in this plant.', NULL),
  ('sc_l3_m5_lesson1_2', 'sc_l3_m5_lesson1', 2, 'When is the passive the right choice?', 'When the agent is unknown, obvious, or unimportant — the process matters, not the doer.', NULL),
  ('sc_l3_m5_lesson1_3', 'sc_l3_m5_lesson1', 3, 'Correct: "The bottles are collect every week."', 'are collected — the passive needs the past participle.', NULL);

INSERT INTO self_checks (id, learning_item_id, intro) VALUES
  ('sc_l3_m5_lesson2', 'itm_l3_m5_lesson2', 'Check that you can report a past event in the passive.');
INSERT INTO self_check_items (id, self_check_id, sequence, prompt, answer, trap) VALUES
  ('sc_l3_m5_lesson2_1', 'sc_l3_m5_lesson2', 1, 'Make passive: "A storm damaged the roof."', 'The roof was damaged by a storm.', NULL),
  ('sc_l3_m5_lesson2_2', 'sc_l3_m5_lesson2', 2, 'When should you keep ''by + agent''?', 'When the agent is genuinely informative. Otherwise it adds words and no meaning.', NULL),
  ('sc_l3_m5_lesson2_3', 'sc_l3_m5_lesson2', 3, 'Complete: "The area ______ ______ (affect) badly."', 'was affected', NULL);

INSERT INTO self_checks (id, learning_item_id, intro) VALUES
  ('sc_l3_m6_lesson1', 'itm_l3_m6_lesson1', 'Check that you can report what someone said.');
INSERT INTO self_check_items (id, self_check_id, sequence, prompt, answer, trap) VALUES
  ('sc_l3_m6_lesson1_1', 'sc_l3_m6_lesson1', 1, 'Report: "I am tired," she said.', 'She said (that) she was tired.', 'The backshift is the whole skill: present becomes past.'),
  ('sc_l3_m6_lesson1_2', 'sc_l3_m6_lesson1', 2, 'Report: "We will call you," they said.', 'They said they would call me.', NULL),
  ('sc_l3_m6_lesson1_3', 'sc_l3_m6_lesson1', 3, 'What is the difference between ''said'' and ''told''?', '''Told'' needs a person: he told ME. ''Said'' does not: he said that...', '''He said me'' is the error this distinction exists to prevent.');

INSERT INTO self_checks (id, learning_item_id, intro) VALUES
  ('sc_l3_m6_lesson2', 'itm_l3_m6_lesson2', 'Check that you can tell a fact from an opinion in what you read.');
INSERT INTO self_check_items (id, self_check_id, sequence, prompt, answer, trap) VALUES
  ('sc_l3_m6_lesson2_1', 'sc_l3_m6_lesson2', 1, 'Fact or opinion: "The scheme cost £4 million." / "The scheme was a waste of money."', 'Fact / opinion.', NULL),
  ('sc_l3_m6_lesson2_2', 'sc_l3_m6_lesson2', 2, 'Name two signs of a misleading headline.', 'A question that the article does not answer; a number with no comparison; emotive verbs for neutral events.', NULL),
  ('sc_l3_m6_lesson2_3', 'sc_l3_m6_lesson2', 3, 'What should you check before trusting a statistic?', 'Who collected it, from how many people, and compared with what.', NULL);

INSERT INTO self_checks (id, learning_item_id, intro) VALUES
  ('sc_l3_m7_lesson1', 'itm_l3_m7_lesson1', 'Check that you can express how sure you are.');
INSERT INTO self_check_items (id, self_check_id, sequence, prompt, answer, trap) VALUES
  ('sc_l3_m7_lesson1_1', 'sc_l3_m7_lesson1', 1, 'Rank by certainty: might, must, can''t.', 'must (confident yes), might (possible), can''t (confident no)', NULL),
  ('sc_l3_m7_lesson1_2', 'sc_l3_m7_lesson1', 2, 'He has not eaten since morning. Deduce.', 'He must be hungry.', NULL),
  ('sc_l3_m7_lesson1_3', 'sc_l3_m7_lesson1', 3, 'What is wrong with "He must to be tired"?', 'No ''to'' after a modal: he must be tired.', NULL);

INSERT INTO self_checks (id, learning_item_id, intro) VALUES
  ('sc_l3_m7_lesson2', 'itm_l3_m7_lesson2', 'Check that you can deduce about the past.');
INSERT INTO self_check_items (id, self_check_id, sequence, prompt, answer, trap) VALUES
  ('sc_l3_m7_lesson2_1', 'sc_l3_m7_lesson2', 1, 'She looked exhausted yesterday. Deduce.', 'She must have been working late.', NULL),
  ('sc_l3_m7_lesson2_2', 'sc_l3_m7_lesson2', 2, 'Form: must/might/can''t + what?', '+ have + past participle.', NULL),
  ('sc_l3_m7_lesson2_3', 'sc_l3_m7_lesson2', 3, 'Correct: "He can''t have went home already."', 'He can''t have gone home already.', 'The participle, not the past simple, after ''have''.');

INSERT INTO self_checks (id, learning_item_id, intro) VALUES
  ('sc_l3_m8_lesson1', 'itm_l3_m8_lesson1', 'Check that you can talk about an unreal present.');
INSERT INTO self_check_items (id, self_check_id, sequence, prompt, answer, trap) VALUES
  ('sc_l3_m8_lesson1_1', 'sc_l3_m8_lesson1', 1, 'Complete: "If I ______ (have) more time, I ______ (learn) the piano."', 'had / would learn', NULL),
  ('sc_l3_m8_lesson1_2', 'sc_l3_m8_lesson1', 2, 'Is this real or imaginary?', 'Imaginary — the second conditional says the condition is not the case.', NULL),
  ('sc_l3_m8_lesson1_3', 'sc_l3_m8_lesson1', 3, 'What is wrong with "If I would have more time"?', 'No ''would'' in the if-clause: If I had more time...', 'The commonest second-conditional error and it survives into Level V if untreated.');

INSERT INTO self_checks (id, learning_item_id, intro) VALUES
  ('sc_l3_m8_lesson2', 'itm_l3_m8_lesson2', 'Check that you can describe how an action would be received elsewhere.');
INSERT INTO self_check_items (id, self_check_id, sequence, prompt, answer, trap) VALUES
  ('sc_l3_m8_lesson2_1', 'sc_l3_m8_lesson2', 1, 'Use the second conditional to describe a practice, not a people.', 'If I arrived fifteen minutes late to a dinner invitation, it would be normal in some places and rude in others.', 'Compare practices and contexts, never nationalities or characters.'),
  ('sc_l3_m8_lesson2_2', 'sc_l3_m8_lesson2', 2, 'Add a contrast with ''whereas''.', '...whereas arriving early would be unusual.', NULL),
  ('sc_l3_m8_lesson2_3', 'sc_l3_m8_lesson2', 3, 'Why avoid "In X, people always..."?', 'It states a stereotype as fact. ''It would be more common to...'' says the same thing without the claim.', NULL);

INSERT INTO self_checks (id, learning_item_id, intro) VALUES
  ('sc_l3_m9_lesson1', 'itm_l3_m9_lesson1', 'Check that you can build a paragraph around one idea.');
INSERT INTO self_check_items (id, self_check_id, sequence, prompt, answer, trap) VALUES
  ('sc_l3_m9_lesson1_1', 'sc_l3_m9_lesson1', 1, 'What does a topic sentence do?', 'States the one idea the paragraph will support — and nothing else.', NULL),
  ('sc_l3_m9_lesson1_2', 'sc_l3_m9_lesson1', 2, 'How many main ideas belong in a paragraph?', 'One. Two ideas means two paragraphs.', NULL),
  ('sc_l3_m9_lesson1_3', 'sc_l3_m9_lesson1', 3, 'What is the closing sentence for?', 'Drawing the consequence, not repeating the topic sentence in other words.', 'A conclusion that restates the opening adds length and no meaning.');

INSERT INTO self_checks (id, learning_item_id, intro) VALUES
  ('sc_l3_m9_lesson2', 'itm_l3_m9_lesson2', 'Check that you can say where an idea came from.');
INSERT INTO self_check_items (id, self_check_id, sequence, prompt, answer, trap) VALUES
  ('sc_l3_m9_lesson2_1', 'sc_l3_m9_lesson2', 1, 'Attribute a claim to a source.', 'According to Ramirez (2022)... / Ramirez argues that...', NULL),
  ('sc_l3_m9_lesson2_2', 'sc_l3_m9_lesson2', 2, 'What is the difference between quoting and paraphrasing?', 'Quoting reproduces the words exactly, in quotation marks. Paraphrasing states the idea in your own words. Both need the source.', NULL),
  ('sc_l3_m9_lesson2_3', 'sc_l3_m9_lesson2', 3, 'What happens if you paraphrase without attributing?', 'It is plagiarism, whether or not the words were changed.', 'Changing the words does not remove the obligation.');

INSERT INTO self_checks (id, learning_item_id, intro) VALUES
  ('sc_l3_m10_revlesson', 'itm_l3_m10_revlesson', 'Check that you can choose from the whole level unprompted.');
INSERT INTO self_check_items (id, self_check_id, sequence, prompt, answer, trap) VALUES
  ('sc_l3_m10_revlesson_1', 'sc_l3_m10_revlesson', 1, 'You want to say you have visited a place but not when.', 'Present perfect.', NULL),
  ('sc_l3_m10_revlesson_2', 'sc_l3_m10_revlesson', 2, 'You want to describe how something is made.', 'Present simple passive.', NULL),
  ('sc_l3_m10_revlesson_3', 'sc_l3_m10_revlesson', 3, 'You want to report what a colleague told you yesterday.', 'Reported speech with backshift.', NULL),
  ('sc_l3_m10_revlesson_4', 'sc_l3_m10_revlesson', 4, 'You want to describe an imaginary situation.', 'Second conditional.', 'The skill is selecting between them without a prompt.');

-- ── Traps added when the standard caught eight self-checks without one ──
--
-- The test requires every self-check to target at least one confusion
-- the curriculum can actually name. Eight of the thirty-eight written
-- for Levels II and III had none. Rather than relax the standard to
-- one trap per level, the eight confusions were written.

UPDATE self_check_items SET trap = '"I''m responsible of" is the near-universal error: the collocation is ''responsible FOR''.' WHERE id = 'sc_l2_m3_lesson2_1';
UPDATE self_check_items SET trap = 'Learners who know only ''after that'' use it for every transition, which flattens a story into a list.' WHERE id = 'sc_l2_m9_lesson1_1';
UPDATE self_check_items SET trap = 'The shift is triggered by the QUESTION naming a time, not by anything in the answer — so learners keep the perfect after ''When...?''' WHERE id = 'sc_l3_m1_lesson2_1';
UPDATE self_check_items SET trap = '"In my opinion, I think..." doubles the marker. One or the other, never both.' WHERE id = 'sc_l3_m4_lesson1_1';
UPDATE self_check_items SET trap = 'The auxiliary is dropped more often than the participle: "Plastic recycled here" is the error to listen for.' WHERE id = 'sc_l3_m5_lesson1_1';
UPDATE self_check_items SET trap = 'Learners who have just learned ''by + agent'' attach it to everything, which is why half of a passive paragraph ends up naming agents nobody needed.' WHERE id = 'sc_l3_m5_lesson2_2';
UPDATE self_check_items SET trap = 'A hedged opinion — "many believe", "critics say" — reads as neutral and is taken for fact more often than an obvious opinion is.' WHERE id = 'sc_l3_m6_lesson2_1';
UPDATE self_check_items SET trap = '''Must'' feels emphatic, so learners reach for it where the evidence only supports ''might''. Over-deduction is the error, not under-deduction.' WHERE id = 'sc_l3_m7_lesson1_1';

-- ── Levels IV and V ──────────────────────────────────────────────────

INSERT INTO self_checks (id, learning_item_id, intro) VALUES
  ('sc_l4_m1_lesson1', 'itm_l4_m1_lesson1', 'Check that you can order two past events without ambiguity.');
INSERT INTO self_check_items (id, self_check_id, sequence, prompt, answer, trap) VALUES
  ('sc_l4_m1_lesson1_1', 'sc_l4_m1_lesson1', 1, 'Combine: "The film started. We arrived."', 'The film had already started when we arrived.', NULL),
  ('sc_l4_m1_lesson1_2', 'sc_l4_m1_lesson1', 2, 'When is the past perfect unnecessary?', 'When ''before'' or ''after'' already fixes the order: ''She left before I arrived'' needs no perfect.', 'Over-use is the Level IV error, not under-use.'),
  ('sc_l4_m1_lesson1_3', 'sc_l4_m1_lesson1', 3, 'Past perfect simple or continuous: "He ______ (wait) for an hour when the train finally came."', 'had been waiting — duration up to the past point.', NULL);

INSERT INTO self_checks (id, learning_item_id, intro) VALUES
  ('sc_l4_m1_lesson2', 'itm_l4_m1_lesson2', 'Check that you can move between tenses in a reflective piece without losing the reader.');
INSERT INTO self_check_items (id, self_check_id, sequence, prompt, answer, trap) VALUES
  ('sc_l4_m1_lesson2_1', 'sc_l4_m1_lesson2', 1, 'Which tense frames the situation before the story starts?', 'Past perfect.', NULL),
  ('sc_l4_m1_lesson2_2', 'sc_l4_m1_lesson2', 2, 'Which tense carries a change that continues to today?', 'Present perfect.', NULL),
  ('sc_l4_m1_lesson2_3', 'sc_l4_m1_lesson2', 3, 'What signals to the reader that you have moved from narration to reflection?', 'A shift to the present — ''I still do this'' — and usually a discourse marker: ''Looking back...''', 'Learners change tense without signalling it, and the reader loses the timeline.');

INSERT INTO self_checks (id, learning_item_id, intro) VALUES
  ('sc_l4_m2_lesson1', 'itm_l4_m2_lesson1', 'Check that your thesis makes a claim someone could disagree with.');
INSERT INTO self_check_items (id, self_check_id, sequence, prompt, answer, trap) VALUES
  ('sc_l4_m2_lesson1_1', 'sc_l4_m2_lesson1', 1, 'Is this a thesis: "This essay examines remote working"?', 'No — it announces a topic. A thesis states a position: ''Remote working improves output and damages the transfer of tacit knowledge.''', 'The announcement-thesis is the commonest Level IV essay fault.'),
  ('sc_l4_m2_lesson1_2', 'sc_l4_m2_lesson1', 2, 'How many claims should a thesis carry?', 'One, which the essay''s sections then support.', NULL),
  ('sc_l4_m2_lesson1_3', 'sc_l4_m2_lesson1', 3, 'Where does the thesis sit?', 'At the end of the introduction, after the reader knows why the question matters.', NULL);

INSERT INTO self_checks (id, learning_item_id, intro) VALUES
  ('sc_l4_m2_lesson2', 'itm_l4_m2_lesson2', 'Check that a paraphrase is a paraphrase.');
INSERT INTO self_check_items (id, self_check_id, sequence, prompt, answer, trap) VALUES
  ('sc_l4_m2_lesson2_1', 'sc_l4_m2_lesson2', 1, 'What makes a paraphrase genuine?', 'The structure changes, not only the words. Swapping synonyms into the same frame is substitution.', NULL),
  ('sc_l4_m2_lesson2_2', 'sc_l4_m2_lesson2', 2, 'Does a genuine paraphrase still need a citation?', 'Yes. Changing the words does not change whose idea it is.', 'This misunderstanding is how most unintentional plagiarism happens.'),
  ('sc_l4_m2_lesson2_3', 'sc_l4_m2_lesson2', 3, 'Paraphrase: "The policy was announced without consultation."', 'Nobody affected was asked before the policy was made public.', NULL);

INSERT INTO self_checks (id, learning_item_id, intro) VALUES
  ('sc_l4_m3_lesson1', 'itm_l4_m3_lesson1', 'Check that you can talk about a past that did not happen.');
INSERT INTO self_check_items (id, self_check_id, sequence, prompt, answer, trap) VALUES
  ('sc_l4_m3_lesson1_1', 'sc_l4_m3_lesson1', 1, 'Complete: "If I ______ (know), I ______ (tell) you."', 'had known / would have told', NULL),
  ('sc_l4_m3_lesson1_2', 'sc_l4_m3_lesson1', 2, 'What is wrong with "If I would have known"?', 'No ''would'' in the if-clause: If I had known.', 'Persistent from Level III''s second conditional; it survives untreated to Level VI.'),
  ('sc_l4_m3_lesson1_3', 'sc_l4_m3_lesson1', 3, 'What does the third conditional always imply about the facts?', 'That neither the condition nor the result happened.', NULL);

INSERT INTO self_checks (id, learning_item_id, intro) VALUES
  ('sc_l4_m3_lesson2', 'itm_l4_m3_lesson2', 'Check that you can write a professional letter and answer a behavioural question.');
INSERT INTO self_check_items (id, self_check_id, sequence, prompt, answer, trap) VALUES
  ('sc_l4_m3_lesson2_1', 'sc_l4_m3_lesson2', 1, 'Where does the purpose of a professional email belong?', 'In the first line. A purpose in the third paragraph is a purpose the reader may never reach.', NULL),
  ('sc_l4_m3_lesson2_2', 'sc_l4_m3_lesson2', 2, 'Structure an answer to "Tell me about a time you handled conflict."', 'Situation, task, action, result — and the result must be specific.', 'Learners describe the situation at length and stop before the result, which is the only part being assessed.'),
  ('sc_l4_m3_lesson2_3', 'sc_l4_m3_lesson2', 3, 'Close a cover letter without a cliché.', 'I would welcome the chance to discuss how this experience applies to the role.', NULL);

INSERT INTO self_checks (id, learning_item_id, intro) VALUES
  ('sc_l4_m4_lesson1', 'itm_l4_m4_lesson1', 'Check that a concession strengthens rather than weakens your argument.');
INSERT INTO self_check_items (id, self_check_id, sequence, prompt, answer, trap) VALUES
  ('sc_l4_m4_lesson1_1', 'sc_l4_m4_lesson1', 1, 'What must a concession do?', 'Name the counter-point accurately, then limit its scope — not surrender to it.', NULL),
  ('sc_l4_m4_lesson1_2', 'sc_l4_m4_lesson1', 2, 'Complete: "______ the cost is significant, the alternative is more expensive over ten years."', 'While it is true that / Although', NULL),
  ('sc_l4_m4_lesson1_3', 'sc_l4_m4_lesson1', 3, 'Why is "Some people say X, but they are wrong" weak?', 'It does not state the counter-argument fairly, so the reader cannot tell whether it was answered.', 'A caricatured counter-point signals that the writer could not answer the real one.');

INSERT INTO self_checks (id, learning_item_id, intro) VALUES
  ('sc_l4_m4_lesson2', 'itm_l4_m4_lesson2', 'Check that you can open and rebut in a formal debate.');
INSERT INTO self_check_items (id, self_check_id, sequence, prompt, answer, trap) VALUES
  ('sc_l4_m4_lesson2_1', 'sc_l4_m4_lesson2', 1, 'What does the first speaker for the proposition do?', 'Define the motion, state the case in two or three points, and set the standard for judging it.', NULL),
  ('sc_l4_m4_lesson2_2', 'sc_l4_m4_lesson2', 2, 'What is the difference between rebuttal and disagreement?', 'Rebuttal engages the opponent''s actual reasoning; disagreement only restates your own case louder.', NULL),
  ('sc_l4_m4_lesson2_3', 'sc_l4_m4_lesson2', 3, 'How should you handle a point you cannot answer?', 'Concede it and show why it does not decide the motion.', 'Pretending not to have heard it is what a panel notices most.');

INSERT INTO self_checks (id, learning_item_id, intro) VALUES
  ('sc_l4_m5_lesson1', 'itm_l4_m5_lesson1', 'Check that you can use the passive under formal pressure.');
INSERT INTO self_check_items (id, self_check_id, sequence, prompt, answer, trap) VALUES
  ('sc_l4_m5_lesson1_1', 'sc_l4_m5_lesson1', 1, 'Rewrite formally: "People have argued that the data is unreliable."', 'It has been argued that the data is unreliable.', NULL),
  ('sc_l4_m5_lesson1_2', 'sc_l4_m5_lesson1', 2, 'When is the passive the wrong choice?', 'When it hides an agent the reader needs — ''mistakes were made'' is the standard example.', 'The passive is a tool for focus, not a device for avoiding responsibility.'),
  ('sc_l4_m5_lesson1_3', 'sc_l4_m5_lesson1', 3, 'Complete: "The results ______ ______ ______ (publish) before the review concluded."', 'had been published', NULL);

INSERT INTO self_checks (id, learning_item_id, intro) VALUES
  ('sc_l4_m5_lesson2', 'itm_l4_m5_lesson2', 'Check that you can report questions as well as statements.');
INSERT INTO self_check_items (id, self_check_id, sequence, prompt, answer, trap) VALUES
  ('sc_l4_m5_lesson2_1', 'sc_l4_m5_lesson2', 1, 'Report: "Are you attending?" she asked.', 'She asked whether I was attending.', NULL),
  ('sc_l4_m5_lesson2_2', 'sc_l4_m5_lesson2', 2, 'What happens to the word order?', 'It becomes statement order: no inversion, no auxiliary ''do''.', '''She asked was I attending'' and ''She asked whether was I attending'' are both common.'),
  ('sc_l4_m5_lesson2_3', 'sc_l4_m5_lesson2', 3, 'Report: "When did you submit it?" he asked.', 'He asked when I had submitted it.', NULL);

INSERT INTO self_checks (id, learning_item_id, intro) VALUES
  ('sc_l4_m6_lesson1', 'itm_l4_m6_lesson1', 'Check that you can speculate precisely and compress with nominalisation.');
INSERT INTO self_check_items (id, self_check_id, sequence, prompt, answer, trap) VALUES
  ('sc_l4_m6_lesson1_1', 'sc_l4_m6_lesson1', 1, 'Rank by confidence: may, must, might well, could conceivably.', 'must (highest), might well, may, could conceivably (lowest)', NULL),
  ('sc_l4_m6_lesson1_2', 'sc_l4_m6_lesson1', 2, 'Nominalise: "They implemented the policy, and this delayed the project."', 'The implementation of the policy delayed the project.', NULL),
  ('sc_l4_m6_lesson1_3', 'sc_l4_m6_lesson1', 3, 'What is the cost of nominalisation?', 'It removes the actor. Two or three in a paragraph make prose dense and unattributable.', 'Learners who have just met it use it everywhere; the skill is knowing when not to.');

INSERT INTO self_checks (id, learning_item_id, intro) VALUES
  ('sc_l4_m6_lesson2', 'itm_l4_m6_lesson2', 'Check that you can brief an audience rather than read at them.');
INSERT INTO self_check_items (id, self_check_id, sequence, prompt, answer, trap) VALUES
  ('sc_l4_m6_lesson2_1', 'sc_l4_m6_lesson2', 1, 'Name two signposting phrases and say what each does.', '''I''ll cover three things'' sets the map; ''Turning to the second...'' moves the audience with you.', NULL),
  ('sc_l4_m6_lesson2_2', 'sc_l4_m6_lesson2', 2, 'What belongs on a slide and what belongs in your mouth?', 'On the slide: the evidence a listener must see. In your mouth: what it means.', 'Reading the slide aloud is the single most common presentation failure.'),
  ('sc_l4_m6_lesson2_3', 'sc_l4_m6_lesson2', 3, 'How do you open without wasting the first thirty seconds?', 'With the question the talk answers, not with your name and agenda.', NULL);

INSERT INTO self_checks (id, learning_item_id, intro) VALUES
  ('sc_l4_m7_lesson1', 'itm_l4_m7_lesson1', 'Check that you can read what a text is doing, not only what it says.');
INSERT INTO self_check_items (id, self_check_id, sequence, prompt, answer, trap) VALUES
  ('sc_l4_m7_lesson1_1', 'sc_l4_m7_lesson1', 1, 'Name three signals of persuasive intent.', 'Emotive verbs for neutral events; rhetorical questions that assume their answer; unattributed authority (''experts agree'').', NULL),
  ('sc_l4_m7_lesson1_2', 'sc_l4_m7_lesson1', 2, 'Is a neutral tone evidence of neutrality?', 'No. A measured tone can carry a strong position; that is what makes it effective.', 'Learners trust calm prose and distrust emphatic prose, which is exactly backwards as a test of bias.'),
  ('sc_l4_m7_lesson1_3', 'sc_l4_m7_lesson1', 3, 'What should you ask of any statistic in a persuasive text?', 'Compared with what, measured how, and by whom.', NULL);

INSERT INTO self_checks (id, learning_item_id, intro) VALUES
  ('sc_l4_m7_lesson2', 'itm_l4_m7_lesson2', 'Check that your cohesion devices point somewhere findable.');
INSERT INTO self_check_items (id, self_check_id, sequence, prompt, answer, trap) VALUES
  ('sc_l4_m7_lesson2_1', 'sc_l4_m7_lesson2', 1, 'What must every ''this'' have?', 'A findable antecedent. ''This shows...'' after a three-clause sentence usually has none.', '''This'' with no noun after it is the most frequent cohesion failure in academic writing.'),
  ('sc_l4_m7_lesson2_2', 'sc_l4_m7_lesson2', 2, 'Rewrite without repetition: "She submitted the report and he submitted the report."', 'She submitted the report and so did he.', NULL),
  ('sc_l4_m7_lesson2_3', 'sc_l4_m7_lesson2', 3, 'When is ellipsis a mistake?', 'When recovering the missing element costs the reader more than repeating it would have.', NULL);

INSERT INTO self_checks (id, learning_item_id, intro) VALUES
  ('sc_l4_m8_lesson1', 'itm_l4_m8_lesson1', 'Check that you can punctuate a relative clause according to meaning.');
INSERT INTO self_check_items (id, self_check_id, sequence, prompt, answer, trap) VALUES
  ('sc_l4_m8_lesson1_1', 'sc_l4_m8_lesson1', 1, 'Why do commas change meaning here: "My brother who lives in Oslo" / "My brother, who lives in Oslo"?', 'Without commas: one of several brothers. With commas: the only brother, and the clause adds information.', NULL),
  ('sc_l4_m8_lesson1_2', 'sc_l4_m8_lesson1', 2, 'Which relative pronoun cannot introduce a non-defining clause?', '''that''. Non-defining clauses take who/which.', NULL),
  ('sc_l4_m8_lesson1_3', 'sc_l4_m8_lesson1', 3, 'Punctuate: "The report which was published in June names three causes."', 'Defining, no commas — if there are several reports. Non-defining, with commas — if there is only one.', 'The learner must decide from context, not from the sentence alone.');

INSERT INTO self_checks (id, learning_item_id, intro) VALUES
  ('sc_l4_m8_lesson2', 'itm_l4_m8_lesson2', 'Check that you can disagree in a meeting without ending it.');
INSERT INTO self_check_items (id, self_check_id, sequence, prompt, answer, trap) VALUES
  ('sc_l4_m8_lesson2_1', 'sc_l4_m8_lesson2', 1, 'Disagree with a proposal while keeping the room.', 'I hear what you''re saying, and my concern is the timeline rather than the approach.', NULL),
  ('sc_l4_m8_lesson2_2', 'sc_l4_m8_lesson2', 2, 'What does ''I hear what you''re saying, but...'' risk?', 'Everything before ''but'' is discarded by the listener. ''And'' keeps the concession alive.', 'A small change with a large effect on how the objection lands.'),
  ('sc_l4_m8_lesson2_3', 'sc_l4_m8_lesson2', 3, 'How do you close a point that is going in circles?', 'Summarise both positions, name the decision needed, and propose who decides it.', NULL);

INSERT INTO self_checks (id, learning_item_id, intro) VALUES
  ('sc_l4_m9_lesson1', 'itm_l4_m9_lesson1', 'Check that you can put two sources in relation to each other.');
INSERT INTO self_check_items (id, self_check_id, sequence, prompt, answer, trap) VALUES
  ('sc_l4_m9_lesson1_1', 'sc_l4_m9_lesson1', 1, 'Two sources reach different conclusions from the same data. What do you write?', 'Not ''they disagree'' — state what each measured, since sources often differ in question rather than in answer.', NULL),
  ('sc_l4_m9_lesson1_2', 'sc_l4_m9_lesson1', 2, 'Complete: "While Source A finds X, Source B ______."', 'argues/reports/qualifies — a verb that says what B is doing, not merely that B exists.', NULL),
  ('sc_l4_m9_lesson1_3', 'sc_l4_m9_lesson1', 3, 'What is the weakest form of synthesis?', 'Summarising A, then summarising B, and leaving the reader to connect them.', 'This is the default output of most Level IV essays and the thing this lesson exists to prevent.');

INSERT INTO self_checks (id, learning_item_id, intro) VALUES
  ('sc_l4_m9_lesson2', 'itm_l4_m9_lesson2', 'Check that a paragraph holds together and connects to the ones around it.');
INSERT INTO self_check_items (id, self_check_id, sequence, prompt, answer, trap) VALUES
  ('sc_l4_m9_lesson2_1', 'sc_l4_m9_lesson2', 1, 'What is the difference between coherence and cohesion?', 'Coherence is whether the ideas follow. Cohesion is the linguistic glue — reference, connectors, repetition — that shows they do.', NULL),
  ('sc_l4_m9_lesson2_2', 'sc_l4_m9_lesson2', 2, 'A paragraph reads oddly but every sentence is correct. What is wrong?', 'The order. Cohesion devices cannot rescue a sequence that does not follow.', 'Learners add connectors to fix incoherence, which makes it more visible, not less.'),
  ('sc_l4_m9_lesson2_3', 'sc_l4_m9_lesson2', 3, 'What links a paragraph to the previous one?', 'A back-reference in its first sentence to the idea just established.', NULL);

INSERT INTO self_checks (id, learning_item_id, intro) VALUES
  ('sc_l4_m10_revlesson', 'itm_l4_m10_revlesson', 'Check that you can select from the whole level unprompted.');
INSERT INTO self_check_items (id, self_check_id, sequence, prompt, answer, trap) VALUES
  ('sc_l4_m10_revlesson_1', 'sc_l4_m10_revlesson', 1, 'You must describe what had happened before the events you are narrating.', 'Past perfect.', NULL),
  ('sc_l4_m10_revlesson_2', 'sc_l4_m10_revlesson', 2, 'You must acknowledge a strong counter-argument without conceding your case.', 'Advanced concession.', NULL),
  ('sc_l4_m10_revlesson_3', 'sc_l4_m10_revlesson', 3, 'You must combine two sources that measured different things.', 'Synthesis language, not agreement/disagreement language.', NULL),
  ('sc_l4_m10_revlesson_4', 'sc_l4_m10_revlesson', 4, 'You must state a claim you cannot fully evidence.', 'Hedging — and at this level, hedging that is precise rather than vague.', 'Selecting unprompted is the level''s real outcome.');

INSERT INTO self_checks (id, learning_item_id, intro) VALUES
  ('sc_l5_m1_lesson1', 'itm_l5_m1_lesson1', 'Check that you can mix time frames in a conditional.');
INSERT INTO self_check_items (id, self_check_id, sequence, prompt, answer, trap) VALUES
  ('sc_l5_m1_lesson1_1', 'sc_l5_m1_lesson1', 1, 'Which clause is past and which present: "If I had studied medicine, I''d be a doctor now"?', 'Condition past, result present.', NULL),
  ('sc_l5_m1_lesson1_2', 'sc_l5_m1_lesson1', 2, 'Reverse it: a present condition with a past result.', 'If I were more organised, I wouldn''t have missed the deadline.', 'Learners collapse the mixture back into a pure form — ''I wouldn''t miss the deadline'' — because both pure conditionals were drilled to automaticity first. The two halves must stay in different time frames.'),
  ('sc_l5_m1_lesson1_3', 'sc_l5_m1_lesson1', 3, 'Why does the mixed conditional matter more than the pure forms at C1?', 'Because real regret and real reasoning rarely sit in one time frame.', NULL);

INSERT INTO self_checks (id, learning_item_id, intro) VALUES
  ('sc_l5_m1_lesson2', 'itm_l5_m1_lesson2', 'Check that you can move between registers deliberately.');
INSERT INTO self_check_items (id, self_check_id, sequence, prompt, answer, trap) VALUES
  ('sc_l5_m1_lesson2_1', 'sc_l5_m1_lesson2', 1, 'Neutralise: "We need to sort this out."', 'We need to resolve this.', NULL),
  ('sc_l5_m1_lesson2_2', 'sc_l5_m1_lesson2', 2, 'What makes an idiom risky in formal writing?', 'It is register-marked and often culture-marked; a reader who does not share it reads it as noise.', 'Learners acquire idioms and deploy them exactly where they cost most.'),
  ('sc_l5_m1_lesson2_3', 'sc_l5_m1_lesson2', 3, 'Formal, neutral or informal: ''bear in mind'', ''take into consideration'', ''don''t forget''?', 'Neutral, formal, informal.', NULL);

INSERT INTO self_checks (id, learning_item_id, intro) VALUES
  ('sc_l5_m2_lesson1', 'itm_l5_m2_lesson1', 'Check that you can synthesise a body of sources rather than a pair.');
INSERT INTO self_check_items (id, self_check_id, sequence, prompt, answer, trap) VALUES
  ('sc_l5_m2_lesson1_1', 'sc_l5_m2_lesson1', 1, 'Three sources, one theme. What must your first sentence do?', 'State the theme and the shape of the literature — where it converges, where it splits.', NULL),
  ('sc_l5_m2_lesson1_2', 'sc_l5_m2_lesson1', 2, 'What is a gap, and how do you state one honestly?', 'Something none of the sources addresses. State what is missing, not that the field has failed.', NULL),
  ('sc_l5_m2_lesson1_3', 'sc_l5_m2_lesson1', 3, 'Why is ''many researchers agree'' weak?', 'It is unattributable and usually untested. Name who, or say how many of how many.', 'The phrase survives into published work and is a marker of unexamined reading.');

INSERT INTO self_checks (id, learning_item_id, intro) VALUES
  ('sc_l5_m2_lesson2', 'itm_l5_m2_lesson2', 'Check that your essay holds together across paragraphs, not only within them.');
INSERT INTO self_check_items (id, self_check_id, sequence, prompt, answer, trap) VALUES
  ('sc_l5_m2_lesson2_1', 'sc_l5_m2_lesson2', 1, 'What connects paragraph four to paragraph one?', 'A back-reference that names the earlier idea — ''this improvement'', ''the distinction drawn above''.', NULL),
  ('sc_l5_m2_lesson2_2', 'sc_l5_m2_lesson2', 2, 'What is the sign that essay-level cohesion has failed?', 'Each paragraph is well made and the essay reads as a list.', 'The reflex repair is to add ''moreover'' and ''furthermore'' at the joins. Signposting a list produces a signposted list; cohesion at essay level is carried by back-reference to a named idea, not by connectives.'),
  ('sc_l5_m2_lesson2_3', 'sc_l5_m2_lesson2', 3, 'How many ideas should a paragraph carry?', 'One. Two means the cohesion problem is really a structure problem.', NULL);

INSERT INTO self_checks (id, learning_item_id, intro) VALUES
  ('sc_l5_m3_lesson1', 'itm_l5_m3_lesson1', 'Check that you can invert for emphasis without error.');
INSERT INTO self_check_items (id, self_check_id, sequence, prompt, answer, trap) VALUES
  ('sc_l5_m3_lesson1_1', 'sc_l5_m3_lesson1', 1, 'Invert: "I have rarely seen such a clear case."', 'Rarely have I seen such a clear case.', NULL),
  ('sc_l5_m3_lesson1_2', 'sc_l5_m3_lesson1', 2, 'What happens to the auxiliary?', 'It moves before the subject — the same order as a question.', 'Learners invert the main verb: ''Rarely saw I'' is the error.'),
  ('sc_l5_m3_lesson1_3', 'sc_l5_m3_lesson1', 3, 'When is inversion wrong?', 'When there is nothing to emphasise. Used often it reads as ornament and loses its force.', NULL);

INSERT INTO self_checks (id, learning_item_id, intro) VALUES
  ('sc_l5_m3_lesson2', 'itm_l5_m3_lesson2', 'Check that you can frame an issue so that it can be acted on.');
INSERT INTO self_check_items (id, self_check_id, sequence, prompt, answer, trap) VALUES
  ('sc_l5_m3_lesson2_1', 'sc_l5_m3_lesson2', 1, 'Reframe: "We need new laptops for the design team."', 'We are asking designers to compete with tools that cost us deadlines — name the stake, not the object.', NULL),
  ('sc_l5_m3_lesson2_2', 'sc_l5_m3_lesson2', 2, 'What are the three parts of a persuasive close?', 'Vision, rationale, call to action — in that order.', NULL),
  ('sc_l5_m3_lesson2_3', 'sc_l5_m3_lesson2', 3, 'What does a reframe never do?', 'Overstate the facts. A frame changes what is salient, not what is true.', 'This is the line between framing and misrepresentation, and it is the one worth teaching.');

INSERT INTO self_checks (id, learning_item_id, intro) VALUES
  ('sc_l5_m4_lesson1', 'itm_l5_m4_lesson1', 'Check that you can compress technical prose without losing the actor.');
INSERT INTO self_check_items (id, self_check_id, sequence, prompt, answer, trap) VALUES
  ('sc_l5_m4_lesson1_1', 'sc_l5_m4_lesson1', 1, 'Nominalise: "The team analysed the data, and this revealed three patterns."', 'Analysis of the data revealed three patterns.', NULL),
  ('sc_l5_m4_lesson1_2', 'sc_l5_m4_lesson1', 2, 'What is lost?', 'Who did it. Restore the actor when accountability matters.', 'Nominalisation is learned as a formality signal, so it is applied hardest in exactly the documents where the agent matters most: ''the taking of the decision'' conceals the same actor the agentless passive does, and does it less visibly.'),
  ('sc_l5_m4_lesson1_3', 'sc_l5_m4_lesson1', 3, 'How many nominalisations can a sentence carry before it fails?', 'Usually two. Three produces prose that parses and does not communicate.', NULL);

INSERT INTO self_checks (id, learning_item_id, intro) VALUES
  ('sc_l5_m4_lesson2', 'itm_l5_m4_lesson2', 'Check that your hedging matches your evidence.');
INSERT INTO self_check_items (id, self_check_id, sequence, prompt, answer, trap) VALUES
  ('sc_l5_m4_lesson2_1', 'sc_l5_m4_lesson2', 1, 'Hedge appropriately: one observational study, correlation only.', 'X was associated with Y in one observational study; no causal claim can be made from this design.', NULL),
  ('sc_l5_m4_lesson2_2', 'sc_l5_m4_lesson2', 2, 'Three replications, consistent results. How much hedging?', 'Little. Over-hedging strong evidence is as inaccurate as over-claiming weak evidence.', 'The second failure is rarely taught and is common in careful writers.'),
  ('sc_l5_m4_lesson2_3', 'sc_l5_m4_lesson2', 3, 'What does ''may possibly perhaps suggest'' communicate?', 'That the writer has not decided what they believe.', NULL);

INSERT INTO self_checks (id, learning_item_id, intro) VALUES
  ('sc_l5_m5_lesson1', 'itm_l5_m5_lesson1', 'Check that your politeness matches the imposition.');
INSERT INTO self_check_items (id, self_check_id, sequence, prompt, answer, trap) VALUES
  ('sc_l5_m5_lesson1_1', 'sc_l5_m5_lesson1', 1, 'Small request, close colleague.', 'Can you...? — anything more elaborate sounds odd.', NULL),
  ('sc_l5_m5_lesson1_2', 'sc_l5_m5_lesson1', 2, 'Large request, senior person, short notice.', 'Ground it first: ''I realise this is short notice, and I wouldn''t ask if there were another way...''', NULL),
  ('sc_l5_m5_lesson1_3', 'sc_l5_m5_lesson1', 3, 'What is over-politeness a signal of?', 'Distance, or discomfort. Excess politeness with a close colleague reads as coldness or sarcasm.', 'Politeness is calibration, not maximisation.');

INSERT INTO self_checks (id, learning_item_id, intro) VALUES
  ('sc_l5_m5_lesson2', 'itm_l5_m5_lesson2', 'Check that you can read a cultural context without stereotyping it.');
INSERT INTO self_check_items (id, self_check_id, sequence, prompt, answer, trap) VALUES
  ('sc_l5_m5_lesson2_1', 'sc_l5_m5_lesson2', 1, 'What is the difference between a practice and a people?', 'A practice can be described and varies by setting; a people cannot be characterised.', 'Every safe formulation in this lesson depends on that distinction.'),
  ('sc_l5_m5_lesson2_2', 'sc_l5_m5_lesson2', 2, 'Rewrite: "In Japan, people never disagree directly."', 'In many Japanese workplace settings, disagreement is more often signalled indirectly.', NULL),
  ('sc_l5_m5_lesson2_3', 'sc_l5_m5_lesson2', 3, 'What should you do when unsure of a norm?', 'Ask, or observe, or state your own convention and invite correction.', NULL);

INSERT INTO self_checks (id, learning_item_id, intro) VALUES
  ('sc_l5_m6_lesson1', 'itm_l5_m6_lesson1', 'Check that you can put the emphasis where you want it.');
INSERT INTO self_check_items (id, self_check_id, sequence, prompt, answer, trap) VALUES
  ('sc_l5_m6_lesson1_1', 'sc_l5_m6_lesson1', 1, 'Cleft: emphasise ''the timing'' in "The timing caused the problem."', 'It was the timing that caused the problem.', 'The cleft''s own verb carries the tense of the original sentence: ''It is the timing that caused'' mixes the two and is the commonest form error once the pattern is understood.'),
  ('sc_l5_m6_lesson1_2', 'sc_l5_m6_lesson1', 2, 'Emphasise the action: "We need to test it."', 'What we need to do is test it.', NULL),
  ('sc_l5_m6_lesson1_3', 'sc_l5_m6_lesson1', 3, 'Why not use clefts throughout?', 'Every sentence emphasised means none is. Emphasis is a contrast device.', NULL);

INSERT INTO self_checks (id, learning_item_id, intro) VALUES
  ('sc_l5_m6_lesson2', 'itm_l5_m6_lesson2', 'Check that you can analyse subtext at depth.');
INSERT INTO self_check_items (id, self_check_id, sequence, prompt, answer, trap) VALUES
  ('sc_l5_m6_lesson2_1', 'sc_l5_m6_lesson2', 1, 'Name two techniques working together in: "Local families are again asked to shoulder the burden."', 'The passive hides who is asking; ''again'' asserts a pattern without evidence.', NULL),
  ('sc_l5_m6_lesson2_2', 'sc_l5_m6_lesson2', 2, 'What does ''critics say'' do?', 'Attributes a view to nobody checkable while sounding sourced.', NULL),
  ('sc_l5_m6_lesson2_3', 'sc_l5_m6_lesson2', 3, 'What is the risk of subtext analysis?', 'Finding intent where there is only habit. Say what the text does, not what the writer wanted.', 'The discipline is describing effect, not imputing motive.');

INSERT INTO self_checks (id, learning_item_id, intro) VALUES
  ('sc_l5_m7_lesson1', 'itm_l5_m7_lesson1', 'Check that your discourse markers describe the relationship you mean.');
INSERT INTO self_check_items (id, self_check_id, sequence, prompt, answer, trap) VALUES
  ('sc_l5_m7_lesson1_1', 'sc_l5_m7_lesson1', 1, 'Which marker: a concession that limits the previous claim?', 'Admittedly / That said', NULL),
  ('sc_l5_m7_lesson1_2', 'sc_l5_m7_lesson1', 2, 'Which marker: a contrast where the second point surprises?', 'Even so / Nevertheless', NULL),
  ('sc_l5_m7_lesson1_3', 'sc_l5_m7_lesson1', 3, 'What is wrong with using ''however'' for every contrast?', 'It flattens four different relationships into one and the reader stops noticing it.', 'Marker variety is not decoration; each names a different logical move.');

INSERT INTO self_checks (id, learning_item_id, intro) VALUES
  ('sc_l5_m7_lesson2', 'itm_l5_m7_lesson2', 'Check that you can deliver a research-informed talk.');
INSERT INTO self_check_items (id, self_check_id, sequence, prompt, answer, trap) VALUES
  ('sc_l5_m7_lesson2_1', 'sc_l5_m7_lesson2', 1, 'What must the first minute establish?', 'The question, why it matters, and what you will claim.', NULL),
  ('sc_l5_m7_lesson2_2', 'sc_l5_m7_lesson2', 2, 'How do you present a finding you cannot fully support?', 'State the strength of the evidence as you state the finding.', NULL),
  ('sc_l5_m7_lesson2_3', 'sc_l5_m7_lesson2', 3, 'What do you do when you do not know an answer from the floor?', 'Say so, say what would answer it, and offer to follow up.', 'Improvising an answer is the failure a panel remembers.');

INSERT INTO self_checks (id, learning_item_id, intro) VALUES
  ('sc_l5_m8_lesson1', 'itm_l5_m8_lesson1', 'Check that you can hold the passive steady under formal pressure.');
INSERT INTO self_check_items (id, self_check_id, sequence, prompt, answer, trap) VALUES
  ('sc_l5_m8_lesson1_1', 'sc_l5_m8_lesson1', 1, 'Rewrite: "We have made the case."', 'The case has been made.', NULL),
  ('sc_l5_m8_lesson1_2', 'sc_l5_m8_lesson1', 2, 'When does formal pressure make the passive dangerous?', 'When it removes an agent the audience is entitled to know.', NULL),
  ('sc_l5_m8_lesson1_3', 'sc_l5_m8_lesson1', 3, 'Complete: "No decision ______ ______ ______ (reach) at the time of writing."', 'had been reached', 'One auxiliary goes missing under pressure. ''No decision was reached'' is grammatical but loses the anchor to the time of writing, which in a formal record is the whole point of the sentence.');

INSERT INTO self_checks (id, learning_item_id, intro) VALUES
  ('sc_l5_m8_lesson2', 'itm_l5_m8_lesson2', 'Check that you can respond under pressure without conceding what is not true.');
INSERT INTO self_check_items (id, self_check_id, sequence, prompt, answer, trap) VALUES
  ('sc_l5_m8_lesson2_1', 'sc_l5_m8_lesson2', 1, 'A hostile question contains a false premise. What first?', 'Correct the premise, briefly, then answer the fair question underneath it.', NULL),
  ('sc_l5_m8_lesson2_2', 'sc_l5_m8_lesson2', 2, 'What does ''no comment'' communicate?', 'Usually confirmation. Say what you can say and why you cannot say the rest.', NULL),
  ('sc_l5_m8_lesson2_3', 'sc_l5_m8_lesson2', 3, 'How long should a pressured answer be?', 'Short. Length under pressure is read as evasion, whatever it contains.', 'Learners lengthen when uncomfortable, which produces the impression they are avoiding.');

INSERT INTO self_checks (id, learning_item_id, intro) VALUES
  ('sc_l5_m9_lesson1', 'itm_l5_m9_lesson1', 'Check that you can cut without losing meaning.');
INSERT INTO self_check_items (id, self_check_id, sequence, prompt, answer, trap) VALUES
  ('sc_l5_m9_lesson1_1', 'sc_l5_m9_lesson1', 1, 'Cut: "Due to the fact that the results were not conclusive in nature..."', 'Because the results were inconclusive...', NULL),
  ('sc_l5_m9_lesson1_2', 'sc_l5_m9_lesson1', 2, 'Which words almost always go?', '''in nature'', ''in terms of'', ''the fact that'', ''very'', ''really'', ''quite''.', NULL),
  ('sc_l5_m9_lesson1_3', 'sc_l5_m9_lesson1', 3, 'When is a longer sentence right?', 'When the shorter one loses a qualification the claim needs.', 'Concision is not brevity: cutting a hedge can turn an accurate claim into a false one.');

INSERT INTO self_checks (id, learning_item_id, intro) VALUES
  ('sc_l5_m9_lesson2', 'itm_l5_m9_lesson2', 'Check that you can change register for audience and purpose.');
INSERT INTO self_check_items (id, self_check_id, sequence, prompt, answer, trap) VALUES
  ('sc_l5_m9_lesson2_1', 'sc_l5_m9_lesson2', 1, 'Same finding, three audiences: a journal, a manager, a newsletter. What changes?', 'Not the finding — the entry point, the hedging density and the technical vocabulary.', NULL),
  ('sc_l5_m9_lesson2_2', 'sc_l5_m9_lesson2', 2, 'What must never change with register?', 'The strength of the claim relative to the evidence.', 'This is where register-shifting becomes misrepresentation, and it is the boundary to teach.'),
  ('sc_l5_m9_lesson2_3', 'sc_l5_m9_lesson2', 3, 'How do you find your own voice without losing formality?', 'Sentence rhythm and choice of example, not informality of vocabulary.', NULL);

INSERT INTO self_checks (id, learning_item_id, intro) VALUES
  ('sc_l5_m10_revlesson', 'itm_l5_m10_revlesson', 'Check that you can select from the whole level unprompted.');
INSERT INTO self_check_items (id, self_check_id, sequence, prompt, answer, trap) VALUES
  ('sc_l5_m10_revlesson_1', 'sc_l5_m10_revlesson', 1, 'You must state a claim your evidence only partly supports.', 'Precise hedging.', NULL),
  ('sc_l5_m10_revlesson_2', 'sc_l5_m10_revlesson', 2, 'You must emphasise one element of a sentence over the rest.', 'Cleft or inversion.', NULL),
  ('sc_l5_m10_revlesson_3', 'sc_l5_m10_revlesson', 3, 'You must describe a norm without characterising a people.', 'Practice-and-setting language, second conditional where hypothetical.', NULL),
  ('sc_l5_m10_revlesson_4', 'sc_l5_m10_revlesson', 4, 'You must compress a technical process for a specialist reader.', 'Nominalisation, kept to two per sentence.', 'Unprompted selection is the outcome; recognition in isolation is not.');

-- ─────────────────────────────────────────────────────────────────────
-- SELF-CHECKS — Level VI (final authoring pass)
--
-- The last nineteen lessons of 114. Level VI is where the errors are
-- no longer errors of form but errors of judgement, so several traps
-- name a confusion that produces a perfectly grammatical sentence
-- meaning the opposite of what the writer intended — 'subject to' for
-- 'notwithstanding', 'may' read as permission, an unearned booster.
-- Those are the expensive ones, and the module quiz does not catch
-- them because a learner who makes them believes they were right.
--
-- Press-drafted. Not reviewed by any qualified academic.
-- ─────────────────────────────────────────────────────────────────────

INSERT INTO self_checks (id, learning_item_id, intro) VALUES
  ('sc_l6_m1_lesson1', 'itm_l6_m1_lesson1', 'Check that you can form the mandative subjunctive without hesitating, and that you know when you are choosing it rather than defaulting to it.');
INSERT INTO self_check_items (id, self_check_id, sequence, prompt, answer, trap) VALUES
  ('sc_l6_m1_lesson1_1', 'sc_l6_m1_lesson1', 1, 'Complete: "It is imperative that every director ______ (be) briefed before the vote."', 'be — the base form, whatever the subject.', 'Five levels of drilling third-person agreement make ''is'' feel correct here. The subjunctive is invariant, and the -s that was right everywhere else is wrong here.'),
  ('sc_l6_m1_lesson1_2', 'sc_l6_m1_lesson1', 2, 'Make it negative: "We insist that he ______ ______ the meeting."', 'not attend — ''not'' plus the base form, with no auxiliary.', '''We insist that he does not attend'' is the reflex. The subjunctive takes no ''do''.'),
  ('sc_l6_m1_lesson1_3', 'sc_l6_m1_lesson1', 3, 'Give the ''should'' alternative to "We propose that the chair convene an extraordinary meeting."', 'We propose that the chair should convene an extraordinary meeting.', NULL),
  ('sc_l6_m1_lesson1_4', 'sc_l6_m1_lesson1', 4, 'Which of the two would you use in a minute circulated to a British board, and why?', 'Either — but knowingly: the bare subjunctive reads as very formal or slightly American to some British readers, and ''should'' is the commoner British choice.', NULL);

INSERT INTO self_checks (id, learning_item_id, intro) VALUES
  ('sc_l6_m1_lesson2', 'itm_l6_m1_lesson2', 'Check that you can open a briefing with the decision rather than the background, and reflect on your own practice without performing.');
INSERT INTO self_check_items (id, self_check_id, sequence, prompt, answer, trap) VALUES
  ('sc_l6_m1_lesson2_1', 'sc_l6_m1_lesson2', 1, 'What is the first sentence of an executive briefing?', 'The decision required: "I am asking the board to approve X."', 'Every prior level rewarded building to the point. At briefing level the point comes first, and the habit that earned marks in Level IV essays now costs you the room.'),
  ('sc_l6_m1_lesson2_2', 'sc_l6_m1_lesson2', 2, 'Classify: "My greatest weakness is that I care too much about quality."', 'Self-promotion disguised as reflection.', NULL),
  ('sc_l6_m1_lesson2_3', 'sc_l6_m1_lesson2', 3, 'What separates genuine reflection from elaborate self-blame?', 'A concrete different action. Self-criticism that commits to no change is performance.', NULL),
  ('sc_l6_m1_lesson2_4', 'sc_l6_m1_lesson2', 4, 'How do you own a risk in a briefing without weakening the ask?', 'Name it and take it: "The principal risk is Y; I am accountable for managing it." Naming the risk is what makes the ask credible.', NULL);

INSERT INTO self_checks (id, learning_item_id, intro) VALUES
  ('sc_l6_m2_lesson1', 'itm_l6_m2_lesson1', 'Check that you can hedge to preserve room to move, and read a diplomatic text for what it declines to say.');
INSERT INTO self_check_items (id, self_check_id, sequence, prompt, answer, trap) VALUES
  ('sc_l6_m2_lesson1_1', 'sc_l6_m2_lesson1', 1, 'Rank by strength of objection: "We disagree" / "We have some concerns" / "This is not a position we could readily support".', 'The third is the strongest.', 'Learners rank by directness, so they put the third last. In diplomatic register, distance signals seriousness rather than softness — and misreading it means missing the moment a counterpart has actually refused.'),
  ('sc_l6_m2_lesson1_2', 'sc_l6_m2_lesson1', 2, 'Place these on a scale: unhelpful / not helpful / not unhelpful / helpful.', 'That is the order, weakest to strongest — a four-point scale, not two.', 'Litotes is usually taught as ''understatement'', which collapses the middle two points. They are distinct positions and negotiators use the distinction.'),
  ('sc_l6_m2_lesson1_3', 'sc_l6_m2_lesson1', 3, 'Why "There is a view that the timetable may prove ambitious" rather than "I think the timetable is too tight"?', 'No individual holds the view, so no individual has to reverse themselves if the position shifts.', NULL),
  ('sc_l6_m2_lesson1_4', 'sc_l6_m2_lesson1', 4, 'How do you test whether your own hedging preserved the meaning?', 'Give it to someone else and ask them to state plainly what position they think it holds. If they cannot, the hedging destroyed the content.', NULL);

INSERT INTO self_checks (id, learning_item_id, intro) VALUES
  ('sc_l6_m2_lesson2', 'itm_l6_m2_lesson2', 'Check that you can find the interest under a position, and write recommendations that state what they cost.');
INSERT INTO self_check_items (id, self_check_id, sequence, prompt, answer, trap) VALUES
  ('sc_l6_m2_lesson2_1', 'sc_l6_m2_lesson2', 1, 'A party demands a six-month extension. Give three different interests that could produce that position.', 'Any three: a resourcing gap, a sequencing dependency, an internal approval cycle, a need to be seen to have won something.', 'Positions look incompatible far more often than interests do. A negotiator who bargains over positions concludes agreement is impossible when it is available one layer down.'),
  ('sc_l6_m2_lesson2_2', 'sc_l6_m2_lesson2', 2, 'How do you keep an unattractive option formally alive?', '"We would not wish to rule that out at this stage."', NULL),
  ('sc_l6_m2_lesson2_3', 'sc_l6_m2_lesson2', 3, 'What are the three properties of a usable set of strategic recommendations?', 'Prioritised, specific (named action, owner, timeframe), and honest about what each costs.', NULL),
  ('sc_l6_m2_lesson2_4', 'sc_l6_m2_lesson2', 4, 'In a four-party discussion, what do you say to show you have tracked a party''s interest?', '"As I understand it, your concern is primarily about sequencing rather than the substance."', NULL);

INSERT INTO self_checks (id, learning_item_id, intro) VALUES
  ('sc_l6_m3_lesson1', 'itm_l6_m3_lesson1', 'Check that you can front a complement accurately, and that you know why you would not do it twice on one page.');
INSERT INTO self_check_items (id, self_check_id, sequence, prompt, answer, trap) VALUES
  ('sc_l6_m3_lesson1_1', 'sc_l6_m3_lesson1', 1, 'Front the complement: "A fundamental shift in how we allocate capital is central to this strategy."', 'Central to this strategy is a fundamental shift in how we allocate capital.', 'Fronting triggers subject-verb inversion. ''Central to this strategy a fundamental shift is...'' keeps the original order and produces a sentence no reader can parse on first pass.'),
  ('sc_l6_m3_lesson1_2', 'sc_l6_m3_lesson1', 2, 'Complete the so-inversion: "So ______ ______ the first-quarter gains that the board approved a second phase."', 'significant were', NULL),
  ('sc_l6_m3_lesson1_3', 'sc_l6_m3_lesson1', 3, 'You have three emphasis devices — cleft, negative-adverbial inversion, fronting. How do you choose?', 'By which element genuinely needs the weight, not by which construction you last practised.', NULL),
  ('sc_l6_m3_lesson1_4', 'sc_l6_m3_lesson1', 4, 'How many emphatic sentences belong in a six-sentence strategic paragraph?', 'One. These constructions work by contrast with plainer neighbours; a paragraph of them emphasises nothing.', 'The lesson makes emphasis feel like the mark of the register, so learners apply it everywhere and lose the effect entirely — the same failure as Level V''s clefts, one level up.');

INSERT INTO self_checks (id, learning_item_id, intro) VALUES
  ('sc_l6_m3_lesson2', 'itm_l6_m3_lesson2', 'Check that you can separate evidence from inference, and state the assumption you want challenged.');
INSERT INTO self_check_items (id, self_check_id, sequence, prompt, answer, trap) VALUES
  ('sc_l6_m3_lesson2_1', 'sc_l6_m3_lesson2', 1, 'Label each layer: "Unit sales fell 12% across two quarters." / "The decline is structural rather than seasonal." / "Defer the capacity expansion."', 'Evidence / inference / recommendation.', 'The middle layer is where reasonable people disagree, and it is the layer writers habitually present in the grammar of the first — ''the decline is structural'' is written as though it were observed rather than judged.'),
  ('sc_l6_m3_lesson2_2', 'sc_l6_m3_lesson2', 2, 'Write the working-assumption sentence for that recommendation.', '"Our working assumption is that competitor pricing holds at current levels; if that assumption fails, the recommendation changes."', NULL),
  ('sc_l6_m3_lesson2_3', 'sc_l6_m3_lesson2', 3, 'A board member destroys your assumption. What are the two honest responses?', 'Concede the assumption and show the recommendation survives on other grounds — or concede that it does not, and withdraw it.', NULL),
  ('sc_l6_m3_lesson2_4', 'sc_l6_m3_lesson2', 4, 'Why state the assumption at all, when it invites attack?', 'Because it tells the board which assumption to interrogate and pre-commits you to changing your view if it breaks. That is what makes the rest credible.', NULL);

INSERT INTO self_checks (id, learning_item_id, intro) VALUES
  ('sc_l6_m4_lesson1', 'itm_l6_m4_lesson1', 'Check that you can tell which provisions bind and which do not, in a text where one word carries the whole difference.');
INSERT INTO self_check_items (id, self_check_id, sequence, prompt, answer, trap) VALUES
  ('sc_l6_m4_lesson1_1', 'sc_l6_m4_lesson1', 1, 'Which of these bind: "The authority shall publish" / "must publish" / "may publish" / "should publish"?', 'Shall and must bind. May confers a discretion. Should is guidance only.', NULL),
  ('sc_l6_m4_lesson1_2', 'sc_l6_m4_lesson1', 2, 'What does "The authority may publish the register" actually give the authority?', 'A discretion: it can publish and cannot be compelled to.', 'Lay readers — and learners who met ''may'' as polite permission in Level II — read this as the authority being allowed to publish, and so as a reader''s entitlement. It is the opposite: the provision is what stops anyone demanding publication.'),
  ('sc_l6_m4_lesson1_3', 'sc_l6_m4_lesson1', 3, 'Why are plain-language drafters replacing "shall" with "must"?', 'Because lay readers take ''shall'' as future tense rather than obligation.', NULL),
  ('sc_l6_m4_lesson1_4', 'sc_l6_m4_lesson1', 4, 'What is removed when "must" becomes "should" in a single provision?', 'The enforcement mechanism. This is exactly what ''water down'' names.', NULL);

INSERT INTO self_checks (id, learning_item_id, intro) VALUES
  ('sc_l6_m4_lesson2', 'itm_l6_m4_lesson2', 'Check that you can appraise options against criteria you declared before you knew the answer.');
INSERT INTO self_check_items (id, self_check_id, sequence, prompt, answer, trap) VALUES
  ('sc_l6_m4_lesson2_1', 'sc_l6_m4_lesson2', 1, 'What comes first in an option appraisal, and why must each item be defined?', 'The criteria — and ''equity'' left undefined does no work, so it can be made to mean whatever the conclusion needs.', NULL),
  ('sc_l6_m4_lesson2_2', 'sc_l6_m4_lesson2', 2, 'How do you spot criteria reverse-engineered from a preferred option?', 'A criterion that appears once, does decisive work, and is never mentioned again.', 'This is not a failure of honesty in most cases — analysts form a view first and then write, and the criteria arrive already shaped. Which is why the order of drafting is the safeguard, not good intentions.'),
  ('sc_l6_m4_lesson2_3', 'sc_l6_m4_lesson2', 3, 'What is the sensitivity question every serious analysis answers?', 'Which single criterion, if reweighted, would change the winning option.', NULL),
  ('sc_l6_m4_lesson2_4', 'sc_l6_m4_lesson2', 4, 'State a recommendation with its distributional consequence.', '"This recommendation concentrates the cost on X while spreading the benefit across Y."', NULL);

INSERT INTO self_checks (id, learning_item_id, intro) VALUES
  ('sc_l6_m5_lesson1', 'itm_l6_m5_lesson1', 'Check that you can trace what a proviso changes, and that two of these terms do not mean the same thing.');
INSERT INTO self_check_items (id, self_check_id, sequence, prompt, answer, trap) VALUES
  ('sc_l6_m5_lesson1_1', 'sc_l6_m5_lesson1', 1, 'Which provision prevails: A "subject to" B, or A "notwithstanding" B?', 'Subject to: B prevails. Notwithstanding: A prevails. They are opposites in effect.', 'Both read as formal connectives meaning roughly ''in relation to'', so learners treat them as stylistic variants. Confusing them inverts which rule wins, and the sentence stays perfectly grammatical while meaning the reverse.'),
  ('sc_l6_m5_lesson1_2', 'sc_l6_m5_lesson1', 2, 'What does "provided that the applicant has held no prior revocation" change about who gets a licence?', 'It adds a condition that must be satisfied before the main provision operates at all — it narrows the grant.', NULL),
  ('sc_l6_m5_lesson1_3', 'sc_l6_m5_lesson1', 3, 'The document says: "For the purposes of this section, ''employee'' includes a contractor engaged for more than 90 days." A 100-day contractor argues they are not an employee in ordinary usage. Are they caught?', 'Yes. Inside this document the defined term means exactly what the definition says, and ordinary usage is irrelevant.', 'Learners argue from what the word normally means. A defined term is a local variable, and this is the single most consequential reading habit in the lesson.'),
  ('sc_l6_m5_lesson1_4', 'sc_l6_m5_lesson1', 4, 'What is the difference in reach between "save where" and "unless"?', 'Save where carves a category out of the provision''s reach; unless states a negative condition on it. Both exclude, but the first names a class and the second names a circumstance.', NULL);

INSERT INTO self_checks (id, learning_item_id, intro) VALUES
  ('sc_l6_m5_lesson2', 'itm_l6_m5_lesson2', 'Check that you can state someone else''s argument better than they did before you take it apart.');
INSERT INTO self_check_items (id, self_check_id, sequence, prompt, answer, trap) VALUES
  ('sc_l6_m5_lesson2_1', 'sc_l6_m5_lesson2', 1, 'What must you do before criticising an argument?', 'Restate it in its strongest, most charitable form — better than the original author put it, if you can.', 'An argument defeated in its weak form is not defeated, and the critique reads to any informed examiner as evidence you did not understand it. This is the difference between a first and a pass at this level.'),
  ('sc_l6_m5_lesson2_2', 'sc_l6_m5_lesson2', 2, 'Name the four points at which you can locate a disagreement.', 'Premise, warrant, inference, scope.', NULL),
  ('sc_l6_m5_lesson2_3', 'sc_l6_m5_lesson2', 3, 'Which is a critique: "I disagree with this article" or "the second premise holds only for publicly-listed firms, which the conclusion does not restrict itself to"?', 'The second. The first is a reaction.', NULL),
  ('sc_l6_m5_lesson2_4', 'sc_l6_m5_lesson2', 4, 'Under oral defence, a question attacks your warrant. What do you answer?', 'The warrant — not the premise, which is the more comfortable point and the one candidates drift to.', NULL);

INSERT INTO self_checks (id, learning_item_id, intro) VALUES
  ('sc_l6_m6_lesson1', 'itm_l6_m6_lesson1', 'Check that you can invert a conditional accurately, and make an optimistic claim testable.');
INSERT INTO self_check_items (id, self_check_id, sequence, prompt, answer, trap) VALUES
  ('sc_l6_m6_lesson1_1', 'sc_l6_m6_lesson1', 1, 'Raise the register: "If this were to succeed, it would change the field."', 'Were this to succeed, it would change the field.', 'The inversion replaces ''if'', so ''if'' must go. ''If were this to succeed'' is the standard error, and it survives because the sentence still sounds impressively formal.'),
  ('sc_l6_m6_lesson1_2', 'sc_l6_m6_lesson1', 2, 'Give the inverted form for a past counterfactual and for an open future condition.', 'Had the approach been available five years ago, ... / Should the trial confirm these results, ...', NULL),
  ('sc_l6_m6_lesson1_3', 'sc_l6_m6_lesson1', 3, 'Make this testable: "This technology could transform logistics."', 'For this to transform logistics, three things would have to be true: unit cost would have to fall below X, approval would have to extend to Y, existing infrastructure would have to accommodate Z.', NULL),
  ('sc_l6_m6_lesson1_4', 'sc_l6_m6_lesson1', 4, 'What are the two failure modes of translating technical material, and what is the test?', 'Distortion and condescension. The test: a specialist accepts it as accurate and a non-specialist finds it useful.', 'Learners guard against condescension and simplify until the claim is no longer true — the more damaging of the two, and the harder to notice in your own writing.');

INSERT INTO self_checks (id, learning_item_id, intro) VALUES
  ('sc_l6_m6_lesson2', 'itm_l6_m6_lesson2', 'Check that you can build a talk around one idea and write a proposal that admits a risk.');
INSERT INTO self_check_items (id, self_check_id, sequence, prompt, answer, trap) VALUES
  ('sc_l6_m6_lesson2_1', 'sc_l6_m6_lesson2', 1, 'How many ideas does a keynote carry?', 'One. A keynote that tries to convey five conveys none.', 'Preparation makes this worse, not better: the more you know, the more the talk becomes a survey. The commonest failure of the form is caused by expertise, not by its absence.'),
  ('sc_l6_m6_lesson2_2', 'sc_l6_m6_lesson2', 2, 'What does a keynote close on?', 'A resolution — what the idea asks of the audience — not a summary.', NULL),
  ('sc_l6_m6_lesson2_3', 'sc_l6_m6_lesson2', 3, 'Name the five parts of a grant proposal.', 'Problem, approach, deliverables and milestones, risk, mitigation.', NULL),
  ('sc_l6_m6_lesson2_4', 'sc_l6_m6_lesson2', 4, 'Does disclosing a risk weaken a proposal?', 'It strengthens it. Assessors discount proposals claiming no risk, concluding the applicant has not thought hard enough.', 'Every instinct says hide it. This is the point in the level where the honest move and the strategic move are the same move, and learners have to be shown that before they believe it.');

INSERT INTO self_checks (id, learning_item_id, intro) VALUES
  ('sc_l6_m7_lesson1', 'itm_l6_m7_lesson1', 'Check that you can build a rhetorical figure deliberately and cut an editorial to length without losing the argument.');
INSERT INTO self_check_items (id, self_check_id, sequence, prompt, answer, trap) VALUES
  ('sc_l6_m7_lesson1_1', 'sc_l6_m7_lesson1', 1, 'Which element of a tricolon carries the weight?', 'The third, and it is typically the longest.', NULL),
  ('sc_l6_m7_lesson1_2', 'sc_l6_m7_lesson1', 2, 'Name the figure: "Not because it is easy, but because it is right."', 'Antithesis — parallel structure holding two opposites in tension.', NULL),
  ('sc_l6_m7_lesson1_3', 'sc_l6_m7_lesson1', 3, 'Where does an op-ed concede the strongest counter-argument?', 'Early. Buried at the end it reads as an afterthought.', 'Learners place the concession last because five levels of essay structure put it there. In 700 words with a stated position, late concession reads as retreat rather than confidence.'),
  ('sc_l6_m7_lesson1_4', 'sc_l6_m7_lesson1', 4, 'A passage in which every sentence is a tricolon — what has happened?', 'The devices work by contrast with plainer text. Used throughout, they sound evasive: the audience senses structure doing work the argument should do.', NULL);

INSERT INTO self_checks (id, learning_item_id, intro) VALUES
  ('sc_l6_m7_lesson2', 'itm_l6_m7_lesson2', 'Check that you can correct a false premise without sounding evasive, and say what you do not know.');
INSERT INTO self_check_items (id, self_check_id, sequence, prompt, answer, trap) VALUES
  ('sc_l6_m7_lesson2_1', 'sc_l6_m7_lesson2', 1, '"Given that the organisation ignored these warnings for two years, why should anyone trust it now?" — the premise is wrong. Answer it.', '"Let me correct the premise there — the warnings were received eleven months ago, not two years, and here is what happened in that period."', 'The instinct is either to accept the premise and defend, or to refuse the question. Correcting the premise and then answering the corrected question is neither, and an audience distinguishes it from evasion easily: evasion changes the subject.'),
  ('sc_l6_m7_lesson2_2', 'sc_l6_m7_lesson2', 2, 'Give the four parts of a crisis holding statement.', 'What we know / what we do not yet know / what we are doing / when you will hear from us next.', NULL),
  ('sc_l6_m7_lesson2_3', 'sc_l6_m7_lesson2', 3, 'Which of the four is most often omitted, and why does it matter?', 'What we do not yet know. Stating the limits of your knowledge is what makes the rest believable.', NULL),
  ('sc_l6_m7_lesson2_4', 'sc_l6_m7_lesson2', 4, 'An interviewer lands a genuine hit. What is the cheapest response?', 'Concede it immediately. Defending an indefensible point costs more credibility than the concession.', NULL);

INSERT INTO self_checks (id, learning_item_id, intro) VALUES
  ('sc_l6_m8_lesson1', 'itm_l6_m8_lesson1', 'Check that you can put a claim on the rung its evidence supports, and defend the placement.');
INSERT INTO self_check_items (id, self_check_id, sequence, prompt, answer, trap) VALUES
  ('sc_l6_m8_lesson1_1', 'sc_l6_m8_lesson1', 1, 'Classify: may / clearly / strikingly / consider.', 'Hedge / booster / attitude marker / engagement marker.', NULL),
  ('sc_l6_m8_lesson1_2', 'sc_l6_m8_lesson1', 2, 'Why is an unearned booster more damaging than an unnecessary hedge?', 'It destroys the reader''s trust in every other claim in the paper, including the ones that were properly supported.', 'Learners write ''clearly'' and ''demonstrably'' to sound confident, having been told all level that hedging weakens prose. One booster the evidence does not carry costs more than a page of hedges.'),
  ('sc_l6_m8_lesson1_3', 'sc_l6_m8_lesson1', 3, 'Rank by strength: "X suggests", "X indicates", "X demonstrates".', 'That is the order, weakest to strongest — and the reporting verb is a claim about your evidence, not a stylistic choice.', NULL),
  ('sc_l6_m8_lesson1_4', 'sc_l6_m8_lesson1', 4, 'Give the three moves of a research-paper introduction.', 'Establish the territory, identify the gap, state what the paper does.', NULL);

INSERT INTO self_checks (id, learning_item_id, intro) VALUES
  ('sc_l6_m8_lesson2', 'itm_l6_m8_lesson2', 'Check that you can turn a paper into a talk, and answer a question you cannot answer.');
INSERT INTO self_check_items (id, self_check_id, sequence, prompt, answer, trap) VALUES
  ('sc_l6_m8_lesson2_1', 'sc_l6_m8_lesson2', 1, 'What is the presentation''s job, as against the paper''s?', 'The paper''s job is to be complete; the presentation''s is to make one argument land and make the audience want to read the paper.', 'The paper exists and is finished, so reading it aloud feels safe and rigorous. It is the single commonest failure at conferences, and it is caused by preparation rather than by its absence.'),
  ('sc_l6_m8_lesson2_2', 'sc_l6_m8_lesson2', 2, 'Name the four kinds of conference question.', 'Clarification, genuine challenge, the questioner''s own research, and the question you cannot answer.', NULL),
  ('sc_l6_m8_lesson2_3', 'sc_l6_m8_lesson2', 3, 'Answer "I don''t know" in a form that strengthens your position.', '"I don''t know — that is outside what this data can show. What would settle it is X, and it is the obvious next study."', 'Learners improvise rather than admit a limit, and a specialist audience detects it instantly. A bounded ''I don''t know'' with a named next step reads as command of the material; a guess reads as its absence.'),
  ('sc_l6_m8_lesson2_4', 'sc_l6_m8_lesson2', 4, 'When do you state your limitation?', 'Before anyone asks. Stated by you it is scholarship; extracted from you it is a weakness.', NULL);

INSERT INTO self_checks (id, learning_item_id, intro) VALUES
  ('sc_l6_m9_lesson1', 'itm_l6_m9_lesson1', 'Check that you can grant a premise without conceding it, and name the frame someone is arguing from.');
INSERT INTO self_check_items (id, self_check_id, sequence, prompt, answer, trap) VALUES
  ('sc_l6_m9_lesson1_1', 'sc_l6_m9_lesson1', 1, 'What does each speaker commit to: "even though the trial was rushed" and "even if the trial was rushed"?', 'Even though accepts it as fact. Even if grants it hypothetically, often while specifically not accepting it.', 'The two are used interchangeably by most learners at entry to this lesson, which means they concede facts they meant to dispute — in writing, and permanently.'),
  ('sc_l6_m9_lesson1_2', 'sc_l6_m9_lesson1', 2, 'Complete the most useful frame in disputed argument: "Even if that ______ true, it would not follow that..."', 'were', NULL),
  ('sc_l6_m9_lesson1_3', 'sc_l6_m9_lesson1', 3, 'Form the however-inversion for "the commercial case is very compelling".', 'However compelling the commercial case may be, ...', NULL),
  ('sc_l6_m9_lesson1_4', 'sc_l6_m9_lesson1', 4, 'Name the three frames of moral argument, and say what changes when two speakers use different ones.', 'Consequences, duties, character. They are not disagreeing about the facts but about which considerations count — and neither will move until that is said aloud.', NULL);

INSERT INTO self_checks (id, learning_item_id, intro) VALUES
  ('sc_l6_m9_lesson2', 'itm_l6_m9_lesson2', 'Check that you can hold a room you have no vote in, and summarise a position you oppose.');
INSERT INTO self_check_items (id, self_check_id, sequence, prompt, answer, trap) VALUES
  ('sc_l6_m9_lesson2_1', 'sc_l6_m9_lesson2', 1, 'What is the success criterion of a deliberation, as against a debate?', 'That everyone — including those who lost the argument — can state the decision, its reasons, and the strongest objection to it.', 'Every prior speaking task in the programme rewarded winning. Applying debate''s criteria to a deliberation is the commonest reason organisational discussions leave resentment behind, and the learner doing it believes they performed well.'),
  ('sc_l6_m9_lesson2_2', 'sc_l6_m9_lesson2', 2, 'One speaker will not release the floor. Write the chair''s next sentence.', '"Let me hold you there — I want to test that against what we heard earlier."', NULL),
  ('sc_l6_m9_lesson2_3', 'sc_l6_m9_lesson2', 3, 'What must a fair summary of an opposed position satisfy?', 'Its holder accepts it as their position.', NULL),
  ('sc_l6_m9_lesson2_4', 'sc_l6_m9_lesson2', 4, 'Open the frame of a deliberation in one sentence.', '"We are deciding X, not Y; we have thirty minutes; I want to hear the objection before we hear the plan."', NULL);

INSERT INTO self_checks (id, learning_item_id, intro) VALUES
  ('sc_l6_m10_revlesson', 'itm_l6_m10_revlesson', 'Check that you can edit by protocol rather than by instinct, and name the failure your own genre is prone to.');
INSERT INTO self_check_items (id, self_check_id, sequence, prompt, answer, trap) VALUES
  ('sc_l6_m10_revlesson_1', 'sc_l6_m10_revlesson', 1, 'Name the four passes, in order.', 'Claim, route, voice, cut.', 'Run together they collapse into one instinctive read, which is the habit the protocol exists to break: each pass sees something the others cannot.'),
  ('sc_l6_m10_revlesson_2', 'sc_l6_m10_revlesson', 2, 'On the claim pass, you fix mismatches in how many directions?', 'Both. Over-hedging a well-evidenced claim is as inaccurate as over-claiming a weak one.', NULL),
  ('sc_l6_m10_revlesson_3', 'sc_l6_m10_revlesson', 3, 'On the route pass you had to look backwards to understand a sentence. What kind of fault is that?', 'Structural. It is almost always fixed by moving something earlier, not by rewriting the sentence.', 'The reflex is to rewrite the sentence you stumbled on. The fault is usually two pages above it.'),
  ('sc_l6_m10_revlesson_4', 'sc_l6_m10_revlesson', 4, 'Why ten per cent and not "where possible"?', 'At ten per cent you begin cutting sentences you liked, which is where the genuine redundancies are. A soft target cuts only what you never wanted.', NULL);
