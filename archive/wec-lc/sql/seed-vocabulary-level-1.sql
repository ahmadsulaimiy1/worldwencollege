-- ─────────────────────────────────────────────────────────────────────
-- VOCABULARY SETS — IEFC LEVEL I
--
-- Eighteen sets, one per teaching lesson. The nineteenth teaching
-- lesson — the Revision Lesson — has no set of its own on purpose: its
-- vocabulary stage is a cumulative relay across all nine modules, and
-- a nineteenth set would be a copy of the other eighteen under a new
-- name. The revision lesson's own objective asks a learner to recall
-- "at least 60 headwords from across the level's vocabulary sets",
-- which is the figure these eighteen have to satisfy between them.
--
-- Every headword is one the lesson already teaches. Nothing here adds
-- content to the curriculum: it lists what the presentation stage
-- introduces and the vocabulary activity assumes. Where the lesson
-- names the words itself — the eight city places, the eight irregular
-- verb pairs — they are used verbatim rather than substituted.
--
-- Examples use only language available at the point the word appears.
-- The Module 2 examples do not use the past tense; the Module 7
-- examples do, because Module 7 is where it is taught.
--
-- British English is the house variety and is stated where a learner
-- would otherwise be misled by a common American form.
--
-- Press-drafted. Not reviewed by any qualified academic.
-- ─────────────────────────────────────────────────────────────────────

-- ── Module 1 · Meeting People ────────────────────────────────────────

INSERT INTO vocabulary_sets (id, learning_item_id, title, activity) VALUES
  ('voc_l1_m1_lesson1', 'itm_l1_m1_lesson1', 'Greetings and introductions',
   'Chain drill and "Find Someone Who": each learner greets five classmates and exchanges names.');
INSERT INTO vocabulary_items (id, vocabulary_set_id, sequence, headword, part_of_speech, example, note) VALUES
  ('voc_l1_m1_lesson1_1', 'voc_l1_m1_lesson1', 1, 'hello', 'phrase', 'Hello! My name is Sofia.', NULL),
  ('voc_l1_m1_lesson1_2', 'voc_l1_m1_lesson1', 2, 'hi', 'phrase', 'Hi, Sofia! I''m Daniel.', 'Friendly. Use "hello" with a teacher or a stranger.'),
  ('voc_l1_m1_lesson1_3', 'voc_l1_m1_lesson1', 3, 'good morning', 'phrase', 'Good morning, Mr Ali.', 'Until about midday.'),
  ('voc_l1_m1_lesson1_4', 'voc_l1_m1_lesson1', 4, 'good afternoon', 'phrase', 'Good afternoon. Please sit down.', 'From midday until about 6 p.m.'),
  ('voc_l1_m1_lesson1_5', 'voc_l1_m1_lesson1', 5, 'good evening', 'phrase', 'Good evening. Welcome.', 'From about 6 p.m. It is a greeting; "good night" is a farewell.'),
  ('voc_l1_m1_lesson1_6', 'voc_l1_m1_lesson1', 6, 'goodbye', 'phrase', 'Goodbye! See you tomorrow.', NULL),
  ('voc_l1_m1_lesson1_7', 'voc_l1_m1_lesson1', 7, 'name', 'noun', 'My name is Ana.', 'Say "My name is Ana" or "I''m Ana" — never both together.'),
  ('voc_l1_m1_lesson1_8', 'voc_l1_m1_lesson1', 8, 'nice to meet you', 'phrase', 'Nice to meet you. — Nice to meet you too!', 'Only the first time you meet someone.'),
  ('voc_l1_m1_lesson1_9', 'voc_l1_m1_lesson1', 9, 'What''s your name?', 'phrase', 'What''s your name? — I''m Daniel.', NULL),
  ('voc_l1_m1_lesson1_10', 'voc_l1_m1_lesson1', 10, 'spell', 'verb', 'How do you spell your name?', NULL);

INSERT INTO vocabulary_sets (id, learning_item_id, title, activity) VALUES
  ('voc_l1_m1_lesson2', 'itm_l1_m1_lesson2', 'Countries and nationalities',
   'Country/nationality pair matching with the pairs introduced in the presentation.');
INSERT INTO vocabulary_items (id, vocabulary_set_id, sequence, headword, part_of_speech, example, note) VALUES
  ('voc_l1_m1_lesson2_1', 'voc_l1_m1_lesson2', 1, 'country', 'noun', 'Which country are you from?', NULL),
  ('voc_l1_m1_lesson2_2', 'voc_l1_m1_lesson2', 2, 'city', 'noun', 'I live in a big city.', NULL),
  ('voc_l1_m1_lesson2_3', 'voc_l1_m1_lesson2', 3, 'Brazil / Brazilian', 'noun', 'I''m from Brazil. I''m Brazilian.', 'No "the" before most country names.'),
  ('voc_l1_m1_lesson2_4', 'voc_l1_m1_lesson2', 4, 'Italy / Italian', 'noun', 'She''s from Italy. She''s Italian.', NULL),
  ('voc_l1_m1_lesson2_5', 'voc_l1_m1_lesson2', 5, 'Japan / Japanese', 'noun', 'He''s from Japan. He''s Japanese.', 'Not "the Japan".'),
  ('voc_l1_m1_lesson2_6', 'voc_l1_m1_lesson2', 6, 'Egypt / Egyptian', 'noun', 'We''re from Egypt. We''re Egyptian.', NULL),
  ('voc_l1_m1_lesson2_7', 'voc_l1_m1_lesson2', 7, 'Spain / Spanish', 'noun', 'They''re from Spain. They''re Spanish.', NULL),
  ('voc_l1_m1_lesson2_8', 'voc_l1_m1_lesson2', 8, 'the United Kingdom / British', 'noun', 'I''m from the United Kingdom. I''m British.', 'This one DOES take "the" — like the Netherlands and the USA.'),
  ('voc_l1_m1_lesson2_9', 'voc_l1_m1_lesson2', 9, 'be from', 'phrase', 'Where are you from? — I''m from Brazil.', '"I''m from" + country. Not "I''m come from".'),
  ('voc_l1_m1_lesson2_10', 'voc_l1_m1_lesson2', 10, 'live in', 'phrase', 'I live in Sao Paulo.', '"Live in" + city. "Be from" + country. They are not the same.');

