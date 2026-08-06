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
