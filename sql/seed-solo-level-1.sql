-- ─────────────────────────────────────────────────────────────────────
-- SOLO REINFORCEMENT ACTIVITIES — IEFC LEVEL I
--
-- Seventeen activities, one for each Level I lesson whose architecture
-- requires another person: fifteen collaborative and two authentic
-- communication. The remaining two teaching lessons — I.4.2 and the
-- Revision Lesson — are already independent, and writing a "solo
-- alternative" to a solo lesson would be padding.
--
-- Every one names the collaborative task it serves and declares whether
-- it PREPARES the learner for that task or CONSOLIDATES it. The
-- database will not store any other relation.
--
-- The test of each is the same: if a learner did this instead of the
-- pair work, would they have got the lesson? The answer must be no.
-- Rehearsing "Where are you from?" aloud to a mirror is preparation for
-- asking a real person; it is not the same act, and the activity says
-- so.
--
-- Press-drafted. Not reviewed by any qualified academic.
-- ─────────────────────────────────────────────────────────────────────

INSERT INTO solo_activities
  (id, learning_item_id, serves_stage, serves_task, relation, activity, check_yourself) VALUES

('solo_l1_m1_lesson1', 'itm_l1_m1_lesson1', 'speaking',
 '"Find Someone Who" — greet five classmates and exchange names, unscripted.',
 'prepares',
 'Write the four greetings on four cards with the time of day on the back. Shuffle, turn one over, and say the greeting aloud before you look. Then record yourself saying the whole exchange — greeting, your name, the question, the reply — twice, once as each speaker. Spell your own name aloud at the end.',
 'Play the recording back. Did you say a time-of-day greeting that matches the card? Did you say "My name is Ana" OR "I''m Ana" — and not both together? Could a stranger write your name down correctly from your spelling?'),

('solo_l1_m1_lesson2', 'itm_l1_m1_lesson2', 'speaking',
 'Mingle and ask five classmates both "What''s your name?" and "Where are you from?", using your own real information.',
 'prepares',
 'Write your own country and city on a card. Then write six sentences about six real people you know — a relative, a neighbour, someone famous — each using "is from + country" and "lives in + city". Say each aloud.',
 'Check every sentence: is the country after "from" and the city after "lives in"? Did any country need "the"? Only the United Kingdom, the Netherlands and the USA on your list should have it.'),

('solo_l1_m2_lesson1', 'itm_l1_m2_lesson1', 'guided',
 'In pairs, ask "Is there a...?" and "Are there any...?" about six objects in a classroom picture.',
 'consolidates',
 'Stand in one room of your home and write ten sentences about what is in it — five with "there is", five with "there are". Then turn each of five of them into a question, and write the short answer underneath.',
 'Count the noun after each "there". Singular noun goes with "there is"; plural goes with "there are". In your questions, does "is" or "are" come FIRST? "Is there a window?" — not "There is a window?"'),

('solo_l1_m2_lesson2', 'itm_l1_m2_lesson2', 'speaking',
 'Create a "my neighbourhood" sketch map with five labelled places and describe it to a partner.',
 'prepares',
 'Draw your own sketch map before the class and label five real places near where you live, using the eight city words. Then write eight sentences about it: four with "this/these" for places you can walk to in a minute, four with "that/those" for places further away.',
 'Every "this" and "that" should be followed by ONE thing; every "these" and "those" by more than one. If you wrote "these bank", the word is wrong, not the place.'),

('solo_l1_m3_lesson1', 'itm_l1_m3_lesson1', 'speaking',
 'Draw and label your own family tree and describe it to a partner.',
 'prepares',
 'Draw your family tree — real, or invented if you prefer — and label every person with the English word. Then write eight sentences: four beginning "This is my...", four beginning "I have...". Add one sentence with possessive ''s ("my mother''s sister").',
 'Check the plurals: two brothers, three children — not "two brother", not "childrens". Check the apostrophe sits before the s in "my mother''s sister".'),

('solo_l1_m3_lesson2', 'itm_l1_m3_lesson2', 'guided',
 'Pair work — Learner A says a time, Learner B says what they typically do at that time.',
 'consolidates',
 'Write out your own real day from waking to sleeping: eight sentences, each with a time and a routine verb, in order, joined with first / then / after that / finally. Then rewrite all eight about someone else in your home, changing "I" to "he" or "she".',
 'In the second set, every verb should end in -s: she wakeS up, he startS. That -s is the single most common Level I mistake and this is where you catch it. Read the times aloud: is 8:45 "quarter to nine"?'),

('solo_l1_m4_lesson2', 'itm_l1_m4_lesson2', 'speaking',
 'Perform the full shop dialogue in pairs, taking turns as shopkeeper and customer.',
 'prepares',
 'Write out both halves of a shop dialogue for a real shopping list of six things — three countable, three uncountable. Then read it aloud twice, taking one part each time, and record the customer half so you can hear yourself.',
 'Check every price question: "How much IS the bread?" for one thing or an uncountable, "How much ARE the apples?" for more than one. Did you ask with "Can I have..., please?" — not "I want"?'),