-- ── Module 2 · Everyday Objects & Places ─────────────────────────────

INSERT INTO vocabulary_sets (id, learning_item_id, title, activity) VALUES
  ('voc_l1_m2_lesson1', 'itm_l1_m2_lesson1', 'Classroom and home objects',
   'Picture-matching game: classroom and home objects to their English names.');
INSERT INTO vocabulary_items (id, vocabulary_set_id, sequence, headword, part_of_speech, example, note) VALUES
  ('voc_l1_m2_lesson1_1', 'voc_l1_m2_lesson1', 1, 'board', 'noun', 'There is a board in the classroom.', NULL),
  ('voc_l1_m2_lesson1_2', 'voc_l1_m2_lesson1', 2, 'desk', 'noun', 'There is a teacher''s desk.', NULL),
  ('voc_l1_m2_lesson1_3', 'voc_l1_m2_lesson1', 3, 'chair', 'noun', 'There are ten chairs.', NULL),
  ('voc_l1_m2_lesson1_4', 'voc_l1_m2_lesson1', 4, 'book', 'noun', 'There are some books on the desk.', NULL),
  ('voc_l1_m2_lesson1_5', 'voc_l1_m2_lesson1', 5, 'pen', 'noun', 'Are there any pens? — Yes, there are.', NULL),
  ('voc_l1_m2_lesson1_6', 'voc_l1_m2_lesson1', 6, 'window', 'noun', 'Is there a window? — Yes, there is.', NULL),
  ('voc_l1_m2_lesson1_7', 'voc_l1_m2_lesson1', 7, 'door', 'noun', 'There is one door.', 'Open the door — not "open the light".'),
  ('voc_l1_m2_lesson1_8', 'voc_l1_m2_lesson1', 8, 'table', 'noun', 'There is a table in the kitchen.', NULL),
  ('voc_l1_m2_lesson1_9', 'voc_l1_m2_lesson1', 9, 'bed', 'noun', 'There is a bed in my room.', NULL),
  ('voc_l1_m2_lesson1_10', 'voc_l1_m2_lesson1', 10, 'lamp', 'noun', 'There is a lamp next to the bed.', NULL),
  ('voc_l1_m2_lesson1_11', 'voc_l1_m2_lesson1', 11, 'room', 'noun', 'There are four rooms in my house.', NULL),
  ('voc_l1_m2_lesson1_12', 'voc_l1_m2_lesson1', 12, 'kitchen', 'noun', 'There is a small table in the kitchen.', NULL);

INSERT INTO vocabulary_sets (id, learning_item_id, title, activity) VALUES
  ('voc_l1_m2_lesson2', 'itm_l1_m2_lesson2', 'Places in a city',
   'City-places bingo or matching game.');
INSERT INTO vocabulary_items (id, vocabulary_set_id, sequence, headword, part_of_speech, example, note) VALUES
  ('voc_l1_m2_lesson2_1', 'voc_l1_m2_lesson2', 1, 'bank', 'noun', 'This is a bank.', NULL),
  ('voc_l1_m2_lesson2_2', 'voc_l1_m2_lesson2', 2, 'school', 'noun', 'That''s my school, over there.', NULL),
  ('voc_l1_m2_lesson2_3', 'voc_l1_m2_lesson2', 3, 'hospital', 'noun', 'Where is the hospital?', NULL),
  ('voc_l1_m2_lesson2_4', 'voc_l1_m2_lesson2', 4, 'restaurant', 'noun', 'These are restaurants.', NULL),
  ('voc_l1_m2_lesson2_5', 'voc_l1_m2_lesson2', 5, 'supermarket', 'noun', 'That''s the supermarket.', NULL),
  ('voc_l1_m2_lesson2_6', 'voc_l1_m2_lesson2', 6, 'park', 'noun', 'This is a park.', NULL),
  ('voc_l1_m2_lesson2_7', 'voc_l1_m2_lesson2', 7, 'station', 'noun', 'What''s that? — That''s the train station.', NULL),
  ('voc_l1_m2_lesson2_8', 'voc_l1_m2_lesson2', 8, 'hotel', 'noun', 'Where is the hotel?', NULL),
  ('voc_l1_m2_lesson2_9', 'voc_l1_m2_lesson2', 9, 'this / these', 'determiner', 'This cup is mine. These books are new.', '"This" for one thing near you; "these" for more than one.'),
  ('voc_l1_m2_lesson2_10', 'voc_l1_m2_lesson2', 10, 'that / those', 'determiner', 'That building is a bank. Those cars are big.', '"That" for one thing far away; "those" for more than one.');

-- ── Module 3 · Family & Routines ─────────────────────────────────────

INSERT INTO vocabulary_sets (id, learning_item_id, title, activity) VALUES
  ('voc_l1_m3_lesson1', 'itm_l1_m3_lesson1', 'Family members',
   'Family-tree labelling race in pairs or small groups.');
