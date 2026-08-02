-- WEC-LC — Real curriculum content seed: Level V ("Advanced
-- Programme," C1). Authored per your Level V directive — establishing
-- WEC-LC as a premium international English institution, moving
-- learners "beyond language competence into intellectual
-- communication" — see docs/curriculum-framework.md (the six-level
-- architecture, including this level's Executive Academic Objective
-- note) and docs/curriculum-level-5-advanced.md (this level's module
-- map, § What's different from Level IV, and Module 1's full prose
-- version) plus docs/curriculum/level-5/module-{02..10}-*.md for
-- Modules 2-10.
--
-- Deliberately a SEPARATE file from sql/schema.sql and from the
-- other level seed files — see any of their headers for why
-- curriculum content is never baked into schema.sql. Apply after
-- schema.sql:
--   wrangler d1 execute wec-lc --file=sql/schema.sql
--   wrangler d1 execute wec-lc --file=sql/seed-curriculum-level-5.sql

-- ---------------------------------------------------------------------
-- Module 1: Nuance & Idiom
-- Full prose version: docs/curriculum-level-5-advanced.md
-- ---------------------------------------------------------------------
INSERT INTO units (id, course_id, sequence, title) VALUES
  ('unt_l5_m1', 'crs_level_5', 1, 'Module 1: Nuance & Idiom');