('solo_l1_m5_lesson1', 'itm_l1_m5_lesson1', 'speaking',
 'Given a map with three places missing and prepositional clues, place the missing buildings correctly, then compare with a partner.',
 'prepares',
 'Draw a simple street with six buildings from the Module 2 list. Write six sentences describing where each one is, using a different preposition each time. Then cover the drawing and try to redraw it from your sentences alone.',
 'If your second drawing does not match the first, the sentence was ambiguous, not your memory. "Between" always needs two places joined by "and" — "between the bank AND the station".'),

('solo_l1_m5_lesson2', 'itm_l1_m5_lesson2', 'speaking',
 'Follow a partner''s spoken directions by tracing a route on a blank map, then check together.',
 'prepares',
 'Choose a real walk you know — from your home to a shop. Write the directions in English as if for a stranger: four to six steps, each an imperative, ending with how many minutes'' walk it is. Then say them aloud from memory.',
 'Look at the first word of every step. It should be a verb with no "you" in front of it: "Go straight on", not "You go straight on". Did you open with "Excuse me"?'),

('solo_l1_m6_lesson1', 'itm_l1_m6_lesson1', 'speaking',
 'Describe a real classmate, respectfully, using at least three target sentence patterns.',
 'prepares',
 'Choose three people you know well and describe each in four sentences, using "is" for general qualities and "has" for specific features. Then write one sentence for each that a stranger could use to pick that person out of a crowd.',
 'The commonest error: "He has tall". Tall, short, young and old go with IS. Hair, eyes and a beard go with HAS. Check "hair" is never plural.'),

('solo_l1_m6_lesson2', 'itm_l1_m6_lesson2', 'guided',
 'Pair work — mix a pile of real classroom belongings and take turns asking "Whose is this?"',
 'consolidates',
 'Put six of your own things on a table. Write twelve sentences about them: six using a possessive adjective before the noun ("This is my black bag"), six using a possessive pronoun alone ("It''s mine"). Include a size and a colour in at least four.',
 'Possessive pronouns never take an apostrophe: hers, ours, theirs, yours. And size comes before colour — "a small blue car", never "a blue small car".'),

('solo_l1_m7_lesson1', 'itm_l1_m7_lesson1', 'speaking',
 'Write five true sentences about your own yesterday, including one negative, then share with a partner.',
 'prepares',
 'Write ten sentences about your real yesterday using regular past verbs — eight positive, two negative with didn''t. Then read them aloud, listening for whether the -ed adds a syllable (visited = vi-si-ted) or does not (worked = one syllable).',
 'After "didn''t", every verb must be the BASE form: "I didn''t study", never "I didn''t studied". Check both negatives. Then check the -ied spellings: studied, but played.'),

('solo_l1_m7_lesson2', 'itm_l1_m7_lesson2', 'speaking',
 'Interview a partner about their real last weekend using at least two wh- questions, and report back one thing you learned.',
 'prepares',
 'Write the eight irregular pairs on cards, base form on one side and past on the other, and test yourself in both directions until you can do all eight without hesitating. Then write six questions you would genuinely want to ask someone about their weekend.',
 'Look at every question you wrote. After "Did you" the verb must be the BASE form: "Did you go?", never "Did you went?" That is the error the interview will expose if you take it into class.'),

('solo_l1_m8_lesson1', 'itm_l1_m8_lesson1', 'speaking',
 'Mingle and ask four classmates "Can you...?" questions, recording who can and cannot do each of four things.',
 'prepares',
 'Make a list of eight things people can do — cook, drive, swim, ride a bike, and four of your own. Write eight sentences about yourself, some positive and some negative, then eight about someone in your family.',
 'Can and can''t never change: "she can swim", not "she cans swim". This is the opposite of the -s rule from Module 3, and holding both at once is the point of the lesson.'),

('solo_l1_m8_lesson2', 'itm_l1_m8_lesson2', 'speaking',
 'Write your real plans for the coming weekend, then interview two classmates about theirs.',
 'prepares',
 'Write five real plans for your coming weekend using "going to", then write the question you would use to ask someone else about each one. Say both aloud.',
 'Check the form: am/is/are + going to + base verb. "I''m going to visit", never "I''m going to visiting". And check you wrote plans, not abilities — "I can swim" is not a plan.'),

('solo_l1_m9_lesson1', 'itm_l1_m9_lesson1', 'speaking',
 'Given four "sick day" scenario cards, roleplay a short phone call explaining why you cannot come in.',
 'prepares',
 'Label a drawing of a body with eight parts in English. Then write four short phone messages, each naming a different problem, using "I have" for the illness and "I feel" for how it makes you feel. Read them aloud as if leaving a voicemail.',
 'The two patterns must not mix. "I have a headache" — an illness, with HAVE. "I feel terrible" — a feeling, with FEEL and an adjective. "I have sick" and "I feel a headache" are both wrong.'),

('solo_l1_m9_lesson2', 'itm_l1_m9_lesson2', 'guided',
 'Pair work — state a health problem from a card and give one piece of matching advice.',
 'consolidates',
 'Write six health problems on the left of a page and six pieces of advice on the right, in a different order. Cover the right side and give your own advice for each problem aloud, using should or shouldn''t. Then uncover and compare.',
 'Where your advice differs from what you wrote, ask whether both are sensible — often they are, and more than one answer is right. Then check the form: should + BASE verb, same for every subject. "She should rests" is wrong.');