INSERT INTO vocabulary_items (id, vocabulary_set_id, sequence, headword, part_of_speech, example, note) VALUES
  ('voc_l1_m3_lesson1_1', 'voc_l1_m3_lesson1', 1, 'mother', 'noun', 'This is my mother. Her name is Anna.', '"Mum" in everyday British speech.'),
  ('voc_l1_m3_lesson1_2', 'voc_l1_m3_lesson1', 2, 'father', 'noun', 'My father works in a hospital.', '"Dad" in everyday British speech.'),
  ('voc_l1_m3_lesson1_3', 'voc_l1_m3_lesson1', 3, 'brother', 'noun', 'I have two brothers.', NULL),
  ('voc_l1_m3_lesson1_4', 'voc_l1_m3_lesson1', 4, 'sister', 'noun', 'Do you have any sisters? — Yes, I do.', NULL),
  ('voc_l1_m3_lesson1_5', 'voc_l1_m3_lesson1', 5, 'son', 'noun', 'Their son is six.', NULL),
  ('voc_l1_m3_lesson1_6', 'voc_l1_m3_lesson1', 6, 'daughter', 'noun', 'My daughter is at school.', NULL),
  ('voc_l1_m3_lesson1_7', 'voc_l1_m3_lesson1', 7, 'grandmother', 'noun', 'My grandmother lives in Cairo.', NULL),
  ('voc_l1_m3_lesson1_8', 'voc_l1_m3_lesson1', 8, 'grandfather', 'noun', 'This is my grandfather.', NULL),
  ('voc_l1_m3_lesson1_9', 'voc_l1_m3_lesson1', 9, 'aunt', 'noun', 'This is my aunt — my mother''s sister.', NULL),
  ('voc_l1_m3_lesson1_10', 'voc_l1_m3_lesson1', 10, 'uncle', 'noun', 'My uncle has three children.', NULL),
  ('voc_l1_m3_lesson1_11', 'voc_l1_m3_lesson1', 11, 'cousin', 'noun', 'I have four cousins.', 'One word for male and female in English.'),
  ('voc_l1_m3_lesson1_12', 'voc_l1_m3_lesson1', 12, 'children', 'noun', 'I have two children.', 'Irregular plural of "child".');

INSERT INTO vocabulary_sets (id, learning_item_id, title, activity) VALUES
  ('voc_l1_m3_lesson2', 'itm_l1_m3_lesson2', 'Telling the time and daily routine',
   'Clock-matching game plus a routine-verb sequencing card sort.');
INSERT INTO vocabulary_items (id, vocabulary_set_id, sequence, headword, part_of_speech, example, note) VALUES
  ('voc_l1_m3_lesson2_1', 'voc_l1_m3_lesson2', 1, 'o''clock', 'phrase', 'I wake up at seven o''clock.', 'Only on the hour.'),
  ('voc_l1_m3_lesson2_2', 'voc_l1_m3_lesson2', 2, 'half past', 'phrase', 'I have breakfast at half past seven.', NULL),
  ('voc_l1_m3_lesson2_3', 'voc_l1_m3_lesson2', 3, 'quarter past', 'phrase', 'The class starts at quarter past nine.', NULL),
  ('voc_l1_m3_lesson2_4', 'voc_l1_m3_lesson2', 4, 'quarter to', 'phrase', 'It''s quarter to nine.', 'Quarter to NINE means 8:45 — "to" looks forward to the next hour.'),
  ('voc_l1_m3_lesson2_5', 'voc_l1_m3_lesson2', 5, 'wake up', 'verb', 'She wakes up at six.', 'Third person takes -s: she wakeS up.'),
  ('voc_l1_m3_lesson2_6', 'voc_l1_m3_lesson2', 6, 'get up', 'verb', 'What time do you get up?', 'Waking up and getting out of bed are two different things.'),
  ('voc_l1_m3_lesson2_7', 'voc_l1_m3_lesson2', 7, 'have breakfast', 'phrase', 'I have breakfast at home.', 'Not "eat breakfast" in most British usage.'),
  ('voc_l1_m3_lesson2_8', 'voc_l1_m3_lesson2', 8, 'go to work', 'phrase', 'He goes to work at eight.', 'No "the": go to work, go to school, go to bed.'),
  ('voc_l1_m3_lesson2_9', 'voc_l1_m3_lesson2', 9, 'start', 'verb', 'She starts work at nine.', NULL),
  ('voc_l1_m3_lesson2_10', 'voc_l1_m3_lesson2', 10, 'finish', 'verb', 'I finish at five o''clock.', NULL),
  ('voc_l1_m3_lesson2_11', 'voc_l1_m3_lesson2', 11, 'go to bed', 'phrase', 'I go to bed at eleven.', NULL),
  ('voc_l1_m3_lesson2_12', 'voc_l1_m3_lesson2', 12, 'first, then, after that, finally', 'adverb', 'First I get up, then I have breakfast, after that I go to work.', 'Sequence words for describing a routine in order.');

-- ── Module 4 · Food & Shopping ───────────────────────────────────────

INSERT INTO vocabulary_sets (id, learning_item_id, title, activity) VALUES
  ('voc_l1_m4_lesson1', 'itm_l1_m4_lesson1', 'Food, countable and uncountable',
   'Food flashcard naming race, sorted live into countable and uncountable.');
