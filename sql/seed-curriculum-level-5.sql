-- WEC — Real curriculum content seed: Level V ("Advanced
-- Programme," C1). Authored per your Level V directive — establishing
-- WEC as a premium international English institution, moving
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
'KEY PHRASES: If I had..., I''d be... — If I were..., I would have... — To put it bluntly,... — In a nutshell,... — At the end of the day,... — For what it''s worth,...

DISCOURSE MARKERS (functional set — idiomatic hedging and framing, register-graded): "to put it bluntly" (direct, informal-to-neutral), "in a nutshell" (neutral, summarising), "at the end of the day" (neutral-to-informal, concluding), "for what it''s worth" (a modest hedge before an opinion).

PHRASAL VERBS & COLLOCATIONS (meta-communicative — about precise communication itself): "get to the point" (stop delaying and state the main idea), "read between the lines" (understand an implied meaning), "strike the right tone" (communicate with appropriate register/attitude), "walk a fine line" (balance two competing concerns carefully), "choose your words carefully".

BrE / AmE NOTE: British English says "at a loose end" (singular, meaning having nothing to do), while American English says "at loose ends" (plural) for the identical meaning — idiomatic English can differ grammatically, not just in vocabulary, even within the same fixed expression.

KEY VOCABULARY: register vocabulary (formal, informal, neutral, colloquial, register-appropriate), documentation vocabulary (style guide, tone of voice, audience, convention). Intercultural note: what counts as "appropriately direct" versus "too blunt" varies significantly, and this module favours widely-understood idiomatic language.'),

('itm_l5_m1_lesson1', 'unt_l5_m1', 2, 'reading', 'Lesson 1.1 — If I Had Studied That, I''d Be... — Mixed Conditionals',
'LEARNING OBJECTIVES: (1) form a mixed conditional with a past condition and a present result (If I had + past participle, I would + base verb), (2) form a mixed conditional with a present/general condition and a past result (If I were/weren''t + adjective/noun, I would have + past participle), (3) choose correctly between a "pure" second/third conditional and a mixed conditional based on the actual time references involved, (4) use mixed conditionals naturally in reflective and professional speech.

PREREQUISITE KNOWLEDGE: Level III, Module 8 (second conditional); Level IV, Module 3 (third conditional).

WARM-UP (5 min): Your instructor states one real reflection with mismatched time references ("If I hadn''t taken that internship, I probably wouldn''t be working in this field now") — which part is about the past and which is about the present?

PRESENTATION (10 min): "If I had studied medicine, I''d be a doctor now" (past condition, present result). "If I weren''t so cautious by nature, I would have taken that risk back then" (present/general condition, past result). Mixed conditionals exist because real reflection rarely respects tidy single-timeframe boundaries — a past decision has present consequences; a present trait would have changed a past outcome.

GUIDED PRACTICE (10 min): You are given 8 real-sounding reflective sentence pairs and combine each into a correctly mixed conditional, identifying which clause is past and which is present.

INDEPENDENT PRACTICE / SPEAKING ACTIVITY (10 min): Write 5 mixed-conditional sentences reflecting on real or invented past decisions and their present consequences, then share one with a partner, who identifies the time reference of each clause.

CRITICAL THINKING / DISCUSSION PROMPT: "Do you think people reflect on their lives more often using ''pure'' hypotheticals (all one timeframe) or mixed ones (past decisions, present consequences)? Why might mixed reflection feel more natural?"

LISTENING ACTIVITY (5 min): Listen to someone reflecting using mixed conditionals and identify the time reference of each clause in each sentence.

READING ACTIVITY — EXTENDED READING & CRITICAL EVALUATION (8 min): Read a short professional reflection excerpt (150-180 words) using mixed conditionals. Answer 2 literal questions and 2 evaluative questions.

WRITING TASK (5 min): Write 4-5 mixed-conditional sentences reflecting on your own real decisions and their consequences, checking carefully that each clause''s time reference is correct.

PRONUNCIATION PRACTICE (5 min): The heavily contracted, natural-speed pronunciation of mixed conditionals ("If I''d studied medicine, I''d be a doctor now") — both ''d contractions doing different grammatical work.

VOCABULARY REINFORCEMENT: a conditional-type sorting game: sort 10 example sentences into second, third, or mixed conditional.

FORMATIVE ASSESSMENT: Instructor checks correct mixed-conditional formation and correct identification of each clause''s time reference during independent practice.

HOMEWORK: Think of one real professional or personal message you''d need to communicate differently to three different audiences and jot down brief notes, ready for Lesson 1.2''s register-shifting work.

REVISION: Lesson 1.2 opens with learners briefly naming their homework message in one sentence.

EXTENSION: Add a third mixed-conditional sentence combining a hypothetical future consequence with a past cause.'),

('itm_l5_m1_lesson2', 'unt_l5_m1', 3, 'reading', 'Lesson 1.2 — Reading the Room — Idiom, Collocation & Register-Shifting',
'LEARNING OBJECTIVES: (1) use a range of C1-level idiomatic expressions and collocations naturally and correctly, (2) identify the register (formal/neutral/informal) of a given expression, (3) deliberately rewrite the same message across three registers for three different audiences, (4) write a short professional document demonstrating consistent, precise register control.

PREREQUISITE KNOWLEDGE: Lesson 1.1 (mixed conditionals); Level IV Module 9 (register-editing precursor).

WARM-UP (5 min): Your instructor delivers the same short message three times — to a close friend, to a manager, and in a formal written announcement — what specifically changed?

PRESENTATION (10 min): Three versions of one message: INFORMAL ("Hey, heads up — we''re a bit behind on this, so let''s touch base tomorrow and sort it out"); NEUTRAL/PROFESSIONAL ("Just to flag — we''re slightly behind schedule on this. Could we catch up tomorrow to discuss next steps?"); FORMAL ("I am writing to inform you that the project is currently behind schedule. I would welcome the opportunity to discuss this further at your earliest convenience."). The content is identical; what changes is idiom choice, contraction use, sentence length, and directness.

GUIDED PRACTICE (10 min): You are given 8 idiomatic expressions/collocations and sort them by register (formal/neutral/informal), then rewrite 3 informal sentences into neutral/professional register.

INDEPENDENT PRACTICE (10 min): Using your Lesson 1.1 homework notes, rewrite your chosen message in all three registers, then read your three versions to a partner, who identifies which register each version represents without being told.

SPEAKING ACTIVITY: The partner identification exchange above, followed by a brief whole-class discussion of any version where the register was ambiguous or unclear, and why.

CRITICAL THINKING / DISCUSSION PROMPT: "Is it possible to be ''too formal'' or ''too informal'' in a way that actually damages communication, even if the grammar is perfectly correct? Can you think of an example?"

LISTENING ACTIVITY (5 min): Listen to the same short message delivered in two different registers and identify specific words/phrases that signal each register.

READING ACTIVITY (5 min): Read a short style-guide excerpt (a generic, invented professional communication guide) and identify its register recommendations and example idiomatic phrases.

WRITING TASK (5 min): Draft the opening section of your Module 1 assignment: a one-paragraph introduction to your communication style guide.

PRONUNCIATION PRACTICE (5 min): The prosodic differences between registers — informal speech''s faster pace and wider pitch range, versus formal speech''s more measured pace and level intonation.

VOCABULARY REINFORCEMENT: a register-sorting relay: sort 12 idiomatic expressions/collocations into formal/neutral/informal columns.

FORMATIVE ASSESSMENT: Instructor checks that all three register versions preserve the same core content while genuinely differing in register markers, during independent practice.

HOMEWORK: Finalise your communication style guide draft for Module 1''s assignment.

REVISION: This lesson opens with the Lesson 1.1 message-naming recap. Module 1''s Quiz and Assignment draw on both lessons.

EXTENSION: Add a fourth "regional variation" note to your style guide, flagging one idiom from this module''s BrE/AmE note.'),

('itm_l5_m1_quiz', 'unt_l5_m1', 4, 'quiz', 'Module 1 Quiz — Nuance & Idiom', NULL),

('itm_l5_m1_assignment', 'unt_l5_m1', 5, 'assignment', 'Module 1 Assignment — A Communication Style Guide',
'INSTRUCTIONS: Write a short professional document, 300-400 words, in the genre of professional documentation — a communication style guide for a real or invented team or organisation. Include: a one-paragraph introduction explaining the guide''s purpose and audience; the same example message written in three distinct registers (informal, neutral/professional, formal), each labelled; at least 5 idiomatic expressions or collocations from this module, used correctly and appropriately for their labelled register; at least one mixed-conditional sentence; and a short closing section of practical guidance for choosing register appropriately.

GRADING RUBRIC: (1) Grammatical accuracy — correct mixed-conditional formation. (2) Vocabulary range — at least 5 distinct idiomatic expressions/collocations used correctly, plus correct register-sorting of each. (3) Task completion — introduction, three registered versions of one message, a mixed conditional, and practical guidance all present. (4) Rhetorical effectiveness — would this guide actually help a real reader choose the right register for a real situation, or is the guidance too vague or generic to be useful? (5) Discourse coherence & register — is each of the three example versions genuinely, consistently written in its labelled register, and is the guide itself written in an appropriately professional, documentation-style register throughout?

A grade at or above the platform''s pass threshold marks this module complete.');

INSERT INTO quiz_questions (id, learning_item_id, sequence, prompt, choices_json, correct_index) VALUES
('qq_l5_m1_1', 'itm_l5_m1_quiz', 1, '"If I ___ medicine, I''d be a doctor now." (past condition, present result)', '["studied","have studied","had studied","study"]', 2),
('qq_l5_m1_2', 'itm_l5_m1_quiz', 2, '"If I weren''t so cautious by nature, I ___ that risk back then." (present condition, past result)', '["would have taken","would take","took","had taken"]', 0),
('qq_l5_m1_3', 'itm_l5_m1_quiz', 3, 'Which sentence is a "pure" third conditional, not mixed?', '["If I had studied medicine, I''d be a doctor now.","If I weren''t so cautious, I would have taken that risk.","If I hadn''t taken that internship, I wouldn''t be here now.","If I had known, I would have said something."]', 3),
('qq_l5_m1_4', 'itm_l5_m1_quiz', 4, '"___, we''re a bit behind on this." (informal register)', '["I am writing to inform you that","Hey, heads up","Just to flag","I would welcome the opportunity to"]', 1),
('qq_l5_m1_5', 'itm_l5_m1_quiz', 5, '"I would welcome the opportunity to discuss this ___." (formal register)', '["at your earliest convenience","whenever, no rush","soon-ish","ASAP"]', 0),
('qq_l5_m1_6', 'itm_l5_m1_quiz', 6, 'In British English, having nothing to do is described as being:', '["at loose ends","at a loose end''s","at a loose end","at loose end"]', 2),
('qq_l5_m1_7', 'itm_l5_m1_quiz', 7, 'Which phrase means "understand an implied meaning, not just the literal words"?', '["get to the point","read between the lines","strike the right tone","walk a fine line"]', 1),
('qq_l5_m1_8', 'itm_l5_m1_quiz', 8, 'Which phrase means "communicate with appropriate register/attitude for the situation"?', '["get to the point","read between the lines","walk a fine line","strike the right tone"]', 3),
('qq_l5_m1_9', 'itm_l5_m1_quiz', 9, 'What is the core skill this module''s writing genre (professional documentation) requires?', '["using as many idioms as possible","avoiding all idiomatic language","writing as formally as possible at all times","precise, consistent register control for a given audience"]', 3),
('qq_l5_m1_10', 'itm_l5_m1_quiz', 10, '"___, that period taught me more than any success has." (an idiomatic concluding frame)', '["To put it bluntly","At the end of the day","For what it''s worth","In a nutshell"]', 1);

-- ---------------------------------------------------------------------
-- Module 2: Academic Writing III
-- Full prose version: docs/curriculum/level-5/module-02-academic-writing-iii.md
-- ---------------------------------------------------------------------
INSERT INTO units (id, course_id, sequence, title) VALUES
  ('unt_l5_m2', 'crs_level_5', 2, 'Module 2: Academic Writing III');

INSERT INTO learning_items (id, unit_id, sequence, kind, title, body) VALUES
('itm_l5_m2_overview', 'unt_l5_m2', 1, 'reading', 'Module Overview & Key Phrases',
'KEY PHRASES: A growing body of research suggests... — Several studies have examined... — However, a gap remains in... — Taken as a whole, the literature indicates... — (Author, Year) — This pattern is echoed by...

DISCOURSE MARKERS (functional set — essay-level cohesion): "the aforementioned", "as noted above", "in the studies discussed thus far", "collectively" — devices that let a writer refer back to material established several paragraphs earlier.

PHRASAL VERBS & COLLOCATIONS: "zero in on [a specific issue]" (focus precisely on it), "fill a gap (in the research)" (address something previous work hasn''t covered), "survey (the field)" (review the broad landscape), "converge on [a conclusion]" (arrive at a similar point), "diverge from [a view]" (differ from an established position).

BrE / AmE NOTE: American English uses "-ize" exclusively (analyze, synthesize, organize); British publishing convention commonly uses "-ise" (analyse, synthesise, organise), but Oxford University Press''s own house style actually prefers "-ize" too, following the words'' Greek etymology.

KEY VOCABULARY: literature-review vocabulary (corpus, consensus, divergence, methodology, theoretical framework, research gap). Intercultural note: what counts as a sufficiently thorough literature review varies by academic discipline and country.'),

('itm_l5_m2_lesson1', 'unt_l5_m2', 2, 'reading', 'Lesson 2.1 — Across the Literature... — Synthesising a Body of Sources',
'LEARNING OBJECTIVES: (1) read and accurately summarise multiple sources'' main claims, (2) identify where sources converge, diverge, or address different aspects of a topic, (3) organise findings thematically rather than source-by-source, (4) identify a genuine gap the existing sources leave unaddressed.

PREREQUISITE KNOWLEDGE: Level IV, Module 9 (two-source synthesis).

WARM-UP (5 min): Your instructor presents three short, generic invented "finding" statements on a related topic — group them by theme rather than by which statement came from which source.

PRESENTATION (10 min): Reading 3 short supplied source excerpts (70-90 words each) and organising the synthesis thematically: "A growing body of research suggests that remote work improves focus (Smith, 2021; Lee, 2022). However, both studies note this depends on having a dedicated workspace — a factor Chen (2023) examines directly. Taken as a whole, the literature indicates that the benefit is real but conditional; however, a gap remains in understanding how this varies by role type." This is organised by theme, not "Source A says X, Source B says Y."

GUIDED PRACTICE (10 min): You are given 3 more short source excerpts and identify: the shared theme, one point of convergence, one point of divergence or added nuance, and one possible gap.

INDEPENDENT PRACTICE / SPEAKING ACTIVITY (10 min): Read a new set of 3 source excerpts and write a short thematically organised synthesis paragraph (5-6 sentences), using author-date citation for each claim, then swap with a partner, who checks whether the synthesis is genuinely thematic and whether a gap is identified. Discuss the gap you each identified.

CRITICAL THINKING / DISCUSSION PROMPT: "Why do you think identifying a genuine gap in existing research is harder than it sounds? What''s the difference between a real gap and something that''s simply outside a study''s stated scope?"

LISTENING ACTIVITY (5 min): Listen to someone verbally synthesising three sources thematically and identify the theme, a convergence point, and the stated gap.

READING ACTIVITY — EXTENDED READING & CRITICAL EVALUATION (8 min): Read three short source excerpts (100 words each) on a generic academic/professional topic. Answer 2 literal questions and 2 evaluative questions.

WRITING TASK (5 min): Write a synthesis paragraph (4-5 sentences) using the reading-activity sources, correctly citing each with author-date style.

PRONUNCIATION PRACTICE (5 min): Clear, natural delivery of author-date citations when speaking ("Smith, twenty twenty-one").

VOCABULARY REINFORCEMENT: a literature-review vocabulary matching game (corpus, consensus, divergence, methodology, theoretical framework, research gap).

FORMATIVE ASSESSMENT: Instructor checks for genuine thematic organisation and a meaningful, well-reasoned gap identification during independent practice.

HOMEWORK: Choose a topic for your literature review assignment and identify (or invent, generically) 3-4 source "findings" you''ll synthesise, ready for Lesson 2.2''s drafting work.

REVISION: Lesson 2.2 opens with learners briefly naming their chosen topic and sources.

EXTENSION: Identify a second, more subtle gap in your chosen sources.'),

('itm_l5_m2_lesson2', 'unt_l5_m2', 3, 'reading', 'Lesson 2.2 — Weaving It Together — Advanced Cohesion at Essay Level & Drafting a Literature Review',
'LEARNING OBJECTIVES: (1) use advanced cohesion devices that refer back across paragraphs, not just within a sentence, (2) structure a full literature review with a clear thematic organisation and a stated gap, (3) maintain consistent author-date citation throughout an extended piece, (4) draft a complete literature review.

PREREQUISITE KNOWLEDGE: Lesson 2.1 (synthesis, thematic organisation), Level IV Module 7 (ellipsis/substitution at sentence level).

WARM-UP (5 min): Your instructor shows a short multi-paragraph excerpt where each paragraph feels disconnected from the last, and a revised version using "as noted above/the aforementioned" — what specifically changed?

PRESENTATION (10 min): "As noted above, workspace quality appears to moderate the productivity effect. This pattern is echoed by more recent findings in adjacent fields... Collectively, these studies point toward a conditional, not universal, benefit." Sentence-level cohesion connects clauses within or between adjacent sentences; essay-level cohesion connects a current point back to something established several paragraphs earlier. Literature review structure: INTRODUCTION (topic, significance, preview of organisation); THEMATICALLY ORGANISED BODY; GAP STATEMENT; BRIEF CONCLUSION.

GUIDED PRACTICE (10 min): Revise a provided multi-paragraph excerpt with weak essay-level cohesion, adding appropriate back-referencing devices to connect later paragraphs to earlier ones.

INDEPENDENT PRACTICE (10 min): Using your Lesson 2.1 synthesis work, draft your literature review''s introduction and first thematic section, deliberately including at least one essay-level cohesion device.

SPEAKING ACTIVITY: Read your draft introduction and first section aloud to a partner, who identifies the essay-level cohesion device used and whether it successfully connects the two parts.

CRITICAL THINKING / DISCUSSION PROMPT: "Why might a literature review structured by theme be more useful to a reader than one structured source-by-source, even though the source-by-source version might be easier to write?"

LISTENING ACTIVITY (5 min): Listen to a short literature-review-style talk and identify at least 2 essay-level cohesion devices used to connect points across the talk.

READING ACTIVITY (5 min): Read a model literature review excerpt (200-220 words) and annotate its thematic structure, citation consistency, and essay-level cohesion devices.

WRITING TASK (5 min): Continue drafting your literature review''s gap statement and brief conclusion.

PRONUNCIATION PRACTICE (5 min): Sustained, well-organised delivery appropriate to presenting a literature review''s findings aloud — clear signalling of thematic transitions.

VOCABULARY REINFORCEMENT: an essay-level cohesion device identification game: find examples of back-referencing devices in a provided multi-paragraph text.

FORMATIVE ASSESSMENT: Instructor checks for genuine essay-level cohesion and a clear, consistently maintained thematic structure during independent practice.

HOMEWORK: Complete your full literature review draft for Module 2''s assignment.

REVISION: This lesson opens with the Lesson 2.1 topic/source recap. Module 2''s Quiz and Assignment draw on both lessons.

EXTENSION: Add a brief methodological comment on one source as a more sophisticated form of critical evaluation.'),

('itm_l5_m2_quiz', 'unt_l5_m2', 4, 'quiz', 'Module 2 Quiz — Academic Writing III', NULL),

('itm_l5_m2_assignment', 'unt_l5_m2', 5, 'assignment', 'Module 2 Assignment — A Literature Review',
'INSTRUCTIONS: Write a literature review, 400-500 words, on a topic of your choice, synthesising 3-4 source "findings" (genuinely researched with appropriate citation, or generic/invented for practice — either acceptable). This is this level''s second writing genre — the literature review. Your review must include: an introduction stating the topic''s significance and previewing the review''s organisation; a thematically organised body (not source-by-source) with consistent author-date citation; at least 2 essay-level cohesion devices connecting later points to earlier ones; a clearly stated gap in the existing material; and a brief conclusion.

GRADING RUBRIC: (1) Grammatical accuracy — correct, varied sentence structures appropriate to formal academic synthesis writing. (2) Vocabulary range — at least 4 distinct literature-review words used correctly, plus one phrasal verb/collocation from this module. (3) Task completion — introduction, thematic body, consistent citation, a stated gap, and a conclusion all present. (4) Rhetorical effectiveness — does the review read as one argued synthesis that earns the gap it states, rather than a competent sequence of summaries? (5) Evidence & argument quality — is the thematic organisation genuine, and is the identified gap meaningful rather than trivial? (6) Discourse coherence & register — does the review read as one connected whole, using essay-level cohesion devices, with a consistently formal academic register throughout?

A grade at or above the platform''s pass threshold marks this module complete.');

INSERT INTO quiz_questions (id, learning_item_id, sequence, prompt, choices_json, correct_index) VALUES
('qq_l5_m2_1', 'itm_l5_m2_quiz', 1, 'What is the defining structural feature of a literature review, as opposed to a source-by-source report?', '["it only uses one source","it never cites sources","it is always written in the first person","it is organised thematically, not source-by-source"]', 3),
('qq_l5_m2_2', 'itm_l5_m2_quiz', 2, '"___, the literature indicates that the benefit is real but conditional."', '["According to","Taken as a whole","Because","So"]', 1),
('qq_l5_m2_3', 'itm_l5_m2_quiz', 3, 'Which phrase signals an essay-level cohesion device, referring back across paragraphs?', '["as noted above","however","and","because"]', 0),
('qq_l5_m2_4', 'itm_l5_m2_quiz', 4, '"This pattern is ___ by more recent findings in adjacent fields."', '["echoing","echo","echoed","echoes"]', 2),
('qq_l5_m2_5', 'itm_l5_m2_quiz', 5, 'What does "converge on a conclusion" mean, in the context of multiple sources?', '["they completely disagree","they arrive at a similar point","they use the same methodology","they were published in the same year"]', 1),
('qq_l5_m2_6', 'itm_l5_m2_quiz', 6, 'In American English, the spelling suffix used exclusively is:', '["-ise","-yse","-isze","-ize"]', 3),
('qq_l5_m2_7', 'itm_l5_m2_quiz', 7, 'Which phrase means "address something previous work hasn''t covered"?', '["zero in on","survey","fill a gap in","diverge from"]', 2),
('qq_l5_m2_8', 'itm_l5_m2_quiz', 8, 'A well-structured literature review typically includes an introduction, a thematically organised body, and:', '["a stated gap and a brief conclusion","only a list of sources, nothing else","no conclusion at all","a single source summary"]', 0),
('qq_l5_m2_9', 'itm_l5_m2_quiz', 9, 'Which phrase means "focus precisely on a specific issue after a broader survey"?', '["zero in on","fill a gap in","survey","converge on"]', 0),
('qq_l5_m2_10', 'itm_l5_m2_quiz', 10, '"However, a gap ___ in understanding how this varies by role type."', '["remain","remaining","remains","remained"]', 2);

-- ---------------------------------------------------------------------
-- Module 3: Leadership & Persuasion
-- Full prose version: docs/curriculum/level-5/module-03-leadership-persuasion.md
-- ---------------------------------------------------------------------
INSERT INTO units (id, course_id, sequence, title) VALUES
  ('unt_l5_m3', 'crs_level_5', 3, 'Module 3: Leadership & Persuasion');

INSERT INTO learning_items (id, unit_id, sequence, kind, title, body) VALUES
('itm_l5_m3_overview', 'unt_l5_m3', 1, 'reading', 'Module Overview & Key Phrases',
'KEY PHRASES: Rarely have I seen... — Not only did..., but... — Only then did... — Under no circumstances should... — This isn''t just about X, it''s about Y. — What''s really at stake here is...

DISCOURSE MARKERS (functional set — reframing and raising stakes): "this isn''t just about X, it''s about Y", "what''s really at stake here is", "the real question is" — persuasive framing language that shifts how an audience perceives an issue''s importance or scope.

PHRASAL VERBS & COLLOCATIONS: "rally behind [a cause]" (unite in support of it), "win over [an audience]" (persuade them to support your view), "drive home [a point]" (emphasise it so it''s remembered), "set the tone" (establish the mood or standard for what follows), "take the lead (on something)".

BrE / AmE NOTE: British companies commonly append "Plc" (Public Limited Company) or "Ltd" (Limited) to a company name, while American companies commonly append "Corp./Inc." (Corporation/Incorporated).

KEY VOCABULARY: leadership vocabulary (vision, mandate, stakeholder buy-in, accountability, conviction), persuasion vocabulary (framing, appeal, resonate, credibility, momentum). Intercultural note: leadership communication style varies significantly by culture and organisational context.'),

('itm_l5_m3_lesson1', 'unt_l5_m3', 2, 'reading', 'Lesson 3.1 — Rarely Have I Seen... — Inversion for Rhetorical Emphasis',
'LEARNING OBJECTIVES: (1) form inversion correctly after a negative/limiting adverbial (Rarely have I..., Never before has..., Only then did..., Under no circumstances should...), (2) form "Not only... but also..." inversion correctly, (3) use inversion deliberately for rhetorical emphasis, (4) recognise when inversion strengthens a sentence versus when it sounds forced or overused.

PREREQUISITE KNOWLEDGE: Level IV, Module 2 (formal academic register).

WARM-UP (5 min): Your instructor states one plain sentence and its inverted, more emphatic equivalent ("I have rarely seen such dedication" vs. "Rarely have I seen such dedication") — which sounds more forceful and why?

PRESENTATION (10 min): "Rarely have I seen a team respond to a challenge with such resolve. Not only did we meet the target, but we exceeded it by a considerable margin. Only then did we realise the full scale of what we''d achieved. Under no circumstances should we lose sight of what got us here." Inversion follows a negative or limiting adverbial placed at the front of the sentence for emphasis — a marked, formal, rhetorical structure that works best reserved for a small number of genuinely emphatic points.

GUIDED PRACTICE (10 min): Convert 8 plain sentences into their inverted, emphatic equivalents, checking correct auxiliary placement for each of the four patterns modelled.

INDEPENDENT PRACTICE / SPEAKING ACTIVITY (10 min): Write 4-5 inverted sentences about a real or invented achievement or turning point, then read them aloud to a partner, who rates how emphatic/natural each one sounds. Share the single most effective inverted sentence with the class.

CRITICAL THINKING / DISCUSSION PROMPT: "Why do you think a rhetorical device like inversion is more effective when used sparingly rather than throughout an entire speech? What happens to its impact if overused?"

LISTENING ACTIVITY (5 min): Listen to a short speech excerpt (6-7 sentences, including 2-3 inverted sentences) and identify each inversion and the emphasis it creates.

READING ACTIVITY — EXTENDED READING & CRITICAL EVALUATION (8 min): Read a short speech transcript excerpt (150-180 words) using inversion for emphasis. Answer 2 literal questions and 2 evaluative questions.

WRITING TASK (5 min): Write 3-4 inverted sentences suitable for a short leadership speech on a topic of your choice.

PRONUNCIATION PRACTICE (5 min): Strong sentence stress on the fronted adverbial in an inverted sentence ("RARELY have I seen...") and a brief, deliberate pause immediately after it.

VOCABULARY REINFORCEMENT: an inversion-pattern matching game: match 8 fronted adverbials to correctly inverted sentence completions.

FORMATIVE ASSESSMENT: Instructor checks correct inversion formation across all four patterns and whether learners can judge when it strengthens versus overloads a sentence, during independent practice.

HOMEWORK: Choose a real or invented cause, initiative, or position you''d want to advocate for as a leader, and jot down 2-3 reasons, ready for Lesson 3.2''s speech and negotiation work.

REVISION: Lesson 3.2 opens with learners briefly naming their homework cause in one sentence.

EXTENSION: Add a "Seldom" or "Not until" inverted sentence as an additional pattern.'),

('itm_l5_m3_lesson2', 'unt_l5_m3', 3, 'reading', 'Lesson 3.2 — Leading the Room — Framing, Persuasion & Advanced Negotiation',
'LEARNING OBJECTIVES: (1) reframe an issue persuasively, shifting its perceived scope or importance, (2) structure and deliver a short leadership speech (vision, rationale, call to action), (3) negotiate as a decision-maker under genuine competing pressures, (4) write a position paper that persuasively argues and defends a clear stance.

PREREQUISITE KNOWLEDGE: Lesson 3.1 (inversion), Level IV Module 8 (negotiation and diplomatic disagreement).

WARM-UP (5 min): Your instructor states one issue framed narrowly ("This is a scheduling problem") and then reframed more broadly ("This isn''t just about scheduling — it''s about whether we can deliver on our promises to our clients") — which framing feels more compelling and why?

PRESENTATION (10 min): "This isn''t just about budget — it''s about whether we''re serious about growth. What''s really at stake here is our credibility with every stakeholder we''ve made commitments to." A short leadership speech structure: VISION (a compelling statement of what could be true), RATIONALE (why this matters now), CALL TO ACTION (a specific, clear ask). Leadership-level negotiation balances competing stakeholder interests, not just two sides'' preferences: "I recognise this affects the team''s workload, our timeline, and our client commitments — here''s how I''d propose balancing those."

GUIDED PRACTICE (10 min): Practise reframing 4 narrowly-stated issues into more compelling, higher-stakes framings, then practise the vision-rationale-call-to-action structure on a provided prompt in pairs.

INDEPENDENT PRACTICE (10 min): Using your Lesson 3.1 homework cause, develop a short leadership speech (vision, rationale, call to action) including at least one inverted sentence and one reframing statement, and rehearse it once.

SPEAKING ACTIVITY — LEADERSHIP SPEECH & NEGOTIATION: Deliver your leadership speech to a small group (or the class), who then role-play as stakeholders with competing concerns; negotiate a path forward, acknowledging multiple stakeholder interests explicitly.

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

('itm_l5_m3_quiz', 'unt_l5_m3', 4, 'quiz', 'Module 3 Quiz — Leadership & Persuasion', NULL),

('itm_l5_m3_assignment', 'unt_l5_m3', 5, 'assignment', 'Module 3 Assignment — A Position Paper & Leadership Speech',
'INSTRUCTIONS: Complete two parts on one real or invented cause, initiative, or position you''d advocate for as a leader. PART A (writing, this level''s third genre): a position paper, 350-450 words, that clearly states your position, argues for it with reasoning and framing language, acknowledges at least one competing stakeholder concern, and closes with a clear call to action. Use at least 2 inverted sentences for emphasis. PART B (speaking): Record yourself (or perform live) a leadership speech, 90 seconds to 2 minutes, based on your position paper, with a clear vision, rationale, and call to action, including at least one reframing statement.

GRADING RUBRIC: (1) Grammatical accuracy — correct inversion formation, used appropriately and not overused. (2) Vocabulary range — at least 4 distinct leadership/persuasion words used correctly, plus one phrasal verb/collocation from this module. (3) Task completion — position, reasoning, framing language, a stakeholder acknowledgement, and a call to action all present in Part A; vision, rationale, call to action, and a reframing statement in Part B. (4) Rhetorical effectiveness — does the paper and speech genuinely persuade, using framing and emphasis effectively? (5) Discourse coherence & register — is the register appropriately authoritative and persuasive throughout, and does the speech''s delivery reinforce the written paper''s argument?

A grade at or above the platform''s pass threshold marks this module complete.');

INSERT INTO quiz_questions (id, learning_item_id, sequence, prompt, choices_json, correct_index) VALUES
('qq_l5_m3_1', 'itm_l5_m3_quiz', 1, '"Rarely ___ such dedication." (inversion)', '["I have seen","have I seen","I seen","did I saw"]', 1),
('qq_l5_m3_2', 'itm_l5_m3_quiz', 2, '"Not only ___ the target, but we exceeded it." (inversion)', '["we met","we did meet","met we","did we meet"]', 3),
('qq_l5_m3_3', 'itm_l5_m3_quiz', 3, '"Under no circumstances ___ we lose sight of this."', '["we should","we shall","should we","shall we"]', 2),
('qq_l5_m3_4', 'itm_l5_m3_quiz', 4, 'When is inversion for rhetorical emphasis most effective?', '["used sparingly, at genuinely emphatic moments","used in every single sentence","never used in speeches","only used in casual conversation"]', 0),
('qq_l5_m3_5', 'itm_l5_m3_quiz', 5, '"This isn''t just about budget — it''s about whether we''re serious about growth." This is an example of:', '["inversion","a citation","a mixed conditional","framing language"]', 3),
('qq_l5_m3_6', 'itm_l5_m3_quiz', 6, 'A leadership speech commonly follows which structure?', '["conclusion, rationale, vision","vision, rationale, call to action","call to action only","no particular structure"]', 1),
('qq_l5_m3_7', 'itm_l5_m3_quiz', 7, 'In British business writing, a company name is often followed by:', '["Plc","Corp.","Inc.","LLC"]', 0),
('qq_l5_m3_8', 'itm_l5_m3_quiz', 8, 'Which phrase means "emphasise a point so it''s fully understood and remembered"?', '["rally behind","win over","drive home","set the tone"]', 2),
('qq_l5_m3_9', 'itm_l5_m3_quiz', 9, 'When negotiating as a leader with multiple stakeholders, an effective approach is to:', '["ignore competing interests","only address the loudest stakeholder","acknowledge multiple stakeholders'' concerns before proposing a path forward","avoid proposing any solution"]', 2),
('qq_l5_m3_10', 'itm_l5_m3_quiz', 10, 'Which phrase means "unite in support of a cause"?', '["rally behind","win over","drive home","take the lead"]', 0);

-- ---------------------------------------------------------------------
-- Module 4: Complex Systems (Science, Economics, Policy)
-- Full prose version: docs/curriculum/level-5/module-04-complex-systems.md
-- ---------------------------------------------------------------------
INSERT INTO units (id, course_id, sequence, title) VALUES
  ('unt_l5_m4', 'crs_level_5', 4, 'Module 4: Complex Systems (Science, Economics, Policy)');

INSERT INTO learning_items (id, unit_id, sequence, kind, title, body) VALUES
('itm_l5_m4_overview', 'unt_l5_m4', 1, 'reading', 'Module Overview & Key Phrases',
'KEY PHRASES: The widespread adoption of... — This appears to suggest... — It could be argued that... — To some extent,... — Broadly speaking,... — This tends to result in...

DISCOURSE MARKERS (functional set — hedging and qualifying claims): "it could be argued that", "to some extent", "broadly speaking", "this appears to suggest" — precise ways of qualifying a claim''s strength.

PHRASAL VERBS & COLLOCATIONS: "factor in [a variable]" (include it in a calculation), "level off" (stop increasing or decreasing), "trickle down" (spread gradually from a source to wider effect), "offset [a cost]" (counterbalance it with a corresponding gain), "tip the balance" (be the deciding factor).

BrE / AmE NOTE: "billion" is a case of full historical convergence: British English traditionally used the "long scale" (a billion = a million million), while American English always used the "short scale" (a billion = a thousand million); the UK officially adopted the short scale in 1974, and virtually all modern British usage now matches the American figure.

KEY VOCABULARY: economics/policy vocabulary (inflation, regulation, subsidy, market failure, externality, fiscal policy), science-as-vehicle vocabulary (variable, correlation, causation, threshold, systemic). Intercultural note: policy priorities and economic philosophy vary significantly by country and political tradition.'),

('itm_l5_m4_lesson1', 'unt_l5_m4', 2, 'reading', 'Lesson 4.1 — The Implementation of... — Advanced Nominalisation for Technical Register',
'LEARNING OBJECTIVES: (1) form dense, technical nominalised noun phrases from full clauses, (2) use nominalisation to compress information efficiently in technical/policy writing, (3) recognise when nominalisation aids clarity versus when it obscures meaning, (4) use science/economics/policy vocabulary accurately as a vehicle for precise expression.

PREREQUISITE KNOWLEDGE: Level IV, Module 6 (basic nominalisation).

WARM-UP (5 min): Your instructor shows one verb-based sentence and its increasingly nominalised versions — what''s gained and potentially lost at each step?

PRESENTATION (10 min): "The widespread adoption of automation technologies has led to significant productivity gains. The implementation of this policy will require careful monitoring of its distributional effects." Advanced nominalisation chains multiple nominalised elements together to compress information into a formal, technical register — genuinely useful, but overuse produces text that''s technically correct but hard to parse.

GUIDED PRACTICE (10 min): Convert 8 verb-based sentences about science/economics/policy topics into nominalised technical register, then identify which conversions genuinely improve precision and which start to feel overly dense.

INDEPENDENT PRACTICE / SPEAKING ACTIVITY (10 min): Write 5 sentences about a science, economics, or policy topic of your choice, using nominalised technical register, then read one to a partner, who tries to "un-nominalise" it back into a plainer verb-based sentence.

CRITICAL THINKING / DISCUSSION PROMPT: "Is highly nominalised, technical writing always a sign of rigour, or can it sometimes be used to make a weak or vague claim sound more authoritative than it really is?"

LISTENING ACTIVITY (5 min): Listen to a short technical policy briefing (6-7 sentences, heavily nominalised) and identify the underlying, simpler claims beneath the technical phrasing.

READING ACTIVITY — EXTENDED READING & CRITICAL EVALUATION (8 min): Read a short policy-report-style excerpt (180-200 words) using dense nominalisation. Answer 2 literal questions and 2 evaluative questions.

WRITING TASK (5 min): Write 4-5 sentences about a complex systems topic, using nominalised technical register deliberately and precisely.

PRONUNCIATION PRACTICE (5 min): Stress patterns across long, multi-syllable technical nominalised phrases (imPLEmentAtion, diSTRIButional, REGuLAtory).

VOCABULARY REINFORCEMENT: an economics/policy vocabulary matching game (inflation, regulation, subsidy, market failure, externality, fiscal policy).

FORMATIVE ASSESSMENT: Instructor checks correct nominalisation formation and a genuine understanding of when it aids versus obscures clarity, during independent practice.

HOMEWORK: Choose one real complex issue with multiple affected stakeholders and jot down 3-4 notes on the different interests involved, ready for Lesson 4.2''s stakeholder meeting.

REVISION: Lesson 4.2 opens with learners briefly naming their chosen issue.

EXTENSION: Take one of your nominalised sentences and deliberately "de-nominalise" it, comparing which version would suit a general-audience report versus a technical one.'),

('itm_l5_m4_lesson2', 'unt_l5_m4', 3, 'reading', 'Lesson 4.2 — It Could Be Argued That... — Hedging & Qualifying Claims & a Stakeholder Meeting',
'LEARNING OBJECTIVES: (1) hedge a claim appropriately using a precise range of qualifying language, (2) distinguish a well-calibrated hedge from either overclaiming or excessive, meaningless vagueness, (3) participate in a stakeholder meeting, representing one perspective while genuinely engaging with others'', (4) write a concise policy brief presenting an issue, evidence, and a recommendation.

PREREQUISITE KNOWLEDGE: Lesson 4.1 (nominalisation, technical register), Level III Module 7 (modals of deduction).

WARM-UP (5 min): Your instructor states one overclaimed statement, one excessively vague one, and one well-calibrated one — which is most credible and why?

PRESENTATION (10 min): "It could be argued that this policy addresses the core issue, though its effectiveness may vary by region. This tends to result in a modest but measurable improvement. Broadly speaking, the evidence supports the proposal, to some extent." Well-calibrated hedging communicates genuine uncertainty precisely. Stakeholder meeting format: each participant represents a distinct stakeholder perspective on a complex issue, states their position with appropriately hedged claims, and must genuinely engage with other perspectives before the group works toward a recommendation.

GUIDED PRACTICE (10 min): You are given 6 claims at varying strength and revise each to be appropriately, precisely hedged for the strength of evidence described.

INDEPENDENT PRACTICE (10 min): In small groups, you are assigned distinct stakeholder perspectives on your Lesson 4.1 homework issue and prepare 2-3 hedged claims supporting your assigned perspective.

SPEAKING ACTIVITY — STAKEHOLDER MEETING: Groups hold a structured stakeholder meeting: each stakeholder states their position with appropriately hedged claims, responds to at least one other stakeholder''s point, and the group works toward a brief joint recommendation.

CRITICAL THINKING / DISCUSSION PROMPT: "In a real stakeholder meeting about a complex issue, is it more useful to reach a quick compromise, or to genuinely understand where the positions irreconcilably differ, even if no agreement is reached? Why?"

LISTENING ACTIVITY (5 min): Listen to a short stakeholder meeting exchange and identify each speaker''s hedged claims and their stakeholder perspective.

READING ACTIVITY (5 min): Read a short written stakeholder position statement and identify its hedging language and how well-calibrated it is to the evidence described.

WRITING TASK (5 min): Write a short summary (5-6 sentences) of your stakeholder meeting''s discussion and outcome, using at least 2 hedging expressions.

PRONUNCIATION PRACTICE (5 min): Measured, credible delivery for hedged claims — avoiding both overly confident and overly tentative intonation.

VOCABULARY REINFORCEMENT: a hedging-strength card-sorting game: sort 9 example claims from strongly hedged to strongly asserted.

FORMATIVE ASSESSMENT: Instructor checks that hedging is genuinely well-calibrated and that stakeholders genuinely engage with other perspectives, during the meeting.

HOMEWORK: Draft your policy brief based on your stakeholder meeting''s issue and discussion, ready for Module 4''s assignment.

REVISION: This lesson opens with the Lesson 4.1 issue-naming recap. Module 4''s Quiz and Assignment draw on both lessons.

EXTENSION: Identify one claim from your group''s discussion that was, on reflection, under- or over-hedged, and revise it.'),

('itm_l5_m4_quiz', 'unt_l5_m4', 4, 'quiz', 'Module 4 Quiz — Complex Systems (Science, Economics, Policy)', NULL),

('itm_l5_m4_assignment', 'unt_l5_m4', 5, 'assignment', 'Module 4 Assignment — A Policy Brief',
'INSTRUCTIONS: Write a policy brief, 350-450 words, on a real or invented complex issue (a science, economics, or policy topic) of your choice. This is this level''s fourth writing genre — the policy brief. Your brief must include: a concise statement of the issue; a summary of relevant evidence, using at least 2 well-calibrated hedged claims; at least 2 instances of dense, technical nominalisation used precisely; an acknowledgement of at least one competing stakeholder perspective; and a clear, specific recommendation.

GRADING RUBRIC: (1) Grammatical accuracy — correct nominalisation formation, correct hedging language. (2) Vocabulary range — at least 4 distinct economics/policy/science words used correctly, plus one phrasal verb/collocation from this module. (3) Task completion — issue statement, evidence summary, a stakeholder acknowledgement, and a recommendation all present. (4) Rhetorical effectiveness — could a non-specialist decision-maker act on this brief after a single reading, and does the recommendation arrive where a busy reader will find it? (5) Evidence & argument quality — is the hedging genuinely well-calibrated to the strength of the evidence presented, and is the recommendation actually justified by the evidence? (6) Discourse coherence & register — is the register appropriately formal, technical, and policy-appropriate throughout, and does the nominalisation aid clarity rather than obscure it?

A grade at or above the platform''s pass threshold marks this module complete.');

INSERT INTO quiz_questions (id, learning_item_id, sequence, prompt, choices_json, correct_index) VALUES
('qq_l5_m4_1', 'itm_l5_m4_quiz', 1, '"The widespread ___ of automation technologies has led to significant productivity gains." (nominalisation of "adopt")', '["adoption","adopting","adopted","adopts"]', 0),
('qq_l5_m4_2', 'itm_l5_m4_quiz', 2, '"The ___ of this policy will require careful monitoring." (nominalisation of "implement")', '["implement","implementing","implementation","implemented"]', 2),
('qq_l5_m4_3', 'itm_l5_m4_quiz', 3, 'What is a genuine risk of overusing nominalisation?', '["sentences become too short","text can become technically correct but hard to parse","it is always grammatically incorrect","it makes writing too informal"]', 1),
('qq_l5_m4_4', 'itm_l5_m4_quiz', 4, '"It ___ be argued that this policy addresses the core issue, though its effectiveness may vary."', '["will","must","can''t","could"]', 3),
('qq_l5_m4_5', 'itm_l5_m4_quiz', 5, 'Which is a well-calibrated hedge, neither overclaiming nor excessively vague?', '["This policy will definitely solve the problem.","Some people think this might possibly help, maybe.","This policy is likely to reduce the problem to some extent, though its full impact remains uncertain.","This policy is perfect."]', 2),
('qq_l5_m4_6', 'itm_l5_m4_quiz', 6, 'Historically, the British "long scale" billion equalled:', '["a million million","a thousand million","a hundred million","ten million"]', 0),
('qq_l5_m4_7', 'itm_l5_m4_quiz', 7, 'Which phrase means "include a variable in a calculation or consideration"?', '["level off","offset","tip the balance","factor in"]', 3),
('qq_l5_m4_8', 'itm_l5_m4_quiz', 8, 'In a stakeholder meeting, an effective participant should:', '["dismiss other perspectives entirely","state their position and genuinely engage with other perspectives","refuse to state a position","only listen, never speak"]', 1),
('qq_l5_m4_9', 'itm_l5_m4_quiz', 9, '"This tends to ___ in a modest but measurable improvement."', '["results","result","resulting","resulted"]', 1),
('qq_l5_m4_10', 'itm_l5_m4_quiz', 10, 'Which phrase means "be the deciding factor between two possibilities"?', '["level off","trickle down","offset","tip the balance"]', 3);

-- ---------------------------------------------------------------------
-- Module 5: Cross-Cultural Communication
-- Full prose version: docs/curriculum/level-5/module-05-cross-cultural-communication.md
-- ---------------------------------------------------------------------
INSERT INTO units (id, course_id, sequence, title) VALUES
  ('unt_l5_m5', 'crs_level_5', 5, 'Module 5: Cross-Cultural Communication');

INSERT INTO learning_items (id, unit_id, sequence, kind, title, body) VALUES
('itm_l5_m5_overview', 'unt_l5_m5', 1, 'reading', 'Module Overview & Key Phrases',
'KEY PHRASES: Would it be possible to...? — I wonder if you might... — I don''t suppose you could...? — If it''s not too much trouble,... — Might I suggest...? — I don''t want to impose, but...

DISCOURSE MARKERS (functional set — graded indirectness): "would it be possible to", "I wonder if you might", "I don''t suppose you could", "if it''s not too much trouble" — a genuine scale of politeness modality, each phrase signalling a different degree of deference and indirectness.

PHRASAL VERBS & COLLOCATIONS: "smooth over [a misunderstanding]" (resolve tension diplomatically), "bridge the gap (between cultures/perspectives)", "lose something in translation", "get off on the wrong foot" (start an interaction badly), "find common ground".

BrE / AmE NOTE: British English uses "cheers" informally to mean "thank you" (alongside its more universal use meaning "goodbye" or as a drinking toast) — a usage that would sound distinctly unusual from an American speaker, who would say "thanks" in the same situation.

KEY VOCABULARY: pragmatics vocabulary (implicature, indirect speech act, face, politeness strategy, deference), cross-cultural vocabulary (norm, convention, high-context/low-context communication, cultural competence). Intercultural note: this entire module is, by design, about the fact that directness/indirectness norms vary significantly by culture.'),

('itm_l5_m5_lesson1', 'unt_l5_m5', 2, 'reading', 'Lesson 5.1 — Would It Be Possible To... — Advanced Modality for Politeness & Pragmatics',
'LEARNING OBJECTIVES: (1) use a graded range of politeness modality accurately, from neutral to highly indirect, (2) recognise an indirect speech act, (3) respond appropriately to an indirect request, (4) choose the right degree of politeness modality for a given social/professional distance.

PREREQUISITE KNOWLEDGE: Level II, Module 5 (basic polite requests).

WARM-UP (5 min): Your instructor says "It''s quite cold in here" in a meeting-room context — what is the speaker actually, indirectly asking for?

PRESENTATION (10 min): A graded politeness scale: "Close the window" (bare imperative) -> "Could you close the window?" (standard polite request) -> "Would it be possible to close the window?" (more indirect) -> "I don''t suppose you could close the window, could you?" (highly indirect) -> "It''s quite cold in here" (an indirect speech act, no request form at all). Choosing the right degree of indirectness depends on social distance, power relationship, and the size of the imposition.

GUIDED PRACTICE (10 min): You are given 8 scenarios varying in social distance/imposition and choose the most appropriate politeness level for a request in each, justifying your choice.

INDEPENDENT PRACTICE / SPEAKING ACTIVITY (10 min): Write 5 requests at different points on the politeness scale for 5 different scenarios, then compare choices with a partner, discussing any disagreement about appropriate directness.

CRITICAL THINKING / DISCUSSION PROMPT: "Why do you think being too indirect can sometimes cause as much miscommunication as being too direct? Can you think of an example where an indirect request was simply missed?"

LISTENING ACTIVITY (5 min): Listen to a short exchange containing an indirect speech act and identify what''s actually being requested or implied beneath the literal words.

READING ACTIVITY — EXTENDED READING & CRITICAL EVALUATION (8 min): Read a short workplace-communication excerpt (150-180 words) containing several requests at different politeness levels. Answer 2 literal questions and 2 evaluative questions.

WRITING TASK (5 min): Write the same request at three different politeness levels for three different addressees.

PRONUNCIATION PRACTICE (5 min): Rising, tentative intonation for highly indirect requests versus more level, confident intonation for standard polite requests.

VOCABULARY REINFORCEMENT: a politeness-scale ordering game: order 9 request forms from most direct to most indirect.

FORMATIVE ASSESSMENT: Instructor checks that politeness-level choices are well-justified by social distance/imposition reasoning during independent practice.

HOMEWORK: Think of one real or invented cross-cultural communication misunderstanding and jot down what happened, ready for Lesson 5.2''s analysis and negotiation work.

REVISION: Lesson 5.2 opens with learners briefly naming their homework scenario.

EXTENSION: Add one indirect speech act of your own invention and have a partner guess its intended meaning.'),

('itm_l5_m5_lesson2', 'unt_l5_m5', 3, 'reading', 'Lesson 5.2 — Reading the Cultural Context — Politeness Strategies & Intercultural Negotiation',
'LEARNING OBJECTIVES: (1) distinguish positive politeness from negative politeness, (2) recognise how directness norms vary across cultural communication styles, without stereotyping, (3) negotiate diplomatically, adapting your communication style to your counterpart''s apparent expectations, (4) analyse a cross-cultural communication case study critically.

PREREQUISITE KNOWLEDGE: Lesson 5.1 (politeness modality), Level IV Module 8 (negotiation and diplomatic disagreement).

WARM-UP (5 min): Your instructor models two different ways of starting a business meeting — one jumping straight to the agenda, one opening with extended relationship-building small talk — which might be expected in different professional contexts you know of?

PRESENTATION (10 min): POSITIVE POLITENESS emphasises shared interests, compliments, and inclusion ("We''re all in this together — I really value your input here"); NEGATIVE POLITENESS emphasises respecting the other person''s autonomy and minimising imposition ("I don''t want to take up too much of your time, but..."). Both are genuinely polite, just oriented differently. Intercultural negotiation language: explicitly checking understanding ("I want to make sure I''ve understood your position correctly — could you confirm...?"), and flexibly adapting register/directness based on a counterpart''s apparent style.

GUIDED PRACTICE (10 min): Identify 6 example utterances as primarily positive-politeness or negative-politeness strategies, discussing what each is designed to achieve.

INDEPENDENT PRACTICE (10 min): In pairs, roleplay a short negotiation where each person is assigned a different communication style preference and must adapt to reach a working agreement, explicitly checking understanding at least once.

SPEAKING ACTIVITY — INTERCULTURAL NEGOTIATION: The negotiation roleplay above, extended to a full 90-second-2-minute exchange, observed by a third learner who notes moments of adaptation and any remaining friction.

CRITICAL THINKING / DISCUSSION PROMPT: "Is it the responsibility of one person to adapt to another''s communication style in a cross-cultural interaction, or should both sides meet somewhere in the middle? Does it depend on the context?"

LISTENING ACTIVITY (5 min): Listen to a short intercultural negotiation exchange and identify one moment of successful adaptation and one moment of potential friction or miscommunication.

READING ACTIVITY (5 min): Read a short written cross-cultural communication case study (generic, invented, respectfully framed) and identify the miscommunication, its likely cause, and how it might have been avoided.

WRITING TASK (5 min): Write a short analysis (5-6 sentences) of your Lesson 5.1 homework scenario, identifying the likely communication-style factors involved.

PRONUNCIATION PRACTICE (5 min): Flexible register-shifting mid-conversation — moving fluidly between a more relationship-focused, warmer delivery and a more efficient, task-focused one.

VOCABULARY REINFORCEMENT: a pragmatics vocabulary matching game (implicature, indirect speech act, face, politeness strategy, deference).

FORMATIVE ASSESSMENT: Instructor checks for genuine adaptive behaviour and explicit understanding-checking during the negotiation roleplay.

HOMEWORK: Finalise your case-study analysis for Module 5''s assignment.

REVISION: This lesson opens with the Lesson 5.1 scenario recap. Module 5''s Quiz and Assignment draw on both lessons.

EXTENSION: Propose one concrete communication-style adjustment that could have prevented your case study''s miscommunication.'),

('itm_l5_m5_quiz', 'unt_l5_m5', 4, 'quiz', 'Module 5 Quiz — Cross-Cultural Communication', NULL),

('itm_l5_m5_assignment', 'unt_l5_m5', 5, 'assignment', 'Module 5 Assignment — An Analytical Paper — A Cross-Cultural Communication Case Study',
'INSTRUCTIONS: Write an analytical paper, 350-450 words, examining a real or invented cross-cultural communication case study (kept generic and respectfully framed, not stereotyping any real culture). This is this level''s fifth writing genre — the analytical paper. Your paper must include: a description of the miscommunication or communication challenge; analysis using this module''s pragmatics vocabulary (positive/negative politeness, indirect speech acts, face); at least 2 requests or statements at different politeness levels, analysed for their appropriateness; a discussion of the likely underlying cause; and a concrete, actionable recommendation for avoiding similar miscommunication in future.

GRADING RUBRIC: (1) Grammatical accuracy — correct, graded politeness modality used accurately throughout the analysis. (2) Vocabulary range — at least 4 distinct pragmatics/cross-cultural words used correctly, plus one phrasal verb/collocation from this module. (3) Task completion — case description, pragmatic analysis, a cause discussion, and a concrete recommendation all present. (4) Rhetorical effectiveness — is the analysis framed so that a reader from either side of the case would recognise their own position in it rather than a caricature of it? (5) Evidence & argument quality — is the pragmatic analysis genuinely insightful, and is the recommendation specific and actionable rather than generic advice? (6) Discourse coherence & register — is the register appropriately analytical and respectful throughout, and does the paper read as one connected, well-reasoned analysis?

A grade at or above the platform''s pass threshold marks this module complete.');

INSERT INTO quiz_questions (id, learning_item_id, sequence, prompt, choices_json, correct_index) VALUES
('qq_l5_m5_1', 'itm_l5_m5_quiz', 1, 'Which is the most indirect, highly deferential request?', '["I don''t suppose you could close the window, could you?","Close the window.","Could you close the window?","Window, please."]', 0),
('qq_l5_m5_2', 'itm_l5_m5_quiz', 2, '"It''s quite cold in here" said in a meeting is an example of:', '["a direct imperative","a formal citation","an indirect speech act","a mixed conditional"]', 2),
('qq_l5_m5_3', 'itm_l5_m5_quiz', 3, 'What determines the appropriate degree of politeness indirectness?', '["the time of day only","social distance, power relationship, and size of imposition","the speaker''s age only","nothing; it''s random"]', 1),
('qq_l5_m5_4', 'itm_l5_m5_quiz', 4, 'Which best describes "positive politeness"?', '["respecting autonomy and minimising imposition","using only formal language","avoiding all requests","emphasising shared interests and inclusion"]', 3),
('qq_l5_m5_5', 'itm_l5_m5_quiz', 5, 'Which best describes "negative politeness"?', '["being rude on purpose","emphasising shared interests","respecting the other person''s autonomy and minimising imposition","refusing to negotiate"]', 2),
('qq_l5_m5_6', 'itm_l5_m5_quiz', 6, 'In British English, "cheers" used informally can mean:', '["\"thank you\"","only \"goodbye\"","\"hello\"","\"please\""]', 0),
('qq_l5_m5_7', 'itm_l5_m5_quiz', 7, 'Which phrase means "resolve tension diplomatically"?', '["bridge the gap","lose in translation","find common ground","smooth over"]', 3),
('qq_l5_m5_8', 'itm_l5_m5_quiz', 8, 'Which phrase means "identify shared interests despite differences"?', '["get off on the wrong foot","find common ground","lose in translation","smooth over"]', 1),
('qq_l5_m5_9', 'itm_l5_m5_quiz', 9, 'In intercultural negotiation, explicitly checking understanding is:', '["unnecessary if both speak English","a useful way to bridge potential communication-style gaps","considered rude in all cultures","only needed at the very end"]', 1),
('qq_l5_m5_10', 'itm_l5_m5_quiz', 10, 'What is a genuine risk of being too indirect in a request?', '["it is always more polite with no downside","it is grammatically incorrect","it always sounds rude","it can be missed entirely, causing as much miscommunication as being too direct"]', 3);

-- ---------------------------------------------------------------------
-- Module 6: Advanced Media & Discourse Analysis
-- Full prose version: docs/curriculum/level-5/module-06-advanced-media-discourse-analysis.md
-- ---------------------------------------------------------------------
INSERT INTO units (id, course_id, sequence, title) VALUES
  ('unt_l5_m6', 'crs_level_5', 6, 'Module 6: Advanced Media & Discourse Analysis');

INSERT INTO learning_items (id, unit_id, sequence, kind, title, body) VALUES
('itm_l5_m6_overview', 'unt_l5_m6', 1, 'reading', 'Module Overview & Key Phrases',
'KEY PHRASES: It was [X] that... — What really matters is... — What emerges from this is... — Beneath the surface,... — On the surface..., but in reality,... — That''s an interesting question, but what I''d really emphasise is...

DISCOURSE MARKERS (functional set — revealing subtext): "what emerges from this is", "beneath the surface", "the subtext here is", "on the surface... but in reality..." — language for articulating an implied meaning beneath a text''s literal content.

PHRASAL VERBS & COLLOCATIONS: "hint at [something]" (suggest it indirectly), "dodge [a question]" (avoid answering it directly), "deflect [criticism]" (redirect it away from oneself), "come across as [a certain way]" (create a particular impression), "spell out [something]" (state it explicitly, the opposite of hinting).

BrE / AmE NOTE: British broadcasting uses "newsreader" for the person presenting televised or radio news, while American broadcasting uses "news anchor" (or simply "anchor") for the equivalent role.

KEY VOCABULARY: advanced media-analysis vocabulary (subtext, framing, loaded question, spin, media literacy, discourse), interview vocabulary (leading question, follow-up, on the record, soundbite). Intercultural note: expectations around directness in media interviews vary by media culture and professional context.'),

('itm_l5_m6_lesson1', 'unt_l5_m6', 2, 'reading', 'Lesson 6.1 — It Was This That Changed Everything — Cleft Sentences for Emphasis',
'LEARNING OBJECTIVES: (1) form it-clefts correctly (It was/is [X] that...) to emphasise a specific element of a sentence, (2) form wh-clefts/pseudo-clefts correctly (What [X] is...) to emphasise an action or idea, (3) choose between a cleft sentence and its plain equivalent based on what needs emphasis, (4) use cleft sentences deliberately in persuasive writing and speech.

PREREQUISITE KNOWLEDGE: Level V, Module 3 (inversion for emphasis).

WARM-UP (5 min): Your instructor states one plain sentence and its cleft equivalent ("The new policy caused the backlash" vs. "It was the new policy that caused the backlash") — what shifted in emphasis?

PRESENTATION (10 min): IT-CLEFTS: "It was the new policy that caused the backlash"; "It wasn''t the cost that concerned investors — it was the lack of transparency." WH-CLEFTS: "What really matters here is trust"; "What the data actually shows is a more complicated picture." Both cleft types isolate one element of a sentence and mark it as the important, emphasised part — different from inversion, which emphasises through front-placement and unusual word order.

GUIDED PRACTICE (10 min): Convert 8 plain sentences into either it-cleft or wh-cleft form (as directed), checking the emphasis lands on the intended element.

INDEPENDENT PRACTICE / SPEAKING ACTIVITY (10 min): Write 5 cleft sentences (a mix of it-clefts and wh-clefts) about a topic you have an opinion on, then read them to a partner, who identifies which element is being emphasised in each.

CRITICAL THINKING / DISCUSSION PROMPT: "Why do you think a writer or speaker might choose a cleft sentence instead of just adding a stress mark or saying a word more loudly? What does the sentence structure itself contribute?"

LISTENING ACTIVITY (5 min): Listen to a short persuasive talk excerpt (6-7 sentences, including 2-3 cleft sentences) and identify each cleft and what it emphasises.

READING ACTIVITY — EXTENDED READING & CRITICAL EVALUATION (8 min): Read a short opinion/persuasive-article excerpt (180-200 words) using cleft sentences. Answer 2 literal questions and 2 evaluative questions.

WRITING TASK (5 min): Write 3-4 cleft sentences (a mix of both types) suitable for a persuasive article on a topic of your choice.

PRONUNCIATION PRACTICE (5 min): Strong stress on the emphasised element in a cleft sentence ("It was the POLICY that caused the backlash") and the natural, slightly lower-pitched delivery of the that-clause that follows.

VOCABULARY REINFORCEMENT: a cleft-sentence transformation relay: convert 10 plain sentences into cleft form, alternating it-cleft and wh-cleft patterns.

FORMATIVE ASSESSMENT: Instructor checks correct cleft formation (both types) and that the intended element is genuinely emphasised, during independent practice.

HOMEWORK: Choose a topic for your persuasive article and jot down 2-3 points you''d want to emphasise using cleft sentences, ready for Lesson 6.2''s media interview work.

REVISION: Lesson 6.2 opens with learners briefly naming their homework topic.

EXTENSION: Write one sentence using a negative it-cleft ("It wasn''t X that mattered — it was Y") to emphasise a contrast.'),

('itm_l5_m6_lesson2', 'unt_l5_m6', 3, 'reading', 'Lesson 6.2 — Beneath the Surface — Analysing Subtext & Bias at Depth & a Media Interview',
'LEARNING OBJECTIVES: (1) analyse a text''s subtext at depth, explaining how specific choices create that implication, (2) identify how rhetorical devices work together to construct a persuasive effect, (3) respond to a leading or loaded question in a media interview strategically and honestly, (4) write a persuasive article using rhetorical emphasis deliberately.

PREREQUISITE KNOWLEDGE: Lesson 6.1 (cleft sentences), Level IV Module 7 (identifying purpose/bias/tone/technique).

WARM-UP (5 min): Your instructor asks one clearly loaded interview question ("Given how badly this has gone, don''t you think it''s time to admit failure?") — what assumption is embedded in the question itself?

PRESENTATION (10 min): "On the surface, this article simply reports the figures. But in reality, the choice to lead with the most alarming statistic, combined with the cleft sentence ''It was mismanagement that caused this'' rather than a more neutral phrasing, constructs a subtext of blame before any evidence is presented." This combines observations into one coherent claim about the text''s underlying implication. Responding to a loaded interview question strategically: acknowledging the question''s framing without accepting its embedded assumption ("I''d actually push back on the framing there — the situation is more nuanced than ''failure,'' and here''s why...").

GUIDED PRACTICE (10 min): You are given 3 short media excerpts and write a combined subtext analysis for each — explaining how 2-3 techniques work together.

INDEPENDENT PRACTICE (10 min): In pairs, Learner A interviews Learner B (using their Lesson 6.1 homework topic) with at least one genuinely loaded or leading question; Learner B responds strategically, acknowledging the framing honestly without being derailed, then swap.

SPEAKING ACTIVITY — MEDIA INTERVIEW: The interview roleplay above, extended to include 3-4 questions (a mix of neutral and loaded/leading), with the interviewee maintaining message discipline while staying honest and substantive.

CRITICAL THINKING / DISCUSSION PROMPT: "What''s the difference between skilfully addressing a loaded question''s framing and simply dodging it? How can a listener tell the difference?"

LISTENING ACTIVITY (5 min): Listen to a short media interview exchange with one loaded question and evaluate whether the response addresses the framing honestly or dodges it.

READING ACTIVITY (5 min): Read a short media article excerpt and write a combined subtext analysis identifying at least 2 techniques working together.

WRITING TASK (5 min): Draft your persuasive article''s opening paragraph, using at least one cleft sentence deliberately for emphasis.

PRONUNCIATION PRACTICE (5 min): Composed, credible delivery for handling a difficult interview question — a brief thoughtful pause before responding, and level, confident intonation.

VOCABULARY REINFORCEMENT: an interview-language matching game (leading question, follow-up, on the record, soundbite, dodge, deflect).

FORMATIVE ASSESSMENT: Instructor checks for genuine combined subtext analysis and honest, substantive interview responses during the roleplay.

HOMEWORK: Complete your persuasive article draft for Module 6''s assignment.

REVISION: This lesson opens with the Lesson 6.1 topic recap. Module 6''s Quiz and Assignment draw on both lessons.

EXTENSION: Identify a real (or realistically invented) example of a public figure handling a difficult question particularly well or poorly, analysing what made the difference.'),

('itm_l5_m6_quiz', 'unt_l5_m6', 4, 'quiz', 'Module 6 Quiz — Advanced Media & Discourse Analysis', NULL),

('itm_l5_m6_assignment', 'unt_l5_m6', 5, 'assignment', 'Module 6 Assignment — A Persuasive Article & Media Interview',
'INSTRUCTIONS: Complete two parts on one topic of your choice. PART A (writing, this level''s sixth genre): a persuasive article, 350-450 words, arguing a clear position. Use at least 3 cleft sentences (a mix of it-clefts and wh-clefts) deliberately for rhetorical emphasis, and demonstrate awareness of how your word choice and framing construct your article''s overall persuasive effect. PART B (speaking): Record yourself (or perform with a partner) a media interview, 90 seconds to 2 minutes, about your article''s topic, including at least one loaded or leading question and a strategic, honest response that addresses the framing without dodging.

GRADING RUBRIC: (1) Grammatical accuracy — correct cleft sentence formation (both types). (2) Vocabulary range — at least 4 distinct media-analysis/interview words used correctly, plus one phrasal verb/collocation from this module. (3) Task completion — a clear position, at least 3 cleft sentences, and rhetorical awareness in Part A; a loaded question and a strategic response in Part B. (4) Rhetorical effectiveness — do the cleft sentences genuinely strengthen the article''s persuasive impact, and does the interview response handle the loaded question skilfully? (5) Discourse coherence & register — is the article''s register appropriately persuasive and professional throughout, and does the interview response sound composed and credible?

A grade at or above the platform''s pass threshold marks this module complete.');

INSERT INTO quiz_questions (id, learning_item_id, sequence, prompt, choices_json, correct_index) VALUES
('qq_l5_m6_1', 'itm_l5_m6_quiz', 1, '"It was the new policy ___ caused the backlash." (it-cleft)', '["who","which is","that","what"]', 2),
('qq_l5_m6_2', 'itm_l5_m6_quiz', 2, '"What really ___ here is trust." (wh-cleft)', '["matters","matter","mattering","mattered"]', 0),
('qq_l5_m6_3', 'itm_l5_m6_quiz', 3, '"It wasn''t the cost ___ concerned investors — it was the lack of transparency."', '["which","what","who","that"]', 3),
('qq_l5_m6_4', 'itm_l5_m6_quiz', 4, 'What is the main function of a cleft sentence?', '["to make a sentence longer for no reason","to isolate and emphasise one specific element of a sentence","to avoid using any emphasis at all","to make a sentence grammatically incorrect"]', 1),
('qq_l5_m6_5', 'itm_l5_m6_quiz', 5, 'A loaded interview question is one that:', '["carries an embedded assumption or bias within the question itself","is completely neutral","is always illegal to ask","has only one possible answer"]', 0),
('qq_l5_m6_6', 'itm_l5_m6_quiz', 6, 'What distinguishes strategic, honest handling of a loaded question from simply dodging it?', '["there is no difference","speaking for a very long time","acknowledging the framing while staying substantive, versus avoiding the question entirely","refusing to answer"]', 2),
('qq_l5_m6_7', 'itm_l5_m6_quiz', 7, 'In British broadcasting, the person presenting televised news is often called a:', '["news anchor","newsreader","news host","presenter only"]', 1),
('qq_l5_m6_8', 'itm_l5_m6_quiz', 8, 'Which phrase means "suggest something indirectly, without stating it outright"?', '["spell out","dodge","deflect","hint at"]', 3),
('qq_l5_m6_9', 'itm_l5_m6_quiz', 9, 'Which phrase means "avoid answering a question directly, often evasively"?', '["hint at","spell out","come across as","dodge"]', 3),
('qq_l5_m6_10', 'itm_l5_m6_quiz', 10, 'Combined subtext analysis (as taught in this module) means:', '["naming a single rhetorical technique in isolation","explaining how multiple techniques work together to construct an implied meaning","only analysing grammar","ignoring word choice entirely"]', 1);

-- ---------------------------------------------------------------------
-- Module 7: Research & Presentation
-- Full prose version: docs/curriculum/level-5/module-07-research-presentation.md
-- ---------------------------------------------------------------------
INSERT INTO units (id, course_id, sequence, title) VALUES
  ('unt_l5_m7', 'crs_level_5', 7, 'Module 7: Research & Presentation');

INSERT INTO learning_items (id, unit_id, sequence, kind, title, body) VALUES
('itm_l5_m7_overview', 'unt_l5_m7', 1, 'reading', 'Module Overview & Key Phrases',
'KEY PHRASES: Insofar as... — Notwithstanding [X],... — By the same token,... — Conversely,... — That said,... — With this in mind,...

DISCOURSE MARKERS (functional set — complex argument structuring): "insofar as" (to the extent that), "notwithstanding" (despite, formal), "by the same token" (extending reasoning by analogy), "conversely" (a contrasting parallel point), "that said" (a pivot acknowledging a prior point) — capable of holding a genuinely multi-layered argument together across many moves.

PHRASAL VERBS & COLLOCATIONS: "narrow down [a topic]" (reduce it to a specific, manageable focus), "home in on [a finding]" (focus precisely on a significant result), "tease out [a nuance]" (carefully extract a subtle distinction), "open up [a discussion]" (invite broader participation), "bring [something] to a close" (end it in a considered, deliberate way).

BrE / AmE NOTE: British English uses "postgraduate" (or "postgrad") for study beyond a first (bachelor''s) degree, while American English uses "graduate" (as in "graduate school," "graduate student") for the identical level of study.

KEY VOCABULARY: research vocabulary (research question, scope, methodology, findings, implications, limitations), presentation vocabulary (abstract, keynote, discussant, plenary, breakout session). Intercultural note: conference and academic presentation norms vary by academic discipline and country.'),

('itm_l5_m7_lesson1', 'unt_l5_m7', 2, 'reading', 'Lesson 7.1 — Structuring the Argument — Discourse Markers for Complex Argumentation',
'LEARNING OBJECTIVES: (1) use insofar as, notwithstanding, by the same token, conversely, that said correctly to structure a multi-layered argument, (2) build an argument with more than a simple two-part contrast, (3) narrow a broad research topic down to a specific, answerable focus, (4) write a concise conference abstract.

PREREQUISITE KNOWLEDGE: Level V, Module 2 (essay-level cohesion).

WARM-UP (5 min): Your instructor presents a short argument using only "however" and "because" repeatedly, then a revised version using this module''s richer connector set — which sounds more sophisticated and precisely structured?

PRESENTATION (10 min): "Insofar as remote work increases flexibility, it benefits most employees. Notwithstanding this, certain roles genuinely require in-person collaboration. By the same token, some industries face constraints that others don''t. Conversely, fully remote industries show few such limitations. That said, the overall trend favours flexible arrangements where feasible." Each connector performs a distinct structural job — qualifying scope, conceding despite a point, extending reasoning by analogy, introducing a parallel contrast, pivoting to a considered final position.

GUIDED PRACTICE (10 min): Complete 8 sentence pairs using the correct connector from this module''s set for the structural relationship described.

INDEPENDENT PRACTICE / SPEAKING ACTIVITY (10 min): Write a short multi-move argument (5-6 sentences) on a topic of your choice, using at least 4 different connectors from this module''s set, then read it to a partner, who identifies each connector''s structural function.

CRITICAL THINKING / DISCUSSION PROMPT: "Why do you think a sophisticated argument often needs more than just ''X, but Y'' — what does a multi-move structure let a writer do that a simple two-part contrast can''t?"

LISTENING ACTIVITY (5 min): Listen to a short complex argument (7-8 sentences, using several connectors from this module) and identify each connector and its structural function.

READING ACTIVITY — EXTENDED READING & CRITICAL EVALUATION (8 min): Read a short academic-style argument excerpt (180-200 words) using this module''s connector set. Answer 2 literal questions and 2 evaluative questions.

WRITING TASK (5 min): Narrow a broad topic of your choice down to a specific, answerable research focus (one sentence), then write a 150-200 word conference abstract.

PRONUNCIATION PRACTICE (5 min): Measured, deliberate pacing and clear stress on each connector when reading a complex, multi-move argument aloud.

VOCABULARY REINFORCEMENT: a connector-function matching game: match 10 example sentences to the correct connector based on the structural relationship needed.

FORMATIVE ASSESSMENT: Instructor checks correct, purposeful use of the connector set and a genuinely narrowed, specific research focus, during independent practice.

HOMEWORK: Finalise your conference abstract and research focus, ready for Lesson 7.2''s presentation work.

REVISION: Lesson 7.2 opens with learners briefly sharing their research focus in one sentence.

EXTENSION: Add one additional connector from the set to extend your multi-move argument with a further qualification or parallel point.'),

('itm_l5_m7_lesson2', 'unt_l5_m7', 3, 'reading', 'Lesson 7.2 — The Floor Is Yours — Structuring & Delivering a Research-Informed Presentation & Facilitating Q&A',
'LEARNING OBJECTIVES: (1) structure a 6-8 minute research-informed presentation (context, research question, findings/argument, implications, conclusion), (2) deliver it with sustained, well-paced formal register, (3) actively facilitate Q&A, (4) write a fuller research essay expanding on the conference abstract.

PREREQUISITE KNOWLEDGE: Lesson 7.1 (complex argumentation, conference abstract), Level IV Module 6 (the 4-5 minute presentation).

WARM-UP (5 min): Your instructor contrasts a presenter who simply answers questions one at a time with one who actively facilitates — which creates a more genuinely engaged discussion?

PRESENTATION (10 min): The extended presentation structure: CONTEXT (why this matters, briefly); RESEARCH QUESTION/FOCUS (precisely stated); FINDINGS/ARGUMENT (the substantive core, using this module''s connector set); IMPLICATIONS (why the findings matter beyond the immediate topic); CONCLUSION (a clear, memorable closing statement). Active Q&A facilitation: explicitly inviting questions ("I''d welcome your questions — what''s on your mind?"), synthesising across questions, and gracefully managing time or redirecting an off-topic question.

GUIDED PRACTICE (10 min): In pairs, take turns delivering a 2-minute mini-version of your presentation, while the partner asks 2 questions and the presenter practises facilitating rather than just answering.

INDEPENDENT PRACTICE (10 min): Develop your full presentation outline (context, research question, findings, implications, conclusion) from your Lesson 7.1 conference abstract, and rehearse it once.

SPEAKING ACTIVITY — FLAGSHIP RESEARCH-INFORMED PRESENTATION: Deliver your full 6-8 minute presentation to a small group (or the class), facilitating a genuine Q&A round afterward (inviting, synthesising, and gracefully managing at least 3 questions).

CRITICAL THINKING / DISCUSSION PROMPT: "What''s the difference between a presenter who merely tolerates questions and one who genuinely uses Q&A to strengthen their argument? What does the second kind of presenter actually do differently?"

LISTENING ACTIVITY (5 min): Listen to a presenter facilitating Q&A (3-4 exchanges) and identify moments of active facilitation versus simple question-answering.

READING ACTIVITY (5 min): Read a short written presentation outline/script excerpt and label its five structural parts.

WRITING TASK (5 min): Expand your conference abstract into the opening two paragraphs (context and research question) of your full research essay.

PRONUNCIATION PRACTICE (5 min): Sustained vocal energy and pacing across a longer, 6-8 minute talk — varied pitch to prevent monotony, and warm, inviting intonation for Q&A-invitation phrases.

VOCABULARY REINFORCEMENT: a presentation/research vocabulary matching game (research question, scope, methodology, findings, implications, limitations, abstract, plenary).

FORMATIVE ASSESSMENT: Instructor checks for a genuine five-part presentation structure and active Q&A facilitation during the presentation task.

HOMEWORK: Complete your full research essay draft, ready for Module 7''s assignment.

REVISION: This lesson opens with the Lesson 7.1 research-focus recap. Module 7''s Quiz and Assignment draw on both lessons.

EXTENSION: Prepare one anticipated difficult question in advance and rehearse a response that uses this module''s connector set.'),

('itm_l5_m7_quiz', 'unt_l5_m7', 4, 'quiz', 'Module 7 Quiz — Research & Presentation', NULL),

('itm_l5_m7_assignment', 'unt_l5_m7', 5, 'assignment', 'Module 7 Assignment — A Research Essay, Conference Abstract & Presentation',
'INSTRUCTIONS: Complete three connected parts on one narrowed research focus of your choice. PART A: a conference abstract (150-200 words) — this level''s seventh writing genre. PART B: a research essay (450-550 words) expanding on the abstract, using at least 3 connectors from this module''s set to structure a multi-move argument — this level''s eighth writing genre. PART C (speaking, the flagship task): Record yourself (or perform live) a 6-8 minute research-informed presentation based on your essay, structured in five clear parts, and facilitate a Q&A round (real or simulated) with at least 3 questions, actively inviting and synthesising rather than just answering.

GRADING RUBRIC: (1) Grammatical accuracy — correct, purposeful use of this module''s advanced connector set. (2) Vocabulary range — at least 4 distinct research/presentation words used correctly, plus one phrasal verb/collocation from this module. (3) Task completion — abstract, essay, and a fully structured presentation with active Q&A facilitation all present. (4) Rhetorical effectiveness — does the abstract make a reader want the paper, and does the Q&A facilitation strengthen the argument rather than merely defend it? (5) Evidence & argument quality — is the research focus genuinely narrowed and specific, and does the multi-move argument in the essay hold together as one coherent position? (6) Discourse coherence & register — is the register consistently formal and academic across all three parts, and does the presentation''s delivery reinforce the written argument''s sophistication?

A grade at or above the platform''s pass threshold marks this module complete.');

INSERT INTO quiz_questions (id, learning_item_id, sequence, prompt, choices_json, correct_index) VALUES
('qq_l5_m7_1', 'itm_l5_m7_quiz', 1, '"___ remote work increases flexibility, it benefits most employees." (to the extent that)', '["Notwithstanding","Conversely","Insofar as","That said"]', 2),
('qq_l5_m7_2', 'itm_l5_m7_quiz', 2, '"___ this, certain roles genuinely require in-person collaboration." (despite, formal)', '["Notwithstanding","Insofar as","By the same token","Conversely"]', 0),
('qq_l5_m7_3', 'itm_l5_m7_quiz', 3, '"___, some industries face constraints that others don''t." (extending reasoning by analogy)', '["Conversely","Insofar as","Notwithstanding","By the same token"]', 3),
('qq_l5_m7_4', 'itm_l5_m7_quiz', 4, '"___, the overall trend favours flexible arrangements where feasible." (a pivot to a final position)', '["Insofar as","That said","By the same token","Notwithstanding"]', 1),
('qq_l5_m7_5', 'itm_l5_m7_quiz', 5, 'What does a conference abstract typically summarise?', '["background, focus/question, key finding, and implication","only the presenter''s biography","the entire full-length paper word-for-word","nothing; it is just a title"]', 0),
('qq_l5_m7_6', 'itm_l5_m7_quiz', 6, 'In British English, study beyond a first (bachelor''s) degree is commonly called:', '["graduate study","undergraduate study","postgraduate study","pre-graduate study"]', 2),
('qq_l5_m7_7', 'itm_l5_m7_quiz', 7, 'What does active Q&A facilitation include, beyond simply answering questions?', '["ignoring all questions","inviting questions and synthesising across them","refusing to take more than one question","reading directly from notes only"]', 1),
('qq_l5_m7_8', 'itm_l5_m7_quiz', 8, 'Which phrase means "focus precisely on a specific, significant result"?', '["narrow down","tease out","open up","home in on"]', 3),
('qq_l5_m7_9', 'itm_l5_m7_quiz', 9, 'Which phrase means "carefully extract a subtle distinction through analysis"?', '["narrow down","home in on","bring to a close","tease out"]', 3),
('qq_l5_m7_10', 'itm_l5_m7_quiz', 10, 'A 6-8 minute research-informed presentation typically includes context, research question, findings, implications, and:', '["no conclusion","a clear, memorable conclusion","only a Q&A section","a second, unrelated topic"]', 1);

-- ---------------------------------------------------------------------
-- Module 8: Professional Advocacy
-- Full prose version: docs/curriculum/level-5/module-08-professional-advocacy.md
-- ---------------------------------------------------------------------
INSERT INTO units (id, course_id, sequence, title) VALUES
  ('unt_l5_m8', 'crs_level_5', 8, 'Module 8: Professional Advocacy');

INSERT INTO learning_items (id, unit_id, sequence, kind, title, body) VALUES
('itm_l5_m8_overview', 'unt_l5_m8', 1, 'reading', 'Module Overview & Key Phrases',
'KEY PHRASES: It has been established that... — The claim is supported by... — Concerns have been raised and must be addressed. — We are aware of the situation and are taking the following steps... — The evidence clearly shows... — Crucially,...

DISCOURSE MARKERS (functional set — advocacy emphasis): "the evidence clearly shows", "it is well established that", "the case rests on", "crucially" — language for building and signalling the strongest points of a formal case, distinct from Module 4''s hedging register.

PHRASAL VERBS & COLLOCATIONS: "stand by [a claim/decision]" (continue to support it under challenge), "back down (from a position)" (concede or retreat), "hold one''s ground" (maintain a position firmly), "own up to [a mistake]" (admit it honestly), "get ahead of [a story/issue]" (address a problem proactively).

BrE / AmE NOTE: British English distinguishes "barrister" (who represents clients in court) from "solicitor" (who handles legal advice and preparation) — two distinct professional roles; American English uses "lawyer" or "attorney" for both functions, without this formal split.

KEY VOCABULARY: advocacy vocabulary (case, claim, burden of proof, credibility, corroboration), crisis-communication vocabulary (transparency, accountability, mitigation, stakeholder trust, reputational risk). Intercultural note: expectations around crisis communication vary by country, industry, and legal system.'),

('itm_l5_m8_lesson1', 'unt_l5_m8', 2, 'reading', 'Lesson 8.1 — The Case Has Been Made... — Advanced Passive Under Formal Pressure',
'LEARNING OBJECTIVES: (1) use advanced passive constructions to build a formal, credible case, (2) distinguish confident, well-supported assertion from either overclaiming or excessive hedging, (3) structure a case with a clear claim, supporting evidence, and an anticipated counter-argument addressed, (4) recognise when passive voice strengthens advocacy writing versus when active voice would be more direct and forceful.

PREREQUISITE KNOWLEDGE: Level IV, Module 5 (passive voice II).

WARM-UP (5 min): Your instructor presents one claim stated tentatively and the same claim stated with confident, evidence-backed passive constructions — which sounds more credible in a formal advocacy context?

PRESENTATION (10 min): "It has been established that the proposed approach reduces costs significantly. The claim is supported by independent analysis conducted over the past year. Concerns have been raised about implementation timelines, and these must be addressed directly, not dismissed." Advanced passive here builds credibility by foregrounding the claim and its support rather than the arguer — genuinely persuasive, though still requiring genuine evidence, not passive voice used to disguise a weak claim.

GUIDED PRACTICE (10 min): Convert 8 active, tentative sentences into confident, passive-supported advocacy statements, checking that each remains honestly proportionate to genuine supporting evidence.

INDEPENDENT PRACTICE / SPEAKING ACTIVITY (10 min): Write 5 sentences building a case for a real or invented proposal, using advanced passive constructions confidently, then read one to a partner, who evaluates whether it sounds credibly supported or overclaimed.

CRITICAL THINKING / DISCUSSION PROMPT: "Where do you think the line is between confidently advocating for a position and overstating the evidence behind it? Is this always easy to judge from the outside?"

LISTENING ACTIVITY (5 min): Listen to a short formal case statement (6-7 sentences, using advanced passive) and evaluate whether its claims sound proportionate to the evidence cited.

READING ACTIVITY — EXTENDED READING & CRITICAL EVALUATION (8 min): Read a short strategic-proposal-style excerpt (180-200 words) building a case using advanced passive constructions. Answer 2 literal questions and 2 evaluative questions.

WRITING TASK (5 min): Write 4-5 sentences building a case for a real or invented proposal, using advanced passive constructions confidently and proportionately.

PRONUNCIATION PRACTICE (5 min): Confident, level, credible delivery for advocacy statements — steady pacing and clear stress on key evidence words.

VOCABULARY REINFORCEMENT: an advocacy-vocabulary matching game (case, claim, burden of proof, credibility, corroboration).

FORMATIVE ASSESSMENT: Instructor checks correct advanced passive formation and genuinely proportionate, credible advocacy statements during independent practice.

HOMEWORK: Choose a real or invented proposal you''d advocate for professionally, and jot down its core claim and 2-3 supporting points, ready for Lesson 8.2''s crisis-communication and panel-discussion work.

REVISION: Lesson 8.2 opens with learners briefly stating their homework proposal''s core claim.

EXTENSION: Add one sentence explicitly addressing an anticipated counter-argument using advanced passive.'),

('itm_l5_m8_lesson2', 'unt_l5_m8', 3, 'reading', 'Lesson 8.2 — Responding Under Pressure — Crisis Communication & Panel Discussion Under Challenge',
'LEARNING OBJECTIVES: (1) apply core crisis-communication principles (acknowledge, provide facts, show accountability and action, avoid speculation), (2) own a mistake or problem honestly without either over-apologising or deflecting, (3) defend a position in a panel discussion against direct, pointed challenge while staying composed, (4) write a strategic proposal that builds and defends a case.

PREREQUISITE KNOWLEDGE: Lesson 8.1 (advanced passive, advocacy register), Level IV Module 4 (advanced concession language).

WARM-UP (5 min): Your instructor presents one poorly handled crisis response and one well-handled one on the same invented scenario — what are the specific differences?

PRESENTATION (10 min): Crisis-communication principles: ACKNOWLEDGE ("We are aware of the situation") — not denying or minimising; PROVIDE FACTS ("Here is what we currently know...") — avoiding speculation; SHOW ACCOUNTABILITY AND ACTION ("We are taking the following steps...") — genuine ownership; AVOID OVER-PROMISING — commit only to what can genuinely be delivered. Panel discussion under challenge: a panellist maintains their position calmly under a direct, pointed question, using "stand by/hold one''s ground" language while still genuinely engaging with the substance of the challenge.

GUIDED PRACTICE (10 min): Practise responding to 4 crisis scenarios using the four-part crisis-communication structure, checking each response avoids speculation and genuinely commits to action.

INDEPENDENT PRACTICE (10 min): Using your Lesson 8.1 homework proposal, prepare for a panel discussion: 2-3 anticipated challenging questions and composed, substantive responses that hold your ground without becoming defensive.

SPEAKING ACTIVITY — PANEL DISCUSSION UNDER CHALLENGE: Present your proposal to a small panel (your classmates), who pose genuinely challenging questions; respond under real time pressure, staying composed and substantive. A brief crisis-communication roleplay follows, applying the four-part structure live.

CRITICAL THINKING / DISCUSSION PROMPT: "Is it always right to ''hold your ground'' when challenged, or is there a point where genuinely reconsidering your position is the more credible response? How would you tell the difference in the moment?"

LISTENING ACTIVITY (5 min): Listen to a short crisis-communication response and evaluate whether it follows the four-part structure.

READING ACTIVITY (5 min): Read a short written crisis statement and a panel-discussion exchange under challenge, identifying strong and weak moments in each.

WRITING TASK (5 min): Write a short crisis-communication statement (5-6 sentences) for an invented scenario, following the four-part structure.

PRONUNCIATION PRACTICE (5 min): Calm, steady intonation under pressure — avoiding a rising, defensive pitch or a flat, dismissive one.

VOCABULARY REINFORCEMENT: a crisis-communication vocabulary matching game (transparency, accountability, mitigation, stakeholder trust, reputational risk).

FORMATIVE ASSESSMENT: Instructor checks for genuine application of the four-part crisis structure and composed, substantive responses under panel challenge.

HOMEWORK: Finalise your strategic proposal, incorporating your panel discussion''s strongest points and responses, ready for Module 8''s assignment.

REVISION: This lesson opens with the Lesson 8.1 proposal recap. Module 8''s Quiz and Assignment draw on both lessons.

EXTENSION: Prepare a crisis-communication response to a genuinely difficult, realistic scenario of your own invention, applying all four principles under a self-imposed time constraint.'),

('itm_l5_m8_quiz', 'unt_l5_m8', 4, 'quiz', 'Module 8 Quiz — Professional Advocacy', NULL),

('itm_l5_m8_assignment', 'unt_l5_m8', 5, 'assignment', 'Module 8 Assignment — A Strategic Proposal & Crisis Response',
'INSTRUCTIONS: Complete two parts. PART A (writing, this level''s ninth genre): a strategic proposal, 400-500 words, building and defending a case for a real or invented course of action. Use advanced passive constructions confidently and proportionately (at least 3), address at least one anticipated counter-argument, and use at least 2 advocacy-emphasis discourse markers from this module. PART B (speaking): Record yourself (or perform live) two short responses: (1) a panel-discussion response to a genuinely challenging question about your proposal, holding your ground while substantively engaging with the challenge; (2) a brief crisis-communication statement (60-90 seconds) for an invented scenario, following the four-part structure.

GRADING RUBRIC: (1) Grammatical accuracy — correct advanced passive formation. (2) Vocabulary range — at least 4 distinct advocacy/crisis-communication words used correctly, plus one phrasal verb/collocation from this module. (3) Task completion — a claim, evidence, a counter-argument addressed, and advocacy markers in Part A; a substantive panel response and a complete four-part crisis statement in Part B. (4) Rhetorical effectiveness — does the proposal move a reader towards the recommended action, and would the crisis statement hold credibility under hostile reading? (5) Evidence & argument quality — is the proposal''s case genuinely proportionate to its stated evidence, and does the panel response genuinely engage with the challenge? (6) Discourse coherence & register — is the register consistently confident, formal, and credible throughout Part A, and does Part B''s delivery stay composed and substantive under simulated pressure?

A grade at or above the platform''s pass threshold marks this module complete.');

INSERT INTO quiz_questions (id, learning_item_id, sequence, prompt, choices_json, correct_index) VALUES
('qq_l5_m8_1', 'itm_l5_m8_quiz', 1, '"It ___ established that the proposed approach reduces costs significantly." (advanced passive)', '["is","was","has been","will be"]', 2),
('qq_l5_m8_2', 'itm_l5_m8_quiz', 2, '"The claim ___ supported by independent analysis."', '["is","has","was being","will"]', 0),
('qq_l5_m8_3', 'itm_l5_m8_quiz', 3, 'What distinguishes confident advocacy from overclaiming?', '["there is no difference","overclaiming always uses active voice","confident advocacy never uses passive voice","confident advocacy remains proportionate to genuine supporting evidence"]', 3),
('qq_l5_m8_4', 'itm_l5_m8_quiz', 4, 'What is the first step in effective crisis communication?', '["deny the situation","acknowledge the situation","speculate about causes","remain silent"]', 1),
('qq_l5_m8_5', 'itm_l5_m8_quiz', 5, 'Effective crisis communication should generally:', '["avoid speculation and stick to confirmed facts","speculate freely about unconfirmed details","over-promise to reassure people","deflect all responsibility"]', 0),
('qq_l5_m8_6', 'itm_l5_m8_quiz', 6, 'In British English, the legal professional who represents clients in court (especially higher courts) is typically called a:', '["solicitor","attorney","barrister","paralegal"]', 2),
('qq_l5_m8_7', 'itm_l5_m8_quiz', 7, 'Which phrase means "maintain a position firmly despite challenge"?', '["back down","hold one''s ground","own up to","get ahead of"]', 1),
('qq_l5_m8_8', 'itm_l5_m8_quiz', 8, 'Which phrase means "admit a mistake honestly"?', '["stand by","back down","hold one''s ground","own up to"]', 3),
('qq_l5_m8_9', 'itm_l5_m8_quiz', 9, '"Concerns have been raised and ___ be addressed."', '["might","could","would","must"]', 3),
('qq_l5_m8_10', 'itm_l5_m8_quiz', 10, 'Which phrase means "address a problem proactively before it escalates"?', '["back down","get ahead of","hold one''s ground","own up to"]', 1);

-- ---------------------------------------------------------------------
-- Module 9: Style & Voice
-- Full prose version: docs/curriculum/level-5/module-09-style-voice.md
-- ---------------------------------------------------------------------
INSERT INTO units (id, course_id, sequence, title) VALUES
  ('unt_l5_m9', 'crs_level_5', 9, 'Module 9: Style & Voice');

INSERT INTO learning_items (id, unit_id, sequence, kind, title, body) VALUES
('itm_l5_m9_overview', 'unt_l5_m9', 1, 'reading', 'Module Overview & Key Phrases',
'KEY PHRASES: In short,... — Put simply,... — The bottom line is... — To be precise,... — Bottom line up front:... — I''ll keep this brief.

DISCOURSE MARKERS (functional set — concision and directness): "in short", "put simply", "the bottom line is", "to be precise" — language that explicitly signals compression, essential to the executive register.

PHRASAL VERBS & COLLOCATIONS: "trim down [a document]" (remove unnecessary length), "pare back [unnecessary detail]" (reduce to its essential core), "get straight to the point", "distil [the key point]" (extract the essential meaning), "tighten up [a piece of writing]".

BrE / AmE NOTE: British English commonly uses "PA" (Personal Assistant) for the role supporting a senior executive, while American English more commonly uses "EA" (Executive Assistant) for the equivalent role.

KEY VOCABULARY: editing vocabulary (redundancy, concision, precision, clarity, register), executive-communication vocabulary (bottom line up front, executive summary, action item, key takeaway). Intercultural note: expectations around directness and brevity in executive communication vary by professional culture.'),

('itm_l5_m9_lesson1', 'unt_l5_m9', 2, 'reading', 'Lesson 9.1 — Cutting the Clutter — Editing for Concision & Precision',
'LEARNING OBJECTIVES: (1) identify and remove redundant words and phrases from your own writing, (2) replace vague or weak phrasing with precise language, (3) choose actively between active and passive voice deliberately for effect, (4) edit a piece of writing for concision while preserving its full meaning.

PREREQUISITE KNOWLEDGE: All prior levels'' register and cohesion work.

WARM-UP (5 min): Your instructor shows one wordy, cluttered sentence and its edited, concise equivalent — what was removed or changed?

PRESENTATION (10 min): "Due to the fact that there has been a significant increase in the number of customer complaints in recent months, it is something that we are going to need to think about and possibly take some sort of action on" -> "Customer complaints have risen significantly in recent months and require action." Redundancy removal, precision, and directness — but editing for concision never means cutting genuinely necessary hedges, evidence, or nuance.

GUIDED PRACTICE (10 min): Edit 8 wordy, cluttered sentences into concise, precise equivalents, checking that no genuine meaning is lost.

INDEPENDENT PRACTICE / SPEAKING ACTIVITY (10 min): Bring (or use a given) piece of your own earlier writing and edit one paragraph for concision, then compare your edited version with a partner''s edit of the same original, discussing any differences.

CRITICAL THINKING / DISCUSSION PROMPT: "Is there a risk that editing for concision can accidentally remove genuinely important nuance or hedging? How do you tell the difference between clutter and necessary complexity?"

LISTENING ACTIVITY (5 min): Listen to a wordy spoken explanation and a concise, edited version of the same content, identifying what changed.

READING ACTIVITY — EXTENDED READING & CRITICAL EVALUATION (8 min): Read a short wordy paragraph (150-180 words) and identify at least 5 specific opportunities for concision editing.

WRITING TASK (5 min): Edit the paragraph from the reading activity into a concise version, aiming to reduce its length by at least a third while preserving its full meaning.

PRONUNCIATION PRACTICE (5 min): Crisp, efficient delivery pacing — fewer filler words, more deliberate pauses at genuinely meaningful points.

VOCABULARY REINFORCEMENT: a redundant-phrase-to-concise-equivalent matching game ("due to the fact that" -> "because"; "at this point in time" -> "now"; "in the event that" -> "if").

FORMATIVE ASSESSMENT: Instructor checks that edits genuinely preserve meaning while reducing length, and that genuine hedges/nuance are correctly preserved, during independent practice.

HOMEWORK: Choose a real or invented business situation requiring a concise executive report, and jot down its core recommendation and 2-3 supporting points, ready for Lesson 9.2''s executive-briefing work.

REVISION: Lesson 9.2 opens with learners briefly stating their homework recommendation in one sentence.

EXTENSION: Edit a second paragraph from an earlier level''s own assignment work, reflecting on how your writing has changed across the programme.'),

('itm_l5_m9_lesson2', 'unt_l5_m9', 3, 'reading', 'Lesson 9.2 — Finding Your Voice — Varying Register & Tone for Audience & Purpose & the Executive Briefing',
'LEARNING OBJECTIVES: (1) deliberately vary register and tone for a specific audience and purpose while maintaining a consistent underlying voice, (2) structure information "bottom-line-up-front" for a time-constrained audience, (3) deliver an efficient executive briefing under real time pressure, (4) write a concise, action-oriented executive report.

PREREQUISITE KNOWLEDGE: Lesson 9.1 (editing for concision), Level V Module 1 (register-shifting).

WARM-UP (5 min): Your instructor delivers the same core message in two different registers but points out one consistent underlying value or priority present in both — what stayed the same despite the register shift?

PRESENTATION (10 min): The bottom-line-up-front executive report structure: RECOMMENDATION FIRST ("We recommend proceeding with X"), BRIEF SUPPORTING RATIONALE (2-3 concise points), KEY RISK OR CONSIDERATION (one, clearly flagged), NEXT STEP (a specific, actionable close). An executive briefing delivered under real time pressure — noticeably faster pacing, no preamble, immediate substance — while still recognisably reflecting the same underlying "voice."

GUIDED PRACTICE (10 min): Restructure a longer, more narrative piece of writing into bottom-line-up-front executive-report format, identifying the core recommendation to lead with.

INDEPENDENT PRACTICE (10 min): Using your Lesson 9.1 homework notes, draft a bottom-line-up-front executive report (recommendation, rationale, risk, next step) and prepare a 60-90 second spoken briefing version of the same content.

SPEAKING ACTIVITY — EXECUTIVE BRIEFING: Deliver your 60-90 second executive briefing to a partner or small group playing time-constrained senior executives, who may interrupt with one direct question requiring an immediate, concise answer.

CRITICAL THINKING / DISCUSSION PROMPT: "Do you think a person''s underlying ''voice'' — their core values, priorities, or way of reasoning — should stay recognisable across very different registers? Or should each situation call for a completely different persona?"

LISTENING ACTIVITY (5 min): Listen to an executive briefing delivered under time pressure and identify its bottom-line-up-front structure and one moment reflecting the speaker''s consistent voice.

READING ACTIVITY (5 min): Read a short written executive report and identify its four structural parts.

WRITING TASK (5 min): Finalise your executive report''s written form, checking it follows the bottom-line-up-front structure concisely.

PRONUNCIATION PRACTICE (5 min): Brisk, confident, no-preamble delivery appropriate to a time-constrained executive audience.

VOCABULARY REINFORCEMENT: an executive-communication vocabulary matching game (bottom line up front, executive summary, action item, key takeaway).

FORMATIVE ASSESSMENT: Instructor checks for a genuine bottom-line-up-front structure and efficient, substantive delivery under simulated time pressure during the briefing task.

HOMEWORK: Finalise your executive report and briefing for Module 9''s assignment.

REVISION: This lesson opens with the Lesson 9.1 recommendation recap. Module 9''s Quiz and Assignment draw on both lessons.

EXTENSION: Prepare a second, even shorter (30-second) version of your briefing for an even more time-constrained scenario.'),

('itm_l5_m9_quiz', 'unt_l5_m9', 4, 'quiz', 'Module 9 Quiz — Style & Voice', NULL),

('itm_l5_m9_assignment', 'unt_l5_m9', 5, 'assignment', 'Module 9 Assignment — An Executive Report & Briefing',
'INSTRUCTIONS: Complete two parts on one real or invented business recommendation of your choice. PART A (writing, this level''s tenth and final writing genre): an executive report, 200-300 words (deliberately concise — length itself is part of the assessment), structured bottom-line-up-front: recommendation first, brief supporting rationale, one clearly flagged risk or consideration, and a specific next step. Edit it rigorously for concision. PART B (speaking): Record yourself (or perform live) a 60-90 second executive briefing based on your report, delivered under simulated time pressure, responding concisely to at least one interrupting question.

GRADING RUBRIC: (1) Grammatical accuracy — correct, precise, edited sentence structures throughout. (2) Vocabulary range — at least 3 distinct concision/executive-communication phrases used correctly, plus one phrasal verb/collocation from this module. (3) Task completion — recommendation, rationale, risk, and next step all present and genuinely concise in Part A; a briefing with a concise response to an interruption in Part B. (4) Rhetorical effectiveness — is the report genuinely concise without sacrificing necessary meaning, and does the briefing sound efficient and authoritative under time pressure? (5) Discourse coherence & register — is the bottom-line-up-front structure genuinely followed, and is a consistent, recognisable voice maintained across both the written report and the spoken briefing?

A grade at or above the platform''s pass threshold marks this module complete.');

INSERT INTO quiz_questions (id, learning_item_id, sequence, prompt, choices_json, correct_index) VALUES
('qq_l5_m9_1', 'itm_l5_m9_quiz', 1, '"Due to the fact that..." can usually be edited down to:', '["Because","Due to","It is a fact that","On account of the fact"]', 0),
('qq_l5_m9_2', 'itm_l5_m9_quiz', 2, 'What does editing for concision NOT mean?', '["removing redundant words","replacing vague phrasing with precise language","cutting genuinely necessary hedges or nuance","tightening sentence structure"]', 2),
('qq_l5_m9_3', 'itm_l5_m9_quiz', 3, 'What is the "bottom-line-up-front" structure?', '["the conclusion comes last, after extended context","the recommendation comes first, followed by brief supporting rationale","there is no structure at all","only questions, no statements"]', 1),
('qq_l5_m9_4', 'itm_l5_m9_quiz', 4, 'What is "voice," as distinct from "register" in this module?', '["they are exactly the same thing","only how loudly someone speaks","a formal register only","a consistent underlying identity or priority that persists even as register shifts"]', 3),
('qq_l5_m9_5', 'itm_l5_m9_quiz', 5, 'An executive report''s core recommendation should typically appear:', '["at the very end","nowhere; it should be implied only","first","in a footnote"]', 2),
('qq_l5_m9_6', 'itm_l5_m9_quiz', 6, 'In British English, the common abbreviation for a role supporting a senior executive with administrative tasks is:', '["PA","EA","AA","SA"]', 0),
('qq_l5_m9_7', 'itm_l5_m9_quiz', 7, 'Which phrase means "extract the essential meaning from a larger body of information"?', '["trim down","pare back","tighten up","distil"]', 3),
('qq_l5_m9_8', 'itm_l5_m9_quiz', 8, 'Which phrase means "state the main idea immediately, without preamble"?', '["trim down","get straight to the point","pare back","tighten up"]', 1),
('qq_l5_m9_9', 'itm_l5_m9_quiz', 9, '"___, we recommend proceeding with the proposal." (a concision marker)', '["Insofar as","In short","Notwithstanding","By the same token"]', 1),
('qq_l5_m9_10', 'itm_l5_m9_quiz', 10, 'An executive briefing delivered under time pressure should generally:', '["include extensive preamble before the main point","avoid stating a recommendation","be as long as possible","begin with immediate substance and no preamble"]', 3);

-- ---------------------------------------------------------------------
-- Module 10: Review & Consolidation (Advanced-Level Mock Exam)
-- Full prose version: docs/curriculum/level-5/module-10-review-consolidation.md
-- ---------------------------------------------------------------------
INSERT INTO units (id, course_id, sequence, title) VALUES
  ('unt_l5_m10', 'crs_level_5', 10, 'Module 10: Review & Consolidation');

INSERT INTO learning_items (id, unit_id, sequence, kind, title, body) VALUES
('itm_l5_m10_revguide', 'unt_l5_m10', 1, 'reading', 'Level V Revision Guide',
'MODULE 1 — NUANCE & IDIOM: mixed conditionals; discourse markers to put it bluntly/in a nutshell/at the end of the day/for what it''s worth; deliberate register-shifting; professional documentation (writing genre 1).

MODULE 2 — ACADEMIC WRITING III: advanced ellipsis/substitution/cohesion at essay level; discourse markers the aforementioned/as noted above/collectively; thematic multi-source synthesis; the literature review (writing genre 2).

MODULE 3 — LEADERSHIP & PERSUASION: inversion for rhetorical emphasis; framing language; a leadership speech and advanced negotiation; the position paper (writing genre 3).

MODULE 4 — COMPLEX SYSTEMS (SCIENCE, ECONOMICS, POLICY): advanced chained nominalisation; hedging/qualifying language; a stakeholder meeting; the policy brief (writing genre 4).

MODULE 5 — CROSS-CULTURAL COMMUNICATION: graded politeness modality; positive/negative politeness strategies; intercultural negotiation; the analytical paper (writing genre 5).

MODULE 6 — ADVANCED MEDIA & DISCOURSE ANALYSIS: cleft sentences; combined subtext analysis; a media interview handling loaded questions; the persuasive article (writing genre 6).

MODULE 7 — RESEARCH & PRESENTATION: advanced multi-move argumentation; the flagship 6-8 minute research-informed presentation with active Q&A facilitation; the conference abstract and research essay (writing genres 7 and 8).

MODULE 8 — PROFESSIONAL ADVOCACY: advanced passive for confident case-building; the four-part crisis-communication structure; a panel discussion under genuine challenge; the strategic proposal (writing genre 9).

MODULE 9 — STYLE & VOICE: rigorous concision editing; bottom-line-up-front structure; an executive briefing under time pressure; the executive report (writing genre 10, capstone).

STRUCTURAL THREAD ACROSS THE LEVEL: Level V moved learners from precision of language through precision of persuasion, precision across cultures and contexts, precision under scrutiny, to precision of voice — a deliberately WEC-authored intellectual arc, moving learners from language competence into genuine intellectual communication. Module 10 tests all of it together, in authentic, integrated performance.

THE TEN ADVANCED WRITING GENRES: professional documentation (M1), a literature review (M2), a position paper (M3), a policy brief (M4), an analytical paper (M5), a persuasive article (M6), a conference abstract and a research essay (M7), a strategic proposal (M8), and an executive report (M9, capstone).

CUMULATIVE DISCOURSE-MARKER TOOLKIT: idiomatic hedging/framing (to put it bluntly, in a nutshell, at the end of the day, for what it''s worth); essay-level cohesion (the aforementioned, as noted above, collectively); reframing (this isn''t just about X, it''s about Y, what''s really at stake here is); hedging/qualifying (it could be argued that, to some extent, broadly speaking); graded indirectness (would it be possible to, I wonder if you might, I don''t suppose you could); revealing subtext (what emerges from this is, beneath the surface, on the surface... but in reality); complex argument structuring (insofar as, notwithstanding, by the same token, conversely, that said); advocacy emphasis (the evidence clearly shows, it is well established that, crucially); concision and directness (in short, put simply, the bottom line is).

CUMULATIVE BrE/AmE REFERENCE: at a loose end/at loose ends (M1); -ise/-ize (M2); Plc/Corp. Inc. (M3); billion, long scale/short scale (M4); cheers meaning thank you (M5); newsreader/news anchor (M6); postgraduate/graduate (M7); barrister-solicitor/lawyer-attorney (M8); PA/EA (M9).'),

('itm_l5_m10_revlesson', 'unt_l5_m10', 2, 'reading', 'Revision Lesson — Structured Consolidation Activities',
'LEARNING OBJECTIVES: (1) correctly select the right grammar structure and rhetorical device from Modules 1-9 given a real professional or academic context, (2) deploy at least 8 discourse markers from across the level''s functional sets fluently, (3) correctly identify at least 8 BrE/AmE differences from across the level, (4) self-identify at least one personal area for further refinement before the mock exam.

PREREQUISITE KNOWLEDGE: All of Modules 1-9.

WARM-UP (5 min): "Grammar auction" — bid points on whether 8 example sentences (each drawn from a different module) are grammatically correct or incorrect.

PRESENTATION/CONSOLIDATION (15 min): A genre-and-device selection drill: real-life prompts, each requiring a different module''s grammar and rhetorical toolkit ("Emphasise a key point in a persuasive article" -> Module 6 cleft sentences or Module 3 inversion; "Qualify a claim in a policy brief" -> Module 4; "Structure a complex, multi-move argument" -> Module 7; "Respond to a challenge under pressure" -> Module 8).

GUIDED PRACTICE (15 min): Rotate through 4 stations, each reviewing 2-3 modules'' target language, with a final "Deliver a 90-second executive briefing" station recycling Module 9''s capstone skill on a new, simple topic.

INDEPENDENT PRACTICE (10 min): Complete a self-assessment checklist (one line per module: "I can... check/needs practice") and circle your two weakest areas.

SPEAKING ACTIVITY: The structure-selection drill and station rotation above are both fundamentally speaking-driven.

CRITICAL THINKING / DISCUSSION PROMPT: "Across this whole level, which shift do you think mattered most — moving from correct grammar to persuasive rhetoric, or moving from analysis to genuine critical evaluation? Why?"

LISTENING ACTIVITY (5 min): Listen to a single extended talk (someone building a case, qualifying claims, and handling a challenging question).

READING ACTIVITY (5 min): Read a similarly cumulative, sophisticated short text and answer mixed comprehension and critical-evaluation questions spanning several grammar points and at least one BrE/AmE vocabulary item.

WRITING TASK (5 min): Write one well-structured paragraph that uses at least 4 different grammar/rhetorical points from across the level and at least 2 cohesion devices.

PRONUNCIATION PRACTICE (5 min): Rapid-fire review drill of the level''s key pronunciation points: mixed-conditional contractions, inversion/cleft-sentence stress, hedged-claim intonation, and confident, no-preamble executive delivery.

VOCABULARY REINFORCEMENT: a cumulative discourse-marker and phrasal-verb relay game covering all 9 modules'' functional-language sets, including a dedicated BrE/AmE matching round.

FORMATIVE ASSESSMENT: The self-assessment checklist above, reviewed individually with the instructor if time allows.

HOMEWORK: Revise your self-identified weak areas using the module you struggled with most.

REVISION: This entire lesson is revision by design.

EXTENSION: Stronger learners help peers at weaker stations during the rotation activity.'),

('itm_l5_m10_examquiz', 'unt_l5_m10', 3, 'quiz', 'Advanced-Level Mock Exam — Grammar & Vocabulary', NULL),

('itm_l5_m10_examassignment', 'unt_l5_m10', 4, 'assignment', 'Advanced-Level Mock Exam — Speaking & Writing',
'This is your Level V final assessment. Complete both parts.

PART A — SPEAKING: A PRESENTATION/NEGOTIATION SIMULATION (6-8 minutes, recorded or live with your instructor): Deliver a structured presentation or negotiation simulation on a topic of your choice, drawing on the level''s cumulative skills: a clearly signposted structure with at least one inversion or cleft sentence for emphasis (Modules 3/6); at least one instance of well-calibrated hedging (Module 4); at least one moment of graded, appropriate politeness or diplomatic framing (Module 5); a response to at least one genuinely challenging or loaded question, handled strategically (Modules 6/8); and a composed close. If choosing a negotiation simulation, reach (or honestly fail to reach) a concrete outcome with a simulated counterpart.

PART B — WRITING: A FULL RUBRIC-GRADED EXTENDED PIECE (600-700 words): Write an extended piece in one of this level''s ten genres (your choice, or a hybrid where genuinely appropriate) that demonstrates the level''s cumulative writing skills. Include: a clear, sophisticated thesis or recommendation; at least one instance of advanced nominalisation or advanced passive (Modules 4/8); at least 2 connectors from Module 7''s complex-argumentation set; at least one cleft sentence or inverted sentence for emphasis; genuine synthesis or evidence-based reasoning; and a rigorously edited, concise final section.

GRADING RUBRIC (weighted toward listening and speaking per the Advanced-level assessment strategy): (1) Grammatical range and accuracy — correct, varied use of the level''s grammar and rhetorical devices across both parts. (2) Vocabulary range — discourse markers and phrasal verbs/collocations drawn from at least 6 of the 9 modules across both parts combined. (3) Task completion — every required element present in both Part A and Part B. (4) Fluency and delivery (Part A) — reasonably fluent and spontaneous for C1, able to sustain an extended formal turn and respond composedly and substantively to challenge. (5) Coherence (Part B) — the piece reads as one connected, sophisticated, logically structured whole. (6) Evidence & argument quality — is the thesis/recommendation genuinely well-supported, and does the piece address the strongest version of the topic? (7) Rhetorical effectiveness — do the rhetorical devices used genuinely strengthen the piece''s persuasive or communicative impact? (8) Discourse coherence & register — is the register appropriately sophisticated and consistent throughout?

PROGRESSION REQUIREMENT: A grade at or above the platform''s pass threshold on this comprehensive assessment marks Level V as complete for the learner and, for a full-programme student, triggers Level VI''s enrolment to unlock automatically.');

INSERT INTO quiz_questions (id, learning_item_id, sequence, prompt, choices_json, correct_index) VALUES
('qq_l5_m10_1', 'itm_l5_m10_examquiz', 1, '(M1) "If I ___ medicine, I''d be a doctor now." (past condition, present result)', '["studied","have studied","study","had studied"]', 3),
('qq_l5_m10_2', 'itm_l5_m10_examquiz', 2, '(M1) In British English, having nothing to do is described as being:', '["at loose ends","at a loose end","at a loose end''s","at loose end"]', 1),
('qq_l5_m10_3', 'itm_l5_m10_examquiz', 3, '(M2) What is the defining structural feature of a literature review, as opposed to a source-by-source report?', '["it is organised thematically, not source-by-source","it only uses one source","it never cites sources","it is always written in the first person"]', 0),
('qq_l5_m10_4', 'itm_l5_m10_examquiz', 4, '(M2) In American English, the spelling suffix used exclusively is:', '["-ise","-yse","-ize","-isze"]', 2),
('qq_l5_m10_5', 'itm_l5_m10_examquiz', 5, '(M3) "Rarely ___ such dedication." (inversion)', '["I have seen","have I seen","I seen","did I saw"]', 1),
('qq_l5_m10_6', 'itm_l5_m10_examquiz', 6, '(M3) "This isn''t just about budget — it''s about whether we''re serious about growth." This is an example of:', '["inversion","a citation","a mixed conditional","framing language"]', 3),
('qq_l5_m10_7', 'itm_l5_m10_examquiz', 7, '(M4) "It ___ be argued that this policy addresses the core issue, though its effectiveness may vary."', '["will","must","could","can''t"]', 2),
('qq_l5_m10_8', 'itm_l5_m10_examquiz', 8, '(M4) What is a genuine risk of overusing nominalisation?', '["text can become technically correct but hard to parse","sentences become too short","it is always grammatically incorrect","it makes writing too informal"]', 0),
('qq_l5_m10_9', 'itm_l5_m10_examquiz', 9, '(M5) Which is the most indirect, highly deferential request?', '["I don''t suppose you could close the window, could you?","Close the window.","Could you close the window?","Window, please."]', 0),
('qq_l5_m10_10', 'itm_l5_m10_examquiz', 10, '(M5) Which best describes "positive politeness"?', '["respecting autonomy and minimising imposition","using only formal language","emphasising shared interests and inclusion","avoiding all requests"]', 2),
('qq_l5_m10_11', 'itm_l5_m10_examquiz', 11, '(M6) "It was the new policy ___ caused the backlash." (it-cleft)', '["who","which is","what","that"]', 3),
('qq_l5_m10_12', 'itm_l5_m10_examquiz', 12, '(M6) A loaded interview question is one that:', '["is completely neutral","carries an embedded assumption or bias within the question itself","is always illegal to ask","has only one possible answer"]', 1),
('qq_l5_m10_13', 'itm_l5_m10_examquiz', 13, '(M7) "___ remote work increases flexibility, it benefits most employees." (to the extent that)', '["Notwithstanding","Conversely","Insofar as","That said"]', 2),
('qq_l5_m10_14', 'itm_l5_m10_examquiz', 14, '(M7) What does active Q&A facilitation include, beyond simply answering questions?', '["inviting questions and synthesising across them","ignoring all questions","refusing to take more than one question","reading directly from notes only"]', 0),
('qq_l5_m10_15', 'itm_l5_m10_examquiz', 15, '(M8) "It ___ established that the proposed approach reduces costs significantly." (advanced passive)', '["is","has been","was","will be"]', 1),
('qq_l5_m10_16', 'itm_l5_m10_examquiz', 16, '(M8) What is the first step in effective crisis communication?', '["deny the situation","speculate about causes","remain silent","acknowledge the situation"]', 3),
('qq_l5_m10_17', 'itm_l5_m10_examquiz', 17, '(M9) "Due to the fact that..." can usually be edited down to:', '["Due to","It is a fact that","On account of the fact","Because"]', 3),
('qq_l5_m10_18', 'itm_l5_m10_examquiz', 18, '(M9) What is the "bottom-line-up-front" structure?', '["the conclusion comes last, after extended context","the recommendation comes first, followed by brief supporting rationale","there is no structure at all","only questions, no statements"]', 1),
('qq_l5_m10_19', 'itm_l5_m10_examquiz', 19, '(Cumulative discourse markers) Which discourse marker signals a pivot, acknowledging a prior point before adding a qualification?', '["that said","insofar as","crucially","beneath the surface"]', 0),
('qq_l5_m10_20', 'itm_l5_m10_examquiz', 20, '(Cumulative BrE/AmE) In British English, the legal professional who represents clients in court is typically called a:', '["solicitor","attorney","barrister","paralegal"]', 2);