INSERT INTO learning_items (id, unit_id, sequence, kind, title, body) VALUES
('itm_l5_m1_overview', 'unt_l5_m1', 1, 'reading', 'Module Overview & Key Phrases',
'KEY PHRASES: If I had..., I''d be... -- If I were..., I would have... -- To put it bluntly,... -- In a nutshell,... -- At the end of the day,... -- For what it''s worth,...

DISCOURSE MARKERS (functional set -- idiomatic hedging and framing, register-graded): "to put it bluntly" (direct, informal-to-neutral), "in a nutshell" (neutral, summarising), "at the end of the day" (neutral-to-informal, concluding), "for what it''s worth" (a modest hedge before an opinion).

PHRASAL VERBS & COLLOCATIONS (meta-communicative -- about precise communication itself): "get to the point" (stop delaying and state the main idea), "read between the lines" (understand an implied meaning), "strike the right tone" (communicate with appropriate register/attitude), "walk a fine line" (balance two competing concerns carefully), "choose your words carefully".

BrE / AmE NOTE: British English says "at a loose end" (singular, meaning having nothing to do), while American English says "at loose ends" (plural) for the identical meaning -- idiomatic English can differ grammatically, not just in vocabulary, even within the same fixed expression.

KEY VOCABULARY: register vocabulary (formal, informal, neutral, colloquial, register-appropriate), documentation vocabulary (style guide, tone of voice, audience, convention). Intercultural note: what counts as "appropriately direct" versus "too blunt" varies significantly, and this module favours widely-understood idiomatic language.'),

('itm_l5_m1_lesson1', 'unt_l5_m1', 2, 'reading', 'Lesson 1.1 -- If I Had Studied That, I''d Be... -- Mixed Conditionals',
'LEARNING OBJECTIVES: (1) form a mixed conditional with a past condition and a present result (If I had + past participle, I would + base verb), (2) form a mixed conditional with a present/general condition and a past result (If I were/weren''t + adjective/noun, I would have + past participle), (3) choose correctly between a "pure" second/third conditional and a mixed conditional based on the actual time references involved, (4) use mixed conditionals naturally in reflective and professional speech.

PREREQUISITE KNOWLEDGE: Level III, Module 8 (second conditional); Level IV, Module 3 (third conditional).

WARM-UP (5 min): Your instructor states one real reflection with mismatched time references ("If I hadn''t taken that internship, I probably wouldn''t be working in this field now") -- which part is about the past and which is about the present?

PRESENTATION (10 min): "If I had studied medicine, I''d be a doctor now" (past condition, present result). "If I weren''t so cautious by nature, I would have taken that risk back then" (present/general condition, past result). Mixed conditionals exist because real reflection rarely respects tidy single-timeframe boundaries -- a past decision has present consequences; a present trait would have changed a past outcome.

GUIDED PRACTICE (10 min): You are given 8 real-sounding reflective sentence pairs and combine each into a correctly mixed conditional, identifying which clause is past and which is present.

INDEPENDENT PRACTICE / SPEAKING ACTIVITY (10 min): Write 5 mixed-conditional sentences reflecting on real or invented past decisions and their present consequences, then share one with a partner, who identifies the time reference of each clause.

CRITICAL THINKING / DISCUSSION PROMPT: "Do you think people reflect on their lives more often using ''pure'' hypotheticals (all one timeframe) or mixed ones (past decisions, present consequences)? Why might mixed reflection feel more natural?"

LISTENING ACTIVITY (5 min): Listen to someone reflecting using mixed conditionals and identify the time reference of each clause in each sentence.

READING ACTIVITY -- EXTENDED READING & CRITICAL EVALUATION (8 min): Read a short professional reflection excerpt (150-180 words) using mixed conditionals. Answer 2 literal questions and 2 evaluative questions.

WRITING TASK (5 min): Write 4-5 mixed-conditional sentences reflecting on your own real decisions and their consequences, checking carefully that each clause''s time reference is correct.

PRONUNCIATION PRACTICE (5 min): The heavily contracted, natural-speed pronunciation of mixed conditionals ("If I''d studied medicine, I''d be a doctor now") -- both ''d contractions doing different grammatical work.

VOCABULARY REINFORCEMENT: a conditional-type sorting game: sort 10 example sentences into second, third, or mixed conditional.

FORMATIVE ASSESSMENT: Instructor checks correct mixed-conditional formation and correct identification of each clause''s time reference during independent practice.

HOMEWORK: Think of one real professional or personal message you''d need to communicate differently to three different audiences and jot down brief notes, ready for Lesson 1.2''s register-shifting work.

REVISION: Lesson 1.2 opens with learners briefly naming their homework message in one sentence.

EXTENSION: Add a third mixed-conditional sentence combining a hypothetical future consequence with a past cause.'),

('itm_l5_m1_lesson2', 'unt_l5_m1', 3, 'reading', 'Lesson 1.2 -- Reading the Room -- Idiom, Collocation & Register-Shifting',
'LEARNING OBJECTIVES: (1) use a range of C1-level idiomatic expressions and collocations naturally and correctly, (2) identify the register (formal/neutral/informal) of a given expression, (3) deliberately rewrite the same message across three registers for three different audiences, (4) write a short professional document demonstrating consistent, precise register control.

PREREQUISITE KNOWLEDGE: Lesson 1.1 (mixed conditionals); Level IV Module 9 (register-editing precursor).

WARM-UP (5 min): Your instructor delivers the same short message three times -- to a close friend, to a manager, and in a formal written announcement -- what specifically changed?

PRESENTATION (10 min): Three versions of one message: INFORMAL ("Hey, heads up -- we''re a bit behind on this, so let''s touch base tomorrow and sort it out"); NEUTRAL/PROFESSIONAL ("Just to flag -- we''re slightly behind schedule on this. Could we catch up tomorrow to discuss next steps?"); FORMAL ("I am writing to inform you that the project is currently behind schedule. I would welcome the opportunity to discuss this further at your earliest convenience."). The content is identical; what changes is idiom choice, contraction use, sentence length, and directness.

GUIDED PRACTICE (10 min): You are given 8 idiomatic expressions/collocations and sort them by register (formal/neutral/informal), then rewrite 3 informal sentences into neutral/professional register.

INDEPENDENT PRACTICE (10 min): Using your Lesson 1.1 homework notes, rewrite your chosen message in all three registers, then read your three versions to a partner, who identifies which register each version represents without being told.

SPEAKING ACTIVITY: The partner identification exchange above, followed by a brief whole-class discussion of any version where the register was ambiguous or unclear, and why.

CRITICAL THINKING / DISCUSSION PROMPT: "Is it possible to be ''too formal'' or ''too informal'' in a way that actually damages communication, even if the grammar is perfectly correct? Can you think of an example?"

LISTENING ACTIVITY (5 min): Listen to the same short message delivered in two different registers and identify specific words/phrases that signal each register.

READING ACTIVITY (5 min): Read a short style-guide excerpt (a generic, invented professional communication guide) and identify its register recommendations and example idiomatic phrases.

WRITING TASK (5 min): Draft the opening section of your Module 1 assignment: a one-paragraph introduction to your communication style guide.

PRONUNCIATION PRACTICE (5 min): The prosodic differences between registers -- informal speech''s faster pace and wider pitch range, versus formal speech''s more measured pace and level intonation.

VOCABULARY REINFORCEMENT: a register-sorting relay: sort 12 idiomatic expressions/collocations into formal/neutral/informal columns.

FORMATIVE ASSESSMENT: Instructor checks that all three register versions preserve the same core content while genuinely differing in register markers, during independent practice.

HOMEWORK: Finalise your communication style guide draft for Module 1''s assignment.

REVISION: This lesson opens with the Lesson 1.1 message-naming recap. Module 1''s Quiz and Assignment draw on both lessons.

EXTENSION: Add a fourth "regional variation" note to your style guide, flagging one idiom from this module''s BrE/AmE note.'),

('itm_l5_m1_quiz', 'unt_l5_m1', 4, 'quiz', 'Module 1 Quiz -- Nuance & Idiom', NULL),

('itm_l5_m1_assignment', 'unt_l5_m1', 5, 'assignment', 'Module 1 Assignment -- A Communication Style Guide',
'INSTRUCTIONS: Write a short professional document, 300-400 words, in the genre of professional documentation -- a communication style guide for a real or invented team or organisation. Include: a one-paragraph introduction explaining the guide''s purpose and audience; the same example message written in three distinct registers (informal, neutral/professional, formal), each labelled; at least 5 idiomatic expressions or collocations from this module, used correctly and appropriately for their labelled register; at least one mixed-conditional sentence; and a short closing section of practical guidance for choosing register appropriately.

GRADING RUBRIC: (1) Grammatical accuracy -- correct mixed-conditional formation. (2) Vocabulary range -- at least 5 distinct idiomatic expressions/collocations used correctly, plus correct register-sorting of each. (3) Task completion -- introduction, three registered versions of one message, a mixed conditional, and practical guidance all present. (4) Rhetorical effectiveness -- would this guide actually help a real reader choose the right register for a real situation, or is the guidance too vague or generic to be useful? (5) Discourse coherence & register -- is each of the three example versions genuinely, consistently written in its labelled register, and is the guide itself written in an appropriately professional, documentation-style register throughout?

A grade at or above the platform''s pass threshold marks this module complete.');

INSERT INTO quiz_questions (id, learning_item_id, sequence, prompt, choices_json, correct_index) VALUES
('qq_l5_m1_1', 'itm_l5_m1_quiz', 1, '"If I ___ medicine, I''d be a doctor now." (past condition, present result)', '["studied","had studied","have studied","study"]', 1),
('qq_l5_m1_2', 'itm_l5_m1_quiz', 2, '"If I weren''t so cautious by nature, I ___ that risk back then." (present condition, past result)', '["would take","would have taken","took","had taken"]', 1),
('qq_l5_m1_3', 'itm_l5_m1_quiz', 3, 'Which sentence is a "pure" third conditional, not mixed?', '["If I had studied medicine, I''d be a doctor now.","If I had known, I would have said something.","If I weren''t so cautious, I would have taken that risk.","If I hadn''t taken that internship, I wouldn''t be here now."]', 1),
('qq_l5_m1_4', 'itm_l5_m1_quiz', 4, '"___, we''re a bit behind on this." (informal register)', '["I am writing to inform you that","Just to flag","Hey, heads up","I would welcome the opportunity to"]', 2),
('qq_l5_m1_5', 'itm_l5_m1_quiz', 5, '"I would welcome the opportunity to discuss this ___." (formal register)', '["at your earliest convenience","whenever, no rush","soon-ish","ASAP"]', 0),
('qq_l5_m1_6', 'itm_l5_m1_quiz', 6, 'In British English, having nothing to do is described as being:', '["at loose ends","at a loose end","at a loose end''s","at loose end"]', 1),
('qq_l5_m1_7', 'itm_l5_m1_quiz', 7, 'Which phrase means "understand an implied meaning, not just the literal words"?', '["get to the point","read between the lines","strike the right tone","walk a fine line"]', 1),
('qq_l5_m1_8', 'itm_l5_m1_quiz', 8, 'Which phrase means "communicate with appropriate register/attitude for the situation"?', '["get to the point","read between the lines","strike the right tone","walk a fine line"]', 2),
('qq_l5_m1_9', 'itm_l5_m1_quiz', 9, 'What is the core skill this module''s writing genre (professional documentation) requires?', '["using as many idioms as possible","precise, consistent register control for a given audience","avoiding all idiomatic language","writing as formally as possible at all times"]', 1),
('qq_l5_m1_10', 'itm_l5_m1_quiz', 10, '"___, that period taught me more than any success has." (an idiomatic concluding frame)', '["To put it bluntly","At the end of the day","For what it''s worth","In a nutshell"]', 1);

-- ---------------------------------------------------------------------
-- Module 2: Academic Writing III
-- Full prose version: docs/curriculum/level-5/module-02-academic-writing-iii.md
-- ---------------------------------------------------------------------
INSERT INTO units (id, course_id, sequence, title) VALUES
  ('unt_l5_m2', 'crs_level_5', 2, 'Module 2: Academic Writing III');

INSERT INTO learning_items (id, unit_id, sequence, kind, title, body) VALUES
('itm_l5_m2_overview', 'unt_l5_m2', 1, 'reading', 'Module Overview & Key Phrases',
'KEY PHRASES: A growing body of research suggests... -- Several studies have examined... -- However, a gap remains in... -- Taken as a whole, the literature indicates... -- (Author, Year) -- This pattern is echoed by...

DISCOURSE MARKERS (functional set -- essay-level cohesion): "the aforementioned", "as noted above", "in the studies discussed thus far", "collectively" -- devices that let a writer refer back to material established several paragraphs earlier.

PHRASAL VERBS & COLLOCATIONS: "zero in on [a specific issue]" (focus precisely on it), "fill a gap (in the research)" (address something previous work hasn''t covered), "survey (the field)" (review the broad landscape), "converge on [a conclusion]" (arrive at a similar point), "diverge from [a view]" (differ from an established position).

BrE / AmE NOTE: American English uses "-ize" exclusively (analyze, synthesize, organize); British publishing convention commonly uses "-ise" (analyse, synthesise, organise), but Oxford University Press''s own house style actually prefers "-ize" too, following the words'' Greek etymology.

KEY VOCABULARY: literature-review vocabulary (corpus, consensus, divergence, methodology, theoretical framework, research gap). Intercultural note: what counts as a sufficiently thorough literature review varies by academic discipline and country.'),

('itm_l5_m2_lesson1', 'unt_l5_m2', 2, 'reading', 'Lesson 2.1 -- Across the Literature... -- Synthesising a Body of Sources',
'LEARNING OBJECTIVES: (1) read and accurately summarise multiple sources'' main claims, (2) identify where sources converge, diverge, or address different aspects of a topic, (3) organise findings thematically rather than source-by-source, (4) identify a genuine gap the existing sources leave unaddressed.

PREREQUISITE KNOWLEDGE: Level IV, Module 9 (two-source synthesis).

WARM-UP (5 min): Your instructor presents three short, generic invented "finding" statements on a related topic -- group them by theme rather than by which statement came from which source.

PRESENTATION (10 min): Reading 3 short supplied source excerpts (70-90 words each) and organising the synthesis thematically: "A growing body of research suggests that remote work improves focus (Smith, 2021; Lee, 2022). However, both studies note this depends on having a dedicated workspace -- a factor Chen (2023) examines directly. Taken as a whole, the literature indicates that the benefit is real but conditional; however, a gap remains in understanding how this varies by role type." This is organised by theme, not "Source A says X, Source B says Y."

GUIDED PRACTICE (10 min): You are given 3 more short source excerpts and identify: the shared theme, one point of convergence, one point of divergence or added nuance, and one possible gap.

INDEPENDENT PRACTICE / SPEAKING ACTIVITY (10 min): Read a new set of 3 source excerpts and write a short thematically organised synthesis paragraph (5-6 sentences), using author-date citation for each claim, then swap with a partner, who checks whether the synthesis is genuinely thematic and whether a gap is identified. Discuss the gap you each identified.

CRITICAL THINKING / DISCUSSION PROMPT: "Why do you think identifying a genuine gap in existing research is harder than it sounds? What''s the difference between a real gap and something that''s simply outside a study''s stated scope?"

LISTENING ACTIVITY (5 min): Listen to someone verbally synthesising three sources thematically and identify the theme, a convergence point, and the stated gap.

READING ACTIVITY -- EXTENDED READING & CRITICAL EVALUATION (8 min): Read three short source excerpts (100 words each) on a generic academic/professional topic. Answer 2 literal questions and 2 evaluative questions.

WRITING TASK (5 min): Write a synthesis paragraph (4-5 sentences) using the reading-activity sources, correctly citing each with author-date style.

PRONUNCIATION PRACTICE (5 min): Clear, natural delivery of author-date citations when speaking ("Smith, twenty twenty-one").

VOCABULARY REINFORCEMENT: a literature-review vocabulary matching game (corpus, consensus, divergence, methodology, theoretical framework, research gap).

FORMATIVE ASSESSMENT: Instructor checks for genuine thematic organisation and a meaningful, well-reasoned gap identification during independent practice.

HOMEWORK: Choose a topic for your literature review assignment and identify (or invent, generically) 3-4 source "findings" you''ll synthesise, ready for Lesson 2.2''s drafting work.

REVISION: Lesson 2.2 opens with learners briefly naming their chosen topic and sources.

EXTENSION: Identify a second, more subtle gap in your chosen sources.'),

('itm_l5_m2_lesson2', 'unt_l5_m2', 3, 'reading', 'Lesson 2.2 -- Weaving It Together -- Advanced Cohesion at Essay Level & Drafting a Literature Review',
'LEARNING OBJECTIVES: (1) use advanced cohesion devices that refer back across paragraphs, not just within a sentence, (2) structure a full literature review with a clear thematic organisation and a stated gap, (3) maintain consistent author-date citation throughout an extended piece, (4) draft a complete literature review.

PREREQUISITE KNOWLEDGE: Lesson 2.1 (synthesis, thematic organisation), Level IV Module 7 (ellipsis/substitution at sentence level).

WARM-UP (5 min): Your instructor shows a short multi-paragraph excerpt where each paragraph feels disconnected from the last, and a revised version using "as noted above/the aforementioned" -- what specifically changed?

PRESENTATION (10 min): "As noted above, workspace quality appears to moderate the productivity effect. This pattern is echoed by more recent findings in adjacent fields... Collectively, these studies point toward a conditional, not universal, benefit." Sentence-level cohesion connects clauses within or between adjacent sentences; essay-level cohesion connects a current point back to something established several paragraphs earlier. Literature review structure: INTRODUCTION (topic, significance, preview of organisation); THEMATICALLY ORGANISED BODY; GAP STATEMENT; BRIEF CONCLUSION.

GUIDED PRACTICE (10 min): Revise a provided multi-paragraph excerpt with weak essay-level cohesion, adding appropriate back-referencing devices to connect later paragraphs to earlier ones.

INDEPENDENT PRACTICE (10 min): Using your Lesson 2.1 synthesis work, draft your literature review''s introduction and first thematic section, deliberately including at least one essay-level cohesion device.

SPEAKING ACTIVITY: Read your draft introduction and first section aloud to a partner, who identifies the essay-level cohesion device used and whether it successfully connects the two parts.

CRITICAL THINKING / DISCUSSION PROMPT: "Why might a literature review structured by theme be more useful to a reader than one structured source-by-source, even though the source-by-source version might be easier to write?"

LISTENING ACTIVITY (5 min): Listen to a short literature-review-style talk and identify at least 2 essay-level cohesion devices used to connect points across the talk.

READING ACTIVITY (5 min): Read a model literature review excerpt (200-220 words) and annotate its thematic structure, citation consistency, and essay-level cohesion devices.

WRITING TASK (5 min): Continue drafting your literature review''s gap statement and brief conclusion.

PRONUNCIATION PRACTICE (5 min): Sustained, well-organised delivery appropriate to presenting a literature review''s findings aloud -- clear signalling of thematic transitions.

VOCABULARY REINFORCEMENT: an essay-level cohesion device identification game: find examples of back-referencing devices in a provided multi-paragraph text.

FORMATIVE ASSESSMENT: Instructor checks for genuine essay-level cohesion and a clear, consistently maintained thematic structure during independent practice.

HOMEWORK: Complete your full literature review draft for Module 2''s assignment.

REVISION: This lesson opens with the Lesson 2.1 topic/source recap. Module 2''s Quiz and Assignment draw on both lessons.

EXTENSION: Add a brief methodological comment on one source as a more sophisticated form of critical evaluation.'),

('itm_l5_m2_quiz', 'unt_l5_m2', 4, 'quiz', 'Module 2 Quiz -- Academic Writing III', NULL),

('itm_l5_m2_assignment', 'unt_l5_m2', 5, 'assignment', 'Module 2 Assignment -- A Literature Review',
'INSTRUCTIONS: Write a literature review, 400-500 words, on a topic of your choice, synthesising 3-4 source "findings" (genuinely researched with appropriate citation, or generic/invented for practice -- either acceptable). This is this level''s second writing genre -- the literature review. Your review must include: an introduction stating the topic''s significance and previewing the review''s organisation; a thematically organised body (not source-by-source) with consistent author-date citation; at least 2 essay-level cohesion devices connecting later points to earlier ones; a clearly stated gap in the existing material; and a brief conclusion.

GRADING RUBRIC: (1) Grammatical accuracy -- correct, varied sentence structures appropriate to formal academic synthesis writing. (2) Vocabulary range -- at least 4 distinct literature-review words used correctly, plus one phrasal verb/collocation from this module. (3) Task completion -- introduction, thematic body, consistent citation, a stated gap, and a conclusion all present. (4) Evidence & argument quality -- is the thematic organisation genuine, and is the identified gap meaningful rather than trivial? (5) Discourse coherence & register -- does the review read as one connected whole, using essay-level cohesion devices, with a consistently formal academic register throughout?

A grade at or above the platform''s pass threshold marks this module complete.');

INSERT INTO quiz_questions (id, learning_item_id, sequence, prompt, choices_json, correct_index) VALUES
('qq_l5_m2_1', 'itm_l5_m2_quiz', 1, 'What is the defining structural feature of a literature review, as opposed to a source-by-source report?', '["it only uses one source","it is organised thematically, not source-by-source","it never cites sources","it is always written in the first person"]', 1),
('qq_l5_m2_2', 'itm_l5_m2_quiz', 2, '"___, the literature indicates that the benefit is real but conditional."', '["Taken as a whole","According to","Because","So"]', 0),
('qq_l5_m2_3', 'itm_l5_m2_quiz', 3, 'Which phrase signals an essay-level cohesion device, referring back across paragraphs?', '["however","as noted above","and","because"]', 1),
('qq_l5_m2_4', 'itm_l5_m2_quiz', 4, '"This pattern is ___ by more recent findings in adjacent fields."', '["echoed","echoing","echo","echoes"]', 0),
('qq_l5_m2_5', 'itm_l5_m2_quiz', 5, 'What does "converge on a conclusion" mean, in the context of multiple sources?', '["they completely disagree","they arrive at a similar point","they use the same methodology","they were published in the same year"]', 1),
('qq_l5_m2_6', 'itm_l5_m2_quiz', 6, 'In American English, the spelling suffix used exclusively is:', '["-ise","-ize","-yse","-isze"]', 1),
('qq_l5_m2_7', 'itm_l5_m2_quiz', 7, 'Which phrase means "address something previous work hasn''t covered"?', '["zero in on","fill a gap in","survey","diverge from"]', 1),
('qq_l5_m2_8', 'itm_l5_m2_quiz', 8, 'A well-structured literature review typically includes an introduction, a thematically organised body, and:', '["only a list of sources, nothing else","a stated gap and a brief conclusion","no conclusion at all","a single source summary"]', 1),
('qq_l5_m2_9', 'itm_l5_m2_quiz', 9, 'Which phrase means "focus precisely on a specific issue after a broader survey"?', '["zero in on","fill a gap in","survey","converge on"]', 0),
('qq_l5_m2_10', 'itm_l5_m2_quiz', 10, '"However, a gap ___ in understanding how this varies by role type."', '["remain","remains","remaining","remained"]', 1);

-- ---------------------------------------------------------------------
-- Module 3: Leadership & Persuasion
-- Full prose version: docs/curriculum/level-5/module-03-leadership-persuasion.md
-- ---------------------------------------------------------------------
INSERT INTO units (id, course_id, sequence, title) VALUES
  ('unt_l5_m3', 'crs_level_5', 3, 'Module 3: Leadership & Persuasion');

INSERT INTO learning_items (id, unit_id, sequence, kind, title, body) VALUES
('itm_l5_m3_overview', 'unt_l5_m3', 1, 'reading', 'Module Overview & Key Phrases',
'KEY PHRASES: Rarely have I seen... -- Not only did..., but... -- Only then did... -- Under no circumstances should... -- This isn''t just about X, it''s about Y. -- What''s really at stake here is...

DISCOURSE MARKERS (functional set -- reframing and raising stakes): "this isn''t just about X, it''s about Y", "what''s really at stake here is", "the real question is" -- persuasive framing language that shifts how an audience perceives an issue''s importance or scope.

PHRASAL VERBS & COLLOCATIONS: "rally behind [a cause]" (unite in support of it), "win over [an audience]" (persuade them to support your view), "drive home [a point]" (emphasise it so it''s remembered), "set the tone" (establish the mood or standard for what follows), "take the lead (on something)".

BrE / AmE NOTE: British companies commonly append "Plc" (Public Limited Company) or "Ltd" (Limited) to a company name, while American companies commonly append "Corp./Inc." (Corporation/Incorporated).

KEY VOCABULARY: leadership vocabulary (vision, mandate, stakeholder buy-in, accountability, conviction), persuasion vocabulary (framing, appeal, resonate, credibility, momentum). Intercultural note: leadership communication style varies significantly by culture and organisational context.'),

('itm_l5_m3_lesson1', 'unt_l5_m3', 2, 'reading', 'Lesson 3.1 -- Rarely Have I Seen... -- Inversion for Rhetorical Emphasis',
'LEARNING OBJECTIVES: (1) form inversion correctly after a negative/limiting adverbial (Rarely have I..., Never before has..., Only then did..., Under no circumstances should...), (2) form "Not only... but also..." inversion correctly, (3) use inversion deliberately for rhetorical emphasis, (4) recognise when inversion strengthens a sentence versus when it sounds forced or overused.

PREREQUISITE KNOWLEDGE: Level IV, Module 2 (formal academic register).

WARM-UP (5 min): Your instructor states one plain sentence and its inverted, more emphatic equivalent ("I have rarely seen such dedication" vs. "Rarely have I seen such dedication") -- which sounds more forceful and why?

PRESENTATION (10 min): "Rarely have I seen a team respond to a challenge with such resolve. Not only did we meet the target, but we exceeded it by a considerable margin. Only then did we realise the full scale of what we''d achieved. Under no circumstances should we lose sight of what got us here." Inversion follows a negative or limiting adverbial placed at the front of the sentence for emphasis -- a marked, formal, rhetorical structure that works best reserved for a small number of genuinely emphatic points.

GUIDED PRACTICE (10 min): Convert 8 plain sentences into their inverted, emphatic equivalents, checking correct auxiliary placement for each of the four patterns modelled.

INDEPENDENT PRACTICE / SPEAKING ACTIVITY (10 min): Write 4-5 inverted sentences about a real or invented achievement or turning point, then read them aloud to a partner, who rates how emphatic/natural each one sounds. Share the single most effective inverted sentence with the class.

CRITICAL THINKING / DISCUSSION PROMPT: "Why do you think a rhetorical device like inversion is more effective when used sparingly rather than throughout an entire speech? What happens to its impact if overused?"

LISTENING ACTIVITY (5 min): Listen to a short speech excerpt (6-7 sentences, including 2-3 inverted sentences) and identify each inversion and the emphasis it creates.

READING ACTIVITY -- EXTENDED READING & CRITICAL EVALUATION (8 min): Read a short speech transcript excerpt (150-180 words) using inversion for emphasis. Answer 2 literal questions and 2 evaluative questions.

WRITING TASK (5 min): Write 3-4 inverted sentences suitable for a short leadership speech on a topic of your choice.

PRONUNCIATION PRACTICE (5 min): Strong sentence stress on the fronted adverbial in an inverted sentence ("RARELY have I seen...") and a brief, deliberate pause immediately after it.

VOCABULARY REINFORCEMENT: an inversion-pattern matching game: match 8 fronted adverbials to correctly inverted sentence completions.

FORMATIVE ASSESSMENT: Instructor checks correct inversion formation across all four patterns and whether learners can judge when it strengthens versus overloads a sentence, during independent practice.

HOMEWORK: Choose a real or invented cause, initiative, or position you''d want to advocate for as a leader, and jot down 2-3 reasons, ready for Lesson 3.2''s speech and negotiation work.

REVISION: Lesson 3.2 opens with learners briefly naming their homework cause in one sentence.

EXTENSION: Add a "Seldom" or "Not until" inverted sentence as an additional pattern.'),

('itm_l5_m3_lesson2', 'unt_l5_m3', 3, 'reading', 'Lesson 3.2 -- Leading the Room -- Framing, Persuasion & Advanced Negotiation',
'LEARNING OBJECTIVES: (1) reframe an issue persuasively, shifting its perceived scope or importance, (2) structure and deliver a short leadership speech (vision, rationale, call to action), (3) negotiate as a decision-maker under genuine competing pressures, (4) write a position paper that persuasively argues and defends a clear stance.

PREREQUISITE KNOWLEDGE: Lesson 3.1 (inversion), Level IV Module 8 (negotiation and diplomatic disagreement).

WARM-UP (5 min): Your instructor states one issue framed narrowly ("This is a scheduling problem") and then reframed more broadly ("This isn''t just about scheduling -- it''s about whether we can deliver on our promises to our clients") -- which framing feels more compelling and why?

PRESENTATION (10 min): "This isn''t just about budget -- it''s about whether we''re serious about growth. What''s really at stake here is our credibility with every stakeholder we''ve made commitments to." A short leadership speech structure: VISION (a compelling statement of what could be true), RATIONALE (why this matters now), CALL TO ACTION (a specific, clear ask). Leadership-level negotiation balances competing stakeholder interests, not just two sides'' preferences: "I recognise this affects the team''s workload, our timeline, and our client commitments -- here''s how I''d propose balancing those."

GUIDED PRACTICE (10 min): Practise reframing 4 narrowly-stated issues into more compelling, higher-stakes framings, then practise the vision-rationale-call-to-action structure on a provided prompt in pairs.

INDEPENDENT PRACTICE (10 min): Using your Lesson 3.1 homework cause, develop a short leadership speech (vision, rationale, call to action) including at least one inverted sentence and one reframing statement, and rehearse it once.

SPEAKING ACTIVITY -- LEADERSHIP SPEECH & NEGOTIATION: Deliver your leadership speech to a small group (or the class), who then role-play as stakeholders with competing concerns; negotiate a path forward, acknowledging multiple stakeholder interests explicitly.

CRITICAL THINKING / DISCUSSION PROMPT: "Is reframing an issue to make it feel more significant always an honest rhetorical technique, or can it become manipulative? Where do you think the line is?"

LISTENING ACTIVITY (5 min): Listen to a short leadership speech excerpt and identify its vision, rationale, and call to action.

READING ACTIVITY (5 min): Read a short written position statement that uses framing language, and identify how the issue is framed and what effect that framing has on the reader.

WRITING TASK (5 min): Write your leadership speech''s vision and call-to-action statements as clean written text (2-3 sentences each).

PRONUNCIATION PRACTICE (5 min): Confident, inspiring delivery for a leadership speech''s vision statement versus more measured, grounded delivery for the rationale section.

VOCABULARY REINFORCEMENT: a leadership/persuasion vocabulary matching game (vision, mandate, stakeholder buy-in, accountability, conviction, framing, resonate, credibility).

FORMATIVE ASSESSMENT: Instructor checks for a genuine three-part speech structure, effective reframing, and acknowledgement of multiple stakeholder interests during the negotiation.

HOMEWORK: Draft your position paper using your leadership speech''s content as a starting point, ready for Module 3''s assignment.

REVISION: This lesson opens with the Lesson 3.1 cause-naming recap. Module 3''s Quiz and Assignment draw on both lessons.

EXTENSION: Add a second reframing statement addressing a different stakeholder''s likely objection.'),

('itm_l5_m3_quiz', 'unt_l5_m3', 4, 'quiz', 'Module 3 Quiz -- Leadership & Persuasion', NULL),

('itm_l5_m3_assignment', 'unt_l5_m3', 5, 'assignment', 'Module 3 Assignment -- A Position Paper & Leadership Speech',
'INSTRUCTIONS: Complete two parts on one real or invented cause, initiative, or position you''d advocate for as a leader. PART A (writing, this level''s third genre): a position paper, 350-450 words, that clearly states your position, argues for it with reasoning and framing language, acknowledges at least one competing stakeholder concern, and closes with a clear call to action. Use at least 2 inverted sentences for emphasis. PART B (speaking): Record yourself (or perform live) a leadership speech, 90 seconds to 2 minutes, based on your position paper, with a clear vision, rationale, and call to action, including at least one reframing statement.

GRADING RUBRIC: (1) Grammatical accuracy -- correct inversion formation, used appropriately and not overused. (2) Vocabulary range -- at least 4 distinct leadership/persuasion words used correctly, plus one phrasal verb/collocation from this module. (3) Task completion -- position, reasoning, framing language, a stakeholder acknowledgement, and a call to action all present in Part A; vision, rationale, call to action, and a reframing statement in Part B. (4) Rhetorical effectiveness -- does the paper and speech genuinely persuade, using framing and emphasis effectively? (5) Discourse coherence & register -- is the register appropriately authoritative and persuasive throughout, and does the speech''s delivery reinforce the written paper''s argument?

A grade at or above the platform''s pass threshold marks this module complete.');

INSERT INTO quiz_questions (id, learning_item_id, sequence, prompt, choices_json, correct_index) VALUES
('qq_l5_m3_1', 'itm_l5_m3_quiz', 1, '"Rarely ___ such dedication." (inversion)', '["I have seen","have I seen","I seen","did I saw"]', 1),
('qq_l5_m3_2', 'itm_l5_m3_quiz', 2, '"Not only ___ the target, but we exceeded it." (inversion)', '["we met","did we meet","we did meet","met we"]', 1),
('qq_l5_m3_3', 'itm_l5_m3_quiz', 3, '"Under no circumstances ___ we lose sight of this."', '["we should","should we","we shall","shall we"]', 1),
('qq_l5_m3_4', 'itm_l5_m3_quiz', 4, 'When is inversion for rhetorical emphasis most effective?', '["used in every single sentence","used sparingly, at genuinely emphatic moments","never used in speeches","only used in casual conversation"]', 1),
('qq_l5_m3_5', 'itm_l5_m3_quiz', 5, '"This isn''t just about budget -- it''s about whether we''re serious about growth." This is an example of:', '["inversion","framing language","a citation","a mixed conditional"]', 1),
('qq_l5_m3_6', 'itm_l5_m3_quiz', 6, 'A leadership speech commonly follows which structure?', '["conclusion, rationale, vision","vision, rationale, call to action","call to action only","no particular structure"]', 1),
('qq_l5_m3_7', 'itm_l5_m3_quiz', 7, 'In British business writing, a company name is often followed by:', '["Corp.","Inc.","Plc","LLC"]', 2),
('qq_l5_m3_8', 'itm_l5_m3_quiz', 8, 'Which phrase means "emphasise a point so it''s fully understood and remembered"?', '["rally behind","win over","drive home","set the tone"]', 2),
('qq_l5_m3_9', 'itm_l5_m3_quiz', 9, 'When negotiating as a leader with multiple stakeholders, an effective approach is to:', '["ignore competing interests","acknowledge multiple stakeholders'' concerns before proposing a path forward","only address the loudest stakeholder","avoid proposing any solution"]', 1),
('qq_l5_m3_10', 'itm_l5_m3_quiz', 10, 'Which phrase means "unite in support of a cause"?', '["win over","rally behind","drive home","take the lead"]', 1);