INSERT INTO vocabulary_items (id, vocabulary_set_id, sequence, headword, part_of_speech, example, note) VALUES
  ('voc_l1_m4_lesson1_1', 'voc_l1_m4_lesson1', 1, 'egg', 'noun', 'There are some eggs in the fridge.', 'Countable: an egg, two eggs.'),
  ('voc_l1_m4_lesson1_2', 'voc_l1_m4_lesson1', 2, 'apple', 'noun', 'Can I have three apples?', 'Countable. Takes "an", not "a".'),
  ('voc_l1_m4_lesson1_3', 'voc_l1_m4_lesson1', 3, 'banana', 'noun', 'There are four bananas.', 'Countable.'),
  ('voc_l1_m4_lesson1_4', 'voc_l1_m4_lesson1', 4, 'rice', 'noun', 'There is some rice in the cupboard.', 'Uncountable: never "a rice" or "two rices".'),
  ('voc_l1_m4_lesson1_5', 'voc_l1_m4_lesson1', 5, 'milk', 'noun', 'Is there any milk? — Yes, there is some.', 'Uncountable.'),
  ('voc_l1_m4_lesson1_6', 'voc_l1_m4_lesson1', 6, 'water', 'noun', 'There isn''t any water.', 'Uncountable.'),
  ('voc_l1_m4_lesson1_7', 'voc_l1_m4_lesson1', 7, 'bread', 'noun', 'We have some bread.', 'Uncountable in English, even though it is countable in many languages.'),
  ('voc_l1_m4_lesson1_8', 'voc_l1_m4_lesson1', 8, 'cheese', 'noun', 'Is there any cheese?', 'Uncountable.'),
  ('voc_l1_m4_lesson1_9', 'voc_l1_m4_lesson1', 9, 'chicken', 'noun', 'There is some chicken in the fridge.', 'Uncountable when it is food.'),
  ('voc_l1_m4_lesson1_10', 'voc_l1_m4_lesson1', 10, 'fridge', 'noun', 'The eggs are in the fridge.', NULL),
  ('voc_l1_m4_lesson1_11', 'voc_l1_m4_lesson1', 11, 'some', 'determiner', 'There is some rice.', 'Positive statements.'),
  ('voc_l1_m4_lesson1_12', 'voc_l1_m4_lesson1', 12, 'any', 'determiner', 'Is there any milk? There isn''t any bread.', 'Questions and negatives.');

INSERT INTO vocabulary_sets (id, learning_item_id, title, activity) VALUES
  ('voc_l1_m4_lesson2', 'itm_l1_m4_lesson2', 'Shopping, prices and requests',
   'Price-matching game in pairs: item cards to price cards.');
INSERT INTO vocabulary_items (id, vocabulary_set_id, sequence, headword, part_of_speech, example, note) VALUES
  ('voc_l1_m4_lesson2_1', 'voc_l1_m4_lesson2', 1, 'How much is...?', 'phrase', 'How much is the bread?', 'Singular and uncountable things.'),
  ('voc_l1_m4_lesson2_2', 'voc_l1_m4_lesson2', 2, 'How much are...?', 'phrase', 'How much are the apples?', 'Plural things.'),
  ('voc_l1_m4_lesson2_3', 'voc_l1_m4_lesson2', 3, 'Can I have..., please?', 'phrase', 'Can I have some apples, please?', 'The polite request. "I want" sounds rude in a shop.'),
  ('voc_l1_m4_lesson2_4', 'voc_l1_m4_lesson2', 4, 'Can I help you?', 'phrase', 'Can I help you? — Yes, please.', 'What the shop assistant says first.'),
  ('voc_l1_m4_lesson2_5', 'voc_l1_m4_lesson2', 5, 'Here you are', 'phrase', 'That''s three pounds. — Here you are.', 'Said when you hand something over.'),
  ('voc_l1_m4_lesson2_6', 'voc_l1_m4_lesson2', 6, 'price', 'noun', 'What''s the price?', NULL),
  ('voc_l1_m4_lesson2_7', 'voc_l1_m4_lesson2', 7, 'money', 'noun', 'I don''t have any money.', 'Uncountable: never "moneys".'),
  ('voc_l1_m4_lesson2_8', 'voc_l1_m4_lesson2', 8, 'change', 'noun', 'Here''s your change.', 'The money you get back.'),
  ('voc_l1_m4_lesson2_9', 'voc_l1_m4_lesson2', 9, 'pay', 'verb', 'I pay the bill.', 'Pay the bill — not "pay the money".'),
  ('voc_l1_m4_lesson2_10', 'voc_l1_m4_lesson2', 10, 'shop', 'noun', 'The shop is next to the bank.', '"Store" in American English.'),
  ('voc_l1_m4_lesson2_11', 'voc_l1_m4_lesson2', 11, 'do the shopping', 'phrase', 'I do the shopping on Saturday.', 'Not "make the shopping".'),
  ('voc_l1_m4_lesson2_12', 'voc_l1_m4_lesson2', 12, 'expensive / cheap', 'adjective', 'This is expensive. That one is cheap.', NULL);

-- ── Module 5 · Around Town ───────────────────────────────────────────

INSERT INTO vocabulary_sets (id, learning_item_id, title, activity) VALUES
  ('voc_l1_m5_lesson1', 'itm_l1_m5_lesson1', 'Prepositions of place',
   'Preposition mime/action game plus a map-labelling race.');
INSERT INTO vocabulary_items (id, vocabulary_set_id, sequence, headword, part_of_speech, example, note) VALUES
  ('voc_l1_m5_lesson1_1', 'voc_l1_m5_lesson1', 1, 'next to', 'preposition', 'The bank is next to the supermarket.', NULL),
  ('voc_l1_m5_lesson1_2', 'voc_l1_m5_lesson1', 2, 'opposite', 'preposition', 'The park is opposite the school.', 'On the other side of the road, facing it.'),
  ('voc_l1_m5_lesson1_3', 'voc_l1_m5_lesson1', 3, 'between', 'preposition', 'The hotel is between the bank and the station.', 'Always with two places, joined by "and".'),
  ('voc_l1_m5_lesson1_4', 'voc_l1_m5_lesson1', 4, 'in front of', 'preposition', 'There is a car in front of the hotel.', NULL),
  ('voc_l1_m5_lesson1_5', 'voc_l1_m5_lesson1', 5, 'behind', 'preposition', 'The park is behind the school.', NULL),
  ('voc_l1_m5_lesson1_6', 'voc_l1_m5_lesson1', 6, 'on', 'preposition', 'The book is on the table.', NULL),
  ('voc_l1_m5_lesson1_7', 'voc_l1_m5_lesson1', 7, 'in', 'preposition', 'The pen is in my bag.', NULL),
  ('voc_l1_m5_lesson1_8', 'voc_l1_m5_lesson1', 8, 'under', 'preposition', 'The bag is under the chair.', NULL),
  ('voc_l1_m5_lesson1_9', 'voc_l1_m5_lesson1', 9, 'near', 'preposition', 'The station is near my house.', NULL),
  ('voc_l1_m5_lesson1_10', 'voc_l1_m5_lesson1', 10, 'on the corner', 'phrase', 'The pharmacy is on the corner.', NULL);

INSERT INTO vocabulary_sets (id, learning_item_id, title, activity) VALUES
  ('voc_l1_m5_lesson2', 'itm_l1_m5_lesson2', 'Asking for and giving directions',
   'Direction-verb charades in small groups.');
INSERT INTO vocabulary_items (id, vocabulary_set_id, sequence, headword, part_of_speech, example, note) VALUES
  ('voc_l1_m5_lesson2_1', 'voc_l1_m5_lesson2', 1, 'Excuse me', 'phrase', 'Excuse me, how do I get to the library?', 'How you open the question. Without it, it sounds like an order.'),
  ('voc_l1_m5_lesson2_2', 'voc_l1_m5_lesson2', 2, 'How do I get to...?', 'phrase', 'How do I get to the station?', NULL),
  ('voc_l1_m5_lesson2_3', 'voc_l1_m5_lesson2', 3, 'go straight on', 'verb', 'Go straight on for two minutes.', 'No "you": the imperative has no subject.'),
  ('voc_l1_m5_lesson2_4', 'voc_l1_m5_lesson2', 4, 'turn left', 'verb', 'Turn left at the bank.', NULL),
  ('voc_l1_m5_lesson2_5', 'voc_l1_m5_lesson2', 5, 'turn right', 'verb', 'Then turn right.', NULL),
  ('voc_l1_m5_lesson2_6', 'voc_l1_m5_lesson2', 6, 'cross the road', 'verb', 'Cross the road at the lights.', 'Not "pass the road".'),
  ('voc_l1_m5_lesson2_7', 'voc_l1_m5_lesson2', 7, 'take the first left', 'phrase', 'Take the first left after the park.', NULL),
  ('voc_l1_m5_lesson2_8', 'voc_l1_m5_lesson2', 8, 'library', 'noun', 'The library is on the corner.', NULL),
  ('voc_l1_m5_lesson2_9', 'voc_l1_m5_lesson2', 9, 'pharmacy', 'noun', 'It''s next to the pharmacy.', '"Chemist''s" is also common in British English.'),
  ('voc_l1_m5_lesson2_10', 'voc_l1_m5_lesson2', 10, 'minutes'' walk', 'phrase', 'It''s about five minutes'' walk.', 'How distance is usually given in a town.'),
  ('voc_l1_m5_lesson2_11', 'voc_l1_m5_lesson2', 11, 'catch a bus', 'phrase', 'I catch a bus to work.', 'British usage; "take a bus" is more American.'),
  ('voc_l1_m5_lesson2_12', 'voc_l1_m5_lesson2', 12, 'Thank you very much', 'phrase', 'Thank you very much! — You''re welcome.', NULL);

-- ── Module 6 · Describing People & Things ────────────────────────────

INSERT INTO vocabulary_sets (id, learning_item_id, title, activity) VALUES
  ('voc_l1_m6_lesson1', 'itm_l1_m6_lesson1', 'Describing appearance',
   'Appearance-adjective picture-matching game.');
INSERT INTO vocabulary_items (id, vocabulary_set_id, sequence, headword, part_of_speech, example, note) VALUES
  ('voc_l1_m6_lesson1_1', 'voc_l1_m6_lesson1', 1, 'tall', 'adjective', 'He''s tall.', 'He IS tall — not "he has tall".'),
  ('voc_l1_m6_lesson1_2', 'voc_l1_m6_lesson1', 2, 'short', 'adjective', 'She''s short.', 'Also used for hair: short black hair.'),
  ('voc_l1_m6_lesson1_3', 'voc_l1_m6_lesson1', 3, 'young', 'adjective', 'My cousin is young.', NULL),
  ('voc_l1_m6_lesson1_4', 'voc_l1_m6_lesson1', 4, 'old', 'adjective', 'My grandfather is old.', NULL),
  ('voc_l1_m6_lesson1_5', 'voc_l1_m6_lesson1', 5, 'hair', 'noun', 'He has short black hair.', 'Uncountable: never "hairs" for the hair on your head.'),
  ('voc_l1_m6_lesson1_6', 'voc_l1_m6_lesson1', 6, 'eyes', 'noun', 'She has brown eyes.', NULL),
  ('voc_l1_m6_lesson1_7', 'voc_l1_m6_lesson1', 7, 'long', 'adjective', 'She has long hair.', NULL),
  ('voc_l1_m6_lesson1_8', 'voc_l1_m6_lesson1', 8, 'wear glasses', 'phrase', 'He wears glasses.', 'Not "use glasses".'),
  ('voc_l1_m6_lesson1_9', 'voc_l1_m6_lesson1', 9, 'beard', 'noun', 'My uncle has a beard.', NULL),
  ('voc_l1_m6_lesson1_10', 'voc_l1_m6_lesson1', 10, 'look like', 'phrase', 'What does she look like? — She''s tall.', '"Look like" asks about appearance. "Look" alone means seem.');

INSERT INTO vocabulary_sets (id, learning_item_id, title, activity) VALUES
  ('voc_l1_m6_lesson2', 'itm_l1_m6_lesson2', 'Belongings and possessives',
   '"Whose is it?" belongings game in small groups.');
INSERT INTO vocabulary_items (id, vocabulary_set_id, sequence, headword, part_of_speech, example, note) VALUES
  ('voc_l1_m6_lesson2_1', 'voc_l1_m6_lesson2', 1, 'my / mine', 'pronoun', 'This is my bag. It''s mine.', '"My" goes before a noun; "mine" stands alone.'),
  ('voc_l1_m6_lesson2_2', 'voc_l1_m6_lesson2', 2, 'your / yours', 'pronoun', 'Is this your pen? — Yes, it''s yours.', NULL),
  ('voc_l1_m6_lesson2_3', 'voc_l1_m6_lesson2', 3, 'his', 'pronoun', 'That''s his coat. It''s his.', 'The same word both times — the only one that does this.'),
  ('voc_l1_m6_lesson2_4', 'voc_l1_m6_lesson2', 4, 'her / hers', 'pronoun', 'This is her book. It''s hers.', 'No apostrophe: hers, not her''s.'),
  ('voc_l1_m6_lesson2_5', 'voc_l1_m6_lesson2', 5, 'our / ours', 'pronoun', 'This is our classroom. It''s ours.', NULL),
  ('voc_l1_m6_lesson2_6', 'voc_l1_m6_lesson2', 6, 'their / theirs', 'pronoun', 'That''s their car. It''s theirs.', NULL),
  ('voc_l1_m6_lesson2_7', 'voc_l1_m6_lesson2', 7, 'Whose is this?', 'phrase', 'Whose is this? — It''s mine.', NULL),
  ('voc_l1_m6_lesson2_8', 'voc_l1_m6_lesson2', 8, 'bag', 'noun', 'A big red bag.', NULL),
  ('voc_l1_m6_lesson2_9', 'voc_l1_m6_lesson2', 9, 'coat', 'noun', 'Is this your coat?', NULL),
  ('voc_l1_m6_lesson2_10', 'voc_l1_m6_lesson2', 10, 'phone', 'noun', 'That''s my phone.', NULL),
  ('voc_l1_m6_lesson2_11', 'voc_l1_m6_lesson2', 11, 'big / small', 'adjective', 'A big red bag. A small blue car.', 'Size comes before colour: big red, not red big.'),
  ('voc_l1_m6_lesson2_12', 'voc_l1_m6_lesson2', 12, 'red, blue, black, white, green', 'adjective', 'A small blue car.', NULL);

-- ── Module 7 · Past Experiences ──────────────────────────────────────

INSERT INTO vocabulary_sets (id, learning_item_id, title, activity) VALUES
  ('voc_l1_m7_lesson1', 'itm_l1_m7_lesson1', 'Regular past verbs',
   'Past-tense verb bingo: the base form is called, learners mark the past form.');
INSERT INTO vocabulary_items (id, vocabulary_set_id, sequence, headword, part_of_speech, example, note) VALUES
  ('voc_l1_m7_lesson1_1', 'voc_l1_m7_lesson1', 1, 'work — worked', 'verb', 'Yesterday I worked in the morning.', NULL),
  ('voc_l1_m7_lesson1_2', 'voc_l1_m7_lesson1', 2, 'watch — watched', 'verb', 'I watched TV in the evening.', NULL),
  ('voc_l1_m7_lesson1_3', 'voc_l1_m7_lesson1', 3, 'study — studied', 'verb', 'She studied last night.', 'y becomes -ied after a consonant.'),
  ('voc_l1_m7_lesson1_4', 'voc_l1_m7_lesson1', 4, 'play — played', 'verb', 'We played football.', 'y stays after a vowel: played, not "plaied".'),
  ('voc_l1_m7_lesson1_5', 'voc_l1_m7_lesson1', 5, 'listen — listened', 'verb', 'I listened to music.', NULL),
  ('voc_l1_m7_lesson1_6', 'voc_l1_m7_lesson1', 6, 'cook — cooked', 'verb', 'He cooked dinner.', NULL),
  ('voc_l1_m7_lesson1_7', 'voc_l1_m7_lesson1', 7, 'visit — visited', 'verb', 'They visited their grandmother.', 'The -ed is a whole syllable here: vi-si-ted.'),
  ('voc_l1_m7_lesson1_8', 'voc_l1_m7_lesson1', 8, 'stay — stayed', 'verb', 'I stayed at home.', NULL),
  ('voc_l1_m7_lesson1_9', 'voc_l1_m7_lesson1', 9, 'yesterday', 'adverb', 'Yesterday I worked.', 'Goes with the past, never the present.'),
  ('voc_l1_m7_lesson1_10', 'voc_l1_m7_lesson1', 10, 'last night', 'phrase', 'I didn''t study last night.', NULL),
  ('voc_l1_m7_lesson1_11', 'voc_l1_m7_lesson1', 11, 'didn''t', 'verb', 'I didn''t study.', 'After didn''t, use the BASE verb: didn''t study, not "didn''t studied".');

INSERT INTO vocabulary_sets (id, learning_item_id, title, activity) VALUES
  ('voc_l1_m7_lesson2', 'itm_l1_m7_lesson2', 'Irregular past verbs',
   'Irregular-verb pairs memory/matching game.');
INSERT INTO vocabulary_items (id, vocabulary_set_id, sequence, headword, part_of_speech, example, note) VALUES
  ('voc_l1_m7_lesson2_1', 'voc_l1_m7_lesson2', 1, 'go — went', 'verb', 'I went to the beach.', NULL),
  ('voc_l1_m7_lesson2_2', 'voc_l1_m7_lesson2', 2, 'see — saw', 'verb', 'I saw my cousins.', NULL),
  ('voc_l1_m7_lesson2_3', 'voc_l1_m7_lesson2', 3, 'have — had', 'verb', 'We had a great time!', NULL),
  ('voc_l1_m7_lesson2_4', 'voc_l1_m7_lesson2', 4, 'eat — ate', 'verb', 'We ate at a restaurant.', NULL),
  ('voc_l1_m7_lesson2_5', 'voc_l1_m7_lesson2', 5, 'do — did', 'verb', 'What did you do?', NULL),
  ('voc_l1_m7_lesson2_6', 'voc_l1_m7_lesson2', 6, 'make — made', 'verb', 'She made a cake.', '"Make" for things you create; "do" for activities.'),
  ('voc_l1_m7_lesson2_7', 'voc_l1_m7_lesson2', 7, 'buy — bought', 'verb', 'I bought a new phone.', NULL),
  ('voc_l1_m7_lesson2_8', 'voc_l1_m7_lesson2', 8, 'get — got', 'verb', 'He got home at nine.', NULL),
  ('voc_l1_m7_lesson2_9', 'voc_l1_m7_lesson2', 9, 'Did you...?', 'phrase', 'Did you go out last weekend? — Yes, I did.', 'Did + subject + BASE verb: "Did you go", not "Did you went".'),
  ('voc_l1_m7_lesson2_10', 'voc_l1_m7_lesson2', 10, 'last weekend', 'phrase', 'Where did you go last weekend?', NULL),
  ('voc_l1_m7_lesson2_11', 'voc_l1_m7_lesson2', 11, 'have a good time', 'phrase', 'We had a good time.', 'Not "pass a good time".'),
  ('voc_l1_m7_lesson2_12', 'voc_l1_m7_lesson2', 12, 'take a photo', 'phrase', 'I took a photo of the beach.', 'Not "make a photo".');

-- ── Module 8 · Plans & Abilities ─────────────────────────────────────

INSERT INTO vocabulary_sets (id, learning_item_id, title, activity) VALUES
  ('voc_l1_m8_lesson1', 'itm_l1_m8_lesson1', 'Talking about ability',
   'Ability-verb charades.');
INSERT INTO vocabulary_items (id, vocabulary_set_id, sequence, headword, part_of_speech, example, note) VALUES
  ('voc_l1_m8_lesson1_1', 'voc_l1_m8_lesson1', 1, 'can / can''t', 'verb', 'I can cook. I can''t drive.', 'Same form for every subject: she can, not "she cans".'),
  ('voc_l1_m8_lesson1_2', 'voc_l1_m8_lesson1', 2, 'cook', 'verb', 'Can you cook? — Yes, I can.', NULL),
  ('voc_l1_m8_lesson1_3', 'voc_l1_m8_lesson1', 3, 'drive', 'verb', 'I can''t drive.', NULL),
  ('voc_l1_m8_lesson1_4', 'voc_l1_m8_lesson1', 4, 'swim', 'verb', 'Can you swim? — No, I can''t.', NULL),
  ('voc_l1_m8_lesson1_5', 'voc_l1_m8_lesson1', 5, 'ride a bike', 'phrase', 'She can ride a bike.', 'Ride a bike — not "drive a bike".'),
  ('voc_l1_m8_lesson1_6', 'voc_l1_m8_lesson1', 6, 'play football', 'phrase', 'They can play football.', '"Play" for games and sports.'),
  ('voc_l1_m8_lesson1_7', 'voc_l1_m8_lesson1', 7, 'sing', 'verb', 'He can sing very well.', NULL),
  ('voc_l1_m8_lesson1_8', 'voc_l1_m8_lesson1', 8, 'dance', 'verb', 'I can''t dance.', NULL),
  ('voc_l1_m8_lesson1_9', 'voc_l1_m8_lesson1', 9, 'speak', 'verb', 'She can speak three languages.', NULL),
  ('voc_l1_m8_lesson1_10', 'voc_l1_m8_lesson1', 10, 'learn to', 'phrase', 'I want to learn to swim.', '"Learn to" + verb.');

INSERT INTO vocabulary_sets (id, learning_item_id, title, activity) VALUES
  ('voc_l1_m8_lesson2', 'itm_l1_m8_lesson2', 'Plans and free time',
   'Weekend-plan picture cards matched to "going to" sentence starters.');
INSERT INTO vocabulary_items (id, vocabulary_set_id, sequence, headword, part_of_speech, example, note) VALUES
  ('voc_l1_m8_lesson2_1', 'voc_l1_m8_lesson2', 1, 'going to', 'phrase', 'I''m going to visit my parents.', 'am/is/are + going to + BASE verb. A plan, not an ability.'),
  ('voc_l1_m8_lesson2_2', 'voc_l1_m8_lesson2', 2, 'this weekend', 'phrase', 'What are you going to do this weekend?', NULL),
  ('voc_l1_m8_lesson2_3', 'voc_l1_m8_lesson2', 3, 'visit', 'verb', 'She''s going to visit her aunt.', NULL),
  ('voc_l1_m8_lesson2_4', 'voc_l1_m8_lesson2', 4, 'go shopping', 'phrase', 'We''re going to go shopping.', NULL),
  ('voc_l1_m8_lesson2_5', 'voc_l1_m8_lesson2', 5, 'meet a friend', 'phrase', 'I''m going to meet a friend.', '"Meet" for arranging to see someone — not "know".'),
  ('voc_l1_m8_lesson2_6', 'voc_l1_m8_lesson2', 6, 'stay at home', 'phrase', 'They''re going to stay at home.', NULL),
  ('voc_l1_m8_lesson2_7', 'voc_l1_m8_lesson2', 7, 'travel', 'verb', 'He''s going to travel next month.', NULL),
  ('voc_l1_m8_lesson2_8', 'voc_l1_m8_lesson2', 8, 'holiday', 'noun', 'I''m going to go on holiday.', '"Vacation" in American English.'),
  ('voc_l1_m8_lesson2_9', 'voc_l1_m8_lesson2', 9, 'tomorrow', 'adverb', 'What are you going to do tomorrow?', NULL),
  ('voc_l1_m8_lesson2_10', 'voc_l1_m8_lesson2', 10, 'next week', 'phrase', 'We''re going to start next week.', NULL);

-- ── Module 9 · Health & Feelings ─────────────────────────────────────

INSERT INTO vocabulary_sets (id, learning_item_id, title, activity) VALUES
  ('voc_l1_m9_lesson1', 'itm_l1_m9_lesson1', 'The body, health and feelings',
   'Body-part labelling diagram race in pairs.');
INSERT INTO vocabulary_items (id, vocabulary_set_id, sequence, headword, part_of_speech, example, note) VALUES
  ('voc_l1_m9_lesson1_1', 'voc_l1_m9_lesson1', 1, 'head', 'noun', 'My head hurts.', NULL),
  ('voc_l1_m9_lesson1_2', 'voc_l1_m9_lesson1', 2, 'stomach', 'noun', 'I have a stomach ache.', NULL),
  ('voc_l1_m9_lesson1_3', 'voc_l1_m9_lesson1', 3, 'throat', 'noun', 'I have a sore throat.', NULL),
  ('voc_l1_m9_lesson1_4', 'voc_l1_m9_lesson1', 4, 'back', 'noun', 'My back hurts.', NULL),
  ('voc_l1_m9_lesson1_5', 'voc_l1_m9_lesson1', 5, 'leg', 'noun', 'She has a bad leg.', NULL),
  ('voc_l1_m9_lesson1_6', 'voc_l1_m9_lesson1', 6, 'arm', 'noun', 'My arm hurts.', NULL),
  ('voc_l1_m9_lesson1_7', 'voc_l1_m9_lesson1', 7, 'headache', 'noun', 'I have a headache.', 'HAVE a headache. Not "I am headache".'),
  ('voc_l1_m9_lesson1_8', 'voc_l1_m9_lesson1', 8, 'a cold', 'noun', 'She has a cold.', 'Catch a cold — not "take a cold".'),
  ('voc_l1_m9_lesson1_9', 'voc_l1_m9_lesson1', 9, 'a temperature', 'noun', 'He has a temperature.', NULL),
  ('voc_l1_m9_lesson1_10', 'voc_l1_m9_lesson1', 10, 'feel', 'verb', 'I feel terrible. I feel sick.', 'FEEL + adjective. No "have" here: "I feel sick", not "I have sick".'),
  ('voc_l1_m9_lesson1_11', 'voc_l1_m9_lesson1', 11, 'tired', 'adjective', 'I feel tired.', NULL),
  ('voc_l1_m9_lesson1_12', 'voc_l1_m9_lesson1', 12, 'What''s the matter?', 'phrase', 'What''s the matter? — I have a headache.', 'Also: How are you feeling?');

INSERT INTO vocabulary_sets (id, learning_item_id, title, activity) VALUES
  ('voc_l1_m9_lesson2', 'itm_l1_m9_lesson2', 'Giving advice and well-wishing',
   'Problem-and-advice matching game, timed, in small groups.');
INSERT INTO vocabulary_items (id, vocabulary_set_id, sequence, headword, part_of_speech, example, note) VALUES
  ('voc_l1_m9_lesson2_1', 'voc_l1_m9_lesson2', 1, 'should / shouldn''t', 'verb', 'You should rest. You shouldn''t look at your phone.', 'Same form for every subject, and always + BASE verb.'),
  ('voc_l1_m9_lesson2_2', 'voc_l1_m9_lesson2', 2, 'rest', 'verb', 'You should rest today.', NULL),
  ('voc_l1_m9_lesson2_3', 'voc_l1_m9_lesson2', 3, 'take medicine', 'phrase', 'You should take some medicine.', 'Take medicine — not "drink medicine".'),
  ('voc_l1_m9_lesson2_4', 'voc_l1_m9_lesson2', 4, 'see a doctor', 'phrase', 'You should see a doctor.', NULL),
  ('voc_l1_m9_lesson2_5', 'voc_l1_m9_lesson2', 5, 'drink water', 'phrase', 'You should drink some water.', NULL),
  ('voc_l1_m9_lesson2_6', 'voc_l1_m9_lesson2', 6, 'go to bed early', 'phrase', 'You should go to bed early.', NULL),
  ('voc_l1_m9_lesson2_7', 'voc_l1_m9_lesson2', 7, 'stay in bed', 'phrase', 'You should stay in bed today.', NULL),
  ('voc_l1_m9_lesson2_8', 'voc_l1_m9_lesson2', 8, 'feel better', 'phrase', 'I feel better now.', 'Not "feel more good".'),
  ('voc_l1_m9_lesson2_9', 'voc_l1_m9_lesson2', 9, 'Get well soon!', 'phrase', 'Get well soon! — Thank you.', NULL),
  ('voc_l1_m9_lesson2_10', 'voc_l1_m9_lesson2', 10, 'That''s a good idea', 'phrase', 'You should rest. — That''s a good idea.', 'How you accept advice.');
